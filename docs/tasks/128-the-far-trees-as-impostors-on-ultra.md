---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-25
depends-on: [089]
roadmap: Ultra · Braga at its most real
---

# 128 · On Ultra, the far trees as impostors baked from each kind's near tree

## Why

Past the near trees' reach (700 m on Ultra since 081) a tree is its kind's billboard, the same flat
picture turned to the camera (decision 043): from the Picoto or Bom Jesus the woods are cards. Task 089
tried a lit crown of each tree's own shape there instead, and took it out (2026-10-25): its brightness
matched the near cards, but it looked like smooth blobs with dark rims, not leaves, worse than the
billboards. Its first item, octahedral impostors, is this task.

## What

1. For each kind, its near tree (089's cards and limbs) baked into an octahedral impostor: 8 or more
   directions round and above it, with depth and normals, at a size a far tree needs.
2. On Ultra, each tree past the near reach drawn as its kind's impostor at its own height and crown,
   lit by the sun from its normals, blended into the near tree over the hand-off.
3. Shoot the far views at Ultra; measure the frame and the memory.

## Read first

- party-kart's `src/render/trees.ts`, `src/render/woods.ts` (089); decisions 043, 047, 051; task 089's
  Notes (what was tried and why it was taken out).

## Done when

- [ ] From `picoto-top`, `bom-jesus`, `sameiro` and `falperra` on Ultra the woods have depth and light,
  not cards, and look like leaves; rated no lower.
- [ ] A frame within 16 ms; High and below unchanged; `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 089 (2026-10-25), drafted by the coordinator.
