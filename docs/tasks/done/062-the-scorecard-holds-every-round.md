---
status: done
priority: high
kind: code
repo: braga-map
created: 2026-10-18
depends-on: []
roadmap: Phase 1 · See it: references, the scorecard and the budget
---

# 062 · The scorecard holds every round: a few files a round, not one a shot

## Why

The scorecard "Braga real" (task 003, decision 012, https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs)
publishes each round's shots as files of their own beside the page, and a version of an artifact
holds 511 files at most. After task 019's round "As árvores" it holds 495: the page, its two lists,
the 34 photos and 458 shots. The next round that changes more than 16 places won't go up, and most
rounds change nearly every place: 019's changed all 34, and 057 found only 61 of 451 shots the
same, byte for byte, as an earlier round's. Task 052's round, then 042's, are next.

## What

Today (2026-10-18): `tools/round.mjs` writes each round's High shots to
`.cache/scorecard/rounds/<round>/<id>.jpg`, 960 px wide at quality 82, and records the round in
`refs/rounds.json` (committed) with each shot's size `[w, h]`; since task 057 a shot the same, byte
for byte, as an earlier round's of its place is that round's (`[w, h, round]`), and its file is
dropped. `scorecard/index.html`'s `card()` shows `rounds/${q.shots[v.id][2] ?? q.id}/${v.id}.jpg`
beside `photos/<id>.jpg`, with a slider between them and a button for the round before's shot.
Assets aren't an answer: task 003 turned them down because an asset may be refused to a viewer from
outside the owner's organization, and the friends are.

1. **A round's shots in a few sheets:** `tools/round.mjs` packs a round's own shots into JPEG
   sheets, `rounds/<round>-<n>.jpg`, at most 9 shots a sheet (about 6 megapixels, which a phone
   decodes), each shot still 960 px wide, and records where each shot is in its sheet in its entry
   in `refs/rounds.json`. A shot the same as an earlier round's still points at that round's.
2. **The page shows a shot from its sheet:** `scorecard/index.html` crops the shot out of its sheet
   (a wrapper with `overflow: hidden` and the sheet placed in it, or a `background-position`), for
   the round's shot, the round before's, and the slider over the photo, as today.
3. **Every round already up, packed the same way,** from `.cache/scorecard/rounds/`, and the page
   republished with the sheets and `data/rounds.json`, and the per-shot files removed (`null` in the
   Artifact tool's `files`). A publish carries 64 MB at most, so in parts if it must be.
4. **The marks stay as they are:** they're in the artifact's database, `scores/<their id>`, keyed by
   round and place, not by file. Read every `scores/*` document before and after and compare.

## Read first

- `tools/round.mjs`, `scorecard/index.html`, `refs/rounds.json`.
- `docs/tasks/done/003-scorecard.md` (why files, not assets; the database's rules) and decision 012.
- README's paragraph on `round.mjs`.

## Done when

- [x] Every round on the page shows each of its places' shots beside the photo, with the slider and
  the round before's button, as before: checked in a browser at a desktop's width and at a phone's
  (390 px), every image loaded.
  > The page from `.cache/scorecard/` in Chromium (Playwright) at 1280 px and at 390 px (3×, touch),
  > scrolled through each of the 17 rounds: 34 cards each, every photo and every shot the round has
  > loaded (a place a round didn't shoot says "Sem imagem do jogo nesta ronda", as before), each
  > window over its sheet within a pixel and a half of where its entry puts it (1,038 pieces at
  > each width), and each of the 424 "Ver a ronda anterior" buttons loading its piece and going
  > back; no page error, no file missing, the page 390 px wide at 390. The slider and the cards
  > looked at in screenshots. And each of the 458 pieces against party-kart's PNG it was made from,
  > shrunk as `round.mjs` does: none worse than 35.5 dB (a JPEG's loss), and every recorded hash
  > the PNG's.
- [x] The page holds the photos, the page, its lists and at most 4 sheets a round; how many more
  rounds of 34 changed places fit, in Notes.
  > 98 files after the republish (the page, its two lists, the 34 photos and 61 sheets), from 495;
  > `test/rounds.test.js` holds a round to 4 sheets.
- [x] Every `scores/*` document reads back the same after the republish as before it.
  > `scores/claude` (version 13) and the owner's (version 144), read before and after the three
  > publishes: the same, byte for byte, at the same versions. Nothing was written to them.
- [x] `npm test` passes; README's `round.mjs` paragraph says how a round is now laid out.
  > 119 tests pass, the 4 new in `test/rounds.test.js` among them; README's paragraph has the
  > sheets, the entries `[w, h, sheet, x, y, hash]` and `--pack`.

## Out of scope

- The page's look, the marks and the database's rules.
- Which rounds are open for marks.

## Notes

- Found by the planning session after task 019's round (2026-10-18): the page held 495 of 511
  files. Task 058 had warned at 488, and task 057 made identical shots share a file.
- It goes before the next round is posted. A session that posts a round merges main first, so its
  `tools/round.mjs` writes sheets. This task rewrites `.cache/scorecard/`, which every checkout
  shares through its `.cache` junction.
- Thinning old rounds instead would lose their pictures beside the marks given on them; a second
  page would split the rounds across two links for the friends.
- Done (2026-10-18), decision 045. `node tools/round.mjs --pack` packed the 17 rounds already up
  into 61 sheets (46.6 MB), the 458 shots of their own a round had; the 61 the same as an earlier
  round's still point at it. The page went up in three publishes, as one carries 255 files at most
  and a version holds 511: the page, the 61 sheets, `data/rounds.json` and 192 of the old files
  off (version 18, 364 files, the page whole from then on), then 254 off (19), then the last 12
  (20). The old files are in party-kart's `shots/<round>/high/` as PNGs, and in the page's
  versions up to 17.
- **Room:** 98 of 511 files, so 413 left: at most 4 sheets for a round of 34 changed places, about
  100 more such rounds (103), and more where a round shares shots with the one before.
- No round of its own: nothing in the game changed, and every round's shots are as they were.
