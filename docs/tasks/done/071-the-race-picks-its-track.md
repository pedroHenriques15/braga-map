---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-19
depends-on: []
roadmap: Games · More tracks and the shooter
---

# 071 · The race picks its track: the host chooses one from a list, and every track is raced the same way

## Why

braga-map can plan any number of tracks (`tools/tracks.mjs`, `tools/track.mjs`), but party-kart races
one: the Volta dos Amigos, imported by name and built into the city at load. The owner wants more
tracks in the open world (2026-10-19), and each one would otherwise mean editing the game in a dozen
places. This task makes party-kart race whichever track the host picks, so a new one (task 072) is a
line in a list.

## What

Today (party-kart `a611fba`, braga-map 1.29.0):

- `src/main.ts:2` imports `braga-map/tracks/amigos.js`; `:54` builds the one `track` with
  `buildTrack(amigos.points, amigos.ramps)`; `:57` sets the global lap limit from its length
  (`setLapLimit`, `src/session.ts:19-23`); `:80` builds the city with it, `buildCity(track, amigos, ...)`.
  The `Arena`, `Racer`, `ItemsView` and `Hud` all take that one `track` (`main.ts:1012-1043`), and the
  race's minimap draws its samples (`main.ts:799`).
- `src/render/city.ts` reads the course for the tiles to load (`:229`, `loadWorld(course.box)`), the
  race's ground (`:505`, `raceGround(wg, track, course)` from `src/world/race.ts:242`), the race's marks
  (`:507-508`: the start gate, checkpoints, boost pads, wall boards, ramp and barrier rows, baked into a
  group shown only in a race, `main.ts:1061` and `:1078`), the cleared walls (`render/streets.ts:768`),
  the eggs (`:545`), the start plinth and its sign (`:530`, `:1294`, `:1331`), the landmarks' signs
  (`:593`) and the sights (`:588`). "VOLTA DOS AMIGOS" is written in `city.ts:507`, `:1331` and
  `render/textures.ts:296`; the menu's copy says "9 km" (`main.ts:489`, `:547`), where the track is
  10.17 km.
- The race's settings (`Settings`, `src/session.ts:25-32`: mode, laps, minutes, items, catch-up, bots)
  travel in the `lobby` message (`session.ts:87`), and `start` (`:90`) carries the grid. Nothing names
  a track. The race screen (`raceScreen`, `main.ts:507-557`) has no track picker.
- The tests that guard the track take the Volta by name: `test/drive.test.ts:64-75` (a 7–10.5 km loop
  with 5 checkpoints in order), `:85-97` (the autopilot laps it with no respawn, lap 2 in 170–310 s),
  `:104-196` (its jump and its walls), `race.test.ts:247-264` (eight bots), `ground.test.ts:387-395`,
  `ambience.test.ts`, `names.test.ts`. braga-map's own tests are already over every `tracks/*.js`
  (`test/map.test.js:33`, `rules.test.js:41, 62`, `relief.test.js`), but for `eggs.test.js`,
  `open.test.js:42` and `streets.test.js:724-762`, which are the Volta's.
- braga-map exports `./tracks/*.js` with a wildcard (`package.json:12-15`), so a new track imports with
  no change there.

Steps:

1. A list of the tracks the game races, in one module (for example `src/tracks.ts`): each an id, its
   name, its length and its braga-map file, imported only when it's raced if that keeps the download
   down. Today it holds the Volta alone.
2. `Settings` gains the track's id. The host picks it on the race screen ("Pista"), with each track's
   name and length; with one track the screen shows it without a choice. Guests take it from the
   lobby, and `startRace` builds the race on the track it names: its `Track`, lap limit, race ground,
   race marks, minimap, item boxes and the menu's copy (its real length, not "9 km"). Change the
   peer prefix (`PREFIX`, `session.ts:11`): an old guest would race the Volta whatever the host picked
   (`docs/making-changes.md`, "A new network message").
3. What a race builds at load today, its ground and marks, is built for the track it's on: when the
   race starts, or for every track at load if that's quick enough. Measure both, on High and on a
   phone (`?stats`), and say which in Notes.
4. The Volta's place in the world stays when no race is on: its start plinth and sign on the Rua do
   Fujacal, the eggs on the friends' houses (decision 014) and its landmarks' signs. A sign naming a
   track takes the track's name, not the words "VOLTA DOS AMIGOS".
5. The tests run over every track in the list: a closed loop of 7–10.5 km with 5 checkpoints in order,
   the autopilot's two laps with no respawn and lap 2 within a range worked out from the track's
   length (the Volta keeps its 170–310 s), the race closed by its walls and barriers, the bots racing
   a lap with items. What is the Volta's own (its jump, its landing's walls, its eggs) stays tested on
   the Volta.
6. Check it with a second track planned locally and not committed: any loop through public waypoints
   inside the open world's area (`tools/tracks.mjs`), or task 072's first candidate if it's ready. A
   host and a guest in two browsers race it, then the Volta, from the menu.
7. Update the docs: party-kart's `README.md` (the track), `docs/architecture.md` (`:13`, `:97`,
   `:127-130`, the prefix at `:258-260`), `docs/making-changes.md` ("The track" becomes "The tracks":
   how to add one), `CLAUDE.md` where it names `amigos.points`; braga-map's `README.md` "A new track",
   which says how a game races one.
8. `npm test` and `npm run check` in party-kart, `npm test` in braga-map.

## Read first

- party-kart's `CLAUDE.md` ("The two halves", "How a race runs") and `docs/making-changes.md` ("The
  track", "A new network message").
- `src/main.ts`: `startRace` (`:1003`), `endRace` (`:1072`), `raceScreen` (`:507`).
- `src/render/city.ts:225-600`: what the city builds from the course.
- `src/world/race.ts`: `raceGround`, `raceWalls`, `clearedWalls`.
- braga-map's `tracks/track.d.ts`: what a track file holds.

## Done when

- [x] The race screen lists the tracks and the host's pick reaches every guest; a race on the second,
      local track and then on the Volta both run from the menu with a guest in another browser.
      (Two Playwright browsers, a host and a guest in a room over PeerJS: the host picked the track
      on "Pista", the guest's screen showed it, both raced it with the autopilot for 25 s, then the
      Volta; first with task 072's east candidate, local, then with the Volta de Lamaçães.)
- [x] Nothing outside the track list and the Volta's own tests imports `amigos.js`, and no sign or
      copy names the Volta when another track is raced. (`src/tracks.ts` alone in `src/`; the
      start's boards and gate take the track's name, "VOLTA DE LAMAÇÃES · BRAGA" in the screenshot;
      the menu's copy names the track picked; the plinth names the home track, which it stands at.)
- [x] Every test that guards a track runs over each in the list. (`test/drive.test.ts` and
      `race.test.ts` loop over `TRACKS`.)
- [x] A race on the Volta is as it was: the autopilot's lap times, the jump, the walls (the tests).
      (Laps 302.8, 299.9 s, as before; its jump, landing and walls tests pass.)
- [x] How long a race's ground and marks take to build, at load or at the start, is in Notes.
- [x] `npm test` and `npm run check` pass in party-kart; `npm test` in braga-map. (72 and 142.)

## Out of scope

- Planning the second track: task 072.
- Tracks outside the open world's area, which would grow it (decision 019).
- Keeping the best laps or the ghost per track between sessions: they're in memory and per room
  today (`main.ts:241-243`), and stay so.

## Notes

Drafted 2026-10-19 from the owner's answers: more tracks, inside today's open world, and the shooter
on foot in Party Kart (tasks 073–075). This one goes first in party-kart: 073 also changes `main.ts`
and `session.ts`, and two sessions never work on the same file there.

Viewpoints: none, as the city a round shoots doesn't change; no round, no budget.

Done 2026-10-20 (party-kart, braga-map 1.30.0):

- `src/tracks.ts` holds `TRACKS` (each braga-map's course and what the race screen says of it),
  `HOME` (the Volta dos Amigos), `courseById`, `lapLimit` and `km`. The tracks are imported with the
  game, about 42 KB gzipped each, not when raced: a race starts the moment the host's message comes,
  and decision 052 keeps the game one script.
- `Settings.track` is the track's id; the host's `start` takes the lap limit of the track in the
  lobby (`setLapLimit` is gone). The prefix is `partykart-pk39-`.
- `buildCity` keeps building round the home track (its plinth, eggs, landmarks' signs, the cleared
  walls drawn apart) and returns `raceOn(track, course)`: a race's ground and its baked marks.
  `main.ts` builds every track's at load, after the city. **At load, not at the start**: measured in
  Chromium on a desktop at High (`console.info` at load), 250 ms for three tracks (the Volta and the
  two candidates), 121 ms for the two kept, about 60–85 ms a track, against a city of 5.4–8.1 s; so
  a race starts with nothing to build and its materials compiled with the rest at load. Not measured
  on a phone (none here): at four times slower it would still be about half a second on a build of
  20 s or more.
- Only the home track's walls are drawn apart (`cleared`), so a test keeps every other track's
  `cleared` empty and every track inside the open world. The eggs go off only in the home track's
  race.
- The lap's range for another track is a mean speed of 25–60 m/s, not the Volta's 170–310 s scaled
  by length: the east candidate's 291 s for 8.9 km (31 m/s) was outside the scaled range, a street
  loop's corners being slower than the Volta's avenues.
- Found along the way: the race test's lap time needed a length-free bound (above); braga-map's
  viewpoint test took the nearest track, which on the Rua Álvaro Carneiro is now the Volta de
  Lamaçães going the other way: it takes any track within 12 m that the viewpoint looks along.
