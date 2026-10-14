---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 009]
roadmap: Phase 3 · Surfaces and colours
---

# 019 · Trees: their species, their places and their real size

## Why

Trees frame a street: the plane trees of an avenue, the pines and eucalyptus on the hills, a
single old tree in a square. Today every broadleaf tree is the same three blobs in a random
green, every conifer the same cone, and woods and parks are filled with trees at a fixed density.
The LiDAR sees each real tree's position, height and crown, and OSM names some species.

## What

Today: 5,983 trees along the route (5,770 broadleaf, 213 pine) from OSM, plus fill in woods (one
per 200 m², 60% pine), parks (420 m²) and scrub (900 m²), none within 11 m of the road
(`tools/world.mjs`, trees). Only `leaf_type` is read. OSM's `height` (403 trees),
`diameter_crown` (53), `circumference` (68), `species` (11) and `genus` (1) are ignored.
party-kart draws icosahedra or cones with a random colour (`src/render/trees.ts:57-110`).

1. **Each tree from the LiDAR:** find the crowns in the high-vegetation class (or MDS − MDT
   over green ground, task 009): position, height and crown width. Match them to OSM's trees;
   where the woods and parks are filled today, use the LiDAR's trees instead.
2. **Species:** OSM's tags where there are some; the street's type (avenues are often plane or
   lime trees); the photos (task 008); and on the hills, pine, eucalyptus or oak from the
   orthophoto's colour and the near-infrared. Five to eight kinds cover most of Braga.
3. **Models:** one per kind, at its measured height and crown: their shape and colour, with
   photo textures for the bark and leaves (task 007), and instanced.
4. **The season:** today's look is summer. Deciduous trees could be bare in winter ("Later" in
   the roadmap).

## Read first

- `tools/world.mjs` (trees), `../party-kart/src/render/trees.ts`, `city.ts` (planting).
- Tasks 005 and 009.

## Done when

- [ ] Every tree in the LiDAR's cover along the route and in the shooter's area is in the tiles
  with its height and crown; fill trees are gone there.
- [ ] Trees on the route are drawn as their kind, checked at the viewpoints.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- Hedges: task 013. Grass and soil: task 016.

## Notes

- From task 005: the point cloud (`.cache/dgt/LAZ/`, read by `tools/dgt.mjs`'s `points(key, fn)`)
  classes low, medium and high vegetation (3, 4, 5); it covers the route's corridor and the
  shooter's area. DGT's OGC API also has the trees of public interest (`srup_arvores_point`).
