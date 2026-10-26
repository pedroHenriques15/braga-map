---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-26
depends-on: [044]
roadmap: Phase 3 · Surfaces and colours
---

# 136 · A pavement up a bank: a pale triangle of calçada at the Travessa do Fujacal's end

## Why

Task 044 lays the ground's pavements level from their kerbs (decision 085). In its round
(`2026-10-26-after044b`, against `2026-10-26-before044b` on 1.45.0), at `travessa-fujacal`'s end, in
the view towards (-315.8, 720.6), a steep pale triangle in the calçada's texture climbs the bank
beside the retaining wall, on Ultra and on High. The photo has a grass bank there. On 1.45.0 the
bank was the land, with a strip of pavement at its foot. Its mark stayed 3, the rest of the view as
before, but it reads as a wedge of pavement up a slope no pavement takes.

## What

1. Find what the triangle is: which of the tiles' pieces it belongs to, and which of 044's rules
   gave it its heights. Candidates:
   - a pavement eased back to the land where a path leaves it (12% of the difference over 1.2 to 8 m);
   - a point with no kerb bounding it, laid at the land's height;
   - the land cut along a pavement's back and faced (party-kart's `WorldGround.backs`).
2. Count how many such places there are over the open area, with what makes them: for example, laid
   pavement steeper than the easing's 12% along it.
3. Mend the rule so a pavement stops at the bank's foot, where a wall or the land meets it. Then
   `npm run world`, and shoot `travessa-fujacal` and the views that take in others.

## Read first

- `tools/streets.mjs` (`paveHeights`, `follow`, `mouthsOf`); decision 085; task 044's Notes.
- party-kart's `src/world/ground.ts` (`backs`) and `src/render/streets.ts`.
- The rounds `2026-10-26-before044b` and `2026-10-26-after044b` (party-kart's `shots/`).

## Done when

- [ ] At `travessa-fujacal`'s end the bank is the land (or as the photo has it), no pavement up it,
  rated no lower.
- [ ] The count before and after, and a test for the rule that made it.
- [ ] `npm test` here, and `npm test` and `npm run check` in party-kart, pass.

## Notes

- Found by the coordinator in task 044's round (2026-10-26). Seen at Ultra and High. Low wasn't
  looked at for it, and what made the triangle wasn't checked.
