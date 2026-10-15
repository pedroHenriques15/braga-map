---
status: todo
priority: low
kind: code
repo: braga-map
created: 2026-10-15
depends-on: []
roadmap: Now · The open world
---

# 046 · A junction's corner stops where a deck begins

## Why

`tools/streets.mjs` rounds each junction's corners from the ground's streets alone, then cuts the
ground's carriageway back where a deck begins. Where a dual carriageway meets two parallel decks,
the rounding fills the gap between its two carriageways and runs on past the decks' end line,
between the decks, where nothing cuts it: a strip of road down in the gap between two bridges.

## What

Today (2026-10-15):

- `streetSurfaces` (`tools/streets.mjs`) makes each group's carriageway (`made`), and at each node
  where two or more arms meet, a corner: the carriageways round the node closed (grown, then
  shrunk) by the kerb's radius (`R_KERB`), within a disc (`fills`). It then cuts the ground's
  carriageway where a bridge's or a tunnel's carriageway begins (`g.cut`: the deck's own
  carriageway, round its ends), which leaves what lies past the end's line beside the deck.
- **The Avenida Robert Smith's west end** (the decks' ends at (1505.5, 1070) and (1505, 1078.5),
  8.5 m apart, each 7 m wide, meeting a dual carriageway of two 3.8 m ways and two link roads): the
  corners at the two ground nodes fill the 4.5 m between the two ground carriageways and run on
  past the end line between the decks, about 1.5 m wide and 13 m long (about 20 m²), at the tiles'
  ground (task 043 holds it level for 6 m under the decks; beyond, the embankment 3 m down).
- A deck's end can lie in a junction whose streets on the ground cross there (the Avenida 31 de
  Janeiro's deck over the João XXI's tunnels, its ends at (551.5, 250) and (543.5, 234.5), with the
  João XXI's ways across them): their corners are real and stay.

Steps:

1. Find every place in the area where the ground's carriageway lies past a deck's or a tunnel's
   end line, within its width and a few metres, and isn't a street on the ground's own band (only
   a corner's fill).
2. Cut a corner's fill back at the end's line (the region past it, round the end), as the
   carriageways are, but not a street that crosses there.
3. **Test** (`test/streets.test.js`): no corner's fill of the ground's carriageway lies past a deck's
   or a tunnel's end line in the area.

## Read first

- `tools/streets.mjs`: the corners (`fills`, `R_KERB`), and "Where a bridge or a tunnel meets the
  ground's streets…" (`g.cut`, `g.ends`, `behind`).
- `test/streets.test.js` (`joins`, and the deck-end tests).

## Done when

- [ ] No corner's fill past a deck's or a tunnel's end line in the area (the strip at the Robert
  Smith's west end gone), the test passes, and braga-map's `npm test` passes.
- [ ] The viewpoint `robert-smith` shot again, no worse.

## Out of scope

- The ground under the decks' ends: task 043.

## Notes

- Found in task 043 (2026-10-15): before 043 held the ground under the decks' first metres, the
  strip's edge was 8 of the 32 deck points "by ground half a metre or more off" a deck.
