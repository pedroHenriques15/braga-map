---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [002]
roadmap: Phase 1 · See it
---

# 004 · The budget: how much city a phone can draw

## Why

Realism adds geometry and, with photo textures allowed (decision 002), many megabytes of
images. The game already plays on phones, and it drops a quality level when a race runs under
35 fps for 6 s (`src/main.ts:1107-1116`). Nothing says how much the city may cost, so every
realism task would add a little until the game stutters. A written budget, measured at the
viewpoints, says how much each task may spend and when to add level of detail.

## What

Paths in this task are party-kart's (`../party-kart/`), unless they start with `../braga-map/`.

Today, from reading the code (nothing was measured):

- `buildCity` runs once at page load (`src/main.ts:51`). Lowering the quality later changes
  only the lighting (`look.setQuality`), not the trees or the ground.
- The buildings are merged into 7 meshes, so the whole city is drawn every frame: there's no
  level of detail and no culling of buildings. Trees are culled per 800 m tile
  (`src/render/trees.ts`).
- Estimated on High: about 0.4 M triangles of trees, 173 k of ground (a 10 m grid over
  3.3 × 2.6 km), 100–150 k of road and kerbs. Draw calls aren't recorded anywhere.
- The far plane is 30 km. Shadows cover about 140 m round the kart.

Steps:

1. **Measure** with task 002's script, at every viewpoint, on High, Medium and Low: draw calls,
   triangles, texture memory, the time to build the city, and frame time. Measure the download
   too: the JS and data the game fetches before the race (DevTools or Playwright's network log).
2. **Measure on a real phone,** the slowest the friends play on: the frame rate on the start
   straight and in the busiest viewpoint, and the load time on 4G. (The owner runs this, with
   the steps written here.)
3. **Write the budget** in party-kart's `docs/architecture.md`, a section "The city's budget":
   per quality tier, the most draw calls, triangles, texture memory and download the city may
   take, from what the phone managed with room to spare.
4. **Say where the budget runs out first** and what would buy room, in Notes: level of detail
   for buildings, culling by tile, loading only the tiles near the kart (braga-map's
   `loadWorld` loads by tile), rebuilding the city when the quality drops, compressed textures.
   Draft a task for the first one that's needed.

## Questions

- [ ] Which phone is the floor: the slowest one a friend races on?
  > 

## Read first

- `../party-kart/src/main.ts`: `buildCity`, the quality step-down, `__kart`.
- `../party-kart/src/render/city.ts`, `trees.ts`, `look.ts`.
- `../party-kart/docs/architecture.md`: "few draw calls".

## Done when

- [ ] The baseline is measured at every viewpoint and tier, and kept with task 002's baseline
  round.
- [ ] The budget is written in party-kart's `docs/architecture.md`.
- [ ] The phone's numbers are recorded in Notes.

## Out of scope

- Adding level of detail or streaming: a task of its own, once the budget shows it's needed.
- The textures' format and loading: task 007.

## Notes

- From task 009 (2026-10-13, measured in the browser, not on a phone): the land and the verges
  beside the road, in triangles, went from 173k to 352k on High, 173k to 317k on Medium and 43k
  to 117k on Low; the start view from 885k to 1,065k on High. The city builds about 0.6 s slower.
  The track's 48 tiles are 4.1 MB (1.2 MB gzipped), with the ground every 2 m on 18 of them. The
  land's detail near the road (`band` and `tol` in `city.ts`) is the first thing to trade.
