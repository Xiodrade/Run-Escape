import { beforeEach, describe, expect, it, vi } from "vitest";

// Dev maps only exist with this set, so the modules are loaded fresh under it
describe("a run on a development map", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv("DEV_MAPS", "1");
    });

    // Importing the save and every map fresh takes most of the default 5 seconds on its own, and
    // more beside the map checks, so it gets longer
    it("leaves the save as it was, and a run on a real map doesn't", async () => {
        const { createSave, isEndlessRecord, recordRun } = await import("../core/save");
        const { isDevMap } = await import("../content/maps");
        const run = {
            mapId: "scaperune_meadow",
            victory: true,
            endless: true,
            round: 3,
            seconds: 500,
            level: 20,
            kills: 900,
            bossesKilled: [],
            coins: 400,
            gearFound: [],
            evolutionsMade: [],
        } as unknown as Parameters<typeof recordRun>[1];
        expect(isDevMap(run.mapId)).toBe(true);

        const save = createSave();
        const before = structuredClone(save);
        expect(isEndlessRecord(save, run)).toBe(false);
        expect(recordRun(save, run)).toEqual([]);
        expect(save).toEqual(before);

        recordRun(save, { ...run, mapId: "lumbridge" });
        expect(save.runs).toBe(1);
        expect(save.coins).toBeGreaterThanOrEqual(400);
        expect(Object.keys(save.endlessBest)).toEqual(["lumbridge"]);
    }, 30000);
});
