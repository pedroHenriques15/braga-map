---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-14
depends-on: [034, 035, 036]
roadmap: Now · The open world
---

# 037 · The race as a game mode in the open world, on the streets at their real widths

## Why

The race is the whole game today. In the open world (decision 019) it becomes the first thing
to do in it: started from free roam, run on the same streets everyone drives at their real
widths (the 9 m the track took goes), with barriers closing the side streets it passes, and
everyone back in the world when it's over. The friends already know the Volta dos Amigos: it has
to keep racing as well as it does now.

## What

Today:

- braga-map's `tools/track.mjs` plans the Volta dos Amigos on OSM's streets and writes
  `tracks/amigos.js`: a point every 8 m with its width (`Math.max(W_MIN, carriageway(...))`,
  line 436), lanes, kerbs, surface, bank, and the start, checkpoints, item boxes, boost pads and
  eggs. Its centre line is OSM's, folded and rounded at the corners (`R_MIN`, 12 m).
- party-kart's `buildTrack` samples it every metre; the race (`src/race.ts`), the racers and items
  (`src/game/`), the bots (`steerLine` in `bot.ts`) and the autopilot all run along the samples,
  and the walls are the road's edges (`s.walls`, `s.w`).
- After task 034 the car's ground and walls come from the world, and a `Ground` can be given the
  race's walls; after task 035 every street is drawn from braga-map's surfaces (task 033); after
  task 036 the game opens in the world, and the room's lobby holds the race's settings.

Steps:

1. **The track on the streets as they are** (braga-map): `track.mjs` takes the route's centre line
   and widths from the streets' surfaces (task 033), so the track's edges are the kerbs drawn; no
   `W_MIN` in the race. It lists the side streets the route passes (`closures`: where each joins,
   its heading and width), and still prints the widths and the narrowest places. Remove `W_MIN`
   from `tools/osm.mjs` if nothing else uses it then. A new tag of braga-map for party-kart.
2. **The race's walls:** during a race the route's kerbs are walls, as the road's edges are today,
   and a row of barriers stands across each side street at the kerb's line, drawn and solid. Off
   the route everything is as in free roam. The grid on the start street at its real width.
3. **Starting one from free roam** (the owner's answers): "Corrida" in the menu gives the host the
   race's settings (race or time attack, laps or minutes, items, catch-up, bots), as the lobby does
   now; starting it puts everyone in the room on the grid at once, bots filling the empty places,
   the countdown, the race. A client sees the settings and who's in, and waits on the host.
4. **When it ends:** the results over the world, then everyone back where they were before the
   race, driving.
5. **The race at real widths:** the bots spread across the road to pass (`steerLine`), and the
   items land by sample and lateral offset (`haz`, `proj`): check each keeps on the road where the
   street is narrow. Adjust the bots and the items, never the street (decision 019).
6. **The tests** (`test/drive.test.ts`, `test/race.test.ts`) run on the world's ground with the
   race's walls: the loop of 7–10 km with its checkpoints, the autopilot's clean lap, the second lap
   of 170–290 s, and eight bots finishing a lap within 60 s of each other. If the narrow streets
   make one fail, report the numbers to the owner before changing the test.
7. **Peer id prefix:** change `PREFIX` in `src/session.ts` (the track changes).

## Read first

- braga-map: `tools/track.mjs` (the widths at line 436, the kerbs, what it prints), `tools/osm.mjs`
  (`W_MIN`), `tracks/track.d.ts`, `docs/DECISIONS.md` 004, 010 and 019.
- party-kart: `CLAUDE.md` ("Gotchas": the tests guard the track and the tuning; the eight-bot test
  rolls dice), `src/track/track.ts`, `src/race.ts`, `src/game/racer.ts`, `src/game/bot.ts`,
  `src/game/items.ts`, `src/session.ts` (`Settings`, `start`, `setLapLimit`), `src/main.ts`
  (`lobbyScreen`, `startRace`, `endRace`, `resultsScreen`), `test/`.

## Done when

- [ ] `tracks/amigos.js` has the route at the streets' real widths, on their surfaces, with its
  side streets listed; braga-map tagged, party-kart pinned to it.
- [ ] A race starts from free roam, puts everyone in the room on the grid, runs, shows its results,
  and puts everyone back where they were: checked with Playwright, two browsers and bots.
- [ ] No kart leaves the route during a race: the side streets' barriers and the kerbs hold.
- [ ] party-kart's `npm test` and `npm run check` pass, the lap's summary line before and after in
  Notes; braga-map's `npm test` passes.
- [ ] Shipped with tasks 035 and 036 (party-kart's `docs/releasing.md`), live, and the owner has
  raced it.

## Out of scope

- A checkpoint race with shortcuts through the city, and races on other routes: new tasks when the
  owner wants them.
- Moving the route onto the real carriageway from the LiDAR: task 026.

## Notes

- Decision 019 replaced decision 004's 9 m: the race runs at the streets' real widths. It takes
  everyone in the room, put on the grid at once.
