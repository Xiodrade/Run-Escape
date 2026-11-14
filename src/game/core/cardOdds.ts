import { CardDef, PACK_SIZE, PackDef, cardWeight } from "../content/cards";
import { RARITY_ORDER, Rarity, atLeast } from "../content/rarity";
import { LOCKABLE_ITEM_BY_ID } from "../content/unlocks";
import { WEAPONS } from "../content/weapons";
import { lastCardRarities, packRoller } from "./cards";

// A pack's odds for one player (the Card shop's preview): how often each card of their pool turns
// up, and how its cards' item rarities and versions come out. Worked out by opening
// PREVIEW_PACKS packs of it, rolled as a bought one is (packRoller), on a seeded generator, so
// the same save always gets the same figures; exactPackOdds has the figures they come close to.

export const PREVIEW_PACKS = 100_000;

export type PackOdds = {
    packs: number;
    // Card id -> the share of packs it's in, at least once
    perCard: Map<string, number>;
    // The share of cards whose item is each rarity, and whose version is
    items: Record<Rarity, number>;
    versions: Record<Rarity, number>;
    // The share of packs with at least one Very rare item
    veryRarePack: number;
};

const none = (): Record<Rarity, number> => ({ common: 0, uncommon: 0, rare: 0, veryRare: 0 });

// Mulberry32: small and seeded, for the preview's packs (never a run's, which has its own Rng)
function seeded(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A string's hash, for the seed: the same pack and pool, the same figures
function hash(text: string): number {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    }
    return h >>> 0;
}

// What the odds depend on: the pack and the cards in its pool (the save's unlocks)
export function packOddsKey(pack: PackDef, pool: readonly CardDef[]): string {
    return `${pack.id}|${pool.map((card) => card.id).join(",")}`;
}

// Opens a pack's packs a chunk at a time, so a phone's page never stalls on all of them at once:
// step(n) opens n more, done says when PREVIEW_PACKS (or `packs`) are, result() gives the odds
export function simulatePackOdds(
    pack: PackDef,
    pool: readonly CardDef[],
    packs = PREVIEW_PACKS,
): { step(n: number): void; readonly done: boolean; result(): PackOdds } {
    const roll = packRoller(pack, pool);
    const random = seeded(hash(packOddsKey(pack, pool)));
    const hits = new Map<string, number>();
    const items = none();
    const versions = none();
    let veryRare = 0;
    let opened = 0;
    const seen = new Set<string>();
    return {
        step(n) {
            for (let i = 0; i < n && opened < packs && pool.length > 0; i++, opened++) {
                seen.clear();
                let hasVeryRare = false;
                for (const { card, rarity } of roll(random)) {
                    items[card.rarity]++;
                    versions[rarity]++;
                    hasVeryRare ||= card.rarity === "veryRare";
                    if (!seen.has(card.id)) {
                        seen.add(card.id);
                        hits.set(card.id, (hits.get(card.id) ?? 0) + 1);
                    }
                }
                if (hasVeryRare) {
                    veryRare++;
                }
            }
        },
        get done() {
            return opened >= packs || pool.length === 0;
        },
        result() {
            const cards = Math.max(opened * PACK_SIZE, 1);
            const share = (counts: Record<Rarity, number>) => {
                const out = none();
                for (const rarity of RARITY_ORDER) {
                    out[rarity] = counts[rarity] / cards;
                }
                return out;
            };
            return {
                packs: opened,
                perCard: new Map(
                    pool.map((card) => [card.id, (hits.get(card.id) ?? 0) / Math.max(opened, 1)]),
                ),
                items: share(items),
                versions: share(versions),
                veryRarePack: veryRare / Math.max(opened, 1),
            };
        },
    };
}

// The same odds worked out exactly, which the simulated ones come close to (a test checks)
export function exactPackOdds(pack: PackDef, pool: readonly CardDef[]): PackOdds {
    const total = pool.reduce((sum, card) => sum + cardWeight(pack, card), 0);
    const chance = (card: CardDef) => (total > 0 ? cardWeight(pack, card) / total : 0);
    const items = none();
    for (const card of pool) {
        items[card.rarity] += chance(card);
    }
    const versions = none();
    for (let i = 0; i < PACK_SIZE; i++) {
        const rolls = i === PACK_SIZE - 1 ? lastCardRarities(pack.odds) : RARITY_ORDER;
        const rolled = rolls.filter((r) => pack.odds[r] > 0);
        const sum = rolled.reduce((s, r) => s + pack.odds[r], 0);
        for (const card of pool) {
            for (const r of rolled) {
                versions[atLeast(r, card.rarity)] +=
                    (chance(card) * pack.odds[r]) / sum / PACK_SIZE;
            }
        }
    }
    return {
        packs: Infinity,
        perCard: new Map(pool.map((card) => [card.id, 1 - (1 - chance(card)) ** PACK_SIZE])),
        items,
        versions,
        veryRarePack: 1 - (1 - items.veryRare) ** PACK_SIZE,
    };
}

// A player's pack odds, simulated once for their pool and kept till it changes
const cache = new Map<string, PackOdds>();

export function getCachedPackOdds(pack: PackDef, pool: readonly CardDef[]): PackOdds | undefined {
    return cache.get(packOddsKey(pack, pool));
}

export function cachePackOdds(pack: PackDef, pool: readonly CardDef[], odds: PackOdds): void {
    cache.set(packOddsKey(pack, pool), odds);
}

// The map whose task unlocks a locked card's thing, for the preview's "Unlock in" (the game's own
// unlock data: a weapon's, passive's or gear's task, an evolution's from what it evolves from, a
// trophy's map), or undefined for one there from the start
export function cardUnlockMap(card: CardDef): string | undefined {
    const id = card.id.slice(card.id.indexOf(":") + 1);
    if (card.kind === "trophy") {
        return card.mapId;
    }
    const own = LOCKABLE_ITEM_BY_ID.get(id)?.unlock.mapId;
    if (own !== undefined || card.kind !== "weapon") {
        return own;
    }
    // An evolution: what it evolves from that a map brings in
    const from = WEAPONS.find((w) => w.evolution?.into === id && w.unlock);
    return from?.unlock?.mapId;
}
