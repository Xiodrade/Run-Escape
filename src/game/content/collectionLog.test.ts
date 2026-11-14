import { describe, expect, it, vi } from "vitest";

import { createSave } from "../core/save";
import { isMapOut } from "./acts";
import {
    LOG_TABS,
    REWARD_MAPS,
    getLogEntries,
    getLogTotal,
    getRewards,
    getTrophyMap,
} from "./collectionLog";
import { EVOLUTIONS } from "./evolutions";
import { CASKET_GEAR } from "./items";
import { MAP_BY_ID, getMap } from "./maps";
import { TROPHIES } from "./trophies";
import { MapDef } from "./types";

// Maps a test hides, as an act that isn't out hides its own (the rest are as acts.ts has them)
const hiddenMaps = vi.hoisted(() => new Set<string>());
vi.mock("./acts", async (importOriginal) => {
    const acts = await importOriginal<typeof import("./acts")>();
    return {
        ...acts,
        isMapOut: (map: MapDef) => !hiddenMaps.has(map.id) && acts.isMapOut(map),
    };
});

describe("the Collection log's rewards", () => {
    it("has an entry for each map with trophies, the Theatre of Blood's as well as the Hallowed Night's", () => {
        expect(REWARD_MAPS).toContain("halloween");
        expect(REWARD_MAPS).toContain("theatre_of_blood");
        expect(REWARD_MAPS).toContain("thanksgiving");
    });

    it("lists every trophy once, under its own map, but a map's that isn't out yet", () => {
        const save = createSave();
        const listed = REWARD_MAPS.flatMap((mapId) => getRewards(save, mapId).map((r) => r.id));
        for (const trophy of TROPHIES) {
            const map = MAP_BY_ID.get(getTrophyMap(trophy));
            const out = !map || isMapOut(map);
            expect(listed.filter((id) => id === trophy.id)).toHaveLength(out ? 1 : 0);
        }
        // An act still to come has no tab (ActDef.released): the Stranglewood's
        expect(REWARD_MAPS.includes("stranglewood")).toBe(isMapOut(getMap("stranglewood")));
        // The Tombs of Amascut's chest's, under the raid
        expect(getRewards(save, "tombs_of_amascut").map((r) => r.id)).toContain("tumekens_shadow");
        // The Theatre's aren't under the Hallowed Night
        const halloween = getRewards(save, "halloween").map((r) => r.id);
        expect(halloween).not.toContain("ghrazi_rapier");
        expect(halloween).not.toContain("lil_zik");
    });

    it("lists the weapons a map brings in: the Theatre's chest's, the Nightmare's", () => {
        const save = createSave();
        const theatre = getRewards(save, "theatre_of_blood").map((r) => r.id);
        expect(theatre).toContain("holy_scythe_of_vitur");
        // The rapier's its own trophy: there once
        expect(theatre.filter((id) => id === "ghrazi_rapier")).toHaveLength(1);
        const halloween = getRewards(save, "halloween").map((r) => r.id);
        expect(halloween).toEqual(
            expect.arrayContaining(["inquisitors_mace", "volatile_nightmare_staff"]),
        );
    });

    it("has an entry for a boss fight that brings in a weapon, with no trophy: Phosani's staff", () => {
        expect(REWARD_MAPS).toContain("phosani");
        expect(getRewards(createSave(), "phosani").map((r) => r.id)).toContain("nightmare_staff");
    });

    it("lists Thanksgiving's collection rewards with accurate sources", () => {
        const rewards = getRewards(createSave(), "thanksgiving");
        const ids = rewards.map(({ id }) => id);
        const trophy = (id: string) => TROPHIES.find((entry) => entry.id === id)!;

        expect(ids).toHaveLength(8);
        expect(ids).toEqual(
            expect.arrayContaining([
                "rubber_chicken",
                "turkey_hat",
                "magic_secateurs",
                "golden_feather",
                "chompy_hat",
                "ledger_of_the_harvest",
                "chompy_chick",
                "golden_egg",
            ]),
        );
        expect(trophy("rubber_chicken").from).toMatchObject({
            kind: "enemy",
            enemyId: "chompy_bird",
            mapId: "thanksgiving",
            chance: 1 / 200,
        });
        expect(trophy("turkey_hat").from).toMatchObject({
            kind: "enemy",
            enemyId: "chompy_bird",
            mapId: "thanksgiving",
            chance: 1 / 400,
        });
        expect(trophy("magic_secateurs").from).toEqual({ kind: "turkey", chance: 1 / 5 });
        expect(trophy("golden_feather").from).toMatchObject({
            kind: "enemy",
            enemyId: "chompy_bird",
            mapId: "thanksgiving",
            chance: 1 / 1000,
        });
        expect(trophy("chompy_chick").from).toMatchObject({
            kind: "quest",
            questId: "thanksgiving_chompy_hunt",
            mapId: "thanksgiving",
        });
        expect(trophy("chompy_chick").how).toBe("Complete the Chompy Slayer quest.");
        expect(trophy("golden_egg")).toMatchObject({
            name: "Golden egg",
            objId: 28663,
            from: {
                kind: "map",
                mapId: "thanksgiving",
                requiresBoss: "freaky_forester_final",
                hard: true,
            },
        });
        expect(trophy("chompy_hat").from).toMatchObject({
            kind: "map",
            mapId: "thanksgiving",
            requiresBoss: "evil_chicken",
        });
        expect(trophy("ledger_of_the_harvest").from).toMatchObject({
            kind: "map",
            mapId: "thanksgiving",
            requiresBoss: "freaky_forester_final",
        });
        expect(trophy("turkey_hat")).toMatchObject({
            name: "Turkey hat",
            objId: 28620,
            how: "A rare drop from a Chompy bird.",
        });
        for (const reward of rewards) {
            expect(reward.how).not.toMatch(/\b1 in\b/);
        }
    });
});

describe("the Collection log's tabs, as OSRS's client has them", () => {
    it("files each map under its tab: raids, bosses, seasonal events as minigames", () => {
        const tabs = new Map(getLogEntries(createSave()).map((entry) => [entry.id, entry.tab]));
        expect(tabs.get("theatre_of_blood")).toBe("raids");
        expect(tabs.get("tombs_of_amascut")).toBe("raids");
        expect(tabs.get("phosani")).toBe("bosses");
        expect(tabs.get("zachariah")).toBe("bosses");
        expect(tabs.get("halloween")).toBe("minigames");
        expect(tabs.get("thanksgiving")).toBe("minigames");
        expect(tabs.get("evolutions")).toBe("other");
        expect(tabs.get("clues_common")).toBe("clues");
    });

    it("lists every reward map once, every casket's gear and every evolution, in tab order", () => {
        const entries = getLogEntries(createSave());
        const mapEntries = entries.filter((entry) => MAP_BY_ID.has(entry.id));
        expect(mapEntries.map((entry) => entry.id).sort()).toEqual([...REWARD_MAPS].sort());
        // Each kind of map has a tab of its own: none's left among the evolutions
        for (const entry of mapEntries) {
            expect(entry.tab, entry.id).not.toBe("other");
        }
        const clueIds = entries
            .filter((entry) => entry.tab === "clues")
            .flatMap((entry) => entry.items.map((item) => item.id));
        expect(clueIds.sort()).toEqual(CASKET_GEAR.map((gear) => gear.id).sort());
        expect(entries.find((e) => e.id === "evolutions")!.items).toHaveLength(EVOLUTIONS.length);
        const order = entries.map((entry) => LOG_TABS.indexOf(entry.tab));
        expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it("reads what's obtained from the save as it is, and counts each item once", () => {
        const save = createSave();
        const before = getLogTotal(getLogEntries(save));
        expect(before.found).toBe(0);
        save.trophies.push("lil_zik");
        save.foundGear.push(CASKET_GEAR[0].id);
        save.evolutionsMade.push(EVOLUTIONS[0].into.id);
        save.mapVictories.theatre_of_blood = 3;
        const entries = getLogEntries(save);
        expect(getLogTotal(entries)).toEqual({ found: 3, total: before.total });
        const theatre = entries.find((e) => e.id === "theatre_of_blood")!;
        expect(theatre.items.find((item) => item.id === "lil_zik")!.found).toBe(true);
        expect(theatre.tally).toEqual({ key: "collection.wins", n: 3 });
        const keys = entries.flatMap((entry) => entry.items.map((item) => item.key));
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("leaves out casket gear and evolutions brought in on a map that isn't out yet", () => {
        const gear = CASKET_GEAR.find((piece) => piece.unlock)!;
        const evolution = EVOLUTIONS.find((e) => e.weapons.some((weapon) => weapon.unlock))!;
        const evolvesFrom = evolution.weapons.find((weapon) => weapon.unlock)!;
        const ids = () => getLogEntries(createSave()).flatMap((e) => e.items.map((i) => i.id));
        expect(ids()).toEqual(expect.arrayContaining([gear.id, evolution.into.id]));
        hiddenMaps.add(gear.unlock!.mapId);
        hiddenMaps.add(evolvesFrom.unlock!.mapId);
        try {
            expect(ids()).not.toContain(gear.id);
            expect(ids()).not.toContain(evolution.into.id);
        } finally {
            hiddenMaps.clear();
        }
    });
});
