---
status: todo
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
