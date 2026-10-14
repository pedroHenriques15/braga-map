---
status: done
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
   the kart and takes a little speed; the pavement behind it is driven on. A building that stands
   partly on a carriageway (the map's street too wide, or its line off the middle, until task 026)
   is trimmed at the kerb: solid only off the carriageway, and a passage through one stays open
   (the owner's answer below; task 035 draws them the same).
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
   at the area's edge, stopped. The autopilot drives the Volta dos Amigos on the world's ground
   wherever the route's line is on the streets, with no respawns (`test/drive.test.ts`), and its
   summary line is printed beside today's lap test's. The clean lap is task 037's (the owner's
   answer below).

## Questions

- [x] 893 buildings in the area stand partly on a carriageway (492 by a metre or more, half OSM's
  outlines and half the LiDAR's; 20 on the race's road, LiDAR slivers across it among them). What
  does a kart do with them until task 026 measures the streets? Trim them at the kerb (solid only
  off the carriageway; 035 draws them cut back the same), clear those a metre or more in (as the
  race clears its road today: about 490 go), or keep them whole (a sliver across a street blocks
  it). Recommended: trim.
  > Trim at the kerb (2026-10-14).
- [x] The autopilot can't lap cleanly on the world's ground: it follows the race's line, which runs
  11 m off the real street at the Liberdade underpass (over the cutting) and through the dead
  end's made-up link (no street, task 039). Move the clean lap to 037 and drive the route here
  wherever it's on the streets, put the route on the streets here (037's step 1), or leave the
  test as written until 037? Recommended: move it.
  > The clean lap moves to 037; 034 drives the route wherever its line is on the streets, with no
  > respawns, and prints the summary (2026-10-14).

## Read first

- party-kart's `CLAUDE.md` ("The two halves", "Conventions", "Gotchas") and
  `docs/architecture.md` ("The simulation").
- `src/car/car.ts`, `src/track/track.ts` (`locate`, `surfacePoint`, `distanceToRoad`),
  `src/car/autopilot.ts`, `test/drive.test.ts`.
- braga-map's `index.d.ts` (`World`, `Line`, `Building`, the streets from task 033, `open` from
  task 032) and `README.md` ("Using it from a game").
- `src/render/levels.ts` (which decks and tunnels the game draws today, and their mouths).

## Done when

- [x] `stepCar` drives on a `Ground` made from braga-map's world, and the simulation still loads
  under `node --test` with no three.js. (`worldGround` in `src/world/ground.ts`, its land in
  `src/world/land.ts`; neither, nor `src/car/`, imports three.js or touches the DOM, and
  `test/ground.test.ts` loads them under `node --test`.)
- [x] `test/ground.test.ts` passes every case in step 6; the autopilot drives the Volta dos Amigos
  on the world's ground wherever its line is on the streets, with no respawns. (9 of 9, on braga-map
  1.7.0's tiles, the gates the area's real ones; `test/drive.test.ts`: 8.94 of 9.26 km, respawns 0,
  its line printed beside today's lap's.)
- [x] A step of eight cars is timed in a test, and the time is in Notes. (29–41 µs on the desktop.)
- [x] `npm test` and `npm run check` pass; `docs/architecture.md` ("The simulation") says how the
  ground works. (34 of 34 and `tsc` clean, pinned to braga-map 1.7.0; "The ground" in it.)

## Out of scope

- Drawing the streets: task 035. Free roam's screens, rooms and respawn button: task 036.
- The race on the world's ground, its walls and barriers, and the bots and items in it: task 037.
- A physics engine: decision 019 keeps the arcade handling. Things that topple or fly when hit
  (bins, lamps, parked cars) are task 020's furniture first.

## Notes

- Decision 019 settled the pavements (driven on, over the kerb, outside a race) and the edge
  (barriers across the streets).

### Started 2026-10-14

- **Done, in party-kart (uncommitted):** `stepCar` takes a `Ground` (`src/car/car.ts`: `under`
  before the move, `contact` after it, with `settle`, `fly` and `bounce` shared). The race's is
  `trackGround(track)`, today's code moved as it was: the race, the bots and the menu's cars run on
  it until task 037, and today's lap test prints the same line to the digit (`laps 265.6, 263.5 s;
  respawns 0; longest air 0.00 s; top 217 km/h; wall hits 0`). The world's is `worldGround(world)`
  in `src/world/ground.ts`, from `loadWorld({ open: true })` (braga-map's task 032 landed while this
  was under way, so the area's edge and its 121 gates are the real ones). The land the game draws
  moved out of `city.ts` (and `mouths` out of `levels.ts`) into `src/world/land.ts`, so the
  simulation stands on exactly the land that's drawn: the same at 577,248 points checked, old against
  new. `docs/architecture.md` ("The ground") says how it works; `CLAUDE.md` lists `src/world/` with
  the simulation.
- **Tests:** `test/ground.test.ts` (9: every case in step 6, the respawn, the timing) and
  `test/drive.test.ts`'s new case; `npm test` 34 of 34, `npm run check` and `npm run build` pass.
  The route on the world's ground: `8.94 of 9.26 km in 268.1 s (120 km/h on average), skipping
  621–719 and 7681–7902; respawns 0; longest air 1.04 s; top 141 km/h; wall hits 1`, beside today's
  lap line above (no boost pads on the world's ground: they're the race's, task 037).
- **Fast enough:** eight cars take 29–37 µs a step on the desktop (Node 24), timed in
  `test/ground.test.ts`; the game takes two steps a frame, so even ten times slower on a phone it's
  under a millisecond of a 16.7 ms frame. Built in about 0.2 s (74,340 building walls, 993 buildings
  trimmed at the kerb, 585 tunnel sides, 500 parapets, 144 mouth walls, 1,754 edge walls, 121
  barriers, 4,184 trees, 35 pieces off the ground); `loadWorld({ open: true })` takes 134 ms for
  its 49 tiles.
- **party-kart's braga-map** is a copy of braga-map `2581f23` (task 032 done), installed with
  `npm install --install-links` from the scratchpad so the other session's working tree couldn't
  change under it. Its tests now need braga-map's streets and area: committing this needs a new
  braga-map tag (1.7.0 at `2581f23` or later) and party-kart pinned to it, with `package.json` put
  back from the local path.
- **Found, and handled in the ground:**
  - The river's bed (`land.ts`, from city.ts) was cut under the streets within 16 m of the Rio
    Este's middle: at São João da Ponte the street off the deck's north end sat 3 m low, and the
    deck got a parapet across its end. Streets now stand on `firm` land, the bed only under bare
    land.
  - Decks' and tunnels' ends are up to 0.66 m off the land where they meet it (194 of 480 places
    more than 0.15 m): eased over 10 m in the ground; the data fix is task 040.
  - A pavement on the ground lies over a deck's or tunnel's road at its end (1,952 m²): the road wins
    in the ground; task 040 cuts them back.
  - The tunnels' mouths' concrete as levels.ts draws it stands 0.4 m over the land over the tunnel,
    in the 31 de Janeiro over the João XXI's mouth, and a tunnel's side as high as the land beside
    it stood in that street too: both stop cars only up to 3 m over the tunnel's road.
  - 993 buildings stand partly on a carriageway, slivers outlined from the LiDAR right across the
    route's road among them: trimmed at the kerb (the owner's answer).
- **Found, for other tasks:** the route's line off the streets (task 037, its Notes); what the
  drawing has to match (task 035, its Notes); the levels' data (task 040, drafted). No wall or
  railing stands where a street's edge drops into a cutting (braga-map has no walls or fences yet,
  task 013): a kart that leaves the street there falls in, and drives out along the cutting's road.
- **Respawns:** a car is lost in the land, in the river, wedged between walls (still 0.3 m into one
  after four pushes) or out of the loaded tiles; `spawn` puts it on the nearest street's middle at
  its level inside the area. It can't turn over in this handling, so "upside down" never happens.
  Free roam's respawn button is task 036's.
- **Not done here:** nothing in the game drives on the world's ground yet (free roam is 036, the
  race 037): this task's code changes nothing a player sees (the land is the same function, moved).
  Not checked in a browser. The newer braga-map it needs does: task 032's ground every 2 m under the
  whole area, and 033's streets in the tiles, which the game downloads and doesn't draw yet.

### Finished 2026-10-14

- **braga-map 1.7.0** (`425b19e`, tasks 033 and 032's data: the streets as surfaces and the open
  world's area) tagged and pushed, the owner's go-ahead; party-kart pinned to it from GitHub, and its
  `npm test` (34 of 34, the same lap lines) and `npm run check` pass on it. braga-map's `npm test`
  49 of 49 at the tag.
- **What the pin costs:** `node scripts/download.mjs` says 6.79 MB, 2.07 MB gzipped, the tiles 1.75
  MB of it (1.25 MB at the budget's last measure): the streets and the 2 m ground under the area,
  downloaded but not drawn until tasks 035 and 036. In party-kart's `docs/architecture.md`'s budget.
  Past the 1.5 MB guide, as the city already was (decision 017).
- **No viewpoints shot:** the task names none, and its code changes nothing drawn. The 2 m ground
  under the whole area changes the land only away from the route and Fujacal, which had it already.
- **Decision 021:** a kart drives on the world as the map has it, and a building in a street is cut
  at the kerb.

