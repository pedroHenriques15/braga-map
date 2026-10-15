---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-15
depends-on: [037]
roadmap: Phase 3 · Surfaces and colours
---

# 044 · Pavements level from the kerb, not draped over the ground's bumps

## Why

Since task 035 every pavement in the open world's area is drawn on the tiles' 2 m ground, a kerb
over it (`firm + raise` in party-kart's `src/world/ground.ts`, the same in `src/render/streets.ts`),
fitted to it loosely (50 cm on High). A real pavement is laid level from its kerb, sloping gently
along the street; the 2 m ground under one averages in what's beside it, a building's base, a
bank, a ruin. So pavements crease and heave where the real ones are flat. On the round "Todas as
ruas" (2026-10-15) `bom-jesus` fell from 4 to 2, its camera on a creased pavement.

## What

Today (2026-10-15):

- braga-map's `world.streets.pavements` are outlines on the ground with no heights (`level:
  'ground'`); decks' and tunnels' pieces carry `ys` (`index.d.ts`, `tools/streets.mjs`).
- party-kart draws a ground pavement at `firm(x, z) + raise(x, z)` (`streets.ts`'s `paveY`), its
  triangles halved where the ground bends more than `GRAIN.pave.tol`; karts stand on the same
  (`ground.ts`'s `floor`). A finer fit (tol 6 cm) takes `bom-jesus`'s crease out, but makes the
  bumps sharper where the ground itself rises (`devesa`), and doubles the triangles there (2.28 M
  on High).
- The track's own pavements before 035 sloped from the kerb's top to meet the ground at their back
  (at most 12% up, 5% down), with a granite retaining wall or a skirt beyond: they never creased.

Steps:

1. **A pavement's height from its kerb:** at each point, the kerb's top at the nearest point of its
   carriageway's edge (the carriageway's ground plus the kerb), sloping across towards its back at
   most a few per cent (Questions), sloping down to a dropped kerb as today. Where the land at the
   back is higher or lower, a granite retaining wall or a skirt meets it, as `streets.ts` does at
   the streets' outline.
2. **What the karts stand on** is the same (`ground.ts`), so drawing and driving still match
   (decision 024).
3. Shoot the viewpoints; measure the budget (task 004): a level pavement needs fewer triangles than
   a draped one.

## Questions

- [ ] Where do the heights come from: (a) braga-map works them out and the tiles carry `ys` for
  ground pavements, as for decks, so every game has the same (recommended: the data does it once,
  as decision 023 has it); or (b) each game works them out from the kerbs and the carriageways?

## Read first

- party-kart: `src/render/streets.ts` (`paveY`, `GRAIN`, the outline's walls and skirts),
  `src/world/ground.ts` (`floor`, `raise`), `test/streets.test.ts`, `test/ground.test.ts`.
- braga-map: `tools/streets.mjs`, `index.d.ts` (`Pavement`), decisions 021, 023 and 024.
- The round `2026-10-15-task035`: `bom-jesus`, `devesa`, `lobato-pavement`.

## Done when

- [ ] No pavement creases or heaves where the street beside it is smooth: `bom-jesus`, `devesa`,
  `lobato-pavement` shot again, before and after.
- [ ] `bom-jesus` scores no lower than the round before.
- [ ] Karts stand on the pavements as drawn (party-kart's `test/streets.test.ts` and
  `test/ground.test.ts`), and the budget is measured.

## Out of scope

- The land's own humps where the LiDAR saw a ruin or a building's base as ground (`devesa` at
  (440, 1029)): task 043's kind of work, or 013's walls.
- Where the map's carriageway is off the real road's middle, so a viewpoint's camera stands on a
  pavement or the road: task 026.
- Braga's pavement pattern and the real pavements' widths: task 018.

## Notes

- Found in task 035's round (2026-10-15), from the owner's marks: `bom-jesus` 4→2, `devesa` 3→2,
  `liberdade` 2→1. `devesa`'s white mounds are the land, 2 m over the street at (440, 1029), where
  the LiDAR took a ruin for ground (the owner had flagged it in "Os amigos"); `liberdade`'s camera
  stands on the map's carriageway, wider there than the real road (task 026). Only `bom-jesus`'s
  crease is this task's.
- After 037: party-kart's `ground.ts` is being changed by 036 and 037 now.
