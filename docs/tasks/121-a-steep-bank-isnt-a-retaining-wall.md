---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-24
depends-on: [111]
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 121 · A steep bank the LiDAR finds isn't a retaining wall: Santo Adrião's

## Why

At `capela-santo-adriao` the photo has a grassy bank rising from the pavement to the chapel's wall,
and no wall at the road. The map has two retaining walls there, 3.65 and 3.89 m high at z about 1246,
6 m apart, that the LiDAR found: the steep bank taken for walls (task 013's rule, a step in the
ground). Since task 111 holds the land to each wall, they stand whole, granite, where the photo has
grass.

## What

1. Measure what tells a wall from a steep bank in the point cloud: a wall's face is near vertical
   over its height (its points in a narrow band in plan), a bank's slope spreads over metres; the
   cover's classes (grass on a bank, a wall's echo).
2. `tools/walls.mjs`: a step that's a bank (its face under, say, 60°, or vegetation over its whole
   length) isn't a retaining wall; counted over the map, a few looked at in photos.
3. `npm run world`; `capela-santo-adriao` and the others step 2 finds shot again.

## Read first

- `tools/walls.mjs`; decisions 033 and 059; task 111's Notes.

## Done when

- [ ] Santo Adrião's two walls are the bank they are, and `capela-santo-adriao` shot again, no lower.
- [ ] The rule's count over the map in Notes; `npm test` passes.

## Notes

- Found by worker-3 in task 111 (2026-10-24), drafted by the coordinator.
