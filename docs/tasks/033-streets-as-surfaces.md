---
status: todo
priority: high
kind: code
repo: braga-map
created: 2026-10-14
depends-on: []
roadmap: Now · The open world
---

# 033 · Every street as a surface: carriageways, junctions, kerbs, pavements and markings

## Why

In the open world (decision 019) a kart can drive down any street, so every street in the area
has to be as real as the track is today: its carriageway at its real width, kerbs, pavements,
lane lines and crossings, and junctions where streets meet, at its own level over a bridge or
through a tunnel. Today only the track has any of that, and only as a ribbon with gaps where side
streets join; every other street is a centre line with a width, which party-kart paints flat onto
the ground. The kart game and the shooter both need the streets' real shapes, so they're made
here, once, as data.

## What

Today:

- `tools/world.mjs` keeps every street as OpenStreetMap's way: its kind, its width kerb to kerb
  (`carriageway` in `tools/osm.mjs`: the map's `width`, else its `lanes`, else what its kind
  usually is), its points, its level and, on a bridge or in a tunnel, its height at each point
  (task 012). It knows each way's OSM nodes and tags (`lines`, from `osm/base.json`), but the tiles
  carry only `[what, width, n, points, heights]` per stretch (`index.d.ts`'s `Line`): no tags, and
  nothing says where two streets meet.
- `tools/track.mjs` does the rest for the route alone: `lanesOf` for the lines painted, `COBBLE`
  for granite setts, and `kerbs` (its lines 499–596): a pavement on each side as wide as the
  buildings leave room for, none where `sidewalk` says no, a central reservation where a one-way
  carriageway runs beside another, and a gap where a side street joins.
- `fetch.mjs` fetches the streets (not footways, cycleways or steps: task 013), the pedestrian
  areas (they're `plaza` areas in the world), and the crossings and traffic lights as nodes.
- The area is task 032's (`OPEN` in `tools/sections.mjs`). Fujacal doesn't wait for it; the
  whole area does.

Steps, **first on Fujacal** (task 015's five streets and a block round them, the start line among
them), shown on the map page for the owner, before the whole area:

1. **The network.** The streets in the area as a graph: a node where ways share an OSM node at the
   same level, an edge per stretch between them, each edge with its tags (name, kind, width, lanes,
   one way, `sidewalk*`, `surface`, `junction`). Two one-way ways side by side (a dual
   carriageway) are recognised as one street with a reservation between them.
2. **Carriageways.** Each edge's two kerb lines, offset from its centre line by half its real width
   (no `W_MIN`: decision 019), cut back where it meets a junction.
3. **Junctions.** For every node where three or more carriageways meet, or two meet at an angle, a
   polygon: each arm cut where its kerb lines meet its neighbours', the corners between arms
   rounded to a kerb radius (about 4–6 m, less where the buildings are closer), a mitre where two
   meet. A roundabout's ring is carriageway like any other, with its island kerbed on the inside
   (task 014 adds what stands in it). A street's dead end is closed by its kerb.
4. **Kerbs and pavements.** Along each carriageway's edges a kerb (its height, about 15 cm, until
   task 018 measures them), dropped at the crossings; behind it a pavement as track.mjs makes them
   today (as wide as the buildings leave room for, none where `sidewalk` says no), carried round
   the junctions' corners; the reservations between dual carriageways; the squares (`plaza`) as
   pavement.
5. **Markings,** from what the map says, as track.mjs does today: lane lines from `lanesOf`, the
   centre line on two-way streets, zebras where the map has a crossing, a stop line at the traffic
   lights. Task 018 replaces them with the orthophoto's.
6. **Levels.** Every piece keeps its street's level: on the ground its heights are the ground's
   (the games read `height(x, z)`); on a bridge or in a tunnel each point's height, as now (task
   012). Junctions join only streets at the same level; where a bridge's end meets the ground, the
   deck and the street join at grade, as `levels.mjs` checks.
7. **In the tiles.** A new part, `streets`, packed as the others are: per tile, the carriageways
   and junctions as polygons (asphalt or setts), the kerb lines with their heights, the pavements
   and reservations as polygons, the markings as lines with their kind and width, each with its
   level and heights where it has any. `index.js` gives them as `world.streets`, typed in
   `index.d.ts`, and keeps `lines` as it is for the games that read it.
8. **On the map page,** the surfaces over the photo, for the owner to check on Fujacal before the
   rest; then the whole area.
9. **Tests** (`test/streets.test.js`): every polygon closed and simple; no two carriageways at
   the same level overlap but where they meet in a junction; every junction's arms meet its
   polygon with no gap; every carriageway as wide as its street's `carriageway()`; every street in
   the area has a surface; pavements never on a carriageway; and the route's own streets all
   present, so a kart can drive the Volta dos Amigos on them.

## Read first

- `tools/world.mjs` (the `lines`, `levelOf`, the heights, how a tile is packed), `tools/osm.mjs`
  (`carriageway`, `lanesOf`, `COBBLE`, `driven`, `Packer`), `index.js` (`unpack`, `loadWorld`),
  `index.d.ts`.
- `tools/track.mjs` (the kerbs, lines 499–596; the lanes), `tools/levels.mjs` and
  `test/levels.test.js` (task 012).
- `../party-kart/src/render/road.ts` (how the track's kerbs, pavements and lines are drawn today,
  the look the streets should match), `../party-kart/src/render/city.ts` (`paintGround`).
- Tasks 014, 018 and 026, which build on these surfaces.

## Done when

- [ ] The owner has looked at Fujacal's surfaces on the map page before the whole area was done.
- [ ] Every street in the open world's area (task 032) is in the tiles as carriageways, junctions,
  kerbs, pavements and markings at its level, and `loadWorld` gives them as `world.streets`.
- [ ] The README says what the streets are and where each part comes from.
- [ ] `npm test` passes, with `test/streets.test.js`; the tiles' growth is in Notes.

## Out of scope

- Drawing them (task 035) and driving on them (task 034).
- Moving a street onto its real carriageway, or measuring its width, from the LiDAR and the
  orthophoto: task 026, for every street in the area since decision 019.
- Roundabouts' centrepieces: task 014. Markings and pavements from the orthophoto and photos:
  task 018. Footways, steps and walls: task 013.

## Notes

- Decision 019: the streets keep their real widths everywhere, the race's included; `W_MIN`
  goes from the race in task 037.
- **How much there is** (2026-10-14, the world's tiles over x −780…1850, z −100…1900, the area
  before task 032 draws its edge): 154 km of street, of which 74 km residential, 31 km service
  (car parks, driveways), 34 km primary to tertiary, 9 km of fast roads and their links and 6 km
  pedestrian; 0.8 km on bridges, 1.1 km in tunnels, 0.5 km under something. 1,360 points where
  two or more stretches meet, which counts the junctions and also where a tile cuts a street: about
  a thousand junctions. 9,096 buildings and 3,746 trees stand in it.
