---
status: todo
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

Steps:

1. **The ends at the ground's height in the tiles:** take a bridge's or a tunnel's end from the
   ground as the tiles have it (the 2 m grid, in decimetres, as `index.js`'s `height` reads it),
   so the deck and the street on the ground meet to the centimetre; a tunnel's end still the lower
   of that and 4 m out. Keep task 012's checks (`tools/levels.mjs`, `test/levels.test.js`).
2. **The pavements cut back** where a bridge's or a tunnel's carriageway begins, as the
   carriageways are: no pavement on the ground over a piece off it.
3. **Tests** (`test/streets.test.js`): every piece off the ground meets the ground's streets at its
   ends within 5 cm of `height(x, z)`; no pavement on the ground overlaps a carriageway off it.
4. A new tag, and party-kart's ground left as it is (its easing, `GRADE` and `EASE` in
   `src/world/ground.ts`, and the pavement giving way to the road): it costs nothing where the data
   already agrees.

## Read first

- `tools/lines.mjs` (`streetLines`, the ends' heights), `tools/terrain.mjs`, `tools/world.mjs` (how the heights and the
  2 m grid are packed), `tools/streets.mjs` (the ends' cut, the pavements), `tools/levels.mjs` and
  `test/levels.test.js` (task 012's checks), `test/streets.test.js`.
- party-kart's `src/world/ground.ts` (`Piece`, its `joins`, and the edges' probes in `worldGround`),
  which measured it.

## Done when

- [ ] Every deck and tunnel meets the ground's streets within 5 cm of the ground's height, and no
  ground pavement lies over one: `test/streets.test.js`.
- [ ] braga-map's `npm test` passes; party-kart's ground, rebuilt on the new tiles, counts no join
  more than 0.05 m off.

## Out of scope

- Drawing the decks and tunnels (task 035) and driving on them (task 034).
- Where the map puts a bridge's ends, or a deck's real height from the LiDAR's points: task 012.

## Notes

- Found in task 034 (2026-10-14). Not urgent for driving (party-kart eases it), but task 035 would
  otherwise have to ease its drawing the same way.
