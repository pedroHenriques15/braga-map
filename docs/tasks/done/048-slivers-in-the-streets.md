---
status: done
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

- [x] The test passes: no sliver as above in the open world's carriageways, the gores kept.
  > `test/streets.test.js`, "no sliver in the carriageways": in the open world's tiles, at every
  > level, nothing that closing them by 0.4 m fills runs over half a metre in from its mouth (184
  > such notches in 1.16.0's tiles), no hole under 0.3 m wide with nothing in it, and no part of an
  > island under 4 cm wide over half a metre long (78 such cracks in 1.16.0's). And on made-up
  > streets: the wedge at a bend filled, two carriageways 0.1 m apart joined, a 0.5 m median kept,
  > a slip road's gore kept where it's 1.3 m wide and its 0.27 m tip made road. braga-map's
  > `npm test` 87 of 87.
- [x] The spike at (504, 980) and the cracks down the Avenida da Liberdade are gone, seen on the
  streets' page (`.cache/streets/index.html`) and in party-kart.
  > On the streets' page, a box over both (`node tools/streets.mjs 100 600 500 1000`), and in
  > pictures of the tiles before and after: the spike, 3.05 m deep in 1.16.0, gone; along the
  > Liberdade in the open world, the hairline cracks where its side streets of setts meet it (3) gone,
  > and its promenade's, outside the open world's edge. In party-kart (`?scenery&view=`, on 1.16.0
  > and on 1.17.1, side by side): the white point of kerb in the road at (504, 980) is gone, and the
  > promenade's thin points of concrete at its crossings. Its test of the edges two pieces share point
  > for point counts 7,254 where it counted 4,104.
- [x] The viewpoints that look down the Avenida da Liberdade (`liberdade`) shot again, and no
  viewpoint worse.
  > The round `2026-10-16-after048` ("Sem frinchas"), shot on party-kart `d2d8be7` and braga-map
  > 1.17.1, against `2026-10-16-after016`: `liberdade` as it was (its cracks are behind the camera);
  > the most changed shots differ in under 5% of their pixels (a lamp moved with its kerb, a kerb's
  > face drawn whole at `alvaro-carneiro`, an island's point at `lobato-pavement`), none worse.
  > Claude's marks on one scale with the round before's: 2.48 for the 29 places, as before, none
  > up or down.

## Out of scope

- The streets' widths and lines, OpenStreetMap's (decision 022).
- The race's road: task 037 made it, and it takes slivers in as it is.

## Notes

- Drafted 2026-10-15 from task 037, which found the slivers walling the race's road until it took
  them in.
- **Where they came from** (2026-10-16), and what `tools/streets.mjs` does now:
  1. **A wedge outside a bend,** where one way ends and the next begins at a node: each edge's band
     was cut square there, and the corners skip a node that goes straight on, so the outside of a
     bend under 20° stayed open. The spike at (504, 980) is one, 3.05 m deep. Now an edge that goes
     on into one other at its level is round at that end, as wide as the narrower (a way's own bend);
     and so is one that runs on through a junction into another within 20° of straight. Through a
     junction the wedge was another street's surface: the promenade's concrete ran a 3 m point into
     its setts at each crossing, where each crossing bends 5°. The lines painted on a street still stop
     where another's band, cut square, begins: in 1.17.0 they stopped at the round end too, and
     the open world lost 1.8 km of its lane lines and 1.3 km of its centre lines near junctions
     (found in the round's shots, at `alvaro-carneiro`; 1.17.1 has them back to the metre, and the
     test a centre line that runs on to the junction).
  2. **Cracks between two surfaces' pieces,** 1 to 6 cm wide and up to 20 m long (the Liberdade's
     side streets of setts where they meet it, at (237, 687) and (170, 539); its promenade, setts
     against paving, outside the open world's edge): each piece was rounded to 10 cm on its own, one
     with a point on the edge the other didn't have (a T), or a point a centimetre off the other's;
     and Clipper on the 10 cm grid cut off a piece's point where it was under 10 cm wide. Now the
     carriageways are snap-rounded together (`snapRounding`: every edge through every 10 cm square
     a point of theirs is in, after taking the others' points within 2 cm of it), and the rings are
     made simple in centimetres (`rounded`), on the 10 cm grid only where two edges cross.
  3. **Holes where a scrap was dropped:** `addShapes` left out every piece under 0.25 m², and a scrap
     of asphalt in setts left a hole in the road. The carriageways now keep every piece.
  4. **Notches and cracks the map's lines leave:** a spike of pavement 0.4 to 0.65 m wide between
     two streets that nearly meet (as at (556, 858)); carriageways 0.1 to 0.26 m apart that touch
     in Braga (as at (4, 645) and (575, 223)); a long median's two halves joined by a crack. Now
     the carriageways are closed by half a metre where their outline goes into a notch (`closed`:
     a gore's tip under a metre wide is road, and the gore stays from there); a hole under 0.3 m
     wide all along is filled, as the reservations' own threshold says they touch; and an island
     keeps its shape, but where it's under 10 cm wide.
  5. **A hole given to the wrong piece:** clipper-lib's tree, making the rounded rings simple, now
     and then gives a hole to another outline far off: an island at (918, 366) came out as a hole
     of a scrap at (809, 215), and the big piece round it drawn over it (the test that nothing lies
     on anything else found it, 25.7 m²). `rounded` gives each hole to the smallest outline round
     it (`regroup`).
  The seams between tiles and `CleanPolygons` made none of their own.
- **Islands kept as the map draws them, however narrow** (the owner may want this otherwise): the
  task's half-metre closing would have filled the median at (245, 547) too, 0.49 m at its widest,
  which the orthophoto shows is real. Others aren't: at the Liberdade's south end (49, 304), where
  the map draws it as three one-way ways, the orthophoto shows one road where the world has two
  thin islands (0.3 to 1.5 m). Nothing in the map tells them apart; task 026's measured carriageways
  will (noted there).
- **Measured** (the scratch scripts aren't committed; the test is): in the open world's tiles, what
  closing the carriageways by 0.4 m fills over half a metre deep, outside the islands and where no
  deck takes their place, went from 184 to 0; holes under 0.3 m wide with nothing in them, and an
  island's parts under 4 cm wide over half a metre long, from 78 to 0. Along the Liberdade, the
  hairline cracks (what closing by 2 cm fills) from 3 to 0. 238 m² of slivers are closed in the
  area, at every level. In a box over the Liberdade and the promenade, the paving's sharp points
  (under 25°, both sides over half a metre) went from 14 to 5. party-kart, on the local braga-map
  (`--install-links`): 49 tests pass and `tsc` too; its edges between carriageways that meet point
  for point went from 4,104 to 7,254, the outlines that cross themselves from 1 to 0, and the
  carriageways' triangles from 215,171 to 226,576 (+5%: the snapped points, and 106 more pieces, the
  scraps kept).
- **What it costs:** the streets in `npm run world` take 90 s, from 60 (the closing, the snap
  rounding); the whole build about 2 min, from 1.5.
- **Left as it is:** at (231, 688) the Rua Araújo Carandá's setts end square at the Liberdade's
  edge between two asphalt corners, as a tongue in the asphalt. It isn't a sliver: the setts stop
  where the avenue's band does, and a junction's corners take the surface of its biggest street.
  Whether they should take the side street's instead can't be told from the orthophoto there (the
  corners are in shadow, a van on one), and the avenue is wider in it than the map's band (task 026).
- **The round on the scorecard:** `2026-10-16-after048` ("Sem frinchas"), shot on party-kart
  `d2d8be7` and braga-map 1.17.1, at High, Medium and Low, published on "Braga real" (its version
  8), open for marks, with Claude's marks (`scores/claude`). Against `after016`, at the median of
  the 29 viewpoints: the same draw calls (113 on High, 89 on Low) and textures (118, 68 and 42 MB);
  triangles 1.367 → 1.371 M on High, 0.738 → 0.744 M on Low. The city built in 6.1 s on High where
  `after016` took 4.2: the desktop was busier, as 1.16.0 and 1.17.0 shot side by side that
  afternoon both built in 5.9 to 6.5 s, and laying the streets takes 155 ms where it took 149.
- **The round found a fault 1.17.0 had** (Notes, 1): its lines painted stopped short of every
  junction a road runs on through. 1.17.1 has them back, and the test holds them.
- **Done** 2026-10-16 (decision 035). braga-map 1.17.1 (tags `v1.17.0`, `v1.17.1`), party-kart
  pinned to it (`d2d8be7`), not deployed: the roadmap has party-kart's next deploy wait for task 054.
