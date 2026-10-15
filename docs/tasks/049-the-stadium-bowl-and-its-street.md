---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-15
depends-on: []
roadmap: Phase 2 · The shape
---

# 049 · The stadium's bowl stops short of the street beside it

## Why

party-kart's land lays the Estádio 1.º de Maio's ground level in a bowl cut into the slope
(`land.ts`), and the bowl reaches the street the race takes beside the stadium: there the street is
drawn and driven 1.2 m under the LiDAR's ground, and the race's line, which is the LiDAR's, 1.2 m
over the floor (around (169, 1501)). A street keeps its own level; only the stadium's ground is
the bowl's.

## What

Today `makeLand` (`src/world/land.ts`) eases the land to the stadium's height inside an ellipse
round it, `L + W + 30` by `W + 36` metres, from 0.9 to 1.3 of it (`pads`). Task 037 kept the land
held down in front of a tunnel's mouth off another street's carriageway (`beside`, `onStreet`).

1. Keep the bowl off the streets' carriageways and pavements the same way, or ease it to nothing
   before it reaches them.
2. Check the street's height there against braga-map's ground (`world.height`): within 15 cm, as
   the drawn carriageways are elsewhere (`test/streets.test.ts`).
3. The race's lap test, and the drawn street at the stadium.

## Read first

- party-kart: `src/world/land.ts` (`pads`, `firm`), `src/render/city.ts` (the stadium), `CLAUDE.md`.
- braga-map: `docs/tasks/done/037-the-race-in-the-open-world.md` (how it was found).

## Done when

- [ ] The street beside the stadium within 15 cm of braga-map's ground, the pitch and stands still
  in their bowl.
- [ ] The viewpoint `estadio` shot again, no worse.
- [ ] party-kart's `npm test` and `npm run check` pass.

## Out of scope

- The stadium's model itself.

## Notes

- Drafted 2026-10-15 from task 037, which measured the race's line against the race's floor: within
  17 cm at 98% of the route, 1.2 m at the stadium.
