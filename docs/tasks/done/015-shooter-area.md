---
status: done
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

- [x] The edge is agreed and drawn on the map page.
  > The owner agreed it as drawn (2026-10-15). The layer "Fujacal a pé" in `map/index.html`,
  > seen in Chromium with no errors, and on the shared map since its version 8.
- [x] `loadWorld({ sections: ['fujacal'] })` loads it, with a test in `test/`.
  > `test/shooter.test.js`, 5 of 5 passing; `npm test` 65 of 65.
- [x] `docs/SHOOTER-AREA.md` exists, and the other tasks link to it where it raises their bar.
  > Tasks 013, 016, 017, 018, 019, 020, 042 and 044, in "Read first".

## Out of scope

- Building the shooter itself.
- The detail work, which is in each task (013 walls, 017 facades, 018 pavements, 020
  furniture), done first in this area.

## Notes

- Unblocked on 2026-10-14, the three questions answered. Finished, both are in decision 031.

### The work, 2026-10-15

- **The edge** (`tools/shooter.mjs`, `npm run shooter`, into `tools/shooter.json`): the Avenida
  Imaculada Conceição to the north-west and the Avenida da Liberdade to the east, at their near
  kerbs (their slip roads' too, but those into the Rua Monsenhor Airosa, which are its), and the
  Rio Este to the south, at its near bank (6 m from its line, as `world.mjs` has it), close the
  five streets in with the Rua Monsenhor Airosa. Past it, "a block on the west" is the block
  behind it, down to the river: the houses on the street, the flats round the Rua Doutor José
  Vilaça's driveway and their courtyard (reached on foot through a passage under the houses), and
  the Rua de Santa Justa by the river, named by their OpenStreetMap ways (`BEHIND`; the script
  stops if one goes). There the edge runs half way between the streets in and those out, round the
  buildings, and crosses each street leaving square, as `open.mjs` does (its `square` is exported
  for this). 21.5 ha, 143 points. On the north and the east the avenues were taken as the edge, as
  the owner's answer has the Avenida da Liberdade: the block on those sides is the one between the
  five streets and the avenue. Across the Avenida Imaculada Conceição (the Rua de Sá de Miranda's
  block) is out.
- **Squaring:** a street that reaches an avenue's carriageway or the river isn't squared (the
  kerb or the bank runs across its mouth already): squaring the slip road off the Avenida
  Imaculada Conceição into the Rua Monsenhor Airosa pushed the edge across the avenue to the Rua
  de São Geraldo, and the Largo Santa Justa's bridge 2 m into the river. So 4 of its 10 gates,
  where a street meets an avenue, follow the kerb, 8–70° from square; the other 6 are within 1°.
- **The library:** `sections.mjs` has `SHOOTER` (the ring), `SHOOTER_BOX`, `inShooter`,
  `SHOOTER_TILES` (3: `x-1z1`, `x0z1`, `x-1z2`) and `SHOOTER_SEEN` (12 within 500 m, as the open
  world's). `world.mjs` puts `shooter: { id: 'fujacal', name, pts, gates, tiles, seen }` in the
  base, `map()` gives it with `inShooter`, and `loadWorld({ sections: ['fujacal'] })` loads its
  tiles and those round it. It isn't one of the six sections: they share the map out (a test
  says each tile is in one), and Fujacal overlaps Centro and Picoto, so `sectionAt` never answers
  it and loading all six sections doesn't load it twice. `npm run world` changed `world/base.js`
  only: every tile is byte for byte the same (the ground every 2 m still on the box's 4 tiles).
- **Where the box was used,** the edge is now: `audit.mjs`'s shooter's area (its 250 m squares
  over `SHOOTER_BOX`), `round.mjs`'s "Fujacal" filter on the scorecard (next `node tools/round.mjs`:
  `imaculada-conceicao`, on the avenue's carriageway, and `sao-joao-da-ponte`, over the river,
  leave it; 8 on foot and 2 kart viewpoints stay), and the tests.
- **The map page:** a layer and a card, "Fujacal, a pé" (`map/index.html`, `drawShooter`), the
  edge in teal with a bar at each gate; `map/braga.json` gained `shooter` and nothing else. Seen in
  Chromium (Playwright, party-kart's) with no errors. The shared copy (the artifact) was published
  with it on 2026-10-15 (version 8), at the owner's word; it had been task 032's page, so it also
  gained task 006's street-audit layer, which had never been published.
- **The spec,** `docs/SHOOTER-AREA.md`: where it is, what's in it, what walking distance needs of
  each kind of thing and from where, where the player goes, what's seen past the edge, the survey
  street by street, and the gaps. Tasks 013, 016–020, 042 and 044 link to it in "Read first".
- **Found, for task 013:** the footways, the steps and the Ecovia that cross the edge have no gates
  (the world has no footways yet); 013's "Read first" says to give them theirs.
- **The owner agreed the edge as drawn** on 2026-10-15, over taking in the block across the
  Avenida Imaculada Conceição and over keeping the west to the row on the Rua Monsenhor Airosa.
- **Not verified:** that every courtyard the spec calls open is reachable without a gate (the
  photos don't show most of them); the per-street counts in the survey count a building for the
  named street nearest it, which puts both rows of a block on one street at times.

### Finished

- **On 2026-10-15.** No viewpoints to shoot again and no budget to check: the task changes nothing
  a game draws. Decision 031 records the edge, the section and "braga-map stays data only";
  `docs/ROADMAP.md` has it done in Phase 2, and the README the section and `npm run shooter`.
  party-kart gets the area with braga-map's next version (1.13.0).
