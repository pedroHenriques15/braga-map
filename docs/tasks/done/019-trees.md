---
status: done
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
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, each tree where it stands, at its
  height and with its crown.

## Done when

- [x] Every tree in the LiDAR's cover along the route and in the shooter's area is in the tiles
  with its height and crown; fill trees are gone there. The point cloud covers the whole map, and
  every tree on it is one it found or one OpenStreetMap has (251,131; none filled in):
  `test/trees.test.js` checks the 54,697 under the Volta dos Amigos' box are none filled in, each
  sized and of a kind, and off the carriageways; 765 in the shooter's area.
- [x] Trees on the route are drawn as their kind, checked at the viewpoints: the round "As árvores"
  (`2026-10-18-after019`) on "Braga real", Claude's marks 2.88 over the 34 where "A aterragem" had
  2.68, seven places up a point (`imaculada-conceicao`, `porfirio-da-silva`, `31-de-janeiro`,
  `falperra`, `sameiro`, `alameda-fujacal`, `picoto-top`), none down. Each kind's shape in its
  bark and leaves near, its billboard far.
- [x] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017):
  below, and in party-kart's `docs/architecture.md`.

## Out of scope

- Hedges: task 013. Grass and soil: task 016.

## Notes

- From task 005: the point cloud (`.cache/dgt/LAZ/`, read by `tools/dgt.mjs`'s `points(key, fn)`)
  classes low, medium and high vegetation (3, 4, 5); it covers the route's corridor and the
  shooter's area. DGT's OGC API also has the trees of public interest (`srup_arvores_point`).
- From task 016's round `2026-10-16-after016` (2026-10-16): the ground under a tree's crown is now
  drawn as what's round it, and far off a crown's cells take the green of the game's trees; near,
  where the game draws no tree, the ground shows bare. The Sameiro's slope (`sameiro`) has dark
  trees in the photo and bare grey earth in the game; the Falperra's hillside (`falperra`) is
  mottled green and grey, without its pines. The trees missing hold down `sao-joao-da-ponte`,
  `porfirio-da-silva` and `31-de-janeiro` too (Claude's marks, 3, 2 and 3). Where the crowns are:
  `world.groundCover`'s classes, each 50 cm cell under one marked (8), from the LiDAR.

### Done 2026-10-18 (braga-map 1.23.0, party-kart `ad143d0` pinned to it, decision 043)

- **"Today", checked against main first** (2026-10-18, after 016, 013 and 026): as the task had it,
  but 10,757 trees and 25 rows from OSM over the map (only 4 needleleaved, 3 palms, 11 species),
  10,614 filled into woods, parks and scrub; the fill and OSM's trees kept off every street taken
  9 m wide (`W_MIN`), now on the streets moved by 026. 016 had added each crown's 50 cm cells to the
  ground cover, and party-kart turned them into a canopy's green from 40 m off; 013 the hedges.
- **The crowns** (`tools/trees.mjs`): the point cloud boiled down once to `.cache/dgt/trees/` (42
  tiles, 450 MB, 25 minutes); the crowns found as the README says. A top must stand 6% of its height
  (1 m at least) over where it meets a higher one, which split the woods into crowns of 6–15 m (at 12%
  the Picoto's eucalyptus came out as crowns up to 28 m across, two or three trees each), and a broad
  crown's bumps stay one. A crown's foot is the 5th percentile of its cells' lowest leaves, no higher
  than 60% of it: at the median, the planes by the Parque da Ponte came out with feet at 60–75% of
  their height, where the laser doesn't reach under them. 8,800 of OSM's trees on the map stand in a crown
  (several in one crown split it between them), 1,300 in none, kept as young trees.
- **The kinds:** 167,061 broadleaf, 73,540 eucalyptus, 4,907 pine, 3,501 cypress or cedar, 2,726
  poplar, 3 palms. COS2025's woods name most of the hills', but under the Volta dos Amigos' box no
  wood is a pine one (the Falperra's and the Picoto's are "other broadleaves" or eucalyptus), so the
  near-infrared rule finds its pines: 24% of COS2025's pine woods' tall trees are dark in it and hold
  their crowns high, against 3–10% in its other woods. The photos weren't read tree by tree: task 061.
- **The textures:** each kind's bark from Poly Haven, its leaves composed from Poly Haven trees' leaf
  and twig photos (their alpha), `refs/textures.json` and `tools/textures.mjs` (`world/textures/trees/`,
  12 KTX2 at three levels, 0.9 MB at High).
- **party-kart** (`render/trees.ts`'s `cityTrees`): near within 260 m (180 on Medium, 120 on Low),
  far as billboards, a dithered fade between; the city's woods sound follows the crowns' cover
  (`ambience.ts`), as an avenue's row of trees is as many as a wood's edge; a kart hits a trunk as
  thick as the map says (`ground.ts`). Its 63 tests pass (the autopilot's laps 301.7 and 299.9 s, no
  respawn, as on 1.22.0); a lap in the browser with the autopilot and three bots, about 302 s, over
  the jump, no page error.
- **The budget** (party-kart's `docs/architecture.md`), at the median of the 34 viewpoints: draw
  calls 148.5 → 145.5 on High, 148 → 143.5 on Medium, 106 → 104 on Low; triangles 1.79 → 2.04 M on
  High (up to 0.48 M more where the hills' woods are near), 1.51 → 1.56 on Medium, 0.82 → 0.91 on
  Low; textures 134 → 139 MB on High; the city built 0.1–0.3 s slower; the download on High 9.30 MB
  gzipped, 1.26 MB more (the trees' photos 0.90, the tiles 0.45).
- **The landing:** braga-map's main merged ("A aterragem"'s marks) and the remake run again (trees,
  open, shooter, world, tracks, cover, textures, the page): beside the trees, only the map's credit
  changed, which now names the trees and COS2025. `carriageways.json` and `walls.json` weren't made
  again: they're 057's, by main's code, which neither main nor this task has changed since. 115 tests
  pass.
- **What the round shows:** the avenues' rows and the big single trees where the photos have them
  (`imaculada-conceicao`, `31-de-janeiro`, `alameda-fujacal`, the oak on the Sameiro's bank), and the
  hills wooded (`falperra`, `picoto-top`). Left over: every tree is in leaf where the winter photos
  have them bare (the seasons are "Later"); the woods far off read paler than the photos' dark green;
  the Parque da Ponte's planes are thin, high eucalyptus (task 061); at `altice-forum` the camera is
  inside the crown of the tree its photo has at its edge, and at `capela-sao-joao` a trunk stands
  just in front of the camera.
- **Not checked:** the owner's marks for the round; a phone (the frame time on the desktop is
  0.4–2.1 ms on every level); the deploy (not asked).
