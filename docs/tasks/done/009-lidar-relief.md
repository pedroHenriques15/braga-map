---
status: done
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

- [x] The tiles along the route and in the shooter's area carry 2 m terrain from the LiDAR.
  > 18 tiles: every one within 60 m of the Volta dos Amigos, and the shooter's four.
  > `test/relief.test.js` checks each tile the track and the shooter's area are on has a 2 m grid
  > (and the Sameiro's a 10 m one).
- [x] Known points match the LiDAR within 0.3 m.
  > On the 2 m tiles: the Praça 190.60 m in the tile and the LiDAR; the Picoto's top 298.63 m in
  > the tile, 298.89 m in the LiDAR. The Sameiro's top is on a 10 m tile, 0.69 m low. The six
  > bridges' decks are within 0.25 m. `node tools/relief.mjs`, and `test/relief.test.js`.
  > Again on 2026-10-14, on task 027's route: the same three heights, and the six bridges' decks
  > within 0.26 m.
- [x] party-kart's `npm test` and `npm run check` pass, and the lap's summary line is recorded
  before and after.
  > 19 of 19 and `tsc` clean. Before: `laps 235.4, 233.2 s; respawns 0; longest air 0.00 s; top
  > 217 km/h; wall hits 0`. After: `laps 235.3, 233.2 s; respawns 0; longest air 0.00 s; top
  > 217 km/h; wall hits 0`. Again on 2026-10-14 (party-kart `f9bb165`, braga-map v1.2.0, task
  > 027's longer route): 19 of 19, `tsc` clean, `laps 265.6, 263.5 s; respawns 0; longest air
  > 0.00 s; top 217 km/h; wall hits 0`; braga-map's `npm test` 16 of 16.
- [x] The owner judges the places on slopes closer to Braga after than before, on 009's own
  before-and-after page: https://claude.ai/artifact/5uirH2Y8A32ACJsDoEwnJ3 (the Picoto, the Via da
  Falperra, the Avenida Doutor Viriato Amaral Nunes, the Rua do Monte da Forca, the Travessa do
  Couteiro, the Avenida Robert Smith's flyover).
  > Reworded on 2026-10-14 (the owner's choice): the box asked for a higher score than the
  > scorecard's baseline, but the baseline was shot on braga-map v1.2.0, which already has this
  > task's ground, so the scorecard has no round from before it. The owner's baseline marks are
  > this task's "after": `robert-smith-picoto` 4, `falperra` 3, `sameiro` 4, `monte-da-forca` 4,
  > `couteiro` 3, `viriato-amaral-nunes` 1. The owner judged the page on 2026-10-14: the after
  > is closer to Braga at all six.

## Out of scope

- Building heights: task 010. Bridges and tunnels: task 012.

## Notes

- From task 005: the MDT and MDS at 50 cm for the track's box are in `.cache/dgt/` (`node
  tools/fetch.mjs lidar`), and `tools/dgt.mjs` reads them in the map's metres (`heights('mdt',
  box)`). Their heights are above the Cascais datum; whether EU-DEM's are above the same sea level
  is still to check. The models mark a cell's centre as their origin. Braga was flown on 14, 16 and
  21 July 2025.

### Started 2026-10-13

- **Done, in braga-map (uncommitted):** `tools/terrain.mjs` (the ground: the LiDAR's MDT at 50 cm
  where fetched, at 2 m over the rest of the map, EU-DEM beyond), and `fetch.mjs lidar` now also
  gets the MDT at 2 m for the whole map and 200 m round it (48 tiles, 54 MB). `world.mjs`: the
  ground every 2 m on the 18 tiles within 60 m of a track in `tracks/` and over the shooter's area
  (`SHOOTER`, now in `sections.mjs`), every 10 m elsewhere, each the mean of the LiDAR over its
  cell; the far grid and the horizon from the LiDAR where it reaches; each building's ground at its
  lowest corner (`y`, a new field, read by `index.js`); the rivers' level from the lowest ground
  within 4 m of their course. `track.mjs`: heights and `bank` from the LiDAR (below), a `bridge`
  flag. `build.mjs`: the map page's relief from the LiDAR. `tools/relief.mjs` (the check) and
  `test/relief.test.js`. Credits: README, `SOURCES.md`, `map().credit`, the map page.
- **Done, in party-kart (uncommitted, `package.json` points at `file:../braga-map`):** the land's
  mesh of 10 m cells split into 2 m ones where needed (20 m and 4 m on Low), kept under the road
  and pavements; verges at the ground's height beside the road; pavements sloping to the ground at
  their back; granite retaining walls up and skirts down to the ground; a deck under the bridges
  over roads; the road banked as the street is; buildings on `y`. Credits in the README and help.
- **Rebuilding the world:** the same OSM cache gives the same world as before but for the ground:
  areas, lines, trees, sections, landmarks and cover unchanged; buildings unchanged but for `y`.
  The scripts now run page, tracks, world (the world takes its 2 m tiles from the tracks), and all
  three need the LiDAR. Running them twice gives the same files.
- **The datum** (the question from task 005): the LiDAR is on DGT's own sea level, within
  0.15–0.85 m of the geodetic marks on the Sameiro and 0.2 m of Pedroso's (a mark's height may be
  its own, not the ground's: PICOTO 1 stands on the viewpoint's platform, 3 m up), and 0.3–1.1 m
  of the old maps' whole-metre spot heights. EU-DEM is off by more than any datum would be: 34 m
  too low on the Picoto's top, 11 m on the Sameiro's, 2 m too high along the route on average.
- **Known points** (`node tools/relief.mjs`): the Praça 190.60 m, tile 190.60; the Picoto's top
  298.89, tile 298.63 (2 m tile); the Sameiro's top 573.17, tile 572.48 (a 10 m tile).
- **The track:** heights 153–221 m (157–221 before), steepest 19.3% (13.0%), sharpest crest
  radius 103 m (340 m). Smoothed over about 10 m (two Gaussian blurs of σ 5 m), not 50 m. A third
  of the route tips sideways by more than 2%, 5% of it at the 8% limit (the Avenida Doutor Viriato
  Amaral Nunes really tips 10%). The tilt is the median of the slopes across the carriageway: a
  plain line fit was thrown by drops and flyovers beside the street. Six bridges are crossed
  straight, and each one's middle is within 0.25 m of the LiDAR's points on its deck; two of them
  (the Avenidas Doutor António Alves Palha and Robert Smith) stand 7 m over the road below, where
  the bare ground would have dropped the track 7 m.
- **DGT's point cloud classes bridge decks 26,** not 17 (the LAS standard's): no point is 17 in
  the tiles counted. `CLASS.bridge` and `SOURCES.md` say so now.
- **The lap:** `laps 235.4, 233.2 s; respawns 0; longest air 0.00 s; top 217 km/h; wall hits 0`
  before, `laps 235.3, 233.2 s; respawns 0; longest air 0.00 s; top 217 km/h; wall hits 0` after.
  party-kart's `npm test` 19 of 19 and `npm run check` pass; braga-map's `npm test` 10 of 10.
- **What it costs (for task 004):** the land and verges, before and after, in triangles: High
  173k → 352k, Medium 173k → 317k, Low 43k → 117k; the start view 885k → 1,065k on High. The
  city takes about 0.6 s longer to build. The world is 5.8 MB (2.0 MB gzipped), was 2.7 MB (1.2);
  the track's 48 tiles 4.1 MB (1.2 MB gzipped). Most cells split are for detail near the road:
  the city's ground has walls, terraces and steps everywhere; the splits that keep the land under
  the road and verges cost about 55k on High.
- **The viewpoints** can't be scored yet (no tasks 001–003): six places shot before and after,
  for the owner, at https://claude.ai/artifact/5uirH2Y8A32ACJsDoEwnJ3 (private).
- **Not done here:** the Avenida João XXI's carriageway is 1.5 m from a 5.5 m drop to the road
  beside it, and the map's centre line runs along that edge, so the track overhangs the drop:
  task 026 (drafted). The retaining walls are plain granite (task 013), the flyovers' decks plain
  slabs (task 012).
- **Released** on 2026-10-13: braga-map `78c56db`, tagged `v1.1.0`; party-kart `8a97f32`, on it,
  deployed to https://pedrohenriques15.github.io/party-kart/. The peer id prefix is `pk29` (the
  track changed: its heights, its banks), so players on the old build must reload to race.
- **Left for the owner:** the last box above, judged on the before-and-after page; then the task
  moves to `done/` and 009 comes off the roadmap.

### Picked up 2026-10-14

- The scorecard (task 003) now exists, but it can't judge this task: its baseline round
  (`2026-10-13-baseline`, party-kart `ac47bf0`, braga-map v1.2.0) already has the LiDAR ground. A
  round from before 009 would mean bringing back EU-DEM and the 4 m flattening that are no longer
  in either repo, at viewpoints whose heights are set on the new ground. The owner chose to judge
  the task on its own before-and-after page instead, and the last box now says so.
- The before-and-after page is shared with anyone who has the link now, not private as it was
  when it was published.
- When the owner has judged: `/task finish 009`. Its round is the baseline itself (shot after
  this task), so there's no new round to shoot or post. The budget it changed was measured in
  task 004.

### Finished 2026-10-14

- **The round:** none new. The scorecard's baseline (`2026-10-13-baseline`) was shot after this
  task, and nothing it shows has changed since: party-kart's only change to `src/` since `ac47bf0`
  is `?stats`, which is off in a shot, and braga-map's since v1.2.0 is `tools/round.mjs`. So
  the baseline is this task's "after".
- **The budget:** task 004 measured today's city, ground and all, and set the budget from it
  (decision 013).
- **The docs:** the README, `SOURCES.md`, decision 008 and the roadmap's "What's there" were
  written at the release. Now 009 is off the roadmap's Phase 2.
