---
status: done
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

- [x] No corner's fill past a deck's or a tunnel's end line in the area (the strip at the Robert
  Smith's west end gone), the test passes, and braga-map's `npm test` passes.
  > `test/streets.test.js`'s new test finds 0.2 m² past the area's 32 ends in all, where the tiles
  > before had 170 m² over 7 (110 at the Robert Smith's west end); the strip is gone from the tiles
  > and from the game (Notes). `npm test`: 93 pass.
- [x] The viewpoint `robert-smith` shot again, no worse.
  > The round `2026-10-16-after046` ("Entre as pontes"), all 29 viewpoints at High, Medium and Low:
  > `robert-smith` the same as `after017` to the pixel, as it looks west from 145 m past the decks'
  > east end and doesn't see their west end; none of the others changed but for a lamp's glow at
  > `lobato-crossing`. Shot from above the west end and from the trunk road under it, before (1.18.0)
  > and after: the asphalt in the gap between the decks, and the road and kerbed slabs on the
  > embankment under them, gone; the trunk's pavement along its edge.

## Out of scope

- The ground under the decks' ends: task 043.

## Notes

- Found in task 043 (2026-10-15): before 043 held the ground under the decks' first metres, the
  strip's edge was 8 of the 32 deck points "by ground half a metre or more off" a deck.
- **Where the strip came from** (2026-10-16), not quite as "What" has it: the corners at the two
  ground nodes fill the 4.7 m between the two ground carriageways and spill 1 to 2 m past the end
  line, but most of it is the corner where a link road joins the Avenida Frei Bartolomeu dos
  Mártires (the trunk road the decks cross, its node at (1528.4, 1054.6), kerb radius 8 m): closing
  by 8 m, within its 33 m disc, fills the 15 m between the dual carriageway's ends and the trunk's
  west edge, under the decks and between them. `g.cut` took what lay on each deck within 8 m of its
  end; what was left was the strip in the gap, as far as the trunk (x 1505 to 1520), and road on the
  embankment under the decks: 112 m² past the two ends, as the test measures it. The fix is the
  same either way, so the work went on.
- **What `tools/streets.mjs` does now:** each node where a way off the ground ends at one on it is
  a deck's or a tunnel's end (`decksEnds`). Past its end's line, along the bridge's or the tunnel's
  ways (its own and those it meets at its level, to their ends) within their width and 3 m either
  side (`PAST_SIDE`), as far as 30 m on (`PAST`) or a street on the ground that crosses them, the
  corners are cut back, as the ground's carriageways are; but not in the 3 m behind another end's
  line, within its width and 3 m, so where two decks side by side end 1.5 m apart (the Robert
  Smith's) the road meets each at its own line, and their pavements fill the gap between them from
  the further line on (cut at the nearer, it left 2.5 m² of bare ground there). Kept: a junction
  whose street crosses an end (two arms of a street on the ground running on through the end's
  node, across the deck's way: the João XXI's across the 31 de Janeiro's deck), past that end and
  with its own corners wherever they reach, as they lie over the João XXI's tunnels too (without
  that, 101 m² of the junction's middle beside the deck went); and a junction under a deck or over
  a tunnel, its node in that stretch (2 m² over the tunnel at (-1064, 228); without the reach ending
  at the bridge's ends, the T-junctions just past the short bridge at (-434, 1061–1072) lost their
  corners).
- **Step 1, every place in the area** (34 deck's and tunnel's ends meet the ground's streets; the
  fill past them compared with the orthophoto): 944 m² of corners cut back (`world.mjs` prints it),
  435 m² less carriageway (the rest lay under a deck's own carriageway at its end, which took the
  ground's place already), what's left mostly a kerbed island or pavement:
  - the Robert Smith's west end, 88 m²: the strip and the embankment under the decks. Under them
    the trunk's west side now has its pavement, as the map says (`sidewalk=right` on way
    470130212), seen through the gap between the decks; the fill had laid road over it. Its east
    end, 8 m² under the decks;
  - the Liberdade's tunnel's north-east mouth at (207, 576), 163 m² over the tunnel between the
    junction and the mouth, now an island: the orthophoto shows a round planter, paving and trees;
  - the Rotunda Santos da Cunha viaduct's north end, 71 m² beside its ramp, now a kerbed strip
    along each wall. To the west the photo shows the wall; to the east, light grey that may be
    road, past the island;
  - the tunnel at (34, 261), 45 m² of the portal's top between the mouth and the street over it;
  - the two bores at (-1071, 235) and (-1081, 234), the wedge between their ramps past the mouths
    (10 m², the tunnels' strip between two decks);
  - the Imaculada Conceição's tunnel at (-775, 975.5), 14 m² past the mouth beside the ramp, now
    pavement where the photo shows a gore painted with chevrons: road, so a step back, small, at the
    mouth task 045 is to rework;
  - and under decks' ends: the cloverleaf's bridge at (1367–1419, 350–361), 18 m²; (-833, 1065),
    9 m²; (1110, 1691), 7 m².
- **The tiles:** 13 changed, 4 of them (x-1z0, x-2z0, x2z1, x2z2) by a point moved up to 0.4 m far
  from any deck, as Clipper's union of the whole ground comes out a little differently; with the old
  `streets.mjs` the build gives the committed tiles to the byte. Islands 207 → 208. The streets take
  as long (87 s). The Volta dos Amigos' race's road and closures made again (`npm run tracks`): its
  line as it was, all 5,055 points on a carriageway.
- **The test** (`test/streets.test.js`, task 046's): past each end, along the bridge's or the
  tunnel's lines within its width and 3 m, as far as 30 m or a street across them, the ground's
  carriageway that's no street's own band (half its width and 0.9 m round its line), leaving out
  45 m round an end a street crosses and the 3 m behind another end's line: 170 m² over 7 ends in
  the tiles before (36.7 and 73.0 at the Robert Smith's two, 42.1 at the viaduct's north end, 9.7 at
  the Imaculada Conceição's mouth), 0.2 m² in all after.
- **The round on the scorecard:** `2026-10-16-after046` ("Entre as pontes"), shot on party-kart
  `d49612c` with braga-map 1.18.1 installed from its checkout (the commit that pins it to the tag
  changes only `package.json` and its lock), at High, Medium and Low, published on "Braga real" (its
  version 10), open for marks, with Claude's marks (`scores/claude`): 2.48 for the 29 places, as for
  `after017`, each "as in the round before", as no shot changed. Against `after017`, at the median:
  the same draw calls (126 on High, 95 on Low), textures (132, 80 and 47 MB) and triangles (1.67 M
  on High, 0.76 M on Low), no viewpoint more than about a thousand off; the city built in 5.3 s on
  High, 4.8 on Medium, 4.2 on Low. No budget to check beyond that: the task takes surfaces away and
  puts a few kerbed islands where they were.
- **Found along the way, not done:** the decks' pavements (1.5 m each side, as party-kart draws
  them) fill the 2 m gap between the Robert Smith's two decks, from the further end's line on, where
  the orthophoto shows the gap open; it was so along the decks before, and now reaches their ends.
  Two decks side by side would want no pavement between them. Not drafted as a task here, as
  another session is drafting in parallel (021): for the owner to take up.
- **Done** 2026-10-16. braga-map 1.18.1 (tag `v1.18.1`), party-kart pinned to it (`5e681ee`):
  `npm test` (49) and `npm run check` pass, and a lap of the Volta dos Amigos with the autopilot and
  three bots, through the Robert Smith's decks, took 5:00.6 with no error. Not deployed: the roadmap
  has party-kart's next deploy wait for task 054. No DECISIONS.md entry: how a corner stops at a
  deck's end is in the README, under `streets.mjs`.
