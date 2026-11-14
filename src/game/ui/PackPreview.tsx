import { useEffect, useMemo, useState } from "react";

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

// The Card shop's preview of a pack: every card it can hold, by its item's rarity, each with the
// chance it's in one pack of this kind for this save, or Locked with where to unlock it; and an
// Info view of the pack's rarity rates. The figures come from PREVIEW_PACKS simulated packs.
export function PackPreview({
    save,
    pack,
    onClose,
}: {
    save: SaveData;
    pack: PackDef;
    onClose: () => void;
}): JSX.Element {
    const { titleId, dialogProps } = useDialog<HTMLDivElement>();
    const pool = useMemo(() => packPool(save, pack), [save, pack]);
    const odds = usePackOdds(pack, pool);
    const [info, setInfo] = useState(false);
    const unlocked = useMemo(() => new Set(pool.map((card) => card.id)), [pool]);
    // By its item's rarity, rarest first; within one, likeliest first, locked ones last
    const groups = useMemo(() => {
        const all = packCards(pack);
        return [...RARITY_ORDER].reverse().flatMap((rarity) => {
            const cards = all
                .filter((card) => card.rarity === rarity)
                .sort((a, b) => {
                    const lockedA = unlocked.has(a.id) ? 0 : 1;
                    const lockedB = unlocked.has(b.id) ? 0 : 1;
                    if (lockedA !== lockedB) {
                        return lockedA - lockedB;
                    }
                    return (odds?.perCard.get(b.id) ?? 0) - (odds?.perCard.get(a.id) ?? 0);
                });
            return cards.length > 0 ? [{ rarity, cards }] : [];
        });
    }, [pack, unlocked, odds]);
    return (
        <div className="ui-modal" onClick={onClose}>
            <div
                {...dialogProps}
                className="ui-panel rs-border rs-background ui-pack-preview"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="ui-pack-preview-head">
                    <h2 id={titleId}>{t("cards.preview.title", { name: packName(pack) })}</h2>
                    <button
                        className={"ui-button" + (info ? " ui-pack-preview-info-on" : "")}
                        aria-pressed={info}
                        onClick={() => setInfo(!info)}
                    >
                        {t("cards.preview.info")}
                    </button>
                    <button className="ui-button" onClick={onClose}>
                        {t("cards.preview.close")}
                    </button>
                </div>
                <p className="ui-subtle" role="status">
                    {pool.length === 0
                        ? t("cards.pack_locked")
                        : odds
                          ? t("cards.preview.from", { n: fmtNum(PREVIEW_PACKS) })
                          : t("cards.preview.working")}
                </p>
                {info ? (
                    <PackRates odds={odds} />
                ) : (
                    // Scrolls with the keys too
                    <div className="ui-pack-preview-list" tabIndex={0}>
                        {groups.map(({ rarity, cards }) => (
                            <section key={rarity}>
                                <h3 style={{ color: RARITIES[rarity].color }}>
                                    {t("cards.preview.group", {
                                        rarity: rarityName(rarity),
                                        n: fmtNum(cards.length),
                                    })}
                                </h3>
                                <ul className="ui-pack-preview-grid">
                                    {cards.map((card) => (
                                        <PreviewTile
                                            key={card.id}
                                            card={card}
                                            locked={!unlocked.has(card.id)}
                                            chance={odds?.perCard.get(card.id)}
                                        />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
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
            <p className="ui-subtle">{t("cards.preview.rates_note")}</p>
        </div>
    );
}
