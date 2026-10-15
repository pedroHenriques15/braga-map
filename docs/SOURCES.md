# Sources

Every source the map uses or may use: what it is, how it's had, its licence, the exact credit it
owes, and what [decision 006](DECISIONS.md) allows it for. Checked on 2026-10-13 unless it says
otherwise. A task that adds a source adds it here, and puts its credit in the README's Credits and
in each game, where it credits OpenStreetMap.

## The credits owed

Wherever the map, or anything drawn from it, is shown (a game, its help, its README):

- **Always:** "© OpenStreetMap contributors" (ODbL); for the ground, from DGT's LiDAR since task
  009: "Informação geográfica cedida pela Direção-Geral do Território" (CC BY 4.0); and for the
  horizon beyond the map: "Terrain Tiles (AWS Open Data). Europe terrain data produced using
  Copernicus data and information funded by the European Union - EU-DEM layers." `map().credit`
  gives all three.

## In use

### OpenStreetMap

- **What:** the streets, buildings, land use, trees, rivers, railway, crossings, traffic lights,
  bus stops, turn restrictions, landmarks and parishes. The world's `osmTime` says when it was
  fetched (now 2026-10-13).
- **Access:** the Overpass API, no account (`node tools/fetch.mjs`).
- **Licence:** Open Database Licence 1.0. The world, the tracks and the map page's data are
  derived from it, and stay under the ODbL.
- **Credit:** "© OpenStreetMap contributors".
- **May be used for:** everything.

### Terrain Tiles, made from EU-DEM

- **What:** the horizon, the hills 15 km round the map, where the LiDAR wasn't fetched; until task
  009, the relief on the map too. Terrarium PNG tiles at zoom 14 (about 7 m a pixel) over the map
  and zoom 11 (about 60 m) for the horizon. Over Braga all 24 tiles fetched are made from one
  EU-DEM file, `eudem/eudem_dem_5deg_n40w010.tif` (each tile's `x-amz-meta-x-imagery-sources`
  header says so; Joerd's documentation, which says SRTM at these zooms, is wrong here). So the real detail is
  EU-DEM's: a model about 25–30 m a cell, made from satellite data, which smooths away anything
  smaller than a block.
- **Access:** `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, AWS Open
  Data, no account. Made by Mapzen, and no longer updated.
- **Licence:** EU-DEM is Copernicus data: free and open, with its credit. Terrain Tiles ask for
  their sources' credits ([attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)).
- **Credit:** "Europe terrain data produced using Copernicus data and information funded by the
  European Union - EU-DEM layers", with "Terrain Tiles (AWS Open Data)".
- **May be used for:** everything. Since task 009 the world uses it only beyond the map (the zoom 14
  tiles are kept for `tools/relief.mjs`, which compares the two). Against the LiDAR it was 34 m
  too low on the Picoto's top, 11 m on the Sameiro's, and 2 m too high along the route on
  average.

### DGT's LiDAR, 2024–2025

The ground the world and the tracks stand on, since task 009: the terrain model at 50 cm over the
Volta dos Amigos' box and at 2 m over the whole map (`tools/terrain.mjs`). Its details are under
"Fetched" below, with DGT's other data.

## Fetched

Into `.cache/dgt/`, which git ignores ([decision 007](DECISIONS.md)), by `node tools/fetch.mjs
lidar ortho cos`. They're read by
`tools/dgt.mjs`; `test/sources.test.js` checks they're in the right place on the map. The LiDAR's
terrain is in use (above); the rest isn't yet.

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
    near-infrared, classed as unclassified (1), ground (2), low, medium and high vegetation
    (3–5), building (6), noise (7), water (9) and 26: the decks of bridges, and some other
    structures (the viewpoint's platform on the Picoto). The LAS standard's bridge class, 17, isn't
    used (two tiles counted, and the route's six bridges). About 10 points/m² nominal; the tile
    at the Praça has 17.6 M points;
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
  which holds the shooter's area (about 16 MB a tile, 0.64 GB in all). The terrain model at 2 m
  for the 48 tiles under the map and 200 m round it (about 1.1 MB a tile, 54 MB in all, task 009). The point cloud
  over the whole map since task 010: 42 tiles (104–182 MB a tile, 5.6 GB). Named here by their
  south-west corner in km (`-24_209`). `.cache/dgt/lidar.json` gives each one's DGT id
  (`LO-176510-07-2025`) and version.
- **Used for:** the ground (task 009: the terrain model, `tools/relief.mjs`); every building's
  height, roof and parts (task 010: `tools/roofs.mjs` boils each LAZ tile down to 50 cm cells of
  the building points' tops, `.cache/dgt/roofs/`, and measures each footprint over them); the
  buildings OpenStreetMap lacks, outlined from those cells (task 011, `tools/footprints.mjs`); and
  the bridges' decks where it saw them, class 26 (task 047: `tools/decks.mjs`, the median in each
  metre, `.cache/decks.json`).
- **Its sea level:** the Cascais datum, the one DGT publishes its own heights on: the LiDAR is
  within 0.15–0.85 m of DGT's geodetic marks on the Sameiro (whose heights may be the marks', not
  the ground's) and 0.2 m of the one at Pedroso; within 0.3–1.1 m of the old maps' spot heights,
  which are whole metres (task 009, `tools/relief.mjs`). Whether EU-DEM's heights are on the same
  sea level can't be told: it's 2–35 m off in places, more than any difference of datum.

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
- **Fetched:** the LiDAR's own tiles over the whole map since task 010 (42, and the Praça's cut),
  from the WMS as JPEG, 4000 px a side (25 cm), about 2.7 MB each, 106 MB in all. JPEG and not TIFF, because the
  source is JPEG already and TIFF is 18 times the size. Also an 80 m cut round the Praça in
  latitude and longitude, for the test. Colour only: the near-infrared layer is there when task
  016 or 019 needs it.
- **Used for:** each roof's colour (task 010: the median of the lighter half of the photo in the
  middle of the roof, one of the map's 127 `roofColors`), checking the street surfaces by
  (task 033's page), and the first ground texture (task 007, `tools/textures.mjs`): the photo
  over the tile `x-1z1`, Fujacal, resampled onto the map's grid, in `world/textures/`, with the
  credit in its index.

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

### Microsoft's building footprints

- **What:** building outlines found by machine learning in aerial imagery, with no heights here:
  12,219 inside the map's box (task 005 counted 17,725 in central Braga, in another box). The
  release dated 2026-02-03, uploaded 2026-02-23.
- **Access:** https://github.com/microsoft/GlobalMLBuildingFootprints: `dataset-links.csv` at
  `https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv`, then
  gzipped line-delimited GeoJSON by country and level-9 quadkey. Braga is on Portugal's 031332231
  (24 MB) and 031332320 (15 MB). Open, no account.
- **Licence:** CDLA-Permissive-2.0 ("This data is licensed by Microsoft under the CDLA Permissive
  2.0").
- **Credit:** the licence asks that its text, or a link to it, go with the data when it's
  shared: "Building footprints © Microsoft, CDLA-Permissive-2.0 (https://cdla.dev/permissive-2-0/)".
  Owed only once an outline of theirs is in the world's tiles: none is yet.
- **May be used for:** everything.
- **Fetched:** by `node tools/fetch.mjs microsoft`, the outlines inside the map's box, as rings of
  longitude and latitude, into `.cache/microsoft.json` (2 MB).
- **Used for:** task 011, each building the map lacks: `tools/roofs.mjs` keeps Microsoft's outline
  where it lies closer over the LiDAR's cells than the one squared from them. They sit 1.7 m from
  the LiDAR's buildings (the median of the 250 m squares, shifted as the map's outlines are), and
  on 2026-10-14 none of the 7,251 came out closer, so none is used.

## For the viewpoints and the reference photos

The real photos the game is set against (task 001, `refs/viewpoints.json`), and the reference
photos of each facade, landmark and close-up the city needs (task 008, `refs/photos.json`). Only
their lists are committed; `node tools/refs.mjs` fetches the photos into `.cache/refs/`.

### Mapillary

- **What:** street-level photos, each with its camera's position and rotation as Mapillary's
  reconstruction computes them (`computed_geometry`, `computed_rotation`). Checked on 2026-10-13
  within about 150 m of the Volta dos Amigos and over the shooter's area: 33,764 photos. Most are
  from phones on a car's dashboard in 2018–2019 (one contributor took half), a few hundred on foot
  in 2024. 4,296 are 360° panoramas (GoPro Max): sharp and level ones taken on foot with a pole in
  July 2024 on the Avenida da Liberdade, São João da Ponte, the Devesa and through Fujacal, and
  others from a bicycle helmet in March 2026, blurred, tilted, and with headings that can't be
  trusted. Most of the route has photos; the Avenida Doutor António Alves Palha's are all of
  the verge. Looked at again for task 008 (2026-10-14): the July 2024 panoramas were taken by a
  group walking, the camera on a helmet (it shows when a cut looks down), and passers-by are in
  many of them; besides the dashboards of 2018–2019 there are newer photos from cars, a dashcam
  through Fujacal in November 2023 and phones in February, March and August 2024.
- **Access:** the Graph API (`https://graph.mapillary.com/images?bbox=…`, at most 2,000 photos a
  request) with a free client token from https://www.mapillary.com/dashboard/developers, kept out
  of git in `.cache/credentials.json` as `{ "mapillary": { "token": "MLY|…" } }`, or in
  `MAPILLARY_TOKEN`. A photo's file links are signed and expire: `refs.mjs` asks for them each
  time.
- **Licence:** the photos are CC BY-SA 4.0. The map features it detects in them (signs, lamps) are
  under Mapillary's own terms, which it can revoke, not an open licence.
- **Credit:** "© Mapillary contributors, CC BY-SA 4.0", with each photo's author and link
  (`photo` in `refs/viewpoints.json` and `refs/photos.json` has both).
- **May be used for:** the photos as references, with the credit and link, and their cameras'
  positions to place the viewpoints. As textures too, which the licence allows: a texture made
  from one is CC BY-SA. The detected features never get copied into this repository; they may
  guide someone mapping those things in OpenStreetMap, which then brings them here.
- **Used:** all 29 viewpoints' photos, and 399 of the reference photos (task 008), 19 of them
  marked good enough for a texture. Ten of those are facade textures since task 007
  (`refs/textures.json`, `world/textures/`), so CC BY-SA 4.0, each with its author and link in
  its tile's index; `map().photoCredits` gathers the authors for a game's credits.

### Wikimedia Commons

- **What:** photos of the landmarks by the thousand (Bom Jesus 2,734; the Sé 1,775; the Sameiro
  319; the Theatro Circo 273; the Estádio Municipal 223; the Parque da Ponte 214, counted for task
  005), few of the streets, and close-ups of Braga's azulejos and manhole covers. Searched for
  task 008 on 2026-10-14 by category (`Category:Braga` and what's under it) and by name.
- **Access:** the MediaWiki API (`https://commons.wikimedia.org/w/api.php`), open, no account:
  `prop=imageinfo` gives each file's author, licence and date (`extmetadata`) and a thumbnail at
  any width, `prop=coordinates` the camera's position where the uploader gave one.
- **Licence:** each photo's own: those used are CC BY 2.0, CC BY 4.0, CC BY-SA 3.0, CC BY-SA 4.0,
  CC0 and public domain. Portugal's freedom of panorama covers buildings and sculptures made to
  stand in public places, naming the architect where possible.
- **Credit:** each photo's author, licence and link (`photo` in `refs/photos.json`).
- **May be used for:** reference, always. Textures, with the credit; a CC BY-SA photo makes the
  texture CC BY-SA.
- **Used:** 25 of the reference photos (task 008): the landmarks (the chapel of São João da
  Ponte, the Parque da Ponte, the Altice Forum, the Estádio 1.º de Maio, the Picoto's cross, the
  Igreja de Lamaçães, Bom Jesus, the Sameiro), the skyline from Bom Jesus and from the Picoto,
  azulejos, manhole covers, an old lamp, a granite bench, an old bus shelter, and Portugal's
  drawing of the give-way sign (`Portugal road sign B1.svg`, public domain), the one generic
  stand-in.

### Checked and not used

- **Wikimedia Commons** (below) for the streets: of its 1,594 geotagged photos over the route's
  box, 24 were taken within 80 m of the route and 150 m or more from any waypoint, mostly
  close-ups of monuments and tiles. Some are placed kilometres out (photos of Bom Jesus put in the
  city).
- **Panoramax** (`https://api.panoramax.xyz/api/search`, open, CC BY-SA 4.0 on its OSM-France
  instance): 3 photos in the route's box, all at one spot in a small park, in July 2019 (checked
  again on 2026-10-14).
- **KartaView** (`https://api.openstreetcam.org/2.0/photo/`): every query near Braga timed out or
  answered "Restricted access" on 2026-10-13.

## Sounds

Recordings a game may play, for its karts' engines and the city round the track (decision 016).
Only CC0, which owes no credit; each is on record here all the same, with what was cut from it.
They live in the game that plays them, not in the map: party-kart's `src/sounds/`, for the city
round the track (task 025). The karts' engine is synthesized (task 024).

### In use: the city round the track

All CC0 1.0, on Freesound, had from each page's 128 kbps MP3 preview (the originals need an
account) on 2026-10-14. Each bed is a loop: mixed to mono, its head crossfaded with what follows
it, set to −20 dBFS RMS (less where its peak would pass −1 dBFS), padded 0.1 s either side with
its own wrap-around, as MP3 with lamejs. The bells and the bus are played once, faded out at the
end, their peak at −3 dBFS. 673 KB in all.

| File | Recording | Where | Cut |
|---|---|---|---|
| `traffic.mp3` | 613245, "City traffic mid-distance" by tferrino | Coimbra | 12 s from 50.5 s, 48 kbps |
| `town.mp3` | 869045, "El_Retiro_Park_Ambience_Madrid_Spain_Roadside" by SignatureSoundsOrg | Madrid | 12 s from 550.75 s, 48 kbps |
| `park.mp3` | 267448, "Dawn in the city (Olivais Sul), Lisbon" by Refrain | Lisbon | 20 s from 181 s, 56 kbps |
| `woods.mp3` | 527541, "Nature_Ambience_June_2020_H6N_Longos_Braga_Portugal" by siddharthgovindan | Longos, by Braga | 16 s from 70.5 s, 56 kbps |
| `water.mp3` | 534741, "River at old tanneries area" by ondamarela | Couros, Guimarães | 10 s from 31 s, 48 kbps (−28 dBFS RMS, for a splash's peak) |
| `crowd.mp3` | 868982, "Norwegian football match / soccer game ambience" by Vogyik, from habbis92's 206003 (CC0) | Stavanger | 12 s from 5.25 s, in the original XY take of the four the file holds, 48 kbps |
| `bells.mp3` | 643878, "Church Bells, church of São Pedro de Miragaia" by justjare | Porto | all 12 s, 64 kbps |
| `bus.mp3` | 393763, "Bus Leaving From a Bus Stop" by bcatalog | Portland, Oregon | all 6.9 s, 64 kbps |

tferrino asks that their recordings be used "in creative way as a part of art-form", not
re-distributed raw or as stock sounds: a game's processed loop is the former. No Portuguese bus,
football crowd or Braga street was found under CC0; the woods are the nearest, recorded in Longos.

### Tried and dropped, 2026-10-14

- **Freesound 836786**, "ohv_gov_over_take1.wav" by Mihacappy, https://freesound.org/s/836786/
  (CC0 1.0, from its 128 kbps preview): a small OHV engine, the kind rental karts have, held at
  several revs, on a phone in a garage. Cut into four loops (idle at 36.0 s, low at 63.9, mid at
  70.8, high at 46.9; firing at 13.29, 19.94, 22.21 and 24.06 Hz; 100 KB as 96 kbps MP3) and played
  in party-kart as the karts' engine. The owner found it too harsh, and not a race engine. The
  author asks that their sounds not be used to train AI models; a request, not the licence's.

### Checked and not used, 2026-10-14

All CC0, on Freesound:

- **Crowds of karts:** qubodup's 189622, 189628 and 189629 (an iPod in an indoor hall, its
  automatic gain flattening everything to one roar) and OverlookHotelRecords' 317470 and 317471
  (outdoors, many karts passing, a generator's or a fan's tone under 317470). No one engine is
  held anywhere in them, so no loop can be cut (task 024's notes).
- **One engine, not a kart's:** richwise's 361407, a Honda CRF250 ridden off, from a backpack:
  the cleanest, but a dirt bike's engine. Alex_hears_things' 379915, an ATV revved, 21 s at one
  speed.
- **Race engines:** escortmarius's 141526, a 1984 Formula Ford started: it mostly idles, then dies;
  victormalloy's 113205, a Lotus Elise: clean, but its revs only blip up and down, never held;
  escortmarius's 141269, a tuned road Ford Escort, and nnus_'s 243634, a race car onboard, muffled.
  None holds a race engine steady over its revs, which loops need.

## Not fetched

### The owner's and the friends' photos

Theirs, with their consent, may still be used as references and textures (decision 002), but
nobody is taking any: online photos come first, and what they lack is listed as a gap (decision
018, task 008). None have been taken.

### Coming: DGT's topographic mapping (CartTop NdD2)

Due as open data in 2026 through the new BDNC portal: each building's height (`alturaEdificio`),
street furniture and signs, and a 3D part from the LiDAR. Check for it before starting tasks 010,
011 and 020.

## Never

Google (Maps, its satellite imagery, Street View, its 3D Tiles), Esri World Imagery and Bing's
imagery: their terms forbid making data or content from them. Esri's and Bing's allow tracing into
OpenStreetMap in an OSM editor, and nothing else. Nothing is recorded from Street View, not even
by hand.
