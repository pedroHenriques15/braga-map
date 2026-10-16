---
status: doing
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 007]
roadmap: Phase 3 · Surfaces and colours
---

# 016 · The ground from the aerial photos: grass, paving, parking and soil where they are

## Why

Today the ground is painted from OSM's land use: one colour per kind of area (urban, park,
farm…) with grain multiplied in. So a car park, a lawn, a dirt lot and a paved square inside one
"urban" area are all the same beige. DGT's 2025 orthophoto shows what's really on every 25 cm of
ground, and its near-infrared band tells plants from paint.

## What

Today (`../party-kart/src/render/city.ts`, `paintGround`): one canvas over the box, 1 m a pixel
on High, 1.4 on Medium, 2 on Low (at most 4,096 px), land colours per use (`LAND`), roads and
pavements stroked on top, and grain. In the data, ground areas keep their holes filled
(`tools/world.mjs:55`): a clearing in a wood is painted as wood.

1. **Classify the ground** from the orthophoto's RGB and near-infrared (task 005), at 50 cm,
   for the track's box and the shooter's area, into: asphalt, light paving, setts, grass, trees'
   shade, bare soil, gravel, water, and roof (masked by the buildings). The near-infrared's
   NDVI separates plants; the LiDAR's heights separate a roof or a tree from the ground under
   it. Store the classes in the tiles, compressed.
2. **Choose how to draw it** from a test tile: draw one tile with the route's viewpoints in
   it both A and B (C too if they're close), shoot its viewpoints and post them as a round on
   the scorecard; the owner picks (the owner's answer). A is expected to win.
   - **A.** The classes, each drawn with its own texture (a photo of that surface, from task
     008's close-ups, found online), tinted by the orthophoto's local colour. No cars or
     shadows baked in; sharp up close.
   - **B.** The orthophoto itself, draped, with cars and shadows in it. Real at a distance,
     blurry and wrong up close.
   - **C.** A mix: A near the road, B beyond 100 m.
3. **Draw it** in party-kart through task 007's pipeline, measured against the budget (task 004, decision 017).
4. **Fix the holes:** inner rings of multipolygons are holes (`world.mjs:55`).
5. **Parking:** the car parks the orthophoto shows, with their bay lines (task 018), and where
   it shows parked cars along a kerb, the kerb's parking for task 020.

## Questions

- [x] A, B or C? Recommendation: decide from a test tile on the scorecard; A is the likely
  winner at kart height and on foot.
  > As recommended (2026-10-14): decide from a test tile on the scorecard, A expected.
  > 2026-10-16: **A**, from the test tile (Fujacal's seven viewpoints, A, B and C beside the photos
  > and the round before, https://claude.ai/artifact/8X9eZGFoqFEN4AugZW6zwr). The round goes on the
  > scorecard once A is drawn over every tile, all 29 viewpoints against the round open then (the
  > scorecard takes one shot a viewpoint a round, so the three were set side by side on a page of
  > their own instead).

## Read first

- `../party-kart/src/render/city.ts` (`paintGround`, `LAND`, `groundMaterial`).
- `tools/world.mjs` (areas, `:55`), `tools/osm.mjs` (`AREA_OF`).
- Tasks 005 and 007.
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, what every surface is, seen on foot:
  the lawns, gardens, the pitch and the waste ground by the river.

## Done when

- [ ] The ground classes are in the tiles for the track's box and the shooter's area.
- [ ] The way to draw it is chosen from a test, and recorded as a decision.
- [ ] The route's viewpoints score higher than the round before, and none lower.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- Road markings and pavements' patterns: task 018. Trees: task 019.

## Notes

- From task 005: `.cache/dgt/ortho/` has the colour orthophoto only (`Ortos2025-RGB`, JPEG, 25
  cm), read by `tools/dgt.mjs`'s `ortho(box)`. The near-infrared is the WMS's `Ortos2025-IRG` layer:
  add it to `fetch.mjs` the same way. The point cloud's points carry near-infrared too.
- From task 007 (2026-10-15): the pipeline is there. `tools/textures.mjs` makes a tile's
  orthophoto as a ground texture (`refs/textures.json`, `kind: 'ground'`; `x-1z1`, Fujacal, is
  made), and party-kart draws it with `?photos` in the land's shader (`groundMaterial`, one tile
  for now: more need a texture each or an array). That is option B, to set beside A. What 007
  found of B: it reads paler than the painted ground under the game's light; the buildings lean in
  the photo, so a roof shows on the ground beside a building, offset; and its shadows couldn't be
  lifted (007's notes say what was tried). A ground tile is 1.2 MB to download at all three levels,
  0.9 MB at High, and 2.7 MB on a phone's graphics card at High.
- From task 013's split (2026-10-15): what the ground is inside a plot, between a building and the
  street (a front garden's lawn, a paved yard, a driveway, parking), is this task's; 013 keeps the
  walls, fences, gates, railings and hedges round it.

### Started 2026-10-16

- **Where the work is:** in worktrees, as another session had uncommitted work on task 013 in both
  repositories' own folders: `../braga-map-016` and `../party-kart-016`, each on a branch
  `task-016`, the cache linked into the first and party-kart's `shots/` into the second. party-kart's
  `package.json` points at `file:../braga-map-016` while it's tested; it goes back to a tag when
  braga-map's version is cut. Both touch files 013 touches (`tools/fetch.mjs`, `tools/world.mjs`,
  `index.js`, `index.d.ts`, every tile; party-kart's `src/render/city.ts`): when both land,
  `npm run world` again after merging, as the tiles are made, not edited.
- **The near-infrared:** `node tools/fetch.mjs nir`, the WMS's `Ortos2025-IRG` on the LiDAR's 42
  tiles, 113 MB, into `.cache/dgt/ortho-irg/` (near-infrared as red, red as green, green as blue).
  `dgt.mjs`'s `orthoGrid(box, step)` reads both photos on the map's grid.
- **What tells the ground apart** (measured over five open-world tiles, the map's
  surfaces as labels, cells with nothing over them): the photo's colour barely does. Sunlit asphalt
  is a light grey in the orthophoto (brightness 134 of 255 at the median), setts 149, pavements
  157, and the shadows overlap all of them. The **LiDAR's intensity** (the laser's echo off the
  ground, in the point cloud) does, in the sun and in a shadow alike: asphalt 5.2 thousand at the
  median (4.6–6.3 between the quartiles), setts 7.2, pavements 10, paved paths 17, grass 19, parks
  20, bare soil 25 (a dry field in Fujacal). Concrete yards echo as setts do (about 8), so setts are
  only where the map says a street or a path is setts. NDVI tells plants (lawns 0.13–0.28, a wood
  0.41) from paint; bare soil is warm in the photo ((r − b)/brightness 0.26). Under a tree's crown
  the echo off the ground is weaker (the leaves take some), so a lawn there echoes as asphalt: the
  ground under a crown is what's round it.
- **The roofs lean in the photo:** 1.5–2.5 m off the LiDAR's outlines beside the five-storey blocks
  in Fujacal. Classing hard ground by its echo, not its colour, keeps a leaning roof off the ground.
- **`tools/cover.mjs`** classes the 48 tiles under the track's box (the shooter's area in it) every
  50 cm, in about 10 minutes the first time (each of DGT's point cloud tiles boiled down once into
  `.cache/dgt/cover/`, 15 s each) and 2.5 minutes after. Fujacal's tile: asphalt 16%, paving 22%,
  setts 3%, grass 22%, soil 3%, roof 33%, 14% under crowns. Into `world/cover/<tile>/`: the classes
  as a lossless WebP at High (50 cm), Medium (1 m) and Low (2 m), 57–95, 21–37 and 7–13 KB (as a grey
  PNG a fifth more, as an RGB one a half more); and each
  kind's own colour over the tile on a grid of its own (in each 4 m square, 5 m on Medium and 10 m on
  Low, the kind's median where the photo shows it in the sun, filled in under shadows, cars and
  crowns from the same kind round it), so one kind's colour never runs into the next's where they
  meet, and the crowns' as a ninth grid: a WebP each, 13–24, 9–19 and 4–7 KB. 9.5 MB in all over the
  48 tiles, the parked cars' files with them. `world.groundCover` lists them with the tiles loaded, `map().groundKinds` the kinds, each
  with its photo. `--check` writes the photo, the classes and the colour side by side into
  `.cache/cover/<tile>.png`, to check by eye: done on Fujacal's tile, the south edge and Falperra's
  wood. (A colour image at 1 m, as KTX2, came first: 63–75 KB on High, and it smeared one kind's
  colour into the next over a metre. As PNG, the grids took 141 KB on High; as WebP, 21.)
- **In a wood or a park** the floor echoes weakly in its shade, as asphalt does: there (the map's
  forest, scrub, park, grass and farm areas), a weak echo is bare soil, and a cell green in the
  near-infrared with a weak echo takes the ground round it. Falperra's wood came out asphalt under
  its crowns before.
- **Past the map's edge** (z over 2150, the south of the box's last row of tiles) the world has no
  buildings, so what the LiDAR sees over 2.5 m that isn't a tree is a roof there; on the map, the
  ground round it (a carport, a kiosk).
- **The kinds' photos:** six seamless CC0 textures from Poly Haven, at their real size
  (`refs/textures.json`, `kind: 'surface'`; `textures.mjs` fetches each record and its colour map):
  asphalt `asphalt_04` (4 m, weathered and pale, as Braga's is), paving `concrete_floor_01`, setts
  `cobblestone_floor_03`, grass `grass_ground`, soil `dirt_floor`, gravel `gravel_floor_02` (2–2.5
  m). 1024 px on High, about 230 KB each; 1.36 MB for the six, once. Task 008's close-ups of the
  calçada and setts are street-level photos (perspective, not seamless): Braga's own pavement is
  018's. Credited in `world/textures.js`'s `CREDITS` (Poly Haven, CC0, its authors).
- **Holes (step 4):** a multipolygon's inner rings are its holes now (`world.mjs`, `osm.mjs`'s
  `memberRings`, which `build.mjs` already used; 14 areas round the open world have them, the
  Parque Urbano do Picoto among them); `Area.holes` in the tiles and `index.js`; party-kart paints
  them even-odd and its ambience skips them. The tiles changed in their areas, and on two tiles in
  their paths and streets: the streets (streets.mjs) keep off the water, and two of the map's water
  multipolygons by the open world (over x0z1 and x2z0), each mapped in two or three ways, came to it
  as those ways apart, not as the one whole ring they make (with them whole, x2z0 has two handrails
  more).
- **Car parks and parked cars (step 5):** OpenStreetMap's 1,182 `amenity=parking` in the box (447
  car parks on the ground, 729 bays and lanes along streets), the world's areas of kind `parking`
  (but those in a building). They were fetched first as `node tools/fetch.mjs parking`; task 013
  fetches the same car parks with its `barriers`, so after the merge the world reads them there. The parked cars are the LiDAR's (July
  2025): what stands 0.9–2.4 m over the ground and isn't a plant or in a building, in pieces split
  into cars by their size (end to end where a piece is a car wide, side by side where it's a car
  long), each `kerb`, `park` or `other`; a car in a lane's middle was driving and is left out.
  41,683 over the box: 18,924 along kerbs, 12,199 in car parks, 10,560 elsewhere (Fujacal's tile 584,
  231 and 208). Seen over the photo they stand where its parked cars do; a low wall or hedge along a
  building's front can come out as cars in a row, and cars under a crown aren't seen. A JSON file a
  tile (`cars.json`, its URL in the tile's index), which a game fetches when it draws them: in the
  index they were 1.15 MB over the 48 tiles, which every game would download with its tiles. Notes
  added to 018 (the bays) and 020 (the parked cars).
- **The test (step 2):** party-kart drew Fujacal's tile three ways with `?ground=a|b|c` (taken out
  again once the owner picked), shot at the tile's seven viewpoints (`shots/2026-10-16-task016-a`,
  `-b`, `-c`) and set beside the photos and the round before for the owner on a page of its own
  (https://claude.ai/artifact/8X9eZGFoqFEN4AugZW6zwr): the scorecard takes one shot a viewpoint a
  round, and only the newest round takes marks, so it can't hold three to choose from. A, B and C
  alike took the orthophoto's colour to 65% in linear light (as it comes it reads almost white under
  the game's light). On High at those viewpoints, against the round before (97 MB of textures, 5.2
  s to build): A 106 MB, B 103, C 111; draw calls and triangles the same. The owner picked A.
- **B is gone:** the orthophoto over Fujacal's tile (`ground-x-1z1`, task 007's) is no longer made
  (1.2 MB of the package); `textures.mjs` can still make a ground texture if a game wants one.
  party-kart's `?photos` draws the ten facades only.
- **Drawn everywhere (step 3), party-kart:** `render/cover.ts` loads every tile's classes into one
  array texture (a layer a tile, two cells to a byte: 24 MB on High for the 48 tiles) and each
  kind's colour into another (a layer a tile and a kind: 27 MB on High), as a phone can: a phone's
  ETC1 can't make a compressed array, and one texture a tile would need a sampler each. A small
  texture says which layer each tile is. A tile the open world's area doesn't touch is never nearer
  the player than its edge, so its classes come at Low (2 m) whatever the level, a seventh of High's
  download. The land's shader takes each fragment's tile, the kinds of
  the four cells round it (a 50 cm cell's edge softened over half its width, so no staircase), and
  for each kind its photo (tiled at its size, divided by its mean) times its colour there. Then the
  photo's haze taken out (DGT's photo never gets darker than (30, 47, 65) in its red, green and blue:
  a blue veil that turned the woods slate under the game's own haze) and its colour toned down by
  its brightness, 1 / (1 + 2.55 L) in linear light, which takes asphalt to 62% and a wood to 87%
  (a flat 65% blackened the woods). Under a crown 15% darker (the sun's shadow is the game's own); and
  from 40 m off to 160 m, a crown's ground turns into the canopy, in the green of the trees the game
  draws, lighter or darker as the photo's canopy is: the city draws fewer trees than stand there, and
  the hills' woods read grey-brown (their floor) without it. With every tile under the land classed,
  the painted map is only a mask of where the streets are (a byte a pixel, 11.5 MB on High where the
  painting was 44 MB, and its canvas, which Chrome may also hold, is let go).
- **What it costs (task 004, decision 017),** at the 29 viewpoints against the round before
  (`shots/2026-10-16-task016/` against `2026-10-15-after050/`, minimum / median / maximum): draw
  calls and triangles the same (a few hundred triangles either way, from the trees the areas' holes
  move). Textures, as the PC holds them, 97 → 118 MB on High, 61 → 67 on Medium, 45 → 42 on Low: the
  classes 24 MB on High (6 on Medium, 1.5 on Low), the kinds' colour 27 MB (17, 4), the six photos 8.4
  MB as BC7 (a phone's ETC1 half that), and the painted map's 51 MB given back for a 12.7 MB mask.
  The city builds faster, as the land is no longer painted: 5.25 → 3.92 s on High at the median,
  5.15 → 3.55 on Medium, 4.42 → 3.10 on Low. Downloaded before you can drive, on High
  (`node scripts/download.mjs`, which now counts the files the page decodes itself): 2.33 → 6.98 MB
  gzipped, the ground's 4.5 MB of it (its classes 2.0, colour 0.95, the six photos 1.3, Basis's
  transcoder 0.25, which ?photos alone fetched before); about 2.4 MB on Medium and 1.2 on Low, from
  the files' sizes. Over the budget's guide of 1.5 MB, as the city already was (decision 017): what
  would take it down is loading only the tiles near the player (task 038).
- **Seen in the round:** the false lawns the painting put on paved ground are gone (Porfírio da
  Silva, Viriato Amaral Nunes, Conselheiro Lobato, Lobato east, Monte da Forca's waste ground). Where
  the ground really is green or brown it reads greyer than the photos taken in winter and spring: the
  orthophoto was flown from March to July, its grass drier (São João da Ponte's park is brown soil and
  leaves, grey here). The woods far off keep their green; near, the ground under a crown is its floor
  until task 019 draws the trees (the Sameiro's slope). Setts off the streets are paving (018's).
