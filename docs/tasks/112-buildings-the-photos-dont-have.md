---
status: todo
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

- [ ] Both viewpoints show what their photos have there (before and after), marked no lower.
- [ ] The rule's count over the map in Notes; `npm test` passes.

## Notes

- Found by the coordinator marking the baseline round `2026-10-24-after082` (2026-10-24).
