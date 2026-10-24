---
status: done
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
  reflects; the scorecard's round rated no lower than High's. **Not all:** the round's 33 viewpoints at
  Ultra (party-kart `shots/2026-10-24-after090/`) have the sun's shadows to 2 km (none past it: the
  hills 15 km off are past any cascade) and their corners occluded; the glass gives back the sky as
  before, not the street (117). The round's marks are the coordinator's.
- [x] A frame on the owner's PC within 16 ms at the busiest viewpoint, recorded in the budget: 9.8 ms
  at 2560 by 1440 at `falperra` (the busiest), in party-kart's `docs/architecture.md`, "Ultra's
  light"; a frame that gathers the near trees afresh, about 3–4 ms more.
- [x] High and below unchanged; `npm test` and `npm run check` pass: High the same as 081's round to
  the pixel at all 33 viewpoints, Low at 32 (`egidio-guimaraes`' 17-pixel noise); 157 of 157 and the
  check at party-kart c373c5a, on braga-map 1.37.0.

## Out of scope

- Night: 092. Each round at its photo's hour and weather: 091.

## Notes

- **The renderer (item 7): WebGL, with three's post-processing on Ultra only.** Decided by the
  session, for the owner to confirm (task 103's table). The recommendation was WebGPU on Ultra "if
  both can share the scene's materials", and they can't: the game's look is in at least 14 changes
  to three's shaders (`onBeforeCompile` hooks, `ShaderChunk` edits and `ShaderMaterial`s, in 7
  files: the land's cover, the walls' kit, the streets' layers, the trees' cards, the sky and the
  haze, the rain, the smoke and the skid marks), all WebGL's GLSL, which `WebGPURenderer`'s node
  materials don't take. Ultra on WebGPU would mean writing each again in TSL and keeping both for
  the phones' levels. three 0.186's WebGL add-ons had what this task needed (CSM, GTAOPass,
  SMAAPass).
- **Ultra's frame** (party-kart `src/render/post.ts`, `UltraFrame`, made the first time Ultra draws):
  the scene drawn into a buffer as the screen would show it (tone mapped and its haze mixed in after,
  as before), then the occlusion laid over it, then SMAA to the screen. With the occlusion off, the
  frame is 081's but for the new shadows (four viewpoints: a mean 0.8–2.1 of 255 off).
  - **Shadows in four cascades** (CSM), 4096 px each, ending 60, 200, 650 and 2,000 m off: the
    first as sharp as Ultra's one box was (3 cm a texel), each next about three times as far,
    faded into each other. The sun's bias kept the same in metres, its normal bias grown with each
    cascade's texels; the cascades turned with the sun each frame, and fitted again when the
    camera's field of view eases. Every lit material takes them before it's first drawn (the scene
    swept each frame, 814 objects in 0.1–0.4 ms).
  - **Occlusion: GTAO** from the frame's own depth, its normals worked out from that depth (a pass
    of its own for them would draw the trees' leaf cards whole: dark squares round every crown),
    1.5 m round, worked out on no more than 720 lines and laid over a bigger screen smoothed.
    It darkens under each balcony, behind the railings, the foot of the kerbs and walls, the steps,
    and inside the crowns. Eased after the first round: from the depth alone it found the crease
    between two walls too dark and its smoothing spread that over the narrow face beside it, a
    speckled band down a wall at `alvaro-carneiro`; now its deepest is eased (0.7 of it, the curve
    0.6), 24 samples, smoothed only 4 pixels round. A faint line in that crease is left. A buffer of
    the surfaces' own normals would let it go further: the reflections' task wants one too.
  - **SMAA** for the edges. Not TAA: three's `TAARenderPass` doesn't reproject, it only adds up
    frames while the camera is still, so it would smear as you drive.
- **A bug in three 0.186, found and worked round:** CSM puts its own copy of the lights' shader
  chunk in three's place for every material, and that copy is older than three's: a standard
  material's light scattered more than once (`material.dfg`) is never worked out, and the whole
  scene drew darker and duller (falperra: 54% of its pixels off by more than 24 of 255, the road and
  the trees most). Ultra's lit materials take three's own chunk with only CSM's loop over the suns
  spliced in, and three's chunks are put back; `test/post.test.ts` fails if a three upgrade changes
  either.
- **Found: the land's material is at WebGL's limit on Ultra.** With four cascades its shader samples
  16 textures, all the units the owner's card gives WebGL (ANGLE, D3D11): one more map on it (085's,
  say) fails to compile on Ultra. Seen with a fifth shadow map in a probe. Told the coordinator.
- **Not done here, as work found,** each a task's worth, drafted by the coordinator: the
  reflections (item 4), **117** (screen-space reflections on the windows, which are painted in the
  walls' texture and so need a mask of their own, on the Rio Este and on wet streets; the windows
  still give back the sky's environment as before); the light bounced (item 3), **118**; the
  volumetric haze and the clouds' shadows on the land (item 6), **119**; soft shadows that widen
  with the distance from what casts them, **120** (PCSS: the cascades filter as High's one map did).
  Screen-space contact shadows aren't one: GTAO darkens where things meet, most of what they'd add.
- **The round** `party-kart/shots/2026-10-24-after090/` (33 viewpoints at Ultra, High and Low; Ultra and
  Low at party-kart 7b3bbf7, High at 8f92e0c, whose High draws with the same code; shot in halves and
  merged): High the same as 081's round to the pixel at all 33, Low at 32 (`egidio-guimaraes` 17 pixels
  off by at most 8 of 255, the noise 081 found there). At Ultra, 0.4–4.3% of each shot's pixels off
  081's by more than 24 of 255: the shadows far off (the hillside trees past the old box shading each
  other at `falperra`, `picoto-top`, `sameiro`; the crowns near by fuller), the occlusion (under the
  balconies, the steps and the recess at `travessa-fujacal`, whose shadows are 081's to the pixel with
  it off), and SMAA's edges. All 33 looked at beside 081's, and two at 2560 by 1440 in full. One
  difference not explained: at `estadio`'s far roundabout the dashed lane lines read with more contrast
  than 081's (dark and white dashes where 081 has a faint dark line); not the occlusion (the same with
  it off) nor a shadow of the paint (it casts none).
- **The frame** (the RTX 4060 Ti; the budget in party-kart's `docs/architecture.md`, "Ultra's
  light"): at 720 pixels high 3.34–7.58 ms (median 4.84; 081's Ultra 1.36–3.44), 233–618 draw calls
  and 6.35–11.60 M triangles with the cascades' passes, 373 MB of textures (081's 181: the four
  cascades' maps). At 2560 by 1440, at most 9.8 ms (`falperra`): the cascades about 4.8 of it, the
  occlusion about 1.5 (5 when it was worked out at the screen's every pixel), SMAA 0.5. The frame
  that takes a new gather of the near trees up, every 20 m you go, measured as 081 did (drawn alone,
  the card waited on before and after), is 15.0–16.4 ms at 700 m, against 12.3 for a frame alone
  with no gather: a frame alone runs slower than frames one after another, so a gather adds 3–4 ms,
  about 13–14 ms as you drive (worked out so, not measured driving). The worst single steps 42 and
  108 ms in two runs (081: 27–56, at High too). The near trees are drawn whole into each cascade (without culling), the most of the
  cascades' cost; 089, which remakes the trees to the horizon, takes them on.
- **Landed** as party-kart c373c5a (on 102's 28bb0d6), decision 071. The round was shot on
  braga-map 1.36.0, before 088's species; its High is compared with 081's round, on the same map.
