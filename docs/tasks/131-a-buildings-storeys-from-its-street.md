---
status: todo
priority: low
kind: code
repo: braga-map
created: 2026-10-25
depends-on: [086]
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 131 · A building's storeys from its street: a drawn part standing under the street, a wall too low

## Why

Task 086 laid the doors and windows read off the photos on 16 walls (2026-10-25), and two of them
showed a building's heights off at its street:

- `way/165861842`'s drawn part stands from 3.1 m while its street is at 7.6 m: its ground floor is
  under the street, so its shops (read in 086) don't show, and its storeys come one level low.
- `way/383766229`'s wall looks about 7 m high in its photo, against the map's 4.8 m.

A building on a slope stands from the lowest ground round it; where its front is on the high side, the
storeys should count from that street, as the photos show them.

## What

1. Measure over the open world: each building's drawn base against the street at its front (the
   carriageway or pavement its longest street-facing wall stands on). How many stand more than a
   storey under it, and which of those the photos show with their ground floor at the street.
2. For those, the storeys counted from the street at the front (the levels below it a basement on the
   low side), so the layouts' ground floor (086) is at the street.
3. `way/383766229`'s height: what the LiDAR has there against the photo; if the map's 4.8 m is wrong,
   why (a roof's height taken as the eaves', a part missing), and the rule that mends it.
4. `npm run world`; shoot the viewpoints that take them in.

## Read first

- `tools/buildings.mjs` (the bases and heights), `tools/layouts.mjs` (086); task 086's Notes (the two
  buildings, where they were found); decision 080.

## Done when

- [ ] The buildings whose front is on the high side have their ground floor at their street (a count
  before and after), `way/165861842` among them, its shops showing.
- [ ] `way/383766229` as high as its photo shows, or its Notes say why the map's height stands.
- [ ] Rated no lower; `npm test` passes.

## Notes

- Found by worker-2 in task 086 (2026-10-25), drafted by the coordinator.
