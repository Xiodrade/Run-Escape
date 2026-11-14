import { Camera } from "../../mapviewer/Camera";
import { MapViewer } from "../../mapviewer/MapViewer";
import { ActorRenderer } from "../../mapviewer/webgl/actor/ActorRenderer";
import { RegionData, RegionDataInput } from "../../mapviewer/worker/RegionData";
import { RegionDataLoader } from "../../mapviewer/worker/RegionDataLoader";
import { CollisionFlag } from "../../rs/pathfinder/flag/CollisionFlag";
import { isCoarsePointer } from "../../util/DeviceUtil";
import { ACT_BY_ID, getAct, getActStep, isActEnded } from "../content/acts";
import { getBlessing } from "../content/blessings";
import type { PackDef } from "../content/cards";
import { CHARACTERS, CHARACTER_BY_ID, getCharacter } from "../content/characters";
import { MAX_PARTY, REVIVE_IMMUNITY_SECONDS, REVIVE_SECONDS } from "../content/coop";
import { upgradedName } from "../content/endless";
import { getEnemy } from "../content/enemies";
import { BlessingId, CAMP_SECONDS, GAUNTLET_FIGHTS, isGauntletOrder } from "../content/gauntlet";
import { INVADER_BY_ID } from "../content/invaders";
import { isInvasionOpen, rollInvasion, takesInvasions } from "../content/invasions";
import {
    RUN_SET,
    getRaidBand,
    isHardInvocation,
    saveInvocationPreset,
    toggleInvocation,
} from "../content/invocations";
import { CASKETS, getItem } from "../content/items";
import { getMapEnemies, getTombsStageEnemies } from "../content/mapEnemies";
import {
    ALL_MAPS,
    FUN_MAPS,
    MAPS,
    MAP_BY_ID,
    RAID_MAPS,
    getArenaRegion,
    getMap,
    getMapCharacter,
    getRetryLair,
    getRunCinematic,
    isCoopMap,
    isDevMap,
    isFunMap,
    takesInvocations,
    takesRelics,
} from "../content/maps";
import { getPassive, passiveValueText } from "../content/passives";
import { PET_BY_ID, isPetFound } from "../content/pets";
import { getPowerUp } from "../content/powerups";
import { QUESTS, canDoQuestOn, describeQuest } from "../content/quests";
import { getRaidBossShare, raidHasColours } from "../content/raidBosses";
import { RAID_TELEPORTS } from "../content/raids";
import { RARITIES, Rarity, rarityName } from "../content/rarity";
import { RelicTier, cleanRelics, getOpenRelicTiers, pickRelic } from "../content/relics";
import { RemixId, cleanRemixes, isRemixOpen } from "../content/remixes";
import { SHOP_UPGRADES } from "../content/shop";
import { formatStats } from "../content/stats";
import { APMEKEN_WAVES } from "../content/tombs";
import { TROPHY_BY_ID, getRaidChestTrophiesFound } from "../content/trophies";
import {
    BlessingsDef,
    CinematicDef,
    CombatStyle,
    MapDef,
    Stats,
    emptyStats,
} from "../content/types";
import { LOCKABLE_ITEMS, describeUnlockTask, isAvailable } from "../content/unlocks";
import {
    VaultRun,
    getVault,
    getVaultAt,
    isBetterVault,
    isVaultOpen,
    parseWeekKey,
} from "../content/vault";
import { WardrobeLook, cleanLook, saveOutfit, wearOutfit } from "../content/wardrobe";
import { weaponBonusText, weaponStatText, weaponStats } from "../content/weaponStats";
import { getWeapon, getWeaponStyle } from "../content/weapons";
import { ChestAction, shouldAutoEquip } from "../core/Loot";
import { Hero, HeroOptions, RunResult, Sim, TICKS_PER_SECOND } from "../core/Sim";
import {
    CardCaps,
    UpgradeChoice,
    canEvolve,
    describeChoice,
    getEvolutionHint,
} from "../core/Upgrades";
import {
    decodeCardCaps,
    encodeCardCaps,
    getCardCaps,
    getCardLock,
    getCardRunShortfall,
    getRunPet,
    getStarterCards,
    hasPetCard,
    isCardRunBlocked,
} from "../core/cardRuns";
import { PackCard, buyCardPack, openCardPack } from "../core/cards";
import { Enemy, SimEvent, WeaponState } from "../core/entities";
import { usePortableMath } from "../core/fmath";
import {
    GauntletRun,
    chooseBlessing,
    gauntletFightId,
    gauntletFightOptions,
    gauntletRetries,
    gauntletSeconds,
    leaveGauntletCamp,
    loseGauntletFight,
    retryGauntletFight,
    startGauntlet,
    winGauntletFight,
} from "../core/gauntlet";
import { CoopAction, applyAction, hasBadNumber } from "../core/lockstep";
import { POCKET_COLD_WASH, invasionContent } from "../core/rules/invasion";
import { remixContent } from "../core/rules/remix";
import {
    NewerSave,
    SaveData,
    SaveStore,
    buyArmouryUpgrade,
    buyCosmetic,
    buyUpgrade,
    canAwaken,
    canWearCosmetic,
    cleanRunInvocations,
    exportSave,
    getEarnedUnlocks,
    getFightStage,
    getFinishedQuests,
    getGauntletOrder,
    getMetaStats,
    getQuestProgress,
    getRaidPortals,
    getReachedStages,
    getStartingCharacter,
    hasGauntletLooks,
    isEndlessRecord,
    isEndlessUnlocked,
    isExpertUnlocked,
    isGauntletHardOpen,
    isGauntletOpen,
    isHardRecord,
    isHardUnlocked,
    isMapUnlocked,
    recordGauntlet,
    recordRun,
    refundUpgrade,
    refundUpgrades,
    takeActEnding,
} from "../core/save";
import { ArenaGrid } from "../core/world/ArenaGrid";
import { fmtNum, t, tl, tp } from "../i18n";
import {
    CameraRig,
    MAX_CAMERA_DISTANCE,
    MIN_CAMERA_DISTANCE,
    getGroundReach,
} from "../render/CameraRig";
import { CameraReach, GameFrameHandler, GameWebGLRenderer } from "../render/GameWebGLRenderer";
import { getRecipe, installRecipe } from "../scaperune/squares";
import { BLESSING_COLOR, getBlessingViews } from "./BlessingViews";
import { OVERHEAD_GAP, OVERHEAD_SCALE } from "./BossFightView";
import {
    CinematicCamera,
    CinematicPlayer,
    getCinematicCamera,
    getCinematicSquares,
} from "./Cinematic";
import { CinematicDirector, FlyInput, getDirectorChoices } from "./CinematicDirector";
import { CLOUD_SAVE_URL, CloudSync } from "./CloudSave";
import { DamageMeter } from "./DamageMeter";
import {
    DisplaySettings,
    FrameRate,
    frameCap,
    loadDisplaySettings,
    saveDisplaySettings,
} from "./DisplaySettings";
import {
    GameAssets,
    PRAYER_HEADICON_FRAME_IDS,
    PRAYER_HEADICON_SPRITE,
    getEnemyModelKey,
    getOfferedAttackSeqs,
    getRunAppearance,
    getRunAttackSeqs,
    setGauntletLooks,
} from "./GameAssets";
import { GameAudio } from "./GameAudio";
import { GameInput } from "./GameInput";
import { padHints } from "./GamePad";
import { ChestCue, GameSounds, getGameSoundIds } from "./GameSounds";
import {
    AbilityView,
    ChoiceView,
    GameStore,
    HudNumbers,
    HudView,
    QuestTrackView,
    ReviveView,
    SaveBlock,
    Screen,
    SlotView,
    shareUnchanged,
} from "./GameStore";
import { GameView } from "./GameView";
import {
    getBuffViews,
    getChestView,
    getEventView,
    getGearViews,
    getInventoryViews,
    getUsedRevive,
} from "./ItemViews";
import { LightBudget, MAX_SHOWN_LIGHTS } from "./LightBudget";
import { Minimap } from "./Minimap";
import { Overlay, ScreenPoint } from "./Overlay";
import { getPlayerPose } from "./PlayerPose";
import { RUN_ANALYTICS_URL, startRunAnalytics } from "./RunAnalytics";
import { getBossKillViews, getPlayerResultViews } from "./RunStatsViews";
import { SaveLock } from "./SaveLock";
import { SceneLights } from "./SceneLights";
import { TrailerOptions, TrailerRecorder, getTrailerSpec } from "./TrailerRecorder";
import { CoopLobby, makeLoadout, roomPlaysCardsOnly } from "./coop/CoopLobby";
import { CoopRun, GUEST_BUFFER_FRAMES } from "./coop/CoopRun";
import { CoopTicker } from "./coop/CoopTicker";
import { GameStart, GoneReason, Loadout, RoomView, Unlocks, isGameStart } from "./coop/protocol";
import { saveFile } from "./saveFile";

// 20ms: the OSRS client tick, also the unit of animation frame lengths
export const TICK_MS = 1000 / TICKS_PER_SECOND;
// Seconds into a boss's fight a fight's own button says what it's for, until it's first used: from
// a moment after the boss is up (risen from its intro), for long enough to read (AbilityView.hint)
const ABILITY_HINT_FROM = 3;
const ABILITY_HINT_UNTIL = 15;
const MAX_TICKS_PER_FRAME = 10;
// A solo run makes up a late frame's ticks this many a frame at most, rather than
// all in the next one, so one slow frame doesn't make the next slow too. Every
// tick still runs: it's at most MAX_TICKS_PER_FRAME behind, as before.
const SOLO_TICKS_PER_FRAME = 4;
// A co-op guest that's fallen well behind the host catches up this fast
const MAX_CATCH_UP_TICKS = 120;
// A frame spends this long at most on catching up, so a slow phone stays
// responsive while it does (the ticks that are due in real time still run)
const CATCH_UP_BUDGET_MS = 8;
// What can wait for a co-op run whose copy is still being made: far more
// than a slow load brings in
const MAX_COOP_INBOX = 50_000;
const HUD_INTERVAL_MS = 100;
// Co-op: how much nearer, in tiles, another boss must be to take the boss bar, so two
// about as far away don't take turns on it as everyone moves
const BOSS_BAR_SWITCH = 2;
// The damage meter's number holds this long, so it can be read
const DPS_HOLD_TICKS = TICKS_PER_SECOND / 2;

// The title screen is in the first map (Lumbridge castle's courtyard)
const TITLE_MAP = MAPS[0];

// Recordings of the OSRS music tracks maps play (MapDef.music), from the OSRS
// Wiki, in src/media/music: a track's file is its name in lower case with
// underscores (massacre.ogg, the_bane_of_ashihama.ogg). A track with no
// recording there plays nothing, so a map can name one before it's in.
const MUSIC_FILES = import.meta.glob("../../media/music/*.ogg", {
    eager: true,
    import: "default",
}) as Record<string, string>;

function musicFor(track: string): string | undefined {
    const file = track.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return MUSIC_FILES[`../../media/music/${file}.ogg`];
}

// Title screen camera: lower and slowly circling the character (RS angle units
// per tick), or settling in front of them when it's not to spin
const ATTRACT_PITCH = -260;
const ATTRACT_DISTANCE = 9;
const ATTRACT_SPIN = 1.2;
const ATTRACT_SETTLE = 0.96;
// The Wardrobe's camera: closer and lower, facing the adventurer, who stands this many tiles to
// the right of the middle (beside its panel) and is looked at this much higher up
const WARDROBE_DISTANCE = 4.5;
const WARDROBE_PITCH = -140;
const WARDROBE_YAW = 0;
const WARDROBE_SIDE = 1.4;
const WARDROBE_RISE = 0.3;

// A yaw (0 to 2048 a turn) kept in its turn
function wrapYaw(yaw: number): number {
    return ((yaw % 2048) + 2048) % 2048;
}

// A yaw a frame nearer its target, the short way round: settle is how much of the way it's
// still to go, and it's there once it's under a unit off
function settleYaw(yaw: number, target: number, settle: number): number {
    const turn = wrapYaw(yaw - target);
    const settled = (turn > 1024 ? turn - 2048 : turn) * settle;
    return wrapYaw(target + (Math.abs(settled) < 1 ? 0 : settled));
}

// The pet taken along stands beside the character on the menus: tiles to their side and behind
const PREVIEW_PET_SIDE = 1.1;
const PREVIEW_PET_BACK = 0.4;
const RUN_PITCH = -400;
// Tiles past a dev map's arena the world's drawn: a map square of scenery, less a fade
const OPEN_WORLD_MARGIN = 56;
const RUN_DISTANCE = 18;
// How long the camera takes to follow the ground up a slope on a dev map, in ms: without this,
// it lurches at every crease in tall ground
const CAMERA_GROUND_EASE = 110;
// For a boss that asks for it (BossLookDef.lean), the camera leans this much of the way towards
// where it stands, up to so many tiles, so a big boss isn't under the HUD at the top; and how long
// that takes, in ms (the ease is a raid boss room's too). A raid's boss rooms lean only as far
// as they need (RAID_LEAN_MAX): players there would rather it stayed on them.
const BOSS_LEAN = 0.4;
const BOSS_LEAN_MAX = 2.5;
const BOSS_LEAN_EASE = 350;
// In a raid's boss room the camera stays on the player, as in the halls, leaning north only as
// far as keeps the boss and its overhead prayer below the boss bar (a big boss on a phone's short
// screen most of all), and only when that's no more than this many tiles: a boss further off
// isn't leant towards
const RAID_LEAN_MAX = 4;
// How much brighter a gaze lights the arena at its height (getGazeLight)
const GAZE_LIGHT = 0.6;
// Ms the light takes to catch up with that, roughly
const GAZE_LIGHT_EASE = 180;
// A boss's blow shaking the camera (ImpactDef.shake): how long, how far at its hardest (tiles),
// and from how many tiles off the player it's felt less, to none at SHAKE_FAR
const SHAKE_MS = 320;
const SHAKE_TILES = 0.3;
const SHAKE_NEAR = 8;
const SHAKE_FAR = 24;
// Closer on a phone held sideways: it shows as much to each side as a desktop
// window does, and the player stays big enough to see
const PHONE_RUN_DISTANCE = 15;
const PHONE_MAX_HEIGHT = 520;
// The most of the opening cinematic a frame moves it on by (ms)
const CINEMATIC_MAX_FRAME_MS = 100;
// The longest it waits for what it sees to load before it plays anyway (ms)
const CINEMATIC_LOAD_MS = 45000;
// How long the shot editor's shots stand still before what they'll see is loaded (ms)
const DIRECTOR_PIN_MS = 250;

// How far past the arena the camera can get: a run's is behind the player, zoomed
// all the way out, and the title screen's circles them
const CAMERA_REACH: CameraReach = {
    behind: getGroundReach(RUN_PITCH, MAX_CAMERA_DISTANCE),
    around: getGroundReach(ATTRACT_PITCH, ATTRACT_DISTANCE),
};

// What a map's region data is built from: its arena, and on a map with glowing scenery the loc
// ids to find (LightingDef.locs)
function getRegionInput(map: MapDef): RegionDataInput {
    const locs = map.lighting?.locs;
    const region = getArenaRegion(map);
    return locs ? { ...region, glowLocs: Object.keys(locs).map(Number) } : region;
}

// A map of two worlds' squares and its twin's (MapDef.twin, MapManager.twin): its recipe's
// squares, or those under its arena
function getTwinSquares(map: MapDef) {
    if (!map.twin) {
        return undefined;
    }
    const recipe = getRecipe(map.id);
    const { baseX, baseY, sizeX, sizeY } = map.arena;
    return {
        x0: recipe ? recipe.mapX : Math.floor(baseX / 64),
        y0: recipe ? recipe.mapY : Math.floor(baseY / 64),
        x1: recipe ? recipe.mapX + recipe.squaresX - 1 : Math.floor((baseX + sizeX - 1) / 64),
        y1: recipe ? recipe.mapY + recipe.squaresY - 1 : Math.floor((baseY + sizeY - 1) / 64),
        dx: Math.round(map.twin.dx / 64),
        shown: false,
    };
}

// The world fades out past the arena's edge. A ScapeRune map's world carries on: it
// has scenery there (scaperune/CLAUDE.md).
function setPlayArea(
    renderer: GameWebGLRenderer,
    arena: { baseX: number; baseY: number; sizeX: number; sizeY: number },
    scaperune: boolean,
): void {
    const { baseX, baseY, sizeX, sizeY } = arena;
    const open = scaperune ? OPEN_WORLD_MARGIN : 0;
    renderer.setPlayArea(
        baseX - open,
        baseY - open,
        baseX + sizeX + open,
        baseY + sizeY + open,
        CAMERA_REACH,
    );
}

// The level up's rewards, as the UI shows them
// What a new endless round brings, for its toast
function describeRound(sim: Sim): string {
    const times = (n: number) => `${Math.round(n * 10) / 10}x`;
    return t("toast.round", {
        round: sim.round,
        hp: times(sim.roundHp),
        damage: times(sim.roundDamage),
        gear: sim.round - 1,
    });
}

function getQuestTrackViews(save: SaveData, sim: Sim): QuestTrackView[] {
    // Quests don't count on the fun maps, so there's nothing to track there
    if (isFunMap(sim.map.id)) {
        return [];
    }
    const run = sim.getResult();
    const quests = QUESTS.filter(
        (quest) => canDoQuestOn(quest, sim.map) && !save.questsDone.includes(quest.id),
    );
    // The map's own first (QUESTS has the ones done all over last)
    return quests.map((quest) => {
        const { done, of } = getQuestProgress(save, quest, run);
        return {
            id: quest.id,
            name: quest.name,
            task: describeQuest(quest.objective),
            done,
            of,
            finished: done >= of,
        };
    });
}

// How far a weapon has got towards its evolution, for the HUD and pause menu
function getEvolutionView(sim: Sim, weapon: WeaponState): SlotView["evolution"] {
    const evolution = weapon.def.evolution;
    if (
        !evolution ||
        !isAvailable(getWeapon(evolution.into), sim.unlockedItems) ||
        // A Card collection only run without the evolution's card: it won't come
        (sim.cardCaps && !sim.cardCaps.has(`weapon:${evolution.into}`))
    ) {
        return undefined;
    }
    const owned = new Set(sim.passives.map((p) => p.id));
    return {
        passive: getPassive(evolution.requiresPassive).name,
        maxed: weapon.level >= weapon.def.levels.length,
        hasPassive: owned.has(evolution.requiresPassive),
        ready: canEvolve(weapon, owned, sim.unlockedItems, sim.cardCaps),
    };
}

// A raid whose bosses all pray against a weapon's style (the Theatre's, against ranged and
// magic): what its card says it loses against them
function getBossPenalty(sim: Sim, choice: UpgradeChoice): string | undefined {
    const weaponId =
        choice.kind === "evolve" || choice.kind === "hilt"
            ? choice.into
            : choice.kind === "newWeapon" || choice.kind === "weaponLevel"
              ? choice.weaponId
              : undefined;
    if (!weaponId) {
        return undefined;
    }
    const style = getWeaponStyle(getWeapon(weaponId));
    const share = getRaidBossShare(sim.map, style, sim.expert);
    if (share === undefined) {
        return undefined;
    }
    // Nylocas Vasilias takes her colour's style better, so it's most of the Theatre's bosses
    return t(raidHasColours(sim.map) ? "canvas.boss_penalty_most" : "canvas.boss_penalty", {
        percent: Math.round((1 - share) * 100),
        style: t(`canvas.style.${style}`),
    });
}

// How many times a blessing on offer will have been had, as its card's corner says it: "2 of 8".
// Nothing for one that's had only once or as often as it comes (the fallback).
function blessingCount(
    blessings: BlessingsDef,
    choice: { blessingId: string; count: number },
): string | undefined {
    const { max } = getBlessing(blessings, choice.blessingId);
    return Number.isFinite(max) && max > 1 ? `${choice.count} of ${max}` : undefined;
}

function getChoiceViews(sim: Sim): ChoiceView[] {
    const style = getCharacter(sim.characterId).style;
    const blessings = sim.map.blessings;
    return sim.choices.map((choice, index) => {
        const { title, text, iconObjId, iconSpriteId, quality, stats } = describeChoice(
            choice,
            blessings,
        );
        const rarity = quality ? RARITIES[quality] : undefined;
        const blessed =
            blessings && choice.kind === "blessing" ? blessingCount(blessings, choice) : undefined;
        return {
            title,
            text,
            iconObjId,
            iconSpriteId,
            isNew:
                choice.kind === "newWeapon" ||
                choice.kind === "newPassive" ||
                (choice.kind === "blessing" && choice.count === 1 && blessed !== undefined),
            isEvolution: choice.kind === "evolve",
            isHilt: choice.kind === "hilt",
            isSpell: choice.kind === "hilt" && getWeapon(choice.into).family === "ancient_burst",
            isKeris: choice.kind === "hilt" && getWeapon(choice.into).family === "keris",
            isBlessing: choice.kind === "blessing",
            rarity:
                choice.kind === "blessing"
                    ? { name: blessed ?? "Blessing", color: BLESSING_COLOR }
                    : rarity && quality && { name: rarityName(quality), color: rarity.color },
            stats,
            evolves: getEvolutionHint(
                choice,
                sim.weapons,
                sim.passives,
                style,
                sim.unlockedItems,
                sim.cardCaps,
            ),
            banishable: sim.canBanishChoice(index),
            banished: sim.isBanishedChoice(index),
            bossPenalty: getBossPenalty(sim, choice),
        };
    });
}

// The party's loadouts as a run takes them: a Cards only room's (the host's tab on, and their
// cards sent) keeps each player's cards, any other drops them all, the host's too, so no one plays
// Cards only on their own
export function partyLoadouts(
    heroes: readonly { id: string; loadout?: Loadout }[],
    hostId: string,
): (Loadout | undefined)[] {
    const host = heroes.find((hero) => hero.id === hostId);
    const cardsOnly =
        host?.loadout?.cardsOnly === true && typeof host.loadout.cardCaps === "string";
    return heroes.map(({ loadout }) =>
        cardsOnly || loadout?.cardCaps === undefined
            ? loadout
            : { ...loadout, cardCaps: undefined },
    );
}

// What a co-op player brings, as far as any game could have it (another
// player's game could send anything)
export function cleanLoadout(loadout: Loadout | undefined): {
    unlockedItems: Set<string>;
    cardCaps?: CardCaps;
    trophiesFound: Set<string>;
    armoury: Record<string, number>;
    pet?: string;
    relics?: string[];
} {
    const items = Array.isArray(loadout?.unlockedItems) ? loadout.unlockedItems : [];
    const caps = loadout?.cardCaps !== undefined ? decodeCardCaps(loadout.cardCaps) : undefined;
    const pet =
        typeof loadout?.pet === "string" && PET_BY_ID.has(loadout.pet) ? loadout.pet : undefined;
    const trophies = Array.isArray(loadout?.trophies) ? loadout.trophies : [];
    const armoury: Record<string, number> = {};
    for (const [id, times] of Object.entries(loadout?.armoury ?? {})) {
        if (Number.isInteger(times) && times > 0) {
            armoury[id] = Math.min(times, 20);
        }
    }
    return {
        unlockedItems: new Set(items.filter((id) => typeof id === "string").slice(0, 5000)),
        trophiesFound: new Set(getRaidChestTrophiesFound(trophies.slice(0, 100))),
        armoury,
        // Their relics, each player's own (the Sim keeps them off maps that take none)
        ...(Array.isArray(loadout?.relics) && { relics: cleanRelics(loadout.relics) }),
        // Card collection only, their own cards (core/cardRuns.ts)
        ...(caps && { cardCaps: caps }),
        // Their pet: in a Card collection only run, only one whose card they've sent
        ...(pet && (!caps || caps.has(`trophy:${pet}`)) && { pet }),
    };
}

// What a co-op player's loadout gives their hero, no more than the shop can
export function loadoutStats(loadout: Loadout | undefined): Stats {
    const stats = emptyStats();
    for (const [key, value] of Object.entries(loadout?.metaStats ?? {})) {
        // A stat's own name only: "constructor" is in every object
        if (Object.hasOwn(stats, key) && typeof value === "number" && Number.isFinite(value)) {
            const most = SHOP_MAX[key as keyof Stats] ?? 0;
            stats[key as keyof Stats] = Math.max(Math.min(0, most), Math.min(most, value));
        }
    }
    return stats;
}

// Each stat with every shop upgrade for it bought (no prototype, so nothing
// inherited reads as a stat)
const SHOP_MAX: Partial<Stats> = Object.create(null);
for (const upgrade of SHOP_UPGRADES) {
    SHOP_MAX[upgrade.stat] = (SHOP_MAX[upgrade.stat] ?? 0) + upgrade.perRank * upgrade.maxRank;
}

// Why a co-op run ended early, on its results
const ENDED_EARLY: Partial<Record<GoneReason, string>> = {
    idle: "The room closed after half an hour with nothing happening.",
    kicked: "The host removed you from the party.",
    disbanded: "The host disbanded the party.",
    hostLeft: "The host left, so the run's over.",
};

export type GameClientOptions = {
    // Extra goblins at the start of a run, for performance testing
    stress: number;
    // Start a run with this character straight away (testing)
    autostart?: string;
    // ?raidtest on the dev server: solo runs with a raid's rooms two minutes apart and every
    // level up at its max (SimTesting); "short" for the rooms alone
    raidTest?: "max" | "short";
    // ?invade=invading_duke@20 on the dev server: that invader at that second of the map's clock
    // on a map that takes invasions, once they're open (SimTesting.invasion)
    invade?: string;
    // ?director=<map id> on the dev server: a run there with the shot editor open (direct)
    director?: string;
};

// A boss winding up a gaze (BossAttackDef.cover) lights the arena, more as it comes: how much
// brighter than the map's own, from 1 to 1 + GAZE_LIGHT as it lands
export function getGazeLight(sim: Sim): number {
    const boss = sim.shownBoss;
    const windup = boss && !boss.dead ? boss.bossState?.windup : undefined;
    if (!windup?.attack.cover) {
        return 1;
    }
    const raw = (sim.tick - windup.startTick) / Math.max(1, windup.landTick - windup.startTick);
    const t = Math.min(1, Math.max(0, raw));
    return 1 + GAZE_LIGHT * t * t * (3 - 2 * t);
}

// How full a hitpoints bar is, to a thousandth: regeneration heals a little every tick, so the bar
// fills as it does rather than a whole hitpoint at a time (HudNumbers.hpShare)
export function getHpShare(hp: number, maxHp: number): number {
    return maxHp > 0 ? Math.round(Math.min(1, Math.max(0, hp / maxHp)) * 1000) / 1000 : 0;
}

// The hitpoints the HUD says, whole: never 0 while there are any left, as regeneration's slivers
// can leave a hero alive on less than half of one
export function getShownHp(hp: number): number {
    return hp > 0 ? Math.max(1, Math.round(hp)) : 0;
}

// The first of the map's objectives that isn't done (MapDef.objectives), with how many of its
// lairs are beaten
export function getObjectiveView(sim: Sim): HudNumbers["objective"] {
    for (const { text, lairs } of sim.map.objectives ?? []) {
        const done = lairs.filter((id) => sim.lairById(id)?.state === "beaten").length;
        if (done < lairs.length) {
            return { text, done, count: lairs.length };
        }
    }
    return undefined;
}

// What a fight on its hitpoints shows on its bar: all of them, or with BossPhasesDef.barPerPhase
// the phase's own share, full as it begins and empty at the next threshold (each phase's until,
// or an even split, as Sim.passThreshold has them)
export function getPhaseBarFraction(boss: Enemy, index: number): number {
    const phases = boss.def.boss?.phases;
    if (!phases?.barPerPhase) {
        return boss.hp / boss.maxHp;
    }
    const count = phases.phases.length;
    const until = (i: number) =>
        i < 0 ? 1 : i >= count - 1 ? 0 : (phases.phases[i].until ?? (count - 1 - i) / count);
    const top = until(index - 1) * boss.maxHp;
    const bottom = until(index) * boss.maxHp;
    return Math.min(1, Math.max(0, (boss.hp - bottom) / Math.max(1, top - bottom)));
}

// Boss attacks' instructions (GameClient.showInstruction): each up this long, the next no sooner
// than this after it (so two at most are up, the older going), one that's waited longer than
// this in play is dropped, and one's been read once it's been up this long in play
const INSTRUCTION_MS = 4500;
const INSTRUCTION_GAP_MS = 3000;
const INSTRUCTION_STALE_MS = 12000;
const INSTRUCTION_READ_MS = 3000;
const INSTRUCTION_FRAME_MS = 250;

export class GameClient implements GameFrameHandler {
    static async create(
        mapViewer: MapViewer,
        renderer: GameWebGLRenderer,
        overlayCanvas: HTMLCanvasElement,
        store: GameStore,
        saveStore: SaveStore,
        saveLock: SaveLock,
        options: GameClientOptions,
    ): Promise<GameClient> {
        // Before the first map squares load, so they're only what the title screen needs
        setPlayArea(renderer, getArenaRegion(TITLE_MAP), false);
        const workerPool = mapViewer.workerPool;
        const regionPromise = workerPool.queueLoad<RegionDataInput, RegionData, RegionDataLoader>(
            new RegionDataLoader(),
            getArenaRegion(TITLE_MAP),
        );

        const audio = new GameAudio();
        const soundsPromise = audio.load(workerPool, getGameSoundIds());

        const actors = await renderer.getActorRenderer();
        const assets = new GameAssets(workerPool, renderer, actors);
        const spritesPromise = assets.loadSprites();
        store.set({ loadingText: t("canvas.loading_monsters"), loadingProgress: 10 });
        await assets.loadBase((done, total) => {
            store.set({ loadingProgress: 10 + Math.round((done / total) * 70) });
        });
        store.set({ loadingText: t("canvas.loading_dressing"), loadingProgress: 85 });
        await assets.setCharacterLook(
            store.getSnapshot().characterId,
            store.getSnapshot().save.look,
        );
        store.set({
            loadingText: t("canvas.loading_building", { name: tl(TITLE_MAP.name) }),
            loadingProgress: 95,
        });
        const grid = new ArenaGrid(await regionPromise);
        await soundsPromise;
        await spritesPromise;

        return new GameClient(
            mapViewer,
            renderer,
            grid,
            assets,
            audio,
            overlayCanvas,
            store,
            saveStore,
            saveLock,
            options,
        );
    }

    readonly input: GameInput;
    readonly overlay: Overlay;
    readonly view: GameView;
    readonly minimap: Minimap;
    readonly sounds: GameSounds;
    readonly cameraRig = new CameraRig();
    // The map's opening cinematic while it plays (MapDef.cinematic), or its lair's (LairDef.opening,
    // LairUnsealingDef), and its own camera, so the run's (and the player's zoom) is left as it was
    cinematic?: CinematicPlayer;
    private readonly cinematicRig = new CameraRig();
    // While what it sees loads, behind the loading screen: since when (performance.now)
    private cinematicLoading?: number;
    // The tick the lair woke whose opening's been played (Lair.wakeTick), and the tick the lair was
    // unsealed whose cinematic has (Lair.unsealTick), so each plays once; and the tick the one
    // playing is from, whose clock is the sim's
    private lairOpeningTick = -1;
    private lairUnsealTick = -1;
    private lairCinematicTick = 0;
    // Dev only: the shot editor, while it's open (direct), with the cinematic it holds as
    // this.cinematic; and its shots' versions (shotsVersion) last loaded along the way and last
    // seen, and when they were seen to change (ms)
    director?: CinematicDirector;
    private directorPins = { pinned: -1, seen: -1, changed: 0 };
    // Dev only: a trailer being recorded from the shot editor (recordTrailer). rolling: its frames
    // are being drawn; live: the run steps meanwhile.
    private trailer?: { recorder: TrailerRecorder; live: boolean; rolling: boolean };

    sim?: Sim;
    paused = false;
    save: SaveData;
    // The save was written by a newer version of the game, so it's not saved
    // over (unless the player says so, see saveOverNewer)
    private newerSave?: NewerSave;
    // The save couldn't be read and there was no room to keep a copy, so it
    // stays as it is
    private saveNoRoom = false;
    private stopSaveLock?: () => void;
    // Cloud save, where the build has a Worker for it
    readonly cloud?: CloudSync;
    // Co-op: the room and its relay, and the run being played with it
    readonly coop: CoopLobby;
    private coopRun?: CoopRun;
    private movementDiagnostics = false;
    private reportRun?: ReturnType<typeof startRunAnalytics>;
    // The hero the camera follows: this player's, or in co-op while they're
    // down, a teammate's
    private viewHero = 0;
    // What the run's waiting on, last shown (co-op choices come in frames)
    private decisionKey = "";

    private accumulator = 0;
    private lastHudUpdate = 0;
    // Co-op: the living boss on the boss bar (getCoopBarBoss)
    private coopBarBoss: Enemy | undefined;
    // Where the camera thinks the ground is, on a dev map
    private cameraGround: number | undefined;
    // How far the camera's leaning towards a boss that asks for it (BOSS_LEAN)
    private cameraLean = { x: 0, y: 0 };
    // Where a raid boss's head was on the screen (getRaidRoomLean), and the boss bar's bottom
    private readonly leanPoint: ScreenPoint = { x: 0, y: 0, visible: false };
    private bossBarBottom?: { y: number; at: number };
    // How far north of the player last frame's camera was, all told (its lean and any shake)
    private cameraOffsetY = 0;
    // How lit a gaze has the arena now (getGazeLight, eased)
    private gazeLight = 1;
    // The camera's shake: how hard (0 to 1), and since when (ms)
    private shake = { strength: 0, start: 0 };
    private shownDps = 0;
    // The world's brightness as last set: a raid hall can draw darker than its map
    private shownBrightness = 1;
    // The raid hall's colour wash as last set (RaidRoomDef.hall)
    private shownWash: string | undefined;
    // A lit map's lights (MapDef.lighting), picked each frame for the shaders
    private readonly sceneLights = new SceneLights(new LightBudget(MAX_SHOWN_LIGHTS));
    private shownDpsTick = 0;
    private readonly damageMeter = new DamageMeter();
    // What the run's remixes and invasion bring on (travelTo), and how far through the Tombs its
    // enemies are baked for (followTombs)
    private runEnemyContent: unknown[] = [];
    private tombsStage: string | undefined;
    // Each hero's look, as last baked
    private appearanceVersions: number[] = [];
    // Each hero's level-up choices their look was last baked for
    private lookChoices: (UpgradeChoice[] | undefined)[] = [];
    // Each hero's body and outfit from the Wardrobe, for the run, in the party's order
    private heroLooks: (WardrobeLook | undefined)[] = [];
    // A look the Wardrobe's trying on, shown on the menus in place of the saved one till it's done
    private previewedLook?: WardrobeLook;
    // The Wardrobe's showing the body alone, with nothing on (its Appearance tab)
    private bareMenuLook = false;
    // Which way the adventurer's turned in the Wardrobe (an actor's yaw), and the way they face
    // now, on their way round to it (and back to the front once it's left)
    private wardrobeTurn = 0;
    private menuModelYaw = 0;
    // How far the title camera's come in for the Wardrobe, 0 to 1
    private wardrobeZoom = 0;
    // The casket Auto alch or Auto equip answered, until that's done (co-op's
    // comes back with a frame: it shouldn't go twice, or show the casket
    // meanwhile)
    private autoChest?: { uid: number; action: ChestAction };
    private runRecorded = false;
    // The weekly Vault's week, while its run's the one going (content/vault.ts)
    private runVault?: string;
    // The Forgotten Four, while it's being run (content/gauntlet.ts), and its camp's timer
    private gauntletRun?: GauntletRun;
    private campTimer?: number;
    // Boss attacks' instructions (BossAttackDef.message): each shown once a run, and one at a
    // time, each held long enough to read, as a busy phase can bring several at once. Those
    // waiting too long are dropped: the attack they were for is long gone.
    private readonly instructionsSeen = new Set<string>();
    private instructions: { text: string; waited: number }[] = [];
    // Those up now and not read yet: each one's toast, and how long it's been up in play
    private instructionsUp: { text: string; toast: number; played: number }[] = [];
    private instructionShownAt = -Infinity;
    private instructionPumpedAt = 0;

    private queueInstruction(text: string): void {
        if (this.instructionsSeen.has(text) || this.instructions.some((i) => i.text === text)) {
            return;
        }
        this.instructions.push({ text, waited: 0 });
        this.showInstruction(performance.now());
    }

    // The next instruction, once the last has had its time, while the run's being played. One
    // waits only while it's played (not behind a level up or the menu), and counts as read once
    // it's been up long enough in play, so none is lost behind a pause.
    private showInstruction(now: number): void {
        const playing = this.isPlaying();
        // At most a moment's worth a frame: back from a hidden tab, the time away isn't waiting
        const since = Math.min(INSTRUCTION_FRAME_MS, Math.max(0, now - this.instructionPumpedAt));
        this.instructionPumpedAt = now;
        if (playing) {
            for (const up of this.instructionsUp) {
                up.played += since;
            }
        }
        this.instructionsUp = this.instructionsUp.filter((up) => up.played < INSTRUCTION_READ_MS);
        // Not read yet, and gone or behind something: the level up or the menu covers it, or newer
        // notices pushed it off (the store keeps four). Back to the front of the line, to come
        // straight back once it's played again.
        const toasts = this.store.getSnapshot().toasts;
        const unread = this.instructionsUp.filter(
            (up) => !playing || !toasts.some((t) => t.id === up.toast),
        );
        if (unread.length > 0) {
            for (const up of unread) {
                this.store.dismissToast(up.toast);
                this.instructionsSeen.delete(up.text);
            }
            this.instructionsUp = this.instructionsUp.filter((up) => !unread.includes(up));
            this.instructions.unshift(...unread.map((up) => ({ text: up.text, waited: 0 })));
            this.instructionShownAt = -Infinity;
        }
        if (playing) {
            for (const waiting of this.instructions) {
                waiting.waited += since;
            }
            this.instructions = this.instructions.filter((i) => i.waited < INSTRUCTION_STALE_MS);
        }
        if (
            !playing ||
            this.instructions.length === 0 ||
            now - this.instructionShownAt < INSTRUCTION_GAP_MS
        ) {
            return;
        }
        const next = this.instructions.shift()!;
        this.instructionsSeen.add(next.text);
        this.instructionShownAt = now;
        const toast = this.store.toast(next.text, INSTRUCTION_MS);
        this.instructionsUp.push({ text: next.text, toast, played: 0 });
    }

    // A fight's own button's been used this session (MapDef.fight.ability): its hint's no longer
    // shown (AbilityView.hint)
    private abilityUsed = false;
    // The tick the boss on the bar was first up, in this sim, since there was none: the ability
    // hint's clock. A fight's start, not the run's: the Tombs' Nexus comes before each boss.
    private bossUp?: { sim: Sim; tick: number };
    // The toast saying the sound's on or off, if one's up (see toggleMute)
    private soundToast?: number;
    // Adventurers this run has done the task for, already told about
    private tasksAnnounced = new Set<string>();
    private attractTick = 0;
    private attractYaw = 0;
    private display = loadDisplaySettings();
    private readonly move = { x: 0, y: 0 };
    private readonly screen: ScreenPoint = { x: 0, y: 0, visible: false };
    private fps = 60;
    // The HUD's minimap, while it's on screen
    private minimapCanvas?: HTMLCanvasElement;
    // Collision for each map, built the first time a run goes there
    private readonly grids = new Map<string, ArenaGrid>();
    // The current map's: the run's, or the title screen's
    grid: ArenaGrid;

    constructor(
        readonly mapViewer: MapViewer,
        readonly renderer: GameWebGLRenderer,
        titleGrid: ArenaGrid,
        readonly assets: GameAssets,
        readonly audio: GameAudio,
        overlayCanvas: HTMLCanvasElement,
        readonly store: GameStore,
        readonly saveStore: SaveStore,
        readonly saveLock: SaveLock,
        readonly options: GameClientOptions,
    ) {
        this.save = store.getSnapshot().save;
        setGauntletLooks(hasGauntletLooks(this.save));
        this.grid = titleGrid;
        this.grids.set(TITLE_MAP.id, titleGrid);
        this.sounds = new GameSounds(audio);
        store.set({ audio: audio.settings, display: this.display });
        this.view = new GameView(assets);
        this.minimap = new Minimap(mapViewer);
        this.overlay = new Overlay(overlayCanvas);
        this.input = new GameInput(renderer.canvas);
        this.input.onPress = (code) => this.pressKey(code);
        this.input.takesKey = (code) => code === "Tab" && this.isPlaying();
        this.input.pads.onConnect = (pad) =>
            this.store.toast(
                pad.standard
                    ? t("toast.controller_connected", { name: pad.name })
                    : t("toast.controller_unknown", { name: pad.name }),
                pad.standard ? 3000 : 7000,
            );
        // A controller going flat mid-run pauses it, as leaving the window does
        this.input.pads.onDisconnect = (pad) => {
            this.store.toast(t("toast.controller_disconnected", { name: pad.name }), 4000);
            if (this.sim && !this.coopRun && this.store.getSnapshot().overlay === "none") {
                this.pause();
            }
        };
        this.input.onBlur = () => {
            this.accumulator = 0;
            // With auto-pause off the run carries on (though a hidden tab
            // stops drawing, so it waits there until it's back). Co-op never
            // pauses for one player.
            if (
                this.sim &&
                !this.coopRun &&
                this.display.pauseOnBlur &&
                this.store.getSnapshot().overlay === "none"
            ) {
                this.pause();
            }
        };
        this.coop = new CoopLobby(store);
        this.coop.onStart = (game) => this.beginCoopRun(game);
        this.coop.onUp = (from, message) => this.toCoopRun((run) => run.receiveUp(from, message));
        this.coop.onDown = (message) => this.toCoopRun((run) => run.receiveDown(message));
        this.coop.onLeft = (id) => this.toCoopRun((run) => run.playerLeft(id));
        this.coop.onGone = (reason) => this.onCoopGone(reason);
        this.coop.onClosed = () => this.onCoopClosed();
        this.coop.onReconnecting = () => {
            if (this.coopRun) {
                this.store.toast(t("toast.reconnecting"), 4000);
            }
        };
        this.coop.onResumed = () => {
            if (this.coopRun) {
                this.store.toast(t("toast.reconnected"), 2000);
            }
            this.toCoopRun((run) => run.resumed());
        };
        this.coop.onMapChanged = () => this.coop.setMe({ loadout: this.getLoadout() });
        // A guest's cards go by the host's tab (roomPlaysCardsOnly)
        this.coop.onRoomCardsOnlyChanged = () => {
            // Ready no longer, without the cards a Cards only room now takes
            const me = this.coop.room?.members.find((m) => m.id === this.coop.id);
            if (this.coopCardBlock() !== undefined && me?.ready) {
                this.coop.setReady(false);
            }
            this.refreshCoopLoadout();
        };
        // Co-op's offered only where there's a relay to play it through
        this.coop.checkAvailable();
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        if (CLOUD_SAVE_URL) {
            this.cloud = new CloudSync(CLOUD_SAVE_URL, {
                gameVersion: this.saveStore.gameVersion,
                save: () => this.save,
                canWrite: () => this.canPersist(),
                apply: (save) => this.replaceSave(save),
                onView: (cloud) => this.store.set({ cloud }),
            });
            this.cloud.start();
        }
        this.cameraRig.pitch = ATTRACT_PITCH;
        this.cameraRig.distance = ATTRACT_DISTANCE;
        // Before a run starts, so it's with the save as it is now
        this.stopSaveLock = this.saveLock.listen((held) => this.onSaveLock(held));

        // An invite link (?room=CODE) goes straight to the room
        const invite = new URLSearchParams(window.location.search).get("room");
        if (options.autostart) {
            this.store.set({ characterId: options.autostart });
            this.startRun();
        } else if (options.director) {
            void this.direct(options.director);
        } else if (invite) {
            this.openCoop().then(() => this.joinRoom(invite));
        } else {
            this.showScreen("title");
        }
    }

    setMinimapCanvas(canvas: HTMLCanvasElement | null): void {
        this.minimapCanvas = canvas ?? undefined;
    }

    dispose(): void {
        this.stopSaveLock?.();
        this.cloud?.stop();
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        this.stopCoopTicker();
        this.coop.close();
        this.input.dispose();
        this.audio.dispose();
        if (this.renderer.game === this) {
            this.renderer.game = undefined;
        }
    }

    // ---- UI actions ----

    showScreen(screen: Screen): void {
        const was = this.store.getSnapshot().screen;
        this.store.set({ screen });
        // Done shopping: a save point for cloud save
        if ((was === "shop" || was === "armoury" || was === "wardrobe") && screen !== was) {
            this.cloud?.savePoint();
        }
        // Out of the Wardrobe, what was tried on comes off
        if (was === "wardrobe" && screen !== was && (this.previewedLook || this.bareMenuLook)) {
            this.previewedLook = undefined;
            this.bareMenuLook = false;
            this.refreshMenuLook();
        }
    }

    // The adventurer the game starts on (or none, to start on the first again)
    toggleFavouriteCharacter(characterId: string): void {
        if (!this.save.unlockedCharacters.includes(characterId)) {
            return;
        }
        this.save.favouriteCharacter =
            this.save.favouriteCharacter === characterId ? undefined : characterId;
        this.persist();
    }

    selectCharacter(characterId: string): void {
        // Unlocked, and one the game has: an old save keeps the retired Dwarf unlocked
        if (
            !this.save.unlockedCharacters.includes(characterId) ||
            !CHARACTER_BY_ID.has(characterId)
        ) {
            return;
        }
        this.store.set({ characterId });
        if (!this.sim) {
            this.refreshMenuLook();
        }
        this.coop.setMe({ characterId, loadout: this.getLoadout() });
    }

    // ---- The Wardrobe ----

    // The look on the menus: one being tried on, or the saved one
    private getMenuLook(): WardrobeLook | undefined {
        return this.previewedLook ?? this.save.look;
    }

    private refreshMenuLook(): void {
        if (!this.sim) {
            this.assets.setCharacterLook(
                this.store.getSnapshot().characterId,
                this.getMenuLook(),
                this.bareMenuLook,
            );
        }
    }

    // Wears this body and outfit from now on, on every adventurer. Pieces that can't be worn (not
    // bought, nor an unlocked adventurer's) are left off.
    setLook(look: WardrobeLook | undefined): void {
        const worn = cleanLook(look, (objId) => canWearCosmetic(this.save, objId));
        if (worn) {
            this.save.look = worn;
        } else {
            delete this.save.look;
        }
        this.previewedLook = undefined;
        this.persist();
        this.refreshMenuLook();
        this.coop.setMe({ loadout: this.getLoadout() });
    }

    // Shows a look on the menus without keeping it (a piece in the store, tried on), or the saved
    // one again
    previewLook(look: WardrobeLook | undefined): void {
        this.previewedLook = look && cleanLook(look);
        this.refreshMenuLook();
    }

    // The body alone on the menus, with nothing worn over it, or dressed again
    showBareBody(bare: boolean): void {
        if (this.bareMenuLook !== bare) {
            this.bareMenuLook = bare;
            this.refreshMenuLook();
        }
    }

    // The outfit worn now, kept under this name (over one of that name)
    saveOutfit(name: string): boolean {
        const outfits = saveOutfit(this.save.outfits ?? [], name, this.save.look);
        if (!outfits) {
            return false;
        }
        this.save.outfits = outfits;
        this.persist();
        return true;
    }

    // A saved outfit put on, in place of what's worn
    wearOutfit(name: string): void {
        const saved = this.save.outfits?.find((o) => o.name === name);
        if (saved) {
            this.setLook(wearOutfit(this.save.look, saved));
        }
    }

    deleteOutfit(name: string): void {
        const outfits = this.save.outfits ?? [];
        const left = outfits.filter((o) => o.name !== name);
        if (left.length === outfits.length) {
            return;
        }
        // None left is none at all, as a save loads it
        this.save.outfits = left.length > 0 ? left : undefined;
        this.persist();
    }

    // Buys a piece in the Wardrobe's store
    buyCosmetic(objId: number): boolean {
        if (!buyCosmetic(this.save, objId)) {
            this.sounds.denied();
            return false;
        }
        this.sounds.buy();
        this.persist();
        return true;
    }

    // Buys a pack in the Card shop with coins and opens it straight away (core/cards.ts): its
    // cards, or undefined if it can't be bought
    buyCardPack(pack: PackDef): PackCard[] | undefined {
        const cards = buyCardPack(this.save, pack, Math.random);
        if (!cards) {
            this.sounds.denied();
            return undefined;
        }
        this.sounds.cardPack();
        this.persist();
        this.refreshCoopLoadout();
        return cards;
    }

    // In a co-op room, this player's loadout sent again: their cards changed (a pack bought from
    // the lobby's needs), or the room's Cards only did
    private refreshCoopLoadout(): void {
        if (this.coop.room) {
            this.coop.setMe({ loadout: this.getLoadout() });
        }
    }

    // The Cards screen's shop, on a pack (what Card collection only's needs point at)
    openCardShop(packId?: string): void {
        this.store.set({
            cardShopPack: packId ?? "",
            cardShopFrom: this.store.getSnapshot().screen,
        });
        this.showScreen("cards");
    }

    // The Cards screen has shown the pack it was opened on: the next time, it opens as usual
    cardShopShown(): void {
        this.store.set({ cardShopPack: undefined, cardShopFrom: undefined });
    }

    // The adventurer panel's tab: Cards only, or the usual (kept in the save)
    setCardsOnly(on: boolean): void {
        if ((this.save.cardsOnly === true) === on) {
            return;
        }
        this.save.cardsOnly = on || undefined;
        this.persist();
        // A co-op player's loadout carries it
        if (this.coop.room) {
            this.coop.setMe({ loadout: this.getLoadout() });
        }
    }

    // Whether the co-op room is on the weekly Vault's map for it, which never plays Cards only
    isVaultRoom(): boolean {
        const key = this.store.getSnapshot().vaultRoom;
        const room = this.coop.room;
        return key !== undefined && room !== undefined && getVault(key)?.mapId === room.mapId;
    }

    // Whether this player's runs are Cards only: their own tab's choice, or in a co-op room the
    // host's, for everyone (roomPlaysCardsOnly)
    playsCardsOnlyHere(): boolean {
        const room = this.coop.room;
        return room && !this.coop.isHost ? roomPlaysCardsOnly(room) : this.save.cardsOnly === true;
    }

    // The save as the Cards only tab that applies here sees it (playsCardsOnlyHere): a guest's
    // own tab doesn't count in a room
    cardsSave(): SaveData {
        const on = this.playsCardsOnlyHere();
        return on === (this.save.cardsOnly === true)
            ? this.save
            : { ...this.save, cardsOnly: on || undefined };
    }

    cardRunCaps(characterId: string): Map<string, Rarity> | undefined {
        if (!this.playsCardsOnlyHere()) {
            return undefined;
        }
        const caps = getCardCaps(this.save);
        return getCardRunShortfall(this.save, characterId, caps) ? undefined : caps;
    }

    // Opens one of the save's card packs (core/cards.ts): its cards, or undefined with none held
    openCardPack(): PackCard[] | undefined {
        const cards = openCardPack(
            this.save,
            Math.random,
            undefined,
            getStarterCards(getStartingCharacter(this.save)),
        );
        if (!cards) {
            this.sounds.denied();
            return undefined;
        }
        this.sounds.cardPack();
        this.persist();
        this.refreshCoopLoadout();
        return cards;
    }

    // A card of an opened pack turned over
    revealCard(rarity: Rarity): void {
        this.sounds.cardReveal(rarity);
    }

    // The dev server with ?devtools on the address: god mode, the Tombs' skips and jumps (and an
    // act that isn't out yet, isActOut). Without
    // it the dev server plays as players will (the Tombs of Amascut, listed with the raids, has none
    // of its testing buttons), phones on the tunnel included.
    get devTools(): boolean {
        return (
            import.meta.env.DEV &&
            typeof location !== "undefined" &&
            new URLSearchParams(location.search).has("devtools")
        );
    }

    // Dev only: god mode, nothing hurting the player (Sim.devGod), for watching a fight
    toggleDevGod(): void {
        const sim = this.sim;
        if (this.devTools && !this.coopRun && sim) {
            sim.devGod = !sim.devGod;
            this.updateHud(true);
        }
    }

    // Dev only: to the Wardens, with the best of everything or as the run is (Sim.devToWardens)
    devToWardens(kit = true): void {
        if (this.devTools && !this.coopRun) {
            this.sim?.devToWardens(kit);
            this.updateHud(true);
        }
    }

    // Dev only: from the Nexus straight to a path's boss (Sim.devToTombsBoss)
    devToTombsBoss(pathId: string): void {
        if (this.devTools && !this.coopRun) {
            this.sim?.devToTombsBoss(pathId);
            this.updateHud(true);
        }
    }

    // Dev only: past the Tombs room to its boss (Sim.devSkipToTombsBoss)
    devSkipToTombsBoss(): void {
        if (this.devTools && !this.coopRun) {
            this.sim?.devSkipToTombsBoss();
        }
    }

    // The Tombs of Amascut's invocation board: on if it was off (taking off any it can't be on
    // with), off if it was on
    toggleInvocation(id: string): void {
        this.save.invocations = toggleInvocation(this.save.invocations ?? [], id);
        this.persist();
        this.invocationsChanged();
    }

    clearInvocations(): void {
        this.save.invocations = [];
        this.persist();
        this.invocationsChanged();
    }

    // The board as it is, saved as a preset (named, or by its raid level), over one of that name.
    // Presets go by their names, which are unique. Nothing when there's no room for another.
    saveInvocationPreset(name: string): void {
        const presets = saveInvocationPreset(
            this.save.invocationPresets ?? [],
            name,
            this.save.invocations ?? [],
        );
        if (presets) {
            this.save.invocationPresets = presets;
            this.persist();
        }
    }

    // A preset's invocations on the board, in place of what was on it
    loadInvocationPreset(name: string): void {
        const preset = this.save.invocationPresets?.find((p) => p.name === name);
        if (!preset) {
            return;
        }
        this.save.invocations = [...preset.invocations];
        this.persist();
        this.invocationsChanged();
    }

    deleteInvocationPreset(name: string): void {
        const presets = this.save.invocationPresets ?? [];
        const left = presets.filter((p) => p.name !== name);
        if (left.length === presets.length) {
            return;
        }
        // None left is none at all, as a save loads it
        this.save.invocationPresets = left.length > 0 ? left : undefined;
        this.persist();
    }

    // A run's invocations, on a map from the Desert on (content/invocations.ts, RUN_SET): on if it
    // was off, off if it was on. Hard mode's are the Hard switch's, not the board's.
    toggleRunInvocation(id: string): void {
        if (isHardInvocation(id)) {
            this.toggleHard();
            return;
        }
        this.save.runInvocations = cleanRunInvocations(
            toggleInvocation(this.save.runInvocations ?? [], id, RUN_SET),
        );
        this.persist();
        this.invocationsChanged();
    }

    clearRunInvocations(): void {
        this.save.runInvocations = [];
        this.persist();
        this.invocationsChanged();
    }

    // A relic picked for its tier (content/relics.ts), or the tier left empty; only an open tier's
    selectRelic(tier: RelicTier, relicId: string | undefined): void {
        if (tier > getOpenRelicTiers(this.save.mapVictories)) {
            return;
        }
        const relics = pickRelic(this.save.relics ?? [], tier, relicId);
        this.save.relics = relics.length > 0 ? relics : undefined;
        this.persist();
        this.coop.setMe({ loadout: this.getLoadout() });
    }

    // The relics a run here starts with: the open tiers' picks, on a map that takes them
    private runRelics(map: MapDef): string[] | undefined {
        if (!takesRelics(map)) {
            return undefined;
        }
        const relics = cleanRelics(this.save.relics, getOpenRelicTiers(this.save.mapVictories));
        return relics.length > 0 ? relics : undefined;
    }

    // In a room, the lobby's told (its raid level goes by the host's: Loadout.invocations)
    private invocationsChanged(): void {
        if (this.coop.room) {
            this.coop.setMe({ loadout: this.getLoadout() });
        }
    }

    // An act's ending told again from its card, once the act's done; closed with no id
    showActEnding(actId: string | undefined): void {
        const act = actId === undefined ? undefined : ACT_BY_ID.get(actId);
        if (act && !isActEnded(act, this.save.mapVictories)) {
            return;
        }
        this.store.set({ actEnding: act?.id });
    }

    // The pet a Card collection only run takes along: one whose card is owned, or none
    selectCardsOnlyPet(petId: string | undefined): void {
        if (petId !== undefined && !hasPetCard(this.save, petId)) {
            this.sounds.denied();
            return;
        }
        this.save.cardsOnlyPet = petId;
        this.persist();
        this.coop.setMe({ loadout: this.getLoadout() });
    }

    // The pet to take along (one of the trophies found), or none
    selectPet(petId: string | undefined): void {
        if (petId !== undefined && !isPetFound(this.save.trophies, petId)) {
            return;
        }
        this.save.pet = petId;
        this.persist();
        this.coop.setMe({ loadout: this.getLoadout() });
    }

    // The map for the next run. Hosting a room, it's the room's map: the relay
    // says it back in a room update, which the lobby shows, so nothing's
    // changed here until it has. Endless and hard mode stay on where everyone
    // has them for the new map, as the relay insists.
    selectMap(mapId: string): void {
        if (!isMapUnlocked(this.save, mapId)) {
            return;
        }
        const room = this.hostedRoom();
        if (room) {
            if (!isCoopMap(getMap(mapId))) {
                this.sounds.denied();
                return;
            }
            // Another map: the room's next run isn't the Vault's any more
            this.store.set({ vaultRoom: undefined });
            this.coop.setMap(
                mapId,
                room.endless && this.roomHas("endless", mapId),
                room.hard && this.roomHas("hard", mapId),
            );
            return;
        }
        const snapshot = this.store.getSnapshot();
        this.store.set({
            mapId,
            endless: snapshot.endless && isEndlessUnlocked(this.save, mapId),
            hard: snapshot.hard && isHardUnlocked(this.save, mapId),
            expert: snapshot.expert && isExpertUnlocked(this.save, mapId),
            remixes: this.openRemixes(mapId, snapshot.remixes),
            awaken: snapshot.awaken && canAwaken(this.save, mapId),
        });
    }

    // An Awakener's orb on the map's final boss, for the next run (solo: an orb's the player's own)
    toggleAwaken(): void {
        const { mapId, awaken } = this.store.getSnapshot();
        this.store.set({ awaken: !awaken && canAwaken(this.save, mapId) && !this.coop.room });
    }

    // Of these remixes, those open on the map (content/remixes.ts, isRemixOpen)
    private openRemixes(mapId: string, ids: readonly string[]): RemixId[] {
        const map = getMap(mapId);
        return cleanRemixes(ids).filter((id) => isRemixOpen(this.save.mapVictories, map, id));
    }

    // A remix's switch on the map's card, once it's open there. In a room the host's go on the run
    // (GameStart.remixes), as their invocations do.
    toggleRemix(id: RemixId): void {
        const { mapId, remixes } = this.store.getSnapshot();
        if (remixes.includes(id)) {
            this.store.set({ remixes: remixes.filter((r) => r !== id) });
        } else if (isRemixOpen(this.save.mapVictories, getMap(mapId), id)) {
            this.store.set({ remixes: cleanRemixes([...remixes, id]) });
        }
    }

    // Endless runs, for a map that's been beaten (the room's, hosting one)
    toggleEndless(): void {
        const room = this.hostedRoom();
        if (room) {
            if (room.endless || this.roomHas("endless", room.mapId)) {
                this.coop.setMap(room.mapId, !room.endless, room.hard);
            }
            return;
        }
        const { mapId, endless } = this.store.getSnapshot();
        if (endless || isEndlessUnlocked(this.save, mapId)) {
            this.store.set({ endless: !endless });
        }
    }

    // Hard mode, for a map that's been beaten (the room's, hosting one)
    toggleHard(): void {
        const room = this.hostedRoom();
        if (room) {
            if (room.hard || this.roomHas("hard", room.mapId)) {
                this.coop.setMap(room.mapId, room.endless, !room.hard);
            }
            return;
        }
        const { mapId, hard } = this.store.getSnapshot();
        if (hard || isHardUnlocked(this.save, mapId)) {
            // Expert is hard mode too: off with it
            this.store.set(hard ? { hard: false, expert: false } : { hard: true });
        }
    }

    // A raid's expert mode, once it's been beaten on hard. Solo only for now: co-op's rooms
    // don't carry it.
    toggleExpert(): void {
        const { mapId, expert, hard } = this.store.getSnapshot();
        if (expert || isExpertUnlocked(this.save, mapId)) {
            // Expert's hard mode too
            this.store.set({ expert: !expert, hard: !expert || hard });
        }
    }

    // The room this player hosts, whose map and modes are the relay's to
    // change
    private hostedRoom(): RoomView | undefined {
        return this.coop.isHost ? this.coop.room : undefined;
    }

    // Whether a map's endless or hard mode can be on in the room: this player
    // has it, and so does everyone else (unless the relay takes anyone), as
    // the relay checks before it takes a setting
    private roomHas(mode: "endless" | "hard", mapId: string): boolean {
        const mine =
            mode === "endless"
                ? isEndlessUnlocked(this.save, mapId)
                : isHardUnlocked(this.save, mapId);
        const { room, anyMap } = this.store.getSnapshot().coop;
        return (
            mine &&
            (anyMap ||
                !room ||
                room.members.every((member) => member.unlocks?.[mode]?.includes(mapId) === true))
        );
    }

    // ---- Co-op menus ----

    // The co-op screen, connected to the relay
    async openCoop(): Promise<void> {
        this.showScreen("coop");
        this.coop.setMe({
            characterId: this.store.getSnapshot().characterId,
            loadout: this.getLoadout(),
            unlocks: this.getUnlocks(),
            hideCountry: !this.display.coopFlag,
        });
        await this.coop.connect();
    }

    // Back to the title, out of any room
    closeCoop(): void {
        if (this.coop.room) {
            this.coop.leave();
        }
        this.coop.close();
        this.showScreen("title");
    }

    // Another name from the relay
    renameCoop(): void {
        this.coop.rename();
    }

    // A room of this player's, for the map picked
    createRoom(open: boolean): void {
        const { mapId, endless, hard } = this.store.getSnapshot();
        // A solo-only fight picked on your own: the room starts on the first map instead
        if (!isCoopMap(getMap(mapId))) {
            this.coop.create(open, MAPS[0].id, false, false);
            return;
        }
        this.coop.create(open, mapId, endless, hard);
    }

    // Another page of the open rooms
    showRoomsPage(page: number): void {
        this.coop.showPage(page);
    }

    joinRoom(code: string): void {
        this.coop.join(code);
    }

    leaveRoom(): void {
        this.coop.leave();
    }

    setCoopReady(ready: boolean): void {
        // A Cards only room, without the cards it takes for their adventurer: they can't ready
        if (ready && this.coopCardBlock() !== undefined) {
            this.sounds.denied();
            return;
        }
        this.coop.setReady(ready);
    }

    // In a room that plays Cards only, the adventurer this player can't play it as (their starter
    // cards or a level up's missing, isCardRunBlocked), or undefined if they can
    coopCardBlock(): string | undefined {
        const room = this.coop.room;
        if (!room || this.isVaultRoom()) {
            return undefined;
        }
        const map = getMap(room.mapId);
        const characterId =
            getMapCharacter(map) ?? map.fun?.character ?? this.store.getSnapshot().characterId;
        return isCardRunBlocked(this.cardsSave(), characterId, map) ? characterId : undefined;
    }

    setRoomOpen(open: boolean): void {
        this.coop.setOpen(open);
    }

    kickPlayer(id: string): void {
        this.coop.kick(id);
    }

    disbandRoom(): void {
        this.coop.disband();
    }

    // The invite link for the room, for its code
    getInviteLink(code: string): string {
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("room", code);
        return url.toString();
    }

    // The maps this player has, and has endless and hard mode for, which rooms
    // go by
    private getUnlocks(): Unlocks {
        const ids = [...MAPS, ...RAID_MAPS, ...FUN_MAPS].filter(isCoopMap).map((m) => m.id);
        return {
            maps: ids.filter((id) => isMapUnlocked(this.save, id)),
            endless: ids.filter((id) => isEndlessUnlocked(this.save, id)),
            hard: ids.filter((id) => isHardUnlocked(this.save, id)),
        };
    }

    private getLoadout(): Loadout {
        const room = this.coop.room;
        const characterId =
            (room && getMap(room.mapId).fun?.character) ?? this.store.getSnapshot().characterId;
        // The adventurer the run's played as, for Card collection only's check
        const runCharacter = (room && getMapCharacter(getMap(room.mapId))) ?? characterId;
        const cardCaps = this.loadoutCardCaps(room && getMap(room.mapId), runCharacter);
        return makeLoadout(
            getMetaStats(this.save, getCharacter(characterId).style),
            [...this.save.unlockedItems],
            {
                ...this.save.armoury,
            },
            // Card collection only's own pet, with its card (getRunPet)
            getRunPet(this.save, cardCaps !== undefined),
            // A Tombs room's lobby shows the host's raid level, and a run's its invocation points
            room && getMap(room.mapId).tombs
                ? [...(this.save.invocations ?? [])]
                : room && takesInvocations(getMap(room.mapId))
                  ? [...(this.save.runInvocations ?? [])]
                  : undefined,
            getRaidChestTrophiesFound(this.save.trophies),
            this.save.look,
            room ? this.runRelics(getMap(room.mapId)) : undefined,
            cardCaps,
            // The host's tab sets the room's (roomPlaysCardsOnly)
            this.coop.isHost && this.save.cardsOnly === true,
        );
    }

    // Card collection only's caps for a co-op loadout: none on a map whose level ups are blessings
    private loadoutCardCaps(map: MapDef | undefined, characterId: string): string | undefined {
        // Not for an adventurer it can't start as (their starter cards missing): they play as usual
        const caps =
            map?.blessings || getCardLock(this.save, characterId)
                ? undefined
                : this.cardRunCaps(characterId);
        return caps && encodeCardCaps(caps);
    }

    // The host's Start: everyone's ready, so off to the room's map. The relay
    // sends the start back to everyone (this player too), and the run begins
    // there.
    startCoopRun(): void {
        const room = this.coop.room;
        if (!room || !this.coop.isHost) {
            return;
        }
        // Everyone's ready, the host too (on their own, that's a party of one)
        if (room.members.some((m) => !m.ready) || room.members.length > MAX_PARTY) {
            this.sounds.denied();
            return;
        }
        // A Cards only room: everyone's cards sent (a guest without them can't ready); never the
        // Vault's, which is the same run for everyone
        if (
            !this.isVaultRoom() &&
            roomPlaysCardsOnly(room) &&
            !getMap(room.mapId).blessings &&
            room.members.some((m) => typeof m.loadout?.cardCaps !== "string")
        ) {
            this.sounds.denied();
            return;
        }
        const map = getMap(room.mapId);
        if (!isMapUnlocked(this.save, map.id) || !isCoopMap(map)) {
            this.sounds.denied();
            return;
        }
        // The weekly Vault, if the room's on its map for it: its seed, remixes, invocations and
        // adventurer for everyone
        const vaultKey = this.store.getSnapshot().vaultRoom;
        const vault = vaultKey !== undefined ? getVault(vaultKey) : undefined;
        if (vault && vault.mapId === map.id) {
            this.coop.start({
                seed: vault.seed,
                mapId: map.id,
                endless: false,
                hard: false,
                invocations: vault.invocations,
                remixes: vault.remixes,
                vault: vault.key,
                heroes: room.members.map((member) => ({
                    id: member.id,
                    name: member.name,
                    characterId: vault.characterId,
                    loadout: member.loadout ?? makeLoadout({}, [], {}),
                })),
            });
            return;
        }
        const remixes = this.openRemixes(map.id, this.store.getSnapshot().remixes);
        // The room's modes, which the relay checked everyone has (or takes
        // anyone for, with anyMap), so the run is what the lobby said
        const { anyMap } = this.store.getSnapshot().coop;
        const game: GameStart = {
            seed: (Math.random() * 0x7fffffff) | 0,
            mapId: map.id,
            endless:
                map.fun !== undefined ||
                (room.endless && (anyMap || isEndlessUnlocked(this.save, map.id))),
            hard: room.hard === true && (anyMap || isHardUnlocked(this.save, map.id)),
            // An act's map is at the host's step (content/acts.ts)
            ...(map.act && { actStep: getActStep(map, this.save.mapVictories) }),
            stage: getFightStage(this.save, map.id),
            // The Tombs' raid level is the host's, as the invocation board set it, and so are a
            // run's invocations (the room's Hard is hard mode's), and its remixes
            ...(map.tombs && { invocations: this.save.invocations ?? [] }),
            ...(takesInvocations(map, remixes.length > 0) && {
                invocations: this.save.runInvocations ?? [],
            }),
            ...(remixes.length > 0 && { remixes }),
            ...(isInvasionOpen(this.save.mapVictories) && { invasions: true }),
            heroes: room.members.map((member) => ({
                id: member.id,
                name: member.name,
                characterId:
                    getMapCharacter(map) ??
                    (CHARACTERS.some((c) => c.id === member.characterId)
                        ? member.characterId
                        : CHARACTERS[0].id),
                loadout: member.loadout ?? makeLoadout({}, [], {}),
            })),
        };
        this.coop.start(game);
    }

    // Kicked or disbanded, or the host left: a run that was going ends
    private onCoopGone(reason: GoneReason): void {
        if (reason !== "left") {
            this.store.toast(tl(ENDED_EARLY[reason] ?? "You left the party."), 5000);
        }
        // A run that's still loading never starts
        this.coopInbox = undefined;
        if (this.coopRun && this.sim && !this.sim.runOver) {
            this.endCoopRunEarly(tl(ENDED_EARLY[reason] ?? "You left the party."));
        }
    }

    private onCoopClosed(): void {
        // A run that's still loading never starts
        this.coopInbox = undefined;
        const sim = this.sim;
        const run = this.coopRun;
        if (!sim || !run || sim.runOver) {
            return;
        }
        if (run.isHost) {
            // The run's this copy's: it goes on without the others
            for (const hero of sim.heroes) {
                if (hero.index !== sim.focus) {
                    sim.leave(hero.index);
                }
            }
            this.coopRun = undefined;
            // Solo now: rendering steps it, as any solo run
            this.stopCoopTicker();
            this.store.toast(t("toast.coop_lost_others"), 6000);
        } else {
            this.endCoopRunEarly(t("toast.coop_lost_server"));
        }
    }

    // A co-op run that can't go on (stuck, or cantCatchUp): out of the room,
    // which for the host ends it for everyone rather than leaving them waiting
    private endBrokenCoopRun(run: CoopRun): void {
        // A frame that won't step (an error in the game), or a guest that missed more of the
        // host's frames than it still has
        const why = t(run.stuck ? "coop.run_stuck" : "coop.run_cant_catch_up");
        console.error(
            `Co-op run ended: ${run.stuck ? "a frame kept failing to step" : "frames missing for good"}`,
        );
        this.coop.leave();
        if (this.runRecorded) {
            // Its results are up already, so they'd not say why
            this.store.toast(why, 6000);
        }
        this.endCoopRunEarly(why);
    }

    // A co-op run that can't go on for this player: what was done counts, as if they'd quit
    private endCoopRunEarly(why: string): void {
        // Nothing more of it is stepped, frames still to come included
        this.coopStopped = true;
        this.stopCoopTicker();
        this.finishRun(why);
        this.store.set({ overlay: "dead", choices: [], chest: undefined, waitingOn: [] });
        this.updateHud(true);
    }

    buyUpgrade(upgradeId: string, style: CombatStyle = "melee"): void {
        if (buyUpgrade(this.save, upgradeId, style)) {
            this.sounds.buy();
            this.persist();
        } else {
            this.sounds.denied();
        }
    }

    // Upgrades a piece of gear in the Armoury, one step
    upgradeGear(itemId: string): void {
        if (buyArmouryUpgrade(this.save, itemId)) {
            this.sounds.buy();
            this.persist();
        } else {
            this.sounds.denied();
        }
    }

    playClick(): void {
        this.sounds.click();
    }

    setVolume(volume: number): void {
        this.audio.setSettings({ volume, muted: false });
        this.store.set({ audio: this.audio.settings });
    }

    setMusicVolume(music: number): void {
        this.audio.setSettings({ music, muted: false });
        this.store.set({ audio: this.audio.settings });
    }

    // M, the sound's orb or the sound setting. In a run, M and the orb say which way it went
    // (announce): no setting's in sight, and the orb's off at the side. The setting shows it
    // itself, and a toast from there would wait under the pause menu.
    toggleMute(announce = false): void {
        this.audio.setSettings({ muted: !this.audio.settings.muted });
        this.store.set({ audio: this.audio.settings });
        if (announce && this.sim) {
            // Only the last of them: M pressed twice would say off and on at once
            if (this.soundToast !== undefined) {
                this.store.dismissToast(this.soundToast);
            }
            // A touch screen or a controller has no key for it
            const key = !isCoarsePointer && padHints.get() === undefined;
            this.soundToast = this.store.toast(
                !this.audio.settings.muted
                    ? t("canvas.sound_on")
                    : key
                      ? t("canvas.sound_off_key")
                      : t("canvas.sound_off"),
            );
        }
    }

    toggleMenuSpin(): void {
        this.setDisplay({ menuSpin: !this.display.menuSpin });
    }

    toggleScreenShake(): void {
        this.setDisplay({ screenShake: !this.display.screenShake });
    }

    togglePickupTimers(): void {
        this.setDisplay({ pickupTimers: !this.display.pickupTimers });
    }

    togglePuzzleHelper(): void {
        this.setDisplay({ puzzleHelper: !this.display.puzzleHelper });
    }

    toggleAutoPause(): void {
        this.setDisplay({ pauseOnBlur: !this.display.pauseOnBlur });
    }

    toggleAutoAlch(): void {
        this.setDisplay({ autoAlch: !this.display.autoAlch });
    }

    toggleAutoEquip(): void {
        this.setDisplay({ autoEquip: !this.display.autoEquip });
    }

    // Takes hold for the run being played too: its report is only sent at the end
    toggleRunStats(): void {
        this.setDisplay({ runStats: !this.display.runStats });
    }

    toggleQuestTracker(): void {
        this.setDisplay({ questTracker: !this.display.questTracker });
    }

    // In a run with nothing over it: Tab is the damage panel's then, and the
    // browser's (moving between buttons) on every other screen
    private isPlaying(): boolean {
        return (
            this.sim !== undefined &&
            !this.sim.runOver &&
            this.store.getSnapshot().overlay === "none"
        );
    }

    toggleDamagePanel(): void {
        this.setDisplay({ damagePanel: !this.display.damagePanel });
    }

    toggleGearPanel(): void {
        this.setDisplay({ gearPanel: !this.display.gearPanel });
    }

    toggleMovePrediction(): void {
        this.setDisplay({ movePrediction: !this.display.movePrediction });
        this.coopRun?.setPrediction(this.display.movePrediction);
        this.coopRun?.prediction?.setDiagnostics(this.movementDiagnostics);
    }

    // Local opt-in capture, also reachable on release builds with ?movementDiagnostics.
    setMovementDiagnostics(on: boolean): void {
        this.movementDiagnostics = on;
        this.coopRun?.prediction?.setDiagnostics(on);
    }

    getMovementDiagnostics() {
        const run = this.coopRun;
        return {
            build: __BUILD_ID__,
            enabled: this.movementDiagnostics,
            isGuest: !!run && !run.isHost,
            prediction: !!run?.prediction,
            frame: run?.frame,
            queuedFrames: run?.behind,
            capture: run?.prediction?.getDiagnostics(),
        };
    }

    // The room hears at once, and the rooms list from the next update. An open
    // room's host shows theirs either way (the relays' shownCountry).
    toggleCoopFlag(): void {
        this.setDisplay({ coopFlag: !this.display.coopFlag });
        this.coop.setMe({ hideCountry: !this.display.coopFlag });
    }

    // Takes hold from the next frame (update)
    setFrameRate(frameRate: FrameRate): void {
        this.setDisplay({ frameRate });
    }

    // The phone HUD's zoom slider: 0 is as far out as the wheel goes, 100 as close in
    setCameraZoom(zoom: number): void {
        if (this.sim) {
            this.cameraRig.setDistance(
                MAX_CAMERA_DISTANCE - ((MAX_CAMERA_DISTANCE - MIN_CAMERA_DISTANCE) * zoom) / 100,
            );
        }
    }

    private setDisplay(changes: Partial<DisplaySettings>): void {
        this.display = { ...this.display, ...changes };
        saveDisplaySettings(this.display);
        this.store.set({ display: this.display });
    }

    refundUpgrade(upgradeId: string, style: CombatStyle = "melee"): void {
        if (refundUpgrade(this.save, upgradeId, style)) {
            this.persist();
        }
    }

    refundUpgrades(style: CombatStyle = "melee"): void {
        refundUpgrades(this.save, style);
        this.persist();
    }

    // Gives the player the save as a file. One from a newer game goes as it
    // is: this game's copy has dropped what it doesn't know. This game's copy
    // says when it was made, and once the file's kept the save remembers it,
    // so the title's reminder goes till tomorrow.
    exportSave(): void {
        const exported = Date.now();
        const text =
            (this.newerSave && this.saveStore.read()) ??
            exportSave({ ...this.save, lastExported: exported }, this.saveStore.gameVersion);
        saveFile("run-escape-save.json", text, "application/json", () => {
            this.save.lastExported = exported;
            this.persist();
        });
    }

    // Gives the player a save that couldn't be read, as it was
    exportUnreadableSave(key: string): void {
        const text = this.saveStore.readUnreadable(key);
        if (text !== undefined) {
            saveFile("run-escape-save-unreadable.json", text, "application/json");
        }
    }

    deleteUnreadableSave(key: string): void {
        this.saveStore.deleteUnreadable(key);
        this.store.set({ unreadableSaves: this.saveStore.getUnreadable() });
    }

    closeUnreadableNotice(): void {
        this.store.set({ unreadableSave: undefined });
    }

    // Saves here, and the tab that was saving stops
    takeOverSave(): void {
        this.saveLock.takeOver();
    }

    // Saves over the newer game's save from here on, losing what's new in it.
    // The player's choice (and the only way out when a release is rolled
    // back), but not for a newer format, which this game can't read.
    saveOverNewer(): void {
        if (!this.newerSave || this.newerSave.format) {
            return;
        }
        this.newerSave = undefined;
        this.saveStore.writeOver();
        this.persist();
        this.updateSaveBlock();
    }

    playWithoutSaving(): void {
        this.store.set({ saveBlockClosed: true });
    }

    showSaveBlock(): void {
        this.store.set({ saveBlockClosed: false });
    }

    private onSaveLock(held: boolean): void {
        if (held) {
            this.reloadSave();
            // With the save as it is now, to find one from another device
            this.cloud?.check();
        } else {
            this.updateSaveBlock();
        }
    }

    // Reads the save again, as the tab that had it last left it
    private reloadSave(): void {
        const loaded = this.saveStore.load();
        this.newerSave = loaded.newer;
        this.saveNoRoom = loaded.noRoom === true;
        this.useSave(loaded.save);
        this.store.set({
            // With no room for a copy, the panel saying so is the notice
            unreadableSave: loaded.noRoom ? undefined : loaded.unreadable,
            unreadableSaves: this.saveStore.getUnreadable(),
        });
        this.updateSaveBlock();
        if (loaded.unreadable) {
            // It's kept, so the fresh save can go in its place
            this.persist();
        } else {
            this.store.set({ save: structuredClone(this.save) });
        }
    }

    private updateSaveBlock(): void {
        let saveBlock: SaveBlock | undefined;
        if (this.saveLock.held === false) {
            saveBlock = { kind: "otherTab" };
        } else if (this.newerSave) {
            saveBlock = { kind: "newerGame", ...this.newerSave };
        } else if (this.saveNoRoom) {
            saveBlock = { kind: "noRoom" };
        }
        // A new reason shows the panel again, and stops a solo run for it
        // (co-op's goes on for the others)
        const { saveBlock: was, saveBlockClosed } = this.store.getSnapshot();
        const changed = saveBlock?.kind !== was?.kind;
        this.store.set({ saveBlock, saveBlockClosed: saveBlockClosed && !changed });
        if (saveBlock && changed && !this.coopRun) {
            this.pause();
        }
    }

    // Swaps in an imported save in place of this one
    replaceSave(save: SaveData): void {
        this.useSave(save, true);
        this.persist();
        // An import's a save point; a download from the cloud is in step already
        this.cloud?.savePoint();
    }

    // Plays on with this save. toFavourite: go to its favourite, as it would
    // start on, if it has one that's open (an import; a save given back by
    // another tab leaves the pick alone)
    private useSave(save: SaveData, toFavourite = false): void {
        const lookWas = JSON.stringify(this.save?.look);
        this.save = save;
        setGauntletLooks(hasGauntletLooks(save));
        // The adventurer and map picked might not be open in it
        const { characterId, mapId } = this.store.getSnapshot();
        const starting = getStartingCharacter(save);
        const favourite = toFavourite && starting === save.favouriteCharacter;
        if (
            characterId !== starting &&
            (favourite || !save.unlockedCharacters.includes(characterId))
        ) {
            this.selectCharacter(starting);
        }
        if (!isMapUnlocked(save, mapId)) {
            this.store.set({ mapId: MAPS[0].id });
        }
        if (!isEndlessUnlocked(save, this.store.getSnapshot().mapId)) {
            this.store.set({ endless: false });
        }
        if (!isHardUnlocked(save, this.store.getSnapshot().mapId)) {
            this.store.set({ hard: false });
        }
        // Its own body and outfit, if it's another
        if (JSON.stringify(save.look) !== lookWas) {
            this.previewedLook = undefined;
            this.refreshMenuLook();
        }
    }

    // Whether the save's written here: this tab has the lock, and the save isn't a newer game's or
    // one there was no room to keep a copy of. Cloud save goes by it too.
    private canPersist(): boolean {
        return this.saveLock.held === true && !this.newerSave && !this.saveNoRoom;
    }

    private persist(): void {
        // Played without saving, it carries on in memory
        if (this.canPersist()) {
            this.saveStore.save(this.save);
        }
        // A fresh object so React sees the change
        this.store.set({ save: structuredClone(this.save) });
    }

    // Builds a map's collision the first time it's played (a scene build of
    // the whole arena, a moment's work)
    private async loadGrid(mapId: string): Promise<ArenaGrid> {
        let grid = this.grids.get(mapId);
        if (!grid) {
            await installRecipe(this.mapViewer, mapId);
            const region = await this.mapViewer.workerPool.queueLoad<
                RegionDataInput,
                RegionData,
                RegionDataLoader
            >(new RegionDataLoader(), getRegionInput(getMap(mapId)));
            grid = new ArenaGrid(region);
            // Only the title screen's and this map's are kept: a phone needn't
            // hold every map played
            for (const id of this.grids.keys()) {
                if (id !== TITLE_MAP.id) {
                    this.grids.delete(id);
                }
            }
            this.grids.set(mapId, grid);
        }
        return grid;
    }

    // Forgets a map's collision, for a map that's changed
    forgetGrid(mapId: string): void {
        this.grids.delete(mapId);
    }

    // Loads a map's collision and enemies for a run, and the party's pets, with
    // the loading screen if it takes a moment. False if it couldn't.
    private async travelTo(
        mapId: string,
        back: Screen,
        pets: (string | undefined)[],
        remixes: readonly string[] = [],
        // What else the run can bring in (an invasion's: invasionContent)
        extra: unknown[] = [],
    ): Promise<boolean> {
        const map = getMap(mapId);
        const content = [...remixContent(remixes), ...extra];
        // The Tombs, a room's enemies at a time (followTombs)
        this.runEnemyContent = content;
        this.tombsStage = map.tombs ? getTombsStageKey([], false) : undefined;
        const enemies = map.tombs
            ? getTombsStageEnemies(map, [], false, content)
            : getMapEnemies(map, content);
        if (!this.grids.has(mapId) || !this.assets.hasEnemies(enemies)) {
            this.store.set({
                screen: "loading",
                loadingText: t("canvas.travelling", { name: tl(map.name) }),
                loadingProgress: 25,
            });
        }
        // A pet that won't bake isn't a reason to stay: loadPets doesn't fail
        const petsBaked = this.assets.loadPets(pets);
        // A hero the map has everyone play, drawn as an NPC (Justiciar Zachariah)
        const mapCharacter = getMapCharacter(map);
        const heroBaked = mapCharacter ? this.assets.loadHeroLook(mapCharacter) : undefined;
        // And its NPCs posed as scenery (MapDef.props)
        const propsBaked = this.assets.loadProps(map);
        try {
            this.grid = await this.loadGrid(mapId);
            await this.assets.loadEnemies(enemies, (done, total) => {
                this.store.set({ loadingProgress: 25 + Math.round((done / total) * 75) });
            });
            await petsBaked;
            await heroBaked;
            await propsBaked;
            return true;
        } catch (e) {
            console.error("Failed to load map", mapId, e);
            this.store.set({ screen: back });
            this.store.toast(t("toast.couldnt_get_to", { name: tl(map.name) }));
            return false;
        }
    }

    // cinematic: false to start without the map's opening cinematic (a retry)
    // gauntlet: a fight of the Forgotten Four's (this.gauntletRun), on its mode, nothing else on
    // vault: the weekly Vault's run (content/vault.ts): its map, seed, remixes, invocations and
    // adventurer, none of the player's relics, never hard or endless
    // atLair: start at its lair's start (getRetryLair), in it, so its fight's on again at once (a
    // retry)
    async startRun(
        mapId: string = this.store.getSnapshot().mapId,
        cinematic = true,
        gauntlet?: GauntletRun,
        vault?: VaultRun,
        atLair = false,
    ): Promise<void> {
        if (vault) {
            mapId = vault.mapId;
        }
        if (!isMapUnlocked(this.save, mapId)) {
            return;
        }
        const map = getMap(mapId);
        const snapshot = this.store.getSnapshot();
        const plain = !gauntlet && !vault;
        // Fun maps are always endless, and some have everyone play one
        // adventurer (Durial321 in Falador)
        const endless =
            plain &&
            (map.fun !== undefined || (snapshot.endless && isEndlessUnlocked(this.save, mapId)));
        const hard = gauntlet
            ? gauntlet.hard
            : plain && snapshot.hard && isHardUnlocked(this.save, mapId);
        const expert = plain && snapshot.expert && isExpertUnlocked(this.save, mapId);
        const characterId = vault?.characterId ?? getMapCharacter(map) ?? snapshot.characterId;
        // Card collection only, when it's on and the collection can play it (never the Vault's,
        // which is the same run for everyone)
        const cardCaps = vault || map.blessings ? undefined : this.cardRunCaps(characterId);
        // Picked on the Cards only tab, it's Cards only or nothing: not without the adventurer's
        // starter cards or enough cards to fill a level up (isCardRunBlocked)
        if (plain && isCardRunBlocked(this.save, characterId, map)) {
            this.sounds.denied();
            return;
        }
        // Its own pet in a Card collection only run (getRunPet): never the other in its place
        const pet = getRunPet(this.save, cardCaps !== undefined);
        const remixes = vault
            ? vault.remixes
            : gauntlet
              ? []
              : this.openRemixes(mapId, snapshot.remixes);
        const seed = vault?.seed ?? (Math.random() * 0x7fffffff) | 0;
        // Awakened invasions, once open (rolled by the seed: its invader's baked with the map), and
        // an orb on the final boss
        const invasions = plain && isInvasionOpen(this.save.mapVictories);
        const forced = this.forcedInvasion();
        const invasion =
            invasions && !endless
                ? forced && INVADER_BY_ID.has(forced.invader) && takesInvasions(map)
                    ? { invader: INVADER_BY_ID.get(forced.invader)!, at: forced.at, hp: 0 }
                    : rollInvasion(map, seed, hard, remixes)
                : undefined;
        const awakened = plain && !endless && snapshot.awaken && canAwaken(this.save, mapId);
        if (
            !(await this.travelTo(mapId, "characters", [pet], remixes, invasionContent(invasion)))
        ) {
            return;
        }
        this.runVault = vault?.key;
        usePortableMath(false);
        const spawn = (atLair && getRetryLair(map)?.start) || map.spawn;
        const sim = new Sim({
            grid: this.grid,
            mapId,
            characterId,
            metaStats: getMetaStats(this.save, getCharacter(characterId).style),
            seed,
            spawnX: spawn.x,
            spawnY: spawn.y,
            unlockedItems: new Set(this.save.unlockedItems),
            ...(cardCaps && { cardCaps }),
            trophiesFound: new Set(getRaidChestTrophiesFound(this.save.trophies)),
            pet,
            endless,
            hard,
            expert,
            raidTeleports: RAID_TELEPORTS,
            raidPortals: getRaidPortals(this.save, mapId),
            armoury: { ...this.save.armoury },
            actStep: getActStep(map, this.save.mapVictories),
            invocations: vault
                ? vault.invocations
                : map.tombs
                  ? (this.save.invocations ?? [])
                  : takesInvocations(map, remixes.length > 0)
                    ? (this.save.runInvocations ?? [])
                    : undefined,
            relics: vault ? [] : this.runRelics(map),
            remixes,
            invasions,
            awakened,
            stage: this.chosenStage(mapId),
            gauntlet: gauntlet && gauntletFightOptions(gauntlet),
            testing: this.options.raidTest
                ? { raidRoomSeconds: 120, maxLevelUps: this.options.raidTest === "max" }
                : forced
                  ? { invasion: forced }
                  : undefined,
        });
        for (let i = 0; i < this.options.stress; i++) {
            sim.spawnEnemy(getEnemy("goblin"), "normal");
        }
        this.enterRun(sim, [pet], [this.save.look], cinematic);
    }

    // A message for the co-op run, kept while its copy is still being made
    // (the map loading, which can take one player longer than the rest) and
    // handed over once it's there
    private toCoopRun(deliver: (run: CoopRun) => void): void {
        if (this.coopRun) {
            deliver(this.coopRun);
        } else if (this.coopInbox && this.coopInbox.length < MAX_COOP_INBOX) {
            this.coopInbox.push(deliver);
        }
    }

    // A co-op run, as the host started it: everyone builds the same Sim, each
    // playing their own hero
    private async beginCoopRun(game: GameStart): Promise<void> {
        if (!isGameStart(game, MAX_PARTY)) {
            this.store.toast(t("toast.missing_run_content"), 6000);
            this.coopInbox = undefined;
            this.coop.leave();
            return;
        }
        const you = this.coop.id;
        const focus = game.heroes.findIndex((hero) => hero.id === you);
        const room = this.coop.room;
        if (focus === -1 || !room) {
            return;
        }
        this.coopInbox = [];
        // A map or adventurer this game hasn't got (another player's game
        // could be newer, or made up): it can't play along
        if (
            !MAP_BY_ID.has(game.mapId) ||
            !game.heroes.every((hero) => CHARACTERS.some((c) => c.id === hero.characterId))
        ) {
            this.store.toast(t("toast.missing_run_content"), 6000);
            this.coopInbox = undefined;
            this.coop.leave();
            return;
        }
        if (this.sim) {
            // Still on the last run's results
            this.leaveRun(false);
        }
        // Each hero's pet, only for looks (another player's game could send anything)
        const pets = game.heroes.map((hero) =>
            typeof hero.loadout?.pet === "string" ? hero.loadout.pet : undefined,
        );
        const invasion = game.invasions
            ? rollInvasion(getMap(game.mapId), game.seed, game.hard, game.remixes ?? [])
            : undefined;
        if (
            !(await this.travelTo(
                game.mapId,
                "coop",
                pets,
                game.remixes ?? [],
                game.endless ? [] : invasionContent(invasion),
            ))
        ) {
            this.coopInbox = undefined;
            this.coop.leave();
            return;
        }
        // The room went while the map loaded (the host left, the connection
        // dropped): there's no run to join
        if (!this.coopInbox || this.coop.room?.code !== room.code) {
            this.coopInbox = undefined;
            this.store.set({ screen: this.coop.room ? "coop" : "title" });
            return;
        }
        // Every copy has to work out the same numbers, to the bit
        usePortableMath(true);
        const map = getMap(game.mapId);
        // Cards only for everyone or no one: as the host plays (partyLoadouts)
        const loadouts = partyLoadouts(game.heroes, room.hostId);
        const party: HeroOptions[] = game.heroes.map((hero, i) => ({
            name: hero.name,
            characterId: hero.characterId,
            metaStats: loadoutStats(hero.loadout),
            ...cleanLoadout(loadouts[i]),
            // The weekly Vault is played without relics or Card collection only, as on your own
            // (startVault, startRun)
            ...(game.vault !== undefined && { relics: [], cardCaps: undefined }),
            // Nor is a map whose level ups are blessings (MapDef.blessings), which cards don't touch
            ...(map.blessings && { cardCaps: undefined }),
        }));
        const sim = new Sim({
            grid: this.grid,
            mapId: game.mapId,
            characterId: party[focus].characterId,
            metaStats: party[focus].metaStats,
            seed: game.seed,
            spawnX: map.spawn.x,
            spawnY: map.spawn.y,
            endless: game.endless,
            hard: game.hard,
            actStep: game.actStep,
            stage: game.stage,
            invocations: game.invocations,
            remixes: game.remixes,
            invasions: game.invasions === true,
            party,
            focus,
        });
        this.runVault = game.vault && parseWeekKey(game.vault) ? game.vault : undefined;
        const heroes = new Map(game.heroes.map((hero, i) => [hero.id, i]));
        const run = new CoopRun(sim, this.coop.isHost, this.coop, heroes, room.hostId);
        run.setPrediction(this.display.movePrediction);
        run.prediction?.setDiagnostics(this.movementDiagnostics);
        this.coopRun = run;
        this.coopPlayerIds = game.heroes.map((hero) => hero.id);
        const inbox = this.coopInbox ?? [];
        this.coopInbox = undefined;
        for (const deliver of inbox) {
            deliver(run);
        }
        // Each hero's look from their Wardrobe, only for show
        const looks = game.heroes.map((hero) => cleanLook(hero.loadout?.look));
        this.enterRun(sim, pets, looks, true);
        // Or once the opening cinematic's squares are in, if it's loading them (cinematicLoaded)
        if (!this.coop.isHost && this.cinematicLoading === undefined) {
            this.coop.sendUp({ loaded: true });
        }
        // Start while the page is still active, not only after it is hidden.
        this.startCoopTicker();
    }

    // pets and looks: each hero's pet and Wardrobe look, in the party's order
    // cinematic: play the map's opening cinematic (or its part's, a fight in parts), if it has one
    private enterRun(
        sim: Sim,
        pets: (string | undefined)[],
        looks: (WardrobeLook | undefined)[],
        cinematic: boolean,
    ): void {
        this.previewedLook = undefined;
        this.bareMenuLook = false;
        this.heroLooks = looks;
        const map = sim.map;
        this.sim = sim;
        // A new run's bosses explain themselves again
        this.instructionsSeen.clear();
        this.instructions = [];
        this.instructionsUp = [];
        const runCinematic = getRunCinematic(map, sim.stage);
        this.cinematic = cinematic && runCinematic ? new CinematicPlayer(runCinematic) : undefined;
        this.view.cinematic = this.cinematic;
        this.lairOpeningTick = -1;
        this.lairUnsealTick = -1;
        this.renderer.setPlane(this.grid.plane);
        this.renderer.setSmoothTerrain(map.scaperune === true);
        this.grid.exactGround = map.scaperune === true;
        this.cameraGround = undefined;
        this.cameraLean = { x: 0, y: 0 };
        this.renderer.setBrightness(map.brightness ?? 1);
        this.shownBrightness = map.brightness ?? 1;
        this.renderer.setWash(undefined);
        this.shownWash = undefined;
        this.renderer.setLighting(sim.lighting !== undefined);
        this.renderer.setTwin(getTwinSquares(map));
        this.sceneLights.reset();
        this.minimap.setMap(map);
        const music = map.music && musicFor(map.music);
        if (music) {
            this.audio.playMusic(music);
        } else {
            this.audio.stopMusic();
        }
        this.paused = false;
        this.runRecorded = false;
        this.reportRun = this.options.stress
            ? undefined
            : startRunAnalytics(
                  sim,
                  this.coopRun && { isHost: this.coopRun.isHost, relay: this.coop.relayKind },
                  RUN_ANALYTICS_URL,
                  () => this.display.runStats,
              );
        this.tasksAnnounced.clear();
        this.accumulator = 0;
        this.shownDps = 0;
        this.shownDpsTick = 0;
        this.damageMeter.reset();
        this.coopBarBoss = undefined;
        this.appearanceVersions = [];
        this.lookChoices = [];
        this.decisionKey = "";
        this.autoChest = undefined;
        this.coopStopped = false;
        this.viewHero = sim.focus;
        this.assets.dropPlayers(sim.heroes.length);
        this.view.reset();
        this.view.pets.setPets(pets);
        this.cameraRig.pitch = RUN_PITCH;
        this.cameraRig.distance =
            isCoarsePointer && window.innerHeight <= PHONE_MAX_HEIGHT
                ? PHONE_RUN_DISTANCE
                : RUN_DISTANCE;
        this.cameraRig.yaw = 0;
        this.store.set({
            screen: "run",
            overlay: "none",
            choices: [],
            chest: undefined,
            result: undefined,
            toasts: [],
            // The pause menu's recent messages are this run's, not the title's or the lobby's
            toastLog: [],
            party: [],
            waitingOn: [],
            revive: undefined,
            cinematic: this.cinematic !== undefined,
        });
        if (this.cinematic) {
            this.preloadCinematic(sim, this.cinematic);
        }
        this.updateHud(true);
        // A run that begins with picks to make (a boss fight's) shows them now:
        // the loop only steps the sim once they're made
        this.syncOverlay();
        if (this.coopRun?.isHost && this.coopRun.waitingForLoad) {
            this.store.toast(t("toast.waiting_arrivals"), 3000);
        }
    }

    // Co-op sends what the player does to the host, to be done in the frame
    // it goes in (on every copy at once); on your own it's done now. Returns
    // false when it can't be done.
    private act(action: CoopAction): boolean {
        const sim = this.sim;
        if (!sim) {
            return false;
        }
        if (this.coopRun) {
            return this.coopRun.act(action);
        }
        const done = applyAction(sim, action);
        this.afterAction(action, done);
        return done;
    }

    // What follows something the player did, once it's done
    private afterAction(action: CoopAction, done: boolean): void {
        const sim = this.sim;
        if (!sim) {
            return;
        }
        switch (action.kind) {
            case "choose":
                this.syncOverlay();
                break;
            case "chest":
                this.handleEvents(sim, sim.takeEvents());
                this.syncOverlay();
                break;
            case "reroll":
                if (done) {
                    this.afterReroll(sim);
                } else {
                    this.sounds.denied();
                }
                break;
            // A banished reward greys out where it is
            case "banish":
                if (done) {
                    this.sounds.reroll();
                    this.store.set({ choices: getChoiceViews(sim) });
                } else {
                    this.sounds.denied();
                }
                break;
            // A banished item is alched, which is the casket done
            case "banishChest":
                if (done) {
                    this.handleEvents(sim, sim.takeEvents());
                    this.syncOverlay();
                } else {
                    this.sounds.denied();
                }
                break;
            case "skip":
                if (done) {
                    this.sounds.buy();
                    this.syncOverlay();
                } else {
                    this.sounds.denied();
                }
                break;
            case "keep":
            case "takeKept":
                if (done) {
                    this.syncOverlay();
                } else {
                    this.sounds.denied();
                }
                break;
            case "item":
                if (done) {
                    this.handleEvents(sim, sim.takeEvents());
                    if (sim.state !== "playing") {
                        // A lamp's level up, or a blast that killed the boss
                        this.syncOverlay();
                    }
                }
                break;
            case "event":
                if (!done) {
                    this.sounds.denied();
                    return;
                }
                this.handleEvents(sim, sim.takeEvents());
                this.syncOverlay();
                break;
            case "leaveEvent":
                this.handleEvents(sim, sim.takeEvents());
                this.syncOverlay();
                break;
            case "ability":
                if (!done) {
                    this.sounds.denied();
                    break;
                }
                this.handleEvents(sim, sim.takeEvents());
                if (sim.state !== "playing") {
                    this.syncOverlay();
                }
                break;
        }
        this.updateHud(true);
    }

    choose(index: number): void {
        const sim = this.sim;
        if (!sim || !sim.isChoosing()) {
            return;
        }
        if (sim.isBanishedChoice(index)) {
            this.sounds.denied();
            return;
        }
        this.act({ kind: "choose", index });
    }

    // What the player chose with the open casket's item
    resolveChest(action: ChestAction): void {
        const sim = this.sim;
        if (!sim || sim.state !== "chest" || !sim.chest) {
            return;
        }
        this.act({ kind: "chest", action });
    }

    // Takes one of what a random event's visitor has on offer
    chooseEvent(index: number): void {
        const sim = this.sim;
        if (!sim || sim.state !== "event") {
            return;
        }
        // Checked here in co-op too, as with a reroll (see reroll): a key
        // pressed for something sold would hold up leaving
        if (this.coopRun && !sim.canChooseEventOption(index)) {
            this.sounds.denied();
            return;
        }
        this.act({ kind: "event", index });
    }

    // Walks away from what a random event's visitor has on offer
    leaveEvent(): void {
        const sim = this.sim;
        if (!sim || sim.state !== "event") {
            return;
        }
        this.act({ kind: "leaveEvent" });
    }

    // Rolls the level up's rewards or the open casket's item again, for one of
    // the run's rerolls. False when there's none left.
    reroll(): boolean {
        const sim = this.sim;
        if (!sim) {
            return false;
        }
        // Checked here too in co-op: an action the host turns away still counts
        // as this decision's answer (CoopRun.act), so a refused reroll would
        // hold up the real pick
        if (this.coopRun && (sim.rerollsLeft <= 0 || sim.choosingHilt)) {
            this.sounds.denied();
            return false;
        }
        return this.act({ kind: "reroll" });
    }

    private afterReroll(sim: Sim): void {
        if (sim.state === "chest" && this.autoChestAction(sim)) {
            // Auto equip takes the new item, with no casket to burst open
            this.syncOverlay();
        } else if (sim.state === "chest") {
            const chest = getChestView(sim);
            // The UI bursts the casket open again for the new item
            if (chest) {
                this.sounds.chest("open", chest.rarity);
            }
            this.store.set({ chest });
        } else {
            this.sounds.reroll();
            this.store.set({ choices: getChoiceViews(sim) });
        }
    }

    // Banishes a level up's reward (by its place), or with none the open
    // casket's item, for one of the run's banishes. False when it can't be.
    banish(index?: number): boolean {
        const sim = this.sim;
        if (!sim) {
            return false;
        }
        const allowed = index === undefined ? sim.canBanishChest : sim.canBanishChoice(index);
        // Checked here in co-op too, as with a reroll (see reroll)
        if (this.coopRun && !allowed) {
            this.sounds.denied();
            return false;
        }
        return this.act(index === undefined ? { kind: "banishChest" } : { kind: "banish", index });
    }

    // Reloaded (content/relics.ts): the level up's offer kept for later, or a kept one taken now.
    // Checked here in co-op too, as with a reroll (see reroll).
    keepOffer(): boolean {
        const sim = this.sim;
        if (!sim || (this.coopRun && !sim.canKeepOffer)) {
            this.sounds.denied();
            return false;
        }
        return this.act({ kind: "keep" });
    }

    takeKept(): boolean {
        const sim = this.sim;
        if (!sim || (this.coopRun && !sim.canTakeKept)) {
            this.sounds.denied();
            return false;
        }
        return this.act({ kind: "takeKept" });
    }

    // Takes none of the level up's rewards, for coins from the run. False when
    // it can't be skipped or there aren't the coins.
    skip(): boolean {
        const sim = this.sim;
        if (!sim || sim.state !== "levelUp") {
            return false;
        }
        if (this.coopRun && (!sim.canSkip || sim.coins < sim.skipCost)) {
            this.sounds.denied();
            return false;
        }
        return this.act({ kind: "skip" });
    }

    // Uses the utility item in an inventory slot (0-3)
    useItem(index: number): void {
        const sim = this.sim;
        if (!sim || (this.paused && !this.coopRun) || !sim.inventory[index]) {
            return;
        }
        this.act({ kind: "item", index });
    }

    // The fight's own button (Sim.ability: a fight map's, or the Tombs'): Space, a pad's bottom
    // button, or the touch screen's. Out of reach, or not ready, it says no. A hero with buttons
    // of their own (CharacterDef.abilities) has slot for which: Space is the first, and 1 to 4
    // the others.
    useAbility(slot = 0): void {
        const sim = this.sim;
        if (!sim || (this.paused && !this.coopRun)) {
            return;
        }
        if (this.hasKit(sim)) {
            this.act({ kind: "ability", index: slot });
            return;
        }
        if (!sim.ability) {
            return;
        }
        // Only a press that goes off counts as having learnt it: one it says no to (out of reach,
        // not ready, no boss up) leaves the hint to come
        if (sim.abilityPressTakes()) {
            this.abilityUsed = true;
        }
        this.act({ kind: "ability" });
    }

    // Whether the hero this player plays has buttons of their own (CharacterDef.abilities)
    private hasKit(sim: Sim): boolean {
        const hero = sim.heroes[sim.focus] ?? sim.heroes[0];
        return getCharacter(hero.characterId).abilities !== undefined;
    }

    // The opening animation's sounds, timed by the UI
    playChestSound(cue: ChestCue, rarity: Rarity): void {
        this.sounds.chest(cue, rarity);
    }

    // Co-op's menu doesn't stop the run: the others play on. The shot editor's run never steps,
    // so there's nothing to pause (and its window loses focus to the console often)
    pause(): void {
        if (this.sim && !this.sim.runOver && !this.director) {
            this.paused = true;
            this.syncOverlay();
        }
    }

    // The page lost its graphics (GameApp): a solo run stops where it stands, and
    // nothing happens to it while its player can't see it. Says what was going on.
    onGraphicsLost(): "none" | "solo" | "coop" {
        if (!this.sim || this.sim.runOver) {
            return "none";
        }
        if (this.coopRun) {
            return "coop";
        }
        this.pause();
        return "solo";
    }

    // Before the page reloads for its lost graphics: the run counts as the pause
    // menu's quit does (its coins and quests are kept), with nothing more drawn
    // or let go on the GPU
    endRunForReload(): void {
        if (this.sim) {
            this.finishRun(undefined, "disconnected");
        }
        if (this.coopRun) {
            this.coop.leave();
        }
    }

    resume(): void {
        this.paused = false;
        this.accumulator = 0;
        this.syncOverlay();
    }

    // Ends the run where it stands (from the pause menu); coins found are kept, and shown on the
    // results. In co-op that's leaving the party (the host's leaving ends it for everyone).
    quitRun(): void {
        const sim = this.sim;
        if (sim && !this.coopRun) {
            this.paused = false;
            sim.giveUp();
            // Before the overlay, or it would play as a death
            this.finishRun(t("ui.result.gave_up"), "abandoned");
            this.syncOverlay();
            return;
        }
        if (sim) {
            this.finishRun();
        }
        // Quitting a fight of the Forgotten Four's gives the whole run up
        this.dropGauntlet();
        if (this.coopRun) {
            this.coop.leave();
        }
        this.leaveRun();
    }

    // Back to the title screen after the results, or after a co-op run, back
    // to the room. show: false when the next run's starting straight away.
    // The same map again, from its results, on your own: at its lair if it has one to start at
    // (getRetryLair)
    retry(): void {
        const map = this.sim?.map;
        const mapId = map?.id;
        if (!mapId || this.coopRun) {
            return;
        }
        // A retry of the same part is without its cinematic; "Next fight", on to a part not played
        // just now, plays that part's entrance
        const played = this.sim?.stage;
        const onward = map.stages !== undefined && this.chosenStage(mapId) !== played;
        // The Vault's run again, not a plain run of its map
        const vault = this.runVault !== undefined ? getVault(this.runVault) : undefined;
        this.leaveRun();
        void this.startRun(mapId, onward, undefined, vault, true);
    }

    leaveRun(show = true): void {
        const wasCoop = this.coopRun !== undefined;
        if (wasCoop && show && this.coop.isHost) {
            // The room's open for the next run
            this.coop.end();
        }
        this.coopRun = undefined;
        this.stopCoopTicker();
        usePortableMath(false);
        this.assets.dropPlayers(1);
        this.sim = undefined;
        this.endCinematic();
        this.reportRun = undefined;
        this.paused = false;
        this.audio.stopMusic();
        this.grid = this.grids.get(TITLE_MAP.id)!;
        this.renderer.setPlane(this.grid.plane);
        this.renderer.setSmoothTerrain(false);
        this.renderer.setBrightness(1);
        this.shownBrightness = 1;
        this.renderer.setWash(undefined);
        this.shownWash = undefined;
        this.renderer.setLighting(false);
        this.renderer.setTwin(undefined);
        this.view.reset();
        this.cameraRig.pitch = ATTRACT_PITCH;
        this.cameraRig.distance = ATTRACT_DISTANCE;
        this.assets.setCharacterLook(this.store.getSnapshot().characterId, this.save.look);
        if (!show) {
            return;
        }
        this.store.setNumbers(undefined);
        this.store.set({
            screen: wasCoop && this.coop.room ? "coop" : "title",
            overlay: "none",
            hud: undefined,
            choices: [],
            chest: undefined,
            result: undefined,
            party: [],
            waitingOn: [],
            revive: undefined,
            toastLog: [],
        });
    }

    // ---- The Forgotten Four (content/gauntlet.ts, core/gauntlet.ts) ----
    // Each fight is its own run (startRun with the gauntlet's run), the camp a screen between
    // them. On your own for now: co-op's chained runs and shared camp aren't built.

    // Its screen, to put the fights in order: from the act's middle card, once it's open
    // ?invade (GameClientOptions.invade): the invader and its second
    private forcedInvasion(): { invader: string; at: number } | undefined {
        const [invader, at] = (this.options.invade ?? "").split("@");
        return invader ? { invader, at: parseFloat(at) || 5 } : undefined;
    }

    // The weekly Vault's screen (content/vault.ts), once the act's four Awakened are beaten
    openVault(): void {
        if (!isVaultOpen(this.save.mapVictories) || this.sim) {
            this.sounds.denied();
            return;
        }
        this.store.set({ screen: "vault" });
    }

    // This week's Vault, solo
    startVault(): void {
        if (!isVaultOpen(this.save.mapVictories) || this.coop.room) {
            return;
        }
        const vault = getVaultAt(Date.now());
        void this.startRun(vault.mapId, true, undefined, vault);
    }

    // Hosting a room: its next run's this week's Vault, on the Vault's map, for everyone (each
    // player's records their own)
    vaultForRoom(): void {
        const room = this.hostedRoom();
        if (!room || !isVaultOpen(this.save.mapVictories)) {
            return;
        }
        const vault = getVaultAt(Date.now());
        if (room.mapId !== vault.mapId) {
            this.coop.setMap(vault.mapId, false, false);
        }
        this.store.set({ vaultRoom: vault.key, screen: "coop" });
    }

    openGauntlet(): void {
        if (!isGauntletOpen(this.save) || this.coop.room || this.sim) {
            return;
        }
        const last = this.store.getSnapshot().gauntlet;
        this.store.set({
            screen: "gauntlet",
            gauntlet: {
                order: last?.order ?? getGauntletOrder(this.save),
                hard: (last?.hard ?? false) && isGauntletHardOpen(this.save),
            },
        });
    }

    // The order picked on its screen, kept for next time
    setGauntletOrder(order: string[]): void {
        const view = this.store.getSnapshot().gauntlet;
        if (!view || view.run || !isGauntletOrder(order)) {
            return;
        }
        this.save.gauntletOrder = [...order];
        this.persist();
        this.store.set({ gauntlet: { ...view, order: [...order] } });
    }

    setGauntletHard(hard: boolean): void {
        const view = this.store.getSnapshot().gauntlet;
        if (!view || view.run) {
            return;
        }
        this.store.set({ gauntlet: { ...view, hard: hard && isGauntletHardOpen(this.save) } });
    }

    beginGauntlet(): void {
        const view = this.store.getSnapshot().gauntlet;
        if (!view || view.run || !isGauntletOpen(this.save) || this.coop.room) {
            return;
        }
        this.setGauntlet(startGauntlet(view.order, view.hard));
        void this.startGauntletFight(true);
    }

    private setGauntlet(run: GauntletRun, more: { campEnds?: number } = {}): void {
        this.gauntletRun = run;
        const view = this.store.getSnapshot().gauntlet;
        this.store.set({
            gauntlet: {
                order: run.order,
                hard: run.hard,
                run,
                ...more,
                ...(view?.rewards && run.phase === "cleared" && { rewards: view.rewards }),
            },
        });
    }

    private async startGauntletFight(cinematic: boolean): Promise<void> {
        const run = this.gauntletRun;
        if (!run || run.phase !== "fight") {
            return;
        }
        await this.startRun(gauntletFightId(run), cinematic, run);
        // It couldn't get there: back to the gauntlet's screen
        if (!this.sim) {
            this.dropGauntlet();
            this.openGauntlet();
        }
    }

    // A fight's end: a win pays its points and carries its wounds, and the last clears the
    // gauntlet, which is recorded; a fall waits on Retry this fight or Start over
    private finishGauntletFight(result: RunResult): void {
        const run = this.gauntletRun!;
        const end = result.gauntlet!;
        if (!result.victory) {
            this.setGauntlet(loseGauntletFight(run));
            return;
        }
        const next = winGauntletFight(run, {
            seconds: result.seconds,
            hp: end.hp,
            maxHp: end.maxHp,
            damageTaken: result.stats.damageTaken,
            guardDowns: end.guardDowns,
        });
        this.setGauntlet(next);
        if (next.phase !== "cleared") {
            return;
        }
        const rewards = recordGauntlet(this.save, {
            order: next.order,
            hard: next.hard,
            seconds: gauntletSeconds(next),
            retries: gauntletRetries(next),
        });
        this.persist();
        this.cloud?.savePoint();
        setGauntletLooks(hasGauntletLooks(this.save));
        this.store.set({ gauntlet: { ...this.store.getSnapshot().gauntlet!, rewards } });
    }

    // From a fight won, to the camp: its points to spend, CAMP_SECONDS to spend them in
    toGauntletCamp(): void {
        const run = this.gauntletRun;
        if (!run || run.phase !== "camp") {
            return;
        }
        this.leaveRun(false);
        this.setGauntlet(run, { campEnds: performance.now() + CAMP_SECONDS * 1000 });
        this.store.set({ screen: "camp", overlay: "none", result: undefined });
        window.clearTimeout(this.campTimer);
        this.campTimer = window.setTimeout(() => this.leaveGauntletCamp(), CAMP_SECONDS * 1000);
    }

    chooseGauntletBlessing(id: BlessingId | undefined): void {
        const run = this.gauntletRun;
        if (!run || run.phase !== "camp") {
            return;
        }
        this.setGauntlet(chooseBlessing(run, id), {
            campEnds: this.store.getSnapshot().gauntlet?.campEnds,
        });
    }

    // Ready, or the camp's time is up: on to the next fight
    leaveGauntletCamp(): void {
        window.clearTimeout(this.campTimer);
        this.campTimer = undefined;
        const run = this.gauntletRun;
        if (!run || run.phase !== "camp") {
            return;
        }
        this.setGauntlet(leaveGauntletCamp(run));
        void this.startGauntletFight(true);
    }

    // The fight fallen in, from its start again, with what it was come into with
    retryGauntletFight(): void {
        const run = this.gauntletRun;
        if (!run || run.phase !== "fallen") {
            return;
        }
        this.leaveRun(false);
        this.setGauntlet(retryGauntletFight(run));
        void this.startGauntletFight(false);
    }

    // Start over: back to the order screen, the run's order and mode on it
    restartGauntlet(): void {
        const run = this.gauntletRun;
        this.dropGauntlet();
        if (this.sim) {
            this.leaveRun(false);
        }
        this.store.set({
            gauntlet: run && { order: run.order, hard: run.hard },
            overlay: "none",
            result: undefined,
        });
        this.openGauntlet();
    }

    // Out of the gauntlet altogether (its screen's Back, the results' Leave), to the map screen
    // it was opened from
    leaveGauntlet(): void {
        const run = this.gauntletRun;
        this.dropGauntlet();
        if (run) {
            this.store.set({ gauntlet: { order: run.order, hard: run.hard } });
        }
        if (this.sim) {
            this.leaveRun();
        }
        this.store.set({ screen: "characters" });
    }

    private dropGauntlet(): void {
        window.clearTimeout(this.campTimer);
        this.campTimer = undefined;
        this.gauntletRun = undefined;
        const view = this.store.getSnapshot().gauntlet;
        if (view?.run) {
            this.store.set({ gauntlet: { order: view.order, hard: view.hard } });
        }
    }

    // endedEarly: why a co-op run ended before anyone won or fell
    // A fight in parts: the part picked (one reached), or the next not beaten
    private chosenStage(mapId: string): number {
        const picked = this.store.getSnapshot().fightStage;
        return picked !== undefined && picked < getReachedStages(this.save, mapId)
            ? picked
            : getFightStage(this.save, mapId);
    }

    // A fight in parts' part to play next, picked on the map screen
    pickFightStage(stage: number | undefined): void {
        this.store.set({ fightStage: stage });
    }

    private finishRun(
        endedEarly?: string,
        early: "abandoned" | "disconnected" = endedEarly ? "disconnected" : "abandoned",
    ): void {
        const sim = this.sim;
        if (!sim || this.runRecorded) {
            return;
        }
        this.runRecorded = true;
        void this.reportRun?.(early);
        this.reportRun = undefined;
        const result = sim.getResult();
        if (this.gauntletRun && result.gauntlet) {
            this.finishGauntletFight(result);
            return;
        }
        // A fight in parts: Retry plays the part lost again (one replayed, too, not the furthest
        // reached), and Next fight the one after it. chosenStage falls back to the next not
        // beaten when that isn't reached yet.
        this.store.set({
            fightStage:
                result.stage === undefined
                    ? undefined
                    : result.victory
                      ? result.stage + 1
                      : result.stage,
        });
        const locked = ALL_MAPS.filter((m) => !isMapUnlocked(this.save, m.id));
        const lockedCharacters = CHARACTERS.filter(
            (c) => !c.only && !this.save.unlockedCharacters.includes(c.id),
        );
        const lockedItems = LOCKABLE_ITEMS.filter((i) => !this.save.unlockedItems.includes(i.id));
        const endlessRecord = result.endless && isEndlessRecord(this.save, result);
        const firstHardWin =
            isHardRecord(result) &&
            result.victory &&
            !isDevMap(sim.map.id) &&
            !this.save.hardVictories[sim.map.id];
        const newGear = isDevMap(sim.map.id)
            ? []
            : result.gearFound.filter((id) => !this.save.foundGear.includes(id));
        const newTrophies = isDevMap(sim.map.id)
            ? []
            : result.trophies.filter((id) => !this.save.trophies.includes(id));
        // A co-op run's numbers can come from another player's modified game,
        // and a NaN in a solo one's would come back from the save as 0 coins
        const vaultKey = this.runVault;
        const vaultBest =
            vaultKey !== undefined && isBetterVault(result, this.save.vault?.[vaultKey]);
        const quests = hasBadNumber(result)
            ? []
            : recordRun(this.save, {
                  ...result,
                  ...(vaultKey && { vault: vaultKey }),
                  // This player's own: each co-op player records their run on their own save
                  ...(sim.cardCaps && { cardsOnly: true }),
              });
        // The last of an act's Awakened fights: its ending's told, once (SaveData.actEndings)
        const actEnding = result.victory ? takeActEnding(this.save) : undefined;
        this.persist();
        // A run's results: a save point for cloud save
        this.cloud?.savePoint();
        const unlockedMap = locked.find((m) => isMapUnlocked(this.save, m.id));
        const unlockedCharacters = lockedCharacters.filter((c) =>
            this.save.unlockedCharacters.includes(c.id),
        );
        const unlockedItems = lockedItems.filter((i) => this.save.unlockedItems.includes(i.id));
        if (unlockedMap) {
            // Ready for the next run
            this.store.set({ mapId: unlockedMap.id, endless: false, hard: false });
        }
        // Teammates' pages too, unless one of them has a number that isn't
        const players = getPlayerResultViews(sim);
        this.store.set({
            result: {
                ...result,
                players: players.some(hasBadNumber) ? players.filter((p) => p.isLocal) : players,
                bossKills: getBossKillViews(result.stats),
                endlessRecord,
                firstHardWin,
                // An act opens all its maps at once: it's the act that's said to open
                unlockedMap: unlockedMap?.act ? getAct(unlockedMap.act.id).name : unlockedMap?.name,
                unlockedCharacters: unlockedCharacters.map((c) => c.name),
                unlockedItems: unlockedItems.map((i) => i.name),
                newGear: newGear.map((id) => getItem(id).name),
                newTrophies: newTrophies.map((id) => TROPHY_BY_ID.get(id)!.name),
                quests: quests.map((q) => ({ name: q.name, coins: q.coins })),
                ...(vaultKey && { vault: { key: vaultKey, best: vaultBest } }),
                orbWon: result.victory && GAUNTLET_FIGHTS.includes(result.mapId),
                ...(sim.cardCaps && { cardsOnly: true }),
                ...(sim.heroes.length > 1 && {
                    party: sim.heroes.filter((h) => h.index !== sim.focus).map((h) => h.name),
                }),
                endedEarly,
                // As retry() goes by
                ...(this.coopRun && { coop: true }),
            },
            ...(actEnding && { actEnding }),
        });
        // The room sees this player's new unlocks and upgrades next run
        this.coop.setMe({ loadout: this.getLoadout(), unlocks: this.getUnlocks() });
    }

    // A task or quest done mid-run: the adventurer or item joins, and the
    // quest pays out, once the run is over, however it ends (beating the map
    // shows on the results instead)
    private announceTasks(sim: Sim): void {
        if (sim.runOver || isDevMap(sim.map.id)) {
            return;
        }
        const result = sim.getResult();
        const earned = getEarnedUnlocks(this.save, result);
        const news = [
            ...earned.characters.map((c) => ({
                key: `character:${c.id}`,
                task: c.unlock!,
                text: t("toast.character_unlocked", { name: tl(c.name) }),
            })),
            ...earned.items.map((i) => ({
                key: `item:${i.id}`,
                task: i.unlock,
                text: t(i.kind === "item" ? "toast.item_loot_unlocked" : "toast.item_unlocked", {
                    name: tl(i.name),
                }),
            })),
        ];
        for (const { key, task, text } of news) {
            if (!this.tasksAnnounced.has(key)) {
                this.tasksAnnounced.add(key);
                this.sounds.taskDone();
                this.store.toast(
                    t("toast.task_done", { task: describeUnlockTask(task), reward: text }),
                    6000,
                );
            }
        }
        for (const quest of getFinishedQuests(this.save, result)) {
            const key = `quest:${quest.id}`;
            if (!this.tasksAnnounced.has(key)) {
                this.tasksAnnounced.add(key);
                this.sounds.taskDone();
                this.store.toast(
                    t("toast.quest_complete", {
                        name: tl(quest.name),
                        coins: fmtNum(quest.coins),
                    }),
                    6000,
                );
            }
        }
    }

    // Any key or controller button skips the opening cinematic, and does nothing else. The shot
    // editor has its own keys, and F3 and M as ever.
    private pressKey(code: string): void {
        if (this.trailer) {
            // Nothing moves the camera while a trailer's recorded; Escape stops it
            if (code === "Escape") {
                this.cancelTrailer();
            }
        } else if (this.director) {
            if (!this.director.press(code) && (code === "F3" || code === "KeyM")) {
                this.onKeyPress(code);
            }
        } else if (this.cinematic) {
            this.skipCinematic();
        } else {
            this.onKeyPress(code);
        }
    }

    private onKeyPress = (code: string): void => {
        if (code === "F3") {
            this.store.set({ debug: !this.store.getSnapshot().debug });
            return;
        }
        if (code === "KeyM") {
            this.toggleMute(true);
            return;
        }
        if (code === "KeyQ" && this.sim) {
            this.toggleQuestTracker();
            return;
        }
        if (code === "Tab" && this.isPlaying()) {
            this.toggleDamagePanel();
            return;
        }
        const sim = this.sim;
        if (!sim) {
            return;
        }
        const overlay = this.store.getSnapshot().overlay;
        if (code === "Escape" || code === "KeyP") {
            if (overlay === "paused") {
                this.resume();
            } else if (overlay === "none") {
                this.pause();
            } else if (overlay === "event" && code === "Escape") {
                this.leaveEvent();
            }
        } else if (overlay === "event" && code.startsWith("Digit")) {
            this.chooseEvent(parseInt(code.slice(5)) - 1);
        } else if (overlay === "levelUp" && code.startsWith("Digit")) {
            const index = parseInt(code.slice(5)) - 1;
            if (index >= 0 && index < sim.choices.length) {
                this.choose(index);
            }
        } else if (overlay === "paused" && this.coopRun && code.startsWith("Digit")) {
            // The run goes on behind co-op's menu
            this.useItem(parseInt(code.slice(5)) - 1);
        } else if (
            (overlay === "none" || (overlay === "paused" && this.coopRun)) &&
            code === "Space"
        ) {
            this.useAbility();
        } else if (overlay === "levelUp" && code === "KeyR") {
            this.reroll();
        } else if (overlay === "levelUp" && code === "KeyX") {
            this.skip();
        } else if (overlay === "none" && code.startsWith("Digit") && this.hasKit(sim)) {
            // A hero's own buttons: 1 to 4 after Space's (CharacterDef.abilities)
            this.useAbility(parseInt(code.slice(5)));
        } else if (overlay === "none" && code.startsWith("Digit")) {
            // The casket screen has its own keys (it knows when its animation
            // is done)
            this.useItem(parseInt(code.slice(5)) - 1);
        }
    };

    // ---- Frame ----

    update(deltaTimeMs: number, camera: Camera): void {
        this.renderer.fpsLimit = frameCap(
            this.display.frameRate,
            isCoarsePointer,
            this.isStoppedBehindMenu(),
        );
        this.fps = this.fps * 0.95 + (deltaTimeMs > 0 ? 1000 / deltaTimeMs : 0) * 0.05;
        this.input.pollPads(performance.now(), this.isPlaying() ? "run" : "menu");
        const wheel = this.input.takeWheel();
        if (wheel !== 0 && this.sim) {
            this.cameraRig.zoom(wheel);
        }
        this.store.expireToasts();
        this.showInstruction(performance.now());

        setPlayArea(this.renderer, this.grid, this.sim?.map.scaperune === true);

        const sim = this.sim;
        if (!sim) {
            this.updateAttract(deltaTimeMs, camera);
            return;
        }

        if (this.coopRun) {
            if (this.coopTicker) {
                this.coopTicker.render();
            } else {
                this.updateCoop(deltaTimeMs, sim, this.coopRun);
            }
        } else if (
            !this.paused &&
            // The shot editor holds the run, but for a live trailer's frames
            (this.director
                ? this.trailer?.rolling && this.trailer.live
                : !this.cinematic?.holdsRun) &&
            (sim.state === "playing" || sim.runOver)
        ) {
            const wasOver = sim.runOver;
            this.accumulator = Math.min(
                this.accumulator + deltaTimeMs,
                TICK_MS * MAX_TICKS_PER_FRAME,
            );
            let steps = 0;
            while (
                this.accumulator >= TICK_MS &&
                steps < SOLO_TICKS_PER_FRAME &&
                (sim.state === "playing" || sim.runOver)
            ) {
                steps++;
                this.accumulator -= TICK_MS;
                const move = this.input.getMoveVector(this.move);
                // Stood still while the cinematic plays
                const held = this.cinematic !== undefined;
                sim.step(held ? 0 : move.x, held ? 0 : move.y);
                this.handleEvents(sim, sim.takeEvents());
            }
            if (sim.state !== "playing" && !wasOver) {
                this.syncOverlay();
                // Auto alch can have the run going again, with no time lost
                if (!sim.runOver && this.store.getSnapshot().overlay !== "none") {
                    this.accumulator = 0;
                }
            }
        }

        for (const hero of sim.heroes) {
            // A level-up offering a weapon bakes its swing ahead of the pick
            const choices = hero.choices.length > 0 ? hero.choices : undefined;
            if (
                hero.appearanceVersion !== this.appearanceVersions[hero.index] ||
                choices !== this.lookChoices[hero.index]
            ) {
                this.appearanceVersions[hero.index] = hero.appearanceVersion;
                this.lookChoices[hero.index] = choices;
                this.assets.setPlayerAppearance(
                    getRunAppearance(sim, hero.index, this.heroLooks[hero.index]),
                    hero.index,
                    getRunAttackSeqs(sim, hero.index),
                    getOfferedAttackSeqs(sim, hero.index),
                );
            }
        }
        this.followTombs(sim);

        const now = performance.now();
        if (now - this.lastHudUpdate > HUD_INTERVAL_MS) {
            this.updateHud(false);
            this.announceTasks(sim);
        }

        this.viewHero = this.getViewHero(sim);
        this.view.viewHero = this.viewHero;
        const alpha = this.getAlpha();
        this.view.localPlayerPose = this.coopStopped
            ? undefined
            : this.coopRun?.prediction?.render(alpha);
        // Pets walk behind their players as they're drawn: a co-op guest's own hero where
        // prediction has them, ahead of the sim
        const predicted = this.view.localPlayerPose;
        this.view.pets.update(sim, (hero) =>
            predicted?.hero === hero ? predicted : sim.heroes[hero]?.player,
        );
        const { x: px, y: py } = getPlayerPose(
            sim,
            this.viewHero,
            alpha,
            this.view.localPlayerPose,
        );
        // Aim at the player's chest, not their feet
        let ground = this.grid.getHeight(px, py) / 128;
        if (sim.map.scaperune) {
            const last = this.cameraGround ?? ground;
            ground = last + (ground - last) * (1 - Math.exp(-deltaTimeMs / CAMERA_GROUND_EASE));
            this.cameraGround = ground;
        }
        const lean = this.getRaidRoomLean(sim, now) ?? this.getBossLean(sim, px, py);
        const ease = 1 - Math.exp(-deltaTimeMs / BOSS_LEAN_EASE);
        this.cameraLean.x += (lean.x - this.cameraLean.x) * ease;
        this.cameraLean.y += (lean.y - this.cameraLean.y) * ease;
        const pan = this.getIntroPan(sim, px, py, alpha);
        const shake = this.getShake(now);
        const cinematic = this.updateCinematic(deltaTimeMs, sim, alpha, {
            x: px + this.cameraLean.x + pan.x,
            y: py + this.cameraLean.y + pan.y,
            height: ground - 0.6,
            pitch: this.cameraRig.pitch,
            yaw: this.cameraRig.yaw,
            distance: this.cameraRig.distance,
        });
        if (cinematic) {
            const rig = this.cinematicRig;
            rig.pitch = cinematic.pitch;
            rig.yaw = cinematic.yaw;
            rig.distance = cinematic.distance;
            rig.apply(camera, cinematic.x, cinematic.height, cinematic.y);
            this.cameraOffsetY = cinematic.y - py;
        } else {
            this.cameraRig.apply(
                camera,
                px + this.cameraLean.x + pan.x + shake.x,
                ground - 0.6,
                py + this.cameraLean.y + pan.y + shake.y,
            );
            this.cameraOffsetY = this.cameraLean.y + pan.y + shake.y;
        }
        const lighting = sim.lighting;
        if (lighting) {
            // Lit round the view's middle, which a cinematic takes away from the player
            this.sceneLights.update(
                this.renderer,
                sim,
                lighting,
                alpha,
                this.viewHero,
                this.view.localPlayerPose,
                cinematic ? cinematic.x : px,
                cinematic ? cinematic.y : py,
                deltaTimeMs / 1000,
                this.grid.data.glowLocs,
                this.view.getCinematicLights(),
            );
        }
        // A raid hall can be drawn darker than the map, and washed with a colour
        // (RaidRoomDef.hall)
        const hall =
            sim.map.raid && sim.raidStage === "waves"
                ? sim.map.raid.rooms[sim.raidRoom].hall
                : undefined;
        // A map of two worlds' realm (RealmRuleDef.look): its twin drawn in the city's place, darker
        // and washed with its colour
        const realm = sim.realm?.layer === 1 ? sim.realm.def.look : undefined;
        if (sim.map.twin) {
            this.renderer.setTwinShown(realm !== undefined);
        }
        const hallBrightness =
            hall?.brightness ?? (realm && realm.brightness * (sim.map.brightness ?? 1));
        // Under the cold, its cold light (ColdRuleDef.look)
        // An invading Duke's pocket, seen from in it (core/rules/invasion.ts)
        const wash =
            hall?.wash ??
            realm?.wash ??
            sim.cold?.def.look.wash ??
            (sim.pocket?.kind === "cold" && sim.inPocket(sim.player.x, sim.player.y)
                ? POCKET_COLD_WASH
                : undefined);
        if (wash !== this.shownWash) {
            this.shownWash = wash;
            this.renderer.setWash(wash);
        }
        // A gaze's light, brought up as it winds up and let down after (BossAttackDef.cover),
        // eased both ways so it never steps
        const light = getGazeLight(sim);
        this.gazeLight += (light - this.gazeLight) * (1 - Math.exp(-deltaTimeMs / GAZE_LIGHT_EASE));
        const brightness = (hallBrightness ?? sim.map.brightness ?? 1) * this.gazeLight;
        if (brightness !== this.shownBrightness) {
            this.shownBrightness = brightness;
            this.renderer.setBrightness(brightness);
        }
    }

    // A hero's own buttons, for the HUD (CharacterDef.abilities): always in reach, as they go
    // off with or without anything to hit, as the map's blessings have made them
    private getKitViews(sim: Sim): AbilityView[] | undefined {
        const hero = sim.heroes[sim.focus] ?? sim.heroes[0];
        const kit = getCharacter(hero.characterId).abilities;
        return kit?.map((written, slot) => {
            const { ability, by } = sim.kitAbility(slot, hero) ?? { ability: written, by: [] };
            const left = sim.kitSecondsLeft(slot, hero);
            return {
                name: ability.name,
                iconObjId: ability.iconObjId,
                // A blessing that shortened it mid-wait can leave more to wait than it now takes
                charge: Math.max(0, Math.round((1 - left / ability.cooldown) * 20) / 20),
                inReach: true,
                opened: false,
                guide: false,
                withItems: false,
                hint: false,
                keyLabel: slot === 0 ? "Space" : String(slot),
                description:
                    by.length > 0
                        ? `${ability.description} Blessed by ${by.map((b) => b.name).join(", ")}.`
                        : ability.description,
            };
        });
    }

    // The fight's own button, for the HUD (Sim.ability): lit as gold while what it'd land on (or
    // the boss on the bar, out of reach) has its guard down
    private getAbilityView(sim: Sim): AbilityView | undefined {
        const ability = sim.ability;
        if (!ability) {
            return undefined;
        }
        const boss = sim.abilityTarget() ?? sim.shownBoss;
        const left = sim.abilitySecondsLeft();
        const seconds = this.secondsSinceBossUp(sim);
        return {
            name: ability.name,
            iconObjId: ability.iconObjId,
            charge: Math.round((1 - left / ability.cooldown) * 20) / 20,
            inReach: sim.abilityTarget() !== undefined,
            opened: boss !== undefined && !boss.dead && sim.isExposed(boss),
            guide: ability.guide === true,
            withItems: !sim.map.fight,
            hint:
                ability.guide === true &&
                !this.abilityUsed &&
                seconds !== undefined &&
                seconds >= ABILITY_HINT_FROM &&
                seconds < ABILITY_HINT_UNTIL,
        };
    }

    // Seconds since the boss on the bar was up (bossUp), or undefined with none living. Another
    // boss coming on while one's shown (a co-op copy, the next phase) doesn't start it again.
    private secondsSinceBossUp(sim: Sim): number | undefined {
        const boss = sim.shownBoss;
        if (!boss || boss.dead) {
            this.bossUp = undefined;
            return undefined;
        }
        if (this.bossUp?.sim !== sim) {
            if (boss.risingEnd > sim.tick) {
                return undefined;
            }
            this.bossUp = { sim, tick: sim.tick };
        }
        return (sim.tick - this.bossUp.tick) / TICKS_PER_SECOND;
    }

    // A blow at (x, y) shakes the camera, less the further off the player it is, and not at
    // all for someone who's turned it off (or asked their system for less motion)
    private startShake(sim: Sim, x: number, y: number, strength: number): void {
        if (!this.display.screenShake || strength <= 0) {
            return;
        }
        const player = sim.heroes[this.viewHero]?.player ?? sim.player;
        const away = Math.hypot(x - player.x, y - player.y);
        const near = Math.min(1, Math.max(0, (SHAKE_FAR - away) / (SHAKE_FAR - SHAKE_NEAR)));
        const now = performance.now();
        const left = this.shakeLeft(now);
        this.shake = { strength: Math.max(left, strength * near), start: now };
    }

    // What's left of the shake, fading out over SHAKE_MS
    private shakeLeft(now: number): number {
        const t = (now - this.shake.start) / SHAKE_MS;
        return t >= 1 ? 0 : this.shake.strength * (1 - t) * (1 - t);
    }

    // The camera's offset for it now, in tiles: a quick wobble, both ways
    private getShake(now: number): { x: number; y: number } {
        const left = this.shakeLeft(now);
        if (left <= 0) {
            return { x: 0, y: 0 };
        }
        const reach = left * SHAKE_TILES;
        return { x: Math.sin(now * 0.09) * reach, y: Math.cos(now * 0.077) * reach };
    }

    // Everything the opening cinematic's camera will see is loaded before it starts, behind the
    // loading screen, and kept until it's over (MapManager.setPinned), so nothing pops in as it
    // flies over the map
    private preloadCinematic(sim: Sim, cinematic: CinematicPlayer): void {
        this.pinCinematic(sim, cinematic.def);
        this.cinematicLoading = performance.now();
        this.store.set({
            screen: "loading",
            loadingText: t("canvas.travelling", { name: tl(sim.map.name) }),
            loadingProgress: 0,
        });
    }

    // The squares a cinematic's camera will see, loaded wherever the camera is and kept
    // (getCinematicSquares, MapManager.setPinned)
    private pinCinematic(sim: Sim, def: CinematicDef): void {
        const ground = (x: number, y: number) => this.grid.getHeight(x, y) / 128;
        const squares = getCinematicSquares(def, ground, this.getStandingCamera(sim));
        this.renderer.mapManager.setPinned(squares);
    }

    // The run's camera on the player where they stand, before anything leans or pans it
    private getStandingCamera(sim: Sim): CinematicCamera {
        const { x, y } = sim.player;
        return {
            x,
            y,
            height: this.grid.getHeight(x, y) / 128 - 0.6,
            pitch: this.cameraRig.pitch,
            yaw: this.cameraRig.yaw,
            distance: this.cameraRig.distance,
        };
    }

    // Whether the cinematic's still waiting on what it sees to load, showing how far it's got
    private isCinematicLoading(): boolean {
        const since = this.cinematicLoading;
        if (since === undefined) {
            return false;
        }
        const { total, left } = this.renderer.mapManager.getPinnedProgress();
        if (left > 0 && performance.now() - since < CINEMATIC_LOAD_MS) {
            const progress = Math.round(((total - left) / Math.max(1, total)) * 100);
            if (progress !== this.store.getSnapshot().loadingProgress) {
                this.store.set({ loadingProgress: progress });
            }
            return true;
        }
        this.cinematicLoaded();
        return false;
    }

    // What the cinematic sees is in, or it's stopped waiting (the time's up, or it was skipped):
    // the run's screen, and a co-op guest tells the host it's ready, as the host's run waits for
    // everyone's (CoopRun.waitingForLoad)
    private cinematicLoaded(): void {
        if (this.cinematicLoading === undefined) {
            return;
        }
        this.cinematicLoading = undefined;
        if (this.store.getSnapshot().screen === "loading") {
            this.store.set({ screen: "run" });
        }
        if (this.coopRun && !this.coop.isHost) {
            this.coop.sendUp({ loaded: true });
        }
    }

    // The opening cinematic on by a frame (MapDef.cinematic): its sounds as their cues go by,
    // and where its camera is, or undefined once it's over (or there isn't one). play: the run's
    // camera now, which it ends on.
    private updateCinematic(
        deltaTimeMs: number,
        sim: Sim,
        alpha: number,
        play: CinematicCamera,
    ): CinematicCamera | undefined {
        this.startLairOpening(sim);
        const cinematic = this.cinematic;
        if (!cinematic) {
            return undefined;
        }
        const ground = (x: number, y: number) => this.grid.getHeight(x, y) / 128;
        if (this.isCinematicLoading()) {
            return getCinematicCamera(cinematic.def, 0, ground, play);
        }
        if (this.director) {
            return this.updateDirector(deltaTimeMs, sim, this.director, play);
        }
        // A lair's is on the sim's clock, from when it woke or was unsealed. The map's own plays on
        // behind a menu (a co-op run's pause doesn't stop it either), a frame at most at a time
        // (the first after the map loads can be long).
        const cues = cinematic.onSim
            ? cinematic.advanceTo((sim.tick + alpha - this.lairCinematicTick) / TICKS_PER_SECOND)
            : cinematic.advance(Math.min(deltaTimeMs, CINEMATIC_MAX_FRAME_MS) / 1000);
        for (const cue of cues) {
            if (cue.sound !== undefined) {
                this.audio.play(cue.sound, { volume: 1, minGap: 0 });
            }
        }
        if (cinematic.done) {
            this.endCinematic();
            return undefined;
        }
        return getCinematicCamera(cinematic.def, cinematic.seconds, ground, play);
    }

    // A lair's opening as it wakes (LairDef.opening), once for each time it does, and a locked
    // one's as it's unsealed (LairUnsealingDef)
    private startLairOpening(sim: Sim): void {
        if (this.cinematic) {
            return;
        }
        const lair = sim.lair;
        const opening = lair?.def.opening;
        if (opening && lair?.state === "waking" && this.lairOpeningTick !== lair.wakeTick) {
            this.lairOpeningTick = lair.wakeTick;
            this.playLairCinematic(opening.cinematic, lair.wakeTick);
            return;
        }
        const unsealed = sim.unsealing;
        const unsealing = unsealed?.def.requires?.unsealing;
        if (unsealed && unsealing && this.lairUnsealTick !== unsealed.unsealTick) {
            this.lairUnsealTick = unsealed.unsealTick;
            // It goes off to the lair: what it sees is kept loaded until it's over
            this.pinCinematic(sim, unsealing.cinematic);
            this.playLairCinematic(unsealing.cinematic, unsealed.unsealTick);
        }
    }

    private playLairCinematic(def: CinematicDef, fromTick: number): void {
        this.lairCinematicTick = fromTick;
        this.cinematic = new CinematicPlayer(def, true);
        this.view.cinematic = this.cinematic;
        this.store.set({ cinematic: true });
    }

    // Dev only: the shot editor (CinematicDirector) on mapId's cinematic at index
    // (getDirectorChoices), after starting a run there if this isn't one: ?director=<map id>, or
    // game.direct() from the console. It holds the run where it stands, never to step, until it's
    // left with the run (leaveRun).
    async direct(
        mapId: string = this.sim?.map.id ?? this.store.getSnapshot().mapId,
        index = 0,
    ): Promise<void> {
        if (!import.meta.env.DEV) {
            return;
        }
        if (this.coopRun) {
            this.store.toast("The shot editor is for solo runs.");
            return;
        }
        if (this.sim?.map.id !== mapId) {
            if (this.sim) {
                this.leaveRun(false);
            }
            await this.startRun(mapId);
        }
        const sim = this.sim;
        if (!sim || sim.map.id !== mapId) {
            this.store.toast(`No run started on ${mapId}: is it open in this save?`, 6000);
            return;
        }
        const choices = getDirectorChoices(sim.map);
        const ground = (x: number, y: number) => this.grid.getHeight(x, y) / 128;
        let drafts: Storage | undefined;
        try {
            drafts = window.localStorage;
        } catch {
            // Blocked: drafts aren't kept
        }
        this.director = new CinematicDirector(
            choices,
            Math.min(Math.max(0, index), choices.length - 1),
            ground,
            this.getStandingCamera(sim),
            drafts,
        );
        this.cinematic = this.director.player;
        this.view.cinematic = this.cinematic;
        this.paused = false;
        this.pinCinematic(sim, this.director.def);
        const version = this.director.shotsVersion;
        this.directorPins = { pinned: version, seen: version, changed: 0 };
        this.store.set({ cinematic: true, director: this.director, overlay: "none" });
    }

    // The shot editor on by a frame: flown by the keys held, its cues heard as it plays, and what
    // its camera will see loaded once its shots have stood still a moment
    private updateDirector(
        deltaTimeMs: number,
        sim: Sim,
        director: CinematicDirector,
        play: CinematicCamera,
    ): CinematicCamera {
        const held = (...codes: string[]) =>
            codes.some((code) => this.input.isDown(code)) ? 1 : 0;
        const fly: FlyInput = {
            forward: held("KeyW") - held("KeyS"),
            right: held("KeyD") - held("KeyA"),
            up: held("KeyE") - held("KeyQ"),
            turn: held("ArrowRight") - held("ArrowLeft"),
            tilt: held("ArrowUp") - held("ArrowDown"),
            fast: held("ShiftLeft", "ShiftRight") === 1,
        };
        const seconds = Math.min(deltaTimeMs, CINEMATIC_MAX_FRAME_MS) / 1000;
        const { camera, cues } = director.frame(seconds, play, this.trailer ? undefined : fly);
        for (const cue of cues) {
            if (cue.sound !== undefined) {
                this.audio.play(cue.sound, { volume: 1, minGap: 0 });
            }
        }
        const pins = this.directorPins;
        const now = performance.now();
        if (director.shotsVersion !== pins.seen) {
            pins.seen = director.shotsVersion;
            pins.changed = now;
        }
        if (pins.seen !== pins.pinned && now - pins.changed > DIRECTOR_PIN_MS) {
            this.pinCinematic(sim, director.def);
            pins.pinned = pins.seen;
        }
        return camera;
    }

    // Dev only: the shot editor's cinematic recorded as a trailer (TrailerRecorder), an MP4 that
    // the dev server makes in trailers/ with ffmpeg. Where it is, or undefined if it wasn't made
    // (a toast says why). From the console: game.recordTrailer({ from: 2, to: 8, live: true }).
    async recordTrailer(options: TrailerOptions = {}): Promise<string | undefined> {
        const director = this.director;
        const sim = this.sim;
        if (!import.meta.env.DEV || !director || !sim || this.trailer) {
            return undefined;
        }
        const spec = getTrailerSpec(options, director.def.seconds, sim.map.id);
        director.pause();
        director.seek(spec.from);
        this.pinCinematic(sim, director.def);
        const trailer = { live: spec.live, rolling: false };
        const recorder = new TrailerRecorder(spec, {
            renderer: this.renderer,
            overlay: this.overlay.canvas,
            audio: this.audio,
            getLoading: () => this.renderer.mapManager.getPinnedProgress(),
            roll: () => {
                trailer.rolling = true;
                this.accumulator = 0;
                director.playFrom(spec.from);
            },
            cut: () => {
                trailer.rolling = false;
                director.pause();
            },
            beforeFrame: () => {
                if (spec.live) {
                    this.keepTrailerRunGoing(sim);
                }
            },
            onProgress: (trailer) => this.store.set({ trailer }),
        });
        this.trailer = Object.assign(trailer, { recorder });
        this.store.set({ trailer: { stage: "loading", done: 0, total: 1 } });
        try {
            if (spec.live && spec.warmup > 0) {
                this.warmUpTrailer(sim, spec.warmup);
            }
            const file = await recorder.record();
            this.store.toast(`Trailer saved to ${file}`, 10000);
            return file;
        } catch (error) {
            if (recorder.cancelled) {
                this.store.toast("Trailer cancelled.");
            } else {
                console.error("No trailer", error);
                const why = error instanceof Error ? error.message : String(error);
                this.store.toast(`No trailer: ${why}`, 10000);
            }
            return undefined;
        } finally {
            this.trailer = undefined;
            this.store.set({ trailer: undefined });
        }
    }

    cancelTrailer(): void {
        this.trailer?.recorder.cancel();
    }

    // A live trailer's run: no one dies, and anything it'd stop to ask is answered straight away
    private keepTrailerRunGoing(sim: Sim): void {
        for (const hero of sim.heroes) {
            hero.player.hp = hero.player.maxHp;
        }
        if (sim.isChoosing()) {
            const index = sim.choices.findIndex((_, i) => !sim.isBanishedChoice(i));
            this.choose(Math.max(0, index));
        } else if (sim.state === "chest") {
            this.resolveChest("take");
            if (sim.state === "chest") {
                this.resolveChest("alch");
            }
        } else if (sim.state === "event") {
            this.leaveEvent();
        }
    }

    // A live trailer's run played on for seconds before it's recorded, unseen and unheard, so
    // there's a fight on when it starts
    private warmUpTrailer(sim: Sim, seconds: number): void {
        this.audio.startRecording(performance.now());
        try {
            const ticks = Math.round(seconds * TICKS_PER_SECOND);
            for (let tick = 0; tick < ticks && !sim.runOver; tick++) {
                this.keepTrailerRunGoing(sim);
                if (sim.state !== "playing") {
                    break;
                }
                sim.step(0, 0);
                this.handleEvents(sim, sim.takeEvents());
            }
            this.keepTrailerRunGoing(sim);
        } finally {
            this.audio.stopRecording();
        }
    }

    // Any key, click, tap or button during a cinematic: straight to the run. On the loading
    // screen before it, that skips the wait too.
    skipCinematic(): void {
        const cinematic = this.cinematic;
        const loading = this.cinematicLoading;
        const waited = loading === undefined ? 0 : (performance.now() - loading) / 1000;
        if (!this.director && cinematic?.skip(waited)) {
            this.endCinematic();
            // Solo, a lair's boss comes straight on (in co-op, the others may be watching)
            if (cinematic.onSim && !this.coopRun) {
                this.sim?.skipLairOpening();
            }
        }
    }

    private endCinematic(): void {
        if (this.director) {
            this.director = undefined;
            this.store.set({ director: undefined });
        }
        if (!this.cinematic) {
            return;
        }
        this.cinematic = undefined;
        this.view.cinematic = undefined;
        // What it saw goes back to loading and unloading with the camera
        this.renderer.mapManager.setPinned([]);
        this.cinematicLoaded();
        // The solo run's clock starts from here: nothing banked while it was held
        this.accumulator = Math.min(this.accumulator, TICK_MS);
        if (this.store.getSnapshot().cinematic) {
            this.store.set({ cinematic: false });
        }
    }

    // A boss's intro that pans (BossIntroDef.pan): from the player to where it rises, held
    // there, then eased back to the player
    private getIntroPan(sim: Sim, px: number, py: number, alpha: number): { x: number; y: number } {
        const intro = sim.intro;
        const pan = intro?.def.boss?.intro?.pan;
        const rise = sim.riseSpot;
        if (!intro || !pan) {
            return { x: 0, y: 0 };
        }
        const at = intro.boss ?? rise;
        if (!at) {
            return { x: 0, y: 0 };
        }
        const seconds = (sim.tick + alpha - intro.startTick) / TICKS_PER_SECOND;
        const t = Math.min(1, Math.max(0, (seconds - pan.from) / pan.over));
        const away = 1 - t * t * (3 - 2 * t);
        return { x: (at.x - px) * away, y: (at.y - py) * away };
    }

    // In a raid's boss room, while its boss is up: north just far enough that its head, and its
    // overhead prayer, are below the boss bar (up to RAID_LEAN_MAX), measured on last frame's
    // camera. Undefined anywhere else.
    private getRaidRoomLean(sim: Sim, now: number): { x: number; y: number } | undefined {
        const boss = sim.shownBoss;
        if (!sim.map.raid || sim.raidStage !== "boss" || !boss || boss.dead || sim.intro) {
            return undefined;
        }
        const overlay = this.overlay;
        if (overlay.height === 0) {
            return { x: 0, y: 0 };
        }
        // Where its overhead prayer's drawn from (BossFightView.drawOverheads), and the icon's top
        const model = this.assets.get(getEnemyModelKey(boss.def, boss.variant));
        const top =
            this.grid.getHeight(boss.x, boss.y) / 128 -
            ((model?.height ?? 128) * boss.scale) / 128 -
            OVERHEAD_GAP;
        const icon = this.assets.getSprite(PRAYER_HEADICON_SPRITE, PRAYER_HEADICON_FRAME_IDS[0]);
        const iconHeight = (icon?.height ?? 25) * OVERHEAD_SCALE * overlay.uiScale;
        const head = overlay.project(boss.x, top, boss.y, this.leanPoint).y - iconHeight;
        // How far up the screen a tile further north moves it
        const perTile =
            head + iconHeight - overlay.project(boss.x, top, boss.y + 1, this.leanPoint).y;
        if (!(perTile > 0)) {
            return { x: 0, y: this.cameraLean.y };
        }
        // Leaning north moves everything down the screen by perTile a tile. Last frame's camera
        // was off by all of cameraOffsetY (its lean, and a shake), so the lean wanted is that and
        // what's short of it.
        const lean = this.cameraOffsetY + (this.getBossBarBottom(now) - head) / perTile;
        return { x: 0, y: lean > RAID_LEAN_MAX ? 0 : Math.max(0, lean) };
    }

    // The boss bar's bottom edge in the overlay's pixels, looked up now and then (a layout read)
    private getBossBarBottom(now: number): number {
        if (!this.bossBarBottom || now - this.bossBarBottom.at > 500) {
            const bar = document.querySelector(".ui-boss-bar")?.getBoundingClientRect();
            const overlay = this.overlay;
            const scale = overlay.height / Math.max(1, overlay.canvas.offsetHeight);
            const canvasTop = overlay.canvas.getBoundingClientRect().top;
            this.bossBarBottom = { y: bar ? (bar.bottom - canvasTop) * scale : 0, at: now };
        }
        return this.bossBarBottom.y;
    }

    // Towards a boss that asks for it (BossLookDef.lean), wherever it is
    private getBossLean(sim: Sim, px: number, py: number): { x: number; y: number } {
        const boss = sim.shownBoss;
        const at = boss?.def.boss?.look?.lean && !boss.dead && !sim.intro ? boss : undefined;
        if (!at) {
            return { x: 0, y: 0 };
        }
        const lean = at.def.boss!.look!.lean;
        const share = typeof lean === "object" ? lean.share : BOSS_LEAN;
        const phone = this.cameraRig.distance === PHONE_RUN_DISTANCE;
        const max = typeof lean === "object" ? (phone ? lean.phone : lean.max) : BOSS_LEAN_MAX;
        const dx = (at.x - px) * share;
        const dy = (at.y - py) * share;
        const length = Math.hypot(dx, dy);
        const scale = length > max ? max / length : 1;
        return { x: dx * scale, y: dy * scale };
    }

    // Nothing but the scenery moves: the title screen, or a solo run that's stopped
    // for a menu (a level up, a casket, the pause menu, the results). A co-op run
    // carries on behind its menus.
    private isStoppedBehindMenu(): boolean {
        const sim = this.sim;
        if (!sim) {
            return true;
        }
        return !this.coopRun && (this.paused || sim.state !== "playing");
    }

    // A co-op run: frames step at the run's pace, the host's whenever it
    // likes, a guest's as the host's arrive (catching up if it's fallen
    // behind). The menu doesn't stop it, and neither does a level up: the
    // frames carry everyone's choices.
    private updateCoop(deltaTimeMs: number, sim: Sim, run: CoopRun): void {
        if (this.coopStopped) {
            return;
        }
        this.coop.keepAlive();
        // Which can lose the room, and with it this run
        if (this.coopStopped || this.coopRun !== run) {
            return;
        }
        if (run.stuck || run.cantCatchUp) {
            this.endBrokenCoopRun(run);
            return;
        }
        const move = this.input.getMoveVector(this.move);
        // Standing still while choosing (the menu doesn't stop the run, so
        // moving goes on behind it)
        // and through the opening cinematic
        const deciding =
            (this.store.getSnapshot().overlay !== "none" && !this.paused) ||
            this.cinematic !== undefined;
        run.setMove(deciding ? 0 : move.x, deciding ? 0 : move.y);
        this.accumulator += Math.min(deltaTimeMs, TICK_MS * MAX_TICKS_PER_FRAME);
        const catchUp = run.isHost ? 0 : Math.max(0, run.behind - GUEST_BUFFER_FRAMES);
        const started = performance.now();
        // The host waits for its own opening cinematic's squares, as for the guests'
        const loading = run.isHost && this.cinematicLoading !== undefined;
        let steps = 0;
        let threw = true;
        try {
            while (!loading && run.canStep() && steps < MAX_CATCH_UP_TICKS) {
                if (this.accumulator >= TICK_MS) {
                    this.accumulator -= TICK_MS;
                } else if (steps >= catchUp || performance.now() - started > CATCH_UP_BUDGET_MS) {
                    break;
                }
                steps++;
                const events = run.stepFrame();
                this.handleEvents(sim, sim.takeEvents());
                for (const event of events) {
                    if (event.action && event.hero === sim.focus) {
                        this.afterCoopAction(sim, event.action);
                        if (event.auto) {
                            this.store.toast(t("toast.decided_for_you"), 4000);
                        }
                    }
                }
            }
            threw = false;
        } finally {
            if (threw || loading || !run.canStep()) {
                // Waiting on the host, or stopped by an error after a step: no
                // time to make up (an error every frame would otherwise bank
                // it, for a rush of frames once it stops)
                this.accumulator = Math.min(this.accumulator, TICK_MS);
            }
            // What was stepped goes out even if something after a step threw,
            // or everyone else waits on frames that never come
            run.flush();
        }
        if (run.desynced && !this.runRecorded) {
            // Nothing brings the copies back together, so this one stops
            // rather than everyone waiting on it
            this.coop.leave();
            this.endCoopRunEarly(t("toast.out_of_step"));
            return;
        }
        // Choices and caskets come and go with the frames
        const key = this.getDecisionKey(sim);
        if (key !== this.decisionKey) {
            this.decisionKey = key;
            this.syncOverlay();
        }
        // Only while frames are coming: a reconnecting lobby holds what's
        // sent, and a pile of answers would go on to the next caskets
        if (steps > 0) {
            this.resendAutoChest(sim, run);
        }
    }

    // An automatic casket answer still waiting for its frame: CoopRun.act
    // drops it until it's waited long enough to be lost or turned away, then
    // sends it again. The casket's hidden, so there's nothing to click.
    private resendAutoChest(sim: Sim, run: CoopRun): void {
        const answer = this.autoChest;
        if (answer && sim.state === "chest" && sim.chest?.uid === answer.uid) {
            run.act({ kind: "chest", action: answer.action });
        }
    }

    // What's come for a co-op run before its copy's made (toCoopRun), and
    // each hero's player id
    private coopInbox?: ((run: CoopRun) => void)[];
    private coopPlayerIds: string[] = [];
    // A co-op run that's ended early for this player (endCoopRunEarly)
    private coopStopped = false;
    private coopTicker?: CoopTicker;

    // Visibility is useful for saves, but is not a reliable indication of
    // whether rendering is still being scheduled. Co-op owns a clock for
    // the whole run, including while this page reports itself as visible.
    private onVisibilityChange = (): void => {
        this.cloud?.onVisibility(document.hidden);
    };

    private startCoopTicker(): void {
        this.stopCoopTicker();
        this.coopTicker = new CoopTicker((elapsed) => {
            if (this.sim && this.coopRun && !this.coopStopped) {
                this.updateCoop(elapsed, this.sim, this.coopRun);
            }
        }, TICK_MS);
    }

    private stopCoopTicker(): void {
        this.coopTicker?.stop();
        this.coopTicker = undefined;
    }

    // A co-op action of this player's, now it's been done in its frame
    private afterCoopAction(sim: Sim, action: CoopAction): void {
        if (action.kind === "reroll") {
            this.afterReroll(sim);
        } else if (action.kind === "skip") {
            this.sounds.buy();
        }
        this.updateHud(true);
    }

    // What the run's waiting on, in a form that changes when any of it does
    private getDecisionKey(sim: Sim): string {
        const hero = sim.heroes[sim.focus];
        return [
            sim.state,
            hero.down,
            hero.pendingLevelUps,
            hero.choices.map((c) => c.kind + ("weaponId" in c ? c.weaponId : "")).join(),
            sim.chest?.uid ?? 0,
            sim.chest?.itemId ?? "",
            sim.offer?.uid ?? 0,
            sim.offer?.options.filter((o) => o.kind === "powerUp" && o.sold).length ?? 0,
            sim.waitingOn.map((h) => h.index).join(),
        ].join("|");
    }

    // The Tombs of Amascut bake a room's enemies as the raid gets there, and free a path's once
    // it's done (getTombsStageEnemies): baked all at once, the Wardens' alone were hundreds of MB
    // from the start of the raid. In the background, as each player's game goes by its own sim.
    private followTombs(sim: Sim): void {
        if (!sim.map.tombs) {
            return;
        }
        const wardens = sim.tombsWardens !== undefined;
        const stage = getTombsStageKey(sim.tombsPathsDone, wardens);
        if (stage === this.tombsStage) {
            return;
        }
        this.tombsStage = stage;
        const enemies = getTombsStageEnemies(
            sim.map,
            sim.tombsPathsDone,
            wardens,
            this.runEnemyContent,
        );
        this.assets
            .loadEnemies(enemies)
            .catch((e) => console.error("Couldn't bake the Tombs' enemies", e));
    }

    // The camera's on this player, or on a teammate who's still up while
    // they're down
    private getViewHero(sim: Sim): number {
        const own = sim.heroes[sim.focus];
        if (sim.isUp(own) || sim.runOver) {
            return sim.focus;
        }
        const current = sim.heroes[this.viewHero];
        if (current && current !== own && sim.isUp(current)) {
            return current.index;
        }
        const up = sim.heroes.find((hero) => sim.isUp(hero));
        return up?.index ?? sim.focus;
    }

    private getAlpha(): number {
        const sim = this.sim;
        if (!sim || (this.paused && !this.coopRun) || sim.state !== "playing") {
            return 1;
        }
        return Math.min(1, this.accumulator / TICK_MS);
    }

    // Turns the adventurer round in the Wardrobe, which holds the camera still in front of them.
    // at once: straight there (dragged round), not turning round to it (the arrows).
    turnWardrobeModel(by: number, atOnce = false): void {
        this.wardrobeTurn = wrapYaw(this.wardrobeTurn + by);
        if (atOnce) {
            this.menuModelYaw = wrapYaw(this.menuModelYaw + by);
        }
    }

    // Title screen: the character idles in the courtyard while the camera
    // circles them (unless that's turned off). The Wardrobe holds it in front of them, and turns
    // them instead, so the courtyard behind stays put.
    private updateAttract(deltaTimeMs: number, camera: Camera): void {
        const ticks = deltaTimeMs / TICK_MS;
        this.attractTick += ticks;
        const wardrobe = this.store.getSnapshot().screen === "wardrobe";
        const settle = Math.pow(ATTRACT_SETTLE, ticks);
        if (this.display.menuSpin && !wardrobe) {
            this.attractYaw = (this.attractYaw + ticks * ATTRACT_SPIN) % 2048;
        } else {
            // Back round to the front the short way
            this.attractYaw = settleYaw(this.attractYaw, wardrobe ? WARDROBE_YAW : 0, settle);
        }
        this.menuModelYaw = settleYaw(this.menuModelYaw, wardrobe ? this.wardrobeTurn : 0, settle);
        this.cameraRig.yaw = this.attractYaw & 2047;
        // The Wardrobe comes in close, the adventurer off to the right of its panel
        this.wardrobeZoom += ((wardrobe ? 1 : 0) - this.wardrobeZoom) * (1 - 0.85 ** ticks);
        const zoom = this.wardrobeZoom < 0.001 ? 0 : this.wardrobeZoom;
        this.cameraRig.distance = ATTRACT_DISTANCE + (WARDROBE_DISTANCE - ATTRACT_DISTANCE) * zoom;
        this.cameraRig.pitch = Math.round(ATTRACT_PITCH + (WARDROBE_PITCH - ATTRACT_PITCH) * zoom);
        const yaw = (this.cameraRig.yaw / 2048) * 2 * Math.PI;
        const side = WARDROBE_SIDE * zoom;
        const { x, y } = TITLE_MAP.spawn;
        this.cameraRig.apply(
            camera,
            x - Math.cos(yaw) * side,
            this.grid.getHeight(x, y) / 128 - 0.8 + WARDROBE_RISE * zoom,
            y + Math.sin(yaw) * side,
        );
    }

    private handleEvents(sim: Sim, events: SimEvent[]): void {
        if (events.length === 0) {
            return;
        }
        this.view.onEvents(sim, events);
        this.sounds.onEvents(sim, events, this.viewHero);
        for (const event of events) {
            if (event.type === "bossImpact") {
                this.startShake(sim, event.x, event.y, event.shake);
                continue;
            }
            // Co-op: a teammate's own events, said with their name if at all
            if (event.hero !== undefined && event.hero !== sim.focus) {
                this.teammateToast(sim, sim.heroes[event.hero].name, event);
                continue;
            }
            switch (event.type) {
                case "casketDropped":
                    this.store.toast(
                        t("toast.casket_drops", {
                            name: tl(CASKETS[event.tier].name).toLowerCase(),
                        }),
                    );
                    break;
                case "bossSpawned":
                    // The final boss's own track takes over (MapDef.bossMusic)
                    if (event.finalBoss && sim.map.bossMusic) {
                        const music = musicFor(sim.map.bossMusic);
                        if (music) {
                            this.audio.playMusic(music);
                        }
                    }
                    if (event.message) {
                        this.store.toast(event.message, 6000);
                    }
                    break;
                case "bossRose":
                case "bossEnraged":
                case "bossStage":
                    // Bosses that turn up together say so once (Pest Control's
                    // portals, on the first)
                    if (event.message) {
                        this.store.toast(tl(event.message), 6000);
                    }
                    break;
                case "coinsStolen":
                    this.store.toast(
                        t("toast.coins_stolen", {
                            name: tl(getEnemy(event.enemyId).name),
                            n: fmtNum(event.amount),
                        }),
                    );
                    break;
                case "coinsReturned":
                    this.store.toast(t("toast.coins_returned", { n: fmtNum(event.amount) }));
                    break;
                case "revive": {
                    const revive = getUsedRevive(sim.heroes[sim.focus]);
                    this.store.toast(
                        t("toast.revive_saves_you", { item: tl(revive.name).toLowerCase() }),
                    );
                    break;
                }
                case "roundStarted":
                    this.store.toast(describeRound(sim), 7000);
                    break;
                case "worldTurned": {
                    // The realm's quiet, and back in the city its track (or the final boss's)
                    const look = sim.realm?.def.look;
                    const track =
                        event.layer === 1
                            ? look?.music
                            : sim.bossSpawned
                              ? (sim.map.bossMusic ?? sim.map.music)
                              : sim.map.music;
                    const music = track && musicFor(track);
                    if (music) {
                        this.audio.playMusic(music);
                    }
                    // A fight's own way between them (FightAbilityDef.turn: Blackstone)
                    const turned = sim.ability?.turn === true;
                    this.store.toast(
                        t(
                            event.layer === 1
                                ? turned
                                    ? "toast.blackstone_in"
                                    : "toast.realm_in"
                                : event.lapse
                                  ? "toast.realm_lapse"
                                  : turned
                                    ? "toast.blackstone_out"
                                    : "toast.realm_out",
                        ),
                    );
                    break;
                }
                case "frozenSolid":
                    if (event.hero === sim.focus) {
                        // An invading Duke's cold has no braziers: out of it is the way
                        this.store.toast(
                            t(
                                sim.cold?.def.area
                                    ? "toast.frozen_solid_pocket"
                                    : "toast.frozen_solid",
                            ),
                        );
                    }
                    break;
                case "soulCaught":
                    if (event.siphon) {
                        // A boss's siphon's (BossDef.siphon): its last says so itself
                        if (event.left > 0) {
                            this.store.toast(tp("toast.siphon_left", event.left));
                        }
                    } else if (event.left > 0) {
                        this.store.toast(tp("toast.souls_left", event.left));
                    } else {
                        this.store.toast(t("toast.portal_open"));
                    }
                    break;
                case "powerUp":
                    this.store.toast(tl(event.message));
                    break;
                case "notice":
                    if (event.instruction) {
                        this.queueInstruction(tl(event.message));
                    } else {
                        this.store.toast(tl(event.message));
                    }
                    break;
                case "heroDown":
                    this.store.toast(
                        sim.canBeRevived(sim.heroes[sim.focus])
                            ? t("toast.you_down_revivable")
                            : t("toast.you_down"),
                        5000,
                    );
                    break;
                case "heroRevived":
                    this.store.toast(
                        t("toast.revived_you", {
                            name: sim.heroes[event.by].name,
                            minutes: REVIVE_IMMUNITY_SECONDS / 60,
                        }),
                        6000,
                    );
                    break;
                case "extraRevive":
                    this.store.toast(
                        t("toast.extra_revive_you", {
                            revives: describeRevives(sim.revivesLeftFor(sim.heroes[sim.focus])),
                        }),
                        6000,
                    );
                    break;
                case "visitor":
                    if (event.message) {
                        this.store.toast(tl(event.message));
                    }
                    break;
                // An automatic answer had no casket screen to show what it was
                case "alch":
                    if (this.autoChestDone(sim)) {
                        this.store.toast(
                            t("toast.alched", {
                                name: tl(getItem(event.itemId).name),
                                coins: fmtNum(event.coins),
                            }),
                        );
                    }
                    break;
                case "equip":
                    if (this.autoChestDone(sim)) {
                        this.store.toast(
                            event.replacedId
                                ? t("toast.equipped_alched", {
                                      name: tl(getItem(event.itemId).name),
                                      replaced: tl(getItem(event.replacedId).name),
                                      coins: fmtNum(event.coins),
                                  })
                                : t("toast.equipped", { name: tl(getItem(event.itemId).name) }),
                        );
                    }
                    break;
            }
        }
    }

    private teammateToast(sim: Sim, name: string, event: SimEvent): void {
        switch (event.type) {
            case "heroDown":
                this.store.toast(
                    sim.canBeRevived(sim.heroes[event.hero!])
                        ? t("toast.teammate_down_revivable", { name })
                        : t("toast.teammate_down", { name }),
                    5000,
                );
                break;
            case "heroRevived":
                this.store.toast(
                    event.by === sim.focus
                        ? t("toast.you_revive", { name })
                        : t("toast.teammate_revives", {
                              by: sim.heroes[event.by].name,
                              name,
                          }),
                );
                break;
            case "extraRevive":
                this.store.toast(t("toast.teammate_extra_revive", { name }));
                break;
            case "heroLeft":
                this.store.toast(t("toast.teammate_left", { name }));
                break;
            case "revive": {
                const revive = getUsedRevive(sim.heroes[event.hero!]);
                this.store.toast(
                    t("toast.teammate_revive", { name, item: tl(revive.name).toLowerCase() }),
                );
                break;
            }
            case "powerUp":
                this.store.toast(
                    t("toast.teammate_powerup", { name, item: tl(getPowerUp(event.id).name) }),
                );
                break;
        }
    }

    // What Auto alch or Auto equip would do with the open casket's item, if
    // either takes it (Auto alch first)
    private autoChestAction(sim: Sim): ChestAction | undefined {
        const chest = sim.state === "chest" ? sim.chest : undefined;
        if (!chest) {
            return undefined;
        }
        if (this.display.autoAlch) {
            return "alch";
        }
        const item = getItem(chest.itemId);
        return this.display.autoEquip &&
            shouldAutoEquip(sim.gear, sim.gearUpgrades, item, chest.upgrades)
            ? "take"
            : undefined;
    }

    // Answers the open casket for Auto alch or Auto equip, as its button
    // would, with no casket screen (co-op's answer takes a frame or more to
    // come back, and the menu can still open meanwhile). False when the
    // casket's the player's to answer.
    private autoAnswerChest(sim: Sim, waitingOn: string[]): boolean {
        const chest = sim.chest;
        if (!chest) {
            return false;
        }
        const answered = this.autoChest?.uid === chest.uid;
        const action = answered ? undefined : this.autoChestAction(sim);
        if (!answered && !action) {
            return false;
        }
        const overlay = this.paused ? "paused" : "none";
        this.store.set({ overlay, chest: undefined, choices: [], waitingOn });
        if (!action) {
            // Sent already (resendAutoChest sends a lost one again)
            return true;
        }
        this.autoChest = { uid: chest.uid, action };
        if (this.act({ kind: "chest", action })) {
            return true;
        }
        this.autoChest = undefined;
        return false;
    }

    // Whether an alch or equip just done was the automatic answer's (which is
    // then over), rather than the player's own click
    private autoChestDone(sim: Sim): boolean {
        const answer = this.autoChest;
        if (!answer || sim.chests.some((chest) => chest.uid === answer.uid)) {
            return false;
        }
        this.autoChest = undefined;
        return true;
    }

    // Shows whichever modal the run's state calls for
    private syncOverlay(): void {
        const sim = this.sim;
        if (!sim) {
            return;
        }
        // Co-op: who else the run's waiting on
        const waitingOn = sim.waitingOn
            .filter((hero) => hero.index !== sim.focus)
            .map((hero) => hero.name);
        if (sim.state === "dead" || sim.state === "victory") {
            if (sim.state === "dead" && !this.runRecorded) {
                this.sounds.playerDied();
            }
            this.finishRun();
            this.store.set({ overlay: sim.state, choices: [], chest: undefined, waitingOn: [] });
            this.updateHud(true);
        } else if (sim.state === "chest" && sim.chest) {
            if (this.autoAnswerChest(sim, waitingOn)) {
                return;
            }
            // Any earlier automatic answer is done, as this one's first in line
            this.autoChest = undefined;
            const chest = getChestView(sim);
            const shown = this.store.getSnapshot();
            // Co-op: the same casket again keeps its animation where it is
            if (!this.coopRun || shown.overlay !== "chest" || chest?.uid !== shown.chest?.uid) {
                this.store.set({ overlay: "chest", chest, choices: [], waitingOn });
            }
        } else if (sim.state === "event" && sim.offer?.hero === sim.focus) {
            this.store.set({
                overlay: "event",
                event: getEventView(sim),
                choices: [],
                chest: undefined,
                waitingOn,
            });
        } else if (sim.isChoosing()) {
            const was = this.store.getSnapshot().overlay;
            if (was !== "levelUp" || !this.coopRun) {
                this.sounds.levelUp();
            }
            this.store.set({
                overlay: "levelUp",
                choices: getChoiceViews(sim),
                // The ones still to come after this
                levelUpsLeft: Math.max(0, sim.pendingLevelUps - 1),
                chest: undefined,
                waitingOn,
            });
        } else if (this.paused) {
            this.store.set({ overlay: "paused", choices: [], chest: undefined, waitingOn });
        } else {
            this.store.set({ overlay: "none", choices: [], chest: undefined, waitingOn });
        }
    }

    // Co-op: the boss bar shows the living boss nearest this player (each player their own,
    // the final boss no more than any other), and keeps showing it until another is
    // BOSS_BAR_SWITCH tiles nearer. Once every final boss has fallen, the last one's empty bar
    // stays to the victory screen, as solo (Sim.shownBoss)
    private getCoopBarBoss(sim: Sim): Enemy | undefined {
        const player = sim.player;
        let nearest: Enemy | undefined;
        // Squared: only the two compared at the end need their roots
        let nearestDistance = Infinity;
        let keptDistance = Infinity;
        let fallen: Enemy | undefined;
        let finalUp = false;
        for (const enemy of sim.enemies) {
            if (!enemy.boss) {
                continue;
            }
            if (enemy.dead) {
                if (enemy.finalBoss && !sim.endless) {
                    fallen = enemy;
                }
                continue;
            }
            if (enemy.finalBoss) {
                finalUp = true;
            }
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = dx * dx + dy * dy;
            if (enemy === this.coopBarBoss) {
                keptDistance = distance;
            }
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = enemy;
            }
        }
        if (fallen && !finalUp) {
            this.coopBarBoss = undefined;
            return fallen;
        }
        // (one that's gone or fallen has no distance, so gives way)
        if (Math.sqrt(keptDistance) - Math.sqrt(nearestDistance) < BOSS_BAR_SWITCH) {
            return this.coopBarBoss;
        }
        this.coopBarBoss = nearest;
        return nearest;
    }

    private updateHud(force: boolean): void {
        const sim = this.sim;
        if (!sim) {
            return;
        }
        this.lastHudUpdate = performance.now();
        const thisLevel = sim.xpForThisLevel;
        const nextLevel = sim.xpForNextLevel;
        let boss: HudNumbers["boss"];
        const shownBoss = sim.heroes.length > 1 ? this.getCoopBarBoss(sim) : sim.shownBoss;
        if (shownBoss) {
            const phase = shownBoss.bossState?.phase;
            const parasite = sim.parasite;
            boss = {
                name: shownBoss.def.name,
                fraction: shownBoss.dead ? 0 : shownBoss.hp / shownBoss.maxHp,
                enraged: !shownBoss.dead && (shownBoss.bossState?.enraged ?? false),
            };
            if (phase && !shownBoss.dead) {
                const phases = shownBoss.def.boss?.phases;
                const finale = phases?.finale;
                boss.fraction =
                    phase.stage === "finale" && finale
                        ? Math.max(0, (phase.finaleEnd ?? 0) - sim.tick) /
                          (finale.seconds * TICKS_PER_SECOND)
                        : phase.stage === "hp"
                          ? getPhaseBarFraction(shownBoss, phase.index)
                          : phase.shield / phase.shieldMax;
                const reach = sim.map.fight?.strikeReach;
                const player = sim.player;
                boss.fight = {
                    phase: phase.index + 1,
                    phases: phases?.phases.length ?? 1,
                    stage: phase.stage,
                    status:
                        phase.stage === "finale" ? undefined : phases?.phases[phase.index]?.status,
                    // Out of reach in this world (EnemyDef.hurtIn: the Awakened Whisperer, in the
                    // realm), or of the fight's weapon
                    otherWorld:
                        shownBoss.def.hurtIn !== undefined && shownBoss.def.hurtIn !== sim.layer,
                    outOfReach:
                        reach !== undefined &&
                        Math.hypot(shownBoss.x - player.x, shownBoss.y - player.y) > reach,
                    guard: sim.isStunned(shownBoss)
                        ? "stunned"
                        : sim.isExposed(shownBoss)
                          ? "exposed"
                          : undefined,
                    totems: phase.totems.map((totem) =>
                        phase.stage === "shield" ? 0 : 1 - Math.max(0, totem.hp) / totem.maxHp,
                    ),
                    curseAttacks: sim.curse?.attacksLeft,
                    parasiteSeconds: parasite
                        ? Math.max(0, (parasite.burstTick - sim.tick) / TICKS_PER_SECOND)
                        : undefined,
                };
            }
            // The Wardens' three phases, Kephri's three shields and her last
            const tombs = sim.wardensBar(shownBoss) ?? sim.kephriBar(shownBoss);
            if (tombs) {
                const kephri = shownBoss.def.boss?.kephri;
                boss.fraction = tombs.fraction;
                boss.fight = {
                    phase: tombs.phase,
                    phases: kephri ? kephri.shields.count + 1 : 3,
                    stage: tombs.stage,
                    status: tombs.status,
                    totems: [],
                };
            }
        }
        if (sim.tick - this.shownDpsTick >= DPS_HOLD_TICKS) {
            this.shownDps = sim.dps;
            this.shownDpsTick = sim.tick;
        }
        this.damageMeter.sample(sim.tick, sim.damageBySource);
        const meter = this.damageMeter.read();
        const weaponDamage: HudNumbers["weaponDamage"] = {};
        for (const w of sim.weapons) {
            weaponDamage[w.def.id] = {
                dps: meter.perSecond[`weapon:${w.def.id}`] ?? 0,
                damage: meter.totals[`weapon:${w.def.id}`] ?? 0,
            };
        }
        const numbers: HudNumbers = {
            // Whole seconds, as they're shown, so standing still changes nothing
            bossIn: Math.ceil(sim.timeLeftForBoss),
            raidRoom: sim.map.raid && {
                number: sim.raidRoom + 1,
                count: sim.map.raid.rooms.length,
                name: sim.map.raid.rooms[sim.raidRoom].name,
                points: sim.raidPoints,
                waves: sim.raidStage === "waves",
                portal: sim.raidTeleporter !== undefined && sim.raidTeleportsLeft > 0,
                first: (this.save.mapVictories[sim.map.id] ?? 0) === 0,
            },
            objective: getObjectiveView(sim),
            tombsWave:
                sim.tombsRoom && !sim.tombsRoom.boss
                    ? sim.tombsRoom.het
                        ? {
                              // The Het room counts what's mined of the seal, not waves
                              label: "Seal mined",
                              wave: sim.hetSealMined.mined,
                              of: sim.hetSealMined.of,
                              waiting: false,
                              done: sim.tombsRoom.doneTick !== undefined,
                          }
                        : sim.tombsPathRoom?.crondis
                          ? {
                                // The Crondis room counts the palm's stages
                                label: "Palm grown",
                                wave: sim.tombsRoom.crondis?.stage ?? 0,
                                of: 4,
                                waiting: !sim.tombsRoom.started,
                                done: sim.tombsRoom.doneTick !== undefined,
                            }
                          : sim.tombsPathRoom?.scabaras
                            ? {
                                  // The Scabaras room counts its puzzles
                                  label: "Puzzles solved",
                                  wave: sim.tombsRoom.scabaras?.solved.length ?? 0,
                                  of: 4,
                                  waiting: !sim.tombsRoom.started,
                                  done: sim.tombsRoom.doneTick !== undefined,
                              }
                            : {
                                  wave: Math.max(0, sim.tombsRoom.wave) + 1,
                                  of: APMEKEN_WAVES.length,
                                  waiting: !sim.tombsRoom.started,
                                  done: sim.tombsRoom.doneTick !== undefined,
                              }
                    : undefined,
            tombsScabaras: sim.scabarasInfo,
            tombsHet: sim.hetInfo,
            tombsCrondis: sim.crondisInfo,
            tombsRoar:
                sim.zebakRoarSeconds === undefined ? undefined : Math.ceil(sim.zebakRoarSeconds),
            tombsShadows: sim.akkhaShadows
                ? { left: sim.akkhaShadows.left, seconds: Math.ceil(sim.akkhaShadows.seconds) }
                : undefined,
            devGod: this.devTools ? sim.devGod : undefined,
            devWardens:
                this.devTools &&
                sim.map.tombs?.wardens !== undefined &&
                !sim.tombsPath &&
                !sim.tombsWardens,
            hp: getShownHp(sim.player.hp),
            maxHp: sim.player.maxHp,
            hpShare: getHpShare(sim.player.hp, sim.player.maxHp),
            sanity: sim.realm && Math.ceil(sim.realm.sanityOf(sim.focus)),
            sanityMax: sim.realm?.def.sanity.max,
            cold: sim.cold && Math.floor(sim.cold.coldOf(sim.focus)),
            coldMax: sim.cold?.def.cold.max,
            poisoned: sim.player.poisonEnd !== -1,
            xpFraction: Math.min(
                1,
                Math.max(0, (sim.xp - thisLevel) / Math.max(1, nextLevel - thisLevel)),
            ),
            // Held while a lair's on, as the waves are (Sim.heldTicks)
            seconds: Math.floor(sim.clockSeconds),
            // None once a run's ended early: its sim can stop mid-choice
            decisionSeconds: this.coopStopped ? undefined : this.coopRun?.decisionSeconds,
            kills: sim.kills,
            coins: sim.coins,
            dps: this.shownDps,
            weaponDamage,
            otherDps: meter.otherPerSecond,
            buffs: getBuffViews(sim),
            boss,
            ability: this.getAbilityView(sim),
            abilities: this.getKitViews(sim),
            quests: getQuestTrackViews(this.save, sim),
        };
        // What hasn't changed stays the same object, so a part of the HUD that shows
        // only that doesn't draw again
        const shownNumbers = this.store.getNumbers();
        const sharedNumbers = shareUnchanged(shownNumbers, numbers);
        if (force || sharedNumbers !== shownNumbers) {
            this.store.setNumbers(sharedNumbers);
        }
        const hud: HudView = {
            mapId: sim.map.id,
            round: sim.endless ? sim.round : undefined,
            level: sim.level,
            maxWeapons: sim.maxWeapons,
            maxPassives: sim.maxPassives,
            weapons: sim.weapons.map((w) => {
                const last = w.def.levels.length;
                const level = w.def.levels[Math.min(w.level, last) - 1];
                return {
                    id: w.def.id,
                    name: upgradedName(tl(level.name ?? w.def.name), w.level - last),
                    level: w.level,
                    maxLevel: w.def.levels.length,
                    iconObjId: level.objId ?? w.def.iconObjId,
                    detail: w.bonus > 0 ? weaponBonusText(w.bonus) : undefined,
                    stats: weaponStats(w.def, level).map(weaponStatText),
                    evolution: getEvolutionView(sim, w),
                    rarityColor: RARITIES[w.def.rarity].color,
                };
            }),
            passives: sim.passives.map((p) => {
                const def = getPassive(p.id);
                return {
                    id: p.id,
                    name: upgradedName(tl(def.name), p.level - def.maxLevel),
                    level: p.level,
                    maxLevel: def.maxLevel,
                    iconObjId: def.iconObjId,
                    iconSpriteId: def.iconSpriteId,
                    detail: passiveValueText(def, p.value),
                    rarityColor: RARITIES[def.rarity].color,
                };
            }),
            blessings: sim.map.blessings && getBlessingViews(sim.map.blessings, sim.blessings),
            stats: formatStats(sim.stats),
            gear: getGearViews(sim),
            inventory: getInventoryViews(sim),
            rerolls: sim.rerollsLeft,
            banishes: sim.banishesLeft,
            skip: sim.canSkip
                ? { cost: sim.skipCost, affordable: sim.coins >= sim.skipCost }
                : undefined,
            // Reloaded: keeping this offer, and taking a kept one
            keep: sim.hasRelic("reloaded", sim.heroes[sim.focus])
                ? {
                      left: sim.heroes[sim.focus].relics.keepsLeft,
                      kept: sim.heroes[sim.focus].relics.kept.length,
                      canKeep: sim.canKeepOffer,
                      canTake: sim.canTakeKept,
                  }
                : undefined,
        };
        const previous = this.store.getSnapshot().hud;
        const shared = shareUnchanged(previous, hud);
        if (force || shared !== previous) {
            this.store.set({ hud: shared });
        }
        if (sim.heroes.length > 1) {
            const party = sim.heroes
                .filter((hero) => hero.index !== sim.focus)
                .map((hero) => ({
                    name: hero.name,
                    characterId: hero.characterId,
                    hp: getShownHp(hero.player.hp),
                    maxHp: hero.player.maxHp,
                    down: hero.down,
                    left: hero.left,
                    revivable: sim.canBeRevived(hero),
                    reviveProgress: reviveProgress(hero),
                    immune: sim.isImmune(hero),
                    id: this.coopPlayerIds[hero.index],
                }));
            if (JSON.stringify(party) !== JSON.stringify(this.store.getSnapshot().party)) {
                this.store.set({ party });
            }
            const revive = getReviveView(sim);
            if (JSON.stringify(revive) !== JSON.stringify(this.store.getSnapshot().revive)) {
                this.store.set({ revive });
            }
        }
    }

    submitActors(actors: ActorRenderer, _camera: Camera): void {
        const sim = this.sim;
        if (sim) {
            this.view.submitActors(actors, sim, this.getAlpha());
            return;
        }
        // Title screen: just the character, and their pet
        const model = this.assets.getPlayer();
        const tick = Math.floor(this.attractTick);
        if (model) {
            const anim = model.getAnim(this.assets.getPlayerStance().idle);
            actors.draw(
                model,
                anim,
                anim.getFrame(tick),
                TITLE_MAP.spawn.x,
                this.grid.getHeight(TITLE_MAP.spawn.x, TITLE_MAP.spawn.y) / 128,
                TITLE_MAP.spawn.y,
                Math.round(this.menuModelYaw) & 2047,
            );
        }
        const pet = this.save.pet === undefined ? undefined : PET_BY_ID.get(this.save.pet);
        const petModel = pet && this.assets.getPet(pet.id);
        if (pet && petModel) {
            const anim = petModel.getAnim(pet.idleSeq);
            const x = TITLE_MAP.spawn.x + PREVIEW_PET_SIDE;
            const y = TITLE_MAP.spawn.y - PREVIEW_PET_BACK;
            actors.draw(
                petModel,
                anim,
                anim.getFrame(tick),
                x,
                this.grid.getHeight(x, y) / 128,
                y,
                0,
            );
        }
    }

    drawOverlay(camera: Camera): void {
        const overlay = this.overlay;
        overlay.begin(camera);
        const sim = this.sim;
        if (sim) {
            this.view.pickupTimers = this.display.pickupTimers;
            // While it's on, once the room's been beaten, and from the start at Entry
            this.view.puzzleHelper =
                this.display.puzzleHelper &&
                (this.save.scabarasBeaten === true || getRaidBand(sim.raidLevel) === "Entry");
            this.view.drawOverlay(overlay, sim, this.getAlpha());
            if (this.minimapCanvas) {
                this.minimap.draw(
                    this.minimapCanvas,
                    sim,
                    this.getAlpha(),
                    this.viewHero,
                    this.view.localPlayerPose,
                );
            }
        }
        if (this.store.getSnapshot().debug) {
            this.drawDebug(sim);
        }
    }

    private drawDebug(sim: Sim | undefined): void {
        const overlay = this.overlay;
        const ctx = overlay.ctx;
        const x = sim ? sim.player.x : TITLE_MAP.spawn.x;
        const y = sim ? sim.player.y : TITLE_MAP.spawn.y;
        this.drawCollisionDebug(Math.floor(x), Math.floor(y));
        ctx.font = "16px OSRS Small, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#ffff00";
        const alive = sim ? sim.enemies.filter((e) => !e.dead).length : 0;
        const timeLeft = sim ? Math.round(sim.timeLeftForBoss) : 0;
        ctx.fillText(
            `${this.fps.toFixed(0)} fps  enemies ${alive}  projectiles ${sim?.projectiles.length ?? 0}  ` +
                `pickups ${sim?.pickups.length ?? 0}  tile ${Math.floor(x)}, ${Math.floor(y)}  ` +
                `flags 0x${this.grid.getFlags(Math.floor(x), Math.floor(y)).toString(16)}  boss in ${timeLeft}s`,
            12,
            overlay.height - 12,
        );
    }

    private drawCollisionDebug(cx: number, cy: number): void {
        const overlay = this.overlay;
        const ctx = overlay.ctx;
        const grid = this.grid;
        const range = 14;

        const corner = (x: number, y: number) => {
            const height = grid.getHeight(x, y) / 128;
            const p = overlay.project(x, height, y, this.screen);
            return [p.x, p.y, p.visible ? 1 : 0];
        };
        const box = { x0: 0, y0: 0, x1: 0, y1: 0 };

        ctx.lineWidth = 2;
        for (let ty = cy - range; ty <= cy + range; ty++) {
            for (let tx = cx - range; tx <= cx + range; tx++) {
                const flags = grid.getFlags(tx, ty);
                if (flags === 0) {
                    continue;
                }
                const sw = corner(tx, ty);
                const se = corner(tx + 1, ty);
                const ne = corner(tx + 1, ty + 1);
                const nw = corner(tx, ty + 1);
                if (!sw[2] && !ne[2]) {
                    continue;
                }
                if (grid.isSolid(tx, ty)) {
                    ctx.fillStyle =
                        flags & CollisionFlag.FLOOR
                            ? "rgba(0, 120, 255, 0.35)"
                            : "rgba(255, 0, 0, 0.35)";
                    // Objects only block part of their tile
                    const { x0, y0, x1, y1 } = grid.getSolidBox(tx, ty, box);
                    const bsw = corner(x0, y0);
                    const bse = corner(x1, y0);
                    const bne = corner(x1, y1);
                    const bnw = corner(x0, y1);
                    ctx.beginPath();
                    ctx.moveTo(bsw[0], bsw[1]);
                    ctx.lineTo(bse[0], bse[1]);
                    ctx.lineTo(bne[0], bne[1]);
                    ctx.lineTo(bnw[0], bnw[1]);
                    ctx.closePath();
                    ctx.fill();
                    continue;
                }
                ctx.strokeStyle = "#ffff00";
                ctx.beginPath();
                if (flags & CollisionFlag.WALL_NORTH) {
                    ctx.moveTo(nw[0], nw[1]);
                    ctx.lineTo(ne[0], ne[1]);
                }
                if (flags & CollisionFlag.WALL_SOUTH) {
                    ctx.moveTo(sw[0], sw[1]);
                    ctx.lineTo(se[0], se[1]);
                }
                if (flags & CollisionFlag.WALL_EAST) {
                    ctx.moveTo(se[0], se[1]);
                    ctx.lineTo(ne[0], ne[1]);
                }
                if (flags & CollisionFlag.WALL_WEST) {
                    ctx.moveTo(sw[0], sw[1]);
                    ctx.lineTo(nw[0], nw[1]);
                }
                ctx.stroke();
            }
        }
    }
}

// How far through the Tombs a run's enemies are baked for: the paths done, and the Wardens begun
function getTombsStageKey(pathsDone: readonly string[], wardens: boolean): string {
    return `${pathsDone.join(",")}|${wardens}`;
}

// "2 revives left"
function describeRevives(left: number): string {
    return tp("toast.revives_left", left);
}

// How far along a downed hero's revive is, 0 to 1
function reviveProgress(hero: Hero): number {
    return hero.revive ? Math.min(1, hero.revive.ticks / (REVIVE_SECONDS * TICKS_PER_SECOND)) : 0;
}

// The revive this player's part of, if any: down and waiting for one, or
// reviving a teammate
function getReviveView(sim: Sim): ReviveView | undefined {
    const own = sim.heroes[sim.focus];
    if (sim.runOver || sim.state !== "playing") {
        return undefined;
    }
    if (sim.canBeRevived(own)) {
        const reviver = own.revive && sim.heroes[own.revive.hero];
        return {
            name: reviver?.name,
            reviving: false,
            progress: reviveProgress(own),
            revivesLeft: sim.revivesLeftFor(own),
        };
    }
    const downed = sim.heroes.find((hero) => hero.revive?.hero === sim.focus);
    if (downed) {
        return {
            name: downed.name,
            reviving: true,
            progress: reviveProgress(downed),
            revivesLeft: sim.revivesLeftFor(downed),
        };
    }
    return undefined;
}
