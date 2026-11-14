import { list, t, tr } from "../i18n";
import { isMapOut } from "./acts";
import { getArmouryDepth } from "./armoury";
import { CASKET_GEAR, itemName } from "./items";
import { MAP_BY_ID } from "./maps";
import { PASSIVES, passiveDescription, passiveName } from "./passives";
import { PET_BY_ID } from "./pets";
import { RARITY_ORDER, Rarity, rarityName } from "./rarity";
import { formatStats } from "./stats";
import { CARDS_ICON_OBJ } from "./titleIcons";
import { TROPHIES, TrophyDef, trophyName } from "./trophies";
import type { GearDef, PassiveDef, WeaponDef } from "./types";
import { WEAPONS, getWeapon, weaponDescription, weaponName } from "./weapons";

// Cards: a card for each weapon, passive, reward casket gear and Collection log trophy the game
// already has, with that thing's cache item as its picture. Packs are bought with the platinum tokens
// runs earn and opened on the Cards screen (core/cards.ts, ui/CardsScreen.tsx). They only touch a run that's Card collection
// only (core/cardRuns.ts). No real money is ever involved: platinum tokens are only earned by playing.

export type CardKind = "weapon" | "passive" | "gear" | "trophy";

export type CardDef = {
    // "<kind>:<the weapon's, passive's or trophy's id>". It's kept in SaveData.cards, so it's as
    // fixed as the ids it's made from.
    id: string;
    kind: CardKind;
    // Its own rarity, the commonest version it comes in (cardVersions)
    rarity: Rarity;
    // The picture: the item's icon, or an interface sprite in its place (Piety's)
    objId: number;
    spriteId?: number;
    // The map it comes from, when it isn't in from the start: its card's only out once the map is
    mapId?: string;
    name(): string;
    text(): string;
};

// Cards in each pack
export const PACK_SIZE = 5;

// Platinum tokens: what packs are bought with, apart from the coins (SaveData.platinum). A run
// earns them from its own play (Sim.platinum, RunResult.platinum), each scaled as the run's
// coins are (Sim.coinScale: less in endless runs, ENDLESS_COINS and less again in their later
// rounds, and more on hard mode and with invocations), so an endless run left to play itself can't pile them up.
export const PLATINUM_PER_KILL = 0.01;
export const PLATINUM_PER_BOSS = 5;
export const PLATINUM_WIN = 25;
// The most a save holds: a crafted save's number stops here
export const MAX_PLATINUM = 1_000_000;
// Packs a save starts with, free, once: every save, old ones too, until SaveData.cardPacks is set
export const STARTER_PACKS = 1;
// The most a save holds, of packs and of copies of a card: a crafted save's numbers stop here
export const MAX_CARD_PACKS = 999;
export const MAX_CARD_COPIES = 9999;

// Versions: every card comes in a version for each rarity from its own up to Very rare (`rarity`
// is its own, the commonest it comes in). A weapon's and a passive's own rarity is the game's
// (WeaponDef.rarity, PassiveDef.rarity: so an evolution's only Very rare); a trophy's goes by how
// hard it is to find. A version is the quality its item can
// be offered at in a Card collection only run (core/cardRuns.ts), so a player only gets a Rare
// sword there once they've the Rare version of its card or better.
export function cardVersions(card: CardDef): Rarity[] {
    return RARITY_ORDER.slice(RARITY_ORDER.indexOf(card.rarity));
}

// A version's key in SaveData.cards: the card's id for its own rarity (as saves have always kept
// it), "<id>@<rarity>" for the rarer ones
export function versionKey(card: CardDef, rarity: Rarity): string {
    return rarity === card.rarity ? card.id : `${card.id}@${rarity}`;
}

// The card and version a saved key is, or undefined for one that isn't a version of any card
export function parseVersionKey(key: string): { card: CardDef; rarity: Rarity } | undefined {
    const [id, rarity, extra] = key.split("@");
    const card = CARD_BY_ID.get(id);
    if (!card || extra !== undefined) {
        return undefined;
    }
    if (rarity === undefined) {
        return { card, rarity: card.rarity };
    }
    const version = RARITY_ORDER.find((r) => r === rarity);
    return version && version !== card.rarity && cardVersions(card).includes(version)
        ? { card, rarity: version }
        : undefined;
}

function trophyRarity(trophy: TrophyDef): Rarity {
    if (PET_BY_ID.has(trophy.id)) return "veryRare";
    const from = trophy.from;
    if (from.kind === "raid" || from.kind === "tombs") return "rare";
    // A drop at 1 in 100 or rarer (a kill's, a pumpkin's, a turkey's)
    if ("chance" in from && from.chance !== undefined && from.chance <= 1 / 100) return "rare";
    return "uncommon";
}

function trophyMap(trophy: TrophyDef): string | undefined {
    const from = trophy.from;
    if (from.kind === "pumpkin") return "halloween";
    if (from.kind === "turkey") return "thanksgiving";
    if (from.kind === "tombs") return "tombs_of_amascut";
    return from.mapId;
}

function weaponCard(weapon: WeaponDef): CardDef {
    return {
        id: `weapon:${weapon.id}`,
        kind: "weapon",
        rarity: weapon.rarity,
        objId: weapon.iconObjId,
        mapId: weapon.unlock?.mapId,
        name: () => weaponName(weapon),
        text: () => weaponDescription(weapon),
    };
}

function passiveCard(passive: PassiveDef): CardDef {
    return {
        id: `passive:${passive.id}`,
        kind: "passive",
        rarity: passive.rarity,
        objId: passive.iconObjId,
        spriteId: passive.iconSpriteId,
        mapId: passive.unlock?.mapId,
        name: () => passiveName(passive),
        text: () => passiveDescription(passive),
    };
}

// Reward caskets' gear (CASKET_GEAR, not the Armoury's variants of it): its stats are its text
function gearCard(gear: GearDef): CardDef {
    return {
        id: `gear:${gear.id}`,
        kind: "gear",
        rarity: gear.rarity,
        objId: gear.objId,
        mapId: gear.unlock?.mapId,
        name: () => itemName(gear),
        text: () => `${list(formatStats(gear.stats).map((line) => line.text))}.`,
    };
}

function trophyCard(trophy: TrophyDef): CardDef {
    return {
        id: `trophy:${trophy.id}`,
        kind: "trophy",
        rarity: trophyRarity(trophy),
        objId: trophy.objId,
        mapId: trophyMap(trophy),
        name: () => trophyName(trophy),
        text: () => tr(`trophy.${trophy.id}.how`, trophy.how),
    };
}

// Every card there is, out or not: a save keeps the ones it has (migrateSave), so a card from a
// map that isn't out yet isn't dropped from a tester's save
export const ALL_CARDS: CardDef[] = [
    ...WEAPONS.map(weaponCard),
    ...PASSIVES.map(passiveCard),
    ...CASKET_GEAR.map(gearCard),
    ...TROPHIES.map(trophyCard),
];

export const CARD_BY_ID: Map<string, CardDef> = new Map(ALL_CARDS.map((c) => [c.id, c]));

// Whether a card's in the game: not one from a map that isn't out (isMapOut)
export function isCardOut(card: CardDef): boolean {
    const map = card.mapId === undefined ? undefined : MAP_BY_ID.get(card.mapId);
    return !map || isMapOut(map);
}

// The cards a pack can give and the album lists, in the album's order
export const CARDS: CardDef[] = ALL_CARDS.filter(isCardOut);

export const CARD_KINDS: CardKind[] = ["weapon", "passive", "gear", "trophy"];

// A card's number in the set, as its footer shows it ("12/148"): its place in the album
const CARD_NUMBERS = new Map(CARDS.map((card, i) => [card.id, i + 1]));

export function cardNumber(card: CardDef): string {
    return `${CARD_NUMBERS.get(card.id) ?? "?"}/${CARDS.length}`;
}

// The first sentence of a card's text, for a small card's one short line
export function cardLine(card: CardDef): string {
    const text = card.text();
    const end = text.search(/[.!?](\s|$)/);
    return end < 0 ? text : text.slice(0, end + 1);
}

// A kind's tab ("Weapons"), and what a card of it says it is ("Weapon")
export function cardKindName(kind: CardKind): string {
    return t(`cards.kind.${kind}`);
}

export function cardTypeName(kind: CardKind): string {
    return t(`cards.type.${kind}`);
}

export function cardRarityName(rarity: Rarity): string {
    return rarityName(rarity);
}

// The Card shop's packs. Each holds PACK_SIZE cards of its own pool (`holds`), each card rolling a
// version's rarity by its odds and then a card of the pool that comes in that version; its last
// card, in a pack with odds for three rarities or more, rolls only those above the lowest, so the
// pack has something better than its commonest (core/cards.ts, lastCardRarities). Prices are in
// the coins runs pay out, spent as the Armoury and the Wardrobe spend them.
export type PackDef = {
    id: string;
    name: string;
    // What it holds, for the shop
    description: string;
    // The item on its front, and its wrapper's colour
    objId: number;
    color: string;
    price: number;
    odds: Record<Rarity, number>;
    holds: (card: CardDef) => boolean;
    // How much likelier its Rare and Very rare cards are than in a basic pack (the Champion's)
    rarer?: number;
};

// The packs' knobs, in one place. A pack only ever holds cards of what the player has unlocked
// (core/cards.ts, isCardUnlocked), so the best things are rare first by being far into the game.
// Then a card's picked by its weight: its item's rarity's (CARD_ITEM_WEIGHTS) times its tier's
// (CARD_TIER_FACTORS), times a pack's `rarer` for Rare and Very rare ones. Then its version's
// rolled by the pack's odds (PackDef.odds, below), no commoner than the card's own rarity.
export const CARD_ITEM_WEIGHTS: Record<Rarity, number> = {
    common: 10,
    uncommon: 4,
    rare: 1,
    veryRare: 0.25,
};

// A card's tier is how strong its item is, 0 to 3 (cardTier): the factor its weight's multiplied
// by, so of two Very rare things the stronger is the rarer pull
export const CARD_TIER_FACTORS: readonly number[] = [1, 0.8, 0.5, 0.25];

// The strongest things in the game, top tier whatever the rules below say
export const CARD_TOP_ITEMS: ReadonlySet<string> = new Set([
    "weapon:harmonised_nightmare_staff",
    "weapon:keris_partisan_of_the_sun",
    "weapon:keris_partisan_of_amascut",
    "weapon:scythe_of_vitur",
    "weapon:twisted_bow",
    "weapon:tumekens_shadow",
    "gear:infernal_cape",
    "gear:avas_assembler",
    "gear:venator_ring",
    "gear:armadyl_chestplate",
]);

// How strong a card's item is, 0 to 3, for its weight (CARD_TIER_FACTORS):
// - gear: how far up its Armoury line it is (content/armoury.ts: a Fire cape 1, an Infernal cape 2)
// - weapons: 3 for an evolution or a raid's or a boss fight's (behind a raid chest or a fight), 2
//   for a boss's (a kill), 1 for any other map's, 0 for one there from the start
// - passives: 1 for one a map brings in, 0 for the rest
// - trophies: 0, their rarity says it all
// and CARD_TOP_ITEMS 3, whatever those say
export function cardTier(card: CardDef): number {
    if (CARD_TOP_ITEMS.has(card.id)) {
        return 3;
    }
    const id = card.id.slice(card.id.indexOf(":") + 1);
    if (card.kind === "gear") {
        return Math.min(getArmouryDepth(id), 3);
    }
    if (card.kind === "weapon") {
        const weapon = getWeapon(id);
        const unlock = weapon.unlock;
        const map = unlock && MAP_BY_ID.get(unlock.mapId);
        if (weapon.evolved || unlock?.kind === "raidChest" || map?.raid || map?.fight) {
            return 3;
        }
        return unlock?.kind === "killBoss" ? 2 : unlock ? 1 : 0;
    }
    if (card.kind === "passive") {
        return card.mapId !== undefined ? 1 : 0;
    }
    return 0;
}

// How likely a card is to be picked for a pack, against the rest of its pool (see above)
export function cardWeight(pack: PackDef, card: CardDef): number {
    const rare = card.rarity === "rare" || card.rarity === "veryRare";
    return (
        CARD_ITEM_WEIGHTS[card.rarity] *
        CARD_TIER_FACTORS[cardTier(card)] *
        (rare ? (pack.rarer ?? 1) : 1)
    );
}

// The share of a pack's cards that are each rarity of thing, for the shop to say, of its pool
// (the player's own, core/cards.ts packPool)
export function packRarityShares(
    pack: PackDef,
    pool: readonly CardDef[] = packCards(pack),
): Record<Rarity, number> {
    const total = pool.reduce((sum, card) => sum + cardWeight(pack, card), 0);
    const shares: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, veryRare: 0 };
    for (const card of total > 0 ? pool : []) {
        shares[card.rarity] += cardWeight(pack, card) / total;
    }
    return shares;
}

const STANDARD_ODDS: Record<Rarity, number> = {
    common: 0.45,
    uncommon: 0.35,
    rare: 0.16,
    veryRare: 0.04,
};

// The raids' maps, for their pack
const RAID_PACK_MAPS = ["theatre_of_blood", "tombs_of_amascut"];

function iconOf(cardId: string): number {
    const card = CARD_BY_ID.get(cardId);
    if (!card) {
        throw new Error("No card " + cardId);
    }
    return card.objId;
}

export const PACKS: PackDef[] = [
    {
        id: "adventurer",
        name: "Adventurer's pack",
        description: "Any weapon, passive or trophy card.",
        objId: iconOf("weapon:scimitar"),
        color: "#7a5a2e",
        price: 100,
        odds: STANDARD_ODDS,
        // Every card but gear, which only the Treasure trail pack holds
        holds: (card) => card.kind !== "gear",
    },
    {
        id: "weapons",
        name: "Armoury pack",
        description: "Weapons only.",
        objId: iconOf("weapon:dark_bow"),
        color: "#55606c",
        price: 120,
        odds: STANDARD_ODDS,
        holds: (card) => card.kind === "weapon",
    },
    {
        id: "passives",
        name: "Prayer book pack",
        description: "Passives only: prayers, worn passives and spells.",
        objId: iconOf("passive:amulet_of_glory"),
        color: "#3d5a80",
        price: 120,
        odds: STANDARD_ODDS,
        holds: (card) => card.kind === "passive",
    },
    {
        id: "gear",
        name: "Treasure trail pack",
        description: "Reward casket gear only.",
        objId: CASKET_GEAR.find((gear) => gear.id === "rune_full_helm")!.objId,
        color: "#5a4a7a",
        price: 120,
        odds: STANDARD_ODDS,
        holds: (card) => card.kind === "gear",
    },
    {
        id: "trophies",
        name: "Collector's pack",
        description: "Collection log trophies and pets only.",
        objId: iconOf("trophy:jar_of_dreams"),
        color: "#8a6a1e",
        price: 120,
        odds: { common: 0, uncommon: 0.55, rare: 0.35, veryRare: 0.1 },
        holds: (card) => card.kind === "trophy",
    },
    {
        id: "raids",
        name: "Raider's pack",
        description: "Only what the Theatre of Blood and the Tombs of Amascut bring.",
        objId: iconOf("weapon:scythe_of_vitur"),
        color: "#7a2420",
        price: 200,
        odds: { common: 0, uncommon: 0, rare: 0.75, veryRare: 0.25 },
        holds: (card) => card.mapId !== undefined && RAID_PACK_MAPS.includes(card.mapId),
    },
    {
        id: "champion",
        name: "Champion's pack",
        description: "Any weapon, passive or trophy card, likelier to be rare.",
        objId: CARDS_ICON_OBJ,
        color: "#2f5e3e",
        price: 300,
        // More Rare and Very rare than a basic pack, in its things and in its versions
        odds: { common: 0.25, uncommon: 0.35, rare: 0.32, veryRare: 0.08 },
        rarer: 1.6,
        // Every card but gear, which only the Treasure trail pack holds
        holds: (card) => card.kind !== "gear",
    },
];

export const PACK_BY_ID: Map<string, PackDef> = new Map(PACKS.map((p) => [p.id, p]));

// The starter pack, and any pack a save holds unopened, is this one
export const BASIC_PACK = PACKS[0];

export function packName(pack: PackDef): string {
    return tr(`cards.pack.${pack.id}.name`, pack.name);
}

export function packDescription(pack: PackDef): string {
    return tr(`cards.pack.${pack.id}.desc`, pack.description);
}

// A pack's pool: the cards in the game it can give, unlocked or not (a player's own is
// core/cards.ts packPool)
export function packCards(pack: PackDef): CardDef[] {
    return CARDS.filter(pack.holds);
}
