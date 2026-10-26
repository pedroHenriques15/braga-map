---
status: done
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

- [x] On Ultra the shop windows, the Rio Este and the wet streets reflect the city (`capela-sao-joao`,
  `sao-joao-da-ponte`, `conselheiro-lobato`, and one on `?weather=rain`), rated no lower (the round
  `2026-10-26-after117`, all 33 at Ultra and Low, against `2026-10-26-before117` on main 1.46.0 from a
  fresh worktree; and those three in the rain, `after117rain` against `before117rain`: no mark moved,
  mean 2.64, the coordinator's marks, `.cache/scorecard/marks/2026-10-26-after117.json`. Dry, the panes
  reflect faintly, as glass does straight on; in the rain the streets give back the buildings, the
  lamps and the statue. No viewpoint sees the Rio Este: worker-1 probed two cameras over it).
- [x] A frame within 16 ms at the busiest viewpoint on the owner's PC; High and below unchanged
  (`falperra`, the busiest at Ultra, at 1920 by 1440: 9.81-9.85 ms against main's 9.74-9.78, two runs
  each, alternating; `conselheiro-lobato` in the rain 6.64-6.65 against 6.19-6.24; one draw call more.
  High and Low byte-identical in `after117high` against `before117high`, three views, and Low in all 33).
- [x] `npm test` and `npm run check` pass (170/170 on braga-map 1.46.0).

## Notes

- Found by worker-1 in task 090 (2026-10-24), drafted by the coordinator.
- 2026-10-25, worker-1 (party-kart `b7a94b1`, `465a49b`): the reflection pass after 132's resolve in
  `UltraFrame`, reading the resolved frame and writing into the occlusion's buffer, done with by then;
  a material that reflects says how strongly in the frame's alpha (`post.ts`'s `reflects`). The Rio
  Este reflects fully; a wet street (`?weather=grey` or `rain`) 0.6 and its paint 0.5, spread 0.04 of
  the way (mirror-sharp, the road read as flooded). Decided by the session, for the owner to confirm
  (task 103). Its timings then were taken beside the owner's game and are void.
- 2026-10-26, the coordinator: **landed** while worker-1 was idle (the owner: "finish it"), rebased
  on main 1.46.0. The glass: in the walls' shader on Ultra, the relief texture's alpha (123's panes'
  mark, a fraction far off where it's mipmapped) to `reflects` (`facades.ts`). `scripts/shots.mjs
  --weather=grey|rain` for a round on a grey day or in the rain. The rounds above; the timings at
  1920 by 1440 with an uncommitted copy of `shots.mjs` 1,440 px high, deleted after. The before
  round's first nine views have pictures but no frame times (a run of the round writes its
  `stats.json` afresh; the chunks after were kept and merged). Not verified: Medium, a phone, a
  race on Ultra in the rain, the Rio Este in a round.
