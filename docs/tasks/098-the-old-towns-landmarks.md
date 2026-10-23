---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [099]
roadmap: Ultra · Braga at its most real
---

# 098 · The old town's landmarks at their real size

## Why

Braga is its old town: the Sé, the Arco da Porta Nova, the Praça da República and the Arcada, the
Theatro Circo, the Torre de Menagem. The map draws them as the LiDAR's blocks with a kind's
facade, or the first track's cartoon models (party-kart's `src/render/landmarks.ts`, `braga.ts`),
not to scale.

## What

Today task 021 and 056 made the landmarks the race sees as models of their own (decisions 038 and
040): measured by the LiDAR (`tools/sights.mjs`), drawn from their photos; ROADMAP's "Later" lists
the old town's, and those 021 dropped.

1. **Each one:** the Sé, the Arco da Porta Nova, the Praça da República (with the Arcada and the
   fountain), the Theatro Circo, the Torre de Menagem, the Museu D. Diogo de Sousa, the Palácio do
   Raio, the Fonte do Ídolo, the Cividade, the Capela dos Coimbras, the Congregados and the Igreja
   de Lamaçães: measured by the LiDAR (`tools/sights.mjs`: its heights, towers, roofs), modelled
   from its reference photos, textured with made textures (082), as decision 038 sets.
2. **The old town's streets** at the open world's level (099): its setts, its narrow lanes,
   its squares.
3. **Viewpoints:** one per landmark, where a reference photo was taken (decision 009).

## Read first

- `docs/DECISIONS.md` 009, 038, 040; `tools/sights.mjs`; ROADMAP "Later"; party-kart's
  `src/render/sights.ts`, `chapels.ts`, `landmarks.ts`, `braga.ts`.

## Done when

- [ ] Each landmark stands at its measured size, and its new viewpoint is shot and rated.
- [ ] The first track's cartoon models are gone.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.
