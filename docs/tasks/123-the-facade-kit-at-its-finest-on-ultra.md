---
status: doing
priority: medium
kind: code
repo: both
created: 2026-10-24
depends-on: [081, 085]
roadmap: Ultra · Braga at its most real
---

# 123 · The facade kit at its finest on Ultra: 80 px a metre, its bays with relief

## Why

A facade is its kind's kit drawn at 40 px a metre on High (decision 036); up close on a PC it
blurs, and its windows, sills and frames are flat paint. Task 085 makes the city's textures fine on
Ultra; the facades are a piece of work of their own, split from it (2026-10-24).

## What

1. The kit drawn at 80 px a metre on Ultra (party-kart's `src/render/facades.ts`), its canvas and
   its memory measured.
2. Its bays with normal maps (a window's reveal, a sill, a stone frame, the shutters' slats), Ultra
   only.
3. Shoot the facades' viewpoints at Ultra.

## Read first

- party-kart's `src/render/facades.ts`; decision 036; task 085's Notes.

## Done when

- [ ] Up close on Ultra (`conselheiro-lobato`, `lobato-east`, `fujacal-start`) the facades are sharp
  and their bays have relief, rated no lower.
- [ ] The cost in the budget's Ultra column; High and below unchanged; `npm test` and
  `npm run check` pass.

## Out of scope

- Each facade's doors and windows where they are: task 086.

## Notes

- Split from task 085 by the coordinator (2026-10-24), at worker-2's suggestion.
- **High's kit isn't 40 px a metre:** each bay is drawn 256 px a side whatever its size, so High's kinds
  run 71 to 91 px a metre (the old house 91 across, the 2000s block 71), a shop's 7.5 m bay 34 and the
  glass office's 1.5 m bay 171; the surfaces 85 (render, concrete, glass) to 320 (mosaic). Ultra draws
  them at twice High's, 512 a side (most kinds 142 to 182 px a metre), the surfaces' pixel-sized marks
  (a speckle, a joint) kept as big in metres. Decided by the session, for the owner to confirm.
- **The relief** (party-kart's `src/render/relief.ts`, `facades.ts`): each part of a bay drawn with how
  far it stands out of its wall or into it: a window's frame 10 cm in its reveal and its glass 14 cm, a
  sill 6 cm out, a stone frame 4 cm, a shutter's slats, a door's recess and its panels, a shop's glass
  10 cm in, an arcade 80 cm. Softened over 1.5 cm, turned into normals, a third texture beside the
  openings and the surfaces, which the walls' shader tilts its light by, as three.js tilts a normal
  map's, in the wall's frame. On Ultra only.
- **Its panes marked** (the coordinator, for task 117's reflections): the relief texture's alpha is 1
  where a bay's drawing is a pane, 0 elsewhere.
