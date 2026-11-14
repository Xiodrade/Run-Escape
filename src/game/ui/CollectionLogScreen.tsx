import { CSSProperties, useMemo, useState } from "react";

import { GameClient } from "../client/GameClient";
import { UiSnapshot } from "../client/GameStore";
import { CARDS } from "../content/cards";
import {
    LOG_TABS,
    LogEntry,
    LogItem,
    LogTab,
    getLogEntries,
    getLogTotal,
} from "../content/collectionLog";
import { EvolutionDef } from "../content/evolutions";
import { RARITIES, rarityName } from "../content/rarity";
import { CLOSE_SPRITES } from "../content/titleIcons";
import { formatWeaponStat, weaponStats } from "../content/weaponStats";
import { countCardsOwned } from "../core/cards";
import { fmtNum, t, tl, useLang } from "../i18n";
import "./CollectionLogScreen.css";
import { ItemIcon } from "./ItemIcon";
import { releaseFocus, useMenuKeys } from "./menuKeys";
import { useSpriteFrame } from "./useSpriteFrame";

// The Collection log, laid out as OSRS's client lays it: its total in the title, tabs along the
// top, the tab's entries down the left (green once complete) and the entry's items on the right,
// dimmed till they're obtained. What's pointed at is described under the items, as the log's
// items say where they're from. On a narrow screen the entries are a dropdown above the items.
// What's listed comes from content/collectionLog.ts.

type Props = { ui: UiSnapshot; client: GameClient };

const SORTED_TABS: LogTab[] = ["bosses", "raids", "minigames"];

function entryName(entry: LogEntry): string {
    return entry.nameKey ? t(entry.name) : tl(entry.name);
}

function entryCount(entry: LogEntry): number {
    return entry.items.filter((item) => item.found).length;
}

// "0/12" red, part way yellow, all of them green, as OSRS colours a count
function countClass(found: number, total: number): string {
    if (found === 0) return "ui-log-none";
    return found === total ? "ui-log-all" : "ui-log-some";
}

export function CollectionLogScreen({ ui, client }: Props): JSX.Element {
    const lang = useLang();
    // Built once for the save and language, not on each item the mouse crosses
    const { entries, tabs, total } = useMemo(() => {
        const built = getLogEntries(ui.save);
        return {
            entries: built,
            tabs: LOG_TABS.filter((tab) => built.some((entry) => entry.tab === tab)),
            total: getLogTotal(built),
        };
        // lang: the casket gear's sentences are built in it
    }, [ui.save, lang]);
    const [tab, setTab] = useState<LogTab>(tabs[0]);
    const inTab = useMemo(() => {
        const list = entries.filter((entry) => entry.tab === tab);
        // The places in order by their name, in the player's language, as OSRS lists its bosses
        return SORTED_TABS.includes(tab)
            ? list.sort((a, b) => entryName(a).localeCompare(entryName(b)))
            : list;
    }, [entries, tab]);
    const [entryIds, setEntryIds] = useState<Partial<Record<LogTab, string>>>({});
    const entry = inTab.find((e) => e.id === entryIds[tab]) ?? inTab[0];
    const [itemIndex, setItemIndex] = useState(0);
    const item: LogItem | undefined = entry.items[itemIndex] ?? entry.items[0];
    const close = () => client.showScreen("title");
    useMenuKeys({ onBack: close });

    const openTab = (next: LogTab) => {
        setTab(next);
        setItemIndex(0);
    };
    const openEntry = (id: string) => {
        setEntryIds({ ...entryIds, [tab]: id });
        setItemIndex(0);
    };
    const found = entryCount(entry);

    return (
        <div className="ui-fill ui-center">
            <div
                className="ui-panel rs-border rs-background ui-log"
                role="dialog"
                aria-labelledby="ui-log-title"
            >
                {/* The log's total on the left, its items only; the cards' own on the right, each
                    card once, any version; stacked where they won't fit on one line */}
                <div className="ui-log-head">
                    <div className="ui-log-counts">
                        <h2 id="ui-log-title" className="ui-log-title">
                            {t("collection.title")} - {fmtNum(total.found)}/{fmtNum(total.total)}
                        </h2>
                        <span className="ui-log-title ui-log-cards-count">
                            {t("collection.cards_count", {
                                n: fmtNum(countCardsOwned(ui.save)),
                                total: fmtNum(CARDS.length),
                            })}
                        </span>
                    </div>
                    <CloseButton onClose={close} />
                </div>
                <div className="ui-log-tabs" role="group" aria-label={t("collection.tabs")}>
                    {tabs.map((id) => (
                        <button
                            key={id}
                            className={"ui-log-tab" + (id === tab ? " ui-log-selected" : "")}
                            aria-pressed={id === tab}
                            onClick={(event) => {
                                openTab(id);
                                releaseFocus(event);
                            }}
                        >
                            {t(`collection.tab.${id}`)}
                        </button>
                    ))}
                </div>
                <div className="ui-log-body">
                    <div
                        className="ui-log-entries ui-log-inset"
                        role="group"
                        aria-label={t("collection.entries")}
                    >
                        {inTab.map((e) => {
                            const complete = entryCount(e) === e.items.length;
                            return (
                                <button
                                    key={e.id}
                                    className={
                                        "ui-log-entry" +
                                        (complete ? " ui-log-entry-complete" : "") +
                                        (e === entry ? " ui-log-selected" : "")
                                    }
                                    aria-pressed={e === entry}
                                    onClick={() => openEntry(e.id)}
                                >
                                    <span className="ui-log-entry-name">{entryName(e)}</span>
                                    {complete && (
                                        <>
                                            <span className="ui-log-check" aria-hidden="true" />
                                            <span className="ui-log-sr">
                                                {", " + t("collection.complete")}
                                            </span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <select
                        className="ui-log-entry-select"
                        aria-label={t("collection.entries")}
                        value={entry.id}
                        onChange={(event) => openEntry(event.target.value)}
                    >
                        {inTab.map((e) => (
                            <option key={e.id} value={e.id}>
                                {entryName(e)} ({fmtNum(entryCount(e))}/{fmtNum(e.items.length)})
                            </option>
                        ))}
                    </select>
                    <div className="ui-log-page ui-log-inset">
                        <div className="ui-log-page-head">
                            <h3 className="ui-log-page-title">{entryName(entry)}</h3>
                            <div>
                                {t("collection.obtained")}{" "}
                                <span className={countClass(found, entry.items.length)}>
                                    {fmtNum(found)}/{fmtNum(entry.items.length)}
                                </span>
                                {found === entry.items.length && (
                                    <span className="ui-log-sr">
                                        {", " + t("collection.complete")}
                                    </span>
                                )}
                            </div>
                            {entry.tally && (
                                <div>{t(entry.tally.key, { n: fmtNum(entry.tally.n) })}</div>
                            )}
                            {entry.id === "evolutions" && (
                                <div className="ui-log-how">{t("collection.evolution_intro")}</div>
                            )}
                        </div>
                        <div
                            className="ui-log-grid"
                            role="group"
                            aria-label={t("collection.items")}
                        >
                            {entry.items.map((it, i) => (
                                <ItemSlot
                                    key={it.key}
                                    item={it}
                                    selected={it === item}
                                    onShow={() => setItemIndex(i)}
                                />
                            ))}
                        </div>
                        {item && <ItemDetail item={item} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// The client's own X, lit under the mouse; a plain X till its sprites are drawn
function CloseButton({ onClose }: { onClose: () => void }): JSX.Element {
    const off = useSpriteFrame(CLOSE_SPRITES.off, 0);
    const hover = useSpriteFrame(CLOSE_SPRITES.hover, 0);
    const style =
        off && hover
            ? ({ "--rs-close": `url(${off})`, "--rs-close-lit": `url(${hover})` } as CSSProperties)
            : undefined;
    return (
        <button
            className={"ui-log-close" + (style ? " ui-log-close-sprite" : "")}
            style={style}
            aria-label={t("collection.close")}
            onClick={onClose}
        >
            {style ? null : "X"}
        </button>
    );
}

// What an evolution makes is hidden till it's been made
function isHidden(item: LogItem): boolean {
    return item.evolution !== undefined && !item.found;
}

function ItemSlot({
    item,
    selected,
    onShow,
}: {
    item: LogItem;
    selected: boolean;
    onShow: () => void;
}): JSX.Element {
    const hidden = isHidden(item);
    const name = hidden ? "???" : tl(item.name);
    const state = item.version
        ? rarityName(item.version)
        : t(item.found ? "collection.item_found" : "collection.item_missing");
    return (
        <button
            className={
                "ui-log-item" +
                (item.found ? " ui-log-item-found" : "") +
                (item.version ? " ui-log-item-card" : "") +
                (selected ? " ui-log-selected" : "")
            }
            style={
                item.version
                    ? ({ "--card-rarity": RARITIES[item.version].color } as CSSProperties)
                    : undefined
            }
            aria-label={
                `${name}, ${state}` +
                (item.cardsOnly ? `, ${t("collection.cards_only_first")}` : "")
            }
            aria-describedby="ui-log-detail"
            onMouseEnter={onShow}
            onFocus={onShow}
            onClick={onShow}
        >
            {hidden ? (
                <span className="ui-log-unknown">?</span>
            ) : (
                <ItemIcon objId={item.objId} size={32} />
            )}
            {item.count !== undefined && item.count > 1 && (
                <span className="ui-log-qty" aria-hidden="true">
                    {fmtNum(item.count)}
                </span>
            )}
            {item.cardsOnly && <span className="ui-log-cards-badge" aria-hidden="true" />}
        </button>
    );
}

// The item pointed at: its name, whether it's obtained, and where it's from
function ItemDetail({ item }: { item: LogItem }): JSX.Element {
    if (item.evolution) {
        return <EvolutionDetail evolution={item.evolution} made={item.found} />;
    }
    return (
        <div id="ui-log-detail" className="ui-log-detail">
            <div>
                <span className={item.found ? "ui-log-all" : "ui-log-name-missing"}>
                    {tl(item.name)}
                </span>
                <span className="ui-log-state">
                    {" "}
                    ({t(item.found ? "collection.item_found" : "collection.item_missing")})
                </span>
            </div>
            <div className="ui-log-how">{tl(item.how)}</div>
            {item.cardsOnly && (
                <div className="ui-log-how ui-log-cards-only">
                    {t("collection.cards_only_first")}
                </div>
            )}
        </div>
    );
}

// An evolution's recipe, always shown; what it makes, once it's been made
function EvolutionDetail({
    evolution,
    made,
}: {
    evolution: EvolutionDef;
    made: boolean;
}): JSX.Element {
    const { into, passive } = evolution;
    return (
        <div id="ui-log-detail" className="ui-log-detail">
            <div className="ui-log-recipe">
                <ItemIcon objId={evolution.iconObjId} size={24} />
                <span className="ui-log-sign">+</span>
                <ItemIcon objId={passive.iconObjId} spriteId={passive.iconSpriteId} size={24} />
                <span className="ui-log-sign">=</span>
                {made ? (
                    <span style={{ color: RARITIES[into.rarity].color }}>{tl(into.name)}</span>
                ) : (
                    <span className="ui-log-name-missing">???</span>
                )}
            </div>
            {made ? (
                <>
                    <div className="ui-log-how">{tl(into.description)}</div>
                    <div className="ui-log-how">
                        {weaponStats(into, into.levels[0]).map(formatWeaponStat).join(", ")}
                    </div>
                </>
            ) : (
                <div className="ui-log-how">
                    {t("collection.locked_hint", {
                        weapon: tl(evolution.name),
                        passive: tl(passive.name),
                    })}
                </div>
            )}
        </div>
    );
}
