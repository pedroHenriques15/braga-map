---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-14
depends-on: [033]
roadmap: Now · The open world
---

# 040 · The levels joined exactly: decks and tunnels meeting the ground at its height

## Why

Where a bridge's deck or a tunnel's road meets the street on the ground, the tiles have them up to
0.66 m apart, and a pavement on the ground runs on over the deck's or the tunnel's road at its end.
A game drawing the streets (task 035) would draw a step there, and one driving on them (task 034)
has to ease the deck down to the land and tell a pavement from the road under it. The data should
join them, once, for every game.

## What

Today:

- `tools/lines.mjs` (`streetLines`) gives a bridge's or a tunnel's points their heights, straight
  between its ends, each end's from `ground.at` (`tools/terrain.mjs`'s ground, which `world.mjs`
  hands it), a tunnel's end the lower of it and 4 m out. The ground in the
  tiles is the 2 m grid `world.mjs` packs, in decimetres (`index.js`'s `height`), which a street
  on the ground takes for its height. The two differ by up to 0.66 m where a deck ends.
- Measured by party-kart's ground (task 034, `src/world/ground.ts`, 2026-10-14, braga-map
  `2581f23`, every piece's edge probed every 2 m): of 480 places where a deck or a tunnel meets the
  ground at grade, 194 are more than 0.15 m off it, 61 more than 0.3 m, the worst 0.66 m: the
  Robert Smith deck's west end 0.64 m (at (1504, 1069)), the Alves Palha's 0.64 m (1368, 369), the
  bridges round (−820, 960–1065) and (1080–1110, 1690–1720) about 0.65 m, the tunnel at (1637, 1265)
  0.62 m. party-kart eases each deck to the land over 10 m from where it meets it.
- `tools/streets.mjs` cuts the ground's carriageways back where a bridge or a tunnel begins (its
  ends' circles, "the ground's stops there"), but not the pavements, which are grown from the
  carriageways' edges after: 1,952 m² of pavement on the ground lies over a deck's or a tunnel's
  road at its end, in about 30 places (the Liberdade underpass's mouths at (120–200, 580–620), the
  João XXI's at (520–560, 240–260), São João da Ponte (300–320, 880–900), the Robert Smith
  (1520, 1060–1080), among them). party-kart lets the road win where they overlap.

Steps (as revised by the answers below):

1. **The ends at the ground's height in the tiles:** take a bridge's or a tunnel's end from the
   ground as the tiles have it (the 2 m grid, in decimetres, as `index.js`'s `height` reads it),
   so the deck and the street on the ground meet to the centimetre; a tunnel's end on the
   cutting's floor, the lowest of that ground from its mouth to 4 m out. Keep task 012's checks
   (`tools/levels.mjs`, `test/levels.test.js`).
2. **The pavements cut back** where a bridge's or a tunnel's carriageway begins, as the
   carriageways are: no pavement on the ground over a piece off it.
3. **Tests** (`test/streets.test.js`): every deck meets the ground's streets at its ends within
   5 cm of `height(x, z)`, and a tunnel's end is on the cutting's floor; no pavement on one level
   lies over the other's surfaces where they're at one height.
4. A new tag, and party-kart's ground left as it is (its easing, `GRADE` and `EASE` in
   `src/world/ground.ts`, and the pavement giving way to the road): it costs nothing where the data
   already agrees. The tiles' ground held to the street at the decks' ends and the tunnels' mouths
   is task 043.

## Questions

- [x] Found when starting (2026-10-14): at a tunnel's mouth the tiles' ground climbs the portal.
  OpenStreetMap puts a tunnel's end node at the portal's face, where the tiles' 2 m ground is
  halfway up it: 2 to 5 m over the tunnel's road at 11 of the area's 14 mouths (the João XXI's at
  (532, 253): 25.2 m 2 m in, 23.2 m at the node, 18.8 m 2 m out, its road 18.5 m). The cutting's
  floor is 2 to 4 m out. So a tunnel's end can't be the lower of the ground at it and 4 m out and
  also meet `height(x, z)` there: the ground is what's off, not the tunnel. party-kart already
  holds its land down to the tunnel's road in front of each mouth (`src/world/land.ts`'s
  `openings`), for driving and drawing. Options: decks in this task, tunnels' ends kept on the
  cutting's floor, and the ground held down at the mouths in a new task (recommended); the ground
  held down at the mouths in the tiles in this task too; or a tunnel's end at the ground at its
  node (its road climbing the portal).
  > Decks now, mouths next: this task makes the decks meet the ground and cuts the pavements back
  > at every deck and mouth; a tunnel's end stays on the cutting's floor; a new task holds the
  > tiles' ground down at the mouths, for every game.
- [x] Found on the way (2026-10-15): at 5 of the area's 20 deck ends the tiles' ground dips into the
  abutment. Its 2 m mean averages in the embankment falling away under the deck: at the node it's
  0.12–0.39 m under the LiDAR, and 0.12–0.48 m higher within 2 m out along the street (three of the
  Robert Smith's four ends, and the dual bridge's two at (−275, 1080)). The deck meeting it exactly
  makes party-kart's world-ground drive fly 1.48 s off the Robert Smith (not the live race, which
  drives the track's road until task 037). Options: keep the decks meeting the tiles' ground, and the
  follow-up holds the ground to the street at the decks' ends as well as the mouths (recommended);
  fix the ground at the decks' ends in this task; or keep the deck at the LiDAR's height at those
  ends, with a step at the join.
  > Follow-up holds both: task 043.
- [x] party-kart's ground can't count "no join more than 0.05 m off": it counts a deck's pavement
  meeting the ground's carriageway (a kerb) as 0.15 m off, holds its land 5 cm under a tunnel's road
  at a mouth, and counts a deck's sides where it rises from the land beside it. Options: reword the
  item to the joins across a deck's carriageway at its end, and finish (recommended); or keep 040
  open until task 043.
  > Reword and finish.

## Read first

- `tools/lines.mjs` (`streetLines`, the ends' heights), `tools/terrain.mjs`, `tools/world.mjs` (how the heights and the
  2 m grid are packed), `tools/streets.mjs` (the ends' cut, the pavements), `tools/levels.mjs` and
  `test/levels.test.js` (task 012's checks), `test/streets.test.js`.
- party-kart's `src/world/ground.ts` (`Piece`, its `joins`, and the edges' probes in `worldGround`),
  which measured it.

## Done when

- [x] Every deck meets the ground's streets at its ends within 5 cm of the ground's height (but
  where the ground there is half a metre or more off the deck, which it doesn't follow: task 043),
  every tunnel's end is on the cutting's floor, and no pavement of one level lies over the other's
  surfaces where they're at one height: `test/streets.test.js` ("a deck meets the ground's streets
  at its ends…", "no pavement on one level lies over the other's surfaces…"). On the area's 20 deck
  ends, 211 points meet the ground, 0.050 m off at most (0.38 m on braga-map `cb41614`'s tiles by
  the same test), 32 by ground half a metre or more off them (39 before); 8 tunnels' ends 0.05 m off
  the cutting's floor at most (0.10 m); at one height, 0 m² of the ground's pavements over a deck or
  a tunnel (692 m²) and 0 m² of a deck's pavements over the ground's surfaces (667 m²).
- [x] braga-map's `npm test` passes (51 tests); party-kart's ground, rebuilt on the new tiles,
  passes its tests, and its joins across a deck's carriageway at its end are within 5 cm but at
  the ends task 043 holds or where the ground across the deck is half a metre or more off it:
  party-kart `ba97308`'s `test/ground.test.ts` and `test/drive.test.ts` on the new tiles, 17 pass;
  on the decks' end lines its probes are 0.017 m off in the middle (0.055 m before), and the 29 of
  152 over 5 cm are at the five dipping ends, the Avenida Miguel Torga viaduct's three ends by the area (the ground across
  it 0.5 m or more off it), and 0.06–0.10 m at four more (its probe 0.4 m out, the decimetres).

## Out of scope

- Drawing the decks and tunnels (task 035) and driving on them (task 034).
- Where the map puts a bridge's ends, or a deck's real height from the LiDAR's points: task 012.

## Notes

- Found in task 034 (2026-10-14). Not urgent for driving (party-kart eases it), but task 035 would
  otherwise have to ease its drawing the same way.
- **Done (2026-10-15).** What changed:
  - `tools/world.mjs`: `tileGround`, the ground as the tiles hold it (each grid point made once, by
    `gridDm`, and kept for the tile's terrain, which is byte for byte what it was on all 140 tiles).
    `streetLines` and `streetSurfaces` take it.
  - `tools/lines.mjs`: a bridge's or a tunnel's ends take `grid`'s ground (the LiDAR's by default).
    A node a street on the ground shares is an end too: on the whole map, two decks fork where they
    meet the ground (São João da Ponte's at (305.5, 875.5), and one at (859, 2045)), and were 0.12
    and 0.44 m off it. A tunnel's end is the lowest of the tiles' ground from its mouth to 4 m out:
    the 2 m grid reaches the cutting's floor 2 m out and rises again (the Liberdade's at
    (123.5, 611): 9.04 m at the node, 7.86 m 2 m out, 8.33 m 4 m out), so "4 m out" alone left
    party-kart's mouths up to 0.52 m off.
  - `tools/streets.mjs`: on a deck, within its end's reach, a point on the end's line or behind it,
    or touching the ground's carriageway at its level, or where the deck took its place, takes the
    tiles' ground, where that's within 0.5 m of the deck (`TWIST`): farther, the ground is an
    embankment's side (a deck wider than the street it meets, or the 2 m grid falling away at the
    abutment), and the deck keeps its height. A point every 2 m along a deck's end line, so it
    follows the street's camber (the Alves Palha's, 13.8 m wide, was 0.35 m over the chord between
    its corners). Wherever a deck or a tunnel's road is within 2 m of the ground (`GRADE`, along its
    centre lines every 2 m, cut square where it stops), the two are one level: the ground's
    pavements, islands and reservations give way to it and to a deck's pavements, and those to the
    ground's carriageway; a deck's pavements stop at its end's line.
  - `test/streets.test.js`: the two tests above, and no point of a deck off its lines' height by
    more than 0.6 m.
- **Found on the way:** the 31 de Janeiro's short deck over the João XXI's tunnels lies wholly
  inside the junction, so cutting the ground's carriageway at its ends left a hole there, which the
  island finder took for a 200 m² island, kerbed, over the deck. And a first try took "touching the
  ground's carriageway round an end" too far: the Alves Palha viaduct's pavement was pulled down to
  the Avenida Frei Bartolomeu dos Mártires 6.7 m under it, 16 m from its end; the at-grade band and
  the 0.6 m test stop that.
- **party-kart, measured with its `ba97308` (its working tree has another session's changes):**
  all its joins at grade, 480 before and 456 after; over 5 cm 361 → 258, over 0.15 m 194 → 123, over
  0.3 m 61 → 54, the worst 0.66 → 0.69 m. Most are along a deck's sides, where it rises from the land
  beside it (the low ramps at (−820, 940–1060) above all), which no end's height changes. Its tunnel
  mouths: 0.05 m in the middle as before (its own land 5 cm under the road), the worst 0.25 m
  (0.15 m). Its world-ground drive flies 1.48 s off the Robert Smith's west end and 0.92 s at
  (−272, 1073), where it didn't: the five dipping ends, task 043.
- **Budget:** the tiles 7,699 KB → 7,704 KB (the points along the decks' ends); no new kind of
  geometry.
- **Not verified:** the viewpoints weren't shot again: no game shows this until party-kart takes the
  new tag (it's pinned to 1.7.0), and the decks are drawn by task 035. party-kart's own `npm test` and
  `npm run check` weren't run in its repo, where another session is working; its committed ground and
  drive tests were, from a copy, on the new tiles. The tag isn't made yet: it goes with the commit.
