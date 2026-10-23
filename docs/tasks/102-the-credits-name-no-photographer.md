---
status: todo
priority: medium
kind: code
repo: party-kart
created: 2026-10-23
depends-on: [081]
roadmap: Ultra · Braga at its most real
---

# 102 · The credits name no photographer

## Why

Since task 082 no photograph is drawn in the game, and braga-map's `map().photoCredits` is always
empty. party-kart's How to play still ends its line on Braga with "Fotografias: " and the list of
them, which is now nothing: it reads "Fotografias: ." Task 082 couldn't change it, as task 081's
session was editing `src/main.ts` at the same time.

## What

1. In party-kart's `src/main.ts`, the "Braga" line of How to play (`photoCredits()` and its use,
   about line 691): drop "Fotografias: …" and `photoCredits()`, and say instead, in the game's
   Portuguese, that the city's textures are made, with photos of Braga as references only.
2. The comment over `photoCredits()` names `render/photos.ts`, gone since task 082: it goes with it.
3. `npm test` and `npm run check` pass.

## Read first

- braga-map's `docs/DECISIONS.md` 061.
- party-kart's `src/main.ts`, the How to play screen.

## Done when

- [ ] How to play's Braga line credits OpenStreetMap, DGT and Copernicus, and names no photographer
  nor "Fotografias".
- [ ] `grep -n "photoCredits\|photos.ts" src` finds nothing in party-kart.
- [ ] `npm test` and `npm run check` pass in party-kart.

## Out of scope

- braga-map's `photoCredits`, kept empty so a game that lists it lists none.

## Notes

- Found by 082.
