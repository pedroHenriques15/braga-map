---
status: done
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [001, 008]
roadmap: Phase 4 · Street furniture, landmarks and light
---

# 021 · The landmarks along the route, built from their photos

## Why

Landmarks are how people place themselves. Of the 32 chosen on the map, the game draws a few:
Bom Jesus and the Sameiro far off, the cross on the Picoto, the Estádio 1.º de Maio, and the
Altice Forum and Makro only as a sign on a plain building. The ones the route passes, São João
da Ponte above all, are missing or generic.

## What

Today party-kart's `src/render/sights.ts` builds the sights that `tools/world.mjs:738-813` places
(kinds in `index.d.ts`, `Sight`: bomjesus, sameiro, cruzeiro, tourigalo, makro, altice, stadium).
"The route" is today's race, the Volta dos Amigos (`tracks/amigos.js`, 10.2 km, the loop by Ponte
Pedrinha since task 039). The table was first written on 2026-10-13 and checked again on
2026-10-16 against today's race. "From the line" is the distance from the race's centre line to
the landmark's point on the map (`map/braga.json`, `landmarks`). "Seen ahead" is how much of the lap
sees it, from 2 m over the line, within 45° of the way the race goes, with the tiles' buildings and
trees in the way, and how near it is when seen.

| Landmark | From the line | Seen ahead | Today |
|---|---|---|---|
| Estádio 1.º de Maio | 125 m | 470 m of the lap, from 195 m | a model: a red running track, grey terraces, a box of a stand, four thin floodlights. The map has no building there |
| Altice Forum Braga | 192 m | 230 m, from 276 m (from the west and the Picoto's descent) | its 13 buildings as the LiDAR measured them, and a white fascia "ALTICE FORUM BRAGA" |
| Parque da Ponte and São João da Ponte | 202 m. The chapel 82 m; the Largo and the Avenida da Liberdade's bridge over the Este are on the route | the chapel 160 m, from 113 m. The bridge 320 m, as the race drives up to and over it | the chapel is a building in the tiles, with task 017's church facade; the bridge is a deck |
| Monte e miradouro do Picoto | 265 m | the top's cross 820 m, from 298 m | a stone cross 5 m high, and a white survey pillar. The real cross is white steel with a ring, on a granite block |

Dropped on 2026-10-16 (the owner, in "Questions"): the Museu D. Diogo de Sousa (214 m), the
Palácio do Raio (337 m), the Fonte do Ídolo (341 m), the Cividade (372 m) and the Capela dos
Coimbras (541 m), which the race doesn't see; the Theatro Circo (477 m) and the Igreja dos
Congregados (551 m), which it sees only from the Picoto's descent, 640 m and 1.2 km off; the Igreja
de Lamaçães (508 m), seen for 24–80 m of the lap, 585 m off; and the Picoto Adventure Park (47 m),
rope courses in the Picoto's trees, of which no photo was found. The old town's go to ROADMAP's
"Later".

Also on the route and not among the 32: Makro (a fascia, seen for 250 m from 267 m) and the
Tourigalo (a model, task 029). Also four chapels and two wayside shrines, which are task 056's.
party-kart has about 1,400 lines of cartoon models of the old town's landmarks
(`../party-kart/src/render/landmarks.ts`, `braga.ts`) that nothing builds; they're for the first
track, not to scale, and none of them is one of this task's.

Steps, landmark by landmark:

1. **What it really is:** its footprint (OSM, or the LiDAR's where OSM has none), its heights (DGT's
   2025 LiDAR: the surface model and the point cloud, `tools/dgt.mjs`), its layout from above (the
   2025 orthophoto, 25 cm), and its photos (task 008's in `refs/photos.json`, Mapillary and Commons
   with open licences, task 005).
2. **Build it** in party-kart as a model at its real size (decision 004: only Bom Jesus and the
   Sameiro, and the Tourigalo, decision 015, are exaggerated), with photo textures where decision 002
   and the photos allow. Each one is a function in `sights.ts` or in its own file, placed by
   `tools/world.mjs` as a `Sight`. Where the tiles already have the landmark as a building, the
   sight says which, and a game draws the model in its place.
3. **São João da Ponte first:** the chapel with its bell gable, its porch and its cross; the bridge's
   granite arch over the Este; the Largo and the park as the route passes them. Then the Altice
   Forum: its white volumes are the LiDAR's already, so it needs its look (the α, the slatted wood,
   the canopy, the letters in its square). Then the Estádio 1.º de Maio, checked against its photos:
   the granite outer wall, the main stand's front, the terraces and the floodlights, from the LiDAR.
   Last, the Picoto's top: the steel cross on its block, the miradouro's boardwalk and its rails.
4. **Three viewpoints** where task 008's photos were taken (decision 009): `capela-sao-joao` (the
   chapel's front from the Largo), `altice-forum` (from the west, its sign) and `picoto-top` (the
   hill and its top from the east). Shoot them before the work, on braga-map 1.18.0, so the round
   has something to set them beside.
5. Delete the cartoon models in party-kart that a real one replaces. None of this task's has one.

## Questions

- [x] Which landmarks in the table should be dropped, as the race doesn't see them? Options: the
  old town's five not seen (D. Diogo de Sousa, Raio, Ídolo, Cividade, Coimbras); the Theatro Circo
  and the Congregados; the Igreja de Lamaçães; the Picoto Adventure Park. Recommended: all four.
  > All four (the owner, 2026-10-16). The old town's go to ROADMAP's "Later".
- [x] The race passes four chapels and two wayside shrines that aren't among the 32 (Santa Justa
  12 m, Santo Adrião 35 m, Santa Tecla 61 m, São Lázaro 206 m, Senhor do Bonfim and Senhor da Boa
  Morte 16–22 m). Build them here, draft a task of their own, or leave them? Recommended: a task of
  their own.
  > A task of their own (the owner, 2026-10-16): task 056.
- [x] Only `estadio` frames one of these landmarks close up. Add viewpoints for the chapel, the
  Altice Forum and the Picoto's top, each where one of task 008's photos was taken? Recommended: yes.
  > Yes, three (the owner, 2026-10-16).

## Read first

- `../party-kart/src/render/sights.ts`, `tools/world.mjs:738-813`, `index.d.ts` (`Sight`).
- `map/braga.json` (`landmarks`), `tools/build.mjs:208-242` (`LANDMARKS`).
- `tools/dgt.mjs` (the LiDAR and the orthophoto), `refs/photos.json` (`landmark:*`, `bridge:*`).
- `docs/DECISIONS.md` 002, 004, 009, 015, 017, 025 and 030.

## Done when

- [x] São João da Ponte (the chapel, the bridge's arch), the Altice Forum, the Estádio 1.º de Maio
  and the Picoto's top are built at their real size, each checked against its photos at a viewpoint.
  > Each at the size the map and the LiDAR give it (Notes, "What was built"), and checked at its
  > viewpoint beside its photo: the chapel at `capela-sao-joao`, the α at `altice-forum`, the stadium
  > at `estadio` (and its other photos from the air, inside and from the west), the Picoto's top at
  > `picoto-top`; the bridge's arch against task 008's two photos of it from the river path, with
  > `?view` shots (no viewpoint stands there).
- [ ] Their viewpoints (`capela-sao-joao`, `altice-forum`, `estadio`, `picoto-top`) score higher on
  the scorecard than before the work.
  > Half met, on Claude's marks: `estadio` 2 → 3, `capela-sao-joao` 1 → 3 (its before, shot on 1.18.0,
  > marked in its comment); `altice-forum` 2 → 2 and `picoto-top` 2 → 2, held down by what isn't a
  > landmark's (the windows the facades' kit puts on the Altice's blank walls, the car park's red
  > fence, the Picoto's woods, the brick block beside it). None lower. The owner's marks aren't in yet.
- [x] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).
  > Notes, "The budget"; party-kart's `docs/architecture.md`.

## Out of scope

- The old town's landmarks, the Theatro Circo, the Congregados and the Igreja de Lamaçães: "Later",
  when a track or the shooter goes there.
- The route's chapels and wayside shrines that aren't among the 32: task 056.
- What stands in the roundabouts, São João's statue in the Largo's among them: task 014.
- The stadium's bowl in the land, and the street beside it: task 049.
- The park's trees: task 019.
- Bom Jesus and the Sameiro: drawn already, and exaggerated on purpose (decision 004).

## Notes

- **The table checked again** (2026-10-16, before the work): distances from `tracks/amigos.js`'s
  points; seen ahead with a ray from 2 m over each point to the landmark's centre and corners at
  its top, three-quarters and half its height (the tiles' buildings at their roofs' tops; each
  tree a crown 3 m round from 2.5 to 10 m up), within 45° of the race's heading. Without the trees,
  the chapel is 160 m, the stadium 470 m, the Altice 230 m and the Picoto's cross 930 m. The
  Picoto Adventure Park was "a sign" on 2026-10-13: nothing has drawn one since the first track.
- **What was built** (braga-map 1.19.0, decision 038; party-kart `chapel.ts`, `stadium.ts`, `sights.ts`):
  - **São João da Ponte's chapel** (`saojoao`): its outline's rectangle, 20.2 × 10.6 m, its front to
    the square before it; its heights from the LiDAR's three parts of its building (the porch's eaves
    3.6 m, the nave's eaves 6.0 and ridge 7.9, the bell gable's top 10.6). Drawn in its building's
    place (`covers`): white render framed in granite, the bell block with its two bells in arches,
    its curved pediment and three finials, the nave's gable with its cross and pinnacles, the porch
    of granite columns on a low wall under a hipped tile roof, the windows and doors where the five
    photos of it show them, and the carved altar on its back.
  - **The bridge's arch** (`arch`): where the Avenida da Liberdade's middle crosses the Este, its decks
    within 17.9 m. party-kart draws them as dressed granite: the parapets, and the arch's faces down
    to the ground with its opening over the water and the riverside path, on no pillars. The vault's
    curve under the deck is left flat: drawn under a deck as wide as a street it showed as a tent.
  - **The Estádio 1.º de Maio** (`stadium`, `tools/sights.mjs`): 204 spokes round its track, its stands
    from 5 to 36 m deep and their tops 3.6 to 20.2 m over the pitch (13.1 at the middle; the most, the
    main stand's roof on the west), every metre the highest point that isn't vegetation within half
    a metre; its four floodlights' masts where the point cloud has them, 39.4 to 40.4 m over the
    pitch. party-kart steps them a metre a step, walls them outside in one level ring (pale render,
    a row of tall windows and granite courses below, as `estadio`'s photo shows them), roofs the main
    stand, and puts the lamps' frames on the masts. The bowl in the land is still task 049's.
  - **The Picoto's top** (`cruzeiro`): the cross white steel with its rusted ring, on a granite block,
    its top 4.8 m over the ground and its arms 3.7 m, where the LiDAR saw them; the miradouro's
    boardwalk (OSM's `bridge=boardwalk`, the map's paths since task 050) drawn in timber, its boards,
    edge and rails.
  - **The Altice Forum** (`altice`): the α on the hall's west face, 9 m from its north end and 2.8 m
    under its top, over the top row of windows, where `altice-forum`'s photo has it; the sign "ALTICE
    FORUM BRAGA", which no photo shows, gone. The rest of it is the LiDAR's buildings and task 017's
    facade (`refs/buildings.json`, `relation/19915703`).
- **The viewpoints:** `capela-sao-joao` (a panorama of 2024-07-20, cut at 194°, as task 008 cut it),
  `altice-forum` (2019-07-06: Mapillary says 139°, but its photo frames what the game does at 100°,
  checked by outlining the buildings on it with `tools/buildings.mjs mark`) and `picoto-top`
  (2018-02-17, from a car, as Mapillary has it). The 17 buildings they see that had no entry in
  `refs/buildings.json` have one: the chapel and the Altice Forum looked at, the rest hidden by the
  park's trees or the car park's cars. Five more came with 055's re-aimed cameras (specks behind
  trees and far down the valley), added in the merge.
- **Before the work** (`party-kart-021/shots/2026-10-17-before021/`, braga-map 1.18.0): the chapel a
  grey box with a gable roof, the Altice Forum its white blocks with a sign, the stadium a grey
  block, the Picoto's top a stone cross and a survey pillar behind white boards.
- **The budget** (party-kart's `shots/2026-10-17-after021/`, `a86355b` on 1.19.0 with 054's flying
  camera merged in, against `after046`, the median of the 29 viewpoints both shot): the sights 42
  meshes and 61,900 triangles where they were 9 and about 25,000. Draw calls 126 → 132 on High and
  Medium (up to 15 more at `sao-joao-da-ponte` and `liberdade`), 95 → 96 on Low; triangles 1.67 →
  1.71 M on High, 1.38 → 1.42 on Medium, 0.76 → 0.79 on Low (41 k more everywhere, as the sights are
  drawn whole, 63 k at `estadio`); textures 132 → 133 MB on High, 80 → 81 on Medium, 47 → 48 on Low.
  The city built in 6.5 s on High against 5.3 (6.0 against 4.8 on Medium, 5.1 against 4.2 on Low),
  with 054's camera in it; a frame 0.7–1.4 ms. The download on High 7.99 MB gzipped (14.32 as is),
  0.03 MB more. The three new viewpoints: 146, 197 and 200 draw calls and 1.69, 2.43 and 2.16 M
  triangles on High. Over the budget's figures, as the city was before (decision 017: a guide).
- **Tests:** braga-map `npm test` 97 of 97 (`test/sights.test.js` new: every sight once, the stands
  rising from the track to the wall and the four floodlights, the chapel on its building looking at
  its square, the arch over the river on its decks); party-kart `npm test` 57 of 57 and `npm run
  check` clean; the autopilot's test lap 298.8 s with no respawn, and a lap in the browser with the
  autopilot and three bots from the start back to free roam in 5:46, no error on the page.
- **Landed** (2026-10-17): braga-map's `main` merged into `task-021` (046's corners and 055's cameras:
  only the tiles clashed, made again by `npm run world`), **1.19.0** (tag `v1.19.0`). party-kart's
  `main` (054's flying camera) merged into its `task-021`, pinned to `v1.19.0`. `tools/round.mjs`
  takes `--shots` and party-kart's `scripts/shots.mjs` `--map=`, for a worktree's shots and
  viewpoints. Not deployed.
- **The round on the scorecard:** `2026-10-17-after021` ("Os marcos"), shot on party-kart `a86355b`
  and braga-map 1.19.0, published on "Braga real" (its version 12), open for marks, after task 022's
  round "A luz" (`2026-10-17-after022`), which went up an hour before from 022's own worktree and
  isn't on either `main` yet: the owner chose to post this one after it (2026-10-17), which closes
  "A luz" in the page. This round hasn't 022's light, and its note says so. Claude's marks
  (`scores/claude`, each comment starting "(Claude)"): 2.50 for the 32 places, the 29 of before 2.52
  against 2.48 (`estadio` 2 → 3); the new places `capela-sao-joao` 3, `altice-forum` 2, `picoto-top`
  2, each comment saying what it would have had before. `refs/rounds.json` here hasn't 022's round:
  022 adds its own when it lands.
- **After the round:** the Picoto's cross brought down to the LiDAR's height (party-kart `2913aab`):
  0.9 m lower, a few pixels in `picoto-top`.
- **Left, for 053's pass:** the chapel's side wall has a photo good enough for a texture
  (`landmark-sao-joao-da-ponte-3`), unused: a sight isn't a building, so `render/photos.ts` doesn't
  reach it. The vault's curve under the arch. The sights are drawn whole wherever they're in view;
  the stadium alone is about 30,000 triangles.
- **Not checked:** a LiDAR building beside the chapel's square (`lidar/x284z1003`, 538 points DGT
  classes building, up to 4.8 m) shows as a grey box at the left of `capela-sao-joao`, where its photo
  shows the park's trees; it may be a kiosk under them. The race's view of the arch from the road: its
  faces are under the deck, seen from the river and its paths.
- **Done** 2026-10-17 (decision 038), the second "Done when" half met on Claude's marks (above).
- **Deployed** 2026-10-18 from party-kart `96b3ebb` (braga-map 1.22.0), with 021, 026, 056, 057 and 049 together, at the owner's word: the live page serves the build (`index-CM6aZCpG.js`), and on it a race with the autopilot and three bots went over the jump, landed on the street and drove on, with no page error.
