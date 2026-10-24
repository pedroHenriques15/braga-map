---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [090]
roadmap: Ultra · Braga at its most real
---

# 118 · On Ultra, the light bounced: a shaded street takes the sunlit facade's colour

## Why

Ultra's light since task 090 is the sun's, its shadows and the sky's: a street in shadow is lit only
by the sky, never by the sunlit wall across it, which in Braga's narrow streets is much of the light.

## What

1. Choose: baked irradiance probes per tile (a grid every ~10 m in the open world, from the sun at the
   game's moment) or screen-space GI on Ultra; record why in Notes.
2. Light the shaded surfaces with it on Ultra only.
3. Shoot the narrow streets' viewpoints at Ultra; measure the frame and the build.

## Read first

- party-kart's `src/render/post.ts`, `src/render/look.ts`; decision 037; task 090's Notes.

## Done when

- [ ] On Ultra a shaded street takes the colour of the sunlit facades round it (`travessa-fujacal`,
  `travessa-lobato`, `conselheiro-lobato`), rated no lower.
- [ ] A frame within 16 ms; High and below unchanged; `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 090 (2026-10-24), drafted by the coordinator.
