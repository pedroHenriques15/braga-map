---
status: done
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

- [x] The street beside the stadium within 15 cm of braga-map's ground, the pitch and stands still
  in their bowl.
  > Every carriageway point in the bowl's reach, every metre, within 2 cm of `world.height` (3,149
  > of the 3,779 were more than 15 cm under it, 5.6 m the most); the bowl's core at the stadium's
  > level at 99.3% of its points every 2 m. The pitch and stands from above the same (a scratch
  > view, before and after). Measured on braga-map 1.20.1 and again on 1.21.1, the same.
- [x] The viewpoint `estadio` shot again, no worse.
  > `before049` and `after049` (High, Medium, Low, with `../braga-map`'s viewpoints): the same
  > shot, the road behind the roundabout a few pixels different.
- [x] party-kart's `npm test` and `npm run check` pass.
  > After merging party-kart's `main` (braga-map 1.21.1): 62 of 62, `tsc` clean. The autopilot's
  > laps "301.7, 299.9 s; respawns 0; longest air 2.04 s; top 217 km/h; wall hits 51", against
  > `main`'s "302.0, 299.8 s; respawns 0; longest air 2.02 s; top 217 km/h; wall hits 52".

## Out of scope

- The stadium's model itself.

## Notes

- Drafted 2026-10-15 from task 037, which measured the race's line against the race's floor: within
  17 cm at 98% of the route, 1.2 m at the stadium.
- **The bowl reached further than the task found** (2026-10-17): on 026's streets, the race's line
  beside the stadium 1.2 m over the floor at (169, 1501), but the service road along its north side
  drawn and driven 5.6 m under braga-map's ground at (143, 1493), in a trench with the land's face
  over it; of the carriageways' points every metre in the bowl's reach, 3,149 of 3,779 more than 15
  cm under. The work is in party-kart's `src/world/land.ts` alone.
- **What changed:** the bowl eases to nothing over 10 m (`BOWL_EASE`) before a carriageway or a
  pavement on the ground, as the land in front of a tunnel's mouth already kept off another street's
  carriageway (`beside`, task 037). How far each point is from one is read off a half-metre grid
  over the bowl's reach (`streetDistance`: each cell in a street or not by its middle, then a
  chamfer of straight and diagonal steps), between the four cells round it so the land has no steps
  of its own.
- **Measured** (a script on `worldGround(world)`, `firm` against `world.height`): every
  carriageway point in the bowl's reach within 2 cm of braga-map's ground (it had none there under
  15 cm but a sixth before); the bowl's core (inside 0.9 of its ellipse) at the stadium's level at 99.3% of
  its points every 2 m, the rest easing up to the streets at its edge (1.2 m at most, at (89, 1271)).
  The paths in its reach still follow the bowl (18 of 39 points more than 15 cm off, 0.29 m at most):
  the task named the carriageways and pavements, and the stadium's own paths are in it.
- **Shot:** `estadio` before and after (`before049`, `after049`, with `../braga-map`'s viewpoints):
  the same, no worse; three views of the street beside the stadium from a scratch list: the service
  road out of its trench, a bank down to the stadium beside the primary road where a grey face stood,
  and the pitch and stands from above, the same.
- **A lap in the browser** with the autopilot and three bots, after merging party-kart's `main`:
  5:08.6, third of four, the three who finished within 0.12 s of each other; no page errors.
- **Landed** (2026-10-17): party-kart's `main` merged into `task-049` and pushed as its `main`
  (`8c1fdd5`, braga-map 1.21.1). No braga-map version: nothing in braga-map changed. Not deployed:
  the planning session deploys it with 021, 026 and 056.
- **Done** 2026-10-17.
- **Deployed** 2026-10-18 from party-kart `96b3ebb` (braga-map 1.22.0), with 021, 026, 056, 057 and 049 together, at the owner's word: the live page serves the build (`index-CM6aZCpG.js`), and on it a race with the autopilot and three bots went over the jump, landed on the street and drove on, with no page error.
