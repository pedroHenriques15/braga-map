---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-24
depends-on: []
roadmap: Now · The open world
---

# 106 · The minimap opens into a full map with M

## Why

The minimap shows 220 m round you, and nothing in the game shows the whole open world: where you
are in it, where the others are, where the race and the arenas are. The owner asked for M to open
the minimap into a full map (2026-10-24), the place the GPS (107), going somewhere (108), finding a
place (109) and meeting the others (110) are done from.

## What

Today (party-kart `2dfa05d`): `RoamHud` (`src/hud.ts`) draws a minimap round you, `RANGE` 220 m on
`SIZE` 200 px, from `MapLines` (braga-map's lines with their widths, the open world's edge, the home
track's route; built in `src/main.ts`, about line 1161), with the others as dots; in a deathmatch
round only you and your team-mates (`main.ts`, about line 1440). The race's `Hud` has its own, the
track's. M is "Som ligado ou desligado" (`MUTE` in `src/binds.ts`), and every key can be changed in
⚙️ Definições (`src/settingsScreen.ts`, kept by `src/prefs.ts`).

1. **M opens the full map**, and M or Esc closes it; mute moves to N (`MUTE`'s default), its label
   and the keys' line at the bottom (`KEYS` in `hud.ts`) with it. A player who rebound mute keeps
   their key.
2. **The full map:** the whole open world and the city round it, drawn from the same `MapLines`
   (streets at their widths, the edge), north up, with the streets' names as you zoom in (the map's
   names, `src/world/names.ts`), the race's route, the arenas (`world.arenas`), you and the others
   as on the minimap. Zoom with the wheel or a pinch, pan with a drag; it opens centred on you.
3. **Where it opens:** round the city, driving, flying and on foot; in a race, the track whole; in a
   deathmatch round, the arena with only you and your team-mates, never a foe (the minimap's rule).
   The game goes on under it (the network doesn't pause): your kart stops while it's open, as with
   the menu.
4. **On a touch screen**, a tap on the minimap opens it, and a ✕ closes it.
5. The game's text in Portuguese, as everything a player sees; README's controls and How to play
   say so.

## Read first

- party-kart's `CLAUDE.md`, `src/hud.ts` (`RoamHud`, `MapLines`, `RANGE`), `src/main.ts` (the minimap's
  lines and dots), `src/binds.ts`, `src/settingsScreen.ts`, `src/input.ts` (`.keys-only` and
  `.touch-only`).

## Done when

- [ ] M opens and closes the full map round the city, in a race and in a round, and N mutes (a test of
  the default keys; Playwright's shot of the map in Notes).
- [ ] In a deathmatch round the map shows no foe (a test).
- [ ] On a touch screen a tap on the minimap opens it.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- The waypoint and the GPS's route: 107. Going somewhere from the map: 108.

## Notes

- The owner's answer (2026-10-24), and mute to N (the session's suggestion, not objected to). To be
  done first, before 081.
