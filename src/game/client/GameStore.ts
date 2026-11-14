import { Rarity } from "../content/rarity";
import type { RemixId } from "../content/remixes";
import { StatPair, StatText } from "../content/stats";
import { GearSlot } from "../content/types";
import { WeaponStatLine } from "../content/weaponStats";
import { ChestAction } from "../core/Loot";
import { RunResult, ScabarasPuzzleState } from "../core/Sim";
import type { GauntletRun } from "../core/gauntlet";
import {
    GauntletRewards,
    NewerSave,
    SaveData,
    UnreadableSave,
    getStartingCharacter,
} from "../core/save";
import type { CinematicDirector } from "./CinematicDirector";
import type { CloudView } from "./CloudSave";
import { DisplaySettings, getDefaultDisplaySettings } from "./DisplaySettings";
import { AudioSettings } from "./GameAudio";
import type { TrailerProgress } from "./TrailerRecorder";
import { CoopView, OFFLINE } from "./coop/CoopLobby";

export type Screen =
    | "loading"
    | "title"
    | "characters"
    | "shop"
    | "armoury"
    // The Wardrobe: the body, the outfit, and its store of outfit pieces
    | "wardrobe"
    | "quests"
    | "collectionLog"
    // Cards: the album and its packs (content/cards.ts)
    | "cards"
    // Co-op: finding or making a room, and the room before a run
    | "coop"
    // The Forgotten Four: its order before the start, and its camp between fights
    | "gauntlet"
    | "camp"
    // The weekly Vault (content/vault.ts)
    | "vault"
    | "run";

export type RunOverlay = "none" | "levelUp" | "chest" | "event" | "paused" | "dead" | "victory";

export type SlotView = {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    iconObjId: number;
    iconSpriteId?: number;
    // What it adds up to so far: "+18% damage", "+15% damage to this weapon" (none for a
    // weapon with no bonus)
    detail?: StatText;
    // Weapons: their stats at this level ("Damage 13", "Attacks 0.74/s")
    stats?: StatText[];
    // Weapons that evolve: the passive it takes, and what's done of it
    evolution?: { passive: string; maxed: boolean; hasPassive: boolean; ready: boolean };
    // The item's own rarity, for the slot's border
    rarityColor: string;
    // A blessing (MapDef.blessings) rather than a weapon or passive: level is how many times it's
    // been had, of maxLevel (Infinity for the fallback's)
    blessing?: boolean;
};

export type ItemView = {
    id: string;
    name: string;
    objId: number;
    rarity: { name: string; color: string };
    // "Head slot", "Utility"
    kindLabel: string;
    // What it does, a line per stat or effect
    lines: StatText[];
    // A potion's stats last this long: in a run, stretched by the hero's effect duration
    seconds?: number;
    // A set piece: how the set's coming along ("Void knight 2/4: ..."), and
    // whether its bonus is on
    set?: { text: string; active: boolean };
};

export type GearSlotView = { slot: GearSlot; name: string; item?: ItemView };

export type InventorySlotView = { item: ItemView; count: number } | null;

export type BuffView = {
    id: string;
    name: string;
    description: string;
    objId: number;
    // A boss attack's drain rather than a potion or power-up
    harmful: boolean;
} & (
    | {
          secondsLeft: number;
          // Time left, 1 when just drunk
          fraction: number;
      }
    | { secondsLeft?: never; fraction?: never }
);

// An opened reward casket, for the opening animation and the decision after
export type ChestView = {
    uid: number;
    casketName: string;
    casketObjId: number;
    tierColor: string;
    // The item's rarity sets how big the reveal is
    rarity: Rarity;
    coins: number;
    item: ItemView;
    // Gear the Armoury has upgraded: the name of the piece it was found as
    upgradedFrom?: string;
    isGear: boolean;
    // Gear: what it replaces (alched when the new piece goes on), and each
    // stat either piece has, worn against found
    replaces?: { item: ItemView; alchCoins: number; stats: StatPair[] };
    // Utility: whether it fits in the inventory, and how many are carried
    canStash: boolean;
    carried: number;
    // Taken at once rather than kept (an extra co-op revive)
    instant: boolean;
    alchCoins: number;
    // What Space does: equip/keep, unless that would be a step down
    recommended: ChestAction;
    // Caskets waiting after this one
    queued: number;
    // Whether its item can be banished now (one's left, and it's not worn or
    // carried), and the set that goes with it, for a set's piece
    banish?: { set?: string };
};

// A random event's visitor with something on offer, the run waiting meanwhile
export type EventView = {
    uid: number;
    name: string;
    speech: string;
    leaveLabel: string;
    // A raid's supply chest: prices are in raid points, and this is what the player has
    points?: number;
    options: {
        title: string;
        text?: string;
        iconObjId: number;
        // For sale, and sold already
        price?: number;
        sold?: boolean;
        enabled: boolean;
    }[];
};

// The HUD's slower parts: what the hero has, which changes with a level up, a
// casket or an item used. The numbers that change as the run's played are in
// HudNumbers.
export type HudView = {
    // The run's map
    mapId: string;
    // An endless run's round
    round?: number;
    level: number;
    maxWeapons: number;
    maxPassives: number;
    weapons: SlotView[];
    passives: SlotView[];
    // On a map with blessings (MapDef.blessings), what level ups have granted, in place of
    // passives and gear
    blessings?: SlotView[];
    // The player's stats from passives, gear, potions and their adventurer,
    // the ones that aren't zero: "+18% damage", "+2 armour"
    stats: StatText[];
    gear: GearSlotView[];
    inventory: InventorySlotView[];
    // Left this run, for a level up's rewards or a casket's item
    rerolls: number;
    // Banishes left (Firemaking)
    banishes: number;
    // What skipping the level up's rewards costs, while they can be skipped
    skip?: { cost: number; affordable: boolean };
    // Reloaded (content/relics.ts): keeps left and offers kept, and whether each can be done now
    keep?: { left: number; kept: number; canKeep: boolean; canTake: boolean };
};

// The HUD's numbers that change as the run's played, 10 times a second. They're
// in a store of their own (GameStore.subscribeNumbers), so only the parts of the
// UI that show them draw again.
export type HudNumbers = {
    // Seconds until this round's final boss, rounded up
    bossIn: number;
    // A raid's room: which of how many, and its boss's name
    // waves: still in its waves, so its boss is on the way (not fought or beaten)
    // portal: the hall's teleporter can be used; first: the player's never beaten it
    raidRoom?: {
        number: number;
        count: number;
        name: string;
        points: number;
        waves: boolean;
        portal: boolean;
        first: boolean;
    };
    // What the map wants of the players now (MapDef.objectives), and how many of its lairs are
    // beaten
    objective?: { text: string; done: number; count: number };
    // The Tombs' Apmeken room: the wave it's on, of how many, and whether it's still waiting for
    // the party to walk through the barrier, or beaten
    tombsWave?: { wave: number; of: number; waiting: boolean; done: boolean; label?: string };
    // Akkha's shadows: how many are up, and seconds till they flood
    tombsShadows?: { left: number; seconds: number };
    // The Scabaras room's puzzles: how many are solved, and Addition's number and what's made
    tombsScabaras?: {
        solved: number;
        of: number;
        target: number;
        sum: number;
        readable: boolean;
        reading?: "slate" | "tablet";
        // Each puzzle: done, to be done now, or waiting on the others
        puzzles: ScabarasPuzzleState[];
    };
    // The Het room: the mirrors you're holding, and how far the caster's charged (0 to 1)
    tombsHet?: { held: number; charge: number };
    // The Crondis room: your water, and the palm's growth against what it needs
    tombsCrondis?: { water: number; growth: number; goal: number };
    // Seconds till Zebak roars, while he's about to
    tombsRoar?: number;
    // Dev server only: god mode's on (GameClient.toggleDevGod)
    devGod?: boolean;
    // Dev only: in the Tombs' Nexus (or the Wardens' room), so the Wardens can be skipped to
    devWardens?: boolean;
    hp: number;
    maxHp: number;
    // Sanity, on a map of two worlds (RealmRuleDef.sanity), and its most: a bar under hitpoints
    sanity?: number;
    sanityMax?: number;
    // Cold, on a map that's cold (ColdRuleDef.cold), and its most: a bar under hitpoints
    cold?: number;
    coldMax?: number;
    // How full the hitpoints bar is, from the hitpoints as they are (regeneration's a little every
    // tick), to a thousandth; hp/maxHp without it
    hpShare?: number;
    // The hitpoints bar turns green, like the client's orb
    poisoned: boolean;
    // Progress to the next level, 0-1
    xpFraction: number;
    // Whole seconds into the run
    seconds: number;
    // Co-op's next automatic choice, using the host's wall clock rather than sim ticks.
    decisionSeconds?: number;
    kills: number;
    coins: number;
    // Damage a second just now, every source counted
    dps: number;
    // For the damage panel (DamageMeter): each weapon's by its id, damage a
    // second just now and damage this run (since it became what it is, for one
    // that's evolved), and what isn't a weapon's (items, power-ups, recoil)
    weaponDamage: Record<string, { dps: number; damage: number }>;
    otherDps: number;
    buffs: BuffView[];
    // enraged: below half its hitpoints, faster and with its enraged attacks
    boss?: BossView;
    // A fight's own button (Sim.ability): how charged it is (0 to 1, by twentieths),
    // whether the boss is in its reach, and whether its guard's down, when it's worth most
    ability?: AbilityView;
    // A hero's own buttons (CharacterDef.abilities), in their order, in place of a fight's one
    abilities?: AbilityView[];
    // The quests this run can get on with: this map's, then the ones done all
    // over, leaving out the ones done before it
    quests: QuestTrackView[];
};

// next, keeping each of prev's fields that's the same (by value), so a memoized
// part of the UI showing one sees the same object. prev itself if nothing's
// changed. A list that's changed keeps the items in it that haven't (one quest's
// progress moving leaves the others as they were).
export function shareUnchanged<T extends object>(prev: T | undefined, next: T): T {
    if (!prev) {
        return next;
    }
    let changed = Object.keys(prev).length !== Object.keys(next).length;
    const shared = { ...next };
    for (const key of Object.keys(next) as (keyof T)[]) {
        const value = next[key];
        const old = prev[key];
        if (value === old || JSON.stringify(value) === JSON.stringify(old)) {
            shared[key] = old;
        } else {
            changed = true;
            if (Array.isArray(value) && Array.isArray(old)) {
                shared[key] = value.map((item, i) =>
                    JSON.stringify(item) === JSON.stringify(old[i]) ? old[i] : item,
                ) as T[keyof T];
            }
        }
    }
    return changed ? shared : prev;
}

// One row of the run's damage: what dealt it (a weapon by its last tier),
// with its kills, and damage a second for a weapon (over the time it was had)
export type DamageView = {
    name: string;
    iconObjId?: number;
    iconSpriteId?: number;
    color?: string;
    damage: number;
    kills: number;
    perSecond?: number;
};

// fraction: of its hitpoints, or a fight in phases' shield. fight: how that
// fight's going, and what's on the player (see BossPhasesDef)
export type BossView = {
    name: string;
    fraction: number;
    enraged: boolean;
    fight?: {
        phase: number;
        phases: number;
        // finale: its last stand, and fraction is the time left in it; hp: a
        // fight on its hitpoints alone (no totems)
        stage: "shield" | "totems" | "finale" | "hp";
        // The bar's line under it (BossPhasesDef phases' status), when it has its own
        status?: string;
        // A fight where its weapon only reaches so far (MapDef.fight.strikeReach),
        // and the player's out of it
        outOfReach?: boolean;
        // Can't be hurt in the world the party's in (EnemyDef.hurtIn)
        otherWorld?: boolean;
        // Its guard's down (BossDef.guard): exposed after a miss, or stunned
        guard?: "exposed" | "stunned";
        // How charged each totem is, 0 to 1
        totems: number[];
        curseAttacks?: number;
        parasiteSeconds?: number;
    };
};

export type BossKillView = { name: string; seconds: number };

export type AbilityView = {
    name: string;
    iconObjId: number;
    charge: number;
    inReach: boolean;
    opened: boolean;
    // A hero's own button (CharacterDef.abilities): its key, and what it does
    keyLabel?: string;
    description?: string;
    // It coaches (FightAbilityDef.guide): the hint, and the guard-down tag and pulse
    guide: boolean;
    // The run has items (not a one-fight map): on a touch screen it goes above their corner
    withItems: boolean;
    // Say what it's for (it's not been used yet this session, early in a fight)
    hint: boolean;
};

// One player's own numbers for the results screen (a teammate who fell or
// left too)
export type PlayerResultView = {
    name: string;
    characterName: string;
    isLocal: boolean;
    down: boolean;
    left: boolean;
    kills: number;
    damageDealt: number;
    caskets: number;
    highestHit: number;
    damageTaken: number;
    healed: number;
    rerollsUsed: number;
    skips: number;
    damage: DamageView[];
};

// done / of: how far it's got, this run's kills and caskets included;
// finished: this run finished it (it pays once the run is over)
export type QuestTrackView = {
    id: string;
    name: string;
    task: string;
    done: number;
    of: number;
    finished: boolean;
};

export type ChoiceView = {
    title: string;
    text: string;
    iconObjId: number;
    iconSpriteId?: number;
    isNew: boolean;
    isEvolution: boolean;
    // A godsword's hilt to pick
    isHilt: boolean;
    // A hilt pick that's the run's Ancient spell, not a godsword's hilt
    isSpell: boolean;
    // One of the map's blessings (MapDef.blessings), offered in place of items
    isBlessing: boolean;
    // A hilt pick that's the run's keris partisan: plain, or the jewel it takes
    isKeris: boolean;
    // The rolled rarity of this offer, if it has one
    rarity?: { name: string; color: string };
    // Weapons: what this level changes, or a new weapon's stats
    stats?: WeaponStatLine[];
    // What it evolves or evolves with; held when the other half's owned
    evolves?: { text: string; held: boolean };
    // Whether it can be banished now: a new weapon or passive, with a banish
    // left, and not the last reward left to pick
    banishable: boolean;
    // Banished: greyed out, and can't be picked
    banished: boolean;
    // A weapon whose style a raid's bosses all pray against: what it loses against them
    bossPenalty?: string;
};

// Co-op: a player in the run besides you, for the party frames
export type TeammateView = {
    name: string;
    characterId: string;
    hp: number;
    maxHp: number;
    // Down with no ring of life left (waiting for a revive, or out for the
    // rest of the run once they've had their last), or gone from the game
    down: boolean;
    left: boolean;
    // Down and a teammate can still bring them back
    revivable: boolean;
    // How far along a revive under way is (0 to 1)
    reviveProgress: number;
    // Just revived, so nothing can hurt them
    immune: boolean;
    // Their player id in the room, for the host to kick them
    id?: string;
};

// Co-op: what the note in the middle of the screen says about a revive:
// you're down and can be revived (with how many revives you have left, and
// who's reviving you, if anyone), or you're reviving a teammate
export type ReviveView = {
    name?: string;
    reviving: boolean;
    progress: number;
    revivesLeft: number;
};

export type GauntletView = {
    order: string[];
    hard: boolean;
    run?: GauntletRun;
    campEnds?: number;
    rewards?: GauntletRewards;
};

export type Toast = { id: number; text: string; until: number };

// Why nothing's being saved: the game's open in another tab, the save's from
// a newer version of it (which this one would undo), or it couldn't be read
// and there's no room to keep a copy
export type SaveBlock =
    | { kind: "otherTab" }
    | ({ kind: "newerGame" } & NewerSave)
    | { kind: "noRoom" };

export type UiSnapshot = {
    screen: Screen;
    loadingText: string;
    loadingProgress: number;
    save: SaveData;
    // Set while nothing's being saved, and closed to play on without saving
    saveBlock?: SaveBlock;
    saveBlockClosed: boolean;
    // The save couldn't be read when it loaded: where it's kept, for the notice
    unreadableSave?: string;
    // Saves that couldn't be read, kept to be exported
    unreadableSaves: UnreadableSave[];
    // Cloud save, where the build has it and its Worker answers
    cloud?: CloudView;
    characterId: string;
    // The map the next run is on, and whether it's endless and on hard mode
    // (once the map's been beaten)
    mapId: string;
    endless: boolean;
    hard: boolean;
    // The remixes switched on for it (content/remixes.ts), those open on it
    remixes: RemixId[];
    // An Awakener's orb to be spent on its final boss (act-2-fallen-empire.md 8.6), once one's held
    awaken: boolean;
    // The weekly Vault's week (content/vault.ts) the room's next run is, hosting one
    vaultRoom?: string;
    // A fight in parts: the part picked to play (one already reached, MapDef.stages), till the run
    // it's for ends; the next not beaten when unset
    fightStage?: number;
    // A raid's expert mode (solo for now)
    expert: boolean;
    hud?: HudView;
    overlay: RunOverlay;
    // Co-op: the room and its menus, everyone else in the run, and who the
    // run's waiting on to choose (when it isn't you)
    coop: CoopView;
    party: TeammateView[];
    waitingOn: string[];
    // Co-op: a revive you're part of, as the one down or the one reviving
    revive?: ReviveView;
    // The map's opening cinematic is playing (MapDef.cinematic): no HUD, and a tap skips it
    cinematic?: boolean;
    // Dev only: the shot editor's open on it (GameClient.direct), with its panel for the HUD
    director?: CinematicDirector;
    // Dev only: the trailer being recorded from it, how far it's got
    trailer?: TrailerProgress;
    choices: ChoiceView[];
    // Level ups still to choose after the one showing
    levelUpsLeft: number;
    chest?: ChestView;
    event?: EventView;
    // unlockedMap: the name of the map this run's win opened up;
    // unlockedCharacters / unlockedItems: the names of the adventurers and
    // items it brought in; endlessRecord: an endless run that went further
    // than any before it on the map; firstHardWin: the first time the map's
    // been beaten on hard mode; newGear: the names of the gear it found for
    // the first time, for the Armoury; quests: the quests it finished, and
    // what they paid
    // players: everyone's own stats; bossKills: the party's boss times
    result?: RunResult & {
        players: PlayerResultView[];
        bossKills: BossKillView[];
        endlessRecord: boolean;
        firstHardWin: boolean;
        unlockedMap?: string;
        unlockedCharacters: string[];
        unlockedItems: string[];
        newGear: string[];
        // The names of the trophies it found for the first time
        newTrophies: string[];
        quests: { name: string; coins: number }[];
        // Co-op: who else played, and why it ended early if it did
        party?: string[];
        endedEarly?: string;
        // The weekly Vault's run: its week, and whether it's the week's best
        vault?: { key: string; best: boolean };
        // An Awakener's orb won (an Awakened fight), or spent on this run's final boss
        orbWon?: boolean;
        // Played Card collection only (core/cardRuns.ts): it counts as any other run
        cardsOnly?: boolean;
        // Played in a room to its end, so the party goes back together: no Play again, even once
        // the room closes on the results
        coop?: boolean;
    };
    toasts: Toast[];
    // The Forgotten Four (content/gauntlet.ts): the order and mode picked on its screen, and once
    // it's started its run, when its camp ends (performance.now()), and its clear's rewards
    gauntlet?: GauntletView;
    // An act's ending being told (its id, content/acts.ts), over whatever screen's up: as the last
    // of its Awakened fights falls, or played again from its card
    actEnding?: string;
    // The Card shop to open on this pack (content/cards.ts), from Card collection only's needs, and
    // the screen it was opened from, which its Back goes back to
    cardShopPack?: string;
    cardShopFrom?: Screen;
    // What the toasts said this run, newest first, for the pause menu: they're gone in seconds
    toastLog: string[];
    debug: boolean;
    audio: AudioSettings;
    display: DisplaySettings;
};

// How many of the run's messages the pause menu keeps
const TOAST_LOG_SIZE = 8;

// The UI's view of the game: an immutable snapshot replaced on every change,
// read by React through useSyncExternalStore.
export class GameStore {
    private snapshot: UiSnapshot;
    private readonly listeners = new Set<() => void>();
    private nextToastId = 1;

    constructor(save: SaveData) {
        this.snapshot = {
            screen: "loading",
            loadingText: "Loading Lumbridge",
            loadingProgress: 0,
            save,
            saveBlockClosed: false,
            unreadableSaves: [],
            characterId: getStartingCharacter(save),
            mapId: "lumbridge",
            endless: false,
            hard: false,
            remixes: [],
            awaken: false,
            expert: false,
            overlay: "none",
            coop: OFFLINE,
            party: [],
            waitingOn: [],
            choices: [],
            levelUpsLeft: 0,
            toasts: [],
            toastLog: [],
            debug: false,
            audio: { muted: false, volume: 0.6, music: 0.6 },
            display: getDefaultDisplaySettings(),
        };
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getSnapshot = (): UiSnapshot => this.snapshot;

    // The HUD's numbers, kept apart from the snapshot (see HudNumbers)
    private numbers?: HudNumbers;
    private readonly numberListeners = new Set<() => void>();

    subscribeNumbers = (listener: () => void): (() => void) => {
        this.numberListeners.add(listener);
        return () => this.numberListeners.delete(listener);
    };

    getNumbers = (): HudNumbers | undefined => this.numbers;

    setNumbers(numbers: HudNumbers | undefined): void {
        this.numbers = numbers;
        for (const listener of this.numberListeners) {
            listener();
        }
    }

    set(changes: Partial<UiSnapshot>): void {
        this.snapshot = { ...this.snapshot, ...changes };
        for (const listener of this.listeners) {
            listener();
        }
    }

    // Its id, to find it again or take it down early (a boss's instruction: GameClient)
    toast(text: string, ms = 3500): number {
        const now = performance.now();
        // The same message twice at once (three Jads turning up together)
        // shows once
        const toasts = this.snapshot.toasts.filter((t) => t.until > now && t.text !== text);
        const id = this.nextToastId++;
        toasts.push({ id, text, until: now + ms });
        const log = this.snapshot.toastLog;
        this.set({
            toasts: toasts.slice(-4),
            toastLog: log[0] === text ? log : [text, ...log].slice(0, TOAST_LOG_SIZE),
        });
        return id;
    }

    dismissToast(id: number): void {
        const toasts = this.snapshot.toasts;
        if (toasts.some((t) => t.id === id)) {
            this.set({ toasts: toasts.filter((t) => t.id !== id) });
        }
    }

    expireToasts(): void {
        const now = performance.now();
        const toasts = this.snapshot.toasts;
        if (toasts.some((t) => t.until <= now)) {
            this.set({ toasts: toasts.filter((t) => t.until > now) });
        }
    }
}
