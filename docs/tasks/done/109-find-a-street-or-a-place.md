---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [107]
roadmap: Now · The open world
---

# 109 · Find a street or a place, and the GPS takes you there

## Why

A friend says "meet me at the Picoto" or "on the Rua do Fujacal": on the full map you'd have to find
it by eye. The owner chose this from the session's suggestions (2026-10-24): a search on the full
map, its result the GPS's waypoint.

## What

Today: the streets' names are the map's (`Line.name`, `src/world/names.ts`); the landmarks are
`world.sights` (named where the map names them), the bus stops `world.stops`, the arenas
`world.arenas` with their names (decision 057).

1. **A search box** on the full map (106): as you type, the streets, landmarks, bus stops and arenas
   whose names match, Portuguese accents or not ("joao" finds "João"), the nearest first.
2. **Picking one** centres the map on it and makes it the waypoint (107): a street at its nearest
   point to you, a landmark at its front.
3. Typing in it never drives your kart (the keys go to the box while it has the focus), and Esc
   leaves it.
4. Only what's inside the open world, or that a route reaches.

## Read first

- party-kart's `src/world/names.ts`, `src/hud.ts`, `src/main.ts` (`h()`: text only, never
  `innerHTML`), tasks 106 and 107.

## Done when

- [x] "picoto", "fujacal" and "joao xxi" each find their place, and picking one sets the route
  (a test of the search; Playwright in Notes). party-kart's `test/places.test.ts` (both tests), and
  the Playwright run in the game, 14 of 14: each of the three found and picked, a route set.
- [x] Typing in the box doesn't move the kart. Playwright: "wasd mn " and ↑ typed in it, the kart
  0.00 m from where it was, the map still open, the sound as it was.
- [x] `npm test` and `npm run check` pass. On party-kart's main with 114 (8bbe292) under it: 152 of
  152, `tsc` clean.

## Notes

- The owner's choice (2026-10-24), from the session's suggestions. To be done first, before 081.
- **Done (worker-2, 2026-10-24), party-kart branch `task-109`:**
  - `src/world/places.ts` (new, the simulation's half): `Places`, the open world's named streets (their
    lines' stretches inside the area), landmarks (`map().landmarks` inside it: the Monte e miradouro do
    Picoto, the Parque da Ponte, the Estádio 1.º de Maio, the Altice Forum, the Picoto Adventure Park),
    arenas and bus stops (each named by its street within 30 m: "Paragem, Rua do …"); `find`: every
    word asked a word's start in the name, in any order, accents or not (`fold`), the nearest to you
    first, a street at its nearest point, at most eight. The bus stops have no names of their own in
    the map, so by their street.
  - `hud.ts`'s `FullMap`: the search box in the title's row (round the city only, where the waypoint
    is), what it finds under it, each with its kind, name and how far; a pick (or Enter, the first)
    makes it the waypoint and centres the map on it (zoomed in to at least 1.5 px a metre). Its keydown
    goes no further, so typing never works the game's keys (nor M closing the map, nor N the sound);
    Esc leaves the box, a second Esc closes the map. "Nada com esse nome na zona" where nothing matches.
  - **Found along the way, fixed in `src/world/route.ts` (107's):** by car a route started and ended on
    whichever stretch was nearest, a footway too, and a goal a few metres nearer on a path beat the
    street, so a route could hook off the street at its end; now by car it starts and ends on streets
    (still off them on the way where it must), a path at its ends only where no street near gets
    there. The plinth to the Picoto's top is now 2.35 km, ending on the Rua do Miradouro at the top.
    And `onRoute` could stop at the first stretch within 30 m when a route comes back near itself (a
    roundabout): it now looks on 400 m past its nearest.
  - README, "Como se joga" and `docs/architecture.md` say so.
- **Evidence.** `test/places.test.ts`: "picoto" finds the Picoto's landmarks, "fujacal" the Rua do
  Fujacal first (where you are) and the arena Topo do Fujacal, "joao xxi" and "João XXI" the Avenida
  João XXI first, "xxi joao" too, eight at most, nearest first, only in the area; and from the plinth
  by car a route to each of "picoto", "fujacal", "joao xxi", "parque da ponte" and "santa justa", ending
  within 80 m of it. `npm run check` passes, `npm test` 149 of 149 (107's router tests among them).
  Playwright in the game (party-kart's `shots/2026-10-24-task109/`, `find109.mjs`, `results.json`, 14
  of 14): typing "wasd mn " and ↑ in the box: the kart 0.00 m, the map open, the sound as it was;
  "picoto" lists the Picoto Adventure Park (930 m) and the Monte e miradouro do Picoto (1,1 km), Enter
  makes the first the waypoint with a route; "fujacal" the Rua do Fujacal, where you are, "Chegaste";
  "alameda fujacal" and "joao xxi" each picked set a route; nothing found says so; Esc leaves the box
  and a second closes the map; in a race no box. 107's Playwright check again on this branch, 12 of 12.
  Shots seen: `1-picoto` (the list), `2-picoto-route` (the route up the park's service road, which ends
  in a turning loop), `3-joao-xxi`.
- **Decided by the session, for the owner to confirm:** the nearest first, as the task says, so
  "picoto" from Fujacal gives the Picoto Adventure Park before the Monte e miradouro do Picoto (930 m
  and 1.1 km): both are listed, Enter takes the first.
- **Not verified:** on a real phone's own keyboard (Playwright's keys only).
- **Landed (worker-2, 2026-10-24):** party-kart `6967a66`, rebased onto 114's 8bbe292 (152 of 152,
  `tsc` clean). braga-map unchanged but this file and the roadmap: no version. No new decision: the
  nearest first is the task's own, and a car's route ending on a street keeps decision 066.
