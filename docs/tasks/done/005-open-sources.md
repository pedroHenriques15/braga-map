---
status: done
priority: critical
kind: code
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 005 · The open sources: LiDAR, aerial photos and reference photos, fetched and on record

## Why

The map knows only what OpenStreetMap says, and OSM gives a height or floors to about a fifth of
Braga's buildings, few walls, and no colours. Braga has much better open data than the map uses:
DGT's LiDAR survey and orthophotos, both flown in 2025 and both CC BY 4.0. They give the real
ground, every building's height and roof, every tree, the colour of every roof and pavement.
Most of Phases 2 and 3 depend on them. The relief in use today also owes a credit that the README
doesn't give. That's why this is `critical`.

## What

Researched on 2026-10-13, each checked at the URL given (decision 006 says what may be used for
what):

- **DGT LiDAR 2025.** Central Braga was flown 14–16 July 2025. Products:
  - a classified point cloud (LAZ, about 10 points/m² nominal, 17.6 M per km² in the tile
    checked), each point with RGB and near-infrared, classed as ground, low/medium/high
    vegetation, building, water and bridge;
  - a terrain model (MDT) and a surface model (MDS) at 50 cm and 2 m (Float32 GeoTIFF,
    EPSG:3763).

  Sizes: about 16–19 MB per km² for a 50 cm model, and about 112 MB per km² of LAZ. Tiles are
  1 km, with ids like `LO-176510-07-2025`. Tile index:
  `https://dgt-be.a.incd.pt:8081/collections/{MDT-50cm|MDS-50cm|LAZ}/items?bbox=…`. Download
  through the CDD (https://cdd.dgterritorio.gov.pt), with a free account. Licence CC BY 4.0
  (SNIG record 077a8c94…). (The collection's description still says the north-west is
  unavailable; Braga's tiles are there.)
- **DGT Ortofotos 2025,** 25 cm, RGB and near-infrared, flown 31 March–26 July 2025.
  Cloud-optimised GeoTIFFs of 8 × 5 km; four cover the city. WMS
  `https://cartografia.dgterritorio.gov.pt/wms/ortos2025` (layers `Ortos2025-RGB`,
  `Ortos2025-IRG`). Tile index `https://dgt-be.a.incd.pt:8081/collections/ORTOS-2025/items`.
  Licence CC BY 4.0 (SNIG record 96d83932…; the tile index's "proprietary" contradicts the
  official metadata and https://www.dgterritorio.gov.pt/dados-abertos).
- **DGT COS2025** (land use, vector, 93 classes, 1 ha minimum) and **COSc2025** (10 m raster,
  CC BY 4.0, `https://geo2.dgterritorio.gov.pt/cosc/COSc2025.zip`).
- **Wikimedia Commons:** thousands of photos of the landmarks (Bom Jesus 2,734; the Sé 1,775;
  the Sameiro 319; the Theatro Circo 273; the Estádio Municipal 223; the Parque da Ponte 214),
  each under its own free licence. Portugal's freedom of panorama covers buildings and
  sculptures in public places, naming the architect where possible.
- **Microsoft's building footprints** (CDLA-Permissive-2.0, 2026-08-13): 17,725 in central
  Braga, no heights. For task 011.
- **Mapillary:** street-level photos, CC BY-SA, through an API that needs a free token.
  Coverage of Braga wasn't checked (no token). Its detected map features (signs, lamps) are
  under Mapillary's own revocable terms, not an open licence.
- **The relief in use:** AWS Terrain Tiles at zoom 14 are a 7 m grid, but over Braga they're
  made from **EU-DEM** (about 25–30 m, from 2017), which requires the credit "Europe terrain
  data produced using Copernicus data and information funded by the European Union - EU-DEM
  layers". The README doesn't give it.

Steps:

1. **Credit the relief now:** add the EU-DEM credit to `README.md` (Credits) and to
   `world/base.js`'s `credit`, and tell a party-kart session to add it where the game credits
   OpenStreetMap.
2. **`docs/SOURCES.md`:** every source above, with what it is, its date and resolution, its
   access, its licence and the exact credit, and what decision 006 allows it for. Each later
   task that adds a source adds it here.
3. **Account and token** (the owner's): a free CDD account at DGT, and a Mapillary client token.
   Both kept out of git, in `.cache/credentials.json` or environment variables.
   First check whether the tile index's asset links download without an account; if they do,
   the CDD account isn't needed.
4. **Fetch** in `tools/fetch.mjs`, as new parts (`node tools/fetch.mjs lidar`, `ortho`):
   - the LiDAR's MDT and MDS at 50 cm for the track's box (`tracks/amigos.js`, about
     3.3 × 2.6 km) and the shooter's area, and its LAZ for the shooter's area and the route's
     corridor (200 m each side). That's about 150 MB per model and up to about 1 GB of LAZ, all
     into `.cache/`, which git ignores;
   - the orthophoto for the same box, cut from the COGs by range requests (or from the WMS at
     25 cm, 1 km tiles, if the COGs need the account);
   - COS2025 for the map's extent.
5. **Read them** with as few dependencies as possible, as dev dependencies only (nothing ships
   to games): `geotiff` (GeoTIFF/COG), `proj4` (EPSG:3763 to WGS84, then `geo.mjs`'s `P`),
   and `laz-perf` for the point cloud. Add a check in `test/` that a known point (the Praça da
   República) lands at (0, 0) within 1 m, from both the orthophoto and the LiDAR.

## Questions

- [x] Will the owner make the free DGT (CDD) account and the Mapillary token, if step 3 shows
  they're needed? Recommendation: yes; both are free and take minutes.
  > 2026-10-13: step 3 showed the LiDAR needs the account and the orthophoto doesn't (its WMS is
  > open). The owner makes the CDD account, kept as `{ "cdd": { "username", "password" } }` in
  > `.cache/credentials.json`; `fetch.mjs` logs in itself. The Mapillary token isn't needed here:
  > it's left to task 001, which uses Mapillary's photos.

## Read first

- `tools/fetch.mjs`, `tools/geo.mjs` (`P`, `unP`, `ELEV0`, the relief), `README.md` (Credits).
- `docs/DECISIONS.md` 006: what each source may be used for.

## Done when

- [x] The README and `world/base.js` give the EU-DEM credit.
  > README's Credits gives it in full, and `map().credit` (from `world/base.js`) is "… Relief:
  > Terrain Tiles (AWS Open Data). Europe terrain data produced using Copernicus data and
  > information funded by the European Union - EU-DEM layers." The map page gives it too, and
  > party-kart's README and help (in another session, uncommitted there).
- [x] `docs/SOURCES.md` lists every source with its licence, credit and allowed uses.
  > Eight sources, each with its licence, credit and what it may be used for; the owner's photos,
  > CartTop NdD2 and the sources never to use are there too.
- [x] `node tools/fetch.mjs lidar` and `node tools/fetch.mjs ortho` fill `.cache/` for the
  track's box and the shooter's area.
  > Orthophoto, MDT and MDS: 20 of 20 tiles under the track's box, which holds the shooter's
  > area's 2. LAZ: the route's 8 tiles (200 m each side) and the Praça's. Every file's size
  > matches DGT's record (`.cache/dgt/lidar.json`).
- [x] The test places the Praça da República at (0, 0) within 1 m from both sources.
  > `test/sources.test.js`, `npm test` 6 of 6: the orthophoto at (0.000, −0.001) m and the point
  > cloud at (−0.14, −0.01) m from DGT's own projection of (0, 0); a planted 2 m error fails
  > both.

## Out of scope

- Using the data: tasks 009 (relief), 010 (heights), 011 (footprints), 016 (ground), 019
  (trees).
- Mapillary's photos for the viewpoints: task 001.

## Notes

- DGT's national topographic mapping (CartTop NdD2, through the new BDNC portal) is due as open
  data in 2026, with each building's height (`alturaEdificio`), street furniture and signs, and a
  3D part from the LiDAR. When it's out, it may replace parts of tasks 010, 011 and 020: check
  for it before starting them.
- Braga's BRT (a €35 M tender, June 2025) will change streets near the station, the university
  and the hospital. The 2025 data shows them before it.

### Finished 2026-10-13

- **No viewpoints to shoot again, no budget to check:** the task changes nothing a game draws
  (only the credit's text), and tasks 001–004 don't exist yet.
- **Docs:** README (Credits and the scripts), `docs/SOURCES.md` (new), `docs/DECISIONS.md` 007,
  `docs/ROADMAP.md` (the data's status; 005 off Phase 1). Notes for what 005 found added to tasks
  009, 010, 011, 016 and 019, and task 001 now asks for the Mapillary token itself.

### Started 2026-10-13

- **Done:** the EU-DEM credit (README, `tools/world.mjs` and so `map().credit`, and the map page's
  `tools/build.mjs` and `map/index.html`); `docs/SOURCES.md`; `tools/dgt.mjs` (EPSG:3763 ↔ the
  map's metres, the models, the orthophoto and the point cloud); `fetch.mjs`'s `lidar`, `ortho`
  and `cos`; `test/sources.test.js`. All three parts ran (`ortho` 54 MB, `cos` 18 MB, `lidar`
  1.79 GB), and both halves of the test pass (`npm test`: 6 of 6).
- **The CDD's downloads and Node's `fetch()`:** with the owner's account the login worked, but
  every download link answered `500 Internal Server Error`, for every collection, while the
  owner's browser downloaded a tile fine. The cause: `fetch()` adds `sec-fetch-mode: cors` to
  every request and can't be told not to, and the CDD answers a download with that header with a
  500 (tested header by header). `fetch.mjs` makes the CDD's requests with `node:https` instead.
  Also learned: each link works once (a second use answers `403 Expired token or file not
  found`), so a retry asks for a fresh one; and the CDD sends the link on to the file's signed
  link on DGT's storage.
- **The flight dates:** DGT's "Modelos Digitais do Relevo" page gives the survey's acquisition as
  April 2024 to March 2025, but the points' GPS times say Braga was flown on 14, 16 and 21 July
  2025 (tiles `-25_209`, `-24_208`, `-23_207`), in the afternoon, so What was right. The same page
  gives the heights' datum: Cascais.
- **The LiDAR's half of the test** matches the point cloud's own colours (of the ground) against
  DGT's cut. They were photographed on those July afternoons, so their shadows aren't the
  orthophoto's: the darkest quarter of each picture is left out, which takes the match from 0.49
  to 0.76. Measured: the point cloud puts the Praça at (−0.14, −0.01) m, the surface model sits
  (−0.015, 0.001) m off the points, and the terrain model is 0.022 m from the ground's points on
  average, over 13,775 half-metre cells. A planted 2 m error is caught. The test takes 10 s, most
  of it decoding the Praça's 17.5 M points.
- **Fetched:** `node tools/fetch.mjs lidar` ran in about 10 minutes: MDT-50cm 20 tiles (369 MB),
  MDS-50cm 20 (378 MB), LAZ 9 (1,044 MB), each file's size matching DGT's record.
- **DGT's models mark a cell's centre as their origin** (`GTRasterTypeGeoKey` 2), seen in the
  owner's 2 m tile; `tools/dgt.mjs` reads both kinds.
- **The relief really is EU-DEM:** every one of the 24 Terrain Tiles fetched says
  `eudem/eudem_dem_5deg_n40w010.tif` in its `x-amz-meta-x-imagery-sources` header, though Joerd's
  documentation table says SRTM at zooms 11 and 14.
- **`world/base.js` and `map/braga.json` were not rebuilt.** `.cache/osm/` holds only
  `admin.json`, and a new OSM fetch would change the world and the tracks. Only their credit was
  swapped for the one the scripts now write (a re-encode that leaves every number as it was).
  The next `npm run world` and `npm run page` write the same.
- **party-kart:** a party-kart session added the credit (passed on by the owner, since party-kart-49
  refused cross-session messages): the full wording in `README.md`, and "Relief: EU-DEM, produced
  using Copernicus data and information funded by the European Union" in `src/main.ts`'s help.
  Uncommitted, in with party-kart's move to the braga-map package. The game types the credit
  itself rather than reading `map().credit`, so if braga-map's wording changes, change it there
  by hand too.
- **Step 3:** the LiDAR's files answer 403, and the CDD's links redirect to its login: the
  account is needed. The orthophoto's COGs answer 403 too, but the WMS is open, so `ortho` uses
  it, as the task allowed. Mapillary isn't fetched here: its token waits for task 001.
- **Where this differs from the task's estimates:** whole 1 km tiles make the 50 cm models about
  320 MB each (20 tiles), not 150 MB. The LAZ is 9 tiles, about 1.07 GB: the 8 the route's
  corridor and the shooter's area need, and the Praça's, which the test needs and the route
  doesn't touch. COS2025 comes from DGT's OGC API as vectors, so the 190 MB COSc2025 zip isn't
  needed.
- **One more dev dependency:** `jpeg-js`, to read the orthophoto's JPEGs. The WMS's PNG has only
  256 colours, and its TIFF is uncompressed, 18 times the size.
- **The projection over a tile** isn't straight enough for an affine: one is 14 cm out across a
  kilometre. `tileToMap` fits a curve through 3 × 3 exact points instead, within 0.001 mm.
- **The test's reference** is a cut DGT's own server projects into latitude and longitude, so it
  doesn't depend on `tools/dgt.mjs`. The orthophoto's shift measures (0.000, −0.001) m. A planted
  2 m error is caught, and a planted 0.6 m one is measured as 0.61 m.
- **OpenStreetMap lines up with the orthophoto at the Praça:** OSM's ring for the Chafariz (way
  132951673) sits on the basin's rim within about 0.5 m. Seen at one place only; tasks 010 and
  011 should measure it more widely.
- **Found for later tasks:** DGT's `MAPACONST-2024` (building outlines from the LiDAR, for 010
  and 011), COPC (the point cloud, range-readable), and in the OGC API the trees of public
  interest (`srup_arvores_point`, for 019) and contour lines.
