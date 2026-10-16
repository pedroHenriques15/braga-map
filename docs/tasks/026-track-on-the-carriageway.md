---
status: todo
priority: high
kind: code
repo: braga-map
created: 2026-10-13
depends-on: [009, 016]
roadmap: Phase 2 · The shape
---

# 026 · Every street on its real carriageway: its line where the street's middle is, at its width

## Why

Every street the world draws is a band round OpenStreetMap's line for it, at the width the map
gives or guesses (task 033, decision 019). Its kerbs, pavements, corners and markings are placed
from that band, and so are the race's road and barriers (decision 029). OSM's ways can sit a metre
or two off the middle of the real street, and many of its widths are guesses. So the world's
streets are where the map has them, not where Braga's are:

- **The Avenida João XXI** at (586, 230): the line runs 1.5 m from the carriageway's left edge,
  beside a 5.5 m drop to the road below, and the carriageway drawn round it overhangs the drop
  (found in task 009).
- **`bom-jesus`:** the photo is from a car in the road's right lane, and the game puts that spot on
  the map's left pavement (the owner's mark fell 4→2 in "Todas as ruas").
- **`liberdade`:** the photo is from the wide pavement beside the cycle lane, and the game puts it
  on the carriageway, drawn wider than the real road (2→1). There the map's line is 1.5 m inside
  the street's wall (task 045).
- **`viriato-amaral-nunes` and `alameda-fujacal`** (task 013's round): the camera stands on the bank
  or the verge where the photo's is on the road.

Everything after this is measured against the carriageways: the ground under a street beside a wall
(045), where the streets end at their walls (052), the pavements' heights from the kerb (044), the
steps' feet (051), the roundabouts' rings (014), the markings (018) and the plates at the corners
(042). So the streets go where they really are first.

## What

Today (2026-10-16):

- `tools/lines.mjs`'s `streetsOf` reads each street from OSM's `base.json` as it is: its points,
  nodes, kind, level, and its width kerb to kerb (`tools/osm.mjs`'s `carriageway`: the map's
  `width`, else its `lanes`, else what that kind of street usually is). `tools/world.mjs` gives
  those lines to `tools/streets.mjs`'s `streetSurfaces`, which makes each carriageway a band that
  wide round its line (`band(…, e.w / 2)`) and puts the corners, kerbs, pavements, reservations,
  islands and markings round them. The tiles' `lines` are the same lines, thinned.
- `tools/track.mjs` builds its own street graph from `base.json`'s nodes. The race's road is bands
  round the loop's nodes at `carriageway`'s widths, cut to the carriageways in the tiles (decision
  029). `tools/open.mjs` works out the open world's edge and its gates from `base.json`'s streets
  too.
- Nothing measures where a carriageway really is, but the LiDAR can:
  - `tools/terrain.mjs`'s `terrain()` has the ground at 50 cm where `fetch.mjs` got it (the
    tracks' box), and a kerb is a step of 10 to 20 cm.
  - Task 016 found that the laser's echo off the ground tells asphalt, setts and a pavement apart,
    in the sun and in a shadow alike, where the orthophoto's colour barely does. The medians:
    asphalt 5.2 thousand, setts 7.2, pavements 10, paved paths 17, grass 19.
  - `tools/cover.mjs` keeps each 50 cm cell's mean echo, its count of ground points, and the top of
    what stands on it in `.cache/dgt/cover/` (`lidarCells`, not exported yet). It keeps the cars
    the LiDAR saw parked in `world/cover/<tile>/cars.json`.
  - Its classes (`world/cover/`) take the streets' own surfaces where the world draws them, so they
    can't say where a street really is: read the echo, not the classes.

Steps:

1. **Measure each carriageway:** a new `tools/carriageways.mjs` writes `.cache/carriageways.json`,
   the way `tools/decks.mjs` and `tools/walls.mjs` write theirs. For every street on the ground in
   the open world's area, every 2 m along its line, find the band across it that is road. Its
   edges are the kerbs' steps in the 50 cm ground, and where the echo changes from asphalt (or
   setts, where the map says setts) to the pavement's or the verge's on either side. Look as far as
   the map's width plus 10 m either side. Record the band's middle's offset from the line, and its
   width.
   - **Nothing is measured where the edge can't be seen:** a parked car on it (`cars.json`, or
     anything 0.9 to 2.4 m over the ground), trees hiding the ground, or nothing changing at the
     edge (a street of setts from house to house, a lane with no kerb).
   - **Where the map draws a road's two halves as one way** (the Avenida da Liberdade, the Avenida
     João XXI), the band is both halves and what's between them, from one outside kerb to the
     other.
2. **Print it:** how much of the area's streets' length was measured; the spread of the offsets,
   and of the widths against the map's; and the worst places with their streets, the viewpoints
   above among them.
3. **Move the lines** where the offset is over about 0.5 m and holds for 30 m or more (Questions).
   - The map's way stays the street, with its name, kind, junctions and direction. Its nodes move
     onto the measured middle, smoothly.
   - A node at a junction moves once, for every way through it: to where its arms' measured middles
     meet.
   - The width is the measured one where it's clear, and the map's elsewhere (Questions).
   - A street on a bridge or in a tunnel keeps its line (its deck is task 028's). A street on the
     ground eases its move out before a deck's end or a tunnel's mouth, so the two still meet
     within 5 cm (decision 023).
4. **Every reader of the map's streets takes the moved ones,** through one function in `lines.mjs`
   that applies `.cache/carriageways.json`:
   - `streetsOf`, and through it `world.mjs`, `build.mjs`'s map page, the paths' joins (task 050)
     and `heldGround` (task 043);
   - `track.mjs`'s graph;
   - `open.mjs`'s edge and gates.

   Then run `npm run world` and `npm run tracks`, so the race's road and its barriers follow (task
   037's note below).
5. **Tests** in `test/streets.test.js`, or a `test/carriageways.test.js` of its own:
   - At the Avenida João XXI (586, 230), the carriageway drawn no longer overhangs the drop.
   - Nowhere in the area does a carriageway on the ground overhang a drop of more than 1 m that the
     measured street doesn't have.
   - The junctions, the decks' ends and the tunnels' mouths join as before.
   - "Every street in the area has its carriageway, at its real width" checks against the widths
     now used.
6. **Release it:** a new tag, with party-kart pinned to it. In party-kart, `npm test` and
   `npm run check` pass, with the race's lap summary before and after. Shoot the viewpoints and
   measure the budget (task 004).

## Questions

- [x] Decision 022 says no street is added, moved or turned round in the world: the map's streets
  are OpenStreetMap's as they are. Is a street's line moved onto its carriageway as the LiDAR
  measures it? Options: yes, by measurement, as decision 025 does for the buildings (recommended);
  or no, the offsets measured and listed only, the map's lines kept.
  > Yes, by measurement (the owner, 2026-10-16). When the task is finished, a new decision narrows
  > 022 to "nothing moved by hand": the map's ways stay the streets, and where they are and how wide
  > is the LiDAR's.
- [x] Where the map tags a street's `width` and the LiDAR measures another, which does the world
  use? Options: the measured one, as the LiDAR's height beats the map's `height` (decision 025;
  recommended); or the map's tag where it has one, the measured width replacing only the guesses.
  > The measured one (the owner, 2026-10-16), where it's clear; the map's where nothing clear was
  > measured.

## Read first

- braga-map: `tools/lines.mjs` (`streetsOf`, `heldGround`), `tools/osm.mjs` (`carriageway`,
  `lanesOf`), `tools/streets.mjs` (`streetSurfaces`: the bands, the reservations),
  `tools/world.mjs` (the lines), `tools/track.mjs` (its graph, `road`), `tools/open.mjs` (`work`),
  `tools/terrain.mjs`, `tools/cover.mjs` (`lidarCells`, the parked cars), `tools/decks.mjs` (a
  measuring tool's pattern), `test/streets.test.js`.
- Decisions 019, 022, 023, 025 and 029. Task 016's Notes (each kind of ground's echo) and task
  037's (the race's road).
- party-kart: `test/drive.test.ts` (the lap, and the drive over the world's ground).

## Done when

- [ ] `tools/carriageways.mjs` prints, over the open world's area, how much of the streets' length
  it measured, the spread of the offsets and widths against the map's, and the worst places.
- [ ] Every street on the ground whose carriageway is measured more than 0.5 m off its line for
  30 m or more is drawn on its measured middle, at its measured width (a test).
- [ ] Nowhere in the area does a carriageway on the ground overhang a drop of more than 1 m that the
  measured street doesn't have (a test), and on the Avenida João XXI by eye too.
- [ ] The decks' ends and the tunnels' mouths still meet the ground's streets within 5 cm, and the
  race still runs on its streets (the tests that say so pass).
- [ ] `bom-jesus`, `liberdade`, `viriato-amaral-nunes` and `alameda-fujacal` shot again, before and
  after: each camera on the surface its photo was taken from, and none scoring lower than the round
  before.
- [ ] party-kart's `npm test` and `npm run check` pass on the new tag, with the lap's summary line
  before and after, and the budget is measured.

## Out of scope

- Fixing OSM's ways themselves: nobody in the group will edit OSM (task 006's answer, decision
  022).
- Streets on bridges and in tunnels: their lines stay (the decks are task 028's, the levels 012's).
- Where a carriageway stops at a wall: task 052, after this. The ground under a street beside a
  wall: 045. The pavements' widths and heights: 018 and 044.
- What else the map has wrong about a street (its direction, a street it lacks): decision 022's
  list.

## Notes

- Found while doing task 009 (2026-10-13): the LiDAR's cross-section at the Avenida João XXI
  (586, 230) is level from 1.5 m left of the line to 12 m right of it, and 5.5 m lower from there
  to 11 m left.
- **Decision 019 (2026-10-14):** the race runs on the streets' surfaces at their real widths
  (tasks 033 and 037), so this task now moves every street in the open world's area onto its real
  carriageway, and measures its width, not the track's line alone; the track follows the streets.
  `W_MIN` no longer holds.
- **From task 037 (2026-10-15):** the race's line is the map's line for each street, and its road
  (`road`) the route's streets as `world.streets` draws them, which `tools/track.mjs` reads from the
  tiles. When this task moves a street onto its real carriageway, run `npm run world` and then
  `npm run tracks`: the race's road and its barriers follow the streets drawn; the line follows
  the map's lines, so move those the same way (`lines.mjs`), or take the line from the street's
  middle as drawn.
- **From task 035's round (2026-10-15):** two viewpoints show the map's carriageways off the real
  roads. At `bom-jesus` the photo is from a car in the road's right lane; in the game that spot is
  on the map's left pavement (the owner's mark fell 4→2). At `liberdade` the photo is from the wide
  pavement beside the cycle lane; in the game that spot is on the map's carriageway, wider there
  than the real road (2→1). Shoot both again when the streets move.
- **2026-10-16, raised to high** (the owner, setting the order in `docs/ROADMAP.md`): 045, 044,
  051, 014, 018 and 042 measure against the carriageways, so this goes before them.
- **2026-10-16, rewritten** for every street in the area, the title, "Why", "What", "Read first",
  "Done when" and "Out of scope" with them, and both questions answered. It depends on 016 now: the
  LiDAR's echo off the ground, which 016 found tells the road from the pavement, is its
  `.cache/dgt/cover/`. Not checked: whether the 50 cm ground covers the whole open world's area
  (`terrain()` falls back to the 2 m model where it doesn't, too coarse for a kerb), and how much of
  the streets' length parked cars and trees leave unmeasured.
