---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-23
depends-on: [081, 082]
roadmap: Ultra · Braga at its most real
---

# 085 · Textures at their finest on Ultra

## Why

Every texture is ETC1S at quality 200, at most 2048 px (decision 030): small on a phone, but soft
and blocky on a PC's screen up close. A facade's kit at 40 px/m, a kind of ground at 1024 px and a
tree's leaves at 512 px blur when you walk up to them. Ultra should take them sharp.

## What

Today `tools/textures.mjs` makes three files per texture (`MAX` 2048): ground tiles 2048/1024/512
px, facades 40/20/10 px/m, surfaces 1024/512/256 px, trees 512/256/128 px; party-kart's
`src/render/facades.ts` draws the kit on a canvas at its level.

1. **An Ultra file per texture:** `<id>-ultra.ktx2` in Basis's **UASTC** (with RDO and zstd),
   at twice High's size: surfaces 2048 px, trees' bark and leaves 1024 px, made textures (082) at
   their finest. Decision 030's alternative, five times ETC1S's download, twice its memory: on a PC
   that's the trade the owner chose (081).
2. **Normal and roughness maps** for every made texture (setts' joints, bark, a wall's render,
   asphalt), Ultra only, so the sun's grazing light shows the relief.
3. **The facade kit** at 80 px/m on Ultra, its bays with normal maps (a window's reveal, a sill,
   a stone frame).
4. **Anisotropic filtering** at the GPU's maximum on Ultra, every texture.
5. `loadWorld` gives Ultra its files; `world.photos` (or its renamed successor after 082) lists
   them.

## Read first

- `docs/DECISIONS.md` 030; `tools/textures.mjs`; party-kart's `src/render/photos.ts`
  (`ktx2Loader`), `facades.ts`, `cover.ts`, `trees.ts`.

## Done when

- [ ] Up close on Ultra (`lobato-pavement`, `travessa-fujacal`, `capela-sao-joao`) the setts'
  joints, a wall's render and a tree's bark are sharp where High blurs them.
- [ ] The cost (download, memory) is in the budget's Ultra column; High and below unchanged.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Making the textures without photos: 082, first.
