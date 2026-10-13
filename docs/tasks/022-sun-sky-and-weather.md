---
status: todo
priority: medium
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [002]
roadmap: Phase 4 · Street furniture, landmarks and light
---

# 022 · Braga's light: the real sun, the sky and the haze, and its weather

## Why

The light decides whether a photo and a screenshot feel like the same place. Today the sun is
fixed, the haze is one colour, and there are no clouds. Braga's light has its own look: a low
sun on granite, a green haze on the hills, often a grey sky, and rain. Matching the photos'
light is cheap and helps every viewpoint at once.

## What

Paths in this task are party-kart's (`../party-kart/`), unless they start with `../braga-map/`.

Today (`src/render/look.ts`): `SUN_DIR` is (−0.62, 0.46, 0.74), about 25° up and 40° west of
south (the comment at `:9` says west-south-west, which doesn't match). `Sky` has turbidity 7,
rayleigh 1.9 and mie 0.006. Fog is `FogExp2` #e7d6bf at 0.00022. There are no clouds. The
knobs are `?exp ?sun ?hemi ?env ?fog`; none sets the sun's direction or the time.

1. **The sun's real position:** compute it for Braga (41.55° N, 8.42° W) from a date and time,
   and add `?time=2026-10-13T17:30` to set it, with today's look as the default time. Fix the
   comment.
2. **Match the photos:** for 3–4 viewpoints whose photos were taken on a clear afternoon, set
   the time to the photo's and tune the sky, the haze's colour and density, and the exposure
   until the two read the same. Then check the far viewpoints: Bom Jesus and the Sameiro
   through the haze (decision 004 keeps them at twice their size).
3. **Clouds:** a cloud layer (a scrolling texture on a dome is enough), off by default, with a
   "grey Minho day" preset: an overcast sky, soft shadows, a wet look on the road.
4. **Rain** (later in the task, if the budget allows): falling streaks near the camera, wet
   reflections on the asphalt, the wipers' sound.

## Read first

- `src/render/look.ts`, `src/main.ts` (the frame loop), `docs/architecture.md`.

## Done when

- [ ] `?time=` sets the sun, and the default matches the photos' afternoon.
- [ ] The skyline viewpoints and three street viewpoints score higher than at the baseline.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- Night: "Later" in the roadmap.

## Notes
