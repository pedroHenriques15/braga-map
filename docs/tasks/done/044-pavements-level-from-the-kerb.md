---
status: done
priority: medium
kind: code
repo: both
created: 2026-10-15
depends-on: [037]
roadmap: Phase 3 · Surfaces and colours
---

# 044 · Pavements level from the kerb, not draped over the ground's bumps

## Why

Since task 035 every pavement in the open world's area is drawn on the tiles' 2 m ground, a kerb
over it (`firm + raise` in party-kart's `src/world/ground.ts`, the same in `src/render/streets.ts`),
fitted to it loosely (50 cm on High). A real pavement is laid level from its kerb, sloping gently
along the street; the 2 m ground under one averages in what's beside it, a building's base, a
bank, a ruin. So pavements crease and heave where the real ones are flat. On the round "Todas as
ruas" (2026-10-15) `bom-jesus` fell from 4 to 2, its camera on a creased pavement.

## What

Today (2026-10-15):

- braga-map's `world.streets.pavements` are outlines on the ground with no heights (`level:
  'ground'`); decks' and tunnels' pieces carry `ys` (`index.d.ts`, `tools/streets.mjs`).
- party-kart draws a ground pavement at `firm(x, z) + raise(x, z)` (`streets.ts`'s `paveY`), its
  triangles halved where the ground bends more than `GRAIN.pave.tol`; karts stand on the same
  (`ground.ts`'s `floor`). A finer fit (tol 6 cm) takes `bom-jesus`'s crease out, but makes the
  bumps sharper where the ground itself rises (`devesa`), and doubles the triangles there (2.28 M
  on High).
- The track's own pavements before 035 sloped from the kerb's top to meet the ground at their back
  (at most 12% up, 5% down), with a granite retaining wall or a skirt beyond: they never creased.

Steps:

1. **braga-map gives each ground pavement its heights** (`tools/streets.mjs`, Questions): a `ys`
   for every ring of each pavement, reservation and island on the ground, as decks' pieces have
   (`index.d.ts`'s `Pavement.ys`, its comment saying so), in the same frame as theirs, with a point
   at least every 2 m along each ring so the heights follow the street. At each point, the top of
   its nearest kerb (the carriageway's ground there, `height(x, z)`, plus the kerb's `h`), rising or
   falling towards the pavement's back at most 2% across (Questions). Between two kerbs (a
   reservation, an island, a pavement between two streets) it runs from one kerb's top to the
   other's. Where a kerb is dropped at a crossing, the pavement slopes down to it over 1.2 m
   (party-kart's `DROP` today), with a point where that slope starts and one where it ends. A path that
   runs in a pavement, flush with it (task 050's `raised`), gets its `ys` by the same rule.
2. **party-kart reads them** (`src/render/streets.ts`'s `paveY`, `src/world/ground.ts`'s `floor`):
   a ground pavement at its `ys`, inside its outline from its outline's nearest edges as a deck's
   `Piece` is, instead of `firm + raise`, and a raised path the same. Drawing and driving stay one
   surface (decision 024). Where the land at a pavement's back is higher or lower than it, a granite
   retaining wall or a skirt meets it, as `streets.ts` does at the streets' outline.
3. braga-map's version goes up and party-kart is pinned to it, as task 050 did.
4. Shoot the viewpoints; measure the budget (task 004): a level pavement needs fewer triangles than
   a draped one.

## Questions

- [x] Where do the heights come from: (a) braga-map works them out and the tiles carry `ys` for
  ground pavements, as for decks, so every game has the same (recommended: the data does it once,
  as decision 023 has it); or (b) each game works them out from the kerbs and the carriageways?
  > (a), 2026-10-16: braga-map works them out once and the tiles carry `ys` for ground pavements.
- [x] How steep may a pavement slope across, from its kerb to its back, before a wall or a skirt
  meets the land behind it: (a) 2%, the cap Portugal's accessibility rules set for a footway's
  slope across (recommended: pavements read level, as real ones do); (b) 12% up and 5% down, as the
  track's own pavements did before task 035 (fewer walls, but they tilt on hillsides); or (c) 5%
  either way?
  > (a), 2026-10-16: 2% at most; beyond that a wall or a skirt meets the land.

## Read first

- party-kart: `src/render/streets.ts` (`paveY`, `GRAIN`, the outline's walls and skirts),
  `src/world/ground.ts` (`floor`, `raise`), `test/streets.test.ts`, `test/ground.test.ts`.
- braga-map: `tools/streets.mjs`, `index.d.ts` (`Pavement`), decisions 021, 023 and 024.
- The round `2026-10-15-task035`: `bom-jesus`, `devesa`, `lobato-pavement`.
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, kerbs and pavements at centimetres,
  each step at its rise: on foot, the 2 m ground shows.

## Done when

- [x] Every pavement, reservation and island on the ground in the tiles has `ys`, and so does every
  raised path: at its kerb within 1 cm of the carriageway's ground plus the kerb, and, except
  between two kerbs, no steeper than 2% across from it (braga-map's `test/streets.test.js`; 172/172
  on 1.45.0's world; the 554 points with no kerb bounding them at the land's, and those a path's mouth
  eases, as Notes say).
- [x] No pavement creases or heaves where the street beside it is smooth: `bom-jesus`, `devesa`,
  `lobato-pavement` shot again, before and after (`2026-10-26-before044b`, main `8750ea3` on 1.45.0
  from a fresh worktree after `npm ci`, and `2026-10-26-after044b`, with `lobato-crossing` and
  `travessa-fujacal`, at Ultra, High and Low: `bom-jesus` level from its kerb to the wall, `devesa`'s
  white hump gone, `lobato-pavement` level as before; one new fault, at `travessa-fujacal`'s end, task
  136).
- [x] `bom-jesus` scores no lower than the round before (3, as in `2026-10-25-after123`; no mark of
  the five moved, mean 2.64, the coordinator's marks at Ultra,
  `.cache/scorecard/marks/2026-10-26-after044b.json`).
- [x] Karts stand on the pavements as drawn (party-kart's `test/streets.test.ts` and
  `test/ground.test.ts`, 169/169 on 1.45.0), and the budget is measured (Notes).

## Out of scope

- The land's own humps where the LiDAR saw a ruin or a building's base as ground (`devesa` at
  (440, 1029)): task 043's kind of work, or 013's walls.
- Where the map's carriageway is off the real road's middle, so a viewpoint's camera stands on a
  pavement or the road: task 026.
- Braga's pavement pattern and the real pavements' widths: task 018.

## Notes

- Found in task 035's round (2026-10-15), from the owner's marks: `bom-jesus` 4→2, `devesa` 3→2,
  `liberdade` 2→1. `devesa`'s white mounds are the land, 2 m over the street at (440, 1029), where
  the LiDAR took a ruin for ground (the owner had flagged it in "Os amigos"); `liberdade`'s camera
  stands on the map's carriageway, wider there than the real road (task 026). Only `bom-jesus`'s
  crease is this task's.
- Answered 2026-10-16. When it's finished, the answers become a decision in `docs/DECISIONS.md`: a
  ground pavement's heights are the data's, level from its kerb at 2% across at most.
- 2026-10-16: party-kart's `streets.ts`, `ground.ts` and `test/ground.test.ts` have uncommitted
  changes from another session (task 013's walls, by the look of `scratch-walls.ts`). Start after
  they land, and don't overwrite them.
- 2026-10-25, done in braga-map (`tools/streets.mjs`, `paveHeights`, `follow`, `mouthsOf`) and
  party-kart (`world/ground.ts`, `render/city.ts`, `world/cover.ts`):
  - **The tiles' format changes.** A piece on the ground (or a path under something at its level)
    laid at heights of its own has 64 (`LAID`) in its first number. Its heights are in centimetres:
    the first in decimetres and the centimetres more, then each point's difference from the one
    before. `index.js`'s streets and paths readers read them, and a reader that doesn't know `LAID`
    misreads the tile, so it's a minor version.
  - **A point along a ring only where the heights need it.** One is added on an edge wherever a
    straight line between its points would be more than 3 cm off the heights, at a quarter, half or
    three quarters of the way, down to 40 cm. Decided by the session, for the owner to confirm (a row
    in task 103). A point every 2 m (step 1) took the tiles from 14.3 to 22.0 MB. At 1 cm they were
    16.5 MB, and High drew 21-31% more triangles. At 3 cm: **15.0 MB against 1.42.0's 14.0 (1.41.0's
    the same), and `loadWorld({ open: true })` in 88-89 ms against 82** (the best of five, twice
    each).
  - **The heights.** On its kerb, a point is at the carriageway's ground right there and the kerb, or
    at the ground where the kerb's dropped. Off it, the kerb's top, rising or falling towards the
    back as the land does, 2% at most. Between two kerbs across from each other (within 45° of
    straight across), it runs from one top to the other. Within 1.2 m of a dropped kerb, it slopes
    down to it.
  - **Which kerb is a point's.** The nearest (within a metre of the nearest) the way to which runs
    over the pavements, crosses no wall they stop at, and keeps 25 cm off a retaining wall's foot.
    Before that rule, a map's sidewalk behind a wall took a lower street's kerb and lay 7 m under its
    ground, and a pavement on a wall's top took the street at its foot round the wall's end. With no
    such kerb, a point is at the land's height and a kerb, as before (554 points of 28,429 within a
    pavement's width).
  - **Where a path on the land leaves the pavements** (its line crossing out of them onto the path as
    it's drawn), the pavement eases back to the land's height and a kerb. It does so within the path's
    half width, then over 12% of the difference (1.2 m at least, 8 m at most), so the path meets it
    with a kerb's step, as before. The passage at (-262, 924) came out onto a pavement 55 cm over it.
    A path that only runs along a pavement's back meets a wall: on the hills, a level pavement
    stands well over the land behind it in places. Steps of over 35 cm where a path's edge meets a
    pavement: 54 m in the open area, against 3 m when the pavements were draped.
  - **A reservation or island meets a pavement at the pavement's heights.** It's laid as one either
    way, so they met 1.2 m apart.
  - **Snap rounding.** The ground's carriageways, pavements and paths are snap-rounded together,
    so they share their points: none cracks open beside another. A passage's floor and the street
    it comes out to had left a 2 cm sliver a building's wall stood in.
  - **The tests.** braga-map: the streets test checks the heights as the rule makes them. 0 of 53,396
    points on a kerb are more than 1 cm off. 0 of 28,429 within a pavement's width are steeper than
    2% but between two kerbs. 554 are at the land's (no kerb bounding them), and 8 are eased by a
    path's mouth. The paths test: a raised path on the ground or under something has heights.
    163/163. party-kart: 162/162; the ground builds in 1.4-1.6 s (main 1.2-1.3 s).
  - **party-kart, the land under and behind a laid pavement.**
    - Under a laid pavement, the land is a kerb under it where it would otherwise stand through it.
    - On a retaining wall's lower side, within its reach, the land rises from a laid pavement's edge
      no more than a metre a metre. Without that, the 2 m ground's ramp across the wall stood up to
      2 m over the pavement at the wall's foot (task 111's test).
    - Where the land behind a pavement is more than 30 cm over it, it's cut along the pavement's
      back as at a retaining wall (`WorldGround.backs`), so it steps up there, the pavement's
      granite face to it (streets.ts already drew that). Otherwise it sloped up over the pavement's
      edge across a 2 m cell. A cell such a cut meets is split where the step's over 50 cm (on Low,
      a metre).
    - In a 300 m box round (418, 1408), the land is over a pavement by more than 5 cm on 68 m²
      and more than 30 cm on 18 m², against 130 and 20 m² on main.
    - The arenas: a box beside a skip may be no more than 3 cm lower than it (`cover.ts`). One 5 cm
      lower left the skip's top out of a jump's reach from the box's.
  - **The budget** (shots `2026-10-25-before044`, main 8ee2879 on 1.42.0 from a fresh worktree, and
    `2026-10-25-after044`; three views at Ultra, High and Low). Triangles: Ultra +2-3%, High +8-12%
    (devesa 2.78 M → 3.12 M), Low +10-16%. Draw calls are the same; frame times are the same or
    lower. The more triangles are the pavements' and carriageways' points (each laid ring's, shared
    by snap rounding) and the land's cuts and split cells at the pavements' backs. A level pavement
    alone would need fewer, as step 4 thought, but not with what laying them level brought.
  - **The shots.** `bom-jesus`: its crease is gone, the pavement level from its kerb to the wall.
    `lobato-pavement`: level as before. `devesa`: the near pavements no longer heave. The white
    mound by the garages at (440, 1029), the ruin the LiDAR took for ground (Out of scope, task
    043's kind), was a pavement draped over it. It's now the land itself behind a level pavement,
    faced in granite up to the land's 2 m triangles, so its top is jagged.
  - **The sawtooth at `bom-jesus`'s kerb** (worker-3, 2026-10-25, found in the coordinator's look at
    the first round): white teeth of calçada under the kerbstones. Ear clipping left long slivers where
    a laid ring's points nearly line up, and the one just inside the kerb ran 19 m along it, taking its
    height from far off: the pavement 5 cm in from the kerb up to 10 cm under the kerb's top.
    party-kart's `tin.ts` `surface()` now flips earcut's triangles to Delaunay's inside the outline,
    keeping its edges. Along the open area's kerbs, 5 cm in, the pavement is more than 2 cm off its
    heights on 2.3 km of 92 (26.6 before the flip) and more than 5 cm on 1.25 km (8.7); the pavements
    take 101 k triangles where they took 136 k, the carriageways 114 k where they took 244 k. A laid
    pavement's outline points take its own height without fail (`ground.ts`).
- 2026-10-26, the coordinator: **landed** while worker-3 was idle (the owner: "finish it"), rebased on
  main's 1.45.0 (116's), its world built again there (tiles 16,745 KB against 1.45.0's 15,728), tests
  172/172 and party-kart's 169/169, check passes. Its round again, five views at Ultra, High and Low
  (`2026-10-26-before044b` and `2026-10-26-after044b`): triangles Ultra +1-2%, High +6-8%, Low +8-12%;
  draw calls the same; frames the same within the runs' spread; pixels over 24 of 255 changed on
  1.4-8.2% of each view. Found: at `travessa-fujacal`'s end a steep pale triangle of calçada climbs the
  bank beside the retaining wall, where the photo has grass and main has the land (on Ultra and High;
  task 136). Its mark stays 3: the rest of the view is as before. Decision 085.
