---
status: doing
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [007, 008, 010]
roadmap: Phase 3 · Surfaces and colours
---

# 017 · Facades: Braga's kinds of building, and each one's real colour and face

## Why

After the streets, facades are what a player sees most, and today every building is one of
eight colours picked by a hash of its OSM id, with the same window pattern for its kind. Braga
has a recognisable mix: granite houses with tiled fronts in the old streets, the apartment
blocks of the 1970s to 1990s with their balconies and roller shutters, ground floors of shops
and cafés, and newer glass and render. Getting each building's kind, colour and material right
along the route, and its actual face in the shooter's area, is most of what makes a street
recognisable.

## What

Today (`tools/world.mjs:121-146`, `../party-kart/src/render/textures.ts:420-502`):

- `color` is `hash(id) % 8` over a fixed palette; OSM's `building:colour` (55 buildings) and
  `building:material` (28) are fetched and ignored.
- Kinds are house, flats, shop, church, civic, guessed from the `building` tag and the
  footprint's area.
- The walls are canvas textures: one floor is 3 m, a 6 m tile with two windows for flats, one
  with shutters for houses, a band for shops; a door and a shop window on the ground floor of
  flats over 6 m.

Steps:

1. **Braga's building types,** from the online photos (task 008) along the route: list the
   8–12 kinds that make up most of the route and the shooter's area (the granite house, the
   house with a tiled front, the 1980s block of 6–8 floors with balconies, the corner block
   with shops, the 2000s block, the warehouse, the church...). For each:
   floor height, window size and spacing, balconies, shutters, ground floor, materials and
   their colours. Write them in `docs/BUILDING-TYPES.md`, with a photo reference for each.
2. **Each building's attributes,** stored as overrides the world reads, `refs/buildings.json`:
   `{ osm id → type, colour, material, floors, ground floor (shop, garage, door), notes }`.
   Fill it:
   - along the route (every building in view from it) and in the whole shooter's area, from
     the photos and Mapillary, by a session looking at each one;
   - elsewhere, from OSM's tags, then the type guessed from the footprint and height (task 010).
3. **Draw them** in party-kart, a kit per type in its real proportions, coloured from the
   overrides. A photo texture of the facade itself (the owner's answer) on every building in
   the shooter's area, and on the route on those within 30 m of the road that a local would
   know by sight, where task 008 found a photo good enough (straight on, sharp, even light,
   nothing in front). The rest, and those with no such photo, from the type kit.
4. **Shop signs:** OSM's `shop`/`amenity` names on the ground floor's fascia, as plain text on
   the sign's real colour; no brand logos.

## Questions

- [x] Photo textures on how many facades? Recommendation: every facade in the shooter's area,
  and on the route only the ones within 30 m of the road that a local would know by sight;
  the rest from the type kit, coloured from data.
  > As recommended (2026-10-14): every facade in the shooter's area, and on the route the ones
  > within 30 m of the road that a local would know by sight.

## Read first

- `tools/world.mjs:121-146`: kind, height, roof and colour today.
- `../party-kart/src/render/textures.ts:420-502`, `city.ts` (`buildBuildings`, `FACADES`).
- Tasks 007 (how photo textures are stored and loaded), 008 (the photos), 010 (heights).
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, every facade its own photo texture,
  doors, windows and shop fronts where they are, and every building closed.

## Done when

- [ ] `docs/BUILDING-TYPES.md` describes Braga's types, each with a photo.
- [ ] Every building in view of the route's viewpoints and in the shooter's area has an entry in
  `refs/buildings.json`.
- [ ] The route's viewpoints score higher on the scorecard than the round before, and none
  lower.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- Heights and roofs: task 010. Footprints: task 011. Landmarks: task 021.

## Notes

- From task 007 (2026-10-15): the pipeline is there. A facade is a recipe in `refs/textures.json`
  (the photo, the wall's points, its four corners in the photo, read off by eye, and what part of
  the wall it spans), made by `tools/textures.mjs` and drawn by party-kart with `?photos` as quads
  in front of the wall, a mesh each: ten are made. Hundreds want an atlas or an array per tile, or
  they're a draw call each. The photos' light and white balance differ from each other's and the
  game's (dusk is blue, low sun orange, and all read paler under the game's light): matching them
  is this task's. Seven of the ten have cars at their foot. Mapillary's cameras are 1–3 m out, so
  the corners have to be read off each photo; projecting the world's buildings into it only says
  which building it shows.

### The work, 2026-10-16

- **Where it is:** worktrees `../braga-map-017` and `../party-kart-017`, branch `task-017`, as another
  session worked on task 048 in the main checkout; `.cache/` linked into the first (a junction) and
  party-kart's `shots/` into the second. party-kart's `package.json` points at `file:../braga-map-017`
  while it's tested; it goes back to a tag when braga-map 1.17.0 is cut. Both touch files 048 may
  touch (`tools/world.mjs`, `index.js`, `index.d.ts`, every tile): after merging, `npm run world` and
  `node tools/textures.mjs` again, as the tiles are made, not edited.
- **The kinds** (`docs/BUILDING-TYPES.md`, `tools/facades.mjs`): eleven, from task 008's photos of the
  kinds and the buildings seen: the old house, the house, the blocks of the 1950s, of the 1970s to
  the 1990s and of the 2000s, the glass office, the school or public building, the church, the shop
  of its own, the warehouse, the annex. The corner block with shops is a block with `ground: shops`,
  and the tiled front a material (`azulejo`, `tiles`, `mosaic`), as both are in every kind. Each
  kind's storey and ground floor from the LiDAR's eaves over the storeys counted in the photos: the
  1970s–1990s block 2.94 m over 3.64 (fitted on 50), the 1950s block 2.82 over 4.89 (33); the rest
  had too few, or too scattered (houses half sunk into their slopes), to fit both, and take a storey
  from practice and the ground floor it implies (the doc's table).
- **Which buildings** (`node tools/buildings.mjs`): the 346 the world draws in the shooter's area,
  and 344 more a viewpoint sees (rays from its camera against the buildings as the world has them and
  the ground, 4 or more of a 256-wide grid): 690. `mark` outlines and numbers them on each photo from
  where Mapillary says its camera was (252 photos: the viewpoints' and every facade photo of one of
  them); the outlines run to the ridge and sit up to a building off where the camera's 1–3 m out.
- **The looking:** each building in the photo that shows it best (its own, else the one it takes most
  of), by eleven sessions with a brief (the colours judged against what's white nearby, as many photos
  are tinted by a windscreen or taken at dusk; the kind by the building's look, not its use), 247
  photos in all; then the buildings that take 1.5% or more of a viewpoint's photo, which the
  scorecard judges, checked against that photo by three more (82 buildings, 15 changed). 370 are
  described (177 sure), 8 more their colour without their kind; 320 weren't seen: 133 are specks in
  every photo (under 0.05% of it), 77 in no photo at all (72 in the shooter's area: back rows,
  courtyards, the river's side, as task 008 found), the rest hidden behind trees, walls and other
  buildings. Those are in `refs/buildings.json` with why, and guessed. The scripts that batched and
  merged the sessions' answers were the session's, not committed; `refs/buildings.json` is what they
  made. House numbers were taken out of the notes.
- **The guess** for the 27,789 buildings nobody saw (`guesser`): the kind from OpenStreetMap's tag, else
  the world's own kind from the footprint and the height, a block of flats one of the three blocks as
  often as those seen of about its storeys are; then its colour, material, ground floor, base,
  balconies and shutters as often as the buildings of its kind seen have each, by a hash of its name.
  OSM's `building:colour` (55) and `building:material` (28) where tagged; shops where a named shop is in
  it.
- **The tiles** (braga-map 1.17.0): a building's record has three more numbers after its points (its
  kind, material, ground floor, balconies and whether it was seen; its colour and its shutters'; its
  base's colour and material and its storeys), `map().facadeTypes` and `map().facadeColours`; and the
  shops' signs in each tile's header, 1,360 over the map: each named shop (`fetch.mjs shops`: 1,678)
  given to one building (the smallest it's in, else the nearest within 3 m), on its wall onto the open
  nearest it, preferring one that faces a street; none for a shop more than 12 m in from every outside
  wall (a shopping centre's); and the signs the photos show where the map has no shop, on the wall
  that faced the camera. The open world's 53 tiles grow 2.44 → 2.59 MB gzipped.
- **The photo facades** (step 3): the ten task 007 made, the two in the shooter's area among them; task
  008 found no other photo good enough (straight on, sharp, even light, nothing in front), so every
  other building is its kind's kit. Drawn for everyone now (`?photos` is gone), each in its building's
  colour: its index says what colour the wall is in the photo (the patch of plain wall its session
  marked, else the photo's middling pixels), and the game divides the photo by it and multiplies it by
  the building's.
- **In party-kart:** `render/facades.ts`, the kit: each kind's bay (a window and the wall round it, a
  storey high) drawn on a canvas in metres in the kind's proportions, repeated along each wall and up
  it, the ground floor as it is along a street (a wall faces one if a street is within 7 m of a point
  4 m out from its middle), over the material's surface tiled at its real size, the building's colours
  in one shader; a front door in the middle of the longest wall along a street; balconies as geometry
  (a slab's front and underside and a railing) on walls along a street within 60 m of the open world
  on High, in it on Medium, none on Low. `render/signs.ts`: a fascia and the name in letters cut from
  one canvas. The walls take a third of the sky's reflections: three.js gave them the scene's whole
  environment, on top of the hemisphere light, which washed a teal (58, 118, 118) to (189, 228, 229).
  `scripts/shots.mjs` bundles its dependencies afresh each time: Vite kept serving the first braga-map
  installed from its folder, at the same version, so every shot showed the first world built.
- **Not done:** doors, windows and shop fronts where they really are (the kit puts them in a rhythm;
  task 015's bar wants them where they are, which needs a photo of each facade straight on: decision
  018, when one turns up); house numbers; awnings; a teal for the colours came late, after the looking
  (two blocks set by hand). A building the photos show demolished (`way/1462454847`, a 2015 photo; a
  building site in the Devesa viewpoint's) and one rebuilt (`way/372275044`) stay as the LiDAR saw
  them in 2025.
- **Found along the way:** the Monte da Forca's viewpoint looks 6° higher than its photo (task 055).
- **The budget** (task 004; party-kart's `shots/2026-10-16-task017/`, every viewpoint at High, Medium
  and Low, against `after016`, the median of 29): draw calls 113 → 126 on High and Medium, 89 → 95 on
  Low; triangles 1.37 → 1.66 M on High, 1.10 → 1.37 on Medium, 0.74 → 0.76 on Low (the balconies,
  none on Low); textures 118 → 132 MB on High, 68 → 80 on Medium, 42 → 47 on Low (the kit's two arrays
  and the ten photos); the city built in 6.6 s on High against 4.2 (4.4 against 3.8 on Medium, 3.7
  against 3.9 on Low). The download on High (`node scripts/download.mjs`) 7.24 → 7.96 MB gzipped: the
  facades' photos, now fetched by everyone, and the tiles. Recorded in party-kart's
  `docs/architecture.md`. Over the budget's figures, as the city was before (decision 017: a guide).
- **Tests:** braga-map `npm test` 90 of 90 (`test/facades.test.js`: every entry in the words, every
  building to look at with an entry, the guess, the tiles' facades and storeys, each sign on its wall
  facing out); party-kart `npm test` 49 of 49, `npm run check` clean.
- **Left for `/task finish`:** the round "task017" on the scorecard, for the owner's marks against "O
  chão" (Done when's third); `docs/DECISIONS.md` (each building's facade as a session saw it in its
  photos, else guessed from those seen; a kit in each kind's proportions; photos only where good
  enough, in the building's colour); braga-map 1.17.0 tagged and party-kart back on the tag; the
  README's sizes.
