---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-25
depends-on: [089]
roadmap: Ultra · Braga at its most real
---

# 129 · On Ultra, the near trees' shadows for less: cheaper crowns in the near cascades

## Why

Task 089 measured what the near trees cost on Ultra (2026-10-25): at `falperra`, 2560x1440, their
shadows are 3.7 of the frame's 9.8 ms, 1.3 in the first cascade and 0.9 in the second. What costs is
the leaf cards filling the fine near shadow maps, not the trees' count: drawing into each cascade only
the trees that could shade it saved 0.3-0.4 ms and was left out (089's Notes). Cheaper crowns in the
first two cascades' depth pass could save about 2 ms there.

## What

1. In the first two cascades' depth pass on Ultra, each near tree's crown drawn cheaper: fewer, larger
   cards, or another stand-in, its holes still letting the sun through as the leaves do.
2. Shoot the viewpoints with near trees' shadows at Ultra against the round before; look at the
   shadows under the trees near the camera; measure the frame at 2560x1440.

## Read first

- party-kart's `src/render/trees.ts`, `src/render/post.ts` (the cascades); task 089's Notes (the cost
  measured, the culling left out); task 120 (soft shadows), which works on the same cascades.

## Done when

- [ ] At `falperra`, 2560x1440 on Ultra, the trees' shadows cost at least 1.5 ms less.
- [ ] The leaves' shadows near the camera still read as leaves (`capela-sao-joao`, `liberdade`,
  `alameda-fujacal`), rated no lower; High and below unchanged; `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 089 (2026-10-25), drafted by the coordinator.
