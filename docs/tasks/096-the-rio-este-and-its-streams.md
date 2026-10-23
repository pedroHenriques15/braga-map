---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 096 · The Rio Este with its real banks, walls and weirs, and the streams drawn

## Why

The Rio Este is a flat sheet of water in a bed cut into the ground, and the streams the map fetches
aren't drawn at all. The real river has granite walls, grassy banks, weirs that whiten the water,
reeds, and a level that the LiDAR measured.

## What

Today: braga-map's tiles hold the water areas and the waterways (`tools/build.mjs:72`, `110-113`);
party-kart draws the river as one water mesh with a rippling normal map (`src/render/city.ts:512-538`),
its bed cut into the land (`src/world/land.ts`); the walls on its banks are task 013's and 077's.
The streams aren't drawn.

1. **The water's level** from the LiDAR's water returns (class 9, or the ground's lowest along the
   river's line), stepping at each weir; the bed's shape from the ground's banks.
2. **The weirs** where the level steps more than 0.3 m (and OSM's `waterway=weir`), drawn as a
   granite sill with white water over it.
3. **The banks** as the ground cover classes them (decision 034): the walls, the grass, the reeds
   (a kind of their own, where the near-infrared says vegetation and the LiDAR says under 2 m by
   the water).
4. **The streams:** every `waterway=stream` in the open world drawn in its bed, open where the
   LiDAR sees it open, culverted where it goes under a street.
5. The water on Ultra: reflections (090), flow along the river's line, foam at the weirs.

## Read first

- `docs/DECISIONS.md` 033, 034, 059; `tools/build.mjs`, `tools/cover.mjs`, `tools/walls.mjs`;
  party-kart's `src/render/city.ts`, `src/world/land.ts`.

## Done when

- [ ] `sao-joao-da-ponte`, `capela-sao-joao` and `liberdade` show the river at its level, with its
  walls and weirs, rated no lower.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.
