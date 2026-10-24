---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [086]
roadmap: Games · More tracks and the shooter
---

# 126 · The arenas' insides take their doors and windows from the facades' layouts

## Why

Task 079 made up plain rooms for the deathmatch arenas' buildings (decision 057), their doors and
windows open where the facade draws them, by its kind's rhythm. Task 086 reads where a seen building's
openings really are: an inside should open where its facade does, or a player sees out through a
window that isn't there from the street. Split from 086 (2026-10-24).

## What

1. `src/world/interiors.ts`: a building with a layout (086) opens its rooms where the layout's doors
   and windows are, the ground floor's and, in the buildings with every floor, each storey's.
2. The walkers' and the shots' tests in the arenas (`test/field.test.ts`) still pass; the arenas'
   cover laid out as before.
3. Walk the three arenas on foot (Playwright) and look out of a few windows.

## Read first

- party-kart's `src/world/interiors.ts`, `src/render/interiors.ts`; decision 057; tasks 079 and 086.

## Done when

- [ ] Every arena building with a layout opens where its layout says (a test).
- [ ] `npm test` and `npm run check` pass.

## Notes

- Split from task 086 by the coordinator (2026-10-24), at worker-2's suggestion.
