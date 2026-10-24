---
status: todo
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

- [ ] "picoto", "fujacal" and "joao xxi" each find their place, and picking one sets the route
  (a test of the search; Playwright in Notes).
- [ ] Typing in the box doesn't move the kart.
- [ ] `npm test` and `npm run check` pass.

## Notes

- The owner's choice (2026-10-24), from the session's suggestions. To be done first, before 081.
