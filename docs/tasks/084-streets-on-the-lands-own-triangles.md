---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [083]
roadmap: Ultra · Braga at its most real
---

# 084 · On Ultra, the streets on the land's own triangles

## Why

The streets are drawn as surfaces laid on the ground, the land left out under them, and a skirt
or a retaining wall closes the gap at their edges (decision 024). It costs nothing on a phone, but
the seam shows: a pavement's back meeting a garden at a skirt, not at the ground. Decision 024
rejected laying the streets on the land's triangles for its 3.8 M triangles; on Ultra, with the
50 cm ground (083), they can be one surface.

## What

Today: braga-map's tiles hold each street as a surface (`world.streets`, task 033) at its levels,
the ground under it held to its carriageway (decision 049); party-kart's `src/render/streets.ts`
draws them, `src/world/land.ts` builds the land and leaves out what's under a street, and the
edges are closed by skirts and walls.

1. **One mesh near the player on Ultra:** within the 50 cm level (083), the land's triangulation
   takes the streets' edges (kerbs, pavements' backs, islands) as constrained edges, so a street,
   its pavement and the land beside it share vertices. A constrained Delaunay in party-kart, per
   tile and level, built off the main thread.
2. **The kerb is a step in the mesh,** 15 cm (`ground.ts`'s `KERB`), not a separate strip.
3. **Further than the 50 cm level,** and on High and below, decision 024's surfaces as now.
4. Decks and tunnels stay their own (decision 023).

## Read first

- `docs/DECISIONS.md` 023, 024, 049; party-kart's `src/render/streets.ts`, `src/world/land.ts`,
  `src/world/ground.ts`, `src/render/tin.ts`.

## Done when

- [ ] On Ultra, no skirt is drawn within the 50 cm level, and the pavements' backs meet the land
  at its own height (`lobato-pavement`, `travessa-lobato`, `alameda-fujacal`).
- [ ] No viewpoint changes on High, Medium or Low.
- [ ] `npm test` and `npm run check` pass; the cost is in the budget's Ultra column.

## Out of scope

- The ground's 50 cm level itself: 083.
