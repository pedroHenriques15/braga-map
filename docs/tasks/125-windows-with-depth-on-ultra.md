---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [086]
roadmap: Ultra · Braga at its most real
---

# 125 · On Ultra, a facade's openings with depth: reveals, sills, frames, shutter boxes, a door's step

## Why

Task 086 puts each seen facade's doors and windows where they are, from its photos; on every level
they're drawn on the wall. Up close on Ultra a window is a hole with a reveal, a granite sill and frame,
a shutter box over it, and a door has its step: geometry, not paint. Split from 086 (2026-10-24), as it
needs 086's layouts first and is a piece of work of its own.

## What

1. On Ultra, each opening of a facade with a layout (086) cut into the wall at its reveal's depth, with
   its sill, frame and shutter box as geometry, the door's step; instanced per kind of opening.
2. The kit's rhythm facades (no layout) the same where the kit's bays say where their openings are.
3. Shoot the facades' viewpoints at Ultra; measure the cost.

## Read first

- party-kart's `src/render/facades.ts`; braga-map's `refs/buildings.json` (086's layouts); decision 036;
  task 086's Notes.

## Done when

- [ ] On Ultra the openings have depth up close (`fujacal-start`, `conselheiro-lobato`, `lobato-east`,
  `travessa-fujacal`), rated no lower.
- [ ] High and below unchanged; the cost in the budget's Ultra column; `npm test` and `npm run check`
  pass.

## Notes

- Split from task 086 by the coordinator (2026-10-24), at worker-2's suggestion.
