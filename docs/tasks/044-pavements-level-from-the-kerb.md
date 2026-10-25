---
status: doing
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

1. **braga-map gives each ground pavement its heights** (`tools/streets.mjs`, Questions): a `ys`
   for every ring of each pavement, reservation and island on the ground, as decks' pieces have
   (`index.d.ts`'s `Pavement.ys`, its comment saying so), in the same frame as theirs, with a point
   at least every 2 m along each ring so the heights follow the street. At each point, the top of
   its nearest kerb (the carriageway's ground there, `height(x, z)`, plus the kerb's `h`), rising or
   falling towards the pavement's back at most 2% across (Questions). Between two kerbs (a
   reservation, an island, a pavement between two streets) it runs from one kerb's top to the
   other's. Where a kerb is dropped at a crossing, the pavement slopes down to it over 1.2 m
   (party-kart's `DROP` today), with a point where that slope starts and one where it ends. A path that
   runs in a pavement, flush with it (task 050's `raised`), gets its `ys` by the same rule.
2. **party-kart reads them** (`src/render/streets.ts`'s `paveY`, `src/world/ground.ts`'s `floor`):
   a ground pavement at its `ys`, inside its outline from its outline's nearest edges as a deck's
   `Piece` is, instead of `firm + raise`, and a raised path the same. Drawing and driving stay one
   surface (decision 024). Where the land at a pavement's back is higher or lower than it, a granite
   retaining wall or a skirt meets it, as `streets.ts` does at the streets' outline.
3. braga-map's version goes up and party-kart is pinned to it, as task 050 did.
4. Shoot the viewpoints; measure the budget (task 004): a level pavement needs fewer triangles than
   a draped one.

## Questions

- [x] Where do the heights come from: (a) braga-map works them out and the tiles carry `ys` for
  ground pavements, as for decks, so every game has the same (recommended: the data does it once,
  as decision 023 has it); or (b) each game works them out from the kerbs and the carriageways?
  > (a), 2026-10-16: braga-map works them out once and the tiles carry `ys` for ground pavements.
- [x] How steep may a pavement slope across, from its kerb to its back, before a wall or a skirt
  meets the land behind it: (a) 2%, the cap Portugal's accessibility rules set for a footway's
  slope across (recommended: pavements read level, as real ones do); (b) 12% up and 5% down, as the
  track's own pavements did before task 035 (fewer walls, but they tilt on hillsides); or (c) 5%
  either way?
  > (a), 2026-10-16: 2% at most; beyond that a wall or a skirt meets the land.

## Read first

- party-kart: `src/render/streets.ts` (`paveY`, `GRAIN`, the outline's walls and skirts),
  `src/world/ground.ts` (`floor`, `raise`), `test/streets.test.ts`, `test/ground.test.ts`.
- braga-map: `tools/streets.mjs`, `index.d.ts` (`Pavement`), decisions 021, 023 and 024.
- The round `2026-10-15-task035`: `bom-jesus`, `devesa`, `lobato-pavement`.
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, kerbs and pavements at centimetres,
  each step at its rise: on foot, the 2 m ground shows.

## Done when

- [ ] Every pavement, reservation and island on the ground in the tiles has `ys`, and so does every
  raised path: at its kerb within 1 cm of the carriageway's ground plus the kerb, and, except
  between two kerbs, no steeper than 2% across from it (braga-map's `test/streets.test.js`).
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
- Answered 2026-10-16. When it's finished, the answers become a decision in `docs/DECISIONS.md`: a
  ground pavement's heights are the data's, level from its kerb at 2% across at most.
- 2026-10-16: party-kart's `streets.ts`, `ground.ts` and `test/ground.test.ts` have uncommitted
  changes from another session (task 013's walls, by the look of `scratch-walls.ts`). Start after
  they land, and don't overwrite them.
