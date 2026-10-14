---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 006 · Every street there: an audit of what the map has and what the game draws

## Why

The friends think streets were removed. As far as the code shows, none was: the world keeps
every class of street, service roads and dirt tracks included. But the map page shows only the
main streets (the 65% cut approved in draft 1), and footpaths, steps and cycleways were never
fetched. A street that's missing, or drawn where there's none, is one of the first things a
local notices. An audit settles it with numbers and a picture, and lists what to add.

## What

Today, according to the inventory of 2026-10-13:

- `tools/fetch.mjs` (`base`) fetches `highway` motorway to track, and pedestrian, but not
  `footway`, `path`, `steps`, `cycleway` or `bridleway`.
- `tools/world.mjs` keeps all of them as `lines` in the tiles (`kind` 0–8), except tunnels
  (`world.mjs:48`); 2,255 service segments are in the tiles.
- `tools/build.mjs` keeps only the main streets for the map page (`build.mjs:119`).
- `tools/track.mjs` routes only on primary to living_street (`track.mjs:46`).

Steps:

1. **Fetch the footways too:** add `footway`, `path`, `steps`, `cycleway` and
   `highway=pedestrian` areas to `fetch.mjs`'s `base` (or a new `paths` part), so the audit and
   task 013 have them.
2. **Write `tools/audit.mjs`:** for the track's box (`tracks/amigos.js`, `box`) and the
   shooter's area (decision 003), list every OSM street by class, its length, and whether the
   world tiles draw it (a line within 1 m of it), and the reverse: lines in the tiles that
   match no OSM street. Print a table by class and write the list to `.cache/audit.json`.
3. **Compare with the orthophoto** (task 005's source), by eye, in the shooter's area and
   along the route: streets, lanes and squares the photo shows but OSM lacks. List each one
   with its position in Notes. The list is the outcome: nobody in the group will edit
   OpenStreetMap (the owner's answer), and nothing is patched here either.
4. **Show it** on the map page: a layer "Audit" with the streets coloured by whether the game
   draws them.

## Questions

- [x] Does anyone have, or want, an OpenStreetMap account to fix missing streets at the source?
  Recommendation: yes. Fixes there also reach every map that uses OSM, and they survive each
  fetch.
  > No (2026-10-14): the account would only be for contributing to OSM, and nobody will. List
  > what's missing, and leave it at that.

## Read first

- `tools/fetch.mjs`, `tools/osm.mjs` (`KIND_OF`, `carriageway`), `tools/world.mjs` (lines),
  `tools/build.mjs` (the page's streets).
- `map/decisions.json`: the 65% cut.

## Done when

- [x] `node tools/audit.mjs` prints, per class, the OSM streets in the track's box and the
  shooter's area and how many the world draws, and the lines that match none.
  > Run on 2026-10-14: a table per class for the box, the open world's area and the shooter's,
  > the ways not drawn whole, and 0 lines matching none (the totals in Notes).
- [x] Footways, steps, paths and cycleways are in `.cache/osm/`.
  > `.cache/osm/paths.json`, from `node tools/fetch.mjs paths`: 8,103 ways and relations, 4.8 MB.
- [x] The owner has the answer for the friends: which streets, if any, are missing, and why.
  > Given in the chat on 2026-10-14, and on the map page (the layer and section "Auditoria"); the
  > owner then asked to finish the task.

## Out of scope

- Drawing pavements, footpaths and steps in the game: task 013.
- Changing the map page's 65% cut: it was decided in draft 1.
- Editing OpenStreetMap, and patching the world here for a street OSM lacks.

## Notes

- With nobody editing OSM (2026-10-14), decision 010's "where OSM is wrong about a street's
  direction, it's fixed in OSM (task 006)" has nobody to do it. If the audit finds a missing or
  wrong street that matters to the race or the shooter, bring it to the owner then: fixing it
  would mean a local override, which no decision allows yet. Record the outcome in
  `docs/DECISIONS.md` when this task is finished.

### The work, 2026-10-14

- **The inventory had moved on** since it was written (tasks 012, 032, 033), in ways the steps
  didn't depend on: `world.mjs` keeps the tunnels too now, at their level (`tools/lines.mjs`); the
  map page keeps every class but the service roads, and its default level, "Principais" (the 65%
  cut), hides the residential and unclassified streets, the living streets and the tracks.
  `track.mjs` still routes on primary to living_street.
- **Step 1:** a new part, `paths`, rather than more in `base`, so the world's input doesn't change:
  `footway`, `path`, `steps`, `cycleway` and `bridleway`; `construction`, `road` and `busway`, the
  other ways `base` leaves out; and `relation["highway"="pedestrian"]`, the squares mapped in
  parts. 8,103 elements, 4.8 MB, OpenStreetMap of 2026-10-14 (`base` is of 2026-10-13).
- **Step 2, `node tools/audit.mjs`** (a minute). Streets are every class but the footways, steps,
  paths and cycleways; squares are counted apart, by their outline:

  | | streets, km in OSM / drawn | squares drawn | footways, steps, paths, cycleways, km (none drawn) |
  |---|---|---|---|
  | The Volta dos Amigos' box | 202.1 / 201.7 | 43 of 51 | 171.3 (87.4 of pavement, 342 flights of steps) |
  | The open world's area | 75.0 / 74.8 | 11 of 11 | 86.5 |
  | The shooter's area | 8.1 / 8.1 | 1 of 1 | 12.8 |

  - Every way of every class `base` fetches is drawn whole, service roads and tracks included: none
    in part, none missing. The 0.4 km not drawn are the ways `base` doesn't fetch: three
    `highway=construction` (a service road being built at (1153, 782), in the open world, not there
    in the 2025 photo; and two pavements) and three `highway=road` (two parking aisles at about
    (-870, 1280) and a lane under a building at (1840, 770), tagged so by mistake).
  - The 8 squares not drawn are all multipolygon relations, the Praça da República, the Praça Conde
    de Agrolongo and the Terreiro do Castelo among them: `world.mjs` reads only ways. New task 041.
  - No line in the tiles runs along no street of its kind: 0 strays.
  - "Drawn" is what the tiles have. party-kart paints every line they have on its ground, but a
    tunnel (it draws the mouths) and a deck (drawn whole): `src/render/city.ts`, the filter
    `l.level !== 'tunnel' && !decks.has(l)`, read on 2026-10-14. Task 035 draws the surfaces instead.
- **Step 3, the orthophoto by eye:** `node tools/audit.mjs photos` set the 2025 orthophoto under
  the ways in 53 squares of 250 m at 50 cm a pixel (12 over the shooter's area, the rest within
  60 m of the route), and each place that looked like something missing was seen again at 16 to
  25 cm a pixel. What the photo shows and OpenStreetMap lacks, none of it on the route:
  1. (-460, 655) → (-385, 645) → (-397, 695), about 150 m: a paved drive through the grounds of a
     walled institution with a cloister, just west of the shooter's area, a car on it. Private.
  2. (-195, 1624) → (-135, 1667), about 75 m: old asphalt 6 m wide, overgrown at its west end,
     between a car park and the footway north of it. Disused, or the car park's.
  3. (-108, 1810) → (-110, 1890), about 80 m: a lane down the west side of an industrial building
     into its yard. Private.
  4. (437, 1317) → (472, 1295), about 45 m: a dirt track on from the end of a service road.
  5. (642, 1403) → (747, 1474), about 130 m: a dirt path between the two loops of the road round
     the Picoto's top.
  6. (797, 1152) → (824, 1095), about 80 m: dirt paths in a garden.
  7. (824, 850) → (851, 912), about 65 m: a narrow lane between a large building and the houses
     beside it, mostly under trees. Probable.

  Not counted: a building site's tracks at (-405, 1200), a patch of sand at (310, 1440), and the
  aisles of car parks and yards, few of which OpenStreetMap maps. No square was missing, and no
  street OpenStreetMap has was missing from the photo, where the photo could see it.
- **Step 4:** the map page's layer "Auditoria" (off by default), from `.cache/audit.json` through
  `build.mjs`: the ways in the box green where the game draws them, red where it doesn't, purple
  for the footways, steps and paths; a way's class and whether the game draws it on hover; and a
  section "Auditoria das ruas" with the numbers. `map/braga.json` grew from 4.2 to 4.6 MB (7,071
  ways); nothing else in it changed but the names they add. No geometry or textures went into the
  world, so there's no budget to check.
- **The answer for the friends:** no street was removed. The game draws every street OpenStreetMap
  has round the Volta dos Amigos, service roads and dirt tracks too. What they saw missing is the
  map page: its "Principais" level (the cut chosen in draft 1) hides 95 km of residential streets
  and tracks, and it never shows the 44 km of service roads. What the game does lack is the
  footways, steps, paths and cycleways (171 km, task 013) and 8 squares mapped in parts (task
  041). OpenStreetMap lacks no street in use along the route or in Fujacal.
- **Decision 010:** the audit doesn't check which way a street goes, and found no missing or wrong
  street that matters to the race or the shooter: nothing to bring to the owner.
- **Not verified:** anything under trees, or built or taken away since the 2025 orthophoto;
  whether the private lanes are gated; a square's paving inside its outline.
- **Finished 2026-10-14.** It changed nothing a game shows, so no viewpoint was shot again and no
  round posted; nothing went into the world, so no budget to check. The outcome for decision 010
  is decision 022: OpenStreetMap is taken as it is, and what it lacks is listed, not patched.
