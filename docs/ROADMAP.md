# Roadmap

How the map, and the cities games draw from it, get as close to the real Braga as they can
(decision 001). The phases are in order, and each item with a number has a task file in
[tasks/](tasks/README.md), which holds the detail and any questions for the owner. "Later"
holds ideas with no task yet. Settled decisions go to [DECISIONS.md](DECISIONS.md).

## Status

| Area | State, 2026-10-13 |
|---|---|
| The data | OpenStreetMap (streets, buildings, land, trees, crossings, lights, bus stops, landmarks), for 6.5 × 4.6 km (`tools/fetch.mjs`). The ground from DGT's 2025 LiDAR since task 009 (decision 008): every 2 m in the world near the route and in Fujacal, every 10 m elsewhere; EU-DEM only for the horizon. Also fetched into `.cache/dgt/` and read by `tools/dgt.mjs`, not used yet: the LiDAR's surface model and point cloud, the 2025 orthophoto (25 cm) and the COS2025 land use ([SOURCES.md](SOURCES.md)). About 30% of buildings have a height, floors or roof shape in OSM; the rest are guessed. 11,500 of the world's 24,523 buildings are invented, to fill built-up frontage |
| The library | braga-map is a package for games: the world in 500 m tiles grouped in six sections (`index.js`, `world/`), and the tracks planned on it (`tracks/`). party-kart loads it, pinned to a tag (`v1.2.0` since task 027) |
| The kart race's city | Real-width streets (the track never under 9 m), granite kerbs, calçada, lane lines, zebra crossings, traffic lights and bus stops from OSM, buildings at their place with guessed heights and hashed colours, trees, the Rio Este and its bridges, the hills 15 km round, Bom Jesus and the Sameiro (twice their size), the Picoto's cross, the Estádio 1.º de Maio, the Tourigalo, Makro and the Altice Forum's signs. The ground as it is (task 009): the streets tip sideways, the pavements meet the ground, retaining walls where it's higher, buildings stepped on their slopes. The race the way the traffic goes (task 027, decision 010): one-way streets the right way, no banned turns, 9.3 km. The first four-point plan (skyline, street level, real widths, landmarks) was done on 2026-10-13: "Braga as it is", braga-map `017bdd4` and party-kart `1d7a921` |
| **In flight** | Braga's own pavement pattern (the calçada drawn is Lisbon's), and a pale patch near São João da Ponte, in a party-kart session |
| Realism, measured | 29 viewpoints, each set where a real photo was taken (task 001, `refs/viewpoints.json`, decision 009): along the Volta dos Amigos, on foot in Fujacal, and of Bom Jesus and the Sameiro. No shots of them yet, no scorecard, no budget (Phase 1) |

## Phase 1 · See it: references, the scorecard and the budget

Before changing the city, know what the real one looks like, how close the game is, and how much
a phone can draw. Everything after this is checked against it.

- **002** A script that shoots every viewpoint in the game, with the frame's cost.
- **003** The scorecard: a shared page where the friends rate each viewpoint, round after round.
- **004** The budget: what a phone can draw, measured, and written down.
- **006** An audit of every street: what the map has, what the game draws, what's missing.
- **007** Photo textures: where they live, their format, their loading and their credits.
  *Blocked on where the images live.*
- **008** The photo walk: the owner and the friends photograph the route and Fujacal.
  *The owner's.*

## Phase 2 · The shape: the ground, the streets and the buildings where they really are

- **009** The relief from LiDAR: the ground at 2 m or better near the route and in Fujacal, and
  the road meeting it as it really does.
- **010** Every building's real height and roof, measured from LiDAR.
- **011** Real footprints instead of invented houses.
- **012** Bridges, flyovers and tunnels at their real levels.
- **013** Walls, fences, gates, front gardens, footpaths and steps.
- **014** Roundabouts as they are: their islands and what stands in them.
- **015** The shooter's area: its edges, its section, and what walking distance needs.
  *Blocked on the owner's answers.*
- **026** The track on the real carriageway: its centre line where the street's middle is, from
  the LiDAR and the orthophoto.

## Phase 3 · Surfaces and colours

- **016** The ground from the aerial photos: grass, paving, parking and soil where they are.
- **017** Facades: Braga's kinds of building, and each one's real colour and face.
- **018** Road markings and pavements as they are: Portugal's lines, Braga's pavements.
- **019** Trees: their species, their places and their real size.

## Phase 4 · Street furniture, landmarks and light

- **020** Street furniture where it stands: lamps, signs, bins, benches, shelters, parked cars.
- **021** The landmarks along the route, built from their photos, São João da Ponte first.
- **022** Braga's light: the real sun, the sky and the haze, and its weather.

## Alongside · The sound

The owner finds the game's audio truly horrible (2026-10-13): the engine, the beeps, the
clipping and the silence round you. It needs none of the phases above.

- **023** The mix: a limiter, levels, sounds placed where they happen, a recording to judge by,
  and synthesized sounds that don't grate.
- **024** The karts: a real kart's recorded engine for every kart, its tyres and the wind.
- **025** Braga round the track: traffic, parks, the river and the bells, from the map's data.

## How the work can run in parallel

Phase 1 comes first, but not all of it waits on itself:

- **Now, side by side:** 002 (the shots, now that 001's viewpoints are placed on 027's route),
  004's reading of the code, 006 (audit), 008 (the photo walk, the owner's), and the answers to
  007 and 015.
- **Then:** 003 once 002 has a baseline, and 004's measurements with 002.
- **Phase 2's data tasks** can start before the scorecard, now that 005 has fetched their data:
  009 first, then 010 and 011 on it. Each one is checked on the scorecard when it lands.
- **The shooter's area** goes first in every task of Phases 2–4, once 015 settles its edges.
- **The sound** runs beside all of it: 023 can start now, then 024 and 025 on it.

## Later

- **The old town's landmarks** (the Sé, the Arco da Porta Nova, the Praça da República, the
  Theatro Circo up close, the Torre de Menagem), when a track or the shooter goes there. The
  cartoon models in `../party-kart/src/render/landmarks.ts` and `braga.ts` are for the first
  track, not to scale.
- **Life in the streets:** the TUB's buses on their routes, traffic, people on the pavements
  and at the cafés' terraces.
- **Night:** the street lamps, the lit windows, Bom Jesus floodlit on the hill.
- **The seasons:** the plane trees bare in winter, the jacarandas in flower in June.
- **More of Braga's sound** (beyond task 025): the cafés' terraces, once the map fetches cafés,
  and the old town's, the Sé's bells up close.
- **The rest of the map** at the route's level of detail, as more tracks and games use it.
- **Inside the buildings,** if the shooter needs it: shops and cafés on the ground floor first.
- **The Rio Este** with its real banks, walls and weirs, and the streams the map fetches but
  doesn't draw.
- **The railway** with its rails, sleepers and catenary, the station, and a train.
