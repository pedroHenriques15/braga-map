---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [090]
roadmap: Ultra · Braga at its most real
---

# 091 · Each viewpoint shot at its photo's hour and weather

## Why

Every round is shot on the same clear March afternoon (decision 037), so in 18 of the 29 places
the scorecard sets a sunny shot beside a grey photo, and the shadows of the other 11 fall where
that afternoon puts them, not the photo's. Judging "does it look like Braga" is fairest when the
light is the photo's.

## What

Today `refs/viewpoints.json` holds each viewpoint's camera, not its photo's moment; the photo's
date is in `refs/photos.json`; party-kart's `src/sun.ts` takes `?time=` and `src/render/look.ts`
`?weather=grey|rain`; `scripts/shots.mjs:122` loads `?scenery&view=…` with neither.

1. **Each viewpoint's moment:** its photo's date and time in Braga's clock (from
   `refs/photos.json` or the photo's EXIF), and its weather (clear, grey, rain) as a session sees
   it, into `refs/viewpoints.json`; a test that each has both.
2. **`scripts/shots.mjs`** passes `?time=` and `?weather=` per viewpoint, and the scorecard says
   which.
3. **The grey day and rain** matched to their photos as decision 037 matched the clear ones.

## Questions

- [x] Decision 037 chose the same afternoon for every round. Shoot each at its photo's moment
  instead, or both (a second set of shots per round)? Recommendation: at its photo's moment,
  as the scorecard compares a shot with its photo; the game itself stays on its clear afternoon.
  > At its photo's moment (the owner, 2026-10-24): each round shot at each photo's date, hour and
  > weather; the game itself stays on its clear March afternoon. Decision 037 changes for the rounds
  > only, a new entry when this task is finished. Changing how shots are taken makes a new baseline
  > round (decision 011), so the first round shot so is labelled one.

## Read first

- `docs/DECISIONS.md` 011, 037; `refs/viewpoints.json`, `refs/photos.json`; party-kart's
  `src/sun.ts`, `src/render/look.ts`, `scripts/shots.mjs`.

## Done when

- [ ] Every viewpoint has its moment and weather; a round shot so, rated against the last.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Notes

- Blocked on the question: it changes decision 037, which the owner set on 2026-10-17. Answered
  2026-10-24, `todo`.
