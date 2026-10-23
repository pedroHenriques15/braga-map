---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-23
depends-on: [081, 082]
roadmap: Ultra · Braga at its most real
---

# 089 · On Ultra, the trees in full to the horizon, moving in the wind

## Why

A tree near the camera is a trunk and a crown of leaf cards (260 m on High); further off it's its
kind's billboard, the same picture for every tree of its kind, and nothing moves (decision 043). From
the Picoto or Bom Jesus the woods are flat cards, and on the avenues no leaf stirs.

## What

Today `src/render/trees.ts` draws instanced cards per kind within 260/180/120 m and billboards
beyond, dithered over 25 m; crowns lean, leaves tinted to Braga's summer green (`trees.ts:190-200`,
`281-362`).

1. **On Ultra, three levels per tree, not two:** the cards near (to ~400 m), a simplified crown
   mesh of a few hundred triangles in its own shape and size (to ~2 km), and an impostor baked
   per kind from 8 directions with depth (octahedral), lit by the sun, beyond: never a flat card
   facing the camera.
2. **Branches:** near, the crown's main limbs drawn as geometry where the leaves are thin
   (deciduous kinds), so a tree has its structure, not a cloud of cards.
3. **Wind:** a vertex shader sways trunks, branches and cards by height and a slow gust field,
   the same everywhere at a moment (frozen at time 0 for `?scenery`).
4. Shadows: every near tree casts and receives on Ultra; the mid level casts.

## Read first

- braga-map's `docs/DECISIONS.md` 043, 047, 051; `src/render/trees.ts`, `src/render/look.ts`.

## Done when

- [ ] From `picoto-top`, `bom-jesus`, `sameiro` and `falperra`, the woods on Ultra have depth and
  light, not cards; rated no lower.
- [ ] Trees move in the wind in the game, not in `?scenery` shots.
- [ ] The cost is in the budget's Ultra column; High and below unchanged; `npm test` and
  `npm run check` pass.

## Out of scope

- The species: 088. The seasons: 093.
