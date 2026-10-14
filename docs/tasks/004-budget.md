---
status: doing
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
35 fps for 6 s (`watchSpeed` in `src/main.ts`). Nothing says how much the city may cost, so every
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
2. **Measure on a real phone,** the slowest the friends play on: an older Android (the owner
   names the model when they run it). The frame rate on the start straight and at the busiest
   viewpoint (the one with the most draw calls and triangles in step 1), and the load time on 4G.
   - **Add an on-screen counter first,** behind a URL flag, `?stats`, like the flags at
     `src/main.ts:27-36`: the frame rate (over the last second), the worst second of the race so
     far, the quality tier and whether it has stepped down, draw calls, triangles, the time to
     build the city, and the time from opening the page to the city being ready. Small, in a
     corner, off without the flag. Nothing to install, so whoever has the phone can run it alone
     and send a screenshot.
   - **Write the steps for the owner here,** in Notes: 4G on and Wi-Fi off, the game's address
     with `?stats`, the quality chosen (Medium, where phones start, then Low), a race with bots,
     and when to screenshot (the start straight, and passing the busiest viewpoint). The owner,
     or the friend with the phone, runs them.
3. **Write the budget** in party-kart's `docs/architecture.md`, a section "The city's budget":
   per quality tier, the most draw calls, triangles, texture memory and download the city may
   take, from what the phone managed with room to spare.
4. **Say where the budget runs out first** and what would buy room, in Notes: level of detail
   for buildings, culling by tile, loading only the tiles near the kart (braga-map's
   `loadWorld` loads by tile), rebuilding the city when the quality drops, compressed textures.
   Draft a task for the first one that's needed.

## Questions

- [x] Which phone is the floor: the slowest one a friend races on?
  > An older Android. The owner names the model when step 2 is run.
- [x] How are the phone's frame rate and load time read: an on-screen counter, USB remote
  debugging from the PC (`chrome://inspect`, Android only, the phone in hand), or both?
  > An on-screen counter behind `?stats`: it works on any phone, and a friend can run it alone.

## Read first

- `../party-kart/src/main.ts`: `buildCity`, the quality step-down, `__kart`, the URL flags.
- `../party-kart/src/hud.ts`: where the `?stats` counter would sit.
- `../party-kart/src/render/city.ts`, `trees.ts`, `look.ts`.
- `../party-kart/docs/architecture.md`: "few draw calls".

## Done when

- [ ] The baseline is measured at every viewpoint and tier, and kept with task 002's baseline
  round.
- [ ] `?stats` shows the counter in party-kart, and nothing changes without the flag; the
  flag is described with the others, in party-kart's `docs/making-changes.md` and `CLAUDE.md`.
- [ ] The budget is written in party-kart's `docs/architecture.md`.
- [ ] The phone's numbers, its model and the tier it held are recorded in Notes, from the
  counter's screenshots.

## Out of scope

- Adding level of detail or streaming: a task of its own, once the budget shows it's needed.
- The textures' format and loading: task 007.

## Notes

- From task 009 (2026-10-13, measured in the browser, not on a phone): the land and the verges
  beside the road, in triangles, went from 173k to 352k on High, 173k to 317k on Medium and 43k
  to 117k on Low; the start view from 885k to 1,065k on High. The city builds about 0.6 s slower.
  The track's 48 tiles are 4.1 MB (1.2 MB gzipped), with the ground every 2 m on 18 of them. The
  land's detail near the road (`band` and `tol` in `city.ts`) is the first thing to trade.
- From task 002 (2026-10-13): `node scripts/shots.mjs <label>` in party-kart records, per
  viewpoint and quality, the build time (loading the tiles from the local dev server and
  building), draw calls, triangles, and the number of textures and geometries: not texture memory.
  It shoots High and Low only; Medium is one word in its `QUALITIES`. Its frame time is 60 frames
  drawn back to back, the middle of three runs. On the owner's PC (RTX 4060 Ti, 1 pixel per pixel)
  that's 0.2–2.5 ms on both tiers, varying by about 1 ms from run to run, so it can't tell the
  tiers apart there: the phone (step 2) has to give the frame rate. Draw calls and triangles don't
  vary between runs. Baseline (`shots/2026-10-13-baseline/stats.json`): High 48–190 calls,
  0.76–1.07 M triangles, built in 1.3–1.4 s; Low 33–173 calls, 0.42–0.53 M triangles, 0.7–0.8 s.
  High's 2× pixel ratio on a sharp screen isn't in these numbers.
- Steps 1 and 3 (2026-10-14, in the browser on the owner's PC; the phone, step 2, is still to
  run). `node scripts/shots.mjs budget --medium` (`shots/2026-10-13-budget/`, beside the baseline,
  whose draw calls and triangles it matches exactly) now shoots Medium too and records the
  textures' memory; `node scripts/download.mjs` builds the game as shipped and adds up what it
  fetches. The city alone, at the 29 viewpoints: High 48–190 draw calls, 0.76–1.07 M triangles,
  91 MB of textures, built in 1.4–1.8 s; Medium 48–190, 0.72–0.89 M, 57 MB, 1.4–1.7 s; Low 33–173,
  0.42–0.53 M, 42 MB, 0.8–1.0 s. A race of 8 karts on the start straight: High 680 draw calls and
  1.22 M triangles, Medium 561 and 1.00 M, Low 456 and 0.61 M. The download: 1.47 MB as the
  live site sends it (4.87 MB as is); `download.mjs` gzips it to 1.41 MB, of which the map's 48
  tiles are 1.12 MB, as GitHub Pages compresses a little less. The busiest viewpoint on the route
  is `robert-smith` (190 draw calls, 1.07 M triangles; its camera stands at the track's sample
  4543). The budget in party-kart's `docs/architecture.md` is, until the phone is measured, what
  the city costs today, rounded up.
- `?stats` is in party-kart (`src/stats.ts`, commit `05cb2f3`), on the live site since
  2026-10-14. Checked in Chromium at a phone's size (800 × 360, touch), on the menu and in races
  of 1 and 8 karts on every level: it shows, and without the flag there's no counter. Checked
  again on the shipped build and on the live site. Its download line counts what the page
  fetched, so the dev server shows 17.7 MB (every source file on its own); the live site shows
  1.5 MB, the 1.47 MB above with each file's headers.
- **The phone's steps** (step 2), for the owner or the friend with the phone:
  1. Charge the phone past half, turn battery saver off and close the other apps. Wi-Fi off,
     mobile data (4G) on. Note the phone's model (Settings → About phone).
  2. So the game downloads afresh: in Chrome, open https://pedrohenriques15.github.io/party-kart/,
     tap the icon left of the address → Site settings → Clear & reset.
  3. Open https://pedrohenriques15.github.io/party-kart/?stats&autodrive. With `autodrive` the
     kart drives itself and the graphics stay on the level chosen. When the menu shows,
     **screenshot 1**: the third line is the load (the city built in, ready after, MB down). If it
     says "from the cache", step 2 didn't take.
  4. Graphics: **Medium**. Create a room, Bots: 0, Start the race, the phone sideways.
     **Screenshot 2a** about 15 s after GO, on the start straight, then End race. Bots: 7, Start
     the race again, and **screenshot 2b** the same way: the two say what the karts cost.
  5. Let it drive the whole lap, about 4 minutes. **Screenshot 3** as it crosses the line: "worst"
     is the slowest second of the lap.
  6. Open https://pedrohenriques15.github.io/party-kart/?stats&autodrive&at=4543: the race starts
     at `robert-smith`, the busiest viewpoint. Start it the same way. **Screenshot 4** about 5 s
     after GO.
  7. Graphics: **Low**, and steps 4–6 again.
  8. Send the screenshots and the model. The numbers go here, and the budget is set from them.
- **Where the budget runs out first** (step 4), from what the browser measured; the phone says
  which of these is real:
  1. **Draw calls in a full race.** The karts take more than the city: each is about 40 draw
     calls on Low to 60 on High (their parts aren't merged, and the shadows draw them again), so
     8 karts add 300–500 to the city's 190 at most. An older Android pays for each call in the
     browser's GPU process. Merging each kart's static parts by material, as `bake()` does for
     the city, would buy the most. That's party-kart's karts, not the city.
  2. **Stepping down doesn't rebuild the city.** A phone that starts on Medium and drops to Low
     keeps Medium's 0.72–0.89 M triangles and 57 MB of textures; Low's city is 0.42–0.53 M and
     42 MB. Rebuilding the city when the level drops (or building it for Low from the start on a
     phone that's slow) would make the budget's Low column true for the phones that need it.
  3. **Textures.** The ground's painted map is half of them (44 MB on High), and its canvas is
     kept besides (another 34 MB, which Chrome may hold on the graphics card). Letting the canvas
     go once the texture is on the card would buy that back. Photo textures (task 007) spend
     from here.
  4. **Triangles** stay under 1.1 M; the ground's mesh near the road (`band` and `tol`) is the
     first thing to trade, as task 009 found. Level of detail and culling for buildings would
     save triangles, not draw calls: the buildings are 7 meshes in all.
  5. **The download** is 1.47 MB: a couple of seconds on 4G. Loading only the tiles near
     the kart isn't needed for that.
  The task for the first that's needed is drafted when the phone's numbers are in: the first if
  the frame rate falls with 8 karts but not with 1, the second if Low on the phone is no faster
  than Medium.
- Found along the way: the street plates are one texture 4032 pixels high (112 for each of the
  36 streets). The 37th takes it past 4096, the most some phones take, and three.js then shrinks
  it. Worth knowing before the map adds streets.
