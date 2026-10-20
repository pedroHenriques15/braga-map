---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-20
depends-on: [051]
roadmap: Phase 2 · The shape
---

# 076 · The land at a flight of steps: never drawn over its treads, nor far under them

## Why

On foot (task 073) a player climbs a flight of steps tread by tread, at a person's height, and
looks at it from a metre away. But the land is drawn over many flights: the 17 steps up from the
Travessa do Fujacal at (110, 657), between two buildings, have the land 0.3 to 1.2 m over their
treads, so a player climbs steps they can't see, inside a granite-coloured slope with the handrail
sticking out of it. Elsewhere a flight stands metres over the land, a staircase in the air.

## What

Today (braga-map 1.29.0, party-kart's `test/walk.test.ts`):

- A flight is its treads, each a path of `kind: 'steps'` with its height (`ys`), made by
  `tools/lines.mjs`'s `flight` from DGT's terrain at 50 cm at its ends (task 050); the land is the
  tiles' ground, the 2 m means (`world.height`), which a flight 1.5 m wide between buildings or down
  a bank doesn't show.
- Measured on 2026-10-20 over the open world's area (the land as party-kart draws it, `land.land`,
  at each tread's middle): of 1,896 treads, the land is 15 cm or more over 565 (28 in the shooter's
  area), 50 cm or more over 339 (17), and 96 treads stand 2 m or more over the land (14 in the
  shooter's area). The worst: up to 4.5 m of land over the treads at (778, 1598).
- In the shooter's area: the 17 steps from the Travessa do Fujacal at (110, 657) to (106.6, 646.1),
  treads 8.49 to 11.38 m, the land 8.77 to 11.56 m; and the flight of 4 and 9 at (285–298, 886–898),
  treads 4.15 to 8.74 m over land at 1.2 to 3.0 m, which a walker falls off.
- party-kart walks a tread whatever the land over it (its `floor` takes the tread), and bridges the
  few centimetres the map leaves between some treads (`Walker.footing`), so the fault is what's drawn,
  and, where the treads are metres over the land, that nothing holds a walker on them.

Steps:

1. Measure it in a test (`test/paths.test.js`): the land over and under each flight's treads, by
   cause (a flight in a cutting between buildings or walls, the tiles' 2 m means; a flight up a
   retaining wall or an embankment the tiles don't have; the treads' heights wrong, from the
   terrain at an end that isn't the flight's).
2. Where the land is over a flight, hold it down to the treads under and beside it, as the land is
   held down in front of a tunnel's mouth (party-kart's `world/land.ts`), or carve the flight into
   the tiles' ground here: whichever keeps the land a game draws and the land it walks the same.
3. Where a flight stands over the land, find which is wrong from the terrain at 50 cm and the
   LiDAR's points: the land (raise it as the bank it climbs, or stand a wall under the flight's side)
   or the treads.
4. Shoot the 17 steps from the Travessa do Fujacal on foot in party-kart, before and after.

## Read first

- `tools/lines.mjs` (`flight`), `tools/streets.mjs` (`groundPaths`): how the treads are made.
- party-kart's `src/world/land.ts` (the land held down at the tunnels' mouths) and
  `src/world/ground.ts` (`floor`, `tread`).
- Task 051: a flight's ends meeting what they lead to (this task's ground, after it).

## Done when

- [ ] A test says how many treads in the open world have the land over them, or stand over it, by
      more than 15 cm, and it's none but where a cause is recorded.
- [ ] The 17 steps from the Travessa do Fujacal are seen on foot, open to the sky, the land beside
      them at their level.
- [ ] party-kart's tests pass, `walk.test.ts`'s steps among them.

## Out of scope

- A flight's ends meeting the street or the path: task 051.
- The steps' look (their nosing, their stone): task 018.

## Notes

Found walking Fujacal in task 073, 2026-10-20.
