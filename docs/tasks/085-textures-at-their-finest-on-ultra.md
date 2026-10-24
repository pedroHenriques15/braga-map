---
status: doing
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

1. **An Ultra file per texture:** `<id>-ultra.ktx2` at twice High's size, made at that size:
   surfaces 2048 px, trees' bark and leaves 1024 px, made textures (082) at their finest. In ETC1S
   as the others, unless UASTC's colour (five times ETC1S's download, decision 030's alternative) is
   plainly sharper at the three viewpoints below (the coordinator's answer, 2026-10-24: Ultra's
   download was the owner's choice in 081, not some 100 MB more of braga-map's history each time the
   textures are made; UASTC for everything, as first written, came to about 100 MB).
2. **The relief:** a normal map (UASTC, RDO, Zstandard) for each kind of ground and each bark, and
   the bark's roughness as a map (half size, ETC1S); each kind of ground's roughness a number, blended
   by the cover's weights as its colour is. Not a roughness map for the ground: WebGL gives a
   fragment shader 16 textures, and the land's took 11 plus the sun's shadows (16 on Ultra with 090's
   four cascades), so the six kinds' textures go into one array texture and their normal maps into
   another.
3. **Anisotropic filtering** at the GPU's maximum on Ultra, every texture.
4. `loadWorld` gives Ultra its files (`groundKinds`' and `treeKinds`' textures' `ultra`).
5. **The streets' own drawings** (party-kart's `streets.ts` `layers()`, which the setts and the calçada
   up close at the three viewpoints are, not the map's textures) made at 1024 px on Ultra, each drawn
   4× finer, not scaled up (the coordinator's answer, 2026-10-24).

The facade kit at 80 px/m on Ultra with its bays' normal maps (a window's reveal, a sill, a stone
frame), first a step of this task, is a task of its own (the coordinator's, 2026-10-24).

## Read first

- `docs/DECISIONS.md` 030; `tools/textures.mjs`; party-kart's `src/render/photos.ts`
  (`ktx2Loader`), `facades.ts`, `cover.ts`, `trees.ts`.

## Done when

- [ ] Up close on Ultra (`lobato-pavement`, `travessa-fujacal`, `capela-sao-joao`) the setts'
  joints and a tree's bark are sharp where High blurs them (a wall's render is the facade kit's
  task).
- [ ] The cost (download, memory) is in the budget's Ultra column; High and below unchanged.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Making the textures without photos: 082, first.
- The facade kit at 80 px/m and its normal maps: its own task.

## Notes

- **The size** (2026-10-24, 085's question to the coordinator): made as first written (UASTC with RDO 1
  for every texture, a normal and a roughness map for each ground and bark, all at twice High's size) a
  kind of ground came to about 10 MB, 48× High's, about 100 MB over the 24 textures, and again in the
  history each time they're made. Measured on the setts at 2048 px: ETC1S 762 KB; UASTC with Zstandard
  4.1 MB without RDO, 3.5 MB at RDO 1, 2.8 at RDO 3, 2.6 at RDO 5. The coordinator chose the ~40 MB way
  (the colour in ETC1S, the normal map alone in UASTC at RDO 3, the roughness at half size in ETC1S)
  unless the ~60 MB way (the colour in UASTC too) was plainly sharper: shot side by side, it isn't (the
  same to the eye on the land's setts and the bark at `capela-sao-joao`, 0.5 of 255 apart on average
  there, 0.02–0.04 at the other two). Made: 48 files, 44 MB, the ground's normal maps 29 MB of it;
  `node tools/textures.mjs` takes about ten minutes, so it ran in two parts (the trees, then the
  grounds made before), each under ten minutes.
- **The ground's roughness a number, not a map:** WebGL gives a fragment shader 16 textures; the land's
  sampled 11 plus the sun's shadows, 16 on Ultra with 090's four cascades. In party-kart, on Ultra, the six kinds'
  textures are one array texture (`cover.ts`'s `stack`) and their normal maps another: the land's
  shader samples 12 of 16 there (counted in Chromium on the owner's card, each program's samplers).
  Below Ultra they're six textures as before (the coordinator's, 2026-10-24: see the next notes). A first roughness of 0.7 for the setts let the
  sky's light wash their joints pale; the kinds' are near the land's 0.96 now (0.9 to 0.96).
- **Found: the setts the three viewpoints show up close aren't the map's.** The streets, their
  pavements and the steps are party-kart's own drawings (`streets.ts`'s `layers()`: 16 canvases at
  256 px, a sett's tile 2 m, so 1.3 cm a pixel), and the map's textures draw only the land beside them:
  the square at `capela-sao-joao`, a verge. The coordinator added them to 085 (step 5): on Ultra each
  drawing is made 4× finer (`textures.ts`'s `finer`: the canvas scaled, so its shapes are drawn at 1024
  px, not the 256 px drawing scaled up).
- **High and below unchanged:** High's, Medium's and Low's files are byte for byte as they were (the
  tool makes them as before; `git status` shows none changed). In the game, High and Low draw the same
  calls, triangles and texture memory as main at the three viewpoints, and the land the same to the
  pixel; but with the six kinds' textures one array at every level, as first made, the streets' and the
  windows' canvas textures were another draw of their noise: the shots seed `Math.random`
  (`?scenery`), three.js takes four of its numbers for every object it makes, and the array was one
  object more on High, so every canvas drawn after it took its noise from further along the sequence
  (two rounds of the same code match to the pixel). So the array is Ultra's alone, and High and Low,
  shot again against main's, are the same to the pixel: 0 bytes of 8.3 million differ at High and at Low
  (main's `before085c` and the branch's `after085c`, both on braga-map 1.38.0's world). The land's shader
  samples 13 textures on High, as before, and 12 on Low.
