---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-24
depends-on: []
roadmap: Phase 2 · The shape: the ground, the streets and the buildings where they really are
---

# 112 · Two buildings where the photos have none: by São João da Ponte's chapel and on the Viriato Amaral Nunes

## Why

Marking the baseline round of 2026-10-24, two viewpoints show a building where their photo has
none, and it's what the eye goes to first: at `capela-sao-joao`, a big grey box left of the chapel
where the photo has the park's lawn and trees; at `viriato-amaral-nunes`, a small dark green building
with an orange roof where the photo has the long wall covered in yellow and blue graffiti (and the
wall isn't drawn). A building the map or the LiDAR found where there's none is a structural error
(Claude's mark 1 at `viriato-amaral-nunes`).

## What

- `capela-sao-joao`: camera (275.7, 989.9) looking to (250.8, 1086.8); the box stands left of the
  chapel, about 15 to 25 m from the camera (`party-kart/shots/2026-10-24-after082/high/capela-sao-joao.png`).
- `viriato-amaral-nunes`: camera (28.6, 1468.4) looking to (-46.3, 1402.1); the building ahead on the
  right, where the photo's graffiti wall runs along the road.

1. **What each is:** an OpenStreetMap building, one the LiDAR found (task 011, `tools/footprints.mjs`),
  a sight, or something else in the tiles; and what the orthophoto and the point cloud show there
  (`node tools/carriageways.mjs --check x,z`, `tools/dgt.mjs`). Is it really there, outside the
  photo's frame or built since (the photos are 2018 to 2025, the LiDAR 2025)? Record it in Notes.
2. **If it isn't there:** why it was made (a wall's top, a parked lorry, a kiosk taken for a
  building), and the rule that keeps it and its kind out (`footprints.mjs`), counted over the map.
3. **The graffiti wall:** whether the map or 013's walls have it; if not, why the LiDAR's walls didn't
  find it.
4. `npm run world`, the tests, and both viewpoints shot again.

## Read first

- `tools/footprints.mjs`, `tools/roofs.mjs`, `tools/walls.mjs`; decisions 025 and 033.

## Done when

- [x] Both viewpoints show what their photos have there (before and after), marked no lower.
  > The round `t112-after` against `t059-before-137` (party-kart 74436ae, braga-map 1.37.0), marked by the
  > coordinator (`.cache/scorecard/marks/after112.json`): `viriato-amaral-nunes` 1 → 2 (the wall there,
  > hiding the house; its paint isn't drawn), `capela-sao-joao` 3 → 4 (the box gone), `estadio` 3 → 3.
- [x] The rule's count over the map in Notes; `npm test` passes.
  > Notes: 155 of the map's walls the ground steps along have a height, 137 drawn higher (5.2 km); one
  > LiDAR building marked `not`. `npm test` 154/154 on main's tree with the world rebuilt from the
  > shared `walls.json` in the merge turn.

## Notes

- Found by the coordinator marking the baseline round `2026-10-24-after082` (2026-10-24).
- **What each is (step 1, 2026-10-24, braga-map 1.36.0):**
  - `capela-sao-joao`: the grey box is one of the buildings the map lacks, found in DGT's LiDAR (task
    011, `roofs.mjs`'s `missing`): at (283.8, 1002.6), 50 m², 3.5 m tall, 10 m ahead of the camera and
    11 m to its left. The orthophoto there is deep shade under the park's trees, with a small pale blue
    object (a tarp?) and no roof to be seen; the photo (Mapillary, 2024-07-20) has lawn and trees
    there. `missing` drops what the photo shows green over most of: in the shade, it isn't green.
  - `viriato-amaral-nunes`: the green house is OpenStreetMap's way 591790709 (building=yes, about
    17 by 7 m, 120 m², 4.2 m tall), at (1.8, 1448). The orthophoto has a long low roofed building
    there, at the road's edge. It's real: task 017's session noted it in `refs/buildings.json` as
    "hidden behind the white boundary wall, the graffiti-mural wall and the trees; only flagpoles show
    over the wall" (the photo, Mapillary, 2018-04-28). **This half of the premise is false:** the
    building is there; what the game lacks is the walls in front of it, about 3 m tall in the photo.
    Along that side of the road the map has only a retaining wall 0.91 m high (from (40.5, 1470.5) to
    (0, 1451.5), its top 44.6 to 46.3 m): the ground's step, not the wall over it. So the fix here is
    step 3's (the graffiti wall), not the building.
- **The painted wall (step 3), first look:** the map has it: OpenStreetMap's barrier=retaining_wall
  along the road's north side, from (40.5, 1470.5) to (0, 1451.5). `walls.mjs` gives a retaining wall
  of the map's only the terrain's drop across it (`w.h = Math.abs(mm.drop)`, 0.91 m here), not the
  parapet `measureStep` measures over its higher ground (and caps at 1.2 m); and it drops a hedge over
  1.5 m tall within 3 m of a retaining wall as the bank's growth, naming this very wall ("the Avenida
  Doutor Viriato Amaral Nunes's trees over its painted wall"). In the photo the wall stands about 3 m
  over the pavement. To check: what the point cloud has along its top, its height over the higher
  ground, and whether that's the wall or the trees.
- **The painted wall, measured (the point cloud's 50 cm rasters, `walls.mjs`'s):** across its line
  every 4 m, the road's side is its higher side (0.6 to 0.8 m over the yard behind, 1 to 3 m out), and
  0.5 to 1 m from the line on the road's side the cloud has points 2.6 to 2.9 m over the terrain, at a
  steady height all along its 40 m (2.2 m at its west end): the wall's top, not trees (a crown's
  height wanders). Most are flagged green (NDVI over the raster's −4): the paint, it seems. So the map
  draws the wall as its step only, flush with the road on the road's side, and nothing hides the
  building behind it. The fix is `walls.mjs`'s: a retaining wall's height over its higher ground
  measured from what stands on its top at a wall's steady height, green or not, to about 3 m.
- **The chapel's box, measured:** the point cloud has a roof there, sloping from 3.4 to 5.0 m over
  the ground, a few points classed building in each 50 cm cell, under trees 20 to 29 m tall; its
  points' own colour is blue over 84% of it, green over 1%, with trees over 22% of it. With the
  orthophoto's pale blue object and no roof to be seen through the crowns, and the photo of July 2024
  showing lawn where it stands, it looks like a tent or a stall with a tarp over it, standing when DGT
  flew in 2025: the Parque da Ponte is where Braga's São João festival sets up. Rules tried, counted
  over the map's 7,251 buildings the LiDAR found: trees over half of it and its points green over
  half: 1 building (not this one); inside one of the map's 68 parks: 22, 6 of them in the Parque da
  Ponte, and two of those checked on the orthophoto are real (a round kiosk's roof, glasshouses);
  under 100 m² with its points blue over half: 570 (shadows read blue). None picks it out alone.
- **What it is:** task 017's session saw it in a photo and wrote in `refs/buildings.json`
  (`lidar/x284z1003`): "hidden behind the parked vans and a motorhome, in the trees' shade". The
  LiDAR's "building" is those vehicles, parked side by side under the trees (a motorhome's roof is the
  orthophoto's pale object): one blob 7 m wide, too wide for `missing`'s vehicle rule (a lorry or a
  bus, under 3.2 m wide), and not on one of the map's car parks.
- **Over the map, a lead for another task:** 85 of the LiDAR's buildings stand on one of the map's car
  parks (amenity=parking), 66 of them under 4.6 m tall: vans or lorries parked side by side, or the car
  parks' shade canopies, either of which a game draws wrong as a solid building.
- **Why the painted wall comes out its step only (`walls.mjs`):** the map's retaining wall isn't
  measured as a step there (the terrain drops 0.6 to 0.8 m across it, under the metre `measureLine`
  asks), so its top is the ground at its line plus the height of the wall's and hedges' cells along it
  (0.91 m). Its own top's cells, 2.6 to 2.9 m up (no crown over most of them), are in neither mask:
  they're green, so they could only be a hedge's, and a hedge's must be clear of anything a metre and
  a half either side, where the building behind the wall stands against it.
- **braga-map-112's .cache is its own (the coordinator's go-ahead, 2026-10-24):** `walls.mjs` writes
  `.cache/walls.json`, which every worktree's world build reads, so 112's walls must not reach the
  shared one before 112 lands. Its `.cache` is a real folder: a junction to each of the shared
  `.cache`'s folders, a hard link to each of its files, and a copy of `walls.json` that only 112
  writes; `made.txt` in it lists every one. Nothing is written into a junctioned folder (`walls.mjs`'s
  rasters were all made already). **At cleanup:** `cmd /c rmdir` each junction in `made.txt`, `rm` each
  hard link (a file, never `-r`), `rm walls.json made.txt`, then `cmd /c rmdir` the folder, before
  `git worktree remove`. At landing, `walls.mjs` runs once more in the main tree's turn, so the shared
  `walls.json` is 112's.
- **Why, found measuring it:** the painted wall is OpenStreetMap's way 591790710, `barrier=wall`,
  `height=3`, a wall about 500 m long round the grounds. `walls.mjs` found the ground stepping along it
  (a step the LiDAR found along it, `retaining walls of the map`) and made it a retaining wall, its
  height the step's in each piece (0.91 m here), so the map's 3 m was lost.
- **The fix (`walls.mjs`):** a wall of the map's the ground steps along stays a retaining wall, but as
  high as the map says it is, where it says (`tall`): its top at least that over the lower of its two
  sides' ground, whichever way its piece runs. Over the area: 155 of the map's walls the ground steps
  along have a height; 137 of them are drawn higher, 878 pieces, 5.2 km, by 1.21 m at the median and
  4 m at most (walls the map says are 4 m, on ground that doesn't step). The painted wall: 3 m high,
  its top 2.7 m higher than before, as the point cloud has it. (First tried and dropped: a wall's top
  measured from the point cloud over a retaining wall's higher ground. It missed this wall, measured
  over its whole 500 m, and caught 8 others no photo checked.)
- **The test** (`test/walls.test.js`, "a wall standing on a retaining wall's step is drawn to its
  top"): the painted wall's top over the road 2 m out, at the median at least 2 m. On main's tiles
  (1.36.0): 0.0 to 0.2 m, which it fails on.
- **Rebuilt on 1.37.0 and shot (party-kart main 74436ae, High and Low, all 33):** before
  `party-kart-059/shots/2026-10-24-t059-before-137` (braga-map 1.37.0; 059's before, the same build),
  after `party-kart-112/shots/2026-10-24-t112-after`. The budget unchanged. `capela-sao-joao`: no box
  left of the chapel, lawn and trees where the photo has them. `viriato-amaral-nunes`: the long pale
  wall along the road's right, the house hidden behind it, as the photo has (its paint not drawn).
  `estadio`: the stone wall along the road at the stadium's foot, as its photo has, where a slope of
  land was. `npm test` 154/154 (the painted wall's top 2.3 to 2.5 m over the road). For the
  coordinator's marks.
- **Landed 2026-10-24:** braga-map 1.38.0 (walls.mjs, world.mjs, refs/buildings.json, the world, the
  README, index.d.ts, decision 074); `walls.mjs` run into the shared `.cache` in the merge turn, the
  world rebuilt from it (the same tiles as the branch's). party-kart pinned to v1.38.0. The private
  `.cache` taken apart from its `made.txt` first. Decided by the session, for the owner to confirm:
  the vans by the chapel marked not a building; a map's wall the ground steps along keeps its height.
