---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-15
depends-on: [043]
roadmap: Now · The open world
---

# 045 · The ground under a street beside a wall, not the wall's top

## Why

The tiles' ground is the LiDAR's mean over each 2 m square, so where a street runs within 2 to 4 m
of a wall, a cutting's or a retaining wall, the squares by the wall take its top into the street.
The street on the ground, which takes that height, rides up the wall or ripples along it. Task 043
held the ground to the street at the decks' ends and the tunnels' mouths, but at four mouths of
narrow bores a cutting's wall stands that close, and on the Avenida João XXI over its junction the
street runs along the tunnels' cutting: party-kart's car is thrown off the ripples there.

## What

Today (2026-10-15, after task 043):

- `tools/world.mjs` packs each tile's ground as `ground.mean` round each point of its grid, every
  2 m on the FINE tiles (`gridDm`, `tileGround`); `tools/terrain.mjs`'s `mean` averages the 50 cm
  LiDAR over the square, whatever is in it. Round the decks' ends and the tunnels' mouths,
  `tools/lines.mjs`'s `heldGround` gives `mean` the street's ground instead of the LiDAR's (task
  043): see how, as this task may do the same along a street.
- **The four walled mouths** (`WALLED` in `test/streets.test.js`'s "the street on the ground runs
  into every deck and tunnel on its own slope"): the Liberdade underpass's two west mouths at
  (122.5, 607.5) and (123.5, 611) and the João XXI's narrow bores at (560, 233.5) and (530, 249).
  Their first 2 m out are 0.13 to 0.97 m off the street's own slope beyond (the other 24 ends are
  within 0.08 m). At (123.5, 611) the cutting's wall, 5 m high, stands 1.5 m from the map's line,
  inside the 4 m street; the tiles' ground along the cutting is 0.4 to 0.8 m over the LiDAR's floor
  from 4 to 12 m out. At (560, 233.5) the wall is about 2.5 m from the line.
- **Two more, under a street** (added by task 047, when the open world grew round the loop's new
  stretch): the Avenida Imaculada Conceição's tunnel under the Rotunda Santos da Cunha, mouths at
  (-775, 975.5) and (-810, 1012), 0.88 m and 0.18 m off. The roundabout's carriageway is over each
  mouth, `heldGround` never holds the ground on another street's carriageway, and the tiles' 2 m
  ground takes the roundabout's height (5.4 m over ELEV0) into the tunnel's street (-0.8 m).
- **The Avenida João XXI over its junction** runs along the edge of the tunnels' cutting: from
  (565, 242) to (590, 228) the tiles' ground ripples 0.3 to 0.6 m every 2 m where the LiDAR's is
  smooth within 0.1 m (178.35 to 178.22). party-kart's world-ground drive (`test/drive.test.ts`,
  on braga-map's tiles after task 043) is thrown 0.94 s at (561, 244) and 1.36 s at (602, 219)
  there; the same ripples were in the tiles before 043 (1.04 and 0.81 s).

Steps:

1. **Where:** along every street in the open world's area, every 2 m on its centre line, the tiles'
   ground against the LiDAR's (`terrain().at`), and where they're more than 0.15 m apart, why: a
   wall or a cutting beside it, a building's base, a bridge over it, the LiDAR's own gaps.
2. **The ground under a street held to it:** for the grid points whose squares a street's
   carriageway crosses, the mean over only the part of the square on the carriageway (or another
   way that keeps the street at its own height without moving the wall; say which, and why, in the
   Notes). A street on the ground only, not the decks', the tunnels' or the railway's.
3. **Tests:** at the four walled mouths, the first 2 m within a decimetre of the street's own
   slope beyond (`WALLED` goes); along every street in the area, the tiles' ground at the
   carriageway's middle within 0.15 m of the LiDAR's at nearly every point, and where it isn't,
   why.
4. party-kart's world-ground drive, on the new tiles in a worktree of its own (party-kart stays on
   its pinned tag), not thrown on the Avenida João XXI.

## Read first

- `tools/world.mjs` (`gridDm`, `tileGround`), `tools/terrain.mjs` (`mean` and its `held`),
  `tools/lines.mjs` (`heldGround`, `meetings`).
- `test/streets.test.js` ("the street on the ground runs into every deck and tunnel…", `WALLED`).
- docs/tasks/done/043-ground-held-at-the-ends.md, its Notes.

## Done when

- [x] No walled mouth left: `WALLED` in `test/streets.test.js` is empty and the test passes.
  > `WALLED` is gone, and "the street on the ground runs into every deck and tunnel on its own slope"
  > passes at all 34 ends: the first 2 m within 0.09 m of the street's slope beyond. The six that were
  > walled: (560, 233.5) 0.00 m, (530, 249) 0.05, (-775, 975.5) 0.02, (-810, 1012) 0.07, (122.5, 607.5)
  > 0.03 and (123.5, 611) 0.02 (on 1.26.0: 0.45, 0.13, 0.88, 0.43, 0.02, 0.94).
- [x] Along the area's streets the tiles' ground follows the LiDAR's at the carriageway's middle
  (step 3's test), and braga-map's `npm test` passes.
  > "the ground under every street in the area at its own height": every 2 m on the area's streets,
  > 43,139 points (the ground held on purpose at the decks' ends, the tunnels' mouths and under the
  > crowns and roofs left out), 110 more than 15 cm off the LiDAR's (0.25%; 355 on 1.26.0), 94 of them
  > by a step of half a metre or more within 1.5 m across the middle (why: Notes). braga-map's
  > `npm test`: 136 pass on 1.27.0.
- [ ] party-kart's world-ground drive on the new tiles isn't thrown on the Avenida João XXI.
  > Not met, at the owner's choice (2026-10-18): the race's drive on 1.27.0 is thrown 0.43 s at
  > (569, 240) and 0.72 s at (566, 241), on the avenue's upper lane beside the tunnels' west mouth,
  > where on 1.26.0 it wasn't. The car tilts by the land 1.5 m beside it, and the cutting is 0.8 m past
  > the lane's edge (Notes): task 066. Its hops at (-275, 1083) and (-932, 1267) are gone.
- [x] The viewpoint `lobato-crossing` shot again (no worse: the streets by the cuttings lie on their
  real level; `joao-xxi` was dropped in task 052, the owner's answer).
  > Shot in the round "O chão das ruas" (`2026-10-18-after045`): as in "As placas", 3, none of its
  > streets by a cutting. Of the 33, only `travessa-lobato` looks different: its road no longer rides
  > up the grey bank on its right, but lies flat to its edge (2, as before: the bank is still there
  > where the photo has the pavement and the parked cars, now with shards of the land at its foot).

## Out of scope

- The pavements' own level from the kerb: task 044.
- The decks' ends and the tunnels' mouths themselves: task 043.
- Where the map puts a street's line (the Liberdade's 1.5 m inside its wall): task 026's kind of
  work, from the LiDAR and the orthophoto.

## Notes

- Found in task 043 (2026-10-15).
- Task 047 (2026-10-15) added the Avenida Imaculada Conceição's two mouths under the Rotunda Santos
  da Cunha to `WALLED`, at the owner's choice: six now.
- **Today, checked against main on 2026-10-18** (1.26.0, after 026's carriageways, 052's walls, 063's
  trees and 042's plates): as written, but 026 put the lines on their carriageways, so at
  (123.5, 611) the street is 2.5 m wide and the cutting's wall 1.5 m past its line, not inside it;
  the six mouths were 0.45, 0.13, 0.88, 0.43, 0.02 and 0.94 m off ((122.5, 607.5) already met its
  slope). The race, on the streets since task 037, no longer passes where 043 found it thrown: it
  drives the avenue's upper lane, 3.3 m wide on the cutting's top, and on 1.26.0 isn't thrown there. A car
  driven along the avenue's lanes in free roam (below) was, up to 0.87 s at 60 km/h and 1.32 s at
  140. 052's walls, 063's trees and 042's plates stand on the ground; they don't shape it.
- **Step 1, where** (on 1.26.0, every 2 m along the area's streets as world.mjs takes them, 43,139
  points where the ground isn't held on purpose): 355 more than 15 cm off the LiDAR's (0.82%), 288
  of them by a step of half a metre or more within 1.5 m across the middle, all on the LiDAR's 50 cm
  ground. Where: the walled cuttings, the João XXI over its junction (a lane on the cutting's top a
  metre from the avenue in it), the Liberdade underpass's west mouths (two narrow streets in the
  cutting, a lane along each side on top) and the Imaculada Conceição's under the Rotunda Santos da
  Cunha; service roads and lanes along garden and retaining walls (the Travessa do Couteiro, the
  Travessa do Bonfim, round (1700–1800, 820–1150)); passages under a building ((-926, 1144)). The
  Rotunda's island outline, way 160389857 (`highway=primary`, `area:highway=traffic_island`, 10 m
  wide), is no carriageway: left out of the holds and of the test. The LiDAR's own: a lump 9 m high
  across the Rua Padre Francisco de Almeida at (874, 1098), which the tiles follow (task 067), and a
  service road's line over a 3 m step at (600, 775). No bridge over a street on the ground among them.
- **Step 2, how and why** (`lines.mjs`'s `streetBands`, `terrain.mjs`'s `mean`, decision 049): the
  mean over only the part of the square on the carriageway (the line's width either side), as the task
  says, and of that only what's within 30 cm of the street's own surface (the median over its middle
  half every metre, carried across at its slope, at most 10%). The carriageway alone wasn't enough
  (0.94 → 0.43 m at (123.5, 611)): the LiDAR's 50 cm ground smears a wall's face over its last half
  metre, the map's line can put a wall's top inside the carriageway's width, and task 043's hold at a
  tunnel's mouth reaches half a metre past the carriageway, onto a wall's top. Left out, not replaced:
  replacing it with the street's surface pulled the cutting's wall at the Rotunda's north mouth 5 m
  down at (-806, 1014), where the street's width reaches over it. A square that reaches the ground held
  at a deck's end stays as 043 holds it: held only on the carriageway, the Rotunda viaduct's south end
  had a corner by ground half a metre off it (4 such points, 3 allowed), and 043 found level ground
  under a deck threw party-kart's car. Where two streets at different heights both reach a square,
  the point holds the one its own ground is within a metre of, on the wall's face the one whose middle
  is nearest. Measured, each the same way (the six mouths, the streets' middles, the race's drive, a
  car along every street):
  - the nearest middle for every point: the mouths met; the race thrown at (96, 623) 0.92 s, on the
    Liberdade's upper lane, where a point on the wall's top took the cutting's floor;
  - the higher street: (-775, 975.5) 2.38 m off (the roundabout over the mouth won), (123.5, 611) 0.19;
    151 times in the air along every street;
  - the old mean wherever two levels meet: (-775, 975.5) 0.88 m and (123.5, 611) 0.11 off;
  - the level its own ground is within 30 cm of: (123.5, 611) 0.19 m off, a point on the face taken
    for the lane on top;
  - within a metre, else the nearest middle (chosen): the mouths met, 110 points off, the race's hops
    at (-275, 1083) and (-932, 1267) gone, two new on the João XXI (below).
- **Measured on 1.27.0:** the mouths and the streets' middles above. party-kart `b38c87e` on it:
  `npm test` 66 pass and `npm run check`; the race's laps 301.8 and 300.1 s, no respawn (302.4 and
  300.3 on 1.26.0); its flights of 0.3 s or more the jump's 1.93 s, (-140, 695) 0.64 s as before and the
  João XXI's two, where (-275, 1083) 0.46 s and (-932, 1267) 0.37 s are gone. A car driven along every
  street in the area both ways at 90 km/h (3,420 streets, 166 km: `spawn` at each line's end, steered
  along it on `worldGround`, a script of this task's): in the air 0.3 s or more 144 times (139 on
  1.26.0), at most 1.77 s (1.92 s); along the João XXI's 17 lines, 4, 6 and 8 times at 60, 100 and
  140 km/h.
- **The João XXI** (the owner's answer, 2026-10-18: land it, the hop to a party-kart task). On the
  upper lane beside the tunnels' west mouth (562, 237) the race's car, 0.9 m left of the line, tilts
  to 64° on a road flat at 24.40 m and is thrown: party-kart's `normal` reads the ground 1.5 m beside
  the car, and there the cutting's floor is 0.8 m past the lane's edge (the LiDAR's at (564, 240) is the
  floor), with 043's hold at the mouth. On 1.26.0 the smeared ground leaned the car steadily instead.
  The map can only stop it by moving the cutting's edge into the cutting: task 066 tilts the car by the
  street it's on.
- **Found:** task 066 (party-kart: a car tilts by the street it's on) and task 067 (the lump across the
  Rua Padre Francisco de Almeida).
- **Budget:** no geometry or textures. The 25 tiles with the ground every 2 m changed: 13,962 KB in
  all as before, 6.061 → 6.065 MB gzipped.
- **Landed** (2026-10-18): braga-map **1.27.0** (`330463b`, tag `v1.27.0`), main merged first (the
  deploy's note only) and the remake run again (open, shooter, world, tracks, cover, textures, the
  page): nothing changed but the 25 tiles, the track the same. `trees.json`, `carriageways.json` and
  `walls.json` weren't made again: this task doesn't touch them, and 061's session works on the
  trees. party-kart `b38c87e` pinned to it, not deployed; its peer prefix stays `pk37`.
- **The round "O chão das ruas"** (`2026-10-18-after045`): shot on party-kart `b38c87e` (main, pinned
  to 1.27.0), prepared by `tools/round.mjs` (33 shots of its own in 4 sheets in `.cache/scorecard/rounds/`,
  `refs/rounds.json`). Claude's marks, against "As placas", in `.cache/scorecard/marks/2026-10-18-after045.json`:
  2.94 over the 33, none moved. Every shot differs from "As placas" in 0 to 6% of its pixels, mostly the
  clouds and the shadows; the ground's change shows only at `travessa-lobato` (above), where the land's
  2 m cell from the road's edge to the bank now stands as shards along the kerb. **Not published**, at
  the owner's word: added to task 064's table.
- **Not checked:** the owner's marks; a phone; the deploy (not asked).
