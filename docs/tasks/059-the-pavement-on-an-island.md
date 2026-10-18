---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-17
depends-on: [026]
roadmap: Phase 2 · The shape
---

# 059 · A pavement the map has on an island is drawn as a pavement, not the island's grass

## Why

On the Avenida da Liberdade, south of the crossing at (276, 832), the photos of `liberdade` and
`lobato-crossing` are taken on a wide pavement of calçada, a red cycle lane on one side of it and a
hedge on the other. The tiles have the whole block between the Avenida's carriageway and the street
beside it as one island, and party-kart draws an island over 20 m² as grass: so the game shows grass
where the photo shows calçada, the cycleway running through the middle of a lawn. Task 058 put both
cameras on it, where their photos were taken.

## What

Today (2026-10-17):

- `tools/streets.mjs` makes an island of each hole between the carriageways that's under 600 m²
  (`ISLAND`), with nothing built on it and not a car park's rows, or that a roundabout goes round.
  The pavements are cut out of the islands (`minus(pave, [..., islands])`), so an island never has
  one, whatever its street's `sidewalk` tags say.
- `tools/lines.mjs` leaves out of the paths what the map draws as the streets' own
  (`STREETS_OWN`: `footway=sidewalk`, crossings, traffic islands and links): the map's sidewalks
  here, ways 1317883988 (`surface=sett`), 1327178236 and others round (276, 840), are dropped, as
  they'd be a pavement anywhere else. The Avenida's ways say `sidewalk=separate`.
- party-kart's `src/render/streets.ts` (`besides`) draws an island over 20 m² as grass ('verge'),
  under that paved.
- What the ground really is there: `node tools/carriageways.mjs --check 276,840` (the orthophoto,
  pale calçada beside the red cycle lane), and task 016's ground cover (`world.groundCover`).

Steps:

1. Find the islands in the open world's area that the map has a sidewalk on (a `footway=sidewalk`
   way inside or along one), and count them; the Liberdade's at (276, 840) among them.
2. On those, the sidewalk is a pavement: its band, at its width or a footway's usual 2 m, cut out of
   the island as a pavement piece, at the kerb's height as the streets' pavements are; the rest of
   the island stays an island. Or, if the island is mostly the sidewalk, all of it a pavement.
3. The tests: the Liberdade's island at (274, 835) is a pavement where `liberdade`'s camera stands;
   no island has a sidewalk of the map's running through it.
4. Shoot `liberdade` and `lobato-crossing` again (party-kart's `scripts/shots.mjs`).

## Read first

- `tools/streets.mjs` (`ISLAND`, the islands, `want` and the pavements), `tools/lines.mjs`
  (`STREETS_OWN`), decision 022 (the map as it is), party-kart's `src/render/streets.ts`
  (`besides`).
- Task 058's Notes: how the two cameras were put on this pavement.

## Done when

- [ ] `liberdade` and `lobato-crossing` stand on calçada in the game, as in their photos, the
  cycleway beside them: shot before and after, neither lower.
- [ ] Every island the map has a sidewalk on has it as a pavement (the test).

## Out of scope

- The cycle lane's place beside it (the map's line, task 050's cycleways).
- A roundabout's island and what stands in it: task 014.
- The pavements' heights: task 044.

## Notes

- Found by task 058 (2026-10-17), moving `liberdade`'s and `lobato-crossing`'s cameras off the
  carriageway onto the pavement their photos were taken from: the tiles have it as an island.
- From task 052 (2026-10-18, braga-map 1.24.0): it isn't an island any more. A street beside it gave
  way to the map's wall along its edge, which opened the carriageways' ring round it, so it's drawn as
  pavement 3.2 m out from the kerbs (calçada under `liberdade`'s camera, left of the cycle lane) and
  bare ground beyond (grey right of the lane, where the photo has calçada to the hedge). Check "Today"
  against it before starting.
