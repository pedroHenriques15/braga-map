---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-25
depends-on: [087]
roadmap: Ultra · Braga at its most real
---

# 134 · The roofs' solar panels and gutters, as the orthophoto and the points have them

## Why

Task 087 built each roof from the point cloud's planes, with what stands on it (chimneys, lift rooms,
parapets) and the eaves' overhang. Two things its What asked for weren't made (087's Notes, "Left"):

- **solar panels** (its What 2), "where the orthophoto's colour and the points' flatness say so": seen
  from the hills (`picoto-top`, `monte-da-forca`, `sameiro`) Braga's roofs carry dark rectangles of
  panels on many houses and flat blocks;
- **gutters** (its What 3), "at the size the points show past the footprint": the line along a pitched
  roof's eaves that, close up, tells a house's roof from a lid.

## What

1. **Solar panels:** where DGT's 2025 orthophoto has a dark, bluish, regular rectangle on a roof plane
   and the points there are flat on it (within a few cm, raised or tilted on a flat roof), a panel
   array at its measured size and tilt, on its plane. Count them over the open world, and check a
   sample against the orthophoto by eye. Not the car parks' canopies (task 116 leaves those out).
2. **Gutters:** along each pitched roof's eaves, a gutter where the points show the eaves (087's
   overhang); its size and colour from a reference (`refs/textures.json` or a measured default).
3. The tiles hold them (a minor version); party-kart draws them on Ultra (High if they're cheap), the
   panels' look measured, never a photo.
4. `npm run world`; shoot the views over the roofs at Ultra.

## Read first

- `tools/planes.mjs` (087), `tools/roofs.mjs`, `tools/cover.mjs` (the orthophoto's colours); party-kart's
  `src/render/roofs.ts`; task 087's Notes and the decision it landed with; task 116's canopy rule.

## Done when

- [ ] Panels on the roofs where the orthophoto shows them (a count, a sample checked); gutters along
  the pitched roofs' eaves.
- [ ] Rated no lower at Ultra; High and Low unchanged unless they draw them.
- [ ] `npm test` here, party-kart's tests and `npm run check` pass; the cost in party-kart's budget.

## Notes

- Found by worker-2 in task 087 (2026-10-25: What 2's panels and What 3's gutters left), drafted by the
  coordinator.
