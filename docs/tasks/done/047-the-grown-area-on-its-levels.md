---
status: done
priority: high
kind: code
repo: braga-map
created: 2026-10-15
depends-on: []
roadmap: Now · The open world
---

# 047 · The open world grown by Ponte Pedrinha: the Rotunda Santos da Cunha on its three levels

## Why

Task 039 takes the made-up road out of the Volta dos Amigos, and the race now jumps into the dead
end over the Rio Este. To come down the ramp's run-up from the north, the loop swings west by Ponte
Pedrinha and past the Rotunda Santos da Cunha, and the owner chose to grow the open world round it
(3.12 to 3.48 km²). That brought in a junction the map gets wrong: Rua Cidade do Porto and the
Avenida Conde Dom Henrique cross the roundabout on a viaduct, and the Avenida Imaculada Conceição
passes under it in a tunnel. The world lays the viaduct's deck about 6 m too low, 1.2 to 3.3 m over
the streets under it, and the new loop passes under its south end: a kart would drive into it.
braga-map's tests fail on it and on three smaller things the grown area brought, and 039 can't be
released until they pass.

## What

Today (braga-map with 039's work in the tree, uncommitted: `tools/track.mjs`, `tracks/amigos.js`,
`tools/open.json`, `world/`, `map/`). `npm test`: 48 of 52, and these four fail:

1. `test/levels.test.js`, "where streets cross on two levels by the route, there is room between
   them": the viaduct (ways 371203787, Rua Cidade do Porto, and 255580322, Avenida Conde Dom
   Henrique, one way, `bridge=viaduct`, `layer=1`) over the streets on the ground at (-821, 969),
   (-825, 1043), (-820, 1020) and (-821, 1029), 1.2 to 3.3 m between, 11 to 55 m from the route
   (`node tools/levels.mjs` lists them). `levelHeights` in `tools/lines.mjs` takes a deck straight
   between the ground at its ends (task 012). That's right for a bridge over a valley, wrong for a
   flyover with both ends on the ground. Along this one, the LiDAR's ground (`terrain.mjs`) is 4.4
   to 7.6 m and its surface (`heights('mds', …)` in `tools/dgt.mjs`) 7.0 m at the south end, 12.6 m
   over the roundabout and 10.5 m at the north end (heights above ELEV0, 154 m). The point cloud
   (`.cache/dgt/LAZ/-25_208.laz`, `points()` in `tools/dgt.mjs`) has a viaduct's deck as class 26
   (`CLASS.bridge`, task 012's notes).
2. `test/streets.test.js`, "the street on the ground runs into every deck and tunnel on its own
   slope": the viaduct's two ends, (-833.5, 933) 0.12 m and (-833, 1065) 0.22 m off, and the
   Avenida Imaculada Conceição's tunnel's mouths (way 95453435, `tunnel=yes`, `layer=-1`),
   (-775, 975.5) 0.88 m and (-810, 1012) 0.18 m off (task 043's kind: `heldGround` in
   `tools/lines.mjs`).
3. `test/open.test.js`, "a gate wherever a street crosses the edge … each crossed square": the edge
   crosses the Avenida Conde Dom Henrique 72° from square at (-879.1, 851.8), where its two
   carriageways and their links run close together (`square` in `tools/open.mjs`).
4. `test/viewpoints.test.js`, "a kart's viewpoint is on the route": `couteiro` (`refs/viewpoints.json`,
   kind `kart`, at (-613, 1598) looking north up the Rua do Couteiro) is 61 m from the route, which
   now turns west 60 m south of it instead of going on up that street.

Steps:

1. **A deck at its real height.** Where DGT's point cloud has a deck's points (class 26) along a
   bridge, take the deck's height from them: per metre along the way, the median of those within its
   carriageway, smoothed, and held to the straight line's ends where it meets the ground. Elsewhere,
   and where it has none (a short bridge the LiDAR took for ground, task 012), the straight line as
   today. Read the point cloud once, in `tools/world.mjs` or a cache of the decks' profiles (the
   LAZ tiles are big: time it). Check the viaduct comes out within 0.3 m of the surface model's
   top over its middle, and the decks task 012 checked (Alves Palha 27.2 m, Robert Smith 42.6 m) no
   worse. Stop and report if the point cloud has no deck there.
2. **Its ends and the tunnel's mouths on their streets' slopes** (task 043's `heldGround`): make the
   four off by more than a decimetre meet it, or, if one is a walled cutting like task 045's, say
   so and add it to `WALLED` with the owner's agreement.
3. **The gate square** where the edge crosses the Avenida Conde Dom Henrique's carriageways.
4. **`couteiro`** stays, a kart's view of a street in the open world off the route: `route: false`
   in `refs/viewpoints.json`, and the test takes a kart's viewpoint marked so as on a street, not
   on the route.
5. `npm run world`, `npm run page`, `npm test`. Shoot the viewpoints near the junction, if any, and
   the new loop's stretch under the viaduct from above (`node tools/levels.mjs`).

## Questions

- [x] `couteiro` is no longer on the route: (a) keep it as a kart's view of a street in the open
  world, off the route (a viewpoint says so, `route: false`, and the test takes it), recommended:
  the scorecard keeps its 29 and the open world is what's driven now (decision 019); (b) replace it
  with a photo on the loop's new stretch, from Mapillary or Commons (task 008's way); or (c) drop it.
  > (a), kept off the route (the owner, 2026-10-15).

## Read first

- `tools/lines.mjs` (`levelHeights`, `meetings`, `heldGround`), `tools/world.mjs` (where they're
  called), `tools/dgt.mjs` (`points`, `CLASS`, `heights`), `tools/levels.mjs`.
- `docs/tasks/done/012-bridges-and-tunnels.md` (the two kinds of bridge in the LiDAR),
  `done/040-levels-joined-exactly.md`, `done/043-ground-held-at-the-ends.md`, and
  `045-streets-beside-walls.md`.
- `tools/open.mjs` (`square`, `crossings`), `test/open.test.js`.
- `refs/viewpoints.json`, `test/viewpoints.test.js`, decision 009.

## Done when

- [x] `npm test` passes in braga-map, with 039's track and the grown area: 54 of 54, with OSM's
  outline named in two tests and the tunnel's two mouths in `WALLED` (the owner's answers).
- [x] The viaduct over the Rotunda Santos da Cunha is at its height in the world, within 0.3 m of
  the LiDAR's deck over its middle, and `node tools/levels.mjs` finds no deck too low by the route.
  Within 0.1 m at each of its points (12.6 m over the roundabout, 6.2 before); the one crossing
  left "low" by the route is OSM's outline (way 160389857), named in the test.
- [x] Every other bridge's deck is no further from the LiDAR's than before (the decks task 012
  measured), and `npm run world`'s counts of decks and tunnels are unchanged. Of the 45 points of
  other decks the LiDAR saw, in the world before (braga-map `8dc8821`) and now: 29 unchanged, 16
  closer, none further. Still 57 on bridges, 19 in tunnels, 121 under something.
- [x] `couteiro` is as the owner chose: `route: false`, and its own test.

## Out of scope

- The jump, the ramp and the race's road: task 039.
- Drawing the junction in party-kart (its decks, pillars and the tunnel's mouths): party-kart draws
  every deck and tunnel from the map's heights already (task 035); it's shot there when 039 is.
- The streets beside walls, task 045; the corners at a deck, task 046.

## Notes

- Drafted 2026-10-15 from task 039, at the owner's choice: the grown area's four failing tests are
  fixed as a task of their own, before 039 goes on to party-kart. Measured that day: the heights
  above, the four tests' messages. Not yet looked at: whether the point cloud has the viaduct's
  deck as class 26, and how long reading the LAZ tiles takes.
- **Started 2026-10-15.** The point cloud has the viaduct's deck: 16,000 class-26 points within
  3 m of its line, 7.2 m at its south end, 12.8 m over the roundabout, 10.7 m at its north end
  (above ELEV0), where the ground under it is 4.4 to 7.6. A tile takes 10 to 20 s to read.
  - `tools/decks.mjs` (new): every LAZ tile's class-26 points, the median in each metre of the map,
    into `.cache/decks.json` (61,823 metres of deck, 10 minutes, 1.2 MB). `decks()` reads it.
  - `levelHeights` (`tools/lines.mjs`): a bridge's point between its ends takes the deck's height
    where the decks have it 30 cm or more over the straight line (median within 2.5 m, three
    metres or more).
  - `heldGround`: the map ends this viaduct about 10 m short of its abutments, both ends: its south
    end is on the deck at 6.9 m over 4.8 of bare earth. Where a deck is half a metre or more over
    the ground at a bridge's end, the held ground follows it out along the street (up to 40 m, a
    jump of a metre or more skipped: a footbridge or a gantry over the street at the north end, at
    15.3 m) to where it's within 30 cm of the ground, then straight to the LiDAR's 2 m on.
  - `tools/open.mjs`: `square` takes up to 12 rounds, not 3. Straightening one crossing can make
    another off square, and at the Avenida Conde Dom Henrique's fork (two carriageways and two
    links) it took more than 3. Grouping the crossings more loosely (45°, 4 m more) instead put a
    gate 23° off at (1265, 1327) and left four unsquared.
  - `couteiro`: `route: false` in `refs/viewpoints.json`, and a test that a kart's viewpoint marked
    so is in the open world and within 6 m of a street.
  - `npm run world` (with the decks), `npm run page`: `npm test` 51 of 54.
- **The owner's answers (2026-10-15):** the outline is listed as OSM's error and named in the two
  tests (decision 022), and the tunnel's two mouths go to task 045's `WALLED`, six now. Decision 028.
  No viewpoint stands near the junction, so none was shot again; party-kart draws the viaduct from
  the new heights when 039 pins the release.
- **What was left, for the owner:** (1) OpenStreetMap has a closed, unnamed `highway=primary` way (160389857)
  drawn round the viaduct's south ramp, an outline of the junction rather than a street. The world
  takes it for a ring of road: it passes under the deck at (-830, 1058) with 3 m between, and the
  held ground at the deck's south end steps aside for its carriageway, leaving a corner of the deck
  0.47 m over the ground (`levels.test.js`, and `streets.test.js`'s three points where two are
  allowed). (2) The Avenida Imaculada Conceição's tunnel opens under the Rotunda Santos da Cunha:
  at its two mouths the roundabout's carriageway is over the tunnel's road, the held ground steps
  aside for it, and the tiles' 2 m ground takes the roundabout's height into the mouths, 0.88 m
  and 0.18 m off the street's slope: task 045's kind.
