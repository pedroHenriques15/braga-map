---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 007]
roadmap: Phase 3 · Surfaces and colours
---

# 016 · The ground from the aerial photos: grass, paving, parking and soil where they are

## Why

Today the ground is painted from OSM's land use: one colour per kind of area (urban, park,
farm…) with grain multiplied in. So a car park, a lawn, a dirt lot and a paved square inside one
"urban" area are all the same beige. DGT's 2025 orthophoto shows what's really on every 25 cm of
ground, and its near-infrared band tells plants from paint.

## What

Today (`../party-kart/src/render/city.ts`, `paintGround`): one canvas over the box, 1 m a pixel
on High, 1.4 on Medium, 2 on Low (at most 4,096 px), land colours per use (`LAND`), roads and
pavements stroked on top, and grain. In the data, ground areas keep their holes filled
(`tools/world.mjs:55`): a clearing in a wood is painted as wood.

1. **Classify the ground** from the orthophoto's RGB and near-infrared (task 005), at 50 cm,
   for the track's box and the shooter's area, into: asphalt, light paving, setts, grass, trees'
   shade, bare soil, gravel, water, and roof (masked by the buildings). The near-infrared's
   NDVI separates plants; the LiDAR's heights separate a roof or a tree from the ground under
   it. Store the classes in the tiles, compressed.
2. **Choose how to draw it,** on one tile, against its viewpoints:
   - **A.** The classes, each drawn with its own texture (a photo of that surface, from task
     008's close-ups), tinted by the orthophoto's local colour. No cars or shadows baked in;
     sharp up close. (Recommended.)
   - **B.** The orthophoto itself, draped, with cars and shadows in it. Real at a distance,
     blurry and wrong up close.
   - **C.** A mix: A near the road, B beyond 100 m.
3. **Draw it** in party-kart through task 007's pipeline, inside the budget (task 004).
4. **Fix the holes:** inner rings of multipolygons are holes (`world.mjs:55`).
5. **Parking:** the car parks the orthophoto shows, with their bay lines (task 018), and where
   it shows parked cars along a kerb, the kerb's parking for task 020.

## Questions

- [ ] A, B or C? Recommendation: decide from a test tile on the scorecard; A is the likely
  winner at kart height and on foot.
  > 

## Read first

- `../party-kart/src/render/city.ts` (`paintGround`, `LAND`, `groundMaterial`).
- `tools/world.mjs` (areas, `:55`), `tools/osm.mjs` (`AREA_OF`).
- Tasks 005 and 007.

## Done when

- [ ] The ground classes are in the tiles for the track's box and the shooter's area.
- [ ] The way to draw it is chosen from a test, and recorded as a decision.
- [ ] The route's viewpoints score higher than the round before, and none lower.
- [ ] The budget (task 004) holds.

## Out of scope

- Road markings and pavements' patterns: task 018. Trees: task 019.

## Notes

- From task 005: `.cache/dgt/ortho/` has the colour orthophoto only (`Ortos2025-RGB`, JPEG, 25
  cm), read by `tools/dgt.mjs`'s `ortho(box)`. The near-infrared is the WMS's `Ortos2025-IRG` layer:
  add it to `fetch.mjs` the same way. The point cloud's points carry near-infrared too.
