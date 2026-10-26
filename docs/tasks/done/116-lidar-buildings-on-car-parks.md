---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-24
depends-on: [112]
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 116 · The LiDAR's "buildings" on the map's car parks: vans, lorries and shade canopies

## Why

Task 011 (decision 025) outlines the buildings OpenStreetMap lacks from the LiDAR. On the map's car
parks some of those are vehicles parked side by side, or a car park's shade canopies, which a game
draws as solid buildings, as at `capela-sao-joao` (task 112, where one was a row of vans and a
motorhome). Task 112 left that one out by hand; there are more.

## What

Today (braga-map 1.36.0, counted by worker-3 in task 112): 85 of the LiDAR's buildings stand on the
map's car parks (`amenity=parking`, kind `parking` in the areas), 66 of them under 4.6 m tall.
`tools/roofs.mjs` has a vehicle rule (a block a vehicle's size), which a row of them side by side is
too wide for.

1. **Look at them:** the 85 in the orthophoto and the point cloud (a vehicle's roof is a few
   metres long and has gaps between vehicles; a canopy is a thin roof on posts with cars under it,
   its points over a hollow; a real building has walls to the ground), and in reference photos where
   there are any. Record each kind's count in Notes.
2. **A rule:** a LiDAR building on a car park that's a row of vehicles (the gaps, the height, the
   width of one) is left out; a canopy is drawn as a canopy (a thin roof on posts, a kind of its own)
   or left out, whichever the game can draw; a real one stays. Counted over the map, a test.
3. `npm run world`; the viewpoints that see a car park shot again.

## Read first

- `tools/footprints.mjs`, `tools/roofs.mjs` (the vehicle rule), decision 025; task 112's Notes.

## Done when

- [x] The 85 looked at, each kind counted; the rule's test; no row of vehicles on a car park drawn as a
  building (107 on 1.42.0's tiles looked at and counted in Notes; `test/roofs.test.js`'s made-up
  canopies and not, `test/footprints.test.js`'s at most 40 under 4.6 m on a car park; the white rows
  that looked like vans are site cabins, which stay).
- [x] `npm test` passes; the viewpoints that see one shot again, no lower (171/171 on main's 1.44.0;
  `pascoal-fernandes` and `egidio-guimaraes`, the two with one inside their view's angle, shot before
  and after at Ultra, High and Low, `2026-10-25-before116` and `2026-10-25-after116`, on 1.42.0 and
  1.43.0: the same at Ultra and High, so no mark moves; not shot again on 1.44.0, where the same 10
  tiles change).

## Notes

- Found by worker-3 in task 112 (2026-10-24), drafted by the coordinator.
- 2026-10-25, worker-3: **looked at.** On 1.42.0's tiles, 107 of the LiDAR's buildings stand on the
  map's car parks (85 in task 112, on 1.36.0), 82 of them under 4.6 m and 13 in the open world's area.
  Each was drawn 48 m round, the 2025 orthophoto beside the LiDAR's top, and the doubtful ones again
  closer. What they are:
  - about 40 tents: rows of white or grey pyramid awnings over the bays (the big shops' car parks:
    (360-420, -1000 to -900), (1830-1880, 900-1000), (-740, 1050), (-1010, -520), (620, -860));
  - 12 pieces of solar canopies over the bays (one at (1960-2000, 500-560), one at (1960-1980,
    1040-1090), and (-265, -1818));
  - 5 long flat white awnings;
  - 2 rows of white site cabins (prefabs), along a car park's edge at (-180 to -160, 485-495) and a
    building site's at (1440-1460, -517 to -512): buildings, which stay;
  - about 10 kiosks, booths and sheds, among them three grey-roofed booths by a sandy patch at the
    big shops' car parks, (1291, -1514), (1234, -1425) and (1316, -1552), and a red one at (-1035,
    -515);
  - 19 parts of buildings beside the map's, outlines a little off them;
  - 15 whole buildings over 4.6 m (houses and blocks a car park's outline takes in).
  No row of vehicles is left among them: the vehicle rule had already left out the cars, vans and
  lorries standing alone, and the white rows that looked like vans are site cabins, close up. What
  was left as buildings were mostly canopies.
- **The rule** (`tools/roofs.mjs`, `canopyOf` and `topShape`): on a car park, under 4.6 m and not
  beside a building the map has (30% of its outline within 1.5 m of one), a "building" is left out as
  a canopy if one of these holds (decided by the session, for the owner to confirm):
  - **solar:** dark (under 140 of 255), one plane (under 20 cm off one), and tilted 10% or more or
    blue;
  - **tent:** light (160 or more), its top as bumpy as pyramids are (20 to 45 cm off a plane, or
    18 cm and 5 m long or more: a kiosk 4 m across, (-1063, 1134), is 18 cm), and sloping all over
    as their faces do (half its cells 12% or steeper): a row of site cabins is as bumpy, its flat
    tops at steps;
  - **flat:** light (175 or more), under 20 cm off a plane, and 10 m long or more.
  The games don't draw a canopy (a thin roof on posts), so it's left out rather than drawn as a
  kind of its own (the task's either); a game that draws one can take the LiDAR's back later.
  `tools/roofs.mjs` drops 30 of the LiDAR's buildings this way (its pieces of them; the world splits
  some into parts).
- **The result:**
  - Of the 107 on car parks, 43 are gone: 28 tents, 11 pieces of the solar canopies, 2 flat awnings
    and 2 pieces at a tent's end. 63 are left (the world on 1.43.0): 38 under 4.6 m (82 before), 8 in
    the open area (13). The site cabins and the booths stay.
  - Kept that are canopies: a long thin row of tents at (408, -974); one the map's car park doesn't
    take in by its middle, (2063, 420); a tent row at (1579, 1152) and the grey canopy over a car
    park's charging bays at (-959, 1876), flatter than pyramids; one at (1852, 915); a flat dark solar
    canopy at (-265, -1818); a long white one's piece at (1862, 377), under 10 m; and six small pieces
    of tents. The rule measures these otherwise than my look did.
  - `test/roofs.test.js`: made-up canopies and not (a kiosk, a row of site cabins, a house).
    `test/footprints.test.js`: at most 40 under 4.6 m on a car park (38). 166/166, four at a time.
- **What else reads roofs.json** (rule 16's other half), each run privately on roofs-116.json, its
  writes kept out of the shared .cache and tools/ (a preloaded redirect), and diffed:
  - `tools/walls.mjs` (`.cache/walls.json`): it changes. Beside the two long flat awnings removed at
    (1780-1854, 360-435), nine of the map's retaining walls are concrete where they were granite (the
    buildings round a wall say what it's made of), and three of the LiDAR's retaining walls and one
    hedge (1.25-3.29 m high) are gone. Run on main's roofs.json it gives the shared walls.json byte for
    byte, so that's 116's doing. At landing it's made again into the shared .cache, and the world
    built from it (as this branch's was, from the private copy).
  - `tools/open.mjs` and `tools/shooter.mjs` (`tools/open.json`, `tools/shooter.json`): the same,
    byte for byte.
  - `tools/furniture.mjs` reads only the shifts, and `tools/heights.mjs` only the map's own buildings
    (`buildings`, `shifts`): roofs.mjs --lacking leaves both as they were (compared).
- **The viewpoints:** none sees one. Two have one inside their view's angle, far off:
  pascoal-fernandes at 380 m, egidio-guimaraes at 230-260 m. Both were shot before (main's 1.42.0,
  from a fresh worktree) and after, at Ultra, High and Low (`2026-10-25-before116`,
  `2026-10-25-after116`): the same at Ultra and High, a few pixels' noise at Low, 4 k fewer triangles.
- `ROOFS` (`.cache/roofs.json` by default) names the file roofs.mjs writes and world.mjs reads, so a
  task tries it out without the shared one (`.cache/roofs-116.json` here). At landing it takes
  roofs.json's place.
- 2026-10-26, the coordinator: **landed** at worker-3's merge turn while it was idle (the owner: "finish
  it"), from `acecb30` rebased on main's 1.44.0. Task 087 had landed meanwhile, and its
  `.cache/planes.json` keys a building the map lacks by its place in roofs.json's `found`: 116 takes 30
  of them out, so 5,755 were renumbered and would have been drawn with others' roofs. So, under the
  lock: roofs-116.json over roofs.json (the shared one kept as `.cache/roofs-pre116.json`, planes.json
  and walls.json beside it), `node tools/planes.mjs` again (103 s; each of the map's 13,022 buildings
  and the LiDAR's 7,221 compared with before by its outline: the same planes, renumbered), `node
  tools/walls.mjs` (the nine pieces turned concrete, three of the LiDAR's retaining walls and a hedge
  gone, as worker-3 measured), `npm run world` (the same 10 tiles change as on 1.43.0), tests 171/171.
  `tools/planes.mjs` reads the file `ROOFS` names now, as `world.mjs` does. Decision 084.
