# Before you open a pull request

For contributors, and the agents they work with: what review looks for in a pull request to Run
Escape, drawn from the reviews of earlier ones. Go through it on your branch before you open the
PR. Most findings so far were a rule in [`CLAUDE.md`](../CLAUDE.md) being missed, so read that
first: it has the project's layout, commands, conventions and the checks to run after a change.

If your agent can review code (Claude Code's `/code-review`, for example), run it on your branch
against the release branch as well, then go through the list below.

## Branch and target

- **Pull requests are merged into the current release branch**, `release-<version>`, not `main`.
  Base your branch on the newest one and point the PR at it. If there isn't one, use `main`.
- **Bring in the release branch again** just before you open the PR, and whenever it moves. A
  branch cut before a release is where most changelog trouble comes from (see below).
- **One topic per PR.** If yours builds on another open PR, say so: review covers your own commits,
  and the other one needs reviewing and merging first.
- **Leave "Allow edits by maintainers" on**, so fixes from review can go onto your branch.

## Run the checks

All of these are in `CLAUDE.md`'s "After every change":

- `bun run test` and `bun run tsc --noEmit -p .`.
- **If you changed ScapeRune (`src/game/scaperune/`, `scripts/scaperune/`), a map, collision or
  how a map's scenery loads (`core/world/`, `RegionDataLoader.ts`, `SceneBuilder.ts`,
  `LocOverrides.ts`), or moved to a newer cache**, also `bun run test:maps` (it needs the game's
  cache). It runs ScapeRune's long map checks, which build the maps with all of those and which a
  plain `bun run test` leaves out. The release workflow runs them every time, and a failure there
  stops the release.
- **Prettier on the files you changed**: run `bun run prettier --write <files>` from the repository
  so it uses the project config. Don't format the whole repository, and exclude `CHANGELOG.md`
  (see below). An editor's formatter can reformat unrelated lines. On Windows, use
  `bun run prettier --check --end-of-line auto` to distinguish formatting changes from CRLF line
  endings.
- **A simulation** if the change can affect gameplay or balance, with before and after numbers.
- **A frame's cost** before and after, for anything drawn or run every tick (see Performance).
- **The browser** for anything on screen, **and a phone** for anything new on screen (Touch
  screens in `docs/DEVELOPMENT.md`). A small desktop window isn't a phone.
- The content checks in `CLAUDE.md`, after a content change.

## What not to commit or change

- **The cache, or anything exported from it** (PNGs, WAVs, dumps). It belongs to Jagex and stays
  out of the repository. Stage files by name rather than with `git add -A`: `.gitignore`'s
  `caches/` only matches a folder, so a `caches` symlink would be committed.
- **Release and identity values**: the version in `package.json` (a new version reaching `main`
  starts a release build), `LAUNCHER_VERSION` and `minLauncher`, the `rune-survivors-*` storage
  keys, the save lock's name, and the desktop app's `GAME_ORIGIN`, `GAME_PARTITION` and data
  folder. Players' saves and updates depend on them.
- **Anything that can never change afterwards**, like an Android application id: agree it with the
  maintainer first.
- **Leftovers**: debug logging, temporary scripts and files, commented-out code, and changes that
  have nothing to do with the PR.

## The changelog

- **Check where your bullet lands, not only that it merges.** On a branch cut before a release,
  your bullet sits under an Unreleased heading that has since become that release's. Git merges it
  there without a conflict, and the change is filed under a version it never shipped in.
- **Use the release branch's Unreleased section.** It usually exists already, so add your bullet to
  its Added, Changed or Fixed list rather than a new `## Unreleased` of your own, which conflicts.
- **Credit yourself** the way earlier entries do: "Feature, by Your Name: ..." for an addition, or
  "... Fixed by Your Name." for a fix.
- **Don't touch released sections.** Prettier re-indents the nested bullets in old releases, so
  edit the changelog by hand and leave it out of Prettier runs.
- **It's written for players**, in one-line bullets. No developer scripts or tuning controls, and
  nothing about secret content such as hidden bosses. A fix to something already released goes
  under Fixed, not Changed. A bug your own PR introduced and then fixed before merging gets no
  bullet, since players never had it.
- **It says what the PR does.** Don't describe a change that isn't in it, or announce something
  the release won't actually ship.

## The description

- **What it does and why**, in a few lines.
- **Every claim true.** Check each sentence against the code, because review will. Claims that
  turned out wrong before: "the gaps stay as wide" when only some bullet patterns kept them;
  "nothing changes for anyone who doesn't open it" when a number on the HUD changed format; "both
  relays do X" when only one did; "extra time doesn't make waves harder" when enemy scaling still
  went by the clock that had moved.
- **Don't state a guess as fact**, in the description or the docs. If you couldn't reproduce the
  problem or try the fix where it happened, say so.
- **What you ran**: tests, type check, Prettier, simulations (the commands, settings and before and
  after numbers), frame costs, the browser, a phone. Say plainly what you didn't try. "Not tried
  on a phone" will come back as a finding, so try it if you can.
- **Anything new from the cache**: name the ids. The hosted game needs `bun run slim-cache` after
  each build anyway, as it won't load a cache made for another build.
- **Trade-offs for players**, with numbers: a reward that gets rarer, an unlock that becomes a
  grind, a fight that gets longer. They're the maintainer's call, so make them visible.

## What review looks for

Security comes first because it matters most. The rest is grouped by area.

### Security

There are no accounts, so a player's unlocks are their own game's word, and stopping cheats isn't
the aim. What matters is that a modified game, a crafted save or a stranger on the network can
never crash or desync another player, or cost the maintainer money.

- **Co-op messages are untrusted.** A new message or field needs a size cap and a rate limit on
  the relay, counted per address and per network like the `MAX_*` limits in
  `server/coop-relay.mjs`, and the same limits on Cloudflare's relay. The game checks what it
  receives as well: numbers from other players go through `hasBadNumber` before they're recorded
  or shown.
- **Text from players**, such as names, is shown as text, never as HTML. There's no
  `dangerouslySetInnerHTML` in the game, and it should stay that way.
- **Imported saves are untrusted.** `migrateSave` takes `unknown`: check each new field there for
  its type, its range and that its ids exist. A save passed around online can be crafted.
- **The desktop app's protections stay**: `sandbox`, `contextIsolation` and no `nodeIntegration`,
  its Content-Security-Policy, the navigation lock (`will-navigate`, `setWindowOpenHandler`), the
  game zip's entries going through `zipEntryPath`, and the manifest's sha256. A change that
  loosens one needs a reason in the description.
- **Workflows**: `permissions: {}` at the top and only what each job needs, actions pinned to
  commits (Dependabot updates them, so don't by hand), and no `pull_request_target`. A job that
  holds a secret or a write token runs no npm packages and downloads no build plugins.
- **Dependencies**: a new package needs a reason in the description, and fewer is better. Run
  `bun install` in the package you changed (the repository root or `server/cloudflare`) and commit
  its `bun.lock`, which should change only as installing it changes it.
- **No secrets or addresses in the code.** No tokens, keys or personal data, and no default URL
  that appears nowhere else in the repository: addresses such as the relay's come from environment
  variables.

### Co-op

- **A guest's own hero is drawn at its predicted pose**, ahead of the sim. Anything drawn with the
  player (a pet, a swoosh, an aura) has to follow `getPlayerPose`, not `sim.heroes[i].player`.
- **Nothing the client does reaches the sim** or its hashes. A determinism test only proves
  something if the code under test could write to the sim. If it can't, the test can't fail.
- **Don't add a second layer of de-duplication.** A client-side "already sent" guard can override
  `CoopRun`'s own dedupe and resend, so a lost message is never sent again.
- **Once per encounter, not once per copy.** Spawning a boss once per player can multiply its
  banner, loot, trophy rolls and the party's HP scaling, and stack copies on a single spawn spot.
- **The room's settings are the relay's.** A client that updates its own store and then sends it
  falls out of step after any refused change. The UI has to agree with what the relay allows too:
  don't enable a pick the relay will refuse.
- **Resends and abuse.** Who can trigger a broadcast, how often, and how big? An unthrottled resend
  can get the host disconnected and end the run for everyone. A throttle that folds every ask into
  one can let a single bad ask block the honest ones.
- **The relays check the host's frames** (`server/coop-checks.mjs`). A change to what goes in them,
  or to when the host sends a guest's moves or decides for them, has to agree with it there, or
  honest hosts get caught. Its tests hold its copies of `cleanMove` and `cleanAction` to the game's.

### Cloudflare's relay

- **The lobby and the rooms hibernate**, and anything kept in memory goes with it. Each wake runs
  the constructor again, so code there that touches stored state runs far more often than it looks.
  A room that's quiet for 10 seconds can be made again from storage and its sockets' attachments,
  so anything it has to remember past that goes in one or the other. A restart leaves only
  storage, so something kept only in memory or attachments (like when the room was last used,
  mid-run) has to be saved now and then too.
- **A closed socket can still be listed** by `getWebSockets()` until the other end answers, which
  a dead connection never does. A room forgets one before closing it (`shut()`), or being made
  again can give its player the dead one.
- **A pending timer keeps it awake**, and billed, which can undo a change meant to cut cost. A room
  waits only with `later()`, on its one alarm, never `setTimeout` or `setInterval`
  (`room.test.ts` checks).
- **Pings are answered without waking it**, so an idle check never runs for a connection that only
  pings, and they never reach its rate limit. A room that needs to know when one last came (for
  `SILENT_MS`) asks Cloudflare (`getWebSocketAutoResponseTimestamp`).
- **Cost from strangers.** Anything an unauthenticated request can start (a Durable Object per
  room address, a call into the lobby) needs a limit or a documented rate limiting rule.
- `wrangler` needs Node 22. Where it won't run, test the lobby and room with vitest.

### The sim

- **Determinism**: only the seeded `Rng`, and `fm` for trigonometry, in `src/game/core/`.
  `core/runHash.test.ts` must pass unchanged after a tidy or a speed-up.
- **State read before it's set.** Look for helpers that read a field like `this.damageSource`,
  which some callers set first and others don't. Targeting once went by whichever weapon fired
  last.
- **Which clock.** A room's clock against the run's: moving waves to one while enemy scaling and
  casket tiers stay on the other changes the difficulty. A capped `dt` mustn't throw the rest of a
  long frame away.
- **Floats compared exactly** after a multiplier, such as upgraded gear stats.
- **Missing guards**: `lastIndexOf` returning -1 into `splice`, an index into `sim.heroes` with no
  check.
- **Numbers belong in content.** Party and hard-mode rules go in `content/coop.ts` and
  `content/hard.ts`, not inline in `Sim.ts`, and a boss's numbers on its `BossDef`.
- **Heroes**: a solo run must play exactly as before. See Heroes in `CLAUDE.md`.

### Performance

The game has to run on phones. Measure rather than guess, and put the numbers in the description.

- **A frame's cost**: in dev, `await frameProbe.sample(60)` gives a frame's triangles, draws and
  CPU time, and `bun run tsx scripts/dev/render-stats.ts <map>` gives a map's without a browser.
  Compare those before and after. A headless browser draws in software, so its frame rate means
  little.
- **Crowds**: `?stress=300` adds goblins. Code that runs per enemy mustn't scan every enemy for
  each one, and the tick shouldn't allocate. Work out what's the same for a whole loop once,
  outside it.
- **The sim's speed** matters beyond frames: the balance bot and the tests run it too, and the
  release's tests run on a busy machine.
- **The HUD**: anything that changes during a run goes in `HudNumbers`, rounded as it's shown, not
  in `UiSnapshot.hud`, which redraws the UI from its root. Bars fill with `transform: scaleX`, not
  `width`. See Keeping it light on a phone in `docs/DEVELOPMENT.md`.
- **CSS that redraws**: a `mask-image` on something animated, or an animation that never stops.
- **Loading and memory**: bake only what a run needs. A baked animation is a copy of the model for
  each of its frames, so an enemy's triangles count many times over. Everything new from the cache
  adds to every player's download.
- **The bundle**: anything `WebGLMapViewerRenderer` imports ends up in the game's bundle.
- **Co-op traffic**: anything sent every frame goes to every guest, within the relay's limit on
  what a host sends each second. On Cloudflare, requests and time awake are billed.

### Saves

- **A migration has to survive later content changes.** One that only keeps data if it still
  matches today's prices loses every player's data at the next price change.
- **No dead ends.** Check that every state a save can be in has a way out in the UI.
- **Rebuild what can be rebuilt** from what's saved, rather than making every existing player reset.
- `SAVE_VERSION` and a step in `migrateSave` when `SaveData` changes shape (not for a new optional
  field, or for dropping one that loading ignores), and writes only through `GameClient.persist()`.

### Content from the cache

- **Look ids up with `scripts/cache/`**, never from memory. Pets, for example: of each pair of NPC
  ids, the follower is the one with `isFollower` and the Metamorphosis option.
- **OSRS accuracy.** Check how a thing is really obtained before adding it as a drop. The Holy
  Scythe of Vitur, for one, is made from the Scythe and the Holy ornament kit.
- **What a player reads from it.** Don't give two mechanics that need opposite answers (outrun it,
  stand still) the same graphic.
- **Real assets**, not coloured overlays, as `CLAUDE.md` asks.
- **Fallbacks.** A sprite missing from an older slim cache shouldn't draw a blank.

### Balance

- **Simulations as `CLAUDE.md` asks**: `scripts/game/simulate-run.ts` before and after, every
  affected map, all three styles, `PARTY=2` and `PARTY=4` for co-op, and at least six seeds for
  hard mode. A one-minute damage harness on its own, one map with one adventurer, or after-only
  numbers aren't enough.
- **The numbers shown have to match.** Cards, pause and tooltips read `content/weaponStats.ts`. A
  multiplier applied somewhere else makes them show the wrong damage.
- **Is the upgrade still an upgrade?** A flat nerf can leave an evolution weaker than the maxed
  weapon it replaces, while the level up still offers it first.
- **Knock-on effects on rewards.** Longer boss fights can cost raid speed points. Loot can be
  multiplied by extra copies of a boss.
- **A fresh save as well as a maxed one.** `META=max ARMOURY=max` shows the end game, and leaving
  them out shows a new player's first runs. A change can be fine at one end and harsh at the other.
- **Endless**: `ENDLESS=1` for anything that touches waves or scaling.
- **Weapons**: `scripts/game/measure-weapon-dps.ts` compares attacks on matched seeds. Run it
  alongside the sims, not instead of them.
- **Where to tune**: profile multipliers go in `content/balance.ts`, and a lasting change to a
  weapon's progression in its own levels (`docs/BALANCE.md`). A multiplier isn't exact for small
  hits: they round, with a floor of 1, so a small venom tick can lose far less than it says.
- **What the bot can't show**: it plays strike-based adventurers badly and doesn't play co-op as a
  team. Play those changes yourself, and say so.
- **Grind**: coins, shop prices, XP and casket tiers add up over many runs. Say what the change
  does to how long an unlock takes.
- **Pinned runs**: `core/runHash.test.ts` pins seeded runs, and a balance change will usually
  change them. Update them on purpose and say so. A tidy-up or a speed-up must leave them as they
  are.

### UI, touch and controllers

- **Hover and focus aren't the selection.** A button in a panel that shows whatever the pointer
  last crossed acts on the wrong thing, and can vanish mid-click when focus moves.
- **Touch.** A hold that closes when the resting finger drifts; a flag that only a mouse press
  resets, dropping later clicks. Use `TAP_SLOP` and `SharedTaps` from `client/GameTouch.ts` rather
  than writing another tap detector.
- **Controllers.** DS4Windows' mirrored pads change a poll or two apart, so "both changed this
  poll" isn't enough to keep to one pad. A pad that never rests mustn't lock the others out.
- **Every way in.** A new control works with a mouse, touch, a keyboard and a controller, and
  takes the controller's highlight in menus (Controllers in `docs/DEVELOPMENT.md`).
- **Disabled controls** need a disabled look and no hover effect. A label that already flips
  between on and off shouldn't carry `aria-pressed` as well.

### Tests

A test should fail on the code it protects. Avoid tests that:

- repeat the literals they check, or can't fail whatever the code does;
- cover only the timing your fix handles (two pads changing in the same poll, say);
- depend on timing, such as a 10 ms window. The release workflow runs the tests on a busy machine,
  and a failure there stops the desktop build;
- don't check that their own setup worked (a helper that ignores a failed purchase);
- rely on two weapons' balance multipliers staying equal.

For a bug fix, add a test that fails without the fix.

### Docs and formatting

- **The docs still say what's true**: `CLAUDE.md`'s table, the layout in `docs/DEVELOPMENT.md`,
  `docs/GAMEPLAY.md` and `.claude/rules/`. New modules, environment variables and changed screens
  are the usual ones missed.
- **No numbers that go stale**: tuning constants, per-hour figures worked out from constants,
  tables of ids kept by hand. A message that repeats a constant, like "10 minutes", should be built
  from it.
- **Developer and agent notes** go in `docs/DEVELOPMENT.md`, not README's getting started.
- **Markdown is wrapped at 100 columns by hand.** Prettier leaves prose as it is.
- **Comments**: short, saying why. Keep the why-comments when you move code, and don't insert new
  code between a doc comment and its function.

### Reuse

Look for what the repository already has before writing it again: thralls' follow code, the game
zip checks in `desktop/gameFiles.ts`, `DisplaySettings`' defaults, `TAP_SLOP`. Remove code the
change leaves dead.

## After review

- **Findings come as a GitHub review**, with inline comments where they're on a line of the diff.
- **Answer each one**: fixed (in which commit), or why not. Pushback with reasons is welcome, and a
  finding that turns out wrong is withdrawn.
- **Run the checks again after fixing.** A fix that brings in a new bug is the most common finding
  on a second review.
- The maintainer may push fixes to your branch, or merge your PR and fix things on top. Either way
  the PR shows as merged, and the changelog keeps your credit.
