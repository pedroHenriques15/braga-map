---
status: todo
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

- [ ] `node tools/round.mjs <round> --level ultra` makes a round's sheets from its Ultra shots, and its
  entry says so; a test.
- [ ] `npm test` passes.

## Notes

- Found by worker-2 in task 085 (2026-10-25), drafted by the coordinator. The rounds of this run that
  wait in task 103 are Ultra's from 081 on.
