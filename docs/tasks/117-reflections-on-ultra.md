---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [090]
roadmap: Ultra · Braga at its most real
---

# 117 · On Ultra, reflections: the windows, the Rio Este and the wet streets

## Why

Since task 090 Ultra has cascaded shadows, ambient occlusion and SMAA, but nothing reflects but the
sky's environment map: a shop window, the river and a street on `?weather=rain` show no city in
them. Task 090 left reflections out as a task's worth of its own.

## What

Today (party-kart after 090): `src/render/post.ts`'s `UltraFrame` draws Ultra through a buffer with
GTAO and SMAA; the facades' windows are painted in the facade texture (`src/render/facades.ts`), so a
reflection needs a mask of where the glass is; the river is one water mesh (`src/render/city.ts`).

1. A buffer of the surfaces' normals and a mask of what reflects (glass, water, wet ground), shared
   with GTAO where it can be.
2. Screen-space reflections on Ultra for those, falling back to the sky's PMREM off the screen.
3. The windows' glass marked in the facade kit (a channel or a second texture), so only glass reflects.
4. Shoot the viewpoints with windows or the river in view at Ultra; measure the frame.

## Read first

- party-kart's `src/render/post.ts`, `src/render/look.ts`, `src/render/facades.ts`; task 090's Notes.

## Done when

- [ ] On Ultra the shop windows, the Rio Este and the wet streets reflect the city (`capela-sao-joao`,
  `sao-joao-da-ponte`, `conselheiro-lobato`, and one on `?weather=rain`), rated no lower.
- [ ] A frame within 16 ms at the busiest viewpoint on the owner's PC; High and below unchanged.
- [ ] `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 090 (2026-10-24), drafted by the coordinator.
