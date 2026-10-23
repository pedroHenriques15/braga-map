---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 088 · Every tree in the open world its species

## Why

A tree is one of nine kinds (decision 051): its species only where OpenStreetMap names it or a
viewpoint's photo shows it, else its wood's from COS2025, else a guess from its shape. Most of the
open world's street trees are "broadleaf", which covers Braga's hackberries, limes, planes, oaks,
jacarandas, magnolias and ornamental cherries alike, and they don't look alike, nor the same in
every season (093).

## What

Today `tools/trees.mjs` gives each tree a kind in 4 bits (`trees.mjs:399-401`, 9 kinds, 16 at
most), from `refs/trees.json` (seen, task 061), OSM's `species`/`genus`/`leaf_type`, COS2025's main
species, then shape rules (`trees.mjs:446-459`). party-kart draws a kind's shape, bark and leaves
(`src/render/trees.ts`).

1. **Research first:** whether Braga's municipality publishes its street-tree inventory
   (Câmara Municipal de Braga, dados abertos), and under what licence. Record it in
   `docs/SOURCES.md`. If it's open, it's the first source: each tree's species where it stands.
2. **The reference photos:** sessions name the species of every street and park tree in the open
   world that a photo in `refs/photos.json` (or a further Mapillary photo, as a reference)
   shows, into `refs/trees.json`, the shooter's area first. Photos are read, never drawn (082).
3. **The point cloud** for what neither says: the crown's shape, the NIR's season (the flight was
   July), the height and the spacing of a row (an avenue's row is one species).
4. **More kinds,** up to 16 in the 4 bits (or a wider field): hackberry, oak, magnolia, jacaranda,
   cherry, holm oak, cork oak, maple, ash, as many as Braga's open world has more than ~50 of,
   each with its shape, bark and leaves made (082) and whether it's evergreen.

## Read first

- `docs/DECISIONS.md` 043, 047, 051; `tools/trees.mjs`, `refs/trees.json`, `refs/photos.json`;
  party-kart's `src/render/trees.ts`.

## Done when

- [ ] Every tree in the shooter's area that a photo shows has its species (765 trees there); the
  share of "broadleaf" in the open world is recorded before and after.
- [ ] `alameda-fujacal`, `31-de-janeiro`, `imaculada-conceicao`, `capela-sao-joao` and
  `porfirio-da-silva` shot again, rated no lower.
- [ ] `npm test` passes.

## Out of scope

- How the trees are drawn far off: 089. Their seasons: 093.
