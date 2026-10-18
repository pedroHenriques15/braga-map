---
status: doing
priority: medium
kind: code
repo: both
created: 2026-10-16
depends-on: [013, 026]
roadmap: Phase 2 · The shape
---

# 052 · The streets end at their walls

## Why

Task 013 put the walls in the world, and found many of the map's own standing where the world draws
a street: in the open world's area, 4.0 km of OpenStreetMap's 29.6 km of walls, fences and hedges
lie on a carriageway as `tools/streets.mjs` draws it, and 4.8 km on a pavement. A wall on a
carriageway is cut away (as a building in a street is, decision 021), so it's lost; one on a
pavement stands in the middle of it, the pavement going on past it into the garden behind. In Braga
a street ends at its walls: the pavement runs from the kerb to the wall, and where there's no
pavement the carriageway does.

## What

Today (2026-10-16, after task 013):

- `tools/streets.mjs`'s `streetSurfaces` draws each carriageway at the map's `width`, or its lanes,
  or what its kind usually is (`carriageway` in `tools/osm.mjs`), and the pavements 3.2 m out from
  the kerb or to the buildings and the water (its `buildings`, `water`): the walls aren't among what
  stops them.
- `tools/world.mjs` cuts each wall where it would stand on a carriageway or a path on the ground
  (`walls.mjs`'s `cutWalls`): 4.0 km of the map's walls in the area (13.6% of their length) and 0.17
  km on paths. `test/walls.test.js` reports it ("cut away on a carriageway or a path the world
  draws").
- The walls are `.cache/walls.json`'s (`tools/walls.mjs`), made before `world.mjs` runs
  `streetSurfaces`: they can be given to it.

Checked against main on 2026-10-18, after 026 and 057 (braga-map 1.22.0): all still so, but each
carriageway is now first the width the LiDAR measured (`width:lidar`, 161 streets) on its line moved
onto the carriageway (decision 039). Of the map's 29.1 km of barriers in the area (but the gates), 3.50
km stand on a carriageway (12.0%: 1.03 km on streets whose width 026 measured, 2.47 km on the rest;
3.28 km of it within 1.5 m of the carriageway's edge), 0.17 km on a path and 4.61 km on a pavement.
Of the LiDAR's: its walls 1.64 km on a pavement, its retaining walls 2.45 km (and 1.40 km on a
carriageway, left cut as the task has it), its hedges 1.16 km.

Steps:

1. **The pavements stop at a wall:** `streetSurfaces` takes the walls as it takes the buildings (the
   owner's answer): the map's walls, fences, railings, hedges and retaining walls, and the walls and
   retaining walls the LiDAR found, but not the hedges it found nor the gates. A pavement runs from
   its kerb to the first wall or building behind it, 3.2 m at most.
2. **A carriageway the map's wall stands in gives way to it** (the owner's answer): its edge brought
   back to the wall there, the street no narrower than its lanes (`lanesOf` in `tools/osm.mjs`,
   each at least 2.5 m), so the wall stands at its kerb and isn't cut away. Where the lanes don't fit
   between the wall and the other side, the street keeps its lanes' width and the wall is cut where
   it stands in it, as today, and the test counts those.
3. A path (task 050) stops at a wall as at a building, but where it passes through it (`walls.mjs`
   opens the wall there).
4. party-kart draws and drives what changes (`src/render/streets.ts`, `src/world/ground.ts`): the
   retaining walls the streets draw at their edge where the land is higher already give way to the
   map's (task 013).
5. Shoot the viewpoints where a street runs between walls (`monte-da-forca`, `travessa-fujacal`,
   `alameda-fujacal`, `couteiro`) and measure the budget (task 004).

## Questions

- [x] Where one of the map's walls stands inside a carriageway as the world draws it (the map's
  width, or its kind's usual, is wider than the street there): what gives way? Options: the
  carriageway, its edge brought back to the wall (no narrower than its lanes); the wall, cut away as
  today; both kept, the wall standing in the street. Recommendation: the carriageway, as the wall is
  where the street really ends (decision 019: the street at its real width).
  > The carriageway (the owner, 2026-10-16): its edge brought back to the wall, no narrower than its
  > lanes.
- [x] Do the walls the LiDAR found stop a pavement too, or only the map's? Options: all of them; only
  the map's and the LiDAR's retaining walls; only the map's. Recommendation: all but the hedges the
  LiDAR found (half of those in the contact sheets were scrub).
  > All but the hedges the LiDAR found (the owner, 2026-10-16).
- [x] `lanesOf` counts only the lanes painted: 0 for most residential, service and unclassified
  streets, which hold 1.34 km of the 3.50 km of the map's walls in a carriageway (2026-10-18). How
  narrow may a street the map gives no lanes be brought back to its walls? Options: one lane, 2.5 m,
  one-way or two-way; a lane each way it's driven, 2.5 m each (a two-way street 5 m: 0.46 km of walls
  stay cut, the Travessa da Devesa's among them); 026's narrowest, 2.4 m. Recommendation: one lane,
  as 026's LiDAR measured two-way residential streets as narrow as 2.9 m, 10 of 50 under 5 m.
  > One lane, 2.5 m (the owner, 2026-10-18): a street is no narrower than its painted lanes, nor
  > than one lane where it has none.
- [x] `joao-xxi`'s camera stands on the map's median hedge, which the streets now give way to; moved
  onto the lane its photo shows (decision 041), it fails one of `test/viewpoints.test.js`'s rules.
  Options: drop the viewpoint; move it and change the rule for it; keep it where it is, the hedge cut
  there. Recommendation: drop it.
  > Drop it (the owner, 2026-10-18).

## Read first

- braga-map: `tools/streets.mjs` (`streetSurfaces`, the pavements), `tools/walls.mjs` (`cutWalls`,
  what's in `.cache/walls.json`), `tools/world.mjs`, `test/streets.test.js`, `test/walls.test.js`.
- party-kart: `src/render/streets.ts`, `src/world/ground.ts`.
- Decisions 019 (the streets at their real widths), 021 (a building in a street is cut at the
  kerb), 022 (OpenStreetMap as it is) and 024.

## Done when

- [ ] No pavement runs past a wall into what's behind it; a test in `test/streets.test.js` says how
  much of the walls' length has pavement past them (none, but at a gate or an opening).
- [ ] The map's walls are no longer cut away on a carriageway, but where its lanes don't fit beside
  one, and `test/walls.test.js` counts those.
- [ ] The viewpoints between walls look more like their photos: `monte-da-forca`, `travessa-fujacal`,
  `alameda-fujacal`, `couteiro`.
- [ ] What it changes is measured against the budget (task 004) and recorded in Notes.

## Out of scope

- Every street on its real carriageway, from the map's line off its middle: task 026 (this task
  comes after it, and brings the edge to a wall only where 026 leaves it past one).
- The pavements' heights: task 044.

## Notes

- Both questions answered on 2026-10-16: `todo`, after task 026.
- From task 013, 2026-10-16: measured with its walls in the tiles, over the open world's area: of
  the map's 29.6 km of barriers (but the gates), 24.6 km are in the tiles, 4.0 km cut away on a
  carriageway, 0.17 km on a path, 0.9 km at its openings and gates; 4.8 km of them stand on a
  pavement as the world draws it. Not checked: how much of the LiDAR's walls stand on a pavement.
- **Started 2026-10-18,** on braga-map 1.22.0's main; "Today" checked against it (above) and the
  third question answered. Then 019 and 060 landed, main was merged and the remake run again.
- **How it's done** (`tools/streets.mjs`, decision 046):
  - `stopsAt` and `givesWayTo` say which walls a pavement or a path stops at, and which a carriageway
    gives way to. `world.mjs` and the streets page hand them walls.json's walls.
  - `pullBack`: along each street on the ground, its edges' offsets every 0.5 m, each brought back
    to 15 cm short of a wall of the map's running along it (within 30°) inside its band or within
    15 cm of its edge (where a road's two carriageways touch, the map's median wall is in the crack
    between them); a wall in it under a metre long left; on straight across an opening up to 6 m
    that no other street passes through; nothing within a deck's or a tunnel's width and 4 m of its
    end (its end meets the ground's streets at their height, task 040, and the Avenida Frei Bartolomeu
    dos Mártires' median wall runs onto one); and the lanes' floor, each side going back out in
    proportion where they don't fit. What it gives way (`gives`) comes off its band, its join and
    corner with the next, its dead end's round end, the slivers and the cracks task 048 fills, so two
    carriageways brought back to a wall between them leave its gap, an island.
  - `shade`: each piece of a kerb (or either side of a path's line) looks straight out from it, and
    what's behind a wall it sees, from 15 cm short of the wall's line, isn't pavement (a path keeps
    0.3 m either side of its line: a wall the map draws along it stands on it, and is cut there); what
    another kerb sees past it stays (a street on the wall's other side). What a street gave way to a
    wall is behind it too: seen from where the street widens again past the wall's end, along the
    wall's back, it would have been pavement.
  - Two bugs found on the way: the kerb's pieces took which side is out of the carriageway from a
    probe 5 cm off points rounded to 10 cm, wrong on an edge on the half decimetre, as one 15 cm
    short of a wall's line is; now once a ring, by most of its edges. And clipper-lib drops an open
    line that's level (equal z) and wholly outside the area it's clipped by, so the walls aren't
    clipped to the carriageways first (a wall in one is behind the kerb, or seen past).
  - The lines painted on a narrower stretch share what's left, eased 10 cm a metre; a zebra or a stop
    line spans what's there.
- **`joao-xxi` dropped** (the owner's answer, Questions): Mapillary puts its camera on the line of the
  map's median hedge on the Avenida João XXI (`osm` 1558866792, 2 m), which the old tiles paved over at
  a junction; its photo has the car in the middle of three lanes with the hedge on its left. Moved
  there (5.1 m, decision 041), it fails one of `test/viewpoints.test.js`'s rules. Its earlier rounds'
  shots stay on the scorecard. 33 viewpoints.
- **`robert-smith-picoto`'s camera moved 1.7 m** onto the middle of its lane, heading and pitch kept
  (decision 041): Mapillary puts it 0.5 m from a garden's wall, which the street now stops at; its
  photo has the car in the right lane with the wall on its right.
