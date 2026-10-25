---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-25
depends-on: [081]
roadmap: Phase 1 · See it: references, the scorecard and the budget
---

# 127 · A round goes up at Ultra, the level the rounds are judged at since 081

## Why

Since task 081 (decision 069) the rounds are shot at Ultra and Low, Ultra being "as real as it gets",
and Claude's marks are given at Ultra (`2026-10-24-after081` is Ultra's baseline). But
`tools/round.mjs` prepares a round from a shots folder's `high/` (decision 012: the scorecard sets each
photo over the game's High shot), so a round of an Ultra task (085, 089, 090 and after) can't go up as it
was judged, and the scorecard would show High where the marks are Ultra's.

## What

1. `tools/round.mjs` takes the level to put up (`--level ultra`, Ultra by default for a round shot with
   it, High for the rounds before 081), records it in `refs/rounds.json`'s entry, and makes the sheets from
   that level's shots.
2. The scorecard's page (`scorecard/index.html`) says a round's level beside its label.
3. `tools/scorecard.mjs` and `test/scorecard.test.js` follow; the rounds already prepared stay High.
4. Decision 012's "High shots" gets a new entry naming Ultra, when this is finished.

## Read first

- `tools/round.mjs`, `tools/scorecard.mjs`, `test/scorecard.test.js`, `scorecard/index.html`; decisions
  011, 012 and 069; task 103 (the rounds waiting for the owner's account).

## Done when

- [x] `node tools/round.mjs <round> --level ultra` makes a round's sheets from its Ultra shots, and its
  entry says so; a test. (`test/scorecard.test.js`, a made-up round red at Ultra and blue at High; and
  `2026-10-24-after081` prepared into the scratchpad: 33 Ultra shots in 4 sheets, its entry `ultra`.)
- [x] `npm test` passes. (159/159.)

## Notes

- Found by worker-2 in task 085 (2026-10-25), drafted by the coordinator. The rounds of this run that
  wait in task 103 are Ultra's from 081 on.
- **Done, 2026-10-25 (worker-3):** `tools/round.mjs` takes `--level ultra|high`; without it, a round
  already recorded keeps the level it had, and a new one is Ultra when its folder has `ultra/`
  (`shots.mjs --ultra`), else High. The entry records `level`, after `map`; the 23 rounds already in
  `refs/rounds.json` say `high` (they were all put up from `high/`, so their sheets stay as they are).
  The page says the level beside a round's label, as the game names it ("Ultra", "Alta"): in the list
  of rounds, the round's title, the summary's columns and "Ver a ronda anterior"; a round without one
  is High there too, as `data/rounds.json` already up is until a round goes up with the new lists.
- `--out` and `--log` put the files and the record somewhere else than `.cache/scorecard/` and
  `refs/rounds.json`: the test prepares its round in a folder of its own, and a worktree can prepare
  a round without writing the shared `.cache` before it lands.
- `tools/scorecard.mjs` needed nothing: it works from each round's sheets and shots, whatever their
  level.
- Landed 2026-10-25, decision 079; no version or tag (the scorecard's tools, as 057, 062 and 064 landed).
