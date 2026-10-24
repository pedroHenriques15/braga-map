---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [085]
roadmap: Phase 1 · See it: references, the scorecard and the budget
---

# 124 · The budget counts every texture, those a shader takes alone too

## Why

The city's budget (task 004, decision 013) reads the textures' memory from `?stats` and the shots'
`stats.json`. Task 085 found that `textureBytes` (party-kart's `src/stats.ts`) counts only the textures
on a material's own slots, not those given to a shader as uniforms: the streets' layers (6 MB on every
level, 90 MB on Ultra since 085) and `city.ts`'s layered roofs and railings. So every level's figure has
been low since those came in, and the budget compares against a number that leaves them out.

## What

1. `textureBytes` counts every texture the renderer holds (three's `renderer.info.memory` gives the
   count, not the bytes: walk the materials' uniforms too, or keep a register of what the city makes).
2. Every level's figure measured again (`node scripts/shots.mjs <label> --medium`, `--ultra`), and the
   budget in `docs/architecture.md` updated with a note of what it left out before.
3. No viewpoint changes.

## Read first

- party-kart's `src/stats.ts` (`textureBytes`), `src/render/streets.ts` (`layers()`), `src/render/city.ts`
  (the roofs' and railings' layered textures), `docs/architecture.md` ("The city's budget"); task 085's
  Notes.

## Done when

- [ ] `?stats` and the shots' `stats.json` count the streets' layers and the layered roofs and railings,
  checked against a sum of the textures' own sizes.
- [ ] The budget's figures for every level measured again and recorded; `npm test` and `npm run check`
  pass.

## Notes

- Found by worker-2 in task 085 (2026-10-24), drafted by the coordinator.
