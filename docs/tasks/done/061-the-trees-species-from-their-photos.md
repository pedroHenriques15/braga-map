---
status: done
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

- [x] Every tree in view of a viewpoint, within 60 m of its camera, is the species its photo shows,
  checked at the viewpoints (`sao-joao-da-ponte`, `capela-sao-joao`, `imaculada-conceicao`,
  `porfirio-da-silva`, `31-de-janeiro`, `joao-xxi`, `liberdade`). `test/trees.test.js`'s "the trees
  near the viewpoints are the species their photos show": each of the 87 trees in view of the seven
  (`joao-xxi` from its photo's camera, as task 052 dropped it as a viewpoint) is in `refs/trees.json`,
  matched, and of its species' kind in 1.29.0's tiles; on 1.26.0's, 39 of them weren't. Shot at the six
  viewpoints in "As espécies" (`2026-10-18-after061`).
- [x] The rows along the route's avenues are their species the length of the avenue: **as far as the
  photos show them**, at the owner's choice (2026-10-18). Five rows are named (37 trees), each only as far as a photo shows it: the Imaculada
  Conceição's limes (150 m) and hackberries (65 m), the Porfírio da Silva's hackberries (90 m), the
  31 de Janeiro's hackberries (100 m) and robinias (80 m), each a stretch of its avenue; and no photo
  read shows a row along the Liberdade. Naming the rest from one stretch would be a guess
  (decision 051).
- [x] What new kinds add is measured against the budget: party-kart's `docs/architecture.md`
  (`6747516`), "As espécies" against "As rotundas": draw calls 154 → 161 on High at the median, 149 → 161
  on Medium, 108 → 113 on Low; triangles 2.159 → 2.167 M on High; textures 130 → 132, 74 → 75 and 41 MB,
  0.46 MB more to download on High; the open world's tiles the same 3.33 MB gzipped.

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

### Landed (2026-10-18)

- **braga-map 1.29.0** (`84b9587`, tagged `v1.29.0`, in turn after 045's 1.27.0 and 014's 1.28.0):
  `refs/trees.json` (87 trees seen, all matched; five rows, 37 trees; the Parque da Ponte's limes, 80
  trees), `tools/species.mjs`, `trees.mjs`'s `refsOf` and `kindOf`, nine kinds (`EVERGREEN`, and
  `map().treeKinds`' `evergreen`), the tree's word 16 bits in the tiles (the kind in 4), the new kinds'
  bark and leaves (`refs/textures.json`: a zelkova's bark toned to a plane's, a lime's ridged bark, a
  cherry's toned to a birch's white; a plane's leaves five to a stalk). Merged onto 014's roundabouts,
  the trees made again on the merged code (the same 246,269: 164,963 broadleaf, 71,702 eucalyptus,
  4,773 pine, 2,512 cypress or cedar, 2,191 poplar, 116 lime, 5 plane, 4 palm, 3 birch; 129 of
  another kind than 1.28.0's), the world and the textures from them; `.cache/trees.json` is 061's
  since. 142 tests pass. Decision 051.
- **party-kart `2e21899`** pinned to it: the three kinds' shapes (`render/trees.ts`, `45d7fdf`); 66
  tests and `tsc` pass; laps 302.8 and 299.9 s, no respawn. The peer prefix stays `pk38`: the race's
  road is 1.28.0's, and a kind changes a trunk only for a palm (the Imaculada's, in a garden). The budget
  in `docs/architecture.md` (`6747516`). Not deployed.
- **The round "As espécies"** (`2026-10-18-after061`), after 014's "As rotundas", shot on party-kart
  `2e21899` with braga-map 1.29.0: 33 shots in 4 sheets in `.cache/scorecard/rounds/`, and
  `refs/rounds.json`. **Not published**, as the five before it aren't (task 064): Claude's marks in
  `.cache/scorecard/marks/2026-10-18-after061.json`, 2.94 over 33, none moved. The park's limes are
  darker and denser at `capela-sao-joao` and `sao-joao-da-ponte`, as the photos', but still stand on
  bare trunks to 14 m, their feet as the LiDAR measured them under a thick crown (task 019's 60% at most)
  where the photos have leaves from 5–8 m; the Imaculada's fan palm and clipped limes (darker than the
  photo's bright green), the birches' white trunks at `31-de-janeiro` and `liberdade`; the plane by the
  chapel doesn't stand out from the limes round it. A pixel diff against "As rotundas" shows nothing
  else changed.
- **Found:** task 065 (the Imaculada's hackberry: the map's tree at its trunk, the LiDAR's crown 15 m
  back). The rows' item: the owner took the rows as far as the photos show them as done (2026-10-18),
  rather than a task to find more photos along the avenues.
