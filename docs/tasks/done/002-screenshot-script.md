---
status: done
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

- [x] `node scripts/shots.mjs baseline` in party-kart writes a PNG for every viewpoint at High
  and Low, and `stats.json`, without the network and without a person.
  > "58 shots in 103 s", each with its draw calls, triangles, textures, geometries, build time and
  > frame time in `stats.json`. Every request off its own dev server is refused, and none was made.
- [x] Two runs on an unchanged tree give the same pictures (the same scene, no moving cars or
  random placement), checked by comparing a few pixels' colours.
  > Compared whole files rather than a few pixels: three full runs (two before the commit, one on
  > `ac47bf0`) gave 58 PNGs identical byte for byte (`cmp`). With `Math.random` left unseeded,
  > two shots of `devesa` differed.
- [x] The baseline round is shot and kept, as the "before" for every later task.
  > `../party-kart/shots/2026-10-13-baseline/` (24 MB, ignored by git as the task asked), shot on
  > party-kart `ac47bf0` and braga-map v1.2.0; it can be shot again from that commit.
- [x] `npm test` and `npm run check` pass in party-kart.
  > 19 of 19 and `tsc` clean on `ac47bf0`; braga-map's `npm test` 16 of 16.

## Out of scope

- Rating the shots: task 003.
- Setting the budget's numbers: task 004.

## Notes

- From task 001 (2026-10-13): `?view=` sets the camera's position and aim but not its field of
  view, which stays at the camera's 68° (vertical). Each viewpoint's `fov` is its photo's vertical
  field of view (33–60°), so a shot should set `camera.fov` from it, and take the photo's shape
  (a phone's 4:3, a panorama's cut 16:9, or 20:9), or be cropped to it. Starting a race alone, then
  waiting 6 s, gave a still scene from `?view=` in about 8 s a viewpoint (Playwright, Chromium
  headless with `--use-angle=d3d11`); the HUD and the race's own banners are in the shot.
- **Done on 2026-10-13,** in party-kart `ac47bf0`:
  - `?scenery` in `src/main.ts` builds the city with `buildCity`, as a race does, and draws it from
    `?view=`, with no menus, room, karts or warm-up of the karts' materials. It seeds
    `Math.random` (the textures' noise is drawn with it, so two loads differ otherwise: checked by
    turning the seed off, which gave different PNGs), holds the city at 0 s (`world.update(0)`, so
    the lights and the water stand still), skips the eggs' update, and keeps the sun's shadows
    round the spot 8 m in front of the camera, where the kart would be in a race. Without `?view=`
    it looks at the start line. The normal game's path is unchanged (its home screen checked in
    Playwright: no errors, no `__kart`).
  - `?view=` takes a seventh number, the vertical field of view, in a race too.
  - `window.__kart` in `?scenery`: `frames`, `buildMs` (loading the tiles and building),
    `calls`, `tris`, `textures` and `geometries` (counts from `renderer.info`), and
    `timeFrames(n)`, the milliseconds a frame takes over n frames drawn back to back.
  - `scripts/shots.mjs` with Playwright 1.63.0 (a dev dependency; it uses the Chromium already
    installed for 1.63). 58 shots in 103 s.
- **Where it differs from "What":**
  - A shot isn't 1280 × 720: it's its photo's shape, 720 pixels high (960 × 720 for a phone's
    4:3, 1280 × 720 for a panorama's 16:9 cut, 1600 × 720 for `lobato-pavement`'s 20:9), so the
    shot and the photo frame the same view at the photo's field of view. The shape is read from
    the photo in `../braga-map/.cache/refs/`; without it, 16:9.
  - It never uses a running dev server: it starts its own on a free port. The one on :5173 when
    this ran had been started that morning, before braga-map v1.2.0 was installed, and served the
    old route (no road at `devesa`); Vite doesn't watch `node_modules`.
  - The frame time isn't 60 frames' rAF intervals: each frame waited for separately was mostly
    the wait (Low came out slower than High, 2–8 ms). It's 60 frames drawn back to back with one
    wait at the end, the middle of three runs.
  - Everything off the dev server is refused during a shot: nothing was asked for, so the shots
    need no network.
- **The baseline's cost** (RTX 4060 Ti, headless Chromium through D3D11, 1 pixel per pixel):
  High 48–190 draw calls, 0.76–1.07 M triangles, 25–43 textures, the city built in 1.3–1.4 s;
  Low 33–173 calls, 0.42–0.53 M triangles, 0.7–0.8 s. Frames take 0.2–2.5 ms, give or take
  about 1 ms between runs.
- Checked by eye: `fujacal-start`, `liberdade` and `sameiro` frame the same street and horizon
  as their photos, and the sheet shows each photo with its credit beside the shots. Not checked:
  the other 26 against their photos one by one (task 001 checked all 29 from a race).
- **Finished on 2026-10-13.** The task changes nothing the viewpoints show, so its round is the
  baseline itself, shot again on the commit. No scorecard yet to post it to (task 003), and no
  geometry or textures added, so no budget to check. Decision 011 records how rounds are shot.
  Noticed, not looked into: at `fujacal-start` the start's "WHITE PARTY ✦ BRAGA GP" banner on the
  left reads mirrored.
