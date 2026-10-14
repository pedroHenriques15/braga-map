---
status: doing
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
   street lined with houses on both sides) take their real buildings too, and keep no invented
   house: only what's really there (the owner's answer, below).
4. **Mark the source** of each footprint in the tiles: OSM, LiDAR, Microsoft, or invented.
5. **Keep them here.** They aren't given back to OpenStreetMap: a bulk import needs the
   Portuguese community's approval (OSM's import guidelines), and nobody in the group will map
   them by hand (task 006's answer).

## Questions

- [x] The waypoints' `rows` streets: keep the extra houses there for the race (a waypoint's
  street lined with houses), or show only what's really there? Recommendation: only what's
  really there, now that the real buildings are known.
  > Only what's really there (2026-10-14).
- [x] The real buildings take party-kart past the budget (task 004, decision 013): Low 0.583 M
  triangles of 0.55, Medium 0.933 of 0.9, High 1.117 of 1.1, and 1.56 MB to download of 1.5, and
  even trimmed hard they stay over. Trim (straighter outlines, no strips under 4 m wide or sheds
  under 40 m²) and raise the budget by what's left; keep them all and raise it; or stay inside it,
  with a party-kart task to draw far buildings simpler? Recommendation: trim, then raise.
  > Keep them all, and raise the budget (2026-10-14). Then: the budget shouldn't be a hard
  > constraint; the games can move to a stack that scales better, or to the owner's homelab
  > server, if need be. No phone check: decision 017, the budget is a guide, not a limit.

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
- From task 001 (2026-10-13): invented houses stand in real streets, where the photos show road,
  a wall or a landmark. In the game the camera stands inside one at `sao-joao-da-ponte` (on the
  roundabout) and `alameda-fujacal`; one stands in the street 6 m ahead at `lobato-east`, others
  where the photo shows a painted wall at `viriato-amaral-nunes` and in front of the stadium at
  `estadio`. They're the viewpoints to look at first; `refs/viewpoints.json` has them.
- From the scorecard's baseline (task 003, 2026-10-13): the owner's comment at `lobato-east`,
  rated 3, is "Edifícios e lugares de estacionamento": the buildings, and the parking along the
  street (task 020).

### Started 2026-10-14

- **Started with 010 not closed:** its work is released (braga-map `v1.4.0`, `tools/roofs.mjs` and
  its rasters); only its scorecard round and docs are left, which this doesn't need.
- **Done, in braga-map (uncommitted):** `tools/footprints.mjs`, the geometry: what's under 2.5 m
  across cleared (an opening by a 5-cell square), groups of 20 m² or more, each traced round its
  own cells as they were before the clearing (so a turned building keeps its corners), and squared:
  its staircase straightened (Douglas-Peucker), the walls within 15° of its main way or across it
  made exactly so, walls in line made one, steps between parallel walls kept, a short wall at an
  angle between two that meet dropped, and each corner where two walls meet; tried at 0.6, 1 and
  1.5 m, else the staircase simplified at 0.8 m. `tools/roofs.mjs` runs it on every tile of the
  point cloud (with 100 m of its neighbours), on the LiDAR's building cells less the map's outlines
  (each laid where its square's shift says), then measures each footprint as the map's are, into
  `.cache/roofs.json`'s `found`, with `seen` (the tiles the LiDAR covers) and `dropped`.
  `node tools/roofs.mjs --lacking` does only this step (5 minutes). `tools/world.mjs` draws them
  (a part each, each part of its own kind and facade colour), and invents no house where the LiDAR
  covers (the old infill stays for where it doesn't); the Tourigalo's `OPEN` box is gone. The tiles
  say each footprint's source (`what`: measured at bit 12, the source at bits 13–14), `index.js`
  gives `source` (`filled` is `source === 'invented'`). `node tools/fetch.mjs microsoft`.
  `test/footprints.test.js` (made-up buildings: a turned house, an L, a block, a wall and a shed;
  and the world's tiles). The map page shows them ("Encontrados"). README, `docs/SOURCES.md`.
  `npm test`: 31 of 31.
- **What it found:** 7,251 buildings the map lacks, 1.72 km² of roof, 15,532 parts; 6,249 outlines
  squared, 1,002 left as the cells step. Not buildings: 304 under 2 m tall, 20 green in the photo,
  8 the size of a lorry. Whole blocks of the old town have no building on the map (south of the
  Avenida Central, by the Praça: one building there in `buildings.json`), so the game had nothing
  there; they're the LiDAR's now, a block as one building in parts where its roofs step. Many are
  strips along a building the map has, 2.5–5 m wide: the rest of it, where the map's outline is too
  narrow (seen in Fujacal: a row of flats whose outlines miss their east 5 m, 17 m tall). They're
  kept: the street side ends where the building does.
- **Invented, before and after:** 11,492 of the tiles' 30,854 buildings and parts before; none
  after, in 34,856 (19,362 the map's, 15,494 the LiDAR's). The LiDAR covers the whole map (42 of
  42 tiles), so nothing is invented anywhere.
- **Microsoft's outlines:** fetched (12,219 in the box) and compared with each building found: they
  sit 1.7 m off the LiDAR's buildings (the median shift), and none lay closer over its cells than
  the outline squared from them, so none is used and no credit is owed. Kept in the code, as the
  task asks.
- **The stadium's stands:** the LiDAR has them as building and the map doesn't, but party-kart draws
  the Estádio 1.º de Maio as a sight, terraces and stand: found buildings inside its grounds
  (`leisure=stadium`) are left to it (2). Its small covered stand's roof is ground in the LiDAR
  (built into the slope), so nothing is lost there. Bom Jesus's and the Sameiro's are over 2 km
  from the route, where party-kart draws no building.
- **Viewpoints seen so far** (a round shot in a copy of party-kart `31dcce9`, outside its checkout,
  with this braga-map in its `node_modules`: `shots/2026-10-14-task011` there, not posted):
  `alameda-fujacal` no longer stands inside an invented house, the alameda open as in the photo;
  `lobato-east` has no house in the street. Not yet posted as a round on the scorecard.
- **party-kart on it:** `npm test` 24 of 24, `npm run check` clean (in the copy).
- **Over the budget (task 004):** every viewpoint holds more triangles: High 1.061 → 1.117 M
  (budget 1.1), Medium 0.877 → 0.933 M (0.9), Low 0.549 → 0.583 M (0.55); draw calls (178, 178,
  162) and textures unchanged. The download: 1.56 MB gzipped (`scripts/download.mjs`; the tiles
  1.13 → 1.25 MB), over 1.5. Within 300 m of the route the found buildings are 2,297 parts with
  20,038 corners where the invented houses were 1,671 with 6,684: the real city is denser and its
  outlines aren't boxes. Trimming hard (outlines at 0.8 m, no building under 40 m², no part under
  4 m wide) leaves 11,586 corners, still over. The owner keeps them all: the budget is a guide, not
  a limit (decision 017, the question above).
- **Left for `/task finish`:** the round posted on the scorecard and rated (the shots are in the
  copy of party-kart, so they're shot again in party-kart itself once it's pinned); braga-map
  released as 1.5.0 (the tiles' format changed) and party-kart pinned to it; party-kart's
  `docs/architecture.md`, "The city's budget": what the city costs now, and decision 017 in place
  of "a change may not take the city past it"; `ROADMAP.md`.
