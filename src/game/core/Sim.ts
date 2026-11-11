import { ArmouryUpgrades, getUpgradeLine, getUpgradedGear } from "../content/armoury";
import { WeaponDamageBalance } from "../content/balance";
import { getCharacter } from "../content/characters";
import {
    EXTRA_REVIVE_PRICE,
    OLD_MAN_REVIVE_CHANCE,
    PLAYER_GONE,
    PartyScale,
    REVIVES_PER_PLAYER,
    REVIVE_HP,
    REVIVE_IMMUNITY_SECONDS,
    REVIVE_RANGE,
    REVIVE_SECONDS,
    REVIVE_SPOTANIM,
    bossCopies,
    getPartyScale,
} from "../content/coop";
import {
    LATER_ROUND_START,
    LATE_CASKET_CHANCE,
    LATE_CASKET_LIMIT,
    LATE_CASKET_SECONDS,
    ROUND_DAMAGE,
    ROUND_HP,
    ROUND_XP,
    endlessCoinScale,
    getGearStats,
    roundCrowd,
    roundScale,
} from "../content/endless";
import { ENEMY_BY_ID, getEnemy } from "../content/enemies";
import {
    HARD_BOSS_INTERVAL,
    HARD_COINS,
    HARD_CROWD,
    HARD_ELITES,
    HARD_ENRAGE_AT,
    HARD_XP,
    getHardScale,
} from "../content/hard";
import {
    ACCELERATION,
    DEADLY_PRAYERS,
    QUIET_PRAYERS,
    TOMBS_ATTEMPTS,
    cleanInvocations,
    getRaidLevel,
    getRaidLevelScale,
} from "../content/invocations";
import { CASKETS, getGear, getItem } from "../content/items";
import { getMap, hasFliers, hasPoison } from "../content/maps";
import { canLevelPassive, getPassive, getPassiveGain } from "../content/passives";
import {
    LANTERN_ID,
    POWER_UPS,
    POWER_UP_CHANCE,
    POWER_UP_LIFETIME,
    POWER_UP_MIN_GAP,
    THRALLS,
    getPowerUp,
} from "../content/powerups";
import { isPrayerIgnored } from "../content/raidBosses";
import {
    EXPERT_RAID_COINS,
    HARD_RAID_COINS,
    HARD_UNIQUE_CHANCE,
    PURPLE_CHANCE,
    PURPLE_POINTS,
    RAID_COINS_PER_POINT,
    RAID_SUPPLIES,
    RAID_SUPPLY_CHEST,
    getRaidSupply,
    getRoomPoints,
} from "../content/raids";
import {
    OLD_MAN_OFFERS,
    OLD_MAN_PRICE_PER_MINUTE,
    RANDOM_EVENTS,
    RANDOM_EVENT_EVERY,
    RANDOM_EVENT_FIRST,
    VISITOR_DISTANCE,
    VISITOR_LIFETIME,
    VISITOR_REACH,
    VISITOR_SHOUT_EVERY,
    VISITOR_SOUND,
    VISITOR_SPOTANIM,
    getQuizGroups,
} from "../content/randomEvents";
import { RARITIES, RARITY_ORDER } from "../content/rarity";
import { countSetPieces, getActiveSets, getItemSet, getSet } from "../content/sets";
import { SHOP_UPGRADES } from "../content/shop";
import { SOUNDS } from "../content/sounds";
import {
    AKKHA_VANISH_SEQ,
    APMEKEN,
    APMEKEN_SPOTANIMS,
    APMEKEN_WAVES,
    CRONDIS,
    CRONDIS_PALMS,
    CRONDIS_WAVES,
    HET,
    HET_WAVES,
    JUNGLE_JAPES,
    KEPHRI_ARCANE_BLAST,
    KEPHRI_EGG_BLAST,
    SARCOPHAGI,
    SARCOPHAGUS_BLAST,
    SCABARAS,
    SCABARAS_WAVES,
    TOMBS_BOSSES,
    TOMBS_BOSS_FOOD,
    TOMBS_POINTS,
    TOMBS_PUZZLE_LEVELS,
    TOMBS_ROOM_SPAWNS_PER_LEVEL,
    TOMBS_SPIRIT,
    TOMBS_SPIRIT_BUNDLES,
    TOMBS_SPIRIT_SHARE,
    TOMBS_SPOTANIMS,
    TOMBS_TIME_LIMITS,
    WARDENS,
    WARDENS_WINDMILL,
    getApmekenTrickle,
    getCrondisTrickle,
    getHetTrickle,
    getScabarasTrickle,
} from "../content/tombs";
import {
    PUMPKIN_CHANCE,
    PUMPKIN_ID,
    PUMPKIN_MAPS,
    PUMPKIN_MIN_GAP,
    PUMPKIN_OUTCOMES,
} from "../content/trickOrTreat";
import { TROPHIES, TrophyDef, isEveryTimeTrophy } from "../content/trophies";
import {
    AkkhaDef,
    ArenaStatue,
    BoltProcDef,
    BossAmbientDef,
    BossAttackDef,
    BossDef,
    BossPhasesDef,
    BulletPatternDef,
    CasketTier,
    CombatStyle,
    EnemyBlinksDef,
    EnemyDef,
    EnemyHealsDef,
    EnemyRevivesDef,
    EnemyShotDef,
    EnemySpawnsDef,
    EnemyTag,
    FightAbilityDef,
    FloorActionDef,
    GearSlot,
    GroundPatternDef,
    ImpactDef,
    ImpactSpotDef,
    KephriDef,
    LightLook,
    LightingDef,
    MapDef,
    PlayerEffectDef,
    PowerUpDef,
    PowerUpEffect,
    QuartersDef,
    RaidRoomDef,
    RandomEventDef,
    RandomEventEffect,
    RunEventDef,
    SpecialAttackDef,
    Stats,
    TombsGateDef,
    TombsPathDef,
    TombsSpotDef,
    TombsWardensPlaces,
    UtilityDef,
    WardenSide,
    WaveDef,
    WeaponDef,
    ZebakDef,
    emptyStats,
} from "../content/types";
import { RUN_LENGTH } from "../content/waves";
import { getWeaponDamageMultiplier } from "../content/weaponBalance";
import { WEAPONS, getProjectileObjId, getWeapon, getWeaponStyle } from "../content/weapons";
import { ArenaFloor } from "./ArenaFloor";
import { BulletPool, BulletTarget } from "./BulletPool";
import {
    CASKET_DROP_CHANCE,
    ChestAction,
    ChestOffer,
    InventorySlot,
    MAX_INVENTORY,
    findInventorySlot,
    getAlchValue,
    getStartedSet,
    rollBossCasketTier,
    rollCasketItem,
    rollCasketTier,
} from "./Loot";
import { MovementRules, movePlayer, walkToward, yawFromVector } from "./PlayerMovement";
import { Rng } from "./Rng";
import { SpatialHash } from "./SpatialHash";
import {
    MAX_PASSIVES,
    MAX_WEAPONS,
    UpgradeChoice,
    hiltChoices,
    overlevelBonus,
    rollChoices,
} from "./Upgrades";
import {
    behindPillar,
    boxCircle,
    boxExit,
    checkerCellAt,
    checkerCells,
    circleInBox,
    cycleStage,
    inShadow,
    inStrip,
    pillarHit,
    segmentDistanceSq,
    statueMiddle,
} from "./arena";
import {
    ActivePowerUp,
    BossIntro,
    BossPhase,
    BossQuarters,
    BossState,
    BossSurge,
    BossTether,
    BossWalkers,
    BossWindup,
    Buff,
    BulletEmitter,
    DamageSource,
    Death,
    Debuff,
    Effect,
    Encounter,
    Enemy,
    EnemyAbilities,
    EnemyFlung,
    EnemyLeaving,
    EnemyProjectile,
    EventOffer,
    EventOption,
    FairyRing,
    FallingRock,
    Glyph,
    GroundFire,
    GroundHazard,
    GroundPool,
    LeftLight,
    Light,
    PassiveState,
    PendingHit,
    Pickup,
    PickupKind,
    Player,
    PlayerCurse,
    PlayerHold,
    PlayerParasite,
    Projectile,
    ProjectileKind,
    Rampage,
    SimEvent,
    SurgeLane,
    Thrall,
    Turret,
    Visitor,
    WeaponState,
    projectileSource,
    quarterOf,
} from "./entities";
import {
    EFFECT_BURN,
    EFFECT_HASTE,
    EFFECT_HEAL,
    EFFECT_ICE,
    EFFECT_SLOW,
    TYPE_FRAGILE,
} from "./floorLayout";
import { fm } from "./fmath";
import { ArenaGrid } from "./world/ArenaGrid";
import { Vec2, findFreeSpot, isCircleFree, moveCircle } from "./world/Collision";
import { FlightGrid } from "./world/FlightGrid";
import { FlowField, canWalkStraight } from "./world/FlowField";
import { endlessLevelForXp, endlessXpForLevel, runLevelForXp, runXpForLevel } from "./xp";

export const TICKS_PER_SECOND = 50;

// How far back the HUD's damage meter looks
export const DPS_WINDOW_SECONDS = 8;
const DPS_WINDOW_TICKS = DPS_WINDOW_SECONDS * TICKS_PER_SECOND;

// OSRS run speed: 2 tiles per 600ms tick
export const PLAYER_SPEED = 2 / 0.6 / TICKS_PER_SECOND;
const PLAYER_RADIUS = 0.35;
const PLAYER_BASE_HP = 25;
// A co-op party's others start this many tiles from the spawn
const PARTY_SPREAD = 1.5;
// Rerolls every run has, before the shop's
const BASE_REROLLS = 1;
// Skipping a level up's rewards costs coins from the run, doubling each time:
// 25, 50, 100, 200, 400, so about five a run
export const SKIP_BASE_COST = 25;
const BASE_MAGNET = 2.2;
// Chance a kill drops food (luck makes it likelier), and what it heals
const FOOD_DROP_CHANCE = 0.003;
const FOOD_HEAL = 10;
// After being hit the player can't be hit again for a moment, so a crowd hurts
// more than one enemy but can't melt them instantly
const HIT_INVULNERABLE_TICKS = 12;
// A scattered ground attack's spots keep this many tiles between their edges,
// trying this many places for each
const SCATTER_GAP = 0.4;
const SCATTER_ATTEMPTS = 40;
// How far back a ground attack's trail can reach (GroundPatternDef spots "trail"): each hero's
// last this many seconds of where they stood are kept
export const TRAIL_SECONDS = 3;
const TRAIL_TICKS = TRAIL_SECONDS * TICKS_PER_SECOND;
// Co-op: a teammate stands over a downed player this long to bring them back,
// and nothing can hurt the revived for this long after (see content/coop.ts)
const REVIVE_TICKS = REVIVE_SECONDS * TICKS_PER_SECOND;
const REVIVE_IMMUNITY_TICKS = REVIVE_IMMUNITY_SECONDS * TICKS_PER_SECOND;
// Held above a hit's invulnerability, which lets boss hits through as it runs
// down, and above what makes the player blink, so the immunity shows
const IMMUNE_INVULNERABLE_TICKS = 31;
// Seconds until a random event that couldn't happen gets another go
const RANDOM_EVENT_RETRY = 5;
const RANDOM_EVENT_SEED = 0x5eed;

// A rampage: how far from the player it starts, how near the player a crowd
// has to be to go for it, how far past it the charge runs (tiles), and how long
// it takes to fade away
const RAMPAGE_START_DISTANCE = 14;
const RAMPAGE_CROWD_RANGE = 14;
const RAMPAGE_OVERSHOOT = 7;
export const RAMPAGE_FADE_TICKS = 25;
// How far off the ring a Drill Demon's runner heads straight for it
const LAP_PULL_TILES = 3;
// A fairy ring looks for what's walked in this often, and shows the warp on
// only so many at a time
const RING_PULSE_TICKS = 5;
const MAX_RING_EFFECTS = 10;
// How many enemies are looked at for the thickest crowd
const MAX_CROWD_CHECKS = 60;
// Lights (MapDef.lighting): tiles past a light's edge that weapons can still aim
// (litTargetsOnly; never more than the light's own radius, so one going out lights nothing), seconds over which a light an enemy left goes out, and over which a boss's
// phase changes the scene's ambient (and back as it falls)
const LIGHT_GRACE = 0.5;
const LEFT_LIGHT_FADE = 3;
const PHASE_LIGHT_SECONDS = 2;
// Ticks a fallen rock lies there before it's gone
const ROCK_LINGER_TICKS = 2 * TICKS_PER_SECOND;
const SPAWN_MIN_DISTANCE = 19;
const SPAWN_MAX_DISTANCE = 24;
// Bosses turn up a little closer, so the fight starts soon
const BOSS_SPAWN_MIN_DISTANCE = 12;
const BOSS_SPAWN_MAX_DISTANCE = 16;
// One that turns up inside the boss square (RunEventDef inArena): this near the player
const ARENA_SPAWN_MIN_DISTANCE = 4;
const ARENA_SPAWN_MAX_DISTANCE = 9;
// Co-op: how far apart a boss's copies turn up, at least
const BOSS_COPY_GAP = 4;
// A boss in disguise (EnemyDef.disguise): how far from the player it lies, how
// close sets it off, and ticks between it opening and its first attack
const DISGUISE_MIN_DISTANCE = 7;
const DISGUISE_MAX_DISTANCE = 11;
const DISGUISE_TOUCH = 1;
const DISGUISE_ATTACK_DELAY = 100;
// Bosses' pools on the ground at once (the oldest dries up)
const MAX_POOLS = 12;
// Enemies left this far behind are brought back near the player
const RELOCATE_DISTANCE = 34;
// A raid's room, cleared: seconds to gather what's on the ground before the next
const RAID_CLEARED_SECONDS = 2;
// The waves a raid's room has at the least (RaidDef.minWaveSeconds)
const RAID_MIN_WAVE_SECONDS = 60;
// How close to a raid hall's teleporter asks to use it (tiles from its middle; it's 2 by 2 and solid)
const TELEPORTER_REACH = 2.2;
// Tiles from the player enemies turn up at in a Tombs room, which is too small for the usual
const TOMBS_SPAWN_MIN_DISTANCE = 5;
const TOMBS_SPAWN_MAX_DISTANCE = 14;
// How close to a door in the Tombs' Nexus counts as at it (tiles from its middle; doors are 3 by 3
// at most, and solid)
const TOMBS_DOOR_REACH = 2.8;
// A staring boss's timings, unless its BossDef.stare says (warning, hitEvery): seconds between
// saying it'll turn and turning, and between a stare's hits back (weapons fire on their own, so
// where you stand is all there is to stop them, and it shouldn't be the whole fight)
const STARE_WARNING_SECONDS = 0.75;
const STARE_EVERY = 1;

// A quarter turn's side of the arena (x east, y north), for a notice
function compassSide(angle: number): string {
    const quarter = (((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
    return ["east", "north", "west", "south"][quarter];
}

const FLOW_FIELD_SIZE = 96;
const FLOW_FIELD_INTERVAL = 8;
// A ditch jump, in ticks from its start: the leap is from JUMP_LEAVE to
// JUMP_LAND, then it gets up (timed to the player's ditch jump, animation 6132)
const JUMP_LEAVE = 25;
const JUMP_LAND = 63;
const JUMP_TICKS = 75;

const ENEMY_ATTACK_COOLDOWN = 50;
const DEATH_SINK_TICKS = 25;
const MAX_DEATH_ANIM_TICKS = 60;
// The most piles of bones, and of coins, lying around at once. Each kind
// counts its own, so coins and food left behind don't keep new bones off the
// ground.
const MAX_PILES: Partial<Record<PickupKind, number>> = { bones: 400, coins: 100 };
// Every so often bones lying this close to a bigger pile slide over and join
// it, and coins do the same
const PILE_INTERVAL = 25;
const PILE_RADIUS = 2;
const MAX_ENEMIES = 400;
const MAX_EFFECTS = 160;

// Enemies are kept this many ticks after dying for their death animation
const CORPSE_TICKS = MAX_DEATH_ANIM_TICKS + DEATH_SINK_TICKS;

const ELITE_TINT = 0xffd480;

// Bosses are enraged below this fraction of their hitpoints: they attack this
// much more often, move this much faster and glow red
const ENRAGE_AT = 0.5;
const ENRAGED_INTERVAL = 0.7;
const ENRAGED_SPEED = 1.3;
const ENRAGED_TINT = 0xff7a66;

// A boss's entrance: how fast what's left runs for the edge at most, in tiles a
// second, and how long before the end it's all gone. Further off than that
// speed gets it, it just goes.
const LEAVE_MAX_SPEED = 16;
const LEAVE_MIN_SCALE = 2;
const LEAVE_MARGIN_TICKS = 25;
// Ticks an armed spot takes to go off once it's stepped on
const HAZARD_FUSE_TICKS = 15;
// How long a strike's fitted impact plays out (WeaponDef.impactFit): the
// Nightmare's hands take 2.4 seconds to come up and sink again
const STRIKE_FIT_TICKS = 120;
// Seconds after a boss's bullet hits before another can, unless the boss says
// otherwise (BossDef.bulletGrace)
const BULLET_GRACE = 1;
// A lunge's dash (BossAttackDef line.dash): tiles a second, and how finely it's checked for
// what's in its way
const DASH_SPEED = 18;
const DASH_STEP = 0.1;
// Stunned (BossDef.guard), a boss gets this long to gather itself after, before it attacks
const STUN_RECOVER_SECONDS = 0.4;
// Ticks an impact's spot animations are kept (ImpactDef): they play out once in that
const IMPACT_TICKS = 90;
// A press of the fight's button held this long when it can't go off yet, and only if the boss
// is no further than this past its reach (MapDef.fight.ability)
const ABILITY_BUFFER_SECONDS = 0.3;
const ABILITY_BUFFER_REACH = 1.5;
// Tiles apart an impact's trail is laid along its way (ImpactDef.trail)
const TRAIL_GAP = 1.5;
// Tiles from the player that what holds them turns up
const SUMMON_BESIDE = 1.8;
// Tiles from a boss that what's walking to it is absorbed
const ABSORB_REACH = 2.6;
// A surge's reach along its lane, either side of the boss's middle
const SURGE_BODY = 2.5;
// Seconds a slam of the Wardens' last phase takes to rise, that its phantoms land nothing in
const WARDENS_SLAM_RISE = 0.5;
// The Tombs have no boss square: a surge's lane runs this far at most either way from the player,
// along the floor (Sim.tombsLaneBox)
const TOMBS_LANE_MOST = 24;
// Radians a second a lunge's strip turns after the player while it tracks (BossAttackDef line.track)
const LINE_TRACK_TURN = 2.5;
// What a curse does to the controls: quarter turns, a half turn, and mirrors.
// Each is a whole direction turned, so the stick's angles still work.
const CURSE_SHUFFLES = [
    [0, -1, 1, 0],
    [0, 1, -1, 0],
    [-1, 0, 0, -1],
    [-1, 0, 0, 1],
    [1, 0, 0, -1],
    [0, 1, 1, 0],
] as const;

const CANNON_SPOTANIM = 53;
const LEVEL_UP_SPOTANIM = 199;
// Tiles from the player a strike (WeaponDef kind strike) finds its targets within
const STRIKE_REACH = 12;
// Ice Barrage's freeze, on a player frozen by a boss
export const FREEZE_SPOTANIM = 369;
const ENEMY_PROJECTILE_RADIUS = 0.35;
// Rangers and mages (EnemyDef.shot) stop walking up at this fraction of their
// range
const SHOOTER_KEEP = 0.75;
// Fun maps' chat comes from enemies this many tiles from the player or closer
const CHAT_RANGE = 14;
// Utility blasts show their explosion on this many of the enemies they hit
const MAX_BLAST_EFFECTS = 14;
// Slashes' swooshes cover this much either side of where they aim, radians
const SLASH_ARC = 1.1;
// How wide a slash's strip is, in tiles
const SLASH_WIDTH = 1.5;
// Special attacks' glows stay on the player this long
const SPECIAL_SPOTANIM_TICKS = 60;
// Cannonballs and thralls' projectiles, tiles per second
const CANNONBALL_SPEED = 12;
const THRALL_PROJECTILE_SPEED = 14;
// Thralls keep up with the player, stand this far from them, and are brought
// back when left this far behind
const THRALL_SPEED = PLAYER_SPEED * 1.1;
const THRALL_FOLLOW_DISTANCE = 2;
const THRALL_LEASH = 14;
const THRALL_RADIUS = 0.4;
// The bot nuke shows its explosion on this many of the enemies it kills
const MAX_NUKE_EFFECTS = 24;
// Fire Wave's explosion
export const NUKE_SPOTANIM = 157;
// The Amulet of blood fury: a hit has the healChance stat's chance of healing
// the player this much, with the Sanguinesti staff's glow on them. Only one hit
// in so many ticks gets the roll, hit or miss, or weapons hitting thousands of
// times a minute late in a run would heal all the time.
const BLOOD_FURY_HEAL = 2;
const BLOOD_FURY_ROLL_INTERVAL = TICKS_PER_SECOND;
export const BLOOD_FURY_SPOTANIM = 1542;
// The Twisted bow does half its most extra damage to a target with this many
// hitpoints (a late goblin has a few hundred, a boss thousands)
const TOUGH_TARGET_HP = 600;
// Axes are thrown at enemies this close, and bounce on to ones this close to
// what they hit
const AXE_RANGE = 10;
const BOUNCE_RANGE = 5;
// The Toxic blowpipe prefers enemies without venom this close over nearer
// ones that have it, so the venom spreads
const VENOM_SPREAD_RANGE = 7;

// Enemies of different factions that touch hit each other this many times
// harder than they hit the player (they have far more hitpoints than the
// player does), so a scrap is over in a few hits
const FACTION_DAMAGE = 2;
// Each faction's army marches in from its own side, the sides this far apart
// (the golden angle: well spread however many factions there are), and they
// all turn this many radians a second so no side stays quiet for long
const FACTION_SPREAD = Math.PI * (3 - Math.sqrt(5));
const FACTION_TURN = 0.02;
// An enemy of a faction goes for one of another faction this close (tiles),
// rather than the player, unless the player's closer than this to it; it
// looks round for one every so often
const FOE_RANGE = 8;
const FOE_IGNORE_PLAYER = 2.5;
const FOE_LOOK_TICKS = TICKS_PER_SECOND / 2;
// An enemy with no way to the foe it's after for this long, and no hit landed,
// gives up and goes for the player for good
const FOE_GIVE_UP_TICKS = 3 * TICKS_PER_SECOND;
// Revivers bring back what died lately: the last this many deaths, no older
// than this
const MAX_DEATHS = 48;
const REVIVE_MAX_AGE = 20 * TICKS_PER_SECOND;
// Healers look for something to heal this often, and go this far for it when
// their def doesn't say
const HEAL_RETARGET_TICKS = 25;
const HEAL_SEEK = 12;
// A spawner's calls: no more of its own alive than this, this far from it,
// when its def doesn't say
const SPAWNS_MAX = 8;
const SPAWNS_RADIUS = 2;
// A shielded enemy shows a blocked hit at most this often
const BLOCKED_SPLAT_TICKS = 10;
// Multi-hit slashes (the Dragon claws') land this many ticks apart
const FOLLOW_UP_HIT_TICKS = 4;
// Damage a level (CharacterDef bonus levelMight) grows for this many levels,
// to level 41
export const LEVEL_MIGHT_LEVELS = 40;
// Burning ground hurts what's in it this often, and shows this many flames
// across it
const FIRE_INTERVAL = 25;
const FIRE_FLAMES = 7;
// At most this many patches of burning ground at once for each hero; a pulse
// this close to one of theirs (a share of its radius) keeps it burning rather
// than lighting another
const MAX_FIRES = 3;
const FIRE_MERGE = 0.5;
// Split arrows look for enemies this close to where the arrow split
const SPLIT_RANGE = 6;
// A fleeing enemy runs straight away from the player, or failing that (a wall
// in the way, a tile ahead) turned this far either way, a bit more each try
const FLEE_TURNS = [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.4, -2.4];
const FLEE_LOOKAHEAD = 1;

// What a hit from the floor (MapDef.floor) is from, where an enemy's id would be
export const FLOOR_SOURCE = "floor";
// What a floor's tiles do (FloorEffect), unless the floor says otherwise (FloorDef.tileEffects):
// burn's share of the player's hitpoints and how often (seconds), and its hit on an enemy; heal's
// share and how often; haste's and slow's change to speed; ice's grip
const FLOOR_BURN_DAMAGE = 0.04;
const FLOOR_BURN_EVERY = 0.5;
const FLOOR_BURN_ENEMY = 3;
const FLOOR_HEAL_AMOUNT = 0.03;
const FLOOR_HEAL_EVERY = 0.5;
const FLOOR_HASTE = 0.4;
const FLOOR_SLOW = 0.45;
const FLOOR_ICE_GRIP = 0.06;
// Tiles from a player that a slab coming up, or a tile going, shakes the camera (FloorDef.shake)
const FLOOR_SLAM_SHAKE_REACH = 1.5;
const FLOOR_DROP_SHAKE_REACH = 2.5;

// The events that are one hero's own, which co-op tags with who: what they
// did, what happened to them, what they picked up
const PERSONAL_EVENTS = new Set<SimEvent["type"]>([
    "weapon",
    "slash",
    "aura",
    "playerHit",
    "playerPoisoned",
    "pickup",
    "revive",
    "chest",
    "equip",
    "stash",
    "alch",
    "itemUsed",
    "evolved",
    "powerUp",
    "powerUpEnded",
    "playerShout",
    "heroDown",
    "heroLeft",
    "heroRevived",
    "extraRevive",
    "playerCursed",
    "ability",
]);

// levelUp and chest wait for the player to choose
export type SimState = "playing" | "levelUp" | "chest" | "event" | "dead" | "victory";

export type SimOptions = {
    // Tests and offline balance comparisons; live runs use the shipped config.
    balance?: WeaponDamageBalance;
    grid: ArenaGrid;
    // Lumbridge when unset
    mapId?: string;
    characterId: string;
    // Permanent bonuses from the shop
    metaStats: Stats;
    seed: number;
    // Where the player starts (the nearest free spot to it)
    spawnX: number;
    spawnY: number;
    // The weapons, passives and items brought in by map tasks; everything can
    // turn up when unset
    unlockedItems?: ReadonlySet<string>;
    // The raid chests' trophies already in their Collection log (isRaidChestTrophy): they're
    // unlocks, so a chest only gives ones they haven't got
    trophiesFound?: ReadonlySet<string>;
    // Round after round until the player falls, rather than a win at the
    // final boss (see endless.ts)
    endless?: boolean;
    // Everything on the map tougher, for more coins (see hard.ts)
    hard?: boolean;
    // A raid's expert mode: hard mode, and the Nylocas only hurt by their own style
    // (EnemyDef.onlyStyle, BossDef.colours). Ignored off a raid.
    expert?: boolean;
    // Which part of a fight in parts this run is (MapDef.stages; 0 when unset)
    stage?: number;
    // The Tombs of Amascut's invocations (content/invocations.ts), which take hard mode's place
    // there. Ignored anywhere else.
    invocations?: string[];
    // The pieces upgraded in the Armoury, which caskets give as what they've
    // become (none when unset)
    armoury?: ArmouryUpgrades;
    // Co-op: everyone in the run, in the same order on every player's copy
    // (characterId, metaStats, unlockedItems, trophiesFound and armoury are then unused), and
    // which of them this copy plays
    party?: HeroOptions[];
    focus?: number;
    // A raid's teleporters: how many rooms' waves can be skipped, and which rooms' halls have one
    // (those whose boss has been killed before)
    raidTeleports?: number;
    raidPortals?: boolean[];
    // For trying things out on the dev server (?raidtest): a raid's rooms this many seconds
    // apart, and every level up's pick straight to its max
    testing?: SimTesting;
};

export type SimTesting = { raidRoomSeconds?: number; maxLevelUps?: boolean };

// A raid's chest at the end: the points it went by, the chance of a purple they gave, and the
// trophies in it
// (The Tombs of Amascut's goes by its raid level, `level`, and has no points.)
export type RaidChest = { points: number; chance: number; found: string[]; level?: number };

// The Tombs of Amascut's summary on the result screen, as OSRS's raid board has it: the raid
// level and what made it, each path's time and the Wardens', the party's wipes, and each
// player's points and deaths
export type TombsSummary = {
    level: number;
    invocations: string[];
    paths: { id: string; name: string; seconds: number }[];
    wardensSeconds?: number;
    wipes: number;
    party: { name: string; points: number; deaths: number; chance: number; you: boolean }[];
    // A time limit invocation's: its minutes, and whether the raid was in time (the chest's raid
    // level drops by `drop` if not)
    timeLimit?: { minutes: number; drop: number; met: boolean };
};

export type RunResult = {
    mapId: string;
    endless: boolean;
    hard: boolean;
    // A raid's expert mode (hard as well)
    expert: boolean;
    // A fight in parts: which this run was (MapDef.stages)
    stage?: number;
    // A raid's chest, once it's beaten
    raidChest?: RaidChest;
    // The Tombs of Amascut's board
    tombs?: TombsSummary;
    // The Scabaras room was beaten (Sim.scabarasBeaten)
    scabarasBeaten?: boolean;
    // The round reached (1 outside endless runs)
    round: number;
    victory: boolean;
    seconds: number;
    level: number;
    kills: number;
    coins: number;
    // Enemy ids of the bosses killed, in order
    bossesKilled: string[];
    // The gear that came out of caskets (as found, before the Armoury's
    // upgrades), for the Armoury
    gearFound: string[];
    // The weapons evolved into, for the Collection log
    evolutionsMade: string[];
    // The trophies found, for the Collection log
    trophies: string[];
    // For quests: enemy id -> times killed, and reward caskets opened
    enemyKills: Record<string, number>;
    caskets: number;
    stats: RunStats;
};

// The stats screen's numbers: damage and kills by what dealt them, most
// damage first (seconds: how long a weapon was had, for its damage a second)
export type RunStats = {
    sources: { source: DamageSource; damage: number; kills: number; seconds?: number }[];
    damageTaken: number;
    healed: number;
    highestHit: number;
    rerollsUsed: number;
    skips: number;
    // The bosses killed, with the run second each went down
    bossKills: { enemyId: string; seconds: number }[];
};

// One adventurer in a run: everything that's theirs rather than the party's.
// A run on your own has one; co-op has one for each player, and the run's
// level, XP, coins and kills are shared.
export type Hero = {
    // Where it is in Sim.heroes
    index: number;
    // A raid's points, for its supply chest, and damage taken before this room, which it's
    // scored on
    raidPoints: number;
    raidDamageAtStart: number;
    // Every raid point earned, spent or not, for the chest at the end
    raidPointsEarned: number;
    // BossDef.stare: when hitting a staring boss can hurt this hero again
    staredUntil?: number;
    // What came out of a raid's chest at the end, for the result screen
    raidChest?: RaidChest;
    // The Wardens' orbs soaked and held (WARDENS.orbs.soak), and when the next fades
    wardenEnergy: number;
    wardenEnergyTick: number;
    // The Tombs of Amascut's points (TOMBS_POINTS), and times they went down there; and every
    // boss point earned, deaths or not, which the Helpful Spirit's are counted out of
    tombsPoints: number;
    tombsGross: number;
    tombsDowns: number;
    name: string;
    characterId: string;
    // Permanent bonuses from their shop, their map tasks' items, and their
    // Armoury (see SimOptions)
    metaStats: Stats;
    unlockedItems: ReadonlySet<string> | undefined;
    // The raid chests' trophies they'd found before the run, only those (SimOptions.trophiesFound)
    trophiesFound: ReadonlySet<string> | undefined;
    armoury: ArmouryUpgrades | undefined;
    player: Player;
    stats: Stats;
    weapons: WeaponState[];
    passives: PassiveState[];
    // Item id worn in each slot, and how many times it's upgraded (gear from
    // an endless run's later rounds)
    gear: Partial<Record<GearSlot, string>>;
    // The sets whose bonus the worn gear gives
    activeSets: string[];
    gearUpgrades: Partial<Record<GearSlot, number>>;
    // The weapons evolved into this run
    evolutionsMade: string[];
    // Utility items; slots keep their place (they're used with 1-4)
    inventory: (InventorySlot | null)[];
    buffs: Buff[];
    // Stats lowered by boss attacks
    debuffs: Debuff[];
    // Opened caskets waiting for a decision, the first one on screen
    chests: ChestOffer[];
    pendingLevelUps: number;
    choices: UpgradeChoice[];
    // Gear out of caskets this run, rerolled away or not
    gearFound: Set<string>;
    // Sets caskets have stopped bringing the missing pieces of
    declinedSets: Set<string>;
    // Collection log items found (see trophies.ts)
    trophies: Set<string>;
    revivesLeft: number;
    // For a level up's rewards or a casket's item, shared
    rerollsLeft: number;
    // Rerolls the run started with, for how many were used
    rerollsAtStart: number;
    // Banishes left (Firemaking), and what's been banished: weapons and
    // passives by id, casket items by the id caskets give, and whole sets
    banishesLeft: number;
    banished: Set<string>;
    banishedItems: Set<string>;
    banishedSets: Set<string>;
    // Level ups skipped this run, which make the next skip dearer
    skips: number;
    // For the run's stats: damage dealt and kills by what did it (a
    // DamageSource), damage taken, hitpoints healed, the biggest hit, and when
    // each weapon was taken up
    damageBySource: Record<string, number>;
    // The same damage by the tick it was dealt, for dps: a ring of the last
    // DPS_WINDOW_TICKS, each tick taking over the slot of the oldest
    recentDamage: Float64Array;
    killsBySource: Record<string, number>;
    casketsOpened: number;
    damageTaken: number;
    // Of that, what each of a boss's attacks did, by name: for tuning a fight
    // (the balance bot prints it, and it's there in the console)
    damageByAttack: Record<string, number>;
    healed: number;
    highestHit: number;
    weaponSince: Record<string, number>;
    // Bumped whenever their look changes (new weapon tier, gear)
    appearanceVersion: number;
    // Enemies after this hero find their way to them with it
    flowField: FlowField;
    // And flying ones, on maps they're on or once there are any
    flightField?: FlowField;
    regenAccumulator: number;
    // When a hit next gets the Amulet of blood fury's roll to heal
    bloodFuryRollTick: number;
    // While the sled lasts: how much faster they go, and until when
    sledEndTick: number;
    sledSpeed: number;
    // When a boss's tether can next hurt them (BossAttackDef.tether)
    tetherHitTick?: number;
    // What a boss has done to them: dragged across to it (BossAttackDef.onHit),
    // from where they were to where they're going over these ticks
    // (and held there until holdEnd, the boss standing over them)
    drag?: {
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        startTick: number;
        endTick: number;
        holdEnd: number;
    };
    curse?: PlayerCurse;
    parasite?: PlayerParasite;
    hold?: PlayerHold;
    drowsyEndTick: number;
    drowsyInterval: number;
    // Bullets pass through them until this tick, so a mistake costs one of
    // them rather than the whole of a volley
    bulletGraceEnd: number;
    // The floor (MapDef.floor) can't hit them again until this tick
    floorGraceEnd: number;
    // Where they stood each of the last TRAIL_TICKS ticks, x, y and the tick, in a ring by tick:
    // for a ground attack's trail (GroundPatternDef spots "trail")
    trail: Float64Array;
    // A floor tile's burn or heal (FloorEffect) next acts on them from this tick; and how far they
    // went last tick, kept on ice
    floorEffectNext: number;
    glideX: number;
    glideY: number;
    // What they're pressing, for the next tick
    moveX: number;
    moveY: number;
    // Co-op: down with no ring of life left (out of the fight until a teammate
    // revives them, or for good once they've been revived REVIVES_PER_PLAYER
    // times), or gone from the game, and the tick that happened (-1 while
    // they're in)
    down: boolean;
    left: boolean;
    outTick: number;
    // Co-op: how many times a teammate's brought them back this run, and the
    // revives found or bought on top of REVIVES_PER_PLAYER
    revived: number;
    extraRevives: number;
    // Co-op: the teammate standing over them to bring them back, and how
    // many ticks they've stood there (REVIVE_TICKS brings them back)
    revive?: { hero: number; ticks: number };
    // Co-op: just brought back, so nothing hurts them and enemies leave them
    // be until this tick
    immuneEndTick: number;
    // The fight's button (MapDef.fight.ability) can be used again from this tick, and a press
    // that couldn't go off yet is held till this one (ABILITY_BUFFER_SECONDS)
    abilityReadyTick: number;
    abilityHeldUntil: number;
};

// A player in a co-op run, as SimOptions.party has them
export type HeroOptions = {
    name: string;
    characterId: string;
    metaStats: Stats;
    unlockedItems?: ReadonlySet<string>;
    trophiesFound?: ReadonlySet<string>;
    armoury?: ArmouryUpgrades;
};

// The Apmeken room (content/tombs.ts): the wave it's on (its group's uids, and when it came), the
// issue that's up (which spot, since when, and how long it's been stood at), when the next is due,
// how many have gone this wave, when the room was beaten, and the waves beaten before a death
type TombsRoom = {
    wave: number;
    group: number[];
    waveTick: number;
    issue?: { spot: number; startTick: number; fixTicks: number };
    nextIssueTick: number;
    missed: number;
    doneTick?: number;
    // The last wave beaten before a death (-1 for none): up to it, the room gives nothing again
    beaten: number;
    // Someone's walked through the barrier from the safe corridor: until then it waits
    started: boolean;
    // The wave's baboons still to come out of the walls, and when the next does
    pending: string[];
    nextOutTick: number;
    // The path's boss, once the room's beaten: its uid once it's risen (-1 till someone walks in),
    // and when it fell
    boss?: { uid: number; beatenTick?: number };
    // The Het room's puzzle, once it's begun (Sim.stepHet)
    het?: HetRoom;
    // The Scabaras room's, once it's begun (Sim.stepScabaras)
    scabaras?: ScabarasRoom;
    // The Crondis room's, once it's begun (Sim.stepCrondis)
    crondis?: CrondisRoom;
};

type CrondisDef = NonNullable<NonNullable<TombsPathDef["room"]>["crondis"]>;
// The Crondis room (CRONDIS in tombs.ts): the palm, its growth and the water it needs, the stage
// it's reached; each hero's water and how long they've stood filling up; when each waterfall runs
// again; each corridor's next spear and which pair of rows it's at, the thrusts out now (their
// side, and when each began, its tell first); the poison clouds coming down (who each has caught),
// and when each corridor's next comes
export type CrondisRoom = {
    palmUid: number;
    growth: number;
    goal: number;
    stage: number;
    water: number[];
    filling: number[];
    dryUntil: number[];
    spears: { nextTick: number; pair: number }[];
    thrusts: {
        lane: number;
        pair: number;
        side: "low" | "high";
        startTick: number;
        // Who it's caught: once each
        hit: number[];
    }[];
    clouds: { lane: number; startTick: number; hit: number[] }[];
    nextCloudTick: number[];
};

type ScabarasDef = NonNullable<NonNullable<TombsPathDef["room"]>["scabaras"]>;
export type ScabarasPuzzle = "sequence" | "lights" | "addition" | "matching";
// A puzzle on the HUD's list: done, to be done now, or waiting on the others (Sim.scabarasInfo)
export type ScabarasPuzzleState = {
    puzzle: ScabarasPuzzle;
    state: "solved" | "open" | "waiting";
};
// The Scabaras room's puzzles (SCABARAS in tombs.ts): which are solved; Sequence's order, when
// it's shown from and how far through it the party is (no order, shown from -1, till its button's
// pushed); Lights out's ring and when a light next
// goes out; Addition's values, its number, what's been stepped on and what that makes;
// Matching's symbol on each tile of its two boards, which are matched, the tile turned up on each
// and when an unmatched pair hides again; the plate each hero's on; the rocks falling and their
// shards
export type ScabarasRoom = {
    solved: ScabarasPuzzle[];
    sequence: { order: number[]; showFrom: number; step: number };
    lights: boolean[];
    nextDarkTick: number;
    addition: { values: number[]; target: number; stepped: boolean[]; sum: number };
    matching: {
        north: number[];
        south: number[];
        matched: boolean[];
        up: { north?: number; south?: number };
        hideTick: number;
    };
    standing: (string | undefined)[];
    rocks: { x: number; y: number; landTick: number }[];
    nextRockTick: number;
    // Harmless till armTick, once they're clear of where the rock came down
    shards: { x: number; y: number; vx: number; vy: number; life: number; armTick: number }[];
};

type HetDef = NonNullable<NonNullable<TombsPathDef["room"]>["het"]>;

// A Het room mirror, on a tile's middle: "/" (turn 0) or "\" (turn 1), and dirty (the beam
// stops at it) once an Orb of Darkness has crossed it. Fixed, it stays where it is, as it is;
// otherwise it's loose (lying, the beam passing it), set on a spot (spot), or carried (carrier,
// a hero's index, where they are). touching: by hero, so walking into it acts once.
export type HetMirror = {
    x: number;
    y: number;
    turn: 0 | 1;
    dirty: boolean;
    fixed: boolean;
    spot?: number;
    carrier?: number;
    touching: boolean[];
};
// Akkha's fight (BossDef.akkha), while he's up: his attacks since his last special, Memory
// Blast's order (its ticks: when it began, each symbol's flash and the gap after, when the order's
// shown, between bursts) and how far through it is, his trailing orbs, his shadows and when each
// floods, what's just gone up (to draw), and his final stand's corner
export type AkkhaFight = {
    uid: number;
    attacks: number;
    memory?: {
        order: number[];
        start: number;
        flash: number;
        gap: number;
        showEnd: number;
        burst: number;
        step: number;
        // Where he vanished from, to reappear there (in the quarter he's been drawn into)
        from: { x: number; y: number };
    };
    // Not before this tick does his next special start (AkkhaDef.specialGap)
    readyTick: number;
    orbsUntil: number;
    // Detonate: when the marked go off, and whether each's an X (Feeling Special) or a plus
    detonate?: { tick: number; cross: boolean[] };
    orbs: { x: number; y: number; quadrant: number; armTick: number }[];
    lastTiles: (number | undefined)[];
    shadowsDone: number;
    shadows: { uid: number; quadrant: number }[];
    // The shadow struck first since they were last restored: the only one that can be hurt
    shadowStruck?: number;
    // When the shadows still up flood their quadrants
    floodTick: number;
    bursts: { quadrants: number[]; tick: number; kind: "blast" | "flood" }[];
    stand?: { corner: number; nextTick: number; since: number; hpAt: number };
};

// Zebak's fight (BossDef.zebak), while he's up: how many specials he's done, his roar if it's
// coming, his tidal waves (each's row, which way it goes, its gap, when it starts, who it's
// caught), his acid pools (middles and half widths), how long each hero's stood in one, his jugs
// (rolling, which way and how far it's got to go), his blood clouds (where each was last, to
// waste it as it goes) and when the next come
// The Wardens' first phase (WardensDef; Sim.stepWardens): the obelisk and the Wardens (uids),
// each side's charge, when it can charge again after a discharge and which attack's next, the order
// its orbs take the three troughs and which is next, when the next orbs go, and what's out: orbs
// (a step a stepSeconds, from (fromX, fromY) to (x, y), since stepTick), pyramids (a cell's
// south-west tile, since startTick) and shots (at a hero, from a Warden, landing at landTick)
export type WardensFight = {
    phase: 1 | 2 | 3;
    startTick: number;
    obeliskUid: number;
    wardens: Record<WardenSide, number>;
    charge: Record<WardenSide, number>;
    // What each has spent on its attacks so far
    spent: Record<WardenSide, number>;
    pausedUntil: Record<WardenSide, number>;
    // When the first pyramids are done with (gone), once a Warden's thrown them: the obelisk's
    // held till then (WardensDef holdShare)
    pyramidsDone?: number;
    next: Record<WardenSide, "pyramids" | "shot">;
    troughs: Record<WardenSide, number[]>;
    trough: Record<WardenSide, number>;
    nextOrbTick: number;
    orbs: {
        side: WardenSide;
        row: number;
        step: number;
        stepTick: number;
        fromX: number;
        fromY: number;
        x: number;
        y: number;
    }[];
    pyramids: { side: WardenSide; x: number; y: number; startTick: number }[];
    shots: { side: WardenSide; hero: number; startTick: number; landTick: number }[];
    // The obelisk open (WardensDef flicker) till this tick, after a discharge
    flickerUntil?: number;
    // Which Warden wakes for the second phase
    winner?: WardenSide;
    // What's on the floor in the second and third phases, drawn from here (there are too many for
    // effects): a spot animation over a tile's middle from `from` to `to`, hurting whoever's on
    // the tile at `from` for `hurts` of their hitpoints (0: a warning, a glow, a shadow)
    marks: WardensMark[];
    two?: WardensTwo;
    three?: WardensThree;
};

export type WardensMark = {
    x: number;
    y: number;
    from: number;
    to: number;
    spotAnim: number;
    hurts: number;
    // What it's from, as damage from an enemy
    by: string;
    // A glow on it while it's up (the enrage's lightning's shadows). Only drawn.
    light?: LightLook;
};

// The second phase: when the Warden's up, and its uid then; the charged obelisk and the wreck;
// which of its forms it's in (WardensPhaseTwoDef forms), its shield; kneeling, when its core's out
// and back, and the core's uid; the obelisk's next opening, which special's next and the one going
// (till endTick); its skulls in the air; and when the last phase starts, once it's down
export type WardensTwo = {
    wakeTick: number;
    wardenUid?: number;
    obeliskUid?: number;
    wreckUid: number;
    form: 0 | 1;
    shield: number;
    shieldMax: number;
    kneel?: { coreTick: number; coreUid?: number; backTick?: number; standTick?: number };
    nextOpen: number;
    special: number;
    current?: { kind: "beam" | "windmill" | "skulls"; endTick: number };
    skulls: {
        fromX: number;
        fromY: number;
        x: number;
        y: number;
        startTick: number;
        landTick: number;
    }[];
    endTick?: number;
};

// The last phase: the Warden, Amascut, the phantoms out; the next slam and which it is; how many
// times it's charged; its siphons, if they're out (their uids, which are reversed, when they're
// due, the next beam); when the slams can start again; enraged, the next row and lightning
export type WardensThree = {
    side: WardenSide;
    wardenUid: number;
    amascutUid: number;
    phantoms: number[];
    nextSlam: number;
    slam: number;
    batch: number;
    siphons?: { uids: number[]; reversed: number[]; endTick: number; nextBeam: number };
    pausedUntil: number;
    enraged: boolean;
    nextRow: number;
    nextLightning: number;
    // The last charge's formation (WardensPhaseThreeDef formations), so the next isn't the same
    formation: number;
    over: boolean;
};

// The last floor's row in front of the Warden (in its middle, the crater behind it): the last
// the enrage leaves before it, and where a melee hero stands
export function wardenFrontRow(warden: { y: number; radius: number }): number {
    return Math.floor(warden.y - warden.radius) - 1;
}

// count spots spread evenly along a formation's lines (WardensPhaseThreeDef formations), each in
// the middle of its share of their length
export function formationSpots(
    lines: [number, number][][],
    count: number,
): { x: number; y: number }[] {
    const segments: { ax: number; ay: number; bx: number; by: number; length: number }[] = [];
    for (const line of lines) {
        for (let i = 1; i < line.length; i++) {
            const [ax, ay] = line[i - 1];
            const [bx, by] = line[i];
            segments.push({ ax, ay, bx, by, length: fm.hypot(bx - ax, by - ay) });
        }
    }
    const total = segments.reduce((sum, s) => sum + s.length, 0);
    const spots: { x: number; y: number }[] = [];
    for (let i = 0; i < count && total > 0; i++) {
        let along = ((i + 0.5) / count) * total;
        for (const s of segments) {
            if (along <= s.length || s === segments[segments.length - 1]) {
                const t = s.length > 0 ? Math.min(1, along / s.length) : 0;
                spots.push({ x: s.ax + (s.bx - s.ax) * t, y: s.ay + (s.by - s.ay) * t });
                break;
            }
            along -= s.length;
        }
    }
    return spots;
}

// The rows of the last floor the enrage leaves: from the one in front of the Warden north
function wardenFrontKeep(
    floor: { y0: number; sizeY: number },
    warden: { y: number; radius: number },
): number {
    return Math.max(1, floor.y0 + floor.sizeY - wardenFrontRow(warden));
}

export type ZebakFight = {
    uid: number;
    special: number;
    roar?: { tick: number };
    // When his last roar went off, from where, and the boulders that sheltered from it: for its
    // shockwave (drawn only)
    roared?: {
        tick: number;
        x: number;
        y: number;
        rocks: { x: number; y: number; radius: number; look: string }[];
    };
    waves: {
        y: number;
        dir: 1 | -1;
        gapX0: number;
        gapX1: number;
        startTick: number;
        hit: number[];
    }[];
    acid: { x: number; y: number; half: number }[];
    acidTicks: number[];
    jugs: { uid: number; vx: number; vy: number; left: number }[];
    clouds: { uid: number; x: number; y: number }[];
    nextCloudTick: number;
};

// How far past a boulder's edge, each side, its shelter from Zebak's roar reaches (zebakShelters;
// the glow that shows it goes by it too)
export const ZEBAK_SHELTER_SIDE = 0.5;

// Whether a boulder shelters (x, y) from Zebak's roar from (fromX, fromY): straight behind it,
// down the island away from him (as OSRS's, not slanting off the line from him), within shelter
// tiles of it and as wide as it is. The sim's (Sim.zebakSheltered) and the shockwave's drawing
// both go by it.
export function zebakShelters(
    fromX: number,
    fromY: number,
    x: number,
    y: number,
    rocks: readonly { x: number; y: number; radius: number }[],
    shelter: number,
): boolean {
    return rocks.some((rock) => {
        const away = rock.y >= fromY ? 1 : -1;
        const behind = (y - rock.y) * away;
        return (
            behind > 0 &&
            behind <= shelter + rock.radius &&
            Math.abs(x - rock.x) <= rock.radius + ZEBAK_SHELTER_SIDE
        );
    });
}

// Kephri's fight (BossDef.kephri), while she's up: how many intermissions she's had, whether
// she's on her last (her swarm gone), the intermission she's in (its swarms still to send, how
// many have gone, when the next does and from which hole, her overlords), the heroes her flies
// are round and when they're thrown, when her next Dung Strike and Medic!'s next swarm come, and
// each Arcane Scarab's charge (when it began, its hitpoints then, where it's flown to)
export type KephriFight = {
    uid: number;
    // Shields broken so far; the one she's behind, its full strength, and what swarms that got to
    // her in an intermission put on the next
    phase: number;
    shield: number;
    shieldMax: number;
    leaked: number;
    final: boolean;
    intermission?: {
        left: number;
        sent: number;
        nextTick: number;
        point: number;
        overlords: number[];
    };
    dung?: { heroes: number[]; strikeTick: number };
    nextDungTick: number;
    medicTick: number;
    arcane: Map<number, { startTick: number; hpAt: number; spot: number }>;
};

// The Het room: its mirrors, the spots the loose ones go on, its barriers (a worn one's circle to
// stand in to break it, and the ticks it's been stood in), the seal's ring of circles, and the way
// that works (which spot wants a mirror, turned which way: the bot's); the next pulse, the last
// one's way corner to corner and whether it reached the statue; the seal, open (mined) until a
// tick or -1; the Orbs of Darkness; each hero's next mining swing
export type HetRoom = {
    // The seal's hitpoints as it started (more for each of the party)
    sealHp: number;
    mirrors: HetMirror[];
    spots: { x: number; y: number }[];
    barriers: {
        x: number;
        y: number;
        worn: boolean;
        stand?: { x: number; y: number };
        mined: number;
    }[];
    ring: { x: number; y: number }[];
    solution: { spot: number; turn: 0 | 1 }[];
    nextBeamTick: number;
    beam?: { points: { x: number; y: number }[]; tick: number; hit: boolean };
    sealUid: number;
    openUntil: number;
    orbs: { x: number; y: number; vx: number; vy: number }[];
    nextOrbTick: number;
    nextMine: number[];
};

// Dev only: what Sim.devSkipToTombsBoss hands over, to do some damage with
const DEV_BOSS_WEAPON = "corrupted_twisted_bow";
// Dev only: what Sim.devToWardens fits the party with, all at their last level: weapons of all
// three styles (the Warden's prayers leave one of magic and ranged open, and flip), the prayers
// and passives that keep you up, and the best piece for every slot (Torva for its hitpoints)
const DEV_WARDENS_KIT = {
    weapons: [
        "corrupted_twisted_bow",
        "corrupted_tumekens_shadow",
        "holy_sanguinesti_staff",
        "sanguine_scythe",
        "ice_barrage",
        "dark_bow",
    ],
    passives: ["piety", "rigour", "augury", "protect_melee", "rapid_heal", "vengeance"],
    gear: [
        "torva_full_helm",
        "infernal_cape",
        "amulet_of_rancour",
        "torva_platebody",
        "elysian_spirit_shield",
        "torva_platelegs",
        "zaryte_vambraces",
        "primordial_boots",
        "magus_ring",
    ],
};
// Tiles past its line someone has to be for a Tombs boss to rise: clear of the gap at its foot
const TOMBS_BOSS_RISE = 1.5;
// Tiles south of Ba-Ba's altar that count as back up to her, ending her boulders
const TOMBS_ALTAR_REACH = 2.5;

export class Sim {
    readonly grid: ArenaGrid;
    readonly map: MapDef;
    readonly rng: Rng;
    // A floor that rises and falls away (MapDef.floor)
    // Laid afresh when the party wipes on the Wardens (failWardens)
    floor: ArenaFloor | undefined;
    readonly endless: boolean;
    readonly hard: boolean;
    readonly expert: boolean;
    // The Tombs of Amascut: the invocations on, and the raid level they come to
    readonly invocations: string[];
    readonly raidLevel: number;
    // A map's lights (MapDef.lighting), and whether weapons only aim at what's lit
    readonly lighting: LightingDef | undefined;
    readonly litTargetsOnly: boolean;
    // On a map with lighting, this tick's sim lights (stepLights): each player's, the map's, and
    // what enemies carry and leave. Empty on any other map.
    lights: Light[] = [];
    private leftLights: LeftLight[] = [];
    // The scene's ambient as it changes over time (dimTo): from, to, over these ticks
    private dim = { from: 1, to: 1, startTick: 0, endTick: 0 };

    tick = 0;
    // Tick the run ended, -1 while it's going
    endTick = -1;
    // The final boss has fallen: when the run's won (BossDef.fallSeconds), and
    // when it fell
    private victoryAt = -1;
    private fellTick = -1;
    state: SimState = "playing";

    // Everyone in the run, one on your own. The fields below that are a
    // hero's (player, stats, weapons...) are the current hero's: the one the
    // sim is working on at the moment, and between ticks the one this client
    // plays (focus), so the UI reads its own player's.
    readonly heroes: Hero[] = [];
    private hero!: Hero;
    // The hero this client plays
    readonly focus: number;
    // A random event's visitor waiting around, and what one's offering while
    // the run waits
    visitor?: Visitor;
    offer?: EventOffer;

    enemies: Enemy[] = [];
    projectiles: Projectile[] = [];
    enemyProjectiles: EnemyProjectile[] = [];
    pickups: Pickup[] = [];
    effects: Effect[] = [];
    turrets: Turret[] = [];
    thralls: Thrall[] = [];
    // Power-ups that last a while, for their timers
    powerUps: ActivePowerUp[] = [];
    rocks: FallingRock[] = [];
    rampages: Rampage[] = [];
    rings: FairyRing[] = [];
    // Bosses' glyphs (BossDef.glyph)
    glyphs: Glyph[] = [];
    // A boss's bullets, what fired each (BulletPool.source), and the volleys to
    // come
    readonly bullets = new BulletPool();
    // What a bullet's source index means. A slot is freed once its boss is
    // dead with nothing of its left in the air (see freeBulletSources), so
    // a long endless run doesn't keep every boss it's had
    readonly bulletSources: ({ attack: BossAttackDef; enemy: Enemy } | undefined)[] = [];
    private emitters: BulletEmitter[] = [];
    // The tick an impact last shook the camera (ImpactDef), so marks landing together shake it once
    private impactTick = -1;
    // What the screen draws of them (a row attack's warning)
    get bulletEmitters(): readonly BulletEmitter[] {
        return this.emitters;
    }
    // Where each hero is for the bullets, kept from tick to tick
    private readonly bulletTargets: BulletTarget[] = [];
    // What a boss has marked on the ground, and its corpse flowers
    hazards: GroundHazard[] = [];
    quarters?: BossQuarters;
    // A boss's entrance under way, and a boss it's just the player and
    // (BossIntroDef.alone), for as long as it's up
    intro?: BossIntro;
    private aloneWith?: Enemy;
    // Burning ground left by weapons
    fires: GroundFire[] = [];
    // Pools left by bosses' attacks
    pools: GroundPool[] = [];
    // Beams from bosses to their partners (BossAttackDef.tether)
    tethers: BossTether[] = [];
    // Hits still to land, a moment after their swing
    private pendingHits: PendingHit[] = [];
    // Enemies that died lately, for revivers (oldest first)
    private deaths: Death[] = [];

    xp = 0;
    level = 1;
    kills = 0;
    // Enemy id -> times killed (a boss that rose again as its second form's)
    enemyKills: Record<string, number> = {};
    bossesKilled: string[] = [];
    // When the next trick or treat pumpkin can drop
    private nextPumpkinTick = 0;
    coins = 0;
    // Party income before purchases or theft. Returning stolen coins isn't new income.
    coinsGained = 0;
    // Co-op: the run ended because its last hero standing left rather than fell. A party that
    // lost someone earlier and then fell still ended in a death.
    endedByLeaving = false;
    casketsOpened = 0;
    readonly bossKills: { enemyId: string; seconds: number }[] = [];
    // What's dealing damage now, for damageBySource: set before each source
    // gets its turn
    private damageSource: DamageSource = "other";
    private readonly weaponDamageMultipliers: Partial<Record<DamageSource, number>>;
    // The final boss is up
    bossSpawned = false;
    // Raids (MapDef.raid): the room the party's in, and where it's at: its waves, its boss's
    // fight, or cleared and about to move on (since raidStageTick)
    raidRoom = 0;
    // The tick the room began (its waves and events go by its own clock, from then), and the
    // tick its boss comes: when its waves are done, or now if the portal's taken
    raidRoomStartTick = 0;
    raidBossDueTick = 0;
    readonly testing?: SimTesting;
    raidStage: "waves" | "boss" | "cleared" = "waves";
    // Deadly Prayers: until when each hero's open to a harder hit
    private readonly tombsOpenUntil = new Map<number, number>();
    // The Tombs' Nexus: the door each hero's at, if any (stepTombs), and the path the party's on,
    // undefined in the Nexus
    private readonly tombsDoors = new Map<number, string | undefined>();
    tombsPath: string | undefined;
    // The paths done, in the order they were
    tombsPathsDone: string[] = [];
    // A fight in parts: the part this run is (MapDef.stages)
    readonly stage: number;
    // Ticks spent in the Nexus, which the run's clock leaves out (not the Wardens' room's)
    nexusTicks = 0;
    // Dev only: nothing hurts the player (GameClient.toggleDevGod), for watching a fight's mechanics
    devGod = false;
    // Times the party's died in the Tombs (each a room started over)
    tombsDeaths = 0;
    // The Scabaras room's puzzles all solved this run: what unlocks its puzzle helper
    // (SaveData.scabarasBeaten)
    scabarasBeaten = false;
    // The Helpful Spirit's bundles each hero's had, or let go by (of two), and who's stood by it
    private tombsSpiritTaken = new Map<number, number>();
    private tombsSpiritNear = new Set<number>();
    // What's in the Spirit's bundles for each hero's next one, rolled the first time they look, so
    // walking off and back doesn't roll them again
    private tombsSpiritOffer = new Map<number, EventOption[]>();
    // Said once the party's back in the Nexus with a bundle to come
    private tombsSpiritReady = false;
    // When each of the Scabaras room's reminders was last said (Sim.scabarasHint)
    private scabarasHintTicks = new Map<string, number>();
    // Each path taken, when it was entered and how long it took, for the result's board
    private tombsTimes: { id: string; startTick: number; seconds?: number }[] = [];
    // When the party first came to the Wardens, for the board's time (wipes and all)
    private wardensFromTick = -1;
    // Jungle Japes's banana peels, in a path boss's fight
    tombsPeels: { x: number; y: number; endTick: number }[] = [];
    // Akkha's fight, while he's up
    tombsAkkha?: AkkhaFight;
    tombsKephri?: KephriFight;
    tombsZebak?: ZebakFight;
    // The Wardens' fight, once the party's in their room
    tombsWardens?: WardensFight;
    // Rocks Ba-Ba's boulders left, solid, to take cover by (BossAttackDef.leavesCover)
    tombsCover: { x: number; y: number; radius: number; endTick: number; look: string }[] = [];
    // A path boss's arena's sarcophagi, while it's up: open until openUntil, firing next at nextTick
    tombsSarcophagi: {
        x: number;
        y: number;
        rotation: number;
        openUntil: number;
        nextTick: number;
    }[] = [];
    // The Apmeken room while the party's in it
    tombsRoom: TombsRoom | undefined;
    raidStageTick = 0;
    // Who's still to have their turn at a cleared room's supply chest
    private raidShopQueue: number[] = [];
    // The hall's teleporter: uses left this raid, and whether walking up to it asks again (only
    // once whoever it asked has stepped away)
    raidTeleportsLeft = 0;
    private readonly raidTeleports: number;
    private readonly raidPortals: boolean[];
    private teleporterArmed = true;
    // Endless runs' round, and the tick it started; killing the final boss
    // starts the next
    round = 1;
    roundStartTick = 0;

    events: SimEvent[] = [];

    // Co-op's bigger, tougher crowds (content/coop.ts), all 1 on your own
    private partyScale: PartyScale;
    // What hard mode multiplies enemies' hitpoints and damage by (1 outside it)
    // Enemies' hitpoints and damage by hard mode or the raid level, and a boss's hitpoints (the
    // raid level's own for the Tombs' bosses)
    private readonly hardScale: { hp: number; damage: number; bossHp: number };
    // A boss pattern's bullets a volley on hard mode, times its own (MapDef.hard bullets)
    private readonly bulletScale: number;
    // What each bone's worth for the party: its scale's experience, made up
    // for when the crowd's cap leaves no room for all of the party's extra
    private partyXp = 1;
    // What keeps flying enemies out, worked out when the first turns up, as
    // most maps have none. Each hero has their own way round it.
    private flightGrid: FlightGrid | undefined;
    // Enemy id -> the tick the next of its kind can go (EnemyBlinksDef.gap)
    private readonly blinkGapEnd = new Map<string, number>();
    private readonly enemyHash: SpatialHash<Enemy>;
    // The enemies in enemyHash more than two tiles across (radius over 1), and where each went in
    // (x then y, in turn). The hash goes by middles, so a search for what an attack touches can
    // miss one whose edge is in range: queryTouching looks at these too. Rebuilt with the hash,
    // so one that grows mid-tick (a boss rising into a bigger form) joins it the next tick.
    private readonly bigEnemies: Enemy[] = [];
    private readonly bigEnemyAt: number[] = [];
    private readonly pileHash: SpatialHash<Pickup>;
    private nextUid = 1;
    // Enemies that have died or vanished so far, for Enemy.deathSeq
    private enemyDeaths = 0;
    private spawnAccumulator = 0;
    private eventIndex = 0;
    // When the last power-up dropped; the longer ago, the likelier the next
    private lastPowerUpTick = 0;
    // What dropped last, which doesn't drop twice in a row
    private lastPowerUpId?: string;
    // Random events roll on their own, so a run only goes differently for
    // what they do and not for them being there
    readonly eventRng: Rng;
    // Run second the next random event is due, and the last one (not twice running)
    private nextRandomEventSeconds: number;
    private lastRandomEventId?: string;
    // Enemies (other than bosses) stand still until then, new ones too
    private freezeEndTick = 0;
    // While a Drill Demon lasts
    private lapsEndTick = 0;
    private laps?: Extract<PowerUpEffect, { kind: "laps" }>;
    // Fun maps: run second the next random boss is due, the last one picked
    // (not picked twice running), and when the next chat lines are due
    private nextFunBossSeconds = Infinity;
    private lastFunBoss?: string;
    // A pool that turns up together (FunMapDef.bosses.together): the ones out
    // now, until the last of them is killed
    private funBossGroup: Enemy[] = [];
    // Co-op: the next boss encounter's id (Encounter)
    private nextEncounter = 1;
    private nextChatTick = 0;
    private nextPlayerChatSeconds = Infinity;
    // The factions seen so far, in order, and where the first one comes from
    // (see factionAngle)
    private readonly factions: string[] = [];
    private factionBaseAngle?: number;
    private readonly temp = { x: 0, y: 0 };

    // ---- The current hero's ----

    get characterId(): string {
        return this.hero.characterId;
    }
    get metaStats(): Stats {
        return this.hero.metaStats;
    }
    get unlockedItems(): ReadonlySet<string> | undefined {
        return this.hero.unlockedItems;
    }
    private get armoury(): ArmouryUpgrades | undefined {
        return this.hero.armoury;
    }
    get player(): Player {
        return this.hero.player;
    }
    get stats(): Stats {
        return this.hero.stats;
    }
    set stats(stats: Stats) {
        this.hero.stats = stats;
    }
    get weapons(): WeaponState[] {
        return this.hero.weapons;
    }
    set weapons(weapons: WeaponState[]) {
        this.hero.weapons = weapons;
    }
    get passives(): PassiveState[] {
        return this.hero.passives;
    }
    set passives(passives: PassiveState[]) {
        this.hero.passives = passives;
    }
    get gear(): Partial<Record<GearSlot, string>> {
        return this.hero.gear;
    }
    set gear(gear: Partial<Record<GearSlot, string>>) {
        this.hero.gear = gear;
    }
    get activeSets(): string[] {
        return this.hero.activeSets;
    }
    set activeSets(sets: string[]) {
        this.hero.activeSets = sets;
    }
    get gearUpgrades(): Partial<Record<GearSlot, number>> {
        return this.hero.gearUpgrades;
    }
    set gearUpgrades(upgrades: Partial<Record<GearSlot, number>>) {
        this.hero.gearUpgrades = upgrades;
    }
    get evolutionsMade(): string[] {
        return this.hero.evolutionsMade;
    }
    get inventory(): (InventorySlot | null)[] {
        return this.hero.inventory;
    }
    set inventory(inventory: (InventorySlot | null)[]) {
        this.hero.inventory = inventory;
    }
    get buffs(): Buff[] {
        return this.hero.buffs;
    }
    set buffs(buffs: Buff[]) {
        this.hero.buffs = buffs;
    }
    get debuffs(): Debuff[] {
        return this.hero.debuffs;
    }
    set debuffs(debuffs: Debuff[]) {
        this.hero.debuffs = debuffs;
    }
    get chests(): ChestOffer[] {
        return this.hero.chests;
    }
    get pendingLevelUps(): number {
        return this.hero.pendingLevelUps;
    }
    set pendingLevelUps(count: number) {
        this.hero.pendingLevelUps = count;
    }
    get choices(): UpgradeChoice[] {
        return this.hero.choices;
    }
    set choices(choices: UpgradeChoice[]) {
        this.hero.choices = choices;
    }
    get gearFound(): Set<string> {
        return this.hero.gearFound;
    }
    get declinedSets(): Set<string> {
        return this.hero.declinedSets;
    }
    get trophies(): Set<string> {
        return this.hero.trophies;
    }
    get revivesLeft(): number {
        return this.hero.revivesLeft;
    }
    set revivesLeft(count: number) {
        this.hero.revivesLeft = count;
    }
    get rerollsLeft(): number {
        return this.hero.rerollsLeft;
    }
    set rerollsLeft(count: number) {
        this.hero.rerollsLeft = count;
    }
    get banishesLeft(): number {
        return this.hero.banishesLeft;
    }
    get banishedItems(): ReadonlySet<string> {
        return this.hero.banishedItems;
    }
    get banishedSets(): ReadonlySet<string> {
        return this.hero.banishedSets;
    }
    get skips(): number {
        return this.hero.skips;
    }
    set skips(count: number) {
        this.hero.skips = count;
    }
    get damageBySource(): Record<string, number> {
        return this.hero.damageBySource;
    }
    get killsBySource(): Record<string, number> {
        return this.hero.killsBySource;
    }
    get damageTaken(): number {
        return this.hero.damageTaken;
    }
    get damageByAttack(): Record<string, number> {
        return this.hero.damageByAttack;
    }
    set damageTaken(amount: number) {
        this.hero.damageTaken = amount;
    }
    get healed(): number {
        return this.hero.healed;
    }
    set healed(amount: number) {
        this.hero.healed = amount;
    }
    get highestHit(): number {
        return this.hero.highestHit;
    }
    set highestHit(amount: number) {
        this.hero.highestHit = amount;
    }
    get weaponSince(): Record<string, number> {
        return this.hero.weaponSince;
    }
    get appearanceVersion(): number {
        return this.hero.appearanceVersion;
    }
    set appearanceVersion(version: number) {
        this.hero.appearanceVersion = version;
    }
    get flowField(): FlowField {
        return this.hero.flowField;
    }
    private get regenAccumulator(): number {
        return this.hero.regenAccumulator;
    }
    private set regenAccumulator(amount: number) {
        this.hero.regenAccumulator = amount;
    }
    private get bloodFuryRollTick(): number {
        return this.hero.bloodFuryRollTick;
    }
    private set bloodFuryRollTick(tick: number) {
        this.hero.bloodFuryRollTick = tick;
    }
    private get sledEndTick(): number {
        return this.hero.sledEndTick;
    }
    private set sledEndTick(tick: number) {
        this.hero.sledEndTick = tick;
    }
    private get sledSpeed(): number {
        return this.hero.sledSpeed;
    }
    private set sledSpeed(speed: number) {
        this.hero.sledSpeed = speed;
    }
    get curse(): PlayerCurse | undefined {
        return this.hero.curse;
    }
    set curse(curse: PlayerCurse | undefined) {
        this.hero.curse = curse;
    }
    get parasite(): PlayerParasite | undefined {
        return this.hero.parasite;
    }
    set parasite(parasite: PlayerParasite | undefined) {
        this.hero.parasite = parasite;
    }
    get hold(): PlayerHold | undefined {
        return this.hero.hold;
    }
    set hold(hold: PlayerHold | undefined) {
        this.hero.hold = hold;
    }
    private get drowsyEndTick(): number {
        return this.hero.drowsyEndTick;
    }
    private set drowsyEndTick(tick: number) {
        this.hero.drowsyEndTick = tick;
    }
    private get drowsyInterval(): number {
        return this.hero.drowsyInterval;
    }
    private set drowsyInterval(interval: number) {
        this.hero.drowsyInterval = interval;
    }
    private get bulletGraceEnd(): number {
        return this.hero.bulletGraceEnd;
    }
    private set bulletGraceEnd(tick: number) {
        this.hero.bulletGraceEnd = tick;
    }

    constructor(options: SimOptions) {
        this.grid = options.grid;
        this.enemyHash = new SpatialHash(2, this.grid);
        this.pileHash = new SpatialHash(PILE_RADIUS, this.grid);
        this.map = getMap(options.mapId ?? "lumbridge");
        this.lighting = this.map.lighting;
        this.litTargetsOnly = this.lighting?.litTargetsOnly === true;
        this.dim.from = this.dim.to = this.lighting?.ambient ?? 1;
        this.rng = new Rng(options.seed);
        this.floor = this.map.floor
            ? new ArenaFloor(this.map.floor, this.grid, this.rng, TICKS_PER_SECOND)
            : undefined;
        // Building it takes a while, so it's done here, with the map, rather
        // than on the tick the first flier turns up (getFlight still can)
        if (hasFliers(this.map)) {
            this.flightGrid = new FlightGrid(this.grid);
        }
        // Fun maps are endless from the start
        this.endless = (options.endless ?? false) || this.map.fun !== undefined;
        this.expert = (options.expert ?? false) && this.map.raid !== undefined;
        // The Tombs go by their invocations instead
        this.hard = ((options.hard ?? false) || this.expert) && !this.map.tombs;
        this.invocations = this.map.tombs ? cleanInvocations(options.invocations ?? []) : [];
        const stage = Math.floor(options.stage ?? 0);
        this.stage = Number.isFinite(stage)
            ? Math.max(0, Math.min(stage, (this.map.stages?.length ?? 1) - 1))
            : 0;
        this.raidLevel = getRaidLevel(this.invocations);
        this.testing = options.testing;
        this.raidTeleports = this.map.raid ? (options.raidTeleports ?? 0) : 0;
        this.raidTeleportsLeft = this.raidTeleports;
        this.raidPortals = options.raidPortals ?? [];
        if (this.map.raid) {
            this.raidBossDueTick = this.raidWaveLength(0) * TICKS_PER_SECOND;
        }
        this.hardScale = this.map.tombs
            ? getRaidLevelScale(this.raidLevel)
            : this.hard
              ? { ...getHardScale(this.map), bossHp: getHardScale(this.map).hp }
              : { hp: 1, damage: 1, bossHp: 1 };
        this.bulletScale = this.map.tombs
            ? getRaidLevelScale(this.raidLevel).bullets
            : this.hard
              ? (this.map.hard?.bullets ?? 1)
              : 1;
        const party: HeroOptions[] = options.party ?? [
            {
                name: "",
                characterId: options.characterId,
                metaStats: options.metaStats,
                unlockedItems: options.unlockedItems,
                trophiesFound: options.trophiesFound,
                armoury: options.armoury,
            },
        ];
        this.weaponDamageMultipliers = Object.fromEntries(
            WEAPONS.map((weapon) => [
                `weapon:${weapon.id}`,
                getWeaponDamageMultiplier(weapon, party.length, this.hard, options.balance),
            ]),
        );
        this.partyScale = getPartyScale(party.length);
        this.partyXp = this.partyScale.xp;
        this.focus = Math.min(options.focus ?? 0, party.length - 1);
        this.eventRng = new Rng(options.seed ^ RANDOM_EVENT_SEED);
        this.nextRandomEventSeconds = this.eventRng.range(...RANDOM_EVENT_FIRST);
        const fun = this.map.fun;
        if (fun) {
            this.nextFunBossSeconds = fun.bosses.firstAt;
            if (fun.playerChat) {
                this.nextPlayerChatSeconds = this.rng.range(...fun.playerChat.every);
            }
        }
        party.forEach((hero, index) => {
            this.heroes.push(this.createHero(hero, index, options.spawnX, options.spawnY));
        });
        for (const hero of this.heroes) {
            this.use(hero);
            this.addWeapon(getCharacter(hero.characterId).startingWeapon);
            // A boss fight's kit: the weapon at its level, and nothing more ever
            if (this.map.fight) {
                this.weapons[0].level = this.map.fight.weaponLevel;
                // and its gear, worn from the start (MapDef.fight.gear)
                for (const id of this.map.fight.gear ?? []) {
                    this.equip(id);
                }
            }
            this.updateStats();
            hero.player.hp = hero.player.maxHp;
            hero.revivesLeft = hero.stats.revival;
            hero.rerollsLeft = BASE_REROLLS + hero.stats.reroll;
            hero.rerollsAtStart = hero.rerollsLeft;
            hero.banishesLeft = hero.stats.banish;
            // Testing: the starting weapon at its max too
            if (this.testing?.maxLevelUps) {
                this.maxEverything();
            }
            this.updateFlowField();
        }
        this.use(this.heroes[this.focus]);
        if (this.lighting) {
            for (const at of this.lighting.lanterns ?? []) {
                const spot = this.walkableSpot(at.x, at.y);
                this.dropPickup("powerUp", spot.x, spot.y, 1, { powerUp: LANTERN_ID });
            }
            this.stepLights();
        }
    }

    // A hero at the spawn, or for a party's others, around it
    private createHero(options: HeroOptions, index: number, spawnX: number, spawnY: number): Hero {
        const angle = (index / 4) * Math.PI * 2;
        const offset = index === 0 ? 0 : PARTY_SPREAD;
        const start = findFreeSpot(
            this.grid,
            spawnX + fm.cos(angle) * offset,
            spawnY + fm.sin(angle) * offset,
            PLAYER_RADIUS,
        );
        const flowField = new FlowField(FLOW_FIELD_SIZE);
        flowField.ditchY = this.map.ditch?.y;
        // Updated with the ground one from the start (getFlight's would be at
        // the same target by the time it's needed)
        const flightField = this.flightGrid && new FlowField(FLOW_FIELD_SIZE);
        // South, or the map's spawnFacing made a unit vector, as facing always is
        const turned = this.map.spawnFacing;
        const length = turned ? fm.hypot(turned.x, turned.y) : 0;
        const facing =
            turned && length > 0 ? { x: turned.x / length, y: turned.y / length } : { x: 0, y: -1 };
        return {
            index,
            name: options.name,
            characterId: options.characterId,
            metaStats: options.metaStats,
            unlockedItems: options.unlockedItems,
            trophiesFound: options.trophiesFound,
            armoury: options.armoury,
            player: {
                x: start.x,
                y: start.y,
                prevX: start.x,
                prevY: start.y,
                radius: PLAYER_RADIUS,
                facingX: facing.x,
                facingY: facing.y,
                yaw: yawFromVector(facing.x, facing.y),
                moving: false,
                hp: PLAYER_BASE_HP,
                maxHp: PLAYER_BASE_HP,
                attackSeq: -1,
                attackStart: 0,
                deathTick: -1,
                moveStart: 0,
                invulnerable: 0,
                flash: 0,
                frozen: 0,
                poisonDamage: 0,
                poisonEnd: -1,
            },
            stats: emptyStats(),
            weapons: [],
            passives: [],
            gear: {},
            activeSets: [],
            gearUpgrades: {},
            evolutionsMade: [],
            inventory: new Array(MAX_INVENTORY).fill(null),
            buffs: [],
            debuffs: [],
            chests: [],
            pendingLevelUps: 0,
            choices: [],
            gearFound: new Set(),
            declinedSets: new Set(),
            trophies: new Set(),
            revivesLeft: 0,
            rerollsLeft: 0,
            rerollsAtStart: 0,
            banishesLeft: 0,
            banished: new Set(),
            banishedItems: new Set(),
            banishedSets: new Set(),
            skips: 0,
            damageBySource: {},
            recentDamage: new Float64Array(DPS_WINDOW_TICKS),
            killsBySource: {},
            casketsOpened: 0,
            damageTaken: 0,
            damageByAttack: {},
            raidPoints: 0,
            raidDamageAtStart: 0,
            raidPointsEarned: 0,
            tombsPoints: 0,
            tombsGross: 0,
            wardenEnergy: 0,
            wardenEnergyTick: 0,
            tombsDowns: 0,
            healed: 0,
            highestHit: 0,
            weaponSince: {},
            appearanceVersion: 0,
            flowField,
            flightField,
            regenAccumulator: 0,
            bloodFuryRollTick: 0,
            sledEndTick: 0,
            sledSpeed: 1,
            drowsyEndTick: 0,
            drowsyInterval: 1,
            bulletGraceEnd: 0,
            floorGraceEnd: 0,
            trail: new Float64Array(TRAIL_TICKS * 3).fill(-1),
            floorEffectNext: 0,
            glideX: 0,
            glideY: 0,
            moveX: 0,
            moveY: 0,
            down: false,
            left: false,
            outTick: -1,
            revived: 0,
            extraRevives: 0,
            immuneEndTick: 0,
            abilityReadyTick: 0,
            abilityHeldUntil: -1,
        };
    }

    // Makes this the current hero (see heroes)
    private use(hero: Hero): void {
        this.hero = hero;
    }

    // Does something as one of the party (a co-op player's choice, as it came
    // in over the network), then goes back to the focus
    as<T>(heroIndex: number, action: () => T): T {
        const hero = this.heroes[heroIndex];
        if (!hero) {
            return action();
        }
        this.use(hero);
        try {
            return action();
        } finally {
            this.use(this.heroes[this.focus]);
        }
    }

    // Whether a hero is still in the fight: not down, and still in the game
    isUp(hero: Hero): boolean {
        return !hero.down && !hero.left;
    }

    // Co-op: just brought back by a teammate, so nothing can hurt them and
    // enemies leave them be (see reviveHero)
    isImmune(hero: Hero): boolean {
        return this.tick < hero.immuneEndTick;
    }

    // Co-op: down, and a teammate can still bring them back
    canBeRevived(hero: Hero): boolean {
        return hero.down && !hero.left && this.revivesLeftFor(hero) > 0;
    }

    // Co-op: the times a hero can still be revived, for the UI
    revivesLeftFor(hero: Hero): number {
        return Math.max(0, REVIVES_PER_PLAYER + hero.extraRevives - hero.revived);
    }

    // Co-op: a Prayer cape found or bought, so they can be revived once more
    private gainRevive(): void {
        this.hero.extraRevives++;
        this.emit({ type: "extraRevive" });
    }

    // Whether enemies go after a hero: up, and not just revived. When
    // everyone up is immune they go after them anyway (and can't hurt them)
    private isTarget(hero: Hero, anyTargets: boolean): boolean {
        return this.isUp(hero) && (!anyTargets || !this.isImmune(hero));
    }

    private anyTargets(): boolean {
        return this.heroes.some((hero) => this.isUp(hero) && !this.isImmune(hero));
    }

    // The hero nearest a spot that's still in the fight, for enemies (and
    // their projectiles) to go after: a just revived hero is left be while
    // anyone else is up (the current one if nobody is)
    private nearestHero(x: number, y: number): Hero {
        if (this.heroes.length === 1) {
            return this.heroes[0];
        }
        const anyTargets = this.anyTargets();
        return this.nearest(x, y, (hero) => this.isTarget(hero, anyTargets));
    }

    // The hero nearest a spot that's up, revived or not, for pickups to fly
    // to and be picked up by: immunity keeps enemies off a hero, not food
    private nearestUpHero(x: number, y: number): Hero {
        if (this.heroes.length === 1) {
            return this.heroes[0];
        }
        return this.nearest(x, y, (hero) => this.isUp(hero));
    }

    private nearest(x: number, y: number, fits: (hero: Hero) => boolean): Hero {
        let nearest: Hero | undefined;
        let best = Infinity;
        for (const hero of this.heroes) {
            if (!fits(hero)) {
                continue;
            }
            const dx = hero.player.x - x;
            const dy = hero.player.y - y;
            const distSq = dx * dx + dy * dy;
            if (distSq < best) {
                best = distSq;
                nearest = hero;
            }
        }
        return nearest ?? this.hero;
    }

    // Picks one of the heroes still in the fight for a crowd to turn up
    // around, each as likely (the only one, on your own)
    private useSpawnHero(): void {
        if (this.heroes.length === 1) {
            return;
        }
        const anyTargets = this.anyTargets();
        const up = this.heroes.filter((hero) => this.isTarget(hero, anyTargets));
        if (up.length > 0) {
            this.use(up[this.rng.int(up.length)]);
        }
    }

    // Makes the hero something belongs to the current one (what a projectile,
    // thrall or venom does is theirs: their stats, their run's numbers)
    private useHeroAt(index: number | undefined): void {
        const hero = index !== undefined ? this.heroes[index] : undefined;
        if (hero) {
            this.use(hero);
        }
    }

    // Does something as each hero an attack could land on (the one, on your
    // own), then goes back to the hero it was working on
    private forEachHeroInReach(action: () => void): void {
        const current = this.hero;
        for (const hero of this.heroes) {
            if (this.heroes.length > 1 && !this.isUp(hero)) {
                continue;
            }
            this.use(hero);
            action();
        }
        this.use(current);
    }

    // Co-op tags the events that are a hero's own with who (SimEvent.hero)
    private emit(event: SimEvent, personal = PERSONAL_EVENTS.has(event.type)): void {
        if (personal && this.heroes.length > 1) {
            event.hero = this.hero.index;
        }
        this.events.push(event);
    }

    // Enemies find their way to the player's tile, or when they're standing on
    // part of an object's (beside a signpost's post), the nearest open one
    private updateFlowField(): void {
        const player = this.player;
        let tileX = Math.floor(player.x);
        let tileY = Math.floor(player.y);
        if (this.grid.isSolid(tileX, tileY)) {
            let best = Infinity;
            const fromX = tileX;
            const fromY = tileY;
            for (let d = 1; d <= 3 && best === Infinity; d++) {
                for (let y = fromY - d; y <= fromY + d; y++) {
                    for (let x = fromX - d; x <= fromX + d; x++) {
                        if (
                            Math.max(Math.abs(x - fromX), Math.abs(y - fromY)) !== d ||
                            this.grid.isSolid(x, y)
                        ) {
                            continue;
                        }
                        const distance = fm.hypot(x + 0.5 - player.x, y + 0.5 - player.y);
                        if (distance < best) {
                            best = distance;
                            tileX = x;
                            tileY = y;
                        }
                    }
                }
            }
        }
        if (
            tileX !== this.flowField.targetX ||
            tileY !== this.flowField.targetY ||
            this.grid.version !== this.flowField.gridVersion
        ) {
            this.flowField.update(this.grid, tileX, tileY);
            if (this.flightGrid) {
                this.hero.flightField?.update(this.flightGrid, tileX, tileY);
            }
        }
    }

    // What keeps flying enemies out, and the current hero's way round it
    private getFlight(): { grid: FlightGrid; field: FlowField } {
        const grid = (this.flightGrid ??= new FlightGrid(this.grid));
        if (!this.hero.flightField) {
            const field = new FlowField(FLOW_FIELD_SIZE);
            field.update(grid, this.flowField.targetX, this.flowField.targetY);
            this.hero.flightField = field;
        }
        return { grid, field: this.hero.flightField };
    }

    private getMoveGrid(def: EnemyDef): ArenaGrid | FlightGrid {
        return def.flies ? (this.flightGrid ??= new FlightGrid(this.grid)) : this.grid;
    }

    private gainCoins(amount: number): void {
        this.coins += amount;
        this.coinsGained += amount;
    }

    // Run time; stops when the run ends, though ticks carry on for animations
    // The run's time: in the Tombs, not counting what's spent in the Nexus, where the clock stops
    get seconds(): number {
        return (
            ((this.endTick >= 0 ? this.endTick : this.tick) - this.nexusTicks) / TICKS_PER_SECOND
        );
    }

    // Where the run is in the map's waves and events: the whole run outside
    // endless runs, and an endless run's later rounds start some way in
    get mapSeconds(): number {
        const start = this.round > 1 ? LATER_ROUND_START : 0;
        return start + this.seconds - this.roundStartTick / TICKS_PER_SECOND;
    }

    get xpForNextLevel(): number {
        return this.xpForLevel(this.level + 1);
    }

    get xpForThisLevel(): number {
        return this.xpForLevel(this.level);
    }

    private xpForLevel(level: number): number {
        return this.endless ? endlessXpForLevel(level) : runXpForLevel(level);
    }

    // The map's events, or this part's of a fight in parts
    get mapEvents(): RunEventDef[] {
        return this.map.stages?.[this.stage]?.events ?? this.map.events;
    }

    getResult(): RunResult {
        return {
            mapId: this.map.id,
            endless: this.endless,
            hard: this.hard,
            expert: this.expert,
            ...(this.map.stages && { stage: this.stage }),
            ...(this.hero.raidChest && { raidChest: this.hero.raidChest }),
            ...(this.map.tombs && { tombs: this.tombsSummary() }),
            ...(this.scabarasBeaten && { scabarasBeaten: true }),
            round: this.round,
            victory: this.state === "victory",
            seconds: this.seconds,
            level: this.level,
            kills: this.kills,
            coins: this.coins,
            bossesKilled: [...this.bossesKilled],
            gearFound: [...this.gearFound],
            evolutionsMade: [...this.evolutionsMade],
            trophies: [...this.trophies],
            enemyKills: { ...this.enemyKills },
            caskets: this.casketsOpened,
            stats: this.getRunStats(),
        };
    }

    // The player's damage a second just now, from every source
    get dps(): number {
        let damage = 0;
        for (const dealt of this.hero.recentDamage) {
            damage += dealt;
        }
        return damage / DPS_WINDOW_SECONDS;
    }

    getRunStats(): RunStats {
        // Every weapon that was had, even one that never landed a hit
        const sources = new Set([
            ...Object.keys(this.damageBySource),
            ...Object.keys(this.killsBySource),
            ...Object.keys(this.weaponSince).map((id) => `weapon:${id}`),
        ]) as Set<DamageSource>;
        // A weapon's time ends with the run, or when its hero went down or left
        const runEnd = this.endTick >= 0 ? this.endTick : this.tick;
        const end = this.hero.outTick >= 0 ? Math.min(this.hero.outTick, runEnd) : runEnd;
        return {
            sources: [...sources]
                .map((source) => {
                    const since = source.startsWith("weapon:")
                        ? this.weaponSince[source.slice("weapon:".length)]
                        : undefined;
                    return {
                        source,
                        damage: this.damageBySource[source] ?? 0,
                        kills: this.killsBySource[source] ?? 0,
                        ...(since !== undefined && {
                            seconds: (end - since) / TICKS_PER_SECOND,
                        }),
                    };
                })
                .sort((a, b) => b.damage - a.damage || b.kills - a.kills),
            damageTaken: this.damageTaken,
            healed: this.healed,
            highestHit: this.highestHit,
            rerollsUsed: Math.max(0, this.hero.rerollsAtStart - this.rerollsLeft),
            skips: this.skips,
            bossKills: [...this.bossKills],
        };
    }

    // ---- Stats and upgrades ----

    updateStats(): void {
        const stats = emptyStats();
        addStats(stats, getCharacter(this.characterId).bonus);
        addStats(stats, this.metaStats);
        for (const passive of this.passives) {
            const def = getPassive(passive.id);
            for (const stat of [def.stat, ...(def.alsoAdds ?? [])]) {
                stats[stat] += passive.value;
            }
        }
        for (const [slot, itemId] of Object.entries(this.gear)) {
            const upgrades = this.gearUpgrades[slot as GearSlot] ?? 0;
            addStats(stats, getGearStats(getGear(itemId), upgrades));
        }
        const sets = getActiveSets(this.gear);
        for (const set of sets) {
            addStats(stats, set.stats ?? {});
            if (!this.activeSets.includes(set.id)) {
                this.emit(
                    {
                        type: "notice",
                        message: `${set.name} set bonus: ${set.bonus}!`,
                    },
                    true,
                );
            }
        }
        this.activeSets = sets.map((set) => set.id);
        for (const buff of this.buffs) {
            addStats(stats, buff.stats);
        }
        for (const debuff of this.debuffs) {
            addStats(stats, debuff.stats);
        }
        // Grows with every level gained (the Gauntlet runner starts weak), up
        // to about where a normal run ends, so it doesn't run away in endless
        stats.might += stats.levelMight * Math.min(this.level - 1, LEVEL_MIGHT_LEVELS);
        this.stats = stats;
        const player = this.player;
        const maxHp = Math.round(PLAYER_BASE_HP * (1 + stats.maxHp));
        if (maxHp !== player.maxHp) {
            // Swapping off max hitpoints never kills
            player.hp = Math.max(Math.min(player.hp, 1), player.hp + maxHp - player.maxHp);
            player.maxHp = maxHp;
        }
    }

    // Weapons and passives carried at once, with the extra slots: the shop's, and the Divine rune
    // pouch's, for a magic weapon (Upgrades' fitsWithPouch keeps it for one)
    get maxWeapons(): number {
        return MAX_WEAPONS + this.stats.weaponSlots;
    }

    get maxPassives(): number {
        return MAX_PASSIVES + this.metaStats.passiveSlots;
    }

    addWeapon(weaponId: string, bonus = 0): void {
        if (this.weapons.length >= this.maxWeapons) {
            return;
        }
        this.weapons.push({
            def: getWeapon(weaponId),
            level: 1,
            cooldown: TICKS_PER_SECOND,
            bonus,
            uses: 0,
        });
        this.weaponSince[weaponId] ??= this.tick;
        this.appearanceVersion++;
    }

    choose(index: number): void {
        // A banished reward stays on the card, greyed out, and can't be taken
        if (!this.isChoosing(this.hero) || this.isBanishedChoice(index)) {
            return;
        }
        const choice = this.choices[index];
        if (choice) {
            this.apply(choice);
            if (this.testing?.maxLevelUps) {
                this.maxEverything();
            }
        }
        // A godsword's blade or an Ancient burst that just reached its pick
        // level: picking is the rest of this level up
        const weapon =
            choice?.kind === "weaponLevel"
                ? this.weapons.find((w) => w.def.id === choice.weaponId)
                : undefined;
        const hilts = weapon ? hiltChoices(weapon, this.unlockedItems) : [];
        if (hilts.length > 0) {
            this.choices = hilts;
            return;
        }
        this.nextLevelUp();
    }

    // On to the next level up's rewards, or back to the run
    private nextLevelUp(): void {
        this.pendingLevelUps--;
        this.choices = [];
        if (this.pendingLevelUps > 0) {
            this.choices = this.roll();
        } else {
            this.settle();
        }
    }

    // Whether a hero (the current one by default) has a level up's rewards to
    // choose now. Co-op's downed heroes are out of the run, so the run doesn't
    // wait on them.
    isChoosing(hero: Hero = this.hero): boolean {
        return this.state === "levelUp" && hero.pendingLevelUps > 0 && this.isUp(hero);
    }

    // Anyone up with a level up to choose
    private anyoneToChoose(): boolean {
        return this.heroes.some((hero) => hero.pendingLevelUps > 0 && this.isUp(hero));
    }

    // What the run waits on now: anyone's level up, then anyone's casket, or
    // nothing (co-op waits for everyone)
    private settle(): void {
        if (this.offer) {
            this.state = "event";
        } else if (this.anyoneToChoose()) {
            this.state = "levelUp";
        } else if (this.heroes.some((hero) => hero.chests.length > 0)) {
            this.state = "chest";
        } else {
            this.state = "playing";
        }
    }

    // Co-op: the heroes the run is waiting on to choose a level up's rewards
    // or decide on a casket
    get waitingOn(): Hero[] {
        if (this.state === "levelUp") {
            return this.heroes.filter((hero) => this.isChoosing(hero));
        }
        if (this.state === "chest") {
            return this.heroes.filter((hero) => hero.chests.length > 0);
        }
        if (this.state === "event" && this.offer) {
            return [this.heroes[this.offer.hero]];
        }
        return [];
    }

    // What skipping the level up's rewards costs now (coins are worth less in
    // endless runs, so skips cost less too)
    get skipCost(): number {
        return Math.round(SKIP_BASE_COST * 2 ** this.skips * this.coinScale);
    }

    // A level up's rewards can be skipped for coins, but not a godsword's
    // hilt, or the coins and shark offered when there's nothing else. Only by
    // someone choosing: a downed player can't spend the party's coins.
    get canSkip(): boolean {
        return (
            this.isChoosing() &&
            !this.choosingHilt &&
            this.choices.some((c) => c.kind !== "coins" && c.kind !== "food")
        );
    }

    // Takes none of the level up's rewards, for skipCost coins. False when it
    // can't be skipped or there aren't the coins.
    skip(): boolean {
        if (!this.canSkip || this.coins < this.skipCost) {
            return false;
        }
        this.coins -= this.skipCost;
        this.skips++;
        this.nextLevelUp();
        return true;
    }

    private roll(): UpgradeChoice[] {
        return rollChoices(
            this.rng,
            this.weapons,
            this.passives,
            this.stats.luck,
            getCharacter(this.characterId).style,
            this.unlockedItems,
            this.endless,
            this.maxWeapons,
            this.maxPassives,
            this.hero.banished,
        );
    }

    // Picking a godsword's hilt, which can't be rerolled
    get choosingHilt(): boolean {
        return this.choices.some((c) => c.kind === "hilt");
    }

    // Rolls what's on offer again, for one of the run's rerolls: the level
    // up's rewards, or the open casket's item (another one, its rarity rolled
    // again too). False when there's no reroll left or nothing on offer (a
    // downed player has no level up to choose).
    reroll(): boolean {
        const chest = this.chest;
        if (this.rerollsLeft <= 0 || this.choosingHilt) {
            return false;
        }
        if (this.isChoosing()) {
            this.choices = this.roll();
        } else if (this.state === "chest" && chest) {
            this.declineSetPiece(chest.itemId);
            const { itemId, upgradedFrom } = this.rollChestItem(chest.tier, chest.itemId);
            chest.itemId = itemId;
            chest.upgradedFrom = upgradedFrom;
            chest.upgrades = this.offeredUpgrades(itemId);
        } else {
            return false;
        }
        this.rerollsLeft--;
        return true;
    }

    // Banishing (Firemaking): a level up's new weapon or passive, or a casket's
    // item, kept out of the rest of the run for one of the run's banishes. Only
    // what the player hasn't got: nothing they're levelling, carrying or
    // wearing, nor a piece of a set they're wearing. Nothing comes in its
    // place: a banished reward greys out and the player picks another, and a
    // banished item is alched.
    canBanishChoice(index: number): boolean {
        const choice = this.isChoosing() ? this.choices[index] : undefined;
        return (
            this.banishesLeft > 0 &&
            !!choice &&
            (choice.kind === "newWeapon" || choice.kind === "newPassive") &&
            !this.isBanishedChoice(index) &&
            // Never the last reward left to pick, which would leave nothing
            this.choices.some((_, i) => i !== index && !this.isBanishedChoice(i))
        );
    }

    // Whether a level up's reward has been banished, so can't be picked
    isBanishedChoice(index: number): boolean {
        const choice = this.choices[index];
        return (
            (choice?.kind === "newWeapon" && this.hero.banished.has(choice.weaponId)) ||
            (choice?.kind === "newPassive" && this.hero.banished.has(choice.passiveId))
        );
    }

    // Banishes a level up's reward: it stays where it is, greyed out, and is
    // never offered again. False when it can't be banished.
    banishChoice(index: number): boolean {
        if (!this.canBanishChoice(index)) {
            return false;
        }
        const choice = this.choices[index];
        if (choice.kind === "newWeapon") {
            this.hero.banished.add(choice.weaponId);
        } else if (choice.kind === "newPassive") {
            this.hero.banished.add(choice.passiveId);
        }
        this.hero.banishesLeft--;
        return true;
    }

    // Whether the open casket's item can be banished
    get canBanishChest(): boolean {
        const chest = this.state === "chest" ? this.chest : undefined;
        if (this.banishesLeft <= 0 || !chest) {
            return false;
        }
        const found = getItem(chest.upgradedFrom ?? chest.itemId);
        if (found.kind !== "gear") {
            return !this.inventory.some((slot) => slot?.itemId === found.id);
        }
        const worn = this.gear[found.slot];
        if (worn === chest.itemId || worn === found.id) {
            return false;
        }
        const set = getItemSet(found);
        return !set || countSetPieces(this.gear, set.id) === 0;
    }

    // Banishes the open casket's item (all of its set, for a set's piece), and
    // alches it, which is the casket done. False when it can't be.
    banishChest(): boolean {
        const chest = this.chest;
        if (!this.canBanishChest || !chest) {
            return false;
        }
        const found = getItem(chest.upgradedFrom ?? chest.itemId);
        const set = getItemSet(found);
        if (set) {
            this.hero.banishedSets.add(set.id);
        } else {
            this.hero.banishedItems.add(found.id);
        }
        this.hero.banishesLeft--;
        this.resolveChest("alch");
        return true;
    }

    apply(choice: UpgradeChoice): void {
        switch (choice.kind) {
            case "newWeapon":
                this.addWeapon(choice.weaponId, RARITIES[choice.quality].weaponBonus);
                break;
            case "weaponLevel": {
                const weapon = this.weapons.find((w) => w.def.id === choice.weaponId);
                if (weapon) {
                    const last = weapon.def.levels.length;
                    // Endless runs level on past the last level, for damage
                    weapon.level = this.endless ? choice.level : Math.min(choice.level, last);
                    if (choice.level > last) {
                        // Multiplies everything the weapon had
                        weapon.bonus = overlevelBonus(weapon.bonus, choice.quality);
                    } else {
                        weapon.bonus += RARITIES[choice.quality].weaponBonus;
                    }
                    this.appearanceVersion++;
                }
                break;
            }
            case "evolve": {
                const index = this.weapons.findIndex((w) => w.def.id === choice.weaponId);
                if (index !== -1) {
                    // Bonus damage from rare rolls carries over
                    this.weaponSince[choice.into] ??= this.tick;
                    if (!this.evolutionsMade.includes(choice.into)) {
                        this.evolutionsMade.push(choice.into);
                    }
                    this.emit({ type: "evolved", weaponId: choice.into });
                    this.emit(
                        {
                            type: "notice",
                            message: `Evolved: ${getWeapon(choice.into).name}!`,
                        },
                        true,
                    );
                    this.weapons[index] = {
                        def: getWeapon(choice.into),
                        level: 1,
                        cooldown: 0,
                        bonus: this.weapons[index].bonus,
                        uses: 0,
                    };
                    this.appearanceVersion++;
                }
                break;
            }
            case "hilt": {
                // Everything carries over: level, bonus damage and the count
                // towards the special attack
                const weapon = this.weapons.find((w) => w.def.id === choice.weaponId);
                if (weapon) {
                    weapon.def = getWeapon(choice.into);
                    this.weaponSince[choice.into] ??= this.tick;
                    this.appearanceVersion++;
                }
                break;
            }
            case "newPassive": {
                const def = getPassive(choice.passiveId);
                if (this.passives.length < this.maxPassives) {
                    this.passives.push({
                        id: choice.passiveId,
                        level: 1,
                        value: getPassiveGain(def, choice.quality),
                    });
                }
                this.updateStats();
                this.appearanceVersion++;
                break;
            }
            case "passiveLevel": {
                const passive = this.passives.find((p) => p.id === choice.passiveId);
                if (passive) {
                    const def = getPassive(passive.id);
                    if (canLevelPassive(def, passive.level, this.endless)) {
                        passive.level++;
                        passive.value += getPassiveGain(def, choice.quality);
                    }
                }
                this.updateStats();
                this.appearanceVersion++;
                break;
            }
            case "coins":
                this.gainCoins(choice.amount);
                break;
            case "food":
                this.heal(choice.amount);
                break;
        }
    }

    // Testing (SimTesting.maxLevelUps): every weapon and passive at its last level
    private maxEverything(): void {
        for (const weapon of this.weapons) {
            weapon.level = Math.max(weapon.level, weapon.def.levels.length);
        }
        for (const passive of this.passives) {
            const def = getPassive(passive.id);
            if (passive.level < def.maxLevel) {
                passive.value += getPassiveGain(def, "veryRare") * (def.maxLevel - passive.level);
                passive.level = def.maxLevel;
            }
        }
        this.updateStats();
        this.appearanceVersion++;
    }

    // Poison and boss drains gone (an antidote, a cure, Tumeken's Light), and with the spores'
    // drain the drowsiness it brings, the boss's quicker attacks; the caller updates the stats
    private cure(): void {
        this.player.poisonEnd = -1;
        this.player.poisonDamage = 0;
        this.debuffs = [];
        this.drowsyEndTick = 0;
    }

    heal(amount: number): void {
        const hp = this.player.hp;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
        this.healed += Math.max(0, this.player.hp - hp);
    }

    // ---- Caskets and items ----

    get chest(): ChestOffer | undefined {
        return this.chests[0];
    }

    // Whether a utility item would fit in the inventory
    canStash(itemId: string): boolean {
        return findInventorySlot(this.inventory, itemId) !== -1;
    }

    // Does what the player chose with the open casket's item, then carries on
    // (or opens the next casket, or a level up that came in meanwhile)
    resolveChest(action: ChestAction): void {
        if (this.state !== "chest") {
            return;
        }
        const chest = this.chests.shift();
        if (chest) {
            this.applyChest(chest, action);
        }
        // A blast from the casket can end the run (it can hit the boss)
        if (this.runOver || this.heroes.some((hero) => hero.chests.length > 0)) {
            return;
        }
        this.state = "playing";
        this.checkLevelUp();
    }

    private applyChest(chest: ChestOffer, action: ChestAction): void {
        const item = getItem(chest.itemId);
        if (action === "alch") {
            this.declineSetPiece(item.id);
            const coins = this.alchValue(item.id, chest.upgrades);
            this.gainCoins(coins);
            this.emit({ type: "alch", itemId: item.id, coins });
            return;
        }
        if (item.kind === "gear") {
            this.equip(item.id, chest.upgrades);
            return;
        }
        // An extra revive is theirs at once, not kept
        if (action === "take" && item.use.kind !== "revive" && this.stash(item.id)) {
            return;
        }
        this.useUtility(item);
    }

    // A piece of a set the player has started, turned down: caskets stop
    // bringing that set's pieces for the rest of the run
    private declineSetPiece(itemId: string): void {
        const set = getStartedSet(this.gear, getItem(itemId));
        if (set) {
            this.declinedSets.add(set.id);
        }
    }

    // Wears a piece of gear (upgraded this many times); whatever was in its
    // slot is alched
    equip(itemId: string, upgrades = 0): void {
        const item = getGear(itemId);
        const replacedId = this.gear[item.slot];
        const replacedUpgrades = this.gearUpgrades[item.slot] ?? 0;
        const coins = replacedId ? this.alchValue(replacedId, replacedUpgrades) : 0;
        this.gainCoins(coins);
        this.gear[item.slot] = item.id;
        this.gearUpgrades[item.slot] = upgrades;
        this.updateStats();
        this.appearanceVersion++;
        this.emit({ type: "equip", itemId, replacedId, coins });
    }

    // Puts a utility item in the inventory; false when there's no room
    stash(itemId: string): boolean {
        const index = findInventorySlot(this.inventory, itemId);
        if (index === -1) {
            return false;
        }
        const slot = this.inventory[index];
        if (slot) {
            slot.count++;
        } else {
            this.inventory[index] = { itemId, count: 1 };
        }
        this.emit({ type: "stash", itemId });
        return true;
    }

    // Uses the utility item in an inventory slot (0-3) while playing
    useItem(index: number): boolean {
        const slot = this.inventory[index];
        if (this.state !== "playing" || !slot || !this.isUp(this.hero)) {
            return false;
        }
        const item = getItem(slot.itemId);
        if (item.kind !== "utility") {
            return false;
        }
        slot.count--;
        if (slot.count <= 0) {
            this.inventory[index] = null;
        }
        this.useUtility(item);
        this.checkLevelUp();
        return true;
    }

    private useUtility(item: UtilityDef): void {
        const player = this.player;
        const use = item.use;
        this.emit({ type: "itemUsed", itemId: item.id, x: player.x, y: player.y });
        this.damageSource = `item:${item.id}`;
        switch (use.kind) {
            case "heal":
                this.heal(use.amount * this.healScale);
                if (use.stats && use.seconds) {
                    this.addBuff(item.id, use.stats, use.seconds, false);
                }
                break;
            case "buff":
                this.addBuff(item.id, use.stats, use.seconds, false);
                break;
            case "cure":
                this.cure();
                this.addBuff(item.id, {}, use.seconds, true);
                this.heal((use.heal ?? 0) * this.healScale);
                break;
            case "bones":
                for (const pickup of this.pickups) {
                    if (pickup.kind === "bones") {
                        pickup.attracted = true;
                        pickup.speed = Math.max(pickup.speed, 0.15);
                    }
                }
                break;
            case "blast": {
                const radius = use.radius * (1 + this.stats.area);
                this.emit({ type: "blast", x: player.x, y: player.y, radius });
                // Not the spatial hash: this can run between ticks, when it's stale
                const hit = this.enemies.filter(
                    (e) => !e.dead && fm.hypot(e.x - player.x, e.y - player.y) <= radius + e.radius,
                );
                hit.forEach((enemy, i) => {
                    if (i < MAX_BLAST_EFFECTS) {
                        this.addEffect(use.spotAnim, enemy.x, enemy.y, 0, 30, enemy.uid);
                    }
                    this.damageEnemy(enemy, use.damage * this.roundHp, 2.5, player.x, player.y);
                });
                break;
            }
            case "revive":
                this.gainRevive();
                break;
            case "xp":
                this.xp += (this.xpForNextLevel - this.xpForThisLevel) * use.levels;
                break;
            case "supply":
                this.useRaidSupply(use.supplyId);
                break;
        }
    }

    // A potion's effect, for seconds stretched by effect duration. Drinking
    // another dose starts the timer again.
    private addBuff(itemId: string, stats: Partial<Stats>, seconds: number, cures: boolean): void {
        const ticks = Math.round(seconds * (1 + this.stats.duration) * TICKS_PER_SECOND);
        this.buffs = this.buffs.filter((b) => b.itemId !== itemId);
        this.buffs.push({
            itemId,
            stats,
            cures,
            startTick: this.tick,
            endTick: this.tick + ticks,
        });
        this.updateStats();
    }

    // What an endless round multiplies enemies' hitpoints and damage by (1 in
    // the first round, and outside endless runs)
    get roundHp(): number {
        return roundScale(ROUND_HP, this.round);
    }

    get roundDamage(): number {
        return roundScale(ROUND_DAMAGE, this.round);
    }

    // What coins found in the run are worth: less in endless runs, and less
    // again in their later rounds (see endless.ts), and more on hard mode
    get coinScale(): number {
        return (this.endless ? endlessCoinScale(this.round) : 1) * (this.hard ? HARD_COINS : 1);
    }

    // Coins for high alching an item, as the run pays them
    alchValue(itemId: string, upgrades = 0): number {
        return Math.round(
            getAlchValue(getItem(itemId), this.stats.greed, upgrades) * this.coinScale,
        );
    }

    // Healing keeps up with how hard enemies hit
    private get healScale(): number {
        return this.roundDamage;
    }

    // An antidote is keeping poison and drains off
    get cured(): boolean {
        return this.buffs.some((b) => b.cures);
    }

    // The item shown in the player's hand: the current tier of their rarest
    // weapon that has one (the first of them on a tie), so a Twisted bow
    // found later is wielded over the starting knives.
    getHeldObjId(): number {
        const weapon = this.getHeldWeapon();
        return weapon ? (this.getLevel(weapon).objId ?? -1) : -1;
    }

    // The weapon that's in the player's hand (getHeldObjId)
    getHeldWeapon(): WeaponState | undefined {
        let held: WeaponState | undefined;
        let heldRarity = -1;
        for (const weapon of this.weapons) {
            const rarity = RARITY_ORDER.indexOf(weapon.def.rarity);
            if (this.getLevel(weapon).objId !== undefined && rarity > heldRarity) {
                held = weapon;
                heldRarity = rarity;
            }
        }
        return held;
    }

    // ---- Tick ----

    // A tick of the run. On your own, with what's pressed; co-op sets each
    // hero's input (setInput) and leaves these out.
    step(moveX?: number, moveY?: number): void {
        if (moveX !== undefined && moveY !== undefined) {
            this.setInput(this.focus, moveX, moveY);
        }
        // Each part of the tick works on its own heroes. Until one does, the
        // first, so every co-op player's copy starts from the same one.
        this.use(this.heroes[0]);
        this.stepRun();
        this.use(this.heroes[this.focus]);
    }

    // What a hero is pressing, from the next tick on
    setInput(heroIndex: number, moveX: number, moveY: number): void {
        const hero = this.heroes[heroIndex];
        if (hero) {
            hero.moveX = moveX;
            hero.moveY = moveY;
        }
    }

    // Co-op: a player has left the game. Their hero's gone from the run, and
    // anything that was waiting on them goes on without them.
    leave(heroIndex: number): void {
        const hero = this.heroes[heroIndex];
        if (!hero || hero.left) {
            return;
        }
        hero.left = true;
        if (hero.outTick < 0) {
            hero.outTick = this.tick;
        }
        hero.pendingLevelUps = 0;
        hero.choices = [];
        hero.chests = [];
        this.raidShopQueue = this.raidShopQueue.filter((index) => index !== heroIndex);
        const theirTurn = this.offer?.hero === heroIndex;
        if (theirTurn) {
            this.offer = undefined;
        }
        this.as(heroIndex, () => this.emit({ type: "heroLeft" }));
        if (this.runOver) {
            return;
        }
        this.rescaleParty();
        if (!this.heroes.some((other) => this.isUp(other))) {
            this.endedByLeaving = true;
            this.endRun("dead");
        } else if (theirTurn && this.raidShopQueue.length > 0) {
            // The supply chest goes on to whoever's next
            this.openNextRaidShop();
        } else if (this.state !== "playing") {
            this.settle();
            if ((this.state as SimState) === "playing") {
                this.as(this.focus, () => this.checkLevelUp());
            } else {
                // A level up that was waiting behind what's gone with them
                this.as(this.focus, () => this.rollMissingChoices());
            }
        }
    }

    private stepRun(): void {
        if (this.runOver) {
            // Keep the clock going so death animations play out
            this.tick++;
            return;
        }
        if (this.state !== "playing") {
            return;
        }
        this.tick++;
        // The Wardens' fight is on the clock, though it's no path
        if (this.map.tombs && this.tombsPath === undefined && !this.tombsWardens) {
            this.nexusTicks++;
        }
        // The final boss has fallen (BossDef.fallSeconds): its death plays out,
        // and then the run's won, from when it fell
        if (this.victoryAt >= 0 && this.tick >= this.victoryAt) {
            this.endRun("victory", this.fellTick);
            return;
        }
        for (const hero of this.heroes) {
            hero.recentDamage[this.tick % DPS_WINDOW_TICKS] = 0;
            if (!hero.left) {
                this.use(hero);
                this.stepBuffs();
            }
        }
        this.stepPowerUps();
        for (const hero of this.heroes) {
            if (this.isUp(hero)) {
                this.use(hero);
                this.stepPlayer(hero.moveX, hero.moveY);
            }
        }
        if (this.runOver) {
            // Poison finished them
            return;
        }
        if (this.heroes.length > 1) {
            this.stepRevives();
        }
        this.stepHeldAbilities();
        // Each hero's on a tick of its own, so a party's don't all come at once
        for (const hero of this.heroes) {
            if ((this.tick + hero.index * 2) % FLOW_FIELD_INTERVAL === 0 && this.isUp(hero)) {
                this.use(hero);
                this.updateFlowField();
            }
        }
        // A fun map's round turns over every fifteen minutes of waves (there's
        // no final boss to kill for it)
        if (this.map.fun && this.mapSeconds >= RUN_LENGTH) {
            this.nextRound();
        }
        this.stepRaid();
        this.stepTombs();
        this.stepWardens();
        this.stepApmeken();
        this.stepIntro();
        this.stepDirector();
        this.stepChat();
        this.rebuildEnemyHash();
        this.stepEnemies();
        this.stepGlyphs();
        if (this.lighting) {
            this.stepLights();
        }
        for (const hero of this.heroes) {
            // On your own, weapons still fire in the tick the player falls in
            if (this.isUp(hero) || this.heroes.length === 1) {
                this.use(hero);
                this.stepWeapons();
            }
        }
        this.stepPendingHits();
        this.stepTurrets();
        this.stepThralls();
        this.stepRocks();
        this.stepRampages();
        this.stepRings();
        this.stepProjectiles();
        this.stepFires();
        this.stepPools();
        this.stepTethers();
        this.stepEnemyProjectiles();
        this.stepBossFight();
        this.stepFloor();
        this.stepPickups();
        this.stepRandomEvents();
        this.cleanUp();
        this.checkLevelUp();
    }

    private stepBuffs(): void {
        const tick = this.tick;
        if (
            this.buffs.some((b) => b.endTick <= tick) ||
            this.debuffs.some((d) => d.endTick <= tick)
        ) {
            this.buffs = this.buffs.filter((b) => b.endTick > tick);
            this.debuffs = this.debuffs.filter((d) => d.endTick > tick);
            this.updateStats();
        }
    }

    private stepPowerUps(): void {
        const tick = this.tick;
        for (const active of this.powerUps) {
            if (active.endTick <= tick) {
                this.useHeroAt(active.hero);
                this.emit({ type: "powerUpEnded", id: active.id });
            }
        }
        this.powerUps = this.powerUps.filter((p) => p.endTick > tick);
    }

    private stepPlayer(moveX: number, moveY: number): void {
        const player = this.player;
        player.prevX = player.x;
        player.prevY = player.y;
        const frozen = player.frozen > 0;
        if (frozen) {
            player.frozen--;
        }
        // Dragged across to a boss (BossAttackDef.onHit), and frozen as it goes
        const drag = this.hero.drag;
        if (drag && this.tick < drag.endTick) {
            const t = (this.tick + 1 - drag.startTick) / Math.max(1, drag.endTick - drag.startTick);
            player.x = drag.fromX + (drag.toX - drag.fromX) * t;
            player.y = drag.fromY + (drag.toY - drag.fromY) * t;
        } else if (drag && this.tick >= drag.holdEnd) {
            this.hero.drag = undefined;
        }
        // Watching a boss rise: rooted like a hold, and turning like one
        const held = !!this.hold || this.introHolds;
        const moving = movePlayer(this.grid, player, moveX, moveY, {
            radius: player.radius,
            baseSpeed: PLAYER_SPEED,
            moveSpeed: this.stats.moveSpeed,
            tick: this.tick,
            sledEndTick: this.sledEndTick,
            sledSpeed: this.sledSpeed,
            frozen: frozen || this.introHolds,
            held,
            curse: this.curse,
            arena: this.confinedToArena ? this.bossArena : undefined,
            faces: this.introFacing,
            floor: this.floor?.hasEffects && !frozen ? this.floorMovement() : undefined,
        });
        if (this.floor?.hasEffects) {
            this.hero.glideX = player.x - player.prevX;
            this.hero.glideY = player.y - player.prevY;
        }
        // Where they stood, for a trail of marks (GroundPatternDef spots "trail")
        const slot = (this.tick % TRAIL_TICKS) * 3;
        const trail = this.hero.trail;
        trail[slot] = player.x;
        trail[slot + 1] = player.y;
        trail[slot + 2] = this.tick;
        if (moving !== player.moving) {
            player.moving = moving;
            player.moveStart = this.tick;
        }
        if (player.invulnerable > 0) {
            player.invulnerable--;
        }
        // Held above what a hit gives, or boss hits and poison get through as
        // it runs down (see reviving), and below the > 30 that makes them blink
        if (this.tick < this.sledEndTick || this.intro) {
            player.invulnerable = Math.max(player.invulnerable, HIT_INVULNERABLE_TICKS + 1);
        }
        // Just revived by a teammate: nothing gets through, and they blink
        if (this.isImmune(this.hero)) {
            player.invulnerable = Math.max(player.invulnerable, IMMUNE_INVULNERABLE_TICKS);
        }
        if (player.flash > 0) {
            player.flash--;
        }
        if (this.stats.regen > 0 && player.hp < player.maxHp && !this.invoked("dehydration")) {
            // Regen is hitpoints a minute
            this.regenAccumulator += this.stats.regen / (60 * TICKS_PER_SECOND);
            if (this.regenAccumulator >= 1) {
                const amount = Math.floor(this.regenAccumulator);
                this.regenAccumulator -= amount;
                this.heal(amount);
            }
        }
        this.stepPoison();
    }

    // Poison hits once a second until it wears off; armour doesn't help
    private stepPoison(): void {
        const player = this.player;
        if (player.poisonEnd === -1) {
            return;
        }
        // God mode (dev) keeps poison off too, as it keeps hits off
        if (
            (player.poisonEnd - this.tick) % TICKS_PER_SECOND === 0 &&
            !this.reviving &&
            !this.devGod
        ) {
            const amount = player.poisonDamage;
            player.hp -= amount;
            this.damageTaken += Math.min(amount, Math.max(0, player.hp + amount));
            this.emit({ type: "playerPoisoned", amount });
            if (player.hp <= 0) {
                this.playerDied();
            }
        }
        if (this.tick >= player.poisonEnd) {
            player.poisonEnd = -1;
            player.poisonDamage = 0;
        }
    }

    // Just brought back by a ring of life, or on a sled, so nothing can hurt them
    private get reviving(): boolean {
        return this.player.invulnerable > HIT_INVULNERABLE_TICKS;
    }

    // ---- Spawning ----

    // A raid's room has its own waves and events, timed from when its waves started
    private get raidRoomDef(): RaidRoomDef | undefined {
        return this.map.raid?.rooms[this.raidRoom];
    }

    // Seconds of waves a raid's room has before its boss: the gap between its `at` and the last
    // room's, timed on the room's own clock, so how long a boss took, or a portal, never changes it
    private raidWaveLength(index: number): number {
        const raid = this.map.raid!;
        const testRoom = this.testing?.raidRoomSeconds;
        if (testRoom) {
            return testRoom;
        }
        const length = raid.rooms[index].at - (raid.rooms[index - 1]?.at ?? 0);
        return Math.max(length, raid.minWaveSeconds ?? RAID_MIN_WAVE_SECONDS);
    }

    private get directorSeconds(): number {
        return this.map.raid
            ? (this.tick - this.raidRoomStartTick) / TICKS_PER_SECOND
            : this.mapSeconds;
    }

    // A casket's tier goes by the run's time, or a raid's pace (paceSeconds)
    private get casketSeconds(): number {
        return this.raidRoomDef ? this.paceSeconds : this.seconds;
    }

    // What enemies' hitpoints and damage, and caskets, go by: the run's clock, or in a raid where
    // its room would be with no boss time before it, so a long fight with an earlier boss doesn't
    // make a later room's waves tougher than its `at` says
    private get paceSeconds(): number {
        const room = this.raidRoomDef;
        if (!room) {
            return this.mapSeconds;
        }
        return room.at - this.raidWaveLength(this.raidRoom) + this.directorSeconds;
    }

    private currentWave() {
        const seconds = this.directorSeconds;
        const waves = this.activeWaves;
        let wave = waves[0];
        for (const w of waves) {
            if (w.start <= seconds) {
                wave = w;
            }
        }
        return wave;
    }

    private stepDirector(): void {
        if (this.aloneWith?.dead) {
            this.aloneWith = undefined;
        }
        // Nothing else comes while a boss makes its entrance, or fights alone, or in a raid's
        // boss room
        if (this.intro || this.aloneWith || (this.map.raid && this.raidStage !== "waves")) {
            return;
        }
        const seconds = this.directorSeconds;
        const events = this.raidRoomDef?.events ?? this.mapEvents;
        while (this.eventIndex < events.length && events[this.eventIndex].at <= seconds) {
            const event = events[this.eventIndex];
            this.useSpawnHero();
            if (event.kind === "elite") {
                for (let i = 0; i < (this.hard ? HARD_ELITES : 1); i++) {
                    this.spawnEnemy(getEnemy(event.enemyId), "elite");
                }
            } else if (event.kind === "ring") {
                this.spawnRing(getEnemy(event.enemyId), event.count);
            } else if (getEnemy(event.enemyId).boss?.intro) {
                this.startIntro(getEnemy(event.enemyId), event.kind, event.hp);
                this.eventIndex++;
                return;
            } else if (
                !this.bringOnBoss(getEnemy(event.enemyId), event.kind, event.hp, event.inArena)
            ) {
                // Nowhere to put it this tick; bosses can't be skipped
                break;
            }
            this.eventIndex++;
        }

        const fun = this.map.fun;
        if (fun?.bosses.together && this.seconds >= this.nextFunBossSeconds) {
            // All at once, each on its own spot; the next lot is due once
            // they're all dead
            this.useSpawnHero();
            this.funBossGroup = fun.bosses.pool.flatMap((id) =>
                this.spawnBosses(getEnemy(id), "boss", undefined),
            );
            if (this.funBossGroup.length > 0) {
                this.nextFunBossSeconds = Infinity;
            }
        } else if (fun && this.seconds >= this.nextFunBossSeconds) {
            const pool = fun.bosses.pool;
            const choices = pool.length > 1 ? pool.filter((id) => id !== this.lastFunBoss) : pool;
            const id = choices[this.rng.int(choices.length)];
            this.useSpawnHero();
            if (this.spawnBosses(getEnemy(id), "boss", undefined).length > 0) {
                this.lastFunBoss = id;
                this.nextFunBossSeconds = this.seconds + this.rng.range(...fun.bosses.every);
            }
        }

        // A map that's one boss fight has no waves (nor the Tombs' Nexus)
        if (this.activeWaves.length === 0) {
            return;
        }
        const wave = this.currentWave();
        // Endless runs' later rounds bring bigger crowds, and so do hard mode
        // and co-op's players
        const soloCrowd = roundCrowd(this.round) * (this.hard ? HARD_CROWD : 1);
        const crowd = soloCrowd * this.partyScale.crowd;
        const alive = this.countAlive();
        const maxAlive = Math.min(Math.round(wave.maxAlive * crowd), MAX_ENEMIES);
        if (this.heroes.length > 1) {
            const alone = Math.min(wave.maxAlive * soloCrowd, MAX_ENEMIES);
            const bigger = Math.min(wave.maxAlive * crowd, MAX_ENEMIES) / alone;
            this.partyXp = (this.partyScale.crowd * this.partyScale.xp) / bigger;
        }
        const minAlive = Math.min(Math.round(wave.minAlive * crowd), maxAlive);
        let toSpawn = 0;
        if (alive < minAlive) {
            toSpawn = Math.min(minAlive - alive, 8);
        }
        this.spawnAccumulator += (wave.spawnRate * crowd) / TICKS_PER_SECOND;
        while (this.spawnAccumulator >= 1) {
            this.spawnAccumulator--;
            toSpawn++;
        }
        const weights = wave.enemies.map((e) => e.weight);
        for (let i = 0; i < toSpawn && alive + i < maxAlive; i++) {
            this.useSpawnHero();
            const pick = wave.enemies[this.rng.weightedIndex(weights)];
            this.spawnEnemy(getEnemy(pick.id), "normal");
        }
    }

    // Fun maps' chat: now and then an enemy near the player says one of its
    // lines (one at a time, so it can be read), and the player answers back
    private stepChat(): void {
        const fun = this.map.fun;
        if (!fun) {
            return;
        }
        if (fun.chatEvery !== undefined && this.tick >= this.nextChatTick) {
            this.nextChatTick =
                this.tick + Math.round(fun.chatEvery * this.rng.range(0.6, 1.4) * TICKS_PER_SECOND);
            this.useSpawnHero();
            const player = this.player;
            let speaker: Enemy | undefined;
            let seen = 0;
            for (const enemy of this.enemies) {
                if (
                    enemy.dead ||
                    !enemy.def.chat ||
                    fm.hypot(enemy.x - player.x, enemy.y - player.y) > CHAT_RANGE
                ) {
                    continue;
                }
                // Any one of them, as likely as the next
                seen++;
                if (this.rng.int(seen) === 0) {
                    speaker = enemy;
                }
            }
            const lines = speaker?.def.chat;
            if (speaker && lines) {
                const text = lines[this.rng.int(lines.length)];
                this.emit({ type: "bossShout", enemyUid: speaker.uid, text });
            }
        }
        if (fun.playerChat && this.seconds >= this.nextPlayerChatSeconds && !this.runOver) {
            const lines = fun.playerChat.lines;
            this.emit({ type: "playerShout", text: lines[this.rng.int(lines.length)] });
            this.nextPlayerChatSeconds = this.seconds + this.rng.range(...fun.playerChat.every);
        }
    }

    private countAlive(): number {
        let alive = 0;
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                alive++;
            }
        }
        return alive;
    }

    // avoid: spots already taken, that this one keeps clear of (a boss's other
    // copies)
    private findSpawnPoint(
        def: EnemyDef,
        minDistance: number,
        maxDistance: number,
        angle?: number,
        avoid?: { x: number; y: number }[],
        inside?: (x: number, y: number) => boolean,
    ) {
        const player = this.player;
        for (let attempt = 0; attempt < 16; attempt++) {
            const a =
                angle !== undefined && attempt < 4
                    ? angle + this.rng.range(-0.6, 0.6)
                    : this.rng.range(0, Math.PI * 2);
            const distance = this.rng.range(minDistance, maxDistance);
            const x = Math.floor(player.x + fm.cos(a) * distance) + 0.5;
            const y = Math.floor(player.y + fm.sin(a) * distance) + 0.5;
            if (
                (!inside || inside(x, y)) &&
                this.canTurnUpAt(def, x, y) &&
                !this.besideATeammate(x, y, minDistance) &&
                !avoid?.some((taken) => fm.hypot(taken.x - x, taken.y - y) < BOSS_COPY_GAP)
            ) {
                return { x, y };
            }
        }
        return undefined;
    }

    // Co-op: whether a spot's closer than this to a player still up
    private besideATeammate(x: number, y: number, distance: number): boolean {
        return (
            this.heroes.length > 1 &&
            this.heroes.some(
                (hero) =>
                    this.isUp(hero) && fm.hypot(hero.player.x - x, hero.player.y - y) < distance,
            )
        );
    }

    // Whether an enemy can turn up here: only where the player could stand and
    // get to from where they are, or it's stuck behind a wall. Ghosts too, so
    // nothing rises out of a mountain. The flow field goes over a ditch
    // (MapDef.ditch), so either side of one will do: enemies jump it.
    private canTurnUpAt(def: EnemyDef, x: number, y: number): boolean {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        return (
            this.grid.contains(tileX, tileY) &&
            this.isWalkableTile(tileX, tileY) &&
            isCircleFree(this.grid, x, y, Math.max(def.radius, PLAYER_RADIUS))
        );
    }

    // Where a boss encounter's copies turn up, all reserved before any of them
    // spawns, so that nowhere to put one retries the lot next tick rather than
    // leaving a partial group behind. Each comes by a different player who's
    // still up (the spawn hero's first), clear of the others. A boss with its
    // own spots (spots, EnemyDef.spawnAt) takes a different one for each copy,
    // and only as many as are free: Pest Control's portals have one each
    private bossSpawnPoints(
        def: EnemyDef,
        copies: number,
        minDistance: number,
        maxDistance: number,
        spots: { x: number; y: number }[] | undefined,
        inside?: (x: number, y: number) => boolean,
    ): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        if (spots) {
            const free = this.freeSpawnSpots(def, spots);
            for (let i = 0; i < copies && free.length > 0; i++) {
                points.push(...free.splice(this.rng.int(free.length), 1));
            }
            return points;
        }
        const spawnHero = this.hero;
        const by = this.heroes.filter((hero) => this.isUp(hero));
        const first = Math.max(0, by.indexOf(spawnHero));
        for (let i = 0; i < copies; i++) {
            if (by.length > 0) {
                this.use(by[(first + i) % by.length]);
            }
            const point = this.findSpawnPoint(
                def,
                minDistance,
                maxDistance,
                undefined,
                points,
                inside,
            );
            if (!point) {
                points.length = 0;
                break;
            }
            points.push(point);
        }
        this.use(spawnHero);
        return points;
    }

    // A boss encounter: the boss, or in co-op its copies (content/coop.ts
    // bossCopies), with one boss's hitpoints and experience shared between
    // them and its loot with the last to fall. The first of them says so.
    // Scripted entrances (The Nightmare's) go through spawnBoss, one boss.
    private spawnBosses(
        def: EnemyDef,
        type: "boss" | "finalBoss",
        hp: number | undefined,
        inArena = false,
    ): Enemy[] {
        // In the map's boss square, nearer the player (RunEventDef inArena)
        const square = inArena ? this.map.bossArena : undefined;
        const points = this.bossSpawnPoints(
            def,
            bossCopies(this.heroes.length, this.hard),
            square ? ARENA_SPAWN_MIN_DISTANCE : BOSS_SPAWN_MIN_DISTANCE,
            square ? ARENA_SPAWN_MAX_DISTANCE : BOSS_SPAWN_MAX_DISTANCE,
            def.spawnAt,
            square &&
                ((x, y) =>
                    x > square.baseX + 1 &&
                    x < square.baseX + square.size - 1 &&
                    y > square.baseY + 1 &&
                    y < square.baseY + square.size - 1),
        );
        const encounter = this.newEncounter(points.length);
        return points.map((at, i) => this.spawnBoss(def, type, hp, at, encounter, i > 0)!);
    }

    // What a boss's copies share; undefined for a boss on its own, which
    // plays exactly as it did before co-op
    private newEncounter(copies: number): Encounter | undefined {
        return copies > 1 ? { id: this.nextEncounter++, copies } : undefined;
    }

    // Co-op: whether another of a boss's copies is still to be beaten, one of
    // their caskets still to open too
    private encounterLeft(enemy: Enemy): boolean {
        const id = enemy.encounter;
        return (
            id !== undefined &&
            (this.enemies.some(
                (other) => other !== enemy && other.encounter === id && !other.dead,
            ) ||
                this.pickups.some(
                    (pickup) => pickup.value !== -1 && pickup.disguise?.encounter?.id === id,
                ))
        );
    }

    // quiet: one of an encounter's copies after the first, which said so
    private spawnBoss(
        def: EnemyDef,
        type: "boss" | "finalBoss",
        hp: number | undefined,
        at?: { x: number; y: number },
        encounter?: Encounter,
        quiet = false,
    ): Enemy | undefined {
        const boss = this.spawnEnemy(def, type, at, hp, encounter);
        if (boss) {
            const finalBoss = type === "finalBoss";
            if (finalBoss) {
                this.bossSpawned = true;
            }
            if (def.spawnSpotAnim !== undefined) {
                this.addEffect(def.spawnSpotAnim, boss.x, boss.y, 0, 60);
            }
            if (!quiet) {
                if (encounter) {
                    encounter.announced = true;
                }
                this.emit({
                    type: "bossSpawned",
                    enemyId: def.id,
                    name: def.name,
                    message: def.spawnMessage ?? `${def.name} has appeared!`,
                    finalBoss,
                    x: boss.x,
                    y: boss.y,
                });
            }
        }
        return boss;
    }

    // bossHp: a boss's hitpoints when they're not its own times the map's.
    // encounter: co-op, one of a boss's copies, with its share of the
    // hitpoints and experience
    spawnEnemy(
        def: EnemyDef,
        type: "normal" | "elite" | "boss" | "finalBoss",
        at?: { x: number; y: number },
        bossHp?: number,
        encounter?: Encounter,
    ): Enemy | undefined {
        // Expert mode's own version of it (EnemyDef.expertAs)
        if (this.expert && def.expertAs) {
            def = getEnemy(def.expertAs);
        }
        const boss = type === "boss" || type === "finalBoss";
        let pos = at;
        if (!pos && def.spawnAt) {
            pos = this.pickSpawnSpot(def);
        } else if (!pos && this.tombsPath !== undefined && !boss) {
            // A Tombs room's: out of one of its holes in the walls (the Apmeken room's baboons
            // crawl in that way), or with none, closer than the usual ring off the screen, as a
            // room's too small for it
            const entrances = this.map.tombs?.paths.find((p) => p.id === this.tombsPath)?.room
                ?.entrances;
            if (entrances && entrances.length > 0) {
                const at = entrances[this.rng.int(entrances.length)];
                pos = this.walkableSpot(
                    at.x + this.rng.range(-0.4, 0.4),
                    at.y + this.rng.range(-0.4, 0.4),
                );
            } else {
                pos = this.findSpawnPoint(def, TOMBS_SPAWN_MIN_DISTANCE, TOMBS_SPAWN_MAX_DISTANCE);
            }
        } else if (!pos) {
            pos = boss
                ? this.findSpawnPoint(def, BOSS_SPAWN_MIN_DISTANCE, BOSS_SPAWN_MAX_DISTANCE)
                : this.findSpawnPoint(
                      def,
                      SPAWN_MIN_DISTANCE,
                      SPAWN_MAX_DISTANCE,
                      def.faction !== undefined ? this.factionAngle(def.faction) : undefined,
                  );
        }
        if (!pos) {
            return undefined;
        }
        // Enemies start hitting harder after 5 minutes (of the round)
        const minutes = this.paceSeconds / 60;
        const hpScale = this.enemyHpScale();
        const damageScale = 1 + Math.max(0, minutes - 5) * 0.03;
        // Bosses are tuned as they are (or for the map they're on); later maps
        // are tougher all round, and so are endless runs' later rounds and hard
        // mode
        const difficulty = this.map.difficulty;
        const bossDamage = difficulty.damage * this.roundDamage * this.hardScale.damage;
        let hp =
            (boss ? (bossHp ?? def.hp * difficulty.hp) : def.hp * hpScale * difficulty.hp) *
            this.roundHp *
            (boss ? this.hardScale.bossHp : this.hardScale.hp) *
            (boss ? this.partyScale.bossHp : this.partyScale.hp);
        // What its hits are multiplied by: its touch, a boss's attacks, its
        // explosion (and in co-op, harder for each player)
        let hitScale = bossDamage * (boss ? 1 : damageScale) * this.partyScale.damage;
        let scale = def.scale ?? 1;
        let tint = 0xffffff;
        let xp =
            def.xp * roundScale(ROUND_XP, this.round) * this.partyXp * (this.hard ? HARD_XP : 1);
        if (type === "elite") {
            hp *= 8;
            hitScale *= 1.25;
            scale *= 1.6;
            tint = ELITE_TINT;
            xp *= 5;
        }
        if (encounter) {
            hp /= encounter.copies;
            xp /= encounter.copies;
        }
        // A Tombs room's: tougher with each of its waves, and with its path level. Tried again,
        // the waves already beaten give no experience.
        if (this.tombsRoom && !boss) {
            const room = this.tombsRoomScale();
            hp *= room.hp;
            hitScale *= room.damage;
            if (this.tombsReplaying) {
                xp = 0;
            }
        }
        // A Tombs path's boss: tougher with its path level, for a party that's been round more
        // of the raid first (TOMBS_BOSSES)
        if (this.tombsRoom && boss) {
            const level = this.tombsPathWeight;
            hp *= 1 + TOMBS_BOSSES.levelHp * level;
            hitScale *= 1 + TOMBS_BOSSES.levelDamage * level;
        }
        if (boss) {
            hp *= this.raidEase(def)?.hp ?? 1;
            hitScale *= this.raidEase(def)?.damage ?? 1;
        }
        const enemy: Enemy = {
            uid: this.nextUid++,
            def,
            variant: def.outfits ? this.rng.int(def.outfits.length) : 0,
            x: pos.x,
            y: pos.y,
            prevX: pos.x,
            prevY: pos.y,
            vx: 0,
            vy: 0,
            // A scale under one (the Tombs' at Entry) never leaves a 1-hitpoint thing with none
            hp: Math.max(1, Math.round(hp)),
            maxHp: Math.max(1, Math.round(hp)),
            damage: Math.round(def.damage * hitScale),
            speed: (def.speed * (type === "elite" ? 0.85 : 1)) / TICKS_PER_SECOND,
            radius: def.radius,
            scale,
            tint,
            elite: type === "elite",
            boss,
            finalBoss: type === "finalBoss",
            bossState:
                boss && def.boss
                    ? {
                          cooldowns: def.boss.attacks.map(() => 0),
                          stolenCoins: 0,
                          rises: 0,
                          enraged: false,
                          summonsDone: 0,
                          channelEnd: 0,
                      }
                    : undefined,
            damageScale: hitScale,
            yaw: 0,
            anim: "walk",
            animStart: this.tick,
            attackSeq: def.attackSeq,
            // Bosses take a moment before their first attack
            attackCooldown: boss ? TICKS_PER_SECOND : 0,
            // Turning up while time stands still
            frozen: boss ? 0 : Math.max(0, this.freezeEndTick - this.tick),
            drain: 0,
            drainEnd: 0,
            venom: 0,
            venomNext: 0,
            venomEnd: -1,
            flash: 0,
            dead: false,
            deathTick: 0,
            deathSeq: 0,
            xp,
            shieldEnd: 0,
            risingEnd: 0,
            blockedTick: -BLOCKED_SPLAT_TICKS,
            spawnedBy: 0,
            nextFoeLook: this.tick + (this.nextUid % FOE_LOOK_TICKS),
            foeWait: 0,
            aggro: false,
            ...(encounter && { encounter: encounter.id }),
            noDrops: false,
            bonesOnly: false,
            hatchTick: def.hatches ? this.tick + secondsToTicks(def.hatches.seconds) : 0,
            abilities: getAbilities(def, this.tick, this.rng),
        };
        this.enemies.push(enemy);
        // Lit or not until the next tick's lights (stepLights); one carrying a light is in it
        if (this.litTargetsOnly) {
            enemy.lit = def.light !== undefined || this.isLit(enemy.x, enemy.y);
        }
        if (def.shield) {
            const ticks = Math.round(def.shield.seconds * TICKS_PER_SECOND);
            enemy.shieldEnd = this.tick + ticks;
            if (def.shield.spotAnim !== undefined) {
                this.addEffect(def.shield.spotAnim, enemy.x, enemy.y, 0, ticks, enemy.uid, true);
            }
        }
        const glyph = boss ? def.boss?.glyph : undefined;
        if (glyph) {
            this.addGlyph(enemy, getEnemy(glyph.lookId));
        }
        if (boss && def.boss?.phases) {
            this.startPhases(enemy, def.boss.phases);
        }
        return enemy;
    }

    // The way a faction's army comes from, around the player: so the armies
    // meet (and fight) around them rather than arriving mixed together
    private factionAngle(faction: string): number {
        if (this.factionBaseAngle === undefined) {
            this.factionBaseAngle = this.rng.range(0, Math.PI * 2);
        }
        let index = this.factions.indexOf(faction);
        if (index === -1) {
            index = this.factions.push(faction) - 1;
        }
        return this.factionBaseAngle + index * FACTION_SPREAD + this.mapSeconds * FACTION_TURN;
    }

    // One of the spots an enemy turns up at (EnemyDef.spawnAt) with room for
    // it, undefined if none has
    private pickSpawnSpot(def: EnemyDef): { x: number; y: number } | undefined {
        const free = this.freeSpawnSpots(def, def.spawnAt!);
        return free.length > 0 ? free[this.rng.int(free.length)] : undefined;
    }

    // Which of an enemy's own spots (EnemyDef.spawnAt) it could turn up on now
    private freeSpawnSpots(
        def: EnemyDef,
        spots: { x: number; y: number }[],
    ): { x: number; y: number }[] {
        return spots.filter(({ x, y }) =>
            // What never moves can stand on its own spot, solid or not (a
            // portal's is in the map's collision)
            def.stationary
                ? this.grid.contains(Math.floor(x), Math.floor(y))
                : this.canTurnUpAt(def, x, y),
        );
    }

    // Enemies get tougher faster as the run (or round) goes on: gently for the
    // first few minutes, then 1.9x hitpoints at 10 minutes and 2.65x at 15
    private enemyHpScale(): number {
        const minutes = this.paceSeconds / 60;
        return 1 + minutes * 0.05 + minutes * minutes * 0.004;
    }

    private spawnRing(def: EnemyDef, count: number): void {
        const player = this.player;
        const radius = 12;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = player.x + fm.cos(angle) * radius;
            const y = player.y + fm.sin(angle) * radius;
            if (this.canTurnUpAt(def, x, y)) {
                this.spawnEnemy(def, "normal", { x, y });
            }
        }
    }

    // ---- Enemies ----

    private rebuildEnemyHash(): void {
        this.enemyHash.clear();
        this.bigEnemies.length = 0;
        this.bigEnemyAt.length = 0;
        for (const enemy of this.enemies) {
            if (!enemy.dead && !enemy.leaving && !enemy.def.unhittable) {
                this.enemyHash.insert(enemy);
                if (enemy.radius > 1) {
                    this.bigEnemies.push(enemy);
                    this.bigEnemyAt.push(enemy.x, enemy.y);
                }
            }
        }
    }

    // What an attack around (x, y) that counts an enemy's own radius (a swing, an aura, a
    // projectile) has to look at: the hash's cells out to `search`, then each big enemy in a cell
    // those missed, whose edge can be in range while its middle is further off. Callers check the
    // exact distance, as with the hash's own query; nothing changes on a map with no big enemy.
    private queryTouching(
        x: number,
        y: number,
        search: number,
        callback: (enemy: Enemy) => void,
    ): void {
        this.enemyHash.query(x, y, search, callback);
        const big = this.bigEnemies;
        const at = this.bigEnemyAt;
        for (let i = 0; i < big.length; i++) {
            // By where it went in, as the hash has it, though it may have moved since
            if (!this.enemyHash.visits(x, y, search, at[i * 2], at[i * 2 + 1])) {
                callback(big[i]);
            }
        }
    }

    private stepEnemies(): void {
        let player = this.player;
        const grid = this.grid;
        const step = this.temp;
        for (const enemy of this.enemies) {
            enemy.prevX = enemy.x;
            enemy.prevY = enemy.y;
            if (enemy.flash > 0) {
                enemy.flash--;
            }
            if (enemy.dead) {
                continue;
            }
            if (enemy.leaving) {
                this.stepLeaving(enemy, enemy.leaving);
                continue;
            }
            if (enemy.shieldEnd !== 0 && this.tick >= enemy.shieldEnd) {
                this.dropShield(enemy);
            }
            if (enemy.risingEnd !== 0) {
                if (this.tick < enemy.risingEnd) {
                    continue;
                }
                enemy.risingEnd = 0;
                enemy.vx = enemy.vy = 0;
                enemy.anim = "walk";
                enemy.animStart = this.tick;
            }
            if (enemy.walksTo) {
                this.stepWalker(enemy, enemy.walksTo);
                continue;
            }
            if (enemy.rolls) {
                this.stepRoller(enemy, enemy.rolls);
                continue;
            }
            if (enemy.seeks !== undefined) {
                this.stepSeeker(enemy, enemy.seeks);
                continue;
            }
            if (enemy.hatchTick !== 0 && this.tick >= enemy.hatchTick) {
                this.hatch(enemy);
                continue;
            }
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown--;
            }
            if (enemy.venomEnd >= this.tick && this.tick >= enemy.venomNext) {
                enemy.venomNext += TICKS_PER_SECOND;
                this.useHeroAt(enemy.venomHero);
                this.damageSource = enemy.venomSource ?? "other";
                // Expert: a weapon's venom stops once the enemy's colour is one it can't hurt
                // (Nylocas Vasilias turning)
                if (this.wrongStyle(enemy)) {
                    enemy.venomEnd = -1;
                } else {
                    this.damageEnemy(enemy, enemy.venom, 0, enemy.x, enemy.y, 1, true);
                }
                if (enemy.dead) {
                    continue;
                }
            }
            // It goes for whoever's nearest
            this.use(this.nearestHero(enemy.x, enemy.y));
            player = this.player;

            if (enemy.jump) {
                this.stepJump(enemy);
                continue;
            }
            if (enemy.flung) {
                this.stepFlung(enemy, enemy.flung);
                continue;
            }
            // Copying a boss's lunge, and nothing else till it's done (EnemyDef.echoes)
            if (enemy.echo || enemy.echoDash) {
                this.stepEcho(enemy);
                continue;
            }

            let dx = player.x - enemy.x;
            let dy = player.y - enemy.y;
            const distance = fm.hypot(dx, dy);
            const flight = enemy.def.flies ? this.getFlight() : undefined;

            // The final boss waits for the player, and what can't move stays
            // put; anything else left behind comes back
            const stationary = enemy.def.stationary ?? false;
            if (distance > RELOCATE_DISTANCE && !enemy.finalBoss && !stationary) {
                this.relocate(enemy);
                continue;
            }

            const abilities = enemy.abilities;
            if (abilities && enemy.frozen === 0 && this.stepAbilities(enemy, abilities, distance)) {
                // It blinked over to the player
                continue;
            }

            // Knockback
            let moveX = enemy.vx;
            let moveY = enemy.vy;
            enemy.vx *= 0.75;
            enemy.vy *= 0.75;

            if (enemy.frozen > 0) {
                enemy.frozen--;
            } else {
                let dirX = 0;
                let dirY = 0;
                const tileX = Math.floor(enemy.x);
                const tileY = Math.floor(enemy.y);
                const jump =
                    enemy.def.ghost || flight ? 0 : this.flowField.jumpFrom(grid, tileX, tileY);
                if (distance < 2.5 && jump !== 0 && Math.sign(dy) === Math.sign(jump)) {
                    // Close, but over the ditch
                    this.startJump(enemy, jump);
                    continue;
                } else if (
                    enemy.def.ghost ||
                    distance < 2.5 ||
                    // A clear flight straight there, and only round terrain if not
                    (flight && canWalkStraight(flight.grid, enemy.x, enemy.y, player.x, player.y))
                ) {
                    if (distance > 0.001) {
                        dirX = dx / distance;
                        dirY = dy / distance;
                    }
                } else if (
                    flight
                        ? flight.field.getStep(flight.grid, tileX, tileY, step)
                        : this.flowField.getStep(grid, tileX, tileY, step)
                ) {
                    if (Math.abs(step.y) > 1) {
                        this.startJump(enemy, step.y);
                        continue;
                    }
                    // Head for the middle of the next tile, which keeps big
                    // enemies off corners
                    const tx = tileX + step.x + 0.5 - enemy.x;
                    const ty = tileY + step.y + 0.5 - enemy.y;
                    const len = fm.hypot(tx, ty);
                    if (len > 0.001) {
                        dirX = tx / len;
                        dirY = ty / len;
                    }
                } else if (distance > 0.001) {
                    dirX = dx / distance;
                    dirY = dy / distance;
                }

                const bossState = enemy.bossState;
                if (bossState) {
                    const keep = enemy.def.boss?.keepDistance;
                    if (
                        bossState.windup ||
                        bossState.surge ||
                        bossState.walkers ||
                        bossState.leap ||
                        bossState.dash ||
                        this.isStunned(enemy) ||
                        this.isNapping(enemy) ||
                        // and hauling someone in (BossAttackDef.onHit)
                        this.heroes.some((hero) => hero.drag !== undefined)
                    ) {
                        // Stands still winding up, so a swing can be stepped away from
                        dirX = dirY = 0;
                    } else if (this.tick < bossState.channelEnd && !this.akkhaDrawn(enemy)) {
                        // And while its volleys go out, so a spiral stays a spiral
                        dirX = dirY = 0;
                    } else if (this.keepsTo(enemy)) {
                        // And among its flowers, or in its finale, where it's
                        // taken its stand
                        dirX = dirY = 0;
                    } else if (keep !== undefined && distance < keep) {
                        // Ranged bosses stop once they're in range (and stand their
                        // ground if you come at them)
                        dirX = dirY = 0;
                    }
                } else if (
                    enemy.def.shot &&
                    distance <
                        (this.expert && enemy.def.shot.expertKeep !== undefined
                            ? enemy.def.shot.expertKeep
                            : enemy.def.shot.range * SHOOTER_KEEP)
                ) {
                    // Rangers and mages hang back to shoot, and close in when
                    // they're out of reach. Some come in closer on expert
                    // (EnemyShotDef.expertKeep).
                    dirX = dirY = 0;
                }
                // Running off with the flag: away from the player when they're
                // close, standing their ground a bit further out, and only
                // coming back when they're far off
                const flees = enemy.def.flees;
                let fleeing = false;
                if (flees && !bossState?.windup) {
                    if (distance < flees.range) {
                        fleeing = this.fleeFrom(enemy, dx, dy, distance, step);
                        dirX = fleeing ? step.x : 0;
                        dirY = fleeing ? step.y : 0;
                    } else if (distance < flees.range * 2) {
                        dirX = dirY = 0;
                    }
                }
                const lapping = this.isLapping(enemy, distance);
                const healTarget = abilities?.healTarget;
                const fighting =
                    stationary || healTarget || fleeing || lapping
                        ? undefined
                        : this.findFoe(enemy, distance);
                if (fighting) {
                    // Off to fight another god's army, stopping once it's in
                    // reach (the hit itself is the touch below)
                    const fx = fighting.x - enemy.x;
                    const fy = fighting.y - enemy.y;
                    const length = fm.hypot(fx, fy);
                    const reach = enemy.radius + fighting.radius + 0.05;
                    dirX = length > reach ? fx / length : 0;
                    dirY = length > reach ? fy / length : 0;
                }
                if (stationary || (abilities && abilities.blinkLand !== -1)) {
                    // Winding up a blink, it stands still
                    dirX = dirY = 0;
                } else if (healTarget) {
                    // Off to heal something instead, stopping once it's in reach
                    const hx = healTarget.x - enemy.x;
                    const hy = healTarget.y - enemy.y;
                    const reach = enemy.def.heals!.range * 0.8 + healTarget.radius;
                    const length = fm.hypot(hx, hy);
                    dirX = dirY = 0;
                    if (length > reach) {
                        dirX = hx / length;
                        dirY = hy / length;
                    }
                }

                if (lapping) {
                    this.lapDirection(enemy, dx, dy, distance, step);
                    dirX = step.x;
                    dirY = step.y;
                }

                // Keep apart from each other, and bump into other factions
                // (bosses and elites don't get dragged into it: they'd lose
                // their caskets; nor does one after the player)
                let sepX = 0;
                let sepY = 0;
                const faction = enemy.boss || enemy.aggro ? undefined : enemy.def.faction;
                // Akkha walks through his own shadows: they never move, so one straight between him
                // and where he's going held him there for good, never drawn into a dead one's quarter
                const ownShadow = enemy.def.boss?.akkha?.shadows.enemyId;
                let foe: Enemy | undefined;
                this.enemyHash.query(enemy.x, enemy.y, 1, (other) => {
                    // A rolling boulder goes its own way, through whatever's there (Ba-Ba's cracked
                    // one starts on her altar, under her)
                    if (other === enemy || other.rolls || other.def.id === ownShadow) {
                        return;
                    }
                    const ox = enemy.x - other.x;
                    const oy = enemy.y - other.y;
                    const minDist = enemy.radius + other.radius;
                    const distSq = ox * ox + oy * oy;
                    if (
                        faction !== undefined &&
                        other.def.faction !== undefined &&
                        other.def.faction !== faction &&
                        !other.boss &&
                        !other.elite &&
                        !other.dead &&
                        distSq < (minDist + 0.1) * (minDist + 0.1)
                    ) {
                        foe = other;
                    }
                    if (distSq < minDist * minDist && distSq > 1e-6) {
                        const d = Math.sqrt(distSq);
                        const push = (minDist - d) / d;
                        sepX += ox * push;
                        sepY += oy * push;
                    }
                });

                const touching = distance < enemy.radius + player.radius + 0.1;
                if (lapping) {
                    moveX += dirX * enemy.speed * this.laps!.speed;
                    moveY += dirY * enemy.speed * this.laps!.speed;
                } else if (
                    // On its way to heal something, the player's just in the way
                    (!touching || healTarget) &&
                    !(fighting && dirX === 0 && dirY === 0)
                ) {
                    // Faster or slower on a floor's plates (FloorEffect haste, slow)
                    const pace = this.floor?.hasEffects ? this.floorPace(enemy.x, enemy.y) : 1;
                    moveX += dirX * enemy.speed * pace;
                    moveY += dirY * enemy.speed * pace;
                }
                moveX += sepX * 0.25;
                moveY += sepY * 0.25;

                const lane = bossState?.windup?.lane ?? bossState?.surge?.lane;
                if (fleeing || lapping) {
                    // Looking where it's running, not back at the player
                    enemy.yaw = yawFromVector(dirX, dirY);
                } else if (lane) {
                    // Down its lane, from the moment it's picked until the
                    // charge is done, not round at the player as it goes by
                    enemy.yaw = yawFromVector(lane.toX - lane.fromX, lane.toY - lane.fromY);
                } else if (fighting) {
                    enemy.yaw = yawFromVector(fighting.x - enemy.x, fighting.y - enemy.y);
                } else if (bossState?.dash) {
                    // Along its lunge, and stood as it was while it's stunned
                    const dash = bossState.dash;
                    enemy.yaw = yawFromVector(dash.toX - dash.fromX, dash.toY - dash.fromY);
                } else if (this.isStunned(enemy)) {
                    // As it was
                } else if ((dirX !== 0 || dirY !== 0 || bossState) && !enemy.totemOf) {
                    enemy.yaw = yawFromVector(dx, dy);
                }

                // Bosses hit with their own attacks instead
                const canHit =
                    enemy.attackCooldown === 0 && !bossState && enemy.damage > 0 && !lapping;
                if (touching && canHit) {
                    this.enemyAttack(enemy);
                } else if (foe && canHit && !enemy.boss) {
                    this.enemyHitsEnemy(enemy, foe);
                } else if (
                    enemy.def.shot &&
                    !bossState &&
                    !lapping &&
                    enemy.attackCooldown === 0 &&
                    distance <= enemy.def.shot.range &&
                    !(
                        this.floor?.hasPillars &&
                        this.floor.blocksSight(enemy.x, enemy.y, player.x, player.y)
                    )
                ) {
                    this.enemyShoot(enemy, enemy.def.shot);
                }
            }

            if (stationary) {
                moveX = moveY = 0;
                enemy.vx = enemy.vy = 0;
            }
            if (moveX !== 0 || moveY !== 0) {
                if (enemy.def.ghost) {
                    enemy.x += moveX;
                    enemy.y += moveY;
                } else {
                    moveCircle(flight?.grid ?? grid, enemy, moveX, moveY, enemy.radius);
                }
            }

            // Crowd round the player rather than standing inside them (and
            // the player can't walk into what doesn't move, or what's solid)
            const ox = enemy.x - player.x;
            const oy = enemy.y - player.y;
            const minDist = enemy.radius + player.radius;
            const distSq = ox * ox + oy * oy;
            if (distSq < minDist * minDist && distSq > 1e-6) {
                const d = Math.sqrt(distSq);
                const push = Math.min((minDist - d) / d, 0.5);
                if (stationary || enemy.def.solid) {
                    moveCircle(grid, player, -ox * push, -oy * push, player.radius);
                } else if (enemy.def.ghost) {
                    enemy.x += ox * push;
                    enemy.y += oy * push;
                } else {
                    moveCircle(flight?.grid ?? grid, enemy, ox * push, oy * push, enemy.radius);
                }
            }

            if (enemy.bossState) {
                this.stepBoss(enemy, distance);
            }

            // Back to walking once an attack has played
            if (
                enemy.anim === "attack" &&
                this.tick - enemy.animStart > 30 &&
                !enemy.bossState?.windup &&
                !enemy.bossState?.surge &&
                !enemy.bossState?.dash &&
                !enemy.bossState?.leap &&
                (enemy.abilities?.blinkLand ?? -1) === -1
            ) {
                enemy.anim = "walk";
                enemy.animStart = this.tick;
            }
        }
    }

    // The way to run from the player (dx, dy away from the enemy): straight
    // away if there's room a tile on, otherwise the nearest way round that
    // has (along a wall, or back past them out of a corner). False if it's
    // boxed in.
    private fleeFrom(
        enemy: Enemy,
        dx: number,
        dy: number,
        distance: number,
        out: { x: number; y: number },
    ): boolean {
        const awayX = distance > 0.001 ? -dx / distance : 1;
        const awayY = distance > 0.001 ? -dy / distance : 0;
        for (const turn of FLEE_TURNS) {
            const cos = fm.cos(turn);
            const sin = fm.sin(turn);
            const x = awayX * cos - awayY * sin;
            const y = awayX * sin + awayY * cos;
            const aheadX = enemy.x + x * FLEE_LOOKAHEAD;
            const aheadY = enemy.y + y * FLEE_LOOKAHEAD;
            if (
                this.grid.contains(Math.floor(aheadX), Math.floor(aheadY)) &&
                (enemy.def.ghost ||
                    isCircleFree(this.getMoveGrid(enemy.def), aheadX, aheadY, enemy.radius))
            ) {
                out.x = x;
                out.y = y;
                return true;
            }
        }
        return false;
    }

    // Over the ditch, this many tiles north or south, landing in the middle
    // of a tile if there isn't room straight across
    private startJump(enemy: Enemy, tiles: number): void {
        const toY = Math.floor(enemy.y) + tiles + 0.5;
        const toX = isCircleFree(this.grid, enemy.x, toY, enemy.radius)
            ? enemy.x
            : Math.floor(enemy.x) + 0.5;
        enemy.jump = { fromX: enemy.x, fromY: enemy.y, toX, toY, start: this.tick };
        enemy.anim = "jump";
        enemy.animStart = this.tick;
        enemy.yaw = yawFromVector(0, tiles);
    }

    private stepJump(enemy: Enemy): void {
        const jump = enemy.jump!;
        const t = this.tick - jump.start;
        const f = Math.min(Math.max((t - JUMP_LEAVE) / (JUMP_LAND - JUMP_LEAVE), 0), 1);
        enemy.x = jump.fromX + (jump.toX - jump.fromX) * f;
        enemy.y = jump.fromY + (jump.toY - jump.fromY) * f;
        if (t >= JUMP_TICKS) {
            enemy.jump = undefined;
            enemy.vx = enemy.vy = 0;
            enemy.anim = "walk";
            enemy.animStart = this.tick;
        }
    }

    // Through the air from where it was thrown to where it lands, at a steady
    // pace (the arc's the view's); on the ground again, it's in the fight
    private stepFlung(enemy: Enemy, flung: EnemyFlung): void {
        const span = Math.max(1, flung.endTick - flung.startTick);
        const f = Math.min(1, (this.tick - flung.startTick) / span);
        enemy.x = flung.fromX + (flung.toX - flung.fromX) * f;
        enemy.y = flung.fromY + (flung.toY - flung.fromY) * f;
        if (f >= 1) {
            enemy.flung = undefined;
            enemy.vx = enemy.vy = 0;
        }
    }

    // Running a Drill Demon's laps. Bosses, what can't move and flag carriers
    // carry on as they were.
    private isLapping(enemy: Enemy, distance: number): boolean {
        return (
            this.tick < this.lapsEndTick &&
            distance < this.laps!.range &&
            !enemy.boss &&
            !enemy.def.stationary &&
            !enemy.def.flees
        );
    }

    // Round the player, drifting in or out onto the ring. dx, dy: to the player.
    private lapDirection(enemy: Enemy, dx: number, dy: number, distance: number, out: Vec2): void {
        if (distance < 0.01) {
            // Right on top of the player: any way out will do
            out.x = 1;
            out.y = 0;
            return;
        }
        const length = distance;
        const toward = Math.max(-1, Math.min(1, (distance - this.laps!.radius) / LAP_PULL_TILES));
        const x = -dy / length + (dx / length) * toward;
        const y = dx / length + (dy / length) * toward;
        const size = fm.hypot(x, y);
        out.x = x / size;
        out.y = y / size;
    }

    // Ahead of the player if they're moving, so they keep running into things,
    // or behind them
    private relocate(enemy: Enemy, behind = false): void {
        const player = this.player;
        const side = behind ? -1 : 1;
        const angle = player.moving
            ? fm.atan2(player.facingY * side, player.facingX * side)
            : undefined;
        const pos = this.findSpawnPoint(enemy.def, SPAWN_MIN_DISTANCE, SPAWN_MAX_DISTANCE, angle);
        if (pos) {
            enemy.x = enemy.prevX = pos.x;
            enemy.y = enemy.prevY = pos.y;
            enemy.vx = enemy.vy = 0;
            if (enemy.bossState) {
                enemy.bossState.windup = undefined;
            }
        }
    }

    private enemyAttack(enemy: Enemy): void {
        enemy.attackCooldown = ENEMY_ATTACK_COOLDOWN;
        enemy.anim = "attack";
        enemy.animStart = this.tick;
        if (enemy.def.holds !== undefined) {
            this.holdPlayer(enemy, enemy.def.holds);
        }
        if (this.player.invulnerable > 0) {
            return;
        }
        this.damagePlayer(enemy.damage, enemy.def.id, enemy.elite);
        if (enemy.def.touches) {
            this.applyPlayerEffect(enemy.def.touches, enemy);
        }
        this.recoil(enemy);
    }

    // Held where they stand by what's reached them (EnemyDef.holds), for
    // seconds or until it's dead; one more joins a hold that's on
    private holdPlayer(enemy: Enemy, seconds: number): void {
        const endTick = this.tick + secondsToTicks(seconds);
        const hold = this.hold;
        if (hold && hold.endTick > this.tick) {
            if (!hold.enemies.includes(enemy)) {
                hold.enemies.push(enemy);
            }
            hold.endTick = Math.max(hold.endTick, endTick);
            return;
        }
        this.hold = { enemies: [enemy], endTick };
    }

    // A ranger's or mage's shot: a projectile at where the player is now, for
    // the enemy's own damage
    private enemyShoot(enemy: Enemy, shot: EnemyShotDef): void {
        enemy.attackCooldown = Math.round(shot.interval * TICKS_PER_SECOND);
        enemy.anim = "attack";
        enemy.animStart = this.tick;
        enemy.attackSeq = shot.seq ?? enemy.def.attackSeq;
        if (shot.castSpotAnim !== undefined) {
            this.addEffect(shot.castSpotAnim, enemy.x, enemy.y, 0, 40, enemy.uid);
        }
        this.emit({
            type: "bossAttack",
            enemyId: enemy.def.id,
            sound: shot.sound ?? -1,
            x: enemy.x,
            y: enemy.y,
        });
        this.launchProjectiles(enemy, shotAttack(shot), enemy.damage, true);
    }

    // A hit on the player; armour takes some off (unless it hits through it), at most its boss's
    // share (BossDef.armorCap), whatever the hit: its attacks, its stomp, its pools, its stare. A
    // map's MapDef.hits scales it and can put it through armour. Returns what it took.
    private damagePlayer(
        damage: number,
        enemyId: string,
        elite: boolean,
        sound?: number,
        ignoreArmor = false,
        // A hit that leaves them as open to the next as they were (a floor's burn, every so often)
        grace = true,
    ): number {
        const armorCap = ENEMY_BY_ID.get(enemyId)?.boss?.armorCap;
        const player = this.player;
        // Once the run's over nothing more lands, so a win can't turn into a
        // death (or spend a revive) later in the tick it's won
        if (
            this.runOver ||
            this.victoryAt >= 0 ||
            this.hero.down ||
            this.isImmune(this.hero) ||
            this.devGod
        ) {
            return 0;
        }
        // Quiet Prayers: armour stops less. Deadly Prayers: a hit leaves the player open, so the
        // next within a second does more.
        const stops = this.stats.armor * (this.invoked("quiet_prayers") ? QUIET_PRAYERS : 1);
        const hits = this.map.hits;
        if (hits) {
            damage *= hits.scale;
        }
        const armor =
            ignoreArmor || hits?.throughArmor
                ? 0
                : armorCap === undefined
                  ? stops
                  : Math.min(stops, damage * armorCap);
        const openUntil = this.tombsOpenUntil.get(this.hero.index) ?? -1;
        const opened =
            this.invoked("deadly_prayers") && this.tick <= openUntil ? DEADLY_PRAYERS : 1;
        const amount = Math.max(1, Math.round(damage * opened - armor));
        if (this.invoked("deadly_prayers")) {
            this.tombsOpenUntil.set(this.hero.index, this.tick + secondsToTicks(1));
        }
        player.hp -= amount;
        // What was there to take: a fall into Ba-Ba's gap asks for a hundred bars
        this.damageTaken += Math.min(amount, Math.max(0, player.hp + amount));
        // A blood cloud's touch heals Zebak
        if (enemyId === "zebak_blood_cloud") {
            this.zebakCloudHit(amount);
        }
        // A Crondis crocodile's bite spills your water
        if (enemyId === "crondis_crocodile" || enemyId === "crondis_crocodile_hungry") {
            this.crondisSpill("The crocodile's bite spills your water!");
        }
        player.flash = 6;
        if (grace) {
            player.invulnerable = Math.max(player.invulnerable, HIT_INVULNERABLE_TICKS);
        }
        this.emit({ type: "playerHit", amount, enemyId, elite, sound });
        if (player.hp <= 0) {
            this.playerDied();
        }
        return amount;
    }

    // Ring of recoil: hits hurt whoever lands them
    private recoil(enemy: Enemy | undefined): void {
        if (this.stats.thorns > 0 && enemy && !enemy.dead && !this.runOver) {
            const player = this.player;
            this.damageSource = "recoil";
            this.damageEnemy(enemy, this.stats.thorns, 0.5, player.x, player.y);
        }
    }

    // Another faction's enemy for this one to go and fight instead of the
    // player (EnemyDef.faction): the one it's fighting while it's still up and
    // close, otherwise the nearest it finds when it looks round. None for
    // bosses and elites (they'd lose their caskets), for one the player's hit,
    // or with the player close. Going from one foe that's still up to another
    // keeps the time it's had no way to them, so it can't put off giving up by
    // flipping between ones it can't reach.
    private findFoe(enemy: Enemy, playerDistance: number): Enemy | undefined {
        const faction = enemy.def.faction;
        if (
            faction === undefined ||
            enemy.boss ||
            enemy.elite ||
            enemy.aggro ||
            playerDistance < FOE_IGNORE_PLAYER
        ) {
            enemy.foe = undefined;
            enemy.foeWait = 0;
            return undefined;
        }
        const current = enemy.foe;
        if (
            current &&
            !current.dead &&
            fm.hypot(current.x - enemy.x, current.y - enemy.y) < FOE_RANGE + 1
        ) {
            return this.chaseFoe(enemy, current);
        }
        if (current?.dead) {
            // That fight's over, so the next is a new one
            enemy.foeWait = 0;
        }
        enemy.foe = undefined;
        if (this.tick < enemy.nextFoeLook) {
            return undefined;
        }
        enemy.nextFoeLook = this.tick + FOE_LOOK_TICKS;
        let nearest = FOE_RANGE * FOE_RANGE;
        this.enemyHash.query(enemy.x, enemy.y, FOE_RANGE, (other) => {
            if (
                other.dead ||
                other.boss ||
                other.elite ||
                other.def.faction === undefined ||
                other.def.faction === faction
            ) {
                return;
            }
            const ox = other.x - enemy.x;
            const oy = other.y - enemy.y;
            const distSq = ox * ox + oy * oy;
            if (distSq < nearest) {
                nearest = distSq;
                enemy.foe = other;
            }
        });
        if (!enemy.foe) {
            enemy.foeWait = 0;
            return undefined;
        }
        return this.chaseFoe(enemy, enemy.foe);
    }

    // The foe it's still after, or nothing once it's had too long with no way
    // to it, when it goes for the player as if they'd hit it. Enemies walk
    // straight at a foe, so a wall in the way stops them even if there's a way
    // round. Only walls count: a crowd in the way or a foe a long walk off
    // doesn't, and the time stays as it was until the way's blocked again.
    private chaseFoe(enemy: Enemy, foe: Enemy): Enemy | undefined {
        if (
            enemy.def.ghost ||
            canWalkStraight(this.getMoveGrid(enemy.def), enemy.x, enemy.y, foe.x, foe.y) ||
            ++enemy.foeWait < FOE_GIVE_UP_TICKS
        ) {
            return foe;
        }
        enemy.aggro = true;
        enemy.foe = undefined;
        return undefined;
    }

    // A touch from an enemy of another faction: a hit like the ones it gives
    // the player, only harder, and nobody's kill
    private enemyHitsEnemy(enemy: Enemy, foe: Enemy): void {
        enemy.foeWait = 0;
        enemy.attackCooldown = ENEMY_ATTACK_COOLDOWN;
        enemy.anim = "attack";
        enemy.animStart = this.tick;
        enemy.attackSeq = enemy.def.attackSeq;
        if (foe.shieldEnd > this.tick) {
            this.showBlocked(foe);
            return;
        }
        const amount = Math.max(
            1,
            Math.round(
                enemy.damage *
                    FACTION_DAMAGE *
                    (this.partyScale.hp / this.partyScale.damage) *
                    (this.hardScale.hp / this.hardScale.damage) *
                    this.rng.range(0.85, 1.15),
            ),
        );
        foe.hp -= amount;
        foe.flash = 5;
        // It turns on whatever hit it, unless it's after the player
        if (!foe.aggro) {
            foe.foe ??= enemy;
        }
        this.emit({
            type: "damage",
            x: foe.x,
            y: foe.y,
            amount,
            enemyUid: foe.uid,
            enemyId: foe.def.id,
        });
        if (foe.hp <= 0) {
            this.killEnemy(foe, "enemy");
        }
    }

    // ---- What enemies do besides hitting ----

    // An enemy's spawns, heals, revives and blinks, as their timers come
    // round. True if it blinked (it's done for this tick).
    private stepAbilities(enemy: Enemy, abilities: EnemyAbilities, distance: number): boolean {
        const def = enemy.def;
        const tick = this.tick;
        if (def.spawns && tick >= abilities.nextSpawn) {
            abilities.nextSpawn = tick + secondsToTicks(def.spawns.interval);
            this.callIn(enemy, def.spawns);
        }
        if (def.heals) {
            this.stepHealer(enemy, abilities, def.heals);
        }
        if (def.revives && tick >= abilities.nextRevive) {
            // Nothing to bring back: look again in a moment
            abilities.nextRevive =
                tick +
                (this.revive(enemy, def.revives)
                    ? secondsToTicks(def.revives.interval)
                    : HEAL_RETARGET_TICKS);
        }
        if (def.blinks) {
            return this.stepBlink(enemy, abilities, def.blinks, distance);
        }
        return false;
    }

    // A spawner's call: some of its enemies around it, as long as it hasn't
    // too many of its own about already
    private callIn(enemy: Enemy, spawns: EnemySpawnsDef): void {
        let own = 0;
        for (const other of this.enemies) {
            if (!other.dead && other.spawnedBy === enemy.uid) {
                own++;
            }
        }
        const count = Math.min(spawns.count, (spawns.max ?? SPAWNS_MAX) - own);
        if (count <= 0 || this.countAlive() >= MAX_ENEMIES) {
            return;
        }
        const weights = spawns.enemies.map((e) => e.weight);
        for (let i = 0; i < count; i++) {
            const def = getEnemy(spawns.enemies[this.rng.weightedIndex(weights)].id);
            const spawned = this.spawnNear(enemy, def, spawns.radius ?? SPAWNS_RADIUS, i, count, 3);
            if (spawned) {
                spawned.spawnedBy = enemy.uid;
                spawned.bonesOnly = spawns.bonesOnly ?? false;
                if (spawns.spotAnim !== undefined) {
                    this.addEffect(spawns.spotAnim, spawned.x, spawned.y, 0, 40);
                }
            }
        }
    }

    // One of count enemies turning up in a ring radius tiles around another,
    // trying a few spots before giving up
    private spawnNear(
        enemy: Vec2,
        def: EnemyDef,
        radius: number,
        index: number,
        count: number,
        attempts = 1,
    ): Enemy | undefined {
        for (let attempt = 0; attempt < attempts; attempt++) {
            const angle =
                attempt === 0
                    ? (index / count) * Math.PI * 2 + this.rng.range(0, 0.5)
                    : this.rng.range(0, Math.PI * 2);
            const x = enemy.x + fm.cos(angle) * radius;
            const y = enemy.y + fm.sin(angle) * radius;
            if (this.canTurnUpAt(def, x, y)) {
                return this.spawnEnemy(def, "normal", { x, y });
            }
        }
        return undefined;
    }

    // A healer goes to the most hurt thing it heals nearby, and heals it once
    // it's close enough, every so often
    private stepHealer(enemy: Enemy, abilities: EnemyAbilities, heals: EnemyHealsDef): void {
        const tick = this.tick;
        let target = abilities.healTarget;
        if (target && (this.healthShare(target) >= 1 || !this.canHeal(enemy, heals, target))) {
            target = abilities.healTarget = undefined;
        }
        if (!target && (tick + enemy.uid) % HEAL_RETARGET_TICKS === 0) {
            target = abilities.healTarget = this.findHealTarget(enemy, heals);
        }
        if (!target || tick < abilities.nextHeal) {
            return;
        }
        const reach = heals.range + target.radius;
        if (fm.hypot(target.x - enemy.x, target.y - enemy.y) > reach) {
            return;
        }
        abilities.nextHeal = tick + secondsToTicks(heals.interval);
        const phase = target.bossState?.phase;
        const kephri = this.tombsKephri;
        if (kephri?.uid === target.uid) {
            // Kephri's Soldier Scarab: her shield, or her hitpoints on her last
            const feed = target.def.boss?.kephri?.shields.soldierFeed ?? 0;
            this.restoreKephri(target, kephri, feed, heals.fraction);
        } else if (phase) {
            // Only its shield can be fed
            phase.shield = Math.min(
                phase.shieldMax,
                phase.shield + Math.max(1, Math.round(phase.shieldMax * heals.fraction)),
            );
        } else {
            target.hp = Math.min(
                target.maxHp,
                target.hp + Math.max(1, Math.round(target.maxHp * heals.fraction)),
            );
        }
        if (heals.spotAnim !== undefined) {
            this.addEffect(heals.spotAnim, target.x, target.y, 0, 40, target.uid);
        }
        enemy.anim = "attack";
        enemy.animStart = tick;
        enemy.attackSeq = enemy.def.attackSeq;
        enemy.yaw = yawFromVector(target.x - enemy.x, target.y - enemy.y);
    }

    // The most hurt enemy a healer heals within its reach
    // How whole something a healer might go to is: its hitpoints' share, but Kephri's shield
    // before her last (none while it's down, all of it overcharged as far as it goes)
    private healthShare(enemy: Enemy): number {
        const kephri = this.tombsKephri;
        const def = enemy.def.boss?.kephri;
        if (kephri?.uid === enemy.uid && def && !kephri.final) {
            return kephri.intermission
                ? 0
                : kephri.shield / (kephri.shieldMax * (1 + def.shields.overcharge));
        }
        return hurtFraction(enemy);
    }

    private findHealTarget(enemy: Enemy, heals: EnemyHealsDef): Enemy | undefined {
        let best: Enemy | undefined;
        let bestFraction = 1;
        for (const other of this.enemies) {
            const fraction = this.healthShare(other);
            if (fraction < bestFraction && this.canHeal(enemy, heals, other)) {
                best = other;
                bestFraction = fraction;
            }
        }
        return best;
    }

    // Whether a healer would go and heal this enemy: one it heals (checked
    // again as it goes, as a boss can get back up as a form it doesn't heal),
    // within its seek, and close enough to the player that the healer isn't
    // brought back to them on the way (RELOCATE_DISTANCE), which would have
    // it going back and forth
    private canHeal(enemy: Enemy, heals: EnemyHealsDef, other: Enemy): boolean {
        if (
            other === enemy ||
            other.dead ||
            !(heals.targets ? heals.targets.includes(other.def.id) : other.boss)
        ) {
            return false;
        }
        const seek = heals.seek ?? HEAL_SEEK;
        const player = this.player;
        return (
            fm.hypot(other.x - enemy.x, other.y - enemy.y) <= seek + other.radius &&
            fm.hypot(other.x - player.x, other.y - player.y) + heals.range < RELOCATE_DISTANCE
        );
    }

    // Brings back the last enemy to die near a reviver, where it fell. False
    // if there's none.
    private revive(enemy: Enemy, revives: EnemyRevivesDef): boolean {
        const rangeSq = revives.range * revives.range;
        for (let i = this.deaths.length - 1; i >= 0; i--) {
            const death = this.deaths[i];
            if (this.tick - death.tick > REVIVE_MAX_AGE) {
                // The rest are older still
                break;
            }
            const dx = death.x - enemy.x;
            const dy = death.y - enemy.y;
            if (dx * dx + dy * dy > rangeSq || !this.canTurnUpAt(death.def, death.x, death.y)) {
                continue;
            }
            this.deaths.splice(i, 1);
            const risen = this.spawnEnemy(death.def, "normal", { x: death.x, y: death.y });
            if (!risen) {
                continue;
            }
            risen.variant = death.variant;
            risen.noDrops = true;
            risen.hp = Math.max(1, Math.round(risen.maxHp * (revives.hp ?? 1)));
            if (revives.spotAnim !== undefined) {
                this.addEffect(revives.spotAnim, risen.x, risen.y, 0, 60);
            }
            enemy.anim = "attack";
            enemy.animStart = this.tick;
            enemy.attackSeq = revives.seq ?? enemy.def.attackSeq;
            enemy.yaw = yawFromVector(dx, dy);
            return true;
        }
        return false;
    }

    // Digging in (or blinking) and coming up by the player: it winds up
    // standing still, then it's there. True on the tick it lands.
    private stepBlink(
        enemy: Enemy,
        abilities: EnemyAbilities,
        blinks: EnemyBlinksDef,
        distance: number,
    ): boolean {
        const tick = this.tick;
        if (abilities.blinkLand === -1) {
            if (
                tick < abilities.nextBlink ||
                distance < blinks.minRange ||
                tick < (this.blinkGapEnd.get(enemy.def.id) ?? 0)
            ) {
                return false;
            }
            if (blinks.gap !== undefined) {
                this.blinkGapEnd.set(enemy.def.id, tick + secondsToTicks(blinks.gap));
            }
            abilities.blinkLand = tick + secondsToTicks(blinks.windup ?? 0);
            enemy.anim = "attack";
            enemy.animStart = tick;
            enemy.attackSeq = blinks.seq ?? enemy.def.attackSeq;
            if (blinks.castSpotAnim !== undefined) {
                this.addEffect(blinks.castSpotAnim, enemy.x, enemy.y, 0, 60);
            }
            if (blinks.sound !== undefined) {
                this.emit({
                    type: "bossAttack",
                    enemyId: enemy.def.id,
                    sound: blinks.sound,
                    x: enemy.x,
                    y: enemy.y,
                });
            }
        }
        if (tick < abilities.blinkLand) {
            return false;
        }
        abilities.blinkLand = -1;
        abilities.nextBlink = tick + secondsToTicks(blinks.interval);
        enemy.anim = "walk";
        enemy.animStart = tick;
        const player = this.player;
        const spot = this.findSpotNear(player.x, player.y, blinks.distance, enemy.radius);
        if (!spot) {
            return false;
        }
        enemy.x = enemy.prevX = spot.x;
        enemy.y = enemy.prevY = spot.y;
        enemy.vx = enemy.vy = 0;
        enemy.yaw = yawFromVector(player.x - spot.x, player.y - spot.y);
        if (blinks.impactSpotAnim !== undefined) {
            this.addEffect(blinks.impactSpotAnim, spot.x, spot.y, 0, 60);
        }
        if (blinks.surface) {
            enemy.risingEnd = tick + secondsToTicks(blinks.surface.seconds);
            enemy.anim = "attack";
            enemy.attackSeq = blinks.surface.seq;
            if (blinks.sound !== undefined) {
                this.events.push({
                    type: "bossAttack",
                    enemyId: enemy.def.id,
                    sound: blinks.sound,
                    x: spot.x,
                    y: spot.y,
                });
            }
        }
        return true;
    }

    // A free spot about distance tiles from (x, y) that the player can get
    // to, undefined if a few tries find none
    private findSpotNear(
        x: number,
        y: number,
        distance: number,
        radius: number,
    ): { x: number; y: number } | undefined {
        for (let attempt = 0; attempt < 12; attempt++) {
            const angle = this.rng.range(0, Math.PI * 2);
            const spotX = x + fm.cos(angle) * distance;
            const spotY = y + fm.sin(angle) * distance;
            const tileX = Math.floor(spotX);
            const tileY = Math.floor(spotY);
            if (
                this.grid.contains(tileX, tileY) &&
                this.flowField.isReachable(tileX, tileY) &&
                isCircleFree(this.grid, spotX, spotY, radius)
            ) {
                return { x: spotX, y: spotY };
            }
        }
        return undefined;
    }

    private dropShield(enemy: Enemy): void {
        enemy.shieldEnd = 0;
        const message = enemy.def.shield?.message;
        if (message) {
            this.emit({ type: "notice", message });
        }
    }

    // A hit a shield took: a blocked hitsplat now and then
    private showBlocked(enemy: Enemy): void {
        if (this.tick - enemy.blockedTick < BLOCKED_SPLAT_TICKS) {
            return;
        }
        enemy.blockedTick = this.tick;
        this.emit({
            type: "damage",
            x: enemy.x,
            y: enemy.y,
            amount: 0,
            enemyUid: enemy.uid,
            enemyId: enemy.def.id,
            blocked: true,
        });
    }

    // ---- Glyphs ----

    private addGlyph(boss: Enemy, look: EnemyDef): void {
        const player = this.player;
        let dirX = player.x - boss.x;
        let dirY = player.y - boss.y;
        const length = fm.hypot(dirX, dirY);
        if (length > 0.001) {
            dirX /= length;
            dirY /= length;
        } else {
            dirX = 0;
            dirY = -1;
        }
        const glyph: Glyph = {
            uid: this.nextUid++,
            bossUid: boss.uid,
            look,
            x: boss.x,
            y: boss.y,
            prevX: boss.x,
            prevY: boss.y,
            dirX,
            dirY,
            acrossX: -dirY,
            acrossY: dirX,
            startTick: this.tick,
        };
        this.placeGlyph(glyph, boss);
        glyph.prevX = glyph.x;
        glyph.prevY = glyph.y;
        this.glyphs.push(glyph);
    }

    // Glyphs slide along their lines, and go with their bosses
    private stepGlyphs(): void {
        if (this.glyphs.length === 0) {
            return;
        }
        this.glyphs = this.glyphs.filter((glyph) => {
            const boss = this.enemies.find((e) => e.uid === glyph.bossUid);
            if (!boss || boss.dead || !boss.def.boss?.glyph) {
                return false;
            }
            glyph.prevX = glyph.x;
            glyph.prevY = glyph.y;
            this.placeGlyph(glyph, boss);
            return true;
        });
    }

    // Back and forth along its line at a steady speed, from the middle
    private placeGlyph(glyph: Glyph, boss: Enemy): void {
        const def = boss.def.boss!.glyph!;
        const travel = ((this.tick - glyph.startTick) / TICKS_PER_SECOND) * def.speed;
        const along = pingPong(travel, def.halfLength);
        glyph.x = boss.x + glyph.dirX * def.distance + glyph.acrossX * along;
        glyph.y = boss.y + glyph.dirY * def.distance + glyph.acrossY * along;
    }

    // Whether a boss's glyph is between it and (x, y)
    glyphBlocks(boss: Enemy, x: number, y: number): boolean {
        const def = boss.def.boss?.glyph;
        const glyph = def && this.glyphs.find((g) => g.bossUid === boss.uid);
        if (!glyph) {
            return false;
        }
        const vx = x - boss.x;
        const vy = y - boss.y;
        const lengthSq = vx * vx + vy * vy;
        if (lengthSq < 1e-6) {
            return false;
        }
        const t = ((glyph.x - boss.x) * vx + (glyph.y - boss.y) * vy) / lengthSq;
        if (t <= 0 || t >= 1) {
            return false;
        }
        return fm.hypot(boss.x + vx * t - glyph.x, boss.y + vy * t - glyph.y) <= def.width;
    }

    // ---- Boss fights: entrances, phases, patterns ----

    // The square a boss's fight goes by: the map's if it names one, or all of it
    get bossArena(): { minX: number; minY: number; maxX: number; maxY: number } {
        const square = this.map.bossArena;
        if (square) {
            return {
                minX: square.baseX,
                minY: square.baseY,
                maxX: square.baseX + square.size,
                maxY: square.baseY + square.size,
            };
        }
        const grid = this.grid;
        return {
            minX: grid.baseX,
            minY: grid.baseY,
            maxX: grid.baseX + grid.sizeX,
            maxY: grid.baseY + grid.sizeY,
        };
    }

    // ---- Raids ----

    // A raid's room: its waves until its time's up, then the party's taken into its boss's room
    // and the boss turns up. Once it's dead, a moment to gather what's on the ground, and on to
    // the next room. The last room's boss is the final boss, so killing it wins as anywhere.
    private stepRaid(): void {
        const raid = this.map.raid;
        if (!raid || this.runOver) {
            return;
        }
        const room = raid.rooms[this.raidRoom];
        const last = this.raidRoom === raid.rooms.length - 1;
        if (this.raidStage === "waves") {
            // Its time's up, or the portal brought it on (and if the boss couldn't come yet, it
            // tries again next tick)
            if (this.tick >= this.raidBossDueTick) {
                this.startRaidBoss(room, last);
            } else {
                this.stepTeleporter(room);
            }
        } else if (this.raidStage === "boss") {
            if (!last && !this.enemies.some((enemy) => enemy.boss && !enemy.dead)) {
                this.raidStage = "cleared";
                this.raidStageTick = this.tick;
                for (const enemy of this.enemies) {
                    if (!enemy.dead) {
                        this.vanish(enemy);
                    }
                }
                this.clearBossAttacks();
                this.enemyProjectiles = [];
                for (const pickup of this.pickups) {
                    pickup.attracted = true;
                    pickup.speed = Math.max(pickup.speed, 0.15);
                }
                this.scoreRaidRoom();
                // Each player's turn at the supply chest, before the next room
                this.raidShopQueue = this.heroes
                    .filter((hero) => this.isUp(hero))
                    .map((hero) => hero.index);
                this.openNextRaidShop();
            }
        } else if (this.tick - this.raidStageTick >= RAID_CLEARED_SECONDS * TICKS_PER_SECOND) {
            this.beginRaidRoom(this.raidRoom + 1);
        }
    }

    // The Tombs of Amascut's Nexus: walking up to a path's door takes the party into its room, or
    // for a path that isn't built yet says so, once as a player comes up to it (the door they're at
    // is kept on tombsDoors).
    private stepTombs(): void {
        const tombs = this.map.tombs;
        if (!tombs || this.runOver || this.state !== "playing" || this.tombsPath !== undefined) {
            return;
        }
        if (tombs.spirit && !this.tombsWardens && this.stepTombsSpirit(tombs.spirit)) {
            return;
        }
        const current = this.hero;
        // The way to the Wardens, once every path's done
        const door = tombs.wardensDoor;
        if (door && tombs.wardens && !this.tombsWardens) {
            const near = this.heroes.find(
                (hero) =>
                    this.isUp(hero) &&
                    fm.hypot(door.x - hero.player.x, door.y - hero.player.y) <= TOMBS_DOOR_REACH,
            );
            const open = tombs.paths.every((path) => this.tombsPathsDone.includes(path.id));
            if (near && open) {
                this.enterWardens();
                return;
            }
            if (near && this.tombsDoors.get(near.index) !== "wardens") {
                this.tombsDoors.set(near.index, "wardens");
                this.use(near);
                this.emit(
                    {
                        type: "notice",
                        message: "The way to the Wardens opens once all four paths are done.",
                    },
                    true,
                );
                this.use(current);
                return;
            }
        }
        for (const hero of this.heroes) {
            if (!this.isUp(hero)) {
                continue;
            }
            const { x, y } = hero.player;
            const at = tombs.paths.find(
                (path) => fm.hypot(path.door.x - x, path.door.y - y) <= TOMBS_DOOR_REACH,
            );
            if (at?.id === this.tombsDoors.get(hero.index)) {
                continue;
            }
            this.tombsDoors.set(hero.index, at?.id);
            if (at && this.tombsPathsDone.includes(at.id)) {
                this.use(hero);
                this.emit({ type: "notice", message: `${at.name}: done.` }, true);
                continue;
            }
            if (at?.room) {
                this.enterTombsPath(at.id, at.room.arrive);
                return;
            }
            if (at) {
                this.use(hero);
                this.emit({ type: "notice", message: `${at.name}: not open yet.` }, true);
            }
        }
        this.use(current);
    }

    // Into a path's room, the whole party, with what's on the floor
    private enterTombsPath(id: string, arrive: { x: number; y: number }): void {
        const path = this.map.tombs!.paths.find((p) => p.id === id)!;
        this.tombsPath = id;
        this.tombsTimes.push({ id, startTick: this.tick });
        this.tombsDoors.clear();
        this.forfeitTombsBundles();
        this.gatherHall();
        this.moveParty(arrive);
        this.emit({ type: "notice", message: `The ${midSentence(path.name)}` });
        // The Het room's dark, lit by its beam (HET.ambient), till its seal breaks
        if (path.room?.puzzle === "het" && this.lighting) {
            this.dimTo(HET.ambient, 1.5);
        }
        if (path.room?.puzzle) {
            this.tombsRoom = {
                wave: -1,
                group: [],
                waveTick: this.tick,
                nextIssueTick: this.tick + secondsToTicks(this.apmekenIssueEvery()),
                missed: 0,
                beaten: -1,
                started: false,
                pending: [],
                nextOutTick: 0,
            };
            this.emit({
                type: "notice",
                message: "Walk through the barrier when you're ready, and the room begins.",
            });
        }
    }

    // An attack as an invocation that's on makes it (BossAttackDef.invoked), kept so it's the same
    // attack every time (bullet sources go by it)
    private readonly invokedAttacks = new Map<BossAttackDef, BossAttackDef>();
    // The copies made, so a copy isn't made over again (a chain's links)
    private readonly invokedMade = new Set<BossAttackDef>();
    private invokedAttack(attack: BossAttackDef): BossAttackDef {
        const invoked = attack.invoked;
        if (!invoked || !this.invoked(invoked.id) || this.invokedMade.has(attack)) {
            return attack;
        }
        let made = this.invokedAttacks.get(attack);
        if (!made) {
            made = {
                ...attack,
                // A surge's charge (Rampage), and a chain's more links (Acceleration)
                speed:
                    attack.kind === "surge" && attack.speed !== undefined
                        ? attack.speed * (invoked.speed ?? 1)
                        : attack.speed,
                chain: invoked.times
                    ? {
                          times: (attack.chain?.times ?? 0) + invoked.times,
                          windup: attack.chain?.windup ?? attack.windup,
                      }
                    : attack.chain,
                radius:
                    attack.radius !== undefined
                        ? attack.radius * (invoked.radius ?? 1)
                        : attack.radius,
                damage: attack.damage * (invoked.damage ?? 1),
                pattern: attack.pattern && {
                    ...attack.pattern,
                    speed: attack.pattern.speed * (invoked.speed ?? 1),
                },
                summon: attack.summon && {
                    ...attack.summon,
                    count: attack.summon.count + (invoked.count ?? 0),
                },
                ground: attack.ground && {
                    ...attack.ground,
                    radius: attack.ground.radius * (invoked.radius ?? 1),
                },
            };
            this.invokedAttacks.set(attack, made);
            this.invokedMade.add(made);
        }
        return made;
    }

    // A Tombs boss's own ease from a raid level up (BossDef.raidEase), if it's that high
    private raidEase(def: EnemyDef): BossDef["raidEase"] {
        const ease = def.boss?.raidEase;
        return this.map.tombs && ease && this.raidLevel >= ease.from ? ease : undefined;
    }

    // Whether an invocation's on (only ever in the Tombs)
    private invoked(id: string): boolean {
        return this.invocations.includes(id);
    }

    // The Tombs' path levels, from the invocations (Pathseeker 1 to Pathmaster 3), with each path
    // the raid's done before this one adding one, so the rooms grow with the raid
    // The path level as what scales by it smoothly (hitpoints, damage, how often things come)
    // feels it: a quarter at Entry, where a run's bought nothing and every path it's done
    // makes the next tougher, in full from Normal (the raid level's damage) up. What it counts
    // (more waves, longer orders, more decoys) goes by tombsPathLevel itself.
    get tombsPathWeight(): number {
        return this.tombsPathLevel * Math.min(1, this.hardScale.damage);
    }

    get tombsPathLevel(): number {
        const level = this.invocations.includes("pathmaster")
            ? 3
            : this.invocations.includes("pathfinder")
              ? 2
              : this.invocations.includes("pathseeker")
                ? 1
                : 0;
        // Walk the Path: finishing a path levels the rest up twice as much
        return level + this.tombsPathsDone.length * (this.invoked("walk_the_path") ? 2 : 1);
    }

    // The chance a Tombs boss's adds (her baboons, his swarms) drop food, on top of the usual: a
    // fair one at Entry, where a run's bought nothing to heal with, none from Expert up
    private tombsBossFood(): number {
        const fight = this.tombsRoom?.boss;
        if (!this.map.tombs || !fight || fight.uid === -1) {
            return 0;
        }
        return (
            TOMBS_BOSS_FOOD.chance * Math.max(0, 1 - this.raidLevel / TOMBS_BOSS_FOOD.untilLevel)
        );
    }

    // Food round the party as a Wardens phase ends (TOMBS_BOSS_FOOD.phase, fewer as the raid level
    // nears untilLevel, none from it): there's nothing else to heal with between them
    private wardensFood(): void {
        const share = Math.max(0, 1 - this.raidLevel / TOMBS_BOSS_FOOD.untilLevel);
        const count = this.invoked("on_a_diet") ? 0 : Math.round(TOMBS_BOSS_FOOD.phase * share);
        const at = (this.heroes.find((hero) => this.isUp(hero)) ?? this.hero).player;
        for (let i = 0; i < count; i++) {
            const angle = (i / Math.max(1, count)) * Math.PI * 2;
            const spot = this.walkableSpot(at.x + fm.cos(angle) * 2, at.y + fm.sin(angle) * 2);
            this.dropPickup("food", spot.x, spot.y, Math.round(FOOD_HEAL * this.healScale));
        }
    }

    // A hit that takes a share of your hitpoints (a flood, a roar, an avalanche): as it is from
    // Normal up, less at Entry as the raid level's damage is (down to half), so a run that's bought
    // nothing isn't undone by one slip. Anywhere but the Tombs, as it is.
    private tombsShare(share: number): number {
        if (!this.map.tombs) {
            return share;
        }
        return share * Math.min(1, Math.max(0.5, this.hardScale.damage));
    }

    // What a Tombs room's hazards hurt by (a trap, a beam, a falling rock, a boss's wave or acid):
    // the room's scale, and the raid level's as its enemies' hits are
    private tombsHazardScale(): number {
        return this.tombsRoomScale().damage * this.hardScale.damage;
    }

    // What a Tombs room's enemies are multiplied by: more with each of its waves (so it ends far
    // harder than it starts, as a run levels up in it) and with each path level
    private tombsRoomScale(): { hp: number; damage: number } {
        // The puzzle's waves are done with once its boss is up: its adds and hazards go by the
        // path level alone, not by how far the room got
        const room = this.tombsRoom;
        const wave = room?.boss ? 0 : Math.max(0, room?.wave ?? 0);
        const level = this.tombsPathWeight;
        return {
            hp: 1 + APMEKEN.waveHp * wave + APMEKEN.levelHp * level,
            damage: 1 + APMEKEN.waveDamage * wave + APMEKEN.levelDamage * level,
        };
    }

    private apmekenIssueEvery(): number {
        return Math.max(4, APMEKEN.issueEvery - this.tombsPathWeight);
    }

    // The waves the director spawns by: the Apmeken room's stream while it's on, a raid room's, or
    // the map's
    private get activeWaves(): WaveDef[] {
        if (this.map.tombs) {
            const room = this.tombsRoom;
            if (!room || !room.started || room.doneTick !== undefined || room.boss) {
                return [];
            }
            // The Scabaras room's scarabs, the Het room's swarms, or the Apmeken room's baboons
            if (this.tombsPathRoom?.crondis) {
                // Its crocodiles are pressure, not experience: fewer below Normal, as the bosses'
                // bullets are (bulletScale)
                const trickle = getCrondisTrickle(Math.max(0, room.wave));
                const crowd = Math.min(1, this.bulletScale);
                return [
                    {
                        ...trickle,
                        spawnRate:
                            trickle.spawnRate *
                            (1 + TOMBS_ROOM_SPAWNS_PER_LEVEL * this.tombsPathWeight) *
                            crowd,
                        maxAlive: Math.max(2, Math.round(trickle.maxAlive * crowd)),
                    },
                ];
            }
            if (this.tombsPathRoom?.scabaras) {
                const trickle = getScabarasTrickle(Math.max(0, room.wave));
                return [
                    {
                        ...trickle,
                        spawnRate:
                            trickle.spawnRate *
                            (1 + TOMBS_ROOM_SPAWNS_PER_LEVEL * this.tombsPathWeight),
                    },
                ];
            }
            if (this.tombsPathRoom?.het) {
                const trickle = getHetTrickle(Math.max(0, room.wave));
                return [
                    {
                        ...trickle,
                        spawnRate:
                            trickle.spawnRate *
                            (1 + TOMBS_ROOM_SPAWNS_PER_LEVEL * this.tombsPathWeight),
                    },
                ];
            }
            return [this.apmekenTrickle(room.wave)];
        }
        return this.raidRoomDef?.waves ?? this.map.waves;
    }

    private apmekenTrickle(wave: number): WaveDef {
        const trickle = getApmekenTrickle(wave);
        const quicker = 1 + TOMBS_ROOM_SPAWNS_PER_LEVEL * this.tombsPathWeight;
        return { ...trickle, spawnRate: trickle.spawnRate * quicker };
    }

    // The next of the Apmeken room's eight waves, or once they're all done, the room's done
    private nextApmekenWave(): void {
        const room = this.tombsRoom!;
        room.wave++;
        room.waveTick = this.tick;
        room.missed = 0;
        if (room.wave >= APMEKEN_WAVES.length) {
            room.wave = APMEKEN_WAVES.length - 1;
            room.doneTick = this.tick;
            room.issue = undefined;
            this.emit({
                type: "notice",
                message: "The baboons are beaten, and the way west opens. Ba-Ba isn't in yet.",
            });
            return;
        }
        const ids = [...APMEKEN_WAVES[room.wave]];
        // One more of its first for each path level
        for (let i = 0; i < this.tombsPathLevel; i++) {
            ids.push(ids[0]);
        }
        // Out of the walls one at a time (stepApmekenGroup), the first now
        room.group = [];
        room.pending = ids;
        room.nextOutTick = this.tick;
        this.stepApmekenGroup(room);
        this.emit({
            type: "notice",
            message: `Wave ${room.wave + 1} of ${APMEKEN_WAVES.length}`,
        });
    }

    // The path's room, as the map has it
    get tombsPathRoom(): TombsPathDef["room"] {
        return this.map.tombs?.paths.find((p) => p.id === this.tombsPath)?.room;
    }

    // Into the path's boss's arena, its room beaten: the boss rises once someone walks in
    // skipped: the dev's way past the puzzle (devSkipToTombsBoss), which earns no levels
    private enterTombsBoss(
        room: TombsRoom,
        boss: NonNullable<NonNullable<TombsPathDef["room"]>["boss"]>,
        skipped = false,
    ): void {
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                this.vanish(enemy);
            }
        }
        this.enemyProjectiles = [];
        this.gatherHall();
        this.moveParty(boss.arrive);
        // The puzzle's done: its points to everyone still in the raid, and its levels (a puzzle's
        // short, and its boss is fought with what the run has by then)
        if (!room.boss) {
            const current = this.hero;
            for (const hero of this.heroes) {
                if (!hero.left) {
                    hero.tombsPoints += TOMBS_POINTS.room;
                    hero.raidPoints += TOMBS_POINTS.room;
                    if (!skipped) {
                        this.use(hero);
                        this.xp +=
                            (this.xpForNextLevel - this.xpForThisLevel) * TOMBS_PUZZLE_LEVELS;
                    }
                }
            }
            this.use(current);
        }
        room.boss = { uid: -1, beatenTick: undefined };
        this.emit({
            type: "notice",
            message: `${getEnemy(boss.enemyId).name} waits for you. Walk in when you're ready.`,
        });
    }

    // The boss's fight: it rises once someone's past the line, and once it's dead the path's done
    private stepTombsBoss(room: TombsRoom): void {
        const def = this.tombsPathRoom?.boss;
        const fight = room.boss!;
        if (!def) {
            return;
        }
        if (fight.beatenTick !== undefined) {
            this.clearTombsBossLeftovers();
            if (this.tick - fight.beatenTick >= secondsToTicks(4)) {
                this.leaveTombsPath();
            }
            return;
        }
        if (fight.uid === -1) {
            // Not up (yet, or again after a death): nothing of the last fight's left lying about
            this.clearTombsBossLeftovers();
            // A step past the line and the gap at the arena's foot (Mind the Gap), so it opens
            // behind the party, not under them
            const rise = def.line.y + TOMBS_BOSS_RISE;
            if (this.heroes.some((hero) => this.isUp(hero) && hero.player.y > rise)) {
                const enemy = this.spawnBoss(getEnemy(def.enemyId), "boss", undefined, def.at);
                if (enemy) {
                    fight.uid = enemy.uid;
                    if (enemy.def.boss?.zebak) {
                        this.tombsZebak = {
                            uid: enemy.uid,
                            special: 0,
                            waves: [],
                            acid: [],
                            acidTicks: [],
                            jugs: [],
                            clouds: [],
                            nextCloudTick:
                                this.tick + secondsToTicks(enemy.def.boss.zebak.clouds.every / 2),
                        };
                    }
                    if (enemy.def.boss?.kephri) {
                        const shieldMax = Math.round(
                            enemy.maxHp * enemy.def.boss.kephri.shields.share,
                        );
                        this.tombsKephri = {
                            uid: enemy.uid,
                            phase: 0,
                            shield: shieldMax,
                            shieldMax,
                            leaked: 0,
                            final: false,
                            nextDungTick:
                                this.tick + secondsToTicks(enemy.def.boss.kephri.dung.every),
                            medicTick:
                                this.tick + secondsToTicks(enemy.def.boss.kephri.swarm.medic),
                            arcane: new Map(),
                        };
                    }
                    if (enemy.def.boss?.akkha) {
                        // His room in full light (AkkhaDef.ambient), so Memory Blast's
                        // quadrants read; the map's own again once the path's left
                        if (this.lighting) {
                            this.dimTo(enemy.def.boss.akkha.ambient, 1);
                        }
                        this.tombsAkkha = {
                            uid: enemy.uid,
                            attacks: 0,
                            readyTick: 0,
                            orbsUntil: 0,
                            orbs: [],
                            lastTiles: [],
                            shadowsDone: 0,
                            shadows: [],
                            floodTick: 0,
                            bursts: [],
                        };
                    }
                }
                this.tombsSarcophagi = (def.boulders?.sarcophagi ?? []).map((at) => ({
                    ...at,
                    openUntil: -1,
                    nextTick: 0,
                }));
                // Whoever's still behind (in the safe room, on the gap) is brought in with them
                for (const hero of this.heroes) {
                    if (this.isUp(hero) && hero.player.y < rise) {
                        hero.player.y = hero.player.prevY = rise;
                    }
                }
            }
            return;
        }
        // Up, the arena's entrance is no way out: nobody goes back behind the line, as with the
        // room's barrier
        for (const hero of this.heroes) {
            const player = hero.player;
            const limit = def.line.y + player.radius;
            if (player.y < limit) {
                player.y = limit;
            }
        }
        const boss = this.enemies.find((e) => e.uid === fight.uid);
        if (!boss || boss.dead) {
            fight.beatenTick = this.tick;
            this.emit({ type: "notice", message: "The path is done. Back to the Nexus..." });
            return;
        }
        this.stepAkkha(boss);
        this.stepKephri(boss);
        this.stepZebak(boss);
        this.stepTombsCover();
        this.stepTombsPit(boss);
        this.stepTombsPeels();
        this.stepSarcophagi(boss);
    }

    // Her boulders' rocks: gone in time, and solid meanwhile, the party pushed out of them
    private stepTombsCover(): void {
        if (this.tombsCover.length === 0) {
            return;
        }
        this.tombsCover = this.tombsCover.filter((rock) => this.tick < rock.endTick);
        for (const hero of this.heroes) {
            const player = hero.player;
            for (const rock of this.tombsCover) {
                const dx = player.x - rock.x;
                const dy = player.y - rock.y;
                const distance = fm.hypot(dx, dy);
                const edge = rock.radius + player.radius;
                if (distance < edge) {
                    const nx = distance > 0.001 ? dx / distance : 0;
                    const ny = distance > 0.001 ? dy / distance : -1;
                    moveCircle(
                        this.grid,
                        player,
                        nx * (edge - distance),
                        ny * (edge - distance),
                        player.radius,
                    );
                }
            }
        }
    }

    // Jungle Japes: a baboon killed in a path boss's fight leaves a banana peel where it fell
    private dropTombsPeel(enemy: Enemy): void {
        const fight = this.tombsRoom?.boss;
        if (
            !fight ||
            fight.uid === -1 ||
            fight.beatenTick !== undefined ||
            !this.invoked("jungle_japes")
        ) {
            return;
        }
        this.tombsPeels.push({
            x: enemy.x,
            y: enemy.y,
            endTick: this.tick + secondsToTicks(JUNGLE_JAPES.seconds),
        });
    }

    // Whoever steps on a peel slips, rooted for a moment, and it's gone
    private stepTombsPeels(): void {
        if (this.tombsPeels.length === 0) {
            return;
        }
        const current = this.hero;
        this.tombsPeels = this.tombsPeels.filter((peel) => {
            if (this.tick >= peel.endTick) {
                return false;
            }
            // Not one already rooted: pushed onto more peels while down, they'd chain
            const hero = this.heroes.find(
                (one) =>
                    this.isUp(one) &&
                    one.player.frozen <= 0 &&
                    fm.hypot(one.player.x - peel.x, one.player.y - peel.y) <=
                        JUNGLE_JAPES.radius + one.player.radius,
            );
            if (!hero) {
                return true;
            }
            this.use(hero);
            const player = this.player;
            player.frozen = Math.max(player.frozen, secondsToTicks(JUNGLE_JAPES.stun));
            this.emit({ type: "notice", message: "You slip on a banana peel!" }, true);
            return false;
        });
        this.use(current);
    }

    // Mind the Gap: whoever's in the gap at the arena's foot falls (knocked there by her boulders,
    // or walking into it)
    private stepTombsPit(boss: Enemy): void {
        const pit = this.tombsPit;
        if (!pit) {
            return;
        }
        const current = this.hero;
        for (const hero of this.heroes) {
            const player = hero.player;
            if (
                !this.isUp(hero) ||
                player.x < pit.x0 ||
                player.x > pit.x1 ||
                player.y < pit.y0 ||
                player.y > pit.y1
            ) {
                continue;
            }
            this.use(hero);
            this.emit({ type: "notice", message: "You fall into the gap!" }, true);
            // Out of reach of a fall (god mode on the dev server, just revived): back to the foot
            if (this.damagePlayer(player.maxHp * 100, boss.def.id, false, undefined, true) === 0) {
                const start = this.tombsPathRoom?.boss?.boulders?.start;
                if (start) {
                    player.x = player.prevX = start.x;
                    player.y = player.prevY = start.y;
                }
            }
            if (this.runOver) {
                break;
            }
        }
        this.use(current);
    }

    // ---- Akkha (BossDef.akkha) ----

    // The quadrant a point's in: 0 north-west, then round clockwise (1 north-east, 2 south-east,
    // 3 south-west), so the ones beside each other are a step apart and across are two
    akkhaQuadrant(x: number, y: number): number {
        const area = this.tombsPathRoom?.boss?.quadrants;
        if (!area) {
            return 0;
        }
        const east = x >= area.middle.x;
        const north = y >= area.middle.y;
        return north ? (east ? 1 : 0) : east ? 2 : 3;
    }

    // A quadrant's corner, out from the floor's middle
    akkhaCorner(quadrant: number, out: number): { x: number; y: number } {
        const area = this.tombsPathRoom!.boss!.quadrants!;
        const east = quadrant === 1 || quadrant === 2;
        const north = quadrant === 0 || quadrant === 1;
        return {
            x: area.middle.x + (east ? out : -out),
            y: area.middle.y + (north ? out : -out),
        };
    }

    // What the quadrant the current hero's in does to them, hit there
    private akkhaElement(def: AkkhaDef, boss: Enemy | undefined): void {
        const player = this.player;
        const element = def.elements[this.akkhaQuadrant(player.x, player.y)];
        this.applyPlayerEffect(element.effect, boss);
        this.addEffect(element.spotAnim, player.x, player.y, 0, 30);
    }

    // A hit of Akkha's that isn't an attack (a blast, a flood, an orb): damage, through armour
    // if it's a share of their hitpoints, and the element where it lands
    private akkhaHurt(boss: Enemy, def: AkkhaDef, damage: number, share: boolean): void {
        if (this.reviving || this.runOver || this.hero.down) {
            return;
        }
        const player = this.player;
        // A share's eased as his hits are (BossDef.raidEase); a flat hit's from his damage already
        const ease = share ? (this.raidEase(boss.def)?.damage ?? 1) : 1;
        const amount = share ? Math.round(player.maxHp * this.tombsShare(damage) * ease) : damage;
        this.damagePlayer(amount, boss.def.id, false, undefined, share);
        if (!this.runOver && !this.reviving) {
            this.akkhaElement(def, boss);
        }
    }

    // Each tick of his fight, once he's up
    private stepAkkha(boss: Enemy): void {
        const fight = this.tombsAkkha;
        const def = boss.def.boss?.akkha;
        if (!fight || !def || !this.tombsPathRoom?.boss?.quadrants) {
            return;
        }
        const keep = secondsToTicks(1.2);
        fight.bursts = fight.bursts.filter((burst) => this.tick - burst.tick < keep);
        if (def.unstable) {
            this.stepAkkhaStand(boss, fight, def, def.unstable);
            return;
        }
        this.stepAkkhaShadows(boss, fight, def);
        this.stepAkkhaMemory(boss, fight, def);
        this.stepAkkhaOrbs(boss, fight, def);
        this.stepAkkhaDetonate(boss, fight, def);
        // A special once he's made his attacks, when he's not in the middle of anything
        const every = def.specialEvery - (this.invoked("stay_vigilant") ? 1 : 0);
        if (
            fight.attacks >= every &&
            !boss.bossState!.windup &&
            !fight.memory &&
            !fight.detonate &&
            this.tick >= fight.orbsUntil &&
            this.tick >= fight.readyTick
        ) {
            fight.attacks = 0;
            this.startAkkhaSpecial(boss, fight, def);
        }
    }

    // Memory Blast or his trailing orbs (both with Double Trouble), or in a party Detonate, and
    // another style after
    private startAkkhaSpecial(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const both = this.invoked("double_trouble");
        const party = this.heroes.filter((hero) => this.isUp(hero)).length > 1;
        if (!both && party && this.rng.int(3) === 0) {
            const special = this.invoked("feeling_special");
            fight.detonate = {
                tick: this.tick + secondsToTicks(def.detonate.seconds),
                cross: this.heroes.map(() => special && this.rng.chance(0.5)),
            };
            this.emit({ type: "notice", message: def.detonate.message });
            const others = def.forms.filter((id) => id !== boss.def.id);
            this.changeAkkhaForm(boss, others[this.rng.int(others.length)]);
            return;
        }
        const memory = both || this.rng.int(2) === 0;
        if (memory) {
            this.startAkkhaMemory(boss, fight, def);
        }
        if (both || !memory) {
            fight.orbsUntil = this.tick + secondsToTicks(def.orbs.seconds);
            fight.lastTiles = this.heroes.map((hero) => this.akkhaTile(hero.player));
            this.emit({ type: "notice", message: def.orbs.message });
        }
        // After Memory Blast, his next once he's been back on the floor as long as he was gone,
        // and specialGap at least
        if (fight.memory) {
            const ends = fight.memory.showEnd + fight.memory.burst * fight.memory.order.length;
            const gone = ends - this.tick;
            fight.readyTick = ends + Math.max(gone, secondsToTicks(def.specialGap));
        }
        const others = def.forms.filter((id) => id !== boss.def.id);
        this.changeAkkhaForm(boss, others[this.rng.int(others.length)]);
    }

    // Detonate going off: each marked hero's plus (or X) round their tile hurts whoever else is on
    // it, but not on their own tile
    private stepAkkhaDetonate(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const detonate = fight.detonate;
        if (!detonate || this.tick < detonate.tick) {
            return;
        }
        fight.detonate = undefined;
        const up = this.heroes.filter((hero) => this.isUp(hero));
        const hit = new Set<number>();
        for (const hero of up) {
            const tx = Math.floor(hero.player.x);
            const ty = Math.floor(hero.player.y);
            const shape = detonate.cross[hero.index]
                ? [
                      [1, 1],
                      [1, -1],
                      [-1, 1],
                      [-1, -1],
                  ]
                : [
                      [1, 0],
                      [-1, 0],
                      [0, 1],
                      [0, -1],
                  ];
            this.addEffect(def.detonate.spotAnim, tx + 0.5, ty + 0.5, 0, 40);
            for (const [dx, dy] of shape) {
                this.addEffect(def.detonate.spotAnim, tx + dx + 0.5, ty + dy + 0.5, 0, 40);
                for (const other of up) {
                    if (
                        other !== hero &&
                        Math.floor(other.player.x) === tx + dx &&
                        Math.floor(other.player.y) === ty + dy
                    ) {
                        hit.add(other.index);
                    }
                }
            }
        }
        const current = this.hero;
        for (const index of hit) {
            this.use(this.heroes[index]);
            this.akkhaHurt(boss, def, def.detonate.damage, true);
        }
        this.use(current);
    }

    private akkhaTile(at: { x: number; y: number }): number {
        return Math.floor(at.x) + Math.floor(at.y) * 4096;
    }

    // His next style, keeping his hitpoints, and the prayer that goes with it (EnemyDef.protects)
    private changeAkkhaForm(boss: Enemy, id: string): void {
        const form = getEnemy(id);
        boss.def = form;
        boss.attackSeq = form.attackSeq;
        boss.anim = "idle";
        boss.animStart = this.tick;
        boss.bossState!.cooldowns = form.boss?.attacks.map(() => 0) ?? [];
        this.appearanceVersion++;
        const style = form.protects?.styles[0] ?? "melee";
        const name = style === "ranged" ? "missiles" : style;
        this.emit({
            type: "notice",
            message: `Akkha turns to ${style}, and protects from ${name}!`,
        });
    }

    // Simon says: the symbols light up in an order, then he blasts all but the next one in it
    private startAkkhaMemory(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const memory = def.memory;
        // One more in his last phase (BossDef.phases)
        const last = (boss.bossState?.phase?.index ?? 0) >= 2 ? 1 : 0;
        const steps = Math.min(
            memory.most,
            memory.steps + Math.floor(this.tombsPathLevel / memory.perLevels) + last,
        );
        // Each next one beside the last, never across
        const order = [this.rng.int(4)];
        while (order.length < steps) {
            const last = order[order.length - 1];
            order.push((last + (this.rng.int(2) === 0 ? 1 : 3)) % 4);
        }
        const flash = secondsToTicks(memory.flash);
        const gap = secondsToTicks(memory.gap);
        const showEnd = this.tick + steps * (flash + gap);
        const burst = secondsToTicks(this.invoked("feeling_special") ? memory.quick : memory.burst);
        const from = { x: boss.x, y: boss.y };
        fight.memory = { order, start: this.tick, flash, gap, showEnd, burst, step: 0, from };
        // He's gone from the floor meanwhile: no attacks, nothing to hit
        const state = boss.bossState!;
        state.windup = undefined;
        state.channelEnd = Math.max(state.channelEnd, showEnd + burst * steps);
        const area = this.tombsPathRoom!.boss!.quadrants!;
        boss.x = boss.prevX = area.middle.x;
        boss.y = boss.prevY = area.middle.y;
        boss.vx = boss.vy = 0;
        boss.anim = "attack";
        boss.attackSeq = AKKHA_VANISH_SEQ;
        boss.animStart = this.tick;
        this.emit({ type: "notice", message: memory.message });
    }

    // Akkha with a shadow of his dead: he can be drawn into its quarter, so he comes on at whoever
    // he's after while his volleys go out (still standing to wind each up), as OSRS's is dragged.
    // Standing for every volley, his ranged and magic forms hardly took a step between his
    // specials, so he was never drawn in and the fight never went on.
    private akkhaDrawn(boss: Enemy): boolean {
        const fight = this.tombsAkkha;
        return (
            fight !== undefined &&
            fight.uid === boss.uid &&
            !fight.memory &&
            fight.shadows.some(
                (shadow) => !this.enemies.some((e) => e.uid === shadow.uid && !e.dead),
            )
        );
    }

    // Akkha's shadows while they're up: how many, and seconds till those still up flood
    get akkhaShadows(): { left: number; seconds: number } | undefined {
        const fight = this.tombsAkkha;
        if (!fight || fight.shadows.length === 0) {
            return undefined;
        }
        const left = fight.shadows.filter((s) =>
            this.enemies.some((e) => e.uid === s.uid && !e.dead),
        ).length;
        return { left, seconds: Math.max(0, (fight.floodTick - this.tick) / TICKS_PER_SECOND) };
    }

    // The symbol lit now while he shows the order, if any
    get akkhaLit(): number | undefined {
        const memory = this.tombsAkkha?.memory;
        if (!memory || this.tick >= memory.showEnd) {
            return undefined;
        }
        const into = this.tick - memory.start;
        const each = memory.flash + memory.gap;
        return into % each < memory.flash ? memory.order[Math.floor(into / each)] : undefined;
    }

    private stepAkkhaMemory(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const memory = fight.memory;
        if (!memory) {
            return;
        }
        const area = this.tombsPathRoom!.boss!.quadrants!;
        boss.x = boss.prevX = area.middle.x;
        boss.y = boss.prevY = area.middle.y;
        boss.vx = boss.vy = 0;
        boss.shieldEnd = Math.max(boss.shieldEnd, this.tick + 2);
        if (this.tick < memory.showEnd + memory.burst * (memory.step + 1)) {
            return;
        }
        // Everywhere but the next in the order goes up
        const safe = memory.order[memory.step];
        fight.bursts.push({
            quadrants: [0, 1, 2, 3].filter((q) => q !== safe),
            tick: this.tick,
            kind: "blast",
        });
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (this.akkhaQuadrant(player.x, player.y) !== safe) {
                this.akkhaHurt(boss, def, def.memory.damage, true);
            }
        });
        memory.step++;
        if (memory.step >= memory.order.length) {
            fight.memory = undefined;
            // Back where he was, or with a shadow of his dead, just inside its quarter: he's drawn
            // there meanwhile. Back in the middle (in no quarter) he was out of reach again, and
            // walked so slowly between his volleys that the next blast came before he got there.
            const at = this.akkhaReappear(fight, def, memory.from);
            boss.x = boss.prevX = at.x;
            boss.y = boss.prevY = at.y;
            boss.anim = "idle";
            boss.attackSeq = boss.def.attackSeq;
            boss.animStart = this.tick;
            this.emit({ type: "notice", message: "Akkha reappears!" });
        }
    }

    // Where he comes back after Memory Blast: in the dead shadow's quarter nearest where he
    // vanished, a step past the lines (AkkhaDef.shadows.inside), or where he vanished
    private akkhaReappear(
        fight: AkkhaFight,
        def: AkkhaDef,
        from: { x: number; y: number },
    ): { x: number; y: number } {
        const dead = fight.shadows.filter(
            (shadow) => !this.enemies.some((e) => e.uid === shadow.uid && !e.dead),
        );
        let best: { x: number; y: number } | undefined;
        let bestDistance = Infinity;
        for (const shadow of dead) {
            const at = this.akkhaCorner(shadow.quadrant, def.shadows.inside + 1);
            const distance = fm.hypot(at.x - from.x, at.y - from.y);
            if (distance < bestDistance) {
                best = at;
                bestDistance = distance;
            }
        }
        return best ?? from;
    }

    // His trailing orbs: one on every tile anyone leaves (and one ahead, with Feeling Special),
    // going off under whoever steps on one once it's armed
    private stepAkkhaOrbs(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const orbs = def.orbs;
        if (this.tick < fight.orbsUntil) {
            const area = this.tombsPathRoom!.boss!.quadrants!;
            const ahead = this.invoked("feeling_special");
            this.heroes.forEach((hero, i) => {
                const player = hero.player;
                const tile = this.akkhaTile(player);
                const last = fight.lastTiles[i];
                fight.lastTiles[i] = tile;
                if (last === undefined || last === tile || !this.isUp(hero)) {
                    return;
                }
                const from = { x: (last % 4096) + 0.5, y: Math.floor(last / 4096) + 0.5 };
                const drops = [from];
                if (ahead) {
                    const dx = Math.floor(player.x) + 0.5 - from.x;
                    const dy = Math.floor(player.y) + 0.5 - from.y;
                    drops.push({ x: from.x + dx * 3, y: from.y + dy * 3 });
                }
                for (const at of drops) {
                    const inside =
                        Math.abs(at.x - area.middle.x) < area.half &&
                        Math.abs(at.y - area.middle.y) < area.half;
                    const taken = fight.orbs.some(
                        (orb) => Math.abs(orb.x - at.x) < 0.5 && Math.abs(orb.y - at.y) < 0.5,
                    );
                    if (inside && !taken) {
                        fight.orbs.push({
                            ...at,
                            quadrant: this.akkhaQuadrant(at.x, at.y),
                            armTick: this.tick + secondsToTicks(orbs.arm),
                        });
                    }
                }
            });
        } else if (this.tick >= fight.orbsUntil + secondsToTicks(orbs.linger)) {
            fight.orbs = [];
            return;
        }
        const scale = boss.damageScale;
        fight.orbs = fight.orbs.filter((orb) => {
            if (this.tick < orb.armTick) {
                return true;
            }
            let hit = false;
            this.forEachHeroInReach(() => {
                const player = this.player;
                if (fm.hypot(player.x - orb.x, player.y - orb.y) <= orbs.radius + player.radius) {
                    hit = true;
                    this.akkhaHurt(boss, def, Math.round(orbs.damage * scale), false);
                }
            });
            if (hit) {
                this.addEffect(def.elements[orb.quadrant].spotAnim, orb.x, orb.y, 0, 30);
            }
            return !hit;
        });
    }

    // His shadows: at each of their shares of his hitpoints, one in each quadrant's corner, and
    // he can't be hurt but standing in a quadrant whose shadow's dead, till they all are. Each
    // still up floods its quadrant now and then.
    private stepAkkhaShadows(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const shadows = def.shadows;
        if (
            fight.shadowsDone < shadows.at.length &&
            boss.hp <= boss.maxHp * shadows.at[fight.shadowsDone]
        ) {
            let next = fight.shadowsDone + 1;
            while (next < shadows.at.length && boss.hp <= boss.maxHp * shadows.at[next]) {
                next++;
            }
            const again = fight.shadowsDone > 0;
            fight.shadowsDone = next;
            this.spawnAkkhaShadows(fight, def);
            this.emit({
                type: "notice",
                message: again ? "The shadows in the room are restored!" : shadows.message,
            });
        }
        if (fight.shadows.length === 0) {
            return;
        }
        const alive = (uid: number) =>
            this.enemies.some((enemy) => enemy.uid === uid && !enemy.dead);
        if (!fight.shadows.some((shadow) => alive(shadow.uid))) {
            fight.shadows = [];
            this.emit({ type: "notice", message: shadows.endMessage });
            return;
        }
        // Drawn into a quadrant whose shadow's dead, he can be hurt: well inside it, not
        // straddling its lines
        const quadrant = this.akkhaQuadrant(boss.x, boss.y);
        const middle = this.tombsPathRoom!.boss!.quadrants!.middle;
        const inside =
            Math.abs(boss.x - middle.x) >= shadows.inside &&
            Math.abs(boss.y - middle.y) >= shadows.inside;
        const open = inside && fight.shadows.some((s) => s.quadrant === quadrant && !alive(s.uid));
        if (!open) {
            boss.shieldEnd = Math.max(boss.shieldEnd, this.tick + 2);
        }
        // Once one's struck, the rest are out of reach till they're restored
        if (fight.shadowStruck !== undefined) {
            for (const shadow of fight.shadows) {
                const enemy = this.enemies.find((e) => e.uid === shadow.uid && !e.dead);
                if (enemy && shadow.uid !== fight.shadowStruck) {
                    enemy.shieldEnd = Math.max(enemy.shieldEnd, this.tick + 2);
                }
            }
        }
        // One timer for them all (the hourglass on the wall), waiting while he shows his order:
        // when it runs out, every quadrant whose shadow's still up floods, and it starts again
        if (fight.memory) {
            fight.floodTick++;
            return;
        }
        if (this.tick === fight.floodTick - secondsToTicks(shadows.warn)) {
            this.emit({ type: "notice", message: shadows.warnMessage });
        }
        if (this.tick < fight.floodTick) {
            return;
        }
        fight.floodTick = this.tick + secondsToTicks(shadows.flood);
        const flooded = fight.shadows.filter((s) => alive(s.uid)).map((s) => s.quadrant);
        fight.bursts.push({ quadrants: flooded, tick: this.tick, kind: "flood" });
        this.emit({ type: "notice", message: shadows.floodMessage });
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (flooded.includes(this.akkhaQuadrant(player.x, player.y))) {
                this.akkhaHurt(boss, def, shadows.damage, true);
            }
        });
    }

    private spawnAkkhaShadows(fight: AkkhaFight, def: AkkhaDef): void {
        for (const shadow of fight.shadows) {
            const enemy = this.enemies.find((e) => e.uid === shadow.uid && !e.dead);
            if (enemy) {
                this.vanish(enemy);
            }
        }
        const look = getEnemy(def.shadows.enemyId);
        fight.floodTick = this.tick + secondsToTicks(def.shadows.flood);
        fight.shadows = [];
        fight.shadowStruck = undefined;
        const boss = this.enemies.find((e) => e.uid === fight.uid);
        for (let quadrant = 0; quadrant < 4; quadrant++) {
            const at = this.akkhaCorner(quadrant, def.shadows.corner);
            const enemy = this.spawnEnemy(look, "normal", at);
            if (enemy) {
                // A share of his hitpoints, raid level, party and all
                if (boss) {
                    enemy.hp = enemy.maxHp = Math.round(boss.maxHp * def.shadows.hpShare);
                }
                fight.shadows.push({ uid: enemy.uid, quadrant });
            }
        }
    }

    // His final stand: in a corner, sending Unstable Orbs straight across the floor, and off to
    // another corner once he's been hurt enough there, or been there long enough
    private stepAkkhaStand(
        boss: Enemy,
        fight: AkkhaFight,
        def: AkkhaDef,
        stand: NonNullable<AkkhaDef["unstable"]>,
    ): void {
        if (!fight.stand) {
            for (const shadow of fight.shadows) {
                const enemy = this.enemies.find((e) => e.uid === shadow.uid && !e.dead);
                if (enemy) {
                    this.vanish(enemy);
                }
            }
            fight.shadows = [];
            fight.memory = undefined;
            fight.orbs = [];
            fight.orbsUntil = 0;
            fight.stand = { corner: -1, nextTick: this.tick, since: this.tick, hpAt: boss.hp };
            this.moveAkkhaCorner(boss, fight, def);
        }
        const at = this.akkhaCorner(fight.stand.corner, def.shadows.corner);
        boss.x = boss.prevX = at.x;
        boss.y = boss.prevY = at.y;
        boss.vx = boss.vy = 0;
        const party = 1 + 0.5 * Math.max(0, this.heroes.length - 1);
        if (
            fight.stand.hpAt - boss.hp >= boss.maxHp * stand.moveAfter * party ||
            this.tick - fight.stand.since >= secondsToTicks(stand.moveSeconds)
        ) {
            this.moveAkkhaCorner(boss, fight, def);
        }
        if (this.tick < fight.stand.nextTick) {
            return;
        }
        const every = Math.max(stand.least, stand.every - 0.05 * this.tombsPathWeight);
        fight.stand.nextTick = this.tick + secondsToTicks(every);
        this.fireUnstableOrb(boss, stand);
    }

    private moveAkkhaCorner(boss: Enemy, fight: AkkhaFight, def: AkkhaDef): void {
        const stand = fight.stand!;
        const corners = [0, 1, 2, 3].filter((q) => q !== stand.corner);
        stand.corner = corners[this.rng.int(corners.length)];
        stand.since = this.tick;
        stand.hpAt = boss.hp;
        const at = this.akkhaCorner(stand.corner, def.shadows.corner);
        boss.x = boss.prevX = at.x;
        boss.y = boss.prevY = at.y;
        boss.anim = "attack";
        boss.attackSeq = AKKHA_VANISH_SEQ;
        boss.animStart = this.tick;
    }

    // An Unstable Orb in from a side of the floor, straight across or on a slant, as its arrow says
    private fireUnstableOrb(boss: Enemy, stand: NonNullable<AkkhaDef["unstable"]>): void {
        const attack = boss.def.boss!.attacks.find((a) => a.kind === "pattern");
        const area = this.tombsPathRoom!.boss!.quadrants!;
        if (!attack) {
            return;
        }
        const side = this.rng.int(4);
        const along = this.rng.range(-area.half + 2, area.half - 2);
        const edge = area.half - 0.5;
        // In from the north, east, south or west, heading across
        const [x, y, inX, inY] = [
            [along, edge, 0, -1],
            [edge, along, -1, 0],
            [along, -edge, 0, 1],
            [-edge, along, 1, 0],
        ][side];
        const slant = (this.rng.int(3) - 1) * (Math.PI / 4);
        const angle = fm.atan2(inY, inX) + slant;
        const speed = stand.speed / TICKS_PER_SECOND;
        const life = Math.ceil((area.half * 2.4) / speed);
        this.bullets.add(
            area.middle.x + x,
            area.middle.y + y,
            fm.cos(angle) * speed,
            fm.sin(angle) * speed,
            0,
            attack.pattern!.radius,
            this.getBossDamage(boss, attack),
            life,
            this.bulletSourceFor(boss, attack),
            this.tick,
        );
    }

    // Keep Back: beside him, his ranged and magic come with a melee hit first, unseen
    private akkhaKeepBack(boss: Enemy): void {
        if (!this.invoked("keep_back") || boss.def.protects?.styles[0] === "melee") {
            return;
        }
        const melee = getEnemy(boss.def.boss!.akkha!.forms[0]).boss!.attacks[0];
        const damage = this.getBossDamage(boss, melee);
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (
                fm.hypot(player.x - boss.x, player.y - boss.y) <=
                boss.radius + player.radius + 1.2
            ) {
                this.bossHit(boss.def.id, boss, melee, damage, false);
            }
        });
    }

    // Dev only: past a Tombs room to its boss, for testing the boss without the puzzle each time.
    // The room counts as done, with nothing for it.
    devSkipToTombsBoss(): boolean {
        const room = this.tombsRoom;
        const boss = this.tombsPathRoom?.boss;
        if (!room || room.boss || room.doneTick !== undefined) {
            return false;
        }
        room.pending = [];
        room.issue = undefined;
        room.doneTick = this.tick;
        // No boss for the path yet: the room's just done
        if (!boss) {
            return true;
        }
        this.enterTombsBoss(room, boss, true);
        // Something to do some damage with, weapon slots or not
        if (!this.weapons.some((w) => w.def.id === DEV_BOSS_WEAPON)) {
            this.weapons.push({
                def: getWeapon(DEV_BOSS_WEAPON),
                level: 1,
                cooldown: TICKS_PER_SECOND,
                bonus: 0,
                uses: 0,
            });
            this.weaponSince[DEV_BOSS_WEAPON] ??= this.tick;
            this.appearanceVersion++;
        }
        return true;
    }

    // Dev only: past all four paths to the Wardens' room, with the best of everything: the
    // shop's every upgrade (its weapon and passive slots too), DEV_WARDENS_KIT at its last level,
    // each piece as far as the Armoury takes it, on full hitpoints. False if there's nowhere to go.
    devToWardens(kit = true): boolean {
        const tombs = this.map.tombs;
        if (!tombs?.wardens || this.tombsPath !== undefined || this.tombsWardens) {
            return false;
        }
        for (const path of tombs.paths) {
            if (!this.tombsPathsDone.includes(path.id)) {
                this.tombsPathsDone.push(path.id);
            }
        }
        if (kit) {
            this.devWardensKit();
        }
        this.enterWardens();
        if (!kit) {
            this.emit({
                type: "notice",
                message: "The Wardens (dev): every path done, as you are.",
            });
            return true;
        }
        this.emit({
            type: "notice",
            message: "The Wardens (dev): every path done, best of everything.",
        });
        return true;
    }

    // Dev only: from the Nexus into a path and straight to its boss, as the party is (the dev skip
    // hands over a bow to do some damage with), for trying a boss's mechanics
    devToTombsBoss(pathId: string): boolean {
        const path = this.map.tombs?.paths.find((p) => p.id === pathId);
        if (!path?.room?.boss || this.tombsPath !== undefined || this.tombsWardens) {
            return false;
        }
        this.enterTombsPath(path.id, path.room.arrive);
        return this.devSkipToTombsBoss();
    }

    // Dev only (and the Tombs' sims): the whole party fitted with the best of everything, the
    // shop's every upgrade, DEV_WARDENS_KIT at its last level, each piece as far as the Armoury
    // takes it, on full hitpoints
    devWardensKit(): void {
        const current = this.hero;
        for (const hero of this.heroes) {
            this.use(hero);
            for (const upgrade of SHOP_UPGRADES) {
                hero.metaStats[upgrade.stat] = upgrade.perRank * upgrade.maxRank;
            }
            this.weapons.length = 0;
            for (const id of DEV_WARDENS_KIT.weapons) {
                const def = getWeapon(id);
                this.weapons.push({
                    def,
                    level: def.levels.length,
                    cooldown: TICKS_PER_SECOND,
                    bonus: 0,
                    uses: 0,
                });
                this.weaponSince[id] ??= this.tick;
            }
            this.passives.length = 0;
            for (const id of DEV_WARDENS_KIT.passives) {
                const def = getPassive(id);
                this.passives.push({
                    id,
                    level: def.maxLevel,
                    value: getPassiveGain(def, "veryRare") * def.maxLevel,
                });
            }
            for (const id of DEV_WARDENS_KIT.gear) {
                this.equip(id, getUpgradeLine(id).length - 1);
            }
            this.updateStats();
            this.player.hp = this.player.maxHp;
            this.appearanceVersion++;
        }
        this.use(current);
    }

    // Into the Wardens' room, the whole party, with what's on the floor
    private enterWardens(): void {
        if (this.wardensFromTick < 0) {
            this.wardensFromTick = this.tick;
        }
        this.tombsDoors.clear();
        this.gatherHall();
        this.moveParty(this.map.tombs!.wardens!.arrive);
        this.startWardens();
        this.forfeitTombsBundles();
    }

    // Into the Wardens' fight: the obelisk and the two Wardens on their platforms, the first orbs a
    // moment off
    private startWardens(): void {
        const places = this.map.tombs?.wardens;
        if (!places) {
            return;
        }
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                this.vanish(enemy);
            }
        }
        // As tough as a path's boss would be after every path (TOMBS_BOSSES)
        const obeliskDef = getEnemy(WARDENS.obeliskId);
        const obelisk = this.spawnEnemy(
            obeliskDef,
            "boss",
            places.obelisk,
            obeliskDef.hp *
                this.map.difficulty.hp *
                (1 + TOMBS_BOSSES.levelHp * this.tombsPathWeight),
        );
        const elidinis = this.spawnEnemy(
            getEnemy(WARDENS.wardens.elidinis.enemyId),
            "normal",
            places.elidinis,
        );
        const tumeken = this.spawnEnemy(
            getEnemy(WARDENS.wardens.tumeken.enemyId),
            "normal",
            places.tumeken,
        );
        if (!obelisk || !elidinis || !tumeken) {
            return;
        }
        // Each side takes the three troughs in an order of its own
        const order = (): number[] => {
            const rows = [0, 1, 2];
            for (let i = rows.length - 1; i > 0; i--) {
                const j = this.rng.int(i + 1);
                [rows[i], rows[j]] = [rows[j], rows[i]];
            }
            return rows;
        };
        this.tombsWardens = {
            phase: 1,
            startTick: this.tick,
            obeliskUid: obelisk.uid,
            wardens: { elidinis: elidinis.uid, tumeken: tumeken.uid },
            charge: { ...WARDENS.charge.start },
            spent: { elidinis: 0, tumeken: 0 },
            pausedUntil: { elidinis: 0, tumeken: 0 },
            next: { elidinis: "pyramids", tumeken: "pyramids" },
            troughs: { elidinis: order(), tumeken: order() },
            trough: { elidinis: 0, tumeken: 0 },
            nextOrbTick: this.tick + secondsToTicks(WARDENS.startDelay),
            orbs: [],
            pyramids: [],
            shots: [],
            marks: [],
        };
        this.emit({ type: "notice", message: WARDENS.message });
    }

    // The Wardens' first phase, each tick: the obelisk's orbs down the troughs (or blocked), the
    // Wardens charging and discharging, their pyramids and shots, and the obelisk breaking
    private stepWardens(): void {
        const fight = this.tombsWardens;
        const places = this.map.tombs?.wardens;
        if (!fight || !places) {
            return;
        }
        this.stepWardenMarks(fight);
        this.landWardenShots(fight);
        if (fight.phase === 2) {
            this.stepWardensTwo(fight, places);
            return;
        }
        if (fight.phase === 3) {
            this.stepWardensThree(fight);
            return;
        }
        const obelisk = this.enemies.find((e) => e.uid === fight.obeliskUid);
        if (!obelisk || obelisk.dead) {
            this.endWardensPhaseOne(fight);
            return;
        }
        const sides: WardenSide[] = ["elidinis", "tumeken"];
        const haste = this.invoked("ancient_haste");
        const step = secondsToTicks(WARDENS.orbs.stepSeconds);
        // The next orbs, a side at a time
        if (this.tick >= fight.nextOrbTick) {
            fight.nextOrbTick = this.tick + secondsToTicks(WARDENS.orbs.every);
            for (const side of sides) {
                const { spawn } = places.sides[side];
                obelisk.anim = "attack";
                obelisk.attackSeq = obelisk.def.attackSeq;
                obelisk.animStart = this.tick;
                const row = fight.troughs[side][fight.trough[side] % 3];
                fight.orbs.push({
                    side,
                    row,
                    step: 0,
                    stepTick: this.tick,
                    fromX: spawn.x,
                    fromY: spawn.y,
                    x: spawn.x,
                    y: spawn.y,
                });
            }
        }
        // Orbs soaked: walked into along the trough (not on the spawn tile), one's gone before
        // its Warden has it, and its energy goes to whoever took it, for power against the
        // obelisk, one too many hurting
        const soak = WARDENS.orbs.soak;
        const current = this.hero;
        fight.orbs = fight.orbs.filter((orb) => {
            if (orb.step === 0) {
                return true;
            }
            const t = Math.min(1, (this.tick - orb.stepTick) / step);
            const x = orb.fromX + (orb.x - orb.fromX) * t;
            const y = orb.fromY + (orb.y - orb.fromY) * t;
            for (const hero of this.heroes) {
                const player = hero.player;
                if (
                    !this.isUp(hero) ||
                    fm.hypot(player.x - x, player.y - y) > soak.reach + player.radius
                ) {
                    continue;
                }
                this.use(hero);
                this.addEffect(WARDENS.shot.impactSpotAnim, player.x, player.y, 0, 30);
                if (hero.wardenEnergy >= soak.max) {
                    this.damagePlayer(
                        player.maxHp * this.tombsShare(soak.overShare),
                        WARDENS.obeliskId,
                        false,
                        undefined,
                        true,
                    );
                } else {
                    hero.wardenEnergy++;
                    hero.wardenEnergyTick = this.tick + secondsToTicks(soak.fade);
                }
                this.use(current);
                return false;
            }
            return true;
        });
        // Held energy fades, one at a time
        for (const hero of this.heroes) {
            if (hero.wardenEnergy > 0 && this.tick >= hero.wardenEnergyTick) {
                hero.wardenEnergy--;
                hero.wardenEnergyTick = this.tick + secondsToTicks(soak.fade);
            }
        }
        // The orbs a step on, each down its trough: across to its row, then along it
        fight.orbs = fight.orbs.filter((orb) => {
            if (this.tick - orb.stepTick < step) {
                return true;
            }
            if (orb.step >= WARDENS.orbs.steps) {
                // There: its Warden charges, and the next orb takes the next trough
                fight.charge[orb.side] += haste
                    ? WARDENS.charge.haste.perOrb
                    : WARDENS.charge.perOrb;
                fight.trough[orb.side]++;
                return false;
            }
            const side = places.sides[orb.side];
            const dir = Math.sign(side.end - side.spawn.x);
            const rowY = places.troughs[orb.row];
            orb.fromX = orb.x;
            orb.fromY = orb.y;
            orb.x += dir;
            orb.y += Math.sign(rowY - orb.y) * Math.min(1, Math.abs(rowY - orb.y));
            orb.step++;
            orb.stepTick = this.tick;
            return true;
        });
        // The Wardens charge, and full, discharge: pyramids, then a shot, then pyramids
        for (const side of sides) {
            if (this.tick < fight.pausedUntil[side]) {
                continue;
            }
            fight.charge[side] +=
                (haste ? WARDENS.charge.haste.perSecond : WARDENS.charge.perSecond) /
                TICKS_PER_SECOND;
            if (fight.charge[side] < WARDENS.charge.full) {
                continue;
            }
            fight.spent[side] += fight.charge[side];
            fight.charge[side] = 0;
            fight.pausedUntil[side] = this.tick + secondsToTicks(WARDENS.discharge.pause);
            this.dischargeWarden(fight, side, places);
        }
        // Pyramids hurt whoever's under one, every so often while they glow, and go
        const pyramids = WARDENS.pyramids;
        const every = Math.max(1, secondsToTicks(pyramids.every));
        fight.pyramids = fight.pyramids.filter((pyramid) => {
            const since = this.tick - pyramid.startTick;
            if (since >= secondsToTicks(pyramids.leave)) {
                return false;
            }
            const from = secondsToTicks(pyramids.firstHit);
            if (
                since >= from &&
                since <= secondsToTicks(pyramids.lastHit) &&
                (since - from) % every === 0
            ) {
                this.forEachHeroInReach(() => {
                    const { x, y } = this.player;
                    if (
                        this.isUp(this.hero) &&
                        x >= pyramid.x &&
                        x < pyramid.x + pyramids.cell &&
                        y >= pyramid.y &&
                        y < pyramid.y + pyramids.cell
                    ) {
                        this.damagePlayer(
                            pyramids.damage * this.tombsHazardScale(),
                            WARDENS.wardens[pyramid.side].enemyId,
                            false,
                        );
                    }
                });
            }
            return true;
        });
    }

    // A Warden's charge spent: its attack (pyramids over its cells of the floor, or a shot at each
    // player), with its seal before it
    private dischargeWarden(
        fight: WardensFight,
        side: WardenSide,
        places: TombsWardensPlaces,
    ): void {
        const def = WARDENS.wardens[side];
        const warden = this.enemies.find((e) => e.uid === fight.wardens[side]);
        const at = places[side];
        if (warden) {
            warden.anim = "attack";
            warden.attackSeq = WARDENS.discharge.seq;
            warden.animStart = this.tick;
        }
        const attack = fight.next[side];
        fight.next[side] = attack === "pyramids" ? "shot" : "pyramids";
        // The obelisk flickers open as it gives up its charge (WardensDef flicker)
        const flicker = WARDENS.flicker;
        if (flicker) {
            const seconds = this.invoked("ancient_haste") ? flicker.haste : flicker.seconds;
            fight.flickerUntil = Math.max(
                fight.flickerUntil ?? 0,
                this.tick + secondsToTicks(seconds),
            );
        }
        if (attack === "pyramids" && fight.pyramidsDone === undefined) {
            fight.pyramidsDone = this.tick + secondsToTicks(WARDENS.pyramids.leave);
        }
        if (attack === "pyramids") {
            this.addEffect(def.pyramidsSpotAnim, at.x, at.y, 0, secondsToTicks(4));
            const { cell, cols, rows, from } = WARDENS.pyramids;
            const x0 = places.floor.x0 + from.x;
            const y0 = places.floor.y0 + from.y;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    // Elidinis' the odd cells, Tumeken's the even
                    if ((i + j) % 2 !== (side === "elidinis" ? 1 : 0)) {
                        continue;
                    }
                    const x = x0 + i * cell;
                    const y = y0 + j * cell;
                    // None on the obelisk
                    if (
                        Math.abs(x + cell / 2 - places.obelisk.x) < cell &&
                        Math.abs(y + cell / 2 - places.obelisk.y) < cell
                    ) {
                        continue;
                    }
                    fight.pyramids.push({
                        side,
                        x,
                        y,
                        startTick: this.tick + secondsToTicks(WARDENS.pyramids.appear),
                    });
                }
            }
            return;
        }
        this.addEffect(def.shotSeal, at.x, at.y, 0, secondsToTicks(4));
        this.emit({ type: "notice", message: "A large ball of energy is shot your way..." });
        this.heroes.forEach((hero, index) => {
            if (this.isUp(hero)) {
                fight.shots.push({
                    side,
                    hero: index,
                    startTick: this.tick,
                    landTick: this.tick + secondsToTicks(WARDENS.shot.flight),
                });
            }
        });
    }

    // The first phase's obelisk, open as a Warden discharges (WardensDef flicker)
    obeliskFlickers(enemy: Enemy): boolean {
        const fight = this.tombsWardens;
        return (
            fight?.phase === 1 &&
            enemy.uid === fight.obeliskUid &&
            this.tick < (fight.flickerUntil ?? 0)
        );
    }

    // Whether the second phase's obelisk is striking with a special, or will within seconds
    // (BossAttackDef.clearOfObelisk)
    private obeliskStrikesWithin(seconds: number): boolean {
        const two = this.tombsWardens?.phase === 2 ? this.tombsWardens.two : undefined;
        if (!two) {
            return false;
        }
        const soon = this.tick + secondsToTicks(seconds);
        return (
            (two.current !== undefined && this.tick < two.current.endTick) || soon >= two.nextOpen
        );
    }

    // The obelisk broken: the Warden that's charged the more over the phase wakes (Tumeken's on a
    // tie), so the side a player kept soaking loses whenever its last attack was; the other blows
    // up, and what's in the air from it is gone
    private endWardensPhaseOne(fight: WardensFight): void {
        const total = (side: WardenSide) => fight.charge[side] + fight.spent[side];
        const winner: WardenSide = total("elidinis") > total("tumeken") ? "elidinis" : "tumeken";
        const loser: WardenSide = winner === "elidinis" ? "tumeken" : "elidinis";
        fight.winner = winner;
        fight.phase = 2;
        for (const hero of this.heroes) {
            hero.wardenEnergy = 0;
        }
        this.wardensFood();
        fight.orbs = [];
        fight.pyramids = [];
        fight.shots = fight.shots.filter((shot) => shot.side === winner);
        fight.two = {
            wakeTick: this.tick + secondsToTicks(WARDENS.two.wake),
            wreckUid: fight.wardens[loser],
            form: 0,
            shield: 0,
            shieldMax: 1,
            nextOpen: 0,
            special: this.rng.int(3),
            skulls: [],
        };
        const woken = this.enemies.find((e) => e.uid === fight.wardens[winner]);
        if (woken) {
            this.animate(woken, WARDENS.two.wakeSeq);
        }
        const lost = this.enemies.find((e) => e.uid === fight.wardens[loser]);
        if (lost) {
            lost.anim = "attack";
            lost.attackSeq = lost.def.deathSeq;
            lost.animStart = this.tick;
            this.addEffect(TOMBS_SPOTANIMS.wardenBlowsUp, lost.x, lost.y, 0, secondsToTicks(7));
        }
        this.emit({
            type: "notice",
            message: `${WARDENS.endMessage} As ${WARDENS.wardens[loser].name} falls, ${WARDENS.wardens[winner].name} powers up!`,
        });
    }

    // The Wardens' bar on the HUD, over what's fought: which phase, the shield filling or its
    // hitpoints, and what to do
    wardensBar(
        enemy: Enemy,
    ): { phase: number; stage: "shield" | "hp"; fraction: number; status: string } | undefined {
        const fight = this.tombsWardens;
        if (!fight) {
            return undefined;
        }
        const left = Math.max(0, enemy.hp) / enemy.maxHp;
        if (fight.phase === 1 && enemy.uid === fight.obeliskUid) {
            const energy = this.hero.wardenEnergy;
            const held =
                (fight.pyramidsDone === undefined || this.tick < fight.pyramidsDone) &&
                enemy.hp <= enemy.maxHp * WARDENS.holdShare;
            return {
                phase: 1,
                stage: "hp",
                fraction: left,
                status: held
                    ? "It holds till the Wardens' pyramids have come!"
                    : energy > 0
                      ? `Break the obelisk! Soaked ${energy}`
                      : "Break the obelisk!",
            };
        }
        const two = fight.two;
        if (fight.phase === 2 && two && enemy.uid === two.wardenUid) {
            const percent = `${Math.ceil(left * 100)}%`;
            if (two.kneel || two.endTick !== undefined) {
                return {
                    phase: 2,
                    stage: "hp",
                    fraction: left,
                    status: two.kneel ? "Its core's out: hit the core!" : "Down!",
                };
            }
            const style = WARDENS.two.forms[fight.winner!].styles[two.form];
            return {
                phase: 2,
                stage: "shield",
                fraction: two.shield / two.shieldMax,
                status: `Only ${style} fills its shield (${percent} left)`,
            };
        }
        const three = fight.three;
        if (fight.phase === 3 && three && enemy.uid === three.wardenUid) {
            return {
                phase: 3,
                stage: "hp",
                fraction: left,
                status: three.siphons
                    ? "It can't be hurt: step on its siphons!"
                    : three.enraged
                      ? "Enraged! The floor's going!"
                      : "Keep off the side it slams!",
            };
        }
        return undefined;
    }

    // Marks landing (WardensFight marks): whoever's on a mark's tile as it lands is hit, once a
    // tick however many land there; spent ones go
    private stepWardenMarks(fight: WardensFight): void {
        if (fight.marks.length === 0) {
            return;
        }
        let hit = 0;
        fight.marks = fight.marks.filter((mark) => {
            if (mark.from === this.tick && mark.hurts > 0) {
                const tileX = Math.floor(mark.x);
                const tileY = Math.floor(mark.y);
                this.forEachHeroInReach(() => {
                    const hero = this.hero;
                    const player = this.player;
                    const bit = 1 << hero.index;
                    if (
                        this.isUp(hero) &&
                        (hit & bit) === 0 &&
                        Math.floor(player.x) === tileX &&
                        Math.floor(player.y) === tileY
                    ) {
                        hit |= bit;
                        this.damagePlayer(
                            Math.max(1, Math.round(player.maxHp * this.tombsShare(mark.hurts))),
                            mark.by,
                            false,
                            undefined,
                            true,
                        );
                    }
                });
            }
            return mark.to > this.tick;
        });
    }

    // Shots land on whoever they were for, wherever they are
    private landWardenShots(fight: WardensFight): void {
        fight.shots = fight.shots.filter((shot) => {
            if (this.tick < shot.landTick) {
                return true;
            }
            const hero = this.heroes[shot.hero];
            if (hero && this.isUp(hero)) {
                const current = this.hero;
                this.use(hero);
                const player = this.player;
                this.damagePlayer(
                    player.maxHp * this.tombsShare(WARDENS.wardens[shot.side].shotShare),
                    WARDENS.wardens[shot.side].enemyId,
                    false,
                    undefined,
                    true,
                );
                this.addEffect(WARDENS.shot.impactSpotAnim, player.x, player.y, 0, 30);
                this.use(current);
            }
            return false;
        });
    }

    // What the Wardens' fights are multiplied by: as a path's boss would be after every path
    private wardensHp(): number {
        return this.map.difficulty.hp * (1 + TOMBS_BOSSES.levelHp * this.tombsPathWeight);
    }

    // The second phase, each tick: the Warden waking, then its shield and core, and the obelisk's
    // specials while it's up
    private stepWardensTwo(fight: WardensFight, places: TombsWardensPlaces): void {
        const two = fight.two!;
        const def = WARDENS.two;
        if (two.wardenUid === undefined) {
            if (this.tick >= two.wakeTick) {
                this.wakeWarden(fight, two, places);
            }
            return;
        }
        if (two.endTick !== undefined) {
            if (this.tick >= two.endTick) {
                this.startWardensThree(fight, places);
            }
            return;
        }
        const warden = this.enemies.find((e) => e.uid === two.wardenUid);
        if (!warden || warden.dead) {
            return;
        }
        if (warden.hp <= 0) {
            this.downWardenTwo(fight, two, warden);
            return;
        }
        // Acceleration: its attacks come quicker
        const windup = warden.bossState?.windup;
        if (this.invoked("acceleration") && windup?.startTick === this.tick) {
            warden.attackCooldown = Math.round((warden.attackCooldown * 6) / 7);
        }
        two.skulls = two.skulls.filter((skull) => skull.landTick > this.tick);
        // The obelisk keeps on whatever the Warden's doing (OSRS's stops while the core's out:
        // here, the core's hit dodging it)
        this.stepWardenObelisk(fight, two, places);
        const forms = def.forms[fight.winner!];
        const kneel = two.kneel;
        if (kneel) {
            if (kneel.coreUid === undefined) {
                if (this.tick >= kneel.coreTick) {
                    this.throwWardenCore(two, warden, forms.core);
                }
            } else if (kneel.standTick === undefined) {
                if (this.tick >= kneel.backTick!) {
                    const core = this.enemies.find((e) => e.uid === kneel.coreUid);
                    if (core && !core.dead) {
                        this.vanish(core);
                    }
                    this.animate(warden, def.standSeq);
                    kneel.standTick = this.tick + secondsToTicks(def.stand);
                }
            } else if (this.tick >= kneel.standTick) {
                // Up again, the other style open
                two.form = two.form === 0 ? 1 : 0;
                this.reform(warden, forms.forms[two.form]);
                two.shield = 0;
                two.kneel = undefined;
                this.emit({
                    type: "notice",
                    message: `${def.standMessage} Only ${forms.styles[two.form]} fills its shield now.`,
                });
            }
        }
    }

    // Seconds between the obelisk's specials (Acceleration: a quarter sooner, as OSRS's 22 ticks
    // are to 30)
    private obeliskEvery(): number {
        const every = WARDENS.two.obelisk.every;
        return this.invoked("acceleration") ? every * ACCELERATION.obeliskEvery : every;
    }

    // An enemy's attack animation, from now
    private animate(enemy: Enemy, seq: number): void {
        enemy.anim = "attack";
        enemy.attackSeq = seq;
        enemy.animStart = this.tick;
    }

    // An enemy into another of its forms, keeping its hitpoints, with nothing wound up
    private reform(enemy: Enemy, id: string): void {
        const form = getEnemy(id);
        enemy.def = form;
        enemy.attackSeq = form.attackSeq;
        enemy.anim = "idle";
        enemy.animStart = this.tick;
        if (enemy.bossState) {
            enemy.bossState.windup = undefined;
        }
        this.appearanceVersion++;
    }

    // The obelisk broken, the Warden with the more charge stands, out of its alcove into the
    // room, and the obelisk comes back charged; the other's left a wreck
    private wakeWarden(fight: WardensFight, two: WardensTwo, places: TombsWardensPlaces): void {
        const def = WARDENS.two;
        const winner = fight.winner!;
        const forms = def.forms[winner];
        const dormant = this.enemies.find((e) => e.uid === fight.wardens[winner]);
        if (dormant && !dormant.dead) {
            this.vanish(dormant);
        }
        const at = places[winner];
        const out = { x: at.x + Math.sign(places.obelisk.x - at.x) * 5, y: at.y };
        const warden = this.spawnEnemy(
            getEnemy(forms.forms[0]),
            "boss",
            out,
            def.hp * this.wardensHp(),
        );
        if (!warden) {
            return;
        }
        const obelisk = this.spawnEnemy(getEnemy(def.obeliskId), "normal", places.obelisk);
        const wreck = this.enemies.find((e) => e.uid === two.wreckUid);
        if (wreck && !wreck.dead) {
            this.reform(wreck, forms.wreck);
        }
        two.wardenUid = warden.uid;
        two.obeliskUid = obelisk?.uid;
        two.shieldMax = warden.maxHp * def.shield;
        // Acceleration: sooner, as OSRS's 28 ticks are to 36
        two.nextOpen =
            this.tick +
            secondsToTicks(
                def.obelisk.firstOpen * (this.invoked("acceleration") ? ACCELERATION.firstOpen : 1),
            );
        this.emit({
            type: "notice",
            message: `${def.message} Only ${forms.styles[0]} fills its shield now.`,
        });
    }

    // A hit on the Warden or its core, in the second phase (damageEnemy): the Warden's fills its
    // shield, and full, it kneels; the core's comes off the Warden, five times over. What's shown.
    private wardenTakes(enemy: Enemy, damage: number, two: WardensTwo): number {
        if (enemy.uid === two.kneel?.coreUid) {
            const warden = this.enemies.find((e) => e.uid === two.wardenUid);
            const dealt = damage * WARDENS.two.coreMultiplier;
            if (warden) {
                warden.hp -= dealt;
                warden.flash = 5;
            }
            return dealt;
        }
        if (enemy.uid === two.wardenUid && !two.kneel && two.endTick === undefined) {
            // What its shield had room for, as Kephri's shield counts (kephriTakes)
            const taken = Math.min(damage, two.shieldMax - two.shield);
            two.shield += taken;
            if (two.shield >= two.shieldMax) {
                this.kneelWarden(two, enemy);
            }
            return taken;
        }
        return 0;
    }

    // Its shield full: down on a knee, its attacks stopped
    private kneelWarden(two: WardensTwo, warden: Enemy): void {
        const fight = this.tombsWardens!;
        const def = WARDENS.two;
        this.reform(warden, def.forms[fight.winner!].exposed);
        this.animate(warden, def.kneelSeq);
        two.kneel = { coreTick: this.tick + secondsToTicks(def.kneel) };
        this.emit({ type: "notice", message: def.kneelMessage });
    }

    // Its core out, a few tiles towards whoever's nearest, for longer the lower it is
    private throwWardenCore(two: WardensTwo, warden: Enemy, coreId: string): void {
        const def = WARDENS.two;
        const target = this.nearestHero(warden.x, warden.y).player;
        const dx = target.x - warden.x;
        const dy = target.y - warden.y;
        const length = Math.max(0.001, fm.hypot(dx, dy));
        const reach = warden.radius + def.distance - 2;
        const spot = findFreeSpot(
            this.grid,
            warden.x + (dx / length) * reach,
            warden.y + (dy / length) * reach,
            0.7,
        );
        const core = this.spawnEnemy(getEnemy(coreId), "normal", spot);
        const share = warden.hp / warden.maxHp;
        const index = def.below.findIndex((below) => share > below);
        const seconds = def.seconds[index === -1 ? def.seconds.length - 1 : index];
        two.kneel!.coreUid = core?.uid ?? -1;
        two.kneel!.backTick = this.tick + secondsToTicks(seconds);
    }

    // The obelisk's special stopped, and what it had coming with it
    private stopWardenObelisk(fight: WardensFight, two: WardensTwo): void {
        fight.marks = [];
        two.skulls = [];
        if (two.current) {
            two.current = undefined;
            const obelisk = this.enemies.find((e) => e.uid === two.obeliskUid);
            if (obelisk) {
                this.animate(obelisk, WARDENS.two.obelisk.closeSeq);
            }
        }
    }

    // Its last hitpoint: it falls, and gives the other back its power
    private downWardenTwo(fight: WardensFight, two: WardensTwo, warden: Enemy): void {
        const def = WARDENS.two;
        const winner = fight.winner!;
        const loser: WardenSide = winner === "elidinis" ? "tumeken" : "elidinis";
        const core = this.enemies.find((e) => e.uid === two.kneel?.coreUid);
        if (core && !core.dead) {
            this.vanish(core);
        }
        two.kneel = undefined;
        this.stopWardenObelisk(fight, two);
        this.clearBossAttacks();
        this.reform(warden, def.forms[winner].exposed);
        this.animate(warden, def.deathSeq);
        warden.hp = 0;
        two.endTick = this.tick + secondsToTicks(def.toLast);
        this.emit({
            type: "notice",
            message: `${WARDENS.wardens[winner].name} ${def.endMessage} ${WARDENS.wardens[loser].name}!`,
        });
    }

    // The obelisk's specials, in turn: closing beams, the windmill, lightning skulls. Each is
    // worked out as it opens, on the fight's marks (and its skulls in the air).
    private stepWardenObelisk(
        fight: WardensFight,
        two: WardensTwo,
        places: TombsWardensPlaces,
    ): void {
        const def = WARDENS.two;
        const obelisk = this.enemies.find((e) => e.uid === two.obeliskUid);
        if (two.current) {
            if (this.tick >= two.current.endTick) {
                two.current = undefined;
                two.nextOpen = this.tick + secondsToTicks(this.obeliskEvery());
                if (obelisk) {
                    this.animate(obelisk, def.obelisk.closeSeq);
                }
            }
            return;
        }
        if (this.tick < two.nextOpen) {
            return;
        }
        const kinds = ["beam", "windmill", "skulls"] as const;
        const kind = kinds[two.special % kinds.length];
        two.special++;
        if (obelisk) {
            this.animate(obelisk, def.obelisk.openSeq);
        }
        const by = def.obeliskId;
        // Penetration: they hit harder
        const hurts = def.obelisk.damage * (this.invoked("penetration") ? 1.4 : 1);
        // A ring round it as it opens, its colour the special's
        const warn = secondsToTicks(def.obelisk.warn);
        const warnSpot =
            kind === "beam"
                ? def.beam.warnSpotAnim
                : kind === "windmill"
                  ? def.windmill.warnSpotAnim
                  : def.skulls.warnSpotAnim;
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI * 2) / 10;
            fight.marks.push({
                x: places.obelisk.x + fm.cos(angle) * 2.2,
                y: places.obelisk.y + fm.sin(angle) * 2.2,
                from: this.tick,
                to: this.tick + warn,
                spotAnim: warnSpot,
                hurts: 0,
                by,
            });
        }
        const start = this.tick + warn;
        const ox = Math.floor(places.obelisk.x);
        const oy = Math.floor(places.obelisk.y);
        const floor = places.floor;
        const onFloor = (x: number, y: number) =>
            x >= floor.x0 &&
            x <= floor.x1 &&
            y >= floor.y0 &&
            y <= floor.y1 &&
            !(Math.abs(x - ox) <= 1 && Math.abs(y - oy) <= 1);
        const strike = (x: number, y: number, at: number, spotAnim: number, lasts: number) =>
            fight.marks.push({
                x: x + 0.5,
                y: y + 0.5,
                from: at,
                to: at + lasts,
                spotAnim,
                hurts,
                by,
            });
        const glow = (x: number, y: number, at: number, to: number, spotAnim: number) =>
            fight.marks.push({ x: x + 0.5, y: y + 0.5, from: at, to, spotAnim, hurts: 0, by });
        let end = start;
        if (kind === "beam") {
            // From the middles of the north and south edges, closing on it a ring a step, and a
            // moment after, from the east and west
            const beam = def.beam;
            const step = secondsToTicks(beam.step);
            const ahead = secondsToTicks(beam.glowAhead);
            const pairs = [
                [
                    [ox, floor.y0],
                    [ox, floor.y1],
                ],
                [
                    [floor.x0, oy],
                    [floor.x1, oy],
                ],
            ];
            pairs.forEach((origins, p) => {
                const t0 = start + p * secondsToTicks(beam.pause);
                for (const [gx, gy] of origins) {
                    for (let r = 0; r < beam.rings; r++) {
                        for (let y = gy - r; y <= gy + r; y++) {
                            for (let x = gx - r; x <= gx + r; x++) {
                                if (Math.max(Math.abs(x - gx), Math.abs(y - gy)) !== r) {
                                    continue;
                                }
                                const sideways = p === 0 ? Math.abs(x - ox) : Math.abs(y - oy);
                                if (sideways <= beam.wide && onFloor(x, y)) {
                                    const at = t0 + r * step;
                                    glow(
                                        x,
                                        y,
                                        Math.max(this.tick, at - ahead),
                                        at,
                                        beam.glowSpotAnim,
                                    );
                                    strike(x, y, at, beam.spotAnim, 60);
                                }
                            }
                        }
                    }
                }
                end = t0 + beam.rings * step + 60;
            });
        } else if (kind === "windmill") {
            // Its five patterns in turn, each glowing before it's struck
            const mill = def.windmill;
            const every = secondsToTicks(mill.every);
            const after = secondsToTicks(mill.strikeAfter);
            for (let round = 0; round < mill.rounds; round++) {
                const t = start + round * every;
                const letter = "ABCDE"[round % 5];
                WARDENS_WINDMILL.forEach((row, r) => {
                    for (let c = 0; c < row.length; c++) {
                        // The middle column's both C and D
                        const hit =
                            row[c] === letter || (c === 10 && (letter === "C" || letter === "D"));
                        const x = ox + 10 - c;
                        const y = oy - 11 + r;
                        if (hit && row[c] !== "F" && onFloor(x, y)) {
                            glow(x, y, t, t + after, mill.glowSpotAnim);
                            strike(x, y, t + after, mill.spotAnim, 60);
                        }
                    }
                });
            }
            end = start + mill.rounds * every + after + 60;
        } else {
            // Skulls thrown at random tiles, lightning round each but along its cross
            const skulls = def.skulls;
            const flight = secondsToTicks(skulls.flight);
            const after = secondsToTicks(skulls.strikeAfter);
            const half = skulls.half;
            for (let i = 0; i < skulls.count; i++) {
                const thrown = start + i * secondsToTicks(skulls.every);
                const land = thrown + flight;
                let tx = ox;
                let ty = oy;
                for (let tries = 0; tries < 20; tries++) {
                    tx = floor.x0 + 2 + this.rng.int(floor.x1 - floor.x0 - 3);
                    ty = floor.y0 + 2 + this.rng.int(floor.y1 - floor.y0 - 3);
                    if (Math.max(Math.abs(tx - ox), Math.abs(ty - oy)) > half) {
                        break;
                    }
                }
                two.skulls.push({
                    fromX: places.obelisk.x,
                    fromY: places.obelisk.y,
                    x: tx + 0.5,
                    y: ty + 0.5,
                    startTick: thrown,
                    landTick: land,
                });
                glow(tx, ty, thrown, land + after, skulls.shadowSpotAnim);
                for (let dy = -half; dy <= half; dy++) {
                    for (let dx = -half; dx <= half; dx++) {
                        if (dx === 0 || dy === 0 || !onFloor(tx + dx, ty + dy)) {
                            continue;
                        }
                        glow(tx + dx, ty + dy, land, land + after, def.windmill.glowSpotAnim);
                        strike(tx + dx, ty + dy, land + after, skulls.spotAnim, 30);
                    }
                }
                end = land + after + 30;
            }
        }
        two.current = { kind, endTick: end };
    }

    // The last phase: the Warden that fell back up, in the room over the pit, the party with it
    private startWardensThree(fight: WardensFight, places: TombsWardensPlaces): void {
        const last = places.last;
        if (!last) {
            return;
        }
        const def = WARDENS.three;
        const side: WardenSide = fight.winner === "elidinis" ? "tumeken" : "elidinis";
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                this.vanish(enemy);
            }
        }
        this.clearBossAttacks();
        this.enemyProjectiles = [];
        fight.marks = [];
        fight.shots = [];
        fight.phase = 3;
        // The crater round the Warden's platform, cut from the floor
        this.floor?.openHoles();
        this.moveParty(last.arrive);
        this.wardensFood();
        const warden = this.spawnEnemy(
            getEnemy(def.forms[side].form),
            "finalBoss",
            last.at,
            def.hp * this.wardensHp(),
        );
        if (!warden) {
            return;
        }
        const amascut = this.spawnEnemy(getEnemy(def.amascut.enemyId), "normal", {
            x: last.at.x,
            y: last.at.y + def.amascut.offset,
        });
        fight.three = {
            side,
            wardenUid: warden.uid,
            amascutUid: amascut?.uid ?? -1,
            phantoms: [],
            nextSlam: this.tick + secondsToTicks(3.6),
            slam: 0,
            batch: 0,
            pausedUntil: 0,
            enraged: false,
            nextRow: 0,
            nextLightning: 0,
            formation: -1,
            over: false,
        };
        this.emit({ type: "notice", message: `${WARDENS.wardens[side].name} ${def.message}` });
    }

    // Its hitpoints after a hit in the last phase: never past its next charge or its enrage in
    // one go, so each comes (damageEnemy)
    private wardenThreeHp(enemy: Enemy, three: WardensThree, hp: number): number {
        if (three.enraged) {
            return hp;
        }
        const def = WARDENS.three;
        const at = three.batch < def.at.length ? def.at[three.batch] : def.enrage.at;
        return Math.max(hp, enemy.maxHp * at);
    }

    // The last phase, each tick: its slams, its siphons when it charges, the phantoms joining,
    // and once enraged, lightning in the slams' place and the floor torn away
    private stepWardensThree(fight: WardensFight): void {
        const three = fight.three!;
        const def = WARDENS.three;
        const warden = this.enemies.find((e) => e.uid === three.wardenUid);
        if (!warden || warden.dead) {
            if (!three.over) {
                three.over = true;
                for (const enemy of this.enemies) {
                    if (!enemy.dead && enemy.uid !== three.wardenUid) {
                        this.vanish(enemy);
                    }
                }
                fight.marks = [];
                this.clearBossAttacks();
            }
            return;
        }
        const forms = def.forms[three.side];
        if (!three.enraged && warden.hp <= warden.maxHp * def.enrage.at) {
            this.enrageWardenThree(three, warden);
        }
        // Enraged, it doesn't slam: the lightning and the rows going are the floor's dangers
        if (three.enraged) {
            this.stepWardenEnrage(three, warden);
            this.stepWardenLightning(fight, three, warden);
            return;
        }
        if (three.siphons) {
            this.stepWardenSiphons(three, warden, forms.form);
            return;
        }
        if (three.batch < def.at.length && warden.hp <= warden.maxHp * def.at[three.batch]) {
            this.startWardenSiphons(three, warden);
            return;
        }
        if (this.tick < three.pausedUntil || this.tick < three.nextSlam) {
            return;
        }
        // East, west, then both but the middle
        const sides = ["east", "west", "both"] as const;
        const side = sides[three.slam % sides.length];
        three.slam++;
        // Out from its row both ways: it stands in the floor's middle
        this.floor?.start(
            { kind: "side", side, rowSeconds: def.rowSeconds, outward: true },
            this.tick,
            () => ({ x: warden.x, y: warden.y }),
        );
        this.animate(warden, def.slamSeqs[side]);
        const every = this.invoked("insanity")
            ? def.invoked.insanity
            : this.invoked("overclocked_2")
              ? def.invoked.overclocked2
              : this.invoked("overclocked")
                ? def.invoked.overclocked
                : warden.hp < warden.maxHp / 2
                  ? def.quicker
                  : def.every;
        three.nextSlam = this.tick + secondsToTicks(every);
    }

    // It charges: siphons land over the floor, and with the second and third a phantom joins
    private startWardenSiphons(three: WardensThree, warden: Enemy): void {
        const def = WARDENS.three;
        const floor = this.floor;
        // One more for every player up past the first: there's a siphon each and more
        const count =
            def.count[three.batch] +
            Math.max(0, this.heroes.filter((hero) => this.isUp(hero)).length - 1);
        three.batch++;
        this.reform(warden, def.forms[three.side].charging);
        this.animate(warden, def.chargeSeq);
        const spots: { x: number; y: number }[] = [];
        if (floor) {
            // In one of its formations in front of it, not the last one, mirrored at random
            const shapes = def.formations;
            let pick = this.rng.int(shapes.length);
            if (pick === three.formation && shapes.length > 1) {
                pick = (pick + 1 + this.rng.int(shapes.length - 1)) % shapes.length;
            }
            three.formation = pick;
            const flip = this.rng.chance(0.5) ? -1 : 1;
            const front = wardenFrontRow(warden) + 0.5;
            const free = (x: number, y: number) =>
                floor.index(x, y) >= 0 &&
                y < Math.floor(warden.y) &&
                !floor.isFalling(x, y, this.tick) &&
                spots.every((spot) => Math.floor(spot.x) !== x || Math.floor(spot.y) !== y);
            for (const at of formationSpots(shapes[pick], count)) {
                const ax = Math.floor(warden.x + flip * at.x);
                const ay = Math.floor(front + at.y);
                // Its own tile, or the nearest free one round it
                found: for (let r = 0; r <= 3; r++) {
                    for (let dy = -r; dy <= r; dy++) {
                        for (let dx = -r; dx <= r; dx++) {
                            if (
                                Math.max(Math.abs(dx), Math.abs(dy)) === r &&
                                free(ax + dx, ay + dy)
                            ) {
                                spots.push({ x: ax + dx + 0.5, y: ay + dy + 0.5 });
                                break found;
                            }
                        }
                    }
                }
            }
        }
        const uids: number[] = [];
        for (const spot of spots) {
            const siphon = this.spawnEnemy(getEnemy(def.siphon.enemyId), "normal", spot);
            if (siphon) {
                uids.push(siphon.uid);
                this.addEffect(def.siphon.skull, spot.x, spot.y, 0, 30);
            }
        }
        const window = this.invoked("insanity") ? def.insanityWindow : def.window;
        three.siphons = {
            uids,
            reversed: [],
            endTick: this.tick + secondsToTicks(window),
            nextBeam: this.tick,
        };
        this.emit({ type: "notice", message: def.siphonMessage });
        // A phantom with the second charge (on its left, the west: Zebak's, Akkha's) and the
        // third (its right), as OSRS has them
        const which = three.batch - 2;
        if (which === 0 || which === 1) {
            const id = def.forms[three.side].phantoms[which];
            const at = {
                x: warden.x + (which === 0 ? -def.phantomOffset : def.phantomOffset),
                y: warden.y,
            };
            const phantom = this.spawnEnemy(getEnemy(id), "boss", at, 1);
            if (phantom) {
                // The second takes turns with the first, half its interval behind, rather than
                // both landing at once
                const first = this.enemies.find((e) => e.uid === three.phantoms[0] && !e.dead);
                if (first && phantom.def.boss) {
                    const every = secondsToTicks(phantom.def.boss.attackInterval);
                    phantom.attackCooldown = (first.attackCooldown + Math.floor(every / 2)) % every;
                }
                three.phantoms.push(phantom.uid);
                this.addEffect(def.phantomSpotAnim, at.x, at.y, 0, 90);
                this.emit({ type: "notice", message: def.phantomMessage });
            }
        }
    }

    // Its siphons: each one a player steps on reversed; all of them, and it staggers; out of time,
    // and the floor erupts out from the middle
    private stepWardenSiphons(three: WardensThree, warden: Enemy, form: string): void {
        const def = WARDENS.three;
        const siphons = three.siphons!;
        const beam = this.tick >= siphons.nextBeam;
        if (beam) {
            siphons.nextBeam = this.tick + secondsToTicks(1.2);
        }
        for (const uid of siphons.uids) {
            if (siphons.reversed.includes(uid)) {
                continue;
            }
            const siphon = this.enemies.find((e) => e.uid === uid);
            if (!siphon || siphon.dead) {
                continue;
            }
            let stepped = false;
            for (const hero of this.heroes) {
                const { player } = hero;
                if (
                    this.isUp(hero) &&
                    fm.hypot(player.x - siphon.x, player.y - siphon.y) <=
                        def.siphon.reach + player.radius
                ) {
                    stepped = true;
                }
            }
            if (stepped) {
                siphons.reversed.push(uid);
                this.reform(siphon, def.siphon.reversed);
                this.emit({ type: "impact", sound: SOUNDS.tombsChip, x: siphon.x, y: siphon.y });
            } else if (beam) {
                this.addEffect(def.siphon.beamSpotAnim, siphon.x, siphon.y, 0, 30);
            }
        }
        const done = siphons.reversed.length === siphons.uids.length;
        if (!done && this.tick < siphons.endTick) {
            return;
        }
        for (const uid of siphons.uids) {
            const siphon = this.enemies.find((e) => e.uid === uid);
            if (siphon && !siphon.dead) {
                this.vanish(siphon);
            }
        }
        three.siphons = undefined;
        this.reform(warden, form);
        if (done) {
            const dealt = Math.round(warden.maxHp * def.stagger);
            warden.hp = this.wardenThreeHp(warden, three, warden.hp - dealt);
            warden.flash = 5;
            this.emit({
                type: "damage",
                x: warden.x,
                y: warden.y,
                amount: dealt,
                enemyUid: warden.uid,
                enemyId: warden.def.id,
            });
            this.animate(warden, def.staggerSeq);
            this.emit({ type: "notice", message: def.staggerMessage });
            // And open for the slams' restart (BossDef.guard): Insanity's, half of it
            const open = this.invoked("insanity") ? def.restart / 2 : def.restart;
            this.dropGuard(warden, open, false, "Energy Siphon");
        } else {
            this.animate(warden, def.releaseSeq);
            this.floor?.start(
                { kind: "ripple", at: "middle", spokes: "diagonal", ringSeconds: 0.12, radius: 14 },
                this.tick,
                () => ({ x: warden.x, y: warden.y }),
            );
            this.emit({ type: "notice", message: def.releaseMessage });
        }
        three.pausedUntil = this.tick + secondsToTicks(def.restart);
        three.nextSlam = three.pausedUntil;
        // Insanity: the slams go on where they left off
        if (!this.invoked("insanity")) {
            three.slam = 0;
        }
    }

    // At its last few hitpoints: it heals, stops slamming, its phantoms quicken, lightning comes
    // down, and Amascut tears at the floor
    private enrageWardenThree(three: WardensThree, warden: Enemy): void {
        const def = WARDENS.three;
        three.enraged = true;
        if (three.siphons) {
            for (const uid of three.siphons.uids) {
                const siphon = this.enemies.find((e) => e.uid === uid);
                if (siphon && !siphon.dead) {
                    this.vanish(siphon);
                }
            }
            three.siphons = undefined;
            this.reform(warden, def.forms[three.side].form);
        }
        warden.hp = Math.min(warden.maxHp, warden.hp + warden.maxHp * def.enrage.heal);
        this.animate(warden, def.enrage.seq);
        for (const uid of three.phantoms) {
            const phantom = this.enemies.find((e) => e.uid === uid);
            if (phantom?.bossState) {
                phantom.bossState.enraged = true;
            }
        }
        const amascut = this.enemies.find((e) => e.uid === three.amascutUid);
        if (amascut && !amascut.dead) {
            this.reform(amascut, def.amascut.enragedId);
        }
        three.nextRow = this.tick + secondsToTicks(def.enrage.firstRow);
        three.nextLightning = this.tick + secondsToTicks(def.enrage.lightning.first);
        this.emit({ type: "notice", message: def.enrage.message });
    }

    // Enraged: a row of the floor torn away from the back every so often, till the one in front
    // of the Warden is all that's left before it (and what's beside and behind it); the
    // lightning's stepWardenLightning
    private stepWardenEnrage(three: WardensThree, warden: Enemy): void {
        const def = WARDENS.three.enrage;
        const floor = this.floor;
        if (!floor || this.tick < three.nextRow) {
            return;
        }
        three.nextRow = this.tick + secondsToTicks(def.rowEvery);
        const keep = wardenFrontKeep(floor, warden);
        if (floor.rowsDropped >= floor.sizeY - keep) {
            return;
        }
        floor.start({ kind: "dropRows", rows: 1, rowSeconds: 0.4, keep }, this.tick, () => ({
            x: warden.x,
            y: warden.y,
        }));
    }

    // Enraged, lightning in the slams' place: a walk of bolts over the floor every so often, each
    // bolt's shadow on its tile first. Where the party can be: the rows left, up to beside the
    // Warden (not over the crater or behind it), and never on a tile that's gone
    private stepWardenLightning(fight: WardensFight, three: WardensThree, warden: Enemy): void {
        const floor = this.floor;
        if (!floor || this.tick < three.nextLightning) {
            return;
        }
        const lightning = WARDENS.three.enrage.lightning;
        three.nextLightning = this.tick + secondsToTicks(lightning.every);
        const warn = secondsToTicks(lightning.warn);
        const top = Math.min(floor.y0 + floor.sizeY - 1, Math.floor(warden.y));
        const bottom = Math.min(top, floor.y0 + floor.rowsDropped);
        // Each bolt a step or two on from the last
        let x = floor.x0 + this.rng.int(floor.sizeX);
        let y = bottom + this.rng.int(top - bottom + 1);
        for (let i = 0; i < lightning.count; i++) {
            const angle = this.rng.int(8) * (Math.PI / 4);
            const step = this.rng.int(4) === 0 ? 2 : 1;
            x = Math.min(
                Math.max(x + Math.round(fm.cos(angle) * step), floor.x0),
                floor.x0 + floor.sizeX - 1,
            );
            y = Math.min(Math.max(y + Math.round(fm.sin(angle) * step), bottom), top);
            if (floor.isFalling(x, y, this.tick)) {
                continue;
            }
            const at = this.tick + Math.floor((i * warn) / lightning.count);
            fight.marks.push({
                x: x + 0.5,
                y: y + 0.5,
                from: at,
                to: at + warn,
                spotAnim: lightning.shadowSpotAnim,
                hurts: 0,
                by: warden.def.id,
                light: lightning.light,
            });
            fight.marks.push({
                x: x + 0.5,
                y: y + 0.5,
                from: at + warn,
                to: at + warn + 30,
                spotAnim: lightning.spotAnim,
                hurts: lightning.damage,
                by: warden.def.id,
            });
        }
    }

    // The next of a wave's baboons out of the walls, once it's time
    private stepApmekenGroup(room: TombsRoom): void {
        if (room.pending.length === 0 || this.tick < room.nextOutTick) {
            return;
        }
        const id = room.pending.shift()!;
        const current = this.hero;
        this.useSpawnHero();
        const enemy = this.spawnEnemy(getEnemy(id), "normal");
        this.use(current);
        if (enemy) {
            room.group.push(enemy.uid);
        } else {
            // Nowhere to put it this tick: it tries again next
            room.pending.unshift(id);
        }
        room.nextOutTick = this.tick + secondsToTicks(enemy ? APMEKEN.stagger : 0);
    }

    // The Apmeken room: its waves, one when the last is beaten (with a casket for it) or has been
    // about too long, and the issues that come on a timer, fixed by standing at them
    private stepApmeken(): void {
        const room = this.tombsRoom;
        const spots = this.map.tombs?.paths.find((p) => p.id === this.tombsPath)?.room?.spots;
        const het = this.tombsPathRoom?.het;
        const scabaras = this.tombsPathRoom?.scabaras;
        const crondis = this.tombsPathRoom?.crondis;
        if (
            !room ||
            (!spots && !het && !scabaras && !crondis) ||
            this.runOver ||
            this.state !== "playing"
        ) {
            return;
        }
        if (room.boss) {
            this.stepTombsBoss(room);
            return;
        }
        if (room.doneTick !== undefined) {
            // A moment after: on to the path's boss, or back to the Nexus without one
            if (this.tick - room.doneTick >= secondsToTicks(3)) {
                const boss = this.tombsPathRoom?.boss;
                if (boss) {
                    this.enterTombsBoss(room, boss);
                } else {
                    this.leaveTombsPath();
                }
            }
            return;
        }
        const gate = this.tombsGate;
        if (!room.started) {
            // Waiting in the safe corridor: it begins once someone's through the barrier
            const through = this.heroes.some(
                (hero) => this.isUp(hero) && this.throughTombsGate(hero.player),
            );
            if (through) {
                room.started = true;
                if (het) {
                    this.startHet(room, het);
                } else if (scabaras) {
                    this.startScabaras(room, scabaras);
                } else if (crondis) {
                    this.startCrondis(room, crondis);
                } else {
                    room.nextIssueTick = this.tick + secondsToTicks(this.apmekenIssueEvery());
                    this.nextApmekenWave();
                }
            }
            return;
        }
        this.holdTombsGate();
        this.stepApmekenGroup(room);
        if (het) {
            this.stepHet(room, het);
            return;
        }
        if (scabaras) {
            this.stepScabaras(room, scabaras);
            return;
        }
        if (crondis) {
            this.stepCrondis(room, crondis);
            return;
        }
        const alive = new Set(this.enemies.filter((e) => !e.dead).map((e) => e.uid));
        const beaten = room.pending.length === 0 && room.group.every((uid) => !alive.has(uid));
        if (beaten && !this.tombsReplaying) {
            const player = this.hero.player;
            this.dropCasket(player.x + 0.8, player.y, false);
        }
        if (beaten || this.tick - room.waveTick >= secondsToTicks(APMEKEN.waveSeconds)) {
            this.nextApmekenWave();
            if (room.doneTick !== undefined) {
                return;
            }
        }
        this.stepApmekenIssue(room, spots!);
    }

    // ---- Zebak ----

    // His fight, each tick he's up: his specials, his acid, his jugs and his blood clouds
    private stepZebak(boss: Enemy): void {
        const fight = this.tombsZebak;
        const def = boss.def.boss?.zebak;
        const island = this.tombsPathRoom?.boss?.island;
        if (!fight || !def || !island || fight.uid !== boss.uid) {
            return;
        }
        const state = boss.bossState;
        if (
            !fight.roar &&
            fight.waves.length === 0 &&
            fight.special < def.specials.length &&
            boss.hp <= boss.maxHp * def.specials[fight.special] &&
            // None once he's enraged (or as he will be this tick)
            !state?.enraged &&
            boss.hp > boss.maxHp * (boss.def.boss?.enrage.at ?? 0) &&
            !state?.windup
        ) {
            this.startZebakSpecial(boss, fight, def, island);
        }
        this.stepZebakRoar(boss, fight, def);
        this.stepZebakWaves(fight, def, island);
        this.stepZebakAcid(fight, def);
        this.stepZebakJugs(fight, def, island);
        this.stepZebakClouds(boss, fight, def);
    }

    // A random tile's middle on his island
    private zebakSpot(island: { x0: number; y0: number; x1: number; y1: number }): {
        x: number;
        y: number;
    } {
        for (let attempt = 0; attempt < 20; attempt++) {
            const x = Math.floor(this.rng.range(island.x0 + 1, island.x1)) + 0.5;
            const y = Math.floor(this.rng.range(island.y0 + 1, island.y1)) + 0.5;
            if (this.grid.contains(x, y) && !this.grid.isSolid(x, y)) {
                return { x, y };
            }
        }
        return { x: (island.x0 + island.x1) / 2, y: (island.y0 + island.y1) / 2 };
    }

    // His special, turn about: acid and jugs over the island, then his roar or his waves
    private startZebakSpecial(
        boss: Enemy,
        fight: ZebakFight,
        def: ZebakDef,
        island: { x0: number; y0: number; x1: number; y1: number },
    ): void {
        const roar = fight.special % 2 === 0;
        fight.special++;
        const level = this.tombsPathLevel;
        const half = this.invoked("upset_stomach") ? def.acid.upsetHalf : def.acid.half;
        for (let i = 0; i < def.acid.count + level; i++) {
            fight.acid.push({ ...this.zebakSpot(island), half });
        }
        for (let i = 0; i < def.jugs.count; i++) {
            const jug = this.spawnEnemy(
                getEnemy(def.jugs.enemyId),
                "normal",
                this.zebakSpot(island),
            );
            if (jug) {
                jug.noDrops = true;
                fight.jugs.push({ uid: jug.uid, vx: 0, vy: 0, left: 0 });
            }
        }
        const state = boss.bossState;
        if (roar) {
            // Boulders across the island's middle, to shelter behind
            const y = Math.floor((island.y0 + island.y1) / 2) + 0.5;
            const across = island.x1 - island.x0;
            for (let i = 0; i < def.roar.boulders; i++) {
                const x =
                    Math.floor(island.x0 + ((i + 1) * across) / (def.roar.boulders + 1)) + 0.5;
                this.tombsCover.push({
                    x,
                    y: y + this.rng.int(3) - 1,
                    radius: def.roar.radius,
                    endTick: Number.MAX_SAFE_INTEGER,
                    look: def.roar.look,
                });
            }
            fight.roar = { tick: this.tick + secondsToTicks(def.roar.seconds) };
            if (state) {
                state.channelEnd = Math.max(state.channelEnd, fight.roar.tick + secondsToTicks(1));
            }
            this.emit({ type: "notice", message: def.roar.message });
            return;
        }
        const gap = Math.max(def.waves.leastGap, def.waves.gap - Math.floor(level / 2));
        const height = island.y1 - island.y0 + 1;
        const between = secondsToTicks(height / def.waves.speed + 1.5);
        for (let i = 0; i < def.waves.count; i++) {
            const up = i % 2 === 0;
            const gapX0 = Math.floor(this.rng.range(island.x0 + 1, island.x1 - gap)) + 0.0;
            fight.waves.push({
                y: up ? island.y0 - 0.5 : island.y1 + 1.5,
                dir: up ? 1 : -1,
                gapX0,
                gapX1: gapX0 + gap,
                startTick: this.tick + secondsToTicks(def.waves.delay) + i * between,
                hit: [],
            });
        }
        if (state) {
            boss.anim = "attack";
            boss.animStart = this.tick;
            boss.attackSeq = def.waves.seq;
        }
        this.emit({ type: "notice", message: def.waves.message });
    }

    // Whether a boulder shelters a point from him: straight behind it (zebakShelters)
    private zebakSheltered(boss: Enemy, x: number, y: number, def: ZebakDef): boolean {
        const rocks = this.tombsCover.filter((rock) => rock.look === def.roar.look);
        return zebakShelters(boss.x, boss.y, x, y, rocks, def.roar.shelter);
    }

    // His Great Roar, once its time's up: everyone not behind a boulder is hit, hard, and thrown back
    private stepZebakRoar(boss: Enemy, fight: ZebakFight, def: ZebakDef): void {
        const roar = fight.roar;
        if (!roar || this.tick < roar.tick) {
            return;
        }
        fight.roar = undefined;
        fight.roared = {
            tick: this.tick,
            x: boss.x,
            y: boss.y,
            rocks: this.tombsCover.filter((rock) => rock.look === def.roar.look),
        };
        boss.anim = "attack";
        boss.animStart = this.tick;
        boss.attackSeq = def.roar.seq;
        this.emit({ type: "notice", message: def.roar.roarMessage });
        this.emit({
            type: "bossImpact",
            x: boss.x,
            y: boss.y,
            shake: def.roar.shockwave.shake,
        });
        const current = this.hero;
        for (const hero of this.heroes) {
            if (!this.isUp(hero)) {
                continue;
            }
            const player = hero.player;
            this.addEffect(def.roar.spotAnim, player.x, player.y, 0, 40);
            if (this.zebakSheltered(boss, player.x, player.y, def)) {
                continue;
            }
            this.use(hero);
            this.damagePlayer(
                player.maxHp * this.tombsShare(def.roar.share) * def.roar.hits,
                boss.def.id,
                false,
                undefined,
                true,
            );
            // A wipe has the room start over from its safe end: nobody's thrown from there
            if (this.tombsRoom?.boss?.uid !== boss.uid) {
                break;
            }
            if (this.isUp(hero)) {
                this.zebakShove(player, player.x - boss.x, player.y - boss.y, def.roar.knock);
            }
        }
        this.use(current);
        this.tombsCover = this.tombsCover.filter((rock) => rock.look !== def.roar.look);
    }

    // Pushed the way given, as far as the ground goes: as far as the whole of them fits, not just
    // their middle, so they never stop half in a wall at the island's edge
    private zebakShove(player: Player, dx: number, dy: number, tiles: number): void {
        const length = Math.max(0.001, fm.hypot(dx, dy));
        const ux = dx / length;
        const uy = dy / length;
        let gone = 0;
        for (let step = 0.25; step <= tiles; step += 0.25) {
            const x = player.x + ux * step;
            const y = player.y + uy * step;
            if (!this.grid.contains(x, y) || !isCircleFree(this.grid, x, y, player.radius)) {
                break;
            }
            gone = step;
        }
        player.x = player.prevX = player.x + ux * gone;
        player.y = player.prevY = player.y + uy * gone;
    }

    // His tidal waves across the island: stand in the gap, or be hurt and shoved along. They
    // wash his acid away as they go.
    private stepZebakWaves(
        fight: ZebakFight,
        def: ZebakDef,
        island: { x0: number; y0: number; x1: number; y1: number },
    ): void {
        const speed = def.waves.speed / TICKS_PER_SECOND;
        const damage = def.waves.damage * this.tombsHazardScale();
        fight.waves = fight.waves.filter((wave) => {
            if (this.tick < wave.startTick) {
                return true;
            }
            wave.y += wave.dir * speed;
            fight.acid = fight.acid.filter((pool) => Math.abs(pool.y - wave.y) > 0.6);
            this.forEachHeroInReach(() => {
                const player = this.player;
                const index = this.hero.index;
                const inGap = player.x >= wave.gapX0 && player.x <= wave.gapX1;
                if (wave.hit.includes(index) || inGap || Math.abs(player.y - wave.y) > 0.6) {
                    return;
                }
                wave.hit.push(index);
                this.damagePlayer(damage, "zebak", false);
                if (this.tombsRoom?.boss?.uid === fight.uid && this.isUp(this.hero)) {
                    this.zebakShove(player, 0, wave.dir, def.waves.shove);
                }
            });
            return wave.dir > 0 ? wave.y < island.y1 + 2 : wave.y > island.y0 - 1;
        });
    }

    // Standing in his acid: hurt every so often, more the longer you stand there, and poisoned
    private stepZebakAcid(fight: ZebakFight, def: ZebakDef): void {
        const every = secondsToTicks(0.6);
        const scale = this.tombsHazardScale();
        const current = this.hero;
        for (const hero of this.heroes) {
            const player = hero.player;
            const inAcid =
                this.isUp(hero) &&
                fight.acid.some(
                    (pool) =>
                        Math.abs(player.x - pool.x) <= pool.half + 0.5 &&
                        Math.abs(player.y - pool.y) <= pool.half + 0.5,
                );
            if (!inAcid) {
                fight.acidTicks[hero.index] = 0;
                continue;
            }
            const ticks = (fight.acidTicks[hero.index] ?? 0) + 1;
            fight.acidTicks[hero.index] = ticks;
            if (ticks % every !== 1 % every) {
                continue;
            }
            this.use(hero);
            const seconds = ticks / TICKS_PER_SECOND;
            this.damagePlayer(
                def.acid.damage * scale * (1 + def.acid.ramp * seconds),
                "zebak",
                false,
            );
            this.applyPlayerEffect(def.acid.poison);
        }
        this.use(current);
    }

    // His jugs: walked into, one rolls off the way it was pushed; it breaks on a boulder, at the
    // island's edge or at the end of its roll, and its water clears his acid
    private stepZebakJugs(
        fight: ZebakFight,
        def: ZebakDef,
        island: { x0: number; y0: number; x1: number; y1: number },
    ): void {
        const speed = def.jugs.speed / TICKS_PER_SECOND;
        fight.jugs = fight.jugs.filter((jug) => {
            const enemy = this.enemies.find((e) => e.uid === jug.uid);
            if (!enemy) {
                return false;
            }
            if (enemy.dead) {
                this.breakZebakJug(fight, def, enemy.x, enemy.y);
                return false;
            }
            if (jug.left <= 0) {
                // At rest: walked into, it's off
                const hero = this.heroes.find(
                    (h) =>
                        this.isUp(h) &&
                        fm.hypot(h.player.x - enemy.x, h.player.y - enemy.y) <=
                            h.player.radius + enemy.radius + 0.1,
                );
                if (hero) {
                    const dx = enemy.x - hero.player.x;
                    const dy = enemy.y - hero.player.y;
                    const length = Math.max(0.001, fm.hypot(dx, dy));
                    jug.vx = (dx / length) * speed;
                    jug.vy = (dy / length) * speed;
                    jug.left = def.jugs.reach;
                }
                return true;
            }
            const x = enemy.x + jug.vx;
            const y = enemy.y + jug.vy;
            jug.left -= speed;
            const onBoulder = this.tombsCover.some(
                (rock) => fm.hypot(rock.x - x, rock.y - y) <= rock.radius + enemy.radius,
            );
            const off = x < island.x0 || x > island.x1 + 1 || y < island.y0 || y > island.y1 + 1;
            if (
                onBoulder ||
                off ||
                jug.left <= 0 ||
                !this.grid.contains(x, y) ||
                this.grid.isSolid(x, y)
            ) {
                this.breakZebakJug(fight, def, enemy.x, enemy.y);
                this.vanish(enemy);
                return false;
            }
            enemy.x = enemy.prevX = x;
            enemy.y = enemy.prevY = y;
            return true;
        });
    }

    // A jug broken: its water splashes out and clears the acid round it
    private breakZebakJug(fight: ZebakFight, def: ZebakDef, x: number, y: number): void {
        const reach = this.invoked("upset_stomach") ? def.jugs.upsetWater : def.jugs.water;
        this.addEffect(def.jugs.breakSpotAnim, x, y, 0, 40);
        this.addEffect(def.jugs.splashSpotAnim, x, y, 0, 40);
        fight.acid = fight.acid.filter(
            (pool) =>
                Math.abs(pool.x - x) > reach + pool.half ||
                Math.abs(pool.y - y) > reach + pool.half,
        );
    }

    // Not Just a Head: blood clouds up the Rock steps now and then, wasting away as they go
    private stepZebakClouds(boss: Enemy, fight: ZebakFight, def: ZebakDef): void {
        const steps = this.tombsPathRoom?.boss?.steps ?? [];
        if (
            this.invoked("not_just_a_head") &&
            steps.length > 0 &&
            this.tick >= fight.nextCloudTick
        ) {
            fight.nextCloudTick = this.tick + secondsToTicks(def.clouds.every);
            const count = this.invoked("blood_thinners") ? 3 : 1;
            for (let i = 0; i < count; i++) {
                const at = steps[(fight.special + i) % steps.length];
                const cloud = this.spawnEnemy(getEnemy(def.clouds.enemyId), "normal", at);
                if (cloud) {
                    cloud.noDrops = true;
                    fight.clouds.push({ uid: cloud.uid, x: cloud.x, y: cloud.y });
                }
            }
            this.emit({ type: "notice", message: def.clouds.message });
        }
        fight.clouds = fight.clouds.filter((cloud) => {
            const enemy = this.enemies.find((e) => e.uid === cloud.uid && !e.dead);
            if (!enemy) {
                return false;
            }
            const moved = fm.hypot(enemy.x - cloud.x, enemy.y - cloud.y);
            cloud.x = enemy.x;
            cloud.y = enemy.y;
            enemy.hp -= moved * def.clouds.drain;
            if (enemy.hp <= 0) {
                this.vanish(enemy);
                return false;
            }
            return true;
        });
        void boss;
    }

    // A blood cloud's hit heals him (Arterial Spray: more)
    private zebakCloudHit(amount: number): void {
        const fight = this.tombsZebak;
        const boss = fight && this.enemies.find((e) => e.uid === fight.uid && !e.dead);
        const def = boss?.def.boss?.zebak;
        if (!boss || !def) {
            return;
        }
        const times = this.invoked("arterial_spray") ? def.clouds.arterial : def.clouds.heal;
        boss.hp = Math.min(boss.maxHp, boss.hp + amount * times);
    }

    // For the HUD: seconds till his roar, while one's coming
    get zebakRoarSeconds(): number | undefined {
        const roar = this.tombsZebak?.roar;
        return roar ? Math.max(0, (roar.tick - this.tick) / TICKS_PER_SECOND) : undefined;
    }

    // ---- Kephri ----

    // Her fight, each tick she's up: her shield's intermissions, Dung Strike, her eggs and her
    // overlords
    private stepKephri(boss: Enemy): void {
        const fight = this.tombsKephri;
        const def = boss.def.boss?.kephri;
        if (!fight || !def || fight.uid !== boss.uid) {
            return;
        }
        // Up again for her last: her swarm's gone, and she throws everyone back
        if (boss.def.id !== "kephri" && !fight.final) {
            fight.final = true;
            fight.intermission = undefined;
            this.emit({ type: "notice", message: def.finalMessage });
            this.startKephriDung(
                fight,
                this.heroes.filter((hero) => this.isUp(hero)).map((hero) => hero.index),
            );
        }
        this.stepKephriIntermission(boss, fight, def);
        this.stepKephriDung(boss, fight, def);
        this.stepKephriEggs(boss, def);
        this.stepKephriArcane(boss, fight, def);
        this.stepKephriSwarms(boss, fight, def);
    }

    // Her shield broken (one of the first two): dazed and shielded, no attacks, while her swarms
    // come round the edge and her overlords fight. Over once they're all done, behind the next.
    private stepKephriIntermission(boss: Enemy, fight: KephriFight, def: KephriDef): void {
        const state = boss.bossState;
        if (!fight.intermission) {
            if (fight.final || fight.phase >= def.intermissions.swarms.length || fight.shield > 0) {
                return;
            }
            // Broken mid-attack: shielded till it's done, then dazed
            if (state?.windup) {
                boss.shieldEnd = Math.max(boss.shieldEnd, this.tick + 2);
                return;
            }
            const which = fight.phase;
            fight.leaked = 0;
            const level = this.tombsPathLevel;
            const swarms = def.intermissions.swarms[which] + 2 * level;
            const overlords = [
                ...def.intermissions.overlords[which],
                ...(this.invoked("more_overlords") ? def.intermissions.moreOverlords[which] : []),
            ];
            const uids: number[] = [];
            for (const id of overlords) {
                const [dx, dy] = def.overlordAt[id] ?? [0, -4];
                const one = this.spawnEnemy(getEnemy(id), "normal", {
                    x: boss.x + dx,
                    y: boss.y + dy,
                });
                if (one) {
                    one.noDrops = true;
                    uids.push(one.uid);
                }
            }
            fight.intermission = {
                left: swarms,
                sent: 0,
                nextTick: this.tick + secondsToTicks(1),
                point: this.rng.int(Math.max(1, this.tombsPathRoom?.boss?.swarms?.length ?? 1)),
                overlords: uids,
            };
            this.emit({ type: "notice", message: def.intermissions.message });
        }
        const intermission = fight.intermission;
        // Dazed and shielded, and not attacking
        boss.shieldEnd = Math.max(boss.shieldEnd, this.tick + 2);
        if (state) {
            state.channelEnd = Math.max(state.channelEnd ?? 0, this.tick + 2);
        }
        const points = this.tombsPathRoom?.boss?.swarms ?? [];
        if (intermission.left > 0 && this.tick >= intermission.nextTick && points.length > 0) {
            // Round the edge clockwise, now and then skipping a point
            intermission.point =
                (intermission.point + (this.rng.chance(0.25) ? 2 : 1)) % points.length;
            const level = this.tombsPathLevel;
            const trio =
                level >= def.swarm.trios &&
                this.rng.chance(level >= def.swarm.trios + 2 ? 0.5 : 0.25);
            const count = Math.min(intermission.left, trio ? 3 : 1);
            for (let i = 0; i < count; i++) {
                this.sendKephriSwarm(points[intermission.point], def, 1, i);
            }
            intermission.left -= count;
            intermission.sent += count;
            const step =
                def.swarm.cadence[
                    Math.min(def.swarm.cadence.length - 1, Math.floor(intermission.sent / 4))
                ];
            intermission.nextTick = this.tick + secondsToTicks(step);
        }
        const alive = (uid: number) => this.enemies.some((e) => e.uid === uid && !e.dead);
        const swarmsUp = this.enemies.some((e) => !e.dead && e.def.id === def.swarm.enemyId);
        if (intermission.left === 0 && !swarmsUp && !intermission.overlords.some(alive)) {
            fight.intermission = undefined;
            fight.phase++;
            // Behind her next shield, overcharged by the swarms that got to her
            fight.shield = Math.round(
                fight.shieldMax * (1 + Math.min(def.shields.overcharge, fight.leaked)),
            );
            boss.shieldEnd = 0;
            if (state) {
                state.channelEnd = 0;
            }
            fight.nextDungTick = this.tick + secondsToTicks(this.kephriDungEvery(def));
            this.emit({ type: "notice", message: def.intermissions.endMessage });
            this.kephriNextPhase(boss, fight);
        }
    }

    // A swarm out of one of the edge's holes (a step apart for a trio), making for her
    private sendKephriSwarm(
        at: { x: number; y: number },
        def: KephriDef,
        speed: number,
        i: number,
    ): void {
        const one = this.spawnEnemy(getEnemy(def.swarm.enemyId), "normal", {
            x: at.x + (i === 1 ? 0.6 : i === 2 ? -0.6 : 0),
            y: at.y,
        });
        if (one) {
            one.noDrops = true;
            one.speed *= speed;
        }
    }

    // Swarms that get to her restore her and are gone: her next shield in an intermission, the one
    // she's behind otherwise (Medic! has them come outside her intermissions too), her hitpoints
    // on her last
    private stepKephriSwarms(boss: Enemy, fight: KephriFight, def: KephriDef): void {
        const points = this.tombsPathRoom?.boss?.swarms ?? [];
        if (
            this.invoked("medic") &&
            !fight.intermission &&
            points.length > 0 &&
            this.tick >= fight.medicTick
        ) {
            fight.medicTick = this.tick + secondsToTicks(def.swarm.medic);
            this.sendKephriSwarm(points[this.rng.int(points.length)], def, 0.5, 0);
        }
        const reach = boss.radius + def.swarm.reach;
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.def.id !== def.swarm.enemyId) {
                continue;
            }
            if (fm.hypot(enemy.x - boss.x, enemy.y - boss.y) > reach) {
                continue;
            }
            this.restoreKephri(boss, fight, def.swarm.shield, def.swarm.heal);
            this.addEffect(TOMBS_SPOTANIMS.kephriShieldSwarm, boss.x, boss.y, 0, 30, boss.uid);
            this.vanish(enemy);
        }
    }

    // Something restoring her: shield (a share of a shield's strength) before her last, heal (a
    // share of her hitpoints) on it
    private restoreKephri(boss: Enemy, fight: KephriFight, shield: number, heal: number): void {
        const def = boss.def.boss?.kephri;
        if (fight.final || !def) {
            boss.hp = Math.min(boss.maxHp, boss.hp + Math.max(1, Math.round(boss.maxHp * heal)));
        } else if (fight.intermission || fight.shield <= 0) {
            // Towards the next (a broken one isn't mended: she's dazed as soon as she can be)
            fight.leaked += shield;
        } else {
            fight.shield = Math.min(
                Math.round(fight.shieldMax * (1 + def.shields.overcharge)),
                fight.shield + Math.max(1, Math.round(fight.shieldMax * shield)),
            );
        }
    }

    // A hit on her before her last: off the shield she's behind, her hitpoints untouched; the
    // third gone, she's down (and rises for her last, BossDef.rises). What the shield took.
    private kephriTakes(boss: Enemy, fight: KephriFight, damage: number): number {
        const taken = Math.min(fight.shield, damage);
        fight.shield -= taken;
        if (fight.shield > 0) {
            return taken;
        }
        const def = boss.def.boss?.kephri;
        if (def && fight.phase >= def.shields.count - 1) {
            boss.hp = 0;
        } else {
            // Broken: nothing gets at her till she's dazed (stepKephriIntermission), even if
            // she's mid-attack
            boss.shieldEnd = Math.max(boss.shieldEnd, this.tick + 2);
        }
        return taken;
    }

    // Kephri's bar on the HUD: the shield she's behind, which of them, or her hitpoints on her last
    kephriBar(
        enemy: Enemy,
    ): { phase: number; stage: "shield" | "hp"; fraction: number; status: string } | undefined {
        const fight = this.tombsKephri;
        const def = enemy.def.boss?.kephri;
        if (!fight || !def || fight.uid !== enemy.uid) {
            return undefined;
        }
        const count = def.shields.count;
        if (fight.final) {
            return {
                phase: count + 1,
                stage: "hp",
                fraction: Math.max(0, enemy.hp) / enemy.maxHp,
                status: "Her swarm's gone: she's open to attack!",
            };
        }
        return {
            phase: fight.phase + 1,
            stage: "shield",
            fraction: fight.intermission ? 0 : Math.min(1, fight.shield / fight.shieldMax),
            status: fight.intermission
                ? "Kill the swarms before they restore her shield!"
                : `Shield ${fight.phase + 1} of ${count}`,
        };
    }

    private kephriDungEvery(def: KephriDef): number {
        const every = this.tombsKephri?.final
            ? (def.dung.finalEvery ?? def.dung.every)
            : def.dung.every;
        return Math.max(def.dung.least, every - this.tombsPathWeight);
    }

    // Behind her next shield: on to her next phase, if she fights in phases by her shields
    // (BossPhasesDef by), its tempo, light, opener and ambients from now
    private kephriNextPhase(boss: Enemy, fight: KephriFight): void {
        const phases = boss.def.boss?.phases;
        const phase = boss.bossState?.phase;
        if (phases?.by !== "shields" || !phase) {
            return;
        }
        const index = Math.min(fight.phase, phases.phases.length - 1);
        if (index <= phase.index) {
            return;
        }
        const next = phases.phases[index];
        phase.index = index;
        this.phaseLight(next);
        phase.startTick = this.tick;
        phase.ambientNext = this.tick;
        phase.ambientsNext = undefined;
        phase.opener = next.opener
            ? boss.def.boss!.attacks.find((a) => a.name === next.opener)
            : undefined;
        this.pushStage(boss, phase, next.message ?? next.status ?? "");
    }

    // Flies round these heroes: they're thrown back once the tell's done
    private startKephriDung(fight: KephriFight, heroes: number[]): void {
        const def = this.enemies.find((e) => e.uid === fight.uid)?.def.boss?.kephri;
        if (!def || heroes.length === 0) {
            return;
        }
        fight.dung = { heroes, strikeTick: this.tick + secondsToTicks(def.dung.warn) };
        const current = this.hero;
        for (const index of heroes) {
            this.use(this.heroes[index]);
            this.emit({ type: "notice", message: def.dung.message }, true);
        }
        this.use(current);
    }

    // Dung Strike, now and then outside her intermissions (Blowing Mud: on two of the party)
    private stepKephriDung(boss: Enemy, fight: KephriFight, def: KephriDef): void {
        if (!fight.dung) {
            if (fight.intermission || this.tick < fight.nextDungTick || boss.bossState?.windup) {
                return;
            }
            fight.nextDungTick = this.tick + secondsToTicks(this.kephriDungEvery(def));
            const up = this.heroes.filter((hero) => this.isUp(hero));
            const picked: number[] = [];
            const want = Math.min(up.length, this.invoked("blowing_mud") ? 2 : 1);
            while (picked.length < want) {
                const hero = up[this.rng.int(up.length)];
                if (!picked.includes(hero.index)) {
                    picked.push(hero.index);
                }
            }
            this.startKephriDung(fight, picked);
            return;
        }
        if (this.tick < fight.dung.strikeTick) {
            return;
        }
        const heroes = fight.dung.heroes;
        fight.dung = undefined;
        const current = this.hero;
        const damage = def.dung.damage * this.tombsHazardScale();
        for (const index of heroes) {
            const hero = this.heroes[index];
            if (!hero || !this.isUp(hero)) {
                continue;
            }
            this.use(hero);
            const player = this.player;
            // Straight away from her, as far as the floor goes
            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const length = Math.max(0.001, fm.hypot(dx, dy));
            const ux = dx / length;
            const uy = dy / length;
            const fromX = player.x;
            const fromY = player.y;
            let gone = 0;
            for (let step = 0.25; step <= def.dung.knock; step += 0.25) {
                const x = fromX + ux * step;
                const y = fromY + uy * step;
                // Walls on a tile's edge too (her arena's sides), not only solid tiles: the
                // throw went through them, out of the arena
                if (
                    !this.grid.contains(x, y) ||
                    this.grid.isSolid(x, y) ||
                    !isCircleFree(this.grid, x, y, player.radius)
                ) {
                    break;
                }
                gone = step;
            }
            player.x = player.prevX = fromX + ux * gone;
            player.y = player.prevY = fromY + uy * gone;
            player.frozen = Math.max(player.frozen, secondsToTicks(def.dung.stun));
            this.damagePlayer(damage, boss.def.id, false);
            this.emit({ type: "notice", message: def.dung.thrownMessage }, true);
            // Dung down along the way: walls for a while
            for (let along = def.dung.gap; along < gone - 0.5; along += def.dung.gap) {
                const x = fromX + ux * along;
                const y = fromY + uy * along;
                this.tombsCover.push({
                    x,
                    y,
                    radius: def.dung.radius,
                    endTick: this.tick + secondsToTicks(def.dung.seconds),
                    look: "loc:" + def.dung.pileLoc,
                });
                this.addEffect(def.dung.dropSpotAnim, x, y, 0, 40);
            }
        }
        this.use(current);
    }

    // Her light eggs, going off as they'd hatch if nobody's broken them
    private stepKephriEggs(boss: Enemy, def: KephriDef): void {
        const eggs = def.eggs;
        for (const egg of this.enemies) {
            if (egg.dead || egg.def.id !== eggs.explodeId || egg.hatchTick === 0) {
                continue;
            }
            if (this.tick < egg.hatchTick - 1) {
                continue;
            }
            const damage = eggs.damage * this.tombsHazardScale();
            this.forEachHeroInReach(() => {
                const player = this.player;
                if (
                    Math.abs(player.x - egg.x) <= eggs.radius &&
                    Math.abs(player.y - egg.y) <= eggs.radius
                ) {
                    this.damagePlayer(damage, boss.def.id, false);
                }
            });
            this.addEffect(eggs.spotAnim, egg.x, egg.y, 0, 40);
            this.fireShards(boss, KEPHRI_EGG_BLAST, KEPHRI_EGG_BLAST.shards!, egg.x, egg.y);
            this.vanish(egg);
        }
    }

    // Her Arcane Scarab: charging, going off all round once charged, and flying off to charge
    // again somewhere else if it's hit hard enough meanwhile
    private stepKephriArcane(boss: Enemy, fight: KephriFight, def: KephriDef): void {
        const arcane = def.arcane;
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.def.id !== arcane.enemyId) {
                continue;
            }
            let charge = fight.arcane.get(enemy.uid);
            const chargeTicks = secondsToTicks(
                Math.max(3, arcane.charge - 0.5 * this.tombsPathWeight),
            );
            if (!charge) {
                charge = { startTick: this.tick, hpAt: enemy.hp, spot: 0 };
                fight.arcane.set(enemy.uid, charge);
                this.addEffect(arcane.spotAnim, enemy.x, enemy.y, 0, chargeTicks, enemy.uid, true);
                this.emit({ type: "notice", message: arcane.message });
            }
            if (charge.hpAt - enemy.hp >= enemy.maxHp * arcane.disperse) {
                // Dispersed: off to the next spot, to start over
                charge.spot = (charge.spot + 1) % arcane.spots.length;
                const [dx, dy] = arcane.spots[charge.spot];
                enemy.x = enemy.prevX = boss.x + dx;
                enemy.y = enemy.prevY = boss.y + dy;
                this.endEffectsOn(enemy.uid);
                charge.startTick = this.tick;
                charge.hpAt = enemy.hp;
                this.addEffect(arcane.spotAnim, enemy.x, enemy.y, 0, chargeTicks, enemy.uid, true);
                this.emit({ type: "notice", message: "The Arcane Scarab's swarm scatters!" });
                continue;
            }
            if (this.tick - charge.startTick >= chargeTicks) {
                this.fireShards(
                    boss,
                    KEPHRI_ARCANE_BLAST,
                    KEPHRI_ARCANE_BLAST.shards!,
                    enemy.x,
                    enemy.y,
                );
                charge.startTick = this.tick;
                charge.hpAt = enemy.hp;
                this.addEffect(arcane.spotAnim, enemy.x, enemy.y, 0, chargeTicks, enemy.uid, true);
            }
        }
    }

    // Ends the effects following an enemy now
    private endEffectsOn(uid: number): void {
        for (const effect of this.effects) {
            if (effect.enemyUid === uid) {
                effect.endTick = this.tick;
            }
        }
    }

    // Who Kephri's flies are round, for drawing them
    get kephriDungHeroes(): number[] {
        return this.tombsKephri?.dung?.heroes ?? [];
    }

    // ---- The Crondis room ----

    // Begins: the palm a sapling, everyone's container empty, the waterfalls running, and the
    // first wave in
    private startCrondis(room: TombsRoom, def: CrondisDef): void {
        const palm = this.spawnEnemy(getEnemy(CRONDIS_PALMS[0].id), "normal", def.palm);
        const goal =
            CRONDIS.goal +
            CRONDIS.perHero * (this.heroes.length - 1) +
            Math.round(CRONDIS.perLevel * this.tombsPathWeight);
        if (palm) {
            palm.noDrops = true;
            palm.maxHp = goal;
            palm.hp = 1;
            palm.shieldEnd = this.tick + 2;
        }
        const step = secondsToTicks(CRONDIS.spearStep);
        room.crondis = {
            palmUid: palm?.uid ?? -1,
            growth: 0,
            goal,
            stage: 0,
            water: this.heroes.map(() => 0),
            filling: this.heroes.map(() => 0),
            dryUntil: def.falls.map(() => -1),
            // Each corridor's spears a little out of step with the others'
            spears: def.lanes.map((_, i) => ({ nextTick: this.tick + i * step * 2, pair: 0 })),
            thrusts: [],
            clouds: [],
            nextCloudTick: def.lanes.map(
                (_, i) => this.tick + secondsToTicks(3 + (i * this.crondisCloudEvery()) / 4),
            ),
        };
        this.nextCrondisWave(room);
        this.emit({
            type: "notice",
            message:
                "Grow the Palm of Resourcefulness! Fill up at the waterfalls and bring it back, " +
                "past the spears and the poison. A hit spills your water.",
        });
    }

    private crondisCloudEvery(): number {
        return Math.max(CRONDIS.cloudEveryLeast, CRONDIS.cloudEvery - 1.2 * this.tombsPathWeight);
    }

    private nextCrondisWave(room: TombsRoom): void {
        room.wave = Math.min(room.wave + 1, CRONDIS_WAVES.length - 1);
        room.waveTick = this.tick;
        const ids = [...CRONDIS_WAVES[room.wave]];
        for (let i = 0; i < this.tombsPathLevel; i++) {
            ids.push(ids[ids.length - 1]);
        }
        room.group = [];
        room.pending = [...room.pending, ...ids];
        room.nextOutTick = this.tick;
    }

    private stepCrondis(room: TombsRoom, def: CrondisDef): void {
        const crondis = room.crondis;
        if (!crondis) {
            return;
        }
        const palm = this.enemies.find((e) => e.uid === crondis.palmUid && !e.dead);
        if (palm) {
            palm.shieldEnd = this.tick + 2;
        }
        this.stepCrondisWater(room, crondis, def, palm);
        if (room.doneTick !== undefined) {
            return;
        }
        this.stepCrondisSpears(crondis, def);
        this.stepCrondisClouds(crondis, def);
        // Hungry crocodiles at the palm eat its growth (not below the stage it's reached)
        if (palm) {
            const eat = CRONDIS.eat / TICKS_PER_SECOND;
            const floor = (crondis.stage * crondis.goal) / 4;
            for (const enemy of this.enemies) {
                if (enemy.dead || enemy.def.id !== "crondis_crocodile_hungry") {
                    continue;
                }
                const reach = palm.radius + enemy.radius + 0.8;
                if (fm.hypot(enemy.x - palm.x, enemy.y - palm.y) <= reach) {
                    crondis.growth = Math.max(floor, crondis.growth - eat);
                }
            }
            // Its bar's its growth: never quite full, so the crocodiles always want it
            palm.hp = Math.max(1, Math.min(palm.maxHp - 1, Math.round(crondis.growth)));
        }
    }

    // Filling up at a running waterfall, and pouring it on the palm
    private stepCrondisWater(
        room: TombsRoom,
        crondis: CrondisRoom,
        def: CrondisDef,
        palm: Enemy | undefined,
    ): void {
        const fill = secondsToTicks(CRONDIS.fill);
        const current = this.hero;
        for (const hero of this.heroes) {
            if (!this.isUp(hero)) {
                crondis.filling[hero.index] = 0;
                continue;
            }
            const { x, y } = hero.player;
            const at = this.crondisFallAt(def, x, y);
            if (
                at !== -1 &&
                this.tick >= crondis.dryUntil[at] &&
                crondis.water[hero.index] < CRONDIS.carry
            ) {
                crondis.filling[hero.index]++;
                if (crondis.filling[hero.index] >= fill) {
                    crondis.filling[hero.index] = 0;
                    crondis.water[hero.index] = CRONDIS.carry;
                    crondis.dryUntil[at] = this.tick + secondsToTicks(CRONDIS.refill);
                    this.use(hero);
                    this.emit({ type: "notice", message: "You fill your water container." }, true);
                }
            } else {
                crondis.filling[hero.index] = 0;
            }
            const water = crondis.water[hero.index];
            if (palm && water > 0) {
                const reach = palm.radius + hero.player.radius + CRONDIS.pour;
                if (fm.hypot(palm.x - x, palm.y - y) <= reach) {
                    crondis.water[hero.index] = 0;
                    crondis.growth = Math.min(crondis.goal, crondis.growth + water);
                    this.addEffect(CRONDIS.spotAnims.pour, palm.x, palm.y, 0, 40);
                }
            }
        }
        this.use(current);
        // A stage grown: a casket, the next wave, and the palm as it is now
        const stage = Math.min(4, Math.floor((crondis.growth / crondis.goal) * 4 + 1e-9));
        if (stage <= crondis.stage) {
            return;
        }
        crondis.stage = stage;
        if (palm) {
            palm.def = getEnemy(CRONDIS_PALMS[stage].id);
            this.appearanceVersion++;
        }
        if (!this.tombsReplaying) {
            const player = this.player;
            this.dropCasket(player.x + 0.8, player.y, false);
        }
        if (stage === 4) {
            room.doneTick = this.tick;
            crondis.thrusts = [];
            crondis.clouds = [];
            this.emit({
                type: "notice",
                message: "The Palm of Resourcefulness is fully grown! The way on is open.",
            });
            return;
        }
        this.emit({ type: "notice", message: `The palm grows! ${stage} of 4.` });
        this.nextCrondisWave(room);
    }

    // The spear statues: down each corridor a pair of rows at a time, the side turning about,
    // then a rest; each thrust's tell, then out across its three tiles
    private stepCrondisSpears(crondis: CrondisRoom, def: CrondisDef): void {
        const tell = secondsToTicks(CRONDIS.spearTell);
        const hold = secondsToTicks(CRONDIS.spearHold);
        def.lanes.forEach((lane, i) => {
            const spears = crondis.spears[i];
            if (this.tick < spears.nextTick) {
                return;
            }
            const pairs = Math.floor((lane.y1 - lane.y0 + 1) / 2);
            const side = (spears.pair + i) % 2 === 0 ? "low" : "high";
            crondis.thrusts.push({
                lane: i,
                pair: spears.pair,
                side,
                startTick: this.tick,
                hit: [],
            });
            spears.pair++;
            const rest = spears.pair >= pairs;
            if (rest) {
                spears.pair = 0;
            }
            spears.nextTick =
                this.tick + secondsToTicks(rest ? CRONDIS.spearRest : CRONDIS.spearStep);
        });
        const damage = CRONDIS.spearDamage * this.tombsHazardScale();
        crondis.thrusts = crondis.thrusts.filter((thrust) => {
            const age = this.tick - thrust.startTick;
            if (age >= tell + hold) {
                return false;
            }
            if (age < tell) {
                return true;
            }
            const area = this.crondisSpearArea(def, thrust);
            this.forEachHeroInReach(() => {
                const { x, y } = this.player;
                const index = this.hero.index;
                if (
                    !thrust.hit.includes(index) &&
                    x >= area.x0 &&
                    x <= area.x1 &&
                    y >= area.y0 &&
                    y <= area.y1
                ) {
                    thrust.hit.push(index);
                    this.crondisTrapHit(damage, "The spear catches you: your water spills!");
                }
            });
            return true;
        });
    }

    // The tiles a thrust reaches: three out from its statue, across its pair of rows
    crondisSpearArea(
        def: CrondisDef,
        thrust: CrondisRoom["thrusts"][number],
    ): { x0: number; x1: number; y0: number; y1: number } {
        const lane = def.lanes[thrust.lane];
        const y0 = lane.y0 + thrust.pair * 2;
        const x0 = thrust.side === "low" ? lane.low + 1 : lane.high - 3;
        return { x0, x1: x0 + 3, y0, y1: y0 + 2 };
    }

    // Poison down each corridor from its waterfall's end: the pale cloud first, the dark one
    // behind it
    private stepCrondisClouds(crondis: CrondisRoom, def: CrondisDef): void {
        def.lanes.forEach((_, i) => {
            if (this.tick >= crondis.nextCloudTick[i]) {
                crondis.nextCloudTick[i] = this.tick + secondsToTicks(this.crondisCloudEvery());
                crondis.clouds.push({ lane: i, startTick: this.tick, hit: [] });
            }
        });
        const damage = CRONDIS.cloudDamage * this.tombsHazardScale();
        crondis.clouds = crondis.clouds.filter((cloud) => {
            const lane = def.lanes[cloud.lane];
            const { dark } = this.crondisCloud(def, cloud);
            const length = lane.y1 - lane.y0 + 1;
            if (dark - CRONDIS.cloudLength > length + 2) {
                return false;
            }
            this.forEachHeroInReach(() => {
                const hero = this.hero;
                const { x, y } = this.player;
                if (cloud.hit.includes(hero.index) || x < lane.x0 || x > lane.x1 + 1) {
                    return;
                }
                // Under a waterfall, as OSRS's: the poison doesn't reach them there, running or
                // dry (filling dries it, so it'd go the moment they'd filled)
                if (this.crondisFallAt(def, x, y) !== -1) {
                    return;
                }
                // How far along from the waterfall's end
                const along = lane.fromLow ? y - lane.y0 : lane.y1 + 1 - y;
                if (along <= dark && along >= dark - CRONDIS.cloudLength) {
                    cloud.hit.push(hero.index);
                    this.crondisTrapHit(damage, "The poison catches you: your water spills!");
                }
            });
            return true;
        });
    }

    // The waterfall someone at (x, y) is under (where they fill their water), or -1
    private crondisFallAt(def: CrondisDef, x: number, y: number): number {
        return def.falls.findIndex((fall) => fm.hypot(fall.fill.x - x, fall.fill.y - y) <= 1.5);
    }

    // How far down its corridor a cloud's pale front and dark front are, in tiles from the
    // waterfall's end
    crondisCloud(
        def: CrondisDef,
        cloud: CrondisRoom["clouds"][number],
    ): { pale: number; dark: number } {
        const seconds = (this.tick - cloud.startTick) / TICKS_PER_SECOND;
        return {
            pale: seconds * CRONDIS.cloudSpeed,
            dark: Math.max(0, seconds - CRONDIS.cloudBehind) * CRONDIS.cloudSpeed,
        };
    }

    // A trap's hit on the current hero: hurt, their water spilt, weakened
    private crondisTrapHit(damage: number, message: string): void {
        if (this.damagePlayer(damage, "crondis_trap", false) === 0) {
            return;
        }
        this.crondisSpill(message);
        this.applyPlayerEffect(CRONDIS.weakened);
    }

    // The current hero's water, half of it spilt (a trap, or a crocodile's bite)
    private crondisSpill(message?: string): void {
        const crondis = this.tombsRoom?.crondis;
        const index = this.hero.index;
        if (!crondis || crondis.water[index] <= 0) {
            return;
        }
        crondis.water[index] = Math.floor(crondis.water[index] * (1 - CRONDIS.spill));
        if (message) {
            this.emit({ type: "notice", message }, true);
        }
    }

    // The room for the HUD: your water, and the palm's growth against what it needs
    get crondisInfo(): { water: number; growth: number; goal: number } | undefined {
        const crondis = this.tombsRoom?.crondis;
        if (!crondis || this.tombsRoom?.doneTick !== undefined) {
            return undefined;
        }
        return {
            water: crondis.water[this.hero.index] ?? 0,
            growth: Math.floor(crondis.growth),
            goal: crondis.goal,
        };
    }

    // ---- The Scabaras room ----

    // Begins: every board laid out afresh, the first wave in
    private startScabaras(room: TombsRoom, def: ScabarasDef): void {
        const level = this.tombsPathLevel;
        room.scabaras = {
            solved: [],
            sequence: { order: [], showFrom: -1, step: 0 },
            lights: this.scrambleScabarasLights(def, SCABARAS.scramble + level),
            nextDarkTick: this.tick + secondsToTicks(this.scabarasDarkenEvery()),
            addition: this.layOutScabarasAddition(def),
            matching: this.layOutScabarasMatching(def, level),
            standing: new Array<string | undefined>(this.heroes.length).fill(undefined),
            rocks: [],
            nextRockTick: this.tick + secondsToTicks(this.scabarasRockEvery()),
            shards: [],
        };
        this.nextScabarasWave(room);
    }

    private scabarasDarkenEvery(): number {
        return Math.max(SCABARAS.darkenLeast, SCABARAS.darken - 1.5 * this.tombsPathWeight);
    }

    private scabarasRockEvery(): number {
        return Math.max(SCABARAS.rockEveryLeast, SCABARAS.rockEvery - 0.5 * this.tombsPathWeight);
    }

    // A new order for the Sequence's plates, shown after so many seconds: no plate twice
    private newScabarasSequence(def: ScabarasDef, after: number): ScabarasRoom["sequence"] {
        const steps = Math.min(
            SCABARAS.sequenceMost,
            SCABARAS.sequenceSteps + Math.floor(this.tombsPathLevel / SCABARAS.sequenceEvery),
        );
        const plates = def.sequence.map((_, i) => i);
        const order: number[] = [];
        for (let i = 0; i < steps && plates.length > 0; i++) {
            order.push(plates.splice(this.rng.int(plates.length), 1)[0]);
        }
        return { order, showFrom: this.tick + secondsToTicks(after), step: 0 };
    }

    // The ring all lit, then so many of its plates stepped on: never all lit as it starts
    private scrambleScabarasLights(def: ScabarasDef, presses: number): boolean[] {
        const count = def.lights.length;
        for (let attempt = 0; attempt < 20; attempt++) {
            const lights = new Array<boolean>(count).fill(true);
            const plates = lights.map((_, i) => i);
            for (let i = 0; i < Math.min(presses, count); i++) {
                this.toggleScabarasLight(lights, plates.splice(this.rng.int(plates.length), 1)[0]);
            }
            if (lights.some((lit) => !lit)) {
                return lights;
            }
        }
        const lights = new Array<boolean>(count).fill(true);
        lights[0] = false;
        return lights;
    }

    // A plate on the ring, stepped on: it and the two beside it change
    private toggleScabarasLight(lights: boolean[], plate: number): void {
        const count = lights.length;
        for (const i of [plate - 1, plate, plate + 1]) {
            const at = (i + count) % count;
            lights[at] = !lights[at];
        }
    }

    // Addition: OSRS's board's symbols, and the tablet's number, targetLeast to targetMost (the
    // board makes every one of them, as the wiki's chart shows)
    private layOutScabarasAddition(def: ScabarasDef): ScabarasRoom["addition"] {
        const board = SCABARAS.additionBoard;
        if (def.addition.length !== board.length) {
            throw new Error(
                `Addition's board needs ${board.length} plates, not ${def.addition.length}`,
            );
        }
        const values = board.map((symbol) => symbol + 1);
        const target =
            SCABARAS.targetLeast + this.rng.int(SCABARAS.targetMost - SCABARAS.targetLeast + 1);
        return { values, target, stepped: values.map(() => false), sum: 0 };
    }

    // Matching's boards: the nine symbols on each, shuffled apart, and preSolved of them matched
    private layOutScabarasMatching(def: ScabarasDef, level: number): ScabarasRoom["matching"] {
        const shuffled = () => {
            const symbols = def.matching.north.map((_, i) => i);
            for (let i = symbols.length - 1; i > 0; i--) {
                const j = this.rng.int(i + 1);
                [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
            }
            return symbols;
        };
        const north = shuffled();
        const south = shuffled();
        const matched = north.map(() => false);
        const party = this.heroes.filter((hero) => !hero.left).length;
        const solved = party > 1 ? 0 : Math.max(0, SCABARAS.preSolved - level);
        for (let i = 0; i < solved; i++) {
            matched[north[i]] = true;
        }
        return { north, south, matched, up: {}, hideTick: -1 };
    }

    private nextScabarasWave(room: TombsRoom): void {
        room.wave = Math.min(room.wave + 1, SCABARAS_WAVES.length - 1);
        room.waveTick = this.tick;
        const ids = [...SCABARAS_WAVES[room.wave]];
        for (let i = 0; i < this.tombsPathLevel; i++) {
            ids.push(ids[ids.length - 1]);
        }
        room.group = [];
        room.pending = [...room.pending, ...ids];
        room.nextOutTick = this.tick;
    }

    // When the Sequence's order has been shown
    private scabarasShowEnd(sequence: ScabarasRoom["sequence"]): number {
        return (
            sequence.showFrom +
            sequence.order.length * secondsToTicks(SCABARAS.flash + SCABARAS.gap)
        );
    }

    // How many of the Sequence's plates have lit so far as its order's shown, all once it has (none
    // before it starts), for the puzzle helper's numbers
    get scabarasSequenceShown(): number {
        const sequence = this.tombsRoom?.scabaras?.sequence;
        if (!sequence || sequence.showFrom === -1 || this.tick < sequence.showFrom) {
            return 0;
        }
        const each = secondsToTicks(SCABARAS.flash + SCABARAS.gap);
        return Math.min(
            sequence.order.length,
            Math.floor((this.tick - sequence.showFrom) / each) + 1,
        );
    }

    // The Sequence's plate lit now while its order's shown, if any
    get scabarasLitPlate(): number | undefined {
        const sequence = this.tombsRoom?.scabaras?.sequence;
        if (!sequence || sequence.showFrom === -1 || this.tick < sequence.showFrom) {
            return undefined;
        }
        const each = secondsToTicks(SCABARAS.flash + SCABARAS.gap);
        const since = this.tick - sequence.showFrom;
        const i = Math.floor(since / each);
        if (i >= sequence.order.length || since - i * each >= secondsToTicks(SCABARAS.flash)) {
            return undefined;
        }
        return sequence.order[i];
    }

    // The room's puzzles for the HUD: how many solved; Addition's number and what's made, once
    // the tablet can be read (Sequence and Lights out solved); and whether whoever's playing is
    // by a slate (what the symbols are worth) or the tablet, for its screen
    get scabarasInfo():
        | {
              solved: number;
              of: number;
              target: number;
              sum: number;
              readable: boolean;
              reading?: "slate" | "tablet";
              puzzles: ScabarasPuzzleState[];
          }
        | undefined {
        const scabaras = this.tombsRoom?.scabaras;
        const def = this.tombsPathRoom?.scabaras;
        if (!scabaras || !def || this.tombsRoom?.doneTick !== undefined) {
            return undefined;
        }
        const player = this.player;
        const near = (p: { x: number; y: number }) =>
            fm.hypot(p.x - player.x, p.y - player.y) <= SCABARAS.slateReach;
        return {
            solved: scabaras.solved.length,
            of: 4,
            target: scabaras.addition.target,
            sum: scabaras.addition.sum,
            readable: this.scabarasTabletReadable(scabaras),
            reading: def.slates.some(near) ? "slate" : near(def.tablet) ? "tablet" : undefined,
            // Each puzzle, and whether it can be done yet: Addition once Sequence and Lights out
            // are, Matching once the other three are
            puzzles: (["sequence", "lights", "addition", "matching"] as const).map((puzzle) => ({
                puzzle,
                state: scabaras.solved.includes(puzzle)
                    ? "solved"
                    : puzzle === "addition"
                      ? this.scabarasTabletReadable(scabaras)
                          ? "open"
                          : "waiting"
                      : puzzle === "matching"
                        ? scabaras.solved.length >= 3
                            ? "open"
                            : "waiting"
                        : "open",
            })),
        };
    }

    // The Ancient tablet's read, and Addition's board works, once Sequence and Lights out are
    // solved, as OSRS's is once the puzzles before it are
    private scabarasTabletReadable(scabaras: ScabarasRoom): boolean {
        return scabaras.solved.includes("sequence") && scabaras.solved.includes("lights");
    }

    private stepScabaras(room: TombsRoom, def: ScabarasDef): void {
        const scabaras = room.scabaras;
        if (!scabaras) {
            return;
        }
        this.stepScabarasPlates(room, scabaras, def);
        if (room.doneTick !== undefined) {
            return;
        }
        // Lights out: a scarab knocks one out now and then
        if (!scabaras.solved.includes("lights") && this.tick >= scabaras.nextDarkTick) {
            scabaras.nextDarkTick = this.tick + secondsToTicks(this.scabarasDarkenEvery());
            const lit = scabaras.lights.flatMap((on, i) => (on ? [i] : []));
            if (lit.length > 0) {
                scabaras.lights[lit[this.rng.int(lit.length)]] = false;
                this.emit({
                    type: "notice",
                    message: "A light on the ring goes out.",
                });
            }
        }
        // Matching's turned-up pair, hidden again
        const matching = scabaras.matching;
        if (matching.hideTick !== -1 && this.tick >= matching.hideTick) {
            matching.hideTick = -1;
            matching.up = {};
        }
        this.stepScabarasRocks(scabaras);
    }

    // Who's on which plate: stepping on one (from off it) is what works it
    private stepScabarasPlates(room: TombsRoom, scabaras: ScabarasRoom, def: ScabarasDef): void {
        const boards: [string, { x: number; y: number }[]][] = [
            ["s", def.sequence],
            ["l", def.lights],
            ["a", def.addition],
            ["n", def.matching.north],
            ["m", def.matching.south],
        ];
        const current = this.hero;
        for (const hero of this.heroes) {
            if (!this.isUp(hero)) {
                scabaras.standing[hero.index] = undefined;
                continue;
            }
            const { x, y } = hero.player;
            const tileX = Math.floor(x);
            const tileY = Math.floor(y);
            // Onto a plate by coming well into its tile (within plateInside of its middle), and
            // off it by leaving its tile, as OSRS's go by tiles: so a diagonal step from plate to
            // plate, through the corner, touches neither of the two beside it
            const was = scabaras.standing[hero.index];
            let on: string | undefined;
            for (const [board, plates] of boards) {
                const i = plates.findIndex(
                    (p) =>
                        Math.abs(p.x - x) <= SCABARAS.plateInside &&
                        Math.abs(p.y - y) <= SCABARAS.plateInside,
                );
                if (i !== -1) {
                    on = board + i;
                    break;
                }
            }
            if (!on && was && was[0] !== "b") {
                const plates = boards.find(([board]) => board === was[0])![1];
                const p = plates[Number(was.slice(1))];
                if (Math.floor(p.x) === tileX && Math.floor(p.y) === tileY) {
                    on = was;
                }
            }
            if (!on && fm.hypot(def.button.x - x, def.button.y - y) <= SCABARAS.buttonReach) {
                on = "b0";
            }
            if (on === scabaras.standing[hero.index]) {
                continue;
            }
            scabaras.standing[hero.index] = on;
            if (on) {
                this.use(hero);
                this.stepOnScabaras(room, scabaras, def, on[0], Number(on.slice(1)));
                if (room.doneTick !== undefined) {
                    break;
                }
            }
        }
        this.use(current);
    }

    // A plate stepped on, by the current hero
    private stepOnScabaras(
        room: TombsRoom,
        scabaras: ScabarasRoom,
        def: ScabarasDef,
        board: string,
        plate: number,
    ): void {
        const solved = (puzzle: ScabarasPuzzle) => scabaras.solved.includes(puzzle);
        if (board === "b") {
            // The Ancient button: an order shown now (another, pushed again), not mid-show
            // (nor once someone's part way through it)
            const sequence = scabaras.sequence;
            if (
                solved("sequence") ||
                sequence.step > 0 ||
                (sequence.showFrom !== -1 && this.tick < this.scabarasShowEnd(sequence))
            ) {
                return;
            }
            scabaras.sequence = this.newScabarasSequence(def, SCABARAS.showAfter);
            this.emit({ type: "notice", message: "You push the button." }, true);
            return;
        }
        if (board === "s" && !solved("sequence")) {
            const sequence = scabaras.sequence;
            if (sequence.order.length === 0) {
                this.scabarasHint("Nothing happens. Push the button first.");
                return;
            }
            // Nothing while it's being shown, or on a plate already done (one not in the order
            // at all is wrong)
            const at = sequence.order.indexOf(plate);
            if (this.tick < this.scabarasShowEnd(sequence) || (at !== -1 && at < sequence.step)) {
                return;
            }
            if (sequence.order[sequence.step] !== plate) {
                this.scabarasWrong("Wrong plate! Rocks fall from the ceiling.");
                scabaras.sequence = { order: [], showFrom: -1, step: 0 };
                return;
            }
            sequence.step++;
            if (sequence.step === sequence.order.length) {
                this.solveScabaras(room, scabaras, "sequence");
            }
            return;
        }
        if (board === "l" && !solved("lights")) {
            this.toggleScabarasLight(scabaras.lights, plate);
            if (scabaras.lights.every((lit) => lit)) {
                this.solveScabaras(room, scabaras, "lights");
            }
            return;
        }
        if (board === "a" && !solved("addition")) {
            const addition = scabaras.addition;
            if (!this.scabarasTabletReadable(scabaras)) {
                this.scabarasHint("The symbols are dull. Solve the other puzzles first.");
                return;
            }
            if (addition.stepped[plate]) {
                return;
            }
            addition.stepped[plate] = true;
            addition.sum += addition.values[plate];
            if (addition.sum > addition.target) {
                this.scabarasWrong("Too much! Rocks fall from the ceiling.");
                addition.stepped.fill(false);
                addition.sum = 0;
                return;
            }
            if (addition.sum === addition.target) {
                this.solveScabaras(room, scabaras, "addition");
            }
            return;
        }
        if ((board === "n" || board === "m") && !solved("matching")) {
            if (scabaras.solved.length < 3) {
                this.scabarasHint("The tiles won't turn yet.");
                return;
            }
            const matching = scabaras.matching;
            const side = board === "n" ? "north" : "south";
            if (matching.hideTick !== -1 || matching.matched[matching[side][plate]]) {
                return;
            }
            matching.up[side] = plate;
            const { north, south } = matching.up;
            if (north === undefined || south === undefined) {
                return;
            }
            if (matching.north[north] === matching.south[south]) {
                matching.matched[matching.north[north]] = true;
                matching.up = {};
                if (matching.matched.every((m) => m)) {
                    this.solveScabaras(room, scabaras, "matching");
                }
                return;
            }
            matching.hideTick = this.tick + secondsToTicks(SCABARAS.reveal);
            this.scabarasWrong("They don't match! Rocks fall from the ceiling.");
        }
    }

    // A mistake: a rock on whoever made it, for a share of their hitpoints, breaking into shards
    // A reminder of what a puzzle wants, said once in a while, not for every plate crossed
    private scabarasHint(message: string): void {
        const last = this.scabarasHintTicks.get(message);
        if (last !== undefined && this.tick - last < secondsToTicks(SCABARAS.hintEvery)) {
            return;
        }
        this.scabarasHintTicks.set(message, this.tick);
        this.emit({ type: "notice", message }, true);
    }

    private scabarasWrong(message: string): void {
        const player = this.player;
        const scabaras = this.tombsRoom!.scabaras!;
        const { x, y } = player;
        this.emit({ type: "notice", message });
        this.addEffect(
            SCABARAS.rockSpotAnim,
            player.x,
            player.y,
            0,
            secondsToTicks(SCABARAS.rockWarn),
        );
        this.damagePlayer(
            player.maxHp * this.tombsShare(SCABARAS.wrongShare),
            "scabaras_scarab",
            false,
            undefined,
            true,
        );
        // Not if that was the end of them, and the room's started over
        if (this.tombsRoom?.scabaras === scabaras) {
            this.scabarasShards(scabaras, x, y);
        }
    }

    private solveScabaras(room: TombsRoom, scabaras: ScabarasRoom, puzzle: ScabarasPuzzle): void {
        scabaras.solved.push(puzzle);
        if (puzzle === "matching") {
            room.doneTick = this.tick;
            this.scabarasBeaten = true;
            scabaras.rocks = [];
            scabaras.shards = [];
            this.emit({ type: "notice", message: "The way on opens." });
        } else {
            this.emit({
                type: "notice",
                message:
                    scabaras.solved.length < 3
                        ? "Puzzle solved."
                        : "Puzzle solved. The symbols in the far room stir.",
            });
        }
        if (!this.tombsReplaying) {
            const player = this.player;
            this.dropCasket(player.x + 0.8, player.y, false);
        }
        if (room.doneTick === undefined) {
            this.nextScabarasWave(room);
        }
    }

    // Rocks from the roof on everyone, now and then: where each lands shows as it falls
    private stepScabarasRocks(scabaras: ScabarasRoom): void {
        if (this.tick >= scabaras.nextRockTick) {
            scabaras.nextRockTick = this.tick + secondsToTicks(this.scabarasRockEvery());
            const warn = secondsToTicks(SCABARAS.rockWarn);
            for (const hero of this.heroes) {
                if (!this.isUp(hero)) {
                    continue;
                }
                const x = Math.floor(hero.player.x + this.rng.range(-1.5, 1.5)) + 0.5;
                const y = Math.floor(hero.player.y + this.rng.range(-1.5, 1.5)) + 0.5;
                if (!this.grid.contains(x, y) || this.grid.isSolid(x, y)) {
                    continue;
                }
                scabaras.rocks.push({ x, y, landTick: this.tick + warn });
                this.addEffect(SCABARAS.rockSpotAnim, x, y, 0, warn);
            }
        }
        const damage = SCABARAS.rockDamage * this.tombsHazardScale();
        scabaras.rocks = scabaras.rocks.filter((rock) => {
            if (this.tick < rock.landTick) {
                return true;
            }
            this.forEachHeroInReach(() => {
                const player = this.player;
                const reach = SCABARAS.rockRadius + player.radius;
                if (fm.hypot(player.x - rock.x, player.y - rock.y) <= reach) {
                    this.damagePlayer(damage, "scabaras_scarab", false);
                }
            });
            this.scabarasShards(scabaras, rock.x, rock.y);
            return false;
        });
        const shardDamage = SCABARAS.shardDamage * this.tombsHazardScale();
        scabaras.shards = scabaras.shards.filter((shard) => {
            shard.x += shard.vx;
            shard.y += shard.vy;
            shard.life--;
            if (
                shard.life <= 0 ||
                !this.grid.contains(shard.x, shard.y) ||
                this.grid.isSolid(shard.x, shard.y)
            ) {
                return false;
            }
            let hit = false;
            this.forEachHeroInReach(() => {
                const player = this.player;
                const reach = SCABARAS.shardRadius + player.radius;
                if (
                    !hit &&
                    this.tick >= shard.armTick &&
                    fm.hypot(player.x - shard.x, player.y - shard.y) <= reach
                ) {
                    hit = true;
                    this.damagePlayer(shardDamage, "scabaras_scarab", false);
                }
            });
            return !hit;
        });
    }

    // A rock breaking up where it lands: shards out all round
    private scabarasShards(scabaras: ScabarasRoom, x: number, y: number): void {
        const count = SCABARAS.shards + this.tombsPathLevel;
        const speed = SCABARAS.shardSpeed / TICKS_PER_SECOND;
        const life = Math.ceil(SCABARAS.shardRange / speed);
        const armTick = this.tick + Math.ceil((SCABARAS.rockRadius + 0.6) / speed);
        const turn = this.rng.range(0, Math.PI * 2);
        for (let i = 0; i < count; i++) {
            const angle = turn + (i * Math.PI * 2) / count;
            scabaras.shards.push({
                x: x + fm.cos(angle) * 0.4,
                y: y + fm.sin(angle) * 0.4,
                vx: fm.cos(angle) * speed,
                vy: fm.sin(angle) * speed,
                life,
                armTick,
            });
        }
    }

    // ---- The Het room ----

    // Begins: its mirrors, spots and barriers laid out afresh, the seal up and shielded, the first
    // wave in
    private startHet(room: TombsRoom, def: HetDef): void {
        const seal = this.spawnEnemy(getEnemy("hets_seal"), "normal", def.seal);
        if (seal) {
            seal.noDrops = true;
            seal.shieldEnd = this.tick + 2;
            // OSRS's: the same at every raid level, more for each of the party
            const party = this.heroes.filter((hero) => !hero.left).length;
            seal.maxHp = seal.hp = HET.sealHp * party;
        }
        room.het = {
            ...this.layOutHet(def),
            nextBeamTick: this.tick + secondsToTicks(HET.beamEvery),
            sealUid: seal?.uid ?? -1,
            sealHp: seal?.maxHp ?? HET.sealHp,
            openUntil: -1,
            orbs: [],
            nextOrbTick: this.tick + secondsToTicks(HET.orbEvery),
            nextMine: new Array<number>(this.heroes.length).fill(0),
        };
        this.nextHetWave(room);
        this.emit({
            type: "notice",
            message:
                "Pick up the glowing mirrors and set them on the marked spots, turned to bring the " +
                "beam round to the Shielded statue. Stand in a barrier's circle to break it.",
        });
    }

    // Which way the caster fires: towards the Shielded statue, along whichever way it's further
    private hetBeamWay(def: HetDef): { dx: number; dy: number } {
        const tx = (def.target.x0 + def.target.x1) / 2 - def.beam.x;
        const ty = (def.target.y0 + def.target.y1) / 2 - def.beam.y;
        return Math.abs(tx) >= Math.abs(ty)
            ? { dx: Math.sign(tx), dy: 0 }
            : { dx: 0, dy: Math.sign(ty) };
    }

    // A way round the seal for the beam: on from the caster, across one side of the seal, on past
    // it and back to the beam's line, then on into the Shielded statue. A mirror's needed at each
    // of its four turns: some fixed there already (turned right), the rest (1 to 3) a spot for one
    // of the loose mirrors, as OSRS's room always takes 1 to 3 of its 3. A worn barrier or two stand
    // in the way, each with a circle beside it to stand in to break it; whole ones elsewhere. Laid
    // out along the beam: v back towards the caster, u across it, (0, 0) the caster's tile.
    private layOutHet(
        def: HetDef,
    ): Pick<HetRoom, "mirrors" | "spots" | "barriers" | "solution" | "ring"> {
        const bx = Math.floor(def.beam.x);
        const by = Math.floor(def.beam.y);
        const way = this.hetBeamWay(def);
        // Back towards the caster, and across
        const back = { x: -way.dx, y: -way.dy };
        const across = { x: back.y, y: -back.x };
        const world = (u: number, v: number): [number, number] => [
            bx + u * across.x + v * back.x,
            by + u * across.y + v * back.y,
        ];
        const local = (x: number, y: number) => ({
            u: (x - bx) * across.x + (y - by) * across.y,
            v: (x - bx) * back.x + (y - by) * back.y,
        });
        const sealX = Math.floor(def.seal.x);
        const sealY = Math.floor(def.seal.y);
        const seal = local(sealX, sealY);
        // The statue's nearest row of tiles to the caster (its bounds are tile edges)
        const { x0, y0, x1, y1 } = def.target;
        const targetTop = Math.max(
            ...[
                [x0, y0],
                [x1 - 1, y0],
                [x0, y1 - 1],
                [x1 - 1, y1 - 1],
            ].map(([x, y]) => local(Math.floor(x), Math.floor(y)).v),
        );
        const heroes = this.heroes.length;
        const level = this.tombsPathLevel;
        const mirror = (x: number, y: number, turn: 0 | 1, fixed: boolean): HetMirror => ({
            x: x + 0.5,
            y: y + 0.5,
            turn,
            dirty: false,
            fixed,
            touching: new Array<boolean>(heroes).fill(false),
        });
        const open = (x: number, y: number) => this.grid.contains(x, y) && !this.grid.isSolid(x, y);
        let corners: [number, number][] = [];
        let runs: [number, number][] = [];
        // Every tile of the beam's way round, which nothing else is put on
        const onWay = new Set<string>();
        for (let attempt = 0; attempt < 40; attempt++) {
            const side = this.rng.chance(0.5) ? 1 : -1;
            const u = side * (3 + this.rng.int(4));
            // Its near crossing, between the caster and the seal, and its far one, past the seal
            const near = seal.v + 2 + this.rng.int(Math.max(1, -seal.v - 2));
            const far = seal.v - 2 - this.rng.int(Math.max(1, seal.v - 2 - targetTop - 1));
            const tiles: [number, number][] = [];
            const line = (u0: number, v0: number, u1: number, v1: number) => {
                const du = Math.sign(u1 - u0);
                const dv = Math.sign(v1 - v0);
                for (let a = u0, b = v0; ; a += du, b += dv) {
                    tiles.push(world(a, b));
                    if (a === u1 && b === v1) {
                        break;
                    }
                }
            };
            line(0, 0, 0, near);
            line(0, near, u, near);
            line(u, near, u, far);
            line(u, far, 0, far);
            line(0, far, 0, targetTop + 1);
            const clear = tiles.every(
                ([x, y]) => open(x, y) && (Math.abs(x - sealX) > 1 || Math.abs(y - sealY) > 1),
            );
            if (!clear) {
                continue;
            }
            corners = [world(0, near), world(u, near), world(u, far), world(0, far)];
            for (const [x, y] of tiles) {
                onWay.add(x + "," + y);
            }
            // Its straight runs, a tile clear of its corners, the caster and the statue
            runs = tiles.filter(([x, y]) => {
                const at = local(x, y);
                return (
                    corners.every(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) > 1) &&
                    at.v < -1 &&
                    at.v > targetTop + 2
                );
            });
            break;
        }
        // Each corner's mirror, as the beam meets it: "/" sends (dx, dy) on as (dy, dx), "\" as
        // (-dy, -dx) (Sim.traceHetBeam)
        const turns: (0 | 1)[] = corners.map(([x, y], i) => {
            const [px, py] = i === 0 ? [bx, by] : corners[i - 1];
            const [nx, ny] = i === corners.length - 1 ? world(0, targetTop) : corners[i + 1];
            const inX = Math.sign(x - px);
            const inY = Math.sign(y - py);
            const outX = Math.sign(nx - x);
            const outY = Math.sign(ny - y);
            return outX === inY && outY === inX ? 0 : 1;
        });
        // Which of its turns are spots for the loose mirrors: 1 to 3, one more from path level 2
        const placed = Math.min(
            corners.length,
            HET.placedLeast +
                this.rng.int(HET.placedMost - HET.placedLeast + 1) +
                (level >= 2 ? 1 : 0),
        );
        const order = corners.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
            const j = this.rng.int(i + 1);
            [order[i], order[j]] = [order[j], order[i]];
        }
        const onSpot = new Set(order.slice(0, placed));
        const mirrors: HetMirror[] = [];
        const spots: { x: number; y: number }[] = [];
        const solution: { spot: number; turn: 0 | 1 }[] = [];
        corners.forEach(([x, y], i) => {
            if (onSpot.has(i)) {
                solution.push({ spot: spots.length, turn: turns[i] });
                spots.push({ x: x + 0.5, y: y + 0.5 });
            } else {
                mirrors.push(mirror(x, y, turns[i], true));
            }
        });
        // Worn barriers on its straight runs, each with its circle on a free tile beside it
        const barriers: HetRoom["barriers"] = [];
        const worn = Math.min(runs.length, HET.wornLeast + this.rng.int(2));
        for (let n = 0; n < worn && runs.length > 0; n++) {
            const pick = runs.splice(this.rng.int(runs.length), 1)[0];
            // Off the run to one side: across a run along the beam, back or on along a crossing
            // (the tiles along the run itself are on the way, so never chosen)
            const stand = [
                [across.x, across.y],
                [-across.x, -across.y],
                [back.x, back.y],
                [-back.x, -back.y],
            ]
                .map(([ox, oy]) => [pick[0] + ox, pick[1] + oy] as [number, number])
                .find(([x, y]) => open(x, y) && !onWay.has(x + "," + y));
            if (!stand) {
                continue;
            }
            barriers.push({
                x: pick[0] + 0.5,
                y: pick[1] + 0.5,
                worn: true,
                stand: { x: stand[0] + 0.5, y: stand[1] + 0.5 },
                mined: 0,
            });
            // Not next to another
            runs = runs.filter(([x, y]) => Math.abs(x - pick[0]) + Math.abs(y - pick[1]) > 2);
        }
        // The seal's ring: the tiles round its mound, where it's mined from
        const ring: { x: number; y: number }[] = [];
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = sealX + dx;
                const y = sealY + dy;
                // Not on the beam's way, where a mirror, spot or barrier may stand
                if (
                    Math.max(Math.abs(dx), Math.abs(dy)) === 2 &&
                    open(x, y) &&
                    !onWay.has(x + "," + y)
                ) {
                    ring.push({ x: x + 0.5, y: y + 0.5 });
                }
            }
        }
        // Everything else on open floor off the way, the beam's line, the seal and its ring, and a
        // tile clear of everything put down
        const floor = def.floor;
        const close = (m: { x: number; y: number }, x: number, y: number) =>
            Math.abs(m.x - 0.5 - x) <= 1 && Math.abs(m.y - 0.5 - y) <= 1;
        // Clear of the way in (its barrier's tiles), and of anyone in the room as it's laid out
        // afresh, so nothing's put down in someone's path or on them
        const gateTiles = this.tombsPathRoom?.gate?.tiles ?? [];
        const kept = (x: number, y: number, round: boolean) =>
            gateTiles.some((t) => Math.abs(t.x - 0.5 - x) <= 2 && Math.abs(t.y - 0.5 - y) <= 2) ||
            (round &&
                this.heroes.some(
                    (hero) =>
                        Math.abs(hero.player.x - 0.5 - x) <= 1.5 &&
                        Math.abs(hero.player.y - 0.5 - y) <= 1.5,
                ));
        const free = (count: number, put: (x: number, y: number) => void) => {
            // Round the heroes first, then anywhere but the way in, should that leave too little
            let n = 0;
            for (let attempt = 0; attempt < 600 && n < count; attempt++) {
                const x = Math.floor(this.rng.range(floor.x0, floor.x1));
                const y = Math.floor(this.rng.range(floor.y0, floor.y1));
                if (kept(x, y, attempt < 300)) {
                    continue;
                }
                const near =
                    mirrors.some((m) => close(m, x, y)) ||
                    spots.some((m) => close(m, x, y)) ||
                    barriers.some((b) => close(b, x, y) || (b.stand && close(b.stand, x, y)));
                if (
                    near ||
                    onWay.has(x + "," + y) ||
                    !open(x, y) ||
                    (Math.abs(x - sealX) <= 3 && Math.abs(y - sealY) <= 3) ||
                    local(x, y).u === 0
                ) {
                    continue;
                }
                put(x, y);
                n++;
            }
        };
        // The loose mirrors, just as many as the spots want, lying where they were left: set down,
        // they're there for good (turned as you like), so there's no spot that doesn't want one
        free(placed, (x, y) => mirrors.push(mirror(x, y, 0, false)));
        free(HET.walls + level, (x, y) =>
            barriers.push({ x: x + 0.5, y: y + 0.5, worn: false, mined: 0 }),
        );
        return { mirrors, spots, barriers, solution, ring };
    }

    // Whether a mirror's stood up where the beam meets it: fixed, or set on a spot (not lying
    // loose, nor carried)
    private hetMirrorUp(mirror: HetMirror): boolean {
        return mirror.carrier === undefined && (mirror.fixed || mirror.spot !== undefined);
    }

    // The beam's way from the caster: straight on, turned by each clean mirror that's up, until it
    // stops (a wall, a barrier, the seal, a dirty mirror) or reaches the Shielded statue
    private traceHetBeam(
        room: HetRoom,
        def: HetDef,
    ): { points: { x: number; y: number }[]; hit: boolean } {
        let x = Math.floor(def.beam.x);
        let y = Math.floor(def.beam.y);
        let { dx, dy } = this.hetBeamWay(def);
        const sealX = Math.floor(def.seal.x);
        const sealY = Math.floor(def.seal.y);
        const t = def.target;
        const points = [{ x: x + 0.5, y: y + 0.5 }];
        const at = (p: { x: number; y: number }) => Math.floor(p.x) === x && Math.floor(p.y) === y;
        for (let steps = 0; steps < 120; steps++) {
            if (x + 0.5 > t.x0 && x + 0.5 < t.x1 && y + 0.5 > t.y0 && y + 0.5 < t.y1) {
                points.push({ x: x + 0.5, y: y + 0.5 });
                return { points, hit: true };
            }
            const blocked =
                !this.grid.contains(x, y) ||
                this.grid.isSolid(x, y) ||
                (Math.abs(x - sealX) <= 1 && Math.abs(y - sealY) <= 1) ||
                room.barriers.some(at);
            const mirror = room.mirrors.find((m) => this.hetMirrorUp(m) && at(m));
            if (blocked || mirror?.dirty) {
                points.push({ x: x + 0.5, y: y + 0.5 });
                return { points, hit: false };
            }
            if (mirror) {
                points.push({ x: x + 0.5, y: y + 0.5 });
                // "/": (dx, dy) to (dy, dx); "\": to (-dy, -dx)
                [dx, dy] = mirror.turn === 0 ? [dy, dx] : [-dy, -dx];
            }
            x += dx;
            y += dy;
        }
        points.push({ x: x + 0.5, y: y + 0.5 });
        return { points, hit: false };
    }

    private stepHet(room: TombsRoom, def: HetDef): void {
        const het = room.het;
        if (!het) {
            return;
        }
        const seal = this.enemies.find((e) => e.uid === het.sealUid && !e.dead);
        if (!seal) {
            // Broken: the room's done
            room.doneTick = this.tick;
            het.orbs = [];
            for (const mirror of het.mirrors) {
                mirror.carrier = undefined;
            }
            this.emit({ type: "notice", message: "Het's Seal breaks! The way on is open." });
            this.dimTo(this.baseAmbient, 2);
            return;
        }
        // Shut again once its time's up (before anyone's swing this tick), and the room laid out
        // afresh, as OSRS's is: new spots, the loose mirrors back on the floor, new barriers, so
        // every opening's earned again
        if (het.openUntil !== -1 && this.tick >= het.openUntil) {
            Object.assign(het, this.layOutHet(def));
            het.beam = undefined;
            this.emit({
                type: "notice",
                message: "The seal closes, and the mirrors are scattered across the room again.",
            });
        }
        if (this.tick >= het.openUntil) {
            het.openUntil = -1;
            seal.shieldEnd = Math.max(seal.shieldEnd, this.tick + 2);
        }
        this.stepHetMirrors(het);
        this.stepHetMining(het, seal);
        this.stepHetOrbs(het, def);
        if (this.tick < het.nextBeamTick) {
            return;
        }
        het.nextBeamTick = this.tick + secondsToTicks(HET.beamEvery);
        const traced = this.traceHetBeam(het, def);
        het.beam = { ...traced, tick: this.tick };
        this.burnHetBeam(traced.points);
        if (traced.hit && het.openUntil === -1) {
            het.openUntil = this.tick + secondsToTicks(HET.open);
            seal.shieldEnd = 0;
            this.emit({
                type: "notice",
                message:
                    "The beam hits the statue: Het's Seal is open! Stand in its ring to mine it!",
            });
            if (!this.tombsReplaying) {
                const player = this.hero.player;
                this.dropCasket(player.x + 0.8, player.y, false);
            }
            this.nextHetWave(room);
        }
    }

    // Whoever stands in the beam is burnt a little, and enemies in it a lot: aim it through them
    private burnHetBeam(points: { x: number; y: number }[]): void {
        const near = (x: number, y: number, reach: number) => {
            for (let i = 1; i < points.length; i++) {
                const a = points[i - 1];
                const b = points[i];
                const minX = Math.min(a.x, b.x) - reach;
                const maxX = Math.max(a.x, b.x) + reach;
                const minY = Math.min(a.y, b.y) - reach;
                const maxY = Math.max(a.y, b.y) + reach;
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    return true;
                }
            }
            return false;
        };
        const scale = this.tombsRoomScale();
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (near(player.x, player.y, 0.5)) {
                this.damagePlayer(
                    HET.beamDamage * scale.damage * this.hardScale.damage,
                    "hets_seal",
                    false,
                );
            }
        });
        this.damageSource = "other";
        for (const enemy of this.enemies) {
            if (!enemy.dead && enemy.def.id !== "hets_seal" && near(enemy.x, enemy.y, 0.5)) {
                this.damageEnemy(enemy, HET.beamEnemyDamage * scale.hp, 0, enemy.x, enemy.y);
            }
        }
    }

    // The mirrors, by walking: into a loose one picks it up (as many as there are); stopped on an
    // empty spot, carrying one, it's set there, facing "/", for good; into one set down turns it,
    // as often as you like; into a dirty one cleans it. Fixed ones only clean. Mirrors (but
    // carried ones) and barriers are solid, so nobody stands in one.
    private stepHetMirrors(het: HetRoom): void {
        for (const hero of this.heroes) {
            const player = hero.player;
            const up = this.isUp(hero);
            const held = () => het.mirrors.filter((m) => m.carrier === hero.index);
            if (!up) {
                // Down: what they carried is dropped where they fell
                for (const mirror of held()) {
                    this.dropHetMirror(het, mirror, player);
                }
            }
            const moving = player.x !== player.prevX || player.y !== player.prevY;
            for (const mirror of held()) {
                mirror.x = player.x;
                mirror.y = player.y;
            }
            // Stopped on an empty spot (walked over, they're carried on): one set there
            const carried = held()[0];
            if (carried && !moving) {
                const spot = het.spots.findIndex(
                    (s, i) =>
                        fm.hypot(s.x - player.x, s.y - player.y) <= HET.placeReach &&
                        !het.mirrors.some((m) => m.spot === i),
                );
                if (spot !== -1) {
                    carried.carrier = undefined;
                    carried.spot = spot;
                    carried.x = het.spots[spot].x;
                    carried.y = het.spots[spot].y;
                    carried.turn = 0;
                    carried.touching[hero.index] = true;
                    this.emit({ type: "notice", message: "You set down the mirror." }, true);
                }
            }
            for (const mirror of het.mirrors) {
                if (mirror.carrier !== undefined) {
                    continue;
                }
                const dx = player.x - mirror.x;
                const dy = player.y - mirror.y;
                const distance = fm.hypot(dx, dy);
                const touching = up && distance <= HET.touchReach;
                if (touching && !mirror.touching[hero.index]) {
                    if (mirror.dirty) {
                        mirror.dirty = false;
                        this.emit({ type: "notice", message: "You clean the mirror." }, true);
                    } else if (!mirror.fixed && mirror.spot === undefined) {
                        mirror.carrier = hero.index;
                        this.emit({ type: "notice", message: "You pick up the mirror." }, true);
                        continue;
                    } else if (!mirror.fixed) {
                        mirror.turn = (1 - mirror.turn) as 0 | 1;
                        this.emit({ type: "notice", message: "You rotate the mirror." }, true);
                    }
                }
                mirror.touching[hero.index] = touching;
                this.pushOffHet(player, mirror, distance, dx, dy);
            }
            for (const barrier of het.barriers) {
                const dx = player.x - barrier.x;
                const dy = player.y - barrier.y;
                this.pushOffHet(player, barrier, fm.hypot(dx, dy), dx, dy);
            }
        }
    }

    // A carried mirror put down where its carrier is: set on the spot there if it's empty, or
    // lying on the nearest tile with nothing on it (nor a spot)
    private dropHetMirror(het: HetRoom, mirror: HetMirror, at: { x: number; y: number }): void {
        mirror.carrier = undefined;
        const tx = Math.floor(at.x);
        const ty = Math.floor(at.y);
        const on = (p: { x: number; y: number }, x: number, y: number) =>
            Math.floor(p.x) === x && Math.floor(p.y) === y;
        const spot = het.spots.findIndex((s) => on(s, tx, ty));
        if (spot !== -1 && !het.mirrors.some((m) => m.spot === spot)) {
            mirror.spot = spot;
            mirror.turn = 0;
            mirror.x = het.spots[spot].x;
            mirror.y = het.spots[spot].y;
            return;
        }
        for (let r = 0; r <= 4; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const x = tx + dx;
                    const y = ty + dy;
                    if (
                        Math.max(Math.abs(dx), Math.abs(dy)) !== r ||
                        this.grid.isSolid(x, y) ||
                        het.spots.some((s) => on(s, x, y)) ||
                        het.barriers.some((b) => on(b, x, y)) ||
                        het.mirrors.some(
                            (m) => m !== mirror && m.carrier === undefined && on(m, x, y),
                        )
                    ) {
                        continue;
                    }
                    mirror.x = x + 0.5;
                    mirror.y = y + 0.5;
                    return;
                }
            }
        }
        mirror.x = tx + 0.5;
        mirror.y = ty + 0.5;
    }

    // Out of something solid of the Het room's, half a tile round
    private pushOffHet(
        player: Player,
        thing: { x: number; y: number },
        distance: number,
        dx: number,
        dy: number,
    ): void {
        const edge = 0.5 + player.radius;
        if (distance >= edge) {
            return;
        }
        const nx = distance > 0.001 ? dx / distance : 0;
        const ny = distance > 0.001 ? dy / distance : -1;
        moveCircle(
            this.grid,
            player,
            nx * (edge - distance),
            ny * (edge - distance),
            player.radius,
        );
    }

    // Whether someone's stood in one of the Het room's glowing circles (a barrier's, or a tile of
    // the seal's ring)
    private inHetCircle(player: { x: number; y: number }, at: { x: number; y: number }): boolean {
        return fm.hypot(at.x - player.x, at.y - player.y) <= HET.mine.circle;
    }

    // Mining, by standing in a glowing circle: a worn barrier's breaks after mine.barrier seconds
    // in it (anyone in it counts); the seal's ring, while it's open, takes a swing every so often
    // for what the hero's Mining (the shop's) makes it: OSRS's damage by level and pickaxe, so a
    // run with none takes three openings, one with the best. Nothing else touches either.
    private stepHetMining(het: HetRoom, seal: Enemy): void {
        const up = this.heroes.filter((hero) => this.isUp(hero));
        for (const barrier of het.barriers) {
            if (!barrier.worn || !barrier.stand) {
                continue;
            }
            if (up.some((hero) => this.inHetCircle(hero.player, barrier.stand!))) {
                barrier.mined++;
                if (barrier.mined % secondsToTicks(HET.mine.every) === 0) {
                    this.emit({
                        type: "impact",
                        sound: SOUNDS.tombsChip,
                        x: barrier.x,
                        y: barrier.y,
                    });
                }
                if (barrier.mined >= secondsToTicks(HET.mine.barrier)) {
                    het.barriers = het.barriers.filter((b) => b !== barrier);
                    this.emit({ type: "notice", message: "The barrier crumbles!" }, true);
                }
            }
        }
        if (het.openUntil === -1) {
            return;
        }
        for (const hero of up) {
            const player = hero.player;
            if (
                this.tick < het.nextMine[hero.index] ||
                !het.ring.some((tile) => this.inHetCircle(player, tile))
            ) {
                continue;
            }
            het.nextMine[hero.index] = this.tick + secondsToTicks(HET.mine.every);
            const [least, most] = this.hetMineHit(hero);
            const hit = least + this.rng.int(most - least + 1);
            seal.hp -= hit;
            seal.flash = 5;
            this.emit({
                type: "damage",
                x: seal.x,
                y: seal.y,
                amount: hit,
                enemyUid: seal.uid,
                enemyId: seal.def.id,
            });
            if (seal.hp <= 0) {
                this.killEnemy(seal);
                return;
            }
        }
    }

    // The Het room for the HUD: the mirrors you're holding, and how far the caster's charged
    get hetInfo(): { held: number; charge: number } | undefined {
        const het = this.tombsRoom?.het;
        if (!het || this.tombsRoom?.doneTick !== undefined) {
            return undefined;
        }
        const every = secondsToTicks(HET.beamEvery);
        return {
            held: het.mirrors.filter((m) => m.carrier === this.hero.index).length,
            charge: Math.max(0, Math.min(1, 1 - (het.nextBeamTick - this.tick) / every)),
        };
    }

    // What's been mined of Het's Seal, of its hitpoints, for the HUD
    get hetSealMined(): { mined: number; of: number } {
        const het = this.tombsRoom?.het;
        const seal = het && this.enemies.find((e) => e.uid === het.sealUid && !e.dead);
        if (!seal || !het) {
            // Broken: all of it
            return { mined: het?.sealHp ?? HET.sealHp, of: het?.sealHp ?? HET.sealHp };
        }
        return { mined: Math.max(0, Math.round(seal.maxHp - seal.hp)), of: seal.maxHp };
    }

    // A hero's mining swing, least and most: by their Mining (the shop's ranks of it)
    private hetMineHit(hero: Hero): [number, number] {
        const mining = SHOP_UPGRADES.find((u) => u.id === "mining");
        const rank = mining ? Math.round(hero.metaStats[mining.stat] / mining.perRank) : 0;
        const tiers = HET.mine.hits;
        return tiers[Math.max(0, Math.min(tiers.length - 1, rank))];
    }

    // Orbs of Darkness: across the floor in straight lines, more and quicker with the path level,
    // hurting whoever they touch and dirtying any mirror they cross
    private stepHetOrbs(het: HetRoom, def: HetDef): void {
        const level = this.tombsPathLevel;
        const floor = def.floor;
        if (this.tick >= het.nextOrbTick) {
            const every = Math.max(
                HET.orbEveryLeast,
                HET.orbEvery - HET.orbQuicker * this.tombsPathWeight,
            );
            het.nextOrbTick = this.tick + secondsToTicks(every);
            const speed = (HET.orbSpeed + HET.orbFaster * level) / TICKS_PER_SECOND;
            // Stacked from path level 2: one place, more than one orb
            const count = 1 + Math.floor(level / 2);
            const across = this.rng.chance(0.5);
            const forward = this.rng.chance(0.5);
            const lane = across
                ? Math.floor(this.rng.range(floor.y0, floor.y1)) + 0.5
                : Math.floor(this.rng.range(floor.x0, floor.x1)) + 0.5;
            for (let i = 0; i < count; i++) {
                const behind = i * 0.6;
                het.orbs.push(
                    across
                        ? {
                              x: forward ? floor.x0 - behind : floor.x1 + behind,
                              y: lane,
                              vx: forward ? speed : -speed,
                              vy: 0,
                          }
                        : {
                              x: lane,
                              y: forward ? floor.y0 - behind : floor.y1 + behind,
                              vx: 0,
                              vy: forward ? speed : -speed,
                          },
                );
            }
        }
        const damage = HET.orbDamage * this.tombsHazardScale();
        const party = this.heroes.filter((hero) => !hero.left).length;
        het.orbs = het.orbs.filter((orb) => {
            orb.x += orb.vx;
            orb.y += orb.vy;
            // In a party only, as OSRS's: a mirror crossed is dirtied
            for (const mirror of party > 1 ? het.mirrors : []) {
                if (
                    mirror.carrier === undefined &&
                    fm.hypot(orb.x - mirror.x, orb.y - mirror.y) < 0.5
                ) {
                    mirror.dirty = true;
                }
            }
            let hit = false;
            this.forEachHeroInReach(() => {
                const player = this.player;
                if (
                    !hit &&
                    fm.hypot(player.x - orb.x, player.y - orb.y) <= HET.orbRadius + player.radius
                ) {
                    hit = true;
                    this.damagePlayer(damage, "het_orb", false);
                }
            });
            const inside =
                orb.x >= floor.x0 - 2 &&
                orb.x <= floor.x1 + 2 &&
                orb.y >= floor.y0 - 2 &&
                orb.y <= floor.y1 + 2;
            return !hit && inside;
        });
    }

    // The next of the Het room's waves (the last again once they're all out), out of its edges
    private nextHetWave(room: TombsRoom): void {
        room.wave = Math.min(room.wave + 1, HET_WAVES.length - 1);
        room.waveTick = this.tick;
        const ids = [...HET_WAVES[room.wave]];
        for (let i = 0; i < this.tombsPathLevel; i++) {
            ids.push(ids[ids.length - 1]);
        }
        room.group = [];
        room.pending = [...room.pending, ...ids];
        room.nextOutTick = this.tick;
    }

    private stepApmekenIssue(room: TombsRoom, spots: TombsSpotDef[]): void {
        const issue = room.issue;
        if (!issue) {
            if (this.tick >= room.nextIssueTick) {
                const spot = this.rng.int(spots.length);
                room.issue = { spot, startTick: this.tick, fixTicks: 0 };
                const at = spots[spot];
                this.emit({
                    type: "notice",
                    message:
                        at.kind === "pillar"
                            ? `You sense an issue: a pillar to the ${this.tombsCompass(at)} is giving way!`
                            : `You sense an issue: a vent to the ${this.tombsCompass(at)} is building up!`,
                });
            }
            return;
        }
        const at = spots[issue.spot];
        if ((this.tick - issue.startTick) % secondsToTicks(1.2) === 0) {
            this.addEffect(
                at.kind === "pillar" ? APMEKEN_SPOTANIMS.pillar : APMEKEN_SPOTANIMS.vent,
                at.x,
                at.y,
                0,
                40,
            );
        }
        const fixing = this.heroes.some(
            (hero) =>
                this.isUp(hero) && fm.hypot(hero.player.x - at.x, hero.player.y - at.y) <= at.reach,
        );
        issue.fixTicks = fixing ? issue.fixTicks + 1 : 0;
        if (issue.fixTicks >= Math.max(1, secondsToTicks(APMEKEN.fixSeconds[at.kind]))) {
            room.issue = undefined;
            room.nextIssueTick = this.tick + secondsToTicks(this.apmekenIssueEvery());
            this.emit({
                type: "notice",
                message: at.kind === "pillar" ? "The pillar holds." : "The vent clears.",
            });
            return;
        }
        const deadline = Math.max(5, APMEKEN.deadline - 1.5 * this.tombsPathWeight);
        if (this.tick - issue.startTick < secondsToTicks(deadline)) {
            return;
        }
        // Left too long: it hurts everyone, more for each that's gone this wave
        room.issue = undefined;
        room.nextIssueTick = this.tick + secondsToTicks(this.apmekenIssueEvery());
        const damage =
            APMEKEN.damage *
            (1 + APMEKEN.worse * room.missed) *
            this.map.difficulty.damage *
            this.hardScale.damage *
            this.tombsRoomScale().damage;
        room.missed++;
        this.addEffect(
            at.kind === "pillar" ? APMEKEN_SPOTANIMS.pillarFalls : APMEKEN_SPOTANIMS.ventBursts,
            at.x,
            at.y,
            0,
            60,
        );
        this.emit({
            type: "notice",
            message:
                at.kind === "pillar"
                    ? "The pillar gives way, and the roof comes down on you!"
                    : "The vent bursts, filling the room!",
        });
        this.forEachHeroInReach(() => {
            if (!this.runOver && this.isUp(this.hero) && !this.reviving) {
                this.damagePlayer(damage, "apmeken_room", false);
            }
        });
    }

    // Which way a spot is from the middle of the room's spots, as a compass point
    private tombsCompass(at: { x: number; y: number }): string {
        const spots = this.map.tombs?.paths.find((p) => p.id === this.tombsPath)?.room?.spots ?? [];
        const mx = spots.reduce((sum, spot) => sum + spot.x, 0) / Math.max(1, spots.length);
        const my = spots.reduce((sum, spot) => sum + spot.y, 0) / Math.max(1, spots.length);
        const ns = at.y > my + 1 ? "north" : at.y < my - 1 ? "south" : "";
        const ew = at.x > mx + 1 ? "east" : at.x < mx - 1 ? "west" : "";
        return ns && ew ? `${ns}-${ew}` : ns || ew || "middle";
    }

    // The barrier between a Tombs room's safe corridor and the room, while there's one
    get tombsGate(): TombsGateDef | undefined {
        return this.map.tombs?.paths.find((p) => p.id === this.tombsPath)?.room?.gate;
    }

    // Whether its barrier's shut: the room's begun and isn't done, so nobody goes back
    get tombsGateShut(): boolean {
        const room = this.tombsRoom;
        return room !== undefined && room.started && room.doneTick === undefined && !room.boss;
    }

    // Shut, the barrier's a wall: nothing gets back past it into the corridor (east of it, or
    // south), the party or the baboons
    private holdTombsGate(): void {
        const gate = this.tombsGate;
        if (!gate || !this.tombsGateShut) {
            return;
        }
        const hold = (one: { x: number; y: number; radius: number }) => {
            if (gate.x !== undefined) {
                one.x = Math.min(one.x, gate.x - one.radius);
            } else {
                one.y = Math.max(one.y, gate.y + one.radius);
            }
        };
        for (const hero of this.heroes) {
            hold(hero.player);
        }
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                hold(enemy);
            }
        }
    }

    // Whether someone's through a room's barrier, out of its corridor
    private throughTombsGate(player: { x: number; y: number }): boolean {
        const gate = this.tombsGate;
        return !gate || (gate.x !== undefined ? player.x < gate.x : player.y > gate.y);
    }

    // Where the issue is, for the game's hint arrow over it
    get tombsIssue(): { x: number; y: number; kind: "pillar" | "vent" } | undefined {
        const issue = this.tombsRoom?.issue;
        const spots = this.map.tombs?.paths.find((p) => p.id === this.tombsPath)?.room?.spots;
        if (!issue || !spots) {
            return undefined;
        }
        const at = spots[issue.spot];
        return { x: at.x, y: at.y, kind: at.kind };
    }

    // How many times the party can die in the Tombs before the raid's over: as many as they like,
    // unless an Attempts invocation says (each death costs raid points, once the chest's in)
    get tombsDeathsAllowed(): number {
        const attempts = TOMBS_ATTEMPTS.find(([id]) => this.invoked(id));
        return attempts ? attempts[1] : Infinity;
    }

    // Whether the room's on a wave it had beaten before a death: those give nothing again
    get tombsReplaying(): boolean {
        const room = this.tombsRoom;
        return room !== undefined && room.wave <= room.beaten;
    }

    // Everyone down in a Tombs room: back in its safe corridor on full hitpoints, the room waiting
    // to start over.
    // What they've got they keep (their levels, weapons, gear); what they used is gone. The waves
    // they'd beaten come again for nothing.
    private failTombsRoom(): void {
        const path = this.map.tombs!.paths.find((p) => p.id === this.tombsPath)!;
        this.wipeTombsParty();
        const room = this.tombsRoom;
        const bossDef = path.room?.boss;
        if (room?.boss && bossDef) {
            this.moveParty(bossDef.arrive);
            room.boss = { uid: -1, beatenTick: undefined };
            this.emit({
                type: "notice",
                message:
                    `Oh dear, you are dead! Walk back in to face ${getEnemy(bossDef.enemyId).name} again.` +
                    this.tombsDeathsLeftText(),
            });
            return;
        }
        this.moveParty(path.room!.arrive);
        if (room) {
            room.beaten = Math.max(room.beaten, room.wave - 1);
            room.wave = -1;
            room.group = [];
            room.issue = undefined;
            room.missed = 0;
            room.started = false;
            room.pending = [];
            // The Het room's laid out afresh, as OSRS's is after a wipe
            room.het = undefined;
            room.scabaras = undefined;
            room.crondis = undefined;
        }
        this.emit({
            type: "notice",
            message:
                "Oh dear, you are dead! You're back in the safe corridor: walk through the barrier " +
                "to start the room again. The waves you'd beaten give nothing this time." +
                this.tombsDeathsLeftText(),
        });
    }

    // How many more wipes the raid can take, for a wipe's notice (none said without a limit)
    private tombsDeathsLeftText(): string {
        const left = this.tombsDeathsAllowed - this.tombsDeaths;
        return Number.isFinite(left) ? ` ${left} ${left === 1 ? "death" : "deaths"} left.` : "";
    }

    // A wipe in the Tombs: what's out is gone, and everyone's back up on full hitpoints. What
    // they've got they keep (their levels, weapons, gear); what they used is gone.
    private wipeTombsParty(): void {
        this.tombsDeaths++;
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                // A boss in phases takes its phase's light with it (Zebak's last), as at its death
                if (enemy.boss) {
                    this.endBossFight(enemy);
                }
                this.vanish(enemy);
            }
        }
        this.clearBossAttacks();
        this.enemyProjectiles = [];
        const current = this.hero;
        for (const hero of this.heroes) {
            this.use(hero);
            const player = this.player;
            hero.down = false;
            hero.revive = undefined;
            player.hp = player.maxHp;
            player.deathTick = -1;
            player.poisonEnd = -1;
            player.poisonDamage = 0;
            player.invulnerable = 3 * TICKS_PER_SECOND;
            this.debuffs = [];
        }
        this.use(current);
        this.rescaleParty();
    }

    // Everyone down on the Wardens: their fight from the start, as OSRS's is after a wipe, the
    // last phase's floor laid again
    private failWardens(): void {
        this.wipeTombsParty();
        this.tombsWardens = undefined;
        if (this.map.floor) {
            this.floor = new ArenaFloor(this.map.floor, this.grid, this.rng, TICKS_PER_SECOND);
        }
        this.enterWardens();
        this.emit({
            type: "notice",
            message:
                "Oh dear, you are dead! The Wardens are back where they started." +
                this.tombsDeathsLeftText(),
        });
    }

    // Done with a path: back to the Nexus, with what's on the floor, and the whole party on full
    // hitpoints for the next. Co-op: anyone still down is back up, as OSRS's party rejoins once a
    // room's done.
    private leaveTombsPath(): void {
        const tombs = this.map.tombs!;
        const current = this.hero;
        for (const hero of this.heroes) {
            if (hero.left) {
                continue;
            }
            this.use(hero);
            if (hero.down) {
                hero.down = false;
                hero.revive = undefined;
                this.player.deathTick = -1;
            }
            this.player.hp = this.player.maxHp;
        }
        this.use(current);
        this.rescaleParty();
        if (this.tombsPath && !this.tombsPathsDone.includes(this.tombsPath)) {
            this.tombsPathsDone.push(this.tombsPath);
            const done = this.tombsPathsDone.length;
            if (done === 2 || done === 4) {
                this.tombsSpiritReady = true;
            }
        }
        const time = this.tombsTimes.find(
            (t) => t.id === this.tombsPath && t.seconds === undefined,
        );
        if (time) {
            time.seconds = (this.tick - time.startTick) / TICKS_PER_SECOND;
        }
        this.tombsPath = undefined;
        this.tombsRoom = undefined;
        this.dimTo(this.baseAmbient, 0.5);
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                this.vanish(enemy);
            }
        }
        this.enemyProjectiles = [];
        this.gatherHall();
        this.moveParty(tombs.nexus);
        this.emit({ type: "notice", message: "Back in the Nexus." });
        if (this.tombsSpiritReady && this.map.tombs?.spirit) {
            this.tombsSpiritReady = false;
            this.emit({ type: "notice", message: "The Helpful Spirit has supplies for you." });
        }
    }

    // A room's waves, from the top, in its hall
    private beginRaidRoom(index: number): void {
        const raid = this.map.raid!;
        this.raidRoom = index;
        const next = raid.rooms[index];
        this.raidStage = "waves";
        this.raidStageTick = this.tick;
        this.raidRoomStartTick = this.tick;
        this.raidBossDueTick = this.tick + this.raidWaveLength(index) * TICKS_PER_SECOND;
        this.raidShopQueue = [];
        this.eventIndex = 0;
        this.spawnAccumulator = 0;
        this.moveParty(next.start);
        for (const hero of this.heroes) {
            hero.raidDamageAtStart = hero.damageTaken;
        }
        this.emit({
            type: "notice",
            message: `Room ${index + 1} of ${raid.rooms.length}: ${next.name}`,
        });
    }

    // A hall has a teleporter once its room's boss has been killed before, in a solo raid (co-op's
    // relays don't carry them yet). A first run has none, so a portal that does nothing doesn't
    // puzzle anyone.
    private get teleportersOn(): boolean {
        return (
            this.raidTeleports > 0 &&
            this.heroes.length === 1 &&
            this.raidPortals[this.raidRoom] === true
        );
    }

    // Where this hall's teleporter stands, for the game to draw, while there is one
    get raidTeleporter(): { x: number; y: number } | undefined {
        if (!this.teleportersOn || this.raidStage !== "waves") {
            return undefined;
        }
        return this.raidRoomDef?.teleporter;
    }

    // The hall's teleporter: walking up to it asks whether to skip the room's waves
    private stepTeleporter(room: RaidRoomDef): void {
        const at = room.teleporter;
        if (!at || !this.teleportersOn || this.state !== "playing") {
            return;
        }
        const near = this.heroes.find(
            (hero) =>
                this.isUp(hero) &&
                fm.hypot(hero.player.x - at.x, hero.player.y - at.y) <= TELEPORTER_REACH,
        );
        if (!near) {
            // Stepped away: it'll ask again
            if (
                !this.heroes.some(
                    (hero) =>
                        fm.hypot(hero.player.x - at.x, hero.player.y - at.y) <=
                        TELEPORTER_REACH + 1.5,
                )
            ) {
                this.teleporterArmed = true;
            }
            return;
        }
        if (!this.teleporterArmed) {
            return;
        }
        this.teleporterArmed = false;
        const current = this.hero;
        this.use(near);
        if (this.raidTeleportsLeft <= 0) {
            this.emit(
                {
                    type: "notice",
                    message: "The teleporter's dormant: you've used all your teleports this raid.",
                },
                true,
            );
            this.use(current);
            return;
        }
        const left = this.raidTeleportsLeft;
        this.openOffer(
            {
                id: "raid_teleporter",
                name: "Teleporter",
                weight: 0,
                speech:
                    `Skips the rest of this room's waves and takes you straight to ${midSentence(room.name)}. ` +
                    `You can use ${left === 1 ? "1 more teleport" : `${left} more teleports`} this raid.`,
                effect: { kind: "shop", leaveLabel: "Cancel" },
            },
            [{ kind: "teleport" }],
        );
        this.use(current);
    }

    // Into the boss's room, with the crowd gone. Retried next tick if the boss can't turn up.
    private startRaidBoss(room: RaidRoomDef, last: boolean): void {
        // Nobody's left walking over from the hall
        this.visitor = undefined;
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                this.vanish(enemy);
            }
        }
        this.clearBossAttacks();
        this.enemyProjectiles = [];
        this.funBossGroup = [];
        this.gatherHall();
        this.moveParty(room.arrive);
        this.useSpawnHero();
        const boss = this.spawnBoss(
            getEnemy(room.boss),
            last ? "finalBoss" : "boss",
            room.bossHp,
            room.bossAt,
        );
        if (boss) {
            this.raidStage = "boss";
            this.raidStageTick = this.tick;
            const protects = boss.def.protects;
            if (protects) {
                const styles = protects.styles.map((style) =>
                    style === "ranged" ? "missiles" : style,
                );
                this.emit({
                    type: "notice",
                    message: `${boss.def.name} protects from ${styles.join(" and ")}!`,
                });
            }
        }
    }

    // Bones and coins still on the hall's floor when the boss comes would be lost, as the party
    // doesn't go back, so they come along: each to whoever's nearest, as a magnet's do. Caskets
    // and power-ups stay, as they need walking over.
    private gatherHall(): void {
        const current = this.hero;
        let gathered = 0;
        for (const pickup of this.pickups) {
            if (
                pickup.value < 0 ||
                pickup.disguise ||
                pickup.kind === "casket" ||
                pickup.kind === "powerUp"
            ) {
                continue;
            }
            this.use(this.nearestUpHero(pickup.x, pickup.y));
            this.collect(pickup);
            pickup.value = -1;
            gathered++;
        }
        this.use(current);
        this.pickups = this.pickups.filter((p) => p.value >= 0);
        if (gathered > 0) {
            this.emit({
                type: "notice",
                message: "What was left on the floor comes with you.",
            });
        }
    }

    // Expert mode: once it's enraged, it stares one way a while, then turns a quarter (BossDef.stare)
    private stepStare(enemy: Enemy): void {
        const stare = enemy.def.boss?.stare;
        const state = enemy.bossState!;
        if (!this.expert || !stare || !state.enraged) {
            return;
        }
        // Where it'll stare next is picked, and shown (it turns to face it, and the notice says
        // which way) a warning's time before the stare goes there, so a player can get out of
        // the way: their weapons fire on their own
        const warning = secondsToTicks(stare.warning ?? STARE_WARNING_SECONDS);
        if (state.stareNext === undefined && this.tick >= (state.nextStare ?? 0) - warning) {
            const turns = 1 + this.rng.int(3);
            state.stareNext =
                (state.stareAngle ?? this.rng.int(4) * (Math.PI / 2)) + turns * (Math.PI / 2);
            state.nextStare = Math.max(state.nextStare ?? 0, this.tick + warning);
            this.emit({
                type: "notice",
                message: `${stare.message} He'll face ${compassSide(state.stareNext)}!`,
            });
        }
        if (state.stareNext !== undefined && this.tick >= (state.nextStare ?? 0)) {
            state.stareAngle = state.stareNext;
            state.stareNext = undefined;
            state.nextStare = this.tick + secondsToTicks(stare.every);
        }
        // Facing where it'll stare as it warns, then where it does
        const facing = state.stareNext ?? state.stareAngle;
        if (facing !== undefined) {
            enemy.yaw = yawFromVector(fm.cos(facing), fm.sin(facing));
        }
    }

    // Whether the player's in front of a staring boss (BossDef.stare), and so hurt by hitting it
    private staredAt(enemy: Enemy): boolean {
        const stare = enemy.def.boss?.stare;
        const angle = enemy.bossState?.stareAngle;
        if (
            !this.expert ||
            !stare ||
            angle === undefined ||
            !this.damageSource.startsWith("weapon:")
        ) {
            return false;
        }
        const player = this.player;
        const toward = fm.atan2(player.y - enemy.y, player.x - enemy.x);
        const off = Math.abs(fm.atan2(fm.sin(toward - angle), fm.cos(toward - angle)));
        return off <= stare.arc / 2;
    }

    // The style of the weapon a hit's from (damageSource), or none for anything else: worked out
    // once for each source, as every hit on a raid boss asks it up to three times
    private get sourceStyle(): CombatStyle | undefined {
        const source = this.damageSource;
        if (source !== this.styledSource) {
            this.styledSource = source;
            this.styleOfSource = source.startsWith("weapon:")
                ? getWeaponStyle(getWeapon(source.slice("weapon:".length)))
                : undefined;
        }
        return this.styleOfSource;
    }
    private styledSource = "";
    private styleOfSource: CombatStyle | undefined;

    // Normal mode: the share a colour takes from another style's weapon (BossDef.colours.offStyle)
    private offColour(enemy: Enemy): number {
        const share = enemy.def.boss?.colours?.offStyle;
        const only = enemy.def.onlyStyle;
        const style = this.sourceStyle;
        if (this.expert || share === undefined || !only || style === undefined) {
            return 1;
        }
        return style === only ? 1 : share;
    }

    // Expert mode: what a Nylocas in the waves takes from its own style (EnemyDef.expertOwnStyle)
    private ownStyle(enemy: Enemy): number {
        const only = enemy.def.onlyStyle;
        if (!this.expert || enemy.def.boss || !only || this.sourceStyle !== only) {
            return 1;
        }
        return enemy.def.expertOwnStyle ?? 1;
    }

    // A weapon's hit an expert raid's Nylocas won't take (EnemyDef.onlyStyle)
    private wrongStyle(enemy: Enemy): boolean {
        const only = enemy.def.onlyStyle;
        const style = this.sourceStyle;
        if (!this.expert || !only || style === undefined) {
            return false;
        }
        return style !== only;
    }

    // Expert mode (and normal, with offStyle): the next of BossDef.colours' forms, keeping its
    // hitpoints, every so often
    private stepColours(enemy: Enemy): void {
        const colours = enemy.def.boss?.colours;
        if (!colours || (!this.expert && colours.offStyle === undefined)) {
            return;
        }
        const state = enemy.bossState!;
        state.nextColour ??= this.tick + secondsToTicks(colours.every);
        if (this.tick < state.nextColour || state.windup) {
            return;
        }
        state.nextColour = this.tick + secondsToTicks(colours.every);
        const index = colours.forms.indexOf(enemy.def.id);
        const form = getEnemy(colours.forms[(index + 1) % colours.forms.length]);
        enemy.def = form;
        enemy.attackSeq = form.attackSeq;
        enemy.anim = "idle";
        enemy.animStart = this.tick;
        this.appearanceVersion++;
        const style = form.onlyStyle;
        this.emit({
            type: "notice",
            message: `${form.name} turns ${style === "melee" ? "grey" : style === "ranged" ? "green" : "blue"}! ${this.expert ? "Only" : "Mostly"} ${style} hurts it.`,
        });
    }

    // The share of a weapon's hit an enemy takes, praying against its style (EnemyDef.protects)
    private prayedAgainst(enemy: Enemy): number {
        const protects = enemy.def.protects;
        // On expert, a Nylocas takes its own style in full (EnemyDef.onlyStyle). A boss's colour
        // (BossDef.colours) goes on to the rule below as on normal: its own style through its
        // prayer's ownStyle, and expert never lets another style this far (wrongStyle)
        if (isPrayerIgnored(enemy.def, this.expert)) {
            return 1;
        }
        const style = this.sourceStyle;
        if (!protects || style === undefined) {
            return 1;
        }
        // Its guard down, its prayer's down with it (BossGuardDef.pierce: Akkha's)
        if (enemy.def.boss?.guard?.pierce && this.isExposed(enemy)) {
            return 1;
        }
        // On normal, a colour prays less against its own style (BossDef.colours.ownStyle)
        const colours = enemy.def.boss?.colours;
        if (colours?.offStyle !== undefined && style === enemy.def.onlyStyle) {
            return protects.styles.includes(style) ? (colours.ownStyle ?? 1) : 1;
        }
        return protects.styles.includes(style) ? protects.damage : 1;
    }

    // Each player's points for the room just cleared (getRoomPoints): how fast its boss went down,
    // and how little they were hurt
    private scoreRaidRoom(): void {
        const bossSeconds = (this.tick - this.raidStageTick) / TICKS_PER_SECOND;
        const minutes = Math.floor(bossSeconds / 60);
        const seconds = String(Math.floor(bossSeconds % 60)).padStart(2, "0");
        const current = this.hero;
        const scores = this.heroes.map((hero) =>
            getRoomPoints(
                bossSeconds,
                hero.damageTaken - hero.raidDamageAtStart,
                hero.player.maxHp,
                this.raidRoomDef!.par,
            ),
        );
        // The party's coins, on its average
        const inRaid = this.heroes.filter((hero) => !hero.left);
        const average =
            inRaid.reduce((sum, hero) => sum + scores[hero.index], 0) / Math.max(1, inRaid.length);
        const scale = this.expert ? EXPERT_RAID_COINS : this.hard ? HARD_RAID_COINS : 1;
        const coins = Math.round(average * RAID_COINS_PER_POINT * scale);
        this.gainCoins(coins);
        for (const hero of this.heroes) {
            this.use(hero);
            const points = scores[hero.index];
            hero.raidPoints += points;
            hero.raidPointsEarned += points;
            this.emit(
                {
                    type: "notice",
                    message:
                        `Room cleared! Boss down in ${minutes}:${seconds}: ` +
                        `+${points} raid points, +${coins.toLocaleString("en-GB")} coins.`,
                },
                true,
            );
        }
        this.use(current);
    }

    // The supply chest's screen for whoever's next in the queue
    private openNextRaidShop(): void {
        let index = this.raidShopQueue.shift();
        // Anyone who's gone or gone down since misses their turn
        while (index !== undefined && !this.isUp(this.heroes[index])) {
            index = this.raidShopQueue.shift();
        }
        if (index === undefined) {
            return;
        }
        this.use(this.heroes[index]);
        this.openOffer(
            RAID_SUPPLY_CHEST,
            RAID_SUPPLIES.map((supply) => ({
                kind: "supply",
                supplyId: supply.id,
                price: supply.price,
                sold: false,
            })),
        );
    }

    // The Helpful Spirit's bundles each hero has to come: one after any two paths, one more after
    // all four, less what they've had or let go by
    tombsSpiritBundles(index: number): number {
        const earned = Math.min(2, Math.floor(this.tombsPathsDone.length / 2));
        return Math.max(0, earned - (this.tombsSpiritTaken.get(index) ?? 0));
    }

    // What a path boss's fight leaves lying about, gone. Called every tick while none is up, so
    // only a list with something in it is replaced.
    private clearTombsBossLeftovers(): void {
        if (this.tombsPeels.length) {
            this.tombsPeels = [];
        }
        this.tombsAkkha = undefined;
        this.tombsKephri = undefined;
        this.tombsZebak = undefined;
        if (this.tombsCover.length) {
            this.tombsCover = [];
        }
        if (this.tombsSarcophagi.length) {
            this.tombsSarcophagi = [];
        }
    }

    // The Helpful Spirit in the Nexus: walked up to, it offers its bundles to a hero with one to
    // come (or says when they will), once each time they come up to it. True when it's opened.
    private stepTombsSpirit(at: { x: number; y: number }): boolean {
        const current = this.hero;
        for (const hero of this.heroes) {
            const near =
                this.isUp(hero) &&
                fm.hypot(at.x - hero.player.x, at.y - hero.player.y) <= VISITOR_REACH;
            if (!near) {
                this.tombsSpiritNear.delete(hero.index);
                continue;
            }
            if (this.tombsSpiritNear.has(hero.index)) {
                continue;
            }
            this.tombsSpiritNear.add(hero.index);
            this.use(hero);
            if (this.tombsSpiritBundles(hero.index) > 0) {
                let options = this.tombsSpiritOffer.get(hero.index);
                if (!options) {
                    options = this.rollTombsBundles();
                    this.tombsSpiritOffer.set(hero.index, options);
                }
                // The offer keeps whose it is
                this.openOffer(TOMBS_SPIRIT, options);
                this.use(current);
                return true;
            }
            const message =
                this.tombsPathsDone.length < 2
                    ? "The Helpful Spirit will have supplies for you after two paths."
                    : this.tombsPathsDone.length < 4
                      ? "The Helpful Spirit will have more for you after the other two paths."
                      : "The Helpful Spirit has nothing more for you.";
            this.emit({ type: "notice", message }, true);
        }
        this.use(current);
        return false;
    }

    // The Spirit's three bundles, what's in each rolled now (on the event roll, so they don't
    // move the run's): fewer with Need Some Help and the rest, never none, and nothing that heals
    // with Dehydration
    private rollTombsBundles(): EventOption[] {
        const dry = this.invoked("dehydration");
        const share = Object.entries(TOMBS_SPIRIT_SHARE).find(([id]) => this.invoked(id))?.[1] ?? 1;
        const options: EventOption[] = [];
        for (const bundle of TOMBS_SPIRIT_BUNDLES) {
            const contents = bundle.contents.filter(
                (c) => !dry || getRaidSupply(c.supplyId).effect.kind !== "heal",
            );
            const items = contents.map((c) => {
                const [least, most] = c.count;
                const rolled = least + this.eventRng.int(most - least + 1);
                const had = c.chance === undefined || this.eventRng.chance(c.chance);
                return { supplyId: c.supplyId, count: had ? Math.round(rolled * share) : 0 };
            });
            // Never empty: one of the first it's sure to have
            const sure = contents.findIndex((c) => c.chance === undefined);
            if (items.every((item) => item.count === 0) && sure !== -1) {
                items[sure].count = 1;
            }
            // No more kinds than the inventory has slots (Chaos's lucky ones the first to go)
            const kept = items.filter((item) => item.count > 0).slice(0, MAX_INVENTORY);
            if (kept.length > 0) {
                options.push({ kind: "bundle", bundleId: bundle.id, items: kept });
            }
        }
        return options;
    }

    // A bundle of the Spirit's taken: its supplies in the inventory, any there's no room for used
    // now, and the hero's due one fewer
    private takeTombsBundle(items: { supplyId: string; count: number }[]): void {
        const index = this.hero.index;
        this.tombsSpiritTaken.set(index, (this.tombsSpiritTaken.get(index) ?? 0) + 1);
        this.tombsSpiritOffer.delete(index);
        const used: string[] = [];
        for (const { supplyId, count } of items) {
            for (let i = 0; i < count; i++) {
                if (!this.stash(supplyId)) {
                    this.useUtility(getItem(supplyId) as UtilityDef);
                    if (!used.includes(supplyId)) {
                        used.push(supplyId);
                    }
                }
            }
        }
        if (used.length > 0) {
            const names = used.map((id) => getItem(id).name.toLowerCase()).join(", ");
            this.emit(
                { type: "notice", message: `No room for it all: used the ${names} now.` },
                true,
            );
        }
    }

    // Through a door from the Nexus: a bundle of the Spirit's not taken by now is gone (the first
    // once a third path's begun, either once the Wardens have)
    private forfeitTombsBundles(): void {
        const gone = this.tombsWardens
            ? 2
            : Math.min(2, Math.floor(this.tombsPathsDone.length / 2));
        for (const hero of this.heroes) {
            const had = this.tombsSpiritTaken.get(hero.index) ?? 0;
            if (gone > had) {
                this.tombsSpiritTaken.set(hero.index, gone);
                this.tombsSpiritOffer.delete(hero.index);
            }
        }
    }

    // The chest once the raid's done, each of the party their own: a purple, more likely the more
    // points they earned, and on hard mode a roll for its own uniques too. The uniques are unlocks,
    // so a chest only gives ones the hero hasn't found (hasTrophy): a purple is one of those left,
    // and once there are none left there's no roll
    private openRaidChest(): void {
        const id = this.map.id;
        const purples = TROPHIES.filter((t) => t.from.kind === "raid" && t.from.mapId === id);
        const missingOf = (hero: Hero, hard: boolean): TrophyDef[] =>
            purples.filter(
                (t) =>
                    t.from.kind === "raid" &&
                    (t.from.hard ?? false) === hard &&
                    !isEveryTimeTrophy(t) &&
                    !this.hasTrophy(hero, t.id),
            );
        const pick = (pool: TrophyDef[]): TrophyDef =>
            pool[
                this.rng.weightedIndex(
                    pool.map((t) => (t.from.kind === "raid" ? t.from.weight : 0)),
                )
            ];
        // Expert mode: one of Lil' Zik's looks every time, one they haven't got, till they have all
        const expertPool = this.expert ? purples.filter(isEveryTimeTrophy) : [];
        const current = this.hero;
        for (const hero of this.heroes) {
            this.use(hero);
            const [min, max] = PURPLE_CHANCE;
            const pool = missingOf(hero, false);
            const chance =
                pool.length > 0
                    ? Math.min(max, Math.max(min, hero.raidPointsEarned / PURPLE_POINTS))
                    : 0;
            const purple = pool.length > 0 && this.rng.chance(chance) ? pick(pool) : undefined;
            const hardPool = this.hard ? missingOf(hero, true) : [];
            const hardOne =
                hardPool.length > 0 && this.rng.chance(HARD_UNIQUE_CHANCE)
                    ? pick(hardPool)
                    : undefined;
            const missingLooks = expertPool.filter((t) => !this.hasTrophy(hero, t.id));
            const expertOne = missingLooks.length > 0 ? this.rng.pick(missingLooks) : undefined;
            const found = [purple, hardOne, expertOne].filter(
                (t): t is TrophyDef => t !== undefined,
            );
            hero.raidChest = {
                points: hero.raidPointsEarned,
                chance,
                found: found.map((t) => t.id),
            };
            this.emit(
                {
                    type: "notice",
                    message:
                        found.length > 0
                            ? `A purple chest! ${found.map((t) => this.findTrophy(t)).join(" ")}`
                            : this.noUniqueNotice(
                                  chance,
                                  pool.length === 0 && hardPool.length === 0,
                              ),
                },
                true,
            );
        }
        this.use(current);
    }

    // A raid chest's notice when it gave nothing: everything's found already, or no purple left to
    // find but a roll of its own made (no chance to show), or the purple's chance
    private noUniqueNotice(chance: number, allFound: boolean): string {
        if (allFound) {
            return "The chest holds nothing you haven't found already.";
        }
        return chance > 0
            ? `The chest holds no unique this time (${Math.round(chance * 100)}% chance).`
            : "The chest holds no unique this time.";
    }

    // Whether a hero has this trophy already: found this run, or before it (Hero.trophiesFound)
    private hasTrophy(hero: Hero, id: string): boolean {
        return hero.trophies.has(id) || (hero.trophiesFound?.has(id) ?? false);
    }

    // The Tombs of Amascut's chest, once the last Warden's down, each of the party their own: a
    // purple, more likely the higher the raid level (PURPLE_CHANCE's least at 0, its most at
    // 500), from those its level allows, then its pet, the Thread and the jewels, each a roll of
    // its own from its raid level. As the Theatre's, only what the hero hasn't found: a purple is
    // one of those left, and a pet, Thread or jewel they have isn't rolled for
    private openTombsChest(): void {
        const level = this.tombsChestLevel();
        const open = TROPHIES.flatMap((trophy) =>
            trophy.from.kind === "tombs" && level >= trophy.from.level
                ? [{ trophy, from: trophy.from }]
                : [],
        );
        const current = this.hero;
        for (const hero of this.heroes) {
            this.use(hero);
            const missing = open.filter(({ trophy }) => !this.hasTrophy(hero, trophy.id));
            const purples = missing.filter(({ from }) => from.weight !== undefined);
            const chance = purples.length > 0 ? this.tombsChance(hero) : 0;
            const found: TrophyDef[] = [];
            const purple =
                purples.length > 0 && this.rng.chance(chance)
                    ? purples[this.rng.weightedIndex(purples.map(({ from }) => from.weight!))]
                          .trophy
                    : undefined;
            if (purple) {
                found.push(purple);
            }
            for (const { trophy, from } of missing) {
                if (from.chance !== undefined && this.rng.chance(from.chance)) {
                    found.push(trophy);
                }
            }
            hero.raidChest = {
                points: Math.round(hero.tombsPoints),
                chance,
                found: found.map((t) => t.id),
                level,
            };
            this.emit(
                {
                    type: "notice",
                    message:
                        found.length > 0
                            ? (purple ? "A purple chest! " : "") +
                              found.map((t) => this.findTrophy(t)).join(" ")
                            : this.noUniqueNotice(chance, missing.length === 0),
                },
                true,
            );
        }
        this.use(current);
    }

    // The raid level the chest goes by: a time limit invocation's missed, its drop off it
    private tombsChestLevel(): number {
        const limit = Object.entries(TOMBS_TIME_LIMITS).find(([id]) => this.invoked(id))?.[1];
        const late = limit !== undefined && this.seconds > limit.minutes * 60;
        return Math.max(0, this.raidLevel - (late ? limit.drop : 0));
    }

    // A hero's chance of a purple from the Tombs' chest: the raid level's (PURPLE_CHANCE's least
    // at 0, its most at 500), all of it with a whole raid's points, less with fewer
    private tombsChance(hero: Hero): number {
        const [min, max] = PURPLE_CHANCE;
        const level = min + ((max - min) * Math.min(this.tombsChestLevel(), 500)) / 500;
        return level * Math.min(1, hero.tombsPoints / TOMBS_POINTS.full);
    }

    // What a Tombs boss's whole hitpoints are worth in points (TOMBS_POINTS), none for the rest
    private tombsWorth(enemy: Enemy): number {
        if (!this.map.tombs) {
            return 0;
        }
        const wardens = this.tombsWardens;
        if (wardens) {
            if (enemy.uid === wardens.obeliskUid) {
                return TOMBS_POINTS.obelisk;
            }
            if (enemy.uid === wardens.two?.wardenUid || enemy.uid === wardens.two?.kneel?.coreUid) {
                return TOMBS_POINTS.wardenTwo;
            }
            return enemy.uid === wardens.three?.wardenUid ? TOMBS_POINTS.wardenThree : 0;
        }
        return enemy.uid === this.tombsRoom?.boss?.uid ? TOMBS_POINTS.boss : 0;
    }

    // The Tombs' board for the result screen
    private tombsSummary(): TombsSummary | undefined {
        const tombs = this.map.tombs;
        if (!tombs) {
            return undefined;
        }
        const wardens = this.tombsWardens;
        const end = this.fellTick >= 0 ? this.fellTick : this.tick;
        const limit = Object.entries(TOMBS_TIME_LIMITS).find(([id]) => this.invoked(id))?.[1];
        return {
            level: this.raidLevel,
            invocations: cleanInvocations(this.invocations),
            paths: this.tombsTimes.flatMap((time) => {
                const path = tombs.paths.find((p) => p.id === time.id);
                return path && time.seconds !== undefined
                    ? [{ id: time.id, name: path.name, seconds: time.seconds }]
                    : [];
            }),
            ...(wardens && {
                wardensSeconds: (end - this.wardensFromTick) / TICKS_PER_SECOND,
            }),
            wipes: this.tombsDeaths,
            ...(limit && {
                timeLimit: {
                    minutes: limit.minutes,
                    drop: limit.drop,
                    met: this.seconds <= limit.minutes * 60,
                },
            }),
            party: this.heroes.map((hero) => ({
                name: hero.name,
                points: Math.round(hero.tombsPoints),
                deaths: hero.tombsDowns,
                chance: hero.raidChest?.chance ?? this.tombsChance(hero),
                you: hero === this.hero,
            })),
        };
    }

    get raidPoints(): number {
        return this.hero.raidPoints;
    }

    private useRaidSupply(supplyId: string): void {
        const supply = getRaidSupply(supplyId);
        const effect = supply.effect;
        if (effect.kind === "heal") {
            this.heal(this.player.maxHp * effect.fraction);
            return;
        }
        if (effect.cures) {
            this.cure();
        }
        this.addBuff(`raid:${supply.id}`, effect.stats, effect.seconds, effect.cures ?? false);
        this.buffs[this.buffs.length - 1].look = { name: supply.name, objId: supply.objId };
    }

    // Everyone to a spot, side by side north to south, down or not, and what's on the ground
    // with them, so nothing's left in a room they can't get back to
    private moveParty(to: { x: number; y: number }): void {
        const current = this.hero;
        this.heroes.forEach((hero, i) => {
            const one = hero.player;
            one.x = one.prevX = to.x;
            one.y = one.prevY = to.y + (i - (this.heroes.length - 1) / 2) * 1.5;
            this.use(hero);
            this.updateFlowField();
        });
        this.use(current);
        this.pickups.forEach((pickup, i) => {
            if (pickup.disguise) {
                pickup.value = -1;
                return;
            }
            const angle = (i * 2.399) % (Math.PI * 2);
            const distance = 1.5 + (i % 5) * 0.5;
            // Somewhere it can be walked to (a casket isn't pulled in, so one in a wall is lost)
            const spot = this.walkableSpot(
                to.x + fm.cos(angle) * distance,
                to.y + fm.sin(angle) * distance,
            );
            pickup.x = spot.x;
            pickup.y = spot.y;
            pickup.pileUid = 0;
            if (pickup.kind !== "casket" && pickup.kind !== "powerUp") {
                pickup.attracted = true;
                pickup.speed = Math.max(pickup.speed, 0.15);
            }
        });
    }

    // The player's safe and everything runs for it (BossDef.intro); the boss
    // comes up partway through
    startIntro(def: EnemyDef, type: "boss" | "finalBoss", hp?: number): void {
        const intro = def.boss!.intro!;
        const startTick = this.tick;
        const endTick = startTick + secondsToTicks(intro.seconds);
        this.intro = {
            def,
            type,
            hp,
            startTick,
            riseTick: startTick + secondsToTicks(intro.riseAt),
            endTick,
        };
        for (const enemy of this.enemies) {
            if (!enemy.dead) {
                this.sendOff(enemy, endTick - LEAVE_MARGIN_TICKS);
            }
        }
        this.clearBossAttacks();
        this.enemyProjectiles = [];
        this.funBossGroup = [];
        this.emit({ type: "bossIntro", enemyId: def.id, sound: intro.darkSound ?? -1 });
    }

    // Off to the nearest edge of the map. It can't be hit, and it's gone by
    // lastTick however far that is.
    private sendOff(enemy: Enemy, lastTick: number): void {
        const { x, y } = enemy;
        const grid = this.grid;
        const west = x - grid.baseX;
        const east = grid.baseX + grid.sizeX - x;
        const south = y - grid.baseY;
        const north = grid.baseY + grid.sizeY - y;
        const distance = Math.min(west, east, south, north);
        const stays = enemy.def.stationary ?? false;
        const ticks = Math.max(1, lastTick - this.tick);
        const speed = stays
            ? 0
            : Math.min(
                  LEAVE_MAX_SPEED / TICKS_PER_SECOND,
                  Math.max(distance / ticks, enemy.speed * LEAVE_MIN_SCALE),
              );
        const dirX = distance === west ? -1 : distance === east ? 1 : 0;
        const dirY = dirX !== 0 ? 0 : distance === south ? -1 : 1;
        enemy.leaving = {
            vx: dirX * speed,
            vy: dirY * speed,
            startTick: this.tick,
            endTick: stays ? lastTick : Math.min(lastTick, this.tick + Math.ceil(distance / speed)),
        };
        // Whatever it was doing, it's stopped
        enemy.shieldEnd = Infinity;
        enemy.jump = undefined;
        enemy.frozen = 0;
        enemy.vx = enemy.vy = 0;
        enemy.anim = "walk";
        enemy.animStart = this.tick;
        enemy.yaw = yawFromVector(dirX, dirY);
        if (enemy.bossState) {
            enemy.bossState.windup = undefined;
            enemy.bossState.surge = undefined;
            enemy.bossState.chain = undefined;
            enemy.bossState.follow = undefined;
            enemy.bossState.leap = undefined;
        }
    }

    // Straight there: through whatever's in the way, as nothing's looking
    private stepLeaving(enemy: Enemy, leaving: EnemyLeaving): void {
        enemy.x += leaving.vx;
        enemy.y += leaving.vy;
        if (this.tick >= leaving.endTick) {
            this.vanish(enemy);
        }
    }

    private countDeath(enemy: Enemy): void {
        if (!enemy.dead) {
            enemy.deathSeq = ++this.enemyDeaths;
        }
    }

    // Gone with no death, no drop and nothing counted
    private vanish(enemy: Enemy): void {
        this.countDeath(enemy);
        enemy.dead = true;
        enemy.deathTick = -Infinity;
    }

    private stepIntro(): void {
        const intro = this.intro;
        if (!intro) {
            return;
        }
        if (this.tick >= intro.riseTick && !intro.boss) {
            this.riseBoss(intro);
        }
        // Down on the ground (BossIntroDef.land)
        const land = intro.def.boss?.intro?.land;
        const boss = intro.boss;
        if (
            land &&
            boss &&
            this.tick === intro.riseTick + secondsToTicks(intro.def.boss!.intro!.landAt ?? 0)
        ) {
            this.showImpact(land, boss.x, boss.y);
        }
        if (this.tick >= intro.endTick) {
            this.intro = undefined;
        }
    }

    // Whether the players are kept in the map's bossArena: while a boss fought
    // in phases is up, unless it lets them out (BossPhasesDef.confine)
    get confinedToArena(): boolean {
        const phases = this.shownBoss?.def.boss?.phases;
        return this.map.bossArena !== undefined && phases !== undefined && phases.confine !== false;
    }

    // Where players held to watch an entrance look (BossIntroDef.holds, faces): at the boss once
    // it's up, and where it'll rise until then
    get introFacing(): { x: number; y: number } | undefined {
        if (!this.introHolds || !this.intro?.def.boss?.intro?.faces) {
            return undefined;
        }
        const boss = this.intro?.boss;
        if (boss) {
            return { x: boss.x, y: boss.y };
        }
        const arena = this.bossArena;
        return (
            this.map.features?.rise ?? {
                x: (arena.minX + arena.maxX) / 2,
                y: (arena.minY + arena.maxY) / 2,
            }
        );
    }

    // Whether an entrance has the players standing still to watch it
    // (BossIntroDef.holds): the movement rules take it like a hold
    get introHolds(): boolean {
        return this.intro?.def.boss?.intro?.holds === true;
    }

    // Up it comes beside the player, on the arena's side of them, so it's on the
    // screen wherever they are
    private riseBoss(intro: BossIntro): void {
        const def = intro.def;
        const rise = def.boss!.intro!;
        // Co-op: beside one of the party
        this.useSpawnHero();
        const player = this.player;
        const arena = this.bossArena;
        // Where the map says it rises (ArenaFeatures.rise), or the middle of its square
        const spot = this.map.features?.rise;
        const middleX = spot?.x ?? (arena.minX + arena.maxX) / 2;
        const middleY = spot?.y ?? (arena.minY + arena.maxY) / 2;
        const atMiddle = rise.atMiddle === true && this.map.bossArena !== undefined;
        // A fight in a set square starts in the middle of it, under the dark,
        // a party side by side north to south; or, with the boss rising at the
        // middle itself, south of it, side by side east to west
        if (this.map.bossArena) {
            const up = this.heroes.filter((hero) => this.heroes.length === 1 || this.isUp(hero));
            up.forEach((hero, i) => {
                const one = hero.player;
                const along = (i - (up.length - 1) / 2) * 1.5;
                one.x = one.prevX = middleX + (atMiddle ? along : 0);
                one.y = one.prevY = atMiddle ? middleY - rise.distance : middleY + along;
            });
        }
        let at: { x: number; y: number };
        if (atMiddle) {
            at = findFreeSpot(this.grid, middleX, middleY, def.radius);
        } else {
            // East or west, as the screen's wider than it's tall and she's tall
            // herself: north of the player, she'd be off the top of it
            const x = player.x + (player.x > middleX ? -1 : 1) * rise.distance;
            const y = player.y;
            at = this.canTurnUpAt(def, x, y)
                ? { x, y }
                : (this.findSpotNear(player.x, player.y, rise.distance, def.radius) ??
                  findFreeSpot(this.grid, x, y, def.radius));
        }
        const boss = this.spawnBoss(def, intro.type, intro.hp, at);
        if (!boss) {
            return;
        }
        intro.boss = boss;
        boss.risingEnd = intro.endTick;
        boss.shieldEnd = intro.endTick;
        boss.anim = "attack";
        boss.attackSeq = rise.seq ?? def.idleSeq;
        boss.animStart = this.tick;
        boss.yaw = yawFromVector(player.x - boss.x, player.y - boss.y);
        // The cooldown only counts once it's up (stepEnemies skips what's
        // rising), so this is the grace after its entrance: none when the
        // player's stood rooted through it, which was the grace
        boss.attackCooldown = rise.holds ? 0 : intro.endTick - this.tick + TICKS_PER_SECOND;
        if (rise.spotAnim !== undefined) {
            this.addEffect(rise.spotAnim, boss.x, boss.y, 0, intro.endTick - this.tick);
        }
        if (rise.alone) {
            this.aloneWith = boss;
        }
        this.emit({
            type: "bossRising",
            enemyId: def.id,
            sound: rise.sound ?? -1,
            x: boss.x,
            y: boss.y,
        });
    }

    // A phase that changes the scene's light (BossPhasesDef light), on a map with lighting
    private phaseLight(phase: { light?: number }): void {
        if (this.lighting && phase.light !== undefined) {
            this.dimTo(phase.light, PHASE_LIGHT_SECONDS);
        }
    }

    // Its first shield, and its totems standing idle in the corners; or with no
    // totems, its hitpoints to get through, a phase at a time
    private startPhases(boss: Enemy, phases: BossPhasesDef): void {
        this.phaseLight(phases.phases[0]);
        const totemsDef = phases.totems;
        if (!totemsDef) {
            boss.speed *= phases.phases[0].speed ?? 1;
            boss.bossState!.phase = {
                index: 0,
                stage: "hp",
                shield: 0,
                shieldMax: 0,
                totems: [],
                ambientNext: 0,
                startTick: this.tick,
            };
            return;
        }
        const shieldMax = Math.round(boss.maxHp * (phases.phases[0].shield ?? 0));
        const totems: Enemy[] = [];
        const arena = this.bossArena;
        const margin = totemsDef.margin;
        const idle = getEnemy(totemsDef.idleId);
        const charge = Math.max(1, Math.round(boss.maxHp * totemsDef.charge));
        for (const x of [arena.minX + margin, arena.maxX - margin]) {
            for (const y of [arena.minY + margin, arena.maxY - margin]) {
                // Where the player can get to, whatever's in that corner
                const spot = findFreeSpot(this.grid, x, y, PLAYER_RADIUS, (tileX, tileY) =>
                    this.isWalkableTile(tileX, tileY),
                );
                const totem = this.spawnEnemy(idle, "normal", spot);
                if (totem) {
                    // Turned to the arena's middle, and it stays turned
                    totem.yaw =
                        (yawFromVector(
                            (arena.minX + arena.maxX) / 2 - spot.x,
                            (arena.minY + arena.maxY) / 2 - spot.y,
                        ) +
                            (totemsDef.yawOffset ?? 0)) &
                        2047;
                    totem.totemOf = boss;
                    totem.hp = totem.maxHp = charge;
                    totem.xp = 0;
                    totem.noDrops = true;
                    totem.shieldEnd = Infinity;
                    totems.push(totem);
                }
            }
        }
        boss.speed *= phases.phases[0].speed ?? 1;
        boss.bossState!.phase = {
            index: 0,
            stage: "shield",
            shield: shieldMax,
            shieldMax,
            totems,
            ambientNext: 0,
        };
    }

    // Down comes the shield: nothing can touch it now, and the totems wake
    private breakShield(boss: Enemy, phase: BossPhase): void {
        const phases = boss.def.boss!.phases!;
        phase.stage = "totems";
        phase.shield = 0;
        boss.shieldEnd = Infinity;
        // Whatever was steering for it flies straight from here
        for (const projectile of this.projectiles) {
            if (projectile.targetUid === boss.uid) {
                projectile.targetUid = 0;
            }
        }
        const charging = getEnemy(phases.totems!.chargingId);
        for (const totem of phase.totems) {
            totem.def = charging;
            totem.hp = totem.maxHp;
            totem.shieldEnd = 0;
        }
        this.pushStage(boss, phase, phases.shieldMessage);
    }

    private totemCharged(totem: Enemy, boss: Enemy): void {
        const phase = boss.bossState?.phase;
        const phases = boss.def.boss?.phases;
        if (!phase || !phases) {
            return;
        }
        totem.hp = 0;
        totem.def = getEnemy(phases.totems!.chargedId);
        totem.shieldEnd = Infinity;
        this.emit({
            type: "bossAttack",
            enemyId: boss.def.id,
            sound: phases.totems!.chargedSound ?? -1,
            x: totem.x,
            y: totem.y,
        });
        if (phase.totems.every((t) => t.hp <= 0)) {
            this.totemsBlast(boss, phase, phases);
        }
    }

    // All four charged: they take a share of its hitpoints, the last of it
    // with the last blast, and otherwise it's on to the next phase
    private totemsBlast(boss: Enemy, phase: BossPhase, phases: BossPhasesDef): void {
        const totemsDef = phases.totems!;
        for (const totem of phase.totems) {
            this.emit({
                type: "totemBlast",
                sound: totemsDef.blastSound ?? -1,
                x: totem.x,
                y: totem.y,
                toX: boss.x,
                toY: boss.y,
            });
        }
        if (totemsDef.blastSpotAnim !== undefined) {
            this.addEffect(totemsDef.blastSpotAnim, boss.x, boss.y, 0, 60, boss.uid);
        }
        // There's no food in a fight this long with nothing else in it
        this.forEachHeroInReach(() =>
            this.heal(Math.round(this.player.maxHp * (phases.blastHeal ?? 0))),
        );
        const next = phases.phases[phase.index + 1];
        if (!next) {
            const finale = phases.finale;
            if (!finale) {
                boss.shieldEnd = 0;
                boss.bossState!.windup = undefined;
                this.killEnemy(boss);
                return;
            }
            this.startFinale(boss, phase, finale);
            return;
        }
        boss.hp -= Math.round(boss.maxHp / phases.phases.length);
        // Quicker on its feet with each phase (BossPhasesDef speed)
        boss.speed *= (next.speed ?? 1) / (phases.phases[phase.index].speed ?? 1);
        phase.index++;
        this.phaseLight(next);
        phase.stage = "shield";
        // The new phase's dream from its first tick (the old one's bullets fly on)
        phase.ambientNext = this.tick;
        phase.ambientsNext = undefined;
        phase.startTick = this.tick;
        phase.shieldMax = phase.shield = Math.round(boss.maxHp * (next.shield ?? 0));
        phase.opener = next.opener
            ? boss.def.boss!.attacks.find((a) => a.name === next.opener)
            : undefined;
        boss.shieldEnd = 0;
        const idle = getEnemy(totemsDef.idleId);
        for (const totem of phase.totems) {
            totem.def = idle;
            totem.hp = totem.maxHp;
            totem.shieldEnd = Infinity;
        }
        this.quarters = undefined;
        this.pushStage(boss, phase, phases.blastMessage);
    }

    // Its last stand (BossPhasesDef.finale): untouchable, at its finale's attacks at once, and
    // gone when the time's up (stepPhase)
    private startFinale(
        boss: Enemy,
        phase: BossPhase,
        finale: NonNullable<BossPhasesDef["finale"]>,
    ): void {
        phase.stage = "finale";
        phase.shield = 0;
        phase.finaleEnd = this.tick + secondsToTicks(finale.seconds);
        phase.ambientNext = this.tick;
        phase.opener = finale.opener
            ? boss.def.boss!.attacks.find((a) => a.name === finale.opener)
            : undefined;
        boss.attackCooldown = 0;
        if (finale.shout) {
            this.emit({ type: "bossShout", enemyUid: boss.uid, text: finale.shout });
        }
        this.pushStage(boss, phase, finale.message);
    }

    // The hitpoints a phase in hitpoints (BossPhasesDef) leaves its boss at however hard it's hit
    // (passThreshold)
    private phaseThreshold(boss: Enemy, phase: BossPhase): number {
        const phases = boss.def.boss!.phases!;
        const count = phases.phases.length;
        const index = phase.index;
        const until = phases.phases[index].until ?? (count - 1 - index) / count;
        return Math.max(1, Math.round(boss.maxHp * until));
    }

    // How low a hit can take a boss in its phase: its next threshold (passThreshold), 1 in the
    // last with a finale to come (lastStand), or 0 with nothing to stop it
    private phaseFloor(boss: Enemy, phase: BossPhase): number {
        const phases = boss.def.boss?.phases;
        if (!phases || phase.stage !== "hp") {
            return 0;
        }
        if (phases.by !== "shields" && phase.index < phases.phases.length - 1) {
            return this.phaseThreshold(boss, phase);
        }
        return phases.finale && !phases.totems ? 1 : 0;
    }

    // A boss fought on its hitpoints, with a finale, brought to none: it stays up at 1 for its
    // finale instead of falling (the Menaphite Akh's last stand). False when it's to die now.
    private lastStand(boss: Enemy, phase: BossPhase): boolean {
        const phases = boss.def.boss?.phases;
        if (!phases?.finale || phases.totems || phase.stage !== "hp") {
            return false;
        }
        boss.hp = 1;
        boss.shieldEnd = Infinity;
        const state = boss.bossState!;
        state.chain = undefined;
        state.follow = undefined;
        state.exposedEnd = undefined;
        this.startFinale(boss, phase, phases.finale);
        return true;
    }

    // A fight on its hitpoints (BossPhasesDef with no totems): at each phase's
    // share of them it's on to the next, kneeling a moment first (threshold),
    // untouchable and doing nothing of its own. What a hit took past the
    // threshold is lost, so no phase is skipped.
    private passThreshold(boss: Enemy, phase: BossPhase): boolean {
        const phases = boss.def.boss!.phases!;
        // Kephri's go by her shields (kephriNextPhase)
        if (phases.by === "shields") {
            return false;
        }
        const count = phases.phases.length;
        const index = phase.index;
        if (index >= count - 1) {
            return false;
        }
        const at = this.phaseThreshold(boss, phase);
        if (boss.hp > at) {
            return false;
        }
        boss.hp = at;
        const next = phases.phases[index + 1];
        boss.speed *= (next.speed ?? 1) / (phases.phases[index].speed ?? 1);
        phase.index++;
        this.phaseLight(next);
        phase.startTick = this.tick;
        phase.ambientNext = this.tick;
        phase.ambientsNext = undefined;
        phase.opener = next.opener
            ? boss.def.boss!.attacks.find((a) => a.name === next.opener)
            : undefined;
        const threshold = phases.threshold;
        if (threshold) {
            const state = boss.bossState!;
            const end = this.tick + secondsToTicks(threshold.seconds);
            phase.pauseEnd = end;
            phase.riseTick = end - secondsToTicks(threshold.riseSeconds ?? 0);
            phase.ambientNext = end;
            state.windup = undefined;
            state.chain = undefined;
            state.follow = undefined;
            state.channelEnd = Math.max(state.channelEnd, end);
            boss.shieldEnd = end;
            boss.vx = boss.vy = 0;
            boss.anim = "attack";
            boss.attackSeq = threshold.seq ?? boss.def.idleSeq;
            boss.animStart = this.tick;
            if (threshold.spotAnim !== undefined) {
                this.addEffect(threshold.spotAnim, boss.x, boss.y, 0, end - this.tick, boss.uid);
            }
            if (threshold.sound !== undefined) {
                this.emit({
                    type: "bossAttack",
                    enemyId: boss.def.id,
                    sound: threshold.sound,
                    x: boss.x,
                    y: boss.y,
                });
            }
            if (threshold.shout) {
                this.emit({ type: "bossShout", enemyUid: boss.uid, text: threshold.shout });
            }
            this.showImpact(threshold.impact, boss.x, boss.y);
        }
        this.pushStage(boss, phase, next.message ?? next.status ?? "");
        return true;
    }

    // Kneeling at a threshold: up it gets for the last of it (riseSeq)
    private stepThreshold(boss: Enemy, phase: BossPhase): boolean {
        const end = phase.pauseEnd;
        if (end === undefined) {
            return false;
        }
        if (this.tick >= end) {
            // Up, and straight on with the new phase
            phase.pauseEnd = phase.riseTick = undefined;
            this.showImpact(boss.def.boss!.phases!.threshold?.riseImpact, boss.x, boss.y);
            boss.anim = "walk";
            boss.animStart = this.tick;
            boss.attackCooldown = 0;
            return false;
        }
        const rise = boss.def.boss!.phases!.threshold?.riseSeq;
        if (this.tick === phase.riseTick && rise !== undefined) {
            boss.anim = "attack";
            boss.attackSeq = rise;
            boss.animStart = this.tick;
        }
        return true;
    }

    private pushStage(boss: Enemy, phase: BossPhase, message: string): void {
        this.emit({
            type: "bossStage",
            enemyId: boss.def.id,
            phase: phase.index + 1,
            stage: phase.stage,
            message,
            x: boss.x,
            y: boss.y,
        });
    }

    // With the boss gone, so is all it had going
    private endBossFight(boss: Enemy): void {
        const state = boss.bossState;
        if (!state?.phase) {
            return;
        }
        for (const enemy of this.enemies) {
            if (!enemy.dead && (enemy.totemOf === boss || enemy.walksTo === boss)) {
                this.vanish(enemy);
            }
        }
        this.clearBossAttacks();
        // Its phases' light goes back to the map's
        if (this.lighting && boss.def.boss?.phases?.phases.some((p) => p.light !== undefined)) {
            this.dimTo(this.baseAmbient, PHASE_LIGHT_SECONDS);
        }
    }

    // Everything a boss had in the air and on the ground, and on the players
    private clearBossAttacks(): void {
        this.bullets.clear();
        this.emitters = [];
        this.hazards = [];
        this.tethers = [];
        this.quarters = undefined;
        const current = this.hero;
        for (const hero of this.heroes) {
            this.use(hero);
            this.parasite = undefined;
            this.hold = undefined;
            hero.drag = undefined;
            if (this.curse) {
                this.curse = undefined;
                this.emit({ type: "playerCursed", cursed: false });
            }
        }
        this.use(current);
    }

    // A fight across a big arena stays on the screen
    private leashBoss(
        enemy: Enemy,
        leash: NonNullable<NonNullable<EnemyDef["boss"]>["leash"]>,
    ): void {
        const player = this.player;
        const spot = this.findSpotNear(player.x, player.y, leash.keep, enemy.radius);
        if (!spot) {
            return;
        }
        if (leash.spotAnim !== undefined) {
            this.addEffect(leash.spotAnim, enemy.x, enemy.y, 0, 40);
            this.addEffect(leash.spotAnim, spot.x, spot.y, 0, 40);
        }
        const jump = leash.jump;
        if (jump && enemy.bossState) {
            // Down into the ground here, then up out of it there (stepLeap)
            const ticks = secondsToTicks(jump.seconds);
            enemy.bossState.leap = {
                toX: spot.x,
                toY: spot.y,
                switchTick: this.tick + ticks,
                endTick: this.tick + ticks * 2,
            };
            enemy.anim = "attack";
            enemy.attackSeq = jump.downSeq;
            enemy.animStart = this.tick;
            enemy.vx = enemy.vy = 0;
            return;
        }
        enemy.x = enemy.prevX = spot.x;
        enemy.y = enemy.prevY = spot.y;
        enemy.vx = enemy.vy = 0;
    }

    // A leash's jump: it goes down where it was, comes up where it's going,
    // and does nothing else meanwhile
    private stepLeap(enemy: Enemy, leap: NonNullable<BossState["leap"]>): void {
        const jump = enemy.def.boss!.leash!.jump!;
        if (this.tick === leap.switchTick) {
            enemy.x = enemy.prevX = leap.toX;
            enemy.y = enemy.prevY = leap.toY;
            enemy.anim = "attack";
            enemy.attackSeq = jump.upSeq;
            enemy.animStart = this.tick;
        }
        // Down on the ground again
        if (jump.land && this.tick === leap.switchTick + secondsToTicks(jump.landAt ?? 0)) {
            this.showImpact(jump.land, enemy.x, enemy.y);
        }
        if (this.tick >= leap.endTick) {
            const state = enemy.bossState!;
            state.leap = undefined;
            // On with whatever it jumped there to do (toMiddle), or its walk
            const windup = state.windup;
            enemy.anim = windup ? "attack" : "walk";
            enemy.animStart = this.tick;
            if (windup) {
                this.playWindup(enemy, windup);
            }
        }
    }

    // Whether the player's in a cone swing's wedge, or right under the boss
    private inCone(enemy: Enemy, windup: BossWindup, attack: BossAttackDef, cone: number): boolean {
        const player = this.player;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = fm.hypot(dx, dy);
        if (distance <= (attack.underRadius ?? 0) + player.radius) {
            return true;
        }
        if (distance < 0.001) {
            return true;
        }
        const along = (dx * windup.dirX + dy * windup.dirY) / distance;
        return along >= fm.cos(cone / 2);
    }

    // Whether the player's standing in a safe mark of this attack (GroundPatternDef.safe)
    private inSafeMark(attack: BossAttackDef): boolean {
        if (!attack.ground?.safe) {
            return false;
        }
        const player = this.player;
        return this.hazards.some(
            (hazard) =>
                hazard.attack === attack &&
                fm.hypot(player.x - hazard.x, player.y - hazard.y) <= hazard.radius,
        );
    }

    // The marks of a ground attack, there from now until they land
    private markGround(enemy: Enemy, attack: BossAttackDef, landTick: number): void {
        const ground = attack.ground;
        if (!ground) {
            return;
        }
        const player = this.player;
        const damage = attack.damage > 0 && !ground.safe ? this.getBossDamage(enemy, attack) : 0;
        const armed = ground.armed !== undefined;
        // Akkha's: each glows its quadrant's element (BossAttackDef.elemental)
        const akkha = attack.elemental ? enemy.def.boss?.akkha : undefined;
        const quadrants = akkha ? this.tombsPathRoom?.boss?.quadrants : undefined;
        const glow = (x: number, y: number) =>
            akkha && quadrants
                ? getEnemy(akkha.elements[this.akkhaQuadrant(x, y)].orb).light
                : undefined;
        // square: a cell's, half its size either way, shown from start and landing at land
        const add = (
            x: number,
            y: number,
            square?: { half: number; start: number; land: number },
        ) => {
            const land = square?.land ?? landTick;
            this.hazards.push({
                uid: this.nextUid++,
                enemyUid: enemy.uid,
                enemyId: enemy.def.id,
                attack,
                x,
                y,
                radius: square?.half ?? ground.radius,
                damage,
                startTick: square?.start ?? this.tick,
                landTick: land,
                endTick: armed ? land + secondsToTicks(ground.armed!) : land,
                armed,
                fuseTick: -1,
                grabEnd: ground.grab ? land + secondsToTicks(ground.grab.up.to) : 0,
                hit: [],
                lingerEnd: -1,
                nextHurt: -1,
                ...(square && { half: square.half }),
                ...(akkha && { light: glow(x, y) }),
            });
        };
        for (const spots of ground.spots) {
            switch (spots.shape) {
                case "under":
                    add(enemy.x, enemy.y);
                    break;
                case "player":
                    add(player.x, player.y);
                    break;
                case "ring": {
                    const middle = spots.around === "player" ? player : enemy;
                    for (let i = 0; i < spots.count; i++) {
                        const angle = (i / spots.count) * Math.PI * 2;
                        add(
                            middle.x + fm.cos(angle) * spots.distance,
                            middle.y + fm.sin(angle) * spots.distance,
                        );
                    }
                    break;
                }
                case "grid": {
                    const half = (spots.size - 1) / 2;
                    for (let i = 0; i < spots.size; i++) {
                        for (let j = 0; j < spots.size; j++) {
                            add(
                                player.x + (i - half) * spots.spacing,
                                player.y + (j - half) * spots.spacing,
                            );
                        }
                    }
                    break;
                }
                case "trail": {
                    // Where they stood that long ago, or where they are if it's not kept (they
                    // weren't stepped then, or it's further back than TRAIL_SECONDS)
                    const trail = this.hero.trail;
                    for (const ago of spots.ago) {
                        const tick = this.tick - Math.round(ago * TICKS_PER_SECOND);
                        const slot = (((tick % TRAIL_TICKS) + TRAIL_TICKS) % TRAIL_TICKS) * 3;
                        const kept = tick >= 0 && trail[slot + 2] === tick;
                        add(kept ? trail[slot] : player.x, kept ? trail[slot + 1] : player.y);
                    }
                    break;
                }
                case "cross": {
                    // On the player's tile, and a tile apart out from it each way
                    const x = Math.floor(player.x) + 0.5;
                    const y = Math.floor(player.y) + 0.5;
                    add(x, y);
                    for (let d = 1; d <= spots.reach; d++) {
                        add(x + d, y);
                        add(x - d, y);
                        add(x, y + d);
                        add(x, y - d);
                    }
                    break;
                }
                case "scatter": {
                    // Clear of each other, so each is its own thing to step round;
                    // a spot with no room left goes wherever it falls
                    const placed: { x: number; y: number }[] = [];
                    const apart = ground.radius * 2 + SCATTER_GAP;
                    for (let i = 0; i < spots.count; i++) {
                        let x = player.x;
                        let y = player.y;
                        // With awayFrom, the walkable try furthest from the boss if none will do:
                        // never off the map or in a wall, where it couldn't be got to (a doom
                        // ball's circle there killed for certain)
                        let fallback: { x: number; y: number; away: number } | undefined;
                        let found = false;
                        // Clear of the others; and with awayFrom, far enough from the boss, on
                        // ground that can be walked to
                        for (let attempt = 0; attempt < SCATTER_ATTEMPTS; attempt++) {
                            const angle = this.rng.range(0, Math.PI * 2);
                            const distance = this.rng.range(1, spots.spread);
                            x = player.x + fm.cos(angle) * distance;
                            y = player.y + fm.sin(angle) * distance;
                            const clear = placed.every((p) => fm.hypot(p.x - x, p.y - y) >= apart);
                            if (!spots.awayFrom) {
                                if (clear) {
                                    break;
                                }
                                continue;
                            }
                            const walkable =
                                this.grid.contains(Math.floor(x), Math.floor(y)) &&
                                this.isWalkableTile(Math.floor(x), Math.floor(y));
                            const away = fm.hypot(x - enemy.x, y - enemy.y);
                            if (walkable && (!fallback || away > fallback.away)) {
                                fallback = { x, y, away };
                            }
                            if (clear && away >= spots.awayFrom && walkable) {
                                found = true;
                                break;
                            }
                        }
                        if (!found && spots.awayFrom) {
                            x = fallback?.x ?? player.x;
                            y = fallback?.y ?? player.y;
                        }
                        placed.push({ x, y });
                        add(x, y);
                    }
                    break;
                }
                case "checker": {
                    // One colour's cells, then the other's: there's always a cell
                    // of the other colour a step away
                    const checker = this.map.features?.checker;
                    if (!checker) {
                        break;
                    }
                    const first = this.rng.int(2);
                    const half = checker.cell / 2;
                    const then = landTick + secondsToTicks(spots.then);
                    const at = checkerCellAt(checker, player.x, player.y);
                    const cross = spots.cross;
                    for (const cell of checkerCells(checker)) {
                        if (
                            cross !== undefined &&
                            !(cell.cx === at.cx && Math.abs(cell.cy - at.cy) <= cross) &&
                            !(cell.cy === at.cy && Math.abs(cell.cx - at.cx) <= cross)
                        ) {
                            continue;
                        }
                        const now = cell.colour === first;
                        add(cell.x, cell.y, {
                            half,
                            start: now ? this.tick : landTick,
                            land: now ? landTick : then,
                        });
                    }
                    break;
                }
            }
        }
    }

    // The lines cross close enough to the player that the safe quarter's
    // always in reach, wherever in the arena they are
    // at: where the boss is going to stand (toMiddle), when it isn't there yet
    private growQuarters(
        enemy: Enemy,
        attack: BossAttackDef,
        hurtTick: number,
        at?: { x: number; y: number },
    ): void {
        const quarters = attack.quarters;
        if (!quarters) {
            return;
        }
        const middle = at ?? (attack.toMiddle ? enemy : this.partyMiddle());
        const arena = this.bossArena;
        const margin = quarters.offset * 2;
        const offset = () => this.rng.range(-quarters.offset, quarters.offset);
        const clamp = (value: number, min: number, max: number) =>
            Math.min(Math.max(value, min + margin), max - margin);
        const x = clamp(middle.x + offset(), arena.minX, arena.maxX);
        const y = clamp(middle.y + offset(), arena.minY, arena.maxY);
        this.quarters = {
            enemyUid: enemy.uid,
            attack,
            x,
            y,
            safe: this.rng.int(4),
            damage: this.getBossDamage(enemy, attack),
            startTick: this.tick,
            hurtTick,
            endTick: hurtTick + secondsToTicks(quarters.seconds),
            nextHurt: hurtTick,
        };
    }

    // She goes to the edge at once and stands there: the lane's on the ground
    // from now until she's gone by, in line with where the player is, so
    // there's something to step out of
    private pickLane(enemy: Enemy, attack: BossAttackDef): SurgeLane {
        const player = this.player;
        const arena = this.map.tombs ? this.tombsLaneBox(enemy) : this.bossArena;
        const margin = enemy.radius + 1;
        const edge = this.rng.int(4);
        const minX = arena.minX + margin;
        const maxX = arena.maxX - margin;
        const minY = arena.minY + margin;
        const maxY = arena.maxY - margin;
        const px = Math.min(Math.max(player.x, minX), maxX);
        const py = Math.min(Math.max(player.y, minY), maxY);
        const lane: SurgeLane = {
            fromX: edge === 0 ? minX : edge === 1 ? maxX : px,
            fromY: edge === 2 ? minY : edge === 3 ? maxY : py,
            toX: edge === 0 ? maxX : edge === 1 ? minX : px,
            toY: edge === 2 ? maxY : edge === 3 ? minY : py,
            halfWidth: attack.radius ?? 2.5,
        };
        if (attack.castSpotAnim !== undefined) {
            this.addEffect(attack.castSpotAnim, enemy.x, enemy.y, 0, 40);
        }
        enemy.x = enemy.prevX = lane.fromX;
        enemy.y = enemy.prevY = lane.fromY;
        enemy.vx = enemy.vy = 0;
        enemy.yaw = yawFromVector(lane.toX - lane.fromX, lane.toY - lane.fromY);
        return lane;
    }

    // The Tombs' rooms have no boss square (MapDef.bossArena), so a surge's edges are where the
    // floor ends along the player's row and column: as far as the boss fits each way (its own
    // room's walls, not the map's), and never back over its fight's line
    private tombsLaneBox(enemy: Enemy): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } {
        const player = this.player;
        const margin = enemy.radius + 1;
        const line = this.tombsPathRoom?.boss?.line.y;
        const reach = (dx: number, dy: number): number => {
            let far = 0;
            for (let d = 0.5; d <= TOMBS_LANE_MOST; d += 0.5) {
                const x = player.x + dx * d;
                const y = player.y + dy * d;
                if (
                    !isCircleFree(this.grid, x, y, enemy.radius) ||
                    (line !== undefined && y < line + enemy.radius)
                ) {
                    break;
                }
                far = d;
            }
            return far;
        };
        return {
            minX: player.x - reach(-1, 0) - margin,
            maxX: player.x + reach(1, 0) + margin,
            minY: player.y - reach(0, -1) - margin,
            maxY: player.y + reach(0, 1) + margin,
        };
    }

    // Whether a circle's into one of Ba-Ba's boulders' rocks (BossAttackDef.leavesCover)
    private inCoverRock(x: number, y: number, radius: number): boolean {
        return this.tombsCover.some(
            (rock) =>
                this.tick < rock.endTick && fm.hypot(x - rock.x, y - rock.y) < rock.radius + radius,
        );
    }

    private startSurge(enemy: Enemy, attack: BossAttackDef, lane: SurgeLane): void {
        const length = fm.hypot(lane.toX - lane.fromX, lane.toY - lane.fromY);
        const speed = attack.speed ?? 24;
        enemy.bossState!.surge = {
            attack,
            lane,
            startTick: this.tick,
            endTick: this.tick + Math.max(1, Math.ceil((length / speed) * TICKS_PER_SECOND)),
            hit: [],
        };
        enemy.anim = "attack";
        enemy.animStart = this.tick;
        enemy.attackSeq = enemy.def.boss?.surgeSeq ?? enemy.attackSeq;
    }

    // Down the lane at a steady speed, through anything
    private stepSurge(enemy: Enemy, surge: BossSurge): void {
        const { lane, attack } = surge;
        const span = surge.endTick - surge.startTick;
        const f = Math.min(1, (this.tick - surge.startTick) / span);
        const dx = lane.toX - lane.fromX;
        const dy = lane.toY - lane.fromY;
        enemy.x = lane.fromX + dx * f;
        enemy.y = lane.fromY + dy * f;
        // Through each of them once
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (surge.hit.includes(this.hero.index) || this.runOver) {
                return;
            }
            const length = Math.max(0.001, fm.hypot(dx, dy));
            const px = player.x - enemy.x;
            const py = player.y - enemy.y;
            const along = (px * dx + py * dy) / length;
            const across = (px * dy - py * dx) / length;
            if (
                Math.abs(across) <= lane.halfWidth + player.radius &&
                Math.abs(along) <= SURGE_BODY + player.radius
            ) {
                surge.hit.push(this.hero.index);
                this.bossHit(enemy.def.id, enemy, attack, this.getBossDamage(enemy, attack));
            }
        });
        // Into one of her boulder's rocks: stopped dead against it, stunned (BossDef.guard), and
        // the rest of a chain of them lost
        const guard = enemy.def.boss?.guard;
        if (
            guard &&
            guard.stun > 0 &&
            !this.runOver &&
            this.inCoverRock(enemy.x, enemy.y, enemy.radius)
        ) {
            const back = Math.max(0, (this.tick - 1 - surge.startTick) / span);
            enemy.x = lane.fromX + dx * back;
            enemy.y = lane.fromY + dy * back;
            enemy.bossState!.surge = undefined;
            const length = Math.max(0.001, fm.hypot(dx, dy));
            this.showImpact(
                guard.stuck,
                enemy.x + (dx / length) * enemy.radius,
                enemy.y + (dy / length) * enemy.radius,
            );
            enemy.anim = "walk";
            enemy.animStart = this.tick;
            this.dropGuard(enemy, guard.stun, true, "Rubble");
            return;
        }
        if (f >= 1) {
            enemy.bossState!.surge = undefined;
            // Across without hitting anyone: its guard's down (BossDef.guard)
            if (surge.hit.length === 0 && attack.opens !== undefined) {
                this.dropGuard(enemy, attack.opens, false, attack.name);
            }
            const spot = findFreeSpot(this.grid, enemy.x, enemy.y, enemy.radius);
            enemy.x = spot.x;
            enemy.y = spot.y;
            enemy.anim = "walk";
            enemy.animStart = this.tick;
        }
    }

    private markPlayer(enemy: Enemy, attack: BossAttackDef): void {
        const parasite = attack.parasite;
        if (parasite) {
            if (!this.parasite) {
                this.parasite = {
                    enemyUid: enemy.uid,
                    attack,
                    damage: this.getBossDamage(enemy, attack),
                    startTick: this.tick,
                    burstTick: this.tick + secondsToTicks(parasite.seconds),
                };
            }
            return;
        }
        if (attack.effect) {
            this.applyPlayerEffect(attack.effect, enemy);
        }
    }

    // channel: whether the boss stands still for it (not for an ambient
    // pattern, which goes on under whatever else it does)
    private startPattern(
        enemy: Enemy,
        attack: BossAttackDef,
        windup: BossWindup,
        channel = true,
    ): void {
        const pattern = attack.pattern;
        if (!pattern) {
            return;
        }
        let source = this.bulletSources.findIndex(
            (s) => s !== undefined && s.attack === attack && s.enemy === enemy,
        );
        if (source === -1) {
            this.freeBulletSources();
            source = this.bulletSources.indexOf(undefined);
            if (source === -1) {
                source = this.bulletSources.length;
            }
            this.bulletSources[source] = { attack, enemy };
        }
        // Straight down the arena (BulletPatternDef.heading), or at the player
        const aim = pattern.heading === "south" ? -Math.PI / 2 : fm.atan2(windup.dirY, windup.dirX);
        // A spread's or a wall's aimed; a ring's gap is centred on the side asked
        // for, or the ring lands at whatever angle it falls
        let angle = aim;
        if (pattern.shape !== "spread" && pattern.shape !== "wall") {
            angle =
                pattern.gapAt === undefined
                    ? this.rng.range(0, Math.PI * 2)
                    : (pattern.gapAt === "away" ? aim + Math.PI : aim) - (pattern.gap ?? 0) / 2;
        }
        // The next of its sets of rows, in turn (BulletPatternDef.rows), its statues drawing
        let rows: number[] | undefined;
        if (pattern.rows) {
            const used = (enemy.bossState!.rowSets ??= {});
            const times = used[attack.name] ?? 0;
            used[attack.name] = times + 1;
            const sets = pattern.rows.sets;
            rows = sets.length > 0 ? sets[times % sets.length] : [];
            this.animateStatues(attack, this.rowStatues(rows), attack.statues?.windupSeq);
        }
        const delay = secondsToTicks(pattern.delay ?? 0);
        this.emitters.push({
            enemyUid: enemy.uid,
            attack,
            source,
            nextTick: this.tick + delay,
            volleysLeft: pattern.volleys,
            angle,
            aim,
            damage: this.getBossDamage(enemy, attack),
            ambient: !channel,
            originX: pattern.origin === "target" ? windup.targets[0]?.x : undefined,
            originY: pattern.origin === "target" ? windup.targets[0]?.y : undefined,
            ...(rows && { rows, startTick: this.tick }),
        });
        // Still until its volleys are out, or for as long as the pattern says
        // (BulletPatternDef.channel), the rest going on behind its next attack
        if (channel) {
            const state = enemy.bossState!;
            state.channelEnd = Math.max(
                state.channelEnd,
                this.tick + delay + secondsToTicks(pattern.channel ?? patternSeconds(pattern)),
            );
        }
    }

    // What a phased boss keeps up by itself: a finale's end, when it falls, and
    // the phase's ambient pattern (BossPhasesDef ambient), begun again on its
    // own timer under whatever else it's doing, unless it's under the ground
    private stepPhase(boss: Enemy, phase: BossPhase): void {
        const phases = boss.def.boss!.phases!;
        const state = boss.bossState!;
        if (phase.stage === "finale" && this.tick >= (phase.finaleEnd ?? 0)) {
            boss.shieldEnd = 0;
            state.windup = undefined;
            this.killEnemy(boss);
            return;
        }
        const ambients = phase.stage === "finale" ? undefined : phases.phases[phase.index].ambients;
        // Not through an ordeal (Ba-Ba's rolling stones): only what it calls for, meanwhile; nor
        // while Kephri's dazed between her shields
        const dazed = this.tombsKephri?.uid === boss.uid && this.tombsKephri.intermission;
        if (ambients && !this.intro && !state.leap && !state.ordeal && !dazed) {
            this.stepAmbients(boss, phase, ambients);
        }
        const ambient =
            phase.stage === "finale" ? phases.finale?.ambient : phases.phases[phase.index].ambient;
        if (!ambient || this.intro || state.leap) {
            return;
        }
        // Nothing of hers while her sleepwalkers walk in: the player's up by her
        // shooting them down, where a ring can't be stepped through. The dream
        // picks up again as soon as they're done.
        if (state.walkers && phase.stage !== "finale") {
            if (this.emitters.some((e) => e.ambient && e.enemyUid === boss.uid)) {
                this.emitters = this.emitters.filter(
                    (e) => !(e.ambient && e.enemyUid === boss.uid),
                );
            }
            phase.ambientNext = this.tick;
            return;
        }
        if (this.tick < phase.ambientNext) {
            return;
        }
        const attack = boss.def.boss!.attacks.find((a) => a.name === ambient.attack);
        if (!attack?.pattern) {
            return;
        }
        phase.ambientNext =
            this.tick + secondsToTicks(ambient.interval * (this.raidEase(boss.def)?.ambients ?? 1));
        const target = this.nearestHero(boss.x, boss.y).player;
        const toPlayer = Math.max(0.001, fm.hypot(target.x - boss.x, target.y - boss.y));
        this.startPattern(
            boss,
            attack,
            {
                attack,
                startTick: this.tick,
                landTick: this.tick,
                targets: [],
                dirX: (target.x - boss.x) / toPlayer,
                dirY: (target.y - boss.y) / toPlayer,
            },
            false,
        );
    }

    // A phase's other ambients (BossPhasesDef ambients), each on its own timer:
    // patterns and ground marks (cycles go by themselves, stepCycles)
    private stepAmbients(boss: Enemy, phase: BossPhase, ambients: BossAmbientDef[]): void {
        const next = (phase.ambientsNext ??= ambients.map(
            (ambient) => this.tick + secondsToTicks(ambient.delay ?? 0),
        ));
        ambients.forEach((ambient, i) => {
            if (this.tick < next[i]) {
                return;
            }
            const named = boss.def.boss!.attacks.find((a) => a.name === ambient.attack);
            if (!named || named.cycle) {
                next[i] = Infinity;
                return;
            }
            // Quicker, wider or harder with its invocation on, as when it's picked
            const attack = this.invokedAttack(named);
            next[i] =
                this.tick +
                secondsToTicks(ambient.interval * (this.raidEase(boss.def)?.ambients ?? 1));
            if (attack.tether) {
                this.startTether(boss, attack);
                return;
            }
            const target = this.nearestHero(boss.x, boss.y).player;
            const toPlayer = Math.max(0.001, fm.hypot(target.x - boss.x, target.y - boss.y));
            if (attack.pattern) {
                this.startPattern(
                    boss,
                    attack,
                    {
                        attack,
                        startTick: this.tick,
                        landTick: this.tick,
                        // Bursting where they stand (BulletPatternDef.origin)
                        targets:
                            attack.pattern.origin === "target"
                                ? [{ x: target.x, y: target.y }]
                                : [],
                        dirX: (target.x - boss.x) / toPlayer,
                        dirY: (target.y - boss.y) / toPlayer,
                    },
                    false,
                );
            } else if (attack.ground) {
                this.markGround(boss, attack, this.tick + secondsToTicks(attack.windup));
            }
            if (attack.windupSound !== undefined) {
                this.emit({
                    type: "bossAttack",
                    enemyId: boss.def.id,
                    sound: attack.windupSound,
                    x: boss.x,
                    y: boss.y,
                });
            }
        });
    }

    // The rhythms of the phase (BossAttackDef.cycle, among its ambients): each
    // keeps its time from the phase it began in until a phase leaves it out,
    // and burns whoever's on a row that's burning, once every interval
    private stepCycles(boss: Enemy, phase: BossPhase): void {
        const state = boss.bossState!;
        const phases = boss.def.boss!.phases!;
        const ambients =
            phase.stage === "finale" ? undefined : phases.phases[phase.index]?.ambients;
        if (!state.cycles && !ambients?.length) {
            return;
        }
        const on: BossAttackDef[] = [];
        for (const ambient of ambients ?? []) {
            const attack = boss.def.boss!.attacks.find((a) => a.name === ambient.attack);
            if (attack?.cycle) {
                on.push(attack);
            }
        }
        const cycles = (state.cycles ?? []).filter((cycle) => on.includes(cycle.attack));
        if (this.intro) {
            return;
        }
        for (const attack of on) {
            if (!cycles.some((cycle) => cycle.attack === attack)) {
                cycles.push({ attack, startTick: this.tick, nextHit: [] });
            }
        }
        state.cycles = cycles.length > 0 ? cycles : undefined;
        const rows = this.map.features?.fires;
        if (!rows) {
            return;
        }
        for (const cycle of cycles) {
            const def = cycle.attack.cycle!;
            const damage = this.getBossDamage(boss, cycle.attack);
            rows.forEach((row, i) => {
                const { stage, since } = cycleStage(
                    def,
                    cycle.startTick,
                    i,
                    this.tick,
                    TICKS_PER_SECOND,
                );
                if (stage !== "burn") {
                    return;
                }
                const halfX = (row.x1 - row.x0 + 1) / 2;
                const cx = row.x0 + halfX;
                const cy = row.y + 0.5;
                if (since === 0 && cycle.attack.sound !== undefined) {
                    this.emit({
                        type: "bossAttack",
                        enemyId: boss.def.id,
                        sound: cycle.attack.sound,
                        x: cx,
                        y: cy,
                    });
                }
                this.forEachHeroInReach(() => {
                    const player = this.player;
                    const index = this.hero.index;
                    if (
                        this.runOver ||
                        this.tick < (cycle.nextHit[index] ?? 0) ||
                        !circleInBox(player.x, player.y, player.radius, cx, cy, halfX, 0.5)
                    ) {
                        return;
                    }
                    cycle.nextHit[index] = this.tick + secondsToTicks(def.interval);
                    this.bossHit(boss.def.id, boss, cycle.attack, damage);
                });
            });
        }
    }

    // The tempo of the phase a boss is in (BossPhasesDef tempo): what its
    // interval and its patterns' windups are multiplied by
    private phaseTempo(enemy: Enemy): number {
        const phase = enemy.bossState?.phase;
        if (!phase || phase.stage === "finale") {
            return 1;
        }
        return enemy.def.boss?.phases?.phases[phase.index]?.tempo ?? 1;
    }

    // Frees the slots of dead bosses, once no bullet or volley of theirs is
    // left to point at them, for the next pattern to take
    // The slot for bullets of this boss's attack, made if there isn't one
    private bulletSourceFor(enemy: Enemy, attack: BossAttackDef): number {
        let source = this.bulletSources.findIndex(
            (s) => s !== undefined && s.attack === attack && s.enemy === enemy,
        );
        if (source === -1) {
            this.freeBulletSources();
            source = this.bulletSources.indexOf(undefined);
            if (source === -1) {
                source = this.bulletSources.length;
            }
            this.bulletSources[source] = { attack, enemy };
        }
        return source;
    }

    // A blast breaking up where it lands (BossAttackDef.shards): bullets out all round from there
    private fireShards(
        enemy: Enemy,
        attack: BossAttackDef,
        shards: NonNullable<BossAttackDef["shards"]>,
        x: number,
        y: number,
    ): void {
        const source = this.bulletSourceFor(enemy, attack);
        const speed = shards.speed / TICKS_PER_SECOND;
        const life = Math.ceil(shards.range / speed);
        const damage =
            (this.getBossDamage(enemy, attack) * shards.damage) / Math.max(1, attack.damage);
        const turn = this.rng.range(0, Math.PI * 2);
        // The Tombs' go by the raid level (bulletScale)
        const count = this.map.tombs
            ? Math.max(3, Math.round(shards.count * this.bulletScale))
            : shards.count;
        for (let i = 0; i < count; i++) {
            const angle = turn + (i * Math.PI * 2) / count;
            this.bullets.add(
                x + fm.cos(angle) * 0.4,
                y + fm.sin(angle) * 0.4,
                fm.cos(angle) * speed,
                fm.sin(angle) * speed,
                0,
                shards.radius,
                damage,
                life,
                source,
                this.tick,
            );
        }
    }

    private freeBulletSources(): void {
        const sources = this.bulletSources;
        const bullets = this.bullets;
        const inUse = new Set<number>();
        for (let i = 0; i < bullets.count; i++) {
            inUse.add(bullets.source[bullets.order[i]]);
        }
        for (const emitter of this.emitters) {
            inUse.add(emitter.source);
        }
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            if (source && source.enemy.dead && !inUse.has(i)) {
                sources[i] = undefined;
            }
        }
        while (sources.length > 0 && sources[sources.length - 1] === undefined) {
            sources.pop();
        }
    }

    // How many bullets a volley of a pattern fires, and a spread's arc, for the warning to match.
    // More bullets on hard (bulletScale), the space between them as wide: a ring's gap is an
    // angle, so it stays as wide; a spread fans out wider to keep its bullets as far apart; a
    // ring or spiral with no gap has nothing to keep open, so it stays as it is (more would
    // only close it up)
    volleyShape(pattern: BulletPatternDef): { count: number; arc: number } {
        const closed =
            (pattern.shape === "ring" || pattern.shape === "spiral") && pattern.gap === undefined;
        // Lanes (BulletPatternDef.gapStep) are as they are, whatever the mode
        const lanes = pattern.shape === "wall" && pattern.gapStep !== undefined;
        const count =
            closed || lanes ? pattern.count : Math.round(pattern.count * this.bulletScale);
        const arc = Math.min(
            Math.PI * 2,
            ((pattern.arc ?? 1) * Math.max(1, count - 1)) / Math.max(1, pattern.count - 1),
        );
        return { count, arc };
    }

    // A spread's ith bullet's heading, of a volley this shape (volleyShape) aimed at aim, so its
    // warning lines (BossFightView.drawAim) are where they go
    volleyHeading(shape: { count: number; arc: number }, aim: number, i: number): number {
        // The step first, then times i, as it always was: seeded fights stay as they were
        return aim - shape.arc / 2 + i * (shape.arc / Math.max(1, shape.count - 1));
    }

    private fireVolley(emitter: BulletEmitter, boss: Enemy): void {
        const pattern = emitter.attack.pattern!;
        // Each volley after the first can be quicker than the last (speedUp)
        const volley = pattern.volleys - emitter.volleysLeft;
        const speed = (pattern.speed + (pattern.speedUp ?? 0) * volley) / TICKS_PER_SECOND;
        const life = Math.ceil(pattern.range / speed);
        const turn = (pattern.curve ?? 0) / TICKS_PER_SECOND;
        const shape = this.volleyShape(pattern);
        const { count } = shape;
        if (pattern.shape === "wall" || pattern.shape === "closing") {
            this.fireGappedVolley(emitter, boss, speed, life, turn, count);
            return;
        }
        if (pattern.shape === "rows") {
            this.fireRows(emitter, speed);
            return;
        }
        const spread = pattern.shape === "spread";
        // Whoever's nearest now: a tracking spread's aim, a closing ring's middle
        const target = this.nearestHero(boss.x, boss.y).player;
        if (spread && pattern.track) {
            emitter.angle = fm.atan2(target.y - boss.y, target.x - boss.x);
        }
        const around = spread ? undefined : pattern.around;
        // Tiles out from the boss's middle it starts (BulletPatternDef.from)
        const from = pattern.from ?? 0;
        // Out of where it landed (BulletPatternDef.origin), or the boss
        const fromX = emitter.originX ?? boss.x;
        const fromY = emitter.originY ?? boss.y;
        const fire = (angle: number) => {
            // Out from the boss, or in from a circle round the player
            const x =
                around === undefined
                    ? fromX + fm.cos(angle) * from
                    : target.x + fm.cos(angle) * around;
            const y =
                around === undefined
                    ? fromY + fm.sin(angle) * from
                    : target.y + fm.sin(angle) * around;
            const heading = around === undefined ? angle : angle + Math.PI;
            const vx = fm.cos(heading) * speed;
            const vy = fm.sin(heading) * speed;
            this.bullets.add(
                x,
                y,
                vx,
                vy,
                turn,
                pattern.radius,
                emitter.damage,
                pattern.pillars ? this.cutAtPillars(x, y, vx, vy, life) : life,
                emitter.source,
                this.tick,
            );
        };
        const step = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            // The way through a ring, at its own angle
            if (!spread && pattern.gap !== undefined && i * step < pattern.gap) {
                continue;
            }
            const angle = spread
                ? this.volleyHeading(shape, emitter.angle, i)
                : emitter.angle + i * step;
            fire(angle);
            if (pattern.mirror) {
                // The same the other side of the aim, so it turns the other way
                fire(2 * emitter.aim - angle);
            }
        }
        emitter.angle += pattern.turn ?? 0;
    }

    // A bolt down each of the emitter's rows (BulletPatternDef.rows), from its
    // fromX to its toX, or to the first pillar in its way (pillars), and its
    // statues firing
    private fireRows(emitter: BulletEmitter, speed: number): void {
        const pattern = emitter.attack.pattern!;
        const features = this.map.features;
        const rows = features?.bolts;
        if (!rows || !emitter.rows) {
            return;
        }
        for (const index of emitter.rows) {
            const row = rows[index];
            if (!row) {
                continue;
            }
            const dir = row.toX >= row.fromX ? 1 : -1;
            const x = row.fromX + 0.5;
            const y = row.y + 0.5;
            const ticks = Math.max(1, Math.ceil(Math.abs(row.toX - row.fromX) / speed));
            this.bullets.add(
                x,
                y,
                dir * speed,
                0,
                0,
                pattern.radius,
                emitter.damage,
                pattern.pillars ? this.cutAtPillars(x, y, dir * speed, 0, ticks) : ticks,
                emitter.source,
                this.tick,
            );
        }
        this.animateStatues(
            emitter.attack,
            this.rowStatues(emitter.rows),
            emitter.attack.statues?.seq,
        );
        // Its sound, once a volley, from the first of its rows
        const first = rows[emitter.rows[0]];
        const sound = emitter.attack.sound;
        if (sound !== undefined && first) {
            this.emit({
                type: "bossAttack",
                enemyId: this.bulletSources[emitter.source]?.enemy.def.id ?? "",
                sound,
                x: first.fromX + 0.5,
                y: first.y + 0.5,
            });
        }
    }

    // A straight bullet's ticks in the air, cut short where it meets one of the
    // map's pillars (BulletPatternDef.pillars): worked out as it's fired, so it
    // costs nothing in the air
    private cutAtPillars(x: number, y: number, vx: number, vy: number, life: number): number {
        const stop = pillarHit(this.map.features?.pillars, x, y, vx, vy, life);
        return stop < life ? Math.max(1, Math.ceil(stop)) : life;
    }

    // The statues that fire down these of the map's bolt rows
    private rowStatues(rows: readonly number[]): ArenaStatue[] {
        const bolts = this.map.features?.bolts;
        return bolts ? rows.flatMap((index) => bolts[index]?.statues ?? []) : [];
    }

    // A wall or a closing ring: bullets side by side but for a gap of pattern.gap of them, which
    // moves each volley. A wall goes from the boss the way it faces, across it; a closing ring
    // forms round whoever's nearest the boss and comes in on where they stood.
    private fireGappedVolley(
        emitter: BulletEmitter,
        boss: Enemy,
        speed: number,
        life: number,
        turn: number,
        // More bullets on hard (bulletScale, from fireVolley), closer together, with as wide a
        // way through
        count: number,
    ): void {
        const pattern = emitter.attack.pattern!;
        // Lanes (BulletPatternDef.gapStep): as they are, whatever the mode
        const lanes = pattern.shape === "wall" && pattern.gapStep !== undefined;
        const scale = lanes ? 1 : this.bulletScale;
        // The gap's width is its bullets plus one spacing: as many again, so at least as wide
        const gapWidth = ((pattern.gap ?? 2) + 1) * scale;
        const gap = Math.min(Math.round(gapWidth - 1), count - 1);
        // Anywhere round a ring; never at a wall's ends, which can be in a room's walls
        let gapStart =
            pattern.shape === "closing"
                ? this.rng.int(count)
                : 1 + this.rng.int(Math.max(1, count - gap - 1));
        const state = boss.bossState;
        if (lanes && state) {
            // Any lane, ends too, within gapStep of the last wall's
            const last = state.wallGap;
            const step = pattern.gapStep!;
            const lo = last === undefined ? 0 : Math.max(0, last - step);
            const hi = last === undefined ? count - gap : Math.min(count - gap, last + step);
            gapStart = lo + this.rng.int(hi - lo + 1);
            state.wallGap = gapStart;
        }
        const inGap = (i: number) => (i - gapStart + count) % count < gap;
        const add = (x: number, y: number, angle: number, ticks: number, wait = 0) => {
            const vx = fm.cos(angle) * speed;
            const vy = fm.sin(angle) * speed;
            this.bullets.add(
                x,
                y,
                vx,
                vy,
                turn,
                pattern.radius,
                emitter.damage,
                pattern.pillars ? this.cutAtPillars(x, y, vx, vy, ticks) : ticks,
                emitter.source,
                this.tick,
                wait,
            );
        };
        if (pattern.shape === "wall") {
            const spacing = (pattern.spacing ?? pattern.radius * 2.5) / scale;
            const across = emitter.angle + Math.PI / 2;
            const from = pattern.from ?? 0;
            const startX = boss.x + fm.cos(emitter.angle) * from;
            const startY = boss.y + fm.sin(emitter.angle) * from;
            for (let i = 0; i < count; i++) {
                if (inGap(i)) {
                    continue;
                }
                const offset = (i - (count - 1) / 2) * spacing;
                add(
                    startX + fm.cos(across) * offset,
                    startY + fm.sin(across) * offset,
                    emitter.angle,
                    life,
                );
            }
            // The way through, to be broken (BulletPatternDef.cracked)
            if (lanes && pattern.cracked) {
                const offset = (gapStart + (gap - 1) / 2 - (count - 1) / 2) * spacing;
                const cracked = this.spawnEnemy(getEnemy(pattern.cracked), "normal", {
                    x: startX + fm.cos(across) * offset,
                    y: startY + fm.sin(across) * offset,
                });
                if (cracked) {
                    cracked.noDrops = true;
                    cracked.yaw = yawFromVector(fm.cos(emitter.angle), fm.sin(emitter.angle));
                    cracked.rolls = {
                        vx: fm.cos(emitter.angle) * speed,
                        vy: fm.sin(emitter.angle) * speed,
                        endTick: this.tick + life,
                        damage: emitter.damage,
                        knockback: pattern.knockback ?? 0,
                        attack: emitter.attack,
                        bossUid: boss.uid,
                    };
                }
            }
            return;
        }
        const target = this.nearestUpHero(boss.x, boss.y).player;
        const distance = pattern.distance ?? 8;
        // In to where they stood, and no further
        const ticks = Math.min(life, Math.ceil(distance / speed));
        // Standing where it formed a while first (BulletPatternDef.hold)
        const wait = secondsToTicks(pattern.hold ?? 0);
        for (let i = 0; i < count; i++) {
            if (inGap(i)) {
                continue;
            }
            const angle = emitter.angle + (i / count) * Math.PI * 2;
            add(
                target.x + fm.cos(angle) * distance,
                target.y + fm.sin(angle) * distance,
                angle + Math.PI,
                ticks,
                wait,
            );
        }
    }

    private stepBossFight(): void {
        if (this.runOver) {
            return;
        }
        this.stepHold();
        this.stepEmitters();
        this.stepBullets();
        if (this.runOver) {
            return;
        }
        this.stepHazards();
        if (this.runOver) {
            return;
        }
        this.stepQuarters();
        if (this.runOver) {
            return;
        }
        this.stepParasite();
    }

    // The floor (MapDef.floor): its patterns, a slab that's up hitting whoever's on it, and a
    // tile that's fallen putting whoever was on it on the nearest tile that isn't going, hurt.
    // What's drawn is what's hit: a slab hurts only while it's up, and only the tile it's on, by
    // where the player's middle is.
    private stepFloor(): void {
        const floor = this.floor;
        if (!floor) {
            return;
        }
        const def = floor.def;
        const origin = () => this.floorTarget().player;
        const { rose, fell, back, messages } = floor.step(this.tick, origin);
        for (const message of messages) {
            this.emit({ type: "notice", message });
        }
        // A sound where the tiles going this tick are, in the middle of them: the floor's, or each
        // skin's own (FloorSkinDef.material), and a fragile tile's crack as it rises
        const skins = def.skins;
        const material = (tiles: number[], k: number) =>
            skins?.[floor.layout.skin[floor.index(tiles[k], tiles[k + 1])]]?.material;
        for (const [tiles, fallback, kind] of [
            [rose, def.slam.sound, "rise"],
            [fell, def.drop.sound, "fall"],
        ] as const) {
            const groups = new Map<number, number[]>();
            for (let k = 0; k < tiles.length; k += 2) {
                const sound = material(tiles, k)?.[kind]?.sound ?? fallback;
                const group = groups.get(sound) ?? [];
                group.push(tiles[k], tiles[k + 1]);
                groups.set(sound, group);
                const crack = material(tiles, k)?.crack?.sound;
                if (kind === "rise" && crack !== undefined && this.isCracking(tiles, k)) {
                    this.emit({
                        type: "impact",
                        sound: crack,
                        x: tiles[k] + 0.5,
                        y: tiles[k + 1] + 0.5,
                    });
                }
            }
            for (const [sound, group] of groups) {
                let x = 0;
                let y = 0;
                for (let i = 0; i < group.length; i += 2) {
                    x += group[i] + 0.5;
                    y += group[i + 1] + 0.5;
                }
                const count = group.length / 2;
                this.emit({ type: "impact", sound, x: x / count, y: y / count });
            }
        }
        // The camera shakes when it happens close by: a slab coming up beside a player, a tile
        // going near one. The client leaves it out if Settings say so.
        if (def.shake) {
            this.shakeNear(rose, FLOOR_SLAM_SHAKE_REACH, def.shake.slam);
            this.shakeNear(fell, FLOOR_DROP_SHAKE_REACH, def.shake.drop);
        }
        if (fell.length > 0 || back.length > 0) {
            // Enemies on a tile that's gone go to the nearest that isn't
            for (const enemy of this.enemies) {
                if (!enemy.dead && this.grid.isDropped(Math.floor(enemy.x), Math.floor(enemy.y))) {
                    const to = this.findFloorSpot(enemy.x, enemy.y, enemy.radius);
                    enemy.x = to.x;
                    enemy.y = to.y;
                }
            }
            // and the way round is worked out again, for what's gone and what's back
            const current = this.hero;
            for (const hero of this.heroes) {
                if (this.isUp(hero)) {
                    this.use(hero);
                    this.updateFlowField();
                }
            }
            this.use(current);
        }
        this.forEachHeroInReach(() => {
            const player = this.player;
            const tileX = Math.floor(player.x);
            const tileY = Math.floor(player.y);
            const shoved = this.hero.drag !== undefined && this.tick < this.hero.drag.endTick;
            if (this.grid.isDropped(tileX, tileY) && !shoved) {
                const to = this.findFloorSpot(player.x, player.y, player.radius);
                const ticks = Math.max(1, secondsToTicks(def.drop.shove));
                this.hero.drag = {
                    fromX: player.x,
                    fromY: player.y,
                    toX: to.x,
                    toY: to.y,
                    startTick: this.tick,
                    endTick: this.tick + ticks,
                    holdEnd: this.tick + ticks,
                };
                player.frozen = Math.max(player.frozen, ticks);
                this.hitByFloor(def.drop.damage, def.drop.sound, true);
            } else if (!shoved && floor.isHurting(tileX, tileY, this.tick)) {
                this.hitByFloor(def.slam.damage, def.slam.sound, false);
            }
        });
        // Pressure plates (FloorDef.triggers): what players have stepped onto
        if (floor.layout.triggerNames.length > 0) {
            const tiles: number[] = [];
            for (const hero of this.heroes) {
                if (this.isUp(hero)) {
                    tiles.push(Math.floor(hero.player.x), Math.floor(hero.player.y));
                }
            }
            for (const message of floor.press(tiles, this.tick, origin)) {
                this.emit({ type: "notice", message });
            }
        }
        if (floor.hasEffects) {
            this.stepFloorEffects(floor);
        }
    }

    // Who the floor's aimed at (a ripple "at the player", a dropUnder): the hero, or in co-op the
    // one nearest its middle
    private floorTarget(): Hero {
        const floor = this.floor!;
        return this.heroes.length > 1
            ? this.nearestHero(floor.x0 + floor.sizeX / 2, floor.y0 + floor.sizeY / 2)
            : this.hero;
    }

    // Whether a fragile tile rising (tiles' k-th) is nearer giving way, but not gone yet
    private isCracking(tiles: number[], k: number): boolean {
        const floor = this.floor!;
        const i = floor.index(tiles[k], tiles[k + 1]);
        return floor.layout.type[i] === TYPE_FRAGILE && floor.dropWarnAt[i] === -1;
    }

    // Something done to the floor (FloorActionDef), from a boss's attack (BossAttackDef.floor) or
    // anything else: dropping the tile under someone, starting a pattern, a phase. at is who it's
    // aimed at (the floor's target when unset). Nothing on a map with no floor.
    floorAct(action: FloorActionDef, at?: { x: number; y: number }): void {
        const floor = this.floor;
        if (!floor) {
            return;
        }
        floor.act(action, this.tick, () => at ?? this.floorTarget().player);
    }

    // The floor's tiles that do something to whoever's on them (FloorEffect): burning and healing
    // players every so often, and burning enemies
    private stepFloorEffects(floor: ArenaFloor): void {
        const tuning = floor.def.tileEffects;
        const burn = tuning?.burn;
        const heal = tuning?.heal;
        const burnEvery = Math.max(1, secondsToTicks(burn?.every ?? FLOOR_BURN_EVERY));
        const healEvery = Math.max(1, secondsToTicks(heal?.every ?? FLOOR_HEAL_EVERY));
        this.forEachHeroInReach(() => {
            const player = this.player;
            const effect = floor.effectAt(Math.floor(player.x), Math.floor(player.y), this.tick);
            if (
                (effect !== EFFECT_BURN && effect !== EFFECT_HEAL) ||
                this.tick < this.hero.floorEffectNext
            ) {
                return;
            }
            if (effect === EFFECT_BURN) {
                this.hero.floorEffectNext = this.tick + burnEvery;
                const share = burn?.damage ?? FLOOR_BURN_DAMAGE;
                const damage = Math.max(1, Math.round(player.maxHp * share));
                this.damagePlayer(damage, FLOOR_SOURCE, false, -1, true, false);
            } else if (player.hp < player.maxHp) {
                this.hero.floorEffectNext = this.tick + healEvery;
                this.heal(
                    Math.max(1, Math.round(player.maxHp * (heal?.amount ?? FLOOR_HEAL_AMOUNT))),
                );
            }
        });
        // Enemies burn on the floor's own beat
        if (this.tick % burnEvery === 0) {
            const damage = burn?.enemyDamage ?? FLOOR_BURN_ENEMY;
            for (const enemy of this.enemies) {
                if (
                    !enemy.dead &&
                    !enemy.def.flies &&
                    floor.effectAt(Math.floor(enemy.x), Math.floor(enemy.y), this.tick) ===
                        EFFECT_BURN
                ) {
                    this.damageSource = "other";
                    this.damageEnemy(enemy, damage, 0, enemy.x, enemy.y, 0);
                }
            }
        }
    }

    // How a floor's tile moves the player on it (FloorEffect haste, slow and ice), or nothing
    private floorMovement(): MovementRules["floor"] {
        const floor = this.floor!;
        const player = this.player;
        const effect = floor.effectAt(Math.floor(player.x), Math.floor(player.y), this.tick);
        if (effect === EFFECT_ICE) {
            const grip = floor.def.tileEffects?.ice?.grip ?? FLOOR_ICE_GRIP;
            return { pace: 1, glide: { x: this.hero.glideX, y: this.hero.glideY, grip } };
        }
        const pace = this.floorPace(player.x, player.y);
        return pace !== 1 ? { pace } : undefined;
    }

    // Faster or slower on a floor's tile (FloorEffect haste, slow), 1 elsewhere
    private floorPace(x: number, y: number): number {
        const floor = this.floor!;
        const effect = floor.effectAt(Math.floor(x), Math.floor(y), this.tick);
        const tuning = floor.def.tileEffects;
        return effect === EFFECT_HASTE
            ? 1 + (tuning?.haste ?? FLOOR_HASTE)
            : effect === EFFECT_SLOW
              ? 1 - (tuning?.slow ?? FLOOR_SLOW)
              : 1;
    }

    // One shake for the first of these tiles (x then y) within reach of a hero who's up
    private shakeNear(tiles: number[], reach: number, shake: number): void {
        for (let i = 0; i < tiles.length; i += 2) {
            const x = tiles[i] + 0.5;
            const y = tiles[i + 1] + 0.5;
            for (const hero of this.heroes) {
                const { player } = hero;
                if (this.isUp(hero) && fm.hypot(player.x - x, player.y - y) <= reach) {
                    this.emit({ type: "bossImpact", x, y, shake });
                    return;
                }
            }
        }
    }

    // A share of the player's hitpoints, armour or not; a fall always lands, a slab not again
    // until the grace is up
    private hitByFloor(share: number, sound: number, fall: boolean): void {
        const hero = this.hero;
        if (!fall && this.tick < hero.floorGraceEnd) {
            return;
        }
        hero.floorGraceEnd = this.tick + secondsToTicks(this.map.floor!.slam.grace);
        const damage = Math.max(1, Math.round(hero.player.maxHp * share));
        this.damagePlayer(damage, FLOOR_SOURCE, false, sound, true);
    }

    // The nearest tile middle a circle can stand on with the floor whole under it and not going
    private findFloorSpot(x: number, y: number, radius: number): { x: number; y: number } {
        const floor = this.floor!;
        return findFreeSpot(
            this.grid,
            x,
            y,
            radius,
            (tileX, tileY) => !floor.isFalling(tileX, tileY, this.tick),
        );
    }

    private stepHold(): void {
        this.forEachHeroInReach(() => {
            const hold = this.hold;
            if (!hold) {
                return;
            }
            if (this.tick >= hold.endTick || hold.enemies.every((enemy) => enemy.dead)) {
                this.hold = undefined;
                return;
            }
            this.player.frozen = Math.max(this.player.frozen, 2);
        });
    }

    private stepEmitters(): void {
        const emitters = this.emitters;
        if (emitters.length === 0) {
            return;
        }
        let spent = false;
        for (const emitter of emitters) {
            if (this.tick < emitter.nextTick) {
                continue;
            }
            const boss = this.enemies.find((e) => e.uid === emitter.enemyUid);
            if (!boss || boss.dead) {
                emitter.volleysLeft = 0;
                spent = true;
                continue;
            }
            this.fireVolley(emitter, boss);
            emitter.volleysLeft--;
            const pattern = emitter.attack.pattern!;
            // A pause after each burst's last volley (BulletPatternDef.burst)
            const burst = pattern.burst;
            const fired = pattern.volleys - emitter.volleysLeft;
            const pause = burst && fired % burst.count === 0 ? burst.pause : 0;
            emitter.nextTick = this.tick + secondsToTicks(pattern.interval + pause);
            spent ||= emitter.volleysLeft <= 0;
        }
        if (spent) {
            this.emitters = emitters.filter((emitter) => emitter.volleysLeft > 0);
        }
    }

    private stepBullets(): void {
        const bullets = this.bullets;
        if (bullets.count === 0) {
            return;
        }
        // Each hero by index, one out of reach (down, or gone) spared
        const targets = this.bulletTargets;
        for (const hero of this.heroes) {
            (targets[hero.index] ??= { x: 0, y: 0, radius: 0, spare: true }).spare = true;
        }
        this.forEachHeroInReach(() => {
            const player = this.player;
            const target = targets[this.hero.index];
            target.x = player.x;
            target.y = player.y;
            target.radius = player.radius;
            target.spare = this.tick < this.bulletGraceEnd || this.reviving;
        });
        bullets.step(targets);
        this.boltsOnBosses();
        const current = this.hero;
        bullets.hits.forEach((hit, i) => {
            if (hit === -1 || this.runOver) {
                return;
            }
            this.use(this.heroes[i]);
            // A bullet in the air keeps its source's slot (freeBulletSources)
            const { attack, enemy } = this.bulletSources[bullets.source[hit]]!;
            this.bulletGraceEnd =
                this.tick + secondsToTicks(enemy.def.boss?.bulletGrace ?? BULLET_GRACE);
            this.bossHit(enemy.def.id, enemy, attack, bullets.damage[hit]);
            // Knocked on the way it was going (BulletPatternDef.knockback)
            const knock = attack.pattern?.knockback;
            if (knock && !this.runOver && this.isUp(this.hero)) {
                const vx = bullets.vx[hit];
                const vy = bullets.vy[hit];
                const length = Math.max(0.0001, fm.hypot(vx, vy));
                const player = this.player;
                moveCircle(
                    this.grid,
                    player,
                    (vx / length) * knock,
                    (vy / length) * knock,
                    player.radius,
                );
            }
        });
        this.use(current);
    }

    // Bolts that turn on their own boss (BossAttackDef.turns), stopping where they reach it
    private boltsOnBosses(): void {
        const bullets = this.bullets;
        const sources = this.bulletSources;
        let turning = false;
        for (const source of sources) {
            turning ||= source?.attack.turns !== undefined;
        }
        if (!turning) {
            return;
        }
        for (let i = bullets.count - 1; i >= 0; i--) {
            const slot = bullets.order[i];
            const source = sources[bullets.source[slot]];
            const boss = source?.enemy;
            if (!source?.attack.turns || !boss || boss.dead) {
                continue;
            }
            const dx = boss.x - bullets.x[slot];
            const dy = boss.y - bullets.y[slot];
            const reach = bullets.radius[slot] + boss.radius;
            if (dx * dx + dy * dy <= reach * reach) {
                bullets.remove(i);
                this.turnOnBoss(boss, source.attack);
            }
        }
    }

    private stepHazards(): void {
        const hazards = this.hazards;
        if (hazards.length === 0) {
            return;
        }
        const tick = this.tick;
        let spent = false;
        // However many land on someone, it's the one hit (by hero)
        const landed: boolean[] = [];
        for (const hazard of hazards) {
            if (hazard.lingerEnd !== -1) {
                // An exhumed: smothered, or healing its boss as it goes
                const smother = hazard.attack.ground?.smother;
                if (smother) {
                    spent = this.stepExhumed(hazard, smother) || spent;
                    continue;
                }
                // On the ground, hurting whoever stands in it now and then
                if (tick >= hazard.lingerEnd) {
                    hazard.endTick = -1;
                    spent = true;
                } else if (tick >= hazard.nextHurt) {
                    const lingers = hazard.attack.ground!.lingers!;
                    hazard.nextHurt = tick + secondsToTicks(lingers.interval);
                    this.landHazard(hazard, landed, false, true, lingers.damage);
                    if (this.runOver) {
                        return;
                    }
                }
                continue;
            }
            if (hazard.armed && hazard.fuseTick === -1) {
                // Waiting to be walked into, by anyone, until it gives up
                if (tick >= hazard.endTick) {
                    hazard.endTick = -1;
                    spent = true;
                } else if (tick >= hazard.landTick) {
                    let walkedInto = false;
                    this.forEachHeroInReach(() => {
                        const player = this.player;
                        walkedInto ||=
                            fm.hypot(player.x - hazard.x, player.y - hazard.y) <=
                            hazard.radius + player.radius;
                    });
                    if (walkedInto) {
                        hazard.fuseTick = tick + HAZARD_FUSE_TICKS;
                    }
                }
                continue;
            }
            if (tick < (hazard.armed ? hazard.fuseTick : hazard.landTick)) {
                continue;
            }
            if (hazard.grabEnd !== 0) {
                // Up for a while once it's landed, and hurting anyone who steps
                // in meanwhile, once each
                if (tick >= hazard.grabEnd) {
                    hazard.endTick = -1;
                    spent = true;
                    continue;
                }
                // What comes up starts as it lands, and hurts once it's in sight
                const up = hazard.attack.ground!.grab!.up;
                this.landHazard(
                    hazard,
                    landed,
                    tick === hazard.landTick,
                    tick >= hazard.landTick + secondsToTicks(up.from),
                );
            } else {
                const lingers = hazard.attack.ground?.lingers;
                if (lingers) {
                    hazard.lingerEnd = tick + secondsToTicks(lingers.seconds);
                    hazard.endTick = hazard.lingerEnd;
                    hazard.nextHurt = tick + secondsToTicks(lingers.interval);
                } else {
                    hazard.endTick = -1;
                    spent = true;
                }
                this.landHazard(hazard, landed, true);
                // Into empty floor: its boss's guard's down (BossDef.guard). Only when nothing
                // else landed on anyone this tick, so a mark that missed beside one that hit
                // doesn't count
                const opens = hazard.attack.opens;
                if (
                    opens !== undefined &&
                    !lingers &&
                    hazard.hit.length === 0 &&
                    !landed.some(Boolean)
                ) {
                    const boss = this.enemies.find((e) => e.uid === hazard.enemyUid);
                    if (boss) {
                        this.dropGuard(boss, opens, false, hazard.attack.name);
                    }
                }
            }
            if (this.runOver) {
                return;
            }
        }
        if (spent) {
            this.hazards = this.hazards.filter((hazard) => hazard.endTick !== -1);
        }
    }

    // landed: the heroes something's landed on this tick, by index, who it
    // passes by; it adds whoever it hits
    // show: what's shown as it lands, the first time it does (not again while it
    // lingers); hit: whether it hurts this tick (a grab's hands, only once
    // they're up); share: of its damage
    private landHazard(
        hazard: GroundHazard,
        landed: boolean[],
        show: boolean,
        hit = true,
        share = 1,
    ): void {
        const { attack, x, y, radius } = hazard;
        const grab = attack.ground?.grab;
        if (show && attack.impact) {
            // Its spot animations at every mark, and one shake and flash for all that land at once
            const first = this.impactTick !== this.tick;
            this.impactTick = this.tick;
            this.showImpact(first ? attack.impact : { spots: attack.impact.spots }, x, y);
        }
        // Struck under its own boss's middle (BossAttackDef.turns)
        if (show && hit && attack.turns) {
            const boss = this.enemies.find((e) => e.uid === hazard.enemyUid);
            const ground = attack.ground;
            const half = ground?.round ? undefined : hazard.half;
            const reach = hazard.half && !half ? hazard.radius * (ground?.fit ?? 1) : radius;
            if (
                boss &&
                !boss.dead &&
                (half
                    ? Math.abs(boss.x - x) <= half && Math.abs(boss.y - y) <= half
                    : fm.hypot(boss.x - x, boss.y - y) <= reach)
            ) {
                this.turnOnBoss(boss, attack);
            }
        }
        if (!show) {
            // Nothing to show again
        } else if (attack.impactSpotAnim !== undefined) {
            this.addEffect(attack.impactSpotAnim, x, y, 0, 40);
        } else if (grab && attack.ground?.middleSpotAnim !== undefined) {
            // What was in the middle of the mark comes up in full, as big as it
            const effect = this.addEffect(
                attack.ground.middleSpotAnim,
                x,
                y,
                0,
                secondsToTicks(grab.seconds),
            );
            if (effect) {
                effect.fitRadius = radius * grab.fit;
            }
        } else if (!attack.ground?.spotAnim) {
            this.emit({ type: "bossSwing", x, y, radius });
        }
        if (!hit) {
            return;
        }
        // A square's drawn circle, when that's what hurts (GroundPatternDef.round)
        const half = attack.ground?.round ? undefined : hazard.half;
        const reach = hazard.half && !half ? hazard.radius * (attack.ground?.fit ?? 1) : radius;
        this.forEachHeroInReach(() => {
            const player = this.player;
            const index = this.hero.index;
            if (
                this.runOver ||
                (half
                    ? !circleInBox(player.x, player.y, player.radius, x, y, half, half)
                    : fm.hypot(player.x - x, player.y - y) > reach + player.radius) ||
                landed[index] ||
                hazard.hit.includes(index)
            ) {
                return;
            }
            landed[index] = true;
            // A grab's hands hurt each player once; a lingering mark hurts
            // whoever's in it every time it comes round (GroundPatternDef.lingers)
            if (hazard.lingerEnd === -1) {
                hazard.hit.push(index);
            }
            const enemy = this.enemies.find((e) => e.uid === hazard.enemyUid);
            if (hazard.damage > 0) {
                // A full share (every map but the raid's) passes the damage through as it was
                const damage =
                    share === 1 ? hazard.damage : Math.max(1, Math.round(hazard.damage * share));
                this.bossHit(hazard.enemyId, enemy, attack, damage, false);
            } else if (attack.effect && !this.reviving) {
                this.applyPlayerEffect(attack.effect, enemy);
            }
        });
    }

    private stepQuarters(): void {
        const quarters = this.quarters;
        if (!quarters) {
            return;
        }
        const tick = this.tick;
        if (tick >= quarters.endTick) {
            this.quarters = undefined;
            return;
        }
        if (tick < quarters.nextHurt) {
            return;
        }
        const def = quarters.attack.quarters!;
        quarters.nextHurt = tick + secondsToTicks(def.interval);
        // Everyone outside the safe quarter is hit, and her shield's fed
        // once if anyone was
        const enemy = this.enemies.find((e) => e.uid === quarters.enemyUid);
        let fed = false;
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (
                this.runOver ||
                quarterOf(quarters.x, quarters.y, player.x, player.y) === quarters.safe
            ) {
                return;
            }
            this.bossHit(enemy?.def.id ?? "", enemy, quarters.attack, quarters.damage, false);
            fed = true;
        });
        const phase = enemy?.bossState?.phase;
        if (fed && phase?.stage === "shield") {
            phase.shield = Math.min(
                phase.shieldMax,
                phase.shield + Math.round(phase.shieldMax * def.heal),
            );
        }
    }

    // Where the players still up are, on average (the player, on your own)
    private partyMiddle(): { x: number; y: number } {
        if (this.heroes.length === 1) {
            return this.player;
        }
        let x = 0;
        let y = 0;
        let count = 0;
        this.forEachHeroInReach(() => {
            x += this.player.x;
            y += this.player.y;
            count++;
        });
        return count > 0 ? { x: x / count, y: y / count } : this.player;
    }

    // Out it comes for a big hit, and stays to feed the boss. An antidote
    // weakens it first.
    private stepParasite(): void {
        this.forEachHeroInReach(() => {
            const parasite = this.parasite;
            if (!parasite || this.tick < parasite.burstTick || this.runOver) {
                return;
            }
            this.parasite = undefined;
            const def = parasite.attack.parasite!;
            const player = this.player;
            const boss = this.enemies.find((e) => e.uid === parasite.enemyUid);
            const weak = this.cured;
            const damage = parasite.damage * (weak ? 0.5 : 1);
            this.bossHit(boss?.def.id ?? "", boss, parasite.attack, damage);
            if (this.runOver) {
                return;
            }
            const out = this.spawnNear(
                player,
                getEnemy(weak ? def.weakEnemyId : def.enemyId),
                SUMMON_BESIDE,
                0,
                1,
                6,
            );
            if (out) {
                out.noDrops = true;
            }
        });
    }

    // Walking to the boss, through anything in its way
    private stepWalker(enemy: Enemy, boss: Enemy): void {
        if (boss.dead) {
            this.vanish(enemy);
            return;
        }
        if (enemy.frozen > 0) {
            enemy.frozen--;
            return;
        }
        const dx = boss.x - enemy.x;
        const dy = boss.y - enemy.y;
        const distance = fm.hypot(dx, dy);
        if (distance <= ABSORB_REACH) {
            const walkers = boss.bossState?.walkers;
            if (walkers) {
                walkers.absorbed++;
            }
            this.vanish(enemy);
            return;
        }
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        enemy.yaw = yawFromVector(dx, dy);
    }

    // Ba-Ba's cracked boulder, rolling on with its row: whoever it runs into is hurt and knocked
    // back, as by the rest of the row
    private stepRoller(enemy: Enemy, rolls: NonNullable<Enemy["rolls"]>): void {
        if (this.tick >= rolls.endTick) {
            this.vanish(enemy);
            return;
        }
        enemy.x += rolls.vx;
        enemy.y += rolls.vy;
        const boss = this.enemies.find((e) => e.uid === rolls.bossUid);
        if (!boss || this.tick < this.bulletGraceEnd) {
            return;
        }
        const length = Math.max(0.0001, fm.hypot(rolls.vx, rolls.vy));
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (
                this.runOver ||
                fm.hypot(player.x - enemy.x, player.y - enemy.y) > enemy.radius + player.radius
            ) {
                return;
            }
            this.bulletGraceEnd =
                this.tick + secondsToTicks(boss.def.boss?.bulletGrace ?? BULLET_GRACE);
            this.bossHit(boss.def.id, boss, rolls.attack, rolls.damage);
            if (rolls.knockback > 0 && !this.runOver && this.isUp(this.hero)) {
                const knock = rolls.knockback / length;
                moveCircle(this.grid, player, rolls.vx * knock, rolls.vy * knock, player.radius);
            }
        });
    }

    // One of Ba-Ba's baboons making for a sarcophagus: there, it opens it and is gone
    private stepSeeker(enemy: Enemy, index: number): void {
        const at = this.tombsSarcophagi[index];
        if (!at) {
            enemy.seeks = undefined;
            return;
        }
        if (enemy.frozen > 0) {
            enemy.frozen--;
            return;
        }
        const dx = at.x - enemy.x;
        const dy = at.y - enemy.y;
        const distance = fm.hypot(dx, dy);
        if (distance <= SARCOPHAGI.reach + enemy.radius) {
            // Prying it open, a while to kill it in
            if (enemy.pryEnd === undefined) {
                enemy.pryEnd = this.tick + secondsToTicks(SARCOPHAGI.prying);
                enemy.anim = "attack";
                enemy.animStart = this.tick;
                enemy.yaw = yawFromVector(dx, dy);
                this.emit({ type: "notice", message: "A baboon is prying open a sarcophagus!" });
            }
            if (this.tick < enemy.pryEnd) {
                return;
            }
            if (this.tick >= at.openUntil) {
                at.nextTick = this.tick;
            }
            at.openUntil = this.tick + secondsToTicks(SARCOPHAGI.seconds);
            this.emit({ type: "notice", message: "A baboon opens a sarcophagus!" });
            this.vanish(enemy);
            return;
        }
        moveCircle(
            this.grid,
            enemy,
            (dx / distance) * enemy.speed,
            (dy / distance) * enemy.speed,
            enemy.radius,
        );
        enemy.yaw = yawFromVector(dx, dy);
    }

    // The nearest of the arena's sarcophagi, a closed one if there's one left: where a baboon
    // Ba-Ba calls makes for
    private nearestSarcophagus(x: number, y: number): number {
        let best = -1;
        let bestScore = Infinity;
        this.tombsSarcophagi.forEach((at, i) => {
            const open = this.tick < at.openUntil ? 1000 : 0;
            const score = fm.hypot(at.x - x, at.y - y) + open;
            if (score < bestScore) {
                bestScore = score;
                best = i;
            }
        });
        return best;
    }

    // Open sarcophagi fire across the arena, a fan of blasts every so often
    private stepSarcophagi(boss: Enemy): void {
        const middle = this.tombsPathRoom?.boss?.boulders?.altar.x ?? boss.x;
        let attack: BossAttackDef | undefined;
        for (const at of this.tombsSarcophagi) {
            if (this.tick >= at.openUntil || this.tick < at.nextTick) {
                continue;
            }
            at.nextTick = this.tick + secondsToTicks(SARCOPHAGI.every);
            attack ??= this.invokedAttack(SARCOPHAGUS_BLAST);
            const source = this.bulletSourceFor(boss, attack);
            const damage = this.getBossDamage(boss, attack);
            const speed = SARCOPHAGI.speed / TICKS_PER_SECOND;
            const life = Math.ceil(SARCOPHAGI.range / speed);
            const aim = middle > at.x ? 0 : Math.PI;
            for (let i = 0; i < SARCOPHAGI.count; i++) {
                const angle = aim + (i / (SARCOPHAGI.count - 1) - 0.5) * SARCOPHAGI.arc;
                this.bullets.add(
                    at.x + fm.cos(angle) * 0.8,
                    at.y + fm.sin(angle) * 0.8,
                    fm.cos(angle) * speed,
                    fm.sin(angle) * speed,
                    0,
                    SARCOPHAGI.radius,
                    damage,
                    life,
                    source,
                    this.tick,
                );
            }
        }
    }

    // True while there's still some on their way. With the last of them gone
    // the boss lets out what it took in, which can't be dodged.
    private stepWalkers(boss: Enemy, walkers: BossWalkers): boolean {
        if (walkers.enemies.some((enemy) => !enemy.dead)) {
            // Channelling them in, its guard stays down (BossAttackDef.channel)
            if (walkers.attack.channel) {
                const state = boss.bossState!;
                state.exposedEnd = Math.max(state.exposedEnd ?? 0, this.tick + 2);
            }
            return true;
        }
        boss.bossState!.walkers = undefined;
        const attack = walkers.attack;
        const damage = (attack.damage + walkers.absorbed * walkers.perAbsorbed) * boss.damageScale;
        this.emit({
            type: "bossAbsorbBlast",
            x: boss.x,
            y: boss.y,
            absorbed: walkers.absorbed,
        });
        // On the whole party
        this.forEachHeroInReach(() => this.bossHit(boss.def.id, boss, attack, damage));
        return false;
    }

    // ---- Bosses ----

    // Picks an attack once the last one is done (among those the player is in
    // range of), winds it up, then lands or fires it
    // BossDef.naps: true while it's down, and so doing nothing else
    private stepNap(enemy: Enemy, naps: NonNullable<BossDef["naps"]>): boolean {
        const state = enemy.bossState!;
        state.nextNap ??= this.tick + secondsToTicks(naps.every);
        if (state.napEnd !== undefined && state.napEnd !== -1) {
            if (this.tick < state.napEnd) {
                return true;
            }
            // Up again, with a stomp
            state.napEnd = -1;
            state.nextNap = this.tick + secondsToTicks(naps.every);
            enemy.attackCooldown = 0;
            this.emit({ type: "notice", message: naps.wakeMessage });
            const wake = enemy.def.boss!.attacks.find((a) => a.name === naps.wake);
            if (wake) {
                this.startBossAttack(enemy, wake);
            }
            return true;
        }
        if (this.tick < state.nextNap) {
            return false;
        }
        // Not while his volleys are still coming (a swarm's three rings): he goes down once
        // they're out, starting nothing new meanwhile, so the whole nap is there to reach him
        if (this.emitters.some((emitter) => emitter.enemyUid === enemy.uid && !emitter.ambient)) {
            return true;
        }
        state.napEnd = this.tick + secondsToTicks(naps.seconds);
        enemy.vx = enemy.vy = 0;
        enemy.anim = "attack";
        enemy.attackSeq = naps.seq;
        enemy.animStart = this.tick;
        this.emit({ type: "notice", message: naps.message });
        return true;
    }

    // BossDef.naps: down right now (the bot walks up to it then)
    isNapping(enemy: Enemy): boolean {
        const napEnd = enemy.bossState?.napEnd;
        return napEnd !== undefined && napEnd !== -1 && this.tick < napEnd;
    }

    private stepBoss(enemy: Enemy, distance: number): void {
        const state = enemy.bossState!;
        const def = enemy.def.boss!;
        // A fight in phases gets harder by the phase instead
        const enrageAt = def.enrage.at ?? (this.hard ? HARD_ENRAGE_AT : ENRAGE_AT);
        if (!def.phases && !state.enraged && enemy.hp <= enemy.maxHp * enrageAt) {
            this.enrage(enemy);
        }
        this.callSummons(enemy, false);
        this.stepOrdeal(enemy);
        this.stepStomp(enemy);
        for (let i = 0; i < state.cooldowns.length; i++) {
            if (state.cooldowns[i] > 0) {
                state.cooldowns[i]--;
            }
        }
        const phase = state.phase;
        if (phase) {
            // The arena's rhythms keep going whatever it's doing
            this.stepCycles(enemy, phase);
            if (this.runOver) {
                return;
            }
            // Kneeling at a threshold, it does nothing at all
            if (this.stepThreshold(enemy, phase)) {
                return;
            }
            this.stepPhase(enemy, phase);
            if (enemy.dead) {
                return;
            }
        }
        // Carried on by its lunge, and then stunned, it does nothing else (BossDef.guard)
        if (state.dash) {
            this.stepDash(enemy, state.dash);
            return;
        }
        if (this.isStunned(enemy)) {
            return;
        }
        if (state.surge) {
            this.stepSurge(enemy, state.surge);
            return;
        }
        if (state.leap) {
            this.stepLeap(enemy, state.leap);
            return;
        }
        // Its sleepwalkers walk in while it does nothing else, except in a
        // finale, where its claws keep coming as they do
        if (state.walkers && this.stepWalkers(enemy, state.walkers) && phase?.stage !== "finale") {
            return;
        }
        if (def.naps && !state.windup && this.stepNap(enemy, def.naps)) {
            return;
        }
        this.stepColours(enemy);
        this.stepStare(enemy);
        const windup = state.windup;
        if (windup) {
            this.trackLine(enemy, windup);
            if (this.tick >= windup.landTick) {
                state.windup = undefined;
                this.landBossAttack(enemy, windup);
            }
            return;
        }
        // Not between a chain's links or before what follows: a charge ends at
        // the far edge and the next lane's picked from there, and a leash
        // meanwhile would have it sink, come up by the player and snap back
        if (def.leash && distance > def.leash.distance && !state.chain && !state.follow) {
            this.leashBoss(enemy, def.leash);
        }
        // The same again, straight after (BossAttackDef.chain)
        const chain = state.chain;
        if (chain && this.tick >= state.channelEnd) {
            chain.left--;
            if (chain.left <= 0) {
                state.chain = undefined;
            }
            // Straight on to the next link, and the usual rest after the last
            this.startBossAttack(
                enemy,
                chain.attack,
                chain.attack.chain!.windup,
                chain.left > 0 ? 0 : undefined,
            );
            return;
        }
        // What follows an attack comes at its time, through whatever's still
        // in the air (BossAttackDef.follow), though not while the player's held
        const follow = state.follow;
        if (follow) {
            if (this.tick >= follow.atTick && !this.hold) {
                state.follow = undefined;
                const next = follow.attack;
                state.chain = next.chain ? { attack: next, left: next.chain.times } : undefined;
                this.startBossAttack(enemy, next);
            }
            return;
        }
        // It holds off while the player can't move, and what's fired can land
        if (enemy.attackCooldown > 0 || this.hold || this.tick < state.channelEnd) {
            return;
        }
        // An ordeal's first, then a phase's (BossOrdealDef.opener, BossPhasesDef opener)
        const ordeal = state.ordeal;
        if (ordeal?.opener) {
            const first = ordeal.opener;
            ordeal.opener = undefined;
            this.startBossAttack(enemy, first);
            return;
        }
        // Not while an ordeal's on (Ba-Ba's phases change a tick before her rolling stones): it
        // waits for the ordeal's end
        const opener = state.ordeal ? undefined : phase?.opener;
        if (opener) {
            phase!.opener = undefined;
            this.startBossAttack(enemy, opener);
            return;
        }
        // Among its flowers, or in its finale, it keeps to the attacks they
        // call for (QuartersDef.during, BossPhasesDef.finale)
        const during = this.keepsTo(enemy);
        if (during) {
            const choices = during.attacks
                .map((name) => def.attacks.find((a) => a.name === name))
                .filter((a): a is BossAttackDef => a !== undefined);
            if (choices.length > 0) {
                const attack = choices[this.rng.int(choices.length)];
                state.chain = attack.chain ? { attack, left: attack.chain.times } : undefined;
                this.startBossAttack(enemy, attack, undefined, during.interval);
                return;
            }
        }
        const akkha = this.tombsAkkha;
        const orbAttacks =
            akkha?.uid === enemy.uid && this.tick < akkha.orbsUntil
                ? def.akkha?.orbAttacks
                : undefined;
        const usable: number[] = [];
        def.attacks.forEach((attack, i) => {
            if (
                state.cooldowns[i] === 0 &&
                distance <= attack.range &&
                distance >= (attack.minRange ?? 0) &&
                (!attack.enraged || state.enraged) &&
                (!attack.expert || this.expert) &&
                (!attack.phases || !phase || attack.phases.includes(phase.index + 1)) &&
                !(attack.parasite && this.parasite) &&
                // Some only with an invocation on (BossAttackDef.onlyWith)
                (!attack.onlyWith || this.invoked(attack.onlyWith)) &&
                // Not into the obelisk's special (BossAttackDef.clearOfObelisk)
                (attack.clearOfObelisk === undefined ||
                    !this.obeliskStrikesWithin(attack.clearOfObelisk + attack.windup)) &&
                // Akkha's orbs out: only what one step answers (AkkhaDef.orbAttacks)
                (!orbAttacks || orbAttacks.includes(attack.name)) &&
                // Some only in its shadow realm, exhumes or yellows (BossAttackDef.ordeal)
                !attack.ordeal &&
                // No more of expert's own while an ordeal waits for one to land (stepOrdeal)
                !(attack.expert && state.ordealHeld)
            ) {
                usable.push(i);
            }
        });
        if (usable.length === 0) {
            return;
        }
        const pick = this.rng.weightedIndex(usable.map((i) => def.attacks[i].weight));
        // Only ones used by name (weight 0) to hand
        if (pick === -1) {
            return;
        }
        const index = usable[pick];
        const attack = def.attacks[index];
        state.cooldowns[index] = Math.round(attack.cooldown * TICKS_PER_SECOND);
        // Its chain as its invocation makes it (BossAttackDef.invoked times)
        const invoked = this.invokedAttack(attack);
        state.chain = invoked.chain ? { attack: invoked, left: invoked.chain.times } : undefined;
        this.startBossAttack(enemy, attack);
    }

    // Sotetseg's shadow realm, Xarpus's exhumes and Verzik's yellows (BossDef.shadowRealm, exhumes,
    // yellows): past each of their shares of its hitpoints, it can't be hurt for a while, doing
    // only what they call for
    private stepOrdeal(enemy: Enemy): void {
        const state = enemy.bossState!;
        const def = enemy.def.boss!;
        const realm = def.shadowRealm ?? def.yellows ?? def.rollingStones;
        const exhumes = def.exhumes;
        const of = realm ?? exhumes;
        if (!of) {
            return;
        }
        state.ordealHeld = undefined;
        const ordeal = state.ordeal;
        if (ordeal) {
            // Ba-Ba's boulders: over once someone's got back up to her, and the pit's open meanwhile
            const reached = def.rollingStones !== undefined && this.stepRollingStones(enemy);
            if (this.tick < ordeal.endTick && ordeal.left !== 0 && !reached) {
                // Held to its end, however a tick goes (a boss can skip stepBoss on a jump)
                enemy.shieldEnd = Math.max(enemy.shieldEnd, ordeal.endTick);
                return;
            }
            state.ordeal = undefined;
            // Its own shield drops, not one that outlasts it (a jump's)
            if (enemy.shieldEnd <= ordeal.endTick) {
                enemy.shieldEnd = 0;
            }
            // Out of time with exhumeds still up: he rises the better for each
            if (exhumes && ordeal.left > 0) {
                const heal = Math.round(enemy.maxHp * exhumes.leftHeal * ordeal.left);
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
                // Seen going to him from each still up
                for (const hazard of this.hazards) {
                    const healSpotAnim = hazard.attack.ground?.smother?.healSpotAnim;
                    if (
                        hazard.enemyUid === enemy.uid &&
                        hazard.endTick !== -1 &&
                        healSpotAnim !== undefined
                    ) {
                        this.addEffect(healSpotAnim, hazard.x, hazard.y, 0, 40);
                    }
                }
            }
            // What's left of its exhumeds sinks with it
            this.hazards = this.hazards.filter(
                (hazard) => hazard.enemyUid !== enemy.uid || !hazard.attack.ground?.smother,
            );
            this.emit({ type: "notice", message: of.endMessage });
            return;
        }
        const done = state.ordealsDone ?? 0;
        if (done >= of.at.length || enemy.hp > enemy.maxHp * of.at[done]) {
            return;
        }
        // Not with expert's doom ball still coming: it and a yellow's pool at once is too much.
        // She can't be hurt meanwhile, so the wait can't take her past the next phase too and
        // skip it (kept a tick ahead, so the shield never lapses and drops with a notice). She
        // throws no more meanwhile (ordealHeld), or one ball after another could hold it off.
        if (this.enemyProjectiles.some((p) => p.enemyUid === enemy.uid && p.attack?.expert)) {
            enemy.shieldEnd = Math.max(enemy.shieldEnd, this.tick + 2);
            state.ordealHeld = true;
            return;
        }
        // One at a time, however far a hit took it past them
        let next = done + 1;
        while (next < of.at.length && enemy.hp <= enemy.maxHp * of.at[next]) {
            next++;
        }
        state.ordealsDone = next;
        state.ordeal = {
            endTick: this.tick + secondsToTicks(of.seconds),
            left: exhumes ? exhumes.count : -1,
            during: { attacks: of.attacks, interval: of.interval },
            opener: of.opener ? def.attacks.find((a) => a.name === of.opener) : undefined,
        };
        enemy.shieldEnd = Math.max(enemy.shieldEnd, state.ordeal.endTick);
        if (def.rollingStones) {
            this.startRollingStones(enemy);
        }
        this.emit({ type: "notice", message: of.message });
    }

    // Ba-Ba's rolling stones begin: up to her altar, the party down at the arena's foot
    private startRollingStones(enemy: Enemy): void {
        const at = this.tombsPathRoom?.boss?.boulders;
        if (!at) {
            return;
        }
        enemy.x = enemy.prevX = at.altar.x;
        enemy.y = enemy.prevY = at.altar.y;
        enemy.vx = enemy.vy = 0;
        enemy.bossState!.windup = undefined;
        enemy.bossState!.wallGap = undefined;
        const current = this.hero;
        this.heroes.forEach((hero, i) => {
            const player = hero.player;
            player.x = player.prevX = at.start.x + (i - (this.heroes.length - 1) / 2) * 1.5;
            player.y = player.prevY = at.start.y;
            this.use(hero);
            this.updateFlowField();
        });
        this.use(current);
    }

    // Each tick of her rolling stones: true once someone's back up to her
    private stepRollingStones(enemy: Enemy): boolean {
        // Up to her altar's rows, anywhere across: she's solid and stands in the middle, so the
        // way up the sides has to count too
        const altar = this.tombsPathRoom?.boss?.boulders?.altar;
        const reached = this.heroes.some((hero) => {
            const player = hero.player;
            if (!this.isUp(hero)) {
                return false;
            }
            if (altar) {
                return player.y >= altar.y - TOMBS_ALTAR_REACH;
            }
            const reach = enemy.radius + player.radius + 1;
            return fm.hypot(player.x - enemy.x, player.y - enemy.y) <= reach;
        });
        if (reached) {
            this.emit({ type: "notice", message: "You reach Ba-Ba! Her boulders stop." });
        }
        return reached;
    }

    // Mind the Gap's gap at the foot of Ba-Ba's arena, open while she's up
    get tombsPit(): { x0: number; x1: number; y0: number; y1: number } | undefined {
        const fight = this.tombsRoom?.boss;
        const pit = this.tombsPathRoom?.boss?.boulders?.pit;
        if (!fight || fight.uid === -1 || fight.beatenTick !== undefined || !pit) {
            return undefined;
        }
        return this.invoked("mind_the_gap") ? pit : undefined;
    }

    // An exhumed (GroundPatternDef.smother): stood in long enough, by anyone, it's smothered and
    // counts towards its boss's exhumes; left until it goes, it heals the boss. True once it's gone.
    private stepExhumed(
        hazard: GroundHazard,
        smother: NonNullable<GroundPatternDef["smother"]>,
    ): boolean {
        let on = false;
        this.forEachHeroInReach(() => {
            const player = this.player;
            on ||=
                fm.hypot(player.x - hazard.x, player.y - hazard.y) <= hazard.radius + player.radius;
        });
        if (on) {
            hazard.stood = (hazard.stood ?? 0) + 1;
        }
        const smothered = (hazard.stood ?? 0) >= secondsToTicks(smother.seconds);
        if (!smothered && this.tick < hazard.lingerEnd) {
            return false;
        }
        hazard.endTick = -1;
        const boss = this.enemies.find((e) => e.uid === hazard.enemyUid);
        if (smothered) {
            if (smother.smotheredSpotAnim !== undefined) {
                this.addEffect(smother.smotheredSpotAnim, hazard.x, hazard.y, 0, 40);
            }
            const ordeal = boss?.bossState?.ordeal;
            if (ordeal && ordeal.left > 0) {
                ordeal.left--;
            }
        } else if (boss && !boss.dead) {
            boss.hp = Math.min(boss.maxHp, boss.hp + Math.round(boss.maxHp * smother.heal));
            if (smother.healSpotAnim !== undefined) {
                this.addEffect(smother.healSpotAnim, hazard.x, hazard.y, 0, 40);
            }
        }
        return true;
    }

    // What a boss keeps to, standing where it is: the attacks the flowers it's
    // among call for, or its finale's
    private keepsTo(enemy: Enemy): QuartersDef["during"] | undefined {
        // In Sotetseg's shadow realm, or Xarpus's pool (BossDef.shadowRealm, exhumes)
        const ordeal = enemy.bossState?.ordeal;
        if (ordeal) {
            return ordeal.during;
        }
        const phase = enemy.bossState?.phase;
        if (phase?.stage === "finale") {
            return enemy.def.boss?.phases?.finale;
        }
        const quarters = this.quarters;
        if (!quarters || quarters.enemyUid !== enemy.uid || this.tick >= quarters.endTick) {
            return undefined;
        }
        return quarters.attack.quarters?.during;
    }

    // Starts winding an attack up. Everything it'll do to the ground is on the
    // ground from now on. windupSeconds and interval replace the attack's own
    // windup and the boss's interval after it (a chain's links, the flowers').
    private startBossAttack(
        enemy: Enemy,
        given: BossAttackDef,
        windupSeconds = given.windup,
        interval?: number,
    ): void {
        // The Tombs: as an invocation makes it (BossAttackDef.invoked)
        const attack = this.invokedAttack(given);
        const state = enemy.bossState!;
        const def = enemy.def.boss!;
        // Akkha's attacks, towards his next special
        if (def.akkha && !attack.ordeal && this.tombsAkkha?.uid === enemy.uid) {
            this.tombsAkkha.attacks++;
            this.akkhaKeepBack(enemy);
        }
        // Its windup runs from when it's there
        const middle = attack.toMiddle ? this.leapToMiddle(enemy, attack) : undefined;
        // Each phase a gear up: its patterns wound up quicker (the big hits
        // keep their warnings), and less of a rest after everything
        const tempo = this.phaseTempo(enemy);
        if (attack.kind === "pattern") {
            windupSeconds *= tempo;
        }
        const player = this.player;
        const startTick = this.tick;
        const landTick = this.clearOfSlam(
            enemy,
            startTick +
                Math.max(1, Math.round(windupSeconds * TICKS_PER_SECOND)) +
                (middle?.ticks ?? 0),
        );
        const toPlayer = Math.max(0.001, fm.hypot(player.x - enemy.x, player.y - enemy.y));
        const windup: BossWindup = {
            attack,
            startTick,
            landTick,
            // A blast's landing spots; a pattern bursting where the player is (origin "target"),
            // where they are now
            targets:
                attack.kind === "blast"
                    ? this.pickBlastTargets(attack)
                    : attack.pattern?.origin === "target"
                      ? [{ x: player.x, y: player.y }]
                      : [],
            dirX: (player.x - enemy.x) / toPlayer,
            dirY: (player.y - enemy.y) / toPlayer,
        };
        if (middle) {
            windup.at = { x: middle.x, y: middle.y };
        }
        // Thrown from statues of the map's (BossAttackDef.from), there from the start
        if (attack.from === "knights") {
            windup.from = this.pickKnights(attack);
            windup.targets = [{ x: player.x, y: player.y }];
        }
        state.windup = windup;
        // A spell it channels: its guard's down till it's cast, a tick past so a summon's walkers
        // take it on (BossAttackDef.channel)
        if (attack.channel) {
            this.dropGuard(
                enemy,
                (landTick - startTick + 2) / TICKS_PER_SECOND,
                false,
                attack.name,
            );
        }
        // Its lunge copied by whatever echoes it, each from where it stands (EnemyDef.echoes)
        this.startEchoes(enemy, attack, landTick - startTick);
        // The debris coming down ahead of what lands (BossAttackDef.shadow)
        const debris = attack.shadow?.debrisSpotAnim;
        if (debris !== undefined) {
            for (const { x, y } of windup.targets) {
                this.addEffect(debris, x, y, 0, landTick - startTick);
            }
        }
        // What it does to the floor as it starts, at the player it's after
        if (attack.floor) {
            this.floorAct(attack.floor, player);
        }
        this.animateStatues(attack, windup.from, attack.statues?.windupSeq);
        // Somewhere safe from it, there from the start (GroundPatternDef.safe)
        if (attack.ground?.safe) {
            this.markGround(enemy, attack, this.tick);
        }
        if (attack.kind === "ground") {
            this.markGround(enemy, attack, landTick);
            // What comes up out of the marks plays out before anything else:
            // the next round of claws waits for the hands
            const grab = attack.ground?.grab;
            if (grab) {
                state.channelEnd = Math.max(
                    state.channelEnd,
                    landTick + secondsToTicks(grab.seconds),
                );
            }
        } else if (attack.kind === "quarters") {
            this.growQuarters(enemy, attack, landTick, middle);
        } else if (attack.kind === "surge") {
            windup.lane = this.pickLane(enemy, attack);
        }
        const drowsy = this.tick < this.drowsyEndTick ? this.drowsyInterval : 1;
        const usual =
            def.attackInterval *
            tempo *
            (state.enraged ? (state.furyTempo ?? ENRAGED_INTERVAL) : 1) *
            (this.hard ? HARD_BOSS_INTERVAL : 1) *
            drowsy;
        enemy.attackCooldown = Math.round((interval ?? usual) * TICKS_PER_SECOND);
        // Timed to strike as it lands (BossAttackDef.strikeAt), what it does first before that
        if (attack.strikeAt !== undefined) {
            windup.seqTick = landTick - secondsToTicks(attack.strikeAt);
        }
        // Its windup's animation, once it's there (stepLeap plays it after a jump)
        if (!state.leap) {
            this.playWindup(enemy, windup);
        }
        if (attack.windupSound !== undefined) {
            this.emit({
                type: "bossAttack",
                enemyId: enemy.def.id,
                sound: attack.windupSound,
                x: enemy.x,
                y: enemy.y,
            });
        }
        // Each of its attacks wears a curse down, whoever's it is
        const current = this.hero;
        for (const hero of this.heroes) {
            if (hero.curse && --hero.curse.attacksLeft <= 0) {
                this.use(hero);
                this.curse = undefined;
                this.emit({ type: "playerCursed", cursed: false });
            }
        }
        this.use(current);
        if (attack.shout) {
            this.emit({ type: "bossShout", enemyUid: enemy.uid, text: attack.shout });
        }
        if (attack.message) {
            this.emit({ type: "notice", message: attack.message, instruction: true });
        }
    }

    // ---- A boss's guard (BossDef.guard), its lunge's dash, and the fight's button ----

    isExposed(enemy: Enemy): boolean {
        return this.tick < (enemy.bossState?.exposedEnd ?? 0);
    }

    isStunned(enemy: Enemy): boolean {
        return this.tick < (enemy.bossState?.stunEnd ?? 0);
    }

    // A lunge that aims as it winds up (BossAttackDef line.track): for its first track seconds the
    // strip turns after the player it's after, LINE_TRACK_TURN at most, then it's locked
    private trackLine(enemy: Enemy, windup: BossWindup): void {
        const track = windup.attack.kind === "swing" ? windup.attack.line?.track : undefined;
        if (track === undefined || this.tick - windup.startTick >= secondsToTicks(track)) {
            return;
        }
        const player = this.player;
        const want = fm.atan2(player.y - enemy.y, player.x - enemy.x);
        const have = fm.atan2(windup.dirY, windup.dirX);
        let turn = want - have;
        if (turn > Math.PI) {
            turn -= Math.PI * 2;
        } else if (turn < -Math.PI) {
            turn += Math.PI * 2;
        }
        const most = LINE_TRACK_TURN / TICKS_PER_SECOND;
        const angle = have + Math.min(most, Math.max(-most, turn));
        windup.dirX = fm.cos(angle);
        windup.dirY = fm.sin(angle);
    }

    // ---- What copies a boss's lunges (EnemyDef.echoes: the Menaphite Akh's shadow) ----

    // As boss starts attack, each enemy that echoes it starts its own copy from where it stands,
    // at the hero nearest it, over the same ticks (and its echo's later): free ones only, the
    // nearest a hero first, up to its most
    private startEchoes(boss: Enemy, attack: BossAttackDef, ticks: number): void {
        const line = attack.kind === "swing" ? attack.line : undefined;
        if (!line) {
            return;
        }
        const copiers: { enemy: Enemy; hero: Hero; away: number }[] = [];
        for (const enemy of this.enemies) {
            const echoes = enemy.def.echoes;
            if (
                !echoes ||
                echoes.boss !== boss.def.id ||
                !echoes.attacks.includes(attack.name) ||
                enemy.dead ||
                enemy.leaving ||
                enemy.risingEnd !== 0 ||
                enemy.flung ||
                enemy.jump ||
                enemy.echo ||
                enemy.echoDash ||
                // A boss echoing its partner, only while it's free
                this.isBusyBoss(enemy)
            ) {
                continue;
            }
            const hero = this.nearestHero(enemy.x, enemy.y);
            const away = fm.hypot(hero.player.x - enemy.x, hero.player.y - enemy.y);
            copiers.push({ enemy, hero, away });
        }
        if (copiers.length === 0) {
            return;
        }
        copiers.sort((a, b) => a.away - b.away || a.enemy.uid - b.enemy.uid);
        for (const [i, { enemy, hero, away }] of copiers.entries()) {
            const echoes = enemy.def.echoes!;
            if (echoes.most !== undefined && i >= echoes.most) {
                break;
            }
            const copy: BossAttackDef = {
                ...attack,
                name: echoes.name,
                damage: echoes.damage,
                seq: echoes.seq,
                strikeAt: echoes.strikeAt,
                impact: echoes.impact ?? attack.impact,
                line:
                    echoes.length !== undefined || echoes.noDash
                        ? {
                              ...line,
                              length: echoes.length ?? line.length,
                              dash: echoes.noDash ? undefined : line.dash,
                          }
                        : line,
                // Its own: no guard to drop, nothing after it, nothing said
                opens: undefined,
                chain: undefined,
                follow: undefined,
                shout: undefined,
                message: undefined,
            };
            const landTick = this.tick + ticks + secondsToTicks(echoes.later ?? 0);
            const length = Math.max(0.001, away);
            const windup: BossWindup = {
                attack: copy,
                startTick: this.tick,
                landTick,
                targets: [],
                dirX: (hero.player.x - enemy.x) / length,
                dirY: (hero.player.y - enemy.y) / length,
            };
            if (echoes.strikeAt !== undefined) {
                windup.seqTick = landTick - secondsToTicks(echoes.strikeAt);
            }
            enemy.echo = windup;
            enemy.vx = enemy.vy = 0;
            enemy.anim = "attack";
            enemy.attackSeq = echoes.seq;
            enemy.animStart = windup.seqTick ?? this.tick;
        }
    }

    // A boss that's doing something of its own: winding up, channelling its walkers in, in the
    // air or dashing, kneeling or stunned. Never true of what isn't a boss.
    private isBusyBoss(enemy: Enemy): boolean {
        const state = enemy.bossState;
        return (
            state !== undefined &&
            (state.windup !== undefined ||
                state.walkers !== undefined ||
                state.leap !== undefined ||
                state.dash !== undefined ||
                state.phase?.pauseEnd !== undefined ||
                enemy.shieldEnd > this.tick ||
                this.isStunned(enemy))
        );
    }

    // Winding its copy up, turning after the hero nearest it as a tracking lunge does, then
    // landing it and dashing down its strip
    private stepEcho(enemy: Enemy): void {
        const dash = enemy.echoDash;
        if (dash) {
            const f = Math.min(
                1,
                (this.tick - dash.startTick) / Math.max(1, dash.endTick - dash.startTick),
            );
            enemy.x = dash.fromX + (dash.toX - dash.fromX) * f;
            enemy.y = dash.fromY + (dash.toY - dash.fromY) * f;
            if (f >= 1) {
                enemy.echoDash = undefined;
                this.showImpact(dash.impact, enemy.x, enemy.y);
                enemy.anim = "walk";
                enemy.attackSeq = enemy.def.attackSeq;
                enemy.animStart = this.tick;
            }
            return;
        }
        const windup = enemy.echo!;
        this.trackLine(enemy, windup);
        // Facing down its strip, as it turns
        enemy.yaw = yawFromVector(windup.dirX, windup.dirY);
        if (this.tick < windup.landTick) {
            return;
        }
        enemy.echo = undefined;
        const attack = windup.attack;
        const line = attack.line!;
        // Co-op: on anyone in its strip
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (
                !this.runOver &&
                inStrip(
                    player.x,
                    player.y,
                    player.radius,
                    enemy.x,
                    enemy.y,
                    windup.dirX,
                    windup.dirY,
                    line.length,
                    line.width,
                )
            ) {
                this.bossHit(enemy.def.id, enemy, attack, this.getBossDamage(enemy, attack));
            }
        });
        if (this.runOver || enemy.dead) {
            return;
        }
        // Its trail down the strip, and the rest where it stops (stepEcho)
        const impact = attack.impact;
        this.showImpact(impact && { trail: impact.trail }, enemy.x, enemy.y, {
            dirX: windup.dirX,
            dirY: windup.dirY,
            length: line.length,
        });
        const end = line.dash
            ? this.dashEnd(enemy, windup.dirX, windup.dirY, line.dash)
            : { x: enemy.x, y: enemy.y };
        const length = fm.hypot(end.x - enemy.x, end.y - enemy.y);
        enemy.echoDash = {
            impact: impact && { ...impact, trail: undefined },
            fromX: enemy.x,
            fromY: enemy.y,
            toX: end.x,
            toY: end.y,
            startTick: this.tick,
            endTick: this.tick + Math.max(1, Math.round((length / DASH_SPEED) * TICKS_PER_SECOND)),
        };
    }

    // Its guard's down for seconds: exposed after a miss of its own, or stunned too (its
    // arena's attack caught it, its lunge stuck in a pillar), doing nothing at all. cause: what
    // did it, for the event. Nothing gets through while it kneels at a threshold, or in its finale.
    private dropGuard(boss: Enemy, seconds: number, stunned: boolean, cause: string): void {
        const guard = boss.def.boss?.guard;
        const state = boss.bossState;
        if (
            !guard ||
            !state ||
            boss.dead ||
            this.runOver ||
            state.phase?.pauseEnd !== undefined ||
            state.phase?.stage === "finale"
        ) {
            return;
        }
        // Stunned not long ago: it shrugs this one off, and only its guard drops
        if (stunned && this.tick < (state.stunGraceEnd ?? 0)) {
            stunned = false;
            seconds = Math.min(seconds, boss.def.boss!.guard!.stun);
            this.showImpact(guard.resisted, boss.x, boss.y, undefined, boss.uid);
            if (guard.resistShout) {
                this.emit({ type: "bossShout", enemyUid: boss.uid, text: guard.resistShout });
            }
        }
        const end = this.tick + secondsToTicks(seconds);
        const wasOpen = this.isExposed(boss);
        state.exposedEnd = Math.max(state.exposedEnd ?? 0, end);
        if (stunned) {
            const wasStunned = this.isStunned(boss);
            state.stunEnd = Math.max(state.stunEnd ?? 0, end);
            state.stunGraceEnd = state.stunEnd + secondsToTicks(guard.stunGrace ?? 0);
            // Whatever it was winding up is lost, and it gets its breath back after
            state.windup = undefined;
            state.chain = undefined;
            state.follow = undefined;
            boss.attackCooldown = Math.max(
                boss.attackCooldown,
                end - this.tick + secondsToTicks(STUN_RECOVER_SECONDS),
            );
            boss.vx = boss.vy = 0;
            boss.anim = "walk";
            boss.animStart = this.tick;
            if (guard.stunSpotAnim !== undefined && !wasStunned) {
                this.addEffect(
                    guard.stunSpotAnim,
                    boss.x,
                    boss.y,
                    guard.stunHeight ?? 0,
                    end - this.tick,
                    boss.uid,
                );
            }
        }
        const sound = stunned ? guard.stunSound : guard.exposeSound;
        if (sound !== undefined) {
            this.emit({ type: "bossAttack", enemyId: boss.def.id, sound, x: boss.x, y: boss.y });
        }
        this.emit({
            type: "bossGuard",
            enemyId: boss.def.id,
            stunned,
            cause,
            x: boss.x,
            y: boss.y,
        });
        if (!wasOpen) {
            this.strikeNow(boss);
        }
    }

    // A strike that only reaches so far (MapDef.fight.strikeReach) goes off at once for each
    // hero in reach of the boss, its guard just down
    private strikeNow(boss: Enemy): void {
        const reach = this.map.fight?.strikeReach;
        if (reach === undefined) {
            return;
        }
        for (const hero of this.heroes) {
            const player = hero.player;
            if (!this.isUp(hero) || fm.hypot(player.x - boss.x, player.y - boss.y) > reach) {
                continue;
            }
            for (const weapon of hero.weapons) {
                if (weapon.def.kind === "strike") {
                    weapon.cooldown = 0;
                }
            }
        }
    }

    // A lunge's dash (BossAttackDef line.dash): as far along its strip as it goes before
    // anything's in the way (a wall, a pillar, a player), and whether that's a pillar
    private dashEnd(
        enemy: Enemy,
        dirX: number,
        dirY: number,
        length: number,
    ): { x: number; y: number; stuck: boolean } {
        const pillars = this.map.features?.pillars;
        let x = enemy.x;
        let y = enemy.y;
        for (let along = DASH_STEP; along <= length + 1e-9; along += DASH_STEP) {
            const nx = enemy.x + dirX * along;
            const ny = enemy.y + dirY * along;
            if (boxCircle(pillars, nx, ny, enemy.radius)) {
                return { x, y, stuck: true };
            }
            // One of Ba-Ba's boulders' rocks: stopped short of it. Only her Rampage is stunned by one
            // (stepSurge), so hiding behind a rock from her lunges doesn't stun her every time.
            if (this.tombsCover.length > 0 && this.inCoverRock(nx, ny, enemy.radius)) {
                return { x, y, stuck: false };
            }
            const inTheWay = this.heroes.some(
                (hero) =>
                    this.isUp(hero) &&
                    fm.hypot(hero.player.x - nx, hero.player.y - ny) <
                        enemy.radius + hero.player.radius,
            );
            if (inTheWay || !isCircleFree(this.grid, nx, ny, enemy.radius)) {
                break;
            }
            x = nx;
            y = ny;
        }
        return { x, y, stuck: false };
    }

    private startDash(enemy: Enemy, attack: BossAttackDef, windup: BossWindup): void {
        const dash = attack.line?.dash;
        if (!dash) {
            return;
        }
        const end = this.dashEnd(enemy, windup.dirX, windup.dirY, dash);
        const length = fm.hypot(end.x - enemy.x, end.y - enemy.y);
        enemy.bossState!.dash = {
            attack,
            fromX: enemy.x,
            fromY: enemy.y,
            toX: end.x,
            toY: end.y,
            startTick: this.tick,
            endTick: this.tick + Math.max(1, Math.round((length / DASH_SPEED) * TICKS_PER_SECOND)),
            stuck: end.stuck,
        };
    }

    private stepDash(enemy: Enemy, dash: NonNullable<BossState["dash"]>): void {
        const span = Math.max(1, dash.endTick - dash.startTick);
        const f = Math.min(1, (this.tick - dash.startTick) / span);
        enemy.x = dash.fromX + (dash.toX - dash.fromX) * f;
        enemy.y = dash.fromY + (dash.toY - dash.fromY) * f;
        if (f < 1) {
            return;
        }
        enemy.bossState!.dash = undefined;
        // What it throws up where it stops, and its sword stuck in the stone
        this.showImpact(dash.attack.impact, enemy.x, enemy.y);
        const guard = enemy.def.boss?.guard;
        if (dash.stuck && guard) {
            const dx = dash.toX - dash.fromX;
            const dy = dash.toY - dash.fromY;
            const length = Math.max(0.001, fm.hypot(dx, dy));
            // At the pillar's face, where the sword's gone in
            this.showImpact(
                guard.stuck,
                enemy.x + (dx / length) * enemy.radius,
                enemy.y + (dy / length) * enemy.radius,
            );
            this.dropGuard(enemy, guard.stun, true, "Pillar");
        }
    }

    // What a hit throws up (ImpactDef): its spots at (x, y), its trail laid along a way it
    // went (from x, y, length tiles along dirX, dirY), and the camera's shake and the screen's
    // flash for the view
    private showImpact(
        impact: ImpactDef | undefined,
        x: number,
        y: number,
        along?: { dirX: number; dirY: number; length: number },
        follows = 0,
    ): void {
        if (!impact) {
            return;
        }
        for (const spot of impact.spots ?? []) {
            this.addImpactSpot(spot, x, y, follows);
        }
        const trail = impact.trail;
        if (trail && along) {
            const yaw = yawFromVector(along.dirX, along.dirY);
            for (let at = TRAIL_GAP / 2; at < along.length; at += TRAIL_GAP) {
                const effect = this.addImpactSpot(trail, x + along.dirX * at, y + along.dirY * at);
                if (effect) {
                    effect.yaw = yaw;
                }
            }
        }
        if (impact.shake !== undefined || impact.flash !== undefined) {
            this.emit({
                type: "bossImpact",
                x,
                y,
                shake: impact.shake ?? 0,
                ...(impact.flash !== undefined && { flash: impact.flash }),
            });
        }
    }

    // One of an impact's spot animations, played once, scaled to its fit (following an enemy,
    // by uid, if set)
    private addImpactSpot(
        spot: ImpactSpotDef,
        x: number,
        y: number,
        follows = 0,
    ): Effect | undefined {
        const effect = this.addEffect(spot.spotAnim, x, y, 0, IMPACT_TICKS, follows);
        if (effect) {
            effect.once = true;
            if (spot.fit !== undefined) {
                effect.fitRadius = spot.fit;
            }
        }
        return effect;
    }

    // An arena's attack that's caught its own boss (BossAttackDef.turns): hurt, and stunned
    private turnOnBoss(boss: Enemy, attack: BossAttackDef): void {
        const turns = attack.turns;
        if (!turns || boss.dead || !boss.bossState) {
            return;
        }
        const current = this.hero;
        // Whoever led it there, as near as anyone can say
        this.use(this.nearestHero(boss.x, boss.y));
        this.damageSource = "court";
        this.damageEnemy(boss, turns.damage, 0, boss.x, boss.y, 0);
        this.use(current);
        const guard = boss.def.boss?.guard;
        if (turns.stun && guard && !boss.dead) {
            this.dropGuard(boss, guard.stun, true, attack.name);
        }
    }

    // The fight's button: a fight map's own (MapDef.fight.ability), or the Tombs' (TombsDef.ability)
    get ability(): FightAbilityDef | undefined {
        return this.map.fight?.ability ?? this.map.tombs?.ability;
    }

    // The fight's button (Sim.ability), for the current hero: whether it went off
    // A press a moment too soon (the button still charging, or the boss just out of reach) is
    // held for ABILITY_BUFFER_SECONDS and goes off as soon as it can, rather than lost; one that
    // couldn't in that time says no. Whether it went off, or is held.
    useAbility(): boolean {
        const ability = this.ability;
        const hero = this.hero;
        if (!ability || this.state !== "playing" || !this.isUp(hero)) {
            return false;
        }
        if (this.fireAbility(ability)) {
            hero.abilityHeldUntil = -1;
            return true;
        }
        if (this.abilityNearlyReady(ability)) {
            hero.abilityHeldUntil = this.tick + secondsToTicks(ABILITY_BUFFER_SECONDS);
            return true;
        }
        return false;
    }

    // Whether a press of the fight's button now would be taken (useAbility), going off or held a
    // moment, without pressing it: for the client's hint
    abilityPressTakes(): boolean {
        const ability = this.ability;
        if (!ability || this.state !== "playing" || !this.isUp(this.hero)) {
            return false;
        }
        const ready = this.tick >= this.hero.abilityReadyTick;
        return (
            (ready && this.abilityTarget(ability) !== undefined) || this.abilityNearlyReady(ability)
        );
    }

    // A press a moment early, or a step out of reach: held to go off (ABILITY_BUFFER_SECONDS,
    // ABILITY_BUFFER_REACH)
    private abilityNearlyReady(ability: FightAbilityDef): boolean {
        const soon = this.tick + secondsToTicks(ABILITY_BUFFER_SECONDS);
        const player = this.player;
        const near = this.abilityBosses().some(
            (boss) =>
                !boss.dead &&
                boss.shieldEnd <= soon &&
                fm.hypot(boss.x - player.x, boss.y - player.y) <=
                    this.abilityReach(ability, boss) + ABILITY_BUFFER_REACH,
        );
        return this.hero.abilityReadyTick <= soon && near;
    }

    // Each hero's held press, tried again each tick till it goes off or runs out
    private stepHeldAbilities(): void {
        const ability = this.ability;
        if (!ability) {
            return;
        }
        const current = this.hero;
        for (const hero of this.heroes) {
            if (hero.abilityHeldUntil < 0) {
                continue;
            }
            if (this.tick > hero.abilityHeldUntil || !this.isUp(hero)) {
                hero.abilityHeldUntil = -1;
                continue;
            }
            this.use(hero);
            if (this.fireAbility(ability)) {
                hero.abilityHeldUntil = -1;
            }
        }
        this.use(current);
    }

    // How far the fight's button reaches now: further while the boss's guard is down
    private abilityReach(ability: FightAbilityDef, boss: Enemy): number {
        return this.isExposed(boss) ? (ability.openReach ?? ability.reach) : ability.reach;
    }

    // The fight's button going off for the current hero, if it can now
    private fireAbility(ability: FightAbilityDef): boolean {
        const hero = this.hero;
        if (this.tick < hero.abilityReadyTick) {
            return false;
        }
        const boss = this.abilityTarget(ability);
        if (!boss) {
            return false;
        }
        hero.abilityReadyTick = this.tick + secondsToTicks(ability.cooldown);
        const player = this.player;
        // Without one of its own (the Tombs', played with your own character), the hero's
        // first weapon's
        const seq =
            ability.playerSeq ?? (this.map.tombs ? this.weapons[0]?.def.playerSeq : undefined);
        if (seq !== undefined) {
            player.attackSeq = seq;
            player.attackStart = this.tick;
        }
        this.showImpact(ability.impact, boss.x, boss.y);
        this.emit({
            type: "ability",
            abilityId: ability.id,
            enemyId: boss.def.id,
            sound: ability.sound ?? -1,
            x: boss.x,
            y: boss.y,
            opened: this.isExposed(boss),
        });
        this.damageSource = `ability:${ability.id}`;
        if (ability.damageShare !== undefined) {
            // A share of its hitpoints, none of the hero's bonuses (a guard down still doubles it)
            this.damageEnemy(
                boss,
                this.abilityShareOf(boss) * ability.damageShare,
                0,
                player.x,
                player.y,
                0,
            );
        } else {
            this.damageEnemy(boss, ability.damage, 0, player.x, player.y);
        }
        this.breakChannel(boss);
        return true;
    }

    private tombsAbilityBosses(): Enemy[] {
        const uids: number[] = [];
        const wardens = this.tombsWardens;
        if (wardens) {
            if (wardens.phase === 2 && wardens.two?.wardenUid !== undefined) {
                // Not while it kneels: its core's what's hit then, and isn't a boss
                if (!wardens.two.kneel) {
                    uids.push(wardens.two.wardenUid);
                }
            } else if (wardens.phase === 3 && wardens.three) {
                uids.push(wardens.three.wardenUid);
            }
        } else if (this.tombsRoom?.boss && this.tombsRoom.boss.uid !== -1) {
            uids.push(this.tombsRoom.boss.uid);
        }
        return this.enemies.filter((e) => !e.dead && e.bossState && uids.includes(e.uid));
    }

    // What a button's damageShare is a share of, for this boss: what the hit comes off (Kephri's
    // shield, the second-phase Warden's), else its hitpoints
    private abilityShareOf(boss: Enemy): number {
        const kephri = this.tombsKephri;
        if (kephri && boss.uid === kephri.uid && !kephri.final) {
            return kephri.shieldMax;
        }
        const two = this.tombsWardens?.phase === 2 ? this.tombsWardens.two : undefined;
        if (two && boss.uid === two.wardenUid && !two.kneel) {
            return two.shieldMax;
        }
        return boss.maxHp;
    }

    // The fight's button landed on a boss channelling a spell (BossAttackDef.channel): it's
    // broken, nothing's cast, its walkers scatter, and its guard stays down a while longer
    private breakChannel(boss: Enemy): void {
        const state = boss.bossState;
        if (!state || boss.dead || this.runOver) {
            return;
        }
        const windup = state.windup;
        let attack: BossAttackDef | undefined;
        if (windup?.attack.channel && this.tick < windup.landTick) {
            attack = windup.attack;
            state.windup = undefined;
            state.chain = undefined;
            state.follow = undefined;
        } else if (state.walkers?.attack.channel) {
            attack = state.walkers.attack;
            for (const walker of state.walkers.enemies) {
                if (!walker.dead) {
                    this.vanish(walker);
                }
            }
            state.walkers = undefined;
        } else {
            // A channelled beam (a tether's): it's gone
            const beam = this.tethers.find(
                (t) => t.bossUid === boss.uid && t.attack.channel && this.tick < t.endTick,
            );
            if (beam) {
                attack = beam.attack;
                this.tethers = this.tethers.filter((t) => t !== beam);
            }
        }
        const channel = attack?.channel;
        if (!attack || !channel) {
            return;
        }
        boss.attackCooldown = Math.max(boss.attackCooldown, secondsToTicks(channel.stagger));
        boss.anim = "walk";
        boss.attackSeq = boss.def.attackSeq;
        boss.animStart = this.tick;
        // Down for the stagger from now, not the rest of what it was channelling
        state.exposedEnd = this.tick;
        this.dropGuard(boss, channel.stagger, false, `${attack.name} (broken)`);
        this.emit({ type: "notice", message: channel.broken ?? "Its spell is broken!" });
    }

    // The bosses the fight's button can land on: the one on the bar, or of two fought together
    // (the Scarab Mages) either of them; in the Tombs, the path's boss, or the Wardens' Warden in
    // their second and third phases (the first phase's obelisk isn't a boss, nor the core)
    private abilityBosses(): Enemy[] {
        if (this.map.tombs) {
            return this.tombsAbilityBosses();
        }
        let together: Enemy[] | undefined;
        for (const enemy of this.enemies) {
            if (enemy.finalBoss && !enemy.dead && enemy.bossState) {
                (together ??= []).push(enemy);
            }
        }
        if (together && together.length > 1) {
            return together;
        }
        const shown = this.shownBoss;
        return shown ? [shown] : [];
    }

    // What the fight's button would land on now: the boss, up, in reach of the current hero; of
    // two fought together, one with its guard down first, then the nearer
    abilityTarget(ability = this.ability): Enemy | undefined {
        if (!ability || this.intro) {
            return undefined;
        }
        const player = this.player;
        let best: Enemy | undefined;
        let bestOpen = false;
        let bestAway = Infinity;
        for (const boss of this.abilityBosses()) {
            const state = boss.bossState;
            // Kneeling at a threshold, nothing gets through
            if (!state || boss.dead || state.leap || boss.shieldEnd > this.tick) {
                continue;
            }
            const away = fm.hypot(boss.x - player.x, boss.y - player.y);
            if (away > this.abilityReach(ability, boss)) {
                continue;
            }
            const open = this.isExposed(boss);
            if (!best || (open && !bestOpen) || (open === bestOpen && away < bestAway)) {
                best = boss;
                bestOpen = open;
                bestAway = away;
            }
        }
        return best;
    }

    // Seconds until a hero's button can be used again
    abilitySecondsLeft(hero: Hero = this.hero): number {
        return Math.max(0, hero.abilityReadyTick - this.tick) / TICKS_PER_SECOND;
    }

    // A windup's animation, from now, or timed to strike as it lands (BossWindup.seqTick):
    // till then it holds the first frame, the blow drawn back (a frame before 0 is the first)
    private playWindup(enemy: Enemy, windup: BossWindup): void {
        enemy.anim = "attack";
        enemy.attackSeq = windup.attack.seq ?? enemy.def.attackSeq;
        enemy.animStart = windup.seqTick ?? this.tick;
    }

    // Below half its hitpoints a boss attacks and moves faster, and uses its
    // enraged attacks too
    private enrage(enemy: Enemy): void {
        const state = enemy.bossState!;
        const enrage = enemy.def.boss!.enrage;
        state.enraged = true;
        enemy.speed *= ENRAGED_SPEED;
        enemy.tint = ENRAGED_TINT;
        this.emit({
            type: "bossEnraged",
            enemyId: enemy.def.id,
            message: enrage.message,
            x: enemy.x,
            y: enemy.y,
        });
        if (enrage.shout) {
            this.emit({ type: "bossShout", enemyUid: enemy.uid, text: enrage.shout });
        }
    }

    // Those whose partner this was (BossDef enrage.partner) are enraged at once, quicker than
    // the usual enraged: kill one of the Scarab Mages and the other's furious
    private enragePartners(dead: Enemy): void {
        for (const enemy of this.enemies) {
            const partner = enemy.def.boss?.enrage.partner;
            const state = enemy.bossState;
            if (
                !partner ||
                !state ||
                enemy.dead ||
                enemy.leaving ||
                !partner.ids.includes(dead.def.id)
            ) {
                continue;
            }
            if (!state.enraged) {
                state.enraged = true;
                enemy.speed *= ENRAGED_SPEED;
                enemy.tint = ENRAGED_TINT;
            }
            state.furyTempo = partner.tempo;
            // Straight on with it
            enemy.attackCooldown = Math.min(enemy.attackCooldown, TICKS_PER_SECOND / 2);
            this.emit({
                type: "bossEnraged",
                enemyId: enemy.def.id,
                message: partner.message ?? enemy.def.boss!.enrage.message,
                x: enemy.x,
                y: enemy.y,
            });
            if (partner.shout) {
                this.emit({ type: "bossShout", enemyUid: enemy.uid, text: partner.shout });
            }
        }
    }

    // A boss's beam to its partner (BossAttackDef.tether), from now for its seconds: one at a
    // time from each boss
    private startTether(boss: Enemy, attack: BossAttackDef): void {
        const tether = attack.tether!;
        this.tethers = this.tethers.filter((t) => t.bossUid !== boss.uid);
        this.tethers.push({
            bossUid: boss.uid,
            attack,
            armTick: this.tick + secondsToTicks(tether.warn),
            endTick: this.tick + secondsToTicks(tether.seconds),
        });
        // Channelled (Elidinis' Judgement): its guard's down for as long as the beam runs, and
        // the fight's button breaks it (breakChannel)
        if (attack.channel) {
            this.dropGuard(boss, tether.seconds, false, attack.name);
        }
    }

    // A last-phase phantom of the Wardens' lands nothing in the half second a slam rises: its
    // windup's pushed past it (the shapes it throws and the slam's half of the floor at once was
    // a hit nobody could help)
    private clearOfSlam(enemy: Enemy, landTick: number): number {
        const three = this.tombsWardens?.three;
        if (!three || three.enraged || !three.phantoms.includes(enemy.uid)) {
            return landTick;
        }
        const rise = secondsToTicks(WARDENS_SLAM_RISE);
        const slam = three.nextSlam;
        return landTick >= slam && landTick < slam + rise ? slam + rise : landTick;
    }

    // A tether's two ends: its boss and the nearest of its partners still up, or undefined once
    // either's gone (the view draws it from these too)
    tetherEnds(tether: BossTether): { boss: Enemy; partner: Enemy } | undefined {
        const boss = this.enemies.find((e) => e.uid === tether.bossUid);
        if (!boss || boss.dead || boss.leaving) {
            return undefined;
        }
        const id = tether.attack.tether!.partner;
        let partner: Enemy | undefined;
        let nearest = Infinity;
        for (const enemy of this.enemies) {
            if (enemy.def.id !== id || enemy.dead || enemy.leaving) {
                continue;
            }
            const distance = fm.hypot(enemy.x - boss.x, enemy.y - boss.y);
            if (distance < nearest) {
                nearest = distance;
                partner = enemy;
            }
        }
        return partner && { boss, partner };
    }

    // Each tether, once it's armed, hurts whoever's across it, each of them once an interval
    private stepTethers(): void {
        if (this.tethers.length === 0) {
            return;
        }
        this.tethers = this.tethers.filter(
            (tether) => tether.endTick > this.tick && this.tetherEnds(tether) !== undefined,
        );
        for (const tether of this.tethers) {
            if (this.tick < tether.armTick) {
                continue;
            }
            const { boss, partner } = this.tetherEnds(tether)!;
            const def = tether.attack.tether!;
            this.forEachHeroInReach(() => {
                const hero = this.hero;
                const player = this.player;
                if (this.runOver || this.tick < (hero.tetherHitTick ?? 0)) {
                    return;
                }
                const reach = def.width / 2 + player.radius;
                if (
                    segmentDistanceSq(player.x, player.y, boss.x, boss.y, partner.x, partner.y) >
                    reach * reach
                ) {
                    return;
                }
                hero.tetherHitTick = this.tick + secondsToTicks(def.interval);
                this.bossHit(
                    boss.def.id,
                    boss,
                    tether.attack,
                    this.getBossDamage(boss, tether.attack),
                );
            });
        }
    }

    // On the player, and the rest of a blast of several scattered around them.
    // A square (BossAttackDef.square) lies on the tiles: an odd one on the middle
    // of the tile the spot's in, an even one on the nearest corner.
    private pickBlastTargets(attack: BossAttackDef): { x: number; y: number }[] {
        const player = this.player;
        // Near the player, never on them, somewhere they can get to (BossAttackDef.beside)
        const beside = attack.beside;
        if (beside) {
            let x = player.x;
            let y = player.y;
            for (let attempt = 0; attempt < SCATTER_ATTEMPTS; attempt++) {
                const angle = this.rng.range(0, Math.PI * 2);
                const distance = this.rng.range(beside.min, beside.max);
                x = player.x + fm.cos(angle) * distance;
                y = player.y + fm.sin(angle) * distance;
                const tileX = Math.floor(x);
                const tileY = Math.floor(y);
                if (
                    this.grid.contains(tileX, tileY) &&
                    !this.grid.isSolid(tileX, tileY) &&
                    this.isWalkableTile(tileX, tileY)
                ) {
                    break;
                }
            }
            return [{ x, y }];
        }
        const targets = [{ x: player.x, y: player.y }];
        for (let i = 1; i < (attack.count ?? 1); i++) {
            const angle = this.rng.range(0, Math.PI * 2);
            const distance = this.rng.range(1, Math.max(1, attack.spread ?? 2));
            targets.push({
                x: player.x + fm.cos(angle) * distance,
                y: player.y + fm.sin(angle) * distance,
            });
        }
        const square = attack.square;
        if (square) {
            const snap = (v: number) => (square % 2 === 1 ? Math.floor(v) + 0.5 : Math.round(v));
            for (const target of targets) {
                target.x = snap(target.x);
                target.y = snap(target.y);
            }
        }
        return targets;
    }

    // A square blast lands on every tile of it (BossAttackDef.square)
    private squareImpact(attack: BossAttackDef, x: number, y: number, half: number): void {
        const impact = attack.impactSpotAnim;
        if (impact === undefined) {
            return;
        }
        for (let tx = Math.floor(x - half); tx < x + half; tx++) {
            for (let ty = Math.floor(y - half); ty < y + half; ty++) {
                this.addEffect(impact, tx + 0.5, ty + 0.5, 0, 40);
            }
        }
    }

    // Dharok's hits grow as his hitpoints drop; harder maps hit harder
    private getBossDamage(enemy: Enemy, attack: BossAttackDef): number {
        const wretched = enemy.def.boss?.wretched ?? 0;
        return attack.damage * enemy.damageScale * (1 + wretched * (1 - enemy.hp / enemy.maxHp));
    }

    private landBossAttack(enemy: Enemy, windup: BossWindup): void {
        const attack = windup.attack;
        this.emit({
            type: "bossAttack",
            enemyId: enemy.def.id,
            sound: attack.sound ?? -1,
            x: enemy.x,
            y: enemy.y,
        });
        this.landBlastExtras(enemy, windup);
        this.queueFollow(enemy, attack);
        if (attack.takeCover) {
            this.landAvalanche(enemy, attack, attack.takeCover);
            return;
        }
        // Not a row attack's: its statues fire with its volleys (fireRows)
        if (!attack.pattern?.rows) {
            this.animateStatues(attack, windup.from, attack.statues?.seq);
        }
        if (attack.kind === "swing" || attack.kind === "blast") {
            // A swing hits around the boss, a blast where the player was (and
            // around there); the player is hit once however many land on them
            const spots = attack.kind === "swing" ? [{ x: enemy.x, y: enemy.y }] : windup.targets;
            if (attack.leap) {
                this.leapTo(enemy, spots[0]);
            }
            const radius = attack.radius ?? 2;
            // A lunge's strip (BossAttackDef.line), a blast's square (square)
            const line = attack.kind === "swing" ? attack.line : undefined;
            const half = attack.kind === "blast" && attack.square ? attack.square / 2 : 0;
            for (const { x, y } of spots) {
                if (half > 0) {
                    this.squareImpact(attack, x, y, half);
                    continue;
                }
                if (!line) {
                    this.emit({ type: "bossSwing", x, y, radius });
                }
                if (attack.kind === "blast" && attack.impactSpotAnim !== undefined) {
                    this.addEffect(attack.impactSpotAnim, x, y, 0, 40);
                }
                if (attack.kind === "blast" && attack.shards) {
                    this.fireShards(enemy, attack, attack.shards, x, y);
                }
                // A rock left to take cover by (BossAttackDef.leavesCover)
                const cover = attack.kind === "blast" ? attack.leavesCover : undefined;
                if (cover) {
                    this.tombsCover.push({
                        x,
                        y,
                        radius: cover.radius,
                        endTick: this.tick + secondsToTicks(cover.seconds),
                        look: cover.looks[this.rng.int(cover.looks.length)],
                    });
                }
            }
            // Co-op: on anyone it lands on
            let landed = false;
            this.forEachHeroInReach(() => {
                const player = this.player;
                let hit = line
                    ? inStrip(
                          player.x,
                          player.y,
                          player.radius,
                          enemy.x,
                          enemy.y,
                          windup.dirX,
                          windup.dirY,
                          line.length,
                          line.width,
                      )
                    : half > 0
                      ? spots.some(({ x, y }) =>
                            circleInBox(player.x, player.y, player.radius, x, y, half, half),
                        )
                      : spots.some(
                            ({ x, y }) =>
                                fm.hypot(player.x - x, player.y - y) <= radius + player.radius,
                        );
                if (hit && attack.cone !== undefined) {
                    hit = this.inCone(enemy, windup, attack, attack.cone);
                }
                // Sheltering at its feet (BossAttackDef.outside)
                if (
                    hit &&
                    attack.outside !== undefined &&
                    fm.hypot(player.x - enemy.x, player.y - enemy.y) <= attack.outside
                ) {
                    hit = false;
                }
                // Out of its sight behind a pillar (BossAttackDef.cover)
                // Out of its sight: as drawn, any part of them on a shadowed tile
                if (
                    hit &&
                    attack.cover &&
                    inShadow(
                        this.map.features?.pillars,
                        windup.at?.x ?? enemy.x,
                        windup.at?.y ?? enemy.y,
                        player.x,
                        player.y,
                        player.radius,
                    )
                ) {
                    hit = false;
                }
                if (hit && attack.blockable && this.glyphBlocks(enemy, player.x, player.y)) {
                    // Behind the glyph: it takes the blow
                    hit = false;
                    this.glyphBlocked(enemy, attack);
                }
                if (hit && !this.runOver) {
                    landed = true;
                    // A blast's impact is already showing where it landed
                    const damage = this.getBossDamage(enemy, attack);
                    this.bossHit(enemy.def.id, enemy, attack, damage, attack.kind !== "blast");
                }
            });
            if (this.runOver) {
                return;
            }
            // What it throws up: a lunge's trail along its strip, and the rest where it stops
            // (once it's got there, if it dashes); a blast's on each spot, a swing's round it
            if (line) {
                this.showImpact(attack.impact && { trail: attack.impact.trail }, enemy.x, enemy.y, {
                    dirX: windup.dirX,
                    dirY: windup.dirY,
                    length: line.length,
                });
                if (line.dash) {
                    this.startDash(enemy, attack, windup);
                } else {
                    this.showImpact(
                        attack.impact && { ...attack.impact, trail: undefined },
                        enemy.x + windup.dirX * line.length,
                        enemy.y + windup.dirY * line.length,
                    );
                }
            } else {
                for (const { x, y } of spots) {
                    this.showImpact(attack.impact, x, y);
                }
            }
            // Missed everyone: its guard's down (BossDef.guard)
            if (!landed && attack.opens !== undefined) {
                this.dropGuard(enemy, attack.opens, false, attack.name);
            }
            return;
        }
        if (attack.kind === "teleport") {
            this.teleportBoss(enemy, attack);
            return;
        }
        if (attack.tether) {
            this.startTether(enemy, attack);
            return;
        }
        if (attack.kind === "summon") {
            this.summonAround(enemy, attack);
            return;
        }
        if (attack.castSpotAnim !== undefined) {
            this.addEffect(attack.castSpotAnim, enemy.x, enemy.y, 0, 40, enemy.uid);
        }
        if (attack.kind === "ground" || attack.kind === "quarters") {
            // Their marks land by themselves
            return;
        }
        if (attack.kind === "surge") {
            this.startSurge(enemy, attack, windup.lane!);
            return;
        }
        if (attack.kind === "mark") {
            this.markPlayer(enemy, attack);
            return;
        }
        if (attack.kind === "pattern") {
            this.startPattern(enemy, attack, windup);
            return;
        }
        // A wave's slam, round the boss as it's let go
        if (!windup.from) {
            this.showImpact(attack.impact, enemy.x, enemy.y);
        }
        this.launchProjectiles(enemy, attack, this.getBossDamage(enemy, attack), false, windup);
    }

    // Some of the map's knights (ArenaFeatures.knights), count of them (one when
    // unset), at random
    private pickKnights(attack: BossAttackDef): ArenaStatue[] {
        const knights = [...(this.map.features?.knights ?? [])];
        const picked: ArenaStatue[] = [];
        for (let i = 0; i < (attack.count ?? 1) && knights.length > 0; i++) {
            picked.push(knights.splice(this.rng.int(knights.length), 1)[0]);
        }
        return picked;
    }

    // The statues an attack's done with (BossAttackDef.statues): these (its own,
    // a throw's knights, a volley's rows), or its group's, start seq
    private animateStatues(
        attack: BossAttackDef,
        own: readonly ArenaStatue[] | undefined,
        seq: number | undefined,
    ): void {
        const statues = attack.statues;
        if (!statues || seq === undefined) {
            return;
        }
        const list = statues.group ? this.map.features?.statues?.[statues.group] : own;
        for (const statue of list ?? []) {
            this.emit({ type: "statueSeq", locId: statues.locId, x: statue.x, y: statue.y, seq });
        }
    }

    // Whoever a wave's hit (BossAttackDef.onHit): dragged in to the boss's feet,
    // held there, and the boss straight on with what follows, whatever it was
    // winding up
    private bindToBoss(boss: Enemy, attack: BossAttackDef): void {
        const onHit = attack.onHit!;
        const player = this.player;
        let dragTicks = 0;
        const bindTicks = secondsToTicks(onHit.bind ?? 0);
        if (onHit.pull !== undefined) {
            dragTicks = Math.max(1, secondsToTicks(onHit.pullSeconds ?? 0.25));
            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const distance = Math.max(0.001, fm.hypot(dx, dy));
            // No nearer than just clear of it
            const pull = Math.max(onHit.pull, boss.radius + player.radius);
            const to = findFreeSpot(
                this.grid,
                boss.x + (dx / distance) * pull,
                boss.y + (dy / distance) * pull,
                player.radius,
                (tileX, tileY) => this.isWalkableTile(tileX, tileY),
            );
            this.hero.drag = {
                fromX: player.x,
                fromY: player.y,
                toX: to.x,
                toY: to.y,
                startTick: this.tick,
                endTick: this.tick + dragTicks,
                holdEnd: this.tick + dragTicks + bindTicks,
            };
            // Bound where they're dragged to, for as long as it holds them
            if (attack.impactSpotAnim !== undefined) {
                this.addEffect(
                    attack.impactSpotAnim,
                    to.x,
                    to.y,
                    0,
                    dragTicks + bindTicks,
                    0,
                    true,
                );
            }
        }
        player.frozen = Math.max(player.frozen, dragTicks + bindTicks);
        const next = onHit.attack && boss.def.boss!.attacks.find((a) => a.name === onHit.attack);
        if (next && !boss.dead) {
            const state = boss.bossState!;
            state.windup = undefined;
            state.chain = undefined;
            state.follow = { attack: next, atTick: this.tick + dragTicks };
        }
    }

    // What's to follow an attack, from when it's fired (BossAttackDef.follow)
    // Ba-Ba's avalanche (BossAttackDef.takeCover): everyone not beside one of her boulders' rocks
    private landAvalanche(
        enemy: Enemy,
        attack: BossAttackDef,
        cover: NonNullable<BossAttackDef["takeCover"]>,
    ): void {
        this.forEachHeroInReach(() => {
            const player = this.player;
            const safe = this.tombsCover.some(
                (rock) =>
                    fm.hypot(player.x - rock.x, player.y - rock.y) <=
                    rock.radius + cover.reach + player.radius,
            );
            if (safe) {
                return;
            }
            this.bossHit(enemy.def.id, enemy, attack, player.maxHp * this.tombsShare(cover.share));
        });
    }

    private queueFollow(enemy: Enemy, attack: BossAttackDef): void {
        const follow = attack.follow;
        if (!follow) {
            return;
        }
        const next = enemy.def.boss!.attacks.find((a) => a.name === follow.attack);
        if (next) {
            enemy.bossState!.follow = {
                attack: next,
                atTick: this.tick + secondsToTicks(follow.delay),
            };
        }
    }

    // At where the player is now: keep moving and it misses
    private launchProjectiles(
        enemy: Enemy,
        attack: BossAttackDef,
        damage: number,
        crowd: boolean,
        windup?: BossWindup,
    ): void {
        const player = this.player;
        const speed = (attack.speed ?? 10) / TICKS_PER_SECOND;
        // Thrown from statues, each at where the player was as it began
        if (windup?.from) {
            const target = windup.targets[0] ?? player;
            for (const statue of windup.from) {
                const { x, y } = statueMiddle(statue);
                this.throwProjectile(
                    enemy,
                    attack,
                    damage,
                    x,
                    y,
                    fm.atan2(target.y - y, target.x - x),
                    speed,
                    statue,
                );
            }
            return;
        }
        const base = fm.atan2(player.y - enemy.y, player.x - enemy.x);
        const count = attack.count ?? 1;
        if (attack.wave || attack.boomerang) {
            // Along the line it was aimed as it began, there to be stepped off
            const aim = windup ? fm.atan2(windup.dirY, windup.dirX) : base;
            for (let i = 0; i < count; i++) {
                const angle = aim + (i - (count - 1) / 2) * (attack.spread ?? 0);
                this.throwProjectile(enemy, attack, damage, enemy.x, enemy.y, angle, speed);
            }
            return;
        }
        for (let i = 0; i < count; i++) {
            const angle = base + (i - (count - 1) / 2) * (attack.spread ?? 0);
            const vx = fm.cos(angle) * speed;
            const vy = fm.sin(angle) * speed;
            this.enemyProjectiles.push({
                uid: this.nextUid++,
                enemyUid: enemy.uid,
                enemyId: enemy.def.id,
                attack,
                x: enemy.x,
                y: enemy.y,
                prevX: enemy.x,
                prevY: enemy.y,
                vx,
                vy,
                speed,
                homing: (attack.homing ?? 0) / TICKS_PER_SECOND,
                life: Math.ceil((attack.range + 6) / speed),
                radius: attack.radius ?? ENEMY_PROJECTILE_RADIUS,
                damage,
                yaw: yawFromVector(vx, vy),
                startTick: this.tick,
                crowd,
            });
        }
    }

    // A wave or a boomerang (BossAttackDef.wave, boomerang): through whoever it
    // hits, for its reach (and back again)
    private throwProjectile(
        enemy: Enemy,
        attack: BossAttackDef,
        damage: number,
        x: number,
        y: number,
        angle: number,
        speed: number,
        statue?: ArenaStatue,
    ): void {
        const vx = fm.cos(angle) * speed;
        const vy = fm.sin(angle) * speed;
        const reach = this.throwReach(attack, x, y, fm.cos(angle), fm.sin(angle));
        const out = Math.max(1, Math.ceil(reach / speed));
        this.enemyProjectiles.push({
            uid: this.nextUid++,
            enemyUid: enemy.uid,
            enemyId: enemy.def.id,
            attack,
            x,
            y,
            prevX: x,
            prevY: y,
            vx,
            vy,
            speed,
            homing: 0,
            life: attack.boomerang ? out * 2 : out,
            radius: attack.radius ?? ENEMY_PROJECTILE_RADIUS,
            damage,
            yaw: yawFromVector(vx, vy),
            startTick: this.tick,
            hit: [],
            ...(attack.boomerang && {
                boomerang: { fromX: x, fromY: y, turnTick: this.tick + out, hitBack: [], statue },
            }),
        });
    }

    // How far a wave or a boomerang goes before it turns or is gone, from (x, y) along dirX,
    // dirY: a boomerang that goes to the arena's edge (toEdge) as far as that is
    throwReach(attack: BossAttackDef, x: number, y: number, dirX: number, dirY: number): number {
        const boomerang = attack.boomerang;
        if (boomerang?.toEdge) {
            return Math.max(boomerang.reach, boxExit(this.bossArena, x, y, dirX, dirY));
        }
        return boomerang?.reach ?? attack.wave?.reach ?? attack.range;
    }

    // A wave's or a boomerang's tick: on through everyone it reaches, each hit
    // once (a boomerang once each way), turning back at its reach
    private stepThrough(projectile: EnemyProjectile, hit: number[]): void {
        const boomerang = projectile.boomerang;
        if (boomerang && this.tick === boomerang.turnTick) {
            projectile.vx = -projectile.vx;
            projectile.vy = -projectile.vy;
            projectile.yaw = yawFromVector(projectile.vx, projectile.vy);
        }
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        const back = boomerang !== undefined && this.tick >= boomerang.turnTick;
        const hits = back ? boomerang.hitBack : hit;
        const enemy = this.enemies.find((e) => e.uid === projectile.enemyUid);
        // Thrown through its own boss, once each way (BossAttackDef.turns)
        const way = back ? 2 : 1;
        if (
            projectile.attack.turns &&
            enemy &&
            !enemy.dead &&
            !((projectile.hitBoss ?? 0) & way) &&
            fm.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <=
                projectile.radius + enemy.radius
        ) {
            projectile.hitBoss = (projectile.hitBoss ?? 0) | way;
            this.turnOnBoss(enemy, projectile.attack);
        }
        this.forEachHeroInReach(() => {
            const player = this.player;
            const index = this.hero.index;
            if (
                this.runOver ||
                hits.includes(index) ||
                fm.hypot(player.x - projectile.x, player.y - projectile.y) >
                    projectile.radius + player.radius
            ) {
                return;
            }
            hits.push(index);
            this.bossHit(projectile.enemyId, enemy, projectile.attack, projectile.damage);
            if (projectile.attack.onHit && enemy && !this.runOver && !this.reviving) {
                this.bindToBoss(enemy, projectile.attack);
            }
        });
        // A wave that's gone its way without reaching anyone: its guard's down
        const opens = projectile.attack.opens;
        if (
            !boomerang &&
            projectile.life <= 0 &&
            opens !== undefined &&
            enemy &&
            hit.length === 0
        ) {
            this.dropGuard(enemy, opens, false, projectile.attack.name);
        }
        if (boomerang && projectile.life <= 0) {
            // Caught by the statue that threw it
            const attack = projectile.attack;
            const sound = attack.boomerang!.catchSound;
            if (sound !== undefined) {
                this.emit({
                    type: "bossAttack",
                    enemyId: projectile.enemyId,
                    sound,
                    x: projectile.x,
                    y: projectile.y,
                });
            }
            if (boomerang.statue) {
                this.animateStatues(attack, [boomerang.statue], attack.boomerang!.catchSeq);
            }
        }
    }

    // Calls in the attack's enemies in a ring around the boss
    private summonAround(enemy: Enemy, attack: BossAttackDef): void {
        const summon = attack.summon;
        if (!summon) {
            return;
        }
        const def = getEnemy(summon.enemyId);
        const count = summon.count;
        const around = summon.beside ? this.player : enemy;
        const radius =
            summon.walkTo?.distance ?? summon.distance ?? (summon.beside ? SUMMON_BESIDE : 1.5);
        const attempts = summon.beside || summon.walkTo || summon.distance !== undefined ? 6 : 1;
        const spawned: Enemy[] = [];
        const also = summon.alsoId !== undefined ? getEnemy(summon.alsoId) : undefined;
        const total = count + (also ? 1 : 0);
        for (let i = 0; i < total; i++) {
            const which = i < count ? def : also!;
            // Scattered: anywhere a wave's enemy would turn up, from the player
            const one = summon.scatter
                ? this.spawnEnemy(which, "normal")
                : summon.thrown
                  ? this.throwSummon(enemy, which, radius, summon.thrown.seconds)
                  : this.spawnNear(around, which, radius, i, total, attempts);
            if (one) {
                spawned.push(one);
            }
        }
        // What's part of the fight isn't a farm, though Sleepwalkers count for
        // their quest, which noDrops wouldn't
        for (const one of spawned) {
            one.noDrops = summon.beside === true || summon.thrown !== undefined;
            one.bonesOnly = summon.walkTo !== undefined;
        }
        if (spawned.length === 0) {
            return;
        }
        if (summon.holds !== undefined) {
            this.hold = { enemies: spawned, endTick: this.tick + secondsToTicks(summon.holds) };
        }
        if (summon.sarcophagi) {
            for (const one of spawned) {
                const at = this.nearestSarcophagus(one.x, one.y);
                if (at !== -1) {
                    one.seeks = at;
                }
            }
        }
        if (summon.walkTo) {
            for (const one of spawned) {
                one.walksTo = enemy;
            }
            enemy.bossState!.walkers = {
                attack,
                enemies: spawned,
                absorbed: 0,
                perAbsorbed: summon.walkTo.perAbsorbed,
            };
        }
    }

    // Out of the boss and through the air to a spot about distance tiles off
    // in some direction (summon.thrown): it can't be hit until it lands, and
    // what hatches counts its time from then
    private throwSummon(
        boss: Enemy,
        def: EnemyDef,
        distance: number,
        seconds: number,
    ): Enemy | undefined {
        const spot =
            this.findSpotNear(boss.x, boss.y, distance, def.radius) ??
            this.findSpotNear(boss.x, boss.y, distance / 2, def.radius);
        if (!spot) {
            return undefined;
        }
        const one = this.spawnEnemy(def, "normal", { x: boss.x, y: boss.y });
        if (!one) {
            return undefined;
        }
        const ticks = Math.max(1, secondsToTicks(seconds));
        const endTick = this.tick + ticks;
        one.flung = {
            fromX: boss.x,
            fromY: boss.y,
            toX: spot.x,
            toY: spot.y,
            startTick: this.tick,
            endTick,
        };
        one.shieldEnd = endTick;
        one.yaw = yawFromVector(spot.x - boss.x, spot.y - boss.y);
        if (one.hatchTick !== 0) {
            one.hatchTick += ticks;
        }
        return one;
    }

    // A blockable attack's blow landing on the glyph instead of the player
    private glyphBlocked(boss: Enemy, attack: BossAttackDef): void {
        const glyph = this.glyphs.find((g) => g.bossUid === boss.uid);
        if (glyph && attack.impactSpotAnim !== undefined) {
            this.addEffect(attack.impactSpotAnim, glyph.x, glyph.y, 0, 40);
        }
    }

    // A boss that gets back up (Count Draynor, without a stake) does so with
    // part of its hitpoints instead of dying, maybe as its next form
    private riseAgain(enemy: Enemy): boolean {
        const rises = enemy.def.boss?.rises;
        const state = enemy.bossState;
        if (!rises || !state || state.rises >= rises.times) {
            return false;
        }
        state.rises++;
        state.windup = undefined;
        enemy.hp = Math.round(enemy.maxHp * rises.hp);
        if (rises.into) {
            // Anything this form had still to call in comes now (it can go
            // from above a threshold to beaten in one big hit)
            this.callSummons(enemy, true);
            // It fights the new form's way, calm again until it's hurt, and
            // calls in the new form's helpers as it's hurt (BossDef.summonsAt)
            const form = getEnemy(rises.into);
            enemy.scale *= (form.scale ?? 1) / (enemy.def.scale ?? 1);
            enemy.def = form;
            enemy.radius = form.radius;
            enemy.speed = form.speed / TICKS_PER_SECOND;
            enemy.tint = 0xffffff;
            enemy.attackSeq = form.attackSeq;
            enemy.anim = "idle";
            enemy.animStart = this.tick;
            enemy.attackCooldown = TICKS_PER_SECOND;
            state.cooldowns = form.boss?.attacks.map(() => 0) ?? [];
            state.enraged = false;
            state.summonsDone = 0;
            // Its new form's own shadow realm, exhumes or yellows, from the top
            state.ordealsDone = 0;
            state.ordeal = undefined;
            state.ordealHeld = undefined;
        }
        this.emit({
            type: "bossRose",
            enemyId: enemy.def.id,
            message: rises.message,
            x: enemy.x,
            y: enemy.y,
        });
        return true;
    }

    // Calls in a boss's helpers for each fraction of its hitpoints it's down to
    // (BossDef.summonsAt). One with no room around it for any of them waits
    // and tries again next tick. all: every one still to come, whatever its
    // hitpoints (a form beaten before it got to them, as it rises as the next).
    private callSummons(enemy: Enemy, all: boolean): void {
        const state = enemy.bossState!;
        const summonsAt = enemy.def.boss?.summonsAt ?? [];
        while (
            state.summonsDone < summonsAt.length &&
            (all || enemy.hp <= enemy.maxHp * summonsAt[state.summonsDone].hp)
        ) {
            const summon = summonsAt[state.summonsDone];
            const summoned = getEnemy(summon.enemyId);
            let spawned = 0;
            for (let i = 0; i < summon.count; i++) {
                const distance = summon.distance ?? 2;
                const attempts = all ? 8 : 3;
                // Against a wall, where it says may be in it or past it: then nearer the boss,
                // so they all come (the Maiden's healers, 9 tiles out, by her room's wall)
                if (
                    this.spawnNear(enemy, summoned, distance, i, summon.count, attempts) ||
                    (distance > 2 &&
                        (this.spawnNear(enemy, summoned, (distance * 2) / 3, i, summon.count, 6) ||
                            this.spawnNear(enemy, summoned, distance / 3, i, summon.count, 6)))
                ) {
                    spawned++;
                }
            }
            if (spawned === 0 && !all) {
                return;
            }
            state.summonsDone++;
            if (summon.message) {
                this.emit({ type: "notice", message: summon.message });
            }
            if (summon.shout) {
                this.emit({ type: "bossShout", enemyUid: enemy.uid, text: summon.shout });
            }
        }
    }

    // To the middle of the arena, as she goes for her flowers
    // To the arena's middle (BossAttackDef.toMiddle): with its leash's jump,
    // down where it is and up at the middle, or else just there. Returns the
    // spot it'll stand on, and how long it takes to get there.
    private leapToMiddle(
        enemy: Enemy,
        attack: BossAttackDef,
    ): { x: number; y: number; ticks: number } {
        const arena = this.bossArena;
        const spot = findFreeSpot(
            this.grid,
            (arena.minX + arena.maxX) / 2,
            (arena.minY + arena.maxY) / 2,
            enemy.radius,
        );
        if (attack.castSpotAnim !== undefined) {
            this.addEffect(attack.castSpotAnim, enemy.x, enemy.y, 0, 40);
        }
        const jump = enemy.def.boss?.leash?.jump;
        const state = enemy.bossState;
        if (jump && state) {
            const ticks = secondsToTicks(jump.seconds);
            state.leap = {
                toX: spot.x,
                toY: spot.y,
                switchTick: this.tick + ticks,
                endTick: this.tick + ticks * 2,
            };
            enemy.anim = "attack";
            enemy.attackSeq = jump.downSeq;
            enemy.animStart = this.tick;
            enemy.vx = enemy.vy = 0;
            return { x: spot.x, y: spot.y, ticks: ticks * 2 };
        }
        enemy.x = enemy.prevX = spot.x;
        enemy.y = enemy.prevY = spot.y;
        enemy.vx = enemy.vy = 0;
        return { x: spot.x, y: spot.y, ticks: 0 };
    }

    // Jumps onto a spot, if there's room for it there
    private leapTo(enemy: Enemy, spot: { x: number; y: number }): void {
        const tileX = Math.floor(spot.x);
        const tileY = Math.floor(spot.y);
        if (
            !this.grid.contains(tileX, tileY) ||
            !this.flowField.isReachable(tileX, tileY) ||
            !isCircleFree(this.grid, spot.x, spot.y, enemy.radius)
        ) {
            return;
        }
        enemy.x = enemy.prevX = spot.x;
        enemy.y = enemy.prevY = spot.y;
        enemy.vx = enemy.vy = 0;
    }

    // Blinks to a free spot about attack.radius tiles from the player
    private teleportBoss(enemy: Enemy, attack: BossAttackDef): void {
        const player = this.player;
        const spot = this.findSpotNear(player.x, player.y, attack.radius ?? 7, enemy.radius);
        if (!spot) {
            return;
        }
        if (attack.castSpotAnim !== undefined) {
            this.addEffect(attack.castSpotAnim, enemy.x, enemy.y, 0, 60);
        }
        enemy.x = enemy.prevX = spot.x;
        enemy.y = enemy.prevY = spot.y;
        enemy.vx = enemy.vy = 0;
        if (attack.impactSpotAnim !== undefined) {
            this.addEffect(attack.impactSpotAnim, spot.x, spot.y, 0, 60);
        }
    }

    private stepEnemyProjectiles(): void {
        for (const projectile of this.enemyProjectiles) {
            projectile.prevX = projectile.x;
            projectile.prevY = projectile.y;
            projectile.life--;
            // A wave or a boomerang goes through everyone
            if (projectile.hit) {
                this.stepThrough(projectile, projectile.hit);
                if (this.runOver) {
                    return;
                }
                continue;
            }
            // At whoever's nearest
            this.use(this.nearestHero(projectile.x, projectile.y));
            const player = this.player;
            const dx = player.x - projectile.x;
            const dy = player.y - projectile.y;
            if (projectile.homing > 0) {
                // Turn towards the player, a little each tick
                const heading = fm.atan2(projectile.vy, projectile.vx);
                let turn = fm.atan2(dy, dx) - heading;
                turn = fm.atan2(fm.sin(turn), fm.cos(turn));
                const angle =
                    heading + Math.max(-projectile.homing, Math.min(projectile.homing, turn));
                projectile.vx = fm.cos(angle) * projectile.speed;
                projectile.vy = fm.sin(angle) * projectile.speed;
                projectile.yaw = yawFromVector(projectile.vx, projectile.vy);
            }
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;
            if (
                this.floor?.hasPillars &&
                this.floor.isPillarTile(Math.floor(projectile.x), Math.floor(projectile.y))
            ) {
                projectile.life = 0;
                continue;
            }
            if (projectile.attack.blockable && this.hitsGlyph(projectile)) {
                projectile.life = 0;
                continue;
            }
            const reach = projectile.radius + player.radius;
            if (
                projectile.life > 0 &&
                fm.hypot(player.x - projectile.x, player.y - projectile.y) <= reach
            ) {
                projectile.life = 0;
                // A crowd's shot doesn't land on a player just hit (bosses' do)
                if (projectile.crowd && player.invulnerable > 0) {
                    continue;
                }
                if (this.inSafeMark(projectile.attack)) {
                    this.emit({ type: "notice", message: "The circle shields you!" }, true);
                    continue;
                }
                const enemy = this.enemies.find((e) => e.uid === projectile.enemyUid);
                this.bossHit(projectile.enemyId, enemy, projectile.attack, projectile.damage);
                if (this.runOver) {
                    return;
                }
            }
        }
    }

    // Whether a blockable projectile has run into its boss's glyph (which
    // breaks it)
    private hitsGlyph(projectile: EnemyProjectile): boolean {
        const glyph = this.glyphs.find((g) => g.bossUid === projectile.enemyUid);
        const boss = glyph && this.enemies.find((e) => e.uid === glyph.bossUid);
        const width = boss?.def.boss?.glyph?.width;
        if (!glyph || width === undefined) {
            return false;
        }
        if (fm.hypot(projectile.x - glyph.x, projectile.y - glyph.y) > width + projectile.radius) {
            return false;
        }
        const impact = projectile.attack.impactSpotAnim;
        if (impact !== undefined) {
            this.addEffect(impact, projectile.x, projectile.y, 0, 30);
        }
        return true;
    }

    // A boss attack hitting the player. Unlike a crowd's hits these land
    // whenever they connect (a hit a moment ago doesn't stop them), unless
    // the player was just revived.
    private bossHit(
        enemyId: string,
        enemy: Enemy | undefined,
        attack: BossAttackDef,
        damage: number,
        showImpact = true,
    ): void {
        const player = this.player;
        if (this.reviving || this.runOver || this.hero.down) {
            return;
        }
        if (showImpact && attack.impactSpotAnim !== undefined) {
            this.addEffect(attack.impactSpotAnim, player.x, player.y, 0, 30);
        }
        const amount = this.damagePlayer(
            damage,
            enemyId,
            false,
            attack.hitSound,
            attack.ignoreArmor,
        );
        if (amount > 0) {
            this.damageByAttack[attack.name] = (this.damageByAttack[attack.name] ?? 0) + amount;
        }
        const lifesteal = enemy?.def.boss?.lifesteal ?? 0;
        if (enemy && lifesteal > 0 && !enemy.dead) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.round(amount * lifesteal));
        }
        if (this.runOver || this.reviving) {
            return;
        }
        if (attack.effect) {
            this.applyPlayerEffect(attack.effect, enemy);
        }
        const akkha = enemy?.def.boss?.akkha;
        if (attack.elemental && akkha && this.tombsPathRoom?.boss?.quadrants) {
            this.akkhaElement(akkha, enemy);
        }
        this.recoil(enemy);
    }

    // enemy: the boss that did it, which keeps any coins it steals
    applyPlayerEffect(effect: PlayerEffectDef, enemy?: Enemy): void {
        const player = this.player;
        if (effect.kind === "steal") {
            const state = enemy?.bossState;
            const up = this.heroes.filter((hero) => this.isUp(hero)).length;
            const amount = Math.floor((this.coins * effect.fraction) / Math.max(1, up));
            if (state && amount > 0 && !enemy.dead) {
                this.coins -= amount;
                state.stolenCoins += amount;
                this.emit({ type: "coinsStolen", enemyId: enemy.def.id, amount });
            }
            return;
        }
        if (effect.kind === "curse") {
            const matrix = CURSE_SHUFFLES[this.rng.int(CURSE_SHUFFLES.length)];
            this.curse = { matrix, attacksLeft: effect.attacks };
            this.emit({ type: "playerCursed", cursed: true });
            return;
        }
        if ((effect.kind === "poison" || effect.kind === "debuff") && this.cured) {
            return;
        }
        const ticks = Math.round(effect.seconds * TICKS_PER_SECOND);
        switch (effect.kind) {
            case "freeze":
                player.frozen = Math.max(player.frozen, ticks);
                this.addEffect(FREEZE_SPOTANIM, player.x, player.y, 0, ticks);
                break;
            case "poison":
                // A new dose starts the clock again, at the stronger damage (in the Tombs, as the
                // raid level makes enemies' hits, and a boss's own ease, BossDef.raidEase)
                player.poisonDamage = Math.max(
                    player.poisonDamage,
                    this.map.tombs
                        ? Math.max(
                              1,
                              Math.round(
                                  effect.damage *
                                      this.hardScale.damage *
                                      ((enemy && this.raidEase(enemy.def)?.damage) ?? 1),
                              ),
                          )
                        : effect.damage,
                );
                player.poisonEnd = this.tick + ticks;
                break;
            case "debuff":
                this.debuffs = this.debuffs
                    .filter((d) => d.id !== effect.id)
                    .concat({
                        ...this.stackDebuff(effect),
                        startTick: this.tick,
                        endTick: this.tick + ticks,
                    });
                this.updateStats();
                break;
            case "drowsy":
                this.drowsyEndTick = this.tick + ticks;
                this.drowsyInterval = effect.bossInterval;
                this.debuffs = this.debuffs.filter((d) => d.id !== effect.id);
                this.debuffs.push({
                    id: effect.id,
                    name: effect.name,
                    iconObjId: effect.iconObjId,
                    stats: { moveSpeed: effect.moveSpeed },
                    startTick: this.tick,
                    endTick: this.tick + ticks,
                });
                this.updateStats();
                break;
        }
    }

    // The boss with its bar on screen: the final boss once it's up (one still
    // standing, of the Inferno's three Jads; the last one's empty bar stays on
    // the victory screen), otherwise the latest to turn up that's still alive,
    // or of several that came together (Pest Control's four portals) the
    // nearest
    get shownBoss(): Enemy | undefined {
        let shown: Enemy | undefined;
        let fallen: Enemy | undefined;
        for (const enemy of this.enemies) {
            if (enemy.finalBoss && !enemy.dead) {
                return enemy;
            }
            if (enemy.finalBoss && !this.endless) {
                fallen = enemy;
            }
            if (enemy.boss && !enemy.dead) {
                shown = enemy;
            }
        }
        if (fallen) {
            return fallen;
        }
        if (shown && this.funBossGroup.includes(shown)) {
            const player = this.player;
            let nearest = Infinity;
            for (const boss of this.funBossGroup) {
                const distance = fm.hypot(boss.x - player.x, boss.y - player.y);
                if (!boss.dead && distance < nearest) {
                    nearest = distance;
                    shown = boss;
                }
            }
        }
        return shown;
    }

    // Whether a final boss is still standing (a dead one is marked dead
    // before this is asked)
    private finalBossLeft(): boolean {
        return this.enemies.some((enemy) => enemy.finalBoss && !enemy.dead);
    }

    private playerDied(): void {
        const player = this.player;
        if (this.revivesLeft > 0) {
            this.revivesLeft--;
            player.hp = player.maxHp;
            player.invulnerable = 3 * TICKS_PER_SECOND;
            this.emit({ type: "revive" });
            return;
        }
        player.hp = 0;
        player.deathTick = this.tick;
        this.hero.down = true;
        this.hero.outTick = this.tick;
        // OSRS's: a death in the Tombs costs a fifth of your points
        if (this.map.tombs) {
            this.hero.tombsDowns++;
            this.hero.tombsPoints *= 1 - TOMBS_POINTS.deathLoss;
        }
        if (!this.heroes.some((hero) => this.isUp(hero))) {
            if (this.tombsPath !== undefined && this.tombsDeaths < this.tombsDeathsAllowed) {
                this.failTombsRoom();
                return;
            }
            if (this.tombsWardens && this.tombsDeaths < this.tombsDeathsAllowed) {
                this.failWardens();
                return;
            }
            this.endRun("dead");
            return;
        }
        // Co-op: they're out of the fight until a teammate revives them (or
        // for the rest of the run), and the rest fight on
        player.prevX = player.x;
        player.prevY = player.y;
        player.moving = false;
        player.poisonEnd = -1;
        player.poisonDamage = 0;
        this.hero.revive = undefined;
        this.emit({ type: "heroDown" });
        this.rescaleParty();
    }

    // Co-op: a downed hero comes back once a teammate's stood over them long
    // enough. Stepping away starts over, and the first to stand there does it
    // until they step away.
    private stepRevives(): void {
        for (const downed of this.heroes) {
            if (!this.canBeRevived(downed)) {
                downed.revive = undefined;
                continue;
            }
            const current = downed.revive && this.heroes[downed.revive.hero];
            const reviver =
                current && this.isReviving(current, downed)
                    ? current
                    : this.heroes.find((hero) => this.isReviving(hero, downed));
            if (!reviver) {
                downed.revive = undefined;
                continue;
            }
            if (downed.revive?.hero !== reviver.index) {
                downed.revive = { hero: reviver.index, ticks: 0 };
                this.addEffect(
                    REVIVE_SPOTANIM,
                    reviver.player.x,
                    reviver.player.y,
                    0,
                    REVIVE_TICKS,
                );
            }
            downed.revive.ticks++;
            if (downed.revive.ticks >= REVIVE_TICKS) {
                this.reviveHero(downed, reviver);
            }
        }
    }

    // Whether a hero's up and standing over a downed one
    private isReviving(hero: Hero, downed: Hero): boolean {
        return (
            hero !== downed &&
            this.isUp(hero) &&
            fm.hypot(hero.player.x - downed.player.x, hero.player.y - downed.player.y) <=
                REVIVE_RANGE
        );
    }

    // Co-op: a teammate's brought a downed hero back, with less of their
    // hitpoints each time, and nothing can hurt them for a while. Level ups
    // the party had while they were down are theirs to choose now.
    private reviveHero(downed: Hero, by: Hero): void {
        const player = downed.player;
        const fraction = REVIVE_HP[Math.min(downed.revived, REVIVE_HP.length - 1)];
        downed.revived++;
        downed.revive = undefined;
        downed.down = false;
        downed.outTick = -1;
        downed.immuneEndTick = this.tick + REVIVE_IMMUNITY_TICKS;
        player.hp = Math.max(1, Math.round(player.maxHp * fraction));
        player.deathTick = -1;
        player.invulnerable = IMMUNE_INVULNERABLE_TICKS;
        player.flash = 0;
        player.frozen = 0;
        downed.curse = undefined;
        downed.parasite = undefined;
        downed.hold = undefined;
        downed.drowsyEndTick = 0;
        this.as(downed.index, () => this.emit({ type: "heroRevived", by: by.index }));
        this.rescaleParty();
        this.as(this.focus, () => this.checkLevelUp());
    }

    // Co-op: the crowd and its bosses for the players still up, and half of
    // each one who's down or gone
    private rescaleParty(): void {
        const up = this.heroes.filter((hero) => this.isUp(hero)).length;
        this.partyScale = getPartyScale(up + (this.heroes.length - up) * PLAYER_GONE);
    }

    // Returns the damage done (0 if it was already dead, or what a clamp let through). mightScale
    // multiplies the player's damage bonus (Tumeken's shadow triples it; 0
    // leaves out the bonuses to damage, bosses' included); poison is for venom's damage, which shows as a poison splat.
    damageEnemy(
        enemy: Enemy,
        baseDamage: number,
        knockback: number,
        fromX: number,
        fromY: number,
        mightScale = 1,
        poison = false,
    ): number {
        if (enemy.dead || enemy.def.unhittable) {
            return 0;
        }
        // Hit by the player, it's after the player from now on
        enemy.aggro = true;
        if (enemy.shieldEnd > this.tick) {
            this.showBlocked(enemy);
            return 0;
        }
        // Balance each weapon's damage once, including venom, burns and extra
        // hits. Items, power-ups and recoil keep their own damage rules.
        const weaponScale = this.weaponDamageMultipliers[this.damageSource] ?? 1;
        if (weaponScale === 0) {
            return 0;
        }
        const drain = enemy.drainEnd > this.tick ? enemy.drain : 0;
        // The Wardens' second phase: only its open style gets at the Warden (wardenTakes)
        const wardens = this.tombsWardens;
        const two = wardens?.phase === 2 ? wardens.two : undefined;
        const three = wardens?.phase === 3 ? wardens.three : undefined;
        const kephri = this.tombsKephri;
        const style = this.sourceStyle;
        if (
            two &&
            !poison &&
            enemy.uid === two.wardenUid &&
            style !== undefined &&
            style !== enemy.def.onlyStyle
        ) {
            this.showBlocked(enemy);
            return 0;
        }
        // The last phase: nothing gets at the Warden while it charges, its siphons out
        if (three?.siphons && enemy.uid === three.wardenUid) {
            this.showBlocked(enemy);
            return 0;
        }
        // Expert mode: a Nylocas only takes its own style from weapons
        if (!poison && this.wrongStyle(enemy)) {
            this.showBlocked(enemy);
            return 0;
        }
        // A prayer that blocks a style whole (Akkha's overheads)
        if (!poison && this.prayedAgainst(enemy) === 0) {
            this.showBlocked(enemy);
            return 0;
        }
        // Akkha's shadows: the first struck is the one, the rest out of reach (the same tick's
        // other hits too, before their shields go up)
        const akkha = this.tombsAkkha;
        if (!poison && akkha && akkha.shadows.some((s) => s.uid === enemy.uid)) {
            if (akkha.shadowStruck === undefined) {
                akkha.shadowStruck = enemy.uid;
                const message = this.enemies.find((e) => e.uid === akkha.uid)?.def.boss?.akkha
                    ?.shadows.struckMessage;
                if (message) {
                    this.emit({ type: "notice", message });
                }
            } else if (akkha.shadowStruck !== enemy.uid) {
                this.showBlocked(enemy);
                return 0;
            }
        }
        // On normal, a colour's other styles do only a share (BossDef.colours.offStyle); on expert,
        // a Nylocas that isn't a boss takes more from its own (EnemyDef.expertOwnStyle)
        const offColour = poison ? 1 : this.offColour(enemy) * this.ownStyle(enemy);
        // And a staring boss turns a hit from in front back on whoever made it
        if (!poison && this.staredAt(enemy)) {
            this.showBlocked(enemy);
            const hero = this.hero;
            if (this.tick >= (hero.staredUntil ?? 0)) {
                hero.staredUntil =
                    this.tick + secondsToTicks(enemy.def.boss!.stare!.hitEvery ?? STARE_EVERY);
                // As its own hits do: hard's share, and armour taking at most its cap (damagePlayer)
                this.damagePlayer(
                    enemy.def.boss!.stare!.damage * enemy.damageScale,
                    enemy.def.id,
                    false,
                );
            }
            return 0;
        }
        const naps = enemy.def.boss?.naps;
        const guard = naps && !this.isNapping(enemy) ? naps.awakeDamage : 1;
        // Its guard down after a miss, or stunned (BossDef.guard)
        const opened = this.isExposed(enemy)
            ? (enemy.def.boss?.guard?.damage ?? 1)
            : this.obeliskFlickers(enemy)
              ? WARDENS.flicker!.damage
              : 1;
        const prayed = this.prayedAgainst(enemy) * guard * offColour * opened;
        // Damage that ignores the damage bonus (mightScale 0: the nuke's share
        // of a boss's hitpoints, a ruby bolt's) ignores this one too
        const bossMight = enemy.boss && mightScale > 0 ? this.stats.bossMight : 0;
        // The Wardens' orbs soaked: each more against their obelisk (WARDENS.orbs.soak)
        const wardensFight = this.tombsWardens;
        const soaked =
            mightScale > 0 && wardensFight?.phase === 1 && enemy.uid === wardensFight.obeliskUid
                ? 1 + WARDENS.orbs.soak.bonus * this.hero.wardenEnergy
                : 1;
        const damage = Math.max(
            1,
            Math.round(
                baseDamage *
                    weaponScale *
                    (1 + this.stats.might * mightScale) *
                    (1 + bossMight) *
                    soaked *
                    (1 + drain) *
                    prayed *
                    this.rng.range(0.85, 1.15),
            ),
        );
        const phase = enemy.bossState?.phase;
        // All a hit can get at is its shield, in a fight with totems
        const shielded = phase !== undefined && phase.stage !== "hp";
        let shown = damage;
        // The Tombs' points go by the boss's hitpoints taken (a core's off its Warden)
        const worth = this.tombsWorth(enemy);
        const pointsTo =
            worth > 0 && two && enemy.uid === two.kneel?.coreUid
                ? this.enemies.find((e) => e.uid === two.wardenUid)
                : enemy;
        const hpBefore = pointsTo?.hp ?? 0;
        const enemyBefore = enemy.hp;
        if (shielded) {
            phase.shield -= damage;
        } else if (two && (enemy.uid === two.wardenUid || enemy.uid === two.kneel?.coreUid)) {
            shown = this.wardenTakes(enemy, damage, two);
        } else if (three && enemy.uid === three.wardenUid) {
            const before = enemy.hp;
            enemy.hp = this.wardenThreeHp(enemy, three, enemy.hp - damage);
            shown = Math.max(0, Math.round(before - enemy.hp));
        } else if (wardens?.phase === 1 && enemy.uid === wardens.obeliskUid) {
            // Held till the first pyramids have come and gone
            const held =
                wardens.pyramidsDone === undefined || this.tick < wardens.pyramidsDone
                    ? Math.round(enemy.maxHp * WARDENS.holdShare)
                    : 0;
            const before = enemy.hp;
            enemy.hp = Math.max(Math.min(enemy.hp, held), enemy.hp - damage);
            shown = Math.max(0, Math.round(before - enemy.hp));
        } else if (kephri && enemy.uid === kephri.uid && !kephri.final) {
            // Off her shield: what it took is what's shown, and what the points go by (her three
            // shields come to her hitpoints, so they're worth what those were)
            shown = this.kephriTakes(enemy, kephri, damage);
        } else if (
            akkha &&
            enemy.uid === akkha.uid &&
            akkha.shadowsDone < (enemy.def.boss?.akkha?.shadows.at.length ?? 0)
        ) {
            // Down to his next share and no further: the shadows come there, whatever the hit
            const floor = enemy.maxHp * enemy.def.boss!.akkha!.shadows.at[akkha.shadowsDone];
            const before = enemy.hp;
            enemy.hp = Math.max(Math.min(enemy.hp, floor), enemy.hp - damage);
            shown = Math.max(0, Math.round(before - enemy.hp));
        } else {
            enemy.hp -= damage;
        }
        enemy.flash = 5;
        // A Tombs boss's phase stops a hit at its threshold (passThreshold, lastStand, below): what
        // went past it isn't taken, for its points or for life steal
        const floor = worth > 0 && phase && !shielded ? this.phaseFloor(enemy, phase) : 0;
        if (worth > 0 && pointsTo) {
            const onShield = kephri && enemy.uid === kephri.uid && hpBefore > 0 && !kephri.final;
            const left = Math.max(pointsTo === enemy ? floor : 0, pointsTo.hp, 0);
            const taken = onShield ? shown : Math.max(0, hpBefore - left);
            // Shared out by damage in co-op: a fair share of each boss is its whole worth
            const party = this.heroes.filter((hero) => !hero.left).length;
            const points = (taken / pointsTo.maxHp) * worth * party;
            this.hero.tombsPoints += points;
            // What's to spend is whole points, as the Theatre's are: the whole ones this crossed
            const gross = this.hero.tombsGross;
            this.hero.tombsGross += points;
            this.hero.raidPoints += Math.floor(this.hero.tombsGross) - Math.floor(gross);
        }
        const source = this.damageSource;
        this.damageBySource[source] = (this.damageBySource[source] ?? 0) + shown;
        this.hero.recentDamage[this.tick % DPS_WINDOW_TICKS] += shown;
        this.highestHit = Math.max(this.highestHit, shown);
        this.emit({
            type: "damage",
            x: enemy.x,
            y: enemy.y,
            amount: shown,
            enemyUid: enemy.uid,
            enemyId: enemy.def.id,
            ...(poison && { poison }),
        });
        const resist = enemy.def.knockbackResist ?? 0;
        if (knockback > 0 && resist < 1 && !enemy.boss && !enemy.def.stationary) {
            const dx = enemy.x - fromX;
            const dy = enemy.y - fromY;
            const len = fm.hypot(dx, dy);
            if (len > 0.001) {
                const k = (knockback * (1 - resist)) / 4;
                enemy.vx += (dx / len) * k;
                enemy.vy += (dy / len) * k;
            }
        }
        if (shielded) {
            if (phase.shield <= 0) {
                this.breakShield(enemy, phase);
            }
        } else if (enemy.totemOf) {
            if (enemy.hp <= 0) {
                this.totemCharged(enemy, enemy.totemOf);
            }
        } else if (phase && this.passThreshold(enemy, phase)) {
            // On to its next phase, whatever the hit would have taken
        } else if (enemy.hp <= 0 && phase && this.lastStand(enemy, phase)) {
            // Up for its finale instead
        } else if (enemy.hp <= 0 && !this.riseAgain(enemy)) {
            this.killEnemy(enemy);
        }
        // What it really took, so life steal and heals go by that, not the hit a clamp cut short;
        // never more than the hit, though (the Wardens' core passes on five times what it takes)
        const landed = Math.min(damage, shown);
        return floor > 0 ? Math.min(landed, Math.max(0, Math.round(enemyBefore - floor))) : landed;
    }

    // cause: the player's doing (the bot nuke's too, though what it kills
    // doesn't split or blow up), or another faction's enemy (which drops
    // nothing and isn't the player's kill, so luring armies into each other
    // isn't free experience, and the ground doesn't fill with bones far away)
    private killEnemy(enemy: Enemy, cause: "player" | "nuke" | "enemy" = "player"): void {
        this.countDeath(enemy);
        enemy.dead = true;
        enemy.hp = 0;
        enemy.deathTick = this.tick;
        enemy.anim = "death";
        enemy.animStart = this.tick;
        enemy.vx = enemy.vy = 0;
        // A light it carried stays where it fell for a while (EnemyDef.light)
        const leaves = this.lighting && enemy.def.light?.left;
        if (leaves) {
            this.leftLights.push({
                id: enemy.uid,
                x: enemy.x,
                y: enemy.y,
                look: leaves,
                startTick: this.tick,
                endTick: this.tick + Math.round(leaves.seconds * TICKS_PER_SECOND),
            });
        }
        const byEnemy = cause === "enemy";
        // Co-op: a boss's copies are one boss, killed when the last one falls
        const lastCopy = !this.encounterLeft(enemy);
        // One brought back by a reviver was counted the first time it died
        if (!byEnemy && !enemy.noDrops) {
            this.kills++;
            if (lastCopy) {
                this.enemyKills[enemy.def.id] = (this.enemyKills[enemy.def.id] ?? 0) + 1;
            }
            const source = this.damageSource;
            this.killsBySource[source] = (this.killsBySource[source] ?? 0) + 1;
        }
        if (enemy.boss) {
            if (lastCopy) {
                this.bossesKilled.push(enemy.def.id);
                this.bossKills.push({ enemyId: enemy.def.id, seconds: this.seconds });
            }
            // A boss's glyph goes with it, rather than hanging about on the
            // victory screen
            this.glyphs = this.glyphs.filter((glyph) => glyph.bossUid !== enemy.uid);
            this.endBossFight(enemy);
            this.enragePartners(enemy);
        }
        this.emit({
            type: "kill",
            enemyUid: enemy.uid,
            enemyId: enemy.def.id,
            boss: enemy.boss,
            x: enemy.x,
            y: enemy.y,
            ...(byEnemy && { byEnemy }),
        });

        if (!byEnemy && !enemy.noDrops) {
            this.dropLoot(enemy);
        } else if (
            !byEnemy &&
            !enemy.boss &&
            !this.invoked("on_a_diet") &&
            this.tombsBossFood() > 0 &&
            this.rng.chance(this.tombsBossFood())
        ) {
            // A Tombs boss's adds drop nothing else, but now and then food (tombsBossFood)
            this.dropPickup("food", enemy.x, enemy.y, Math.round(FOOD_HEAL * this.healScale));
        }
        if (!enemy.boss && !enemy.rolls) {
            this.dropTombsPeel(enemy);
        }
        if (enemy.boss) {
            this.funBossDown(enemy);
        }
        if (!enemy.boss && !enemy.elite && !enemy.noDrops) {
            // For revivers
            this.deaths.push({
                def: enemy.def,
                variant: enemy.variant,
                x: enemy.x,
                y: enemy.y,
                tick: this.tick,
            });
            if (this.deaths.length > MAX_DEATHS) {
                this.deaths.shift();
            }
        }
        if (cause !== "nuke") {
            this.splitUp(enemy);
            this.explode(enemy);
        }

        const stolen = enemy.bossState?.stolenCoins ?? 0;
        if (stolen > 0) {
            this.coins += stolen;
            enemy.bossState!.stolenCoins = 0;
            this.emit({ type: "coinsReturned", enemyId: enemy.def.id, amount: stolen });
        }

        // With the last of the final bosses (the Inferno has three)
        if (enemy.finalBoss && !this.finalBossLeft()) {
            const fall = enemy.def.boss?.fallSeconds;
            if (this.endless) {
                this.nextRound();
            } else if (fall) {
                // Its death first, with nothing landing meanwhile (stepRun)
                this.victoryAt = this.tick + secondsToTicks(fall);
                this.fellTick = this.tick;
                if (this.map.tombs) {
                    this.openTombsChest();
                }
            } else {
                if (this.map.raid) {
                    this.scoreRaidRoom();
                    this.openRaidChest();
                }
                this.endRun("victory");
            }
        }
    }

    // One of a pool that came together is down (FunMapDef.bosses.together):
    // with the last of them, their casket drops and the next lot is due in a
    // few minutes
    private funBossDown(enemy: Enemy): void {
        const together = this.map.fun?.bosses.together;
        if (!together || !this.funBossGroup.includes(enemy)) {
            return;
        }
        if (this.funBossGroup.some((boss) => !boss.dead)) {
            return;
        }
        this.funBossGroup = [];
        this.dropCasketOfTier(together.casket, enemy.x - 0.4, enemy.y + 0.4);
        this.emit({ type: "notice", message: together.message });
        this.nextFunBossSeconds = this.seconds + this.rng.range(...this.map.fun!.bosses.every);
    }

    // Splits into smaller enemies where it died (EnemyDef.splits)
    private splitUp(enemy: Enemy): void {
        const splits = enemy.def.splits;
        if (!splits) {
            return;
        }
        const into = getEnemy(splits.into);
        for (let i = 0; i < splits.count; i++) {
            // Where it was, if there's no room around it
            const part =
                this.spawnNear(enemy, into, 0.7, i, splits.count, 3) ??
                this.spawnEnemy(into, "normal", { x: enemy.x, y: enemy.y });
            if (part) {
                part.noDrops = enemy.noDrops;
            }
        }
        if (splits.spotAnim !== undefined) {
            this.addEffect(splits.spotAnim, enemy.x, enemy.y, 0, 40);
        }
    }

    // Still standing as its time comes: it's gone, and what was in it comes
    // out where it stood (EnemyDef.hatches)
    private hatch(enemy: Enemy): void {
        const hatches = enemy.def.hatches!;
        const into = getEnemy(hatches.into);
        for (let i = 0; i < hatches.count; i++) {
            const out =
                this.spawnNear(enemy, into, 0.7, i, hatches.count, 3) ??
                this.spawnEnemy(into, "normal", { x: enemy.x, y: enemy.y });
            if (out) {
                out.noDrops = true;
            }
        }
        if (hatches.spotAnim !== undefined) {
            this.addEffect(hatches.spotAnim, enemy.x, enemy.y, 0, 40);
        }
        this.emit({
            type: "bossAttack",
            enemyId: enemy.def.id,
            sound: hatches.sound ?? -1,
            x: enemy.x,
            y: enemy.y,
        });
        this.vanish(enemy);
    }

    // Blows up where it died (EnemyDef.explodes), hurting the player if
    // they're in reach. It lands like a boss's attack, a hit a moment ago or
    // not.
    private explode(enemy: Enemy): void {
        const explodes = enemy.def.explodes;
        if (!explodes) {
            return;
        }
        if (explodes.spotAnim !== undefined) {
            this.addEffect(explodes.spotAnim, enemy.x, enemy.y, 0, 40);
        }
        this.emit({ type: "blast", x: enemy.x, y: enemy.y, radius: explodes.radius });
        if (explodes.sound !== undefined) {
            this.emit({
                type: "bossAttack",
                enemyId: enemy.def.id,
                sound: explodes.sound,
                x: enemy.x,
                y: enemy.y,
            });
        }
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (
                !this.runOver &&
                !this.reviving &&
                fm.hypot(player.x - enemy.x, player.y - enemy.y) <= explodes.radius + player.radius
            ) {
                this.damagePlayer(explodes.damage * enemy.damageScale, enemy.def.id, enemy.elite);
            }
        });
        // Its own pack too, scaled as their hitpoints were, so it's the same share of them anywhere
        if (explodes.pack) {
            const source = this.damageSource;
            this.damageSource = "other";
            for (const other of this.enemies) {
                if (
                    other !== enemy &&
                    !other.dead &&
                    !other.boss &&
                    fm.hypot(other.x - enemy.x, other.y - enemy.y) <= explodes.radius + other.radius
                ) {
                    this.damageEnemy(
                        other,
                        explodes.pack * (other.maxHp / Math.max(1, other.def.hp)),
                        0.3,
                        enemy.x,
                        enemy.y,
                    );
                }
            }
            this.damageSource = source;
        }
    }

    // Bones, and now and then a casket, coins, food or a power-up
    private dropLoot(enemy: Enemy): void {
        // A raid boss's adds drop nothing: the room's the boss's
        if (this.map.raid && this.raidStage !== "waves" && !enemy.boss) {
            return;
        }
        // A Tombs room tried again: the waves already beaten give nothing
        if (this.tombsReplaying) {
            return;
        }
        // Co-op: one of a boss's copies, whose loot comes with the last to fall
        const last = !this.encounterLeft(enemy);
        // A boss fight (MapDef.fight) drops nothing, from her or hers: no
        // bones, caskets, coins, food or power-ups, only the collection log's
        if (this.map.fight) {
            if (last) {
                this.rollBossTrophies(enemy);
            }
            return;
        }
        this.dropPickup("bones", enemy.x, enemy.y, enemy.xp);
        if (!last) {
            return;
        }
        this.rollBossTrophies(enemy);
        if (enemy.bonesOnly) {
            return;
        }
        const luck = 1 + this.stats.luck;
        const caskets = enemy.def.caskets;
        if (enemy.elite) {
            this.dropCasket(enemy.x + 0.4, enemy.y, true);
        } else if (enemy.boss && !enemy.finalBoss && caskets) {
            // Its own caskets instead of the usual one
            caskets.forEach((tier, i) => {
                this.dropCasketOfTier(tier, enemy.x + 0.4, enemy.y + i * 0.6);
            });
        } else if (enemy.boss && (!enemy.finalBoss || this.endless)) {
            // An endless round's final boss always drops a master casket (the
            // last of them, where there are several)
            const master = enemy.finalBoss && !this.finalBossLeft();
            this.dropCasketOfTier(
                master ? "master" : rollBossCasketTier(this.rng, this.stats.luck),
                enemy.x + 0.4,
                enemy.y,
                master,
            );
        } else if (
            !enemy.boss &&
            this.rng.chance(CASKET_DROP_CHANCE * luck * this.partyScale.caskets)
        ) {
            this.dropCasket(enemy.x + 0.3, enemy.y, false);
        } else if (this.rng.chance(0.03 * luck)) {
            this.dropPickup("coins", enemy.x + 0.3, enemy.y + 0.2, 1 + this.rng.int(5));
        } else if (!this.invoked("on_a_diet") && this.rng.chance(FOOD_DROP_CHANCE * luck)) {
            this.dropPickup("food", enemy.x - 0.3, enemy.y, Math.round(FOOD_HEAL * this.healScale));
        }
        if (!enemy.boss) {
            this.rollPowerUp(enemy.x - 0.3, enemy.y + 0.3);
            this.rollPumpkin(enemy.x + 0.3, enemy.y - 0.3);
        }
    }

    // Endless runs: the final boss is down, so the map comes round again,
    // its waves and bosses from five minutes in and everything tougher
    private nextRound(): void {
        this.round++;
        this.roundStartTick = this.tick;
        const events = this.map.events;
        const first = events.findIndex((e) => e.at >= LATER_ROUND_START);
        this.eventIndex = first === -1 ? events.length : first;
        this.bossSpawned = false;
        this.emit({ type: "roundStarted", round: this.round });
    }

    // at: when it ended, for the run's time, when that's before now (a final
    // boss's fall, with its death played out since)
    private endRun(state: "dead" | "victory", at = this.tick): void {
        // A result stands, except that the final boss falling in the same tick
        // as the last player wins, whichever came first (weapons still fire in
        // that tick, see stepRun)
        if (this.runOver && !(state === "victory" && this.tick === this.endTick)) {
            return;
        }
        if (state === "victory" && this.runOver) {
            // Whoever fell in that tick didn't: they're up for the victory
            // screen, on the last of their hitpoints
            for (const hero of this.heroes) {
                if (hero.down && hero.outTick === this.tick) {
                    hero.down = false;
                    hero.outTick = -1;
                    hero.player.deathTick = -1;
                    hero.player.hp = Math.max(hero.player.hp, 1);
                }
            }
        }
        this.endTick = at;
        this.state = state;
        // Everything stands still from here on; idle rather than walk on the spot
        for (const enemy of this.enemies) {
            enemy.prevX = enemy.x;
            enemy.prevY = enemy.y;
        }
    }

    // ---- Weapons ----

    // Past the last level (endless runs) is the last level, with more damage
    private getLevel(weapon: WeaponState) {
        const levels = weapon.def.levels;
        return levels[Math.min(weapon.level, levels.length) - 1];
    }

    // speed: a bonus of the weapon's own on top of the player's cooldown
    // bonus (a set's), the two together capped like the player's alone
    private cooldownTicks(seconds: number, speed = 0): number {
        const bonus = 1 - (1 - Math.min(this.stats.cooldown, 0.6)) * (1 - speed);
        return Math.max(5, Math.round(seconds * TICKS_PER_SECOND * (1 - Math.min(bonus, 0.6))));
    }

    // A weapon's level with what else changes it folded in: its bonus damage
    // from rare rolls, its style's damage bonus (Rigour's, the rings'), the
    // worn sets' boosts to it, and for auras their own area bonus (the
    // Ancient sceptre's). The sets' speed boost isn't in it (see setBoosts).
    private getEffectiveLevel(weapon: WeaponState): WeaponDef["levels"][number] {
        const level = this.getLevel(weapon);
        const def = weapon.def;
        const boosts = this.setBoosts(def);
        const damage =
            (1 + weapon.bonus) * (1 + this.styleMight(getWeaponStyle(def))) * boosts.damage;
        const area = (def.kind === "aura" ? 1 + this.stats.auraArea : 1) * boosts.area;
        if (damage === 1 && area === 1) {
            return level;
        }
        return { ...level, damage: level.damage * damage, area: level.area * area };
    }

    // What the worn sets do for a weapon: damage and area multipliers, and a
    // speed bonus that cooldownTicks caps along with the player's own
    private setBoosts(def: WeaponDef): { damage: number; area: number; speed: number } {
        let damage = 1;
        let area = 1;
        let slower = 1;
        for (const setId of this.activeSets) {
            const boost = getSet(setId).weapons;
            if (boost && (boost.kinds?.includes(def.kind) || boost.ids?.includes(def.id))) {
                damage *= 1 + (boost.damage ?? 0);
                slower *= 1 - (boost.cooldown ?? 0);
                area *= 1 + (boost.area ?? 0);
            }
        }
        return { damage, area, speed: 1 - slower };
    }

    private styleMight(style: CombatStyle): number {
        switch (style) {
            case "melee":
                return this.stats.meleeMight;
            case "ranged":
                return this.stats.rangedMight;
            case "magic":
                return this.stats.magicMight;
        }
    }

    private stepWeapons(): void {
        // On the move, only the weapon in hand's attacks are shown, and only
        // if it has a run pose (WeaponDef.runPose): the view plays them over
        // the run, and another weapon's would cut it short. Any other attack
        // on the move goes unshown, as always. Only for show, so in no hash.
        const held = this.player.moving ? this.getHeldWeapon() : undefined;
        const posed = held?.def.runPose !== undefined ? held : undefined;
        for (const weapon of this.weapons) {
            if (weapon.cooldown > 0) {
                weapon.cooldown--;
                continue;
            }
            const level = this.getEffectiveLevel(weapon);
            // A slash or sweep waits for something in reach, like a missile
            // waits for a target, rather than spending its cooldown on air
            if (
                (weapon.def.kind === "slash" || weapon.def.kind === "sweep") &&
                !this.meleeInReach(level, weapon.def)
            ) {
                weapon.cooldown = 10;
                continue;
            }
            const special = this.takeSpecial(weapon, level);
            this.damageSource = `weapon:${weapon.def.id}`;
            const fired = this.fireWeapon(weapon.def, level, special);
            // Nothing to shoot at: try again soon rather than wasting the cooldown
            weapon.cooldown = fired
                ? this.cooldownTicks(level.cooldown, this.setBoosts(weapon.def).speed)
                : 10;
            if (fired) {
                this.emit({
                    type: "weapon",
                    weaponId: weapon.def.id,
                    sound: special?.sound ?? level.sound ?? weapon.def.sound,
                    x: this.player.x,
                    y: this.player.y,
                });
            }
            if (fired && (!this.player.moving || weapon === posed)) {
                this.player.attackSeq = special?.playerSeq ?? weapon.def.playerSeq;
                this.player.attackStart = this.tick;
            }
        }
    }

    // Counts an attack, and returns the weapon's special attack if this one
    // is it. A special that's due waits until something is in reach, so it
    // isn't swung at nothing.
    private takeSpecial(
        weapon: WeaponState,
        level: WeaponDef["levels"][number],
    ): SpecialAttackDef | undefined {
        const special = weapon.def.special;
        if (!special) {
            return undefined;
        }
        const every = special.every * (this.invoked("overly_draining") ? 2 : 1);
        if (weapon.uses % every !== every - 1) {
            weapon.uses++;
            return undefined;
        }
        if (!this.meleeInReach(level, weapon.def)) {
            return undefined;
        }
        weapon.uses++;
        return special;
    }

    // Something a melee weapon at this level would hit
    private meleeInReach(level: WeaponDef["levels"][number], def: WeaponDef): boolean {
        const reach = level.area * (1 + this.stats.area);
        const player = this.player;
        return (
            this.nearestEnemies(player.x, player.y, reach + 0.5, 1, getWeaponStyle(def), true)
                .length > 0
        );
    }

    private fireWeapon(
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        special?: SpecialAttackDef,
    ): boolean {
        switch (def.kind) {
            case "slash":
                this.fireSlash(def, level, special);
                return true;
            case "sweep":
                this.fireSweep(def, level, special);
                return true;
            case "missile":
                return this.fireMissiles(def, level);
            case "knives":
                this.fireKnives(def, level);
                return true;
            case "axes":
                return this.fireAxes(def, level);
            case "aura":
                this.fireAura(def, level);
                return true;
            case "strike":
                return this.fireStrikes(def, level);
            case "orbit":
                this.fireOrbit(def, level);
                return true;
        }
    }

    // Where a melee attack aims: at the nearest enemy in reach, otherwise the
    // way the player faces (kiting means facing away from what's chasing you)
    private aimMelee(reach: number, def: WeaponDef): { x: number; y: number } {
        const player = this.player;
        const nearest = this.nearestEnemies(
            player.x,
            player.y,
            reach + 1.5,
            1,
            getWeaponStyle(def),
            true,
        )[0];
        if (nearest) {
            const dx = nearest.x - player.x;
            const dy = nearest.y - player.y;
            const len = fm.hypot(dx, dy);
            if (len > 0.001) {
                return { x: dx / len, y: dy / len };
            }
        }
        return { x: player.facingX, y: player.facingY };
    }

    private fireSlash(
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        special?: SpecialAttackDef,
    ): void {
        if (special?.aoe) {
            this.fireAoeSpecial(def, level, special, special.aoe);
            return;
        }
        const player = this.player;
        const reach = level.area * (1 + this.stats.area);
        const width = SLASH_WIDTH * (1 + this.stats.area);
        const sides = Math.min(level.amount, 2);
        const aim = this.aimMelee(reach, def);
        // Each side hits what's in it, so something right on top of the
        // player can be hit by both
        const hit: Enemy[] = [];
        for (let side = 0; side < sides; side++) {
            const dirX = side === 0 ? aim.x : -aim.x;
            const dirY = side === 0 ? aim.y : -aim.y;
            this.emit({
                type: "slash",
                x: player.x,
                y: player.y,
                dirX,
                dirY,
                reach,
                width,
                arc: SLASH_ARC,
                weaponId: def.id,
            });
            this.queryTouching(player.x, player.y, reach + 1, (enemy) => {
                const ox = enemy.x - player.x;
                const oy = enemy.y - player.y;
                const along = ox * dirX + oy * dirY;
                const across = Math.abs(ox * -dirY + oy * dirX);
                if (
                    along < -0.3 ||
                    along > reach + enemy.radius ||
                    across > width / 2 + enemy.radius
                ) {
                    return;
                }
                // A big one only if its edge reaches the box: past a corner, the box widened by
                // its radius takes in what's well clear of it
                if (enemy.radius > 1) {
                    const pastEnd = Math.max(0, along - reach);
                    const pastSide = Math.max(0, across - width / 2);
                    if (pastEnd * pastEnd + pastSide * pastSide > enemy.radius * enemy.radius) {
                        return;
                    }
                }
                hit.push(enemy);
            });
        }
        this.meleeHits(def, level, hit, special);
    }

    // Everything within reach in an arc either side of where it aims (and
    // behind too with amount 2), each hit once. Bosses and elites take the
    // weapon's extra hits; a special attack hits harder and does its effect.
    private fireSweep(
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        special?: SpecialAttackDef,
    ): void {
        if (special?.aoe) {
            this.fireAoeSpecial(def, level, special, special.aoe);
            return;
        }
        const player = this.player;
        const reach = level.area * (1 + this.stats.area);
        const arc = level.arc ?? SLASH_ARC;
        const sides = Math.min(level.amount, 2);
        const aim = this.aimMelee(reach, def);
        const hit = new Set<Enemy>();
        for (let side = 0; side < sides; side++) {
            const dirX = side === 0 ? aim.x : -aim.x;
            const dirY = side === 0 ? aim.y : -aim.y;
            this.emit({
                type: "slash",
                x: player.x,
                y: player.y,
                dirX,
                dirY,
                reach,
                width: 0,
                arc,
                weaponId: def.id,
            });
            this.queryTouching(player.x, player.y, reach + 1, (enemy) => {
                const ox = enemy.x - player.x;
                const oy = enemy.y - player.y;
                const dist = fm.hypot(ox, oy);
                if (enemy.dead || hit.has(enemy) || dist > reach + enemy.radius) {
                    return;
                }
                // Anything right on top of the player is in the way of the
                // swing, whichever way it goes
                const along = (ox * dirX + oy * dirY) / Math.max(dist, 0.001);
                const angle = fm.acos(Math.max(-1, Math.min(1, along)));
                if (dist > 0.8 && angle > arc + enemy.radius / dist) {
                    return;
                }
                // A big one off to the side only if its edge reaches the arc's nearer side, a line
                // out to reach: past the arc's far corners, the widened angle takes in what's
                // well clear of it
                if (enemy.radius > 1 && dist > 0.8 && angle > arc) {
                    const sideAlong = dist * fm.cos(angle - arc);
                    const sideOff = dist * fm.sin(angle - arc);
                    const offLine = sideAlong - Math.max(0, Math.min(reach, sideAlong));
                    if (offLine * offLine + sideOff * sideOff > enemy.radius * enemy.radius) {
                        return;
                    }
                }
                hit.add(enemy);
            });
        }
        this.meleeHits(def, level, hit, special);
    }

    // A special attack that hits everything all round the player (the Thunder
    // khopesh's Thunderclap): a full circle swing, lightning on what it hits
    private fireAoeSpecial(
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        special: SpecialAttackDef,
        aoe: NonNullable<SpecialAttackDef["aoe"]>,
    ): void {
        const player = this.player;
        const radius = aoe.radius * (1 + this.stats.area);
        this.emit({
            type: "slash",
            x: player.x,
            y: player.y,
            dirX: player.facingX,
            dirY: player.facingY,
            reach: radius,
            width: 0,
            arc: Math.PI,
            weaponId: def.id,
        });
        const hit: Enemy[] = [];
        this.queryTouching(player.x, player.y, radius + 1, (enemy) => {
            if (
                !enemy.dead &&
                fm.hypot(enemy.x - player.x, enemy.y - player.y) <= radius + enemy.radius
            ) {
                hit.push(enemy);
            }
        });
        if (aoe.impactSpotAnim !== undefined) {
            for (const enemy of hit.slice(0, 10)) {
                this.addEffect(aoe.impactSpotAnim, enemy.x, enemy.y, 0, 60, enemy.uid);
            }
        }
        this.meleeHits(def, level, hit, special);
    }

    // A slash or sweep landing on what it caught. Bosses and elites take the
    // weapon's extra hits; a special attack hits harder and does its effect.
    private meleeHits(
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        hit: Iterable<Enemy>,
        special: SpecialAttackDef | undefined,
    ): void {
        const player = this.player;
        const damage = level.damage * (special?.damage ?? 1);
        if (special) {
            this.addEffect(special.spotAnim, player.x, player.y, 0, SPECIAL_SPOTANIM_TICKS);
        }
        let dealt = 0;
        let effects = 0;
        const lowHealth =
            def.lowHealth && player.hp < player.maxHp * def.lowHealth.below
                ? 1 + def.lowHealth.damage
                : 1;
        for (const enemy of hit) {
            const breach = this.breachScale(def, enemy);
            const enemyDamage = damage * this.slayerScale(def, enemy) * lowHealth * breach;
            const hits = def.hits ?? [1];
            const alive = !enemy.dead;
            const hitDealt =
                this.damageEnemy(
                    enemy,
                    enemyDamage * hits[0],
                    level.knockback * (1 + this.stats.meleeKnockback),
                    player.x,
                    player.y,
                ) + this.bigHits(def, enemy, enemyDamage, player.x, player.y);
            // The gap shows only where the hit got in (not on a shield, or a style it's proof
            // against), and on no more than 10 at once
            if (breach > 1 && hitDealt > 0 && effects++ < 10) {
                this.addEffect(def.breach!.spotAnim, enemy.x, enemy.y, 0, 40, enemy.uid);
            }
            // A kill by this swing itself heals (the Keris partisan of the sun): not one some
            // other kill leaves this weapon's name on, nor one that's part of a fight (a boss's
            // summons, Zebak's jugs, one brought back), as with kills and drops
            if (def.killHeal && alive && enemy.dead && !enemy.noDrops && this.isUp(this.hero)) {
                this.heal(def.killHeal * this.healScale);
            }
            // The rest of a multi-hit weapon's hits land a moment apart
            hits.slice(1).forEach((fraction, i) => {
                this.pendingHits.push({
                    hero: this.hero.index,
                    enemy,
                    weapon: def,
                    damage: enemyDamage * fraction,
                    knockback: 0,
                    tick: this.tick + (i + 1) * FOLLOW_UP_HIT_TICKS,
                });
            });
            dealt += hitDealt;
            this.stealLife(def, hitDealt);
            const effect = special?.effect;
            if (effect?.kind === "freeze" && !enemy.boss && !enemy.dead) {
                this.freezeEnemy(enemy, effect.seconds);
                if (effects++ < 10) {
                    this.addEffect(FREEZE_SPOTANIM, enemy.x, enemy.y, 0, 60, enemy.uid);
                }
            } else if (effect?.kind === "drain" && !enemy.dead) {
                this.drainEnemy(enemy, effect.amount, effect.seconds);
            } else if (effect?.kind === "burn" && !enemy.dead) {
                this.envenom(
                    enemy,
                    enemyDamage * effect.damage,
                    Math.round(effect.seconds * (1 + this.stats.duration) * TICKS_PER_SECOND),
                );
            }
        }
        if (special?.effect?.kind === "heal" && dealt > 0) {
            this.heal(Math.min(Math.round(dealt * special.effect.fraction), special.effect.max));
        }
        if (special?.effect?.kind === "restore") {
            // Tumeken's Light: whole again, poison and boss drains gone
            this.cure();
            // The drains' stats go with them, max hitpoints too, before healing to it
            this.updateStats();
            this.heal(player.maxHp);
        }
        if (def.chain) {
            this.chainHits(def, def.chain, hit, damage);
        }
    }

    // A gap in the shell (WeaponDef.breach): the hit times its damage, now and then, far more
    // often in what has one of its tags
    private breachScale(def: WeaponDef, enemy: Enemy): number {
        const breach = def.breach;
        if (!breach || enemy.dead) {
            return 1;
        }
        const chance = hasTag(enemy, breach.tags) ? breach.tagChance : breach.chance;
        return this.rng.chance(chance) ? breach.damage : 1;
    }

    // How much harder a weapon hits this enemy for what it is (the Ivandis
    // flail and vampyres)
    private slayerScale(def: WeaponDef, enemy: Enemy): number {
        const slayer = def.slayer;
        return slayer && hasTag(enemy, slayer.tags) ? 1 + slayer.damage : 1;
    }

    // Each enemy of the chain's kind that a swing hit passes it on to more of
    // its kind nearby, up to the chain's count in all (the Blisterwood flail)
    private chainHits(
        def: WeaponDef,
        chain: NonNullable<WeaponDef["chain"]>,
        hit: Iterable<Enemy>,
        damage: number,
    ): void {
        const done = new Set(hit);
        let left = chain.count;
        for (const from of [...done]) {
            if (left <= 0) {
                break;
            }
            if (!hasTag(from, chain.tags)) {
                continue;
            }
            // Lit or not (LightingDef.litTargetsOnly): a hop carries on into the dark, as a shot
            // hits what it meets there
            this.enemyHash.query(from.x, from.y, chain.range + 0.5, (enemy) => {
                if (
                    left <= 0 ||
                    enemy.dead ||
                    done.has(enemy) ||
                    !hasTag(enemy, chain.tags) ||
                    fm.hypot(enemy.x - from.x, enemy.y - from.y) > chain.range
                ) {
                    return;
                }
                done.add(enemy);
                left--;
                this.addEffect(chain.spotAnim, enemy.x, enemy.y, 0, 30, enemy.uid);
                const dealt = this.damageEnemy(
                    enemy,
                    damage * chain.damage * this.slayerScale(def, enemy),
                    0,
                    from.x,
                    from.y,
                );
                this.stealLife(def, dealt);
            });
        }
    }

    // Lands the hits that were waiting for their moment
    private stepPendingHits(): void {
        if (this.pendingHits.length === 0) {
            return;
        }
        this.pendingHits = this.pendingHits.filter((hit) => {
            if (hit.tick > this.tick) {
                return true;
            }
            this.useHeroAt(hit.hero);
            const player = this.player;
            this.damageSource = `weapon:${hit.weapon.id}`;
            const dealt = this.damageEnemy(
                hit.enemy,
                hit.damage,
                hit.knockback,
                player.x,
                player.y,
            );
            this.stealLife(hit.weapon, dealt);
            return false;
        });
    }

    // The weapon's extra hits on a boss or an elite (the scythe's), and the
    // damage they dealt
    private bigHits(
        def: WeaponDef,
        enemy: Enemy,
        damage: number,
        fromX: number,
        fromY: number,
    ): number {
        let dealt = 0;
        if (enemy.boss || enemy.elite) {
            for (const fraction of def.bigHits ?? []) {
                dealt += this.damageEnemy(
                    enemy,
                    damage * fraction,
                    0,
                    fromX,
                    fromY,
                    def.mightScale,
                );
            }
        }
        return dealt;
    }

    // Can't move for this many seconds, longer with duration (bosses shrug it
    // off)
    private freezeEnemy(enemy: Enemy, seconds: number): void {
        if (!enemy.boss) {
            const ticks = seconds * (1 + this.stats.duration) * TICKS_PER_SECOND;
            enemy.frozen = Math.max(enemy.frozen, Math.round(ticks));
        }
    }

    // Takes amount more damage from everything for this many seconds, longer
    // with duration (the Bandos godsword's Warstrike)
    private drainEnemy(enemy: Enemy, amount: number, seconds: number): void {
        const ticks = seconds * (1 + this.stats.duration) * TICKS_PER_SECOND;
        enemy.drain = amount;
        enemy.drainEnd = this.tick + Math.round(ticks);
    }

    // Keep the existing source on ties, for both venom and merged ground fire.
    private strongerDot(
        source: DamageSource,
        damage: number,
        currentSource: DamageSource,
        currentDamage: number,
    ): boolean {
        const tunedDamage = (from: DamageSource, raw: number) =>
            raw * (this.weaponDamageMultipliers[from] ?? 1);
        return tunedDamage(source, damage) > tunedDamage(currentSource, currentDamage);
    }

    // Venom damage every second for this many ticks. Topped up rather than
    // started again, so its next hit still comes on time.
    private envenom(enemy: Enemy, venom: number, ticks: number): void {
        // A hit an expert Nylocas won't take doesn't poison or burn it either (EnemyDef.onlyStyle)
        if (this.wrongStyle(enemy)) {
            return;
        }
        if (enemy.venomEnd < this.tick) {
            enemy.venomNext = this.tick + TICKS_PER_SECOND;
            enemy.venom = 0;
        }
        enemy.venomEnd = Math.max(enemy.venomEnd, this.tick + ticks);
        if (this.strongerDot(this.damageSource, venom, enemy.venomSource ?? "other", enemy.venom)) {
            enemy.venom = venom;
            enemy.venomSource = this.damageSource;
            enemy.venomHero = this.hero.index;
        }
    }

    // A hit's chance of healing the player: the weapon's (the Sanguinesti
    // staff's, by part of what it dealt), and the Amulet of blood fury's
    private stealLife(def: WeaponDef, dealt: number): void {
        if (dealt <= 0) {
            return;
        }
        const lifesteal = def.lifesteal;
        if (lifesteal && this.rng.chance(lifesteal.chance)) {
            const amount = Math.min(Math.round(dealt * lifesteal.fraction), lifesteal.max);
            this.lifestealHeal(amount, lifesteal.spotAnim);
        }
        if (
            this.stats.healChance > 0 &&
            this.tick >= this.bloodFuryRollTick &&
            this.player.hp < this.player.maxHp
        ) {
            this.bloodFuryRollTick = this.tick + BLOOD_FURY_ROLL_INTERVAL;
            if (this.rng.chance(this.stats.healChance)) {
                this.lifestealHeal(BLOOD_FURY_HEAL, BLOOD_FURY_SPOTANIM);
            }
        }
    }

    private lifestealHeal(amount: number, spotAnim: number): void {
        if (amount > 0 && this.player.hp < this.player.maxHp) {
            this.heal(amount);
            this.addEffect(spotAnim, this.player.x, this.player.y, 0, 40);
        }
    }

    // What an aura's or a strike's hit does besides its damage: the level's
    // venom and the weapon's drain and lifesteal
    private spellHitEffects(
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        enemy: Enemy,
        dealt: number,
    ): void {
        if (!enemy.dead) {
            if (level.venom) {
                const ticks = level.duration * (1 + this.stats.duration) * TICKS_PER_SECOND;
                this.envenom(enemy, level.venom, Math.round(ticks));
            }
            if (def.drain) {
                this.drainEnemy(enemy, def.drain, level.duration);
            }
        }
        this.stealLife(def, dealt);
    }

    // ---- Lights (MapDef.lighting) ----

    // This tick's sim lights, from where everything that carries one is now: the players' first,
    // in the party's order, then the map's, then enemies' and what they left. All in the same
    // order on every co-op player's copy. Squared distances only, nothing from Math.
    private stepLights(): void {
        const lighting = this.lighting!;
        const lights: Light[] = [];
        for (const hero of this.heroes) {
            if (hero.left) {
                continue;
            }
            const own = this.heroLight(hero.index, lighting);
            if (own) {
                const { x, y } = hero.player;
                lights.push({ kind: "player", id: hero.index, x, y, ...own, hero: hero.index });
            }
        }
        (lighting.lights ?? []).forEach((look, id) => {
            lights.push({ kind: "map", id, x: look.x, y: look.y, radius: look.radius, look });
        });
        for (const enemy of this.enemies) {
            const look = enemy.def.light;
            if (look && !enemy.dead) {
                const { x, y } = enemy;
                lights.push({
                    kind: "enemy",
                    id: enemy.uid,
                    x,
                    y,
                    radius: look.radius,
                    look,
                    enemy,
                });
            }
        }
        this.leftLights = this.leftLights.filter((left) => left.endTick > this.tick);
        for (const left of this.leftLights) {
            // Going out over its last LEFT_LIGHT_FADE seconds
            const fade = Math.min(
                1,
                (left.endTick - this.tick) / (LEFT_LIGHT_FADE * TICKS_PER_SECOND),
            );
            lights.push({
                kind: "left",
                id: left.id,
                x: left.x,
                y: left.y,
                radius: left.look.radius * fade,
                look: left.look,
            });
        }
        this.lights = lights;
        // What weapons can aim at, worked out once a tick rather than on every search
        if (this.litTargetsOnly) {
            for (const enemy of this.enemies) {
                enemy.lit = this.isLit(enemy.x, enemy.y);
            }
        }
    }

    // A hero's light: the map's round each player, and a light power-up's (the lantern) on top
    // while it lasts, shrinking back over its last seconds. None if they have neither.
    private heroLight(
        heroIndex: number,
        lighting: LightingDef,
    ): { radius: number; look: LightLook } | undefined {
        let bonus = 0;
        let look = lighting.player;
        for (const active of this.powerUps) {
            if (active.hero !== heroIndex) {
                continue;
            }
            const effect = getPowerUp(active.id).effect;
            if (effect.kind === "light") {
                const fade = Math.min(
                    1,
                    (active.endTick - this.tick) / (effect.fade * TICKS_PER_SECOND),
                );
                bonus = Math.max(bonus, effect.bonus * fade);
                look ??= effect.look ?? { radius: effect.bonus };
            }
        }
        const radius = (lighting.player?.radius ?? 0) + bonus;
        return look && radius > 0 ? { radius, look } : undefined;
    }

    // Whether a spot's in a sim light, or near enough to its edge (LIGHT_GRACE): always, on a map
    // without the rule (LightingDef.litTargetsOnly)
    isLit(x: number, y: number): boolean {
        if (!this.litTargetsOnly) {
            return true;
        }
        for (const light of this.lights) {
            const reach = light.radius + Math.min(LIGHT_GRACE, light.radius);
            const dx = x - light.x;
            const dy = y - light.y;
            if (dx * dx + dy * dy <= reach * reach) {
                return true;
            }
        }
        return false;
    }

    // What weapons can aim at under the rule: whether it was lit as this tick's lights were made
    // (stepLights), or as it came
    isEnemyLit(enemy: Enemy): boolean {
        return !this.litTargetsOnly || enemy.lit === true;
    }

    // How bright the scene is (LightingDef.ambient) at a tick, fractions too, as it changes over
    // time (dimTo). 1 on a map without lighting.
    ambientAt(tick: number): number {
        const dim = this.dim;
        if (tick >= dim.endTick) {
            return dim.to;
        }
        const t = Math.max(0, (tick - dim.startTick) / Math.max(1, dim.endTick - dim.startTick));
        return dim.from + (dim.to - dim.from) * t;
    }

    // The scene's ambient to this, over seconds (a boss's phase, an event): from wherever it is
    // now. Drawn only, and only on a map with lighting.
    dimTo(ambient: number, seconds: number): void {
        const from = this.ambientAt(this.tick);
        this.dim = {
            from,
            to: ambient,
            startTick: this.tick,
            endTick: this.tick + Math.round(seconds * TICKS_PER_SECOND),
        };
    }

    // The map's own ambient, when nothing's changed it
    get baseAmbient(): number {
        return this.lighting?.ambient ?? 1;
    }

    // What the player's weapons go for. Shielded enemies (Pest Control's
    // portals, Verzik's first form) are left out: every hit on them is
    // blocked, so aiming at them would waste shots while pests close in.
    // style: a weapon's, which leaves out what it can't hurt (an expert Nylocas of another
    // style). What isn't a weapon (thralls, the cannon, power-ups) hurts any, and passes none.
    // edge: an enemy more than two tiles across (radius over 1) goes by a point half a tile in
    // from its edge (about where a small one's middle is), as a melee weapon's reach does: a slash
    // or sweep hits whatever its reach touches, so a big boss is in reach from beside it. Nothing
    // smaller changes.
    private nearestEnemies(
        x: number,
        y: number,
        range: number,
        count: number,
        style?: CombatStyle,
        edge = false,
    ): Enemy[] {
        const found: { enemy: Enemy; distSq: number }[] = [];
        const rangeSq = range * range;
        const styled = style !== undefined && this.expert;
        // Not behind a floor's pillar, which blocks the way and the view
        const pillars = this.floor?.hasPillars ? this.floor : undefined;
        // Under the rule (LightingDef.litTargetsOnly), only what's lit
        const dark = this.litTargetsOnly;
        for (const enemy of this.enemies) {
            // An unhittable one (Zebak's jugs) is never aimed at, any more than it's hit
            if (
                enemy.dead ||
                enemy.def.unhittable ||
                enemy.shieldEnd > this.tick ||
                (styled && enemy.def.onlyStyle !== undefined && enemy.def.onlyStyle !== style) ||
                (dark && !this.isEnemyLit(enemy))
            ) {
                continue;
            }
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            let distSq = dx * dx + dy * dy;
            // Over two tiles across: half a tile in from its edge. With a melee weapon's range
            // (reach + 0.5) that's in reach just when a swing at it lands (reach + radius).
            if (edge && enemy.radius > 1) {
                const gap = Math.max(0, fm.hypot(dx, dy) - (enemy.radius - 0.5));
                distSq = gap * gap;
            }
            if (distSq <= rangeSq && !pillars?.blocksSight(x, y, enemy.x, enemy.y)) {
                found.push({ enemy, distSq });
            }
        }
        found.sort((a, b) => a.distSq - b.distSq);
        return found.slice(0, count).map((f) => f.enemy);
    }

    // The enemies in range with the most hitpoints (the nearest of them on a
    // tie), for the Twisted bow
    private toughestEnemies(
        x: number,
        y: number,
        range: number,
        count: number,
        style: CombatStyle,
    ): Enemy[] {
        const near = this.nearestEnemies(x, y, range, MAX_ENEMIES, style);
        // Sorting is stable, so equally tough ones stay nearest first
        return near.sort((a, b) => b.maxHp - a.maxHp).slice(0, count);
    }

    // The nearest enemies in range, those without venom first, so venom
    // spreads through a crowd (the Toxic blowpipe)
    private unvenomedEnemies(
        x: number,
        y: number,
        range: number,
        count: number,
        style: CombatStyle,
    ): Enemy[] {
        const near = this.nearestEnemies(x, y, range, MAX_ENEMIES, style);
        const later = (enemy: Enemy) =>
            enemy.venomEnd >= this.tick || fm.hypot(enemy.x - x, enemy.y - y) > VENOM_SPREAD_RANGE;
        // Sorting is stable, so each half stays nearest first
        return near.sort((a, b) => Number(later(a)) - Number(later(b))).slice(0, count);
    }

    // Spells and arrows
    private fireMissiles(def: WeaponDef, level: WeaponDef["levels"][number]): boolean {
        const player = this.player;
        const amount = level.amount + this.stats.amount;
        const targets = def.toughTargets
            ? this.toughestEnemies(player.x, player.y, 14, amount, getWeaponStyle(def))
            : level.venom
              ? this.unvenomedEnemies(player.x, player.y, 14, amount, getWeaponStyle(def))
              : this.nearestEnemies(player.x, player.y, 14, amount, getWeaponStyle(def));
        if (targets.length === 0) {
            return false;
        }
        if (level.castSpotAnim !== undefined) {
            this.addEffect(level.castSpotAnim, player.x, player.y, 0, 40);
        }
        for (let i = 0; i < amount; i++) {
            const target = targets[i % targets.length];
            this.addProjectile(
                "spell",
                def,
                level,
                target,
                fm.atan2(target.y - player.y, target.x - player.x),
            );
        }
        return true;
    }

    private fireKnives(def: WeaponDef, level: WeaponDef["levels"][number]): void {
        const player = this.player;
        const amount = level.amount + this.stats.amount;
        // At the nearest enemy close by, otherwise the way the player faces
        const nearest = this.nearestEnemies(player.x, player.y, 9, 1, getWeaponStyle(def))[0];
        const base = nearest
            ? fm.atan2(nearest.y - player.y, nearest.x - player.x)
            : fm.atan2(player.facingY, player.facingX);
        for (let i = 0; i < amount; i++) {
            // Fan out: 0, +1, -1, +2, -2 ... steps of 7 degrees
            const offset = Math.ceil(i / 2) * (i % 2 === 0 ? -1 : 1) * 0.12;
            this.addProjectile("knife", def, level, undefined, base + offset);
        }
    }

    // At the nearest enemies, one each; each axe bounces on from what it hits
    private fireAxes(def: WeaponDef, level: WeaponDef["levels"][number]): boolean {
        const player = this.player;
        const amount = level.amount + this.stats.amount;
        const targets = this.nearestEnemies(
            player.x,
            player.y,
            AXE_RANGE,
            amount,
            getWeaponStyle(def),
        );
        if (targets.length === 0) {
            return false;
        }
        for (let i = 0; i < amount; i++) {
            const target = targets[i % targets.length];
            const angle = fm.atan2(target.y - player.y, target.x - player.x);
            this.addProjectile("axe", def, level, target, angle);
        }
        return true;
    }

    // Sends an axe on from the enemy it just hit to the nearest it hasn't hit
    // yet; false when there's nothing close enough
    private bounce(projectile: Projectile, from: Enemy): boolean {
        let next: Enemy | undefined;
        let best = BOUNCE_RANGE * BOUNCE_RANGE;
        for (const enemy of this.enemies) {
            if (enemy.dead || projectile.hit.has(enemy.uid) || enemy.shieldEnd > this.tick) {
                continue;
            }
            const bx = enemy.x - from.x;
            const by = enemy.y - from.y;
            const distSq = bx * bx + by * by;
            if (distSq <= best) {
                best = distSq;
                next = enemy;
            }
        }
        if (!next) {
            return false;
        }
        projectile.bounces--;
        projectile.targetUid = next.uid;
        projectile.life = Math.ceil((BOUNCE_RANGE * 2) / Math.max(projectile.speed, 0.01));
        return true;
    }

    // Puts the weapon's items circling the player, evenly spaced, in place of
    // any of theirs still going round from last time (not the rest of the
    // party's)
    private fireOrbit(def: WeaponDef, level: WeaponDef["levels"][number]): void {
        const player = this.player;
        const hero = this.hero.index;
        this.projectiles = this.projectiles.filter(
            (p) => !(p.orbit && p.weapon === def && p.hero === hero),
        );
        const amount = level.amount + this.stats.amount;
        const radius = level.area * (1 + this.stats.area);
        // Speed is how fast they go round, in tiles a second
        const angularSpeed = (level.speed * (1 + this.stats.speed)) / radius / TICKS_PER_SECOND;
        const life = Math.round(level.duration * (1 + this.stats.duration) * TICKS_PER_SECOND);
        // A little less than the time one takes to come round again, so
        // whatever's in the way is hit once a pass
        const rehitTicks = Math.max(5, Math.round(((2 * Math.PI) / angularSpeed) * 0.6));
        const start = fm.atan2(player.facingY, player.facingX);
        const objIds = def.orbitObjIds ?? [];
        for (let i = 0; i < amount; i++) {
            const angle = start + (i / amount) * Math.PI * 2;
            const x = player.x + fm.cos(angle) * radius;
            const y = player.y + fm.sin(angle) * radius;
            this.projectiles.push({
                uid: this.nextUid++,
                hero: this.hero.index,
                kind: "rune",
                weapon: def,
                x,
                y,
                prevX: x,
                prevY: y,
                vx: 0,
                vy: 0,
                speed: 0,
                targetUid: 0,
                damage: level.damage,
                pierce: 0,
                bounces: 0,
                venom: 0,
                venomTicks: 0,
                orbit: { angle, angularSpeed, radius, nextHit: new Map(), rehitTicks },
                life,
                radius: 0.5,
                splash: 0,
                knockback: level.knockback,
                hit: new Set(),
                yaw: yawFromVector(-fm.sin(angle), fm.cos(angle)),
                spotAnim: -1,
                impactSpotAnim: -1,
                hitSound: -1,
                objId: objIds.length > 0 ? objIds[i % objIds.length] : -1,
                startTick: this.tick,
            });
        }
    }

    private addProjectile(
        kind: ProjectileKind,
        def: WeaponDef,
        level: WeaponDef["levels"][number],
        target: Enemy | undefined,
        angle: number,
        fromX = this.player.x,
        fromY = this.player.y,
    ): void {
        const speed = (level.speed * (1 + this.stats.speed)) / TICKS_PER_SECOND;
        const range = kind === "knife" ? 18 : 24;
        this.projectiles.push({
            uid: this.nextUid++,
            hero: this.hero.index,
            kind,
            weapon: def,
            x: fromX,
            y: fromY,
            prevX: fromX,
            prevY: fromY,
            vx: fm.cos(angle) * speed,
            vy: fm.sin(angle) * speed,
            speed,
            targetUid: target?.uid ?? 0,
            damage: level.damage,
            pierce: level.pierce,
            bounces: level.bounce ?? 0,
            venom: level.venom ?? 0,
            venomTicks: Math.round(level.duration * (1 + this.stats.duration) * TICKS_PER_SECOND),
            life: Math.ceil(range / Math.max(speed, 0.01)),
            radius: 0.4,
            splash: level.area > 0 ? level.area * (1 + this.stats.area) : 0,
            knockback: level.knockback,
            hit: new Set(),
            yaw: yawFromVector(fm.cos(angle), fm.sin(angle)),
            spotAnim: level.projectileSpotAnim ?? -1,
            impactSpotAnim: level.impactSpotAnim ?? -1,
            hitSound: level.hitSound ?? def.hitSound,
            objId: getProjectileObjId(def, level) ?? -1,
            startTick: this.tick,
            ...(def.split && { split: def.split }),
        });
    }

    // A cannonball or a thrall's projectile, steering towards its target
    private shootAt(
        kind: ProjectileKind,
        fromX: number,
        fromY: number,
        target: Enemy,
        damage: number,
        speed: number,
        knockback: number,
        spotAnim: number,
        impactSpotAnim = -1,
    ): void {
        const perTick = (speed * (1 + this.stats.speed)) / TICKS_PER_SECOND;
        const dx = target.x - fromX;
        const dy = target.y - fromY;
        const angle = fm.atan2(dy, dx);
        this.projectiles.push({
            uid: this.nextUid++,
            hero: this.hero.index,
            kind,
            x: fromX,
            y: fromY,
            prevX: fromX,
            prevY: fromY,
            vx: fm.cos(angle) * perTick,
            vy: fm.sin(angle) * perTick,
            speed: perTick,
            targetUid: target.uid,
            damage,
            pierce: 0,
            bounces: 0,
            venom: 0,
            venomTicks: 0,
            life: Math.ceil(24 / Math.max(perTick, 0.01)),
            radius: 0.4,
            splash: 0,
            knockback,
            hit: new Set(),
            yaw: yawFromVector(dx, dy),
            spotAnim,
            impactSpotAnim,
            hitSound: -1,
            objId: -1,
            startTick: this.tick,
        });
    }

    private placeCannon(effect: Extract<PowerUpEffect, { kind: "cannon" }>): void {
        const player = this.player;
        // A free spot next to the player (clear of them: it's drawn over two
        // tiles across), or under them
        let x = player.x;
        let y = player.y;
        const sideX = player.x - player.facingX * 2.2;
        const sideY = player.y - player.facingY * 2.2;
        if (isCircleFree(this.grid, sideX, sideY, 0.6)) {
            x = sideX;
            y = sideY;
        }
        const turret: Turret = {
            uid: this.nextUid++,
            hero: this.hero.index,
            x,
            y,
            yaw: player.yaw,
            startTick: this.tick,
            endTick: this.tick + this.powerUpTicks(effect.seconds),
            nextShot: this.tick + 15,
            damage: effect.damage * this.powerUpDamageScale(),
            range: effect.range * (1 + this.stats.area),
            amount: effect.amount + this.stats.amount,
            interval: this.cooldownTicks(effect.interval),
        };
        this.turrets.push(turret);
        this.emit({ type: "cannonSetup", x, y });
    }

    private stepTurrets(): void {
        for (const turret of this.turrets) {
            if (this.tick < turret.nextShot || this.tick >= turret.endTick) {
                continue;
            }
            this.useHeroAt(turret.hero);
            const targets = this.nearestEnemies(turret.x, turret.y, turret.range, turret.amount);
            if (targets.length === 0) {
                turret.nextShot = this.tick + 5;
                continue;
            }
            turret.nextShot = this.tick + turret.interval;
            turret.yaw = yawFromVector(targets[0].x - turret.x, targets[0].y - turret.y);
            this.emit({ type: "cannonFire", x: turret.x, y: turret.y });
            for (const target of targets) {
                this.shootAt(
                    "cannonball",
                    turret.x,
                    turret.y,
                    target,
                    turret.damage,
                    CANNONBALL_SPEED,
                    0.2,
                    CANNON_SPOTANIM,
                );
            }
        }
        this.turrets = this.turrets.filter((t) => this.tick < t.endTick);
    }

    // Raises a thrall (one of the three at random) beside the player
    private raiseThrall(seconds: number): Thrall {
        const def = THRALLS[this.rng.int(THRALLS.length)];
        const player = this.player;
        const thrall: Thrall = {
            uid: this.nextUid++,
            hero: this.hero.index,
            def,
            x: player.x,
            y: player.y,
            prevX: player.x,
            prevY: player.y,
            yaw: player.yaw,
            moving: false,
            attackStart: -1,
            cooldown: TICKS_PER_SECOND / 2,
            damage: def.damage * this.powerUpDamageScale(),
            startTick: this.tick,
            endTick: this.tick + this.powerUpTicks(seconds),
        };
        this.thralls.push(thrall);
        return thrall;
    }

    private stepThralls(): void {
        this.thralls = this.thralls.filter((t) => this.tick < t.endTick);
        this.thralls.forEach((thrall, index) => {
            this.useHeroAt(thrall.hero);
            const player = this.player;
            const def = thrall.def;
            thrall.prevX = thrall.x;
            thrall.prevY = thrall.y;
            if (thrall.cooldown > 0) {
                thrall.cooldown--;
            }
            // Ranged and magic thralls shoot what's near them; a melee one goes
            // after what's near the player
            const melee = def.style === "melee";
            const target = melee
                ? this.nearestEnemies(player.x, player.y, def.range, 1)[0]
                : this.nearestEnemies(thrall.x, thrall.y, def.range, 1)[0];

            // Up to its target, or behind the player (fanned out to either side)
            let goalX: number;
            let goalY: number;
            let stop: number;
            if (melee && target) {
                goalX = target.x;
                goalY = target.y;
                stop = THRALL_RADIUS + target.radius + 0.1;
            } else {
                const side = index % 2 === 0 ? 1 : -1;
                const angle =
                    fm.atan2(-player.facingY, -player.facingX) +
                    side * (0.7 + Math.floor(index / 2) * 0.5);
                goalX = player.x + fm.cos(angle) * THRALL_FOLLOW_DISTANCE;
                goalY = player.y + fm.sin(angle) * THRALL_FOLLOW_DISTANCE;
                stop = 0.3;
            }
            thrall.moving = walkToward(
                this.grid,
                thrall,
                goalX,
                goalY,
                stop,
                THRALL_SPEED,
                THRALL_RADIUS,
                def.ghost === true,
            );
            // Stuck behind a wall: back beside the player
            if (fm.hypot(player.x - thrall.x, player.y - thrall.y) > THRALL_LEASH) {
                thrall.x = thrall.prevX = player.x;
                thrall.y = thrall.prevY = player.y;
            }

            if (!target || thrall.cooldown > 0) {
                return;
            }
            const tx = target.x - thrall.x;
            const ty = target.y - thrall.y;
            const reach = melee ? THRALL_RADIUS + target.radius + 0.4 : def.range;
            if (fm.hypot(tx, ty) > reach) {
                return;
            }
            thrall.cooldown = this.cooldownTicks(def.interval);
            thrall.attackStart = this.tick;
            thrall.yaw = yawFromVector(tx, ty);
            this.emit({ type: "thrallAttack", sound: def.sound, x: thrall.x, y: thrall.y });
            if (melee) {
                this.damageSource = "powerUp:thrall";
                this.damageEnemy(target, thrall.damage, def.knockback, thrall.x, thrall.y);
            } else {
                this.shootAt(
                    "spell",
                    thrall.x,
                    thrall.y,
                    target,
                    thrall.damage,
                    THRALL_PROJECTILE_SPEED,
                    def.knockback,
                    def.projectileSpotAnim ?? -1,
                    def.impactSpotAnim ?? -1,
                );
            }
        });
    }

    private fireAura(def: WeaponDef, level: WeaponDef["levels"][number]): void {
        const player = this.player;
        const radius = level.area * (1 + this.stats.area);
        this.emit({ type: "aura", x: player.x, y: player.y, radius });
        const hit: Enemy[] = [];
        this.queryTouching(player.x, player.y, radius + 0.5, (enemy) => {
            if (fm.hypot(enemy.x - player.x, enemy.y - player.y) <= radius + enemy.radius) {
                hit.push(enemy);
            }
        });
        let effects = 0;
        for (const enemy of hit) {
            if (def.freezes) {
                this.freezeEnemy(enemy, level.duration);
            }
            if (level.impactSpotAnim !== undefined && effects < 10) {
                this.addEffect(level.impactSpotAnim, enemy.x, enemy.y, 0, 60, enemy.uid);
                effects++;
            }
            const dealt = this.damageEnemy(
                enemy,
                level.damage,
                level.knockback,
                player.x,
                player.y,
            );
            this.spellHitEffects(def, level, enemy, dealt);
        }
        if (def.burns) {
            this.burnGround(def.burns, level);
        }
    }

    // Leaves the ground around the player burning for the level's duration
    // (Toktz-mej-tal), with flames across it. A pulse where the ground's
    // already burning keeps that fire going instead, and only a few burn at
    // once (the oldest goes out). In co-op each player has their own: one's
    // pulse doesn't feed or put out another's fire.
    private burnGround(
        burns: NonNullable<WeaponDef["burns"]>,
        level: WeaponDef["levels"][number],
    ): void {
        const { x, y } = this.player;
        const ticks = Math.round(level.duration * (1 + this.stats.duration) * TICKS_PER_SECOND);
        const endTick = this.tick + ticks;
        // A share of the aura's own reach, so it grows with its area bonuses
        const radius = level.area * (1 + this.stats.area) * burns.radius;
        const damage = level.damage * burns.damage;
        const hero = this.hero.index;
        const own = this.fires.filter((fire) => fire.hero === hero);
        const same = own.find(
            (fire) => fm.hypot(fire.x - x, fire.y - y) < fire.radius * FIRE_MERGE,
        );
        if (same) {
            same.endTick = Math.max(same.endTick, endTick);
            if (this.strongerDot(this.damageSource, damage, same.source, same.damage)) {
                same.damage = damage;
                same.source = this.damageSource;
                same.hero = this.hero.index;
            }
            return;
        }
        if (own.length >= MAX_FIRES) {
            this.fires.splice(this.fires.indexOf(own[0]), 1);
        }
        const flames: Vec2[] = [];
        for (let i = 0; i < FIRE_FLAMES; i++) {
            // One in the middle, the rest around it
            const angle = (i / (FIRE_FLAMES - 1)) * Math.PI * 2;
            const r = i === 0 ? 0 : radius * 0.6;
            flames.push({ x: x + fm.cos(angle) * r, y: y + fm.sin(angle) * r });
        }
        this.fires.push({
            uid: this.nextUid++,
            hero: this.hero.index,
            source: this.damageSource,
            x,
            y,
            radius,
            damage,
            nextTick: this.tick + FIRE_INTERVAL,
            endTick,
            locId: burns.locId,
            flames,
        });
    }

    // Burning ground hurts whatever's standing in it every so often
    private stepFires(): void {
        if (this.fires.length === 0) {
            return;
        }
        this.fires = this.fires.filter((fire) => fire.endTick > this.tick);
        for (const fire of this.fires) {
            if (this.tick < fire.nextTick) {
                continue;
            }
            fire.nextTick += FIRE_INTERVAL;
            this.useHeroAt(fire.hero);
            this.damageSource = fire.source;
            this.queryTouching(fire.x, fire.y, fire.radius + 0.5, (enemy) => {
                if (fm.hypot(enemy.x - fire.x, enemy.y - fire.y) <= fire.radius + enemy.radius) {
                    this.damageEnemy(enemy, fire.damage, 0, fire.x, fire.y);
                }
            });
        }
    }

    private fireStrikes(def: WeaponDef, level: WeaponDef["levels"][number]): boolean {
        const player = this.player;
        // A fight can keep them close (MapDef.fight.strikeReach)
        const reach = this.map.fight?.strikeReach ?? STRIKE_REACH;
        const candidates = this.nearestEnemies(player.x, player.y, reach, 60, getWeaponStyle(def));
        if (candidates.length === 0) {
            return false;
        }
        const amount = level.amount + this.stats.amount;
        const radius = level.area * (1 + this.stats.area);
        for (let i = 0; i < amount && candidates.length > 0; i++) {
            const index = this.rng.int(candidates.length);
            const target = candidates[index];
            candidates.splice(index, 1);
            if (level.impactSpotAnim !== undefined) {
                // Fitted to the strike and played out (WeaponDef.impactFit),
                // or as it is for a moment
                const fit = def.impactFit;
                const effect = this.addEffect(
                    level.impactSpotAnim,
                    target.x,
                    target.y,
                    0,
                    fit ? STRIKE_FIT_TICKS : 30,
                );
                if (effect && fit) {
                    effect.fitRadius = radius * fit;
                }
            }
            const tx = target.x;
            const ty = target.y;
            this.queryTouching(tx, ty, radius + 0.5, (enemy) => {
                if (
                    enemy === target ||
                    fm.hypot(enemy.x - tx, enemy.y - ty) <= radius + enemy.radius
                ) {
                    if (def.freezes) {
                        this.freezeEnemy(enemy, level.duration);
                    }
                    const dealt =
                        this.damageEnemy(enemy, level.damage, level.knockback, tx, ty) +
                        this.bigHits(def, enemy, level.damage, tx, ty);
                    this.spellHitEffects(def, level, enemy, dealt);
                }
            });
        }
        return true;
    }

    private stepProjectiles(): void {
        // Shots steer at who was up when this started: still at one an
        // earlier shot has just killed, never at one that's come since
        const enemies = this.enemies;
        const enemyCount = enemies.length;
        const deaths = this.enemyDeaths;
        for (const projectile of this.projectiles) {
            projectile.prevX = projectile.x;
            projectile.prevY = projectile.y;
            projectile.life--;
            this.useHeroAt(projectile.hero);
            if (projectile.orbit) {
                this.stepOrbit(projectile, projectile.orbit);
                continue;
            }
            // Spells, axes and cannonballs steer towards their target
            const aimedAt = projectile.targetUid
                ? findByUid(enemies, projectile.targetUid, enemyCount)
                : undefined;
            const target =
                aimedAt && (!aimedAt.dead || aimedAt.deathSeq > deaths) ? aimedAt : undefined;
            if (target) {
                const dx = target.x - projectile.x;
                const dy = target.y - projectile.y;
                const len = fm.hypot(dx, dy);
                if (len > 0.001) {
                    projectile.vx = (dx / len) * projectile.speed;
                    projectile.vy = (dy / len) * projectile.speed;
                    projectile.yaw = yawFromVector(dx, dy);
                }
            }
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;
            // A floor's pillar stops it (FloorTileType "pillar")
            if (
                this.floor?.hasPillars &&
                this.floor.isPillarTile(Math.floor(projectile.x), Math.floor(projectile.y))
            ) {
                projectile.life = 0;
                continue;
            }

            // An axe that has bounced is on its way to the next one
            let bounced = false;
            // Venom darts fly past everything but what they're aimed at, so
            // the venom spreads
            const only = projectile.venom > 0 && target ? target.uid : 0;
            this.queryTouching(projectile.x, projectile.y, projectile.radius + 0.5, (enemy) => {
                if (
                    bounced ||
                    projectile.life <= 0 ||
                    enemy.dead ||
                    projectile.hit.has(enemy.uid) ||
                    (only !== 0 && enemy.uid !== only) ||
                    // A phased boss with its shield down isn't there to hit:
                    // straight on through to the totems, with no blocked splat
                    enemy.bossState?.phase?.stage === "totems"
                ) {
                    return;
                }
                const reach = projectile.radius + enemy.radius;
                if (fm.hypot(enemy.x - projectile.x, enemy.y - projectile.y) > reach) {
                    return;
                }
                projectile.hit.add(enemy.uid);
                this.projectileHit(projectile, enemy);
                if (projectile.bounces > 0 && this.bounce(projectile, enemy)) {
                    bounced = true;
                } else if (projectile.pierce > 0) {
                    projectile.pierce--;
                    // Pass through, and stop steering at the one already hit
                    if (projectile.targetUid === enemy.uid) {
                        projectile.targetUid = 0;
                    }
                } else {
                    projectile.life = 0;
                }
            });
        }
    }

    // Goes round the player, hitting whatever's in the way (knocked outwards)
    private stepOrbit(projectile: Projectile, orbit: NonNullable<Projectile["orbit"]>): void {
        const player = this.player;
        const angle = orbit.angle + (this.tick - projectile.startTick) * orbit.angularSpeed;
        projectile.x = player.x + fm.cos(angle) * orbit.radius;
        projectile.y = player.y + fm.sin(angle) * orbit.radius;
        projectile.yaw = yawFromVector(-fm.sin(angle), fm.cos(angle));
        this.queryTouching(projectile.x, projectile.y, projectile.radius + 0.5, (enemy) => {
            if (enemy.dead || (orbit.nextHit.get(enemy.uid) ?? 0) > this.tick) {
                return;
            }
            const reach = projectile.radius + enemy.radius;
            if (fm.hypot(enemy.x - projectile.x, enemy.y - projectile.y) > reach) {
                return;
            }
            orbit.nextHit.set(enemy.uid, this.tick + orbit.rehitTicks);
            this.damageSource = projectileSource(projectile);
            const dealt = this.damageEnemy(
                enemy,
                projectile.damage,
                projectile.knockback,
                player.x,
                player.y,
            );
            if (projectile.weapon) {
                this.stealLife(projectile.weapon, dealt);
            }
        });
    }

    private projectileHit(projectile: Projectile, enemy: Enemy): void {
        if (projectile.impactSpotAnim !== -1) {
            this.addEffect(projectile.impactSpotAnim, enemy.x, enemy.y, 0, 30, enemy.uid);
        }
        if (projectile.hitSound !== -1) {
            this.emit({
                type: "impact",
                sound: projectile.hitSound,
                x: enemy.x,
                y: enemy.y,
            });
        }
        const weapon = projectile.weapon;
        const mightScale = weapon?.mightScale ?? 1;
        this.damageSource = projectileSource(projectile);
        let damage = projectile.damage;
        if (weapon?.toughTargets) {
            damage *= 1 + (weapon.toughTargets * enemy.maxHp) / (enemy.maxHp + TOUGH_TARGET_HP);
        }
        if (weapon) {
            damage *= this.slayerScale(weapon, enemy);
        }
        // An enchanted bolt's effect, now and then (the Armadyl crossbow)
        const procs = weapon?.boltProcs;
        const proc =
            procs && this.rng.chance(procs.chance)
                ? procs.procs[this.rng.weightedIndex(procs.procs.map((p) => p.weight))]
                : undefined;
        if (proc?.effect.kind === "pierce") {
            damage *= 1 + proc.effect.damage;
            projectile.pierce += proc.effect.pierce;
        }
        const dealt = this.damageEnemy(
            enemy,
            damage,
            projectile.knockback,
            projectile.x - projectile.vx,
            projectile.y - projectile.vy,
            mightScale,
        );
        if (weapon) {
            this.bigHits(weapon, enemy, damage, projectile.x, projectile.y);
        }
        if (projectile.venom > 0 && !enemy.dead) {
            this.envenom(enemy, projectile.venom, projectile.venomTicks);
        }
        if (weapon) {
            this.stealLife(weapon, dealt);
        }
        if (proc) {
            this.boltProc(proc, projectile, enemy);
        }
        if (projectile.split) {
            this.splitProjectile(projectile, projectile.split, enemy);
        }
        if (projectile.splash > 0) {
            const x = enemy.x;
            const y = enemy.y;
            this.enemyHash.query(x, y, projectile.splash + 0.5, (other) => {
                if (other !== enemy && fm.hypot(other.x - x, other.y - y) <= projectile.splash) {
                    this.damageEnemy(
                        other,
                        projectile.damage * 0.5,
                        projectile.knockback,
                        x,
                        y,
                        mightScale,
                    );
                }
            });
        }
    }

    // What an enchanted bolt does besides its hit: a ruby takes a share of
    // what's left of the target's hitpoints (whatever the damage bonus), a
    // dragonstone sets it burning
    private boltProc(proc: BoltProcDef, projectile: Projectile, enemy: Enemy): void {
        this.addEffect(proc.spotAnim, enemy.x, enemy.y, 0, 40, enemy.uid);
        const effect = proc.effect;
        if (enemy.dead) {
            return;
        }
        if (effect.kind === "hpFraction") {
            const damage = Math.min(enemy.hp * effect.fraction, projectile.damage * effect.max);
            this.damageEnemy(enemy, damage, 0, enemy.x, enemy.y, 0);
        } else if (effect.kind === "burn") {
            this.envenom(
                enemy,
                projectile.damage * effect.damage,
                Math.round(effect.seconds * (1 + this.stats.duration) * TICKS_PER_SECOND),
            );
        }
    }

    // Splits a shot where it first hits into more, which fly on to the
    // nearest other enemies, or fan out when there aren't enough (the Crystal
    // bow's arrows)
    private splitProjectile(
        projectile: Projectile,
        split: NonNullable<Projectile["split"]>,
        from: Enemy,
    ): void {
        projectile.split = undefined;
        const style = projectile.weapon && getWeaponStyle(projectile.weapon);
        const targets = this.nearestEnemies(
            from.x,
            from.y,
            SPLIT_RANGE,
            split.count + 1,
            style,
        ).filter((e) => e !== from);
        const ahead = fm.atan2(projectile.vy, projectile.vx);
        for (let i = 0; i < split.count; i++) {
            const target = targets[i];
            const angle = target
                ? fm.atan2(target.y - from.y, target.x - from.x)
                : ahead + (i - (split.count - 1) / 2) * 0.6;
            this.projectiles.push({
                ...projectile,
                uid: this.nextUid++,
                x: from.x,
                y: from.y,
                prevX: from.x,
                prevY: from.y,
                vx: fm.cos(angle) * projectile.speed,
                vy: fm.sin(angle) * projectile.speed,
                targetUid: target?.uid ?? 0,
                damage: projectile.damage * split.damage,
                pierce: split.pierce,
                life: Math.ceil((SPLIT_RANGE * 2) / Math.max(projectile.speed, 0.01)),
                hit: new Set([from.uid]),
                yaw: yawFromVector(fm.cos(angle), fm.sin(angle)),
                startTick: this.tick,
                split: undefined,
            });
        }
    }

    addEffect(
        spotAnim: number,
        x: number,
        y: number,
        height: number,
        ticks: number,
        enemyUid = 0,
        loop = false,
    ): Effect | undefined {
        if (this.effects.length >= MAX_EFFECTS) {
            return undefined;
        }
        const effect: Effect = {
            uid: this.nextUid++,
            spotAnim,
            x,
            y,
            height,
            startTick: this.tick,
            endTick: this.tick + ticks,
            enemyUid,
            ...(loop && { loop }),
        };
        this.effects.push(effect);
        return effect;
    }

    // ---- Halloween: disguises, stomps, pools, pumpkins, trophies ----

    // A boss event: the boss, or the casket it's hiding in. False if there's
    // nowhere to put it this tick.
    private bringOnBoss(
        def: EnemyDef,
        type: "boss" | "finalBoss",
        hp?: number,
        inArena?: boolean,
    ): boolean {
        if (def.disguise && type === "boss") {
            return this.layDisguise(def, hp);
        }
        return this.spawnBosses(def, type, hp, inArena).length > 0;
    }

    // Looks like any casket dropping, toast and all, close enough to tempt
    private layDisguise(def: EnemyDef, hp: number | undefined): boolean {
        const disguise = def.disguise!;
        // Its copies in co-op lie in wait one each, near the players
        const points = this.bossSpawnPoints(
            def,
            bossCopies(this.heroes.length, this.hard),
            DISGUISE_MIN_DISTANCE,
            DISGUISE_MAX_DISTANCE,
            undefined,
        );
        if (points.length === 0) {
            return false;
        }
        const encounter = this.newEncounter(points.length);
        for (const pos of points) {
            const { x, y } = this.walkableSpot(pos.x, pos.y);
            this.dropPickup("casket", x, y, 1, {
                tier: disguise.casket,
                disguise: {
                    enemyId: def.id,
                    hp,
                    shakeTick: this.tick + Math.round(disguise.seconds * TICKS_PER_SECOND),
                    openTick: -1,
                    ...(encounter && { encounter }),
                },
            });
            this.emit({ type: "casketDropped", tier: disguise.casket, x, y });
        }
        return true;
    }

    // It stays put (a magnet doesn't move it), shakes when it's walked onto or
    // left too long, and then opens: there's a moment to step away first
    private stepDisguise(pickup: Pickup): void {
        const disguise = pickup.disguise!;
        const def = getEnemy(disguise.enemyId);
        // Anyone walking onto it
        let near = false;
        this.forEachHeroInReach(() => {
            near ||= fm.hypot(this.player.x - pickup.x, this.player.y - pickup.y) < DISGUISE_TOUCH;
        });
        if (disguise.openTick === -1 && (near || this.tick >= disguise.shakeTick)) {
            const ticks = Math.round(def.disguise!.shake * TICKS_PER_SECOND);
            disguise.openTick = this.tick + ticks;
            this.emit({ type: "notice", message: "The casket shudders..." });
            this.showDisguiseWarning(pickup, def, ticks);
        }
        if (disguise.openTick !== -1 && this.tick >= disguise.openTick) {
            this.revealBoss(pickup, def);
        }
    }

    // The ring of what's about to come out, around the shaking casket
    private showDisguiseWarning(pickup: Pickup, def: EnemyDef, ticks: number): void {
        const warning = def.disguise!.warning;
        if (!warning) {
            return;
        }
        const { spotAnims, count, ringRadius } = warning;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = pickup.x + fm.cos(angle) * ringRadius;
            const y = pickup.y + fm.sin(angle) * ringRadius;
            this.addEffect(spotAnims[i % spotAnims.length], x, y, 0.3, ticks, 0, true);
        }
    }

    private revealBoss(pickup: Pickup, def: EnemyDef): void {
        const { hp, encounter } = pickup.disguise!;
        // Of several caskets, the first to open says so
        const quiet = encounter?.announced === true;
        const boss = this.spawnEnemy(def, "boss", { x: pickup.x, y: pickup.y }, hp, encounter);
        if (!boss) {
            return;
        }
        if (encounter) {
            encounter.announced = true;
        }
        pickup.value = -1;
        const seq = def.disguise!.seq;
        if (seq !== undefined) {
            boss.anim = "attack";
            boss.animStart = this.tick;
            boss.attackSeq = seq;
        }
        boss.attackCooldown = DISGUISE_ATTACK_DELAY;
        if (def.spawnSpotAnim !== undefined) {
            this.addEffect(def.spawnSpotAnim, boss.x, boss.y, 0, 60);
        }
        if (!quiet) {
            this.emit({
                type: "bossSpawned",
                enemyId: def.id,
                name: def.name,
                message: def.spawnMessage ?? `${def.name} has appeared!`,
                finalBoss: false,
                x: boss.x,
                y: boss.y,
            });
        }
    }

    // Standing under a boss that stomps (BossDef.stomp)
    private stepStomp(enemy: Enemy): void {
        const stomp = enemy.def.boss!.stomp;
        if (!stomp) {
            return;
        }
        const state = enemy.bossState!;
        // Whoever's under it, and of them, who it can hurt now
        const under: Hero[] = [];
        const hurt: Hero[] = [];
        this.forEachHeroInReach(() => {
            const player = this.player;
            if (fm.hypot(player.x - enemy.x, player.y - enemy.y) <= stomp.radius) {
                under.push(this.hero);
                if (!this.reviving && player.invulnerable <= 0) {
                    hurt.push(this.hero);
                }
            }
        });
        if (under.length === 0) {
            state.stomps = 0;
            state.nextStomp = undefined;
            state.stompFrom = undefined;
            return;
        }
        const interval = secondsToTicks(stomp.interval);
        if (state.nextStomp === undefined) {
            state.stompFrom = this.tick;
            state.nextStomp = this.tick + secondsToTicks(stomp.first ?? stomp.interval);
        }
        if (this.tick < state.nextStomp || hurt.length === 0) {
            return;
        }
        state.stomps = (state.stomps ?? 0) + 1;
        state.stompFrom = this.tick;
        state.nextStomp = this.tick + interval;
        // Seen as well as heard: its flash at its feet, and the first time, what it is
        this.emit({ type: "bossSwing", x: enemy.x, y: enemy.y, radius: stomp.radius });
        if (stomp.message && !state.stompSaid) {
            state.stompSaid = true;
            this.emit({ type: "notice", message: stomp.message });
        }
        const damage = Math.min(stomp.max, stomp.damage * state.stomps) * enemy.damageScale;
        const current = this.hero;
        for (const hero of hurt) {
            if (!this.runOver) {
                this.use(hero);
                this.damagePlayer(damage, enemy.def.id, false, stomp.sound);
            }
        }
        this.use(current);
    }

    // What a blast leaves behind where it lands, besides its hit
    private landBlastExtras(enemy: Enemy, windup: BossWindup): void {
        const attack = windup.attack;
        if (attack.kind !== "blast") {
            return;
        }
        const pool = attack.pool;
        if (pool) {
            for (const { x, y } of windup.targets) {
                this.pools.push({
                    uid: this.nextUid++,
                    enemyId: enemy.def.id,
                    x,
                    y,
                    radius: pool.radius,
                    damage: pool.damage * enemy.damageScale,
                    interval: Math.round(pool.interval * TICKS_PER_SECOND),
                    effect: pool.effect,
                    locId: pool.locId,
                    startTick: this.tick,
                    endTick: this.tick + Math.round(pool.seconds * TICKS_PER_SECOND),
                    nextTick: 0,
                });
            }
            this.pools.splice(0, Math.max(0, this.pools.length - MAX_POOLS));
        }
        attack.impactSpotAnims?.forEach((spotAnim, i) => {
            const spot = windup.targets[i];
            if (spot) {
                this.addEffect(spotAnim, spot.x, spot.y, 0, 40);
            }
        });
        const candies = attack.candies ?? [];
        const first = windup.targets.length - candies.length;
        candies.forEach((id, i) => {
            const spot = windup.targets[first + i];
            if (spot) {
                this.bringMinion(enemy, getEnemy(id), spot);
            }
        });
    }

    // One of a boss's minions, unless it still has that kind up: they come
    // back with the next attack, and there's nothing to farm
    private bringMinion(boss: Enemy, def: EnemyDef, at: { x: number; y: number }): void {
        const up = this.enemies.some((e) => !e.dead && e.def === def && e.spawnedBy === boss.uid);
        if (up) {
            return;
        }
        const spot = this.canTurnUpAt(def, at.x, at.y) ? at : { x: boss.x, y: boss.y };
        const minion = this.spawnEnemy(def, "normal", spot);
        if (minion) {
            minion.spawnedBy = boss.uid;
            minion.noDrops = true;
        }
    }

    // A pool hurts a player standing in it, and not one who's stepped out,
    // however long ago it last hit them
    private stepPools(): void {
        if (this.pools.length === 0) {
            return;
        }
        this.pools = this.pools.filter((pool) => pool.endTick > this.tick);
        for (const pool of this.pools) {
            if (this.tick < pool.nextTick) {
                continue;
            }
            // Each of them standing in it
            this.forEachHeroInReach(() => {
                const player = this.player;
                const inside =
                    fm.hypot(player.x - pool.x, player.y - pool.y) <= pool.radius + player.radius;
                if (!inside || player.invulnerable > 0 || this.reviving || this.runOver) {
                    return;
                }
                pool.nextTick = this.tick + pool.interval;
                this.damagePlayer(pool.damage, pool.enemyId, false);
                if (pool.effect && !this.runOver && !this.reviving) {
                    this.applyPlayerEffect(pool.effect);
                }
            });
        }
    }

    // A debuff as it stands with this dose: a stacking one is its stats times
    // the doses so far
    private stackDebuff(
        effect: Extract<PlayerEffectDef, { kind: "debuff" }>,
    ): Pick<Debuff, "id" | "name" | "iconObjId" | "stats" | "stacks"> {
        const { id, name, iconObjId, stats, stacks: most } = effect;
        if (most === undefined) {
            return { id, name, iconObjId, stats };
        }
        const had = this.debuffs.find((d) => d.id === id)?.stacks ?? 0;
        const stacks = Math.min(most, had + 1);
        const stacked = Object.fromEntries(
            Object.entries(stats).map(([key, value]) => [key, value * stacks]),
        );
        return {
            id,
            name: stacks > 1 ? `${name} x${stacks}` : name,
            iconObjId,
            stats: stacked,
            stacks,
        };
    }

    // Enemies on some maps now and then drop a pumpkin (see trickOrTreat.ts)
    private rollPumpkin(x: number, y: number): void {
        if (!PUMPKIN_MAPS.includes(this.map.id) || this.tick < this.nextPumpkinTick) {
            return;
        }
        if (this.rng.chance(PUMPKIN_CHANCE * (1 + this.stats.luck))) {
            this.nextPumpkinTick = this.tick + PUMPKIN_MIN_GAP * TICKS_PER_SECOND;
            const spot = this.walkableSpot(x, y);
            this.dropPickup("powerUp", spot.x, spot.y, 1, { powerUp: PUMPKIN_ID });
        }
    }

    // Now and then a treat holds a trophy instead; otherwise it's a treat or a
    // trick by weight. What it says as it opens.
    private openPumpkin(): string {
        const trophy = TROPHIES.find(
            ({ from }) => from.kind === "pumpkin" && this.rng.chance(from.chance),
        );
        if (trophy) {
            this.emit({ type: "playerShout", text: "Treat!" });
            return this.findTrophy(trophy);
        }
        const index = this.rng.weightedIndex(PUMPKIN_OUTCOMES.map((o) => o.weight));
        const outcome = PUMPKIN_OUTCOMES[index];
        const player = this.player;
        const does = outcome.does;
        switch (does.kind) {
            case "heal":
                this.heal(player.maxHp * does.fraction);
                break;
            case "coins":
                this.gainCoins(Math.round(does.coins * (1 + this.stats.greed) * this.coinScale));
                break;
            case "buff":
                this.addBuff(does.itemId, does.stats, does.seconds, false);
                break;
            case "enemies": {
                const def = getEnemy(does.enemyId);
                for (let i = 0; i < does.count; i++) {
                    const enemy = this.spawnNear(player, def, 2.5, i, does.count, 3);
                    if (enemy) {
                        enemy.bonesOnly = true;
                    }
                }
                break;
            }
            case "effect":
                this.applyPlayerEffect(does.effect);
                break;
        }
        this.emit({ type: "playerShout", text: outcome.trick ? "Trick!" : "Treat!" });
        return outcome.message;
    }

    // Collection log trophies a boss can drop on its map
    // (each of the party their own)
    private rollBossTrophies(enemy: Enemy): void {
        if (!enemy.boss) {
            return;
        }
        this.forEachHeroInReach(() => {
            for (const trophy of TROPHIES) {
                const { from } = trophy;
                if (
                    from.kind === "boss" &&
                    from.enemyId === enemy.def.id &&
                    from.mapId === this.map.id &&
                    this.rng.chance(this.hard ? (from.hardChance ?? from.chance) : from.chance)
                ) {
                    this.emit({ type: "notice", message: this.findTrophy(trophy) }, true);
                }
            }
        });
    }

    private findTrophy(trophy: TrophyDef): string {
        this.trophies.add(trophy.id);
        return `New item added to your collection log: ${trophy.name}`;
    }

    // ---- Pickups ----

    dropCasket(x: number, y: number, elite: boolean): void {
        this.dropCasketOfTier(
            rollCasketTier(this.rng, this.casketSeconds, elite, this.stats.luck),
            x,
            y,
        );
    }

    // guaranteed: past the chance of a late endless casket, though not its limit
    private dropCasketOfTier(tier: CasketTier, x: number, y: number, guaranteed = false): void {
        if (this.endless && this.seconds >= LATE_CASKET_SECONDS) {
            if (!guaranteed && !this.rng.chance(LATE_CASKET_CHANCE)) {
                return;
            }
            const onGround = this.pickups.filter((pickup) => pickup.kind === "casket").length;
            if (onGround >= LATE_CASKET_LIMIT) {
                this.emit({
                    type: "notice",
                    message: "You have a funny feeling there would've been a chest",
                });
                return;
            }
        }
        const spot = this.walkableSpot(x, y);
        this.dropPickup("casket", spot.x, spot.y, 1, { tier });
        this.emit({ type: "casketDropped", tier, x: spot.x, y: spot.y });
    }

    // Where to put something that needs walking over: what dropped it can be
    // somewhere the player can't get to (a portal stands on solid tiles, ghosts
    // go through walls), and its drop can land past a wall
    private walkableSpot(x: number, y: number): Vec2 {
        return findFreeSpot(this.grid, x, y, PLAYER_RADIUS, (tileX, tileY) =>
            this.isWalkableTile(tileX, tileY),
        );
    }

    // Whether there's a way to the player from this tile. Beyond the flow field
    // there's no telling, so it's taken as a yes. It says yes to solid tiles
    // beside open ground too, so check there's room as well.
    private isWalkableTile(tileX: number, tileY: number): boolean {
        const field = this.flowField;
        return !field.contains(tileX, tileY) || field.isReachable(tileX, tileY);
    }

    dropPickup(
        kind: PickupKind,
        x: number,
        y: number,
        value: number,
        extra: Pick<Pickup, "tier" | "powerUp" | "disguise"> = {},
    ): void {
        const limit = MAX_PILES[kind];
        // (only counted when there could be that many)
        if (limit !== undefined && this.pickups.length >= limit) {
            // Too many lying around: the pile furthest from the player comes
            // here and takes these on too. Piles left behind as the player
            // moves on would otherwise keep what they're worth for good.
            const player = this.player;
            let count = 0;
            let pile: Pickup | undefined;
            let furthest = -1;
            for (const pickup of this.pickups) {
                if (pickup.kind !== kind) {
                    continue;
                }
                count++;
                // (one already flying to the player, or to another pile, stays
                // where it is)
                if (pickup.attracted || pickup.pileUid !== 0) {
                    continue;
                }
                const d = Math.abs(pickup.x - player.x) + Math.abs(pickup.y - player.y);
                if (d > furthest) {
                    furthest = d;
                    pile = pickup;
                }
            }
            if (pile && count >= limit) {
                pile.x = pile.prevX = x;
                pile.y = pile.prevY = y;
                pile.value += value;
                return;
            }
        }
        this.pickups.push({
            uid: this.nextUid++,
            kind,
            x,
            y,
            prevX: x,
            prevY: y,
            value,
            attracted: false,
            speed: 0,
            spawnTick: this.tick,
            pileUid: 0,
            ...extra,
        });
    }

    private stepPickups(): void {
        // Bones and coins on their way to a bigger pile go to one that was
        // there when this started
        const pickups = this.pickups;
        const pickupCount = pickups.length;
        for (const pickup of pickups) {
            pickup.prevX = pickup.x;
            pickup.prevY = pickup.y;
            if (pickup.disguise) {
                this.stepDisguise(pickup);
                continue;
            }
            if (
                pickup.kind === "powerUp" &&
                !pickup.attracted &&
                this.tick - pickup.spawnTick >= POWER_UP_LIFETIME * TICKS_PER_SECOND
            ) {
                pickup.value = -1;
                continue;
            }
            // Whoever's nearest gets it
            this.use(this.nearestUpHero(pickup.x, pickup.y));
            const player = this.player;
            const magnet = BASE_MAGNET * (1 + this.stats.magnet);
            const dx = player.x - pickup.x;
            const dy = player.y - pickup.y;
            const distance = fm.hypot(dx, dy);
            // Caskets and power-ups need walking over
            const magnetic = pickup.kind !== "casket" && pickup.kind !== "powerUp";
            if (!pickup.attracted && magnetic && distance < magnet) {
                pickup.attracted = true;
                pickup.speed = 0.05;
            }
            if (pickup.attracted) {
                pickup.pileUid = 0;
                if (distance > 0.001) {
                    pickup.speed = Math.min(pickup.speed + 0.02, 0.6);
                    const move = Math.min(pickup.speed, distance);
                    pickup.x += (dx / distance) * move;
                    pickup.y += (dy / distance) * move;
                }
            } else if (pickup.pileUid !== 0) {
                this.slideIntoPile(pickup, findByUid(pickups, pickup.pileUid, pickupCount));
                if (pickup.value < 0) {
                    continue;
                }
            }
            if (distance < 0.6) {
                this.collect(pickup);
                pickup.value = -1;
            }
        }
        if (this.tick % PILE_INTERVAL === 0) {
            this.gatherPiles();
        }
        keepIf(this.pickups, (p) => p.value >= 0);
    }

    // Bones lying near a bigger pile go over to join it, so a crowd's bones
    // end up as a few piles worth all of theirs instead of littering the map.
    // Coins do the same. The biggest piles stay where they are, and nothing
    // goes further from the player to join one: bones the player's about to
    // walk over would be dragged away, and the run would level slower.
    private gatherPiles(): void {
        const away = (p: Pickup) => {
            const player = this.nearestUpHero(p.x, p.y).player;
            return fm.hypot(p.x - player.x, p.y - player.y);
        };
        const loose = this.pickups.filter(
            (p) =>
                (p.kind === "bones" || p.kind === "coins") &&
                p.value >= 0 &&
                !p.attracted &&
                p.pileUid === 0,
        );
        // Biggest first (ties to the oldest: the sort keeps their order)
        loose.sort((a, b) => b.value - a.value);
        const hash = this.pileHash;
        hash.clear();
        for (const pickup of loose) {
            hash.insert(pickup);
        }
        // Piles that have taken others on, or are going to one
        const placed = new Set<Pickup>();
        for (const pile of loose) {
            if (placed.has(pile)) {
                continue;
            }
            placed.add(pile);
            const pileAway = away(pile);
            hash.query(pile.x, pile.y, PILE_RADIUS, (other) => {
                if (
                    other.kind === pile.kind &&
                    !placed.has(other) &&
                    away(other) >= pileAway &&
                    fm.hypot(other.x - pile.x, other.y - pile.y) <= PILE_RADIUS
                ) {
                    other.pileUid = pile.uid;
                    other.speed = 0;
                    placed.add(other);
                }
            });
        }
    }

    // Slides a little pile towards the one it's joining, and adds what it's
    // worth to that one when it gets there
    private slideIntoPile(pickup: Pickup, pile: Pickup | undefined): void {
        if (!pile || pile.value < 0) {
            // That one's been picked up already: this one stays put
            pickup.pileUid = 0;
            return;
        }
        const dx = pile.x - pickup.x;
        const dy = pile.y - pickup.y;
        const distance = fm.hypot(dx, dy);
        pickup.speed = Math.min(pickup.speed + 0.02, 0.3);
        if (distance <= pickup.speed) {
            pile.value += pickup.value;
            pickup.value = -1;
            return;
        }
        pickup.x += (dx / distance) * pickup.speed;
        pickup.y += (dy / distance) * pickup.speed;
    }

    private collect(pickup: Pickup): void {
        this.emit({ type: "pickup", kind: pickup.kind, value: pickup.value });
        switch (pickup.kind) {
            case "bones":
                this.xp += pickup.value * (1 + this.stats.growth);
                break;
            case "coins":
                this.gainCoins(Math.round(pickup.value * (1 + this.stats.greed) * this.coinScale));
                break;
            case "food":
                this.heal(pickup.value);
                break;
            case "casket":
                this.openCasket(pickup.tier ?? "medium");
                break;
            case "powerUp":
                this.usePowerUp(getPowerUp(pickup.powerUp ?? ""));
                break;
        }
    }

    // ---- Power-ups ----

    // A kill is likelier to drop a power-up the longer it's been since the
    // last. A higher rate runs that clock faster, and the cube is what makes
    // them come that much more often: the time between them goes as one over
    // the cube root of the chance.
    private rollPowerUp(x: number, y: number): void {
        const rate = 1 + this.stats.powerUpRate;
        const seconds = (this.tick - this.lastPowerUpTick) / TICKS_PER_SECOND;
        if (seconds * rate < POWER_UP_MIN_GAP) {
            return;
        }
        const minutes = seconds / 60;
        const chance =
            POWER_UP_CHANCE * fm.pow(rate, 3) * minutes * minutes * (1 + this.stats.luck);
        if (this.rng.chance(chance)) {
            this.dropPowerUp(this.rollPowerUpId(), x, y);
        }
    }

    private rollPowerUpId(): string {
        // A lantern is the one power-up a map's own weight brings in (LightingDef)
        const lantern = this.lighting?.lanternWeight ?? 0;
        const index = this.rng.weightedIndex(
            POWER_UPS.map((p) =>
                p.id === this.lastPowerUpId ? 0 : p.id === LANTERN_ID ? lantern : p.weight,
            ),
        );
        return POWER_UPS[index].id;
    }

    dropPowerUp(id: string, x: number, y: number): void {
        this.lastPowerUpTick = this.tick;
        this.lastPowerUpId = id;
        const spot = this.walkableSpot(x, y);
        this.dropPickup("powerUp", spot.x, spot.y, 1, { powerUp: id });
    }

    // Power-ups' damage keeps up with the enemies' hitpoints
    private powerUpDamageScale(): number {
        return (
            this.enemyHpScale() *
            this.map.difficulty.hp *
            this.roundHp *
            this.hardScale.hp *
            this.partyScale.hp
        );
    }

    private powerUpTicks(seconds: number): number {
        return Math.round(seconds * (1 + this.stats.duration) * TICKS_PER_SECOND);
    }

    // Does what a power-up does, there and then
    usePowerUp(def: PowerUpDef): void {
        const player = this.player;
        const effect = def.effect;
        let message: string;
        let endTick = 0;
        switch (effect.kind) {
            case "cannon":
                this.placeCannon(effect);
                endTick = this.turrets[this.turrets.length - 1].endTick;
                message = "You set up a dwarf multicannon!";
                break;
            case "thrall": {
                const thrall = this.raiseThrall(effect.seconds);
                endTick = thrall.endTick;
                message = `A ${thrall.def.name.toLowerCase()} rises to fight for you!`;
                break;
            }
            case "nuke": {
                this.damageSource = `powerUp:${def.id}`;
                const banned = this.nuke(effect.bossDamage);
                message = `Bot nuke! ${banned} ${banned === 1 ? "bot" : "bots"} banned.`;
                break;
            }
            case "magnet":
                for (const pickup of this.pickups) {
                    pickup.attracted = true;
                    pickup.speed = Math.max(pickup.speed, 0.15);
                }
                message =
                    this.heroes.length > 1
                        ? "Everything on the ground flies to whoever's nearest!"
                        : "Everything on the ground flies to you!";
                break;
            case "freeze":
                endTick = Math.max(
                    this.freezeEndTick,
                    this.tick + this.powerUpTicks(effect.seconds),
                );
                this.freezeEndTick = endTick;
                for (const enemy of this.enemies) {
                    if (!enemy.dead && !enemy.boss) {
                        enemy.frozen = Math.max(enemy.frozen, endTick - this.tick);
                    }
                }
                message = "Time stands still!";
                break;
            case "sled":
                endTick = this.tick + effect.seconds * TICKS_PER_SECOND;
                this.sledEndTick = endTick;
                this.sledSpeed = effect.speed;
                // Whatever had them stuck, they're off
                player.frozen = 0;
                this.hold = undefined;
                message = "You jump on the sled!";
                break;
            case "rock":
                this.dropRock(def, effect);
                message = "Something huge is coming down...";
                break;
            case "rampage":
                endTick = this.startRampage(def, effect).endTick;
                message = "Evil Bob has come for his revenge!";
                break;
            case "ring":
                endTick = this.tick + this.powerUpTicks(effect.seconds);
                this.rings.push({
                    uid: this.nextUid++,
                    hero: this.hero.index,
                    x: player.x,
                    y: player.y,
                    startTick: this.tick,
                    endTick,
                    nextPulse: this.tick,
                    radius: effect.radius,
                    locId: effect.locId,
                    spotAnim: effect.spotAnim,
                    scale: effect.scale,
                });
                message = "A fairy ring opens at your feet!";
                break;
            case "pumpkin":
                message = this.openPumpkin();
                break;
            case "light":
                endTick = this.tick + this.powerUpTicks(effect.seconds);
                message = `Your ${def.name.toLowerCase()} lights up the dark!`;
                break;
            case "laps":
                endTick = this.tick + this.powerUpTicks(effect.seconds);
                this.lapsEndTick = endTick;
                this.laps = effect;
                this.emit({ type: "playerShout", text: effect.shout });
                message = effect.shout;
                break;
        }
        if (endTick > this.tick) {
            this.powerUps.push({
                uid: this.nextUid++,
                hero: this.hero.index,
                id: def.id,
                startTick: this.tick,
                endTick,
            });
        }
        this.emit({ type: "powerUp", id: def.id, message, x: player.x, y: player.y });
    }

    // The middle of the thickest crowd within range of the player, going by
    // who has the most others within radius; a little ahead of the player if
    // there's no one about
    private thickestCrowd(range: number, radius: number): Vec2 {
        const player = this.player;
        this.rebuildEnemyHash();
        let best = { x: player.x + player.facingX * 3, y: player.y + player.facingY * 3 };
        let most = 0;
        for (const enemy of this.nearestEnemies(player.x, player.y, range, MAX_CROWD_CHECKS)) {
            let count = 0;
            this.enemyHash.query(enemy.x, enemy.y, radius, (other) => {
                if (fm.hypot(other.x - enemy.x, other.y - enemy.y) <= radius) {
                    count++;
                }
            });
            if (count > most) {
                most = count;
                best = { x: enemy.x, y: enemy.y };
            }
        }
        return best;
    }

    private dropRock(def: PowerUpDef, effect: Extract<PowerUpEffect, { kind: "rock" }>): void {
        const { x, y } = this.thickestCrowd(effect.range, effect.radius);
        const landTick = this.tick + Math.round(effect.delay * TICKS_PER_SECOND);
        this.rocks.push({
            uid: this.nextUid++,
            hero: this.hero.index,
            powerUpId: def.id,
            x,
            y,
            startTick: this.tick,
            landTick,
            endTick: landTick + ROCK_LINGER_TICKS,
            locId: effect.locId,
            spotAnim: effect.spotAnim,
            radius: effect.radius,
            damage: effect.damage * this.powerUpDamageScale(),
            knockback: effect.knockback,
            bossDamage: effect.bossDamage,
        });
    }

    private stepRocks(): void {
        for (const rock of this.rocks) {
            if (rock.landTick === this.tick) {
                this.useHeroAt(rock.hero);
                this.landRock(rock);
            }
        }
        this.rocks = this.rocks.filter((rock) => rock.endTick > this.tick);
    }

    private landRock(rock: FallingRock): void {
        const { x, y, radius } = rock;
        this.emit({ type: "blast", x, y, radius });
        this.emit({ type: "powerUpHit", id: rock.powerUpId, x, y });
        this.addEffect(rock.spotAnim, x, y, 0, 60);
        const hit: Enemy[] = [];
        this.queryTouching(x, y, radius + 1, (enemy) => {
            if (fm.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius) {
                hit.push(enemy);
            }
        });
        this.damageSource = `powerUp:${rock.powerUpId}`;
        for (const enemy of hit) {
            if (enemy.boss) {
                // A share of its hitpoints, whatever the damage bonus
                this.damageEnemy(enemy, enemy.maxHp * rock.bossDamage, 0, x, y, 0);
            } else {
                this.damageEnemy(enemy, rock.damage, rock.knockback, x, y);
            }
        }
    }

    // Comes in from behind the player, off the edge of the view
    private startRampage(
        def: PowerUpDef,
        effect: Extract<PowerUpEffect, { kind: "rampage" }>,
    ): Rampage {
        const player = this.player;
        const x = player.x - player.facingX * RAMPAGE_START_DISTANCE;
        const y = player.y - player.facingY * RAMPAGE_START_DISTANCE;
        const rampage: Rampage = {
            uid: this.nextUid++,
            hero: this.hero.index,
            powerUpId: def.id,
            x,
            y,
            prevX: x,
            prevY: y,
            yaw: 0,
            goalX: x,
            goalY: y,
            passesLeft: effect.passes,
            hit: new Set(),
            damage: effect.damage * this.powerUpDamageScale(),
            speed: effect.speed / TICKS_PER_SECOND,
            radius: effect.radius,
            knockback: effect.knockback,
            startTick: this.tick,
            endTick: this.tick + effect.seconds * TICKS_PER_SECOND,
            doneTick: -1,
            walkSeq: effect.walkSeq,
            scale: effect.scale,
        };
        this.nextPass(rampage);
        this.rampages.push(rampage);
        return rampage;
    }

    // Straight at the thickest crowd, or the player with none, and on past it
    private nextPass(rampage: Rampage): void {
        const player = this.player;
        const crowd = this.thickestCrowd(RAMPAGE_CROWD_RANGE, rampage.radius * 2);
        let dx = crowd.x - rampage.x;
        let dy = crowd.y - rampage.y;
        if (fm.hypot(dx, dy) < 1) {
            dx = player.x - rampage.x;
            dy = player.y - rampage.y;
        }
        const length = fm.hypot(dx, dy) || 1;
        rampage.goalX = rampage.x + dx + (dx / length) * RAMPAGE_OVERSHOOT;
        rampage.goalY = rampage.y + dy + (dy / length) * RAMPAGE_OVERSHOOT;
        rampage.yaw = yawFromVector(dx, dy);
        rampage.passesLeft--;
        rampage.hit.clear();
        this.emit({ type: "powerUpHit", id: rampage.powerUpId, x: rampage.x, y: rampage.y });
    }

    private stepRampages(): void {
        for (const rampage of this.rampages) {
            rampage.prevX = rampage.x;
            rampage.prevY = rampage.y;
            if (rampage.doneTick !== -1) {
                continue;
            }
            this.useHeroAt(rampage.hero);
            const dx = rampage.goalX - rampage.x;
            const dy = rampage.goalY - rampage.y;
            const distance = fm.hypot(dx, dy);
            const move = Math.min(rampage.speed, distance);
            if (distance > 0) {
                rampage.x += (dx / distance) * move;
                rampage.y += (dy / distance) * move;
            }
            this.rampageHits(rampage);
            if (this.tick >= rampage.endTick || move >= distance) {
                if (rampage.passesLeft > 0 && this.tick < rampage.endTick) {
                    this.nextPass(rampage);
                } else {
                    this.endRampage(rampage);
                }
            }
        }
        this.rampages = this.rampages.filter(
            (r) => r.doneTick === -1 || this.tick - r.doneTick < RAMPAGE_FADE_TICKS,
        );
    }

    private rampageHits(rampage: Rampage): void {
        const { x, y, radius, hit } = rampage;
        const caught: Enemy[] = [];
        this.enemyHash.query(x, y, radius + 1, (enemy) => {
            if (!hit.has(enemy.uid) && fm.hypot(enemy.x - x, enemy.y - y) <= radius) {
                caught.push(enemy);
            }
        });
        this.damageSource = `powerUp:${rampage.powerUpId}`;
        for (const enemy of caught) {
            hit.add(enemy.uid);
            this.damageEnemy(enemy, rampage.damage, rampage.knockback, x, y);
        }
    }

    // Its timer on screen goes with it, which may be early (its own hero's,
    // not another's from the same power-up)
    private endRampage(rampage: Rampage): void {
        rampage.doneTick = this.tick;
        const active = this.powerUps.find(
            (p) => p.id === rampage.powerUpId && p.hero === rampage.hero,
        );
        if (active) {
            active.endTick = this.tick + 1;
        }
    }

    private stepRings(): void {
        for (const ring of this.rings) {
            if (this.tick >= ring.nextPulse) {
                this.useHeroAt(ring.hero);
                if (!this.isUp(this.hero)) {
                    this.use(this.nearestHero(ring.x, ring.y));
                }
                ring.nextPulse = this.tick + RING_PULSE_TICKS;
                this.pulseRing(ring);
            }
        }
        this.rings = this.rings.filter((ring) => ring.endTick > this.tick);
    }

    // Behind the player, or they'd land right in their path
    private pulseRing(ring: FairyRing): void {
        const { x, y, radius } = ring;
        const caught: Enemy[] = [];
        this.queryTouching(x, y, radius + 1, (enemy) => {
            if (
                !enemy.boss &&
                !enemy.def.stationary &&
                !enemy.jump &&
                fm.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius
            ) {
                caught.push(enemy);
            }
        });
        let effects = 0;
        for (const enemy of caught) {
            if (effects < MAX_RING_EFFECTS) {
                this.addEffect(ring.spotAnim, enemy.x, enemy.y, 0, 40);
                effects++;
            }
            this.relocate(enemy, true);
        }
    }

    // Kills everything that isn't a boss; bosses lose a share of their
    // hitpoints. Returns how many it killed.
    private nuke(bossDamage: number): number {
        const player = this.player;
        let killed = 0;
        for (const enemy of [...this.enemies]) {
            if (enemy.dead) {
                continue;
            }
            if (enemy.boss) {
                // A share of its hitpoints, whatever the damage bonus
                this.damageEnemy(enemy, enemy.maxHp * bossDamage, 0, player.x, player.y, 0);
                continue;
            }
            if (enemy.shieldEnd > this.tick || enemy.totemOf) {
                this.showBlocked(enemy);
                continue;
            }
            if (killed < MAX_NUKE_EFFECTS) {
                this.addEffect(NUKE_SPOTANIM, enemy.x, enemy.y, 0, 30);
            }
            this.killEnemy(enemy, "nuke");
            killed++;
        }
        return killed;
    }

    // ---- Random events ----

    private stepRandomEvents(): void {
        const visitor = this.visitor;
        if (this.runOver) {
            return;
        }
        if (visitor) {
            this.stepVisitor(visitor);
        } else if (
            this.seconds >= this.nextRandomEventSeconds &&
            // Nobody drops by in the middle of a phased boss's fight, or a raid's boss room
            !this.intro &&
            !this.shownBoss?.def.boss?.phases &&
            !(this.map.raid && this.raidStage !== "waves")
        ) {
            this.useVisitorHero();
            // (none to pick or nowhere to put one: it's due again in a moment)
            this.nextRandomEventSeconds = this.startRandomEvent(this.rollRandomEvent())
                ? this.seconds + this.eventRng.range(...RANDOM_EVENT_EVERY)
                : this.seconds + RANDOM_EVENT_RETRY;
        }
    }

    // Co-op: one of the heroes still up, for a visitor (or an ambush) to turn
    // up by, from the events' own rolls
    private useVisitorHero(): void {
        if (this.heroes.length === 1) {
            return;
        }
        const up = this.heroes.filter((hero) => this.isUp(hero));
        if (up.length > 0) {
            this.use(up[this.eventRng.int(up.length)]);
        }
    }

    private rollRandomEvent(): RandomEventDef | undefined {
        const bossOut = this.enemies.some((enemy) => enemy.boss && !enemy.dead);
        // In the Tombs of Amascut only a visitor with a casket comes, and may come again
        const tombs = this.map.tombs !== undefined;
        const index = this.eventRng.weightedIndex(
            RANDOM_EVENTS.map((event) =>
                tombs
                    ? event.effect.kind === "casket"
                        ? event.weight
                        : 0
                    : event.id === this.lastRandomEventId ||
                        this.seconds < (event.minSeconds ?? 0) ||
                        (event.effect.kind === "ambush" && bossOut)
                      ? 0
                      : event.weight,
            ),
        );
        return RANDOM_EVENTS[index];
    }

    // Puts this event in motion; false when it can't be right now
    startRandomEvent(def: RandomEventDef | undefined): boolean {
        if (!def) {
            return false;
        }
        const effect = def.effect;
        if (effect.kind === "ambush") {
            // Enemy hitpoints as of now, unlike a map's bosses, which are placed
            // for when they turn up
            const enemy = getEnemy(effect.enemyId);
            const hp = enemy.hp * this.map.difficulty.hp * this.enemyHpScale();
            if (this.spawnBosses(enemy, "boss", hp).length === 0) {
                return false;
            }
            this.lastRandomEventId = def.id;
            return true;
        }
        const spot = this.findVisitorSpot();
        if (!spot) {
            return false;
        }
        this.lastRandomEventId = def.id;
        this.visitor = {
            uid: this.nextUid++,
            def,
            x: spot.x,
            y: spot.y,
            startTick: this.tick,
            endTick: this.tick + VISITOR_LIFETIME * TICKS_PER_SECOND,
            nextShoutTick: this.tick,
        };
        this.addEffect(VISITOR_SPOTANIM, spot.x, spot.y, 0, 60);
        this.emit({ type: "visitor", message: def.arrive ?? "", sound: VISITOR_SOUND });
        return true;
    }

    // A few tiles off, where the player can get to
    private findVisitorSpot(): Vec2 | undefined {
        const player = this.player;
        for (let attempt = 0; attempt < 16; attempt++) {
            const angle = this.eventRng.range(0, Math.PI * 2);
            const distance = this.eventRng.range(...VISITOR_DISTANCE);
            const x = Math.floor(player.x + fm.cos(angle) * distance) + 0.5;
            const y = Math.floor(player.y + fm.sin(angle) * distance) + 0.5;
            const tileX = Math.floor(x);
            const tileY = Math.floor(y);
            if (
                this.grid.contains(tileX, tileY) &&
                this.isWalkableTile(tileX, tileY) &&
                isCircleFree(this.grid, x, y, PLAYER_RADIUS)
            ) {
                return { x, y };
            }
        }
        return undefined;
    }

    private stepVisitor(visitor: Visitor): void {
        if (this.tick >= visitor.endTick) {
            this.visitorLeft(visitor);
            return;
        }
        const shouts = visitor.def.shouts;
        if (shouts && this.tick >= visitor.nextShoutTick) {
            visitor.nextShoutTick = this.tick + VISITOR_SHOUT_EVERY * TICKS_PER_SECOND;
            this.emit({ type: "visitorShout", text: this.eventRng.pick(shouts) });
        }
        // (a casket opened this tick has the run waiting already)
        if (this.state !== "playing") {
            return;
        }
        const met = this.heroes.find(
            (hero) =>
                this.isUp(hero) &&
                fm.hypot(hero.player.x - visitor.x, hero.player.y - visitor.y) <= VISITOR_REACH,
        );
        if (met) {
            this.use(met);
            this.meetVisitor(visitor);
        }
    }

    // Left waiting too long
    private visitorLeft(visitor: Visitor): void {
        this.nextRandomEventSeconds = this.seconds + this.eventRng.range(...RANDOM_EVENT_EVERY);
        this.visitor = undefined;
        this.addEffect(VISITOR_SPOTANIM, visitor.x, visitor.y, 0, 60);
        this.emit({ type: "visitor", message: visitor.def.leave ?? "", sound: -1 });
        const effect = visitor.def.effect;
        if (effect.kind === "heal" && effect.ignoredHit) {
            // Everyone still in the fight ignored them
            const { ignoredHit, sound } = effect;
            this.forEachHeroInReach(() => {
                if (this.reviving) {
                    return;
                }
                const hit = Math.round(this.player.maxHp * ignoredHit);
                const amount = Math.min(hit, this.player.hp - 1);
                if (amount > 0) {
                    this.damagePlayer(amount, visitor.def.id, false, sound, true);
                }
            });
        }
    }

    // Walked up to at last: they do what they came for
    private meetVisitor(visitor: Visitor): void {
        this.nextRandomEventSeconds = this.seconds + this.eventRng.range(...RANDOM_EVENT_EVERY);
        this.visitor = undefined;
        this.addEffect(VISITOR_SPOTANIM, visitor.x, visitor.y, 0, 60);
        const def = visitor.def;
        const effect = def.effect;
        switch (effect.kind) {
            case "shop":
                this.openOffer(def, this.rollOldManOptions());
                return;
            case "quiz":
                this.openOffer(def, this.rollQuizOptions(effect.options));
                return;
            case "ambush":
                return;
            case "xp":
                this.xp += (this.xpForNextLevel - this.xpForThisLevel) * effect.levels;
                break;
            case "heal":
                this.heal(this.player.maxHp * effect.fraction);
                break;
            case "casket": {
                const tier = rollCasketTier(this.rng, this.casketSeconds, true, this.stats.luck);
                this.dropCasketOfTier(tier, visitor.x, visitor.y, true);
                break;
            }
            case "buff":
                this.addEventBuff(def.id, effect);
                break;
        }
        this.emit({ type: "visitor", message: effect.message, sound: effect.sound }, true);
    }

    private addEventBuff(id: string, effect: Extract<RandomEventEffect, { kind: "buff" }>): void {
        const { name, objId, stats, seconds, cures = false } = effect;
        if (cures) {
            this.cure();
        }
        this.addBuff(id, stats, seconds, cures);
        this.buffs[this.buffs.length - 1].look = { name, objId };
    }

    private openOffer(def: RandomEventDef, options: EventOption[]): void {
        this.offer = { uid: this.nextUid++, def, options, hero: this.hero.index };
        this.state = "event";
    }

    // A few different power-ups, the ones that drop less often being the ones
    // on offer less often too. In co-op, now and then one of them is an extra
    // revive instead.
    private rollOldManOptions(): EventOption[] {
        const left = POWER_UPS.filter((powerUp) => powerUp.weight > 0);
        const options: EventOption[] = [];
        if (this.heroes.length > 1 && this.eventRng.chance(OLD_MAN_REVIVE_CHANCE)) {
            options.push({
                kind: "revive",
                price: this.oldManPrice(EXTRA_REVIVE_PRICE),
                sold: false,
            });
        }
        while (options.length < OLD_MAN_OFFERS && left.length > 0) {
            const index = this.eventRng.weightedIndex(left.map((p) => p.weight));
            const [powerUp] = left.splice(index, 1);
            options.push({
                kind: "powerUp",
                powerUpId: powerUp.id,
                price: this.oldManPrice(powerUp.price),
                sold: false,
            });
        }
        return options;
    }

    // What something at this price at the start of the run costs now
    private oldManPrice(price: number): number {
        const inflation = 1 + (this.seconds / 60) * OLD_MAN_PRICE_PER_MINUTE;
        return Math.max(1, Math.round(price * inflation * this.coinScale));
    }

    // Some of one group of things and the odd one out from another, anywhere
    private rollQuizOptions(count: number): EventOption[] {
        const groups = getQuizGroups();
        const same = groups.splice(this.eventRng.int(groups.length), 1)[0];
        const options: EventOption[] = [];
        const pool = [...same];
        while (options.length < count - 1 && pool.length > 0) {
            const [item] = pool.splice(this.eventRng.int(pool.length), 1);
            options.push({ kind: "answer", itemId: item.id, correct: false });
        }
        const odd = this.eventRng.pick(this.eventRng.pick(groups));
        options.splice(this.eventRng.int(options.length + 1), 0, {
            kind: "answer",
            itemId: odd.id,
            correct: true,
        });
        return options;
    }

    // Whether one of what's on offer can be taken: it's this hero's offer, and
    // the thing is there, not sold already, and paid for
    canChooseEventOption(index: number): boolean {
        const offer = this.offer;
        const option = offer?.options[index];
        if (this.state !== "event" || !offer || !option || offer.hero !== this.hero.index) {
            return false;
        }
        if (option.kind === "powerUp" || option.kind === "revive" || option.kind === "supply") {
            // A raid's supplies are paid for in its points
            const funds = option.kind === "supply" ? this.hero.raidPoints : this.coins;
            return !option.sold && funds >= option.price;
        }
        if (option.kind === "bundle") {
            return this.tombsSpiritBundles(this.hero.index) > 0;
        }
        return true;
    }

    // Takes one of what's on offer. False when there's no such thing or the
    // player can't pay for it.
    chooseEventOption(index: number): boolean {
        if (!this.canChooseEventOption(index)) {
            return false;
        }
        const offer = this.offer!;
        const option = offer.options[index];
        if (option.kind === "powerUp" || option.kind === "revive" || option.kind === "supply") {
            if (option.kind === "supply") {
                this.hero.raidPoints -= option.price;
            } else {
                this.coins -= option.price;
            }
            option.sold = true;
            this.emit({ type: "visitor", message: "", sound: SOUNDS.buy }, true);
            if (option.kind === "revive") {
                this.gainRevive();
            } else if (option.kind === "supply") {
                this.useRaidSupply(option.supplyId);
            } else {
                this.usePowerUp(getPowerUp(option.powerUpId));
            }
            // A bought nuke can finish off a final boss
            if (
                this.runOver ||
                offer.options.every(
                    (o) =>
                        o.kind !== "answer" &&
                        o.kind !== "teleport" &&
                        o.kind !== "bundle" &&
                        o.sold,
                )
            ) {
                this.leaveEvent();
            }
            return true;
        }
        if (option.kind === "bundle") {
            this.emit({ type: "visitor", message: "", sound: SOUNDS.buy }, true);
            this.takeTombsBundle(option.items);
            this.leaveEvent();
            return true;
        }
        if (option.kind === "teleport") {
            const raid = this.map.raid!;
            const room = raid.rooms[this.raidRoom];
            this.raidTeleportsLeft--;
            // The portal cancels the room's boss timer: its boss comes now
            this.raidBossDueTick = this.tick;
            this.leaveEvent();
            this.emit({
                type: "notice",
                message: `Teleported to ${midSentence(room.name)}. ${this.raidTeleportsLeft} ${this.raidTeleportsLeft === 1 ? "teleport" : "teleports"} left.`,
            });
            this.startRaidBoss(room, this.raidRoom === raid.rooms.length - 1);
            return true;
        }
        const effect = offer.def.effect;
        if (effect.kind === "quiz") {
            this.emit(
                {
                    type: "visitor",
                    message: option.correct ? effect.right : effect.wrong,
                    sound: option.correct ? SOUNDS.levelUp : SOUNDS.denied,
                },
                true,
            );
            if (option.correct) {
                this.usePowerUp(getPowerUp(this.rollPowerUpId()));
            }
        }
        this.leaveEvent();
        return true;
    }

    // Done with what's on offer: on with the run (or a level up or casket that
    // came in meanwhile)
    leaveEvent(): void {
        if (this.offer && this.offer.hero !== this.hero.index) {
            return;
        }
        this.offer = undefined;
        if (this.state !== "event") {
            return;
        }
        if (this.raidShopQueue.length > 0) {
            this.openNextRaidShop();
            return;
        }
        this.state = this.heroes.some((hero) => hero.chests.length > 0) ? "chest" : "playing";
        this.checkLevelUp();
    }

    // A casket picked up: its coins and one item. The coins are the party's, so they're paid
    // once, and it's one casket for the run's quests and the picker's on the results screen. In
    // co-op every player who's up gets an item of their own, the picker first; a player who's down
    // misses out.
    openCasket(tier: CasketTier): void {
        const [min, max] = CASKETS[tier].coins;
        const coins = Math.round(
            (min + this.rng.int(max - min + 1)) * (1 + this.stats.greed) * this.coinScale,
        );
        this.gainCoins(coins);
        this.casketsOpened++;
        this.hero.casketsOpened++;
        const picker = this.hero;
        this.offerCasketItem(tier, coins);
        for (const hero of this.heroes) {
            if (hero !== picker && this.isUp(hero)) {
                this.use(hero);
                this.offerCasketItem(tier, coins);
            }
        }
        this.use(picker);
    }

    // The current player's item from a casket, rolled on their luck, gear and banishes, with the
    // casket's coins to show; the run waits while they decide what to do with it
    private offerCasketItem(tier: CasketTier, coins: number): void {
        const { itemId, upgradedFrom } = this.rollChestItem(tier);
        const upgrades = this.offeredUpgrades(itemId);
        this.chests.push({ uid: this.nextUid++, tier, itemId, upgradedFrom, upgrades, coins });
        this.emit({ type: "chest", tier, itemId, coins });
        if (this.state === "playing") {
            this.state = "chest";
        }
    }

    // A casket's item, gear as the Armoury has upgraded it (and noted as
    // found); a reroll's is never the one it replaces
    private rollChestItem(
        tier: CasketTier,
        replaces?: string,
    ): { itemId: string; upgradedFrom?: string } {
        const found = rollCasketItem(
            this.rng,
            tier,
            this.stats.luck,
            this.gear,
            hasPoison(this.map),
            replaces,
            this.unlockedItems,
            { offered: this.gearUpgradesFound, worn: this.gearUpgrades },
            this.armoury,
            this.declinedSets,
            this.heroes.length > 1,
            { items: this.hero.banishedItems, sets: this.hero.banishedSets },
        );
        if (getItem(found).kind !== "gear") {
            return { itemId: found };
        }
        this.gearFound.add(found);
        const itemId = getUpgradedGear(found, this.armoury);
        return { itemId, upgradedFrom: itemId !== found ? found : undefined };
    }

    // Gear in an endless run's casket comes upgraded once for each round
    // after the first
    private get gearUpgradesFound(): number {
        return this.endless ? this.round - 1 : 0;
    }

    private offeredUpgrades(itemId: string): number {
        return getItem(itemId).kind === "gear" ? this.gearUpgradesFound : 0;
    }

    // The run's level is shared: each level up gives every hero a pick
    private checkLevelUp(): void {
        const level = this.endless
            ? endlessLevelForXp(this.xp, this.level)
            : runLevelForXp(this.xp);
        if (level > this.level) {
            const gained = level - this.level;
            this.level = level;
            for (const hero of this.heroes) {
                if (hero.left) {
                    continue;
                }
                this.use(hero);
                hero.pendingLevelUps += gained;
                if (this.stats.levelMight !== 0) {
                    this.updateStats();
                }
                this.addEffect(LEVEL_UP_SPOTANIM, this.player.x, this.player.y, 0, 90);
            }
            this.emit({ type: "levelUp", level });
        }
        if (this.state === "playing" && this.anyoneToChoose()) {
            this.state = "levelUp";
            this.rollMissingChoices();
        }
    }

    // Rewards for everyone choosing a level up who hasn't any yet
    private rollMissingChoices(): void {
        for (const hero of this.heroes) {
            if (this.isChoosing(hero) && hero.choices.length === 0) {
                this.use(hero);
                this.choices = this.roll();
            }
        }
    }

    // ---- Housekeeping ----

    private cleanUp(): void {
        const tick = this.tick;
        keepIf(this.enemies, (e) => !e.dead || tick - e.deathTick < corpseTicks(e));
        keepIf(this.projectiles, (p) => p.life > 0);
        keepIf(this.enemyProjectiles, (p) => p.life > 0);
        keepIf(this.effects, (e) => tick < e.endTick);
        const enemies = this.enemies;
        for (const effect of this.effects) {
            if (effect.enemyUid === 0) {
                continue;
            }
            const enemy = findByUid(enemies, effect.enemyUid, enemies.length);
            if (enemy) {
                effect.x = enemy.x;
                effect.y = enemy.y;
            }
            if (!enemy || enemy.dead) {
                effect.enemyUid = 0;
            }
        }
    }

    takeEvents(): SimEvent[] {
        const events = this.events;
        this.events = [];
        return events;
    }

    get runOver(): boolean {
        return this.state === "dead" || this.state === "victory";
    }

    // The power-up whose look the player has on; it's off when the run ends
    get wornPowerUp(): PowerUpDef | undefined {
        if (this.runOver) {
            return undefined;
        }
        return this.powerUps
            .filter((p) => p.hero === this.hero.index)
            .map((p) => getPowerUp(p.id))
            .find((p) => p.look);
    }

    // Until this round's final boss
    get timeLeftForBoss(): number {
        const room = this.raidRoomDef;
        if (room) {
            return this.raidStage === "waves"
                ? Math.max(0, (this.raidBossDueTick - this.tick) / TICKS_PER_SECOND)
                : 0;
        }
        return Math.max(0, RUN_LENGTH - this.mapSeconds);
    }
}

// A name with "The" in front, as it reads partway through a sentence
function midSentence(name: string): string {
    return name.replace(/^The /, "the ");
}

function addStats(stats: Stats, add: Partial<Stats>): void {
    for (const [key, value] of Object.entries(add)) {
        stats[key as keyof Stats] += value ?? 0;
    }
}

// Whether an enemy is any of these (a vampyre, undead)
function hasTag(enemy: Enemy, tags: readonly EnemyTag[]): boolean {
    return enemy.def.tags?.some((tag) => tags.includes(tag)) ?? false;
}

// How far from all there a healer sees it: a fight in phases is in its shield,
// and with that down there's nothing to give back
function hurtFraction(enemy: Enemy): number {
    const phase = enemy.bossState?.phase;
    if (phase && phase.stage !== "hp") {
        return phase.stage === "shield" ? phase.shield / phase.shieldMax : 1;
    }
    return enemy.hp / enemy.maxHp;
}

function secondsToTicks(seconds: number): number {
    return Math.round(seconds * TICKS_PER_SECOND);
}

// How long a dead enemy stays, for its death animation and then sinking: a
// final boss whose fall the run waits for (BossDef.fallSeconds) plays all of it
function corpseTicks(enemy: Enemy): number {
    const fall = enemy.def.boss?.fallSeconds;
    return fall ? secondsToTicks(fall) + DEATH_SINK_TICKS : CORPSE_TICKS;
}

// How long a pattern's volleys take to fire, pauses between bursts and all
function patternSeconds(pattern: BulletPatternDef): number {
    const burst = pattern.burst;
    const pauses = burst ? Math.floor((pattern.volleys - 1) / burst.count) : 0;
    return pattern.volleys * pattern.interval + pauses * (burst?.pause ?? 0);
}

// Timers for what an enemy does besides walking up and hitting, undefined if
// its def gives it nothing. The first spawn, heal and revive come one
// interval after it turns up; the first blink somewhere in its first
// interval, so a crowd of them don't all go at once.
function getAbilities(def: EnemyDef, tick: number, rng: Rng): EnemyAbilities | undefined {
    if (!def.spawns && !def.heals && !def.revives && !def.blinks) {
        return undefined;
    }
    return {
        nextSpawn: tick + secondsToTicks(def.spawns?.interval ?? 0),
        nextHeal: tick + secondsToTicks(def.heals?.interval ?? 0),
        nextRevive: tick + secondsToTicks(def.revives?.interval ?? 0),
        nextBlink: def.blinks ? tick + secondsToTicks(def.blinks.interval * rng.range(0.5, 1)) : 0,
        blinkLand: -1,
    };
}

// The one with this uid among the first count of a list in uid order, as the
// enemies and pickups are: they're only ever added at the end, each with the
// next uid, and keepIf keeps their order
function findByUid<T extends { uid: number }>(
    list: readonly T[],
    uid: number,
    count: number,
): T | undefined {
    let low = 0;
    let high = count - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        const at = list[mid].uid;
        if (at < uid) {
            low = mid + 1;
        } else if (at > uid) {
            high = mid - 1;
        } else {
            return list[mid];
        }
    }
    return undefined;
}

// Takes out what doesn't pass, keeping the order, in place: a new array each
// tick for each list is garbage for a phone to collect
function keepIf<T>(list: T[], keep: (item: T) => boolean): void {
    let kept = 0;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (keep(item)) {
            list[kept++] = item;
        }
    }
    list.length = kept;
}

// Back and forth between -half and half at a steady speed, from 0 heading
// up: where it is after going distance
function pingPong(distance: number, half: number): number {
    if (half <= 0) {
        return 0;
    }
    const p = (distance + half) % (half * 4);
    return p < half * 2 ? p - half : half * 3 - p;
}

export { yawFromVector } from "./PlayerMovement";

export { DEATH_SINK_TICKS, MAX_DEATH_ANIM_TICKS };

// A shot as the boss-attack shape enemy projectiles carry (its damage is the
// enemy's own, set when it's fired)
const SHOT_ATTACKS = new WeakMap<EnemyShotDef, BossAttackDef>();
function shotAttack(shot: EnemyShotDef): BossAttackDef {
    let attack = SHOT_ATTACKS.get(shot);
    if (!attack) {
        attack = {
            name: "Shot",
            kind: "projectile",
            damage: 0,
            windup: 0,
            cooldown: 0,
            range: shot.range,
            weight: 1,
            speed: shot.speed,
            spotAnim: shot.spotAnim,
            impactSpotAnim: shot.impactSpotAnim,
            hitSound: shot.hitSound,
        };
        SHOT_ATTACKS.set(shot, attack);
    }
    return attack;
}
