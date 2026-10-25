---
status: doing
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [088]
roadmap: Ultra · Braga at its most real
---

# 093 · The seasons: bare trees in winter, the jacarandas in flower in June

## Why

The trees are always in summer leaf, tinted to Braga's summer green, and the lawns as the July
orthophoto has them (task 068). Yet the game's default is 13 March (decision 037), when the
avenues' planes and limes are bare. The date the game is set at should show.

## What

Today braga-map's `tools/trees.mjs:401` marks each kind evergreen or not (decision 051) and
nothing reads it; party-kart's `src/render/trees.ts` tints every kind's leaves one summer green;
`src/sun.ts` knows the date (`?time=`).

1. **By the date:** each deciduous kind's leaves follow its year: bare (branches only, 089's limbs),
   budding, in leaf, turning (each kind its autumn colour), falling; the dates for Braga from a
   phenology source (research, recorded in `docs/SOURCES.md`).
2. **Flowering:** the jacarandas (June, violet), the cherries and magnolias (March), the
   camellias (winter), each where 088 names its species.
3. **The ground:** fallen leaves under the deciduous trees in autumn; the lawns' green by the month
   (task 068 is March's).
4. The default stays 13 March: the planes bare, as the photos of that date show.
5. **On Ultra only** (the owner, 2026-10-24): High, Medium and Low stay in summer leaf, as now, so a
   phone sees no change. The rounds, shot at Ultra at each photo's moment (091), show each photo's
   season.

## Questions

- [x] Where do the seasons show: on Ultra only, High and below staying in summer leaf; or on every
  level, the default game's planes bare for everyone? Recommendation: Ultra only (081: what a
  phone can't hold goes to Ultra).
  > Ultra only (the owner, 2026-10-24).

## Read first

- `docs/DECISIONS.md` 037, 043, 051; task 068; `tools/trees.mjs`; party-kart's
  `src/render/trees.ts`, `src/sun.ts`.

## Done when

- [ ] On Ultra, at `?time=` in January, March, June and October, the avenues' trees look as Braga's do then
  (`31-de-janeiro`, `liberdade`, `capela-sao-joao`, `porfirio-da-silva`), each set beside a reference
  photo of that season.
- [ ] High, Medium and Low unchanged (every viewpoint the same at those levels).
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- The species: 088.
