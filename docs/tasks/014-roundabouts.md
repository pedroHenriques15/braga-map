---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-13
depends-on: []
roadmap: Phase 2 · The shape
---

# 014 · Roundabouts as they are: their islands, their size, what stands in them

## Why

Braga is a city of roundabouts, and many have something of their own in the middle: a
sculpture, a fountain, a garden. In the game a roundabout is only a one-way ring
(`junction=roundabout`, `tools/osm.mjs:11`): no island geometry of its own, no kerb round it,
nothing in it. The route goes round several, the Rotunda Associação Jurídica de Braga among
them.

## What

Today the track's box has 89 ways tagged `junction=roundabout` (2026-10-13). The ring's width
comes from the street's width rule (`osm.mjs:14-21`), and the island is whatever ground area is
under it.

1. **Make each roundabout's island** from its ring: the inner edge as a kerbed island, its
   radius from the ring, and the apron (the setts round the island) where the photos show one.
2. **What's in it:** OSM's nodes inside the island (`artwork`, `fountain`, `tree`, `monument`),
   and the orthophoto (grass, paving, trees). On the route, each island from its photos (task
   008), with a simple model of what stands there.
3. **Markings** at each entry: the give-way line and triangles (Portugal's
   regulation, task 018 has the dimensions).
4. Draw them in party-kart, and let the track's corners follow the real ring.

## Read first

- `tools/osm.mjs` (`carriageway`, `junction`), `tools/track.mjs` (corners, `R_MIN`).
- `../party-kart/src/render/road.ts`.

## Done when

- [ ] Every roundabout in the track's box has an island with a kerb, as the world's data.
- [ ] Every roundabout on the route has its centrepiece, checked against its photo.
- [ ] party-kart's tests pass.

## Out of scope

- Line markings elsewhere: task 018.

## Notes
