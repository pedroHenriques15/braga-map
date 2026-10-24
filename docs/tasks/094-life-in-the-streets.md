---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-23
depends-on: [020]
roadmap: Ultra · Braga at its most real
---

# 094 · Life in the streets: traffic, the TUB's buses, people on the pavements

## Why

The city is empty: no car drives, no bus stops at its stop, nobody walks. The sound has traffic
(`src/ambience.ts`) but nothing is seen making it. A real street is never empty, and an empty one
is the first thing that says "game".

## What

Today: no traffic, buses or pedestrians in party-kart; the bus stops are drawn (task 042); the
parked cars the LiDAR saw are in braga-map's tiles (`world.groundCover.cars`, 41,683) and task 020
draws them.

1. **Traffic:** cars on the streets round the player, keeping the rules of the road as the race
   does (decision 010: one-way streets, banned turns), stopping at the traffic lights and give-way
   lines, of the makes and colours Portugal's cars come in; they slow for a kart and never block
   the race's road (out of the race's way, or none in a race).
2. **The TUB's buses** on their real routes, stopping at their stops, in TUB's livery (drawn, not a
   photo): the GTFS feed's licence asked of TUB first (task 020's note).
3. **People on the pavements:** walking where the footways and pavements are, waiting at the bus
   stops, sitting at the cafés' terraces (where OSM has cafés with `outdoor_seating`), crossing at
   the zebra crossings; never in a race's road, and moving out of a kart's way.
4. **Density** by the hour (`?time=`) and the street's class, on Ultra the most, on High fewer, on
   Low none. In the deathmatch, none (decision 056).
5. `?scenery` draws none, so rounds stay the city alone (decision 011).

## Questions

- [x] Where the TUB's buses drive: TUB's GTFS (its licence asked first), OpenStreetMap's bus
  routes, or made-up loops? Recommendation: OpenStreetMap's route relations.
  > OpenStreetMap's bus routes, at made-up intervals; no GTFS (the owner, 2026-10-24). Step 2's
  > "the GTFS feed's licence asked of TUB first" no longer applies.
- [x] The cars, buses and people: CC0 3D models, or built in code? Recommendation: CC0 models,
  their textures made.
  > CC0 models (the owner, 2026-10-24), as task 020's answer says: each on record, at real size,
  > no photo texture (decision 061).

## Read first

- braga-map's `docs/DECISIONS.md` 010, 011, 056; tasks 020, 042; party-kart's `src/ambience.ts`,
  `src/world/paths.ts`, `src/race.ts`, `docs/architecture.md` ("The simulation").

## Done when

- [ ] Driving the open world on Ultra, cars, buses and people move as Braga's do, and none in a
  race's road or in the deathmatch.
- [ ] No viewpoint changes (`?scenery` draws none).
- [ ] `npm test` and `npm run check` pass; the cost is in the budget.

## Out of scope

- Where the furniture and parked cars stand: 020.
