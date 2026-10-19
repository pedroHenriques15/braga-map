---
status: done
priority: low
kind: code
repo: party-kart
created: 2026-10-19
depends-on: [069]
roadmap: Now · The open world
---

# 070 · "Tentar outra vez" in WebKit fetches a failed preload again

## Why

Task 069 made the loading screen say so when the game's own script can't be downloaded, with a
"Tentar outra vez" button that reloads. In Chromium and Firefox the reload brings the game. In
WebKit, when the file that failed is `photos-*.js`, the one the build preloads with
`<link rel="modulepreload">`, it doesn't: the reloaded page asks for nothing, and says again that
the game couldn't be downloaded. A player on an iPhone or a Mac whose connection dropped that one
file would be stuck until they close the browser. After a deploy it doesn't happen, as the new
`index.html` names new files.

## What

Found by task 069 on 2026-10-19 (party-kart `6747516` with 069's `index.html`, built and served
locally, Playwright 1.63's WebKit on Windows):

- The built `index.html` has `<script type="module" src="./assets/index-*.js">` and
  `<link rel="modulepreload" href="./assets/photos-*.js">`, both put there by Vite.
  `photos-*.js` is `src/render/photos.ts` (316 KB, 94 KB gzipped), a chunk of its own because
  `render/city.ts` and `render/trees.ts` import it dynamically and `render/cover.ts` statically.
- With `photos-*.js` failing once (a real 404 from a local server, or Playwright's `abort`), the
  loading screen shows its message. After `location.reload()`, `location.replace()`, a navigation to
  the same URL, or one with a new query, WebKit doesn't request `photos-*.js` again and the
  `<script>` fails at once. With the `<link rel="modulepreload">` taken out of the HTML, the reload
  fetches it and the game opens. So WebKit keeps the failed preload for as long as the browser
  process lasts.
- With a tile's chunk failing (a dynamic import, with no preload), WebKit's reload opens the game.

Ways to fix it, to choose from while doing the task:

1. `build: { modulePreload: false }` in `vite.config.ts`. Then `photos-*.js` is fetched only once
   `index-*.js` (1.1 MB, 358 KB gzipped) has come and been parsed: one more round trip and 94 KB
   at the end of the load, about 0.2 s on a 4 Mbit/s line. Measure it with
   `scripts/download.mjs` and a timed load.
2. `render/cover.ts` imports `photos.ts` dynamically, as `city.ts` and `trees.ts` do, so there's
   nothing to preload. A failure is then the city's, as a tile's is, and its reload works in WebKit.
3. Leave it, if the owner's Safari (an iPhone or a Mac) doesn't do it: it may be Playwright's
   WebKit on Windows alone.

Recommended: check on the owner's iPhone first (step 3), then option 2 if it happens there too.
Chosen: option 2, without the check (the owner, 2026-10-19); done as all three imports static
instead (Notes).

## Read first

- party-kart's `index.html`: the loading screen and its script (task 069).
- party-kart's `vite.config.ts`, and `src/render/cover.ts`, `city.ts` and `trees.ts` where they
  import `photos.ts`.
- `docs/tasks/done/069-the-loading-screen-says-when-the-game-cant-come.md`: how it was checked.

## Done when

- [x] In WebKit, `photos-*.js` failing once and then "Tentar outra vez" opens the game
      (Playwright, on the built site, with a server that answers 404 to its first request only).
      > There's no `photos-*.js` now: it's in `index-*.js`. That failing once, WebKit's button opens
      > the game (asked for twice), as Chromium's and Firefox's do. Before, WebKit stayed stuck.
- [x] Chromium and Firefox still open the game after it, and a fresh load takes no longer than
      before (the times measured, before and after).
      > Fresh loads in Chromium, the median of three: 6.5 s before and after locally, 27.4 s before
      > and after at 4 Mbit/s (40 ms).
- [x] `npm test` and `npm run check` pass.
      > 66 pass, `tsc` clean.

## Out of scope

- Keeping the previous build's files at a deploy (task 069's out of scope).

## Questions

- [x] Does the owner's Safari do it? On an iPhone or a Mac: open the game with the network
      turned off just as it starts, so that it shows "Não foi possível descarregar o jogo", then
      turn it on and press "Tentar outra vez". Options: it opens (the task drops, or keeps only
      option 1 or 2 for WebKit elsewhere); it doesn't (option 2). Recommended: try it before
      starting, as it decides whether the task is worth doing.
      > 2026-10-19, the owner: do the task without checking Safari first. So option 2, which costs
      > nothing if Safari never did it.

## Notes

Not verified: whether Safari on iOS or macOS keeps a failed preload as the Windows WebKit does.

Done 2026-10-19. Option 2 alone wasn't enough: with `cover.ts` importing `photos.ts` dynamically, the
bundler made a chunk of what `photos.ts` shares with the game (three.js, 255 KB, 70 KB gzipped, named
`facades-*.js`), and the page preloaded that instead. `photos.ts` was imported dynamically only since
it was behind `?photos` (party-kart `cd68351`); `cover.ts` imported it statically from task 016 on, so
every load fetched it at the start anyway. Now `city.ts` and `trees.ts` import it statically too: the
built `index.html` has no `modulepreload`, and the game is one script, `index-*.js`, 1.45 MB, 451 KB
gzipped (358 + 94 before). `scripts/download.mjs`: the game 1 file, 0.43 MB gzipped; driving 8.3 s
after opening. A failure of the photos' KTX2 files or Basis's transcoder is still caught, and the city
goes without them. The scenery the same as the live build's: 36 KTX2 and transcoder files, 83
textures, 270 draw calls at one view, the same console warnings. Task 069's checks again on this
build: the same in all three browsers. party-kart's `docs/architecture.md` says why the build should
have no `modulepreload`; decision 052.

Viewpoints: none, as nothing the city shows changed; no round, no budget.
