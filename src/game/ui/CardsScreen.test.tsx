// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import { GameClient } from "../client/GameClient";
import { UiSnapshot } from "../client/GameStore";
import {
    CARDS,
    CARD_BY_ID,
    PACK_BY_ID,
    PACK_SIZE,
    PackDef,
    packName,
    packRarityShares,
} from "../content/cards";
import { getMap, mapName } from "../content/maps";
import { buyCardPack, openCardPack, packPool } from "../core/cards";
import { SaveData, createSave } from "../core/save";
import { CardsScreen } from "./CardsScreen";

afterEach(cleanup);

// The screen over a save that the client's packs change, as GameClient's do
function Harness({
    start,
    showScreen = vi.fn(),
}: {
    start: SaveData;
    showScreen?: () => void;
}): JSX.Element {
    const [save, setSave] = useState(start);
    const client = {
        showScreen,
        revealCard: vi.fn(),
        openCardPack: () => {
            const next = structuredClone(save);
            const cards = openCardPack(next, () => 0.5);
            setSave(next);
            return cards;
        },
        buyCardPack: (pack: PackDef) => {
            const next = structuredClone(save);
            const cards = buyCardPack(next, pack, () => 0.5);
            setSave(next);
            return cards;
        },
    };
    return (
        <CardsScreen
            ui={{ save } as unknown as UiSnapshot}
            client={client as unknown as GameClient}
        />
    );
}

const scimitar = CARD_BY_ID.get("weapon:scimitar")!;

test("keeps a card not found face down, and shows a found one with its versions in words", () => {
    render(
        <Harness
            start={{
                ...createSave(),
                cardPacks: 0,
                cards: { [scimitar.id]: 3, [`${scimitar.id}@rare`]: 1 },
            }}
        />,
    );
    expect(screen.getAllByRole("button", { name: /not found yet$/ })).toHaveLength(
        CARDS.length - 1,
    );
    fireEvent.click(screen.getByRole("button", { name: scimitar.name() }));
    expect(screen.getByText("Yours: Common x3 and Rare x1")).toBeInTheDocument();
    expect(screen.getByText("Collected 1 / " + CARDS.length)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /free pack/ })).not.toBeInTheDocument();
});

// Turn all over deals one card after another: the rest of them, on fake time
function turnAll() {
    fireEvent.click(screen.getByRole("button", { name: "Turn all over" }));
    // A card a step: each deal sets the next one's timer
    for (let i = 0; i <= PACK_SIZE; i++) {
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    }
}

test("opens the free pack as a deck on the mat, dealing a card each press, and puts them in the album", () => {
    vi.useFakeTimers();
    try {
        render(<Harness start={createSave()} />);
        fireEvent.click(screen.getByRole("button", { name: "Open your free pack (1)" }));
        const mat = screen.getByRole("dialog");
        fireEvent.click(screen.getByRole("button", { name: `The deck, ${PACK_SIZE} cards left` }));
        expect(
            screen.getByRole("button", { name: `The deck, ${PACK_SIZE - 1} cards left` }),
        ).toBeInTheDocument();
        expect(mat.querySelectorAll(".ui-tcg-deal")).toHaveLength(1);
        turnAll();
        expect(screen.queryByRole("button", { name: /^The deck/ })).toBeNull();
        expect(mat.querySelectorAll(".ui-tcg-deal")).toHaveLength(PACK_SIZE);
        // The focus goes on to Done, for a keyboard or a controller
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Done" }));
        expect(mat).toHaveTextContent("New");
        // A dealt card shows big; Escape shuts that first, then the mat
        const first = mat.querySelector(".ui-tcg-deal") as HTMLElement;
        fireEvent.click(first);
        expect(screen.getAllByRole("dialog")).toHaveLength(2);
        fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
        expect(screen.getAllByRole("dialog")).toHaveLength(1);
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /free pack/ })).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /not found yet$/ }).length).toBeLessThan(
            CARDS.length,
        );
    } finally {
        vi.useRealTimers();
    }
});

test("sells each pack for platinum tokens, and says why one can't be bought", () => {
    const raids = PACK_BY_ID.get("raids")!;
    const basic = PACK_BY_ID.get("adventurer")!;
    render(
        <Harness
            start={{ ...createSave(), cardPacks: 0, coins: 1e6, platinum: basic.price + 10 }}
        />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Card shop" }));
    const buyRaids = screen.getByRole("button", { name: `Buy the ${packName(raids)}` });
    expect(buyRaids).toBeDisabled();
    const offer = buyRaids.closest(".ui-cards-offer") as HTMLElement;
    expect(
        within(offer).getByText(
            `You need ${(raids.price - basic.price - 10).toLocaleString("en")} more platinum tokens.`,
        ),
    ).toBeInTheDocument();
    // First how likely its cards are by their own rarity, then each one's version
    expect(within(offer).getByText("Its cards, by their own rarity:")).toBeInTheDocument();
    // Of what a new save's unlocked of it
    const shares = packRarityShares(raids, packPool(createSave(), raids));
    expect(within(offer).getByText(`Rare ${Math.round(shares.rare * 100)}%`)).toBeInTheDocument();
    expect(within(offer).getByText("Rare 75%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Buy the ${packName(basic)}` }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    vi.useFakeTimers();
    try {
        turnAll();
    } finally {
        vi.useRealTimers();
    }
    // No platinum tokens left for another
    expect(screen.queryByRole("button", { name: /Buy another/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: `Buy the ${packName(basic)}` })).toBeDisabled();
});

test("previews a pack: its cards' hit rates for the save, locked ones and where to unlock them", () => {
    const showScreen = vi.fn();
    // The odds are worked out a chunk at a time, on timers
    vi.useFakeTimers();
    try {
        previewPack(showScreen);
    } finally {
        vi.useRealTimers();
    }
});

function previewPack(showScreen: () => void): void {
    render(<Harness start={createSave()} showScreen={showScreen} />);
    fireEvent.click(screen.getByRole("button", { name: "Card shop" }));
    const weapons = PACK_BY_ID.get("weapons")!;
    fireEvent.click(screen.getByRole("button", { name: `Preview the ${packName(weapons)}` }));
    const dialog = screen.getByRole("dialog", { name: `${packName(weapons)}: what's in it` });
    expect(within(dialog).getByText("Working out the odds...")).toBeInTheDocument();
    // Locked till the Kalphite Queen's beaten: no rate, and where to unlock it, in words
    const keris = within(dialog).getByText("Keris partisan").closest("li")!;
    expect(keris).toHaveClass("ui-pack-preview-locked");
    expect(within(keris).getByText("Locked")).toBeInTheDocument();
    expect(within(keris).getByText(`Unlock in: ${mapName(getMap("desert"))}`)).toBeInTheDocument();
    act(() => {
        vi.runAllTimers();
    });
    // No word of how the figures are got on the screen itself: that's the info's
    expect(within(dialog).queryByText(/simulated/)).toBeNull();
    expect(within(dialog).queryByText("Working out the odds...")).toBeNull();
    const scimitar = within(dialog).getByText("Scimitar").closest("li")!;
    expect(within(scimitar).getByText(/^\d+(\.\d+)?% per pack$/)).toBeInTheDocument();
    expect(within(keris).queryByText(/per pack/)).toBeNull();
    // A tab for each rarity, with its count: only that rarity's cards
    const rare = within(dialog).getByRole("button", { name: /^Rare \(\d+\)$/ });
    fireEvent.click(rare);
    expect(rare).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByText("Keris partisan")).toBeInTheDocument();
    expect(within(dialog).queryByText("Scimitar")).toBeNull();
    // The info icon's popover: each rarity's chance, as the thing on the card and as its
    // version, the packs with a Very rare item, and how the figures are got
    const icon = within(dialog).getByRole("button", { name: "About these odds" });
    expect(icon).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(icon);
    expect(icon).toHaveAttribute("aria-expanded", "true");
    const info = screen.getByRole("dialog", { name: "About these odds" });
    expect(within(info).getByRole("columnheader", { name: "Item" })).toBeInTheDocument();
    expect(within(info).getByRole("columnheader", { name: "Version" })).toBeInTheDocument();
    expect(within(info).getByRole("rowheader", { name: "Very rare" })).toBeInTheDocument();
    expect(within(info).getByText(/^Packs with at least one Very rare item: /)).toBeInTheDocument();
    expect(
        within(info).getByText("From 100,000 simulated packs, for your save."),
    ).toBeInTheDocument();
    // The icon again shuts it, and so does Escape, before the preview
    fireEvent.click(icon);
    expect(screen.queryByRole("dialog", { name: "About these odds" })).toBeNull();
    fireEvent.click(icon);
    fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "About these odds" })).toBeNull();
    expect(dialog).toBeInTheDocument();
    // Escape shuts the preview, not the screen
    fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(showScreen).not.toHaveBeenCalled();
    // Opened again, on the tab it was left on
    fireEvent.click(screen.getByRole("button", { name: `Preview the ${packName(weapons)}` }));
    expect(screen.getByRole("button", { name: /^Rare \(\d+\)$/ })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
}

test("shuts the pack's window on Escape before leaving the screen", () => {
    const showScreen = vi.fn();
    render(<Harness start={createSave()} showScreen={showScreen} />);
    fireEvent.click(screen.getByRole("button", { name: "Open your free pack (1)" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(showScreen).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { code: "Escape", key: "Escape" });
    expect(showScreen).toHaveBeenCalledWith("title");
});

test("shows a found card big in a window where there's no room beside the grid", () => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: true })),
    );
    try {
        render(<Harness start={{ ...createSave(), cards: { [scimitar.id]: 1 } }} />);
        fireEvent.click(screen.getByRole("button", { name: scimitar.name() }));
        expect(screen.getByRole("dialog", { name: scimitar.name() })).toHaveTextContent(
            "Yours: Common x1",
        );
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        // A card not found yet has nothing to show
        fireEvent.click(screen.getAllByRole("button", { name: /not found yet$/ })[0]);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally {
        vi.unstubAllGlobals();
    }
});
