---
status: todo
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
   Test both on the slowest friend's phone, with `?stats` (task 004's steps), with one tile's
   ground and ten facades, and pick.
3. **The tools:** `tools/textures.mjs` in braga-map, which takes a source image (an orthophoto
   tile, a facade photo, a close-up), crops and rectifies it (a facade photo straightened to
   its real width and height), takes out what shouldn't be baked in (cars and shadows on the
   ground, where possible), sizes it per tier (High, Medium, Low), compresses it, and writes it
   with its credit into an index: `{ id, file, size, source, author, licence }`.
4. **The loading:** `loadWorld` gains textures per tile, loaded with the tile, at the quality
   asked for; a game frees them when the tile goes.
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

## Read first

- `docs/DECISIONS.md` 002. Task 004's budget, task 005's licences.
- `index.js` (`loadWorld`), `tools/world.mjs` (the packing).
- `../party-kart/src/render/textures.ts`, `../party-kart/docs/releasing.md`.

## Done when

- [ ] One ground tile and ten facades go through `tools/textures.mjs` and show in the game,
  each with its credit in the index.
- [ ] The format is chosen from a test on the phone, with the numbers in Notes.
- [ ] party-kart's `CLAUDE.md` and README say what decision 002 says.
- [ ] A decision entry records where the images live and in what format.

## Out of scope

- Texturing the city: tasks 016 (ground), 017 (facades), 018 (pavements), 021 (landmarks).

## Notes

- Unblocked on 2026-10-14: the images live in braga-map.
- The photos are online ones (task 008, the owner's answer of 2026-10-14): take the ten facades
  from Mapillary's panoramas taken on foot in July 2024 (sharp and level, `docs/SOURCES.md`), and
  record whether they're sharp enough to texture a facade. None of them may be a friend's house
  (decision 004). They're CC BY-SA 4.0, so a texture
  made from one is CC BY-SA too, with its author and link in the index.
