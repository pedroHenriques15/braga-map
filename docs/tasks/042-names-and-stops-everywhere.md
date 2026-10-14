---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-14
depends-on: [035]
roadmap: Now · The open world
---

# 042 · Every street's name and every bus stop, in the tiles and drawn

## Why

Task 035 draws every street in the open world's area as the track was drawn, but its blue-and-white
street plates and its bus stops stand only along the route: the world's tiles have no street names
and no bus stops, so only the route's 36 names and 30 stops, in `tracks/amigos.js`, can be drawn.
In the open world a player drives down every street, and Braga's streets have a plate at each corner
and their stops along them.

## What

Today (2026-10-14):

- braga-map: `tools/fetch.mjs` already fetches OpenStreetMap's bus stops (the `street` query,
  `node["highway"~"^(crossing|traffic_signals|bus_stop)$"]`) and every street's tags, its name
  among them (`s.t.name` in `tools/world.mjs`). `tools/track.mjs` (step 5, "What's along it") picks
  the route's streets' names, where the route turns into each, and the bus stops within 9 m of its
  road, into `tracks/amigos.js` (`streets`, `stops`). The tiles (`index.js`, `index.d.ts`'s `Line`)
  carry neither.
- party-kart: `src/render/streets.ts` stands the route's plates on the pavement behind the raised
  kerb nearest each name's point (`kerbNear`), facing the karts coming, and its stops the same way,
  a shelter where the pavement is 2.3 m wide or more. `textures.ts`'s `streetPlates` draws every
  name into one texture 512 px wide and 112 a name, which some phones can't take past 4096 px: 36
  names.

Steps:

1. **braga-map:** the tiles carry each street's name (on `Line`, or as a short list of names its
   lines point into, since one street is many lines) and the bus stops (`{ x, z, shelter }`), in
   `index.d.ts`, credited to OpenStreetMap as the rest is. A new tag for party-kart.
2. **party-kart:** a plate where each named street in the area begins, at its corners, as Braga's
   are (Questions); every bus stop in the area from the tiles, and the route's no longer from
   `amigos.js`. The plates' texture: several atlases of at most 4096 px, or the plates drawn per
   tile, so the area's few hundred names fit.
3. Shoot the viewpoints, and measure the budget (task 004, decision 017).

## Questions

- [ ] Where a plate stands: on a post at the kerb, as the route's do today, or on the corner
  building's wall, as most of Braga's are? Recommendation: on the corner building's wall where one
  stands within 3 m of the corner, else on a post.

## Read first

- braga-map: `tools/track.mjs` (step 5), `tools/world.mjs` (the lines it writes into the tiles),
  `index.js` and `index.d.ts`, `docs/SOURCES.md` (OSM's licence).
- party-kart: `src/render/streets.ts` (the plates and the stops), `src/render/textures.ts`
  (`streetPlates`), `docs/architecture.md` ("The city's budget": the plates' texture).

## Done when

- [ ] Every named street in the area has its plates, and every bus stop OSM has in the area stands
  on its pavement.
- [ ] The viewpoints where plates or stops show score no lower than the round before.
- [ ] What it costs against the budget, on High, Medium and Low, in Notes and party-kart's
  `docs/architecture.md`.
- [ ] braga-map's `npm test`, and party-kart's `npm test` and `npm run check`, pass.

## Out of scope

- Street furniture where it really stands (task 020): lamps, signs, bins, benches, shelters.
- Plates beyond the area's edge, where nobody drives.

## Notes

- Found in task 035 (2026-10-14): its step 4 asked for plates and stops on every street; the
  owner chose to draw the route's on the real pavements there and leave the rest to this task.
