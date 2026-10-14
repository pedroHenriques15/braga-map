---
status: todo
priority: high
kind: research
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 2 · The shape
---

# 015 · The shooter's area: its edges, and what walking distance needs

## Why

The first shooter is set in Fujacal and Conselheiro Lobato (decision 003). On foot, a player
looks at a wall from a metre away, walks into side streets, climbs steps, and stops to look up.
Everything the kart race gets away with at 80 km/h shows. Before the work starts, the area's
edges and what "real at walking distance" means here have to be written down, so every other
task knows what this area needs beyond the rest.

## What

Today the area is about x −350…350, z 600…1050 on the map (700 × 450 m), across the
`centro` and `picoto` sections (`tools/sections.mjs`), in tiles `x-1z1`, `x0z1`, `x-1z2` and
`x0z2`. Its streets, from OSM: the Rua do Fujacal (619 m, secondary), the Travessa do Fujacal
(496 m), the Alameda do Fujacal (489 m, part pedestrian), the Rua Conselheiro Lobato (646 m,
secondary) and the Travessa Conselheiro Lobato (351 m, part pedestrian, with a tunnel). The
Escola Básica do Fujacal is inside it. The Volta dos Amigos starts on the Rua do Fujacal.

1. **Draw the edges** on the map page, for the owner to check: the five streets above plus one
   block on each side, bounded by the Avenida da Liberdade to the east, so the player sees the
   avenue but doesn't leave (the owner's answer). A polygon, not a box, following streets or
   plot lines, so a player meets a natural edge (a wall, a busy road) and not a cut.
2. **Add it to the library** as a section of its own, `fujacal`, in `tools/sections.mjs`, so
   a game loads it with `loadWorld({ sections: ['fujacal'] })`, along with the tiles round it
   for what's seen beyond.
3. **Write the spec** for this area, in `docs/SHOOTER-AREA.md`. For each kind of thing, the
   detail it needs here and where it comes from:
   - buildings: footprint and height from the survey, facade from its photo, doors and windows
     where they are, balconies, the ground floor's shops;
   - ground: kerb heights, pavements, steps, ramps, drains, at centimetres;
   - walls, gates, railings, hedges (task 013);
   - street furniture, trees and parked cars where they are;
   - where the player goes: the streets, the squares and the open courtyards, and no
     interiors (the owner's answer); every building closed, no gaps a player can fall through,
     and which gates into the courtyards open;
   - what the player sees beyond the area: the tiles round it, the skyline.
4. **Plan the survey:** which viewpoints on foot (task 001) and which online photos (task 008)
   cover each street, and what's missing.
5. **Data only:** braga-map gives the shooter the same data it gives party-kart, and no
   ready-made meshes: the shooter's engine isn't chosen yet (the owner's answer). If it turns
   out to be three.js, sharing party-kart's renderer is a task then.
6. **Privacy:** nothing in the area may single out a friend's house: no name, no marker, no
   texture from a photo of it (decision 004).

## Questions

- [x] Where are the edges? Recommendation: the streets listed, plus one block on each side,
  bounded by the Avenida da Liberdade to the east, so the player sees the avenue but doesn't
  leave.
  > As recommended (2026-10-14): the streets plus one block on each side, the Avenida da
  > Liberdade the edge to the east.
- [x] What does the shooter need to enter: only the streets and squares, or also courtyards,
  the school's grounds, building entrances? Recommendation: streets, squares and open
  courtyards first; no interiors.
  > As recommended (2026-10-14): streets, squares and open courtyards; no interiors.
- [x] Is the shooter on its own engine, or three.js like party-kart? It decides whether
  braga-map should also offer ready-made meshes, or stay data only. Recommendation: stay
  data only for now, and share the renderer's code later if both games use three.js.
  > Undecided (2026-10-14): braga-map stays data only for now.

## Read first

- `tools/sections.mjs`, `index.js`, `index.d.ts`: sections and `loadWorld`.
- `docs/DECISIONS.md` 003 and 004.

## Done when

- [ ] The edge is agreed and drawn on the map page.
- [ ] `loadWorld({ sections: ['fujacal'] })` loads it, with a test in `test/`.
- [ ] `docs/SHOOTER-AREA.md` exists, and the other tasks link to it where it raises their bar.

## Out of scope

- Building the shooter itself.
- The detail work, which is in each task (013 walls, 017 facades, 018 pavements, 020
  furniture), done first in this area.

## Notes

- Unblocked on 2026-10-14, the three questions answered. When it's finished, record the area's
  edges and "braga-map stays data only" in `docs/DECISIONS.md`.
