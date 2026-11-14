// The title screen's icons: the client's own side tab sprites, and the
// Collection log's item. scripts/cache/slim-cache.ts keeps them in the slim cache.
export const TITLE_TAB_SPRITES = {
    skills: 898,
    quests: 899,
    armoury: 901,
    settings: 908,
} as const;

// Cloud save's button beside Settings: the client's storage chest with an up arrow, and in its
// corner the "!" while it's waiting on the player or the "no" sign while it can't sync
export const CLOUD_SAVE_SPRITES = {
    saved: 1106,
    choose: 937,
    problem: 940,
} as const;

// The sound's orb (ui/SoundOrb.tsx): the client's orb frame and an orb's fill, as by its minimap,
// with the Music tab's harp in the circle, and cloud save's "no" sign over it while it's off
export const SOUND_ORB_SPRITES = {
    frame: 1071,
    fill: 1063,
    music: 910,
    off: CLOUD_SAVE_SPRITES.problem,
} as const;

// The client's square checkbox (ui/RsCheckbox.tsx): empty and ticked, and each lit up under the
// mouse
export const CHECKBOX_SPRITES = {
    off: 1215,
    on: 1217,
    offHover: 1218,
    onHover: 1220,
} as const;

export const COLLECTION_LOG_OBJ = 22711;

// The client's close button, a window's X at its top right, and lit up under the mouse (the
// Collection log's)
export const CLOSE_SPRITES = { off: 535, hover: 536 } as const;

// The client's own back-arrow button, on a bought skill to refund a rank. Also kept in the slim
// cache by scripts/cache/slim-cache.ts.
export const REFUND_SPRITE = 1021;

// The Wardrobe's tile: a red partyhat, from its store (so the slim cache has its icon)
export const WARDROBE_ICON_OBJ = 1038;
