---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-13
depends-on: [009]
roadmap: Phase 2 · The shape
---

# 026 · The track on the real carriageway: its centre line where the street's middle is

## Why

The track's centre line is OpenStreetMap's, and OSM's ways can sit a metre or two off the middle
of the real street. Since task 009 the road takes its heights and its tilt from the LiDAR where
that line is, and the kerbs, pavements and the walls behind them are placed from it, so an offset
now shows. On the Avenida João XXI (about 2 km from the start) the line runs along the left edge
of the carriageway, 1.5 m from a 5.5 m drop to the road beside it, and the 9 m road overhangs the
drop.

## What

Today:

- `tools/track.mjs` makes the centre line from the loop's OSM nodes (simplify, fold the jogs,
  round the corners to `R_MIN`, resample every 2 m, a light blur), and its width from the map
  (`carriageway` in `tools/osm.mjs`), never under `W_MIN` (9 m).
- The heights and `bank` come from a line across the carriageway at each 2 m point, through the
  LiDAR's ground (`cross` in `track.mjs`, task 009): the median of the slopes, which keeps a kerb or
  a drop beside the street from tipping it, but doesn't move the road onto the street.
- `tools/terrain.mjs`'s `terrain()` gives the ground at 50 cm over the track's box, and
  `tools/dgt.mjs`'s `ortho()` the orthophoto at 25 cm (task 005).

Steps:

1. **Find the real carriageway** across the line every 2 m, from the LiDAR: the smooth band of
   ground between the kerbs (a kerb is a step of 10–20 cm, which the 50 cm model shows), checked
   against the orthophoto (asphalt or setts against the calçada's pale stone). Its middle's offset
   from the line, and its width.
2. **Print it:** the offsets' spread along the route, and the worst places, with their streets.
3. **Move the line** onto the carriageway's middle where the offset is over about 0.5 m and holds
   for 30 m or more, smoothly, keeping the corners' radii, the 28 m the loop keeps from itself,
   and the eggs' 44–50 m past their waypoints.
4. **Real widths:** where the measured width is clear, use it instead of the map's guess (still
   never under `W_MIN`).
5. **Check it** in party-kart: the lap tests, and the road's sides against the ground.

## Read first

- `tools/track.mjs` (the centre line, `cross`, the kerbs), `tools/osm.mjs` (`carriageway`).
- `tools/terrain.mjs`, `tools/dgt.mjs` (`ortho`), `tools/relief.mjs` (task 009's check).
- `../party-kart/test/drive.test.ts` (the lap tests), `../party-kart/src/render/city.ts` (`edges`).

## Done when

- [ ] `track.mjs` prints the offset of the line from the real carriageway along the route.
- [ ] Nowhere on the route does the road overhang a drop of more than 1 m that the real street
  doesn't have: checked from the LiDAR across the road's width, and on the Avenida João XXI by
  eye.
- [ ] party-kart's `npm test` and `npm run check` pass, with the lap's summary line before and
  after.

## Out of scope

- Fixing OSM's ways themselves: nobody in the group will edit OSM (task 006's answer).
- The levels where streets cross over and under: task 012.
- The world's other streets, drawn on the ground from OSM: only the track moves here.

## Notes

- Found while doing task 009 (2026-10-13): the LiDAR's cross-section at the Avenida João XXI
  (586, 230) is level from 1.5 m left of the line to 12 m right of it, and 5.5 m lower from there
  to 11 m left.
- **Decision 019 (2026-10-14):** the race runs on the streets' surfaces at their real widths
  (tasks 033 and 037), so this task now moves every street in the open world's area onto its real
  carriageway, and measures its width, not the track's line alone; the track follows the streets.
  `W_MIN` no longer holds (step 4). "Out of scope"'s last bullet no longer holds.
