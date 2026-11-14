// Prints a SHA-256 of what a recipe writes, square by square and for the whole map, so that a
// change meant to leave a map alone can prove it did. Shipped maps mustn't move: CHECK=1 holds
// each one to its hash below, and `bun run test:maps` runs that (generator.test.ts).
//
//   bun run tsx scripts/scaperune/grid-hash.ts halloween [scaperune_ysmar ...]
//   VERBOSE=1 bun run tsx scripts/scaperune/grid-hash.ts halloween    # each square's too
//   CHECK=1 bun run tsx scripts/scaperune/grid-hash.ts                # every shipped map, against SHIPPED_HASHES
import crypto from "node:crypto";

import { SCAPERUNE_MAPS } from "../../src/game/scaperune/maps/shippedMaps";
import {
    buildRecipeSquares,
    createBuildContext,
    getRecipe,
} from "../../src/game/scaperune/squares";
import { createSceneBuilder, loadGameCache } from "../cache/scene-util";

// What each shipped map writes today. A change that's meant to change a shipped map updates its
// hash here on purpose, in the same pull request, and says why. Anything else must leave these be.
// They're for the game's cache: a newer one can change what a map copies from the real world's
// squares (rev 242 gave Hallowed Night's Hosidius barn a new window).
const SHIPPED_HASHES: Record<string, string> = {
    halloween: "74334ce0040b68a1f4474a220f6aede5eeda540fb658c3711aa0ea4fc5200395",
    phosani: "4f6fcdf2dee1830db95a1c3e1cac27549d1bcaac9ccc1242fce3c148479625c1",
    theatre_of_blood: "e846bfdc8dc8abf583ebe7de484d248c1cd31ba35393ada5b24893517c510973",
    zachariah: "9486e1585cc223d81ed5ddc042d01a189265aa84e3f0de61bf32d41a0747a508",
    stranglewood: "933870d4549c12b99897d02a53df4bacaa7ca194f32fa0708068799b39641ef4",
    // The city and its Shadow Realm (MapRecipe.twin) together. Its walls stand whole since the
    // houses read as bare floors with them thinned
    lassar_undercity: "0eb0f70b84d7ab8b3b935d6cf538fefc75620483d585b83eddf5ba4614ff6c18",
    ghorrock: "2bc1030c05a631ca65534e2f12f78c618566c16badbdca9f8eb45251d0600520",
    // The Awakened Duke's room, cut from Ghorrock Prison's and widened
    awakened_duke: "dbfdf1174f82175276bcfd02a7634276c38703a0acf130b08221126ddba57cc7",
    scar: "f5064a2a6a31239c4f5cdd4fc263faf130ca100d638f10b75ed9831e10db4a8c",
    tombs_of_amascut: "5c8af37f8d7dd69e1ba682d4b3910d780a2f5a5be76e62e556eba8cd3700d722",
    // The raid's squares under the quest's id: the same build
    beneath_cursed_sands: "5c8af37f8d7dd69e1ba682d4b3910d780a2f5a5be76e62e556eba8cd3700d722",
    battle_for_varrock: "437af27aa0cd7ad401d4f91f7aea4e726064c7fa436bccc50c2b49357b165d66",
};

const check = !!process.env.CHECK;
const ids = process.argv.slice(2);
if (ids.length === 0) {
    ids.push(...(check ? SCAPERUNE_MAPS.map((recipe) => recipe.id) : ["halloween"]));
}
const { mapFileLoader, locTypeLoader } = createSceneBuilder(loadGameCache());
const context = createBuildContext(mapFileLoader, locTypeLoader);
const wrong: string[] = [];
for (const id of ids) {
    const recipe = getRecipe(id);
    if (!recipe) {
        throw new Error(`No recipe called ${id}`);
    }
    const squares = buildRecipeSquares(recipe, context);
    // Its twin's squares too (MapRecipe.twin: Lassar's Shadow Realm), drawn in its place
    if (recipe.twin) {
        for (const [square, data] of buildRecipeSquares(recipe.twin, context)) {
            squares.set(square, data);
        }
    }
    const whole = crypto.createHash("sha256");
    for (const [square, { terrain, locs }] of [...squares].sort((a, b) => a[0] - b[0])) {
        const one = crypto.createHash("sha256").update(terrain).update(locs).digest("hex");
        whole.update(one);
        if (process.env.VERBOSE) {
            console.log(`  ${square}: ${one}`);
        }
    }
    const hash = whole.digest("hex");
    if (!check) {
        console.log(`${id}: ${hash}`);
        continue;
    }
    const pinned = SHIPPED_HASHES[id];
    if (pinned === hash) {
        console.log(`${id}: ${hash} (as pinned)`);
    } else {
        console.log(`${id}: ${hash}, but ${pinned ? `${pinned} is pinned` : "nothing is pinned"}`);
        wrong.push(id);
    }
}
if (check) {
    // A shipped map with no hash isn't held to anything
    for (const recipe of SCAPERUNE_MAPS) {
        if (!SHIPPED_HASHES[recipe.id] && !wrong.includes(recipe.id)) {
            console.log(`${recipe.id} ships, but has no pinned hash`);
            wrong.push(recipe.id);
        }
    }
    if (wrong.length > 0) {
        console.log(
            `Changed or unpinned: ${wrong.join(", ")}. Update SHIPPED_HASHES only on purpose.`,
        );
        process.exitCode = 1;
    } else {
        console.log("Every shipped map matches its pinned hash");
    }
}
