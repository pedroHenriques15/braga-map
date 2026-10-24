---
status: doing
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
- **Done (worker-2, 2026-10-24), party-kart branch `task-108`:**
  - `src/world/goto.ts` (new, the simulation's half): `mayGo`, the map offers it round the city only,
    never in a race or a round, nor while the room's lobby is starting one before this browser's has
    begun; and `kartTo`, where a place puts your kart: `WorldGround.spawn` from the ground's height
    there (`groundAt`, so under a deck it's the street on the ground), on the nearest carriageway
    inside the open world's area, facing along it the way nearest where you faced; null outside.
  - `hud.ts`'s `FullMap`: a right click, or a finger held still 0.55 s, opens a menu at the place:
    "🚀 Ir para aqui" (or "Fora da zona" outside the area) and "📍 Pôr o destino aqui" (107's
    waypoint, for a touch screen where a tap is that already); the keys' and the touch's hints say so.
    A click with any button but the left no longer puts the waypoint.
  - `main.ts`'s `fullMap.onGo`: your kart there (kept as where you are), or on foot you there, your
    kart left where it was, or flying the camera there as high over the ground as it was; the map
    closes, the GPS's route is worked out again, and the feed names the street. Nothing new was needed
    for the others: `syncOthers` already draws a jump of more than 30 m between two snapshots as one
    (no trail), the skid marks don't join past 6 m, and the chase camera snaps past 150 m.
  - **Found along the way, fixed:** on foot, opening the full map didn't always let the pointer go
    (in Playwright, every time): the browser had given the lock before telling the game, so `Mouse`'s
    own flag said unlocked and `unlock()` did nothing; the right click then went to the game's view,
    not the map. `input.ts`: `unlock()` asks the document, and a lock given once it's no longer wanted
    is let go at once. (input.ts is nobody's this run.)
  - README (Ir para aqui, the touch table), "Como se joga" and `docs/architecture.md` say so.
- **Evidence.** `test/goto.test.ts`: 23 places every 400 m across the open world and one under the
  Avenida Robert Smith's deck, each putting the kart on a carriageway inside the area within 200 m, at
  the ground's level, the street going on 2.5 m ahead and behind it (23 of 23); outside the area
  nowhere; `mayGo` round the city only. `npm run check` passes, `npm test` 147 of 147. A Playwright
  run in the game (party-kart's `shots/2026-10-24-task108/`, `go108.mjs`, `results.json`, 12 of 12): a
  right click offers it and it puts the kart 391 m off on the Rua do Fujacal facing along it, closing
  the map; outside the area "Fora da zona"; on foot you go 387 m and your kart stays; flying the
  camera goes 507 m and the kart stays; in a race a right click offers nothing; on a phone-sized
  touch screen a long press offers it and a tap goes 557 m. Shots seen: `1-menu`, `2-there`, `3-out`,
  `4-touch-menu`.
- **Not verified:** two players in a room, the other seeing the jump (the 30 m rule is the game's,
  unchanged); a real phone (CDP's touches only).
