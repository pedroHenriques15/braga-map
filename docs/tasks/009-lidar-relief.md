---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005]
roadmap: Phase 2 · The shape
---

# 009 · The relief from LiDAR, and the road meeting the ground as it really does

## Why

Braga is hilly, and its slopes are part of how it feels: the climb to the Picoto, streets that
tip sideways, houses stepped up a hill. Today's relief comes from EU-DEM, about 25–30 m data
resampled to 7 m, and the game flattens the ground 4 m either side of the road and blends it back
over 30 m. Slopes near the track are smoothed away, and a building can float or sink. DGT's 2025
LiDAR gives the bare ground every 50 cm, accurate to about 10 cm.

## What

Today:

- `tools/fetch.mjs` gets Terrarium tiles at zoom 14 (map) and 11 (horizon); `tools/geo.mjs`
  decodes them. `ELEV0` is 154 m.
- The world tiles carry the terrain every 10 m (51 × 51 per 500 m tile, decimetres,
  `tools/world.mjs:410-412`); a 50 m far grid and a 250 m horizon in `world/base.js`.
- The track's heights are sampled from it and blurred twice over 25 samples
  (`tools/track.mjs:366`).
- party-kart flattens the ground near the road (`city.ts`, `smooth(4, 30, d)`). Buildings and
  trees carry no ground height of their own (`index.d.ts`).

Steps:

1. **The terrain from the LiDAR's MDT** (50 cm, task 005): resample it to the world's grid. Keep
   10 m in most tiles; use 2 m in the tiles along the route and in the shooter's area (or 1 m
   there, if the budget allows). Store it in the tiles as now, with the step in the header.
   Outside the LiDAR's cover, keep Terrain Tiles.
2. **Check it:** the heights of a few known points (the Praça da República, the Picoto's
   summit, a bridge's deck) against the LiDAR and against published heights; the difference
   from today's relief along the route, printed as a profile.
3. **The track's heights** from the new terrain, blurred only as much as karts need: compare
   the grades and crests (`track.mjs:374-382`) before and after, and keep the lap tests
   passing.
4. **The road in its ground,** in party-kart: the cross-slope a street really has, kerbs and
   pavements following the real ground, and the ground meeting the pavement's edge without the
   4 m flattening. Where a street is cut into a slope, a retaining wall (task 013 draws them).
5. **Each building on its ground:** the ground's height under its footprint (lowest corner),
   so stepped streets step.
6. **The horizon:** Copernicus DEM or EU-DEM beyond the LiDAR's cover, with its credit.

## Read first

- `tools/geo.mjs`, `tools/world.mjs:349-421`, `tools/track.mjs:340-382`, `index.js`
  (`heightOn`, `loadWorld`).
- `../party-kart/src/render/city.ts` (the ground), `road.ts` (kerbs, pavements).
- `../party-kart/test/drive.test.ts` (the lap tests).

## Done when

- [ ] The tiles along the route and in the shooter's area carry 2 m terrain from the LiDAR.
- [ ] Known points match the LiDAR within 0.3 m.
- [ ] party-kart's `npm test` and `npm run check` pass, and the lap's summary line is recorded
  before and after.
- [ ] The viewpoints on slopes (the Picoto, the Via da Falperra) score higher than at the
  baseline.

## Out of scope

- Building heights: task 010. Bridges and tunnels: task 012.

## Notes

- From task 005: the MDT and MDS at 50 cm for the track's box are in `.cache/dgt/` (`node
  tools/fetch.mjs lidar`), and `tools/dgt.mjs` reads them in the map's metres (`heights('mdt',
  box)`). Their heights are above the Cascais datum; whether EU-DEM's are above the same sea level
  is still to check. The models mark a cell's centre as their origin. Braga was flown on 14, 16 and
  21 July 2025.
