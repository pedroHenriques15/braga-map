---
status: done
priority: low
kind: code
repo: braga-map
created: 2026-10-18
depends-on: [063]
roadmap: Phase 3 · Surfaces and colours
---

# 065 · A tree the map has beside a crown is that crown's trunk, not a young tree of its own

## Why

At `imaculada-conceicao` the photo's big hackberry stands on the south pavement 15 m ahead of the
camera, its crown reaching back over the camera. OpenStreetMap maps a tree there, at its trunk. The
LiDAR's crown is that tree's, but its top is 14 m back, 6.5 m from the camera, so the world stands
the hackberry's trunk under its top, beside the camera, and draws the map's tree at the real trunk as
a young tree 4 m tall that isn't there. Task 061 found it while reading the trees near the
viewpoints.

## What

Today (2026-10-18, braga-map 1.29.0, task 061's): `tools/trees.mjs`'s `matchOsm` puts each of
OpenStreetMap's trees in the crown it stands in, or the nearest within 2.5 m; one in no crown is
kept as a young tree (`young`, at the map's height and crown or 4 m and 3 m) where no tree the LiDAR
found stands within 4 m. The hackberry: the LiDAR's crown at (-259.5, 735.5), 15.1 m tall, 12.5 m
wide, its foot at 8.3 m; the map's tree at (-244.5, 731), 9 m past the crown's edge as the LiDAR
measured it, kept as a young tree.

1. **Look first**: is the map's tree the crown's trunk (the crown leaning out over the street and
   the carriageway, further than the crown `trees.mjs` found), or is the camera off along the
   avenue (Mapillary's 2018 position, task 058's move only across it)? The orthophoto, the point
   cloud under and round the crown, the 2018 and 2019 photos along the avenue (`facade-way-439166597`,
   `facade-way-162945727`, bare in December). Record which in Notes before changing anything.
2. If the map's tree is the crown's trunk: a mapped tree in no crown, within so many metres of a
   crown with no mapped tree of its own and lower leaves reaching towards it, is that crown's trunk
   (as `matchOsm` does within 2.5 m); count how many across the map, and look at a few.
3. If the camera's off: move it along the avenue to where its photo's trunk is, as task 058 did
   across it.

## Read first

- `tools/trees.mjs` (`matchOsm`, `measure`, the young trees), decision 047.
- `refs/trees.json`'s note on the hackberry; `docs/tasks/done/061-*.md`'s Notes.
- `refs/viewpoints.json` (`imaculada-conceicao`), decision 041.

## Done when

- [ ] At `imaculada-conceicao` one hackberry stands where its photo has its trunk, its crown over the
  camera, and no young tree that isn't there. **Left in part:** the hackberry stands where the photo
  has its trunk (the camera moved, Notes), but the crown over the photo's camera is a nearer tree's,
  not the hackberry's, and the young tree stays, 35 m ahead now, as no photo says it's gone (decision
  043 keeps the map's trees in no crown).
- [x] How many mapped trees became a crown's trunk across the map, in Notes; `npm test` passes. None:
  step 2 isn't wanted, the camera being off, not the crown (Notes); `npm test` 153 of 153.
- [x] The viewpoint shot again, no worse than before: the coordinator marked it 3 → 3
  (`.cache/scorecard/marks/2026-10-24-after065.json`), the hackberry where the photo has it.

## Out of scope

- Which species each tree is: task 061.
- Where a trunk the LiDAR finds stands otherwise: task 063.

## Notes

- Found by task 061 (2026-10-18).
- **Under way (worker-2, 2026-10-24), braga-map branch `task-065`, on 1.37.0 (088's).**
- **Step 1, looked at first: the camera is off along the avenue, not the crown.** The July orthophoto
  (`tools/species.mjs mark`'s plan round the camera) has no crown over OpenStreetMap's tree at
  (-244.7, 731), 15 m ahead of the camera, only pavement and a grass strip; the LiDAR's crown, at
  (-259.5, 735.5), is beside the camera, and OpenStreetMap maps a tree at its trunk too (node
  3871181783, at -258.8, 735, where the world stands it); the big crowns north of the avenue are
  level with the camera or behind it, where the photo has round trees 20–40 m ahead on its left.
  Projected with the viewpoint's camera (`viewCamera`): from where it was, the LiDAR crown's trunk is
  behind the camera, and OpenStreetMap's tree at 0.63 across and 0.35 down, in front of and right of
  the photo's trunk foot (0.52, 0.29); from 20 m back along the avenue, the crown's trunk lands at
  0.52, 0.29, on the photo's trunk foot, and the fan palm (-230.6, 728.1) where the photo has it
  (0.20 across, its top at -0.09; the photo 0.245 and -0.12), where from as it was its top came out
  at -0.26, too high. Mapillary's 2018 position is about 20 m too far east along the avenue (task
  058 moved it only across).
- **The premise half false:** the foliage over the photo's camera isn't the hackberry's, 20 m ahead,
  but a nearer tree's on the right (the map's at -276.2, 740.1, 15.4 m tall, its leaves from 8.5 m).
  And OpenStreetMap's tree at (-244.7, 731) isn't the hackberry's trunk: it's a second mapped tree
  the LiDAR doesn't see (under 3 m in 2025, or felled), 35 m ahead of the moved camera at the fan
  palm's foot, where the 2018 photo has no young broadleaf. It stays a young tree, as decision 043
  keeps the map's trees in no crown: whether it's there now no photo says.
- **Step 3, done: the camera moved 20 m back along the avenue** (`refs/viewpoints.json`: from
  (-260.1, 13.1, 729) to (-279.6, 13.2, 733.5), its target with it, its height over the ground and
  its pitch kept; still in the eastbound carriageway's left lane, clear of every trunk and crown).
  It's 20.2 m from where Mapillary puts its photo; `test/viewpoints.test.js` allowed 15 m for a move
  across the street (058), and now allows 25 m where the notes say it was moved along its street.
  Step 2 (a mapped tree beside a crown as its trunk) isn't wanted: none is the case here.
- **The trees newly in view** (`test/trees.test.js` wants every tree within 60 m of this viewpoint's
  camera, in view, looked at): 9, in `refs/trees.json` from the photo marked from the new camera:
  four of the Avenida Imaculada Conceição's hackberries behind the median's hedge, as its row (061)
  has them; five more on the avenue's north side, clipped into balls as the south pavement's limes
  look but not told which crown each is ("broadleaf"); one at the view's edge hidden. A tree seen is a
  row's no more, so the rows name 28 trees one by one where they named 32, and the test's floor for
  them went from 30 to 25.
- **Decided by the session, for the owner to confirm:** a viewpoint's camera may be moved up to 25 m
  along its street from where Mapillary puts its photo, where the photo's own trees put it there
  (the 15 m of 058's moves across a street stand); and the rows' floor in `test/trees.test.js` 25.
- **The round** (party-kart's `shots/2026-10-24-after065/`, High and Low, `--map` this branch; before,
  `shots/2026-10-24-after088/`'s, the old camera): the coordinator marked `imaculada-conceicao` 3 → 3.
  The hackberry's trunk on the right where the photo has it, its crown over the top right. Left: the
  hedge on the left is taller and nearer than the photo's (not looked into here).
- **Decision 073** for the camera's move along its street; the rows' floor in `test/trees.test.js` is
  in it too. Both decided by the session, for the owner to confirm (task 103's table).
