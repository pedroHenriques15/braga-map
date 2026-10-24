---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 088 · Every tree in the open world its species

## Why

A tree is one of nine kinds (decision 051): its species only where OpenStreetMap names it or a
viewpoint's photo shows it, else its wood's from COS2025, else a guess from its shape. Most of the
open world's street trees are "broadleaf", which covers Braga's hackberries, limes, planes, oaks,
jacarandas, magnolias and ornamental cherries alike, and they don't look alike, nor the same in
every season (093).

## What

Today `tools/trees.mjs` gives each tree a kind in 4 bits (`trees.mjs:399-401`, 9 kinds, 16 at
most), from `refs/trees.json` (seen, task 061), OSM's `species`/`genus`/`leaf_type`, COS2025's main
species, then shape rules (`trees.mjs:446-459`). party-kart draws a kind's shape, bark and leaves
(`src/render/trees.ts`).

1. **Research first:** whether Braga's municipality publishes its street-tree inventory
   (Câmara Municipal de Braga, dados abertos), and under what licence. Record it in
   `docs/SOURCES.md`. If it's open, it's the first source: each tree's species where it stands.
2. **The reference photos:** sessions name the species of every street and park tree in the open
   world that a photo in `refs/photos.json` (or a further Mapillary photo, as a reference)
   shows, into `refs/trees.json`, the shooter's area first. Photos are read, never drawn (082).
3. **The point cloud** for what neither says: the crown's shape, the NIR's season (the flight was
   July), the height and the spacing of a row (an avenue's row is one species).
4. **More kinds,** up to 16 in the 4 bits (or a wider field): hackberry, oak, magnolia, jacaranda,
   cherry, holm oak, cork oak, maple, ash, as many as Braga's open world has more than ~50 of,
   each with its shape, bark and leaves made (082) and whether it's evergreen.

## Read first

- `docs/DECISIONS.md` 043, 047, 051; `tools/trees.mjs`, `refs/trees.json`, `refs/photos.json`;
  party-kart's `src/render/trees.ts`.

## Done when

- [ ] Every tree in the shooter's area that a photo shows has its species (765 trees there); the
  share of "broadleaf" in the open world is recorded before and after. Left, and why: every tree a
  photo shows was looked at (328 of the 337 a photo's view takes in, of 746 in the area today; the 9
  left are the Imaculada Conceição's limes, which its row names), but a photo names a species only
  where it shows one: 71 of the area's are named past "broadleaf", 165 stay "broadleaf" (the photos
  of February and March show them bare, and the summer panoramas don't reach them), 92 were hidden.
  The share is recorded (Notes): the area's 90.0% to 86.1%, the open world's 87.3% to 87.1%.
- [x] `alameda-fujacal`, `31-de-janeiro`, `imaculada-conceicao`, `capela-sao-joao` and
  `porfirio-da-silva` shot again, rated no lower: the coordinator's marks
  (`.cache/scorecard/marks/2026-10-24-after088.json`): `alameda-fujacal` 3 → 3,
  `imaculada-conceicao` 3 → 3, the other three the same to the pixel.
- [x] `npm test` passes: 153 of 153 on main with 081 under it.

## Out of scope

- How the trees are drawn far off: 089. Their seasons: 093.

## Notes

- **Under way (worker-2, 2026-10-24), braga-map branch `task-088`; party-kart unchanged (no new kind
  to draw).**
- **Step 1, the inventory: Braga doesn't publish one** (looked for on 2026-10-24, `docs/SOURCES.md`,
  "Braga's street-tree inventory"): the Câmara Municipal de Braga has no dataset on dados.gov.pt, its
  web GIS has no tree layer, and the 2025 regulation on its trees publishes none. Should one appear
  as open data, it comes first in `kindOf`.
- **Step 2, the photos.** `node tools/species.mjs shooter` counts the shooter's area's trees a photo
  shows: within 60 m of a viewpoint's or a reference photo's camera, in its view, and now in sight
  past the buildings (`inSight`, which `mark` uses too, so a tree behind a block isn't numbered on a
  photo that can't show it); and lists the fewest photos that show every one not looked at yet.
  746 trees in the area today (the task's 765 were 1.26.0's), 337 of them in some photo's view.
  - Most of those photos are of February and March 2018–2019, the broadleaves bare; so
    `node tools/species.mjs summer` finds Mapillary's panoramas taken in leaf (May to October) round
    the area's trees and adds the best 90° view of each to `refs/photos.json` as a reference photo
    (`what: trees`, `trees-<photo>-<heading>`; its heading, pitch and roll from Mapillary's
    `computed_rotation`, `panoFrame`), none taken within 150 m of an egg or a waypoint or looking at
    one within 300 m (`test/photos.test.js`'s rule, applied before it picks). 15 views, all of the
    July 2024 walk (stuckstick, CC BY-SA 4.0), cut by `tools/refs.mjs`. Read, never drawn (082).
    Its first run had picked by the trees alone, and 9 of its 16 views broke that rule: `npm test`
    caught it, and they were taken out with the labels read off them and their files in the `.cache`.
  - Every photo the tool listed was looked at, each tree numbered on it and on the orthophoto (the
    first 59, the summer views, and the rest on contact sheets). **362 labels in `refs/trees.json`**
    (now 448 trees, 17 species), the shooter's area's **328 of the 337** a photo's view takes in
    (the 9 left are the Imaculada Conceição's limes, which its row names):
    - **87 found hidden** (`species: null`): behind a wall or another crown, or the outline falls on
      a building or the sky, as a Mapillary camera can be 5–15 m from where it's computed, and then
      the trees can't be told apart;
    - **199 broadleaves the photo can't name**, most bare in February and March;
    - **76 named past "broadleaf":**
      - **seen clearly (`sure`), 16:** the willows on the Rio Este's banks (narrow grey-green leaves
        on slender shoots, in July), the Alameda do Fujacal's planes (their flaking bark and seed
        balls, from the alameda's east end, `facade-way-383776389`), the hackberries of the Avenida
        Imaculada Conceição's row in leaf (November), Judas trees in flower on the Rua Conselheiro
        Lobato's pavement by the Hospifarma and beyond a car park off it (March), a spruce or fir;
      - **a row's species carried along it, 30:** the further trees of a row a photo shows clearly at
        its near end, as their notes say: the riverbank's willows (16), the alameda's planes (11),
        the Judas trees (3);
      - **seen, but small, dark or bare, 30:** planes and hackberries in winter, cedars and cypresses,
        evergreen broadleaves behind garden walls, an araucaria, an oleander, a fan palm.
    The Alameda do Fujacal's viewpoint photo (February) shows its avenue bare and pollarded; its trees
    were labelled "broadleaf" from it, then "plane" once `facade-way-383776389` showed the same trees'
    bark from the avenue's other end.
  - New species in `refs/trees.json`: willow (*Salix*), cedar, cypress, Judas tree (*Cercis
    siliquastrum*), araucaria (*A. heterophylla*), oleander, and `conifer` and `evergreen` for a
    conifer or an evergreen broadleaf the photo can't name. Each is drawn as the kind it looks like
    (decision 051): the willows as poplars, the conifers as conifers, the rest as broadleaves.
  - A label that names nothing (hidden, or "broadleaf") is left out where a row names the tree: five
    of the Imaculada Conceição's limes, looked at and not told, would otherwise have lost the row's
    lime (`refsOf` gives a row only the trees not looked at).
- **The share of "broadleaf"** (`.cache/trees.json` against main's): in the shooter's area 90.0%
  before (674 of 749) and 86.1% after (645); in the open world 87.3% (16,216 of 18,576) and 87.1%
  (16,176). 63 trees changed kind and nothing else of any tree: 23 broadleaf to poplar (the willows),
  17 broadleaf and 3 conifer to plane (the alameda), 9 broadleaf to conifer, 1 to palm, and 9 conifer
  and 1 poplar to broadleaf (019's shape rules had taken narrow, pollarded broadleaves and the
  hackberry row's narrower crowns for conifers; the summer views show broad crowns).
- **Steps 3 and 4, decided by the session, for the owner to confirm:**
  - **No new kind.** None of the species found reaches the task's ~50 in the open world on the
    photos' evidence: the willows are 23 and the planes 25 on the whole map, the hackberries 20
    seen beside the trees 061's rows name; and the hackberries are drawn as "broadleaf", whose bark is already a hackberry's (Poly
    Haven's `chinese_hackberry_bark`). So the kinds stay nine and party-kart's `trees.ts` is
    untouched. An evergreen broadleaf (a holm oak, a laurel, an oleander) is drawn as the deciduous
    broadleaf, which matters once 093 brings the seasons.
  - **No row carried past what a photo shows**, as the owner chose for task 061 (decision 051): the
    point cloud's spacing and heights would carry the alameda's planes and the riverbank's willows
    further, but no photo shows them there. The NIR (a July flight) tells needles from leaves, as
    019 already uses, not one broadleaf from another.
- **Rule 16:** `tools/trees.mjs` and `npm run world` ran into a private `.cache` in braga-map-088
  (`made.txt`), never the shared `trees.json`; at landing they run once more into the shared one.
- **Viewpoints:** shot before (party-kart's `shots/2026-10-24-088-before`, main's 1.36.0) and after
  (`shots/2026-10-24-088-after`, this branch's world installed), the five the task names, High and
  Low, under the heavy lock. `31-de-janeiro`, `capela-sao-joao` and `porfirio-da-silva` are the same
  to the pixel; `imaculada-conceicao` 0.9% of its pixels (a far tree); `alameda-fujacal` 17%: its
  avenue's trunks are the plane's pale, patchy bark where they were a uniform brown. Its photo
  (February) has the avenue bare and pollarded, grey trunks with pale patches: the after's pattern is
  nearer it, its tone paler than the photo's wet bark. For the coordinator to rate.
- **Tests:** braga-map `npm test` 153 of 153 (`test/photos.test.js` now knows `what: trees`, and the
  rule that caught the nine views is untouched). party-kart on this world: `npm run check` clean,
  `npm test` 155 of 156, the timed "world as a ground" test at 3.8 s while other shots ran, and
  14 of 14 run alone twice after.
- **Not verified:** the species of the trees no photo shows (409 of the area's 746): they keep
  019's rules. **Left:** the alameda's trunks are the plane's bark pattern but much paler than the
  photo's wet February trunks (the coordinator's mark, 3 → 3): the plane's bark's tone is 061's, and
  093's seasons are where a winter's wet bark would come in.
- **Landed (worker-2, 2026-10-24):** braga-map 1.37.0, decision 070; party-kart pinned to v1.37.0.
  At landing (rule 16), `tools/trees.mjs` ran once more into the shared `.cache/trees.json`, byte for
  byte the private run's, so the tiles built from it stand. The round was shot at High and Low,
  before 081 made the rounds Ultra and Low; its shots are party-kart's `shots/2026-10-24-before088/`
  and `shots/2026-10-24-after088/`, not prepared with `tools/round.mjs` (task 103 keeps it).
