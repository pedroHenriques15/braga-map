---
status: done
priority: low
kind: code
repo: party-kart
created: 2026-10-26
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 137 · A round shot in chunks keeps every chunk's frame times

## Why

Since 2026-10-24 a round is shot in chunks under 10 minutes, a few viewpoints at a time into the same
folder (the run's rule for heavy jobs). But `scripts/shots.mjs` writes the round's `stats.json` afresh
on each run, so only the last chunk's draw calls, triangles and frame times are left. In task 117's
round (`2026-10-26-before117`), the first chunk's nine views kept their pictures and lost their frame
times. The chunks after it were copied aside by hand and merged.

## What

1. When the round's folder already has a `stats.json` of the same game and map, `shots.mjs` adds this
   run's shots to it level by level, instead of writing it afresh. A shot taken again replaces the
   one before. If the game's commit or the map's version differs, it stops and says so, and doesn't
   mix the two.
2. The round's `index.html` from the merged stats, so it lists every view shot so far.

## Read first

- party-kart's `scripts/shots.mjs` (`stats`, its `writeFileSync`, the page it writes).

## Done when

- [x] A round shot in two chunks has every view's stats in its `stats.json` and its page: round
  `2026-10-26-t137`, `fujacal-start` then `liberdade` as two runs, has both at High and Low in its
  `stats.json` (frames 1.97 and 1.40 ms at High, 1.59 and 0.78 at Low) and both on its page ("2
  viewpoints"), its `made` the first chunk's.
- [x] A chunk on another commit or map version refuses to add to the round: after committing (game
  `8ec96cb` against the round's `7a846a6 with changes`), a chunk of `couteiro` stopped before it shot
  anything, saying so; so did one with `--weather=grey` on a dry round, and one into a round whose
  `stats.json` said map 1.45.0 (written by hand, without a browser).
- [x] `npm test` and `npm run check` pass: 170/170 (37 s, four files at a time), `tsc` clean.

## Notes

- Found by the coordinator in task 117's round (2026-10-26).
- 2026-10-26 (the solo session): taken first of the queue, though low: every round from now is shot in
  chunks (the run's rule for heavy jobs), and its frame times are the budget's evidence for the tasks
  after it. Decided by the session, for the owner to confirm (task 103).
- Done in party-kart's `scripts/shots.mjs` alone (`8ec96cb`): the round's `stats.json`, if there is one,
  is read before the dev server starts; its `game`, `map` and `weather` must be this run's, else it
  stops with both said. Its `made` and `gpu` are kept, each level's shots added to (a viewpoint shot
  again replaces its entry; one that fails in this chunk loses the entry a chunk before gave it, as its
  picture may be this chunk's), and the page lists every viewpoint and level the round has, in
  `viewpoints.json`'s order. `game` says "with changes" for any uncommitted change, so two chunks of a
  dirty tree pass the check whether or not the change between them was the same: commit before a round.
- Not verified: a viewpoint shot again in a second chunk (its entry is replaced by assignment, read, not
  run); Medium (`--medium`), not shot.
