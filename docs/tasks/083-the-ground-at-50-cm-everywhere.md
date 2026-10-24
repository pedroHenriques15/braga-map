---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-23
depends-on: [081, 038]
roadmap: Ultra · Braga at its most real
---

# 083 · The ground at 50 cm over the whole map, finest near the player

## Why

The world holds the ground every 2 m near the tracks and in the open world, every 10 m elsewhere
(decision 008), each point the mean of the LiDAR round it. A kerb, a step in a garden, a
retaining wall's foot, the camber of an old street are all under 2 m and are smoothed away. DGT's
model is 50 cm; on Ultra the ground near the player should be that.

## What

Today: `tools/terrain.mjs` reads `MDT-50cm` (20 DGT tiles under the tracks' box) and `MDT-2m` (48
tiles, the whole map) from `.cache/dgt/`, `tools/fetch.mjs:314` (`boxTiles`, `mapTiles`);
`tools/world.mjs:62-118` makes each 500 m tile's grid (251² points at 2 m on the FINE tiles, 51² at
10 m elsewhere), 16-bit heights in decimetres; party-kart builds the land from it
(`src/world/land.ts`, `ground.ts`) with no level of detail. A 2 m tile's ground is about 35 KB
gzipped; at 50 cm it would be 16 times the points.

1. **Fetch:** `MDT-50cm` over all 48 map tiles (`node tools/fetch.mjs lidar`, with `boxTiles`
   widened to `mapTiles` for that collection). Needs the owner's DGT account (decision 007).
2. **A level of detail in the tiles:** each tile keeps its 2 m (or 10 m) grid as now, and gains a
   50 cm grid in a file of its own (`world/ground/<tile>.js` or a binary beside it, loaded only on
   Ultra), the LiDAR's own cells, no mean (at 50 cm there's nothing finer to alias). Heights in
   centimetres. The held ground (`lines.mjs`'s `heldGround`, `bands`) applies as on the 2 m grid.
3. **party-kart, on Ultra:** the land near the player from the 50 cm grid (a clipmap or quadtree:
   50 cm within ~150 m, 2 m to ~750 m, 10 m beyond), morphing between levels so nothing pops; the
   karts' and the walkers' ground (`ground.ts`) from the finest level loaded there. Other levels
   unchanged.
4. **Measure** what it costs (download per tile, memory, triangles, build time) and record it in
   Notes and in the budget's Ultra column.

## Questions

- [x] Where the 50 cm files are served from: GitHub Pages and the npm package (a tile's 1001²
  heights are about 2 MB before compression, some 280 MB over the 140 tiles, a guess to be
  measured), only the open world's tiles at 50 cm, or the owner's homelab. Recommendation: only
  the open world's tiles at 50 cm, on Pages, until the area grows (099).
  > Only the open world's 25 tiles, in git with the rest of the world, so on Pages through
  > party-kart (the owner, 2026-10-24). Measured that day on a real tile: 2.0 MB raw, 0.85 MB
  > gzipped stored as differences along each row, so about 50 MB per full rebuild of them in git
  > and about 3.4 MB to download round the player. Step 1 fetches `MDT-50cm` for the tiles under
  > the open world's area only (20 of the map's 48 are fetched today), not the whole map.

## Read first

- `docs/DECISIONS.md` 008, 024, 049; `tools/terrain.mjs`, `tools/world.mjs`, `tools/fetch.mjs`.
- party-kart's `src/world/land.ts`, `ground.ts`; task 038 (streaming), which this builds on.

## Done when

- [ ] On Ultra, a kerb, a step and a retaining wall's foot in Fujacal show in the land where the
  2 m grid smoothed them (`travessa-fujacal`, `fujacal-west`, `alameda-fujacal`, before and after).
- [ ] No viewpoint changes on High, Medium or Low.
- [ ] Driving and walking across the open world on Ultra, no frame over 16 ms is spent on the
  ground's levels (`?stats`).
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Laying the streets on these triangles: 084.

## Notes

- The point cloud (10 points/m², `docs/SOURCES.md`) could give the ground finer than 50 cm, but
  DGT's own 50 cm model is the ground already classified; going finer is not planned.
