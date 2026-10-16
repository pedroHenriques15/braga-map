---
status: done
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 009]
roadmap: Phase 2 · The shape
---

# 013 · Walls, fences, gates, railings and hedges where they stand

## Why

In Minho, nearly every house stands behind a granite wall with a gate, and the hills are held by
retaining walls; blocks of flats have low walls with railings, roads run between long concrete or
painted walls. In the game, buildings stand straight behind the pavement with nothing between, and
the only walls are the plain granite ones party-kart puts where the land stands over a street. The
residential streets read as a city centre. In the shooter's area, walls are where a player takes
cover and climbs, and a kart in free roam hits them.

## What

Split on 2026-10-15: the footways, steps, paths and cycleways went to task 050, and what the ground
is inside a plot (a front garden's lawn, a paved yard, a driveway) to task 016, which classifies
the ground from the orthophoto. This task is what stands: walls, fences, gates, railings and hedges.

Today:

- OpenStreetMap has almost none here: the `barrier` features were never fetched (`tools/fetch.mjs`
  has no query for them), and among the streets fetched, 5 ways in the route's box are tagged
  `barrier=wall` and 4 `fence` (2026-10-13). None in the shooter's area (task 015).
- The LiDAR sees them: the surface model and the terrain model at 50 cm (`MDS-50cm`, `MDT-50cm`,
  fetched for the 20 DGT tiles under the route's box, which holds the open world's area) and the
  point cloud, about 10 points a m², each point classed (`tools/dgt.mjs`, `CLASS`) and with its
  near-infrared. `tools/roofs.mjs` reads the cloud for the buildings already.
- party-kart draws a granite retaining wall wherever the land stands over a street's edge
  (`src/render/streets.ts`, "a granite retaining wall up to it", decision 024), and its karts hit
  the land where it rises more than a step (`src/world/ground.ts`). Nothing else stands between a
  pavement and a building.

Steps:

1. **Fetch** OpenStreetMap's `barrier` ways and nodes (wall, fence, retaining_wall, hedge,
   guard_rail, gate) over the map, into `.cache/osm/` with the rest (`fetch.mjs`), with their
   `height`, `material` and `wall` tags where mapped. Bollards are street furniture (task 020).
2. **Find the walls the map lacks** over the open world's area (the route and the shooter's area
   are in it): from the LiDAR, a narrow ridge over the bare ground, 0.4–4 m high and 0.15–0.6 m
   wide, running at least 3 m, that isn't a building's footprint or a tree's crown (the cloud's
   classes and its near-infrared tell a hedge from a wall); a retaining wall where the ground
   steps more than 0.8 m within half a metre. Each: its line, its height (its top over the ground
   either side, both sides for a retaining wall), its width, and where it came from (`osm`,
   `lidar`).
3. **What each is** (the owner's answer): from its photo where one shows it (task 008's
   reference photos, the viewpoints); else by what's around it: a house's front wall in granite
   blocks, a block of flats' a low rendered wall with a railing on it, a cutting's or a slope's a
   granite retaining wall, a long wall by a fast road in concrete, a hedge where the near-infrared
   says it's growing. Check the rule against the photos that do show walls before using it where
   none does.
4. **Gates:** where a driveway or a path meets a wall (OpenStreetMap's `barrier=gate`, the
   service roads and task 050's paths, and gaps in a found wall a car's width or a door's), a
   gate in it. Shut to a kart. In the shooter's area, open or shut as its photos show
   (`docs/SHOOTER-AREA.md`).
5. **In the tiles:** a `walls` list in the world (`index.d.ts`), each `{ kind, h, w, level, pts,
   source }`, and the gates; on the open world's tiles, as `world.streets` is.
6. **party-kart: draw them and hit them.** Each kind in its material, with a coping stone on a
   granite or rendered wall, railings and fences see-through, hedges in leaf; the gates. Each is a
   wall to a kart (`src/world/ground.ts`), as a building is. Where a found retaining wall stands,
   it replaces the plain one `streets.ts` draws there.
7. **In the shooter's area,** every wall, fence, gate, railing and hedge in its photos, at its
   height and of its kind: the granite walls round the houses, the railings by the river, the
   school's fence (`docs/SHOOTER-AREA.md`).

## Questions

- [x] A wall the LiDAR finds but no photo shows (most of them): what is it drawn as? Options: by
  what's around it; all granite; all rendered and painted. Recommendation: by what's around it.
  > By what's around it (the owner, 2026-10-15): a house's front wall granite, a block of flats' a
  > low rendered wall with a railing, a cutting's a granite retaining wall, a fast road's concrete.

## Read first

- braga-map: `tools/fetch.mjs` (the queries), `tools/dgt.mjs` (`heights`, `points`, `CLASS`),
  `tools/roofs.mjs` (how the cloud is read for the buildings), `tools/world.mjs` (packing the
  tiles), `index.js` and `index.d.ts`.
- party-kart: `src/render/streets.ts` (the retaining walls), `src/world/ground.ts` (the walls a
  kart hits), `src/render/textures.ts`.
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, every wall, fence, gate, railing and
  hedge at its height and of its kind, and which gates into the courtyards open.
- `docs/SOURCES.md`: DGT's LiDAR and its licence. Decisions 022 (OpenStreetMap as it is) and 025
  (measured, found, never invented).

## Done when

- [x] The open world's tiles carry its walls, fences, railings, hedges and gates, each with its
  height, kind and source; a test in `test/` checks the ones the map has are there.
  > `world.walls` (2026-10-16): 12,694 pieces on the open world's tiles, each with its kind, material,
  > height, thickness, top at each point, level and source. `test/walls.test.js`: of the map's 29.6 km
  > of barriers in the area, 82.9% in the tiles, 14.5% cut away on a carriageway or a path the world
  > draws or at a gate, 2.6% neither (where a street or a path passes, and pieces under 50 cm); 182 of
  > its 189 gates there (the rest nowhere near a street, a path or a wall); every piece whole, none on
  > a carriageway (102 of 330,000 half metres, at the kerbs), retaining walls' higher ground on their
  > left (95%).
- [x] The viewpoints whose photos show walls look more like them: along the route `couteiro` (the
  tall wall with a fence on it), `monte-da-forca` (the houses' gates and low walls),
  `bernardo-sequeira` (the low granite wall and hedge), `alvaro-carneiro` (the stone retaining
  wall), `viriato-amaral-nunes` (the long painted wall) and `liberdade` (the hedge); in the
  shooter's area `travessa-fujacal` and `alameda-fujacal`.
  > Against `shots/2026-10-15-after050/` (party-kart's `shots/2026-10-16-after013/`): six of the eight
  > closer: `couteiro` its concrete wall along the right where the bank was, `bernardo-sequeira` its
  > low wall with a hedge on it, `alvaro-carneiro` a granite retaining wall behind the pavement,
  > `liberdade` its hedge along the pavement, `travessa-fujacal` the granite retaining wall at the
  > end, `viriato-amaral-nunes` its long concrete wall (seen from over its top: the camera stands on
  > the bank, the map's street being off its line, task 026). `alameda-fujacal` has its concrete
  > retaining wall on the left, but a metre from the camera, which the map's street leaves on the
  > verge where the photo's is on the road (task 026). `monte-da-forca` is as it was: its houses'
  > walls are on neither the map nor the LiDAR (the cars parked against them hide them), and none is
  > invented (decision 025). Closed so, with the owner's leave (2026-10-16); the round is for the
  > owner's marks.
- [x] In the shooter's area, every wall and gate in its photos is in the game, at its height.
  > Every gate the map has there (39) is in the game, shut, as the photos show them (none into a
  > courtyard). From four reference photos of the Rua do Fujacal's houses, set beside the game from
  > their own spots: the walls and gates are where the photos have them; three of the four at their
  > height, low rendered walls with a railing on them; the fourth a solid wall where the photo has a
  > low one with a railing. Its viewpoints: the Travessa do Fujacal's granite retaining wall, the
  > Alameda's concrete one. Not checked one by one: the 165 facade photos (the owner's leave, 2026-10-16).
- [x] A kart hits them in party-kart, in a test.
  > `test/ground.test.ts` "into a wall, a hedge, a gate and a retaining wall from below: stopped": five
  > of each, square on at 5, 15 and 30 m/s, 60 runs, all stopped.
- [x] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).
  > In Notes and party-kart's `docs/architecture.md`: 3–6 draw calls, 131–559 k triangles on High,
  > 1 MB of texture memory, 0.27 MB more to download.

## Out of scope

- Footways, steps, paths and cycleways: task 050.
- What the ground is inside a plot (lawn, paving, a driveway): task 016.
- The pavements' surface and pattern: task 018. Buildings' facades: task 017.
- Walls outside the open world's area: when the area grows (task 038).

## Notes

- From task 009: where the ground behind a pavement is higher than its back edge, party-kart draws
  a plain granite wall from the pavement up to the ground (since task 035 in
  `src/render/streets.ts`), so the cuttings along the route already have a wall, of the wrong kind
  in places. This task's walls replace them where they're found.
- From the drafting, 2026-10-15, looking at the viewpoints' photos: `couteiro` has a tall concrete
  wall with a fence on it, `monte-da-forca` rendered walls and gates in front of houses,
  `bernardo-sequeira` a low granite wall under a hedge, `alvaro-carneiro` a stone retaining wall,
  `viriato-amaral-nunes` a long wall painted over, `liberdade` a hedge between the pavement and the
  flats. Not checked: how well the LiDAR's 50 cm models show a wall 0.2 m wide (the point cloud may
  be needed), and how many OSM `barrier` ways there are (not fetched).
- Started 2026-10-16. What turned out other than "What" says:
  - **OpenStreetMap has many:** fetched (`fetch.mjs barriers`), the open world's area has 627 walls
    (23 km, 490 with a `height`, most of them whole metres: a mapper's guess), 42 retaining walls
    (3 km), 59 hedges (3.8 km), 21 fences, and 188 gates as nodes; the shooter's area 71 walls and
    37 gates (`docs/SHOOTER-AREA.md` said none). The LiDAR is still what finds the rest and measures
    them all.
  - **The point cloud, not the models:** the walls are found in the point cloud, boiled down to 50 cm
    cells on the terrain model's grid (`.cache/dgt/walls/`). Their points are classed unclassified,
    medium vegetation and building alike, so the class doesn't tell a wall from a hedge; their
    near-infrared does, but the cloud's colours are pale: trees come out at an NDVI of +0.08, the
    ground -0.13 and buildings -0.17, so growing is -0.04 or more.
  - **Parked cars:** at 10 points a m² a car is as thin, as dense and as even as a wall, cell by cell
    (its glass returns nothing, so it shows as strips one to three cells wide), and a car's length
    long. In contact sheets of 20 random runs over the orthophoto, half the walls found under 6 m
    were cars; at 6 m or more, about a quarter. So: a found wall under 6 m long, or a hedge under 5,
    is left out (14,498 runs, with the shrubs and the short walls among them); nothing is found on
    a carriageway (its band 50 cm wider) or a car park the map has (fetched with the barriers); a car's
    height along a kerb has to be whole and even to be a wall. Rows of cars parked along a kerb the
    map has no car park for still come through in places.
  - **What's found, round the area** (the box round it, as `world.streets`): 17 km of walls, 59 km of
    retaining walls, 24 km of hedges, 1 km of fences on retaining walls, besides the map's 20 km of
    walls, 23 km of retaining walls, 4.6 km of hedges, 2.2 km of fences and 0.5 km of railings. Of the
    map's walls, 309 are retaining walls (the terrain steps a metre or more across them, sharper than
    the slope beyond). The found retaining walls are the most, and the least sure: in a contact sheet
    about seven in ten were along a road's cutting, a terrace or a plot's edge on a slope; a step
    in a wood or a field away from any building is left out (90), and so is one the terrain model
    guesses between few ground points. Left out too: 306 walls along a retaining wall that were its
    face (no higher than its top), 160 its parapet, 1,479 found twice, 1,013 the map has; and of the
    hedges, those under 0.8 m or over 3.5 (weeds on a verge, a row of trees), 805 far from any
    building or street, and 921 over 1.5 m within 3 m of a retaining wall (the bank's growth: the
    trees over the Avenida Doutor Viriato Amaral Nunes's painted wall had come out as a 2.7 m hedge).
  - **Fences and railings** the cloud can't tell from a wall: a see-through fence gives too few points
    to be found, or is found as a wall. So the found ones are walls, but where one stands on a
    retaining wall's top higher than a parapet: a fence on it (106).
- The decisions along the way:
  - **Heights:** the LiDAR's where it saw the wall (its top over the terrain under it, the 75th
    percentile along it), else the map's `height`, else the kind's usual (wall 1.5 m, railing 1,
    guard rail 0.75). A retaining wall's is its face's, over its lower side; its points run with the
    higher ground on their left (`test/walls.test.js`: 95% of the stretches 1.5 m or more). Each point
    carries its top's height above elev0 (`ys`).
  - **Where:** the found ones laid where the map's buildings round them sit (roofs.mjs's shifts), so
    they sit with the buildings and streets as they're drawn.
  - **What each is made of** (the owner's answer, checked against the photos that show walls, as
    "What" asks): `couteiro` and `viriato-amaral-nunes` (concrete retaining walls) and
    `travessa-fujacal` (granite) fit it; `alameda-fujacal`'s retaining wall is concrete and came out
    granite, `bernardo-sequeira`'s low wall under a hedge granite and came out rendered, and the
    houses' front walls on the Rua do Fujacal (four reference photos), the Alameda's and the Rua do
    Monte da Forca's are rendered and painted, low, with a railing on them, not granite. So: a
    retaining wall holding up a street (2 m or more, 20 m long or more, within 10 m of one) is
    concrete, any other granite; a low wall under a hedge granite; **a wall in front of a house or a
    block of flats rendered, and up to 3 m high a low wall with a railing as its top half (up to 1.2
    m; the LiDAR measures them to the railing's top, 2.3–2.6 m on the Rua do Fujacal): this differs
    from the owner's answer ("a house's front wall granite"), which the photos didn't bear out, and
    the owner agreed (2026-10-16)**; a long wall by a tertiary street or a bigger one concrete; any
    other granite. 1,745 walls are low ones with a railing, 267 rendered and solid, 716 granite.
  - **Gates:** the map's (across the street or path each is on, or along its wall), one where a
    driveway or a private service road crosses a wall, and one in a gap a door's width (0.8–1.4 m) or
    a car's (2.4–5 m) between two found runs in one line where no street or path passes: 242, 6 and
    52. All shut to a kart. Each wall opens where a street or a path passes through it (retaining
    walls too: a flight of steps climbs through, and a tunnel's road passes under the step at its
    portal), a way the map stops 3 m short of a wall going through it.
  - **Cut** where it would stand on a carriageway or a path on the ground (as a building is, decision
    021), or on a deck's or a tunnel's within 2 m of its height: 4.0 km of the map's walls in the
    area (13.6%) are cut away so, mostly where the world draws a street wider than it is. Task 052.
- **The shooter's area** (step 7): 87 of the map's walls, 16 retaining walls and 39 gates, and 33
  walls, 54 retaining walls and 98 hedges found. Its 39 gates are the houses' and the flats' onto
  the streets; 29 are within 35 m in front of a reference photo's camera. Twelve photos looked at
  (the eight nearest the gates on the Rua do Fujacal and the Rua do Monte da Forca side, and four
  more): every gate shown shut, but one house's drive gate standing open (OSM node 4367935954, on
  `facade-way-162945720`), into its garden: shut, as a garden is out of bounds. None leads into a
  courtyard (the flats' behind the Rua Monsenhor Airosa is reached through a passage, and no gate
  there is mapped or found), so none is open. Not done: each of the 29 photos against its gate, and
  the walls in the 165 facade photos one by one; the railings by the river (the cloud can't tell
  them) and the school's fence (the map has a wall round it: as a wall).
- **party-kart** (on braga-map installed from `../braga-map`; its `package.json` back on the tag, to
  move to the new version when it's tagged):
  - `ground.ts`: every wall a wall to a kart, from under the ground to its top (`wallSpan`), a hedge
    or anything half a metre thick both its sides, a gate shut; a free-standing one on the karts'
    own ground and as high as the map says, but at the map's own level where that's more than 1.5 m
    off it (a planter on the Avenida da Liberdade's cutting, over the ramp to its underpass); a
    retaining wall 0.6 m over its top (`HOLD`), as the 2 m ground ramps up to it and launched a kart
    over one at 30 m/s. `test/ground.test.ts`: into five walls, five hedges, five gates and five
    retaining walls (from below), square on at 5, 15 and 30 m/s: 60 runs, all stopped.
  - `streets.ts`: each in what it's made of (granite blocks, render, weathered cement: four more
    layers of the streets' texture), a coping stone on High, the railing its top half, a fence's mesh
    and a railing's or a gate's bars see-through on posts, a hedge a block of leaves, a lift gate a
    red bar; a retaining wall's back, in the higher ground, isn't drawn; the map's retaining walls in
    the place of the plain granite one the streets drew where the land is higher.
  - Found in the tests: the found walls lying across the underpass's ramp and across the approach to
    the 47 steps from (-158.9, 1278) stopped karts until the walls opened where ways pass, a fence the
    map draws along a flight was cut, and walls were cut on a deck's or a tunnel's road.
- **The viewpoints:** in "Done when".
- **The budget** (task 004, decision 017), every viewpoint at High, Medium and Low,
  `shots/2026-10-16-after013/` against `shots/2026-10-15-after050/` (both on the desktop's RTX 4060
  Ti): 3 to 6 more draw calls (74–233 on High); 131–559 k more triangles on High (the median 305 k:
  0.71–2.46 M where 0.58–1.90 M; `robert-smith`, `conselheiro-lobato` and `alameda-fujacal` the
  most), 96–264 k on Medium, 56–208 k on Low; 1 MB more texture memory; the city built no slower
  (3.6–3.9 s on High); a frame 0.3–2.2 ms. Most of it is the 80 km of retaining walls. First drawn
  every 2 m with both faces and a coping on Medium too, it was 162–875 k on High: now every 3 m on
  High, 4 on Medium and 6 on Low, a retaining wall's back not drawn, the coping on High only. The
  open world's 53 tiles are 0.27 MB more gzipped (2.11 to 2.38 MB): a wall's points only where it
  turns or its top bends by 10 cm, its tops packed as steps.
- **Found along the way:** the streets don't end at their walls (4.0 km of the map's walls stand on
  a carriageway as drawn, 4.8 km on a pavement): task 052, its questions answered (2026-10-16).
- **Done** 2026-10-16 (decision 033).
- **Live** (2026-10-16): braga-map 1.15.0, and party-kart `4f0d075` on it, deployed and served at
  https://pedrohenriques15.github.io/party-kart/. The round `2026-10-16-after013` ("Muros e sebes"),
  shot on them, is on the scorecard, open for marks, before 016's. Claude's marks are in it as their
  own document (`scores/claude`, which the page names "Alguém", each comment starting "(Claude)"),
  not the owner's: 2.45 on average over the 29 places, the walls' places from 2 to 3 (Couteiro, the
  Travessa do Fujacal, Bernardo Sequeira and Álvaro Carneiro 3; Monte da Forca, Viriato Amaral Nunes
  and the Alameda 2). Noticed in it: at `robert-smith-picoto` a wall of the map's measured 4.2 m
  high, white, where the photo has a brick wall about 2.5 m.
- Tests: braga-map `npm test`, 80 pass (`test/walls.test.js` new: 6); party-kart `npm test`, 49 pass,
  and `npm run check`.
