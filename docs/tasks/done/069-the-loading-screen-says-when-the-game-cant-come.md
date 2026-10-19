---
status: done
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

- [x] With `index-*.js` or `photos-*.js` failing, the loading screen says the game couldn't be
      downloaded within 5 s and offers the reload (Playwright, on the built site).
      > In 0.03–0.3 s in Chromium, Firefox and WebKit, and the button opens the game once the
      > failure is lifted (Notes). Since task 070 there is no `photos-*.js`: it's part of `index-*.js`.
- [x] With a tile's chunk failing, it still says the city failed to build. With nothing failing, the
      game opens with no message.
      > In all three browsers, on 069's build and again on 070's (Notes).
- [x] With the build held back past 90 s, the spinner stays and the line saying it's taking long
      shows.
      > A tile's chunk unanswered: the spinner alone at 80 s, the line and the button under it at 95 s.
- [x] `docs/releasing.md` says what a page from before a deploy does.
      > Its step 4, and "Players keep the old build until they reload".
- [x] `npm test` and `npm run check` pass.
      > 66 pass, and `tsc` clean; braga-map's `npm test` 141 pass, 0 fail.

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

Done 2026-10-19 on party-kart `6747516` (braga-map 1.29.0, the live `index-DafcRN-n.js`), committed
and deployed with task 070. Decision 052. `index.html`'s script moved into `<head>`, ahead of the tags the build puts at its end,
as the preload's error fires before `<body>` is parsed. A capture listener on `window` hears a
`<script>` with a `src` failing and says "Não foi possível descarregar o jogo. Verifica a ligação à
internet e volta a tentar.", the button and, in the `<small>` line, the script's file name and any
`modulepreload` that failed before it. A 90 s timer adds "Está a demorar mais do que devia. Se não
avançar, volta a tentar." and the button, under the spinner. `docs/releasing.md`'s step 4 and its
"players keep the old build" now say what a page from before a deploy does.

Checked with Playwright on `npm run build` and `npx vite preview` (Chromium unless said):
- Before: `index-*.js` aborted, still spinning after 30 s, no message. A tile's chunk: the message in
  1.3 s.
- After: `index-*.js` aborted, the message in 0.03 s (Firefox 0.2 s, WebKit 0.05 s), `small`
  "index-DafcRN-n.js". `photos-*.js` aborted, 0.05 s (Firefox 0.3 s; WebKit shows it too), `small`
  "index-DafcRN-n.js, photos-D_TLtHRC.js": the `<link>`'s error comes first, then the `<script>`'s,
  in all three. The button, with the failure lifted, opens the game in 7–11 s (but WebKit after
  `photos-*.js`: task 070).
- A tile's chunk (`x1z1-*.js`) aborted: still "Algo correu mal a construir Braga", in 0.2 s (Firefox
  and WebKit 0.8 s).
- Nothing failing: the game opens in 9.5 s (Firefox 13 s, WebKit 11 s), no message, the welcome in
  the feed.
- A tile's chunk held back unanswered: at 80 s the spinner alone; at 95 s the spinner, the line and
  the button.
- With a server answering a real 404 to `photos-*.js` once: Chromium's button opens the game;
  Firefox asks again on its own and opens with no message.
- party-kart `npm run check` and `npm test` (66 pass); braga-map `npm test` (141 pass, 0 fail).

Found along the way: task 070. WebKit (Playwright's, on Windows) keeps a failed
`modulepreload` for as long as the browser process lasts, so after `photos-*.js` fails, "Tentar
outra vez" fails again at once. After a deploy it doesn't matter, as the new `index.html` names new
files. Task 070 made the game one script, so there's nothing left to preload.

Viewpoints: none, as nothing the city shows changed; no round, no budget.
