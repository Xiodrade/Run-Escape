import { GameClient } from "../client/GameClient";
import { CardDef } from "../content/cards";
import { characterName, getCharacter } from "../content/characters";
import { RARITIES } from "../content/rarity";
import { getCardRunNeeds } from "../core/cardRuns";
import type { SaveData } from "../core/save";
import { list, t, tp } from "../i18n";
import "./CardsScreen.css";
import { ItemIcon } from "./ItemIcon";
import { useDialog } from "./useDialog";

// Card collection only, what's still needed (core/cardRuns.ts, getCardRunNeeds): only what's
// missing. The adventurer's starter cards, if any are; then each kind short of a level up's, how
// many more, and the cards that would count, each with the Card shop on the pack that holds them.

// What the run screen's button says, from the same needs as the window: the kinds still short
export function cardNeedsLabel(needs: ReturnType<typeof getCardRunNeeds>): string | undefined {
    const parts = [
        ...needs.starter
            .filter((s) => !s.owned)
            .map((s) => t("ui.cards_only.need_card", { name: s.card.name() })),
        ...(needs.weapons.missing > 0
            ? [tp("ui.cards_only.need_weapons", needs.weapons.missing)]
            : []),
        ...(needs.passives.missing > 0
            ? [tp("ui.cards_only.need_passives", needs.passives.missing)]
            : []),
    ];
    return parts.length > 0 ? t("ui.cards_only.need", { list: list(parts) }) : undefined;
}

type Props = {
    save: SaveData;
    characterId: string;
    client: GameClient;
    onClose: () => void;
};

export function CardNeedsWindow({ save, characterId, client, onClose }: Props): JSX.Element {
    const needs = getCardRunNeeds(save, characterId);
    const { titleId, dialogProps } = useDialog<HTMLDivElement>();
    const missingStarter = needs.starter.filter((s) => !s.owned).map((s) => s.card);
    const shop = (pack: string) => client.openCardShop(pack);
    return (
        <div className="ui-modal" onClick={onClose}>
            <div
                {...dialogProps}
                className="ui-panel rs-border rs-background ui-card-needs"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id={titleId}>{t("cards.needs.title")}</h2>
                <p className="ui-subtle">{t("cards.needs.why")}</p>
                <div className="ui-card-needs-body">
                    {missingStarter.length > 0 && (
                        <NeedSet
                            title={t("cards.needs.starter", {
                                name: characterName(getCharacter(characterId)),
                            })}
                            cards={missingStarter}
                            onShop={() => shop("weapons")}
                        />
                    )}
                    {needs.weapons.missing > 0 && (
                        <NeedSet
                            title={tp("cards.needs.weapons", needs.weapons.missing)}
                            cards={needs.weapons.cards.filter((c) => !c.owned).map((c) => c.card)}
                            onShop={() => shop("weapons")}
                        />
                    )}
                    {needs.passives.missing > 0 && (
                        <NeedSet
                            title={tp("cards.needs.passives", needs.passives.missing)}
                            cards={needs.passives.cards.filter((c) => !c.owned).map((c) => c.card)}
                            onShop={() => shop("passives")}
                        />
                    )}
                </div>
                <div className="ui-row">
                    <button className="ui-button" onClick={onClose}>
                        {t("cards.close")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// One kind still short: its line and the Card shop's button, then the cards that would count
function NeedSet({
    title,
    cards,
    onShop,
}: {
    title: string;
    cards: CardDef[];
    onShop: () => void;
}): JSX.Element {
    return (
        <section className="ui-card-needs-set">
            <div className="ui-card-needs-head">
                <h3 className="ui-card-needs-title">{title}</h3>
                <button className="ui-button ui-button-small" onClick={onShop}>
                    {t("cards.shop")}
                </button>
            </div>
            <ul className="ui-card-needs-list">
                {cards.map((card) => (
                    <li
                        key={card.id}
                        className="ui-card-need"
                        style={{ borderColor: RARITIES[card.rarity].color }}
                    >
                        <ItemIcon objId={card.objId} spriteId={card.spriteId} size={32} />
                        <span className="ui-card-need-name">{card.name()}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
