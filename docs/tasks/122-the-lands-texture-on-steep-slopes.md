---
status: todo
priority: medium
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [111]
roadmap: Phase 3 · Surfaces and colours
---

# 122 · The land's texture isn't stretched on a steep slope

## Why

Since task 111 the land steps at a retaining wall's foot, and where it rises steeply behind a kerb
its ground texture is stretched into pale stripes down the slope (at `alvaro-carneiro`, behind the
right kerb): the land's textures are laid from above (by x and z), so a near-vertical face takes one
texel's row along its whole height.

## What

1. Find where the land's faces are steeper than, say, 45° in the open world.
2. Lay the ground's textures on those by their slope (a triplanar or side projection blended in by
   the face's normal) in party-kart's land shader (`src/render/city.ts`'s ground material), within
   WebGL's 16 texture units (task 090 found that material at 16 on Ultra).
3. Shoot `alvaro-carneiro` and the viewpoints with steep land in view.

## Read first

- party-kart's `src/render/city.ts` (`coverShader`, the ground material); task 111's Notes; task
  090's Notes (the texture units).

## Done when

- [ ] No stretched stripes on the land's steep faces (`alvaro-carneiro` before and after), rated no
  lower.
- [ ] `npm test` and `npm run check` pass; the budget measured.

## Notes

- Found by the coordinator marking task 111's round (2026-10-24).
