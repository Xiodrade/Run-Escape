---
paths:
    - "src/game/content/**"
    - "src/game/core/**"
---

# Adding content

Content is plain data in `src/game/content/`, typed in `types.ts`, and the comments there explain
each field. Find a similar entry, copy its shape, and look up real ids in the cache:

```sh
bun run tsx scripts/cache/find-objs.ts "dinh's bulwark"      # items
bun run tsx scripts/cache/find-npcs.ts "^count draynor$"  # NPCs and their idle and walk animations
bun run tsx scripts/cache/find-npc-seqs.ts 655               # animations an NPC's model can play
# tell attack and death animations apart
bun run tsx scripts/cache/classify-npc-seqs.ts 655 6182 6183
bun run tsx scripts/cache/find-locs.ts multicannon           # scenery
bun run tsx scripts/cache/sounds.ts seqs 390                 # sounds an animation plays
bun run tsx scripts/cache/sprites.ts png out 1400-1430       # interface sprites, to look through
```

Attack sounds aren't in the cache: the ids come from the OSRS Wiki's list of in-game sound IDs.

Whatever you add, follow the checklist in `CLAUDE.md`: tests, simulations, changelog and docs, and
say in the pull request if it uses anything new from the cache. `docs/GAMEPLAY.md` lists most
content, so add new entries to its tables and lists.

## Weapon

Add it to `WEAPONS` in `weapons.ts`.

Damage tuning by style, evolution, weapon and run mode is in `content/balance.ts`; see
`docs/BALANCE.md`. It applies at damage time, so don't fold those multipliers into a weapon's
levels or secondary attacks as well. Keep the originating weapon's damage source on delayed effects.

- `kind` decides how it attacks and what each level's numbers mean: `slash`, `sweep`, `missile`,
  `knives`, `axes`, `aura`, `strike` or `orbit`. The `fire*` methods in `Sim.ts` do the work, and
  `statFields` in `weaponStats.ts` lists the stats each kind shows.
- `style` makes it a class weapon, only offered to adventurers who fight that way. Set
  `damageStyle` only for exceptions (see its comment).
- `unlock` brings it in through a task on a map. Without one it's there from the start.
- `evolution` needs a passive, and the weapon it becomes needs `evolved: true`, `evolvedLevels` for
  its 3 levels, and `style`/`family` kept from what it evolves from. Set `damage` to a three-value
  array for a tuned curve, or a number for the default progression. Recipes in `evolutions.ts`
  and the Collection log come from these fields, so they need no extra entry.
- A `sweep` with `arc: Math.PI` hits all the way round. `special` replaces every so many swings of
  a slash or sweep, and `special.aoe` hits all round. A missile's special is `siphon` instead: a
  chance each attack, rolled on the sim's `Rng`, of harder shots that heal (the Toxic blowpipe's).
  `heavy` makes a slash's or sweep's blows land heavy (the Saradomin sword's): a camera shake, a
  spot animation on what they hit if it has one, and a stagger (`WeaponDef.heavy` in
  `docs/DEVELOPMENT.md`).
- An attack that hits what it touches (its range plus the enemy's `radius`) finds enemies with
  `queryTouching`, not `enemyHash.query`: the hash goes by middles, so its search alone misses a
  big enemy whose edge is in range.
- Every other level of a slash or sweep adds knockback automatically, from the loop after
  `WEAPONS`. Don't add those steps by hand.
- `burns.locId` is scenery for the flames on burning ground. `getBaseRequests` bakes it with the
  loc's own animation (`animated` on a loc request); other locs are baked static. Not every loc's
  model moves with its animation: `scripts/cache/find-locs.ts` gives the seq, but check it flickers.
- A strike's `impactFit` scales its impact spot animation to the strike's radius and plays it out
  in full (the Nightmare staff's hands), instead of a moment of it as it is.
- A swoosh colour goes in `SLASH_COLORS` in `client/GameView.ts`.
- To change a missile's look as it levels, set each level's `projectileSpotAnim` to its cache
  projectile. `getBaseRequests` picks up every level for baking and the slim cache automatically.
  Use `projectileObjId` for a real item model instead (the crossbows' bolts); these are baked at
  every level too, without changing the held weapon or the projectile's hit size.
  `getProjectileObjId` in `weapons.ts` says which item flies (a knife's the one in hand), for the
  sim and the baking both. An item whose model is too small to see, or doesn't point the way it
  flies, gets an entry in `PROJECTILE_ITEM_LOOKS` there: bolts are drawn 3x and turned half round,
  as knives are, and the atlatl's dart lies at a slant. It goes by the item, so every weapon that
  fires it looks the same, and it's drawing only. Check a new one in the browser, flying both
  ways: none of these pointed the way they fly as they come from the cache.
- Check the player's animation (`playerSeq`) in the browser. A seq id existing doesn't mean it
  suits the weapon.
- `runPose` is a frame of `playerSeq`, the aim, that the upper body holds for a moment after each
  shot while running, as the Armadyl crossbow's does. It's for a weapon players hold and kite with,
  and costs a few frames per player: pick the frame in the browser, running.
- If the item doesn't use the plain human stance, add it to `STANCES` in `stances.ts`. The cache
  doesn't say which stance an item has, so the file says where to look it up.

## Passive

Add it to `PASSIVES` in `passives.ts`. `perLevel` is what a Common pick adds, and `alsoAdds` puts
the same amount on more stats. `iconSpriteId` shows an interface sprite instead of the item
(a prayer's icon), and the item if the cache hasn't got it. Sprites have no names, so find one
with `sprites.ts png` over a range of ids and look: a prayer's lit icon sits beside its greyed-out
one. `sprites.ts check` (and a test, when there's a cache) makes sure every sprite the game shows
is there, the overhead prayers' frames too, and `slim-cache.ts` keeps them.

Any other interface sprite the game shows goes in `getGameSpriteIds` in `client/GameAssets.ts`
(one the game view draws, in `GAME_VIEW_SPRITES`, or in `loadSprites` for a frame past the first,
as the overhead prayers are), or the slim cache won't have it.

## Stat

Add the key to `StatKey` and `emptyStats` in `types.ts`, and to `STAT_INFO` in `stats.ts`.
TypeScript points out what's missing. Give its label an icon in `content/statIcons.ts` (a test
checks every stat has one), and the slim cache keeps what that file lists.
A stat does nothing until `Sim.ts` reads it, from `this.stats`
(everything added up) or `this.metaStats` (the shop's alone, and set before the constructor adds the
starting weapon).

## Shop upgrade

Add it to `SHOP_UPGRADES` in `shop.ts`, themed as an OSRS skill, with its `stat`. Costs and
refunds come from `getPageCost` (what a page's ranks cost in all, in any order) and the save code,
independently for each combat style's `skillPages` allocation. New ones don't need a save migration.
A single rank's refund gives back its share of what the page spent, by what it adds at today's
prices, so changing a cost needs no migration either.

## Gear and utility items

`items.ts`: gear goes in `CASKET_GEAR`, and utility items in `UTILITY`. `armoury.ts` says what each
piece upgrades into, and `sets.ts` has the set bonuses. Run `scripts/cache/check-items.ts` afterwards.
A utility item with a new `ItemUse` kind needs a case in `Sim.useUtility`, a sound in
`USE_SOUNDS` in `client/GameSounds.ts`, and if it's only for some runs (the Prayer cape's extra
revive, co-op only), its weight in `itemWeight` in `core/Loot.ts`.
A utility item's `description` is the sentence its descriptions show. A `buff` has none: it's
shown as its stats, a line each, then how long they last (`describeItem`, `ItemView.seconds`).

## Power-up

Add it to `POWER_UPS` in `powerups.ts`, with a `PowerUpEffect` kind in `types.ts` and a case in
`Sim.usePowerUp`. `objId` is the icon, and what lies on the ground unless `locId` is set.

- `look` is an item held and two player animations for as long as it lasts. It's baked with the
  player, and `slim-cache.ts` picks it up from there (`getPowerUpLookRequests`). Only player
  skeleton animations work, and the item's worn model matters: a look needs both.
- `sound`, `endSound`, `hitSound` and an effect's `locId` and `spotAnim` are collected for you, and
  a `rampage` effect's NPC too. Anything else from the cache needs adding to `getGameSoundIds`,
  `getSpotAnimIds` or `getBaseRequests`, or the deployed game won't have it.
- Anything meant to stop all damage has to hold `player.invulnerable` above
  `HIT_INVULNERABLE_TICKS` every tick, as the sled does in `stepPlayer`. A timer running down lets
  boss hits and poison through near the end.
- Give it a `price`, what the Mysterious Old Man charges before the run's time and the map's coins.

## Random event

Add it to `RANDOM_EVENTS` in `randomEvents.ts`, with a `RandomEventEffect` kind in `types.ts` if the
existing ones won't do, and a case in `Sim.meetVisitor` (`startRandomEvent` for an `ambush`).

- A visitor's `npcId` is baked on every map by `getBaseRequests`, and an `ambush` enemy by
  `getMapEnemies`. `idleSeq` must be a seq the NPC's model can play: `find-npcs.ts` gives its own.
- An effect's `sound` and a `buff` effect's `objId` are collected for you. Anything else from the
  cache needs adding, as with power-ups.
- Events roll on the sim's `eventRng`, not `rng`, so adding one doesn't send every seeded run down a
  new path. Keep what they decide on it too.
- `state === "event"` pauses the run for an offer. The sim's bot answers those in `eventChoice` in
  `simulate-run.ts`, so it needs to know a new kind of offer.

## Wardrobe piece

The Wardrobe's store is every wearable item in the cache, generated into `content/cosmeticItems.ts` by
`bun run tsx scripts/cache/cosmetics.ts`: don't add pieces by hand. To change what's in it, change
the script's filters (`JUNK`, `RARES`, the slots) and run it again, then
`scripts/i18n/extract.ts` for their names. Prices are by rarity in `content/wardrobe.ts`, with
3rd Age priced on its own there. An
adventurer's own outfit pieces are free once they're unlocked, so a new adventurer needs nothing more.
A piece that's only found, never sold (the Halloween masks, raid armour), is a trophy (`trophies.ts`)
named in `FOUND_PIECE_TROPHIES` in `content/wardrobe.ts`, with any pieces it makes besides its
own item. A new trophy that's a worn item goes there too, or the store sells it.
`slim-plan.ts` bakes every piece on both bodies. See The Wardrobe in `docs/DEVELOPMENT.md`.

## Collection log reward

Add trophies to `TROPHIES` in `trophies.ts`, with a `TrophySource` that names how they're found. An
`enemy` source rolls per loot-bearing kill on its map and a `turkey` source when cooked turkey is
carved, each till the run has found it; a `map` source is awarded only on victory and can require a
boss in `bossesKilled` or hard mode. A `quest` source is awarded when the quest is recorded,
including already completed quests on save load. Trophy ids are stored in saves, so keep them
stable. A pet in `PETS` shares its trophy id and uses the cache's follower NPC with its idle and
walk sequences.

## Enemy or boss

Add it to `ENEMIES` in `enemies.ts` (fun map ones go in `fun/enemies.ts`), with its NPC id,
animations, sounds and stats. Tests check that every enemy a map or boss refers to exists, and
that every boss attacks. It's baked for the maps that use it (`getMapEnemies` finds its id wherever
a map, or an enemy on that map, mentions it), so that needs nothing added. Then run
`scripts/cache/npc-looks.ts`: if its NPC looks the same as another enemy's, it's baked once with
it, and a test with the cache fails until that's run.

- `ghost` goes through everything, and is only for what's really a spirit. Anything with wings gets
  `flies`: over fences, walls, trees and water, and round terrain (`world/FlightGrid.ts`).
- A `radius` over 1 (more than two tiles across) makes a big enemy: melee weapons go by its edge
  for when to swing and where to aim, and attacks find it by its edge too (`Sim.bigEnemies`).
- A `blinks.surface` seq is baked like `blinks.seq`, and needs to be one the NPC's model can play.
- `holds` has an enemy pin the player where they stand once it reaches them (Phosani's husks), and
  a boss's `summon.scatter` brings its summons on wherever a wave's enemy would, so there's time to
  kill them on the way. `summon.thrown` flings them out of the boss to spots `distance` tiles off,
  unhittable in the air, `healthBar` on an enemy keeps its bar over it from the start, and `solid`
  means the player can't push it, and `hintArrow` puts the game's hint arrow over it. A ground
  attack's `grab` plays its `middleSpotAnim` out in full where each mark lands, `fit` times the
  mark's radius across, hurting whoever steps in while it's up, and a boss's `leash.jump` names
  the down and up animations it leashes with. A phased boss's `totems.yawOffset` turns a totem model whose mark isn't on
  its front towards the middle.
- A boss's `intro` can rise it at the middle of the map's `bossArena` with the player south of it
  (`atMiddle`), and root the player until it's over (`holds`), after which it attacks at once.
- A boss attack's `chain` repeats it straight after (dashes back to back, claws in rounds),
  `toMiddle` takes the boss to the arena's middle first (with its leash's jump, if it has one,
  the windup running from when it's there), a quarters attack's `during` says what it
  does among its flowers, and a pattern's `gap` and `track` make a ring with a way through and a
  stream that follows the player; `gapAt`, `mirror`, `speedUp` and `around` shape a ring further,
  and `follow` names the attack that comes after. An enemy with `hatches` turns into others
  unless it's killed in time, and one with `objId` is drawn as an item (Phosani's eggs). A
  pattern's `channel` is how long the boss stands still for it (the whole pattern unless set),
  its `burst` fires so many volleys and then pauses (holes along a sweep's arm), a
  boss's `bulletGrace` how long after a bullet hits before another can (a second), a final
  boss's `fallSeconds` how long its death plays before the victory screen, and a phased boss's
  phases each take an `ambient` pattern it keeps up on its own, a `tempo` and a `speed`, with a
  `finale` after the last blast. Without `totems` its phases go by its hitpoints instead
  (`until`, `threshold`, Justiciar Zachariah's), and a `finale` is a last stand at none (the
  Menaphite Akh's). Attacks that read the arena (`MapDef.features`:
  a checker, pillars, bolt rows, knights, fires) and the statues a fight animates itself are
  under Arena fights there, with a boss whose `guard` drops when its attacks with `opens` miss
  (a lunge, a blast, a ground mark, a wave, a charge across; a lunge's `line.track` turns it
  after the player first) (and its arena's attacks with `turns` stun it), a fight's own button
  (`MapDef.fight.ability`, or the Tombs' `TombsDef.ability`: `Sim.ability` is either)
  and what a blow throws up (`impact`, an `ImpactDef`). Boss fights as data in
  `docs/DEVELOPMENT.md` has the lot.
- Bosses asleep on a map to walk round (`MapDef.lairs`: Yama's, and his generals') wake when
  someone steps onto the map's floor or into a lair's own `area`, and every way out burns until
  it's dead. A lair can wait on others (`requires`), throw the party out on a death (`retreat`),
  grow stronger once another's beaten (`empowered`), heal the party as it's beaten (`heals`) and
  win the run (`final`). Give a lair's boss
  room for its `radius`: the flow field steers by single tiles, so a boss wider than a gap sticks
  in it, and one whose `at` doesn't fit rises at the nearest spot that does, maybe outside its
  lair (the church's pews had to go for K'ril). Yama's fight's fields are any boss's:
  `BossDef.home`, `critical` (an attack on its own clock) and `gazeWard`, and an attack's
  `meteor`, `interruptedBy` (a hero's button stops it) and `floorAt`, and his Voidflare's
  `EnemyDef.bursts` (a summon that bursts unless a hero's buttons hold and break it, for food)
  with `summon.toward`. A lair's `opening` is a cinematic as it wakes, on the sim's clock, with
  the party held, and `requires.unsealing` one as what it waits on is beaten (its seal going out,
  in a puff of `seal.smoke`). `MapDef.objectives` puts what the map wants on the HUD for a few
  seconds, a line at a time, each done once its lairs are beaten. `MapDef.lairs` under A hero of their own in `docs/DEVELOPMENT.md` has the lot,
  with the generals' pieces (`LairDef.pillars`, a debuff's `burn`, a pool's `spreads` and
  `dousedBy`, `walkTo.heals`, `BossDef.pact`, `breakable`).
- Two bosses fought together (the Scarab Mages) are both `finalBoss` events, the second later
  with `inArena` so it comes up in the square, and the first's intro without `alone` (which
  holds back every event till it's dead). `enrage.partner` enrages one when its partner dies, and
  an attack's `tether` is a beam to its partner that hurts to cross (Two bosses fought together,
  in `docs/DEVELOPMENT.md`). Give each a `healthBar`: the top of the screen shows only one.
  The fight's button lands on either. One can copy the other's lunge with `echoes` (only
  while it's free). An attack with `channel` drops its guard while it's cast (a tether's, while
  its beam runs), and the fight's button breaks it; a swing with `outside` hits all but its feet.
  The bot needs to know a new one: both bots read a boss's shapes from
  `scripts/game/bossReads.ts` (`shelter`, `exposedBoss`, strips, wedges, walls and the rest), so
  a new shape's reader goes there.
- A ground attack's `trail` spots land on where the player stood so many seconds ago (at most
  `TRAIL_SECONDS`, kept on each `Hero`): the Champion of Scabaras's path that bursts behind you.
- An enemy with `echoes` (the Menaphite Akh's shadow) copies a boss's lunges: as that boss
  starts one of the named line swings, it winds up its own from where it stands at the nearest
  player, with its own name, damage, seq (baked with it, so one its rig can play), impact and
  strip `length` if it's shorter; `noDash` keeps a stationary one where it stands.
  Name only one phase's attacks to keep it to that phase (a finale's need names of their own).
  The bot finds the pocket between two strips (`sharedPocket` in `bossReads.ts`).
- The Tombs' bosses: a surge into one of Ba-Ba's rocks (`leavesCover`) is stunned as a lunge
  into a pillar is (a lunge only stops short of a rock); a guard with `pierce` lets its prayer
  down while it's open (Akkha's);
  `phases.by: "shields"` steps Kephri's phases at her shields; `onlyWith` keeps an attack to an
  invocation, and `invoked.times` adds links to its chain; `AkkhaDef.orbAttacks` are all he
  uses while his orbs are out; `clearOfObelisk` keeps a Wardens attack off the obelisk's
  special; `raidEase` eases a boss off from a raid level up (hitpoints, hits, the time between
  its ambients), where the raid level's scale would make a wall. Each boss's stage in
  `docs/design/tombs-of-amascut.md` says what it uses.
- A boss attack's `message` is what to do about it, said the first time it's used in a run, one
  at a time with others (`GameClient.showInstruction`), never again that run. A warning for every
  cast belongs in the attack's telegraph, not its message.
- In co-op a boss event spawns copies (`bossCopies` in `content/coop.ts`) that share one boss's
  hitpoints, experience and loot. One with `spawnAt` gets no more copies than it has free spots.

A new boss attack in `Sim.ts` that hits where the player stands has to hit each player in co-op:
check them with `forEachHeroInReach`, and keep anything it leaves on a player on their `Hero`.
`coop.test.ts` has a test to copy.

## Anything in the sim, for co-op

Co-op in `docs/DEVELOPMENT.md` has the rules: a player's own state goes on `Hero`, something that
lingers carries `hero` and acts through `useHeroAt`, a new event about one player goes in
`PERSONAL_EVENTS`, `this.player` means nothing outside a loop over the heroes, and trigonometry
goes through `fm`. A solo run has to play exactly as before: compare a sim with `main`'s.

## Map

Add it to `MAPS` in `maps.ts` (fun maps go in `fun/maps.ts`), with its waves in `waves.ts`.

- `arena` is in world tiles and is what collision is built for. `spawn` must be inside it.
- Set `plane` for dungeons above the ground floor.
- The game draws one plane, and hides roofs. If a map's roofs are plain scenery rather than the
  roof loc types, or something floats, see `src/mapviewer/webgl/loc/UpperLevels.ts`.
- Campaign maps unlock in the order of `MAPS`, and are the map screen's Act I tab. A `seasonal`
  map goes after them in `MAPS`, is open from the start, has no place in the chain and is listed
  on the Fun tab under the fun maps. Rewards come from `unlock` tasks on weapons, passives, items
  and adventurers.
- A map with `fight` is one boss fight (Phosani's Nightmare): `waves: []`, one `finalBoss` event
  at 0 whose boss has an `intro` with `alone`, and it opens once `fight.requires` is beaten. There
  are no picks and no items: everyone plays `fight.character` there (`getMapCharacter` in `maps.ts`
  is what reads it, and a fun map's `character`), an adventurer made for the fight and kept to it
  (`only` on the `CharacterDef`: never in the roster, never unlocked), whose starting weapon
  begins at `fight.weaponLevel`. Nothing in the fight drops experience, so that kit is the whole
  run, and the boss's hitpoints (the event's `hp`) are tuned to it. The spawn is the middle of
  the boss square, where the entrance puts the player anyway. The bot keeps away from bosses, so
  with nothing but melee it walks up to a shielded one and takes her swings: its numbers say how
  long the kit takes, not how a player fares. A fight can open after another fight (Justiciar
  Zachariah after Phosani's), as long as the chain ends at a map that isn't one. It's listed
  under Boss fights on the map screen's Bosses tab, and can't be endless. `fight.solo` keeps it to
  one player (the quest's fights): co-op's lobby leaves it out (`isCoopMap`). Sim it with
  `FLAT=1 MAP=phosani DODGE=1`, which needs no cache, and go by how long the bot lasts and what
  hits it (its `boss attacks that hit` line says which of the boss's attacks did it): it can't
  dodge as a person does.
- A fight in parts (Beneath Cursed Sands) sets `MapDef.stages`: each part is a run of its own,
  with its own `events` in place of the map's and its own `cinematic` (the boss's entrance, played
  as its run starts but not on a retry). A run plays the first part not beaten yet, a win's kept
  (`SaveData.fightStages`), and the map's beaten once the last part is.
- Check it in the browser: the minimap, the spawn, and that enemies can reach you. The sim's bot
  uses the real collision, so a sim also shows whether a map plays at all.
- Fun maps don't count towards quests. A fun map with `explore` has no clock, an empty boss pool and
  no random events. With no waves too it's one to walk round (`isPeaceful`): nothing hurts but
  while one of its `lairs` is fought. The Battle for Varrock has waves, so it's a run as any.
- The map screen lists maps by kind, a tab for each (`MAP_TABS` in `ui/GameUi.tsx`): a new list
  like `RAID_MAPS` needs a group there, or it won't be on the screen. Every tab's page is laid out
  at once, one over another, so the list keeps the tallest's height and the details below never
  move. A tab taller than Act I's makes the list taller on every tab, and past about half
  the panel it scrolls.
- An act's map (`act`, `content/acts.ts`) is outside the campaign's chain: it opens once
  `act.requires` is beaten, its act's maps in any order, and it's on the act's own tab of the map
  screen (`ActPage`, Act II's beside Act I), not Act I's list. Its toughness is the act's step (`ActDef.steps`, set
  by how many of the act's other maps were beaten, the host's in co-op): its `difficulty` is the
  first step's, and the step scales its bosses' event hitpoints too. Sim it with `STEP=0` to `3`.
  Its slot on the act (`ActSlotDef`) names its Awakened fight (`fightId`): the act's ending
  (`ActDef.ending`) is told once every slot's fight is beaten (`isActEnded`, `takeActEnding`).
  An act stays hidden and its maps locked until `ActDef.released` (`isActOut`), with what they
  bring in: an adventurer they unlock (`isCharacterOut`) and the Collection log's entry for
  their finds, and the casket gear and evolutions brought in there. Anywhere new that lists
  maps, adventurers or finds needs the same check. The dev server shows an act that isn't out
  with `?devtools`; sims and tests play it either way.
- `rule` is what the map's played by (`RunRuleDef`, `core/rules/`): the sim runs it each tick on
  its own Rng, so nothing else about a run changes. A rule only reads the grid and its def, never
  a map's own data, so it can go on any map. A new kind needs a class implementing `RunRule`, a
  case in `createRunRule`, a view in `client/` and the bot taught to play it (`botMove`).
- `hard` is what hard mode multiplies its enemies' hitpoints and damage by (`hard.ts` has the rest of
  hard mode, and the numbers for a map that doesn't set its own). Sim it against normal with `HARD=1`.
- Lights: a map opts in with `lighting` (`LightingDef`), and then anything can give off light: the
  map's own `lights`, glowing scenery by loc id (`locs`), each player's (`player`), an enemy's
  (`EnemyDef.light`, and what it leaves where it dies), a power-up's (`effect.kind: "light"`),
  spells by spot animation (`SPOT_LIGHTS` in `content/lights.ts`), a floor's tiles
  (`FLOOR_LIGHTS`), a boss's windups and marks (`light` on the attack or its ground pattern), and
  its exposed core (`look.exposedLight`), or a faint glow while its own light's out
  (`look.darkGlow`, with `EnemyDef.light.phases`). `ambient` darkens the rest (and a boss phase's `light`
  for a while); `litTargetsOnly` is the Scar's rule, on its own. "Lights" in `docs/DEVELOPMENT.md`
  has an example of each. Off a map with `lighting`, none of it does anything.
- `blessings` (`BlessingsDef`) takes a map's items away: each level up offers three blessings to
  choose from instead of picks, and nothing drops a casket or a power-up (the Battle for Varrock's,
  `content/blessings.ts`). A blessing can add stats, level the starting weapon, bring a weapon
  and level it, heal and change the hero's own buttons: see A hero of their own in
  `docs/DEVELOPMENT.md`. A new one needs a place in the bot's `BLESSING_RANK`
  (`simulate-run.ts`), or it takes it last. Sim it with the bot's lairs (`LAIR=`): a run that
  never takes a ranged weapon can't beat a general. `levelXp` slows its
  levels after the first few (`LevelXpDef`), and `burns` has scenery that hurts whoever walks
  into it (Varrock's fires, walkable copies from `getWalkableLoc`): teach the bot to walk round a
  new kind, as `firesToAvoid` does.
- People standing about as scenery are `props`, and an opening cinematic is `cinematic`, with
  `spawnFacing` to turn the player the way its camera ends looking: see Props and opening
  cinematics in `docs/DEVELOPMENT.md`. Vardhelm's (`scaperune/maps/vardhelmOpening.ts`) is the
  one to copy. Place its shots with the shot editor (`?director=<map id>` on the dev server) and
  paste the code it gives (its Trailer row records it as an MP4, for the pull request). Check
  every shot's triangles at a phone's size, as it says.
- A map that isn't a slice of the real world is a ScapeRune recipe, and one that ships goes in
  `scaperune/maps/shippedMaps.ts` with `scaperune: true` on its `MapDef`: see
  `src/game/scaperune/CLAUDE.md`, which also has a random generator.

## Raid

A raid is a map with `raid` set, listed in `RAID_MAPS` (`raids.ts`), not `MAPS`: its rooms one after
another, each with its waves, events, boss and where things are. Its arena is a ScapeRune recipe
with a hall for each room's waves and its boss room cut from the cache (`maps/theatreOfBlood.ts`),
which exports where everything is. `waves` and `events` on the `MapDef` are every room's, for what
bakes and checks a map's enemies; the sim goes by the rooms. Its bosses go in a file of their own
(`theatre.ts`); one that's also on a campaign map is a copy with a raid id, so the campaign stays as
it was. Expert mode's rules are fields on the enemies (`onlyStyle`, `expertAs`, `colours`, `stare`,
`expert` on an attack, `shot.expertKeep`, `expertOwnStyle`) and do nothing off a raid's expert mode,
but `colours.offStyle` brings a boss's colours to normal too. A boss's own mechanic can be a while
it can't be hurt: `shadowRealm` or `yellows` (for so many seconds) or `exhumes` (until so many of
its smother ground marks are stood on, or its time's up), each at shares of its hitpoints, doing
only the attacks they name meanwhile (`stepOrdeal` in `Sim.ts`), after its `opener` if it has one
(the Champion of Scabaras lays his nests all at once that way); an attack with `ordeal` is used
only then. The balance bot has to know how to play a new one (`fightMove` in `simulate-run.ts`), or
its sims can't win the fight.

The Tombs of Amascut (`scaperune/maps/tombsOfAmascut.ts`, to the plan in
`docs/design/tombs-of-amascut.md`) is on the Raids tab, behind its quest, Beneath Cursed Sands
(`MapDef.requires`). A new invocation goes in `INVOCATIONS`
(`content/invocations.ts`), with its raid level and group.
A room's enemies are baked as the raid gets there and freed once its path is done, found from
its puzzle's content in `TOMBS_ROOM_CONTENT` (`tombs.ts`) and its boss: a new room's content goes
there, and see What gets drawn in `docs/DEVELOPMENT.md` for an enemy two rooms use.
A new room or boss, or a mechanic in one, needs the Tombs' bot to know it
(`scripts/game/tombsBot.ts`: the puzzle's steps, where to stand, what to step round), and its sim
run on it
(`scripts/game/simulate-tombs.ts`, `ROOM=` the room), solo and with `PARTY=2`: in co-op one player
works a puzzle two would undo between them.

## Pet

A pet is a trophy that follows its finder (most are looks only). Add the trophy to `trophies.ts` with a drop
(`from`), then an entry in `PETS` (`pets.ts`) with its id, the follower NPC and its idle and walk
animations from `scripts/cache/find-npcs.ts`. A pet has two NPCs in the cache: use the one the
script marks `follower`, not the other one. It's baked as it's wanted (and by `slim-cache.ts`) and
offered once found, with nothing else to add. A looks-only pet never goes in the sim; a fighting
one (`PetDef.power`, Butch's leap, the Wisp's call, Baron's gas, Lil'viathan's bubble) is played by `Sim.stepPets`, and a new kind
of power needs its case there and its line on the Pet row (`ui.pet.power_<kind>`): see Pets in
`docs/DEVELOPMENT.md`.

A trophy (`trophies.ts`) shows in the Collection log under the map its `from` names (a pumpkin's
under the Hallowed Night), with an entry of its own for a new map, and so do weapons whose
`unlock` names that map (`content/collectionLog.ts`). A boss fight map (`MapDef.fight`) whose
boss brings in a weapon gets an entry too, trophy or not; a campaign map's boss drops don't. The
Tombs of Amascut's chest's are under the raid. `getMapTab` files each entry under a tab (Bosses,
Raids, Minigames) by what kind of map it is: a new kind of map needs a place there.

## Text and languages

Names and descriptions are read through the accessors in `content/` (`tr(key, english)`), never
straight off the definition. After adding or renaming content, run
`bun run tsx scripts/i18n/extract.ts` to regenerate `src/game/i18n/locales/en/*.json`. See
`docs/DEVELOPMENT.md`, Languages.

Write it in English only: never translate it into another language unless the developer asks you
to (CLAUDE.md, Conventions). The other languages show the English until their translators add
theirs.

## Adventurer

Add it to `CHARACTERS` in `characters.ts`, with a `style`, `startingWeapon`, `equipment`, `bonus`
and usually an `unlock` task. A `revival` bonus needs a `reviveLook`, the icon the HUD shows for
it (a test checks). Act II's have a `trait` (`CharacterTraitDef`), a way to play rather than a
bonus, which the sim plays out for their hero (the Forester's `timber`: `fellTree` and `cutReach`
in `Sim.ts`); a new kind needs its case there. A description can use `**bold**`. One drawn as an NPC
(`npcLook`) with buttons of its own (`abilities`, `HeroAbilityDef`) is Justiciar Zachariah's
(`justiciarKit.ts`): see A hero of their own in `docs/DEVELOPMENT.md`.

## Quest

Add it to `quests.ts`. Tests check every quest can be done, so its enemy ids must exist.
