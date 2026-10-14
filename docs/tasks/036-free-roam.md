---
status: todo
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

- [ ] The game opens driving in Braga; the menu opens over it and does all of step 2.
- [ ] Two browsers in one room drive together outside a race, each seeing the other where they
  are, checked with Playwright (two pages, one following the other's invite link).
- [ ] The city's sound changes as you drive anywhere in the area, not only on the route.
- [ ] The README says how to play it; `docs/architecture.md` has the new frame and messages.
- [ ] `npm test` and `npm run check` pass, and `scripts/shots.mjs` still shoots every viewpoint.

## Out of scope

- The race from free roam: task 037. Traffic and people in the streets: the roadmap's "Later".
- Building the city tile by tile: task 038.

## Notes

- Decision 019: the game opens in the world, alone; a race takes everyone in the room (task 037).
- Ship it with task 037, so the live game never loses its race.
- party-kart's `CLAUDE.md` still says the prefix is `partykart-pk30-`; `src/session.ts` has
  `partykart-pk31-`. Fix the doc with this change.
