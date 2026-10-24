---
status: doing
priority: high
kind: code
repo: both
created: 2026-10-24
depends-on: [106]
roadmap: Now · The open world
---

# 107 · A waypoint on the map, and the GPS's route to it along the streets

## Why

Finding your way round Braga in the game is by knowing it. The owner asked for waypoints with a GPS
(2026-10-24): a place marked on the full map, and the way there along the real streets, as a car's
GPS gives it.

## What

Today: the tiles' streets are `world.lines` (braga-map's `index.d.ts`, `Line`: kind, level, width,
name, points), with no one-way and no junctions said; the race's planner routes on OpenStreetMap's
ways with the rules of the road (`tools/track.mjs`'s `route`: one-way streets by `isOneway` in
`tools/osm.mjs`, the turn restrictions from `.cache/osm/restrictions.json`, decision 010), but only
when the tracks are planned. party-kart has no routing on the streets (the bots on foot route on a
round's walkable ground, `src/world/paths.ts`).

1. **braga-map carries what a route needs** (decision 023's way: the data does it once): for each
   line its one-way (`oneway`: 1 along its points, -1 against, absent both ways), and where the
   lines meet, the junctions a route can turn at, with the turns the map bans; in the tiles, typed in
   `index.d.ts`, tested (`test/`). A version up and tagged; party-kart pinned to it.
2. **party-kart's router** (pure, in `src/world/`, so the tests run it): from where you are to the
   waypoint, along the streets a car may drive, the right way down one-way streets and no banned turn,
   the shortest by time (each street's length over a speed by its kind). On foot, any way along the
   streets and the paths.
3. **Setting it:** a click (a tap) on the full map (106) puts the waypoint; again on it takes it
   away. It's yours alone (110 shares one).
4. **Showing it:** the route on the minimap and the full map; on the street ahead, arrows laid on the
   carriageway for the next 100 m or so; on the HUD, the distance left and the next turn with its
   street's name ("Vira à direita na Rua …, 200 m"). Left the route: it's worked out again from where
   you are. Reached: it says so and clears.
5. Not in a race or a round: their own routes rule.

## Read first

- braga-map: `index.d.ts` (`Line`), `tools/world.mjs` (the lines), `tools/osm.mjs` (`isOneway`,
  `driven`), `tools/track.mjs` (`route`, the turn restrictions), decisions 010 and 023.
- party-kart: `src/hud.ts`, `src/main.ts`, `src/world/names.ts`, `src/world/paths.ts`, task 106.

## Done when

- [ ] A route from the plinth to the Picoto's top drives the one-way streets the right way and takes
  no banned turn (a test in party-kart), and one on foot takes the steps.
- [ ] The route shows on both maps and as arrows on the street, and the HUD names the next turn
  (Playwright's shots in Notes).
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Finding a place by its name: 109. A friend as the waypoint: 110.

## Notes

- The owner's answer (2026-10-24). By the rules of the road, as a real GPS: the session's plan,
  stated to the owner before Phase 2 and not objected to. To be done first, before 081.
- **Done (worker-2, 2026-10-24).** braga-map, branch `task-107`: the road graph in the tiles, made
  once by a new `tools/roads.mjs` (`world.roads`, `world.turns`, typed in `index.d.ts`, read by
  `index.js`, packed by `tools/world.mjs` after the lines): every street and path in the open world's
  area (the streets' own footways too, a pavement the map draws, a crossing: they join the paths to
  the streets) split at its junctions (a node two ways share, each at one point), cut where it crosses
  the area's edge, thinned to 0.8 m; each stretch's kind, who may use it (cars by the map's access, a
  pedestrian street only if it lets motor vehicles in; on foot every path the map doesn't close and
  every street but a motorway), one-way for cars (turned round where it runs against the way it's
  drawn), `ring` (a roundabout's), level, width, name, and a deck's or a tunnel's heights. The turns
  the map bans (`restrictions.json`, via a node; `only_` ones made into bans of every other turn; a
  U-turn ban from a way onto itself kept for turning back, as `tools/track.mjs`'s `banned`) as plain
  bans, by the points either side of the junction. 6,375 stretches (2,409 for cars, 1,035 one-way;
  6,313 on foot), 4,208 junctions, 39 banned turns, 1 ban over a way left out. `test/roads.test.js`:
  inside the area, joined, a deck's heights, the Rua do Fujacal named, the roundabouts one way round;
  87% of the car stretches' length in one strongly connected part (the rest, one-way stubs out through
  the edge and the Picoto's top); the Volta dos Amigos (planned by the rules, decision 010) never on a
  stretch that doesn't let it go its way; every banned turn at a junction, from a car stretch arriving
  to one leaving.
- **Decided by the session, for the owner to confirm:** the one-way is on the road graph, not on
  `Line` as step 1 words it. The lines are for drawing: thinned to 0.8 m, cut at each tile's edge, with
  no junctions, so a game routing on them would have to make the graph again (decision 023's way: the
  data does it once). The coordinator agreed (2026-10-24).
- **A premise that proved false:** "a route from the plinth to the Picoto's top drives the one-way
  streets". Inside the open world's area the Picoto's top has 749 m of streets of its own (the Rua do
  Miradouro, the Anel Panorâmico, which the map doesn't join to each other: they share no node in
  `base.json`), and they reach the rest only through the area's edge (the Rua do Miradouro leaves it
  at 856, 1602); inside the area only paths and flights of steps go up. **Decided by the session, for
  the owner to confirm:** by car the GPS keeps to the streets by the rules, and leaves them for a path
  or the steps (as a kart drives them) only where no street reaches the waypoint: each time it leaves
  them costs 10 minutes in the search, so it never takes a pavement to save going round a one-way
  street. The HUD says "Sai da estrada: segue pelo caminho" where it does. So the plinth to the
  Picoto's top by car is 2.7 km by the streets to the foot of the hill, then the paths up.
- **party-kart, branch `task-107`:** `src/world/route.ts` (pure): the `Router` over the graph, edges
  each stretch's two ways, Dijkstra from every stretch within 80 m of you to any within 80 m of the
  waypoint (each charged the walk to it: by car so much it ends on the nearest it can reach, as a
  footway or two on the map are joined to nothing; on foot four times a walk's pace); by car each
  kind of street's speed (the avenues first), a turn's cost by how sharp it is, setting off away from
  the way the kart faces 15 s, no banned turn, no turning back but at a dead end; on foot a walker's
  pace, the steps at half of it. Its turns (`steps`): where there was another way on and it bends
  (slight, a turn, sharp), a roundabout as its exit counted, the street turned onto or the next named
  within 60 m; `onRoute`, where a point is along it. `src/render/gps.ts`: the arrows on the street for
  the next 100 m, every 8 m, on its surface (`floor` from your height on, so a route under a deck stays
  under it), one draw call. `hud.ts`: a click (a tap) on the full map that doesn't drag puts the
  waypoint, on it takes it away (106's double-click zoom taken out, as a click now means something);
  the route in blue and the waypoint's pin on both maps; the GPS panel (the next turn's arrow, how
  far, what to do, "Vira à direita na Rua …", "Na rotunda, sai na 2.ª saída, para a …", "Faltam 1,2
  km"). `main.ts`: `stepGps`, the route from your kart (flying too) or from you on foot, worked out
  again after 1.5 s 25 m off it by car (12 on foot), "Chegaste ao destino" within 15 m (6 on foot);
  not in a race or a round. README, "Como se joga", CLAUDE.md (`__kart.gps`, `__mark`) and
  `docs/architecture.md` say so.
- **Evidence.** braga-map: `test/roads.test.js` 4 of 4. party-kart: `test/route.test.ts` 3 of 3: by
  car from the plinth to the Picoto's cross, 2.71 km, every one-way stretch the right way, no banned
  turn, no turning back, off the streets once or twice and for under 40% of it, 10 turns told in order
  ("slight-left (Rua Monsenhor Airosa), left (Rua Monsenhor Airosa), slight-left (Rua Conselheiro
  Lobato), slight-left (Largo São João da Ponte), roundabout exit 1 (Avenida Doutor Viriato Amaral
  Nunes), roundabout exit 3 (Rua João Evangelista de Araújo Vieira), path, right (Rua do Miradouro),
  slight-left, path"); on foot there, 1.59 km, and two flights of steps between streets a walker
  takes and a car goes round at twice the distance; every one of the 39 banned turns, from a metre
  before it to a metre after: never taken, gone round. `npm run check` passes; `npm test` 143 of 143
  (once 142: "the world as a ground: built in well under a second" took 2,140 ms, best of three, with
  every test file sharing the machine; 906 and 933 ms alone, and 143 of 143 on the next run; the ground
  doesn't read the road graph). A Playwright run in the game (party-kart's
  `shots/2026-10-24-task107/`, `gps107.mjs` and `results.json`, 12 of 12): the waypoint at the Picoto,
  a car route of 2,685 m, the panel ("30 m · Vira à esquerda na Rua do Fujacal · Faltam 2,7 km"), 12
  arrows on the street each pointing on to the next (11 of 11), a click on the full map moving the
  waypoint, one on it taking it away and another putting it back, on foot a route of its own with its
  panel, worked out again from where you were put off it (1,670 m, then 1,336 m), and there, "Chegaste
  ao destino" and cleared. Shots seen: `1-drive` (the panel, the arrows, the route on the minimap),
  `2-map-route`, `3-map-whole`, `4-map-moved`, `5-walk` (the panel on the right, the route on the
  minimap).
- **Its cost.** The two parts add 154 KB to the open world's 25 tiles (7,067 to 7,221 KB, +2.2%), 72
  KB gzipped (2,407 to 2,479, +3.0%), and nothing to the other tiles: every stretch is in the area. The
  game's download on this branch (party-kart's `scripts/download.mjs`): 16.91 MB, 9.56 MB gzipped, the
  map's 96 tiles 8.55 MB of it, 3.20 MB gzipped. The
  arrows: one draw call, at most 12 chevrons of 4 triangles. The router builds its graph once (12,750
  edges) and a route across the area takes a few milliseconds.
- **Not verified:** a kart driven along a whole route by hand (the autopilot drives races only), on a
  real phone, the Volta de Lamaçães' streets beyond the area's one-way checks, and that the turns
  read naturally everywhere ("Vira à esquerda na Rua do Fujacal" where the Rua do Fujacal itself turns).
