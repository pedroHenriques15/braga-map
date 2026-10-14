---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-14
depends-on: [006]
roadmap: Phase 2 · The shape
---

# 041 · The squares mapped in parts: the Praça da República in the world

## Why

The street audit (task 006) found that the world draws every street OpenStreetMap has round the
Volta dos Amigos, but 8 of its 51 squares: the Praça da República, the Praça Conde de Agrolongo,
the Terreiro do Castelo and five without a name. OpenStreetMap maps each of them as a multipolygon
relation, in parts, and the world reads only the squares mapped as one way. So the ground there is
painted as whatever is under it, not as a square, and the Praça da República, the map's (0, 0), is
the most known square in Braga.

## What

Today (2026-10-14):

- `tools/fetch.mjs`'s `base` fetches `way["highway"="pedestrian"]` only. Its `paths` part (task
  006) fetches `relation["highway"="pedestrian"]` too, for the audit: 10 over the map, 8 of them
  in the Volta dos Amigos' box, none in the open world's area.
- `tools/world.mjs` makes a square of a way (`isSquare` in `tools/lines.mjs`: `highway=pedestrian`
  with `area=yes`, or closed) and adds it to the areas as `plaza`, painted last. It reads only
  `base.json`'s ways, so a relation never becomes one. `tools/streets.mjs` takes the `plaza` areas
  as the squares its pavements stop at.
- `tools/build.mjs` (the map page) does the same with the ways, and also never sees the
  relations.
- `tools/audit.mjs` checks a square by its outline: drawn where a `plaza` area's edge in the tiles
  runs within 1 m of it. It prints the 8 under "Streets, squares and railway in the box the tiles
  don't draw whole", with their relation ids and where they are.

Steps:

1. Fetch the pedestrian relations where the world reads them: move `relation["highway"="pedestrian"]`
   into `base` (`node tools/fetch.mjs base`, which also brings the map's other changes since
   2026-10-13: run the tracks and the games' tests after), or have `world.mjs` and `build.mjs` read
   `paths.json` too. The first keeps every street and square in one file.
2. Join each relation's `outer` member ways into rings, as `footprints()` in `tools/osm.mjs` does
   for a building mapped in parts (or `rings()` in `build.mjs`). An `inner` ring (a hole: a
   building, a fountain, a garden in it) can't be cut out of an area the way the tiles hold them
   (one ring each): say what's under it in Notes, and whether painting the hole's own area after the
   square (as a smaller one is painted after a bigger) covers it.
3. Add the rings to the areas as `plaza` in `world.mjs`, and to the page's areas in `build.mjs`.
4. Two ways tagged as areas that aren't pedestrian (a `residential` and a `service`, both outside
   the Volta dos Amigos' box) are drawn today as a street round their outline. Leave them, or
   treat them as squares too, and say which in Notes.
5. Run `npm run world`, `node tools/audit.mjs` and `npm run page`, and `npm test`.

## Read first

- `tools/lines.mjs` (`isLine`, `isSquare`), `tools/world.mjs` (the areas, and the squares it hands
  `streetSurfaces`), `tools/osm.mjs` (`footprints`), `tools/build.mjs` (`rings`, the areas).
- `tools/audit.mjs` and `docs/tasks/done/006-street-audit.md`: how a square counts as drawn.

## Done when

- [ ] `node tools/audit.mjs` prints every square in the box drawn whole (51 of 51 in today's map),
  and nothing under "Streets, squares and railway in the box the tiles don't draw whole" but the
  streets being built or of no known class.
- [ ] The Praça da República is a `plaza` area in the tiles round (0, 0), and on the map page.
- [ ] No viewpoint looks at these squares today (the nearest, `joao-xxi`, is 290 m from one): a
  shot of party-kart's city over the Praça da República, before and after, shows it paved as a
  square.

## Out of scope

- What a square looks like (its paving pattern, its fountain, its benches): tasks 018 and 020.
- Squares OpenStreetMap lacks: none was found along the route or in Fujacal (task 006).

## Notes

Found by task 006's audit on 2026-10-14, OpenStreetMap of 2026-10-13 (`base`) and 2026-10-14
(`paths`).
