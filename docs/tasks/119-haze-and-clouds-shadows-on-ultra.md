---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [090]
roadmap: Ultra · Braga at its most real
---

# 119 · On Ultra, a volumetric haze and the clouds' shadows on the land

## Why

The haze is the fog's colour by distance (decision 037), and the clouds drawn in the sky cast
nothing: from the Picoto or Bom Jesus the land is evenly lit under a sky with cumulus in it.

## What

1. The clouds' shadows: the sky's cloud layer projected onto the land and the city on Ultra, moving
   with the clouds (held at time 0 for `?scenery`).
2. A volumetric haze on Ultra, matched again to the photos of clear days (decision 037's numbers).
3. Shoot the far views at Ultra.

## Read first

- party-kart's `src/render/look.ts`, `src/render/post.ts`, `src/sun.ts`; decision 037.

## Done when

- [ ] From `picoto-top`, `bom-jesus`, `sameiro` and `falperra` on Ultra, cloud shadows on the land
  and the haze with depth, rated no lower.
- [ ] High and below unchanged; `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 090 (2026-10-24), drafted by the coordinator.
