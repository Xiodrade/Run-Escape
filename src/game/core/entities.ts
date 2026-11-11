import {
    ArenaStatue,
    BossAttackDef,
    CasketTier,
    EnemyDef,
    ImpactDef,
    LightLook,
    PlayerEffectDef,
    RandomEventDef,
    Stats,
    ThrallDef,
    WeaponDef,
} from "../content/types";

// Positions are world tiles (x east, y north). prevX/prevY are last tick's
// position, for drawing between ticks.

export type Player = {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    radius: number;
    // Last direction moved in (unit vector); weapons aim along it
    facingX: number;
    facingY: number;
    yaw: number;
    moving: boolean;
    hp: number;
    maxHp: number;
    // Tick the current attack animation started, -1 for none
    attackSeq: number;
    attackStart: number;
    moveStart: number;
    // Tick they died, -1 while alive
    deathTick: number;
    // Ticks of invulnerability left (after a revive)
    invulnerable: number;
    // Hit flash, ticks left
    flash: number;
    // Ticks left frozen in place (the King Black Dragon's ice breath)
    frozen: number;
    // Poison: damage every second until poisonEnd, -1 for none
    poisonDamage: number;
    poisonEnd: number;
};

// A boss attack being wound up: it lands (or is fired) at landTick
export type BossWindup = {
    attack: BossAttackDef;
    startTick: number;
    landTick: number;
    // Where a blast lands: where the player was when it started, and for a
    // blast of several, spots scattered around it. Thrown from statues
    // (BossAttackDef.from): where the player was, and from: the statues.
    targets: { x: number; y: number }[];
    from?: ArenaStatue[];
    // The way the boss faced as it began (a cone swing's wedge)
    dirX: number;
    dirY: number;
    // A surge's lane, there on the ground the whole time it winds up
    lane?: SurgeLane;
    // When its seq plays from, timed so its blow falls as it lands (BossAttackDef.strikeAt)
    seqTick?: number;
    // Where it's cast from, where that isn't where the boss is as it begins (toMiddle's leap):
    // a gaze's shadows are from here from the start (BossAttackDef.cover)
    at?: { x: number; y: number };
};

// Across the arena, from where a surge starts to where it stops; what's within
// halfWidth tiles of the line is in its way
export type SurgeLane = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    halfWidth: number;
};

// A surge under way: the boss going down its lane
export type BossSurge = {
    attack: BossAttackDef;
    lane: SurgeLane;
    startTick: number;
    endTick: number;
    // The heroes it's gone through (by index), each hit once
    hit: number[];
};

// Where a boss fought in phases (BossDef.phases) has got to
export type BossPhase = {
    // Counts from 0
    index: number;
    // finale: after the last blast, its last stand (BossPhasesDef.finale); hp:
    // a fight with no totems, on its hitpoints
    stage: "shield" | "totems" | "finale" | "hp";
    shield: number;
    shieldMax: number;
    // Its four totems
    totems: Enemy[];
    // The attack it's to open this phase with, until it has
    opener?: BossAttackDef;
    // When its ambient pattern begins again (BossPhasesDef ambient), and each
    // of its ambients
    ambientNext: number;
    ambientsNext?: number[];
    // The tick the phase began
    startTick?: number;
    // A phase's threshold (BossPhasesDef.threshold): kneeling until riseTick,
    // up again at pauseEnd
    riseTick?: number;
    pauseEnd?: number;
    // When the finale's over and it falls
    finaleEnd?: number;
};

// Enemies walking to a boss to be absorbed (BossAttackDef summon.walkTo)
export type BossWalkers = {
    attack: BossAttackDef;
    enemies: Enemy[];
    absorbed: number;
    perAbsorbed: number;
};

export type BossState = {
    // Ticks until each of the boss's attacks can be used again
    cooldowns: number[];
    // Where its last wall's way through was, in lanes (BulletPatternDef.gapStep)
    wallGap?: number;
    windup?: BossWindup;
    // Taken from the player, given back when the boss dies
    stolenCoins: number;
    // Times it has got back up
    rises: number;
    // Below half its hitpoints: faster, and with its enraged attacks
    enraged: boolean;
    // Enraged by its partner's death (BossDef enrage.partner): its interval's times this instead
    furyTempo?: number;
    // How many of BossDef.summonsAt have been called in
    summonsDone: number;
    phase?: BossPhase;
    surge?: BossSurge;
    walkers?: BossWalkers;
    // An attack still to be used again straight after (BossAttackDef.chain)
    chain?: { attack: BossAttackDef; left: number };
    // An attack to begin at this tick, after the one it follows
    // (BossAttackDef.follow)
    follow?: { attack: BossAttackDef; atTick: number };
    // Leashing back to the player with a jump (BossDef.leash.jump): down where
    // it is until switchTick, then up at (toX, toY) until endTick
    leap?: { toX: number; toY: number; switchTick: number; endTick: number };
    // It stands still until this tick, as its volleys go out
    channelEnd: number;
    // BossDef.naps: down until this tick (-1 when it's up), and when it next goes down
    napEnd?: number;
    nextNap?: number;
    // BossDef.colours: when it next changes
    nextColour?: number;
    // BossDef.stare: the way it's staring (radians, none until it does), and when it next turns
    stareAngle?: number;
    nextStare?: number;
    // Where it'll stare once it turns at nextStare, picked and said a moment before
    stareNext?: number;
    // BossDef.stomp: hits since the player stepped under it, the next one and when it was set (to
    // draw its ring filling), and whether its message has been said
    stomps?: number;
    nextStomp?: number;
    stompFrom?: number;
    stompSaid?: boolean;
    // How many times each row attack's been used (BulletPatternDef.rows), by name
    rowSets?: Record<string, number>;
    // The rhythms going (BossAttackDef.cycle)
    cycles?: BossCycle[];
    // BossDef.guard: its guard's down until exposedEnd, and it's stunned (doing nothing)
    // until stunEnd
    exposedEnd?: number;
    stunEnd?: number;
    // It can't be stunned again until this tick (BossGuardDef.stunGrace)
    stunGraceEnd?: number;
    // A lunge's dash (BossAttackDef line.dash): from (fromX, fromY) to (toX, toY) over these
    // ticks, stunned at the end if it's run into a pillar (stuck)
    dash?: {
        attack: BossAttackDef;
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        startTick: number;
        endTick: number;
        stuck: boolean;
    };
    // BossDef.shadowRealm, exhumes or yellows: how many have begun, and the one it's in, until
    // endTick or, for exhumes, its exhumeds are all smothered (left, -1 for the others)
    ordealsDone?: number;
    // opener: what it does first, once (BossOrdealDef.opener), till it's begun
    ordeal?: {
        endTick: number;
        left: number;
        during: { attacks: string[]; interval: number };
        opener?: BossAttackDef;
    };
    // One's due but waiting for expert's projectile to land: no more of expert's own meanwhile
    ordealHeld?: boolean;
};

// A rhythm of a boss's (BossAttackDef.cycle) since startTick: when each player
// (by index) can be hurt by it again
export type BossCycle = {
    attack: BossAttackDef;
    startTick: number;
    nextHit: number[];
};

// A boss's big entrance (BossDef.intro)
export type BossIntro = {
    def: EnemyDef;
    type: "boss" | "finalBoss";
    hp?: number;
    startTick: number;
    riseTick: number;
    endTick: number;
    // Up once it's risen
    boss?: Enemy;
};

// Off to the edge of the map, as a boss rises (BossDef.intro): it can't be
// hit, doesn't fight, and is gone at endTick
export type EnemyLeaving = {
    vx: number;
    vy: number;
    startTick: number;
    endTick: number;
};

// A spot on the ground a boss has marked (BossAttackDef ground), shown from
// startTick. It lands at landTick, or with armed spots, goes off under the
// player any time from landTick to endTick (fuseTick once they've set it off).
export type GroundHazard = {
    uid: number;
    enemyUid: number;
    // Its boss's EnemyDef id, kept for once the boss is gone (what its hits are said to be from,
    // and its armour cap)
    enemyId: string;
    attack: BossAttackDef;
    x: number;
    y: number;
    radius: number;
    damage: number;
    startTick: number;
    landTick: number;
    endTick: number;
    armed: boolean;
    fuseTick: number;
    // With a grab (GroundPatternDef.grab): it goes on hurting whoever steps
    // in until this tick, once each (hit, by hero index); 0 without one
    grabEnd: number;
    hit: number[];
    // Landed and lingering (GroundPatternDef.lingers) until this tick, -1 when not,
    // and when it next hurts whoever's in it
    lingerEnd: number;
    nextHurt: number;
    // A square this far either way of x, y rather than the circle radius (a
    // checker's cell); unset for a circle
    half?: number;
    // An exhumed's ticks stood in so far (GroundPatternDef.smother)
    stood?: number;
    // Its glow in place of its ground's (GroundPatternDef.light): an Akkha mark's quadrant's
    // element (BossAttackDef.elemental). Only drawn.
    light?: LightLook;
};

// A boss's corpse flowers (BossAttackDef quarters), crossing at (x, y). The
// lines are up from startTick and they hurt from hurtTick. safe: the quarter
// that doesn't, see quarterOf.
export type BossQuarters = {
    enemyUid: number;
    attack: BossAttackDef;
    x: number;
    y: number;
    safe: number;
    damage: number;
    startTick: number;
    hurtTick: number;
    endTick: number;
    nextHurt: number;
};

// Which of the four quarters around (cx, cy) a spot is in
export function quarterOf(cx: number, cy: number, x: number, y: number): number {
    return (x >= cx ? 1 : 0) + (y >= cy ? 2 : 0);
}

// Volleys still to come from a boss's pattern attack
export type BulletEmitter = {
    enemyUid: number;
    attack: BossAttackDef;
    // Index into Sim.bulletAttacks
    source: number;
    nextTick: number;
    volleysLeft: number;
    angle: number;
    // Towards where the player stood as it began: what a mirrored volley's
    // mirrored about (BulletPatternDef.mirror)
    aim: number;
    damage: number;
    // A phase's own pattern (BossPhasesDef ambient), not an attack
    ambient?: boolean;
    // Where a pattern with origin "target" comes out of: where the player stood as it began
    originX?: number;
    originY?: number;
    // A row attack's rows (BulletPatternDef.rows), by index, and when it began
    rows?: number[];
    startTick?: number;
};

// The player's controls shuffled (PlayerEffectDef curse): x and y of what's
// pressed, times this
export type PlayerCurse = {
    matrix: readonly [number, number, number, number];
    attacksLeft: number;
};

// Eating away at the player, until it bursts at burstTick
export type PlayerParasite = {
    enemyUid: number;
    attack: BossAttackDef;
    damage: number;
    startTick: number;
    burstTick: number;
};

// Held in place by enemies at their side (BossAttackDef summon.holds)
export type PlayerHold = {
    enemies: Enemy[];
    endTick: number;
};

// When an enemy can next use what its def gives it besides walking up and
// hitting (EnemyDef.spawns, heals, revives, blinks), in ticks
export type EnemyAbilities = {
    nextSpawn: number;
    nextHeal: number;
    nextRevive: number;
    nextBlink: number;
    // Winding up a blink, which lands then; -1 when it isn't
    blinkLand: number;
    // The hurt enemy a healer is on its way to
    healTarget?: Enemy;
};

export type EnemyAnim = "walk" | "idle" | "attack" | "death" | "jump";

// Going over a ditch: from one side to the other, starting at tick start
export type EnemyJump = { fromX: number; fromY: number; toX: number; toY: number; start: number };
export type EnemyFlung = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    startTick: number;
    endTick: number;
};

export type Enemy = {
    uid: number;
    def: EnemyDef;
    // Which of the def's outfits it wears (0 for NPCs)
    variant: number;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    // Knockback velocity, tiles per tick
    vx: number;
    vy: number;
    hp: number;
    maxHp: number;
    damage: number;
    // Tiles per tick
    speed: number;
    radius: number;
    scale: number;
    tint: number;
    elite: boolean;
    // Any boss; the final one ends the run when it dies
    boss: boolean;
    finalBoss: boolean;
    // Bosses that fight with attacks of their own
    bossState?: BossState;
    // What its hits are multiplied by beyond its def's: a boss's attacks, an
    // explosion (harder maps, and later in a run, hit harder)
    damageScale: number;
    yaw: number;
    anim: EnemyAnim;
    animStart: number;
    // The animation for anim "attack" (bosses have one per attack)
    attackSeq: number;
    attackCooldown: number;
    // Ticks left frozen (Ice spells)
    frozen: number;
    // Under LightingDef.litTargetsOnly, whether it stood in a sim light as this tick's lights were
    // made, or as it came (Sim.isEnemyLit)
    lit?: boolean;
    // Jumping a ditch, and nothing else until it lands
    jump?: EnemyJump;
    // Takes this much more damage from everything (0.25 = +25%) until
    // drainEnd (the Bandos godsword's Warstrike)
    drain: number;
    drainEnd: number;
    // Venom: venom damage at venomNext and every second after, until venomEnd
    // (the Toxic blowpipe)
    venom: number;
    venomNext: number;
    venomEnd: number;
    // What envenomed it, for the run's stats, and the hero who did
    venomSource?: DamageSource;
    venomHero?: number;
    flash: number;
    dead: boolean;
    // Tick it died, for the death animation and fade
    deathTick: number;
    // Which death of the run's it was (Sim.enemyDeaths), 0 while alive
    deathSeq: number;
    xp: number;
    // Takes no damage until this tick (EnemyDef.shield); 0 once it's down
    shieldEnd: number;
    // Rising (BossDef.intro, EnemyBlinksDef.surface) until this tick, doing
    // nothing else; 0 once it's up
    risingEnd: number;
    // On its way off the map (BossDef.intro)
    leaving?: EnemyLeaving;
    // One of a boss's totems (BossPhasesDef): its hitpoints are the charge it
    // still needs, and it can't die
    totemOf?: Enemy;
    // Walking to this boss to be absorbed (BossAttackDef summon.walkTo)
    walksTo?: Enemy;
    // Rolling straight on, so far a tick, till endTick (Ba-Ba's cracked boulder:
    // BulletPatternDef.cracked), hurting and knocking back whoever it runs into as its
    // boss's attack would
    rolls?: {
        vx: number;
        vy: number;
        endTick: number;
        damage: number;
        knockback: number;
        attack: BossAttackDef;
        bossUid: number;
    };
    // Making for one of the arena's sarcophagi (Sim.tombsSarcophagi), to open it
    seeks?: number;
    // There, prying it open: it's open at this tick, if it's still alive
    pryEnd?: number;
    // The last tick a blocked hit showed on it, so they don't pile up
    blockedTick: number;
    // The enemy that called it in (EnemyDef.spawns), 0 for none
    spawnedBy: number;
    // Co-op: the boss encounter it's one copy of (Encounter.id), with the
    // others; their loot comes with the last of them to fall
    encounter?: number;
    // Brought back by a reviver: it drops nothing when it dies again
    noDrops: boolean;
    // An enemy of another faction it's gone to fight (EnemyDef.faction)
    // instead of the player, the tick it next looks for one, and how many
    // ticks it's been after foes with no way to them and no hit landed
    foe?: Enemy;
    nextFoeLook: number;
    foeWait: number;
    // The player's hit it, or it's given up on a foe it had no way to: it's
    // after the player from now on, not the other factions
    aggro: boolean;
    // Called in by a spawner that says so (EnemySpawnsDef.bonesOnly): it
    // drops its bones and nothing else
    bonesOnly: boolean;
    // Hatches at this tick if it's still alive (EnemyDef.hatches); 0 for never
    hatchTick: number;
    // Thrown out by a boss (BossAttackDef.summon.thrown): in the air from one
    // spot to the other between these ticks, and nothing to the fight until
    // it lands
    flung?: EnemyFlung;
    // Copying a boss's lunge (EnemyDef.echoes): winding its own up (drawn as the boss's strip
    // is), then dashing down it with what it throws up where it stops, and nothing else till
    // it's done
    echo?: BossWindup;
    echoDash?: EnemyFlung & { impact?: ImpactDef };
    abilities?: EnemyAbilities;
};

// An enemy that died lately, which a reviver can bring back
export type Death = {
    def: EnemyDef;
    variant: number;
    x: number;
    y: number;
    tick: number;
};

// A boss's glyph (BossDef.glyph), sliding along its line between the boss
// and the player
export type Glyph = {
    uid: number;
    bossUid: number;
    look: EnemyDef;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    // From the boss towards the player when it turned up, and across that
    // (unit vectors)
    dirX: number;
    dirY: number;
    acrossX: number;
    acrossY: number;
    startTick: number;
};

export type ProjectileKind = "spell" | "knife" | "axe" | "rune" | "cannonball";

// How a projectile circles the player (orbiting runes)
export type Orbit = {
    // Radians at the projectile's startTick, and radians a tick
    angle: number;
    angularSpeed: number;
    // Tiles from the player
    radius: number;
    // The tick each enemy can next be hit, so it's hit once a pass
    nextHit: Map<number, number>;
    rehitTicks: number;
};

export type Projectile = {
    uid: number;
    // The hero it's from (Sim.heroes), whose stats its hits use
    hero: number;
    kind: ProjectileKind;
    // None for a cannon's or a thrall's
    weapon?: WeaponDef;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    // Tiles per tick
    vx: number;
    vy: number;
    speed: number;
    // Enemy it steers towards, 0 for none
    targetUid: number;
    damage: number;
    pierce: number;
    // Enemies it can still bounce on to (thrown axes)
    bounces: number;
    // Venom it leaves on what it hits: damage a second, and for how many ticks
    venom: number;
    venomTicks: number;
    // Circling the player instead of flying
    orbit?: Orbit;
    // Splits at its first hit (WeaponDef.split); gone once it has
    split?: { count: number; damage: number; pierce: number };
    // Ticks left
    life: number;
    radius: number;
    splash: number;
    knockback: number;
    hit: Set<number>;
    yaw: number;
    spotAnim: number;
    impactSpotAnim: number;
    // Cache sound effect when it hits, -1 for none
    hitSound: number;
    objId: number;
    startTick: number;
};

// Fired by a boss at the player
export type EnemyProjectile = {
    uid: number;
    // The boss that fired it
    enemyUid: number;
    enemyId: string;
    attack: BossAttackDef;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    // Tiles per tick
    vx: number;
    vy: number;
    speed: number;
    // Radians per tick it turns towards the player
    homing: number;
    // Ticks left
    life: number;
    radius: number;
    damage: number;
    yaw: number;
    startTick: number;
    // A normal enemy's shot rather than a boss attack: it only lands when a
    // crowd's hit could (not just after the player was hit)
    crowd?: boolean;
    // A wave's or a boomerang's (BossAttackDef.wave, boomerang): who it's hit (by
    // hero index), and a boomerang's who it's hit on the way back
    hit?: number[];
    // A boomerang: thrown from here (by this statue), turning back at turnTick
    boomerang?: {
        fromX: number;
        fromY: number;
        turnTick: number;
        hitBack: number[];
        statue?: ArenaStatue;
    };
    // An attack that turns on its boss (BossAttackDef.turns): it's caught it on the way out
    // (1) and back (2)
    hitBoss?: number;
};

export type PickupKind = "bones" | "coins" | "food" | "casket" | "powerUp";

// A sim light (MapDef.lighting), in the sim's tiles: what weapons can aim by under
// litTargetsOnly, and what's drawn for it. Made again each tick (Sim.lights). radius is what it
// reaches now (a lantern's grows and shrinks); look is how it's drawn.
export type Light = {
    kind: "player" | "map" | "enemy" | "left";
    // Which of its kind: a hero's index, the map's light's, the enemy's uid
    id: number;
    x: number;
    y: number;
    radius: number;
    look: LightLook;
    // What it moves with, so it can be drawn where that's drawn
    hero?: number;
    enemy?: Enemy;
};

// Where a light-carrying enemy died (EnemyDef.light.left): its light stays a while. id: its uid.
export type LeftLight = {
    id: number;
    x: number;
    y: number;
    look: LightLook;
    startTick: number;
    endTick: number;
};

export type Pickup = {
    uid: number;
    kind: PickupKind;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    value: number;
    attracted: boolean;
    speed: number;
    spawnTick: number;
    // Bones and coins sliding over to join a bigger pile: its uid, 0 for none
    pileUid: number;
    // Caskets only
    tier?: CasketTier;
    // Power-ups only: which one
    powerUp?: string;
    // A casket that's really a boss (EnemyDef.disguise)
    disguise?: DisguisedBoss;
};

// Co-op: a boss's copies (content/coop.ts bossCopies), with one boss's
// hitpoints, experience and loot shared between them
// Co-op: what a boss's copies share (see Sim.newEncounter), and whether
// one of them has said the boss is here, so that the others don't
export type Encounter = { id: number; copies: number; announced?: boolean };

export type DisguisedBoss = {
    enemyId: string;
    // Its hitpoints on this map, when they're not its own
    hp?: number;
    // Co-op: one of several caskets, each hiding one of the boss's copies
    encounter?: Encounter;
    // When it starts shaking if it's left alone
    shakeTick: number;
    // When it opens, -1 until it's shaking
    openTick: number;
};

// A beam from a boss to its partner (BossAttackDef.tether), between wherever the two are
export type BossTether = {
    bossUid: number;
    attack: BossAttackDef;
    // When it starts to hurt, and when it's gone
    armTick: number;
    endTick: number;
};

// A pool on the ground that hurts the player (BossAttackDef.pool)
export type GroundPool = {
    uid: number;
    enemyId: string;
    x: number;
    y: number;
    radius: number;
    damage: number;
    interval: number;
    effect?: PlayerEffectDef;
    // Scenery it's drawn as
    locId: number;
    startTick: number;
    endTick: number;
    // The next hit on a player standing in it
    nextTick: number;
};

// A one-off spot animation somewhere in the world (spell impacts, strikes)
export type Effect = {
    uid: number;
    spotAnim: number;
    x: number;
    y: number;
    // Tiles above the ground
    height: number;
    startTick: number;
    endTick: number;
    // Follows this enemy until it's gone, 0 for none
    enemyUid: number;
    // Plays over and over until endTick (a shield), rather than once
    loop?: boolean;
    // Scaled so the model's radius is this many tiles (a claw's hands, as
    // wide as the spot they come up in), rather than drawn as it is
    fitRadius?: number;
    // Turned this way (a lunge's trail along its strip), rather than as it is
    yaw?: number;
    // Gone once its animation's played, however long it's kept (an impact's dust)
    once?: boolean;
};

// A multicannon set up by a power-up
export type Turret = {
    uid: number;
    hero: number;
    x: number;
    y: number;
    yaw: number;
    startTick: number;
    endTick: number;
    nextShot: number;
    damage: number;
    // Tiles
    range: number;
    // Cannonballs per shot, and ticks between shots
    amount: number;
    interval: number;
};

// A thrall raised by a power-up, fighting beside the player until endTick
export type Thrall = {
    uid: number;
    // The hero it follows and fights for
    hero: number;
    def: ThrallDef;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    yaw: number;
    moving: boolean;
    // Tick its last attack started, -1 for none
    attackStart: number;
    cooldown: number;
    damage: number;
    startTick: number;
    endTick: number;
};

// A rock falling from a power-up, then lying where it landed until endTick
export type FallingRock = {
    uid: number;
    hero: number;
    powerUpId: string;
    x: number;
    y: number;
    startTick: number;
    landTick: number;
    endTick: number;
    locId: number;
    spotAnim: number;
    radius: number;
    damage: number;
    knockback: number;
    // Of a boss's hitpoints
    bossDamage: number;
};

// A giant NPC from a power-up, charging through the crowd
export type Rampage = {
    uid: number;
    hero: number;
    powerUpId: string;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    yaw: number;
    // Where this pass ends
    goalX: number;
    goalY: number;
    passesLeft: number;
    // Uids of what this pass has hit
    hit: Set<number>;
    damage: number;
    // Tiles a tick
    speed: number;
    radius: number;
    knockback: number;
    startTick: number;
    endTick: number;
    // The tick it left, -1 while it's still charging
    doneTick: number;
    walkSeq: number;
    scale: number;
};

// A ring from a power-up, warping away what comes near until endTick
export type FairyRing = {
    uid: number;
    hero: number;
    x: number;
    y: number;
    startTick: number;
    endTick: number;
    nextPulse: number;
    radius: number;
    locId: number;
    spotAnim: number;
    scale: number;
};

// Someone from a random event, standing around until endTick to be walked up to
export type Visitor = {
    uid: number;
    def: RandomEventDef;
    x: number;
    y: number;
    startTick: number;
    endTick: number;
    nextShoutTick: number;
};

// What a visitor who opens a screen has on offer, with the run waiting: a
// power-up for sale, an extra co-op revive for sale, or an answer to the Quiz
// Master's question
export type EventOption =
    | { kind: "powerUp"; powerUpId: string; price: number; sold: boolean }
    | { kind: "revive"; price: number; sold: boolean }
    // A raid's supply chest: paid for in raid points, not coins
    | { kind: "supply"; supplyId: string; price: number; sold: boolean }
    // A raid's teleporter: on to this room's boss now
    | { kind: "teleport" }
    // The Helpful Spirit's bundles (the Tombs of Amascut's): free, one of them taken, its supplies
    // into the inventory
    | { kind: "bundle"; bundleId: string; items: { supplyId: string; count: number }[] }
    | { kind: "answer"; itemId: string; correct: boolean };

export type EventOffer = {
    uid: number;
    def: RandomEventDef;
    options: EventOption[];
    // The hero who met the visitor, who chooses (co-op)
    hero: number;
};

// A power-up that lasts a while, for the timers on screen
export type ActivePowerUp = {
    uid: number;
    // Who picked it up (whose look it is, for one with a look)
    hero: number;
    id: string;
    startTick: number;
    endTick: number;
};

// What dealt some damage, for the run's stats: a weapon, a utility item or a
// power-up by id, the Ring of recoil, or something else
export type DamageSource =
    | `weapon:${string}`
    | `item:${string}`
    | `powerUp:${string}`
    // A fight's button (MapDef.fight.ability), and its arena's attacks that turned on the boss
    | `ability:${string}`
    | "court"
    | "recoil"
    | "other";

// A projectile's weapon, or else the power-up that fired it: a cannon's
// cannonballs, or a thrall's
export function projectileSource(projectile: Projectile): DamageSource {
    if (projectile.weapon) {
        return `weapon:${projectile.weapon.id}`;
    }
    return projectile.kind === "cannonball" ? "powerUp:cannon" : "powerUp:thrall";
}

export type WeaponState = {
    def: WeaponDef;
    // 1-based
    level: number;
    cooldown: number;
    // Extra damage from rare upgrade rolls (0.15 = +15%)
    bonus: number;
    // Attacks made, for special attacks
    uses: number;
};

// Burning ground a weapon left (Toktz-mej-tal's): hurts what's in it every so
// often until endTick
export type GroundFire = {
    uid: number;
    hero: number;
    // The weapon that left it, for the run's stats
    source: DamageSource;
    x: number;
    y: number;
    radius: number;
    damage: number;
    nextTick: number;
    endTick: number;
    // Scenery for its flames, and where they stand
    locId: number;
    flames: { x: number; y: number }[];
};

// A hit still to land, a moment after the swing (the Dragon claws' later
// slashes)
export type PendingHit = {
    hero: number;
    enemy: Enemy;
    weapon: WeaponDef;
    damage: number;
    knockback: number;
    tick: number;
};

// A potion's boost, until endTick
export type Buff = {
    itemId: string;
    stats: Partial<Stats>;
    // Keeps poison and boss drains off (an antidote)
    cures: boolean;
    startTick: number;
    endTick: number;
    // For its timer, when it isn't from an item (itemId is then just a key)
    look?: { name: string; objId: number };
};

// Stats a boss attack lowered, until endTick
export type Debuff = {
    id: string;
    // Doses of a debuff that stacks; its stats are all of them added up
    stacks?: number;
    name: string;
    iconObjId: number;
    stats: Partial<Stats>;
    startTick: number;
    endTick: number;
};

export type PassiveState = {
    id: string;
    // Times picked
    level: number;
    // What all the picks add up to (each pick's size depends on its rarity)
    value: number;
};

// hero: in co-op, the hero (Sim.heroes) it happened to or was done by, for
// the events that are someone's (a hit taken, a pickup, a casket)
export type SimEvent = SimEventBody & { hero?: number };

type SimEventBody =
    | {
          type: "damage";
          x: number;
          y: number;
          amount: number;
          enemyUid: number;
          enemyId: string;
          // Venom's damage, shown as a poison splat
          poison?: boolean;
          // A hit its shield took, shown as a blocked hit (amount 0)
          blocked?: boolean;
      }
    // A weapon was used; sound is the cache sound effect for it (-1 none)
    | { type: "weapon"; weaponId: string; sound: number; x: number; y: number }
    | { type: "cannonSetup"; x: number; y: number }
    | { type: "cannonFire"; x: number; y: number }
    // A power-up was picked up and used; message says what it did
    | { type: "powerUp"; id: string; message: string; x: number; y: number }
    | { type: "powerUpEnded"; id: string }
    // A power-up landed a blow (PowerUpDef.hitSound)
    | { type: "powerUpHit"; id: string; x: number; y: number }
    | { type: "thrallAttack"; sound: number; x: number; y: number }
    // A projectile hit something and has a sound for it
    | { type: "impact"; sound: number; x: number; y: number }
    // sound: the boss attack's hit sound, instead of the enemy's attack sound
    | { type: "playerHit"; amount: number; enemyId: string; elite: boolean; sound?: number }
    | { type: "playerPoisoned"; amount: number }
    // A boss attack was used (a swing landed, or projectiles were fired)
    | { type: "bossAttack"; enemyId: string; sound: number; x: number; y: number }
    // A boss's swing landed, hitting around (x, y)
    | { type: "bossSwing"; x: number; y: number; radius: number }
    // Something of a fight's landed hard at (x, y): the camera shakes (0 to 1) and the screen
    // can flash (ImpactDef)
    | { type: "bossImpact"; x: number; y: number; shake: number; flash?: string }
    // A boss's guard is down (BossDef.guard): exposed, or stunned, and by what (the attack's
    // name: its own that missed, or its arena's that caught it, or "Pillar")
    | {
          type: "bossGuard";
          enemyId: string;
          stunned: boolean;
          cause: string;
          x: number;
          y: number;
      }
    // The fight's button was used (MapDef.fight.ability), and on the boss it hit
    // opened: the boss's guard was down (BossDef.guard), so it did double
    | {
          type: "ability";
          abilityId: string;
          enemyId: string;
          sound: number;
          x: number;
          y: number;
          opened: boolean;
      }
    // A boss's big entrance has begun (the screen's going dark), and it's risen
    | { type: "bossIntro"; enemyId: string; sound: number }
    | { type: "bossRising"; enemyId: string; sound: number; x: number; y: number }
    // A boss fought in phases has moved on; message: what to do now
    | {
          type: "bossStage";
          enemyId: string;
          phase: number;
          stage: BossPhase["stage"];
          message: string;
          x: number;
          y: number;
      }
    // A statue the fight draws (BossAttackDef.statues) starts this animation:
    // the one of locId whose south-west tile is x, y
    | { type: "statueSeq"; locId: number; x: number; y: number; seq: number }
    // Its totems' blast, from each totem to the boss
    | { type: "totemBlast"; sound: number; x: number; y: number; toX: number; toY: number }
    // Sleepwalkers' blast, which can't be dodged; absorbed: how many fed it
    | { type: "bossAbsorbBlast"; x: number; y: number; absorbed: number }
    // The player's controls were shuffled, or came back
    | { type: "playerCursed"; cursed: boolean }
    | {
          type: "slash";
          x: number;
          y: number;
          dirX: number;
          dirY: number;
          reach: number;
          width: number;
          // Half the angle the swoosh covers, radians
          arc: number;
          weaponId: string;
      }
    | { type: "aura"; x: number; y: number; radius: number }
    | { type: "pickup"; kind: PickupKind; value: number }
    | { type: "levelUp"; level: number }
    // byEnemy: killed by another faction's enemy, not the player
    | {
          type: "kill";
          enemyUid: number;
          enemyId: string;
          boss: boolean;
          x: number;
          y: number;
          byEnemy?: boolean;
      }
    // Something the player should know about, on screen for a moment (a
    // shield dropping, a boss's big attack coming)
    // instruction: a boss attack's own say on what to do (BossAttackDef.message), which the
    // client shows once a run and one at a time (GameClient.showInstruction)
    | { type: "notice"; message: string; instruction?: boolean }
    | { type: "evolved"; weaponId: string }
    | { type: "revive" }
    | { type: "casketDropped"; tier: CasketTier; x: number; y: number }
    // A casket was picked up and opened; the run waits for a decision
    | { type: "chest"; tier: CasketTier; itemId: string; coins: number }
    // What was done with a casket's item (or an item from the inventory)
    | { type: "equip"; itemId: string; replacedId?: string; coins: number }
    | { type: "stash"; itemId: string }
    | { type: "alch"; itemId: string; coins: number }
    | { type: "itemUsed"; itemId: string; x: number; y: number }
    | { type: "blast"; x: number; y: number; radius: number }
    | {
          type: "bossSpawned";
          enemyId: string;
          name: string;
          message: string;
          finalBoss: boolean;
          x: number;
          y: number;
      }
    // A boss said something over its head
    | { type: "bossShout"; enemyUid: number; text: string }
    // Said over the player's head (Durial321's lines in Falador)
    | { type: "playerShout"; text: string }
    // A boss got back up when it should have died
    | { type: "bossRose"; enemyId: string; message: string; x: number; y: number }
    // A boss dropped below half its hitpoints and is enraged
    | { type: "bossEnraged"; enemyId: string; message: string; x: number; y: number }
    // A boss took coins from the player, or gave them back when it died
    | { type: "coinsStolen"; enemyId: string; amount: number }
    | { type: "coinsReturned"; enemyId: string; amount: number }
    // A random event's visitor came, went or did what they do; on screen for a
    // moment. sound: cache sound effect, -1 for none.
    | { type: "visitor"; message: string; sound: number }
    // Said over the visitor's head
    | { type: "visitorShout"; text: string }
    // An endless run's final boss is down and the next round has begun
    | { type: "roundStarted"; round: number }
    // Co-op: a hero went down with no ring of life left (out of the fight
    // until a teammate revives them, while the run goes on), left the game,
    // or was brought back by the teammate at index by
    | { type: "heroDown" }
    | { type: "heroLeft" }
    | { type: "heroRevived"; by: number }
    // Co-op: a hero found or bought an extra revive
    | { type: "extraRevive" };
