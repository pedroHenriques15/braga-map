---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 009]
roadmap: Phase 2 · The shape
---

# 010 · Every building's real height and roof, measured from LiDAR

## Why

The skyline and the street's outline are what a local recognises first, and today most heights
are guesses: about 30% of buildings have a height, floors or roof shape in OSM, and the rest get
a random height for their kind (flats 12.6–21.6 m, houses 6.4 or 9.4 m) and a random roof. An
untagged building of 220–1,400 m² becomes a block of 4–7 floors, which is the largest
exaggeration in the data. DGT's 2025 LiDAR measures every roof to about 10 cm.

## What

Today (`tools/world.mjs:121-146`): height from `height`, else `building:levels` × 3 + 0.6,
else random by kind; roof from `roof:shape` (flat, gabled, hipped), else random by kind. Roof
colour is a fixed set of terracotta tones in party-kart; OSM's `roof:colour` (409 buildings) and
`roof:material` (276) are ignored. party-kart draws a hipped or gabled roof only when the
footprint fills more than 72% of its rectangle, at a fixed 27° pitch (`city.ts`,
`buildBuildings`).

Steps:

1. **Heights:** for each footprint, the LiDAR's building points (class 6 in the LAZ) or the
   surface model (MDS) minus the terrain (MDT, task 009) inside it. Take the eaves' height (a
   low percentile of the roof points) and the ridge's (the highest), not the mean.
   Store both in the tiles (`h` as the eaves, a new `ridge`).
2. **Roofs:** from the building points' normals: flat, gabled, hipped, mansard, or several
   parts. Record the ridge's direction and the pitch. Where a building has distinct parts
   (a tower on a block, a stepped terrace), split it into parts (`building:part` in OSM has
   817 in the municipality, to start from).
3. **Roof colour and material:** from the orthophoto (task 005) inside each footprint, taking
   the median colour; terracotta, grey slate, flat gravel, metal, solar panels. Then OSM's
   `roof:colour` where it's tagged.
4. **Check it** against OSM's `height` (63 tagged) and `building:levels` (5,011): the floors
   implied by the LiDAR's height, the outliers listed. Large differences are often a wrong OSM
   tag. Fix those in OSM, where the owner or a friend has an account (task 006).
5. **Draw it** in party-kart: the roof's real shape, direction and pitch, its colour, eaves
   at the measured height. The kind (house, flats) follows the measured height, not a guess.
6. **Floors** for the facades (task 017): the height divided by the type's floor height, so
   windows line up with the real storeys.

## Read first

- `tools/world.mjs:121-146` (kind, height, roof, colour), `index.d.ts` (`Building`).
- `../party-kart/src/render/city.ts` (`buildBuildings`), `textures.ts` (roofs).
- Tasks 005 (the LiDAR) and 009 (the terrain under it).

## Done when

- [ ] Every building in the LiDAR's cover has a measured height and roof, and the tiles say
  which are measured and which guessed.
- [ ] A check prints the difference between the LiDAR's heights and OSM's `height` and floors,
  with the outliers.
- [ ] The route's viewpoints, and the skyline seen from the Picoto, score higher than at the
  baseline.
- [ ] party-kart's tests pass and the budget (task 004) holds.

## Out of scope

- Footprints the map lacks: task 011. Facades: task 017. Landmarks: task 021.

## Notes

- From task 005: DGT also publishes `MAPACONST-2024`, building outlines made from the LiDAR (every
  construction over 10 m²), in the same CDD; not fetched yet (`docs/SOURCES.md`). At the Praça,
  OpenStreetMap lines up with DGT's orthophoto within about 0.5 m (seen at one fountain only):
  measure it more widely before putting OSM's footprints on the LiDAR's heights.
