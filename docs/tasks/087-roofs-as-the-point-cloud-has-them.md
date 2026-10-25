---
status: doing
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
- [x] The fit's median residual over the shooter's area's roofs is lower than today's shapes'
  (`node tools/planes.mjs --shooter`: over its 517 measured roofs, 0.28 m against the shapes' 0.45; the
  pitched ones 0.41 against 0.78).
- [x] `npm test` here, `npm test` and `npm run check` in party-kart pass; the cost in the budget (here
  166 of 166, four files at a time; party-kart's 164 of 164, four at a time (its rule since 2026-10-25),
  and `tsc` clean; the cost in Notes).

## Out of scope

- The facades under them: 086.

## Notes

- **How the planes are found** (`tools/planes.mjs`, after `roofs.mjs`, into a new `.cache/planes.json`;
  `node tools/planes.mjs try <id>` draws a part's cells, regions and misfits): each measured part's 50 cm
  cells (the top of DGT's building points, as `roofs.mjs` boils them down) are grown into regions from
  the flattest cell left, a cell joining a plane within 25 cm of it and sloping its way within about
  20°; regions on the same plane are one, touching or not. The roof is then the highest of a few
  groups' lowest plane (a region's group: the planes over it, or level within 15 cm, over 90% of its
  cells), so a group's planes meet in its ridges and hips and two groups' in a valley: an L's, a T's,
  a mansard, a half-hip. Of the regions of 2 m² or more, all are taken, then the one the roof lies
  closest to its cells without is dropped, one at a time, while that's closer, or no more than 1 cm
  further and no more than 5 cm further from that plane's own cells: a strip along a ridge (the slope
  fit across it), a wing a step lower or a dormer's plane goes; a gable's two slopes and a small hip
  stay.
- **Where the shape stays:** where the planes fit the cells no better than the part's shape (by 5 cm
  and 15%), and where the roof they make would be higher than the part's highest points or under a
  metre over its ground anywhere over it, or higher along its walls than the points within a metre
  inside them where the shape isn't as high (a plane carried on past its own cells: the first run
  raised two houses' walls at `monte-da-forca` and one at `bom-jesus` towards their ridges). A flat
  part takes planes only where they slope (more than 6°); its walls stand to its eaves round them, so
  a parapet stays round a deck.
- **What stands on a roof:** each set of cells side by side more than 40 cm over it, as a box lined up
  with the part, its top where three quarters of its points are under: not one that fills less than
  half its box (a parapet, an L), one over a third of the roof or longer than 20 m (a storey more over
  part of it), a mast (one or two cells more than 3 m up), or a cell alone under 80 cm up (the points'
  noise at an edge). Only where the roof under it fits (within 35 cm).
- **The overhang:** of the cells just outside the ring (to 1.5 m), those whose points lie on the roof's
  planes carried on (within 40 cm), in bands of 50 cm.
- **What it gives:** of the map's 34,163 measured parts, 13,972 take their own planes, and 42,033
  blocks stand on 13,154 parts (`planes.mjs` takes about 110 s). Over the shooter's area's 517 roofs,
  the misfit (each cell's distance to the roof, a metre at most) is 0.28 m at the median against the
  shapes' 0.45, the pitched roofs' 0.41 against 0.78; 201 of them take their own planes. The Altice
  Forum's hall keeps its shape, its α under its wall's top, and nothing round the Estádio 1.º de Maio's
  stands rises past its shape (a test).
- **The tiles:** each roof's planes, groups, blocks and overhang in a part of the tile's 16-bit numbers
  (`roofs`; `index.js` gives a building `planes`, `groups`, `blocks` and `overhang`): 15,683 KB in all
  against 1.42.0's 14,684, 7% more (in the header's JSON it was 18%).
- **party-kart** (`src/render/roofs.ts`, `src/render/city.ts`), on Ultra only: a building's roof is its
  own planes where the map has them (not over a room's stairs), each group's faces where it's the
  highest; the eaves out as far as the overhang measured (0.4 m where it isn't); a flat roof's deck
  inside its parapet; what stands on it as boxes, their sides the walls' colour and their tops the
  roof's. High and Low draw today's shapes.
- **Shots** (Ultra, High and Low; before on main's party-kart, 8ee2879 on braga-map 1.42.0 by `npm ci`,
  in a worktree of its own; after on 087's; `party-kart\shots\` 2026-10-25-before087 and
  2026-10-25-after087): the four the Done when names, and lobato-crossing and fujacal-west. High and
  Low are the same to the pixel in all six. On Ultra:
  - picoto-top (7.0% of the pixels): the low building on the left loses the big dark hipped roof the
    shape gave it; its points have it near flat, as its photo does, a deck behind its walls.
  - monte-da-forca (1.6%): the building on the left has a flat roof behind a parapet where it had a
    pitched one; the orange-roofed house's hips are steeper, as its points have them.
  - bom-jesus (2.6%): the white house on the left shows a gable end to the street where the shape
    gave it a hip. Its points (2025) and the orthophoto have its ridge along the row, its planes
    meeting its neighbours'; its 2019 photo seems to show a hip.
  - sameiro (0.2%): a far building's roof, barely.
  - lobato-crossing (1.4%): a lift room on the big block's roof.
  - fujacal-west (1.2%): the grey pitched roof behind the trees is flat with boxes on it, as its photo
    shows it.
  - The four named views are from the street: they show roofs from below, a valley or a chimney little.
  - The first run's walls raised at monte-da-forca and bom-jesus are gone (the checks above). The 20 m
    cap on blocks came after a first after round and changes none of the six views by a pixel.
- **Budget** (Ultra; High and Low unchanged): the same draw calls (lobato-crossing's one fewer) and
  textures (462 MB). The triangles are 4% to 7% more: picoto-top 13.18 to 13.78 M, sameiro 11.56 to
  12.06 M, lobato-crossing 9.37 to 10.00 M, bom-jesus 7.82 to 8.16 M. The frame is 0.02 to 0.6 ms
  longer (lobato-crossing 4.81 to 5.43 ms; High's frames moved as much with nothing changed). The
  download: the tiles 7% more.
- **Decided by the session, for the owner to confirm:**
  - On Ultra only: High keeps today's cost and look.
  - The thresholds above.
  - The bom-jesus house's gable stays as its points have it.
- **Left:** solar panels (What 2) and gutters (What 3) aren't made here.
- **Found on the way:** with 28 cores, braga-map's `npm test` runs 27 test files at once, each loading
  the world. Once, after the rebuild, it hung: a test's process at 2.4 GB for nearly three hours. Four
  at a time (`node --test --test-concurrency=4`), it passes, 166 tests in 75 s. Most likely the memory, as in
  party-kart's; not shown.
