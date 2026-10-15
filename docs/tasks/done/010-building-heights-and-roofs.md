---
status: done
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 009]
roadmap: Phase 2 · The shape
---

# 010 · Every building's real height and roof, measured from LiDAR

## Why

The skyline and the street's outline are what a local recognises first, and today most heights
are guesses: about 30% of buildings have a height, floors or roof shape in OSM, and the rest get
a random height for their kind (flats 12.6–21.6 m, houses 6.4 or 9.4 m) and a random roof. An
untagged building of 220–1,400 m² becomes a block of 4–7 floors, which is the largest
exaggeration in the data. DGT's 2025 LiDAR measures every roof to about 10 cm.

## What

Today (`tools/world.mjs:121-146`): height from `height`, else `building:levels` × 3 + 0.6,
else random by kind; roof from `roof:shape` (flat, gabled, hipped), else random by kind. Roof
colour is a fixed set of terracotta tones in party-kart; OSM's `roof:colour` (409 buildings) and
`roof:material` (276) are ignored. party-kart draws a hipped or gabled roof only when the
footprint fills more than 72% of its rectangle, at a fixed 27° pitch (`city.ts`,
`buildBuildings`).

Steps:

1. **Heights:** for each footprint, the LiDAR's building points (class 6 in the LAZ) or the
   surface model (MDS) minus the terrain (MDT, task 009) inside it. Take the eaves' height (a
   low percentile of the roof points) and the ridge's (the highest), not the mean.
   Store both in the tiles (`h` as the eaves, a new `ridge`).
2. **Roofs:** from the building points' normals: flat, gabled, hipped, mansard, or several
   parts. Record the ridge's direction and the pitch. Where a building has distinct parts
   (a tower on a block, a stepped terrace), split it into parts (`building:part` in OSM has
   817 in the municipality, to start from).
3. **Roof colour and material:** from the orthophoto (task 005) inside each footprint, taking
   the median colour; terracotta, grey slate, flat gravel, metal, solar panels. Then OSM's
   `roof:colour` where it's tagged.
4. **Check it** against OSM's `height` (63 tagged) and `building:levels` (5,011): the floors
   implied by the LiDAR's height, the outliers listed. Large differences are often a wrong OSM
   tag; the world keeps the LiDAR's. Nobody will fix them in OSM (task 006's answer), so the
   list stays in Notes.
5. **Draw it** in party-kart: the roof's real shape, direction and pitch, its colour, eaves
   at the measured height. The kind (house, flats) follows the measured height, not a guess.
6. **Floors** for the facades (task 017): the height divided by the type's floor height, so
   windows line up with the real storeys.

## Read first

- `tools/world.mjs:121-146` (kind, height, roof, colour), `index.d.ts` (`Building`).
- `../party-kart/src/render/city.ts` (`buildBuildings`), `textures.ts` (roofs).
- Tasks 005 (the LiDAR) and 009 (the terrain under it).

## Done when

- [x] Every building in the LiDAR's cover has a measured height and roof, and the tiles say
  which are measured and which guessed.
  > 12,397 of the map's 13,019 measured, the 622 the LiDAR didn't see guessed (Notes); the tiles'
  > `measured` flag: 34,071 of 34,856 buildings and parts on all 140 tiles (braga-map 1.7.0,
  > counted 2026-10-15).
- [x] A check prints the difference between the LiDAR's heights and OSM's `height` and floors,
  with the outliers.
  > `node tools/heights.mjs`, run again 2026-10-15: the floors, the outliers, `roof:shape` the
  > same as the LiDAR's for 614 of 764, `roof:colour` for 310 of 372.
- [ ] The route's viewpoints, and the skyline seen from the Picoto, score higher than at the
  baseline.
  > The route's half is true: on the round "Todas as ruas" (`2026-10-15-task035`, version 3 of "Braga real"), which carries this task's
  work with 035's, the owner's marks on its 25 viewpoints
  > average 3.76 against the baseline's 2.56, 19 higher and one lower (`liberdade` 2→1: the map's
  > carriageway, task 026). The skyline from the Picoto has no viewpoint, so it wasn't scored: the
  > owner asked to finish without it (2026-10-15).
- [x] party-kart's tests pass and the budget (task 004) holds.
  > At its release (party-kart `7a0f70a`, braga-map 1.4.0): `npm test` 23 of 23, `npm run check`
  > clean, and the budget held (Notes). The budget became a guide since (decision 017).

## Out of scope

- Footprints the map lacks: task 011. Facades: task 017. Landmarks: task 021.

## Notes

- From task 005: DGT also publishes `MAPACONST-2024`, building outlines made from the LiDAR (every
  construction over 10 m²), in the same CDD; not fetched yet (`docs/SOURCES.md`). At the Praça,
  OpenStreetMap lines up with DGT's orthophoto within about 0.5 m (seen at one fountain only):
  measure it more widely before putting OSM's footprints on the LiDAR's heights.

### Started 2026-10-14

- **Checked first:** DGT's national topographic map (CartTop, with each building's height) still
  isn't on its open data page, and `MAPACONST-2024` is outlines only (one gpkg for the country), so
  the heights come from the point cloud, as planned.
- **Done, in braga-map (uncommitted):** `fetch.mjs` gets the point cloud and the orthophoto over the
  whole map now (42 tiles: 5.6 GB of LAZ, 22 more photos). `tools/roofs.mjs` boils each LAZ tile
  down once to 50 cm cells of the building points' tops (`.cache/dgt/roofs/`, about 15 s a tile),
  then measures each of the map's footprints: where its roof steps by 2 m or more along at least
  3 m, its parts (cut by straight lines in the building's frame, into any number of pieces, none
  under 20 m², flat neighbours at the same height merged back); for each part the eaves and ridge,
  the shape (flat, gabled, hipped at either end or both, skillion), the way it runs and the pitch;
  a pitched roof over an L or a T cut into rectangles at its inner corners; the colour from the
  orthophoto. Into `.cache/roofs.json`, which `world.mjs` reads (it stops without it).
  `tools/heights.mjs` is the check. `test/roofs.test.js` (made-up roofs: gabled, hipped, half a
  semi-detached pair, a tower on a block, an L, a skillion) and `test/heights.test.js` (the tiles
  carry each roof as measured; the floors agree; the outlines' offset). README, and the credit
  (`map().credit` names the heights and roofs too). `npm test`: 26 of 26.
- **Done, in party-kart (uncommitted, `package.json` on `file:../braga-map`):** `src/render/roofs.ts`
  (a roof is the lowest of a few planes; its faces, and the walls' tops under it, so gables come by
  themselves; `test/roofs.test.ts`), and `city.ts`'s buildings: each roof as measured, over its
  rectangle with its eaves overhanging where the footprint nearly fills it, else cut to the
  footprint; the walls' windows in rows of the real storeys; sheets drawn as grey tiles (no new
  texture); flat roofs tinted their colour. `npm test` 23 of 23, `npm run check` clean, the lap
  unchanged (`laps 265.6, 263.5 s; respawns 0; longest air 0.00 s; top 217 km/h; wall hits 0`).
- **The tiles' format changed** (a new minor version of braga-map at least): a building is
  `[n, what, roof, h, y, rise, ...points]`, its kind, colour, roof, hipped ends, material and flags
  packed in one number, its pitch, direction and roof colour in another. The direction is one of
  four ways from the footprint's own axis, which `index.js` works out with the same exact
  arithmetic as `osm.mjs` (`rectAxis`); `roofs.mjs` measures in that same frame, so a roof runs
  along the walls as drawn. A roof's colour is one of 127 (k-means over the measured ones,
  `map().roofColors`); `floors` comes from `h` and `map().storey`.
- **What it measured:** 12,397 of the map's 13,019 buildings (95%), in 18,734 parts (2,940 split);
  622 not seen (cover under 35%: built after July 2025, under a tree, underground, or a shed the
  LiDAR doesn't class as building), which stay guessed. Main roofs: flat 4,802, gabled 4,629,
  hipped 2,423, skillion 543. Guessed roofs now take the measured median pitch, 20°.
- **OpenStreetMap against the LiDAR, measured widely:** the outlines that best fit the LiDAR's
  buildings are shifted 0.6 m (the median over 311 squares of 250 m), under 1.3 m in 9 of 10,
  2.2 m at most; shifted, they cover the LiDAR's buildings 93% instead of 92%. `roofs.mjs` reads
  the LiDAR where each square's shift says; the outlines stay where they are (task 011). Some
  outlines overlap (a building mapped inside another, a part mapped as a building): each is
  measured over what it covers, and the world draws both. That's task 011's too.
- **The point cloud's own colours aren't the roofs':** much paler and greyer than the photo's (a
  fitted colour matrix explains 53% of the red, 76% of the blue, on 307 low roofs). So the colour
  is the orthophoto's, as the task said, from the middle of each roof, away from its edge by a
  fifth of its height (the photo leans tall roofs off their footprints), its lighter half (the
  shade left out). OSM's `roof:colour` is used only where the LiDAR didn't see the roof: the photo
  is the 2025 roof. The photo's terracotta is pale, about (160, 130, 125), seen through 5 km of
  haze; party-kart deepens it (`seenUpClose`: warm colours three times their colour, cool ones
  half, all 15% darker), a guess for the scorecard to judge.
- **The check** (`node tools/heights.mjs`): OSM's `building:levels` (3,630 measured) give a storey
  of 2.91 m plus 1.15 m, and the LiDAR's eaves give the map's count within one storey for 80%
  (`world.mjs` uses 2.9 m and 1.2 m). `roof:shape` agrees for 614 of 764, `roof:colour`
  (terracotta or grey) for 310 of 372, and `height` (24 tagged and seen) is 1.5 m under the
  LiDAR's top, the median. The Tourigalo's restaurant measures flat, its eaves 4.6 m up (the photos
  had said one storey, 5.2 m): `SEEN` is gone.
- **The outliers** (nobody will fix them in OSM; the world keeps the LiDAR's). Floors two or more
  off, the worst: ways 824284420 (the map 13, the LiDAR 3.8 storeys), 825454092 (10, 1.8),
  825455690 (2, 9.6), 319277632, -33, -37, -38 and -39 (8 each, under one: planned and not built in
  July 2025, or pieces of a multipolygon), 210197964 (1, 8.4), 474192918, 894977455, -456, -457 and
  -462 (1, about 8: penthouses, or blocks tagged a storey), 570699260 (7, 0.4), 473336084,
  825473237, 1141072177, 483134486 and -488 (1, about 7), 570791233 (2, 7.7), 319277602, -603 and
  -616 (8, about 2.3), 597012661 (1, 6.5); 192 in all. `height` off by more than 3 m: ways
  1461304288 (8 m, the LiDAR 13.9), 828265603 (30, 25.1), 1559947667 (9, 13.7), 570672761 (4,
  8.4), 1324078577 (21, 25.1), 504812463 to -465 (6, about 2), 1026230558 (21, 24.4).
- **The budget** (task 004), all 29 viewpoints, against party-kart as committed (`8946d3d`,
  braga-map 1.3.0), shot the same day: triangles at most, High 1.075 → 1.061 M, Medium 0.892 →
  0.877 M, Low 0.537 → 0.549 M (budget 1.1, 0.9, 0.55); draw calls at most 178, 178, 162 (200, 200,
  180); textures 94, 61, 45 MB, unchanged (95, 60, 45). Rounds `shots/2026-10-14-task010/` and
  `-task010-alameda/` (one shot timed out), and `-base-medium/`. To fit, the city draws less for
  the same picture: a wall hidden by the building behind it isn't drawn, flats' ground floors are
  in their walls' material (no second quad), a gable is one polygon, a roof cut to its footprint is
  cut to convex pieces of it, and buildings more than 150 m from the road cast no shadow (the
  sun's shadows are only drawn 70 m round the camera). Low has 1k triangles to spare.
- **Medium's textures were over before this task:** 61 MB on `8946d3d` against a budget of 60
  (since tasks 028–030). Drafted as task 031.
- **The download:** the track's 48 tiles grow 7 KB gzipped (1,193,837 → 1,200,980 bytes as
  `world.mjs` writes them). The buildings take 77 KB more, paid for by packing the ground better
  (each height less a guess between its neighbours, lossless: 708 → 637 KB) and each
  four-cornered outline's last corner as what's left of a parallelogram. `node
  scripts/download.mjs`: 1.42 MB on `8946d3d`, 1.43 MB now (the tiles 1.12 → 1.13, the game 0.29 →
  0.30, mostly another session's sound). As the live site sends it, about 1.49 MB of the 1.5.
- **A party-kart gotcha:** `npm install --install-links ../braga-map` doesn't replace the installed
  copy while braga-map's version is unchanged: delete `node_modules/braga-map` first. (Shots taken
  before that ran on a world a few lossless packings older, with the same buildings.)
- **Not modelled:** mansard roofs (they come out hipped or flat), a big shed's several ridges (one
  roof, its eaves no lower than the lowest the LiDAR saw), dormers and chimneys (a step under
  20 m² is the roof's). Buildings over 150 m from the road cast no shadows, where no camera could
  see them.
- **Released** on 2026-10-14, at the owner's word: braga-map `5725bc5`, tagged `v1.4.0`;
  party-kart `7a0f70a` on it, deployed from a clean checkout of that commit (another session's
  uncommitted sound work stayed out), live at https://pedrohenriques15.github.io/party-kart/. The
  peer id prefix is unchanged: the track and the messages are the same. The owner sees no
  difference in the shots: from the street, roofs barely show, and the heights along the route
  were mostly right already. The map page (https://claude.ai/artifact/UdwdhZYkR76J5xyPcRUHUb,
  version 6) now shows every building coloured by its measured height, and its storeys, eaves,
  ridge and roof under the pointer.
- **Left for `/task finish`:** the round on the scorecard. The skyline seen from the Picoto has no
  viewpoint (`refs/viewpoints.json` looks at the Sameiro from the Picoto road, not at the city):
  one from a photo at the Picoto's lookout, as task 001 sets them, or a before-and-after pair for
  the owner. braga-map's release, and party-kart's `package.json` back on its tag. `SOURCES.md`
  (the point cloud and the orthophoto over the whole map, and what they're used for),
  `ROADMAP.md` and a `DECISIONS.md` entry (the buildings are the LiDAR's; the tiles' format):
  another session has uncommitted changes in all three today, so they weren't touched.
- **Finished on 2026-10-15,** at the owner's word, on their marks for the round "Todas as ruas" (`2026-10-15-task035`, version 3 of "Braga real"), which carries this task's
  work with 035's.
  `docs/SOURCES.md` says the point cloud and the orthophoto are fetched over the whole map, and
  what for; the roadmap's status says the buildings are measured; decision 025 records that the
  buildings and the levels are the LiDAR's, and the tiles' format. Left: a viewpoint for the
  skyline from the Picoto (a photo from its lookout, as task 001 sets them), when someone wants the
  skyline scored; `bom-jesus`, the other skyline view, fell 3→2 for its pavement (task 044).
