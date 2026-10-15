---
status: done
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [004, 005]
roadmap: Phase 1 · See it
---

# 007 · Photo textures: how they're made, stored, loaded and credited

## Why

Photo textures are allowed (decision 002), and the ground, facades, pavements and landmarks will
all want them (tasks 016, 017, 018, 021). Each task inventing its own way would mean several
formats, folders and loaders, and a download that grows without anyone noticing. One pipeline,
decided once and inside the budget (task 004), keeps them consistent and keeps the game playable
on a phone.

## What

Today party-kart has no image files: every texture is drawn on a canvas
(`../party-kart/src/render/textures.ts`), and its `CLAUDE.md` and README promise "no asset
files" and "nothing to maintain". It's built by Vite and served from GitHub Pages (`npm run deploy`
force-pushes `dist/` to `gh-pages`). braga-map ships the world as JS modules of packed numbers
(`world/`, about 2.9 MB of tiles), loaded per 500 m tile by `loadWorld`.

1. **Where the images live:** in braga-map, next to the world, `world/textures/<tile>/…`,
   published with the package, so every game on the map gets them. The textures belong to the
   place, not the game (the owner's answer, below). The tiles are JS modules that a game's
   bundler takes in through `loadWorld`; images aren't, so find how party-kart's Vite build
   serves a dependency's image files (step 4).

   GitHub limits a file to 100 MB and recommends repositories stay under 1 GB; GitHub Pages
   sites must stay under 1 GB too. Measure what's planned against that.
2. **The format:** KTX2 with Basis Universal (`KTX2Loader` in three.js) stays compressed on the
   GPU, which matters most for phones; WebP is simpler but takes full memory once decoded.
   Test both in Chromium on the PC at a phone's size with the CPU slowed, as task 004 measured
   (the owner dropped the phone, decision 013): with one tile's ground and ten facades, the
   download, the time to decode and upload them, and the graphics memory each format takes on a
   phone's GPU, worked out from its format. Pick from that, and keep the phone's `?stats` steps
   in Notes for when a phone is measured.
3. **The tools:** `tools/textures.mjs` in braga-map, which takes a source image (an orthophoto
   tile, a facade photo, a close-up), crops and rectifies it (a facade photo straightened to
   its real width and height), takes out what shouldn't be baked in (cars and shadows on the
   ground, where possible), sizes it per tier (High, Medium, Low), compresses it, and writes it
   with its credit into an index: `{ id, file, size, source, author, licence }`.
4. **The loading:** `loadWorld` gains textures per tile, loaded with the tile, at the quality
   asked for; a game frees them when the tile goes. party-kart draws the first ones only with
   `?photos` in the address (the owner's answer), so the live game looks the same until tasks 016
   and 017 roll photos out.
5. **Credits:** the README's credits list each source, and the game's How to play shows them,
   as it does OpenStreetMap's.
6. **party-kart's docs:** in a party-kart session, change `CLAUDE.md` ("no asset files") and
   the README ("nothing to maintain") to say photo textures are allowed for the city, where
   they live, and the budget they keep to (decision 002).

## Questions

- [x] Where do the images live: A (braga-map, with the world), B (party-kart) or C (outside
  git)? Recommendation: A.
  > A, in braga-map with the world (2026-10-14). The other options were B, party-kart's
  > `public/`, and C, outside git (a release asset or a bucket).
- [x] The phone was dropped (decision 013): how is the format chosen? A, in Chromium on the PC
  at a phone's size, the CPU slowed, the graphics memory worked out per format; B, that and the
  phone's `?stats` before the choice is final; C, on what's known, measuring only the download.
  Recommendation: A.
  > A (2026-10-15).
- [x] Draw the first textures for everyone, or only on request? A, behind `?photos`, the live
  game unchanged until 016 and 017; B, live from the next deploy. Recommendation: A.
  > A, behind `?photos` (2026-10-15).
- [x] Only 3 of task 008's 11 facades good enough for a texture are from the July 2024
  panoramas; the other 8 are 2018–2019 phone photos. A, the best ten of the 11, whatever their
  year; B, the panoramas only, cutting 7 more from those marked for reference. Recommendation: A.
  > A, the best ten of the 11 (2026-10-15).

## Read first

- `docs/DECISIONS.md` 002. Task 004's budget, task 005's licences.
- `index.js` (`loadWorld`), `tools/world.mjs` (the packing).
- `../party-kart/src/render/textures.ts`, `../party-kart/docs/releasing.md`.

## Done when

- [x] One ground tile and ten facades go through `tools/textures.mjs` and show in the game with
  `?photos`, each with its credit in the index. `test/textures.test.js` (every texture made at
  each level and credited as its photo is, each facade facing its photo's camera and on its
  building); party-kart's `shots/2026-10-15-task007-photos/`, every viewpoint with `--photos` at
  High, Medium and Low; checked in its dev server and in its build (`vite preview`).
- [x] The format is chosen from a test in Chromium at a phone's size, with the numbers in Notes:
  KTX2, Basis Universal's ETC1S (the table below).
- [x] party-kart's `CLAUDE.md` and README say what decision 002 says: `CLAUDE.md`'s opening (photos
  may texture the city, they live in braga-map, and they spend from the budget) and its `?photos`;
  the README's opening and credits; `docs/architecture.md`'s "Photo textures".
- [x] A decision entry records where the images live and in what format: decision 030.

## Out of scope

- Texturing the city: tasks 016 (ground), 017 (facades), 018 (pavements), 021 (landmarks).

## Notes

- Unblocked on 2026-10-14: the images live in braga-map.
- The photos are online ones (task 008, the owner's answer of 2026-10-14): take the ten facades
  from Mapillary's panoramas taken on foot in July 2024 (sharp and level, `docs/SOURCES.md`), and
  record whether they're sharp enough to texture a facade. None of them may be a friend's house
  (decision 004). They're CC BY-SA 4.0, so a texture
  made from one is CC BY-SA too, with its author and link in the index.
- **Started 2026-10-15.** Where they live, and how a game gets them: in braga-map,
  `world/textures/<tile>/<id>-<level>.ktx2`, a file for each graphics level, published with the
  package (`files` has `world/`). `world/textures/<tile>.js` is each tile's index, which
  `loadWorld` loads with the tile (`world.photos`): each texture's place, its credit, and each
  level's file as `new URL('./…', import.meta.url).href`. Vite 8 takes that in a dependency both
  ways, checked on a scratch package before building anything: its dev server rewrites the path in
  the pre-bundled module and serves the file from `node_modules/`, and its build emits it into
  `assets/` with a hash. In Node the URL is a `file:` one, and nothing fetches it. A KTX2 under
  4 KB was inlined into the index as a data URL, which every player downloads; party-kart's
  `vite.config.ts` now never inlines one.
- **The format, KTX2 with Basis Universal's ETC1S**, from one ground tile and ten facades in
  Chromium on the PC (RTX 4060 Ti) at a phone's size (800 × 360, 2 pixels a pixel, touch), the CPU
  slowed 4×, each format three times in a fresh page, the middle run (a scratch page loading them
  with three.js 0.186's `KTX2Loader` and `createImageBitmap`):

  | | ETC1S | UASTC (Zstandard) | WebP (q 80) |
  |---|---|---|---|
  | Download, High | 1.39 MB | 7.59 MB | 0.71 MB |
  | Download, Medium | 0.41 MB | 1.94 MB | 0.27 MB |
  | Download, Low | 0.13 MB | 0.49 MB | 0.09 MB |
  | Basis's transcoder, once | 0.56 MB (0.26 gzipped) | the same | none |
  | A phone's graphics memory, High | 4.0 MB (ETC1, ½ byte a pixel) | 8.0 MB (ASTC 4×4) | 31.8 MB (RGBA) |
  | Medium | 1.0 MB | 2.0 MB | 8.0 MB |
  | Low | 0.25 MB | 0.5 MB | 2.0 MB |
  | Decoded, High (in workers) | 200 ms | 290 ms | 104 ms |
  | Uploaded to the card, High (the main thread waits) | 25 ms | 26 ms | 78 ms |
  | Decoded, Medium / uploaded | 178 / 13 ms | 197 / 13 ms | 55 / 26 ms |

  (On the PC the card takes ETC1S and UASTC as BC7, a byte a pixel: 8 MB on High. A phone's
  memory is worked out from the format KTX2Loader picks there, ETC1 for ETC1S, as Android's GPUs
  all take ETC2; 4 MB of a 2048² tile and ten facades, mipmaps in.) WebP downloads half of ETC1S
  but takes eight times the graphics memory, and stalls the frame three times as long putting it
  on the card. Over the open world's 14 or so tiles that task 016 would texture, WebP's ground
  alone would be some 300 MB on High, three times the city's 95 MB budget; ETC1S's 37 MB. UASTC is
  sharper but downloads five times ETC1S for twice its memory. ETC1S's quality is set at 200 of
  255, where it stops getting closer to the photo (decoded by Basis's own transcoder, against the
  image encoded; the grey block on the Avenida da Liberdade, the azulejo house and 512 px of the
  ground): at 128, Basis's default, 36.3, 32.8 and 34.0 dB in 43, 14 and 42 KB; at 200, 37.2,
  33.7 and 35.6 dB in 61, 21 and 61 KB; at 255, 0.2 dB more at most, in up to 13% more. The
  phone's `?stats` steps are task 004's, for when a phone is measured.
- **The tool**, `tools/textures.mjs` (about a minute), from `refs/textures.json`: the ground as
  the orthophoto resampled onto the map's grid, 2048 px over 500 m on High (24 cm; the photo has
  25), 1024 on Medium, 512 on Low; a facade as its photo's four corners straightened onto its wall
  (a homography, 3 × 3 rays a pixel), 2.5 cm a pixel on High as far as the photo has it, half and a
  quarter that below. The corners are read off each photo by eye, and the wall's points off the
  world's footprint; the wall can run along several steps of a footprint, and the photo can span
  only part of it (`s`, `y`). Mapillary's camera positions are 1–3 m out, too far to place a
  facade from the camera alone: projecting the world's buildings into the photo only tells which
  building it shows. Dependencies, for the tools only: `sharp` (Apache-2.0) and `ktx2-encoder`
  (MIT, Basis Universal's encoder, Apache-2.0); a game installs neither.
- **The ten facades** (refs/textures.json says each one's troubles): the best ten of task 008's
  11, `facade-way-179321421` left out (low sun glaring off it, a reflection of the windscreen over
  it, its top out of the photo). Seven are 2018–2019 phone photos, three the July 2024
  panoramas. Sharp enough to texture a facade: `1491347983` and `147545836` (panoramas, 25–32 px a
  metre) and `163978042`, `440182287` and `906140272` (phones, 130–200 px a metre). Not really:
  `1463270529` (taken from a moving car, blurred), `159208687` (a panorama from across a car park,
  19 px a metre), `440314428` (a lorry over its ground floor), `x1150z1177` (a car over its left
  end) and `146464170` (the ends out of the photo). Seven have cars or a lorry at their foot, and
  the photos' light differs (dusk, low sun, overcast) and their white balance with it: under the
  game's own lighting they read paler, and a dusk one bluer, than the city round them (seen at
  `alameda-fujacal` and the grey block on the Avenida da Liberdade). Matching them to the game's
  light is task 017's.
- **The ground's shadows and cars stay in it.** Two ways tried, neither good enough: casting the
  LiDAR's surface model along the sun's direction (found by matching its shadows to the photo's
  dark: 112°, 55° up) leaves bright halos, because the orthophoto's buildings lean and its trees
  aren't the LiDAR's; and lifting what's dark and bluer than the median turns dark roofs, asphalt
  and the shadows themselves violet. Most cars are on the streets, which the game draws over the
  ground. Task 016's option A (each class of ground with its own texture) has neither.
- **In the game** (party-kart, `?photos`, `render/photos.ts`): the ground's photo over its tile in
  the land's shader, faded into the painting over its last 15 m; each facade as quads 4 cm in
  front of its wall, a mesh each. Checked in the dev server and in the build (`vite preview`), at
  High, Medium and Low; `node scripts/shots.mjs <label> --photos` shoots a round with them. Every
  viewpoint with them (`shots/2026-10-15-task007-photos/`, against `2026-10-15-task037/`): up to
  10 more draw calls where facades are in view (`robert-smith` 227 → 237 on High, 209 → 219 on
  Low; `alameda-fujacal`, `conselheiro-lobato`, `imaculada-conceicao` and `lobato-east` 6–8
  more), 30 triangles more at most, textures 97 → 105 MB on High and 61 → 63 on Medium as the PC
  holds them (BC7; a phone half that: +4 and +1 MB), 45 on Low either way, and the city built 0.25 s
  slower on High (the median; 0.18 on Medium and Low). A player without `?photos` downloads 0.01 MB
  more (2.21 → 2.22 MB gzipped, `node scripts/download.mjs`): the tiles' indexes and the credits;
  the loader (25 KB gzipped) and the transcoder come only with the photos. `?stats` counts a compressed texture's real bytes now.
  party-kart never lets a tile go yet (task 038), so `Photos.dispose` is there but nothing calls it.
- **The repository and Pages:** 1.95 MB in `world/textures/` (the ground tile 1.2 MB of it, all
  three levels); party-kart's build is 13 MB. A ground tile is about 1.2 MB, a facade 50–130 KB:
  task 016 over the open world's tiles and 017 over the shooter's area would add some 50 MB a full
  remake, and git keeps each remake that changes a file (the encoder gives the same bytes from the
  same image). Well inside GitHub's 1 GB for the repository and for Pages; a file is at most 1 MB.
- **Finished 2026-10-15,** braga-map 1.12.0. The round wasn't posted on the scorecard: nothing a
  player sees changed, the photos being behind `?photos`, and the scorecard rates the game as it
  is. Task 016 posts the orthophoto's ground as its option B, beside A, when the owner picks.
