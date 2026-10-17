---
status: done
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

- [x] `monte-da-forca`'s shot frames what its photo frames: the hills, the street and the houses within
  a few pixels of where the photo has them.
  > Aimed 3° up (from 9.5°): the far hills peak 54–55% of the way down the shot, 54% down the
  > photo (65% before), within about 7 px of 720; the street's far end at 62% in both; the houses
  > on the left with their roofs where the photo has them. Outlined from the camera
  > (`buildings.mjs mark`), the houses in the middle distance sit on their buildings within a few
  > pixels of 1200, where they were about 145 px under them. `shots/2026-10-16-after055/`.

## Notes

- Drafted by task 017 as 054; renumbered 055 when it landed (2026-10-16), as 054 had been taken by
  the flying camera.
- **`monte-da-forca`** (2026-10-16): the target's height alone moves, from 61.5 to 50 (3° up at its
  100 m), as the task found; the heading stays Mapillary's 243.7°, as the far houses outlined from
  the camera fall where the photo has them across it too. The street runs off to the left in the
  photo and straight on in the game: the map's street, not the camera. The houses nearest on the
  left are up to 50 px off their outlines, as near ones are when Mapillary's position is 1–3 m out.
  In the game the big conifers on the lot in front hide much of the city the photo shows: the
  trees, task 019's.
- **Step 2, the others over 5°** (Mapillary's pitch, each outlined from its camera and its shot set
  beside its photo): `joao-xxi` 12.8° fits (the photo is tilted up: the road vanishes 71% down it,
  and the buildings sit on their outlines); `31-de-janeiro` 6.5° fits; `sameiro` 6.5° fits (its
  hills and road where the photo has them). `estadio` 7.1° looked about 1.6° too high: the flat
  building on the right outlined 35 px of 1200 under its roofline, and in the shot the zebra and
  the roundabout's island 3% lower than in the photo. Aimed at 5.5° (the target's height 48.6 →
  45.8), its outline meets the roofline and the zebra (75–85% down) and the island (67%) are where
  the photo has them (73–85%, 66%). Its stadium is still a plain block (task 049), so it can't be
  told by. `lobato-pavement`, at 5.0°, isn't over.
- Both viewpoints' notes say how they're aimed, and decision 009 that a photo's own pitch wins where
  Mapillary's is off. `npm test`: 93 pass (`test/viewpoints.test.js` 6).
- **No round of its own:** two viewpoints moved, and a round of two would leave the scorecard's open
  round empty but for them; the roadmap had 055 done before the next round, which will shoot them
  so. Shot on their own instead, at High and Low (`shots/2026-10-16-after055/`, party-kart
  `a62d73a`, braga-map 1.18.1): `monte-da-forca` 81 calls and 0.88 M triangles on High, `estadio`
  144 and 1.48 M.
- **No tag:** `refs/` isn't in what braga-map's package ships; party-kart's `scripts/shots.mjs`
  reads the viewpoints from `../braga-map` itself.
- **Done** 2026-10-16.
