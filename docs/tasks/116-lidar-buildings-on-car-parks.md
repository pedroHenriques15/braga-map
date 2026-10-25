---
status: doing
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

- [ ] The 85 looked at, each kind counted; the rule's test; no row of vehicles on a car park drawn as a
  building.
- [ ] `npm test` passes; the viewpoints that see one shot again, no lower.

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
  - about 5 rows of vans or site cabins;
  - about 7 kiosks and sheds;
  - 19 parts of buildings beside the map's, outlines a little off them;
  - 15 whole buildings over 4.6 m (houses and blocks a car park's outline takes in).
  The vehicle rule had already left out the cars and lorries standing alone. What was left as
  buildings were mostly canopies.
- **The rule** (`tools/roofs.mjs`, `canopyOf` and `topShape`): on a car park, under 4.6 m and not
  beside a building the map has (30% of its outline within 1.5 m of one), a "building" is left out as
  a canopy if one of these holds (decided by the session, for the owner to confirm):
  - **solar:** dark (under 140 of 255), one plane (under 20 cm off one), and tilted 10% or more or
    blue;
  - **tent:** light (160 or more), its top as bumpy as pyramids are (20 to 45 cm off a plane, or
    18 cm and 5 m long or more: a kiosk 4 m across, (-1063, 1134), is 18 cm);
  - **flat:** light (175 or more), under 20 cm off a plane, and 10 m long or more.
  The games don't draw a canopy (a thin roof on posts), so it's left out rather than drawn as a
  kind of its own (the task's either); a game that draws one can take the LiDAR's back later.
  `tools/roofs.mjs` drops 35 of the LiDAR's buildings this way (its pieces of them; the world splits
  some into parts).
- **The result:**
  - Of the 107 on car parks, 47 are gone: 32 tents, 11 pieces of the solar canopies, 2 flat awnings
    and 2 pieces at a tent's end. 59 are left: 34 under 4.6 m (82 before), 7 in the open area (13).
  - Kept that are canopies: a long thin row of tents at (408, -974); one the map's car park doesn't
    take in by its middle, (2063, 420); another at (1852, 915); a flat dark solar canopy at (-265,
    -1818); a row of vans; and six small pieces of tents. The rule measures these otherwise than my
    look did.
  - `test/roofs.test.js`: made-up canopies and not. `test/footprints.test.js`: at most 40 under
    4.6 m on a car park (34). npm test 165/165.
- **The viewpoints:** none sees one. Two have one inside their view's angle, far off:
  pascoal-fernandes at 380 m, egidio-guimaraes at 230-260 m. Both were shot before (main's 1.42.0,
  from a fresh worktree) and after, at Ultra, High and Low (`2026-10-25-before116`,
  `2026-10-25-after116`): the same at Ultra and High, a few pixels' noise at Low, 4 k fewer triangles.
- `ROOFS` (`.cache/roofs.json` by default) names the file roofs.mjs writes and world.mjs reads, so a
  task tries it out without the shared one (`.cache/roofs-116.json` here). At landing it takes
  roofs.json's place.
