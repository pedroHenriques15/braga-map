---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-18
depends-on: [019]
roadmap: Phase 3 · Surfaces and colours
---

# 063 · A tree's trunk where it stands, not under its crown's top: off the paths, and clear of the cameras

## Why

Task 019 stands each tree's trunk under its crown's highest point, or where OpenStreetMap maps the
tree. A tree that leans, or whose crown spreads to one side, has its trunk somewhere else. At two
viewpoints the camera runs into a tree that its photo has to one side:

- **`capela-sao-joao`** (São João da Ponte's chapel, from the Largo): a 29 m tree's trunk stands
  1.6 m in front of the camera and hides the left of the view. The photo has the Largo open, with
  the park's big trees on both sides.
- **`altice-forum`** (from the path along its fence): the camera stands in the leaves of the tree
  the photo has at its right-hand edge, which hides the hall and the red fence.

The same rule can stand a trunk on a footway, a path or a pavement that a real tree only
overhangs, and a kart hits a trunk.

## What

Today (2026-10-18, braga-map 1.23.0):

- `tools/trees.mjs`'s `measure()`: a crown's place is its highest 50 cm cell (`tm(ti, tj)`), or the
  map's tree where OpenStreetMap has one in it. Its middle (`mx`, `mz`) is measured but not kept.
  The cells' `low` layer holds the lowest point of high vegetation in each. Written to
  `.cache/trees.json`, `[x, z, kind, height, crown, foot, mapped]`.
- `tools/world.mjs` (the trees, after "Trees: every tree DGT's LiDAR found"): a tree on a
  carriageway is moved to its edge where that's within 3 m, else left out. The LiDAR's trees aren't
  kept off footways, paths or pavements; only those filled in where the point cloud wasn't fetched
  are kept off paths.
- party-kart: `src/render/trees.ts`'s `cityTrees` draws the crown over the trunk, with cards from
  its foot to its top; `src/world/ground.ts` stands the trunk a kart hits.
- The cameras: `refs/viewpoints.json`, each on the surface its photo was taken from (task 058,
  decision 041). Task 058 moved `altice-forum`'s 3.7 m onto the path.

Steps:

1. **Look first at both places:** `node tools/trees.mjs --check 275.7,989.9,30 -134.7,1095.1,30`
   over the orthophoto, the two photos (`.cache/refs/`), and the point cloud under the crowns. Is
   the real trunk somewhere else (a leaning tree, a crown spread over the Largo or the path)? Is
   the crown two trees run together? Or is the camera off where 058 put it? Record which in Notes
   before changing anything.
2. **Where the trunk is:**
   - Take it from the point cloud where it can be told: the stem's points low under the crown, or
     the cells whose lowest point of high vegetation is lowest.
   - Else use the crown's middle rather than its top.
   - Draw the crown where it is, over its trunk or off it. If party-kart needs to know a tree's
     lean, add a field to `index.d.ts`'s `Tree`.
3. **Off what people walk on:** a trunk the LiDAR puts on a footway, a path or a pavement it
   overhangs moves to that surface's edge, as `world.mjs` moves those on a carriageway, where its
   crown still covers the new place; else it stays. Count how many move.
4. **The cameras clear:** a test in braga-map's `test/` checks that no viewpoint's camera stands
   within 1 m of a trunk, or in a crown (between its foot and its top, within its radius), unless
   its photo shows it so.
5. Run the remake from the trees on, take a new tag, pin party-kart to it, and shoot the viewpoints.

## Read first

- `tools/trees.mjs` (`measure`, `--check`), `tools/world.mjs` (the trees), `index.d.ts` (`Tree`).
- `docs/tasks/done/019-trees.md`, decision 043; `docs/tasks/done/058-*.md`, decision 041.
- party-kart: `src/render/trees.ts` (`cityTrees`), `src/world/ground.ts` (the trunks).

## Done when

- [ ] `capela-sao-joao`'s and `altice-forum`'s trees are where their photos have them: no trunk in
  front of the camera at the chapel, and no leaves round the camera at the Forum. Neither scores
  lower than in "As árvores" (Claude's 3 and 2).
- [ ] The test that every viewpoint's camera is clear of the trees passes.
- [ ] How many trunks moved off footways, paths and pavements, in Notes; no viewpoint scores lower
  than the round before.
- [ ] braga-map's `npm test`, and party-kart's `npm test` and `npm run check`, pass, with the
  autopilot's laps as before and no respawn.

## Out of scope

- Which species each tree is: task 061.
- The seasons: "Later" in the roadmap.
- Moving a camera, unless step 1 finds the camera, not the tree, is off.

## Notes

- Found by task 019's round, "As árvores" (2026-10-18); drafted by the planning session. Measured
  from `.cache/trees.json` at braga-map `e655502`:
  - At `capela-sao-joao`: the crown's top 1.6 m from the camera, 1.5 m ahead of it, on a tree
    classed a conifer, 29 m tall, its crown 7.8 m wide with its foot at 17.4 m.
  - At `altice-forum`: a broadleaf 6.9 m tall, its crown 2.4 m wide with its foot at 2.5 m, 1.8 m
    to the side; and one 9.6 m tall, its crown 9.1 m wide with its foot at 3.5 m, 2.8 m away, so
    the camera is under it.
  - No other viewpoint has a trunk within 2.5 m of its camera, or stands under a crown whose foot is
    lower than 3.5 m.
- Claude's comments in "As árvores":
  - `altice-forum`: the photo's right-hand tree is there, but the camera is inside its crown,
    which hides nearly everything.
  - `capela-sao-joao`: the park's big trees on both sides, as in the photo, but a thick trunk in
    front of the camera hides the left of the view.
