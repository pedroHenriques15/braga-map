---
status: done
priority: medium
kind: code
repo: both
created: 2026-10-19
depends-on: [071]
roadmap: Games · More tracks and the shooter
---

# 072 · A second track on the open world's streets, picked by the owner from two or three planned

## Why

The Volta dos Amigos is the only race in Braga. The owner wants more tracks, inside the open world's
area as it is (2026-10-19), where every street is already drawn, measured and driven on, so a new
track needs no new city. Which loop is the owner's to choose: they asked for two or three planned and
shown on the map, to pick from.

## What

Today (braga-map 1.29.0):

- `tools/tracks.mjs` lists one track, `amigos`, through the friends' houses (`waypoints: 'private'`,
  kept in `.cache/places.json`). A track can also take public waypoints, `[{ id, x, z }]`, an `order`,
  `sections` to keep to, and the street its `start` goes on (the file's header). `node tools/track.mjs
  <id>` plans one: the cheapest loop through its waypoints by the rules of the road (decision 010),
  bigger roads cheaper, no street used twice; it writes `tracks/<id>.js` and adds it to
  `map/tracks.json`.
- A jump comes into a loop only where a waypoint's street leads into a dead end, at a price of 1000 m
  (`JUMP.price`, `tools/track.mjs:308`), so a loop on through-streets has none. The Volta's jump is the
  one departure from the real streets the owner approved (decision 027).
- The open world's area (task 032, decision 020) is the Volta's loop and about 150 m round it:
  3.49 km², x −1132…1970, z −72…1967. Its main streets the Volta doesn't take: the Avenida Frei
  Bartolomeu dos Mártires (1.9 km in the area), the Avenida Francisco Salgado Zenha, the Avenida João
  Paulo II, the Avenida Dom João II, the Rua do Couteiro, the Avenida Conde Dom Henrique; it takes most
  of the rest (the Imaculada Conceição, the Liberdade, the João XXI, the Robert Smith, the Via da
  Falperra, the Cidade do Porto). So any loop of 7 km or more will share some streets with it.
- party-kart's tests ask a track for 7–10.5 km and 5 checkpoints (task 071 runs them over every track).
- The map page highlights only the Volta (`map/index.html:1737`, `COURSE = TRACKS.amigos`), though it
  draws every track in `map/tracks.json`.

Steps:

1. Plan two or three loops inside the area, each 7–10.5 km, through public waypoints in
   `tools/tracks.mjs` (ids like `cand-east`): different from each other and from the Volta, sharing
   as little of its streets as a legal loop allows. Ideas to start from, not a list to keep to: the
   east, Lamaçães' avenues and the climb round the Picoto; the south-west, the river, the Parque da
   Ponte, São João da Ponte and the stadium. Each one:
   - legal as the Volta is (one-way streets the right way, no banned turns), with no jump;
   - inside the area, at least 100 m from its edge where it can be, as `test/open.test.js` asks of the
     Volta, so the race's walls and barriers stand where the city is built;
   - its waypoints at least 150 m from every friend's house (read `.cache/places.json`, never copy
     it), as decision 009 keeps the viewpoints;
   - its start on a straight a grid fits on.
2. Let the map page show any one track on its own (a choice where `COURSE` is set), and run
   `npm run page` and `npm run map`.
3. Show the owner the candidates: for each, the map page, its length, its streets in order, how much
   of it is the Volta's streets, and its climb. Ask which to keep and what it's called
   (AskUserQuestion); record the answers in Notes. If no candidate is far enough from the Volta to be
   worth having, stop and report what would make one: a shorter loop (under 7 km, more laps), a loop
   sharing more of the Volta, or the area grown.
4. Keep the chosen one under its id and name; take the others out of `tools/tracks.mjs`,
   `tracks/` and `map/tracks.json`. `npm run tracks`, `npm run page`, `npm test`; add it to
   braga-map's `README.md` (its tracks) and tag a minor version.
5. In party-kart: pin the tag, add the track to the list (task 071), change the peer prefix, and run
   `npm test` and `npm run check`: the autopilot laps it twice with no respawn, the race is closed by
   its walls and barriers, eight bots race it with items. Race it in the browser from the menu
   (`?autodrive` for a lap), and look at its start, its checkpoints and its barriers.
6. party-kart's `README.md` says what it is, beside the Volta.

## Read first

- `tools/tracks.mjs` and the header of `tools/track.mjs`: how a track is planned.
- braga-map's `README.md`, "How a track is planned" and "A new track".
- Decisions 010 (the rules of the road), 019 (the open world), 020 (its edge) and 027 (the jump).
- `test/map.test.js`, `test/rules.test.js`, `test/open.test.js`: what a track must be.
- party-kart's `docs/making-changes.md`, "The track(s)", as task 071 leaves it.

## Done when

- [x] Two or three candidates were shown to the owner, and the one they picked is `tracks/<id>.js`,
      named as they chose (Notes). (Two; `tracks/lamacaes.js`, the Volta de Lamaçães.)
- [x] braga-map's tests pass over it (a closed legal loop on the map's streets, inside the map) and
      it is inside the open world's area. (`npm test`, 142; party-kart's test that every track is
      inside the area: 0 m outside, 77 m from the edge at the least.)
- [x] party-kart races it from the menu, a guest with the host, and its tests pass: two autopilot
      laps with no respawn, closed by its walls and barriers, eight bots with items. (Two browsers,
      host and guest; laps 300.6, 298.4 s, no respawn; 0 cells off its road; 151 rows of barriers of
      170 driven at, none gone through; eight bots finishing within 4 s, 50 hits, no respawn.)
- [x] `npm test` in braga-map; `npm test` and `npm run check` in party-kart. (142; 72 and clean.)

## Out of scope

- A jump of its own, or any other departure from the real streets: the owner's to ask for
  (decision 004).
- Tracks outside the open world's area, and shorter sprints (not chosen, 2026-10-19).
- Eggs on it: the friends' eggs are on their houses, which the Volta passes (decision 014).

## Notes

Drafted 2026-10-19: the owner chose tracks inside today's area, and two or three planned by the session
for them to pick from, over naming the area themselves. The streets and lengths above were measured
from `map/braga.json` on 2026-10-19 (named primary, secondary and tertiary streets, over 250 m of each
inside the area).

Viewpoints: none, as a round shoots the city without a race; no round, no budget.

Done 2026-10-20 (braga-map 1.30.0):

- **The planner** (`tools/track.mjs`) gained `open` (the loop keeps to the area's streets, and a metre
  within 100 m of its edge costs 1.5 times as much), `avoid: ['amigos']` (the Volta's streets cost
  2.5 times as much), `keepOff: [[x, z, r]]` (no junction within r of a place), `DEBUG_LOOP=1` (which
  waypoint or leg fails), and keeps a start 250 m from the friends' houses as well as the waypoints.
  Without `open` the graph was the whole map's, and a loop left the area through the old town.
- **Three planned, two shown.** East: 8.9 km, 27% on the Volta's streets, 77 m from the edge at the
  least, 160–202 m above the sea, climbing 102 m a lap. West: 9.0 km, 39%, 18 m from the edge, climbing
  133 m, once kept off the Praça do Condestável's underpass, where the Avenida Conde Dom Henrique runs
  over its mouth and a kart stopped against it. A middle loop (the two joined) was 10.9–15.9 km and
  mostly theirs: dropped. Many waypoints first sat on dead ends; the area's interior streets are full
  of them.
- **The owner's answers (2026-10-19, AskUserQuestion):** the east loop, "Volta de Lamaçães", id
  `lamacaes`.
- **Two fixes after the pick, from party-kart's tests:**
  - The lump of task 067 at (874, 1098), on its Rua Padre Francisco de Almeida: karts flew 2.1 s on a
    loop with no jump, and the race wasn't closed there. Task 067 done first (decision 054): the
    world's street and the track's heights now go straight under the crowns.
  - The Rua Professor Machado Vilela's bend into the Rua Bernardo Sequeira, 3 m wide, where eight bots
    still together a kilometre from the start pushed each other through its inside and onto the
    pavement behind the race's wall: 8 respawns, a bot that didn't finish. The loop keeps 12 m off it
    (`keepOff`), and its waypoint moved to the Rua de Baixo: it now comes back by the Avenida 31 de
    Janeiro and the Avenida João XXI, starts on the João XXI at (670, 183), 9.2 km, 35% on the Volta's
    streets. The owner was told after; the rest of the loop is the one shown.
- Not done: a viewpoint of its own for the scorecard; its streets were shot already where the Volta
  shares them.
