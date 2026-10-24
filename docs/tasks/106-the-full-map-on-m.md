---
status: doing
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
- **Done (worker-2, 2026-10-24), party-kart `83146ed` on branch `task-106`:**
  - `binds.ts`: `map` on M in every way of playing, `mute` on N. `keysOf` now gives a default key to
    no control when the player has bound it to another one of that mode, so a player who had bound
    the sound to M keeps it there (and the map has no key in that mode until they give it one), and
    one who had given N to another control keeps it (`test/binds.test.ts`).
  - `src/world/mapview.ts` (new, the simulation's half): the full map's view (a centre and a scale),
    framing a place, zooming about a point, panning, kept over the map (centred while it's smaller
    than the screen); a point along a line, for the names; and `onTheMap`, who the maps show you: in
    a round only your team-mates who are up (`test/mapview.test.ts`).
  - `hud.ts`'s `FullMap`: the whole open world and the city round it (every line of the tiles the
    city loads, about 4.2 by 3.3 km), north up, the streets at their widths (the paths and service
    roads fainter), their names along them as you zoom in (the big streets' from 0.5 px a metre, all
    from 1.4, every 450 px along a street where it runs straight enough, clear of each other), the
    race's route in gold, the three arenas in orange with their names, the area's edge in red, a
    scale and north; you an arrow in a halo, the others as dots, at the edge when off it; ⌖ Onde
    estou and ✕. Wheel, pinch and drag; a double click zooms in.
  - `main.ts`: M opens it (round you round the city, flying and on foot; a race's whole track; a
    round's arena with only you and your team-mates) and M or Esc closes it; it closes by itself when
    a race or a round starts or ends. While it's up the keys, mouse and thumbs are the map's, your
    kart is held with `stopInput` (in a race too, as the task says), you stand on foot, and the
    network and the rest go on. On a touch screen a tap on the minimap opens it (a capture-phase
    `pointerdown` over the minimap's box, before the steering half takes the finger).
  - The keys' lines at the bottom, the race's, "Como se joga", the sound setting's label, README
    (Playing, the keys, the touch table), CLAUDE.md (`__kart.map`, `__kart.muted`) and
    `docs/architecture.md` say so.
- **Evidence.** `npm run check` passes; `npm test` 140 of 140. A Playwright run in the real game
  (party-kart's `shots/2026-10-24-task106/`, the shots and `map106.mjs`, `results.json`: 28 of 28):
  round the city M opens and closes it, N mutes and unmutes, Esc closes it with no menu, the kart's
  speed 0.00 m/s after 1.5 s with ↑ held; flying and on foot the same; in a race with three bots M
  opens it on the whole track and the kart stays on its sample; in a round of two teams with five
  bots it opens on Topo do Fujacal, and the one dot drawn is the one team-mate who was up, where the
  game had it (the mate who was down and the three foes not drawn); on a phone-sized touch screen a
  tap on the minimap opens it, a pinch zooms, ✕ closes it. Shots seen: `1-roam` (opening, 1 km
  across), `2-roam-names` (zoomed in, the names along the Rua do Fujacal, the Alameda and the Rua
  Rosália Castro), `3-roam-whole`, `4-fly`, `5-walk`, `6-race`, `7-round`, `8-touch`,
  `9-touch-pinched`, `10-touch-button`.
- **Its cost.** No geometry or texture: a 2D canvas over the game, nothing for the budget. Painting
  it takes 7 to 15 ms (the streets most of it, the names a few ms, the same at a pixel ratio of 1 or
  2), so it's painted again only when its view has changed, and while it's dragged or zoomed it moves
  its last painting and paints afresh 150 ms after it's still: dragging it every frame held 16.7 ms a
  frame at the opening zoom, zoomed in and zoomed out, with the CPU slowed 4× too (it was 30 ms
  before). The city isn't drawn under it (it's opaque), and the graphics don't step down while it's up.
- **Found along the way, fixed in the same lines:** on foot round the city (guns out, `fight.free`)
  the minimap showed nobody, not even your waiting kart: it took a round's rule ("team-mates only")
  for any fight. Now only a round (`inRound()`) hides foes.
- **Decided by the session, for the owner to confirm:**
  - The full map is opaque and the game isn't drawn under it (nothing would show through, and it
    saves a phone the frame).
  - On a touch screen with the minimap hidden (⚙️ Definições › Ecrã), a 🗺️ button in the bar opens
    the full map, as nothing else could; with the minimap shown there's no button.
  - Opening it stops your kart in a race too (the task's "as with the menu"; a race has no menu): a
    player who opens it mid-race loses time.
- **Not verified:** on a real phone (only Playwright's touch emulation, CDP touches); two players in
  a room seeing each other on it (the dots come from the same snapshots as the minimap's); a match of
  the competitive mode (only a deathmatch of two teams); the Volta de Lamaçães' race (only the Volta
  dos Amigos'). Each shot was taken on Low.
