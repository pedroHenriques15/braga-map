---
status: todo
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
