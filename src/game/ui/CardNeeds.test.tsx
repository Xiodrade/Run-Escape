// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { GameClient } from "../client/GameClient";
import { UiSnapshot } from "../client/GameStore";
import { CARDS } from "../content/cards";
import { getCharacter } from "../content/characters";
import { getCardRunNeeds, getCardRunShortfall } from "../core/cardRuns";
import { SaveData, createSave } from "../core/save";
import { CardNeedsWindow, cardNeedsLabel } from "./CardNeeds";
import { CollectionLogScreen } from "./CollectionLogScreen";

afterEach(cleanup);

// The case a player met: the Nomad on Lumbridge, their throwing axes' card owned and enough weapon
// cards, a passive short
function nomadSave(): SaveData {
    const save = createSave();
    const needs = getCardRunNeeds(save, "nomad");
    const weapons = needs.weapons.cards.slice(0, needs.weapons.needed).map((c) => c.card.id);
    const passives = needs.passives.cards.slice(0, needs.passives.needed - 1).map((c) => c.card.id);
    const cards: Record<string, number> = {
        [`weapon:${getCharacter("nomad").startingWeapon}`]: 1,
    };
    for (const id of [...weapons, ...passives]) {
        cards[id] = 1;
    }
    return { ...save, cards, cardsOnly: true };
}

test("the button, the window and the run's check agree on what's needed, naming its kind", () => {
    const save = nomadSave();
    const needs = getCardRunNeeds(save, "nomad");
    expect(needs.starter.every((s) => s.owned)).toBe(true);
    expect(needs.weapons.missing).toBe(0);
    expect(needs.passives.missing).toBe(1);
    expect(getCardRunShortfall(save, "nomad")).toEqual({ weapons: 0, passives: 1 });
    expect(cardNeedsLabel(needs)).toBe("Need 1 more passive card");
    // Nothing short: no button's words at all
    const full = { ...save, cards: { ...save.cards, [needs.passives.cards.at(-1)!.card.id]: 1 } };
    expect(cardNeedsLabel(getCardRunNeeds(full, "nomad"))).toBeUndefined();
});

test("the window shows only what's still needed, with the Card shop on its pack", () => {
    const save = nomadSave();
    const client = { openCardShop: vi.fn() };
    render(
        <CardNeedsWindow
            save={save}
            characterId="nomad"
            client={client as unknown as GameClient}
            onClose={vi.fn()}
        />,
    );
    expect(screen.getByText("Passives: 1 more card needed, one of these")).toBeInTheDocument();
    // Weapons and the starting weapon are done: not listed
    expect(screen.queryByText(/^Weapons:/)).toBeNull();
    expect(screen.queryByText(/starting weapon/)).toBeNull();
    // Only cards not owned
    const owned = Object.keys(save.cards!);
    for (const id of owned) {
        const card = CARDS.find((c) => c.id === id)!;
        expect(screen.queryByText(card.name())).toBeNull();
    }
    fireEvent.click(screen.getByRole("button", { name: "Card shop" }));
    expect(client.openCardShop).toHaveBeenCalledWith("passives");
});

test("the Collection log's title has its items' count, and the cards' beside it", () => {
    const save = { ...createSave(), cards: { "weapon:scimitar": 2, "weapon:scimitar@rare": 1 } };
    render(
        <CollectionLogScreen
            ui={{ save } as unknown as UiSnapshot}
            client={{ showScreen: vi.fn() } as unknown as GameClient}
        />,
    );
    expect(screen.getByRole("heading", { name: /^Collection log - 0\// })).toBeInTheDocument();
    // Each card once, whatever its versions
    expect(screen.getByText(`Cards - 1/${CARDS.length}`)).toBeInTheDocument();
});
