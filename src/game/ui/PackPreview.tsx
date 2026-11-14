import {
    CSSProperties,
    ReactNode,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { CardDef, PackDef, packCards, packName } from "../content/cards";
import { getMap, mapName } from "../content/maps";
import { RARITIES, RARITY_ORDER, Rarity, rarityName } from "../content/rarity";
import {
    PREVIEW_PACKS,
    PackOdds,
    cachePackOdds,
    cardUnlockMap,
    getCachedPackOdds,
    packOddsKey,
    simulatePackOdds,
} from "../core/cardOdds";
import { packPool } from "../core/cards";
import type { SaveData } from "../core/save";
import { fmtNum, t } from "../i18n";
import { ItemIcon } from "./ItemIcon";
import { useDialog } from "./useDialog";

// Packs opened per chunk while the preview works its odds out: small enough that a phone's page
// never stalls, as many chunks as it takes to reach PREVIEW_PACKS
const CHUNK = 5_000;

// A pack's odds for this save, simulated a chunk at a time and kept (getCachedPackOdds) till its
// pool changes; undefined until they're done
export function usePackOdds(pack: PackDef, pool: readonly CardDef[]): PackOdds | undefined {
    const [odds, setOdds] = useState(() => getCachedPackOdds(pack, pool));
    // By what the odds depend on, not the pool's array: a save written meanwhile doesn't start over
    const key = packOddsKey(pack, pool);
    useEffect(() => {
        const cached = getCachedPackOdds(pack, pool);
        if (cached) {
            setOdds(cached);
            return;
        }
        setOdds(undefined);
        const sim = simulatePackOdds(pack, pool);
        let timer = 0;
        const run = () => {
            sim.step(CHUNK);
            if (sim.done) {
                const result = sim.result();
                cachePackOdds(pack, pool, result);
                setOdds(result);
            } else {
                timer = window.setTimeout(run, 0);
            }
        };
        timer = window.setTimeout(run, 0);
        return () => window.clearTimeout(timer);
        // The key says when pack or pool changes
    }, [key]);
    return odds;
}

// A chance as a percentage: "0.42%", "12.5%", or "under 0.01%" for a sliver
export function formatChance(chance: number): string {
    if (chance > 0 && chance < 0.0001) {
        return t("cards.preview.under", { n: fmtNum(0.01) });
    }
    const percent = chance * 100;
    const digits = percent < 1 ? 2 : 1;
    return t("cards.preview.percent", {
        n: fmtNum(percent, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    });
}

// The tab each pack's preview was last on, this session
const lastTab = new Map<string, PreviewTab>();

type PreviewTab = "all" | Rarity;

// The Card shop's preview of a pack: every card it can hold, a tab for each rarity of thing
// (and All), each card with the chance it's in one pack of this kind for this save, or Locked with
// where to unlock it. The info icon's popover has the pack's rarity rates and how they're got.
export function PackPreview({
    save,
    pack,
    info,
    onInfo,
    onClose,
}: {
    save: SaveData;
    pack: PackDef;
    // The info popover, open or not: the screen's Escape shuts it before the preview
    info: boolean;
    onInfo: (open: boolean) => void;
    onClose: () => void;
}): JSX.Element {
    const { titleId, dialogProps } = useDialog<HTMLDivElement>();
    const pool = useMemo(() => packPool(save, pack), [save, pack]);
    const odds = usePackOdds(pack, pool);
    const unlocked = useMemo(() => new Set(pool.map((card) => card.id)), [pool]);
    const all = useMemo(() => packCards(pack), [pack]);
    // Its rarities, as the game orders them
    const rarities = RARITY_ORDER.filter((rarity) => all.some((card) => card.rarity === rarity));
    const [tab, setTab] = useState<PreviewTab>(() => {
        const last = lastTab.get(pack.id);
        return last && (last === "all" || rarities.includes(last)) ? last : "all";
    });
    const pick = (next: PreviewTab) => {
        lastTab.set(pack.id, next);
        setTab(next);
    };
    // The tab's cards: likeliest first, locked ones last
    const cards = useMemo(
        () =>
            all
                .filter((card) => tab === "all" || card.rarity === tab)
                .sort((a, b) => {
                    const lockedA = unlocked.has(a.id) ? 0 : 1;
                    const lockedB = unlocked.has(b.id) ? 0 : 1;
                    if (lockedA !== lockedB) {
                        return lockedA - lockedB;
                    }
                    return (odds?.perCard.get(b.id) ?? 0) - (odds?.perCard.get(a.id) ?? 0);
                }),
        [all, tab, unlocked, odds],
    );
    return (
        <div className="ui-modal" onClick={onClose}>
            <div
                {...dialogProps}
                className="ui-panel rs-border rs-background ui-pack-preview"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="ui-pack-preview-head">
                    <h2 id={titleId}>{t("cards.preview.title", { name: packName(pack) })}</h2>
                    <InfoPopover open={info} onOpen={onInfo}>
                        <PackRates odds={odds} />
                    </InfoPopover>
                    <button className="ui-button" onClick={onClose}>
                        {t("cards.preview.close")}
                    </button>
                </div>
                <div className="ui-cards-tabs" role="group" aria-label={t("cards.preview.tabs")}>
                    {(["all", ...rarities] as PreviewTab[]).map((id) => (
                        <button
                            key={id}
                            className={
                                "ui-cards-tab" + (id === tab ? " ui-cards-tab-selected" : "")
                            }
                            aria-pressed={id === tab}
                            style={id === "all" ? undefined : { color: RARITIES[id].color }}
                            onClick={() => pick(id)}
                        >
                            {t("cards.preview.group", {
                                rarity: id === "all" ? t("cards.kind.all") : rarityName(id),
                                n: fmtNum(
                                    id === "all"
                                        ? all.length
                                        : all.filter((card) => card.rarity === id).length,
                                ),
                            })}
                        </button>
                    ))}
                </div>
                {(pool.length === 0 || !odds) && (
                    <p className="ui-subtle ui-pack-preview-status" role="status">
                        {pool.length === 0 ? t("cards.pack_locked") : t("cards.preview.working")}
                    </p>
                )}
                {/* Scrolls with the keys too */}
                <ul className="ui-pack-preview-grid" tabIndex={0}>
                    {cards.map((card) => (
                        <PreviewTile
                            key={card.id}
                            card={card}
                            locked={!unlocked.has(card.id)}
                            chance={odds?.perCard.get(card.id)}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Whether a pointer can hover here (a mouse), where the popover opens on hover too
const canHover = (): boolean => window.matchMedia?.("(hover: hover)").matches ?? false;

// A drawn "i" in a circle that opens a small bubble pointing at it, as a popover: on a press (and
// on hover or focus with a mouse), shut by a press outside, Escape (the screen's: `open` is its
// state) or the icon again. It stays inside the window, below the icon or above where there's no
// room, and moved sideways off an edge with its arrow still at the icon.
function InfoPopover({
    open,
    onOpen,
    children,
}: {
    open: boolean;
    onOpen: (open: boolean) => void;
    children: ReactNode;
}): JSX.Element {
    const iconRef = useRef<HTMLButtonElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const id = useId();
    // Opened by hovering or focus, not a press: leaving shuts it
    const [hovered, setHovered] = useState(false);
    const [place, setPlace] = useState<{
        left: number;
        top: number;
        arrow: number;
        above: boolean;
    }>();
    useLayoutEffect(() => {
        const icon = iconRef.current;
        const bubble = bubbleRef.current;
        if (!open || !icon || !bubble) {
            setPlace(undefined);
            return;
        }
        // Worked out in the window's pixels, then set in the icon's own (the UI can be zoomed)
        const host = icon.parentElement!.getBoundingClientRect();
        const at = icon.getBoundingClientRect();
        const scale = at.width / (icon.offsetWidth || at.width) || 1;
        const width = bubble.offsetWidth * scale;
        const height = bubble.offsetHeight * scale;
        const gap = 10 * scale;
        const middle = at.left + at.width / 2;
        const left = Math.min(Math.max(8, middle - width / 2), window.innerWidth - width - 8);
        const above =
            at.bottom + gap + height > window.innerHeight - 8 && at.top - gap - height > 8;
        const top = above ? at.top - gap - height : at.bottom + gap;
        setPlace({
            left: (left - host.left) / scale,
            top: (top - host.top) / scale,
            arrow: Math.min(Math.max(12, (middle - left) / scale), bubble.offsetWidth - 12),
            above,
        });
    }, [open]);
    // A press anywhere else shuts it
    useEffect(() => {
        if (!open) {
            return;
        }
        const onDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!iconRef.current?.contains(target) && !bubbleRef.current?.contains(target)) {
                setHovered(false);
                onOpen(false);
            }
        };
        window.addEventListener("pointerdown", onDown, true);
        return () => window.removeEventListener("pointerdown", onDown, true);
    }, [open, onOpen]);
    const enter = () => {
        if (!open && canHover()) {
            setHovered(true);
            onOpen(true);
        }
    };
    const leave = () => {
        if (hovered) {
            setHovered(false);
            onOpen(false);
        }
    };
    return (
        <span className="ui-info" onMouseEnter={enter} onMouseLeave={leave}>
            <button
                ref={iconRef}
                className="ui-info-icon"
                aria-label={t("cards.preview.info")}
                aria-expanded={open}
                aria-controls={open ? id : undefined}
                onFocus={enter}
                onBlur={(event) => {
                    if (!bubbleRef.current?.contains(event.relatedTarget)) {
                        leave();
                    }
                }}
                onClick={() => {
                    // A press pins it open, or shuts it
                    if (open && !hovered) {
                        onOpen(false);
                    } else {
                        setHovered(false);
                        onOpen(true);
                    }
                }}
            >
                <span aria-hidden="true">i</span>
            </button>
            {open && (
                <div
                    ref={bubbleRef}
                    id={id}
                    role="dialog"
                    aria-label={t("cards.preview.info")}
                    className={"ui-info-bubble" + (place?.above ? " ui-info-above" : "")}
                    style={
                        place
                            ? ({
                                  left: place.left,
                                  top: place.top,
                                  "--arrow": `${place.arrow}px`,
                              } as CSSProperties)
                            : { visibility: "hidden" }
                    }
                >
                    {children}
                </div>
            )}
        </span>
    );
}

function PreviewTile({
    card,
    locked,
    chance,
}: {
    card: CardDef;
    locked: boolean;
    chance: number | undefined;
}): JSX.Element {
    const mapId = locked ? cardUnlockMap(card) : undefined;
    return (
        <li className={"ui-pack-preview-tile" + (locked ? " ui-pack-preview-locked" : "")}>
            <ItemIcon objId={card.objId} spriteId={card.spriteId} size={32} />
            <span className="ui-pack-preview-name">{card.name()}</span>
            <span className="ui-pack-preview-rate">
                {locked
                    ? t("cards.preview.locked")
                    : chance === undefined
                      ? "..."
                      : t("cards.preview.per_pack", { chance: formatChance(chance) })}
            </span>
            {locked && mapId !== undefined && (
                <span className="ui-pack-preview-unlock">
                    {t("cards.preview.unlock_in", { map: mapName(getMap(mapId)) })}
                </span>
            )}
        </li>
    );
}

// A pack's rarity rates: per card, the chance of each item rarity and of each version, then the
// chance a pack holds a Very rare item at all
function PackRates({ odds }: { odds: PackOdds | undefined }): JSX.Element {
    const cell = (value: number | undefined) => (value === undefined ? "..." : formatChance(value));
    return (
        <div className="ui-pack-rates">
            <table>
                <caption>{t("cards.preview.rates_caption")}</caption>
                <thead>
                    <tr>
                        <th scope="col">{t("cards.preview.rarity")}</th>
                        <th scope="col">{t("cards.preview.item")}</th>
                        <th scope="col">{t("cards.preview.version")}</th>
                    </tr>
                </thead>
                <tbody>
                    {RARITY_ORDER.map((rarity: Rarity) => (
                        <tr key={rarity}>
                            <th scope="row" style={{ color: RARITIES[rarity].color }}>
                                {rarityName(rarity)}
                            </th>
                            <td>{cell(odds?.items[rarity])}</td>
                            <td>{cell(odds?.versions[rarity])}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p>{t("cards.preview.very_rare_pack", { chance: cell(odds?.veryRarePack) })}</p>
            <p className="ui-subtle">{t("cards.preview.from", { n: fmtNum(PREVIEW_PACKS) })}</p>
            <p className="ui-subtle">{t("cards.preview.rates_note")}</p>
        </div>
    );
}
