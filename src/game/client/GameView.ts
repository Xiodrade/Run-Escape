import {
    ActorAnim,
    ActorDrawOptions,
    ActorModel,
    ActorRenderer,
    NO_TINT,
} from "../../mapviewer/webgl/actor/ActorRenderer";
import { REVIVE_SECONDS, REVIVE_SEQ } from "../content/coop";
import { getEnemy } from "../content/enemies";
import { CASKETS } from "../content/items";
import {
    LANTERN_ID,
    POWER_UP_BLINK,
    POWER_UP_COLOR,
    POWER_UP_LIFETIME,
    getPowerUp,
} from "../content/powerups";
import { RAID_PORTAL_LOC } from "../content/raids";
import { VISITOR_BLINK, VISITOR_COLOR } from "../content/randomEvents";
import { solveScabarasAddition, solveScabarasLights } from "../content/scabarasHelper";
import {
    AKKHA,
    CRONDIS,
    HET,
    JUNGLE_JAPES,
    KEPHRI,
    SARCOPHAGI,
    SCABARAS,
    TOMBS_SPIRIT,
    WARDENS,
    ZEBAK,
} from "../content/tombs";
import { EnemyDef, MapPropDef } from "../content/types";
import { PROJECTILE_ITEM_LOOKS } from "../content/weapons";
import {
    DEATH_SINK_TICKS,
    Hero,
    MAX_DEATH_ANIM_TICKS,
    RAMPAGE_FADE_TICKS,
    Sim,
    TICKS_PER_SECOND,
    ZEBAK_SHELTER_SIDE,
    ZebakFight,
    yawFromVector,
    zebakShelters,
} from "../core/Sim";
import {
    Enemy,
    EnemyProjectile,
    FairyRing,
    FallingRock,
    Glyph,
    GroundFire,
    GroundPool,
    Pickup,
    Rampage,
    SimEvent,
    Thrall,
    Visitor,
} from "../core/entities";
import { t, tl } from "../i18n";
import { formatCompact } from "../ui/formatCompact";
import { BossFightView } from "./BossFightView";
import { CinematicPlayer } from "./Cinematic";
import { CinematicLight, CinematicView } from "./CinematicView";
import { FloorView } from "./FloorView";
import {
    CANNON_MODEL_KEY,
    GameAssets,
    HITSPLAT_SPRITES,
    PLAYER_SEQS,
    getEnemyModelKey,
    getPickupModelKey,
    getPileLook,
    getPropKey,
    getShieldedModelKey,
} from "./GameAssets";
import { Overlay, ScreenPoint } from "./Overlay";
import { PetFollower, PetFollowers } from "./PetFollowers";
import { PlayerPose, getPlayerPose } from "./PlayerPose";

const FROZEN_TINT = 0xa8d8ff;
// Tiles past a sheltered swing's shelter its storm's edge starts, closing in as it winds up
// (BossAttackDef.outside)
const STORM_EDGE = 9;
// Co-op teammates' names and arrows, like a friend's name in the client, and
// the name of one who's down (out of the run)
export const TEAMMATE_COLOR = "#00ff80";
const TEAMMATE_DOWN_COLOR = "#9a9a9a";
// Shielded enemies (that can't be hurt yet) are washed in lilac
const SHIELDED_TINT = 0xd0b8ff;
// A boss with its guard down (BossDef.guard): warmed gold, and glinting as it pulses
const EXPOSED_TINT = 0xffc860;
const EXPOSED_FLASH = 0.3;
const EXPOSED_PULSE = 12;
// A blockable attack winding up shows the shelter behind the glyph out this
// far from the boss, in tiles
const SHELTER_LENGTH = 30;
const CANNON_SCALE = 0.75;
// From this many tiles' radius, a dev map stands something on more than its middle
const BIG_ACTOR_RADIUS = 0.95;
const BIG_ACTOR_LIFT = 0.6;
// Yaws face the way NPC models do (south at 0); the cannon's barrel points
// north in its model, so it's turned half a turn to aim where it shoots
const CANNON_YAW_OFFSET = 1024;
const PLAYER_HIT_TINT = 0xff9090;
// Burning ground's flames are drawn this much bigger than a camp fire's, to
// read as a patch of fire from the game's camera, and are this far out of step
// and turned this far from each other (of 2048)
const FLAME_SCALE = 2;
const FLAME_STEP_TICKS = 7;
const FLAME_TURN = 683;

// What's running from a boss's entrance fades out this many ticks before it goes
const LEAVING_FADE_TICKS = 20;

// Heights above the ground, in tiles
const PROJECTILE_HEIGHT = 0.9;
// Runes circling the player are small ground items; bigger reads better
const RUNE_SCALE = 1.6;
// Enemy and boss projectiles smaller than a tile across (radius in model
// units, 128 a tile) are drawn up to this much bigger than in OSRS, and all
// of them with an outline this thick (model units), flat orange behind them
const ENEMY_PROJECTILE_SCALE = 1.8;
const PROJECTILE_MIN_RADIUS = 64;
const PROJECTILE_OUTLINE = 12;
// ...and a soft glow round them this many pixels across (at the UI's scale)
const PROJECTILE_GLOW = 20;
// Health bars sit 15 units over the head, like the client's
const HEALTH_BAR_GAP = 15 / 128;
// How high something a boss throws out flies at the top of its arc, in tiles
const FLUNG_ARC_HEIGHT = 3;

const HITSPLAT_MS = 900;
const MAX_HITSPLATS = 120;
// Each kind of swoosh, aura and blast is pruned as it's drawn, but a co-op
// tab that's hidden keeps stepping without drawing, so they're capped too
const MAX_EFFECTS = 200;
// The splat a little smaller than the client draws it; the number stays at
// the font's own size, where it's crisp
const HITSPLAT_SPRITE_SCALE = 0.85;
const SLASH_MS = 180;
// A disguised boss's beam, once it's shaking
const DISGUISE_COLOR = "#ff3020";
// Bosses' pools: ticks they take to spread and to dry up, and the model's
// scale for each tile of radius
const POOL_GROW_TICKS = 12;
const POOL_DRY_TICKS = 50;
const POOL_SCALE = 2.2;
// Tiles apart a tether's spot animations are laid along it (BossAttackDef.tether)
const TETHER_GAP = 1;
// Swooshes are white, apart from these weapons' (r, g, b)
const SLASH_COLORS: Record<string, string> = {
    abyssal_whip: "180, 60, 60",
    scythe_of_vitur: "150, 20, 40",
    thunder_khopesh: "150, 200, 255",
    dinhs_bulwark: "210, 180, 110",
    sanguine_scythe: "150, 20, 40",
    ancient_godsword: "150, 20, 40",
    burning_claws: "240, 130, 40",
    inquisitors_mace: "230, 200, 120",
    dinhs_blazing_bulwark: "240, 130, 40",
};
const AURA_MS = 320;
const BLAST_MS = 480;
const SWING_MS = 260;
// Overhead chat stays up this long (the client's is 150 cycles, 3 seconds)
const SHOUT_MS = 3000;

// A casket thrown out of an elite: up and down, then a little bounce
const CASKET_HOP_TICKS = 28;
const CASKET_HOP_HEIGHT = 1.6;
// Arrows for what's coming out of the dark under litTargetsOnly (drawDarkArrows): from how far off (tiles),
// how many ways round, how far past the light's edge, and how strong at most
const DARK_ARROW_RANGE = 16;
const DARK_ARROW_SECTORS = 16;
const DARK_ARROW_GAP = 0.8;
const DARK_ARROW_ALPHA = 0.55;
const DARK_ARROW_COLOR = "#e8dcc8";

// Loot beams on caskets lying on the ground (like RuneLite's), in tiles
const LOOT_BEAM_HEIGHT = 4;
// Power-ups are drawn bigger than other ground items and bob up and down
const POWER_UP_SCALE = 1.3;
const POWER_UP_LOC_SCALE = 0.45;
const POWER_UP_BOB = 0.15;
// The countdown pie over a power-up, in pixels at scale 1, and its gap over the item
const TIMER_RADIUS = 11;
const TIMER_GAP = 4;
// A power-up's flash over the screen fades out over this long
const FLASH_MS = 700;
// Of a full flash, a boss's impact's (ImpactDef.flash)
const IMPACT_FLASH = 0.3;
// A rock's size, and how far up it starts (tiles)
const ROCK_SCALE = 5;
const ROCK_FALL_HEIGHT = 14;
// The Wardens' charged shots, drawn this much bigger than their spot animations
// The Wardens' marks that strike (WardensFight marks)
const MARK_STRIKE_LOOK = { scale: 1.6 };
const SHOT_LOOK = { scale: 2.5, flash: 0.3 };
const ROCK_FADE_TICKS = TICKS_PER_SECOND;
// Co-op: how long a teammate stands over a downed player to revive them
const REVIVE_TICKS = REVIVE_SECONDS * TICKS_PER_SECOND;
// How long a fairy ring takes to open
const RING_OPEN_TICKS = 20;
// A charging NPC's legs go this much faster than its walk, and it's lit up so
// a black cat shows on the darker maps
const RAMPAGE_ANIM_SPEED = 2;
const RAMPAGE_FLASH = 0.25;
// Thralls are small next to a top-down player; they fade out over their last
// second
const THRALL_SCALE = 1.5;
const THRALL_FADE_TICKS = TICKS_PER_SECOND;
// The Apmeken room's barrier stands turned a quarter (its loc's rotation 1)
const TOMBS_GATE_YAW = 512;
// Jungle Japes's peels: twice a banana's size, to stand out from the bananas on her floor
// The Crondis room's poison: the Spitting Scarab's green splash, that much bigger to fill a
// corridor, pale for the warning and dark for the real thing
const CRONDIS_CLOUD_SCALE = 1.6;
const CRONDIS_PALE_TINT = 0xffffff;
const CRONDIS_DARK_TINT = 0x608040;
// Kephri's swarm shield, round her while it's up
const KEPHRI_SHIELD_SPOTANIM = 2141;
// Akkha's floor's symbols: tiles out from its middle each way, and how big one's drawn lit up
// (they're a tile across)
const AKKHA_SYMBOL_OUT = 1.5;
const AKKHA_SYMBOL_SCALE = 3.2;
// and how far towards its element's glow colour (a negative flash: lit whatever the light)
const AKKHA_SYMBOL_GLOW = -0.9;
// and lifted off the floor that much (tiles, up being less, as heights are): flat on it, the
// floor's own symbol hides it
const AKKHA_SYMBOL_LIFT = -0.1;
// How strongly the quadrant he's showing glows, against a blast's full strength
const AKKHA_GLOW_ALPHA = 0.45;
// The glowing circles behind Zebak's boulders, where his roar can't reach, a tile across
const ZEBAK_SHELTER_SCALE = 0.9;
// His roar's shockwave: its dust that far towards white, to read on his sandy island, a puff
// every so many tiles
const ZEBAK_SHOCKWAVE_FLASH = 0.45;
const ZEBAK_SHOCKWAVE_STEP = 1.5;
// The funnel of light round a lit symbol, in its colour: darkness's own swirl (already baked
// with his elements), for every element
const AKKHA_FUNNEL_SPOTANIM = 2257;
const AKKHA_FUNNEL_SCALE = 2;
const AKKHA_FUNNEL_GLOW = -0.7;
// A blast's spray: so many of its element's orbs out of each quadrant it takes, flying up and
// out over its first so many seconds, so far (tiles) and so high at most, glowing in its colour
const AKKHA_SPRAY_ORBS = 14;
const AKKHA_SPRAY_TICKS = Math.round(1.1 * TICKS_PER_SECOND);
const AKKHA_SPRAY_REACH = 3.5;
const AKKHA_SPRAY_HEIGHT = 2.5;
const AKKHA_SPRAY_SCALE = 1.2;
const AKKHA_SPRAY_GLOW = -0.7;
const PEEL_SCALE = 2;

type HitsplatKind = keyof typeof HITSPLAT_SPRITES;

type Hitsplat = {
    kind: HitsplatKind;
    x: number;
    y: number;
    amount: number;
    start: number;
    // Follows this enemy, or this hero (Sim.heroes, -1 for none)
    enemyUid: number;
    hero: number;
    height: number;
};
type SlashFx = {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    reach: number;
    // Half the angle it covers, radians
    arc: number;
    start: number;
    // r, g, b; white when unset
    color?: string;
    // Whose swing it is, which it follows
    hero: number;
};
type AuraFx = { x: number; y: number; radius: number; start: number; hero: number };
type BlastFx = { x: number; y: number; radius: number; start: number };
type SwingFx = { x: number; y: number; radius: number; start: number };
// enemyUid 0 or less: a hero, -enemyUid (enemies' uids start at 1), or
// VISITOR_SHOUT for a random event's visitor
type Shout = { enemyUid: number; text: string; start: number };
const VISITOR_SHOUT = -1000;
// Random events' visitors stand out from the crowd
const VISITOR_SCALE = 1.5;
// strength: of the full flash (a power-up's), a boss's impact's being fainter
type FlashFx = { color: string; start: number; strength: number };

// Adds an effect, dropping the oldest past MAX_EFFECTS
function pushCapped<T>(list: T[], item: T): void {
    if (list.length >= MAX_EFFECTS) {
        list.shift();
    }
    list.push(item);
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// How long the upper body holds a weapon's run pose after a shot on the move
export const RUN_POSE_TICKS = 20;

// A run pose's frame `attackTicks` after the shot, `moveTicks` into the run:
// the run's own frame, so the legs go on as they were. -1 once the moment's
// past, or if it wasn't baked over this run.
export function getRunPoseFrame(
    runPose: ActorAnim,
    run: ActorAnim,
    attackTicks: number,
    moveTicks: number,
): number {
    if (attackTicks < 0 || attackTicks >= RUN_POSE_TICKS || runPose.frameCount !== run.frameCount) {
        return -1;
    }
    return runPose.getFrame(moveTicks);
}

// Matching's nine symbols as the puzzle helper names them (GameView.drawScabarasHelper): each its
// own colour, all light enough to read with their dark edge on the room's floor
const MATCHING_COLORS = [
    "#ffffff",
    "#ff5c5c",
    "#ffd84a",
    "#5aa9ff",
    "#4fe0d0",
    "#ff8fd6",
    "#a98bff",
    "#7dff8a",
    "#ffa94d",
];

// Draws a run: everything in the sim as 3D actors, and hitsplats, health bars
// and weapon swooshes on the 2D overlay.
export class GameView {
    localPlayerPose?: PlayerPose;
    private hitsplats: Hitsplat[] = [];
    private slashes: SlashFx[] = [];
    auras: AuraFx[] = [];
    private blasts: BlastFx[] = [];
    private swings: SwingFx[] = [];
    private shouts: Shout[] = [];
    private flash?: FlashFx;
    private readonly screen: ScreenPoint = { x: 0, y: 0, visible: false };
    private readonly screen2: ScreenPoint = { x: 0, y: 0, visible: false };
    private enemiesByUid = new Map<number, Enemy>();
    private readonly hitsplatImages = new HitsplatImages();
    private readonly glowImages = new Map<string, HTMLCanvasElement>();
    // The Tombs' Helpful Spirit, drawn as a visitor that never goes
    private tombsSpirit?: Visitor;
    // The hero the camera's on: the focus, or in co-op while they're down, a
    // teammate (GameClient sets it)
    viewHero = 0;
    // Countdown pies over power-ups on the ground (DisplaySettings.pickupTimers,
    // which GameClient sets)
    pickupTimers = true;
    // The Scabaras room's puzzle helper (DisplaySettings.puzzleHelper, which GameClient sets)
    puzzleHelper = true;

    private readonly fight: BossFightView;
    private readonly floor: FloorView;
    // The party's pets (GameClient gives them as a run starts)
    readonly pets = new PetFollowers();
    // The map's opening cinematic while it plays (MapDef.cinematic; GameClient sets it)
    cinematic?: CinematicPlayer;
    private readonly cinematicView: CinematicView;

    // The playing cinematic's lights, for a map with lighting (SceneLights)
    getCinematicLights(): CinematicLight[] | undefined {
        return this.cinematic && this.cinematicView.getLights(this.cinematic);
    }

    constructor(readonly assets: GameAssets) {
        this.cinematicView = new CinematicView(assets);
        this.fight = new BossFightView(assets);
        this.floor = new FloorView(assets);
    }

    reset(): void {
        this.localPlayerPose = undefined;
        this.fight.reset();
        this.hitsplats = [];
        this.slashes = [];
        this.auras = [];
        this.blasts = [];
        this.swings = [];
        this.shouts = [];
        this.flash = undefined;
    }

    private addHitsplat(hitsplat: Omit<Hitsplat, "start">): void {
        if (this.hitsplats.length >= MAX_HITSPLATS) {
            this.hitsplats.shift();
        }
        this.hitsplats.push({ ...hitsplat, start: performance.now() + this.rngDelay() });
    }

    // Where hitsplats on a hero go, in tiles above the ground
    private playerHitsplatHeight(hero: number): number {
        return ((this.assets.getPlayer(hero)?.height ?? 200) / 128) * 0.6;
    }

    onEvents(sim: Sim, events: SimEvent[]): void {
        const now = performance.now();
        for (const event of events) {
            this.fight.onEvent(event, now, sim.tick);
            switch (event.type) {
                case "damage": {
                    const enemy = sim.enemies.find((e) => e.uid === event.enemyUid);
                    const model =
                        enemy && this.assets.get(getEnemyModelKey(enemy.def, enemy.variant));
                    const height = model ? (model.height * enemy.scale) / 128 : 1;
                    this.addHitsplat({
                        kind: event.blocked ? "block" : event.poison ? "poison" : "damage",
                        x: event.x,
                        y: event.y,
                        amount: event.amount,
                        enemyUid: event.enemyUid,
                        hero: -1,
                        height: height * 0.6,
                    });
                    break;
                }
                case "playerHit":
                case "playerPoisoned": {
                    const hero = event.hero ?? sim.focus;
                    const player = sim.heroes[hero].player;
                    this.addHitsplat({
                        kind: event.type === "playerHit" ? "damage" : "poison",
                        x: player.x,
                        y: player.y,
                        amount: event.amount,
                        enemyUid: 0,
                        hero,
                        height: this.playerHitsplatHeight(hero),
                    });
                    break;
                }
                case "bossImpact":
                    // Faint: a lightning strike's or his gaze's light, not a power-up's
                    if (event.flash) {
                        this.flash = { color: event.flash, start: now, strength: IMPACT_FLASH };
                    }
                    break;
                case "bossSwing":
                    pushCapped(this.swings, {
                        x: event.x,
                        y: event.y,
                        radius: event.radius,
                        start: now,
                    });
                    break;
                case "bossShout":
                    // A new line replaces what it was saying
                    this.shouts = this.shouts.filter((s) => s.enemyUid !== event.enemyUid);
                    this.shouts.push({ enemyUid: event.enemyUid, text: event.text, start: now });
                    break;
                case "playerShout": {
                    const key = -(event.hero ?? sim.focus);
                    this.shouts = this.shouts.filter((s) => s.enemyUid !== key);
                    this.shouts.push({ enemyUid: key, text: event.text, start: now });
                    break;
                }
                case "visitorShout":
                    this.shouts = this.shouts.filter((s) => s.enemyUid !== VISITOR_SHOUT);
                    this.shouts.push({ enemyUid: VISITOR_SHOUT, text: event.text, start: now });
                    break;
                case "slash":
                    pushCapped(this.slashes, {
                        x: event.x,
                        y: event.y,
                        dirX: event.dirX,
                        dirY: event.dirY,
                        reach: event.reach,
                        arc: event.arc,
                        start: now,
                        color: SLASH_COLORS[event.weaponId],
                        hero: event.hero ?? sim.focus,
                    });
                    break;
                case "aura":
                    pushCapped(this.auras, {
                        x: event.x,
                        y: event.y,
                        radius: event.radius,
                        start: now,
                        hero: event.hero ?? sim.focus,
                    });
                    break;
                case "blast":
                    pushCapped(this.blasts, {
                        x: event.x,
                        y: event.y,
                        radius: event.radius,
                        start: now,
                    });
                    break;
                case "bossAbsorbBlast":
                    // Everywhere: there's no getting out of it
                    this.flash = { color: "#ff40c0", start: now, strength: 1 };
                    break;
                case "powerUp": {
                    const powerUp = getPowerUp(event.id);
                    if (powerUp.flash) {
                        this.flash = { color: powerUp.flash, start: now, strength: 1 };
                    }
                    if (powerUp.effect.kind === "nuke") {
                        pushCapped(this.blasts, { x: event.x, y: event.y, radius: 16, start: now });
                    }
                    break;
                }
            }
        }
    }

    // Spreads hitsplats landing on the same tick a little, like the client does
    private rngDelay(): number {
        return Math.random() * 60;
    }

    // On a floor's raised tiles and ramps (FloorTileRuleDef.height), on them
    private ground(sim: Sim, x: number, y: number): number {
        const lift = sim.floor ? sim.floor.liftAt(x, y) : 0;
        return sim.grid.getHeight(x, y) / 128 - lift;
    }

    // The ground for something big on a ScapeRune map, whose slopes are too steep to stand it by its
    // middle alone: it'd sink into the hill on one side. It's lifted part of the way to the
    // highest ground under it.
    private groundUnder(sim: Sim, x: number, y: number, radius: number): number {
        const middle = this.ground(sim, x, y);
        if (!sim.map.scaperune || radius < BIG_ACTOR_RADIUS) {
            return middle;
        }
        const reach = radius * 0.7;
        // Negative is up
        const top = Math.min(
            this.ground(sim, x - reach, y - reach),
            this.ground(sim, x + reach, y - reach),
            this.ground(sim, x - reach, y + reach),
            this.ground(sim, x + reach, y + reach),
        );
        return middle + Math.min(top - middle, 0) * BIG_ACTOR_LIFT;
    }

    submitActors(actors: ActorRenderer, sim: Sim, alpha: number): void {
        const tick = sim.tick;
        for (const hero of sim.heroes) {
            if (!hero.left) {
                this.drawPlayer(actors, sim, hero.index, alpha);
            }
        }

        for (const enemy of sim.enemies) {
            this.drawEnemy(actors, sim, enemy, alpha);
        }

        for (const thrall of sim.thralls) {
            this.drawThrall(actors, sim, thrall, alpha);
        }

        // Walked by GameClient on the sim's ticks; here they're only drawn
        for (const pet of this.pets.pets) {
            if (this.pets.shown(sim, pet)) {
                this.drawPet(actors, sim, pet, alpha);
            }
        }

        if (sim.visitor) {
            this.drawVisitor(actors, sim, sim.visitor);
        }
        this.drawTombsSpirit(actors, sim);

        for (const turret of sim.turrets) {
            const model = this.assets.get(CANNON_MODEL_KEY);
            if (model) {
                const anim = model.anims[0];
                // The real cannon takes up 3x3 tiles; smaller reads better next to the player
                actors.draw(
                    model,
                    anim,
                    0,
                    turret.x,
                    this.ground(sim, turret.x, turret.y),
                    turret.y,
                    (turret.yaw + CANNON_YAW_OFFSET) & 2047,
                    {
                        scale: CANNON_SCALE,
                    },
                );
            }
        }

        for (const projectile of sim.enemyProjectiles) {
            if (projectile.attack.wave || projectile.attack.lookId !== undefined) {
                this.drawSweeping(actors, sim, projectile, alpha, tick);
                continue;
            }
            const spotAnim = projectile.attack.spotAnim;
            const model = spotAnim !== undefined ? this.assets.get("spot:" + spotAnim) : undefined;
            if (!model || !hasGeometry(model)) {
                // Drawn as a glow on the overlay instead
                continue;
            }
            const x = lerp(projectile.prevX, projectile.x, alpha);
            const y = lerp(projectile.prevY, projectile.y, alpha);
            const anim = model.anims[0];
            const frame = anim.getFrame(tick - projectile.startTick);
            const height = this.ground(sim, x, y) - PROJECTILE_HEIGHT;
            // Bigger than in OSRS: most are a few pixels across from up here
            // Small ones drawn bigger, up to a tile across, and all outlined
            // the same thickness
            const scale = Math.min(
                ENEMY_PROJECTILE_SCALE,
                Math.max(1, PROJECTILE_MIN_RADIUS / Math.max(1, model.radius)),
            );
            actors.draw(model, anim, frame, x, height, y, projectile.yaw, {
                scale,
                outline: 1 + PROJECTILE_OUTLINE / (model.radius * scale + 1),
                unlit: 1,
            });
        }

        for (const projectile of sim.projectiles) {
            const x = lerp(projectile.prevX, projectile.x, alpha);
            const y = lerp(projectile.prevY, projectile.y, alpha);
            const height = this.ground(sim, x, y) - PROJECTILE_HEIGHT;
            let model: ActorModel | undefined;
            if (projectile.objId !== -1) {
                model = this.assets.get("obj:" + projectile.objId);
            } else if (projectile.spotAnim !== -1) {
                model = this.assets.get("spot:" + projectile.spotAnim);
            }
            if (!model) {
                continue;
            }
            const anim = model.anims[0];
            const frame = anim.getFrame(tick - projectile.startTick);
            const look = PROJECTILE_ITEM_LOOKS[projectile.objId];
            const yaw = (projectile.yaw + (look?.yawOffset ?? 0)) & 2047;
            // Seen into the dark, where they carry on to what they hit
            actors.draw(model, anim, frame, x, height, y, yaw, {
                scale: look?.scale ?? (projectile.kind === "rune" ? RUNE_SCALE : 1),
                unlit: 1,
            });
        }

        for (const pickup of sim.pickups) {
            const model = this.assets.get(getPickupModelKey(pickup));
            if (!model) {
                continue;
            }
            const x = lerp(pickup.prevX, pickup.x, alpha);
            const y = lerp(pickup.prevY, pickup.y, alpha);
            // Ground items turn slowly so they catch the eye
            let yaw = (pickup.uid * 331 + tick * 6) & 2047;
            let height = this.ground(sim, x, y);
            // Ground item models are big next to a top-down player; bigger
            // piles of bones and coins show a little bigger
            const pile = getPileLook(pickup);
            let scale = 0.85;
            // On a lit map caskets and power-ups show however dark it is; bones and coins don't
            let unlit = 0;
            if (pile) {
                scale = pile.scale;
            } else if (pickup.kind === "food") {
                scale = 1.1;
            } else if (pickup.kind === "casket") {
                scale = 1.3;
                unlit = 1;
                const t = (tick - pickup.spawnTick) / CASKET_HOP_TICKS;
                height -= casketHop(t);
                // Tumbling while it's in the air
                if (t < 1) {
                    yaw = (yaw + Math.round(t * 2048)) & 2047;
                }
                // A boss in disguise, about to come out: rattling on the spot
                const opening = pickup.disguise && pickup.disguise.openTick !== -1;
                if (opening) {
                    yaw = (yaw + Math.round(Math.sin(tick * 1.4) * 120)) & 2047;
                    height -= 0.12 * Math.abs(Math.sin(tick * 0.9));
                    scale = 1.5;
                }
            } else if (pickup.kind === "powerUp") {
                // Blinks when it's about to go
                const age = (tick - pickup.spawnTick) / TICKS_PER_SECOND;
                if (age > POWER_UP_LIFETIME - POWER_UP_BLINK && Math.floor(tick / 6) % 2 === 0) {
                    continue;
                }
                scale = getPowerUpScale(model);
                height -= getPowerUpBob(pickup, tick);
                unlit = 1;
            }
            actors.draw(model, model.anims[0], 0, x, height, y, yaw, { scale, unlit });
        }

        for (const rock of sim.rocks) {
            this.drawRock(actors, sim, rock);
        }

        for (const rampage of sim.rampages) {
            this.drawRampage(actors, sim, rampage, alpha);
        }

        // The map's props, and the cinematic's cast (standing in for some of them) while it plays
        const cinematic = this.cinematic;
        sim.map.props?.forEach((prop, i) => {
            if (!cinematic || !this.cinematicView.hidesProp(cinematic, i)) {
                this.drawProp(actors, sim, prop, alpha);
            }
        });
        if (cinematic) {
            this.cinematicView.submitActors(actors, cinematic, (x, y) => this.ground(sim, x, y));
        }

        for (const ring of sim.rings) {
            this.drawRing(actors, sim, ring);
        }

        for (const fire of sim.fires) {
            this.drawFire(actors, sim, fire);
        }

        for (const pool of sim.pools) {
            this.drawPool(actors, sim, pool);
        }

        for (const tether of sim.tethers) {
            this.drawTether(actors, sim, tether, alpha);
        }

        const teleporter = sim.raidTeleporter;
        if (teleporter) {
            this.drawTeleporter(actors, sim, teleporter);
        }
        this.drawTombsGate(actors, sim);
        this.drawTombsPeels(actors, sim);
        this.drawSarcophagi(actors, sim);
        this.drawHet(actors, sim);
        this.drawAkkha(actors, sim);
        this.drawScabaras(actors, sim);
        this.drawKephri(actors, sim, alpha);
        this.drawCrondis(actors, sim);
        this.drawZebak(actors, sim);
        this.drawWardens(actors, sim);

        for (const glyph of sim.glyphs) {
            this.drawGlyph(actors, sim, glyph, alpha);
        }

        // A boss fight's own: its warnings, its shots and its statues coming to life, all seen in
        // the dark
        actors.unlitAtLeast = 1;
        this.fight.submitActors(actors, sim, alpha);
        actors.unlitAtLeast = 0;
        this.floor.submitActors(actors, sim, alpha);

        for (const effect of sim.effects) {
            const model = this.assets.get("spot:" + effect.spotAnim);
            if (!model) {
                continue;
            }
            const anim = model.anims[0];
            // Played out, and gone (an impact's dust), rather than held on its last frame
            if (effect.once && tick - effect.startTick >= anim.totalTicks) {
                continue;
            }
            const frame = anim.getFrame(tick - effect.startTick, effect.loop ?? false);
            const height = this.ground(sim, effect.x, effect.y) - effect.height;
            const fit = effect.fitRadius;
            actors.draw(
                model,
                anim,
                frame,
                effect.x,
                height,
                effect.y,
                effect.yaw ?? 0,
                // Spells' impacts and bosses' warnings, seen in the dark
                fit !== undefined
                    ? { scale: (fit * 128) / Math.max(1, model.radius), unlit: 1 }
                    : UNLIT,
            );
        }
    }

    // Falling faster and faster, then fading away where it landed
    private drawRock(actors: ActorRenderer, sim: Sim, rock: FallingRock): void {
        const model = this.assets.get("loc:" + rock.locId);
        if (!model) {
            return;
        }
        const t = Math.min(1, (sim.tick - rock.startTick) / (rock.landTick - rock.startTick));
        const height = this.ground(sim, rock.x, rock.y) - ROCK_FALL_HEIGHT * (1 - t * t);
        const fade = Math.min(1, (rock.endTick - sim.tick) / ROCK_FADE_TICKS);
        actors.draw(model, model.anims[0], 0, rock.x, height, rock.y, (rock.uid * 331) & 2047, {
            scale: ROCK_SCALE,
            alpha: Math.max(0, fade),
            unlit: 1,
        });
    }

    // An NPC posed on the map as scenery (MapDef.props), its animation on the sim's clock
    private drawProp(actors: ActorRenderer, sim: Sim, prop: MapPropDef, alpha: number): void {
        const model = this.assets.get(getPropKey(prop.npcId));
        if (!model) {
            return;
        }
        const anim = model.getAnim(prop.seq);
        const { x, y } = prop;
        actors.draw(
            model,
            anim,
            anim.getFrame(sim.tick + alpha),
            x,
            this.ground(sim, x, y),
            y,
            prop.yaw ?? 0,
            { scale: prop.scale ?? 1 },
        );
    }

    // Black cats are lost on the darker maps, so always with the silhouette and
    // lit up a little
    private drawRampage(actors: ActorRenderer, sim: Sim, rampage: Rampage, alpha: number): void {
        const model = this.assets.get("rampage:" + rampage.powerUpId);
        // The clock runs on when the run's over, but nothing moves
        if (!model || sim.runOver) {
            return;
        }
        const anim = model.getAnim(rampage.walkSeq);
        const x = lerp(rampage.prevX, rampage.x, alpha);
        const y = lerp(rampage.prevY, rampage.y, alpha);
        const faded =
            rampage.doneTick === -1 ? 0 : (sim.tick - rampage.doneTick) / RAMPAGE_FADE_TICKS;
        actors.draw(
            model,
            anim,
            anim.getFrame((sim.tick - rampage.startTick) * RAMPAGE_ANIM_SPEED),
            x,
            this.ground(sim, x, y),
            y,
            rampage.yaw,
            {
                scale: rampage.scale,
                alpha: Math.max(0, 1 - faded),
                silhouette: true,
                flash: RAMPAGE_FLASH,
                unlit: 1,
            },
        );
    }

    // Opening and closing quickly, at either end of its time
    private drawRing(actors: ActorRenderer, sim: Sim, ring: FairyRing): void {
        const model = this.assets.get("loc:" + ring.locId);
        // The clock runs on past its end when the run's over
        if (!model || sim.tick >= ring.endTick) {
            return;
        }
        const open = Math.min(sim.tick - ring.startTick, ring.endTick - sim.tick);
        const height = this.ground(sim, ring.x, ring.y);
        actors.draw(model, model.anims[0], 0, ring.x, height, ring.y, 0, {
            scale: ring.scale * Math.min(1, 0.4 + open / RING_OPEN_TICKS),
            unlit: 1,
        });
    }

    // Each flame turned and a little out of step with the next, so they don't
    // flicker as one
    private drawFire(actors: ActorRenderer, sim: Sim, fire: GroundFire): void {
        const model = this.assets.get("loc:" + fire.locId);
        // The clock runs on past its end when the run's over
        if (!model || sim.tick >= fire.endTick) {
            return;
        }
        const anim = model.anims[0];
        fire.flames.forEach(({ x, y }, i) => {
            const frame = anim.getFrame(sim.tick + i * FLAME_STEP_TICKS);
            actors.draw(model, anim, frame, x, this.ground(sim, x, y), y, i * FLAME_TURN, {
                scale: FLAME_SCALE,
                unlit: 1,
            });
        });
    }

    // A Tombs room's barrier, which isn't in the map (the sim holds its line): on its tiles until
    // the room's done, as the loc stands there turned a quarter
    private drawTombsGate(actors: ActorRenderer, sim: Sim): void {
        const gate = sim.tombsGate;
        if (!gate || !sim.tombsRoom || sim.tombsRoom.doneTick !== undefined || sim.tombsRoom.boss) {
            return;
        }
        const model = this.assets.get("loc:" + gate.locId);
        if (!model) {
            return;
        }
        const anim = model.anims[0];
        for (const tile of gate.tiles) {
            const height = this.ground(sim, tile.x, tile.y);
            actors.draw(
                model,
                anim,
                anim.getFrame(sim.tick, true),
                tile.x,
                height,
                tile.y,
                // Across a way in from the south it stands as the loc does; from the east, turned
                gate.x !== undefined ? TOMBS_GATE_YAW : 0,
            );
        }
    }

    // The Het room: its mirrors (dirty ones as they look), the beam's last pulse for a moment,
    // tile by tile along its way, and the Orbs of Darkness rolling
    private drawHet(actors: ActorRenderer, sim: Sim): void {
        const het = sim.tombsRoom?.het;
        if (!het) {
            return;
        }
        const clean = this.assets.get("loc:" + HET.mirrorLoc);
        const dirty = this.assets.get("loc:" + HET.dirtyLoc);
        const fixed = this.assets.get("loc:" + HET.fixedLoc);
        const spot = this.assets.get("loc:" + HET.spotLoc);
        const put = (model: typeof clean, x: number, y: number, yaw = 0, lift = 0, scale = 1) => {
            if (model) {
                actors.draw(model, model.anims[0], 0, x, this.ground(sim, x, y) + lift, y, yaw, {
                    scale,
                });
            }
        };
        const glowAt = (x: number, y: number, scale: number, lift = 0) =>
            this.drawGlowCircle(actors, sim, x, y, scale, lift);
        for (const p of het.spots) {
            put(spot, p.x, p.y);
        }
        // Each hero's carried mirrors, stacked over their head
        const stacked = new Map<number, number>();
        for (const mirror of het.mirrors) {
            const model = mirror.dirty ? (dirty ?? clean) : mirror.fixed ? (fixed ?? clean) : clean;
            if (mirror.carrier !== undefined) {
                const n = stacked.get(mirror.carrier) ?? 0;
                stacked.set(mirror.carrier, n + 1);
                put(model, mirror.x, mirror.y, 0, 1.6 + n * 0.35, 0.6);
            } else {
                // A loose one glows: it can be picked up
                if (!mirror.fixed && mirror.spot === undefined) {
                    glowAt(mirror.x, mirror.y, 2);
                }
                put(model, mirror.x, mirror.y, mirror.turn * 512);
            }
        }
        const barrier = this.assets.get("loc:" + HET.barrierLoc);
        const worn = this.assets.get("loc:" + HET.wornLoc);
        for (const b of het.barriers) {
            put(b.worn ? (worn ?? barrier) : barrier, b.x, b.y);
            // Its circle, to stand in to break it
            if (b.stand) {
                glowAt(b.stand.x, b.stand.y, 0.9);
            }
        }
        // The seal's ring, to stand in to mine it, while it's open
        if (het.openUntil !== -1) {
            for (const tile of het.ring) {
                glowAt(tile.x, tile.y, 0.9);
            }
        }
        // The caster charging: a glow at its face, growing over the last of the wait
        const room = sim.tombsPathRoom?.het;
        const charge = sim.hetInfo?.charge ?? 0;
        if (room && charge > 0.6) {
            glowAt(room.beam.x, room.beam.y, 0.6 + (charge - 0.6) * 2.5, 0.5);
        }
        const beam = het.beam;
        if (beam && sim.tick - beam.tick < Math.round(HET.beamShow * TICKS_PER_SECOND)) {
            const along = this.assets.get("spot:" + HET.beamSpotAnims.along);
            const across = this.assets.get("spot:" + HET.beamSpotAnims.across);
            const age = sim.tick - beam.tick;
            for (let i = 1; i < beam.points.length; i++) {
                const a = beam.points[i - 1];
                const b = beam.points[i];
                const vertical = a.x === b.x;
                const model = vertical ? along : across;
                if (!model) {
                    continue;
                }
                const steps = Math.round(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)));
                for (let t = 0; t <= steps; t++) {
                    const x = a.x + ((b.x - a.x) * t) / Math.max(1, steps);
                    const y = a.y + ((b.y - a.y) * t) / Math.max(1, steps);
                    const anim = model.anims[0];
                    actors.draw(model, anim, anim.getFrame(age), x, this.ground(sim, x, y), y, 0);
                }
            }
            const impact = this.assets.get("spot:" + HET.beamSpotAnims.impact);
            const end = beam.points[beam.points.length - 1];
            if (impact && !beam.hit) {
                const anim = impact.anims[0];
                actors.draw(
                    impact,
                    anim,
                    anim.getFrame(age),
                    end.x,
                    this.ground(sim, end.x, end.y),
                    end.y,
                    0,
                );
            }
        }
        const orbDef = getEnemy("het_orb");
        const orb = this.assets.get(getEnemyModelKey(orbDef, 0));
        if (orb) {
            const anim = orb.getAnim(orbDef.walkSeq);
            for (const one of het.orbs) {
                const yaw = yawFromVector(one.vx, one.vy);
                actors.draw(
                    orb,
                    anim,
                    anim.getFrame(sim.tick, true),
                    one.x,
                    this.ground(sim, one.x, one.y),
                    one.y,
                    yaw,
                );
            }
        }
    }

    // Zebak's island: his acid, a puddle of it on each tile a pool covers, and his tidal waves,
    // a crest on each tile across but the gap
    private drawZebak(actors: ActorRenderer, sim: Sim): void {
        const fight = sim.tombsZebak;
        if (!fight) {
            return;
        }
        const acid = this.assets.get("loc:" + ZEBAK.acid.loc);
        if (acid) {
            const anim = acid.anims[0];
            for (const pool of fight.acid) {
                for (let dy = -pool.half; dy <= pool.half; dy++) {
                    for (let dx = -pool.half; dx <= pool.half; dx++) {
                        const x = pool.x + dx;
                        const y = pool.y + dy;
                        actors.draw(acid, anim, 0, x, this.ground(sim, x, y), y, 0);
                    }
                }
            }
        }
        this.drawZebakRoar(actors, sim, fight);
        const island = sim.tombsPathRoom?.boss?.island;
        const look = getEnemy(ZEBAK.waves.look);
        const crest = this.assets.get(getEnemyModelKey(look, 0));
        if (island && crest) {
            const anim = crest.getAnim(look.walkSeq);
            for (const wave of fight.waves) {
                if (sim.tick < wave.startTick) {
                    continue;
                }
                for (let x = island.x0 + 0.5; x <= island.x1 + 0.5; x++) {
                    if (x >= wave.gapX0 && x <= wave.gapX1) {
                        continue;
                    }
                    actors.draw(
                        crest,
                        anim,
                        anim.getFrame(sim.tick, true),
                        x,
                        this.ground(sim, x, wave.y),
                        wave.y,
                        wave.dir > 0 ? 0 : 1024,
                    );
                }
            }
        }
    }

    // Zebak's roar: while it's coming and as it goes off, the ground each boulder shelters
    // glowing behind it (as zebakShelters has it); as it goes off, its shockwave, blown dust
    // rolling out from him over the whole island but where the boulders shelter, as OSRS's does
    private drawZebakRoar(actors: ActorRenderer, sim: Sim, fight: ZebakFight): void {
        const roar = ZEBAK.roar;
        const wave = roar.shockwave;
        const ticks = wave.seconds * TICKS_PER_SECOND;
        const roared = fight.roared;
        const since = roared ? sim.tick - roared.tick : -1;
        const going = roared !== undefined && since >= 0 && since < ticks;
        const boss = sim.enemies.find((e) => e.uid === fight.uid && !e.dead);
        // Where it's from and what shelters: as it's coming, his boulders now; as it goes, those
        // it went off over
        const from = going ? roared : fight.roar && boss;
        if (!from) {
            return;
        }
        const rocks = going
            ? roared.rocks
            : sim.tombsCover.filter((rock) => rock.look === roar.look);
        // Straight behind each, down the island from him, as wide as it shelters: a circle a tile
        // across on its middle, and one each side with its edge where the shelter's is
        for (const rock of rocks) {
            const away = rock.y >= from.y ? 1 : -1;
            const side = rock.radius + ZEBAK_SHELTER_SIDE - 0.5;
            for (let out = rock.radius + 0.4; out <= roar.shelter + rock.radius; out += 1) {
                for (const across of [-side, 0, side]) {
                    const y = rock.y + away * out;
                    this.drawGlowCircle(actors, sim, rock.x + across, y, ZEBAK_SHELTER_SCALE);
                }
            }
        }
        const island = sim.tombsPathRoom?.boss?.island;
        const dust = this.assets.get("spot:" + wave.spotAnim);
        if (!going || !island || !dust) {
            return;
        }
        const anim = dust.anims[0];
        const t = since / ticks;
        // Its front, out from him, and fading once it's across
        const front = wave.reach * Math.min(1, t * 1.6);
        const alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
        const frame = anim.getFrame(since, true);
        for (let y = island.y0 + 0.5; y <= island.y1 + 0.5; y += ZEBAK_SHOCKWAVE_STEP) {
            for (let x = island.x0 + 0.5; x <= island.x1 + 0.5; x += ZEBAK_SHOCKWAVE_STEP) {
                if (Math.hypot(x - from.x, y - from.y) > front) {
                    continue;
                }
                if (zebakShelters(from.x, from.y, x, y, rocks, roar.shelter)) {
                    continue;
                }
                actors.draw(dust, anim, frame, x, this.ground(sim, x, y), y, 0, {
                    scale: wave.scale,
                    flash: ZEBAK_SHOCKWAVE_FLASH,
                    alpha,
                });
            }
        }
    }

    // The Wardens' room: each Warden's charging platform, as full as it is; the obelisk's orbs down
    // the troughs; the pyramids, while they're up; and the shots, on their way to whoever they're
    // for, arcing over
    private drawWardens(actors: ActorRenderer, sim: Sim): void {
        const places = sim.map.tombs?.wardens;
        if (!places) {
            return;
        }
        const fight = sim.tombsWardens;
        const platforms = WARDENS.charge.platforms;
        for (const side of ["elidinis", "tumeken"] as const) {
            const charge = fight?.phase === 1 ? fight.charge[side] : 0;
            const filled = Math.floor((charge / WARDENS.charge.full) * (platforms.length - 1));
            const model = this.assets.get(
                "loc:" + platforms[Math.min(platforms.length - 1, Math.max(0, filled))],
            );
            if (model) {
                const at = places[side];
                // Turned with the room: Elidinis' faces west, Tumeken's east
                const rotation = side === "elidinis" ? 1 : 3;
                actors.draw(
                    model,
                    model.anims[0],
                    0,
                    at.x,
                    this.ground(sim, at.x, at.y),
                    at.y,
                    rotation * 512,
                );
            }
        }
        if (!fight) {
            return;
        }
        const look = getEnemy(WARDENS.orbs.lookId);
        const orb = this.assets.get(getEnemyModelKey(look, 0));
        if (orb) {
            const anim = orb.getAnim(look.idleSeq);
            const step = WARDENS.orbs.stepSeconds * TICKS_PER_SECOND;
            for (const one of fight.orbs) {
                const t = Math.min(1, (sim.tick - one.stepTick) / step);
                const x = one.fromX + (one.x - one.fromX) * t;
                const y = one.fromY + (one.y - one.fromY) * t;
                actors.draw(
                    orb,
                    anim,
                    anim.getFrame(sim.tick, true),
                    x,
                    this.ground(sim, x, y) - 0.3,
                    y,
                    0,
                );
            }
        }
        const { cell, leave } = WARDENS.pyramids;
        for (const pyramid of fight.pyramids) {
            const since = sim.tick - pyramid.startTick;
            if (since < 0 || since >= leave * TICKS_PER_SECOND) {
                continue;
            }
            const model = this.assets.get("loc:" + WARDENS.wardens[pyramid.side].pyramid);
            if (!model) {
                continue;
            }
            const anim = model.anims[0];
            const x = pyramid.x + cell / 2;
            const y = pyramid.y + cell / 2;
            actors.draw(model, anim, anim.getFrame(since, true), x, this.ground(sim, x, y), y, 0);
        }
        for (const shot of fight.shots) {
            const hero = sim.heroes[shot.hero];
            const model = this.assets.get("spot:" + WARDENS.wardens[shot.side].shotSpotAnim);
            if (!hero || !model) {
                continue;
            }
            const from = places[shot.side];
            const t = Math.min(1, (sim.tick - shot.startTick) / (shot.landTick - shot.startTick));
            const x = from.x + (hero.player.x - from.x) * t;
            const y = from.y + (hero.player.y - from.y) * t;
            const arc = 1 + Math.sin(Math.PI * t) * 3;
            const anim = model.anims[0];
            actors.draw(
                model,
                anim,
                anim.getFrame(sim.tick, true),
                x,
                this.ground(sim, x, y) - arc,
                y,
                0,
                // Big enough to see coming across the room
                SHOT_LOOK,
            );
        }
        // The second and last phases' marks on the floor: glows and shadows, then what strikes
        for (const mark of fight.marks) {
            if (sim.tick < mark.from || sim.tick >= mark.to) {
                continue;
            }
            const model = this.assets.get("spot:" + mark.spotAnim);
            if (!model) {
                continue;
            }
            const anim = model.anims[0];
            actors.draw(
                model,
                anim,
                anim.getFrame(sim.tick - mark.from, true),
                mark.x,
                this.ground(sim, mark.x, mark.y),
                mark.y,
                0,
                // What strikes, bigger than the warnings, to be seen
                mark.hurts > 0 ? MARK_STRIKE_LOOK : undefined,
            );
        }
        // The obelisk's skulls, thrown in an arc to where they'll land
        const skull = this.assets.get("spot:" + WARDENS.two.skulls.projectile);
        if (skull) {
            const anim = skull.anims[0];
            for (const one of fight.two?.skulls ?? []) {
                if (sim.tick < one.startTick) {
                    continue;
                }
                const t = Math.min(1, (sim.tick - one.startTick) / (one.landTick - one.startTick));
                const x = one.fromX + (one.x - one.fromX) * t;
                const y = one.fromY + (one.y - one.fromY) * t;
                const arc = 1 + Math.sin(Math.PI * t) * 4;
                actors.draw(
                    skull,
                    anim,
                    anim.getFrame(sim.tick, true),
                    x,
                    this.ground(sim, x, y) - arc,
                    y,
                    0,
                    SHOT_LOOK,
                );
            }
        }
    }

    // The Crondis room: its waterfalls, running or dry; its spears, glinting out of their
    // statues as their tell and then right out across their rows; its poison coming down the
    // corridors, the pale clouds ahead of the dark
    private drawCrondis(actors: ActorRenderer, sim: Sim): void {
        const crondis = sim.tombsRoom?.crondis;
        const def = sim.tombsPathRoom?.crondis;
        if (!crondis || !def) {
            return;
        }
        const locs = CRONDIS.locs;
        def.falls.forEach((fall, i) => {
            const dry = sim.tick < crondis.dryUntil[i];
            const model =
                this.assets.get("loc:" + (dry ? locs.dry : locs.waterfall)) ??
                this.assets.get("loc:" + locs.waterfall);
            if (model) {
                const anim = model.anims[0];
                const { x, y } = fall.at;
                actors.draw(
                    model,
                    anim,
                    anim.getFrame(sim.tick, true),
                    x,
                    this.ground(sim, x, y),
                    y,
                    fall.rotation * 512,
                );
            }
        });
        const spear = this.assets.get("loc:" + locs.spear);
        const tell = Math.round(CRONDIS.spearTell * TICKS_PER_SECOND);
        if (spear) {
            const anim = spear.anims[0];
            for (const thrust of crondis.thrusts) {
                const area = sim.crondisSpearArea(def, thrust);
                const telling = sim.tick - thrust.startTick < tell;
                // Out from its statue's side: a tile out while it's telling, its three once it's out
                const out = telling ? 1 : 3;
                const low = thrust.side === "low";
                const x = low ? area.x0 + out / 2 : area.x1 - out / 2;
                // One spear from its statue, between the two rows it covers
                const y = area.y0 + 1;
                actors.draw(spear, anim, 0, x, this.ground(sim, x, y), y, low ? 0 : 1024, {
                    flash: telling ? 0.6 : 0,
                });
            }
        }
        // Each puff a little out of step with the next, so the cloud churns
        const play = (spotAnim: number, x: number, y: number, tint: number, alpha = 1) => {
            const model = this.assets.get("spot:" + spotAnim);
            if (!model) {
                return;
            }
            const anim = model.anims[0];
            const frame = anim.getFrame(sim.tick + Math.floor(x * 7 + y * 3), true);
            actors.draw(model, anim, frame, x, this.ground(sim, x, y), y, 0, {
                alpha,
                tint,
                scale: CRONDIS_CLOUD_SCALE,
            });
        };
        for (const cloud of crondis.clouds) {
            const lane = def.lanes[cloud.lane];
            const { pale, dark } = sim.crondisCloud(def, cloud);
            const length = lane.y1 - lane.y0 + 1;
            const at = (along: number) => (lane.fromLow ? lane.y0 + along : lane.y1 + 1 - along);
            for (let along = Math.floor(dark) + 0.5; along < pale && along < length; along++) {
                for (let x = lane.x0 + 1; x <= lane.x1 + 0.5; x += 1.5) {
                    play(
                        CRONDIS.spotAnims.pale,
                        x,
                        at(along),
                        CRONDIS_PALE_TINT,
                        CRONDIS.paleAlpha,
                    );
                }
            }
            for (
                let along = Math.max(0.5, Math.floor(dark - CRONDIS.cloudLength) + 0.5);
                along < dark && along < length;
                along++
            ) {
                for (let x = lane.x0 + 0.5; x <= lane.x1 + 0.5; x += 1) {
                    play(CRONDIS.spotAnims.dark, x, at(along), CRONDIS_DARK_TINT);
                }
            }
        }
    }

    // Kephri: her swarm's shield round her while it's up (2141), and her flies round whoever's
    // about to be thrown back (2146)
    private drawKephri(actors: ActorRenderer, sim: Sim, alpha: number): void {
        const fight = sim.tombsKephri;
        if (!fight) {
            return;
        }
        const boss = sim.enemies.find((e) => e.uid === fight.uid && !e.dead);
        const play = (spotAnim: number, x: number, y: number, scale = 1) => {
            const model = this.assets.get("spot:" + spotAnim);
            if (!model) {
                return;
            }
            const anim = model.anims[0];
            actors.draw(
                model,
                anim,
                anim.getFrame(sim.tick, true),
                x,
                this.ground(sim, x, y),
                y,
                0,
                {
                    scale,
                },
            );
        };
        if (boss && !fight.final && !fight.intermission && fight.shield > 0) {
            play(KEPHRI_SHIELD_SPOTANIM, boss.x, boss.y, 1.6);
        }
        for (const index of sim.kephriDungHeroes) {
            // Where the player's shown (a guest's own predicted), as their model is
            if (sim.heroes[index]) {
                const pose = getPlayerPose(sim, index, alpha, this.localPlayerPose);
                play(KEPHRI.dung.spotAnim, pose.x, pose.y);
            }
        }
    }

    // The Scabaras room's boards: Sequence's plates (the one it's showing lit, and those done),
    // Lights out's ring, Addition's symbols (lit once stepped on), Matching's tiles (each with its
    // symbol, lit while stepped on, shining once matched), and the roof's shards flying
    private drawScabaras(actors: ActorRenderer, sim: Sim): void {
        const scabaras = sim.tombsRoom?.scabaras;
        const def = sim.tombsPathRoom?.scabaras;
        if (!scabaras || !def) {
            return;
        }
        const locs = SCABARAS.locs;
        const put = (id: number, x: number, y: number, animated = false, flash = 0) => {
            const model = this.assets.get("loc:" + id);
            if (!model) {
                return;
            }
            const anim = model.anims[0];
            const frame = animated ? anim.getFrame(sim.tick, true) : 0;
            actors.draw(model, anim, frame, x, this.ground(sim, x, y), y, 0, { flash });
        };
        const solved = (puzzle: string) => scabaras.solved.some((p) => p === puzzle);
        const lit = sim.scabarasLitPlate;
        const sequence = scabaras.sequence;
        def.sequence.forEach((p, i) => {
            put(locs.plate, p.x, p.y);
            const at = sequence.order.indexOf(i);
            if (i === lit) {
                put(locs.plateLit, p.x, p.y, true, 0.7);
            } else if (solved("sequence") || (at !== -1 && at < sequence.step)) {
                put(locs.platePressed, p.x, p.y, true);
            }
        });
        def.lights.forEach((p, i) => {
            put(locs.lightsPlate, p.x, p.y);
            if (scabaras.lights[i]) {
                put(locs.lightsOn, p.x, p.y, true, 0.4);
            }
        });
        const addition = scabaras.addition;
        def.addition.forEach((p, i) => {
            put(locs.symbols[addition.values[i] - 1], p.x, p.y);
            if (addition.stepped[i] || solved("addition")) {
                put(locs.stepped, p.x, p.y, true);
            }
        });
        // The slates by the way in (what the symbols are worth), Addition's Ancient tablet and
        // Sequence's Ancient button: their screens are the HUD's, by one
        for (const p of def.slates) {
            put(locs.tablet, p.x, p.y);
        }
        put(locs.tablet, def.tablet.x, def.tablet.y);
        put(locs.button, def.button.x, def.button.y);
        // Matching: every tile's symbol on it from the start, as OSRS's: the puzzle's finding its
        // partner on the other board. The one stepped on is lit; a matched pair shines.
        const matching = scabaras.matching;
        for (const side of ["north", "south"] as const) {
            def.matching[side].forEach((p, i) => {
                const symbol = matching[side][i];
                const matched = matching.matched[symbol];
                put(locs.shown[symbol], p.x, p.y, false, matching.up[side] === i ? 0.5 : 0);
                if (matched) {
                    put(locs.matched, p.x, p.y, true);
                }
            });
        }
        const look = getEnemy(SCABARAS.shardLook);
        const shard = this.assets.get(getEnemyModelKey(look, 0));
        if (shard) {
            const anim = shard.getAnim(look.walkSeq);
            for (const one of scabaras.shards) {
                actors.draw(
                    shard,
                    anim,
                    anim.getFrame(sim.tick, true),
                    one.x,
                    this.ground(sim, one.x, one.y),
                    one.y,
                    yawFromVector(one.vx, one.vy),
                    { scale: SCABARAS.shardScale },
                );
            }
        }
    }

    // Akkha's floor: the symbol he's showing lit up (Memory Blast), what's
    // just gone up over the quadrants it took, and his trailing orbs
    private drawAkkha(actors: ActorRenderer, sim: Sim): void {
        const fight = sim.tombsAkkha;
        const area = sim.tombsPathRoom?.boss?.quadrants;
        if (!fight || !area) {
            return;
        }
        const lit = sim.akkhaLit;
        // The floor has its symbols: the one he's showing is drawn over its own, lit up
        if (lit !== undefined) {
            const element = AKKHA.elements[lit];
            const at = sim.akkhaCorner(lit, AKKHA_SYMBOL_OUT);
            const height = this.ground(sim, at.x, at.y);
            const model = this.assets.get("loc:" + element.symbolLoc);
            const lifted = height + AKKHA_SYMBOL_LIFT;
            if (model) {
                const anim = model.anims[0];
                actors.draw(model, anim, anim.getFrame(sim.tick, true), at.x, lifted, at.y, 0, {
                    scale: AKKHA_SYMBOL_SCALE,
                    // Glowing in its element's colour: darkness's own model is near black
                    flash: AKKHA_SYMBOL_GLOW,
                    tint: element.glow,
                });
            }
            const funnel = this.assets.get("spot:" + AKKHA_FUNNEL_SPOTANIM);
            if (funnel) {
                // Twice, half its loop apart: its animation has gaps with nothing in them
                const anim = funnel.anims[0];
                const half = Math.max(1, Math.floor(anim.totalTicks / 2));
                for (const offset of [0, half]) {
                    const frame = anim.getFrame(sim.tick + offset, true);
                    actors.draw(funnel, anim, frame, at.x, height, at.y, 0, {
                        scale: AKKHA_FUNNEL_SCALE,
                        flash: AKKHA_FUNNEL_GLOW,
                        tint: element.glow,
                    });
                }
            }
        }
        // A blast or a flood: its element all over each quadrant it took. The one he's showing
        // glows with it, fainter, as the room's sections do.
        const fill = (quadrant: number, age: number, alpha: number) => {
            const model = this.assets.get("spot:" + AKKHA.elements[quadrant].spotAnim);
            if (!model) {
                return;
            }
            const anim = model.anims[0];
            const east = quadrant === 1 || quadrant === 2;
            const north = quadrant === 0 || quadrant === 1;
            for (let i = 1; i < area.half; i += 2) {
                for (let j = 1; j < area.half; j += 2) {
                    // The floor's round
                    if (Math.hypot(i, j) > area.half - 0.5) {
                        continue;
                    }
                    const x = area.middle.x + (east ? i : -i);
                    const y = area.middle.y + (north ? j : -j);
                    const height = this.ground(sim, x, y);
                    actors.draw(model, anim, anim.getFrame(age, true), x, height, y, 0, { alpha });
                }
            }
        };
        for (const burst of fight.bursts) {
            for (const quadrant of burst.quadrants) {
                fill(quadrant, sim.tick - burst.tick, 1);
                this.drawAkkhaSpray(actors, sim, area, quadrant, burst.tick);
            }
        }
        if (lit !== undefined) {
            fill(lit, sim.tick, AKKHA_GLOW_ALPHA);
        }
        for (const orb of fight.orbs) {
            const def = getEnemy(AKKHA.elements[orb.quadrant].orb);
            const model = this.assets.get(getEnemyModelKey(def, 0));
            if (!model) {
                continue;
            }
            const anim = model.getAnim(def.idleSeq);
            const height = this.ground(sim, orb.x, orb.y);
            actors.draw(model, anim, anim.getFrame(sim.tick, true), orb.x, height, orb.y, 0, {
                alpha: sim.tick < orb.armTick ? 0.5 : 1,
            });
        }
    }

    // A blast's spray of bright orbs out of a quadrant (AKKHA_SPRAY_*): each from somewhere in
    // it, up and out in an arc, fading as it falls. Where each goes is from the burst's tick, so
    // it's the same every frame; drawn only.
    private drawAkkhaSpray(
        actors: ActorRenderer,
        sim: Sim,
        area: { middle: { x: number; y: number }; half: number },
        quadrant: number,
        startTick: number,
    ): void {
        const t = (sim.tick - startTick) / AKKHA_SPRAY_TICKS;
        if (t < 0 || t >= 1) {
            return;
        }
        const element = AKKHA.elements[quadrant];
        const def = getEnemy(element.orb);
        const model = this.assets.get(getEnemyModelKey(def, 0));
        if (!model) {
            return;
        }
        const anim = model.getAnim(def.idleSeq);
        const frame = anim.getFrame(sim.tick, true);
        const east = quadrant === 1 || quadrant === 2;
        const north = quadrant === 0 || quadrant === 1;
        // A number from 0 to 1 for each orb's each pick, from the burst
        const pick = (n: number) => {
            const v = Math.sin((startTick * 31 + quadrant * 977 + n) * 12.9898) * 43758.5453;
            return v - Math.floor(v);
        };
        for (let i = 0; i < AKKHA_SPRAY_ORBS; i++) {
            const n = i * 5;
            // From somewhere in the quadrant, on the floor's round (the one fill keeps to) and a
            // tile in from its edge: a square's far corner is off it
            let outX = 1 + pick(n) * (area.half - 2);
            let outY = 1 + pick(n + 1) * (area.half - 2);
            const out = Math.hypot(outX, outY);
            const most = area.half - 1.5;
            if (out > most) {
                outX *= most / out;
                outY *= most / out;
            }
            const fromX = area.middle.x + (east ? outX : -outX);
            const fromY = area.middle.y + (north ? outY : -outY);
            const angle = pick(n + 2) * Math.PI * 2;
            const reach = AKKHA_SPRAY_REACH * (0.4 + 0.6 * pick(n + 3)) * t;
            const x = fromX + Math.cos(angle) * reach;
            const y = fromY + Math.sin(angle) * reach;
            // Up and back down (up being less)
            const rise = AKKHA_SPRAY_HEIGHT * (0.5 + 0.5 * pick(n + 4)) * 4 * t * (1 - t);
            actors.draw(model, anim, frame, x, this.ground(sim, x, y) - rise, y, 0, {
                scale: AKKHA_SPRAY_SCALE,
                flash: AKKHA_SPRAY_GLOW,
                tint: element.glow,
                alpha: 1 - t * t,
            });
        }
    }

    // Ba-Ba's open sarcophagi, over the closed ones in the map
    private drawSarcophagi(actors: ActorRenderer, sim: Sim): void {
        const model = sim.tombsSarcophagi.length > 0 && this.assets.get("loc:" + SARCOPHAGI.loc);
        if (!model) {
            return;
        }
        const anim = model.anims[0];
        const frame = anim.getFrame(0);
        for (const at of sim.tombsSarcophagi) {
            if (sim.tick < at.openUntil) {
                const height = this.ground(sim, at.x, at.y);
                actors.draw(model, anim, frame, at.x, height, at.y, at.rotation * 512, {
                    scale: 1.02,
                });
            }
        }
    }

    // Jungle Japes's banana peels, lying where her baboons fell
    private drawTombsPeels(actors: ActorRenderer, sim: Sim): void {
        const model = sim.tombsPeels.length > 0 && this.assets.get("obj:" + JUNGLE_JAPES.objId);
        if (!model) {
            return;
        }
        const anim = model.anims[0];
        const frame = anim.getFrame(0);
        for (const peel of sim.tombsPeels) {
            actors.draw(model, anim, frame, peel.x, this.ground(sim, peel.x, peel.y), peel.y, 0, {
                scale: PEEL_SCALE,
            });
        }
    }

    // A raid hall's teleporter, once the raid's been beaten
    private drawTeleporter(actors: ActorRenderer, sim: Sim, at: { x: number; y: number }): void {
        const model = this.assets.get("loc:" + RAID_PORTAL_LOC);
        if (!model) {
            return;
        }
        const anim = model.anims[0];
        const height = this.ground(sim, at.x, at.y);
        actors.draw(model, anim, anim.getFrame(sim.tick, true), at.x, height, at.y, 0, UNLIT);
    }

    // A boss's pool: the real thing on the ground, spreading as it lands and
    // fading as it dries up, each one turned its own way
    private drawPool(actors: ActorRenderer, sim: Sim, pool: GroundPool): void {
        const model = this.assets.get("loc:" + pool.locId);
        // The clock runs on past its end when the run's over
        if (!model || sim.tick >= pool.endTick) {
            return;
        }
        const size = Math.min(1, (sim.tick - pool.startTick) / POOL_GROW_TICKS);
        const height = this.ground(sim, pool.x, pool.y);
        actors.draw(model, model.anims[0], 0, pool.x, height, pool.y, (pool.uid * 331) & 2047, {
            scale: pool.radius * POOL_SCALE * size,
            alpha: Math.min(1, (pool.endTick - sim.tick) / POOL_DRY_TICKS),
            unlit: 1,
        });
    }

    // A tether between two bosses (BossAttackDef.tether): its spot animation laid along the way
    // from one to the other, as an impact's trail is, faint until it's armed
    private drawTether(
        actors: ActorRenderer,
        sim: Sim,
        tether: Sim["tethers"][number],
        alpha: number,
    ): void {
        const spotAnim = tether.attack.spotAnim;
        const model = spotAnim !== undefined ? this.assets.get("spot:" + spotAnim) : undefined;
        const ends = sim.tetherEnds(tether);
        if (!model || !ends || sim.tick >= tether.endTick) {
            return;
        }
        const ax = lerp(ends.boss.prevX, ends.boss.x, alpha);
        const ay = lerp(ends.boss.prevY, ends.boss.y, alpha);
        const bx = lerp(ends.partner.prevX, ends.partner.x, alpha);
        const by = lerp(ends.partner.prevY, ends.partner.y, alpha);
        const length = Math.hypot(bx - ax, by - ay);
        if (length < 0.01) {
            return;
        }
        const dirX = (bx - ax) / length;
        const dirY = (by - ay) / length;
        const yaw = yawFromVector(dirX, dirY);
        const anim = model.anims[0];
        const frame = anim ? anim.getFrame(sim.tick, true) : 0;
        const armed = sim.tick >= tether.armTick;
        for (let at = TETHER_GAP / 2; at < length; at += TETHER_GAP) {
            const x = ax + dirX * at;
            const y = ay + dirY * at;
            actors.draw(model, anim, frame, x, this.ground(sim, x, y) - PROJECTILE_HEIGHT, y, yaw, {
                alpha: armed ? 1 : 0.35,
                unlit: 1,
            });
        }
    }

    // A wave along the ground, or what's thrown drawn as an NPC (a knight's spinning
    // sword, BossAttackDef.lookId), never smaller than what it hits
    private drawSweeping(
        actors: ActorRenderer,
        sim: Sim,
        projectile: EnemyProjectile,
        alpha: number,
        tick: number,
    ): void {
        const attack = projectile.attack;
        const look = attack.lookId !== undefined ? getEnemy(attack.lookId) : undefined;
        const model = look
            ? this.assets.get(getEnemyModelKey(look, 0))
            : this.assets.get("spot:" + attack.spotAnim);
        if (!model) {
            return;
        }
        const anim = look ? model.getAnim(look.idleSeq) : model.anims[0];
        const x = lerp(projectile.prevX, projectile.x, alpha);
        const y = lerp(projectile.prevY, projectile.y, alpha);
        const scale = Math.max(
            look?.scale ?? 1,
            (projectile.radius * 128) / Math.max(1, model.radius),
        );
        actors.draw(
            model,
            anim,
            anim.getFrame(tick - projectile.startTick),
            x,
            this.ground(sim, x, y) - (attack.wave ? 0 : PROJECTILE_HEIGHT),
            y,
            (projectile.yaw + (attack.spotYaw ?? 0)) & 2047,
            { scale, unlit: 1 },
        );
    }

    // A boss's glyph, idling as it slides, facing the boss
    private drawGlyph(actors: ActorRenderer, sim: Sim, glyph: Glyph, alpha: number): void {
        const model = this.assets.get(getEnemyModelKey(glyph.look, 0));
        if (!model) {
            return;
        }
        const anim = model.getAnim(glyph.look.idleSeq);
        const x = lerp(glyph.prevX, glyph.x, alpha);
        const y = lerp(glyph.prevY, glyph.y, alpha);
        actors.draw(
            model,
            anim,
            anim.getFrame(sim.tick),
            x,
            this.ground(sim, x, y),
            y,
            yawFromVector(-glyph.dirX, -glyph.dirY),
            { scale: glyph.look.scale ?? 1, silhouette: true, unlit: 1 },
        );
    }

    private drawThrall(actors: ActorRenderer, sim: Sim, thrall: Thrall, alpha: number): void {
        const def = thrall.def;
        const model = this.assets.get("thrall:" + def.id);
        if (!model) {
            return;
        }
        const tick = sim.tick;
        let anim = model.getAnim(def.attackSeq);
        let frame: number;
        if (thrall.attackStart !== -1 && tick - thrall.attackStart < anim.totalTicks) {
            frame = anim.getFrame(tick - thrall.attackStart, false);
        } else {
            anim = model.getAnim(thrall.moving ? def.walkSeq : def.idleSeq);
            frame = anim.getFrame(tick + thrall.uid * 7);
        }
        const x = lerp(thrall.prevX, thrall.x, alpha);
        const y = lerp(thrall.prevY, thrall.y, alpha);
        const fade = Math.min(1, (thrall.endTick - tick) / THRALL_FADE_TICKS);
        actors.draw(model, anim, frame, x, this.ground(sim, x, y), y, thrall.yaw, {
            scale: THRALL_SCALE,
            alpha: Math.max(0, fade),
        });
    }

    // At the cache's size, smaller than the player as in OSRS
    private drawPet(actors: ActorRenderer, sim: Sim, pet: PetFollower, alpha: number): void {
        const def = pet.def;
        const model = this.assets.getPet(def.id);
        if (!model) {
            return;
        }
        const anim = model.getAnim(pet.moving ? def.walkSeq : def.idleSeq);
        const x = lerp(pet.prevX, pet.x, alpha);
        const y = lerp(pet.prevY, pet.y, alpha);
        actors.draw(
            model,
            anim,
            anim.getFrame(sim.tick + pet.hero * 5),
            x,
            this.ground(sim, x, y),
            y,
            pet.yaw,
        );
    }

    // The Tombs of Amascut's Helpful Spirit, in the Nexus: a visitor that never goes, standing in
    // a glowing circle while it has a bundle for this player
    private drawTombsSpirit(actors: ActorRenderer, sim: Sim): void {
        const at = sim.map.tombs?.spirit;
        if (!at || sim.tombsPath !== undefined || sim.tombsWardens) {
            return;
        }
        if (this.tombsSpirit?.x !== at.x || this.tombsSpirit.y !== at.y) {
            this.tombsSpirit = {
                uid: -1,
                def: TOMBS_SPIRIT,
                x: at.x,
                y: at.y,
                startTick: 0,
                endTick: Infinity,
                nextShoutTick: 0,
            };
        }
        // Facing the way in, to the south, as OSRS's does, not following anyone round
        this.drawVisitor(actors, sim, this.tombsSpirit, yawFromVector(0, -1));
        if (sim.tombsSpiritBundles(sim.focus ?? 0) > 0) {
            this.drawGlowCircle(actors, sim, at.x, at.y, 2);
        }
    }

    // The glowing circle (HET.circleSpotAnim, Verzik's) on the ground at a spot: Het's circles to
    // stand in, the glow under a loose mirror, the Helpful Spirit with something for you
    private drawGlowCircle(
        actors: ActorRenderer,
        sim: Sim,
        x: number,
        y: number,
        scale: number,
        lift = 0,
    ): void {
        const glow = this.assets.get("spot:" + HET.circleSpotAnim);
        if (glow) {
            const anim = glow.anims[0];
            const ground = this.ground(sim, x, y) + lift;
            actors.draw(glow, anim, anim.getFrame(sim.tick, true), x, ground, y, 0, { scale });
        }
    }

    // Facing the player (or the way it's told), and blinking when they're about to go
    private drawVisitor(actors: ActorRenderer, sim: Sim, visitor: Visitor, facing?: number): void {
        const { def, x, y } = visitor;
        const model = this.assets.get("visitor:" + def.id);
        const left = (visitor.endTick - sim.tick) / TICKS_PER_SECOND;
        if (
            !model ||
            def.idleSeq === undefined ||
            (left < VISITOR_BLINK && Math.floor(sim.tick / 6) % 2 === 0)
        ) {
            return;
        }
        const anim = model.getAnim(def.idleSeq);
        const player = sim.player;
        actors.draw(
            model,
            anim,
            anim.getFrame(sim.tick),
            x,
            this.ground(sim, x, y),
            y,
            facing ?? yawFromVector(player.x - x, player.y - y),
            { scale: VISITOR_SCALE, silhouette: true },
        );
    }

    private drawPlayer(actors: ActorRenderer, sim: Sim, hero: number, alpha: number): void {
        const pose = getPlayerPose(sim, hero, alpha, this.localPlayerPose);
        // A power-up's look replaces the player's usual model and everything it does
        const powerUp = sim.as(hero, () => sim.wornPowerUp);
        const look = powerUp?.look;
        const lookModel = powerUp && this.assets.getPlayerLook(powerUp.id, hero);
        const model = lookModel ?? this.assets.getPlayer(hero);
        if (!model) {
            return;
        }
        const player = sim.heroes[hero].player;
        const tick = sim.tick;
        let anim: ActorAnim;
        let frame: number;
        const attack = player.attackSeq !== -1 ? model.getAnim(player.attackSeq) : undefined;
        const attackTicks = tick - player.attackStart;
        const stance = this.assets.getPlayerStance(hero);
        const run = model.getAnim(stance.run);
        // On the move, the held weapon's aim for a moment after each shot
        const runPose = pose.moving ? model.runPoses.get(player.attackSeq) : undefined;
        const runPoseFrame = runPose
            ? getRunPoseFrame(runPose, run, attackTicks, pose.moveTicks)
            : -1;
        const reviving = sim.heroes.find((downed) => downed.revive?.hero === hero)?.revive?.ticks;
        if (look && lookModel) {
            anim = model.getAnim(pose.moving ? look.moveSeq : look.idleSeq);
            frame = anim.getFrame(pose.moveTicks);
        } else if (player.deathTick !== -1) {
            // The death animation holds its last frame (lying down)
            anim = model.getAnim(PLAYER_SEQS.death);
            frame = anim.getFrame(Math.min(tick - player.deathTick, MAX_DEATH_ANIM_TICKS), false);
        } else if (reviving !== undefined && !pose.moving) {
            // Co-op: the Prayer cape's emote over a downed teammate, for as
            // long as they stand there
            anim = model.getAnim(REVIVE_SEQ);
            frame = anim.getFrame(reviving);
        } else if (runPose && runPoseFrame !== -1) {
            anim = runPose;
            frame = runPoseFrame;
        } else if (
            attack &&
            attack.seqId === player.attackSeq &&
            !pose.moving &&
            attackTicks < attack.totalTicks
        ) {
            anim = attack;
            frame = anim.getFrame(attackTicks, false);
        } else {
            anim = pose.moving ? run : model.getAnim(stance.idle);
            frame = anim.getFrame(pose.moveTicks);
        }
        const { x, y } = pose;
        let tint = NO_TINT;
        let flash = 0;
        if (player.flash > 0) {
            tint = PLAYER_HIT_TINT;
        }
        if (player.frozen > 0) {
            tint = FROZEN_TINT;
        }
        if (player.invulnerable > 30 && Math.floor(tick / 5) % 2 === 0) {
            flash = 0.5;
        }
        // Marked by Akkha's Detonate: white, as OSRS's, brighter as it comes
        const detonate = sim.tombsAkkha?.detonate;
        if (detonate && sim.isUp(sim.heroes[hero])) {
            flash = Math.max(flash, 0.35 + 0.25 * Math.sin(tick * 0.4));
        }
        actors.draw(model, anim, frame, x, this.ground(sim, x, y), y, pose.yaw, {
            silhouette: true,
            tint,
            flash,
        });
        if (sim.lighting) {
            this.drawLantern(actors, sim, hero, x, y, pose.yaw);
        }
    }

    // A lantern, while its power-up lasts (on a map with lighting): carried at the player's left hand, swinging
    // a little as they go. Drawn beside them rather than baked into their look, which would bake
    // every player again on every map for it.
    private drawLantern(
        actors: ActorRenderer,
        sim: Sim,
        hero: number,
        x: number,
        y: number,
        yaw: number,
    ): void {
        if (!sim.powerUps.some((p) => p.hero === hero && p.id === LANTERN_ID)) {
            return;
        }
        const model = this.assets.get("obj:" + getPowerUp(LANTERN_ID).objId);
        if (!model) {
            return;
        }
        const angle = (yaw / 2048) * Math.PI * 2;
        // Facing (0 is south, 512 west), and the left hand's side of that
        const faceX = -Math.sin(angle);
        const faceY = -Math.cos(angle);
        const swing = Math.sin(sim.tick * 0.25) * 0.04;
        const lx = x + faceY * -LANTERN_SIDE + faceX * (LANTERN_AHEAD + swing);
        const ly = y + faceX * LANTERN_SIDE + faceY * (LANTERN_AHEAD + swing);
        actors.draw(
            model,
            model.anims[0],
            0,
            lx,
            this.ground(sim, x, y) - LANTERN_HEIGHT,
            ly,
            yaw,
            LANTERN_OPTIONS,
        );
    }

    private drawEnemy(actors: ActorRenderer, sim: Sim, enemy: Enemy, alpha: number): void {
        const def = enemy.def;
        const tick = sim.tick;
        // Drawn as its shielded version while it's shielded, if it has one
        const shielded = !enemy.dead && enemy.shieldEnd > tick ? def.shield?.look : undefined;
        const model = this.assets.get(
            shielded ? getShieldedModelKey(def) : getCachedEnemyModelKey(def, enemy.variant),
        );
        if (!model) {
            this.assets.requestEnemy(def);
            return;
        }
        const x = lerp(enemy.prevX, enemy.x, alpha);
        const y = lerp(enemy.prevY, enemy.y, alpha);
        let anim: ActorAnim;
        let frame: number;
        let sink = 0;
        if (enemy.dead) {
            const t = tick - enemy.deathTick;
            if (def.deathSeq !== -1) {
                anim = model.getAnim(def.deathSeq);
                // A final boss whose fall the run waits for plays all of its
                // death (BossDef.fallSeconds); the rest are cut short
                const fall = def.boss?.fallSeconds;
                const length = Math.min(
                    anim.totalTicks,
                    fall ? Math.round(fall * TICKS_PER_SECOND) : MAX_DEATH_ANIM_TICKS,
                );
                frame = anim.getFrame(Math.min(t, length - 1), false);
                if (t > length) {
                    sink = (t - length) / DEATH_SINK_TICKS;
                }
            } else {
                anim = model.getAnim(def.idleSeq);
                frame = 0;
                sink = t / DEATH_SINK_TICKS;
            }
        } else if (shielded) {
            anim = model.getAnim(shielded.idleSeq);
            frame = anim.getFrame(tick + enemy.uid * 7);
        } else if (enemy.anim === "jump" && def.jumpSeq !== undefined) {
            anim = model.getAnim(def.jumpSeq);
            frame = anim.getFrame(tick - enemy.animStart, false);
        } else if (enemy.anim === "attack" && enemy.attackSeq !== -1) {
            anim = model.getAnim(enemy.attackSeq);
            frame = anim.getFrame(tick - enemy.animStart, false);
        } else {
            const moving =
                Math.abs(enemy.x - enemy.prevX) + Math.abs(enemy.y - enemy.prevY) > 0.002;
            anim = model.getAnim(moving && enemy.frozen === 0 ? def.walkSeq : def.idleSeq);
            // Offset by uid so a crowd doesn't move in lockstep
            frame = anim.getFrame(tick + enemy.uid * 7);
        }
        let height =
            this.groundUnder(sim, x, y, (model.radius * enemy.scale) / 128) +
            (sink * model.height * enemy.scale) / 128;
        // Thrown out by a boss: up and over in an arc (negative is up)
        const flung = enemy.flung;
        if (flung) {
            const f = Math.min(
                1,
                Math.max(0, (tick + alpha - flung.startTick) / (flung.endTick - flung.startTick)),
            );
            height -= FLUNG_ARC_HEIGHT * 4 * f * (1 - f);
        }
        let tint = enemy.tint;
        if (enemy.frozen > 0 && !enemy.dead) {
            tint = FROZEN_TINT;
        } else if (
            enemy.shieldEnd > tick &&
            !enemy.leaving &&
            !enemy.totemOf &&
            enemy.risingEnd === 0
        ) {
            tint = SHIELDED_TINT;
        }
        // Fading out as it reaches the edge
        const leaving = enemy.leaving;
        const fade = leaving ? Math.min(1, (leaving.endTick - tick) / LEAVING_FADE_TICKS) : 1;
        // The boss is hit all the time; a full flash would leave him white
        let flash = enemy.flash > 0 ? (enemy.boss ? 0.2 : 0.55) : 0;
        if (enemy.boss && !enemy.dead && sim.isExposed(enemy)) {
            tint = EXPOSED_TINT;
            flash = Math.max(
                flash,
                EXPOSED_FLASH *
                    (0.5 + 0.5 * Math.sin((tick + alpha) / (TICKS_PER_SECOND / EXPOSED_PULSE))),
            );
        }
        const options = enemyDrawOptions;
        options.scale = enemy.scale;
        options.tint = tint;
        options.flash = flash;
        options.silhouette = enemy.boss;
        options.alpha = Math.max(0, fade);
        actors.draw(model, anim, frame, x, height, y, enemy.yaw, options);
    }

    drawOverlay(overlay: Overlay, sim: Sim, alpha: number): void {
        const ctx = overlay.ctx;
        const now = performance.now();
        const scale = overlay.uiScale;

        this.enemiesByUid.clear();
        for (const enemy of sim.enemies) {
            this.enemiesByUid.set(enemy.uid, enemy);
        }

        this.drawLootBeams(overlay, sim, alpha, now, scale);
        this.drawBossWindups(overlay, sim, alpha);
        this.drawCrondisSpearTells(overlay, sim);
        this.fight.drawGround(overlay, sim, alpha, now, scale);
        this.drawAuras(overlay, sim, alpha, now);
        this.drawBlasts(overlay, sim, now, scale);
        this.drawRockTargets(overlay, sim, now, scale);
        this.drawRingReach(overlay, sim, now, scale);
        this.drawSwings(overlay, sim, now, scale);
        this.drawSlashes(overlay, sim, alpha, now, scale);
        this.drawEnemyProjectileGlows(overlay, sim, alpha, scale);
        this.drawPickupTimers(overlay, sim, alpha, scale);
        this.drawScabarasHelper(overlay, sim, now, scale);
        if (sim.litTargetsOnly) {
            this.drawDarkArrows(overlay, sim, alpha, scale);
        }

        // Health bars over hurt elites, and over whatever asks for one from the
        // start (Phosani's eggs, against their time); with hundreds of enemies
        // bars on all of them are just noise (hitsplats show the damage), and
        // the boss has his bar at the top of the screen
        for (const enemy of sim.enemies) {
            if (enemy.dead || enemy.flung) {
                continue;
            }
            if (!enemy.def.healthBar && (enemy.hp >= enemy.maxHp || !enemy.elite)) {
                continue;
            }
            const model = this.assets.get(getCachedEnemyModelKey(enemy.def, enemy.variant));
            const x = lerp(enemy.prevX, enemy.x, alpha);
            const y = lerp(enemy.prevY, enemy.y, alpha);
            const top =
                this.ground(sim, x, y) -
                ((model?.height ?? 128) * enemy.scale) / 128 -
                HEALTH_BAR_GAP;
            const p = overlay.project(x, top, y, this.screen);
            if (p.visible) {
                drawHealthBar(ctx, p.x, p.y, scale, enemy.hp / enemy.maxHp);
            }
        }

        // The players' bars over their heads, gone when they die like in the
        // game; co-op's others have their names over them too
        for (const hero of sim.heroes) {
            this.drawHeroBar(overlay, sim, hero, alpha, scale);
        }

        this.drawHitsplats(overlay, sim, alpha, now, scale);
        if (sim.heroes.length > 1) {
            this.drawTeammateArrows(overlay, sim, alpha, now, scale);
        }
        this.drawShouts(overlay, sim, alpha, now, scale);
        // Where the hero the camera's on is drawn, for the Apmeken room's floor arrow from them
        const viewPose = sim.tombsIssue
            ? getPlayerPose(sim, this.viewHero, alpha, this.localPlayerPose)
            : undefined;
        this.fight.drawScreen(overlay, sim, alpha, now, scale, viewPose);
        this.drawFlash(overlay, now);
        if (this.cinematic) {
            this.cinematicView.drawScreen(overlay, this.cinematic, (x, y) =>
                this.ground(sim, x, y),
            );
        }
    }

    // A RuneLite-style pie over each power-up on the ground, draining clockwise as
    // its time runs out. Attracted ones no longer expire (ordinary loot never
    // does), and once the run's over nothing on the ground does.
    private drawPickupTimers(overlay: Overlay, sim: Sim, alpha: number, scale: number): void {
        if (!this.pickupTimers || sim.runOver) {
            return;
        }
        const ctx = overlay.ctx;
        const radius = TIMER_RADIUS * scale;
        const lifetime = POWER_UP_LIFETIME * TICKS_PER_SECOND;
        const tick = sim.tick - 1 + alpha;
        for (const pickup of sim.pickups) {
            if (pickup.kind !== "powerUp" || pickup.attracted) {
                continue;
            }
            const remaining = Math.min(1, Math.max(0, 1 - (tick - pickup.spawnTick) / lifetime));
            // (one whose model isn't drawn yet has nothing to time)
            const model = this.assets.get(getPickupModelKey(pickup));
            if (remaining === 0 || !model) {
                continue;
            }
            const modelScale = getPowerUpScale(model);
            const x = lerp(pickup.prevX, pickup.x, alpha);
            const y = lerp(pickup.prevY, pickup.y, alpha);
            const top =
                this.ground(sim, x, y) -
                getPowerUpBob(pickup, sim.tick) -
                (model.height * modelScale) / 128;
            const p = overlay.project(x, top, y, this.screen);
            if (!p.visible) {
                continue;
            }
            // From the play camera, high over the ground, a flat item reaches further
            // up the screen than its height does: the pie goes over the furthest it
            // reaches as it turns
            const edge = overlay.project(
                x + (model.radius * modelScale) / 128,
                top,
                y,
                this.screen2,
            );
            const reach = edge.behind ? 0 : Math.hypot(edge.x - p.x, edge.y - p.y);
            const cx = Math.round(p.x);
            const cy = Math.round(p.y - reach - radius - TIMER_GAP * scale);
            const color = remaining <= 0.25 ? "#ff0000" : remaining <= 0.5 ? "#ffc800" : "#00ff00";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = scale;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, -Math.PI / 2 + (1 - remaining) * Math.PI * 2, Math.PI * 1.5);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    // A power-up's flash: the whole screen, fading out
    private drawFlash(overlay: Overlay, now: number): void {
        const flash = this.flash;
        if (!flash) {
            return;
        }
        const t = (now - flash.start) / FLASH_MS;
        if (t >= 1) {
            this.flash = undefined;
            return;
        }
        overlay.ctx.fillStyle = withAlpha(flash.color, 0.75 * flash.strength * (1 - t) * (1 - t));
        overlay.ctx.fillRect(0, 0, overlay.width, overlay.height);
    }

    // Overhead chat: yellow text over the speaker's head, like the client's
    private drawShouts(
        overlay: Overlay,
        sim: Sim,
        alpha: number,
        now: number,
        scale: number,
    ): void {
        const ctx = overlay.ctx;
        keepWhile(this.shouts, now, SHOUT_MS);
        const pixel = Math.max(1, Math.round(scale));
        ctx.font = `${16 * pixel}px "OSRS Bold", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        for (const shout of this.shouts) {
            let x: number;
            let y: number;
            let height: number;
            if (shout.enemyUid === VISITOR_SHOUT) {
                const visitor = sim.visitor;
                if (!visitor) {
                    continue;
                }
                x = visitor.x;
                y = visitor.y;
                const model = this.assets.get("visitor:" + visitor.def.id);
                height = (model?.height ?? 200) * VISITOR_SCALE;
            } else if (shout.enemyUid <= 0) {
                const hero = -shout.enemyUid;
                const player = sim.heroes[hero]?.player;
                if (!player) {
                    continue;
                }
                ({ x, y } = getPlayerPose(sim, hero, alpha, this.localPlayerPose));
                height = this.assets.getPlayer(hero)?.height ?? 200;
            } else {
                const enemy = this.enemiesByUid.get(shout.enemyUid);
                if (!enemy || enemy.dead) {
                    continue;
                }
                const model = this.assets.get(getCachedEnemyModelKey(enemy.def, enemy.variant));
                x = lerp(enemy.prevX, enemy.x, alpha);
                y = lerp(enemy.prevY, enemy.y, alpha);
                height = (model?.height ?? 200) * enemy.scale;
            }
            const top = this.ground(sim, x, y) - height / 128;
            const p = overlay.project(x, top, y, this.screen);
            if (!p.visible) {
                continue;
            }
            ctx.fillStyle = "#000000";
            ctx.fillText(tl(shout.text), p.x + pixel, p.y - 4 * pixel + pixel);
            ctx.fillStyle = "#ffff00";
            ctx.fillText(tl(shout.text), p.x, p.y - 4 * pixel);
        }
    }

    private drawHitsplats(
        overlay: Overlay,
        sim: Sim,
        alpha: number,
        now: number,
        scale: number,
    ): void {
        const ctx = overlay.ctx;
        keepWhile(this.hitsplats, now, HITSPLAT_MS);
        // The font at a whole number of screen pixels per font pixel, so the
        // numbers stay crisp; the client's splats scale along with it
        const pixel = Math.max(1, Math.round(scale));
        const font = `${16 * pixel}px "OSRS Small", sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = font;
        // The splat is scaled down a little, so smooth it
        ctx.imageSmoothingQuality = "high";
        // Drawn once each and copied, unless the font's still loading (its
        // size would be the stand-in's)
        const cache = document.fonts?.check(font) ?? true;
        for (const hitsplat of this.hitsplats) {
            const t = (now - hitsplat.start) / HITSPLAT_MS;
            if (t < 0) {
                continue;
            }
            const enemy = this.enemiesByUid.get(hitsplat.enemyUid);
            const player = sim.heroes[hitsplat.hero]?.player;
            if (player) {
                const pose = getPlayerPose(sim, hitsplat.hero, alpha, this.localPlayerPose);
                hitsplat.x = pose.x;
                hitsplat.y = pose.y;
            } else if (enemy) {
                hitsplat.x = enemy.x;
                hitsplat.y = enemy.y;
            }
            const height = this.ground(sim, hitsplat.x, hitsplat.y) - hitsplat.height - t * 0.4;
            const p = overlay.project(hitsplat.x, height, hitsplat.y, this.screen);
            if (!p.visible) {
                continue;
            }
            ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
            const sprite = this.assets.getSprite(HITSPLAT_SPRITES[hitsplat.kind]);
            if (sprite && cache) {
                const image = this.hitsplatImages.get(sprite, font, pixel, hitsplat);
                ctx.drawImage(
                    image.canvas,
                    Math.round(p.x - image.inkWidth / 2) + image.left,
                    Math.round(p.y - image.inkHeight / 2) + image.top,
                );
            } else {
                drawHitsplat(ctx, sprite, p.x, p.y, pixel, hitsplat.amount, hitsplat.kind);
            }
        }
        ctx.globalAlpha = 1;
    }

    // A boss winding up: a red circle filling in over the ground a swing or
    // blast will hit, or a ring closing in at its feet before anything else
    private drawBossWindups(overlay: Overlay, sim: Sim, alpha: number): void {
        const ctx = overlay.ctx;
        // Shadows on the floor where something's coming down (GroundPatternDef.shadow)
        for (const hazard of sim.hazards) {
            if (!hazard.attack.ground?.shadow || sim.tick >= hazard.landTick) {
                continue;
            }
            const t = Math.min(
                1,
                Math.max(
                    0,
                    (sim.tick + alpha - hazard.startTick) /
                        Math.max(1, hazard.landTick - hazard.startTick),
                ),
            );
            this.drawShadow(overlay, sim, hazard.x, hazard.y, hazard.radius, t);
        }
        for (const enemy of sim.enemies) {
            // Its stomp coming, on whoever's right up against it (BossDef.stomp): a ring filling
            // at its feet, as a swing's does
            const stomp = enemy.def.boss?.stomp;
            const state = enemy.bossState;
            if (
                stomp &&
                !enemy.dead &&
                state?.nextStomp !== undefined &&
                state.stompFrom !== undefined
            ) {
                const s = Math.min(
                    1,
                    Math.max(
                        0,
                        (sim.tick + alpha - state.stompFrom) /
                            Math.max(1, state.nextStomp - state.stompFrom),
                    ),
                );
                const x = lerp(enemy.prevX, enemy.x, alpha);
                const y = lerp(enemy.prevY, enemy.y, alpha);
                this.traceGroundCircle(overlay, sim, x, y, stomp.radius);
                ctx.fillStyle = `rgba(200, 20, 20, ${0.1 + 0.12 * s})`;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(255, 60, 40, ${0.5 + 0.4 * s})`;
                ctx.stroke();
                this.traceGroundCircle(overlay, sim, x, y, stomp.radius * s);
                ctx.fillStyle = `rgba(255, 40, 20, ${0.25 * s})`;
                ctx.fill();
            }
            // A boss's, or what's copying its lunge (EnemyDef.echoes), drawn the same
            const windup = enemy.bossState?.windup ?? enemy.echo;
            if (!windup || enemy.dead) {
                continue;
            }
            const t = Math.min(
                1,
                Math.max(
                    0,
                    (sim.tick + alpha - windup.startTick) /
                        Math.max(1, windup.landTick - windup.startTick),
                ),
            );
            const kind = windup.attack.kind;
            // Those that mark the ground themselves (BossFightView)
            if (
                kind === "ground" ||
                kind === "quarters" ||
                kind === "surge" ||
                kind === "pattern" ||
                windup.attack.cone !== undefined ||
                // It hits everywhere it can see: the shadows are what's shown
                windup.attack.cover ||
                // Thrown by the arena's statues, not the boss: their lines are shown
                windup.attack.from !== undefined
            ) {
                continue;
            }
            // Ba-Ba's avalanche: where it doesn't land, beside her boulders' rocks
            const cover = windup.attack.takeCover;
            if (cover) {
                for (const rock of sim.tombsCover) {
                    this.traceGroundCircle(overlay, sim, rock.x, rock.y, rock.radius + cover.reach);
                    ctx.fillStyle = `rgba(40, 200, 60, ${0.12 + 0.15 * t})`;
                    ctx.fill();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = `rgba(80, 255, 100, ${0.5 + 0.4 * t})`;
                    ctx.stroke();
                }
                continue;
            }
            // Coming down under its shadow, not a red circle (BossAttackDef.shadow)
            if (kind === "blast" && windup.attack.shadow) {
                for (const { x, y } of windup.targets) {
                    this.drawShadow(overlay, sim, x, y, windup.attack.radius ?? 2, t);
                }
                continue;
            }
            if (windup.attack.blockable && this.drawShelter(overlay, sim, enemy, t)) {
                // Where to hide instead of where it hits (it hits everywhere else)
                continue;
            }
            const outside = kind === "swing" ? windup.attack.outside : undefined;
            if (outside !== undefined) {
                // Everywhere but at its feet (BossAttackDef.outside): the shelter in green, and
                // the storm's edge in red closing in on it as it comes
                const x = lerp(enemy.prevX, enemy.x, alpha);
                const y = lerp(enemy.prevY, enemy.y, alpha);
                this.traceGroundCircle(overlay, sim, x, y, outside);
                ctx.fillStyle = `rgba(80, 255, 100, ${0.12 + 0.18 * t})`;
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = `rgba(80, 255, 100, ${0.6 + 0.4 * t})`;
                ctx.stroke();
                this.traceGroundCircle(overlay, sim, x, y, outside + STORM_EDGE * (1 - t));
                ctx.lineWidth = 4;
                ctx.strokeStyle = `rgba(255, 60, 40, ${0.5 + 0.5 * t})`;
                ctx.stroke();
                continue;
            }
            const line = kind === "swing" ? windup.attack.line : undefined;
            const square = kind === "blast" ? windup.attack.square : undefined;
            if (line || square) {
                // A lunge's strip, filling from the boss out; a blast's squares, from the middle
                const shapes = line
                    ? [stripCorners(enemy.x, enemy.y, windup.dirX, windup.dirY, line, 1)]
                    : windup.targets.map((spot) => squareCorners(spot.x, spot.y, square! / 2));
                const filled = line
                    ? [stripCorners(enemy.x, enemy.y, windup.dirX, windup.dirY, line, t)]
                    : windup.targets.map((spot) =>
                          squareCorners(spot.x, spot.y, (square! / 2) * t),
                      );
                for (let i = 0; i < shapes.length; i++) {
                    this.fight.traceGround(overlay, sim, shapes[i]);
                    ctx.fillStyle = `rgba(200, 20, 20, ${0.1 + 0.12 * t})`;
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = `rgba(255, 60, 40, ${0.5 + 0.4 * t})`;
                    ctx.stroke();
                    this.fight.traceGround(overlay, sim, filled[i]);
                    ctx.fillStyle = `rgba(255, 40, 20, ${0.25 * t})`;
                    ctx.fill();
                }
            } else if (kind === "swing" || kind === "blast") {
                // Around the boss, or on the spots a blast lands on
                const spots =
                    kind === "blast"
                        ? windup.targets
                        : [
                              {
                                  x: lerp(enemy.prevX, enemy.x, alpha),
                                  y: lerp(enemy.prevY, enemy.y, alpha),
                              },
                          ];
                const radius = windup.attack.radius ?? 2;
                for (const { x, y } of spots) {
                    this.traceGroundCircle(overlay, sim, x, y, radius);
                    ctx.fillStyle = `rgba(200, 20, 20, ${0.1 + 0.12 * t})`;
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = `rgba(255, 60, 40, ${0.5 + 0.4 * t})`;
                    ctx.stroke();
                    this.traceGroundCircle(overlay, sim, x, y, radius * t);
                    ctx.fillStyle = `rgba(255, 40, 20, ${0.25 * t})`;
                    ctx.fill();
                }
            } else {
                const x = lerp(enemy.prevX, enemy.x, alpha);
                const y = lerp(enemy.prevY, enemy.y, alpha);
                this.traceGroundCircle(overlay, sim, x, y, 1.6 - t);
                ctx.lineWidth = 3;
                ctx.strokeStyle = `rgba(255, 200, 80, ${0.3 + 0.6 * t})`;
                ctx.stroke();
            }
        }
    }

    // A shadow on the floor under something coming down: growing and darkening as it nears
    private drawShadow(
        overlay: Overlay,
        sim: Sim,
        x: number,
        y: number,
        radius: number,
        t: number,
    ): void {
        const ctx = overlay.ctx;
        this.traceGroundCircle(overlay, sim, x, y, radius * (0.55 + 0.45 * t));
        ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + 0.45 * t})`;
        ctx.fill();
        // A pale rim where it'll reach, from the start: black alone is lost on a dark floor
        this.traceGroundCircle(overlay, sim, x, y, radius);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 228, 170, ${0.45 + 0.45 * t})`;
        ctx.stroke();
    }

    // The ground the boss's glyph shelters from a blockable attack: from the
    // glyph's edges away from the boss, green, while a red ring closes in on
    // the boss. False if it has no glyph.
    private drawShelter(overlay: Overlay, sim: Sim, enemy: Enemy, t: number): boolean {
        const glyph = sim.glyphs.find((g) => g.bossUid === enemy.uid);
        const width = enemy.def.boss?.glyph?.width;
        if (!glyph || width === undefined) {
            return false;
        }
        const ctx = overlay.ctx;
        // Where the glyph's edges are, and where the rays from the boss past
        // them end
        const edge = (side: number) => {
            const ex = glyph.x + glyph.acrossX * width * side;
            const ey = glyph.y + glyph.acrossY * width * side;
            const dx = ex - enemy.x;
            const dy = ey - enemy.y;
            const length = Math.max(0.001, Math.hypot(dx, dy));
            const far = SHELTER_LENGTH / length;
            return { x: ex, y: ey, farX: enemy.x + dx * far, farY: enemy.y + dy * far };
        };
        const left = edge(-1);
        const right = edge(1);
        const steps = 12;
        ctx.beginPath();
        const point = (wx: number, wy: number, first: boolean) => {
            const p = overlay.project(wx, this.ground(sim, wx, wy) - 0.1, wy, this.screen2);
            if (first) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        };
        for (let i = 0; i <= steps; i++) {
            const f = i / steps;
            point(lerp(left.x, left.farX, f), lerp(left.y, left.farY, f), i === 0);
        }
        for (let i = steps; i >= 0; i--) {
            const f = i / steps;
            point(lerp(right.x, right.farX, f), lerp(right.y, right.farY, f), false);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(40, 220, 90, ${0.12 + 0.18 * t})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(120, 255, 150, ${0.5 + 0.4 * t})`;
        ctx.stroke();
        this.traceGroundCircle(overlay, sim, enemy.x, enemy.y, 1 + 3 * (1 - t));
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(255, 60, 40, ${0.4 + 0.6 * t})`;
        ctx.stroke();
        return true;
    }

    // A boss's swing landing
    private drawSwings(overlay: Overlay, sim: Sim, now: number, scale: number): void {
        const ctx = overlay.ctx;
        keepWhile(this.swings, now, SWING_MS);
        for (const swing of this.swings) {
            const t = (now - swing.start) / SWING_MS;
            this.traceGroundCircle(overlay, sim, swing.x, swing.y, swing.radius * (0.7 + 0.3 * t));
            ctx.fillStyle = `rgba(255, 40, 20, ${0.35 * (1 - t)})`;
            ctx.fill();
            ctx.lineWidth = 6 * scale * (1 - t) + 1;
            ctx.strokeStyle = `rgba(255, 230, 200, ${0.9 * (1 - t)})`;
            ctx.stroke();
        }
    }

    // A soft glow round every enemy projectile, so a thin one (an arrow, a
    // bolt) can be made out at the camera's height; one without a model to
    // draw (or whose model didn't load) is drawn as a bright glow instead
    private drawEnemyProjectileGlows(
        overlay: Overlay,
        sim: Sim,
        alpha: number,
        scale: number,
    ): void {
        const ctx = overlay.ctx;
        for (const projectile of sim.enemyProjectiles) {
            // Big enough to see as they are
            if (projectile.attack.wave || projectile.attack.lookId !== undefined) {
                continue;
            }
            const x = lerp(projectile.prevX, projectile.x, alpha);
            const y = lerp(projectile.prevY, projectile.y, alpha);
            const p = overlay.project(
                x,
                this.ground(sim, x, y) - PROJECTILE_HEIGHT,
                y,
                this.screen,
            );
            if (!p.visible) {
                continue;
            }
            const spotAnim = projectile.attack.spotAnim;
            const model = spotAnim !== undefined ? this.assets.get("spot:" + spotAnim) : undefined;
            const drawn = model !== undefined && hasGeometry(model);
            const radius = (drawn ? PROJECTILE_GLOW : 9) * scale;
            const glow = this.getGlowImage(drawn, radius);
            ctx.drawImage(glow, p.x - glow.width / 2, p.y - glow.height / 2);
        }
    }

    // A glow drawn once for each look and size, rather than a gradient for
    // every projectile every frame
    private getGlowImage(drawn: boolean, radius: number): HTMLCanvasElement {
        const key = `${drawn} ${radius}`;
        let canvas = this.glowImages.get(key);
        if (canvas) {
            return canvas;
        }
        if (this.glowImages.size >= 8) {
            // The screen was resized
            this.glowImages.clear();
        }
        canvas = document.createElement("canvas");
        const size = Math.ceil(radius) * 2 + 2;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const c = size / 2;
        const glow = ctx.createRadialGradient(c, c, 0, c, c, radius);
        if (drawn) {
            glow.addColorStop(0, "rgba(255, 170, 60, 0.5)");
            glow.addColorStop(0.5, "rgba(255, 120, 20, 0.28)");
            glow.addColorStop(1, "rgba(255, 90, 0, 0)");
        } else {
            glow.addColorStop(0, "rgba(255, 255, 220, 0.95)");
            glow.addColorStop(0.4, "rgba(255, 140, 40, 0.8)");
            glow.addColorStop(1, "rgba(255, 60, 0, 0)");
        }
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(c, c, radius, 0, Math.PI * 2);
        ctx.fill();
        this.glowImages.set(key, canvas);
        return canvas;
    }

    private drawSlashes(
        overlay: Overlay,
        sim: Sim,
        alpha: number,
        now: number,
        scale: number,
    ): void {
        const ctx = overlay.ctx;
        keepWhile(this.slashes, now, SLASH_MS);
        for (const slash of this.slashes) {
            const t = (now - slash.start) / SLASH_MS;
            // Follows the player, like the weapon does
            const { x: cx, y: cy } = getPlayerPose(sim, slash.hero, alpha, this.localPlayerPose);
            const base = Math.atan2(slash.dirY, slash.dirX);
            const sweep = slash.arc;
            // Enough points for a wide sweep to stay round
            const steps = Math.max(10, Math.ceil(sweep * 9));
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const a = base - sweep + ((2 * sweep * i) / steps) * Math.min(t * 2, 1);
                const r = slash.reach * 0.8;
                const wx = cx + Math.cos(a) * r;
                const wy = cy + Math.sin(a) * r;
                const p = overlay.project(wx, this.ground(sim, wx, wy) - 0.7, wy, this.screen);
                if (i === 0) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.lineCap = "round";
            ctx.lineWidth = 14 * scale * (1 - t * 0.6);
            ctx.strokeStyle = slash.color
                ? `rgba(${slash.color}, ${0.75 * (1 - t)})`
                : `rgba(255, 255, 255, ${0.6 * (1 - t)})`;
            ctx.stroke();
        }
    }

    // A rectangle on the ground, in world tiles, as the current canvas path
    private traceGroundRect(
        overlay: Overlay,
        sim: Sim,
        x0: number,
        y0: number,
        x1: number,
        y1: number,
    ): void {
        const ctx = overlay.ctx;
        ctx.beginPath();
        [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
        ].forEach(([wx, wy], i) => {
            const p = overlay.project(wx, this.ground(sim, wx, wy) - 0.05, wy, this.screen2);
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        });
        ctx.closePath();
    }

    // A tile's square on the ground, a little inside its edges, as the current canvas path
    private traceGroundTile(overlay: Overlay, sim: Sim, cx: number, cy: number): void {
        const half = 0.45;
        this.traceGroundRect(overlay, sim, cx - half, cy - half, cx + half, cy + half);
    }

    // Text on the ground at a tile's middle: white (or colour) with a dark edge, readable on any
    // floor
    private drawGroundText(
        overlay: Overlay,
        sim: Sim,
        x: number,
        y: number,
        text: string,
        color: string,
        size: number,
    ): void {
        const p = overlay.project(x, this.ground(sim, x, y) - 0.1, y, this.screen2);
        if (!p.visible) {
            return;
        }
        const ctx = overlay.ctx;
        ctx.font = `${Math.round(size)}px "OSRS Bold", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = Math.max(2, size / 5);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
        ctx.strokeText(text, p.x, p.y);
        ctx.fillStyle = color;
        ctx.fillText(text, p.x, p.y);
    }

    // The Scabaras room's puzzle helper, as OSRS's ToA plugin: Sequence's plates numbered in the
    // order they've lit (the next to step on brightest), the Lights out plates to step on, the
    // Addition symbols that make the tablet's number from what's been stepped on, and Matching's
    // tiles named and coloured by symbol. Only for a puzzle that's open and not yet solved.
    private drawScabarasHelper(overlay: Overlay, sim: Sim, now: number, scale: number): void {
        const scabaras = sim.tombsRoom?.scabaras;
        const def = sim.tombsPathRoom?.scabaras;
        if (!this.puzzleHelper || !scabaras || !def || sim.runOver) {
            return;
        }
        const ctx = overlay.ctx;
        const solved = (puzzle: string) => scabaras.solved.some((p) => p === puzzle);
        const pulse = 0.7 + 0.3 * Math.sin(now / 220);
        const mark = (x: number, y: number, alpha: number) => {
            this.traceGroundTile(overlay, sim, x, y);
            ctx.fillStyle = `rgba(80, 230, 255, ${0.3 * alpha})`;
            ctx.fill();
            // A dark edge under the bright one, so it reads on a lit plate as on the floor
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.55 * alpha})`;
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(150, 245, 255, ${alpha})`;
            ctx.stroke();
        };
        // Sequence: each plate's place in the order once it's lit
        const sequence = scabaras.sequence;
        if (!solved("sequence")) {
            const shown = sim.scabarasSequenceShown;
            for (let k = sequence.step; k < shown; k++) {
                const plate = def.sequence[sequence.order[k]];
                if (k === sequence.step) {
                    mark(plate.x, plate.y, pulse);
                }
                this.drawGroundText(
                    overlay,
                    sim,
                    plate.x,
                    plate.y,
                    `${k + 1}`,
                    k === sequence.step ? "#ffffff" : "#c8c8c8",
                    22 * scale,
                );
            }
        }
        // Lights out: the fewest to step on to light the ring
        if (!solved("lights")) {
            for (const i of solveScabarasLights(scabaras.lights)) {
                mark(def.lights[i].x, def.lights[i].y, pulse);
            }
        }
        // Addition: once the tablet's readable, the way on from what's been stepped on, or from
        // beside the plate the hero's on
        const addition = scabaras.addition;
        if (!solved("addition") && solved("sequence") && solved("lights")) {
            const on = scabaras.standing[this.viewHero];
            const way = solveScabarasAddition(
                def.addition,
                addition.values,
                addition.target,
                addition.stepped,
                on?.[0] === "a" ? Number(on.slice(1)) : undefined,
            );
            for (const i of way ?? []) {
                if (!addition.stepped[i]) {
                    mark(def.addition[i].x, def.addition[i].y, pulse);
                }
            }
        }
        // Matching: each tile not matched yet named in its symbol's own colour, so a pair stands
        // out across the room, as the plugin's tiles do
        const matching = scabaras.matching;
        if (!solved("matching") && scabaras.solved.length >= 3) {
            for (const side of ["north", "south"] as const) {
                def.matching[side].forEach((p, i) => {
                    const symbol = matching[side][i];
                    if (matching.matched[symbol]) {
                        return;
                    }
                    this.traceGroundTile(overlay, sim, p.x, p.y);
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = MATCHING_COLORS[symbol];
                    ctx.stroke();
                    this.drawGroundText(
                        overlay,
                        sim,
                        p.x,
                        p.y,
                        SCABARAS.symbolNames[symbol],
                        MATCHING_COLORS[symbol],
                        15 * scale,
                    );
                });
            }
        }
    }

    // The Crondis room's spears about to thrust: the tiles each will reach, on the floor through
    // its tell, filling in as it nears (the spear's own glint is small, and a step out of its
    // statue): what to time a way past by, in time to read it
    private drawCrondisSpearTells(overlay: Overlay, sim: Sim): void {
        const crondis = sim.tombsRoom?.crondis;
        const def = sim.tombsPathRoom?.crondis;
        if (!crondis || !def) {
            return;
        }
        const ctx = overlay.ctx;
        const tell = Math.round(CRONDIS.spearTell * TICKS_PER_SECOND);
        for (const thrust of crondis.thrusts) {
            const age = sim.tick - thrust.startTick;
            if (age >= tell) {
                continue;
            }
            const t = Math.min(1, Math.max(0, age / tell));
            const area = sim.crondisSpearArea(def, thrust);
            this.traceGroundRect(overlay, sim, area.x0, area.y0, area.x1, area.y1);
            // Yellow, not red: the room's floor is red already
            ctx.fillStyle = `rgba(255, 220, 90, ${0.2 + 0.35 * t})`;
            ctx.fill();
            // A dark edge under the bright one, to read on any of its floor
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.55 + 0.3 * t})`;
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(255, 235, 140, ${0.8 + 0.2 * t})`;
            ctx.stroke();
        }
    }

    // A circle on the ground, as the current canvas path
    private traceGroundCircle(
        overlay: Overlay,
        sim: Sim,
        cx: number,
        cy: number,
        radius: number,
    ): void {
        const ctx = overlay.ctx;
        const steps = 32;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * Math.PI * 2;
            const wx = cx + Math.cos(a) * radius;
            const wy = cy + Math.sin(a) * radius;
            const p = overlay.project(wx, this.ground(sim, wx, wy) - 0.1, wy, this.screen2);
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.closePath();
    }

    private drawAuras(overlay: Overlay, sim: Sim, alpha: number, now: number): void {
        const ctx = overlay.ctx;
        keepWhile(this.auras, now, AURA_MS);
        for (const aura of this.auras) {
            const t = (now - aura.start) / AURA_MS;
            const radius = aura.radius * (0.5 + t * 0.5);
            const pose = getPlayerPose(sim, aura.hero, alpha, this.localPlayerPose);
            this.traceGroundCircle(overlay, sim, pose.x, pose.y, radius);
            ctx.fillStyle = `rgba(150, 210, 255, ${0.18 * (1 - t)})`;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(200, 235, 255, ${0.8 * (1 - t)})`;
            ctx.stroke();
        }
    }

    // Chinchompa explosions: a fiery ring racing out over the ground
    private drawBlasts(overlay: Overlay, sim: Sim, now: number, scale: number): void {
        const ctx = overlay.ctx;
        keepWhile(this.blasts, now, BLAST_MS);
        for (const blast of this.blasts) {
            const t = (now - blast.start) / BLAST_MS;
            const eased = 1 - (1 - t) * (1 - t);
            this.traceGroundCircle(overlay, sim, blast.x, blast.y, blast.radius * (0.2 + eased));
            ctx.fillStyle = `rgba(255, 140, 30, ${0.3 * (1 - t)})`;
            ctx.fill();
            ctx.lineWidth = 10 * scale * (1 - t) + 2;
            ctx.strokeStyle = `rgba(255, 220, 120, ${0.9 * (1 - t)})`;
            ctx.stroke();
        }
    }

    // Where a rock's coming down, in the power-up colour so it doesn't read as
    // something to run from
    private drawRockTargets(overlay: Overlay, sim: Sim, now: number, scale: number): void {
        const ctx = overlay.ctx;
        for (const rock of sim.rocks) {
            if (rock.landTick <= sim.tick) {
                continue;
            }
            const pulse = 0.75 + 0.25 * Math.sin(now / 60);
            this.traceGroundCircle(overlay, sim, rock.x, rock.y, rock.radius);
            ctx.fillStyle = withAlpha(POWER_UP_COLOR, 0.15 * pulse);
            ctx.fill();
            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = withAlpha(POWER_UP_COLOR, 0.9 * pulse);
            ctx.stroke();
        }
    }

    // How far a fairy ring reaches
    private drawRingReach(overlay: Overlay, sim: Sim, now: number, scale: number): void {
        const ctx = overlay.ctx;
        for (const ring of sim.rings) {
            this.traceGroundCircle(overlay, sim, ring.x, ring.y, ring.radius);
            ctx.lineWidth = 2 * scale;
            ctx.strokeStyle = withAlpha(POWER_UP_COLOR, 0.45 + 0.15 * Math.sin(now / 200));
            ctx.stroke();
        }
    }

    // A beam of the casket's tier colour over every casket on the ground (and
    // of the power-up colour over power-ups, and the visitor colour over a
    // random event's visitor), and an arrow at the edge of the screen for ones
    // out of view
    private drawLootBeams(
        overlay: Overlay,
        sim: Sim,
        alpha: number,
        now: number,
        scale: number,
    ): void {
        const pulse = 0.75 + 0.25 * Math.sin(now / 180);
        for (const pickup of sim.pickups) {
            let color: string;
            // The beam shoots up once a casket has landed
            let landTick = pickup.spawnTick;
            if (pickup.kind === "casket" && pickup.tier) {
                color = CASKETS[pickup.tier].color;
                landTick += CASKET_HOP_TICKS;
            } else if (pickup.kind === "powerUp") {
                color = getPowerUp(pickup.powerUp ?? "").color ?? POWER_UP_COLOR;
            } else {
                continue;
            }
            if (pickup.disguise && pickup.disguise.openTick !== -1) {
                color = DISGUISE_COLOR;
            }
            this.drawBeam(overlay, sim, pickup, landTick, color, alpha, pulse, scale);
        }
        const visitor = sim.visitor;
        if (visitor) {
            this.drawBeam(
                overlay,
                sim,
                visitor,
                visitor.startTick,
                VISITOR_COLOR,
                alpha,
                pulse,
                scale,
            );
        }
    }

    private drawBeam(
        overlay: Overlay,
        sim: Sim,
        target: { x: number; y: number },
        landTick: number,
        color: string,
        alpha: number,
        pulse: number,
        scale: number,
    ): void {
        const ctx = overlay.ctx;
        const ground = this.ground(sim, target.x, target.y);
        const base = overlay.project(target.x, ground, target.y, this.screen);
        if (!base.visible) {
            const distance = this.drawEdgeArrow(overlay, sim, target, alpha, color, pulse, scale);
            this.drawArrowLabel(overlay, `${Math.round(distance)}`, color, scale);
            return;
        }
        const grow = Math.min(1, Math.max(0, (sim.tick - landTick) / 20));
        const bx = base.x;
        const by = base.y;
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 30 * scale);
        glow.addColorStop(0, withAlpha(color, 0.55 * pulse));
        glow.addColorStop(1, withAlpha(color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(bx, by, 30 * scale, 13 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        if (grow <= 0) {
            return;
        }
        const top = overlay.project(
            target.x,
            ground - LOOT_BEAM_HEIGHT * grow,
            target.y,
            this.screen2,
        );
        ctx.lineCap = "round";
        const beam = ctx.createLinearGradient(bx, by, top.x, top.y);
        beam.addColorStop(0, withAlpha(color, 0.7 * pulse));
        beam.addColorStop(1, withAlpha(color, 0));
        ctx.strokeStyle = beam;
        ctx.lineWidth = 18 * scale;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
        const core = ctx.createLinearGradient(bx, by, top.x, top.y);
        core.addColorStop(0, `rgba(255, 255, 255, ${0.8 * pulse})`);
        core.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = core;
        ctx.lineWidth = 5 * scale;
        ctx.stroke();
    }

    // An arrow at the edge of the screen pointing at something out of view,
    // from the hero the camera's on. Returns how far away it is, and leaves
    // where to put a label for drawArrowLabel.
    private drawEdgeArrow(
        overlay: Overlay,
        sim: Sim,
        target: { x: number; y: number },
        alpha: number,
        color: string,
        pulse: number,
        scale: number,
    ): number {
        const ctx = overlay.ctx;
        const { x: px, y: py } = getPlayerPose(sim, this.viewHero, alpha, this.localPlayerPose);
        const dx = target.x - px;
        const dy = target.y - py;
        const distance = Math.hypot(dx, dy);
        this.arrowLabel = undefined;
        if (distance < 0.001) {
            return distance;
        }
        // Which way it is on screen: from the player towards it, a couple of
        // tiles along (both ends stay on screen, unlike the casket itself)
        const from = overlay.project(px, this.ground(sim, px, py), py, this.screen);
        const fromX = from.x;
        const fromY = from.y;
        const ax = px + (dx / distance) * 2;
        const ay = py + (dy / distance) * 2;
        const to = overlay.project(ax, this.ground(sim, ax, ay), ay, this.screen2);
        let dirX = to.x - fromX;
        let dirY = to.y - fromY;
        const len = Math.hypot(dirX, dirY);
        if (!from.visible || len < 0.001) {
            return distance;
        }
        dirX /= len;
        dirY /= len;
        // Out from the player to the edge of the screen, kept a little inside
        const margin = 34 * scale;
        const edgeX = dirX > 0 ? overlay.width - margin : margin;
        const edgeY = dirY > 0 ? overlay.height - margin : margin;
        const t = Math.min(
            Math.abs(dirX) > 0.001 ? (edgeX - fromX) / dirX : Infinity,
            Math.abs(dirY) > 0.001 ? (edgeY - fromY) / dirY : Infinity,
        );
        const x = fromX + dirX * t;
        const y = fromY + dirY * t;
        const size = 16 * scale * (0.9 + 0.1 * pulse);
        drawArrow(ctx, x, y, Math.atan2(dirY, dirX), size, color, 14 * scale * pulse);
        this.arrowLabel = { x: x - dirX * size * 1.9, y: y - dirY * size * 1.9 };
        return distance;
    }

    // Under the rule (LightingDef.litTargetsOnly), a faint arrow just past the edge of the player's light for
    // what's coming at them out of the dark: one a way round (DARK_ARROW_SECTORS), for the nearest
    // that way, fainter the further off it is. Kept on the screen.
    private drawDarkArrows(overlay: Overlay, sim: Sim, alpha: number, scale: number): void {
        const own = sim.lights.find((light) => light.hero === this.viewHero);
        if (!own) {
            return;
        }
        const { x: px, y: py } = getPlayerPose(sim, this.viewHero, alpha, this.localPlayerPose);
        const nearest = this.darkArrows;
        nearest.fill(Infinity);
        const angles = this.darkArrowAngles;
        for (const enemy of sim.enemies) {
            if (enemy.dead || sim.isEnemyLit(enemy)) {
                continue;
            }
            const dx = enemy.x - px;
            const dy = enemy.y - py;
            const distance = Math.hypot(dx, dy);
            // Coming closer
            const before = Math.hypot(enemy.prevX - px, enemy.prevY - py);
            if (distance > DARK_ARROW_RANGE || distance >= before) {
                continue;
            }
            const angle = Math.atan2(dy, dx);
            const sector =
                Math.floor(((angle / (Math.PI * 2) + 1) % 1) * DARK_ARROW_SECTORS) %
                DARK_ARROW_SECTORS;
            if (distance < nearest[sector]) {
                nearest[sector] = distance;
                angles[sector] = angle;
            }
        }
        const ctx = overlay.ctx;
        const margin = 30 * scale;
        for (let i = 0; i < DARK_ARROW_SECTORS; i++) {
            const distance = nearest[i];
            if (distance === Infinity) {
                continue;
            }
            const dirX = Math.cos(angles[i]);
            const dirY = Math.sin(angles[i]);
            // Just past the light's edge, short of the enemy itself
            const reach = Math.max(1, Math.min(own.radius + DARK_ARROW_GAP, distance - 1));
            const ax = px + dirX * reach;
            const ay = py + dirY * reach;
            const at = overlay.project(ax, this.ground(sim, ax, ay), ay, this.screen);
            const ahead = overlay.project(
                ax + dirX,
                this.ground(sim, ax + dirX, ay + dirY),
                ay + dirY,
                this.screen2,
            );
            if (!at.visible) {
                continue;
            }
            const x = Math.min(Math.max(at.x, margin), overlay.width - margin);
            const y = Math.min(Math.max(at.y, margin), overlay.height - margin);
            // Never over a span under a tile: a light near DARK_ARROW_RANGE wide, drawn a step
            // ahead of the sim's, can see one just inside its edge
            const span = Math.max(1, DARK_ARROW_RANGE - own.radius);
            const near = 1 - (distance - own.radius) / span;
            ctx.globalAlpha = DARK_ARROW_ALPHA * (0.45 + 0.55 * Math.min(1, Math.max(0, near)));
            const angle = Math.atan2(ahead.y - at.y, ahead.x - at.x);
            drawArrow(ctx, x, y, angle, 11 * scale, DARK_ARROW_COLOR, 0);
        }
        ctx.globalAlpha = 1;
    }

    // Reused by drawDarkArrows: the nearest distance and its angle, a way round
    private readonly darkArrows = new Float64Array(DARK_ARROW_SECTORS);
    private readonly darkArrowAngles = new Float64Array(DARK_ARROW_SECTORS);

    // Where the last edge arrow wants its label, if it drew one
    private arrowLabel?: { x: number; y: number };

    private drawArrowLabel(overlay: Overlay, text: string, color: string, scale: number): void {
        const label = this.arrowLabel;
        if (!label) {
            return;
        }
        const ctx = overlay.ctx;
        ctx.font = `${Math.round(14 * scale)}px "OSRS Small", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000000";
        ctx.fillText(text, label.x + 1, label.y + 1);
        ctx.fillStyle = color;
        ctx.fillText(text, label.x, label.y);
    }

    // A hero's health bar over their head, and in co-op a teammate's name
    // over that; a downed teammate just has their name, greyed
    private drawHeroBar(
        overlay: Overlay,
        sim: Sim,
        hero: Hero,
        alpha: number,
        scale: number,
    ): void {
        const player = hero.player;
        const teammate = sim.heroes.length > 1 && hero.index !== sim.focus;
        if (hero.left || (player.deathTick !== -1 && !teammate && !hero.revive)) {
            return;
        }
        const ctx = overlay.ctx;
        const model = this.assets.getPlayer(hero.index);
        const { x: px, y: py } = getPlayerPose(sim, hero.index, alpha, this.localPlayerPose);
        // Lying down, the bar goes lower
        const height = hero.down ? 0.8 : (model?.height ?? 200) / 128;
        const top = this.ground(sim, px, py) - height - HEALTH_BAR_GAP;
        const p = overlay.project(px, top, py, this.screen);
        if (!p.visible) {
            return;
        }
        if (!hero.down) {
            drawHealthBar(ctx, p.x, p.y, scale, player.hp / player.maxHp);
        } else if (hero.revive) {
            // A revive under way fills up over them
            drawReviveBar(ctx, p.x, p.y, scale, hero.revive.ticks / REVIVE_TICKS);
        }
        if (!teammate) {
            return;
        }
        const pixel = Math.max(1, Math.round(scale));
        ctx.font = `${16 * pixel}px "OSRS Small", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const text = hero.down
            ? `${hero.name} (${sim.canBeRevived(hero) ? t("canvas.down_revive") : t("canvas.down")})`
            : hero.name;
        const y = p.y - 7 * pixel;
        ctx.fillStyle = "#000000";
        ctx.fillText(text, p.x + pixel, y + pixel);
        ctx.fillStyle = hero.down ? TEAMMATE_DOWN_COLOR : TEAMMATE_COLOR;
        ctx.fillText(text, p.x, y);
    }

    // An arrow at the edge of the screen for each teammate still in the fight
    // and out of view, with their name
    private drawTeammateArrows(
        overlay: Overlay,
        sim: Sim,
        alpha: number,
        now: number,
        scale: number,
    ): void {
        const pulse = 0.75 + 0.25 * Math.sin(now / 180);
        for (const hero of sim.heroes) {
            if (hero.left || hero.down || hero.index === this.viewHero) {
                continue;
            }
            const { x, y } = getPlayerPose(sim, hero.index, alpha, this.localPlayerPose);
            const p = overlay.project(x, this.ground(sim, x, y), y, this.screen);
            const margin = 20 * scale;
            if (
                p.visible &&
                p.x > margin &&
                p.y > margin &&
                p.x < overlay.width - margin &&
                p.y < overlay.height - margin
            ) {
                continue;
            }
            this.drawEdgeArrow(overlay, sim, { x, y }, alpha, TEAMMATE_COLOR, pulse, scale);
            this.drawArrowLabel(overlay, hero.name, TEAMMATE_COLOR, scale);
        }
    }
}

// The client's health bar: 30 by 5 pixels, green for what's left and red for
// what's gone, no border, its top 3 pixels above the point over the head
export function drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    fraction: number,
): void {
    const width = Math.round(30 * scale);
    const height = Math.round(5 * scale);
    const left = Math.round(x - width / 2);
    const top = Math.round(y - height * 0.6);
    let green = Math.floor(width * Math.max(0, Math.min(1, fraction)));
    // Anything left shows, however little
    if (green === 0 && fraction > 0) {
        green = 1;
    }
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(left, top, green, height);
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(left + green, top, width - green, height);
}

// Co-op: how far a revive has got, in the health bar's place, filling up in
// the teammates' green over the dark
function drawReviveBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    fraction: number,
): void {
    const width = Math.round(30 * scale);
    const height = Math.round(5 * scale);
    const left = Math.round(x - width / 2);
    const top = Math.round(y - height * 0.6);
    const done = Math.floor(width * Math.max(0, Math.min(1, fraction)));
    ctx.fillStyle = TEAMMATE_COLOR;
    ctx.fillRect(left, top, done, height);
    ctx.fillStyle = "#333333";
    ctx.fillRect(left + done, top, width - done, height);
}

// A hitsplat: the client's sprite with the number on it in white. If the
// sprite didn't load, a blob of its colour stands in.
// A hitsplat's digits: in full, as OSRS shows them, till an endless run's hits
// get too long for a splat. drawHitsplatImage sizes its canvas from the same.
function hitsplatText(amount: number): string {
    return amount < 100_000 ? String(amount) : formatCompact(amount);
}

function drawHitsplat(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLCanvasElement | undefined,
    x: number,
    y: number,
    pixel: number,
    amount: number,
    kind: HitsplatKind,
): void {
    // The digits themselves (not the space around them) on whole pixels so
    // they stay sharp, and the splat (scaled, so smoothed anyway) centred on
    // them
    const text = hitsplatText(amount);
    const ink = ctx.measureText(text);
    const inkWidth = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
    const inkHeight = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
    const inkLeft = Math.round(x - inkWidth / 2);
    const inkTop = Math.round(y - inkHeight / 2);
    const centerX = inkLeft + inkWidth / 2;
    const centerY = inkTop + inkHeight / 2;
    const width = (sprite?.width ?? 24) * pixel * HITSPLAT_SPRITE_SCALE;
    const height = (sprite?.height ?? 23) * pixel * HITSPLAT_SPRITE_SCALE;
    if (sprite) {
        ctx.drawImage(sprite, centerX - width / 2, centerY - height / 2, width, height);
    } else {
        drawHitsplatBlob(ctx, centerX, centerY, width / 2, kind);
    }
    const textX = inkLeft + ink.actualBoundingBoxLeft;
    const textY = inkTop + ink.actualBoundingBoxAscent;
    ctx.fillStyle = "#000000";
    ctx.fillText(text, textX + pixel, textY + pixel);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, textX, textY);
}

// A hitsplat drawn once, as drawHitsplat would at a whole pixel, to be copied:
// measuring and drawing its text for every one of a hundred splats each frame
// is the slowest thing on the overlay. left and top are where the canvas goes
// from the corner of the digits.
type HitsplatImage = {
    sprite: HTMLCanvasElement;
    canvas: HTMLCanvasElement;
    inkWidth: number;
    inkHeight: number;
    left: number;
    top: number;
};

// Enough for every number in a busy fight
const MAX_HITSPLAT_IMAGES = 160;

class HitsplatImages {
    private readonly images = new Map<string, HitsplatImage>();
    private font = "";

    get(
        sprite: HTMLCanvasElement,
        font: string,
        pixel: number,
        hitsplat: { kind: HitsplatKind; amount: number },
    ): HitsplatImage {
        if (font !== this.font) {
            this.images.clear();
            this.font = font;
        }
        // By what's drawn, so an endless run's huge hits that show the same
        // ("1.2Qa") share one image
        const key = hitsplat.kind + hitsplatText(hitsplat.amount);
        let image = this.images.get(key);
        if (image && image.sprite === sprite) {
            // Most recently used last, for dropping the oldest
            this.images.delete(key);
            this.images.set(key, image);
            return image;
        }
        if (this.images.size >= MAX_HITSPLAT_IMAGES) {
            this.images.delete(this.images.keys().next().value!);
        }
        image = drawHitsplatImage(sprite, font, pixel, hitsplat.amount, hitsplat.kind);
        this.images.set(key, image);
        return image;
    }
}

function drawHitsplatImage(
    sprite: HTMLCanvasElement,
    font: string,
    pixel: number,
    amount: number,
    kind: HitsplatKind,
): HitsplatImage {
    const canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    ctx.font = font;
    const ink = ctx.measureText(hitsplatText(amount));
    const inkWidth = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
    const inkHeight = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
    const width = sprite.width * pixel * HITSPLAT_SPRITE_SCALE;
    const height = sprite.height * pixel * HITSPLAT_SPRITE_SCALE;
    // Room for the splat and the digits' shadow, a pixel past each
    const left = Math.floor(Math.min(0, inkWidth / 2 - width / 2)) - 1;
    const top = Math.floor(Math.min(0, inkHeight / 2 - height / 2)) - 1;
    const right = Math.ceil(Math.max(inkWidth + pixel, inkWidth / 2 + width / 2)) + 1;
    const bottom = Math.ceil(Math.max(inkHeight + pixel, inkHeight / 2 + height / 2)) + 1;
    canvas.width = right - left;
    canvas.height = bottom - top;
    // Sizing the canvas resets its context
    ctx = canvas.getContext("2d")!;
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.imageSmoothingQuality = "high";
    // As drawHitsplat, with the digits' corner at (-left, -top), a whole pixel
    drawHitsplat(ctx, sprite, -left + inkWidth / 2, -top + inkHeight / 2, pixel, amount, kind);
    return { sprite, canvas, inkWidth, inkHeight, left, top };
}

// Fill and edge of the blob that stands in for a splat that didn't load
const HITSPLAT_BLOB_COLORS: Record<HitsplatKind, [string, string]> = {
    damage: ["#b0120c", "#3a0402"],
    poison: ["#1f8a12", "#063a02"],
    block: ["#1c5fd0", "#061a3a"],
};

function drawHitsplatBlob(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    kind: HitsplatKind,
): void {
    ctx.beginPath();
    const points = 9;
    for (let i = 0; i <= points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? radius : radius * 0.82;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.9;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fillStyle = HITSPLAT_BLOB_COLORS[kind][0];
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = HITSPLAT_BLOB_COLORS[kind][1];
    ctx.stroke();
}

// One for every enemy drawn, as there can be hundreds a frame (the renderer
// only reads it while it's drawing)
const enemyDrawOptions: ActorDrawOptions = {};

// An arrow pointing at angle (radians, on the screen), its tip size ahead of (x, y), with a glow
// of its colour this wide
function drawArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    size: number,
    color: string,
    glow: number,
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.75);
    ctx.lineTo(-size * 0.35, 0);
    ctx.lineTo(-size * 0.7, -size * 0.75);
    ctx.closePath();
    if (glow > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
    ctx.restore();
}
// Drawn at full brightness on a lit map (ActorDrawOptions.unlit): warnings and effects
const UNLIT: ActorDrawOptions = { unlit: 1 };
// A lantern in hand (drawLantern): tiles out to the left, ahead, and up, and how big
const LANTERN_SIDE = 0.38;
const LANTERN_AHEAD = 0.12;
const LANTERN_HEIGHT = 0.55;
const LANTERN_OPTIONS: ActorDrawOptions = { scale: 1, unlit: 1 };

// getEnemyModelKey, made once rather than for every enemy every frame
const enemyModelKeys = new Map<EnemyDef, string[]>();

function getCachedEnemyModelKey(def: EnemyDef, variant: number): string {
    let keys = enemyModelKeys.get(def);
    if (!keys) {
        keys = [];
        enemyModelKeys.set(def, keys);
    }
    return (keys[variant] ??= getEnemyModelKey(def, variant));
}

// Drops what's run its time, in place: the overlay's effects are pruned every
// frame, and a new array each time is garbage for a phone to collect
function keepWhile<T extends { start: number }>(list: T[], now: number, ms: number): void {
    let kept = 0;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (now - item.start < ms) {
            list[kept++] = item;
        }
    }
    list.length = kept;
}

// Baked models are empty when the cache had nothing to draw
function hasGeometry(model: ActorModel): boolean {
    return model.height > 0 || model.radius > 0;
}

// Height above the ground (tiles) of a casket t hops into its throw
function casketHop(t: number): number {
    if (t < 0 || t >= 1.5) {
        return 0;
    }
    if (t < 1) {
        return CASKET_HOP_HEIGHT * Math.sin(Math.PI * t);
    }
    return CASKET_HOP_HEIGHT * 0.22 * Math.sin(Math.PI * (t - 1) * 2);
}

// How much bigger a power-up's drawn than the cache has it, for its model and
// its timer alike: a loc (the cannon) is big there already
function getPowerUpScale(model: ActorModel): number {
    return model.key.startsWith("loc:") ? POWER_UP_LOC_SCALE : POWER_UP_SCALE;
}

// How far over the ground a power-up floats (tiles), bobbing up and down
function getPowerUpBob(pickup: Pickup, tick: number): number {
    return POWER_UP_BOB * (1 + Math.sin((tick + pickup.uid * 13) / 8));
}

// "#rrggbb" with an alpha, for canvas gradients
function withAlpha(hex: string, alpha: number): string {
    const value = parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export function formatTime(seconds: number): string {
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export { TICKS_PER_SECOND };

// A lunge's strip (BossAttackDef.line) on the ground, the first share of its length
function stripCorners(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    line: { width: number; length: number },
    share: number,
): { x: number; y: number }[] {
    const sideX = (-dirY * line.width) / 2;
    const sideY = (dirX * line.width) / 2;
    const endX = x + dirX * line.length * share;
    const endY = y + dirY * line.length * share;
    return [
        { x: x + sideX, y: y + sideY },
        { x: endX + sideX, y: endY + sideY },
        { x: endX - sideX, y: endY - sideY },
        { x: x - sideX, y: y - sideY },
    ];
}

// A square half tiles either way of x, y
function squareCorners(x: number, y: number, half: number): { x: number; y: number }[] {
    return [
        { x: x - half, y: y - half },
        { x: x + half, y: y - half },
        { x: x + half, y: y + half },
        { x: x - half, y: y + half },
    ];
}
