---
status: done
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

- [x] The open world's poles, bins, bollards and benches are in the tiles, their precision on the
  sample of 50 recorded in Notes: 1,396 pieces in the open world's tiles (`world.furniture`); the
  LiDAR's lamps, signs, traffic lights and shelters 17 right of 50 in the photos; the bins, bollards,
  benches and poles the map's only, as the LiDAR's were none of them right (Notes).
- [x] `npm test` passes: 148 pass, 1 skipped (the scorecard's marks, none waiting), `test/furniture.test.js`'s 4 among them.

## Out of scope

- Drawing them in the game: 020, which takes these with OSM's.
## Notes

### 2026-10-23: what the point cloud sees of the furniture

- **The Why's "the LiDAR saw every pole" is false.** Of OpenStreetMap's 297 lamps in the open world's
  box, 132 stand with no plant over a metre within 3 m; of those, 93 have no point of any class but the
  ground over 3 m within 4 m. A lamp post is seen, where it is, as its head: a scan line's few points
  across its arm at 6 to 11 m, as often classed noise (7) as unclassified (1), the post itself a point
  or none. So the LiDAR finds about one lamp in four, and adds those the map lacks; most stay unseen.
- **The low things can't be told.** At 18 points a square metre (not `docs/SOURCES.md`'s 10) a bench is
  a few points at 0.3 to 0.4 m, an ecoponto's drums two to four clumps at 1.0 to 1.1 m, a container a
  lid a car's size and height. Found by size (446 benches, 3,562 containers, 199 bollards in rows), none
  of the 14 looked at in the photos was one (`refs/furniture.json`'s `low`): 12 nothing of the kind
  (parked cars, a road's concrete parapet, a fence's posts on a wall), 2 not shown. And the orthophoto
  (25 cm) shows no ecoponto's lids in their colours: round 15 of the map's ecopontos, no yellow or green
  pixel, only the pale blue of shadows. So the benches, bins, baskets, ecopontos and bollards are the
  map's only: 66, 59, 51, 107 and 19 in the box. The "poles that carry wires" found on a wire were none
  of them right either (of 16 seen, 5 another piece of furniture, 11 nothing: a parapet's top, wires, a
  pergola's beam, a cedar), so the poles are the map's only too (38).
- **What the LiDAR adds:** 326 lamps, 295 signs, 27 traffic lights and 34 bus shelters the map lacks,
  and the height of 49 the map has (15 lamps, 32 shelters, 2 poles), within 3 m of them. With the map's,
  1,396 pieces round the open world's area. Left out, and why, is `.cache/furniture.json`'s `why`.
- **The sample of 50** (`refs/furniture.json`, `test/furniture.test.js`): the LiDAR's pieces in view of
  a viewpoint's photo or a reference photo within 50 m, not behind a building, drawn at random (seed
  100) and looked at in the photo, ringed where the world has it, in three rounds as the rules were
  tightened (rounds 1 and 2 drawn from earlier rules; the pieces they checked that the rules still find
  kept, the rest drawn again): **17 right (34%), 10 another piece of furniture (a lamp post where it
  said a sign, a sign board, a traffic light's mast), 14 nothing (a parapet's top, a tree, a building's
  glass front, wires), 9 the photo can't tell** (out of its frame, too small, or 5 m from the nearest
  match). Of the 41 the photos show, 41% right and 66% some piece of furniture. By kind: lamps 7 right,
  6 other, 7 wrong, 4 unsure; signs 7, 1, 6, 5; traffic lights 3, 3, 0, 0; the one shelter wrong (a
  garage door). The rules were tuned on rounds 1 and 2's checks, so the share is likely kinder than on
  pieces never looked at; and the photos are from 2010 to 2025, the LiDAR from July 2025. Some of
  round 1's photos didn't show in the session the first time round; their pieces still in the sample
  were looked at again before they were recorded, and those no longer in it were left out of
  `refs/furniture.json`.
- **A sign's face:** 3 read from the photos (two direction signs, a keep-left); else by the map's
  stop (2) and give-way (10) nodes within 15 m, a one-way street's wrong end within 12 m (71), a zebra
  crossing within 8 m (36), a bus stop within 8 m (7); 172 of 301 null, which nothing tells.
- Positions: a lamp's post where the cloud saw a point of it, else its arm's end away from the street,
  laid where the map's buildings round it sit (roofs.mjs's shifts). In the photos the right ones stand
  within a metre or two of where they're ringed.
- New data: OpenStreetMap's furniture nodes (`fetch.mjs furniture`), ODbL like the rest of the map,
  credited where the README credits OpenStreetMap; DGT's LiDAR as before. Mapillary's detections are
  not used (decision 006): its photos only, as references, through `refs/photos.json`.

### 2026-10-23: finished

braga-map 1.34.0 (not tagged). Decision 062. No viewpoint changes (the furniture is in the tiles, not
drawn: task 020 draws it), so no round. The budget: the tiles grow by 57 KB of their 14.4 MB (1,396
pieces as a list of seven numbers each in their headers); what drawing them costs is 020's to measure.
Not checked: the LiDAR's lamps and signs beyond the 50 (most of the box is in no photo), the angles
the pieces face, and the 172 signs whose face is null.
