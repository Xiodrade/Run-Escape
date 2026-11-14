import { MAX_LOADOUT_BYTES } from "../../../../server/coop-relay.mjs";
import { getUpgradeLine } from "../../content/armoury";
import { CARDS } from "../../content/cards";
import { INVOCATIONS } from "../../content/invocations";
import { CASKET_GEAR } from "../../content/items";
import { SHOP_UPGRADES } from "../../content/shop";
import { TROPHIES, getRaidChestTrophiesFound } from "../../content/trophies";
import { LOCKABLE_ITEMS } from "../../content/unlocks";
import { encodeCardCaps } from "../../core/cardRuns";
import { createSave } from "../../core/save";
import { GameStore } from "../GameStore";
import { CoopLobby, CoopView, makeLoadout, parseRoomCode, roomPlaysCardsOnly } from "./CoopLobby";
import { RoomView } from "./protocol";

test("a room plays Cards only as its host's tab says, and guests hear when it changes", () => {
    expect.hasAssertions();
    const lobby = new CoopLobby(new GameStore(createSave()));
    const changed = vi.fn();
    lobby.onRoomCardsOnlyChanged = changed;
    const update = (changes: Partial<CoopView>) =>
        (lobby as unknown as { update(changes: Partial<CoopView>): void }).update(changes);
    const member = (id: string, cardsOnly: boolean) => ({
        id,
        name: id,
        characterId: "warrior",
        ready: false,
        loadout: makeLoadout(
            {},
            [],
            {},
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            cardsOnly,
        ),
    });
    const room: RoomView = {
        code: "ABCDEFGH",
        name: "Test room",
        open: false,
        hostId: "host",
        mapId: "lumbridge",
        endless: false,
        hard: false,
        started: false,
        members: [member("host", false), member("guest", true)],
    };
    // A guest's own choice doesn't make the room Cards only
    expect(roomPlaysCardsOnly(room)).toBe(false);
    // Joining: a host to go by
    update({ room });
    expect(changed).toHaveBeenCalledTimes(1);
    const cardsRoom = { ...room, members: [member("host", true), member("guest", false)] };
    expect(roomPlaysCardsOnly(cardsRoom)).toBe(true);
    update({ room: cardsRoom });
    expect(changed).toHaveBeenCalledTimes(2);
    update({ room });
    expect(changed).toHaveBeenCalledTimes(3);
    // A new host: each loadout goes by theirs
    update({ room: { ...room, hostId: "guest" } });
    expect(changed).toHaveBeenCalledTimes(4);
    expect(roomPlaysCardsOnly({ ...room, hostId: "guest" })).toBe(true);
});

test("loadouts refresh only when the room's map changes", () => {
    expect.hasAssertions();
    const lobby = new CoopLobby(new GameStore(createSave()));
    const onMapChanged = vi.fn();
    lobby.onMapChanged = onMapChanged;
    const update = (changes: Partial<CoopView>) =>
        (lobby as unknown as { update(changes: Partial<CoopView>): void }).update(changes);
    const room: RoomView = {
        code: "ABCDEFGH",
        name: "Test room",
        open: false,
        hostId: "host",
        mapId: "lumbridge",
        endless: false,
        hard: false,
        started: false,
        members: [],
    };
    update({ room });
    expect(onMapChanged).toHaveBeenCalledTimes(1);
    update({ room: { ...room, hard: true } });
    expect(onMapChanged).toHaveBeenCalledTimes(1);
    update({ room: { ...room, mapId: "falador" } });
    expect(onMapChanged).toHaveBeenCalledTimes(2);
    update({ room: undefined });
    expect(onMapChanged).toHaveBeenCalledTimes(3);
});

describe("room codes", () => {
    it("takes the code out of a pasted invite link", () => {
        expect(parseRoomCode("https://example.com/game/?room=NVKDS")).toBe("NVKDS");
        expect(parseRoomCode("http://localhost:5173/?bgtick&room=nvkds#x")).toBe("NVKDS");
    });

    it("tidies up a typed one", () => {
        expect(parseRoomCode(" nv-kds ")).toBe("NVKDS");
        expect(parseRoomCode("ABCDEFGHIJ")).toBe("ABCDEFGH");
        expect(parseRoomCode("")).toBe("");
    });
});

describe("loadouts", () => {
    // The relay drops a loadout over its cap, and the player would play without
    // their shop bonuses and Armoury, so the biggest a save can make (every
    // upgrade bought, every item unlocked, all gear upgraded all the way, every
    // raid chest's trophy found) keeps well under it. Lots more gear could need
    // the cap raised.
    it("stay well under the relay's cap, even for a save with everything", () => {
        const metaStats: Record<string, number> = {};
        for (const upgrade of SHOP_UPGRADES) {
            metaStats[upgrade.stat] =
                (metaStats[upgrade.stat] ?? 0) + upgrade.perRank * upgrade.maxRank;
        }
        const loadout = makeLoadout(
            metaStats,
            LOCKABLE_ITEMS.map((item) => item.id),
            Object.fromEntries(CASKET_GEAR.map((g) => [g.id, getUpgradeLine(g.id).length - 1])),
            undefined,
            // A Tombs host with every invocation on
            INVOCATIONS.map((invocation) => invocation.id),
            getRaidChestTrophiesFound(TROPHIES.map((trophy) => trophy.id)),
            undefined,
            undefined,
            // Card collection only, with the Very rare version of every weapon and passive
            encodeCardCaps(
                new Map(
                    CARDS.filter((card) => card.kind !== "trophy").map((card) => [
                        card.id,
                        "veryRare" as const,
                    ]),
                ),
            ),
        );
        expect(loadout.trophies?.length).toBeGreaterThan(0);
        expect(loadout.cardCaps?.length).toBeGreaterThan(0);
        expect(JSON.stringify(loadout).length).toBeLessThan(MAX_LOADOUT_BYTES / 2);
    });

    // A Tombs room's lobby shows the host's raid level from their loadout; elsewhere it's left out
    it("carry invocations only when given them", () => {
        expect(makeLoadout({}, [], {}).invocations).toBeUndefined();
        expect(makeLoadout({}, [], {}, undefined, ["walk_for_it"]).invocations).toEqual([
            "walk_for_it",
        ]);
    });

    // The Lil' Zik looks found, for the expert chest: left out when there are none
    it("carry the trophies found only when there are some", () => {
        expect(makeLoadout({}, [], {}).trophies).toBeUndefined();
        expect(makeLoadout({}, [], {}, undefined, undefined, []).trophies).toBeUndefined();
        expect(makeLoadout({}, [], {}, undefined, undefined, ["lil_nylo"]).trophies).toEqual([
            "lil_nylo",
        ]);
    });
});
