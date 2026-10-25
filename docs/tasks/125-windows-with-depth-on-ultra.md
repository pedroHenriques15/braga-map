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
- **Read for it, not started** (worker-2, 2026-10-25, after 123; the run stopped before it):
  - **Where each opening is.** A wall without a layout is in its kind's rhythm: `baysOf` (party-kart's
    `world/storeys.ts`) gives its bays, `margin` and `bayW`, and `storeys` its `G` and `S`. A storey's
    window is `p.win` (across, up) in the middle of each bay, its sill `p.sill` over the storey's floor.
    The ground floor's drawings (`groundOf`, 3.4 by 3.6 m) are stretched to the bay, and the front door
    is at `door`'s bay. A wall with a layout (086): `layoutPieces` gives each piece's `s0`–`s1`, `h0`–`h1`
    and its drawing's `u` range, and `PART` where the opening sits in that drawing. So the geometry can
    be placed from the same numbers the walls' shader draws with, and lines up with it.
  - **The hole.** A tower's room already cuts its walls round its openings (`city.ts`, the
    `side.open` branch, `THREE.ShapeUtils.triangulateShape`), but triangulating every facade so would
    cost too much. Instead, on Ultra the walls' shader could discard where the bay's drawing is the
    opening (a class more in Ultra's openings' alpha; High's texture isn't touched), and an instanced
    box per kind of opening would fill it from behind: the reveal's four sides at 123's depths (a frame
    10 cm in, its glass 14), with the bay's drawing of frame and glass on its back.
  - **What stands out:** the sill, the shutter box and a door's step as instanced boxes. 123's relief
    stays for what isn't cut (a stone frame, the slats).
  - **Reach:** like the balconies (`balconyReach`, 60 m from the open world on High), walls along a
    street, to keep the count down.
  - **One more thing to watch:** 123's relief texture's alpha carries the panes for 117's reflections.
