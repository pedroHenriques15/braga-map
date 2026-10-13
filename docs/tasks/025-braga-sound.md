---
status: todo
priority: medium
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [023]
roadmap: Alongside · The sound
---

# 025 · Braga's sound round the track: the traffic, the parks, the river and the bells

## Why

Round your kart there is silence: no traffic on the avenues, no birds in the Picoto's woods, no
water at the Rio Este, no bells in a city of churches. The owner names that silence as one of
the things wrong with the audio (2026-10-13), and decision 001 asks for Braga as it is. The map
already knows what surrounds every metre of the route, so the sound can follow it.

## What

Paths in this task are party-kart's (`../party-kart/`), unless they start with `../braga-map/`.

Today there's no ambient sound at all. What the game loads (`loadWorld`, types in
`../braga-map/index.d.ts`) says what's round the kart:

- `areas`, each a kind: `urban`, `industrial`, `park`, `forest`, `grass`, `scrub`, `farm`,
  `cemetery`, `hospital`, `school`, `sport`, `water`, `plaza`;
- `lines`, the streets by class (0 the fast roads, 2 primary, 3 secondary, 4 tertiary,
  5 residential, 6 pedestrian…) and the railway (9);
- `buildings`, with the churches (kind 3); `rivers`, with their water levels; `trees`;
- the track's `stops` (25 bus stops beside it) and `landmarks` (within 220 m: the Estádio 1.º de
  Maio, the Altice Forum and the Picoto Adventure Park), and `map().sights`.

The recordings are CC0 only: the owner chose not to record sound on the photo walk (2026-10-13).
Task 023 gives the ambience bus, the panners and the recording to judge by.

Steps:

1. **The recordings:** find CC0 loops on Freesound (filtered by licence): city traffic far and
   near, a quiet residential street, birds in a park, a wood, a small river, church bells, a
   bus pulling away. Prefer Portuguese or Iberian recordings where there are any. Each as MP3
   or AAC, short enough to loop cleanly, in under 1 MB in all, loaded after the race's scene.
2. **Beds that follow the place:** every half second, weigh what's within about 150 m of your
   kart (busy streets by class, urban and residential areas, parks and woods, water) and
   crossfade the beds to match, slowly enough not to pump. Quiet under the engines: the city is
   behind the race, not over it.
3. **Sounds with a place,** through 023's panners: water along the Rio Este (`rivers`), bells
   now and then from the nearest churches (buildings of kind 3) at the hour and the half hour of
   the race clock, a bus at a stop as you pass (`stops`), and the stadium's crowd when you're
   near the Estádio 1.º de Maio.
4. **On record:** each recording's Freesound id, author and licence in
   `../braga-map/docs/SOURCES.md`'s "Sounds" (024 makes the section).

## Read first

- `../braga-map/index.d.ts` (`World`, `Area`, `Line`, `Building`, `River`, `Sight`) and
  `../braga-map/tracks/track.d.ts` (`stops`, `landmarks`).
- `src/render/city.ts` (how the city is loaded round the track), and `src/audio.ts` as task 023
  left it.

## Done when

- [ ] Recordings at three places on the route (the Avenida da Liberdade, the Rio Este at São João
  da Ponte, and the Picoto's woods) sound like those places: the owner listens beside the
  baseline.
- [ ] Driving through, the sound changes with the place, without jumps or pumping.
- [ ] The city never covers the engines or the items.
- [ ] The sound files are under 1 MB in all, and cost a phone little (task 004's budget, if it
  exists by then).
- [ ] Every recording is in `docs/SOURCES.md`.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- The engines, tyres and wind: task 024. The mix: task 023.
- The cafés' terraces: the map doesn't fetch cafés yet (OSM's `amenity=cafe`), so they stay in
  the roadmap's "Later".
- The old town's sound, the Sé's bells up close: with the old town's landmarks, "Later".
- Music: the owner chose none (2026-10-13).

## Notes
