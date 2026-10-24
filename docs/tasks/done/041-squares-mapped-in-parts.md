---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-14
depends-on: [006]
roadmap: Phase 2 · The shape
---

# 041 · The squares mapped in parts: the Praça da República in the world

## Why

The street audit (task 006) found that the world draws every street OpenStreetMap has round the
Volta dos Amigos, but 8 of its 51 squares: the Praça da República, the Praça Conde de Agrolongo,
the Terreiro do Castelo and five without a name. OpenStreetMap maps each of them as a multipolygon
relation, in parts, and the world reads only the squares mapped as one way. So the ground there is
painted as whatever is under it, not as a square, and the Praça da República, the map's (0, 0), is
the most known square in Braga.

## What

Today (2026-10-14):

- `tools/fetch.mjs`'s `base` fetches `way["highway"="pedestrian"]` only. Its `paths` part (task
  006) fetches `relation["highway"="pedestrian"]` too, for the audit: 10 over the map, 8 of them
  in the Volta dos Amigos' box, none in the open world's area.
- `tools/world.mjs` makes a square of a way (`isSquare` in `tools/lines.mjs`: `highway=pedestrian`
  with `area=yes`, or closed) and adds it to the areas as `plaza`, painted last. It reads only
  `base.json`'s ways, so a relation never becomes one. `tools/streets.mjs` takes the `plaza` areas
  as the squares its pavements stop at.
- `tools/build.mjs` (the map page) does the same with the ways, and also never sees the
  relations.
- `tools/audit.mjs` checks a square by its outline: drawn where a `plaza` area's edge in the tiles
  runs within 1 m of it. It prints the 8 under "Streets, squares and railway in the box the tiles
  don't draw whole", with their relation ids and where they are.

Steps:

1. Fetch the pedestrian relations where the world reads them: move `relation["highway"="pedestrian"]`
   into `base` (`node tools/fetch.mjs base`, which also brings the map's other changes since
   2026-10-13: run the tracks and the games' tests after), or have `world.mjs` and `build.mjs` read
   `paths.json` too. The first keeps every street and square in one file.
2. Join each relation's `outer` member ways into rings, as `footprints()` in `tools/osm.mjs` does
   for a building mapped in parts (or `rings()` in `build.mjs`). An `inner` ring (a hole: a
   building, a fountain, a garden in it) can't be cut out of an area the way the tiles hold them
   (one ring each): say what's under it in Notes, and whether painting the hole's own area after the
   square (as a smaller one is painted after a bigger) covers it.
3. Add the rings to the areas as `plaza` in `world.mjs`, and to the page's areas in `build.mjs`.
4. Two ways tagged as areas that aren't pedestrian (a `residential` and a `service`, both outside
   the Volta dos Amigos' box) are drawn today as a street round their outline. Leave them, or
   treat them as squares too, and say which in Notes.
5. Run `npm run world`, `node tools/audit.mjs` and `npm run page`, and `npm test`.

## Questions

- [x] Fetch the relations into `base` again (one file, but 11 days of OSM edits into every tile and
  maybe the tracks), or have `world.mjs` and `build.mjs` read `paths.json` too? Recommendation:
  read `paths.json`, so only the squares change.
  > Read `paths.json` too, no fetch (the owner, 2026-10-24): step 1's second way.
- [x] Its squares are outside the playable area (none in the open world's, task 006): done anyway?
  > Done (the owner, 2026-10-24): the squares in the tiles, on the map page and in the far city's
  > painted ground.

## Read first

- `tools/lines.mjs` (`isLine`, `isSquare`), `tools/world.mjs` (the areas, and the squares it hands
  `streetSurfaces`), `tools/osm.mjs` (`footprints`), `tools/build.mjs` (`rings`, the areas).
- `tools/audit.mjs` and `docs/tasks/done/006-street-audit.md`: how a square counts as drawn.

## Done when

- [x] `node tools/audit.mjs` prints every square in the box drawn whole (51 of 51 in today's map),
  and nothing under "Streets, squares and railway in the box the tiles don't draw whole" but the
  streets being built or of no known class.
  > 53 of 53 on 2026-10-24, and only the four ways being built or of no known class, once the audit
  > reads the streets where the world draws them (Notes).
- [x] The Praça da República is a `plaza` area in the tiles round (0, 0), and on the map page.
  > `loadWorld` round (0, 0): plaza at (0, 0) and at the Praça's middle (-24, -22), none on main;
  > `map/braga.json`: (0, 0) inside a plaza, its fountain's hole not.
- [x] No viewpoint looks at these squares today (the nearest was `joao-xxi`, 290 m from one, dropped
  in task 052): a
  shot of party-kart's city over the Praça da República, before and after, shows it paved as a
  square.
  > party-kart's `shots/2026-10-24-task041-before/` and `-after/`, `republica-air` and
  > `republica-street` at High and Low: paved as a square, its fountain and lawns cut out (Notes).
  > No viewpoint changes (`31-de-janeiro` and `porfirio-da-silva`, the nearest facing one, the same
  > before and after).

## Out of scope

- What a square looks like (its paving pattern, its fountain, its benches): tasks 018 and 020.
- Squares OpenStreetMap lacks: none was found along the route or in Fujacal (task 006).

## Notes

Found by task 006's audit on 2026-10-14, OpenStreetMap of 2026-10-13 (`base`) and 2026-10-14
(`paths`).

Done on 2026-10-24 by worker-3 of the run with three worker sessions (task 103), in a worktree of
its own; no fetch (the owner's answer).

- **The relations:** `paths.json` has 10 `highway=pedestrian` multipolygons, all `type=multipolygon`
  (`isSquareInParts` in `tools/lines.mjs`). Every outer ring closes when its ways are joined
  (`memberRings` in `tools/osm.mjs`, which `world.mjs` already used for the land's relations): 13
  outer rings and 43 holes. `world.mjs` adds each outer ring within 50 m of the map as a `plaza`
  area, as it does a square mapped as one way (to 0.5 m), and `build.mjs` adds the page's from the same
  file, outer rings and holes in one area, which the page fills even-odd.
- **Step 2's premise is out of date (the holes):** the tiles have held an area's holes since task
  016 (`kind + 16 × its holes`, and party-kart's `city.ts` and `ambience.ts` read them), so each inner
  ring is cut out of its square, not painted over. A hole shows what's painted before the square:
  - the lawns (`landuse=grass`, 22 of the holes) and the gardens (`leisure=garden`, 4) as grass and
    park, which are areas of their own, painted before the squares;
  - the fountains (the Chafariz of the Praça da República, the Praça Conde de Agrolongo's fountain and
    cascade, one in relation 11296489: `natural=water`) as water;
  - the buildings in them (the Coreto da Avenida and another on the Avenida Central,
    the Torre de Menagem in the Terreiro do Castelo, four on the Praça Conde de Agrolongo, one in
    relation 6968067) under their buildings;
  - two walls drawn as areas (`barrier=wall`, `area=yes`, relation 11278104), a playground
    (`leisure=playground`, the Praça Conde de Agrolongo) and two ways with no tags (relation
    11278104, looked up on OpenStreetMap's API on 2026-10-24) as whatever the square stands on.
- **The street surfaces:** `streets.mjs`'s `streetSurfaces` paves each square in its box as the
  pavements (task 033), from its outline. It now takes each square as its outline and then its holes,
  and paves the square less its holes, so a lawn or a fountain in one isn't paved over. The squares
  in parts are outside the open world's area but inside its box (`OPEN_BOX`), so the surfaces there
  take them, as they take the squares mapped as one way.
- **Step 4, the two ways tagged as areas that aren't pedestrian:** left as they are, drawn as a street
  round their outline. They are way 210411974 (`highway=residential`, `area=yes`, 1,050 m², the end of
  the Rua da Junta de Freguesia at (4087, -1420)) and way 365708343 (`highway=service`,
  `service=driveway`, 416 m², at (2381, -1147)), both outside the Volta dos Amigos' box and the open
  world's area. They're driven on, and `plaza` is a pedestrian square: tasks 018 and 020 will give a
  square its paving and its furniture, which a yard for cars hasn't.
- **The audit's premise is out of date (the streets on their carriageways):** `tools/audit.mjs` read
  `base.json` and `paths.json` as fetched, but since task 026 the world draws the streets moved onto
  their carriageways, where the LiDAR measured them. On main's world of 2026-10-24 (braga-map
  1.34.0) the audit listed 167 ways in the box not drawn whole, and 183 lines in the tiles along no
  street of their kind, nearly all of them streets drawn 50 to 89%: the move, not a gap. It now reads
  both through `onCarriageways`, as `world.mjs` does: on the same world, 13 not drawn whole (the 8
  squares, the 4 ways being built or of no known class, and one 14 m street) and 0 stray lines.
- **The audit's tolerance:** that 14 m street, the Rua Ambrósio dos Santos (way 22568627), 87% drawn,
  is a slight bend the tiles keep as one straight line, its middle 1.1 m off it. The tiles keep a
  street to within 0.8 m (`openThin` in `world.mjs`) and in half metres, up to 0.35 m more, so the
  audit's 1 m was tighter than its own comment says: `TOL` is 1.2 m. It counts a square's holes'
  outlines as drawn too, since a relation's inner ways are among its lines.
- **The world** (`npm run world`, 2 min 43 s): 29 of the 140 tiles change. In 22 only the squares' ranks
  among the areas move (the new squares are bigger, and squares are painted biggest first); the
  squares and their holes are in 9; the streets' surfaces pave the 7 squares in the open world's box
  in `x-1z-1`, `x-1z0`, `x-2z0`, `x-3z0`, `x0z-1` and `x0z0`, the footways through them giving way to
  that paving, as in a square mapped as one way. Two trees move off the new paving, 1 to 1.5 m. The
  terrain, the lines and the buildings are the same, value for value.
- **A wall's gap closed (outside the open world's area):** the walls are cut where a carriageway or a
  path crosses them, not a pavement. A footway that came into the square at (-1027, 251) (relation
  20029700) through a 1.2 m gap in the wall at (-983, 264) is now under the square's paving, so the
  gap closes: the only wall that changed (`x-2z0`, 706 walls to 705). A square mapped as one way does
  the same today. It's outside the open world's area, where no kart or walker goes; reported to the
  run's coordinator as work found along the way (a wall cut where a footway the pavements took over
  crossed it).
- **The audit** after the world (OpenStreetMap of 2026-10-13 and 2026-10-14): in the box all 53 squares
  drawn whole (10.6 km of outline and holes; 51 squares were counted on 2026-10-14), and under "the
  tiles don't draw whole" only way 1549635736 (`construction`, 102 m) and ways 1524395148, 1416075655
  and 1524395149 (`road`, 99, 67 and 44 m); 0 stray lines. The streets: 220 km in the box, all drawn.
  In the open world's area its 14 squares as before (no square in parts is in it).
- **The map page** (`npm run page`): 74 squares, the 10 in parts among them (8 with more than one
  ring, filled even-odd); (0, 0) and the Praça's middle are in one, its fountain isn't.
- **party-kart** (its `?scenery`, on braga-map 1.34.0 from main and on this worktree, `--install-links`,
  at High and Low): three framings with no photo, through `shots.mjs --map=` and a scratch
  `refs/viewpoints.json`: the Praça da República from the air (camera at (30, 125, 110)), at eye
  height from its east end ((75, 38.4, -10)), and the Praça Conde de Agrolongo from the air ((-300, 120,
  0)). The Praça da República is paved as a square: the pavements' paving from its edges to the
  fountain, which is water in it, the bandstand and the lawns cut out, where the ground's cover showed
  under a ring round the fountain before (56,169 pixels differ at High). The Praça Conde de Agrolongo
  doesn't change in the game (0 pixels): it's in the Volta dos Amigos' box, where the game draws the
  ground from what the LiDAR and the orthophoto classed (task 016) rather than the areas, and north of
  the open world's box, where no street surface is made. It changes in the tiles and on the map page.
  The Praça is in the far city (party-kart draws buildings within 300 m of the open world's area), so
  it has trees, streets and painted ground and no buildings, before and after.
- **No viewpoint changes:** the nearest that faces a square, `31-de-janeiro`, is 563 m from one, and
  `porfirio-da-silva` 799 m; shot before and after at High and Low they differ by one pixel, faintly.
  No round, then; the shots are in party-kart's `shots/2026-10-24-task041-before/`, `-after/`,
  `-vp-before/` and `-vp-after/`.
- **The budget:** the same draw calls and textures in every shot; triangles +476 to +511 at High (of
  1.0 to 1.7 million) and 98 to 407 fewer at Low (the footways the paving takes over); the tiles 2.6 KB
  more (14,069 to 14,072 KB), `map/braga.json` 4 KB more. Medium wasn't compared: only main's was shot
  (`shots/2026-10-24-task041-med-before/`), the merge turn coming before the other.
- **Tests:** `npm test`, 149 of 149, again after the rebase onto main's 9f3e894.
- **Landed** in worker-3's merge turn as braga-map 1.35.0 (tag v1.35.0). The coordinator looked at
  the Praça's shots and approved them (2026-10-24 14:50), and puts step 4's decision in task 103's
  table. The shared map page, which waits for the owner's account (task 103), has `map/` changed
  again by this task.
