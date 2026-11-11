import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { getEnemy } from "../content/enemies";
import {
    INVOCATIONS,
    INVOCATION_GROUPS,
    InvocationPreset,
    MAX_INVOCATION_PRESETS,
    RAID_LEVEL_SCALE,
    TOMBS_UNIQUES,
    cleanInvocationPresets,
    cleanInvocations,
    getRaidBand,
    getRaidLevel,
    getRaidLevelScale,
    saveInvocationPreset,
    toggleInvocation,
} from "../content/invocations";
import { MAP_BY_ID, getMap } from "../content/maps";
import { getRaidSupply } from "../content/raids";
import { SHOP_UPGRADES } from "../content/shop";
import {
    APMEKEN,
    APMEKEN_WAVES,
    CRONDIS,
    HET,
    SCABARAS,
    TOMBS_BOSSES,
    TOMBS_BOSS_FOOD,
    TOMBS_POINTS,
    TOMBS_SPIRIT_BUNDLES,
    TOMBS_STRIKE,
    WARDENS,
} from "../content/tombs";
import { TROPHIES, TROPHY_BY_ID } from "../content/trophies";
import { MapDef, emptyStats } from "../content/types";
import { WARDENS_CRATER_WARDEN, createWardensFloor, wardensCrater } from "../content/wardensFloor";
import { Sim, TICKS_PER_SECOND, formationSpots, wardenFrontRow, zebakShelters } from "./Sim";
import { createSave, migrateSave } from "./save";
import { isCircleFree } from "./world/Collision";
import { makeGrid } from "./world/testGrid";

// These are tests of the mechanics, at full strength: raid level 0 scaled as Normal is (1 across).
// Entry's own scale, lighter on purpose, has tests of its own (withEntryScale).
const ENTRY_SCALE = { ...RAID_LEVEL_SCALE[0] };
const FULL_STRENGTH = { level: 0, hp: 1, damage: 1, bossHp: 1, bullets: 1 };
beforeEach(() => {
    RAID_LEVEL_SCALE[0] = { ...FULL_STRENGTH };
});
afterEach(() => {
    RAID_LEVEL_SCALE[0] = { ...ENTRY_SCALE };
});

// Raid level 0 as the game has it: Entry's scale
function withEntryScale(): void {
    RAID_LEVEL_SCALE[0] = { ...ENTRY_SCALE };
}

function field(): string[] {
    return Array.from({ length: 72 }, (_, y) =>
        Array.from({ length: 72 }, (_, x) =>
            x === 0 || y === 0 || x === 71 || y === 71 ? "#" : ".",
        ).join(""),
    );
}

const lumbridge = getMap("lumbridge");

// The Wardens' last room's floor, which the fight moves: OSRS's, 29 by 31, the Warden in its
// middle at the crater's mouth
const LAST_FLOOR = { x0: 1022, y0: 1036, x1: 1050, y1: 1066 };

// A Nexus in an open field, with a door 6 tiles east of where the party starts
const TEST_TOMBS: MapDef = {
    ...lumbridge,
    id: "test_tombs",
    waves: [],
    events: [],
    floor: {
        ...createWardensFloor(LAST_FLOOR),
        holes: wardensCrater(LAST_FLOOR.x0, LAST_FLOOR.y0),
        script: [],
        loopSeconds: 1e7,
    },
    tombs: {
        ability: TOMBS_STRIKE,
        nexus: { x: 1036.5, y: 1036.5 },
        // The way to the Wardens, 6 tiles south
        wardensDoor: { x: 1036.5, y: 1030.5 },
        // The Helpful Spirit, 3 tiles south-west
        spirit: { x: 1033.5, y: 1033.5 },
        // The Wardens' room in the same field: the obelisk north of the Nexus, a Warden either side
        wardens: {
            arrive: { x: 1036.5, y: 1040.5 },
            obelisk: { x: 1036.5, y: 1050.5 },
            elidinis: { x: 1050.5, y: 1050.5 },
            tumeken: { x: 1022.5, y: 1050.5 },
            sides: {
                elidinis: {
                    spawn: { x: 1039.5, y: 1050.5 },
                    gap: { x: 1038.5, y: 1050.5 },
                    end: 1047.5,
                },
                tumeken: {
                    spawn: { x: 1033.5, y: 1050.5 },
                    gap: { x: 1034.5, y: 1050.5 },
                    end: 1025.5,
                },
            },
            troughs: [1048.5, 1050.5, 1052.5],
            floor: { x0: 1025, y0: 1038, x1: 1047, y1: 1062 },
            last: {
                arrive: { x: 1036.5, y: 1040.5 },
                at: {
                    x: LAST_FLOOR.x0 + WARDENS_CRATER_WARDEN.x,
                    y: LAST_FLOOR.y0 + WARDENS_CRATER_WARDEN.y,
                },
                floor: LAST_FLOOR,
            },
        },
        paths: [
            { id: "het", name: "Path of Het", door: { x: 1042.5, y: 1036.5 } },
            {
                id: "apmeken",
                name: "Path of Apmeken",
                door: { x: 1030.5, y: 1036.5 },
                room: {
                    arrive: { x: 1036.5, y: 1060.5 },
                    puzzle: "apmeken",
                    spots: [
                        { kind: "pillar", x: 1030.5, y: 1066.5, reach: 2.7 },
                        { kind: "vent", x: 1042.5, y: 1066.5, reach: 1.7 },
                    ],
                    boss: {
                        enemyId: "ba_ba",
                        arrive: { x: 1036.5, y: 1020.5 },
                        at: { x: 1036.5, y: 1040.5 },
                        line: { y: 1026 },
                        boulders: {
                            altar: { x: 1036.5, y: 1046.5 },
                            start: { x: 1031.5, y: 1028.5 },
                            pit: { x0: 1035, x1: 1038, y0: 1020, y1: 1026.9 },
                            sarcophagi: [
                                { x: 1029.5, y: 1036.5, rotation: 0 },
                                { x: 1043.5, y: 1036.5, rotation: 2 },
                            ],
                        },
                    },
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_TOMBS.id, TEST_TOMBS);
afterAll(() => {
    MAP_BY_ID.delete(TEST_TOMBS.id);
});

function tombs(invocations: string[], hard = false): Sim {
    return new Sim({
        grid: makeGrid(field(), 1000, 1000),
        mapId: TEST_TOMBS.id,
        characterId: "warrior",
        metaStats: emptyStats(),
        seed: 1,
        spawnX: 1036.5,
        spawnY: 1036.5,
        invocations,
        hard,
    });
}

describe("invocations", () => {
    it("are each in a group, with a raid level, and named once", () => {
        const groups = new Set(INVOCATION_GROUPS.map((group) => group.id));
        for (const invocation of INVOCATIONS) {
            expect(groups.has(invocation.group), invocation.id).toBe(true);
            expect(invocation.level, invocation.id).toBeGreaterThan(0);
        }
        expect(new Set(INVOCATIONS.map((i) => i.id)).size).toBe(INVOCATIONS.length);
    });

    it("allow one of a group that says so, the last picked, and stack the rest", () => {
        expect(cleanInvocations(["try_again", "hardcore_run"])).toEqual(["hardcore_run"]);
        expect(toggleInvocation(["try_again", "on_a_diet"], "persistence")).toEqual([
            "on_a_diet",
            "persistence",
        ]);
        expect(toggleInvocation(["on_a_diet", "dehydration"], "on_a_diet")).toEqual([
            "dehydration",
        ]);
        expect(cleanInvocations(["on_a_diet", "not_one", 4, "on_a_diet"])).toEqual(["on_a_diet"]);
    });

    it("save as presets by name, or by raid level left blank, over one of the same name", () => {
        // Saved, with room for it
        const saved = (presets: InvocationPreset[], name: string, ids: string[]) => {
            const next = saveInvocationPreset(presets, name, ids);
            expect(next).toBeDefined();
            return next ?? [];
        };
        const diet = ["hardcore_run", "on_a_diet", "boulderdash"];
        let presets = saved([], "  ", diet);
        expect(presets).toEqual([{ name: "Raid level 50", invocations: diet }]);
        presets = saved(presets, "Speed", ["try_again"]);
        presets = saved(presets, "Speed", ["on_a_diet"]);
        expect(presets.map((p) => p.name)).toEqual(["Raid level 50", "Speed"]);
        expect(presets[1].invocations).toEqual(["on_a_diet"]);
        // Left blank, another setup at the same level goes over it (the board says Replace)
        expect(saved(saved([], "", ["hardcore_run"]), "", ["on_a_diet", "boulderdash"])).toEqual([
            { name: "Raid level 25", invocations: ["on_a_diet", "boulderdash"] },
        ]);
        // Full: a new name isn't added, an old one's still saved over
        for (let i = presets.length; i < MAX_INVOCATION_PRESETS; i++) {
            presets = saved(presets, `Set ${i}`, []);
        }
        expect(saveInvocationPreset(presets, "One more", [])).toBeUndefined();
        expect(saved(presets, "Speed", [])[1].invocations).toEqual([]);
    });

    it("name a preset named by its raid level by what it comes to now, if no other has that name", () => {
        // As after an update that changed an invocation's level
        expect(
            cleanInvocationPresets([
                // Its new name is the next one's old one
                { name: "Raid level 20", invocations: ["on_a_diet"] },
                { name: "Raid level 15", invocations: ["on_a_diet", "boulderdash"] },
                // The one after keeps its name
                { name: "Raid level 99", invocations: ["boulderdash"] },
                { name: "Raid level 10", invocations: ["boulderdash"] },
                { name: "My raid level 1", invocations: [] },
            ]),
        ).toEqual([
            { name: "Raid level 15", invocations: ["on_a_diet"] },
            { name: "Raid level 25", invocations: ["on_a_diet", "boulderdash"] },
            { name: "Raid level 99", invocations: ["boulderdash"] },
            { name: "Raid level 10", invocations: ["boulderdash"] },
            { name: "My raid level 1", invocations: [] },
        ]);
    });

    it("read presets from a save, leaving out anything odd", () => {
        expect(cleanInvocationPresets(undefined)).toEqual([]);
        expect(
            cleanInvocationPresets([
                { name: "A", invocations: ["try_again", "hardcore_run", "not_one"] },
                { name: "A", invocations: [] },
                { name: 3, invocations: [] },
                null,
                { name: "", invocations: ["on_a_diet"] },
                ...Array.from({ length: 10 }, (_, i) => ({ name: `X${i}`, invocations: [] })),
            ]),
        ).toEqual([
            { name: "A", invocations: ["hardcore_run"] },
            { name: "Raid level 15", invocations: ["on_a_diet"] },
            { name: "X0", invocations: [] },
            { name: "X1", invocations: [] },
            { name: "X2", invocations: [] },
        ]);
    });

    it("add up to a raid level, in OSRS's bands", () => {
        expect(getRaidLevel([])).toBe(0);
        expect(getRaidLevel(["hardcore_run", "on_a_diet", "boulderdash"])).toBe(50);
        // Only the one attempts invocation counts
        expect(getRaidLevel(["try_again", "hardcore_run"])).toBe(25);
        expect([getRaidBand(0), getRaidBand(149), getRaidBand(150), getRaidBand(300)]).toEqual([
            "Entry",
            "Entry",
            "Normal",
            "Expert",
        ]);
    });

    it("make enemies weaker than a map's at Entry, and tougher by more each band up", () => {
        withEntryScale();
        expect(getRaidLevelScale(0)).toEqual({ hp: 0.6, damage: 0.25, bossHp: 0.35, bullets: 0.6 });
        expect(getRaidLevelScale(150).hp).toBeCloseTo(1.1);
        expect(getRaidLevelScale(300).damage).toBeCloseTo(1.4);
        expect(getRaidLevelScale(500).bossHp).toBeCloseTo(3);
        // Past the last point at its rate
        expect(getRaidLevelScale(600).bossHp).toBeGreaterThan(3);
        // A boss's hitpoints climb ever quicker past Expert (a room's enemies, a run's first
        // levels, rise more gently)
        const step = (a: number, b: number) =>
            getRaidLevelScale(b).bossHp - getRaidLevelScale(a).bossHp;
        // Past Expert, harder by more and more
        expect(step(300, 400)).toBeGreaterThan(step(200, 300));
        expect(step(400, 500)).toBeGreaterThan(step(300, 400));
        for (const level of [0, 150, 300, 500]) {
            expect(getRaidLevelScale(level).hp).toBeLessThanOrEqual(
                getRaidLevelScale(level).bossHp + 0.25,
            );
        }
    });

    it("show each unique from its raid level, as OSRS's chest has them", () => {
        const at = (level: number) =>
            TOMBS_UNIQUES.filter((unique) => level >= unique.minLevel).map((unique) => unique.name);
        expect(at(0)).not.toContain("Osmumten's fang");
        expect(at(0)).toContain("Tumeken's guardian");
        expect(at(50)).toEqual(expect.arrayContaining(["Osmumten's fang", "Lightbearer"]));
        expect(at(149)).not.toContain("Tumeken's shadow");
        expect(at(150)).toContain("Tumeken's shadow");
        // The jewels come in higher, Amascut's at the very top
        expect(at(299)).not.toContain("Eye of the Corruptor");
        expect(at(499)).not.toContain("Jewel of Amascut");
        expect(at(500)).toHaveLength(TOMBS_UNIQUES.length);
    });

    it("are kept in the save, as only what this game knows", () => {
        const save = createSave();
        expect(
            migrateSave({ ...save, invocations: ["hardcore_run", "nope", "try_again"] }),
        ).toMatchObject({ invocations: ["try_again"] });
        expect(migrateSave(save).invocations).toBeUndefined();
    });
});

describe("the Tombs of Amascut", () => {
    it("never scale a 1-hitpoint thing down to none at Entry", () => {
        withEntryScale();
        const sim = tombs([]);
        const phantom = sim.spawnEnemy(getEnemy("zebaks_phantom"), "boss", {
            x: 1040.5,
            y: 1040.5,
        })!;
        expect(phantom.maxHp).toBe(1);
        expect(phantom.hp).toBe(1);
    });

    it("go by the raid level in place of hard mode", () => {
        withEntryScale();
        const plain = tombs([], true);
        expect(plain.hard).toBe(false);
        expect(plain.raidLevel).toBe(0);
        const tough = tombs(["hardcore_run", "pathmaster", "dehydration"]);
        expect(tough.raidLevel).toBe(105);
        const goblin = getEnemy("goblin");
        const easy = plain.spawnEnemy(goblin, "normal")!;
        const hard = tough.spawnEnemy(goblin, "normal")!;
        // A goblin's few hitpoints are rounded, so near enough
        const ratio = getRaidLevelScale(105).hp / getRaidLevelScale(0).hp;
        expect(Math.abs(hard.maxHp / easy.maxHp - ratio)).toBeLessThan(0.1);
        expect(hard.damageScale).toBeGreaterThan(easy.damageScale);
    });

    it("ignore invocations anywhere else", () => {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: "lumbridge",
            characterId: "warrior",
            metaStats: emptyStats(),
            seed: 1,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations: ["hardcore_run"],
        });
        expect(sim.invocations).toEqual([]);
        expect(sim.raidLevel).toBe(0);
    });

    it("stop the run's clock in the Nexus, and start it again in a path's room", () => {
        const sim = tombs([]);
        sim.weapons = [];
        seconds(sim, 3);
        expect(sim.seconds).toBe(0);
        sim.player.x = sim.player.prevX = 1031;
        sim.step();
        expect(sim.tombsPath).toBe("apmeken");
        seconds(sim, 2, { x: 1036.5, y: 1060.5 });
        expect(sim.seconds).toBeCloseTo(2, 1);
    });

    it("open the way to the Wardens once all four paths are done", () => {
        const sim = tombs([]);
        sim.weapons = [];
        sim.player.y = sim.player.prevY = 1030.5;
        sim.step();
        expect(sim.tombsWardens).toBeUndefined();
        expect(
            sim.takeEvents().some((e) => e.type === "notice" && e.message.includes("four paths")),
        ).toBe(true);
        sim.tombsPathsDone.push(...sim.map.tombs!.paths.map((p) => p.id));
        sim.step();
        expect(sim.tombsWardens?.phase).toBe(1);
        expect(sim.player.y).toBeCloseTo(sim.map.tombs!.wardens!.arrive.y);
    });

    it("take the party into a path's room through its door", () => {
        const sim = tombs([]);
        sim.weapons = [];
        sim.dropPickup("coins", 1040.5, 1030.5, 5);
        sim.player.x = sim.player.prevX = 1031;
        sim.step();
        expect(sim.tombsPath).toBe("apmeken");
        expect(sim.player.x).toBeCloseTo(1036.5);
        expect(sim.player.y).toBeCloseTo(1060.5);
        expect(
            sim.takeEvents().some((e) => e.type === "notice" && e.message.includes("Apmeken")),
        ).toBe(true);
    });

    it("say a path's door isn't open yet, once as you come up to it", () => {
        const sim = tombs([]);
        sim.weapons = [];
        const notices = () =>
            sim
                .takeEvents()
                .filter((e) => e.type === "notice" && e.message.includes("Path of Het"));
        sim.step();
        expect(notices()).toHaveLength(0);
        sim.player.x = sim.player.prevX = 1041;
        sim.step();
        expect(notices()).toHaveLength(1);
        sim.step();
        sim.step();
        expect(notices()).toHaveLength(0);
        // Away and back: it says so again
        sim.player.x = sim.player.prevX = 1036.5;
        sim.step();
        sim.player.x = sim.player.prevX = 1041;
        sim.step();
        expect(notices()).toHaveLength(1);
    });
});

// Into the Apmeken room, with nothing of the player's own fighting
function apmeken(invocations: string[] = []): Sim {
    const sim = tombs(invocations);
    sim.weapons = [];
    sim.player.x = sim.player.prevX = 1031;
    sim.step();
    expect(sim.tombsPath).toBe("apmeken");
    return sim;
}

// A second at a time, through what pauses a run, the player kept alive
function seconds(sim: Sim, count: number, at?: { x: number; y: number }): void {
    for (let i = 0; i < count * TICKS_PER_SECOND && !sim.runOver; i++) {
        sim.player.invulnerable = 0;
        sim.player.hp = sim.player.maxHp;
        if (at) {
            sim.player.x = sim.player.prevX = at.x;
            sim.player.y = sim.player.prevY = at.y;
        }
        if (sim.state === "levelUp") {
            sim.choose(0);
        }
        if (sim.state === "chest") {
            sim.resolveChest("take");
        }
        if (sim.state === "event") {
            sim.leaveEvent();
        }
        sim.step();
    }
}

// Out of the walls one at a time: on until the whole wave's out
function allOut(sim: Sim): void {
    for (let i = 0; i < 40 && sim.tombsRoom!.pending.length > 0; i++) {
        seconds(sim, APMEKEN.stagger, { x: sim.player.x, y: sim.player.y });
    }
    expect(sim.tombsRoom!.pending).toHaveLength(0);
}

function killGroup(sim: Sim): void {
    allOut(sim);
    const group = new Set(sim.tombsRoom!.group);
    for (const enemy of sim.enemies) {
        if (group.has(enemy.uid) && !enemy.dead) {
            sim.damageEnemy(enemy, 1e9, 0, enemy.x, enemy.y);
        }
    }
}

describe("the Apmeken room", () => {
    it("sends its first wave as the party comes in, out of the walls one at a time", () => {
        const sim = apmeken();
        expect(sim.tombsRoom!.wave).toBe(0);
        expect(sim.tombsRoom!.group).toHaveLength(1);
        expect(sim.tombsRoom!.pending).toHaveLength(APMEKEN_WAVES[0].length - 1);
        allOut(sim);
        const group = sim.enemies.filter((e) => sim.tombsRoom!.group.includes(e.uid));
        expect(group.map((e) => e.def.id).sort()).toEqual([...APMEKEN_WAVES[0]].sort());
    });

    it("sends the next wave once one's beaten, with a casket for it", () => {
        const sim = apmeken();
        killGroup(sim);
        sim.step();
        expect(sim.tombsRoom!.wave).toBe(1);
        expect(sim.pickups.some((p) => p.kind === "casket")).toBe(true);
    });

    it("sends the next anyway once a wave's been about too long", () => {
        const sim = apmeken();
        seconds(sim, APMEKEN.waveSeconds + 1, { x: 1036.5, y: 1060.5 });
        expect(sim.tombsRoom!.wave).toBeGreaterThanOrEqual(1);
    });

    it("has an issue come up, fixed by standing at it", () => {
        const sim = apmeken();
        seconds(sim, APMEKEN.issueEvery + 0.5, { x: 1036.5, y: 1060.5 });
        const issue = sim.tombsIssue!;
        expect(issue).toBeDefined();
        seconds(sim, APMEKEN.fixSeconds[issue.kind] + 0.2, { x: issue.x, y: issue.y - 1 });
        expect(sim.tombsIssue).toBeUndefined();
        expect(sim.tombsRoom!.missed).toBe(0);
    });

    it("hurts everyone for an issue left too long, and more for the next", () => {
        const sim = apmeken();
        seconds(sim, APMEKEN.issueEvery + 0.5, { x: 1036.5, y: 1060.5 });
        expect(sim.tombsIssue).toBeDefined();
        const taken = sim.damageTaken;
        seconds(sim, APMEKEN.deadline + 0.5, { x: 1036.5, y: 1060.5 });
        expect(sim.tombsIssue).toBeUndefined();
        expect(sim.tombsRoom!.missed).toBe(1);
        expect(sim.damageTaken).toBeGreaterThan(taken);
    });

    it("is done after its eighth wave, back to the Nexus, its door done", () => {
        const sim = apmeken();
        for (let wave = 0; wave < APMEKEN_WAVES.length; wave++) {
            killGroup(sim);
            sim.step();
        }
        expect(sim.tombsRoom!.doneTick).toBeDefined();
        // On to Ba-Ba: she rises once someone's walked in, and the path's done once she's dead
        seconds(sim, 3.5, { x: 1036.5, y: 1020.5 });
        expect(sim.tombsRoom!.boss).toEqual({ uid: -1, beatenTick: undefined });
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        const baba = sim.enemies.find((e) => e.def.id === "ba_ba" && !e.dead)!;
        expect(baba).toBeDefined();
        // She's fought in phases, her rolling stones at each: hit till she's down
        for (let i = 0; i < 5000 && !baba.dead; i++) {
            sim.player.invulnerable = 1e6;
            sim.damageEnemy(baba, 1e9, 0, baba.x, baba.y);
            if (sim.state === "levelUp") {
                sim.choose(0);
            }
            sim.step();
        }
        expect(baba.dead).toBe(true);
        // Hurt as it ends: healed to full on the way out
        sim.player.hp = 1;
        // Its death plays out, then back to the Nexus (nothing holding the player meanwhile)
        for (let i = 0; i < 400 && sim.tombsPath !== undefined; i++) {
            sim.player.invulnerable = 1e6;
            if (sim.state === "levelUp") {
                sim.choose(0);
            }
            if (sim.state === "chest") {
                sim.resolveChest("take");
            }
            sim.step();
        }
        expect(sim.tombsPath).toBeUndefined();
        expect(sim.tombsPathsDone).toEqual(["apmeken"]);
        expect(sim.player.hp).toBe(sim.player.maxHp);
        expect(sim.player.x).toBeCloseTo(1036.5);
        expect(sim.player.y).toBeCloseTo(1036.5);
        // Its level ups answered, then up to its door: it's done
        seconds(sim, 0.2, { x: 1036.5, y: 1036.5 });
        sim.takeEvents();
        seconds(sim, 0.1, { x: 1031, y: 1036.5 });
        expect(sim.tombsPath).toBeUndefined();
        expect(
            sim.takeEvents().some((e) => e.type === "notice" && e.message.includes("done")),
        ).toBe(true);
    });

    it("is quicker and bigger at a path level, and with the paths done before it", () => {
        expect(apmeken().tombsPathLevel).toBe(0);
        const master = apmeken(["pathmaster"]);
        expect(master.tombsPathLevel).toBe(3);
        const room = master.tombsRoom!;
        expect(room.group.length + room.pending.length).toBe(APMEKEN_WAVES[0].length + 3);
    });
});

describe("the Tombs' invocations", () => {
    it("drop no food on a diet", () => {
        const plain = apmeken();
        const diet = apmeken(["on_a_diet"]);
        for (const sim of [plain, diet]) {
            for (let i = 0; i < 400; i++) {
                const enemy = sim.spawnEnemy(getEnemy("baboon_thrall"), "normal")!;
                sim.damageEnemy(enemy, 1e9, 0, enemy.x, enemy.y);
            }
        }
        expect(plain.pickups.some((p) => p.kind === "food")).toBe(true);
        expect(diet.pickups.some((p) => p.kind === "food")).toBe(false);
    });

    it("let armour stop less with Quiet Prayers, and a second hit land harder with Deadly", () => {
        const hit = (invocations: string[], twice: boolean) => {
            const sim = tombs(invocations);
            sim.stats.armor = 4;
            // Hitpoints to take both from (what's taken is capped at what was there)
            sim.player.maxHp = sim.player.hp = 100;
            const taken = sim.damageTaken;
            sim["damagePlayer"](20, "test", false);
            if (twice) {
                sim.player.invulnerable = 0;
                sim["damagePlayer"](20, "test", false);
            }
            return sim.damageTaken - taken;
        };
        expect(hit([], false)).toBe(16);
        expect(hit(["quiet_prayers"], false)).toBe(Math.round(20 - 4 * 0.9));
        expect(hit([], true)).toBe(32);
        expect(hit(["deadly_prayers"], true)).toBe(16 + Math.round(20 * 1.2 - 4));
    });
});

describe("a death in the Tombs", () => {
    // Down, and back in the safe corridor if the raid isn't over: the test map's room has no
    // barrier, so it starts again on the next step
    function die(sim: Sim): void {
        sim.revivesLeft = 0;
        sim.player.invulnerable = 0;
        sim["damagePlayer"](1e6, "test", false, undefined, true);
        if (!sim.runOver) {
            expect(sim.tombsRoom!.started).toBe(false);
            sim.step();
        }
    }

    it("waits in the safe corridor until someone's through the barrier, then holds it", () => {
        const room = TEST_TOMBS.tombs!.paths.find((p) => p.id === "apmeken")!.room!;
        room.gate = { x: 1030, locId: 45135, tiles: [] };
        try {
            const sim = apmeken();
            expect(sim.tombsRoom!.started).toBe(false);
            seconds(sim, 3, { x: 1036.5, y: 1060.5 });
            expect(sim.tombsRoom!.started).toBe(false);
            expect(sim.enemies.filter((e) => !e.dead)).toHaveLength(0);
            expect(sim.tombsGateShut).toBe(false);
            seconds(sim, 0.2, { x: 1028.5, y: 1060.5 });
            expect(sim.tombsRoom!.started).toBe(true);
            expect(sim.tombsRoom!.wave).toBe(0);
            expect(sim.tombsGateShut).toBe(true);
            // Shut: back east is a wall
            sim.player.x = sim.player.prevX = 1035;
            sim.step();
            expect(sim.player.x).toBeLessThanOrEqual(1030);
            // A death: back in the corridor, the room waiting again
            sim.revivesLeft = 0;
            sim.player.invulnerable = 0;
            sim["damagePlayer"](1e6, "test", false, undefined, true);
            expect(sim.runOver).toBe(false);
            expect(sim.tombsRoom!.started).toBe(false);
            expect(sim.tombsGateShut).toBe(false);
            expect(sim.player.x).toBeCloseTo(1036.5);
            expect(sim.player.hp).toBe(sim.player.maxHp);
        } finally {
            delete room.gate;
        }
    });

    it("in co-op, fails the room only once everyone's down", () => {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: TEST_TOMBS.id,
            characterId: "",
            metaStats: emptyStats(),
            seed: 1,
            spawnX: 1036.5,
            spawnY: 1036.5,
            party: ["warrior", "wizard"].map((characterId) => ({
                name: characterId,
                characterId,
                metaStats: emptyStats(),
            })),
        });
        for (const hero of sim.heroes) {
            sim.as(hero.index, () => {
                sim.weapons = [];
            });
        }
        sim.player.x = sim.player.prevX = 1031;
        sim.step();
        expect(sim.tombsPath).toBe("apmeken");
        const [a, b] = sim.heroes;
        const down = (hero: typeof a) =>
            sim.as(hero.index, () => {
                sim.revivesLeft = 0;
                sim.player.invulnerable = 0;
                sim["damagePlayer"](1e6, "test", false, undefined, true);
            });
        down(a);
        expect(a.down).toBe(true);
        expect(sim.state).toBe("playing");
        down(b);
        // Both down: back in the corridor, both up
        expect(sim.runOver).toBe(false);
        expect(a.down || b.down).toBe(false);
        expect(sim.tombsDeaths).toBe(1);
    });

    it("starts the room over instead of ending the run, everyone up on full hitpoints", () => {
        const sim = apmeken();
        killGroup(sim);
        sim.step();
        killGroup(sim);
        sim.step();
        expect(sim.tombsRoom!.wave).toBe(2);
        die(sim);
        expect(sim.runOver).toBe(false);
        expect(sim.tombsDeaths).toBe(1);
        expect(sim.player.hp).toBe(sim.player.maxHp);
        expect(sim.player.y).toBeCloseTo(1060.5);
        expect(sim.tombsRoom!.wave).toBe(0);
        expect(sim.tombsRoom!.beaten).toBe(1);
    });

    it("gives nothing for the waves beaten before, then as usual past them", () => {
        const sim = apmeken();
        killGroup(sim);
        sim.step();
        die(sim);
        expect(sim.tombsReplaying).toBe(true);
        const group = sim.enemies.filter((e) => sim.tombsRoom!.group.includes(e.uid));
        expect(group.every((e) => e.xp === 0)).toBe(true);
        const caskets = () => sim.pickups.filter((p) => p.kind === "casket").length;
        const before = caskets();
        killGroup(sim);
        sim.step();
        // Wave 1 again: no casket
        expect(caskets()).toBe(before);
        expect(sim.tombsReplaying).toBe(false);
        killGroup(sim);
        sim.step();
        expect(caskets()).toBe(before + 1);
    });

    it("has no limit, unless an Attempts invocation sets one", () => {
        expect(apmeken().tombsDeathsAllowed).toBe(Infinity);
        expect(apmeken(["try_again"]).tombsDeathsAllowed).toBe(10);
        const hardcore = apmeken(["hardcore_run"]);
        die(hardcore);
        expect(hardcore.runOver).toBe(true);
        const softcore = apmeken(["softcore_run"]);
        for (let i = 0; i < 3; i++) {
            die(softcore);
            expect(softcore.runOver).toBe(false);
        }
        die(softcore);
        expect(softcore.runOver).toBe(true);
    });
});

describe("Ba-Ba", () => {
    function atBaba(invocations: string[] = []): Sim {
        const sim = apmeken(invocations);
        expect(sim.devSkipToTombsBoss()).toBe(true);
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        return sim;
    }
    const baba = (sim: Sim) => sim.enemies.find((e) => e.def.id === "ba_ba" && !e.dead)!;

    it("stomps on whoever's right up against her, shown and said before it lands", () => {
        // Players met it as damage from nowhere: against her side, no mark, no word
        const sim = atBaba();
        const boss = baba(sim);
        const stomp = boss.def.boss!.stomp!;
        const step = (sim as unknown as { stepStomp(e: typeof boss): void }).stepStomp.bind(sim);
        sim.takeEvents();
        // Touching her side, as her solid body leaves you
        sim.player.x = boss.x + boss.radius + sim.player.radius;
        sim.player.y = boss.y;
        const hits: number[] = [];
        const notices: string[] = [];
        let swings = 0;
        for (let i = 0; i < 3 * TICKS_PER_SECOND; i++) {
            sim.tick++;
            sim.player.invulnerable = 0;
            const hp = (sim.player.hp = sim.player.maxHp);
            step(boss);
            const state = boss.bossState!;
            if (hits.length === 0) {
                // The ring's there from the moment you're under, till the first lands
                expect(state.stompFrom).toBeDefined();
            }
            if (sim.player.hp < hp) {
                hits.push(i);
            }
            for (const event of sim.takeEvents()) {
                if (event.type === "notice") {
                    notices.push(event.message);
                } else if (event.type === "bossSwing") {
                    swings++;
                }
            }
        }
        // The first waits its moment, then each interval
        expect(hits[0]).toBe(Math.round(stomp.first! * TICKS_PER_SECOND));
        expect(hits[1] - hits[0]).toBe(Math.round(stomp.interval * TICKS_PER_SECOND));
        expect(swings).toBe(hits.length);
        expect(notices).toEqual([stomp.message]);

        // A tick's step out and back doesn't put it off: it comes as it would have
        const state = boss.bossState!;
        const due = state.nextStomp!;
        sim.player.x = boss.x + stomp.radius + 1;
        sim.tick++;
        step(boss);
        expect(state.nextStomp).toBe(due);
        sim.player.x = boss.x + boss.radius + sim.player.radius;
        while (sim.tick < due) {
            sim.tick++;
            sim.player.invulnerable = 0;
            const hp = (sim.player.hp = sim.player.maxHp);
            step(boss);
            expect(sim.player.hp < hp).toBe(sim.tick >= due);
        }

        // Out of it for its first's wait and it's over, ring and all; back in, the wait again,
        // and nothing said twice
        sim.player.x = boss.x + stomp.radius + 1;
        for (let i = 0; i <= Math.round(stomp.first! * TICKS_PER_SECOND); i++) {
            sim.tick++;
            step(boss);
        }
        expect(state.nextStomp).toBeUndefined();
        expect(state.stompFrom).toBeUndefined();
        sim.player.x = boss.x + boss.radius + sim.player.radius;
        sim.tick++;
        step(boss);
        expect(state.nextStomp! - sim.tick).toBe(Math.round(stomp.first! * TICKS_PER_SECOND));
        sim.takeEvents();
        for (let i = 0; i < 2 * TICKS_PER_SECOND; i++) {
            sim.tick++;
            sim.player.invulnerable = 0;
            step(boss);
        }
        expect(sim.takeEvents().some((e) => e.type === "notice")).toBe(false);
    });

    it("has her adds drop food at Entry, a third of that at Expert, none past 450", () => {
        withEntryScale();
        expect(atBaba()["tombsBossFood"]()).toBeCloseTo(TOMBS_BOSS_FOOD.chance);
        const expert = [
            "insanity",
            "pathmaster",
            "walk_the_path",
            "no_help_needed",
            "dehydration",
            "quiet_prayers",
            "deadly_prayers",
            "double_trouble",
            "feeling_special",
        ];
        expect(getRaidLevel(expert)).toBeGreaterThanOrEqual(300);
        expect(atBaba(expert)["tombsBossFood"]()).toBeLessThan(TOMBS_BOSS_FOOD.chance * 0.4);
        expect(atBaba(expert)["tombsBossFood"]()).toBeGreaterThan(0);
    });

    it("is skipped to from her room on the dev server, rising once someone walks in", () => {
        const sim = apmeken();
        expect(sim.devSkipToTombsBoss()).toBe(true);
        expect(sim.devSkipToTombsBoss()).toBe(false);
        seconds(sim, 1, { x: 1036.5, y: 1020.5 });
        expect(sim.enemies.some((e) => e.def.id === "ba_ba")).toBe(false);
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        expect(baba(sim)).toBeDefined();
        // Up, the entrance is behind a line nobody goes back over
        sim.player.y = sim.player.prevY = 1020.5;
        sim.step();
        expect(sim.player.y).toBeGreaterThanOrEqual(1026);
    });

    it("starts over when the party dies to her, back at the arena's start", () => {
        const sim = atBaba();
        sim.revivesLeft = 0;
        sim.player.invulnerable = 0;
        sim["damagePlayer"](1e6, "test", false, undefined, true);
        expect(sim.runOver).toBe(false);
        expect(sim.player.y).toBeCloseTo(1020.5);
        expect(sim.tombsRoom!.boss!.uid).toBe(-1);
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        const again = baba(sim);
        expect(again.hp).toBe(again.maxHp);
    });

    it("rolls her stones at two thirds: she can't be hurt, and only rolls boulders", () => {
        const sim = atBaba();
        const boss = baba(sim);
        boss.hp = Math.floor(boss.maxHp * 0.65);
        seconds(sim, 0.5, { x: 1036.5, y: 1028.5 });
        expect(boss.bossState!.ordeal).toBeDefined();
        expect(boss.bossState!.ordeal!.during.attacks).toEqual(["Rolling boulders"]);
        expect(boss.shieldEnd).toBeGreaterThan(sim.tick);
    });

    it("rolls her boulders twice as fast with Boulderdash, and a wider shockwave shaking things up", () => {
        const attack = (sim: Sim, name: string) =>
            sim["invokedAttack"](baba(sim).def.boss!.attacks.find((a) => a.name === name)!);
        const plain = atBaba();
        const dash = atBaba(["boulderdash", "shaking_things_up"]);
        expect(attack(dash, "Rolling boulders").pattern!.speed).toBe(
            attack(plain, "Rolling boulders").pattern!.speed * 2,
        );
        expect(attack(dash, "Shockwave").ground!.radius).toBeCloseTo(
            attack(plain, "Shockwave").ground!.radius * 1.4,
        );
        // The same copy each time
        expect(attack(dash, "Rolling boulders")).toBe(attack(dash, "Rolling boulders"));
    });

    it("drops her boulder beside the player, never on them, breaking into shards and staying", () => {
        const sim = atBaba();
        sim.weapons = [];
        const boss = baba(sim);
        const boulder = boss.def.boss!.attacks.find((a) => a.name === "Boulder")!;
        const at = { x: sim.player.x, y: sim.player.y };
        sim["startBossAttack"](boss, boulder);
        const target = boss.bossState!.windup!.targets[0];
        const away = Math.hypot(target.x - at.x, target.y - at.y);
        expect(away).toBeGreaterThanOrEqual(boulder.beside!.min - 0.01);
        expect(away).toBeLessThanOrEqual(boulder.beside!.max + 0.01);
        const before = sim.bullets.count;
        // Well out of the way of its shards
        seconds(sim, boulder.windup + 0.1, { x: at.x - 12, y: at.y });
        expect(sim.bullets.count).toBeGreaterThanOrEqual(before + boulder.shards!.count);
        expect(sim.tombsCover).toHaveLength(1);
        expect(sim.tombsCover[0].x).toBeCloseTo(target.x);
    });

    it("hits everyone not beside a boulder with her avalanche, which follows it", () => {
        const sim = atBaba();
        sim.weapons = [];
        const boss = baba(sim);
        const boulder = boss.def.boss!.attacks.find((a) => a.name === "Boulder")!;
        sim["startBossAttack"](boss, boulder);
        seconds(sim, boulder.windup + 0.1, { x: 1024.5, y: 1030.5 });
        const rock = sim.tombsCover[0];
        expect(rock).toBeDefined();
        // It follows: by the time it lands, beside the rock is safe and away from it isn't
        const avalanche = boss.def.boss!.attacks.find((a) => a.name === "Avalanche")!;
        const hit = (x: number, y: number) => {
            sim.player.x = sim.player.prevX = x;
            sim.player.y = sim.player.prevY = y;
            sim.player.hp = sim.player.maxHp;
            sim.player.invulnerable = 0;
            sim["landAvalanche"](boss, avalanche, avalanche.takeCover!);
            return sim.player.maxHp - sim.player.hp;
        };
        expect(hit(rock.x + rock.radius + 0.8, rock.y)).toBe(0);
        expect(hit(rock.x + 9, rock.y)).toBeGreaterThan(sim.player.maxHp * 0.5);
        expect(boss.bossState!.follow?.attack.name ?? boss.bossState!.windup?.attack.name).toBe(
            "Avalanche",
        );
    });

    it("keeps the party out of her boulders' rocks", () => {
        const sim = atBaba();
        sim.tombsCover.push({
            x: 1036.5,
            y: 1034.5,
            radius: 1.4,
            endTick: sim.tick + 100,
            look: "ba_ba_rubble_0",
        });
        sim.player.x = sim.player.prevX = 1036.6;
        sim.player.y = sim.player.prevY = 1034.5;
        sim.step();
        expect(Math.hypot(sim.player.x - 1036.5, sim.player.y - 1034.5)).toBeGreaterThanOrEqual(
            1.4,
        );
    });

    it("goes to her next phase a tick ahead of her stones, its opener held till they're over", () => {
        const sim = atBaba();
        const boss = baba(sim);
        // Into her second phase (a hit's held at its threshold), then on past her stones' share
        sim.damageEnemy(boss, boss.hp - Math.floor(boss.maxHp * 0.65), 0, boss.x, boss.y);
        boss.hp = Math.floor(boss.maxHp * 0.65);
        sim.step();
        sim.step();
        const phase = boss.bossState!.phase!;
        expect(phase.index).toBe(1);
        expect(boss.bossState!.ordeal).toBeDefined();
        // Nothing of the phase's own while her boulders roll: no opener, no rockfall
        for (let i = 0; i < 5 * TICKS_PER_SECOND; i++) {
            sim.player.invulnerable = 1e6;
            sim.step();
        }
        expect(phase.opener?.name).toBe("Boulder");
        expect(sim.hazards.some((h) => h.attack.name === "Rockfall")).toBe(false);
        for (let i = 0; i < 20 * TICKS_PER_SECOND && boss.bossState!.ordeal; i++) {
            sim.player.invulnerable = 1e6;
            sim.step();
        }
        expect(boss.bossState!.ordeal).toBeUndefined();
        for (let i = 0; i < 3 * TICKS_PER_SECOND && phase.opener; i++) {
            sim.player.invulnerable = 1e6;
            sim.step();
        }
        expect(phase.opener).toBeUndefined();
    });

    it("rampages down a lane in her own room, stunned by one of her rocks in its way", () => {
        const sim = atBaba();
        sim.weapons = [];
        const boss = baba(sim);
        const rampage = boss.def.boss!.attacks.find((a) => a.name === "Rampage")!;
        sim["startBossAttack"](boss, { ...rampage, chain: undefined });
        const lane = boss.bossState!.windup!.lane!;
        // Never back over her fight's line (the room's walls bound it in a run with the cache's)
        expect(Math.min(lane.fromY, lane.toY)).toBeGreaterThanOrEqual(
            sim.tombsPathRoom!.boss!.line.y,
        );
        // A rock two fifths of the way along it
        const rock = {
            x: lane.fromX + (lane.toX - lane.fromX) * 0.4,
            y: lane.fromY + (lane.toY - lane.fromY) * 0.4,
        };
        sim.tombsCover.push({
            ...rock,
            radius: 1.4,
            endTick: sim.tick + 1e4,
            look: "ba_ba_rubble_0",
        });
        let stunned = false;
        for (let i = 0; i < 5 * TICKS_PER_SECOND && !stunned; i++) {
            sim.player.invulnerable = 1e6;
            sim.step();
            stunned = sim.isStunned(boss);
        }
        expect(stunned).toBe(true);
        expect(boss.bossState!.surge).toBeUndefined();
        expect(Math.hypot(boss.x - rock.x, boss.y - rock.y)).toBeGreaterThanOrEqual(
            1.4 + boss.radius - 0.3,
        );
    });

    it("stops a lunge short of one of her rocks, not stunned by it", () => {
        const sim = atBaba();
        sim.weapons = [];
        const boss = baba(sim);
        const lunge = boss.def.boss!.attacks.find((a) => a.name === "Knuckle lunge")!;
        boss.x = boss.prevX = sim.player.x;
        boss.y = boss.prevY = sim.player.y + 6;
        sim.tombsCover.push({
            x: sim.player.x,
            y: sim.player.y + 2,
            radius: 1.4,
            endTick: sim.tick + 1e4,
            look: "ba_ba_rubble_0",
        });
        sim["startBossAttack"](boss, lunge);
        seconds(sim, lunge.windup + 0.5, { x: sim.player.x, y: sim.player.y });
        // Hiding behind a rock from her lunges isn't a free stun: only her Rampage is
        expect(sim.isStunned(boss)).toBe(false);
        expect(boss.y - (sim.player.y + 2)).toBeGreaterThan(1.4);
    });

    it("drops her rockfall in a cross of shadows on the player's tile", () => {
        const sim = atBaba();
        const boss = baba(sim);
        const rockfall = boss.def.boss!.attacks.find((a) => a.name === "Rockfall")!;
        const before = sim.hazards.length;
        sim["startBossAttack"](boss, rockfall);
        const marks = sim.hazards.slice(before);
        expect(marks).toHaveLength(13);
        const x = Math.floor(sim.player.x) + 0.5;
        const y = Math.floor(sim.player.y) + 0.5;
        expect(marks.every((m) => m.x === x || m.y === y)).toBe(true);
    });

    it("can't hurt the player in god mode, on the dev server", () => {
        const sim = atBaba();
        sim.devGod = true;
        sim.player.invulnerable = 0;
        const hp = sim.player.hp;
        expect(sim["damagePlayer"](50, "test", false)).toBe(0);
        expect(sim.player.hp).toBe(hp);
    });

    it("hands over a corrupted twisted bow from the dev skip, to do some damage with", () => {
        const sim = atBaba();
        expect(sim.weapons.some((w) => w.def.id === "corrupted_twisted_bow")).toBe(true);
    });

    // Down to her first boulders' share, and a couple of ticks for them to start
    function rolling(invocations: string[] = []): { sim: Sim; boss: ReturnType<typeof baba> } {
        const sim = atBaba(invocations);
        const boss = baba(sim);
        boss.hp = Math.floor(boss.maxHp * 0.66) - 1;
        sim.step();
        sim.step();
        expect(boss.bossState!.ordeal).toBeDefined();
        return { sim, boss };
    }

    it("goes up to her altar for her boulders, the party put at the arena's foot", () => {
        const { sim, boss } = rolling();
        expect(boss.x).toBeCloseTo(1036.5);
        expect(boss.y).toBeCloseTo(1046.5);
        expect(sim.player.x).toBeCloseTo(1031.5);
        expect(sim.player.y).toBeCloseTo(1028.5);
        // and stays there
        for (let i = 0; i < 2 * TICKS_PER_SECOND; i++) {
            sim.player.invulnerable = 0;
            sim.player.hp = sim.player.maxHp;
            sim.step();
        }
        expect(boss.y).toBeCloseTo(1046.5);
    });

    it("rolls her boulders straight down the arena, knocking whoever they hit back", () => {
        const { sim } = rolling();
        for (let i = 0; i < 3 * TICKS_PER_SECOND && sim.bullets.count === 0; i++) {
            sim.step();
        }
        const bullets = sim.bullets;
        expect(bullets.count).toBeGreaterThan(0);
        const slot = bullets.order[0];
        expect(bullets.vy[slot]).toBeLessThan(0);
        expect(Math.abs(bullets.vx[slot])).toBeLessThan(1e-6);
        // In its way
        sim.player.invulnerable = 0;
        sim.player.hp = sim.player.maxHp;
        sim.player.x = sim.player.prevX = bullets.x[slot];
        sim.player.y = sim.player.prevY = bullets.y[slot] - 0.5;
        const before = sim.player.y;
        sim.step();
        expect(sim.player.y).toBeLessThan(before - 3);
    });

    it("rolls five boulders a row, one cracked, at most two lanes from the last", () => {
        const { sim, boss } = rolling();
        const rows: { added: number; gap: number }[] = [];
        const fire = sim["fireGappedVolley"].bind(sim);
        sim["fireGappedVolley"] = (...args: Parameters<typeof fire>) => {
            const before = sim.bullets.count;
            const cracked = sim.enemies.filter((e) => e.rolls).length;
            fire(...args);
            rows.push({
                added:
                    sim.bullets.count -
                    before +
                    sim.enemies.filter((e) => e.rolls).length -
                    cracked,
                gap: boss.bossState!.wallGap!,
            });
        };
        // At the foot, out of their way, so nothing ends it early
        for (let i = 0; i < 15 * TICKS_PER_SECOND; i++) {
            sim.player.invulnerable = 0;
            sim.player.hp = sim.player.maxHp;
            sim.player.x = sim.player.prevX = 1031.5;
            sim.player.y = sim.player.prevY = 1028.5;
            sim.step();
        }
        expect(rows.length).toBeGreaterThan(5);
        rows.forEach((row, i) => {
            expect(row.added).toBe(5);
            if (i > 0) {
                expect(Math.abs(row.gap - rows[i - 1].gap)).toBeLessThanOrEqual(2);
            }
        });
        // and it goes everywhere, ends included, over a phase
        expect(new Set(rows.map((r) => r.gap)).size).toBeGreaterThan(2);
    });

    it("rolls a cracked boulder in each row, which breaks, and knocks back like the rest", () => {
        const { sim } = rolling();
        let cracked: ReturnType<typeof baba> | undefined;
        for (let i = 0; i < 3 * TICKS_PER_SECOND && !cracked; i++) {
            sim.player.x = sim.player.prevX = 1031.5;
            sim.player.y = sim.player.prevY = 1028.5;
            sim.step();
            cracked = sim.enemies.find((e) => e.rolls && !e.dead);
        }
        expect(cracked).toBeDefined();
        expect(cracked!.def.id).toBe("cracked_boulder");
        // In its way: hit and knocked on down the arena
        const y = cracked!.y - cracked!.radius - 0.3;
        sim.player.x = sim.player.prevX = cracked!.x;
        sim.player.y = sim.player.prevY = y;
        sim.player.invulnerable = 0;
        sim["bulletGraceEnd"] = 0;
        sim.step();
        expect(sim.player.y).toBeLessThan(y - 2);
        // Broken
        sim["killEnemy"](cracked!);
        expect(cracked!.dead).toBe(true);
        expect(sim.tombsPeels).toHaveLength(0);
    });

    it("sends her baboons for the sarcophagi, which open and fire across the arena", () => {
        const sim = atBaba(["gotta_have_faith"]);
        // Nothing to shoot them on the way with (the dev skip's bow)
        sim.weapons = [];
        const boss = baba(sim);
        expect(sim.tombsSarcophagi).toHaveLength(2);
        const call = boss.def.boss!.attacks.find((a) => a.name === "Call baboons")!;
        sim["summonAround"](boss, call);
        const seekers = sim.enemies.filter((e) => e.seeks !== undefined && !e.dead);
        expect(seekers.length).toBeGreaterThan(0);
        for (
            let i = 0;
            i < 20 * TICKS_PER_SECOND && sim.tombsSarcophagi.every((s) => sim.tick >= s.openUntil);
            i++
        ) {
            sim.player.invulnerable = 0;
            sim.player.hp = sim.player.maxHp;
            sim.player.x = sim.player.prevX = 1036.5;
            sim.player.y = sim.player.prevY = 1028.5;
            boss.bossState!.windup = undefined;
            sim.step();
        }
        const open = sim.tombsSarcophagi.find((s) => sim.tick < s.openUntil);
        expect(open).toBeDefined();
        // after prying at it a while
        expect(sim.tick).toBeGreaterThan(3 * TICKS_PER_SECOND);
        const before = sim.bullets.count;
        sim.step();
        sim.step();
        expect(sim.bullets.count).toBeGreaterThan(before);
    });

    it("opens no sarcophagus if the baboon prying at it is killed", () => {
        const sim = atBaba();
        const boss = baba(sim);
        const call = boss.def.boss!.attacks.find((a) => a.name === "Call baboons")!;
        sim["summonAround"](boss, call);
        for (let i = 0; i < 10 * TICKS_PER_SECOND; i++) {
            sim.player.invulnerable = 0;
            sim.player.hp = sim.player.maxHp;
            sim.player.x = sim.player.prevX = 1036.5;
            sim.player.y = sim.player.prevY = 1028.5;
            boss.bossState!.windup = undefined;
            for (const one of sim.enemies) {
                if (one.pryEnd !== undefined && !one.dead) {
                    sim["killEnemy"](one);
                }
            }
            sim.step();
        }
        expect(sim.tombsSarcophagi.some((s) => sim.tick < s.openUntil)).toBe(false);
    });

    it("makes the sarcophagi's blasts hit harder with Gotta Have Faith", () => {
        const blast = (invocations: string[]) => {
            const sim = atBaba(invocations);
            const at = sim.tombsSarcophagi[0];
            at.openUntil = sim.tick + 100;
            at.nextTick = sim.tick;
            const before = sim.bullets.count;
            sim.player.x = sim.player.prevX = 1036.5;
            sim.player.y = sim.player.prevY = 1028.5;
            sim.step();
            expect(sim.bullets.count).toBeGreaterThan(before);
            return sim.bullets.damage[sim.bullets.order[sim.bullets.count - 1]];
        };
        expect(blast(["gotta_have_faith"])).toBeGreaterThan(blast([]) * 1.3);
    });

    it("stops her boulders once someone gets back up to her", () => {
        const { sim, boss } = rolling();
        // Up the side, well away from her: the top rows are what count
        sim.player.x = sim.player.prevX = 1036.5 - 7;
        sim.player.y = sim.player.prevY = 1046.5 - 2.4;
        sim.step();
        sim.step();
        expect(boss.bossState!.ordeal).toBeUndefined();
    });

    it("opens the gap at the arena's foot with Mind the Gap, which kills", () => {
        expect(atBaba().tombsPit).toBeUndefined();
        const sim = atBaba(["mind_the_gap"]);
        expect(sim.tombsPit).toBeDefined();
        // Walking in over it, before she's up, is fine
        expect(sim.tombsDeaths).toBe(0);
        const deaths = sim.tombsDeaths;
        sim.player.invulnerable = 0;
        sim.player.x = sim.player.prevX = 1036.5;
        sim.player.y = sim.player.prevY = 1026.4;
        sim.step();
        expect(sim.tombsDeaths).toBe(deaths + 1);
    });

    it("says how many deaths are left after a wipe at a boss", () => {
        const sim = atBaba(["mind_the_gap", "try_again"]);
        sim.takeEvents();
        sim.player.invulnerable = 0;
        sim.player.x = sim.player.prevX = 1036.5;
        sim.player.y = sim.player.prevY = 1026.4;
        sim.step();
        expect(sim.tombsDeaths).toBe(1);
        expect(
            sim
                .takeEvents()
                .some((e) => e.type === "notice" && e.message.endsWith(" 9 deaths left.")),
        ).toBe(true);
    });

    it("puts the player back at the foot from the gap in god mode", () => {
        const sim = atBaba(["mind_the_gap"]);
        sim.devGod = true;
        sim.player.x = sim.player.prevX = 1036.5;
        sim.player.y = sim.player.prevY = 1026.4;
        sim.step();
        expect(sim.player.x).toBeCloseTo(1031.5, 0);
        expect(sim.player.y).toBeCloseTo(1028.5, 0);
    });

    it("leaves a banana peel where a baboon dies with Jungle Japes, which roots whoever steps on it", () => {
        const plain = atBaba();
        const one = plain.spawnEnemy(getEnemy("baboon_brawler"), "normal", {
            x: 1030.5,
            y: 1034.5,
        })!;
        plain["killEnemy"](one);
        expect(plain.tombsPeels).toHaveLength(0);
        const sim = atBaba(["jungle_japes"]);
        const baboon = sim.spawnEnemy(getEnemy("baboon_brawler"), "normal", {
            x: 1030.5,
            y: 1034.5,
        })!;
        sim["killEnemy"](baboon);
        expect(sim.tombsPeels).toHaveLength(1);
        const peel = sim.tombsPeels[0];
        sim.player.x = sim.player.prevX = peel.x;
        sim.player.y = sim.player.prevY = peel.y;
        sim.step();
        expect(sim.tombsPeels).toHaveLength(0);
        expect(sim.player.frozen).toBeGreaterThan(0);
        // Rooted already, another peel under them waits: slips don't chain
        sim.tombsPeels.push({ x: peel.x, y: peel.y, endTick: sim.tick + 1000 });
        sim.step();
        expect(sim.tombsPeels).toHaveLength(1);
        sim.player.frozen = 0;
        sim.step();
        expect(sim.tombsPeels).toHaveLength(0);
    });

    it("rolls her boulders no further than the arena's foot", () => {
        const boulders = baba(atBaba()).def.boss!.attacks.find(
            (a) => a.name === "Rolling boulders",
        )!;
        // From her altar to her arena's foot, on the real map
        expect(boulders.pattern!.range).toBeLessThanOrEqual(22);
    });

    it("is tougher with each path level", () => {
        const first = baba(atBaba()).maxHp;
        // (and its raid level, which scales it too)
        expect(baba(atBaba(["pathfinder"])).maxHp).toBeGreaterThanOrEqual(
            Math.floor(first * (1 + 2 * TOMBS_BOSSES.levelHp)),
        );
    });
});

// The Het room in the open field: the beam down from the north, the seal in the middle, the
// Shielded statue south of it, and no barrier, so it starts as soon as the party's in
const HET_DEF = {
    beam: { x: 1036.5, y: 1050.5 },
    target: { x0: 1035, y0: 1027, x1: 1038, y1: 1030 },
    seal: { x: 1036.5, y: 1040.5 },
    floor: { x0: 1026, y0: 1029, x1: 1047, y1: 1052 },
};
const TEST_HET: MapDef = {
    ...TEST_TOMBS,
    id: "test_het",
    tombs: {
        nexus: { x: 1036.5, y: 1036.5 },
        paths: [
            {
                id: "het",
                name: "Path of Het",
                door: { x: 1042.5, y: 1036.5 },
                room: {
                    arrive: { x: 1046.5, y: 1040.5 },
                    puzzle: "het",
                    entrances: [{ x: 1028.5, y: 1040.5 }],
                    het: HET_DEF,
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_HET.id, TEST_HET);

describe("the raid's button", () => {
    function atBaba(): { sim: Sim; boss: Sim["enemies"][number] } {
        const sim = apmeken();
        expect(sim.devSkipToTombsBoss()).toBe(true);
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        sim.weapons = [];
        const boss = sim.enemies.find((e) => e.def.id === "ba_ba" && !e.dead)!;
        return { sim, boss };
    }
    // Three tiles south of her, in the button's reach
    const near = (sim: Sim, boss: Sim["enemies"][number]) => {
        sim.player.x = sim.player.prevX = boss.x;
        sim.player.y = sim.player.prevY = boss.y - 3;
    };

    it("hits a path boss for a share of its hitpoints, twice that with its guard down", () => {
        const { sim, boss } = atBaba();
        expect(sim.ability).toBe(TOMBS_STRIKE);
        near(sim, boss);
        let hp = boss.hp;
        expect(sim.useAbility()).toBe(true);
        const plain = hp - boss.hp;
        const share = boss.maxHp * TOMBS_STRIKE.damageShare!;
        expect(plain).toBeGreaterThanOrEqual(Math.floor(share * 0.85));
        expect(plain).toBeLessThanOrEqual(Math.ceil(share * 1.15));
        // Not again till it's charged
        expect(sim.abilitySecondsLeft()).toBeCloseTo(TOMBS_STRIKE.cooldown);
        hp = boss.hp;
        sim["fireAbility"](TOMBS_STRIKE);
        expect(boss.hp).toBe(hp);
        sim["hero"].abilityReadyTick = 0;
        sim["dropGuard"](boss, 2, false, "test");
        expect(sim.isExposed(boss)).toBe(true);
        hp = boss.hp;
        expect(sim.useAbility()).toBe(true);
        expect(hp - boss.hp).toBeGreaterThanOrEqual(Math.floor(share * 2 * 0.85));
    });

    it("does nothing out of reach, and in the Nexus", () => {
        const { sim, boss } = atBaba();
        sim.player.x = sim.player.prevX = boss.x;
        sim.player.y = sim.player.prevY = boss.y - 8;
        const hp = boss.hp;
        sim["fireAbility"](TOMBS_STRIKE);
        expect(boss.hp).toBe(hp);
        expect(tombs([]).abilityTarget()).toBeUndefined();
    });

    it("drops Ba-Ba's guard when her shockwave hits no one, not when it hits", () => {
        for (const under of [false, true]) {
            const { sim, boss } = atBaba();
            const shockwave = boss.def.boss!.attacks.find((a) => a.name === "Shockwave")!;
            expect(shockwave.opens).toBeGreaterThan(0);
            sim["startBossAttack"](boss, shockwave);
            const at = under ? { x: boss.x, y: boss.y - 1.5 } : { x: boss.x, y: boss.y - 8 };
            let opened = false;
            for (let i = 0; i < 2.5 * TICKS_PER_SECOND; i++) {
                seconds(sim, 1 / TICKS_PER_SECOND, at);
                opened ||= sim.isExposed(boss);
            }
            expect(opened).toBe(!under);
        }
    });
});

describe("the Het room", () => {
    function het(invocations: string[] = [], seed = 3): Sim {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: TEST_HET.id,
            characterId: "warrior",
            metaStats: emptyStats(),
            seed,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations,
        });
        sim.weapons = [];
        sim.player.x = sim.player.prevX = 1042.5;
        sim.step();
        expect(sim.tombsPath).toBe("het");
        // Out of the way of everything, and kept up
        sim.player.x = sim.player.prevX = 1046.5;
        sim.player.y = sim.player.prevY = 1033.5;
        sim.step();
        expect(sim.tombsRoom!.het).toBeDefined();
        return sim;
    }
    const room = (sim: Sim) => sim.tombsRoom!.het!;
    const trace = (sim: Sim) => sim["traceHetBeam"](room(sim), HET_DEF);
    const seal = (sim: Sim) => sim.enemies.find((e) => e.def.id === "hets_seal" && !e.dead);

    // The room set as its answer says: the loose mirrors on the spots the way wants, turned, and
    // the worn barriers on the way gone
    function solve(sim: Sim): void {
        const het = room(sim);
        const loose = het.mirrors.filter((m) => !m.fixed);
        het.solution.forEach((want, i) => {
            const mirror = loose[i];
            mirror.spot = want.spot;
            mirror.turn = want.turn;
            mirror.x = het.spots[want.spot].x;
            mirror.y = het.spots[want.spot].y;
        });
        het.barriers = het.barriers.filter((b) => !b.worn);
    }
    const stand = (sim: Sim, x: number, y: number) => {
        sim.player.x = sim.player.prevX = x;
        sim.player.y = sim.player.prevY = y;
    };

    it("lays out a way round the seal: fixed mirrors turned right, a spot for each loose one", () => {
        const ways = new Set<string>();
        for (let seed = 1; seed <= 6; seed++) {
            const sim = het([], seed);
            const het_ = room(sim);
            ways.add(JSON.stringify(het_.solution.map((w) => het_.spots[w.spot])));
            expect(het_.solution.length).toBeGreaterThanOrEqual(HET.placedLeast);
            expect(het_.solution.length).toBeLessThanOrEqual(HET.placedMost);
            // As many loose mirrors as spots, and no spot that isn't wanted
            expect(het_.mirrors.filter((m) => !m.fixed)).toHaveLength(het_.solution.length);
            expect(het_.spots).toHaveLength(het_.solution.length);
            // A worn barrier on the way with its circle, whole ones about, the seal's ring
            expect(het_.barriers.some((b) => b.worn && b.stand)).toBe(true);
            expect(het_.barriers.some((b) => !b.worn)).toBe(true);
            expect(het_.ring.length).toBeGreaterThan(8);
            // Not done as it starts; done once the answer's set and the barriers broken
            expect(trace(sim).hit).toBe(false);
            solve(sim);
            expect(trace(sim).hit).toBe(true);
        }
        expect(ways.size).toBeGreaterThan(1);
    });

    it("picks up as many loose mirrors as there are, sets one down on a spot, and turns it", () => {
        const sim = het([], 2);
        const het_ = room(sim);
        const loose = het_.mirrors.filter((m) => !m.fixed);
        for (const mirror of loose) {
            stand(sim, mirror.x + 0.9, mirror.y);
            sim.step();
            // Off it, somewhere clear of every spot
            stand(sim, 1046.5, 1033.5);
            sim.step();
        }
        expect(loose.every((m) => m.carrier === 0)).toBe(true);
        expect(sim.hetInfo!.held).toBe(loose.length);
        // Walked over a spot, they're carried on; stopped on it, one's set there
        const spot = het_.spots[0];
        sim.player.x = spot.x;
        sim.player.y = spot.y;
        sim.player.prevX = spot.x - 0.2;
        sim.player.prevY = spot.y;
        sim["stepHetMirrors"](het_);
        expect(het_.mirrors.some((m) => m.spot === 0)).toBe(false);
        stand(sim, spot.x, spot.y);
        sim.step();
        const set = het_.mirrors.find((m) => m.spot === 0)!;
        expect(set.carrier).toBeUndefined();
        expect(sim.hetInfo!.held).toBe(loose.length - 1);
        // Into it: turned, as often as you like, and never lifted back off
        const bump = () => {
            stand(sim, spot.x + 4, spot.y);
            sim.step();
            stand(sim, spot.x + 0.9, spot.y);
            sim.step();
        };
        for (let i = 1; i <= 4; i++) {
            bump();
            expect(set.turn).toBe(i % 2);
            expect(set.spot).toBe(0);
        }
    });

    it("always puts a worn barrier on the way, and keeps the seal's ring off it", () => {
        for (let seed = 1; seed <= 30; seed++) {
            const het_ = room(het([], seed));
            const solids = [...het_.mirrors, ...het_.spots, ...het_.barriers];
            expect(het_.barriers.some((b) => b.worn && b.stand)).toBe(true);
            for (const tile of het_.ring) {
                expect(solids.some((m) => m.x === tile.x && m.y === tile.y)).toBe(false);
            }
        }
    });

    it("drops what a hero carried where they go down, and cleans a dirty mirror walked into", () => {
        const sim = het([], 2);
        const het_ = room(sim);
        const loose = het_.mirrors.filter((m) => !m.fixed);
        for (const mirror of loose) {
            mirror.carrier = 0;
        }
        stand(sim, 1046.5, 1033.5);
        sim.heroes[0].down = true;
        sim["stepHetMirrors"](het_);
        sim.heroes[0].down = false;
        expect(loose.every((m) => m.carrier === undefined)).toBe(true);
        // Each on a tile of its own
        expect(new Set(loose.map((m) => m.x + "," + m.y)).size).toBe(loose.length);
        const fixed = het_.mirrors.find((m) => m.fixed) ?? het_.mirrors[0];
        fixed.dirty = true;
        stand(sim, fixed.x + 4, fixed.y);
        sim.step();
        stand(sim, fixed.x + 0.9, fixed.y);
        sim.step();
        expect(fixed.dirty).toBe(false);
    });

    it("leaves a fixed mirror be: turned right, never moved", () => {
        const sim = het();
        const mirror = room(sim).mirrors.find((m) => m.fixed)!;
        const turn = mirror.turn;
        stand(sim, mirror.x + 0.9, mirror.y);
        sim.step();
        expect(mirror.turn).toBe(turn);
        expect(mirror.carrier).toBeUndefined();
    });

    it("breaks a worn barrier stood in its circle a few seconds, not a whole one", () => {
        const sim = het();
        const het_ = room(sim);
        const worn = het_.barriers.find((b) => b.worn)!;
        const circle = worn.stand!;
        // Beside it but out of its circle: nothing
        for (let i = 0; i < 4 * TICKS_PER_SECOND; i++) {
            stand(sim, circle.x + (circle.x - worn.x) * 1.5, circle.y + (circle.y - worn.y) * 1.5);
            sim.step();
        }
        expect(het_.barriers.includes(worn)).toBe(true);
        for (let i = 0; i < (HET.mine.barrier + 0.2) * TICKS_PER_SECOND; i++) {
            stand(sim, circle.x, circle.y);
            sim.step();
        }
        expect(het_.barriers.includes(worn)).toBe(false);
        expect(het_.barriers.some((b) => !b.worn)).toBe(true);
    });

    it("opens the seal when the beam reaches the statue, mined only from its ring", () => {
        const sim = het();
        solve(sim);
        stand(sim, 1046.5, 1033.5);
        const wave = sim.tombsRoom!.wave;
        const caskets = sim.pickups.filter((p) => p.kind === "casket").length;
        room(sim).nextBeamTick = sim.tick;
        room(sim).nextOrbTick = sim.tick + 10_000;
        sim.step();
        const target = seal(sim)!;
        expect(target.maxHp).toBe(HET.sealHp);
        expect(room(sim).openUntil).toBeGreaterThan(sim.tick);
        expect(sim.tombsRoom!.wave).toBe(wave + 1);
        expect(sim.pickups.filter((p) => p.kind === "casket").length).toBe(caskets + 1);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        expect(sim.damageEnemy(target, 500, 0, target.x, target.y)).toBe(0);
        // Off the ring: nothing
        const hp = target.hp;
        stand(sim, target.x + 4, target.y + 4);
        sim.step();
        expect(target.hp).toBe(hp);
        // In it: a swing, by the hero's Mining (none: the least)
        const [least, most] = HET.mine.hits[0];
        const tile = room(sim).ring[0];
        stand(sim, tile.x, tile.y);
        sim.step();
        expect(hp - target.hp).toBeGreaterThanOrEqual(least);
        expect(hp - target.hp).toBeLessThanOrEqual(most);
        // Shut once its time's up, and the room laid out afresh: the loose mirrors off their
        // spots, so the beam's to be brought round again
        const mirrors = room(sim).mirrors;
        for (let i = 0; i < (HET.open + 1) * TICKS_PER_SECOND; i++) {
            stand(sim, 1046.5, 1033.5);
            sim.step();
        }
        expect(room(sim).openUntil).toBe(-1);
        expect(target.shieldEnd).toBeGreaterThan(sim.tick);
        expect(room(sim).mirrors).not.toBe(mirrors);
        expect(
            room(sim)
                .mirrors.filter((m) => !m.fixed)
                .every((m) => m.spot === undefined),
        ).toBe(true);
        expect(trace(sim).hit).toBe(false);
    });

    it("mines the seal harder with the shop's Mining", () => {
        const sim = het();
        const mining = SHOP_UPGRADES.find((u) => u.id === "mining")!;
        sim.heroes[0].metaStats[mining.stat] = mining.perRank * mining.maxRank;
        expect(sim["hetMineHit"](sim.heroes[0])).toEqual(HET.mine.hits[mining.maxRank]);
    });

    it("sends Orbs of Darkness across that hurt", () => {
        const sim = het(["pathfinder"]);
        // Solo, an orb crossing a mirror leaves it clean (in a party it dirties it, as OSRS's)
        const mirror = room(sim).mirrors[0];
        room(sim).orbs.push({ x: mirror.x - 3, y: mirror.y, vx: 0.2, vy: 0 });
        room(sim).nextOrbTick = sim.tick + 10_000;
        for (let i = 0; i < 20; i++) {
            sim.step();
        }
        expect(mirror.dirty).toBe(false);
        // and into the player
        sim.player.invulnerable = 0;
        const hp = sim.player.hp;
        room(sim).orbs.push({ x: sim.player.x - 1, y: sim.player.y, vx: 0.2, vy: 0 });
        for (let i = 0; i < 8; i++) {
            sim.step();
        }
        expect(sim.player.hp).toBeLessThan(hp);
    });

    it("is done once the seal breaks", () => {
        const sim = het();
        const target = seal(sim)!;
        sim["killEnemy"](target);
        sim.step();
        expect(sim.tombsRoom!.doneTick).toBeDefined();
    });
});

// Akkha after the Het room, in the open field: his floor's middle where he rises, its quadrants
// 10 tiles each way, the party let in south of it
const TEST_AKKHA: MapDef = {
    ...TEST_HET,
    id: "test_akkha",
    tombs: {
        nexus: { x: 1036.5, y: 1036.5 },
        paths: [
            {
                id: "het",
                name: "Path of Het",
                door: { x: 1042.5, y: 1036.5 },
                room: {
                    arrive: { x: 1046.5, y: 1040.5 },
                    puzzle: "het",
                    entrances: [{ x: 1028.5, y: 1040.5 }],
                    het: HET_DEF,
                    boss: {
                        enemyId: "akkha",
                        arrive: { x: 1036.5, y: 1024.5 },
                        at: { x: 1036.5, y: 1040.5 },
                        line: { y: 1026 },
                        quadrants: { middle: { x: 1036.5, y: 1040.5 }, half: 10 },
                    },
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_AKKHA.id, TEST_AKKHA);

describe("Akkha", () => {
    // A tile into each quadrant, by its number: north-west, north-east, south-east, south-west
    const IN = [
        { x: 1031.5, y: 1045.5 },
        { x: 1041.5, y: 1045.5 },
        { x: 1041.5, y: 1035.5 },
        { x: 1031.5, y: 1035.5 },
    ];
    const DEF = getEnemy("akkha").boss!.akkha!;
    function atAkkha(invocations: string[] = [], seed = 3): Sim {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: TEST_AKKHA.id,
            characterId: "warrior",
            metaStats: emptyStats(),
            seed,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations,
        });
        sim.weapons = [];
        sim.player.x = sim.player.prevX = 1042.5;
        sim.step();
        expect(sim.devSkipToTombsBoss()).toBe(true);
        sim.weapons = [];
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        expect(sim.tombsAkkha).toBeDefined();
        return sim;
    }
    const akkha = (sim: Sim) => sim.enemies.find((e) => e.uid === sim.tombsAkkha!.uid)!;

    it("walks through his own shadows to a dead one's quarter, not held behind a live one", () => {
        // Hit steadily; each time his shadows come, kill one and wait in its quarter. A live
        // shadow between him and it held him there for good before (on any seed), so the fight
        // never went on.
        const sim = atAkkha([], 1);
        const boss = akkha(sim);
        let t = 0;
        for (; t < 400 * TICKS_PER_SECOND && !boss.dead; t++) {
            const fight = sim.tombsAkkha!;
            sim.player.hp = sim.player.maxHp;
            sim.player.invulnerable = 0;
            if (t % 10 === 0) {
                sim.damageEnemy(boss, boss.maxHp * 0.05, 0, boss.x, boss.y);
            }
            const live = fight.shadows.filter((s) =>
                sim.enemies.some((e) => e.uid === s.uid && !e.dead),
            );
            const dead = fight.shadows.find((s) => !live.includes(s));
            if (live.length === fight.shadows.length && live.length > 0 && t % 10 === 5) {
                const shadow = sim.enemies.find((e) => e.uid === live[0].uid)!;
                sim.damageEnemy(shadow, shadow.maxHp * 2, 0, shadow.x, shadow.y);
            }
            if (dead) {
                const at = sim.akkhaCorner(dead.quadrant, 6);
                sim.player.x = sim.player.prevX = at.x;
                sim.player.y = sim.player.prevY = at.y;
            }
            if (sim.state === "levelUp") {
                sim.choose(0);
            }
            sim.step();
        }
        expect(boss.dead).toBe(true);
    });

    it("comes on at you between his specials while a shadow's dead, to be drawn into its quarter", () => {
        // With Double Trouble every special's a Memory Blast; his volleys between held him in the
        // middle, so he was never drawn into the dead shadow's quarter and the blasts went on
        for (const seed of [1, 2, 3]) {
            const sim = atAkkha(["double_trouble", "feeling_special", "stay_vigilant"], seed);
            const boss = akkha(sim);
            sim.damageEnemy(boss, boss.maxHp, 0, boss.x, boss.y);
            const line = boss.hp;
            let killedAt = -1;
            let hurtAt = -1;
            let reappeared = false;
            let blasting = false;
            for (let t = 0; t < 60 * TICKS_PER_SECOND && hurtAt < 0; t++) {
                const fight = sim.tombsAkkha!;
                const dead = fight.shadows.find(
                    (s) => !sim.enemies.some((e) => e.uid === s.uid && !e.dead),
                );
                // Back from the blast just inside the dead shadow's quarter, not in the middle
                if (blasting && !fight.memory && dead) {
                    const middle = sim.tombsPathRoom!.boss!.quadrants!.middle;
                    expect(sim.akkhaQuadrant(boss.x, boss.y)).toBe(dead.quadrant);
                    expect(Math.abs(boss.x - middle.x)).toBeGreaterThanOrEqual(DEF.shadows.inside);
                    expect(Math.abs(boss.y - middle.y)).toBeGreaterThanOrEqual(DEF.shadows.inside);
                    reappeared = true;
                }
                blasting = fight.memory !== undefined;
                if (!dead && fight.memory && fight.shadows.length > 0) {
                    const shadow = sim.enemies.find((e) => e.uid === fight.shadows[0].uid)!;
                    sim.damageEnemy(shadow, shadow.maxHp * 2, 0, shadow.x, shadow.y);
                    killedAt = t;
                }
                if (dead) {
                    const at = sim.akkhaCorner(dead.quadrant, 6);
                    sim.player.x = sim.player.prevX = at.x;
                    sim.player.y = sim.player.prevY = at.y;
                    if (t % 10 === 0) {
                        sim.damageEnemy(boss, boss.maxHp * 0.01, 0, boss.x, boss.y);
                    }
                    if (boss.hp < line) {
                        hurtAt = t;
                    }
                }
                sim.player.hp = sim.player.maxHp;
                sim.player.invulnerable = 0;
                if (sim.state === "levelUp") {
                    sim.choose(0);
                }
                sim.step();
            }
            expect(killedAt).toBeGreaterThanOrEqual(0);
            expect(reappeared).toBe(true);
            expect(hurtAt).toBeGreaterThan(0);
            // The rest of the blast, then he reappears in its quarter, hurt at once
            expect((hurtAt - killedAt) / TICKS_PER_SECOND).toBeLessThan(15);
        }
    });

    describe("Detonate", () => {
        // A party of two at him, each put on a tile
        function party(): Sim {
            const sim = new Sim({
                grid: makeGrid(field(), 1000, 1000),
                mapId: TEST_AKKHA.id,
                characterId: "",
                metaStats: emptyStats(),
                seed: 3,
                spawnX: 1036.5,
                spawnY: 1036.5,
                party: ["warrior", "wizard"].map((characterId) => ({
                    name: characterId,
                    characterId,
                    metaStats: emptyStats(),
                })),
            });
            for (const hero of sim.heroes) {
                sim.as(hero.index, () => (sim.weapons = []));
            }
            sim.player.x = sim.player.prevX = 1042.5;
            sim.step();
            expect(sim.devSkipToTombsBoss()).toBe(true);
            seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
            expect(sim.tombsAkkha).toBeDefined();
            return sim;
        }
        const put = (sim: Sim, index: number, x: number, y: number) => {
            const player = sim.heroes[index].player;
            player.x = player.prevX = x;
            player.y = player.prevY = y;
            player.hp = player.maxHp;
            player.invulnerable = 0;
        };

        it("hurts a teammate in the marked one's plus, and spares one on the same tile", () => {
            const sim = party();
            const fight = sim.tombsAkkha!;
            fight.attacks = 0;
            fight.detonate = { tick: sim.tick + 1, cross: [false, false] };
            put(sim, 0, 1030.5, 1032.5);
            put(sim, 1, 1031.5, 1032.5);
            sim.step();
            sim.step();
            expect(fight.detonate).toBeUndefined();
            const second = sim.heroes[1].player;
            expect(second.hp).toBeLessThan(second.maxHp);
            // Both on one tile: nothing
            fight.detonate = { tick: sim.tick + 1, cross: [false, false] };
            put(sim, 0, 1030.5, 1032.5);
            put(sim, 1, 1030.5, 1032.5);
            sim.step();
            sim.step();
            expect(second.hp).toBe(second.maxHp);
            expect(sim.heroes[0].player.hp).toBe(sim.heroes[0].player.maxHp);
        });

        it("misses a teammate off its row and column (but an X catches the corners)", () => {
            const sim = party();
            const fight = sim.tombsAkkha!;
            fight.attacks = 0;
            fight.detonate = { tick: sim.tick + 1, cross: [false, false] };
            put(sim, 0, 1030.5, 1032.5);
            put(sim, 1, 1031.5, 1033.5);
            sim.step();
            sim.step();
            const second = sim.heroes[1].player;
            expect(second.hp).toBe(second.maxHp);
            fight.detonate = { tick: sim.tick + 1, cross: [true, true] };
            put(sim, 0, 1030.5, 1032.5);
            put(sim, 1, 1031.5, 1033.5);
            sim.step();
            sim.step();
            expect(second.hp).toBeLessThan(second.maxHp);
        });
    });
    const special = (sim: Sim) => {
        sim.tombsAkkha!.attacks = DEF.specialEvery;
    };
    // A tick at a spot, hurt as it comes
    const tickAt = (sim: Sim, at: { x: number; y: number }) => {
        sim.player.x = sim.player.prevX = at.x;
        sim.player.y = sim.player.prevY = at.y;
        sim.player.invulnerable = 0;
        sim.step();
    };

    it("rises when the party walks in, in melee and praying against it", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        expect(boss.def.id).toBe("akkha");
        expect(boss.def.protects!.styles).toEqual(["melee"]);
        expect(IN.map((at) => sim.akkhaQuadrant(at.x, at.y))).toEqual([0, 1, 2, 3]);
    });

    it("counts his attacks to a special, then turns to another style", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        for (let i = 0; i < 240 && boss.def.id === "akkha"; i++) {
            seconds(sim, 0.5, { x: boss.x, y: boss.y - 3 });
        }
        expect(boss.def.id).not.toBe("akkha");
        expect(boss.def.protects!.styles).not.toEqual(["melee"]);
        const fight = sim.tombsAkkha!;
        expect(fight.memory !== undefined || fight.orbsUntil > sim.tick).toBe(true);
    });

    describe("Memory Blast", () => {
        function memory(invocations: string[] = [], seed = 3): Sim {
            for (let tries = 0; tries < 20; tries++) {
                const sim = atAkkha(invocations, seed + tries);
                special(sim);
                seconds(sim, 0.1, IN[2]);
                if (sim.tombsAkkha!.memory) {
                    return sim;
                }
            }
            throw new Error("no Memory Blast in 20 seeds");
        }

        it("lights the symbols in an order, each beside the last, never across", () => {
            for (let seed = 1; seed <= 4; seed++) {
                const order = memory([], seed * 7).tombsAkkha!.memory!.order;
                expect(order).toHaveLength(DEF.memory.steps);
                for (let i = 1; i < order.length; i++) {
                    expect([1, 3]).toContain((order[i] - order[i - 1] + 4) % 4);
                }
            }
            // Longer with the path level
            const longer = memory(["pathfinder"]).tombsAkkha!.memory!.order.length;
            expect(longer).toBe(DEF.memory.steps + 1);
        });

        it("shows the order one symbol at a time, and he's gone from the floor meanwhile", () => {
            const sim = memory();
            const plan = sim.tombsAkkha!.memory!;
            const lit: number[] = [];
            while (sim.tick < plan.showEnd) {
                const now = sim.akkhaLit;
                if (now !== undefined && lit[lit.length - 1] !== now) {
                    lit.push(now);
                }
                expect(akkha(sim).shieldEnd).toBeGreaterThan(sim.tick);
                seconds(sim, 1 / TICKS_PER_SECOND, IN[2]);
            }
            // Each flash is one: two the same can't come in a row, as each is beside the last
            expect(lit).toEqual(plan.order);
        });

        it("blasts every quadrant but the next in the order: follow it and nothing hits", () => {
            const follow = memory();
            const plan = follow.tombsAkkha!.memory!;
            const order = [...plan.order];
            let hurt = 0;
            for (let step = 0; step < order.length; step++) {
                const burstTick = plan.showEnd + plan.burst * (step + 1);
                while (follow.tick <= burstTick) {
                    const before = follow.player.hp;
                    tickAt(follow, IN[order[step]]);
                    hurt += Math.max(0, before - follow.player.hp);
                }
            }
            expect(follow.tombsAkkha!.memory).toBeUndefined();
            expect(hurt).toBe(0);

            // Stood across from the first, its burst takes nearly half your hitpoints
            const wrong = memory();
            const blast = wrong.tombsAkkha!.memory!;
            const away = IN[(blast.order[0] + 2) % 4];
            for (
                let i = 0;
                i < 30 * TICKS_PER_SECOND && wrong.tombsAkkha!.bursts.length === 0;
                i++
            ) {
                wrong.player.hp = wrong.player.maxHp;
                tickAt(wrong, away);
            }
            expect(wrong.player.maxHp - wrong.player.hp).toBeGreaterThanOrEqual(
                Math.floor(wrong.player.maxHp * DEF.memory.damage) - 1,
            );
            expect(wrong.tombsAkkha!.bursts[0].quadrants).not.toContain(blast.order[0]);
        });

        it("gives half the time between bursts with Feeling Special", () => {
            const plain = memory().tombsAkkha!.memory!.burst;
            const quick = memory(["feeling_special"]).tombsAkkha!.memory!.burst;
            expect(quick).toBe(Math.round(plain / 2));
        });

        it("reappears where he vanished, and is on the floor a while before the next", () => {
            // Raid level 500's: every special a Memory Blast, an attack sooner, quick bursts
            const sim = memory(["double_trouble", "stay_vigilant", "feeling_special"]);
            const fight = sim.tombsAkkha!;
            const plan = fight.memory!;
            const middle = { x: akkha(sim).x, y: akkha(sim).y };
            const done = plan.showEnd + plan.burst * plan.order.length;
            while (sim.tick <= done && fight.memory) {
                seconds(sim, 1 / TICKS_PER_SECOND, IN[2]);
            }
            expect(fight.memory).toBeUndefined();
            const boss = akkha(sim);
            // No shadows up: back where he was, not in the middle
            expect(Math.hypot(boss.x - plan.from.x, boss.y - plan.from.y)).toBeLessThan(0.2);
            expect(plan.from).not.toEqual(middle);
            // His attacks made already, he's still on the floor as long as he was gone, and
            // specialGap at least, before the next
            const back = sim.tick;
            for (let i = 0; i < 60 * TICKS_PER_SECOND && !fight.memory; i++) {
                special(sim);
                sim.player.hp = sim.player.maxHp;
                seconds(sim, 1 / TICKS_PER_SECOND, IN[2]);
            }
            expect(fight.memory).toBeDefined();
            const floor = sim.tick - back;
            expect(floor).toBeGreaterThanOrEqual(done - plan.start - 1);
            expect(floor / TICKS_PER_SECOND).toBeGreaterThanOrEqual(DEF.specialGap - 0.1);
            expect(floor).toBeLessThan(done - plan.start + 2 * TICKS_PER_SECOND);
        });
    });

    describe("trailing orbs", () => {
        function orbs(invocations: string[] = []): Sim {
            for (let seed = 3; seed < 23; seed++) {
                const sim = atAkkha(invocations, seed);
                special(sim);
                seconds(sim, 0.1, IN[2]);
                if (!sim.tombsAkkha!.memory && sim.tombsAkkha!.orbsUntil > sim.tick) {
                    return sim;
                }
            }
            throw new Error("no trailing orbs in 20 seeds");
        }

        it("drops an orb on every tile you leave, none while you stand still", () => {
            const sim = orbs();
            seconds(sim, 1, IN[2]);
            expect(sim.tombsAkkha!.orbs).toHaveLength(0);
            seconds(sim, 0.1, { x: IN[2].x + 1, y: IN[2].y });
            seconds(sim, 0.1, { x: IN[2].x + 2, y: IN[2].y });
            expect(sim.tombsAkkha!.orbs.map((orb) => orb.x)).toEqual([IN[2].x, IN[2].x + 1]);
            // Ice, in the south-east
            expect(sim.tombsAkkha!.orbs[0].quadrant).toBe(2);
        });

        it("goes off under whoever steps back on one once it's armed, with its element", () => {
            const sim = orbs();
            seconds(sim, 0.1, IN[2]);
            seconds(sim, 0.1, { x: IN[2].x + 1, y: IN[2].y });
            seconds(sim, 1, { x: IN[2].x + 3, y: IN[2].y });
            const before = sim.player.hp;
            tickAt(sim, IN[2]);
            expect(sim.player.hp).toBeLessThan(before);
            expect(sim.debuffs.some((d) => d.id === "akkha_ice")).toBe(true);
        });

        it("drops one ahead of you too with Feeling Special", () => {
            const sim = orbs(["feeling_special"]);
            seconds(sim, 0.1, IN[2]);
            seconds(sim, 0.1, { x: IN[2].x + 1, y: IN[2].y });
            expect(sim.tombsAkkha!.orbs.map((orb) => orb.x)).toEqual([IN[2].x, IN[2].x + 3]);
        });
    });

    describe("his shadows", () => {
        function shadows(): Sim {
            const sim = atAkkha();
            const boss = akkha(sim);
            // Into his second phase, a hit held at its share, where they come
            sim.damageEnemy(boss, boss.hp - Math.floor(boss.maxHp * 0.65), 0, boss.x, boss.y);
            expect(boss.bossState!.phase!.index).toBe(1);
            seconds(sim, 0.1, { x: 1036.5, y: 1028.5 });
            return sim;
        }
        const shadowOf = (sim: Sim, quadrant: number) => {
            const uid = sim.tombsAkkha!.shadows.find((s) => s.quadrant === quadrant)!.uid;
            return sim.enemies.find((e) => e.uid === uid)!;
        };
        const placeBoss = (sim: Sim, at: { x: number; y: number }) => {
            const boss = akkha(sim);
            boss.x = boss.prevX = at.x;
            boss.y = boss.prevY = at.y;
            return boss;
        };

        it("come in each corner at 66%, and he can't be hurt while they're all up", () => {
            const sim = shadows();
            expect(sim.tombsAkkha!.shadows).toHaveLength(4);
            const boss = akkha(sim);
            expect(boss.shieldEnd).toBeGreaterThan(sim.tick);
            const hp = boss.hp;
            sim.damageEnemy(boss, 500, 0, boss.x, boss.y);
            expect(boss.hp).toBe(hp);
        });

        it("lets him be hurt once he's drawn into a quadrant whose shadow is dead", () => {
            const sim = shadows();
            const shadow = shadowOf(sim, 3);
            sim.damageEnemy(shadow, 1e9, 0, shadow.x, shadow.y);
            // In a quadrant whose shadow's still up
            for (let i = 0; i < 3; i++) {
                placeBoss(sim, IN[1]);
                seconds(sim, 0.1, { x: 1036.5, y: 1028.5 });
            }
            expect(akkha(sim).shieldEnd).toBeGreaterThan(sim.tick);
            // Lured into the dead one's
            for (let i = 0; i < 3; i++) {
                placeBoss(sim, IN[3]);
                seconds(sim, 0.1, { x: 1036.5, y: 1028.5 });
            }
            const boss = placeBoss(sim, IN[3]);
            const hp = boss.hp;
            sim.damageEnemy(boss, 500, 0, boss.x, boss.y);
            expect(boss.hp).toBeLessThan(hp);
        });

        it("only lets one be dispelled: the rest are shielded once one's struck", () => {
            const sim = shadows();
            const first = shadowOf(sim, 0);
            const other = shadowOf(sim, 1);
            expect(sim.damageEnemy(first, 10, 0, first.x, first.y)).toBeGreaterThan(0);
            const hp = other.hp;
            expect(sim.damageEnemy(other, 500, 0, other.x, other.y)).toBe(0);
            expect(other.hp).toBe(hp);
            sim.damageEnemy(first, 1e9, 0, first.x, first.y);
            seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
            expect(other.shieldEnd).toBeGreaterThan(sim.tick);
            expect(sim.damageEnemy(other, 500, 0, other.x, other.y)).toBe(0);
        });

        it("keeps him shielded straddling a quarter's lines, even the dead shadow's", () => {
            const sim = shadows();
            const shadow = shadowOf(sim, 3);
            sim.damageEnemy(shadow, 1e9, 0, shadow.x, shadow.y);
            const middle = sim.tombsPathRoom!.boss!.quadrants!.middle;
            // In the dead one's quarter by a hair
            for (let i = 0; i < 3; i++) {
                placeBoss(sim, { x: IN[3].x, y: middle.y - 0.4 });
                seconds(sim, 0.1, { x: 1036.5, y: 1028.5 });
            }
            const boss = placeBoss(sim, { x: IN[3].x, y: middle.y - 0.4 });
            const hp = boss.hp;
            sim.damageEnemy(boss, 500, 0, boss.x, boss.y);
            expect(boss.hp).toBe(hp);
        });

        it("floods its quadrant if it's left up", () => {
            const sim = shadows();
            const at = IN[sim.tombsAkkha!.shadows[0].quadrant];
            const flooded = () => sim.tombsAkkha!.bursts.some((b) => b.kind === "flood");
            // Kept from his specials, which would hold the shadows' charge
            for (let i = 0; i < 40 * TICKS_PER_SECOND && !flooded(); i++) {
                sim.tombsAkkha!.attacks = 0;
                sim.player.hp = sim.player.maxHp;
                tickAt(sim, at);
            }
            expect(flooded()).toBe(true);
            expect(sim.player.maxHp - sim.player.hp).toBeGreaterThanOrEqual(
                Math.floor(sim.player.maxHp * DEF.shadows.damage) - 1,
            );
        });

        it("stops a hit at his next share, so the shadows always come", () => {
            const sim = atAkkha();
            const boss = akkha(sim);
            boss.hp = Math.floor(boss.maxHp * 0.85);
            sim.damageEnemy(boss, boss.maxHp, 0, boss.x, boss.y);
            // Held at his second phase's share (BossDef.phases), where they come
            expect(Math.abs(boss.hp - boss.maxHp * 0.66)).toBeLessThan(2);
            seconds(sim, 0.1, { x: 1036.5, y: 1028.5 });
            expect(sim.tombsAkkha!.shadows).toHaveLength(4);
        });

        it("takes nothing from the style he prays against", () => {
            const sim = atAkkha();
            const boss = akkha(sim);
            const style = boss.def.protects!.styles[0];
            const hp = boss.hp;
            Object.defineProperty(sim, "sourceStyle", { get: () => style, configurable: true });
            expect(sim.damageEnemy(boss, 500, 0, boss.x, boss.y)).toBe(0);
            expect(boss.hp).toBe(hp);
        });
        it("floods every quadrant whose shadow is up when the timer runs out, sparing a dead one's", () => {
            const sim = shadows();
            const shadow = shadowOf(sim, 2);
            sim.damageEnemy(shadow, 1e9, 0, shadow.x, shadow.y);
            const flooded = () => sim.tombsAkkha!.bursts.find((b) => b.kind === "flood");
            let hurt = 0;
            for (let i = 0; i < 40 * TICKS_PER_SECOND && !flooded(); i++) {
                sim.tombsAkkha!.attacks = 0;
                sim.player.hp = sim.player.maxHp;
                tickAt(sim, IN[2]);
                hurt = sim.player.maxHp - sim.player.hp;
            }
            expect(flooded()!.quadrants.sort()).toEqual([0, 1, 3]);
            // Safe in the cleared quarter: nothing like the flood's hit, the tick it came
            expect(hurt).toBeLessThan(sim.player.maxHp * DEF.shadows.damage * 0.5);
            expect(sim.akkhaShadows).toEqual({ left: 3, seconds: DEF.shadows.flood });
        });
    });

    it("lets his prayer down with his guard: the style he prays against hurts him then", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        const style = boss.def.protects!.styles[0];
        Object.defineProperty(sim, "sourceStyle", { get: () => style, configurable: true });
        expect(sim.damageEnemy(boss, 100, 0, boss.x, boss.y)).toBe(0);
        sim["dropGuard"](boss, 1.5, false, "test");
        expect(sim.damageEnemy(boss, 100, 0, boss.x, boss.y)).toBeGreaterThan(0);
    });

    it("keeps to what one step answers while his orbs are out", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        sim.tombsAkkha!.orbsUntil = sim.tick + 30 * TICKS_PER_SECOND;
        const used = new Set<string>();
        for (let i = 0; i < 20 * TICKS_PER_SECOND; i++) {
            sim.tombsAkkha!.attacks = 0;
            const name = boss.bossState!.windup?.attack.name;
            if (name) {
                used.add(name);
            }
            tickAt(sim, { x: boss.x, y: boss.y - 2.5 });
        }
        expect(used.size).toBeGreaterThan(0);
        for (const name of used) {
            expect(DEF.orbAttacks).toContain(name);
        }
    });

    it("lights each of his magic's marks with its quadrant's element", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        const strike = getEnemy("akkha_magic").boss!.attacks.find(
            (a) => a.name === "Elemental strike",
        )!;
        sim.player.x = sim.player.prevX = IN[2].x;
        sim.player.y = sim.player.prevY = IN[2].y;
        sim["markGround"](boss, strike, sim.tick + 50);
        const mark = sim.hazards.find(
            (h) => h.attack === strike && Math.hypot(h.x - IN[2].x, h.y - IN[2].y) < 0.01,
        )!;
        expect(mark.light).toEqual(getEnemy(DEF.elements[2].orb).light);
    });

    it("has one of his shadows lunge his spear's strip, from where it stands", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        sim.damageEnemy(boss, boss.hp - Math.floor(boss.maxHp * 0.65), 0, boss.x, boss.y);
        seconds(sim, 0.1, { x: 1036.5, y: 1028.5 });
        const shadows = sim.enemies.filter((e) => !e.dead && e.def.id === "akkha_shadow");
        expect(shadows).toHaveLength(4);
        const lunge = getEnemy("akkha").boss!.attacks.find((a) => a.name === "Spear lunge")!;
        if (boss.def.id !== "akkha") {
            sim["changeAkkhaForm"](boss, "akkha");
        }
        boss.bossState!.windup = undefined;
        sim["startBossAttack"](boss, lunge);
        const copying = shadows.filter((e) => e.echo);
        expect(copying).toHaveLength(1);
        expect(copying[0].echo!.attack.name).toBe("Shadow's lunge");
        const { x, y } = copying[0];
        seconds(sim, lunge.windup + 1, { x: 1036.5, y: 1028.5 });
        expect(copying[0].x).toBe(x);
        expect(copying[0].y).toBe(y);
    });

    it("brings his quadrant's element with his magic: ice in the south-east", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        const glowing = getEnemy("akkha_magic").boss!.attacks.find((a) => a.elemental)!;
        sim.player.x = sim.player.prevX = IN[2].x;
        sim.player.y = sim.player.prevY = IN[2].y;
        sim.player.invulnerable = 0;
        sim["bossHit"](boss.def.id, boss, glowing, 3);
        expect(sim.debuffs.some((d) => d.id === "akkha_ice")).toBe(true);
    });

    it("makes his final stand at 0 in a corner, against ranged and magic, sending orbs across", () => {
        const sim = atAkkha();
        const boss = akkha(sim);
        // Past his shadows, which would shield him, and into his last phase
        sim.tombsAkkha!.shadowsDone = DEF.shadows.at.length;
        boss.bossState!.phase!.index = 2;
        sim.damageEnemy(boss, 1e9, 0, boss.x, boss.y);
        seconds(sim, 0.2, { x: 1036.5, y: 1028.5 });
        expect(boss.dead).toBe(false);
        expect(boss.def.id).toBe("akkha_enraged");
        expect(boss.def.protects!.styles).toEqual(["ranged", "magic"]);
        expect(Math.abs(boss.x - 1036.5)).toBeCloseTo(DEF.shadows.corner);
        seconds(sim, 3, { x: 1036.5, y: 1028.5 });
        expect(sim.bullets.count).toBeGreaterThan(0);
        const corner = sim.tombsAkkha!.stand!.corner;
        const stand = getEnemy("akkha_enraged").boss!.akkha!.unstable!;
        seconds(sim, stand.moveSeconds, { x: 1036.5, y: 1028.5 });
        expect(sim.tombsAkkha!.stand!.corner).not.toBe(corner);
    });
});

// The Scabaras room's boards in the open field
const grid3 = (xs: number[], ys: number[]) =>
    xs.flatMap((x) => ys.map((y) => ({ x: x + 0.5, y: y + 0.5 })));
const SCABARAS_DEF = {
    // OSRS's diamond of nine round 1033,1052
    sequence: [
        [0, 0],
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
    ].map(([dx, dy]) => ({ x: 1033.5 + dx, y: 1052.5 + dy })),
    lights: [
        [1050, 1048],
        [1052, 1048],
        [1054, 1048],
        [1054, 1050],
        [1054, 1052],
        [1052, 1052],
        [1050, 1052],
        [1050, 1050],
    ].map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 })),
    // OSRS's 5 by 5, row by row from the north, west to east
    addition: [0, 1, 2, 3, 4].flatMap((r) =>
        [0, 1, 2, 3, 4].map((c) => ({ x: 1030.5 + c, y: 1024.5 - r })),
    ),
    matching: {
        north: grid3([1050, 1052, 1054], [1020, 1022, 1024]),
        south: grid3([1050, 1052, 1054], [1010, 1012, 1014]),
    },
    slates: [{ x: 1040.5, y: 1030.5 }],
    tablet: { x: 1032.5, y: 1016.5 },
    button: { x: 1027.5, y: 1048.5 },
};
const TEST_SCABARAS: MapDef = {
    ...TEST_TOMBS,
    id: "test_scabaras",
    tombs: {
        nexus: { x: 1036.5, y: 1036.5 },
        paths: [
            {
                id: "scabaras",
                name: "Path of Scabaras",
                door: { x: 1042.5, y: 1036.5 },
                room: {
                    arrive: { x: 1044.5, y: 1036.5 },
                    puzzle: "scabaras",
                    entrances: [{ x: 1028.5, y: 1040.5 }],
                    scabaras: SCABARAS_DEF,
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_SCABARAS.id, TEST_SCABARAS);

describe("the Scabaras room", () => {
    // Off every board
    const AWAY = { x: 1044.5, y: 1036.5 };
    function scabaras(invocations: string[] = [], seed = 3): Sim {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: TEST_SCABARAS.id,
            characterId: "warrior",
            metaStats: emptyStats(),
            seed,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations,
        });
        sim.weapons = [];
        sim.player.x = sim.player.prevX = 1042.5;
        sim.step();
        expect(sim.tombsPath).toBe("scabaras");
        stand(sim, AWAY);
        expect(sim.tombsRoom!.scabaras).toBeDefined();
        return sim;
    }
    const room = (sim: Sim) => sim.tombsRoom!.scabaras!;
    // On a plate (or anywhere) for a tick, nothing falling meanwhile
    function stand(sim: Sim, at: { x: number; y: number }): void {
        const scabaras = sim.tombsRoom?.scabaras;
        if (scabaras) {
            scabaras.nextRockTick = sim.tick + 1000;
        }
        sim.player.invulnerable = 0;
        sim.player.x = sim.player.prevX = at.x;
        sim.player.y = sim.player.prevY = at.y;
        if (sim.state === "chest") {
            sim.resolveChest("take");
        }
        if (sim.state === "levelUp") {
            sim.choose(0);
        }
        sim.step();
    }
    // Onto a plate from off every board, and back off
    function step(sim: Sim, at: { x: number; y: number }): void {
        stand(sim, AWAY);
        stand(sim, at);
        stand(sim, AWAY);
    }
    // Till the Sequence's order has been shown
    function shown(sim: Sim): void {
        for (let i = 0; i < 30 * TICKS_PER_SECOND; i++) {
            const sequence = room(sim).sequence;
            if (sim.tick >= sim["scabarasShowEnd"](sequence)) {
                return;
            }
            sim.player.hp = sim.player.maxHp;
            stand(sim, AWAY);
        }
    }
    const caskets = (sim: Sim) => sim.pickups.filter((p) => p.kind === "casket").length;

    // Sequence's order, shown by pushing its button
    const push = (sim: Sim) => step(sim, SCABARAS_DEF.button);
    // The two puzzles before the tablet can be read
    const beforeTablet = (sim: Sim) => room(sim).solved.push("sequence", "lights");

    it("has slates by the way in and the Ancient tablet, read by whoever's by one", () => {
        const sim = scabaras();
        expect(sim.scabarasInfo!.reading).toBeUndefined();
        const slate = SCABARAS_DEF.slates[0];
        sim.player.x = sim.player.prevX = slate.x + 1;
        sim.player.y = sim.player.prevY = slate.y;
        expect(sim.scabarasInfo!.reading).toBe("slate");
        const tablet = SCABARAS_DEF.tablet;
        sim.player.x = sim.player.prevX = tablet.x;
        sim.player.y = sim.player.prevY = tablet.y - 1;
        expect(sim.scabarasInfo!.reading).toBe("tablet");
        // Its number only once the plates' order and the ring are done
        expect(sim.scabarasInfo!.readable).toBe(false);
        beforeTablet(sim);
        expect(sim.scabarasInfo!.readable).toBe(true);
    });

    it("lists its puzzles for the HUD: done, open, or waiting on the others", () => {
        const sim = scabaras();
        const states = () =>
            sim.scabarasInfo!.puzzles.map(({ puzzle, state }) => `${puzzle} ${state}`);
        expect(states()).toEqual([
            "sequence open",
            "lights open",
            "addition waiting",
            "matching waiting",
        ]);
        room(sim).solved.push("lights");
        expect(states()).toEqual([
            "sequence open",
            "lights solved",
            "addition waiting",
            "matching waiting",
        ]);
        // Addition once the tablet's readable, Matching once the other three are done
        room(sim).solved.push("sequence");
        expect(states()).toEqual([
            "sequence solved",
            "lights solved",
            "addition open",
            "matching waiting",
        ]);
        room(sim).solved.push("addition");
        expect(states()).toEqual([
            "sequence solved",
            "lights solved",
            "addition solved",
            "matching open",
        ]);
    });

    it("counts the Sequence's plates lit so far as its order's shown, for the helper", () => {
        const sim = scabaras();
        expect(sim.scabarasSequenceShown).toBe(0);
        push(sim);
        const sequence = room(sim).sequence;
        expect(sequence.showFrom).toBeGreaterThan(sim.tick);
        expect(sim.scabarasSequenceShown).toBe(0);
        // One more as each plate lights, the way scabarasLitPlate goes through them
        const lit: number[] = [];
        while (sim.tick < sim["scabarasShowEnd"](sequence)) {
            const plate = sim.scabarasLitPlate;
            if (plate !== undefined && lit[lit.length - 1] !== plate) {
                lit.push(plate);
                expect(sim.scabarasSequenceShown).toBe(lit.length);
            }
            sim.player.hp = sim.player.maxHp;
            stand(sim, AWAY);
        }
        expect(lit).toEqual(sequence.order);
        expect(sim.scabarasSequenceShown).toBe(sequence.order.length);
    });

    it("lays out every board as it begins", () => {
        const sim = scabaras();
        const scabaras_ = room(sim);
        // Nothing's shown till the button's pushed
        expect(scabaras_.sequence.order).toHaveLength(0);
        push(sim);
        expect(room(sim).sequence.order).toHaveLength(SCABARAS.sequenceSteps);
        expect(new Set(room(sim).sequence.order).size).toBe(SCABARAS.sequenceSteps);
        expect(scabaras_.lights.every((lit) => lit)).toBe(false);
        const { target, values } = scabaras_.addition;
        expect(target).toBeGreaterThanOrEqual(20);
        expect(target).toBeLessThanOrEqual(45);
        expect(values).toEqual(SCABARAS.additionBoard.map((s) => s + 1));
        expect([...scabaras_.matching.north].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        expect(scabaras_.matching.matched.filter((m) => m)).toHaveLength(4);
        expect(sim.tombsRoom!.wave).toBe(0);
    });

    it("makes everything harder with the path level", () => {
        const sim = scabaras(["pathmaster"]);
        push(sim);
        // A plate more every two path levels (Pathmaster's is 3), up to six
        expect(room(sim).sequence.order).toHaveLength(
            Math.min(
                SCABARAS.sequenceMost,
                SCABARAS.sequenceSteps + Math.floor(3 / SCABARAS.sequenceEvery),
            ),
        );
        expect(room(sim).matching.matched.filter((m) => m)).toHaveLength(1);
        expect(sim["scabarasRockEvery"]()).toBeLessThan(4.5);
    });

    describe("Sequence", () => {
        it("lights its plates one at a time, in its order, once its button's pushed", () => {
            const sim = scabaras();
            for (let i = 0; i < 3 * TICKS_PER_SECOND; i++) {
                stand(sim, AWAY);
                expect(sim.scabarasLitPlate).toBeUndefined();
            }
            push(sim);
            const lit: number[] = [];
            for (let i = 0; i < 10 * TICKS_PER_SECOND; i++) {
                const plate = sim.scabarasLitPlate;
                if (plate !== undefined && lit[lit.length - 1] !== plate) {
                    lit.push(plate);
                }
                stand(sim, AWAY);
            }
            expect(lit).toEqual(room(sim).sequence.order);
        });

        it("is solved by stepping on its plates in order, for a casket and the next wave", () => {
            const sim = scabaras();
            push(sim);
            shown(sim);
            const before = caskets(sim);
            for (const plate of room(sim).sequence.order) {
                step(sim, SCABARAS_DEF.sequence[plate]);
            }
            expect(room(sim).solved).toEqual(["sequence"]);
            expect(caskets(sim) + (sim.state === "chest" ? 1 : 0)).toBeGreaterThan(before);
            expect(sim.tombsRoom!.wave).toBe(1);
        });

        it("does nothing while it's being shown, or before the button", () => {
            const sim = scabaras();
            sim.player.hp = sim.player.maxHp;
            step(sim, SCABARAS_DEF.sequence[0]);
            expect(sim.player.hp).toBe(sim.player.maxHp);
            push(sim);
            const order = [...room(sim).sequence.order];
            const wrong = SCABARAS_DEF.sequence.findIndex((_, i) => i !== order[0]);
            sim.player.hp = sim.player.maxHp;
            step(sim, SCABARAS_DEF.sequence[wrong]);
            expect(sim.player.hp).toBe(sim.player.maxHp);
            expect(room(sim).sequence.order).toEqual(order);
        });

        it("won't take a new order from the button part way through one", () => {
            const sim = scabaras();
            push(sim);
            shown(sim);
            const order = [...room(sim).sequence.order];
            step(sim, SCABARAS_DEF.sequence[order[0]]);
            push(sim);
            expect(room(sim).sequence.order).toEqual(order);
            expect(room(sim).sequence.step).toBe(1);
        });

        it("brings the roof down on a wrong plate, and wants the button again", () => {
            const sim = scabaras();
            push(sim);
            shown(sim);
            const old = room(sim).sequence;
            const wrong = SCABARAS_DEF.sequence.findIndex((_, i) => i !== old.order[0]);
            sim.player.hp = sim.player.maxHp;
            stand(sim, SCABARAS_DEF.sequence[wrong]);
            expect(sim.player.maxHp - sim.player.hp).toBeGreaterThanOrEqual(
                Math.round(sim.player.maxHp * 0.25),
            );
            expect(room(sim).sequence.order).toHaveLength(0);
            expect(room(sim).sequence.step).toBe(0);
            push(sim);
            expect(room(sim).sequence.order.length).toBeGreaterThan(0);
            expect(room(sim).shards.length).toBeGreaterThan(0);
        });
    });

    describe("Lights out", () => {
        it("turns a plate and the two beside it", () => {
            const sim = scabaras();
            room(sim).lights.fill(true);
            step(sim, SCABARAS_DEF.lights[0]);
            expect(room(sim).lights).toEqual([false, false, true, true, true, true, true, false]);
        });

        it("is solved once all eight are lit", () => {
            const sim = scabaras();
            const lights = room(sim).lights;
            lights.fill(true);
            lights[2] = lights[3] = lights[4] = false;
            step(sim, SCABARAS_DEF.lights[3]);
            expect(room(sim).solved).toEqual(["lights"]);
        });

        it("has a light go out now and then", () => {
            const sim = scabaras();
            room(sim).lights.fill(true);
            room(sim).lights[0] = false;
            for (let i = 0; i < 15 * TICKS_PER_SECOND; i++) {
                sim.player.hp = sim.player.maxHp;
                stand(sim, AWAY);
            }
            expect(room(sim).lights.filter((lit) => !lit).length).toBeGreaterThan(1);
        });
    });

    describe("Addition", () => {
        // Plates that make n, from the board's values
        function making(values: number[], n: number): number[] | undefined {
            const find = (from: number, left: number): number[] | undefined => {
                if (left === 0) {
                    return [];
                }
                for (let i = from; i < values.length; i++) {
                    if (values[i] <= left) {
                        const rest = find(i + 1, left - values[i]);
                        if (rest) {
                            return [i, ...rest];
                        }
                    }
                }
                return undefined;
            };
            return find(0, n);
        }

        it("is OSRS's board: the wiki's chart's ways across make their numbers", () => {
            const values = SCABARAS.additionBoard.map((s) => s + 1);
            const at = (r: number, c: number) => values[r * 5 + c];
            // From the chart, the exit at the top: 20, 24, 30 and 45
            expect(at(2, 3) + at(3, 2) + at(4, 1)).toBe(20);
            expect(at(1, 4) + at(2, 3) + at(3, 2) + at(4, 1)).toBe(24);
            expect([0, 1, 2, 3, 4].reduce((n, r) => n + at(r, 2), 0)).toBe(30);
            expect(
                [0, 1, 2, 3, 4].reduce((n, r) => n + at(r, 3), 0) + at(4, 0) + at(4, 1) + at(4, 2),
            ).toBe(45);
        });

        it("counts a diagonal step through a corner as the two plates, not those beside", () => {
            const sim = scabaras();
            beforeTablet(sim);
            const [a, b] = [SCABARAS_DEF.addition[0], SCABARAS_DEF.addition[6]];
            stand(sim, AWAY);
            for (let t = 0; t <= 20; t++) {
                // A hair off the true diagonal, as moving freely is
                stand(sim, { x: a.x + t * 0.05, y: a.y - t * 0.05 + 0.00002 });
            }
            const stepped = room(sim).addition.stepped.flatMap((on, i) => (on ? [i] : []));
            expect(stepped).toEqual([0, 6]);
        });

        it("does nothing till the plates' order and the ring are solved", () => {
            const sim = scabaras();
            step(sim, SCABARAS_DEF.addition[0]);
            expect(room(sim).addition.sum).toBe(0);
        });

        it("is solved by making the tablet's number", () => {
            const sim = scabaras();
            beforeTablet(sim);
            const { values, target } = room(sim).addition;
            const plates = making(values, target)!;
            expect(plates).toBeDefined();
            for (const plate of plates) {
                step(sim, SCABARAS_DEF.addition[plate]);
            }
            expect(room(sim).solved).toEqual(["sequence", "lights", "addition"]);
            expect(sim.scabarasInfo!.sum).toBe(target);
        });

        it("brings the roof down past it, and starts over", () => {
            const sim = scabaras();
            beforeTablet(sim);
            const addition = room(sim).addition;
            addition.target = 20;
            addition.values = addition.values.map(() => 9);
            step(sim, SCABARAS_DEF.addition[0]);
            step(sim, SCABARAS_DEF.addition[1]);
            sim.player.hp = sim.player.maxHp;
            stand(sim, SCABARAS_DEF.addition[2]);
            expect(sim.player.hp).toBeLessThan(sim.player.maxHp * 0.8);
            expect(addition.sum).toBe(0);
            expect(addition.stepped.some((s) => s)).toBe(false);
        });
    });

    describe("Matching", () => {
        it("won't turn till the other three are solved", () => {
            const sim = scabaras();
            step(sim, SCABARAS_DEF.matching.north[0]);
            expect(room(sim).matching.up).toEqual({});
        });

        it("keeps a pair that matches, hides one that doesn't, and ends the room", () => {
            const sim = scabaras();
            const scabaras_ = room(sim);
            scabaras_.solved.push("sequence", "lights", "addition");
            const { north, south } = scabaras_.matching;
            const tileOf = (board: number[], symbol: number) => board.indexOf(symbol);
            const left = north.filter((symbol) => !scabaras_.matching.matched[symbol]);
            // A wrong pair first
            const a = left[0];
            const b = left[1];
            sim.player.hp = sim.player.maxHp;
            step(sim, SCABARAS_DEF.matching.north[tileOf(north, a)]);
            stand(sim, SCABARAS_DEF.matching.south[tileOf(south, b)]);
            expect(sim.player.hp).toBeLessThan(sim.player.maxHp * 0.8);
            expect(scabaras_.matching.matched[a]).toBe(false);
            for (let i = 0; i < 2 * TICKS_PER_SECOND; i++) {
                sim.player.hp = sim.player.maxHp;
                stand(sim, AWAY);
            }
            expect(scabaras_.matching.up).toEqual({});
            // Then every pair
            for (const symbol of left) {
                step(sim, SCABARAS_DEF.matching.north[tileOf(north, symbol)]);
                step(sim, SCABARAS_DEF.matching.south[tileOf(south, symbol)]);
            }
            expect(scabaras_.solved).toContain("matching");
            expect(sim.tombsRoom!.doneTick).toBeDefined();
            // Beaten: its puzzle helper unlocks, from the run's result
            expect(sim.getResult().scabarasBeaten).toBe(true);
        });
    });

    it("drops rocks on you, which break into shards", () => {
        const sim = scabaras();
        room(sim).nextRockTick = sim.tick;
        sim.player.x = sim.player.prevX = AWAY.x;
        sim.player.y = sim.player.prevY = AWAY.y;
        sim.step();
        const rock = room(sim).rocks[0];
        expect(rock).toBeDefined();
        expect(Math.abs(rock.x - AWAY.x)).toBeLessThanOrEqual(2);
        sim.player.hp = sim.player.maxHp;
        for (let i = 0; i < 2 * TICKS_PER_SECOND && room(sim).rocks.length > 0; i++) {
            sim.player.invulnerable = 0;
            sim.player.x = sim.player.prevX = rock.x;
            sim.player.y = sim.player.prevY = rock.y;
            room(sim).nextRockTick = sim.tick + 1000;
            sim.step();
        }
        expect(room(sim).rocks).toHaveLength(0);
        expect(sim.player.hp).toBeLessThan(sim.player.maxHp);
    });
});

const TEST_KEPHRI: MapDef = {
    ...TEST_SCABARAS,
    id: "test_kephri",
    tombs: {
        ability: TOMBS_STRIKE,
        nexus: { x: 1036.5, y: 1036.5 },
        paths: [
            {
                ...TEST_SCABARAS.tombs!.paths[0],
                room: {
                    ...TEST_SCABARAS.tombs!.paths[0].room!,
                    boss: {
                        enemyId: "kephri",
                        arrive: { x: 1036.5, y: 1024.5 },
                        at: { x: 1036.5, y: 1046.5 },
                        line: { y: 1026 },
                        swarms: [
                            { x: 1028.5, y: 1044.5 },
                            { x: 1044.5, y: 1044.5 },
                            { x: 1044.5, y: 1034.5 },
                            { x: 1028.5, y: 1034.5 },
                        ],
                    },
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_KEPHRI.id, TEST_KEPHRI);

describe("Kephri", () => {
    const DEF = getEnemy("kephri").boss!.kephri!;
    // Well south of her, out of everything's way
    const SOUTH = { x: 1036.5, y: 1030.5 };
    function atKephri(invocations: string[] = [], seed = 3, rows = field()): Sim {
        const sim = new Sim({
            grid: makeGrid(rows, 1000, 1000),
            mapId: TEST_KEPHRI.id,
            characterId: "warrior",
            metaStats: emptyStats(),
            seed,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations,
        });
        sim.weapons = [];
        sim.player.x = sim.player.prevX = 1042.5;
        sim.step();
        expect(sim.devSkipToTombsBoss()).toBe(true);
        sim.weapons = [];
        seconds(sim, 0.2, SOUTH);
        expect(sim.tombsKephri).toBeDefined();
        return sim;
    }
    const kephri = (sim: Sim) => sim.enemies.find((e) => e.uid === sim.tombsKephri!.uid)!;
    const swarms = (sim: Sim) =>
        sim.enemies.filter((e) => !e.dead && e.def.id === DEF.swarm.enemyId);

    it("drops her guard while she lays, and the raid's button stops the eggs", () => {
        for (const press of [false, true]) {
            const sim = atKephri();
            const boss = kephri(sim);
            const lay = boss.def.boss!.attacks.find((a) => a.name === "Mass Incubation")!;
            expect(lay.channel).toBeDefined();
            sim["startBossAttack"](boss, lay);
            seconds(sim, 0.1, SOUTH);
            expect(sim.isExposed(boss)).toBe(true);
            const at = { x: boss.x, y: boss.y - (boss.radius + 1) };
            seconds(sim, 0.1, at);
            if (press) {
                expect(sim.useAbility()).toBe(true);
                expect(
                    sim
                        .takeEvents()
                        .some((e) => e.type === "notice" && e.message === lay.channel!.broken),
                ).toBe(true);
                expect(boss.bossState!.windup).toBeUndefined();
                // Still down for the stagger
                expect(sim.isExposed(boss)).toBe(true);
            }
            seconds(sim, lay.windup + 1, at);
            const eggs = sim.enemies.filter((e) => !e.dead && e.def.id.startsWith("kephri_egg"));
            expect(eggs.length > 0).toBe(!press);
        }
    });
    // Down to her first shield's break
    function intermission(invocations: string[] = []): Sim {
        const sim = atKephri(invocations);
        const boss = kephri(sim);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        sim.damageEnemy(boss, sim.tombsKephri!.shield * 2, 0, boss.x, boss.y);
        expect(boss.hp).toBe(boss.maxHp);
        seconds(sim, 0.1, SOUTH);
        expect(sim.tombsKephri!.intermission).toBeDefined();
        return sim;
    }

    it("rises when the party walks in, and sits where she is", () => {
        const sim = atKephri();
        const boss = kephri(sim);
        const { x, y } = boss;
        seconds(sim, 3, SOUTH);
        expect(boss.x).toBe(x);
        expect(boss.y).toBe(y);
    });

    it("takes hits on her shield, her hitpoints untouched, and shows which of three it is", () => {
        const sim = atKephri();
        const boss = kephri(sim);
        const fight = sim.tombsKephri!;
        expect(fight.shield).toBe(fight.shieldMax);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        sim.damageEnemy(boss, 100, 0, boss.x, boss.y);
        expect(boss.hp).toBe(boss.maxHp);
        expect(fight.shield).toBeLessThan(fight.shieldMax);
        const bar = sim.kephriBar(boss)!;
        expect(bar.stage).toBe("shield");
        expect(bar.phase).toBe(1);
        expect(bar.status).toBe(`Shield 1 of ${DEF.shields.count}`);
    });

    it("breaks her shield: dazed, she can't be hurt, and her overlord comes", () => {
        const sim = intermission();
        const boss = kephri(sim);
        expect(boss.hp).toBe(boss.maxHp);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        expect(sim.damageEnemy(boss, 500, 0, boss.x, boss.y)).toBe(0);
        expect(sim.enemies.some((e) => !e.dead && e.def.id === "kephri_spitting")).toBe(true);
    });

    it("sends her swarms round the edge, quicker as they come, charging her shield if they reach her", () => {
        const sim = intermission();
        const seen = new Set<string>();
        for (let i = 0; i < 20 * TICKS_PER_SECOND; i++) {
            for (const swarm of swarms(sim)) {
                seen.add(swarm.uid + "");
            }
            seconds(sim, 1 / TICKS_PER_SECOND, SOUTH);
        }
        expect(seen.size).toBeGreaterThan(10);
        expect(sim.tombsKephri!.leaked).toBeGreaterThan(0);
    });

    it("comes out of it once the swarms and overlords are dead", () => {
        const sim = intermission();
        const boss = kephri(sim);
        for (let i = 0; i < 90 && sim.tombsKephri!.intermission; i++) {
            for (const enemy of sim.enemies) {
                if (!enemy.dead && enemy !== boss) {
                    sim.damageEnemy(enemy, 1e9, 0, enemy.x, enemy.y);
                }
            }
            seconds(sim, 0.5, SOUTH);
        }
        expect(sim.tombsKephri!.intermission).toBeUndefined();
        expect(sim.tombsKephri!.phase).toBe(1);
        // Behind her second shield, whole again
        expect(sim.tombsKephri!.shield).toBeGreaterThanOrEqual(sim.tombsKephri!.shieldMax);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        expect(sim.damageEnemy(boss, 50, 0, boss.x, boss.y)).toBeGreaterThan(0);
        // And into her second phase (by her shields), opening on her stampede
        const phase = boss.bossState!.phase!;
        expect(phase.index).toBe(1);
        expect(phase.opener?.name ?? boss.bossState!.windup?.attack.name).toBe("Scarab stampede");
    });

    it("stays in her first phase till her shield breaks, whatever her hitpoints", () => {
        const sim = atKephri();
        const boss = kephri(sim);
        boss.hp = Math.round(boss.maxHp * 0.3);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        sim.damageEnemy(boss, 10, 0, boss.x, boss.y);
        seconds(sim, 0.5, SOUTH);
        expect(boss.bossState!.phase!.index).toBe(0);
    });

    it("calls her swarm home with her guard down, a blast for each that gets to her", () => {
        for (const press of [false, true]) {
            const sim = atKephri();
            const boss = kephri(sim);
            const home = boss.def.boss!.attacks.find((a) => a.name === "Swarm, come home")!;
            sim["startBossAttack"](boss, home);
            const at = { x: boss.x, y: boss.y - (boss.radius + 1) };
            seconds(sim, home.windup + 0.2, at);
            expect(sim.isExposed(boss)).toBe(true);
            const walkers = sim.enemies.filter((e) => !e.dead && e.def.id === "kephri_swarm_home");
            expect(walkers).toHaveLength(home.summon!.count);
            if (press) {
                expect(sim.useAbility()).toBe(true);
                expect(sim.enemies.some((e) => !e.dead && e.def.id === "kephri_swarm_home")).toBe(
                    false,
                );
            }
            const taken = sim.damageTaken;
            for (let i = 0; i < 15 * TICKS_PER_SECOND && boss.bossState!.walkers; i++) {
                sim.player.x = sim.player.prevX = at.x;
                sim.player.y = sim.player.prevY = at.y;
                sim.player.invulnerable = 0;
                sim.player.hp = sim.player.maxHp;
                sim.step();
            }
            expect(boss.bossState!.walkers).toBeUndefined();
            expect(sim.damageTaken > taken).toBe(!press);
        }
    });

    it("brings another overlord with More Overlords", () => {
        const sim = intermission(["more_overlords"]);
        expect(sim.enemies.some((e) => !e.dead && e.def.id === "kephri_soldier")).toBe(true);
    });

    it("throws you back from her with Dung Strike, stunned, with dung along the way", () => {
        const sim = atKephri();
        const fight = sim.tombsKephri!;
        fight.nextDungTick = sim.tick;
        seconds(sim, 0.1, { x: 1036.5, y: 1038.5 });
        expect(fight.dung?.heroes).toEqual([0]);
        expect(sim.kephriDungHeroes).toEqual([0]);
        sim.player.x = sim.player.prevX = 1036.5;
        sim.player.y = sim.player.prevY = 1038.5;
        for (let i = 0; i < 3 * TICKS_PER_SECOND && fight.dung; i++) {
            sim.player.hp = sim.player.maxHp;
            sim.player.invulnerable = 0;
            sim.step();
        }
        expect(fight.dung).toBeUndefined();
        expect(sim.player.y).toBeLessThan(1038.5 - (DEF.dung.knock - 1));
        expect(sim.player.frozen).toBeGreaterThan(0);
        expect(sim.tombsCover.some((pile) => pile.look === "loc:" + DEF.dung.pileLoc)).toBe(true);
    });

    it("stops Dung Strike's throw at a wall on a tile's edge, as her arena's sides are", () => {
        // A wall along the north edge of the tiles at y 1036: between the player and where the
        // throw would land, with no solid tile in the way
        const rows = field();
        const row = rows.length - 1 - 36;
        rows[row] = rows[row].slice(0, 1) + "_".repeat(70) + rows[row].slice(71);
        const sim = atKephri([], 3, rows);
        const fight = sim.tombsKephri!;
        fight.nextDungTick = sim.tick;
        seconds(sim, 0.1, { x: 1036.5, y: 1038.5 });
        expect(fight.dung?.heroes).toEqual([0]);
        sim.player.x = sim.player.prevX = 1036.5;
        sim.player.y = sim.player.prevY = 1038.5;
        for (let i = 0; i < 3 * TICKS_PER_SECOND && fight.dung; i++) {
            sim.player.hp = sim.player.maxHp;
            sim.player.invulnerable = 0;
            sim.step();
        }
        expect(fight.dung).toBeUndefined();
        // Thrown back towards it, but not through it
        expect(sim.player.y).toBeLessThan(1038.5);
        expect(sim.player.y).toBeGreaterThan(1037);
    });

    it("has a light egg go off if it isn't broken, and a dark one hatch", () => {
        const sim = atKephri();
        const boss = kephri(sim);
        const light = sim.spawnEnemy(getEnemy("kephri_egg_explode"), "normal", SOUTH)!;
        const dark = sim.spawnEnemy(getEnemy("kephri_egg_hatch"), "normal", {
            x: 1030.5,
            y: 1030.5,
        })!;
        sim.player.hp = sim.player.maxHp;
        for (let i = 0; i < 7 * TICKS_PER_SECOND; i++) {
            sim.player.x = sim.player.prevX = SOUTH.x;
            sim.player.y = sim.player.prevY = SOUTH.y;
            sim.player.invulnerable = 0;
            boss.bossState!.channelEnd = sim.tick + 2;
            sim.step();
            if (light.dead) {
                break;
            }
        }
        expect(light.dead).toBe(true);
        expect(sim.player.hp).toBeLessThan(sim.player.maxHp);
        seconds(sim, 2, SOUTH);
        expect(dark.dead).toBe(true);
        expect(sim.enemies.some((e) => !e.dead && e.def.id === "agile_scarab")).toBe(true);
    });

    it("throws more eggs with Lively Larvae", () => {
        const count = (invocations: string[]) => {
            const sim = atKephri(invocations);
            const attack = kephri(sim).def.boss!.attacks.find((a) => a.name === "Mass Incubation")!;
            return sim["invokedAttack"](attack).summon!.count;
        };
        expect(count([])).toBe(2);
        expect(count(["lively_larvae"])).toBe(4);
    });

    it("has her Arcane Scarab go off once charged, or fly off if it's hit hard", () => {
        const sim = atKephri();
        const boss = kephri(sim);
        const arcane = sim.spawnEnemy(getEnemy("kephri_arcane"), "normal", {
            x: boss.x + 4,
            y: boss.y - 5,
        })!;
        seconds(sim, 0.1, SOUTH);
        const charge = sim.tombsKephri!.arcane.get(arcane.uid)!;
        expect(charge).toBeDefined();
        const { x, y } = arcane;
        sim["damageSource"] = "weapon:scythe_of_vitur";
        sim.damageEnemy(arcane, arcane.maxHp * 0.3, 0, arcane.x, arcane.y);
        seconds(sim, 0.1, SOUTH);
        expect(arcane.x !== x || arcane.y !== y).toBe(true);
        expect(charge.spot).toBe(1);
        // Left alone, it goes off
        const bullets = sim.bullets.count;
        seconds(sim, DEF.arcane.charge + 0.2, SOUTH);
        expect(sim.bullets.count).toBeGreaterThan(bullets);
    });

    it("comes back for her last without her swarm, throwing everyone back", () => {
        const sim = atKephri();
        const boss = kephri(sim);
        // Behind her third shield: breaking it is her last
        sim.tombsKephri!.phase = DEF.shields.count - 1;
        sim["damageSource"] = "weapon:scythe_of_vitur";
        sim.damageEnemy(boss, sim.tombsKephri!.shield * 2, 0, boss.x, boss.y);
        seconds(sim, 0.2, SOUTH);
        const risen = kephri(sim);
        expect(risen.def.id).toBe("kephri_final");
        expect(sim.tombsKephri!.final).toBe(true);
        expect(sim.tombsKephri!.dung?.heroes).toEqual([0]);
    });
});

// The Crondis room in the open field: the palm in the middle, a corridor running north to a
// waterfall
const CRONDIS_DEF = {
    palm: { x: 1036.5, y: 1036.5 },
    // The fill spot as far past the corridor's end as the real room's (1.5 tiles)
    falls: [{ fill: { x: 1036.5, y: 1055.5 }, at: { x: 1036.5, y: 1059.5 }, rotation: 0 }],
    lanes: [
        { x0: 1034, x1: 1039, y0: 1044, y1: 1053, low: 1033, high: 1040, fall: 0, fromLow: false },
    ],
};
const TEST_CRONDIS: MapDef = {
    ...TEST_TOMBS,
    id: "test_crondis",
    tombs: {
        nexus: { x: 1036.5, y: 1036.5 },
        paths: [
            {
                id: "crondis",
                name: "Path of Crondis",
                door: { x: 1042.5, y: 1036.5 },
                room: {
                    arrive: { x: 1046.5, y: 1030.5 },
                    puzzle: "crondis",
                    entrances: [{ x: 1028.5, y: 1028.5 }],
                    crondis: CRONDIS_DEF,
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_CRONDIS.id, TEST_CRONDIS);

describe("the Crondis room", () => {
    // Off the corridor, away from the palm and the waterfall
    const AWAY = { x: 1050.5, y: 1030.5 };
    function crondis(invocations: string[] = [], seed = 3): Sim {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: TEST_CRONDIS.id,
            characterId: "warrior",
            metaStats: emptyStats(),
            seed,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations,
        });
        sim.weapons = [];
        sim.player.x = sim.player.prevX = 1042.5;
        sim.step();
        expect(sim.tombsPath).toBe("crondis");
        at(sim, AWAY);
        expect(sim.tombsRoom!.crondis).toBeDefined();
        return sim;
    }
    const room = (sim: Sim) => sim.tombsRoom!.crondis!;
    // A tick somewhere, with no traps coming and nothing about
    function at(sim: Sim, where: { x: number; y: number }, quiet = true): void {
        const crondis = sim.tombsRoom?.crondis;
        if (crondis && quiet) {
            crondis.spears.forEach((s) => (s.nextTick = sim.tick + 1000));
            crondis.nextCloudTick.fill(sim.tick + 1000);
            sim.tombsRoom!.pending = [];
            for (const enemy of sim.enemies) {
                if (!enemy.dead && enemy.def.id.startsWith("crondis_crocodile")) {
                    sim["vanish"](enemy);
                }
            }
        }
        sim.player.invulnerable = 0;
        sim.player.hp = sim.player.maxHp;
        sim.player.x = sim.player.prevX = where.x;
        sim.player.y = sim.player.prevY = where.y;
        if (sim.state === "chest") {
            sim.resolveChest("take");
        }
        if (sim.state === "levelUp") {
            sim.choose(0);
        }
        sim.step();
    }
    function fill(sim: Sim): void {
        for (let i = 0; i < 2 * TICKS_PER_SECOND && room(sim).water[0] === 0; i++) {
            at(sim, CRONDIS_DEF.falls[0].fill);
        }
    }
    const palm = (sim: Sim) => sim.enemies.find((e) => e.uid === room(sim).palmUid)!;

    it("starts with the palm a sapling that can't be hurt, and the first wave", () => {
        const sim = crondis();
        const tree = palm(sim);
        expect(tree.def.id).toBe("crondis_palm_0");
        expect(tree.maxHp).toBe(room(sim).goal);
        sim["damageSource"] = "weapon:scythe_of_vitur";
        expect(sim.damageEnemy(tree, 100, 0, tree.x, tree.y)).toBe(0);
        expect(sim.tombsRoom!.wave).toBe(0);
    });

    it("needs more water with the party and the path level", () => {
        expect(room(crondis(["pathmaster"])).goal).toBeGreaterThan(room(crondis()).goal);
    });

    it("fills up at a waterfall, which runs dry a while after", () => {
        const sim = crondis();
        fill(sim);
        expect(room(sim).water[0]).toBe(100);
        expect(room(sim).dryUntil[0]).toBeGreaterThan(sim.tick);
        // Poured out, and stood there again: nothing while it's dry
        room(sim).water[0] = 0;
        at(sim, CRONDIS_DEF.falls[0].fill);
        at(sim, CRONDIS_DEF.falls[0].fill);
        expect(room(sim).water[0]).toBe(0);
    });

    it("grows the palm a stage a quarter, for a casket and the next wave, and ends the room", () => {
        const sim = crondis();
        const caskets = () => sim.pickups.filter((p) => p.kind === "casket").length;
        const before = caskets();
        for (let trip = 0; trip < 10 && sim.tombsRoom!.doneTick === undefined; trip++) {
            room(sim).dryUntil.fill(-1);
            fill(sim);
            at(sim, { x: CRONDIS_DEF.palm.x + 3, y: CRONDIS_DEF.palm.y });
            if (trip === 0) {
                expect(room(sim).growth).toBe(100);
                expect(room(sim).stage).toBe(1);
                expect(palm(sim).def.id).toBe("crondis_palm_1");
                expect(sim.tombsRoom!.wave).toBe(1);
            }
        }
        expect(room(sim).stage).toBe(4);
        expect(sim.tombsRoom!.doneTick).toBeDefined();
        expect(caskets() + (sim.state === "chest" ? 1 : 0)).toBeGreaterThan(before);
    });

    it("thrusts its spears across a pair of rows, spilling your water", () => {
        const sim = crondis();
        fill(sim);
        const thrust = { lane: 0, pair: 2, side: "low" as const, startTick: sim.tick, hit: [] };
        const area = sim.crondisSpearArea(CRONDIS_DEF, thrust);
        expect(area).toEqual({ x0: 1034, x1: 1037, y0: 1048, y1: 1050 });
        room(sim).thrusts.push(thrust);
        const spot = { x: 1035.5, y: 1048.5 };
        for (let i = 0; i < CRONDIS.spearTell * TICKS_PER_SECOND - 1; i++) {
            at(sim, spot);
        }
        // Still its tell: nothing yet
        expect(room(sim).water[0]).toBe(100);
        for (let i = 0; i < 3; i++) {
            at(sim, spot);
        }
        expect(room(sim).water[0]).toBe(50);
        expect(sim.debuffs.some((d) => d.id === "crondis_trap")).toBe(true);
    });

    it("sends its spears down the corridor a pair at a time, each side in turn", () => {
        const sim = crondis();
        room(sim).spears[0].nextTick = sim.tick;
        sim.player.x = sim.player.prevX = AWAY.x;
        const seen = new Map<string, { pair: number; side: string }>();
        for (let i = 0; i < 2.5 * TICKS_PER_SECOND; i++) {
            sim.player.invulnerable = 0;
            sim.player.hp = sim.player.maxHp;
            sim.step();
            for (const t of room(sim).thrusts) {
                seen.set(t.lane + ":" + t.startTick, { pair: t.pair, side: t.side });
            }
        }
        const thrusts = [...seen.values()];
        // All five pairs of rows, down the corridor, each side in turn
        expect(thrusts.map((t) => t.pair)).toEqual([0, 1, 2, 3, 4]);
        expect(thrusts.map((t) => t.side)).toEqual(["low", "high", "low", "high", "low"]);
    });

    it("rolls its poison down from the waterfall's end, the pale cloud ahead of the dark", () => {
        const sim = crondis();
        fill(sim);
        const cloud = { lane: 0, startTick: sim.tick, hit: [] as number[] };
        room(sim).clouds.push(cloud);
        // At the waterfall's end of the corridor (y1, as fromLow is false)
        const spot = { x: 1036.5, y: 1052.5 };
        let paleSeen = false;
        for (let i = 0; i < 3 * TICKS_PER_SECOND && room(sim).water[0] === 100; i++) {
            const { pale, dark } = sim.crondisCloud(CRONDIS_DEF, cloud);
            if (pale > 1 && dark === 0) {
                paleSeen = true;
            }
            at(sim, spot);
            room(sim).clouds = room(sim).clouds.length ? room(sim).clouds : [cloud];
        }
        expect(paleSeen).toBe(true);
        expect(room(sim).water[0]).toBe(50);
        expect(cloud.hit).toEqual([0]);
    });

    it("leaves anyone under a waterfall alone, as OSRS's poison does, running or dry", () => {
        const sim = crondis();
        const fall = CRONDIS_DEF.falls[0];
        room(sim).dryUntil[0] = sim.tick + 1e4;
        const cloud = { lane: 0, startTick: sim.tick, hit: [] as number[] };
        room(sim).clouds.push(cloud);
        const hp = sim.player.maxHp;
        for (let i = 0; i < 4 * TICKS_PER_SECOND; i++) {
            sim.player.hp = hp;
            at(sim, fall.fill);
            room(sim).clouds = room(sim).clouds.length ? room(sim).clouds : [cloud];
        }
        expect(cloud.hit).toEqual([]);
    });

    it("has a crocodile's bite spill your water", () => {
        const sim = crondis();
        fill(sim);
        sim["damagePlayer"](3, "crondis_crocodile", false);
        expect(room(sim).water[0]).toBe(50);
    });

    it("has its hungry crocodiles eat the palm's growth, but not below the stage it's reached", () => {
        const sim = crondis();
        const crondis_ = room(sim);
        crondis_.growth = crondis_.goal * 0.4;
        crondis_.stage = 1;
        const tree = palm(sim);
        const croc = sim.spawnEnemy(getEnemy("crondis_crocodile_hungry"), "normal", {
            x: tree.x + tree.radius + 1,
            y: tree.y,
        })!;
        for (let i = 0; i < 6 * TICKS_PER_SECOND; i++) {
            croc.x = croc.prevX = tree.x + tree.radius + 1;
            croc.y = croc.prevY = tree.y;
            sim.player.invulnerable = 1e6;
            sim.player.x = sim.player.prevX = AWAY.x;
            sim.player.y = sim.player.prevY = AWAY.y;
            sim.step();
        }
        expect(crondis_.growth).toBeLessThan(crondis_.goal * 0.4);
        expect(crondis_.growth).toBeGreaterThanOrEqual(crondis_.goal / 4);
    });
});

// Zebak after the Crondis room, in the open field: he lies north of an island 21 tiles across
const ZEBAK_ISLAND = { x0: 1026, y0: 1030, x1: 1046, y1: 1050 };
const TEST_ZEBAK: MapDef = {
    ...TEST_CRONDIS,
    id: "test_zebak",
    tombs: {
        nexus: { x: 1036.5, y: 1036.5 },
        paths: [
            {
                ...TEST_CRONDIS.tombs!.paths[0],
                room: {
                    ...TEST_CRONDIS.tombs!.paths[0].room!,
                    boss: {
                        enemyId: "zebak",
                        arrive: { x: 1036.5, y: 1024.5 },
                        at: { x: 1036.5, y: 1060.5 },
                        line: { y: 1026 },
                        island: ZEBAK_ISLAND,
                        steps: [
                            { x: 1025.5, y: 1040.5 },
                            { x: 1047.5, y: 1040.5 },
                        ],
                    },
                },
            },
        ],
    },
};
MAP_BY_ID.set(TEST_ZEBAK.id, TEST_ZEBAK);

describe("Zebak", () => {
    const DEF = getEnemy("zebak").boss!.zebak!;
    // The island's middle-south, out of the way
    const SOUTH = { x: 1036.5, y: 1032.5 };
    function atZebak(invocations: string[] = [], seed = 3): Sim {
        const sim = new Sim({
            grid: makeGrid(field(), 1000, 1000),
            mapId: TEST_ZEBAK.id,
            characterId: "warrior",
            metaStats: emptyStats(),
            seed,
            spawnX: 1036.5,
            spawnY: 1036.5,
            invocations,
        });
        sim.weapons = [];
        sim.player.x = sim.player.prevX = 1042.5;
        sim.step();
        expect(sim.devSkipToTombsBoss()).toBe(true);
        sim.weapons = [];
        seconds(sim, 0.2, SOUTH);
        expect(sim.tombsZebak).toBeDefined();
        return sim;
    }
    const zebak = (sim: Sim) => sim.enemies.find((e) => e.uid === sim.tombsZebak!.uid)!;
    // A tick somewhere, hurt as it comes, his own attacks held off
    function at(sim: Sim, where: { x: number; y: number }): void {
        const boss = zebak(sim);
        boss.bossState!.channelEnd = Math.max(boss.bossState!.channelEnd, sim.tick + 2);
        sim.player.invulnerable = 0;
        sim.player.x = sim.player.prevX = where.x;
        sim.player.y = sim.player.prevY = where.y;
        sim.step();
    }
    // Down to a special's share of his hitpoints
    function special(sim: Sim, which: number): void {
        const boss = zebak(sim);
        sim.tombsZebak!.special = which;
        boss.hp = Math.floor(boss.maxHp * DEF.specials[which]) - 1;
        at(sim, SOUTH);
    }

    it("shoves the player only as far as the whole of them fits", () => {
        const sim = atZebak();
        // Beside the field's west wall (its first column), shoved into it
        sim.player.x = sim.player.prevX = 1003.5;
        sim.player.y = sim.player.prevY = 1036.5;
        sim["zebakShove"](sim.player, -1, 0, 4);
        // Where the game's own collision lets them stand, short of the middle-only stop (1001)
        expect(isCircleFree(sim.grid, sim.player.x, sim.player.y, sim.player.radius)).toBe(true);
        expect(sim.player.x).toBeGreaterThan(1001);
        expect(sim.player.x).toBeLessThan(1003.5);
    });

    it("counts a hit past his phase's threshold only down to it, for life steal and points", () => {
        const sim = atZebak();
        const boss = zebak(sim);
        const until = boss.def.boss!.phases!.phases[0].until!;
        const at = Math.max(1, Math.round(boss.maxHp * until));
        boss.hp = at + 10;
        const points = sim.heroes[0].tombsPoints;
        const dealt = sim["damageEnemy"](boss, boss.maxHp, 0, boss.x, boss.y, 0);
        expect(boss.hp).toBe(at);
        expect(dealt).toBe(10);
        // Ten hitpoints' worth, not the whole hit's
        const perHp = (sim.heroes[0].tombsPoints - points) / 10;
        boss.hp = at + 10;
        boss.bossState!.phase!.index = 0;
        const before = sim.heroes[0].tombsPoints;
        sim["damageEnemy"](boss, 5, 0, boss.x, boss.y, 0);
        const five = sim.heroes[0].tombsPoints - before;
        expect(perHp).toBeCloseTo(five / (at + 10 - boss.hp), 5);
    });

    it("rises when the party walks in, and lies where he is", () => {
        const sim = atZebak();
        const boss = zebak(sim);
        const { x, y } = boss;
        seconds(sim, 2, SOUTH);
        expect([boss.x, boss.y]).toEqual([x, y]);
    });

    it("spits acid, jugs and boulders, then roars", () => {
        const sim = atZebak();
        special(sim, 0);
        const fight = sim.tombsZebak!;
        expect(fight.acid).toHaveLength(DEF.acid.count);
        expect(fight.jugs).toHaveLength(DEF.jugs.count);
        expect(sim.tombsCover.filter((r) => r.look === DEF.roar.look)).toHaveLength(
            DEF.roar.boulders,
        );
        expect(sim.zebakRoarSeconds).toBeGreaterThan(DEF.roar.seconds - 0.5);
    });

    it("hurts and throws back whoever isn't behind a boulder when he roars, and not who is", () => {
        const roarOn = (sheltered: boolean) => {
            const sim = atZebak();
            special(sim, 0);
            const fight = sim.tombsZebak!;
            fight.acid = [];
            const boulder = sim.tombsCover.find((r) => r.look === DEF.roar.look)!;
            // Behind it from him (he's north), or out in the open
            const spot = sheltered
                ? { x: boulder.x, y: boulder.y - 1.5 }
                : { x: boulder.x + 2.5, y: boulder.y - 1.5 };
            fight.roar!.tick = sim.tick + 2;
            sim.player.hp = sim.player.maxHp;
            for (let i = 0; i < 5 && fight.roar; i++) {
                at(sim, spot);
            }
            return { hurt: sim.player.maxHp - sim.player.hp, moved: spot.y - sim.player.y };
        };
        const open = roarOn(false);
        expect(open.hurt).toBeGreaterThan(0);
        expect(open.moved).toBeGreaterThan(0.5);
        expect(roarOn(true).hurt).toBe(0);
    });

    it("shelters from his roar straight behind a boulder, down the island, not on a slant", () => {
        // He's at (0, 10), a boulder off to his side at (5, 0)
        const rock = [{ x: 5, y: 0, radius: 0.8 }];
        const shelters = (x: number, y: number) =>
            zebakShelters(0, 10, x, y, rock, DEF.roar.shelter);
        expect(shelters(5, -3)).toBe(true);
        expect(shelters(5, 1)).toBe(false);
        expect(shelters(5, -5)).toBe(false);
        // On the line from him through it, as far back: off to the side of what it shelters
        const len = Math.hypot(5, -10);
        expect(shelters(5 + (5 / len) * 3.2, -(10 / len) * 3.2)).toBe(false);
        // As wide as it is, and a bit
        expect(shelters(6.2, -2)).toBe(true);
        expect(shelters(6.5, -2)).toBe(false);
    });

    it("leaves a party his roar kills where the room starts over, not thrown from there", () => {
        const sim = atZebak();
        special(sim, 0);
        const fight = sim.tombsZebak!;
        fight.acid = [];
        const boulder = sim.tombsCover.find((r) => r.look === DEF.roar.look)!;
        fight.roar!.tick = sim.tick + 2;
        sim.player.hp = 1;
        for (let i = 0; i < 5 && sim.tombsDeaths === 0; i++) {
            at(sim, { x: boulder.x + 2.5, y: boulder.y - 1.5 });
        }
        expect(sim.tombsDeaths).toBe(1);
        const arrive = sim.tombsPathRoom!.boss!.arrive;
        expect(sim.player.x).toBeCloseTo(arrive.x);
        expect(sim.player.y).toBeCloseTo(arrive.y);
    });

    it("sends tidal waves across, a gap in each, that wash his acid away", () => {
        const sim = atZebak();
        special(sim, 1);
        const fight = sim.tombsZebak!;
        expect(fight.waves).toHaveLength(DEF.waves.count);
        const wave = fight.waves[0];
        expect(wave.dir).toBe(1);
        expect(wave.gapX1 - wave.gapX0).toBe(DEF.waves.gap);
        // Acid in its way, and you out of its gap
        fight.acid = [{ x: 1036.5, y: 1036.5, half: 1 }];
        const outside =
            wave.gapX0 > ZEBAK_ISLAND.x0 + 3 ? ZEBAK_ISLAND.x0 + 1.5 : ZEBAK_ISLAND.x1 - 0.5;
        wave.startTick = sim.tick;
        sim.player.hp = sim.player.maxHp;
        for (let i = 0; i < 4 * TICKS_PER_SECOND && wave.hit.length === 0; i++) {
            at(sim, { x: outside, y: 1038.5 });
        }
        expect(wave.hit).toEqual([0]);
        expect(sim.player.hp).toBeLessThan(sim.player.maxHp);
        expect(fight.acid).toHaveLength(0);
    });

    it("lets you stand in a wave's gap", () => {
        const sim = atZebak();
        special(sim, 1);
        const wave = sim.tombsZebak!.waves[0];
        wave.startTick = sim.tick;
        const gap = { x: (wave.gapX0 + wave.gapX1) / 2, y: 1038.5 };
        for (let i = 0; i < 6 * TICKS_PER_SECOND && wave.y < 1045; i++) {
            at(sim, gap);
        }
        expect(wave.hit).toEqual([]);
    });

    it("hurts more the longer you stand in his acid, and poisons you", () => {
        const sim = atZebak();
        sim.tombsZebak!.acid = [{ x: 1036.5, y: 1036.5, half: 1 }];
        const hits: number[] = [];
        for (let i = 0; i < 3 * TICKS_PER_SECOND; i++) {
            const hp = sim.player.hp;
            sim.player.hp = sim.player.maxHp;
            at(sim, { x: 1037.2, y: 1036.5 });
            if (sim.player.hp < sim.player.maxHp && hp === sim.player.maxHp) {
                hits.push(sim.player.maxHp - sim.player.hp);
            }
        }
        expect(hits.length).toBeGreaterThan(1);
        expect(hits[hits.length - 1]).toBeGreaterThan(hits[0]);
        expect(sim.player.poisonEnd).toBeGreaterThan(sim.tick);
    });

    it("never has a weapon aim at a jug, however near, over him", () => {
        const sim = atZebak();
        const jug = sim.spawnEnemy(getEnemy("zebak_jug"), "normal", {
            x: sim.player.x + 1,
            y: sim.player.y,
        })!;
        const aimed = sim["nearestEnemies"](sim.player.x, sim.player.y, 60, 5);
        expect(aimed).not.toContain(jug);
        expect(aimed).toContain(zebak(sim));
    });

    it("rolls a jug off when you walk into it, and its water clears acid where it breaks", () => {
        const sim = atZebak();
        const fight = sim.tombsZebak!;
        const jug = sim.spawnEnemy(getEnemy("zebak_jug"), "normal", { x: 1036.5, y: 1036.5 })!;
        fight.jugs.push({ uid: jug.uid, vx: 0, vy: 0, left: 0 });
        // Acid where it'll roll to, eastward
        fight.acid = [{ x: 1043.5, y: 1036.5, half: 1 }];
        at(sim, { x: 1035.6, y: 1036.5 });
        expect(fight.jugs[0].vx).toBeGreaterThan(0);
        for (let i = 0; i < 3 * TICKS_PER_SECOND && fight.jugs.length > 0; i++) {
            at(sim, SOUTH);
        }
        expect(fight.jugs).toHaveLength(0);
        expect(fight.acid).toHaveLength(0);
    });

    it("lets weapons pass a jug by, so it's still there to be pushed", () => {
        const sim = atZebak();
        const fight = sim.tombsZebak!;
        const jug = sim.spawnEnemy(getEnemy("zebak_jug"), "normal", { x: 1036.5, y: 1040.5 })!;
        fight.jugs.push({ uid: jug.uid, vx: 0, vy: 0, left: 0 });
        sim["damageSource"] = "weapon:scythe_of_vitur";
        expect(sim.damageEnemy(jug, 100, 0, jug.x, jug.y)).toBe(0);
        at(sim, SOUTH);
        expect(jug.dead).toBe(false);
        expect(fight.jugs).toHaveLength(1);
    });

    it("spreads his acid wider with Upset Stomach", () => {
        const sim = atZebak(["upset_stomach"]);
        special(sim, 0);
        expect(sim.tombsZebak!.acid.every((pool) => pool.half === DEF.acid.upsetHalf)).toBe(true);
    });

    it("sends blood clouds up the steps with Not Just a Head, wasting as they come, healing him", () => {
        const sim = atZebak(["not_just_a_head", "blood_thinners"]);
        const fight = sim.tombsZebak!;
        fight.nextCloudTick = sim.tick;
        at(sim, SOUTH);
        expect(fight.clouds).toHaveLength(3);
        const cloud = sim.enemies.find((e) => e.uid === fight.clouds[0].uid)!;
        const hp = cloud.hp;
        for (let i = 0; i < TICKS_PER_SECOND; i++) {
            at(sim, SOUTH);
        }
        expect(cloud.dead || cloud.hp < hp).toBe(true);
        const boss = zebak(sim);
        boss.hp = boss.maxHp / 2;
        sim["damagePlayer"](4, "zebak_blood_cloud", false);
        expect(boss.hp).toBeGreaterThan(boss.maxHp / 2);
    });

    // Hit down to that share of his hitpoints, his phases passed as a hit passes them
    function hurt(sim: Sim, share: number): void {
        const boss = zebak(sim);
        boss.hp = Math.floor(boss.maxHp * share) + 20;
        sim["damageSource"] = "weapon:scythe_of_vitur";
        sim.damageEnemy(boss, 40, 0, boss.x, boss.y);
    }

    it("does no specials under a quarter, in his last phase", () => {
        const sim = atZebak();
        const boss = zebak(sim);
        hurt(sim, 0.7);
        hurt(sim, 0.4);
        expect(boss.bossState!.phase!.index).toBe(2);
        sim.tombsZebak!.special = DEF.specials.length - 1;
        sim.tombsZebak!.acid = [];
        boss.hp = Math.floor(boss.maxHp * 0.2);
        at(sim, SOUTH);
        expect(sim.tombsZebak!.acid).toHaveLength(0);
    });

    const attack = (name: string) => zebak0().def.boss!.attacks.find((a) => a.name === name)!;
    const zebak0 = () => ({ def: getEnemy("zebak") });
    // His jaws (or whatever's named) started at the player, landed with them kept at where
    function jaws(sim: Sim, where: { x: number; y: number }, name = "Jaws"): void {
        const boss = zebak(sim);
        sim.player.x = sim.player.prevX = where.x;
        sim.player.y = sim.player.prevY = where.y;
        sim["startBossAttack"](boss, attack(name));
        for (let i = 0; i < 3 * TICKS_PER_SECOND && boss.bossState!.windup; i++) {
            at(sim, where);
        }
    }

    it("brings his jaws down a strip from his middle, and a miss leaves his head open", () => {
        const line = attack("Jaws").line!;
        // In the strip, its length counted from his middle
        const hit = atZebak();
        const boss = zebak(hit);
        hit.player.hp = hit.player.maxHp;
        jaws(hit, { x: boss.x, y: boss.y - line.length + 0.5 });
        expect(hit.player.hp).toBeLessThan(hit.player.maxHp);
        expect(hit.isExposed(boss)).toBe(false);
        // Past its end: missed, and his guard's down
        const missed = atZebak();
        const far = zebak(missed);
        missed.player.hp = missed.player.maxHp;
        jaws(missed, { x: far.x, y: far.y - line.length - 1.5 });
        expect(missed.player.hp).toBe(missed.player.maxHp);
        expect(missed.isExposed(far)).toBe(true);
    });

    it("has his crocodiles snap down shorter strips of their own as his jaws come", () => {
        const sim = atZebak();
        const croc = sim.spawnEnemy(getEnemy("zebak_croc"), "normal", { x: 1040.5, y: 1036.5 })!;
        const boss = zebak(sim);
        sim["startBossAttack"](boss, attack("Jaws"));
        expect(croc.echo).toBeDefined();
        expect(croc.echo!.attack.line!.length).toBe(getEnemy("zebak_croc").echoes!.length);
        expect(croc.echo!.landTick).toBeGreaterThan(boss.bossState!.windup!.landTick);
    });

    it("goes quicker by the phase, each opening on what it brings", () => {
        const sim = atZebak();
        const boss = zebak(sim);
        expect(boss.bossState!.phase!.index).toBe(0);
        // No specials in the way
        sim.tombsZebak!.special = DEF.specials.length;
        hurt(sim, 0.7);
        expect(boss.bossState!.phase!.index).toBe(1);
        // After whatever it was already winding up
        const names: string[] = [];
        for (let i = 0; i < 5 * TICKS_PER_SECOND; i++) {
            seconds(sim, 1 / TICKS_PER_SECOND, SOUTH);
            const name = boss.bossState!.windup?.attack.name;
            if (name && names[names.length - 1] !== name) {
                names.push(name);
            }
        }
        expect(names.slice(0, 2)).toContain("Twin jaws");
        hurt(sim, 0.4);
        expect(boss.bossState!.phase!.index).toBe(2);
    });

    it("rolls his swell down the island from the first phase, a gap in it", () => {
        const sim = atZebak();
        const swell = attack("Swell");
        const walls = () => {
            const out: { vy: number }[] = [];
            for (let i = 0; i < sim.bullets.count; i++) {
                const slot = sim.bullets.order[i];
                if (sim.bulletSources[sim.bullets.source[slot]]?.attack.name === "Swell") {
                    out.push({ vy: sim.bullets.vy[slot] });
                }
            }
            return out;
        };
        for (let i = 0; i < 9 * TICKS_PER_SECOND && walls().length === 0; i++) {
            at(sim, SOUTH);
        }
        const wall = walls();
        expect(wall.length).toBe(swell.pattern!.count - swell.pattern!.gap!);
        expect(wall.every((b) => b.vy < 0)).toBe(true);
    });
});

describe("the dev server's way to each boss", () => {
    it("goes from the Nexus straight to a path's boss, and not from inside a path", () => {
        const sim = tombs([]);
        // The test map's Het has no room to go to
        expect(sim.devToTombsBoss("het")).toBe(false);
        expect(sim.devToTombsBoss("apmeken")).toBe(true);
        expect(sim.tombsPath).toBe("apmeken");
        expect(sim.tombsRoom!.boss).toBeDefined();
        expect(sim.devToTombsBoss("apmeken")).toBe(false);
    });

    it("goes to the Wardens as the run is, without the max kit", () => {
        const sim = tombs([]);
        const weapons = sim.weapons.map((w) => w.def.id);
        expect(sim.devToWardens(false)).toBe(true);
        expect(sim.tombsWardens).toBeDefined();
        expect(sim.weapons.map((w) => w.def.id)).toEqual(weapons);
        expect(sim.devToWardens(false)).toBe(false);
    });
});

describe("a wipe on the Wardens", () => {
    function wiped(invocations: string[]): Sim {
        const sim = tombs(invocations);
        sim.heroes[0].weapons = [];
        expect(sim.devToWardens()).toBe(true);
        sim.heroes[0].weapons = [];
        const first = sim.tombsWardens;
        sim.step();
        sim.player.invulnerable = 0;
        sim["damagePlayer"](sim.player.maxHp * 10, "wardens_obelisk", false, undefined, true);
        sim.step();
        expect(sim.tombsWardens).not.toBe(first);
        return sim;
    }

    it("brings their fight back from the start, everyone up, as OSRS's does", () => {
        const sim = wiped([]);
        expect(sim.runOver).toBe(false);
        expect(sim.tombsDeaths).toBe(1);
        expect(sim.tombsWardens!.phase).toBe(1);
        expect(sim.player.hp).toBe(sim.player.maxHp);
    });

    it("set down what the party carries where it can be walked to, even by a wall", () => {
        const sim = tombs([]);
        sim.pickups = [];
        for (let i = 0; i < 8; i++) {
            sim["dropPickup"]("coins", sim.player.x, sim.player.y, 1);
        }
        // Beside the field's west wall (tile 1000): the ring round it reaches into the wall
        sim["moveParty"]({ x: 1001.5, y: 1036.5 });
        for (const pickup of sim.pickups) {
            expect(sim.grid.isSolid(Math.floor(pickup.x), Math.floor(pickup.y))).toBe(false);
        }
    });

    it("spill food as a phase ends at Entry, where there's nothing else to heal with", () => {
        withEntryScale();
        const food = (invocations: string[]) => {
            const sim = tombs(invocations);
            sim.heroes[0].weapons = [];
            expect(sim.devToWardens()).toBe(true);
            sim.pickups = [];
            sim["endWardensPhaseOne"](sim.tombsWardens!);
            return sim.pickups.filter((p) => p.kind === "food").length;
        };
        expect(food([])).toBe(TOMBS_BOSS_FOOD.phase);
        expect(food(["on_a_diet"])).toBe(0);
        // Fewer as the raid level climbs: a third of them at Expert (one), none past untilLevel
        const expert = [
            "jungle_japes",
            "lively_larvae",
            "blood_thinners",
            "mind_the_gap",
            "gotta_have_faith",
            "keep_back",
            "blowing_mud",
            "arterial_spray",
            "aerial_assault",
            "need_some_help",
            "quiet_prayers",
            "shaking_things_up",
            "boulderdash",
            "stay_vigilant",
            "more_overlords",
            "not_just_a_head",
            "upset_stomach",
            "medic",
            "pathseeker",
            "double_trouble",
            "feeling_special",
            "ancient_haste",
            "acceleration",
            "penetration",
            "overclocked",
        ];
        expect(getRaidLevel(expert)).toBe(300);
        expect(food(expert)).toBe(Math.round(TOMBS_BOSS_FOOD.phase / 3));
    });

    it("ends the raid once an Attempts invocation's deaths are spent", () => {
        const sim = tombs(["hardcore_run"]);
        sim.heroes[0].weapons = [];
        expect(sim.devToWardens()).toBe(true);
        sim.step();
        sim.player.invulnerable = 0;
        sim["damagePlayer"](sim.player.maxHp * 10, "wardens_obelisk", false, undefined, true);
        expect(sim.runOver).toBe(true);
    });
});

describe("the Wardens' first phase", () => {
    // In their room (the dev skip), the obelisk kept whole unless a test breaks it
    function atWardens() {
        const sim = tombs([]);
        sim.heroes[0].weapons = [];
        expect(sim.devToWardens()).toBe(true);
        sim.heroes[0].weapons = [];
        sim.player.invulnerable = 0;
        return sim;
    }
    const step = (sim: Sim, seconds: number, each?: () => void) => {
        for (let i = 0; i < seconds * TICKS_PER_SECOND; i++) {
            each?.();
            sim.step();
        }
    };
    const stand = (sim: Sim, at: { x: number; y: number }) => {
        sim.player.x = sim.player.prevX = at.x;
        sim.player.y = sim.player.prevY = at.y;
    };

    it("brings in the obelisk to break and the two Wardens, which nothing hurts", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        expect(fight.phase).toBe(1);
        const obelisk = sim.enemies.find((e) => e.uid === fight.obeliskUid)!;
        expect(obelisk.boss).toBe(true);
        expect(sim.shownBoss).toBe(obelisk);
        for (const uid of Object.values(fight.wardens)) {
            const warden = sim.enemies.find((e) => e.uid === uid)!;
            expect(sim.damageEnemy(warden, 100, 0, sim.player.x, sim.player.y)).toBe(0);
        }
    });

    it("holds the obelisk at a quarter till a Warden's pyramids have come and gone", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        const obelisk = sim.enemies.find((e) => e.uid === fight.obeliskUid)!;
        sim["damageEnemy"](obelisk, obelisk.maxHp * 10, 0, obelisk.x, obelisk.y);
        expect(obelisk.dead).toBe(false);
        expect(obelisk.hp).toBe(Math.round(obelisk.maxHp * WARDENS.holdShare));
        // Held, a hit takes nothing, so there's nothing for life steal to go by
        expect(sim["damageEnemy"](obelisk, 60, 0, obelisk.x, obelisk.y)).toBe(0);
        expect(fight.phase).toBe(1);
        // A Warden charges, throws its pyramids, and once they've gone it can break
        for (
            let i = 0;
            i < 60 && (fight.pyramidsDone === undefined || sim.tick < fight.pyramidsDone);
            i++
        ) {
            step(sim, 1);
            sim.player.hp = sim.player.maxHp;
        }
        expect(fight.pyramidsDone).toBeDefined();
        sim["damageEnemy"](obelisk, obelisk.maxHp * 10, 0, obelisk.x, obelisk.y);
        expect(obelisk.hp).toBeLessThanOrEqual(0);
    });

    it("flickers the obelisk open as a Warden discharges: twice what it's hit for, a moment", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        const obelisk = sim.enemies.find((e) => e.uid === fight.obeliskUid)!;
        for (let i = 0; i < 60 * TICKS_PER_SECOND && fight.flickerUntil === undefined; i++) {
            sim.player.hp = sim.player.maxHp;
            sim.step();
        }
        expect(sim.obeliskFlickers(obelisk)).toBe(true);
        // The same hit, open and not, on the same tick
        sim["damageSource"] = "weapon:dark_bow";
        const open = sim.damageEnemy(obelisk, 20, 0, obelisk.x, obelisk.y, 0);
        const until = fight.flickerUntil;
        fight.flickerUntil = sim.tick;
        sim["damageSource"] = "weapon:dark_bow";
        const shut = sim.damageEnemy(obelisk, 20, 0, obelisk.x, obelisk.y, 0);
        fight.flickerUntil = until;
        // (each hit rolls its own damage)
        expect(open).toBeGreaterThan(shut * 1.5);
        step(sim, WARDENS.flicker!.seconds + 0.1, () => (sim.player.hp = sim.player.maxHp));
        expect(sim.obeliskFlickers(obelisk)).toBe(false);
    });

    it("sends orbs down the troughs that charge their Warden, unless a player soaks them", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        const places = sim.map.tombs!.wardens!;
        // A step along Tumeken's trough from its spawn tile (the spawn tile itself soaks nothing):
        // the orbs go from it towards his end, crossing to their rows as they go
        const spawn = places.sides.tumeken.spawn;
        const spot = { x: spawn.x + Math.sign(places.sides.tumeken.end - spawn.x), y: spawn.y };
        const hp = sim.player.hp;
        // From empty, short of either filling
        fight.charge.elidinis = fight.charge.tumeken = 0;
        // On the spot till it holds the most it can (a sixth would hurt), then out of the way
        const hero = sim.heroes[0];
        step(sim, 14, () =>
            stand(sim, hero.wardenEnergy >= WARDENS.orbs.soak.max ? places.arrive : spot),
        );
        // Elidinis' orbs got there, Tumeken's were soaked on the way, at no cost
        expect(fight.charge.elidinis).toBeGreaterThan(
            fight.charge.tumeken + WARDENS.charge.perOrb * 3,
        );
        expect(sim.player.hp).toBe(hp);
        // Holding their energy, up to the most, which hits the obelisk harder
        expect(hero.wardenEnergy).toBe(WARDENS.orbs.soak.max);
        const obelisk = sim.enemies.find((e) => e.uid === fight.obeliskUid)!;
        obelisk.hp = obelisk.maxHp;
        // (a weapon's hit: a fixed share of its hitpoints, mightScale 0, takes no more for it)
        sim["damageEnemy"](obelisk, 100, 0, obelisk.x, obelisk.y);
        const soaked = obelisk.maxHp - obelisk.hp;
        hero.wardenEnergy = 0;
        obelisk.hp = obelisk.maxHp;
        sim["damageEnemy"](obelisk, 100, 0, obelisk.x, obelisk.y);
        expect(soaked).toBeGreaterThan((obelisk.maxHp - obelisk.hp) * 1.5);
        // One more while full hurts
        hero.wardenEnergy = WARDENS.orbs.soak.max;
        step(sim, 3, () => stand(sim, spot));
        expect(sim.player.hp).toBeLessThan(hp);
        // and what's held fades
        stand(sim, places.arrive);
        step(sim, WARDENS.orbs.soak.fade * WARDENS.orbs.soak.max + 1);
        expect(hero.wardenEnergy).toBe(0);
    });

    it("discharges a full Warden: its pyramids over every other cell, then a shot that finds you", () => {
        const sim = atWardens();
        sim.devGod = true;
        const fight = sim.tombsWardens!;
        fight.charge.elidinis = WARDENS.charge.full;
        step(sim, 0.1);
        const mine = fight.pyramids.filter((p) => p.side === "elidinis");
        expect(mine.length).toBeGreaterThan(10);
        const floor = sim.map.tombs!.wardens!.floor;
        const { cell, from } = WARDENS.pyramids;
        for (const pyramid of mine) {
            const i = (pyramid.x - (floor.x0 + from.x)) / cell;
            const j = (pyramid.y - (floor.y0 + from.y)) / cell;
            expect((i + j) % 2).toBe(1);
        }
        expect(fight.next.elidinis).toBe("shot");
        // Next time, the shot, landing wherever you've gone
        sim.devGod = false;
        fight.pyramids = [];
        fight.pausedUntil.elidinis = 0;
        fight.charge.elidinis = WARDENS.charge.full;
        step(sim, 0.1);
        expect(fight.shots).toHaveLength(1);
        const hp = sim.player.hp;
        step(sim, WARDENS.shot.flight + 0.2, () => stand(sim, { x: 1030.5, y: 1060.5 }));
        expect(sim.player.hp).toBeLessThan(hp);
    });

    it("hurts whoever's under a pyramid while it glows, and nobody beside it", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        const pyramid = { side: "tumeken" as const, x: 1040, y: 1056, startTick: sim.tick };
        fight.pyramids = [pyramid];
        fight.nextOrbTick = Infinity;
        const hp = sim.player.hp;
        step(sim, WARDENS.pyramids.leave, () => stand(sim, { x: 1044.5, y: 1057.5 }));
        expect(sim.player.hp).toBe(hp);
        fight.pyramids = [{ ...pyramid, startTick: sim.tick }];
        step(sim, WARDENS.pyramids.leave, () => stand(sim, { x: 1041.5, y: 1057.5 }));
        expect(sim.player.hp).toBeLessThan(hp);
        expect(fight.pyramids).toHaveLength(0);
    });

    it("wakes the Warden with the more charge once the obelisk breaks", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        fight.charge.elidinis = 80;
        fight.charge.tumeken = 20;
        // Past its first pyramids, so it can break
        fight.pyramidsDone = sim.tick;
        const obelisk = sim.enemies.find((e) => e.uid === fight.obeliskUid)!;
        sim.damageEnemy(obelisk, 1e9, 0, sim.player.x, sim.player.y);
        step(sim, 0.1);
        expect(fight.phase).toBe(2);
        expect(fight.winner).toBe("elidinis");
        expect(fight.orbs).toHaveLength(0);
    });
});

describe("the Wardens' second and last phases", () => {
    function atWardens() {
        const sim = tombs([]);
        sim.heroes[0].weapons = [];
        expect(sim.devToWardens()).toBe(true);
        sim.heroes[0].weapons = [];
        sim.player.invulnerable = 0;
        sim.devGod = true;
        return sim;
    }
    const step = (sim: Sim, seconds: number, each?: () => void) => {
        for (let i = 0; i < seconds * TICKS_PER_SECOND; i++) {
            each?.();
            sim.step();
        }
    };
    const find = (sim: Sim, uid: number | undefined) => sim.enemies.find((e) => e.uid === uid)!;
    // The obelisk broken with Elidinis' the more charged, and her up
    function atPhaseTwo() {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        fight.charge.elidinis = 100;
        fight.charge.tumeken = 0;
        const obelisk = find(sim, fight.obeliskUid);
        obelisk.hp = 0;
        obelisk.dead = true;
        step(sim, 0.1);
        expect(fight.phase).toBe(2);
        expect(fight.winner).toBe("elidinis");
        step(sim, WARDENS.two.wake + 0.2);
        return sim;
    }
    const hit = (sim: Sim, enemy: ReturnType<typeof find>, weaponId: string, damage: number) => {
        sim["damageSource"] = `weapon:${weaponId}`;
        return sim.damageEnemy(enemy, damage, 0, sim.player.x, sim.player.y, 0);
    };

    it("wakes the Warden whose side wasn't blocked, however recently it attacked", () => {
        const sim = atWardens();
        const fight = sim.tombsWardens!;
        const gap = sim.map.tombs!.wardens!.sides.tumeken.gap;
        step(sim, 40, () => {
            sim.player.x = sim.player.prevX = gap.x;
            sim.player.y = sim.player.prevY = gap.y;
        });
        // Elidinis' has attacked more, and may have just now
        expect(fight.spent.elidinis).toBeGreaterThan(fight.spent.tumeken);
        fight.charge.elidinis = 0;
        const obelisk = find(sim, fight.obeliskUid);
        obelisk.hp = 0;
        obelisk.dead = true;
        step(sim, 0.1);
        expect(fight.winner).toBe("elidinis");
    });

    it("has Elidinis' channel her Judgement, open while it runs, and the button breaks it", () => {
        const sim = atPhaseTwo();
        const two = sim.tombsWardens!.two!;
        const warden = find(sim, two.wardenUid);
        const judgement = warden.def.boss!.attacks.find((a) => a.name === "Judgement")!;
        warden.bossState!.windup = undefined;
        sim["startBossAttack"](warden, judgement);
        step(sim, judgement.windup + 0.1);
        expect(sim.tethers.some((t) => t.bossUid === warden.uid)).toBe(true);
        step(sim, 2);
        expect(sim.isExposed(warden)).toBe(true);
        sim.player.x = sim.player.prevX = warden.x;
        sim.player.y = sim.player.prevY = warden.y - (warden.radius + 1);
        expect(sim.useAbility()).toBe(true);
        expect(sim.tethers.some((t) => t.bossUid === warden.uid)).toBe(false);
        expect(sim.isExposed(warden)).toBe(true);
    });

    it("gives Tumeken's a charge down a strip, twice with Acceleration", () => {
        const charge = getEnemy("tumeken_warden_magic").boss!.attacks.find(
            (a) => a.name === "Charge",
        )!;
        expect(charge.line?.dash).toBeGreaterThan(0);
        expect(charge.opens).toBeGreaterThan(0);
        const sim = tombs(["acceleration"]);
        expect(sim["invokedAttack"](charge).chain?.times).toBe(1);
        expect(tombs([])["invokedAttack"](charge).chain).toBeUndefined();
    });

    it("never entombs into the obelisk's special", () => {
        const sim = atPhaseTwo();
        const two = sim.tombsWardens!.two!;
        two.nextOpen = sim.tick + TICKS_PER_SECOND;
        expect(sim["obeliskStrikesWithin"](2)).toBe(true);
        two.nextOpen = sim.tick + 30 * TICKS_PER_SECOND;
        two.current = undefined;
        expect(sim["obeliskStrikesWithin"](2)).toBe(false);
        const entomb = getEnemy("elidinis_warden_magic").boss!.attacks.find(
            (a) => a.name === "Entomb",
        )!;
        expect(entomb.clearOfObelisk).toBeDefined();
    });

    it("wakes the Warden with the more charge, which only its open style hurts, filling its shield", () => {
        const sim = atPhaseTwo();
        const two = sim.tombsWardens!.two!;
        const warden = find(sim, two.wardenUid);
        expect(warden.def.id).toBe("elidinis_warden_magic");
        expect(sim.shownBoss).toBe(warden);
        // Ranged does nothing; magic fills the shield, not its hitpoints
        expect(hit(sim, warden, "dark_bow", 100)).toBe(0);
        expect(hit(sim, warden, "ice_barrage", 100)).toBeGreaterThan(0);
        expect(two.shield).toBeGreaterThan(0);
        expect(warden.hp).toBe(warden.maxHp);
    });

    it("kneels with its shield full, its core taking five times what it's hit for, then stands open to the other style", () => {
        const sim = atPhaseTwo();
        const two = sim.tombsWardens!.two!;
        const warden = find(sim, two.wardenUid);
        hit(sim, warden, "ice_barrage", two.shieldMax * 2);
        expect(two.kneel).toBeDefined();
        expect(warden.def.id).toBe("elidinis_warden_exposed");
        step(sim, WARDENS.two.kneel + 0.1);
        const core = find(sim, two.kneel!.coreUid);
        expect(core.def.id).toBe("elidinis_warden_core");
        const before = warden.hp;
        const dealt = hit(sim, core, "dark_bow", 100);
        expect(before - warden.hp).toBe(dealt * WARDENS.two.coreMultiplier);
        // Out its time (the first, above 80%), then back up, flipped to ranged
        step(sim, WARDENS.two.seconds[0] + WARDENS.two.stand + 0.2);
        expect(two.kneel).toBeUndefined();
        expect(core.dead).toBe(true);
        expect(warden.def.id).toBe("elidinis_warden_ranged");
        expect(hit(sim, warden, "ice_barrage", 100)).toBe(0);
        expect(hit(sim, warden, "dark_bow", 100)).toBeGreaterThan(0);
    });

    it("has the obelisk open its specials in turn, striking the floor where it marked", () => {
        const sim = atPhaseTwo();
        const fight = sim.tombsWardens!;
        const two = fight.two!;
        const kinds: string[] = [];
        let struck = 0;
        step(sim, 120, () => {
            if (two.current && kinds[kinds.length - 1] !== two.current.kind) {
                kinds.push(two.current.kind);
            }
            struck = Math.max(struck, fight.marks.filter((m) => m.hurts > 0).length);
        });
        expect(kinds.length).toBeGreaterThanOrEqual(3);
        const order = ["beam", "windmill", "skulls"];
        const first = order.indexOf(kinds[0]);
        kinds.slice(0, 3).forEach((kind, i) => expect(kind).toBe(order[(first + i) % 3]));
        expect(struck).toBeGreaterThan(20);
        // Standing on a mark as it lands hurts
        sim.devGod = false;
        const mark = fight.marks.find((m) => m.hurts > 0 && m.from > sim.tick);
        if (mark) {
            const hp = sim.player.hp;
            step(sim, (mark.from - sim.tick) / TICKS_PER_SECOND + 0.02, () => {
                sim.player.x = sim.player.prevX = mark.x;
                sim.player.y = sim.player.prevY = mark.y;
            });
            expect(sim.player.hp).toBeLessThan(hp);
        }
    });

    it("keeps the obelisk going while the core's out", () => {
        const sim = atPhaseTwo();
        const fight = sim.tombsWardens!;
        const two = fight.two!;
        step(sim, WARDENS.two.obelisk.firstOpen + 1);
        const going = two.current;
        expect(going).toBeDefined();
        hit(sim, find(sim, two.wardenUid), "ice_barrage", two.shieldMax * 2);
        step(sim, 1);
        expect(two.kneel).toBeDefined();
        expect(two.current).toBe(going);
        expect(fight.marks.length).toBeGreaterThan(0);
    });

    it("lays their last floor again after a wipe there, back to the first phase", () => {
        const sim = atPhaseTwo();
        const fight = sim.tombsWardens!;
        find(sim, fight.two!.wardenUid).hp = 0;
        step(sim, WARDENS.two.toLast + 0.2);
        expect(fight.phase).toBe(3);
        const floor = sim.floor;
        sim.grid.dropTile(LAST_FLOOR.x0 + 2, LAST_FLOOR.y0 + 2);
        expect(sim.grid.isDropped(LAST_FLOOR.x0 + 2, LAST_FLOOR.y0 + 2)).toBe(true);
        sim.devGod = false;
        sim.player.invulnerable = 0;
        sim["damagePlayer"](sim.player.maxHp * 10, "wardens_obelisk", false, undefined, true);
        sim.step();
        expect(sim.runOver).toBe(false);
        expect(sim.tombsWardens!.phase).toBe(1);
        expect(sim.floor).not.toBe(floor);
        expect(sim.grid.isDropped(LAST_FLOOR.x0 + 2, LAST_FLOOR.y0 + 2)).toBe(false);
    });

    it("brings the fallen Warden back over the moving floor, slamming east, west, then both", () => {
        const sim = atPhaseTwo();
        const fight = sim.tombsWardens!;
        const two = fight.two!;
        find(sim, two.wardenUid).hp = 0;
        step(sim, WARDENS.two.toLast + 0.2);
        expect(fight.phase).toBe(3);
        const three = fight.three!;
        const warden = find(sim, three.wardenUid);
        expect(warden.def.id).toBe("tumeken_warden_last");
        expect(sim.shownBoss).toBe(warden);
        const last = sim.map.tombs!.wardens!.last!;
        expect(sim.player.y).toBeCloseTo(last.arrive.y, 0);
        // Its first slam: the east half rising, the west left alone
        const floor = sim.floor!;
        step(sim, 3.8);
        const middle = floor.x0 + Math.floor(floor.sizeX / 2);
        const row = floor.y0 + 10;
        const warned = (x: number) =>
            floor.warnAt[floor.index(x, row)] !== -1 || floor.roseAt[floor.index(x, row)] !== -1;
        expect(warned(middle + 4)).toBe(true);
        expect(warned(middle - 4)).toBe(false);
        expect(three.slam).toBe(1);
    });

    it("charges at 80%, its siphons stopped by stepping on them, then staggers", () => {
        const sim = atPhaseTwo();
        const fight = sim.tombsWardens!;
        find(sim, fight.two!.wardenUid).hp = 0;
        step(sim, WARDENS.two.toLast + 0.2);
        const three = fight.three!;
        const warden = find(sim, three.wardenUid);
        // A hit past 80% stops there
        hit(sim, warden, "dark_bow", warden.maxHp);
        expect(warden.hp).toBeCloseTo(warden.maxHp * 0.8, 0);
        step(sim, 0.1);
        const siphons = three.siphons!;
        expect(siphons.uids).toHaveLength(WARDENS.three.count[0]);
        // In one of its formations, in front of it, mirrored or not
        const want = formationSpots(WARDENS.three.formations[three.formation], siphons.uids.length);
        const front = wardenFrontRow(warden) + 0.5;
        const landed = siphons.uids.map((uid) => find(sim, uid));
        const fits = (flip: number) =>
            landed.every(
                (siphon, i) =>
                    Math.floor(siphon.x) === Math.floor(warden.x + flip * want[i].x) &&
                    Math.floor(siphon.y) === Math.floor(front + want[i].y),
            );
        expect(fits(1) || fits(-1)).toBe(true);
        expect(landed.every((siphon) => siphon.y < warden.y)).toBe(true);
        expect(warden.def.id).toBe("tumeken_warden_charging");
        // Nothing gets at it while they're out
        const charging = warden.hp;
        hit(sim, warden, "dark_bow", warden.maxHp);
        expect(warden.hp).toBe(charging);
        for (const uid of siphons.uids) {
            const siphon = find(sim, uid);
            step(sim, 0.1, () => {
                sim.player.x = sim.player.prevX = siphon.x;
                sim.player.y = sim.player.prevY = siphon.y;
            });
        }
        expect(three.siphons).toBeUndefined();
        expect(warden.hp).toBeLessThan(warden.maxHp * 0.8 - 1);
        expect(warden.def.id).toBe("tumeken_warden_last");
    });

    it("brings its phantoms with the second and third charges, and enrages at its last hitpoints", () => {
        const sim = atPhaseTwo();
        const fight = sim.tombsWardens!;
        find(sim, fight.two!.wardenUid).hp = 0;
        step(sim, WARDENS.two.toLast + 0.2);
        const three = fight.three!;
        const warden = find(sim, three.wardenUid);
        // No lightning before it's enraged: the slams are the floor's danger
        step(sim, 10);
        expect(fight.marks.some((m) => m.hurts > 0)).toBe(false);
        for (let i = 0; i < 4; i++) {
            hit(sim, warden, "dark_bow", warden.maxHp);
            step(sim, 0.1);
            expect(three.phantoms).toHaveLength(Math.min(2, i));
            // Left to go off
            step(sim, WARDENS.three.window + 0.2);
            expect(three.siphons).toBeUndefined();
        }
        expect(three.phantoms.map((uid) => find(sim, uid).def.id)).toEqual([
            "zebaks_phantom",
            "babas_phantom",
        ]);
        // Zebak's on its left (west), Ba-Ba's on its right
        const [zebak, baba] = three.phantoms.map((uid) => find(sim, uid));
        expect(zebak.x).toBeLessThan(warden.x);
        expect(baba.x).toBeGreaterThan(warden.x);
        expect(three.phantoms.every((uid) => find(sim, uid).bossState?.enraged)).toBe(false);
        hit(sim, warden, "dark_bow", warden.maxHp);
        expect(warden.hp).toBeCloseTo(warden.maxHp * WARDENS.three.enrage.at, 0);
        step(sim, 0.1);
        expect(three.enraged).toBe(true);
        expect(warden.hp).toBeGreaterThan(warden.maxHp * 0.2);
        // Its phantoms quickened, its slams stopped, lightning in their place, and rows torn
        // away from the back
        expect(three.phantoms.every((uid) => find(sim, uid).bossState?.enraged)).toBe(true);
        const slams = three.slam;
        sim.devGod = true;
        step(sim, WARDENS.three.enrage.firstRow + 3);
        expect(sim.floor!.rowsDropped).toBeGreaterThan(0);
        expect(three.slam).toBe(slams);
        expect(fight.marks.some((m) => m.hurts > 0)).toBe(true);
        // Down to the row in front of it, and no further: it and what's beside it are left
        const floor = sim.floor!;
        step(sim, WARDENS.three.enrage.rowEvery * floor.sizeY + 5);
        const front = wardenFrontRow(warden);
        expect(floor.rowsDropped).toBe(front - floor.y0);
        expect(sim.grid.isSolid(Math.floor(warden.x), front)).toBe(false);
        expect(sim.grid.isSolid(Math.floor(warden.x), front - 1)).toBe(true);
        expect(sim.grid.isSolid(floor.x0 + 2, Math.floor(warden.y))).toBe(false);
        // And it can be beaten
        for (let i = 0; i < 20 && !warden.dead; i++) {
            hit(sim, warden, "dark_bow", warden.maxHp);
        }
        expect(warden.dead).toBe(true);
        // The chest opened as it fell, on the victory screen
        expect(sim.heroes[0].raidChest?.level).toBe(0);
        step(sim, 6);
        expect(sim.state).toBe("victory");
        expect(sim.getResult().raidChest).toBeDefined();
        // The board: the Wardens' time, and points for the Wardens' hitpoints taken
        const board = sim.getResult().tombs!;
        expect(board.level).toBe(0);
        expect(board.wardensSeconds).toBeGreaterThan(0);
        expect(board.party).toHaveLength(1);
        expect(board.party[0].you).toBe(true);
        expect(board.party[0].points).toBeGreaterThanOrEqual(TOMBS_POINTS.wardenThree);
        // And the points to spend at the Helpful Spirit are whole
        expect(sim.raidPoints).toBeGreaterThan(0);
        expect(Number.isInteger(sim.raidPoints)).toBe(true);
        // The fight's on the run's clock, not left out as the Nexus is
        expect(sim.seconds).toBeGreaterThan(WARDENS.two.toLast);
    });
});

describe("the Tombs' chest", () => {
    // The chest opened as the last Warden falls, at this raid level, so many times over
    const open = (invocations: string[], times: number) => {
        const sim = tombs(invocations);
        // A whole raid's points
        sim.heroes[0].tombsPoints = TOMBS_POINTS.full;
        const found: string[] = [];
        for (let i = 0; i < times; i++) {
            sim.trophies.clear();
            sim["openTombsChest"]();
            found.push(...sim.heroes[0].raidChest!.found);
        }
        return { sim, found };
    };

    it("goes by each player's points: all the raid level's chance with a whole raid's, a fifth off for a death", () => {
        const sim = tombs(INVOCATIONS.map((i) => i.id));
        const hero = sim.heroes[0];
        hero.tombsPoints = TOMBS_POINTS.full;
        const whole = sim["tombsChance"](hero);
        expect(whole).toBeGreaterThan(0.3);
        hero.tombsPoints = TOMBS_POINTS.full / 2;
        expect(sim["tombsChance"](hero)).toBeCloseTo(whole / 2);
        sim.player.hp = 1;
        sim["revivesLeft"] = 0;
        sim["tombsPath"] = sim.map.tombs!.paths[0].id;
        sim["playerDied"]();
        expect(hero.tombsDowns).toBe(1);
        expect(hero.tombsPoints).toBeCloseTo((TOMBS_POINTS.full / 2) * 0.8);
    });

    it("has no purple under raid level 50, and only the fang or the Lightbearer under 150", () => {
        const { sim, found } = open([], 200);
        expect(sim.raidLevel).toBe(0);
        expect(sim.heroes[0].raidChest!.chance).toBe(0);
        expect(found.every((id) => TROPHY_BY_ID.get(id)!.from.kind === "tombs")).toBe(true);
        expect(
            found.filter((id) => !["tumekens_guardian", "thread_of_elidinis"].includes(id)),
        ).toEqual([]);
    });

    it("finds more purples the higher the raid level, and the jewels only from theirs", () => {
        const invocations = INVOCATIONS.map((i) => i.id);
        const high = open(invocations, 300);
        const level = high.sim.raidLevel;
        expect(level).toBeGreaterThanOrEqual(150);
        const purples = high.found.filter((id) => {
            const from = TROPHY_BY_ID.get(id)!.from;
            return from.kind === "tombs" && from.weight !== undefined;
        });
        expect(purples.length).toBeGreaterThan(300 * 0.3);
        for (const id of high.found) {
            const from = TROPHY_BY_ID.get(id)!.from;
            expect(from.kind === "tombs" && from.level <= level).toBe(true);
        }
        expect(high.sim.heroes[0].raidChest!.level).toBe(level);
    });

    it("never gives what's found already, a purple, the pet, the Thread or a jewel", () => {
        const invocations = INVOCATIONS.map((i) => i.id);
        const sim = tombs(invocations);
        const level = sim["tombsChestLevel"]();
        const open = TROPHIES.filter((t) => t.from.kind === "tombs" && t.from.level <= level);
        const purples = open.filter((t) => t.from.kind === "tombs" && t.from.weight !== undefined);
        const rolls = open.filter((t) => t.from.kind === "tombs" && t.from.chance !== undefined);
        expect(purples.length).toBeGreaterThan(1);
        expect(rolls.length).toBeGreaterThan(1);
        // All but one purple and one roll of its own found before
        const owned = new Set([...purples.slice(1), ...rolls.slice(1)].map((t) => t.id));
        sim.heroes[0].trophiesFound = owned;
        sim.heroes[0].tombsPoints = TOMBS_POINTS.full;
        const given = new Set<string>();
        for (let i = 0; i < 2000; i++) {
            sim.trophies.clear();
            sim["openTombsChest"]();
            for (const id of sim.heroes[0].raidChest!.found) {
                expect(owned.has(id)).toBe(false);
                given.add(id);
            }
        }
        expect([...given].sort()).toEqual([purples[0].id, rolls[0].id].sort());
        // Found this run counts too: with those two found in it, nothing more
        sim.trophies.clear();
        sim.trophies.add(purples[0].id);
        sim.trophies.add(rolls[0].id);
        for (let i = 0; i < 200; i++) {
            sim["openTombsChest"]();
            expect(sim.heroes[0].raidChest!.found).toEqual([]);
        }
        // Every purple found but a roll of its own left: no chance shown, and none claimed
        sim.trophies.clear();
        sim.heroes[0].trophiesFound = new Set(
            open.filter((t) => t.id !== rolls[0].id).map((t) => t.id),
        );
        sim.takeEvents();
        sim["openTombsChest"]();
        expect(sim.heroes[0].raidChest!.chance).toBe(0);
        if (sim.heroes[0].raidChest!.found.length === 0) {
            expect(sim.takeEvents()).toContainEqual(
                expect.objectContaining({
                    type: "notice",
                    message: "The chest holds no unique this time.",
                }),
            );
        }
        // Everything found: no chance, nothing given, and the chest says so
        sim.heroes[0].trophiesFound = new Set(open.map((t) => t.id));
        sim.trophies.clear();
        sim.takeEvents();
        sim["openTombsChest"]();
        expect(sim.heroes[0].raidChest!.found).toEqual([]);
        expect(sim.heroes[0].raidChest!.chance).toBe(0);
        expect(
            sim
                .takeEvents()
                .some(
                    (e) => e.type === "notice" && e.message.includes("nothing you haven't found"),
                ),
        ).toBe(true);
    });
});

describe("the Helpful Spirit", () => {
    // Back in the Nexus from a path, with so many others done before it
    const back = (invocations: string[], before: number) => {
        const sim = tombs(invocations);
        const ids = sim.map.tombs!.paths.map((p) => p.id);
        sim.tombsPathsDone.push(...ids.slice(1, 1 + before));
        sim.tombsPath = ids[0];
        sim["leaveTombsPath"]();
        return sim;
    };
    // Up to the Spirit, from a step off
    const meet = (sim: Sim) => {
        const at = sim.map.tombs!.spirit!;
        sim.player.x = sim.player.prevX = at.x;
        sim.player.y = sim.player.prevY = at.y - 3;
        sim.step();
        sim.player.x = sim.player.prevX = at.x;
        sim.player.y = sim.player.prevY = at.y;
        sim.step();
    };
    const supplies = (sim: Sim) =>
        Object.fromEntries(sim.inventory.filter((s) => s).map((s) => [s!.itemId, s!.count]));

    it("stands in the Nexus with a free bundle after two paths and after four", () => {
        const early = back([], 0);
        meet(early);
        expect(early.state).toBe("playing");
        const sim = back([], 1);
        // It waits to be walked up to
        expect(sim.state).toBe("playing");
        sim.heroes[0].raidPoints = 0;
        meet(sim);
        expect(sim.state).toBe("event");
        expect(sim.offer!.def.id).toBe("helpful_spirit");
        expect(sim.offer!.options.map((o) => o.kind === "bundle" && o.bundleId)).toEqual(
            TOMBS_SPIRIT_BUNDLES.map((b) => b.id),
        );
        // Free: taken with no points to spend
        const life = sim.offer!.options.findIndex(
            (o) => o.kind === "bundle" && o.bundleId === "life",
        );
        expect(sim.chooseEventOption(life)).toBe(true);
        expect(sim.state).toBe("playing");
        expect(supplies(sim)).toEqual({
            nectar: 3,
            tears_of_elidinis: 2,
            blessed_crystal_scarab: expect.any(Number),
            ambrosia: 1,
        });
        expect(sim.tombsSpiritBundles(0)).toBe(0);
        // Nothing more until the other two paths
        meet(sim);
        expect(sim.state).toBe("playing");
        // (the test map has two paths: the other two by name)
        sim.tombsPathsDone.push("crondis", "scabaras");
        expect(sim.tombsSpiritBundles(0)).toBe(1);
        meet(sim);
        expect(sim.state).toBe("event");
    });

    it("keeps what's in its bundles when walked away from and back to", () => {
        const sim = back([], 1);
        meet(sim);
        const first = JSON.stringify(sim.offer!.options);
        sim.leaveEvent();
        meet(sim);
        expect(JSON.stringify(sim.offer!.options)).toBe(first);
    });

    it("lets a bundle not taken go once the next door's gone through", () => {
        const sim = back([], 1);
        expect(sim.tombsSpiritBundles(0)).toBe(1);
        const path = sim.map.tombs!.paths[1];
        sim["enterTombsPath"](path.id, path.room!.arrive);
        expect(sim.tombsSpiritBundles(0)).toBe(0);
    });

    it("puts its supplies in the inventory, and uses what there's no room for", () => {
        const sim = back([], 1);
        sim.inventory = ["shark", "stamina_potion", "red_chinchompa", null].map((id) =>
            id ? { itemId: id, count: 1 } : null,
        );
        sim.player.hp = 1;
        sim["takeTombsBundle"]([
            { supplyId: "nectar", count: 2 },
            { supplyId: "ambrosia", count: 1 },
        ]);
        expect(supplies(sim).nectar).toBe(2);
        expect(sim.player.hp).toBe(sim.player.maxHp);
        // Used from the inventory, a supply does what it says
        sim.player.hp = 1;
        expect(sim.useItem(3)).toBe(true);
        expect(sim.player.hp).toBeCloseTo(1 + sim.player.maxHp * 0.25, 5);
    });

    it("gives less with Need Less Help, and nothing that heals with Dehydration", () => {
        const count = (invocations: string[]) => {
            const sim = back(invocations, 1);
            meet(sim);
            const life = sim.offer!.options.find(
                (o) => o.kind === "bundle" && o.bundleId === "life",
            )!;
            return life.kind === "bundle" ? life.items : [];
        };
        const full = count([]).reduce((n, i) => n + i.count, 0);
        const less = count(["need_less_help"]);
        expect(less.reduce((n, i) => n + i.count, 0)).toBeLessThan(full);
        expect(less.length).toBeGreaterThan(0);
        for (const item of count(["dehydration"])) {
            expect(getRaidSupply(item.supplyId).effect.kind).not.toBe("heal");
        }
    });

    it("leaves only visitors with a casket to come by in the Tombs", () => {
        const sim = back([], 0);
        for (let i = 0; i < 40; i++) {
            expect(sim["rollRandomEvent"]()!.effect.kind).toBe("casket");
        }
    });
});

describe("the Tombs' time limits", () => {
    it("drop the chest's raid level once the raid's past its time", () => {
        const sim = tombs(["walk_for_it", "insanity"]);
        const level = sim.raidLevel;
        expect(sim["tombsChestLevel"]()).toBe(level);
        Object.assign(sim, { tick: 41 * 60 * TICKS_PER_SECOND });
        expect(sim["tombsChestLevel"]()).toBe(level - 20);
        sim["openTombsChest"]();
        expect(sim.heroes[0].raidChest!.level).toBe(level - 20);
        expect(sim.getResult().tombs!.timeLimit).toEqual({ minutes: 40, drop: 20, met: false });
    });
});
