// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { GameClient } from "../client/GameClient";
import {
    ChestView,
    EventView,
    GameStore,
    HudNumbers,
    HudView,
    SlotView,
    UiSnapshot,
} from "../client/GameStore";
import { getItemView } from "../client/ItemViews";
import { getUpgradeLine } from "../content/armoury";
import { CASKET_GEAR, GEAR_SLOTS, getGear } from "../content/items";
import { getPassive } from "../content/passives";
import { describeUnlockTask } from "../content/unlocks";
import { getWeapon } from "../content/weapons";
import { createSave } from "../core/save";
import { GameUi } from "./GameUi";
import { iconCache } from "./ItemIcon";

const device = vi.hoisted(() => ({ coarse: false }));

vi.mock("../../util/DeviceUtil", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../../util/DeviceUtil")>()),
    get isCoarsePointer() {
        return device.coarse;
    },
}));

vi.mock("./TouchControls", () => ({
    TouchControls: () => null,
    RotateNotice: () => null,
    enterFullscreen: vi.fn(),
}));

vi.mock("@foxglove/wasm-bz2/wasm/module.wasm?url", () => ({ default: "" }));

vi.mock("../client/GameView", () => ({
    formatTime: (seconds: number) => {
        const s = Math.floor(seconds);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    },
}));

function slot(id: string, level: number): SlotView {
    return { id, name: id, level, maxLevel: 8, iconObjId: 1, rarityColor: "#fff" };
}

function hud(weapons: SlotView[]): HudView {
    return {
        mapId: "lumbridge",
        level: 3,
        maxWeapons: 6,
        maxPassives: 6,
        weapons,
        passives: [],
        stats: [],
        gear: [],
        inventory: [null, null, null, null],
        rerolls: 0,
        banishes: 0,
    };
}

function numbers(changes: Partial<HudNumbers> = {}): HudNumbers {
    return {
        bossIn: 600,
        hp: 20,
        maxHp: 25,
        poisoned: false,
        xpFraction: 0.5,
        seconds: 61,
        kills: 7,
        coins: 3,
        platinum: 0,
        dps: 0,
        weaponDamage: {},
        otherDps: 0,
        buffs: [],
        quests: [],
        ...changes,
    };
}

// The HUD with the client's store and nothing else of it, but for the methods given
function renderHud(methods: Record<string, unknown> = {}, devTools = false) {
    const store = new GameStore(createSave());
    const noop = () => {};
    const setCameraZoom = vi.fn();
    const client = new Proxy(
        {
            store,
            input: { stick: {} },
            cameraRig: { distance: 22 },
            setCameraZoom,
            devTools,
            ...methods,
        },
        { get: (target, key) => (key in target ? target[key as keyof typeof target] : noop) },
    ) as unknown as GameClient;
    store.set({ screen: "run", overlay: "none", hud: hud([slot("bow", 1)]) });
    store.setNumbers(numbers());
    const view = render(<GameUi store={store} client={client} />);
    return { store, view, setCameraZoom, client };
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    device.coarse = false;
});

describe("the run's HUD", () => {
    test("adjusts camera zoom from the mobile HUD in solo and co-op runs", () => {
        device.coarse = true;
        const { store, setCameraZoom } = renderHud();
        const toggle = screen.getByRole("button", { name: "Zoom" });
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("slider", { name: "Camera zoom" })).toBeNull();
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        const slider = screen.getByRole("slider", { name: "Camera zoom" });
        fireEvent.change(slider, { target: { value: "50" } });
        expect(setCameraZoom).toHaveBeenCalledExactlyOnceWith(50);
        expect(slider).toHaveValue("50");
        act(() =>
            store.set({
                party: [
                    {
                        name: "Teammate",
                        characterId: "warrior",
                        hp: 25,
                        maxHp: 25,
                        down: false,
                        left: false,
                        revivable: false,
                        reviveProgress: 0,
                        immune: false,
                    },
                ],
            }),
        );
        expect(screen.getByRole("slider", { name: "Camera zoom" })).toBeVisible();
        // Under the pause menu it stays, out of reach
        act(() => store.set({ overlay: "paused" }));
        expect(screen.getByRole("slider", { name: "Camera zoom" })).toBeDisabled();
        expect(toggle).toBeDisabled();
    });

    test.each([1, 2, 3])("stress-tests the mobile HUD with %i teammates", (teammateCount) => {
        device.coarse = true;
        for (let localHero = 0; localHero <= teammateCount; localHero++) {
            const { store, view, setCameraZoom } = renderHud();
            const gear = GEAR_SLOTS.map((slot, slotIndex) => {
                const choices = CASKET_GEAR.filter((item) => item.slot === slot.id);
                const item = choices[(localHero + teammateCount + slotIndex) % choices.length];
                return { slot: slot.id, name: slot.name, item: getItemView(item) };
            });
            const party = Array.from({ length: teammateCount }, (_, index) => ({
                name: `Teammate ${index + 1}`,
                characterId: index % 2 === 0 ? "warrior" : "wizard",
                hp: 25 - index,
                maxHp: 25,
                down: false,
                left: false,
                revivable: false,
                reviveProgress: 0,
                immune: false,
            }));
            act(() =>
                store.set({
                    hud: { ...hud([slot("bow", 1)]), gear },
                    party,
                    display: { ...store.getSnapshot().display, gearPanel: true },
                }),
            );
            act(() =>
                store.setNumbers(
                    numbers({
                        buffs: [
                            {
                                id: `stress-buff-${localHero}`,
                                name: "Stress test potion",
                                description: "+20% damage",
                                objId: 12695,
                                harmful: false,
                                secondsLeft: 20,
                                fraction: 0.5,
                            },
                            {
                                id: `stress-debuff-${localHero}`,
                                name: "Stress test drain",
                                description: "-0.2 armour",
                                objId: 698,
                                harmful: true,
                                secondsLeft: 10,
                                fraction: 0.25,
                            },
                        ],
                    }),
                ),
            );

            const gearGrid = view.container.querySelector(".ui-hud-gear-grid")!;
            expect(gearGrid.children).toHaveLength(GEAR_SLOTS.length);
            expect(gearGrid.querySelectorAll(".ui-gear-slot-empty")).toHaveLength(0);
            expect(view.container.querySelectorAll(".ui-party-member")).toHaveLength(teammateCount);

            fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
            const zoom = 20 + localHero * 10;
            fireEvent.change(screen.getByRole("slider", { name: "Camera zoom" }), {
                target: { value: String(zoom) },
            });
            expect(setCameraZoom).toHaveBeenLastCalledWith(zoom);
            expect(screen.getByRole("slider", { name: "Camera zoom" })).toBeVisible();

            act(() => store.set({ overlay: "paused" }));
            expect(screen.getByRole("slider", { name: "Camera zoom" })).toBeDisabled();
            expect(screen.getByText("Stress test potion")).toBeVisible();
            expect(screen.getByText("Stress test drain")).toBeVisible();
            view.unmount();
        }
    });

    test("the sound's orb by the minimap turns it off and on, with the \"no\" sign while it's off", () => {
        // Its sprites as if drawn
        vi.spyOn(iconCache, "getFrame").mockReturnValue("data:image/png;base64,");
        vi.spyOn(iconCache, "requestFrame").mockImplementation(() => {});
        const toggleMute = vi.fn();
        const { store } = renderHud({ toggleMute });
        const orb = () => screen.getByRole("button", { name: /^Sound (on|off):/ });
        expect(orb()).toHaveAccessibleName("Sound on: turn it off");
        expect(orb().closest(".ui-minimap")).not.toBeNull();
        expect(orb().querySelector(".ui-sound-orb-music")).not.toBeNull();
        expect(orb().querySelector(".ui-sound-orb-off")).toBeNull();
        act(() => store.set({ audio: { ...store.getSnapshot().audio, muted: true } }));
        expect(orb()).toHaveAccessibleName("Sound off: turn it on");
        expect(orb().querySelector(".ui-sound-orb-off")).not.toBeNull();
        expect(orb().querySelector(".ui-sound-orb-key")).toHaveTextContent("M");
        // A click gives the keys back; Enter or a controller's button (no clicks) keeps the focus
        orb().focus();
        fireEvent.click(orb(), { detail: 0 });
        expect(orb()).toHaveFocus();
        fireEvent.click(orb(), { detail: 1 });
        expect(orb()).not.toHaveFocus();
        expect(toggleMute).toHaveBeenCalledTimes(2);
        expect(toggleMute).toHaveBeenCalledWith(true);
    });

    test("the sound's orb has no key on a touch screen", () => {
        device.coarse = true;
        renderHud();
        const orb = screen.getByRole("button", { name: /^Sound (on|off):/ });
        expect(orb.querySelector(".ui-sound-orb-key")).toBeNull();
    });

    test("empty equipment slots use cache silhouettes and equipped items keep their own icons", () => {
        vi.spyOn(iconCache, "getSprite").mockImplementation(
            (id) => `data:image/png;base64,slot${id}`,
        );
        vi.spyOn(iconCache, "requestSprite").mockImplementation(() => {});
        vi.spyOn(iconCache, "get").mockImplementation(() => "data:image/png;base64,equipped");
        vi.spyOn(iconCache, "request").mockImplementation(() => {});
        const { store } = renderHud();
        const emptyGear = GEAR_SLOTS.map(({ id, name }) => ({ slot: id, name }));
        act(() => store.set({ hud: { ...hud([]), gear: emptyGear } }));
        for (const slot of GEAR_SLOTS) {
            const button = screen.getByRole("button", { name: `${slot.name} (empty)` });
            expect(button).toBeDisabled();
            expect(button).toHaveClass("ui-gear-slot-empty");
            expect(button.textContent).toBe("");
            expect(button.querySelector("img")).toHaveAttribute(
                "src",
                `data:image/png;base64,slot${slot.iconSpriteId}`,
            );
            expect(button.querySelector("img")).toHaveAttribute("alt", "");
        }
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        const item = getItemView(CASKET_GEAR[0]);
        act(() =>
            store.set({
                hud: {
                    ...hud([]),
                    gear: emptyGear.map((slot) =>
                        slot.slot === CASKET_GEAR[0].slot ? { ...slot, item } : slot,
                    ),
                },
            }),
        );
        const equipped = screen.getByRole("button", { name: item.name });
        expect(equipped).toBeEnabled();
        expect(equipped).not.toHaveClass("ui-gear-slot-empty");
        expect(equipped.querySelector("img")).toHaveAttribute(
            "src",
            "data:image/png;base64,equipped",
        );
        act(() => store.set({ hud: { ...hud([]), gear: emptyGear } }));
        expect(
            screen.getByRole("button", { name: "Head (empty)" }).querySelector("img"),
        ).toHaveAttribute("src", "data:image/png;base64,slot156");
    });

    test("shows an untimed ring beside timed buffs, and removes it when spent", () => {
        const { store, view } = renderHud();
        const potion = {
            id: "potion",
            name: "Potion",
            description: "+20% damage",
            objId: 2436,
            harmful: false,
            secondsLeft: 30,
            fraction: 0.5,
        };
        act(() =>
            store.setNumbers(
                numbers({
                    buffs: [
                        potion,
                        {
                            id: "ring_of_life",
                            name: "Ring of life",
                            description: "Revives you once if you fall.",
                            objId: 2570,
                            harmful: false,
                        },
                    ],
                }),
            ),
        );
        const ring = view.getByRole("button", { name: "Ring of life" });
        expect(ring.querySelector(".ui-icon")).not.toBeNull();
        expect(ring).not.toHaveTextContent(/\ds/);
        expect(ring.querySelector(".ui-buff-bar")).toBeNull();
        const timed = view.getByRole("button", { name: "Potion" });
        expect(timed).toHaveTextContent("30s");
        expect(timed.querySelector(".ui-buff-bar")).toHaveStyle("transform: scaleX(0.5)");
        fireEvent.focus(timed);
        expect(screen.getByRole("tooltip")).toHaveTextContent("Potion");
        expect(screen.getByRole("tooltip")).toHaveTextContent(potion.description);
        expect(timed).toHaveAttribute("aria-describedby", screen.getByRole("tooltip").id);
        expect(timed).not.toHaveAttribute("title");
        fireEvent.blur(timed);
        fireEvent.focus(ring);
        expect(screen.getByRole("tooltip")).toHaveTextContent("Revives you once if you fall.");
        act(() => store.setNumbers(numbers({ buffs: [potion] })));
        expect(view.queryByRole("button", { name: "Ring of life" })).toBeNull();
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        expect(view.getByRole("button", { name: "Potion" })).toHaveTextContent("30s");
    });

    test("worn gear is a row under the weapons and passives unless the gear panel is on", () => {
        const { store, view } = renderHud();
        const gear = GEAR_SLOTS.map(({ id, name }) => ({ slot: id, name }));
        act(() => store.set({ hud: { ...hud([slot("bow", 1)]), gear } }));

        const row = view.container.querySelector(".ui-hud-left > .ui-gear-slots")!;
        expect(row.previousElementSibling).toHaveClass("ui-slots");
        expect(row.children).toHaveLength(GEAR_SLOTS.length);
        expect(row).not.toHaveAttribute("hidden");
        expect(screen.queryByRole("button", { name: "Gear" })).toBeNull();
        expect(view.container.querySelector(".ui-hud-gear-grid")).toBeNull();

        act(() => store.set({ display: { ...store.getSnapshot().display, gearPanel: true } }));
        expect(view.container.querySelector(".ui-gear-slots")).toBeNull();
        expect(view.container.querySelector(".ui-hud-right .ui-hud-gear-grid")).not.toBeNull();
    });

    test("shows a collapsible two-column gear panel below DPS in solo and co-op", () => {
        const { store, view } = renderHud();
        const gear = GEAR_SLOTS.map(({ id, name }) => ({ slot: id, name }));
        act(() =>
            store.set({
                hud: { ...hud([slot("bow", 1)]), gear },
                display: { ...store.getSnapshot().display, gearPanel: true },
            }),
        );

        const rightColumn = view.container.querySelector<HTMLElement>(".ui-hud-right")!;
        const toggle = within(rightColumn).getByRole("button", { name: "Gear" });
        const gearGrid = rightColumn.querySelector(".ui-hud-gear-grid")!;
        expect(rightColumn.querySelector(".ui-damage")?.nextElementSibling).toBe(
            toggle.parentElement,
        );
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        expect(gearGrid.children).toHaveLength(GEAR_SLOTS.length);
        expect(gearGrid.lastElementChild).toHaveClass("ui-gear-ring-slot");
        expect(gearGrid.querySelectorAll(".ui-gear-ring-slot")).toHaveLength(1);
        expect(view.container.querySelector(".ui-hud-left .ui-gear-slots")).toBeNull();

        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(gearGrid).toHaveAttribute("hidden");
        fireEvent.click(toggle);
        expect(gearGrid).not.toHaveAttribute("hidden");

        act(() =>
            store.set({
                party: [
                    {
                        name: "Teammate",
                        characterId: "warrior",
                        hp: 25,
                        maxHp: 25,
                        down: false,
                        left: false,
                        revivable: false,
                        reviveProgress: 0,
                        immune: false,
                    },
                ],
            }),
        );
        expect(rightColumn.querySelector(".ui-hud-gear-grid")).toBe(gearGrid);
    });

    test("shows its numbers as they change, apart from the rest of the UI", () => {
        const { store, view } = renderHud();
        const timer = () => view.container.querySelector(".ui-timer")!.textContent;
        expect(timer()).toBe("1:01");
        expect(view.container.querySelector(".ui-hp span")!.textContent).toBe("20 / 25");
        act(() => store.setNumbers(numbers({ seconds: 62, hp: 12 })));
        expect(timer()).toBe("1:02");
        expect(view.container.querySelector(".ui-hp span")!.textContent).toBe("12 / 25");
        const fill = view.container.querySelector<HTMLElement>(".ui-hp-fill")!;
        expect(fill.style.transform).toBe("scaleX(0.48)");
    });

    test("shows what the hero has when it changes", () => {
        const { store, view } = renderHud();
        const levels = () =>
            [...view.container.querySelectorAll(".ui-slot-level")].map((el) => el.textContent);
        expect(levels()).toEqual(["1"]);
        act(() => store.set({ hud: hud([slot("bow", 2), slot("staff", 1)]) }));
        expect(levels()).toEqual(["2", "1"]);
    });

    test("the DPS keeps out of the way of a fight button over the items, and only that", () => {
        const { store, view } = renderHud();
        const damage = () => view.container.querySelector(".ui-damage")!;
        const ability = (withItems: boolean) => ({
            name: "Amascut's bane",
            iconObjId: 1,
            charge: 1,
            inReach: false,
            opened: false,
            guide: false,
            withItems,
            hint: false,
        });
        expect(damage()).not.toHaveClass("ui-damage-beside-ability");
        act(() => store.setNumbers(numbers({ ability: ability(true) })));
        expect(damage()).toHaveClass("ui-damage-beside-ability");
        // A one-fight map's button is in the corner, below the HUD's column
        act(() => store.setNumbers(numbers({ ability: ability(false) })));
        expect(damage()).not.toHaveClass("ui-damage-beside-ability");
    });

    test("the boss's warning counts down in the last minute", () => {
        const { store, view } = renderHud();
        expect(view.container.querySelector(".ui-boss-warning")).toBeNull();
        act(() => store.setNumbers(numbers({ bossIn: 42 })));
        expect(view.container.querySelector(".ui-boss-warning")!.textContent).toMatch(/42s$/);
    });

    test("a map's objective shows while no boss is out, with how many of it are done", () => {
        const { store, view } = renderHud();
        const objective = () => view.container.querySelector(".ui-map-objective")?.textContent;
        expect(objective()).toBeUndefined();
        const text = "Find and slay Yama's two generals";
        act(() => store.setNumbers(numbers({ objective: { text, done: 1, count: 2 } })));
        expect(objective()).toBe(`${text} (1/2)`);
        // One thing to do has no count
        const yama = "Slay Yama in Varrock Palace";
        act(() => store.setNumbers(numbers({ objective: { text: yama, done: 0, count: 1 } })));
        expect(objective()).toBe(yama);
    });

    test("a map's objective is up for a few seconds, and again each time it changes", () => {
        vi.useFakeTimers();
        try {
            const { store, view } = renderHud();
            const objective = () => view.container.querySelector(".ui-map-objective")?.textContent;
            const text = "Find and slay Yama's two generals";
            act(() => store.setNumbers(numbers({ objective: { text, done: 0, count: 2 } })));
            act(() => vi.advanceTimersByTime(5000));
            expect(objective()).toBe(`${text} (0/2)`);
            act(() => vi.advanceTimersByTime(1500));
            expect(objective()).toBeUndefined();
            // The same again (the HUD's numbers coming round) doesn't bring it back
            act(() =>
                store.setNumbers(numbers({ seconds: 70, objective: { text, done: 0, count: 2 } })),
            );
            expect(objective()).toBeUndefined();
            // A general down does
            act(() => store.setNumbers(numbers({ objective: { text, done: 1, count: 2 } })));
            expect(objective()).toBe(`${text} (1/2)`);
            act(() => vi.advanceTimersByTime(6500));
            expect(objective()).toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });

    test("shows the Thanksgiving Forester warning in the final minute", () => {
        const { store, view } = renderHud();
        act(() => store.set({ hud: { ...hud([]), mapId: "thanksgiving" } }));
        act(() => store.setNumbers(numbers({ bossIn: 60 })));
        expect(view.container.querySelector(".ui-boss-warning")?.textContent).toBe(
            "The harvest feast is interrupted... the Freaky Forester approaches! 60s",
        );
    });

    test("weapons and passives describe their current stats and evolution on focus", () => {
        const { store } = renderHud();
        const weapon: SlotView = {
            ...slot("bow", 8),
            stats: [{ text: "Damage: 20" }, { text: "Cooldown: 1s" }],
            detail: { text: "Shoots an arrow." },
            evolution: { passive: "Piety", maxed: true, hasPassive: false, ready: false },
        };
        const passive: SlotView = { ...slot("Piety", 2), detail: { text: "+10% damage" } };
        act(() => store.set({ hud: { ...hud([weapon]), passives: [passive] } }));
        const bow = screen.getByRole("button", { name: "bow" });
        fireEvent.focus(bow);
        const tip = screen.getByRole("tooltip");
        expect(bow).toHaveAttribute("aria-describedby", tip.id);
        for (const text of [
            "Max level",
            ...weapon.stats!.map((l) => l.text),
            weapon.detail!.text,
            "Piety",
        ]) {
            expect(tip).toHaveTextContent(text);
        }
        fireEvent.blur(bow);
        const prayer = screen.getByRole("button", { name: "Piety" });
        fireEvent.focus(prayer);
        expect(screen.getByRole("tooltip")).toHaveTextContent("Level 2 of 8");
        expect(screen.getByRole("tooltip")).toHaveTextContent(passive.detail!.text);
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        fireEvent.focus(prayer);
        act(() => store.set({ overlay: "paused" }));
        expect(prayer).toBeDisabled();
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    test("worn equipment shows the reward description and current set bonus", () => {
        const { store } = renderHud();
        const item = {
            ...getItemView(CASKET_GEAR[0], 2),
            set: { text: "Set bonus active", active: true },
        };
        act(() =>
            store.set({
                hud: { ...hud([]), gear: [{ slot: CASKET_GEAR[0].slot, name: "Head", item }] },
            }),
        );
        const button = screen.getByRole("button", { name: item.name });
        fireEvent.focus(button);
        const tip = screen.getByRole("tooltip");
        for (const text of [item.name, ...item.lines.map((l) => l.text), item.set.text]) {
            expect(tip).toHaveTextContent(text);
        }
        // Its line is green, spaced to line up with the stats above it
        expect(within(tip).getByText(item.set.text).closest(".ui-stat-line")).toHaveClass(
            "ui-good",
        );
        expect(button).not.toHaveAttribute("title");
    });

    test("Armoury tiles and future upgrades describe the actual piece without buying it", () => {
        const { store, view } = renderHud();
        const base = CASKET_GEAR.find((g) => getUpgradeLine(g.id).length > 2)!;
        const line = getUpgradeLine(base.id);
        const save = createSave();
        save.foundGear = [base.id];
        save.armoury[base.id] = 1;
        act(() => store.set({ screen: "armoury", save }));
        const tile = within(
            view.container.querySelector<HTMLElement>(".ui-armoury-slots")!,
        ).getByRole("button", { name: getGear(line[1]).name });
        fireEvent.focus(tile);
        const current = getItemView(getGear(line[1]));
        for (const text of [current.name, ...current.lines.map((l) => l.text)]) {
            expect(screen.getByRole("tooltip")).toHaveTextContent(text);
        }
        fireEvent.blur(tile);
        const future = getItemView(getGear(line[2]));
        const step = within(
            view.container.querySelector<HTMLElement>(".ui-armoury-line")!,
        ).getByRole("button", { name: future.name });
        fireEvent.focus(step);
        for (const text of [future.name, ...future.lines.map((l) => l.text)]) {
            expect(screen.getByRole("tooltip")).toHaveTextContent(text);
        }
        fireEvent.blur(step);
        const locked = view.container.querySelector<HTMLElement>(
            ".ui-armoury-tile.ui-card-locked",
        )!;
        fireEvent.focus(locked);
        expect(screen.getByRole("tooltip")).toHaveTextContent("Not found yet");
        fireEvent.click(locked);
        expect(locked).toHaveAttribute("aria-pressed", "true");
        expect(save.armoury[base.id]).toBe(1);
    });

    test("an Armoury piece still behind a map task says what unlocks it", () => {
        const { store } = renderHud();
        const piece = CASKET_GEAR.find((g) => g.unlock)!;
        act(() => store.set({ screen: "armoury", save: createSave() }));
        const tile = screen.getByRole("button", { name: `${piece.name} (not found yet)` });
        fireEvent.focus(tile);
        const tip = screen.getByRole("tooltip");
        expect(tip).toHaveTextContent(
            `${describeUnlockTask(piece.unlock!)} to find it in caskets.`,
        );
        expect(tip).not.toHaveTextContent("find it in a casket to upgrade it");
    });

    test("the Armoury catalogues show style, levels, unlocks and undiscovered evolutions", () => {
        const { store, view } = renderHud();
        const save = createSave();
        act(() => store.set({ screen: "armoury", save }));
        const armourTab = screen.getByRole("button", { name: "Armour" });
        const weaponsTab = screen.getByRole("button", { name: "Weapons" });
        expect(armourTab).toHaveAttribute("aria-pressed", "true");
        expect(weaponsTab).toHaveAttribute("aria-pressed", "false");
        expect(view.container.querySelectorAll(".ui-armoury-body")).toHaveLength(1);
        expect(view.container.querySelectorAll(".ui-armoury-details")).toHaveLength(1);
        // The key is on every tab, its "?" saying what it means there
        const legend = () => view.container.querySelector(".ui-armoury-legend")!;
        expect(legend()).toHaveTextContent("Very rare");
        expect(legend()).toHaveTextContent("Not found yet");
        fireEvent.click(screen.getByRole("button", { name: "Weapons" }));
        expect(weaponsTab).toHaveAttribute("aria-pressed", "true");
        expect(armourTab).toHaveAttribute("aria-pressed", "false");
        expect(legend()).toHaveTextContent("Very rare");
        expect(legend()).toHaveTextContent("Locked");
        expect(legend()).not.toHaveTextContent("Not found yet");
        expect(screen.queryByRole("button", { name: /Dragonfire shield/ })).not.toBeInTheDocument();
        expect(view.container.querySelectorAll(".ui-armoury-details")).toHaveLength(1);
        const groups = view.container.querySelectorAll(".ui-catalogue-group");
        expect(
            [...groups].map((group) => group.querySelector(".ui-armoury-slot-name")?.textContent),
        ).toEqual(["Melee", "Ranged", "Magic"]);
        const weapon = getWeapon("keris_partisan_of_breaching");
        // A screen reader hears that it's locked, as the "?" shows
        fireEvent.click(screen.getByRole("button", { name: `${weapon.name} (locked)` }));
        const detail = view.container.querySelector(".ui-armoury-details")!;
        expect(detail).toHaveTextContent(describeUnlockTask(weapon.unlock!));
        expect(detail).toHaveTextContent("Locked for offers and choices:");
        expect(detail).toHaveTextContent("Level 1");
        save.unlockedItems.push(weapon.id);
        act(() => store.set({ save: { ...save } }));
        expect(detail).toHaveTextContent("Unlocked for offers and choices by:");
        expect(screen.getByRole("button", { name: weapon.name })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Scimitar" }));
        expect(detail).toHaveTextContent("At max level, evolve with Piety: ???");
        expect(screen.queryByRole("button", { name: "Abyssal whip" })).not.toBeInTheDocument();
        save.evolutionsMade.push("abyssal_whip");
        act(() => store.set({ save: { ...save } }));
        expect(detail).toHaveTextContent("At max level, evolve with Piety: Abyssal whip");
        expect(screen.getByRole("button", { name: "Abyssal whip" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Passives" }));
        expect(legend()).toHaveTextContent("Locked");
        const passive = getPassive("divine_rune_pouch");
        fireEvent.click(screen.getByRole("button", { name: `${passive.name} (locked)` }));
        const passiveDetail = view.container.querySelector(".ui-armoury-details")!;
        expect(passiveDetail).toHaveTextContent(describeUnlockTask(passive.unlock!));
        expect(passiveDetail).toHaveTextContent("Gain per pick, regardless of rarity");
        expect(passiveDetail).toHaveTextContent("Maximum level: 1");
        expect(screen.getByText("All styles")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Armour" }));
        expect(armourTab).toHaveAttribute("aria-pressed", "true");
        expect(legend()).toHaveTextContent("Not found yet");
        expect(legend()).not.toHaveTextContent("Locked");
        expect(view.container.querySelectorAll(".ui-armoury-slots")).toHaveLength(1);
        expect(view.container.querySelectorAll(".ui-armoury-details")).toHaveLength(1);
        expect(view.container.querySelector(".ui-catalogue-group")).not.toBeInTheDocument();
    });

    test("pick-only weapons describe their character and level-up sources", () => {
        const { store, view } = renderHud();
        act(() => store.set({ screen: "armoury", save: createSave() }));
        fireEvent.click(screen.getByRole("button", { name: "Weapons" }));
        fireEvent.click(screen.getByRole("button", { name: "Rubber chicken" }));
        const detail = view.container.querySelector(".ui-armoury-details")!;
        expect(detail).toHaveTextContent("Starting weapon of Avian Assaulter");
        expect(detail).toHaveTextContent("Only on Thanksgiving Harvest");
        expect(detail).not.toHaveTextContent("Available from the start");
        fireEvent.click(screen.getByRole("button", { name: "Smoke Burst (locked)" }));
        expect(detail).toHaveTextContent("Choose from Ice Burst at level 2");
    });

    test("the bag is only dimmed where it's empty, overlay or not", () => {
        const { store, view } = renderHud();
        const item = getItemView(CASKET_GEAR[0]);
        const bag = () => [...view.container.querySelectorAll(".ui-inv-slot")];
        for (const overlay of ["none", "levelUp"] as const) {
            act(() =>
                store.set({
                    overlay,
                    hud: { ...hud([]), inventory: [{ item, count: 1 }, null, null, null] },
                }),
            );
            const [full, ...empty] = bag();
            expect(full).not.toHaveClass("ui-inv-slot-empty");
            expect(full).toHaveProperty("disabled", overlay !== "none");
            for (const slot of empty) {
                expect(slot).toHaveClass("ui-inv-slot-empty");
            }
        }
    });

    test("shows co-op's countdown while choosing and after the local player answers", () => {
        const { store, view } = renderHud();
        expect(view.queryByRole("timer")).toBeNull();
        act(() => {
            store.set({ overlay: "levelUp" });
            store.setNumbers(numbers({ decisionSeconds: 20 }));
        });
        expect(view.getByRole("timer").textContent).toBe("Party choosingAuto-choice in 20s");
        expect(view.getByRole("timer").getAttribute("aria-label")).toContain("20 seconds");
        act(() => {
            store.set({ overlay: "none", waitingOn: ["Teammate"] });
            store.setNumbers(numbers({ decisionSeconds: 5 }));
        });
        expect(view.getByRole("timer").className).toContain("ui-choice-countdown-soon");
        expect(view.getByRole("timer").textContent).toContain("5s");
        act(() => store.setNumbers(numbers({ decisionSeconds: 0 })));
        expect(view.getByRole("timer").textContent).toContain("0s");
        act(() => {
            store.set({ waitingOn: [] });
            store.setNumbers(numbers());
        });
        expect(view.queryByRole("timer")).toBeNull();
    });

    test("keeps the countdown up over a casket, an event and co-op's menu", () => {
        const { store, view } = renderHud();
        const chest: ChestView = {
            uid: 1,
            casketName: "Easy casket",
            casketObjId: 20546,
            tierColor: "#3fe03f",
            rarity: "common",
            coins: 10,
            item: getItemView(CASKET_GEAR[0]),
            isGear: true,
            canStash: false,
            carried: 0,
            instant: false,
            alchCoins: 5,
            recommended: "take",
            queued: 0,
        };
        const event: EventView = {
            uid: 2,
            name: "Drunken dwarf",
            speech: "Have a drink!",
            leaveLabel: "Leave",
            options: [{ title: "Beer", iconObjId: 1917, enabled: true }],
        };
        const overlays: Partial<UiSnapshot>[] = [
            { overlay: "chest", chest },
            { overlay: "event", event },
            { overlay: "paused" },
        ];
        for (const changes of overlays) {
            act(() => {
                store.set(changes);
                store.setNumbers(numbers({ decisionSeconds: 12 }));
            });
            const timer = view.getByRole("timer");
            expect(timer.textContent).toContain("12s");
            // GameUi.css makes room under it by the modal coming after it
            const modal = view.container.querySelector(".ui-modal")!;
            expect(modal.parentElement).toBe(timer.parentElement);
            expect(timer.compareDocumentPosition(modal)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        }
    });
});
