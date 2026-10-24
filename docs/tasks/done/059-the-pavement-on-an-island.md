---
status: done
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

**Widened by the coordinator (2026-10-24), on the session's recommendation:** the map's sidewalk is a
pavement wherever the tiles have none under it, on an island or on open ground alike (decision 022,
the map as it is): its band at the map's width or a footway's usual 2 m, cut by buildings, walls and
the paths, kerbed like the streets' pavements, with a test; the metres of the map's sidewalks off
every street piece counted before and after; all 33 viewpoints shot before and after. Why: since task
052 the Liberdade's block isn't an island (see Notes), so its first "Done when" can only be met by the
general case; and the islands' 292 m are a small part of the map's sidewalks the tiles don't pave.

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

- [x] `liberdade` and `lobato-crossing` stand on calçada in the game, as in their photos, the
  cycleway beside them: shot before and after, neither lower.
  > Marked by the coordinator (`after059.json`, High): `liberdade` 2 → 3, calçada from the red lane to the
  > hedge as its photo has; `lobato-crossing` as it was (its camera on the pavement at the block's tip
  > in both); none lower. Rounds `t059-before-137` / `t059-after`, and `t059-fix-before` / `-fix-after`.
- [x] Every island the map has a sidewalk on has it as a pavement (the test).
  > `test/streets.test.js`: 0 m of the map's sidewalks on an island (290 m on 1.37.0's tiles).
- [x] The map's sidewalks in the open world's area are pavements where the tiles had none under them:
  the metres of them off every street piece, before and after (the test).
  > The same test: 6 m more than a metre off every street piece, 12.2 km before; `npm test` 156/156.

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
- **Checked on 2026-10-24 (braga-map 1.36.0), the premise false:** the Liberdade's block isn't an
  island. Both cameras stand on pavement (calçada) at the block's south tip; its middle is open ground,
  drawn by the ground cover (task 016): paving, grey, at its south end and grass in its middle. In the
  shot of `liberdade`, right of the cycle lane is that grey ground where the photo has calçada up to the
  hedge, and calçada lies between the lane and the carriageway where the photo has the lane against
  the kerb (the lane's place: out of scope).
- **The map's sidewalks in the open world's area (step 1, widened):** 47.4 km of `footway=sidewalk`.
  22.5 km lie on the tiles' pavements, 3.9 km on carriageways, 0.5 km on paths, 0.3 km on islands (8
  ways, 292 m), and 20.3 km on open ground, off every street piece: 7.2 km of it within 1 m of a piece
  (a line along a pavement's edge), 4.8 km 1 to 2 m out, 7.0 km 2 to 5 m out, 1.2 km farther. The
  Liberdade's is way 1317883988: 16.8 m of it on open ground, right of the lane, where the photo has
  calçada.
- **The fix:** `lines.mjs`'s `sidewalksOf` reads the map's `footway=sidewalk` ways round the area (on
  the ground, outdoors), which `pathsOf` leaves out as the streets' own; `world.mjs` passes them to
  `streetSurfaces`, which, after the streets' pavements and the squares, paves each one's band at the
  map's width or 2 m, cut as a path is (back from the carriageways, the buildings, the water and the
  decks, and to the walls either side of its line), less the reservations; fills the slivers under a
  metre between one and a pavement; and takes its band out of an island. The kerbs follow, wherever a
  pavement is behind a carriageway's edge. A synthetic test in `test/streets.test.js` (an island, open
  ground, a gap filled, a house, a wall in its band, a kerb), and one over the area's tiles: on main's
  (1.36.0), 45.9 km of the map's sidewalks outside buildings, 290 m on islands and 12.2 km more than a
  metre off every street piece, which it fails on.
- **Rebuilt (2026-10-24, the world on braga-map 1.36.0's data):** 57,116 m² of the map's sidewalks paved
  where the streets' pavements didn't reach; kerbs 177 km (175 before). The area test: 45.9 km of the
  map's sidewalks outside buildings, 0 m on islands (290 m before), 5 m more than a metre off every
  street piece (12.2 km before). Two tests it touched: a sidewalk paved across the mouth of a passage
  under a building made the passage's footway give way to it and left the building uncut there (footway
  1513588959): the sidewalks now leave the passages under buildings alone. And task 052's measure of
  pavement past a wall leaves out the map's own sidewalks there (1.0% past walls, and 0.23 km of the
  map's sidewalks counted apart). `npm test` 154/155: the one failing, "the trees near the viewpoints
  are the species their photos show", isn't 059's: the shared `.cache/trees.json` was rewritten at
  18:51 by another task's tools before it landed, and the world built here carries its trees (it
  passed on main's tiles).
- **Shot (party-kart main 74436ae, High and Low, all 33):** before `party-kart-059/shots/2026-10-24-t059-before-137`
  (braga-map 1.37.0), after `.../2026-10-24-t059-after` (this branch's world). The budget: triangles
  +0.8% at the median on High (+1.3% at worst, conselheiro-lobato), +0.9% on Low; draw calls unchanged.
  `liberdade` stands on calçada from the red lane to the hedge, as its photo has; `sameiro` and
  `viriato-amaral-nunes` have a kerbed pavement along their right, as theirs have; `lobato-crossing`
  changes a little at the corner. For the coordinator's marks.
- **The coordinator's marks (High, `after059.json`):** `liberdade` 2 → 3; the rest unchanged, but at
  `alvaro-carneiro` a flat grey shape on the pavement by the kerb. It was the land: party-kart leaves the
  land drawn along the streets' outline, an edge no other piece runs the other way, and joining the
  map's sidewalks to the streets' pavements had put points on the kerbs that the carriageways don't
  have, so those kerbs read as outline (the pavements' outline along a carriageway, round there, from
  6.4 m to 15.7 m). Fixed: the map's sidewalks are pavements of their own, and the streets' pavements
  stay as they're cut from the carriageways (area-wide, the kerbs read as outline 14.65 km against
  main's 14.10 km: the new pieces' own ends at a kerb). The world rebuilt on 1.38.0; `npm test` 156/156.
  Shot again (party-kart main fa00deb, before on braga-map 1.38.0, after on this branch's world):
  `party-kart-059/shots/2026-10-24-t059-fix-before` and `-fix-after`, `alvaro-carneiro`, `liberdade`,
  `lobato-crossing`: the grey shape gone, `liberdade` as before the fix. Triangles +1.1% at the median.
- **Landed 2026-10-24:** braga-map 1.39.0 (lines.mjs `sidewalksOf`, streets.mjs, world.mjs, the world
  rebuilt in the merge turn, two tests, the README, decision 075); party-kart pinned to v1.39.0.
