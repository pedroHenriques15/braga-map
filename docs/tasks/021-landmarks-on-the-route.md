---
status: todo
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

Today `../party-kart/src/render/sights.ts` builds the sights `tools/world.mjs:317-341` places
(kinds in `index.d.ts`: bomjesus, sameiro, cruzeiro, tourigalo, makro, altice, stadium). The
landmarks closest to the route (distance from its centre line, 2026-10-13):

| Landmark | Distance | Today |
|---|---|---|
| Picoto Adventure Park | 47 m | a sign |
| Estádio 1.º de Maio | 124 m | a model: track, stands, floodlights |
| Altice Forum Braga | 193 m | a white fascia on a plain building |
| Parque da Ponte, and São João da Ponte | 229 m (the Largo is on the route) | nothing |
| Monte e miradouro do Picoto | 267 m | the cross |
| Museu D. Diogo de Sousa | 293 m | nothing |
| Palácio do Raio, Fonte do Ídolo, Cividade | 410–430 m | nothing |
| Igreja de Lamaçães | 507 m | nothing |
| Theatro Circo, Congregados | 551 m, down the Avenida da Liberdade | nothing |

Also on the route, not among the 32: Makro (a fascia) and the Tourigalo's bull (a model).
party-kart has about 1,400 lines of cartoon models of the old-town landmarks
(`../party-kart/src/render/landmarks.ts`, `braga.ts`) that nothing builds; they're for the
first track, not to scale.

Steps, landmark by landmark, nearest first:

1. **What it really is:** its footprint (OSM), height (LiDAR, task 010), and photos from four
   sides (task 008, Wikimedia Commons with open licences, task 005).
2. **Build it** in party-kart as a model at its real size (decision 004: only Bom Jesus and the
   Sameiro are exaggerated), with photo textures where decision 002 and the photos allow.
   Each one a function in `sights.ts` or its own file, placed by `tools/world.mjs` as a `Sight`.
3. **São João da Ponte first:** the chapel, the Largo, the bridge and the park, as the route
   passes them. Then the Altice Forum's real shape, the Estádio 1.º de Maio checked against its
   photos (its stands, colours and floodlights), and the Picoto's miradouro.
4. **The view down the Avenida da Liberdade:** what's seen from the route (the Theatro Circo,
   the Congregados' towers) at their real size.
5. Delete the cartoon models in party-kart that a real one replaces, or keep them only where
   the first track still needs them.

## Read first

- `../party-kart/src/render/sights.ts`, `tools/world.mjs:317-341`, `index.d.ts` (`Sight`).
- `map/braga.json` (`landmarks`), `tools/build.mjs:213-247` (`LANDMARKS`).
- `docs/DECISIONS.md` 002 and 004.

## Done when

- [ ] São João da Ponte, the Altice Forum, the Estádio 1.º de Maio, the Picoto's miradouro and
  the Igreja de Lamaçães (if seen from the route) are built at their real size, each checked
  against its photos at a viewpoint.
- [ ] Their viewpoints score higher on the scorecard than at the baseline.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- The old town's landmarks that the route doesn't see: "Later", when a track or the shooter
  goes there.
- Bom Jesus and the Sameiro: drawn already, and exaggerated on purpose (decision 004).

## Notes
