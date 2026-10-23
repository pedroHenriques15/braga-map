---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [038]
roadmap: Ultra · Braga at its most real
---

# 099 · The whole map at the open world's detail, and the open world grown over it

## Why

The open world is 3.5 km² round the Volta dos Amigos and the Picoto (decision 019); the rest of the
6.5 × 4.6 km map has its ground every 10 m, its streets as lines, no pavements, walls or ground
cover. The old town, the station and the university are in that rest. At the best quality the whole
map should be the open world.

## What

Today `tools/sections.mjs`: the map's extent x −1600…4900, z −2450…2150, 140 tiles of 500 m; `OPEN`
and `OPEN_TILES` the open world's; FINE tiles (2 m ground) under the tracks, the shooter's area and
the open world. Task 038 streams the tiles, which a bigger world needs.

1. **Every tile FINE:** the ground every 2 m over the whole map (`tools/world.mjs`), and every
   task that's run on the open world's area (streets as surfaces 033, paths 050, walls 013,
   carriageways 026, ground cover 016, roundabouts 014, plates 042) run over the whole map.
2. **The open world's edge** (`tools/open.mjs`, decision 020) moved out to the map's.
3. **The LiDAR at 50 cm** over the whole map (shared with 083), and the cover's 50 cm classes.
4. **Streaming** (038) carries it; measure the download and the build time.

## Questions

- [ ] Grow the map's extent too (past 6.5 × 4.6 km), or the open world to the map's edge only?
  Recommendation: to the map's edge first; growing the extent is a task after it.

## Read first

- `docs/DECISIONS.md` 008, 019, 020; `tools/sections.mjs`, `tools/world.mjs`, `tools/open.mjs`;
  task 038.

## Done when

- [ ] The open world covers the map; the old town's streets are drawn with their pavements and
  walls, and a kart drives them.
- [ ] Every viewpoint shoots as before or better; `npm test` here, `npm test` and `npm run check`
  in party-kart pass.

## Notes

- Status `todo` though it has a question: the recommended answer lets it start.
