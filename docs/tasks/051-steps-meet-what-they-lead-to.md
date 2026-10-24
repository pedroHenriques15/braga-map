---
status: doing
priority: medium
kind: code
repo: both
created: 2026-10-15
depends-on: [050]
roadmap: Phase 2 · The shape
---

# 051 · A flight of steps meets the street, the path or the land at its foot and its top

## Why

Since task 050 every flight of steps in the open world's area is its treads, each at its height,
and a kart climbs them a riser at a time. But 51 of the 236 flights of two treads or more stand
more than a kart's step (0.3 m) over whatever is beside their lowest tread, so a kart can only
come down them, never go up: in Braga a flight's foot is on the pavement or the street it leaves
from, a riser up.

## What

Today (task 050, `tools/lines.mjs`'s `flight` and `tools/streets.mjs`'s `groundPaths`):

- A flight's ends are at DGT's terrain at 50 cm (`MDT-50cm`) where it has them, else the tiles'
  ground; the first riser at the foot, each tread `(top - foot) / n` over the one before.
- The street or path a flight meets is at the tiles' ground (`height(x, z)`, the 2 m means), and a
  pavement 15 cm over it, so where the terrain's foot is above the tiles' ground the first riser is
  higher than the others; party-kart counts what's over 0.3 m (`ground.counts['tread edges over a
  street over a step']`: 234 of 420 edges, many of them a flight's sides, which are rightly walls).
- Where a flight's foot runs under a carriageway (the map's width, or where it draws the flight),
  its lowest treads are cut away, and the next one up stands two or three risers over the street.

Steps:

1. Measure it: for each flight, what's at its foot and its top (a carriageway, a pavement, a path,
   the land) and how far its end tread is over it; by cause (the terrain's foot over the tiles'
   ground, treads cut away, a door's landing, which is right). A test in `test/paths.test.js`.
2. Where a flight's end meets a street or a path, its end at that street's or path's height as the
   tiles hold it (a pavement's kerb with it), as a deck's end is (decision 023), the risers between
   evened out; where it meets the land, the terrain's, as now.
3. Where its lowest treads are cut away by a carriageway, the flight's treads spread over what's
   left of it, so its first riser is at the kerb.
4. In party-kart, the test that counts the risers a kart can't take says how many flights it can go
   up from their foot, before and after.

## Read first

- `tools/lines.mjs` (`flight`, `pathLines`), `tools/streets.mjs` (`groundPaths`): how the treads are
  made.
- `test/paths.test.js`: the steps' test.
- party-kart: `src/world/ground.ts` (the risers, `STEP`), `test/ground.test.ts` (the steps' tests).
- Decision 023: a deck meets the street at the ground the tiles hold.

## Done when

- [ ] A test says, for the flights in the open world's area, how many a kart can go up from their
  foot, and that's most of them but those climbing to a door or a landing.
- [ ] party-kart's tests pass, a kart up and down a flight among them.

## Out of scope

- The pavements' own heights from their kerbs: task 044.
- The steps' look: their nosing, their material from the photos (task 018).

## Notes

- Found in task 050, 2026-10-15: 51 of 236 flights more than a step over what's at their lowest
  tread (median 0.11 m, 90% under 0.54 m); the terrain's height at a flight's end is within 4 cm of
  the tiles' ground for half the ends, but 27 of 308 differ by more than 0.3 m.
- Walked on foot in task 073, 2026-10-20 (party-kart's walker, a step of 0.3 m, a jump of 0.4 m):
  in the shooter's area, of 13 flights, two have ends that miss what they lead to. The 10 steps at
  (-228.7, 930.4): the top tread (5.94 m) 1.07 m over the path past it, so they can be walked down
  but not up from the top. The 8 steps at (-223.2, 947.0): the lowest tread 0.6 m over the street
  (a jump up), the top 0.85 m over the path past it. Treads drawn over or under the land: task 076.
- **Measured again (step 1), 2026-10-24, braga-map 1.37.0:** 140 flights on the ground in the open
  world's area with two treads or more under their line. Their foot more than 0.3 m over what's just
  past it: 22 (13 a carriageway, 5 a footway, 3 the land, 1 a pavement; the worst 1.87 m, way
  382878426 at (1236, 405)); their top more than 0.3 m under what's past it: 10 (7 a carriageway, 2 the
  land, 1 a footway). (What's past an end: the first thing that isn't a tread within 1.5 m along the
  flight's line; a pavement, island or raised path taken 15 cm over the tiles' ground.)
