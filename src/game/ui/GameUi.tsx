import {
    CSSProperties,
    ReactNode,
    memo,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";

import { OsrsLoadingBar } from "../../components/rs/loading/OsrsLoadingBar";
import compass from "../../components/rs/minimap/compass.png";
import minimapFrame from "../../components/rs/minimap/minimap-frame.png";
import { EquipSlot } from "../../rs/model/player/PlayerModelLoader";
import { isCoarsePointer } from "../../util/DeviceUtil";
import { describeBlessed } from "../client/BlessingViews";
import { cloudKeepsCopy } from "../client/CloudSave";
import { FRAME_RATES, FrameRate } from "../client/DisplaySettings";
import type { GameClient } from "../client/GameClient";
import { padLabel } from "../client/GamePad";
import {
    BuffView,
    GameStore,
    GearSlotView,
    HudNumbers,
    HudView,
    InventorySlotView,
    QuestTrackView,
    SlotView,
    UiSnapshot,
} from "../client/GameStore";
import { formatTime } from "../client/GameView";
import { RUN_ANALYTICS_URL } from "../client/RunAnalytics";
import {
    ACT_BY_ID,
    ActDef,
    FALLEN_EMPIRE,
    actEndingLines,
    actEndingTitle,
    actName,
    actSlotBoss,
    actSlotName,
    getAct,
    getActFightsBeaten,
    getActMapIds,
    getActStep,
    isActEnded,
    isActOut,
} from "../content/acts";
import type { CardDef } from "../content/cards";
import { characterDescription, characterName, getCharacter } from "../content/characters";
import { AWAKENERS_ORB_OBJ } from "../content/gauntlet";
import { invaderName } from "../content/invasions";
import { INVOCATION_BY_ID, RAID_BAND_SPRITES, getRaidBand } from "../content/invocations";
import { getInvocationBadge } from "../content/invocations";
import { GEAR_SLOT_BY_ID, UTILITY } from "../content/items";
import {
    ACT_MAPS,
    CAMPAIGN_MAPS,
    DEV_MAPS,
    FIGHT_MAPS,
    FUN_MAPS,
    MAPS,
    MAP_BY_ID,
    RAID_MAPS,
    SEASONAL_MAPS,
    getMap,
    getMapCharacter,
    getRoster,
    isPeaceful,
    mapDescription,
    mapFinalBossWarning,
    mapName,
    takesInvocations,
    takesRelics,
} from "../content/maps";
import { PETS, PET_BY_ID, getFoundPets, getPetTrophy, isPetFound } from "../content/pets";
import { RARITIES } from "../content/rarity";
import { RELIC_BY_ID, cleanRelics, getOpenRelicTiers, relicName } from "../content/relics";
import {
    REMIX_BY_ID,
    REMIX_IDS,
    RemixId,
    getMapRemixes,
    isRemixOpen,
    remixDescription,
    remixKey,
    remixName,
    remixPrefix,
} from "../content/remixes";
import { SHOP_UPGRADES, shopUpgradeDescription, shopUpgradeName } from "../content/shop";
import { StatText, formatStats } from "../content/stats";
import {
    CARDS_ICON_OBJ,
    COLLECTION_LOG_OBJ,
    REFUND_SPRITE,
    TITLE_TAB_SPRITES,
    WARDROBE_ICON_OBJ,
} from "../content/titleIcons";
import { SCABARAS } from "../content/tombs";
import { TROPHY_BY_ID, trophyName } from "../content/trophies";
import { CharacterDef, CombatStyle, MapDef, Stats } from "../content/types";
import { MapReward, describeUnlockTask, getMapRewards } from "../content/unlocks";
import { isVaultOpen, parseWeekKey } from "../content/vault";
import { WeaponStatLine, formatWeaponStat } from "../content/weaponStats";
import { WEAPONS, getWeapon, weaponName } from "../content/weapons";
import type { RaidChest, ScabarasPuzzle, TombsSummary } from "../core/Sim";
import {
    getCardLock,
    getCardRunNeeds,
    getCardsOnlyPet,
    hasPetCard,
    isCardLocked,
    isCardRunBlocked,
    playsCardsOnly,
} from "../core/cardRuns";
import {
    NewerSaveError,
    RecordSetup,
    SaveData,
    getFightStage,
    getNextUpgradeCost,
    getReachedStages,
    getRemixBest,
    getSkillCoins,
    hasGauntletLooks,
    importSave,
    isEndlessUnlocked,
    isExpertUnlocked,
    isGauntletOpen,
    isHardUnlocked,
    isMapUnlocked,
} from "../core/save";
import { dateLocale, fmtNum, getLang, list, t, tl, tp, tr, useLang } from "../i18n";
import { MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE } from "../render/CameraRig";
import { MapGeneratorButton } from "../scaperune/MapGeneratorScreen";
import { AbilityButton, KitButtons } from "./AbilityButton";
import { ArmouryScreen } from "./ArmouryScreen";
import { BanishButton } from "./BanishButton";
import { CardNeedsWindow, cardNeedsLabel } from "./CardNeeds";
import { CardsScreen } from "./CardsScreen";
import { ChangelogPanel } from "./ChangelogPanel";
import { ChestModal } from "./ChestModal";
import { CloudChoicePanel, CloudSaveButton, CloudSavePanel, CloudSaveSettings } from "./CloudSave";
import { Coins } from "./Coins";
import { CollectionLogScreen } from "./CollectionLogScreen";
import { messageOptions, useConfirm } from "./ConfirmDialog";
import { CoopScreen, PartyFrames, ReviveNote, WaitingNote } from "./CoopScreen";
import { DescriptionButton, ItemDescription, ItemLines } from "./DescriptionButton";
import { DirectorPanel } from "./DirectorPanel";
import { EventModal } from "./EventModal";
import "./GameUi.css";
import { CampScreen, GauntletBadge, GauntletResultModal, GauntletScreen } from "./Gauntlet";
import { InventoryItem } from "./InventoryItem";
import {
    InvocationBadges,
    InvocationBoard,
    InvocationsButton,
    RunInvocationBoard,
    RunInvocationsButton,
} from "./Invocations";
import { ItemIcon } from "./ItemIcon";
import { LanguageNotice } from "./LanguageNotice";
import { LanguageSetting } from "./LanguageSetting";
import { NoticePanel } from "./NoticePanel";
import { KeyHint, KeyboardControls, PadControls, PadIcon, usePadKind } from "./PadHint";
import { Platinum } from "./Platinum";
import { QuestScreen } from "./QuestScreen";
import { RelicRow } from "./Relics";
import { RerollButton } from "./RerollButton";
import { ExportReminder, SaveBlockPanel, UnreadableSavePanel } from "./SavePanels";
import { SkipButton } from "./SkipButton";
import { SoundOrb } from "./SoundOrb";
import { StatLine } from "./StatLine";
import { TitleLanguageMenu } from "./TitleLanguageMenu";
import { RotateNotice, TouchControls, enterFullscreen } from "./TouchControls";
import { AwakenRow, VaultScreen } from "./Vault";
import { WardrobeScreen } from "./WardrobeScreen";
import { GAME_VERSION } from "./changelog";
import { formatCompact, formatShare } from "./formatCompact";
import { releaseFocus, useMenuKeys } from "./menuKeys";
import { Notice, loadNotice, markNoticeSeen, shouldShowNotice } from "./notice";
import { useDialog } from "./useDialog";
import { usePhoneLayout } from "./usePhoneLayout";

type Props = {
    store: GameStore;
    client?: GameClient;
};

// The UI is laid out for a window about 720 pixels tall; bigger windows draw
// it bigger, up to twice the size, so it isn't lost on a large screen
const UI_BASE_HEIGHT = 720;
const UI_BASE_WIDTH = 1150;
const UI_MAX_SCALE = 2;

function getUiScale(): number {
    const fit = Math.min(window.innerHeight / UI_BASE_HEIGHT, window.innerWidth / UI_BASE_WIDTH);
    // In twentieths, so a small resize doesn't relayout everything
    return Math.round(Math.min(UI_MAX_SCALE, Math.max(1, fit)) * 20) / 20;
}

function useUiScale(): number {
    const [scale, setScale] = useState(getUiScale);
    useEffect(() => {
        const onResize = () => setScale(getUiScale());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    return scale;
}

export function GameUi({ store, client }: Props): JSX.Element {
    useLang();
    const ui = useSyncExternalStore(store.subscribe, store.getSnapshot);
    const scale = useUiScale();

    if (ui.screen === "loading" || !client) {
        return (
            <div
                className="ui-fill ui-center ui-loading"
                // The opening cinematic's squares loading: a click or tap skips it, as it would
                // once it plays
                onPointerDown={ui.cinematic && client ? () => client.skipCinematic() : undefined}
            >
                <OsrsLoadingBar text={ui.loadingText} progress={ui.loadingProgress} />
            </div>
        );
    }

    // Every button clicks like the client's interface does (but not ones
    // with sounds of their own)
    const onClickCapture = (event: React.MouseEvent) => {
        if ((event.target as HTMLElement).closest("button:not([data-silent])")) {
            client.playClick();
        }
    };
    let screen: JSX.Element = <></>;
    switch (ui.screen) {
        case "title":
            screen = <TitleScreen ui={ui} client={client} />;
            break;
        case "characters":
            screen = <CharacterScreen ui={ui} client={client} />;
            break;
        case "shop":
            screen = <ShopScreen ui={ui} client={client} />;
            break;
        case "armoury":
            screen = <ArmouryScreen ui={ui} client={client} />;
            break;
        case "wardrobe":
            screen = <WardrobeScreen ui={ui} client={client} />;
            break;
        case "quests":
            screen = <QuestScreen ui={ui} client={client} />;
            break;
        case "collectionLog":
            screen = <CollectionLogScreen ui={ui} client={client} />;
            break;
        case "cards":
            screen = <CardsScreen ui={ui} client={client} />;
            break;
        case "coop":
            screen = <CoopScreen ui={ui} client={client} />;
            break;
        case "gauntlet":
            screen = <GauntletScreen ui={ui} client={client} />;
            break;
        case "vault":
            screen = <VaultScreen ui={ui} client={client} />;
            break;
        case "camp":
            screen = <CampScreen ui={ui} client={client} />;
            break;
        case "run":
            screen = <RunScreen ui={ui} client={client} />;
            break;
    }
    return (
        <div
            className="ui-contents"
            style={{ "--ui-scale": scale } as CSSProperties}
            onClickCapture={onClickCapture}
        >
            {screen}
            {ui.actEnding && (
                <ActEndingModal key={ui.actEnding} actId={ui.actEnding} client={client} />
            )}
            {ui.saveBlock && !ui.saveBlockClosed ? (
                <SaveBlockPanel block={ui.saveBlock} client={client} />
            ) : (
                <LanguageNotice />
            )}
            {/* The Collection log has a layout for a phone held upright, so it's left readable */}
            {isCoarsePointer && ui.screen !== "collectionLog" && <RotateNotice />}
        </div>
    );
}

type ScreenProps = { ui: UiSnapshot; client: GameClient };

// A setting's name and what it does, with its control on the right
function Setting({
    name,
    text,
    children,
}: {
    name: string;
    text?: ReactNode;
    children: ReactNode;
}): JSX.Element {
    return (
        <div className="ui-setting">
            <div className="ui-setting-label">
                <div className="ui-setting-name">{name}</div>
                {text && <div className="ui-setting-text">{text}</div>}
            </div>
            <div className="ui-setting-control">{children}</div>
        </div>
    );
}

export function Toggle({
    on,
    label,
    onToggle,
}: {
    on: boolean;
    label: string;
    onToggle: () => void;
}): JSX.Element {
    return (
        <button
            className={"ui-button ui-button-small ui-toggle" + (on ? " ui-toggle-on" : "")}
            aria-label={label}
            aria-pressed={on}
            onClick={(e) => {
                onToggle();
                // Give Enter and Space back to the screen
                releaseFocus(e);
            }}
        >
            {on ? t("ui.common.on") : t("ui.common.off")}
        </button>
    );
}

// music: the run's map has music, so it gets its own volume
function SoundSettings({
    ui,
    client,
    music = false,
}: ScreenProps & { music?: boolean }): JSX.Element {
    const { muted, volume } = ui.audio;
    return (
        <>
            <Setting
                name={t("settings.sound.name")}
                text={isCoarsePointer ? undefined : t("settings.sound.hint")}
            >
                <Toggle
                    on={!muted}
                    label={t("settings.sound.name")}
                    onToggle={() => client.toggleMute()}
                />
            </Setting>
            <VolumeSetting
                name={t("settings.volume.name")}
                value={volume}
                muted={muted}
                onChange={(value) => client.setVolume(value)}
            />
            {music && (
                <VolumeSetting
                    name={t("settings.music.name")}
                    value={ui.audio.music}
                    muted={muted}
                    onChange={(value) => client.setMusicVolume(value)}
                />
            )}
        </>
    );
}

function VolumeSetting({
    name,
    value,
    muted,
    onChange,
}: {
    name: string;
    value: number;
    muted: boolean;
    onChange: (value: number) => void;
}): JSX.Element {
    return (
        <Setting name={name}>
            <input
                className={"ui-volume" + (muted ? " ui-volume-muted" : "")}
                type="range"
                min={0}
                max={100}
                value={Math.round(value * 100)}
                onChange={(e) => onChange(parseInt(e.target.value) / 100)}
                // Give the keys back to the game once it's set
                onPointerUp={(e) => e.currentTarget.blur()}
                aria-label={name}
            />
            <span className="ui-volume-value">{Math.round(value * 100)}%</span>
        </Setting>
    );
}

function AutoPauseSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting
            name={t("settings.auto_pause.name")}
            text={t(
                isCoarsePointer
                    ? "settings.auto_pause.desc.touch"
                    : "settings.auto_pause.desc.mouse",
            )}
        >
            <Toggle
                on={ui.display.pauseOnBlur}
                label={t("settings.auto_pause.name")}
                onToggle={() => client.toggleAutoPause()}
            />
        </Setting>
    );
}

function PickupTimerSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting name={t("settings.pickup_timers.name")} text={t("settings.pickup_timers.desc")}>
            <Toggle
                on={ui.display.pickupTimers}
                label={t("settings.pickup_timers.name")}
                onToggle={() => client.togglePickupTimers()}
            />
        </Setting>
    );
}

// The Scabaras room's puzzle helper: on at Entry, and at any raid level once the room's been
// beaten (SaveData.scabarasBeaten). The toggle's always there, so it can be turned off at Entry too.
function PuzzleHelperSetting({ ui, client }: ScreenProps): JSX.Element {
    const unlocked = ui.save.scabarasBeaten === true;
    return (
        <Setting
            name="Puzzle helper"
            text={
                unlocked
                    ? "In the Tombs of Amascut's Scabaras room, marks what to step on, as the ToA plugin does"
                    : "In the Tombs of Amascut's Scabaras room, marks what to step on: at Entry for now, at any raid level once you've beaten the room"
            }
        >
            <Toggle
                on={ui.display.puzzleHelper}
                label="Puzzle helper"
                onToggle={() => client.togglePuzzleHelper()}
            />
        </Setting>
    );
}

function AutoAlchSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting name={t("settings.auto_alch.name")} text={t("settings.auto_alch.desc")}>
            <Toggle
                on={ui.display.autoAlch}
                label={t("settings.auto_alch.name")}
                onToggle={() => client.toggleAutoAlch()}
            />
        </Setting>
    );
}

function MovePredictionSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting
            name={t("settings.movement_prediction.name")}
            text={t("settings.movement_prediction.desc")}
        >
            <Toggle
                on={ui.display.movePrediction}
                label={t("settings.movement_prediction.name")}
                onToggle={() => client.toggleMovePrediction()}
            />
        </Setting>
    );
}

function CoopFlagSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting name={t("settings.coop_flag.name")} text={t("settings.coop_flag.desc")}>
            <Toggle
                on={ui.display.coopFlag}
                label={t("settings.coop_flag.name")}
                onToggle={() => client.toggleCoopFlag()}
            />
        </Setting>
    );
}

// Only in a build that has a collector to send to
function RunStatsSetting({ ui, client }: ScreenProps): JSX.Element | null {
    if (!RUN_ANALYTICS_URL) {
        return null;
    }
    return (
        <Setting name={t("settings.run_stats.name")} text={t("settings.run_stats.desc")}>
            <Toggle
                on={ui.display.runStats}
                label={t("settings.run_stats.name")}
                onToggle={() => client.toggleRunStats()}
            />
        </Setting>
    );
}

// Where the HUD shows worn gear (DisplaySettings.gearPanel). On a phone the row isn't drawn,
// so off there means the pause menu only.
function GearPanelSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting
            name={t("settings.gear_panel.name")}
            text={t(
                isCoarsePointer
                    ? "settings.gear_panel.desc.touch"
                    : "settings.gear_panel.desc.mouse",
            )}
        >
            <Toggle
                on={ui.display.gearPanel}
                label={t("settings.gear_panel.name")}
                onToggle={() => client.toggleGearPanel()}
            />
        </Setting>
    );
}

function AutoEquipSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting name={t("settings.auto_equip.name")} text={t("settings.auto_equip.desc")}>
            <Toggle
                on={ui.display.autoEquip}
                label={t("settings.auto_equip.name")}
                onToggle={() => client.toggleAutoEquip()}
            />
        </Setting>
    );
}

function FrameRateSetting({ ui, client }: ScreenProps): JSX.Element {
    return (
        <Setting name={t("settings.frame_rate.name")} text={t("settings.frame_rate.desc")}>
            {FRAME_RATES.map((rate) => (
                <button
                    key={rate}
                    className={
                        "ui-button ui-button-small ui-frame-rate" +
                        (ui.display.frameRate === rate ? " ui-frame-rate-on" : "")
                    }
                    aria-pressed={ui.display.frameRate === rate}
                    onClick={(e) => {
                        client.setFrameRate(rate);
                        // Give Enter and Space back to the screen
                        releaseFocus(e);
                    }}
                >
                    {t(`settings.frame_rate.${rate}`)}
                </button>
            ))}
        </Setting>
    );
}

// The community server's invite
const DISCORD_INVITE = "https://discord.gg/82gBtKz2Xx";
const GITHUB_REPOSITORY = "https://github.com/Dynrothe/Run-Escape";

function GitHubLink(): JSX.Element {
    return (
        <a
            className="ui-title-link ui-github"
            href={GITHUB_REPOSITORY}
            target="_blank"
            rel="noopener noreferrer"
            title={t("ui.title.github")}
            aria-label={t("ui.title.github")}
            onClick={releaseFocus}
        >
            <svg className="ui-title-link-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        </a>
    );
}

function DiscordLink(): JSX.Element {
    return (
        <a
            className="ui-title-link ui-discord"
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            title={t("ui.title.discord")}
            aria-label={t("ui.title.discord")}
            onClick={releaseFocus}
        >
            <svg className="ui-title-link-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
        </a>
    );
}

// Saves live in this browser; a file carries one to another, or keeps a copy
function SaveSetting({ ui, client }: ScreenProps): JSX.Element {
    const fileInput = useRef<HTMLInputElement>(null);
    const [confirm, confirmDialog] = useConfirm();
    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // So picking the same file again still counts
        e.target.value = "";
        if (!file) {
            return;
        }
        // Nothing's being saved, so an import wouldn't be kept
        if (ui.saveBlock) {
            void confirm(
                messageOptions(t("confirm.import.failed"), t("settings.save.alert_save_block")),
            );
            return;
        }
        let save: SaveData;
        try {
            save = importSave(await file.text(), GAME_VERSION);
        } catch (e) {
            void confirm(
                messageOptions(
                    t("confirm.import.failed"),
                    e instanceof NewerSaveError
                        ? t("settings.save.newer_version", { file: file.name })
                        : t("settings.save.invalid_file", { file: file.name }),
                ),
            );
            return;
        }
        const describe = (s: SaveData) =>
            t("settings.save.describe", {
                coins: fmtNum(s.coins),
                runs: s.runs,
                wins: s.victories,
            });
        const replace = await confirm({
            title: t("confirm.import.title"),
            body: t("settings.save.confirm_replace", {
                current: describe(ui.save),
                imported: describe(save),
            }),
            confirm: t("confirm.import.confirm"),
            cancel: t("ui.common.cancel"),
        });
        if (replace) {
            client.replaceSave(save);
        }
    };
    const lastCopy = ui.save.lastExported;
    return (
        <Setting
            name={t("settings.save.name")}
            text={
                <>
                    {t("settings.save.desc")}
                    <span className="ui-setting-note">
                        {lastCopy === undefined
                            ? t("settings.save.no_copy")
                            : t("settings.save.last_copy", {
                                  date: new Date(lastCopy).toLocaleDateString(dateLocale()),
                              })}
                    </span>
                </>
            }
        >
            <button
                className="ui-button ui-button-small"
                onClick={(e) => {
                    client.exportSave();
                    releaseFocus(e);
                }}
            >
                {t("settings.save.export")}
            </button>
            <button
                className="ui-button ui-button-small"
                disabled={ui.saveBlock !== undefined}
                title={ui.saveBlock ? t("settings.save.import_disabled_title") : undefined}
                onClick={(e) => {
                    fileInput.current?.click();
                    releaseFocus(e);
                }}
            >
                {t("settings.save.import")}
            </button>
            <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={onFile}
            />
            {confirmDialog}
        </Setting>
    );
}

// Saves that couldn't be read, kept as they were
function UnreadableSaveSettings({ ui, client }: ScreenProps): JSX.Element {
    const [confirm, confirmDialog] = useConfirm();
    return (
        <>
            {ui.unreadableSaves.map(({ key, time }) => {
                const when = new Date(time).toLocaleString(dateLocale());
                return (
                    <Setting
                        key={key}
                        name={t("settings.unreadable.name")}
                        text={t("settings.unreadable.desc", { when })}
                    >
                        <button
                            className="ui-button ui-button-small"
                            onClick={(e) => {
                                client.exportUnreadableSave(key);
                                releaseFocus(e);
                            }}
                        >
                            {t("settings.save.export")}
                        </button>
                        <button
                            className="ui-button ui-button-small"
                            onClick={async (e) => {
                                releaseFocus(e);
                                if (
                                    await confirm({
                                        title: t("confirm.delete_unreadable.title"),
                                        body: t("settings.unreadable.confirm_delete", { when }),
                                        confirm: t("settings.unreadable.delete"),
                                        cancel: t("ui.common.cancel"),
                                    })
                                ) {
                                    client.deleteUnreadableSave(key);
                                }
                            }}
                        >
                            {t("settings.unreadable.delete")}
                        </button>
                    </Setting>
                );
            })}
            {confirmDialog}
        </>
    );
}

// Behind the title screen's Settings button
function SettingsPanel({
    ui,
    client,
    onClose,
}: ScreenProps & { onClose: () => void }): JSX.Element {
    const padKind = usePadKind();
    return (
        <div className="ui-panel rs-border rs-background ui-settings">
            <h2>{t("settings.title")}</h2>
            <div className="ui-settings-body">
                {/* First: it's what a player can lose */}
                <section className="ui-settings-section">
                    <h3>{t("settings.section.save")}</h3>
                    <SaveSetting ui={ui} client={client} />
                    <CloudSaveSettings cloud={ui.cloud} client={client} saving={!ui.saveBlock} />
                    <UnreadableSaveSettings ui={ui} client={client} />
                </section>
                <section className="ui-settings-section">
                    <h3>{t("settings.section.sound")}</h3>
                    <SoundSettings ui={ui} client={client} />
                </section>
                <section className="ui-settings-section">
                    <h3>{t("settings.section.game")}</h3>
                    <h4 className="ui-settings-group">{t("settings.group.general")}</h4>
                    <LanguageSetting />
                    <h4 className="ui-settings-group">{t("settings.group.camera")}</h4>
                    <Setting
                        name={t("settings.camera_spin.name")}
                        text={t("settings.camera_spin.desc")}
                    >
                        <Toggle
                            on={ui.display.menuSpin}
                            label={t("settings.camera_spin.name")}
                            onToggle={() => client.toggleMenuSpin()}
                        />
                    </Setting>
                    <Setting
                        name={t("settings.screen_shake.name")}
                        text={t("settings.screen_shake.desc")}
                    >
                        <Toggle
                            on={ui.display.screenShake}
                            label={t("settings.screen_shake.name")}
                            onToggle={() => client.toggleScreenShake()}
                        />
                    </Setting>
                    <h4 className="ui-settings-group">{t("settings.group.run")}</h4>
                    <PickupTimerSetting ui={ui} client={client} />
                    <GearPanelSetting ui={ui} client={client} />
                    <PuzzleHelperSetting ui={ui} client={client} />
                    <AutoPauseSetting ui={ui} client={client} />
                    <AutoAlchSetting ui={ui} client={client} />
                    <AutoEquipSetting ui={ui} client={client} />
                    <RunStatsSetting ui={ui} client={client} />
                    <h4 className="ui-settings-group">{t("settings.group.coop")}</h4>
                    <MovePredictionSetting ui={ui} client={client} />
                    <CoopFlagSetting ui={ui} client={client} />
                    <h4 className="ui-settings-group">{t("settings.group.performance")}</h4>
                    <FrameRateSetting ui={ui} client={client} />
                </section>
                {padKind ? (
                    <section className="ui-settings-section">
                        <h3>{t("settings.section.controller")}</h3>
                        <PadControls />
                    </section>
                ) : (
                    !isCoarsePointer && (
                        <section className="ui-settings-section">
                            <h3>{t("settings.section.keyboard")}</h3>
                            <KeyboardControls />
                        </section>
                    )
                )}
            </div>
            <div className="ui-row">
                <button className="ui-button" onClick={onClose}>
                    {t("ui.common.back")}
                </button>
            </div>
        </div>
    );
}

// A smaller way in, under the play buttons: an item, or a sprite on its own
function TitleTile({
    name,
    objId = -1,
    spriteId,
    onClick,
}: {
    name: string;
    objId?: number;
    spriteId?: number;
    onClick: () => void;
}): JSX.Element {
    return (
        <button className="ui-card ui-title-tile" onClick={onClick}>
            <ItemIcon objId={objId} spriteId={spriteId} />
            {name}
        </button>
    );
}

function TitleStat({ name, value }: { name: string; value: string | number }): JSX.Element {
    return (
        <span className="ui-title-stat">
            {name} <span className="ui-title-stat-value">{value}</span>
        </span>
    );
}

function TitleScreen({ ui, client }: ScreenProps): JSX.Element {
    const save = ui.save;
    // The panel saying the game isn't saving is over everything, so the title's
    // own wait till it's gone
    const savePanel = ui.saveBlock !== undefined && !ui.saveBlockClosed;
    // The cloud has a different save, and asks which to keep
    const cloudChoice = ui.cloud?.choice !== undefined && !ui.cloud.choice.closed;
    const [changelogOpen, setChangelogOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    // Cloud save's own panel, from its button
    const [cloudOpen, setCloudOpen] = useState(false);
    // The notice, until it's closed (once for each new one)
    const [notice, setNotice] = useState<Notice>();
    useEffect(() => {
        let mounted = true;
        loadNotice().then((loaded) => {
            if (mounted && loaded && shouldShowNotice(loaded)) {
                setNotice(loaded);
            }
        });
        return () => {
            mounted = false;
        };
    }, []);
    const closeNotice = useCallback(() => {
        if (notice) {
            markNoticeSeen(notice);
        }
        setNotice(undefined);
    }, [notice]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (savePanel) {
                return;
            } else if (cloudChoice) {
                if (e.code === "Escape") {
                    client.cloud?.later();
                }
            } else if (ui.unreadableSave) {
                if (e.code === "Escape") {
                    client.closeUnreadableNotice();
                }
            } else if (notice) {
                if (e.code === "Enter" || e.code === "Space" || e.code === "Escape") {
                    closeNotice();
                }
            } else if (changelogOpen || settingsOpen || cloudOpen) {
                if (e.code === "Escape") {
                    setChangelogOpen(false);
                    setSettingsOpen(false);
                    setCloudOpen(false);
                }
            } else if (
                e.code === "Space" ||
                // Enter on something focused from the keyboard is for that instead
                (e.code === "Enter" && !(e.target as HTMLElement).closest("button, a"))
            ) {
                client.showScreen("characters");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [
        client,
        changelogOpen,
        settingsOpen,
        cloudOpen,
        notice,
        closeNotice,
        ui.unreadableSave,
        savePanel,
        cloudChoice,
    ]);
    // Over the title's own panels too: Sync now or a code linked from Settings or cloud save's
    // panel can be what asks
    const choicePanel =
        !savePanel && cloudChoice && ui.cloud ? (
            <CloudChoicePanel cloud={ui.cloud} save={save} client={client} />
        ) : undefined;
    if (changelogOpen) {
        return (
            <div className="ui-fill ui-center">
                <ChangelogPanel onClose={() => setChangelogOpen(false)} />
                {choicePanel}
            </div>
        );
    }
    if (settingsOpen) {
        return (
            <div className="ui-fill ui-center">
                <SettingsPanel ui={ui} client={client} onClose={() => setSettingsOpen(false)} />
                {choicePanel}
            </div>
        );
    }
    if (cloudOpen) {
        return (
            <div className="ui-fill ui-center">
                <CloudSavePanel
                    cloud={ui.cloud}
                    client={client}
                    saving={!ui.saveBlock}
                    onClose={() => setCloudOpen(false)}
                />
                {choicePanel}
            </div>
        );
    }
    return (
        <div className="ui-fill ui-title">
            <div className="ui-title-logo">
                <h1>Run Escape</h1>
                <p>{t("ui.title.tagline")}</p>
            </div>
            <div className="ui-title-bottom">
                <div className="ui-panel rs-border rs-background ui-title-menu">
                    <div className="ui-title-play">
                        <button
                            className="ui-button ui-button-big"
                            onClick={() => {
                                enterFullscreen();
                                client.showScreen("characters");
                            }}
                        >
                            {t("ui.title.singleplayer")}
                        </button>
                        {ui.coop.available && (
                            <button
                                className="ui-button ui-button-big"
                                onClick={() => client.openCoop()}
                            >
                                {t("ui.title.multiplayer")}
                            </button>
                        )}
                    </div>
                    <div className="ui-title-tiles">
                        <TitleTile
                            name={t("ui.title.skills")}
                            spriteId={TITLE_TAB_SPRITES.skills}
                            onClick={() => client.showScreen("shop")}
                        />
                        <TitleTile
                            name={t("ui.title.armoury")}
                            spriteId={TITLE_TAB_SPRITES.armoury}
                            onClick={() => client.showScreen("armoury")}
                        />
                        <TitleTile
                            name={t("ui.title.wardrobe")}
                            objId={WARDROBE_ICON_OBJ}
                            onClick={() => client.showScreen("wardrobe")}
                        />
                        <TitleTile
                            name={t("ui.title.quests")}
                            spriteId={TITLE_TAB_SPRITES.quests}
                            onClick={() => client.showScreen("quests")}
                        />
                        <TitleTile
                            name={t("ui.title.collection_log")}
                            objId={COLLECTION_LOG_OBJ}
                            onClick={() => client.showScreen("collectionLog")}
                        />
                        <TitleTile
                            name={t("ui.title.cards")}
                            objId={CARDS_ICON_OBJ}
                            onClick={() => client.showScreen("cards")}
                        />
                    </div>
                    <div className="ui-title-stats">
                        <Coins amount={save.coins} />
                        <TitleStat name={t("ui.title.stat.runs")} value={save.runs} />
                        <TitleStat name={t("ui.title.stat.wins")} value={save.victories} />
                        <TitleStat
                            name={t("ui.title.stat.best")}
                            value={formatTime(save.bestSeconds)}
                        />
                        <TitleStat name={t("ui.title.stat.best_level")} value={save.bestLevel} />
                    </div>
                </div>
                {/* Under the menu, so a controller's highlight still starts on
                    Singleplayer; not while nothing's saving, as that panel comes first */}
                {/* Nor while cloud save has a copy: only while it's on, synced, and nothing's
                    wrong, as a code that's stopped working keeps none */}
                {!ui.saveBlock && !cloudKeepsCopy(ui.cloud) && (
                    <ExportReminder save={save} client={client} />
                )}
                <TitleHint />
            </div>
            <div className="ui-title-utils">
                {ui.saveBlock && ui.saveBlockClosed && (
                    <button
                        className="ui-version ui-save-off"
                        onClick={() => client.showSaveBlock()}
                    >
                        {t("ui.title.not_saving")}
                    </button>
                )}
                <button className="ui-version" onClick={() => setChangelogOpen(true)}>
                    {t("ui.title.whats_new", { version: GAME_VERSION })}
                </button>
                <TitleLanguageMenu />
                <CloudSaveButton
                    cloud={ui.cloud}
                    client={client}
                    onOpen={() => setCloudOpen(true)}
                />
                <button
                    className="ui-title-link ui-title-settings"
                    title={t("ui.title.settings")}
                    aria-label={t("ui.title.settings")}
                    onClick={() => setSettingsOpen(true)}
                >
                    <ItemIcon objId={-1} spriteId={TITLE_TAB_SPRITES.settings} />
                </button>
                <DiscordLink />
                <GitHubLink />
            </div>
            {/* Top right, as by the minimap in a run. After the menu, so Tab reaches
                Singleplayer first. */}
            <SoundOrb client={client} muted={ui.audio.muted} className="ui-title-sound" />
            {/* A corner of its own, as it pushed the row above over the how-to-play line */}
            {import.meta.env.DEV && (
                <div className="ui-title-dev">
                    <MapGeneratorButton client={client} />
                </div>
            )}
            {savePanel ? null : choicePanel ? (
                choicePanel
            ) : ui.unreadableSave ? (
                <UnreadableSavePanel keptAs={ui.unreadableSave} client={client} />
            ) : (
                notice && <NoticePanel notice={notice} onClose={closeNotice} />
            )}
        </div>
    );
}

function getStyleName(style: CombatStyle): string {
    return t(`ui.combat.${style}`);
}

const STYLE_NAMES = new Proxy({} as Record<CombatStyle, string>, {
    get: (_, prop: string) =>
        prop === "melee" || prop === "ranged" || prop === "magic" ? getStyleName(prop) : undefined,
});

const STYLES: CombatStyle[] = ["melee", "ranged", "magic"];

// The Very rare weapon only this class can find
function getClassTreasure(style: CombatStyle) {
    return WEAPONS.find((w) => w.style === style && w.rarity === "veryRare");
}

export function getStartingWeaponIcon(character: CharacterDef): number {
    const weapon = getWeapon(character.startingWeapon);
    return weapon.levels[0].objId ?? weapon.iconObjId;
}

// How to play, under the title's buttons: the controller's buttons once one's
// in use (a browser shows no pad until a button's pressed)
function TitleHint(): JSX.Element {
    const pad = usePadKind();
    if (pad) {
        return (
            <div className="ui-hint ui-hint-pad">
                <PadIcon kind={pad} icon="move" label={t("ui.hint.left_stick")} />{" "}
                {t("ui.hint.to_move")} · {t("ui.hint.weapons_fire")} ·{" "}
                <PadIcon kind={pad} icon="start" label={padLabel(pad, "start")} />{" "}
                {t("ui.hint.to_pause")} ·{" "}
                <PadIcon kind={pad} icon="south" label={padLabel(pad, "south")} />{" "}
                {t("ui.hint.to_pick")}
            </div>
        );
    }
    return (
        <div className="ui-hint">
            {isCoarsePointer ? t("ui.hint.touch") : t("ui.hint.keyboard")}
        </div>
    );
}

// Adventurers on the left and maps on the right, so the adventurer picked
// stands in view between them. A phone's too short for both lists at once, so
// it has a screen of what's picked, and each list over the whole screen
// (PhoneSetup).
function CharacterScreen({ ui, client }: ScreenProps): JSX.Element {
    const map = getMap(ui.mapId);
    const [board, setBoard] = useState(false);
    // Card collection only, what's needed for this adventurer (CardNeedsWindow), when it's open
    const [needsFor, setNeedsFor] = useState<string>();
    const phone = usePhoneLayout();
    const [picker, setPicker] = useState<PhonePicker>();
    // A picker's left open as the phone turns upright, and comes back as it turns again
    const picking = phone ? picker : undefined;
    // A run's invocations, on a map from the Desert on (content/invocations.ts, RUN_SET), or remixed
    const runBoard = takesInvocations(map, ui.remixes.length > 0);
    const shownMapName = remixedMapName(map, ui.remixes);
    // A raid's expert mode, solo only for now (GameClient.toggleExpert)
    const expertShown = map.raid !== undefined && ui.coop.status === "offline";
    const endlessShown = ui.endless && !map.fun && !map.tombs;
    const mode = !map.tombs && ui.hard ? (ui.expert && expertShown ? "expert" : "hard") : undefined;
    const enterKey = mode
        ? endlessShown
            ? `ui.select.enter.${mode}_endless`
            : `ui.select.enter.${mode}`
        : endlessShown
          ? "ui.select.enter.endless"
          : "ui.select.enter";
    // With the invocation board open, its own keys; with a phone's picker open, back to what's
    // picked
    const closePicker = () => setPicker(undefined);
    useMenuKeys(
        board
            ? {}
            : needsFor
              ? { onBack: () => setNeedsFor(undefined) }
              : picking
              ? { onBack: closePicker, onConfirm: closePicker }
              : {
                    onBack: () => client.showScreen("title"),
                    onConfirm: () => void client.startRun(),
                },
    );
    const modes = map.tombs ? (
        // The Tombs go by their invocations instead of endless and hard mode
        <InvocationsButton ui={ui} onOpen={() => setBoard(true)} />
    ) : (
        <>
            {/* A raid ends with its last room: no endless */}
            {!map.raid && <EndlessSwitch ui={ui} client={client} />}
            <HardSwitch ui={ui} client={client} />
            {expertShown && <ExpertSwitch ui={ui} client={client} />}
            {runBoard && <RunInvocationsButton ui={ui} onOpen={() => setBoard(true)} />}
        </>
    );
    const back = (
        <button className="ui-button" onClick={() => client.showScreen("title")}>
            {t("ui.common.back")}
        </button>
    );
    const enter = (
        <button
            className="ui-button ui-button-go ui-select-go"
            // From the Cards only tab, not without the cards it takes (isCardRunBlocked)
            disabled={isCardRunBlocked(ui.save, getMapCharacter(map) ?? ui.characterId, map)}
            onClick={() => client.startRun()}
        >
            <KeyHint keyLabel="Enter" pad="start" className="ui-choice-key ui-word-key" />{" "}
            {t(enterKey, { map: shownMapName })}
        </button>
    );
    const boards = (
        <>
            {board && map.tombs && (
                <InvocationBoard ui={ui} client={client} onClose={() => setBoard(false)} />
            )}
            {board && runBoard && (
                <RunInvocationBoard ui={ui} client={client} onClose={() => setBoard(false)} />
            )}
            {/* Over the whole screen, not in the bar (sticky on a narrow one) */}
            {needsFor && (
                <CardNeedsWindow
                    save={ui.save}
                    characterId={needsFor}
                    client={client}
                    onClose={() => setNeedsFor(undefined)}
                />
            )}
        </>
    );
    if (phone) {
        return (
            <PhoneSetup
                ui={ui}
                client={client}
                picker={picking}
                onPicker={setPicker}
                onCardNeeds={setNeedsFor}
                modes={modes}
                back={back}
                enter={enter}
            >
                {boards}
            </PhoneSetup>
        );
    }
    return (
        <div className="ui-fill ui-select">
            <AdventurerPanel
                ui={ui}
                client={client}
                fixed={getMapCharacter(map)}
                onCardNeeds={setNeedsFor}
            />
            <MapPanel ui={ui} client={client} />
            <div className="ui-panel rs-border rs-background ui-select-bar">
                {back}
                <Coins amount={ui.save.coins} />
                {modes}
                {enter}
            </div>
            {boards}
        </div>
    );
}

type PhonePicker = "adventurer" | "map";

// A phone's run setup: the map picked on the left with what it's played as on the right (the
// switches the desktop has by its start button), and the adventurer under the middle, where they
// stand in view. Each card opens its list over the whole screen, with the details beside it
// rather than under it, as a phone held sideways has the width and not the height.
function PhoneSetup({
    ui,
    client,
    picker,
    onPicker,
    onCardNeeds,
    modes,
    back,
    enter,
    children,
}: ScreenProps & {
    picker: PhonePicker | undefined;
    onPicker: (picker: PhonePicker | undefined) => void;
    // Card collection only's needs, from the adventurer list's tab or a lock
    onCardNeeds: (characterId: string) => void;
    modes: ReactNode;
    back: ReactNode;
    enter: ReactNode;
    // What opens over the screen (the invocation boards)
    children: ReactNode;
}): JSX.Element {
    const map = getMap(ui.mapId);
    if (picker) {
        const done = () => onPicker(undefined);
        return (
            <div className="ui-fill ui-phone-picker">
                {picker === "adventurer" ? (
                    <AdventurerPanel
                        ui={ui}
                        client={client}
                        fixed={getMapCharacter(map)}
                        onCardNeeds={onCardNeeds}
                        onDone={done}
                    />
                ) : (
                    <MapPanel ui={ui} client={client} onDone={done} />
                )}
                {children}
            </div>
        );
    }
    return (
        <div className="ui-fill ui-select ui-phone-ready">
            <PhoneMapCard ui={ui} onOpen={() => onPicker("map")} />
            <PhoneAdventurerCard ui={ui} map={map} onOpen={() => onPicker("adventurer")} />
            <div className="ui-panel rs-border rs-background ui-phone-modes">{modes}</div>
            <div className="ui-panel rs-border rs-background ui-select-bar">
                {back}
                <Coins amount={ui.save.coins} />
                {enter}
            </div>
            {children}
        </div>
    );
}

// The map picked, on a phone's run setup: what it is and how it's gone, opening the maps
function PhoneMapCard({ ui, onOpen }: { ui: UiSnapshot; onOpen: () => void }): JSX.Element {
    const map = getMap(ui.mapId);
    const name = remixedMapName(map, ui.remixes);
    const status = getMapStatus(ui.save, map, ui.fightStage);
    return (
        <button
            className="ui-card ui-phone-card ui-phone-map"
            aria-label={t("ui.select.change_map", { map: name })}
            onClick={onOpen}
        >
            <span className="ui-phone-card-label">
                {t("ui.map.heading")}
                <span className="ui-phone-change">{t("ui.select.change")}</span>
            </span>
            <span className="ui-select-details-head">
                <ItemIcon objId={map.iconObjId} size={36} />
                <span className="ui-phone-card-name">
                    <span className="ui-card-title">{name}</span>
                    <span className={status.locked ? "ui-card-cost" : "ui-card-style"}>
                        {status.text}
                    </span>
                </span>
                {ui.awaken && (
                    <span className="ui-awakened-mark" title={t("ui.awaken.marked")}>
                        <ItemIcon objId={AWAKENERS_ORB_OBJ} size={18} />
                    </span>
                )}
            </span>
            <span className="ui-card-text ui-phone-card-text">
                <RichText text={mapDescription(map)} />
            </span>
        </button>
    );
}

// The adventurer picked (or the map's own), with their pet and relics, on a phone's run setup or
// co-op room (its map is the room's): opening the adventurers, where those are picked too
export function PhoneAdventurerCard({
    ui,
    map,
    onOpen,
}: {
    ui: UiSnapshot;
    map: MapDef;
    onOpen: () => void;
}): JSX.Element {
    const character = getCharacter(getMapCharacter(map) ?? ui.characterId);
    const name = characterName(character);
    const pet = ui.save.pet ? PET_BY_ID.get(ui.save.pet) : undefined;
    // Only those the run takes (GameClient.runRelics)
    const relics = takesRelics(map)
        ? cleanRelics(ui.save.relics, getOpenRelicTiers(ui.save.mapVictories)).flatMap(
              (id) => RELIC_BY_ID.get(id) ?? [],
          )
        : [];
    return (
        <button
            className="ui-card ui-phone-card ui-phone-adventurer"
            aria-label={t("ui.select.change_adventurer", { name })}
            onClick={onOpen}
        >
            <ItemIcon objId={getStartingWeaponIcon(character)} size={36} />
            <span className="ui-phone-card-name">
                <span className="ui-card-title">{name}</span>
                <span className="ui-card-style">{STYLE_NAMES[character.style]}</span>
            </span>
            {(pet || relics.length > 0) && (
                <span className="ui-phone-extras">
                    {pet && <ItemIcon objId={getPetTrophy(pet).objId} size={26} />}
                    {relics.map((relic) => (
                        <ItemIcon key={relic.id} objId={relic.iconObjId} size={24} />
                    ))}
                </span>
            )}
            <span className="ui-phone-change">{t("ui.select.change")}</span>
        </button>
    );
}

// Endless runs for the map picked, once it's been beaten (fun maps are
// always endless, and a boss fight never is)
function EndlessSwitch({ ui, client }: ScreenProps): JSX.Element {
    const shownMapName = mapName(getMap(ui.mapId));
    if (getMap(ui.mapId).fight) {
        return (
            <div className="ui-endless" title={t("ui.endless.tooltip.fight")}>
                <span className="ui-endless-name">{t("ui.endless.name")}</span>
                <span className="ui-endless-hint">{t("ui.endless.one_fight")}</span>
            </div>
        );
    }
    if (isPeaceful(getMap(ui.mapId))) {
        return (
            <div
                className="ui-endless"
                title="Nothing comes here: walk round it for as long as you like."
            >
                <span className="ui-endless-name">Explore</span>
                <span className="ui-endless-hint">No enemies</span>
            </div>
        );
    }
    if (getMap(ui.mapId).fun?.explore) {
        return (
            <div
                className="ui-endless"
                title="No clock here: fight on for as long as you like. The run is won when its last boss falls."
            >
                <span className="ui-endless-name">Explore</span>
                <span className="ui-endless-hint">No clock</span>
            </div>
        );
    }
    if (getMap(ui.mapId).fun) {
        return (
            <div className="ui-endless" title={t("ui.endless.tooltip.fun")}>
                <span className="ui-endless-name">{t("ui.endless.name")}</span>
                <span className="ui-endless-hint">{t("ui.endless.always")}</span>
            </div>
        );
    }
    const open = isEndlessUnlocked(ui.save, ui.mapId);
    return (
        <div
            className={"ui-endless" + (open ? "" : " ui-endless-locked")}
            title={
                open
                    ? t("ui.endless.tooltip.open")
                    : t("ui.endless.tooltip.locked", { map: shownMapName })
            }
        >
            <span className="ui-endless-name">{t("ui.endless.name")}</span>
            {open ? (
                <Toggle
                    on={ui.endless}
                    label={t("ui.endless.name")}
                    onToggle={() => client.toggleEndless()}
                />
            ) : (
                <span className="ui-endless-hint">{t("ui.endless.beat_map")}</span>
            )}
        </div>
    );
}

// Hard mode for the map picked, once it's been beaten (open from the start on
// fun maps)
function HardSwitch({ ui, client }: ScreenProps): JSX.Element {
    const open = isHardUnlocked(ui.save, ui.mapId);
    const shownMapName = mapName(getMap(ui.mapId));
    return (
        <div
            className={"ui-endless" + (open ? "" : " ui-endless-locked")}
            title={
                open
                    ? t("ui.hard.tooltip.open")
                    : t("ui.hard.tooltip.locked", { map: shownMapName })
            }
        >
            <span className="ui-endless-name">{t("ui.hard.name")}</span>
            {open ? (
                <Toggle
                    on={ui.hard}
                    label={t("ui.hard.name")}
                    onToggle={() => client.toggleHard()}
                />
            ) : (
                <span className="ui-endless-hint">{t("ui.endless.beat_map")}</span>
            )}
        </div>
    );
}

// How long a map's objective is up each time it's shown (MapDef.objectives), fading in and out
const MAP_OBJECTIVE_MS = 6000;

// What the map wants of you (MapDef.objectives), for a few seconds and then gone
function MapObjective({
    objective,
}: {
    objective: NonNullable<HudNumbers["objective"]>;
}): JSX.Element | null {
    const [shown, setShown] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setShown(false), MAP_OBJECTIVE_MS);
        return () => clearTimeout(timer);
    }, []);
    return shown ? (
        <div
            className="ui-raid-objective ui-map-objective"
            style={{ animationDuration: `${MAP_OBJECTIVE_MS}ms` }}
        >
            {objective.text}
            {objective.count > 1 && ` (${objective.done}/${objective.count})`}
        </div>
    ) : null;
}

// What a raid's hall wants of you: hold out until its boss comes (or take the portal). The first
// time through, a line on how the raid goes, as it's not like a campaign map.
function RaidObjective({
    room,
    bossIn,
}: {
    room: NonNullable<HudNumbers["raidRoom"]>;
    bossIn: number;
}): JSX.Element {
    const bossName = tl(room.name);
    const boss = getLang() === "en" ? bossName.replace(/^The /, "the ") : bossName;
    return (
        <div
            className={
                bossIn <= 60 ? "ui-raid-objective ui-raid-objective-soon" : "ui-raid-objective"
            }
        >
            <div>{t("ui.raid.survive_waves", { boss, time: formatTime(Math.ceil(bossIn)) })}</div>
            {room.portal && (
                <div className="ui-raid-objective-hint">{t("ui.raid.portal_hint", { boss })}</div>
            )}
            {room.first && room.number === 1 && (
                <div className="ui-raid-objective-hint">
                    {t("ui.raid.first_room_hint", { count: room.count })}
                </div>
            )}
        </div>
    );
}

// The chest at the end of a raid: what it was rolled with, and what came out
function RaidChestView({ chest }: { chest: RaidChest }): JSX.Element {
    const found = chest.found.map((id) => TROPHY_BY_ID.get(id)!).filter(Boolean);
    // The Tombs' pet, Thread and jewels aren't purples
    const purple = found.some((t) => t.from.kind !== "tombs" || t.from.weight !== undefined);
    return (
        <div className="ui-raid-chest">
            <div className="ui-raid-chest-title">
                {purple ? t("ui.raid.chest.purple") : t("ui.raid.chest.regular")}
            </div>
            <div className="ui-subtle">
                {/* No purple left to find: no chance to show (a roll of its own can still give
                    something, the Tombs' jewels or expert's looks) */}
                {t(
                    chest.level !== undefined
                        ? chest.purpleLeft
                            ? "ui.raid.chest.points_level"
                            : "ui.raid.chest.points_level_none"
                        : chest.purpleLeft
                          ? "ui.raid.chest.points"
                          : "ui.raid.chest.points_none",
                    {
                        points: fmtNum(chest.points),
                        level: chest.level ?? 0,
                        chance: Math.round(chest.chance * 100),
                    },
                )}
            </div>
            {found.length > 0 ? (
                <div className="ui-raid-chest-items">
                    {found.map((trophy) => (
                        <span key={trophy.id} className="ui-raid-chest-item">
                            <ItemIcon objId={trophy.objId} size={36} />
                            {trophyName(trophy)}
                        </span>
                    ))}
                </div>
            ) : (
                <div className="ui-subtle">{t("ui.raid.chest.no_unique")}</div>
            )}
        </div>
    );
}

// The Tombs of Amascut's board at the end, as OSRS's raid summary has it: the raid level and the
// invocations that made it, each path's time and the Wardens', and the party's points and deaths
function TombsBoardView({ tombs }: { tombs: TombsSummary }): JSX.Element {
    const band = getRaidBand(tombs.level);
    const total =
        tombs.paths.reduce((sum, path) => sum + path.seconds, 0) + (tombs.wardensSeconds ?? 0);
    const party = tombs.party.reduce((sum, player) => sum + player.points, 0);
    return (
        <div className="ui-tombs-board">
            <div className="ui-tombs-board-level">
                <ItemIcon objId={-1} spriteId={RAID_BAND_SPRITES[band]} size={32} />
                <span>
                    Raid level <b>{tombs.level}</b> ({band})
                </span>
            </div>
            {tombs.invocations.length > 0 && (
                <div className="ui-tombs-board-invocations" aria-label="Invocations">
                    {tombs.invocations.map((id) => {
                        const invocation = INVOCATION_BY_ID.get(id);
                        return invocation ? (
                            <span key={id} title={invocation.name}>
                                <ItemIcon objId={-1} spriteId={invocation.icon} size={24} />
                            </span>
                        ) : null;
                    })}
                </div>
            )}
            <div className="ui-tombs-board-columns">
                <table className="ui-tombs-board-table">
                    <thead>
                        <tr>
                            <th>Room</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tombs.paths.map((path) => (
                            <tr key={path.id}>
                                <td>{path.name}</td>
                                <td>{formatTime(path.seconds)}</td>
                            </tr>
                        ))}
                        {tombs.wardensSeconds !== undefined && (
                            <tr>
                                <td>The Wardens</td>
                                <td>{formatTime(tombs.wardensSeconds)}</td>
                            </tr>
                        )}
                        <tr className="ui-tombs-board-total">
                            <td>Total</td>
                            <td>{formatTime(total)}</td>
                        </tr>
                    </tbody>
                </table>
                <table className="ui-tombs-board-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Points</th>
                            <th>Deaths</th>
                            <th>Purple</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tombs.party.map((player, i) => (
                            <tr key={i} className={player.you ? "ui-tombs-board-you" : undefined}>
                                <td>{player.name || "You"}</td>
                                <td>{player.points.toLocaleString("en-GB")}</td>
                                <td>{player.deaths}</td>
                                {/* None with no purple left to find, as their chest's line */}
                                <td>
                                    {player.chance === undefined
                                        ? "–"
                                        : `${Math.round(player.chance * 100)}%`}
                                </td>
                            </tr>
                        ))}
                        {tombs.party.length > 1 && (
                            <tr className="ui-tombs-board-total">
                                <td>Party</td>
                                <td>{party.toLocaleString("en-GB")}</td>
                                <td>{tombs.party.reduce((sum, p) => sum + p.deaths, 0)}</td>
                                <td />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {tombs.timeLimit && (
                <div className="ui-subtle">
                    {tombs.timeLimit.met
                        ? `Inside the ${tombs.timeLimit.minutes} minute time limit.`
                        : `Past the ${tombs.timeLimit.minutes} minute time limit: the chest goes by raid level ${Math.max(0, tombs.level - tombs.timeLimit.drop)}.`}
                </div>
            )}
            {tombs.wipes > 0 && (
                <div className="ui-subtle">
                    The party died {tombs.wipes} {tombs.wipes === 1 ? "time" : "times"}.
                </div>
            )}
        </div>
    );
}

// A raid's expert mode, once it's been beaten on hard: hard mode, and the Nylocas only hurt by
// their own style
function ExpertSwitch({ ui, client }: ScreenProps): JSX.Element {
    const open = isExpertUnlocked(ui.save, ui.mapId);
    const shownMapName = mapName(getMap(ui.mapId));
    return (
        <div
            className={"ui-endless" + (open ? "" : " ui-endless-locked")}
            title={
                open
                    ? t("ui.expert.tooltip.open")
                    : t("ui.expert.tooltip.locked", { map: shownMapName })
            }
        >
            <span className="ui-endless-name">{t("ui.expert.name")}</span>
            {open ? (
                <Toggle
                    on={ui.expert}
                    label={t("ui.expert.name")}
                    onToggle={() => client.toggleExpert()}
                />
            ) : (
                <span className="ui-endless-hint">{t("ui.expert.beat_hard")}</span>
            )}
        </div>
    );
}

// A pointer leaving a panel goes back to what's picked. Not a finger: browsers
// follow a tap with a mouse leaving, which would take away what was tapped.
function stopPeeking(setPeek: (id: undefined) => void): (() => void) | undefined {
    return isCoarsePointer ? undefined : () => setPeek(undefined);
}

// Adventurers by how they fight, each a tile of their outfit with the weapon
// they start with in its corner. The details pinned below are for the one
// pointed at (or tapped, so a locked one can say what it takes) until the
// pointer leaves the panel, then the one picked. Only moving the pointer
// changes it: the list scrolling under a still pointer doesn't.
// fixed: the adventurer the map picked makes everyone play (Falador's Durial321,
// Phosani's Inquisitor), with the choice blurred out under them
// onDone: a phone's picker (PhoneSetup), with a button back to what's picked
export function AdventurerPanel({
    ui,
    client,
    fixed,
    onCardNeeds,
    cardsOnly,
    tabLocked,
    onDone,
}: ScreenProps & {
    fixed?: string;
    // Card collection only's needs for an adventurer, opened from their lock or the tab's button
    onCardNeeds?: (characterId: string) => void;
    // A co-op room's Cards only, the host's choice for everyone (roomPlaysCardsOnly), in place of
    // the save's own tab; a guest's tabs show it but can't change it (tabLocked)
    cardsOnly?: boolean;
    tabLocked?: boolean;
    onDone?: () => void;
}): JSX.Element {
    const unlocked = ui.save.unlockedCharacters;
    const [peek, setPeek] = useState<string>();
    const roster = getRoster();
    const opened = roster.filter((c) => unlocked.includes(c.id)).length;
    const shown = fixed ?? peek ?? ui.characterId;
    // The save as the Cards only that applies here sees it: the room's in co-op
    const save = useMemo(
        () =>
            cardsOnly === undefined || cardsOnly === (ui.save.cardsOnly === true)
                ? ui.save
                : { ...ui.save, cardsOnly: cardsOnly || undefined },
        [ui.save, cardsOnly],
    );
    // Cards only on: the adventurers it can't start as (isCardLocked), worked out once for the
    // save, not on every peek. Only those they have: one they haven't is locked anyway.
    const cardLocked = useMemo(() => {
        const map = getMap(ui.mapId);
        return new Set(
            roster
                .filter((c) => unlocked.includes(c.id) && isCardLocked(save, c.id, map))
                .map((c) => c.id),
        );
    }, [save, ui.mapId, roster, unlocked]);
    const heading = (
        <h2 className="ui-select-heading">
            {t("ui.character.heading")}
            <span className="ui-select-count">
                {opened} / {roster.length}
            </span>
        </h2>
    );
    return (
        <div
            className={
                "ui-panel rs-border rs-background ui-select-panel ui-select-adventurers" +
                (fixed ? " ui-select-fixed" : "")
            }
            onMouseLeave={stopPeeking(setPeek)}
            // Only focus leaving the panel: moving to the favourite button mustn't swap the
            // details, and the button, out from under the click
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setPeek(undefined);
                }
            }}
        >
            <PickerHeading heading={heading} onDone={onDone} />
            <CardsOnlyTabs
                ui={ui}
                client={client}
                save={save}
                locked={tabLocked}
                onCardNeeds={onCardNeeds}
            />
            {fixed && (
                <div className="ui-select-fixed-note">
                    <ItemIcon objId={getStartingWeaponIcon(getCharacter(fixed))} size={28} />
                    {t("ui.character.fixed_note", {
                        name: characterName(getCharacter(fixed)),
                    })}
                </div>
            )}
            <div className="ui-select-scroll" aria-hidden={fixed !== undefined}>
                {STYLES.map((style) => {
                    const treasure = getClassTreasure(style);
                    return (
                        <div key={style} className="ui-style-group">
                            <div className="ui-style-name">
                                {STYLE_NAMES[style]}
                                {treasure && (
                                    <span className="ui-style-treasure">
                                        {t("ui.character.might_find")}
                                        <span style={{ color: RARITIES.veryRare.color }}>
                                            {weaponName(treasure)}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className="ui-tiles">
                                {roster
                                    .filter((c) => c.style === style)
                                    .map((character) => {
                                        const selected = character.id === ui.characterId;
                                        const charName = tr(
                                            `char.${character.id}.name`,
                                            character.name,
                                        );
                                        // Cards only on, solo, without their starter cards: dimmed
                                        // and marked, still picked to read why (AdventurerDetails)
                                        const cardsLocked = cardLocked.has(character.id);
                                        return (
                                            <button
                                                key={character.id}
                                                className={
                                                    "ui-card ui-tile" +
                                                    (selected ? " ui-card-selected" : "") +
                                                    (unlocked.includes(character.id)
                                                        ? ""
                                                        : " ui-card-locked") +
                                                    (cardsLocked ? " ui-tile-cards-locked" : "")
                                                }
                                                aria-label={
                                                    cardsLocked
                                                        ? t("ui.cards_only.tile_locked", {
                                                              name: charName,
                                                          })
                                                        : charName
                                                }
                                                aria-pressed={selected}
                                                onMouseMove={() => setPeek(character.id)}
                                                onFocus={() => setPeek(character.id)}
                                                onClick={() => {
                                                    setPeek(character.id);
                                                    client.selectCharacter(character.id);
                                                }}
                                            >
                                                <ItemIcon
                                                    objId={
                                                        character.equipment[EquipSlot.TORSO] ??
                                                        getStartingWeaponIcon(character)
                                                    }
                                                    size={34}
                                                />
                                                <span className="ui-tile-badge">
                                                    <ItemIcon
                                                        objId={getStartingWeaponIcon(character)}
                                                        size={18}
                                                    />
                                                </span>
                                                {cardsLocked && (
                                                    <span
                                                        className="ui-tile-lock"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <PetRow ui={ui} client={client} />
            {ACT_MAPS.some((m) => isMapUnlocked(ui.save, m.id)) && (
                <RelicRow ui={ui} client={client} />
            )}
            <AdventurerDetails
                key={shown}
                save={ui.save}
                character={getCharacter(shown)}
                onFavourite={fixed ? undefined : () => client.toggleFavouriteCharacter(shown)}
                onCardNeeds={onCardNeeds && (() => onCardNeeds(shown))}
                cardLock={cardLocked.has(shown) ? getCardLock(ui.save, shown) : undefined}
            />
        </div>
    );
}

// A panel's heading, with a phone picker's Done beside it: a go button, so a controller's Start
// presses it as it does Enter on the run setup
export function PickerHeading({
    heading,
    onDone,
}: {
    heading: ReactNode;
    onDone?: () => void;
}): JSX.Element {
    if (!onDone) {
        return <>{heading}</>;
    }
    return (
        <div className="ui-picker-head">
            {heading}
            <button className="ui-button ui-button-go ui-picker-done" onClick={onDone}>
                {t("ui.select.done")}
            </button>
        </div>
    );
}

// The pet to take along, from those found: none until one's been found. Most are looks only; a
// fighting one (PetDef.power) says what it does
function PetRow({ ui, client }: ScreenProps): JSX.Element | null {
    // A Card collection only run: its own pick, of the pets whose card is owned
    // (SaveData.cardsOnlyPet). Only when the run will be one (playsCardsOnly), as it takes that pet.
    const map = getMap(ui.mapId);
    const cardsOnly =
        ui.screen !== "coop" &&
        playsCardsOnly(ui.save, getMapCharacter(map) ?? ui.characterId, map);
    const found = cardsOnly
        ? PETS.filter((pet) => hasPetCard(ui.save, pet.id) || isPetFound(ui.save.trophies, pet.id))
        : getFoundPets(ui.save.trophies);
    if (found.length === 0) {
        return null;
    }
    const chosen = cardsOnly ? getCardsOnlyPet(ui.save) : ui.save.pet;
    const pick = (petId: string | undefined) =>
        cardsOnly ? client.selectCardsOnlyPet(petId) : client.selectPet(petId);
    const name = chosen
        ? tr(
              `trophy.${getPetTrophy(PET_BY_ID.get(chosen)!).id}.name`,
              getPetTrophy(PET_BY_ID.get(chosen)!).name,
          )
        : t("ui.common.none");
    const power = chosen ? PET_BY_ID.get(chosen)?.power : undefined;
    return (
        <div className="ui-pet-row">
            <span className="ui-pet-label">
                {cardsOnly ? t("ui.pet.label_cards_only") : t("ui.pet.label")}{" "}
                <span className="ui-pet-name">{name}</span>
            </span>
            <div className="ui-pet-tiles">
                <button
                    className={"ui-card ui-pet-tile" + (chosen ? "" : " ui-card-selected")}
                    aria-label={t("ui.pet.none_aria")}
                    aria-pressed={!chosen}
                    title={t("ui.pet.none_aria")}
                    onClick={() => pick(undefined)}
                >
                    <span className="ui-pet-none">{t("ui.common.none")}</span>
                </button>
                {found.map((pet) => {
                    const trophy = getPetTrophy(pet);
                    const selected = pet.id === chosen;
                    const shownTrophyName = trophyName(trophy);
                    // In Card collection only: a pet with its card says so; one found without it
                    // can't be taken, and says what it needs
                    const carded = cardsOnly && hasPetCard(ui.save, pet.id);
                    const needsCard = cardsOnly && !carded;
                    const label = carded
                        ? t("ui.pet.card", { name: shownTrophyName })
                        : needsCard
                          ? t("ui.pet.needs_card", { name: shownTrophyName })
                          : shownTrophyName;
                    return (
                        <button
                            key={pet.id}
                            className={
                                "ui-card ui-pet-tile" +
                                (selected ? " ui-card-selected" : "") +
                                (needsCard ? " ui-pet-needs-card" : "")
                            }
                            aria-label={label}
                            aria-pressed={selected}
                            aria-disabled={needsCard || undefined}
                            title={label}
                            // One without its card says no (its name says why)
                            onClick={() => pick(pet.id)}
                        >
                            <ItemIcon objId={trophy.objId} size={26} />
                            {carded && (
                                <span className="ui-pet-card-mark">{t("ui.pet.card_mark")}</span>
                            )}
                        </button>
                    );
                })}
            </div>
            {power && (
                <span className="ui-pet-power">
                    {power.kind === "call"
                        ? t("ui.pet.power_call", {
                              every: power.every,
                              reach: power.reach,
                              soul: power.soul,
                              heal: Math.round(power.heal * 100),
                          })
                        : power.kind === "gas"
                          ? t("ui.pet.power_gas", {
                                crowd: power.crowd,
                                reach: power.reach,
                                seconds: power.seconds,
                                slow: Math.round(power.slow * 100),
                                every: power.every,
                            })
                          : power.kind === "bubble"
                            ? t("ui.pet.power_bubble", {
                                  every: power.every,
                                  share: Math.round(power.share * 100),
                                  push: power.push,
                              })
                            : t("ui.pet.power_leap", { every: power.every, reach: power.reach })}
                </span>
            )}
        </div>
    );
}

// onFavourite: the favourite button's (not on a map's own adventurer, who can't be picked)
function AdventurerDetails({
    save,
    character,
    onFavourite,
    cardLock,
    onCardNeeds,
}: {
    save: SaveData;
    character: CharacterDef;
    onFavourite?: () => void;
    // Card collection only is on and can be played, but not as them: the cards they still need
    cardLock?: CardDef[];
    onCardNeeds?: () => void;
}): JSX.Element {
    const unlocked = save.unlockedCharacters.includes(character.id);
    const favourite = save.favouriteCharacter === character.id;
    const bonus = formatStats(character.bonus);
    return (
        <div className="ui-select-details">
            <div className="ui-select-details-head">
                <ItemIcon objId={getStartingWeaponIcon(character)} size={36} />
                <div>
                    <div className="ui-card-title">{characterName(character)}</div>
                    <div className="ui-card-style">{STYLE_NAMES[character.style]}</div>
                </div>
                {onFavourite && unlocked && (
                    // The label says whether it's on, so no aria-pressed as well
                    <button
                        className={
                            "ui-button ui-button-small ui-favourite" +
                            (favourite ? " ui-favourite-on" : "")
                        }
                        title={
                            favourite
                                ? t("ui.character.favourite_remove")
                                : t("ui.character.favourite_add")
                        }
                        onClick={onFavourite}
                    >
                        {favourite
                            ? t("ui.character.favourite_on")
                            : t("ui.character.favourite_off")}
                    </button>
                )}
            </div>
            <div className="ui-card-text">
                <RichText text={characterDescription(character)} />
            </div>
            {/* What they bring, a stat to a line */}
            {(bonus.length > 0 || character.damageAgainst) && (
                <div className="ui-select-bonus">
                    {character.damageAgainst && (
                        <StatLine
                            statKey="might"
                            text={t("ui.character.damage_against", {
                                percent: Math.round(character.damageAgainst.damage * 100),
                                targets: list(
                                    character.damageAgainst.tags.map((tag) => t(`ui.tag.${tag}`)),
                                ),
                            })}
                        />
                    )}
                    {bonus.map((line) => (
                        <StatLine key={line.text} text={line.text} english={line.english} />
                    ))}
                </div>
            )}
            {!unlocked && character.unlock && (
                <div className="ui-card-cost">
                    {describeUnlockTask(character.unlock)} {t("ui.common.to_unlock")}
                </div>
            )}
            {cardLock && (
                <div className="ui-card-cost">
                    {t("ui.cards_only.character_locked", {
                        list: list(cardLock.map((card) => card.name())),
                    })}{" "}
                    {onCardNeeds && (
                        <button
                            className="ui-button ui-button-small ui-cards-need-button"
                            onClick={onCardNeeds}
                        >
                            {t("cards.needs.open")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// The adventurer panel's tabs (core/cardRuns.ts): the usual adventurers, or Cards only, where a
// run's level ups, caskets and pet keep to the player's cards. On Cards only, a line says what the
// collection's still short of, a button opening the window of what's needed (CardNeedsWindow);
// the button, its words and the window go by one reckoning (getCardRunNeeds), as the run does.
function CardsOnlyTabs({
    ui,
    client,
    save,
    locked,
    onCardNeeds,
}: ScreenProps & {
    // The save as the tab that applies sees it (a co-op room's, AdventurerPanel)
    save: SaveData;
    // A co-op guest's: the host picks for the room
    locked?: boolean;
    onCardNeeds?: (characterId: string) => void;
}): JSX.Element {
    const on = save.cardsOnly === true;
    const map = getMap(ui.mapId);
    const characterId = getMapCharacter(map) ?? ui.characterId;
    // What's short, while a run from the tab can't start (isCardRunBlocked): worked out once for
    // the save and adventurer, not on every render
    const label = useMemo(
        () =>
            isCardRunBlocked(save, characterId, map)
                ? cardNeedsLabel(getCardRunNeeds(save, characterId))
                : undefined,
        [save, characterId, map],
    );
    // A co-op guest's tabs show the room's choice: pressing them changes nothing
    const pick = (cardsOnly: boolean) => {
        if (!locked) {
            client.setCardsOnly(cardsOnly);
        }
    };
    return (
        <div className="ui-cards-only-tabs">
            <div className="ui-cards-tabs" role="group" aria-label={t("ui.cards_only.tabs")}>
                <button
                    className={"ui-cards-tab" + (on ? "" : " ui-cards-tab-selected")}
                    aria-pressed={!on}
                    disabled={locked && on}
                    onClick={() => pick(false)}
                >
                    {t("ui.cards_only.tab_normal")}
                </button>
                <button
                    className={"ui-cards-tab" + (on ? " ui-cards-tab-selected" : "")}
                    aria-pressed={on}
                    title={t("ui.cards_only.tooltip")}
                    disabled={locked && !on}
                    onClick={() => pick(true)}
                >
                    {t("ui.cards_only.name")}
                </button>
            </div>
            {on &&
                (label ? (
                    <button
                        className="ui-button ui-button-small ui-cards-need-button"
                        onClick={() => onCardNeeds?.(characterId)}
                    >
                        {label}
                    </button>
                ) : (
                    <span className="ui-cards-only-note">{t("ui.cards_only.on_note")}</span>
                ))}
            {locked && <span className="ui-cards-only-note">{t("ui.cards_only.host_picks")}</span>}
        </div>
    );
}

interface MapGroup {
    id: string;
    name: string;
    hint?: string;
    maps: MapDef[];
}

function getMapTabName(tabId: string, fallback: string): string {
    return tr(`ui.map.tab.${tabId}`, fallback);
}

// A group's name and hint, by its id: ui.map.group.<id> and ui.map.group.<id>_hint
function getMapGroupName(group: MapGroup): string {
    return tr(`ui.map.group.${group.id}`, group.name);
}

function getMapGroupHint(group: MapGroup): string | undefined {
    return group.hint && tr(`ui.map.group.${group.id}_hint`, group.hint);
}

// The map screen's tabs, each a list or two of maps in the order they open; an act's is its own
// page (ActPage) rather than lists. The campaign is Act I (its id stays "campaign").
const MAP_TABS: { id: string; name: string; groups: MapGroup[]; act?: ActDef }[] = [
    {
        id: "campaign",
        name: "Act I",
        groups: [{ id: "campaign", name: "Act I", maps: CAMPAIGN_MAPS }],
    },
    // Beside Act I, open once the Inferno's beaten
    {
        id: "fallen_empire",
        name: "Act II",
        groups: [
            {
                id: "fallen_empire",
                name: FALLEN_EMPIRE.name,
                maps: getActMapIds(FALLEN_EMPIRE).map((id) => getMap(id)),
            },
        ],
        act: FALLEN_EMPIRE,
    },
    {
        id: "bosses",
        name: "Bosses",
        groups: [
            {
                id: "boss_fights",
                name: "Boss fights",
                hint: "once their map's beaten",
                maps: FIGHT_MAPS,
            },
            { id: "raids", name: "Raids", hint: "room by room", maps: RAID_MAPS },
        ],
    },
    {
        id: "fun",
        name: "Fun",
        groups: [
            {
                id: "fun_maps",
                name: "Fun maps",
                hint: "endless, open from the start",
                maps: FUN_MAPS.filter((map) => !map.fun?.explore),
            },
            {
                id: "memories",
                name: "Memories",
                hint: "open from the start",
                maps: FUN_MAPS.filter((map) => map.fun?.explore),
            },
            { id: "seasonal", name: "Seasonal", hint: "open from the start", maps: SEASONAL_MAPS },
        ],
    },
    {
        id: "dev",
        name: "Dev",
        groups: [{ id: "dev_maps", name: "Dev maps", hint: "dev server only", maps: DEV_MAPS }],
    },
]
    // An act's tab only once it's out (isActOut)
    .filter((tab) => !tab.act || isActOut(tab.act))
    .map((tab) => ({ ...tab, groups: tab.groups.filter((group) => group.maps.length > 0) }))
    .filter((tab) => tab.groups.length > 0);

const MAP_TAB_IDS = MAP_TABS.map((tab) => tab.id);

function getMapTab(mapId: string): string {
    return (
        MAP_TABS.find((tab) => tab.groups.some((group) => group.maps.some((m) => m.id === mapId)))
            ?.id ?? MAP_TABS[0].id
    );
}

// The maps by kind, a tab for each, two to a row, with details pinned below
// like the adventurers'. Every tab's page is laid out at once, one over
// another, so the list is the same height whichever's open, and the details
// have a fixed place below it: what's pointed at only changes what they say,
// never where a map is. onDone: a phone's picker, as the adventurers'.
function MapPanel({ ui, client, onDone }: ScreenProps & { onDone?: () => void }): JSX.Element {
    const save = ui.save;
    const [peek, setPeek] = useState<string>();
    const [open, setOpen] = useState(() => getMapTab(ui.mapId));
    // A tab's own maps: the details go back to the one picked, not one from the last tab
    const openTab = (id: string) => {
        setOpen(id);
        setPeek(undefined);
    };
    const beaten = CAMPAIGN_MAPS.filter((m) => (save.mapVictories[m.id] ?? 0) > 0).length;
    // The Thanksgiving preview intentionally themes the entire selector, not only its tile.
    const thanksgivingTheme = (peek ?? ui.mapId) === "thanksgiving";
    const tile = (map: MapDef) => {
        const selected = map.id === ui.mapId;
        const shownMapName = mapName(map);
        return (
            <button
                key={map.id}
                className={
                    "ui-card ui-map-tile" +
                    (map.id === "thanksgiving" ? " ui-map-tile-thanksgiving" : "") +
                    (selected ? " ui-card-selected" : "") +
                    (isMapUnlocked(save, map.id) ? "" : " ui-card-locked")
                }
                aria-pressed={selected}
                // Long names are cut off on the tile
                title={shownMapName}
                onMouseMove={() => setPeek(map.id)}
                onFocus={() => setPeek(map.id)}
                onBlur={() => setPeek(undefined)}
                onClick={() => {
                    setPeek(map.id);
                    client.selectMap(map.id);
                }}
            >
                <ItemIcon objId={map.iconObjId} size={20} />
                <span className="ui-map-name">{shownMapName}</span>
                <InvocationBadge points={save.invocationBest?.[map.id]?.points ?? 0} />
                {/* Its final boss beaten awakened, by an Awakener's orb */}
                {(save.awakenedWins?.[map.id] ?? 0) > 0 && (
                    <span className="ui-awakened-mark" title={t("ui.awaken.marked")}>
                        <ItemIcon objId={AWAKENERS_ORB_OBJ} size={14} />
                    </span>
                )}
                {(save.hardVictories[map.id] ?? 0) > 0 ? (
                    <span
                        className="ui-beaten ui-beaten-hard"
                        role="img"
                        aria-label={t("ui.map.beaten_hard")}
                        title={t("ui.map.beaten_hard")}
                    />
                ) : (
                    (save.mapVictories[map.id] ?? 0) > 0 && (
                        <span
                            className="ui-beaten"
                            role="img"
                            aria-label={t("ui.map.beaten")}
                            title={t("ui.map.beaten")}
                        />
                    )
                )}
            </button>
        );
    };
    return (
        <div
            className={
                "ui-panel rs-border rs-background ui-select-panel ui-select-maps" +
                (thanksgivingTheme ? " ui-select-maps-thanksgiving" : "")
            }
            onMouseLeave={stopPeeking(setPeek)}
        >
            <PickerHeading
                heading={
                    <h2 className="ui-select-heading">
                        {t("ui.map.heading")}
                        <span className="ui-select-count">
                            {t("ui.map.beaten_count", { beaten, total: CAMPAIGN_MAPS.length })}
                        </span>
                    </h2>
                }
                onDone={onDone}
            />
            <div
                className="ui-tabs ui-map-tabs"
                role="tablist"
                aria-label={t("ui.map.kinds_of_map")}
                onKeyDown={(event) => {
                    const next = getTabFromKey(event.key, MAP_TAB_IDS, open);
                    if (next) {
                        event.preventDefault();
                        openTab(next);
                        event.currentTarget
                            .querySelector<HTMLButtonElement>(`#map-tab-${next}`)
                            ?.focus();
                    }
                }}
            >
                {MAP_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        id={`map-tab-${tab.id}`}
                        className="ui-button"
                        role="tab"
                        tabIndex={open === tab.id ? 0 : -1}
                        aria-selected={open === tab.id}
                        aria-controls={`map-page-${tab.id}`}
                        onClick={() => openTab(tab.id)}
                    >
                        {getMapTabName(tab.id, tab.name)}
                    </button>
                ))}
            </div>
            <div className="ui-map-pages">
                {MAP_TABS.map((tab) => (
                    <div
                        key={tab.id}
                        id={`map-page-${tab.id}`}
                        className="ui-select-scroll ui-map-page"
                        role="tabpanel"
                        aria-labelledby={`map-tab-${tab.id}`}
                        aria-hidden={open !== tab.id}
                    >
                        {tab.act && (
                            <ActPage
                                act={tab.act}
                                save={save}
                                selected={ui.mapId}
                                onPeek={setPeek}
                                onPick={(mapId) => {
                                    setPeek(mapId);
                                    client.selectMap(mapId);
                                }}
                                onEnding={() => client.showActEnding(tab.act!.id)}
                                onGauntlet={ui.coop.room ? undefined : () => client.openGauntlet()}
                                onVault={() => client.openVault()}
                            />
                        )}
                        {!tab.act &&
                            tab.groups.map((group) => (
                                <div key={group.name} className="ui-style-group">
                                    <div className="ui-style-name">
                                        {getMapGroupName(group)}
                                        {group.hint && (
                                            <span className="ui-style-treasure">
                                                {getMapGroupHint(group)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ui-map-list">{group.maps.map(tile)}</div>
                                </div>
                            ))}
                    </div>
                ))}
            </div>
            {/* Its own for each map, so a long one scrolled down doesn't leave the next scrolled */}
            <MapDetails
                key={peek ?? ui.mapId}
                save={save}
                map={getMap(peek ?? ui.mapId)}
                expertShown={ui.coop.status === "offline"}
                picked={(peek ?? ui.mapId) === ui.mapId ? ui.fightStage : undefined}
                remixes={(peek ?? ui.mapId) === ui.mapId ? ui.remixes : undefined}
                onRemix={
                    (peek ?? ui.mapId) === ui.mapId ? (id) => client.toggleRemix(id) : undefined
                }
                awaken={(peek ?? ui.mapId) === ui.mapId ? ui.awaken : undefined}
                onAwaken={
                    (peek ?? ui.mapId) === ui.mapId && !ui.coop.room
                        ? () => client.toggleAwaken()
                        : undefined
                }
                onPick={
                    (peek ?? ui.mapId) === ui.mapId ? (s) => client.pickFightStage(s) : undefined
                }
            />
        </div>
    );
}

// An act's page (MapDef.act, content/acts.ts): its maps round the act's own card, the ones in the
// game to pick and the rest shown as still to come, all of it faded until the act's opened
function ActPage({
    act,
    save,
    selected,
    onPeek,
    onPick,
    onEnding,
    onGauntlet,
    onVault,
}: {
    act: ActDef;
    save: SaveData;
    selected: string;
    onPeek: (mapId: string | undefined) => void;
    onPick: (mapId: string) => void;
    onEnding: () => void;
    // The Forgotten Four's screen, once it's open (not in a co-op room: solo for now)
    onGauntlet?: () => void;
    // The weekly Vault's screen, once it's open
    onVault: () => void;
}): JSX.Element {
    const orbs = save.awakenerOrbs ?? 0;
    const open = (save.mapVictories[act.requires] ?? 0) > 0;
    const ids = getActMapIds(act);
    const beaten = ids.filter((id) => (save.mapVictories[id] ?? 0) > 0).length;
    // Its Awakened fights, filling the middle card in as they fall; all four, the act's done
    const awakened = getActFightsBeaten(act, save.mapVictories);
    const ended = isActEnded(act, save.mapVictories);
    const areas = ["a", "b", "c", "d"];
    return (
        <div className={"ui-act" + (open ? "" : " ui-act-closed")}>
            {act.slots.map((slot, i) => {
                const map = slot.mapId ? MAP_BY_ID.get(slot.mapId) : undefined;
                const playable = !!map && isMapUnlocked(save, map.id);
                const wins = map ? (save.mapVictories[map.id] ?? 0) : 0;
                return (
                    <button
                        key={slot.name}
                        className={
                            "ui-card ui-act-card" +
                            (map && map.id === selected ? " ui-card-selected" : "") +
                            (playable ? "" : " ui-card-locked")
                        }
                        style={{ gridArea: areas[i] }}
                        aria-pressed={!!map && map.id === selected}
                        aria-disabled={!playable}
                        onMouseMove={() => map && onPeek(map.id)}
                        onFocus={() => map && onPeek(map.id)}
                        onBlur={() => onPeek(undefined)}
                        onClick={() => map && playable && onPick(map.id)}
                    >
                        <ItemIcon objId={slot.iconObjId} size={20} />
                        <span className="ui-act-card-text">
                            <span className="ui-map-name">{actSlotName(act, slot)}</span>
                            <span className="ui-act-line">
                                {map
                                    ? actSlotBoss(act, slot)
                                    : t("ui.act.coming_soon", { boss: actSlotBoss(act, slot) })}
                            </span>
                        </span>
                        {(save.hardVictories[slot.mapId ?? ""] ?? 0) > 0 ? (
                            <span
                                className="ui-beaten ui-beaten-hard"
                                aria-label={t("ui.map.beaten_hard")}
                            />
                        ) : (
                            wins > 0 && (
                                <span className="ui-beaten" aria-label={t("ui.map.beaten")} />
                            )
                        )}
                    </button>
                );
            })}
            <div
                className={
                    "ui-card ui-act-middle" +
                    (act.id === FALLEN_EMPIRE.id && hasGauntletLooks(save) ? " ui-act-gold" : "")
                }
                style={{ gridArea: "m" }}
            >
                <span className="ui-map-name">{actName(act)}</span>
                <span className="ui-act-line">
                    {ended
                        ? t("ui.act.ended", { title: actEndingTitle(act) })
                        : open
                          ? t("ui.act.beaten_any_order", { beaten, total: act.slots.length })
                          : t("ui.act.beat_to_open", { map: mapName(getMap(act.requires)) })}
                </span>
                {open && beaten > 0 && (
                    <span
                        className="ui-act-awakened"
                        aria-label={t("ui.act.awakened_beaten", {
                            beaten: awakened,
                            total: act.slots.length,
                        })}
                        title={t("ui.act.awakened_beaten", {
                            beaten: awakened,
                            total: act.slots.length,
                        })}
                    >
                        {act.slots.map((slot) => {
                            const fight = slot.fightId ? MAP_BY_ID.get(slot.fightId) : undefined;
                            const won = !!fight && (save.mapVictories[fight.id] ?? 0) > 0;
                            return (
                                <span
                                    key={slot.name}
                                    className={
                                        "ui-act-awakened-icon" + (won ? "" : " ui-act-awakened-not")
                                    }
                                >
                                    <ItemIcon
                                        objId={fight?.iconObjId ?? slot.iconObjId}
                                        size={18}
                                    />
                                </span>
                            );
                        })}
                        {/* In the icons' row, so a phone's short card has room for it */}
                        {ended && act.ending && (
                            <button className="ui-button ui-act-ending-again" onClick={onEnding}>
                                {t("ui.act.ending_again")}
                            </button>
                        )}
                    </span>
                )}
                {/* The Forgotten Four, the act's last test (act-2-fallen-empire.md 7.3), the weekly
                    Vault, and the Awakener's orbs held, side by side so a phone's card has room */}
                {ended && act.id === FALLEN_EMPIRE.id && (
                    <span className="ui-act-extras">
                        {isGauntletOpen(save) && (
                            <button
                                className="ui-button ui-button-go ui-act-gauntlet"
                                disabled={!onGauntlet}
                                title={onGauntlet ? undefined : t("ui.gauntlet.solo_only")}
                                onClick={onGauntlet}
                            >
                                {t("ui.gauntlet.title")}
                            </button>
                        )}
                        {isVaultOpen(save.mapVictories) && (
                            <button className="ui-button ui-act-vault" onClick={onVault}>
                                {t("ui.vault.title")}
                            </button>
                        )}
                        {orbs > 0 && (
                            <span
                                className="ui-orbs"
                                title={t("ui.awaken.orbs_tooltip")}
                                aria-label={t("ui.awaken.orbs", { n: fmtNum(orbs) })}
                            >
                                <ItemIcon objId={AWAKENERS_ORB_OBJ} size={18} />
                                {fmtNum(orbs)}
                            </span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

// An act's map's line on its details: the step a run starts at, and its best win
function ActDetails({ save, map }: { save: SaveData; map: MapDef }): JSX.Element | null {
    if (!map.act) {
        return null;
    }
    const act = getAct(map.act.id);
    const step = getActStep(map, save.mapVictories);
    const last = act.steps.length - 1;
    const coins = act.steps[step].coins;
    const best = save.actBest?.[map.id];
    return (
        <>
            <div className="ui-card-style">
                {coins > 0
                    ? t("ui.act.step_coins", {
                          act: actName(act),
                          step,
                          last,
                          coins: Math.round(coins * 100),
                      })
                    : t("ui.act.step", { act: actName(act), step, last })}
            </div>
            {best && (
                <div className="ui-card-style">
                    {best.step < last
                        ? t("ui.act.best_at_step", {
                              time: formatTime(best.seconds),
                              step: best.step,
                          })
                        : t("ui.act.best", { time: formatTime(best.seconds) })}
                    <RecordSetupText record={best} />
                </div>
            )}
        </>
    );
}

// A map's best at invocations (SaveData.invocationBest) and its badges, on a map that takes them
function InvocationDetails({ save, map }: { save: SaveData; map: MapDef }): JSX.Element | null {
    if (!takesInvocations(map)) {
        return null;
    }
    const best = save.invocationBest?.[map.id];
    return (
        <div className="ui-card-style ui-invocation-record">
            <span>
                {best
                    ? t("ui.invocations.best", {
                          points: best.points,
                          time: formatTime(best.seconds),
                      })
                    : t("ui.invocations.none_yet")}
                {best && <RecordSetupText record={{ relics: best.relics }} />}
            </span>
            <InvocationBadges best={best?.points ?? 0} />
        </div>
    );
}

// A map with remixes in its name: theirs before it ("Frozen Lumbridge", "Fallen Inferno")
export function remixedMapName(map: MapDef, remixes: readonly RemixId[]): string {
    const name = mapName(map);
    if (remixes.length === 0) {
        return name;
    }
    return t("ui.remix.map_name", {
        remixes: remixPrefix(remixes),
        map: getLang() === "en" ? name.replace(/^The /, "") : name,
    });
}

// Remixes on the map's card (content/remixes.ts): a switch for each the map takes, lit once it's
// open; the records of the set that's on, and a badge for the most beaten at once there
function RemixRow({
    save,
    map,
    on,
    onToggle,
}: {
    save: SaveData;
    map: MapDef;
    on: RemixId[];
    onToggle: (id: RemixId) => void;
}): JSX.Element | null {
    const ids = getMapRemixes(map);
    const open = ids.filter((id) => isRemixOpen(save.mapVictories, map, id));
    if (open.length === 0) {
        return null;
    }
    const record = on.length > 0 ? save.remixVictories?.[remixKey(map.id, on)] : undefined;
    const best = getRemixBest(save, map.id);
    const setName = remixPrefix(on);
    return (
        <div className="ui-remixes">
            <div className="ui-remix-row">
                <span className="ui-remix-label">{t("ui.remix.label")}</span>
                {REMIX_IDS.map((id) => {
                    const takes = ids.includes(id);
                    const isOpen = open.includes(id);
                    const lit = on.includes(id);
                    const from = getMap(REMIX_BY_ID.get(id)!.from);
                    return (
                        <button
                            key={id}
                            className={
                                "ui-button ui-button-small ui-remix" +
                                (lit ? " ui-remix-on" : "") +
                                (isOpen ? "" : " ui-remix-locked")
                            }
                            disabled={!isOpen}
                            aria-pressed={lit}
                            title={
                                !takes
                                    ? t("ui.remix.own", { name: remixName(id) })
                                    : isOpen
                                      ? remixDescription(id)
                                      : map.act
                                        ? t("ui.remix.locked_act")
                                        : t("ui.remix.locked", { map: mapName(from) })
                            }
                            onClick={(e) => {
                                onToggle(id);
                                e.currentTarget.blur();
                            }}
                        >
                            <ItemIcon objId={REMIX_BY_ID.get(id)!.iconObjId} size={18} />
                            {remixName(id)}
                        </button>
                    );
                })}
                {best > 0 && (
                    <span
                        className={
                            "ui-remix-badge" + (best === REMIX_IDS.length ? " ui-remix-fallen" : "")
                        }
                        title={t("ui.remix.badge_tooltip", { count: best })}
                    >
                        {best === REMIX_IDS.length
                            ? remixPrefix(REMIX_IDS)
                            : `${best}/${REMIX_IDS.length}`}
                    </span>
                )}
            </div>
            {on.length > 0 && (
                <div className="ui-card-style">
                    {record && record.wins > 0
                        ? t("ui.remix.record", {
                              name: setName,
                              times: tp("ui.map.beaten_times", record.wins),
                              time: record.seconds ? formatTime(record.seconds) : "-",
                          }) +
                          (record.hard
                              ? ` ${t("ui.remix.on_hard", { times: tp("ui.map.beaten_times", record.hard) })}`
                              : "")
                        : t("ui.remix.none_yet", { name: setName })}
                    {record?.endless &&
                        ` ${t("ui.remix.endless", {
                            round: record.endless.round,
                            time: formatTime(record.endless.seconds),
                        })}`}
                </div>
            )}
        </div>
    );
}

// What a record was set with, after it: its invocation points and relics (save.ts, RecordSetup)
function RecordSetupText({ record }: { record: RecordSetup }): JSX.Element | null {
    const parts = [
        ...(record.points ? [t("ui.invocations.points", { points: record.points })] : []),
        ...(record.relics && record.relics.length > 0
            ? [
                  t("ui.relics.with", {
                      relics: list(
                          record.relics.flatMap((id) => {
                              const relic = RELIC_BY_ID.get(id);
                              return relic ? [relicName(relic)] : [];
                          }),
                      ),
                  }),
              ]
            : []),
    ];
    return parts.length > 0 ? <span className="ui-record-setup"> ({parts.join(", ")})</span> : null;
}

// The highest invocation badge a map's been beaten at, on its list card
function InvocationBadge({ points }: { points: number }): JSX.Element | null {
    const badge = getInvocationBadge(points);
    return badge > 0 ? (
        <span
            className="ui-invocation-badge ui-invocation-badge-won ui-invocation-badge-small"
            aria-label={t("ui.invocations.badge_aria", { points: badge })}
            title={t("ui.invocations.badge_aria", { points: badge })}
        >
            {badge}
        </span>
    ) : null;
}

// The result screen's button back into a boss fight: a fight in parts (MapDef.stages) goes on to
// its next part once one's won ("Next fight"), or from the first again once the last has been;
// anything else is tried again
function nextFightLabel(map: MapDef, victory: boolean, stage: number | undefined): string {
    if (!victory || !map.stages) {
        return t("ui.result.retry");
    }
    return (stage ?? 0) + 1 < map.stages.length
        ? t("ui.result.next_fight")
        : t("ui.result.fight_again");
}

// What a win says: the part's own words in a fight in parts (MapDef.stages), else the map's
function stageVictoryText(map: MapDef, stage: number | undefined): string {
    return map.stages?.[stage ?? 0]?.victoryText ?? map.victoryText;
}

// The part of a fight in parts a run starts at: the one picked, if it's been reached
function getPickedStage(save: SaveData, map: MapDef, picked: number | undefined): number {
    return picked !== undefined && picked < getReachedStages(save, map.id)
        ? picked
        : getFightStage(save, map.id);
}

// A map's line under its name: how it's gone, or what it takes to open
function getMapStatus(
    save: SaveData,
    map: MapDef,
    picked: number | undefined,
): { text: string; locked: boolean } {
    const wins = save.mapVictories[map.id] ?? 0;
    if (map.fun) {
        return {
            text: map.fun.character
                ? t(map.fun.explore ? "ui.map.explore_char" : "ui.map.fun_char", {
                      name: tr(
                          `char.${map.fun.character}.name`,
                          getCharacter(map.fun.character).name,
                      ),
                  })
                : t("ui.map.fun_endless"),
            locked: !isMapUnlocked(save, map.id),
        };
    }
    if (!isMapUnlocked(save, map.id)) {
        const reqId =
            map.act?.requires ??
            map.requires ??
            map.fight?.requires ??
            MAPS[MAPS.indexOf(map) - 1].id;
        return {
            text: t("ui.map.beat_to_unlock", { map: mapName(getMap(reqId)) }),
            locked: true,
        };
    }
    if (map.stages) {
        const stage = getPickedStage(save, map, picked);
        return {
            text:
                t("ui.map.stage_status", {
                    part: stage + 1,
                    total: map.stages.length,
                    name: tl(map.stages[stage].name),
                }) + (wins > 0 ? ` ${t("ui.map.stage_complete")}` : ""),
            locked: false,
        };
    }
    if (map.fight) {
        const name = tr(`char.${map.fight.character}.name`, getCharacter(map.fight.character).name);
        return {
            text:
                wins > 0
                    ? t("ui.map.boss_fight_beaten", {
                          name,
                          times: tp("ui.map.beaten_times", wins),
                      })
                    : t("ui.map.boss_fight_char", { name }),
            locked: false,
        };
    }
    return {
        text:
            wins > 0
                ? t("ui.map.beaten_status", { times: tp("ui.map.beaten_times", wins) })
                : t("ui.map.not_beaten"),
        locked: false,
    };
}

function MapDetails({
    save,
    map,
    expertShown,
    picked,
    onPick,
    remixes,
    onRemix,
    awaken,
    onAwaken,
}: {
    save: SaveData;
    map: MapDef;
    // The selected map's remixes on, and their switches
    remixes?: RemixId[];
    onRemix?: (id: RemixId) => void;
    // The selected map's Awakener's orb, on or not, and its switch (solo)
    awaken?: boolean;
    onAwaken?: () => void;
    expertShown: boolean;
    // A fight in parts: the part picked to play, and picking one (the selected map's only)
    picked?: number;
    onPick?: (stage: number | undefined) => void;
}): JSX.Element {
    const unlocked = isMapUnlocked(save, map.id);
    const reached = getReachedStages(save, map.id);
    const stage = getPickedStage(save, map, picked);
    const status = getMapStatus(save, map, picked);
    const endless = save.endlessBest[map.id];
    const hardWins = save.hardVictories[map.id] ?? 0;
    const hardEndless = save.hardEndlessBest[map.id];
    const shownMapName = mapName(map);
    return (
        <div
            className={
                "ui-select-details" +
                (map.id === "thanksgiving" ? " ui-select-details-thanksgiving" : "")
            }
        >
            <div className="ui-select-details-head">
                <ItemIcon objId={map.iconObjId} size={36} />
                <div>
                    <div className="ui-card-title">{shownMapName}</div>
                    <div className={status.locked ? "ui-card-cost" : "ui-card-style"}>
                        {status.text}
                    </div>
                    {map.stages && unlocked && onPick && reached > 1 && (
                        <div className="ui-row ui-fight-parts">
                            {map.stages.slice(0, reached).map((part, i) => (
                                <button
                                    key={part.name}
                                    className={
                                        "ui-button ui-button-small" +
                                        (i === stage ? " ui-button-go" : "")
                                    }
                                    aria-pressed={i === stage}
                                    title={tl(part.name)}
                                    onClick={() => onPick(i)}
                                >
                                    {t("ui.map.part", { part: i + 1 })}
                                </button>
                            ))}
                        </div>
                    )}
                    {unlocked && <ActDetails save={save} map={map} />}
                    {unlocked && <InvocationDetails save={save} map={map} />}
                    {unlocked && remixes && onRemix && (
                        <RemixRow save={save} map={map} on={remixes} onToggle={onRemix} />
                    )}
                    {unlocked && CAMPAIGN_MAPS.includes(map) && takesRelics(map) && (
                        <AwakenRow save={save} map={map} on={awaken} onToggle={onAwaken} />
                    )}
                    {endless && (
                        <div className="ui-card-style">
                            {t("ui.map.endless_best", {
                                round: endless.round,
                                time: formatTime(endless.seconds),
                            })}
                            <RecordSetupText record={endless} />
                        </div>
                    )}
                    {hardWins > 0 && (
                        <div className="ui-card-style">
                            {t("ui.map.beaten_on_hard", {
                                times: tp("ui.map.beaten_times", hardWins),
                            })}
                        </div>
                    )}
                    {hardEndless && (
                        <div className="ui-card-style">
                            {t("ui.map.hard_endless_best", {
                                round: hardEndless.round,
                                time: formatTime(hardEndless.seconds),
                            })}
                            <RecordSetupText record={hardEndless} />
                        </div>
                    )}
                </div>
            </div>
            <div className="ui-card-text ui-card-description">
                <RichText text={mapDescription(map)} />
            </div>
            <MapModes save={save} map={map} expertShown={expertShown} />
            <MapTasks save={save} mapId={map.id} />
        </div>
    );
}

// What endless, hard and expert do on this map, or what it takes to open them: the switches in the
// bar below only have room for their names
function MapModes({
    save,
    map,
    expertShown,
}: {
    save: SaveData;
    map: MapDef;
    expertShown: boolean;
}): JSX.Element | null {
    // The Tombs go by their invocations instead
    if (map.tombs) {
        return null;
    }
    const name = mapName(map);
    const modes: { key: string; name: string; text: string; open: boolean }[] = [];
    if (!map.raid) {
        const open = isEndlessUnlocked(save, map.id);
        modes.push({
            key: "endless",
            name: t("ui.endless.name"),
            text: map.fight
                ? t("ui.endless.tooltip.fight")
                : map.fun
                  ? t("ui.endless.tooltip.fun")
                  : open
                    ? t("ui.endless.tooltip.open")
                    : t("ui.endless.tooltip.locked", { map: name }),
            open: open || map.fight !== undefined,
        });
    }
    const hardOpen = isHardUnlocked(save, map.id);
    modes.push({
        key: "hard",
        name: t("ui.hard.name"),
        text: hardOpen ? t("ui.hard.tooltip.open") : t("ui.hard.tooltip.locked", { map: name }),
        open: hardOpen,
    });
    if (map.raid && expertShown) {
        const expertOpen = isExpertUnlocked(save, map.id);
        modes.push({
            key: "expert",
            name: t("ui.expert.name"),
            text: expertOpen
                ? t("ui.expert.tooltip.open")
                : t("ui.expert.tooltip.locked", { map: name }),
            open: expertOpen,
        });
    }
    return (
        <div className="ui-map-modes">
            {modes.map((mode) => (
                <div
                    key={mode.key}
                    className={"ui-map-mode" + (mode.open ? "" : " ui-map-mode-locked")}
                >
                    <span className="ui-map-mode-name">{mode.name}:</span> {mode.text}
                </div>
            ))}
        </div>
    );
}

// A description's own formatting: a blank line between paragraphs (the CSS keeps line breaks),
// and **bold**
function RichText({ text }: { text: string }): JSX.Element {
    return (
        <>
            {text
                .split(/\*\*(.+?)\*\*/g)
                .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
        </>
    );
}

// What a map's tasks bring in, task by task: adventurers (by the weapon they
// start with) and items, faded until they're earned
function MapTasks({ save, mapId }: { save: SaveData; mapId: string }): JSX.Element {
    const earned = (reward: MapReward) =>
        reward.kind === "character"
            ? save.unlockedCharacters.includes(reward.id)
            : save.unlockedItems.includes(reward.id);
    const tasks = new Map<string, MapReward[]>();
    for (const reward of getMapRewards(mapId)) {
        const task = describeUnlockTask(reward.unlock, false);
        tasks.set(task, [...(tasks.get(task) ?? []), reward]);
    }
    return (
        <div className="ui-tasks">
            {[...tasks].map(([task, rewards]) => (
                <div
                    key={task}
                    className={"ui-task" + (rewards.every(earned) ? " ui-task-done" : "")}
                >
                    <span className="ui-task-name">{task}:</span>
                    {rewards.map((reward) => (
                        <span
                            key={reward.kind + reward.id}
                            className={"ui-reward" + (earned(reward) ? "" : " ui-reward-locked")}
                        >
                            <ItemIcon
                                objId={reward.iconObjId}
                                spriteId={reward.iconSpriteId}
                                size={20}
                            />
                            {tl(reward.name)}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
}

// The tab an arrow key, Home or End moves to from the one that's open, round from the last to
// the first and back
function getTabFromKey<T>(key: string, tabs: readonly T[], open: T): T | undefined {
    const index = tabs.indexOf(open);
    return key === "ArrowRight"
        ? tabs[(index + 1) % tabs.length]
        : key === "ArrowLeft"
          ? tabs[(index + tabs.length - 1) % tabs.length]
          : key === "Home"
            ? tabs[0]
            : key === "End"
              ? tabs[tabs.length - 1]
              : undefined;
}

function ShopScreen({ ui, client }: ScreenProps): JSX.Element {
    const save = ui.save;
    const [style, setStyle] = useState<CombatStyle>(() => getCharacter(ui.characterId).style);
    const page = save.skillPages[style];
    const coins = getSkillCoins(save, style);
    const [confirm, confirmDialog] = useConfirm();
    useMenuKeys({ onBack: () => client.showScreen("title") });
    return (
        <div className="ui-fill ui-center">
            <div className="ui-panel rs-border rs-background ui-shop">
                <h2>{t("ui.shop.heading")}</h2>
                <p className="ui-subtle ui-shop-help">
                    {t("ui.shop.help")}{" "}
                    <span className="ui-shop-help-coins">{t("ui.shop.help_coins")}</span>
                </p>
                <div
                    className="ui-row ui-tabs ui-shop-tabs"
                    role="tablist"
                    aria-label={t("ui.shop.presets_aria")}
                    onKeyDown={(event) => {
                        const next = getTabFromKey(event.key, STYLES, style);
                        if (next) {
                            event.preventDefault();
                            setStyle(next);
                            event.currentTarget
                                .querySelector<HTMLButtonElement>(`#skills-tab-${next}`)
                                ?.focus();
                        }
                    }}
                >
                    {STYLES.map((tab) => (
                        <button
                            key={tab}
                            id={`skills-tab-${tab}`}
                            className="ui-button"
                            role="tab"
                            tabIndex={style === tab ? 0 : -1}
                            aria-selected={style === tab}
                            aria-controls="skills-page"
                            onClick={() => setStyle(tab)}
                        >
                            {t("ui.shop.preset_tab", { style: STYLE_NAMES[tab] })}
                        </button>
                    ))}
                </div>
                <div
                    className="ui-shop-grid"
                    id="skills-page"
                    role="tabpanel"
                    aria-labelledby={`skills-tab-${style}`}
                >
                    {SHOP_UPGRADES.map((upgrade) => {
                        const rank = page.upgrades[upgrade.id] ?? 0;
                        const cost = getNextUpgradeCost(save, upgrade.id, style);
                        const affordable = cost !== undefined && coins >= cost;
                        const upgradeName = shopUpgradeName(upgrade);
                        const upgradeDesc = shopUpgradeDescription(upgrade);
                        return (
                            <div key={upgrade.id} className="ui-shop-entry">
                                <button
                                    className={
                                        "ui-card ui-shop-card" +
                                        // Maxed is something done, not something missing
                                        (cost === undefined
                                            ? " ui-shop-card-maxed"
                                            : affordable
                                              ? ""
                                              : " ui-card-dim")
                                    }
                                    aria-disabled={!affordable}
                                    title={
                                        rank > 0 && !isCoarsePointer
                                            ? t("ui.shop.refund_tooltip")
                                            : undefined
                                    }
                                    onClick={() => {
                                        if (affordable) {
                                            client.buyUpgrade(upgrade.id, style);
                                        }
                                    }}
                                    onContextMenu={(event) => {
                                        if (rank > 0) {
                                            event.preventDefault();
                                            if (!isCoarsePointer) {
                                                client.refundUpgrade(upgrade.id, style);
                                            }
                                        }
                                    }}
                                >
                                    <div className="ui-card-title">{upgradeName}</div>
                                    <div className="ui-card-text">
                                        <StatLine text={upgradeDesc} statKey={upgrade.stat} />
                                    </div>
                                    <div className="ui-pips">
                                        {Array.from({ length: upgrade.maxRank }, (_, i) => (
                                            <span
                                                key={i}
                                                className={i < rank ? "ui-pip ui-pip-on" : "ui-pip"}
                                            />
                                        ))}
                                    </div>
                                    <div className="ui-card-cost">
                                        {cost === undefined ? (
                                            t("ui.shop.maxed")
                                        ) : (
                                            <>
                                                <Coins amount={cost} />
                                                {!affordable && (
                                                    <span className="ui-card-short">
                                                        {t("ui.common.short_by", {
                                                            n: fmtNum(cost - coins),
                                                        })}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </button>
                                {rank > 0 && (
                                    <button
                                        className="ui-shop-refund"
                                        aria-label={t("ui.shop.refund_rank", { name: upgradeName })}
                                        title={t("ui.shop.refund_rank", { name: upgradeName })}
                                        onClick={() => client.refundUpgrade(upgrade.id, style)}
                                    >
                                        <span className="ui-shop-refund-icon" aria-hidden="true">
                                            <ItemIcon
                                                objId={-1}
                                                spriteId={REFUND_SPRITE}
                                                size={21}
                                            />
                                        </span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="ui-shop-hint">
                    {t(isCoarsePointer ? "ui.shop.hint.touch" : "ui.shop.hint.mouse")}
                </p>
                <div className="ui-row">
                    <button className="ui-button" onClick={() => client.showScreen("title")}>
                        {t("ui.common.back")}
                    </button>
                    <span className="ui-shop-balance">
                        {t("ui.shop.available")} <Coins amount={coins} />
                    </span>
                    <button
                        className="ui-button"
                        disabled={Object.keys(page.upgrades).length === 0}
                        onClick={async () => {
                            if (
                                await confirm({
                                    title: t("confirm.refund_all.title", {
                                        style: STYLE_NAMES[style],
                                    }),
                                    body: t("confirm.refund_all.body"),
                                    confirm: t("ui.shop.refund_all"),
                                    cancel: t("ui.common.cancel"),
                                })
                            ) {
                                client.refundUpgrades(style);
                            }
                        }}
                    >
                        {t("ui.shop.refund_all")}
                    </button>
                </div>
            </div>
            {confirmDialog}
        </div>
    );
}

function RunScreen({ ui, client }: ScreenProps): JSX.Element {
    const hud = ui.hud;
    return (
        <div className="ui-fill ui-run">
            <ChoiceCountdown client={client} />
            {ui.party.length > 0 && <PartyFrames party={ui.party} />}
            {ui.waitingOn.length > 0 && (ui.overlay === "none" || ui.overlay === "paused") && (
                <WaitingNote names={ui.waitingOn} />
            )}
            {ui.revive && (ui.overlay === "none" || ui.overlay === "paused") && (
                <ReviveNote revive={ui.revive} />
            )}
            {import.meta.env.DEV && ui.director ? (
                // Dev only: the shot editor, over a cinematic held where it's put
                <DirectorPanel director={ui.director} client={client} trailer={ui.trailer} />
            ) : (
                ui.cinematic && (
                    // The opening cinematic: no HUD, and a click or tap anywhere skips it
                    <div
                        className="ui-cinematic"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            client.skipCinematic();
                        }}
                    />
                )
            )}
            {isCoarsePointer && hud && !ui.cinematic && (
                <TouchControls
                    inventory={getMap(hud.mapId).fight || hud.blessings ? [] : hud.inventory}
                    overlay={ui.overlay}
                    client={client}
                />
            )}
            {/* The inspectable HUD slots sit above the touch movement zone. */}
            {hud && !ui.cinematic && (
                <Hud
                    hud={hud}
                    client={client}
                    questTracker={ui.display.questTracker}
                    damagePanel={ui.display.damagePanel}
                    gearPanel={ui.display.gearPanel}
                    disabled={ui.overlay !== "none"}
                    muted={ui.audio.muted}
                />
            )}
            <div className="ui-toasts" role="status" aria-relevant="additions">
                {ui.toasts.map((toast) => (
                    <div key={toast.id} className="ui-toast">
                        {toast.text}
                    </div>
                ))}
            </div>
            {ui.overlay === "levelUp" && <LevelUpModal ui={ui} client={client} />}
            {ui.overlay === "chest" && ui.chest && (
                <ChestModal
                    key={ui.chest.uid}
                    chest={ui.chest}
                    rerolls={hud?.rerolls ?? 0}
                    banishes={hud?.banishes ?? 0}
                    client={client}
                />
            )}
            {ui.overlay === "event" && ui.event && (
                <RunEventModal key={ui.event.uid} event={ui.event} client={client} />
            )}
            {ui.overlay === "paused" && hud && <PauseModal ui={ui} hud={hud} client={client} />}
            {ui.gauntlet?.run && hud && !ui.cinematic && ui.overlay === "none" && (
                <GauntletBadge run={ui.gauntlet.run} />
            )}
            {(ui.overlay === "dead" || ui.overlay === "victory") &&
                (ui.gauntlet?.run && ui.gauntlet.run.phase !== "fight" ? (
                    <GauntletResultModal view={ui.gauntlet} save={ui.save} client={client} />
                ) : (
                    <ResultModal ui={ui} client={client} />
                ))}
        </div>
    );
}

// Milliseconds between the lines of an act's ending coming in
const ENDING_LINE_MS = 2600;

// An act's ending (ActDef.ending), told a line at a time over whatever's up: as the last of its
// Awakened fights falls, and again from its card. A click brings the rest in at once.
function ActEndingModal({
    actId,
    client,
}: {
    actId: string;
    client: GameClient;
}): JSX.Element | null {
    const act = ACT_BY_ID.get(actId);
    const lines = act ? actEndingLines(act) : [];
    const [shown, setShown] = useState(1);
    useEffect(() => {
        if (shown >= lines.length) {
            return;
        }
        const timer = window.setTimeout(() => setShown((n) => n + 1), ENDING_LINE_MS);
        return () => window.clearTimeout(timer);
    }, [shown, lines.length]);
    if (!act) {
        return null;
    }
    const done = shown >= lines.length;
    return (
        <div className="ui-modal ui-act-ending-modal" onClick={() => setShown(lines.length)}>
            <div
                className="ui-panel rs-border rs-background ui-act-ending"
                role="dialog"
                aria-label={actEndingTitle(act)}
            >
                <span className="ui-act-ending-act">{actName(act)}</span>
                <h2 className="ui-act-ending-title">{actEndingTitle(act)}</h2>
                <div className="ui-act-ending-icons">
                    {act.slots.map((slot) => (
                        <ItemIcon key={slot.name} objId={slot.iconObjId} size={26} />
                    ))}
                </div>
                {lines.slice(0, shown).map((line, i) => (
                    <p key={i} className="ui-act-ending-line">
                        {line}
                    </p>
                ))}
                <button
                    className={"ui-button" + (done ? " ui-button-go" : "")}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (done) {
                            client.showActEnding(undefined);
                        } else {
                            setShown(lines.length);
                        }
                    }}
                >
                    {done ? t("ui.act.ending_close") : t("ui.act.ending_all")}
                </button>
            </div>
        </div>
    );
}

// One of the HUD's numbers (hitpoints, xp, the clock, damage), which change many
// times a second. A part of the HUD draws again only when what it picks out does:
// GameClient keeps what hasn't changed the same object.
function useHudNumber<T>(client: GameClient, pick: (numbers: HudNumbers) => T): T | undefined {
    const store = client.store;
    return useSyncExternalStore(store.subscribeNumbers, () => {
        const numbers = store.getNumbers();
        return numbers && pick(numbers);
    });
}

function ChoiceCountdown({ client }: { client: GameClient }): JSX.Element | null {
    const seconds = useHudNumber(client, (n) => n.decisionSeconds);
    if (seconds === undefined) {
        return null;
    }
    return (
        <div
            className={"ui-choice-countdown" + (seconds <= 5 ? " ui-choice-countdown-soon" : "")}
            role="timer"
            aria-label={t("ui.run.choice_countdown_aria", { seconds })}
        >
            <span className="ui-choice-countdown-label">{t("ui.run.choice_countdown_label")}</span>
            <span className="ui-choice-countdown-time">
                {t("ui.run.choice_countdown_time", { seconds })}
            </span>
        </div>
    );
}

// A random event: what's for sale against the coins carried
function RunEventModal({
    event,
    client,
}: {
    event: NonNullable<UiSnapshot["event"]>;
    client: GameClient;
}): JSX.Element {
    const coins = useHudNumber(client, (n) => n.coins) ?? 0;
    return <EventModal event={event} coins={coins} client={client} />;
}

// "3", "max", and past the last level (endless runs) "+2"
function formatSlotLevel(slot: SlotView): string {
    if (slot.level > slot.maxLevel) {
        return `+${slot.level - slot.maxLevel}`;
    }
    return slot.level === slot.maxLevel ? t("ui.hud.slot_max") : String(slot.level);
}

// A weapon, passive or blessing in the HUD, with what it does on a card shown
// while it's pointed at
const Slots = memo(function Slots({
    slots,
    max,
    disabled,
    className,
}: {
    slots: SlotView[];
    max: number;
    disabled: boolean;
    className?: string;
}): JSX.Element {
    return (
        <div className={className ? `ui-slots ${className}` : "ui-slots"}>
            {Array.from({ length: max }, (_, i) => {
                const slot = slots[i];
                return (
                    <DescriptionButton
                        key={i}
                        itemId={slot?.id}
                        disabled={!slot || disabled}
                        aria-label={
                            slot?.name ? tl(slot.name) : t("ui.hud.empty_slot", { n: i + 1 })
                        }
                        className={"ui-slot" + (slot?.evolution?.ready ? " ui-slot-evolve" : "")}
                        style={slot ? { borderColor: slot.rarityColor } : undefined}
                        description={
                            slot && (
                                <>
                                    <div style={{ color: slot.rarityColor }}>{tl(slot.name)}</div>
                                    <div className="ui-slot-tip-level">
                                        {slot.blessing
                                            ? describeBlessed(slot)
                                            : slot.level >= slot.maxLevel
                                              ? t("ui.hud.max_level")
                                              : t("ui.hud.level_of", {
                                                    level: slot.level,
                                                    max: slot.maxLevel,
                                                })}
                                    </div>
                                    {slot.stats?.map((line) => (
                                        <StatLine
                                            key={line.text}
                                            text={line.text}
                                            english={line.english}
                                        />
                                    ))}
                                    {slot.detail && <div>{slot.detail.text}</div>}
                                    {slot.evolution && <EvolutionLine {...slot.evolution} />}
                                </>
                            )
                        }
                    >
                        {slot && (
                            <>
                                <ItemIcon
                                    objId={slot.iconObjId}
                                    spriteId={slot.iconSpriteId}
                                    size={30}
                                />
                                <span className="ui-slot-level">{formatSlotLevel(slot)}</span>
                            </>
                        )}
                    </DescriptionButton>
                );
            })}
        </div>
    );
});

// How far a weapon has got towards its evolution, each half ticked off
function EvolutionLine({
    passive,
    maxed,
    hasPassive,
    ready,
}: NonNullable<SlotView["evolution"]>): JSX.Element {
    return ready ? (
        <div className="ui-evolve-ready">{t("ui.hud.evolve_ready")}</div>
    ) : (
        <div className="ui-evolve-line">
            {t("ui.hud.evolves_with")}
            <span className={maxed ? "ui-evolve-done" : undefined}>
                {maxed ? "✓" : "✗"} {t("ui.hud.max_level")}
            </span>
            ,{" "}
            <span className={hasPassive ? "ui-evolve-done" : undefined}>
                {hasPassive ? "✓" : "✗"} {passive}
            </span>
        </div>
    );
}

// Worn gear, small: a row under the weapons and passives, or with a gridId the gear panel's two
// columns (DisplaySettings.gearPanel), shown while open
const GearSlots = memo(function GearSlots({
    gear,
    disabled,
    gridId,
    open = true,
}: {
    gear: GearSlotView[];
    disabled: boolean;
    gridId?: string;
    open?: boolean;
}): JSX.Element {
    return (
        <div
            id={gridId}
            className={"ui-slots " + (gridId ? "ui-hud-gear-grid" : "ui-gear-slots")}
            role="group"
            aria-label={t("ui.hud.gear_slots")}
            hidden={!open}
        >
            {gear.map((slot) => (
                <DescriptionButton
                    key={slot.slot}
                    itemId={slot.item?.id}
                    disabled={!slot.item || disabled}
                    aria-label={
                        slot.item?.name
                            ? tl(slot.item.name)
                            : t("ui.hud.gear_empty", { name: tl(slot.name) })
                    }
                    className={
                        "ui-slot ui-gear-slot" +
                        (slot.slot === "ring" ? " ui-gear-ring-slot" : "") +
                        (slot.item ? "" : " ui-gear-slot-empty")
                    }
                    style={slot.item ? { borderColor: slot.item.rarity.color } : undefined}
                    description={slot.item && <ItemDescription item={slot.item} />}
                >
                    {slot.item ? (
                        <ItemIcon objId={slot.item.objId} size={22} />
                    ) : (
                        <ItemIcon
                            spriteId={GEAR_SLOT_BY_ID.get(slot.slot)!.iconSpriteId}
                            size={22}
                        />
                    )}
                </DescriptionButton>
            ))}
        </div>
    );
});

// The worn gear under the damage panel (DisplaySettings.gearPanel), shut to start with on a
// touch screen, where there's less room
function GearPanel({ gear, disabled }: { gear: GearSlotView[]; disabled: boolean }): JSX.Element {
    const [open, setOpen] = useState(!isCoarsePointer);
    const gridId = useId();
    return (
        <div className="ui-hud-gear">
            <button
                className="ui-dps ui-gear-toggle"
                type="button"
                aria-label={t("ui.hud.gear")}
                aria-expanded={open}
                aria-controls={gridId}
                title={t("ui.hud.gear_toggle_tooltip")}
                onClick={() => setOpen((shown) => !shown)}
            >
                <span className="ui-dps-label">{t("ui.hud.gear_label")}</span>{" "}
                <span className="ui-dps-toggle">{open ? "▾" : "▸"}</span>
            </button>
            <GearSlots gear={gear} disabled={disabled} gridId={gridId} open={open} />
        </div>
    );
}

// Utility items, used with 1-4 (a controller's shoulder buttons) or a click
const Inventory = memo(function Inventory({
    inventory,
    client,
    disabled,
}: {
    inventory: InventorySlotView[];
    client: GameClient;
    disabled: boolean;
}): JSX.Element {
    return (
        <div className="ui-inventory">
            {inventory.map((slot, i) => (
                <InventoryItem
                    key={i}
                    slot={slot}
                    index={i}
                    disabled={disabled}
                    onUse={() => client.useItem(i)}
                />
            ))}
        </div>
    );
});

function Buffs({ buffs }: { buffs: BuffView[] }): JSX.Element {
    return (
        <div className="ui-buffs">
            {buffs.map((buff) => (
                <DescriptionButton
                    key={buff.id}
                    itemId={buff.id}
                    className={
                        "ui-buff" +
                        (buff.harmful ? " ui-buff-harmful" : "") +
                        (buff.secondsLeft === undefined ? " ui-buff-untimed" : "")
                    }
                    aria-label={tl(buff.name)}
                    description={
                        <>
                            <strong>{tl(buff.name)}</strong>
                            <span>{buff.description}</span>
                        </>
                    }
                >
                    <ItemIcon objId={buff.objId} size={24} />
                    {buff.secondsLeft !== undefined && (
                        <>
                            <span>{buff.secondsLeft}s</span>
                            <div
                                className="ui-buff-bar"
                                style={{ transform: `scaleX(${buff.fraction})` }}
                            />
                        </>
                    )}
                </DescriptionButton>
            ))}
        </div>
    );
}

// The HUD's slower parts draw again only when what the hero has changes; the
// numbers are their own components (useHudNumber)
const Hud = memo(function Hud({
    hud,
    client,
    questTracker,
    damagePanel,
    gearPanel,
    disabled,
    muted,
}: {
    hud: HudView;
    client: GameClient;
    questTracker: boolean;
    damagePanel: boolean;
    gearPanel: boolean;
    disabled: boolean;
    muted: boolean;
}): JSX.Element {
    // A map to walk round with nothing coming (isPeaceful) has no run to keep track of: no level,
    // no clock, no kills, coins, rounds, damage or quests, only the minimap and the hero's own
    // buttons
    const explore = isPeaceful(getMap(hud.mapId));
    return (
        <>
            {!explore && <XpBar level={hud.level} client={client} />}
            <div className="ui-hud-top">
                <div className="ui-hud-left">
                    {!explore &&
                        (hud.blessings ? (
                            // A map with blessings (MapDef.blessings) has no items: the hero's
                            // weapon, and what Saradomin's given them
                            <>
                                <Slots
                                    slots={hud.weapons}
                                    max={hud.weapons.length}
                                    disabled={disabled}
                                />
                                {hud.blessings.length > 0 && (
                                    <Slots
                                        slots={hud.blessings}
                                        max={hud.blessings.length}
                                        disabled={disabled}
                                        className="ui-blessing-slots"
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <Slots
                                    slots={hud.weapons}
                                    max={hud.maxWeapons}
                                    disabled={disabled}
                                />
                                <Slots
                                    slots={hud.passives}
                                    max={hud.maxPassives}
                                    disabled={disabled}
                                />
                                {!gearPanel && <GearSlots gear={hud.gear} disabled={disabled} />}
                            </>
                        ))}
                </div>
                {!explore && <RunTimer client={client} />}
                <TombsScabarasReading client={client} />
                <div className="ui-hud-right">
                    <Minimap client={client} muted={muted} />
                    {!explore && (
                        <>
                            <KillsAndCoins client={client} />
                            {hud.round !== undefined && (
                                <div className="ui-round">
                                    {t("ui.hud.round", { round: hud.round })}
                                </div>
                            )}
                            <RaidRoomInfo client={client} />
                            <TombsWaveInfo client={client} />
                            <TombsShadowsInfo client={client} />
                            <TombsScabarasInfo client={client} />
                            <TombsHetInfo client={client} />
                            <TombsCrondisInfo client={client} />
                            <TombsRoarInfo client={client} />
                        </>
                    )}
                    {/* The dev server's testing buttons: a build drops them whole */}
                    {import.meta.env.DEV && <DevGodButton client={client} />}
                    {import.meta.env.DEV && <DevWardensButton client={client} />}
                    {/* With the column's other toggles; a phone's layout puts it by the timer */}
                    {isCoarsePointer && <CameraZoomSlider client={client} disabled={disabled} />}
                    {!explore && (
                        <>
                            <HudQuests open={questTracker} client={client} disabled={disabled} />
                            <DamagePanel weapons={hud.weapons} open={damagePanel} client={client} />
                            {gearPanel && <GearPanel gear={hud.gear} disabled={disabled} />}
                        </>
                    )}
                </div>
            </div>
            <BossBar mapId={hud.mapId} client={client} />
            <div className="ui-hud-bottom">
                <HudBuffs client={client} />
                <div className="ui-hud-actions">
                    {/* A boss fight has no items, only its own button, and a map to walk round
                        (isPeaceful) or with blessings has none either, only the hero's own
                        buttons */}
                    {!getMap(hud.mapId).fight && !explore && !hud.blessings && (
                        <Inventory inventory={hud.inventory} client={client} disabled={disabled} />
                    )}
                    <AbilityButton client={client} />
                    <KitButtons client={client} />
                </div>
                <HpBar client={client} />
                <SanityBar client={client} />
                <ColdBar client={client} />
            </div>
        </>
    );
});

// Scaled rather than resized, so it doesn't lay the page out again as it fills
function XpBar({ level, client }: { level: number; client: GameClient }): JSX.Element {
    const xpFraction = useHudNumber(client, (n) => n.xpFraction) ?? 0;
    return (
        <div className="ui-xp">
            <div className="ui-xp-fill" style={{ transform: `scaleX(${xpFraction})` }} />
            <span className="ui-xp-level">{t("ui.hud.level", { level })}</span>
        </div>
    );
}

function RunTimer({ client }: { client: GameClient }): JSX.Element {
    const seconds = useHudNumber(client, (n) => n.seconds) ?? 0;
    return <div className="ui-timer">{formatTime(seconds)}</div>;
}

// A touch screen's zoom (a mouse has its wheel), behind a toggle
function CameraZoomSlider({
    client,
    disabled,
}: {
    client: GameClient;
    disabled: boolean;
}): JSX.Element {
    const [zoom, setZoom] = useState(() => {
        const range = MAX_CAMERA_DISTANCE - MIN_CAMERA_DISTANCE;
        return Math.round(((MAX_CAMERA_DISTANCE - client.cameraRig.distance) / range) * 100);
    });
    const [open, setOpen] = useState(false);
    const sliderId = useId();
    return (
        <div className="ui-mobile-zoom-control">
            <button
                className="ui-dps ui-mobile-zoom-toggle"
                type="button"
                aria-label={t("ui.hud.zoom")}
                aria-expanded={open}
                aria-controls={sliderId}
                disabled={disabled}
                onClick={() => setOpen((shown) => !shown)}
            >
                <span className="ui-dps-label">{t("ui.hud.zoom_label")}</span>
                <span className="ui-dps-toggle">{open ? "▾" : "▸"}</span>
            </button>
            <input
                id={sliderId}
                className="ui-mobile-zoom"
                type="range"
                min={0}
                max={100}
                step={1}
                value={zoom}
                hidden={!open}
                disabled={disabled}
                onChange={(event) => {
                    const value = Number(event.currentTarget.value);
                    client.setCameraZoom(value);
                    setZoom(value);
                }}
                onPointerUp={(event) => event.currentTarget.blur()}
                aria-label={t("ui.hud.camera_zoom")}
            />
        </div>
    );
}

function KillsAndCoins({ client }: { client: GameClient }): JSX.Element {
    const kills = useHudNumber(client, (n) => n.kills) ?? 0;
    const coins = useHudNumber(client, (n) => n.coins) ?? 0;
    return (
        <>
            <div>
                <span className="ui-skull">☠</span> {kills.toLocaleString()}
            </div>
            <Coins amount={coins} />
        </>
    );
}

// A raid's room, of how many, and the raid points the player has
function RaidRoomInfo({ client }: { client: GameClient }): JSX.Element | null {
    const room = useHudNumber(client, (n) => n.raidRoom);
    if (!room) {
        return null;
    }
    return (
        <>
            <div className="ui-round">
                {t("ui.hud.room_progress", { number: room.number, count: room.count })}
            </div>
            <div className="ui-raid-points" title={t("ui.hud.raid_points_tooltip")}>
                {t("ui.hud.points_pts", { points: room.points })}
            </div>
        </>
    );
}

// Dev server only, with ?devtools: god mode, for watching a fight's mechanics without dying to them
function DevGodButton({ client }: { client: GameClient }): JSX.Element | null {
    const on = useHudNumber(client, (n) => n.devGod);
    if (!client.devTools || on === undefined) {
        return null;
    }
    return (
        <button className="ui-button ui-button-small" onClick={() => client.toggleDevGod()}>
            God mode (dev): {on ? "on" : "off"}
        </button>
    );
}

// Dev server only, with ?devtools, in the Tombs' Nexus: straight to any boss, for testing its mechanics (with
// God mode, without dying to them). The path bosses as the run is, with the dev skip's bow; the
// Wardens with the best of everything, or as the run is. Never in a build (GameClient.devTools).
const DEV_TOMBS_BOSSES: { pathId: string; name: string }[] = [
    { pathId: "apmeken", name: "Ba-Ba" },
    { pathId: "het", name: "Akkha" },
    { pathId: "scabaras", name: "Kephri" },
    { pathId: "crondis", name: "Zebak" },
];

function DevWardensButton({ client }: { client: GameClient }): JSX.Element | null {
    const shown = useHudNumber(client, (n) => n.devWardens);
    if (!client.devTools || !shown) {
        return null;
    }
    return (
        <>
            {DEV_TOMBS_BOSSES.map((boss) => (
                <button
                    key={boss.pathId}
                    className="ui-button ui-button-small"
                    onClick={() => client.devToTombsBoss(boss.pathId)}
                >
                    {boss.name} (dev)
                </button>
            ))}
            <button className="ui-button ui-button-small" onClick={() => client.devToWardens()}>
                Wardens, max kit (dev)
            </button>
            <button
                className="ui-button ui-button-small"
                onClick={() => client.devToWardens(false)}
            >
                Wardens, as you are (dev)
            </button>
        </>
    );
}

// The Tombs' Apmeken room: always the wave it's on, so it's never a guess
function TombsWaveInfo({ client }: { client: GameClient }): JSX.Element | null {
    const wave = useHudNumber(client, (n) => n.tombsWave);
    if (!wave) {
        return null;
    }
    return (
        <>
            <div className="ui-round">
                {wave.done
                    ? "Room done"
                    : wave.waiting
                      ? "Through the barrier to begin"
                      : `${wave.label ?? "Wave"} ${wave.wave} / ${wave.of}`}
            </div>
            {/* Dev server only, with ?devtools: straight to the boss, for testing it */}
            {client.devTools && !wave.done && (
                <button
                    className="ui-button ui-button-small"
                    onClick={() => client.devSkipToTombsBoss()}
                >
                    Skip to boss (dev)
                </button>
            )}
        </>
    );
}

// Zebak's roar coming: how long there is to get behind a boulder
function TombsRoarInfo({ client }: { client: GameClient }): JSX.Element | null {
    const seconds = useHudNumber(client, (n) => n.tombsRoar);
    if (seconds === undefined) {
        return null;
    }
    return <div className="ui-round">Zebak roars in {seconds}s: get behind a boulder!</div>;
}

// The Crondis room: your water, and the palm's growth
function TombsCrondisInfo({ client }: { client: GameClient }): JSX.Element | null {
    const info = useHudNumber(client, (n) => n.tombsCrondis);
    if (!info) {
        return null;
    }
    return (
        <div className="ui-round">
            Water {info.water}: the palm has {info.growth} of {info.goal}
        </div>
    );
}

// The Het room: the mirrors you're holding, and the caster's charge till its beam goes
function TombsHetInfo({ client }: { client: GameClient }): JSX.Element | null {
    const info = useHudNumber(client, (n) => n.tombsHet);
    if (!info) {
        return null;
    }
    const filled = Math.round(info.charge * 10);
    return (
        <div className="ui-round">
            Mirrors held: {info.held} · Beam {"▰".repeat(filled)}
            {"▱".repeat(10 - filled)}
        </div>
    );
}

// The Scabaras room's puzzles, each done, open or waiting on the others, with where it is (how
// many are solved is the wave line's), and the Ancient tablet's number once it's read
function TombsScabarasInfo({ client }: { client: GameClient }): JSX.Element | null {
    const info = useHudNumber(client, (n) => n.tombsScabaras);
    if (!info) {
        return null;
    }
    return (
        <>
            <div className="ui-scabaras-puzzles">
                {info.puzzles.map(({ puzzle, state }) => (
                    <div key={puzzle} className={"ui-scabaras-puzzle ui-scabaras-puzzle-" + state}>
                        {SCABARAS_PUZZLES[puzzle].name}:{" "}
                        {state === "solved"
                            ? "done"
                            : state === "open"
                              ? SCABARAS_PUZZLES[puzzle].todo
                              : SCABARAS_PUZZLES[puzzle].after}
                    </div>
                ))}
            </div>
            {info.readable && (
                <div className="ui-round">
                    The tablet says {info.target}: made {info.sum}
                </div>
            )}
        </>
    );
}

// The Scabaras room's puzzles as the HUD lists them: each one's name, what it wants and where
// (the room as it's seen, walked up the screen), and what it waits on
const SCABARAS_PUZZLES: Record<ScabarasPuzzle, { name: string; todo: string; after: string }> = {
    sequence: {
        name: "Sequence",
        todo: "right hall, push the button and follow the plates",
        after: "",
    },
    lights: { name: "Lights out", todo: "left hall, light the whole ring", after: "" },
    addition: {
        name: "Addition",
        todo: "make the tablet's number",
        after: "after Sequence and Lights out",
    },
    matching: {
        name: "Matching",
        todo: "far room, pair the symbols",
        after: "after the other three",
    },
};

// What a slate or the Ancient tablet in the Scabaras room says, on a screen of its own while
// you're stood by it: the slates' nine symbols (the floor's own, from above) with what each is
// worth, or the tablet's number
function TombsScabarasReading({ client }: { client: GameClient }): JSX.Element | null {
    const info = useHudNumber(client, (n) => n.tombsScabaras);
    if (!info?.reading) {
        return null;
    }
    if (info.reading === "tablet") {
        return (
            <div className="ui-panel rs-border rs-background ui-scabaras-reading">
                <div className="ui-scabaras-title">Ancient tablet</div>
                {info.readable ? (
                    <>
                        <div className="ui-scabaras-number">{info.target}</div>
                        <div>So far: {info.sum}</div>
                    </>
                ) : (
                    <div>Its markings are dark.</div>
                )}
            </div>
        );
    }
    return (
        <div className="ui-panel rs-border rs-background ui-scabaras-reading ui-scabaras-slate">
            <div className="ui-scabaras-title">Ancient slate</div>
            <div className="ui-scabaras-symbols">
                {SCABARAS.symbolNames.map((name, i) => (
                    <div key={name} className="ui-scabaras-symbol">
                        <ItemIcon locId={SCABARAS.locs.symbols[i]} size={40} />
                        <span className="ui-scabaras-value">{i + 1}</span>
                        <span className="ui-scabaras-name">{name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Akkha's shadows: how many are left, and how long till those still up flood their quarters
function TombsShadowsInfo({ client }: { client: GameClient }): JSX.Element | null {
    const shadows = useHudNumber(client, (n) => n.tombsShadows);
    if (!shadows) {
        return null;
    }
    return (
        <div className="ui-round">
            Shadows {shadows.left} / 4: they flood in {shadows.seconds}s
        </div>
    );
}

function HudQuests({
    open,
    client,
    disabled,
}: {
    open: boolean;
    client: GameClient;
    disabled: boolean;
}): JSX.Element | null {
    const quests = useHudNumber(client, (n) => n.quests);
    return quests && quests.length > 0 ? (
        <QuestTracker quests={quests} open={open} client={client} disabled={disabled} />
    ) : null;
}

function HudBuffs({ client }: { client: GameClient }): JSX.Element | null {
    const buffs = useHudNumber(client, (n) => n.buffs);
    return buffs && buffs.length > 0 ? <Buffs buffs={buffs} /> : null;
}

function HpBar({ client }: { client: GameClient }): JSX.Element | null {
    const hp = useHudNumber(client, (n) => n.hp);
    const maxHp = useHudNumber(client, (n) => n.maxHp);
    const share = useHudNumber(client, (n) => n.hpShare);
    const poisoned = useHudNumber(client, (n) => n.poisoned);
    if (hp === undefined || maxHp === undefined) {
        return null;
    }
    return (
        <div className={poisoned ? "ui-hp ui-hp-poisoned" : "ui-hp"}>
            <div className="ui-hp-fill" style={{ transform: `scaleX(${share ?? hp / maxHp})` }} />
            <span>
                {hp} / {maxHp}
                {poisoned && ` · ${t("ui.hud.poisoned")}`}
            </span>
        </div>
    );
}

// Sanity, under hitpoints, on a map of two worlds (RealmRuleDef.sanity): full in the city, draining
// in the Shadow Realm
function SanityBar({ client }: { client: GameClient }): JSX.Element | null {
    const sanity = useHudNumber(client, (n) => n.sanity);
    const max = useHudNumber(client, (n) => n.sanityMax);
    if (sanity === undefined || !max) {
        return null;
    }
    return (
        <div className="ui-sanity" title={t("ui.hud.sanity")}>
            <div className="ui-sanity-fill" style={{ transform: `scaleX(${sanity / max})` }} />
            <span>{t("ui.hud.sanity_value", { sanity, max })}</span>
        </div>
    );
}

// Cold, under hitpoints, on a map that's cold (ColdRuleDef.cold): it fills as it rises, and frosts
// over from 80, where weapons slow too
function ColdBar({ client }: { client: GameClient }): JSX.Element | null {
    const cold = useHudNumber(client, (n) => n.cold);
    const max = useHudNumber(client, (n) => n.coldMax);
    if (cold === undefined || !max) {
        return null;
    }
    return (
        <div
            className={"ui-cold" + (cold >= max * 0.8 ? " ui-cold-high" : "")}
            title={t("ui.hud.cold")}
        >
            <div className="ui-cold-fill" style={{ transform: `scaleX(${cold / max})` }} />
            <span>{t("ui.hud.cold_value", { cold, max })}</span>
        </div>
    );
}

// The boss's bar while it's out, and a warning in the last minute before it is
// (in a raid's hall, what the hall wants of you)
function BossBar({ mapId, client }: { mapId: string; client: GameClient }): JSX.Element | null {
    const boss = useHudNumber(client, (n) => n.boss);
    const bossIn = useHudNumber(client, (n) => n.bossIn);
    const raidRoom = useHudNumber(client, (n) => n.raidRoom);
    const objective = useHudNumber(client, (n) => n.objective);
    if (!boss) {
        if (raidRoom) {
            return raidRoom.waves && bossIn !== undefined ? (
                <RaidObjective room={raidRoom} bossIn={bossIn} />
            ) : null;
        }
        if (objective) {
            // Shown afresh as it changes, and each time the HUD or a fight's end brings it back
            return (
                <MapObjective key={`${objective.text}:${objective.done}`} objective={objective} />
            );
        }
        return bossIn !== undefined && bossIn <= 60 ? (
            <div className="ui-boss-warning">
                {t("ui.hud.boss_warning", {
                    warning: mapFinalBossWarning(getMap(mapId)),
                    seconds: bossIn,
                })}
            </div>
        ) : null;
    }
    return (
        <div className="ui-boss">
            <div className="ui-boss-name">
                {tl(boss.name)}
                {boss.enraged && (
                    <span className="ui-boss-enraged">{t("ui.hud.boss_enraged")}</span>
                )}
                {boss.fight && (
                    // Keyed on the phase, so a new one plays its pulse from the start
                    <>
                        {" "}
                        <span key={boss.fight.phase} className="ui-boss-phase ui-boss-phase-new">
                            {t("ui.hud.boss_phase", {
                                phase: boss.fight.phase,
                                phases: boss.fight.phases,
                            })}
                        </span>
                    </>
                )}
            </div>
            {boss.fight?.stage === "totems" ? (
                <div className="ui-boss-totems">
                    {boss.fight.totems.map((charge, i) => (
                        <div key={i} className="ui-boss-bar ui-boss-totem">
                            <div
                                className="ui-boss-fill ui-boss-fill-totem"
                                style={{ transform: `scaleX(${charge})` }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="ui-boss-bar">
                    <div
                        className={
                            boss.fight && boss.fight.stage !== "hp"
                                ? "ui-boss-fill ui-boss-fill-shield"
                                : "ui-boss-fill"
                        }
                        style={{ transform: `scaleX(${boss.fraction})` }}
                    />
                </div>
            )}
            {boss.fight && (
                <div className="ui-boss-status">
                    {boss.fight.otherWorld && !boss.fight.guard
                        ? t("ui.hud.boss_status.other_world")
                        : boss.fight.outOfReach && !boss.fight.otherWorld
                          ? t("ui.hud.boss_status.out_of_reach")
                          : boss.fight.guard === "stunned"
                            ? t("ui.hud.boss_status.stunned")
                            : boss.fight.guard === "exposed"
                              ? t("ui.hud.boss_status.guard_down")
                              : ((boss.fight.status ? tl(boss.fight.status) : undefined) ??
                                (boss.fight.stage === "totems"
                                    ? t("ui.hud.boss_status.charge_totems")
                                    : boss.fight.stage === "finale"
                                      ? t("ui.hud.boss_status.stay_on_feet")
                                      : t("ui.hud.boss_status.break_shield")))}
                    {boss.fight.curseAttacks !== undefined && (
                        <span className="ui-boss-curse">
                            {t("ui.hud.boss_cursed", { attacks: boss.fight.curseAttacks })}
                        </span>
                    )}
                    {boss.fight.parasiteSeconds !== undefined && (
                        <span className="ui-boss-curse">
                            {t("ui.hud.boss_parasite", {
                                seconds: Math.ceil(boss.fight.parasiteSeconds),
                            })}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// The client's minimap frame and compass around a canvas the game draws on
// (runs face north, so the compass does too)
// The sound's orb sits at its upper left, where the client's hitpoints orb is
const Minimap = memo(function Minimap({
    client,
    muted,
}: {
    client: GameClient;
    muted: boolean;
}): JSX.Element {
    const canvasRef = useCallback(
        (canvas: HTMLCanvasElement | null) => client.setMinimapCanvas(canvas),
        [client],
    );
    return (
        <div className="ui-minimap">
            <canvas className="ui-minimap-map" ref={canvasRef} />
            <img className="ui-minimap-frame" src={minimapFrame} />
            <img className="ui-minimap-compass" src={compass} />
            <SoundOrb client={client} muted={muted} />
        </div>
    );
});

// A weapon's stats on a level up card: "Damage 10 → 13", the new value green
// when it's better
function ChoiceStats({ stats }: { stats: WeaponStatLine[] }): JSX.Element {
    return (
        <div className="ui-choice-stats">
            {stats.map((line) => (
                <StatLine
                    key={line.label}
                    text={formatWeaponStat(line)}
                    english={line.english}
                    className="ui-choice-stat"
                >
                    <span className="ui-choice-stat-label">{line.label}</span>{" "}
                    {line.from !== undefined && <>{line.from} → </>}
                    <span
                        className={
                            line.from === undefined
                                ? undefined
                                : line.better
                                  ? "ui-choice-stat-up"
                                  : "ui-choice-stat-down"
                        }
                    >
                        {line.value}
                    </span>
                </StatLine>
            ))}
        </div>
    );
}

function LevelUpModal({ ui, client }: ScreenProps): JSX.Element {
    // The godsword's hilt is picked as the rest of the level up that took it
    // to its hilt level
    const hilt = ui.choices.some((choice) => choice.isHilt);
    const spell = ui.choices.some((choice) => choice.isSpell);
    const blessing = ui.choices.some((choice) => choice.isBlessing);
    const keris = ui.choices.some((choice) => choice.isKeris);
    const banishes = ui.hud?.banishes ?? 0;
    const coins = useHudNumber(client, (n) => n.coins) ?? 0;
    const { titleId, dialogProps } = useDialog<HTMLDivElement>();
    return (
        <div className="ui-modal">
            <div {...dialogProps} className="ui-panel rs-border rs-background ui-levelup">
                <h2 id={titleId}>
                    {spell
                        ? t("ui.levelup.title.spell")
                        : keris
                          ? t("ui.levelup.title.keris")
                          : hilt
                            ? t("ui.levelup.title.hilt")
                            : t("ui.levelup.title.regular")}
                    {/* In the heading, as a phone has no room for the line under it */}
                    {ui.levelUpsLeft > 0 && (
                        <span className="ui-levelup-more">
                            {tp("ui.levelup.more_after", ui.levelUpsLeft)}
                        </span>
                    )}
                </h2>
                <p className="ui-subtle">
                    {spell
                        ? t("ui.levelup.sub.spell")
                        : keris
                          ? t("ui.levelup.sub.keris")
                          : hilt
                            ? t("ui.levelup.sub.hilt")
                            : t(blessing ? "ui.levelup.sub.blessing" : "ui.levelup.sub.regular", {
                                  level: ui.hud?.level ?? 1,
                              })}
                </p>
                <div className="ui-choices">
                    {ui.choices.map((choice, i) => (
                        <div
                            key={i}
                            className={"ui-choice-row" + (banishes > 0 ? " ui-has-banish" : "")}
                        >
                            <button
                                className={
                                    "ui-card ui-choice" +
                                    (choice.isEvolution ? " ui-choice-evolve" : "") +
                                    (choice.banished ? " ui-choice-banished" : "")
                                }
                                disabled={choice.banished}
                                style={
                                    choice.rarity ? { borderColor: choice.rarity.color } : undefined
                                }
                                onClick={() => client.choose(i)}
                            >
                                <KeyHint keyLabel={String(i + 1)} />
                                <ItemIcon
                                    objId={choice.iconObjId}
                                    spriteId={choice.iconSpriteId}
                                    size={44}
                                />
                                <div className="ui-card-body">
                                    <div className="ui-card-title">
                                        {choice.title}
                                        {choice.banished ? (
                                            <span className="ui-tag ui-tag-banished">
                                                {t("ui.levelup.tag.banished")}
                                            </span>
                                        ) : (
                                            choice.isNew && (
                                                <span className="ui-tag">
                                                    {t("ui.levelup.tag.new")}
                                                </span>
                                            )
                                        )}
                                        {choice.isEvolution && (
                                            <span className="ui-tag ui-tag-evolve">
                                                {t("ui.levelup.tag.evolution")}
                                            </span>
                                        )}
                                        {choice.isHilt && (
                                            <span className="ui-tag ui-tag-evolve">
                                                {choice.isSpell
                                                    ? t("ui.levelup.tag.spell")
                                                    : choice.isKeris
                                                      ? t("ui.levelup.tag.keris")
                                                      : t("ui.levelup.tag.hilt")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ui-card-text">{choice.text}</div>
                                    {choice.evolves && (
                                        <div
                                            className={
                                                "ui-card-evolves" +
                                                (choice.evolves.held ? " ui-card-evolves-held" : "")
                                            }
                                        >
                                            {choice.evolves.text}
                                        </div>
                                    )}
                                    {choice.stats && choice.stats.length > 0 && (
                                        <ChoiceStats stats={choice.stats} />
                                    )}
                                    {choice.bossPenalty && (
                                        <div className="ui-card-penalty">{choice.bossPenalty}</div>
                                    )}
                                </div>
                                {choice.rarity && (
                                    <span
                                        className="ui-rarity"
                                        style={{ color: choice.rarity.color }}
                                    >
                                        {choice.rarity.name}
                                    </span>
                                )}
                            </button>
                            {/* Over the card's corner, under its rarity: a button can't go in a button */}
                            {choice.banishable && (
                                <BanishButton
                                    title={t("ui.levelup.banish_tooltip", { title: choice.title })}
                                    onBanish={() => client.banish(i)}
                                />
                            )}
                        </div>
                    ))}
                </div>
                {banishes > 0 && (
                    <div className="ui-subtle ui-banishes">
                        {tp("ui.levelup.banishes_left", banishes)}
                    </div>
                )}
                {!hilt && (
                    <div className="ui-levelup-actions">
                        <RerollButton
                            rerolls={ui.hud?.rerolls ?? 0}
                            onReroll={() => client.reroll()}
                        />
                        {ui.hud?.skip && (
                            <SkipButton
                                cost={ui.hud.skip.cost}
                                affordable={ui.hud.skip.affordable}
                                short={ui.hud.skip.cost - coins}
                                onSkip={() => client.skip()}
                            />
                        )}
                        {/* Reloaded (content/relics.ts) */}
                        {ui.hud?.keep && ui.hud.keep.kept > 0 && (
                            <button
                                className="ui-button"
                                disabled={!ui.hud.keep.canTake}
                                title={t("ui.levelup.take_kept_tooltip")}
                                onClick={() => client.takeKept()}
                            >
                                {t("ui.levelup.take_kept", { kept: ui.hud.keep.kept })}
                            </button>
                        )}
                        {ui.hud?.keep && ui.hud.keep.left > 0 && (
                            <button
                                className="ui-button"
                                disabled={!ui.hud.keep.canKeep}
                                title={t("ui.levelup.keep_tooltip")}
                                onClick={() => client.keepOffer()}
                            >
                                {t("ui.levelup.keep", { left: ui.hud.keep.left })}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// The HUD's DPS, and under it each weapon's: click the DPS (or press Tab) to
// open or shut it. Each weapon's damage a second just now, most first, its
// share of all of it (a bar and a percentage), and its damage this run.
// Numbers are short (9.5K, 1.2B), as endless runs reach billions; pointing
// at one gives it in full.
function DamagePanel({
    weapons,
    open,
    client,
}: {
    weapons: SlotView[];
    open: boolean;
    client: GameClient;
}): JSX.Element {
    const totalDps = useHudNumber(client, (n) => n.dps) ?? 0;
    const otherDps = useHudNumber(client, (n) => n.otherDps) ?? 0;
    // A touch screen's fight button over the items (the Tombs') is in this column's way: the DPS
    // keeps left of them there (Mobile.css)
    const besideAbility = useHudNumber(client, (n) => n.ability?.withItems) === true;
    const weaponDamage = useHudNumber(client, (n) => n.weaponDamage);
    const damageOf = (slot: SlotView) => weaponDamage?.[slot.id];
    const total = weapons.reduce((sum, w) => sum + (damageOf(w)?.dps ?? 0), otherDps);
    // Most damage a second first; ties (weapons yet to hit) keep the HUD's order
    const rows = [...weapons].sort((a, b) => (damageOf(b)?.dps ?? 0) - (damageOf(a)?.dps ?? 0));
    return (
        <div className={besideAbility ? "ui-damage ui-damage-beside-ability" : "ui-damage"}>
            <button
                className="ui-dps"
                onClick={() => client.toggleDamagePanel()}
                title={t("ui.damage.toggle_tooltip")}
            >
                <span className="ui-dps-label">{t("ui.damage.dps")}</span> {formatCompact(totalDps)}{" "}
                <span className="ui-dps-toggle">{open ? "▾" : "▸"}</span>
            </button>
            {open && (
                <div className="ui-damage-panel">
                    <div className="ui-damage-head">
                        <span />
                        <span />
                        <span>{t("ui.damage.share")}</span>
                        <span>{t("ui.damage.dps")}</span>
                        <span>{t("ui.damage.total")}</span>
                    </div>
                    {rows.map((slot) => {
                        const dps = damageOf(slot)?.dps ?? 0;
                        const damage = damageOf(slot)?.damage ?? 0;
                        return (
                            <div key={slot.id} className="ui-damage-row">
                                <ItemIcon
                                    objId={slot.iconObjId}
                                    spriteId={slot.iconSpriteId}
                                    size={24}
                                />
                                <span className="ui-damage-weapon">
                                    <span
                                        className="ui-damage-name"
                                        style={{ color: slot.rarityColor }}
                                    >
                                        {tl(slot.name)}
                                    </span>
                                    <span className="ui-damage-bar">
                                        <span
                                            style={{
                                                width: `${total > 0 ? (dps / total) * 100 : 0}%`,
                                            }}
                                        />
                                    </span>
                                </span>
                                <span className="ui-damage-share">{formatShare(dps, total)}</span>
                                <span className="ui-damage-dps" title={exact(dps)}>
                                    {formatCompact(dps)}
                                </span>
                                <span className="ui-damage-total" title={exact(damage)}>
                                    {formatCompact(damage)}
                                </span>
                            </div>
                        );
                    })}
                    {otherDps >= 0.05 && (
                        <div className="ui-damage-row ui-damage-other">
                            <span />
                            <span className="ui-damage-weapon" title={t("ui.damage.other_tooltip")}>
                                {t("ui.damage.other")}
                            </span>
                            <span className="ui-damage-share">{formatShare(otherDps, total)}</span>
                            <span className="ui-damage-dps" title={exact(otherDps)}>
                                {formatCompact(otherDps)}
                            </span>
                            <span />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function exact(value: number): string {
    return Math.round(value).toLocaleString();
}

// The quests this run is getting on with, under the minimap: click the title
// (or press Q) to fold it away
function QuestTracker({
    quests,
    open,
    client,
    disabled,
}: {
    quests: QuestTrackView[];
    open: boolean;
    client: GameClient;
    disabled: boolean;
}): JSX.Element {
    return (
        <div className="ui-quest-tracker">
            <button
                className="ui-quest-tracker-title"
                onClick={() => client.toggleQuestTracker()}
                title={t("ui.quest.toggle_tooltip")}
            >
                {t("ui.quest.heading")} {open ? "▾" : "▸"}
            </button>
            {open &&
                quests.map((quest) => (
                    <QuestTrack key={quest.id} quest={quest} disabled={disabled} />
                ))}
        </div>
    );
}

// Kept from the last update while its progress is the same (shareUnchanged). What it asks for is
// the description a hover or hold brings up, as it is for a slot
const QuestTrack = memo(function QuestTrack({
    quest,
    disabled,
}: {
    quest: QuestTrackView;
    disabled: boolean;
}): JSX.Element {
    return (
        <DescriptionButton
            itemId={quest.id}
            disabled={disabled}
            className={"ui-quest-track " + questTrackClass(quest)}
            description={tl(quest.task)}
        >
            <span className="ui-quest-track-name">{tl(quest.name)}</span>
            <span className="ui-quest-track-progress">{formatQuestProgress(quest)}</span>
        </DescriptionButton>
    );
});

// Coloured like the quest tab: red until started, yellow while under way,
// green once done
function questTrackClass(quest: QuestTrackView): string {
    return quest.finished ? "ui-quest-done" : quest.done > 0 ? "ui-quest-started" : "ui-quest-new";
}

function formatQuestProgress(quest: QuestTrackView): string {
    return quest.finished
        ? t("ui.quest.done")
        : `${quest.done.toLocaleString()} / ${quest.of.toLocaleString()}`;
}

function PauseModal({
    ui,
    hud,
    client,
}: {
    ui: UiSnapshot;
    hud: HudView;
    client: GameClient;
}): JSX.Element {
    // Co-op's menu doesn't stop the run
    const coop = ui.party.length > 0;
    const quests = useHudNumber(client, (n) => n.quests) ?? [];
    const activeEffects = useHudNumber(client, (n) => n.buffs) ?? [];
    const padKind = usePadKind();
    // The host can remove anyone still in the run (one who's stopped playing)
    const kickable =
        coop && ui.coop.room?.hostId === ui.coop.you
            ? ui.party.filter((member) => member.id && !member.left)
            : [];
    const { titleId, dialogProps } = useDialog<HTMLDivElement>({ modal: !coop });
    const [confirm, confirmDialog] = useConfirm();
    const host = coop && ui.coop.room?.hostId === ui.coop.you;
    const quit = async () => {
        const confirmed = await confirm(
            coop
                ? {
                      title: t("confirm.leave.title"),
                      body: host ? t("pause.quit.host_warning") : t("confirm.leave.body"),
                      confirm: t("pause.quit.leave"),
                      cancel: t("ui.common.cancel"),
                  }
                : {
                      title: t("confirm.quit.title"),
                      body: t("confirm.quit.body"),
                      confirm: t("confirm.quit.confirm"),
                      cancel: t("confirm.quit.cancel"),
                  },
        );
        if (confirmed) {
            client.quitRun();
        }
    };
    return (
        <div className={coop ? "ui-modal ui-modal-clear" : "ui-modal"}>
            <div {...dialogProps} className="ui-panel rs-border rs-background ui-pause">
                <h2 id={titleId}>{coop ? t("pause.title.coop") : t("pause.title.paused")}</h2>
                {coop && <p className="ui-subtle">{t("pause.coop_warning")}</p>}
                {ui.saveBlock && ui.saveBlockClosed && (
                    <p className="ui-subtle">
                        <button
                            className="ui-version ui-save-off"
                            onClick={() => client.showSaveBlock()}
                        >
                            {t("ui.title.not_saving")}
                        </button>
                    </p>
                )}
                <div className="ui-pause-columns">
                    <div className="ui-pause-column">
                        {hud.stats.length > 0 && (
                            <>
                                <h3 className="ui-pause-heading">
                                    {t("pause.heading.your_stats")}
                                </h3>
                                <div className="ui-pause-stats">
                                    {hud.stats.map((line) => (
                                        <StatLine
                                            key={line.text}
                                            text={line.text}
                                            english={line.english}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        <div
                            className={
                                "ui-pause-list" +
                                (hud.stats.length > 0 &&
                                hud.weapons.length + hud.passives.length > 0
                                    ? " ui-pause-loadout"
                                    : "")
                            }
                        >
                            {/* A map with blessings has those in place of passives */}
                            {[...hud.weapons, ...(hud.blessings ?? hud.passives)].map((slot) => (
                                <div key={slot.id} className="ui-pause-item">
                                    <ItemIcon
                                        objId={slot.iconObjId}
                                        spriteId={slot.iconSpriteId}
                                        size={28}
                                    />
                                    {/* The name, and what it does under it */}
                                    <span className="ui-pause-name">
                                        <span style={{ color: slot.rarityColor }}>
                                            {tl(slot.name)}
                                        </span>
                                        <span className="ui-pause-detail">
                                            {[...(slot.stats ?? []), slot.detail]
                                                .filter((line): line is StatText => !!line)
                                                .map((line, i) => (
                                                    <StatLine
                                                        key={i}
                                                        text={line.text}
                                                        english={line.english}
                                                    />
                                                ))}
                                        </span>
                                        {slot.evolution && <EvolutionLine {...slot.evolution} />}
                                    </span>
                                    <span className="ui-pause-level">
                                        {slot.blessing
                                            ? `×${slot.level}`
                                            : slot.level >= slot.maxLevel
                                              ? t("pause.slot_max")
                                              : t("pause.slot_level", { level: slot.level })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {hud.gear.some((slot) => slot.item) && (
                            <>
                                <h3 className="ui-pause-heading">
                                    {t("pause.heading.worn_equipment")}
                                </h3>
                                <div className="ui-pause-list">
                                    {hud.gear.map(
                                        ({ slot, item }) =>
                                            item && (
                                                <div key={slot} className="ui-pause-item">
                                                    <ItemIcon objId={item.objId} size={28} />
                                                    <span className="ui-pause-name">
                                                        <span style={{ color: item.rarity.color }}>
                                                            {tl(item.name)}
                                                        </span>
                                                        <span className="ui-pause-detail">
                                                            <ItemLines item={item} />
                                                            {item.set && (
                                                                <span
                                                                    className={
                                                                        "ui-pause-set" +
                                                                        (item.set.active
                                                                            ? " ui-pause-set-on"
                                                                            : "")
                                                                    }
                                                                >
                                                                    <StatLine
                                                                        text={item.set.text}
                                                                    />
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                </div>
                                            ),
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="ui-pause-column">
                        <h3 className="ui-pause-heading">{t("pause.heading.effects")}</h3>
                        {activeEffects.length > 0 ? (
                            <div className="ui-pause-list">
                                {activeEffects.map((effect) => (
                                    <div key={effect.id} className="ui-pause-item">
                                        <ItemIcon objId={effect.objId} size={24} />
                                        <span className="ui-pause-name">
                                            {tl(effect.name)}
                                            <span className="ui-pause-detail">
                                                {effect.description}
                                            </span>
                                            {effect.secondsLeft !== undefined && (
                                                <span className="ui-pause-detail">
                                                    {t("pause.effects.left", {
                                                        seconds: effect.secondsLeft,
                                                    })}
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            className={
                                                "ui-pause-level " +
                                                (effect.harmful
                                                    ? "ui-pause-effect-debuff"
                                                    : "ui-pause-effect-buff")
                                            }
                                        >
                                            {effect.harmful
                                                ? t("pause.effects.debuff")
                                                : t("pause.effects.buff")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ui-subtle">{t("pause.effects.none")}</div>
                        )}
                        {quests.length > 0 && (
                            <>
                                <h3 className="ui-pause-heading">{t("pause.heading.quests")}</h3>
                                <div className="ui-pause-list">
                                    {quests.map((quest) => (
                                        <div
                                            key={quest.id}
                                            className={"ui-pause-quest " + questTrackClass(quest)}
                                        >
                                            <span className="ui-quest-name">{tl(quest.name)}</span>
                                            <span className="ui-pause-detail">
                                                {tl(quest.task)}
                                            </span>
                                            <span className="ui-quest-progress">
                                                {formatQuestProgress(quest)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {kickable.length > 0 && (
                            <>
                                <h3 className="ui-pause-heading">{t("pause.heading.party")}</h3>
                                <div className="ui-pause-list">
                                    {kickable.map((member) => (
                                        <div key={member.id} className="ui-pause-item">
                                            <span className="ui-pause-name">{member.name}</span>
                                            <button
                                                className="ui-button ui-button-small ui-coop-kick"
                                                title={t("pause.party.kick_title", {
                                                    name: member.name,
                                                })}
                                                aria-label={t("pause.party.kick_aria", {
                                                    name: member.name,
                                                })}
                                                onClick={() => client.kickPlayer(member.id!)}
                                            >
                                                {t("pause.party.kick_button")}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {ui.toastLog.length > 0 && (
                            <>
                                <h3 className="ui-pause-heading">{t("pause.heading.recent")}</h3>
                                <ul className="ui-pause-recent">
                                    {ui.toastLog.map((text, i) => (
                                        <li key={i}>{text}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {padKind ? (
                            <>
                                <h3 className="ui-pause-heading">
                                    {t("pause.heading.controller")}
                                </h3>
                                <PadControls />
                            </>
                        ) : (
                            !isCoarsePointer && (
                                <>
                                    <h3 className="ui-pause-heading">
                                        {t("pause.heading.keyboard")}
                                    </h3>
                                    <KeyboardControls />
                                </>
                            )
                        )}
                        <h3 className="ui-pause-heading">{t("pause.heading.settings")}</h3>
                        <LanguageSetting />
                        <SoundSettings
                            ui={ui}
                            client={client}
                            music={getMap(ui.mapId).music !== undefined}
                        />
                        <PickupTimerSetting ui={ui} client={client} />
                        <GearPanelSetting ui={ui} client={client} />
                        <PuzzleHelperSetting ui={ui} client={client} />
                        <AutoPauseSetting ui={ui} client={client} />
                        <AutoAlchSetting ui={ui} client={client} />
                        <AutoEquipSetting ui={ui} client={client} />
                        <MovePredictionSetting ui={ui} client={client} />
                        <FrameRateSetting ui={ui} client={client} />
                    </div>
                </div>
                <div className="ui-row">
                    <button
                        className="ui-button"
                        title={host ? t("pause.quit.host_warning") : undefined}
                        onClick={quit}
                    >
                        {coop ? t("pause.quit.leave") : t("pause.quit.give_up")}
                    </button>
                    <button className="ui-button ui-button-go" onClick={() => client.resume()}>
                        {t("pause.resume")}
                    </button>
                </div>
            </div>
            {confirmDialog}
        </div>
    );
}

// Co-op's results name everyone else
const MAX_LISTED_TEAMMATES = 3;

// How long the results ignore Escape and Enter after they come up
const RESULT_KEY_GUARD_MS = 600;

// "Coif, Rune boots and Seers ring", or the first few "and 5 more"
function listNames(names: string[], most = 3): string {
    if (names.length === 0) {
        return "";
    }
    if (names.length === 1) {
        return names[0];
    }
    const shown = names.length > most ? names.slice(0, most - 1) : names;
    if (names.length > most) {
        const rest = tp("ui.result.and_more", names.length - shown.length);
        return list([...shown, rest]);
    }
    return list(names);
}

// Damage a second, with a decimal while it's small
function formatPerSecond(perSecond: number): string {
    return perSecond < 100_000
        ? perSecond.toLocaleString(undefined, { maximumFractionDigits: perSecond < 10 ? 1 : 0 })
        : formatBig(perSecond);
}

// Big numbers the way OSRS shows a stack: in full up to 99,999, then 100K,
// then 10M, so an endless run's totals still fit. Past what a stack can hold
// (10,000M), the damage panel's short form: 12B, 4.6Qa.
function formatBig(value: number): string {
    const n = Math.round(value);
    if (n < 100_000) {
        return n.toLocaleString();
    }
    if (n < 10_000_000) {
        return `${Math.floor(n / 1000).toLocaleString()}K`;
    }
    if (n < 10_000_000_000) {
        return `${Math.floor(n / 1_000_000).toLocaleString()}M`;
    }
    return formatCompact(n);
}

// A stat's number, shortened when it's big, in full when pointed at
function Big({ value }: { value: number }): JSX.Element {
    const n = Math.round(value);
    return <span title={n >= 100_000 ? n.toLocaleString() : undefined}>{formatBig(n)}</span>;
}

export function ResultModal({ ui, client }: ScreenProps): JSX.Element {
    const result = ui.result;
    const victory = ui.overlay === "victory";
    const players = result?.players ?? [];
    // Your own page first (the modal is mounted afresh for each run's result)
    const [playerIndex, setPlayerIndex] = useState(() =>
        Math.max(
            0,
            players.findIndex((player) => player.isLocal),
        ),
    );
    const player = players[playerIndex];
    const multiplayer = players.length > 1;
    const changePlayer = useCallback(
        (direction: number) =>
            setPlayerIndex((current) => (current + direction + players.length) % players.length),
        [players.length],
    );
    useEffect(() => {
        if (!multiplayer) return;
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target;
            if (
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                (target instanceof HTMLElement &&
                    (target.isContentEditable || target.closest("input, textarea, select")))
            )
                return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                if (!event.repeat) changePlayer(event.key === "ArrowLeft" ? -1 : 1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [changePlayer, multiplayer]);
    // The map just played: a win can have moved the pick on to the one it opened
    const played = getMap(result?.mapId ?? ui.mapId);
    const canRetry = !result?.coop;
    useMenuKeys({
        onBack: () => client.leaveRun(),
        onConfirm: () => (canRetry ? client.retry() : client.leaveRun()),
        // Esc is the pause key: a run can end just as it's pressed
        guardMs: RESULT_KEY_GUARD_MS,
    });
    const { titleId, dialogProps } = useDialog<HTMLDivElement>();
    return (
        <div className="ui-modal">
            <div {...dialogProps} className="ui-panel rs-border rs-background ui-result">
                <h2 id={titleId} className={victory ? "ui-victory" : "ui-defeat"}>
                    {victory && result
                        ? tl(stageVictoryText(getMap(result.mapId), result.stage))
                        : (result?.endedEarly ?? t("ui.result.dead"))}
                </h2>
                {result?.party && (
                    <p className="ui-subtle">
                        {t("ui.result.with_party", {
                            party: listNames(result.party, MAX_LISTED_TEAMMATES),
                        })}
                    </p>
                )}
                {result?.endlessRecord && (
                    <p className="ui-unlocked">
                        {result.hard
                            ? t("ui.result.endless_record_hard", {
                                  map: mapName(getMap(result.mapId)),
                              })
                            : t("ui.result.endless_record", { map: mapName(getMap(result.mapId)) })}
                    </p>
                )}
                {result?.tombs && <TombsBoardView tombs={result.tombs} />}
                {result?.raidChest && <RaidChestView chest={result.raidChest} />}
                {result?.hard && result.victory && result.relics && (
                    <p className="ui-subtle">{t("ui.result.relics_no_hard")}</p>
                )}
                {result?.cardsOnly && <p className="ui-subtle">{t("ui.result.cards_only")}</p>}
                {/* What packs are bought with, apart from the coins (content/cards.ts) */}
                {result !== undefined && (result.platinum ?? 0) > 0 && (
                    <p className="ui-unlocked">
                        {t("ui.result.platinum")} <Platinum amount={result.platinum!} />
                    </p>
                )}
                {result?.firstHardWin && (
                    <p className="ui-unlocked">
                        {t("ui.result.first_hard_win", { map: mapName(getMap(result.mapId)) })}
                    </p>
                )}
                {/* Act II's extras (act-2-fallen-empire.md 8.6): an invader felled, an orb spent
                    or won, the Vault's week */}
                {result?.invasion?.killed && (
                    <p className="ui-unlocked">
                        {t("ui.result.invader_killed", { name: invaderName(result.invasion.id) })}
                    </p>
                )}
                {result?.invasion?.came && !result.invasion.killed && (
                    <p className="ui-subtle">
                        {t("ui.result.invader_lived", { name: invaderName(result.invasion.id) })}
                    </p>
                )}
                {result?.awakened?.seen && (
                    <p className={result.victory ? "ui-unlocked" : "ui-subtle"}>
                        {result.victory
                            ? t("ui.result.awakened_won", {
                                  coins: fmtNum(result.awakened.casketCoins ?? 0),
                              })
                            : t("ui.result.awakened_spent")}
                    </p>
                )}
                {result?.orbWon && <p className="ui-unlocked">{t("ui.result.orb_won")}</p>}
                {result?.vault && (
                    <p className={result.vault.best ? "ui-unlocked" : "ui-subtle"}>
                        {result.vault.best
                            ? t("ui.result.vault_best", {
                                  week: parseWeekKey(result.vault.key)?.week ?? 0,
                              })
                            : t("ui.result.vault_not_best")}
                    </p>
                )}
                {result?.unlockedMap && (
                    <p className="ui-unlocked">
                        {t("ui.result.unlocked_map", { map: tl(result.unlockedMap) })}
                    </p>
                )}
                {result?.unlockedCharacters.map((name) => (
                    <p key={name} className="ui-unlocked">
                        {t("ui.result.unlocked_character", { name: tl(name) })}
                    </p>
                ))}
                {result?.unlockedItems.map((name) => (
                    <p key={name} className="ui-unlocked">
                        {t("ui.result.unlocked_item", { name: tl(name) })}
                    </p>
                ))}
                {result && result.newTrophies.length > 0 && (
                    <p className="ui-unlocked">
                        {t("ui.result.new_trophies", {
                            trophies: listNames(result.newTrophies.map(tl)),
                        })}
                    </p>
                )}
                {result && result.newGear.length > 0 && (
                    <p className="ui-unlocked">
                        {t("ui.result.new_gear", {
                            gear: listNames(result.newGear.map(tl)),
                        })}
                    </p>
                )}
                {result?.quests.map((quest) => (
                    <p key={quest.name} className="ui-unlocked">
                        {t("ui.result.quest_complete", { name: tl(quest.name) })}{" "}
                        <Coins amount={quest.coins} />
                    </p>
                ))}
                {multiplayer && player && (
                    <div
                        className="ui-result-player-nav"
                        role="group"
                        aria-label={t("ui.result.player_nav_aria")}
                    >
                        <button
                            className="ui-button ui-result-arrow"
                            aria-label={t("ui.result.prev_player_aria")}
                            title={t("ui.result.prev_player_title")}
                            onClick={() => changePlayer(-1)}
                        >
                            <span className="ui-result-arrow-left" aria-hidden="true" />
                        </button>
                        <div className="ui-result-player" aria-live="polite" aria-atomic="true">
                            <div className="ui-result-player-name">
                                {player.name}
                                {player.isLocal && t("ui.result.you")}
                            </div>
                            <div className="ui-result-player-detail">
                                {t("ui.result.player_index", {
                                    current: playerIndex + 1,
                                    total: players.length,
                                })}
                                {player.left
                                    ? t("ui.result.left_run")
                                    : player.down
                                      ? t("ui.result.down")
                                      : ""}
                            </div>
                        </div>
                        <button
                            className="ui-button ui-result-arrow"
                            aria-label={t("ui.result.next_player_aria")}
                            title={t("ui.result.next_player_title")}
                            onClick={() => changePlayer(1)}
                        >
                            <span className="ui-result-arrow-right" aria-hidden="true" />
                        </button>
                    </div>
                )}
                {result && player && (
                    <div className="ui-result-columns">
                        <div className="ui-result-column">
                            {multiplayer && (
                                <h3 className="ui-pause-heading">
                                    {t("ui.result.individual_stats")}
                                </h3>
                            )}
                            <table
                                className="ui-result-table"
                                aria-label={t("ui.result.individual_stats")}
                            >
                                <tbody>
                                    <tr>
                                        <td>{t("ui.result.stat.adventurer")}</td>
                                        <td>{tl(player.characterName)}</td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.kills")}</td>
                                        <td>
                                            <Big value={player.kills} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.damage_dealt")}</td>
                                        <td>
                                            <Big value={player.damageDealt} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.biggest_hit")}</td>
                                        <td>
                                            <Big value={player.highestHit} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.damage_taken")}</td>
                                        <td>
                                            <Big value={player.damageTaken} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.healed")}</td>
                                        <td>
                                            <Big value={player.healed} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.caskets")}</td>
                                        <td>{player.caskets}</td>
                                    </tr>
                                    {(player.rerollsUsed > 0 || player.skips > 0) && (
                                        <tr>
                                            <td>{t("ui.result.stat.rerolls_skips")}</td>
                                            <td>
                                                {player.rerollsUsed} / {player.skips}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <h3 className="ui-pause-heading">
                                {multiplayer
                                    ? t("ui.result.party_totals")
                                    : t("ui.result.run_totals")}
                            </h3>
                            <table
                                className="ui-result-table"
                                aria-label={
                                    multiplayer
                                        ? t("ui.result.party_totals_aria")
                                        : t("ui.result.run_totals")
                                }
                            >
                                <tbody>
                                    {result.hard && (
                                        <tr>
                                            <td>{t("ui.result.stat.difficulty")}</td>
                                            <td>
                                                {result.expert
                                                    ? t("ui.expert.name")
                                                    : t("ui.hard.name")}
                                            </td>
                                        </tr>
                                    )}
                                    {result.points !== undefined && (
                                        <tr>
                                            <td>{t("ui.result.stat.invocations")}</td>
                                            <td>
                                                {t("ui.invocations.points", {
                                                    points: result.points,
                                                })}
                                            </td>
                                        </tr>
                                    )}
                                    {result.relics && (
                                        <tr>
                                            <td>{t("ui.result.stat.relics")}</td>
                                            <td>
                                                {list(
                                                    result.relics.flatMap((id) => {
                                                        const relic = RELIC_BY_ID.get(id);
                                                        return relic ? [relicName(relic)] : [];
                                                    }),
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {result.endless && (
                                        <tr>
                                            <td>{t("ui.result.stat.endless_round")}</td>
                                            <td>{result.round}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td>{t("ui.result.stat.run_time")}</td>
                                        <td>{formatTime(result.seconds)}</td>
                                    </tr>
                                    <tr>
                                        <td>{t("ui.result.stat.level")}</td>
                                        <td>{result.level}</td>
                                    </tr>
                                    {multiplayer && (
                                        <>
                                            <tr>
                                                <td>{t("ui.result.stat.kills")}</td>
                                                <td>
                                                    <Big value={result.kills} />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>{t("ui.result.stat.damage_dealt")}</td>
                                                <td>
                                                    <Big
                                                        value={players.reduce(
                                                            (total, entry) =>
                                                                total + entry.damageDealt,
                                                            0,
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>{t("ui.result.stat.caskets")}</td>
                                                <td>{result.caskets}</td>
                                            </tr>
                                        </>
                                    )}
                                    <tr>
                                        <td>{t("ui.result.stat.coins_banked")}</td>
                                        <td>
                                            <Coins amount={result.coins} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            {result.bossKills.length > 0 && (
                                <>
                                    <h3 className="ui-pause-heading">
                                        {multiplayer
                                            ? t("ui.result.party_bosses")
                                            : t("ui.result.bosses")}
                                    </h3>
                                    <table className="ui-result-table">
                                        <tbody>
                                            {result.bossKills.map((boss, i) => (
                                                <tr key={i}>
                                                    <td>{tl(boss.name)}</td>
                                                    <td>{formatTime(boss.seconds)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                        {player.damage.length > 0 && (
                            <div className="ui-result-column">
                                <h3 className="ui-pause-heading">
                                    {t("ui.result.damage_breakdown")}
                                </h3>
                                <table
                                    className="ui-result-damage"
                                    aria-label={t("ui.result.damage_breakdown")}
                                >
                                    <thead>
                                        <tr>
                                            <th />
                                            <th>{t("ui.result.damage")}</th>
                                            <th>{t("ui.result.stat.kills")}</th>
                                            <th>{t("ui.damage.dps")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {player.damage.map((row, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <span className="ui-result-source">
                                                        {row.iconObjId !== undefined && (
                                                            <ItemIcon
                                                                objId={row.iconObjId}
                                                                spriteId={row.iconSpriteId}
                                                                size={24}
                                                            />
                                                        )}
                                                        <span
                                                            className="ui-result-name"
                                                            style={{ color: row.color }}
                                                            title={tl(row.name)}
                                                        >
                                                            {tl(row.name)}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <Big value={row.damage} />
                                                </td>
                                                <td>
                                                    <Big value={row.kills} />
                                                </td>
                                                <td>
                                                    {row.perSecond !== undefined
                                                        ? formatPerSecond(row.perSecond)
                                                        : ""}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                <div className="ui-row">
                    {/* On your own: straight into the same map again */}
                    {canRetry && (
                        <button className="ui-button ui-button-go" onClick={() => client.retry()}>
                            <KeyHint keyLabel="Enter" className="ui-choice-key ui-word-key" />{" "}
                            {played.fight
                                ? nextFightLabel(played, victory, result?.stage)
                                : t("ui.result.play_again")}
                        </button>
                    )}
                    <button
                        className={canRetry ? "ui-button" : "ui-button ui-button-go"}
                        onClick={() => client.leaveRun()}
                    >
                        {ui.coop.room ? t("ui.result.back_party") : t("ui.result.back_title")}
                    </button>
                </div>
            </div>
        </div>
    );
}
