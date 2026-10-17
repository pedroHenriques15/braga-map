---
status: doing
priority: medium
kind: code
repo: both
created: 2026-10-16
depends-on: [021]
roadmap: Phase 4 · Street furniture, landmarks and light
---

# 056 · The route's chapels and wayside shrines, built from their photos

## Why

The race passes four chapels and two wayside shrines that aren't among the map's 32 landmarks, and
some it passes within a few metres: the Capela de Santa Justa stands on the Largo the race takes. In
the game the chapels are buildings with task 017's church facade, a kit of windows in a rhythm, and
the shrines aren't drawn at all. Found by task 021, whose table they weren't in (the owner,
2026-10-16).

## What

Measured by task 021 on 2026-10-16 against today's race (`tracks/amigos.js`). "From the line" is the
distance from the race's centre line to the OSM feature's centre. "Seen ahead" is how much of the lap
sees it from 2 m over the line, within 45° of the race's heading, with the tiles' buildings and trees
in the way.

| OSM | What | From the line | Seen ahead |
|---|---|---|---|
| `way/383764627` | Capela de Santa Justa, on the Largo Santa Justa | 7 m | 88 m of the lap, from 12 m |
| `way/159203541` | Capela de Santo Adrião | 23 m | 88 m, from 35 m |
| `way/234261710` | Capela de Santa Tecla, on its Largo | 42 m | 112 m, from 61 m |
| `way/108323630` | Igreja de São Lázaro, by the Avenida da Liberdade | 116 m | 300 m, from 206 m |
| `way/407006302` | Senhor do Bonfim, a wayside shrine | 11 m | 88 m, from 22 m |
| `way/383792816` | Senhor da Boa Morte, a wayside shrine | 11 m | 176 m, from 16 m |

1. **Photos:** find each one's photos online (decision 018: Mapillary first, then Commons), as task
   008 did for the landmarks, and list them in `refs/photos.json` as `landmark:<id>`, with a texture
   where one is straight on and sharp. `tools/refs.mjs` fetches them.
2. **Build each one** as task 021 built São João da Ponte's chapel: a `Sight` from `tools/world.mjs`
   with its footprint and the LiDAR's heights, naming the tiles' building it stands for, and a model
   in party-kart's `src/render/` at its real size, with its own front, bell gable or tower, cross,
   granite and colours as the photos show them.
3. **The shrines** (alminhas or a niche on a pillar): a small model each, where OSM puts it, facing
   the street as the photo shows.
4. Shoot the viewpoints that see them, and post the round.

## Questions

- [x] None of the scorecard's 32 viewpoints frames any of the six (the nearest 181 m off, behind
  buildings). Add viewpoints where Mapillary's photos were taken from the race's own line (decision
  009), shot before the work? Options: Santa Justa, Santo Adrião, Santa Tecla; Santa Justa alone;
  none, each checked with `?view` shots. Recommended: Santa Justa and Santo Adrião.
  > Two: `capela-santa-justa` and `capela-santo-adriao` (the owner, 2026-10-17).

## Read first

- Task 021 (`docs/tasks/done/021-landmarks-on-the-route.md`): how its chapel was built, and its kit.
- `../party-kart/src/render/sights.ts`, `tools/world.mjs` (the sights), `index.d.ts` (`Sight`).
- `docs/DECISIONS.md` 002, 018 and 036.

## Done when

- [ ] Each of the six built at its real size, checked against its photo.
- [ ] The viewpoints that see them shot again, no worse.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- The 32 landmarks: task 021 for those the race sees, "Later" for the old town's.
- What stands in the roundabouts (the statues of São João and of Santos da Cunha): task 014.

## Notes

- Drafted 2026-10-16 from task 021's check of its table.
- **What was built** (braga-map 1.21.0; party-kart `chapels.ts`, `sights.ts`, `city.ts`):
  - **The chapels** (`chapel` sights, by `id`): each its outline's rectangle, its front to the
    street or the square its photos were taken from, its eaves and ridge from `roofs.json`, its top
    (a bell gable's, a cross's) from the point cloud (`tools/sights.mjs`, `.cache/sights.json`'s
    `small`), drawn in its buildings' place (`covers`). Santa Justa (eaves 5.4, ridge 7.4, top 7.9 m):
    the granite front and its gable, the cross on the little curved pediment, the tall door under the
    inscription and its cornice, the saint's tiles; the white block on its right with the bell gable
    and the small bell in its iron frame, an iron cross and a vane; white sides, the north door, the
    roof hipped at the back. Santo Adrião (3.7, 4.8): rubble granite, the porch (a building of its own
    on the map, way/897195634, 4.2 m deep, under the chapel's `covers` too) on columns and low walls,
    the arched door and its two barred windows, the bell gable on the apex (1.35 m, the photos': the
    LiDAR's top, 4.8 m, is the ridge's). Santa Tecla (4.2, 6.6, top 8.8): white render framed in
    granite, the cornice, the pediment with the saint in her niche, the pinnacles, the cross on its
    scrolled block, the green door, the barred windows, the steps.
  - **São Lázaro's bell tower** (`saolazaro`): its church's highest part as the LiDAR measured it
    (13.9 m), drawn in that part's place: two granite slabs, the slot between them where the LiDAR's
    outline dips at the front, the two bells in it, a grille at its foot. The rest of the church is
    its parts as before.
  - **The shrines** (`shrine`): the Senhor do Bonfim, its top 4.1 m from the point cloud, a cream
    house with a glazed pale blue-grey door under a pyramidal roof; the Senhor da Boa Morte, under a
    cedar whose leaves the LiDAR took its roof for, 3.3 m as its photo shows it, open on two columns
    under its name and a hipped roof. The tiles leave them out as too small, so they aren't walls to
    the karts.
  - In party-kart they're baked together, 13 materials, a draw call each; two canvas textures,
    dressed granite in courses (`ashlar`) and rubble (`rubble`).
- **The map's outlines, as they are** (decision 022): Santa Tecla's is 2–3 m off where the LiDAR sees
  it, and 9.8 m across where its photo's front is 6.2 (the model takes the photo's width, on the
  outline's front); Santa Justa's is wider at the back than at its granite front (the white block on
  the right is the rest of it); Santo Adrião's reaches 2 m further back than the LiDAR's walls.
- **The viewpoints** (the owner, "Questions"): `capela-santa-justa`, a kart's, up the Rua Monsenhor
  Airosa as the race comes (apires, 2019-03-13); `capela-santo-adriao`, from a car on the route
  looking up the bank (apires, 2018-01-14), aimed at 206° and 5° up where its photo frames the chapel
  (Mapillary's 186.8° is the phone's compass), 2.5 m north of where Mapillary puts it. Their
  buildings' four missing entries added to `refs/buildings.json`. Shot before the work on braga-map
  1.19.0: `party-kart-056/shots/2026-10-17-before056/`, Santa Justa a white church kit and Santo
  Adrião a grey box behind its bank.
- **The photos:** nine in `refs/photos.json` (`landmark:capela-de-santa-justa`, `-santo-adriao`,
  `-santa-tecla`, `igreja-de-sao-lazaro`), Santa Justa's front from Commons straight on enough for a
  texture (a sight doesn't take one yet: 053's note on São João's). Commons gives no camera for
  most: where each stood and looked is as its photo frames it, said in its notes.
- **What it costs, so far** (`party-kart-056/shots/2026-10-17-try056/`, on 1.19.0 with 056's map,
  before the merge): High 122 → 137 draw calls at `capela-santa-justa` and 107 → 121 at
  `capela-santo-adriao`, triangles 1.73 and 1.51 M as they were; to measure on the round.
- **Tests:** braga-map `npm test` 110 of 110 after the merge with 1.20.0 (`test/sights.test.js`:
  the chapels on their buildings with their heights in order, Santa Justa to its street, the tower
  on the church's highest part, the shrines' sizes). party-kart `npm run check` clean; `npm test` 62
  of 62 on 056's map before the merge, 58 of 62 on 1.21.0: the autopilot's lap, the bots' race, the
  lap's timing and the kerb fail the same on 1.20.0 alone, waiting for 026's party-kart side.
- **Where it stopped** (2026-10-17, the owner): braga-map's `task-056` merged with main (026's 1.20.0)
  and tagged **1.21.0** (`v1.21.0`, pushed), its world made from main's carriageways and walls (the
  shared `.cache` held 026's later work: made again in a private copy of them); party-kart's
  `task-056` pinned to it. 026's party-kart side isn't on its main yet. Left: merge it into
  party-kart's `task-056`, the tests and a lap; shoot the round (`--medium`, for the budget) and post
  it on "Braga real" with Claude's marks; `/task finish 056` (a decision, the ROADMAP's item, these
  notes' "Done when"); merge both branches into main and push. Not deployed.
- **Found along the way,** for the finish: the shrines aren't walls to the karts; São Lázaro's other
  parts are the church kit's tall windows where its photo shows white render over granite slabs and
  a row of windows (no entry in `refs/buildings.json`).
