---
status: blocked
priority: high
kind: code
repo: braga-map
created: 2026-10-18
depends-on: []
roadmap: Phase 1 · See it: references, the scorecard and the budget
---

# 064 · The rounds made while the scorecard was out of reach go up, with Claude's marks

## Why

From the afternoon of 2026-10-18, Claude Code on the owner's machine has been signed in to an account
that can't open the scorecard "Braga real" (https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs): the
Artifact tool doesn't find it, and its database lets a session read but not write. Tasks 052, 063
and 042 made their rounds anyway, and they wait in `.cache/scorecard/`. Until they go up, the
owner and the friends mark "As árvores", four rounds behind the game.

## What

Today (2026-10-18), on the page: 18 rounds' worth of files, published by task 062 (98 files: the
page, its two lists, the 34 photos and 61 sheets), "As árvores" (`2026-10-18-after019`) the open
round. Waiting in `.cache/scorecard/` (shared by every worktree through its `.cache` junction):

| Round | Task | Sheets | Claude's marks |
|---|---|---|---|
| `2026-10-18-after052` "Até aos muros" | 052 | `rounds/2026-10-18-after052-1…4.jpg` | 2.88 over 33, none moved |
| `2026-10-18-after063` "Os troncos" | 063 | `rounds/2026-10-18-after063-1…4.jpg` | 2.94, `capela-sao-joao` 3→4, `altice-forum` 2→3 |
| `2026-10-18-after042` "As placas" | 042 | `rounds/2026-10-18-after042-1…4.jpg` | 2.94 over 33, none moved: shot again with 063's renderer (step 2, done) |
| `2026-10-18-after045` "O chão das ruas" | 045 | `rounds/2026-10-18-after045-1…4.jpg` | 2.94 over 33, none moved (against "As placas"): shot on party-kart `b38c87e`, braga-map 1.27.0 |

Claude's marks for each are in `.cache/scorecard/marks/<round>.json`, `{ <place>: { s, c, at } }`,
taken from the files the sessions left (`claude-marks-052.json`, `-063.json`, `-042.json`: each the
whole `scores/claude` at version 13 with its rounds added, so superseded). `tools/scorecard.mjs`
works out what goes up (`files`) and Claude's document with the rounds added (`marks`); its tests
are `test/scorecard.test.js`.

1. **The account.** Stop unless `Artifact` `read` of the scorecard's URL works in this session. The
   owner signs Claude Code in to the account that owns it (`/login`).
2. **Each round on the build after the one before it.** Each waiting round in `refs/rounds.json`
   must be shot on a party-kart commit that contains the earlier rounds' (`game`) and a braga-map at
   least theirs (`map`). 042's was shot on party-kart `421d087`, which hasn't 063's renderer
   (`9dcf456`: the crown drawn at its middle, no leaves below its foot), so it shows 063's places as
   they were: the camera inside a crown at `altice-forum`, the park's canopy over the square at
   `capela-sao-joao`. If it hasn't been shot again on party-kart's main since, shoot it there,
   braga-map pinned to 042's version (`node scripts/shots.mjs after042` in party-kart's main
   checkout, into `shots/<today>-after042/`; on another day than the 18th, that folder renamed to
   `shots/2026-10-18-after042/` in place of the old shots), prepare it again
   (`node tools/round.mjs 2026-10-18-after042`, which keeps its label, tasks and note), mark it
   again against "Os troncos" into `marks/2026-10-18-after042.json`, and commit `refs/rounds.json`.
   Done by 042's session (2026-10-18): shot on party-kart `cdf6867` (main's `9dcf456` merged, braga-map
   1.26.0), prepared again (31 shots of its own, 2 the same as "Os troncos"), marked against it.
3. **The lists from main.** In braga-map's main checkout at `origin/main`, clean:
   `node tools/round.mjs --pack` writes `.cache/scorecard/data/*.json` from main's
   `refs/rounds.json`; `git status` shows nothing changed. A session on a branch without a round
   writes the lists without it, so they're always written again here.
4. **Read before.** Every `scores/*` document (`ArtifactData` `list` of `scores` with `out_dir`),
   kept with its version: `scores/claude`'s is the one to pin. Never write anyone else's.
5. **The files.** List the page's files (`Artifact` `list`, `scope: "files"`), save the listing to a
   file, and `node tools/scorecard.mjs files <listing>`: `.cache/scorecard/publish.json` has the
   paths to add and take off, and `parts`, the `files` maps in order. Publish each part:
   `file_path: scorecard/index.html`, the scorecard's `url`, `root: .cache/scorecard`, `files` the
   part. No `capabilities` (the page keeps its own). List the files again: as `publish.json` says.
6. **The marks.** `node tools/scorecard.mjs marks <scores/claude.json as read>` writes
   `.cache/scorecard/marks/next.json`; it refuses a round with a place unmarked or marked before the
   round was shot. `ArtifactData` `set` of `scores/claude` from that file, `if_version` the version
   read in step 4.
7. **Read after.** Every `scores/*` document again: all but `scores/claude` the same, at the same
   versions; `scores/claude` with the rounds added and the others unchanged.
8. **The page.** Open it: the newest round open for marks, each waiting round's 33 places with
   their pictures, `joao-xxi` only in the rounds that shot it, the summary's averages for each round.
9. Remove the marks written and the superseded `claude-marks-*.json` from `.cache/scorecard/`, and
   update the Realism row of `docs/ROADMAP.md`: the rounds up, Claude's averages, the open round.

A round made after this task is drafted and before it's done waits the same way: its sheets by
`round.mjs`, its marks in `marks/<round>.json`, added to the table above.

## Questions

None.

## Done when

- [ ] Every waiting round is on the page, each shot on the build after the round before it.
- [ ] `scores/claude` has Claude's marks for each, and every other `scores/*` document reads back as
      it was.
- [ ] The page shows the newest round open, at a desktop's width and at 390 px, every picture
      loading.

## Out of scope

- The owner's marks, and the friends'.
- Shooting a round again for any reason but step 2's.

## Notes

- Blocked on the account (step 1), not on a question. The work in `.cache/scorecard/` is ready:
  checked on 2026-10-18 by a dry run against main (052's and 063's rounds; 042's not landed), from a
  listing of the 98 files 062 published: 10 to add (the two lists and 8 sheets), none to take off,
  one publish, 105 files beside the page after; and Claude's document of version 13 with 052's and
  063's rounds added, the other 12 rounds unchanged.
- The page with 052's round, served from `.cache/scorecard`, checked in a browser at 1280 and 390 px:
  33 cards, every picture loading, `joao-xxi` in the rounds before. That check found the summary
  waiting for a mark on `joao-xxi` in the open round, fixed on main (`9e1a3aa`).
- 045's round, "O chão das ruas" (2026-10-18), made after 042's landed and shot on party-kart's main with
  braga-map 1.27.0: four sheets more to publish (18 files with the other three's, by the dry run's
  count), and its marks in `marks/2026-10-18-after045.json` alone (no whole-document file), checked
  against `merge`'s rules: every place marked, after the round was made, each signed.
