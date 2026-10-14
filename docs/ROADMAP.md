# Roadmap

How the map, and the cities games draw from it, get as close to the real Braga as they can
(decision 001). The phases are in order, and each item with a number has a task file in
[tasks/](tasks/README.md), which holds the detail and any questions for the owner. "Later"
holds ideas with no task yet. Settled decisions go to [DECISIONS.md](DECISIONS.md).

## Status

| Area | State, 2026-10-14 |
|---|---|
| The data | OpenStreetMap (streets, footways and paths, buildings, land, trees, crossings, lights, bus stops, landmarks), for 6.5 × 4.6 km (`tools/fetch.mjs`), taken as it is (decision 022). The world draws every street it has (task 006's audit, `tools/audit.mjs`): round the Volta dos Amigos all 202 km, but 8 squares mapped in parts (task 041), and none of the 171 km of footways, steps and paths yet (task 013); along the route and in Fujacal it lacks no street in use. The ground from DGT's 2025 LiDAR since task 009 (decision 008): every 2 m in the world near the route, in Fujacal and over the open world's area, every 10 m elsewhere; EU-DEM only for the horizon. Also fetched into `.cache/dgt/` and read by `tools/dgt.mjs`, not used yet: the LiDAR's surface model and point cloud, the 2025 orthophoto (25 cm) and the COS2025 land use ([SOURCES.md](SOURCES.md)). About 30% of buildings have a height, floors or roof shape in OSM; the rest are guessed. Since task 011 none is invented: the 7,251 buildings OSM lacks are the LiDAR's, outlined and measured from it (`tools/roofs.mjs`, `tools/footprints.mjs`), where 11,492 houses were invented to fill built-up frontage |
| The library | braga-map is a package for games: the world in 500 m tiles grouped in six sections (`index.js`, `world/`), and the tracks planned on it (`tracks/`). party-kart loads it, pinned to a tag (`v1.7.0` since task 034) |
| The kart race's city | Real-width streets (the track never under 9 m), granite kerbs, calçada, lane lines, zebra crossings, traffic lights and bus stops from OSM, buildings at their place with guessed heights and hashed colours, trees, the Rio Este and its bridges, the hills 15 km round, Bom Jesus and the Sameiro (twice their size), the Picoto's cross, the Estádio 1.º de Maio, the Tourigalo as it is (task 029: the black bull with a rooster's head, on its lawn), Makro and the Altice Forum's signs. The ground as it is (task 009): the streets tip sideways, the pavements meet the ground, retaining walls where it's higher, buildings stepped on their slopes. The race the way the traffic goes (task 027, decision 010): one-way streets the right way, no banned turns, 9.3 km. The first four-point plan (skyline, street level, real widths, landmarks) was done on 2026-10-13: "Braga as it is", braga-map `017bdd4` and party-kart `1d7a921`. The friends drive it, each in a car that's a joke about them, and each one's easter egg stands on their house (tasks 028 and 030, decision 014) |
| The sound | Synthesized, through one mix since task 023: buses for the engines, the effects, the jingles and the ambience, into a limiter; the countdown, checkpoints, laps and finish one family of jingles; others' items, hits and the eggs heard from where they are. Judged by ear on two recorded takes, party-kart's `scripts/listen.mjs`, the baseline `2026-10-14-baseline`. Every kart's engine a race car's V8 through six gears, the nearest three others' heard from where they are with their Doppler shift, and your tyres and the wind (024, the owner's choice of engine after hearing a recording and a two-stroke, decision 016). Braga round the track (025): traffic, the town's hum, birds in the parks and insects in the woods, by what's within 150 m, the Rio Este, the bells, the buses and the stadium's crowd, from eight CC0 recordings, 10 dB under the engines |
| The open world | Decided on 2026-10-14 (decision 019): Party Kart opens driving in Braga, anywhere in the Volta dos Amigos' area, every street at its real width with its junctions, kerbs, pavements, bridges and tunnels; the race is a game mode in it, at the streets' real widths. Every street in the area is a surface in the tiles since task 033 (`world.streets`): its carriageway at its real width, joined at junctions with their kerbs rounded, roundabouts' islands, central reservations, pavements, kerbs dropped at the crossings, and the markings OSM gives, at their levels on bridges and in tunnels. The area has its edge since task 032 (decision 020): 3.1 km² round the loop and the Picoto's top, worked out from the streets (`tools/open.mjs`), with 121 gates where its streets leave it for a game's barriers, and the ground every 2 m under it. party-kart's karts can drive on them since task 034 (decision 021): the world's ground, the land, the streets at their levels and what stands on them, in its simulation and tests; nothing in the game drives or draws them yet (tasks 035–037) |
| **In flight** | Braga's own pavement pattern (the calçada drawn is Lisbon's), and a pale patch near São João da Ponte, in a party-kart session. |
| Realism, measured | 29 viewpoints, each set where a real photo was taken (task 001, `refs/viewpoints.json`, decision 009): along the Volta dos Amigos, on foot in Fujacal, and of Bom Jesus and the Sameiro. Shot in the game at High and Low by party-kart's `scripts/shots.mjs` (task 002, decision 011), the same every time, beside their photos: the baseline round is `2026-10-13-baseline`, and the second, `2026-10-14-friends` ("Os amigos", tasks 028–030), is the one open for marks. Rated on the scorecard "Braga real" (task 003, decision 012, https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs), by the owner alone for now: the baseline averages 2.6 of 5. The budget (task 004, decision 013): today's city, rounded up, in party-kart's `docs/architecture.md`; `?stats` measures a phone. A guide, not a limit (decision 017): realism first, and the games move to a stack that scales, or the owner's homelab, when they outgrow it. The reference photos (task 008, `refs/photos.json`, decision 018): 424 found online, from Mapillary and Commons, for the facades in the shooter's area and those a local knows along the route, the landmarks, bridges, roundabouts, kinds of building and wall, and close-ups; 26 good enough for a texture; the gaps listed in the task, about half the shooter's area's buildings among them |

## Now · The open world

Party Kart becomes an open world over the Volta dos Amigos' area, and the race a game mode in it
(decision 019, 2026-10-14). It goes first: the tasks after it build on the streets it makes. It's
done end to end on Fujacal first (its streets as surfaces, drawn and driven on), then over the
whole area, and ships as one release when 037 is done, so the live game never loses its race.

- **035** The streets drawn: every street in the area as the track is drawn today.
- **036** Free roam: the game opens in Braga, and friends join you there.
- **037** The race as a game mode in the open world, on the streets at their real widths.
- **038** The city streamed tile by tile, when the area grows.
- **039** Into the dead end by a ramp: the made-up `(joined)` road goes, and the race jumps
  from a real street onto another, only during a race.
- **042** Every street's name and every bus stop in the tiles, and their plates and stops drawn
  on every street in the area (035 draws the route's).
- **043** The ground held to the street at a deck's end and a tunnel's mouth, where the tiles'
  2 m ground dips into the abutment or climbs the portal (040 made the decks meet it exactly).

## Phase 1 · See it: references, the scorecard and the budget

Before changing the city, know what the real one looks like, how close the game is, and how much
a phone can draw. Everything after this is checked against it.

- **007** Photo textures: their format, their loading and their credits. They live in
  braga-map, with the world.

## Phase 2 · The shape: the ground, the streets and the buildings where they really are

- **010** Every building's real height and roof, measured from LiDAR.
- **011** Real footprints instead of invented houses.
- **012** Bridges, flyovers and tunnels at their real levels.
- **013** Walls, fences, gates, front gardens, footpaths and steps.
- **014** Roundabouts as they are: their islands and what stands in them.
- **015** The shooter's area: its edges, its section, and what walking distance needs. The
  five streets plus a block each side, to the Avenida da Liberdade; streets, squares and open
  courtyards, no interiors; braga-map stays data only.
- **026** The track on the real carriageway: its centre line where the street's middle is, from
  the LiDAR and the orthophoto.
- **041** The squares OpenStreetMap maps in parts, the Praça da República among them, drawn as
  squares (found by 006's audit).

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

The owner found the game's audio truly horrible (2026-10-13): the engine, the beeps, the
clipping and the silence round you. Tasks 023, 024 and 025 answered it on 2026-10-14: the mix, a
race car's engine for every kart, and Braga round the track. More of Braga's sound is in "Later".

## How the work can run in parallel

Phase 1 comes first, but not all of it waits on itself:

- **The open world first:** 032, 033, 034 and 040 are done; 035 next, with 043 beside it (its data);
  036 once the streets are drawn; 037 last. 038 when the area grows. 039 any time, in today's race; 037 carries its ramp
  into the open world. 014, 018 and 026 now work on 033's surfaces, for every street in the area.
- **Side by side:** 007 (the textures' pipeline) and 015 (the shooter's area). 006 (the street
  audit) and 008 (the reference photos) are done; 041 (the squares the audit found missing) can
  start. Every question in the tasks was answered on 2026-10-14.
- **Phase 2's data tasks** can start now: 005 fetched their data, and 009 put the ground under
  them (decision 008), so 010 and 011 build on it. Each one is checked on the scorecard when it
  lands.
- **The shooter's area** goes first in every task of Phases 2–4, once 015 settles its edges.
- **The sound** is done (023–025); what's next of it is in "Later".

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
- **The rest of the map** at the route's level of detail, as more tracks and games use it, and
  the open world grown over it a section at a time (decision 019).
- **Inside the buildings,** if the shooter needs it: shops and cafés on the ground floor first.
- **The Rio Este** with its real banks, walls and weirs, and the streams the map fetches but
  doesn't draw.
- **The railway** with its rails, sleepers and catenary, the station, and a train.
