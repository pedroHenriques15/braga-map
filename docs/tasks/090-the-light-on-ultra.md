---
status: todo
priority: medium
kind: code
repo: party-kart
created: 2026-10-23
depends-on: [081]
roadmap: Ultra · Braga at its most real
---

# 090 · The light on Ultra: shadows to the horizon, light bouncing, reflections

## Why

The sun casts shadows within a 140 m box, from one 2048 px map; there's no ambient occlusion, no
light bounced off a sunlit wall into a shaded street, no reflection in a shop window or a wet
street, and the edges are as the pixel ratio leaves them (decision 037's light is matched to the
photos, but only as far as this renderer goes). These are what make a game look like a photo.

## What

Today `src/render/look.ts`: `WebGLRenderer` (three.js 0.186.1), ACES Filmic tone mapping, one
`DirectionalLight` with `PCFShadowMap` (box ±70 m, far 400), a hemisphere light, the sky's PMREM
for reflections, `FogExp2` with the fog's fragment changed for linear distance; no post-processing
(`look.ts:4` explains why bloom was left out); lamps' glows are additive halos.

1. **Cascaded shadows** on Ultra: 4 cascades out to ~2 km at 4096 px, soft (PCSS or VSM), and
   contact shadows near the camera, so a building's shadow falls across a street 500 m off.
2. **Ambient occlusion:** GTAO (or SSAO) on Ultra, so the corners, the eaves and the foot of a
   wall darken as in the photos.
3. **Light bounced:** baked irradiance probes per tile (a grid every ~10 m in the open world,
   from the sun at the game's moment), or screen-space GI, so a shaded street takes the sunlit
   facade's colour.
4. **Reflections:** screen-space reflections on glass, water (the Rio Este) and wet ground on
   `?weather=rain`, falling back to the sky's PMREM.
5. **Anti-aliasing:** TAA (or SMAA at least) on Ultra.
6. **The haze and clouds:** a volumetric haze and the clouds' shadows over the land, matched again
   to the photos of clear days (decision 037's numbers).
7. **The renderer:** decide in Notes whether this is done in WebGL with three's post-processing
   (`EffectComposer`), or by moving to three's `WebGPURenderer` with TSL, which has GTAO, SSR and
   SSGI nodes. Recommendation: WebGPU on Ultra only, WebGL for the phones' levels, if both can
   share the scene's materials; else WebGL.

## Read first

- braga-map's `docs/DECISIONS.md` 037; party-kart's `docs/architecture.md` ("Rendering"),
  `src/render/look.ts`, `src/sun.ts`.

## Done when

- [ ] Every viewpoint shot on Ultra: the shadows reach the horizon, corners are occluded, glass
  reflects; the scorecard's round rated no lower than High's.
- [ ] A frame on the owner's PC within 16 ms at the busiest viewpoint, recorded in the budget.
- [ ] High and below unchanged; `npm test` and `npm run check` pass.

## Out of scope

- Night: 092. Each round at its photo's hour and weather: 091.
