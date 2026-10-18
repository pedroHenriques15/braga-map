---
status: todo
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

- [ ] No walled mouth left: `WALLED` in `test/streets.test.js` is empty and the test passes.
- [ ] Along the area's streets the tiles' ground follows the LiDAR's at the carriageway's middle
  (step 3's test), and braga-map's `npm test` passes.
- [ ] party-kart's world-ground drive on the new tiles isn't thrown on the Avenida João XXI.
- [ ] The viewpoint `lobato-crossing` shot again (no worse: the streets by the cuttings lie on their
  real level; `joao-xxi` was dropped in task 052, the owner's answer).

## Out of scope

- The pavements' own level from the kerb: task 044.
- The decks' ends and the tunnels' mouths themselves: task 043.
- Where the map puts a street's line (the Liberdade's 1.5 m inside its wall): task 026's kind of
  work, from the LiDAR and the orthophoto.

## Notes

- Found in task 043 (2026-10-15).
- Task 047 (2026-10-15) added the Avenida Imaculada Conceição's two mouths under the Rotunda Santos
  da Cunha to `WALLED`, at the owner's choice: six now.
