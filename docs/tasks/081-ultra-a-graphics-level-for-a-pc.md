---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 081 · Ultra: a graphics level for a PC, above High

## Why

The owner wants Braga at the absolute best quality in every aspect (2026-10-23), and the friends'
phones can't hold it. The owner's answer: a fourth graphics level, **Ultra**, for a PC only, where
everything the "Ultra" tasks add goes; High, Medium and Low stay as they are, so the phones still
play. This task makes the level and the place each later task hangs its detail on.

## What

Today `src/render/look.ts:9` has `type Quality = 'high' | 'medium' | 'low'`, and `setQuality`
(`look.ts:206`) sets the pixel ratio (2, 1.25, 1), the sun's shadow map (2048, 1024, none, one
`DirectionalLight` with a 140 m box and `PCFShadowMap`) and recompiles the materials. The player
picks the level in `src/settingsScreen.ts` and it's kept as `pk-quality` (`src/prefs.ts`);
`watchSpeed` in `src/main.ts` steps it down when a race runs slowly. braga-map's textures come in a
file per level (`world/textures/<tile>/<id>-<level>.ktx2`, decision 030) and the trees' near
distance is per level (260, 180, 120 m, `src/render/trees.ts`).

1. Add `'ultra'` to `Quality`, above `'high'`, everywhere a level is switched on (`grep -rn
   "'high'" src`): until a later task gives it its own, Ultra takes High's value.
2. Ultra's own, in this task: the device's full pixel ratio (no cap at 2), the sun's shadow map at
   4096, and the trees' near distance and the haze's far plane at the most the city holds without
   a frame over 16 ms on the owner's PC.
3. **Only offered on a PC:** Ultra is in the menu when the device isn't touch-first and WebGL
   reports a discrete GPU or `MAX_TEXTURE_SIZE` ≥ 16384; `watchSpeed` may step Ultra down to High,
   never up to it. `?quality=ultra` forces it for `scripts/shots.mjs`.
4. **Shots:** `scripts/shots.mjs` takes `--ultra`, and rounds from now on are shot at Ultra and
   Low (Ultra is what "as real as it gets" means; Low is what a phone sees).
5. **The budget:** add an Ultra column to party-kart's `docs/architecture.md` "The city's budget",
   measured on the owner's PC: draw calls, triangles, textures' memory, download, frame time.
6. braga-map: textures and the tiles keep three levels until a task gives Ultra files of its own
   (085); `loadWorld`'s level argument accepts `'ultra'` and falls back to `'high'`.

## Read first

- party-kart's `docs/architecture.md` ("Rendering", "The city's budget"), `src/render/look.ts`,
  `src/settingsScreen.ts`, `src/prefs.ts`, `src/main.ts` (`watchSpeed`), `scripts/shots.mjs`.
- braga-map's `docs/DECISIONS.md` 013 and 017 (the budget is a guide), 030 (a file per level).

## Done when

- [ ] On the owner's PC the menu offers Ultra; on a phone (or Chromium's touch emulation) it
  doesn't.
- [ ] `?quality=ultra` shoots every viewpoint with no page error, and the budget has its Ultra
  column.
- [ ] High, Medium and Low draw the same shots as before (every viewpoint unchanged).
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- What Ultra draws beyond High's: tasks 083–101 each add theirs.

## Notes

- The owner's answer (2026-10-23): "Nível Ultra, só PC". When this task is finished it becomes a
  DECISIONS.md entry: everything past what a phone holds goes to Ultra, and the budget (decision
  013) keeps its three phone levels.
