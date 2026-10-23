# A map of Braga

The real Braga for games: its streets, buildings, rivers and railway from OpenStreetMap and its
ground from DGT's LiDAR, cut into sections a game can load on its own, and the tracks planned on
it. Party Kart races on it, and the games after it (a shooter, say) use the same city.

- **The world** (`world/`) is the whole map, 6.5 × 4.6 km, in 500 m tiles. Nothing in it depends
  on a track or an arena: the same streets, buildings and trees in every game.
- **The sections** are named parts of the map, each a set of whole tiles: Centro, Estádio, Gualtar,
  Lamaçães, Picoto, and Bom Jesus e Sameiro, grown from the six zones voted on for tracks until
  they cover all of it. Fujacal, the shooter's area, loads like one, with the tiles round it
  ([docs/SHOOTER-AREA.md](docs/SHOOTER-AREA.md)).
- **The tracks** (`tracks/`) are the kart tracks planned on the map's streets. Party Kart races
  the Volta dos Amigos, through Centro, Picoto and Lamaçães, and the Volta de Lamaçães (task 072),
  both in the open world's area; the host picks one.
- **The map page** (`map/`) draws it all, for planning, every building coloured by the height
  the LiDAR measured (task 010): `npm run map` and open http://localhost:5180/map/. The shared
  copy, where the zones and landmarks were voted on and approved and where the friends' houses
  were added, is the artifact at https://claude.ai/artifact/UdwdhZYkR76J5xyPcRUHUb. It's published
  from `map/index.html` without its `<!doctype>`, `<html>`, `<head>` and `<body>` (the artifact
  adds its own), with `map/braga.json` and `map/tracks.json` beside it.
- **The scorecard** (`scorecard/`), "Braga real", sets each viewpoint's real photo over the game's
  shot from the same place, round after round, for the people the owner invites to rate how much
  it looks like Braga (task 003): the artifact at https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs.

Everything is in metres from the Praça da República, x east, z south and y up, with heights above
154 m (`elev0`). A point read off the map page (hover over it) is a point in any game.

## Using it from a game

```sh
npm install github:pedroHenriques15/braga-map#v1.3.0
```

```js
import { loadWorld, map } from 'braga-map';
import amigos from 'braga-map/tracks/amigos.js';

const world = await loadWorld({ open: true }); // the open world's area and the city round it
// or loadWorld(amigos.box), loadWorld({ sections: ['centro'] }), loadWorld({ sections: ['fujacal'] })
world.height(x, z); // the ground: every 2 m or 10 m on the tiles loaded, every 50 m elsewhere
world.buildings; // [{ kind, roof, ends, dir, pitch, y, h, ridge, floors, roofColor, facade, … pts }], and areas, lines…
world.lines; // every street and the railway: [{ kind, level, w, name, pts, heights? }], name the map's or null
world.trees; // every tree: [{ x, z, cx, cz, kind, h, crown, foot, trunk, mapped, filled }], as DGT's LiDAR measured it
map().treeKinds; // each kind of tree with its bark's and its leaves' photos: [{ kind, evergreen, bark, leaves }]
world.signs; // the shops' signs: [{ text, colour, from, to, y, h }], on their buildings' walls
world.stops; // every bus stop: [{ x, z, shelter }]
world.plates; // in the open world's area, the streets' name plates: [{ name, on, x, z, face, y }], map().plateSize [w, h]
map().facadeTypes; // each kind of facade's proportions; map().facadeColours its colours
world.streets; // in the open world's area: { carriageways, pavements, kerbs, markings, paths, handrails }, each piece at its level
world.walls; // in the open world's area: [{ kind, material, on, h, w, level, source, pts, ys, open? }], the walls, fences, railings, hedges and gates
world.open.gates; // where each street or path leaves the area: [{ x, z, heading, w, k, level, y }]
world.inOpen(x, z); // inside its edge?
world.shooter; // the shooter's area, Fujacal: { id: 'fujacal', name, pts, gates, tiles, seen }, and world.inShooter(x, z)
world.arenas; // its three arenas, where a round is played: [{ id, name, pts, gates }], and world.inArena(id, x, z)
world.groundCover; // what the ground is, every 50 cm under the Volta dos Amigos' box: [{ tile, box, classes, colour, cars, credit }]
map().groundKinds; // the kinds it says, each with its texture: [{ kind, texture: { id, metres, mean, files, made } | null }]
```

- `map()` is what every game needs whichever part of the map it's in: the sections and their
  tiles, the relief over the whole map and the horizon round it, the rivers, the landmarks, the
  sights, and the open world's area and the shooter's with their gates. It's small, and it's always
  there.
- `loadWorld(box)`, `loadWorld({ sections })` or `loadWorld({ open: true })` loads the tiles under
  it (the section `fujacal`, the shooter's area, and the tiles round it), each a module of its own that the game's bundler splits off, so a player only downloads those.
  The types are in `index.d.ts`, and a track's in `tracks/track.d.ts`.
- The ground is the bare ground, from DGT's 2025 LiDAR: every 2 m on the tiles within 60 m of a
  track, over the shooter's area and under the open world's, every 10 m on the others. A street is
  ground, so the ground is the street's own surface; a bridge's deck isn't, so under a bridge it's
  what's below. Where the LiDAR took a tree's crown or a roof for ground over a street in the open
  world's area, the street's height is held under it, and a crown or roof more than 5 m over it is
  taken off beside it too (`lines.mjs`'s `streetBumps`, task 026: three today). And there, where a
  2 m point's square reaches a street's carriageway, it's the mean of the part on the street alone,
  not a wall, a cutting or a bank beside it (`streetBands`, task 045, decision 049): a street's middle
  is within 15 cm of the LiDAR's at 99.75% of the area's points, and where two streets at different
  heights run a metre apart, the ground steps between them at the wall. A building stands on the
  ground at its lowest corner (`y`), and its height is from there.
- Each street says its level (task 012): on the ground; on a bridge, with its deck's height at
  each point (`heights`); in a tunnel, under the ground, with its road's; or under something at the
  ground's own level (a building over it, or a deck the map draws as a tunnel under a bridge). A
  deck and a tunnel's road run straight between the ground where they end, as `height(x, z)` has
  it: a deck meets the street on the ground at its end within 5 cm (task 040), and a tunnel's end is
  on the cutting's floor. But where DGT's point cloud saw a deck over that line (a flyover humps over
  what it crosses: the Rotunda Santos da Cunha's viaduct is 6 m over it), the deck is at the
  LiDAR's height there; and where the map ends a bridge short of its abutment, the street on the
  ground runs on along the deck to where it meets the ground (task 047). Where the LiDAR took a deck for the ground, the bridge is ground too, and
  what passes under it a tunnel.
- **The open world's area** (decision 019, task 032) is where a game lets the player drive
  anywhere: the Volta dos Amigos' and about 150 m round it, and the Picoto's top. `map().open` has
  its edge (`pts`, a ring) and its gates (`gates`): where each street crosses the edge, and each
  footway, path, cycleway and flight of steps (task 050, `k` 10 to 13), with the way it leaves
  (`heading`, pointing out), its width kerb to kerb, its kind and level and its road's height
  there, for a game to stand a row of road-works barriers across it ("Estrada cortada"). The edge runs half way between the streets in and those out, round the buildings
  between them, and crosses each street square, straight across its width, just past the mouth of
  the junction it leaves from (off a roundabout, past where its exit's two ways splay apart). A
  roundabout is never cut. `inOpen(x, z)` says whether a point is inside it. `loadWorld({ open:
  true })` loads the tiles it touches (`open.tiles`) and those round it, within 500 m (`open.seen`),
  so the city stays drawn past the edge. What stops a kart between the gates is the game's (the
  buildings, or a wall it puts along the edge).
- Round the open world's area (in the box round it, `OPEN_BOX` in `tools/sections.mjs`), every
  street is a surface too (task 033, `world.streets`): its carriageway at its real width, joined to
  the others where they meet, each corner rounded as a kerb turns it, a roundabout round its island
  (its ring and island where DGT's LiDAR measured them, task 014: `round`, for a game to draw in what
  the ground is there),
  and brought back to a wall of the map's that stands in it, no narrower than its lanes (task 052);
  the kerbs (dropped at the crossings); the pavements behind them, up to the buildings and the walls;
  the central
  reservations; and the lines painted on them, from what the map says (lanes, the line between the
  two ways, zebras, stop lines at traffic lights, and at each roundabout's entry the give-way line
  and a triangle in each lane behind it, task 014). Each piece is cut to its tile, at its street's
  level, with its heights off the ground. `index.d.ts` says what each part is.
- So is every footway, path, cycleway and flight of steps the map has there (task 050,
  `world.streets.paths`), but the pavements, crossings and islands it draws as footways, which are
  the streets' own, and what's indoors: each at the map's width or its kind's (a footway 2 m, a path
  1.5 m, a cycleway 2.5 m, or 1.5 m one way, steps 2 m), in what it's paved with, cut back to the
  carriageways, the buildings (but a passage under one, `under`, which reaches a metre past each
  mouth, flush with a pavement it opens onto: task 078), the water and the walls either side
  of its line (but where it passes through one). A footway gives way
  to the pavements, where it meets a street; the pavements give way to a cycleway, which runs in one
  flush with it (`raised`), or along the carriageway's edge as a lane at the road's level with a kerb
  behind it (the Avenida da Liberdade's red lanes). A footbridge is on its deck, at its heights as a
  bridge's are (its ends on the deck DGT's point cloud saw, where it's over the ground). A flight of
  steps is its treads, each its own piece at its height, as many as the map counts or its rise over
  16 cm, its ends on DGT's terrain at 50 cm; where the map counts the steps and the terrain shows
  less than 8 cm a step (a landing at a door isn't ground to it), from its foot 16 cm a step (the
  owner's answer). Its handrails are lines at their tops (`world.streets.handrails`).
- So are its walls, fences, railings, hedges and gates (task 013, `world.walls`): every barrier
  OpenStreetMap has there, and the walls, hedges and retaining walls it lacks where DGT's LiDAR sees
  them (`source`), each as high as the LiDAR measured it (else the map's `height`), its top's height
  at each point; a wall of the map's where the terrain steps across it is a retaining wall, measured
  along it, cut where its higher ground changes side or its step its height (task 077). Each opens
  where a street or a path passes through it and is cut where it would stand on a carriageway or a
  path, but a street gives way to the map's where its lanes fit beside one (task 052); a gate where the map has one, where a driveway crosses a wall, and in a door's or a car's gap
  in a wall the LiDAR found. What each is made of is the map's where it says, else by what's round it
  (the owner's answer, checked against the viewpoints' photos): a retaining wall granite, or concrete
  where it holds up a street; a wall in front of a house or a block of flats rendered and painted, a
  low one (up to 3 m, its top half a railing) with a railing on it; one under a hedge granite. `index.d.ts` says what each field means.
- The buildings are as DGT's LiDAR measured them (`measured`), 95% of those on the map: the
  height of the eaves (`h`) and of the ridge, the roof's shape, the way it runs (`dir`), which
  ends are hipped, its pitch, its storeys, and its colour as the 2025 orthophoto sees it (from
  5 km up, so paler than from the street). Where a roof steps by a storey or turns a corner, each
  part is a building of its own. The rest are guessed from what the map says. The buildings the
  map lacks are the LiDAR's too (task 011): where it saw building and the map has none, each one's
  outline squared to its walls, and measured as the others are. Each says where its footprint is
  from (`source`: OpenStreetMap, the LiDAR, Microsoft's, or invented). Nothing is invented where
  the LiDAR was fetched, which is the whole map; elsewhere houses are filled in on empty frontages
  (`filled`). `index.d.ts` says what each field means.
- Each building's **facade** (task 017, [docs/BUILDING-TYPES.md](docs/BUILDING-TYPES.md)): its kind,
  one of Braga's eleven (the old house, the house, the blocks of the 1950s, of the 1970s to the 1990s
  and of the 2000s, the glass office, the school or public building, the church, the shop or
  showroom, the warehouse, the annex), each with its real proportions (`map().facadeTypes`: a
  storey's height, the ground floor's, a window's size and spacing, a balcony's depth); its walls'
  colour, from thirty that Braga's facades are (`map().facadeColours`), and what they're covered
  with (render, small tiles, mosaic, azulejos, granite, stone slabs, brick, concrete, blocks, glass,
  metal, panels); its ground floor along a street (homes, shops, garages, an arcade, a blank wall,
  glass) and its colour where it isn't the walls'; its balconies; its shutters' colour; and its
  storeys, as counted in its photo or from its height and its kind. Every building in the shooter's
  area and in view of a viewpoint was looked at in its photos by a session (`refs/buildings.json`,
  `seen`); the rest are guessed from the map's tags, their size and their height, and from the
  buildings seen, as often as those of their kind are each colour, material and ground floor.
- The shops' **signs** (task 017): each shop, café, bank or office OpenStreetMap names, as plain text
  (no logos) on its sign's colour (the photo's, where a photo showed it), over its building's ground
  floor on the wall nearest it that faces a street; and the signs the photos show where the map has
  no shop. None for a shop in a shopping centre, more than 12 m in from every outside wall.
- **The streets' names, the bus stops and the name plates** (task 042): each line carries its
  street's name as OpenStreetMap has it (`name`, null where it has none), and each tile the map's bus
  stops (`world.stops`, with whether the map says they have a shelter). In the open world's area,
  `tools/plates.mjs` puts a plate at every corner where a named street meets a street of another name
  (`world.plates`): on the corner building's wall along it, near the corner, 2.6 m up (over a shop's
  sign there), where a building stands within 3 m of both kerbs (the owner's answer); else on a post
  half a metre past the rounded kerb, on a pavement or open ground, a second name on the same post
  over the first. A corner building carries both its streets' names, one on each wall, as Braga's
  do. The corners are worked out from the streets' junctions (the map's nodes, every street but a
  link, a service road or a track without a name) and the kerbs as `world.streets` draws them: none
  inside a wide junction's carriageway, on a reservation or an island, or in a building. 1,034
  plates for 199 of the area's 205 named streets, 111 of them on a wall: most of the area's corners
  have no building within 6 m of the kerb (avenues, roundabouts, houses behind gardens). Decision 048.
- A track brings its race's road (`road`, decision 019): the route's own streets at their real
  widths, as `world.streets` draws them, and its jump's flight, with the corner between the flight
  and the landing street (task 057). Its outline is the race's walls, and where the street drawn
  goes on past it (across a side street's mouth, between a road's two carriageways drawn as one) a
  game stands a row of barriers for a race (`closures`); round that corner, across ground that's no
  street, the road works' boards (`boards`). Within 20 m of the landing (`cleared`) a race takes
  the world's walls down while it runs: there, the corner of a walled lot (decision 042). The world
  itself knows nothing of a road: the trees stand off every carriageway (taken at its own width), the
  houses it fills in on empty frontages (where the LiDAR wasn't fetched) clear of every street taken
  at least 9 m wide (`W_MIN`), and the real buildings stand where they are.
- **The trees** (task 019, decision 043): every tree DGT's 2025 LiDAR sees over the map, 246,000 of
  them (`tools/trees.mjs`), each where it stands (its crown's top), as tall as it is, its crown as
  wide (as a disc as big as it is from above) and its foot as high (where its trunk goes into it),
  its crown's middle where its leaves are (`cx`, `cz`: off its trunk where it spreads to one side,
  task 063), and of its kind: a broadleaf, a pine, a eucalyptus, a cypress or a cedar, a poplar, a palm, a
  plane, a lime or a birch. Its kind is the species a session saw in the photos (task 061,
  `refs/trees.json`): every tree within 60 m of seven viewpoints' cameras and in their view, the rows
  along the route's avenues the photos show (the hackberries of the Imaculada Conceição, the Porfírio da
  Silva and the 31 de Janeiro, the Imaculada's limes clipped into balls, the 31 de Janeiro's robinias),
  and the Parque da Ponte's limes. Else it's OpenStreetMap's where the map names a species, a genus or a
  leaf type (its trees are matched to the
  crowns, and where it maps two or more in one crown the LiDAR saw, the crowns ran together and each
  takes the part of it nearest it); else, on the hills, the main species of the wood it stands in, as
  DGT's COS2025 has it; else a broadleaf, but for the narrow and tall (a poplar where the photo sees a
  broadleaf's leaves, else a cypress or a cedar), a tree taller than the town's that holds its crown
  high (a eucalyptus), and a tall tree that holds its crown high and is dark in the near-infrared, as
  needles are (a pine). Planes, limes, birches and palms only where a photo or the map has them. Each kind
  says whether it keeps its leaves in winter (`map().treeKinds`' `evergreen`: the pines, eucalyptus,
  cypresses and cedars, and palms). OpenStreetMap's trees in no crown (planted
  since July 2025, or under 3 m then) are kept as young trees. A crown with no trunk under it (narrow,
  its leaves in its upper half) that meets a taller one is a limb of that tree, reaching out over a
  square or a path, and part of its crown (decision 047). None stands on a carriageway: a crown's top
  over one has its trunk moved to the edge, within 3 m, its crown left over the street, else it's left
  out. In the open world's area none stands on a footway, a path, a cycleway or a flight of steps, nor
  on a pavement its crown only overhangs from behind (nearer the pavement's back than its kerb, its
  crown's middle off the pavement and the street), where there's open ground under its crown to move
  its trunk to; a street tree stands in its pavement. Its trunk's thickness
  is what a tree that tall and that wide usually has (`trunk`; the LiDAR doesn't see a trunk). Each
  kind has a texture of its bark and a spray of its leaves (`map().treeKinds`, made, not
  photographed: task 082), as the ground's kinds have theirs. Where the point cloud wasn't fetched (nowhere on the map today),
  the map's trees and its woods and parks filled in, at their kind's usual size (`filled`).
- **What the ground is** (task 016, decision 034), every 50 cm under the Volta dos Amigos' box (48
  tiles, the shooter's area and the open world's among them): asphalt, paving, setts, grass, bare
  soil, gravel, water, or a roof, and where a tree's crown is over it. The hard ground is told apart
  by DGT's LiDAR's echo, in the sun or a shadow; the plants by the 2025 orthophoto's near-infrared;
  setts only where the map says a street or a path is setts. Under a shadow, a parked car or a
  crown, the ground is what's round it; where the world draws the streets, their own surfaces.
  `world.groundCover` has it for each tile loaded that's classed, as files a game fetches at its
  graphics level: the classes, a cell a pixel (50 cm on High, 1 m on Medium, 2 m on Low); each
  kind's own colour there, the orthophoto's in the sun without its cars and shadows; and the cars
  the LiDAR saw parked (July 2025), each along a kerb, in a car park or elsewhere. `map().groundKinds`
  gives each kind's seamless texture (made, task 082) and its size in metres, for a game to tile
  over the ground and tint with the place's colour. `index.d.ts` says how each file is laid out.
- A multipolygon's inner rings are holes in the world's areas (`holes`: a clearing in a wood, a pond
  in a park), and the car parks on the ground, and the bays and lanes along the streets, are areas
  of their own (`parking`, task 016).
- **Textures** (decision 030, decision 061) are in `world/textures/`: each kind of ground's (task 016)
  and each kind of tree's bark and leaves (task 019). **None is a photograph** (the owner's rule,
  task 082): each is drawn by `tools/made.mjs` from what it's made of and how it's laid, seamless,
  and its mean colour and contrast matched to its reference photos; photos are references, to
  measure and to judge by, never drawn. The ten photo facades of task 007 are gone: their buildings
  are drawn by the kit, as the others are, and what their photos showed is in `refs/buildings.json`.
  Each texture has a file for each graphics level, `files.high`, `.medium` and `.low`, each with
  its `url`, which the game's bundler serves as an asset (Vite does: in its dev server and its
  build), its size in pixels and its bytes. They're KTX2, compressed with Basis Universal's ETC1S,
  sRGB, with their mipmaps, row 0 at the top: three.js's `KTX2Loader` turns them into what the
  graphics card takes (ETC1 on a phone, BC7 on a PC), and they stay compressed on it, half a byte a
  pixel on a phone where a canvas or a WebP takes four. `made` says how each was made and what it
  was matched to; `map().photoCredits` is empty, as no photographer's work is in the game.
- The package is plain JavaScript and data, so Node runs it as it is (its tests, a game's tests)
  and there's nothing to build.

To change the map for the games: change the scripts, run them again, `npm test`, commit, and tag a
new version (`git tag v1.3.0 && git push origin main --tags`). Then in each game, change the tag
in its `package.json` and run `npm install`. A game keeps the version it names until then, so a
change to the map never breaks a game behind its back.

## The scripts

```sh
npm run fetch    # the data, into .cache/ (about 20 MB, ignored by git): a few minutes
node tools/fetch.mjs lidar ortho nir  # DGT's LiDAR, orthophoto and its near-infrared (about 5.8 GB, with a free account)
node tools/fetch.mjs microsoft    # Microsoft's building footprints over the map (40 MB to download, 2 MB kept)
node tools/roofs.mjs   # every building's height and roof, and those the map lacks: .cache/roofs.json (10 minutes the first time)
node tools/decks.mjs   # the bridges' decks DGT's point cloud saw: .cache/decks.json (10 minutes)
node tools/carriageways.mjs  # where each street's carriageway really is, and the moves that put the map's lines there: .cache/carriageways.json (20 s, 4 minutes the first time)
node tools/roundabouts.mjs   # where each roundabout's ring and island really are, and the statues in them: .cache/roundabouts.json (a minute; --check draws each over the orthophoto)
node tools/walls.mjs   # the walls, fences, railings, hedges and gates round the open world's area: .cache/walls.json (2 minutes, and 3 more the first time)
node tools/sights.mjs  # the Estádio 1.º de Maio's stands and floodlights, the chapels' and shrines' tops, from the point cloud: .cache/sights.json (two minutes)
node tools/trees.mjs   # every tree the LiDAR sees, its height, crown, foot and kind: .cache/trees.json (40 s, 25 minutes the first time; TREES=<name>.json writes .cache/<name>.json, which world.mjs then reads given the same)
npm run page     # the map page's map/braga.json
npm run tracks   # every track: tracks/<id>.js, and map/tracks.json for the page
npm run open     # the open world's edge, round the Volta dos Amigos: tools/open.json (seconds)
npm run shooter  # the shooter's area's edge, round Fujacal: tools/shooter.json (seconds)
npm run world    # the world: world/base.js, world/tiles.js and a module per tile (1.5 minutes)
node tools/audit.mjs   # every street and path round the Volta dos Amigos, and whether the world draws it: .cache/audit.json (1 minute)
node tools/streets.mjs [x0 x1 z0 z1]  # the streets as surfaces in a box (Fujacal's), and a page over the orthophoto to check them
npm test         # the world and the tracks as the games read them, and DGT's data where fetched
node tools/relief.mjs  # the ground checked: known places, bridges, and each track's profile
node tools/heights.mjs # the buildings checked against the map's own heights and floors, and the outliers
node tools/levels.mjs  # the streets that cross on two levels round the track, and the room between them
node tools/refs.mjs    # the viewpoints' and the reference photos, into .cache/refs/ (with Mapillary's free token)
node tools/buildings.mjs  # the buildings whose facades to look at (refs/buildings.json), and with `mark` their photos marked (2 minutes)
node tools/species.mjs mark  # each viewpoint's photo with the trees within 60 m of its camera numbered, and its orthophoto, for refs/trees.json (task 061, 10 s)
node tools/textures.mjs  # the textures refs/textures.json asks for, made, not photographed: world/textures/ (about a minute)
node tools/cover.mjs   # what the ground is every 50 cm under the Volta dos Amigos' box, and the cars parked: world/cover/ (3 minutes, 10 the first time)
npm run minecraft  # the world as a Minecraft world (Java, 26.3): .cache/minecraft/Braga (30 s; --out, --box and --force: "A Minecraft world" below)
node tools/round.mjs <round> --label "…" [--shots <party-kart>/shots]  # a round of party-kart's shots, in a few sheets, for the scorecard
node tools/scorecard.mjs files <listing>      # what the scorecard lacks of .cache/scorecard/, in publishes inside their limits
node tools/scorecard.mjs marks <claude.json>  # Claude's waiting marks added to its document, to set pinned to its version
```

They need Node 22.18 or later. Run them in that order: `track.mjs` and `world.mjs` read the
landmarks from `map/braga.json`, `open.mjs` the Volta dos Amigos, `world.mjs` makes the ground finer
on the tiles the tracks in `tracks/` run through and the open world's edge touches, the map page
draws the edges (run `npm run page` again after `npm run open` or `npm run shooter`) and the street audit (again after
`audit.mjs`, which reads the world's tiles), and `build.mjs` and `world.mjs` take the buildings'
heights and roofs from `roofs.mjs`'s measurements, `world.mjs` the trees from `trees.mjs` (run it after
`fetch.mjs trees`), and the walls from `walls.mjs` (run it
after `roofs.mjs`, `npm run open` and `fetch.mjs barriers`), and the streets on their carriageways from `carriageways.mjs`
and the roundabouts' rings from `roundabouts.mjs` (run them, in that order, before `walls.mjs`, `npm run open`, `npm run shooter`, `npm run world` and `npm run tracks`, which
all take the streets moved, and `cover.mjs` again after `world.mjs`), and the facades from `refs/buildings.json` and the shops from `fetch.mjs shops`. All of them need the LiDAR. `track.mjs` also reads
the streets the world draws (`world.streets`, which don't depend on a track) for the race's road, so
a new track's area needs `npm run open` and `npm run world` before `npm run tracks` plans it on the
streets; when a track moves enough to change the edge, run the three again until it holds.

- `fetch.mjs` gets OpenStreetMap through Overpass (streets and land; the footways, steps, paths
  and cycleways, which the world draws in the open world's area, and the squares mapped in parts,
  which only the street audit reads so far; the walls, fences, hedges, gates and car parks, for
  `walls.mjs`, and the car parks for the world's areas too;
  buildings, parishes, landmarks, the shops, cafés, banks and offices with a name (for their signs),
  trees, the crossings, traffic lights and bus stops, and the turn
  restrictions) and elevation tiles, plus coarser ones 16 km round for the horizon. The public
  Overpass server is often busy: it waits and tries again. `node tools/fetch.mjs trees` fetches
  only what's named (`base`, `paths`, `barriers`, `buildings`, `admin`, `pois`, `art`, `shops`, `trees`, `street`,
  `restrictions`, `dem`, `horizon`). A
  new fetch brings the map's changes since, so the tracks may come out different: run the games'
  tests after. `node tools/fetch.mjs microsoft` gets Microsoft's building footprints (found by
  machine learning in aerial imagery) over the map, into `.cache/microsoft.json`, only when
  named.
- DGT's open data comes only when it's named, into `.cache/dgt/`: `node tools/fetch.mjs ortho cos`
  (the 2025 orthophoto at 25 cm over the whole map, and the COS2025 land use, about 130 MB, no
  account), `node tools/fetch.mjs nir` (the orthophoto's near-infrared, red and green, `Ortos2025-IRG`,
  on the LiDAR's 42 tiles, about 110 MB, no account) and `node tools/fetch.mjs lidar` (the 2025 LiDAR: the ground and surface at 50 cm for
  the Volta dos Amigos' box, the ground at 2 m over the whole map and 200 m round it, and the point
  cloud over the whole map, about 5.6 GB). The LiDAR needs a free account at DGT's CDD, in
  `.cache/credentials.json` as `{ "cdd": { "username", "password" } }`. `dgt.mjs` reads them all
  in the map's metres. [docs/SOURCES.md](docs/SOURCES.md) has what each is, and its licence and
  credit.
- `sections.mjs` has the map's extent, the tiles, the sections, the shooter's area (`SHOOTER`, read
  from `shooter.json`) and the open world's (`OPEN`, read from `open.json`), and for each the box
  round it and the tiles under it and round it.
  `geo.mjs` has the projection, `ELEV0` and the Terrain Tiles. `terrain.mjs` is the ground: the
  LiDAR's at 50 cm where it was fetched, at 2 m over the rest of the map, and the Terrain Tiles
  (EU-DEM) beyond, for the horizon. `osm.mjs` is what `world.mjs` and `track.mjs` share: how wide a
  street is, what an area is, the buildings' footprints, and packing.
- `roofs.mjs` measures every building on the map from the LiDAR's point cloud (task 010): it
  boils each tile down once to 50 cm cells of the building points' tops (`.cache/dgt/roofs/`),
  finds how far the map's outlines sit from them (a shift for each 250 m), then takes each
  footprint: where its roof steps by a storey or more, its parts; for each, the eaves and the
  ridge, the roof's shape (flat, gabled, hipped at either end or both, or one slope), which way it
  runs and its pitch; a pitched roof over an L or a T, cut into rectangles; and its colour, from
  the orthophoto's middle of it. Then the buildings the map lacks (task 011): where the LiDAR saw
  building and no outline of the map's lies, what's left once anything under 2.5 m across is
  cleared, in pieces of 20 m² or more and 2 m tall, not a lorry and not green in the photo; each
  one's outline squared to its walls (`footprints.mjs`), or Microsoft's where it lies closer over
  the LiDAR's cells; put back where the map's outlines round it sit; and measured as the map's
  are. `test/roofs.test.js` checks it on roofs made up as the LiDAR sees them, and
  `test/footprints.test.js` on made-up buildings and on the world's tiles. `heights.mjs` checks what it measured against the map's `height`, `building:levels`
  (a storey comes out at 2.9 m), `roof:shape` and `roof:colour`, and lists the buildings where
  they differ most: the map, more often than the LiDAR.
- `world.mjs` makes the world: the ground (every 2 m on the tiles within 60 m of a track, over the
  shooter's area and on every tile the open world's area touches, each the mean of the LiDAR's round
  it; every 10 m elsewhere), what the ground is (each area cut to the tiles it's on), every street
  at its width and level, the railway, every building on the ground at its lowest corner, with its
  height and roof as `roofs.mjs` measured them (in parts where they step or turn; guessed from the
  map where the LiDAR didn't see it), those the map lacks as `roofs.mjs` found them, houses filled
  in where the map has none on a built-up street and the LiDAR wasn't fetched, the trees as
  `trees.mjs` found them (woods and parks filled in where the point cloud wasn't fetched), the rivers with their water level (the lowest ground within 4 m of their
  course), and the sights (Bom Jesus, the Sameiro, the cross on the Picoto, the stadium, the Altice
  Forum's α, Makro, the Tourigalo with the way its head points and its restaurant's front, São
  João da Ponte's chapel and bridge, and since task 056 the route's chapels of Santa Justa, Santo
  Adrião and Santa Tecla, São Lázaro's bell tower and the wayside shrines of the Senhor do Bonfim
  and the Senhor da Boa Morte), picked out of the map by their OpenStreetMap ids, with what the
  LiDAR measured of them (task 021): the chapels' heights from their buildings' parts, which a game
  draws them in place of (`covers`); the bridge's arch where its road's middle crosses the river;
  and from `sights.mjs` the stadium's stands, along spokes square to its track's oval, every metre
  out from the track to the top of the outer wall (the highest point that isn't vegetation in each
  half metre), its four floodlights' masts, and the chapels' and shrines' tops (a bell gable's, a
  cross's) and the ground round them. `levels.mjs` checks the streets that cross on two levels
  (`test/levels.test.js`): under a deck there's room for what passes, over a tunnel its roof; a
  bridge that meets a street at its end, or that the LiDAR took for the ground, meets it at grade.
  `lines.mjs` is how it reads the streets: each way's kind, width, level, and the heights of a
  bridge's deck or a tunnel's road, straight between its ends at the ground as the tiles hold it
  (task 040), so a deck and the street it meets are at one height there; a tunnel's end on the
  cutting's floor, the lowest of that ground from its mouth to 4 m out. A deck takes the LiDAR's
  height where `decks.mjs` has it 30 cm or more over that line (task 047): `decks.mjs` boils DGT's
  point cloud down to its decks (class 26), the median height in each metre, into
  `.cache/decks.json`, once (10 minutes); without it the decks run straight as before.
- `carriageways.mjs` measures where each street's carriageway really is in the open world's area
  (task 026, decision 039), from DGT's LiDAR: every 2 m along each street on the ground, across it
  from its line out to half the map's width and 10 m more, the 50 cm terrain and the laser's echo
  off the ground (the point cloud as `cover.mjs` boils it down), each the mean over 2 m along the
  street. From the road nearest the line out either way to its edge: a step of 8 cm or more over a
  metre (a kerb, a wall's foot, a bank, a drop), from where a quarter metre of it rises or falls 3 cm
  more than the road; or 1.5 m that echoes as what isn't road (over 7.5 thousand, or 2 more than the
  road round the line up to 8.5; 9 on a street the map says is setts); or a car park the map has. An
  edge isn't seen behind a parked car or under a crown, nor where the road runs on as far as it
  looks; and no station is taken at a junction, a sharp turn or a dead end, where another street's
  line runs in or by the band, nor in a car park or along its aisles. A street's middle every 2 m is
  the median of the stations within 15 m (one that saw one edge counts, half the width from it,
  where the width is clear); its width, the median of those measured both sides, where half are
  within 0.75 m of it. A street moves where its middle is a quarter metre or more off its line for
  30 m or more, and off any edge seen with a drop, a wall or a bank behind it (half a metre within
  3 m, seen twice within 6 m) that its band would reach past; eased in and out over 20 m, turning
  no more than a metre in 5. A junction moves once, to where its streets' middles meet (least
  squares); a bridge's or a tunnel's ways, the railway and the nodes they share don't move, and a
  street that runs on into a deck keeps the map's width. The map's way stays the street: its nodes
  move, and where its middle bends between two of them points are put in, with node ids below zero.
  `lines.mjs`'s `onCarriageways` applies it all to OpenStreetMap's data for every reader of the
  streets (and moves a footway that ends on a street with it); a street's width measured is its
  `width:lidar`, which `osm.mjs`'s `carriageway` takes first. It prints how much it measured, the
  spread, the streets furthest off, the places task 026 names, and how often a carriageway is drawn
  past an edge it saw, over a drop; `--check x,z[,r] …` draws the orthophoto there with the map's
  lines (red, their edges dashed), the edges measured (cyan to a way's left, yellow to its right)
  and the lines moved (green), into `.cache/carriageways/`. `test/carriageways.test.js` checks it
  on made-up cross-sections and streets, and on the open world's streets where they were measured.
- `roundabouts.mjs` measures each roundabout's ring in the open world's box (task 014), which
  `carriageways.mjs` leaves (a ring is all junctions): every 2 m round it, the same cross-section
  (`across`), out from the island: its island's kerb all round, its outer kerb but in an arm's mouth
  (within the arm's half width and 1.5 m of its line). Its width is the median of those measured both
  sides (within 1.5 m of their median), where 5 or more were; else from the island's kerb to the
  map's outer edge. An island is round where three fifths of its kerb seen is within 30 cm of one
  circle (by least squares, fitted again without the points furthest off): its ring is then that
  circle, half its width out; otherwise (an oval, a ring round a square) its line moves out by the
  middle measured round it, as `carriageways.mjs` moves a street. A ring with under three fifths of
  its island seen (cars parked along it, the Praça Paulo Vidal's) stays as the map has it, and so does
  one a deck passes over (the Rotunda Santos da Cunha's, under its viaduct): its kerb is seen only
  between the deck's piers. Its ways
  take its width, and each arm's end eases onto it over 20 m. `lines.mjs`'s `carriagewayMoves` lays
  these moves over `carriageways.json`'s, so every reader of the streets has them. And what stands
  in each island: OpenStreetMap's artworks, fountains and monuments in it (`fetch.mjs art`), each
  where DGT's point cloud has it and as tall (all its points but the ground's: a thin statue's are
  classed as noise), for `world.mjs`'s sights. It prints each ring, what was seen of it and how far
  its island is off the map's; `--check` draws each over the orthophoto into `.cache/roundabouts/`
  (the map's lines red, the island's kerb cyan, the outer kerb yellow, the ring moved green).
  `test/roundabouts.test.js` checks it on a made-up ring, and on the open world's: each island in
  the tiles where its kerb was measured, a give-way line at every entry, the statues.
- `walls.mjs` makes the walls, fences, railings, hedges and gates round the open world's area (task
  013), for `world.mjs`. It boils each tile of DGT's point cloud there down once to 50 cm cells on the
  terrain model's grid (`.cache/dgt/walls/`): the highest point off the terrain, and the highest under
  5 m, how many points and how green they are (their near-infrared against their red: the cloud's
  colours are pale, so growing is an NDVI of -0.04 or more), how many are classed building, how many
  ground points. Over each tile and 50 m round it: a wall is a cell 0.4 to 4.5 m over the terrain, not
  growing, off the buildings, the carriageways and the car parks, and thin (clear of what stands a
  third as high a metre either side, and half a metre on one side: a car is three cells wide or
  more); a hedge the same, growing, clear a metre and a half either side; a retaining wall where the
  terrain steps a metre or more over a metre, with ground points either side, more than it slopes
  beyond. Straight runs through each (the line with the most cells near it, every 3°, its cells no
  more than 1.6 m apart, and half of them not thin along it, as a wall's aren't), each measured along
  it every half metre: a wall's top (the higher of its cells across it), a hedge's width, a retaining
  wall's step and parapet; laid where the map's buildings round it sit (roofs.mjs's shifts). Left out:
  a wall under 6 m long or a hedge under 5 (at 10 points a square metre a parked car is as thin, as
  dense and as even as a wall, and a car's length long), a row of cars along a kerb that isn't whole
  and even, a hedge under 0.8 m or over 3.5 (weeds on a verge, a row of trees) or far from any
  building or street, a retaining wall in a wood or a field far from any building, a wall along a
  retaining wall's top that's its face or its parapet (taller, a fence on it), a hedge over 1.5 m
  within 3 m of one (the bank's growth). Then the map's barriers, each measured along its line (where the terrain steps across a
  wall of the map's, a retaining wall, then measured again along it every half metre, `stepsOf`:
  cut where its higher ground changes side, turned, or where its step changes height, each piece its
  own, and as low as the terrain where it doesn't step), and what the LiDAR found along one dropped
  (but a hedge along a wall). The gates: the map's, across the street or the path each is on or along its wall; where a
  driveway crosses a wall; and in a door's or a car's gap in a wall the LiDAR found. Each wall opens
  where a street or a path crosses it (a way the map stops 3 m short of a wall goes through it), and
  gets what it's made of by what's round it (`dress`). `world.mjs` cuts each to the tiles and where
  it would stand on a carriageway or a path (`cutWalls`, `packWalls`). `test/walls.test.js` checks
  the tiles carry every barrier the map has but where it opens (and how much is still cut on a
  carriageway: where its lanes don't fit beside it, across it, or where streets meet), every gate,
  each piece whole and off the carriageways, a retaining wall's higher ground on its left, and in the
  shooter's area the land on a retaining wall's lower side under its top and no wall over the land
  (task 077).
- `trees.mjs` finds every tree in DGT's point cloud (task 019). It boils each tile down once to 50 cm
  cells (`.cache/dgt/trees/`, 35 s a tile): the highest and the lowest point of high vegetation (class
  5, 2 m and more up) over the terrain, how many there are and their colour (the cloud's near-infrared,
  red, green and blue), and how many points are the ground's and a building's. Then, a tile at a time
  with 20 m round it: the canopy's height in each cell, its gaps filled and smoothed; every cell from
  the highest down joins the crown of the highest cell beside it or starts one of its own, and where
  two meet, the lower is a bump on the higher if its top stands less than 6% of its height (1 m at
  least) over where they meet and within a third of the higher's height of its top; a crown much
  narrower than its height that mostly meets other crowns is a sliver of their canopy, and joins the
  one it meets most; and a crown as narrow as a cypress (its height 2.8 times its width or more) whose
  foot is in its upper half, and that a taller crown borders along a fifth of its edge or more, is a
  limb of the taller (nothing of it comes down to where a trunk would be), and joins the one it meets
  most (`mergeStemless`, task 063). Each crown with its top on the tile, 3 m tall or more: its height
  (its highest point), its width (the cells a quarter of its height up and more, as a disc), its
  middle (where it's drawn), its foot (the 5th
  percentile of its cells' lowest points, no higher than 60% of it: under a thick crown the laser seldom
  reaches its lowest leaves), and its colour. Left out: what the photo sees no leaf in (no more
  near-infrared than red: a wall's edge, a roof, a crane) or that's mostly over a roof, but where the
  map has a tree. OpenStreetMap's trees are matched to the crowns (the one each stands in, or the
  nearest within 2.5 m), and its kinds as the README's trees say, COS2025's woods from its classes 4
  and 5. `--check x,z[,r] …` draws the orthophoto round each point with each crown outlined in its
  kind's colour, its trunk and its middle marked, into `.cache/trees/`. `test/trees.test.js` checks it on
  crowns made up as the LiDAR sees them, the trees in the tiles, and that no viewpoint's camera stands
  within 2.5 m of a trunk or in a crown.
- `open.mjs` works out the open world's edge (task 032) from the streets and the buildings, on a
  grid of 1 m: near the loop is within 120 m of it and what that closes round (its inside, and a
  pocket between two of its arms), and the Picoto's top; every street that comes near is in, from
  junction to junction (as far as 120 m past near), and so is every street between two junctions
  that are, a street too short to stand a barrier on, and the whole of a roundabout any of it is
  in. A street leaving is in for a few metres past its junction, past where its kerbs turn the
  corner. The area is what's nearer a street in than a street out (within 60 m of one out in the
  open), and always 105 m round the loop; a building it would cut goes in or out whole, as most of
  it is. Then its outline is drawn round, straightened, and made to cross each street square, with
  no spike where it runs along a street and crosses it at a bend. The streets are on their
  carriageways (task 026), at the map's widths, which its rules were agreed on (decision 020).
  `gatesOf` finds the gates, for `world.mjs` (with each one's height) and `build.mjs`, where the
  streets cross it and the paths (the edge isn't moved for them: a path crosses it as it comes).
  `test/open.test.js` checks the ring is simple, the loop at least 100 m inside it, a gate where
  every street and path crosses it and nowhere else, each street square, and the ground every 2 m
  under it.
- `shooter.mjs` works out the shooter's area's edge (task 015) on a grid of half a metre: the
  Avenida Imaculada Conceição, the Avenida da Liberdade and the Rio Este close the five streets in
  with the Rua Monsenhor Airosa, and everything between them is in, up to the avenues' near kerbs
  and the river's near bank; past the Rua Monsenhor Airosa, the block behind it is in, half way to
  the streets out, round the buildings, as `open.mjs` does it. `test/shooter.test.js` checks the
  ring is simple, the five streets in it and the avenues and the river out, that it loads as the
  section `fujacal`, and a gate where every street and path crosses it.
- `streets.mjs` makes every street in the open world's area a surface (task 033), for
  `world.mjs`, with Clipper (`clipper-lib`, a dev dependency): each street's band at its width
  (`carriageway` in `osm.mjs`), cut square across where it meets another and round at a dead end, and
  where it runs on into another (or through a junction within 20° of straight), as the narrower;
  those on the ground joined into one, each bridge and each tunnel its own; each corner where
  streets meet, or a street turns, rounded at a kerb's radius (3–10 m, by the smaller street) by
  closing the carriageways round it, which leaves a roundabout's island, or another they enclose,
  open (a roundabout's whole, however far it reaches past the corner, task 014); the surface (asphalt, setts, paving, dirt) the bigger street's where two meet. Then what's
  beside them: islands (holes with nothing built on them, under 600 m², or a roundabout's); central
  reservations (between two one-way carriageways running opposite ways up to 14 m apart, for 30 m
  or more); and the pavements, 3.2 m out from the kerb or to the buildings and the water, and none
  along a side the map says has none, or out in the open (no building within 25 m), or by a fast
  road, a service road, a track or a pedestrian street. The streets end at their walls (task 052,
  decision 046): the walls (`stopsAt`: the map's, and the walls, fences and retaining walls the LiDAR
  found, but not its hedges nor the gates) stop a pavement, each piece of a kerb looking straight out
  from it and none behind a wall it sees, 15 cm short of the wall's line, but what another kerb sees
  past it (a street on its other side); and a carriageway gives way to a wall of the map's that runs
  along it inside its band, or within 15 cm of its edge (`pullBack`): its edge 15 cm short of the
  wall, on straight across an opening up to 6 m that no other street passes through, but not for a
  wall under a metre long, nor round a deck's or a tunnel's end, and no narrower than its lanes
  (`lanesOf`'s, 2.5 m each, or one where it paints none: where they don't fit, the wall is cut as
  before); and a junction's rounded corner stops at a wall of the map's in it, seen from the
  junction (`behind`). Its lines share what's left, easing in and out over 10 m a metre, and its zebras and stop
  lines span it; two carriageways brought back to a wall between them leave its gap as an island. The kerbs wherever a pavement, reservation
  or island is behind the carriageway, 15 cm high, dropped at the crossings; the lines from
  `lanesOf` (each lane at least 2.5 m), stopping at the junctions and short of the zebras; a zebra
  at every crossing the map has, 4 m deep, but the unmarked ones; and at each roundabout's entry, where a
  street runs into the ring the way its traffic goes, a give-way line across the side coming in, at
  the ring's edge, and a triangle behind it in each lane, but none on a zebra (task 014, their sizes
  in [docs/STREET-DETAILS.md](docs/STREET-DETAILS.md)). Everything to the nearest 10 cm,
  the carriageways snap-rounded together, so two pieces that meet share their points there and no
  crack opens between them; and before that, no sliver (task 048, decision 035): a notch into the
  carriageways under a metre wide closed, a gap between two under 0.3 m wide filled, and an island
  kept as the map's lines leave it, but where it's under 20 cm wide (10 until task 026).
  Where a bridge or a tunnel meets the ground's streets (task 040), its carriageway takes the
  ground's place round its end, and a deck's end follows the ground as the tiles hold it, a point
  every 2 m across it, where that's within 0.5 m of the deck; wherever a deck or a tunnel's road is
  within 2 m of the ground, the two are one level, and the ground's pavements give way to it, a
  deck's pavements to the ground's carriageway. A corner of the ground's streets stops at the end's
  line (task 046): past it, along the bridge's or the tunnel's ways within their width and 3 m, as
  far as 30 m or a street on the ground across them, it's cut back, so no road runs on between two
  decks or down the embankment under one; but a junction under a deck or over a tunnel keeps its
  corners, and so does one whose street crosses a deck's or a tunnel's end. On its own, `node tools/streets.mjs [x0 x1 z0 z1]`
  makes a box's streets (Fujacal's by default) into `.cache/streets/` with `index.html`, a page that
  sets them over the 2025 orthophoto, each kind on a layer, to check them by eye.
  And the paths (task 050, `groundPaths`): from `lines.mjs`'s `pathsOf` (what the map has) and
  `pathLines` (a footbridge's and a path's tunnel's heights, as `levelHeights` makes a street's; a
  flight's treads, `flight`), each way's band cut back to the carriageways, the buildings, the water
  and a footbridge's end, against pieces of them split small (`splitter`) so it's quick; then a
  flight of steps a tread at a time (each slab of its line, from the foot), the cycleways, the
  footways and the paths, each giving way to those before it. A cycleway in a pavement is a lane
  where, 40 cm out, the carriageway is beside it along half its length or more.
  `test/streets.test.js` checks it on made-up streets (a T junction, a roundabout, a reservation,
  walls along a street and between two carriageways) and in the world's tiles: every ring simple,
  nothing lying on anything else at its level, a deck meeting the ground's streets within 5 cm at its
  ends and a tunnel's end on the cutting's floor, no pavement of one level over the other's surfaces
  where they're at one height, every street inside the open world's edge with its carriageway at its
  width, and how much of the walls facing a street have pavement past them. `test/paths.test.js` checks the paths
  against the map's (`.cache/osm/paths.json`): each drawn, or what's there instead; the streets'
  own left to them; each at its level; each flight's treads a riser apart, as many as the map
  counts; the Liberdade's lanes; and nothing on anything else.
- `audit.mjs` is the street audit (task 006): over the Volta dos Amigos' box, the open world's area
  and the shooter's, every street, square, railway, footway, step, path and cycleway the map has,
  by class, its length and how much of it the world's tiles draw (a line of its own kind within a
  metre; for a square, its outline; for a path, a path of its kind, and for a pavement or a
  crossing the map draws as a footway, the streets' surfaces, both only in the open world's area),
  and the reverse, any line in the tiles along no street of its kind. It prints a table, lists what isn't drawn whole, and writes `.cache/audit.json`, which
  `build.mjs` puts on the map page as the layer "Auditoria". `node tools/audit.mjs photos` also
  sets the 2025 orthophoto under the map's ways in 250 m squares, over the shooter's area and
  along the route, into `.cache/audit/`: to find by eye a street the photo shows and the map lacks.
- `track.mjs` plans the tracks in `tracks.mjs`: below.
- `refs/viewpoints.json` lists the viewpoints, the places where a game is set against the real
  Braga (task 001): 29 cameras along the Volta dos Amigos, on foot in Fujacal, and on Bom Jesus
  and the Sameiro, each at the spot, heading and height of a real photo (from Mapillary), with its
  author, licence and link. `refs.mjs` fetches the photos into `.cache/refs/<id>.jpg`, cutting a
  panorama to the viewpoint's own view, level; they're not committed. It needs Mapillary's free
  client token, in `.cache/credentials.json` as `{ "mapillary": { "token": "MLY|…" } }` or in
  `MAPILLARY_TOKEN`. `test/viewpoints.test.js` checks each viewpoint stands where its photo was
  taken, at eye level, on the surface its photo was taken from (`surface`: a lane, a pavement, a
  path or the ground; where Mapillary's position is off it, the camera is moved the shortest way
  onto it, task 058, decision 041), and at least 150 m from every waypoint and egg. A viewpoint
  dropped stays under `dropped`, no longer shot, for where its photo was taken (the facades seen in
  it) and its earlier rounds (`joao-xxi`, task 052). `refs/photos.json` lists
  the reference photos (task 008): for each building in the shooter's area and the ones a local
  knows along the route, the landmarks, bridges and roundabouts, the kinds of building, wall and
  gate, and close-ups of pavements, kerbs, azulejos and street furniture, a real photo from
  Mapillary or Wikimedia Commons with its credit, marked as a reference or good enough for a
  texture. `refs.mjs` fetches them into `.cache/refs/photos/<id>.jpg`, a panorama cut to what it
  shows; `test/photos.test.js` checks each one's credit, and that none was taken within 150 m of
  a waypoint or an egg or looks towards one. `refs/buildings.json` says what each building's facade
  is, as a session saw it in its photos (task 017): `node tools/buildings.mjs` lists the buildings
  to look at (every one in the shooter's area, and every one a viewpoint sees: rays across its view
  against the buildings and the ground) with their photos, into `.cache/buildings/todo.json`, and
  `node tools/buildings.mjs mark` outlines and numbers them on each photo, from where its camera was,
  for looking at. `test/facades.test.js` checks every one listed has an entry, in the words
  `tools/facades.mjs` lists. `refs/trees.json` says what species each tree near a viewpoint is, as a
  session saw it (task 061): `node tools/species.mjs mark` outlines and numbers the trees within 60 m
  of a viewpoint's camera (or a reference photo's) on its photo and on the orthophoto round it, into
  `.cache/species/`; each tree seen is recorded by its crown's middle, and the rows along the avenues
  and the places a species fills by their line or ring. `test/trees.test.js` checks every tree within
  60 m of the seven viewpoints read is in it and drawn of its species' kind. party-kart's
  `node scripts/shots.mjs <label>` shoots its city from every viewpoint, at the photo's field of
  view and shape, into a round beside the photos and the round before (task 002, decision 011).
- `textures.mjs` makes the textures that `refs/textures.json` asks for (task 082), into
  `world/textures/`: each kind of ground's (`kind: 'surface'`, task 016), 1024, 512 and 256 pixels a
  side into `world/textures/surfaces/`, and each kind of tree's bark and leaves (task 019), 512, 256
  and 128, into `world/textures/trees/`, each with its size in metres and its mean colour, listed by
  kind in `world/textures.js` (`SURFACES`, `TREES`). Each is drawn by its `generator` in
  `tools/made.mjs`: the ground's (asphalt's aggregate and wear, concrete, Braga's granite setts in
  their rows and joints, a lawn's blades, soil, gravel) and the barks (smooth, a pine's plates, a
  blue gum's peeling strips, a cedar's fibres, a poplar's furrows, a palm's rings, a plane's patches,
  a lime's ridges, a birch's white) from seeded noise and cells that wrap both ways; a kind's leaves
  drawn from its shape (ovate, lanceolate, deltoid, heart-shaped, diamond, five-lobed, a palm's
  leaflet, a pine's or a fir's needles), each with its midrib, veins, two tones and stalk, and laid
  along twigs into a spray. Then its mean colour and contrast are brought to its `match`, which
  `--measure` reads off its references: a Poly Haven texture (CC0, a reference only, its 2k file
  fetched once into `.cache/textures/sources/`) or a reference photo of Braga (`.cache/refs/`).
  Each is compressed as KTX2 with Basis Universal's ETC1S; `--check` also writes each at High as a
  PNG into `.cache/textures/`. `test/textures.test.js` checks none is a photograph, each is made at
  every level, the folder holds nothing else, and the generators wrap and are the same from a seed.
  `tools/ktx2.mjs` has the KTX2 encoding it shares with `cover.mjs`.
- `cover.mjs` classes the ground (task 016, decision 034) on every tile under the Volta dos Amigos'
  box, every 50 cm, after `world.mjs` (it reads the world's streets, paths, buildings and areas
  through `index.js`): from the point cloud, each DGT tile boiled down once to the ground's echo and
  the points over it (`.cache/dgt/cover/`, about 15 s a tile); from the
  orthophoto and its near-infrared (`fetch.mjs ortho nir`) on the same grid. It writes each tile's
  classes (lossless WebP), its kinds' colours (WebP) and its parked cars (JSON) into
  `world/cover/<tile>/`, each tile's index `world/cover/<tile>.js`, and `world/cover.js`, which
  loads them. `--check` also writes each tile's photo, classes and colour side by side into
  `.cache/cover/<tile>.png`.
  `test/cover.test.js` checks every tile is classed at every level, the shooter's area and the open
  world's ground mostly what the map says it is, the kinds' photos, the cars, and the areas' holes.
- `round.mjs` prepares one of those rounds for the scorecard (`scorecard/index.html`): its High
  shots and the photos, 960 pixels wide, and the lists the page reads, in `.cache/scorecard/` as
  they're published beside the page. It records the round in `refs/rounds.json` (committed): its
  label, the tasks it shows, a note, and the commits it was shot on. The page keeps each person's
  ratings and comments in the artifact's database, one document each (`scores/<their id>`). A
  version holds 511 files at most, so a round's shots go up in a few sheets, not a file each (task
  062): `rounds/<round>-<n>.jpg`, at most 9 shots a sheet, three across (about 6 megapixels, which
  a phone decodes), so at most 4 sheets for a round of 34 places. Each shot keeps 8 pixels of its
  own edge round it and starts on the JPEG's 8-pixel blocks, so its piece of the sheet is what its
  own JPEG would be, and the page shows it through a window the shot's size over the sheet. A
  shot's entry is `[w, h, sheet, x, y, hash]`: its size, its sheet and where it is in it, and the
  start of its own JPEG's SHA-1. One the same, byte for byte, as an earlier round's of its place
  is that round's (`[w, h, round]`, task 057) and isn't in a sheet twice. A round goes up by
  publishing the page again with its sheets and `data/rounds.json` beside it; the files already up
  stay. `--pack` packs the rounds prepared before 062, a file a shot, and prints those files as the
  ones to take off the page; with none left, it writes the lists again from `refs/rounds.json`.
- `scorecard.mjs` is for rounds made where the scorecard can't be published (task 064): each waits
  in `.cache/scorecard/`, its sheets by `round.mjs` and Claude's marks in
  `marks/<round>.json`, `{ <place>: { s, c, at } }`. `files <listing>` reads a listing of the
  page's published files and writes `.cache/scorecard/publish.json`: what to add (every sheet and
  photo the page needs that isn't up, and the two lists), what to take off, and the `files` maps to
  publish with (`root: .cache/scorecard`), the files coming off first, each publish within 255
  files and 64 MB and the version within 511. `marks <claude.json>` takes `scores/claude` as the
  page's database gives it and writes `marks/next.json`, the document with the waiting rounds it
  hasn't got added: each a round of `refs/rounds.json`, every place it shot marked 1 to 5 and
  signed "(Claude)", after the round was shot. Both stop when `.cache/scorecard/data/rounds.json`
  isn't `refs/rounds.json`'s (`round.mjs --pack` on main writes it again).

### How a track is planned

`node tools/track.mjs <id>` plans one track; on its own, every one. What it does, in order:

1. **The loop.** A graph of the streets, and the cheapest loop through the waypoints. `COST` makes
   bigger roads cheaper and `TURN` prices the turns. The loop keeps the rules of the road: one-way
   streets and roundabouts only the way they go (`driven` in `osm.mjs`), no turn the map bans
   (OSM's turn restrictions, for cars at any hour), and no street cars may not use; it fails if
   it can't, and prints how much of it is one-way. It never uses a street twice or runs within
   28 m of itself, and it drives along each waypoint's own street through it. The map's streets
   are the only roads it knows (decision 027): where a waypoint's street leads into a pocket (a
   dead end, and streets off it that lead nowhere), it finds every jump into it (`JUMP`): a ramp on
   a street outside, taken nearly straight on after 40 m of straight run-up, a flight at a kart's
   gravity over whatever's really there (clear of DGT's surface model under the slowest flight that
   lands, the gentlest ramp of 10–20° that does), and a landing on a street in the pocket heading
   for the waypoint. It prints each one and the loop it gives, takes the one the owner approved
   (the track's `jump`, its lip's place: it fails if that isn't kept any more), else the cheapest (or
   `JUMP=<n>`), and goes out by the pocket's own mouth. It tries
   every order of the waypoints unless the track gives one (`order`): then only that order, round
   one way and the other, and the direction through each. To add a waypoint without reshuffling
   the loop, put it in the order between the two it falls between. A track with `sections` only
   has those sections' streets. A track with `open` keeps to the open world's area (decision 019),
   and a metre within 100 m of its edge costs `EDGE` (1.5) times as much, as a race's walls want
   the city built round them; `avoid: [ids]` makes another track's streets cost `AVOID` (2.5) times
   as much, so a new loop shares as little of them as a legal loop can (task 072); and `keepOff:
   [[x, z, r]]` keeps it r metres from a place a kart can't race (no junction of it nearer).
   `DEBUG_LOOP=1` prints, when no loop is found, which waypoint's street is never driven the right
   way through it and which leg has no way from one waypoint to the next.
2. **The race's road and its centre line.** The race's road is the route's own streets at their real
   widths, as the open world's tiles draw them (`npm run world` makes those, and they don't depend
   on a track): each street's band round the map's line, the corners between them rounded as a
   kerb turns them (up to `KERB_R`, 10 m), where the streets drawn have carriageway (a sliver of
   pavement into it under 1.2 m wide taken as road), and the jump's flight, as wide as the ramp and
   2 m either side, on past the landing as far as a kart flat out comes down (`JUMP.flat`) and 6 m
   more, so it lands there and drives back onto the street. And the corner between the flight and
   the landing street, on the side the street turns to, within `CORNER` (20 m) of the landing: the
   hull of the road's outline there, less the buildings, whatever else is on it (task 057: a kart
   heading into the turn comes down on that side of the line). It prints the corner's area and the
   world's walls in the race's road within 20 m of the landing, which a race takes down (`cleared`). The centre line is each street's own line from the map, which its carriageway
   is drawn round, thinned only of points within 0.25 m of it. A short jog at a junction (two corners
   turning opposite ways, under 14 m apart) is folded into one corner, and corners are rounded to
   `R_MIN` (12 m, a street corner) where the streets allow, both only as far as the line stays
   `CLEAR` (1.2 m) inside the race's road. It prints how much of the line is on a carriageway and
   where it comes within 1.2 m of the road's edge. The heights are the street's own
   surface, from the LiDAR: at each point a line across the carriageway (the median of the slopes
   between every two heights on it, so a kerb or a drop beside the street doesn't tip it) gives
   the height in the middle and how much the street tips sideways (`bank`, up to 8%). A bridge is
   crossed straight from end to end, as the LiDAR's ground has what's under its deck. Where the
   street's own height rises more than 4 m and falls again within 24 m and the ground past its
   kerbs doesn't, something across it the LiDAR took for ground (trees' crowns meeting over it,
   task 067), the road runs straight under it, as the world lays the street (`flattenLumps` in
   `lines.mjs`); it prints each. Both are
   smoothed over about 10 m. It prints the corners it had to make tighter, the widths, the
   steepest grade, the sharpest crest, how much of it tips sideways, the bridges, and any place the
   road comes too close to itself.
3. **The street as it is.** The width, kerb to kerb, is the street's real width (decision 019): the
   map's `width`, or its `lanes`, or what that kind of street usually is (`carriageway` in
   `osm.mjs`), but never past the race's road either side of the line, so narrower where it rounds
   a corner; it prints the widths and the narrowest places. Lane
   lines follow `lanes` and `lane_markings`; `surface=sett` and the like make granite setts.
   Beyond each edge (`kerbs`) is a pavement as wide as the buildings leave room for (none where
   `sidewalk` says no, or out in the open), a central reservation where a one-way carriageway runs
   alongside, and a gap wherever a side street joins.
4. **Where things go.** The start on the track's `start` street, on the straightest stretch at
   least 250 m from every waypoint and every friend's house, 5 checkpoints evenly spaced, a row of item boxes every 820 m,
   boost pads 30 m into the longest straights, and the easter eggs on their waypoints.
5. **What's along it.** The street names as it turns into each, the landmarks within 220 m, and
   from the map the zebra crossings and traffic lights on its streets and the bus stops beside it;
   the rows of barriers across the side streets it passes (`closures`: the race's road's edge
   wherever the street drawn goes on past it, looked at half a metre beyond it); the road works'
   boards along the corner's own edge at the landing (`boards`, on the ground's height); the
   sections it runs through, and the box round it a game draws (500 m round the track).

The layout is a point every 8 m from the start line (every 2 m round a ramp and its landing), each
with its options for the stretch to the next (`tracks/track.d.ts`); a jump's flight is `air`, and
its ramp is in `ramps` (where it stands, its angle and width, and the slowest speed that clears it),
for a game to put up during a race. Nothing else goes near it: no start, checkpoint, item boxes or
boost pad. With it come the race's road (`road`, its pieces' outlines and holes), its closures
(`closures`, rows of points), where a race takes the world's walls down (`cleared`, as `road`) and
the road works' boards round the corner at the landing (`boards`, rows of points). A track that changes is a different race for the games: Party Kart
needs a new peer id prefix for it, and its tests must still pass.

### A new track

Add it to `tools/tracks.mjs`: an id, a name, its waypoints on the map (read them off the map
page), each on a street that goes on both ways, and `open` and `avoid` to keep it in the open world
and off the other tracks' streets (or `sections` to keep it to some sections' streets). Run `node
tools/track.mjs <id>` and look at it on its own on the map page, `?track=<id>` (`npm run map`, then
http://localhost:5180/map/?track=<id>). The world's ground is every 2 m within 60 m of every track,
so run `npm run world` after a track outside the open world's area. Then a game races it by
importing `braga-map/tracks/<id>.js`: in Party Kart, a line in its `src/tracks.ts`, which puts it on
the race screen, and its tests run over it. They say what makes a track raceable: a loop of
7–10.5 km inside the open world, an autopilot lap at 25–60 m/s on average without respawns, a race
closed by its walls and barriers, every row of barriers holding, and eight bots finishing a lap
within 60 s of each other. Only the Volta dos Amigos may take the world's walls down (`cleared`).

### The friends' houses

The Volta dos Amigos goes through waypoints that stay out of this repo, which is public:
`.cache/places.json`, the houses from the shared map's database, as
`{ "places": [{ "id", "egg", "x", "z", "rows"? }], "order"?: [ids] }`. `order` keeps the loop
going round the houses in that order. `egg` is the easter egg on that house (`dog`, `dentist`,
`supermarket`, `smoke`, `clock` or null), and `rows: true` lines that street with houses on both
sides (`world.mjs` reads that too). Don't copy the file anywhere committed. Since decision 014 the
eggs stand on the houses themselves: each egg in `tracks/<id>.js` is at its house's own spot, on
the side of the road it's on (`test/eggs.test.js` checks it), and the games' drivers are the
friends by first name. Never a surname, a street name or a door number in a commit, a task or a
doc.

### A Minecraft world

`tools/minecraft.mjs` makes the world a Minecraft world (Java Edition, 26.3) from what `loadWorld`
gives a game: a block to the metre, x and z the map's own (the Praça da República at 0, 0), and y
the height above the sea, so F3 shows the real altitude. A data pack in it makes the world 704
blocks tall from y = 0, for the Sameiro's top. The ground covered as the map says, the streets, the
water and the bridges' decks, the walls round the open world's area, every building with its
windows, floors and roof, and every tree. The chunks are 1.21.1's, which the game upgrades as it
opens them (it asks first); the data pack is 26.3's, so a later version may need it changed.

After the map changes, make it again:

```sh
npm run minecraft    # the whole map, into .cache/minecraft/Braga (30 s, 477 MB)
npm run minecraft -- --out "$APPDATA/.minecraft/saves/Braga" --force  # straight into the game's saves, replacing the world there
npm run minecraft -- --box -300,-300,300,300  # just a box of it, in the map's metres (x0,z0,x1,z1)
```

`--force` replaces a world already in `--out` (without it, it stops). In PowerShell the saves are
`"$env:APPDATA\.minecraft\saves\Braga"`; in cmd, `"%APPDATA%\.minecraft\saves\Braga"`. Copy
`.cache/minecraft/Braga` into the saves by hand otherwise. With it go a `preview.png`, the world
from above, and its icon. Close the world in the game before replacing it.

## What's on it

- **The area**: from the station to Lamaçães and from the Picoto to the hospital, 4.3 × 4.3 km.
  With Bom Jesus and the Sameiro to the east, 6.4 × 4.3 km in all.
- **Streets** at three levels, counted in the area asked for. All the streets (not service roads
  or dirt tracks) come to 287 km. The main ones (fast roads, primary, secondary, tertiary and
  pedestrian streets) come to 102 km, 65% fewer. Keeping only the fast roads, primary and
  secondary cuts 78%, but loses the Avenida Central and the old town. That cut is only the page's:
  the world has every street.
- **The street audit** (task 006, the layer "Auditoria"): round the Volta dos Amigos, the world
  draws all 202 km of street the map has, service roads and dirt tracks too, but 360 m of streets
  being built or of no known class; 43 of its 51 squares (all 11 in the open world: the other 8
  are mapped in parts). In the open world's area (task 050), of the map's paths, 83% of the 21.6 km
  of footways (the rest giving way to the pavements and the streets), 84% of the 1.8 km of steps,
  95% of the 6.7 km of paths and 89% of the 7.9 km of cycleways; and the streets' own, 65% of the
  47.5 km of pavements the map draws as footways under the streets' pavements, 90% of its 6.3 km
  of crossings.
- **The ground** from DGT's 2025 LiDAR: every 20 m on the page, every 2 m in the world on the 23
  tiles the open world's area touches (the Volta dos Amigos and Fujacal among them), every 10 m on
  the rest; from 56 m in the north-west corner to 573 m on the Sameiro. Before, from EU-DEM, the
  Picoto's top was 34 m too low.
- **The world** (1.18.0): 140 tiles, 13,023 buildings from the map and 7,243 it lacks from the
  LiDAR (19,643 measured, in 34,233 parts), 20,144 trees. 9.1 MB in all (3.4 MB gzipped); a game
  loads the tiles it needs (the open world's area and round it, 53: 7.3 MB, 2.45 MB gzipped; the
  Volta dos Amigos' box, 48: 7.1 MB, 2.36 MB gzipped, gzip at its highest).
- **The facades** (task 017, decision 036): every building one of Braga's eleven kinds, with its
  colours, material, ground floor, balconies and shutters; 378 of them seen in their photos (690
  looked for: every one in the shooter's area and every one a viewpoint sees), the other 27,789
  guessed from those; 1,360 shops' signs. The open world's 53 tiles 0.15 MB more gzipped (2.30 to
  2.45 MB).
- **The open world's area** (task 032): 3.5 km² round the Volta dos Amigos and the Picoto's top,
  its edge 15.1 km round, with 200 gates on 25 tiles: 121 across its streets (118 on the ground, 1
  on a bridge, 2 under something) and 79 across its paths (40 footways, 9 paths, 25 cycleways, 5
  flights of steps). Their ground every 2 m added 0.16 MB gzipped (5 tiles more than the track's 18). It grew
  from 3.1 km² when the loop took the ramp into the dead end (task 039), by Ponte Pedrinha.
- **The open world's streets** (task 033), over the box round its area, 35 tiles since task 039:
  3,508 stretches of street, 1,791 junctions, 217 islands, 131 central reservations, 169 km of
  kerb. They added 0.33 MB gzipped to the tiles over a 2.6 × 2.0 km box, and 0.03 MB more as the
  box grew with the area's edge. And its paths (task 050), from 1,752 of the map's ways: 5.5 ha of
  footways, 2.1 ha of cycleways (0.19 ha of it lanes beside the road, 0.26 ha flush with a
  pavement), 1.1 ha of paths, and 258 flights of steps in 3,361 treads with 139 handrails; 0.11 MB
  more gzipped (the open world's 53 tiles, 2.00 to 2.11 MB).
- **The open world's walls** (task 013), over the box round its area: OpenStreetMap's 20 km of walls,
  23 km of retaining walls (309 of its walls among them, where the LiDAR saw the terrain step), 4.6 km
  of hedges, 2.2 km of fences and 0.5 km of railings; and those it lacks from the LiDAR: 17 km of
  walls, 59 km of retaining walls, 24 km of hedges and 1 km of fences on retaining walls; 317 gates
  (242 the map's, 6 on driveways, 52 in gaps in found walls). 0.27 MB more gzipped (the open world's
  53 tiles, 2.11 to 2.38 MB).
- **What the ground is** (task 016), on the 48 tiles under the Volta dos Amigos' box: 33% grass, 26%
  roofs, 23% paving, 13% asphalt, 3% bare soil, 2% setts, and gravel and water, 17% under a tree's
  crown; and 41,683 parked cars (18,924 along a kerb, 12,199 in car parks, 10,560 elsewhere). 9.5 MB
  in `world/cover/` at the three levels: all 48 tiles are 4.5 MB on High (the classes 3.5, the
  colours 1.0), 2.1 on Medium and 0.8 on Low, already compressed; and the six kinds' photos, 1.9 MB
  at the three levels.
- **The Volta dos Amigos**, Party Kart's first track: 10.1 km round, through five friends'
  neighbourhoods, the way the traffic goes, and over the Rio Este by a ramp into one of them, a
  dead end (decision 027).
- **The Volta de Lamaçães** (task 072), Party Kart's second: 9.2 km round the streets east of the
  Avenida da Liberdade, Santa Tecla, Lamaçães and the Picoto's foot, with no jump, a third of it on
  the Volta dos Amigos' streets (any loop of 7 km in the open world shares some). Of the two loops
  planned, the one the owner kept and named.
- **The first track** ("Pista antiga"), Party Kart's cartoon Braga Grand Prix, drawn at its real
  size with its fountain on the real one in the Praça da República (`tools/first-track.json`).
  It's 2.5 km round and fits in 851 × 414 m. The real Bom Jesus is 3.9 km from that fountain; on
  the track it's 750 m.
- **Six zones** for tracks, 1 to 2.5 km across: Centro, Estádio, Gualtar, Lamaçães, Picoto, and
  Bom Jesus e Sameiro. They're `ZONES` in `map/index.html` and `tools/sections.mjs`.
- **32 landmarks**, each marked essential, recommended or optional. They're `LANDMARKS` in
  `tools/build.mjs`, placed by their OpenStreetMap names.

## Decisions

Draft 1 was approved on 13 October 2026: every zone and all 32 landmarks stay, with the main
streets (the 65% cut). `map/decisions.json` keeps that, by zone and landmark id, and this copy of
the map shows it. The first track made from the map is the Volta dos Amigos, through the four
houses added on the shared map, and a fifth added after.

## Credits

The data in `world/`, `tracks/` and `map/` is © OpenStreetMap contributors, under the Open
Database Licence (ODbL). Keep that credit wherever the map or anything drawn from it is shown (in
a game, its help and its README). The ground, and every building's height, roof and roof colour,
are from DGT's 2025 LiDAR and orthophoto (CC BY 4.0), and owe this credit wherever the ODbL's goes: "Informação geográfica cedida pela Direção-Geral do Território".
The horizon beyond the map is from Terrain Tiles on AWS Open Data, which over Braga are made from
EU-DEM, and owe this credit too: "Europe terrain data produced using Copernicus data and
information funded by the European Union - EU-DEM layers." `map().credit` gives all three.

The viewpoints' photos (`refs/viewpoints.json`, fetched into `.cache/refs/`, not committed) are
© Mapillary contributors, under CC BY-SA 4.0: wherever one is shown, show its author and link,
which `photo` gives. So are most reference photos (`refs/photos.json`); the rest are from
Wikimedia Commons, each under its own licence (CC BY, CC BY-SA, CC0 or public domain), whose
author, licence and link `photo` gives too. They're references only: none is drawn in a game.

The textures in `world/textures/` are made by `tools/made.mjs` (task 082), not from any photo, and
owe no credit; the Poly Haven textures (CC0) and the photos they're matched to are references only.
What the ground is (`world/cover/`) is from DGT's 2025 LiDAR and orthophoto, with its near-infrared,
and owes DGT's credit above.

Every source the map uses or may use, with its licence, its exact credit and what it may be used
for, is in [docs/SOURCES.md](docs/SOURCES.md).
