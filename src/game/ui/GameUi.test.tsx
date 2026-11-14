// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { GameClient } from "../client/GameClient";
import { GameStore } from "../client/GameStore";
import type { RoomView } from "../client/coop/protocol";
import { FALLEN_EMPIRE, isActOut } from "../content/acts";
import { getCharacter } from "../content/characters";
import { CombatStyle } from "../content/types";
import { buyUpgrade, createSave, refundUpgrade, refundUpgrades } from "../core/save";
import { GameUi } from "./GameUi";
import { PHONE_QUERY } from "./usePhoneLayout";

vi.mock("@foxglove/wasm-bz2/wasm/module.wasm?url", () => ({ default: "" }));

const device = vi.hoisted(() => ({ coarse: false }));

vi.mock("../../util/DeviceUtil", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../../util/DeviceUtil")>()),
    get isCoarsePointer() {
        return device.coarse;
    },
}));

afterEach(() => {
    cleanup();
    device.coarse = false;
});

function renderShop(upgrades: Record<string, number>, coins = 0, characterId = "warrior") {
    const save = createSave();
    save.coins = 1000000;
    for (const [id, ranks] of Object.entries(upgrades)) {
        for (let rank = 0; rank < ranks; rank++) {
            expect(buyUpgrade(save, id)).toBe(true);
        }
    }
    save.coins = coins;
    const store = new GameStore(save);
    store.set({ screen: "shop", characterId });
    const refresh = () => store.set({ save: { ...save } });
    const actions = {
        buyUpgrade: vi.fn((id: string, style: CombatStyle) => {
            buyUpgrade(save, id, style);
            refresh();
        }),
        refundUpgrade: vi.fn((id: string, style: CombatStyle) => {
            refundUpgrade(save, id, style);
            refresh();
        }),
        refundUpgrades: vi.fn((style: CombatStyle) => {
            refundUpgrades(save, style);
            refresh();
        }),
        playClick: vi.fn(),
    };
    render(<GameUi store={store} client={actions as unknown as GameClient} />);
    return { ...actions, save };
}

// Says yes to the question Refund all asks first
async function refundAll(): Promise<void> {
    fireEvent.click(screen.getByRole("button", { name: "Refund all" }));
    const dialog = await screen.findByRole("alertdialog");
    await act(async () => {
        fireEvent.click(within(dialog).getByRole("button", { name: "Refund all" }));
    });
}

test("skills explain how combat-style presets are used", () => {
    renderShop({});
    expect(screen.getByRole("tablist", { name: "Skill presets" })).toBeInTheDocument();
    expect(screen.getByText(/^Melee, Ranged and Magic are separate skill presets/)).toBeVisible();
    expect(screen.getByText(/^Each preset has its own balance/)).toBeVisible();
});

test("switching class pages keeps purchases and single-rank refunds isolated", async () => {
    expect.hasAssertions();
    const actions = renderShop({}, 50000);
    fireEvent.click(screen.getByRole("button", { name: /^Strength\b/ }));
    const melee = structuredClone(actions.save.skillPages.melee);
    fireEvent.click(screen.getByRole("tab", { name: "Ranged preset" }));
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Ranged preset");
    fireEvent.click(screen.getByRole("button", { name: /^Strength\b/ }));
    const ranged = structuredClone(actions.save.skillPages.ranged);
    fireEvent.click(screen.getByRole("tab", { name: "Magic preset" }));
    expect(screen.getByRole("button", { name: "Refund all" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^Strength\b/ }));
    fireEvent.contextMenu(screen.getByRole("button", { name: /^Strength\b/ }));
    expect(actions.refundUpgrade).toHaveBeenLastCalledWith("strength", "magic");
    expect(actions.save.skillPages.magic.upgrades).toEqual({});
    expect(actions.save.skillPages.melee).toEqual(melee);
    expect(actions.save.skillPages.ranged).toEqual(ranged);
    fireEvent.click(screen.getByRole("tab", { name: "Ranged preset" }));
    await refundAll();
    expect(actions.refundUpgrades).toHaveBeenLastCalledWith("ranged");
    expect(actions.save.skillPages.melee).toEqual(melee);
    fireEvent.click(screen.getByRole("tab", { name: "Melee preset" }));
    expect(screen.getByRole("button", { name: "Refund all" })).toBeEnabled();
}, 30000);

test("each page can afford the full gold budget after another class spends it", () => {
    expect.hasAssertions();
    const actions = renderShop({}, 10000);
    for (const label of ["Melee preset", "Ranged preset", "Magic preset"]) {
        fireEvent.click(screen.getByRole("tab", { name: label }));
        const card = screen.getByRole("button", { name: /^Ring of life\b/ });
        expect(card).not.toHaveClass("ui-card-dim");
        expect(document.querySelector(".ui-shop > .ui-row:last-child .ui-coins")).toHaveTextContent(
            "10",
        );
        fireEvent.click(card);
        expect(actions.save.coins).toBe(0);
    }
    for (const page of Object.values(actions.save.skillPages)) {
        expect(page.upgrades.ring_of_life).toBe(1);
        expect(page.upgradesSpent).toBe(10000);
    }
}, 30000);

test.each([
    ["warrior", "Melee preset"],
    ["ranger", "Ranged preset"],
    ["wizard", "Magic preset"],
])("skills open on %s's class page", (characterId, label) => {
    expect.hasAssertions();
    renderShop({}, 0, characterId);
    expect(screen.getByRole("tab", { name: label })).toHaveAttribute("aria-selected", "true");
});

test("class tabs support arrow keys and wrap without changing any skill pages", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 1 }, 50000);
    const before = structuredClone(actions.save);
    const melee = screen.getByRole("tab", { name: "Melee preset" });
    melee.focus();
    fireEvent.keyDown(melee, { key: "ArrowLeft" });
    const magic = screen.getByRole("tab", { name: "Magic preset" });
    expect(magic).toHaveFocus();
    expect(magic).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(magic, { key: "ArrowRight" });
    expect(melee).toHaveFocus();
    expect(actions.save).toEqual(before);
});

test("right-clicking a bought skill refunds one rank even without coins", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 2, hitpoints: 1 });
    const card = screen.getByRole("button", { name: /^Strength\b/ });
    expect(fireEvent.contextMenu(card)).toBe(false);
    expect(actions.refundUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
    expect(actions.refundUpgrades).not.toHaveBeenCalled();
});

test("maxed skills still accept right-clicks but cannot buy another rank", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 5 }, 50000);
    const card = screen.getByRole("button", { name: /^Strength\b/ });
    expect(card).toHaveAttribute("aria-disabled", "true");
    expect(card).toHaveTextContent("Maxed");
    fireEvent.click(card);
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
    expect(fireEvent.contextMenu(card)).toBe(false);
    expect(actions.refundUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
});

test("right-clicking an unbought skill does not refund or purchase it", () => {
    expect.hasAssertions();
    const actions = renderShop({});
    expect(fireEvent.contextMenu(screen.getByRole("button", { name: /^Strength\b/ }))).toBe(true);
    expect(actions.refundUpgrade).not.toHaveBeenCalled();
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
});

test("left-clicking still buys a rank", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 1 }, 50000);
    fireEvent.click(screen.getByRole("button", { name: /^Strength\b/ }));
    expect(actions.buyUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
    expect(actions.refundUpgrade).not.toHaveBeenCalled();
});

test("the visible refund button refunds one bought rank without purchasing", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 2 });
    const refund = screen.getByRole("button", { name: "Refund one Strength rank" });
    expect(refund).toHaveAttribute("title", "Refund one Strength rank");
    expect(refund.closest(".ui-shop-card")).toBeNull();
    fireEvent.click(refund);
    expect(actions.refundUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
    expect(actions.refundUpgrades).not.toHaveBeenCalled();
});

test("maxed skills retain their visible refund button", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 5 });
    fireEvent.click(screen.getByRole("button", { name: "Refund one Strength rank" }));
    expect(actions.refundUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
});

test("unbought skills have no refund button", () => {
    expect.hasAssertions();
    renderShop({});
    expect(screen.queryByRole("button", { name: "Refund one Strength rank" })).toBeNull();
});

test("Refund all asks first, and cancelling leaves everything as it was", async () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Refund all" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(actions.refundUpgrades).not.toHaveBeenCalled();
    await act(async () => {
        fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    });
    expect(actions.refundUpgrades).not.toHaveBeenCalled();
    expect(actions.save.skillPages.melee.upgrades).toEqual({ strength: 2 });
});

test("an out-of-reach skill says how much it's short, and a maxed one doesn't look out of reach", () => {
    expect.hasAssertions();
    renderShop({ strength: 5 }, 0);
    const maxed = screen.getByRole("button", { name: /^Strength\b/ });
    expect(maxed).toHaveClass("ui-shop-card-maxed");
    expect(maxed).not.toHaveClass("ui-card-dim");
    const short = screen.getByRole("button", { name: /^Ring of life\b/ });
    expect(short).toHaveClass("ui-card-dim");
    expect(short).toHaveTextContent(/short/);
});

test("Refund all clears ranks that have no spending recorded", async () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 2 });
    actions.save.skillPages.melee.upgradesSpent = 0;
    fireEvent.click(screen.getByRole("tab", { name: "Ranged preset" }));
    fireEvent.click(screen.getByRole("tab", { name: "Melee preset" }));
    await refundAll();
    expect(actions.refundUpgrades).toHaveBeenCalledExactlyOnceWith("melee");
    expect(actions.save.skillPages.melee.upgrades).toEqual({});
    expect(screen.queryByRole("button", { name: "Refund one Strength rank" })).toBeNull();
});

test("touch long presses do not refund, but the refund button still works", () => {
    expect.hasAssertions();
    device.coarse = true;
    const actions = renderShop({ strength: 2 });
    const card = screen.getByRole("button", { name: /^Strength\b/ });
    expect(fireEvent.contextMenu(card)).toBe(false);
    expect(actions.refundUpgrade).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Refund one Strength rank" }));
    expect(actions.refundUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
});

test("bought cards expose the desktop right-click shortcut in a tooltip", () => {
    expect.hasAssertions();
    renderShop({ strength: 1 });
    expect(screen.getByRole("button", { name: /^Strength\b/ })).toHaveAttribute(
        "title",
        "Right-click to refund one rank",
    );
});

test("unaffordable skills cannot purchase but can refund a bought rank", () => {
    expect.hasAssertions();
    const actions = renderShop({ strength: 1 });
    const card = screen.getByRole("button", { name: /^Strength\b/ });
    expect(card).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(card);
    expect(actions.buyUpgrade).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Refund one Strength rank" }));
    expect(actions.refundUpgrade).toHaveBeenCalledExactlyOnceWith("strength", "melee");
});

function renderMaps(mapId = "lumbridge", save = createSave()) {
    const store = new GameStore(save);
    store.set({ screen: "characters", mapId });
    const actions = {
        selectMap: vi.fn((id: string) => store.set({ mapId: id })),
        selectCharacter: vi.fn((id: string) => store.set({ characterId: id })),
        startRun: vi.fn(),
        showScreen: vi.fn(),
        toggleFavouriteCharacter: vi.fn(),
        playClick: vi.fn(),
        selectPet: vi.fn(),
        selectCardsOnlyPet: vi.fn(),
        setCardsOnly: vi.fn(),
    };
    render(<GameUi store={store} client={actions as unknown as GameClient} />);
    return actions;
}

// A phone held sideways, as Mobile.css's query sees it (jsdom has no matchMedia of its own)
function asPhone(): void {
    vi.stubGlobal(
        "matchMedia",
        (query: string) =>
            ({
                matches: query === PHONE_QUERY,
                media: query,
                addEventListener: () => {},
                removeEventListener: () => {},
            }) as unknown as MediaQueryList,
    );
}

test("a phone sets a run up from what's picked, with each list over the whole screen", () => {
    expect.hasAssertions();
    asPhone();
    try {
        const actions = renderMaps();
        const press = (code: string) => fireEvent.keyDown(window, { code });
        // What's picked, and no list till a card's opened
        expect(screen.queryByRole("tablist")).toBeNull();
        expect(screen.getByRole("button", { name: /Enter Lumbridge/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Change map: Lumbridge" }));
        fireEvent.click(screen.getByRole("tab", { name: "Bosses" }));
        fireEvent.click(screen.getByRole("button", { name: "Theatre of Blood" }));
        expect(actions.selectMap).toHaveBeenCalledExactlyOnceWith("theatre_of_blood");
        // Picking keeps the list open, to read about what's picked; Done goes back
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(screen.queryByRole("tablist")).toBeNull();
        expect(screen.getByRole("button", { name: "Change map: Theatre of Blood" })).toBeVisible();
        expect(screen.getByRole("button", { name: /Enter Theatre of Blood/ })).toBeInTheDocument();
        // The adventurers, with their pet and relics, the same way
        const other = getCharacter(createSave().unlockedCharacters[1]);
        fireEvent.click(screen.getByRole("button", { name: /^Change adventurer: / }));
        fireEvent.click(screen.getByRole("button", { name: other.name }));
        expect(actions.selectCharacter).toHaveBeenCalledExactlyOnceWith(other.id);
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(
            screen.getByRole("button", { name: `Change adventurer: ${other.name}` }),
        ).toBeVisible();
        // A list's Escape and Enter only close it; the run setup's go back and start
        fireEvent.click(screen.getByRole("button", { name: /^Change map: / }));
        press("Escape");
        expect(screen.queryByRole("tablist")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /^Change map: / }));
        press("Enter");
        expect(screen.queryByRole("tablist")).toBeNull();
        expect(actions.startRun).not.toHaveBeenCalled();
        expect(actions.showScreen).not.toHaveBeenCalled();
        press("Enter");
        expect(actions.startRun).toHaveBeenCalledOnce();
        press("Escape");
        expect(actions.showScreen).toHaveBeenCalledExactlyOnceWith("title");
    } finally {
        vi.unstubAllGlobals();
    }
}, 30000);

function renderRoom(you: string) {
    const store = new GameStore(createSave());
    const room: RoomView = {
        code: "TESTROOM",
        name: "Party",
        open: false,
        hostId: "alice",
        mapId: "lumbridge",
        endless: false,
        hard: false,
        started: false,
        members: [
            { id: "alice", name: "Alice", characterId: "warrior", ready: false },
            { id: "bob", name: "Bob", characterId: "wizard", ready: true },
        ],
    };
    const setRoom = (change: Partial<RoomView>) => {
        const coop = store.getSnapshot().coop;
        store.set({ coop: { ...coop, room: { ...coop.room!, ...change } } });
    };
    store.set({ screen: "coop", coop: { ...store.getSnapshot().coop, you, anyMap: true, room } });
    const actions = {
        selectMap: vi.fn((mapId: string) => setRoom({ mapId })),
        selectCharacter: vi.fn((id: string) => store.set({ characterId: id })),
        setCoopReady: vi.fn(),
        startCoopRun: vi.fn(),
        leaveRoom: vi.fn(),
        toggleFavouriteCharacter: vi.fn(),
        playClick: vi.fn(),
    };
    render(<GameUi store={store} client={actions as unknown as GameClient} />);
    return actions;
}

test("a phone's co-op room opens the same lists, and only the host's map card opens one", () => {
    expect.hasAssertions();
    asPhone();
    try {
        const actions = renderRoom("alice");
        const press = (code: string) => fireEvent.keyDown(window, { code });
        // The party, the map and your adventurer, and no list till a card's opened
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Theatre of Blood" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Change map: Lumbridge" }));
        fireEvent.click(screen.getByRole("button", { name: "Theatre of Blood" }));
        expect(actions.selectMap).toHaveBeenCalledExactlyOnceWith("theatre_of_blood");
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(screen.queryByRole("button", { name: "Lumbridge" })).toBeNull();
        expect(screen.getByRole("button", { name: "Change map: Theatre of Blood" })).toBeVisible();
        const other = getCharacter(createSave().unlockedCharacters[1]);
        fireEvent.click(screen.getByRole("button", { name: /^Change adventurer: / }));
        fireEvent.click(screen.getByRole("button", { name: other.name }));
        expect(actions.selectCharacter).toHaveBeenCalledExactlyOnceWith(other.id);
        // Escape and Enter close a list, and nothing else
        press("Escape");
        expect(
            screen.getByRole("button", { name: `Change adventurer: ${other.name}` }),
        ).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: /^Change map: / }));
        press("Enter");
        expect(screen.queryByRole("button", { name: "Lumbridge" })).toBeNull();
        expect(actions.leaveRoom).not.toHaveBeenCalled();
        expect(actions.setCoopReady).not.toHaveBeenCalled();
        expect(actions.startCoopRun).not.toHaveBeenCalled();
        cleanup();
        // A guest sees the host's map, and can't open the list
        renderRoom("bob");
        expect(screen.getByText("Lumbridge")).toBeInTheDocument();
        expect(screen.getByText("picked by the host")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^Change map: / })).toBeNull();
        expect(screen.getByRole("button", { name: /^Change adventurer: / })).toBeVisible();
    } finally {
        vi.unstubAllGlobals();
    }
}, 30000);

test("the map screen opens on the picked map's tab, and a map on another tab can be picked", () => {
    expect.hasAssertions();
    const actions = renderMaps();
    expect(screen.getByRole("tab", { name: "Act I" })).toHaveAttribute("aria-selected", "true");
    // The other tabs' maps are laid out, but out of reach
    expect(screen.getByRole("button", { name: "Lumbridge" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Theatre of Blood" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Bosses" }));
    expect(screen.queryByRole("button", { name: "Lumbridge" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Theatre of Blood" }));
    expect(actions.selectMap).toHaveBeenCalledExactlyOnceWith("theatre_of_blood");
    expect(screen.getByRole("button", { name: /Enter Theatre of Blood/ })).toBeInTheDocument();
    cleanup();
    renderMaps("theatre_of_blood");
    expect(screen.getByRole("tab", { name: "Bosses" })).toHaveAttribute("aria-selected", "true");
}, 30000);

test("Thanksgiving map selection has its autumn theme", () => {
    renderMaps();
    // Seasonal maps are on the Fun tab, under the fun maps
    fireEvent.click(screen.getByRole("tab", { name: "Fun" }));
    const thanksgiving = screen.getByRole("button", { name: "Thanksgiving Harvest" });
    const mapPanel = document.querySelector(".ui-select-maps")!;
    expect(thanksgiving).toHaveClass("ui-map-tile-thanksgiving");
    fireEvent.mouseMove(thanksgiving);
    expect(mapPanel).toHaveClass("ui-select-maps-thanksgiving");
    expect(document.querySelector(".ui-select-details-thanksgiving")).not.toBeNull();
    fireEvent.mouseMove(screen.getByRole("button", { name: "Hallowed Night" }));
    expect(mapPanel).not.toHaveClass("ui-select-maps-thanksgiving");
    expect(document.querySelector(".ui-select-details-thanksgiving")).toBeNull();
});

test("the Avian Assaulter is only Thanksgiving's, and shown there with what they do", () => {
    renderMaps();
    // Not in the roster, to pick or to count
    expect(screen.queryByRole("button", { name: "Avian Assaulter" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Fun" }));
    fireEvent.click(screen.getByRole("button", { name: "Thanksgiving Harvest" }));
    expect(document.querySelector(".ui-select-adventurers .ui-card-title")).toHaveTextContent(
        "Avian Assaulter",
    );
    expect(document.querySelector(".ui-select-adventurers .ui-card-style")).toHaveTextContent(
        "Melee",
    );
    expect(screen.getByText(getCharacter("avian_assaulter").description)).toBeInTheDocument();
    expect(screen.getByText("+15% damage against birds")).toBeInTheDocument();
});

test("Thanksgiving fixes the adventurer as the Avian Assaulter, and other maps don't", () => {
    const actions = renderMaps();
    const enter = () => screen.getByRole("button", { name: /Enter / });
    fireEvent.click(screen.getByRole("tab", { name: "Fun" }));
    fireEvent.click(screen.getByRole("button", { name: "Thanksgiving Harvest" }));
    expect(enter()).toBeEnabled();
    expect(document.querySelector(".ui-select-fixed-note")).toHaveTextContent("Avian Assaulter");
    fireEvent.click(enter());
    expect(actions.startRun).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("tab", { name: "Act I" }));
    fireEvent.click(screen.getByRole("button", { name: "Lumbridge" }));
    expect(document.querySelector(".ui-select-fixed-note")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Warrior" }));
    expect(enter()).toBeEnabled();
});

test("the Thanksgiving map keeps its theme when selected and no longer hovered", () => {
    renderMaps("thanksgiving");
    const mapPanel = document.querySelector(".ui-select-maps")!;
    fireEvent.mouseLeave(mapPanel);
    expect(mapPanel).toHaveClass("ui-select-maps-thanksgiving");
});

test("the favourite button is the shown adventurer's, and stays as focus moves to it", () => {
    expect.hasAssertions();
    const actions = renderMaps();
    const shown = () =>
        document.querySelector(".ui-select-adventurers .ui-card-title")?.textContent;
    // Focus on an adventurer who isn't the one picked shows theirs
    const ranger = screen.getByRole("button", { name: "Ranger" });
    fireEvent.focus(ranger);
    expect(shown()).toBe("Ranger");
    const favourite = screen.getByRole("button", { name: "Make favourite" });
    // Going on to their button keeps them, and the button with them
    fireEvent.focusOut(ranger, { relatedTarget: favourite });
    expect(shown()).toBe("Ranger");
    expect(favourite).toBeInTheDocument();
    fireEvent.click(favourite);
    expect(actions.toggleFavouriteCharacter).toHaveBeenCalledExactlyOnceWith("ranger");
    // Leaving the panel goes back to the one picked
    fireEvent.focusOut(favourite, { relatedTarget: screen.getByRole("tab", { name: "Act I" }) });
    expect(shown()).toBe("Warrior");
    // None for one who isn't open yet
    fireEvent.focus(document.querySelector(".ui-select-adventurers .ui-card-locked")!);
    expect(screen.queryByRole("button", { name: "Make favourite" })).toBeNull();
});

test("Cards only marks the adventurers it can't start as, still pickable", () => {
    expect.hasAssertions();
    // Enough cards to fill a level up, but not the warrior's starting weapon's
    const cards = {
        "weapon:two_handed_sword": 1,
        "weapon:throwing_knives": 1,
        "weapon:fire_spells": 1,
        "weapon:shortbow": 1,
        "weapon:dark_bow": 1,
        "passive:rapid_heal": 1,
        "passive:graceful": 1,
        "passive:amulet_of_glory": 1,
    };
    renderMaps("lumbridge", { ...createSave(), cardsOnly: true, cards });
    const warrior = screen.getByRole("button", { name: "Warrior, locked for Cards only" });
    expect(warrior).toHaveClass("ui-tile-cards-locked");
    expect(warrior.querySelector(".ui-tile-lock")).not.toBeNull();
    expect(warrior).toBeEnabled();
    // The wizard starts with the fire spells, whose card's owned
    expect(screen.getByRole("button", { name: "Wizard" })).not.toHaveClass("ui-tile-cards-locked");
    expect(screen.getByText("Locked for Cards only: needs the Scimitar card.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enter Lumbridge/ })).toBeDisabled();
    cleanup();
    // Off, nothing's marked
    renderMaps("lumbridge", { ...createSave(), cards });
    expect(screen.getByRole("button", { name: "Warrior" })).not.toHaveClass("ui-tile-cards-locked");
    expect(document.querySelector(".ui-tile-lock")).toBeNull();
});

test("the pet row picks Cards only's pet from pets with their card, when the run is one", () => {
    expect.hasAssertions();
    const cards = {
        "weapon:scimitar": 1,
        "weapon:two_handed_sword": 1,
        "weapon:throwing_knives": 1,
        "weapon:shortbow": 1,
        "passive:rapid_heal": 1,
        "passive:graceful": 1,
        "passive:amulet_of_glory": 1,
        "trophy:little_nightmare": 1,
    };
    const save = { ...createSave(), trophies: ["butch"], pet: "butch", cards };
    const actions = renderMaps("lumbridge", { ...save, cardsOnly: true });
    expect(screen.getByText("Pet for Cards only:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Little Nightmare, Card" }));
    expect(actions.selectCardsOnlyPet).toHaveBeenCalledWith("little_nightmare");
    const butch = screen.getByRole("button", { name: "Butch, needs its card for Cards only" });
    expect(butch).toHaveAttribute("aria-disabled", "true");
    expect(actions.selectPet).not.toHaveBeenCalled();
    cleanup();
    // A normal run: the found pets, as before, and no card pet
    renderMaps("lumbridge", save);
    expect(screen.getByText("Pet:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Butch" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Little Nightmare/ })).toBeNull();
});

test("the adventurer panel's tabs pick Cards only or the usual, saying which is on", () => {
    expect.hasAssertions();
    const actions = renderMaps("lumbridge");
    const normal = screen.getByRole("button", { name: "Adventurers" });
    const cardsOnly = screen.getByRole("button", { name: "Cards only" });
    expect(normal).toHaveAttribute("aria-pressed", "true");
    expect(cardsOnly).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(cardsOnly);
    expect(actions.setCardsOnly).toHaveBeenCalledWith(true);
    cleanup();
    // On it with every card a run needs: a line says runs from it are Cards only
    const full = {
        "weapon:scimitar": 1,
        "weapon:two_handed_sword": 1,
        "weapon:throwing_knives": 1,
        "weapon:shortbow": 1,
        "weapon:dark_bow": 1,
        "passive:rapid_heal": 1,
        "passive:graceful": 1,
        "passive:amulet_of_glory": 1,
    };
    renderMaps("lumbridge", { ...createSave(), cardsOnly: true, cards: full });
    expect(screen.getByRole("button", { name: "Cards only" })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
    expect(screen.getByText("Runs from this tab are Cards only.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enter Lumbridge/ })).toBeEnabled();
    cleanup();
    // Short of cards: no run starts from it, never a normal one in its place
    renderMaps("lumbridge", { ...createSave(), cardsOnly: true, cards: { "weapon:scimitar": 1 } });
    expect(screen.getByRole("button", { name: /Enter Lumbridge/ })).toBeDisabled();
});

test("Cards only's button says what's short and opens the window of what's needed", () => {
    expect.hasAssertions();
    renderMaps("lumbridge", { ...createSave(), cardsOnly: true, cards: { "weapon:scimitar": 1 } });
    const button = screen.getByRole("button", {
        name: "Need 2 more weapon cards and 3 more passive cards",
    });
    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: "Cards only: what you need" })).toBeInTheDocument();
    fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
});

test("a map's own adventurer has no favourite button", () => {
    expect.hasAssertions();
    renderMaps("falador");
    expect(document.querySelector(".ui-select-adventurers .ui-card-title")?.textContent).toBe(
        "Durial321",
    );
    expect(screen.queryByRole("button", { name: "Make favourite" })).toBeNull();
});

test("map tabs support arrow keys and wrap", () => {
    expect.hasAssertions();
    renderMaps();
    const actOne = screen.getByRole("tab", { name: "Act I" });
    actOne.focus();
    fireEvent.keyDown(actOne, { key: "ArrowRight" });
    // Act II is beside Act I, once it's out (ActDef.released); Bosses until then
    const next = isActOut(FALLEN_EMPIRE) ? "Act II" : "Bosses";
    const beside = screen.getByRole("tab", { name: next });
    expect(beside).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(next);
    fireEvent.keyDown(beside, { key: "ArrowLeft" });
    fireEvent.keyDown(actOne, { key: "ArrowLeft" });
    expect(screen.getAllByRole("tab").at(-1)).toHaveFocus();
});

function renderTitle(runs: number, lastExported?: number) {
    const save = { ...createSave(), runs, lastExported };
    const store = new GameStore(save);
    store.set({ screen: "title" });
    const client = {
        // Stands in for GameClient once the file's kept: the stamp and the save's write are
        // GameClient.test.ts's to check, and this only that the bar goes by the store's save
        exportSave: vi.fn(() => {
            store.set({ save: { ...store.getSnapshot().save, lastExported: Date.now() } });
        }),
        playClick: vi.fn(),
    };
    render(<GameUi store={store} client={client as unknown as GameClient} />);
    return { client, store };
}

test("the title has the sound's orb, which says whether the sound's on", () => {
    const { store } = renderTitle(3);
    expect(screen.getByRole("button", { name: "Sound on: turn it off" })).toBeInTheDocument();
    act(() => store.set({ audio: { ...store.getSnapshot().audio, muted: true } }));
    expect(screen.getByRole("button", { name: "Sound off: turn it on" })).toBeInTheDocument();
});

test("Tab reaches Singleplayer before the title's other buttons, the sound's orb included", () => {
    renderTitle(3);
    expect(screen.getAllByRole("button")[0]).toHaveTextContent("Singleplayer");
});

describe("the title's export reminder", () => {
    // Its own, as Node 25 and later have a localStorage that hides jsdom's
    beforeEach(() => {
        const items = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => items.get(key) ?? null,
            setItem: (key: string, value: string) => void items.set(key, value),
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    test("isn't there for a new player, or once the save's been exported today", () => {
        expect.hasAssertions();
        renderTitle(0);
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
        cleanup();
        renderTitle(4, Date.now());
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
    });

    test("exports, and then goes", () => {
        expect.hasAssertions();
        const { client } = renderTitle(4);
        fireEvent.click(screen.getByRole("button", { name: "Export save" }));
        expect(client.exportSave).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
    });

    test("put off, it stays gone for the day, here and after a reload", () => {
        expect.hasAssertions();
        const { client } = renderTitle(4, Date.now() - 3 * 24 * 60 * 60 * 1000);
        expect(screen.getByText(/^Last exported/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Not today" }));
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
        expect(client.exportSave).not.toHaveBeenCalled();
        cleanup();
        renderTitle(4);
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
    });

    test("waits while the game isn't saving", () => {
        expect.hasAssertions();
        const { store } = renderTitle(4);
        expect(screen.getByRole("button", { name: "Export save" })).toBeInTheDocument();
        act(() => store.set({ saveBlock: { kind: "otherTab" }, saveBlockClosed: true }));
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
    });

    test("has language button that opens settings with language controls", () => {
        expect.hasAssertions();
        renderTitle(0);
        const langBtn = screen.getByRole("button", { name: "Language" });
        expect(langBtn).toBeInTheDocument();
        fireEvent.click(langBtn);
        expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
        // With its translator under its name
        expect(
            screen.getByRole("button", { name: "Português (BR) Translated by Iakee" }),
        ).toBeInTheDocument();
    });

    test("goes while cloud save has a copy, and comes back when it stops keeping one", () => {
        expect.hasAssertions();
        const { store } = renderTitle(4);
        act(() => store.set({ cloud: { code: CLOUD_CODE, syncedAt: 5, working: false } }));
        expect(screen.queryByRole("button", { name: "Export save" })).toBeNull();
        // A code that's stopped working (unused for weeks, or replaced on another device)
        act(() =>
            store.set({
                cloud: { code: CLOUD_CODE, syncedAt: 5, working: false, problem: "unknownCode" },
            }),
        );
        expect(screen.getByRole("button", { name: "Export save" })).toBeInTheDocument();
        // On, but never synced
        act(() => store.set({ cloud: { code: CLOUD_CODE, working: false } }));
        expect(screen.getByRole("button", { name: "Export save" })).toBeInTheDocument();
    });
});

const CLOUD_CODE = "K7Q2-M9XD-4TPA-W3RN-H8BE-6FZC";

describe("cloud save's choice on the title", () => {
    const choice = { cloud: { revision: 2 }, newer: false, closed: false };
    // The export reminder's, as above
    beforeEach(() => {
        const items = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => items.get(key) ?? null,
            setItem: (key: string, value: string) => void items.set(key, value),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    function renderCloudTitle() {
        const store = new GameStore({ ...createSave(), runs: 4 });
        const view = { code: CLOUD_CODE, syncedAt: 5, working: false };
        store.set({ screen: "title", cloud: view });
        const setChoice = (closed: boolean) =>
            store.set({ cloud: { ...view, choice: { ...choice, closed } } });
        const sync = {
            later: vi.fn(() => setChoice(true)),
            reopenChoice: vi.fn(() => setChoice(false)),
            useCloud: vi.fn(),
            keepLocal: vi.fn(),
            check: vi.fn(),
        };
        const client = { cloud: sync, playClick: vi.fn() };
        render(<GameUi store={store} client={client as unknown as GameClient} />);
        return { setChoice, sync };
    }
    const asking = () => screen.queryByRole("heading", { name: "Which save do you want?" });
    const panel = () => screen.queryByRole("heading", { name: "Cloud save" });

    test("shows over cloud save's own panel, and Escape puts it off before closing that", () => {
        expect.hasAssertions();
        const { setChoice, sync } = renderCloudTitle();
        fireEvent.click(screen.getByRole("button", { name: /^Cloud save:/ }));
        expect(panel()).toBeInTheDocument();
        // A code linked there, or Sync now, finds a different save
        act(() => setChoice(false));
        expect(asking()).toBeInTheDocument();
        expect(panel()).toBeInTheDocument();
        fireEvent.keyDown(window, { code: "Escape" });
        expect(sync.later).toHaveBeenCalledTimes(1);
        expect(asking()).toBeNull();
        expect(panel()).toBeInTheDocument();
        // Choose, from the panel's Two saves row, shows it again
        fireEvent.click(screen.getByRole("button", { name: "Choose" }));
        expect(asking()).toBeInTheDocument();
        fireEvent.keyDown(window, { code: "Escape" });
        fireEvent.keyDown(window, { code: "Escape" });
        expect(panel()).toBeNull();
    });

    test("shows over Settings too", () => {
        expect.hasAssertions();
        const { setChoice } = renderCloudTitle();
        fireEvent.click(screen.getByRole("button", { name: "Settings" }));
        act(() => setChoice(false));
        expect(asking()).toBeInTheDocument();
    });
});

describe("the Wardrobe", () => {
    // An old save keeps the retired Dwarf unlocked, and the game has no adventurer for it
    test("steps through the roster's adventurers, never a retired one", () => {
        expect.hasAssertions();
        const save = createSave();
        save.unlockedCharacters.push("dwarf");
        const store = new GameStore(save);
        store.set({ screen: "wardrobe" });
        const picked: string[] = [];
        const client = new Proxy(
            {
                selectCharacter: vi.fn((id: string) => {
                    picked.push(id);
                    store.set({ characterId: id });
                }),
            },
            { get: (target, key) => target[key as keyof typeof target] ?? vi.fn() },
        );
        render(<GameUi store={store} client={client as unknown as GameClient} />);
        const next = screen.getByRole("button", { name: "Next adventurer" });
        for (let i = 0; i < save.unlockedCharacters.length + 1; i++) {
            fireEvent.click(next);
        }
        expect(picked).not.toContain("dwarf");
        // Round them all and back to the first
        expect(new Set(picked).size).toBe(save.unlockedCharacters.length - 1);
        expect(screen.getByRole("button", { name: "Next adventurer" })).toBeInTheDocument();
    });
});
