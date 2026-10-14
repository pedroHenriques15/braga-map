---
status: todo
priority: medium
kind: code
repo: party-kart
created: 2026-10-14
depends-on: []
roadmap: Phase 1 · See it
---

# 031 · Medium's textures back inside the budget

## Why

The city's budget (task 004, decision 013, party-kart's `docs/architecture.md`) lets Medium hold
60 MB of textures: what the friends' phones already ran, rounded up. Since tasks 028–030 (the
friends' cars, their eggs, the Tourigalo) the city holds 61 MB on Medium, so the phones that
start on Medium (every phone does) hold more than they were known to run. High (94 of 95 MB) and
Low (45 of 45) are inside theirs.

## What

Measured on 2026-10-14 (task 010's notes): party-kart `8946d3d` on braga-map 1.3.0, all 29
viewpoints with `node scripts/shots.mjs <label> --medium`, gives 94, 61 and 45 MB on High, Medium
and Low; the budget round (`2026-10-13-budget`, `ac47bf0` on 1.2.0) gave 91, 57 and 42 MB. Task 010
added none. The textures are counted as `src/stats.ts`'s `textureBytes` counts them: four bytes a
pixel, a third more for mipmaps.

Steps:

1. List what came in with tasks 028–030 (`git log ac47bf0..8946d3d` in party-kart): each new
   canvas texture, its size, and the levels it's made on. `window.__scene` with `?scenery` can list
   the scene's textures and their sizes.
2. Bring Medium to 60 MB or under without changing what High shows: make those textures smaller on
   Medium (as the ground's painted map already is, 22 MB on Medium against 44 on High), or share one
   where two are alike. Shoot the viewpoints again at all three levels.
3. If nothing can go without a visible loss, the other way decision 013 allows: measure the slowest
   friend's phone on Medium (task 004's steps) and raise the budget to what it holds with room to
   spare.

## Done when

- [ ] Every viewpoint holds 60 MB of textures or less on Medium, and High and Low stay inside
  theirs (`stats.json` of a new round).
- [ ] party-kart's `npm test` and `npm run check` pass, and its `docs/architecture.md` has the new
  figures.

## Out of scope

- The triangles, draw calls and download, which are inside the budget (task 010's notes).

## Notes

- Found while finishing the budget's check for task 010.
