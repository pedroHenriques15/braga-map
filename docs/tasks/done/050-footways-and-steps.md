---
status: done
priority: high
kind: code
repo: both
created: 2026-10-15
depends-on: []
roadmap: Phase 2 · The shape
---

# 050 · Footways, steps, paths and cycleways in the world, and karts on them

## Why

The world draws every street OpenStreetMap has, but none of what's walked or cycled: in the open
world's area 20 km of footways, 1.8 km of steps in 188 flights, 10 km of cycleways (the Ecovia,
the red lanes beside the Avenida da Liberdade) and 7 km of paths. Braga's hills are crossed by
steps and passages between the blocks, and on foot (the shooter, `docs/SHOOTER-AREA.md`) they are
the ways a player takes. In free roam a kart drives on them, steps too (the owner's answer).

## What

Split from task 013 on 2026-10-15; 013 keeps the walls, fences, gates, railings and hedges.

Today:

- `tools/fetch.mjs` already fetches them into `.cache/osm/paths.json` (the `paths` query:
  `highway` footway, path, steps, cycleway, bridleway), for the street audit only
  (`tools/audit.mjs`, its `PATHS` classes). Nothing in `tools/world.mjs` reads them.
- In the open world's area they are: `footway=sidewalk` 734 ways, 50 km (the pavements mapped
  beside a street), `footway=crossing` 4.7 km, `footway=traffic_island` 1.3 km; and the rest:
  footways 20 km (1.9 km of them passages under buildings, `tunnel`, and 0.5 km footbridges),
  steps 188 flights (1.8 km; over the whole map, of its 757 flights, OSM gives `step_count` on
  354, `handrail` on 404 and `incline` on 467), cycleways 10 km, paths 7 km. `surface` is on 3,771 of them.
- The world's streets (`world.streets`, `tools/streets.mjs`, task 033) have the pavements already,
  from each street's kerb to the buildings, and the zebras and islands from the crossings. The
  `footway=sidewalk`, `crossing` and `traffic_island` ways are those, drawn: they stay out.
- party-kart (`src/render/streets.ts`, `src/world/ground.ts`) draws and drives the street
  surfaces. A kart drives on the land wherever it's no steeper than 35° (`CLIMB`), so on a
  footway's land today; a flight of steps is a slope in the 2 m ground. It steps up anything
  under 0.3 m (`STEP`), as a kerb.
- Several party-kart modules take every one of `world.lines` whatever its kind (`mouths` in
  `src/world/land.ts`, the painted ground in `src/render/city.ts`, the pillars in
  `src/render/levels.ts`): the paths must not go into `lines`.

Steps:

1. **braga-map: the paths as surfaces, beside the streets'.** In the open world's tiles, as
   `world.streets` is (the shooter's area is inside it), every footway, path, cycleway and
   bridleway but the three kinds above, and every flight of steps: a new `paths` list in
   `Streets` (`index.d.ts`), each piece `{ kind: 'footway' | 'path' | 'cycleway' | 'steps',
   surface, level, rings, ys? }`, made by `tools/streets.mjs` (or a module beside it) and packed
   in the tiles with the rest.
   - Its width: the map's `width`, else what its kind usually is (a footway 2 m, a path 1.5 m, a
     cycleway 2.5 m both ways, steps 2 m); its surface: the map's `surface` (calçada, paving
     stones, setts, asphalt, concrete, gravel, dirt), else its kind's usual.
   - Where it meets a street, it joins the pavement (or stops at the kerb, dropped there) as the
     streets join each other; where it runs inside a pavement (the red cycleways beside the
     Avenida da Liberdade), the pavement gives way to it and it's drawn there, flush.
   - Its level as a street's (`tools/lines.mjs`'s `levelOf`, `levelHeights`): on the ground, a
     footbridge with its deck's heights, a passage under a building (`under`) or a tunnel.
   - **Steps:** each step its own tread, a ring at its own height (`ys`), from the flight's foot
     to its top: as many as `step_count`, or the rise over 0.16 m; the heights at each end from
     the LiDAR's terrain model at 50 cm (`MDT-50cm`, fetched for the route's box, which holds the
     open world's area) where it has them, else the tiles' ground; which end is up from `incline`
     or the heights. `handrail` with it.
2. **Gates where they leave the areas:** a gate wherever one crosses the open world's edge or the
   shooter's (`gatesOf` in `tools/open.mjs`, used by `world.mjs` and `build.mjs`), with its kind;
   `Gate.k` gets the paths' kinds (and `test/open.test.js`, which says `k <= 8`, follows). The
   edges themselves stay as they are, worked out from the streets.
3. **The audit** (`tools/audit.mjs`) counts what the world draws of them, in the open world's
   area; its comment and `fetch.mjs`'s that say "no game draws it yet" go.
4. **party-kart: draw them** (`src/render/streets.ts`): each surface in its material (calçada,
   granite paving, asphalt, the red of the cycleways, gravel), on the ground the karts drive on,
   as the streets are (decision 024); each step with its tread and riser, the handrails where
   the map has them; the footbridges and passages at their levels; road-works barriers across
   those that leave the area, as across the streets.
5. **party-kart: drive them** (`src/world/ground.ts`): a path is a floor the kart stands on, as a
   pavement is; each step a tread it steps up onto and drops off, a kerb at a time (under
   `STEP`), so a kart bumps up and down a flight. A step deeper than `STEP` (a flight the map has
   few steps for) is a wall, and a test says how many there are.
6. **The minimap** (`src/hud.ts`) may draw them thin, as the minor streets.

## Questions

- [x] In free roam, what does a kart do on the footways, paths, cycleways and steps? Options:
  paths drivable and steps a wall; everything, steps too; none, bollards where each path leaves a
  street. Recommendation: paths yes, steps no.
  > Everything, steps too (the owner, 2026-10-15): karts bump up and down the city's stairs.
- [x] A flight the terrain model shows no rise for (the landing at a door is no ground to it: the
  Travessa do Fujacal's 8 steps climb about 1.3 m, the terrain 11 cm; 20 of the 154 flights with a
  count, and 21 without one)? Options: the map's count at 16 cm a step from the foot, the top over
  the ground; as the terrain says, nearly flat; leave them out. Recommendation: the map's count.
  > The map's count at 16 cm a step (the owner, 2026-10-15): where it counts them and the terrain
  > shows under 8 cm a step, or the wrong way, the foot at the ground (`incline` says which end) and
  > each step 16 cm up from it; with no count and under a step's rise, one flat tread.
- [x] The 46 footways (1.8 km) through passages under buildings: do karts drive through? Options:
  open, the building cut back at the passage as at a carriageway's (decision 021); closed, its
  walls standing and the passage not drawn; open, the building drawn whole over it.
  Recommendation: open, as a carriageway's.
  > Open, cut as a carriageway's passage is (the owner, 2026-10-15).

## Read first

- braga-map: `tools/fetch.mjs` (the `paths` query), `tools/streets.mjs` (how the surfaces are
  made and joined), `tools/lines.mjs` (`levelOf`, `levelHeights`), `tools/world.mjs` (packing the
  streets into the tiles), `index.js` and `index.d.ts` (`Streets`, `Gate`), `tools/open.mjs`
  (`gatesOf`), `tools/shooter.mjs`, `tools/audit.mjs` (`PATHS`).
- party-kart: `src/render/streets.ts`, `src/world/ground.ts` (`STEP`, `CLIMB`, the floor),
  `test/streets.test.ts`, `test/ground.test.ts`, `test/roam.test.ts`.
- `docs/SHOOTER-AREA.md`: in the shooter's area, each step at its rise with its handrail, and
  gates where its footways, steps and the Ecovia cross its edge.
- Decisions 022 (OpenStreetMap as it is), 023 and 024 (the data does it once; a game draws on
  the ground its karts drive on).

## Done when

- [x] The open world's tiles carry every footway, path, cycleway and flight of steps the map has
  there (but the pavements, crossings and islands mapped as footways), as surfaces at their levels,
  each step at its height; a test in `test/` says so against `.cache/osm/paths.json`.
  > `test/paths.test.js` (2026-10-15): under the map's 38.4 km of paths in the area, each itself
  > (80% of the footways, 87% of the steps and the cycleways, 93% of the paths) or what it gives
  > way to, but 39 m in gaps between buildings; the streets' own 55 km left to the streets (1% on
  > a path); 74 footbridges and passages, 4 off their level; 118 flights' treads a riser apart, all
  > 70 the map counts with as many treads, or cut away at their ends; the Travessa do Fujacal's 8,
  > 16 cm each; nothing on anything else at its level (0.0 m²). Also the indoor ways and the
  > cycleways' crossings left out, as the Notes say.
- [x] A gate wherever one leaves the open world's area or the shooter's, and the barriers drawn.
  > 79 on the open world's edge and 7 on the shooter's, `test/open.test.js` and
  > `test/shooter.test.js` (a gate where every path crosses, and nowhere else); party-kart stands
  > a row of barriers at each (`barriers` = the gates, `test/ground.test.ts`), on a flight's tread.
- [x] party-kart draws them, and a kart drives a footway and up and down a flight of steps in a
  test; a step a kart can't take is counted.
  > `test/ground.test.ts`: a 53 m footway on it all the way; the 47 steps from (-158.9, 1278) up
  > 8 m in 9.7 s with 26 hops and back down; a flight of 39 cm risers that stops it; 59 of 3,091
  > risers between treads more than a step high, walls (and 234 of 420 tread edges over a street).
  > The shots show them drawn (`shots/2026-10-15-after050/`).
- [x] The viewpoints that show them look more like their photos: `sao-joao-da-ponte`,
  `liberdade` and `devesa` (the red cycleways), `travessa-fujacal` (its flight of 8 steps).
  > Against `shots/2026-10-15-before050/`: `travessa-fujacal` has its flight up to the door with
  > a handrail each side, where the photo has it; `liberdade` and `sao-joao-da-ponte` their red
  > cycleways where the photos have them (the Liberdade's at the camera on an island the map makes
  > of the pavement there, São João da Ponte's on the land, as the map has no pavement round it:
  > tasks 044 and 018). `devesa`'s frame shows no cycleway, in the photo or the game, and is as it
  > was: the drafting's note was wrong. Posted as the round `2026-10-15-after050` ("Caminhos e
  > escadas") for the owner's marks.
- [x] The audit counts them drawn in the open world's area.
  > `tools/audit.mjs`: in the area 83% of the footways, 84% of the steps, 95% of the paths, 89% of
  > the cycleways drawn as themselves; the pavements and crossings the map draws as footways under
  > the streets' (65% and 90%).
- [x] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).
  > In Notes and party-kart's `docs/architecture.md`: 0–3 draw calls, 45–172 k triangles on High,
  > no texture memory, 0.5–0.9 s to build, 0.11 MB to download.

## Out of scope

- Walls, fences, gates, railings and hedges: task 013.
- The pavements' own heights from the kerb: task 044. Their surface and pattern: task 018.
- Paths outside the open world's area: when the area grows (task 038).
- The footways' street plates: task 042.

## Notes

- From the drafting, 2026-10-15: the red lanes in the `liberdade`, `lobato-crossing` and `devesa`
  photos are OSM cycleways, in asphalt; the flight in `travessa-fujacal` is OSM's, 8 steps of
  paving stones, 9 m from the camera. Not checked: how many flights have no `step_count`, so how
  many steps would be deeper than a kart can take.
- From task 032, moved here from 013: the open world's edge gives a gate wherever a street crosses
  it. The gates are worked out by `gatesOf` in `world.mjs` and `build.mjs`, so `npm run world`
  and `npm run page` give the paths theirs; the edges (`npm run open`, `npm run shooter`) don't
  move.
- Started 2026-10-15. What was made, and the decisions along the way:
  - **What's left out**, besides the streets' own (the `footway` sidewalks, crossings, traffic
    islands and links, 1,284 ways in the area): `cycleway=crossing` and `cycleway=traffic_island`
    too (36 in the area, the cycleways' crossings over a carriageway and the islands they cross),
    and what's indoors (`indoor`, or a `level` other than 0: 49 in the area, most on a shopping
    centre's floors). 1,116 ways in the area are drawn, 1,752 in the box round it the tiles carry.
  - **Widths:** only 4 of them have the map's `width`; a cycleway one way (`oneway=yes`, 64 of the
    area's 127, the Liberdade's lanes among them) is 1.5 m, both ways 2.5 m.
  - **Surfaces:** `paving_stones`, `paved` and `granite` are paving; `sett`, `cobblestone` and
    `unhewn_cobblestone` setts; `compacted`, `gravel` gravel; `ground`, `grass`, `dirt` and the like
    earth; and `metal` and `wood` as they are (30 and 2), which party-kart draws grey and as earth.
    Where the map says nothing (638 of the 1,116): a footway calçada, a path earth, a cycleway
    asphalt, steps paving.
  - **A footway or a path gives way to the pavements** (and reservations and islands): where it
    meets a street it ends at the pavement's back, and where it runs in one it's the pavement.
    **The pavements give way to a cycleway:** in a pavement it's `raised`, flush with it, or, where
    40 cm out from it the carriageway is beside it along half its length or more, a lane at the
    road's level with a kerb behind it, as the Avenida da Liberdade's red lanes are in the
    `liberdade` photo (at the road's level, behind rubber bollards, a kerb up to the calçada): 0.19
    ha of lanes, 0.26 ha flush. The kerb along the carriageway goes where a lane is, and comes back
    behind it, so the lamps stay.
  - **Footbridges** take their heights as a bridge's (`levelHeights`), but their ends on the deck
    DGT's point cloud saw (`decks.mjs`), where it's half a metre or more over the ground, as on the
    stairs up to one. A ground path gives way to a footbridge where it's within 2 m of the ground.
    A flight of steps ending on a bridge's node takes the deck's height there.
  - **Steps** (the owner's answers): 258 flights round the area in 3,361 treads, each tread the
    slab of the flight's line between two risers, cut from the flight's band, the first riser at its
    foot and the last tread at its top's height, to the centimetre (the tiles pack a tread's height
    in decimetres and the centimetres more). Of the 154 outdoor flights in the area with the
    terrain at both ends (all of them), 20 the map counts the steps of rise less than 8 cm a step in
    the terrain or the wrong way, and are 16 cm a step from their foot: the Travessa do Fujacal's 8
    from 8.32 to 9.60 m, up to its door. The map's `incline` disagrees with the terrain on 11
    flights, all but a few by less than a step: the heights win, as the ground meets them.
  - **Handrails:** 139 lines, both sides where the map says `handrail=yes`, else the sides it names,
    15 cm in from the flight's side, 0.9 m over the nosing.
  - **Gates:** 79 more on the open world's edge (40 footways, 9 paths, 25 cycleways, 5 flights), 7
    more on the shooter's (17); `Gate.k` 10 to 13. A path crosses the edge as it comes (the edge is
    the streets'), so a few cross it at a corner, or out and back within a metre:
    `test/open.test.js` lets one in ten not point out 30 cm either side.
  - **Trees:** the 53 the world filled into a park or a wood where a path now runs are left out
    (the map's own trees stay).
  - The audit (`tools/audit.mjs`) counts the paths drawn in the open world's area: 83% of the 21.6
    km of footways, 84% of the 1.8 km of steps, 95% of the 6.7 km of paths, 89% of the 7.9 km of
    cycleways; the rest is where a path gives way to a pavement or a street, or runs into a
    building. `test/paths.test.js`: under every path in the area, the path or what's there instead,
    but 39 m of 38.4 km (gaps of a metre between two buildings, too narrow for what's left).
- **party-kart** (on braga-map installed from `../braga-map`, `npm install --install-links`; its
  `package.json` back on the tag, to move to the new version when it's tagged):
  - `ground.ts`: a path is a floor (`path`), flush with the pavement where it's raised; a tread is
    the floor in the land's place (`steps`), its `raise` its height over the land, so each riser up
    is a kerb's bump and down one a drop; a riser higher than a step is a wall, a step short of the
    tread (59 of 3,091 between treads, and 234 of the 420 tread edges over a street or a path,
    many of them a flight's sides); handrails are walls; a path's passage under a building cuts the
    building's walls as a carriageway does, and its drawing (`city.ts`). The tests drive a footway
    53 m on it all the way, the 47 steps from (-158.9, 1278) up 8 m in 9.7 s with 26 hops and back
    down, and into the 39 cm risers of a flight of 6, which stop it.
  - `race.ts`: the race's walls under the jump's flight stand on the floor beside the edge, not
    under the flight's line: the Ecovia on the Rio Este's bank, under the flight, had lifted them
    over the river's bed, and a kart in the bed passed under them (`test/drive.test.ts`'s race
    closed, which caught it).
  - `streets.ts`: the paths in their materials (three more layers of the streets' texture:
    `paving`, `cycleway`, `gravel`), the treads with their risers and side faces, the handrails
    (steel, on posts every 1.5 m), the barriers at the paths' gates; `city.ts` clears the land's
    painting and its small cells under them.
  - Not done: the minimap (step 6, "may"), which draws `world.lines`, and the paths aren't lines.
    No path in the area is in a tunnel (the Ecovia's under a road bridge is open to the sky,
    `under`), so none has a mouth cut in the land as a street's tunnel has.
  - The footbridges: 25 pieces of them in the area, the Picoto's boardwalks among them, those
    over a road up to 7 m over the ground, at the deck DGT's point cloud saw (at (-737, 950),
    (688, 166), (1466, 685)).
- **The budget** (task 004, decision 017), every viewpoint at High, Medium and Low,
  `shots/2026-10-15-after050/` against `shots/2026-10-15-before050/` (party-kart `cd68351` on
  braga-map 1.13.0, both shot on the desktop's RTX 4060 Ti): 0 to 3 more draw calls (69–228 on
  High, where they were 68–227); 45–172 k more triangles on High (the median 87 k: 0.58–1.90 M,
  where 0.54–1.73 M), 36–156 k on Medium, 30–127 k on Low (0.35–1.10 M), the most at
  `robert-smith`, `conselheiro-lobato` and `alameda-fujacal`; the textures as they were (97, 61 and
  45 MB: three more 256-pixel layers of the streets' texture, under 1 MB); the city built 0.5–0.9
  s slower on High (4.9–5.8 s); a frame 0.57–1.74 ms. The download before you can drive is 7.58 MB,
  2.33 MB gzipped, 0.11 MB more than braga-map 1.12.0's 2.22 MB: the tiles, 1.96 MB. In the
  world's data, the open world's 53 tiles grew from 2.00 to 2.11 MB gzipped, and `streets.mjs`
  takes 82 s where it took 59.
- **The passages** (the owner's answer): 86 more buildings in the area are cut back where a path
  runs under them, 601 where 515 were at the carriageways alone.
- **Found along the way:** 51 of 236 flights stand more than a kart's step over what's at their
  lowest tread (the terrain's foot over the tiles' ground the street is at, or their lowest treads
  cut away by a carriageway), so a kart only comes down them: task 051.
