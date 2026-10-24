---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-18
depends-on: []
roadmap: Phase 3 · Surfaces and colours
---

# 068 · The lawns green as in March, where the 2025 orthophoto has them dry

## Why

What the ground is (task 016, decision 034) takes each kind's colour from DGT's 2025 orthophoto,
taken in summer, when the lawns no one waters were dry: the Via da Falperra's roundabout's island
was beige in it, where every photo of it, and the game's light, a clear afternoon in March (decision
037), has it green. Task 014 found it on the roundabouts' islands and gave their grass a watered
lawn's green (the owner's answer, 2026-10-18); the city's other lawns are still drawn as the summer
left them.

## What

Today (2026-10-18, braga-map 1.27.0):

- `tools/cover.mjs` classes grass by the orthophoto's near-infrared (NDVI over 0.1) and the LiDAR's
  echo (over 9 thousand); a dry lawn's near-infrared is low, so it falls to paving, but in a
  roundabout's island, where ground that echoes over 13 thousand is grass (`LAWN`, task 014). In the
  route's islands the lawns echo 14 to 26, a pavement 7 to 12.
- Each kind's colour is the photo's where it shows that kind (`kindColours`), so a dry lawn classed
  grass is drawn beige: the colours of the grass in the route's islands are (95–125, 115–129,
  102–123) in the cover's colour images, the greenest a watered lawn's (the stadium's pitch, 95,
  115, 102).
- party-kart's land shader tints each kind's photo by that colour (`city.ts`'s `coverShader`); a
  roundabout's island's grass takes `LAWN` instead (`coverMaterial`).

Steps:

1. **Where:** over the open world's area, the ground classed paving or soil that echoes as grass
   (over 13 thousand) and isn't a street's, a path's or a building's, and the grass whose colour is
   drier than a watered lawn's: how much, where, and checked against the orthophoto and the photos
   (a dry lawn, or paving that echoes high: white calçada, concrete).
2. **Classed:** what step 1 shows is a lawn classed grass, as 014 does in the islands.
3. **Coloured:** a lawn's colour in March, not the summer's: the watered lawns' colour in the same
   orthophoto (the stadium's pitch, 014's islands), on every level and at every date (the owner,
   2026-10-24). 093's seasons, on Ultra only, may shift it by the month later.
4. Shoot the viewpoints with lawns in view again.

## Questions

- [x] What green do the dry lawns get: the watered lawns' colour in the same orthophoto, or a
  season's shift by the month (with 093)? Recommendation: the watered lawns', measured, as 014 did.
  > The watered lawns' colour (the owner, 2026-10-24).

## Read first

- `tools/cover.mjs` (`classify`, `LAWN`, `kindColours`), decision 034, task 014's Notes.
- `../party-kart/src/render/city.ts` (`coverShader`, `coverMaterial`, `LAWN`).

## Done when

- [ ] The area's lawns classed grass and drawn green, checked against the orthophoto and their photos.
- [ ] The viewpoints with lawns in view shot again and no worse.

## Out of scope

- The roundabouts' islands: task 014.
- The trees' leaves and their species: tasks 019 and 061.

## Notes

- Found in task 014 (2026-10-18).
