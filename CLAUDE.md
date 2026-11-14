# Run Escape

A Vampire Survivors-style browser game set in the real Old School RuneScape world. Everything on
screen comes from the OSRS game cache. It's built on
[rs-map-viewer](https://github.com/dennisdev/rs-map-viewer), so `src/rs/` and `src/mapviewer/` are
the viewer's cache and rendering code, and `src/game/` is the game.

The repository and the localStorage keys still say RuneSurvivors or `rune-survivors-*`. The game is
called Run Escape. **Never rename those keys**: players' saves live under them.

## Keep these files up to date

**After every change, check whether this file, `.claude/rules/`, `README.md` and `docs/` still say
what's true, and update them in the same pull request.** That covers new systems, moved files,
changed commands and anything an agent would otherwise get wrong. Leave out counts and numbers that
go stale. Add anything that cost you time to work out.

## Where things are

| Looking for                                            | Go to                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| How the code is laid out, scripts, URL flags, hosting  | `docs/DEVELOPMENT.md`                                                  |
| The Windows app, its game updates, releases            | `docs/DEVELOPMENT.md`, Desktop                                         |
| The Android app, its bundled game and release signing  | `android/`, `scripts/android/`, `docs/DEVELOPMENT.md`, Android         |
| The app's main process and update code                 | `desktop/`                                                             |
| The app keeping to the website's build                 | `desktop/siteUpdate.ts`, `docs/DEVELOPMENT.md` (Following the website) |
| The Android app keeping to it, and serving it          | `android/.../SiteGames.java`, `SiteUpdater.java`, `GamePathHandler`    |
| The release workflow                                   | `.github/workflows/release.yml`                                        |
| The checks on a pull request                           | `.github/workflows/check.yml`                                          |
| What review looks for, before you open a pull request  | `docs/PR-REVIEW.md`                                                    |
| What's in the game, map by map                         | `docs/GAMEPLAY.md`                                                     |
| Getting it running, controls, cache version            | `README.md`                                                            |
| What changed in each version                           | `CHANGELOG.md`                                                         |
| How to add a weapon, enemy, map and so on              | `.claude/rules/adding-content.md`                                      |
| Languages, and the text in each one                    | `src/game/i18n/`, its `locales/<lang>/*.json`                          |
| Weapons, enemies, items, maps, shop (plain data)       | `src/game/content/`                                                    |
| Weapon damage controls                                 | `docs/BALANCE.md`                                                      |
| The game itself: tick, combat, spawning, levels        | `src/game/core/Sim.ts`                                                 |
| Level up choices, and when a weapon can evolve         | `src/game/core/Upgrades.ts`                                            |
| Evolution recipes, for the UI                          | `src/game/content/evolutions.ts`                                       |
| Hard mode's numbers (each map's are on its `MapDef`)   | `src/game/content/hard.ts`                                             |
| A run's invocations, hard mode's preset, coin bonuses  | `content/invocations.ts` (`RUN_SET`), `maps.ts` (`takesInvocations`)   |
| Relics: tiers, picks, each one's rule on its hero      | `content/relics.ts`, `Sim.ts` (Relics), `ui/Relics.tsx`                |
| Co-op's numbers: the party's scaling, boss copies      | `src/game/content/coop.ts`                                             |
| Caskets and the inventory                              | `src/game/core/Loot.ts`                                                |
| Phosani's Nightmare, the one-fight map (its arena too) | `src/game/content/phosani.ts`, `scaperune/maps/sisterhoodSanctuary.ts` |
| Her fight: its design and playtest record              | `docs/design/phosanis-nightmare.md`                                    |
| Thanksgiving Harvest: its enemies, turkeys, the Avian  | `content/thanksgivingenemies.ts`, `TurkeyDay.ts`, `characters.ts`      |
| Justiciar Zachariah, the Owl's Court (and its arena)   | `src/game/content/zachariah.ts`, `scaperune/maps/owlsCourt.ts`         |
| His fight's design and its numbers                     | `docs/design/justiciar-zachariah.md`                                   |
| Yama's generals in Varrock, and its demon hordes       | `content/xarth.ts`, `kril.ts`, `varrockHordes.ts`                      |
| The generals' design and what the bot found            | `docs/design/varrock-generals.md`                                      |
| The Battle for Varrock: burnt Varrock, to explore      | `content/fun/maps.ts`, `scaperune/maps/battleForVarrock.ts`            |
| A map's opening cinematic (`MapDef.cinematic`)         | `client/Cinematic.ts`, `CinematicView.ts`, `vardhelmOpening.ts`        |
| A boss's cinematic as it wakes (`LairDef.opening`)     | `fun/yamaWakes.ts`, `Sim.stepLair`, `GameClient.startLairOpening`      |
| A lair's seal going out (`requires.unsealing`)         | `fun/palaceUnsealed.ts`, `Sim.stepLockedLair`, `drawLairSeal`          |
| A map's objective on the HUD (`MapDef.objectives`)     | `GameClient.getObjectiveView`, `GameUi.tsx` (`BossBar`)                |
| The shot editor for cinematics (`?director=<map id>`)  | `client/CinematicDirector.ts`, `ui/DirectorPanel.tsx`                  |
| Recording a cinematic as a trailer MP4 (ffmpeg)        | `client/TrailerRecorder.ts`, `scripts/dev/trailer-server.ts`           |
| Yama's fight in burnt Varrock, and its design          | `content/yama.ts`, `docs/design/yama.md`                               |
| Bosses asleep on a map to walk round (`MapDef.lairs`)  | `Sim.stepLair`, `docs/DEVELOPMENT.md` (A hero of their own)            |
| Burning a real place to ruins (any town)               | `src/game/scaperune/ruins.ts`, `rs/config/loctype/LocOverrides.ts`     |
| Zachariah as the player: his model and his buttons     | `src/game/content/justiciarKit.ts`, `Sim.useKitAbility`                |
| Blessings in place of items, level by level (Varrock)  | `content/blessings.ts`, `Sim.bless`, `client/BlessingViews.ts`         |
| A floor that rises and falls away (the Wardens')       | `core/ArenaFloor.ts`, `content/wardensFloor.ts`, `client/FloorView.ts` |
| Act II: its maps, steps and its tab on the map screen  | `content/acts.ts`, `ui/GameUi.tsx` (`ActPage`)                         |
| An act still to come, hidden (`ActDef.released`)       | `content/acts.ts` (`isActOut`), `content/maps.ts` (`isCharacterOut`)   |
| A map's rule (`MapDef.rule`), roots, how they're drawn | `core/rules/`, `client/RootsView.ts`                                   |
| The Stranglewood: its enemies, bosses, roots, arena    | `content/stranglewood.ts`, `scaperune/maps/stranglewood.ts`            |
| The Lassar Undercity: its enemies, bosses, the realm   | `content/lassar.ts`, `scaperune/maps/lassarUndercity.ts`               |
| A map of two worlds (the realm), its twin on screen    | `core/rules/RealmRule.ts`, `Sim.turnWorld`, `MapManager.twin`          |
| Ghorrock: its enemies, bosses, the yard and its cold   | `content/ghorrock.ts`, `scaperune/maps/ghorrock.ts`                    |
| The cold: braziers, embers, vents, each player's cold  | `core/rules/ColdRule.ts`, `Sim.stepCold`, `GameView.drawCold`          |
| The effect mask: tile effects on any map (ice)         | `core/world/EffectMask.ts`                                             |
| The Scar: its enemies, bosses, the drained sea         | `content/scar.ts`, `scaperune/maps/scar.ts`                            |
| A dimmed light, the only light, a boss's debris        | `PlayerEffectDef` dim, `EnemyDef.onlyLight`, `BossAttackDef.debris`    |
| Remixes: Act II rules on older maps, stacked, records  | `content/remixes.ts`, `core/rules/remix.ts`, `RuleSet` in `RunRule.ts` |
| The Soulreaper axe: souls, Harvest, its pieces         | `WeaponDef.souls`, `Sim.harvest`, `UnlockTask` pieces                  |
| Adventurers' traits (Timber!, Shatter and the rest)    | `CharacterDef.trait` in `content/types.ts`, `fellTree` in `Sim.ts`     |
| Awakened Vardorvis: his fight, Chop, his captors       | `content/vardorvis.ts`, `docs/design/awakened-vardorvis.md`            |
| The Awakened Whisperer: Blackstone, siphon, screech    | `content/whisperer.ts`, `docs/design/awakened-whisperer.md`            |
| Awakened Duke Sucellus: his room, Kindle, the cold     | `content/duke.ts`, `scaperune/maps/dukesRoom.ts`, `awakened-duke.md`   |
| The Awakened Leviathan: Shadow, the wreck, the torrent | `content/leviathan.ts`, `docs/design/awakened-leviathan.md`            |
| Fighting pets (Butch, the Wisp, Baron, Lil'viathan)    | `PetDef.power` in `content/pets.ts`, `Sim.stepPets`                    |
| An act's ending: told once, its card, the save         | `ActDef.ending`, `takeActEnding` in `save.ts`, `ActEndingModal`        |
| The Forgotten Four gauntlet: climb, camp, records      | `content/gauntlet.ts`, `core/gauntlet.ts`, `ui/Gauntlet.tsx`           |
| Awakened invasions: who invades, their pockets         | `content/invasions.ts`, `invaders.ts`, `core/rules/invasion.ts`        |
| Awakener's orbs on a final boss, the weekly Vault      | `AWAKENED` in `Sim.ts`, `canAwaken`, `vault.ts`, `ui/Vault.tsx`        |
| A floor's preview page and checks (`?floorpreview`)    | `ui/FloorPreview.tsx`, `core/floorLint.ts`                             |
| How deep or high a map can go, and backdrop recipes    | `docs/design/map-depth.md`                                             |
| Act II, the Fallen Empire: the campaign's design       | `docs/design/act-2-fallen-empire.md`                                   |
| Lights, the dark, aiming at what's lit, lanterns       | `docs/DEVELOPMENT.md`, Lights; `content/lights.ts`, `SceneLights.ts`   |
| NPCs standing on a map as scenery (`MapDef.props`)     | `GameView.drawProp`, `GameAssets.loadProps`, `docs/DEVELOPMENT.md`     |
| Random events: who turns up, what they do              | `src/game/content/randomEvents.ts`                                     |
| Pets: which trophies follow you, and how               | `src/game/content/pets.ts`, `client/PetFollowers.ts`                   |
| The Wardrobe: body, outfit, its store of pieces        | `content/wardrobe.ts`, `ui/WardrobeScreen.tsx`, `docs/DEVELOPMENT.md`  |
| The store's pieces and kits, from the cache            | `scripts/cache/cosmetics.ts` (writes `content/cosmeticItems.ts`)       |
| Collection log drops, sources and map rewards          | `src/game/content/trophies.ts`, `src/game/core/Sim.ts`                 |
| The Collection log's tabs, entries and its screen      | `content/collectionLog.ts`, `ui/CollectionLogScreen.tsx`               |
| A cape's emblem and other decals behind their cloth    | `src/rs/model/player/liftDecals.ts`, `docs/DEVELOPMENT.md`             |
| A player in layers: a cape over armour poking through  | `actor/actor.vert.glsl` (`seenFromBehind`), `docs/DEVELOPMENT.md`      |
| Wooden bases under Karamja's blocking jungle plants    | `src/mapviewer/webgl/loc/PlantBarriers.ts`                             |
| Save data and migrations                               | `src/game/core/save.ts`                                                |
| One tab saving, newer saves, unreadable ones           | `docs/DEVELOPMENT.md`, Saves                                           |
| The title's reminder to export the save                | `src/game/ui/exportReminder.ts`, `docs/DEVELOPMENT.md` Saves           |
| Cloud save in the game: syncing, the choice, Settings  | `client/CloudSave.ts`, `ui/CloudSave.tsx`, `docs/DEVELOPMENT.md` Saves |
| Run flow, camera, input, the HUD's data                | `src/game/client/GameClient.ts`                                        |
| The damage panel: each weapon's DPS during a run       | `src/game/client/DamageMeter.ts`                                       |
| 3D actors, swooshes, hitsplats                         | `src/game/client/GameView.ts`                                          |
| Actors' frames, baked as positions on a shared mesh    | `actor/ActorBakeFrames.ts`, `actor.vert.glsl`, `check-actor-frames.ts` |
| Touch screens: the stick, its buttons, phone layouts   | `docs/DEVELOPMENT.md`, Touch screens                                   |
| A phone's run setup and co-op room: cards, whole lists | `GameUi.tsx` (`PhoneSetup`), `CoopScreen.tsx`, `ui/usePhoneLayout.ts`  |
| Controllers: which pad, its buttons, menus' highlight  | `docs/DEVELOPMENT.md`, Controllers                                     |
| The game on a phone's home screen (PWA)                | `docs/DEVELOPMENT.md`, Touch screens                                   |
| React screens and the HUD                              | `src/game/ui/GameUi.tsx`                                               |
| Hover and hold descriptions: HUD, bag, Armoury         | `src/game/ui/DescriptionButton.tsx`                                    |
| The Armoury's Weapons and Passives tabs                | `src/game/ui/LoadoutCatalogue.tsx`                                     |
| Menus' Esc and Enter, windows' focus, confirmations    | `ui/menuKeys.ts`, `ui/useDialog.ts`, `ui/ConfirmDialog.tsx`            |
| Weapon stat lines on cards, pause and tooltips         | `src/game/content/weaponStats.ts`                                      |
| The icon beside each stat line, in any language        | `content/statIcons.ts`, `ui/StatLine.tsx`, `StatText` in `stats.ts`    |
| How the player stands and runs with each weapon        | `src/game/content/stances.ts`                                          |
| Stat names and types                                   | `src/game/content/stats.ts`, `types.ts`                                |
| Balance bot                                            | `scripts/game/simulate-run.ts`                                         |
| How both bots read a boss's shapes                     | `scripts/game/bossReads.ts`                                            |
| Weapon attack benchmark                                | `scripts/game/measure-weapon-dps.ts`                                   |
| Co-op: how it works, hosting its relay                 | `docs/DEVELOPMENT.md` (Co-op)                                          |
| Co-op relay server                                     | `server/coop-relay.mjs`                                                |
| The relays' checks on a run's frames                   | `server/coop-checks.mjs`                                               |
| The relays' rows in the collector, for runs they flag  | `server/analytics/README.md` (Run checks)                              |
| The same relay on Cloudflare, and its setup            | `server/cloudflare/`                                                   |
| Run stats: a run's report, its collector, the viewer   | `client/RunAnalytics.ts`, `server/analytics/`                          |
| Cloud saves' Worker: sync codes, revisions, backups    | `server/cloud-saves/`                                                  |
| Co-op lockstep and rooms; the lobby UI                 | `src/game/client/coop/`, `ui/CoopScreen`                               |
| Co-op flags: where players are from                    | `docs/DEVELOPMENT.md` (Co-op, Flags)                                   |
| Finding ids in the cache                               | `scripts/cache/`                                                       |
| Moving to a newer cache, and what changed in it        | `docs/DEVELOPMENT.md` (A newer cache), `compare-caches.ts`             |
| The slim cache's chunks, and how the game loads them   | `src/rs/cache/ChunkedCache.ts`, `docs/DEVELOPMENT.md` (Hosting)        |
| The full cache's download: parts, resuming, keeping it | `src/rs/cache/CacheFiles.ts`, `docs/DEVELOPMENT.md` (Hosting)          |
| What the slim cache loads, and what it reuses          | `scripts/cache/slim-plan.ts`, `docs/DEVELOPMENT.md` (Hosting)          |
| ScapeRune: making maps that aren't in OSRS             | `src/game/scaperune/CLAUDE.md`                                         |
| Raids: rooms, points, chests, teleporters, expert      | `src/game/content/raids.ts`                                            |
| The Theatre of Blood's bosses                          | `src/game/content/theatre.ts`                                          |
| The Tombs of Amascut (a raid, behind its quest)        | `docs/design/tombs-of-amascut.md`, `content/invocations.ts`            |
| The Tombs' bot, and its sim of puzzle rooms and bosses | `scripts/game/tombsBot.ts`, `scripts/game/simulate-tombs.ts`           |
| The Scabaras room's puzzle helper, and what unlocks it | `content/scabarasHelper.ts`, `GameView.drawScabarasHelper`             |
| Beneath Cursed Sands, the Tombs' quest (a boss fight)  | `content/cursedSands.ts`, `scaperune/maps/cursedSandsEntrances.ts`     |
| Its fights' design: four parts, each kept once won     | `docs/design/beneath-cursed-sands.md`                                  |
| What a frame costs, and what's culled                  | `docs/DEVELOPMENT.md`, `scripts/dev/`                                  |
| Which enemies are baked when (the Tombs room by room)  | `content/mapEnemies.ts`, `GameAssets.loadEnemies`, `npcLooks.ts`       |
| Frame cap, lost graphics, the HUD's two stores         | `docs/DEVELOPMENT.md`, Keeping it light                                |

`src/game/core/` has no DOM or rendering. The UI reads from `GameClient` and `GameStore`, and never
changes the sim directly.

Co-op guests can predict movement, only for display (`client/coop/MovementPrediction.ts` and
`PlayerPose.ts`). It's on by default, but a player can turn `movePrediction` off in
`DisplaySettings`, so a guest's `CoopRun.prediction` can be undefined. Keep predicted positions
out of `Sim` and its hashes. Movement sequence echoes are acknowledged when their host frame is
applied; preserve them when coalescing queued moves. Movement rules shared by simulation and
prediction live in `core/PlayerMovement.ts`. Keep the delayed-network tests in
`MovementPrediction.test.ts` covering corrections, fallbacks, changes to movement, stalls and
resends, and the camera's steadiness (an echo of an unchanged move mustn't re-time the picture).
Stops bypass the move throttle; an axis starting, stopping or reversing (east to northeast too)
spends bounded send credits. Keep inputs pending before the first host frame, until their real
echoes arrive, but keep the prediction's clock moving meanwhile. Keep the rapid-input
tests below the relay's input limit. `?movementDiagnostics` opts into local prediction counters
and a bounded sample buffer (see Development, Measuring prediction); don't log or allocate per
frame for diagnostics, or treat input-to-confirmation time as network ping.

## Commands

```sh
bun install --frozen-lockfile
bun run download-caches    # the game's cache, into caches/
bun run start              # dev server on http://localhost:5173, with co-op's relay
bun run start:singleplayer # the same without it (or MULTIPLAYER=off): no Multiplayer button
bun run test               # vitest
bun run test:maps          # ScapeRune's tests with its long map checks (needs the cache)
bun run tsc --noEmit -p .  # type check
bun run prettier --write <files>
bun run build && bun run slim-cache    # build for hosting (only when deploying)
bun run serve              # serve the build, co-op's relay too (serve:singleplayer without)
bun run desktop            # the Windows app, on that build
bun run desktop:dist       # the app's zip, game zip and manifest, into release/
bun run tsx scripts/android/prepare-game.ts --dist dist  # that build, into the Android app
cd android && ./gradlew test assembleDebug     # the Android app (Java 21 and Android SDK 36)
```

There's no pre-commit hook, so run Prettier yourself. `bun run lint` formats the whole repository.

## After every change

1. Run the tests and the type check, and format what you changed. After a change to ScapeRune, a
   map, collision, how a map's scenery loads or the cache, run `bun run test:maps` too (which
   folders count is in `docs/PR-REVIEW.md`).
2. **Run a simulation if the change can affect gameplay or balance** (see below).
3. **If you added anything from the cache** (an item, enemy, map, animation or sprite), say so in the
   pull request. Leave `bun run slim-cache` for deployment, after every build. It takes time and
   memory, and a deployed game won't load a slim cache made for another build: it says so.
4. Try UI and visual changes in the browser. Tests don't cover how things look.
5. Note the change in `CHANGELOG.md` under Unreleased.
6. Update the docs (see [Keep these files up to date](#keep-these-files-up-to-date)).

## Simulations

Run `scripts/game/simulate-run.ts` after any change to weapons, passives, gear, enemies, waves,
bosses, maps, XP, the shop, the Armoury, or combat in `Sim.ts`. Put the before and after numbers in
the pull request. If a sim wasn't run, say so there.

```sh
bun run tsx scripts/game/simulate-run.ts wizard 3                # one adventurer, 3 seeds
MAP=barrows bun run tsx scripts/game/simulate-run.ts "" 3        # everyone on one map, 3 seeds
# everything bought
MAP=morytania META=max ARMOURY=max bun run tsx scripts/game/simulate-run.ts "" 3
ENDLESS=1 bun run tsx scripts/game/simulate-run.ts wizard 3      # endless mode
# hard mode
HARD=1 MAP=barrows META=max ARMOURY=max bun run tsx scripts/game/simulate-run.ts wizard 3
WEAPON=crystal_bow bun run tsx scripts/game/simulate-run.ts ranger 3    # one weapon
PARTY=4 MAP=barrows META=max ARMOURY=max bun run tsx scripts/game/simulate-run.ts "" 3    # co-op
```

- **Use at least 3 seeds.** A single seed can move a whole group's results by a lot with no real
  change behind it, and any code change sends the RNG down a new path.
- **Compare like with like**: the same adventurers, maps, seeds and `META`/`ARMOURY` settings, on
  the old and new code. `META=max` buys every shop upgrade, so a new one changes those results.
- **Run every map that's affected**, not only Lumbridge. A change can help one map and hurt another.
- For a change to one combat style, compare all three styles, so you can see the gap between them.
- For a change to co-op's balance (`content/balance.ts`, `content/coop.ts`, or anything a party does differently), run
  `PARTY=2` and `PARTY=4` too. The bot plays each player on their own, with no teamwork.
- For hard mode's numbers, compare `HARD=1` with normal on the same seeds, and use at least 6 seeds:
  with 3, a lower multiplier can come out harder. Go by wins as well as how long runs last: the bot
  can't win on some maps even on normal, and on early maps it lasts until the final boss either way.
- The bot is simple. It doesn't play strike-based adventurers well, so don't judge those from a sim.
  Treat its numbers as a comparison, not as how a player would do.
- Each run's line says how long the bot was `stuck`: pressing on without moving, against a wall
  or held by a boss. A lot of it means the bot can't get round that map, not that the map is hard.
- Without `DODGE=1` the bot ignores the bullets, rings and marks of a boss without phases (the
  Theatre's): sim a change to those with it.
- With `DODGE=1` the bot steps out of a windup the tick it starts, so a shorter warning costs it
  next to nothing. Sim a boss fight's warnings with `REACT=0.25` too, each step taken a quarter of
  a second late, as a person reacts: the Awakened fights' hardening left the bot 1 win in 25, and
  none at all with it. A boss fight's hundreds of seeds can be split across processes with `FROM=`.
- Runs are CPU heavy, and full sweeps can take a while. Run them in the background, and don't edit
  `src/` in the same checkout meanwhile, since each run reads the source when it starts.
- **Run sweeps as one process per map.** The script already loops over adventurers and seeds, so
  use `MAP=x ... "" 3` rather than a process per run.
- Sims don't need the game cache after the first run on a map: `scripts/game/collision-snapshot.ts`
  saves that map's collision to `caches/collision/` (gitignored). A snapshot rebuilds by itself when
  the arena, `RegionDataLoader.ts` or `SceneBuilder.ts` changes. If you change collision anywhere
  else, delete that folder. ScapeRune's dev maps don't get one: they're built each time, from their
  recipes.

The Tombs of Amascut has a sim of its own, `scripts/game/simulate-tombs.ts`: a puzzle
room, a boss, the Wardens or the whole raid (`ROOM=scabaras`, `ROOM=zebak`, `ROOM=raid`), with what
each puzzle room came to (mirrors turned, boards, trips and spills) and what hurt. Run it after any
change to the raid, at a path level or two (`LEVEL=2`), with invocations and with `PARTY=2`.
Without `KIT=max` it plays the raid up to the room asked for, as a run would get there. For the
difficulty curve, `scripts/game/sweep-tombs.sh` runs rooms by raid level (`INVOCATIONS=level:N`)
and kit; it's slow, so run it in the background.

After a content change, also run the checks that apply:

```sh
bun run tsx scripts/cache/check-items.ts          # casket items are the items they're named after
bun run tsx scripts/cache/check-fun-outfits.ts    # fun map outfits are what they're named
bun run tsx scripts/cache/sprites.ts check        # the game's interface sprites are in the cache
bun run tsx scripts/cache/validate-decoders.ts    # after touching a decoder or changing the cache
bun run tsx scripts/game/check-lairs.ts           # every lair's boss has room where it rises
```

## Tests on the release build

`.github/workflows/check.yml` runs the type check and `bun run test` on every pull request, without
the game's cache. The release workflow runs the tests with it, and a failure there stops the
desktop build.

- **It runs everything, on a busy machine.** It has the game's cache and sets `MAP_CHECKS=1`, so
  `generator.test.ts` runs its long map checks too. A test that takes a few seconds on your machine can pass the 5 second limit
  there, so give a long one its own timeout.
- **"Exit code 1" with no failed test named** means an error with no stack in our code, which
  vitest's annotations leave out. `Timeout calling "onTaskUpdate"` is one: a worker went a minute
  without a turn of the event loop. `src/setupTests.ts` yields between tests so that a long file
  doesn't, which leaves only a single test blocking for that long.
- **`server/coop-relay.test.ts` needs Node 22's `WebSocket`**, as the workflow has. On Node 21, run
  with `NODE_OPTIONS=--experimental-websocket`.

## The Android app

- **Never change its application ID (`io.jere.run_escape`) or its page's address**
  (`https://appassets.androidplatform.net/assets/game/`): Android players' saves belong to them. An
  ID can't have a hyphen.
- **It's only published on GitHub's releases.** `AppUpdater.java` checks once on open and prompts
  for a newer APK; Android handles the download and installation consent. A failed check must
  never block the bundled game, and installing is always asked, never started by itself (it closes
  the game mid-run). What it remembers between launches is `UpdatePlan.java`'s, which has tests
  that need no device. See `docs/DEVELOPMENT.md`, Android, for the update flow.
- **It keeps to the website's build**, when built with `-PgameSiteUrl` (`GAME_SITE_URL`), as the
  Windows app does: `SiteUpdater.java` downloads it into `filesDir/site/<build>` off the UI thread,
  on Wi-Fi only, and it's played when the game next starts over (the menu's Restart game, or
  opening the app), never mid-run. `GamePathHandler.java` serves `/assets/game/` from that folder,
  or the APK for the chunks it has, at the same address. What needs no device is in
  `SiteFiles.java` (the same checks as `desktop/siteFiles.ts`: change one, change the other, and
  put their cases in `desktop/siteFiles.cases.json`, which both run) and `SiteGames.java`, with
  tests. It never follows a website older than the APK's own version, or one whose `minAndroid` is
  newer. See `docs/DEVELOPMENT.md`, Following the website on Android.
- It packs the same game zip as the Windows app, so their co-op build ids match.
  `scripts/android/prepare-game.ts` checks the slim cache the way `desktop/release-files.ts` does:
  change one, change the other.
- The bundled game lets out only what the desktop app does (`RelayPolicy.java`,
  `desktop/gameServer.ts`): the relay, the run collector, and the cloud-save Worker's `/v1/`. A
  new address the game reaches needs adding to both. The updater's requests to GitHub are the
  app's own, like the desktop launcher's.
- Its generated game files, APKs and keys stay out of Git (`.gitignore`).
- Pull requests only compile it and run its unit tests (`.github/workflows/android.yml`), and
  there's no Android SDK here. Touch, co-op and airplane mode need a phone with a current WebView:
  a passing build isn't one. A change to the app alone needs no simulation.

## Testing in the browser

- Anything new on screen needs to work on a phone too: see Touch screens in `docs/DEVELOPMENT.md`.

- In dev, `window.game` is the `GameClient` and `window.game.sim` is the running `Sim`. From the
  console you can call `selectMap(id)`, `startRun()`, `sim.addWeapon(id)` or `sim.spawnBoss(...)`.
- `sim.equip(id)` wears a piece, and `sim.openCasket(tier)` opens a casket at once: set
  `sim.chests[0].itemId` to choose its item, with `upgradedFrom = undefined` and `upgrades = 0`
  (or the rolled item's stay), then call `game.syncOverlay()` (private, but callable there), or
  its window never shows (nothing in a run's tick asks for it).
- `?autostart=wizard` starts a run right away, `?stress=300` adds goblins, and F3 shows collision.
- `?devtools` shows the Tombs of Amascut's testing buttons (god mode, skip to boss, straight to
  any boss or the Wardens), and an act that isn't out yet (`ActDef.released`). Without it the
  dev server plays as players will, the tunnel included.
- `await frameProbe.sample(60)` gives a frame's triangles, draws and CPU time. Compare those rather
  than the frame rate: headless runs on a software rasterizer.
- Enemies are baked per map when a run starts, so an enemy from another map, spawned from the
  console, takes a moment to show up.
- Headless Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader`, and a persistent
  profile, or the cache won't fit in its storage quota. The cache can take a while to load.
- On Windows, keep that profile on a short path (a session's scratchpad is too long). Past 260
  characters the Cache API fails with `UnknownError: Failed to execute 'open' on 'CacheStorage'`.
- A small window isn't a phone: `Mobile.css` needs `(pointer: coarse)` too. Over DevTools,
  `Emulation.setTouchEmulationEnabled` only lasts as long as the session that set it, so keep that
  session open while you test.
- The desktop app's browser pane can stop drawing while it's hidden, and the game then sits at
  "Loading - 0%". Check that `requestAnimationFrame` fires before blaming the game.
- Effects like swooshes only last a moment, so a screenshot can easily miss them. Check game state
  as well, and don't report an effect as seen unless you saw it.
- A player kept invulnerable from the console (`player.invulnerable` over 30) blinks white every 5
  ticks, as after a hit, so a screenshot can catch them pale grey. Keep their hitpoints up instead.
- Don't serve the game from a git worktree with a symlinked `node_modules`. Vite refuses the files,
  and the failed load can leave a bad cache in the browser profile for that port.
- A slow first load after the dev server starts, or a page that reloads itself mid-load, is
  usually down to Vite's file watcher or its dependency scan: see Scripts in `docs/DEVELOPMENT.md`.

## Conventions

- **Show it with real assets, not coloured overlays.** Bosses, hazards, projectiles and effects use the
  game's own models, spot animations and objects, so a player can see what's happening from what's in the
  world. Look in the cache first. Reach for a colour overlay, a flat shape or a sprite only when nothing
  real can do the job, and then keep it small and say so in the pull request.
- **Pull requests**: work on a branch and open a pull request. Don't commit to `main`. Keep one
  topic in each pull request, unless asked to combine them.
- **Stage files by name**, not with `git add -A`. `.gitignore` has `caches/`, which only matches a
  folder, so a `caches` symlink gets committed.
- **Changelog**: written for players, in one-line bullets under Added, Changed or Fixed. Keep it
  short, and never mention secret content (like hidden bosses) in it or in map descriptions.
- **Comments**: short, and they say why or what something's for. Match what's around them.
- **Content** is plain data with real cache ids. Look ids up with the scripts, not from memory. OSRS
  names should be spelled as the cache spells them.
- **Languages: never translate.** Don't write text in any language but English unless the developer
  asks you to translate it. New and changed text goes in English only (in the code, or
  `locales/en/`), and other languages show the English until their translator adds theirs. When
  you change what an English text means, remove its key from the other languages' files rather
  than rewording them, and say so in the pull request. See Languages in `docs/DEVELOPMENT.md`.
- **Saves**: if `SaveData` changes shape, raise `SAVE_VERSION` and add a step to `migrateSave`.
  New shop upgrades, ids and optional fields don't need one, and nor does dropping an optional
  field that loading ignores. Write the save only through `GameClient.persist()`: it doesn't write
  while another tab has `SaveLock` or the save is from a newer game. Never rename the lock,
  `run-escape-save`, any more than the keys.
  Skills live in `skillPages` by combat style, with separate ranks and spending;
  each page can allocate `coins + max(page.upgradesSpent)`. Only the maximum investment is reserved;
  use `getSkillCoins(save, style)` for a page's balance. Always pass the intended style to skill
  operations and run loadouts.
  Prices come from `getPageCost` in `content/shop.ts`, which goes only by a page's ranks, so the
  same ranks cost the same in any order: a rank's price is what it adds to the page. Keep it that
  way (no price that depends on what was bought before). A single rank's refund gives back its
  share of `upgradesSpent`: what it adds today, times `upgradesSpent` over `getPageCost` (the two
  differ only on a page bought at other prices). A page's last rank gives back the rest.
- **Determinism**: the sim only uses its seeded `Rng`, never `Math.random`. Co-op runs the same sim
  on every player's browser, so in `src/game/core/` trigonometry goes through `fm` (`fm.sin`,
  `fm.cos`, `fm.atan2`, `fm.hypot`, `fm.acos`, `fm.pow`) from `core/fmath.ts`, never `Math`'s.
  `core/runHash.test.ts` pins seeded runs: a speed-up or tidy must leave them as they are.
- **Heroes**: `sim.player`, `sim.stats`, `sim.weapons` and the like are the current hero's (one for
  each co-op player). Anything a hero leaves behind (a projectile, a thrall) keeps a `hero` index.
  A solo run must play exactly as before; co-op's tests are in `core/coop.test.ts`.
- **Licence**: the cache belongs to Jagex and stays out of the repository.
- **The desktop app's address**: `GAME_ORIGIN`, the user data folder's name and `GAME_PARTITION` are
  where its players' saves are, so never change them. It can't use a custom scheme: the Cache API
  refuses one (see Desktop in `docs/DEVELOPMENT.md`).
- **`minLauncher`**: raise `LAUNCHER_VERSION` in `desktop/version.ts` only if the game can't run on
  launchers already out there. It makes every player download a new zip by hand.
- **`minAndroid`**: raise `MIN_ANDROID_APP` in `desktop/version.ts` when the game needs something
  from the Android app that apps already out there don't have (an address `RelayPolicy.java` lets
  out, a message the page sends the app). Older apps then play their APK's game, so deploy such a
  build to the website only after its APK's released.
