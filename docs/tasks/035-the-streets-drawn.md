---
status: todo
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

- [ ] Every street in the area is drawn from its surfaces, with its kerbs, pavements, markings,
  crossings, lamps, lights, stops and plates, its bridges and tunnels at their levels, and the
  gates' barriers; no street is painted on the land inside the area.
- [ ] The viewpoints where side streets and junctions show score higher than the round before,
  and none lower: `fujacal-start`, `fujacal-west`, `alameda-fujacal`, `conselheiro-lobato`,
  `lobato-east`, `lobato-crossing`, `lobato-pavement`, `travessa-lobato`, `imaculada-conceicao`,
  `liberdade`, `sao-joao-da-ponte`, `devesa`, `31-de-janeiro`, `joao-xxi`, `bernardo-sequeira`,
  `falperra`, `robert-smith`.
- [ ] What it costs against the budget (task 004, decision 017: a guide), on High, Medium and Low:
  draw calls, triangles, textures and download, in Notes and party-kart's `docs/architecture.md`.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- Driving on them: task 034. The race's own barriers: task 037.
- Building the city tile by tile as the player drives: task 038.
- Markings, pavements and kerbs measured from the orthophoto and photos: task 018. Roundabouts'
  centrepieces: task 014. Furniture where it really stands: task 020.

## Notes

- Ship it with task 037, not before: until then the race still drives the track's 9 m road, and
  on a narrower street a kart would drive over the drawn pavement.
