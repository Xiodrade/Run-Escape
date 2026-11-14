import { describe, expect, it } from "vitest";

import { CARD_BY_ID, PACKS, PACK_BY_ID } from "../content/cards";
import { RARITY_ORDER } from "../content/rarity";
import { WEAPONS } from "../content/weapons";
import {
    PREVIEW_PACKS,
    cardUnlockMap,
    exactPackOdds,
    packOddsKey,
    simulatePackOdds,
} from "./cardOdds";
import { packPool } from "./cards";
import { createSave } from "./save";

describe("a pack's preview odds", () => {
    it("come close to the exact odds over the preview's packs, for each pack", () => {
        const save = createSave();
        for (const pack of PACKS) {
            const pool = packPool(save, pack);
            if (pool.length === 0) {
                continue;
            }
            const sim = simulatePackOdds(pack, pool);
            while (!sim.done) {
                sim.step(20_000);
            }
            const simulated = sim.result();
            const exact = exactPackOdds(pack, pool);
            expect(simulated.packs).toBe(PREVIEW_PACKS);
            for (const rarity of RARITY_ORDER) {
                expect(Math.abs(simulated.items[rarity] - exact.items[rarity])).toBeLessThan(0.005);
                expect(Math.abs(simulated.versions[rarity] - exact.versions[rarity])).toBeLessThan(
                    0.005,
                );
            }
            expect(Math.abs(simulated.veryRarePack - exact.veryRarePack)).toBeLessThan(0.005);
            for (const card of pool) {
                expect(
                    Math.abs(simulated.perCard.get(card.id)! - exact.perCard.get(card.id)!),
                    card.id,
                ).toBeLessThan(0.005);
            }
        }
    });

    it("give the same save the same figures, and change with its pool", () => {
        const pack = PACK_BY_ID.get("weapons")!;
        const pool = packPool(createSave(), pack);
        const run = () => {
            const sim = simulatePackOdds(pack, pool, 2_000);
            sim.step(2_000);
            return sim.result();
        };
        expect(run()).toEqual(run());
        const more = packPool({ ...createSave(), unlockedItems: ["keris_partisan"] }, pack);
        expect(packOddsKey(pack, more)).not.toBe(packOddsKey(pack, pool));
    });

    it("name where a locked card's thing is unlocked", () => {
        expect(cardUnlockMap(CARD_BY_ID.get("weapon:keris_partisan")!)).toBe("desert");
        expect(cardUnlockMap(CARD_BY_ID.get("weapon:keris_partisan_of_the_sun")!)).toBe(
            "tombs_of_amascut",
        );
        // An evolution of something a map brings in: that map
        const base = WEAPONS.find((w) => w.unlock && w.evolution)!;
        const evolved = CARD_BY_ID.get(`weapon:${base.evolution!.into}`)!;
        expect(cardUnlockMap(evolved)).toBe(base.unlock!.mapId);
        // There from the start: none
        expect(cardUnlockMap(CARD_BY_ID.get("weapon:scimitar")!)).toBeUndefined();
    });
});
