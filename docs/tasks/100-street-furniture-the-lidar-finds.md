---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 100 · The street furniture the point cloud finds

## Why

Task 020 places the street furniture where OpenStreetMap has it, but OSM has little of it (786
lamps in the whole municipality), and the owner keeps OSM as it is (decision 022, confirmed
2026-10-23): what it lacks is listed, not mapped. The LiDAR saw every pole, sign and bin standing
in July 2025, as it saw the buildings (decision 025) and the walls (decision 033) the map lacks.

## What

Today `tools/walls.mjs`, `tools/trees.mjs` and `tools/cover.mjs` boil the LAZ (whole map, 10
points/m², `docs/SOURCES.md`) into walls, trees and parked cars; nothing finds poles.

1. **Poles:** thin vertical clusters of points over the ground (under 0.4 m across, 2 m to 15 m
   tall, not a tree's trunk under a crown): lamp posts (a head at the top, often over a street's
   edge), traffic-sign posts (a flat plate 2–3 m up), traffic lights (at junctions, with OSM's
   signals), the catenary's masts (097).
2. **Low things:** bollards (0.6–1.2 m, in rows), bins and the ecopontos (their 1.6 m boxes in
   threes, by the cover's colour), benches, bus shelters (with OSM's stops).
3. **Each into the tiles** as task 020's `furniture: [{ kind, x, z, angle, h }]`, with its source
   (`osm` or `lidar`), OSM's where both have it; a test checks a sample of 50 against the reference
   photos, with the share right recorded.
4. **A sign's face** (what it says) can't come from the LiDAR: the reference photos tell it where
   they show it (read, not drawn, 082); else the commonest sign for its place (a stop sign at a
   give-way line's street, a no-entry at a one-way street's wrong end).

## Read first

- `docs/DECISIONS.md` 006 (Mapillary's detections not copied), 022, 025, 033; task 020;
  `tools/walls.mjs`, `tools/cover.mjs`, `tools/dgt.mjs`.

## Done when

- [ ] The open world's poles, bins, bollards and benches are in the tiles, their precision on the
  sample of 50 recorded in Notes.
- [ ] `npm test` passes.

## Out of scope

- Drawing them in the game: 020, which takes these with OSM's.
