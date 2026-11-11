import { getEnemy } from "../content/enemies";
import { getMap, hasPoison } from "../content/maps";
import { POWER_UPS, getPowerUp } from "../content/powerups";
import { QUESTS } from "../content/quests";
import { PUMPKIN_ID, PUMPKIN_OUTCOMES } from "../content/trickOrTreat";
import { TROPHIES } from "../content/trophies";
import { BossAttackDef, emptyStats } from "../content/types";
import { getWeapon } from "../content/weapons";
import { Sim, TICKS_PER_SECOND } from "./Sim";
import { Enemy, Pickup } from "./entities";
import { SAVE_VERSION, createSave, migrateSave, recordRun } from "./save";
import { makeGrid } from "./world/testGrid";

function openField(): string[] {
    const size = 72;
    const rows: string[] = [];
    for (let y = 0; y < size; y++) {
        const edge = y === 0 || y === size - 1;
        rows.push(edge ? "#".repeat(size) : "#" + ".".repeat(size - 2) + "#");
    }
    return rows;
}

function createSim(mapId = "halloween", seed = 1): Sim {
    return new Sim({
        grid: makeGrid(openField(), 1000, 1000),
        mapId,
        characterId: "warrior",
        metaStats: emptyStats(),
        seed,
        spawnX: 1036.5,
        spawnY: 1036.5,
    });
}

// Steps the sim with no input, keeping the player alive and nothing else about
function run(sim: Sim, seconds: number): void {
    for (let i = 0; i < seconds * TICKS_PER_SECOND; i++) {
        sim.player.hp = sim.player.maxHp;
        sim.enemies = sim.enemies.filter((e) => e.boss);
        sim.step(0, 0);
    }
}

// Private methods, as the map's clock would call them
type Hooks = {
    bringOnBoss(def: unknown, type: string, hp?: number): boolean;
    openPumpkin(): string;
    rollPumpkin(x: number, y: number): void;
    killEnemy(enemy: Enemy): void;
    rollBossTrophies(enemy: Enemy): void;
    stepStomp(enemy: Enemy): void;
    landBossAttack(enemy: Enemy, windup: unknown): void;
};
const hooks = (sim: Sim) => sim as unknown as Hooks;

function layMimic(sim: Sim): Pickup {
    expect(hooks(sim).bringOnBoss(getEnemy("the_mimic"), "boss", 5000)).toBe(true);
    return sim.pickups.find((p) => p.disguise)!;
}

function spawn(sim: Sim, id: string): Enemy {
    return sim.spawnEnemy(getEnemy(id), "boss", { x: 1040, y: 1040 })!;
}

function attack(id: string, name: string): BossAttackDef {
    return getEnemy(id).boss!.attacks.find((a) => a.name === name)!;
}

describe("Slash Bash", () => {
    test("disease stacks up to its limit, and every dose starts the clock again", () => {
        const sim = createSim();
        const disease = attack("slash_bash", "Bash").effect!;
        const speed = sim.stats.moveSpeed;
        for (let i = 0; i < 6; i++) {
            sim.applyPlayerEffect(disease);
        }
        expect(sim.debuffs).toHaveLength(1);
        expect(sim.debuffs[0].stacks).toBe(4);
        expect(sim.debuffs[0].name).toContain("x4");
        expect(sim.stats.moveSpeed).toBeCloseTo(speed - 0.32);
    });

    test("a map with him has cures among its casket items", () => {
        expect(hasPoison(getMap("halloween"))).toBe(true);
    });

    test("other debuffs still replace themselves", () => {
        const sim = createSim();
        const effect = {
            kind: "debuff" as const,
            id: "x",
            name: "X",
            iconObjId: 1,
            stats: { might: -0.1 },
            seconds: 5,
        };
        sim.applyPlayerEffect(effect);
        sim.applyPlayerEffect(effect);
        expect(sim.debuffs[0].stats.might).toBe(-0.1);
    });

    test("bile leaves pools that hurt whoever stands in them, until they dry up", () => {
        const sim = createSim();
        const boss = spawn(sim, "slash_bash");
        const bile = attack("slash_bash", "Bile throw");
        const spot = { x: sim.player.x, y: sim.player.y };
        hooks(sim).landBossAttack(boss, {
            attack: bile,
            startTick: 0,
            landTick: 0,
            targets: [spot, { x: spot.x + 20, y: spot.y }],
        });
        expect(sim.pools).toHaveLength(2);

        const hp = sim.player.hp;
        sim.player.invulnerable = 0;
        sim.step(0, 0);
        expect(sim.player.hp).toBeLessThan(hp);
        expect(sim.debuffs.some((d) => d.id === "diseased")).toBe(true);

        // Out of it: nothing
        sim.player.x = spot.x + 8;
        sim.player.hp = sim.player.maxHp;
        sim.player.invulnerable = 0;
        sim.enemies = [];
        sim.step(0, 0);
        expect(sim.player.hp).toBe(sim.player.maxHp);

        sim.enemies = [];
        run(sim, bile.pool!.seconds + 1);
        expect(sim.pools).toHaveLength(0);
    });
});

describe("The Mimic", () => {
    test("arrives as a casket, with no boss to be seen", () => {
        const sim = createSim();
        const casket = layMimic(sim);
        expect(casket.kind).toBe("casket");
        expect(casket.tier).toBe("master");
        expect(sim.enemies.some((e) => e.def.id === "the_mimic")).toBe(false);
        expect(sim.takeEvents().some((e) => e.type === "casketDropped")).toBe(true);
    });

    test("walking onto it sets it off, a moment before it opens", () => {
        const sim = createSim();
        const casket = layMimic(sim);
        sim.player.x = casket.x;
        sim.player.y = casket.y;
        run(sim, 0.1);
        expect(casket.disguise!.openTick).not.toBe(-1);
        expect(sim.enemies.some((e) => e.def.id === "the_mimic")).toBe(false);

        sim.takeEvents();
        run(sim, getEnemy("the_mimic").disguise!.shake);
        const mimic = sim.enemies.find((e) => e.def.id === "the_mimic")!;
        expect(mimic.boss).toBe(true);
        expect(mimic.maxHp).toBe(5000);
        expect(sim.pickups.some((p) => p.disguise)).toBe(false);
        // It never counted as a casket, and there's no casket screen
        expect(sim.getResult().caskets).toBe(0);
        expect(sim.takeEvents().some((e) => e.type === "bossSpawned")).toBe(true);
    });

    test("a ring of its sweets warns of it while it shakes, and goes as it opens", () => {
        const sim = createSim();
        const casket = layMimic(sim);
        const { spotAnims, count, ringRadius } = getEnemy("the_mimic").disguise!.warning!;
        expect(sim.effects.filter((e) => spotAnims.includes(e.spotAnim))).toHaveLength(0);
        sim.player.x = casket.x;
        sim.player.y = casket.y;
        run(sim, 0.1);
        const ring = sim.effects.filter((e) => spotAnims.includes(e.spotAnim));
        expect(ring).toHaveLength(count);
        for (const sweet of ring) {
            expect(Math.hypot(sweet.x - casket.x, sweet.y - casket.y)).toBeCloseTo(ringRadius);
        }
        run(sim, getEnemy("the_mimic").disguise!.shake + 0.1);
        expect(sim.effects.some((e) => spotAnims.includes(e.spotAnim))).toBe(false);
    });

    test("left alone it opens anyway, and a magnet doesn't bring it over", () => {
        const sim = createSim();
        const casket = layMimic(sim);
        const { x, y } = casket;
        sim.usePowerUp(getPowerUp("magnet"));
        run(sim, 2);
        expect([casket.x, casket.y]).toEqual([x, y]);
        const { seconds, shake } = getEnemy("the_mimic").disguise!;
        run(sim, seconds + shake);
        expect(sim.enemies.some((e) => e.def.id === "the_mimic")).toBe(true);
    });

    test("a disguise is only for mid-run bosses", () => {
        const sim = createSim();
        expect(hooks(sim).bringOnBoss(getEnemy("the_mimic"), "finalBoss")).toBe(true);
        expect(sim.enemies.some((e) => e.finalBoss)).toBe(true);
    });

    test("candies bring one of each minion, who drop nothing, and no more", () => {
        const sim = createSim();
        const boss = spawn(sim, "the_mimic");
        const candy = attack("the_mimic", "Candy attack");
        const targets = [...Array(6).keys()].map((i) => ({ x: 1025 + i * 3, y: 1045 }));
        const land = () =>
            hooks(sim).landBossAttack(boss, { attack: candy, startTick: 0, landTick: 0, targets });
        land();
        land();
        const minions = sim.enemies.filter((e) => e.spawnedBy === boss.uid);
        expect(minions.map((e) => e.def.id).sort()).toEqual([
            "third_age_mage",
            "third_age_ranger",
            "third_age_warrior",
        ]);
        expect(minions.every((e) => e.noDrops)).toBe(true);
    });

    test("the stomp grows while you stay under it, and starts over when you step out", () => {
        const sim = createSim();
        sim.stats.armor = 0;
        const boss = spawn(sim, "the_mimic");
        const interval = Math.round(boss.def.boss!.stomp!.interval * TICKS_PER_SECOND);
        const hits: number[] = [];
        sim.player.x = boss.x;
        sim.player.y = boss.y;
        hooks(sim).stepStomp(boss);
        for (let i = 0; i < interval * 5; i++) {
            sim.tick++;
            sim.player.invulnerable = 0;
            const hp = (sim.player.hp = sim.player.maxHp);
            hooks(sim).stepStomp(boss);
            if (sim.player.hp < hp) {
                hits.push(hp - sim.player.hp);
            }
        }
        expect(hits).toEqual([1, 2, 3, 3, 3].map((n) => Math.round(n * boss.damageScale)));

        // Out of it a moment (its interval, with no first of its own), and it starts over
        sim.player.x = boss.x + 6;
        for (let i = 0; i <= interval; i++) {
            sim.tick++;
            hooks(sim).stepStomp(boss);
        }
        expect(boss.bossState!.stomps).toBe(0);
    });
});

describe("trick or treat", () => {
    test("pumpkins only drop on their maps, and never with the other power-ups", () => {
        expect(getPowerUp(PUMPKIN_ID).weight).toBe(0);
        expect(POWER_UPS.some((p) => p.id === PUMPKIN_ID)).toBe(true);
        const dropped = (mapId: string) => {
            const sim = createSim(mapId);
            for (let i = 0; i < 3000; i++) {
                sim.tick += TICKS_PER_SECOND * 30;
                hooks(sim).rollPumpkin(1040, 1040);
            }
            return sim.pickups.filter((p) => p.powerUp === PUMPKIN_ID).length;
        };
        expect(dropped("halloween")).toBeGreaterThan(0);
        expect(dropped("lumbridge")).toBe(0);
    });

    test("there's a gap between pumpkins", () => {
        const sim = createSim();
        for (let i = 0; i < 5000; i++) {
            hooks(sim).rollPumpkin(1040, 1040);
        }
        expect(sim.pickups.filter((p) => p.powerUp === PUMPKIN_ID)).toHaveLength(1);
    });

    test("every outcome does what it says", () => {
        for (const outcome of PUMPKIN_OUTCOMES) {
            // (a seed whose first rolls don't find a trophy instead)
            const sim = createSim("halloween", 3);
            sim.player.hp = 5;
            // Only this outcome can come up
            const weights = PUMPKIN_OUTCOMES.map((o) => o.weight);
            PUMPKIN_OUTCOMES.forEach((o) => (o.weight = o === outcome ? 1 : 0));
            const coins = sim.coins;
            const speed = sim.stats.moveSpeed;
            const message = hooks(sim).openPumpkin();
            PUMPKIN_OUTCOMES.forEach((o, i) => (o.weight = weights[i]));

            expect(message.startsWith(outcome.trick ? "Trick!" : "Treat!")).toBe(true);
            switch (outcome.does.kind) {
                case "heal":
                    expect(sim.player.hp).toBeGreaterThan(5);
                    break;
                case "coins":
                    expect(sim.coins).toBeGreaterThan(coins);
                    break;
                case "buff":
                    expect(sim.stats.moveSpeed).toBeGreaterThan(speed);
                    break;
                case "enemies":
                    expect(sim.enemies.filter((e) => e.def.id === "ghost").length).toBeGreaterThan(
                        0,
                    );
                    expect(sim.enemies.every((e) => e.bonesOnly)).toBe(true);
                    break;
                case "effect":
                    expect(sim.stats.moveSpeed).toBeLessThan(speed);
                    break;
            }
        }
    });

    test("walking over one opens it and it's gone", () => {
        const sim = createSim();
        sim.dropPickup("powerUp", sim.player.x, sim.player.y, 1, { powerUp: PUMPKIN_ID });
        sim.takeEvents();
        run(sim, 0.1);
        expect(sim.pickups.some((p) => p.powerUp === PUMPKIN_ID)).toBe(false);
        const event = sim.takeEvents().find((e) => e.type === "powerUp");
        expect(event).toBeDefined();
    });
});

describe("Halloween rewards", () => {
    function killNightmare(sim: Sim): void {
        const boss = sim.spawnEnemy(getEnemy("the_nightmare"), "finalBoss", {
            x: 1040,
            y: 1040,
        })!;
        hooks(sim).killEnemy(boss);
    }

    test("The Nightmare's trophies come from her, on her map", () => {
        const kills = (mapId: string) => {
            const sim = createSim(mapId);
            const boss = spawn(sim, "the_nightmare");
            for (let i = 0; i < 1000; i++) {
                hooks(sim).rollBossTrophies(boss);
            }
            return [...sim.trophies].sort();
        };
        expect(kills("halloween")).toEqual(["jar_of_dreams", "little_nightmare"]);
        expect(kills("lumbridge")).toEqual([]);
    });

    test("a pumpkin can hold a trophy", () => {
        const sim = createSim();
        for (let i = 0; i < 3000; i++) {
            hooks(sim).openPumpkin();
            sim.enemies = [];
        }
        const pumpkin = TROPHIES.filter((t) => t.from.kind === "pumpkin").map((t) => t.id);
        expect([...sim.trophies].sort()).toEqual([...pumpkin].sort());
    });

    test("killing her in a run brings in the mace and the staff, and finishes her quest", () => {
        const sim = createSim();
        killNightmare(sim);
        const save = createSave();
        const quests = recordRun(save, sim.getResult());
        expect(save.unlockedItems).toContain("inquisitors_mace");
        expect(save.unlockedItems).toContain("volatile_nightmare_staff");
        expect(quests.map((q) => q.id)).toContain("dream_mentor");
    });

    test("the rewards are locked until then, and show their real cache names", () => {
        expect(getWeapon("inquisitors_mace").unlock?.mapId).toBe("halloween");
        expect(getWeapon("volatile_nightmare_staff").unlock?.kind).toBe("killBoss");
    });

    test("the map's quests are all on it", () => {
        const ids = QUESTS.filter((q) => q.mapId === "halloween").map((q) => q.id);
        expect(ids).toEqual([
            "zogre_flesh_eaters",
            "trick_or_treat",
            "sleeping_giants",
            "dream_mentor",
        ]);
    });

    test("a run's trophies stay in the save, once each", () => {
        const save = createSave();
        const run = {
            mapId: "halloween",
            victory: false,
            seconds: 60,
            level: 1,
            kills: 0,
            coins: 0,
            bossesKilled: [],
            trophies: ["jar_of_dreams"],
        };
        recordRun(save, run);
        recordRun(save, run);
        expect(save.trophies).toEqual(["jar_of_dreams"]);
    });

    test("a version 7 save moves up with an empty log, and unknown trophies are dropped", () => {
        const { trophies: _, ...old } = createSave();
        const migrated = migrateSave({ ...old, version: 7 });
        expect(migrated.trophies).toEqual([]);
        expect(migrated.version).toBe(SAVE_VERSION);
        const kept = migrateSave({ ...old, trophies: ["jar_of_dreams", "nope", "jar_of_dreams"] });
        expect(kept.trophies).toEqual(["jar_of_dreams"]);
    });
});
