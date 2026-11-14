import { CSSProperties, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

import { GameClient } from "../client/GameClient";
import { UiSnapshot } from "../client/GameStore";
import {
    BASIC_PACK,
    CARDS,
    CARD_KINDS,
    CardDef,
    CardKind,
    PACKS,
    PACK_SIZE,
    PackDef,
    cardKindName,
    cardLine,
    cardNumber,
    cardRarityName,
    cardTypeName,
    cardVersions,
    packCards,
    packDescription,
    packName,
    packRarityShares,
} from "../content/cards";
import { RARITIES, RARITY_ORDER, Rarity, rarityName } from "../content/rarity";
import {
    PackCard,
    cantBuyCardPack,
    countCardsOwned,
    getBestVersion,
    getCardCopies,
    getCardPacks,
    getOwnedVersions,
    getPlatinum,
    lastCardRarities,
    packPool,
} from "../core/cards";
import type { SaveData } from "../core/save";
import { fmtNum, list, t, tp } from "../i18n";
import "./CardsScreen.css";
import { ItemIcon } from "./ItemIcon";
import { PackPreview } from "./PackPreview";
import { Platinum } from "./Platinum";
import { useMenuKeys } from "./menuKeys";
import { useDialog } from "./useDialog";

// Cards (content/cards.ts): the album of every card, each face down till it's been found, with the
// one picked shown big beside it; and the Card shop, its packs bought with coins and opened at
// once in a window over the screen. The free starter pack opens from either.

type Props = { ui: UiSnapshot; client: GameClient };

type Tab = "all" | CardKind;

export function CardsScreen({ ui, client }: Props): JSX.Element {
    const save = ui.save;
    // Opened on the shop by what Card collection only needs (GameClient.openCardShop): on its pack
    const [view, setView] = useState<"album" | "shop">(
        ui.cardShopPack !== undefined ? "shop" : "album",
    );
    const [focusPack] = useState(ui.cardShopPack || undefined);
    // Opened from the run screen (Card collection only's needs): Back goes back there
    const [backTo] = useState(ui.cardShopFrom ?? "title");
    useEffect(() => {
        if (ui.cardShopPack !== undefined) {
            client.cardShopShown();
        }
        // Once, as the screen opens
    }, []);
    const [tab, setTab] = useState<Tab>("all");
    const cards = tab === "all" ? CARDS : CARDS.filter((card) => card.kind === tab);
    const [shownId, setShownId] = useState<string | undefined>(undefined);
    const shown = cards.find((card) => card.id === shownId) ?? cards[0];
    // The pack just opened, and which it was
    const [opened, setOpened] = useState<{ pack: PackDef; cards: PackCard[] } | undefined>();
    // A pack's preview, from the shop (ui/PackPreview.tsx)
    const [previewing, setPreviewing] = useState<PackDef | undefined>();
    // A found card shown big in a window of its own, where there's no room for it beside the grid
    const [viewing, setViewing] = useState<{ card: CardDef; rarity?: Rarity } | undefined>(
        undefined,
    );
    const packs = getCardPacks(save);
    const backRef = useRef<HTMLButtonElement>(null);
    // A pack's window gives the focus back to the button that opened it, which can be gone or
    // disabled by then (no coins or packs left): then it goes to Back, so a controller keeps its
    // highlight
    useEffect(() => {
        if (!opened && document.activeElement === document.body) {
            backRef.current?.focus({ preventScroll: true });
        }
    }, [opened]);
    const pick = (card: CardDef) => {
        setShownId(card.id);
        if (getCardCopies(save, card.id) > 0 && window.matchMedia?.(NARROW).matches) {
            setViewing({ card });
        }
    };
    const back = () => client.showScreen(backTo);
    const openHeld = () => {
        const cards = client.openCardPack();
        if (cards) {
            setOpened({ pack: BASIC_PACK, cards });
        }
    };
    const buy = (pack: PackDef) => {
        const cards = client.buyCardPack(pack);
        if (cards) {
            setOpened({ pack, cards });
        }
    };
    // Escape shuts a window first (a pack's cards are already in the album)
    useMenuKeys({
        onBack: viewing
            ? () => setViewing(undefined)
            : opened
              ? () => setOpened(undefined)
              : previewing
                ? () => setPreviewing(undefined)
                : back,
    });
    const again = (pack: PackDef): { label: string; run: () => void } | undefined => {
        if (pack === BASIC_PACK && packs > 0) {
            return { label: t("cards.open_free", { n: fmtNum(packs) }), run: openHeld };
        }
        if (!cantBuyCardPack(save, pack)) {
            return {
                label: t("cards.buy_another", { price: fmtNum(pack.price) }),
                run: () => buy(pack),
            };
        }
        return undefined;
    };
    return (
        <div className="ui-fill ui-center">
            <div className="ui-panel rs-border rs-background ui-cards">
                <h2>{t("cards.title")}</h2>
                <p className="ui-subtle">{t("cards.intro", { n: fmtNum(PACK_SIZE) })}</p>
                <div className="ui-cards-tabs">
                    <button
                        className={
                            "ui-cards-tab" + (view === "album" ? " ui-cards-tab-selected" : "")
                        }
                        onClick={() => setView("album")}
                    >
                        {t("cards.album")}
                    </button>
                    <button
                        className={
                            "ui-cards-tab" + (view === "shop" ? " ui-cards-tab-selected" : "")
                        }
                        onClick={() => setView("shop")}
                    >
                        {t("cards.shop")}
                    </button>
                    {view === "album" && <span className="ui-cards-tabs-gap" />}
                    {view === "album" &&
                        (["all", ...CARD_KINDS] as Tab[]).map((kind) => (
                            <button
                                key={kind}
                                className={
                                    "ui-cards-tab" + (tab === kind ? " ui-cards-tab-selected" : "")
                                }
                                onClick={() => setTab(kind)}
                            >
                                {kind === "all" ? t("cards.kind.all") : cardKindName(kind)}
                            </button>
                        ))}
                </div>
                {view === "album" ? (
                    <div className="ui-cards-body">
                        <div className="ui-cards-grid">
                            {cards.map((card) => {
                                const copies = getCardCopies(save, card.id);
                                return (
                                    <button
                                        key={card.id}
                                        className={
                                            "ui-cards-slot" +
                                            (card === shown ? " ui-cards-slot-selected" : "")
                                        }
                                        aria-label={
                                            copies > 0
                                                ? card.name()
                                                : t("cards.not_found_label", {
                                                      number: cardNumber(card),
                                                  })
                                        }
                                        onFocus={() => setShownId(card.id)}
                                        onClick={() => pick(card)}
                                    >
                                        {copies > 0 ? (
                                            <CardFace
                                                card={card}
                                                rarity={getBestVersion(save, card)!}
                                                size="small"
                                                copies={copies}
                                                versions={getOwnedVersions(save, card).length}
                                            />
                                        ) : (
                                            <CardBack size="small" card={card} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {shown && <CardDetail save={save} card={shown} />}
                    </div>
                ) : (
                    <CardShop
                        save={save}
                        onBuy={buy}
                        onPreview={setPreviewing}
                        focusPack={focusPack}
                    />
                )}
                <div className="ui-row">
                    <button ref={backRef} className="ui-button" onClick={back}>
                        {t("canvas.back")}
                    </button>
                    <span className="ui-cards-count">
                        {t("cards.collected", {
                            n: fmtNum(countCardsOwned(save)),
                            total: fmtNum(CARDS.length),
                        })}
                    </span>
                    <Platinum amount={getPlatinum(save)} />
                    {packs > 0 && (
                        <button className="ui-button" onClick={openHeld}>
                            {t("cards.open_free", { n: fmtNum(packs) })}
                        </button>
                    )}
                </div>
            </div>
            {previewing && (
                <PackPreview
                    save={save}
                    pack={previewing}
                    onClose={() => setPreviewing(undefined)}
                />
            )}
            {opened && (
                <PackWindow
                    // A fresh window for each pack, all face down
                    key={save.cardPacksOpened}
                    pack={opened.pack}
                    cards={opened.cards}
                    client={client}
                    again={again(opened.pack)}
                    viewing={viewing !== undefined}
                    onView={(dealt) => setViewing({ card: dealt.card, rarity: dealt.rarity })}
                    onClose={() => setOpened(undefined)}
                />
            )}
            {/* Over the pack's mat too: a dealt card shown big */}
            {viewing && (
                <CardWindow
                    save={save}
                    card={viewing.card}
                    rarity={viewing.rarity}
                    onClose={() => setViewing(undefined)}
                />
            )}
        </div>
    );
}

// A line of odds by rarity, each in its colour, those above none only. A share under 1% says
// "under 1%" rather than rounding to none.
function OddsLine({ title, odds }: { title: string; odds: Record<Rarity, number> }): JSX.Element {
    return (
        <div className="ui-cards-offer-odds">
            <span>{title}</span>
            {RARITY_ORDER.filter((r) => odds[r] > 0).map((rarity) => (
                <span key={rarity} style={{ color: RARITIES[rarity].color }}>
                    {odds[rarity] < 0.01
                        ? t("cards.odds_under", { rarity: rarityName(rarity) })
                        : t("cards.odds", {
                              rarity: rarityName(rarity),
                              n: fmtNum(Math.round(odds[rarity] * 100)),
                          })}
                </span>
            ))}
        </div>
    );
}

// The Card shop: each pack's front, what it holds, its odds in words, how much of it is collected,
// its price and Buy (disabled, saying why, when it can't be bought)
function CardShop({
    save,
    onBuy,
    onPreview,
    focusPack,
}: {
    save: SaveData;
    onBuy: (pack: PackDef) => void;
    onPreview: (pack: PackDef) => void;
    // A pack to show first (scrolled to, its Buy button focused)
    focusPack?: string;
}): JSX.Element {
    const focused = useRef<HTMLDivElement>(null);
    useEffect(() => {
        focused.current?.scrollIntoView({ block: "nearest" });
        focused.current?.querySelector("button")?.focus({ preventScroll: true });
    }, []);
    return (
        <div className="ui-cards-shop">
            <p className="ui-subtle ui-cards-shop-note">{t("cards.shop_note")}</p>
            {PACKS.map((pack) => {
                // What this player's unlocked of it (packPool): all it can give them now
                const pool = packPool(save, pack);
                const all = packCards(pack);
                const why = cantBuyCardPack(save, pack);
                return (
                    <div
                        key={pack.id}
                        ref={pack.id === focusPack ? focused : undefined}
                        className={
                            "ui-cards-offer" +
                            (pack.id === focusPack ? " ui-cards-offer-focus" : "")
                        }
                    >
                        <PackFront pack={pack} />
                        <div className="ui-cards-offer-text">
                            <div className="ui-cards-offer-name">{packName(pack)}</div>
                            <div className="ui-cards-offer-desc">{packDescription(pack)}</div>
                            {pool.length > 0 && (
                                <OddsLine
                                    title={t("cards.odds_items")}
                                    odds={packRarityShares(pack, pool)}
                                />
                            )}
                            <OddsLine title={t("cards.odds_title")} odds={pack.odds} />
                            {lastCardRarities(pack.odds).length <
                                RARITY_ORDER.filter((r) => pack.odds[r] > 0).length && (
                                <div className="ui-cards-offer-desc">
                                    {t("cards.last_card", {
                                        rarity: rarityName(lastCardRarities(pack.odds)[0]),
                                    })}
                                </div>
                            )}
                            <div className="ui-cards-offer-owned">
                                {t("cards.collected_unlocked", {
                                    n: fmtNum(countCardsOwned(save, pool)),
                                    total: fmtNum(pool.length),
                                    all: fmtNum(all.length),
                                })}
                            </div>
                            <div className="ui-cards-offer-buy">
                                <Platinum amount={pack.price} />
                                <button
                                    className="ui-button"
                                    aria-label={t("cards.preview_pack", { name: packName(pack) })}
                                    onClick={() => onPreview(pack)}
                                >
                                    {t("cards.preview")}
                                </button>
                                <button
                                    className="ui-button"
                                    disabled={why !== undefined}
                                    aria-label={t("cards.buy_pack", { name: packName(pack) })}
                                    onClick={() => onBuy(pack)}
                                >
                                    {t("cards.buy")}
                                </button>
                            </div>
                            {why === "locked" && (
                                <div className="ui-cards-offer-why">{t("cards.pack_locked")}</div>
                            )}
                            {why === "platinum" && (
                                <div className="ui-cards-offer-why">
                                    {tp("cards.need_platinum", pack.price - getPlatinum(save))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// A pack's front: a sealed foil wrapper in the pack's colour, crimped at both ends, with its name
// over a medal holding its item
export function PackFront({ pack }: { pack: PackDef }): JSX.Element {
    return (
        <span
            className="ui-tcg-pack"
            style={{ "--pack-color": pack.color } as CSSProperties}
            aria-hidden="true"
        >
            <span className="ui-tcg-pack-crimp" />
            <span className="ui-tcg-pack-name">{packName(pack)}</span>
            <span className="ui-tcg-pack-medal">
                <ItemIcon objId={pack.objId} size={32} />
            </span>
            <span className="ui-tcg-pack-count">
                {t("cards.pack_count", { n: fmtNum(PACK_SIZE) })}
            </span>
            <span className="ui-tcg-pack-crimp" />
        </span>
    );
}

// Where the card's big view beside the grid is left out (CardsScreen.css, Mobile.css)
const NARROW = "(pointer: coarse), (max-width: 760px)";

type Size = "small" | "big";

function rarityStyle(rarity: Rarity): CSSProperties {
    return { "--card-rarity": RARITIES[rarity].color } as CSSProperties;
}

// A card's face, as a trading card: its rarity's colour in the frame (and its name in words on the
// type line, so it's never told by colour alone), the name in a title bar, the item's own icon at
// a whole multiple of its size in a window over a backdrop for its kind, the type line, a short
// line of what it is, and its number in the set. Rare and Very rare are foil: a sheen that moves
// only where `moving` asks (the big card and a pack's window), not across the whole album.
export function CardFace({
    card,
    rarity,
    size,
    copies = 0,
    versions = 1,
    isNew = false,
    moving = false,
}: {
    card: CardDef;
    // The version shown (cardVersions)
    rarity: Rarity;
    size: Size;
    copies?: number;
    // Versions owned, when the album shows the card: more than one is said on its footer
    versions?: number;
    isNew?: boolean;
    moving?: boolean;
}): JSX.Element {
    const foil = rarity === "rare" || rarity === "veryRare";
    return (
        <span
            className={
                `ui-tcg ui-tcg-${size} ui-tcg-face ui-tcg-${rarity}` +
                (foil ? " ui-tcg-foil" : "") +
                (moving ? " ui-tcg-moving" : "")
            }
            style={rarityStyle(rarity)}
        >
            <span className="ui-tcg-title">
                <span className="ui-tcg-name">{card.name()}</span>
                {copies > 1 && <span className="ui-tcg-copies">x{fmtNum(copies)}</span>}
            </span>
            <span className={`ui-tcg-art ui-tcg-art-${card.kind}`}>
                <ItemIcon
                    objId={card.objId}
                    spriteId={card.spriteId}
                    // Whole multiples of the icon's 32 pixels, so its pixels stay even
                    size={size === "big" ? 96 : 64}
                />
                {isNew && <span className="ui-tcg-new">{t("cards.new")}</span>}
            </span>
            <span className="ui-tcg-typeline">
                <span>{cardTypeName(card.kind)}</span>
                <span className="ui-tcg-rarity">{cardRarityName(rarity)}</span>
            </span>
            <span className="ui-tcg-text">{size === "big" ? card.text() : cardLine(card)}</span>
            <span className="ui-tcg-footer">
                <span>
                    {versions > 1
                        ? t("cards.versions_n", { n: fmtNum(versions) })
                        : t("cards.set_name")}
                </span>
                <span>{cardNumber(card)}</span>
            </span>
            {foil && <span className="ui-tcg-sheen" aria-hidden="true" />}
        </span>
    );
}

// A card face down: the deck's own back, the same for every card. In the album, a card not found
// yet shows its back with its number, so what's missing can be told apart.
export function CardBack({ size, card }: { size: Size; card?: CardDef }): JSX.Element {
    return (
        <span className={`ui-tcg ui-tcg-${size} ui-tcg-back` + (card ? " ui-tcg-missing" : "")}>
            <span className="ui-tcg-back-panel">
                <span className="ui-tcg-back-medal" aria-hidden="true">
                    RE
                </span>
            </span>
            {card && <span className="ui-tcg-back-number">{cardNumber(card)}</span>}
        </span>
    );
}

// The versions of a card owned, in words ("Common x3, Rare x1"), and those it comes in
function Versions({ save, card }: { save: SaveData; card: CardDef }): JSX.Element {
    const owned = getOwnedVersions(save, card);
    return (
        <div className="ui-cards-detail-text">
            <div>
                {t("cards.versions_owned", {
                    list: list(
                        owned.map(({ rarity, copies }) =>
                            t("cards.version_copies", {
                                rarity: cardRarityName(rarity),
                                n: fmtNum(copies),
                            }),
                        ),
                    ),
                })}
            </div>
            <div className="ui-cards-versions-all">
                {t("cards.versions_all", {
                    list: list(cardVersions(card).map(cardRarityName)),
                })}
            </div>
        </div>
    );
}

// The card picked in the album, big, at its rarest version owned, with the versions owned; one
// not found yet stays face down
function CardDetail({ save, card }: { save: SaveData; card: CardDef }): JSX.Element {
    const best = getBestVersion(save, card);
    return (
        <div className="ui-cards-detail">
            {best ? (
                <>
                    <CardFace card={card} rarity={best} size="big" moving />
                    <Versions save={save} card={card} />
                </>
            ) : (
                <>
                    <CardBack size="big" card={card} />
                    <div className="ui-cards-detail-text">{t("cards.not_found")}</div>
                </>
            )}
        </div>
    );
}

// A found card, big, in a window over the album: on a phone, where it can't go beside the grid
function CardWindow({
    save,
    card,
    rarity,
    onClose,
}: {
    save: SaveData;
    card: CardDef;
    // The version to show (a card just dealt's), else the rarest owned
    rarity?: Rarity;
    onClose: () => void;
}): JSX.Element {
    const { dialogProps } = useDialog<HTMLDivElement>();
    return (
        <div className="ui-modal" onClick={onClose}>
            <div
                {...dialogProps}
                aria-labelledby={undefined}
                aria-label={card.name()}
                className="ui-panel rs-border rs-background ui-cards-view"
                onClick={(event) => event.stopPropagation()}
            >
                <CardFace
                    card={card}
                    rarity={rarity ?? getBestVersion(save, card)!}
                    size="big"
                    moving
                />
                <Versions save={save} card={card} />
                <button className="ui-button" onClick={onClose}>
                    {t("cards.close")}
                </button>
            </div>
        </div>
    );
}

// How long "Turn all over" waits between the cards it deals
const DEAL_ALL_MS = 220;

// The mat's row as small cards lay it out (CardsScreen.css): the deck (140 wide) and five slots
// (130 with their borders, 12 apart), 224 high, and what the mat keeps round it (its padding, the
// name above, the buttons below), all in the UI's own pixels
const MAT_DECK_WIDTH = 140 + 12;
const MAT_ROW_WIDTH = 5 * 130 + 4 * 12;
const MAT_ROW_HEIGHT = 224;
const MAT_EDGE = 28;
const MAT_TOP = 64;
const MAT_BOTTOM = 72;
// The smallest the cards are drawn: smaller and their words can't be read on a phone, so the
// cards overlap instead
const MAT_MIN_SCALE = 1.1;
const MAT_MAX_SCALE = 2.4;

// The mat's scale for its size, and how far each dealt card overlaps the one before where even
// that's too wide (a short phone held sideways): as big as fits, never below MAT_MIN_SCALE
// (the deck's left out once it's all dealt, so the row has its room)
function matLayout(
    width: number,
    height: number,
    deck: boolean,
): { scale: number; overlap: number } {
    const roomW = width - 2 * MAT_EDGE;
    const roomH = height - MAT_TOP - MAT_BOTTOM;
    const rowWidth = MAT_ROW_WIDTH + (deck ? MAT_DECK_WIDTH : 0);
    const fits = Math.min(roomW / rowWidth, roomH / MAT_ROW_HEIGHT);
    const scale = Math.min(
        MAT_MAX_SCALE,
        Math.max(fits, Math.min(MAT_MIN_SCALE, roomH / MAT_ROW_HEIGHT)),
    );
    const overlap = Math.max(0, (rowWidth - roomW / scale) / 4);
    return { scale, overlap };
}

// The layout for the mat as it's drawn: its own size, in the UI's pixels (the UI can be drawn
// bigger than the window's, GameUi's scale)
function useMatLayout(deck: boolean): {
    ref: RefObject<HTMLDivElement | null>;
    layout: { scale: number; overlap: number };
} {
    const ref = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState({ scale: 1, overlap: 0 });
    // Before it's painted, so it's never drawn at the wrong size first
    useLayoutEffect(() => {
        const mat = ref.current;
        if (!mat) {
            return;
        }
        const measure = () => setLayout(matLayout(mat.clientWidth, mat.clientHeight, deck));
        measure();
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(mat);
        return () => observer.disconnect();
    }, [deck]);
    return { ref, layout };
}

// A pack just opened, on a playmat that takes the whole screen: its cards in one deck face down,
// each press of the deck dealing the top one out face up beside it (a turn as it slides, but for
// prefers-reduced-motion), with its rarity's sound; Turn all over deals the rest one after
// another. A dealt card pressed shows big. Then the same pack again, if there's one held or the
// platinum for it.
function PackWindow({
    pack,
    cards,
    client,
    again,
    viewing,
    onView,
    onClose,
}: {
    pack: PackDef;
    cards: PackCard[];
    client: GameClient;
    again?: { label: string; run: () => void };
    // A dealt card's shown big over the mat: the mat's out of reach meanwhile
    viewing: boolean;
    onView: (card: PackCard) => void;
    onClose: () => void;
}): JSX.Element {
    // How many are dealt out so far
    const [dealt, setDealt] = useState(0);
    const [rushing, setRushing] = useState(false);
    const { titleId, dialogProps } = useDialog<HTMLDivElement>();
    const allTurned = dealt >= cards.length;
    const { ref: matRef, layout } = useMatLayout(!allTurned);
    const { scale, overlap } = layout;
    const deal = () => {
        if (dealt < cards.length) {
            client.revealCard(cards[dealt].rarity);
            setDealt(dealt + 1);
        }
    };
    // Turn all over: the rest, one after another
    useEffect(() => {
        if (!rushing || allTurned) {
            return;
        }
        const timer = setTimeout(deal, dealt === 0 ? 0 : DEAL_ALL_MS);
        return () => clearTimeout(timer);
        // deal is this render's, which goes by dealt
    }, [rushing, dealt, allTurned]);
    // The deck goes as its last card's dealt, and Turn all over as it's pressed: the focus goes to
    // Done, so a keyboard or a controller carries on from there
    const doneRef = useRef<HTMLButtonElement>(null);
    // (not from a card shown big over the mat)
    useEffect(() => {
        if (allTurned && !viewing) {
            doneRef.current?.focus({ preventScroll: true });
        }
    }, [allTurned, viewing]);
    const left = cards.length - dealt;
    return (
        <div className="ui-modal ui-tcg-mat-screen">
            <div {...dialogProps} className="ui-tcg-mat" inert={viewing || undefined}>
                {/* What the row's sized to: the mat's own room */}
                <div ref={matRef} className="ui-tcg-mat-measure" aria-hidden="true" />
                <div className="ui-tcg-mat-head">
                    <h2 id={titleId} className="ui-tcg-mat-title">
                        <ItemIcon objId={pack.objId} size={32} />
                        {packName(pack)}
                    </h2>
                    <p className="ui-tcg-mat-hint">{t("cards.pack_hint")}</p>
                </div>
                <div
                    className="ui-tcg-mat-play"
                    style={{ zoom: scale, "--mat-overlap": `${overlap}px` } as CSSProperties}
                >
                    {left > 0 && (
                        <div className="ui-tcg-mat-deck">
                            <button
                                className="ui-tcg-deck"
                                aria-label={tp("cards.deck", left)}
                                // While Turn all over deals, the deck's dealing itself
                                onClick={rushing ? undefined : deal}
                            >
                                {/* The stack, a card for each left, each a little off the last */}
                                {Array.from({ length: left }, (_, i) => (
                                    <span
                                        key={i}
                                        className="ui-tcg-deck-card"
                                        style={{ "--deck-i": i } as CSSProperties}
                                    >
                                        <CardBack size="small" />
                                    </span>
                                ))}
                            </button>
                        </div>
                    )}
                    <ol className="ui-tcg-mat-row">
                        {cards.map((dealtCard, i) => (
                            <li key={i} className="ui-tcg-mat-slot">
                                {i < dealt && (
                                    <button
                                        className="ui-tcg-deal"
                                        aria-label={dealtCard.card.name()}
                                        onClick={() => onView(dealtCard)}
                                    >
                                        <span className="ui-tcg-deal-back" aria-hidden="true">
                                            <CardBack size="small" />
                                        </span>
                                        <span className="ui-tcg-deal-face">
                                            <CardFace
                                                card={dealtCard.card}
                                                rarity={dealtCard.rarity}
                                                size="small"
                                                isNew={dealtCard.isNew}
                                                moving
                                            />
                                        </span>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="ui-tcg-mat-foot">
                    {allTurned ? (
                        <>
                            <button ref={doneRef} className="ui-button" onClick={onClose}>
                                {t("cards.done")}
                            </button>
                            {again && (
                                <button className="ui-button" onClick={again.run}>
                                    {again.label}
                                </button>
                            )}
                        </>
                    ) : (
                        // Stays as it is while it deals (a disabled button would drop the focus)
                        <button className="ui-button" onClick={() => setRushing(true)}>
                            {t("cards.turn_all")}
                        </button>
                    )}
                </div>
                <span className="ui-tcg-mat-mark" aria-hidden="true">
                    Run Escape
                </span>
            </div>
        </div>
    );
}
