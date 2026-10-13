# Sources

Every source the map uses or may use: what it is, how it's had, its licence, the exact credit it
owes, and what [decision 006](DECISIONS.md) allows it for. Checked on 2026-10-13 unless it says
otherwise. A task that adds a source adds it here, and puts its credit in the README's Credits and
in each game, where it credits OpenStreetMap.

## The credits owed

Wherever the map, or anything drawn from it, is shown (a game, its help, its README):

- **Always:** "© OpenStreetMap contributors" (ODbL), and for the relief: "Terrain Tiles (AWS Open
  Data). Europe terrain data produced using Copernicus data and information funded by the
  European Union - EU-DEM layers." `map().credit` gives both.
- **Once anything made from DGT's data is in the world or a game:** "Informação geográfica
  cedida pela Direção-Geral do Território" (CC BY 4.0). Nothing is, yet: task 005 only fetches
  it.

## In use

### OpenStreetMap

- **What:** the streets, buildings, land use, trees, rivers, railway, crossings, traffic lights,
  bus stops, landmarks and parishes. The world's `osmTime` says when it was fetched (now
  2026-10-13).
- **Access:** the Overpass API, no account (`node tools/fetch.mjs`).
- **Licence:** Open Database Licence 1.0. The world, the tracks and the map page's data are
  derived from it, and stay under the ODbL.
- **Credit:** "© OpenStreetMap contributors".
- **May be used for:** everything.

### Terrain Tiles, made from EU-DEM

- **What:** the relief. Terrarium PNG tiles at zoom 14 (about 7 m a pixel) over the map and zoom
  11 (about 60 m) for the horizon. Over Braga all 24 tiles fetched are made from one EU-DEM file,
  `eudem/eudem_dem_5deg_n40w010.tif` (each tile's `x-amz-meta-x-imagery-sources` header says so;
  Joerd's documentation, which says SRTM at these zooms, is wrong here). So the real detail is
  EU-DEM's: a model about 25–30 m a cell, made from satellite data, which smooths away anything
  smaller than a block.
- **Access:** `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, AWS Open
  Data, no account. Made by Mapzen, and no longer updated.
- **Licence:** EU-DEM is Copernicus data: free and open, with its credit. Terrain Tiles ask for
  their sources' credits ([attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)).
- **Credit:** "Europe terrain data produced using Copernicus data and information funded by the
  European Union - EU-DEM layers", with "Terrain Tiles (AWS Open Data)".
- **May be used for:** everything. Task 009 replaces it with the LiDAR near the route.

## Fetched, not used yet

Into `.cache/dgt/`, which git ignores ([decision 007](DECISIONS.md)), by `node tools/fetch.mjs
lidar ortho cos`. They're read by
`tools/dgt.mjs`; `test/sources.test.js` checks they're in the right place on the map.

All of DGT's data is in EPSG:3763 (ETRS89 / Portugal TM06). `tools/dgt.mjs` takes ETRS89 as
WGS84, as EPSG's own transformation between them (1149) does, and DGT's own server does the same:
its latitude-and-longitude picture of the Praça and the map's reading of its tiles agree to the
millimetre (the test).

### DGT's LiDAR, 2024–2025

- **What:** DGT's national LiDAR survey. DGT's "Modelos Digitais do Relevo" page gives April 2024
  to March 2025, but the north-west came later: the points' GPS times say Braga was flown on 14,
  16 and 21 July 2025, in the afternoon (13:00–19:30 UTC; three tiles checked). Heights are above
  the Cascais datum (Datum Altimétrico de Cascais). On DGT's 1 km tiles of EPSG:3763:
  - the classified point cloud (`LAZ`): LAS 1.4, point format 8, each point with its colour and
    near-infrared, classed as ground (2), low, medium and high vegetation (3–5), building (6),
    noise (7), water (9) and bridge (17). About 10 points/m² nominal; the tile at the Praça has
    17.6 M points;
  - the terrain model (`MDT-50cm`, the ground) and the surface model (`MDS-50cm`, the tops of
    roofs and trees), Float32 GeoTIFF at 50 cm, −999 where empty. They come at 2 m too.
  - DGT also publishes the cloud as COPC, a building map made from it (`MAPACONST-2024`,
    every construction over 10 m², for tasks 010 and 011) and a 10 m terrain model. Not fetched.
- **Access:** the tile index is open, at `https://dgt-be.a.incd.pt:8081/collections/{MDT-50cm|MDS-50cm|LAZ}/items?bbox=…`
  and the CDD's own `https://cdd.dgterritorio.gov.pt/dgt-be/v1/search`. The downloads need a free
  account at the CDD (https://cdd.dgterritorio.gov.pt). The files' own links answer 403. The
  CDD's links send you to its login (Keycloak); once logged in, each link works once, sending you
  on to the file's signed link on DGT's storage. The session cookie lasts half an hour.
  `fetch.mjs` logs in with the owner's account, kept out of git in `.cache/credentials.json` as
  `{ "cdd": { "username", "password" } }`, the way the community's QGIS plugin that DGT links to
  does. It doesn't use Node's `fetch()` for the CDD: that adds `sec-fetch-mode: cors` to every
  request, and the CDD answers a download that has it with a 500. The CDD's map allows 200 tiles
  or 200 km² a selection.
- **Licence:** CC BY 4.0: SNIG record `077a8c94-8b46-4a8a-8796-0d7fc4662f0c`, "Acesso público
  sem restrições" and "Licença de utilização - CC-BY-4.0". The tile index says "proprietary" for
  every collection; the official metadata and https://www.dgterritorio.gov.pt/dados-abertos say
  CC BY 4.0, and they're what counts. (The collection's description still says the north-west
  is unavailable; Braga's tiles are there.)
- **Credit:** "Informação geográfica cedida pela Direção-Geral do Território".
- **May be used for:** everything, with the credit. Data made from it may go in the world's
  tiles and be published.
- **Fetched:** the terrain and surface models at 50 cm for the 20 tiles under the track's box,
  which holds the shooter's area (about 16 MB a tile, 0.64 GB in all). The point cloud for 9
  tiles: the route and 200 m each side of it, the shooter's area, and the Praça's tile for the
  test (104–182 MB a tile, about 1.07 GB). Named here by their south-west corner in km
  (`-24_209`). `.cache/dgt/lidar.json` gives each one's DGT id (`LO-176510-07-2025`) and
  version.
- **Not checked yet:** whether its heights (Cascais) and the relief's (EU-DEM's) are above the
  same sea level (task 009).

### DGT's orthophotos, 2025

- **What:** aerial photos made into a map, 25 cm a pixel, colour and near-infrared, flown 29
  March–26 July 2025.
- **Access:** an open WMS, no account: `https://cartografia.dgterritorio.gov.pt/wms/ortos2025`,
  layers `Ortos2025-RGB` and `Ortos2025-IRG` (near-infrared), up to 4096 px a request, "Access
  constraints: none". It serves JPEG, uncompressed TIFF (about 48 MB per km²), and PNG with only
  256 colours. The cloud-optimised GeoTIFFs it's made from (8 × 5 km, colour and near-infrared,
  tile index `https://dgt-be.a.incd.pt:8081/collections/ORTOS-2025/items`) answer 403 without the
  CDD's account.
- **Licence:** CC BY 4.0: SNIG record `96d83932-f957-40d6-a2ea-3a25751c4b2d`, which asks for the
  credit wherever it's published, even adapted.
- **Credit:** "Informação geográfica cedida pela Direção-Geral do Território".
- **May be used for:** everything, with the credit, textures included (decision 002).
- **Fetched:** the 20 tiles under the track's box, the LiDAR's own tiles, from the WMS as JPEG,
  4000 px a side (25 cm), about 2.7 MB each, 54 MB in all. JPEG and not TIFF, because the
  source is JPEG already and TIFF is 18 times the size. Also an 80 m cut round the Praça in
  latitude and longitude, for the test. Colour only: the near-infrared layer is there when task
  016 or 019 needs it.

### DGT's land use, COS2025

- **What:** the land's use and cover, as polygons of 1 ha or more, in four levels of classes
  (`cos25v1_n1_c` to `cos25v1_n4_c`, each with its name). 50 classes of the fourth level are on
  the map's box.
- **Access:** DGT's OGC API, open: `https://ogcapi.dgterritorio.gov.pt/collections/cos2025v1/items?bbox=…`.
  The same API has COSc2025, a 10 m raster made from Sentinel-2, which is also at
  `https://geo2.dgterritorio.gov.pt/cosc/COSc2025.zip` (190 MB, the whole country).
- **Licence:** CC BY 4.0, under DGT's open data terms (https://www.dgterritorio.gov.pt/dados-abertos),
  which the OGC API serves. Its own record (`e7d91649-71dd-4a3a-ae38-e680fc54be88`) didn't open
  on 2026-10-13.
- **Credit:** "Informação geográfica cedida pela Direção-Geral do Território".
- **May be used for:** everything, with the credit.
- **Fetched:** the 855 polygons that touch the map's box, whole, as GeoJSON
  (`.cache/dgt/cos2025.json`, 18 MB).

## Not fetched

### Microsoft's building footprints

- **What:** building outlines found by machine learning in imagery; 17,725 in central Braga, with
  no heights there (counted for task 005, not checked again). Updated 2026-08-13.
- **Access:** https://github.com/microsoft/GlobalMLBuildingFootprints: `dataset-links.csv`, then
  gzipped line-delimited GeoJSON by country and level-9 quadkey.
- **Licence:** CDLA-Permissive-2.0 ("This data is licensed by Microsoft under the CDLA Permissive
  2.0").
- **Credit:** the licence asks that its text, or a link to it, go with the data when it's
  shared: "Building footprints © Microsoft, CDLA-Permissive-2.0 (https://cdla.dev/permissive-2-0/)".
- **May be used for:** everything. For task 011.

### Wikimedia Commons

- **What:** photos of the landmarks, by the thousand: Bom Jesus 2,734; the Sé 1,775; the Sameiro
  319; the Theatro Circo 273; the Estádio Municipal 223; the Parque da Ponte 214 (counted for task
  005).
- **Licence:** each photo has its own (CC BY, CC BY-SA, CC0, public domain). Portugal's freedom of
  panorama covers buildings and sculptures made to stand in public places, naming the architect
  where possible.
- **Credit:** each photo's author, licence and link, wherever it's used as a texture.
- **May be used for:** reference, always. Textures, with the credit; a CC BY-SA photo makes the
  texture CC BY-SA.

### Mapillary

- **What:** street-level photos. Coverage of Braga not checked: its API needs a free client
  token, which task 001 asks for.
- **Licence:** the photos are CC BY-SA 4.0. The map features it detects in them (signs, lamps) are
  under Mapillary's own terms, which it can revoke, not an open licence.
- **Credit:** "© Mapillary contributors, CC BY-SA 4.0", with a link to each photo.
- **May be used for:** the photos as references, with the credit and link. The detected features
  never get copied into this repository; they may guide someone mapping those things in
  OpenStreetMap, which then brings them here.

### The owner's and the friends' photos

Theirs, with their consent: references and textures, and the first choice for both (decisions
002 and 006). Task 008.

### Coming: DGT's topographic mapping (CartTop NdD2)

Due as open data in 2026 through the new BDNC portal: each building's height (`alturaEdificio`),
street furniture and signs, and a 3D part from the LiDAR. Check for it before starting tasks 010,
011 and 020.

## Never

Google (Maps, its satellite imagery, Street View, its 3D Tiles), Esri World Imagery and Bing's
imagery: their terms forbid making data or content from them. Esri's and Bing's allow tracing into
OpenStreetMap in an OSM editor, and nothing else. Nothing is recorded from Street View, not even
by hand.
