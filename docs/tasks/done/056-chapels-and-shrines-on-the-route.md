---
status: done
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

- [x] Each of the six built at its real size, checked against its photo.
  > Each at the size and heights the map and the LiDAR give it (Notes, "What was built"), and set
  > beside its photos in `?view` shots from where they were taken: Santa Justa's front against
  > Commons' straight-on photo, Santa Tecla's against its own, Santo Adrião's porch and south side
  > against its two, the Senhor do Bonfim and the Senhor da Boa Morte against Mapillary's from the
  > street, São Lázaro's tower against what the LiDAR measured of it; and the two chapels in their
  > viewpoints' shots, beside the viewpoints' photos.
- [x] The viewpoints that see them shot again, no worse.
  > In "Capelas e nichos" (`2026-10-17-after056`): the two new places, 2 each on Claude's marks,
  > where the before (`before056`, on 1.19.0) would have had 2 (`capela-santa-justa`, without its
  > bell gable and granite) and 1 (`capela-santo-adriao`, a grey box up the bank). None of the other
  > 32 sees them: their shots are the same as "As ruas no sítio"'s (under 0.2% of the pixels changed
  > but `estadio`'s 1.1%, where no change shows), their marks too. 2.50 over the 34.
- [x] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).
  > Notes, "The budget"; party-kart's `docs/architecture.md`.

## Out of scope

- The 32 landmarks: task 021 for those the race sees, "Later" for the old town's.
- What stands in the roundabouts (the statues of São João and of Santos da Cunha): task 014.

## Notes

- Drafted 2026-10-16 from task 021's check of its table.
- **What was built** (braga-map 1.21.1; party-kart `chapels.ts`, `sights.ts`, `city.ts`):
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
- **Tests:** braga-map `npm test` 110 of 110 on 1.21.1 (`test/sights.test.js`: the chapels on their
  buildings with their heights in order, Santa Justa to its street, the tower on the church's
  highest part, the shrines' sizes). party-kart (`09d0f7c`, on 1.21.1 with 026's fix in `ground.ts`)
  `npm test` 62 of 62, its lap "laps 302.0, 299.8 s; respawns 0; longest air 2.02 s; top 217 km/h;
  wall hits 52" (1.20.1's: "laps 302.1, 300.0 s; … wall hits 51"); `npm run check` clean; and a lap
  in the browser with the autopilot and three bots from the start back to free roam in 5:22, no error
  on the page.
- **The budget** (party-kart's `shots/2026-10-17-after056/`, `09d0f7c` on 1.21.1, against 026's
  `after026` on 1.20.1, the 32 viewpoints both shot, at the median): draw calls 143 → 155 on High,
  142.5 → 154.5 on Medium, 103.5 → 110 on Low (the six baked into 13 materials, drawn wherever any
  is in view: up to 19 more on High, at `conselheiro-lobato` and `alameda-fujacal`, and 3 to 4 where
  none is); triangles 1.802 → 1.809 M on High, 1.507 → 1.515 on Medium, 0.826 → 0.830 on Low (7
  to 9 k more); textures 133 → 134 MB on High and 48 → 49 on Low, the two canvases (`ashlar`,
  `rubble`), the same 81 on Medium. The city built in 4.7–5.2 s on High, 3.7–4.0 on Low, a frame
  0.4–2.2 ms. The two new places: `capela-santa-justa` 137 calls and 1.75 M triangles on High (97,
  0.76 M on Low), `capela-santo-adriao` 121 and 1.52 M (83, 0.71 M). The download on High 8.04 MB
  gzipped (14.43 as is, 0.01 MB more): the base's sights.
- **Landed** (2026-10-17): braga-map's `task-056` merged with main twice, 026's 1.20.0 and then its
  1.20.1, tagged **1.21.0** on the first and **1.21.1** on the second (`v1.21.1`, the one pinned;
  `v1.21.0` left where it is, as 1.20.0 was). The whole remake on 1.20.1: `carriageways.mjs` and
  `walls.mjs` made again from main's code, the same as the shared `.cache`'s; then `npm run open`,
  `npm run shooter`, `npm run world`, `npm run tracks`, `cover.mjs`, `textures.mjs` and the page.
  Beside 056's own (the sights; the facades of the five buildings it gave entries, and the guesses
  that follow them in about thirty tiles), main's own code moves 16 of the race's points by up to
  0.9 m near (−558, 1158) and the streets, paths and walls a little in four tiles (x-2z2, x-1z2,
  x1z2, x2z2) from what 1.20.1's tiles have: two runs make the same. party-kart's `task-056` pinned
  to `v1.21.1`, with main (026's fix) merged in. Not deployed: the planning session deploys 021, 026
  and 056 together.
- **The round:** `2026-10-17-after056` ("Capelas e nichos"), shot on party-kart `09d0f7c` and
  braga-map 1.21.1 with Medium for the budget, published on "Braga real" (its version 14), open for
  marks, closing "As ruas no sítio". Claude's marks (`scores/claude`, each comment starting
  "(Claude)"): 2.50 over the 34, the 32 of before as they were (2.53), the new places 2 and 2.
- **São Lázaro's church** got its entry in `refs/buildings.json` at the finish, from its listed photo:
  white render over a base of big pale granite slabs, as a civic building's rows of windows, not the
  church kit's tall ones.
- **Left, for 053's pass:** the shrines aren't walls to the karts (the tiles leave them out); Santa
  Justa's front has a Commons photo good enough for a texture, unused, as São João's side is (a sight
  doesn't take one); the Igreja de São Lázaro's tower is the LiDAR's outline with its slot where the
  outline dips, and no listed photo shows its face to the street; the sights are drawn whole
  wherever any is in view.
- **Done** 2026-10-17 (decision 040).
- **Deployed** 2026-10-18 from party-kart `96b3ebb` (braga-map 1.22.0), with 021, 026, 056, 057 and 049 together, at the owner's word: the live page serves the build (`index-CM6aZCpG.js`), and on it a race with the autopilot and three bots went over the jump, landed on the street and drove on, with no page error.
