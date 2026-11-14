import { getGear } from "./items";
import { Rarity } from "./rarity";

// The Armoury: gear found in caskets is upgraded there for good, with banked
// coins. Each upgrade takes a piece one step along its line, and from then on
// it comes out of every casket as what it's become: an Amulet of strength
// upgraded twice is an Amulet of torture. Most lines go up through better
// pieces (real OSRS upgrades where there are any, like the Fire cape to the
// Infernal cape) and end in a variant of the best one (an ornament kit, an
// imbue), with a new look and a quarter more of its stats.
//
// Every piece found has its own upgrades: upgrading the Amulet of strength
// doesn't change the Amulet of power, or the other way round.

// A piece upgrades into the one after it in its line. Lines can join (two
// pieces can upgrade into the same one), but a piece only upgrades one way.
const LINES: string[][] = [
    // Head
    ["rune_full_helm", "helm_of_neitiznot", "justiciar_faceguard"],
    ["coif", "armadyl_helmet", "masori_mask_f"],
    ["mystic_hat", "farseer_helm", "ancestral_hat", "twisted_ancestral_hat"],
    ["berserker_helm", "slayer_helmet", "black_slayer_helmet"],

    // Cape: the TzHaar's capes, the Ardougne diary's cloaks, the god capes
    // imbued at the Mage Arena
    ["obsidian_cape", "fire_cape", "infernal_cape", "infernal_max_cape"],
    ["ardougne_cloak", "ardougne_cloak_2", "ardougne_cloak_3", "ardougne_cloak_4"],
    ["cape_of_legends", "guthix_cape", "imbued_guthix_cape"],
    ["zamorak_cape", "imbued_zamorak_cape"],
    ["saradomin_cape", "imbued_saradomin_cape"],
    ["avas_accumulator", "avas_assembler", "masori_assembler"],

    // Neck: the enchanted gems, ruby up to zenyte
    ["amulet_of_strength", "amulet_of_power", "amulet_of_torture", "amulet_of_torture_or"],
    ["amulet_of_defence", "amulet_of_fury", "amulet_of_fury_or"],
    ["phoenix_necklace", "amulet_of_fury"],
    ["amulet_of_magic", "occult_necklace", "occult_necklace_or"],
    ["necklace_of_anguish", "necklace_of_anguish_or"],
    ["amulet_of_rancour", "amulet_of_rancour_s"],
    // Each tier heals more
    [
        "amulet_of_blood_fury",
        "amulet_of_blood_fury_2",
        "amulet_of_blood_fury_3",
        "amulet_of_blood_fury_4",
    ],

    // Body
    ["rune_platebody", "fighter_torso", "bandos_chestplate", "bandos_chestplate_or"],
    ["rune_chainbody", "dharoks_platebody", "bandos_chestplate"],
    ["black_dhide_body", "karils_leathertop", "armadyl_chestplate", "masori_body_f"],
    ["mystic_robe_top", "ancestral_robe_top", "twisted_ancestral_robe_top"],
    ["ahrims_robetop", "ancestral_robe_top"],

    // Shield: the Warriors' Guild's defenders, and the draconic visage that
    // makes a Dragonfire shield
    ["rune_kiteshield", "dragon_sq_shield", "elysian_spirit_shield"],
    ["antidragon_shield", "dragonfire_shield"],
    ["toktz_ket_xil", "dragonfire_shield"],
    ["rune_defender", "dragon_defender", "avernic_defender", "ghommals_avernic_defender"],
    ["mages_book", "arcane_spirit_shield", "elidinis_ward_f"],
    ["book_of_law", "book_of_law_or"],

    // Legs
    ["rune_platelegs", "dragon_platelegs", "bandos_tassets", "bandos_tassets_or"],
    ["rune_plateskirt", "veracs_plateskirt", "bandos_tassets"],
    ["black_dhide_chaps", "armadyl_chainskirt", "masori_chaps_f"],
    ["mystic_robe_bottom", "ancestral_robe_bottom", "twisted_ancestral_robe_bottom"],
    ["ahrims_robeskirt", "ancestral_robe_bottom"],

    // Hands: Recipe for Disaster's gloves, mithril up to barrows
    ["mithril_gloves", "rune_gloves", "dragon_gloves", "barrows_gloves"],
    ["leather_gloves", "rune_gloves"],
    ["infinity_gloves", "tormented_bracelet", "tormented_bracelet_or"],

    // Feet: the boss boots, each from a lesser pair and its crystal
    ["rune_boots", "dragon_boots", "primordial_boots", "avernic_treads_pr"],
    ["climbing_boots", "boots_of_lightness", "ranger_boots", "pegasian_boots", "avernic_treads_pe"],
    ["infinity_boots", "eternal_boots", "avernic_treads_et"],
    ["bandos_boots", "bandos_boots_or"],

    // Ring: the Fremennik rings and the rest imbued, then with Desert Treasure
    // II's vestiges, and the Explorer's ring up through the Lumbridge diary
    ["ring_of_recoil", "ring_of_suffering", "ring_of_suffering_i"],
    ["explorers_ring", "explorers_ring_2", "explorers_ring_3", "explorers_ring_4"],
    ["warrior_ring", "berserker_ring", "berserker_ring_i", "ultor_ring"],
    ["seers_ring", "seers_ring_i", "magus_ring"],
    ["archers_ring", "archers_ring_i", "venator_ring"],
    ["ring_of_the_gods", "ring_of_the_gods_i"],
    ["tyrannical_ring", "tyrannical_ring_i"],
    ["treasonous_ring", "treasonous_ring_i"],

    // Sets: a piece's upgrade still counts for its set. The Void knight's
    // helm and gloves have no elite version, only the ornament kit's, and the
    // Inquisitor's armour has neither. (The Neitiznot faceguard isn't a step
    // of the Helm of neitiznot's line: that would turn upgrades already
    // bought into it.)
    ["void_knight_top", "elite_void_top", "elite_void_top_or"],
    ["void_knight_robe", "elite_void_robe", "elite_void_robe_or"],
    ["void_melee_helm", "void_melee_helm_or"],
    ["void_knight_gloves", "void_knight_gloves_or"],
    ["crystal_helm", "corrupted_crystal_helm"],
    ["crystal_body", "corrupted_crystal_body"],
    ["crystal_legs", "corrupted_crystal_legs"],
    ["torva_full_helm", "sanguine_torva_full_helm"],
    ["torva_platebody", "sanguine_torva_platebody"],
    ["torva_platelegs", "sanguine_torva_platelegs"],
    ["virtus_mask", "ancient_ceremonial_mask"],
    ["virtus_robe_top", "ancient_ceremonial_top"],
    ["virtus_robe_bottom", "ancient_ceremonial_legs"],
];

const NEXT: Map<string, string> = new Map();
for (const line of LINES) {
    for (let i = 0; i < line.length - 1; i++) {
        const known = NEXT.get(line[i]);
        if (known !== undefined && known !== line[i + 1]) {
            throw new Error(`${line[i]} upgrades into both ${known} and ${line[i + 1]}`);
        }
        NEXT.set(line[i], line[i + 1]);
    }
}

// Coins for an upgrade, by the rarity of what the piece becomes
export const ARMOURY_COSTS: Record<Rarity, number> = {
    common: 250,
    uncommon: 600,
    rare: 1500,
    veryRare: 3500,
};

// How far up its line a piece is: 0 for the start of one (or a piece in none), a Fire cape 1, an
// Infernal cape 2. Where lines join, the longest way up.
const DEPTH: Map<string, number> = new Map();
for (const line of LINES) {
    line.forEach((id, i) => DEPTH.set(id, Math.max(DEPTH.get(id) ?? 0, i)));
}

export function getArmouryDepth(itemId: string): number {
    return DEPTH.get(itemId) ?? 0;
}

// What a piece upgrades into next, undefined when it's as good as it gets
export function getNextUpgrade(itemId: string): string | undefined {
    return NEXT.get(itemId);
}

// A piece and everything it can be upgraded into, in order
export function getUpgradeLine(itemId: string): string[] {
    const line = [itemId];
    for (let next = NEXT.get(itemId); next !== undefined; next = NEXT.get(next)) {
        line.push(next);
    }
    return line;
}

// What upgrading into this piece costs
export function getArmouryCost(intoId: string): number {
    return ARMOURY_COSTS[getGear(intoId).rarity];
}

// Piece id -> times it's been upgraded in the Armoury
export type ArmouryUpgrades = Readonly<Record<string, number>>;

// What a piece found in a casket comes out as, with its upgrades (itself
// when it has none, or when it isn't gear)
export function getUpgradedGear(itemId: string, upgrades: ArmouryUpgrades | undefined): string {
    let id = itemId;
    for (let i = upgrades?.[itemId] ?? 0; i > 0; i--) {
        const next = NEXT.get(id);
        if (next === undefined) {
            break;
        }
        id = next;
    }
    return id;
}
