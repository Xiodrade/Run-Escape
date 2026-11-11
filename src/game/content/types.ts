import { Rarity } from "./rarity";

// Content is plain data: what an enemy, weapon or passive is, with cache ids
// for how it looks. The simulation reads the numbers; the client reads the ids.

// Every multiplier and bonus a run's stats are made of (VS "power ups")
export type StatKey =
    | "might" // damage multiplier bonus (0.1 = +10%)
    | "armor" // flat damage taken reduction
    | "maxHp" // max hitpoints multiplier bonus
    | "regen" // hitpoints a minute
    | "cooldown" // weapon cooldown reduction (0.1 = 10% faster)
    | "area" // weapon area multiplier bonus
    | "speed" // projectile speed multiplier bonus
    | "duration" // effect duration multiplier bonus
    | "amount" // extra projectiles
    | "moveSpeed" // movement speed multiplier bonus
    | "magnet" // pickup range multiplier bonus
    | "luck" // luck bonus (more choices, better drops)
    | "growth" // xp multiplier bonus
    | "greed" // coin multiplier bonus
    | "revival" // extra lives
    | "reroll" // extra rerolls of a level up's rewards or a casket's item
    | "banish" // weapons, passives or items that can be kept out of the run
    | "thorns" // damage dealt back to whatever hits you
    | "healChance" // chance a hit heals the player (blood fury)
    // Damage multiplier bonuses for one combat style's weapons only (see
    // WeaponDef.damageStyle), on top of might
    | "meleeMight"
    | "rangedMight"
    | "magicMight"
    | "auraArea" // auras' radius multiplier bonus, on top of area
    // Damage multiplier bonus against bosses only, on top of might
    | "bossMight"
    // Damage multiplier bonus for each level gained in the run (so it grows
    // as the run goes on), on top of might
    | "levelMight"
    // Melee weapons' knockback multiplier bonus
    | "meleeKnockback"
    // Slots on top of the usual ones, bought in the shop
    | "weaponSlots"
    | "passiveSlots"
    // How much more often power-ups drop
    | "powerUpRate";

export type Stats = Record<StatKey, number>;

export function emptyStats(): Stats {
    return {
        might: 0,
        armor: 0,
        maxHp: 0,
        regen: 0,
        cooldown: 0,
        area: 0,
        speed: 0,
        duration: 0,
        amount: 0,
        moveSpeed: 0,
        magnet: 0,
        luck: 0,
        growth: 0,
        greed: 0,
        revival: 0,
        reroll: 0,
        banish: 0,
        thorns: 0,
        healChance: 0,
        meleeMight: 0,
        rangedMight: 0,
        magicMight: 0,
        auraArea: 0,
        bossMight: 0,
        levelMight: 0,
        meleeKnockback: 0,
        weaponSlots: 0,
        passiveSlots: 0,
        powerUpRate: 0,
    };
}

// What some weapons hit harder (the Ivandis flail and undead, vampyres)
// kalphite: the kalphites and the scarabs (Kephri too), for the keris partisans
export type EnemyTag = "undead" | "vampyre" | "kalphite";

export type EnemyDef = {
    id: string;
    name: string;
    npcId: number;
    idleSeq: number;
    walkSeq: number;
    // -1 when the NPC has none we know of
    attackSeq: number;
    // -1: sink into the ground instead
    deathSeq: number;
    // Played jumping a ditch (MapDef.ditch); without one it just goes over
    jumpSeq?: number;
    hp: number;
    // Damage per hit when touching the player
    damage: number;
    // Tiles per second
    speed: number;
    // Collision radius in tiles (kept under half a tile so everything fits
    // through doors)
    radius: number;
    // XP of the bones it drops
    xp: number;
    // 0 = full knockback, 1 = immune
    knockbackResist?: number;
    // Render scale on top of the NPC's own
    scale?: number;
    // Walks through walls and water (though it turns up where the rest do)
    ghost?: boolean;
    // Flies over fences, buildings' walls, trees and water, as the walkers can't,
    // and has to go round terrain walls as they do (FlightGrid)
    flies?: boolean;
    // Cache sound effect ids
    sounds: { attack: number; hit: number; death: number };
    // Bosses: the toast when they turn up, and a spot animation and sound
    // where they do (the Wise Old Man teleports in)
    spawnMessage?: string;
    spawnSpotAnim?: number;
    spawnSound?: number;
    // Bosses that fight with attacks of their own (instead of hitting
    // whatever they touch)
    boss?: BossDef;
    // Drawn as a player in one of these outfits (picked at random as each one
    // turns up) instead of as the NPC: the fun maps' scammers, pkers and
    // noobs. npcId is unused then.
    outfits?: EnemyOutfit[];
    // Shoots at the player from a distance as well as hitting what it touches
    // (the fun maps' rangers and mages): a weak shot, for the enemy's own
    // damage, that only hits when a crowd's hit could
    shot?: EnemyShotDef;
    // Copies a boss's lunges (the Menaphite Akh's shadow, NEW-7): as boss starts one of these
    // attacks (by name, each a swing with a line), every living enemy with this winds up its own
    // from where it stands, at the nearest hero, with the boss's windup and seq, and lands it
    // down its own strip. Gate it to a phase by naming only that phase's attacks. A boss can
    // echo its partner (the elder Scarab Mage's half of the Crossfire): only while it's free,
    // not winding up, channelling, kneeling or in the air.
    echoes?: EchoDef;
    // Lines it says now and then, over its head (the fun maps' chat)
    chat?: string[];
    // Never moves, and can't be knocked back or left behind (Pest Control's
    // portals, Zulrah); the player can't walk through it either
    stationary?: boolean;
    // Prays against these styles: weapons' hits of them do this share of their
    // damage (the Theatre of Blood's bosses, in a raid that's melee's)
    protects?: { styles: CombatStyle[]; damage: number };
    // On a raid's expert mode, only this style's weapons hurt it (the Nylocas:
    // grey melee, green ranged, blue magic). Everything else still does.
    onlyStyle?: CombatStyle;
    // And there its own style does this many times the damage: with the other two
    // doing nothing, a wave's Nylocas go down quickly to the right one (not a boss)
    expertOwnStyle?: number;
    // On a raid's expert mode, it turns up as this enemy instead (the Maiden's
    // Nylocas Matomenos, as ones that heal her)
    expertAs?: string;
    // Turns up at one of these spots (world tiles, picked at random) rather
    // than somewhere near the player (the portals stand where they do in the
    // game)
    spawnAt?: { x: number; y: number }[];
    // Calls in enemies around itself now and then (a portal's pests)
    spawns?: EnemySpawnsDef;
    // Takes no damage for a while after it turns up (a portal's shield): hits
    // show as blocked, it's tinted, and the spot animation loops on it.
    // message: the notice when it drops. look: an NPC it's drawn as while
    // shielded instead, as the game has a shielded version of it (Pest
    // Control's portals).
    shield?: {
        seconds: number;
        spotAnim?: number;
        message?: string;
        look?: { npcId: number; idleSeq: number };
    };
    // Heals hurt bosses or other enemies near it (Pest Control's spinners heal
    // the portals, Jad's healers heal Jad)
    heals?: EnemyHealsDef;
    // Brings a dead enemy back where it fell now and then (the Inferno's
    // Jal-Zek)
    revives?: EnemyRevivesDef;
    // Splits into smaller enemies when it dies (the Inferno's Jal-Ak)
    splits?: { into: string; count: number; spotAnim?: number };
    // Blows up when it dies, hurting the player if they're close (Pest
    // Control's splatters). damage is like EnemyDef.damage (the map's
    // difficulty and the run's time scale it the same way).
    // pack: what it does to the other enemies in reach too (the Tombs' volatile baboons, which take
    // their own pack with them), before the hit's scaling
    explodes?: {
        damage: number;
        radius: number;
        spotAnim?: number;
        sound?: number;
        pack?: number;
    };
    // What its hit does to the player besides its damage (the Tombs' cursed baboons weaken them)
    touches?: PlayerEffectDef;
    // Drawn as this item's model, never animated, instead of as the NPC
    // (Phosani's eggs are the Parasitic egg): npcId goes unused
    objId?: number;
    // Still alive this many seconds after it turns up, it's gone, and count of
    // into come out where it stood, dropping nothing (Phosani's eggs hatch
    // parasites unless they're broken first)
    hatches?: { seconds: number; into: string; count: number; spotAnim?: number; sound?: number };
    // Its health bar's over it for as long as it's alive, full or not, so what
    // it's got left can be read at a glance (Phosani's eggs, against their time)
    healthBar?: boolean;
    // The player can't push it: walking into it, they're the one that gives,
    // as with what can't move (Phosani's Nightmare and everything of hers)
    solid?: boolean;
    // Weapons pass it by: it's there to be walked into, not hit (Zebak's jugs,
    // which would otherwise break the moment they're down)
    unhittable?: boolean;
    // The game's hint arrow bobs over it while it's alive, and points the way
    // from the screen's edge when it's off it (Phosani's eggs, to be found)
    hintArrow?: boolean;
    // Now and then digs in or blinks and comes up right by the player
    // (Jal-ImKot burrows, Pest Control's shifters teleport)
    blinks?: EnemyBlinksDef;
    // Enemies of different factions hurt each other when they touch (the God
    // Wars Dungeon's armies), while still coming for the player; each
    // faction's come from their own side, so the armies meet
    faction?: string;
    // A light it carries (the Scar's light leeches, a fire elite), and one it leaves where it dies
    // for seconds. A sim light: on a map with lighting.litTargetsOnly, weapons can aim by it. Off a
    // map with lighting it does nothing.
    light?: LightLook & { left?: LightLook & { seconds: number } };
    // What it is, for the weapons that hit some things harder
    tags?: EnemyTag[];
    // Runs from the player when they're within range tiles instead of coming
    // at them, and doesn't come closer than twice that (Castle Wars' flag
    // carrier, off home with the flag)
    flees?: { range: number };
    // Holds the player where they stand for this many seconds once it reaches
    // them, or until it's dead (Phosani's husks): the boss holds off meanwhile,
    // as it does for a summon that holds
    holds?: number;
    // Bosses: turns up as a reward casket of this tier instead, lying near the
    // player with its beam like any other (the Mimic). Walking onto it, or
    // leaving it for seconds, sets it shaking, and shake seconds later it opens
    // and the boss comes out, playing seq. warning: spot animations spinning in
    // a ring ringRadius tiles round it while it shakes, for stepping back from
    // (the Mimic's sweets).
    disguise?: {
        casket: CasketTier;
        seconds: number;
        shake: number;
        seq?: number;
        warning?: { spotAnims: number[]; count: number; ringRadius: number };
    };
    // Bosses: the caskets it drops, in place of the usual one (elite, now and
    // then master). The flag carrier's flag is worth a second; a Pest Control
    // portal's is smaller, as there are four of them.
    caskets?: CasketTier[];
};

export type EnemySpawnsDef = {
    // What comes, picked by weight like a wave's enemies
    enemies: { id: string; weight: number }[];
    // Seconds between calls (the first a call's time after it turns up), and
    // how many come each time
    interval: number;
    count: number;
    // No more than this many of its own alive at once (8 when unset)
    max?: number;
    // Tiles from it they turn up (2 when unset), and a spot animation where
    // each one does
    radius?: number;
    spotAnim?: number;
    // What it calls in drops its bones and nothing else (no caskets, coins,
    // food or power-ups), so a portal left standing isn't a casket farm
    bonesOnly?: boolean;
};

export type EnemyHealsDef = {
    // Heals this fraction of a target's hitpoints every interval seconds, the
    // most hurt one within range tiles
    fraction: number;
    interval: number;
    range: number;
    // Enemy ids it heals; any boss when unset
    targets?: string[];
    // Walks over to a hurt target this many tiles away or closer (12 when
    // unset), instead of coming for the player. Keep it under the distance at
    // which enemies left behind are brought back to the player (34 tiles).
    seek?: number;
    // Shown on what it heals
    spotAnim?: number;
};

export type EnemyRevivesDef = {
    // Every interval seconds, the last enemy to die within range tiles of it
    // (not a boss or an elite, and not one that's been brought back already)
    // gets back up where it fell, with this fraction of its hitpoints (all
    // when unset). Brought back, it drops nothing the second time.
    interval: number;
    range: number;
    hp?: number;
    // Shown where it gets up, and the reviver's animation (its attackSeq when
    // unset)
    spotAnim?: number;
    seq?: number;
};

export type EnemyBlinksDef = {
    // Every interval seconds, when it's further than minRange tiles from the
    // player, it stands still for windup seconds (playing seq, with
    // castSpotAnim where it is) and comes up distance tiles from the player
    // (with impactSpotAnim there)
    interval: number;
    minRange: number;
    distance: number;
    windup?: number;
    seq?: number;
    castSpotAnim?: number;
    impactSpotAnim?: number;
    sound?: number;
    // Comes up slowly, playing seq for seconds (and sound again, for the warning):
    // it can be hit, but doesn't move or hit anything until it's up
    surface?: { seq: number; seconds: number };
    // Seconds before another of its kind can go after one does, so a crowd left
    // behind don't all land on the player at once
    gap?: number;
};

// A player look for an enemy: worn items by equipment slot, and optionally
// body colours (hair, torso, legs, feet, skin) and the female body
export type EnemyOutfit = {
    equipment: Partial<Record<number, number>>;
    colors?: number[];
    female?: boolean;
};

export type EnemyShotDef = {
    // Shoots when the player is this many tiles away or closer, and stops
    // walking up at about three quarters of it
    range: number;
    // On a raid's expert mode it stops this many tiles off instead: the blue
    // Nylocas, which only magic hurts there, come in where a magic aura reaches
    expertKeep?: number;
    // Seconds between shots
    interval: number;
    // Tiles per second
    speed: number;
    // In flight, on the shooter as it fires, and where it hits
    spotAnim: number;
    castSpotAnim?: number;
    impactSpotAnim?: number;
    // The shooter's animation as it fires (its attackSeq when unset)
    seq?: number;
    // Cache sound effects when it fires and when it hits
    sound?: number;
    hitSound?: number;
};

// Something a boss attack does to the player besides its damage
export type PlayerEffectDef =
    // Can't move for a moment (the King Black Dragon's ice breath)
    | { kind: "freeze"; seconds: number }
    // Damage every second for a while (poison breath)
    | { kind: "poison"; damage: number; seconds: number }
    // Stats lowered for a while (Karil's tainted shot, Ahrim's curses).
    // stacks: another dose adds to it, up to this many at once, and starts the
    // clock again (Slash Bash's disease); it replaces it when unset
    | {
          kind: "debuff";
          id: string;
          name: string;
          iconObjId: number;
          stats: Partial<Stats>;
          seconds: number;
          stacks?: number;
      }
    // Takes this fraction of the run's coins (the Wise Old Man's Telekinetic
    // Grab); they come back when the boss dies
    | { kind: "steal"; fraction: number }
    // Shuffles which way the player's controls go until the boss has made this
    // many more attacks (The Nightmare's Curse, with no prayers here to swap)
    | { kind: "curse"; attacks: number }
    // Slows the player, and has the boss attacking faster, for a while
    // (The Nightmare's spores)
    | {
          kind: "drowsy";
          id: string;
          name: string;
          iconObjId: number;
          moveSpeed: number;
          bossInterval: number;
          seconds: number;
      };

// What a boss's "pattern" attack fires, as a bullet hell does
export type BulletPatternDef = {
    // ring: evenly spaced all round; spiral: a ring that turns between volleys;
    // spread: a fan aimed at the player; wall: a line across, coming at the
    // player, with a gap somewhere new each volley (Sotetseg's maze); closing: a
    // ring round the player, distance tiles out, closing in, with a gap
    // rows: down the map's bolt rows (ArenaFeatures.bolts), see rows
    shape: "ring" | "spiral" | "spread" | "wall" | "closing" | "rows";
    // Bullets a volley, how many volleys, and seconds between them
    count: number;
    volleys: number;
    interval: number;
    // Tiles per second, and how far they go
    speed: number;
    range: number;
    // Tiles
    radius: number;
    // Radians a volley turns by (a spiral's arms)
    turn?: number;
    // Radians from one side of a spread to the other
    arc?: number;
    // Radians a second each bullet curves by as it flies
    curve?: number;
    // Rings and spirals: radians left empty in each volley, from the ring's own
    // angle, so there's a way through that moves round with turn. A wall or a
    // closing ring: its bullets left out, side by side, for the way through
    gap?: number;
    // Rings and spirals: the gap's put on the side of the player it's aimed at
    // ("player") or the far side of the boss from them ("away", so the way
    // out is round behind her), instead of at random
    gapAt?: "player" | "away";
    // Spreads: aimed afresh at the nearest player with every volley, as a
    // stream that follows them (keep stepping across it)
    track?: boolean;
    // Each volley's fired twice, the second mirrored about the aim, so the
    // two turn opposite ways: a sweep's arms open like scissors, a spiral
    // winds against itself
    mirror?: boolean;
    // Tiles a second added to each volley's speed after the first, so later
    // volleys catch the earlier ones up and the lattice closes as it arrives
    speedUp?: number;
    // Rings and spirals: fired from a circle this many tiles round the nearest
    // player, flying inwards, rather than out from the boss (the ring closes
    // in on them, and the gap's the way out)
    around?: number;
    // A wall's tiles between bullets; a closing ring's tiles out
    spacing?: number;
    distance?: number;
    // Closing rings only (a test checks): seconds it stands where it formed before it closes in,
    // to find the way out
    hold?: number;
    // Rings and spirals: out from where the nearest player stood as it began (a thrown boulder
    // bursting where it lands), rather than from the boss
    origin?: "target";
    // Walls: straight down the arena (south), whoever's where (Ba-Ba's boulders, from her altar)
    heading?: "south";
    // Walls: count lanes side by side, the gap's lane (ends included) moving at most this many from
    // the last volley's, so the next way through can always be reached (Ba-Ba's boulders: five
    // and a gap, as in OSRS). The lanes stay as they are on hard.
    gapStep?: number;
    // Walls with gapStep: the way through is this enemy instead, rolling with the rest (Ba-Ba's
    // cracked boulder), to be broken to get through. It hurts and knocks back as they do.
    cracked?: string;
    // Drawn as this enemy's model, playing its walk (Ba-Ba's boulders, rolling as they go), at
    // the size it hits, rather than as the attack's spot animation
    look?: string;
    // Tiles a hit knocks the player on, the way the bullet's going
    knockback?: number;
    // Tiles out from the boss's middle a ring, spiral or spread starts, and a wall in front of it:
    // a pocket by the boss the volley never crosses, for whoever fights up close
    from?: number;
    // Model scale, when its hit size would leave it too thin to dodge, and how
    // much it's lit up against dark ground (0 to 1)
    scale?: number;
    bright?: number;
    // A glow on the floor under each bullet while it flies, so a dark one reads on dark ground.
    // Only drawn, on a map with lighting.
    glow?: LightLook;
    // Held at this tick of its spot animation, not played: for one that bursts as it plays (Akkha's
    // darkness orb throws shards five times its size), so each bullet looks the size of what it hits
    still?: number;
    // Seconds the boss stands still firing before it can begin its next attack,
    // instead of until the last volley's out: a slow ring keeps coming while
    // she aims the next thing through it (Phosani's)
    channel?: number;
    // Fired in bursts: count volleys at interval, then pause seconds before
    // the next burst, so a sweep's arm has holes along it to run through
    burst?: { count: number; pause: number };
    // Rows: each time the attack's used, the next of these sets of the map's bolt
    // rows (by index, in turn), every volley a bolt down each row of the set from
    // its fromX to its toX (count's not used)
    rows?: { sets: number[][] };
    // Stopped by the map's pillars (ArenaFeatures.pillars): a bolt's flight is cut
    // short at the first one in its way, worked out as it's fired, so it costs
    // nothing in the air. Straight bullets only (no curve).
    pillars?: boolean;
    // Seconds from its beginning to its first volley: the warning of one that's
    // an ambient, with no windup of its own (the statues drawing)
    delay?: number;
};

// Where a boss's "ground" attack marks the ground, each spot radius tiles
// across. Everything's on the ground for the attack's windup before it lands.
export type GroundPatternDef = {
    // A glow on each mark while it's on the ground. Only drawn, on a map with lighting.
    light?: LightLook;
    // under: on the boss; player: on the player; ring: around the boss (or
    // the player, with around), distance tiles out; grid: a lattice around
    // the player, spacing tiles apart; scatter: at random within spread tiles
    // of the player, none on another
    spots: (
        | { shape: "under" | "player" }
        | { shape: "ring"; count: number; distance: number; around?: "player" }
        | { shape: "grid"; size: number; spacing: number }
        // awayFrom: no closer to the boss than this, and on ground the player can get to
        | { shape: "scatter"; count: number; spread: number; awayFrom?: number }
        // A plus of spots a tile apart on the player's tile, reach tiles each way (Ba-Ba's
        // rockfall)
        | { shape: "cross"; reach: number }
        // checker: every cell of one colour of the map's checker (ArenaFeatures.checker),
        // at random, square; then the other colour's cells, shown from when the first
        // land and landing then seconds after. With cross, only the cells within cross
        // cells of the player's, along its row and column.
        | { shape: "checker"; then: number; cross?: number }
        // trail: on where the player stood each of these many seconds ago (at most
        // TRAIL_SECONDS), so the path they've just walked bursts (the Champion of Scabaras)
        | { shape: "trail"; ago: number[] }
    )[];
    // Marked by a shadow on the floor, darkening as what falls comes down (BossAttackDef.falls),
    // rather than by its spot animation
    shadow?: boolean;
    radius: number;
    // Set: it stays armed this many seconds after the windup, going off under
    // whoever comes within radius rather than landing all at once (spores)
    armed?: number;
    // Marks somewhere safe rather than somewhere to keep off: it does no damage, and
    // its attack's projectile does nothing to whoever's standing in it (Verzik's
    // green ball, on expert). The attack lays it as it's cast.
    safe?: boolean;
    // It stays on the ground this many seconds once it's landed, hurting whoever
    // stands in it every interval seconds for this share of its damage (the
    // Maiden's blood, Xarpus's acid)
    lingers?: { seconds: number; interval: number; damage: number };
    // What's drawn at each spot, scaled to radius: scenery, or a spot animation.
    // It's all that marks the spot, so it has to be there from the start. fit: how
    // much bigger than that, for a model with more around it than it looks.
    locId?: number;
    spotAnim?: number;
    fit?: number;
    // A square spot (a checker's cell) hurts only within the circle drawn on it (its radius
    // times fit), not to its corners: what's seen is what's hit
    round?: boolean;
    // How solid that's drawn (0.1, faint, when unset): a mark that's the only warning of a big
    // hit over the whole floor wants to be plainer (the checker's glowing cells)
    alpha?: number;
    // Drawn in the middle of the spot, faintly, as the warning; and with grab
    // set, played out there in full as the spot lands, for seconds, scaled so
    // it fits the spot's radius times fit (Grasping Claws' hands coming up
    // out of the ground). up is when in that animation, in seconds from
    // landing, what comes up is in sight: the warning (a frame from then,
    // held) stays until up.from, and the spot only hurts from up.from to
    // up.to, so nothing's hit by what can't be seen. Without grab it's drawn
    // as it is, for what can't be scaled up.
    middleSpotAnim?: number;
    grab?: { seconds: number; fit: number; up: { from: number; to: number } };
    // An exhumed (BossDef.exhumes): standing in it for seconds smothers it, and one still there
    // when it lingers no longer heals the boss heal of its hitpoints, healSpotAnim flying to it.
    smother?: { seconds: number; heal: number; healSpotAnim?: number; smotheredSpotAnim?: number };
};

// One of Akkha's four quadrants' elements: what it does to whoever's hit in it (on top of the
// damage), its spot animation, the trailing orb dropped in it (an enemy, only drawn), its symbol,
// and its colour: its symbol's and the funnel of light round it as it lights up for Memory Blast,
// and the orbs a blast throws up
export type AkkhaElementDef = {
    name: string;
    effect: PlayerEffectDef;
    spotAnim: number;
    orb: string;
    symbolLoc: number;
    glow: number;
};

// Zebak's fight (BossDef.zebak; Sim.stepZebak), as content/tombs.ts's ZEBAK says
export type ZebakDef = {
    specials: number[];
    acid: {
        count: number;
        half: number;
        upsetHalf: number;
        damage: number;
        ramp: number;
        poison: PlayerEffectDef;
        loc: number;
    };
    jugs: {
        enemyId: string;
        count: number;
        speed: number;
        reach: number;
        water: number;
        upsetWater: number;
        breakSpotAnim: number;
        splashSpotAnim: number;
    };
    roar: {
        boulders: number;
        seconds: number;
        hits: number;
        share: number;
        knock: number;
        shelter: number;
        look: string;
        radius: number;
        spotAnim: number;
        seq: number;
        message: string;
        roarMessage: string;
        // Drawn only: the roar's shockwave, spotAnim rolling out from him reach tiles
        // over seconds, and the camera's shake (0 to 1) as it goes
        shockwave: {
            spotAnim: number;
            seconds: number;
            reach: number;
            scale: number;
            shake: number;
        };
    };
    waves: {
        count: number;
        gap: number;
        leastGap: number;
        speed: number;
        delay: number;
        damage: number;
        shove: number;
        look: string;
        seq: number;
        message: string;
    };
    clouds: {
        enemyId: string;
        every: number;
        drain: number;
        heal: number;
        arterial: number;
        message: string;
    };
};

// Kephri's fight (BossDef.kephri; Sim.stepKephri), as content/tombs.ts's KEPHRI says
export type KephriDef = {
    // soldierFeed: of a shield, what each of the Soldier Scarab's heals puts on it
    shields: { count: number; share: number; overcharge: number; soldierFeed: number };
    intermissions: {
        swarms: number[];
        overlords: string[][];
        moreOverlords: string[][];
        message: string;
        endMessage: string;
    };
    swarm: {
        enemyId: string;
        shield: number;
        heal: number;
        reach: number;
        cadence: number[];
        trios: number;
        medic: number;
    };
    dung: {
        // Seconds between, on her last (every's for the shields), and the least either comes to
        // with the path level
        every: number;
        finalEvery?: number;
        least: number;
        warn: number;
        knock: number;
        stun: number;
        damage: number;
        gap: number;
        radius: number;
        seconds: number;
        spotAnim: number;
        dropSpotAnim: number;
        pileLoc: number;
        message: string;
        thrownMessage: string;
    };
    eggs: { explodeId: string; fuse: number; radius: number; damage: number; spotAnim: number };
    arcane: {
        enemyId: string;
        charge: number;
        disperse: number;
        spotAnim: number;
        spots: [number, number][];
        message: string;
    };
    overlordAt: Record<string, [number, number]>;
    finalMessage: string;
};

// Akkha (the Tombs of Amascut). He fights in one style at a time, praying against it (his forms,
// each an enemy of its own), and every specialEvery attacks does a special instead and changes to
// another style. The floor's four quadrants (TombsPathDef boss.quadrants) each have an element.
export type AkkhaDef = {
    forms: string[];
    // How bright his room is for his fight (drawn only), in place of the Tombs' dimmer ambient
    ambient: number;
    specialEvery: number;
    // After Memory Blast, he's on the floor to be hit as long as it took, and specialGap seconds at
    // least, before his next special, however many attacks he's made
    specialGap: number;
    elements: AkkhaElementDef[];
    // Memory Blast, Simon says: he vanishes, the symbols light up one after another, each beside the
    // last (never across), flash seconds each and gap between; then, burst seconds apart (quick
    // with Feeling Special), every quadrant but the next in the order is blasted, for damage (a
    // share of your hitpoints, through armour) and its element. steps long, one more every
    // perLevels path levels, up to most.
    memory: {
        steps: number;
        perLevels: number;
        most: number;
        flash: number;
        gap: number;
        burst: number;
        quick: number;
        damage: number;
        message: string;
    };
    // Detonate, in a party only: everyone's marked, and seconds later each goes off in a plus round
    // their tile (an X instead, half the time, with Feeling Special), for damage (a share of the
    // hitpoints of whoever else is on those tiles, through armour) and spotAnim on each. Whoever's on
    // the same tile as them is spared, so a party all on one tile takes nothing.
    detonate: { seconds: number; damage: number; spotAnim: number; message: string };
    // Trailing orbs: for seconds, an orb on every tile anyone leaves, armed after arm seconds, that
    // goes off (damage, its quadrant's element) under whoever comes within radius; gone linger
    // seconds after. Feeling Special drops one ahead of you too.
    orbs: {
        seconds: number;
        arm: number;
        radius: number;
        damage: number;
        linger: number;
        message: string;
    };
    // While his orbs are out he uses only these of his attacks (by name, whichever form he's in):
    // shapes a single deliberate step answers, so standing still is a choice that can be made
    orbAttacks?: string[];
    // His shadows: at each of these shares of his hitpoints, enemyId comes in each quadrant's
    // corner (corner tiles out from the middle each way), and he can't be hurt but in a quadrant
    // whose shadow is dead (his middle inside tiles clear of the lines between them). Only one's
    // to be dispelled: once one's struck the rest are shielded (struckMessage) till they're
    // restored at the next share. One timer runs for them all: every flood seconds
    // (warned warn seconds ahead) each quadrant whose shadow's still up floods, for damage (a
    // share of your hitpoints) and its element.
    shadows: {
        at: number[];
        enemyId: string;
        inside: number;
        hpShare: number;
        corner: number;
        flood: number;
        warn: number;
        damage: number;
        message: string;
        warnMessage: string;
        floodMessage: string;
        endMessage: string;
        struckMessage: string;
    };
    // His final stand (the form he rises as, BossDef.rises): in a corner, out of reach, he sends
    // Unstable Orbs straight across the floor every `every` seconds (quicker with the path level),
    // and goes to another corner once he's lost moveAfter of his hitpoints there (more for a party)
    // or after moveSeconds
    unstable?: {
        every: number;
        least: number;
        speed: number;
        moveAfter: number;
        moveSeconds: number;
    };
};

// A while a boss can't be hurt and does only some of its attacks (BossDef.shadowRealm, exhumes,
// yellows). It picks among them at random, whatever their range, cooldown or enraged, so an
// attack named here is used as it is (Sotetseg's faster maze, before he's enraged). It lasts
// seconds at the most.
export type BossOrdealDef = {
    at: number[];
    seconds: number;
    attacks: string[];
    interval: number;
    // Used once as it begins, before any of attacks: an exhumes' marks laid all at once (the
    // Champion of Scabaras's nests), rather than coming among them
    opener?: string;
    message: string;
    endMessage: string;
};

// A boss's corpse flowers: lines cross near the player, and the quarters but
// one hurt them every interval seconds for seconds, healing the boss
export type QuartersDef = {
    seconds: number;
    interval: number;
    // While the flowers stand the boss stays put and uses only these of its
    // attacks (by name, cooldowns or not), one every interval seconds
    during?: { attacks: string[]; interval: number };
    // How much of its shield the boss gets back for each hit
    heal: number;
    // Tiles from the player the lines cross at most, and how far apart the
    // flowers along them stand
    offset: number;
    spacing: number;
    // Scenery for the flowers: on the lines of the safe quarter, and elsewhere
    safeLocId: number;
    hurtLocId: number;
};

export type BossAttackDef = {
    name: string;
    // Akkha's: its hit brings the element of the quadrant it lands in (AkkhaDef.elements)
    elemental?: boolean;
    // A glow under it as it winds up, on each spot it'll land (on the boss when it has none),
    // growing as the hit comes. Only drawn, on a map with lighting.
    light?: LightLook;
    // Only on a raid's expert mode
    expert?: boolean;
    // swing: hits around the boss once the windup is done (step away to dodge);
    // projectile: fired where the player stands, so moving dodges it;
    // blast: lands on the spot the player stood on when it was cast;
    // teleport: the boss blinks away to somewhere else near the player;
    // summon: calls in enemies around the boss;
    // pattern: fires BulletPatternDef's volleys;
    // ground: marks the ground, GroundPatternDef;
    // quarters: QuartersDef's flowers split the arena;
    // surge: goes to the arena's edge in line with the player, then charges
    // right across it, hitting what's in its lane;
    // mark: lands effect or parasite on the player, however far they run;
    // tether: a beam to its partner for a while (tether)
    kind:
        | "swing"
        | "projectile"
        | "blast"
        | "teleport"
        | "summon"
        | "pattern"
        | "ground"
        | "quarters"
        | "surge"
        | "mark"
        | "tether";
    // Out of the player's 25 base hitpoints; the biggest hits take about half
    damage: number;
    // Seconds the boss stands winding up (and animating) before it lands
    windup: number;
    // What it does to the map's floor (MapDef.floor) as it starts, aimed at the player it's after
    // (Sim.floorAct): drop the tile under them, start a pattern, change phase
    floor?: FloorActionDef;
    // Seconds before this attack can be used again, on top of the boss's
    // attack interval
    cooldown: number;
    // Used when the player is between minRange and range tiles away
    range: number;
    minRange?: number;
    // Relative chance of picking this attack among the ones in range
    weight: number;
    // Swings and blasts: tiles around the boss (or the spot) they hit.
    // Teleports: how far from the player the boss lands.
    // Surges: tiles either side of the lane's middle.
    // Projectiles: each one's hit radius (0.35 tiles unless set).
    radius?: number;
    // Swings: hits only a wedge this many radians across, in the way the boss
    // faced as it began, and under the boss (around it, underRadius tiles).
    // coneAlpha: how much more solid its wedge and the circle under the boss are drawn: a big
    // one over bright ground, or in a dark room, wants to be plainer. Set at all (even to 1),
    // both are drawn at full strength as a lunge's strip is, not as faint as other warnings,
    // and then multiplied by it; unset, they're as faint as the rest (BossFightView.drawCone)
    cone?: number;
    coneAlpha?: number;
    underRadius?: number;
    // Projectiles: tiles per second, how many (fanned out by spread radians),
    // and how fast they turn towards the player (radians per second).
    // Blasts: how many land (the first on the player, the rest scattered up
    // to spread tiles around them).
    speed?: number;
    count?: number;
    spread?: number;
    homing?: number;
    // Shown on the boss as it's used (where it leaves, for a teleport), in
    // flight, and where it hits (where it arrives)
    castSpotAnim?: number;
    spotAnim?: number;
    impactSpotAnim?: number;
    // Summons: what comes, and how many.
    // beside: they turn up by the player rather than the boss.
    // holds: the player can't move until they're dead or this many seconds
    // have gone, and the boss holds off whatever they couldn't step out of.
    // walkTo: they turn up around the boss, distance tiles out, and walk to
    // it. Those that get there are absorbed: when the last is dead or
    // absorbed, a blast no one can dodge hits for damage, plus perAbsorbed
    // for each one. (The Nightmare's Sleepwalkers.)
    // scatter: they turn up at random, as far off as a wave's enemies do, and
    // come for the player (Phosani's husks, which hold once they arrive).
    // distance: tiles from the boss (or the player, with beside) they turn up,
    // in a ring, instead of right by them (Phosani's rooted husks).
    // thrown: they fly out of the boss to spots about distance tiles off in
    // random directions, over seconds, and can't be hit until they land; what
    // hatches counts its time from landing (Phosani's eggs, to be chased down).
    summon?: {
        enemyId: string;
        count: number;
        // Comes with them, one of it (a Husk of each kind)
        alsoId?: string;
        beside?: boolean;
        scatter?: boolean;
        distance?: number;
        thrown?: { seconds: number };
        holds?: number;
        walkTo?: { distance: number; perAbsorbed: number };
        // Each makes for the nearest closed sarcophagus of the Tombs boss's arena, and opens it
        // if it gets there (Ba-Ba's baboons: Sim.stepSeeker)
        sarcophagi?: boolean;
    };
    // A mark on the player, bursting after seconds for damage (and the attack's
    // hit damage does nothing), leaving enemyId behind. An antidote keeping
    // poison off halves the hit, and leaves weakEnemyId instead. (The
    // Nightmare's parasites.)
    parasite?: { seconds: number; enemyId: string; weakEnemyId: string };
    pattern?: BulletPatternDef;
    ground?: GroundPatternDef;
    quarters?: QuartersDef;
    // Boss animation while winding it up (the boss's attackSeq when unset)
    seq?: number;
    // Seconds into seq that its blow falls: seq's timed to land as the attack does, held on its
    // first frame (the blow drawn back) until then, so what it's seen to do is what hits (his
    // lunge's slash, his slam)
    strikeAt?: number;
    // Cache sound effects as it starts winding up, when it's used and when it
    // hits
    windupSound?: number;
    sound?: number;
    hitSound?: number;
    effect?: PlayerEffectDef;
    // Armour doesn't soak any of it (Verac's flail hits through defences)
    ignoreArmor?: boolean;
    // Blasts: the boss jumps onto the spot the player stood on, landing as it
    // hits (one of several, the first)
    leap?: boolean;
    // Used again this many more times straight after, each wound up for
    // windup seconds, before the boss's usual interval: dashes back to back,
    // claws again and again. A surge's lane and a ground attack's spots are
    // picked afresh each time.
    chain?: { times: number; windup: number };
    // Another of the boss's attacks, by name, begins delay seconds after this
    // one's fired, before anything else and whatever's still in the air: slow
    // rings and then an aimed barrage, a fan that parts round the player and
    // then a claw where they stand
    follow?: { attack: string; delay: number };
    // The boss leaps to the middle of the arena as it begins (castSpotAnim
    // where it left), and a quarters attack's lines cross there
    toMiddle?: boolean;
    // Only used once the boss is enraged
    enraged?: boolean;
    // Only used in its boss's shadow realm, exhumes or yellows (BossDef), never picked otherwise
    ordeal?: boolean;
    // The Tombs of Amascut: with this invocation on, the attack's that much bigger, quicker or
    // harder (Boulderdash's boulders twice as fast, Shaking Things Up's wider shockwave)
    // (count: a summon's more of them; speed: a pattern's bullets, or a surge's charge; times:
    // that many more links of its chain, Acceleration's second charge)
    invoked?: {
        id: string;
        speed?: number;
        radius?: number;
        damage?: number;
        count?: number;
        times?: number;
    };
    // The Wardens: not used while the obelisk's special strikes, nor within this many seconds of
    // one landing (Entomb's hold under its beam was a hit nobody could help)
    clearOfObelisk?: number;
    // Blasts: each one breaks up where it lands into count shards flying out all round (drawn as
    // the attack's spotAnim), each doing damage (Ba-Ba's rockfall)
    // (scale: drawn that much bigger than they hit, to be seen)
    shards?: {
        count: number;
        speed: number;
        range: number;
        radius: number;
        damage: number;
        scale?: number;
        // Drawn as this spot animation rather than the attack's own (the rock that falls is too
        // small and dark to dodge the pieces of), and lit up this much against dark ground (0 to 1)
        spotAnim?: number;
        bright?: number;
        // Drawn as this enemy's model, playing its walk, as BulletPatternDef.look
        look?: string;
    };
    // Blasts: what lands, drawn falling into each circle from height tiles up over the windup,
    // as this enemy's model playing its walk (Ba-Ba's boulder, spinning), scale times its size
    falls?: { look: string; height: number; scale: number };
    // Blasts: marked by a shadow on the floor rather than a red circle, with this spot animation
    // played at each spot over the windup (the debris coming down ahead of Ba-Ba's boulder)
    shadow?: { debrisSpotAnim?: number };
    // Blasts: landing this many tiles from the player, never on them, on ground they can get to
    beside?: { min: number; max: number };
    // Blasts: each leaves a rock where it landed, radius tiles across and solid, for seconds,
    // drawn as one of these enemies' models (Ba-Ba's boulder: what to take cover by)
    leavesCover?: { seconds: number; radius: number; looks: string[] };
    // Lands on everyone not within reach of a rock left by leavesCover, for this share of their
    // most hitpoints, armour or not (Ba-Ba's avalanche, after her boulder)
    takeCover?: { reach: number; share: number };
    // Only used in these of the boss's phases (BossDef.phases), counting from 1
    phases?: number[];
    // The Tombs: only used with this invocation on (Feeling Special's tracked lunge)
    onlyWith?: string;
    // Said over the boss's head when it's used, like OSRS overhead chat
    shout?: string;
    // A message on screen when it's used, for attacks the player has to do
    // something about: an instruction, shown the first time it's used in a run, one after
    // another with a quieter boss's (GameClient.showInstruction), so it's for what to do, not a
    // warning each cast (the attack's own telegraph is that)
    message?: string;
    // Blasts: each one leaves a pool that lasts seconds, hurting a player
    // standing in it every interval seconds, with effect if it's set (Slash
    // Bash's bile). radius is the pool's; damage is like the attack's.
    pool?: {
        seconds: number;
        radius: number;
        damage: number;
        interval: number;
        effect?: PlayerEffectDef;
        // Scenery it's drawn as, spread to its radius
        locId: number;
    };
    // Blasts: the last of the spots each bring one of these enemies, unless
    // the boss still has that kind up; they drop nothing (the Mimic's red,
    // green and blue candies bring its Third Age minions)
    candies?: string[];
    // Blasts: the spot animation of each spot in turn in place of
    // impactSpotAnim (each candy's colour)
    impactSpotAnims?: number[];
    // Stopped by the boss's glyph (BossDef.glyph): a swing or blast lands
    // on the player only if the glyph isn't between them and the boss, and
    // projectiles break on it, so the player can hide behind it.
    blockable?: boolean;
    // Swings: a straight strip from the boss, width tiles across and length long,
    // the way it faced as it began, rather than round it (a lunge)
    // dash: the boss goes that far along it as it lands, stopping short at anything in its
    // way, and stunned if that's one of the map's pillars (BossDef.guard); a rock left by
    // leavesCover only stops it short (a surge's stopped and stunned by such a rock)
    // track: for this many seconds of its windup the strip turns after the nearest player (no
    // quicker than LINE_TRACK_TURN), then it's locked: a step taken too soon is followed
    line?: { width: number; length: number; dash?: number; track?: number };
    // A miss (no one's hit) leaves its guard down for this many seconds (BossDef.guard): a swing
    // or blast, a wave or boomerang that reached no one, a surge that crossed without hitting
    // anyone, a ground mark that landed on no one
    opens?: number;
    // A spell it channels (BossDef.guard): its guard's down from the moment it begins until it's
    // cast (a summon's walkTo: until its walkers are all in or dead), and the fight's button
    // landing on it meanwhile breaks it: nothing's cast (walkers scatter, no blast), and its
    // guard stays down stagger seconds more, with broken on screen (the Scarab Mages')
    channel?: { stagger: number; broken?: string };
    // Swings: hits only beyond this many tiles from the boss, so the shelter's at its feet (the
    // elder's sandstorm over the whole room)
    outside?: number;
    // Its arena's attack that hurts the boss too, if it's caught in it: a bolt that
    // reaches it (and stops there), a cell struck under its middle, a thrown sword through
    // it (once each way), for damage, stunning it (BossDef.guard) with stun
    turns?: { damage: number; stun?: boolean };
    // What it throws up as it lands (ImpactDef): round the boss, or a lunge's at the end of
    // its strip, with its trail along it; a ground attack's at each mark, a blast's on each spot
    impact?: ImpactDef;
    // Blasts: a square this many tiles across on each spot (on the middle of its
    // tile for an odd size), rather than radius round it; impactSpotAnim on every
    // tile of it
    square?: number;
    // Projectiles: a wave along the ground rather than a shot: it goes on through
    // whoever it hits (each once) for reach tiles, along where they were as it
    // began (as a boomerang does), not where they are as it's fired
    wave?: { reach: number };
    // Projectiles: out reach tiles the way they're thrown, then back the way they
    // came to where they were thrown from, hitting each player once each way; at
    // the end catchSeq on the statue that threw it (statues) and catchSound
    // toEdge: out to where its line leaves the bossArena instead (a knight's sword thrown right
    // across the court, to its far side), never less than reach
    boomerang?: { reach: number; toEdge?: boolean; catchSeq?: number; catchSound?: number };
    // Its spotAnim turned this much more (RS yaw units) than the way it's going: a model that
    // faces back along its way (his shock wave's)
    spotYaw?: number;
    // Projectiles: thrown from count of the map's knight statues (ArenaFeatures.knights),
    // picked at random as it begins, at where the player was then, not from the boss
    from?: "knights";
    // Projectiles and bullets: drawn as this enemy (its NPC, playing its idleSeq),
    // never spawned, rather than as spotAnim (the knights' spinning sword)
    lookId?: string;
    // Whoever it hits: dragged to pull tiles from the boss (just clear of it at the
    // nearest) over pullSeconds (0.25
    // when unset), held there for bind seconds, and the boss straight on with
    // attack (by name) on them, whatever it was winding up (a shock wave that binds,
    // then a flurry)
    onHit?: { pull?: number; pullSeconds?: number; bind?: number; attack?: string };
    // Swings: whoever's out of its sight behind a pillar of the map's (ArenaFeatures.pillars)
    // is spared (inShadow in core/arena.ts). While it winds up, the arena's lit and the
    // pillars' shadows are drawn on the floor, soft-edged (BossFightView.drawGazeShadows).
    cover?: boolean;
    // The map's statues it's done with, drawn by the fight (the map leaves their
    // model out): its own (a row attack's rows', the knights that throw) or all
    // of ArenaFeatures.statues' group. windupSeq plays from its beginning till it's
    // fired (a pattern's delay too), then seq.
    statues?: { locId: number; group?: string; windupSeq?: number; seq?: number };
    // An ambient that's a rhythm, not attacks (BossPhasesDef ambients): every row
    // of the map's fires (ArenaFeatures.fires), each stagger seconds behind the
    // last, warns for warn seconds, burns for burn (hurting whoever's on it,
    // once every interval) and goes out for out, every period seconds, from the
    // first phase it's in until the fight's over or a phase leaves it out. Drawn
    // as locId playing seqs at each row; sound as each starts to burn.
    // A beam from the boss to the nearest living partner (by enemy id) for seconds, swinging as
    // they move: after warn seconds it hurts whoever's within width / 2 of it for the attack's
    // damage, each of them once every interval (the Scarab Mages' sand). Drawn as spotAnim laid
    // along it. Used as it lands, or as an ambient (BossPhasesDef ambients).
    tether?: { partner: string; width: number; seconds: number; interval: number; warn: number };
    cycle?: {
        period: number;
        stagger: number;
        warn: number;
        burn: number;
        out: number;
        interval: number;
        locId: number;
        seqs: { warn: number; burn: number; out: number };
    };
};

// A fight's own button (MapDef.fight.ability): Space, a pad's bottom face button or the
// touch screen's, once every cooldown seconds. It hits the boss for damage, with impact on it,
// as long as the boss's middle is within reach tiles of the player's; out of reach it does
// nothing and costs nothing. With two final bosses up (the Scarab Mages) it hits either, one
// with its guard down first, then the nearer, and breaks a spell it's channelling
// (BossAttackDef.channel). The player plays playerSeq (one of their weapons' own, so it's
// baked) as it goes, with sound; iconObjId is its button. The Tombs of Amascut carry one too
// (TombsDef.ability), played with your own character.
export type FightAbilityDef = {
    id: string;
    name: string;
    damage: number;
    // Hits for this share of the boss's max hitpoints instead of damage, with none of the hero's
    // bonuses to damage (so it scales with the raid level and the party, as the boss does)
    damageShare?: number;
    reach: number;
    // Its reach while the boss's guard is down (BossDef.guard), when it's worth most
    openReach?: number;
    cooldown: number;
    iconObjId: number;
    impact?: ImpactDef;
    sound?: number;
    playerSeq?: number;
    // Coaches the player (AbilityButton): early in a fight, until it's used, a hint says what it's
    // for, and while the guard's down it pulses with a tag saying so. The Tombs' and their quest's.
    guide?: boolean;
};

// A spot animation an impact shows, scaled so its model's radius is fit tiles when that's set
export type ImpactSpotDef = { spotAnim: number; fit?: number };

// What a hit throws up, for show: spots where it lands (each played out once), trail laid
// along the way it went every TRAIL_GAP tiles and turned along it (a lunge's strip), and the
// camera's shake, from 0 to 1 (a player who's asked for less motion gets none). flash: the
// screen flashes this colour, faintly.
export type ImpactDef = {
    spots?: ImpactSpotDef[];
    trail?: ImpactSpotDef;
    shake?: number;
    flash?: string;
};

// An enemy that copies a boss's lunges (EnemyDef.echoes)
export type EchoDef = {
    // The boss it copies (an enemy id), and which of its line swings, by name
    boss: string;
    attacks: string[];
    // What its copy's called (what hit, in the sims and the run's report), and its damage in
    // place of the boss's
    name: string;
    damage: number;
    // Its own animation as it winds up (baked with its model), timed so its blow falls as it
    // lands (strikeAt, as BossAttackDef's)
    seq: number;
    strikeAt?: number;
    // Seconds more windup than the boss's own, so the two strips land a beat apart
    later?: number;
    // What its copy throws up in place of the boss attack's impact: a trail down its strip,
    // spots where it stops
    impact?: ImpactDef;
    // Only so many copy each attack, the nearest the hero first (all of them when unset)
    most?: number;
    // Its strip this long, in place of the boss's (a crocodile's snap is shorter than his jaws)
    length?: number;
    // It stays where it stands, not dashing down its strip as the boss's lunge does (Akkha's
    // shadows, which are stationary)
    noDash?: boolean;
};

// A boss whose guard drops (Justiciar Zachariah's). An attack with `opens` that misses everyone
// leaves it exposed for that many seconds: it fights on, but takes `damage` times every hit. Its
// arena's own attacks that catch it (an attack's `turns`) and a lunge that ends in a pillar
// (BossAttackDef line.dash) stun it for stun seconds: exposed, and doing nothing at all, with
// stunSpotAnim over its head (stunHeight tiles up). A strike that only reaches so far
// (MapDef.fight.strikeReach) fires at once as its guard drops, for whoever's in reach.
export type BossGuardDef = {
    damage: number;
    stun: number;
    // While it's down, its prayer (EnemyDef.protects) holds against nothing: Akkha's, so a hero
    // whose style his form prays against gets at him through a missed lunge or leap
    pierce?: boolean;
    stunSpotAnim?: number;
    stunHeight?: number;
    // Played as it's stunned, and as it's exposed
    stunSound?: number;
    exposeSound?: number;
    // A lunge stuck in a pillar: what's thrown up where it's struck
    stuck?: ImpactDef;
    // For this long after a stun's over, it can't be stunned again: what would have stunned it
    // only drops its guard, and it shrugs it off with resisted round it
    stunGrace?: number;
    resisted?: ImpactDef;
    // Said over it as it shrugs one off
    resistShout?: string;
};

// A big entrance: the player can't be hit, the screen goes dark, and everything
// else stops attacking and runs for the nearest edge of the map and is gone.
// The boss rises partway through, and the fight starts when it's over.
export type BossIntroDef = {
    // How long it all takes, and how far in the boss rises
    seconds: number;
    riseAt: number;
    // Its animation as it rises (its idle when unset), and shown where it does
    seq?: number;
    spotAnim?: number;
    sound?: number;
    // On the screen as it rises
    title: string;
    subtitle?: string;
    // Played as the screen goes dark
    darkSound?: number;
    // Tiles from the player it rises, towards the arena's middle
    distance: number;
    // No waves or events until it's dead: it's the two of them
    alone?: boolean;
    // It rises at the middle of the map's bossArena, with the player brought
    // to distance tiles south of it (a party side by side), rather than beside
    // wherever they are (Phosani's Nightmare, in her square)
    atMiddle?: boolean;
    // The player can't move until it's over: they stand and watch it rise, and with faces,
    // turned to it whatever they press (else they can turn)
    holds?: boolean;
    faces?: boolean;
    // The camera's on it as it rises, and from seconds into the intro takes
    // over seconds to come back to the player
    pan?: { from: number; over: number };
    // What's thrown up as it lands, landAt seconds after it rises (ImpactDef)
    land?: ImpactDef;
    landAt?: number;
};

// A pattern a boss keeps up by itself (BossPhasesDef ambient): the attack,
// by name, and seconds between one beginning and the next. A ground attack
// (its marks) or a cycle (BossAttackDef.cycle, which runs on its own rhythm and
// ignores interval) can be one too. delay: seconds into the phase it first
// begins (0 when unset).
export type BossAmbientDef = { attack: string; interval: number; delay?: number };

// A boss fought in phases: a shield to break, then totems in the arena's
// corners to charge with hits, whose blast takes away a share of its
// hitpoints, which nothing else can touch. The last blast ends it.
export type BossPhasesDef = {
    // One a phase. shield: of its hitpoints. opener: the attack (by name) it
    // begins with, before anything else. ambient: an attack of its (a
    // pattern, by name) it keeps up the whole phase on its own timer, begun
    // again every interval seconds under whatever else it's doing, through
    // holds and cooldowns: the floor the fight's dodged on. tempo multiplies
    // its interval between attacks and its patterns' windups (not the big
    // hits'), and speed its walk, so each phase is a gear up on the last.
    // Without totems there's no shield: until is the share of its hitpoints at which
    // the next phase begins (an even split when unset), and hits go to its
    // hitpoints. status: the boss bar's line through the phase (the Nightmare's own
    // when unset), and message: on screen as it begins (status when unset).
    // ambients: more of what ambient is, each on its own timer (or a cycle,
    // BossAttackDef.cycle, running the whole phase).
    phases: {
        shield?: number;
        until?: number;
        status?: string;
        message?: string;
        opener?: string;
        ambient?: BossAmbientDef;
        ambients?: BossAmbientDef[];
        tempo?: number;
        speed?: number;
        // The scene's ambient through this phase (LightingDef), faded to over a couple of seconds
        // and back as the boss falls: an enrage that darkens the arena
        light?: number;
    }[];
    // After the last blast (or, without totems, at no hitpoints left) it stands for seconds more
    // before it falls, using only these attacks (by name) interval seconds apart, opener first,
    // with ambient (a pattern) under them, and can't be hurt meanwhile: a last stand to live
    // through (Phosani's desperation phase, the Menaphite Akh's). Without it, it falls there.
    // shout: over it as it begins.
    finale?: {
        seconds: number;
        attacks: string[];
        interval: number;
        opener?: string;
        ambient?: BossAmbientDef;
        message: string;
        shout?: string;
    };
    // shields: a phase a shield broken (Kephri's, KephriDef), as she's back behind the next,
    // not by her hitpoints (until is ignored); the form she rises into for her last keeps the last
    by?: "shields";
    // Without them, the phases go by its hitpoints (phases' until), each change a
    // pause (threshold), and it dies at none, as anything does
    totems?: {
        // The enemies: stands idle, can be charged, and is charged
        idleId: string;
        chargingId: string;
        chargedId: string;
        // Each stands turned to the arena's middle: this is added to that yaw
        // for a model whose mark isn't on its front (The Nightmare's totems'
        // scroll hangs three-quarters of the way round)
        yawOffset?: number;
        // Charge each needs, of the boss's hitpoints
        charge: number;
        // Tiles in from the arena's corners
        margin: number;
        // Shown on the boss, and played, as they fire; played as one's charged
        blastSpotAnim?: number;
        blastSound?: number;
        chargedSound?: number;
    };
    shieldMessage: string;
    blastMessage: string;
    // Of the player's hitpoints, given back by each blast
    blastHeal?: number;
    // Without totems, at each phase's hitpoints: for seconds it can't be hurt and
    // does nothing of its own but seq (it kneels), riseSeq for its last
    // riseSeconds (it gets up), with shout over it, sound and spotAnim on it
    // impact as it goes down, riseImpact as it's up and into the next phase (ImpactDef)
    threshold?: {
        seconds: number;
        seq?: number;
        riseSeq?: number;
        riseSeconds?: number;
        shout?: string;
        sound?: number;
        spotAnim?: number;
        impact?: ImpactDef;
        riseImpact?: ImpactDef;
    };
    // Without totems: the boss bar shows each phase's share of its hitpoints as a full bar of
    // its own, filling again as the next begins, rather than one bar with the thresholds on it
    barPerPhase?: boolean;
    // The player kept in the map's bossArena while it's up (the Nightmare's
    // square); false lets them out of it, onto the rest of an arena its collision
    // keeps them in (a court with a bridge off it)
    confine?: boolean;
};

// How a boss fights, after the real fight in OSRS
export type BossDef = {
    // Seconds between attacks
    attackInterval: number;
    attacks: BossAttackDef[];
    // Ranged bosses stop this many tiles away, and big ones far enough off not
    // to stand over you; other melee ones walk up
    keepDistance?: number;
    // Standing under it hurts every interval seconds for damage, then a
    // damage more each time, up to max; stepping out starts it over (the
    // Mimic's stomp). The first comes first seconds after stepping under (interval without it),
    // each marked by a ring filling at its feet (GameView), and message is said the first time
    // one lands in the fight.
    stomp?: {
        radius: number;
        interval: number;
        damage: number;
        max: number;
        sound?: number;
        first?: number;
        message?: string;
    };
    // Dharok's set effect: hits get stronger as he loses hitpoints, up to
    // this much more at none left (1 = double)
    wretched?: number;
    // The Tombs: from raid level `from` up, its hitpoints are multiplied by hp, its hits (and its
    // poison, and Akkha's hits that take a share) by damage and the seconds between its phases'
    // ambients by ambients (over one, slower), on top of the raid level's scale. For a boss the
    // raid level's scale makes a wall from there: it eases off there and nowhere below.
    raidEase?: { from: number; hp?: number; damage?: number; ambients?: number };
    // Vampyres heal this many hitpoints for each one they hit the player for
    lifesteal?: number;
    // Gets back up this many times, with this fraction of its hitpoints (a
    // vampyre doesn't stay down without a stake). into: the enemy it gets up
    // as, looks and attacks and all (the Kalphite Queen's second form).
    rises?: { times: number; hp: number; message: string; into?: string };
    // Every boss is enraged at half its hitpoints (or at, a share of them): it attacks and moves
    // faster, and uses its enraged attacks too. What it says when it is.
    // partner: when a boss with one of these ids dies, it's enraged at once (if it's up), with
    // shout and message, its interval times tempo rather than the usual enraged one (the Scarab
    // Mages: kill one and the other's furious)
    enrage: {
        message: string;
        shout?: string;
        at?: number;
        partner?: { ids: string[]; shout?: string; message?: string; tempo?: number };
    };
    // Calls in enemies around itself as its hitpoints drop to each fraction
    // (Kree'arra's bodyguards); a form it gets up as (rises.into)
    // calls in its own as it's hurt in turn (Nex's bodyguards)
    summonsAt?: {
        hp: number;
        enemyId: string;
        count: number;
        // Tiles from the boss they come on (2 unless set): far enough to crawl, for healers
        distance?: number;
        message?: string;
        shout?: string;
    }[];
    // A shield that slides back and forth between the boss and the player,
    // which its blockable attacks can't get through (like TzKal-Zuk's
    // ancestral glyph in OSRS). Its line is distance tiles from the boss towards where the
    // player was when the boss turned up, across that way, halfLength tiles
    // either side; it moves along it at speed tiles a second, and blocks
    // width tiles either side of its middle.
    glyph?: {
        // The enemy it looks like (an NPC that's never spawned)
        lookId: string;
        distance: number;
        halfLength: number;
        speed: number;
        width: number;
    };
    intro?: BossIntroDef;
    phases?: BossPhasesDef;
    // Seconds after one of its bullets hits a player before another can (a
    // second when unset): what a bullet hell's worth of petals can do to
    // someone stood in them
    bulletGrace?: number;
    // The most of each of its hits the player's armour can take off, as a share of the hit (all
    // of it, down to 1, when unset): the Theatre's bosses, whose many small hits armour would
    // otherwise turn to 1s
    armorCap?: number;
    // A final boss: the run goes on this many seconds after it falls, for its
    // death animation to play before the victory screen, with nothing
    // landing on the players meanwhile (the run's time is to the fall)
    fallSeconds?: number;
    // On a raid's expert mode, once enraged, it stares one way every `every` seconds, a quarter
    // turn at a time: a weapon's hit from within arc radians of that way does nothing to it and
    // hurts its wielder for damage instead, a hit every half second at most (Xarpus)
    // warning: seconds it shows where it'll stare before it does (0.75); hitEvery: seconds
    // between its hits back on one player (1)
    stare?: {
        every: number;
        arc: number;
        damage: number;
        message: string;
        warning?: number;
        hitEvery?: number;
    };
    // On a raid's expert mode, it changes into the next of these forms every `every` seconds,
    // keeping its hitpoints (Nylocas Vasilias's colours: each takes one style, EnemyDef.onlyStyle).
    // With offStyle it changes on normal too, where any other style does that share of its damage
    // (none on expert), on top of its prayer (EnemyDef.protects); its own style gets through its
    // prayer for ownStyle instead (1 unless set).
    colours?: { every: number; forms: string[]; offStyle?: number; ownStyle?: number };
    // Sotetseg's shadow realm: at each of these shares of his hitpoints he drags you into it for
    // seconds, where he can't be hurt and does only these attacks (by name), interval apart
    shadowRealm?: BossOrdealDef;
    // Xarpus's exhumeds: at each of these shares of his hitpoints he sinks into his pool, can't be
    // hurt, and does only these attacks, one of them raising the exhumeds (a ground attack with
    // GroundPatternDef.smother), until count of them have been smothered, or seconds have gone,
    // when he rises healed leftHeal of his hitpoints for each one still to go (on top of what each
    // exhumed that went unsmothered healed him)
    exhumes?: BossOrdealDef & { count: number; leftHeal: number };
    // Verzik's yellows: at each of these shares of her hitpoints she can't be hurt for seconds, and
    // throws only these, balls that hit hard unless you're in the pool that comes with each one
    yellows?: BossOrdealDef;
    // Akkha's fight (the Tombs of Amascut): his quadrants, his specials and his shadows
    akkha?: AkkhaDef;
    kephri?: KephriDef;
    zebak?: ZebakDef;
    // Ba-Ba's rolling stones (the Tombs of Amascut): at each of these shares of her hitpoints she
    // can't be hurt for seconds, and does only these: boulders rolling across the arena in rows
    rollingStones?: BossOrdealDef;
    // Walks with its guard up, taking awakeDamage of every hit, and every `every` seconds goes
    // down for `seconds`, standing still and taking all of it, then gets up with its `wake` attack
    // (the Pestilent Bloat). seq: its animation while it's down.
    naps?: {
        every: number;
        seconds: number;
        awakeDamage: number;
        wake: string;
        seq: number;
        message: string;
        wakeMessage: string;
    };
    // Further than this from the player, it blinks back to about keep tiles
    // from them (a fight across a big arena stays on the screen). With jump,
    // it plays downSeq for seconds where it is, then upSeq for seconds where
    // it lands, instead of just being there (The Nightmare into the ground
    // and up out of it)
    leash?: {
        distance: number;
        keep: number;
        spotAnim?: number;
        // land: what's thrown up as it comes down, landAt seconds after it's up there
        jump?: {
            downSeq: number;
            upSeq: number;
            seconds: number;
            land?: ImpactDef;
            landAt?: number;
        };
    };
    // Its animation as it charges (BossAttackDef surge), and as it stands
    // winding one up
    surgeSeq?: number;
    // How its fight looks, where it isn't the Nightmare's (BossLookDef)
    look?: BossLookDef;
    // Its guard drops after a miss, and its arena can stun it (BossGuardDef)
    guard?: BossGuardDef;
};

// The shared fight screen's colours (CSS), for a boss that isn't to look like the
// Nightmare: each unset is hers. edge: the stroke round the bossArena while it's
// up, or none (a court whose edges are drops). vignette: the dim round the
// screen's edges while it's up, or none. dark: its entrance's dark (r, g, b).
// lean: the camera leans towards it, so a boss north of the player stays on the
// screen (a raid's boss rooms lean only as far as keeps theirs below the boss bar).
export type BossLookDef = {
    // A light on it while its guard's down (Sim.isExposed): a core lit up. Only drawn, on a map
    // with lighting.
    exposedLight?: LightLook;
    lean?: boolean;
    title?: string;
    subtitle?: string;
    edge?: string | null;
    vignette?: string | null;
    dark?: [number, number, number];
};

// A statue a fight draws, and animates (BossAttackDef.statues), in world tiles:
// its south-west tile, how many tiles across, and how the map turns it (rotation, 0 to 3).
export type ArenaStatue = { x: number; y: number; size?: number; rotation?: number };

// What a boss's attacks read from the arena (MapDef.features), in world tiles: a
// ScapeRune recipe exports it map-local, and the MapDef moves it to the world
// with moveFeatures. A tile x, y is the square from x to x + 1.
export type ArenaFeatures = {
    // Cells of cell tiles from x0, y0, cols by rows; a cell's colour is (cx + cy) % 2
    checker?: { x0: number; y0: number; cell: number; cols: number; rows: number };
    // Square, size tiles across from their south-west tile: they block bolts
    // (BulletPatternDef.pillars) and a boss's sight (BossAttackDef.cover)
    pillars?: { x: number; y: number; size: number }[];
    // Rows bolts fly along, tile row y, from tile fromX to tile toX (dir: the sign
    // of the way), and the statues that fire them
    bolts?: { y: number; fromX: number; toX: number; dir: 1 | -1; statues: ArenaStatue[] }[];
    // The knight statues (BossAttackDef.from): thrown from their middles
    knights?: ArenaStatue[];
    // Rows of fire jets (BossAttackDef.cycle): tile row y, tiles x0 to x1, the
    // jet's loc drawn at the middle turned as the map turns locs (rotation)
    fires?: { y: number; x0: number; x1: number; rotation?: number }[];
    // Scenery hazards shouldn't land on
    dais?: { x: number; y: number; w: number; h: number };
    // Where a boss rising atMiddle (BossIntroDef) rises instead of the bossArena's
    // middle, the party distance tiles south of it (tile middles: x + 0.5)
    rise?: { x: number; y: number };
    // Other statues an attack animates, by group (BossAttackDef.statues group)
    statues?: Record<string, ArenaStatue[]>;
};

// How a character fights, for the weapons only their class can find
export type CombatStyle = "melee" | "ranged" | "magic";

// sweep: hits everything in an arc in front (a scythe or a two-handed sword);
// axes: thrown at the nearest enemies, bouncing on from each to the next;
// orbit: circles the player for a while, hitting what it passes
export type WeaponKind =
    | "slash"
    | "sweep"
    | "missile"
    | "knives"
    | "axes"
    | "aura"
    | "strike"
    | "orbit";

export type WeaponLevel = {
    damage: number;
    // Seconds between uses
    cooldown: number;
    // Projectiles / targets / directions per use
    amount: number;
    // Tiles: slash or sweep reach, aura radius, strike or blast radius, how
    // far from the player an orbit circles
    area: number;
    // Sweeps: half the angle they cover, radians
    arc?: number;
    // Enemies a projectile passes through
    pierce: number;
    // Thrown axes: enemies an axe bounces on to after the first it hits
    bounce?: number;
    // Projectile speed, tiles per second (around the circle, for an orbit)
    speed: number;
    // Seconds: freeze length, how long venom lasts, how long an orbit circles
    duration: number;
    // Damage a second that its hits poison for, for duration seconds (the
    // Toxic blowpipe's venom; projectiles and auras)
    venom?: number;
    // Tiles pushed back per hit
    knockback: number;
    // What this level adds, for the level up screen
    description: string;
    // Item shown in the player's hand at this level
    objId?: number;
    // Item drawn in flight instead of a spot animation (bolts, or the atlatl's darts).
    // Knives default to the held item when this isn't set.
    projectileObjId?: number;
    // Sounds at this level, overriding the weapon's (spells sound different
    // as they upgrade)
    sound?: number;
    hitSound?: number;
    // Spot animations at this level (spells change look as they upgrade)
    projectileSpotAnim?: number;
    impactSpotAnim?: number;
    castSpotAnim?: number;
    name?: string;
};

// How an item is drawn in flight when its cache model needs help, whichever
// weapon throws it (PROJECTILE_ITEM_LOOKS). Drawing only: hit sizes stay as they are.
export type ProjectileItemLook = {
    // Drawn this much bigger, for a model too small to see from the game's camera
    scale?: number;
    // Turned this far (2048 is a full turn), for a model that doesn't point the way it flies
    yawOffset?: number;
};

export type WeaponDef = {
    id: string;
    name: string;
    kind: WeaponKind;
    description: string;
    // Item for the icon and, for thrown weapons, the projectile
    iconObjId: number;
    // Player animation when used (played while standing still)
    playerSeq: number;
    // A frame of playerSeq (its aim) that the upper body takes for a moment
    // after each attack on the move, over the run's legs, while it's the
    // weapon in hand: so a shot can be seen while kiting. One frame, baked
    // over each of the run's, rather than the whole swing over all of them.
    runPose?: number;
    // Cache sound effect when used, and when it hits (-1 for none)
    sound: number;
    hitSound: number;
    levels: WeaponLevel[];
    // How often it's offered on level ups
    rarity: Rarity;
    // Replaces this weapon once it's at max level and the passive is owned
    evolution?: { into: string; requiresPassive: string };
    // Evolved weapons only come from evolution
    evolved?: boolean;
    // Class weapons: only offered to characters who fight this way
    style?: CombatStyle;
    // Weapons of a family (the godswords) share one weapon's chance of being
    // offered, and only one of them is carried
    family?: string;
    // Only comes from a pick (hilts) or an adventurer's start, never a level up's offer
    pickOnly?: boolean;
    // Used in place of every so many attacks (sweeps and slashes)
    special?: SpecialAttackDef;
    // Bosses and elites are hit again for these fractions of the damage (the
    // scythe hits big things three times; sweeps, slashes, projectiles and
    // strikes)
    bigHits?: number[];
    // Auras and strikes: what they hit can't move for the level's duration
    // (bosses shrug it off)
    freezes?: boolean;
    // Strikes: each impact's spot animation is scaled to this many times the
    // strike's radius and played out in full, rather than drawn as it is for
    // a moment (the Nightmare's hands coming up out of the ground)
    impactFit?: number;
    // Auras and strikes: what they hit takes this much more damage from
    // everything for the level's duration (0.2 = +20%; Shadow Burst)
    drain?: number;
    // Multiplies the damage bonus (might) for this weapon's hits (Tumeken's
    // shadow triples it)
    mightScale?: number;
    // Aims at the toughest enemy in range rather than the nearest, and hits
    // harder the more hitpoints the target has, up to this much more (1.5 =
    // +150%) against the toughest (the Twisted bow; missiles only)
    toughTargets?: number;
    // A hit has this chance of healing the player by a fraction of its
    // damage, up to max, with this spot animation on them (the Sanguinesti
    // staff; projectiles, auras and strikes)
    lifesteal?: { chance: number; fraction: number; max: number; spotAnim: number };
    // Orbits: the items circling the player, one for each in turn
    orbitObjIds?: number[];
    // Brought in by a task on a map, like an adventurer; in from the start
    // when unset
    unlock?: UnlockTask;
    // The style its hits count as for style damage bonuses (Rigour, Augury,
    // the rings): its class when it has one, otherwise slashes and sweeps are
    // melee, what's shot or thrown is ranged, and auras, strikes and orbits are
    // magic. Set for the exceptions (the fire spells fly, but they're magic).
    damageStyle?: CombatStyle;
    // Hits enemies with any of these tags this much harder (0.5 = +50%; the
    // Ivandis flail against vampyres and the undead)
    slayer?: { tags: EnemyTag[]; damage: number };
    // Slashes and sweeps: each enemy hit has this chance (tagChance with one of the tags) of a
    // gap in its shell, taking damage times the hit, with spotAnim on it (the Keris partisan of
    // breaching)
    breach?: {
        chance: number;
        tagChance: number;
        tags: EnemyTag[];
        damage: number;
        spotAnim: number;
    };
    // Slashes and sweeps: heals the player this much for each kill a swing of it makes (the Keris
    // partisan of the sun)
    killHeal?: number;
    // Hits this much harder while the player is below this share of their hitpoints (below
    // 0.25, damage 0.25: +25% under a quarter; the Keris partisan of the sun)
    lowHealth?: { below: number; damage: number };
    // Slashes and sweeps: each enemy caught takes these hits, a fraction of
    // the damage each, a moment apart (the Dragon claws' four)
    hits?: number[];
    // Slashes and sweeps: what it hits with one of these tags passes the hit
    // on to up to count more of them within range tiles, for this fraction of
    // its damage, with spotAnim on each (the Blisterwood flail)
    chain?: { tags: EnemyTag[]; count: number; range: number; damage: number; spotAnim: number };
    // Missiles: each shot's first hit splits it into count more, which fly on
    // to the nearest other enemies for this fraction of its damage, passing
    // through pierce more (the Crystal bow)
    split?: { count: number; damage: number; pierce: number };
    // Missiles: each hit has this chance of an enchanted bolt's effect, one
    // picked by weight (the Armadyl crossbow)
    boltProcs?: { chance: number; procs: BoltProcDef[] };
    // Auras: each pulse leaves the ground around the player burning for the
    // level's duration, hurting what stands in it every half second for this
    // fraction of the level's damage (Toktz-mej-tal's obsidian), with flames
    // of locId (scenery, on its own animation) on it. radius: a fraction of
    // the aura's radius.
    burns?: { damage: number; radius: number; locId: number };
    // At this level the player picks one of these weapons to become, at the
    // same level (the godsword's blade takes a hilt): the level up's next
    // choice is the pick, each shown as its hilt
    hilts?: { level: number; into: { weaponId: string; hiltObjId: number }[] };
};

// An enchanted bolt's effect, when the Armadyl crossbow's bolt procs one
export type BoltProcDef = {
    name: string;
    weight: number;
    // Shown on what it hits
    spotAnim: number;
    effect: // Takes this fraction of the target's hitpoints too, up to max
        // times the bolt's damage (ruby bolts' Blood Forfeit)
        | { kind: "hpFraction"; fraction: number; max: number }
        // Hits this much harder and goes on through this many more (diamond
        // bolts' Armour Piercing)
        | { kind: "pierce"; damage: number; pierce: number }
        // Sets it burning: this fraction of the bolt's damage every second for
        // seconds (dragonstone bolts' Dragon's Breath)
        | { kind: "burn"; damage: number; seconds: number };
};

// A godsword's special attack
export type SpecialAttackDef = {
    name: string;
    // Every this many attacks (held back until something is in reach)
    every: number;
    // Multiplies the attack's damage
    damage: number;
    // Player animation, and the spot animation on the player
    playerSeq: number;
    spotAnim: number;
    // Cache sound effect, the weapon's when unset
    sound?: number;
    // Hits everything within this many tiles all round the player (more with
    // area), not just what the swing reaches, with impactSpotAnim on each
    aoe?: { radius: number; impactSpotAnim?: number };
    effect?: // What it hits can't move for a while (bosses shrug it off)
        | { kind: "freeze"; seconds: number }
        // Heals the player by this fraction of the damage dealt, up to max
        | { kind: "heal"; fraction: number; max: number }
        // What it hits takes this much more damage from everything for a while
        // (0.25 = +25%)
        | { kind: "drain"; amount: number; seconds: number }
        // Sets what it hits burning: this fraction of the hit's damage every
        // second for seconds
        | { kind: "burn"; damage: number; seconds: number }
        // Heals the player to full and cures poison and boss drains (Tumeken's Light)
        | { kind: "restore" };
};

export type PassiveDef = {
    id: string;
    name: string;
    description: string;
    stat: StatKey;
    // What a Common pick adds to the stat; rarer picks add more
    perLevel: number;
    // How the stat reads on the level up screen: "+12% damage", "+1.5 armour"
    effect: string;
    unit: "percent" | "flat";
    // Adds exactly perLevel a pick, whatever its rarity (one more projectile)
    whole?: boolean;
    maxLevel: number;
    // How often it's offered on level ups
    rarity: Rarity;
    iconObjId: number;
    // An interface sprite shown for it instead of iconObjId's item (Piety's
    // prayer icon)
    iconSpriteId?: number;
    // Never levelled past maxLevel, even in endless (the Divine rune pouch: one slot)
    noOverlevel?: boolean;
    // Visible gear: the item worn at each level (index = level - 1)
    equipment?: { slot: number; objIds: number[] }[];
    // Stats it adds the same amount to as well (the Ring of wealth's coins,
    // Augury's effect duration)
    alsoAdds?: StatKey[];
    unlock?: UnlockTask;
};

// What brings an adventurer (or a weapon, passive or item) in: beating a map,
// or a task done in a run there
export type UnlockTask =
    // hard: on hard mode (a raid's challenge mode)
    | { kind: "beatMap"; mapId: string; hard?: boolean }
    // Kill this boss in a run on the map
    | { kind: "killBoss"; mapId: string; enemyId: string }
    // Last this many seconds in a run on the map
    | { kind: "survive"; mapId: string; seconds: number }
    // Find this trophy in the raid's chest on the map (trophies.ts says when it can come)
    | { kind: "raidChest"; mapId: string; trophyId: string };

// What a quest asks for, counted over every run since quests came in
export type QuestObjective =
    // This many kills of these enemies between them; what: what they're
    // called ("chickens", "the Crazy archaeologist"), needed for more than one
    | { kind: "kill"; enemyIds: string[]; count: number; what?: string }
    // At least one kill of each of these
    | { kind: "killEach"; enemyIds: string[]; what?: string }
    // This many reward caskets opened
    | { kind: "caskets"; count: number }
    // The map beaten (not endless)
    | { kind: "beatMap"; mapId: string };

export type QuestDef = {
    id: string;
    // An OSRS quest's
    name: string;
    // The map it's done on, for the quest list; none for ones done all over
    mapId?: string;
    objective: QuestObjective;
    // Paid out once, when the run that finishes it ends
    coins: number;
};

export type CharacterDef = {
    id: string;
    name: string;
    description: string;
    // Sets which class weapons they can find
    style: CombatStyle;
    startingWeapon: string;
    // Worn items by equipment slot
    equipment: Partial<Record<number, number>>;
    // Identity kits (hair, jaw, torso, arms, hands, legs, feet) and body
    // colours (hair, torso, legs, feet, skin), when they're not the default
    // look (Durial321's long white hair)
    kits?: number[];
    colors?: number[];
    bonus: Partial<Stats>;
    // A revive of their own (bonus.revival) as the HUD shows it, beside the
    // shop's Ring of life: the Pyromancer's phoenix
    reviveLook?: { name: string; objId: number };
    // Always available when unset
    unlock?: UnlockTask;
    // Played on this map alone (a boss fight's, MapDef.fight.character), and
    // nowhere else: never in the roster, never unlocked, never counted (the
    // Inquisitor, Phosani's)
    only?: string;
};

export type ShopUpgradeDef = {
    id: string;
    // The OSRS skill (or item) the upgrade is themed as
    name: string;
    description: string;
    stat: StatKey;
    perRank: number;
    maxRank: number;
    baseCost: number;
    // The item it's themed as, for one the HUD shows while it lasts (Ring of life)
    objId?: number;
};

export type WaveDef = {
    // Second of the run the wave starts
    start: number;
    enemies: { id: string; weight: number }[];
    // Enemies spawned per second while under maxAlive
    spawnRate: number;
    // Spawned at once to stay above this many alive
    minAlive: number;
    maxAlive: number;
};

export type RunEventDef =
    | { at: number; kind: "elite"; enemyId: string }
    | { at: number; kind: "ring"; enemyId: string; count: number }
    // Mid-run bosses, which drop an elite (or the odd master) casket, and the
    // final boss: killing it wins the run. hp: the boss's hitpoints on this
    // map, when they're not its own.
    // inArena: it turns up inside the map's bossArena, a few tiles from the player, not out past
    // it (the Scarab Mages' elder, while the first's being fought)
    | { at: number; kind: "boss" | "finalBoss"; enemyId: string; hp?: number; inArena?: boolean };

// A place to play: the part of the world a run happens in, what comes at you
// there, and which map it opens up when it's beaten
export type MapDef = {
    id: string;
    name: string;
    description: string;
    // Shown on its card
    iconObjId: number;
    // World tiles: the rectangle collision is built for
    arena: { baseX: number; baseY: number; sizeX: number; sizeY: number };
    // The open square a boss with a fight of its own uses (BossDef.phases: its
    // totems' corners, its surges' lanes), in world tiles; all of the arena
    // when unset
    bossArena?: { baseX: number; baseY: number; size: number };
    // A map beaten before this one opens, whatever else it is (a raid, a boss fight): the Tombs of
    // Amascut behind Beneath Cursed Sands
    requires?: string;
    // A fight in parts, each a run of its own (a quest's bosses one after another, as OSRS's are):
    // a run plays the next part not beaten yet, its events in place of the map's, and the map's
    // beaten once the last is (SaveData.fightStages). cinematic: the part's own, played as its run
    // starts (not on a retry) in place of the map's (MapDef.cinematic): a boss's entrance.
    stages?: {
        name: string;
        events: RunEventDef[];
        victoryText: string;
        cinematic?: CinematicDef;
    }[];
    // What its boss's attacks read from the arena: pillars, rows, statues
    features?: ArenaFeatures;
    // The plane (level) the arena is on: 0, the ground floor, when unset. Some
    // dungeons are higher up (the God Wars Dungeon's main cave is on plane 2);
    // only this plane is drawn, so the ones under it don't show through.
    plane?: number;
    // Where the player starts (moved to the nearest free spot if it's blocked)
    spawn: { x: number; y: number };
    // The way the player faces as the run starts (x east, y north, any length), south when unset:
    // the way an opening cinematic's camera ends looking (MapDef.cinematic)
    spawnFacing?: { x: number; y: number };
    // A ditch two tiles deep, its south row at y, across the arena (the
    // Wilderness Ditch): the player can't cross it, enemies jump it
    ditch?: { y: number };
    // Enemies' hitpoints and damage (bosses' attacks too) on top of their own
    difficulty: { hp: number; damage: number };
    // Every hit on the player here, whatever it's from (attacks, the floor's): multiplied by scale,
    // and through armour as if there were none (Beneath Cursed Sands, which armour bought for the
    // campaign would otherwise make harmless). Poison's ticks stay as they are.
    hits?: { scale: number; throughArmor: boolean };
    // What hard mode multiplies those by here (see hard.ts for when it's unset).
    // More on the early maps, which a player with everything bought walks
    // through, and less on the late ones, which are hard enough already.
    // bullets: what its bosses' patterns' bullets a volley are multiplied by, with their gaps kept
    // as wide (a raid's, and so its expert mode's too)
    hard?: { hp: number; damage: number; bullets?: number };
    waves: WaveDef[];
    events: RunEventDef[];
    // The countdown before the final boss, and the victory title
    finalBossWarning: string;
    victoryText: string;
    // The OSRS music track that loops quietly through a run here, by name:
    // its recording goes in src/media/music, named as GameClient's musicFor
    // says, and until it's there the map plays nothing
    music?: string;
    // Fun maps: endless from the start and outside the unlock chain (see
    // FunMapDef). Campaign maps leave it unset.
    fun?: FunMapDef;
    // For development: a run here leaves the save alone
    dev?: boolean;
    // Ground of our own, from the ScapeRune recipe with this id: the game draws it softer
    // and leaves the world past the arena showing (scaperune/CLAUDE.md)
    scaperune?: boolean;
    // A seasonal event: open from the start, outside the campaign's chain
    seasonal?: boolean;
    // One boss fight and nothing else (Phosani's Nightmare): no waves, no
    // picks and no items, and its final boss rises as the run begins. Outside
    // the campaign's chain like a seasonal map, and open once requires (a map
    // id) has been beaten; it can't be endless. Everyone plays character there,
    // an adventurer made for the fight, whose starting weapon begins at
    // weaponLevel: that's the whole kit, and the fight's balanced to it.
    // strikeReach: tiles a strike (WeaponDef kind strike) finds its targets
    // within, when it isn't the usual 12 (the boss has to be close to be hit)
    // ability: the fight's own button (FightAbilityDef).
    fight?: {
        requires: string;
        character: string;
        weaponLevel: number;
        strikeReach?: number;
        ability?: FightAbilityDef;
        // Gear (items.ts, by id) everyone starts the fight wearing: the kit it's tuned to
        gear?: string[];
        // Played on your own only (a quest's fights): never a co-op room's map
        solo?: boolean;
    };
    // How the map's drawn, 1 as the game is and lower darker
    brightness?: number;
    // A raid: the run's a series of rooms rather than one timeline (see RaidDef). waves and
    // events are then every room's, for what bakes and checks a map's enemies.
    raid?: RaidDef;
    // The Tombs of Amascut (docs/design/tombs-of-amascut.md): a Nexus
    // to start in, with a door to each path, and the invocations' raid level (invocations.ts) in
    // place of hard mode
    tombs?: TombsDef;
    // NPCs that sit on the map as scenery, posed with their own animation (MapPropDef): drawn by
    // the view alone, never in the sim, so they're in no hash. For what a loc can't be: a loc
    // can't play a skeletal animation.
    props?: MapPropDef[];
    // An opening cinematic (CinematicDef), played as a run starts here: the camera on a path of
    // shots, NPCs acting and speaking, then the run's own camera. View only, like props.
    cinematic?: CinematicDef;
    // A floor that fights back (FloorDef): slabs of it rise under the player in waves, and rows of
    // it fall away. A prototype, on a dev map only.
    floor?: FloorDef;
    // Lights, and how bright the rest is (LightingDef). Unset on every map that's drawn as it
    // always was: those pay nothing for lights.
    lighting?: LightingDef;
};

// What a light looks like and how far it reaches (docs/DEVELOPMENT.md, Lights). Every kind of light
// is one: a map's, a loc's, an enemy's, a spell's, a floor tile's, a boss's.
export type LightLook = {
    // Tiles. Full strength out to under half of it, then a soft fade to its edge.
    radius: number;
    // 0xRRGGBB (WARM_LIGHT, a lantern's, when unset)
    color?: number;
    // How much it adds to what it lights, at its middle (1 when unset). On a dark map 1 lights
    // things about as they'd be anyway; on a lit one 0.5 is a strong glow.
    intensity?: number;
    // 0 to 1: a fire's unsteady light, up to this much of its strength. Only drawn.
    flicker?: number;
    // A slow throb, this much of its strength every seconds. Only drawn.
    pulse?: { amount: number; seconds: number };
};

// A map with lights (lights.glsl). Each part's optional; a map with any of it draws with the lit
// programs. See "Lights" in docs/DEVELOPMENT.md for every kind of light.
export type LightingDef = {
    // How bright what's out of every light is, 0 to 1 (1, as it always is, when unset; about 0.16
    // is the dark: shapes, not detail), and its tint (0xRRGGBB, white when unset). A boss's phase
    // can change it for a while (BossPhasesDef light, Sim.dimTo).
    ambient?: number;
    ambientColor?: number;
    // Lights that stay put, world tiles. Sim lights: weapons aim by them (litTargetsOnly).
    lights?: (LightLook & { x: number; y: number })[];
    // A light round each player. A sim light.
    player?: LightLook;
    // Scenery that lights itself, by loc id: every one on the map. Only drawn: weapons don't aim
    // by it, so a fire that should count is in lights too.
    locs?: Record<number, LightLook>;
    // The rule (the Scar's): weapons only pick targets within half a tile of a sim light's edge,
    // and the minimap only shows those. Shots carry on into the dark and hit what they meet.
    litTargetsOnly?: boolean;
    // A lantern's (powerups.ts, LANTERN_ID) weight among the power-ups that drop here (0
    // everywhere else), and lanterns lying on the ground as the run starts, world tiles
    lanternWeight?: number;
    lanterns?: { x: number; y: number }[];
};

export type TombsDef = {
    // Where the party stands in the Nexus, in world tiles: where a raid starts, and where a path
    // brings it back to
    nexus: { x: number; y: number };
    paths: TombsPathDef[];
    // The Wardens, once all four paths are done (in development): their room, in world tiles
    wardens?: TombsWardensPlaces;
    // The way to the Wardens in the Nexus, in world tiles: open once every path's done
    wardensDoor?: { x: number; y: number };
    // Where the Helpful Spirit stands in the Nexus, in world tiles
    spirit?: { x: number; y: number };
    // The raid's fight button (Sim.ability): a share of the boss's hitpoints, doubled while its
    // guard's down (BossDef.guard), and it breaks a spell the boss channels
    ability?: FightAbilityDef;
};

// One of the Helpful Spirit's bundles (the Tombs of Amascut's), free, one taken each time: what's
// in it, each supply so many (least to most), some only by chance
export type TombsBundleDef = {
    id: string;
    name: string;
    description: string;
    objId: number;
    contents: { supplyId: string; count: [least: number, most: number]; chance?: number }[];
};

// Which Warden: Elidinis' or Tumeken's
export type WardenSide = "elidinis" | "tumeken";

// The Wardens' room, in world tiles (maps/tombsOfAmascut.ts): where the party's brought in, the
// obelisk's middle and each Warden's, each side's orb spawn tile and gap tile (where standing
// blocks that side) and the x its troughs end at, the troughs' rows, and the floor
export type TombsWardensPlaces = {
    arrive: { x: number; y: number };
    obelisk: { x: number; y: number };
    elidinis: { x: number; y: number };
    tumeken: { x: number; y: number };
    sides: Record<
        WardenSide,
        { spawn: { x: number; y: number }; gap: { x: number; y: number }; end: number }
    >;
    troughs: number[];
    floor: { x0: number; y0: number; x1: number; y1: number };
    // The last phase's room (OSRS's own, square 61,80): where the party's brought in, where the
    // Warden stands (on its platform in the floor's middle, where the obelisk was, at the mouth of
    // the crater behind it: FloorDef.holes), and the floor (the map's MapDef.floor)
    last?: {
        arrive: { x: number; y: number };
        at: { x: number; y: number };
        floor: { x0: number; y0: number; x1: number; y1: number };
    };
};

// The Wardens' first phase (content/tombs.ts's WARDENS; Sim.stepWardens). The obelisk is what's
// fought. It sends an energy orb down one of three troughs each side every `every` seconds (a step
// of a tile each stepSeconds, steps of them), each one that gets there charging its Warden; one a
// player walks into on the way is soaked (orbs.soak), and charges nothing. A Warden
// charges perSecond and perOrb more (Ancient Haste: haste), and full, discharges (its seq and seal),
// paused for pause seconds, its attacks taking turns: pyramids, then a shot.
export type WardensDef = {
    obeliskId: string;
    wardens: Record<
        WardenSide,
        {
            enemyId: string;
            // Its pyramids' loc as they glow, the seal it discharges each attack with, its shot
            // (a spot animation homing on each player over the shot's flight) and the share of a
            // player's hitpoints it takes
            pyramid: number;
            pyramidsSpotAnim: number;
            shotSpotAnim: number;
            shotSeal: number;
            shotShare: number;
            name: string;
        }
    >;
    orbs: {
        lookId: string;
        every: number;
        stepSeconds: number;
        steps: number;
        // Walked into anywhere along its trough (within reach of it), an orb's soaked: its Warden
        // gets nothing from it, and whoever soaked it carries its energy, each worth bonus more
        // against the obelisk, one fading every fade seconds, up to max; soaking one more while
        // full overcharges them for overShare of their hitpoints. On its spawn tile it can't be.
        soak: { reach: number; max: number; bonus: number; fade: number; overShare: number };
    };
    charge: {
        // Each side's charge as the fight opens
        start: Record<"elidinis" | "tumeken", number>;
        full: number;
        perSecond: number;
        perOrb: number;
        haste: { perSecond: number; perOrb: number };
        // The charging platform under each Warden, empty to full (45606 to 45626)
        platforms: number[];
    };
    discharge: { seq: number; pause: number };
    // Pyramids: 3 by 3 cells over the floor, cols by rows from the floor's corner offset by
    // `from`, each Warden's every other cell (Elidinis' those whose column and row add up odd),
    // none on the obelisk. Up `appear` seconds after the discharge, hurting whoever's in one every
    // `every` seconds from firstHit to lastHit, gone at `leave`.
    pyramids: {
        cell: number;
        cols: number;
        rows: number;
        from: { x: number; y: number };
        appear: number;
        firstHit: number;
        lastHit: number;
        every: number;
        leave: number;
        damage: number;
        // A glow on each cell from when it's up till its first hit: what's about to hit, readable
        // on the tomb's floor. Only drawn.
        light?: LightLook;
    };
    shot: { flight: number; impactSpotAnim: number };
    // As a Warden discharges, the obelisk flickers: open (damage times what it's hit for) for
    // seconds, haste's with Ancient Haste, gold while it is (light)
    flicker?: { seconds: number; haste: number; damage: number; light: LightLook };
    // Seconds before the first orbs, once the party's in
    holdShare: number;
    startDelay: number;
    message: string;
    endMessage: string;
    two: WardensPhaseTwoDef;
    three: WardensPhaseThreeDef;
};

// The Wardens' second phase (Sim.stepWardens): the Warden with the more charge wakes after wake
// seconds, its forms (each hurt by one style alone, the next flipping it) as bosses. hp is its
// hitpoints before the room's scaling. Hits of the open style fill its shield (shield, a share of
// its hitpoints); full, it kneels (its exposed form) and throws its core out `distance` tiles,
// which takes coreMultiplier times what it's hit for off the Warden, for seconds[i] while the
// Warden's above below[i] of its hitpoints (the last otherwise). Meanwhile the obelisk opens
// firstOpen seconds after it's up, and `every` seconds after each special ends, warning for warn
// seconds (its ring round it, the special's colour), taking its specials in turn.
export type WardensPhaseTwoDef = {
    wake: number;
    wakeSeq: number;
    hp: number;
    forms: Record<
        WardenSide,
        {
            // The open style first, then the other; the exposed (kneeling) form; the core
            styles: ["magic" | "ranged", "magic" | "ranged"];
            forms: [string, string];
            exposed: string;
            core: string;
            // The other Warden's wreck
            wreck: string;
        }
    >;
    obeliskId: string;
    shield: number;
    coreMultiplier: number;
    distance: number;
    seconds: number[];
    below: number[];
    kneelSeq: number;
    standSeq: number;
    // Seconds from the kneel to the core's out, and from its going back to the Warden's up
    kneel: number;
    stand: number;
    deathSeq: number;
    // Seconds from its last hitpoint to the last phase
    toLast: number;
    obelisk: {
        firstOpen: number;
        every: number;
        warn: number;
        openSeq: number;
        closeSeq: number;
        // Each strike, of a player's hitpoints, armour or not
        damage: number;
    };
    // Two pairs of closing walls: rings out from the middles of two opposite edges, a tile a
    // `step`, `rings` of them, at most `wide` tiles either side of the line; north and south,
    // and pause seconds after they start, east and west
    beam: {
        warnSpotAnim: number;
        spotAnim: number;
        step: number;
        rings: number;
        wide: number;
        pause: number;
        // Each tile glows, harmless, this many seconds before it's struck (glowSpotAnim): the
        // ring round the obelisk alone left the strikes unseen until they hurt
        glowAhead: number;
        glowSpotAnim: number;
    };
    // Four arms that turn: a glow on one of five patterns, struck `strikeAfter` seconds later,
    // a pattern every `every` seconds, rounds of them (WARDENS_WINDMILL, below the def)
    windmill: {
        warnSpotAnim: number;
        glowSpotAnim: number;
        spotAnim: number;
        every: number;
        strikeAfter: number;
        rounds: number;
    };
    // Skulls thrown at random tiles every `every` seconds, flying for flight, then lightning over
    // the 7 by 7 round each (all but the cross through it) strikeAfter seconds after they land
    skulls: {
        warnSpotAnim: number;
        projectile: number;
        shadowSpotAnim: number;
        spotAnim: number;
        count: number;
        every: number;
        flight: number;
        strikeAfter: number;
        half: number;
    };
    message: string;
    kneelMessage: string;
    standMessage: string;
    endMessage: string;
};

// The Wardens' last phase: the other Warden back (its form, and its charging form for the
// siphons), on the map's floor (MapDef.floor), slamming a half of it every `every` seconds (below
// half its hitpoints, `quicker`; Overclocked, Overclocked 2 and Insanity quicker still), east, west
// then both. At each of `at`, it charges: siphons (count[i]) land over the floor, each stopped by
// a player stepping on it within window seconds (Insanity: insanityWindow); all stopped, it
// staggers for a share of its hitpoints; any left, the floor erupts. The second and third bring
// a path boss's phantom each (east, then west, phantomOffset tiles off it at the floor's edges).
// At enrage, it heals heal of its hitpoints, its slams stop, lightning strikes the floor instead,
// and a row of it tears away from the back every rowEvery seconds, till the row in front of it.
export type WardensPhaseThreeDef = {
    hp: number;
    forms: Record<WardenSide, { form: string; charging: string; phantoms: [string, string] }>;
    // Amascut's phantom, watching from offset tiles behind it, and as she is once it's enraged
    amascut: { enemyId: string; enragedId: string; offset: number };
    every: number;
    quicker: number;
    invoked: { overclocked: number; overclocked2: number; insanity: number };
    rowSeconds: number;
    slamSeqs: { east: number; west: number; both: number };
    at: number[];
    count: number[];
    // Where they land: shapes, each a set of lines of [x, y] points in tiles from the middle of
    // the row in front of the Warden (y north), the siphons spread evenly along them
    formations: [number, number][][][];
    window: number;
    insanityWindow: number;
    siphon: {
        enemyId: string;
        reversed: string;
        reach: number;
        beamSpotAnim: number;
        skull: number;
    };
    chargeSeq: number;
    staggerSeq: number;
    releaseSeq: number;
    stagger: number;
    restart: number;
    phantomSpotAnim: number;
    phantomOffset: number;
    enrage: {
        at: number;
        heal: number;
        seq: number;
        rowEvery: number;
        firstRow: number;
        // Lightning in the slams' place: a walk of count bolts every every seconds, each bolt's
        // shadow warn seconds before it strikes, for damage of a player's hitpoints
        lightning: {
            first: number;
            every: number;
            warn: number;
            count: number;
            shadowSpotAnim: number;
            spotAnim: number;
            damage: number;
            // A glow under each bolt's shadow till it strikes. Only drawn.
            light?: LightLook;
        };
        message: string;
    };
    message: string;
    siphonMessage: string;
    staggerMessage: string;
    releaseMessage: string;
    phantomMessage: string;
};

// A path out of the Nexus: its door, in world tiles (its middle), which a player walks up to, and
// its room once it's built: where the party's brought in
export type TombsPathDef = {
    id: string;
    name: string;
    door: { x: number; y: number };
    room?: {
        arrive: { x: number; y: number };
        // What it's played as (content/tombs.ts), and the spots its issues come at (Apmeken's
        // pillars and vents: their middles in world tiles, and how close counts as at one)
        puzzle?: "apmeken" | "het" | "scabaras" | "crondis";
        spots?: TombsSpotDef[];
        // The Het room's puzzle, in world tiles: where the Caster statue's beam starts (heading
        // south), the Shielded statue it has to reach (a rect), Het's Seal's middle, and the floor
        // the mirrors and Orbs of Darkness keep to
        het?: {
            beam: { x: number; y: number };
            target: { x0: number; y0: number; x1: number; y1: number };
            seal: { x: number; y: number };
            floor: { x0: number; y0: number; x1: number; y1: number };
        };
        // The Crondis room, in world tiles: the palm's middle; each waterfall, where you stand to
        // fill up (fill) and where it's drawn (at, the loc's middle, and its rotation); and each
        // corridor: its floor's tiles (x0 to x1, y0 to y1), its spear statues' columns either
        // side (low, high), its waterfall, and whether that's at its y0 end (clouds come from it)
        crondis?: {
            palm: { x: number; y: number };
            falls: {
                fill: { x: number; y: number };
                at: { x: number; y: number };
                rotation: number;
            }[];
            lanes: {
                x0: number;
                x1: number;
                y0: number;
                y1: number;
                low: number;
                high: number;
                fall: number;
                fromLow: boolean;
            }[];
        };
        // The Scabaras room's boards, each plate's middle in world tiles: Sequence's, Lights out's
        // ring (in order round it), Addition's, and Matching's two boards (SCABARAS in tombs.ts)
        scabaras?: {
            sequence: { x: number; y: number }[];
            lights: { x: number; y: number }[];
            addition: { x: number; y: number }[];
            matching: { north: { x: number; y: number }[]; south: { x: number; y: number }[] };
            // The slates by the way in that say what Addition's symbols are worth, Addition's
            // Ancient tablet with its number, and Sequence's Ancient button
            slates: { x: number; y: number }[];
            tablet: { x: number; y: number };
            button: { x: number; y: number };
        };
        // The barrier between the safe corridor and the room: the party comes in behind it, and
        // the room starts once someone walks through. It's the sim's: a line at world x (the
        // corridor east of it) or world y (the corridor south of it, the room walked north), held
        // while the room's on, and the loc drawn on its tiles while it's shut.
        gate?: TombsGateDef;
        // Where its enemies come in, in world tiles: the Apmeken room's holes in the walls
        entrances?: { x: number; y: number }[];
        // The path's boss, after its room: the party's brought to arrive, and it rises at `at`
        // once someone's walked north past world y `line.y` (out of the safe area at its arena's
        // south end), as the room waits for the barrier; up, that line holds
        boss?: {
            enemyId: string;
            arrive: { x: number; y: number };
            at: { x: number; y: number };
            line: { y: number };
            // Her rolling stones (BossDef.rollingStones): she goes up to her altar and the party's
            // put at the arena's foot, and they're over once someone gets back up to her. With Mind
            // the Gap, the arena's middle (pit, world tiles) is a drop that kills, meanwhile.
            boulders?: {
                altar: { x: number; y: number };
                start: { x: number; y: number };
                pit: { x0: number; x1: number; y0: number; y1: number };
                // The arena's sarcophagi along its sides, and their locs' rotation as they stand
                sarcophagi?: { x: number; y: number; rotation: number }[];
            };
            // Akkha's four quadrants (BossDef.akkha): the floor's middle and half its width, in
            // world tiles. Quadrant 0 is the north-west and they go round clockwise.
            quadrants?: { middle: { x: number; y: number }; half: number };
            // Kephri's swarms' way in, round the arena's edge clockwise (BossDef.kephri)
            swarms?: { x: number; y: number }[];
            // Zebak's island (where his acid, jugs, boulders and waves go) and the tops of its
            // Rock steps up from the water (where his blood clouds come in) (BossDef.zebak)
            island?: { x0: number; y0: number; x1: number; y1: number };
            steps?: { x: number; y: number }[];
        };
    };
};

// A Tombs room's barrier (TombsPathDef room gate): a line at world x or world y, never both
export type TombsGateDef = { locId: number; tiles: { x: number; y: number }[] } & (
    | { x: number; y?: undefined }
    | { y: number; x?: undefined }
);

export type TombsSpotDef = { kind: "pillar" | "vent"; x: number; y: number; reach: number };
// An NPC posed on a map as scenery (MapDef.props): npcId playing seq over and over, its middle at
// x, y (world tiles), turned yaw (2048 a turn, 0 facing south) and drawn scale times its size.
// Give it a loc that blocks where it stands, as it blocks nothing itself.
export type MapPropDef = {
    npcId: number;
    seq: number;
    x: number;
    y: number;
    yaw?: number;
    scale?: number;
};

// A map's opening cinematic (MapDef.cinematic), played as a run starts on the map (not on a
// retry): the camera follows its shots, its cast act out its cues, and then the camera is the
// run's own, behind the player. Each player's game plays it on its own clock and draws it alone
// (client/Cinematic.ts, client/CinematicView.ts): nothing of it is in the sim or its hashes, so
// co-op can't fall out of step over it. The player's input is held until it's over, and any key,
// click, tap or controller button skips it. A solo run doesn't step until the camera's on its way
// back to the player (the last shot's start); a co-op run goes on, with the player standing still.
export type CinematicDef = {
    // How long it lasts, in seconds: the last shot's (the run's camera) at
    seconds: number;
    // Who's in it (CinematicActorDef), and what they do (CinematicCueDef, in any order)
    cast: CinematicActorDef[];
    cues: CinematicCueDef[];
    // Where the camera is (CinematicShotDef), in order of at, the first at 0 and the last the
    // run's camera
    shots: CinematicShotDef[];
};

// An NPC in a cinematic, drawn only while it plays: npcId playing seq over and over (until a cue
// says otherwise), its middle at x, y (world tiles), turned yaw (2048 a turn, 0 facing south) and
// drawn scale times its size. prop: it stands in for the map's prop at that index (MapDef.props)
// while the cinematic plays, so the scenery itself can act. head: tiles above the ground their
// overhead chat sits at, when it isn't the top of their model (someone on a tall throne). light:
// a light on them while they're drawn, on a map with lighting (a tomb's boss, seen in the dark).
export type CinematicActorDef = {
    id: string;
    npcId: number;
    seq: number;
    x: number;
    y: number;
    yaw?: number;
    scale?: number;
    prop?: number;
    head?: number;
    light?: LightLook;
};

// Something that happens at seconds into a cinematic, to actor (its id): any of
// - seq: they play it from then, once and held on its last frame, or over and over with loop;
// - say: said over their head in the game's overhead chat, for sayFor seconds (3 when unset);
// - spotAnim: a spot animation played out on them, once, lifted lift tiles off the ground and
//   scale times its size;
// - sound: a sound effect (the cache's id) played;
// - gone: they're no longer drawn.
export type CinematicCueDef = {
    at: number;
    actor: string;
    seq?: number;
    loop?: boolean;
    say?: string;
    sayFor?: number;
    spotAnim?: number;
    lift?: number;
    scale?: number;
    sound?: number;
    gone?: boolean;
};

// Where a cinematic's camera is at seconds in: looking at x, y (world tiles), lift tiles above the
// ground there, from distance tiles away, at pitch and yaw (RS angle units, as CameraRig's: pitch
// -512 straight down and 0 level, yaw 0 facing north). Between shots it moves smoothly through
// them (a monotone curve, so it never overshoots one); hold eases it to a stop on that shot. It
// turns the short way round from one shot's yaw to the next, so a turn of half a circle or more
// needs a shot on the way.
// player: the run's own camera, behind the player, as the cinematic ends there.
export type CinematicShotDef =
    | {
          at: number;
          x: number;
          y: number;
          lift: number;
          pitch: number;
          yaw: number;
          distance: number;
          hold?: boolean;
      }
    | { at: number; player: true };

// A floor that rises and falls away, after the Wardens' third phase in the Tombs of Amascut
// (core/ArenaFloor.ts runs it, client/FloorView.ts draws it). It's a rectangle of 1 by 1 tiles,
// each drawn by the game as a slab, so each can shake, rise and fall on its own. Its front is
// north, where a boss would stand: slams travel out from it, and rows fall away from the south,
// the back, towards it. Every hit is warned by the tiles themselves shaking.
//
// Everything past rect, slam, drop and script has a default, so a floor of the Wardens' slabs is
// those and nothing else. To make it your own (scaperune/CLAUDE.md, "Floors that fight back"):
// shape or ascii for which tiles there are, skins for what they look like, tiles for which skin,
// type and slab size goes where.
export type FloorDef = {
    // World tiles, both ends in: the box the floor's in. Its tiles are counted from its south-west
    // corner (floor tiles) by everything below.
    rect: { x0: number; y0: number; x1: number; y1: number };
    // Tiles of the rectangle that aren't floor (the Wardens' crater): gone from the start, never
    // drawn, risen or put back. Row spans in world tiles, both ends in.
    holes?: { y: number; x0: number; x1: number }[];
    // Which tiles of the box are floor (FloorShapeDef; all of it when unset). The rest is the
    // pit's dark from the start: blocked, and never there.
    shape?: FloorShapeDef;
    // A hand-drawn floor, a row a string, the north row first, from the box's south-west corner:
    // "." and " " are no floor, any other character is, and tiles rules can pick tiles out by
    // their character (FloorWhereDef "chars"). With shape too, the floor's where both say.
    ascii?: string[];
    // What its tiles look like (FloorSkinDef); tiles rules pick them by index. When unset, one:
    // the slam's own slab, rising with its animation.
    skins?: FloorSkinDef[];
    // Which skin, type, turn and slab size each tile has: every rule that covers a tile is
    // applied, in order, a later one over an earlier. Every tile starts as skin 0, "normal", unturned,
    // and a tile on its own.
    tiles?: FloorTileRuleDef[];
    // For the tiles rules' shares and weights: the same seed lays the floor out the same way
    seed?: number;
    slam: {
        // Seconds a tile shakes before it rises
        warn: number;
        // Seconds after it starts rising that it hits whoever's on it: while it's up
        hurt: [from: number, to: number];
        // Of the player's hitpoints
        damage: number;
        // Seconds after a hit from the floor before it can hit them again
        grace: number;
        // The slab coming up: a 1 by 1 tile, its top flush with the ground at rest
        spotAnim: number;
        // As tiles come up (one a tick at most, where they are), and as one hits the player
        sound: number;
    };
    drop: {
        // Seconds a tile shakes and sags before it falls
        warn: number;
        // Of the player's hitpoints, for being on a tile as it goes; they're pushed to the
        // nearest tile that isn't going, over shove seconds
        damage: number;
        shove: number;
        // The slab tumbling, and how long it's drawn falling into the dark
        spotAnim: number;
        fall: number;
        // Rows a script's dropRows never takes: the last in front of the boss (a fight's own
        // dropRows can say otherwise, with keep)
        keepRows: number;
        // As tiles fall, and as the player's hurt by one
        sound: number;
        // A fragile tile's warning is this much of warn (default 0.5), and it falls by itself
        // after it's risen this many times (default 2)
        fragile?: { warn?: number; hits?: number };
        // Holes, falling rows and fragile tiles never cut the floor in two (so nobody's left on
        // an island) unless this is set
        islands?: boolean;
    };
    // What it throws up, all spot animations (client/FloorView.ts): dust as a slab comes up and
    // as a tile goes, and a chip of rock (crumbling off a tile about to go, and falling with it)
    effects?: { dust: number; fallDust: number; rock: number };
    // What's under the floor, seen through its holes (locs, drawn by client/FloorView.ts on a
    // regular grid): pillars holding it up, beams between them, and the arena's wall going down
    // round its edge, over a glow far below
    under?: { pillar: number; beam: number; wall: number };
    // The light under the floor, in its cracks as tiles tremble and far below (0xRRGGBB)
    glow?: number;
    // How a pattern shows every tile it'll hit from the moment it starts, unless it says
    // otherwise (FloorCue; subtle when unset)
    cue?: FloorCue;
    // A slab coming up this near a player shakes the camera this much, and a tile going from under
    // or beside them this much (ImpactDef.shake; Settings can turn it off)
    shake?: { slam: number; drop: number };
    // What the floor does, at seconds into the loop, and then the loop again from the top
    script: FloorBeatDef[];
    loopSeconds: number;
    // How much the tiles' effects do (FloorTileRuleDef.effect), over their defaults
    tileEffects?: FloorTileEffectsDef;
    // Fallen tiles rise back by themselves (FloorRebuildDef); a tiles rule can say otherwise
    rebuild?: FloorRebuildDef;
    // Patterns by name, for triggers, phases and bosses to start (FloorActionDef "pattern")
    patterns?: Record<string, FloorPatternDef>;
    // What stepping on a tile with a trigger does (FloorTileRuleDef.trigger: its name here)
    triggers?: Record<string, FloorTriggerDef>;
    // The floor's phases by name (FloorActionDef "phase"): another script, and skins swapped
    phases?: Record<string, FloorPhaseDef>;
};

export type FloorBeatDef = {
    at: number;
    // A pattern to start, or something else to do (FloorActionDef); one of them
    pattern?: FloorPatternDef;
    action?: FloorActionDef;
    // On-screen notice as it starts
    message?: string;
};

// What standing on a tile does to whoever's on it (FloorTileRuleDef.effect, or its skin's).
// burn: hurts, a share of their hitpoints every so often (lava); enemies too. heal: heals the
// player, a share of their hitpoints every so often (a glyph). haste and slow: faster or slower,
// enemies too (a speed plate, mud or sand). ice: they keep their momentum and steer only a little
// each tick, so they slide (enemies aren't moved by it).
export type FloorEffect = "burn" | "heal" | "haste" | "slow" | "ice";

// How much: burn's and heal's share of the player's hitpoints, every so often (seconds), and
// burn's hit on an enemy; haste's and slow's change to speed (0.4 is 40% faster or slower); ice's
// grip, how much of the way to where they're steering they get each tick (0 to 1)
export type FloorTileEffectsDef = {
    burn?: { damage?: number; every?: number; enemyDamage?: number };
    heal?: { amount?: number; every?: number };
    haste?: number;
    slow?: number;
    ice?: { grip?: number };
};

// Fallen tiles coming back: after seconds, warned for warn seconds (a light far down the hole and
// the tile rising into view), taking rise seconds to come up. A rule's rebuild (seconds, or 0 for
// never) is over this, for its tiles.
export type FloorRebuildDef = { after: number; warn?: number; rise?: number };

// A tile that does something when it's stepped on (a pressure plate): what, and then not again for
// cooldown seconds (5 when unset); once, never again. A trigger that starts disarmed does nothing
// until something arms it (FloorActionDef "arm"). Only players set them off.
export type FloorTriggerDef = {
    actions: FloorActionDef[];
    cooldown?: number;
    once?: boolean;
    armed?: boolean;
    message?: string;
};

// Something done to the floor, by a trigger, a beat, a phase or a boss's attack (Sim.floorAct),
// after delay seconds if it has one. pattern: start one (or one of FloorDef.patterns by name).
// drop: a group's tiles fall (warned as a fall is); raise: a group's fallen tiles come back;
// slam: a group's tiles rise, a warning from now (a trap). dropUnder: the tile under whoever it's
// aimed at falls (a boss's). arm: a trigger armed or disarmed. phase: one of FloorDef.phases.
export type FloorActionDef = (
    | { kind: "pattern"; pattern: FloorPatternDef | string }
    | { kind: "drop"; group: string }
    | { kind: "raise"; group: string }
    | { kind: "slam"; group: string }
    | { kind: "dropUnder" }
    | { kind: "arm"; trigger: string; armed?: boolean }
    | { kind: "phase"; phase: string }
) & { delay?: number };

// A phase of the floor (FloorActionDef "phase"): its own script from now (with its own loop), and
// skins swapped on every tile, [from, to] by index, effects going with them (their skins'); and
// what's said as it starts
export type FloorPhaseDef = {
    script?: FloorBeatDef[];
    loopSeconds?: number;
    skins?: [from: number, to: number][];
    message?: string;
};

// What a skin does as it rises, falls, and cracks (a fragile tile's rise that brings it nearer
// giving way), each a spot animation and a sound, either or both (FloorSkinDef.material)
export type FloorMaterialDef = {
    rise?: FloorMaterialFxDef;
    fall?: FloorMaterialFxDef;
    crack?: FloorMaterialFxDef;
};
export type FloorMaterialFxDef = { spotAnim?: number; sound?: number; scale?: number };

// side: one half of the floor rises, row by row away from the front, the middle column with it
// (east or west), or all of it but the middle three columns (both); outward, row by row away from
// the origin's row instead, both ways (a boss standing in the floor's middle). sweep: every row from the
// front, each with a gap of gap tiles that wanders a tile at a time. ripple: square rings out from
// a tile (the player's, or the middle), with spokes along which nothing rises (a cross, or the
// diagonals), the tile itself first. dropRows: rows from the back fall away, one after another
// (never past the floor's keepRows, or the pattern's own keep).
// holes: single tiles fall away at random, never next to another hole or the floor's edge.
// restore: everything that's fallen comes back up, front first.
// How a pattern shows the tiles it'll hit from the moment it starts, so where's safe can be read
// before the wave gets there (client/FloorView.ts). Either way each tile's last second before it
// rises or falls is a strong warning: the tremor and the light through its seams.
// subtle: the floor still reads as stone. Marked tiles are a shade darker, with a thin warm line
// in their seams and the faintest tremor; the safe shape is there if you look for it.
// bold: the pattern's whole shape lit at once. Marked tiles' edges glow gold, bleeding in over
// them and breathing slowly, building to a wide bright glow; for a signature attack whose
// telegraph is the point.
export type FloorCue = "subtle" | "bold";

// Which tiles of a floor's box are floor, in floor tiles from its south-west corner (FloorDef).
// rect: a box, both ends in. ellipse: within rx and ry of a middle (a circle when they're the
// same). ring: between inner and outer of a middle, round (or square, by square). diamond: within
// r of a middle, counting steps. cross: the middle's row and column, width tiles wide. union: in
// any of them. minus: in from, and not in cut. A middle can be in half tiles (11.5 is between
// 11 and 12); it's the box's middle when unset.
export type FloorShapeDef =
    | { kind: "rect"; x0: number; y0: number; x1: number; y1: number }
    | { kind: "ellipse"; rx: number; ry: number; cx?: number; cy?: number }
    | { kind: "ring"; inner: number; outer: number; square?: boolean; cx?: number; cy?: number }
    | { kind: "diamond"; r: number; cx?: number; cy?: number }
    | { kind: "cross"; width: number; cx?: number; cy?: number }
    | { kind: "union"; of: FloorShapeDef[] }
    | { kind: "minus"; from: FloorShapeDef; cut: FloorShapeDef };

// What a floor's tiles look like: a model at a tile's middle, its top at the floor. A spot
// animation's (its model, recoloured as the cache has it, and its animation as its rise), a loc's,
// or a model's own. It should be a tile across (a slab more tiles across is stretched to them).
export type FloorSkinDef = {
    spotAnim?: number;
    loc?: number;
    model?: number;
    // Colours (the cache's HSL) and textures swapped, after the cache's own swaps
    recolor?: [from: number, to: number][];
    retexture?: [from: number, to: number][];
    // Bigger or smaller (1 as it is), and raised (tiles, up), as baked
    scale?: number;
    // Tiles across it's made (1 when unset): a slab of the tiles it's on draws it as it is, and a
    // bigger or smaller one stretches it (a 2 by 2 pillar on a 2 by 2 slab)
    size?: number;
    height?: number;
    // A tint over it (0xRRGGBB)
    tint?: number;
    // How it comes up: its spot animation's own rise ("anim", only a spotAnim skin with one), or
    // lifted, tipped the way the wave goes and settled back in code ("code", the default for
    // everything else)
    rise?: "anim" | "code";
    // How it falls: tumbling away as drop.spotAnim does ("tumble", only for a 1 by 1 tile of the
    // slam's slab), or dropping and turning over in code ("code", the default otherwise)
    fall?: "tumble" | "code";
    // A steady light along its edges while nothing's coming (0xRRGGBB): a glyph's glow
    light?: number;
    // Another skin (its index) drawn under this one, for a model that's only a decal (a rune
    // that lies on a floor), or one that doesn't cover its tiles (a pillar standing on them)
    under?: number;
    // How the cues look on it, for a skin the floor's own light doesn't suit: the light's colour
    // (FloorDef.glow when unset), its strength and width (times as much), and the tremor before
    // a tile's own warning (times as much)
    cue?: { color?: number; strength?: number; width?: number; tremor?: number };
    // A glow all over it, in its tint's colour (0 to 1): lava's; and how much more it glows at the
    // height of a slow pulse, each tile on its own beat
    glow?: number;
    pulse?: number;
    // A spot animation played now and then on a share of its tiles at rest (lava's embers): every
    // so many seconds, on one tile in share (4 when unset)
    idle?: { spotAnim: number; every: number; share?: number; scale?: number };
    // What standing on it does (FloorEffect), unless a tiles rule says otherwise
    effect?: FloorEffect;
    // Its dust, chips and sounds as it rises, falls and cracks (FloorMaterialDef; FLOOR_MATERIALS)
    material?: FloorMaterialDef;
    // Skins (their indices) to draw instead once a fragile tile's risen once, twice and so on, so
    // you can see when it's about to go; without, it darkens and sits askew a little more each time
    stages?: number[];
};

// What a tile does. normal: rises and falls. solid: never rises or falls. reinforced: rises,
// never falls. fragile: falls faster, and falls by itself after rising a few times (drop.fragile).
// safe: never rises or falls, as solid does; for the glyphs a floor promises as safe spots.
// pillar: never rises or falls, and nobody can walk through it (give it a pillar's skin).
export type FloorTileType = "normal" | "solid" | "reinforced" | "fragile" | "safe" | "pillar";

// Where a tiles rule applies (FloorTileRuleDef), in floor tiles. A shape (FloorShapeDef); checker:
// alternate squares of size tiles (1 when unset), odd ones if odd; border: within width tiles
// (1) of the floor's edge, or of no floor; stripes: every every tiles along x or y, width wide
// (1), from offset (0); chars: the ascii map's tiles with any of these characters; all: every
// tile.
export type FloorWhereDef =
    | FloorShapeDef
    | { kind: "all" }
    | { kind: "checker"; size?: number; odd?: boolean }
    | { kind: "border"; width?: number }
    | { kind: "stripes"; axis: "x" | "y"; every: number; width?: number; offset?: number }
    | { kind: "chars"; chars: string };

// A rule laying out a floor's tiles (FloorDef.tiles). Only where it says (everywhere when unset),
// and of those only a share of them (all when unset), picked by the floor's seed.
// skin: which (FloorDef.skins), or one of several by weight; type: what it does; turn: quarter
// turns (0 to 3), or any by chance; slab: tiles that rise and fall as one piece, [x, y] tiles
// across, laid from the south-west wherever the whole of one fits in what the rule covers and
// isn't in a slab already.
// effect: what standing on it does (FloorEffect; "none" for nothing, over its skin's). rebuild:
// seconds after it falls that it comes back, 0 never (FloorDef.rebuild when unset). trigger: the
// name of what stepping on it sets off (FloorDef.triggers). group: a name for its tiles, for
// actions (FloorActionDef). height: tiles up (or down, below 0) it stands, a platform or a sunken
// tile; ramp: a slope up the way it says, from the tile behind it to the one ahead (core/floorLayout.ts).
export type FloorTileRuleDef = {
    where?: FloorWhereDef;
    share?: number;
    skin?: number | { skin: number; weight: number }[];
    type?: FloorTileType;
    turn?: number | "random";
    slab?: [x: number, y: number];
    effect?: FloorEffect | "none";
    rebuild?: number;
    trigger?: string;
    group?: string;
    height?: number;
    ramp?: "north" | "east" | "south" | "west";
};

export type FloorPatternDef = (
    | { kind: "side"; side: "east" | "west" | "both"; rowSeconds: number; outward?: boolean }
    | { kind: "sweep"; rowSeconds: number; gap: number }
    | {
          kind: "ripple";
          at: "player" | "middle";
          ringSeconds: number;
          radius: number;
          spokes: "cross" | "diagonal";
      }
    | { kind: "dropRows"; rows: number; rowSeconds: number; keep?: number }
    | { kind: "holes"; count: number }
    | { kind: "restore"; rowSeconds: number }
) & {
    // Its own cue (FloorCue), over the floor's
    cue?: FloorCue;
};

// A raid's rooms, one after another. Each has its waves for a while, then the party's taken into
// its boss's room, which nobody leaves while the boss is up. Killing it takes them on to the next
// room, and the last room's boss is the final boss.
export type RaidDef = {
    rooms: RaidRoomDef[];
    // Seconds of waves a room has at the least (60 when unset)
    minWaveSeconds?: number;
};

// What a raid's supply chest sells between rooms, for raid points (like the Theatre of Blood's
// supplies): hitpoints back, or a boost for a while
export type RaidSupplyDef = {
    id: string;
    name: string;
    description: string;
    objId: number;
    price: number;
    effect:
        | { kind: "heal"; fraction: number }
        | { kind: "buff"; stats: Partial<Stats>; seconds: number; cures?: boolean };
};

export type RaidRoomDef = {
    name: string;
    // World tiles: where the party starts the room, where they're brought for the boss, and where
    // the boss turns up
    start: { x: number; y: number };
    arrive: { x: number; y: number };
    bossAt: { x: number; y: number };
    // The boss's room, in world tiles
    chamber: { minX: number; minY: number; maxX: number; maxY: number };
    // Where the hall's teleporter stands, in world tiles: walking up to it offers to skip the
    // rest of the room's waves (Sim's raidTeleports)
    teleporter?: { x: number; y: number };
    // The run's second the boss comes if no boss before took any time: the room's
    // waves last the gap between this and the last room's (at least minWaveSeconds), from when
    // the room starts. The waves' starts and the events' times are from the room's start too.
    at: number;
    waves: WaveDef[];
    events: RunEventDef[];
    boss: string;
    bossHp?: number;
    // Seconds its boss can take for all of a room's speed points (getRoomPoints): what its fight's
    // tuned to take a strong player
    par: number;
    // How its hall looks while its waves are on: drawn this bright (as MapDef.brightness, lower
    // darker), and the world washed with this colour ("#rrggbb", multiplied over it in the
    // shader, so white is no change)
    hall?: { brightness?: number; wash?: string };
};

// A fun map runs endless from the start: there's no final boss, and a new
// round (everything tougher, see endless.ts) starts every fifteen minutes of
// waves. Bosses turn up at random from a pool instead of on a schedule.
export type FunMapDef = {
    // Bosses picked at random, the first at firstAt seconds into the run and
    // each after it every few minutes (between every[0] and every[1] seconds)
    bosses: {
        pool: string[];
        firstAt: number;
        every: [number, number];
        // The whole pool turns up at once instead (Pest Control's portals),
        // and the next lot comes a few minutes (every) after the last of them
        // is killed rather than on the clock. Killing them all drops this
        // casket where the last one fell, with the message.
        together?: { casket: CasketTier; message: string };
    };
    // Everyone plays this adventurer here, unlocked or not (Durial321 in
    // Falador)
    character?: string;
    // Seconds between chat lines from the enemies near the player (they say
    // their EnemyDef.chat lines)
    chatEvery?: number;
    // Lines the player says now and then, every few seconds (between every[0]
    // and every[1])
    playerChat?: { lines: string[]; every: [number, number] };
};

// Where a piece of gear is worn. The client's equipment slots, plus the ring
// (which no one sees).
export type GearSlot =
    | "head"
    | "cape"
    | "neck"
    | "body"
    | "shield"
    | "legs"
    | "hands"
    | "feet"
    | "ring";

// Worn for the rest of the run once equipped; one per slot
export type GearDef = {
    kind: "gear";
    id: string;
    name: string;
    objId: number;
    rarity: Rarity;
    slot: GearSlot;
    stats: Partial<Stats>;
    unlock?: UnlockTask;
    // Only made in the Armoury, by upgrading this piece (an ornament kit, an
    // imbue, a fortified version): never in a casket by itself. Its stats are
    // that piece's and a bit more.
    variantOf?: string;
    // The set it's part of (see sets.ts); a variant is part of its piece's
    set?: string;
};

// Pieces of gear that do more together: wearing enough of them gives a bonus
// on top of their own stats
export type SetDef = {
    id: string;
    name: string;
    // Pieces worn it takes for the bonus (of those with this set in items.ts)
    needed: number;
    // The bonus, for the UI: "+10% damage"
    bonus: string;
    stats?: Partial<Stats>;
    // A boost to the weapons of these kinds, or these weapons: more damage
    // (0.15 = +15%), faster (0.1 = 10% shorter cooldown), and more area
    weapons?: {
        kinds?: WeaponKind[];
        ids?: string[];
        damage?: number;
        cooldown?: number;
        area?: number;
    };
};

// What a utility item does when it's used
export type ItemUse =
    // Heals, and can change some stats for a while too (a Saradomin brew)
    | { kind: "heal"; amount: number; stats?: Partial<Stats>; seconds?: number }
    // A timed boost to some stats (stretched by effect duration)
    | { kind: "buff"; stats: Partial<Stats>; seconds: number }
    // Cures poison and boss drains and curses, keeps them off for a while
    // (stretched by effect duration), and can heal too
    | { kind: "cure"; seconds: number; heal?: number }
    // Pulls every bone on the ground to the player
    | { kind: "bones" }
    // Hurts everything around the player
    | { kind: "blast"; damage: number; radius: number; spotAnim: number }
    // Experience worth this many levels at the current level
    | { kind: "xp"; levels: number }
    // Co-op: a teammate can revive the player once more. Taken from the
    // casket at once, never kept, and only found in co-op.
    | { kind: "revive" }
    // One of a raid's supplies (the Tombs of Amascut's, from its Helpful Spirit): does what it does
    | { kind: "supply"; supplyId: string };

// Carried in the inventory and used when the player wants (1-4); copies of
// the same item stack in one slot
export type UtilityDef = {
    kind: "utility";
    id: string;
    name: string;
    objId: number;
    rarity: Rarity;
    description: string;
    use: ItemUse;
    unlock?: UnlockTask;
};

export type ItemDef = GearDef | UtilityDef;

// Clue scroll reward caskets: the tier sets how rare the item inside is likely
// to be, and how many coins come with it
export type CasketTier = "easy" | "medium" | "hard" | "elite" | "master";

export type CasketDef = {
    tier: CasketTier;
    name: string;
    objId: number;
    color: string;
    // Relative chances of the item's rarity, before luck
    rarityWeights: Record<Rarity, number>;
    coins: [min: number, max: number];
};

// What a power-up does when it's picked up. Damage is at the start of a run;
// it grows as the enemies' hitpoints do.
export type PowerUpEffect =
    // Sets up a cannon by the player that shoots the nearest enemies in range,
    // amount at a time every interval seconds
    | {
          kind: "cannon";
          damage: number;
          interval: number;
          amount: number;
          range: number;
          seconds: number;
      }
    // Raises one of the thralls to fight beside the player
    | { kind: "thrall"; seconds: number }
    // Kills everything that isn't a boss; bosses lose this fraction of their
    // hitpoints
    | { kind: "nuke"; bossDamage: number }
    // Pulls every drop on the ground to the player
    | { kind: "magnet" }
    // Everything that isn't a boss stands still, and so does whatever turns up
    // meanwhile
    | { kind: "freeze"; seconds: number }
    // Rides off at this many times the speed with nothing able to hurt them,
    // for a set time: Effect duration doesn't stretch it
    | { kind: "sled"; seconds: number; speed: number }
    // A rock (locId) falls on the thickest crowd within range of the player,
    // delay seconds later, hitting everything within radius and throwing what
    // lives back this many tiles. Bosses lose bossDamage of their hitpoints.
    | {
          kind: "rock";
          delay: number;
          range: number;
          radius: number;
          damage: number;
          knockback: number;
          bossDamage: number;
          locId: number;
          spotAnim: number;
      }
    // A giant NPC charges through the crowd this many times, ignoring walls.
    // Each pass it hits everything within radius once, for damage, and throws
    // it this many tiles aside. Drawn at scale, playing walkSeq.
    | {
          kind: "rampage";
          seconds: number;
          passes: number;
          speed: number;
          radius: number;
          damage: number;
          knockback: number;
          npcId: number;
          walkSeq: number;
          scale: number;
      }
    // A ring (locId, drawn at scale) opens at the player's feet and warps
    // whatever walks within radius far away, showing spotAnim where it was
    | {
          kind: "ring";
          seconds: number;
          radius: number;
          locId: number;
          spotAnim: number;
          scale: number;
      }
    // Opens as a treat or a trick (see trickOrTreat.ts)
    | { kind: "pumpkin" }
    // Everything within range runs laps around the player at this many times
    // its speed, radius tiles out, and can't attack; a line for the player to
    // shout
    | {
          kind: "laps";
          seconds: number;
          range: number;
          radius: number;
          speed: number;
          shout: string;
      }
    // A light: bonus tiles on the player's own light (LightingDef.player), or a light of its own
    // that big, for seconds (Effect duration stretches it), shrinking back over the last fade
    // seconds. Its look is the player's light's, or the lantern's. Only on a map with lighting.
    | { kind: "light"; bonus: number; seconds: number; fade: number; look?: LightLook };

// What the player has in hand and how they stand while a power-up lasts. Baked
// with the player (GameAssets.getPowerUpLookRequests), so it's on at once.
export type PowerUpLook = { objId: number; idleSeq: number; moveSeq: number };

// Dropped now and then by enemies, picked up by walking over it and used there
// and then
export type PowerUpDef = {
    id: string;
    name: string;
    description: string;
    // Item for the icon, and on the ground unless locId is set
    objId: number;
    // Scenery drawn on the ground instead (the set-up cannon)
    locId?: number;
    // Relative chance of being the one that drops (0: it drops some other way)
    weight: number;
    // Its loot beam and minimap dot, when it isn't POWER_UP_COLOR
    color?: string;
    // Coins the Mysterious Old Man wants for it, at the start of a run
    price: number;
    // Flashes the screen this colour ("#rrggbb") when it's used
    flash?: string;
    // Cache sound effect when it's picked up (-1 for none)
    sound: number;
    // Cache sound effect when it wears off
    endSound?: number;
    // Cache sound effect each time it lands a blow
    hitSound?: number;
    // Worn while it lasts
    look?: PowerUpLook;
    effect: PowerUpEffect;
};

// What walking up to a random event's visitor does
export type RandomEventEffect =
    // Sells power-ups for the run's coins (the Mysterious Old Man)
    | { kind: "shop"; leaveLabel: string }
    // An odd one out to spot, for a free power-up
    | { kind: "quiz"; options: number; right: string; wrong: string; leaveLabel: string }
    // Experience, as a share of a level
    | { kind: "xp"; levels: number; message: string; sound: number }
    // Hitpoints, as a share of the maximum. ignoredHit: a share of the maximum
    // taken when they're left waiting, which never kills.
    | { kind: "heal"; fraction: number; ignoredHit?: number; message: string; sound: number }
    // A casket on the ground, as good as an elite's
    | { kind: "casket"; message: string; sound: number }
    // A boost for a while; name and objId are for its timer
    | {
          kind: "buff";
          name: string;
          objId: number;
          stats: Partial<Stats>;
          seconds: number;
          // Keeps poison and drains off, like an antidote
          cures?: boolean;
          message: string;
          sound: number;
      }
    // No one to walk up to: this boss comes straight for the player, with
    // hitpoints that keep up with the run. Not while another boss is out.
    | { kind: "ambush"; enemyId: string };

// Someone from OSRS's random events, turning up now and then during a run
export type RandomEventDef = {
    id: string;
    name: string;
    // Relative chance of being the one that turns up
    weight: number;
    // Not before this many seconds into the run
    minSeconds?: number;
    // Standing around to be walked up to; an ambush has none of these
    npcId?: number;
    idleSeq?: number;
    // On screen when they turn up, and when they're left waiting too long
    arrive?: string;
    leave?: string;
    // Said over their head while they wait
    shouts?: string[];
    // What they say on the screen they open (shop and quiz)
    speech?: string;
    effect: RandomEventEffect;
};

// An Arceuus thrall: follows the player and attacks what's near. Ranged and
// magic thralls shoot from beside the player; melee ones go after things.
export type ThrallDef = {
    id: string;
    name: string;
    npcId: number;
    idleSeq: number;
    walkSeq: number;
    attackSeq: number;
    style: CombatStyle;
    // Floats through walls
    ghost?: boolean;
    damage: number;
    // Seconds between attacks
    interval: number;
    // Tiles it shoots from, or how far from the player a melee one goes
    range: number;
    knockback: number;
    // Ranged and magic: the projectile, and where it hits
    projectileSpotAnim?: number;
    impactSpotAnim?: number;
    // Cache sound effect when it attacks
    sound: number;
};
