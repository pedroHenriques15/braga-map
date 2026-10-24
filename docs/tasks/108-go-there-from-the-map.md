---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [106]
roadmap: Now · The open world
---

# 108 · "Ir para aqui": your kart put anywhere in the open world from the full map

## Why

The open world is 3.5 km²: driving or walking from one end to the other takes minutes, and looking
at a place means getting there first. The owner chose this from the session's suggestions
(2026-10-24): from the full map, put your kart on any street.

## What

Today: your `Roamer` (`src/game/roamer.ts`) respawns on the street where it is (`respawn`, the
world ground's `spawn(x, z, y, yaw)`, Enter); flying (V) puts your kart on the street under the
camera when you land (`src/main.ts`, about line 1231); the others see you where your snapshots say.

1. On the full map (106), a right click (a long press on a touch screen) on a place offers "Ir para
   aqui"; it puts your kart on the nearest street a kart can drive to there, on the ground's level,
   facing along it (`spawn`), and closes the map.
2. On foot, the same puts you there on foot, your kart left where it was; flying, the camera.
3. **Free roam only:** never in a race or a round, and not while one is starting.
4. The others see you vanish and appear (no trail across the city).
5. Inside the open world's edge only; outside it, the map says "Fora da zona".

## Read first

- party-kart's `src/game/roamer.ts`, `src/game/walker.ts`, `src/world/ground.ts` (`spawn`),
  `src/main.ts` (the roam loop, flying's landing), task 106.

## Done when

- [ ] From the full map your kart goes to a street across the open world, on it and facing along it
  (a test of the spot it picks; Playwright in Notes).
- [ ] It's never offered in a race or a round (a test).
- [ ] `npm test` and `npm run check` pass.

## Notes

- The owner's choice (2026-10-24), from the session's suggestions. To be done first, before 081.
