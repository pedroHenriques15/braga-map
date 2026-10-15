---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-15
depends-on: []
roadmap: Now · The open world
---

# 048 · No slivers in the streets' surfaces

## Why

The carriageways in the tiles have slivers that aren't in the street: cracks of no width where two
carriageways touch (down the middle of the Avenida da Liberdade, where its two halves are drawn as
one), and thin spikes of pavement into a carriageway, one 3.2 m deep and 0.5 m wide on the route at
(504, 980). A game draws a spike as a sliver of calçada in the road with a kerb round it, and a kart
bumps over it. The race's road (task 037) takes those under 1.2 m wide as road, so the race doesn't
wall them, but free roam and the drawing still have them.

## What

Today `tools/streets.mjs` makes each group's carriageways as the union of its streets' bands and
the corners' fills, pieces by surface (`taken`, `bySurface`), cut to the tiles and snapped to 10 cm
(`addShapes`), and the pavements, reservations and islands from what's left. Task 037 counted 1,131
points in the open world's carriageways' outlines where the two edges meet at under 25° and both
are over 0.5 m long, 107 within 15 m of the route (its scratch script, not committed): some real,
the gores where a slip road leaves, some not, like the spike at (504, 980), whose ring runs
(503.8, 976.8) → (504, 980) → (504.3, 976.8) on the carriageway and the same on the pavement.

1. Find where each kind comes from: the snapping to 10 cm (`shapes(…, true)`), the pieces by surface
   meeting, a corner's fill meeting a band, a tile's seam, `CleanPolygons`.
2. Fix it there; or, if that's not to be had, close the carriageways by about half a metre (grown
   then shrunk) before the pavements are cut from them, which fills a notch under a metre wide and
   leaves the kerbs' corners (3 m and more) as they are.
3. A test in `test/streets.test.js`: no notch into a carriageway under a metre wide at its mouth and
   over half a metre deep, and no crack of no width, in the open world's tiles; the gores a slip
   road makes stay.
4. `npm run world`, the tests, a new tag; party-kart pinned to it, its tests, and the race's road
   (`npm run tracks`) made again.

## Read first

- `tools/streets.mjs`: `streetSurfaces`, `addShapes`, `clean`, `shapes`.
- `test/streets.test.js`: what the surfaces are held to.
- `docs/DECISIONS.md` 024 (a game draws the streets on the ground its karts drive on).
- `docs/tasks/done/037-the-race-in-the-open-world.md`: the race's road closes slivers under 1.2 m.

## Done when

- [ ] The test passes: no sliver as above in the open world's carriageways, the gores kept.
- [ ] The spike at (504, 980) and the cracks down the Avenida da Liberdade are gone, seen on the
  streets' page (`.cache/streets/index.html`) and in party-kart.
- [ ] The viewpoints that look down the Avenida da Liberdade (`liberdade`) shot again, and no
  viewpoint worse.

## Out of scope

- The streets' widths and lines, OpenStreetMap's (decision 022).
- The race's road: task 037 made it, and it takes slivers in as it is.

## Notes

- Drafted 2026-10-15 from task 037, which found the slivers walling the race's road until it took
  them in.
