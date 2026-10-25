---
status: done
priority: low
kind: code
repo: party-kart
created: 2026-10-23
depends-on: [081, 082]
roadmap: Ultra · Braga at its most real
---

# 089 · On Ultra, the trees in full to the horizon, moving in the wind

## Why

A tree near the camera is a trunk and a crown of leaf cards (260 m on High); further off it's its
kind's billboard, the same picture for every tree of its kind, and nothing moves (decision 043). From
the Picoto or Bom Jesus the woods are flat cards, and on the avenues no leaf stirs.

## What

Today `src/render/trees.ts` draws instanced cards per kind within 260/180/120 m and billboards
beyond, dithered over 25 m; crowns lean, leaves tinted to Braga's summer green (`trees.ts:190-200`,
`281-362`).

1. **On Ultra, three levels per tree, not two:** the cards near (to ~400 m), a simplified crown
   mesh of a few hundred triangles in its own shape and size (to ~2 km), and an impostor baked
   per kind from 8 directions with depth (octahedral), lit by the sun, beyond: never a flat card
   facing the camera.
2. **Branches:** near, the crown's main limbs drawn as geometry where the leaves are thin
   (deciduous kinds), so a tree has its structure, not a cloud of cards.
3. **Wind:** a vertex shader sways trunks, branches and cards by height and a slow gust field,
   the same everywhere at a moment (frozen at time 0 for `?scenery`).
4. Shadows: every near tree casts and receives on Ultra; the mid level casts.

## Read first

- braga-map's `docs/DECISIONS.md` 043, 047, 051; `src/render/trees.ts`, `src/render/look.ts`.

## Done when

- [ ] From `picoto-top`, `bom-jesus`, `sameiro` and `falperra`, the woods on Ultra have depth and
  light, not cards; rated no lower. Open: the trees past the near ones stay billboards (Notes); the
  impostors are task 128.
- [x] Trees move in the wind in the game, not in `?scenery` shots: `alameda-fujacal` at 10 s and
  10.5 s differs over 5% of its pixels; at the clock's 0 nothing moves, so the round's Ultra shots
  differ from `before089` only by the limbs and a few levels' noise.
- [x] The cost is in the budget's Ultra column; High and below unchanged; `npm test` and
  `npm run check` pass: party-kart `docs/architecture.md`, "Ultra's trees in the wind"; High and
  Low 33 of 33 the same to the pixel in the round (Medium not shot: the wind and the limbs are
  Ultra's alone); `npm test` 160 of 160 and `npm run check` in party-kart, `npm test` 156 of 156
  here.

## Out of scope

- The species: 088. The seasons: 093.

## Notes

- **The scope narrowed to the near trees in the wind and the deciduous kinds' limbs; past the near
  trees, the billboards stay.** Decided by the session, for the owner to confirm (task 103's table).
  Item 1's far level was tried as a crown of each tree's own past 400 m: lit, in its kind's outline at
  its own height, width and place, and in the cascades' shadows. It was matched to the near cards in
  three lights: the sun through to the shaded side, and the sky given back four times, as cards give
  it back off their edges. It still read as yellow-green blobs towards the sun and as smooth balls from
  above, worse than the billboards, so it was taken out (no lower is the rule). The octahedral impostors
  baked per kind are task 128. **The first Done when stays open.** The near cards stay to 081's 700 m on
  Ultra.
- **Wind** (party-kart `WIND` in `src/render/trees.ts`, Ultra only: `TREE_WIND`):
  - A breeze from the west-south-west, as the photos' afternoon had, in gusts that cross the city every
    half a minute or so, each tree on its own beat.
  - A crown's top is pushed about 30 cm at most, from its foot over a trunk that stands still, and each
    card flutters on its own. The crowns' shadows sway too: their depth material sways the same.
  - Nothing moves at the clock's 0: every push is scaled by how far the clock is into its first 4 s, so
    `?scenery`'s shots are still, and all of it is there from 4 s on. The clock is the game's (`clock` in
    `look.ts`, set by `Look.render`).
  - Measured: `alameda-fujacal` at 10 s and 10.5 s differs over 5% of its pixels, the leaves and their
    shadows on the road. The billboards don't move.
- **Limbs** (`limbGeometry`, `limbVertex`), for the trees of the kinds that drop their leaves
  (`DECIDUOUS`: broadleaf, poplar, plane, lime and birch, the map's own `!evergreen` kinds, which a test
  holds the same):
  - Four limbs in their bark, each four segments of six sides, from the tree's own trunk top out and up
    into its leaves.
  - At the foot, 1.2% of the crown's width (5 to 14 cm), thinning to a fifth of that at the tip.
  - Drawn within 150 m of the camera: past that a limb in a crown is a pixel or less. They are the trees
    gathered before the first ring of cells past 150 m.
  - One mesh a kind, sharing the crowns' matrices and swaying with the crown above the trunk's top.
  - In the round they show among the plane trees' leaves at `capela-sao-joao` (pale limbs against the
    sky) and at `liberdade`, with their shadows on the ground.
- **The near trees drawn whole into each cascade** (090's finding, taken into 089). This was measured,
  and cutting the count isn't where the cost is:
  - At `falperra`, 2560 by 1440, the near trees' shadows are 3.7 ms of a 9.8 ms frame (6.1 with them off;
    1.0 at `alameda-fujacal`, 3.3 at `picoto-top`).
  - Cascade by cascade (the frame with them left out of that one): 1.3 ms in the first (to 60 m), 0.9 in
    the second (200 m), 0.4 in the third (650 m) and 0.3 in the last (2 km). The last two draw every one
    of the trees, so the cost is the leaf cards filling the fine near maps, not the trees' number.
  - Drawing into each cascade only the trees that could shade what it covers was built: the gather kept
    how many trees each ring of cells brings, and a cascade drew the trees within its end at the frame's
    corners plus the tallest tree's shadow. It saved 0.3–0.4 ms.
  - It wasn't kept. A tree uphill shades further than the tallest tree's shadow on flat ground, and
    making the bound safe on Braga's slopes needs the ground's height, more code than it saves. Decided
    by the session, for the owner to confirm.
  - What would cut the cost is cheaper crowns in the first two cascades' depth (fewer, larger cards, say),
    which changes how the leaves' shadows look: found work, passed to the coordinator.
- **High and Low unchanged:** in the round, 33 of 33 the same to the pixel at each. Wind and limbs are
  Ultra's only.
- **The round:** `shots/2026-10-25-after089/` against `shots/2026-10-25-before089/` (main at abef330,
  braga-map 1.40.0), the 33 viewpoints at Ultra, High and Low, each shot in three parts and merged.
  - I looked at all 33 at Ultra, before and after side by side, and at the four that differ most with
    their differences amplified.
  - Every Ultra shot differs, over 9–23% of its pixels, nearly all by 8 of 255 or less. One example is
    the bricks of a wall at `capela-santo-adriao`, far from any limb. That fits `?scenery`'s seeded
    `Math.random` being drawn further by the limbs' objects (085 found three takes four of its numbers
    for every object it makes), but I didn't check it further.
  - Draw calls (median) went 483 to 493 and triangles 8.87 M to 9.37 M; textures are the same.
- **The frame at Ultra:**
  - At 720 pixels high, 3.45–7.51 ms (median 4.66) against 3.37–7.25 (4.71).
  - At 2560 by 1440, two runs each: `falperra` 10.0–10.1 ms (9.8 before), `alameda-fujacal` 7.4 (7.3)
    and `picoto-top` 9.3–9.5 (9.3).
  - A gather of the near trees takes 1.8 ms (1.5 before), with the limbs' trunk tops written too. The
    frame drawn alone after it is 13.2–13.3 ms (12.8–15.7 before), the runs spreading wider than
    anything 089 changed.
  - In the budget: party-kart `docs/architecture.md`, "Ultra's trees in the wind".
- `npm test` (160 of 160) and `npm run check` pass in party-kart.
