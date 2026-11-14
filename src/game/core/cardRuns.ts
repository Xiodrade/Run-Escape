import { ALL_CARDS, CARDS, CARD_BY_ID, CardDef } from "../content/cards";
import { getCharacter } from "../content/characters";
import { PASSIVES } from "../content/passives";
import { PET_BY_ID } from "../content/pets";
import { RARITY_ORDER, Rarity } from "../content/rarity";
import { isAvailable } from "../content/unlocks";
import { WEAPONS, getWeapon } from "../content/weapons";
import { CardCaps, isOfferable } from "./Upgrades";
import { getBestVersion } from "./cards";
import type { SaveData } from "./save";

// Card collection only runs (SaveData.cardsOnly): level ups offer only the weapons and passives
// the player owns a card of, no rarer than the rarest version owned (Upgrades.CardCaps), and
// reward caskets only gear with a card (Loot.rollCasketItem). The caps
// are worked out from the save when the run starts and go into the run's setup (SimOptions.cardCaps,
// or each co-op player's loadout), so the run plays the same on every copy of it and from the same
// seed. An item still has to be in the game for them too (isAvailable): a card never brings in
// what a map task hasn't.

// What a run needs at least, so a level up always has something to offer: the adventurer's
// starting weapon's card, and cards of this many more weapons and passives they could be offered
export const CARD_RUN_WEAPONS = 2;
export const CARD_RUN_PASSIVES = 3;

// A save's caps: each weapon, passive and gear card owned -> its rarest version owned, and each
// pet's card (a trophy's that's a pet: which pets a Card collection only run can take along)
export function getCardCaps(save: SaveData): Map<string, Rarity> {
    const caps = new Map<string, Rarity>();
    for (const card of CARDS) {
        if (card.kind !== "trophy" || isPetCard(card)) {
            const best = getBestVersion(save, card);
            if (best) {
                caps.set(card.id, best);
            }
        }
    }
    return caps;
}

// What a save's collection is short of to fill a level up, for a run as this adventurer: cards of
// CARD_RUN_WEAPONS more weapons and CARD_RUN_PASSIVES passives they could be offered, besides
// their starting weapon. Undefined when it can. Items count, not versions: any version will do.
export type CardRunShortfall = { weapons: number; passives: number };

export function getCardRunShortfall(
    save: SaveData,
    characterId: string,
    caps: CardCaps = getCardCaps(save),
): CardRunShortfall | undefined {
    const needs = getCardRunNeeds(save, characterId, caps);
    const shortfall: CardRunShortfall = {
        weapons: needs.weapons.missing,
        passives: needs.passives.missing,
    };
    return shortfall.weapons > 0 || shortfall.passives > 0 ? shortfall : undefined;
}

// A set of cards a Card collection only run counts (CARD_RUN_WEAPONS weapons or CARD_RUN_PASSIVES
// passives): how many it needs, how many more are missing, and every card that would count, owned
// or not, for the screen that says what's needed
export type CardRunNeed = {
    needed: number;
    missing: number;
    cards: { card: CardDef; owned: boolean }[];
};

// What a Card collection only run as this adventurer needs, card by card: their starter cards
// (getCardLock), then the weapons and passives that would fill a level up (getCardRunShortfall)
export function getCardRunNeeds(
    save: SaveData,
    characterId: string,
    caps: CardCaps = getCardCaps(save),
): { starter: { card: CardDef; owned: boolean }[]; weapons: CardRunNeed; passives: CardRunNeed } {
    const character = getCharacter(characterId);
    const unlocked = new Set(save.unlockedItems);
    const startingWeapon = character.startingWeapon;
    const family = getWeapon(startingWeapon).family;
    const owned = (card: CardDef) => ({ card, owned: caps.has(card.id) });
    // As rollChoices offers them: not the starting weapon's family (one godsword's enough)
    const weapons = WEAPONS.filter(
        (weapon) =>
            weapon.id !== startingWeapon &&
            (!family || weapon.family !== family) &&
            !weapon.evolved &&
            !weapon.pickOnly &&
            (!weapon.style || weapon.style === character.style) &&
            isOfferable(weapon, unlocked),
    ).flatMap((weapon) => {
        const card = CARD_BY_ID.get(`weapon:${weapon.id}`);
        return card ? [owned(card)] : [];
    });
    const passives = PASSIVES.filter((passive) => isAvailable(passive, unlocked)).flatMap(
        (passive) => {
            const card = CARD_BY_ID.get(`passive:${passive.id}`);
            return card ? [owned(card)] : [];
        },
    );
    // An adventurer who finds no items, or carries only the one weapon, needs no more cards
    const more = !character.noItems && (character.maxWeapons ?? 2) > 1;
    const need = (list: { card: CardDef; owned: boolean }[], count: number): CardRunNeed => {
        const needed = more ? count : 0;
        return {
            needed,
            missing: Math.max(0, needed - list.filter((c) => c.owned).length),
            cards: list,
        };
    };
    return {
        starter: getStarterCards(characterId).map((card) => ({
            card,
            owned: getBestVersion(save, card) !== undefined,
        })),
        weapons: need(weapons, CARD_RUN_WEAPONS),
        passives: need(passives, CARD_RUN_PASSIVES),
    };
}

// The cards an adventurer starts a run with: their starting weapon's (adventurers start with no
// passives or gear; their outfit is looks). A run as them is Card collection only only with
// these owned (getCardLock), and the free starter pack holds the starting adventurer's.
export function getStarterCards(characterId: string): CardDef[] {
    const card = CARD_BY_ID.get(`weapon:${getCharacter(characterId).startingWeapon}`);
    return card ? [card] : [];
}

// The starter cards an adventurer still needs for a Card collection only run, or undefined with
// none missing: such a run can't start as them till they're owned
export function getCardLock(save: SaveData, characterId: string): CardDef[] | undefined {
    const missing = getStarterCards(characterId).filter(
        (card) => getBestVersion(save, card) === undefined,
    );
    return missing.length > 0 ? missing : undefined;
}

// The caps as a co-op loadout carries them, small for the relay's cap: a character for each card
// in ALL_CARDS' order (a room's players all run the host's build, so the order's the same), "-"
// for none and RARITY_ORDER's index for its rarest version
export function encodeCardCaps(caps: CardCaps): string {
    return ALL_CARDS.map((card) => {
        const rarity = caps.get(card.id);
        const index = rarity ? RARITY_ORDER.indexOf(rarity) : -1;
        return index >= 0 ? String(index) : "-";
    }).join("");
}

// A co-op player's caps from their loadout (another player's game could send anything): weapon,
// passive, gear and pet cards, at versions they come in
export function decodeCardCaps(raw: unknown): Map<string, Rarity> | undefined {
    if (typeof raw !== "string") {
        return undefined;
    }
    const caps = new Map<string, Rarity>();
    for (let i = 0; i < Math.min(raw.length, ALL_CARDS.length); i++) {
        const card = ALL_CARDS[i];
        const version = /^[0-3]$/.test(raw[i]) ? RARITY_ORDER[Number(raw[i])] : undefined;
        if (
            (card.kind !== "trophy" || isPetCard(card)) &&
            version &&
            RARITY_ORDER.indexOf(version) >= RARITY_ORDER.indexOf(card.rarity)
        ) {
            caps.set(card.id, version);
        }
    }
    return caps;
}

// An adventurer the Cards only tab marks locked: it's the tab picked, the map plays it (not one
// whose level ups are blessings), and their starter cards aren't all owned
export function isCardLocked(
    save: SaveData,
    characterId: string,
    map?: { blessings?: unknown },
): boolean {
    return (
        save.cardsOnly === true && !map?.blessings && getCardLock(save, characterId) !== undefined
    );
}

// Whether a run from the Cards only tab can't start as this adventurer: their starter cards
// missing (isCardLocked), or the collection short of a level up (getCardRunShortfall). Picked on
// that tab, a run is Cards only or doesn't start: never a normal one in its place.
export function isCardRunBlocked(
    save: SaveData,
    characterId: string,
    map?: { blessings?: unknown },
): boolean {
    return (
        save.cardsOnly === true &&
        !map?.blessings &&
        (getCardLock(save, characterId) !== undefined ||
            getCardRunShortfall(save, characterId) !== undefined)
    );
}

// A trophy card that's a pet's
function isPetCard(card: CardDef): boolean {
    return card.kind === "trophy" && PET_BY_ID.has(card.id.slice("trophy:".length));
}

// Whether a pet's card is owned (any version): what taking it along in a Card collection only run
// takes, in place of having found it
export function hasPetCard(save: SaveData, petId: string): boolean {
    const card = CARD_BY_ID.get(`trophy:${petId}`);
    return PET_BY_ID.has(petId) && card !== undefined && getBestVersion(save, card) !== undefined;
}

// The pet a Card collection only run takes along: the one picked for them
// (SaveData.cardsOnlyPet), while its card's owned; never another in its place
export function getCardsOnlyPet(save: SaveData): string | undefined {
    const pet = save.cardsOnlyPet;
    return pet !== undefined && hasPetCard(save, pet) ? pet : undefined;
}

// The pet a run takes along: a Card collection only run's (getCardsOnlyPet), or the found one
// picked (SaveData.pet) in any other
export function getRunPet(save: SaveData, cardsOnly: boolean): string | undefined {
    return cardsOnly ? getCardsOnlyPet(save) : save.pet;
}

// Whether a solo run as this adventurer on this map plays Card collection only: on, a map whose
// level ups aren't blessings, a collection that can fill a level up, and their starter cards
// owned. What the run screen shows (the pet row) goes by this, as the run itself does.
export function playsCardsOnly(
    save: SaveData,
    characterId: string,
    map?: { blessings?: unknown },
): boolean {
    return (
        save.cardsOnly === true &&
        !map?.blessings &&
        !getCardRunShortfall(save, characterId) &&
        getCardLock(save, characterId) === undefined
    );
}
