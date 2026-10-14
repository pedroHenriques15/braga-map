---
status: done
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

- [x] Recordings at three places on the route (the Avenida da Liberdade, the Rio Este at São João
  da Ponte, and the Picoto's woods) sound like those places: the owner listens beside the
  baseline.
  > "Sounds right", 2026-10-14, of party-kart's `sounds/2026-10-14-braga/` (its `liberdade`,
  > `ponte` and `picoto` takes) beside the baseline. Each bed's loudest in them: the Avenida,
  > traffic 0.51 and town 0.34; the Picoto, birds 0.50 over traffic 0.41; the river full where the
  > track crosses it.
- [x] Driving through, the sound changes with the place, without jumps or pumping.
  > The beds are re-weighted every half second and crossfaded over 1.5 s; what's round the track is
  > interpolated between entries 10 m apart. The owner heard the six takes.
- [x] The city never covers the engines or the items.
  > The beds sit about 10 dB under the engines (a take's loudness moves by under 0.5 dB with them);
  > nothing clipped in any take, the loudest at −4.9 dBFS.
- [x] The sound files are under 1 MB in all, and cost a phone little (task 004's budget, if it
  exists by then).
  > 673 KB, fetched once the sound is unlocked, after the city. At most six loops play, at their
  > own rate (no resampling); what's round the track is worked out once, in 0.3 s here. Task 004's
  > budget has no line for sound. Not measured on a phone.
- [x] Every recording is in `docs/SOURCES.md`.
  > "Sounds", "In use: the city round the track": each file, its recording, where, and its cut.
- [x] `npm test` and `npm run check` pass.
  > 24 of 24 (with `test/ambience.test.ts`, and task 010's 4 in progress), and `tsc` clean.

## Out of scope

- The engines, tyres and wind: task 024. The mix: task 023.
- The cafés' terraces: the map doesn't fetch cafés yet (OSM's `amenity=cafe`), so they stay in
  the roadmap's "Later".
- The old town's sound, the Sé's bells up close: with the old town's landmarks, "Later".
- Music: the owner chose none (2026-10-13).

## Notes
- **Done in party-kart, 2026-10-14, committed as `31dcce9`:**
  - The recordings: eight CC0 ones from Freesound, cut into `src/sounds/` (673 KB): traffic from
    Coimbra, the town's hum from a roadside by Madrid's Retiro, birds at dawn in Lisbon (Olivais
    Sul) for the parks, insects and birds in Longos by Braga for the woods, the river through
    Couros in Guimarães, a crowd at Stavanger's stadium, the bells of São Pedro de Miragaia in
    Porto, and a bus pulling away in Portland. Each bed from the stretch of its recording whose
    loudness holds steadiest (nothing jumping out to be noticed each time round), a loop with its
    own wrap-around, rebuilt when decoded with a 10 ms crossfade at the seam. `docs/SOURCES.md`
    has every cut. No CC0 recording of a Braga street, a Portuguese bus or a Portuguese crowd was
    found.
  - What's round the track (`src/ambience.ts`, no three.js, tested): every 10 m, traffic from the
    streets within 150 m by their class and nearness (the Avenida da Liberdade 0.88, the Picoto
    0.14), the town where buildings stand or urban areas lie, park and woods from the areas and the
    trees; and the 174 churches, the rivers every 10 m, the 30 bus stops and the stadium. From
    `loadWorld` once the city is built (0.08 s) and `ambienceOf` (0.2 s), 1.5 s after the page is
    up, in the menus: `city.ts` is untouched.
  - The sound (`citySound` in `src/audio.ts`): the beds on the ambience bus, re-weighted every half
    second and crossfaded over 1.5 s; the river from its nearest water within 120 m; the crowd from
    the stadium within 400 m; the bells from the nearest church at Braga's hour and half hour (the
    wall clock, Europe/Lisbon: a race is minutes long, its own clock never reaches an hour), and one
    time in four, at most once a minute, from a church you pass within 100 m; a bus one stop in
    three, at most every 30 s. All faded out when a race ends, and stopped.
  - `listen.mjs` has the three places as 30 s takes (`liberdade` from sample 640, `ponte` from
    990, `picoto` from 5480), and reports each bed's loudest level in a take.
  - Docs: party-kart's `CLAUDE.md`, `README.md`, `docs/architecture.md` ("Sound", "Hardly any
    assets", `ambience.ts` in the table); braga-map's `docs/SOURCES.md`.
