---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-18
depends-on: []
roadmap: Now · The open world
---

# 069 · The loading screen says so when the game itself can't be downloaded

## Why

On 2026-10-18, a few hours after party-kart `01e7b0d` went live, a friend on a computer couldn't get
into the game: "A construir Braga…" and its spinner, forever, with no message. The loading screen
says when the city fails to build, but not when the game's own script fails to download, and a
deploy takes away the previous build's files, which a page opened from the cache still asks for.
Nobody should be left looking at a spinner that will never stop.

## What

Today (party-kart `01e7b0d`, braga-map 1.26.0):

- `index.html`'s inline script (lines 83–104) listens on `window` for `error` and
  `unhandledrejection`, and replaces the spinner with a message and a "Tentar outra vez" button.
  `src/main.ts` removes `#loading` once the city is up (lines 1768 and 1781).
- When a `<script type="module">` can't be fetched, or a module it imports statically can't, the
  `error` event fires on the `<script>` element. It doesn't reach `window`, so the spinner never
  stops. Checked on 2026-10-18 with the live build served locally, failing one kind of file at a time
  with Playwright's `page.route(..., r => r.abort('failed'))`:
  - `assets/index-*.js` or `assets/photos-*.js` (the `modulepreload`): still spinning after 90 s,
    and no page error.
  - A tile's chunk (`x1z1-*.js`): the message within 2 s.
  - The cars' `.json`, the Basis transcoder's `.wasm` or `.js`, the trees', facades' or ground's
    `.ktx2`, the sounds: the game opens in 11–13 s without them.
- `scripts/deploy.sh` force-pushes a fresh `gh-pages` that holds the new build alone, so every
  file of the build before it goes. GitHub Pages serves `index.html` with `max-age=600`. A browser
  that shows an `index.html` from before a deploy (within those 10 minutes, or a tab restored from
  the cache) asks for an `index-*.js` that is gone. Checked: `gh-pages` `54236d1`'s `index.html`
  (party-kart `96b3ebb`) with `3e188f8`'s files spins forever, after 404s on `index-CM6aZCpG.js` and
  `photos-Cjsp1lBM.js`.
- A fresh load of the live site opens the game in 16 s in Chromium, 13 s in WebKit and 18 s in
  Firefox on a desktop, 18 s with software graphics, and 25 s as a phone on a 4 Mbit/s line. The
  build before took the same time (10.1 s against 10.7 s here; 38.6 against 41.2 s with the CPU
  slowed 4×).

Steps:

1. In `index.html`'s inline script, also catch the game's own script failing to download: an
   `error` event on a `<script>` element, heard on `window` in the capture phase
   (`addEventListener('error', ..., true)`), while `#loading` is still there. Say so in Portuguese,
   in the voice of the messages there: the game couldn't be downloaded, check the connection and try
   again. Keep the button that reloads, and put the script's file name in the `<small>` line. A
   `<link rel="modulepreload">` that fails is not, by itself, the game failing: leave it to the
   `<script>`'s own error, and check that it comes.
2. If `#loading` is still up and hasn't stopped after 90 s, add a line under the spinner: it's taking
   longer than it should, with the same button. Keep the spinner, since a slow computer may still
   finish.
3. Check it with Playwright on `npm run build` and `npx vite preview`: fail `index-*.js`, then
   `photos-*.js`, and the message shows within 5 s; fail a tile's chunk, and the city's message
   still shows; fail nothing, and the game opens as before with no message. Then check the 90 s line
   by holding one tile's chunk back (a `page.route` that never answers).
4. Correct `docs/releasing.md`. Its step 4 says a browser can show the old build for a while after a
   deploy. It can't: the old build's files are gone, so such a page couldn't load, and now it says
   so and offers the reload, which fetches the new `index.html`.
5. `npm test` and `npm run check`. Don't deploy: the owner asks for that.

## Read first

- `index.html`: the loading screen and its inline script.
- `src/main.ts`, the end: where `#loading` goes.
- `scripts/deploy.sh` and `docs/releasing.md`: what a deploy publishes and takes away.

## Done when

- [ ] With `index-*.js` or `photos-*.js` failing, the loading screen says the game couldn't be
      downloaded within 5 s and offers the reload (Playwright, on the built site).
- [ ] With a tile's chunk failing, it still says the city failed to build. With nothing failing, the
      game opens with no message.
- [ ] With the build held back past 90 s, the spinner stays and the line saying it's taking long
      shows.
- [ ] `docs/releasing.md` says what a page from before a deploy does.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- Keeping the previous build's files at a deploy, so that a page from before it still opens. It
  would open the old build, which shares no room with the new one whenever the peer prefix moved,
  as it did with 052 and 014. A task of its own if the owner wants it.
- What the friend's computer had. It isn't known whether it was a page from the cache, an extension
  or a network that blocked the file, or something else. This task makes any of them say so.

## Notes

Found 2026-10-18 by the planning session, from the owner's report of a friend's endless spinner.
Not verified: what happened on the friend's computer. What they can try meanwhile: reload with
Ctrl+Shift+R (Cmd+Shift+R on a Mac), then a private window, then send what the console (F12) shows.
