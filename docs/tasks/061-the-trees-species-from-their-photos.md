---
status: doing
priority: low
kind: code
repo: braga-map
created: 2026-10-18
depends-on: [019]
roadmap: Phase 3 · Surfaces and colours
---

# 061 · The trees' species from their photos

## Why

Task 019 put every tree where the LiDAR sees it, at its height and crown, but named its kind from
what OpenStreetMap tags (a few hundred trees), the wood it stands in (COS2025, a wood of 1 ha by its
main species) or its shape. So the Parque da Ponte's old plane trees are eucalyptus, as COS2025 has
the park's wood; a palm the map doesn't name is a broadleaf; and the avenues' hackberries, limes,
planes and clipped round limes are all one broadleaf. The viewpoints' and the reference photos
(task 008) show what they are.

## What

Today (task 019, decision 043): `tools/trees.mjs`'s `kindOf` names each tree's kind from the map's
tags, else COS2025's wood, else its shape (narrow and tall, held high, dark in the near-infrared);
six kinds, `KINDS`. party-kart draws each kind's shape in its photos (`render/trees.ts`).

1. **Look at the trees in each viewpoint's photo and in the reference photos along the route**
   (`refs/photos.json`, `.cache/refs/`): what each tree near the camera is (a plane, a hackberry,
   a lime, an oak, a birch, a palm, a cypress, a eucalyptus, a pine), matched to the tree the world has
   there (`node tools/trees.mjs --check x,z` draws them over the orthophoto).
2. **Record them** in a file of the trees seen (`refs/trees.json`, as `refs/buildings.json` records
   the facades seen): a tree's place and its species, and the stretches of street a species lines
   (an avenue's row is one species).
3. **Take them first** in `kindOf`, before COS2025's wood: a tree seen, and the trees of a row seen
   along the same street.
4. **New kinds** where they look different enough to draw apart: the plane tree (pale, mottled bark,
   broad leaves), the clipped round crown of the Imaculada Conceição's limes, the birch (white bark).
   Each with its bark and leaves (`refs/textures.json`, Poly Haven), and its shape in party-kart.
5. **Deciduous or evergreen**, for the seasons ("Later" in the roadmap): each kind says which.

## Read first

- `tools/trees.mjs` (`kindOf`, `osmKind`, `woods`), `docs/tasks/done/019-trees.md`, decision 043.
- `refs/buildings.json` and `tools/buildings.mjs`: how the facades seen are recorded and taken.

## Done when

- [ ] Every tree in view of a viewpoint, within 60 m of its camera, is the species its photo shows,
  checked at the viewpoints (`sao-joao-da-ponte`, `capela-sao-joao`, `imaculada-conceicao`,
  `porfirio-da-silva`, `31-de-janeiro`, `joao-xxi`, `liberdade`).
- [ ] The rows along the route's avenues are their species the length of the avenue.
- [ ] What new kinds add is measured against the budget.

## Out of scope

- The seasons themselves (bare plane trees in winter, the jacarandas in flower): "Later".
- Where each tree is and how big: task 019.

## Notes

- From task 019 (2026-10-18): the Parque da Ponte's trees by São João da Ponte's roundabout are big
  plane trees in the photo (`sao-joao-da-ponte`), drawn as eucalyptus with high feet, as COS2025's
  wood there is a eucalyptus one.

### Checked against main first (2026-10-18, braga-map 1.26.0, after 063's `trees.mjs`)

- "Today" is as the task has it, with what 063 changed: `mergeStemless` joins a narrow crown with no
  trunk under it to the taller crown it meets (10,468 limbs), so the Parque da Ponte's canopy over the
  Largo is a few big crowns, not narrow "cypresses"; and each tree carries its crown's middle (`cx`,
  `cz`), which `world.mjs` keeps where it is when it moves a trunk off a carriageway, a path or a
  pavement. So a tree seen is recorded by its crown's middle (what a photo and the orthophoto show,
  and what stays put), not its trunk. 246,269 trees: 165,048 broadleaf, 71,721 eucalyptus, 4,773 pine,
  2,525 cypress or cedar, 2,199 poplar, 3 palms.
- The tiles hold a tree's kind in 3 bits: room for 8 kinds, and the task's three new ones make 9. The
  tree's word is 16 bits since (kind in 4, written as a signed 16-bit number, read as unsigned).
- `joao-xxi`, in "Done when", was dropped by task 052; its photo is still read, for the João XXI's
  trees.

### Step 1, 2026-10-18: what the photos show

`tools/species.mjs mark` numbers the trees within 60 m of each camera on its photo and on the
orthophoto round it (`.cache/species/`); 87 trees in view of the seven viewpoints, each looked at,
the reference photos along the avenues (Mapillary's and Commons') for the rows.

- **The Parque da Ponte's big trees are limes, not planes.** The task (and 019's note) has them as
  planes. Commons' photo of the bandstand (`landmark-parque-da-ponte-2`, 29 June 2023) has their
  heart-shaped leaves against the sky and their crowns white with flowers, as limes are in late June;
  from the chapel's Largo and the roundabout they're dark, dense crowns of layered sprays on dark ridged
  trunks. The planes are a few among them: the pale, open tree left of the chapel, its trunk mottled
  grey, green and cream (`capela-sao-joao`), and those across the roundabout towards the Devesa, further
  than 60 m. The work is the same (the photos say what each tree is); the park needs the lime more than
  the plane.
- **The Porfírio da Silva's white trees are white poplars, not birches.** Pollarded, upright shoots of
  small leaves, white bark with dark lenticels, black and fissured at the foot; the same trees by the
  31 de Janeiro shed a poplar's cotton in May (`bridge-way-239609145-2`). The birches are on the 31 de
  Janeiro (white trunks, fine twigs hanging) and one on the Liberdade.
- **The Imaculada Conceição's clipped balls** are limes by their small pale leaves (not sure from a
  2018 photo); since grown out (the LiDAR's crowns, 2025, are 16 m wide, from 9 m up).
- The species seen, by kind: limes (the park, the Imaculada's), planes (the chapel's, the Liberdade's),
  birches (31 de Janeiro, Liberdade), hackberries (lódãos, the avenues' street tree: the Imaculada's
  pollarded ones by the bus stop, the Porfírio's and the 31 de Janeiro's west rows, across the
  Liberdade), robinias (the 31 de Janeiro, in flower on 19 May), a horse chestnut (Porfírio), a fan
  palm (Imaculada), white poplars (Porfírio, 31 de Janeiro), a deodar cedar (31 de Janeiro), and
  broadleaves the photos can't name (ivy-covered, in gardens, pollarded and bare at `joao-xxi` in
  April). Hackberries, robinias and horse chestnuts are drawn as broadleaves, white poplars as poplars.
- Found along the way: at `imaculada-conceicao` the big hackberry's trunk stands where OpenStreetMap
  maps a tree, 15 m ahead of the camera, its crown reaching back over the camera; the world stands the
  LiDAR's trunk under the crown's top, 6.5 m from the camera, and the map's tree as a 4 m young tree at
  the real trunk. Where to stand a trunk is task 063's kind of work, not this one's.

### Where it stands (2026-10-18, not landed)

- braga-map (worktree `../braga-map-061`, branch `task-061`, uncommitted): `refs/trees.json` (87 trees
  seen, all matched; 5 rows, 37 trees; the Parque da Ponte's limes, 80 trees), `tools/species.mjs`,
  `trees.mjs`'s `refsOf` and `kindOf`, nine kinds (`EVERGREEN`), the tree's word 16 bits in the tiles,
  the new kinds' bark and leaves (`refs/textures.json`: a zelkova's bark toned to a plane's, a lime's
  ridged bark, a cherry's toned to a birch's white; a plane's leaves five leaves to a stalk). Made with
  `TREES=trees-061.json`; main's `trees.json` untouched. 136 tests pass; the new viewpoints test fails on
  1.26.0's world (39 of the 87 trees in view another kind than seen).
- party-kart (worktree `../party-kart-061`, uncommitted, braga-map installed from the worktree with
  `--install-links`; the tag goes back before committing): the three kinds' shapes in `render/trees.ts`.
  66 tests and `tsc` pass; laps 302.4 and 300.3 s, no respawn, as on main.
- Shots `party-kart-061/shots/2026-10-18-try061`, High and Medium whole, Low to `egidio-guimaraes`: the
  run was stopped by Claude Code, the machine short of memory. On High the Imaculada's fan palm and the
  Liberdade's and 31 de Janeiro's birches show; the park's limes still stand on bare trunks to 14 m,
  their feet as the LiDAR measured them under a thick crown (task 019's 60% at most), where the photos
  have their leaves from 5–8 m: the trees' size is out of this task's scope.
- Left: shoot again (try), then land: merge main, run the remake from the trees on, take the next
  version in turn with 045 and 014, pin party-kart to it; shoot the round, mark it, add it to task
  064's table; the budget; docs (decision, ROADMAP, 065 in it); finish.
