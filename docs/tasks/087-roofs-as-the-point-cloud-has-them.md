---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-23
depends-on: [081]
roadmap: Ultra · Braga at its most real
---

# 087 · Roofs as the point cloud has them: every plane, chimney, dormer and terrace

## Why

Every roof is one of four shapes, flat, hipped, gabled or skillion, fitted to the LiDAR's 50 cm
cells (task 010). Braga's roofs are more: L- and T-shaped houses with valleys, mansards, dormers,
chimneys, roof terraces with their parapets, the blocks' lift rooms and water tanks, solar panels.
From the air and from the Picoto they're what the city looks like, and the point cloud has them.

## What

Today `tools/roofs.mjs` fits each building's 50 cm cells (`roofs.mjs:43`, `S = 0.5`) to a shape,
its ridge's direction, pitch, eaves and ridge heights and parts where the roof steps
(`roofs.mjs:172-251`); party-kart's `src/render/roofs.ts` draws the planes (`roofs.ts:10-12`,
`43-91`). No chimney, dormer, valley or parapet.

1. **Planes from the points:** segment each building's roof points (the LAZ, class 6) into planes
   (RANSAC or region growing over the 50 cm cells' normals), and build the roof as their
   intersection: ridges, hips and valleys where they meet, the eaves at the walls. Fall back to
   today's shape where the fit is worse than it (residual over the cells).
2. **What stands on a roof:** chimneys, dormers, lift rooms, water tanks and parapets, each a block
   the points rise out of the planes by more than 0.4 m, at its measured size; solar panels where
   the orthophoto's colour and the points' flatness say so (measured, never drawn as a photo).
3. **Eaves' overhang** and gutters, at the size the points show past the footprint.
4. **The tiles** hold the roof as planes and blocks; party-kart draws them, on High as today's
   shape if the cost is too high, and in full on Ultra. The roof's colour stays the orthophoto's.
5. Test: a gabled house is still two planes; the Altice Forum and the stadium keep their sights.

## Read first

- `docs/DECISIONS.md` 025, 038; `tools/roofs.mjs`, `tools/footprints.mjs`, `tools/dgt.mjs`;
  party-kart's `src/render/roofs.ts`, `src/render/city.ts`.

## Done when

- [ ] From `picoto-top`, `monte-da-forca`, `bom-jesus` and `sameiro`, the roofs show their valleys,
  chimneys and terraces on Ultra, rated no lower.
- [ ] The fit's median residual over the shooter's area's roofs is lower than today's shapes'.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass; the cost in the budget.

## Out of scope

- The facades under them: 086.
