---
status: todo
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
  camera, and no young tree that isn't there.
- [ ] How many mapped trees became a crown's trunk across the map, in Notes; `npm test` passes.
- [ ] The viewpoint shot again, no worse than before.

## Out of scope

- Which species each tree is: task 061.
- Where a trunk the LiDAR finds stands otherwise: task 063.

## Notes

- Found by task 061 (2026-10-18).
