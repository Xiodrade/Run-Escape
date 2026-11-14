# ScapeRune

ScapeRune makes maps that don't exist in OSRS: our own ground, heights, water and paths, with real
cache objects and buildings on top. It's self-contained: everything is in this folder, and nothing
outside it needs changing to make a map.

| You want                                           | Go to                                                        |
| -------------------------------------------------- | ------------------------------------------------------------ |
| To know what makes a map good                      | [Designing a map](#designing-a-map)                          |
| To know which setting or function to use           | [Building it, step by step](#building-it-step-by-step)       |
| To know how a city, town or hamlet is put together | [The flow](#the-flow)                                        |
| To know whether it worked, and what to do if not   | [Checking a map](#checking-a-map)                            |
| Not to spend a round finding out it can't be done  | [What the engine can't do yet](#what-the-engine-cant-do-yet) |
| Everything else                                    | [Reference](#reference), then [Traps](#traps)                |

**Most maps here are dev maps.** Those are in `maps/devMaps.ts`, and only show on the dev server (or with
`DEV_MAPS=1` in a script). A run on one doesn't touch the save. A build leaves them and the map generator's screen
out completely: `vite.config.ts` swaps `devMaps.ts` and `MapGeneratorScreen.tsx` for the `.build` stand-ins beside
them, so the generator's code doesn't reach players. If the game starts importing something new from either file,
add it to the stand-in too. A map that ships is listed in `maps/shippedMaps.ts` and has a real entry in `MAPS` with
`scaperune: true`: see [Shipping a map](#shipping-a-map).

## Designing a map

Design before settings. Noise and scatter on their own give even ground where every screen looks like the last, with
nowhere to arrive at, and a map like that can pass every reachability check and still look awful.

The numbers here are measured from the real world with the same code that measures our maps: all 935 populated surface
squares, and 15 rectangles of real places. The scripts and results are in `scripts/scaperune/research/`. The write-up
with sources isn't in the repository (it's on the team's VM); the numbers below are what matters from it.

### Plan it first

Write this down before touching a setting:

1. **The one idea.** What makes this map that map. Hosidius is a market, Piscarilius is boardwalks, Lovakengj is
   furnaces, the Farming Guild is a glasshouse. None of those is a big object. Each is a way things are put together.
2. **The size, and keep it small.** 192 tiles a side is about four hamlets a side, or one town and its country. Jagex's
   own verdict on the first Zeah was that it was bloated, and the cure for Kourend feeling vast but empty was density.
   20 buildings over 192 by 256 tiles is that same mistake.
3. **The places**, about 50 tiles apart, most of them hamlets of one to three buildings, and one or two that matter.
4. **The way through.** Roads join the places. Something should be near any road: about 8 tiles at the median in the
   real world, 16 to 40 at p90, and never much past 80.
5. **Where it's quiet.** Quiet land is part of the plan, not what's left over.

### Pacing: contrast, not evenness

A screen is what the play camera sees, about 27 by 16 tiles. It looks north, so keep a set piece within about 6
tiles north of where the player stands: the Theatre's arrivals are 3 to 7 tiles south of each boss, and Phosani's start is
7 south of her.

- **Real screens run from nothing to 130 or more objects.** Over whole regions, p10/50/90 is 0-16 / 18-73 / 129-185.
  Aim for about **5/40/130**.
- **Empty is fine.** 5% to 35% of real screens have under 8 standing objects. What's wrong with a made map is usually
  the top end: no dense place to come to. Maps whose screens are all alike are what "poor pacing" means here.
- **Empty still means dressed.** An empty real screen has 110 to 170 small things on the ground. Quiet land has no
  scenery, not no detail.
- **Places are about 50 tiles apart** (49 to 56 at the median, hamlets included). Big towns are 150 to 300 apart, so an
  arena rarely holds two.
- 8% to 20% of walkable 8-tile chunks have a building in them.

### Landmarks: a place is a composition

- **Big locs are almost absent.** 89% to 99.6% of real scenery is 1 or 2 tiles. Size 5 and up: 1 in Hosidius town, 0 in
  Shayzien, 1 in Varrock.
- **A landmark is normal things put together**: a square with a well, a market, a farm with crops and a fence, graves
  among bushes, a shrine on paving. None of it would stand out alone.
- **It goes at the end of a street or in the middle of a square**, where a road brings you to it.
- **One big loc is a rare accent.** It's a player's memory of somewhere else, and a map full of them reads as a museum.

### Towns: tight, with a middle

- **A town has a formal heart and organic edges.** Hosidius: a paved market about 19 by 15 with a well and four stalls, a
  street off each side, then dirt tracks and gardens. Shayzien: one long paved axis. Civitas: stone roads and walled blocks.
  Auburnvale has no paving at all. Both grid and organic are right, on purpose.
- **Tight.** Buildings 3 to 5 tiles apart, 33 to 72 tiles indoors at the median, 10% to 25% of a town's rectangle indoors.
- **Streets** about 8 wide, alleys about 3, squares and main streets about 15.
- **One town, one kit.** 5 to 12 wall ids make up 90% of a new town's walls, and its fences and paths come from the same
  family. Jagex calls these wall kits.
- **Ground is divided up.** 5 to 8.5 free-standing fence walls per 100 tiles in farm towns: yards, pens, fields, gardens.
  Fence groups of things, not each building.
- **Buildings stand on the street, not in a lawn.** 12% to 69% of the two tiles outside their walls is path or paving, and
  doors are a tile or two from a path.
- **Towns are flat.** 76% to 89% of walkable tiles in Hosidius, Shayzien and Civitas.
- **The edge is a fade, not a line.** Over about 32 tiles walls fall away and trees take over. Decoration stays level:
  only the kind of thing changes, not how busy the ground is.
- **What players see is the ground plan.** The game draws one plane, so roofs vanish, but for tiles flagged to show from
  the ground, as the tops of city walls are. Floors, interiors and furniture matter more here than in OSRS itself.

**West Varrock, measured** with `research/street-survey.ts`, over 56 by 90 tiles from 3176,3383, against a `Walled city` of 101 by
93 at seed 2 with `sideStreets` at 0.8. It's a long paved street with blocks off one side and lanes of 2 or 3 tiles round them, and
a block is one to three big buildings, not a row of little ones.

| Measure                             | West Varrock | Generated  |
| ----------------------------------- | ------------ | ---------- |
| Buildings per 1000 tiles            | 3.6          | 3.0        |
| Indoors                             | 26%          | 11%        |
| Path                                | 25%          | 24%        |
| Walkable                            | 70%          | 82%        |
| Tiles indoors a building, p25/50/75 | 25/45/79     | 28/35/48   |
| To the nearest building, p25/50/75  | 0/4/5        | 3/4/6      |
| Buildings with one within 2 tiles   | 44%          | 0%         |
| Sharing a wall                      | 11%          | 0%         |
| Buildings a block, median and p90   | 1 and 3      | 1 and 2    |
| A block's long side, p50 and p90    | 9 and 26     | 7 and 14   |
| A block's short side, p50 and p90   | 6 and 17     | 5 and 10   |
| Between buildings, p25/50/75/90     | 5/7/10/24    | 5/10/15/20 |
| Runs under 5 tiles, as a share      | 8%           | 7%         |
| A wall's outside with a path by it  | 50%, median  | 29%        |
| Street edge with a building by it   | 31%          | 25%        |
| What's within 4 of a wall, on path  | 37%          | 22%        |
| Free-standing walls per 100 tiles   | 13.5         | 9.4        |

So density and paths are about right. What's short is size: our buildings are smaller, none are the real thing's 165 to 340 tiles,
and they stand further apart. Crowds need the room, so the gaps stay wider than the real ones on purpose.

### Terrain: flat, then a step

- **Three quarters of real walkable ground is dead flat.** Land is levels joined by short faces and ramps. Noise leaves
  every tile slightly tilted, which reads as a soft blanket.
- **Faces are short and finished.** 2 to 4 tiles deep, 12 to 30 a tile, a drop of 30 to 60, then flat. Median drops are 27
  to 53. A drop past 150 is rare, and a big rise is several faces, not one. 99.96% of real tiles are 80 a tile or under.
- **Steep ground is 4% of the surface.** Hills are low: Lumbridge's fields run from 0 to 80.
- **A plateau is flat on top**, and the ground past a face is often flat within 2 units.
- **Paths are flatter still**: median slope 0 to 2, p90 1 to 7.
- **The camera decides what reads as height.** It looks north from high up, so a mountain's something you walk under, not
  something you see. Light, cliffs and ledges a dozen tiles across are what read, and only faces looking south are seen.

A real cliff is one of four things:

| Kind       | What it is                                                              | Where              | How to make one                                                            |
| ---------- | ----------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| Massif     | Rough heights, plain colour, pebbles on most tiles, no big locs         | Trollheim          | `rockFaces: 0`, or `share: 0` in `dressRock`                               |
| Ledge      | A steep band of plain colour, heaps on 30% to 50% of tiles, and pebbles | Auburnvale, Kebos  | The default: `rockFaces: 1` with `terraces`                                |
| Carpet     | A contoured facet on every tile, on their own near-black floor          | Karuulm, Lovakengj | A biome with `facets`: `ash`, `deadlands`, `darkwood`                      |
| Built edge | A drop of 1 to 3 tiles with walls along the top, and no rock            | Falador            | By hand only: see [what the engine can't do](#what-the-engine-cant-do-yet) |

Pick one per place. A line of big objects along a cliff is none of these.

### Ground: flat colour with a carpet on it

- **Paint with flat colour.** Only 10.8% of real land overlay tiles have a texture, and most of those are swamp and lava.
  Overlay 20 covers 562 tiles of the whole surface, 32 covers 143 and cobbles (12) cover 1,249. A texture is a tile's
  accent on a floor a few tiles across. Stretched down a face or over a yard, it turns into bands.
- **Plain overlays to use**: `14` dirt, `83` mountain rock, `22` and `80` sandy paths, `81` paths and docks, `10` town
  paving, `171` Varrock's street stone, `11` dark ground, `115` Karuulm's rock.
- **Dress every tile.** Real land carries 35 to 64 small things per 100 tiles by floor, and paths 30 to 60. It's the largest
  single difference between real and made ground, and it costs nothing in collision.
- **Rock stops at the cliff.** The walkable tile beside a face is ordinary dressed ground. Only 2% to 20% of real tiles at
  a cliff's foot are on an overlay, and they carry 29 to 93 decorations per 100 tiles.
- **Roads say whose they are.** Median width 2 to 4. Paving in a core, dirt out from it, narrow tracks to single houses, and
  pebbles of the same family on the road and its shoulder.
- **Shores are lined**: 26 to 155 locs per 100 edge tiles, in reeds, roots, soil, pebbles and rocks.

### What world objects are for

| Layer             | Loc type        | Real, per 100 tiles | What it's for                                         | Blocks         |
| ----------------- | --------------- | ------------------- | ----------------------------------------------------- | -------------- |
| Ground decoration | 22              | 20 to 65            | The carpet: pebbles and grass, by floor               | Only at clip 1 |
| Soft scenery      | 10, clip 0      | 0 to 9              | Body without blocking: flowers, crops, ferns          | No             |
| Solid scenery     | 10, clip over 0 | 5 to 10 in towns    | Trees (1 to 3), rocks, props, furniture               | Yes            |
| Walls and fences  | 0 to 3          | 4 to 20 in towns    | Divide the ground, close a view, hold a street's edge | A tile's edge  |
| Wall decoration   | 4 to 8          | 0 to 3.6            | Detail that takes no room                             | No             |

- **Things sit against things.** 30% to 58% of a town's props touch a wall, half are in groups, and the groups are kits:
  barrel with crate, table with stools, flowers with bushes, graves with bushes, reeds with lilies. A lone prop looks dropped.
- **If it's on a slope, it's contoured.** A contoured loc bends to the ground. One that isn't stands level, and shows its
  underside on the low side. 92% to 100% of real ground decoration is contoured, and so are all the rock kits.
- **A footprint says nothing about a model.** Sea rocks look like boulders and sink 3.5 tiles. The Tombs of Amascut's floor
  plates stand 6 tiles high. Check a new loc before using it: see [Trying a new loc](#trying-a-new-loc).
- **Use what was made for the open.** Nothing from a raid floor or a boss room: the Theatre of Blood's rooms and the
  Nightmare's arena are on the ban list by range (`THEATRE_LOCS`, `NIGHTMARE_LOCS` in `catalogue.ts`). A map that's a raid
  or a boss room on purpose is a shipped map, and lists the banned ranges it uses in `allowLocs`: see
  [Shipping a map](#shipping-a-map).
- **Don't use broken assets.** Some locs are pieces of a kit, meant to be combined with others: a wall's sections, half a
  model, one face of something, the levels of a stack. Alone they have holes or invisible sides, or read as something else
  from the camera. Use one only with its whole set, as designed: cut together from the real place, or placed with the rest
  of the set. `KIT_PIECES` lists the known ones.

### The one rule that's ours: density goes in what doesn't block

Real views are 2 to 6 tiles at the median, and a real town's 3 tiles would be a trap here. Run Escape needs room for crowds and
kiting, so this is where we leave the real world. Raise soft density a lot and solid density a little: decoration, wall
decoration, flowers, fence lines and the sides of streets, not more trees and rocks. Keep the view's median at 4 or
more, and about 5 where a crowd fights. Use streets of 7 to 9, and accept alleys as dead-end cover.

### Four rules for the ground

These come from a playtest, and `check-maps.ts` fails a map that breaks one. They hold on every map, generated or by hand.

1. **Fields are flat.** Every field, its fence and its rows stand on one level plot, pinned. A field that's meant to slope
   says so in its recipe (`slopes: true` in `fields`). Fields are found by their crops, so leaving a field out of `fields` doesn't
   get it past the check.
2. **Roads can be walked.** A road tile in land you can walk on is walkable: nothing solid on it, on a bridge's deck or at its
   ends, and it doesn't run onto blocked ground. A road that's shut on purpose is marked in the recipe (`closedRoads`) and shown in
   the world, with a gate, rubble or a broken end.
3. **Water is flat.** Every corner of a water tile is level, each lake or pond is one level, and a river is flat reaches with its
   height changing only at a fall. The banks and the ground rise to meet the water, never the other way round: 96.7% of real
   surface water tiles are dead level. Only the tiles that drop at a real fall can tilt (`waterDrops`).
4. **A fall is seated in its face.** Level across, its foot in a pool, its top at a lip or a source, with rock at its own heights
   down both edges. A spot that doesn't fit is refused. See [Water](#water).

## Building it, step by step

**Use the generator unless the map needs a shape it can't make**, like a coast drawn by hand or a road up a cliff in
hairpins. A generated map is one line, and gets every rule below for free. A hand-made map is a recipe of a thousand lines
that has to ask for each of them.

Each step here has what to reach for in both. The settings are all in `SETTINGS` (`settings.ts`), with their limits.

### 1. Squares and size

Generated: add a line to `GENERATED` in `maps/devMaps.ts`, with a map's id, its `mapX`, its settings and its `mapY` (104 if
left out). Only `seed` is required: the rest come from `DEFAULT_SETTINGS`.

```ts
["scaperune_oasis", 78, {
    seed: 42,
    biome: "desert",
    squaresX: 3, // arena size in map squares, each way: 1 to 28
    squaresY: 3,
    boundary: "hills", // what stops you: sea, forest, hills, fence, mountains
    hills: 0.2,
    ponds: 2,
    trees: 0.2,
    roads: 1,
    roadStyle: "ring", // branching, ring, spine
    buildings: 0.8,
    towns: 1,
    landmarks: 0.6,
}, 88],
```

The grid is the arena plus a square of margin each side, so that line takes squares x 78 to 82, y 88 to 92. Nothing
checks that two recipes don't overlap, so look through `devMaps.ts` and each hand-made map's `mapX` and `mapY` first: see
[Squares must be free](#traps).

The same seed and settings always give the same map. It's generated at load from a fixed palette (`BIOMES`, `PREFABS`,
`BRIDGES` and friends), and nothing is baked to a file.

Hand-made: a `MapRecipe` (`recipe.ts`): see [Writing a recipe by hand](#writing-a-recipe-by-hand). `squaresX` on a recipe
includes the margin, and in `GeneratorSettings` it doesn't.

### 2. The land

Work on shapes with `relief.ts`, which takes seconds and no cache:

```sh
bun run tsx scripts/scaperune/relief.ts out.png seed=7 mountains=0.6 peakHeight=240
bun run tsx scripts/scaperune/relief.ts out.png preset=Alpine seed=3
```

| To get                   | Reach for                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Flat ground              | **Lower `hills` first**, then `flatness`. See below                                                      |
| Short faces, split drops | `terraces` (default 0.75), `terraceHeight` (default 30), and `peakHeight` for how tall it all is         |
| Ranges                   | `mountains`, `peakHeight`, `ridgeScale`, `ruggedness`, `warp`                                            |
| Shapes of land           | `plateaus`, `mesas`, `canyons`, `canyonWidth`, `volcanoes`, and `heightmap` in place of hills and ranges |
| What can be walked       | `walkSlope` stays at 12: it holds 98.1% of real walkable tiles                                           |

What moves flat land, on 2 squares of meadow, by the check's `flat` figure: at `hills` 0.5, `flatness` 0 gives 14%, 0.5 gives
30%, the default 0.75 gives 36% and 1 gives 37%. At `hills` 0.3 it's 42%, or 47% at `flatness` 1. At `hills` 0.15 it's 47%.

Terraces on 3 squares of mountains (`mountains` 0.5, `peakHeight` 170): `terraces` 0 gives a median drop of 63 to 73, 0.75
gives 46 to 48, which is inside the real range, and 1 with `terraceHeight` 24 gives 46 to 53.

Hand-made: heights live in `Terrain` as floats, and things that need a height **pin** it ([Height](#height)). With a `Build`,
`finishHeights` does all the limits. Without one, call `limitNorthFaces`, `limitFaces`, `liftFaces` and `limitNorthFaces`
again from `terrain.ts`, as it does, with 30 and 72 as the limits. `maps/vardhelm.ts` carves from a massif, and
`maps/shatteredRealm.ts` works without a `Build`.

### 3. Water

`rivers`, `riverWidth`, `riverValley`, `lakes`, `ponds`, `waterLevel`, `island`, `shoreRoughness`, `waterfalls`,
`cliffFalls`. Rivers follow the low ground, in flat reaches. `waterfalls` is the share of a river's chances to drop that it
takes, so at 0 a river's one level end to end and its valley's cut down to that. A shore gets its dressing from `dressGround`,
which covers land beside water and puts reeds in fresh water. Hand-made: see [Water](#water), and
[Floors and heights](#floors-and-heights) for painting it.

Bridges want about 11 tiles of straight land each side and a crossing of 9. A river without that gets a ford, and fords
are how the generator joins anything big that's cut off.

### 4. Places

- **Places about 50 tiles apart**: `sites` (default 1). About 1.2 to a map square, 50 from each other and 25 from the spawn.
- **Quiet land between them**: the same setting. `createPace` scatters 2.6 times as much within 14 tiles of a site, and 0.6
  times past 30.
- **Hamlets**: `buildings` with `towns: 0` and `roads` over 0. Buildings gather at the first sites, about 3 to a hamlet.
- **A town**: `towns`, `townSize`, `buildings`, and `roads` over 0.
- **Side streets**: `sideStreets`, how close together a town's lesser streets run, and how a block's filled: see [the flow](#the-flow).
- **Something to see along a road**: `sites` at 1 gives a stone every 40 tiles, and `waymarkers` at 1 makes that 16.
- **Yards**: `gardens`. A planned town's streets get at least 40% whatever it's set to.
- **A wall round a town**: `townWalls`, only for `towns`, and `wallKit` for whose. Hamlets never get one. See
  [City walls](#city-walls).

Every one of these goes through [the flow](#the-flow). `buildings` at 1 means 3 buildings a map square. `layOutTown` picks the
kind by how many a town wants, which is what's wanted over the whole map shared between its towns:

| Kind     | Wanted     | Square          | Streets             | In the middle     |
| -------- | ---------- | --------------- | ------------------- | ----------------- |
| `market` | 10 or more | 19 by 15, paved | 4, 7 wide           | Well and 4 stalls |
| `axis`   | 5 or more  | 11 by 9, paved  | 2 in a line, 7 wide | Well              |
| `hamlet` | Under that | 9 by 9, green   | 2, 4 wide           | Well              |

You can't choose a kind directly. At 10 or more it's a market 60% of the time and an axis otherwise, by the seed, and it
drops to the next kind down if the ground won't take the square: it wants 20 units of rise or less, away from water, cliffs
and the spawn. So try a few seeds, keep `hills` low, and look at the preview. If nothing fits, the buildings go on the loose
ground round the middle.

`fillTown` puts the biggest building on the square, the rest along the streets 3 to 5 tiles apart with doors onto them, one
church to every 12 buildings, and a fenced yard behind many. Each gets a step of road to the street, so the rule about doors
and roads holds. Paving runs over 65% of a market or axis's reach, in the biome's `paving` or Varrock's `171`. Trees come back
over 32 tiles past that, or 8 from a hamlet (`createTownFade`).

**One kit per town** is automatic: a town picks a family of prefabs by the start of their names (`lumbridge_house` is
`lumbridge`), and its fence goes with it (`KIT_FENCES`). A family with one prefab makes a town of copies: see
[Biomes](#biomes) for how many each has.

`placeVignettes` then puts one or two groups of 3 to 6 small things against each building, on a wall without a door, from
`VIGNETTES`. They're biome by biome, from what its towns really have. They block, so they keep off roads and leave a tile
clear. `fairy` has none.

Hand-made: `layOutTown`, `fillTown`, `placeVignettes`, `placeSetPieces` and `createPace` all want a `Build`, and all but the
last two a `RoadNetwork`, so they're for a map that has those, as `maps/kaluasWake.ts` does. None of the three hand-made maps
calls them yet. Without them, stamp prefabs with `PrefabKit` and lay the town out by hand, to the numbers above and in the
same order: see [By hand](#by-hand). Keep to one family, and put a square in the middle.

### 5. Landmarks

`landmarks` is how many: about 1.5 pieces a map square on land at 1, and 1 in water. Sites with nothing on them get the
first of them, and each biome lists its pieces in `landmarks` in `biomes.ts`. The least used goes next, so a map gets a spread.

Reach for a **recipe** first, in `SET_PIECES` (`structures.ts`): `market` (`meadow`, `desert`, `jungle`, `autumn`), `farm` and
`orchard` (`meadow`, `autumn`), and `shrine` (`meadow`, `desert`, `snow`, `ash`, `elven`, `astral`). To add one:

```ts
well_yard: {
    kind: "recipe",
    sizeX: 11,
    sizeY: 9,
    paved: true, // the biome's paving, or Varrock's, over the whole plot
    // fenced: true, // a fence round it, with a gate in the south side
    // crops: [15506], // on every other row of what's left of the plot
    locs: [
        // [loc id, tiles across, tiles deep, x on the plot, y on the plot, rotation]
        [884, 2, 2, 4, 3],
        [362, 1, 1, 2, 2],
    ],
},
```

Then name it in a biome's `landmarks`. The palette picks it up through `getPieceLocs`. The other kinds are in
[Set pieces](#set-pieces). `single` is the one to be careful with: it's one big loc, with the biome's small things round it.

Hand-made: `ground.place` a composition yourself, on a flat plot. With a `Build`, `pinPlot` makes the plot. A field's a plot
too: pin it before the heights finish, and return it in `fields` (`fencedField` in `maps/vardhelm.ts` is the one to copy).

### 6. Rock

Rock's automatic on a generated map: `paintRock` then `dressCliffs`, from the biome's `RockDef`.

`rockFaces` is how much gets heaps or facets: 0 leaves pebbles only. `rubble` is rock lying about on the mountains. `snow`
brings the snow line down, and past it `SNOW_ROCK` dresses cliffs, which have no overlay there. The dev map
`scaperune_rocksheet` shows every biome's rock from the play camera, and `scaperune_cliffs` shows single locs on a steep band.

Hand-made, in this order. They only need a `Ground`, so any map can call them:

```ts
// Before anything stands on the rock. Never paintOverlay for rock: it smooths out onto the walkable ground.
paintRockFloor(ground, rock, overlay, skip);
// Once the tiles are blocked and whatever stands there has come out of the mask
dressRock(ground, rock, { kitAt, seed: SEED + 202, share: 1 });
```

`rock` is a mask of tiles, and `dressRock` only uses the ones that are blocked and aren't water. `kitAt` gives a `RockKit`
for a tile: a biome's `rock`, or your own. Give it a seed of its own, so that it moves no other roll.

What it does: on tiles over 16 a tile, a 2 by 2 heap on 45% of them at a share of 1, where all four tiles are free rock. With
`facets`, a facet on everything within 3 tiles of a face. Then pebbles on 40% of what's left, up to 44 a tile, because past
that they bend into shards. Facets only work on their own dark overlay (115, 99, 11). Anywhere else they read as shards.

### 7. Scatter

`trees`, `treeClumping`, `treeMix`, `rocks`, `rockMix`, `props`, `flowers`, `grass`. Trees, rocks and props go by the map's
pace and thin out in towns, and flowers go by pace, so a map gets its contrast for free.

Of these only `flowers` and `grass` don't block, so when a map needs more on screen, raise those. A view under 4 usually
means `trees`, `treeMix` or `props` are too high.

Hand-made: `scatter` is private to the generator. Copy what you need, as `maps/kaluasWake.ts` and `maps/vardhelm.ts` do.
`createPace` needs a `Build` with `sites`.

### 8. Dressing

`dressing` (default 1). It runs last, on a seed of its own, and takes what's underfoot from `FLOOR_KITS` (`floorKits.ts`),
keyed `o14` for an overlay and `u48` for an underlay. On a floor with no kit it falls back on `biomeDecor`. A shaped edge
tile takes its overlay's kit half the time. Everything in a kit is type 22 and can't block, so where you can walk doesn't
change. It skips blocked tiles, buildings' tiles, decks and anything that already has a type 10 or 22.

- Between them this and scatter come to about 60% of real decoration (`DRESS_SHARE`). That's a decision, not a limit.
- A road gets at least 35 per 100 before that share, and any floor at least 25.
- Land beside water gets its floor's kit at 70%, and overlays 6 and 7 beside land get reeds on 14% of tiles (`REEDS`).
- The foot of a cliff gets at least 40%.

Hand-made, **last of all**, after reachability has blocked what it's going to, because nothing painted later should sit on it:

```ts
dressGround(ground, { seed: SEED + 300, density: 1, biomeDecor: (x, y) => [4735, 4736] });
```

### 9. Check it

Next section. Then, for anything more than a dev map, [Shipping a map](#shipping-a-map).

## The flow

**Every city, town and hamlet is built by these steps, in this order, by the one code path.** A hamlet's the same in small, and
the wall step's skipped when it has no wall. This is the fix for what went wrong before: walls were worked out from the buildings
afterwards and set pieces got there first, so one stamped over the other, and nothing kept a yard's fence off a road.

| Step | What                    | Where                                            | The rule                                                                      |
| ---- | ----------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1    | Site                    | `fitWall`, `findSquare`, `levelSite`             | Pick the ground first, and level it, so that the wall doesn't fight the land  |
| 2    | Walls and gates         | `reserveWall`, `planGates`                       | The town's shape comes first. Buildings are fitted to it, never the reverse   |
| 3    | Main streets and square | `layOutTown`, then `layMainRoads`, `connectTown` | Gate to square to gate before any building, then side streets                 |
| 4    | Plots                   | `fillTown`, `placeBuilding`                      | A building's plot holds its yard and fence, and they're reserved as one block |
| 5    | Lanes                   | `placeBuilding`, `addDoorPath`                   | To the doors, after the buildings, round every plot                           |
| 6    | Set pieces              | `placeSetPieces`, `placeRuins`                   | On whatever's left                                                            |
| 7    | Foliage and details     | `placeVignettes`, `scatter`, `dressGround`       | Last of all, and they ask like everything else                                |

**The reservation map.** `ground.claims` (`reservations.ts`) holds one rank a tile, and each step asks it before taking ground.
Nothing later can take a tile from anything earlier, and the rank order is strict:

| Rank | Constant         | What                                    | Asks with                          |
| ---- | ---------------- | --------------------------------------- | ---------------------------------- |
| 1    | `RESERVE_WALL`   | A wall's band, towers and all           | Nothing: it's first                |
| 2    | `RESERVE_GATE`   | A gate's clear space, both sides        | Nothing: gates are planned with it |
| 3    | `RESERVE_STREET` | Main streets and squares                | `canPave`                          |
| 4    | `RESERVE_PLOT`   | Buildings with their yards and fences   | `isFree`, `hasNear`                |
| 5    | `RESERVE_LANE`   | Every other road, out to what it paints | The router, through `reserved`     |
| 6    | `RESERVE_PIECE`  | Set pieces, landmarks, ruins            | `fitsBuilding`, through `reserved` |
| 7    | None             | Foliage and details                     | `ground.isClear`                   |

A tile that's taken is also set in `ground.reserved`, so everything that already asks `isClear` is asking this map. `markTile` is
the one way round that: it marks what a road's edge can paint, past where foliage is kept off, so that buildings keep off the paint
and flowers can still grow up to it. A vignette is the only thing that stands on a claimed tile, because it's asking for its
own building's plot.

**The numbers.**

- **A gate keeps 12 tiles clear behind it and 8 in front** (`GATE_CLEAR_IN`, `GATE_CLEAR_OUT`), across its width and 2 tiles past
  each side. Only its road goes there. 12 is about three quarters of a screen's height, so a gate opens on to a street you can see down.
- **A wall is as big as its buildings need**: 360 tiles of town a building, which is about a sixth of it indoors, capped at
  `townSize` and never under 30 from its middle, which is what it takes for a gate's clear space and a row of plots. It's
  stretched up to 20% either way by the seed, and each side then comes in till it's on ground that takes it. Each corner's then cut by 4% to 30% of the shorter side (`cutWallCorners`), by a roll and on
  past bad ground, which is what stops a city being a box. `WallRect.cuts` holds them, and `placeCityWall` takes them too.
- **Gates go where outside roads arrive** (`getArrivals`): where the main road's line crosses, or else facing the spawn, a bridge
  or another town. A wall has at least 2, and a side 56 or longer gets one anyway. Each lies on a column of the square, so that
  its street's dead straight.
- **A plot's** a tile round the walls, plus the yard. Walls stand 1.5 tiles off a street's edge, plots 1 apart, buildings 3 to 5.
- **Site.** The ground under a town goes to its square's height, walls and all, and back to the land's over 6 tiles past its
  edge and from water and cliffs (`levelSite`), so a city's on one level and its buildings all fit. A wall won't go where the
  ground rises over 80 inside it.
- **Side streets** run as ribs off the long way through a town, as West Varrock's do, 4 wide. `sideStreets` at 0 has none, and from
  there they run 34 tiles apart, down to 20 at 1, with up to 6 more by a roll. Two sets of them, one off each way, cut the ground
  into blocks with room for a building each, so it's only the one set. They run to the wall, and join a street if they meet one.
  Hamlets have none.
- **Past 0.6**, a side street gets lanes across it, 3 wide and about 30 apart, and buildings close up: a tile less between them, and
  plots of their own width. That, more than the streets, is what gets the buildings in. Lanes any closer than 30 take more room than
  they give: at 20 a block has room for one building.
- **Last of all a block's filled**: every 2 tiles of what's left, nearest the middle first and the smallest building first, anywhere
  a door's within 5 tiles of a street.
- **What that comes to**, of 38 asked for: `Walled city` at seed 3 gets 21, 22, 22, 25 and 22 with `sideStreets` at 0, 0.3, 0.5, 0.8 and
  1, and at seed 2, 24, 28 and 28 at 0, 0.8 and 1. `Town` gets 17 at 0 and 25 of 27 at 0.8. It's meant to stop where a city's full, and
  how much ground its wall gets matters more than the setting. The setting does the most to a small town.
- **Past 0.6 a town keeps to a family with buildings for blocks** (`BLOCK_FAMILIES`), if its biome has one. That's meadow's Varrock,
  whose five West Varrock houses only towns get. Tents, the open-fronted shops and anything else with no plain rectangle to cut
  were left out: `check-prefabs.ts` won't have an open one, and the tents read as circus tents repeated.
- **A wall has 2 tiles of open ground along its inside** that no plot takes, for a crowd to get round, and roads keep 3 tiles off
  either side of it (`WALL_ROAD_GAP`), because its ground's pinned and won't bend for them.

**Drop rather than break.** If something doesn't fit, it's left out: a yard before its building, a building before its town, a
wall that the ground fights before the town it was for. A city gets fewer buildings before it breaks a rule. Nothing's ever
moved or stamped over to make room.

**What's on the wall's band is the wall.** It only stops short of water, cliffs and bridges, which `reserveWall` finds at the
start, not of anything that got there first, because nothing can have.

### By hand

A hand-made map follows the same order, and `ground.claims` works on any `Ground`, so it needs no `Build`:

```ts
const { claims } = ground;
forWallTiles(kit, rect, (x, y) => claims.takeTile(ground.tile(x, y), RESERVE_WALL)); // the wall, first
for (const gate of gates) {
    for (const { x0, y0, x1, y1 } of getGateClear(kit, rect, gate)) {
        claims.take(x0, y0, x1 - x0 + 1, y1 - y0 + 1, RESERVE_GATE);
    }
}
claims.take(x, y, sizeX, sizeY, RESERVE_STREET); // the square and streets
if (claims.isFree(px, py, plotX, plotY)) {
    claims.take(px, py, plotX, plotY, RESERVE_PLOT); // the building, its yard and fence
    new PrefabKit(context).stamp(ground, name, turns, x, y);
}
```

Then lay lanes, then set pieces, then scatter with `ground.isClear`, and `placeCityWall` and `dressGround` once the heights are
done. To have `check-maps.ts` hold a hand-made map to this, its `detail` passes on `buildings` with a `plot` and `yard` each,
`fences`, `walled` and `clippedRoads`. Anything that's meant to break a rule, like a fence that a road runs through at a
gate, goes in `designed`, as rectangles of tiles, which is the only way out of a clash.

## Checking a map

**A round.** Run these checks often. On a small machine, run one cache task at a time. The team's
VM has a job wrapper for this outside the repository. Elsewhere, use `bun run tsx` directly.

```sh
bun run tsx scripts/scaperune/preview.ts out.png map=scaperune_oasis  # from above, and reachability
ONLY='scaperune_oasis$' bun run tsx scripts/scaperune/check-maps.ts  # every rule, on one map
bun run tsx scripts/scaperune/research/measure.ts out.json scaperune_oasis    # everything else
bun run tsx scripts/scaperune/world-index.ts world.json  # once, for the next line
bun run tsx scripts/scaperune/research/trap-scan.ts world.json traps.json scaperune_oasis
# scenery from above, which preview can't show
bun run tsx scripts/scaperune/research/overview.ts out.png map=scaperune_oasis 2
# triangles per camera view (PHONE=1 for a phone's)
bun run tsx scripts/scaperune/view-weight.ts scaperune_oasis
# faces in one plane, which z-fight
bun run tsx scripts/scaperune/check-coplanar.ts scaperune_oasis
# will a cut hold waves?
bun run tsx scripts/scaperune/find-prefabs.ts rect=3572,3230,100,120 pieces=1 doors=off
DEV_MAPS=1 MAP=scaperune_oasis bun run tsx scripts/game/simulate-run.ts wizard 1   # it plays at all
```

**Will a cut hold together?** `find-prefabs.ts rect=x,y,w,h collision=1` draws the game's collision (`.` open, `#` blocked,
`+` a wall on the tile's edge), and `pieces=1` lists the biggest pieces of open ground with their tile counts and boxes.
`doors=off` and `props=off` show what taking doors and one-tile blocking props off would open up. Meiyerditch's slums come
out in 190 pieces, the biggest 1,356 tiles; with doors and props off it's 4,116. Run it on every cut before building on it:
a town that falls into pieces has nowhere for waves to come at you. In a recipe,
`findPieces(getCollisionFlags(grid, locs), sizeX, sizeY, rect)` (`collision.ts`) gives the same list, biggest first, to throw on if the biggest is too small.

Before you finish, run `bun run test:maps` (`MAP_CHECKS=1 vitest run src/game/scaperune`; a plain
`bun run test` leaves the map checks out). It runs `check-maps.ts` over every
dev map, about 60 settings at their extremes, the presets and 12 random rolls. That takes a few
minutes.

### The look line

`check-maps.ts` fails on the rules below, and prints a line a map with what's only worth knowing:

```
look scaperune_town: decor 40, road 22, steepest 11, on steep 25%, foot rock 0% decor 100, view 7; objects 32/69/141, kinds 9, flat 69.9%, indoor 3.2%, gap 6, size 6+ 0
```

It measures the arena only, with the same code the real world was read with. It holds every dev map and sweep, and a
hand-made map if it has a `detail`, but not shipped maps. The bars sit under the real range on purpose, and "Now" is what the
dev maps came to when this was written.

| Field        | What                                 | Real                                      | Fails at                  | Now                            |
| ------------ | ------------------------------------ | ----------------------------------------- | ------------------------- | ------------------------------ |
| `decor`      | Decoration per 100 land tiles        | 26-39 regions, 20-65 places               | Under 20                  | 26-57                          |
| `road`       | Decoration per 100 road tiles        | 23-96, mostly 30-60                       | Under 15                  | 20-41                          |
| `steepest`   | Steepest tile, height units          | 80 at most                                | Over 80                   | 72 at most                     |
| `on steep`   | Steep tiles (16+) with a loc         | 12-83, mostly over 30                     | Under 25%                 | 25+                            |
| `foot rock`  | Cliff's foot on a rock overlay       | 2-20, up to 56                            | Over 30%                  | 0                              |
| `foot decor` | Decoration per 100 tiles at a foot   | 29-93                                     | Under 20                  | 46+                            |
| `view`       | Tiles you can see, median            | 2-6                                       | Under 4                   | 4-8                            |
| `objects`    | Standing objects a screen, p10/50/90 | 0-16 / 18-73 / 129-185                    | Report only, aim 5/40/130 | 5-32 / 13-69 / 32-141          |
| `kinds`      | Kinds of object a screen, median     | 12-48                                     | Report only               | 7-17                           |
| `flat`       | Walkable tiles that are dead flat    | 75 in the world, mostly over 30 in places | Report only, aim 40+      | 24-70                          |
| `indoor`     | Share of the arena indoors           | 9-26 in a town's rectangle                | Report only               | 0-3.7                          |
| `gap`        | Tiles to the next building, median   | 3-5                                       | Report only               | 6+                             |
| `size 6+`    | Locs of 6 tiles or more              | Almost none                               | Report only               | Mostly 0-2. Kalua 10, Ysmar 26 |

The rules skip what's too small to judge: 2,000 land tiles, 200 road tiles, 100 steep tiles, 60 tiles of cliff foot. The
decoration rules are off with `dressing` under 1 or `grass` at 0. `indoor` and `gap` are over the whole arena, so a good town
in a big arena still reads low. `steepest` can't see tiles within 2 of water or 4 of a bridge, or heightmap maps.

### What to do when a check fails

**Look:**

- `decoration is N per 100 land tiles`, or `road tiles`: `dressGround` wasn't called, or something ran after it. A hand-made map
  with floors in no kit needs a real `biomeDecor`, and one with a low road figure may be returning the wrong `roadTiles`.
- `N blocked tiles are on a textured floor`: overlay 20 or 32 on rock. Use a plain overlay and `paintRockFloor`.
- `the steepest tile is N a tile`: heights weren't limited. Use `finishHeights` or `limitFaces`. On a generated map, lower
  `peakHeight` or raise `terraces`.
- `only N% of M steep tiles have anything on them`: is `dressRock`'s mask set and blocked there? A band a tile wide can't take
  a heap, and over 44 a tile takes no pebbles, so make faces wider or gentler.
- `N% of tiles at a cliff's foot are on rock`: `paintOverlay` was used for rock. Use `paintRockFloor`.
- `decoration at a cliff's foot is N per 100`: something else is on those tiles, or `dressGround` isn't last.
- `you can only see N tiles at the median`: too much solid scenery. Lower `trees`, `treeMix` and `props`, and move that density
  to `flowers` and `grass`.

**Catalogue:**

- `banned loc N at x,y: why`: swap it. Rockslides (11433 to 11435) for sea rocks, 4769 Pile of bricks for fallen roofs, raised
  ground and plain stone for a dais. `from the Theatre of Blood's rooms, a raid` (or `the Nightmare's arena`) is a raid's or a
  boss room's own loc: swap it for something from the open, or on a raid or boss map made of those rooms on purpose, list
  the range in the recipe's `allowLocs`.
- `kit piece N at x,y without its set: why`: a piece of a kit standing alone (`KIT_PIECES`). Cut it with its set from the real
  place (a stamped prefab's locs count as whole), place the rest of its set within `reach` tiles, or use a freestanding loc.
- `loc 13312 at x,y draws nothing as ground decoration`: that blood only has a wall's model. Use 652, Bloodsplatter.
- `foam at x,y isn't at a fall`: foam (26499) is for within 14 tiles of a fall. Take it away, or list the fall in `detail`.

**Height, roads and buildings:**

- `N open tiles are hidden from the camera`: a drop to the north is steeper than the camera. `limitNorthFaces` keeps them to 30.
- `road too steep at`, `road steps at`: pins are fighting over a road. `gradeRoads` goes after everything's pinned.
- `too steep to walk but open at`: heights changed after blocking. `blockSteepGround` goes after the last height.
- `the generator's collision and the game's differ`: a real bug. Find the tile, and compare `getCollisionFlags` with `ArenaGrid`.
- `road runs through a building`, `road painted on a building`: keep off `ground.footprint`, and `markOffLimits` before routing.
- `X's road doesn't end at its door`, `turns its door from the road`: lay the road from `exit`, and turn the prefab.
- `X isn't on flat ground`, `opens onto ground you can't walk on`, `has something under it`: use `pinPlot`, and `markOffLimits`.
- `gap at x,y off the deck isn't whole road`, `road outside the fences`: run the road down the deck's line for 7 tiles.
- `the field at x,y isn't level`: `pinPlot` it, before `finishHeights`. If it's meant to slope, say so: `fields` with `slopes: true`.
- `N water tiles aren't level at x,y`: something's moved water's corners. Nothing can pin them after `holdWater`, so look at what
  ran before it, at a piece of water that's two levels, and at a fall whose tiles aren't in `waterDrops`.
- `the water drops at x,y with no fall there`: a tile in `waterDrops` needs a fall within `FOAM_REACH`, in `falls` or `waterfalls`.
- `road can't be walked: N of M tiles at x,y`: what's on it, or what's blocked it. Blocked for steepness: a pin's too narrow, or the
  road's grade is. Blocked by hand, as `massif` was on Vardhelm: leave `roads.isRoad` tiles out. Shut on purpose: `closedRoads`.
- `the road shut at x,y shows no rubble`: it needs something solid on the road inside the rectangle, or for `broken end`, a road
  that stops there.
- `the waterfall at x,y has no pool`: its south row has to be water. `placeFallPools` goes before the heights settle.
- `the waterfall at x,y isn't level across its row N`, `stands on a slope`, `stops N from its lip`: it isn't on a seat. Use
  `getFallSeat` and `seatFall`, or by hand the rows `getSeatHeight` gives.
- `the wall at x,y has N gates you can walk through`: under 2. `planGates` won't plan that, so something's come through since
  and blocked one. Find what's standing there.
- `a road meets the wall at x,y with no gate`: something's laid a road without asking. Roads only cross a wall through
  `connectTown`.

**The flow.** These go by the rule, with how many and the first few places. A generated map should have none, so each is a step
that didn't ask `ground.claims`:

- `N wall clashes: loc L on a wall at x,y`, or `a building on a wall`: something's on a band. See who placed it, and have it ask.
- `N gate clashes`: the same, in a gate's clear space.
- `N road clashes: a road runs into X`: a road's field reaches a building, and painting only hid that by stopping at the wall. A
  tile-centre test can't see this. `a road on X's yard` or `plot` goes by what's painted, half side by half side.
- `N fence clashes: a fence across a road`: painted up to that side from both tiles it parts. `a fence on X's plot` is another
  building's.
- `N plot clashes`: two plots overlap.

**Reachability:**

- Anything but `0 stranded`: the generator can't do this. By hand, find it with `findStranded`, then give it a way in, or block
  it and count what you block.
- `refused: These settings leave too little ground to play on.`: fine in a sweep. On your own map, less water or fewer cliffs.
- `X leaks: its start reaches N open tiles outside it`: a doorway or corridor out of a room is open. Seal with
  `outside: "block"`, or make the rectangle take in what's meant to be walked. See [A map of rooms](#a-map-of-rooms).
- `N open tiles are outside every region`: something open nobody's brought to. Same fix.
- `X at x,y is solid`, `can't be reached from Y`: a point's in a wall, or in the wrong room.

**`0 stranded` proves nothing if the recipe blocks what's cut off.** A whole island sealed off still passes, as nothing
open is left stranded: one map lost 4,964 tiles that way. Have the recipe count what it blocks and throw over a limit:
`sealFrom`'s `maxSealed` does that. On a map with `regions`, `check-maps.ts` prints a `regions:` line with each region's
open tiles, so a room that shrank shows there. `placeBridges` also skips a bridge that doesn't fit without saying so, so count what comes back. `check-maps.ts` skips a
hand-made map with no `detail`, and only checks a road's grade or a landmark's ground if `detail` passes them on, so
`steepest road 0.0` or `0 landmarks` means unchecked.

**Warnings** print under the map's line and don't fail it:

- `N open tiles draw no floor`: a hole in the floor (`hiddenFloor.ts`). The tile's under the cache's hidden overlay (magenta,
  `0xFF00FF`, which draws nothing) or has no floor at all. In the world that ground is under something else, so a cut brought
  in a hole. Tiles drawn from level 1, under a bridge, or covered by floor decoration aren't counted. `overview.ts` hatches the
  hidden overlay black and grey.
- `N open tiles are floor decoration over a hidden floor`: the tiles are drawn, but the hairline seams between two of them
  show what's under them, which is the renderer's black, and they glitter as the camera moves. The Owl's Court's walkways
  did. Put a plain overlay of the decoration's own colour under them (theirs is 141); the decoration draws over it. The
  Theatre's Bloat and Verzik rooms have 704 such tiles, as cut.
- `X and Y have faces in one plane, which z-fight` (`coplanar.ts`), ours first, then `as cut from the real place` for what a
  stamp brought as the real world has it. It doesn't fail a map, since some dev maps had a few before it was checked
  (Vardhelm's city towers on their walls, Ysmar's big props, overlapping falls and floes), but a new map should have none:
  `CHECK=1 check-coplanar.ts <map>` fails on any of ours. See [Traps](#traps).
- `N warnings from the catalogue:`, on a shipped map: the ban list minus its `allowLocs`, kit pieces, blood and foam. A
  shipped map went out looked at in the game, so each is a question, not a bug.
- `N tiles have two solid locs on them`, on a shipped map (`findSolidOverlaps` in `placer.ts`): usually a placement helper
  that went by the wrong mask. The Sanctuary's 61 stay until someone decides to re-roll its chamber.

### What's not on the look line

`measure.ts` writes all of it to a JSON file, a map at a time. These are the ones to read, with the real ranges:

```sh
node -e 'const m=require("./out.json").scaperune_oasis;console.log(m.faces.lengthQ,m.enclosures.freeWallsPer100,m.towns.wallKindsFor90Pct,m.objects.props.againstWallPct,m.aprons.ringOverlayPct,m.height.steepest)'
```

| Key                            | What                                         | Real                |
| ------------------------------ | -------------------------------------------- | ------------------- |
| `faces.lengthQ`                | Tiles in a face: p50, p90, longest           | 2-3, 2-7            |
| `faces.dropQ`                  | Height a face drops: p50, p90, p99, most     | 27-53, 39-136       |
| `enclosures.freeWallsPer100`   | Free-standing fence walls per 100 tiles      | 5-8.5 in farm towns |
| `towns.wallKindsFor90Pct`      | Wall ids for 90% of walls                    | 5-12 in a new town  |
| `towns.streetQ`                | Tiles between buildings: p25, p50, p75, p95  | 3-5, 7-8, 14-15     |
| `objects.props.againstWallPct` | Props touching a wall                        | 30-58 in towns      |
| `objects.props.clusterP90`     | Props in a group, p90                        | 6-21                |
| `aprons.ringOverlayPct`        | Two tiles round buildings on path or paving  | 12-69               |
| `underlays.areaP50`            | Tiles in a piece of one underlay, median     | 2-4                 |
| `shore.onShorePer100Edge`      | Locs per 100 tiles of shore                  | 26-155              |
| `height.steepest`              | The real steepest tile, with nothing skipped | 80                  |

`trap-scan.ts` lists what a map's made of, by what's odd about it. Read it like this:

- **Act on**: `sinks over a tile below its origin` on land, `500+ triangles on 2 tiles or less` if there are many of them,
  `big and not contoured` on a slope, `placed as a type it never is`, `never placed in any map file`.
- **Usually fine**: `draws nothing but blocks` from prefabs, where they belong; `animated`; wrecks that sink, because they
  stand in water; `no surface use at all` for good outdoor locs from above y 64, which hold real places like Prifddinas.

`audit-locs.ts world.json scaperune_oasis` says how the world uses each loc in a map.

### Look at it

Tests don't cover how things look, and this is where most maps fall down. From above is for layout only: the white square in
a preview is the arena and the red dot is the spawn, and the minimap renderer doesn't draw trees or rocks.

```sh
bun run start        # the dev server, then in another shell, the screenshot helper (see below):
PROFILE=<profile dir> PORT=5173 MAP=scaperune_town node rs-height.mjs out square:6152:11674:18 side:6152:11674:18:-250
```

`rs-height.mjs` is a Playwright helper on the team's VM, not in the repository: it opens the game headless (with the
flags under Testing in the browser in the root `CLAUDE.md`) and screenshots each stop. Without it, take the screenshots
by hand from the dev server. Each stop is `name:x:y[:distance[:pitch]]` and writes `out-name.png`, and `@id` moves to
another map. `x` and `y` are world
tiles: `mapX * 64` plus the grid tile. Use a distance of 18, which is the play camera, or it shoots from further out. Look at
it side-on too, with a pitch nearer 0: from above, hills barely show. On your own, `game.selectMap(id); await game.startRun()`
in the console, and `game.cameraRig.pitch`. It takes about 2 GB, so one at a time. Don't edit `src` while a browser job runs:
Vite reloads the page and kills the job.

### Trying a new loc

```sh
# contour, triangles, how far it really reaches
bun run tsx scripts/scaperune/research/model-bounds.ts 3709 60440
# how the world uses it: the ground, and what's round it
bun run tsx scripts/scaperune/research/where.ts 44,56 3709
# draw it, about as the play camera sees it
bun run tsx scripts/scaperune/loc-sheet.ts out.png 1276 1241:22
# every loc at the same scale, on its footprint
TRUE_SCALE=1 bun run tsx scripts/scaperune/loc-sheet.ts out.png 1276 37646
# suggests kit pieces from the whole cache
bun run tsx scripts/scaperune/research/kit-scan.ts kits.json
```

Read `model-bounds.ts` like this: `contour` 0 or more follows the ground, and -1 stands level, so it wants flat ground.
`height tiles` under 0 sinks that far below its origin. `x` and `z` past half its size reach past its tiles. `tris` over about
60 is too heavy for anything there are thousands of. A loc with `types 4` only has a model as wall decoration.

The plain sheet shrinks a loc that's too big for its cell, so a tall model and a small one come out the same size. Compare
sizes with `TRUE_SCALE=1`: every loc at the same pixels a tile (`TILE_PIXELS`, 26 if not set) over its footprint. A model
that floats over its footprint, or is far bigger than its tiles, shows there. **Then look at it in the game, close up,
before building with it**: three rounds of Phosani's arena went on pieces that looked right on a sheet.

`where.ts` needs a square. This finds them from the index. Squares under y 64 are the surface:

```sh
node -e 'for(const s of require("./world.json").squares){const n=Object.keys(s.locs).filter(k=>k.startsWith("34780:")).length;if(n)console.log(s.x,s.y)}'
```

No surface use isn't a verdict by itself: Prifddinas and the Darkwood are up there. A list by hand is why `BANNED_LOCS`
(`catalogue.ts`) exists, and it's what `check-maps.ts` fails a dev map on: the Tombs of Amascut's dial and pillars (45872 to
45915), a sunken city's fallen roof (48328 to 48333), instance debris (48972, 48973), sea rocks on land (60436 to 60444, fine
in water), the two quads that line holes (14416, 14427), and every id the cache places only in the Theatre of Blood's rooms
(`THEATRE_LOCS`) or the Nightmare's arena (`NIGHTMARE_LOCS`). Something else that's wrong: add it.

**Kit pieces** (`KIT_PIECES`, beside it) only work with others: the Theatre's wall pillars (no back), the Nylocas egg sac and
the war table (come apart alone), the dream's stacked spikes, posts, trunks and Torii gates, the Sanctuary's cracked flags, and
the Hallowed Sepulchre's edges, tall walls, wall-line pieces, gold and blue runner, banner columns and fire traps.
Each has its reason and, where it's known, its `set`: ranges of ids that must have a loc within `reach` tiles of it, on any
level. `check-maps.ts` fails a dev map with one placed without its set. Locs from a stamped prefab (`isStamped`) count as
whole, since a set cut from the real place is the set as built. A piece with no known set is only fine that way.

`research/kit-scan.ts` suggests more from every square in the cache: locs that face one way (see-through from behind), that
always have the same companions, or that are stacked over another level. It's thousands of candidates, most of them real kits
nobody would place alone (sails, redwoods), so it's a list to go through, not a check. It misses pieces that only _read_
wrong (posts, trunks, the egg sac): only the game shows those.

`LocInfo` doesn't carry contouring or a model's reach, so nothing in the generator can check them. Only these scripts know.

## Floors that fight back

A map can have a floor the game draws and moves itself, tile by tile (`MapDef.floor`, a `FloorDef` in
`content/types.ts`): slabs rise under the player in waves and tiles fall away into a pit, as in the Wardens' third
phase. `core/ArenaFloor.ts` runs it, `core/floorLayout.ts` lays it out and `client/FloorView.ts` draws it. The
dev maps in `maps/wardensFloor.ts` show what it can do: the Wardens' floor itself and eight demos
(`content/floorDemos.ts`).

**The room.** The floor's box is a bridge (`TILE_BRIDGE` on level 1) of the hidden overlay over a dug-out pit, so
nothing of the map is drawn there and a fallen tile opens onto the dark. `maps/wardensFloor.ts` does this for the
Wardens' room (`digPit`); `floorRoom` puts any `FloorDef` in that room on squares of its own. A floor laid a
whisker over a map's own ground instead, with no pit (the Battle for Varrock's palace), sets `onGround`: no light
under it, no cut edges, and its tiles drawn as their tops unless they're coming up, which is what keeps a moving
floor of paving in a phone's budget. Nothing on it should fall.

**A minimal floor** is the Wardens' numbers with a script of your own. Everything else has a default: the whole
box is floor, of the Wardens' slab, all normal tiles:

```ts
floor: {
    ...createWardensFloor(rect),
    script: [beat(3, side("east", 0.15)), beat(9, sweep(0.12, 3)), beat(15, holes(3))],
    loopSeconds: 20,
},
```

Floor tiles are counted from the box's south-west corner, x east and y north. North is the front: waves travel
away from it, and rows fall from the south.

**Its shape** (`shape`, `FloorShapeDef`): `rect`, `ellipse` (a circle when `rx` and `ry` match), `ring` (round,
or `square`), `diamond`, `cross`, and `union` and `minus` of them. A middle (`cx`, `cy`) can be in half tiles,
and is the box's middle when it isn't given. What isn't floor is the pit from the start: blocked, and never there.
It's a clean pit: the structure under the floor only ever shows through holes in the floor, and a shaped floor has
no deep glow.

```ts
shape: { kind: "minus", from: { kind: "ellipse", rx: 11, ry: 11 }, cut: { kind: "ellipse", rx: 3, ry: 3 } },
```

**By hand** (`ascii`): a row a string, the north row first. `.` and space are no floor, and every other
character is floor. Characters also name tiles for the rules below (`{ kind: "chars", chars: "f" }`). With a
`shape` too, the floor is where both say.

```ts
ascii: [
    "..#####..",
    ".##*#*##.",
    "###fff###",
],
```

**Skins** (`skins`, `FloorSkinDef`): what tiles look like. Each skin is one of these:

- a spot animation's model (`spotAnim`), which rises with its own animation (`rise: "anim"`);
- a loc's model (`loc`);
- a model id (`model`).

Every skin can also have:

- `recolor` and `retexture`, as `[from, to]` pairs after the cache's own swaps;
- `scale`, `height`, `tint`;
- `light`, a steady glow in its seams at rest (for glyphs).

Anything without its own rise animation rises in code (`rise: "code"`): lifted, its leading edge tipped up the
way the wave goes, then settled back. A tile falls the same way in code (`fall: "code"`). Only the Wardens' 1 by
1 slab tumbles (`fall: "tumble"`, `drop.spotAnim`).

A skin should be one tile across and centred, like a floor decoration (the cues' edge light assumes it). A model made
bigger says so with `size` (tiles across): a 2 by 2 pillar is `size: 2` on a 2 by 2 slab.

A skin the floor's light doesn't suit can have its own cue light (`cue: { color, strength, width, tremor }`). Give
bright tiles a stronger, hotter one, and a recoloured slab a quieter one.

**Ready-made skins** (`FLOOR_SKINS`, `content/floorSkins.ts`), all opaque and checked in the game:

| Group                             | Skins                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- |
| The Wardens' slab, and recoloured | `wardensSlab`, `sepulchreSlab`, `greySlab`, `sandstoneSlab`, `claySlab`   |
| Paving                            | `flagstones`, `brickPaving` (grooved paving, recoloured), `octagonPaving` |
| Stone tiles                       | `marble`, `creamStone`, `darkTile`, `starTile`, `stoneTile`, `roundTile`  |
| The Tombs' gold glyph plates      | `pressurePlate`, `glyphPlate`                                             |
| A decal                           | `rune`                                                                    |
| Pillars                           | `stonePillar`, `tombsPillar` (2 by 2)                                     |
| Tiles that do something (effects) | `lava`, `ice`, `mud`, `sand`, `healGlyph` (a decal), `speedPlate`         |

Most of the cache's 1 by 1 floor models are see-through overlays or invisible hitboxes:

- the Tombs' "Tile" (45356) is about 70% see-through;
- "Frozen platform" (54539) is invisible.

So check a new one in the game before it goes in the list. A decal needs a skin under it (`under`).

The paving (`flagstones`, `brickPaving`, `octagonPaving`) is about 110 triangles a tile, twice a slab's 52. A
floor of it costs a phone about 10k more triangles than slabs do, so use it for bands and borders.

```ts
skins: [
    { spotAnim: 2220, recolor: [[43904, 37278], [38156, 37300]] },
    { loc: 56393, light: 0x9fdcff },
],
```

**Tile rules** (`tiles`, `FloorTileRuleDef`): every rule that covers a tile applies in order, so a later rule
wins. A rule has:

- `where`: one of the shapes above, or `all`, `checker` (`size`, `odd`), `border` (`width`, from the floor's
  edge or any hole in it), `stripes` (`axis`, `every`, `width`, `offset`), or `chars`;
- `share`: only that fraction of the tiles, picked by the floor's `seed`, so the same seed always gives the same
  floor;
- what it sets: `skin` (an index, or weighted `[{ skin, weight }]`), `type`, `turn` (0 to 3, or `"random"`) and
  `slab`.

```ts
tiles: [
    { skin: 0, turn: "random" },
    { where: { kind: "checker" }, skin: [{ skin: 1, weight: 3 }, { skin: 2, weight: 1 }] },
    { where: { kind: "border" }, skin: 3, type: "reinforced" },
],
```

**Tile types** (`FloorTileType`):

| Type         | Rises | Falls | Note                                                                                                                       |
| ------------ | ----- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `normal`     | yes   | yes   |                                                                                                                            |
| `reinforced` | yes   | no    |                                                                                                                            |
| `fragile`    | yes   | yes   | Its fall is warned for half as long (`drop.fragile.warn`), and it falls by itself after rising twice (`drop.fragile.hits`) |
| `solid`      | no    | no    |                                                                                                                            |
| `safe`       | no    | no    | The same as `solid`, for the spots a floor promises are safe (give them a glyph skin)                                      |
| `pillar`     | no    | no    | Nobody walks through it: it blocks the grid as an object does. Give it a pillar skin                                       |

**Pillars** are the pillar type with a pillar skin. A pillar is narrower than its tiles, so give its skin the
floor's skin to stand on (`under`). A 2 by 2 one is a slab:

```ts
{ where: { kind: "rect", x0: 10, y0: 11, x1: 11, y1: 12 }, skin: 4, type: "pillar", slab: [2, 2] },
```

- **Movement:** it blocks it, and the floor counts it as no way through, so holes never cut the floor round it.
- **Shots and sight:** it stops shots, and blocks targeting (see Pillars stop shots, below).
- **Camera:** whoever's behind it shows as a silhouette, as behind a wall.

**Slabs** (`slab: [x, y]` on a rule): tiles that rise and fall as one piece.

- They're laid from the south-west wherever a whole one fits in what the rule covers and isn't in a slab already.
- A slab rises when its first tile would, hurts on every tile while it's up, and falls whole.
- It's one model stretched over its tiles, so it costs a phone what one tile does.
- A slab that isn't square only turns end over end.

```ts
tiles: [{ where: { kind: "ellipse", rx: 6, ry: 6 }, slab: [2, 2] }],
```

**The patterns on any shape.**

- `side`, `sweep` and `ripple` go by the floor's own extent and middle.
- `lanes` raises lanes `width` tiles wide, every `spacing` tiles, one through the player (or the middle), down the
  floor, across it or both. Between two is safe, and where they cross, the lane down wins.
- `plus` raises the tile under the player (or the middle) and `arm` tiles out each way along its row and
  column, a step at a time; the floor's edge cuts an arm short.
- A sweep's gap is always on floor: the nearest place it fits in that row. A row with no room for it stays down.
- `dropRows` falls from the floor's own back row, and `keepRows` counts from there.
- `holes` are only ever inside the edge.
- Solid, safe and reinforced tiles are left out of whatever they don't do.
- **Islands:** holes, falling rows and fragile tiles never cut the floor in two, so nobody's stranded. Set
  `drop.islands` to allow it.

**Cues** (`cue` on a pattern or the floor): `subtle` (the default) or `bold`. Both show every tile a pattern will
hit from the moment it starts.

**Tiles that do something** (`effect` on a tiles rule, or a skin's own `effect`; `"none"` takes a skin's away):

| Effect  | On a player                                        | On an enemy          | Ready-made skin       |
| ------- | -------------------------------------------------- | -------------------- | --------------------- |
| `burn`  | 4% of their hitpoints every 0.5 s, with no grace   | 3 damage every 0.5 s | `lava`                |
| `heal`  | 3% of their hitpoints every 0.5 s                  | nothing              | `healGlyph` (a decal) |
| `haste` | 40% faster                                         | 40% faster           | `speedPlate`          |
| `slow`  | 45% slower                                         | 45% slower           | `mud`, `sand`         |
| `ice`   | they keep their momentum, steering 6% of it a tick | nothing              | `ice`                 |

Tune them with `tileEffects` (`burn: { damage, every, enemyDamage }`, `heal: { amount, every }`, `haste`, `slow`,
`ice: { grip }`). Flying enemies don't burn.

The ready-made `lava`, `ice`, `mud` and `sand` are the cache's flat tile of lava rock (loc 747, 18 triangles) with its
texture swapped (`retexture`): lava's black crust with molten cracks (texture 59, which creeps on its own), ice's glassy
streaks (53), earth (32) and dunes (38). A textured tile beats a recoloured slab: a slab's top is one colour. Lava also
has a skin's `glow` (0 to 1, all over it in its `tint`'s colour) with a slow `pulse` on top, each tile on its own beat,
a seam `light`, and an `idle` effect, embers (2246) drifting up off one tile in four every 2.4 s:

```ts
lava: { loc: 747, retexture: [[15, 59]], height: -0.13, tint: 0xd8885a, glow: 0.02, pulse: 0.14, light: 0xff7a1a,
        idle: { spotAnim: 2246, every: 2.4, share: 4 }, effect: "burn" },
```

```ts
skins: [FLOOR_SKINS.greySlab, FLOOR_SKINS.lava, FLOOR_SKINS.ice, { ...FLOOR_SKINS.healGlyph, under: 0 }],
tiles: [
    { where: { kind: "rect", x0: 16, y0: 2, x1: 22, y1: 22 }, skin: 1 },
    { where: { kind: "rect", x0: 0, y0: 0, x1: 5, y1: 24 }, skin: 2 },
    { where: { kind: "rect", x0: 11, y0: 22, x1: 11, y1: 22 }, skin: 3, type: "safe" },
],
```

Ice and plates change the movement rule the sim and a co-op guest's prediction share (`core/PlayerMovement.ts`), but
the guest's prediction doesn't know about them, so it corrects itself there.

**A floor that rebuilds itself** (`rebuild: { after, warn, rise }`): a fallen tile comes back `after` seconds after it
falls. For its last `warn` seconds (1) it comes up out of the dark, lit from under and turning back over the way it
fell, then rises into place over `rise` seconds (0.8). It waits for floor beside it, so it never comes back cut off,
and the flow field is worked out again. A rule's `rebuild` is seconds for its tiles, or 0 for never.

```ts
rebuild: { after: 6 },
tiles: [{ where: { kind: "border" }, rebuild: 0 }],
```

**Pressure plates** (`triggers`, and `trigger` on a tiles rule): a player stepping onto the tile sets it off, then it
rests for `cooldown` seconds (5). `once` sets it off only once. `armed: false` starts it disarmed. It's lit while it's
ready and sinks while it's stood on. What it does is a list of actions. Groups are named tiles (`group` on a
rule), and `patterns` names patterns.

```ts
tiles: [
    { where: { kind: "rect", x0: 11, y0: 5, x1: 11, y1: 5 }, skin: 2, type: "solid", trigger: "trap" },
    { where: { kind: "rect", x0: 8, y0: 7, x1: 14, y1: 9 }, group: "jaws" },
],
triggers: { trap: { actions: [{ kind: "slam", group: "jaws" }], cooldown: 4, message: "Click!" } },
```

**Actions** (`FloorActionDef`), each with an optional `delay` in seconds:

| Action      | What it does                                                        |
| ----------- | ------------------------------------------------------------------- |
| `pattern`   | starts a pattern, or one of `patterns` by name                      |
| `drop`      | a group falls, warned as a fall is (never cutting the floor in two) |
| `raise`     | a group's fallen tiles come back                                    |
| `slam`      | a group rises, a warning from now: a trap                           |
| `dropUnder` | the tile under whoever it's aimed at falls                          |
| `arm`       | arms a trigger, or disarms it (`armed: false`)                      |
| `phase`     | goes to one of the floor's `phases`                                 |

A beat in the script can be an action instead of a pattern: `{ at: 30, action: { kind: "phase", phase: "molten" } }`.

**Phases** (`phases`): another script with its own loop, from the moment it starts, and skins swapped on every tile
(`skins: [[from, to]]`, by index), their effects going with them. To swap only part of the floor, give that part a
copy of its skin.

**Bosses act on the floor** through `Sim.floorAct(action, at?)` (aimed at the floor's target when `at` is left out),
or `floor` on a `BossAttackDef`, done as the attack starts, aimed at the player it's after:

```ts
{ name: "Crack", kind: "blast", ..., floor: { kind: "dropUnder", delay: 0.5 } },
```

**Pillars stop shots.** A `pillar` tile stops the player's shots and enemies' where they meet it (orbiting ones go
round), weapons don't pick a target behind one, and an enemy with a shot doesn't fire through one. Only a floor's
pillars do this, and only on its map: a floor with none costs nothing. (Boss bullet patterns have their own
`pillars`, the map's `features.pillars`, worked out as they're fired.)

**What's behind a pillar** shows as a silhouette, as behind the world's walls: pillars and raised tiles are drawn
before the silhouettes (`ActorDrawOptions.early`).

**Materials** (a skin's `material`, `FLOOR_MATERIALS` in `content/floorSkins.ts`): a spot animation and a sound as it
rises, as it falls and as a fragile one cracks (rises nearer giving way). They take the place of the floor's own
dust and sounds on that skin, on the same share of the tiles. `stone`, `brick`, `ice` and `lava`; which sound suits
which is a guess (none of them is a floor's in OSRS but the Wardens').

```ts
skins: [{ ...FLOOR_SKINS.brickPaving, material: FLOOR_MATERIALS.brick }],
```

**Damage you can see.** A fragile tile that's risen is darker, sunk a little and askew, more each time, until it gives
way. A skin's `stages` are skins to draw instead after one rise, two and so on.

**Height** (`height` on a rule, in tiles; below 0 is sunken) and **ramps** (`ramp: "north"` and so on, the way up):
a ramp goes from the tile behind it to the one ahead, and its sides are ledges. Wherever heights differ there's a ledge,
a wall on the grid (`ArenaGrid.addLedge`), so nobody walks up or down it but by a ramp. What's faked: it's all one
plane. Players and enemies are drawn at the height they're on (`ArenaFloor.liftAt`), but shots, hits and reach
don't know about height, and a flying enemy crosses ledges. A raised tile's sides are the tile again under itself.

```ts
tiles: [
    { where: { kind: "rect", x0: 7, y0: 13, x1: 15, y1: 20 }, height: 0.5 },
    { where: { kind: "rect", x0: 11, y0: 12, x1: 11, y1: 12 }, ramp: "north" },
],
```

**Tiles at rest are cheap.** A 1 by 1 tile at rest with floor at rest on all four sides at its height is drawn as its
top alone (a bake of the skin with only its upward faces near the top, `ModelBakeRequest.topOnly`), as nothing round
it can show its sides. They're still instanced, one draw a skin. Glyphs, plates, decals, ramps and cracked tiles are
always drawn whole.

**The floor preview** (dev server only): `http://localhost:5173/?floorpreview`. Pick a floor, or paste one as JSON
(the Wardens' numbers fill what's left out, and skins can be `FLOOR_SKINS` names) or an ascii map. It draws the tiles
from above and plays the script with the player at the start on a timeline you can scrub, and lists what
`core/floorLint.ts` finds: pieces cut off, tiles behind ledges, see-through skins, level ramps, triggers on no tile,
and a rough phone triangle count against 69k.

**Checks.** `core/floorLayout.test.ts` lays out and plays each demo for a loop and a half, and
`core/floorFeatures.test.ts` lints each one. Their checks:

- the start is on the floor;
- the floor is never cut in two;
- the ascii rows are the box's width;
- everything can be reached from the start, and the rough phone count is in budget.

A new floor's map should get the same.

## What the engine can't do yet

Don't spend a round on these.

**Things it has no way to make**

- **No dock town.** `TownKind` is `market`, `axis` or `hamlet`, and there's no way to make a Piscarilius.
- **No jetty, no boardwalk.** Nothing in the generator lays walkable planks over water, so there's no recipe for one. Only
  bridges cross water. Kalua's stilts are by hand, on a deck with corners of its own (`DECK`, `createDeckMask`): that's the
  code to copy.
- **No choosing a town's kind**, or seeing which it got except by looking.
- **No built edges**: raised ground with walls along the top. By hand, pin the ground and place contoured walls.
- **No road hierarchy past the town core**: roads are one material outside it, with no narrow tracks, and a road that changes
  colour shows a seam.
- **No mottled ground.** Pieces of one underlay are 14 to 22 tiles at the median, against 2 to 4 in the real world, and edges
  between biomes have no dither.
- **No invisible walls.** The real world seals drops with 85 and 2639, which draw nothing. Nothing here uses them on purpose.
- **Streets are straight and square to the map.** Main streets don't turn: each runs from a gate straight to its square.
- **Town walls have eight sides at most, and only `towns` get one.** A wall's a rectangle with each corner cut by its own amount, so
  it's a lopsided octagon. There are no inward corners, and `kourend` and `yanille` stay rectangles, as their corners are towers
  and square.
- **Only rotation.** The map format has no mirror.
- **One plane is drawn**, so nothing upstairs is seen unless its tiles are flagged `TILE_SHOWN`, as a city wall's top is.
  That draws what's up there. It doesn't let anyone walk on it: all the collision is the ground's.

**Targets only partly met**

- **Flat land**: 24% to 70% on dev maps, and about 36% on default hills, against a hoped-for 40% and the world's 75%.
  It runs after roads are graded, which limits it. `flatness` past 0.75 adds little: lower `hills`.
- **Pacing**: the top end is short. Most maps reach 47 to 68 objects a screen at p90 against 130, and only `scaperune_town`
  passes it. Hamlets don't make a screen of 130, so that end of the range needs a town.
- **Kinds a screen**: 7 to 17, against 12 to 48. Scatter draws from short lists.
- **Faces** are 3 to 7 tiles at p50 and up to 9 at p90, against 2 to 3 and 7. Getting them shorter means changing
  `shapeCliffs`, the heart of how height's stored.
- **Indoors and gaps**: buildings are about the right size and well spaced in a town, but a town is a small part of an arena.
  In a town's own rectangle the Town preset comes to 10% to 14% indoors, with a gap of 5 to 8.

**Known faults**

- **Plain rock is weak on pale ground.** On `snow`, `desert` and `tropical` a plain face doesn't read as one surface: its heaps and
  pebbles show as loose shards against it, even white ones on snow. Snow's kits were cut back for that, and there's no fix yet.
  Keep faces short there, and look at it.
- **Seaweed is heavy.** 30537, 30538 and 30542 are 736 triangles a tile, and they block (clip 1). Kalua's are 1 tile in 16, and
  a tile-by-tile shore is out.
- **Some small things are heavy too.** 5123, a barrel in meadow's `VIGNETTES`, is 726 triangles. `desert`'s cacti (44069 to 44071)
  are over 500 each, and a map can have hundreds. `trap-scan.ts` lists these.
- **Dressing costs triangles.** Kits are capped at 60 a loc and it's still 5 to 8 thousand more a frame, which is 19% to 37% on
  a low count. Heavier kits aren't an option.
- **A family of one makes a town of copies.** Look for a 1 in the [Biomes](#biomes) table. Try another seed, or add prefabs to
  the family.
- **Big maps take a while to build.** 8 s at 16 squares and 28 s at 28: see [How big a map can be](#how-big-a-map-can-be).

**Tried and dropped**

- Flat land before roads were graded: roads failed their grade on about 1 map in 30, because plots landed on different levels.
- Dressing at 90 triangles a loc: world triangles rose 37% to 44%.
- Seaweed as a tile-by-tile shore: see above.
- Deeper water away from shores, with overlays 448 to 454. A tile holds one overlay, so each band's edge is a staircase.
- A rope bridge over a gorge. The cache's (21509, on Neitiznot) is a thin wall loc with no deck, and from above it's a line.
- `53543` ice shards as a snow face. No overlay's as white as the snow underlay either, so snowy cliffs are bare underlay.

## Reference

### How it works

A recipe builds a `TileGrid`: plain arrays of floors and heights, and a list of locs. `format.ts` writes it out in the
cache's own terrain and loc formats, map square by map square, and `squares.ts` hands those to the viewer as plain data
(`MapViewer.addCustomMapSquares`). `src/rs/map/CustomMapFileLoader.ts` then serves them to anything that reads a map. So the
renderer, collision, flow field, minimap and bot get them with no idea they aren't real.

The recipe runs once, on the main thread, the first time the map's played. `GameClient.loadGrid` calls `installRecipe`, and
scripts call `installRecipeInSceneBuilder`. Reload the page to see a change.

| File              | What                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `recipe.ts`       | `MapRecipe`, `BuildContext`                                            |
| `Ground.ts`       | a map being built: paint overlays, stamp prefabs, place locs           |
| `format.ts`       | the tile grid, and reading and writing both file formats               |
| `prefab.ts`       | cut a rectangle out of the real world, turn it                         |
| `prefabs.ts`      | the named rectangles: buildings from all over the world                |
| `building.ts`     | what's inside a prefab's walls, and its ways out                       |
| `biomes.ts`       | what each kind of ground is made of, and its rock                      |
| `catalogue.ts`    | locs that read wrong outside what they were built for                  |
| `dress.ts`        | rock's colour and what's on it, and the small things on all the ground |
| `floorKits.ts`    | what real ground has on it, by floor                                   |
| `settings.ts`     | every setting, its limits, the presets, Randomize                      |
| `generator.ts`    | the random generator: the order things happen, scatter, reachability   |
| `mapBuild.ts`     | what's kept while a map's built, and what its parts share              |
| `rivers.ts`       | rivers, lakes and the sea: where they go, how high they stand          |
| `mountains.ts`    | passes, what can be walked, rock, snow, caves, lava                    |
| `roads.ts`        | roads and bridges                                                      |
| `settlements.ts`  | where buildings go, their plots, and sites                             |
| `townPlan.ts`     | towns laid out in steps, and pace                                      |
| `townWalls.ts`    | a town's wall: where it goes, its gates and what's kept clear of them  |
| `reservations.ts` | what's spoken for, tile by tile: the map every step asks               |
| `clashes.ts`      | what breaks the flow, by what's really painted                         |
| `vignettes.ts`    | small groups of things against a building's walls                      |
| `structures.ts`   | set pieces, wrecks and drowned towns, waymarkers                       |
| `cityWalls.ts`    | real city walls as data, and building one round a rectangle            |
| `falls.ts`        | waterfalls off cliffs, their pools and the seats they stand on         |
| `terrain.ts`      | the height layer: floats per corner, pins, slope limits                |
| `landforms.ts`    | the shape of the land, and flat land                                   |
| `roadGrades.ts`   | how high every road runs, worked out together                          |
| `collision.ts`    | collision from a grid, reachability                                    |
| `paths.ts`        | cheapest path, for roads and fords                                     |
| `noise.ts`        | seeded random numbers, noise, distance                                 |
| `shapes.ts`       | which overlay shape a tile takes from what covers it                   |
| `palette.ts`      | everything the generator can use, on one map                           |
| `squares.ts`      | turns a recipe into squares, and installs them                         |
| `generatedMap.ts` | the map generator screen's one map                                     |
| `maps/`           | the maps. `devMaps.ts` lists them                                      |

### The generator's order

`generateMapDetail`, in order: the land's shape (`landforms.ts`), rivers down its valleys, sea and lakes, cliffs, passes,
floors, bridges, towns' sites, walls, gates, squares and main streets (`planTowns`), main roads and bridges' roads, the roads out
of towns (`connectTown`), buildings on their plots with their lanes, vignettes, set pieces, ruins, pools for waterfalls, lava's
level, roads graded and their tiles pinned, flat land, then the heights are finished (`finishHeights`), what's too steep is
blocked, roads are painted, then rock, caves, lava, the falls, what's on the rock, the boundary, town walls go up, waymarkers, what
stands in water, scatter, reachability, the ground's dressing, and last anything solid comes off the roads (`clearLocs`). Anything
it can't connect gets blocked.

**Boundaries.** Only `sea` makes an island. With the others, land runs on past the arena on all sides, scattered out to
the edge of the margin, so the world looks like it carries on. The arena's edge is still what stops you, so each one
puts something there: `forest` a thick belt of trees either side of it, `hills` ground rising away with a line of rock heaps
on it, `fence` a fence `boundaryDepth` tiles in with gaps where roads go through, `mountains` a ring of rock rising from
`boundaryDepth` tiles in.

**The game fades the world to black past the arena's edge**, over 6 tiles (`playAreaFog`). Real maps keep that. It would hide
all of the above, so `GameClient` moves it out by `OPEN_WORLD_MARGIN` on dev maps and on maps with `MapDef.scaperune`. The
minimap still only covers the arena, so it's black past the edge.

**Adding a setting**: `settings.ts` has every setting, what it does and its limits (`SETTINGS`), which section it's in, and
the presets. The screen, the error messages and the tests are all built from `SETTINGS`, so adding one means adding it
there, with a default and a section, and to `CHANGES` in `generator.test.ts`, which fails if changing a setting doesn't
change the map. A setting that only matters with another (`when`) hides until it does. New rolls get a seed of their own (`createRng(settings.seed + N)`), so that
layouts stay put.

**Adding to `SWEEP`** (`check-maps.ts`): append, never insert, because seeds go by index.

### The map generator screen (temporary)

On the dev server the title screen has a **Map generator** button: every setting in sections, presets, Random, Reset,
Randomize, copying and pasting the settings as JSON, Generate with a preview from above, and Play. Randomize rolls what shapes
the map, and leaves the size, heightmap, start, waves, `dressing`, `flatness`, `sites` and `sideStreets` as they are. It's temporary, so it's
built to delete: remove `MapGeneratorScreen.tsx`, its CSS and `generatedMap.ts`, then the `ui-title-dev` corner around
`MapGeneratorButton` in `ui/GameUi.tsx`, that corner's rules in `ui/GameUi.css` and `ui/Mobile.css`, and `setGeneratedMap`
in `content/maps.ts`.

Every Generate replaces one map, `scaperune_generated`, at map squares from x 70, y 134. `installGeneratedMap` replaces
whatever kept the old one. A load still on its way for the old squares is dropped (`MapViewer.customMapVersion`). If you add
anything else that's kept per map, clear it there.

**Runs on any map here, dev maps included, leave the save alone**: `MapDef.dev`, checked in `recordRun`.

### Biomes

Each is an entry in `BIOMES` (`biomes.ts`): its ground, water, trees, scatter, big props, buildings, set pieces, fence, a
fort's wall, waymarker and rock. There's a preset that shows off most of them, and a dev map, `scaperune_<id>`.

| Biome       | From                                        | Prefab families (how many)       | Rock overlay |
| ----------- | ------------------------------------------- | -------------------------------- | ------------ |
| `meadow`    | Lumbridge, and West Varrock's houses        | lumbridge 2, varrock 6           | 83           |
| `desert`    | Kharidian Desert                            | al 2, pollnivneach 3, sophanem 1 | 26           |
| `swamp`     | Lumbridge Swamp, Morytania                  | canifis 1, burgh 2               | 102          |
| `snow`      | Trollweiss, with ice from the north seas    | rellekka 2                       | 3            |
| `jungle`    | Karamja, Varlamore's stumps                 | taibwo 3                         | 83           |
| `tropical`  | the Sailing islands                         | ape 1, taibwo 2                  | 26           |
| `ash`       | Fossil Island, the Wilderness. Water's lava | lovakengj 2, shayzien 1          | 115, facets  |
| `autumn`    | maples, on gold ground                      | hosidius 1, shayzien 2           | 14           |
| `deadlands` | Morytania past the Salve                    | darkmeyer 3, burgh 1             | 99, facets   |
| `elven`     | Tirannwn, Prifddinas's crystal              | prif 4                           | 3            |
| `fairy`     | Zanaris. Nothing's built                    | none, ruins only                 | 83           |
| `darkwood`  | the Darkwood                                | darkmeyer 2                      | 99, facets   |
| `astral`    | nowhere: land over the stars                | prif 3                           | 2            |

To add one: find what a place is made of with the tools below, give it an entry, a preset and a line in `SWEEP`, add it to
`GENERATED` in `maps/devMaps.ts`, give it `VIGNETTES`, which TypeScript asks for, and look at it. The palette
picks up what's in `BIOMES`, `PREFABS`, `BRIDGES`, `SET_PIECES`, `FLOOR_KITS`, `VIGNETTES` and `KIT_FENCES`. Anything from
somewhere else needs adding to `palette.ts`, and `check-palette.ts` fails if it isn't.

**Mixed maps.** `biomeAt` says what's where, and roads, rock and lava go tile by tile. Water doesn't: a step in its colour
would show as a line across it, so each piece of water is the kind of the biome most of it's in. What's scattered uses
`biomeNear`, which frays the line between two biomes by about 8 tiles, so that woods run into each other.

**Chasms.** A biome with `chasm` has a drop for a sea: its edge is a cliff in `CHASM_EDGE` tiles rather than `SHORE_REACH`, and
the "water" is overlay 39, the Cosmic Plane's stars. `hasRelief` is true for these. Fords can't cross it, so anything the sea
cuts off is only looked at, and a river would cut the land in two for good, so `Sky islands` has none.

**Finding what a place is made of**, all without a browser:

```sh
bun run tsx scripts/scaperune/world-index.ts world.json  # every square's locs and floors, once
# places whose ground is mostly red
bun run tsx scripts/scaperune/find-place.ts world.json colour=red surface=0
# by locs, upstairs
bun run tsx scripts/scaperune/find-place.ts world.json name=bloodsplatter locs=10 plane=1
# a cut, upstairs, as the game walks it
bun run tsx scripts/scaperune/find-prefabs.ts rect=3161,4373,19,29 plane=1 collision=1
# draws locs, about as the play camera sees them
bun run tsx scripts/scaperune/loc-sheet.ts out.png 1276 1241:22
# draws a rectangle of the world from above
bun run tsx scripts/scaperune/loc-sheet.ts out.png 3243,3244,6,5
bun run tsx scripts/scaperune/find-buildings.ts 50 50 51 50  # whole buildings in a block of squares
# a real cliff as text: heights, floors, what's on it
bun run tsx scripts/scaperune/research/cross-section.ts 2820 3628 25 12
# a real place from above
bun run tsx scripts/scaperune/research/overview.ts out.png 3200 3200 96 80 2
# a place's walls: ranked by level, as a text map
bun run tsx scripts/scaperune/research/wall-survey.ts 3160 3370 140 150 0 map
# one id's longest run, and what's across it
bun run tsx scripts/scaperune/research/wall-survey.ts x y sizeX sizeY 0 runs 23795
# every loc and floor, tile by tile, on each level
bun run tsx scripts/scaperune/research/wall-survey.ts x y sizeX sizeY 0 dump
# a place's streets, blocks and gaps, as numbers
bun run tsx scripts/scaperune/research/street-survey.ts 3176 3383 56 90
# the same inside a made wall
bun run tsx scripts/scaperune/research/street-survey.ts preset="Walled city" seed=3 sideStreets=1
```

`find-place.ts` searches the index: floor colour by name (`red`, `brown`, `yellow`, `green`, `blue`, `purple`, `grey`,
`white`, `black`) or `colour=RRGGBB within=N`, with `share=` the least share of the floor (default a half); loc ids (`loc=`)
or a name pattern (`name=`, with `locs=` the least); `plane=N`; and `surface=1` or `0` (the surface is south of y 6400).
Squares that touch are one place, printed with the box round it in world tiles. That's how to find somewhere like Vampyrium
(x 2432 to 2815, y 7680 to 7935, by `colour=red surface=0`), which isn't where you'd guess. The index has every level: the
ground floor's at the top of each square, the levels over it in `upper`.

The index is JSON: a few lines of anything will list a region's commonest locs, which is the quick way to choose. A loc's
name is often `null`, so look at them. Sheets are close, not exact: textures are their average colour, and big things are
scaled to fit. `FLOOR_KITS` came from `research/survey.ts`, so its results in `research/results/survey.json` have every
floor's commonest decoration.

Things worth knowing about in the cache, found this way: `58541` to `58543`, palms; `40754`, a bright orange maple; `40788` on, the Darkwood's trees; `60467` to `60479`,
wrecks made for the sea; `43129` to `43131`, mushroom trees up to 9 tiles across; `48327`, a sunken steeple; `59324`, a skeleton
7 tiles long; `27878` and `27879`, crystals 5 across; `60404` and `60405`, ice; `60390` to `60399`, flat blue ice.

Floors that are more than a colour, for small patches only: overlay `20` grey stone, `32` dark rock, `12` cobbles, `39` stars on black, `52`
planks, `174` flagstones, `196` ice, `84` sandstone. Overlay `42` isn't drawn at all, as in caves. `floors` of the Darkwood
(629 on) couldn't be read by the overlay loader in Node, so its road's an older one.

### Set pieces

`SET_PIECES` in `structures.ts`, named in a biome's `landmarks`. The kinds:

- `recipe`: normal things on a plot of their own. **Reach for this first.**
- `rows`, as in a graveyard, with `edge` for what grows round it. `ring`, stones round a circle. `grove`, a loose crowd.
- `single`, one big loc, with the biome's small things round it.
- `maze`, hedges round corridors 3 wide, with a fifth of its walls knocked through and a way in on each side, because a crowd
  has to fit. `fort`, the biome's wall round a yard, with a gate on each side.
- `wreck`, in the water near a shore. `sunken`, a steeple in deep water with pillars round it, only if all of their tiles
  are water.

On land they stand on plots as buildings do (`fitsBuilding`, `pinPlot`), since a big loc on a slope shows its underside.

### Ruins: a real place burnt

`ruins.ts` (`ruinGrid`) burns a cut of the real world (`cutPrefab`) to ruins before it's stamped, so any town can be put
through it; `maps/battleForVarrock.ts` is Varrock's, and its `RULES` are the settings to start from. What it does, tile
by tile and loc by loc:

- **Walls** (types 0 to 3 and 9) are charred, and by a noise over the walls (`wallScale` tiles a feature, so runs
  fall together) some fall (`fallen`) or are broken down (`broken`): the cache's own broken walls in their place
  (`crumbled`, by loc type and turned as the wall was), broken off near the top (`high`) or down to a stub (`low`)
  as the noise nears `fallen`. Varrock's are the Wilderness's ruins' (14622 to 14627, 14632: the ruin west of the Dark
  Warriors' Fortress), dark stone that sits with Varrock's grey burnt. The straight one broken off near its top (14623)
  is whole at one end and steps down to the other, so it comes with its mirror (14625, `mirrors`), and each run of them
  along a wall is turned as Jagex lays that ruin (`pairBroken`): the end ones whole against the wall standing beside
  the run, the rest in pairs, whole end to whole end, and one left over a stub between pairs (the ruin's own `h s H`).
  One with neither is a stub. So no whole end stands in the open or against a low end: all one way, they read as a
  sawtooth. A wall resting on another (`tops`) that comes down with it doesn't count as standing. A broken corner needs
  nothing: a loc can have a model of its own for a corner (`types`), and 14623's (14788) is its straight one mirrored,
  so both its whole ends meet at the corner. `ruins.test.ts` holds them to all that. A fallen straight wall can leave
  its stones on the ground (`fallenStones`, floor decorations turned as it was, blocking nothing). A tenth of the
  fallen straight ones can be a wall of fire instead (`burning`, loc 4765). A building keeps its footprint, which is
  what makes the place read as itself. What rested on or hung from the walls (`tops`: a gateway's deck, a lintel, a shelf) goes where a
  wall beside it fell or broke, as it would float.
- **Nothing floats** (`unfloat`): a shown upper tile (a walkway's deck) stays only over a wall standing whole on the
  level under it, a city wall's solid middle (level 0 blocked) or another shown tile, and anything upstairs only on a
  tile that's still shown; a bridge's deck holds itself up. A deck over a gate's passage goes with that rule, though
  the walls either side stand.
- **City walls** (level 0 under a `TILE_SHOWN` walkway) stand, charred, but for `breaches` (the same noise): the band's
  tiles are down and open there, both faces, walkway and rails gone. Its ends are broken the way Falador's west wall
  is at its Crumbling wall shortcut (`breachEnds`, `BROKEN_CITY_WALL` and `BREACH_BRICKS`: its jagged ends and fallen
  bricks, its pale stone burnt with `charLight` to the dark of a burnt grey wall). A jagged end is a slab a quarter of a
  tile thick, whole at one end and stepping down to the other, and comes in a mirrored pair (24220 and 24221, the same
  model, each with its own bricks, 24219 and 24218), as Falador places them. Along each face that came down, each end
  of the run is jagged, whole against the straight wall still standing beside it, or where none does (a corner came
  down with it) two back to back, whole ends together, so a slab's flat end never stands in the open; its bricks (which
  block nothing) lie in front. A run that wouldn't leave 2 tiles through between them loses its pairs first, then the
  rest, to bricks alone. `ruins.test.ts` holds them to that. `wallTopsKept` is the
  share of the walkway and its rails still up, and a walkway's paving is `walkways` (pale paving up there read as a
  white path). A city wall is the heaviest thing in a town: Varrock's breaches and fallen rails are what took its heaviest
  phone view from 74k to under 60k. Anything with a shown level 1 counts as one, a square's fountain too (its water's
  plane): Varrock's crater clears its own.
- **Roofs, wall decorations, floor decoration and upstairs** go, but for a city wall's walkway and a bridge's deck
  (level 1 with `TILE_BRIDGE`), whose walls stay burnt and whose blocking objects go, so it's still a way across, and
  `steps` (floor decorations the ground climbs under: a palace's front steps), which stay burnt.
- **Objects** by name: trees become burnt trees of their size (`burntTrees`, `treesKept` of them), plants and what went
  with the fire (doors, curtains, banners, torches: `plant`, `gone`; nameless plants by id, `plants`) go, `landmark`
  names stay (a square's fountain, a church's altar), and of the rest `furnitureKept` stay, charred. What was cloth
  is the map's to burn before the rules see it (a tent's walls are walls, and would break into stone): Varrock's
  `takeFabric` and `burnFabric` make Gypsy Aris's tent a blaze (the cache's big fire, 25155), its stalls bare
  burnt counters with a fire, its tents fires and its covered wagon burning timber. A loc that
  changes with a var (a farming patch, a STASH's bush, a seasonal one) goes by the name of what it shows
  (`LocInfo.shows`, as the game draws it with its vars at 0): most are null-named, and kept as furniture they were
  bushes with scorched leaves.
- **The ground**: `underlays` turns grass and earth to mottled ash, and `overlays` paving and wooden floors to soot.

**Charred locs** are the real ones with their colours burnt (`rs/config/loctype/LocOverrides.ts`): `CHARRED_LOCS + id`
(`getCharredLoc`) is loc `id` with every face's lightness under half and its saturation a quarter, and its opaque textures
swapped for dark planks (5) or dark cobbled rock (119), as a textured face is lit and not coloured; see-through green
leaves turn scorched brown (33), and other see-through ones (bars, shingles) keep theirs, as a swap would fill their
holes. They're read from the base loc's data (`LocTypeLoader.getDataBuffer`), so nothing in the real world changes and
the slim cache keeps the base. Ids from `DERIVED_LOCS` are for locs of our own made from another, listed in
`LOC_OVERRIDES` with a `base` (the breach's Falador pieces, charred to `charLight`, the bricks `walkable`). Keep every id under 2^21:
the model caches key a loc by its id << 10. `WALKABLE_LOCS + id` (`getWalkableLoc`) is a cache loc that blocks nothing,
and `WALKABLE_CHARRED_LOCS + id` a charred one: Varrock's fires and its dead, which you walk over and through (the
fires burn as you do: `MapDef.burns`). Varrock's fires are the cache's own flames, never a campfire (4265, 4266 in their
rings of stones, 5249 on crossed logs, 5499 the campfire's flame: a campfire is a camp, not a city burning): `FLAMES`
(25156, the big fire's flames alone) and `TALL_FLAMES` (32297), the big fire (`BLAZE`), burning timber and bones and
the wall of fire, all of them in `FIRES`. A map's lights go by the placed id (`LightingDef.locs`), so a derived loc
needs its own entry there to glow.

**A loc can't play a skeletal animation** (LocModelLoader animates frame seqs only), so a posed NPC, Yama sitting on
his throne (npc 15645, seq 12153), is a `MapDef.props` entry the game draws instead, and the recipe blocks the ground
under it (it blocks nothing itself). As a loc he showed in his bind pose, arms out over the seat.

**The floor system's tiles are flat**, each at the ground's height at its middle, so a floor (`MapDef.floor`) over
steps or a slope comes out as strips at different heights with the ground showing between them. Varrock's palace floor
starts at the top of its front steps; the court and the steps are the ground's.

**What it can't do**: a broken wall is one of the Wilderness's few pieces, dark stone whatever the wall was; a charred
texture is one of two, not the texture darkened; and the noise doesn't know a building's doors, so a ruin can lose the
wall a door was in and keep the rest. check-maps.ts holds a ruin to what any cut is held to: Varrock's blocked decks
(the bridge's east of the palace) are its `squares`. The Grand Exchange's pad is a deck too, cleared to its floor for
Xarth by `clearExchange`, which throws if the pad's rows stop matching the cache's deck.

### City walls

`CITY_WALLS` in `cityWalls.ts` is real walls as data, and `townWalls` is the share of `towns` with one. A real city wall is
never one loc. It's a band of tiles a level high: a face on each side, a blocked middle, and a walkway on level 1 with a rail
along each edge. Level 1 tiles are flagged `TILE_SHOWN` (0x8), which is what makes the cache's wall tops draw from the ground,
so a wall is built the same way here, with no bridge flag and nothing on the walkway to walk on. Everything's blocked at ground
level, so collision stays the ground's.

| Kit        | From                    | Across | Faces   | Top             | Corners               | Gate                           | Slopes                  | `auto` for                                                                  |
| ---------- | ----------------------- | ------ | ------- | --------------- | --------------------- | ------------------------------ | ----------------------- | --------------------------------------------------------------------------- |
| `falador`  | Falador, the west wall  | 3      | 24029   | 24026, 24035    | Cut 3 tiles           | The north gate, 23982 to 23993 | All contoured           | `lumbridge`, meadow, elven, astral, fairy                                   |
| `varrock`  | Varrock, the north-west | 3      | 23795   | 23777, buttress | Cut 3 tiles           | A gap with capped ends         | All contoured           | `varrock`, meadow, swamp, deadlands, darkwood                               |
| `kourend`  | Kourend Castle          | 5      | 23780   | 23775, 3 wide   | Octagon towers, 23818 | A gap with capped ends         | Rails stand level       | `hosidius`, autumn                                                          |
| `shayzien` | Shayzien                | 3      | 14543   | 14558           | Cut 3 tiles           | A gap with capped ends         | All contoured           | `shayzien`, `lovakengj`, ash                                                |
| `civitas`  | Civitas illa Fortis     | 3      | 52286-7 | 52296           | Cut 3 tiles           | A gap with capped ends         | All contoured           | `al`, `pollnivneach`, `sophanem`, `ape`, `taibwo`, desert, jungle, tropical |
| `yanille`  | Yanille                 | 4      | 17088   | 1913            | Square                | A gap with capped ends         | None: the ring's pinned | Nothing: set it yourself                                                    |
| `jatizso`  | Jatizso                 | 1 line | 21407   | Nothing         | Cut 3 tiles           | A gap                          | All contoured           | `rellekka`, snow                                                            |

`wallKit` picks one, and `auto` goes by the family of a town's buildings, then its biome (`families` and `biomes` in the kit),
on a seed of its own. Every biome is covered. Across counts the two tiles the faces stand on. Rough sizes: 2 to 3 tiles tall,
walkways 1 to 3 wide.

**What the generator does** is [the flow](#the-flow): the wall's shape and gates come before anything else is built, in
`layOutTown`, and everything else fits inside. A wall that's asked for and can't be had, because the ground fights it or there
aren't 2 gates with ground to a street, goes, and the town's laid out without one. A town that lands inside a wall that's
already planned is part of that city. A gate's ground is a plot, a straight road goes through it to its street, and the road goes
on to the nearest road once it's past the gate's clear space. Main roads stop short of a wall, and the roads out of its gates
pick them up, so an outside road always comes in by a gate. The ring's level with the town, and `placeTownWalls` puts it up after
the land's finished. Inside, roads are paved, and the square has a fountain.

`Walled city` is the preset for a big one, in Falador's wall, and `scaperune_city` is that as a dev map. `scaperune_town` has
two towns inside Varrock's, and `scaperune_walls` (`maps/wallSheet.ts`) has every
kit, on the flat and on a slope of 3 a tile.

**By hand.** It only needs a `Ground`, so any map can call it, with the heights done:

```ts
import { CITY_WALLS, placeCityWall } from "../cityWalls";

placeCityWall(
    ground,
    CITY_WALLS.falador,
    { x0: 90, y0: 80, x1: 150, y1: 130 }, // the middle of the walkway, corner to corner
    [
        { side: "south", at: 120 }, // by the tile at the gate's middle: an x on the north and south, a y on the others
        { side: "west", at: 104 },
    ],
    (x, y) => ground.isWaterTile(x, y) || ground.footprint[ground.tile(x, y)] !== 0, // where it can't stand
);
```

Then keep to what the generator does for you: two gates or more, and a road through each one, straight on for `GATE_LEAD` tiles;
call it before `dressGround`, and keep everything else off the band, which is `forWallTiles`. `getGateColumns` says which tiles a gate takes up, so you can pin them flat.

**On slopes.** Contoured kits bend to the ground, walkway and rails too, because a level 1 height is measured from the level
below. They've looked right at 3 a tile. So on a hand-made map let a wall run over what's there, up to about that, and pin a
gate's plot flat: a gate's own locs are contoured in `falador`, but the road through it still wants to be level. A tower isn't
contoured, so pin it a plot too, and use `level` kits (`yanille`) on flat ground or with the ring pinned, as `levelWall` does.

**What they cost.** Triangles a tile of wall, both faces and both rails: `falador` 634, `civitas` 512, `varrock` 550, `kourend`
558, `shayzien` 468, `yanille` 76, and `jatizso` 366 for its one face. A screen is 27 tiles across, so a stretch of Falador's
wall along the middle of one is about 17,000 triangles.

**Adding a kit.** `wall-survey.ts`'s `runs` reads a section, and `dump` the rest. It wants a wall type in the face's and the rail's
`types`, with 1 and 9 for cut corners and 2 for square ones (`model-bounds.ts` prints them). Add it to `sweep` by being in
`CITY_WALLS`, and look at it on `scaperune_walls`.

**Left out, and why**: Sophanem and Menaphos (6562 stands with a skirt 1.2 tiles under the ground and is finished by diagonals on
level 1 and walls on level 2, which came out with a black foot and a muddle at its corners), Darkmeyer (its walls have only a
straight model, and its corners and towers are its own locs), Camelot and Lumbridge (castles, whose walls are building walls),
Rellekka and East Ardougne (what looks like a city wall is a house's or a paddock's). Kourend's real gates run under the walkway,
which would hide the player, so its gate is a gap.

### Floors and heights

- **Underlays** are the ground. They're blended over 11 tiles by the renderer, so colours soften on
  their own.
- **Overlays** sit on top, with hard edges: paths, water, floors. Give `paintField(field, id, blocked)` a
  field with a value per tile corner, above 0 inside: distance to a river's centre less its half width, a
  radius less the distance from a pond's middle. Anything smooth. `addPathToField` makes one from a path,
  and `smoothField` evens one out. `paintOverlay(mask, id, blocked)` does the same from a mask of tiles,
  for hand-made shapes, but the edges follow the tiles more, and it smooths away anything a tile or two
  across.
- **Why fields:** an edge can only cross a tile side at a corner or at its middle, and adjacent tiles share
  those points. So `shapes.ts` picks each tile's shape from which of its eight half sides are covered, and
  edges join up. Picking shapes from whole tiles can't do that: a line ending at a corner next to one
  ending at a side's middle makes a tooth. Don't use shape 11: it dips to both corners, so a row of them is
  a row of teeth.
- **Ids are as the map files store them, the cache's id plus one.** A recipe and a grid use the map files'
  number, and `find-prefabs.ts` prints them this way, so copy from there. The floor loaders take the cache's:
  look a grid's floor up with `cacheFloorId(id)` (`format.ts`), never `id - 1` by hand. `dump-square.ts`
  prints both, as `map file id/cache id`.
- **Patterned floors are usually type 22 decoration**, not overlays: a hall's tiles or a mosaic are locs on
  a plain floor. Find them with `dump-square.ts` or the world index, and cut them with a rug (see
  [Prefabs](#prefabs)).
- **Heights** are one byte per tile corner, going up, 8 scene units each. A tile is 128 units across, so 16
  a tile is 45°. Real lowland stays between about 0 and 80, and real mountains use all of 0 to 255. `setHeight`
  rounds and clamps for you. The generator works in floats in `Terrain`: see [Height](#height).
- Look at what a kind of ground is made of with `find-prefabs.ts` on a real square, then use those ids.
  That's how `biomes.ts` was made.

### Height

Height's a layer of its own while a map's built: `Terrain` holds a float per corner, and only the finished heights go
into the grid. Nothing in the generator writes heights directly. Whatever needs the ground to be a certain height **pins** it, and
`settle` brings the ground round it to meet that, cutting and building no steeper than `SETTLE_SLOPE` of what's
walkable. That one idea does cuttings, embankments, plots and the ground round bridges. On a tie between two pins,
the first one stays, so a late pin can quietly lose. A pin also beats a held corner.

**The limits, measured:**

| What           | Number                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| A height       | 0 to 255, one byte, a step of 8 scene units. 1 reads as 0.                                                   |
| Tallest ground | 255 is 2040 scene units, 16 tiles. Real peaks use it (Trollheim, Cam Torum)                                  |
| Real slopes    | 99.96% of tiles are 80 a tile or under; `getTileSlope` measures, and `STEEPEST_FACE` caps ours at 72         |
| Tiles          | two triangles, split south-east to north-west                                                                |
| Light          | from the south-west. 11 to 181 against 84 on the flat, so it can't overflow; camera-facing slopes are bright |
| Actors         | stand on `getHeight` at their middle. They don't tilt.                                                       |

**The camera.** It's fixed: it looks north, at 70° (pitch -400), from 18 tiles (10 to 44 with the wheel), 45° field of
view, so at the default zoom it sees about 27 by 16 tiles. So:

- **Only drops to the north can hide anything**, because the camera's south of what it's looking at. 70° is 44 height
  units a tile, so a face steeper than that hides its own foot. `limitNorthFaces` keeps them to 30 (`NORTH_FACE_SLOPE`),
  and `check-maps.ts` counts open tiles hidden from the camera, which must be 0. The rest of the view runs from 92° at
  the bottom of the screen to 48° at the top, so a tall ridge can hide a tile or two near the top until you get closer.
- **It doesn't clip** over any slope within that limit. It'd lurch at creases on tall ground, so on dev maps it eases after
  the ground (`CAMERA_GROUND_EASE`).
- **It rides with the player**, so whatever level they're on looks the same, and other levels are nearer or further. Ground
  h tiles higher to the north shows 0.36h further up the screen (0.9h near its top), so it pushes what's on it off the top:
  past a rise of 65 a phone sees about 4 tiles onto it, and past 125 under one. A level 65 down is drawn at 0.8 of the size,
  125 down at 0.7. Depth doesn't fog or darken.
- **How much it takes**, from `scaperune_depth` (`maps/depthTest.ts`: slopes, cliffs, platforms and pits of 30, 60, 65, 125
  and 128, desktop and phone): up to 65 (a Sepulchre level, 4 tiles) reads well up or down. Past that, keep it for what's
  only looked at, as the Owl's Court's lower walkway is. A bare face of terrain is one tile stretched over its height: a
  plain overlay reads as a flat band, and a textured one streaks, so hang walls on a tall one, as the court does.
- **Scenery round the arena** (`scaperune_backdrop`, `maps/backdropTest.ts`). Only faces that look south are seen, so:
    - **A drop reads by what faces the camera.** A drop to the south shows its face. A drop to the east or west shows
      nothing, and a flat floor seen down a drop to the north looks like a floor at your own level, however deep. Give a
      chasm to the north a far rim back up (its face is what looks deep), ledges stepping down the near side, or black
      void with a lit ledge below it. Past 16 tiles it looks no deeper. Deeper than the byte is a bridge deck on level 1
      (another 255) or a `LocOverride` height.
    - **What rises to the north is cut off by the top of the screen**: about 10 tiles of it are ever seen on a desktop and 8
      on a phone, with the player at its foot. Anything taller is triangles nobody sees. A cut-off column still reads as
      tall.
    - **What rises east or west leans out over the screen**, more the taller it is. Keep it under about 6 tiles, or it
      looms. To the south, behind the camera, keep it under about 2 tiles, or let the ground fall away.
    - **Terraces read best of all**: steps of 32 every 4 tiles, with trees on them getting smaller as they go down.

**Walkable.** A tile steeper than `walkSlope` is blocked with the same floor flag as water, going by the rounded heights in the
grid, so `getCollisionFlags` and the game's scene agree. To the flow field a cliff's a wall, and enemies only turn up where they
can reach you (`canTurnUpAt`).

Cliffs are picked in `shapeCliffs`: tiles over `walkSlope`, without specks or ledges too thin to walk. What's left is eased
under the limit, so a hillside comes out as ground you can walk on and cliffs you can't, with nothing in between. **A blocked
tile always looks it**: everything blocked gets rock's overlay.

**Flat land.** `flattenLand` puts open ground on levels 12 apart, with `flatness` the share of each level that's flat. It leaves
slopes near the limit, cliffs and held corners alone, and runs after roads are graded.

**Faces.** `finishHeights` takes the tops off anything over `STEEPEST_FACE` in any direction (`limitFaces`), and brings
ground up to a corner held high (`liftFaces`). Only what can't move is left over the bar: a fall in a river, and the bank of a
bridge, one tile from the water.

**Reachability.** `cutPasses` cuts a graded pass to any piece of ground over `MIN_PASS_PIECE` the cliffs cut off, before
roads go down, so roads use them. Anything smaller stays out of reach, which is fine on top of a mesa. Nothing's built
off the `mainland`.

**Roads.** Routes are found with a cost per step (`climb`), so they wind up a slope rather than go straight up it. Their heights
are worked out **all together, last** (`roadGrades.ts`), with leads and plots pinned. One at a time doesn't work: a road's
height depends on what it meets and passes, and those can come later. Then the ground's pinned to them across their width,
and `pinTiles` pins out to the corners of every tile that'll be painted, or a road's edge stands on a slope. Water can't move
for a road, so where one runs along a shore the shore gives way, by the tiles that touch the road's. Painting skips anything
blocked or solid, so that a tile painted as road can be walked, and `clearLocs`, last of all, takes off anything solid that's
still on one. `easeTiles` smooths what's left too steep under a road's middle, once the heights are done. A hand-made map with a
`RoadNetwork` calls `pinTiles` and `clearLocs`.

**Rivers** (`findValley`) follow the low ground, a column at a time, so a river's a function of how far along it is. They run in
flat reaches, each at the lowest level it comes to, with all the height they lose at drops (`stepRiver`), `WATERFALL_SPACING` apart
at the least, or sooner once `WATERFALL_TALL` has built up, and never within `LEVEL_AT_CROSSING` of a crossing. Water's one level to a piece: tiles that touch share corners, so
wherever two levels meet the lower wins, and only a drop parts them (`createWaterLevels`). A drop with nothing left to drop goes.
Banks come down over `riverValley`'s slope: sheer gorges at 0 and wide valleys at 1. Water's corners are held and locked
(`holdWater`): `Terrain.pin` does nothing to them, so a road or a plot beside water meets it, and can't tilt it.

**Bridges** stand with their banks `bankHeight` over the water. A deck's stored relative to the ground under it, and a prefab's
own river isn't ours, so `seatBridge` leaves the water as it is, levels the bank, and stores the deck again over what's really
under it. Pinning the ground to the prefab's own heights tilts the water beside the banks. There are three in `BRIDGES`, and a
biome names one. They can stand in for each other because all have an 11 tile deck, 2 wide, in an 18 by 6 rectangle. The cache's
dozens of others have their own banks: most run into cliffs or are flat with the water.

**Buildings** stand on a flat plot (`pinPlot`) with a level step out of the door, only where the ground rises less than
`MAX_PLOT_RISE`, away from cliffs, with room to get down to water, and where their road can reach what it joins.

**Roads and buildings: the rules.** `check-maps.ts` fails on any of these, on the dev maps and on `SWEEP`, settings at their
extremes:

- **A road never goes through a building**, walls included, whichever was placed first. Buildings keep off road
  tiles; roads and fords can't step within `RoadNetwork.wallGap` of a building's plot (`offLimits`); smoothing that drifts
  onto one is undone; and painting skips `Ground.footprint`.
- **A building's door faces a road.** Main roads and bridges go down first, then buildings with roads, each turned
  so a way out faces the nearest road, with its road running straight out of that door. One that can't reach the
  roads goes somewhere else.
- **A building without a road still faces the nearest road**: they're placed last, so they see all the roads. If
  there are no roads at all they face the spawn. The `roads` setting is the share of buildings that get a road.
- **A door's lead-in is its own.** Other roads join past it, not against the wall.

**Actors on slopes.** On dev maps `getHeight` follows the triangles a tile's drawn with (`ArenaGrid.exactGround`), and anything
with a radius over a tile is lifted part of the way to the highest ground under it (`groundUnder`).

**A heightmap** replaces hills and ranges (`heightmap`). The screen shrinks an image to `HEIGHTMAP_SIZE` a side, and it travels
in the settings as base64. Black is the floor of the land and white is `peakHeight`.

**To add a landform**, add a function to `landforms.ts` that adds to `terrain.height` and marks `mountain`, call it from
`createRelief`, add its setting, say so in `hasRelief` (`mapBuild.ts`), and add a line to `SWEEP` at its extreme. To give
a new biome its mountains, fill in `rock` in `biomes.ts`: the palette picks it up.

### Rock

Real rock is plain colour with small things on it. `RockDef` in `biomes.ts` says what a biome's made of, and `dress.ts` does
the work: see [step 6](#6-rock). Above the snow line cliffs have no overlay, and `SNOW_ROCK` dresses them. A dark underlay
bleeds a long way into white (11 tiles), which is where snow's dark smears came from, so `snow` has a pale `ground` (underlay
16).

| Locs                                                                   | What                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 3709, 3703, 11439, 336, 14483, 5328 (type 22)                          | pebbles, 18 triangles                                                      |
| Rockslide 11434 grey, 11922 white, 18894 amber, 11933 dark, 3718 mossy | heaps of rock, 2 by 2, 174 triangles, 0.3 tiles tall                       |
| 55130 brown, 51792 tan, 4605 dark grey                                 | the same                                                                   |
| 11433 grey, 18893 amber, 55129 brown                                   | bigger heaps on the same 2 by 2, 380 triangles                             |
| 34384, 34372, 42352 (type 10)                                          | full tile rock: near-black green, olive, black. Dark floors only           |
| 34385, 34388, 34391, 34392, 42353 (type 10)                            | broken facets, for the edges of a carpet                                   |
| 42097, 42098, 6617, 52795, 48627, 57476 (type 22)                      | flat patterned decals: brown, tan, maroon, green. They look like brickwork |
| 53538 (wall), 53543 (diagonal)                                         | snow on a wall; ice shards, which look terrible                            |

Don't reach for rock "walls": 85, 2639, 4451, 44603 and 38848 turn up along cliff edges, and they're invisible walls.

### Water

Paint it with an overlay and `blocked: true`. The blocked flag is what stops you, not the overlay.
Water overlays: 6 and 442 (rivers and sea), 7 (swamp), 19 (lava), 547 (`snow`'s), 568 (Ysmar's). There's no water plane:
water's drawn at the height of its tiles' corners, so every tile's corners must be level, and the heights near water come to it
over a few tiles (`distanceTo` gives you the distance). Lava's held to the same rule. By hand: give a piece of water one level,
sink the ground to it with `sinkFresh`, then `holdWater` its tiles before anything's pinned. List tiles that drop in `waterDrops`.

**Waterfalls.** Rivers gather their fall into single drops, with foam across the river. The tiles of a drop are the only water
that tilts. What you'll mostly see are `cliffFalls` (`falls.ts`): a model on a cliff that faces the camera, into a pool made for it.

How real falls attach, measured with `research/falls.ts`:

| Fall                           | Top                               | Foot                    | Edges                               |
| ------------------------------ | --------------------------------- | ----------------------- | ----------------------------------- |
| Baxtorian, 2500,3465           | The river, dead flat to the lip   | Flat water, 150 below   | Rows of the drop level for 24 tiles |
| 16302, a cave, 3040,4520       | A flat lip, 49 up, 4 rows back    | Flat, level for 9 tiles | Rows level past both edges          |
| 51484, 1487,9678 and 1512,9685 | Wall locs, the model's own height | Dead flat               | Dead flat floor, wall locs          |
| 44632, a cave, 3357,11488      | Wall locs                         | Flat                    | Flat floor                          |

So a fall's rows are level across, wider than the fall, and the model carries its own height on flat ground. That matters because
a contoured model's vertices each go up by the ground under them: 51484 is a sheet 65 tall (44632, 33) from about a tile in from its
south side, then a shelf at that height to its north edge, always that far over whatever's under it. On a slope its back lifts off
the cliff and shows. So a fall gets a seat (`getFallSeat`, `seatFall`). In corner rows north of its south row, with `level` the pool:

| Row    | Height                                                                    |
| ------ | ------------------------------------------------------------------------- |
| 0 to 2 | `level`: the sheet's front stands on flat ground, in the pool             |
| 3      | `lip` less the model's height, up to 25 over `level`, 6 under             |
| 4 to 7 | `lip`, flat, with what feeds the fall on it. A river's own reach does too |

Rock runs 2 columns past each edge at the same heights, and eases back to the ground over 3. A cliff taller than 90 gets a cleft cut
down to that, and a spot that isn't a straight cliff, or has anything on it, is refused. A drop past that is two falls, one on the
other's lip: the Silverrun's great fall on `maps/vardhelm.ts` is the one to copy, with falls side by side across a river.

**Caves** are decoration: a mouth 3 by 2 tiles at rotation 0 (facing south), set into the foot of a cliff that faces the
camera. Nothing goes in them. They're on tiles that are blocked anyway.

### Prefabs

There's no building entity in the cache. A building is its locs and floor tiles, so a prefab is a
rectangle of the real world.

1. **Find one.** `find-buildings.ts` finds whole buildings in a block of squares, and `loc-sheet.ts` draws what it finds.
   `bun run tsx scripts/scaperune/find-prefabs.ts 50 50` draws map square 50,50 as text with world
   coordinates down the side. Use `rect=x,y,w,h` for a rectangle across squares and `plane=N` for
   another level. Pick a rectangle that holds the whole building and nothing else.
2. **Name it** in `PREFABS` (`prefabs.ts`): its south-west corner and size, in world tiles, and give it a kind in
   `BUILDING_KINDS`. The rectangle must take in every wall of the building, with nothing else in it. A rectangle a row short
   loses that wall, and the floor behind it with it. The start of its name is its family, so a new prefab for an existing
   family goes in that family's towns.
3. **Check it** with `bun run tsx scripts/scaperune/check-prefabs.ts`. It walks the walls of every
   prefab in every rotation and fails if a wall is cut off, floor is lost indoors, or there's no way
   out. The dev map `scaperune_prefabs` shows them all in all four rotations.
4. **Stamp it**: `kit.stamp(ground, name, turns, x, y)` on a `PrefabKit` stands it on flat ground with its doors off,
   and `kit.stampRuin` leaves most of it gone. `new PrefabKit(context, MY_PREFABS)` lets a map bring its own, which
   the generator won't pick and `check-prefabs.ts` won't check. For anything else,
   `ground.stamp(rotatePrefab(loadPrefab(context, def), turns, locs), x, y, options)`.

**A place can be upstairs.** Xarpus's room and the Sanctuary's chamber are both on level 1, so a plain cut of them
comes out empty: 0 open tiles. `scripts/cache/dump-square.ts` lists a square level by level, which is how to tell.
`cutPrefab(maps, x, y, w, h, { plane: 1 })` (`prefab.ts`), or `plane: 1` in a `PrefabDef`, brings that level and the
ones above it down to the ground floor, as the game only draws one. Each level's flags come down with it: level 1's
`TILE_SHOWN` or `TILE_BRIDGE` lands on level 0, where it means nothing, and level 2's bridge now marks level 1.

**`rotatePrefab` turns a whole cut**, locs and all, even 100 by 120 tiles of a town (the Theatre's Meiyerditch hall).

`stamp` options:

- `floor`: `"footprint"` keeps our ground and takes only the floor inside the walls, so the ground runs up to
  them and no stray steps or paths come along. Use this for buildings. `"all"` takes the whole rectangle, which rarely looks right. A function picks which
  overlays to take: the bridge takes almost none, so that it stands on our river and our road runs onto it.
- `flatten`: stands it on flat ground. Use this for buildings.
- `feather`: how many tiles the ground takes to ease back. 4 is about right.
- `keepUnderlays`: keeps our ground's colour under it. Use this whenever the prefab's from other ground, or a
  Lumbridge house gets a green halo in the snow.
- `keepHeights`: leaves the ground's height alone, for a map that pins it in `Terrain`.
- `skipLoc`: leaves locs out. The generator drops doors: closed ones block, like walls.
  `skipBlocking(context, { doors: true, props: "one-tile" })` (`prefabs.ts`) clears a cut of real streets so it can be
  walked: doors off, and the props that block on one tile (`props: "all"` for every size). It decides what blocks by the
  game's collision (`getLocBlocking`), so a patterned floor stays and only the ground level counts; pass `prefab` so a
  bridge's level counts as ground. Don't write your own rule: `type >= 10 && 1 by 1 && clipType > 0` also takes every
  patterned floor and everything upstairs.
- `locs: context.locs`: marks what blocks in the prefab as `occupied`, so a `Placer` keeps off it.
- `height` and `anchor`: stand it at a height, and say which of its own heights that means.

**A rug** for a painted hall: `cutRug(context, { worldX, worldY, sizeX, sizeY }, { plane, maxStep })` (`rug.ts`) cuts only
the floor and the floor decoration that's walked on onto level 0: nothing that blocks, and no flags. It leaves out tiles whose
corners stand more than `maxStep` off the rug's middle height (a raised pad or a slope), and tiles whose floor belongs to
another level. Stamp it with `floor: "all"`, or `floor: (overlay) => overlay !== 0` to keep our floor where it has none.

### Writing a recipe by hand

A recipe says where its squares go and how to build them. This is a whole map: a square of grass in a
ring of water, with a building, some trees and the ground dressed.

```ts
import { Ground } from "../Ground";
import { dressGround } from "../dress";
import { createRng } from "../noise";
import { PrefabKit } from "../prefabs";
import { BuildContext, MapRecipe } from "../recipe";

const SIZE = 3 * 64; // one arena square, one square of margin each side

function build(context: BuildContext) {
    const ground = new Ground(SIZE, SIZE);
    const rng = createRng(1);

    // Floors and heights. Heights are per corner, so they go up to SIZE inclusive.
    ground.level0.underlays.fill(48);
    for (let y = 0; y <= SIZE; y++) {
        for (let x = 0; x <= SIZE; x++) {
            ground.setHeight(x, y, 40);
        }
    }

    // Water round the outside: overlay 6, blocked
    const water = new Uint8Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const edge = Math.min(x - 64, 127 - x, y - 64, 127 - y);
            water[ground.tile(x, y)] = edge < 4 ? 1 : 0;
        }
    }
    ground.paintOverlay(water, 6, true);

    // A building, turned a quarter, on flat ground with its doors off
    new PrefabKit(context).stamp(ground, "lumbridge_house", 1, 90, 90);

    // Trees: size is the loc's tiles a side
    for (let i = 0; i < 30; i++) {
        const x = 70 + Math.floor(rng() * 50);
        const y = 70 + Math.floor(rng() * 50);
        if (ground.isClear(x, y, 2, 2)) {
            ground.place({ id: 1276, type: 10, rotation: 0, level: 0, x, y }, 2, 2);
        }
    }

    // Last of all: what real ground has on it, by floor
    dressGround(ground, { seed: 2, density: 1, biomeDecor: () => [4735, 4736] });
    return ground.grid;
}

export const LITTLE_ISLAND: MapRecipe = {
    id: "scaperune_little_island",
    // Map squares the cache doesn't have
    mapX: 78,
    mapY: 94,
    squaresX: 3,
    squaresY: 3,
    // Squares of scenery round the arena
    margin: 1,
    // Grid tile
    spawn: { x: 96, y: 80 },
    build,
};
```

Then add it to `SCAPERUNE_DEV_MAPS`. `content/maps.ts` makes a `MapDef` for each dev map, with Lumbridge's waves. `play` takes the
waves, enemy density and brightness from a real map, and `mapDef` goes over the `MapDef` itself. Leave `fun` set, because
`startRun` quietly does nothing on a map that isn't open, and dev maps are only open for being fun maps. So they're endless:
one with its own waves needs a boss in `fun`, and `paced()` needs exactly 15 wave sets.

To have `check-maps.ts` hold it to the rules, give the recipe a `detail` that returns a `GeneratedMap`, and have `build` use it.
A place cut whole from the real world can't keep the generator's rules for its ground: list its rectangles in `designed`, and
`check-maps.ts` lets its clashes, bridges, slopes and tilted water go (the game's collision must still agree with the
generator's). The Theatre's halls and boss rooms are.

Three maps are whole worked examples, each going further than this one:

- `maps/vardhelm.ts`: land carved by hand from a massif, a road up a cliff in hairpins, and prefabs of its own.
  Its `mapDef` has an opening cinematic too (`maps/vardhelmOpening.ts`), with knights at the keep's door as props:
  see Props and opening cinematics in `docs/DEVELOPMENT.md`.
- `maps/kaluasWake.ts`: coasts drawn as splines, a `Build` of its own with the generator's parts run in its order, sea
  bridges and a raised village. `paintThinRock` puts back the colour on cliffs too thin for `paintRock`.
- `maps/shatteredRealm.ts`: land over a void, its own waves, events and bosses, and terrain as architecture.

`createBuild`, `paintFloors`, `scatter` and `connectGround` are private to the generator, and `paintRock`,
`blockSteepGround`, `gradeRoads` and `createPace` need a `Build`, so a hand-made map copies what it needs. Keep to the order in
[The generator's order](#the-generators-order): it's the one that works.

Grid tiles start at the grid's south-west corner, x east and y north. `getRecipeWorldTile` turns them
into world tiles.

#### Placing props by hand: `Placer`

The example's `isClear` and `place` are fine for trees on open grass. For anything more (a chamber full of statues, a camp,
a set piece), use a `Placer` (`placer.ts`):

```ts
const placer = new Placer(ground, { rng, locs: context.locs });
placer.refuse("arena", (x, y) => inArena(x, y)).refuse("gateway", onGateway);

placer.solid(STATUE, x, y, { rotation: 1, gap: 1, kind: "statues" }); // its size turns with it
placer.solid(BARRIER, x, y, { allow: ["gateway"] }); // the gate's own things stand on its way through
placer.dress(CANDLE, x, y, { type: LOC_NORMAL }); // walked through: one to a tile
placer.scatter(
    "dead raiders",
    10,
    () => randomSpot(),
    (x, y) => placer.solid(RAIDER, x, y),
);
expect(placer.describeShortfalls()).toEqual([]); // or read placer.report() per kind
```

- **Solid things go by `Ground.occupied`, not `reserved`.** `reserved` is set by painted floor too, so `isClear` refuses a
  statue on a painted path. `occupied` is only what's standing there: what `place()` put down (not floor decoration), and
  what a stamp brought that blocks, if its options have `locs: context.locs`. A building's `footprint` is refused too.
- **Sizes come from the cache** and turn with the rotation. A test that builds without the cache passes
  `sizes: [[id, sizeX, sizeY], ...]`; an id in neither throws.
- **Zones** say where nothing goes. Each `solid` or `dress` can `allow` some by name.
- **Count the build.** Every call is counted by `kind` (the id by default): requested, placed, and why the rest were refused
  (`occupied`, `dressed`, `building`, `off the grid`, or the zone's name). A recipe test can then assert what was placed
  instead of someone counting by eye.
- **A loc off a whole tile throws** (`Ground.place`, `Placer.dress` and `writeLocs`), rather than the map file quietly moving
  it: `x / 2` of an odd width is the usual cause. Use `Math.floor`.
- **What a boss fight animates is a stand-in** (`placer.standIn(id, x, y, { rotation, walkThrough, kind })`). A map square
  bakes each loc with its own animation only, so a placed statue can't be told to aim or throw on cue; the fight draws it
  instead (`BossAttackDef.statues`). A stand-in's tiles are taken and blocked (open if `walkThrough`) as though it stood
  there, but it's left out of the map and listed in `placer.standIns`. Hand them on as the map's `standIns`, so
  `view-weight.ts` counts their triangles: the Owl's Court's 24 (crossbowmen, knights, fire jets) take its heaviest phone
  view from 38k to 60k, which a count without them never showed.

The Sanctuary and Hallowed Night still use their own copies: moving them onto `Placer` would re-roll their dressing.

#### A map of rooms

A boss or raid map is islands, not one open map: a hall per room, a boss room beside it, an arena with nothing walkable
round it. Two things in `collision.ts` build one, and the recipe says what it's made of so `check-maps.ts` can hold it to
that.

- **`sealFrom(grid, context.locs, regions, { outside, label })`**. Each region is a `name`, a `rect` and a `from` tile, in
  grid tiles. It floods each region from its start without leaving the rectangle, then blocks every tile of the rectangle
  no flood reached. With `outside: "block"` everything outside every region is blocked too, which is what a map of only
  rooms wants. It returns each region's `open` and `sealed` counts, and throws, before blocking anything, if a region comes
  to fewer than its `min` tiles or would seal more than its `maxSealed`. `min` set to the rectangle's area means nothing
  solid stands on it (the Sanctuary's square).
- **`assertReachable(sealed, points, label)`** throws unless each point (`name`, `x`, `y`, optional `region`) is on a tile
  `sealFrom` left open, and reached from its own region's start if it names one. Use it for where the game puts the party
  and the bosses: a boss in a wall throws here, not in a playtest.
- **On the recipe**, `regions` (the same objects: a `SealRegion` is a `MapRegion` with `min` and `maxSealed`) and `points`.
  `check-maps.ts` then counts each region's open and stranded tiles from its own start, with the game's collision, instead
  of the whole arena's from the spawn, and fails on a leak, on open tiles outside every region, and on a point that's solid
  or can't be reached. Declare every point the game uses, including a `MapDef` spawn that isn't the recipe's (Phosani's
  start is 7 tiles south of the middle).

`theatreOfBlood.ts` (12 regions: a hall and a boss room for each of six rooms, with each room's start, arrival and boss)
and `sisterhoodSanctuary.ts` (one region, her square, with `min` its whole area) are the examples. `owlsCourt.ts` is one
region that isn't a rectangle of open ground: the court, a bridge and a terrace in one `rect`, with the void and the blocked
rims and dais in it blocked first, so `maxSealed: 0` says nothing open was cut off.

**Walkways over a void, as the Hallowed Sepulchre is built** (`owlsCourt.ts`, Justiciar Zachariah's arena): every walkway
tile is a type 22 stone tile over a plain overlay of the stones' own dark blue-grey (141), and the void has no floor at all,
so it draws the renderer's black. The Sepulchre's own floor under its tiles is the hidden overlay (359), which showed the
black through the seams between the tiles: `check-maps.ts` warns of that now. Each walkway's edges get the Sepulchre's lips on the void tile beside them (a corner piece where an edge turns, a post
where only a corner touches), and its tall wall 38924 under every edge the camera can see. The cache stands that wall on the
level below, rising to the walkway; a map draws one level, so `LocOverrides.ts` lowers it 4 tiles and 4 units (its cap
would be in the floor's plane otherwise) and it hangs from the edge. A second walkway 4 tiles lower is ground of its own, blocked, and kept 4 tiles from the upper one so the void round
each is flat at its height and the lips stand level. The camera's always over the court, so west faces west of it and east
faces east of it are left out for the phone's sake. Every statue the Sepulchre has looks south unturned, west at rotation
1 and east at 3.

**A floor the game draws itself** (`wardensFloor.ts`, a dev map trying out `MapDef.floor`): the Wardens' room in the Tombs
of Amascut, cut whole with `plane: 1`, with its own floor swapped for the hidden overlay and its floor decoration and middle pit
left out. `client/FloorView.ts` draws every tile of it as a slab (the rising slab's model at rest), so each can rise or fall
on its own. Nothing at the slabs' height is drawn, so there's nothing for them to z-fight: the floor's tiles are a bridge
(`TILE_BRIDGE` on level 1, the hidden overlay, heights from level 0's) nine tiles over a pit with no floor and nothing
on it; what's seen under the floor is drawn by the client on a regular grid, so a hole looks the same at every size. A level-0 loc under a bridge
doesn't block what's walked or what's seen across it, so `check-maps.ts`'s sight lines leave it out, and its hidden-tile
check stands a bridge's tiles at the deck.

#### A boss fight's arena

What the Owl's Court (`owlsCourt.ts`, `docs/design/justiciar-zachariah.md`) learnt, for the next arena:

- **The fight reads the arena off the map.** Export everything it reads in arena tiles (`OWLS_COURT`: the boss's square, his
  rise, the start, pillars, crossbow lanes, knights, fire rows, the dais), and have the content turn that into the `MapDef`'s
  `features`. The fight never hard-codes a tile. Each of them is a `points` entry too, so a lane's end in a wall throws in
  `assertReachable`, not in a playtest.
- **He comes in where the player isn't running past him.** He descends in the court's middle and the player starts by its
  south edge, 11 tiles off, inside his 16-tile leash. The intro holds the camera on him and pans back to the player
  (`BossIntroDef.pan`), and the player faces him while held (`faces`). The first layout started the player on the terrace
  with him at the bridge's head, and they ran past him to reach the court.
- **Don't paint a mechanic on the floor.** The court first laid its lightning's 3 by 3 checker as rugs, and it read as a board
  game. The floor's plain stone with one runner up the aisle; the strike's own glow marks the cells it's about to hit.
- **What it animates is a stand-in** (`Placer.standIn`, above), and counts on the phone like anything else. A crossbowman
  statue is 1,434 triangles, so three lanes a side; the lightning is his own cast, not a pair of priest statues, which would
  have been about 1,500 triangles more on the heaviest view. Run `PHONE=1 view-weight.ts` with the stand-ins in.
- **What the cache can't do is the fight's to draw.** Nothing in the cache casts a pillar's shadow, so the gaze's safe ground
  is a colour overlay the fight draws (the design doc's section 9). Keep that for what has to be read exactly.

### How big a map can be

Measured in Node on this VM, on a forest-bound meadow with default settings otherwise, through `preview.ts`:

| Squares a side | Tiles in the grid | Generate | With `sites: 0` | Node peak |
| -------------- | ----------------- | -------- | --------------- | --------- |
| 8              | 410 k             | 2.3 s    |                 | 640 MB    |
| 16             | 1.3 M             | 8 s      | 7.3 s           | 1 GB      |
| 28             | 3.7 M             | 28 s     | 23 s            | 1.7 GB    |

- **What's left is mostly roads.** At 16 squares buildings cost about 3 s and `sites` next to nothing: with neither it's 4.3 s.
  At 28, finding the roads to a town's buildings is 7 s of the 24, so `sites: 0` doesn't help any more and few buildings does.
  It runs on the main thread, so on the map generator's screen that's a frozen tab while it lasts.
- **Mountains cost more on top**: 15 s at 16 squares with `mountains` at 0.75. It's noise on every corner, passes and fords.
- **Cost per tick doesn't grow.** The flow field's a fixed 96 tile window round the player, enemies stay near the
  player, and the renderer only loads the squares near the camera (4 to 8 of them). A tick took 0.73 to 0.76 ms with 400
  enemies at every size, before sites and dressing.
- **What grows is memory, with area**: the map grid while it's built on the main thread, and the collision scene for a
  moment in one worker. Browser peaks ran from 1.5 GB at 8 squares to 2.25 GB at 28, of which about 1.4 GB is there before a
  map is built, and that was before dressing added its locs.
- **The hard limit is the world**: 28 is what fits at x 70 to 99, because `MapManager.MAX_MAP_X` is 100. Raising
  that is one line, but past 28 this VM's 2.4 GB cap would stop it, so it hasn't been tried.
- Over 8 squares a side the minimap's blurry, and blank away from where you've been.

### Traps

- **Nothing outside the grid exists.** The game draws black past it. Keep a margin of a square of scenery
  round the arena. `margin: 1` does.
- **The arena's edge is an invisible wall.** Water or trees just inside it hide that.
- **Enemies only path 48 tiles.** The flow field's window is 96 tiles across (`FLOW_FIELD_SIZE` in
  `Sim.ts`), so keep river crossings closer than that to wherever the fight is, or enemies on the far side
  stand at the bank. A long cliff's the same, but they only turn up where they can reach you, so it just means
  they come from your side of it.
- **Rock's colour needs a band 3 tiles across.** `paintRockFloor` and `paintRock` take off anything thinner, and a cliff one
  tile wide gets none. `paintThinRock` in `maps/kaluasWake.ts` puts it back, to the tile.
- **`dressRock` only uses blocked tiles**, so one called before they're blocked does nothing, and says nothing.
- **Sites need roads.** With `roads` at 0 and no `towns`, buildings don't gather. Sites still pull in scatter and landmarks.
- **`foot rock` counts a biome's rock overlays**, wherever they are. `ash`'s roads are overlay 99, which is rock in `deadlands`.
- **Two parallel roads merge if they're close.** Roads are smoothed as a field before they're painted, so one 4 rows
  from a bridge's road adds a third row beside it. `BRIDGE_ROAD_CLEAR` is what keeps them apart.
- **A setting that adds rock must say so to `hasRelief`**, or rivers won't look for a valley and main roads won't route.
- **Pins made before a pass are let go** (`cutPasses` clears them, having cut the ground), so anything pinned for good
  comes after it.
- **The camera's fixed, so faces aren't equal.** It only ever sees faces looking south. A rock face on a north-facing
  cliff's mostly lost, and anything that has to be seen (a cave's mouth) has to look south.
- **The map's seed order matters for water**: rivers come after the land's shape and before water's levels, and levels
  need the sea sunk first, or a river's lowest point isn't known.
- **`spawn` must be open**, and it has to be known without building the map, because the game needs it
  first. The generator clears water and scenery round it, wherever `spawnX` and `spawnY` put it.
- **Faces in one plane z-fight.** Two up-facing faces at the same height that overlap flicker as the camera moves, whatever
  their priorities: the renderer's depth bias (`main.vert.glsl`, 0.0007 of a tile a priority step) doesn't keep them apart.
  The Owl's Court had three: its hanging wall's cap at the floor's height, a wizard statue's plate flat on the floor, and the
  great owls' plinth, whose steps every 2 units met the raised edge of a stone tile 6 up. `check-coplanar.ts` (and
  `check-maps.ts`) finds them from the scene as the renderer builds it. Lift the loc a unit or a few in `LocOverrides.ts`
  (`height`), an odd number for steps that go up in 2s, or sink a cap that a lip hides.
- **Floor decoration over the hidden overlay shows the void.** Tiled type 22 floors leave hairline seams, and with nothing
  under them the seams are black and glitter. Give them a plain overlay of their own colour underneath.
- **`Math.random` breaks everything.** A recipe runs again on every load and in every script. Use
  `createRng` and `createNoise`. If you add a call to `rng()` early on, every later roll changes, and
  so does the map. Anything new goes on a seed of its own.
- **Bridges draw above the plane**: their deck is on level 1 with a flag on level 1's tiles. That flag makes level 1 the ground
  there, and level 0's locs and floor aren't drawn at all. For something that stands on the ground with more on top, use
  `TILE_SHOWN`, which draws level 1 as well.
- **A tile holds one wall a level.** The scene keeps the last of a type 0 to 3 on a tile, so two faces on a tile need a type 2, or
  a tile of their own. It's why a wall's faces stand on the tiles beside its walkway.
- **Anything on level 1 needs `TILE_SHOWN` on its tile**, or it won't draw. Yanille's are unflagged in the cache.
- **Round buildings have empty corners.** Only what's inside the walls is reserved, so `fitsBuilding` looks at plots as well.
- **Painting hides a road that runs into something.** Roads aren't painted on `Ground.footprint`, so a road through a building
  shows as two roads stopping at its walls, and a check of what's painted finds nothing. That's what `RoadNetwork.clipped` is for.
- **Ruins have no floor.** A floor with half its walls gone is a slab with nothing round it.
- **Doors are closed, or open and turned.** A stamped building with a door has a sealed inside unless you drop
  the door. An open door stands on another side of its tile, off the wall, so don't read a way out from a door's
  rotation: `findExits` goes by the gap. Curtains are doors too.
- **"Indoors" means walls on at least 3 of 4 sides**, straight lines out from the tile (`getInsideTiles`), so
  that a doorway doesn't let the outside in.
- **Cuts clip things.** A wall on a rectangle's edge can belong to the tile outside it. `check-prefabs.ts` finds
  that. Bits of fence or a neighbouring building in the rectangle come along as stray walls, which it doesn't
  find, so look at the gallery.
- **A bridge's deck and fence gap are 2 tiles wide, centred on a line of tile corners**, not on a tile's middle.
  Run a road down that line with a half width of 1 to 1.3 and it fills the gap with its edges on the tiles.
  `check-maps.ts` holds generated bridges to this. A river where the road can't run straight off both ends for
  6 tiles past the stamp gets a ford instead.
- **Roads have an overlay down the middle of a soft underlay.** Underlays blend over 11 tiles, which hides the
  tile grid but can't be narrow, so an underlay alone is a wide faint stain, not a road. An overlay alone has
  a hard edge. Together the stain takes the contrast out of the edge. It needs ground with some colour in it:
  on grey or white snow any tint blends into a pastel halo, so snow's trail is the snow, with no stain.
- **Overlay edges are always faceted.** They can only bend at corners and side middles, so a curve is a
  chain of short straight lines. Keep curves big and contrast low. Nothing makes them truly round.
- **ScapeRune maps draw smooth ground** (`setSmoothTerrain`, in `GameClient`): colours run across tiles rather than
  filling each one flat. Maps from the real world don't, so ours look softer than theirs.
- **Keep noise big on edges.** A field's edge is only as smooth as the field: use `createNoise(seed, 1)` or
  `2` with features at least a dozen tiles across, and `smoothField` it. Bumps under about 3 tiles can't draw.
- **Squares must be free.** Nothing in the cache uses x 70-99, y 66-199, and the map manager stops at x 100,
  y 200. Each recipe needs its own, and nothing checks that: see `devMaps.ts` and each map's `mapX`, `mapY`. The
  shipped maps have Hallowed Night at x 72-76, y 72-76, the Sisterhood Sanctuary at x 78-80, y 72-74, the Owl's Court at
  x 82-84, y 76-78 and the Tombs of Amascut (and Beneath Cursed Sands, the same squares) at x 86-93, y 66-69. The
  map generator's screen, and scripts given settings, have x 70-99 from y 134 on.
- **A loc on a scene's outermost tile is skipped.** It doesn't matter inside a grid, but don't stand
  anything on the outer edge of one.
- **Updating the game's cache can change a prefab**, because a prefab is coordinates into the real world.
  Check them when `GAME_CACHE_NAME` changes.
- **Browser memory:** enemies bake per map whatever you do, and filtering the base bake saved nothing measurable when
  three maps were built in October 2026, so expect 1.85-2 GB at peak with or without it.
- **`paintField` and `ground.place` reserve tiles,** so a later `isClear` quietly drops whatever you meant to put there,
  and trees stop fitting round decor. Unpainted paths aren't reserved, so trees grow on them.
- **Fields painted separately leave a seam along their join.** A tile holds one overlay: merge them into one field first.
- **"Sector index id mismatch" in the browser** means an aborted cache download, usually Vite's first-run
  reload. Delete the browser profile and try again.

### Shipping a map

Hallowed Night (`maps/hallowedNight.ts`) is the worked example, and the Sisterhood Sanctuary
(`maps/sisterhoodSanctuary.ts`, Phosani's Nightmare's one square of dream floor in the Sanctuary's chamber)
the small one: it builds without the cache, as its test shows, since it stamps no prefabs and says which
of its locs block. It's also the one map built from a real place's own squares: `scripts/cache/dump-square.ts`
lists what a map square is made of, level by level (the Sanctuary's floor is on level 1 of 59,152; her dream's
arena is square 60,155), and `loc-sheet.ts` and `model-bounds.ts` then say what each loc is. It's a boss
room on purpose, because the ask was the real arena, so its recipe's `allowLocs` lists `NIGHTMARE_LOCS` and the Theatre's dead it lays out. Its chamber is scenery
only, every tile of it blocked, since enemies turn up anywhere walkable within 24 tiles of the player
and a ring of scenery would strand them outside: a sealed arena needs nothing walkable past its edge. The Theatre of Blood
(`maps/theatreOfBlood.ts`) is a raid's: halls cut from real places (doors off, and in a town the one-tile props that
block, which split its streets into pieces too small for waves), and real boss rooms cut from the
cache onto pads beside them, sealed by what can be walked to from where the party's brought in
(`sealFrom`: see [A map of rooms](#a-map-of-rooms)). A raid on purpose uses raid locs, which the catalogue
keeps off dev maps, so it's a shipped map, and its recipe's `allowLocs: THEATRE_LOCS` says so. Xarpus's
room is upstairs, so it's cut with `plane: 1` (see [Prefabs](#prefabs)).

- List the recipe in `maps/shippedMaps.ts`. `getRecipe` and `check-maps` read that list. `check-maps` only picks
  up ids in it or starting `scaperune_` (but not the palette, prefabs and cliffs sheets).
- Add a real entry to `MAPS` with `scaperune: true`. That flag gives it what `dev` gives a dev map: smooth ground,
  the open world, the camera ease and collision rebuilt each time.
- `seasonal: true` keeps it out of the campaign chain and opens it from the start, and `fight` (one boss fight,
  open once another map's beaten) does the same. Without one of them, adding to `MAPS` trips the unlock chain,
  difficulty order and unique enemies tests.
- A recipe only writes a loc's id, type and rotation. To scale a model, or lift one off the ground so it floats, give a loc nothing else uses a new model
  and size, or a `height`, in `src/rs/config/loctype/LocOverrides.ts`. Check the world index first.
- A map drawn as two worlds (the Lassar Undercity and its Shadow Realm, `maps/lassarUndercity.ts`) gives its recipe a
  `twin`: a second recipe on squares of its own, installed with it and pinned in `grid-hash.ts` with it, which the game
  draws in the map's place while the party's in the other world (`MapDef.twin`, `MapManager.twin`). Only the map's own
  collision is used, so build the twin from the same cut, its locs off where the map's twins are.
- A boss fight on a shipped map's own ground (Awakened Vardorvis in the Stranglewood, the Awakened Whisperer in the
  Lassar Undercity) is a `MapDef` of its own with the map's `arena`; name it in that recipe's `fights`, or the game
  (`getRecipe`, `installRecipe`) and the slim cache won't find the recipe for the fight's id and draw nothing there.
- A map whose rule reads places off it (Ghorrock's braziers, vents, ice pools and the statues that hide you from the
  Duke's gaze, `maps/ghorrock.ts`) exports them in grid tiles, and the content turns them into world tiles for the rule
  (`ColdRuleDef`) and the `MapDef`'s `features`. What the game draws in their place (the braziers, which it lights and
  puts out) is blocked in the grid and handed on as `standIns`, so `view-weight.ts` counts it. Its ice is painted with
  an overlay here and given to the sim as an effect mask from the same shapes (`core/world/EffectMask.ts`).
- A boss room cut from the cache and widened (the Awakened Duke's, `maps/dukesRoom.ts`) moves the cut's locs as it
  lays them (its side walls and what's along them out, its south rocks down), paints the cache's border floor where
  the room's grown, and clears `TILE_BLOCKED` on what was under the old walls. A cut from a square with levels above
  its ground floor can mark some of its tiles as bridges there (level 1's flags): clear the upper levels' flags, or
  the room's collision has holes no one can see. A boss that never moves and sits on blocked ground (his alcove)
  needs its own tiles open, or `findFreeSpot` moves it into the room; he's solid himself.
- A cut whose real ground is mostly blocked (the Scar's sea of sludge, `maps/scar.ts`) can be drained: take its
  overlay off what's to be walked, clear `TILE_BLOCKED`, then paint it back where it's wanted with `paintField`. Mind
  what lay on it: the sludge's ripples are floor decoration that only reads on sludge. An island's raised rim may be a
  level of its own (a bridge's deck in the map's terms): take off all of it that's joined, not a circle of it, or
  stubs of rim stand about; check-maps holds the cache's bridges to being roads, so cover any left with
  `closedRoads`. Paint the sludge back over the islands' bare floor too, or each island stands on squares of its own
  floor. Masses built of thousands of one-tile pieces (the Scar's brain) are hollowed by depth from their own edge,
  wherever it faces, never from what's walked: a hollow that follows the walked ground leaves walls with nothing
  behind them. What's past the depth shows the cache's floor under it (the brain's is hidden, so black, as its
  filler is). Thinning a wall's pieces at random leaves holes and stubs; draw them lighter instead
  (`MODEL_SIMPLIFY` in `LocOverrides.ts`, which `view-weight.ts` counts too).
- `bossArena` on the `MapDef` gives a phased boss a square of its own. The player's brought to its middle and
  can't leave while the boss is up. Without it, her totems are in the corners of the whole map.
- Blending brown soil into blue ground goes through green, so give a soil underlay low saturation. Thin overlay
  lines vanish through `smoothField`.
- Shipped maps aren't held to the look rules, and get the catalogue (ban list minus `allowLocs`, kit pieces, blood and
  foam) as warnings, not failures. They must stay byte for byte: Hallowed Night imports `Ground`, `collision`, `format`,
  `mapBuild`, `noise`, `prefabs` and `recipe`. Each shipped map's hash is pinned in `scripts/scaperune/grid-hash.ts`
  (`SHIPPED_HASHES`). Run `CHECK=1 bun run tsx scripts/scaperune/grid-hash.ts` to build every
  shipped map and compare its hash. `bun run test:maps` runs this check (a plain `bun run test` doesn't).
  If you change a shipped map, update its hash and explain why in the pull request. Add a hash for
  each new shipped map too. A missing hash fails the check.
- A recipe whose test builds without the cache keeps a table of its locs' sizes and which are walked through (the
  Sanctuary's and the Owl's Court's `SOLID_LOCS` and `WALK_THROUGH`). `scripts/scaperune/check-solid-locs.ts` holds those
  tables to the cache, and a cache-gated test in each map's test runs it, so a cache update that changes a size or a clip
  fails a test instead of shipping a wrong map. A new map with a table like it goes in the script's `TABLES`.
- **Phones choke on the heaviest view, not the map's total.** `view-weight.ts` sums the triangles of the locs the play
  camera draws from every arena tile (18 tiles away, or 15 with `PHONE=1`, culled in 8-tile cells as the renderer does),
  prints the heaviest views with what's heaviest in each, and draws a heat map. On `phosani` the north edge is the heaviest,
  at about 1.7 times the median on a desktop, mostly the Sanctuary's wall (37746) and the dead mercenaries (32754). Thin out
  what tops that list before thinning the whole map.

### The slim cache

The hosted game's cache only holds what the game reads, found by loading every map in `ALL_MAPS`
(`scripts/cache/slim-cache.ts`). Don't run `bun run slim-cache` as part of a change: it's done when
deploying. To ship a map:

- **A fixed map or a fixed seed:** make it a real entry in `ALL_MAPS`, and say so in the pull request.
  `slim-cache.ts` installs ScapeRune maps as it goes, so their locs, textures and prefab sources get kept.
- **A different seed each run:** seeds read different things, so a sample map isn't enough. Put
  `PALETTE_RECIPE` in `ALL_MAPS` too, as it holds all the generator can use, and hide it from the map list.
  Run-time seeds also need a way to pass the seed in (recipes are a fixed list today).
- **If you add to `BIOMES` or `PREFABS`,** run `bun run tsx scripts/scaperune/check-palette.ts`.
  It fails if a generated map reads something the palette doesn't. `palette.ts` picks up new
  entries by itself.

Terrain and locs live in our code, so they add nothing to the slim cache. Only what they point at does.

Minimap images aren't saved for custom squares, since a saved image is found by square alone and would
outlive a change to the map.
