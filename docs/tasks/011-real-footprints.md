---
status: todo
priority: high
kind: code
repo: braga-map
created: 2026-10-13
depends-on: [005, 010]
roadmap: Phase 2 · The shape
---

# 011 · Real footprints instead of invented houses

## Why

Of the world's 24,523 buildings, 11,500 are invented: houses and blocks placed every few metres
along built-up streets where OSM has none, with random widths, depths and heights. They fill the
gaps, but they aren't the buildings that are there, and on a street a local knows they're plainly
wrong. The LiDAR sees every real building, and Microsoft's footprints cover central Braga.

## What

Today `tools/world.mjs:148-235` fills frontage on primary to living_street: lots 9–18 m wide,
set back half the street plus the pavement, 85% chance per slot (always on a waypoint's `rows`
street), seeded RNG 4242. A filled building is flagged `filled` in the tiles.

1. **Find the buildings OSM lacks:** rasterise the LiDAR's building class (or MDS − MDT > 2.5 m,
   without vegetation, using the near-infrared) at 50 cm; take out OSM's footprints, grown by
   1 m; keep blobs over 20 m².
2. **Make footprints:** each blob into a polygon, squared to its main directions and simplified
   to 0.3 m. Where Microsoft's footprint (CDLA-Permissive-2.0, task 005) matches a blob, compare
   the two and keep the closer to the LiDAR. Where the orthophoto shows the blob is a tree or a
   lorry, drop it.
3. **Replace the infill:** with real footprints where the LiDAR covers, the invented houses go.
   Outside the LiDAR's cover, keep the infill as it is. The `rows` streets (a waypoint's
   street lined with houses on both sides) take their real buildings too.
4. **Mark the source** of each footprint in the tiles: OSM, LiDAR, Microsoft, or invented.
5. **Give back to OSM?** The new footprints could be added to OpenStreetMap, but a bulk import
   needs the Portuguese community's approval (OSM's import guidelines). Keep them here, and
   list the ones on the route for anyone who wants to map them by hand.

## Questions

- [ ] The waypoints' `rows` streets: keep the extra houses there for the race (a waypoint's
  street lined with houses), or show only what's really there? Recommendation: only what's
  really there, now that the real buildings are known.
  > 

## Read first

- `tools/world.mjs:148-235` (the infill), `:121-146` (real buildings).
- `tools/tracks.mjs` (`rows`), `docs/DECISIONS.md` 004 (privacy).
- Tasks 005 and 010.

## Done when

- [ ] No invented building is left where the LiDAR covers; the count before and after is in
  Notes.
- [ ] Every footprint in the tiles has its source.
- [ ] The route's viewpoints score higher than the round before, and none lower.
- [ ] `npm test` passes.

## Out of scope

- Heights and roofs: task 010. Walls and gardens: task 013.

## Notes

- From task 005: DGT's `MAPACONST-2024` (building outlines from the LiDAR, over 10 m²) is another
  source of footprints, open under CC BY 4.0 in the CDD; not fetched yet. Microsoft's footprints are
  CDLA-Permissive-2.0, confirmed on 2026-10-13 (`docs/SOURCES.md`).
