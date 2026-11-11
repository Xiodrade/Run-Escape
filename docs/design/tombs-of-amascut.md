# The Tombs of Amascut: design

The plan for the game's second raid, before it's built: what it is, how each room and boss works,
and the order it's built in. Written 2026-11-04, on the `feat/toa-base` branch. As each piece lands
its section here becomes the record of it, the way `phosanis-nightmare.md` is for her fight.

The research behind it is OSRS's own (the OSRS Wiki's Tombs of Amascut, Invocations and boss pages,
and the runescapeguides.com Wardens and Kephri guides), and what the game's cache has (section 10).
OSRS changed almost nothing in the raid after September 2025, so the cache (2026-09-30) is
missing none of it.

## 1. What it is

The most interactive raid in the game. In OSRS each boss has a puzzle room before it, and that's
kept: you start in the Nexus, pick any of the four paths, solve its room, then fight its boss. Once
all four are done, the Wardens. Unlike OSRS's rooms, ours roll a variant as you come in and change
while you're in them, so no two raids play alike.

It was built as a dev map, a piece a pull request, and now ships: `tombs_of_amascut` on the
map screen's Raids tab (`RAID_MAPS`), behind its quest, Beneath Cursed Sands, which is in `MAPS`
with the boss fights. Both recipes are in `maps/shippedMaps.ts`, their grids' hashes pinned.

## 2. Principles

- **Real assets, real mechanics.** Every boss, room and effect is the cache's own (section 10), and
  every mechanic OSRS has is kept, as bullets to dodge where a survivor game needs it. Zebak's
  thrown rocks are bullets; Ba-Ba's big boulder bursts into bullets.
- **Played by moving.** Weapons fire on their own, so every puzzle is solved by where you stand
  or walk: carrying water by standing under a fall, pushing a mirror by walking into it, fixing a
  pillar by standing at it, choosing an obelisk by which one's nearest your weapons.
- **Fought through waves.** A puzzle room is never quiet. Its waves are what you level up on.
- **Hard, and the Wardens nuts.** Every boss is meant to be learnt, with OSRS's tells, but none is
  a walk. The Wardens are three phases of everything at once.
- **Dynamic.** A room picks its variant on entry, and something about it changes partway.

## 3. How a raid runs

- **Before it**: the invocation board (section 7) on the setup screen, in place of endless, hard
  and expert. What's picked comes to a raid level.
- **The Nexus**: the real room, with the four path doors (Apmeken, Het, Scabaras, Crondis) and the
  entry. Walk up to a door to take its path.
- **A path**: its puzzle room, then its boss in its real arena, then back to the Nexus.
- **Rooms grow with the raid**: the third or fourth path done is tougher than the first, so any
  order plays fair (and Walk the Path levels them up further).
- **The Helpful Spirit**: stands in the Nexus. Walk up to it for a free bundle of supplies, as
  OSRS's, once after any two paths and once after the other two, before the Wardens.
- **Random events**: in the raid only a visitor with a casket comes by (Rick Turpentine).
- **The Wardens**, once all four paths are done, then the chest.

### Behind a quest: Beneath Cursed Sands

The raid's locked behind its quest, as OSRS's is (`MapDef.requires`, checked first in
`isMapUnlocked`), and the quest behind the campaign's desert map. Nobody comes to the Tombs with
nothing bought, so a fresh account clearing Entry isn't a target.

- **The quest** (`beneath_cursed_sands`; `content/cursedSands.ts`, its map at the end of
  `maps/tombsOfAmascut.ts`) is a boss fight in four parts (`MapDef.stages`): Coenus the Head
  Menaphite Guard (11529), the two Scarab Mages (11508), the Champion of Scabaras (11483) and the
  Menaphite Akh (11493, her own animations). Each part's a run of its own, kept once it's won
  (`SaveData.fightStages`), so you can leave and come back to the next, as OSRS keeps a quest's
  progress; only the last beats the map, and that's what opens the Tombs.
- **Its fights**, after the wiki's and then past them (`docs/design/beneath-cursed-sands.md` has
  each one's design and numbers): Coenus is all reach, from the start lunging down a strip,
  sweeping his front and harpooning whoever keeps away, with a shockwave rolling out of him; from
  two thirds his guards (11527, who throw spears) march at you as a wall with a gap (the
  Phalanx), and from a third spears rain down and he charges right across the room. What he
  misses leaves his guard down for the quest's fight button, Point-blank volley. The two Scarab
  Mages are fought at once, and their big spells are channelled: the mage stands with its guard
  down while it casts, and Point-blank breaks the spell. The first fans scarabs, steps through
  the sand, sends a stampede of scarabs across the room with a gap in it, and channels a swarm
  back to it (shoot them, or break the spell and they scatter). Twenty seconds in the elder
  comes up out of the sand, blasting, sinking the floor round you in a lattice of quicksand, and
  calling a sandstorm over the whole room with the only shelter at its feet, where Point-blank
  reaches. From their halves the two cross their spells (a strip from each, find the pocket),
  the stampede comes in two ranks, a noose of scarabs closes and a beam of sand runs between
  them that hurts to cross; kill one and the other's furious. The Champion steps out of the shadows beside you into
  a burst, opens rifts that stay open and rolls rings of darkness out of him, twice sinks into
  the dark while you smother his scarab nests (or he rises healed), and in his dark last phase
  bursts the path you've just walked. The Akh spears her front, dives across the room down a
  strip, casts a wedge of lightning and calls her shadow (11462), the floor sparking under you,
  then throws orbs that follow you and leaves a lattice of sparks, and in her dark last phase
  cages you in lightning and dives at whoever leaves it, her shadow diving with her from where
  it stands (two strips at once); at no hitpoints she stands ten seconds more, untouchable (her
  last stand), her shadow still diving with her. A dive she misses leaves her guard down too.
  Each is in phases (two or three), most with a pause between.
- **The kit's ours**: everyone plays the Sands Delver (`characters.ts`, the desert robes, the
  Crystal bow at level 4, faster, with more hitpoints and 10 a minute back, and a ranger's gear
  worn from the start: `MapDef.fight.gear`), so a fight lasts as long as its hitpoints make it.
  Played, the kit does about 55 damage a second (the bot half that): Coenus 8800, the mages 3300
  and 3900 (fought at once), the Champion 6500, the Akh 8000, three to four minutes each played,
  every phase seen. After a part's won the result screen's button goes on to the next ("Next
  fight"). Their mechanics hit for a little under Phosani's: what wears you down is the next one, not one big
  hit, and the windups (a second for a melee swing) and slow bolts are there to be read.
- **On your own**: it's a quest, played solo as OSRS's is (`MapDef.fight.solo`), so a co-op
  room can't pick it (`isCoopMap`).
- **Where**: the raid's own squares under its own id (the recipe's the same), fought in Akkha's
  arena (`bossArena`), a tomb beneath the sands.
- **Shipped** in `MAPS` with the boss fights (it was dev-only while it was built), so a win's
  kept and opens the raid.
- **The bot** (`FLAT=1 MAP=beneath_cursed_sands DODGE=1 STAGE=0..3`, sands_delver), which on
  these fights steps out of a swing or blast as it winds up and circles a melee boss back
  towards the square's middle rather than backing into a corner (and off its edges), finds a
  wall's gap and presses the fight's button while a guard's down. On 3 seeds: Coenus won 3/3 in
  about 3:00 (`GOD=1` 3:03 to 3:06); the mages 1/3, dying in their phase 2 otherwise, 3:06 to
  3:24 to win (`GOD=1`); the Champion 2/3 in about 3:15 (`GOD=1` 3:12 to 3:20); and the Akh
  0/3, dying in her last phase, 3:23 to 3:32 to win (`GOD=1`). It also reads the mages' tether
  and blasts, her orbs, her cage's gap, her sparks, and the pocket between her dive's strip and
  her shadow's.

## 4. Level-ups and gear without timed waves

The waves no longer run on a clock, but they're still where experience and caskets come from.

- **A room's waves are tied to its puzzle.** It has a set number of them, and each step of the
  puzzle solved sends the next. Every step drops a casket.
- **Stalling is pushed back on.** A room's hazards and swarms grow while nothing's solved, as
  Crondis's crocodiles turn up after about 40 seconds in OSRS.
- **No farming.** Once a room's waves are spent, whatever still comes gives almost no experience.

## 5. The puzzle rooms

- **Apmeken** (first to be built). Eight waves of baboons. "Sight" is a pickup: whoever holds it
  sees which pillar or vent is failing, and fixes it by standing on it. Shamans summon more
  baboons unless killed first, volatiles explode into their own pack, venom baboons leave poison
  lanes. In co-op, corrupted teammates gather to be cleansed.
- **Het** (`HET` in `content/tombs.ts`, `Sim.stepHet`), as OSRS's: the caster statue's beam, to be
  brought round the seal onto the Shielded statue. The room's turned so it's walked north, in at
  the south and out at the north; the caster's in the east alcove and the statue in the west. Its
  way turns four times: some turns have a fixed mirror (45455), always turned right, the rest (1 to
  3, one more from path level 2) a marked spot (45340) for one of as many loose mirrors (45456).
  Loose mirrors glow. Walk into one to pick it up (as many as you like; the HUD counts them), stop
  on an empty spot to set one down, for good, and walk into one set down to turn it, as often as
  you like. Whole barriers (45458) stand about and block the beam. A worn one or two (45462) stand
  on its way, each with a glowing circle beside it: stand in it 3 seconds and it crumbles. The
  beam burns enemies as well as you. Orbs of Darkness cross in straight lines; in a party they
  dirty the mirrors they cross (walk into one to clean it). The HUD's bar shows the caster
  charging. The beam on the statue opens the seal for 9 seconds, and a ring of glowing circles
  lights up round it: it's mined, never hit, only by those standing in the ring, a swing a
  second, for OSRS's damage by Mining level and pickaxe, here the shop's Mining (5 to 7 with none,
  17 to 19 at its last rank), so the seal (119, more for each of the party) takes three openings
  with none and one with the best. The HUD counts what's mined of it. When the seal shuts the
  room's laid out afresh (new spots, the loose mirrors back on the floor, new barriers, no loose
  mirror or whole barrier by the way in, nor on anyone if there's room), so each opening's earned again. The circles are Verzik's
  safe circle (spot animation 1581).
- **Scabaras.** Three of four puzzles in a random order, then the number tablet, with scarab
  swarms chasing throughout: memory tiles (walk the sequence), Lights Out plates (enemies can knock
  you onto the wrong one), obelisk order (your weapons hit the nearest), and the tablet (walk over
  glyphs that add up to the target; over sends a punishment wave). Take too long and tiles shuffle.
- **Crondis.** You carry the water: stand under a fall to fill up, walk it to the palm, and a hit
  spills half. Falls dry up and move. Crocodiles go for the palm and drink from it. Spike statues
  fire down lanes, and poison clouds sweep the room, light (a warning) before dark.

### The Apmeken room, as it'll be built

- **The room**: square 59,82, cut from world 3790,5267, 37 by 28. The entry is on the east (local
  49,31) and the exit on the west (15,30), each behind a barrier (45135, x 20 and 44, y 31 to 33)
  that holds until the room's done. Apmeken's statue (45496) stands in the middle.
- **Pillars**: the four roof supports (45494, 3 by 3, local 27,21 35,21 27,41 35,41), whose own
  animation (9503) is a pillar giving way. **Vents**: the four red grates in the main floor's
  corners (ground decoration 5982, about local 24,37 25,28 40,37 41,28). The six holes in the walls
  (45024) are where OSRS's baboons crawl in. The crates of hammers (45497) and potions (45498) are
  scenery: here the fix is standing at it.
- **The loop**: "You sense an issue" every so often, and a pillar or a vent shows it. Stepping on a
  vent fixes it at once (OSRS drops a potion in), and a pillar takes about a second (a hammer's hit); one left too long hurts everyone, more for each left. Each fix is a
  step: it sends the next of the room's eight baboon waves and drops a casket. After the eighth,
  the west barrier opens to Ba-Ba. Sight is everyone's solo; in co-op one player holds it and only
  they see which needs fixing.
- **Baboons** (all on skeleton 2063: idle 9741, walk 9739; attacks among 9742 to 9751, the death
  likely 9744 or 9745, to look at): brawler 11709/11712 (melee), thrower 11710/11713 (thrown rocks,
  as bullets), mage 11711/11714 (spells), shaman 11715 (summons thralls 11718 unless killed first),
  volatile 11716 (explodes, hurting its own pack too), cursed 11717 (curses: weaker for a while).
  Waves as OSRS's: the first two brawlers and a shaman, the eighth a shaman, two volatiles and two
  of the specials.

## 6. The bosses

- **Ba-Ba** (first to be built): rolling boulders in lanes, with a cracked one in each row that
  can be shot; rockfall, a shadow and then a rock throw to take cover from behind debris or a
  sarcophagus; her big boulder bursting into bullets; the shockwave cone; baboons setting off the
  sarcophagi.
- **Akkha**: prays against your style and swaps (the Theatre's colours already do this); four
  quadrants with their effects (fire burns, shadow drains, lightning blocks prayer, ice slows);
  shadows to kill before their bars fill (OSRS's at 80/60/40/20%, here at 66 and 33%); Memory
  Blast's safe quadrants; trailing orbs that come wherever you move, so the answer is to stand
  still.
- **Kephri**: fireballs on marked tiles; Dung Strike; eggs that burst unless killed; her shield's
  scarab swarms, running at her from six spawns, each one that gets there restoring it, so your
  weapons have to cut them down; spitting, arcane and soldier scarabs.
- **Zebak**: rocks and splitting pots as bullets; Great Roar (hide behind a boulder); the tidal
  wave with a gap that shrinks; poison pools that a pushed jug washes away; an enrage below 25%.
- **The Wardens**, three phases:
    1. The obelisk, with orbs down troughs (soaking a side's picks which Warden comes next) and the
       floating pyramids.
    2. The Warden, with the obelisk's converging, windmill and lightning-skull patterns, style
       changes, the freezing projectile, and its core thrown out for five times the damage.
    3. Floor slams, energy siphons to destroy, two path bosses' phantoms (Akkha and Kephri with
       Elidinis' Warden, Zebak and Ba-Ba with Tumeken's), and at 5% the enrage: lightning in the
       slams' place and the floor falling away row by row.

### The Wardens' third phase floor (for when they're built)

The owner's ask: the real floor, with its tiles moving under the slams, as tech for other maps too.
What the cache has, in square 61,80: a grid of plates, each its own loc id (45650 on, one a plate,
4 by 4 in the middle and 4 by 2 along the edges, plus edge pieces 45715 to 45725), none with an
animation of its own: OSRS's server moves them. So:

- **Each plate a model the game draws**, baked as a loc (as the cannon is), at a height the sim
  sets: sinking, shaking as a warning, or falling away. The motion's ours, as the cache has none.
- **Collision that changes**: the map's collision is an array the sim reads every tick, so a plate
  gone blocks its tiles. It's kept per map across runs, so a run puts it back when it ends.
- **The slams**: a half of the floor shakes, then drops and comes back (right, left, both). **The
  enrage**: plates fall away for good, row by row from the back.
- **For other maps**: moving plates as a feature of their own (any loc a map marks, with its height
  and collision the sim's), for collapsing bridges, rising platforms, trap floors.

## 7. Invocations

`content/invocations.ts`. They replace endless, hard and expert there: the Theatre of Blood keeps
its switches. Only one of a group marked `one` (attempts, time limit, Helpful Spirit, path level)
is on at a time. Each adds to the raid level, which sets the whole raid's scale
(`RAID_LEVEL_SCALE`, the map's own difficulty being a first map's): enemies' hitpoints and
damage, bosses' hitpoints, and how many bullets a boss's patterns fire, through points at 0, 150,
300 and 500, each growing by the same share a level between them. Entry is for a run that's
bought nothing: weaker than a first map, and it can be won from scratch, slowly. Normal wants the
shop's upgrades and better gear, Expert more, and past it bosses climb quicker and quicker. A
room's enemies rise more gently than its bosses: a run levels up on them from level one. It also
raises raid points and the purple chance. Bands: Entry under 150, Normal under 300, Expert from
there.

A puzzle room's worth two levels as it's done, whatever the raid level. For a run with nothing
bought the raid goes easier the lower it is: a boss's adds drop food, and food spills as each of
the Wardens' phases ends, less of both the higher the raid level and none from Expert up; and
below Normal, hits that take a share of your hitpoints take less, Crondis's crocodiles come fewer,
and the path level counts for about a quarter. The path level itself scales gently
(`APMEKEN.levelHp`, `TOMBS_BOSSES`), as OSRS's does.

| Group          | Here                                                           |
| -------------- | -------------------------------------------------------------- |
| Attempts       | revives for the whole raid, down to none                       |
| Time limit     | a clock for the raid; running out lowers the loot, not the run |
| Helpful Spirit | smaller supply picks                                           |
| Path level     | more puzzle, faster hazards, denser bullets                    |
| Paths          | Walk the Path: finishing a path levels others up               |
| Prayer         | armour stops less; a hit leaves you open                       |
| Restoration    | no food, no regeneration, specials less often                  |
| Each boss      | OSRS's own: Boulderdash's boulders twice as fast, and so on    |

The raid level's scaling works now, for every invocation (the sim's `hardScale` is the raid
level's there), and so does what each does besides: the board's "Not in yet" (`comes`) is gone from
all of them. The time limits (Walk for It to Sprint for It) are on the run's clock, which stops in
the Nexus: past it, the chest goes by a raid level lower by the drop (`TOMBS_TIME_LIMITS`), and the
board says so. The Helpful Spirit's three leave 66%, 33% and 10% of each bundle, as OSRS's, never
an empty one (`TOMBS_SPIRIT_SHARE`), and Dehydration none that heal.

## 8. Loot

What the chest's uniques do, decided 2026-11-04. The chest goes by the raid level (section 7), as
the Theatre of Blood's goes by raid points. As the Theatre's rapier and scythe do, a unique
unlocks something in the game.

- **Osmumten's fang, Tumeken's shadow, Lightbearer**: in the game now without the raid (the two
  weapons from the start, the ring from caskets). The chest's unlocks them. Anyone who already has
  them, or played before the change, keeps them.
- **Masori mask, body and chaps, Elidinis' ward**: the last Armoury step of the Armadyl pieces and
  the Arcane spirit shield needs the chest's piece before it can be bought. Upgrades already bought
  stay.
- **Tumeken's guardian**: a pet (`content/pets.ts`, once pets are in).
- **The jewels: the keris partisans**, a new melee family (all in the cache: 25979, 25981, 27287,
  27291, and of Amascut 30891). Kalphites and scarabs are in the game already (the desert, the
  Kalphite Queen, Kephri's scarabs), so their bonus has something to hit.
    - **Keris partisan**: killing the Kalphite Queen in the Kharidian Desert (OSRS gives it for
      Beneath Cursed Sands, a desert quest). Fast stabs, a third more against kalphites and scarabs.
    - **Of breaching** (Breach of the Scarab): now and then a gap in the shell for triple damage,
      far more often against kalphites and scarabs.
    - **Of corruption** (Eye of the Corruptor): every so often Wrath of Amascut, a big stab whose
      target takes 25% more from everything for 6 seconds.
    - **Of the sun** (Jewel of the Sun): heals on every kill and hits harder below 25% health;
      Tumeken's Light, on a long cooldown, heals in full and cures poison.
    - **Of amascut** (Jewel of Amascut, raid level 500): the three jewels in one, but for
      Tumeken's Light: a keris has one special attack, and this one's is the Wrath.
    - **In the game** (`KERIS_PARTISANS` in `content/weapons.ts`): one `family`, so one a run;
      the plain one from the Queen's second form (`kalphite_queen_risen`, where her kill counts);
      the rest `raidChest` unlocks on their jewels. Kalphites and scarabs, Kephri and her
      scarabs too, carry the `kalphite` tag (not the Scarab Mages, who are men), and `slayer`
      gives them the third. Breaching is
      `WeaponDef.breach` (6% a stab, 30% on a kalphite, triple, diamond bolts' Armour Piercing on
      it); Wrath of Amascut is a `special` every sixth stab (1.5x and a 25% `drain` for 6 seconds,
      OSRS's own keris special animation); the sun's are `killHeal` (the stab's own kills, and
      none of what's part of a fight, its `noDrops` summons), `lowHealth` and a `restore`
      special every fortieth stab (Tumeken's Light's own cast, Heal Group's light on you; it ends
      the spores' drowsiness too). The
      keris partisans are held as a spear, the Zamorakian hasta's stance and the dragon spear's
      stab.
- **Thread of Elidinis: the Divine rune pouch.** In OSRS the thread on a rune pouch makes the
  divine pouch, four runes instead of three. Here the thread puts the pouch in the level-up
  choices, as a rare passive, for every adventurer. It takes a passive slot (the price, and with
  it maybe an evolution, since passives are what weapons evolve with) and gives a slot that holds
  a magic weapon only, at one level. Holding it, magic weapons are offered to an adventurer of any
  style, for that slot. So a melee or ranged build can carry the third style the Theatre of
  Blood's expert mode asks for (its Nylocas take nothing from the wrong one), and a magic build
  gets one more spell. (It was magic adventurers only at first; that did nothing for expert.)
  In the game it's the `divine_rune_pouch` passive (`content/passives.ts`, one level), unlocked by
  the Thread. `Sim.maxWeapons` counts its slot, and `fitsWithPouch` in `core/Upgrades.ts` keeps
  it for magic: a weapon that isn't magic fits only in the other slots, and one magic weapon of
  another class can be taken. Its one level holds in endless too (`PassiveDef.noOverlevel`).

### Combat Achievements

Combat Achievements are PR 110 (`content/combatTasks.ts`, `core/CombatTracker.ts`), which already has
the Theatre of Blood's tasks. Once it's merged and the raid's done, the Tombs get tasks matched to
OSRS's own ToA ones, mostly on its goal kinds (`kill` with `within` or `without: ["hits"]`, `win`
with rules, `beatMap`):

- **Each path**: its boss with no deaths, within a time, and its mechanic done right (Ba-Ba with no
  boulder hits; the Apmeken room with no pillar or vent left to go).
- **Raid level**: beat at Entry, Normal (150), Expert (300) and up to 500, a raid level on
  `beatMap`.
- **Invocations**: a Hardcore Run, and Insanity once the Wardens are in.
- **The whole raid**: no deaths, and a speed run.

## 9. The order it's built in

Each a pull request, merged with the raid still a dev map:

1. **The base** (this): this document, the dev map with the Nexus cut from the real raid, and the
   invocation board with its raid level.
2. The Apmeken room.
3. Ba-Ba.
4. Het and Akkha, Scabaras and Kephri, Crondis and Zebak, a room then its boss each time.
5. The Wardens.
6. The Helpful Spirit, the chest and its points, the bot and the Tombs' sim.

As it went (decided November 2026): everything to 6 went into one pull request, still a dev map,
for other contributors to play and suggest changes before it goes live. Then: what the uniques
unlock (section 8), and moving it to the Raids tab.

## 10. What the cache has

Cache `osrs-242_2026-11-03` (rev 242 moved the invocation board's sprites up 4139 from rev
241's). Ids from `scripts/cache/find-npcs.ts`, `find-locs.ts` and `dump-square.ts`; the spot
animations from a lister of those whose model or animation is in the raid's ranges.

- **Rooms** (map squares, all with terrain and readable locs): Nexus 55,80; Scabaras 55,82; Kephri
  55,84; the tomb 57,80; Het 57,82; Akkha 57,84 (plane 1); Wardens' first two phases 59,80;
  Apmeken 59,82; Ba-Ba 59,84; Wardens' third 61,80; Crondis 61,82; Zebak 61,84.
- **Ba-Ba** 11778 to 11780 (idle 9741, walk 9737); her rolling boulders 11782 and 11783 (size 3);
  baboons: brawler 11709/11712, thrower 11710/11713, mage 11711/11714, shaman 11715, volatile
  11716, cursed 11717, thrall 11718.
- **Akkha** 11789 to 11796, his shadows 11797 to 11799, the orbs: lightning 11800, darkness 11801,
  burning 11802, frozen 11803, unstable 11804.
- **Zebak** 11730/11732, his tail 11731/11734, jugs 11735/11736, waves 11738 and 11739.
- **Kephri** 11719 to 11722, her swarm 11723, soldier 11724, spitting 11725, arcane 11726 and
  agile 11727 scarabs.
- **The Wardens**: the first form with its obelisk 11746 to 11749, fighting 11753 to 11757, the
  last 11761 to 11764, the obelisk 11750 to 11752, the core 11770/11771, the energy siphon 11772,
  the phantoms of Zebak 11774, Ba-Ba 11775, Kephri 11776 and Akkha 11777.
- **Pets**: Tumeken's and Elidinis' Guardians (11652/11653), their damaged recolours, Akkhito,
  Babi, Kephriti and Zebo. Tumeken's guardian, the chest's pet, follows as 11812 (idle 9655, walk
  9651).
- **The chest's uniques** (`trophies.ts`): Osmumten's fang 26219, Lightbearer 25975, Elidinis'
  ward 25985, the Masori mask, body and chaps 27226/27229/27232, Tumeken's shadow 27277, Tumeken's
  guardian 27352, the thread of Elidinis 27279, the breach of the scarab 27283, the eye of the
  corruptor 27285, the jewel of the sun 27289 and the jewel of Amascut 30893. The Helpful Spirit
  is NPC 11694 (idle 2906), and its supplies are 27315 to 27347 (`TOMBS_SUPPLIES`).
- **The Wardens' last floor**: its slabs and rubble 45585 to 45645 (`LocOverrides.ts`).
- **Locs**: the path doors 46155 to 46166 and the entry 46167; Het's mirrors 45455 to 45457, its barriers 45458 to 45464; Zebak's
  waterfall 45398/45399; pillars 45530/45531; pressure plates 45340/45344 and tiles 45356 to 45364;
  the Ancient button 45338 and Ancient tablet 45339;
  Ba-Ba's throne 45756 and sarcophagi 45752/46044; the invocation board 46073.
- **Spot animations** about 2114 to 2271: the puzzle rooms 2114 to 2140, Kephri 2141 to 2171,
  Zebak 2172 to 2192, the Wardens 2201 to 2241, Ba-Ba 2242 to 2246, Akkha's elements 2249 to 2255.
  Which is which is a guess from their neighbours until each is looked at.
- **Not there**: the Het beam isn't a loc or an NPC, so it'll be drawn from one of the puzzle
  rooms' spot animations if one fits. Many of the rooms' props have no name, and `find-locs.ts`
  can't list them: `dump-square.ts` with `WHERE=` can.

## 11. The base, as built

- **The map**: `scaperune/maps/tombsOfAmascut.ts`, at map squares 86 to 93 by 66 to 69: a grid of
  one-square cells, six by two, one for each room, with only the Nexus filled so far. The Nexus is
  cut from world 3536,5130 (32 by 36), stood level, and sealed to what can be walked to from the
  entry: 303 tiles. (At first it was listed in `maps/devMaps.ts`, which a build leaves out; it's
  in `maps/shippedMaps.ts` now.) A shipped map gets the catalogue's ban on the raid's own floor as
  warnings only.
- **The Nexus doors**: `MapDef.tombs.paths`, each with its door's middle. Walking up to one says
  it isn't open yet (`Sim.stepTombs`), once as you come up to it.
- **The board**: Invocations in the setup bar, with the raid level and its band, opens the board.
  What's picked is kept in the save (`SaveData.invocations`) and goes to the run as
  `SimOptions.invocations`. Up to five setups save as presets (`SaveData.invocationPresets`), each
  loaded in one go. They go by name, and one left blank is named by its raid level, so a blank
  save replaces the last at that level with one press (its button says Replace; Delete takes
  two). A level name follows the level as an update changes it (`cleanInvocationPresets`).
- **Ba-Ba** (`content/tombs.ts`, her fight in `Sim.stepTombsBoss`): her arena's cut turned so her
  throne's north, and she rises once the party's a step past the gap at its foot. Her attacks:
  the shockwave round her (a ground mark); rockfall, shadows in a cross on your tile (a `cross` of
  ground marks, `shadow`) with a rock coming down into each; her boulder, which comes down beside you
  (never on you: `beside`) under its shadow and OSRS's falling debris (1727), breaks into shards and
  stays as a Rubble rock (11784 to 11787, solid: `leavesCover`); the avalanche that follows it, most
  of your hitpoints unless you're beside a rock (`takeCover`, the safe ground ringed in green); and
  calling baboons. The shadows are drawn on the overlay: no spot animation in her range is one.
    - **Rolling boulders**, at 66% and 33%: she goes up to her altar and the party's put at the
      foot. Rows of five boulders roll down five lanes (`BulletPatternDef.gapStep`), one of them the
      cracked boulder (NPC 11783, `cracked`), an enemy that rolls with its row (`Enemy.rolls`) to be
      broken, at most two lanes from the last row's. A hit knocks you back. Getting back up to her
      altar's rows, anywhere across, ends them.
    - **Sarcophagi**: the eight along the floor's sides (45752). Her baboons make for the nearest
      closed one (`summon.sarcophagi`, `Enemy.seeks`) and pry at it for a few seconds; one that
      gets it open (45753 drawn over it) has it fire fans of red bolts (2246) across the arena.
    - **Invocations**: Mind the Gap (the gap at the foot, where her barrier stood, kills),
      Boulderdash, Shaking Things Up, Jungle Japes (banana peels root you, drawn as the Banana) and
      Gotta Have Faith (the sarcophagi's bolts hit harder: there's no prayer here to scale by).
    - **Her stomp** (`BossDef.stomp`): whoever's right up against her (within `stomp.radius` of
      her middle, which her solid body leaves you at) is stomped, harder each time they stay. A
      red ring fills at her feet before each (`GameView.drawBossWindups`), the first waits a
      moment (`stomp.first`), each lands with a flash, and the first says what it is. Without
      those, players took it as damage from nowhere.
    - Her hitpoints go up with the path level (`TOMBS_BOSSES`), as does each path's boss's.
    - Her boulders are drawn as her Boulder NPC (11782) rolling (9518): the rows
      (`BulletPatternDef.look`), the shards, and the boulder that drops into each rockfall and boulder
      circle over its warning (`BossAttackDef.falls`). OSRS's own falling-rock spot animations (1727, 2250) are cave-ins made for its low camera: from ours the rock stays off the top of the
      screen.

- **Akkha** (`content/tombs.ts`, his fight in `Sim.stepAkkha`), the Het path's boss, after its seal
  breaks. His arena is square 57,84 on plane 1, brought down (`bringDown` in `prefab.ts`) and turned
  so you walk in from the south. Its floor is stone pieces on the plane under it (45872 to 46037),
  brought along and sunk to the ground with their blocking off (`LocOverrides.ts`), so the dial and
  its four symbols are the real thing. The quadrants' elements follow the floor's symbols as they
  lie once it's turned: darkness north-west, lightning north-east, ice south-east, fire south-west.
    - **Styles**: a form for each (`akkha`, `akkha_ranged`, `akkha_magic`), each praying against
      its own, and blocking it whole, as OSRS's overheads do: a hero with one style waits out that
      form (a twisted bow found early took a fresh ranger's Akkha from 4 minutes to 1:23 when the
      prayer let a quarter through; it's 3 now). Every seven attacks (six with Stay Vigilant) he does a special and turns to another.
      Melee swings and stamps out a ring; ranged fires fans and a spiral of sand; magic rings and
      streams red sand, which brings the element of the quadrant it hits you in.
    - **Memory Blast**, Simon says: he vanishes to the middle and can't be hurt, the symbols light up
      one at a time (each beside the last, never across), the quadrant glowing with its element and
      its floor symbol lit in the element's colour (`AkkhaElementDef.glow`) in a funnel of light
      (darkness's own swirl, 2257, tinted for each). His room's in full light for the fight
      (`AkkhaDef.ambient`), not the Tombs' dimmer light. Then, 2.4 seconds apart (1.2 with
      Feeling Special), every quadrant but the next in the order is
      blasted for nearly half your hitpoints and its element, each throwing up a spray of its
      element's orbs, bright in its colour (drawn only). Four steps, one more every two path
      levels, up to `memory.most`. He comes back where he vanished, or with a shadow of his dead,
      just inside its quarter (`Sim.akkhaReappear`), where he can be hurt. His next special waits
      till he's been back as long as he was gone, and `AkkhaDef.specialGap` at least, however many
      attacks he's made.
    - **Trailing orbs**: for a while, an orb (its quadrant's, 11800 to 11803) on every tile anyone
      leaves, armed after a moment, going off under whoever steps on it. Standing still drops none.
      Feeling Special drops one three tiles ahead too.
    - **His shadows**, at 66 and 33% (OSRS's at 80, 60, 40 and 20%): no hit carries him past
      one, so they always come. An Akkha's Shadow in each corner, each 70/400 of his hitpoints as
      OSRS's are, and he can't be hurt except well inside a quadrant whose shadow is dead (his
      middle a tile clear of the lines between them), so you kill one and draw him into its
      quarter. Only one: once a shadow's struck the rest are shielded, as the wiki says to focus
      one, till they're restored at the next threshold. He walks through his own shadows (they
      don't push him as other enemies do): they never move, so one in his way would hold him off a
      dead one's quarter. With one dead he comes on at whoever he's after while his volleys go out
      (`Sim.akkhaDrawn`; still standing to wind each up), as OSRS's is dragged: standing for every
      volley, his ranged and magic forms hardly took a step between specials, so he was never
      drawn in. One timer (the HUD counts it down) runs for them all: when it's out, every quadrant
      whose shadow's still up floods for half your hitpoints and its element, and it starts again.
    - **Final stand**: at 0 he rises (`rises`) as `akkha_enraged` with a fifth of his hitpoints, in
      a corner, praying against ranged and magic (mostly, not whole as OSRS's: a hero here keeps to
      one style, and a wizard with no melee would never finish him), and sends Unstable Orbs (11804, their arrows the
      way they go) straight or slanting across the floor. He moves corner once he's lost a share of
      his hitpoints there, or after a while.
    - **Invocations**: Double Trouble (both specials at once), Keep Back (beside him, his ranged and
      magic bring an unseen melee hit), Stay Vigilant, Feeling Special.
    - **Detonate**, in a party only (a third of his specials there, not with Double Trouble):
      everyone's marked (white, flashing), and 3 seconds later each goes off in a plus round their
      tile (an X instead, half the time, with Feeling Special), a third of the hitpoints of whoever
      else is on those tiles. Off each other's rows and columns, or all on one tile, nobody's hurt.
      The bot steps away from a teammate within two tiles.
- **The Scabaras room** (`SCABARAS` in `content/tombs.ts`, `Sim.stepScabaras`): square 55,82 whole,
  turned a quarter clockwise so it's walked up the screen as the rest of the raid is: in from the
  south behind a barrier across the way in (the sim holds it: `gate.y`), out to Kephri at the north,
  the cut's north hall now the east and its south hall the west. The map's constants stay in the
  cut's own tiles, turned by `scabarasTile`. OSRS spawns its plates as the room starts, so the
  boards are drawn by the client (`GameView.drawScabaras`) with the cache's own plates, on tiles
  whose patterned floor decoration (45380) the map leaves out. The boards follow the wiki's
  strategy page (Tombs of Amascut/Strategies, Path of Scabaras), its screenshots and its text. All
  four puzzles are needed (OSRS's solo takes one a side, then the last), each a casket and the next
  wave. A plate's stood on by standing on its tile, so a diagonal step crosses no other:
    - **The slates** by the way in, one on each wall, as OSRS's: stand by one and a screen shows
      Addition's nine symbols, the floor's own models seen from above (`ItemIcon`'s `locId`,
      `ItemIconLoader.renderLocIcon`), each with what it's worth (drawn with the Ancient tablet,
      45339). On a touch screen the slate's one thin row along the top instead, with no names,
      since with no zoom the middle of the screen is the floor you're about to step on (the
      tablet's panel is as it is elsewhere).
    - **Sequence** (the east hall, by the way in): OSRS's nine plates in a diamond, and its Ancient
      button (45338) on the wall beside them. Push it (walk up to it) and they light one at a time
      (0.8 s each), 4 steps, one more every two path levels, up to 6; push it again for another
      order. Step on them in order; a wrong plate, one not in the order included, drops the roof on
      you, and the button's to be pushed again.
    - **Lights out** (the west hall, by the way in): a ring of 8, each toggling itself and its
      neighbours, scrambled by 3 presses plus the path level. A scarab knocks a light out every 14 s
      (less with levels).
    - **Addition** (the east hall's middle room), once Sequence and Lights out are solved: OSRS's
      own 5 by 5 board (`SCABARAS.additionBoard`, read off the wiki's screenshot and checked
      against its chart), symbols worth 1 to 9 (Line to Foot), laid with the exit at its top so the
      wiki's chart of a way across for every number reads as it's seen. The Ancient tablet in the
      corner south-west of it shows its number, 20 to 45, on a screen while you're by it (and the
      HUD keeps it), dark till the two before are solved. Walk over symbols that add up to it, each
      once; past it, the roof comes down and they reset.
    - **Matching** (the far, north room, last): two boards of the same nine symbols either side
      of the chasm, shuffled apart, each tile's symbol on it from the start as OSRS's are (they
      were hidden at first, which left only guessing): find each one's partner on the other
      board. A pair that matches stays; one that doesn't drops the roof. Solo, 4 are done as it
      starts, as OSRS's are, one fewer each path level; in a party none.
    - A mistake takes a quarter of your hitpoints, through armour. Meanwhile rocks fall near
      everyone every 4.5 s (down to 1.8 with levels), shown by 302's falling roof, and every rock
      breaks into shards, bullets out all round. Scarabs (11697, ranged) and Kephri's swarms
      stream in from the passages.
    - The HUD lists the four (`Sim.scabarasInfo.puzzles`): each done, open, or waiting (Addition on
      Sequence and Lights out, Matching on the other three), with where it is and what it wants.
    - **The puzzle helper** (`DisplaySettings.puzzleHelper`, `GameView.drawScabarasHelper`), as
      OSRS's ToA plugin: Sequence's plates numbered as they light, the next outlined; the fewest
      Lights out plates to step on (`solveScabarasLights`); Addition's way to the tablet's number,
      the board's own for each number (`SCABARAS_ADDITION_WAYS`), a way on from a first step off
      it onto an edge symbol (`SCABARAS_ADDITION_FROM`, from whichever stepped symbol has one), or
      a capped search on from what's been stepped on (`searchScabarasAddition`), or from beside
      the hero when they're inside the board with nothing stepped on (it reset under them), the
      board's own way if that finds none in time; Matching's tiles named in their symbol's colour.
      On at Entry, and at any raid level once the room's been beaten (`SaveData.scabarasBeaten`,
      from `Sim.scabarasBeaten`, a loss included). Client only. Its marks are flat tiles and
      names drawn over the floor, as the plugin's are: nothing in the cache marks a tile.
    - Not in yet: the obelisk puzzle (OSRS's random one, which the wiki has solos skip).
    - Matching's room, west, is walled off in OSRS by barriers (45135, 45375 to 45379) that open
      once the other three are solved. Cut with the room they never opened, so nobody could finish
      it: they're left out, and its tiles won't turn till then anyway.
- **Kephri** (`KEPHRI` in `content/tombs.ts`, `Sim.stepKephri`), the Scabaras path's boss, after its
  room. Her arena is square 55,84's floor, cut without the teleport crystal's room past its chasm and
  turned a quarter clockwise, so you walk in from the south. She sits in its middle on the dais, as
  OSRS has her, and never moves.
    - **Her attacks**, as data: fireballs (Vorkath's firebomb, 2167) down on where you stood under
      their shadows, twice, each breaking into shards; rings of scarab spit with a way through; her
      swarm spiralling out both ways; and Mass Incubation, eggs thrown round the arena: dark ones
      hatch an Agile Scarab, the light one goes off in a 3 by 3 and breaks into shards unless
      it's broken first.
    - **Her three shields** (2141 round her), as OSRS's: each takes a third of her hitpoints in
      hits, and her own hitpoints aren't touched till the third's gone. Her bar shows the shield
      and which of three it is. After the first two break, she's dazed (11720) and shielded, and
      doesn't attack while swarms (28, then 24, more with path levels) come round the arena's edge
      clockwise from six holes, one every 4 game ticks, then 3, 2 and 1, sometimes three at once
      from path level 2. Each that reaches her overcharges the next shield (a tenth of it, 15%
      over at most). Her overlords come too, where OSRS has them: a Spitting Scarab north-east of
      her, then a Soldier east (whose swarm feeds her shield every 5 s) and an Arcane Scarab
      south-east, which charges and then sends a ring of red swarm all round unless it's hit hard
      enough to fly off (north-west, the middle of the south, north-east) and start again. It's
      over once the swarms and overlords are all done, and she's behind the next shield.
    - **Dung Strike**: flies round you (2146) for 1.8 s, then she throws you straight back from
      her, stunned for 2 s, with dung left along the way as walls for a while.
    - **Her last**: the third shield gone, she's back with a quarter of her hitpoints as 11721, her
      swarm gone, throwing the whole party back; swarms and the Soldier heal her hitpoints now.
    - **Invocations**: Lively Larvae (two more dark eggs), More Overlords, Blowing Mud (two
      thrown back), Medic! (swarms between her shield's breaks too, at half speed), Aerial
      Assault (bigger, harder fireballs).
    - Her phantom's the Wardens' (phase three).
- **The Crondis room** (`CRONDIS` in `content/tombs.ts`, `Sim.stepCrondis`): square 61,82 from local
  x 10, turned half round so it's entered from the east behind its barrier. Grow the Palm of
  Resourcefulness (11700 to 11704, a stage a quarter, never hurt, its bar its growth) with 300 water,
  more for each of the party and each path level: each stage a casket and the next wave.
    - **Water**: stand at a running waterfall (out of the map, drawn running or dry by the client) to
      fill your container, 100, and it's dry for 10 s after. Near the palm you pour it.
    - **Spears**: each corridor's crocodile statues thrust their spears out across a pair of rows at
      a time, down the corridor, the side turning about, then rest; a tell first: the spear
      glinting out a tile, and the tiles it'll reach marked on the floor
      (`GameView.drawCrondisSpearTells`, yellow, as the floor's red; players found the glint
      alone too hard to time). **Poison** comes down each corridor from its waterfall's end every
      9 s (less with path levels): pale first, the dark cloud a second behind it. Under a
      waterfall (where you fill) it doesn't reach you, running or dry, as in OSRS. It's the
      Spitting Scarab's green splash (2155), faint for the pale: the room's own spot animations
      (2129 to 2131) draw nothing, and its poison floor tiles' activation can't be baked (a loc
      bakes with its own animation only).
    - A trap's hit, or a crocodile's bite, spills half your water, and a trap weakens you. Crocodiles
      (11705) come in from the palm room's corners; the hungry ones make for the palm and eat its
      growth, never below the stage it's reached.
- **Zebak** (`ZEBAK` in `content/tombs.ts`, `Sim.stepZebak`), the Crondis path's boss: the great
  crocodile (11730) lying in the water north of his island, never moving. His attacks are a pot
  that splits into red orbs, a rock that splinters, and acid sprayed. At 85, 70, 55 and 40% a
  special, turn about, each with acid pools (45570) and jugs spat over the island:
    - **Acid**: 3 by 3 pools that hurt more the longer you stand in one, and poison, until a jug's
      water or a wave clears them.
    - **Jugs** (11736): walk into one and it rolls off the way you pushed it, breaking on a boulder,
      the island's edge or at the end of its roll, its water clearing the acid round it. Weapons
      pass them by (`EnemyDef.unhittable`): hit, they broke the moment they were down.
    - **Great Roar**: boulders across the island, then three roars a few seconds later, each a
      fifth of your hitpoints and a knock back, unless you're straight behind a boulder, down the
      island from him, as OSRS's shelter is (`zebakShelters`; it was a slant on the line from him).
      While it's coming, that ground glows behind each boulder (Verzik's circle, as the Het room
      has); as it goes off, blown dust (2184) rolls out from him over the whole island but those
      shadows, the boulders drawn on through it (gone from the sim already), and the camera
      shakes. Without them a roar read as a big hit from nowhere.
    - **Tidal Waves**: two waves across the island (11738), up from the south then down from the
      north, each with a gap to stand in, narrower with path levels; they wash away his acid.
    - **Enrage** below 25%: quicker, with no more specials.
    - **Invocations**: Not Just a Head (blood clouds up the steps after you, wasting as they come,
      healing him if they reach you), Arterial Spray (they heal more), Blood Thinners (three at a
      time), Upset Stomach (wider acid, less water from a jug).
    - His island is a deck a level up in OSRS, behind invisible walls (38848, 2639), and cut with
      the room it was a piece of its own nobody could walk onto: its east edge's walls go and its
      edge is floor (`ZEBAK_EDGE`). A roar or wave that wipes the party doesn't throw it from where
      the room starts over.
- **The Wardens, phase one** (`WARDENS` in `content/tombs.ts`, `Sim.stepWardens`): their room, square
  59,80 on plane 1, turned half round so you come in from the south. Its floor is mostly the hidden
  overlay over the plane under it, which OSRS draws: that plane's floor colours, its pieces on the
  floor, and its tall pieces under the raised border, sunk to it (`LocOverrides`). On the dev server
  the Nexus has a button straight to it with the best of everything (`Sim.devToWardens`).
    - The obelisk (11751, the boss bar) is what's fought, tougher with the path level as a path's
      boss is, and with enough hitpoints that the Wardens get their attacks in. Elidinis' starts 50 of
      125 charged and Tumeken's 0, so the first attack comes about 9 s in and the two never
      discharge together unless soaking brings them level (both sets of pyramids at once would
      leave no cell clear, and both shots at once are half a bar).
    - The obelisk won't go below a quarter of its hitpoints till a Warden's first pyramids have
      come and gone (`WARDENS.holdShare`): OSRS's lasts long enough that they always come, and at
      Entry, with little to hit it with, it was broken before either Warden had charged.
    - Orbs (11769) leave it each side every 1.2 s, a tile every 0.6 s for 8, down one of three
      troughs in a side's own order, each one there charging its Warden 4 (Ancient Haste 6). An
      orb a player walks into along its trough (anywhere but its spawn tile) is soaked: its Warden
      gets nothing, and the player carries its energy, each worth 20% more against the obelisk,
      one fading every 4 s, five held at most; a sixth while full overcharges them for 10% of
      their hitpoints (`WARDENS.orbs.soak`). So starving a side picks the Warden that wakes, and
      catching orbs is the quick way through the phase, with no standing still (the old block, a
      player stood on the gap tile taking damage each orb, is gone: at Expert it was 140 a
      minute, and the game's not meant to be played taking hits).
    - The Wardens (11748, 11749, nothing hurts them) charge 2 a tick besides; full at 125, the
      platform under them filling (45606 to 45626, drawn by the game), they discharge (9667, the
      seal 2214/2215) and take turns: pyramids (45750/45751) on every other 3 by 3 cell of the floor,
      Elidinis' the odd ones, hurting whoever's under one as they glow; then a shot (2238/2237)
      that arcs after each player for 8 s and lands for a share of their hitpoints.
    - The obelisk broken, the Warden that's charged the more over the whole phase (what it's spent
      on attacks and what it holds) wakes, Tumeken's on a tie, so the side a player kept soaking
      loses however recently it attacked. The other blows up (2216) and is left a wreck (11759,
      11760).
- **The Wardens, phase two** (`WARDENS.two`, `Sim.stepWardensTwo`): the same room.
    - The Warden wakes (9663) and steps out of its alcove, a boss in two forms (11753/11754
      Elidinis', 11756/11757 Tumeken's), each hurt by one style alone (Elidinis' opens to magic,
      Tumeken's to ranged), its bar its shield filling. Tumeken's walks up to you and slashes;
      Elidinis' keeps her distance. Both throw skulls (2224 red, 2241 plain), a fan of them, and
      stone where you stand (2210, a shadow first) that holds you a moment.
    - Its shield full (3.5% of its hitpoints), it kneels (9670, the exposed form) and throws its core
      out (11770/11771): what the core's hit for comes off the Warden five times over, for 12.6,
      17.4 or 22.2 s by how low it is (OSRS's 21, 29 and 37 ticks). Then it stands (9672) open to
      the other style. About three times down with the best of everything, standing close.
    - The obelisk (11752, charged, can't be hit) opens every 9 s, its ring round it the special's
      colour (2199, 2200, 2198), and takes its specials in turn: the converging beam (two walls of
      glowing tiles closing on it from north and south, then east and west, a tile a tick, each
      glowing harmless 1.2 s before it's struck, bigger, as the windmill's do), the
      windmill (its five patterns, read off the OSRS Wiki's diagram, `WARDENS_WINDMILL`, each
      glowing 1.8 s before it's struck, twelve of them) and lightning skulls (ten thrown at random
      tiles, the 7 by 7 round each struck but its cross). Unlike OSRS's, it keeps on while the core's
      out, and opens sooner: here the core's hit dodging it. The marks are the fight's
      (`WardensFight.marks`), drawn by GameView: there are too many for effects. The OSRS beam's
      own spot animations (2234, 2235) barely show from this camera, so the beam's tiles glow (2236)
      as the kill video shows and the windmill's strikes are the Wardens' red lightning (2197).
    - Its last hitpoint: it collapses (9662) and restores the other.
- **The Wardens, phase three** (`WARDENS.three`, `Sim.stepWardensThree`): OSRS's own room for it,
  square 61,80 (cell 4,1, unturned), where the screen goes black after phase two and the party's
  brought. A floor of plates 29 by 31 round a crater: the Warden that fell comes back on its
  platform in the floor's middle (where the obelisk stands in the first room; the viewer's spawn
  list has it at 3934,5152), the crater torn open behind it, floor in front, down both sides and in
  a row behind. The floor's the map's `MapDef.floor` (PR 133's), the crater its `holes`
  (`WARDENS_CRATER` in `content/wardensFloor.ts`, cut from the grid as the phase starts), moved by
  the fight through `ArenaFloor.start` rather than a script. Amascut (11767) watches from the
  crater. An earlier cut stood the Warden past the north end of the first room's floor, cut again:
  not OSRS's.
    - The order's OSRS's, from a kill video and the Wiki: slams alone first, then the siphons,
      then slams with the phantoms and the siphons, then the enrage, where the slams stop and
      lightning comes down on a floor that's going.
    - Slams: half the floor rises in a wave out from its row, north and south, east, then west,
      then both but the middle three columns, every 4.2 s (3.6 below half; Overclocked 3, Overclocked 2 2.4, Insanity 1.8).
    - At 80, 60, 40 and 20% (no hit takes it past one), it charges (11763/11764): 3, 4, 4, then 5
      siphons (11772) for one player, one more each for every other (seven for one, four tiles
      apart, couldn't be reached in time: every fourth charge was a ripple nobody could help),
      land in front of it in a formation, a different one each charge and mirrored at random
      (`WARDENS.three.formations`: a line slanting across, a V pointing at it, a row, two
      staggered lines, after the OSRS Wiki's screenshot; the wiki gives no coordinates), beamed (2227), each stopped by a player stepping on it
      (reversed, 11773) within 10.8 s (Insanity 4.8). Nothing hurts the Warden while they're out. All stopped, it staggers for 5% of its
      hitpoints; any left, the floor erupts out from the middle. The slams start again from east
      (Insanity: where they left off).
    - The second charge (60%) brings a path boss's phantom on its left (west) and the third (40%)
      another on its right, each at the floor's edge level with it, as OSRS has them (Zebak's on
      the left), each with its boss's usual attacks: Zebak's (fans of his magic or
      ranged: no acid, no jugs, that's his room) and Ba-Ba's (a rock on where you stand) with
      Tumeken's; Akkha's (three of his ranged or magic) and Kephri's (a fireball lobbed onto you,
      wider with Aerial Assault) with Elidinis'. They can't be hit.
    - At 5% it enrages, as OSRS has it: it heals 20%, Amascut opens her mouth (11768), the slams
      stop, red lightning strikes the floor in their place (a walk of 10 bolts every 2.4 s, each
      bolt's shadow (1446) on its tile 1.8 s before it strikes (2197), for 12% of your
      hitpoints), a row of the floor tears away from the back (the south) every 3 s till the row
      in front of it is all that's left before it, with the floor beside and behind it (you're in
      its reach or you're off), and the phantoms are quickened. Stay calm or die. Its death ends
      the raid, and the chest's opened (below).
    - Invocations: Ancient Haste, Acceleration (the Warden attacks and the obelisk opens sooner),
      Penetration (the obelisk's specials hit harder), Overclocked, Overclocked 2 and Insanity.
    - Not in: Divine Projectile (it's about prayer, which the run hasn't got).
- **The way to the Wardens** (`TombsDef.wardensDoor`): the Nexus's north end, as OSRS's is, open
  once every path's done (it says so before); the dev button still skips there with the best kit.
- **The Helpful Spirit** (`TOMBS_SPIRIT`, `TOMBS_SPIRIT_BUNDLES`, `Sim.stepTombsSpirit`): stands
  in the Nexus (`TombsDef.spirit`), in a glowing circle while it has something for you. Walked up
  to, it offers each player OSRS's three bundles, free, one to take: Life (Nectar, Tears of
  Elidinis, Blessed crystal scarabs, Ambrosia), Chaos (Nectar and Tears, maybe Smelling salts, now
  and then Ambrosia or Liquid adrenaline) and Power (Smelling salts, Liquid adrenaline). Life's
  silk dressings are left out, for the inventory's four slots. Once after any two paths, once
  after the other two; one not taken before the next door is gone. The supplies go in the
  inventory as items (`TOMBS_SUPPLY_ITEMS`, never in caskets), and any there's no room for are
  used at once.
- **Random events**: in the Tombs only those that drop a casket can roll (`Sim.rollRandomEvent`).
- **Points, the chest and the board** (`TOMBS_POINTS`, `Sim.openTombsChest`, `TombsSummary`):
  each player's points are a puzzle room done (500, everyone in the raid) and each boss's
  hitpoints taken (a path boss 1000, the obelisk 500, the Warden 1000 then 1500), shared by damage
  in co-op so a fair share is the whole, and a death costs a fifth, as OSRS's does. A purple's
  chance is the raid level's (PURPLE_CHANCE's least at 0, its most at 500) times the share of a
  whole raid's points (9000), none under raid level 50, only the fang and Lightbearer under 150.
  Tumeken's guardian (a pet), the Thread and the four jewels are rolls of their own from their
  raid levels, and the invocation board shows each from where it comes. The result screen's board
  is OSRS's raid summary: the raid level and its invocations, each path's time and the Wardens',
  the time limit, and each player's points, deaths and purple chance.
- **What the uniques unlock** (section 8's plan) isn't in yet: they're Collection log trophies,
  under the raid's own tab.

### The boss rework, stage 1: guards and the raid's button

The first step of the boss rework (its design: every boss given readable answers and windows to
punish): every boss has a guard, and the raid has a fight button. Built November 2026.

- **The raid's button** (`TombsDef.ability`, `TOMBS_STRIKE`, "Amascut's bane"): Space, a pad's
  bottom button or the touch screen's, as the quest's is (`Sim.ability` reads a fight map's or
  the Tombs'). It hits for `damageShare` (0.4%) of the boss's hitpoints with none of the hero's
  bonuses, so it's worth the same at every raid level and party size (a share of Kephri's shield
  while she's behind one, and of the second-phase Warden's shield), twice that while the guard's
  down, reach 4 (5.5 while it's down), every 5 seconds, each hero their own. It lands on the
  path's boss, or the Wardens' Warden in their second and third phases (not while it kneels: its
  core's what's hit then; not the first phase's obelisk, which isn't a boss in the sim), and breaks a spell being channelled. The hero swings their first
  weapon as it goes.
- **Guards** (`TOMBS_GUARD`: twice the damage while down, no stun; gold `exposedLight` while it
  is), and what drops each in this stage, with the bosses' own attacks as they are:
    - Ba-Ba: a Shockwave that lands on no one (`opens: 1`; ground marks can open a guard now).
    - Akkha, every form: a Spear thrust that hits no one (`opens: 1.5`). His prayer still holds
      against weapons of its style while he's open; the button gets through it.
    - Kephri: Mass Incubation is channelled (3 seconds, guard down the while); the button breaks
      it and no eggs come.
    - Zebak: a Rock spit that lands on no one (`opens: 1`), standing in for his Jaws to come.
    - The Wardens: Tumeken's second-phase Slash at no one (`opens: 1.2`; each hit fills its
      shield twice over while it's down), and in the last phase, every siphon stopped, the Warden's
      open for the slams' restart (5.4 seconds). The first phase's obelisk isn't a boss in the sim,
      so its flicker waits for the Wardens' stage.
- **Hitpoints, so the raid's no easier for it**: Ba-Ba 6,000 to 7,800, Akkha 6,000 to 9,000,
  Kephri 7,000 to 8,400, Zebak 7,000 to 8,400, the second-phase Warden's shield 3.5% to 4.5% of its
  hitpoints, the last phase's Warden 25,000 to 30,000. Tuned boss by boss against the same bosses
  with no guards (each played after its own puzzle room, `sweep-tombs.sh` with `ROOMS=<boss>`),
  then checked over the whole raid.

The whole raid before (the new bot on the bosses as they were) and after, 9 runs a cell
(warrior, wizard and ranger, 3 seeds): wins, deaths (wipes, all nine runs'), median winning time.

| Invo Difficulty | Fresh Account (before / after)  | Mid-game                           | End-game                          |
| --------------- | ------------------------------- | ---------------------------------- | --------------------------------- |
| Entry (0-149)   | 7/9, 67, 19:55 / 8/9, 27, 21:56 | 9/9, 2, 14:45 / 9/9, 8, 37:02      | 9/9, 3, 10:46 / 9/9, 6, 12:04     |
| Normal (150+)   | 0/9, 981 / 0/9, 936             | 4/9, 603, 23:37 / 2/9, 1058, 64:06 | 8/9, 6, 24:43 / 6/9, 271, 30:10   |
| Expert (300+)   | 0/9, 1064 / 0/9, 994            | 0/9, 417 / 0/9, 444                | 3/9, 394, 29:09 / 1/9, 583, 20:41 |
| Max invo (500)  | 0/9, 2806 / 0/9, 2806           | 0/9, 1051 / 0/9, 1033              | 0/9, 644 / 0/9, 643               |

Fresh accounts lose on the first boss at Normal and up either way, so their deaths count tries in
90 minutes, not how hard it is; played alone with that kit, Ba-Ba leaves as much of her hitpoints
as before and Akkha's harder (6 of 9 at Entry before, 4 after). Entry's one more Fresh win was a
warrior that stalled on the path of Het before. The rest is the same or harder, End-game the most:
the hitpoints went up by more than the guards give a strong kit, as a share-of-hitpoints button
is worth more to a weak one. The next stages put each boss's own punish windows in (lunges,
leaps, jaws, channels) and are tuned the same way.

### The boss rework, stage 2: Zebak, "the Tide"

Zebak reworked to the design (built November 2026): phases, a punish window of his own, adds that
lunge, and no tracking streams. His roar, his tidal waves, his acid and his jugs are as they were.

- **Three phases** (`BossDef.phases` on his hitpoints: 70% and 40%), each quicker (`tempo` 1, 0.85,
  0.7) with an opener that shows what it brings: Twin jaws for the second, a two-rank swell for the
  last, which also dims the room to 0.6 and is his enrage (a fight in phases has no other; his
  `enrage.at` is only where his specials stop now). His attack interval is 1.8 seconds (2.6).
- **Jaws**: a strip from his head down the island (`line` 3 wide, 12 long, no dash: a line counts
  from his middle, so that's about 9 tiles onto the island past his body), 7 damage, 1.2 seconds,
  with a cool mark light. A miss drops his guard for 2 seconds (`opens`), his head down at the
  island's edge; it replaces stage 1's Rock spit stand-in. From the second phase it's followed by a
  Rock spit where you stepped to, and there's Twin jaws (two strips, re-aimed); in the last, Jaw
  flurry (three, each turning after you for 0.3 seconds, then locked).
- **The Swell**, from the first second: an ambient wall of his waves (`zebak_wave`) rolling south
  down the island from its top edge, 11 across with one left out for the way through, knocking back
  1.5. Every 14 seconds (from 6 in), 11 in the second phase, two ranks every 8 in the last, with an
  Acid spray every 10 on top. Upset Stomach makes it a quarter quicker (ambients now take their
  attack's `invoked`, as picked attacks do).
- **Crocodiles** (`zebak_croc`, from the second phase, two every 22 seconds): Crondis's crocodile,
  150 hitpoints, biting as one does, and snapping a strip of its own a beat after each of his jaws
  (`echoes`, with `EchoDef.length` 6: a strip shorter than his). They're summoned in a ring 7 tiles
  round him, and only where it's walkable, so they land on the island; when a try lands in the
  water it tries again, up to six times, so now and then fewer than two come.
- **Bullets** are chip damage: shards 3 (the pot's were 4), six of each (8 and 10), Acid spray 3
  in two volleys aimed once (it was 4, three volleys re-aimed at you), his last phase's roar ring 3
  (5) with a wider gap. Magic pot and Rock spit are 5 (6 and 7). Every bullet is lit (`bright`), and
  the pot's and the rock's shadows and his jaws' strip have a cool mark light (`MARK_LIGHT`).
- **A wipe** takes a phased boss's light with it (`endBossFight`), so a wipe in his last phase
  doesn't leave the room dim for the next try.
- **The bot**: off his jaws' strip sideways, and off a crocodile's still winding up after his has
  landed; its look ahead counts standing in a strip as it lands as worse than acid (it had stepped
  back in to keep off a pool); in a swell's gap (and through one during his roar); and a melee hero
  goes straight back in under his head while his guard's down.

Ids: nothing new from the cache. No bite of his own is in it (`find-npc-seqs.ts 11730`: 9632 and
9636 are unnamed, neither reaches further forward than his rock spit's 9620), so his jaws use 9620;
the crocodiles are Crondis's (11705, attack 2039); the strip's trail is the blown dust (2184) at the
size the quest already uses it, and his jug's splash (2193) unfitted where his jaws come down.

Hitpoints are still stage 1's 8,400 (the design's 6,000 was a first guess); the five bosses get one
tuning pass together at the end. Zebak alone after his puzzle room, before this stage (wins of the
runs that reached him, deaths at him, median winning time; three characters, three seeds; many runs
stall in the Crondis room first, and the same seeds do so either way; at 500 none got through it):

| Invo Difficulty | Fresh Account    | Mid-game         | End-game         |
| --------------- | ---------------- | ---------------- | ---------------- |
| Entry (0-149)   | 4/4, 4, 1:28     | 7/7, 0, 0:43     | 5/5, 0, 0:43     |
| Normal (150+)   | 3/3, 3, 1:49     | 7/7, 0, 2:16     | 6/6, 0, 1:08     |
| Expert (300+)   | 1/1, 3, 5:50     | 2/6, 68, 5:11    | 6/7, 11, 3:38    |
| Max invo (500)  | none reached him | none reached him | none reached him |

The same after this stage wasn't run to the end: one check, Expert with everything bought (warrior,
one seed), won in 4:19 with no wipes. Untried in a browser: the strip's and the swell's look on the
tomb's floor at 0.6, his head down at the edge, and the crocodiles climbing out.

### The boss rework, stage 3: Ba-Ba, "the Brawler"

Ba-Ba reworked to the design (built November 2026), the tuning left for one pass over all five
bosses at the end: phases, lunges that leave her open, brawlers that copy them, and a rampage a
rubble rock stops.

- **Three phases** (`BossDef.phases` at 67% and 34%, a tick ahead of her rolling stones at 66% and
  33%, which stay her kneel between: no `threshold`), `tempo` 1, 0.85, 0.7, `speed` 1, 1.1, 1.25,
  the last dimming the room to 0.6. Her attack interval is 1.5 seconds (2.2), her rolling stones
  14 seconds at most (20). A phase's opener waits out an ordeal, and its ambients pause through it
  (`stepBoss`, `stepPhase`): her boulder doesn't come down on the rows of boulders, nor her rockfall.
- **Knuckle lunge** (from the first phase): a strip 2.5 wide and 7 long, a dash of 6 down it, 5
  damage, 1 second, with a cool mark light; a miss leaves her open 1.5 seconds. Two in the second
  phase (Knuckle lunges), three turning after you a quarter second each in the last (Lunge flurry),
  and from the second, one followed by her Shockwave where she stops (Lunge, then pound).
- **Shockwave** 5 (6), 4 seconds apart, its mark lit (`alpha` 0.55, `MARK_LIGHT`); a miss still
  opens her. **Rock throw** (new): a shadow on you, a rock that bursts into eight shards (3 each).
  **Rockfall** is her ambient now, every 9, 7 and 5 seconds by phase, 4 damage. **Boulder** and its
  avalanche from the second phase (the opener), 10 shards (16), every 14 seconds, 10 in the last;
  the avalanche takes half your hitpoints (four fifths).
- **Brawlers** (`baba_brawler`, from the second phase, two every 20 seconds): baboon brawlers of 120
  hitpoints that lunge a strip of their own (3 damage) a beat after each of hers
  (`echoes`), her own lunge (9745) on their skeleton; the pocket between is the way out.
- **Rampage** (the last phase's opener, then every 12 seconds): a surge. She goes to the room's
  edge in line with you, beats her chest (9751) and charges across on her walk, 6 damage, three
  lanes in a row; across without hitting anyone she's open 2 seconds. **A charge into one of her
  boulders' rocks stops her dead, stunned 2.5 seconds** (Zachariah's stars over her head,
  `BossGuardDef.stunSpotAnim` 80), not again for 8 seconds (`stunGrace`; a rock then only opens
  her). Boulderdash makes it 1.4 times as fast. A lunge only stops short of a rock, not stunned
  (players found standing behind one stunned her every 8 seconds, which made the fight easy).
- **Engine**: a surge into a `leavesCover` rock is stuck, as a lunge into a pillar is
  (`Sim.inCoverRock`, in `stepSurge`); a lunge's dash only stops short of one (`dashEnd`). The
  Tombs have no boss square, so a surge's lane in them runs as far as the floor does along the
  player's row or column (`Sim.tombsLaneBox`), never back over the fight's line.
- **The bot**: off her strips sideways and to the pocket between hers and her brawlers' (stage 1's
  readers); out of a rampage's lane, or behind the rock in it when that's nearer (`rampageCover`),
  and between her and a rock whenever there is one (as it was for her avalanche), so her rampages
  run into it (her lunges now only stop short there).

Ids: nothing new from the cache. The stun's stars (80) are Zachariah's; the brawlers are the
Apmeken room's Baboon Brawler (11709), which plays her 9745 (skeleton 2063, `find-npc-seqs.ts`).
No run of hers is in the cache (`find-npc-seqs.ts 11778`: 9738 and 9740 are unnamed), so she
rampages on her walk (9737). Her lunge's dust (2184) is fitted at the size the quest uses; her rock
impact (451) where it stops, and as the stun's stuck impact, is unfitted (its spread isn't measured).
Unchecked: where in 9745 her blow falls (no `strikeAt` yet), and how any of it looks on the floor.

One check, Expert with everything bought (`ROOM=baba`, warrior, one seed): done 6:06 after the room began,
the puzzle taking 1:57, with 4 wipes (before this stage, 2:12 with none: she fell in 15 seconds), the bot's damage mostly from her
rolling boulders as before; her rocks stunned her 5 times, and 7 more times only opened her.

### The boss rework, stage 4: Kephri, "the Hive"

Kephri reworked to the design (built November 2026), the tuning left for the last pass: she
doesn't move, so her windows are her channels, and each shield adds a layer.

- **Phases by her shields** (`BossPhasesDef.by: "shields"`, E5): her hitpoints aren't touched till
  the third shield's gone, so a phase is a shield, and the next begins as she's back behind it,
  after the intermission (`Sim.kephriNextPhase`): `tempo` 1, 0.85, 0.7, the last dimmed to 0.6 with
  Firestorm as its opener, the second with the stampede. The form she rises into for her last
  (`kephri_final`) carries the same phases, so it stays in the third. Her ambients pause while
  she's dazed between shields. Her attack interval is 1.6 seconds (2.2); her intermissions bring
  18 and 16 swarms (28 and 24).
- **Swarm, come home** (new, every 16 seconds, first and second shields; six in the third): she
  rears up and five of her swarm (`kephri_swarm_home`, which restores nothing) walk in from 9
  tiles (`summon.walkTo`, the Scarab Mages'), her guard down the while (`channel`). Shoot them, or
  go in and break it with the button (they scatter, and she's open 2.5 seconds more); each that
  gets to her adds 1.5 to a blast of 3 on everyone. Medic! brings two more.
- **Mass Incubation** keeps its channel, from her second shield.
- **Scarab stampede** (the second shield's opener, every 12 seconds; two ranks in the third): a
  wall of her swarm, 13 across with a gap of three, out of the floor behind her at you, knocking
  back a tile, 4 damage (the Scarab Mages' stampede, drawn as her swarm).
- **Firestorm** (the third's opener, every 14): five fireballs, one on you, then again round where
  you went.
- **Bullets** are chip damage: Fireball 5 (7), its shards six (8) and lit, twice in the first
  shield, three times after; Scarab spit 3 (4), 14 a ring (18), two rings (three), a wider gap, and
  from the second shield a fireball where you went after it; her spit ring as an ambient (every 8,
  6.5 and 5 seconds), the swarm spiral 3 arms (5) at 3 in the second and an ambient every 12 in the
  third. The Arcane Scarab's ring is 14 at 4 (24 at 6). Dung Strike's 5 (6), every 7 seconds on
  her last (`KephriDef.dung.finalEvery`).
- **The Soldier burrows**: every 6 seconds out of your reach it digs (dust, 2184) and comes up a
  tile and a half from you, slowly (`blinks.surface`, its walk 9584, 0.8 seconds), then slashes.
- **Her last** (`kephri_final`): no channels, a race. Fireballs three at a time, her spit, two-rank
  stampedes and Firestorm, under the third shield's ambients.
- **The bot**: presses the button on either channel (stage 1's `tombsButton`) from where it waits,
  a tile and a half from her, and finds the stampede's gap (stage 1's wall reader).

Ids: nothing new from the cache. Her swarm called home is her Scarab Swarm (11723) again; the
Soldier's burrow is the blown dust (2184, unfitted) and its own walk (9584).

One check each, Expert with everything bought (`ROOM=kephri`, one seed): a wizard, done 2:48 after
the room began with no wipes (before this stage, it failed with 11); a warrior failed either way
(11 wipes after, 10 before), most of it her fireballs and the Soldier, for a melee hero who has to
stand among them. Unchecked in a browser: the stampede's look on her floor, the Soldier coming up,
and every mark at the last shield's 0.6.

### The boss rework, stage 5: Akkha, "the Duelist of Het"

Akkha reworked to the design (built November 2026), the tuning left for the last pass: each form
speaks one shape language, melee lines and wedges, ranged walls and fans, magic marks on the floor
in his quadrants' elements, and a miss drops his guard and his prayer with it. Memory Blast, the
quadrants, the shadows, Detonate and the final stand stay.

- **Three phases** (`BossDef.phases` at 66% and 33%, where his shadows come now: two times, not
  four, flooding every 15 seconds, not 20), `tempo` 1, 0.85, 0.7, the same
  on every form (`akkhaForm`; a form's change keeps the phase). His attack interval is 1.4 seconds
  (1.8), a special every 6 attacks (7). Memory Blast is a step longer in the last phase.
- **His prayer down with his guard** (`BossGuardDef.pierce`, E2): while he's open, his overhead
  holds against nothing, so a hero of the style his form prays against gets at him through a miss.
- **Every form**: a **Leap** onto where you stood (a blast with `leap`, radius 2, 6 damage, 1.4
  seconds under its shadow), open 1.5 seconds when it misses, his second phase's opener (twice,
  Leaps, his last's); and his **Stamp** as an ambient, a ring of 16 out of him with a gap on your
  side, every 9, 7 and 5 seconds by phase, 3 damage (5).
- **Melee**: Spear lunge (a strip 2 wide, 7 long, a dash of 5.5, 5 damage, open 1.5 seconds on a
  miss), Sweep (a wedge of 1.8 radians, 3.2 tiles, 5 damage, in place of the thrust round him that
  hit for 8), from the second phase a lunge then the sweep where he stops, and in the last a
  flurry of three lunges, each turning after you a quarter second. Feeling Special adds a lunge
  that turns from the first phase (`BossAttackDef.onlyWith`, E6).
- **Ranged**: Sand volley (a fan of 5, two volleys aimed once, 3; it was three re-aimed at 5),
  Sand wall (11 across with a gap of two rolling at you, 4, knocking back a tile; two ranks from the
  second phase, and a wall then a volley), Sandstorm with 4 arms (6) at 3.
- **Magic**: Elemental strike (three marks, one on you, 5, each glowing its quadrant's element:
  `GroundHazard.light`, E12), Glowing sand (two rings, 3), Red noose (a ring of 20 closing on you
  from 6 tiles with a gap of three, in place of Red sand's tracking triplets), and from the second
  phase a strike then the noose round where you stepped.
- **While his trailing orbs are out** he uses only Sweep, Spear lunge, Sand wall and Glowing sand
  (`AkkhaDef.orbAttacks`, E13), shapes a single step answers.
- **His shadows lunge**: the one nearest you copies his Spear lunge and his flurry from where it
  stands, a beat later (`echoes`, with `EchoDef.noDash`, E14: it doesn't dash down its strip).
- **His final stand**'s orbs are lit (`bright`, and a glow of their own light).
- **The bot**: stage 1's readers do the rest (off a strip sideways and to the pocket between his
  and a shadow's, out of a wall's or a closing ring's gap, off the leap's and the marks' circles),
  and it goes in to press the button whenever his guard's down, whatever form he's in (its weapons
  get through then too). A wedge as short as his Sweep it backs out of, as it does a swing round him.

Ids: nothing new from the cache. No leap of his is in it (`find-npc-seqs.ts 11790`), so his leap
plays his stamp (9788); his shadow (11797) plays his lunge (9770) on his skeleton (2065). His sand
(2255) is fitted at 2 where he lands and 1 down his strip, under the 3 the quest fits it to (its
spread isn't measured). Elemental strike's marks are shadows, not his red sand (2253) fitted to
them, whose spread isn't measured either; they show the burst (2254) unfitted as they land.

Hitpoints and the final stand's share are as stage 1 left them (9,000, 20%), for the last pass.
One check each, Expert with everything bought (`ROOM=akkha`, one seed), before and after: all three
characters reached him weak from his path's room (a ranger at level 4) and failed the 15 minutes
either way, with fewer wipes and further into him after (warrior 5 wipes and 73% left at best
before, 3 and 63% after; wizard 10 and 40%, 4 and 35%; ranger 5 and 80%, 3 and 66%), Red sand's
tracking triplets gone from what hurt most. Unchecked in a browser: the leap (his stamp played as
one), the marks' glow by quadrant, the shadows' lunges, and the wall and noose on his floor at 0.6.

### The boss rework, stage 6: the Wardens' additions

Added round the Wardens as they were (built November 2026), nothing swapped out: the first
phase's soaking, and the last phase's order (slams; siphons at 80%; the phantom at 60% and the
second at 40%; siphons at 20%; at 5% the enrage, lightning in the slams' place and the floor down to
one row) are as they were. The tuning's left for the last pass.

- **The first phase: the obelisk flickers.** As a Warden discharges (pyramids or its shot), the
  obelisk takes twice what it's hit for, 2 seconds (1.5 with Ancient Haste), lit gold
  (`WardensDef.flicker`; `Sim.obeliskFlickers`). It isn't a boss in the sim, so this is its own
  window, not a guard, and the raid's button still doesn't land on it. Each pyramid cell glows cool
  from when it's up till its first hit (`WardensDef.pyramids.light`).
- **The second phase**: the Warden attacks every 2.6 seconds chasing (Tumeken's) and 2.4 standing
  off (Elidinis'), from 4.8 and 4.2, its hits lower: Red skull 5 (7), turning at 0.8 a second
  (1.4); Plain skull 4 (6); Skull storm 3 (5), aimed once (its three volleys were re-aimed); Entomb
  holds 1.2 seconds (2.4), its shadow lit, and never within 2 seconds of the obelisk's special
  (`BossAttackDef.clearOfObelisk`, E15).
    - Tumeken's **Slash** is a wedge now (2 radians, 3.6 tiles, 6 from 8), open 1.2 seconds on a
      miss as before; its **Charge** (new) runs a strip 3 wide and 9 long at you, a dash of 8, 6
      damage, open 2 seconds when it misses, twice with Acceleration (`invoked.times`, E6).
    - Elidinis' **Judgement** (new, every 14 seconds): a beam from her to the obelisk (a `tether`,
      faint for 1.2 seconds, 6 long, hurting whoever's across it every half second), her guard down
      while it runs (a tether with `channel`), and the raid's button breaks it (`breakChannel` ends
      a channelled tether now). Penetration makes it a third harder.
- **The last phase**: every siphon stopped, the Warden's open for the slams' restart (stage 1's),
  half of it with Insanity. Its phantoms throw shapes, not homing shots: Zebak's fans are aimed
  once and lit, Akkha's a rank of his sand (9 across, a gap of two) rolling from his side, Ba-Ba's
  her rockfall's cross on you; Kephri's fireball is as it was. A phantom lands nothing in the half
  second a slam rises (its windup's pushed past it, `Sim.clearOfSlam`, E15), and the second phantom
  takes turns with the first, half its interval behind. The enrage's lightning's shadows glow cool
  till they strike (`WardensMark.light`).
- **The bot**: stage 1's readers take Tumeken's charge (a strip), Judgement (its side of a tether)
  and Akkha's phantom's wall (its gap); it presses the button on Judgement as on any open boss,
  and goes in for it. In the last phase it already stands in front of the Warden in its weapons'
  reach, where the restart's window is.

Engine pieces: `WardensDef.flicker`, `pyramids.light` and the lightning's `light`, all drawn
through `SceneLights` (the only client change); `BossAttackDef.clearOfObelisk`; `invoked.times`,
and `invoked.speed` on a surge (Ba-Ba's Rampage with Boulderdash: it did nothing before); a
channelled tether. Not done: the pyramid seals' and the lightning shadows' `alpha` (drawn by the
floor's view, which another change has open), and a glow on the first phase's shot.

Ids: nothing new from the cache. The charge plays the Warden's walk (9649) and trails the beam's
glow (2236) unfitted; Judgement's beam is the siphon's (2227); the phantoms' rockfall lands as
Ba-Ba's phantom's rock (2250) did, unfitted.

One check, Expert with the dev kit (`ROOM=wardens KIT=max`, warrior, one seed): won in 1:16 with no
wipes (1:21 before), the stagger opening the Warden 4 times. With everything bought but the run's
own kit the bot doesn't reach them (the raid before them stalls), and at level one it doesn't get
past the first phase either way. At 500 with the dev kit a wizard won in 2:00 (2:03 before), Judgement
cast twice and broken once by the button. Unchecked in a browser: all of it, the charge's strip and
the beam most.

### The boss rework, tuning

The last pass, once all five were built (November 2026), against stage 1's whole-raid table as the
bar: no cell easier on wins or deaths. Sims: `sweep-tombs.sh`, 3 characters and 3 seeds a cell.

What changed (Zebak and the Wardens kept their numbers):

- **Ba-Ba**: hitpoints 7,800 to 12,000. Her fights had got short (1:17 at Normal, 1:52 at Expert
  with everything bought) with fewer wipes; now 1:40 and 2:38, the wipes back where they were.
- **Akkha**: the bot reads his shapes, so he'd stopped killing anyone at Normal (in the raid, 1
  wipe in nine with everything bought, his room done in about 4 minutes). His attacks every 1
  second (1.4), his phases' tempo 0.8 and 0.6 (0.85 and 0.7), his stamp every 6, 4.5 and 3.5
  seconds (9, 7 and 5) and 20 in its ring (16); hits: Leap 7, Stamp 4, Spear lunge 6, Sweep 8,
  Sand wall 7, Sand volley 5, Sandstorm 5, Elemental strike 8, Glowing sand 5, Red noose 5,
  Unstable orbs 8 (6, 3, 5, 5, 4, 3, 3, 5, 3, 3, 5); hitpoints 9,000 to 10,000.
- **Kephri**: hitpoints 8,400 to 9,000 (both forms), her attacks every 1.5 seconds (1.6), her
  Fireball 6 (5). She'd gone from 3 wins in nine to 5 at Expert with everything bought.

Akkha was tuned on `ROOM=akkha LEVEL=1` (Ba-Ba's path first, as the raid has it): played straight
after his own room the adventurer is level 4 and any change reads as a wall. There, with stage 1
first: Normal Mid-game 5/9, 99 wipes, now 3/9, 116; Normal End-game 6/9, 42 wipes, now 9/9, 0;
Expert End-game 2/9, 54, now 0/9, 81.

The whole raid (wins of 9, deaths, median winning time), stage 1's bar first:

| Invo Difficulty | Fresh Account                   | Mid-game                            | End-game                          |
| --------------- | ------------------------------- | ----------------------------------- | --------------------------------- |
| Entry (0-149)   | 8/9, 27, 21:56 / 8/9, 19, 21:13 | 9/9, 8, 37:02 / 8/9, 23, 21:39      | 9/9, 6, 12:04 / 7/9, 2, 10:02     |
| Normal (150+)   | 0/9, 936 / 0/9, 1087            | 2/9, 1058, 64:06 / 3/9, 1201, 23:57 | 6/9, 271, 30:10 / 7/9, 199, 18:23 |
| Expert (300+)   | 0/9, 994 / 0/9, 1256            | 0/9, 444 / 0/9, 490                 | 1/9, 583, 20:41 / 0/9, 308        |
| Max invo (500)  | 0/9, 2806 / 0/9, 2806           | 0/9, 1033 / 0/9, 1332               | 0/9, 643 / 0/9, 880               |

Where it isn't the same or harder, and why:

- **Normal, Mid-game and End-game: one win more each.** Stage 1 lost those runs to the 90
  minutes: Akkha fights of 25 to 75 minutes (his old tracking sand) and a Kephri's Soldier loop
  (the bot dying to the Soldier hundreds of times). With everything bought the adventurer now
  takes almost nothing from any boss at Normal; taking that win back would need Akkha as a
  hitpoint wall again. The Soldier loop is still there, both before and after, and it's most of
  the deaths in every cell from Normal up.
- **Entry End-game and Expert End-game: fewer deaths, fewer wins.** Entry's two losses are the
  Scabaras puzzle stalling (no wipes); Expert's nine all stop at Akkha, so none reaches the
  Soldier loop that made stage 1's deaths.
- **Entry Fresh: fewer deaths at the same wins**, a few deaths either way (27 to 19).

Co-op, `PARTY=2` at Expert with everything bought: stage 1 (6b70811) won 2 of 9 with 119 deaths,
losing at Akkha, Kephri and Zebak; now 0 of 9 with 226, all nine stopped at Akkha.

Not checked: Zebak and the Wardens were left alone (Zebak already harder; the Wardens can't be
told apart from the raid before them); Kephri plays at Normal in 1:10 (raid order), short of the
design's 3 minutes; and the Expert End-game raid has no wins, alone or as a pair (stage 1 had one alone, two as a
pair). Akkha's what stops it: his numbers can't be harder at Normal without being harder at Expert,
and the raid level's scale between them is the raid's, not his.

So a boss can ease off from a raid level up, nowhere below (`BossDef.raidEase`: hitpoints, hits,
its phases' ambients), and Akkha does from 300: hitpoints ×0.7, hits ×0.5 (his poison and his
floods and blasts too), the time between his stamp's rings ×1.5. What made him the wall
at Expert was his shadows (their hitpoints are his, so at 1.6 they outlasted the flood's 15
seconds and the floods were most of what each try took) and his fire quarter's poison, kept up by
every stamp; a slower attack interval didn't help (fewer misses, so fewer openings). Normal is
as it was (`ROOM=akkha LEVEL=1` at 150, the same seeds: 9/9, no wipes, identical). Expert
End-game, room: 0/9 and 81 wipes before, 5/9 and 14 now, easier than stage 1's 2/9 there (Mid-game
0/9 and 240 before, 1/9 and 174 now).
Whole raid, Expert End-game: alone 1/9 with 532 deaths (stage 1 1/9, 583; seven of the other
eight got past him and stopped at Kephri's Soldier loop or Zebak); `PARTY=2` 3/9 with
104 (stage 1 2/9, 119). Max invocations (500) End-game is still 0/9, stopping at Ba-Ba (one gets
past Akkha in 55 minutes).

## 12. The bot, and the Tombs' own sim

The balance bot plays the whole raid (`scripts/game/tombsBot.ts`), and `simulate-run.ts` uses it on
this map. It only moves, reading the sim as it likes, and imports nothing of Node's or the DOM's, so
the dev console can drive the real game with it (`await import("/scripts/game/tombsBot.ts")`, then
`tombsMove(game.sim)` each tick).

- **The Nexus**: the Helpful Spirit while it has a bundle (Life, its supplies used as a player
  would: heals when hurt, Tears when poisoned, the rest once a boss is out), each path's door in
  turn (the open tile nearest a door set in a wall), then the way to the Wardens. **A room**: through its barrier, then its puzzle; **a boss**: past its line.
- **Apmeken**: stands at each issue till it's fixed, and fights round the room's middle.
- **Het**: picks up every loose mirror, sets them on the spots the beam's way wants (the room's
  own answer) and turns them there, cleans whatever dirty mirror stops the beam, stands in a worn
  barrier's circle till it crumbles, then stands in the seal's ring while it's open; out of an Orb of
  Darkness's line whatever it's doing. It steps off anything solid it's against before finding
  its way round (the tiles round each are walls to its way, its own tile walled in with them).
- **Scabaras**: the Ancient button, then the Sequence in order once shown, the fewest Lights out
  presses, a way across the Addition board, tile to touching tile, that makes the tablet's number
  (`additionPath`), then Matching, every plate reached round the others.
- **Crondis**: water fetched empty-handed (a band only spills what you carry), filled once a band's
  gone over the fall with time to be ahead of the next, and on past a spear by the corridor's other
  half.
- **The bosses**: Ba-Ba's cracked boulder's lane and a rock's cover (between her and it, so she
  rampages into it, and behind it when her rampage's lane runs into it); Akkha's spared quadrant (by
  the line it shares with the next, a hop across as each burst lands: Feeling Special's bursts
  come quicker than a walk between corners), round his body (the flow field only knows the walls)
  and his dead shadows' quadrants; Kephri near enough; Zebak's island near him (melee on the row
  along its north edge, and in under his head while his guard's down, a thrower at any dry spot in
  reach), off his jaws' strip and his crocodiles' (worse than acid as they land), through a swell's
  gap, straight out of a pool it's in or
  brushing (each step in is a dose of poison), behind a boulder for the roar at a spot off the
  acid, in a wave's gap at a dry tile in its column, away from his blood clouds (they're slower,
  and die following), and, with every spot in reach acid, rolling a jug at rest to break by the
  pool; and it sidesteps bullets, boss blasts and swings, and the Wardens' red skulls as they
  turn (a sidestep at the last beats their turning circle). It reads a boss's shapes with the
  quest's own readers (`scripts/game/bossReads.ts`, shared with `simulate-run.ts`): off a lunge's
  strip sideways (not backed away from down its length), to the pocket between two strips, out of
  a long wedge's side, to a wall's or a closing ring's gap, out of a charge's lane, to its side of
  a tether. **The raid's button**: pressed whenever what it'd land on has its guard down
  (`tombsButton`), and the bot goes in for it while it's ready (`SMITE=0` turns both off).
- **Kephri**: her overlords first, the Arcane Scarab before the others (the wiki's advice), kept
  out of the Soldier's reach whichever overlord it's shooting (its touch plus a tile and a half:
  it walks at half the bot's speed, and at Expert a slash is most of your hitpoints), off it the
  moment it's nearer (burrowed up beside you, or walked in) by whichever heading has the most
  room, Kephri's body, the still overlords, her dung and the line behind counting as walls; the
  Soldier's spot kept clear before an intermission that brings it (it comes in slashing); and off
  Jungle Japes' peels (a slip roots you a second and a half, two slashes' worth). Between, a tile
  and a half from her (she's in the middle, and a Dung Strike from further out threw it against a
  wall, stunned among the dung). What used to loop it: standing still in the Soldier's reach to
  shoot another overlord, then peels rooting it there.
- **The Wardens**: phase one soaking the orbs of the side whose Warden its own style can't hurt
  first (a magic hero takes Tumeken's, so Elidinis' wakes open to magic; ranged the other way),
  walking to each orb's next tile along its trough till it holds the most, then a step off every
  orb; off a pyramid as its hits come (one side's cells while the other's are hitting); phase two
  by the Warden or its core (a thrower keeps Tumeken's at its weapons' reach all round rather than
  backing to the floor's end into its slash), off the obelisk's marks; phase three in front of
  the Warden, as near as its weapons need, in the column the next slam leaves alone (kept from the
  one landing till the next's a step away), on its siphons, off the enrage's lightning, the phantoms' fans, fireballs and
  rocks. It waits by the Wardens' door for its hitpoints to come back
  before stepping in, while they do (not with Dehydration, and not for ever).
- **Crondis at higher path levels**: hungry crocodiles at the palm eat what's poured faster than
  the trips bring it, so with nothing in hand a melee hero goes for them (and for any crocodile
  loose in the palm room, which would bite the next trip's water out of it) before the next trip;
  a thrower fights them from across the palm.
- **Level-ups** (the Tombs sim's): a new weapon of a style it lacks of ranged and magic comes
  before anything, as a player who's read "Only ranged hurts it" picks: the Wardens' second phase
  takes nothing else from a hero with only one of them.
- **Co-op**: one player works a puzzle two would undo between them (mirrors, plates) and the rest
  fight beside them, clear of it; each carries their own water.

`scripts/game/simulate-tombs.ts` is the raid's own sim: one puzzle room, one boss, the Wardens or
the whole raid (`ROOM`), over seeds, path levels (`LEVEL`), invocations, co-op parties (`PARTY`) and
kits (`KIT=max`, the dev kit). Each puzzle room has its own account, which no other part of the game
has: Apmeken's issues fixed and missed, Het's mirror turns, beam pulses and seal openings,
Scabaras's boards and wrong steps, Crondis's fills, trips, spills and growth; and every run says what
hurt it, by source and by boss attack.

Without the max kit, a boss (or a room with paths before it) is reached by playing the raid up to
it from the Nexus (`PATHS=` for the order), so the run has the levels and gear it would really
have; the bot loots as a person does (caskets, the better gear, food when hurt). `INVOCATIONS=level:300`
makes up a raid level as people tend to (the bosses' own first; never Attempts or a time limit).
`scripts/game/sweep-tombs.sh` runs every room, or the raid, by raid level and kit, a line each: the
account's state, caskets dropping as they always do (`zero`, nothing bought; `mid`, half the shop's
ranks and half of each Armoury line, `META=mid ARMOURY=mid`; `all`, everything, `META=max
ARMOURY=max`; `shop` and `dev` on request).

What it showed (November 2026, after the playtest pass: full raids, warrior, wizard and ranger, 3
seeds each, raid levels 0, 150, 300 and 500; Fresh is `zero`, Mid-game `mid`, End-game `all`). A
loss is a run that hit the sim's 90 minutes still trying: no Attempts invocation was on, so a
wipe only starts the room or boss again, and the only revive is the shop's Ring of life (one a
raid, not given back after a wipe). How far each lost run got: paths cleared, then the Wardens'
phase reached.

| Invo Difficulty | Fresh Account                             | Mid-game                                                     | End-game                                                                  |
| --------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Entry (0-149)   | 7/9 won (2 lost at the Wardens' phase 2)  | 8/9 won (1 lost at the Wardens' phase 2)                     | 9/9 won                                                                   |
| Normal (150+)   | 0/9 won (furthest: the first path's boss) | 7/9 won (lost: 1 at 3 of 4 paths, 1 at the Wardens' phase 2) | 6/9 won (lost: 1 at the Wardens' phase 2, 1 at 2 of 4 paths, 1 at 1 of 4) |
| Expert (300+)   | 0/9 won (furthest: the first path)        | 0/9 won (furthest: 2 of 4 paths)                             | 5/9 won (lost on paths 1 to 3)                                            |
| Max invo (500)  | 0/9 won (furthest: the first path)        | 0/9 won (furthest: the first path)                           | 0/9 won (furthest: 2 of 4 paths)                                          |

- Fresh account indicates anywhere from zero to a bought skills, but no upgraded armory
- Mid-game indicates a decent amount of bought skills and mid-gear in armory
- End-Game indicates optimal skill setup and end-game gear upgrades in armory

Before the Wardens' second pass and the playtest pass, Expert with everything bought was 8 of 9;
it's 5 of 9 now. The losses are on the paths before the Wardens (the sweep doesn't say which
rooms), and every run that reached the Wardens won. Normal End-game at 6 of 9, under Mid-game's 7,
is the bot: two of its losses stalled with no wipes.

The curve asked for: Entry with nothing, Normal with the shop and better gear, Expert with the
best of everything, and 500 past all three (with everything bought they stall in the Apmeken
room or on Ba-Ba). Before this pass Expert with everything bought was 1 of 9: Akkha's Memory Blast
was the first wall (the bot now hops across the quadrants' lines as a person does, and Expert
Akkha alone went from 0 of 9 to 8 of 9), then Zebak's acid for melee, and the Wardens. What the
Wardens needed, found by tracing each wipe: no blocking of a side from Normal up (each orb blocked
is 2 hitpoints times the hazard scale, 140 a minute at Expert, which was most of what killed the
bot in phase one), the two Wardens staggered so their pyramids and shots never land together (a
content change: `WARDENS.charge.start`), a weapon of each of ranged and magic picked up at
level-ups for phase two (the sim's bot ranked level-ups blind, so a wizard could arrive with
nothing that hurt Tumeken's ranged form and fill its shield at a percent every ten seconds), the
thrower kept out of Tumeken's slash, its skulls dodged while it was off the obelisk's marks, and
the red skulls' turning modelled. The one Expert loss left, and Normal's with the shop alone, are
the second phase for a hero whose off-style weapon is weak: the shield fills slowly and the
phantoms and skulls win the race. Balance changes in the same pass, flagged in the pull request:
Kephri's Dung Strike knocks 3 tiles (6) and stuns 0.8 s (2), and a boss's adds drop a third of
Entry's food at Expert (none before). The bot dodges, it doesn't plan, so Expert and past it are
set by the curve and want playtesting more than the bot's numbers.

What the bot still does worse than a person, measured at Expert Akkha with the best of everything
and God mode on: about 25 damage a minute from his bullets, most of it Red sand's tracking
triplets, Sandstorm's spirals and Stamp's rings. It sidesteps what's in flight; it doesn't strafe
round him or read a volley before it fires, and standing further out made it worse, since it then
retreats along his bullets' lines as he comes. A planner that read the emitters' volleys and
searched a path over 1.6 s was tried and measured no better, so it isn't in. At Zebak a melee hero
still takes his acid's poison when every spot in reach is a pool and no jug's placed to roll (about
a third of Expert melee runs on him wipe once or twice there), and a Wardens run with a weak
off-style weapon can sit in phase two for ten minutes.

**For trying a boss** (the dev server only, solo): God mode, on any map, and in the Nexus a button
to each boss (the path bosses as the run is, with the dev skip's bow; the Wardens with the best of
everything or as the run is). With `?devtools` on the dev server only (`GameClient.devTools`), so
never in a build.
