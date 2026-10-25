---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-25
depends-on: [093]
roadmap: Ultra · Braga at its most real
---

# 130 · The trees whose year isn't a broadleaf's: the evergreen broadleaves, the Judas trees, the acacias

## Why

Task 093 gives each deciduous kind its year on Ultra (bare, budding, in leaf, turning, falling). But a
tree reaches the game as its kind, not its species (decision 070: "a kind is a look to draw"), and the
species 088 saw that don't keep a broadleaf's year are drawn as "broadleaf": the photos' few evergreen
broadleaves (4, and an oleander) would go bare in winter, the Judas trees (6) wouldn't flower pink in
spring, and COS2025's acacia woods (about 45 ha, evergreen, yellow in flower in February and March)
would go bare with them (worker-1, task 093, 2026-10-25).

## What

1. New kinds in `tools/trees.mjs`'s `KINDS` for what's drawn differently through the year: an
   evergreen broadleaf, the Judas tree and the acacia, each with its leaves and bark (`refs/textures.json`,
   toned, as 070's three were) and its entry in `EVERGREEN`. The tiles hold a tree's kind in 4 bits
   (16 kinds, 9 used): no change of format. Each species to its kind in `kindOf` (088's photos, the
   acacia woods from COS2025's class).
2. `npm run world`; a version.
3. party-kart draws each new kind (its shape, as 070's three) on every level, and 093's year on Ultra:
   the Judas trees in flower in spring, the acacias yellow in February and March, the evergreens in leaf
   all year.
4. Shoot at Ultra in March where they stand; measure the frame.

## Read first

- `tools/trees.mjs` (`KINDS`, `EVERGREEN`, `kindOf`), `refs/trees.json`, `refs/textures.json`; decisions
  051 and 070; task 093's Notes (its phenology table); party-kart's `src/render/trees.ts`.

## Done when

- [ ] The Judas trees, the evergreen broadleaves and the acacia woods are kinds of their own in the
  tiles; `npm test` checks each species seen is its kind.
- [ ] On Ultra at `?time=` in March, the acacias in flower and the Judas trees budding, the evergreens
  in leaf, beside reference photos of that season; rated no lower.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Notes

- Found by worker-1 in task 093 (2026-10-25), drafted by the coordinator. worker-1 proposed carrying a
  tree's species into the tiles (a format change); the kind field's 7 free values do it without one, as
  decision 070's "a kind is a look to draw" has it.
