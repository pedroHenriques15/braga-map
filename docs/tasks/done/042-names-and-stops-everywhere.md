---
status: done
priority: medium
kind: code
repo: both
created: 2026-10-14
depends-on: [035]
roadmap: Now · The open world
---

# 042 · Every street's name and every bus stop, in the tiles and drawn

## Why

Task 035 draws every street in the open world's area as the track was drawn, but its blue-and-white
street plates and its bus stops stand only along the route: the world's tiles have no street names
and no bus stops, so only the route's 36 names and 30 stops, in `tracks/amigos.js`, can be drawn.
In the open world a player drives down every street, and Braga's streets have a plate at each corner
and their stops along them.

## What

Today (2026-10-14):

- braga-map: `tools/fetch.mjs` already fetches OpenStreetMap's bus stops (the `street` query,
  `node["highway"~"^(crossing|traffic_signals|bus_stop)$"]`) and every street's tags, its name
  among them (`s.t.name` in `tools/world.mjs`). `tools/track.mjs` (step 5, "What's along it") picks
  the route's streets' names, where the route turns into each, and the bus stops within 9 m of its
  road, into `tracks/amigos.js` (`streets`, `stops`). The tiles (`index.js`, `index.d.ts`'s `Line`)
  carry neither.
- party-kart: `src/render/streets.ts` stands the route's plates on the pavement behind the raised
  kerb nearest each name's point (`kerbNear`), facing the karts coming, and its stops the same way,
  a shelter where the pavement is 2.3 m wide or more. `textures.ts`'s `streetPlates` draws every
  name into one texture 512 px wide and 112 a name, which some phones can't take past 4096 px: 36
  names.

Steps:

1. **braga-map:** the tiles carry each street's name (on `Line`, or as a short list of names its
   lines point into, since one street is many lines) and the bus stops (`{ x, z, shelter }`), in
   `index.d.ts`, credited to OpenStreetMap as the rest is. A new tag for party-kart.
2. **party-kart:** a plate where each named street in the area begins, at its corners: on the
   corner building's wall where one stands within 3 m of the corner, as most of Braga's are, else
   on a post at the kerb (the owner's answer); every bus stop in the area from the tiles, and the
   route's no longer from `amigos.js`. The plates' texture: several atlases of at most 4096 px, or
   the plates drawn per tile, so the area's few hundred names fit.
3. Shoot the viewpoints, and measure the budget (task 004, decision 017).

## Questions

- [x] Where a plate stands: on a post at the kerb, as the route's do today, or on the corner
  building's wall, as most of Braga's are? Recommendation: on the corner building's wall where one
  stands within 3 m of the corner, else on a post.
  > On the corner building's wall within 3 m, else on a post (the owner, 2026-10-15).

## Read first

- braga-map: `tools/track.mjs` (step 5), `tools/world.mjs` (the lines it writes into the tiles),
  `index.js` and `index.d.ts`, `docs/SOURCES.md` (OSM's licence).
- party-kart: `src/render/streets.ts` (the plates and the stops), `src/render/textures.ts`
  (`streetPlates`), `docs/architecture.md` ("The city's budget": the plates' texture).
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, a plate at every corner.

## Done when

- [x] Every named street in the area has its plates, and every bus stop OSM has in the area stands
  on its pavement.
  > 1,034 plates for 199 of the area's 205 named streets, 111 on a corner building's wall and 923 on
  > a post (`test/plates.test.js`: each on a building's wall 5 cm out with open ground in front, or
  > on a post off the carriageways and buildings, at its height; no two of a name within 6 m). The
  > six without one: the Rua do Miradouro, the Anel Panorâmico and the Rua Doutor João de Castro on
  > the Picoto meet no street of another name at a corner in the area (only themselves, unnamed tracks
  > and service roads, or a link across their own median); the Rua António Cândido Pinto's two
  > corners are inside a wide junction's carriageway; the Travessa da Ilha and the Avenida Francisco
  > Salgado Zenha (an expressway, met by its slip roads) barely enter the area, nor the Rua Frei
  > Bartolomeu dos Mártires. Every one of the map's 94 bus stops in the area is in the tiles with its
  > shelter (the test), and party-kart stands each by the kerb nearest it, or at the carriageway's
  > edge where there's no kerb within 20 m (two, on a road with no pavement). Checked in the game at
  > corners in Fujacal, the Devesa, the Rua dos Olivais and the Largo Senhor dos Aflitos, and at
  > stops (screenshots, 2026-10-18).
- [x] The viewpoints where plates or stops show score no lower than the round before.
  > Claude's marks for "As placas" (`2026-10-18-after042`) against "Até aos muros" (`after052`):
  > none moved, 2.88 over the 33. Plates show at `falperra` (a post with two at the roundabout's
  > corner, where the photo has its signpost), `estadio` and `sao-joao-da-ponte` (a post on the
  > pavement ahead, which the photo doesn't show); the route's plate across the street at `devesa`
  > and `fujacal-start` is gone, as their cameras stand mid-street, away from a corner. Not yet on the
  > page: see Notes.
- [x] What it costs against the budget, on High, Medium and Low, in Notes and party-kart's
  `docs/architecture.md`.
  > In Notes.
- [x] braga-map's `npm test`, and party-kart's `npm test` and `npm run check`, pass.
  > braga-map 127 tests on 1.26.0 (on 052's streets and 063's trees); party-kart 66 and `tsc`.

## Out of scope

- Street furniture where it really stands (task 020): lamps, signs, bins, benches, shelters.
- Plates beyond the area's edge, where nobody drives.

## Notes

- **Today, checked against main on 2026-10-18:** as written, but the route had 39 names and 32 stops,
  and since 017 the map puts the shops' signs on their walls itself; so the plates are placed by
  braga-map too (`tools/plates.mjs`, decision 048), from the junctions and the kerbs as 026's
  carriageways (and 052's walls) draw them, and party-kart only draws them. The trees (019, 063) are
  left as they are: a post's spot isn't checked against a trunk.
- Found in task 035 (2026-10-14): its step 4 asked for plates and stops on every street; the
  owner chose to draw the route's on the real pavements there and leave the rest to this task.
- Done (2026-10-18), braga-map 1.26.0 (after 052's 1.24.0 and 063's 1.25.0, remade on both) and
  party-kart PKHASH, not deployed. The tiles: every line's name (64 times its place in the tile's
  names, in its `what`), the bus stops in each tile's header, and the plates; the open world's 53
  tiles 3.274 → 3.329 MB gzipped (54 kB more), the base the same. The HUD names the street you
  drive onto, anywhere, from the lines' names (party-kart's `world/names.ts`), and the city's sound
  hears buses at every stop on the map.
- **The budget:** 042 alone, on 1.24.0 (`after042` shot on 1.24.0 and 042 against `after052`, the 33
  viewpoints): draw calls +2 at every viewpoint on High and Medium (147 → 149 and 144 → 146 at the
  median) and +1 on Low (106 → 107): the plates, their letters and their posts; triangles about
  119,000 more at every viewpoint (2.06 → 2.18 M on High, 1.58 → 1.69 on Medium, 0.92 → 1.02 on Low),
  since cut to about 90,000 with posts of six open sides; textures 9 to 10 MB less on every level
  (139 → 130 MB on High, 84 → 74 on Medium, 50 → 41 on Low): the route's 36 names in one 10.5 MB
  texture gave way to one plate and one canvas of letters for every name. Building the plates takes
  30–60 ms; the rounds' build times differ by up to 1.7 s at the median, the desktop busy with the
  other sessions' work (main's game built in the same 7.3 s as 042's, side by side). The round "As
  placas" on 1.26.0: 149, 146 and 107 calls at the median, 2.15, 1.67 and 1.00 M triangles.
- **The round "As placas"** (`2026-10-18-after042`) is made, in 062's sheets: 33 shots of their own
  in 4 sheets in `.cache/scorecard/rounds/`, and `refs/rounds.json`. **Not published:** the
  scorecard opened from this session in the morning (062 republished it), but since the afternoon
  its account is another (the Artifact tool lists none of the scorecard's), as 052 found. Claude's
  marks are ready in `.cache/scorecard/claude-marks-042.json`: the whole of `scores/claude` at its
  version 13 with 052's round and this one added (it supersedes 052's `claude-marks-052.json`): set
  it pinned to version 13. To publish both rounds: the page (`scorecard/index.html`), the 8 sheets
  (`rounds/2026-10-18-after052-1…4.jpg` and `-after042-1…4.jpg`), `data/rounds.json` and
  `data/viewpoints.json` (`joao-xxi` marked `dropped`), all from `.cache/scorecard/`; the version then
  holds 106 files.
- **Not checked:** the owner's marks; a phone (the plates' 90,000 triangles are always drawn, as
  one mesh); the deploy (not asked).
