---
status: todo
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

- [ ] Every round on the page shows each of its places' shots beside the photo, with the slider and
  the round before's button, as before: checked in a browser at a desktop's width and at a phone's
  (390 px), every image loaded.
- [ ] The page holds the photos, the page, its lists and at most 4 sheets a round; how many more
  rounds of 34 changed places fit, in Notes.
- [ ] Every `scores/*` document reads back the same after the republish as before it.
- [ ] `npm test` passes; README's `round.mjs` paragraph says how a round is now laid out.

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
