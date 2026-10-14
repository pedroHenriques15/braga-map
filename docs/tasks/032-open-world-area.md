---
status: todo
priority: high
kind: code
repo: braga-map
created: 2026-10-14
depends-on: []
roadmap: Now · The open world
---

# 032 · The open world's area: its edge, closed with barriers, and the ground every 2 m over it

## Why

Party Kart becomes an open world (decision 019): the karts go wherever they like, inside a small
area for now, the Volta dos Amigos' and a little round it. The map has no such area today, only
the six sections, the shooter's box and the tracks' boxes, and its ground is every 2 m only
within 60 m of a track. Every game that lets a player wander needs to know where the wandering
stops, and what stops it.

## What

Today:

- `tools/sections.mjs` has the map's extent (`EXT`), the 500 m tiles, the six sections and the
  shooter's box (`SHOOTER`). A section is a set of whole tiles.
- `tools/world.mjs` puts the ground every 2 m on the tiles within 60 m of a track and over the
  shooter's box (`FINE`), and every 10 m elsewhere (decision 008): about 35 KB gzipped for a 2 m
  tile, 3 KB for a 10 m one.
- The Volta dos Amigos' points (`tracks/amigos.js`) span x −623…1695 and z 56…1749; its box (500 m
  round it, what party-kart loads today) is x −1130…2200, z −450…2150, 48 tiles.

Steps:

1. **The edge.** A polygon round the loop, about 150 m out from it (roughly x −780…1850,
   z −100…1900, 2.6 × 2.0 km, about 30 tiles), its sides following what a player would take for an
   edge: a busy road's far kerb, a row of buildings' backs, a wall, the railway, a river. Where it
   has to cross a street, it crosses it square. Draw it on the map page (`map/index.html`) for the
   owner to look at before going on.
2. **Where streets leave it** (`gates`): every street that crosses the edge, at the point it does,
   with its heading, its width kerb to kerb and its level, so a game stands a row of road-works
   barriers across it ("Estrada cortada", the owner's answer). A footpath counts; a railway
   doesn't (the edge runs along it or the barriers are a fence).
3. **In the library.** `tools/sections.mjs` gets the area (`OPEN`, the polygon), and `index.js`'s
   `map()` gives it with its gates (`open: { pts, gates }`, typed in `index.d.ts`) and an
   `inOpen(x, z)`. `loadWorld({ open: true })` loads the tiles under it and those round it for what's
   seen beyond (the city stays drawn past the edge).
4. **The ground every 2 m** on every tile the area touches (`FINE` in `world.mjs`), since a kart
   can now be anywhere in it. Print what the download grows by.
5. **Tests** (`test/open.test.js`): the polygon is closed and simple, holds every point of the
   Volta dos Amigos at least 100 m inside it, every street crossing it has a gate and every gate a
   street, and every tile under it has its ground every 2 m.

## Read first

- `tools/sections.mjs`, `tools/world.mjs` (`FINE`, how lines are written to the tiles), `index.js`
  (`map`, `tilesFor`, `loadWorld`), `index.d.ts`.
- `map/index.html` (how the zones and the shooter's box are drawn), `tools/build.mjs`.
- `docs/DECISIONS.md` 019.

## Done when

- [ ] The owner has looked at the edge on the map page.
- [ ] `map().open` gives the area and its gates, and `loadWorld({ open: true })` loads it; typed in
  `index.d.ts`, with the README's "Using it from a game" saying so.
- [ ] Every tile the area touches has its ground every 2 m; the download's growth is in Notes.
- [ ] `npm test` passes, with `test/open.test.js`.

## Out of scope

- Drawing the barriers and stopping the karts at them: tasks 035 and 034.
- The streets as surfaces: task 033.
- The shooter's own area: task 015.

## Notes

- Decision 019 settled the area (the loop's and a little round it, over a smaller one with a new
  race) and the edge (barriers across the streets, the city beyond drawn but not drivable).
