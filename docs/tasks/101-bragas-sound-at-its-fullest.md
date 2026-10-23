---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-23
depends-on: [094]
roadmap: Ultra · Braga at its most real
---

# 101 · Braga's sound at its fullest: from what's there, and echoing off its walls

## Why

The city's sound is eight CC0 recordings mixed by what's within 150 m (task 025): traffic by street
class, the town's hum, birds, the river, bells, buses, the crowd. What makes it is not seen (no car
drives, 094), and a narrow street sounds the same as a square.

## What

Today `src/ambience.ts` mixes the beds by what's near; `src/audio.ts` the mix (task 023).

1. **From what makes it:** once 094 has traffic, buses and people, each car's, bus's and voice's
   sound comes from it, positioned, and the traffic bed only fills the distance.
2. **The streets' acoustics:** early reflections and reverb by what's round the listener (a lane
   between facades, a square, an open avenue), from the buildings' distances in the tiles, so an
   engine rings in the Rua do Fujacal and spreads on the Avenida da Liberdade.
3. **The old town's** bells up close (the Sé's), the cafés' terraces (cups, chatter) where OSM has
   cafés, the TUB's doors and kneeling at a stop, the trains (097).
4. **The seasons and the hour** (093, 092): the swifts in summer, the crickets on warm nights, the
   quiet at 03:00.

## Read first

- braga-map's ROADMAP "Alongside · The sound" and "Later"; party-kart's `src/ambience.ts`,
  `src/audio.ts`, `docs/architecture.md` ("Sound"), `scripts/listen.mjs`.

## Done when

- [ ] Two takes with `scripts/listen.mjs` (a lane in Fujacal and the Avenida da Liberdade) judged
  by ear against the baseline, by the owner.
- [ ] `npm test` and `npm run check` pass.
