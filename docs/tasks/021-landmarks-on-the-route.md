---
status: doing
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

- [ ] São João da Ponte (the chapel, the bridge's arch), the Altice Forum, the Estádio 1.º de Maio
  and the Picoto's top are built at their real size, each checked against its photos at a viewpoint.
- [ ] Their viewpoints (`capela-sao-joao`, `altice-forum`, `estadio`, `picoto-top`) score higher on
  the scorecard than before the work.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

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
