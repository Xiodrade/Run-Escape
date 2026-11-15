// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";

import { GameClient } from "../client/GameClient";
import {
    ChestView,
    ChoiceView,
    EventView,
    GameStore,
    HudNumbers,
    HudView,
    ItemView,
} from "../client/GameStore";
import { getItemView } from "../client/ItemViews";
import { getItem } from "../content/items";
import { DURATION_ICON, StatIconRef, statKeyIcon } from "../content/statIcons";
import { pairStats } from "../content/stats";
import { createSave } from "../core/save";
import { setLang, tp } from "../i18n";
import { ChestModal } from "./ChestModal";
import { ItemDescription } from "./DescriptionButton";
import { EventModal } from "./EventModal";
import { GameUi } from "./GameUi";
import { iconCache } from "./ItemIcon";

afterEach(() => {
    cleanup();
});

function createHud(): HudView {
    return {
        mapId: "lumbridge",
        level: 3,
        maxWeapons: 6,
        maxPassives: 6,
        weapons: [],
        passives: [],
        stats: [],
        gear: [],
        inventory: [null, null, null, null],
        rerolls: 0,
        banishes: 0,
    };
}

function createNumbers(): HudNumbers {
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
    };
}

function createChoice(changes: Partial<ChoiceView> = {}): ChoiceView {
    return {
        title: "Rune scimitar",
        text: "Fast slashing weapon",
        iconObjId: 1333,
        isNew: false,
        isEvolution: false,
        isHilt: false,
        isSpell: false,
        isBlessing: false,
        isKeris: false,
        banishable: false,
        banished: false,
        ...changes,
    };
}

function createMockClient(store: GameStore, overrides: Record<string, unknown> = {}): GameClient {
    const noop = () => {};
    const base = { store, input: { stick: {} }, ...overrides };
    return new Proxy(base, {
        get: (target, key) => (key in target ? target[key as keyof typeof target] : noop),
    }) as unknown as GameClient;
}

describe("stat icons on the screens that show stats", () => {
    test("level-up choice stats render StatLine icons, value diffs and spacers", () => {
        const store = new GameStore(createSave());
        const client = createMockClient(store);
        store.set({
            screen: "run",
            overlay: "levelUp",
            hud: createHud(),
            choices: [
                createChoice({
                    title: "Dragon scimitar",
                    stats: [
                        {
                            label: "Damage",
                            english: "Damage",
                            from: "10",
                            value: "13",
                            better: true,
                        },
                        {
                            label: "Attacks",
                            english: "Attacks",
                            from: "2.00/s",
                            value: "1.67/s",
                            better: false,
                        },
                    ],
                }),
                createChoice({
                    title: "Strength passive",
                    stats: [
                        {
                            label: "Damage",
                            english: "damage",
                            from: "+25%",
                            value: "+30%",
                            better: true,
                        },
                    ],
                }),
                createChoice({
                    title: "Mystery upgrade",
                    stats: [{ label: "Unknown bonus", english: "Unknown bonus", value: "+10" }],
                }),
            ],
        });
        store.setNumbers(createNumbers());
        const view = render(<GameUi store={store} client={client} />);

        const choiceStats = view.container.querySelectorAll(".ui-choice-stat");
        expect(choiceStats.length).toBe(4);

        // Weapon level up: Damage 10 -> 13
        expect(choiceStats[0]).toHaveClass("ui-stat-line");
        expect(choiceStats[0].querySelector(".ui-icon")).not.toBeNull();
        expect(choiceStats[0].textContent).toContain("Damage 10 → 13");
        expect(choiceStats[0].querySelector(".ui-choice-stat-up")?.textContent).toBe("13");

        // Weapon level up: Attacks 2.00/s -> 1.67/s
        expect(choiceStats[1]).toHaveClass("ui-stat-line");
        expect(choiceStats[1].querySelector(".ui-icon")).not.toBeNull();
        expect(choiceStats[1].textContent).toContain("Attacks 2.00/s → 1.67/s");
        expect(choiceStats[1].querySelector(".ui-choice-stat-down")?.textContent).toBe("1.67/s");

        // Passive level up: Damage +25% -> +30%
        expect(choiceStats[2]).toHaveClass("ui-stat-line");
        expect(choiceStats[2].querySelector(".ui-icon")).not.toBeNull();
        expect(choiceStats[2].textContent).toContain("Damage +25% → +30%");
        expect(choiceStats[2].querySelector(".ui-choice-stat-up")?.textContent).toBe("+30%");

        // Unknown stat: renders spacer
        expect(choiceStats[3]).toHaveClass("ui-stat-line");
        expect(choiceStats[3].querySelector(".ui-stat-spacer")).not.toBeNull();
        expect(choiceStats[3].textContent).toContain("Unknown bonus +10");
    });

    // A void top from a casket, against a worn piece or none
    function gearChest(replaces?: ChestView["replaces"]): ChestView {
        return {
            uid: 1,
            tierColor: "#ffd700",
            rarity: "rare",
            casketObjId: 2724,
            casketName: "Hard casket",
            coins: 100,
            alchCoins: 50,
            isGear: true,
            item: {
                id: "void_top",
                name: "Void knight top",
                objId: 8839,
                rarity: { name: "Rare", color: "#3fe03f" },
                kindLabel: "Body slot",
                lines: [{ text: "+10% damage" }, { text: "+2 armour" }],
                set: { text: "Void knight 2/4: 3 worn give +10% damage", active: false },
            },
            replaces,
            carried: 0,
            canStash: true,
            instant: false,
            recommended: "take",
            queued: 0,
        };
    }

    function renderChest(chest: ChestView) {
        const store = new GameStore(createSave());
        const client = createMockClient(store, { playChestSound: vi.fn() });
        const view = render(<ChestModal chest={chest} rerolls={0} banishes={0} client={client} />);
        // On to the card
        act(() => {
            vi.advanceTimersByTime(2500);
        });
        return view;
    }

    // A worn crystal body, its set's bonus on
    const crystalBody: ItemView = {
        id: "crystal_body",
        name: "Crystal body",
        objId: 23975,
        rarity: { name: "Rare", color: "#ff9a3d" },
        kindLabel: "Body slot",
        lines: [{ text: "+5% damage" }, { text: "+1 armour" }],
        set: { text: "Crystal armour 3/3: bonus on", active: true },
    };

    // The icon cache answers with the icon's own id, so a line's image says which it has: gives
    // the src an icon gets
    function iconsById(): (icon: StatIconRef | undefined) => string {
        vi.spyOn(iconCache, "get").mockImplementation((objId) => `obj:${objId}`);
        vi.spyOn(iconCache, "getSprite").mockImplementation((id) => `sprite:${id}`);
        vi.spyOn(iconCache, "request").mockImplementation(() => {});
        vi.spyOn(iconCache, "requestSprite").mockImplementation(() => {});
        return (icon) =>
            icon?.spriteId !== undefined ? `sprite:${icon.spriteId}` : `obj:${icon?.objId}`;
    }

    test("ChestModal renders gear's lines and set progress with StatLine", () => {
        vi.useFakeTimers();
        try {
            const view = renderChest(gearChest());

            const lines = view.container.querySelectorAll(".ui-chest-lines .ui-stat-line");
            expect(lines.length).toBe(2);
            expect(lines[0].textContent).toBe("+10% damage");
            expect(lines[0].querySelector(".ui-icon")).not.toBeNull();
            expect(lines[1].textContent).toBe("+2 armour");
            expect(lines[1].querySelector(".ui-icon")).not.toBeNull();

            const setLine = view.container.querySelector(".ui-chest-set .ui-stat-line");
            expect(setLine).not.toBeNull();
            expect(setLine?.textContent).toContain("Void knight 2/4");
            // Set line has spacer since "Void knight..." doesn't match an icon
            expect(setLine?.querySelector(".ui-stat-spacer")).not.toBeNull();
            expect(view.container.querySelector(".ui-chest-table")).toBeNull();
            expect(view.container.textContent).toContain("Nothing in your body slot yet.");
        } finally {
            vi.useRealTimers();
        }
    });

    test("ChestModal puts gear beside the worn piece, a row for each stat", () => {
        vi.useFakeTimers();
        try {
            const view = renderChest(
                gearChest({
                    item: crystalBody,
                    alchCoins: 10,
                    stats: [
                        {
                            key: "might",
                            label: "Damage",
                            worn: "+5%",
                            found: "+10%",
                            change: "+5%",
                            better: true,
                        },
                        {
                            key: "armor",
                            label: "Armour",
                            worn: "+1",
                            found: "+2",
                            change: "+1",
                            better: true,
                        },
                        {
                            key: "maxHp",
                            label: "Max hitpoints",
                            worn: "+5%",
                            found: "+5%",
                            better: true,
                        },
                        {
                            key: "speed",
                            label: "Projectile speed",
                            worn: "+15%",
                            change: "-15%",
                            better: false,
                        },
                    ],
                }),
            );

            // Its stats are in the table, not listed as well
            expect(view.container.querySelector(".ui-chest-lines")).toBeNull();
            const compare = view.container.querySelector(".ui-chest-compare")!;
            expect(compare.textContent).toContain("Crystal body");
            expect(compare.textContent).toContain("· Rare");
            expect(compare.textContent).toContain("(alched for 10 coins)");
            // Both pieces' sets: the found one's under its name, the worn one's in the comparison
            const sets = [...view.container.querySelectorAll(".ui-chest-set")];
            expect(sets.map((set) => set.textContent)).toEqual([
                "Void knight 2/4: 3 worn give +10% damage",
                "Crystal armour 3/3: bonus on",
            ]);
            expect(sets[1]).toHaveClass("ui-chest-set-on");

            const rows = [...view.container.querySelectorAll(".ui-chest-table tbody tr")];
            expect(rows.map((row) => [...row.children].map((cell) => cell.textContent))).toEqual([
                ["Damage", "+5%", "+10%", "(+5%)"],
                ["Armour", "+1", "+2", "(+1)"],
                ["Max hitpoints", "+5%", "+5%", ""],
                ["Projectile speed", "+15%", "—", "(-15%)"],
            ]);
            const tone = (row: Element) => [...row.children].slice(2).map((cell) => cell.className);
            expect(tone(rows[0])).toEqual(["ui-good", "ui-good"]);
            expect(tone(rows[2])).toEqual(["", ""]);
            expect(tone(rows[3])).toEqual(["ui-bad", "ui-bad"]);
            // The difference's column has a name for screen readers
            const headings = [...view.container.querySelectorAll(".ui-chest-table thead th")];
            expect(headings.map((th) => th.getAttribute("aria-label") ?? th.textContent)).toEqual([
                "Wearing",
                "New",
                "Difference",
            ]);
        } finally {
            vi.useRealTimers();
        }
    });

    test("the gear table gives each stat its icon in any language", () => {
        vi.useFakeTimers();
        const iconSrc = iconsById();
        try {
            setLang("pt-BR");
            const stats = pairStats(
                { might: 0.03, speed: 0.15 },
                { might: 0.05, maxHp: 0.13, armor: 1 },
            );
            // Nothing in the words to find an icon by
            expect(stats.map((pair) => pair.label)).toEqual([
                "Dano",
                "Armadura",
                "Pontos de vida máximos",
                "Velocidade de projétil",
            ]);
            const view = renderChest(gearChest({ item: crystalBody, alchCoins: 10, stats }));
            const rows = [...view.container.querySelectorAll(".ui-chest-table tbody tr")];
            expect(rows.map((row) => row.querySelector("th img")?.getAttribute("src"))).toEqual(
                stats.map((pair) => iconSrc(statKeyIcon(pair.key))),
            );
        } finally {
            setLang("en");
            vi.useRealTimers();
            vi.restoreAllMocks();
        }
    });

    test("a casket's potion shows its stats with their icons in any language, and how long they last", () => {
        vi.useFakeTimers();
        const iconSrc = iconsById();
        try {
            setLang("pt-BR");
            const store = new GameStore(createSave());
            const client = createMockClient(store, { playChestSound: vi.fn() });
            const item = getItemView(getItem("battlemage_potion"));
            const chest: ChestView = {
                uid: 1,
                tierColor: "#ffd700",
                rarity: "rare",
                casketObjId: 2724,
                casketName: "Hard casket",
                coins: 100,
                alchCoins: 50,
                isGear: false,
                item,
                carried: 0,
                canStash: true,
                instant: false,
                recommended: "take",
                queued: 0,
            };
            const view = render(
                <ChestModal chest={chest} rerolls={0} banishes={0} client={client} />,
            );
            act(() => {
                vi.advanceTimersByTime(2500);
            });
            const lines = [...view.container.querySelectorAll(".ui-chest-lines .ui-stat-line")];
            expect(lines.map((line) => line.textContent)).toEqual([
                ...item.lines.map((line) => line.text),
                tp("canvas.lasts", 30),
            ]);
            expect(lines.map((line) => line.querySelector("img")?.getAttribute("src"))).toEqual(
                [
                    statKeyIcon("armor"),
                    statKeyIcon("area"),
                    statKeyIcon("duration"),
                    DURATION_ICON,
                ].map(iconSrc),
            );
        } finally {
            setLang("en");
            vi.useRealTimers();
            vi.restoreAllMocks();
        }
    });

    test("EventModal renders reward and effect lines with StatLine", () => {
        const store = new GameStore(createSave());
        const client = createMockClient(store);
        const event: EventView = {
            uid: 10,
            name: "Supply chest",
            speech: "Spend your raid points on supplies.",
            leaveLabel: "Leave",
            options: [
                {
                    title: "Divine magic potion",
                    text: "+25% magic damage for 3 minutes.",
                    iconObjId: 23745,
                    price: 80,
                    sold: false,
                    enabled: true,
                },
                {
                    title: "Dwarf multicannon",
                    text: "Sets up a cannon that shoots everything nearby for 20 seconds.",
                    iconObjId: 6,
                    price: 60,
                    sold: false,
                    enabled: true,
                },
            ],
        };

        const view = render(<EventModal event={event} coins={200} client={client} />);

        const statLines = view.container.querySelectorAll(".ui-card-text .ui-stat-line");
        expect(statLines.length).toBe(2);

        // First option (+25% magic damage) resolves to magic icon
        expect(statLines[0].textContent).toBe("+25% magic damage for 3 minutes.");
        expect(statLines[0].querySelector(".ui-icon")).not.toBeNull();

        // Second option has spacer
        expect(statLines[1].textContent).toContain("Sets up a cannon");
        expect(statLines[1].querySelector(".ui-stat-spacer")).not.toBeNull();
    });

    test("the pause menu lists each slot's, the player's and worn gear's stats a line each", () => {
        const store = new GameStore(createSave());
        const client = createMockClient(store);
        store.set({
            screen: "run",
            overlay: "paused",
            hud: {
                ...createHud(),
                weapons: [
                    {
                        id: "rune_scimitar",
                        name: "Rune scimitar",
                        level: 2,
                        maxLevel: 8,
                        iconObjId: 1333,
                        detail: { text: "+15% damage" },
                        stats: [{ text: "Damage 13" }, { text: "Attacks 1.25/s" }],
                        rarityColor: "#fff",
                    },
                ],
                stats: [{ text: "+10% damage" }, { text: "+1 armour" }],
                gear: [
                    {
                        slot: "head",
                        name: "Head",
                        item: {
                            id: "void_mage_helm",
                            name: "Void mage helm",
                            objId: 11663,
                            rarity: { name: "Rare", color: "#0f0" },
                            kindLabel: "Head slot",
                            lines: [{ text: "+10% magic damage" }, { text: "+1 armour" }],
                            set: { text: "Void knight 2/4", active: false },
                        },
                    },
                ],
            },
        });
        store.setNumbers(createNumbers());
        const view = render(<GameUi store={store} client={client} />);

        const leftColumn = view.container.querySelector(".ui-pause-column")!;
        expect(leftColumn.firstElementChild).toHaveTextContent("Your stats");
        expect(leftColumn.children[1]).toHaveClass("ui-pause-stats");
        expect(leftColumn.children[2]).toHaveClass("ui-pause-loadout");
        expect(leftColumn.children[2]).toHaveTextContent("Rune scimitar");
        expect(leftColumn.children[3]).toHaveTextContent("Worn equipment");

        const [weapon, gear] = view.container.querySelectorAll(".ui-pause-item");
        const weaponLines = weapon.querySelectorAll(".ui-pause-detail > .ui-stat-line");
        expect([...weaponLines].map((line) => line.textContent)).toEqual([
            "Damage 13",
            "Attacks 1.25/s",
            "+15% damage",
        ]);
        for (const line of weaponLines) {
            expect(line.querySelector(".ui-icon")).not.toBeNull();
        }

        const stats = view.container.querySelectorAll(".ui-pause-stats > .ui-stat-line");
        expect([...stats].map((line) => line.textContent)).toEqual(["+10% damage", "+1 armour"]);

        // The name and its lines sit together beside the icon, as a slot's do
        expect(gear.querySelector(":scope > .ui-pause-name")?.textContent).toContain(
            "Void mage helm",
        );
        const gearLines = gear.querySelectorAll(".ui-pause-detail > .ui-stat-line");
        expect([...gearLines].map((line) => line.textContent)).toEqual([
            "+10% magic damage",
            "+1 armour",
        ]);
        const set = gear.querySelector(".ui-pause-set .ui-stat-line");
        expect(set?.textContent).toBe("Void knight 2/4");
        expect(set?.querySelector(".ui-stat-spacer")).not.toBeNull();
    });

    test("a description's set line lines up with its stats", () => {
        const view = render(
            <ItemDescription
                item={{
                    id: "void_mage_helm",
                    name: "Void mage helm",
                    objId: 11663,
                    rarity: { name: "Rare", color: "#0f0" },
                    kindLabel: "Head slot",
                    lines: [{ text: "+10% magic damage" }],
                    set: { text: "Void knight 2/4", active: true },
                }}
            />,
        );
        const lines = view.container.querySelectorAll(".ui-stat-line");
        expect([...lines].map((line) => line.textContent)).toEqual([
            "+10% magic damage",
            "Void knight 2/4",
        ]);
        expect(lines[1]).toHaveClass("ui-good");
        expect(lines[1].querySelector(".ui-stat-spacer")).not.toBeNull();
    });
});
