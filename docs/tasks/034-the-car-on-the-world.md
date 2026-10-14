---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-14
depends-on: [033]
roadmap: Now · The open world
---

# 034 · The car on the world's ground: the land, the streets at their levels, and what it hits

## Why

A kart can only drive on the track today. `stepCar` finds its ground, its walls and when it has
fallen off by asking where it is along the track, so off the route there's nothing under it. In
the open world (decision 019) it has to drive anywhere in the area: down any street, over a
junction, up a kerb and along the pavement, over a bridge and under it, through a tunnel, and into
a wall it can't drive through.

## What

Today, in party-kart:

- `src/car/car.ts`: `stepCar(c, inp, track, dt, mods)` is the arcade handling, at a fixed
  `DT = 1/120` s in the game and the tests. The ground is the track sample nearest the car
  (`locate` in `src/track/track.ts`, searching ±40 samples round the last, which is what keeps a
  road over another apart): its normal `n`, and the car's height over it (`loc.h`). The walls are
  the road's edges (`s.walls`, `s.w`), and a car well below the road for 0.9 s respawns.
  `Car.idx`, `Car.lat` and `Car.h` are all along the track.
- `src/car/autopilot.ts`, `src/race.ts`, `src/game/racer.ts`, `src/game/bot.ts` and
  `src/game/items.ts` run the race along the track's samples, and keep doing so (task 037).
- The simulation is pure TypeScript with no three.js and no DOM, so `node --test` loads it
  (party-kart's `CLAUDE.md`). braga-map's `loadWorld` runs in Node as it is (24 tiles in about
  80 ms).
- braga-map gives the land (`world.height`, from DGT's LiDAR, every 2 m where task 032 put it),
  the streets as surfaces at their levels (`world.streets`, task 033: carriageways, junctions,
  kerbs, pavements, decks, tunnels), the buildings' footprints with their ground and height, the
  trees, and the area's edge with a gate where each street leaves it (`map().open`, task 032).

Steps, first on Fujacal's tiles (task 033 does them first), then the whole area:

1. **A `Ground`** (`src/world/ground.ts`, sim, no three.js), built from braga-map's world: the
   surfaces a car can stand on, in a grid of cells of about 10 m for quick lookups. At a point
   (x, z) the candidates are the land and every street piece over it at its height: a deck over
   the land, a tunnel's road under it, a kerb's pavement 15 cm over its carriageway. The car stands
   on the highest one no more than a step (about 0.3 m) over its wheels, so on a deck it's on the
   deck, under it it's on the street below, and in a tunnel the land over it is its roof, not its
   floor. Its normal from the surface round the point, smoothed over about a car's length so the
   2 m ground doesn't shake it.
2. **What stops it:** anything that rises more than a step in front of it is a wall, in 2D, in the
   same grid: the buildings' footprints from their ground to their eaves, a tunnel's sides and a
   deck's parapets, the trees' trunks, retaining walls where the land is higher than the pavement,
   and the barriers across the area's gates. A kerb is a step: driven over at an angle, it bumps
   the kart and takes a little speed; the pavement behind it is driven on.
3. **`stepCar` takes a `Ground`,** not a `Track`: the same handling (the same grip, drift, boost,
   flying and landing, tuned as it is), with the ground and the walls from the world. `Car` keeps
   `idx` only for a race (task 037). When it's fallen, stuck or upside down, a respawn puts it on
   the nearest carriageway at its level, along the street.
4. **The race's walls** stay possible: a `Ground` can be given extra walls (the route's kerbs and
   the barriers across its side streets, task 037), which only it applies.
5. **Fast enough:** a step for eight cars well inside a frame on a phone; time it in a test.
6. **Tests** (`test/ground.test.ts`), on braga-map's real tiles: a car driven straight across a
   junction on Fujacal keeps on the ground; up a kerb onto the pavement and back; into a building's
   wall, stopped, at any speed and angle, never through it; over the Avenida Robert Smith's deck
   and on the Avenida Frei Bartolomeu dos Mártires under it, each staying on its own level; through
   the Avenida da Liberdade's underpass at (181, 589) and out of its mouths; into a gate's barriers
   at the area's edge, stopped. The autopilot laps the Volta dos Amigos on the world's ground with
   no respawns (`test/drive.test.ts`, as today's lap test), and the lap time's summary line is
   printed beside today's.

## Read first

- party-kart's `CLAUDE.md` ("The two halves", "Conventions", "Gotchas") and
  `docs/architecture.md` ("The simulation").
- `src/car/car.ts`, `src/track/track.ts` (`locate`, `surfacePoint`, `distanceToRoad`),
  `src/car/autopilot.ts`, `test/drive.test.ts`.
- braga-map's `index.d.ts` (`World`, `Line`, `Building`, the streets from task 033, `open` from
  task 032) and `README.md` ("Using it from a game").
- `src/render/levels.ts` (which decks and tunnels the game draws today, and their mouths).

## Done when

- [ ] `stepCar` drives on a `Ground` made from braga-map's world, and the simulation still loads
  under `node --test` with no three.js.
- [ ] `test/ground.test.ts` passes every case in step 6; the autopilot laps the Volta dos Amigos
  on the world's ground with no respawns.
- [ ] A step of eight cars is timed in a test, and the time is in Notes.
- [ ] `npm test` and `npm run check` pass; `docs/architecture.md` ("The simulation") says how the
  ground works.

## Out of scope

- Drawing the streets: task 035. Free roam's screens, rooms and respawn button: task 036.
- The race on the world's ground, its walls and barriers, and the bots and items in it: task 037.
- A physics engine: decision 019 keeps the arcade handling. Things that topple or fly when hit
  (bins, lamps, parked cars) are task 020's furniture first.

## Notes

- Decision 019 settled the pavements (driven on, over the kerb, outside a race) and the edge
  (barriers across the streets).
