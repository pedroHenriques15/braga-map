---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [090]
roadmap: Ultra · Braga at its most real
---

# 120 · On Ultra, shadows that soften with distance from what casts them

## Why

Task 090's cascaded shadows are filtered evenly: a lamp post's shadow is as sharp at its tip as at
its foot, where a real one blurs with the distance from the post (the sun's disc).

## What

1. Percentage-closer soft shadows (PCSS) or the like on Ultra's cascades, the penumbra widening with
   the distance from the caster.
2. Shoot the viewpoints with long shadows at Ultra; measure the frame.

## Read first

- party-kart's `src/render/post.ts` (the cascades); task 090's Notes.

## Done when

- [ ] On Ultra the shadows soften with distance (`fujacal-start`, `alameda-fujacal`), rated no lower.
- [ ] A frame within 16 ms; High and below unchanged; `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 090 (2026-10-24), drafted by the coordinator.
