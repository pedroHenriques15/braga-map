---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [001]
roadmap: Phase 1 · See it
---

# 002 · A script that shoots every viewpoint in the game

## Why

Each task that changes the city has to show whether the city got closer to Braga, before and
after, at the same viewpoints (decision 005). Doing that by hand in a browser is slow and never
the same twice. A script that opens the game at each viewpoint and saves a screenshot makes
every round comparable, and records the frame's cost alongside.

## What

Paths in this task are party-kart's (`../party-kart/`), unless they start with `../braga-map/`.

Today party-kart has `?view=x,y,z,tx,ty,tz`, which holds the race's chase camera
(`src/main.ts:30` and `:1071-1074`), so it only applies once a race runs. `?autodrive` exposes
`window.__kart` with `calls` and `tris` (`src/main.ts:1135`). The graphics quality is kept in
`localStorage['pk-quality']` (`src/main.ts:50`). A race needs a room, which goes through
PeerJS's public server, so it needs the internet. There are no Playwright scripts (`scripts/`
holds only `deploy.sh`).

1. **Reach a still scene without a race,** if a race can't be started without the network or
   takes too long: add `?scenery` to `src/main.ts`, which builds the city as a race would
   (`buildCity`), skips the menus, the room and the cars, and renders from `?view=` alone.
   Keep it out of the normal game's path.
2. **Write `scripts/shots.mjs`** (Playwright, as a dev dependency). It starts `npm run dev` or
   uses a running one, reads `../braga-map/refs/viewpoints.json` (task 001), and for each
   viewpoint and each quality (`high`, `low`) opens `?scenery&view=…`, waits until the city is
   built and two frames have drawn, and saves `shots/<round>/<quality>/<id>.png` at 1280 × 720.
   `<round>` is a date and a short label (`2026-10-14-baseline`).
3. **Record the frame's cost** for each shot in `shots/<round>/stats.json`: draw calls,
   triangles, textures and geometries (`renderer.info`), the time to build the city, and the
   frame time over 60 frames. Expose them as `window.__kart` does.
4. **A side-by-side sheet:** `shots/<round>/index.html` shows each viewpoint's real photo (from
   `.cache/refs/`), its shot, and the previous round's shot, so a person can see the change
   at a glance. The scorecard (task 003) takes the same files.
5. `shots/` is ignored by git. Document the command in party-kart's `CLAUDE.md`, under
   "Trying it in a browser".

## Read first

- `../party-kart/CLAUDE.md`: "Trying it in a browser", and "The two halves".
- `../party-kart/src/main.ts`: `VIEW`, `AUTODRIVE`, `buildCity`, the frame loop.
- `../party-kart/src/render/look.ts`: the quality tiers.
- `../braga-map/refs/viewpoints.json` (task 001).

## Done when

- [ ] `node scripts/shots.mjs baseline` in party-kart writes a PNG for every viewpoint at High
  and Low, and `stats.json`, without the network and without a person.
- [ ] Two runs on an unchanged tree give the same pictures (the same scene, no moving cars or
  random placement), checked by comparing a few pixels' colours.
- [ ] The baseline round is shot and kept, as the "before" for every later task.
- [ ] `npm test` and `npm run check` pass in party-kart.

## Out of scope

- Rating the shots: task 003.
- Setting the budget's numbers: task 004.

## Notes
