---
status: doing
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
   `world.mjs` makes the streets' surfaces (task 033, done) over `OPEN` taken as a box
   (`tilesOver(OPEN)` and `box: OPEN`, near line 472), and `test/streets.test.js` reads it as one
   (`inOpen`): make them over the polygon's bounding box, with the margin `streetSurfaces` takes, and
   test inside the polygon.
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
- [ ] Every street inside the edge has its surfaces in the tiles (`test/streets.test.js` over the
  polygon).
- [ ] `npm test` passes, with `test/open.test.js`.

## Out of scope

- Drawing the barriers and stopping the karts at them: tasks 035 and 034.
- The streets as surfaces: task 033 (done) makes them; this task only carries them to the edge.
- The shooter's own area: task 015.

## Notes

- Decision 019 settled the area (the loop's and a little round it, over a smaller one with a new
  race) and the edge (barriers across the streets, the city beyond drawn but not drivable).
- 2026-10-14, the work (`/task start 032`):
  - **The edge is worked out, not drawn by hand**, by `tools/open.mjs` (`npm run open`) into
    `tools/open.json`, which `sections.mjs` reads as `OPEN`. Every street that comes within 120 m
    of the loop (or of what that band closes round) is in, from junction to junction; a street
    leaving is cut a few metres past its junction, past where its kerbs turn the corner (12 m
    further off a roundabout, where its exit's two ways run side by side). The edge runs half way
    between the streets in and those out, round any building it would cut (179 of them), and is
    then made to cross each street square, straight across its width. A roundabout is never cut.
    The loop is always at least 104 m inside.
  - **The owner looked at it on the map page** (the «Mundo aberto» layer and section) and said it
    looks right; asked whether the Picoto's top (its viewpoint and cross, then about 150 m outside)
    should be in, they said take it in. `TAKE_IN` in `open.mjs` adds it as if the loop passed there.
  - **What came out:** 3.12 km², the edge 14.2 km round (1,754 points), x −852…1973, z −72…1967
    (2.8 × 2.0 km, a little more than the 2.6 × 2.0 km first guessed). It touches 23 tiles
    (`open.tiles`); 26 more lie within 500 m of it (`open.seen`), so `loadWorld({ open: true })`
    loads 49, 5.8 MB, 1.8 MB gzipped (the track's box: 48, 1.7 MB). 121 gates: 117 on the ground,
    1 on a bridge (the fast road, at the north end), 3 under something; 4 on the fast roads,
    5 primary, 13 secondary, 6 tertiary, 61 residential, 32 service roads. Every crossing
    is within 15° of square, 111 of the 121 within 5°; the worst are where two streets fork at
    the edge side by side, crossed by one straight piece square to neither.
  - **The download:** the ground every 2 m on 23 tiles, 5 more than before (x-1z0, x-2z1, x1z3,
    x2z-1, x2z1): +0.16 MB gzipped (each of those from 20–41 KB to 52–70 KB). The street surfaces'
    box grew with the edge (`OPEN_BOX`, the box round it): +0.03 MB. The base, with the edge and
    the gates: +13 KB. All the tiles: 2.45 → 2.63 MB gzipped.
  - **The street surfaces stay over a box** (`OPEN_BOX`), not cut at the edge: the streets past
    the barriers look the same as those before them. That's task 033's to change if it wants.
  - **Not verified:** how the barriers look in a game (task 035) or what stops a kart between them
    (task 034: the buildings, or a wall along the edge). The edge in the busiest blocks was checked
    by eye at a few places only (the Lamaçães roundabouts, the Picoto, north of the river by the
    fast road, the west by the Rio Este); a few short stretches still zigzag round a junction.
  - **Footpaths:** the map has none yet (`fetch.mjs` doesn't fetch `footway`, `path` or `steps`),
    so only pedestrian streets get gates. When task 013 brings them in as lines, `open.mjs` and
    `gatesOf` take them like any street, once they have a kind in `LINE`.
