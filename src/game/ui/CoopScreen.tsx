import { memo, useEffect, useMemo, useRef, useState } from "react";

import { GameClient } from "../client/GameClient";
import { ReviveView, TeammateView, UiSnapshot } from "../client/GameStore";
import { describeMissing, parseRoomCode, roomPlaysCardsOnly } from "../client/coop/CoopLobby";
import { RoomListing, RoomView } from "../client/coop/protocol";
import { CHARACTERS, characterName, getCharacter } from "../content/characters";
import { MAX_PARTY } from "../content/coop";
import { getVault } from "../content/vault";
import {
    HARD_PRESET,
    cleanInvocations,
    getInvocationPoints,
    getRaidBand,
    getRaidLevel,
} from "../content/invocations";
import {
    FUN_MAPS,
    MAPS,
    MAP_BY_ID,
    RAID_MAPS,
    getMap,
    getMapCharacter,
    isCoopMap,
    takesInvocations,
} from "../content/maps";
import { isCardRunBlocked } from "../core/cardRuns";
import { isEndlessUnlocked, isHardUnlocked, isMapUnlocked } from "../core/save";
import { fmtNum, list, t, tl, tp, useLang } from "../i18n";
import { CardNeedsWindow } from "./CardNeeds";
import { useConfirm } from "./ConfirmDialog";
import "./CoopScreen.css";
import { CountryFlag } from "./CountryFlag";
import {
    AdventurerPanel,
    PhoneAdventurerCard,
    PickerHeading,
    Toggle,
    getStartingWeaponIcon,
} from "./GameUi";
import {
    InvocationBoard,
    InvocationsButton,
    RunInvocationBoard,
    RunInvocationsButton,
} from "./Invocations";
import { ItemIcon } from "./ItemIcon";
import { useMenuKeys } from "./menuKeys";
import { usePhoneLayout } from "./usePhoneLayout";

// Co-op: finding a room or making one, then the room itself, where everyone
// picks their adventurer and readies up and the host picks the map. In a run,
// the party's frames and who it's waiting on.

type Props = { ui: UiSnapshot; client: GameClient };

// An open room shows its host's flag to its party even if they've hidden it,
// so making one says so. Cloudflare's list shows the server's country instead
// (Node relays list the host's).
function openRoomTitle(ui: UiSnapshot): string {
    return ui.coop.country && !ui.display.coopFlag
        ? t("coop.open_room_title_flag")
        : t("coop.open_room_title");
}

// Who can join, as a pair: the same when making a room and, for its host, in it
function RoomAccess({
    ui,
    open,
    onChange,
    className = "",
}: {
    ui: UiSnapshot;
    open: boolean;
    onChange: (open: boolean) => void;
    className?: string;
}): JSX.Element {
    return (
        <div
            className={"ui-coop-choice " + className}
            role="group"
            aria-label={t("coop.who_can_join")}
        >
            <button
                className={"ui-button ui-button-small" + (open ? "" : " ui-toggle-on")}
                aria-pressed={!open}
                onClick={() => open && onChange(false)}
            >
                {t("coop.invite_only")}
            </button>
            <button
                className={"ui-button ui-button-small" + (open ? " ui-toggle-on" : "")}
                aria-pressed={open}
                title={openRoomTitle(ui)}
                onClick={() => !open && onChange(true)}
            >
                {t("coop.open_to_all")}
            </button>
        </div>
    );
}

export function CoopScreen({ ui, client }: Props): JSX.Element {
    useLang();
    const room = ui.coop.room;
    return room ? (
        <CoopLobby ui={ui} client={client} room={room} />
    ) : (
        <CoopMenu ui={ui} client={client} />
    );
}

function CoopMenu({ ui, client }: Props): JSX.Element {
    const coop = ui.coop;
    const [code, setCode] = useState("");
    const [open, setOpen] = useState(false);
    const online = coop.status === "online";
    const canJoin = online;
    // Rooms on maps this game hasn't got (a newer game's) can't be joined
    const rooms = coop.rooms.filter((listing) => MAP_BY_ID.has(listing.mapId));
    // An unknown location keeps the space when other rooms have flags.
    const flags = rooms.some((listing) => listing.country);
    // Unless the relay takes anyone, a room on a map this player hasn't got
    // can't be joined: what's missing, or nothing
    const missing = ({ mapId, endless, hard }: RoomListing) =>
        coop.anyMap ||
        (isMapUnlocked(ui.save, mapId) &&
            (!endless || isEndlessUnlocked(ui.save, mapId)) &&
            (!hard || isHardUnlocked(ui.save, mapId)))
            ? undefined
            : describeMissing({ mapId, endless, hard });
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Escape" && !(e.target instanceof HTMLInputElement)) {
                client.closeCoop();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [client]);
    return (
        <div className="ui-fill ui-center">
            <div className="ui-panel rs-border rs-background ui-coop">
                <h2>{t("coop.title")}</h2>
                <p className="ui-subtle">{t("coop.intro", { n: fmtNum(MAX_PARTY - 1) })}</p>
                <div className="ui-coop-rows">
                    <div className="ui-coop-row">
                        <span className="ui-coop-label">{t("coop.your_name")}</span>
                        {/* The relay gives everyone a name; another's a click away */}
                        <span className="ui-coop-name">
                            <CountryFlag
                                country={ui.display.coopFlag ? coop.country : undefined}
                                label={t("coop.flag_label_self")}
                            />
                            {coop.name || "..."}
                        </span>
                        <button
                            className="ui-button ui-button-small"
                            disabled={!online}
                            onClick={() => client.renameCoop()}
                        >
                            {t("coop.new_name")}
                        </button>
                    </div>
                    <div className="ui-coop-row">
                        <span className="ui-coop-label">{t("coop.new_room")}</span>
                        <RoomAccess ui={ui} open={open} onChange={setOpen} />
                        <button
                            className="ui-button ui-button-go"
                            disabled={!canJoin || coop.roomsFull}
                            title={coop.roomsFull ? t("coop.rooms_full") : undefined}
                            onClick={() => client.createRoom(open)}
                        >
                            {t("coop.create")}
                        </button>
                    </div>
                    <form
                        className="ui-coop-row"
                        onSubmit={(e) => {
                            e.preventDefault();
                            client.joinRoom(code);
                        }}
                    >
                        <span className="ui-coop-label">{t("coop.room_code")}</span>
                        <input
                            className="ui-coop-input ui-coop-code-input"
                            value={code}
                            placeholder="ABCDE"
                            spellCheck={false}
                            autoCapitalize="characters"
                            // An invite link pasted in leaves just its code
                            onChange={(e) => setCode(parseRoomCode(e.target.value))}
                        />
                        <button
                            className="ui-button"
                            type="submit"
                            disabled={!canJoin || code.trim().length === 0}
                        >
                            {t("coop.join")}
                        </button>
                    </form>
                </div>
                <h3 className="ui-coop-heading">
                    {t("coop.open_rooms")}
                    <span className="ui-select-count">
                        {coop.status === "connecting"
                            ? t("coop.connecting")
                            : online
                              ? t("coop.open_count", { n: fmtNum(coop.roomsTotal) })
                              : t("coop.offline")}
                    </span>
                </h3>
                <div className="ui-coop-rooms">
                    {rooms.map((listing) => {
                        const map = getMap(listing.mapId);
                        const locked = missing(listing);
                        return (
                            <div
                                key={listing.code}
                                className="ui-coop-room"
                                title={t("coop.hosted_by", { host: listing.host })}
                            >
                                <CountryFlag
                                    country={listing.country}
                                    label={
                                        listing.countrySource === "server"
                                            ? t("coop.hosted_server")
                                            : t("coop.hosted_from")
                                    }
                                    keepSpace={flags}
                                />
                                <ItemIcon objId={map.iconObjId} size={20} />
                                <span className="ui-coop-room-name">
                                    <span className="ui-coop-room-host">{listing.name}</span>
                                    <span className="ui-coop-room-code">{listing.code}</span>
                                    <span className="ui-coop-room-map">
                                        {tl(map.name)}
                                        {listing.hard && t("coop.room_hard")}
                                        {listing.endless && !map.fun && t("coop.room_endless")}
                                    </span>
                                </span>
                                <span className="ui-coop-room-count">
                                    {t("coop.player_count", {
                                        n: fmtNum(listing.players),
                                        max: fmtNum(listing.max),
                                    })}
                                </span>
                                <button
                                    className="ui-button ui-button-small"
                                    disabled={!online || !!locked}
                                    title={locked}
                                    onClick={() => client.joinRoom(listing.code)}
                                >
                                    {locked ? t("coop.locked") : t("coop.join")}
                                </button>
                            </div>
                        );
                    })}
                    {online && coop.rooms.length === 0 && (
                        <div className="ui-coop-empty">{t("coop.no_open_rooms")}</div>
                    )}
                    {coop.status === "offline" && (
                        <div className="ui-coop-empty">
                            {t("coop.not_connected")}{" "}
                            <button
                                className="ui-button ui-button-small"
                                onClick={() => client.openCoop()}
                            >
                                {t("coop.try_again")}
                            </button>
                        </div>
                    )}
                </div>
                {online && coop.roomsPages > 1 && (
                    <div className="ui-coop-pages">
                        <button
                            className="ui-button ui-button-small"
                            aria-label={t("coop.previous_page")}
                            disabled={coop.roomsPage === 0}
                            onClick={() => client.showRoomsPage(coop.roomsPage - 1)}
                        >
                            ‹
                        </button>
                        <span>
                            {t("coop.page_of", {
                                page: fmtNum(coop.roomsPage + 1),
                                pages: fmtNum(coop.roomsPages),
                            })}
                        </span>
                        <button
                            className="ui-button ui-button-small"
                            aria-label={t("coop.next_page")}
                            disabled={coop.roomsPage >= coop.roomsPages - 1}
                            onClick={() => client.showRoomsPage(coop.roomsPage + 1)}
                        >
                            ›
                        </button>
                    </div>
                )}
                {coop.roomsFull && online && (
                    <div className="ui-coop-error">{t("coop.rooms_full")}</div>
                )}
                {coop.error && <div className="ui-coop-error">{tl(coop.error)}</div>}
                <div className="ui-row">
                    <button className="ui-button" onClick={() => client.closeCoop()}>
                        {t("canvas.back")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// The room before a run: adventurers on the left like the usual select
// screen, the party and the map on the right
function CoopLobby({ ui, client, room }: Props & { room: RoomView }): JSX.Element {
    const you = ui.coop.you;
    const isHost = room.hostId === you;
    const me = room.members.find((m) => m.id === you);
    // The host readies up too, so a party of one can play
    const everyoneReady = room.members.every((m) => m.ready);
    // Unless the relay takes anyone, the host can only pick what everyone in
    // the room has unlocked: who hasn't, or nothing
    const lacking = (mapId: string, endless: boolean, hard = false) =>
        ui.coop.anyMap
            ? undefined
            : room.members.find(
                  (m) =>
                      !m.unlocks?.maps.includes(mapId) ||
                      (endless && !m.unlocks.endless.includes(mapId)) ||
                      (hard && !m.unlocks.hard?.includes(mapId)),
              );
    // A map this game hasn't got (a newer host's) shows as the first
    const map = MAP_BY_ID.get(room.mapId) ?? MAPS[0];
    // Who keeps the host from turning endless or hard mode on here
    const withoutEndless = lacking(map.id, true);
    const withoutHard = lacking(map.id, false, true);
    // The Tombs: the raid level the host's invocations come to (Loadout.invocations), cleaned as
    // the Sim cleans them; the start carries the same ones
    const host = room.members.find((m) => m.id === room.hostId);
    // Cards only for the whole room, as the host's tab says (roomPlaysCardsOnly; the host's own
    // tab at once, before its loadout comes back), never in the weekly Vault's room, which is the
    // same run for everyone. Who can't play it as their adventurer can't ready.
    const vaultRoom = ui.vaultRoom !== undefined && getVault(ui.vaultRoom).mapId === room.mapId;
    const cardsOnly =
        !vaultRoom && (isHost ? ui.save.cardsOnly === true : roomPlaysCardsOnly(room));
    const cardsSave = useMemo(
        () => ({ ...ui.save, cardsOnly: cardsOnly || undefined }),
        [ui.save, cardsOnly],
    );
    const runCharacter = getMapCharacter(map) ?? map.fun?.character ?? ui.characterId;
    const cardBlocked = useMemo(
        () => isCardRunBlocked(cardsSave, runCharacter, map),
        [cardsSave, runCharacter, map],
    );
    // The host's: who hasn't sent their cards yet, which Start waits for
    const withoutCards =
        isHost && cardsOnly && !map.blessings
            ? room.members.filter((m) => m.id !== you && typeof m.loadout?.cardCaps !== "string")
            : [];
    const [needsFor, setNeedsFor] = useState<string>();
    // Escape shuts what's needed, when it's open
    useMenuKeys({ onBack: needsFor ? () => setNeedsFor(undefined) : undefined });
    const hostInvocations = isHost ? ui.save.invocations : host?.loadout?.invocations;
    const raidLevel = map.tombs
        ? getRaidLevel(cleanInvocations(Array.isArray(hostInvocations) ? hostInvocations : []))
        : undefined;
    // A run's: the host's invocation points, hard mode's preset with them when the room's on hard
    const runBoard = takesInvocations(map);
    const invocationPoints = runBoard
        ? getInvocationPoints([
              ...(Array.isArray(hostInvocations) ? hostInvocations : []),
              ...(room.hard ? HARD_PRESET : []),
          ])
        : undefined;
    // The invocation board, closed whenever the map changes, so it doesn't come back by itself
    // when the Tombs is picked again
    const [board, setBoard] = useState(false);
    const [boardMap, setBoardMap] = useState(room.mapId);
    if (boardMap !== room.mapId) {
        setBoardMap(room.mapId);
        setBoard(false);
    }
    const [confirm, confirmDialog] = useConfirm();
    const disband = async () => {
        if (
            await confirm({
                title: t("confirm.disband.title"),
                body: t("coop.disband_hint"),
                confirm: t("coop.disband"),
                cancel: t("ui.common.cancel"),
            })
        ) {
            client.disbandRoom();
        }
    };
    const [copied, setCopied] = useState(false);
    const copiedTimer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
    const copyInvite = () => {
        navigator.clipboard
            ?.writeText(client.getInviteLink(room.code))
            .then(() => {
                setCopied(true);
                window.clearTimeout(copiedTimer.current);
                copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {});
    };
    // A phone's lists over the whole screen (as PhoneSetup's): Escape and Enter close them
    const phone = usePhoneLayout();
    const [picker, setPicker] = useState<"adventurer" | "map">();
    // Only the host picks the map: a guest's list closes if they stop being it
    const picking = phone && (picker !== "map" || isHost) ? picker : undefined;
    const closePicker = () => setPicker(undefined);
    useMenuKeys(picking && !board ? { onBack: closePicker, onConfirm: closePicker } : {});
    const party = (
        <>
            <h2 className="ui-select-heading">
                {room.name || t("coop.party")}
                <span className="ui-select-count">
                    {t("coop.player_count", {
                        n: fmtNum(room.members.length),
                        max: fmtNum(MAX_PARTY),
                    })}
                </span>
            </h2>
            <div className="ui-coop-code">
                <span className="ui-coop-code-label">{t("coop.room")}</span>
                <span className="ui-coop-code-value">{room.code}</span>
                <button className="ui-button ui-button-small" onClick={copyInvite}>
                    {copied ? t("coop.copied") : t("coop.copy_invite")}
                </button>
                {isHost ? (
                    <RoomAccess
                        ui={ui}
                        open={room.open}
                        onChange={(open) => client.setRoomOpen(open)}
                        className="ui-coop-open"
                    />
                ) : (
                    <span className="ui-coop-open">
                        {room.open ? t("coop.open") : t("coop.invite_only")}
                    </span>
                )}
            </div>
            <div className="ui-coop-members">
                {room.members.map((member) => {
                    const character = getCharacter(
                        getMapCharacter(map) ??
                            (CHARACTERS.some((c) => c.id === member.characterId)
                                ? member.characterId
                                : CHARACTERS[0].id),
                    );
                    const host = member.id === room.hostId;
                    const tag =
                        member.id === you && host
                            ? t("coop.tag_you_host")
                            : member.id === you
                              ? t("coop.tag_you")
                              : host
                                ? t("coop.tag_host")
                                : undefined;
                    return (
                        <div key={member.id} className="ui-coop-member">
                            <ItemIcon objId={getStartingWeaponIcon(character)} size={28} />
                            <span className="ui-coop-member-name">
                                {/* A long name cuts this off */}
                                <span
                                    className="ui-card-title"
                                    title={tag ? `${member.name} ${tag}` : member.name}
                                >
                                    {member.name}
                                    {tag && <span className="ui-coop-you"> {tag}</span>}
                                </span>
                                {/* Under the name, which needs the room */}
                                <span className="ui-card-style">
                                    <CountryFlag
                                        country={member.country}
                                        label={t("coop.playing_from")}
                                    />
                                    {tl(character.name)}
                                </span>
                            </span>
                            <span
                                className={
                                    "ui-coop-status" + (member.ready ? " ui-coop-status-ready" : "")
                                }
                            >
                                {member.ready ? t("coop.ready") : t("coop.not_ready")}
                            </span>
                            {isHost && !host && (
                                <button
                                    className="ui-button ui-button-small ui-coop-kick"
                                    title={t("coop.remove_from_party", { name: member.name })}
                                    aria-label={t("coop.kick_player", { name: member.name })}
                                    onClick={() => client.kickPlayer(member.id)}
                                >
                                    {t("coop.kick")}
                                </button>
                            )}
                            {member.id === you && (
                                <button
                                    className="ui-button ui-button-small"
                                    onClick={() => client.renameCoop()}
                                >
                                    {t("coop.new_name")}
                                </button>
                            )}
                        </div>
                    );
                })}
                {Array.from({ length: MAX_PARTY - room.members.length }, (_, i) => (
                    <div key={i} className="ui-coop-member ui-coop-member-empty">
                        {t("coop.waiting_for_player")}
                    </div>
                ))}
            </div>
        </>
    );
    const mapHeading = (
        <div className="ui-style-name">
            {t("coop.map")}
            <span className="ui-style-treasure">
                {isHost ? t("coop.host_picks") : t("coop.picked_by_host")}
            </span>
        </div>
    );
    // The host's: every co-op map, those someone in the room hasn't got out of reach
    const mapList = (
        <div className="ui-select-scroll ui-coop-maps">
            <div className="ui-map-list">
                {[...MAPS, ...RAID_MAPS, ...FUN_MAPS].filter(isCoopMap).map((m) => {
                    const selected = m.id === room.mapId;
                    // Others in the room who haven't got it
                    const without = lacking(m.id, false);
                    const unlocked = isMapUnlocked(ui.save, m.id) && !without;
                    return (
                        <button
                            key={m.id}
                            className={
                                "ui-card ui-map-tile" +
                                (selected ? " ui-card-selected" : "") +
                                (unlocked ? "" : " ui-card-locked")
                            }
                            aria-pressed={selected}
                            disabled={!unlocked}
                            title={
                                without && isMapUnlocked(ui.save, m.id)
                                    ? t("coop.member_missing_map", {
                                          name: without.name,
                                          map: tl(m.name),
                                      })
                                    : tl(m.name)
                            }
                            onClick={() => client.selectMap(m.id)}
                        >
                            <ItemIcon objId={m.iconObjId} size={20} />
                            <span className="ui-map-name">{tl(m.name)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
    // The map picked, and how it'll be played
    const mapSummary = (
        <div className="ui-select-details-head">
            <ItemIcon objId={map.iconObjId} size={36} />
            <div>
                <div className="ui-card-title">{tl(map.name)}</div>
                <div className="ui-card-style">
                    {map.fun
                        ? map.fun.character
                            ? t("coop.fun_map_character", {
                                  name: tl(getCharacter(map.fun.character).name),
                              })
                            : t("coop.fun_map_endless")
                        : map.fight
                          ? t("coop.boss_fight_character", {
                                name: tl(getCharacter(map.fight.character).name),
                            })
                          : map.raid || map.tombs
                            ? t("coop.raid_room_by_room")
                            : room.endless
                              ? t("coop.endless")
                              : t("coop.fifteen_minutes")}
                </div>
                {room.hard && <div className="ui-card-style">{t("coop.on_hard_mode")}</div>}
                {raidLevel !== undefined && (
                    <div className="ui-card-style">
                        {t("coop.raid_level_host_invocations", {
                            level: raidLevel,
                            band: getRaidBand(raidLevel),
                        })}
                    </div>
                )}
                {invocationPoints !== undefined && invocationPoints > 0 && (
                    <div className="ui-card-style">
                        {t("coop.invocation_points_host", {
                            points: invocationPoints,
                        })}
                    </div>
                )}
            </div>
        </div>
    );
    const notes = (
        <>
            {cardsOnly && !map.blessings && (
                <div className="ui-coop-start-hint">{t("coop.cards_only")}</div>
            )}
            {withoutCards.length > 0 && (
                <div className="ui-coop-start-hint">
                    {t("coop.cards_waiting", { names: list(withoutCards.map((m) => m.name)) })}
                </div>
            )}
            {cardsOnly && cardBlocked && (
                <div className="ui-coop-cards-blocked">
                    <span>
                        {t("coop.cards_blocked", {
                            name: characterName(getCharacter(runCharacter)),
                        })}
                    </span>
                    <button
                        className="ui-button ui-button-small"
                        onClick={() => setNeedsFor(runCharacter)}
                    >
                        {t("cards.needs.open")}
                    </button>
                </div>
            )}
            {ui.coop.error && <div className="ui-coop-error">{tl(ui.coop.error)}</div>}
            {isHost && !everyoneReady && (
                <div className="ui-coop-start-hint">{t("coop.waiting_ready")}</div>
            )}
        </>
    );
    const leave = (
        <>
            <button className="ui-button" onClick={() => client.leaveRoom()}>
                {t("coop.leave")}
            </button>
            {isHost && (
                <button className="ui-button" title={t("coop.disband_hint")} onClick={disband}>
                    {t("coop.disband")}
                </button>
            )}
        </>
    );
    // The host's switches for how the map's played
    const modes = (
        <>
            {isHost && map.tombs && (
                // The Tombs go by the host's invocations instead of endless and hard mode
                <InvocationsButton ui={ui} onOpen={() => setBoard(true)} />
            )}
            {isHost && runBoard && (
                <RunInvocationsButton
                    ui={ui}
                    room={{ mapId: map.id, hard: room.hard }}
                    onOpen={() => setBoard(true)}
                />
            )}
            {isHost && !map.fun && !map.tombs && (
                <div
                    className={
                        "ui-endless" +
                        (isEndlessUnlocked(ui.save, map.id) ? "" : " ui-endless-locked")
                    }
                >
                    <span className="ui-endless-name">{t("coop.endless")}</span>
                    {!isEndlessUnlocked(ui.save, map.id) ? (
                        <span className="ui-endless-hint">{t("coop.beat_the_map")}</span>
                    ) : !room.endless && withoutEndless ? (
                        // It can be turned off, but only on once everyone's beaten it
                        <span className="ui-endless-hint">
                            {t("coop.member_hasnt_beaten", { name: withoutEndless.name })}
                        </span>
                    ) : (
                        <Toggle
                            on={room.endless}
                            label={t("coop.endless")}
                            onToggle={() => client.toggleEndless()}
                        />
                    )}
                </div>
            )}
            {isHost && !map.tombs && (
                <div
                    className={
                        "ui-endless" + (isHardUnlocked(ui.save, map.id) ? "" : " ui-endless-locked")
                    }
                >
                    <span className="ui-endless-name">{t("coop.hard")}</span>
                    {!isHardUnlocked(ui.save, map.id) ? (
                        <span className="ui-endless-hint">{t("coop.beat_the_map")}</span>
                    ) : !room.hard && withoutHard ? (
                        // It can be turned off, but only on once everyone's beaten it
                        <span className="ui-endless-hint">
                            {t("coop.member_hasnt_beaten", { name: withoutHard.name })}
                        </span>
                    ) : (
                        <Toggle
                            on={room.hard}
                            label={t("coop.hard")}
                            onToggle={() => client.toggleHard()}
                        />
                    )}
                </div>
            )}
        </>
    );
    const ready = (
        <>
            <button
                className={
                    "ui-button ui-coop-ready" +
                    (isHost ? "" : " ui-select-go") +
                    (me?.ready ? "" : " ui-button-go")
                }
                // A Cards only room without the cards it takes (cardBlocked): not ready
                disabled={!me?.ready && cardBlocked}
                onClick={() => client.setCoopReady(!me?.ready)}
            >
                {me?.ready ? t("coop.not_ready") : t("coop.ready")}
            </button>
            {isHost && (
                <button
                    className="ui-button ui-button-go ui-select-go"
                    disabled={!everyoneReady}
                    title={everyoneReady ? undefined : t("coop.waiting_ready")}
                    onClick={() => client.startCoopRun()}
                >
                    {room.hard
                        ? t("coop.start_hard", { map: tl(map.name) })
                        : t("coop.start", { map: tl(map.name) })}
                </button>
            )}
        </>
    );
    const overlays = (
        <>
            {board && isHost && map.tombs && (
                <InvocationBoard ui={ui} client={client} onClose={() => setBoard(false)} />
            )}
            {board && isHost && runBoard && (
                <RunInvocationBoard
                    ui={ui}
                    client={client}
                    room={{ mapId: map.id, hard: room.hard }}
                    onClose={() => setBoard(false)}
                />
            )}
            {confirmDialog}
            {needsFor && (
                <CardNeedsWindow
                    save={cardsSave}
                    characterId={needsFor}
                    client={client}
                    onClose={() => setNeedsFor(undefined)}
                />
            )}
        </>
    );
    if (!phone) {
        return (
            <div className="ui-fill ui-select">
                <AdventurerPanel
                    ui={ui}
                    client={client}
                    fixed={getMapCharacter(map)}
                    cardsOnly={cardsOnly}
                    tabLocked={!isHost}
                    onCardNeeds={setNeedsFor}
                />
                <div className="ui-panel rs-border rs-background ui-select-panel ui-select-maps ui-coop-party">
                    {party}
                    {mapHeading}
                    {isHost ? mapList : <div className="ui-select-details">{mapSummary}</div>}
                    {notes}
                </div>
                <div className="ui-panel rs-border rs-background ui-select-bar ui-coop-bar">
                    {leave}
                    {modes}
                    {ready}
                </div>
                {overlays}
            </div>
        );
    }
    if (picking === "adventurer") {
        return (
            <div className="ui-fill ui-phone-picker">
                <AdventurerPanel
                    ui={ui}
                    client={client}
                    fixed={getMapCharacter(map)}
                    cardsOnly={cardsOnly}
                    tabLocked={!isHost}
                    onCardNeeds={setNeedsFor}
                    onDone={closePicker}
                />
                {overlays}
            </div>
        );
    }
    if (picking === "map") {
        // The list, with what's picked and the host's switches for it beside
        return (
            <div className="ui-fill ui-phone-picker">
                <div className="ui-panel rs-border rs-background ui-select-panel ui-coop-map-picker">
                    <PickerHeading
                        heading={
                            <h2 className="ui-select-heading">
                                {t("coop.map")}
                                <span className="ui-select-count">{t("coop.host_picks")}</span>
                            </h2>
                        }
                        onDone={closePicker}
                    />
                    {mapList}
                    <div className="ui-coop-map-side">
                        <div className="ui-select-details">{mapSummary}</div>
                        {modes}
                    </div>
                </div>
                {overlays}
            </div>
        );
    }
    // A phone's room: the party beside the map and your adventurer, each a tap from its list
    const mapLabel = (
        <span className="ui-phone-card-label">
            {t("coop.map")}
            <span className="ui-phone-change">
                {isHost ? t("ui.select.change") : t("coop.picked_by_host")}
            </span>
        </span>
    );
    return (
        <div className="ui-fill ui-select ui-coop-phone">
            <div className="ui-panel rs-border rs-background ui-select-panel ui-coop-party">
                {party}
                {notes}
            </div>
            <div className="ui-coop-phone-side">
                {isHost ? (
                    <button
                        className="ui-card ui-phone-card ui-phone-map"
                        aria-label={t("ui.select.change_map", { map: tl(map.name) })}
                        onClick={() => setPicker("map")}
                    >
                        {mapLabel}
                        {mapSummary}
                    </button>
                ) : (
                    <div className="ui-card ui-phone-card ui-phone-map ui-phone-card-static">
                        {mapLabel}
                        {mapSummary}
                    </div>
                )}
                <PhoneAdventurerCard ui={ui} map={map} onOpen={() => setPicker("adventurer")} />
            </div>
            <div className="ui-panel rs-border rs-background ui-select-bar ui-coop-bar">
                {leave}
                {ready}
            </div>
            {overlays}
        </div>
    );
}

// The rest of the party in a run: their adventurer and hitpoints, or that
// they're down or gone
export const PartyFrames = memo(function PartyFrames({
    party,
}: {
    party: TeammateView[];
}): JSX.Element {
    useLang();
    return (
        <div className="ui-party">
            {party.map((member, i) => (
                <div
                    key={i}
                    className={
                        "ui-party-member rs-border rs-background" +
                        (member.left || (member.down && !member.revivable)
                            ? " ui-party-left"
                            : "") +
                        (member.immune ? " ui-party-immune" : "")
                    }
                >
                    <ItemIcon
                        objId={getStartingWeaponIcon(getCharacter(member.characterId))}
                        size={24}
                    />
                    <div className="ui-party-body">
                        <div className="ui-party-name">{member.name}</div>
                        {member.left ? (
                            <div className="ui-party-note">{t("coop.left_the_game")}</div>
                        ) : member.down && member.reviveProgress > 0 ? (
                            <div className="ui-party-bar ui-party-revive">
                                <div
                                    className="ui-party-fill"
                                    style={{ width: `${member.reviveProgress * 100}%` }}
                                />
                                <span>{t("coop.reviving")}</span>
                            </div>
                        ) : member.down ? (
                            <div className="ui-party-note">
                                {member.revivable ? t("coop.down_revivable") : t("coop.down")}
                            </div>
                        ) : (
                            <div className="ui-party-bar">
                                <div
                                    className="ui-party-fill"
                                    style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
                                />
                                <span>
                                    {t("coop.hp", {
                                        hp: fmtNum(member.hp),
                                        max: fmtNum(member.maxHp),
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
});

// Co-op: you're down and can be revived, someone's reviving you, or you're
// reviving a teammate
export function ReviveNote({ revive }: { revive: ReviveView }): JSX.Element {
    useLang();
    const left = tp("toast.revives_left", revive.revivesLeft);
    let text: string;
    if (revive.reviving) {
        text = t("coop.reviving_player", { name: revive.name ?? "" });
    } else if (revive.name) {
        text = t("coop.player_reviving_you", { name: revive.name });
    } else {
        text = t("coop.you_down_note", { left });
    }
    return (
        <div className="ui-revive rs-border rs-background">
            <div>{text}</div>
            {revive.progress > 0 && (
                <div className="ui-party-bar ui-party-revive ui-revive-bar">
                    <div className="ui-party-fill" style={{ width: `${revive.progress * 100}%` }} />
                </div>
            )}
        </div>
    );
}

// The run waits for everyone's level up and casket
export function WaitingNote({ names }: { names: string[] }): JSX.Element {
    useLang();
    return (
        <div className="ui-waiting rs-border rs-background">
            {t("coop.waiting_for", { names: list(names) })}
        </div>
    );
}
