---
status: todo
priority: low
kind: code
repo: braga-map
created: 2026-10-18
depends-on: [019]
roadmap: Phase 3 · Surfaces and colours
---

# 061 · The trees' species from their photos

## Why

Task 019 put every tree where the LiDAR sees it, at its height and crown, but named its kind from
what OpenStreetMap tags (a few hundred trees), the wood it stands in (COS2025, a wood of 1 ha by its
main species) or its shape. So the Parque da Ponte's old plane trees are eucalyptus, as COS2025 has
the park's wood; a palm the map doesn't name is a broadleaf; and the avenues' hackberries, limes,
planes and clipped round limes are all one broadleaf. The viewpoints' and the reference photos
(task 008) show what they are.

## What

Today (task 019, decision 043): `tools/trees.mjs`'s `kindOf` names each tree's kind from the map's
tags, else COS2025's wood, else its shape (narrow and tall, held high, dark in the near-infrared);
six kinds, `KINDS`. party-kart draws each kind's shape in its photos (`render/trees.ts`).

1. **Look at the trees in each viewpoint's photo and in the reference photos along the route**
   (`refs/photos.json`, `.cache/refs/`): what each tree near the camera is (a plane, a hackberry,
   a lime, an oak, a birch, a palm, a cypress, a eucalyptus, a pine), matched to the tree the world has
   there (`node tools/trees.mjs --check x,z` draws them over the orthophoto).
2. **Record them** in a file of the trees seen (`refs/trees.json`, as `refs/buildings.json` records
   the facades seen): a tree's place and its species, and the stretches of street a species lines
   (an avenue's row is one species).
3. **Take them first** in `kindOf`, before COS2025's wood: a tree seen, and the trees of a row seen
   along the same street.
4. **New kinds** where they look different enough to draw apart: the plane tree (pale, mottled bark,
   broad leaves), the clipped round crown of the Imaculada Conceição's limes, the birch (white bark).
   Each with its bark and leaves (`refs/textures.json`, Poly Haven), and its shape in party-kart.
5. **Deciduous or evergreen**, for the seasons ("Later" in the roadmap): each kind says which.

## Read first

- `tools/trees.mjs` (`kindOf`, `osmKind`, `woods`), `docs/tasks/done/019-trees.md`, decision 043.
- `refs/buildings.json` and `tools/buildings.mjs`: how the facades seen are recorded and taken.

## Done when

- [ ] Every tree in view of a viewpoint, within 60 m of its camera, is the species its photo shows,
  checked at the viewpoints (`sao-joao-da-ponte`, `capela-sao-joao`, `imaculada-conceicao`,
  `porfirio-da-silva`, `31-de-janeiro`, `joao-xxi`, `liberdade`).
- [ ] The rows along the route's avenues are their species the length of the avenue.
- [ ] What new kinds add is measured against the budget.

## Out of scope

- The seasons themselves (bare plane trees in winter, the jacarandas in flower): "Later".
- Where each tree is and how big: task 019.

## Notes

- From task 019 (2026-10-18): the Parque da Ponte's trees by São João da Ponte's roundabout are big
  plane trees in the photo (`sao-joao-da-ponte`), drawn as eucalyptus with high feet, as COS2025's
  wood there is a eucalyptus one.
