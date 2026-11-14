// @vitest-environment jsdom
import { CHARACTERS, getCharacter } from "../content/characters";
import { getEnemy } from "../content/enemies";
import { VARROCK_OPENING } from "../content/fun/varrockOpening";
import { YAMA_WAKES } from "../content/fun/yamaWakes";
import { MAX_INVOCATION_PRESETS } from "../content/invocations";
import { getMap } from "../content/maps";
import { Rarity } from "../content/rarity";
import { emptyStats } from "../content/types";
import { Sim, TICKS_PER_SECOND } from "../core/Sim";
import { encodeCardCaps } from "../core/cardRuns";
import { hasBadNumber, syncHash } from "../core/lockstep";
import {
    LoadedSave,
    SaveData,
    SaveStore,
    buyUpgrade,
    createSave,
    getMetaStats,
} from "../core/save";
import { makeGrid } from "../core/world/testGrid";
import { CinematicCamera, CinematicPlayer } from "./Cinematic";
import { DamageMeter } from "./DamageMeter";
import {
    DisplaySettings,
    FrameRate,
    frameCap,
    getDefaultDisplaySettings,
    loadDisplaySettings,
    saveDisplaySettings,
} from "./DisplaySettings";
import {
    GameClient,
    TICK_MS,
    cleanLoadout,
    getHpShare,
    getObjectiveView,
    getPhaseBarFraction,
    getShownHp,
    loadoutStats,
    partyLoadouts,
} from "./GameClient";
import { padHints } from "./GamePad";
import { GameStore } from "./GameStore";
import { makeLoadout } from "./coop/CoopLobby";
import { CoopRun, DECISION_RESEND_MS } from "./coop/CoopRun";
import { CoopTicker } from "./coop/CoopTicker";
import { UpMessage } from "./coop/protocol";

function createSim(focus?: number): Sim {
    const row = ".".repeat(72);
    return new Sim({
        grid: makeGrid(Array(72).fill(row), 1000, 1000),
        mapId: "lumbridge",
        characterId: "warrior",
        metaStats: emptyStats(),
        seed: 5,
        spawnX: 1036.5,
        spawnY: 1036.5,
        party:
            focus === undefined
                ? undefined
                : ["warrior", "wizard"].map((characterId) => ({
                      name: characterId,
                      characterId,
                      metaStats: emptyStats(),
                  })),
        focus,
    });
}

// The client's run flow on its own: nothing it draws or plays is needed
function createClient(sim: Sim, autoAlch: boolean, autoEquip = false) {
    const save = createSave();
    const store = new GameStore(save);
    const client: GameClient = Object.create(GameClient.prototype);
    Object.assign(client, {
        sim,
        save,
        store,
        paused: false,
        shownDps: 0,
        shownDpsTick: 0,
        damageMeter: new DamageMeter(),
        lastHudUpdate: 0,
        coopPlayerIds: sim.heroes.map((hero) => `hero-${hero.index}`),
        display: {
            ...getDefaultDisplaySettings(),
            menuSpin: false,
            autoAlch,
            autoEquip,
            movePrediction: false,
        },
        sounds: { onEvents() {}, levelUp() {}, playerDied() {}, chest() {} },
        view: { onEvents() {} },
        finishRun() {},
    });
    const sync = () => {
        (client as unknown as { syncOverlay(): void }).syncOverlay();
    };
    return { client, store, sync };
}

describe("the sound's on and off", () => {
    function createMuteClient() {
        const { client, store } = createClient(createSim(), false);
        const settings = { muted: false, volume: 0.6, music: 0.6 };
        Object.assign(client, {
            audio: {
                settings,
                setSettings: (changes: Partial<typeof settings>) =>
                    Object.assign(settings, changes),
            },
        });
        // As M or the orb do (onKeyPress is the constructor's)
        const pressM = () => client.toggleMute(true);
        const toasts = () => store.getSnapshot().toasts.map((toast) => toast.text);
        return { client, store, pressM, toasts };
    }

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("M and the orb say which way it went in a run, only the last way, and nothing on the menus", () => {
        const { client, store, pressM, toasts } = createMuteClient();
        pressM();
        expect(store.getSnapshot().audio.muted).toBe(true);
        expect(toasts()).toEqual(["Sound off (M to turn it on)"]);
        pressM();
        expect(toasts()).toEqual(["Sound on"]);
        pressM();
        expect(toasts()).toEqual(["Sound off (M to turn it on)"]);
        Object.assign(client, { sim: undefined, soundToast: undefined });
        store.set({ toasts: [] });
        pressM();
        expect(store.getSnapshot().audio.muted).toBe(false);
        expect(toasts()).toEqual([]);
    });

    test("the setting shows it itself, and a controller has no M to name", () => {
        const { client, store, toasts } = createMuteClient();
        client.toggleMute();
        expect(store.getSnapshot().audio.muted).toBe(true);
        expect(toasts()).toEqual([]);
        vi.spyOn(padHints, "get").mockReturnValue("xbox");
        client.toggleMute(true);
        client.toggleMute(true);
        expect(toasts()).toEqual(["Sound off"]);
    });
});

describe("movement prediction", () => {
    test("is on unless it's been turned off, and is remembered", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().movePrediction).toBe(true);
        // Settings saved before there was such a thing
        stored.set("rune-survivors-display", JSON.stringify({ menuSpin: false }));
        expect(loadDisplaySettings().movePrediction).toBe(true);
        // Saved while it was a trial, off by default: that off wasn't a choice
        stored.set(
            "rune-survivors-display",
            JSON.stringify({ menuSpin: false, movePrediction: false }),
        );
        expect(loadDisplaySettings().movePrediction).toBe(true);
        saveDisplaySettings({ ...loadDisplaySettings(), movePrediction: false });
        expect(loadDisplaySettings().movePrediction).toBe(false);
        expect(loadDisplaySettings().menuSpin).toBe(false);
        saveDisplaySettings({ ...loadDisplaySettings(), movePrediction: true });
        expect(loadDisplaySettings().movePrediction).toBe(true);
        vi.unstubAllGlobals();
    });

    test("the toggle reaches a run that's going", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const { client } = createClient(createSim(), false);
        const setPrediction = vi.fn();
        Object.assign(client, { coopRun: { setPrediction } });
        client.toggleMovePrediction();
        expect(setPrediction).toHaveBeenLastCalledWith(true);
        client.toggleMovePrediction();
        expect(setPrediction).toHaveBeenLastCalledWith(false);
        vi.unstubAllGlobals();
    });
});

describe("a co-op player's loadout", () => {
    // Their raid chests' trophies, so their chest gives none twice: only those, whatever their
    // game sends
    it("keeps only raid chests' trophies, from a list of strings", () => {
        const loadout = makeLoadout({}, [], {}, undefined, undefined, ["lil_sot", "lil_xarp"]);
        expect([...cleanLoadout(loadout).trophiesFound]).toEqual(["lil_sot", "lil_xarp"]);
        const junk = {
            ...loadout,
            trophies: [
                "lil_bloat",
                7,
                null,
                "ghrazi_rapier",
                "jar_of_dreams",
                "nope",
                {},
            ] as unknown as string[],
        };
        expect([...cleanLoadout(junk).trophiesFound]).toEqual(["lil_bloat", "ghrazi_rapier"]);
        const notAList = { ...loadout, trophies: "lil_bloat" as unknown as string[] };
        expect(cleanLoadout(notAList).trophiesFound.size).toBe(0);
        expect(cleanLoadout(undefined).trophiesFound.size).toBe(0);
    });
});

describe("the co-op flag", () => {
    test("shows unless it's been turned off, and is remembered", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().coopFlag).toBe(true);
        // Settings saved before there was such a thing
        stored.set("rune-survivors-display", JSON.stringify({ menuSpin: false }));
        expect(loadDisplaySettings().coopFlag).toBe(true);
        saveDisplaySettings({ ...loadDisplaySettings(), coopFlag: false });
        expect(loadDisplaySettings().coopFlag).toBe(false);
        // Sharing run stats is on for settings saved before it existed, and remembered off
        expect(loadDisplaySettings().runStats).toBe(true);
        saveDisplaySettings({ ...loadDisplaySettings(), runStats: false });
        expect(loadDisplaySettings().runStats).toBe(false);
        vi.unstubAllGlobals();
    });

    test("the toggle tells the relay", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const { client } = createClient(createSim(), false);
        const setMe = vi.fn();
        Object.assign(client, { coop: { setMe } });
        displayOf(client).coopFlag = true;
        client.toggleCoopFlag();
        expect(setMe).toHaveBeenLastCalledWith({ hideCountry: true });
        client.toggleCoopFlag();
        expect(setMe).toHaveBeenLastCalledWith({ hideCountry: false });
        vi.unstubAllGlobals();
    });
});

describe("power-up timers", () => {
    test("show unless they've been turned off, and are remembered", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().pickupTimers).toBe(true);
        // Settings saved before there was such a thing
        stored.set("rune-survivors-display", JSON.stringify({ menuSpin: false }));
        expect(loadDisplaySettings().pickupTimers).toBe(true);
        saveDisplaySettings({ ...loadDisplaySettings(), pickupTimers: false });
        expect(loadDisplaySettings().pickupTimers).toBe(false);
        vi.unstubAllGlobals();
    });

    // The view draws a timer from the tick and this, so it stops with the run
    test("stand still while a solo run is paused", () => {
        const sim = createSim();
        sim.state = "playing";
        const { client } = createClient(sim, false);
        const getAlpha = () => (client as unknown as { getAlpha(): number }).getAlpha();
        Object.assign(client, { accumulator: TICK_MS / 2 });
        expect(getAlpha()).toBe(0.5);
        Object.assign(client, { paused: true });
        expect(getAlpha()).toBe(1);
    });
});

function displayOf(client: GameClient): DisplaySettings {
    return (client as unknown as { display: DisplaySettings }).display;
}

describe("co-op without render frames", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal(
            "URL",
            class extends URL {
                static createObjectURL() {
                    return "blob:background-test";
                }
                static revokeObjectURL() {}
            },
        );
        vi.stubGlobal(
            "Worker",
            class {
                onmessage?: () => void;
                private timer = setInterval(() => this.onmessage?.(), TICK_MS);
                terminate() {
                    clearInterval(this.timer);
                }
            },
        );
    });
    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    test.each([false, true])(
        "keeps the guest in step for 30 seconds without drawing (host down: %s)",
        async (down) => {
            // No visibilitychange occurs: this is the hole in the former loop.
            vi.spyOn(document, "hidden", "get").mockReturnValue(false);
            const hostSim = createSim(0);
            const guestSim = createSim(1);
            for (const sim of [hostSim, guestSim]) sim.heroes[0].down = down;
            const heroes = new Map([
                ["host", 0],
                ["guest", 1],
            ]);
            let host: CoopRun;
            const guest = new CoopRun(
                guestSim,
                false,
                {
                    sendUp: (m) => host.receiveUp("guest", m),
                    sendDown() {},
                },
                heroes,
                "host",
            );
            let lastFrameAt = performance.now();
            let largestGap = 0;
            host = new CoopRun(
                hostSim,
                true,
                {
                    sendUp() {},
                    sendDown(m) {
                        const now = performance.now();
                        largestGap = Math.max(largestGap, now - lastFrameAt);
                        lastFrameAt = now;
                        guest.receiveDown(m);
                        while (guest.canStep()) {
                            guest.stepFrame();
                            guestSim.takeEvents();
                        }
                    },
                },
                heroes,
                "host",
            );
            host.receiveUp("guest", { loaded: true });
            const { client } = createClient(hostSim, false);
            Object.assign(client, {
                coopRun: host,
                coopStopped: false,
                accumulator: 0,
                coop: { keepAlive() {} },
                input: { getMoveVector: () => ({ x: 0, y: 0 }) },
                handleEvents() {},
                syncOverlay() {},
                getDecisionKey: () => "playing",
                resendAutoChest() {},
            });
            const ticking = client as unknown as {
                startCoopTicker(): void;
                stopCoopTicker(): void;
                coopTicker: CoopTicker;
            };
            ticking.startCoopTicker();
            for (let frame = 0; frame < 50; frame++) {
                await vi.advanceTimersByTimeAsync(TICK_MS);
                ticking.coopTicker.render();
            }
            const before = guest.frame;
            await vi.advanceTimersByTimeAsync(30_000);
            expect(guest.frame - before).toBe(1500);
            expect(largestGap).toBeLessThanOrEqual(60);
            expect(guest.desynced).toBe(false);
            expect(syncHash(hostSim)).toBe(syncHash(guestSim));
            ticking.coopTicker.render();
            expect(host.frame).toBe(1550);
            await vi.advanceTimersByTimeAsync(TICK_MS);
            ticking.coopTicker.render();
            expect(host.frame).toBe(1551);
            ticking.stopCoopTicker();
            await vi.advanceTimersByTimeAsync(1000);
            expect(host.frame).toBe(1551);
            expect(vi.getTimerCount()).toBe(0);
        },
    );
});

describe("the HUD", () => {
    const updateHud = (client: GameClient, force = false) =>
        (client as unknown as { updateHud(force: boolean): void }).updateHud.call(client, force);

    test.each([undefined, 0, 1])(
        "shows only the focused hero's unspent ring of life (focus %s)",
        (focus) => {
            const sim = createSim(focus);
            const { client, store } = createClient(sim, false);
            for (const hero of sim.heroes) {
                hero.revivesLeft = hero.index === sim.focus ? 0 : 1;
            }
            updateHud(client, true);
            expect(store.getNumbers()!.buffs).toEqual([]);
            sim.revivesLeft = 1;
            updateHud(client, true);
            const buffs = store.getNumbers()!.buffs;
            expect(buffs).toEqual([
                {
                    id: "ring_of_life",
                    name: "Ring of life",
                    description: "Revives you once if you fall.",
                    objId: 2570,
                    harmful: false,
                },
            ]);
            sim.tick += 50;
            updateHud(client);
            expect(store.getNumbers()!.buffs).toBe(buffs);
            sim.player.invulnerable = 0;
            sim["damagePlayer"](99999, "goblin", false);
            expect(sim.revivesLeft).toBe(0);
            updateHud(client, true);
            expect(store.getNumbers()!.buffs).toEqual([]);
        },
    );

    // The Pyromancer's own revive is theirs, not a ring of life, and goes first
    test.each([0, 1])("shows the Pyromancer's phoenix apart from %s ring of life", (rings) => {
        const metaStats = emptyStats();
        metaStats.revival = rings;
        const party = ["warrior", "pyromancer"].map((characterId) => ({
            name: characterId,
            characterId,
            metaStats,
        }));
        const row = ".".repeat(72);
        const sim = new Sim({
            grid: makeGrid(Array(72).fill(row), 1000, 1000),
            mapId: "lumbridge",
            characterId: "pyromancer",
            metaStats,
            seed: 5,
            spawnX: 1036.5,
            spawnY: 1036.5,
            party,
            focus: 1,
        });
        const { client, store } = createClient(sim, false);
        const handleEvents = (
            client as unknown as { handleEvents(sim: Sim, events: unknown[]): void }
        ).handleEvents;
        const shown = () => store.getNumbers()!.buffs.map((buff) => buff.name);
        const toasts = () => store.getSnapshot().toasts.map((toast) => toast.text);
        const die = (hero: number) => {
            sim["as"](hero, () => {
                sim.player.invulnerable = 0;
                sim["damagePlayer"](99999, "goblin", false);
            });
            handleEvents.call(client, sim, sim.takeEvents());
            updateHud(client, true);
        };
        updateHud(client, true);
        expect(shown()).toEqual(rings ? ["Phoenix", "Ring of life"] : ["Phoenix"]);
        die(1);
        expect(shown()).toEqual(rings ? ["Ring of life"] : []);
        if (rings) {
            die(1);
            expect(shown()).toEqual([]);
        }
        // A teammate's toast names theirs, and the warrior's ring isn't the HUD's
        sim.heroes[0].revivesLeft = 1;
        die(0);
        expect(shown()).toEqual([]);
        expect(toasts()).toEqual([
            "Your phoenix saves you!",
            ...(rings ? ["Your ring of life saves you!"] : []),
            "warrior's ring of life saves them!",
        ]);
    });

    test("every adventurer with a revive of their own has a look for it", () => {
        for (const character of CHARACTERS) {
            if (character.bonus.revival) {
                expect(character.reviveLook, character.id).toBeDefined();
            }
        }
    });

    test.each([
        [0, "boss"],
        [1, "boss"],
        [0, "finalBoss"],
        [1, "finalBoss"],
    ] as const)("co-op hero %i sees the nearest living %s", (focus, type) => {
        const sim = createSim(focus);
        const legacyBoss = vi.spyOn(sim, "shownBoss", "get");
        const { client, store } = createClient(sim, false);
        sim.heroes[0].player.x = 1020.5;
        sim.heroes[1].player.x = 1050.5;
        const bosses = [1022.5, 1048.5].map(
            (x) => sim.spawnEnemy(getEnemy("wise_old_man"), type, { x, y: 1036.5 })!,
        );

        bosses[0].hp = bosses[0].maxHp / 4;
        bosses[1].hp = (bosses[1].maxHp * 3) / 4;
        const fraction = (index: number) => bosses[index].hp / bosses[index].maxHp;
        updateHud(client, true);
        expect(store.getNumbers()!.boss?.fraction).toBe(fraction(focus));

        const other = 1 - focus;
        sim.player.x = bosses[other].x;
        sim.player.y = bosses[other].y;
        // A regular enemy even closer must not take the boss bar.
        sim.spawnEnemy(getEnemy("goblin"), "normal", { x: sim.player.x, y: sim.player.y });
        updateHud(client);
        expect(store.getNumbers()!.boss?.fraction).toBe(fraction(other));

        // Distance includes both axes, and is reconsidered as bosses move.
        bosses[other].y += 40;
        updateHud(client);
        expect(store.getNumbers()!.boss?.fraction).toBe(fraction(focus));
        bosses[other].y = sim.player.y;
        bosses[other].dead = true;
        bosses[other].hp = 0;
        updateHud(client);
        expect(store.getNumbers()!.boss?.fraction).toBe(fraction(focus));

        bosses[focus].dead = true;
        bosses[focus].hp = 0;
        updateHud(client);
        if (type === "finalBoss") {
            expect(store.getNumbers()!.boss).toMatchObject({
                name: bosses[focus].def.name,
                fraction: 0,
                enraged: false,
            });
        } else {
            expect(store.getNumbers()!.boss).toBeUndefined();
        }
        expect(legacyBoss).not.toHaveBeenCalled();
        legacyBoss.mockRestore();
    });

    test("co-op chooses the closest boss even when a final boss is farther away", () => {
        const sim = createSim(1);
        const { client, store } = createClient(sim, false);
        const finalBoss = sim.spawnEnemy(getEnemy("wise_old_man"), "finalBoss", {
            x: sim.player.x + 12,
            y: sim.player.y,
        })!;
        const boss = sim.spawnEnemy(getEnemy("count_draynor"), "boss", {
            x: sim.player.x + 2,
            y: sim.player.y,
        })!;
        updateHud(client, true);
        expect(store.getNumbers()!.boss?.name).toBe(boss.def.name);
        expect(sim.shownBoss).toBe(finalBoss);
    });

    test("co-op keeps the final boss's empty bar to the victory screen, over a living boss", () => {
        const sim = createSim(0);
        const { client, store } = createClient(sim, false);
        const finalBoss = sim.spawnEnemy(getEnemy("wise_old_man"), "finalBoss", {
            x: sim.player.x + 12,
            y: sim.player.y,
        })!;
        const boss = sim.spawnEnemy(getEnemy("count_draynor"), "boss", {
            x: sim.player.x + 2,
            y: sim.player.y,
        })!;
        updateHud(client, true);
        expect(store.getNumbers()!.boss?.name).toBe(boss.def.name);
        sim.damageEnemy(finalBoss, 1e9, 0, sim.player.x, sim.player.y);
        expect(sim.state).toBe("victory");
        expect(boss.dead).toBe(false);
        updateHud(client, true);
        expect(store.getNumbers()!.boss).toMatchObject({ name: finalBoss.def.name, fraction: 0 });
    });

    test("co-op's bar stays on its boss until another is clearly nearer", () => {
        const sim = createSim(0);
        const { client, store } = createClient(sim, false);
        const x = sim.player.x;
        const [left, right] = [-3, 3].map(
            (dx) =>
                sim.spawnEnemy(getEnemy("wise_old_man"), "boss", { x: x + dx, y: sim.player.y })!,
        );
        left.hp = left.maxHp / 4;
        right.hp = (right.maxHp * 3) / 4;
        const shown = () => store.getNumbers()!.boss?.fraction;
        sim.player.x = x - 0.1;
        updateHud(client, true);
        expect(shown()).toBe(left.hp / left.maxHp);
        // A tile nearer the other isn't enough
        sim.player.x = x + 0.5;
        updateHud(client);
        expect(shown()).toBe(left.hp / left.maxHp);
        sim.player.x = x + 1.5;
        updateHud(client);
        expect(shown()).toBe(right.hp / right.maxHp);
        // Nor does it go straight back
        sim.player.x = x - 0.5;
        updateHud(client);
        expect(shown()).toBe(right.hp / right.maxHp);
    });

    test("solo keeps the final boss's priority over a nearer boss", () => {
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        const finalBoss = sim.spawnEnemy(getEnemy("wise_old_man"), "finalBoss", {
            x: sim.player.x + 12,
            y: sim.player.y,
        })!;
        sim.spawnEnemy(getEnemy("count_draynor"), "boss", {
            x: sim.player.x + 2,
            y: sim.player.y,
        });
        updateHud(client, true);
        expect(store.getNumbers()!.boss?.name).toBe(finalBoss.def.name);
    });

    test("co-op without bosses has no boss bar", () => {
        const sim = createSim(1);
        const legacyBoss = vi.spyOn(sim, "shownBoss", "get");
        const { client, store } = createClient(sim, false);
        updateHud(client, true);
        expect(store.getNumbers()!.boss).toBeUndefined();
        expect(legacyBoss).not.toHaveBeenCalled();
        legacyBoss.mockRestore();
    });

    test("keeps what hasn't changed the same object, so its parts don't draw again", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        updateHud(client, true);
        const hud = store.getSnapshot().hud!;
        const numbers = store.getNumbers()!;
        sim.tick += 50;
        updateHud(client);
        // A second on: the clock's changed, nothing the hero has
        expect(store.getSnapshot().hud).toBe(hud);
        expect(store.getNumbers()!.seconds).toBe(numbers.seconds + 1);
        expect(store.getNumbers()!.quests).toBe(numbers.quests);
        expect(store.getNumbers()!.buffs).toBe(numbers.buffs);
        // A new weapon: the weapons change, the passives and gear don't
        sim.addWeapon("fire_spells");
        updateHud(client);
        const after = store.getSnapshot().hud!;
        expect(after).not.toBe(hud);
        expect(after.weapons).not.toBe(hud.weapons);
        expect(after.weapons.map((w) => w.id)).toContain("fire_spells");
        expect(after.passives).toBe(hud.passives);
        expect(after.gear).toBe(hud.gear);
        vi.unstubAllGlobals();
    });

    test("with nothing changed, tells nothing that it has", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        updateHud(client, true);
        const ui = vi.fn();
        const numbers = vi.fn();
        store.subscribe(ui);
        store.subscribeNumbers(numbers);
        // Within the same second
        sim.tick += 10;
        updateHud(client);
        updateHud(client);
        expect(ui).not.toHaveBeenCalled();
        expect(numbers).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    test("drops co-op's countdown when a run ends early while the party's choosing", () => {
        const sim = createSim(0);
        const { client, store } = createClient(sim, false);
        Object.assign(client, { coopRun: { decisionSeconds: 12 }, coopStopped: false });
        updateHud(client, true);
        expect(store.getNumbers()!.decisionSeconds).toBe(12);
        // The host left mid-choice: the results show, and the run stays as it stopped
        (client as unknown as { endCoopRunEarly(why: string): void }).endCoopRunEarly(
            "The host left, so the run ended.",
        );
        expect(store.getSnapshot().overlay).toBe("dead");
        expect(store.getNumbers()!.decisionSeconds).toBeUndefined();
        updateHud(client);
        expect(store.getNumbers()!.decisionSeconds).toBeUndefined();
    });
});

describe("the frame rate setting", () => {
    test("comes to a cap: auto is 60 on a touch screen and none on a desktop", () => {
        expect(frameCap("auto", true, false)).toBe(60);
        expect(frameCap("auto", false, false)).toBe(0);
        expect(frameCap("30", false, false)).toBe(30);
        expect(frameCap("60", false, false)).toBe(60);
        expect(frameCap("60", true, false)).toBe(60);
        expect(frameCap("unlimited", true, false)).toBe(0);
        expect(frameCap("unlimited", false, false)).toBe(0);
    });

    test("behind a solo run's menus it's 30 at most", () => {
        expect(frameCap("auto", true, true)).toBe(30);
        expect(frameCap("auto", false, true)).toBe(30);
        expect(frameCap("unlimited", false, true)).toBe(30);
        expect(frameCap("60", false, true)).toBe(30);
        expect(frameCap("30", false, true)).toBe(30);
    });

    test("is auto for settings saved before it, or with one that isn't a choice", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().frameRate).toBe("auto");
        stored.set("rune-survivors-display", JSON.stringify({ menuSpin: false, autoAlch: true }));
        expect(loadDisplaySettings()).toMatchObject({ frameRate: "auto", autoAlch: true });
        stored.set("rune-survivors-display", JSON.stringify({ frameRate: 45 }));
        expect(loadDisplaySettings().frameRate).toBe("auto");
        saveDisplaySettings({ ...loadDisplaySettings(), frameRate: "30" });
        expect(loadDisplaySettings().frameRate).toBe("30");
        vi.unstubAllGlobals();
    });

    test("changed, takes hold from the next frame", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        const renderer = { fpsLimit: 999 };
        Object.assign(client, { renderer });
        // A solo run that's being played. The cap's set first thing in a frame, and
        // nothing past it matters here (the client has no input or camera).
        const capFor = (rate: FrameRate) => {
            client.setFrameRate(rate);
            expect(() => client.update(16, {} as never)).toThrow();
            return renderer.fpsLimit;
        };
        expect(capFor("60")).toBe(60);
        expect(store.getSnapshot().display.frameRate).toBe("60");
        expect(capFor("30")).toBe(30);
        vi.unstubAllGlobals();
    });
});

describe("the frame cap", () => {
    const stopped = (client: GameClient) =>
        (client as unknown as { isStoppedBehindMenu(): boolean }).isStoppedBehindMenu.call(client);

    test("drops behind a solo run's menus, and not in co-op, whose run carries on", () => {
        const sim = createSim();
        const { client } = createClient(sim, false);
        expect(stopped(client)).toBe(false);
        Object.assign(client, { paused: true });
        expect(stopped(client)).toBe(true);
        Object.assign(client, { coopRun: {} });
        expect(stopped(client)).toBe(false);
        // The title screen
        Object.assign(client, { sim: undefined, coopRun: undefined });
        expect(stopped(client)).toBe(true);
    });
});

describe("the gear panel", () => {
    test("is off unless it's been turned on, and is remembered", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().gearPanel).toBe(false);
        // Settings saved before there was such a thing
        stored.set("rune-survivors-display", JSON.stringify({ damagePanel: true }));
        expect(loadDisplaySettings().gearPanel).toBe(false);
        const { client } = createClient(createSim(), false);
        client.toggleGearPanel();
        expect(loadDisplaySettings().gearPanel).toBe(true);
        client.toggleGearPanel();
        expect(loadDisplaySettings().gearPanel).toBe(false);
        vi.unstubAllGlobals();
    });
});

describe("the damage panel", () => {
    test("is shut unless it's been opened, and is remembered", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().damagePanel).toBe(false);
        // Settings saved before there was such a thing
        stored.set("rune-survivors-display", JSON.stringify({ questTracker: false }));
        expect(loadDisplaySettings().damagePanel).toBe(false);
        const { client } = createClient(createSim(), false);
        client.toggleDamagePanel();
        expect(loadDisplaySettings().damagePanel).toBe(true);
        client.toggleDamagePanel();
        expect(loadDisplaySettings().damagePanel).toBe(false);
        vi.unstubAllGlobals();
    });

    test("has each weapon's damage on the HUD", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        const updateHud = (client as unknown as { updateHud(force: boolean): void }).updateHud;
        const source = `weapon:${sim.weapons[0].def.id}` as const;
        sim.damageBySource[source] = 0;
        updateHud.call(client, true);
        for (let i = 0; i < 4 * 50; i++) {
            sim.tick++;
        }
        sim.damageBySource[source] = 400;
        updateHud.call(client, true);
        const numbers = store.getNumbers()!;
        expect(numbers.weaponDamage[sim.weapons[0].def.id]).toEqual({ dps: 100, damage: 400 });
        expect(numbers.otherDps).toBe(0);
        vi.unstubAllGlobals();
    });

    test("puts a weapon that's gone (evolved) under none, not Other", () => {
        vi.stubGlobal("window", { localStorage: { setItem() {} } });
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        const updateHud = (client as unknown as { updateHud(force: boolean): void }).updateHud;
        updateHud.call(client, true);
        sim.tick += 4 * 50;
        // An old weapon's damage, and a ring of recoil's
        sim.damageBySource["weapon:evolved_away"] = 600;
        sim.damageBySource.recoil = 40;
        updateHud.call(client, true);
        expect(store.getNumbers()!.otherDps).toBe(10);
        vi.unstubAllGlobals();
    });

    // Tab's the panel's (GameInput.takesKey, and the key press) only then
    test("takes Tab only while the run's being played", () => {
        const sim = createSim();
        const { client, store } = createClient(sim, false);
        const isPlaying = () =>
            (client as unknown as { isPlaying(): boolean }).isPlaying.call(client);
        store.set({ overlay: "none" });
        expect(isPlaying()).toBe(true);
        // A level up, a casket, the pause menu: Tab moves between their buttons
        for (const overlay of ["levelUp", "chest", "paused"] as const) {
            store.set({ overlay });
            expect(isPlaying()).toBe(false);
        }
        // Nor once the run's over
        store.set({ overlay: "none" });
        // How a run ends is the sim's business; only that it has matters here
        Object.defineProperty(sim, "runOver", { value: true });
        expect(isPlaying()).toBe(false);
    });
});

describe("auto equip", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    function offer(sim: Sim, itemId: string, upgrades = 0): void {
        sim.openCasket("easy");
        Object.assign(sim.chests[sim.chests.length - 1], { itemId, upgrades });
    }

    test("defaults off for new and existing settings and remembers the toggle", () => {
        // A stand-in, as jsdom's own storage isn't there on every Node
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().autoEquip).toBe(false);
        const key = "rune-survivors-display";
        for (const data of [{ autoAlch: true }, { autoEquip: "true" }]) {
            stored.set(key, JSON.stringify(data));
            expect(loadDisplaySettings().autoEquip).toBe(false);
        }
        const { client, store } = createClient(createSim(), false);
        expect(store.getSnapshot().display.autoEquip).toBe(false);
        client.toggleAutoEquip();
        expect(loadDisplaySettings().autoEquip).toBe(true);
        expect(store.getSnapshot().display.autoEquip).toBe(true);
        client.toggleAutoEquip();
        expect(loadDisplaySettings().autoEquip).toBe(false);
    });

    test("off, even an empty slot still asks", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, false);
        offer(sim, "rune_boots");
        sync();
        expect(sim.gear.feet).toBeUndefined();
        expect(store.getSnapshot().overlay).toBe("chest");
    });

    test("matches clicking Equip, including upgrades, replaced gear's coins and stats", () => {
        const clicked = createSim();
        const auto = createSim();
        const { store, sync } = createClient(auto, false, true);
        for (const sim of [clicked, auto]) {
            sim.equip("rune_boots", 1);
            sim.takeEvents();
            offer(sim, "dragon_boots", 2);
        }
        const coins = auto.alchValue("rune_boots", 1);
        clicked.resolveChest("take");
        sync();
        expect(auto.gear).toEqual(clicked.gear);
        expect(auto.gearUpgrades).toEqual(clicked.gearUpgrades);
        expect(auto.stats).toEqual(clicked.stats);
        expect(auto.coins).toBe(clicked.coins);
        expect(auto.getResult()).toEqual(clicked.getResult());
        expect(store.getSnapshot().overlay).toBe("none");
        expect(store.getSnapshot().chest).toBeUndefined();
        expect(store.getSnapshot().toasts.map((t) => t.text)).toEqual([
            `Equipped Dragon boots; high alched Rune boots for ${coins.toLocaleString()} coins`,
        ]);
    });

    test.each([
        ["rune_boots", "rune_boots"],
        ["climbing_boots", "dragon_boots"],
        ["dragon_boots", "rune_boots"],
        ["void_melee_helm", "slayer_helmet"],
        ["crystal_helm", "corrupted_crystal_helm"],
        ["rune_boots", "shark"],
    ])("keeps the prompt for %s to %s", (wornId, offeredId) => {
        const sim = createSim();
        sim.equip(wornId);
        const gear = { ...sim.gear };
        const { client, store, sync } = createClient(sim, false, true);
        offer(sim, offeredId);
        sync();
        expect(sim.gear).toEqual(gear);
        expect(store.getSnapshot().overlay).toBe("chest");
        expect(store.getSnapshot().chest?.item.id).toBe(offeredId);
        client.resolveChest("alch");
        expect(sim.gear).toEqual(gear);
        expect(sim.chests).toHaveLength(0);
    });

    test("processes queued upgrades against newly equipped gear, stopping at a trade-off", () => {
        const sim = createSim();
        const { client, store, sync } = createClient(sim, false, true);
        for (const id of ["rune_boots", "dragon_boots", "climbing_boots", "rune_full_helm"]) {
            offer(sim, id);
        }
        sync();
        expect(sim.gear.feet).toBe("dragon_boots");
        expect(sim.chests).toHaveLength(2);
        expect(store.getSnapshot().chest?.item.id).toBe("climbing_boots");
        client.resolveChest("alch");
        expect(sim.gear.head).toBe("rune_full_helm");
        expect(sim.chests).toHaveLength(0);
        expect(store.getSnapshot().overlay).toBe("none");
    });

    test("auto alch still takes priority when both are on", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, true, true);
        offer(sim, "rune_boots");
        const coins = sim.coins;
        const worth = sim.alchValue("rune_boots", 0);
        sync();
        expect(sim.gear.feet).toBeUndefined();
        expect(sim.coins).toBe(coins + worth);
        expect(store.getSnapshot().overlay).toBe("none");
    });

    test("waits for a level up before equipping and preserves a pending level up afterwards", () => {
        const sim = createSim();
        const { client, store, sync } = createClient(sim, false, true);
        sim.xp = sim.xpForNextLevel;
        sim.step(0, 0);
        offer(sim, "rune_boots");
        sync();
        expect(store.getSnapshot().overlay).toBe("levelUp");
        expect(sim.gear.feet).toBeUndefined();
        client.choose(0);
        expect(sim.gear.feet).toBe("rune_boots");
        expect(sim.chests).toHaveLength(0);
        offer(sim, "rune_full_helm");
        sim.xp = sim.xpForNextLevel;
        sync();
        expect(sim.gear.head).toBe("rune_full_helm");
        expect(store.getSnapshot().overlay).toBe("levelUp");
    });

    test("does not take an offer after the run ends", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, false, true);
        offer(sim, "rune_boots");
        sim.state = "dead";
        sync();
        expect(sim.gear.feet).toBeUndefined();
        expect(sim.chests).toHaveLength(1);
        expect(store.getSnapshot().overlay).toBe("dead");
    });

    test("checks a rerolled casket before showing its new item", () => {
        const sim = createSim();
        const { client, store, sync } = createClient(sim, false, true);
        offer(sim, "shark");
        sync();
        expect(store.getSnapshot().overlay).toBe("chest");
        const sounds = (client as unknown as { sounds: { chest(): void } }).sounds;
        const chestSound = vi.spyOn(sounds, "chest");
        vi.spyOn(sim, "reroll").mockImplementation(() => {
            sim.chests[0].itemId = "rune_boots";
            return true;
        });
        expect(client.reroll()).toBe(true);
        expect(sim.gear.feet).toBe("rune_boots");
        expect(store.getSnapshot().overlay).toBe("none");
        // No casket bursts open again for an item that's taken at once
        expect(chestSound).not.toHaveBeenCalled();
    });

    test("says nothing more when the player clicks Equip on a casket that asked", () => {
        const sim = createSim();
        sim.equip("rune_boots");
        const { client, store, sync } = createClient(sim, false, true);
        offer(sim, "climbing_boots");
        sync();
        expect(store.getSnapshot().overlay).toBe("chest");
        client.resolveChest("take");
        expect(sim.gear.feet).toBe("climbing_boots");
        expect(store.getSnapshot().toasts).toEqual([]);
    });

    // A host and a guest, the guest (hero 1) with a rune boots casket and then
    // a climbing boots one, and the host wearing dragon boots
    function coopPair(now: () => number = Date.now) {
        const host = createSim(0);
        const guest = createSim(1);
        for (const sim of [host, guest]) {
            sim.as(0, () => sim.equip("dragon_boots"));
            sim.as(1, () => {
                offer(sim, "rune_boots");
                offer(sim, "climbing_boots");
            });
        }
        const messages: UpMessage[] = [];
        const heroes = new Map([
            ["host", 0],
            ["guest", 1],
        ]);
        const guestRun = new CoopRun(
            guest,
            false,
            { sendUp: (message) => messages.push(message), sendDown() {} },
            heroes,
            "host",
            now,
        );
        const hostRun = new CoopRun(
            host,
            true,
            { sendUp() {}, sendDown: (message) => guestRun.receiveDown(message) },
            heroes,
            "host",
        );
        hostRun.receiveUp("guest", { loaded: true });
        const { client, store, sync } = createClient(guest, false, true);
        Object.assign(client, { coopRun: guestRun });
        return { host, guest, hostRun, guestRun, messages, client, store, sync };
    }

    test("a co-op guest's lost answer goes again, with the casket hidden and the menu working", () => {
        let time = 1000;
        const { host, guest, hostRun, guestRun, messages, client, store, sync } = coopPair(
            () => time,
        );
        const resend = () =>
            (
                client as unknown as { resendAutoChest(sim: Sim, run: CoopRun): void }
            ).resendAutoChest(guest, guestRun);
        sync();
        const take = { action: { kind: "chest", action: "take" } };
        expect(messages).toEqual([take]);
        // Lost on the way: nothing goes again until it's had time to arrive
        resend();
        time += DECISION_RESEND_MS - 1;
        resend();
        expect(messages).toHaveLength(1);
        client.pause();
        expect(store.getSnapshot().overlay).toBe("paused");
        expect(store.getSnapshot().chest).toBeUndefined();
        client.resume();
        expect(store.getSnapshot().overlay).toBe("none");
        time += 1;
        resend();
        expect(messages).toEqual([take, take]);
        resend();
        expect(messages).toHaveLength(2);
        hostRun.receiveUp("guest", messages[1]);
        hostRun.stepFrame();
        hostRun.flush(true);
        guestRun.stepFrame();
        (client as unknown as { handleEvents(sim: Sim, events: unknown[]): void }).handleEvents(
            guest,
            guest.takeEvents(),
        );
        sync();
        expect(guest.gear.feet).toBe("rune_boots");
        expect(syncHash(guest)).toBe(syncHash(host));
        expect(store.getSnapshot().toasts.map((t) => t.text)).toEqual(["Equipped Rune boots"]);
        expect(store.getSnapshot().chest?.item.id).toBe("climbing_boots");
        expect(store.getSnapshot().overlay).toBe("chest");
        // The casket that asks isn't answered for the player
        resend();
        expect(messages).toHaveLength(2);
    });

    test("a co-op guest sends one local choice and waits for the host to apply it", () => {
        const { host, guest, hostRun, guestRun, messages, store, sync } = coopPair();
        store.set({ overlay: "chest" });
        sync();
        sync();
        expect(messages).toEqual([{ action: { kind: "chest", action: "take" } }]);
        expect(guest.gear.feet).toBeUndefined();
        expect(store.getSnapshot().overlay).toBe("none");
        hostRun.receiveUp("guest", messages[0]);
        hostRun.stepFrame();
        hostRun.flush(true);
        guestRun.stepFrame();
        sync();
        expect(guest.gear.feet).toBe("rune_boots");
        expect(guest.heroes[0].gear.feet).toBe("dragon_boots");
        expect(syncHash(guest)).toBe(syncHash(host));
        expect(messages).toHaveLength(1);
        expect(store.getSnapshot().chest?.item.id).toBe("climbing_boots");
        expect(store.getSnapshot().overlay).toBe("chest");
    });
});

describe("a co-op run that breaks", () => {
    // The client mid-run with a stand-in for the run, as updateCoop drives it
    function coopClient(run: Partial<Record<string, unknown>>) {
        const sim = createSim(0);
        const { client, store } = createClient(sim, false);
        const coop = { keepAlive: vi.fn(), leave: vi.fn() };
        const finishRun = vi.fn();
        const flush = vi.fn();
        const stepFrame = vi.fn(() => []);
        const fake = {
            isHost: true,
            behind: 0,
            stuck: false,
            cantCatchUp: false,
            desynced: false,
            canStep: () => true,
            setMove() {},
            flush,
            stepFrame,
            ...run,
        };
        Object.assign(client, {
            coop,
            coopRun: fake,
            coopStopped: false,
            accumulator: 0,
            input: { getMoveVector: (into: { x: number; y: number }) => into },
            move: { x: 0, y: 0 },
            finishRun,
            updateHud() {},
        });
        const update = (ms = TICK_MS * 2) =>
            (
                client as unknown as {
                    updateCoop(ms: number, sim: Sim, run: unknown): void;
                }
            ).updateCoop(ms, sim, fake);
        return { client, store, coop, finishRun, flush, stepFrame, update };
    }

    it("sends the host's frames even when something after a step throws", () => {
        const { client, flush, stepFrame, update } = coopClient({});
        Object.assign(client, {
            handleEvents() {
                throw new Error("a bug in what's drawn");
            },
        });
        expect(update).toThrow("a bug in what's drawn");
        expect(stepFrame).toHaveBeenCalledOnce();
        expect(flush).toHaveBeenCalledOnce();
    });

    it("keeps no time back to make up when something after a step throws", () => {
        const { client, update } = coopClient({});
        Object.assign(client, {
            handleEvents() {
                throw new Error("a bug in what's drawn");
            },
        });
        // A slow frame's worth of steps due, and only one taken
        expect(() => update(TICK_MS * 8)).toThrow("a bug in what's drawn");
        expect((client as unknown as { accumulator: number }).accumulator).toBeLessThanOrEqual(
            TICK_MS,
        );
    });

    it("steps nothing once checking the room's connection has lost it", () => {
        const { client, coop, stepFrame, flush, update } = coopClient({});
        // The connection found dead and the room given up on, which ends the run
        coop.keepAlive.mockImplementation(() =>
            Object.assign(client, { coopRun: undefined, coopStopped: true }),
        );
        update();
        expect(stepFrame).not.toHaveBeenCalled();
        expect(flush).not.toHaveBeenCalled();
    });

    it("checks the room's connection on every update", () => {
        const { coop, update } = coopClient({ canStep: () => false });
        update();
        update();
        expect(coop.keepAlive).toHaveBeenCalledTimes(2);
    });

    it("ends a run whose frame won't step, and leaves the room, which ends it for everyone", () => {
        const { client, coop, finishRun, stepFrame, update } = coopClient({ stuck: true });
        update();
        expect(coop.leave).toHaveBeenCalledOnce();
        expect(finishRun).toHaveBeenCalledWith("Something went wrong in the run, so it ended.");
        expect(stepFrame).not.toHaveBeenCalled();
        // And it's over: nothing more's stepped, and it doesn't leave again
        update();
        expect(coop.leave).toHaveBeenCalledOnce();
        expect((client as unknown as { coopStopped: boolean }).coopStopped).toBe(true);
    });

    it("tells a guest that can't catch up why, on its results or, if they're up, a toast", () => {
        const behind = coopClient({ isHost: false, cantCatchUp: true });
        behind.update();
        expect(behind.coop.leave).toHaveBeenCalledOnce();
        expect(behind.finishRun).toHaveBeenCalledWith(
            "Your connection dropped for too long to catch up, so your run ended.",
        );

        // Their hero's run was over already, so its results are showing
        const spectating = coopClient({ isHost: false, cantCatchUp: true });
        Object.assign(spectating.client, { runRecorded: true });
        const toast = vi.spyOn(spectating.store, "toast");
        spectating.update();
        expect(spectating.coop.leave).toHaveBeenCalledOnce();
        expect(toast).toHaveBeenCalledWith(
            "Your connection dropped for too long to catch up, so your run ended.",
            6000,
        );
    });
});

describe("auto alch", () => {
    test("is off unless it's been turned on, and is remembered", () => {
        const stored = new Map<string, string>();
        vi.stubGlobal("window", {
            matchMedia: () => ({ matches: false }),
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        expect(loadDisplaySettings().autoAlch).toBe(false);
        // Settings saved before there was such a thing
        const key = "rune-survivors-display";
        stored.set(key, JSON.stringify({ menuSpin: false }));
        expect(loadDisplaySettings().autoAlch).toBe(false);
        const settings: DisplaySettings = { ...loadDisplaySettings(), autoAlch: true };
        saveDisplaySettings(settings);
        expect(loadDisplaySettings().autoAlch).toBe(true);
        vi.unstubAllGlobals();
    });

    test("turned off, the casket screen comes up as usual", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, false);
        sim.openCasket("easy");
        sync();
        expect(store.getSnapshot().overlay).toBe("chest");
        expect(store.getSnapshot().chest).toBeDefined();
        expect(sim.state).toBe("chest");
    });

    test("does just what clicking High alch does, without the casket screen", () => {
        const clicked = createSim();
        const auto = createSim();
        const { store, sync } = createClient(auto, true);
        // A piece of a started set: alching another stops the set, too
        for (const sim of [clicked, auto]) {
            sim.equip("torva_full_helm");
            sim.takeEvents();
        }
        for (const tier of ["easy", "hard", "master"] as const) {
            clicked.openCasket(tier);
            clicked.chests[0].itemId = "torva_platebody";
            clicked.resolveChest("alch");
            auto.openCasket(tier);
            auto.chests[0].itemId = "torva_platebody";
            sync();
            expect(store.getSnapshot().overlay).toBe("none");
            expect(store.getSnapshot().chest).toBeUndefined();
            expect(auto.state).toBe("playing");
        }
        expect(auto.coins).toBe(clicked.coins);
        expect(auto.coins).toBeGreaterThan(0);
        expect([...auto.declinedSets]).toEqual(["torva"]);
        expect(auto.getResult()).toEqual(clicked.getResult());
    });

    test("says what was alched, and for how much", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, true);
        sim.openCasket("easy");
        sim.chests[0].itemId = "torva_platebody";
        const worth = sim.alchValue("torva_platebody", 0);
        sync();
        expect(store.getSnapshot().toasts.map((t) => t.text)).toEqual([
            `High alched Torva platebody for ${worth.toLocaleString()} coins`,
        ]);
    });

    test("takes several caskets in a row, then carries on", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, true);
        sim.openCasket("easy");
        sim.openCasket("medium");
        sim.openCasket("hard");
        expect(sim.chests.length).toBe(3);
        sync();
        expect(sim.chests.length).toBe(0);
        expect(sim.casketsOpened).toBe(3);
        expect(sim.state).toBe("playing");
        expect(store.getSnapshot().overlay).toBe("none");
        expect(store.getSnapshot().toasts.length).toBe(3);
    });

    test("leaves a level up that came in on its screen", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, true);
        sim.openCasket("easy");
        sim.xp = sim.xpForNextLevel;
        sync();
        expect(sim.chests.length).toBe(0);
        expect(sim.state).toBe("levelUp");
        expect(store.getSnapshot().overlay).toBe("levelUp");
    });

    test("waits for an open level up, then alchs the casket", () => {
        const sim = createSim();
        const { client, store, sync } = createClient(sim, true);
        sim.xp = sim.xpForNextLevel;
        sim.step(0, 0);
        expect(sim.state).toBe("levelUp");
        sync();
        const coins = sim.coins;
        sim.openCasket("easy");
        const opened = sim.coins;
        expect(opened).toBeGreaterThanOrEqual(coins);
        sync();
        // The level up is still there, and the casket's waiting
        expect(store.getSnapshot().overlay).toBe("levelUp");
        expect(sim.chests.length).toBe(1);
        client.choose(0);
        expect(sim.chests.length).toBe(0);
        expect(sim.coins).toBeGreaterThan(opened);
        expect(store.getSnapshot().overlay).toBe("none");
    });

    test("a casket the run ended on is left, as it is with the screen", () => {
        const sim = createSim();
        const { store, sync } = createClient(sim, true);
        sim.openCasket("easy");
        const coins = sim.coins;
        sim.state = "dead";
        sync();
        expect(store.getSnapshot().overlay).toBe("dead");
        expect(sim.chests.length).toBe(1);
        expect(sim.coins).toBe(coins);
    });
});

describe("saving", () => {
    // The client and what it saves to, with a lock that's held or not
    function createSaving(held: boolean) {
        const save = createSave();
        const store = new GameStore(save);
        const saved: SaveData[] = [];
        let next: LoadedSave = { save: createSave() };
        const writeOver = vi.fn();
        const saveStore: SaveStore = {
            gameVersion: "0.22.1",
            load: () => next,
            save: (data) => void saved.push(structuredClone(data)),
            read: () => "stored",
            writeOver,
            getUnreadable: () => [],
            readUnreadable: () => undefined,
            deleteUnreadable() {},
        };
        const saveLock = { held, listen: () => () => {}, takeOver() {} };
        const client: GameClient = Object.create(GameClient.prototype);
        Object.assign(client, { save, store, saveStore, saveLock, coop: { setMe() {} } });
        // What's in storage, as another tab left it
        const setStored = (loaded: LoadedSave) => {
            next = loaded;
        };
        const lockChanged = (now: boolean) => {
            saveLock.held = now;
            (client as unknown as { onSaveLock(held: boolean): void }).onSaveLock(now);
        };
        return { client, store, saved, writeOver, setStored, lockChanged };
    }

    test.each([
        ["warrior", "melee"],
        ["ranger", "ranged"],
        ["wizard", "magic"],
    ] as const)("%s sends only its class's skills to co-op", (characterId, style) => {
        expect.hasAssertions();
        const { client, store } = createSaving(true);
        client.save.coins = 50000;
        buyUpgrade(client.save, "strength", "melee");
        buyUpgrade(client.save, "hitpoints", "ranged");
        buyUpgrade(client.save, "ring_of_life", "magic");
        store.set({ characterId });
        const loadout = (
            client as unknown as { getLoadout(): Parameters<typeof loadoutStats>[0] }
        ).getLoadout();
        const stats = loadoutStats(loadout);
        expect(stats.might).toBeCloseTo(style === "melee" ? 0.05 : 0);
        expect(stats.revival).toBe(style === "magic" ? 1 : 0);
    });

    test("a ranged skill refund persists without changing melee or magic", () => {
        expect.hasAssertions();
        const { client, store, saved } = createSaving(true);
        client.save.coins = 50000;
        buyUpgrade(client.save, "strength", "melee");
        buyUpgrade(client.save, "strength", "ranged");
        buyUpgrade(client.save, "hitpoints", "magic");
        const before = structuredClone(client.save);
        buyUpgrade(client.save, "strength", "ranged");
        client.refundUpgrade("strength", "ranged");
        expect(client.save).toEqual(before);
        expect(saved).toEqual([before]);
        expect(store.getSnapshot().save).toEqual(before);
    });

    test.each([
        ["warrior", "lumbridge", "warrior"],
        ["ranger", "lumbridge", "ranger"],
        ["wizard", "lumbridge", "wizard"],
        ["wizard", "falador", "durial321"],
    ])(
        "solo %s on %s uses the actual adventurer's class skills",
        async (selected, mapId, actual) => {
            expect.hasAssertions();
            const { client, store } = createSaving(true);
            client.save.coins = 50000;
            buyUpgrade(client.save, "strength", "melee");
            buyUpgrade(client.save, "hitpoints", "ranged");
            buyUpgrade(client.save, "ring_of_life", "magic");
            store.set({ characterId: selected });
            const enterRun = vi.fn<(sim: Sim) => void>();
            Object.assign(client, {
                grid: createSim().grid,
                travelTo: vi.fn().mockResolvedValue(true),
                enterRun,
                options: { stress: 0 },
            });
            await client.startRun(mapId);
            const sim = enterRun.mock.calls[0][0];
            expect(sim.characterId).toBe(actual);
            expect(sim.metaStats).toEqual(getMetaStats(client.save, getCharacter(actual).style));
        },
    );

    // For the raid chests, which give nothing found already
    test("a solo run and a co-op loadout bring the save's raid chest trophies, only those", async () => {
        expect.hasAssertions();
        const { client } = createSaving(true);
        client.save.trophies = ["lil_bloat", "jar_of_dreams", "ghrazi_rapier", "lil_sot"];
        const enterRun = vi.fn<(sim: Sim) => void>();
        Object.assign(client, {
            grid: createSim().grid,
            travelTo: vi.fn().mockResolvedValue(true),
            enterRun,
            options: { stress: 0 },
        });
        await client.startRun("lumbridge");
        const sim = enterRun.mock.calls[0][0];
        const raidOnes = ["lil_bloat", "ghrazi_rapier", "lil_sot"];
        expect([...(sim.heroes[0].trophiesFound ?? [])]).toEqual(raidOnes);
        const loadout = (
            client as unknown as { getLoadout(): Parameters<typeof loadoutStats>[0] }
        ).getLoadout();
        expect(loadout?.trophies).toEqual(raidOnes);
    });

    test("a co-op map's forced adventurer determines the skill page", () => {
        expect.hasAssertions();
        const { client, store } = createSaving(true);
        client.save.coins = 50000;
        buyUpgrade(client.save, "strength", "melee");
        buyUpgrade(client.save, "ring_of_life", "magic");
        store.set({ characterId: "wizard" });
        Object.assign(client, { coop: { room: { mapId: "falador" } } });
        const loadout = (
            client as unknown as { getLoadout(): Parameters<typeof loadoutStats>[0] }
        ).getLoadout();
        expect(loadoutStats(loadout)).toEqual(
            getMetaStats(client.save, getCharacter("durial321").style),
        );
    });

    test("the co-op host plays everyone as the Avian Assaulter on Thanksgiving", () => {
        const { client } = createSaving(true);
        const members = [
            { id: "host", name: "Host", characterId: "warrior", ready: true },
            { id: "guest", name: "Guest", characterId: "ranger", ready: true },
        ];
        const room = { mapId: "thanksgiving", members, endless: false, hard: false };
        const start = vi.fn();
        Object.assign(client, { coop: { room, isHost: true, start } });
        client.startCoopRun();
        expect(start).toHaveBeenCalledOnce();
        expect(
            start.mock.calls[0][0].heroes.map((hero: { characterId: string }) => hero.characterId),
        ).toEqual(["avian_assaulter", "avian_assaulter"]);
    });

    test("the co-op host plays an adventurer it hasn't got (a newer guest's) as the first", () => {
        const { client } = createSaving(true);
        const members = [
            { id: "host", name: "Host", characterId: "wizard", ready: true },
            { id: "guest", name: "Guest", characterId: "someone_new", ready: true },
        ];
        const room = { mapId: "lumbridge", members, endless: false, hard: false };
        const start = vi.fn();
        Object.assign(client, { coop: { room, isHost: true, start } });
        client.startCoopRun();
        expect(start).toHaveBeenCalledOnce();
        expect(
            start.mock.calls[0][0].heroes.map((hero: { characterId: string }) => hero.characterId),
        ).toEqual(["wizard", CHARACTERS[0].id]);
    });

    test("a single skill refund is saved and refreshes the shop", () => {
        expect.hasAssertions();
        const { client, store, saved } = createSaving(true);
        client.save.coins = 10000;
        buyUpgrade(client.save, "strength");
        buyUpgrade(client.save, "hitpoints");
        const before = structuredClone(client.save);
        buyUpgrade(client.save, "strength");
        client.refundUpgrade("strength");
        expect(client.save).toEqual(before);
        expect(saved).toEqual([before]);
        expect(store.getSnapshot().save).toEqual(before);
        client.refundUpgrade("unknown");
        expect(saved).toHaveLength(1);
    });

    test("a single skill refund respects another tab's save lock", () => {
        expect.hasAssertions();
        const { client, store, saved, lockChanged } = createSaving(true);
        client.save.coins = 10000;
        buyUpgrade(client.save, "strength");
        lockChanged(false);
        client.refundUpgrade("strength");
        expect(client.save.skillPages.melee.upgrades).toEqual({});
        expect(store.getSnapshot().save.coins).toBe(10000);
        expect(saved).toEqual([]);
    });

    test("refunding an early skill saves what the page costs without it", () => {
        expect.hasAssertions();
        const { client, store, saved } = createSaving(true);
        client.save.coins = 50000;
        buyUpgrade(client.save, "strength");
        buyUpgrade(client.save, "smithing");
        client.refundUpgrade("strength");
        expect(client.save.coins).toBe(40000);
        expect(client.save.skillPages.melee).toEqual({
            upgrades: { smithing: 1 },
            upgradesSpent: 10000,
        });
        expect(saved).toEqual([client.save]);
        expect(store.getSnapshot().save).toEqual(client.save);
    });

    test("nothing's saved while another tab has the game", () => {
        const { client, store, saved, lockChanged } = createSaving(true);
        lockChanged(false);
        expect(store.getSnapshot().saveBlock).toEqual({ kind: "otherTab" });
        client.refundUpgrades();
        expect(saved).toEqual([]);
        // Played on without saving, the panel goes, and the button to open it
        // again comes
        client.playWithoutSaving();
        expect(store.getSnapshot().saveBlockClosed).toBe(true);
        client.showSaveBlock();
        expect(store.getSnapshot().saveBlockClosed).toBe(false);
    });

    test("getting the game back reads the save as the other tab left it", () => {
        const { client, store, saved, setStored, lockChanged } = createSaving(false);
        lockChanged(false);
        client.playWithoutSaving();
        setStored({ save: { ...createSave(), coins: 300 } });
        lockChanged(true);
        expect(client.save.coins).toBe(300);
        expect(store.getSnapshot().save.coins).toBe(300);
        expect(store.getSnapshot().saveBlock).toBeUndefined();
        client.refundUpgrades();
        expect(saved.map((s) => s.coins)).toEqual([300]);
        // Losing it again shows the panel again
        lockChanged(false);
        expect(store.getSnapshot().saveBlockClosed).toBe(false);
    });

    test("a save from a newer game is played but not saved", () => {
        const { client, store, saved, setStored, lockChanged } = createSaving(false);
        setStored({ save: { ...createSave(), coins: 70 }, newer: { gameVersion: "0.23.0" } });
        lockChanged(true);
        expect(store.getSnapshot().saveBlock).toEqual({ kind: "newerGame", gameVersion: "0.23.0" });
        expect(client.save.coins).toBe(70);
        client.refundUpgrades();
        expect(saved).toEqual([]);
    });

    test("saving anyway writes over a newer game's save, but never a newer format", () => {
        const { client, store, saved, writeOver, setStored, lockChanged } = createSaving(false);
        setStored({ save: { ...createSave(), coins: 70 }, newer: { gameVersion: "0.23.0" } });
        lockChanged(true);
        client.saveOverNewer();
        expect(writeOver).toHaveBeenCalledTimes(1);
        expect(saved.map((s) => s.coins)).toEqual([70]);
        expect(store.getSnapshot().saveBlock).toBeUndefined();
        // A format this game can't read is never written
        const format = { gameVersion: "0.24.0", format: true };
        setStored({ save: createSave(), newer: format });
        lockChanged(true);
        client.saveOverNewer();
        expect(writeOver).toHaveBeenCalledTimes(1);
        expect(saved).toHaveLength(1);
        expect(store.getSnapshot().saveBlock).toEqual({ kind: "newerGame", ...format });
    });

    test("exports a newer game's save as it's stored, not this game's copy of it", async () => {
        const saveFile = await import("./saveFile");
        const spy = vi.spyOn(saveFile, "saveFile").mockImplementation(() => {});
        const { client, setStored, lockChanged } = createSaving(false);
        setStored({ save: { ...createSave(), coins: 70 }, newer: { gameVersion: "0.23.0" } });
        lockChanged(true);
        client.exportSave();
        expect(spy).toHaveBeenLastCalledWith(
            "run-escape-save.json",
            "stored",
            "application/json",
            expect.any(Function),
        );
        // This game's own is marked with its version
        setStored({ save: { ...createSave(), coins: 80 } });
        lockChanged(true);
        client.exportSave();
        const text = spy.mock.lastCall![1];
        expect(JSON.parse(text)).toMatchObject({ coins: 80, gameVersion: "0.22.1" });
        spy.mockRestore();
    });

    test("an export says when it was made, and the save remembers it once it's kept", async () => {
        const saveFile = await import("./saveFile");
        const spy = vi.spyOn(saveFile, "saveFile").mockImplementation(() => {});
        vi.spyOn(Date, "now").mockReturnValue(1_790_000_000_000);
        try {
            const { client, store, saved, lockChanged } = createSaving(false);
            lockChanged(true);
            const writes = saved.length;
            client.exportSave();
            const [, text, , kept] = spy.mock.lastCall!;
            expect(JSON.parse(text).lastExported).toBe(1_790_000_000_000);
            // Not yet: the player can still cancel the app's picker or the share sheet
            expect(client.save.lastExported).toBeUndefined();
            expect(saved.length).toBe(writes);
            vi.mocked(Date.now).mockReturnValue(1_790_000_060_000);
            kept!();
            expect(saved.at(-1)?.lastExported).toBe(1_790_000_000_000);
            expect(store.getSnapshot().save.lastExported).toBe(1_790_000_000_000);
        } finally {
            vi.mocked(Date.now).mockRestore();
            spy.mockRestore();
        }
    });

    test("another tab taking the save pauses a solo run, once, and not co-op's", () => {
        const { client, lockChanged } = createSaving(true);
        const pause = vi.fn();
        Object.assign(client, { sim: {}, pause });
        lockChanged(false);
        expect(pause).toHaveBeenCalledTimes(1);
        lockChanged(false);
        expect(pause).toHaveBeenCalledTimes(1);
        lockChanged(true);
        Object.assign(client, { coopRun: {} });
        lockChanged(false);
        expect(pause).toHaveBeenCalledTimes(1);
    });

    test("a save that couldn't be read, with no room for a copy, is left as it is", () => {
        const { client, store, saved, setStored, lockChanged } = createSaving(false);
        setStored({ save: createSave(), unreadable: "rune-survivors-save", noRoom: true });
        lockChanged(true);
        expect(store.getSnapshot().saveBlock).toEqual({ kind: "noRoom" });
        // The panel saying so is the notice
        expect(store.getSnapshot().unreadableSave).toBeUndefined();
        client.refundUpgrades();
        expect(saved).toEqual([]);
    });

    test("a save that couldn't be read is kept, told about, and a fresh one saved", () => {
        const { client, store, saved, setStored, lockChanged } = createSaving(false);
        setStored({ save: createSave(), unreadable: "rune-survivors-save-unreadable-1" });
        lockChanged(true);
        expect(store.getSnapshot().unreadableSave).toBe("rune-survivors-save-unreadable-1");
        expect(saved).toEqual([createSave()]);
        client.closeUnreadableNotice();
        expect(store.getSnapshot().unreadableSave).toBeUndefined();
    });

    describe("the favourite adventurer", () => {
        const locked = CHARACTERS.find((c) => c.unlock)!.id;

        // With the pick's look and co-op's word of it watched
        function createPicking() {
            const saving = createSaving(true);
            const setCharacterLook = vi.fn();
            const setMe = vi.fn();
            Object.assign(saving.client, { assets: { setCharacterLook }, coop: { setMe } });
            return { ...saving, setCharacterLook, setMe };
        }

        test("is saved, and taken off again, only for an adventurer that's open", () => {
            const { client, store, saved } = createPicking();
            client.toggleFavouriteCharacter("wizard");
            expect(saved.map((s) => s.favouriteCharacter)).toEqual(["wizard"]);
            expect(store.getSnapshot().save.favouriteCharacter).toBe("wizard");
            // It's not the pick
            expect(store.getSnapshot().characterId).toBe("warrior");
            client.toggleFavouriteCharacter("wizard");
            expect(saved.map((s) => s.favouriteCharacter)).toEqual(["wizard", undefined]);
            client.toggleFavouriteCharacter(locked);
            expect(client.save.favouriteCharacter).toBeUndefined();
            expect(saved).toHaveLength(2);
        });

        test("an imported save goes to its favourite, picked once", () => {
            const { client, store, saved, setCharacterLook, setMe } = createPicking();
            client.replaceSave({ ...createSave(), favouriteCharacter: "ranger" });
            expect(store.getSnapshot().characterId).toBe("ranger");
            expect(setCharacterLook.mock.calls).toEqual([["ranger", undefined, undefined]]);
            expect(setMe).toHaveBeenCalledTimes(1);
            expect(saved.map((s) => s.favouriteCharacter)).toEqual(["ranger"]);
        });

        test("an imported save's favourite that isn't open in it leaves the pick alone", () => {
            const { client, store, setCharacterLook } = createPicking();
            store.set({ characterId: "wizard" });
            client.replaceSave({ ...createSave(), favouriteCharacter: locked });
            expect(store.getSnapshot().characterId).toBe("wizard");
            expect(setCharacterLook).not.toHaveBeenCalled();
        });

        test("a pick that isn't open in an imported save goes to its favourite, once", () => {
            const { client, store, setCharacterLook, setMe } = createPicking();
            client.save.unlockedCharacters.push(locked);
            store.set({ characterId: locked });
            client.replaceSave({ ...createSave(), favouriteCharacter: "ranger" });
            expect(store.getSnapshot().characterId).toBe("ranger");
            expect(setCharacterLook.mock.calls).toEqual([["ranger", undefined, undefined]]);
            expect(setMe).toHaveBeenCalledTimes(1);
        });

        test("a save given back by another tab leaves an open pick alone", () => {
            const { client, store, setStored, lockChanged } = createPicking();
            store.set({ characterId: "wizard" });
            setStored({ save: { ...createSave(), favouriteCharacter: "ranger" } });
            lockChanged(true);
            expect(client.save.favouriteCharacter).toBe("ranger");
            expect(store.getSnapshot().characterId).toBe("wizard");
            // One that isn't open in it goes to the favourite
            store.set({ characterId: locked });
            lockChanged(true);
            expect(store.getSnapshot().characterId).toBe("ranger");
        });
    });
});

describe("loadoutStats", () => {
    test("takes the stats' own names only, each no more than the shop sells", () => {
        const stats = loadoutStats({
            metaStats: {
                might: 1e9,
                armor: -5,
                regen: NaN,
                constructor: 1,
                toString: 2,
                valueOf: 3,
                nothing: 4,
            },
            unlockedItems: [],
            armoury: {},
        });
        expect(Object.keys(stats)).toEqual(Object.keys(emptyStats()));
        expect(hasBadNumber(stats)).toBe(false);
        expect(stats.might).toBeGreaterThan(0);
        expect(stats.might).toBeLessThan(1e9);
        expect(stats.armor).toBe(0);
        expect(stats.regen).toBe(0);
    });
});

describe("a boss bar in phases", () => {
    // Just what the bar reads: its hitpoints and its phases (Justiciar Zachariah's)
    const boss = (hp: number) => {
        const def = getEnemy("justiciar_zachariah");
        return { def, hp, maxHp: 1000 } as unknown as Parameters<typeof getPhaseBarFraction>[0];
    };

    test("is a full bar for each of Zachariah's phases, empty at the next threshold", () => {
        const phases = getEnemy("justiciar_zachariah").boss!.phases!;
        expect(phases.barPerPhase).toBe(true);
        const [first, second] = phases.phases.map((p) => (p.until ?? 0) * 1000);
        expect(getPhaseBarFraction(boss(1000), 0)).toBe(1);
        expect(getPhaseBarFraction(boss(first), 0)).toBe(0);
        // The next phase starts full where the last one ended
        expect(getPhaseBarFraction(boss(first), 1)).toBe(1);
        expect(getPhaseBarFraction(boss((first + second) / 2), 1)).toBeCloseTo(0.5);
        expect(getPhaseBarFraction(boss(second), 2)).toBe(1);
        expect(getPhaseBarFraction(boss(0), 2)).toBe(0);
    });

    test("is the whole of the hitpoints for a boss that doesn't ask for it", () => {
        const def = getEnemy("phosanis_nightmare");
        expect(def.boss?.phases?.barPerPhase).toBeUndefined();
        const phosani = { def, hp: 300, maxHp: 1000 } as unknown as Parameters<
            typeof getPhaseBarFraction
        >[0];
        expect(getPhaseBarFraction(phosani, 1)).toBeCloseTo(0.3);
    });
});

describe("the hitpoints bar", () => {
    test("fills with the hitpoints as they are, not a whole one at a time, within the bar", () => {
        // A tick of 4 hitpoints a minute's regeneration shows within a few seconds
        expect(getHpShare(37.6, 38)).toBe(0.989);
        expect(getHpShare(19, 38)).toBe(0.5);
        expect(getHpShare(-2, 38)).toBe(0);
        expect(getHpShare(40, 38)).toBe(1);
        expect(getHpShare(0, 0)).toBe(0);
    });

    test("says a whole number of hitpoints, never 0 while some are left", () => {
        expect(getShownHp(37.6)).toBe(38);
        expect(getShownHp(19.2)).toBe(19);
        expect(getShownHp(0.3)).toBe(1);
        expect(getShownHp(0)).toBe(0);
        expect(getShownHp(-2)).toBe(0);
    });
});

describe("a map's objectives", () => {
    // Just what they read: the map's objectives and its lairs' states
    function objectiveOf(states: Record<string, string>) {
        const map = getMap("battle_for_varrock");
        const sim = { map, lairById: (id: string) => ({ state: states[id] ?? "asleep" }) };
        return getObjectiveView(sim as unknown as Parameters<typeof getObjectiveView>[0]);
    }

    test("the Battle for Varrock's: his generals, then Yama, then nothing", () => {
        expect(objectiveOf({})).toEqual({
            text: "Find and slay Yama's two generals",
            done: 0,
            count: 2,
        });
        expect(objectiveOf({ kril: "beaten" })?.done).toBe(1);
        const yama = objectiveOf({ xarth: "beaten", kril: "beaten" });
        expect(yama).toEqual({ text: "Slay Yama in Varrock Palace", done: 0, count: 1 });
        expect(objectiveOf({ xarth: "beaten", kril: "beaten", yama: "beaten" })).toBeUndefined();
    });

    test("a map without any has none", () => {
        const sim = { map: getMap("lumbridge"), lairById: () => undefined };
        expect(
            getObjectiveView(sim as unknown as Parameters<typeof getObjectiveView>[0]),
        ).toBeUndefined();
    });
});

describe("raid modes", () => {
    test("turning hard mode off turns expert off with it, as expert is hard mode too", () => {
        const { client, store } = createClient(createSim(), false);
        Object.assign(client, { coop: { isHost: false } });
        store.set({ mapId: "theatre_of_blood", hard: true, expert: true });
        client.toggleHard();
        expect(store.getSnapshot().hard).toBe(false);
        expect(store.getSnapshot().expert).toBe(false);
    });
});

describe("the opening cinematic", () => {
    // The client mid-run with the Battle for Varrock's opening playing, a second in
    function cinematicClient() {
        const { client, store } = createClient(createSim(), false);
        const cinematic = new CinematicPlayer(VARROCK_OPENING);
        cinematic.advance(1);
        const view = { cinematic: cinematic as CinematicPlayer | undefined, onEvents() {} };
        const useAbility = vi.fn();
        const play = vi.fn();
        Object.assign(client, {
            cinematic,
            view,
            useAbility,
            accumulator: 0,
            audio: { play },
            grid: { getHeight: () => 0 },
            renderer: { mapManager: { setPinned: vi.fn() } },
        });
        store.set({ cinematic: true });
        const state = client as unknown as { cinematic?: CinematicPlayer; paused: boolean };
        return { client, store, cinematic, view, useAbility, play, state };
    }

    test.each(["Space", "Escape", "KeyW", "Enter", "Digit1"])(
        "is skipped by any key (or a controller's button), %s, which does nothing else",
        (code) => {
            const { client, store, view, useAbility, state } = cinematicClient();
            (client as unknown as { pressKey(code: string): void }).pressKey(code);
            expect(state.cinematic).toBeUndefined();
            expect(view.cinematic).toBeUndefined();
            expect(store.getSnapshot().cinematic).toBe(false);
            expect(useAbility).not.toHaveBeenCalled();
            expect(state.paused).toBe(false);
        },
    );

    test("is skipped by a click or a tap, but not by one as it begins", () => {
        const { client, store, state } = cinematicClient();
        state.cinematic!.seconds = 0.1;
        client.skipCinematic();
        expect(state.cinematic).toBeDefined();
        state.cinematic!.seconds = 0.5;
        client.skipCinematic();
        expect(state.cinematic).toBeUndefined();
        expect(store.getSnapshot().cinematic).toBe(false);
    });

    test("plays its sounds as it goes, and hands the camera back to the run's at the end", () => {
        const { client, store, play, state } = cinematicClient();
        const update = (ms: number, camera: CinematicCamera) =>
            (
                client as unknown as {
                    updateCinematic(
                        ms: number,
                        sim: Sim,
                        alpha: number,
                        play: CinematicCamera,
                    ): unknown;
                }
            ).updateCinematic(ms, client.sim!, 0, camera);
        const run: CinematicCamera = {
            x: 4747.5,
            y: 10609.5,
            height: -0.6,
            pitch: -400,
            yaw: 0,
            distance: 18,
        };
        // A long first frame moves it on by a frame's worth, not all of it
        expect(update(20000, run)).toBeDefined();
        expect(state.cinematic!.seconds).toBeLessThan(1.2);
        let last: unknown;
        for (let i = 0; i < 2000 && state.cinematic; i++) {
            last = update(50, run) ?? last;
        }
        expect(state.cinematic).toBeUndefined();
        expect(store.getSnapshot().cinematic).toBe(false);
        // Yama's click, heard once
        expect(play.mock.calls.map(([id]) => id)).toEqual([10235]);
        const end = last as CinematicCamera;
        expect(end.x).toBeCloseTo(run.x, 1);
        expect(end.y).toBeCloseTo(run.y, 1);
        expect(end.distance).toBeCloseTo(run.distance, 1);
        expect(end.pitch).toBeCloseTo(run.pitch, 0);
    });

    test("keeps a co-op player still while it plays", () => {
        const { client, state } = cinematicClient();
        const moves: number[][] = [];
        const fake = {
            isHost: true,
            behind: 0,
            stuck: false,
            cantCatchUp: false,
            desynced: false,
            canStep: () => false,
            setMove: (x: number, y: number) => moves.push([x, y]),
            flush() {},
        };
        Object.assign(client, {
            coop: { keepAlive() {} },
            coopRun: fake,
            coopStopped: false,
            input: {
                getMoveVector: (into: { x: number; y: number }) =>
                    Object.assign(into, { x: 1, y: 0 }),
            },
            move: { x: 0, y: 0 },
        });
        const update = () =>
            (
                client as unknown as { updateCoop(ms: number, sim: Sim, run: unknown): void }
            ).updateCoop(TICK_MS, client.sim!, fake);
        update();
        client.skipCinematic();
        expect(state.cinematic).toBeUndefined();
        update();
        expect(moves).toEqual([
            [0, 0],
            [1, 0],
        ]);
    });

    // A lair's (LairDef.opening): the client mid-run, with Yama's lair asleep, on its own or in
    // co-op
    function lairClient(coop: boolean) {
        const { client, store } = createClient(createSim(), false);
        const skipLairOpening = vi.fn();
        const sim = {
            tick: 500,
            lair: { state: "asleep", wakeTick: -1, def: { opening: YAMA_WAKES } },
            skipLairOpening,
        };
        const view = { cinematic: undefined as CinematicPlayer | undefined, onEvents() {} };
        const play = vi.fn();
        Object.assign(client, {
            sim,
            view,
            accumulator: 0,
            audio: { play },
            grid: { getHeight: () => 0 },
            renderer: { mapManager: { setPinned: vi.fn() } },
            coopRun: coop ? {} : undefined,
        });
        const state = client as unknown as { cinematic?: CinematicPlayer };
        const run: CinematicCamera = {
            x: 4749.5,
            y: 10699.5,
            height: -0.6,
            pitch: -400,
            yaw: 0,
            distance: 18,
        };
        const update = () =>
            (
                client as unknown as {
                    updateCinematic(
                        ms: number,
                        sim: unknown,
                        alpha: number,
                        play: CinematicCamera,
                    ): CinematicCamera | undefined;
                }
            ).updateCinematic(20, sim, 0.5, run);
        return { client, store, sim, view, play, state, update, skipLairOpening };
    }

    test("a lair's plays as its boss wakes, on the sim's clock, and only once", () => {
        const { store, sim, view, play, state, update } = lairClient(false);
        expect(update()).toBeUndefined();
        expect(state.cinematic).toBeUndefined();
        sim.lair = { ...sim.lair, state: "waking", wakeTick: 500 };
        sim.tick = 500 + 2 * TICKS_PER_SECOND;
        expect(update()).toBeDefined();
        const cinematic = state.cinematic!;
        expect(cinematic.def).toBe(YAMA_WAKES.cinematic);
        expect(cinematic.seconds).toBeCloseTo(2 + 0.5 / TICKS_PER_SECOND, 5);
        expect(cinematic.holdsRun).toBe(false);
        expect(view.cinematic).toBe(cinematic);
        expect(store.getSnapshot().cinematic).toBe(true);
        // Its sounds as the sim's clock passes them, and over once it's had its time
        sim.tick = 500 + Math.ceil(YAMA_WAKES.cinematic.seconds + 1) * TICKS_PER_SECOND;
        expect(update()).toBeUndefined();
        expect(state.cinematic).toBeUndefined();
        expect(store.getSnapshot().cinematic).toBe(false);
        const sounds = YAMA_WAKES.cinematic.cues.flatMap((cue) => cue.sound ?? []);
        expect(play.mock.calls.map(([id]) => id)).toEqual(sounds);
        // and not again while it's still waking
        update();
        expect(state.cinematic).toBeUndefined();
    });

    test("a lair's unsealing plays as it's unsealed, on the sim's clock from then, and only once", () => {
        const { client, sim, state, update } = lairClient(false);
        const unsealing = getMap("battle_for_varrock").lairs!.find((lair) => lair.id === "yama")!
            .requires!.unsealing!;
        Object.assign(sim, {
            player: { x: 4792, y: 10707.5 },
            unsealing: { unsealTick: 400, def: { requires: { unsealing } } },
        });
        Object.assign(client, { cameraRig: { pitch: -400, yaw: 0, distance: 18 } });
        sim.tick = 400 + TICKS_PER_SECOND;
        expect(update()).toBeDefined();
        const cinematic = state.cinematic!;
        expect(cinematic.def).toBe(unsealing.cinematic);
        expect(cinematic.seconds).toBeCloseTo(1 + 0.5 / TICKS_PER_SECOND, 5);
        // What it flies over is kept loaded
        const pinned = (
            client as unknown as {
                renderer: { mapManager: { setPinned: ReturnType<typeof vi.fn> } };
            }
        ).renderer.mapManager.setPinned;
        expect(pinned.mock.calls[0][0].length).toBeGreaterThan(0);
        sim.tick = 400 + Math.ceil(unsealing.cinematic.seconds + 1) * TICKS_PER_SECOND;
        expect(update()).toBeUndefined();
        expect(pinned).toHaveBeenLastCalledWith([]);
        update();
        expect(state.cinematic).toBeUndefined();
    });

    test.each([
        [false, 1],
        [true, 0],
    ])(
        "a lair's skipped in co-op (%s) has its boss come straight on only on your own",
        (coop, calls) => {
            const { client, sim, state, update, skipLairOpening } = lairClient(coop);
            sim.lair = { ...sim.lair, state: "waking", wakeTick: 500 };
            sim.tick = 500 + TICKS_PER_SECOND;
            update();
            client.skipCinematic();
            expect(state.cinematic).toBeUndefined();
            expect(skipLairOpening).toHaveBeenCalledTimes(calls);
            update();
            expect(state.cinematic).toBeUndefined();
        },
    );

    test("is skipped from the loading screen before it, once that's been up a moment", () => {
        const { client, store, state } = cinematicClient();
        const loading = client as unknown as { cinematicLoading?: number };
        state.cinematic!.seconds = 0;
        store.set({ screen: "loading" });
        loading.cinematicLoading = performance.now();
        client.skipCinematic();
        expect(state.cinematic).toBeDefined();
        loading.cinematicLoading = performance.now() - 1000;
        client.skipCinematic();
        expect(state.cinematic).toBeUndefined();
        expect(loading.cinematicLoading).toBeUndefined();
        expect(store.getSnapshot().screen).toBe("run");
    });

    test("in co-op, a guest's ready once its squares are in, and the host waits for its own", () => {
        const { client, store } = cinematicClient();
        const progress = { total: 2, left: 2 };
        const sendUp = vi.fn();
        const stepFrame = vi.fn(() => []);
        const run = {
            isHost: false,
            behind: 0,
            stuck: false,
            cantCatchUp: false,
            desynced: false,
            canStep: () => true,
            setMove() {},
            stepFrame,
            flush() {},
        };
        Object.assign(client, {
            cinematicLoading: performance.now(),
            renderer: { mapManager: { setPinned: vi.fn(), getPinnedProgress: () => progress } },
            coop: { isHost: false, sendUp, keepAlive() {} },
            coopRun: run,
            coopStopped: false,
            input: { getMoveVector: (into: { x: number; y: number }) => into },
            move: { x: 0, y: 0 },
        });
        store.set({ screen: "loading" });
        const loading = client as unknown as { isCinematicLoading(): boolean };
        expect(loading.isCinematicLoading()).toBe(true);
        expect(sendUp).not.toHaveBeenCalled();
        progress.left = 0;
        expect(loading.isCinematicLoading()).toBe(false);
        expect(sendUp).toHaveBeenCalledWith({ loaded: true });
        expect(store.getSnapshot().screen).toBe("run");

        // The host: no frames while its own squares load
        const update = () =>
            (
                client as unknown as { updateCoop(ms: number, sim: Sim, run: unknown): void }
            ).updateCoop(TICK_MS, client.sim!, run);
        run.isHost = true;
        Object.assign(client, { cinematicLoading: performance.now(), accumulator: 0 });
        update();
        expect(stepFrame).not.toHaveBeenCalled();
        Object.assign(client, { cinematicLoading: undefined });
        update();
        expect(stepFrame).toHaveBeenCalled();
    });

    test("isn't played again on a retry", () => {
        const { client } = createClient(createSim(), false);
        const startRun = vi.fn(async () => {});
        Object.assign(client, {
            sim: { map: { id: "zachariah", fight: {} } },
            leaveRun: vi.fn(),
            startRun,
        });
        client.retry();
        // and starts at its lair, if it has one (getRetryLair)
        expect(startRun).toHaveBeenCalledWith("zachariah", false, undefined, undefined, true);
    });
});

describe("the shot editor", () => {
    // The client mid-run in burnt Varrock, with the editor open on its opening
    async function directorClient() {
        const { client, store } = createClient(createSim(), false);
        const view = { cinematic: undefined as CinematicPlayer | undefined, onEvents() {} };
        const play = vi.fn();
        const setPinned = vi.fn();
        Object.assign(client, {
            sim: { map: getMap("battle_for_varrock"), player: { x: 3212.5, y: 3400.5 } },
            view,
            accumulator: 0,
            audio: { play },
            grid: { getHeight: () => 0 },
            renderer: { mapManager: { setPinned } },
            cameraRig: { pitch: -400, yaw: 0, distance: 18 },
            input: { isDown: () => false },
        });
        await client.direct();
        const state = client as unknown as {
            cinematic?: CinematicPlayer;
            pressKey(code: string): void;
            endCinematic(): void;
            updateCinematic(
                ms: number,
                sim: unknown,
                alpha: number,
                play: CinematicCamera,
            ): CinematicCamera | undefined;
        };
        return { client, store, view, play, setPinned, state };
    }

    test("opens on the map's opening, held, with what its camera sees loaded", async () => {
        const { client, store, view, setPinned, state } = await directorClient();
        const director = client.director!;
        expect(director.def.cast).toBe(VARROCK_OPENING.cast);
        expect(state.cinematic).toBe(director.player);
        expect(view.cinematic).toBe(director.player);
        expect(store.getSnapshot()).toMatchObject({ cinematic: true, director });
        expect(setPinned.mock.calls[0][0].length).toBeGreaterThan(0);
    });

    test("has its own keys, which do nothing else, and F3 and M as ever", async () => {
        const { client, state } = await directorClient();
        const onKeyPress = vi.fn();
        Object.assign(client, { onKeyPress });
        for (const code of ["Space", "KeyQ", "Digit1", "Escape", "F3", "KeyM"]) {
            state.pressKey(code);
        }
        expect(client.director!.getSnapshot().playing).toBe(true);
        expect(state.cinematic).toBeDefined();
        expect(onKeyPress.mock.calls.map(([code]) => code)).toEqual(["F3", "KeyM"]);
    });

    test("isn't paused or skipped, and goes with the run", async () => {
        const { client, store, state } = await directorClient();
        client.pause();
        expect(client.paused).toBe(false);
        client.director!.seek(5);
        client.skipCinematic();
        expect(client.director).toBeDefined();
        state.endCinematic();
        expect(client.director).toBeUndefined();
        expect(state.cinematic).toBeUndefined();
        expect(store.getSnapshot().director).toBeUndefined();
    });

    test("takes no keys while a trailer's recorded, but Escape, which stops it", async () => {
        const { client, state } = await directorClient();
        const cancel = vi.fn();
        Object.assign(client, { trailer: { recorder: { cancel }, live: false, rolling: true } });
        state.pressKey("Space");
        state.pressKey("Enter");
        expect(client.director!.getSnapshot()).toMatchObject({ playing: false, edited: false });
        expect(cancel).not.toHaveBeenCalled();
        state.pressKey("Escape");
        expect(cancel).toHaveBeenCalledOnce();
    });

    test("plays on from its playhead, its sounds heard, its camera the run's", async () => {
        const { client, play, state } = await directorClient();
        const director = client.director!;
        director.seek(15);
        director.togglePlay();
        const run: CinematicCamera = { x: 1, y: 2, height: 0, pitch: -400, yaw: 0, distance: 18 };
        let camera: CinematicCamera | undefined;
        for (let i = 0; i < 20; i++) {
            // A long frame moves it on by a frame's worth, as a cinematic does
            camera = state.updateCinematic(1000, client.sim, 0, run);
        }
        expect(director.seconds).toBeCloseTo(17);
        // Yama's click, once
        expect(play.mock.calls.map(([id]) => id)).toEqual([10235]);
        expect(camera).toEqual(director.getCamera());
        expect(state.cinematic).toBe(director.player);
    });

    test("plays the next part's entrance on a fight in parts' Next fight, not on its retry", () => {
        const { client } = createClient(createSim(), false);
        const startRun = vi.fn(async () => {});
        const chosen = { stage: 3 };
        Object.assign(client, {
            sim: {
                map: { id: "beneath_cursed_sands", fight: {}, stages: [{}, {}, {}, {}] },
                stage: 2,
            },
            leaveRun: vi.fn(),
            startRun,
            chosenStage: () => chosen.stage,
        });
        // The Champion won: on to the Akh
        client.retry();
        expect(startRun).toHaveBeenLastCalledWith(
            "beneath_cursed_sands",
            true,
            undefined,
            undefined,
            true,
        );
        // The Champion lost: him again
        chosen.stage = 2;
        client.retry();
        expect(startRun).toHaveBeenLastCalledWith(
            "beneath_cursed_sands",
            false,
            undefined,
            undefined,
            true,
        );
    });
});

describe("the fight button's hint", () => {
    // Just what the button reads of a run: its ability, the clock, and the boss on the bar
    function createFight() {
        const sim = {
            ability: { name: "Amascut's bane", iconObjId: 1, cooldown: 4, guide: true } as {
                name: string;
                iconObjId: number;
                cooldown: number;
                guide?: boolean;
            },
            heroes: [{ characterId: "warrior" }],
            focus: 0,
            map: {},
            tick: 0,
            shownBoss: undefined as { dead: boolean; risingEnd: number } | undefined,
            abilityTarget: () => undefined,
            abilitySecondsLeft: () => 0,
            isExposed: () => false,
        };
        const client: GameClient = Object.create(GameClient.prototype);
        Object.assign(client, { abilityUsed: false });
        const hint = (seconds: number): boolean => {
            sim.tick = seconds * TICKS_PER_SECOND;
            const view = (
                client as unknown as { getAbilityView(sim: unknown): { hint: boolean } }
            ).getAbilityView(sim);
            return view.hint;
        };
        return { sim, client, hint };
    }

    test("goes by when the boss came up, not the run's clock, as the Tombs' Nexus comes first", () => {
        const { sim, hint } = createFight();
        // The Nexus: no boss, however long it takes
        expect(hint(5)).toBe(false);
        expect(hint(40)).toBe(false);
        // The room's boss, rising till 62 s: not yet
        sim.shownBoss = { dead: false, risingEnd: 62 * TICKS_PER_SECOND };
        expect(hint(60)).toBe(false);
        expect(hint(62)).toBe(false);
        // A moment after it's up, and long enough to read
        expect(hint(66)).toBe(true);
        expect(hint(76)).toBe(true);
        expect(hint(80)).toBe(false);
        // Beaten, and the next room's boss: from that one's start again
        sim.shownBoss = { dead: true, risingEnd: 0 };
        expect(hint(100)).toBe(false);
        sim.shownBoss = { dead: false, risingEnd: 0 };
        expect(hint(101)).toBe(false);
        expect(hint(105)).toBe(true);
    });

    test("isn't shown again once the button's been used this session", () => {
        const { sim, client, hint } = createFight();
        sim.shownBoss = { dead: false, risingEnd: 0 };
        expect(hint(0)).toBe(false);
        expect(hint(5)).toBe(true);
        Object.assign(client, { abilityUsed: true });
        expect(hint(6)).toBe(false);
        sim.shownBoss = undefined;
        hint(20);
        sim.shownBoss = { dead: false, risingEnd: 0 };
        hint(21);
        expect(hint(25)).toBe(false);
    });

    test("isn't put away by a press the button says no to", () => {
        const { sim, client, hint } = createFight();
        Object.assign(client, { act: () => undefined, paused: false });
        const press = (takes: boolean): void => {
            Object.assign(client, { sim: { ...sim, abilityPressTakes: () => takes } });
            client.useAbility();
        };
        // Nothing to land on, or not ready: the Sim says no
        press(false);
        sim.shownBoss = { dead: false, risingEnd: 0 };
        hint(0);
        expect(hint(5)).toBe(true);
        // One it takes (going off, or held a moment)
        press(true);
        expect(hint(6)).toBe(false);
    });

    test("is only for a button that coaches, so Zachariah's Smite stays as it was", () => {
        const { sim, hint } = createFight();
        sim.ability = { name: "Smite", iconObjId: 1, cooldown: 4 };
        sim.shownBoss = { dead: false, risingEnd: 0 };
        expect(hint(0)).toBe(false);
        expect(hint(5)).toBe(false);
    });
});

describe("invocation presets", () => {
    function createClient() {
        const save = createSave();
        const sent: unknown[] = [];
        const writes = { count: 0 };
        const client: GameClient = Object.create(GameClient.prototype);
        Object.assign(client, {
            save,
            persist: () => writes.count++,
            getLoadout: () => ({ invocations: save.invocations }),
            coop: { room: {}, setMe: (me: unknown) => sent.push(me) },
        });
        return { client, save, sent, writes };
    }

    test("load onto the board and tell the lobby, as a toggle does", () => {
        const { client, save, sent } = createClient();
        save.invocations = ["on_a_diet"];
        client.saveInvocationPreset("Diet");
        save.invocations = [];
        client.loadInvocationPreset("Diet");
        expect(save.invocations).toEqual(["on_a_diet"]);
        expect(sent).toEqual([{ loadout: { invocations: ["on_a_diet"] } }]);
        // Not one of them, nothing happens
        client.loadInvocationPreset("Nope");
        client.deleteInvocationPreset("Nope");
        expect(save.invocationPresets).toHaveLength(1);
        expect(sent).toHaveLength(1);
    });

    test("leave none at all once the last is deleted, as a save loads it", () => {
        const { client, save } = createClient();
        client.saveInvocationPreset("");
        client.deleteInvocationPreset("Raid level 0");
        expect(save.invocationPresets).toBeUndefined();
    });

    test("write nothing for a new one when they're all used", () => {
        const { client, save, writes } = createClient();
        for (let i = 0; i < MAX_INVOCATION_PRESETS; i++) {
            client.saveInvocationPreset(`Set ${i}`);
        }
        const presets = save.invocationPresets;
        writes.count = 0;
        client.saveInvocationPreset("One more");
        expect(writes.count).toBe(0);
        expect(save.invocationPresets).toBe(presets);
    });
});

describe("boss attacks' instructions", () => {
    function createClient() {
        const now = vi.spyOn(performance, "now").mockReturnValue(0);
        const store = new GameStore(createSave());
        const shown: { text: string; ms?: number }[] = [];
        const toast = store.toast.bind(store);
        store.toast = (text: string, ms?: number) => {
            shown.push({ text, ms });
            return toast(text, ms);
        };
        let playing = true;
        const client: GameClient = Object.create(GameClient.prototype);
        Object.assign(client, {
            instructionsSeen: new Set<string>(),
            instructions: [],
            instructionsUp: [],
            instructionShownAt: -Infinity,
            instructionPumpedAt: 0,
            isPlaying: () => playing,
            store,
        });
        const inner = client as unknown as {
            queueInstruction(text: string): void;
            showInstruction(now: number): void;
        };
        // A frame at t, as GameClient.update has it: toasts past their time go, then the next
        // instruction
        const frame = (t: number) => {
            now.mockReturnValue(t);
            store.expireToasts();
            inner.showInstruction(t);
        };
        return {
            store,
            shown,
            texts: () => shown.map((s) => s.text),
            queue: (text: string) => inner.queueInstruction(text),
            frame,
            // Frames from one time to another, 100 ms apart
            play: (from: number, to: number) => {
                for (let t = from; t <= to; t += 100) {
                    frame(t);
                }
            },
            pause: (on: boolean) => (playing = !on),
            restore: () => now.mockRestore(),
        };
    }

    test("show once a run, one after another, each held long enough to read", () => {
        const c = createClient();
        try {
            c.frame(1000);
            c.queue("Dodge the spears!");
            c.queue("Hide behind a rock!");
            c.queue("Dodge the spears!");
            expect(c.texts()).toEqual(["Dodge the spears!"]);
            expect(c.shown[0].ms).toBeGreaterThanOrEqual(4000);
            // Not on top of the first
            c.play(1100, 3900);
            expect(c.shown).toHaveLength(1);
            c.play(4000, 4100);
            expect(c.texts()).toEqual(["Dodge the spears!", "Hide behind a rock!"]);
            // Its attack again later: not said again this run
            c.play(4200, 20000);
            c.queue("Dodge the spears!");
            c.play(20100, 25000);
            expect(c.shown).toHaveLength(2);
        } finally {
            c.restore();
        }
    });

    test("come back after a level up that covered them, till they've been read", () => {
        const c = createClient();
        try {
            c.frame(0);
            c.queue("First");
            c.queue("Second");
            c.play(100, 500);
            expect(c.texts()).toEqual(["First"]);
            // A level up's choice half a second after it came up: it's taken down, not read
            c.pause(true);
            c.frame(600);
            expect(c.store.getSnapshot().toasts).toEqual([]);
            c.play(700, 30000);
            expect(c.texts()).toEqual(["First"]);
            // Back in play: the first again straight away, then the second
            c.pause(false);
            c.play(30100, 33100);
            expect(c.texts()).toEqual(["First", "First", "Second"]);
            // Each read once it's been up long enough: a pause after that brings neither back
            c.play(33200, 37000);
            c.pause(true);
            c.frame(37100);
            c.pause(false);
            c.play(37200, 45000);
            expect(c.texts()).toEqual(["First", "First", "Second"]);
        } finally {
            c.restore();
        }
    });

    test("come again when newer notices push one off before it's read", () => {
        const c = createClient();
        try {
            c.frame(0);
            c.queue("Get behind a boulder!");
            c.play(100, 1000);
            // Four of the game's other notices at once: the store keeps four
            for (const text of ["Zebak roars!", "A casket drops!", "Power up!", "Level 5!"]) {
                c.store.toast(text);
            }
            c.frame(1100);
            expect(c.texts().filter((t) => t === "Get behind a boulder!")).toHaveLength(2);
            expect(c.store.getSnapshot().toasts.map((t) => t.text)).toContain(
                "Get behind a boulder!",
            );
        } finally {
            c.restore();
        }
    });

    test("drop one that waited too long in play, but not for time in a hidden tab", () => {
        const c = createClient();
        try {
            c.frame(0);
            // Six at once, 3 s apart: the fifth's and sixth's turns come after 12 s of play, too
            // late, and they go
            ["A", "B", "C", "D", "E", "F"].forEach(c.queue);
            c.play(100, 20000);
            expect(c.texts()).toEqual(["A", "B", "C", "D"]);
            // Time away in a hidden tab isn't time waited, or time read: back after minutes, the
            // one that was up comes again, and the one behind it isn't dropped
            c.queue("G");
            c.queue("H");
            c.frame(20100);
            c.frame(200000);
            c.play(200100, 203100);
            expect(c.texts().slice(-3)).toEqual(["G", "G", "H"]);
        } finally {
            c.restore();
        }
    });
});

describe("a co-op room's Cards only", () => {
    const caps = encodeCardCaps(new Map<string, Rarity>([["weapon:scimitar", "common"]]));
    const loadout = (cardCaps?: string) => ({
        metaStats: {},
        unlockedItems: [],
        armoury: {},
        ...(cardCaps !== undefined && { cardCaps }),
    });
    it("keeps everyone's cards when the host plays it", () => {
        const heroes = [
            { id: "host", loadout: { ...loadout(caps), cardsOnly: true as const } },
            { id: "guest", loadout: loadout(caps) },
        ];
        expect(partyLoadouts(heroes, "host").map((l) => l?.cardCaps)).toEqual([caps, caps]);
    });
    it("drops a guest's cards when the host doesn't: no one plays it alone", () => {
        const heroes = [
            { id: "host", loadout: loadout() },
            { id: "guest", loadout: loadout(caps) },
        ];
        const party = partyLoadouts(heroes, "host");
        expect(party.map((l) => l?.cardCaps)).toEqual([undefined, undefined]);
        expect(cleanLoadout(party[1]).cardCaps).toBeUndefined();
    });
    it("drops a new host's cards from before, when their own tab isn't on", () => {
        // A guest who became host keeps the caps they sent as a guest, but the room's off
        const heroes = [
            { id: "newHost", loadout: loadout(caps) },
            { id: "guest", loadout: loadout(caps) },
        ];
        expect(partyLoadouts(heroes, "newHost").map((l) => l?.cardCaps)).toEqual([
            undefined,
            undefined,
        ]);
    });
});

describe("a co-op player's Card collection only pet", () => {
    const butch = "butch";
    it("keeps a co-op player's pet to one whose card they've sent, in a Cards only run", () => {
        const caps = new Map<string, Rarity>([["weapon:scimitar", "common"]]);
        const withCard = new Map(caps).set(`trophy:${butch}`, "veryRare");
        const loadout = (cardCaps?: string) => ({
            metaStats: {},
            unlockedItems: [],
            armoury: {},
            pet: butch,
            ...(cardCaps !== undefined && { cardCaps }),
        });
        expect(cleanLoadout(loadout(encodeCardCaps(withCard))).pet).toBe(butch);
        expect(cleanLoadout(loadout(encodeCardCaps(caps))).pet).toBeUndefined();
        // Not playing Cards only: their found pet, as before
        expect(cleanLoadout(loadout()).pet).toBe(butch);
    });
});
