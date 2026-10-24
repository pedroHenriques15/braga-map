---
status: done
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

- [x] How to play's Braga line credits OpenStreetMap, DGT and Copernicus, and names no photographer
  nor "Fotografias". (party-kart 28bb0d6: the line's text in `src/main.ts`; not looked at on the
  screen.)
- [x] `grep -n "photoCredits\|photos.ts" src` finds nothing in party-kart. (`grep -rn` over `src`, at
  28bb0d6.)
- [x] `npm test` and `npm run check` pass in party-kart. (156 of 156, at 28bb0d6 on braga-map 1.37.0.)

## Out of scope

- braga-map's `photoCredits`, kept empty so a game that lists it lists none.

## Notes

- Found by 082.
- **Done (2026-10-24, worker-1), party-kart:** How to play's Braga line ends, after OpenStreetMap's,
  the DGT's and Copernicus's credits, "As texturas da cidade são feitas, não fotografadas: as
  fotografias de Braga servem só de referência."; `photoCredits()` and its comment (which named
  `render/photos.ts`) are gone. `grep -rn "photoCredits\|photos.ts" src` finds nothing; `npm test` 156
  of 156 and `npm run check`. Not looked at on the screen. Landed as party-kart 28bb0d6 (on 088's
  74436ae), no decision and no version: no viewpoint shows How to play.
