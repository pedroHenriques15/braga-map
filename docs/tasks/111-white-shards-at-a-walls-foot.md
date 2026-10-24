---
status: todo
priority: critical
kind: code
repo: both
created: 2026-10-24
depends-on: []
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 111 · White shards stick out of the road at a wall's foot in the Travessa Conselheiro Lobato

## Why

In the shot of `travessa-lobato` (main on 2026-10-24: party-kart `2dfa05d`, braga-map 1.33.1), a
row of white triangular shards, up to about a metre high, sticks out of the carriageway along the
foot of the wall on the right, and the wall's foot under them shows a ribbed grey band. Nothing like
it is in the photo or in Braga: broken geometry, in what's shipped (the live build is on braga-map
1.32.0, which has task 077's land at a wall's level, so it's likely there too: check).

## What

The viewpoint stands at (-82.2, 904.2), looking west along the Travessa Conselheiro Lobato towards
(-180.4, 923.2); the shards are along the right (north) kerb, from about 10 to 40 m ahead
(`party-kart/shots/2026-10-24-after082/high/travessa-lobato.png`).

1. **Find what they are:** a retaining wall's or a skirt's triangles (party-kart's
   `src/render/streets.ts`, its outline's walls and skirts), the land at a wall's level (task 077,
   `src/world/land.ts`), a wall of the map's (`world.walls`, task 013), or the street's held ground
   (decision 049). Look at the place with `?scenery&view=` from closer, and in the tiles' data.
2. **Find where else:** the same fault elsewhere in the open world (a test that finds triangles of
   that piece standing over the carriageway beside it).
3. **Fix it** where it comes from (braga-map's data or party-kart's drawing), a test that fails before.
4. Shoot `travessa-lobato` again, and whatever viewpoints step 2 finds.

## Read first

- party-kart's `src/render/streets.ts`, `src/world/land.ts`; braga-map's `tools/walls.mjs`,
  `tools/streets.mjs`; decisions 033, 049, 059.

## Done when

- [ ] No shard at `travessa-lobato` (before and after), and the test of step 2 finds none in the open world.
- [ ] `npm test` (and `npm test`, `npm run check` in party-kart) pass.

## Notes

- Found by the coordinator marking the baseline round `2026-10-24-after082` (2026-10-24). Priority
  `critical` by the tasks' README: something wrong in what's shipped.
