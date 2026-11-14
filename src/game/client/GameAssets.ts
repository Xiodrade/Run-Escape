import { ActorBakeLoader } from "../../mapviewer/webgl/actor/ActorBakeLoader";
import {
    ActorBakeInput,
    ActorBakeResult,
    BakeRequest,
    NpcBakeRequest,
    PlayerBakeRequest,
} from "../../mapviewer/webgl/actor/ActorBakeTypes";
import { ActorModel, ActorPage, ActorRenderer } from "../../mapviewer/webgl/actor/ActorRenderer";
import { RenderDataWorkerPool } from "../../mapviewer/worker/RenderDataWorkerPool";
import {
    SpriteDataInput,
    SpriteDataLoader,
    SpriteImage,
} from "../../mapviewer/worker/SpriteDataLoader";
import {
    EquipSlot,
    PlayerAppearance,
    createAppearance,
    getAppearanceKey,
} from "../../rs/model/player/PlayerModelLoader";
import { CHARACTERS, getCharacter } from "../content/characters";
import { REVIVE_SEQ, REVIVE_SPOTANIM } from "../content/coop";
import { ENEMIES, getEnemy } from "../content/enemies";
import { FLAG_SPRITE } from "../content/flags";
import { BLOOD_SOULREAPER_AXE_OBJ, SOULREAPER_AXE_OBJ } from "../content/gauntlet";
import {
    INVOCATIONS,
    OFF_SPRITE,
    RAID_BAND_SPRITES,
    RUN_INVOCATIONS,
} from "../content/invocations";
import { CASKETS, GEAR_SLOTS, GEAR_SLOT_BY_ID, getItem } from "../content/items";
import { getHeroNpcSeqs } from "../content/justiciarKit";
import { ALL_MAPS, MAPS, getMapCinematics } from "../content/maps";
import { SAME_NPC_LOOK } from "../content/npcLooks";
import { PASSIVES, getPassive } from "../content/passives";
import { PET_BY_ID, PetDef, getPetModelKey } from "../content/pets";
import { POWER_UPS, THRALLS, getPolymorphLooks, getPowerUp } from "../content/powerups";
import { RAID_PORTAL_LOC } from "../content/raids";
import { RANDOM_EVENTS, VISITOR_SPOTANIM } from "../content/randomEvents";
import { REMIX_FIRE_LOC, REMIX_ICE_LOC } from "../content/remixes";
import { PlayerStance, getPlayerStance } from "../content/stances";
import { STAT_ICON_SPRITE_IDS } from "../content/statIcons";
import {
    CHECKBOX_SPRITES,
    CLOSE_SPRITES,
    CLOUD_SAVE_SPRITES,
    REFUND_SPRITE,
    SOUND_ORB_SPRITES,
    TITLE_TAB_SPRITES,
} from "../content/titleIcons";
import {
    AKKHA,
    APMEKEN_BARRIER_LOC,
    APMEKEN_SPOTANIMS,
    CRONDIS,
    HET,
    JUNGLE_JAPES,
    KEPHRI,
    KEPHRI_ARCANE_BLAST,
    KEPHRI_EGG_BLAST,
    SARCOPHAGI,
    SARCOPHAGUS_BLAST,
    SCABARAS,
    TOMBS_SPIRIT,
    TOMBS_SPOTANIMS,
    WARDENS,
    ZEBAK,
    getTombsFightSeqs,
} from "../content/tombs";
import {
    CharacterDef,
    EnemyDef,
    EnemyOutfit,
    FloorSkinDef,
    GearSlot,
    ImpactDef,
    MapDef,
    PolymorphKind,
    RootsRuleDef,
    WeaponDef,
} from "../content/types";
import { WardrobeLook, applyBody, applyOutfit, wearsWardrobe } from "../content/wardrobe";
import { WEAPONS, getProjectileObjId, getWeapon } from "../content/weapons";
import { BLOOD_FURY_SPOTANIM, FREEZE_SPOTANIM, NUKE_SPOTANIM, Sim } from "../core/Sim";
import { Pickup } from "../core/entities";
import { GameWebGLRenderer } from "../render/GameWebGLRenderer";
import { getCinematicSeqs } from "./Cinematic";

export const PLAYER_SEQS = {
    idle: 808,
    walk: 819,
    run: 824,
    death: 836,
};

// Eating, whose interleave order is the cache's usual split of a player for
// doing something while walking: the legs (and the body's root) from the
// walk, the rest from what's being done. The game's attacks have none of
// their own, so they're played over the run with this one's.
export const PLAYER_INTERLEAVE_SEQ = 829;

export const PICKUP_OBJS: Record<"food" | "casket", number> = {
    food: 2140,
    casket: 405,
};

// Bones and coins gather into piles on the ground, and a pile looks like what
// it's worth: bones go up through the Prayer bones as their experience adds up,
// coins through their stack sizes. Each look is from minValue up to the next.
export type PileLook = { minValue: number; objId: number; count: number; scale: number };

export const PILE_LOOKS: Record<"bones" | "coins", PileLook[]> = {
    bones: [
        // Bones, Big bones, Dragon bones, Wyvern bones, Lava dragon bones,
        // Superior dragon bones
        { minValue: 0, objId: 526, count: 1, scale: 0.75 },
        { minValue: 20, objId: 532, count: 1, scale: 0.85 },
        { minValue: 100, objId: 536, count: 1, scale: 0.95 },
        { minValue: 300, objId: 6812, count: 1, scale: 1 },
        { minValue: 1000, objId: 11943, count: 1, scale: 1.1 },
        { minValue: 3000, objId: 22124, count: 1, scale: 1.2 },
    ],
    coins: [
        { minValue: 0, objId: 995, count: 25, scale: 0.85 },
        { minValue: 10, objId: 995, count: 100, scale: 0.95 },
        { minValue: 25, objId: 995, count: 250, scale: 1.05 },
        { minValue: 60, objId: 995, count: 1000, scale: 1.2 },
        { minValue: 150, objId: 995, count: 10000, scale: 1.4 },
    ],
};

function getPileLookIndex(kind: "bones" | "coins", value: number): number {
    const looks = PILE_LOOKS[kind];
    let index = 0;
    while (index + 1 < looks.length && value >= looks[index + 1].minValue) {
        index++;
    }
    return index;
}

// How a pile of bones or coins looks, undefined for other pickups
export function getPileLook(pickup: Pickup): PileLook | undefined {
    if (pickup.kind !== "bones" && pickup.kind !== "coins") {
        return undefined;
    }
    return PILE_LOOKS[pickup.kind][getPileLookIndex(pickup.kind, pickup.value)];
}

// Bones and coins are drawn as their pile, caskets as the reward casket of
// their tier, power-ups as their item (or scenery)
export function getPickupModelKey(pickup: Pickup): string {
    if (pickup.kind === "bones" || pickup.kind === "coins") {
        return `pickup:${pickup.kind}_${getPileLookIndex(pickup.kind, pickup.value)}`;
    }
    if (pickup.kind === "casket" && pickup.tier) {
        return "pickup:casket_" + pickup.tier;
    }
    if (pickup.kind === "powerUp" && pickup.powerUp) {
        const powerUp = getPowerUp(pickup.powerUp);
        return powerUp.locId !== undefined ? "loc:" + powerUp.locId : "obj:" + powerUp.objId;
    }
    return "pickup:" + pickup.kind;
}

// The dwarf multicannon, set up
const CANNON_LOC = 6;
export const CANNON_MODEL_KEY = "loc:" + CANNON_LOC;

// Hitsplat sprites (RuneLite's SpriteID): the red damage splat, the green
// poison one and the blue one for a hit that was blocked (a shield's)
export const HITSPLAT_SPRITES = { damage: 1359, poison: 1360, block: 1358 } as const;
// The game's hint arrow (headicons_hint), the yellow one that bobs over what
// you're pointed at
export const HINT_ARROW_SPRITE = 441;
// The overhead prayers (headicons), a frame each: what a boss prays against shows over its head
export const PRAYER_HEADICON_SPRITE = 440;
// Their frames: Protect from Melee, Missiles, Magic, then the pairs and all three, as bosses use
const PRAYER_HEADICON_FRAMES: Record<string, number> = {
    melee: 0,
    ranged: 1,
    magic: 2,
    "magic,ranged": 6,
    "melee,ranged": 7,
    "magic,melee": 8,
    "magic,melee,ranged": 9,
};
export const PRAYER_HEADICON_FRAME_IDS = [...new Set(Object.values(PRAYER_HEADICON_FRAMES))];

// The overhead prayer frame for praying against these styles, if there's one
export function getPrayerHeadicon(styles: readonly string[]): number | undefined {
    return PRAYER_HEADICON_FRAMES[[...styles].sort().join(",")];
}

// The sprites the game view draws, which loadSprites loads as the game starts
export const GAME_VIEW_SPRITES: readonly number[] = [
    ...Object.values(HITSPLAT_SPRITES),
    HINT_ARROW_SPRITE,
];

// Every interface sprite the game shows: the game view's, the title screen's tabs and cloud
// save's button, the sound's orb, the checkboxes, empty equipment slots, the skills' refund
// button, co-op's flags and the overhead prayers (every frame comes with the first) and the
// passives with a sprite for an icon. The slim cache keeps these and no others, so a sprite the
// game shows has to be in here.
export function getGameSpriteIds(): number[] {
    const ids = [
        ...GAME_VIEW_SPRITES,
        PRAYER_HEADICON_SPRITE,
        ...Object.values(TITLE_TAB_SPRITES),
        ...Object.values(CLOUD_SAVE_SPRITES),
        ...Object.values(SOUND_ORB_SPRITES),
        ...Object.values(CHECKBOX_SPRITES),
        ...Object.values(CLOSE_SPRITES),
        ...GEAR_SLOTS.map((slot) => slot.iconSpriteId),
        REFUND_SPRITE,
        FLAG_SPRITE,
        ...STAT_ICON_SPRITE_IDS,
        ...PASSIVES.flatMap((passive) =>
            passive.iconSpriteId !== undefined ? [passive.iconSpriteId] : [],
        ),
        // The invocation boards (the Tombs and a run's): each icon lit and dark, and Amascut's faces
        ...[...INVOCATIONS, ...RUN_INVOCATIONS].flatMap((invocation) => [
            invocation.icon,
            invocation.icon + OFF_SPRITE,
        ]),
        ...Object.values(RAID_BAND_SPRITES),
    ];
    return [...new Set(ids)];
}

// Every spot animation the content uses, plus the fixed ones (cannonball,
// level up fireworks, a frozen player's ice, the bot nuke's explosions, the
// Amulet of blood fury's heal, a random event's visitor coming and going, a
// co-op revive's emote)
export function getSpotAnimIds(): number[] {
    const ids = new Set<number>([
        53,
        199,
        FREEZE_SPOTANIM,
        NUKE_SPOTANIM,
        BLOOD_FURY_SPOTANIM,
        VISITOR_SPOTANIM,
        REVIVE_SPOTANIM,
        // GALLERY-TEMP
        318,
        713,
        2699,
        451,
        157,
        3049,
        347,
        1745,
        1207,
        1221,
        2315,
        3406,
        3588,
        2056,
        1356,
    ]);
    const add = (...spotAnims: (number | undefined)[]) => {
        for (const id of spotAnims) {
            if (id !== undefined) {
                ids.add(id);
            }
        }
    };
    for (const character of CHARACTERS) {
        add(character.overheadSpotAnim);
    }
    for (const weapon of WEAPONS) {
        for (const level of weapon.levels) {
            add(level.castSpotAnim, level.projectileSpotAnim, level.impactSpotAnim);
        }
        add(
            weapon.special?.spotAnim,
            weapon.lifesteal?.spotAnim,
            weapon.siphon?.projectileSpotAnim,
        );
        add(
            weapon.chain?.spotAnim,
            weapon.breach?.spotAnim,
            weapon.souls?.harvest.spotAnim,
            weapon.heavy?.hit?.spotAnim,
        );
        add(...(weapon.boltProcs?.procs.map((p) => p.spotAnim) ?? []));
    }
    for (const thrall of THRALLS) {
        add(thrall.projectileSpotAnim, thrall.impactSpotAnim);
    }
    for (const { effect } of POWER_UPS) {
        add("spotAnim" in effect ? effect.spotAnim : undefined);
    }
    // Apmeken's issues
    add(...Object.values(APMEKEN_SPOTANIMS));
    // Ba-Ba's sarcophagi's blasts, which are no attack of hers
    add(SARCOPHAGUS_BLAST.spotAnim);
    // The Het room's beam, along and across, and where it stops
    add(HET.beamSpotAnims.across, HET.beamSpotAnims.along, HET.beamSpotAnims.impact);
    // Kephri's shield (up, and taking a swarm), her flies, dung coming down, her eggs going
    // off, the Arcane Scarab's charge, and what her specials' shards are drawn as
    add(
        TOMBS_SPOTANIMS.kephriShield,
        TOMBS_SPOTANIMS.kephriShieldSwarm,
        KEPHRI.dung.spotAnim,
        KEPHRI.dung.dropSpotAnim,
        KEPHRI.eggs.spotAnim,
    );
    add(KEPHRI.arcane.spotAnim, TOMBS_SPOTANIMS.arcaneCharge);
    add(KEPHRI_ARCANE_BLAST.shards?.spotAnim, KEPHRI_EGG_BLAST.shards?.spotAnim);
    // The Crondis room's poison, pale and dark, and its water poured
    add(CRONDIS.spotAnims.pale, CRONDIS.spotAnims.dark, CRONDIS.spotAnims.pour);
    // The Wardens: their seals as they discharge, their shots and where those land, and the one
    // that loses blowing up
    add(
        ...Object.values(WARDENS.wardens).flatMap((w) => [
            w.pyramidsSpotAnim,
            w.shotSeal,
            w.shotSpotAnim,
        ]),
        WARDENS.shot.impactSpotAnim,
        TOMBS_SPOTANIMS.wardenBlowsUp,
    );
    // The obelisk's specials in the second phase (their warning rings, glows and strikes, its
    // skulls and their shadows), and in the last, the siphons' skulls and beams, the phantoms
    // coming, and the enraged lightning and its shadows
    const { beam, windmill, skulls } = WARDENS.two;
    add(beam.warnSpotAnim, beam.spotAnim, windmill.warnSpotAnim, windmill.glowSpotAnim);
    add(windmill.spotAnim, skulls.warnSpotAnim, skulls.projectile, skulls.shadowSpotAnim);
    add(skulls.spotAnim, WARDENS.three.siphon.beamSpotAnim, WARDENS.three.siphon.skull);
    add(WARDENS.three.phantomSpotAnim);
    // The Het room's circles to stand in, and the glow under a loose mirror
    add(HET.circleSpotAnim);
    add(WARDENS.three.enrage.lightning.shadowSpotAnim, WARDENS.three.enrage.lightning.spotAnim);
    // Zebak's roar, and his jugs breaking and splashing
    add(ZEBAK.roar.spotAnim, ZEBAK.jugs.breakSpotAnim, ZEBAK.jugs.splashSpotAnim);
    // The Scabaras room's falling roof
    add(SCABARAS.rockSpotAnim);
    // Akkha's quadrants' elements, which are no attack of his
    add(...AKKHA.elements.map((element) => element.spotAnim));
    const addImpact = (impact: ImpactDef | undefined) => {
        add(...(impact?.spots ?? []).map((spot) => spot.spotAnim), impact?.trail?.spotAnim);
    };
    for (const map of MAPS) {
        addImpact(map.fight?.ability?.impact);
    }
    // The Tombs' button
    for (const map of ALL_MAPS) {
        addImpact(map.tombs?.ability?.impact);
    }
    // A hero's own buttons (CharacterDef.abilities): what they land as, and mark first
    for (const character of CHARACTERS) {
        for (const ability of character.abilities ?? []) {
            addImpact(ability.impact);
            add(ability.spotAnim, ability.markSpotAnim, ability.cellImpact?.spotAnim);
        }
    }
    for (const map of ALL_MAPS) {
        // What a cut through a map's roots throws up (MapDef.rule)
        // and the ripple as a map of two worlds turns; under the cold, a vent's puff and a relight
        const rule = map.rule;
        if (rule?.kind === "roots") {
            add(rule.look.cutSpotAnim);
        } else if (rule?.kind === "realm") {
            add(rule.look.flipSpotAnim);
        } else if (rule?.kind === "cold") {
            add(rule.look.relightSpotAnim, rule.look.puffSpotAnim);
        }
        // What comes down on a hero as they're blessed (MapDef.blessings)
        add(map.blessings?.spotAnim);
        // Its lairs' seals going out (LairDef.seal.smoke), and their heals (LairDef.heals)
        add(...(map.lairs ?? []).map((lair) => lair.seal.smoke));
        add(...(map.lairs ?? []).map((lair) => lair.heals?.spotAnim));
        // What plays in its cinematics (MapDef.cinematic, a fight's parts', and its lairs')
        add(...getMapCinematics(map).flatMap((def) => def.cues.map((cue) => cue.spotAnim)));
        // A floor's slabs (the Wardens', and dev maps')
        add(map.floor?.slam.spotAnim, map.floor?.drop.spotAnim);
        const effects = map.floor?.effects;
        add(effects?.dust, effects?.fallDust, effects?.rock);
        // and each skin's own (FloorSkinDef.material)
        for (const skin of map.floor?.skins ?? []) {
            const { rise, fall, crack } = skin.material ?? {};
            add(rise?.spotAnim, fall?.spotAnim, crack?.spotAnim, skin.idle?.spotAnim);
        }
    }
    for (const enemy of ENEMIES) {
        add(enemy.spawnSpotAnim);
        add(...(enemy.disguise?.warning?.spotAnims ?? []));
        add(enemy.shot?.castSpotAnim, enemy.shot?.spotAnim, enemy.shot?.impactSpotAnim);
        for (const attack of enemy.boss?.attacks ?? []) {
            add(
                attack.castSpotAnim,
                attack.spotAnim,
                attack.impactSpotAnim,
                attack.shards?.spotAnim,
            );
            add(attack.ground?.spotAnim, attack.ground?.middleSpotAnim);
            // An exhumed's orb as it heals its boss, and its end as it's smothered
            add(attack.ground?.smother?.healSpotAnim, attack.ground?.smother?.smotheredSpotAnim);
            add(...(attack.impactSpotAnims ?? []));
            addImpact(attack.impact);
        }
        // A meteor falling and its shadow, and what's left of it when it's stopped; what a boss
        // raises against a gaze throws up (BossDef.gazeWard)
        for (const attack of enemy.boss?.attacks ?? []) {
            add(attack.meteor?.spotAnim, attack.meteor?.shadowSpotAnim);
            addImpact(attack.interruptedBy?.broken);
        }
        addImpact(enemy.boss?.gazeWard?.impact);
        const guard = enemy.boss?.guard;
        add(guard?.stunSpotAnim);
        addImpact(guard?.stuck);
        addImpact(guard?.resisted);
        addImpact(enemy.boss?.leash?.jump?.land);
        addImpact(enemy.boss?.intro?.land);
        addImpact(enemy.boss?.phases?.threshold?.impact);
        addImpact(enemy.boss?.phases?.threshold?.riseImpact);
        add(enemy.boss?.intro?.spotAnim, enemy.boss?.leash?.spotAnim);
        add(enemy.boss?.phases?.totems?.blastSpotAnim, enemy.boss?.phases?.threshold?.spotAnim);
        add(enemy.shield?.spotAnim, enemy.spawns?.spotAnim, enemy.heals?.spotAnim);
        add(enemy.revives?.spotAnim, enemy.splits?.spotAnim, enemy.explodes?.spotAnim);
        add(enemy.blinks?.castSpotAnim, enemy.blinks?.impactSpotAnim);
    }
    return [...ids];
}

// Items drawn flying or circling: bolts, thrown knives, and orbiting runes
function getThrownObjIds(): number[] {
    const ids = new Set<number>();
    for (const weapon of WEAPONS) {
        for (const level of weapon.levels) {
            const objId = getProjectileObjId(weapon, level);
            if (objId !== undefined) {
                ids.add(objId);
            }
        }
        for (const objId of weapon.orbitObjIds ?? []) {
            ids.add(objId);
        }
    }
    return [...ids];
}

// The animations the player does with these weapons
function getWeaponSeqs(weapons: WeaponDef[]): number[] {
    const seqs = weapons.flatMap((w) => [w.playerSeq, w.special?.playerSeq ?? -1]);
    return [...new Set(seqs.filter((id) => id !== -1))];
}

// Every animation the player does with a weapon, and the emote a co-op
// reviver performs
export function getPlayerAttackSeqs(): number[] {
    return [...new Set([...getWeaponSeqs(WEAPONS), REVIVE_SEQ])];
}

// The run poses of the weapon in the player's hand (WeaponDef.runPose), of
// the swings a look is baked with. Only its, since the sim records no other
// weapon's swing while the player moves. The look's weapon is the sim's
// (Sim.getHeldWeapon, through getCurrentAppearance) as long as nothing else
// is worn in the weapon slot, which a test checks.
export function getHeldRunPoses(
    appearance: PlayerAppearance,
    attackSeqs: number[],
): { seqId: number; frame: number }[] {
    let held = appearance.equipment[EquipSlot.WEAPON];
    if (held === undefined || held < 0) {
        return [];
    }
    // The blood-touched axe is the axe's poses
    if (held === BLOOD_SOULREAPER_AXE_OBJ) {
        held = SOULREAPER_AXE_OBJ;
    }
    return WEAPONS.flatMap((weapon) =>
        weapon.runPose !== undefined &&
        attackSeqs.includes(weapon.playerSeq) &&
        weapon.levels.some((level) => level.objId === held)
            ? [{ seqId: weapon.playerSeq, frame: weapon.runPose }]
            : [],
    );
}

// The attack animations a hero's bake needs: their weapons', and in co-op the
// reviver's emote. A new weapon changes the hero's appearanceVersion, which
// re-bakes them with its swing.
export function getRunAttackSeqs(sim: Sim, hero = sim.focus): number[] {
    const seqs = getWeaponSeqs(sim.as(hero, () => sim.weapons.map((weapon) => weapon.def)));
    return sim.heroes.length > 1 ? [...seqs, REVIVE_SEQ] : seqs;
}

// The swings of the weapons a hero's level-up choices offer that they don't
// have yet (a new weapon, or what one evolves into), to bake ahead of the pick
export function getOfferedAttackSeqs(sim: Sim, hero = sim.focus): number[] {
    const choices = sim.heroes[hero].choices;
    if (choices.length === 0) {
        return [];
    }
    const offered = choices.flatMap((choice) => {
        if (choice.kind === "newWeapon") {
            return [getWeapon(choice.weaponId)];
        }
        if (choice.kind === "evolve" || choice.kind === "hilt") {
            return [getWeapon(choice.into)];
        }
        return [];
    });
    const held = getRunAttackSeqs(sim, hero);
    return getWeaponSeqs(offered).filter((seq) => !held.includes(seq));
}

// The swings of a character's starting weapon, what a solo run starts with
export function getCharacterAttackSeqs(characterId: string): number[] {
    return getWeaponSeqs([getWeapon(getCharacter(characterId).startingWeapon)]);
}

// The player's look in a run: the character's outfit, the held weapon tier,
// any gear their passives add, and what they've equipped from caskets. A
// character's fixed outfit slots stay visible over that gear.
// look: the hero's own from the Wardrobe, only for show.
export function getRunAppearance(
    sim: Sim,
    hero = sim.focus,
    look?: WardrobeLook,
): PlayerAppearance {
    return sim.as(hero, () => getCurrentAppearance(sim, hero === sim.focus, look));
}

// The Forgotten Four's first clean clear (SaveData.gauntlet): this player's Soulreaper axe and
// fighting pets blood-touched (setGauntletLooks). Only their own hero's, in co-op.
let gauntletLooks = false;

export function hasBloodLooks(): boolean {
    return gauntletLooks;
}

// From the save (hasGauntletLooks): a hero baked from now on, and the pets drawn
export function setGauntletLooks(on: boolean): void {
    gauntletLooks = on;
}

function getCurrentAppearance(
    sim: Sim,
    own: boolean,
    look: WardrobeLook | undefined,
): PlayerAppearance {
    const appearance = getCharacterAppearance(sim.characterId, look);
    const held = sim.getHeldObjId();
    if (held !== -1) {
        appearance.equipment[EquipSlot.WEAPON] =
            held === SOULREAPER_AXE_OBJ && gauntletLooks && own ? BLOOD_SOULREAPER_AXE_OBJ : held;
    }
    for (const passive of sim.passives) {
        const def = getPassive(passive.id);
        for (const piece of def.equipment ?? []) {
            // Levels past the last (endless runs) wear the last level's
            const level = Math.min(passive.level, piece.objIds.length);
            const objId = piece.objIds[level - 1] ?? -1;
            if (objId !== -1) {
                appearance.equipment[piece.slot] = objId;
            }
        }
    }
    for (const [slot, itemId] of Object.entries(sim.gear)) {
        const equipSlot = GEAR_SLOT_BY_ID.get(slot as GearSlot)?.equipSlot;
        if (equipSlot !== undefined) {
            appearance.equipment[equipSlot] = getItem(itemId).objId;
        }
    }
    const character = getCharacter(sim.characterId);
    if (look?.overGear && wearsWardrobe(character)) {
        applyOutfit(appearance, look.outfit);
    }
    if (character.fixedOutfit) {
        for (const [slot, objId] of Object.entries(character.equipment)) {
            if (objId !== undefined) {
                appearance.equipment[Number(slot)] = objId;
            }
        }
    }
    return appearance;
}

// The player's look in each power-up that has one, baked alongside them. The
// shield comes off by hand: wearing an item only hides body parts.
export function getPowerUpLookRequests(appearance: PlayerAppearance): BakeRequest[] {
    return POWER_UPS.flatMap(({ id, look }): BakeRequest[] => {
        if (!look) {
            return [];
        }
        const equipment = appearance.equipment.slice();
        equipment[EquipSlot.WEAPON] = look.objId;
        equipment[EquipSlot.SHIELD] = -1;
        return [
            {
                kind: "player",
                key: "player:" + id,
                appearance: { ...appearance, equipment },
                seqIds: [look.idleSeq, look.moveSeq],
            },
        ];
    });
}

// The baked model for an enemy: its NPC, or the outfit it wears (the fun
// maps' players, one model per outfit)
export function getEnemyModelKey(def: EnemyDef, variant: number): string {
    // A look of its (EnemyDef.looks) past the first is its own model; the first is npcId's
    return def.outfits || (def.looks && variant > 0) ? `npc:${def.id}:${variant}` : "npc:" + def.id;
}

// A floor with no skins of its own draws the slam's slab (FloorView); this is it, for its top
export function DEFAULT_FLOOR_SKIN(floor: { slam: { spotAnim: number } }): FloorSkinDef {
    return { spotAnim: floor.slam.spotAnim };
}

// A map's roots' scenery (RootsRuleDef.look, client/RootsView.ts), with the look's colours swapped
export function getRootLookKey(locId: number, look: RootsRuleDef["look"]): string {
    return "rootlook:" + JSON.stringify([locId, look.recolor ?? []]);
}

// A map of two worlds' puddle or portal (RealmRuleDef.look), or the cold's braziers, gas and ice
// block (ColdRuleDef.look): a rule's locs the game draws, animated
export function getRealmLocKey(locId: number): string {
    return "realmloc:" + locId;
}

// An NPC posed on a map (MapDef.props), or one in its opening cinematic (MapDef.cinematic)
export function getPropKey(npcId: number): string {
    return "prop:" + npcId;
}

// A lair's seal (MapDef.lair), burning: its own key, as the same loc may be baked still elsewhere
export function getLairSealKey(locId: number): string {
    return "lairSeal:" + locId;
}

// A boss's pool (BossAttackDef.pool), on its own animation (a fire flickers): its own key, as the
// same loc may be baked still elsewhere
export function getPoolKey(locId: number): string {
    return "pool:" + locId;
}

// A hero drawn as an NPC (CharacterDef.npcLook)
export function getHeroLookKey(characterId: string): string {
    return "heroLook:" + characterId;
}

// What a polymorph power-up turns enemies into (EnemyPolymorph's look and variant)
export function getPolymorphKey(powerUpId: string, look: PolymorphKind, variant: number): string {
    return `polymorph:${powerUpId}:${look}:${variant}`;
}

// What runs out of a polymorph's penguin (PolymorphEscapees)
export function getPolymorphEscapeeKey(powerUpId: string): string {
    return `polymorph:${powerUpId}:escapee`;
}

// A piece of what's under a floor (FloorDef.under)
export function getFloorPieceKey(locId: number): string {
    return "floorpiece:" + locId;
}

// A floor's tile skin (FloorDef.skins): what it's baked from is all there is to it
export function getFloorSkinKey(skin: FloorSkinDef): string {
    const { spotAnim, loc, model, recolor, retexture, scale } = skin;
    return "floorskin:" + JSON.stringify([spotAnim, loc, model, recolor, retexture, scale]);
}

// The same, its top alone, for a tile at rest among others (FloorView: none of its sides show)
export function getFloorLidKey(skin: FloorSkinDef): string {
    return getFloorSkinKey(skin) + ":top";
}

function getFloorSkinRequest(skin: FloorSkinDef, topOnly = false): BakeRequest {
    return {
        kind: "model",
        key: topOnly ? getFloorLidKey(skin) : getFloorSkinKey(skin),
        topOnly,
        spotAnimId: skin.spotAnim,
        locId: skin.loc,
        modelId: skin.model,
        recolor: skin.recolor,
        retexture: skin.retexture,
        scale: skin.scale,
        // A spot animation's baked with its own animation even when it rises in code: its first
        // frame is it at rest (the Wardens' slab's model unposed is nowhere near)
        still: skin.spotAnim === undefined,
    };
}

// The baked model of a statue a boss fight draws and animates (BossAttackDef.statues)
export function getStatueModelKey(locId: number): string {
    return "statue:" + locId;
}

// The statues (and jets) a boss's attacks animate, by loc, with their animations
export function getStatueSeqs(enemy: EnemyDef): Map<number, number[]> {
    const seqs = new Map<number, number[]>();
    const add = (locId: number, ...ids: (number | undefined)[]) => {
        const list = seqs.get(locId) ?? [];
        for (const id of ids) {
            if (id !== undefined && id !== -1 && !list.includes(id)) {
                list.push(id);
            }
        }
        seqs.set(locId, list);
    };
    for (const attack of enemy.boss?.attacks ?? []) {
        const statues = attack.statues;
        if (statues) {
            add(statues.locId, statues.windupSeq, statues.seq, attack.boomerang?.catchSeq);
        }
        const cycle = attack.cycle;
        if (cycle) {
            add(cycle.locId, cycle.seqs.warn, cycle.seqs.burn, cycle.seqs.out);
        }
    }
    return seqs;
}

// The baked model for an enemy's look while shielded (EnemyDef.shield.look)
export function getShieldedModelKey(def: EnemyDef): string {
    return "npc:" + def.id + ":shielded";
}

// A player look for one of an enemy's outfits
export function getOutfitAppearance(outfit: EnemyOutfit): PlayerAppearance {
    const appearance = createAppearance(outfit.equipment);
    if (outfit.colors) {
        appearance.colors = outfit.colors.slice();
    }
    return appearance;
}

// The Wardrobe's body with nothing on, not even a weapon
export function getBareAppearance(look?: WardrobeLook): PlayerAppearance {
    const appearance = createAppearance();
    applyBody(appearance, look?.body);
    return appearance;
}

// An adventurer's look, in the player's own body and outfit from the Wardrobe (look) unless
// they're someone in particular (wearsWardrobe)
export function getCharacterAppearance(characterId: string, look?: WardrobeLook): PlayerAppearance {
    const character = getCharacter(characterId);
    const appearance = createAppearance(character.equipment);
    if (look && wearsWardrobe(character)) {
        applyBody(appearance, look.body);
        applyOutfit(appearance, look.outfit);
    }
    if (character.kits) {
        appearance.kits = character.kits.slice();
    }
    if (character.colors) {
        appearance.colors = character.colors.slice();
    }
    return appearance;
}

// Spot animations, items and scenery baked in one task: small, and there are
// hundreds of them in the base bake
const SMALL_BAKE_BATCH = 64;

// Everything a request's bake depends on but its key and animations: requests
// with the same body and first animation bake the same model. An NPC goes by
// its look, so a boss's forms that are ids of their own (the Wardens', Akkha's)
// are baked once (content/npcLooks.ts).
function getRequestBody(request: BakeRequest): string {
    switch (request.kind) {
        case "npc":
            return `npc:${SAME_NPC_LOOK[request.npcId] ?? request.npcId}:${request.seqIds[0]}`;
        case "player":
            return `player:${getAppearanceKey(request.appearance)}:${request.seqIds[0]}`;
        case "spotanim":
            return `spotanim:${request.spotAnimId}`;
        case "obj":
            return `obj:${request.objId}:${request.count}`;
        case "model":
            return request.key;
        case "loc":
            // A statue's (seqs) isn't plain scenery
            return `loc:${request.locId}:${request.animated ? 1 : 0}${request.seqs ? ":" + request.seqs.join(",") : ""}`;
    }
}

// A player's model, with the stance and power-up looks baked along with it
type PlayerBake = {
    key?: string;
    model?: ActorModel;
    stance: PlayerStance;
    looks: Map<string, ActorModel>;
    pendingKey?: string;
};

// A look's key: its appearance, and the swings it's baked with, in any order
export function getLookKey(appearance: PlayerAppearance, attackSeqs: number[]): string {
    return getAppearanceKey(appearance) + "|" + [...attackSeqs].sort((a, b) => a - b).join(",");
}

// Whether a look's key is this appearance with at least these swings
export function lookHas(
    key: string | undefined,
    appearanceKey: string,
    attackSeqs: number[],
): boolean {
    if (!key?.startsWith(appearanceKey + "|")) {
        return false;
    }
    const baked = key
        .slice(appearanceKey.length + 1)
        .split(",")
        .map(Number);
    return attackSeqs.every((seq) => baked.includes(seq));
}

// All the models a run draws, baked up front, and the players' models (one
// for each in co-op, by hero), re-baked whenever their gear changes.
export class GameAssets {
    readonly models = new Map<string, ActorModel>();
    // Cache sprites by id, for the 2D overlay
    // By sprite and frame ("id:frame")
    readonly sprites = new Map<string, HTMLCanvasElement>();

    private readonly players: PlayerBake[] = [];
    // Looks being baked, by appearance key: players who look alike (all the
    // same adventurer, on some fun maps) share one bake and one model
    private readonly bakingLooks = new Map<
        string,
        Promise<{ models: Map<string, ActorModel>; stance: PlayerStance }>
    >();
    // The current map's enemies: their pages, the keys the run wants (loadEnemies: a page with
    // none of them is freed, and a bake that lands after it's stopped being wanted is let go),
    // and the keys being baked, each to its bake
    private enemyPages: ActorPage[] = [];
    private wantedEnemies = new Set<string>();
    private readonly bakingEnemies = new Map<string, Promise<void>>();
    private readonly requestedEnemies = new Set<string>();
    // Pets baked or being baked, by id. They're kept once they are.
    private readonly petBakes = new Map<string, Promise<void>>();
    // Heroes drawn as NPCs (CharacterDef.npcLook) baked or being baked, by id
    private readonly heroLookBakes = new Map<string, Promise<void>>();
    // Maps' props, cinematic casts and lairs' locs baked or being baked, by model key (getPropKey,
    // getLairSealKey)
    private readonly propBakes = new Map<string, Promise<void>>();

    constructor(
        readonly workerPool: RenderDataWorkerPool,
        readonly renderer: GameWebGLRenderer,
        readonly actors: ActorRenderer,
    ) {}

    // One enemy's models: its NPC, or one per outfit, and its shielded look
    private static getEnemyBakes(enemy: EnemyDef): BakeRequest[] {
        const seqIds = [
            enemy.walkSeq,
            enemy.idleSeq,
            enemy.attackSeq,
            enemy.deathSeq,
            enemy.jumpSeq ?? -1,
            enemy.shot?.seq ?? -1,
            enemy.revives?.seq ?? -1,
            enemy.blinks?.seq ?? -1,
            enemy.blinks?.surface?.seq ?? -1,
            enemy.echoes?.seq ?? -1,
            ...(enemy.boss?.attacks.map((a) => a.seq ?? -1) ?? []),
            enemy.boss?.intro?.seq ?? -1,
            enemy.boss?.surgeSeq ?? -1,
            enemy.boss?.leash?.jump?.downSeq ?? -1,
            enemy.boss?.leash?.jump?.upSeq ?? -1,
            enemy.boss?.phases?.threshold?.seq ?? -1,
            enemy.boss?.phases?.threshold?.riseSeq ?? -1,
            ...getTombsFightSeqs(enemy.id),
        ].filter((id, i, all) => id !== -1 && all.indexOf(id) === i);
        if (enemy.outfits) {
            return enemy.outfits.map(
                (outfit, variant): BakeRequest => ({
                    kind: "player",
                    key: getEnemyModelKey(enemy, variant),
                    appearance: getOutfitAppearance(outfit),
                    seqIds,
                }),
            );
        }
        const requests: BakeRequest[] = [
            // An item's model stands still, under the same key the view asks for
            enemy.objId !== undefined
                ? { kind: "obj", key: "npc:" + enemy.id, objId: enemy.objId, count: 1 }
                : { kind: "npc", key: "npc:" + enemy.id, npcId: enemy.npcId, seqIds },
        ];
        // Its other looks, with the same animations
        enemy.looks?.forEach((npcId, variant) => {
            if (variant > 0) {
                requests.push({
                    kind: "npc",
                    key: getEnemyModelKey(enemy, variant),
                    npcId,
                    seqIds,
                });
            }
        });
        const shielded = enemy.shield?.look;
        if (shielded) {
            requests.push({
                kind: "npc",
                key: getShieldedModelKey(enemy),
                npcId: shielded.npcId,
                seqIds: [shielded.idleSeq],
            });
        }
        // Scenery its attacks grow, here rather than in what every run bakes
        for (const attack of enemy.boss?.attacks ?? []) {
            if (attack.projectileObjId !== undefined) {
                requests.push({
                    kind: "obj",
                    key: "obj:" + attack.projectileObjId,
                    objId: attack.projectileObjId,
                    count: 1,
                });
            }
            const quarters = attack.quarters;
            for (const locId of [
                quarters?.safeLocId,
                quarters?.hurtLocId,
                attack.ground?.locId,
                attack.debris?.locId,
            ]) {
                if (locId !== undefined) {
                    requests.push({ kind: "loc", key: "loc:" + locId, locId, animated: true });
                }
            }
        }
        // The arena's statues and jets its attacks animate (BossAttackDef.statues,
        // cycle), standing still and with each animation
        for (const [locId, seqIds] of getStatueSeqs(enemy)) {
            requests.push({
                kind: "loc",
                key: getStatueModelKey(locId),
                locId,
                seqs: [-1, ...seqIds],
            });
        }
        return requests;
    }

    static getEnemyRequests(enemies: EnemyDef[]): BakeRequest[] {
        return enemies.flatMap((enemy) => GameAssets.getEnemyBakes(enemy));
    }

    // A hero drawn as an NPC (CharacterDef.npcLook, Justiciar Zachariah's): baked with the map
    // that has everyone play them (travelTo), not with every run
    static getHeroLookRequests(characters: readonly CharacterDef[]): BakeRequest[] {
        return characters.flatMap((character): BakeRequest[] =>
            character.npcLook
                ? [
                      {
                          kind: "npc",
                          key: getHeroLookKey(character.id),
                          npcId: character.npcLook.npcId,
                          seqIds: getHeroNpcSeqs(character),
                      },
                  ]
                : [],
        );
    }

    // Pets aren't in every run's bake, as most players haven't found one: they're baked as
    // they're picked, and for a co-op party, the party's
    static getPetRequests(pets: readonly PetDef[]): BakeRequest[] {
        return pets.map((pet) => ({
            kind: "npc",
            key: getPetModelKey(pet.id),
            npcId: pet.npcId,
            seqIds: [...new Set([pet.idleSeq, pet.walkSeq])],
        }));
    }

    // Requests that would bake the same model, as one: several enemies can be
    // one NPC (Nex's four phases), the same outfit, or grow the same scenery.
    // The merged request has all of their animations, under the first one's
    // key, and the others' keys point to it. Only requests whose first
    // animation is the same merge, since that's where a model's height is from.
    static mergeRequests(requests: BakeRequest[]): {
        requests: BakeRequest[];
        aliases: Map<string, string>;
    } {
        const merged = new Map<string, BakeRequest>();
        const aliases = new Map<string, string>();
        for (const request of requests) {
            const body = getRequestBody(request);
            const into = merged.get(body);
            if (!into) {
                merged.set(
                    body,
                    "seqIds" in request ? { ...request, seqIds: request.seqIds.slice() } : request,
                );
                continue;
            }
            if ("seqIds" in into && "seqIds" in request) {
                for (const seqId of request.seqIds) {
                    if (!into.seqIds.includes(seqId)) {
                        into.seqIds.push(seqId);
                    }
                }
            }
            if (request.key !== into.key) {
                aliases.set(request.key, into.key);
            }
        }
        return { requests: [...merged.values()], aliases };
    }

    // What every run needs. Enemies are baked for the map (loadEnemies): they
    // take up most of the memory, and a map only uses a few of them.
    static getBaseRequests(): BakeRequest[] {
        const requests: BakeRequest[] = [];
        for (const id of getSpotAnimIds()) {
            requests.push({ kind: "spotanim", key: "spot:" + id, spotAnimId: id });
        }
        // A map's roots (MapDef.rule, client/RootsView.ts), their colours swapped
        const rootLooks = new Set<string>();
        const realmLocs = new Set<number>();
        for (const map of ALL_MAPS) {
            // A map of two worlds' puddles and portal (RealmRuleDef.look), as they move
            if (map.rule?.kind === "realm") {
                realmLocs.add(map.rule.look.puddleLocId).add(map.rule.look.portalLocId);
            }
            // The cold's braziers, lit and out, its vents' gas and the ice block (ColdRuleDef.look)
            if (map.rule?.kind === "cold") {
                const cold = map.rule.look;
                realmLocs.add(cold.brazierLocId).add(cold.fireLocId).add(cold.gasLocId);
                realmLocs.add(cold.iceBlockLocId).add(cold.embersLocId);
            }
            const look = map.rule?.kind === "roots" ? map.rule.look : undefined;
            for (const locId of [...(look?.runners ?? []), ...(look?.loops ?? [])]) {
                const key = getRootLookKey(locId, look!);
                if (!rootLooks.has(key)) {
                    rootLooks.add(key);
                    requests.push({ kind: "model", key, locId, recolor: look!.recolor });
                }
            }
        }
        // The remixes' fires in the dark and ice (content/remixes.ts)
        realmLocs.add(REMIX_FIRE_LOC).add(REMIX_ICE_LOC);
        for (const locId of realmLocs) {
            requests.push({ kind: "loc", key: getRealmLocKey(locId), locId, animated: true });
        }
        // The tree an adventurer's trait fells (CharacterDef.trait)
        const traitLocs = new Set<number>();
        for (const character of CHARACTERS) {
            if (character.trait?.kind === "timber") {
                traitLocs.add(character.trait.locId);
            }
        }
        for (const locId of traitLocs) {
            requests.push({ kind: "loc", key: "loc:" + locId, locId });
        }
        // The wreck a fight stands round its boss (ArenaFeatures.wreckage), drawn as its debris
        const wreckLocs = new Set(
            ALL_MAPS.flatMap((map) => map.features?.wreckage ?? []).map((wreck) => wreck.locId),
        );
        for (const locId of wreckLocs) {
            requests.push({ kind: "loc", key: "loc:" + locId, locId, animated: true });
        }
        // What's under a floor (the Wardens', as its slabs are)
        for (const map of ALL_MAPS) {
            for (const locId of Object.values(map.floor?.under ?? {})) {
                requests.push({ kind: "loc", key: getFloorPieceKey(locId), locId });
            }
            for (const skin of map.floor?.skins ?? []) {
                requests.push(getFloorSkinRequest(skin), getFloorSkinRequest(skin, true));
            }
            // The slam's own slab, for a floor with no skins of its own
            if (map.floor && !map.floor.skins) {
                requests.push(getFloorSkinRequest(DEFAULT_FLOOR_SKIN(map.floor), true));
            }
        }
        for (const [kind, objId] of Object.entries(PICKUP_OBJS)) {
            requests.push({ kind: "obj", key: "pickup:" + kind, objId, count: 1 });
        }
        for (const [kind, looks] of Object.entries(PILE_LOOKS)) {
            looks.forEach(({ objId, count }, i) => {
                requests.push({ kind: "obj", key: `pickup:${kind}_${i}`, objId, count });
            });
        }
        for (const casket of Object.values(CASKETS)) {
            requests.push({
                kind: "obj",
                key: "pickup:casket_" + casket.tier,
                objId: casket.objId,
                count: 1,
            });
        }
        for (const thrall of THRALLS) {
            requests.push({
                kind: "npc",
                key: "thrall:" + thrall.id,
                npcId: thrall.npcId,
                seqIds: [thrall.idleSeq, thrall.walkSeq, thrall.attackSeq],
            });
        }
        for (const { id, effect } of POWER_UPS) {
            if (effect.kind === "rampage") {
                requests.push({
                    kind: "npc",
                    key: "rampage:" + id,
                    npcId: effect.npcId,
                    seqIds: [effect.walkSeq],
                });
            } else if (effect.kind === "polymorph") {
                for (const { look, variant, def } of getPolymorphLooks(effect)) {
                    requests.push({
                        kind: "npc",
                        key: getPolymorphKey(id, look, variant),
                        npcId: def.npcId,
                        seqIds: [
                            def.idleSeq,
                            def.walkSeq,
                            def.deathSeq,
                            def.attackSeq ?? -1,
                        ].filter((s) => s !== -1),
                    });
                }
                const { npcId, walkSeq } = effect.penguin.escapees;
                requests.push({
                    kind: "npc",
                    key: getPolymorphEscapeeKey(id),
                    npcId,
                    seqIds: [walkSeq],
                });
            }
        }
        // The visitors, and the Tombs' Helpful Spirit drawn as one
        for (const { id, npcId, idleSeq } of [...RANDOM_EVENTS, TOMBS_SPIRIT]) {
            if (npcId !== undefined && idleSeq !== undefined) {
                requests.push({ kind: "npc", key: "visitor:" + id, npcId, seqIds: [idleSeq] });
            }
        }
        const objIds = new Set(getThrownObjIds());
        // The Soulreaper axe's souls (GameView.drawSouls): soul runes
        objIds.add(566);
        const locIds = new Set([CANNON_LOC]);
        const poolLocIds = new Set<number>();
        for (const enemy of ENEMIES) {
            for (const attack of enemy.boss?.attacks ?? []) {
                if (attack.pool) {
                    poolLocIds.add(attack.pool.locId);
                }
            }
        }
        for (const locId of poolLocIds) {
            requests.push({ kind: "loc", key: getPoolKey(locId), locId, animated: true });
        }
        for (const powerUp of POWER_UPS) {
            if (powerUp.locId !== undefined) {
                locIds.add(powerUp.locId);
            } else {
                objIds.add(powerUp.objId);
            }
            if ("locId" in powerUp.effect) {
                locIds.add(powerUp.effect.locId);
            }
        }
        // The Tombs of Amascut's
        // Jungle Japes's banana peels
        objIds.add(JUNGLE_JAPES.objId);
        // Ba-Ba's sarcophagi, open
        locIds.add(SARCOPHAGI.loc);
        // Zebak's acid
        locIds.add(ZEBAK.acid.loc);
        // The Crondis room's spears
        locIds.add(CRONDIS.locs.spear);
        // Kephri's dung, a wall where it's dropped
        locIds.add(KEPHRI.dung.pileLoc);
        // The Scabaras room's plates, as they stand
        const { locs: scabaras } = SCABARAS;
        for (const id of [
            scabaras.plate,
            scabaras.lightsPlate,
            scabaras.tablet,
            scabaras.button,
            ...scabaras.symbols,
            ...scabaras.shown,
        ]) {
            locIds.add(id);
        }
        // The Wardens' charging platforms, empty to full
        for (const id of WARDENS.charge.platforms) {
            locIds.add(id);
        }
        // The Het room's mirrors (clean, dirty, fixed), their spots and its barriers
        locIds.add(HET.mirrorLoc);
        locIds.add(HET.dirtyLoc);
        locIds.add(HET.fixedLoc);
        locIds.add(HET.spotLoc);
        locIds.add(HET.barrierLoc);
        locIds.add(HET.wornLoc);
        for (const objId of objIds) {
            requests.push({ kind: "obj", key: "obj:" + objId, objId, count: 1 });
        }
        for (const locId of locIds) {
            requests.push({ kind: "loc", key: "loc:" + locId, locId });
        }
        // The Tombs' barriers, glowing
        requests.push({
            kind: "loc",
            key: "loc:" + APMEKEN_BARRIER_LOC,
            locId: APMEKEN_BARRIER_LOC,
            animated: true,
        });

        // The Crondis room's waterfalls, running and dry
        for (const id of [CRONDIS.locs.waterfall, CRONDIS.locs.dry]) {
            requests.push({ kind: "loc", key: "loc:" + id, locId: id, animated: true });
        }

        // The Scabaras room's plates' glows
        for (const id of [
            SCABARAS.locs.plateLit,
            SCABARAS.locs.platePressed,
            SCABARAS.locs.lightsOn,
            SCABARAS.locs.stepped,
            SCABARAS.locs.matched,
        ]) {
            requests.push({ kind: "loc", key: "loc:" + id, locId: id, animated: true });
        }

        // The Wardens' pyramids, glowing
        for (const { pyramid } of Object.values(WARDENS.wardens)) {
            requests.push({
                kind: "loc",
                key: "loc:" + pyramid,
                locId: pyramid,
                animated: true,
            });
        }

        // Akkha's symbols, glowing
        for (const { symbolLoc } of AKKHA.elements) {
            requests.push({
                kind: "loc",
                key: "loc:" + symbolLoc,
                locId: symbolLoc,
                animated: true,
            });
        }

        // A raid hall's teleporter, swirling
        requests.push({
            kind: "loc",
            key: "loc:" + RAID_PORTAL_LOC,
            locId: RAID_PORTAL_LOC,
            animated: true,
        });
        // Fire flickers, so it's baked on its own animation
        for (const { burns } of WEAPONS) {
            if (burns) {
                requests.push({
                    kind: "loc",
                    key: "loc:" + burns.locId,
                    locId: burns.locId,
                    animated: true,
                });
            }
        }
        return requests;
    }

    // Bakes every frame whole, sharing no meshes (?wholeFrames): to compare with, or to rule
    // shared meshes out if a GPU draws actors wrong
    wholeFrames =
        typeof location !== "undefined" && new URLSearchParams(location.search).has("wholeFrames");

    private async bake(requests: BakeRequest[]): Promise<ActorBakeResult> {
        return await this.workerPool.queueLoad<ActorBakeInput, ActorBakeResult, ActorBakeLoader>(
            new ActorBakeLoader(),
            {
                requests,
                loadedTextureIds: this.renderer.loadedTextureIds,
                wholeFrames: this.wholeFrames || undefined,
            },
        );
    }

    private addBake(bake: ActorBakeResult): Map<string, ActorModel> {
        this.renderer.updateTextureArray(bake.loadedTextures);
        const models = this.actors.addBake(bake);
        for (const [key, model] of models) {
            this.models.set(key, model);
        }
        return models;
    }

    async loadBase(onProgress?: (done: number, total: number) => void): Promise<void> {
        await this.bakeInTasks(GameAssets.getBaseRequests(), this.loadBake, onProgress);
    }

    // Bakes these pets (ids this game doesn't know are left out), unless they're baked already
    // or on their way. A pet that won't bake is only missing: it's never a reason to stop.
    loadPets(ids: readonly (string | undefined)[]): Promise<void> {
        const waits: Promise<void>[] = [];
        const pets: PetDef[] = [];
        for (const id of new Set(ids)) {
            const pet = id === undefined ? undefined : PET_BY_ID.get(id);
            const baking = pet && this.petBakes.get(pet.id);
            if (baking) {
                waits.push(baking);
            } else if (pet) {
                pets.push(pet);
            }
        }
        if (pets.length > 0) {
            const baking = this.bakeInTasks(GameAssets.getPetRequests(pets), this.loadBake).catch(
                (e) => console.error("Couldn't bake", pets.map((pet) => pet.id).join(", "), e),
            );
            for (const pet of pets) {
                this.petBakes.set(pet.id, baking);
            }
            waits.push(baking);
        }
        return Promise.all(waits).then(() => undefined);
    }

    // A map's NPCs posed as scenery (MapDef.props), the cast of its cinematics (its opening's, each
    // part's and its lairs') with everything they play, and its lairs' locs (getLairRequests):
    // baked as the map's travelled to
    static getPropRequests(maps: readonly MapDef[]): BakeRequest[] {
        return [...GameAssets.getPropNpcRequests(maps), ...GameAssets.getLairRequests(maps)];
    }

    // The NPCs of getPropRequests, each once, with what every one of maps plays on it
    private static getPropNpcRequests(maps: readonly MapDef[]): NpcBakeRequest[] {
        const seqs = new Map<number, number[]>();
        const add = (npcId: number, seqIds: number[]) => {
            const list = seqs.get(npcId) ?? [];
            for (const seq of seqIds) {
                if (!list.includes(seq)) {
                    list.push(seq);
                }
            }
            seqs.set(npcId, list);
        };
        for (const prop of maps.flatMap((map) => map.props ?? [])) {
            add(prop.npcId, [prop.seq]);
            // and what it's drawn as once its lair's woken (MapPropDef.awake)
            if (prop.awake) {
                add(prop.awake.npcId, [prop.awake.seq]);
            }
        }
        for (const def of maps.flatMap(getMapCinematics)) {
            for (const [npcId, seqIds] of getCinematicSeqs(def)) {
                add(npcId, seqIds);
            }
        }
        return [...seqs].map(([npcId, seqIds]) => ({
            kind: "npc",
            key: getPropKey(npcId),
            npcId,
            seqIds,
        }));
    }

    // A lair's seal, burning (MapDef.lairs), its pillars (LairDef.pillars), and the pillars its
    // boss raises against a gaze (BossDef.gazeWard)
    private static getLairRequests(maps: readonly MapDef[]): BakeRequest[] {
        const requests: BakeRequest[] = [];
        const keys = new Set<string>();
        const addLoc = (request: BakeRequest) => {
            if (!keys.has(request.key)) {
                keys.add(request.key);
                requests.push(request);
            }
        };
        for (const map of maps) {
            for (const lair of map.lairs ?? []) {
                const locId = lair.seal.locId;
                addLoc({ kind: "loc", key: getLairSealKey(locId), locId, animated: true });
                if (lair.pillars) {
                    const pillar = lair.pillars.locId;
                    addLoc({ kind: "loc", key: "loc:" + pillar, locId: pillar });
                }
                const ward = getEnemy(lair.enemyId).boss?.gazeWard;
                if (ward) {
                    addLoc({ kind: "loc", key: "loc:" + ward.locId, locId: ward.locId });
                }
            }
        }
        return requests;
    }

    // Bakes a map's props, cinematics' casts (its opening's, each part's and its lairs') and its
    // lairs' locs, unless they're baked already or on their way. Each NPC's baked once, under one
    // key, so it's baked with what every map plays on it (maps), as the slim cache has it: one
    // map's alone would leave another's animations out.
    loadProps(map: MapDef, maps: readonly MapDef[] = ALL_MAPS): Promise<void> {
        const npcIds = new Set([
            // and what a prop's drawn as once its lair's woken (MapPropDef.awake)
            ...(map.props ?? []).flatMap((prop) =>
                prop.awake ? [prop.npcId, prop.awake.npcId] : [prop.npcId],
            ),
            ...getMapCinematics(map).flatMap((cinematic) =>
                cinematic.cast.map((actor) => actor.npcId),
            ),
        ]);
        if (npcIds.size === 0 && !map.lairs) {
            return Promise.resolve();
        }
        // This map's own def first: a dev map's is made again for each run
        const requests = [
            ...GameAssets.getPropNpcRequests([
                map,
                ...maps.filter((other) => other.id !== map.id),
            ]).filter((request) => npcIds.has(request.npcId)),
            ...GameAssets.getLairRequests([map]),
        ];
        const missing = requests.filter((request) => !this.propBakes.has(request.key));
        if (missing.length > 0) {
            const baking = this.bakeInTasks(missing, this.loadBake).catch((e) =>
                console.error("Couldn't bake", map.id, "props", e),
            );
            for (const request of missing) {
                this.propBakes.set(request.key, baking);
            }
        }
        return Promise.all(requests.map((request) => this.propBakes.get(request.key))).then(
            () => undefined,
        );
    }

    // Bakes a hero's NPC look (CharacterDef.npcLook), unless it's baked or on its way
    loadHeroLook(characterId: string): Promise<void> {
        const character = getCharacter(characterId);
        if (!character.npcLook) {
            return Promise.resolve();
        }
        let baking = this.heroLookBakes.get(characterId);
        if (!baking) {
            baking = this.bakeInTasks(
                GameAssets.getHeroLookRequests([character]),
                this.loadBake,
            ).catch((e) => console.error("Couldn't bake", characterId, e));
            this.heroLookBakes.set(characterId, baking);
        }
        return baking;
    }

    // A hero's NPC look, or nothing yet: it's baked now, and shows up when it's ready
    getHeroLook(characterId: string): ActorModel | undefined {
        const model = this.models.get(getHeroLookKey(characterId));
        if (!model && !this.heroLookBakes.has(characterId)) {
            void this.loadHeroLook(characterId);
        }
        return model;
    }

    // A pet's model, or nothing yet: it's baked now, and shows up when it's ready
    getPet(id: string): ActorModel | undefined {
        const model = this.models.get(getPetModelKey(id));
        if (!model && !this.petBakes.has(id)) {
            void this.loadPets([id]);
        }
        return model;
    }

    hasEnemies(enemies: EnemyDef[]): boolean {
        return GameAssets.getEnemyRequests(enemies).every((r) => this.models.has(r.key));
    }

    // Bakes the enemies a run needs, in place of what it doesn't: what's baked and still wanted
    // stays (another map's goblins, the Tombs' Nexus from room to room), and the rest is freed
    // first, so the two lots aren't in memory together. A map played again has them already.
    // Resolves once they're all in, those already on their way too.
    async loadEnemies(
        enemies: EnemyDef[],
        onProgress?: (done: number, total: number) => void,
    ): Promise<void> {
        const requests = GameAssets.getEnemyRequests(enemies);
        this.wantedEnemies = new Set(requests.map((request) => request.key));
        this.freeUnwantedEnemies();
        const coming = requests.flatMap((request) => this.bakingEnemies.get(request.key) ?? []);
        const missing = requests.filter(
            (request) => !this.models.has(request.key) && !this.bakingEnemies.has(request.key),
        );
        await Promise.all([this.bakeEnemies(missing, onProgress), ...coming]);
    }

    // A model that isn't baked is baked now, for a run with an enemy the map's
    // list doesn't have (the console's spawnBoss). It shows up when it's ready, as one that's
    // on its way already does (a Tombs room's, before it's in).
    requestEnemy(enemy: EnemyDef): void {
        if (this.requestedEnemies.has(enemy.id)) {
            return;
        }
        this.requestedEnemies.add(enemy.id);
        const requests = GameAssets.getEnemyRequests([enemy]);
        for (const request of requests) {
            this.wantedEnemies.add(request.key);
        }
        const missing = requests.filter(
            (request) => !this.models.has(request.key) && !this.bakingEnemies.has(request.key),
        );
        if (missing.length > 0) {
            console.warn(`${enemy.id} isn't baked for this map`);
            this.bakeEnemies(missing).catch(console.error);
        }
    }

    // Frees the enemies' models (on a phone, at the title screen)
    dropEnemies(): void {
        this.wantedEnemies = new Set();
        this.freeUnwantedEnemies();
    }

    // Frees the pages with nothing on them the run wants. A page is a bake task's: one NPC's or
    // player's model, or a batch of small ones.
    private freeUnwantedEnemies(): void {
        const kept = new Set<ActorPage>();
        for (const [key, model] of this.models) {
            if (this.wantedEnemies.has(key)) {
                kept.add(model.page);
            }
        }
        const freed = new Set(this.enemyPages.filter((page) => !kept.has(page)));
        if (freed.size === 0) {
            return;
        }
        for (const page of freed) {
            this.actors.removePage(page);
        }
        for (const [key, model] of this.models) {
            if (freed.has(model.page)) {
                this.models.delete(key);
            }
        }
        this.enemyPages = this.enemyPages.filter((page) => !freed.has(page));
        // One the console spawned may be among them: asked for again, it's baked again
        this.requestedEnemies.clear();
    }

    // Each model's kept as it lands, under its own key and its aliases', if the run still wants
    // one of them; one it's stopped wanting meanwhile never goes on the GPU
    private async bakeEnemies(
        requests: BakeRequest[],
        onProgress?: (done: number, total: number) => void,
    ): Promise<void> {
        if (requests.length === 0) {
            return;
        }
        const { requests: merged, aliases } = GameAssets.mergeRequests(requests);
        const keysOf = new Map(merged.map((request) => [request.key, [request.key]]));
        for (const [alias, key] of aliases) {
            keysOf.get(key)?.push(alias);
        }
        const onBake = (bake: ActorBakeResult) => {
            const keys = bake.sets.flatMap((set) => keysOf.get(set.key) ?? [set.key]);
            if (!keys.some((key) => this.wantedEnemies.has(key))) {
                // Its textures go in anyway: the workers bake later models without them
                this.renderer.updateTextureArray(bake.loadedTextures);
                return;
            }
            const models = this.addBake(bake);
            for (const [key, model] of models) {
                for (const alias of keysOf.get(key) ?? []) {
                    this.models.set(alias, model);
                }
            }
            const [model] = models.values();
            if (model) {
                this.enemyPages.push(model.page);
            }
        };
        const baking = this.bakeInTasks(merged, onBake, onProgress).finally(() => {
            for (const request of requests) {
                if (this.bakingEnemies.get(request.key) === baking) {
                    this.bakingEnemies.delete(request.key);
                }
            }
        });
        for (const request of requests) {
            this.bakingEnemies.set(request.key, baking);
        }
        await baking;
    }

    private loadBake = (bake: ActorBakeResult): void => {
        this.addBake(bake);
    };

    // A bake in small tasks, each put on the GPU as it lands, so the main
    // thread never holds more than a few of them: baked in one go, a big map's
    // enemies were hundreds of MB at once
    private async bakeInTasks(
        requests: BakeRequest[],
        onBake: (bake: ActorBakeResult) => void,
        onProgress?: (done: number, total: number) => void,
    ): Promise<void> {
        const tasks = GameAssets.getBakeTasks(requests);
        let done = 0;
        let bytes = 0;
        const started = performance.now();
        await Promise.all(
            tasks.map(async (task) => {
                const bake = await this.bake(task);
                bytes +=
                    bake.vertices.byteLength + bake.indices.byteLength + bake.positions.byteLength;
                onBake(bake);
                onProgress?.(++done, tasks.length);
            }),
        );
        console.log(
            `baked ${requests.length} actor models in ${(performance.now() - started).toFixed(0)}ms, ` +
                `${(bytes / 1024 / 1024).toFixed(1)}MB`,
        );
    }

    // An NPC or player model to a task, the small ones (spot animations, items,
    // scenery) a batch at a time. The ones with the most animations (the
    // bosses) go first, so the workers don't end on one big model each.
    static getBakeTasks(requests: BakeRequest[]): BakeRequest[][] {
        const tasks: BakeRequest[][] = [];
        let small: BakeRequest[] = [];
        for (const request of requests) {
            if (request.kind === "npc" || request.kind === "player") {
                tasks.push([request]);
            } else {
                small.push(request);
                if (small.length === SMALL_BAKE_BATCH) {
                    tasks.push(small);
                    small = [];
                }
            }
        }
        if (small.length > 0) {
            tasks.push(small);
        }
        const animations = (task: BakeRequest[]) =>
            task.length === 1 && "seqIds" in task[0] ? task[0].seqIds.length : 0;
        return tasks.sort((a, b) => animations(b) - animations(a));
    }

    // The game view's sprites and the overhead prayers' frames, for getSprite.
    // Only these: the slim cache has what getGameSpriteIds lists.
    async loadSprites(): Promise<void> {
        const spriteIds = [
            ...GAME_VIEW_SPRITES,
            ...PRAYER_HEADICON_FRAME_IDS.map(() => PRAYER_HEADICON_SPRITE),
        ];
        const frames = [...GAME_VIEW_SPRITES.map(() => 0), ...PRAYER_HEADICON_FRAME_IDS];
        const images = await this.workerPool.queueLoad<
            SpriteDataInput,
            SpriteImage[],
            SpriteDataLoader
        >(new SpriteDataLoader(), { spriteIds, frames });
        for (const image of images) {
            if (image.width > 0 && image.height > 0) {
                this.sprites.set(image.id + ":" + image.frame, toCanvas(image));
            }
        }
    }

    get(key: string): ActorModel | undefined {
        return this.models.get(key);
    }

    // Undefined when the cache has no such sprite
    getSprite(id: number, frame = 0): HTMLCanvasElement | undefined {
        return this.sprites.get(id + ":" + frame);
    }

    private getPlayerBake(slot: number): PlayerBake {
        this.players[slot] ??= { stance: PLAYER_SEQS, looks: new Map() };
        return this.players[slot];
    }

    // slot: the hero's, in co-op (0 on your own)
    getPlayer(slot = 0): ActorModel | undefined {
        return this.players[slot]?.model;
    }

    // The stance the current player model was baked with. Only the seqs of the
    // weapon in hand are in a bake, so this changes along with the model.
    getPlayerStance(slot = 0): PlayerStance {
        return this.players[slot]?.stance ?? PLAYER_SEQS;
    }

    getPlayerLook(powerUpId: string, slot = 0): ActorModel | undefined {
        return this.players[slot]?.looks.get("player:" + powerUpId);
    }

    // Drops the models of co-op's other players, from this slot on
    dropPlayers(from: number): void {
        for (const bake of this.players.splice(from)) {
            this.releasePlayerModel(bake?.model);
        }
    }

    // A player model's gone once no player draws with it any more
    private releasePlayerModel(model: ActorModel | undefined): void {
        if (model && !this.players.some((bake) => bake?.model?.page === model.page)) {
            this.actors.removePage(model.page);
        }
    }

    // The character's look on the menus, with their starting weapon's swing:
    // the look a run starts with, so it needn't bake again then. bare: the body alone, with nothing
    // worn (the Wardrobe's Appearance tab, so what's changing can be seen).
    setCharacterLook(characterId: string, look?: WardrobeLook, bare = false): Promise<void> {
        if (bare && wearsWardrobe(getCharacter(characterId))) {
            return this.setPlayerAppearance(getBareAppearance(look));
        }
        return this.setPlayerAppearance(
            getCharacterAppearance(characterId, look),
            0,
            getCharacterAttackSeqs(characterId),
        );
    }

    // Bakes a player model for this look unless the current one (or the one
    // on its way) already has it. The old model keeps drawing until the new
    // one is ready. attackSeqs: the swings it needs (getRunAttackSeqs), none on
    // the title screen. offeredSeqs: the swings of weapons a choice offers
    // (getOfferedAttackSeqs), baked ahead so a weapon picked swings at once;
    // the ones not picked go at the next re-bake.
    async setPlayerAppearance(
        appearance: PlayerAppearance,
        slot = 0,
        attackSeqs: number[] = [],
        offeredSeqs: number[] = [],
    ): Promise<void> {
        const player = this.getPlayerBake(slot);
        const appearanceKey = getAppearanceKey(appearance);
        const wanted = [...attackSeqs, ...offeredSeqs];
        if (lookHas(player.key, appearanceKey, wanted)) {
            // What's drawn already is what's wanted, so another look on its way is out of date
            // (the menus' look asked for as a run ends, and a Retry straight back into one)
            player.pendingKey = undefined;
            return;
        }
        if (lookHas(player.pendingKey, appearanceKey, wanted)) {
            return;
        }
        const seqs = wanted.filter((seq, i) => wanted.indexOf(seq) === i);
        const key = getLookKey(appearance, seqs);
        player.pendingKey = key;
        const same = this.players.find((other) => other?.key === key && other.model);
        const look = same
            ? { models: same.looks, stance: same.stance }
            : await this.bakeLook(key, appearance, seqs);
        if (player.pendingKey !== key || this.players[slot] !== player) {
            // A newer look was asked for while this one baked, or the player's
            // gone (and it's no use unless another player's waiting on it)
            if (!this.players.some((other) => other?.pendingKey === key)) {
                this.releasePlayerModel(look.models.get("player"));
            }
            return;
        }
        player.pendingKey = undefined;
        const previous = player.model;
        player.model = look.models.get("player");
        player.looks = look.models;
        player.stance = look.stance;
        player.key = key;
        this.releasePlayerModel(previous);
    }

    // A player's look as baked: the walk, their weapon's stance, the death and these swings
    // (scripts/cache/check-actor-frames.ts bakes heroes with it too)
    static getLookRequest(
        appearance: PlayerAppearance,
        attackSeqs: number[],
    ): { request: PlayerBakeRequest; stance: PlayerStance } {
        const stance = getPlayerStance(appearance.equipment[EquipSlot.WEAPON]) ?? PLAYER_SEQS;
        // Walk goes first: a model's height comes from its first seq, and a stance that raises
        // the weapon shouldn't lift the health bar with it
        const seqIds = [
            PLAYER_SEQS.walk,
            stance.idle,
            stance.run,
            PLAYER_SEQS.death,
            ...attackSeqs,
        ].filter((id, i, all) => all.indexOf(id) === i);
        // The held weapon's aim over the run, for a moment after each shot on the move
        const poses = getHeldRunPoses(appearance, attackSeqs);
        const request: PlayerBakeRequest = {
            kind: "player",
            key: "player",
            appearance,
            seqIds,
            runPoses:
                poses.length > 0
                    ? { poses, runSeqId: stance.run, maskSeqId: PLAYER_INTERLEAVE_SEQ }
                    : undefined,
        };
        return { request, stance };
    }

    // A look's models, baked once however many players ask for it at a time
    private bakeLook(
        key: string,
        appearance: PlayerAppearance,
        attackSeqs: number[],
    ): Promise<{ models: Map<string, ActorModel>; stance: PlayerStance }> {
        let baking = this.bakingLooks.get(key);
        if (!baking) {
            baking = (async () => {
                const { request, stance } = GameAssets.getLookRequest(appearance, attackSeqs);
                const bake = await this.bake([request, ...getPowerUpLookRequests(appearance)]);
                this.renderer.updateTextureArray(bake.loadedTextures);
                return { models: this.actors.addBake(bake), stance };
            })().finally(() => this.bakingLooks.delete(key));
            this.bakingLooks.set(key, baking);
        }
        return baking;
    }
}

function toCanvas(sprite: SpriteImage): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(sprite.width, sprite.height);
    sprite.pixels.forEach((pixel, i) => {
        image.data[i * 4] = (pixel >> 16) & 0xff;
        image.data[i * 4 + 1] = (pixel >> 8) & 0xff;
        image.data[i * 4 + 2] = pixel & 0xff;
        image.data[i * 4 + 3] = (pixel >>> 24) & 0xff;
    });
    ctx.putImageData(image, 0, 0);
    return canvas;
}
