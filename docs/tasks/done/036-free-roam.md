---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-14
depends-on: [034, 035]
roadmap: Now · The open world
---

# 036 · Free roam: the game opens in Braga, and friends join you there

## Why

Party Kart is a race today: a home screen, a lobby, a race, its results, and back to the
lobby. In the open world (decision 019) the game opens with you driving in Braga, wherever you
like inside the area, alone or with the friends who follow your invite link, and the race is
something you start from there (task 037). The owner chose the world first, the menus over it,
over keeping the menus and the lobby first.

## What

Today, in party-kart:

- `src/main.ts`: `homeScreen` (your name, a driver, create or join a room by its code),
  `lobbyScreen` (the members, the mode, laps or minutes, items, catch-up, bots, start),
  `startRace`, `resultsScreen`, and behind the menus a few autopilot cars lapping the track
  (`startAttract`). `frame()` steps the race (`stepRace`) or the menus.
- `src/session.ts`: a room is the host's star over PeerJS (`HostRoom`, `ClientRoom`), its peer
  id `PREFIX` plus a five-character code, the invite link `?room=<code>`. Positions (`cars`)
  are relayed only while `lobby.racing`, 15 times a second.
- `src/hud.ts`: the race's screen, its minimap drawn from the track's samples.
- `src/ambience.ts` works out the city's sound every 10 m along the track (what's within 150 m:
  traffic, town, park, woods); `src/audio.ts` plays it from where your kart is on the track.
- After tasks 034 and 035: a car drives on the world's ground anywhere in the area, and every
  street in it is drawn.

Steps:

1. **The game opens in the world.** You start driving at once, alone, on the granite plinth at the
   start on the Rua do Fujacal (or where you last were, kept in `localStorage`), with the driver
   you last picked. No room is made until you invite someone.
2. **The menu is over the world,** opened with Esc or a button (touch too) while the world keeps
   going: your name and driver (the lobby's `driverGrid`), the graphics (`qualityPicker`),
   "Convidar amigos" (makes the room and shows the link and its code), "Entrar numa sala" (a
   code), "Corrida" (task 037), "Reposicionar" (back on the street, task 034's respawn) and the
   help. Everything in Portuguese, as `tu` (party-kart's `CLAUDE.md`).
3. **Friends in your world.** The invite link opens the game straight into your room: each
   browser drives its own car, and positions go through the host 15 times a second whether or not
   a race is on, drawn 110 ms behind as now, with name tags. Joining and leaving show in the feed.
   The host leaving sends everyone back to driving alone, not to a home screen. Change `PREFIX`
   (the message format changes).
4. **The screen while driving:** the speed, the street's name as you turn into it (the street
   plates' names), and a minimap of the area round you with the friends on it, instead of the
   race's track.
5. **The city's sound anywhere:** `ambience.ts` works out what's round any point (a grid over the
   area, every 10 m or so), not along the track, and `audio.ts` plays it from where you are.
6. **The kart bumps the others** as in a race (`Racer.contact`), and the horn works; no items
   outside a race.
7. **The scripts keep working:** `?autodrive` and `&at=` put the autopilot on the Volta dos Amigos
   in a race (task 037), `?scenery` and `?view=` show the city alone (`scripts/shots.mjs`), `?stats`
   measures it, and `node scripts/download.mjs` adds up what the page fetches before you can drive.

## Read first

- party-kart's `CLAUDE.md`, `README.md` (the game as a player sees it) and `docs/architecture.md`
  ("One frame", "The network", "Who decides what").
- `src/main.ts` (the screens, `frame`, `stepRace`, `startAttract`, `chase`), `src/session.ts`,
  `src/hud.ts`, `src/ambience.ts`, `src/audio.ts` (`listen`, the ambience bus), `src/input.ts`.

## Done when

- [x] The game opens driving in Braga; the menu opens over it and does all of step 2.
  > party-kart `81e9802`: `stepRoam` and the `Roamer`, the menu over the world (Notes). The shipped
  > build, opened by `scripts/download.mjs` on braga-map 1.9.1, is driving 4.2 s after opening.
- [x] Two browsers in one room drive together outside a race, each seeing the other where they
  are, checked with Playwright (two pages, one following the other's invite link).
  > Two browsers through PeerJS's server: B put 8–15 m from A, each seeing the other within
  > 0.01 m standing and 2.5 m behind at 23 m/s (Notes). On one computer, not two networks.
- [x] The city's sound changes as you drive anywhere in the area, not only on the route.
  > `test/ambience.test.ts`: 203 points off the route vary.
- [x] The README says how to play it; `docs/architecture.md` has the new frame and messages.
  > Both in `81e9802`; `CLAUDE.md`'s prefix is `partykart-pk32-`, as `src/session.ts`'s.
- [x] `npm test` and `npm run check` pass, and `scripts/shots.mjs` still shoots every viewpoint.
  > 43 tests and the check pass, on 1.7.0 and on braga-map 1.9.1 (2026-10-15); the rounds
  > `2026-10-15-task036` and `2026-10-15-mundo-aberto` shot all 29 viewpoints.

## Out of scope

- The race from free roam: task 037. Traffic and people in the streets: the roadmap's "Later".
- Building the city tile by tile: task 038.

## Notes

- **The owner's answers at the start (2026-10-15):** "Corrida" gives the host today's race
  settings and starts today's race, on the track's road; when it ends the results show over the
  world and everyone is back where they were, driving. That keeps the race playable and the scripts
  working until task 037 puts it on the streets. A friend who follows the invite link, or enters a
  code, is put by the host: on the street nearest them, a few metres back along it.
- **And during the work (2026-10-15):** what the race adds to the streets (the barriers along 160 m
  of both kerbs at the start, the gates, the boost pads, the chequered line) is up only during a
  race. Drawn but not solid, the start's barriers stood between the plinth and the street and were
  driven through; round the city the streets are as they are. The viewpoints by the start and the
  checkpoints shoot without them.
- **The work (2026-10-15), in party-kart:**
  - The game opens driving (`stepRoam` in `main.ts`, a `Roamer` in `src/game/roamer.ts` on
    `world.drive`), on the plinth's top (a block in the karts' ground, `stand` in `ground.ts`, which
    a kart drives off) or where you last were (`localStorage`'s `pk-where`). A loading screen in
    `index.html` shows while the city is fetched and built.
  - The menu over the world (Esc, or ☰ at the top): name, driver, Conduzir, Convidar amigos (a room,
    its code and link), Entrar (a code), 🏁 Corrida (today's race settings, in a room of your own if
    you aren't in one), ↺ Reposicionar, the graphics, the help. While it's open the kart pulls up
    and the camera turns round it. The results show over the world after a race, and everyone is
    back where they were before it.
  - The room: `PREFIX` is `partykart-pk32-`; positions relayed 15 times a second always; a `name`
    message; the bots' positions dropped when a race ends; the host leaving leaves everyone driving
    alone. The feed says who joined and left.
  - The screen round the city (`RoamHud` in `hud.ts`): the speed, the route's street plates' names
    within 20 m of where the route turns into each (braga-map's tiles have no other names yet: task
    042), a minimap round you, heading up, with the streets, the route in gold, the area's edge in
    red and the friends (at its rim when further off).
  - The city's sound anywhere (`ambience.ts`): a grid every 10 m, each point worked out the first
    time it's needed (0.25 ms); `test/ambience.test.ts` checks 203 points off the route vary. The
    tyres' rumble on cobbles round the city too (`surface` in `ground.ts`).
  - Bumps and slipstreams as in a race (`bump`, `slipstream` in `racer.ts`, shared); the horn; the
    eggs go off as you pass them on the route.
  - **Found and fixed:** the buildings the city leaves out round the plinth (about 4), three of the
    eggs (7) and the Tourigalo stayed walls in the karts' ground: invisible walls. `unwall` takes
    them out as the city leaves them out.
- **Checked (2026-10-15):** party-kart's `npm test` (43, with the new `test/roam.test.ts`: the
  plinth, a building taken away, a free-roam car driving, bumping, put back on the street, and 34
  cars driven 10 s flat out from all over the area, never lost) and `npm run check` pass. With
  Playwright, two browsers on this computer through PeerJS's server: B followed A's invite link and
  was put 8–15 m from A; each saw the other within 0.01 m of where it was standing, and 2.5 m behind
  at 23 m/s (110 ms and the 15 a second); the feed said who joined; A's new name reached B; a race
  from the menu took both and a bot, and when A ended it both were back exactly where they were,
  with no bot left out; A closing the room left B driving alone, the feed saying so. On a phone's
  screen (844×390, touch): the touch controls without the item button, the minimap top left, the
  plate's "Avenida da Liberdade" as the kart rolled off, the menu (with a ✕). `scripts/shots.mjs
  task036` shot all 29 viewpoints at High and Low; `scripts/download.mjs`, now on the page as a
  player opens it: 6.83 MB, 2.08 MB gzipped (task 035: 6.81 and 2.08). `?stats` works round the
  city, its worst second starting again with a race. `scripts/listen.mjs`'s liberdade take,
  through the menu now, recorded on its second run (traffic 0.52 and the river in it); the first
  timed out waiting for the recording, likely the fresh dev server's first load. The other five
  takes weren't run.
- **What it cost** (`shots/2026-10-15-task036/` against `2026-10-15-task035/`): 3 to 16 draw calls
  fewer at every viewpoint (High 55–210, was 58–226; Low 37–192, was 39–207), as the race's marks
  were one mesh along the whole route; triangles and textures the same. The city built in 2.5–2.7 s
  on High (task 035's round said 3.8–5.3 s; this desktop has varied by up to 0.9 s with other work,
  so the difference isn't this task's).
- **Not checked:** a real phone; two different networks (both browsers were on this computer);
  driving it by hand, the owner judging the feel (the drawn streets' 3.4 cm, below). Seen: off the
  throttle a kart rolls on for 20 s and more, as the race's handling does; round the city, where you
  stop to look, the owner may want it to slow sooner.

- Decision 019: the game opens in the world, alone; a race takes everyone in the room (task 037).
- Ship it with task 037, so the live game never loses its race. **Changed on 2026-10-15** (decision
  026): the owner wanted to play it away from home, and the race is still in the menu, so it went
  live before 037, with task 035's streets and braga-map 1.9.1 (party-kart `af048ce`).
- party-kart's `CLAUDE.md` still says the prefix is `partykart-pk30-`; `src/session.ts` has
  `partykart-pk31-`. Fix the doc with this change.
- **From task 035 (2026-10-15): the streets are drawn.** `buildCity` builds the world's ground
  (`worldGround`, src/world/ground.ts) for drawing the streets as the karts find them, and returns it
  as `drive`: drive on that one rather than building it again (0.25 s). The drawn carriageways are
  3.4 cm off the ground a kart stands on at the median and 19 cm at the 90th percentile
  (`test/streets.test.ts`): a kart sinks or floats that much here and there. Judge it driving; the
  fixes are a finer grain where it shows (`GRAIN` in `streets.ts`, triangles), or the karts standing
  on the drawn surfaces (one triangulation for both). Building the city takes 3.8–5.3 s on the
  desktop's High, twice what it did: a phone opening straight into the world waits 10–20 s, so the
  first screen needs something to show meanwhile.
- **Finished on 2026-10-15** at the owner's request, without their driving it first (they were away
  from home): committed as party-kart `81e9802`, braga-map 1.9.1 pinned in `af048ce`, and deployed.
  The owner plays it live first. Still not checked: the feel by hand (a kart rolls on 20 s and more
  off the throttle), a real phone, two networks.
- **The round `2026-10-15-mundo-aberto`** ("Mundo aberto", tasks 036, 040 and 043) is on the
  scorecard, shot on party-kart `af048ce` and braga-map 1.9.1: the same draw calls as
  `2026-10-15-task036` at every viewpoint, triangles within 1,500, built in 2.5–2.7 s on High.
- **Found live by the owner (2026-10-15), fixed the same day** (party-kart `720be44`): on a phone the kart
  accelerated by itself round the city, as in a race, so 2 s after opening it drove off the plinth's
  front (1.2 m down, 1.7 m ahead), across the Rua do Fujacal and into the building over it, and
  charged back into it whenever Brake was let go: "fell through the stage" and couldn't get onto the
  street. Round the city a touch screen now drives only while a thumb is on the steering half, and
  pulls up when it lifts; a race still goes by itself. Checked with Playwright as a phone, not on one.
