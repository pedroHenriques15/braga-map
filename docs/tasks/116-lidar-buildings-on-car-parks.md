---
status: todo
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
