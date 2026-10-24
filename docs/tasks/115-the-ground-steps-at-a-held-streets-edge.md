---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-24
depends-on: [066]
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 115 · The ground steps at a held street's edge, not slopes into it: the João XXI's upper lane

## Why

Task 045 (decision 049) holds the ground under each street to its carriageway, so a street beside a
wall or a cutting is flat to its edge. But the ground a game reads between the 2 m points
(`map.height`) still slopes across that edge: on the Avenida João XXI's 3.3 m upper lane, beside the
tunnels' west mouth, it runs from the lane's 24.30 m down to the cutting's 18.25 m over about 1.5 m,
so the lane's last metre dips 0.1 to 0.36 m. A kart there leaves the ground on the dip, and the race
still flies 0.31 to 0.40 s on the lane after task 066 fixed its tilt.

## What

Today (braga-map 1.36.0): the tiles' ground is a 2 m grid, each street's own held to its carriageway
(`tools/lines.mjs`'s `heldGround`, `bands`; decision 049), and `map.height(x, z)` interpolates
between the grid's points, across a street's edge as anywhere else. party-kart draws the street on
that ground and stands the karts on it, so the dip is in both.

1. **Measure:** along every held street's edge in the open world, how far `map.height` falls inside
   the carriageway's outline from the street's own level (a test in `test/streets.test.js`); the João
   XXI's upper lane at (566–569, 240–241) among the worst.
2. **Hold the edge:** a street's ground stays at its own level up to its kerb's line, and steps there:
   either the grid's points next to the edge are held to the street on its side (and the drop is a
   wall's, as decision 059 stands a wall), or the tiles carry the edge as a break line `height` doesn't
   interpolate across. Whichever keeps what a game draws and what its karts drive the same.
3. `npm run world`; party-kart pinned to the new version, its drives again: task 066's race on the João
   XXI with no flight of 0.3 s or more, and the drive along every street no more often in the air.

## Read first

- `tools/lines.mjs` (`heldGround`, `bands`), `tools/world.mjs` (the ground's grid), `index.js`
  (`height`), decisions 049 and 059; task 066's Notes (`docs/tasks/done/066-*.md`).

## Done when

- [ ] Inside every held street's outline the ground is within 2 cm of the street's level (the test).
- [ ] party-kart's race on the João XXI has no flight of 0.3 s or more (task 066's first "Done when").
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Notes

- Found by worker-1 in task 066 (2026-10-24), drafted by the coordinator.
