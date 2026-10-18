---
status: done
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

- [x] `capela-sao-joao`'s and `altice-forum`'s trees are where their photos have them: no trunk in
  front of the camera at the chapel, and no leaves round the camera at the Forum. Neither scores
  lower than in "As árvores" (Claude's 3 and 2).
  > The round "Os troncos" (`2026-10-18-after063`): at the chapel the trunk is gone and the Largo
  > open between the park's trees, its canopy 17 m over the camera, the nearest trunk 13.9 m off
  > (Claude 3 → 4); at the Forum the hall and its α show, the willow's leaves over the camera from
  > 1.8 m above the eye, at the top right as in the photo (2 → 3).
- [x] The test that every viewpoint's camera is clear of the trees passes.
  > `test/trees.test.js`'s "no viewpoint's camera stands by a trunk or in a crown": none within 2.5 m
  > of a trunk (1 m, as asked, passed at both places before: their trunks were 1.63 m and 1.75 m
  > off), none between a crown's foot and its top within its radius of its middle. It passes on
  > 1.25.0 and fails on 1.23.0's world; the nearest trunks now 13.9 m from the chapel's camera and
  > 2.7 m from the Forum's (the willow's lobe, moved off the cycleway).
- [x] How many trunks moved off footways, paths and pavements, in Notes; no viewpoint scores lower
  than the round before.
  > On 1.24.0's streets: 675 moved (354 off a footway, path, cycleway or flight of steps, 321 off a
  > pavement they only overhang), 40 with nowhere under their crowns to go, 2,875 street trees left in
  > their pavements (below). Claude's marks for "Os troncos" against "Até aos muros": 2.88 → 2.94 over
  > the 33 places, two up, none down; the other ten places that changed most are the same but for the
  > crowns a little higher and a trunk or two leaning.
- [x] braga-map's `npm test`, and party-kart's `npm test` and `npm run check`, pass, with the
  autopilot's laps as before and no respawn.
  > braga-map: 123 tests on 1.25.0. party-kart pinned to 1.25.0: 64 tests and `tsc`; the autopilot's
  > laps 302.4 and 300.3 s with no respawn, as on 1.24.0 (052's run, the same to the tenth).

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

### Step 1, 2026-10-18: what's off at the two places

Looked at with `trees.mjs --check`, the point cloud round each camera (every point within 40 m,
from above and along the sight line), the 2025 orthophoto, the photos (the chapel's whole
panorama too), the tiles' paths and 019's shots.

- **`capela-sao-joao`: a piece of a bigger tree's crown, taken for a tree.** The camera is where
  Mapillary puts the panorama, at the head of the walk into the park, between its two pergolas;
  the panorama shows no trunk within 8–10 m all round, and the park's canopy over the camera out
  to the Largo's edge. The "tree" 1.6 m ahead (29 m, crown 7.8 m, foot 17.4 m, classed a cypress or
  cedar for being narrow) is that canopy's south edge reaching out over the Largo: not a point of
  high vegetation under it below 16.3 m, so no stem to find. Its top stands 1.7 m over where it
  meets the 36.4 m crown to its north, but 15.5 m from that crown's top, past the 12.7 m a bump may
  be (`REACH`), so it stayed a tree. Its middle is 4.6 m ahead and its lowest leaves 3.7 m ahead,
  both further out over the open Largo. Two more like it at the Largo's north-east corner (33 m,
  crown 6.9 m, foot 18.9 m; 34 m, crown 4.3 m, foot 20.4 m), 10–13 m to the camera's left. Not a
  leaning tree, and not the camera.
- **`altice-forum`: the camera is under the willow, as in the photo, but the willow is three trees
  and its leaves hang to the eye.** The camera is right: 058 put it 0.46 m inside the cycleway's
  south edge, and the photo stands at the path's right edge. The photo's right-hand tree is a
  weeping willow on the verge between the path and the fence: the LiDAR's top is 2.8 m south of the
  camera (9.6 m, crown 9.1 m, foot 3.5 m), within about 2 m of where the photo has its trunk. Its
  crown reaches over the camera in the photo too (its twigs hang at the top of the frame), and the
  LiDAR has leaves 2.7–9.5 m over the camera's place. But trees.mjs splits it in three: the willow,
  its north lobe over the cycleway (6.9 m, crown 2.4 m, foot 2.5 m; its trunk on the cycleway 1.75 m
  from the camera, the willow's light green in the orthophoto), and its east edge (8.2 m, crown
  2.9 m, foot 4.9 m, a "cypress" 5.4 m ahead, whose thin trunk is the one in the middle of 019's
  shot); each lobe is further from the willow's top than the 3.4 m a bump may be. And party-kart
  hangs the willow's leaves round the camera: a broadleaf's cards are up to 4.5 m, the lowest
  centred 0.5 m over the foot, so they reach down to 1.75 m, the eye's height, and the camera is
  inside the crown's 4.55 m radius. The thick crown at the shot's left (6.8 m, 10.4 m ahead, its
  trunk on the cycleway too) is in the 2025 orthophoto and LiDAR but not the 2019 photo: planted
  since.
- **What the task assumed that isn't so:**
  - Step 2's rules don't find either trunk. At the chapel there are no stem points, and the
    middle and the lowest cell are further into the open Largo; at the Forum the lowest cells are
    the willow's hanging twigs, one of them on the cycleway 1.7 m from the camera. Taken as the
    trunk, each would make its place worse.
  - Step 4's test as written passes at both today: the nearest trunks are 1.63 m and 1.75 m from
    the cameras, and both eyes (1.70 m and 1.74 m over the ground) are under every crown's foot.
- **How common the chapel's case is:** of the 390,000 crowns over the point cloud (251,700 on the
  map), 11,000 are narrow (no wider than 0.35 of their height), hold their leaves in their upper
  half, and meet a taller crown; 5,000 of them are 15 m or taller.
- **The owner's answers (2026-10-18):** a crown with no trunk under it that meets a taller crown
  joins it, and that tree's crown is drawn over all its leaves, off its trunk where it spreads to
  one side (a field on `Tree`, a leaning trunk in party-kart); and party-kart hangs no card of
  leaves below its crown's foot.
- **The owner's answer on pavements (2026-10-18):** moving every trunk off the pavements (1,359 of
  the 1,718 moved) took the street trees out of their pits: at `alameda-fujacal` the near tree left
  the kerb its photo has it at, for the strip between the pavement and the houses. So a trunk on a
  pavement moves only where its crown's middle is off the pavement and the carriageway (a garden's
  tree reaching over its wall); a street tree, its crown over the pavement or the street, stays.

### Where it stands (2026-10-18, not landed)

- braga-map (worktree `../braga-map-063`, uncommitted): `trees.mjs`'s `mergeStemless` joins a narrow
  crown with its leaves in its upper half to the taller crown it meets (10,468 over the point cloud;
  246,269 trees on the map, where there were 251,738); each tree's crown's middle is written as
  `cx, cz` (`index.d.ts`'s `Tree`, two more numbers a tree in the tiles). `world.mjs` keeps a crown
  where it is when its trunk moves, and moves 684 trunks off what people walk on (359 off a path,
  325 overhanging a pavement from nearer its back than its kerb), 41 with nowhere to go, 3,053
  street trees left in their pavements. Made with `TREES=trees-063.json`, main's `trees.json` and
  `dgt/trees/` untouched. The camera test is in `test/trees.test.js` (2.5 m from a trunk, not in a
  crown): it passes here and fails on 1.23.0's world. 116 tests pass.
- party-kart (worktree `../party-kart-063`, uncommitted, braga-map installed from the worktree with
  `--install-links`; the tag goes back before committing): the crown at its middle, the trunk leaning
  into it past half its radius (25° at most), no card below the foot. 64 tests and `tsc` pass; laps
  302.1 and 300.1 s, no respawn, as on main.
- Shots `party-kart-063/shots/2026-10-18-try063all`: the chapel's trunk is gone and the Largo open;
  at the Forum the hall, its α and the willow's leaves overhead as in the photo. Elsewhere the crowns
  sit a little higher; `alameda-fujacal`'s and `31-de-janeiro`'s street trees are where they were.
- Left: wait for 062 to land; merge main, run the remake again (trees into `trees.json`, open,
  shooter, world, tracks, cover, textures, the page), take the next version, pin party-kart to it;
  shoot and post the round; the budget; docs (README, decision, ROADMAP); finish.

### Done 2026-10-18 (braga-map 1.25.0, party-kart `9dcf456` pinned to it, decision 047)

- **Landed** after 052 (1.24.0) and 062: main merged, the remake run again from the trees on (only
  the tiles change: the track, the ground cover, the textures and the page don't read the trees),
  `.cache/trees.json` replaced with this task's (`trees-063.json` until then), tagged `v1.25.0`.
  party-kart pinned to it on top of 052's `a62fd8b`; its peer prefix stays `pk37` (neither the
  track nor the messages changed).
- **The budget** (party-kart's `docs/architecture.md`, `after063` against `after052`, the 33
  viewpoints, High, Medium and Low): the same draw calls and textures, 5,000 to 16,000 fewer
  triangles a viewpoint on High (2.06 → 2.05 M at the median); the download on High 9.43 → 9.56 MB
  gzipped, the tiles' two numbers more a tree.
- **The round "Os troncos"** (`2026-10-18-after063`) is made: 33 shots of its own in 4 sheets in
  `.cache/scorecard/rounds/`, and `refs/rounds.json`. **Not published,** as 052's "Até aos muros"
  isn't: this session's account can't open the scorecard either (the Artifact tool finds no such
  artifact). Claude's marks are ready in `.cache/scorecard/claude-marks-063.json`: the whole of
  `scores/claude` at its version 13 with both rounds added (052's from `claude-marks-052.json`, so
  set this one, pinned to version 13, in its place). To publish: the page, 052's four sheets and these
  four, `data/rounds.json` and `data/viewpoints.json`.
- **Not checked:** the owner's marks; a phone; the deploy (not asked).

