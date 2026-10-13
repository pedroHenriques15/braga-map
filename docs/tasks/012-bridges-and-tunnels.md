---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [009]
roadmap: Phase 2 · The shape
---

# 012 · Bridges, flyovers and tunnels at their real levels

## Why

Braga's avenues cross each other on bridges and in tunnels, and the game draws them all flat:
a road that passes under another meets it as a level junction, and a flyover lies on the ground.
A local notices at once. The route itself crosses several, and the shooter's area has a tunnel.

## What

Today `tools/world.mjs` drops tunnels from the lines (`:48`) and ignores `bridge` and `layer`.
`tools/build.mjs:130` keeps `bridge` for the map page only. The track's planner excludes
tunnels from routing (`track.mjs:51`) and takes its heights from the relief, blurred. In
party-kart, the only bridges are over the Rio Este: one granite block with an arch and parapets
(`src/render/road.ts:203-239`).

In the track's box, OSM has 23 street ways tagged `bridge` and 56 tagged `tunnel` (counted
2026-10-13). Among them: bridges on the Avenida da Liberdade, the Avenida 31 de Janeiro, the
Largo da Soutinha, the Rua Bernardo Sequeira, the Avenida Doutor António Alves Palha, the
Avenida Robert Smith and the Largo Santa Justa, all streets on the route; tunnels under the
Avenida Central, the Avenida da Liberdade, the Avenida João XXI and the Travessa Conselheiro
Lobato.

1. **Keep the levels in the world:** `bridge`, `tunnel`, `layer` and `covered` on each line,
   and a deck height for each bridge: the ends' ground heights, joined straight (or the LiDAR
   surface along it, task 009).
2. **Cut the ground for what goes under:** a road in a cutting or an underpass keeps its real
   level, and the ground mesh is cut away where a tunnel's mouth opens.
3. **Draw them** in party-kart: decks with their parapets and pillars, in concrete for the
   modern ones (most of the avenues) and granite for the old ones; tunnel mouths with their
   walls; the street that runs under at its own level. Bridges made from photos (task 008)
   where they're on the route.
4. **The track** follows the real level where it uses a bridge or an underpass. Check the
   route's heights against the real ones there, and keep the lap tests passing.
5. **The shooter's area:** the Travessa Conselheiro Lobato's tunnel, walkable at its real
   width and height.

## Read first

- `tools/world.mjs` (lines, `:48`), `tools/track.mjs` (heights, `:366`), `tools/osm.mjs`.
- `../party-kart/src/render/road.ts:203-239` (the Rio Este's bridges), `city.ts` (the ground).
- `../party-kart/test/drive.test.ts`: the lap tests.

## Done when

- [ ] No street that passes under another is drawn as a level junction in the track's box: a
  check script lists bridge/tunnel pairs and the height between them.
- [ ] The viewpoints at the Avenida da Liberdade and the Avenida João XXI show the levels as in
  their photos.
- [ ] party-kart's `npm test` and `npm run check` pass.

## Out of scope

- The Rio Este's banks and weirs: task 016's ground, and "Later" in the roadmap.

## Notes
