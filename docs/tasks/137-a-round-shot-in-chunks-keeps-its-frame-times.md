---
status: todo
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

- [ ] A round shot in two chunks has every view's stats in its `stats.json` and its page.
- [ ] A chunk on another commit or map version refuses to add to the round.
- [ ] `npm test` and `npm run check` pass.

## Notes

- Found by the coordinator in task 117's round (2026-10-26).
