---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-16
depends-on: []
roadmap: Phase 1 · See it
---

# 055 · The Monte da Forca's viewpoint looks 6° higher than its photo

## Why

Found by task 017, outlining the buildings on each viewpoint's photo from the viewpoint's camera: on
`monte-da-forca` every outline sits about 145 px (of 1536) under its building, and they fit once the
camera is turned 6.5° further down. The game's shot agrees: the far hills are 65% of the way down it,
55% down the photo. A shot that doesn't frame what its photo frames is marked down on the scorecard
for what isn't the city's fault.

## What

`refs/viewpoints.json`'s `monte-da-forca` looks from (−418.7, 44.8, 1691.1) at (−508.3, 61.5, 1735.4):
up 9.5°, Mapillary's `pitch` for the photo, a phone on a dashboard pointing downhill. The photo's
horizon says about 3°.

1. Set its target so the camera looks as the photo does: the hills' line, the street's kerb and the
   houses on the left where the photo has them (`node tools/buildings.mjs mark monte-da-forca` draws
   the outlines from the camera, for checking). Check its heading too: the street runs off to the left
   in the photo.
2. Check the other viewpoints taken from a phone on a dashboard the same way: a Mapillary pitch of more
   than 5° on a level street is suspect.
3. `npm test` (`test/viewpoints.test.js`), and shoot the viewpoint again (party-kart's
   `node scripts/shots.mjs <label> monte-da-forca`).

## Done when

- [ ] `monte-da-forca`'s shot frames what its photo frames: the hills, the street and the houses within
  a few pixels of where the photo has them.

## Notes

- Drafted by task 017 as 054; renumbered 055 when it landed (2026-10-16), as 054 had been taken by
  the flying camera.
