---
status: blocked
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

1. **Settle the edges** with the owner, on the map page: a polygon, not a box, following
   streets or plot lines, so a player meets a natural edge (a wall, a busy road) and not a cut.
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
   - what's solid: every building closed, no gaps a player can fall through, and which
     doors and gates open (if any);
   - what the player sees beyond the area: the tiles round it, the skyline.
4. **Plan the survey:** which viewpoints on foot (task 001) and which photos (task 008) cover
   each street, and what's missing.
5. **Privacy:** nothing in the area may single out a friend's house: no name, no marker, no
   texture from a photo of it (decision 004).

## Questions

- [ ] Where are the edges? Recommendation: the streets listed, plus one block on each side,
  bounded by the Avenida da Liberdade to the east, so the player sees the avenue but doesn't
  leave.
  > 
- [ ] What does the shooter need to enter: only the streets and squares, or also courtyards,
  the school's grounds, building entrances? Recommendation: streets, squares and open
  courtyards first; no interiors.
  > 
- [ ] Is the shooter on its own engine, or three.js like party-kart? It decides whether
  braga-map should also offer ready-made meshes, or stay data only. Recommendation: stay
  data only for now, and share the renderer's code later if both games use three.js.
  > 

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

Blocked on the three questions.
