---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-14
depends-on: [033]
roadmap: Now · The open world
---

# 035 · The streets drawn: every street in the area as the track is drawn today

## Why

Only the track is built in 3D today: asphalt or setts, lane lines, granite kerbs, calçada
pavements meeting the ground, decks and tunnels' mouths. Every other street is a stripe painted
on the ground's texture at 1 m a pixel, flat, with no kerb and a gap in the track's pavement
where it joins. In the open world (decision 019) a player drives down those streets too, and
they have to look as real as the route does: as Braga's streets are.

## What

Today, in party-kart:

- `src/render/road.ts`'s `buildRoad` builds the track as ribbons along its samples: the
  carriageway (asphalt, or setts where `surface` says so), the lane lines (`lanes`), and beyond
  each edge (`kerbs`) a granite kerb and a calçada pavement sloping to meet the ground, a retaining
  wall where the ground is higher and a skirt where it's lower (`edges`, from `city.ts`).
- `src/render/city.ts`'s `buildCity(track, course, quality)` loads the track's box, keeps the
  buildings within 300 m of the road and clears those on it, builds the land (cells of 10 m split
  to 2 m where the road or the ground needs it, kept just under the road and its pavements, verges
  beside it), and paints everything else on one canvas over the land (`paintGround`): the areas,
  every other street at its width with a pale band for its pavements, the railway. Lamps, zebra
  crossings, traffic lights, bus stops and the blue-and-white street plates stand along the track
  only (`streetFurniture`, `streetPlates`, `lamps` in `road.ts`).
- `src/render/levels.ts` draws the decks of the bridges off the track and the tunnels' mouths
  (task 012).
- braga-map gives every street in the area as surfaces (task 033, `world.streets`):
  carriageways and junctions as polygons with their surface, kerbs, pavements, reservations,
  markings, each at its level; and the area with its gates (task 032, `map().open`).

Steps, first on Fujacal's tiles, then the whole area:

1. **The streets' meshes,** from `world.streets`: the carriageways and junctions triangulated, in
   asphalt or setts as the track's are; the markings over them; the kerbs as the track's granite,
   dropped at the crossings; the pavements in the track's calçada, meeting the ground at their back
   as the track's do, with a retaining wall or a skirt where they must. Merged per material and
   per tile (`bake()`, `mat()` in `src/render/kit.ts`), so draw calls stay near today's.
2. **The land under them:** fine where a street needs it, as the track's is, so no land shows
   through a street and no street floats over the land, on every street in the area; the canvas
   paints no street there any more (still beyond the edge, where the city is only seen).
3. **Bridges and tunnels for every street:** `levels.ts`'s decks, parapets, pillars and mouths
   for every bridge and tunnel in the area, not only those off the track.
4. **What stands along the streets,** as along the track today, on every street in the area: the
   lamps, zebra crossings, traffic lights, bus stops and street plates. The street plates' one
   texture (512 px wide, 112 a street, at most 4096 high) holds 36 streets: the area has more,
   so it needs another way (several textures, or the plates drawn per tile).
5. **The buildings and trees** in the whole area and round it, none on a carriageway, junction or
   pavement (trees in a pavement's tree pits stay), instead of within 300 m of the track.
6. **The barriers** across each of the area's gates (task 032): a row of red-and-white road-works
   barriers with an "Estrada cortada" sign, the city beyond them drawn.
7. **The route's road** is the streets' surfaces like any other street's: `buildRoad` keeps only
   what the race adds (the start line, the gates, the boost pads, the barriers at the start; task
   037 adds the side streets' barriers).
8. **`?scenery`** builds the area's city the same every time, so `scripts/shots.mjs` still shoots
   the viewpoints (decision 011).

## Read first

- party-kart's `CLAUDE.md` and `docs/architecture.md` ("Rendering", "The city's budget").
- `src/render/road.ts`, `src/render/city.ts` (`buildCity`, `paintGround`, `streetFurniture`,
  `streetPlates`, the land's mesh), `src/render/levels.ts`, `src/render/kit.ts`,
  `src/render/textures.ts` (the calçada, the setts, the asphalt).
- braga-map's `index.d.ts` (the streets from task 033, `open` from task 032).
- Tasks 014, 018 and 020, which build on what this draws.

## Done when

- [x] Every street in the area is drawn from its surfaces, with its kerbs, pavements, markings,
  crossings, lamps, lights, its bridges and tunnels at their levels, and the gates' barriers; the
  route's stops and plates (every street's are task 042's, the owner's answer); no street is
  painted on the land inside the area.
  > `src/render/streets.ts` draws every piece of `world.streets` (614 carriageways, 1,737
  > pavements, reservations and islands on the ground, 35 pieces on decks and in tunnels), 2,191
  > lamps, 22 traffic lights at the stop lines, the zebras, and barriers at all 121 gates; the
  > ground's painting strokes no street on the open world's tiles (`paintGround`). Seen in the
  > round `2026-10-15-task035` and in views of a gate, a deck from the river, the João XXI's mouth
  > and the junctions from above (2026-10-14/15).
- [ ] The viewpoints where side streets and junctions show score higher than the round before,
  and none lower: `fujacal-start`, `fujacal-west`, `alameda-fujacal`, `conselheiro-lobato`,
  `lobato-east`, `lobato-crossing`, `lobato-pavement`, `travessa-lobato`, `imaculada-conceicao`,
  `liberdade`, `sao-joao-da-ponte`, `devesa`, `31-de-janeiro`, `joao-xxi`, `bernardo-sequeira`,
  `falperra`, `robert-smith`.
  > Not checked: the owner chose to finish without rating (2026-10-15), and to rate the round
  > "Todas as ruas" (version 3 of "Braga real") when they can. My reading of the shots is in Notes:
  > better where side streets show, worse where the camera stood on the 9 m track.
- [x] What it costs against the budget (task 004, decision 017: a guide), on High, Medium and Low:
  draw calls, triangles, textures and download, in Notes and party-kart's `docs/architecture.md`.
  > `shots/2026-10-15-task035/stats.json` and `node scripts/download.mjs`, in Notes and in
  > "The city's budget".
- [x] `npm test` and `npm run check` pass.
  > party-kart, 2026-10-15: `npm test` 37 of 37 (the new `test/streets.test.ts` among them),
  > `npm run check` clean.

## Out of scope

- Driving on them: task 034. The race's own barriers: task 037.
- Building the city tile by tile as the player drives: task 038.
- Markings, pavements and kerbs measured from the orthophoto and photos: task 018. Roundabouts'
  centrepieces: task 014. Furniture where it really stands: task 020.

## Notes

- **Found when starting (2026-10-14): braga-map's tiles have no street names and no bus stops.**
  Step 4's plates and stops on every street need them; only the route's 36 names and 30 stops
  exist, in `tracks/amigos.js`. The owner's answer: draw the route's plates and stops on the real
  pavements now, and a new braga-map task puts every street's name and every bus stop in the
  tiles, for party-kart to draw them all then. Crossings (the zebras in `world.streets.markings`),
  traffic lights (the stop lines there) and lamps go on every street from what the tiles have.
- Ship it with task 037, not before: until then the race still drives the track's 9 m road, and
  on a narrower street a kart would drive over the drawn pavement.
- **The work (2026-10-14/15), party-kart `f6d2eba`, not deployed:** every street in the area drawn
  from `world.streets` by a new `src/render/streets.ts`, laid on the ground by `src/render/tin.ts`;
  the land on `src/render/lattice.ts`; `city.ts`, `road.ts` (`raceMarks`), `levels.ts`,
  `textures.ts` (`layered`, `roadworks`), `trees.ts` (a leaner tree on Low) and `ground.ts` (it
  exports `trimmed`, `Rings`, `Piece`'s outline and surface, `raise`, and the parapets and tunnel
  sides as `sides`) changed; `test/streets.test.ts` new. `npm test` (37 pass) and
  `npm run check` pass. party-kart's `docs/architecture.md` ("Rendering", "The city's budget"),
  `README.md`, `CLAUDE.md` and `docs/making-changes.md` say so. The rounds, in party-kart's `shots/`:
  `2026-10-14-before035` (the 17 viewpoints, on the tree before it) and `2026-10-15-task035` (all
  29, High, Medium and Low).
- **How the streets and the land meet (decided along the way).** Laying the streets on the land's
  own triangles, or the land fine under them, costs millions of triangles: DGT's 2 m ground is
  rough at the streets' edges (it sees the kerbs), so 80% of the cells under them would need 2 m
  detail. Instead each street piece has its own triangles, its outline cut into pieces of 10 m and
  an edge halved where the ground under it bends more than 25 cm (50 on a pavement; coarser on
  Medium and Low), decided by the edge alone so neighbours meet without cracks. The land isn't
  drawn under a street at all: the painted ground's alpha is cleared there and the land's material
  skips it, whatever the land's height (no new texture). Where a street's outline meets the land,
  a skirt down to it or a granite retaining wall up to it (the land 12 cm or more over the edge),
  and on High a granite step at a pavement's back; none against a building.
- **The drawn carriageways are 3.4 cm off the ground the karts stand on at the median, and 19 cm
  at the 90th percentile** (`test/streets.test.ts`): a kart in free roam (036) will sink or float
  that much here and there. Making the karts drive on the drawn surfaces, or drawing them finer
  where it shows, is 036's to judge.
- **What it costs** (task 004, decision 017), the 29 viewpoints against `2026-10-14-task012`, the
  round before: draw calls 58–226 on High and Medium and 39–207 on Low (were 58–184 and 40–165);
  triangles 0.40–1.57 M on High, 0.38–1.31 M on Medium, 0.25–0.88 M on Low (were 0.83–1.14,
  0.77–0.95, 0.48–0.59); textures 91, 57 and 42 MB (3 MB less: the streets' and the buildings'
  textures are layers of three array textures); building the city 3.8–5.3 s on High, 2.9–4.9 on
  Medium, 2.6–4.5 on Low on the desktop over two rounds (were 1.9–2.7, 1.7–2.6, 1.1–1.7), so a
  phone might wait 10–20 s; the download 6.81 MB, 2.08 MB gzipped (0.01 MB more: the code). Past the guide at the
  busiest viewpoints (`robert-smith`, `alameda-fujacal`, `conselheiro-lobato`,
  `imaculada-conceicao`), under it at the quiet ones: what's drawn is in tiles now, out of view
  isn't drawn. Kept down along the way: the land split only where it shows beside a street, the
  streets' surfaces and faces one mesh a tile and the buildings two a square kilometre (array
  textures), the lit traffic lamps one instanced mesh, the streets' build from 1.8 s to 1.4 s.
- **The viewpoints, as I see them (the owner rates them):** better where side streets and junctions
  show (`lobato-crossing`, `lobato-pavement`, `imaculada-conceicao`, `31-de-janeiro`, `joao-xxi`,
  `devesa`, `bernardo-sequeira`, `falperra`, `robert-smith`, `alameda-fujacal`'s side street).
  Worse where the camera stood on the track's 9 m road and now stands on the land or a pavement,
  the map's street being narrower or off to one side (task 026): `fujacal-start` and `fujacal-west`
  (and the race's barriers there stand on the pavement and the land: task 037),
  `conselheiro-lobato`, `liberdade`. `sao-joao-da-ponte`: the road's curve is right, but its wide
  calçada isn't in the map's surfaces, so grass shows. `travessa-lobato` can't change: the Travessa
  isn't a street in the map (task 006's audit).
- **Also seen:** at the João XXI's cutting the map's carriageway runs up its banks (wider than the
  cutting's floor), so the asphalt does, as the karts' ground has it. A few of the map's crossings
  are several zebras over each other: drawn once, the longest. One carriageway outline in 614
  crosses itself (a metre's kink). Gates' "Estrada cortada" faces into the area.
- **Not verified:** a phone (its frame rate and build time); a race with karts on the new streets
  (it still runs on the track's road: the menus' autopilot laps were seen); Medium's pictures, only
  its numbers; the bridges and tunnels at every viewpoint, only from a few made-up views.
- **From task 034 (2026-10-14): what the cars drive on, which the drawing has to match.** The
  ground is party-kart's `src/world/ground.ts` and its land `src/world/land.ts` (both sim, so the
  renderer can import them):
  - **Buildings are trimmed at the kerb** where they stand on a carriageway (the owner's answer in
    034; 993 in the area): solid only off the carriageway, a passage through one open. Draw them cut
    back the same, from `trimmed` in `ground.ts` (the outline less the carriageways, as segments),
    rather than whole or cleared.
  - **The land** is `makeLand(world, box).land`, but streets stand on `.firm`: the land without the
    river's bed cut into it, so a street beside the Rio Este, or crossing it at the ground's level
    (São João da Ponte), keeps its height. city.ts's land cut the bed under them.
  - **Decks' and tunnels' ends** are eased to the land over 10 m where they meet it (the map's are
    up to 0.66 m off it: task 040 fixes the data), and a ground pavement lying over a deck's or a
    tunnel's road at its end gives way to the road. Draw them the same until 040.
  - **The tunnels' mouths' concrete** stops cars only up to 3 m over the road: today's `levels.ts`
    raises it 0.4 m over the land over the tunnel, which stands in the 31 de Janeiro over the João
    XXI's mouth. Keep it under a street over a tunnel.
  - **Every tree in the area is solid** but those on a carriageway (41); city.ts draws every 2nd on
    Medium and every 3rd on Low. Draw every solid one, or the ground has to drop the same.
  - **The area's edge** is a wall at every level, and each gate a barrier across its street, kerb
    to kerb and a metre past, 1.2 m high (`worldGround`): draw the barriers there.
  - **No wall or railing** stands where a street's edge drops into a cutting (the João XXI's at
    (561, 242), the Liberdade's): a kart falls in. braga-map has no walls or fences yet (task 013).

- **Finished on 2026-10-15,** without the owner's marks (their choice): the round "Todas as ruas",
  `2026-10-15-task035` (tasks 010–012 and this one, shot on party-kart `f6d2eba`, this work, and
  braga-map 1.7.0), is version 3 of "Braga real", open for marks; "Os amigos" (2.9) closes, fully
  rated. Before posting, all 29 shots were looked at: besides the drops above, a checkpoint's pillar
  stands in the street at `estadio` (task 037's note), and at `couteiro` the map's carriageway runs
  up a bank, so the asphalt does (task 026). Decision 024 says how the streets are drawn; tasks 036
  and 037 have notes on what they inherit. party-kart's work is `f6d2eba`, and ships with 037.
