---
status: done
priority: critical
kind: code
repo: both
created: 2026-10-24
depends-on: []
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 111 · White shards stick out of the road at a wall's foot in the Travessa Conselheiro Lobato

## Why

In the shot of `travessa-lobato` (main on 2026-10-24: party-kart `2dfa05d`, braga-map 1.33.1), a
row of white triangular shards, up to about a metre high, sticks out of the carriageway along the
foot of the wall on the right, and the wall's foot under them shows a ribbed grey band. Nothing like
it is in the photo or in Braga: broken geometry, in what's shipped (the live build is on braga-map
1.32.0, which has task 077's land at a wall's level, so it's likely there too: check).

## What

The viewpoint stands at (-82.2, 904.2), looking west along the Travessa Conselheiro Lobato towards
(-180.4, 923.2); the shards are along the right (north) kerb, from about 10 to 40 m ahead
(`party-kart/shots/2026-10-24-after082/high/travessa-lobato.png`).

1. **Find what they are:** a retaining wall's or a skirt's triangles (party-kart's
   `src/render/streets.ts`, its outline's walls and skirts), the land at a wall's level (task 077,
   `src/world/land.ts`), a wall of the map's (`world.walls`, task 013), or the street's held ground
   (decision 049). Look at the place with `?scenery&view=` from closer, and in the tiles' data.
2. **Find where else:** the same fault elsewhere in the open world (a test that finds triangles of
   that piece standing over the carriageway beside it).
3. **Fix it** where it comes from (braga-map's data or party-kart's drawing), a test that fails before.
4. Shoot `travessa-lobato` again, and whatever viewpoints step 2 finds.

## Read first

- party-kart's `src/render/streets.ts`, `src/world/land.ts`; braga-map's `tools/walls.mjs`,
  `tools/streets.mjs`; decisions 033, 049, 059.

## Done when

- [x] No shard at `travessa-lobato` (before and after), and the test of step 2 finds none in the open world.
  > The round `2026-10-24-t111-after7` against `-before` (party-kart-111's `shots/`), marked by the
  > coordinator: `travessa-lobato` 2 → 3, the shards gone, High and Low. party-kart's test of step 2
  > (`test/streets.test.ts`) passes over the Volta dos Amigos' box, the city round the open world: no land
  > 0.6 m or more over a street at a wall's foot; 28.5 of 7,974 m of street edge have it 15 cm to
  > 0.56 m over (0.4%; 684 of 6,038 m on main before), where a 2 m triangle spans two holds.
- [x] `npm test` (and `npm test`, `npm run check` in party-kart) pass.
  > party-kart on its main (c373c5a, braga-map 1.37.0): `npm test` 159/159, `npm run check` clean;
  > landed as 28c9e28. braga-map: no code changed (the task's docs and decision 072).

## Notes

- Found by the coordinator marking the baseline round `2026-10-24-after082` (2026-10-24). Priority
  `critical` by the tasks' README: something wrong in what's shipped.
- **What they are (step 1):** party-kart's land, not a wall, a skirt or the street. With the city's
  group `land` hidden, the shards go. Braga-map's ground is a 2 m grid, and party-kart's land mesh
  a lattice of 2 m cells there: where a retaining wall runs across the grid at a slant, the land
  can't step along it, and ramps from the foot's ground to the top's over 2 m and more, so it stood
  up to a metre in front of the wall's face. The painting leaves the land clear under a street only
  from 0.6 pixels in from its outline: along that band, at the street's edge, the ramp showed through
  as the white shards. The same ramp curled the
  street up to the wall (decision 049's held ground is the land's) and sank a street on a wall's top
  down to the foot's ground. Nothing in braga-map's data is wrong: its walls are where the LiDAR's
  step is (decision 059); the fix is party-kart's.
- **Where else (step 2):** a new test in party-kart (`test/streets.test.ts`, "the land steps under a
  retaining wall, not in front of it") walks every street's edge in the Volta dos Amigos' box within
  3 m of one of the map's retaining walls, and measures the land as the city draws it on High from
  the street's edge out to 0.6 m in, and the street's own ground against itself 2 m further out on
  either side. On main's code: the land over the street on 684.5 of 6,037.5 m (11%) of street edge
  at a wall's foot; a street at a wall's foot curled up to it by 0.39 m at the median (1.38 m at
  the 90th percentile, 2.03 m at the 97th), and one on its top sunk by 0.44 m at the median. So not
  only the Travessa Conselheiro Lobato: the fault is all over the box, wherever a street runs along
  a retaining wall's foot.
- **The fix, in party-kart (step 3):**
  - `src/world/land.ts`: `heldAtWalls`. Within 3 m (`STEP_REACH`) of a retaining wall standing 0.5 m
    or more over its foot, the land is held to each side's own ground 3 m out, past the grid's ramp:
    down on the lower side, up on the higher. Eased out over the last metre and over the first and
    last 1.5 m of the wall, where its face tapers out; none where the two sides are within 0.5 m.
    Held first to the wall's own measured top and foot (`ys`, `h`), a street at its foot was held up
    to a metre over itself: those are measured 1.75 m in and as the step's upper quarter. The karts
    and walkers stand on this land, as it's drawn.
  - `src/render/lattice.ts`, `src/render/city.ts`: every lattice cell a wall's footprint touches is
    split, and each triangle a footprint crosses is cut along it (`Surface`'s walls, `Holes.cut`), so
    the step falls under the wall instead of across a 2 m triangle in front of it.
  - A side's ground is never taken past another wall, but half way to it (one alongside, within 37° of
    the wall and across from it, 1.5 m or more out: nearer is the same step drawn twice, decision 059).
    The first round after showed why: at `monte-da-forca`, two walls about 2 m apart (a terrace's two
    tiers) each took its side's ground beyond the other, so the land between them flipped from one's
    foot to the other's top and folded. Now it's a flat terrace there (42.2 m over the upper wall,
    40.1 m between, 37.2 m under the lower). Both walls also hold a street between the one above it
    and the one below to the same ground.
  - With it, the test: 7,974 m of street edge at a wall's foot measured, the land over the street on
    28.5 m of it (0.4%), 0.65 m at worst, at (-398, 1161): a 1.6 m gap in a terrace's lower tier with
    a pavement up through it, where a 2 m triangle spans two holds. The test's bound on the worst is
    0.7 m (the shards were a metre and more). A street at a wall's foot curled up 0 at the median and
    14 cm at the 97th percentile, one on its top 0 and 14 cm. (Without the terrace rule: 24 m, 0.48 m
    at worst, 13 and 15 cm.)
  - `src/world/cover.ts` (the coordinator granted it): the land's change reshuffled the arenas'
    seeded cover, and stood a skip across a kerb that the jump onto it couldn't be taken from. A box
    to climb one by is now put only as a step up onto it, never down a kerb from it nor where a
    walker comes to it off a kerb. **The arenas' cover moves**: topo has 70 things (71 before),
    vilaca 53 (54), santa-justa 54 (54), each in new places, so a player who knows the old layout
    sees it changed. (The terrace rule moved two things a few metres more in each of topo and vilaca.)
- **The budget (party-kart's shots, against the before round, 924347c with braga-map 1.36.0):** the
  first cut split every lattice cell a wall's footprint met into small ones, round all 80 km of the
  map's retaining walls: +22% triangles at the median on High, +24% on Low (after3). Split only as any
  cell is (where the land shows beside a street and its triangles would miss it), but every triangle a
  footprint crossed still cut: +8.2% on High, +13.2% on Low (after4). Cut only in the small cells, a
  big cell's 10 m triangles (20 m on Low) being too coarse for a step to show: after5, below. Draw
  calls unchanged throughout, and the frame no slower.
  After5 (only the small cells cut): +4.9% at the median on High (+6.4% at worst, robert-smith-picoto),
  +7.9% on Low (+11.4%, capela-santo-adriao). It showed the land cracked where a small cell's cut met a
  big cell's side (up to 4.8 m on Low, at capela-santo-adriao): a point the cut made there now lies on
  the big cell's side, with a test of both lattices that failed before it. The round shot with it,
  after6, is the one the coordinator marks.
- **The round marked (the coordinator, High, after7 against before, `.cache/scorecard/marks/after111.json`,
  mean 2.55):** `travessa-lobato` 2 → 3, the shards gone; `couteiro`, `capela-santo-adriao`,
  `alvaro-carneiro`, `bom-jesus`, `monte-da-forca`, `falperra` and `sameiro` unchanged. Three things
  left as they are, said so:
  - `alvaro-carneiro`: a pale ribbed slope now stands behind the kerb: the land's texture stretched
    over a steep face where the land steps under a wall (the coordinator drafts it).
  - `capela-santo-adriao`: the two walls stand whole where the photo has a grassy bank: walls the
    LiDAR found on a steep bank (the coordinator drafts "a steep bank isn't a retaining wall"); before
    111 the grid's ramp half buried them.
  - `monte-da-forca`: a crease where two of the map's walls end 3 m apart, the land between them its
    own slope between the held steps either side. Easing a wall's step out over more than its last
    1.5 m would soften it, but weaken the hold near every wall's end beside the streets: left.
  - Tried and dropped: holding the land on a wall's higher side no higher than its top (it sank a
    street on a wall's top and lifted a walker over the pit wall at (-275, 778.5)); lighting the land
    beside a wall by the gentler slope (no visible change).
- **Landed 2026-10-24:** party-kart 28c9e28 (on c373c5a, braga-map 1.37.0); braga-map the task's file,
  decision 072 and the roadmap, no version. Not checked: the live build (on braga-map 1.32.0), where
  the shards are likely too, with the land's lattice as it was; it gets this with the next deploy.
