import { CSSProperties, useMemo, useState } from "react";

import { GameClient } from "../client/GameClient";
import { UiSnapshot } from "../client/GameStore";
import {
    LOG_TABS,
    LogEntry,
    LogItem,
    LogTab,
    getLogEntries,
    getLogTotal,
} from "../content/collectionLog";
import { EvolutionDef } from "../content/evolutions";
import { passiveName } from "../content/passives";
import { RARITIES } from "../content/rarity";
import { CLOSE_SPRITES } from "../content/titleIcons";
import { formatWeaponStat, weaponStats } from "../content/weaponStats";
import { weaponDescription, weaponName } from "../content/weapons";
import { fmtNum, t, useLang } from "../i18n";
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

function entryCount(entry: LogEntry): number {
    return entry.items.filter((item) => item.found).length;
}

// "0/12" red, part way yellow, all of them green, as OSRS colours a count
function countClass(found: number, total: number): string {
    if (found === 0) return "ui-log-none";
    return found === total ? "ui-log-all" : "ui-log-some";
}

// A sentence with an element in it, where its {placeholder} is, so a language can move it
function withPart(text: string, placeholder: string, part: JSX.Element): JSX.Element {
    const at = text.indexOf(`{${placeholder}}`);
    if (at < 0) {
        return <>{text}</>;
    }
    return (
        <>
            {text.slice(0, at)}
            {part}
            {text.slice(at + placeholder.length + 2)}
        </>
    );
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
        // lang: the names and sentences are built in it
    }, [ui.save, lang]);
    const [tab, setTab] = useState<LogTab>(tabs[0]);
    const inTab = useMemo(() => {
        const list = entries.filter((entry) => entry.tab === tab);
        // The places in order by their name, in the player's language, as OSRS lists its bosses
        return SORTED_TABS.includes(tab)
            ? list.sort((a, b) => a.name.localeCompare(b.name, lang))
            : list;
    }, [entries, tab, lang]);
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
                {/* The X comes after the tabs, drawn on the title's row, so a pad's first
                    highlight and the first Tab are the open tab, not the way out */}
                <div className="ui-log-top">
                    <div className="ui-log-head">
                        <h2 id="ui-log-title" className="ui-log-title">
                            {t("collection.title_count", {
                                title: t("collection.title"),
                                n: fmtNum(total.found),
                                total: fmtNum(total.total),
                            })}
                        </h2>
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
                    <CloseButton onClose={close} />
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
                                    aria-label={
                                        complete
                                            ? t("collection.entry_complete", { name: e.name })
                                            : undefined
                                    }
                                    aria-pressed={e === entry}
                                    onClick={() => openEntry(e.id)}
                                >
                                    <span className="ui-log-entry-name">{e.name}</span>
                                    {complete && (
                                        <span className="ui-log-check" aria-hidden="true" />
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
                                {t("collection.entry_option", {
                                    name: e.name,
                                    n: fmtNum(entryCount(e)),
                                    total: fmtNum(e.items.length),
                                })}
                            </option>
                        ))}
                    </select>
                    <div className="ui-log-page ui-log-inset">
                        <div className="ui-log-page-head">
                            <h3 className="ui-log-page-title">{entry.name}</h3>
                            <div>
                                {withPart(
                                    t("collection.obtained"),
                                    "count",
                                    <span className={countClass(found, entry.items.length)}>
                                        {fmtNum(found)}/{fmtNum(entry.items.length)}
                                    </span>,
                                )}
                            </div>
                            {entry.tally && (
                                <div>{t(entry.tally.key, { n: fmtNum(entry.tally.n) })}</div>
                            )}
                            {entry.id === "evolutions" && (
                                <div className="ui-log-how">{t("collection.evolution_intro")}</div>
                            )}
                        </div>
                        {/* The items scroll, and what's pointed at stays in view under them */}
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

function ItemSlot({
    item,
    selected,
    onShow,
}: {
    item: LogItem;
    selected: boolean;
    onShow: () => void;
}): JSX.Element {
    // What an evolution makes is hidden till it's been made: its slot shows the weapon that
    // evolves, faded, with a ? on it
    const hidden = item.evolution !== undefined && !item.found;
    const state = t(item.found ? "collection.item_found" : "collection.item_missing");
    return (
        <button
            className={
                "ui-log-item" +
                (item.found ? " ui-log-item-found" : "") +
                (selected ? " ui-log-selected" : "")
            }
            aria-label={t("collection.item_label", { name: hidden ? "???" : item.name, state })}
            aria-describedby="ui-log-detail"
            onMouseEnter={onShow}
            onFocus={onShow}
            onClick={onShow}
        >
            <ItemIcon objId={hidden ? item.evolution!.iconObjId : item.objId} size={32} />
            {hidden && (
                <span className="ui-log-unknown" aria-hidden="true">
                    ?
                </span>
            )}
            {item.count !== undefined && item.count > 1 && (
                <span className="ui-log-qty" aria-hidden="true">
                    {fmtNum(item.count)}
                </span>
            )}
        </button>
    );
}

// The item pointed at: its name, whether it's obtained, and where it's from
function ItemDetail({ item }: { item: LogItem }): JSX.Element {
    if (item.evolution) {
        return <EvolutionDetail evolution={item.evolution} made={item.found} />;
    }
    const state = t(item.found ? "collection.item_found" : "collection.item_missing");
    return (
        <div id="ui-log-detail" className="ui-log-detail">
            <div className="ui-log-state">
                {withPart(
                    t("collection.item_state", { state }),
                    "name",
                    <span className={item.found ? "ui-log-all" : "ui-log-name-missing"}>
                        {item.name}
                    </span>,
                )}
            </div>
            <div className="ui-log-how">{item.how}</div>
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
                    <span style={{ color: RARITIES[into.rarity].color }}>{weaponName(into)}</span>
                ) : (
                    <span className="ui-log-name-missing">???</span>
                )}
            </div>
            {made ? (
                <>
                    <div className="ui-log-how">{weaponDescription(into)}</div>
                    <div className="ui-log-how">
                        {weaponStats(into, into.levels[0]).map(formatWeaponStat).join(", ")}
                    </div>
                </>
            ) : (
                <div className="ui-log-how">
                    {t("collection.locked_hint", {
                        weapon: evolution.name,
                        passive: passiveName(passive),
                    })}
                </div>
            )}
        </div>
    );
}
