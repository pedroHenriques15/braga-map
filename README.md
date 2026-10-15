# A map of Braga

The real Braga for games: its streets, buildings, rivers and railway from OpenStreetMap and its
ground from DGT's LiDAR, cut into sections a game can load on its own, and the tracks planned on
it. Party Kart races on it, and the games after it (a shooter, say) use the same city.

- **The world** (`world/`) is the whole map, 6.5 × 4.6 km, in 500 m tiles. Nothing in it depends
  on a track or an arena: the same streets, buildings and trees in every game.
- **The sections** are named parts of the map, each a set of whole tiles: Centro, Estádio, Gualtar,
  Lamaçães, Picoto, and Bom Jesus e Sameiro, grown from the six zones voted on for tracks until
  they cover all of it.
- **The tracks** (`tracks/`) are the kart tracks planned on the map's streets. Party Kart races
  the Volta dos Amigos, through Centro, Picoto and Lamaçães.
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
// or loadWorld(amigos.box), loadWorld({ sections: ['centro'] })
world.height(x, z); // the ground: every 2 m or 10 m on the tiles loaded, every 50 m elsewhere
world.buildings; // [{ kind, roof, ends, dir, pitch, y, h, ridge, floors, roofColor, … pts }], and areas, lines, trees…
world.streets; // in the open world's area: { carriageways, pavements, kerbs, markings }, each piece at its level
world.open.gates; // where each street leaves the area: [{ x, z, heading, w, k, level, y }]
world.inOpen(x, z); // inside its edge?
```

- `map()` is what every game needs whichever part of the map it's in: the sections and their
  tiles, the relief over the whole map and the horizon round it, the rivers, the landmarks, the
  sights, and the open world's area with its gates. It's small, and it's always there.
- `loadWorld(box)`, `loadWorld({ sections })` or `loadWorld({ open: true })` loads the tiles under
  it, each a module of its own that the game's bundler splits off, so a player only downloads those.
  The types are in `index.d.ts`, and a track's in `tracks/track.d.ts`.
- The ground is the bare ground, from DGT's 2025 LiDAR: every 2 m on the tiles within 60 m of a
  track, over the shooter's area and under the open world's, every 10 m on the others. A street is
  ground, so the ground is the street's own surface; a bridge's deck isn't, so under a bridge it's
  what's below. A building stands on the ground at its lowest corner (`y`), and its height is from
  there.
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
  its edge (`pts`, a ring) and its gates (`gates`): where each street crosses the edge, with the
  way it leaves (`heading`, pointing out), its width kerb to kerb, its kind and level and its
  road's height there, for a game to stand a row of road-works barriers across it ("Estrada
  cortada"). The edge runs half way between the streets in and those out, round the buildings
  between them, and crosses each street square, straight across its width, just past the mouth of
  the junction it leaves from (off a roundabout, past where its exit's two ways splay apart). A
  roundabout is never cut. `inOpen(x, z)` says whether a point is inside it. `loadWorld({ open:
  true })` loads the tiles it touches (`open.tiles`) and those round it, within 500 m (`open.seen`),
  so the city stays drawn past the edge. What stops a kart between the gates is the game's (the
  buildings, or a wall it puts along the edge).
- Round the open world's area (in the box round it, `OPEN_BOX` in `tools/sections.mjs`), every
  street is a surface too (task 033, `world.streets`): its carriageway at its real width, joined to
  the others where they meet, each corner rounded as a kerb turns it, a roundabout round its island;
  the kerbs (dropped at the crossings); the pavements behind them, up to the buildings; the central
  reservations; and the lines painted on them, from what the map says (lanes, the line between the
  two ways, zebras, stop lines at traffic lights). Each piece is cut to its tile, at its street's
  level, with its heights off the ground. `index.d.ts` says what each part is.
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
- The world knows nothing of your road. A game clears its own road and arena of buildings and
  trees when it loads (Party Kart's `src/render/city.ts` does it for a track). The map takes every
  street at least 9 m wide, and the houses it fills in on empty frontages (where the LiDAR wasn't
  fetched) stand clear of that and the pavement. The real buildings stand where they are, so on a
  street narrower than that, some meet the road as a game draws it.
- The package is plain JavaScript and data, so Node runs it as it is (its tests, a game's tests)
  and there's nothing to build.

To change the map for the games: change the scripts, run them again, `npm test`, commit, and tag a
new version (`git tag v1.3.0 && git push origin main --tags`). Then in each game, change the tag
in its `package.json` and run `npm install`. A game keeps the version it names until then, so a
change to the map never breaks a game behind its back.

## The scripts

```sh
npm run fetch    # the data, into .cache/ (about 20 MB, ignored by git): a few minutes
node tools/fetch.mjs lidar ortho  # DGT's LiDAR and orthophoto (about 5.7 GB, with a free account)
node tools/fetch.mjs microsoft    # Microsoft's building footprints over the map (40 MB to download, 2 MB kept)
node tools/roofs.mjs   # every building's height and roof, and those the map lacks: .cache/roofs.json (10 minutes the first time)
node tools/decks.mjs   # the bridges' decks DGT's point cloud saw: .cache/decks.json (10 minutes)
npm run page     # the map page's map/braga.json
npm run tracks   # every track: tracks/<id>.js, and map/tracks.json for the page
npm run open     # the open world's edge, round the Volta dos Amigos: tools/open.json (seconds)
npm run world    # the world: world/base.js, world/tiles.js and a module per tile (1.5 minutes)
node tools/audit.mjs   # every street and path round the Volta dos Amigos, and whether the world draws it: .cache/audit.json (1 minute)
node tools/streets.mjs [x0 x1 z0 z1]  # the streets as surfaces in a box (Fujacal's), and a page over the orthophoto to check them
npm test         # the world and the tracks as the games read them, and DGT's data where fetched
node tools/relief.mjs  # the ground checked: known places, bridges, and each track's profile
node tools/heights.mjs # the buildings checked against the map's own heights and floors, and the outliers
node tools/levels.mjs  # the streets that cross on two levels round the track, and the room between them
node tools/refs.mjs    # the viewpoints' and the reference photos, into .cache/refs/ (with Mapillary's free token)
node tools/round.mjs <round> --label "…"  # a round of party-kart's shots, for the scorecard
```

They need Node 22.18 or later. Run them in that order: `track.mjs` and `world.mjs` read the
landmarks from `map/braga.json`, `open.mjs` the Volta dos Amigos, `world.mjs` makes the ground finer
on the tiles the tracks in `tracks/` run through and the open world's edge touches, the map page
draws the edge (run `npm run page` again after `npm run open`) and the street audit (again after
`audit.mjs`, which reads the world's tiles), and `build.mjs` and `world.mjs` take the buildings'
heights and roofs from `roofs.mjs`'s measurements. All of them need the LiDAR.

- `fetch.mjs` gets OpenStreetMap through Overpass (streets and land; the footways, steps, paths
  and cycleways, and the squares mapped in parts, which only the street audit reads so far;
  buildings, parishes, landmarks, trees, the crossings, traffic lights and bus stops, and the turn
  restrictions) and elevation tiles, plus coarser ones 16 km round for the horizon. The public
  Overpass server is often busy: it waits and tries again. `node tools/fetch.mjs trees` fetches
  only what's named (`base`, `paths`, `buildings`, `admin`, `pois`, `trees`, `street`,
  `restrictions`, `dem`, `horizon`). A
  new fetch brings the map's changes since, so the tracks may come out different: run the games'
  tests after. `node tools/fetch.mjs microsoft` gets Microsoft's building footprints (found by
  machine learning in aerial imagery) over the map, into `.cache/microsoft.json`, only when
  named.
- DGT's open data comes only when it's named, into `.cache/dgt/`: `node tools/fetch.mjs ortho cos`
  (the 2025 orthophoto at 25 cm over the whole map, and the COS2025 land use, about 130 MB, no
  account) and `node tools/fetch.mjs lidar` (the 2025 LiDAR: the ground and surface at 50 cm for
  the Volta dos Amigos' box, the ground at 2 m over the whole map and 200 m round it, and the point
  cloud over the whole map, about 5.6 GB). The LiDAR needs a free account at DGT's CDD, in
  `.cache/credentials.json` as `{ "cdd": { "username", "password" } }`. `dgt.mjs` reads them all
  in the map's metres. [docs/SOURCES.md](docs/SOURCES.md) has what each is, and its licence and
  credit.
- `sections.mjs` has the map's extent, the tiles, the sections, the shooter's area, and the open
  world's (`OPEN`, read from `open.json`), the box round it and the tiles under it and round it.
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
  in where the map has none on a built-up street and the LiDAR wasn't fetched, the trees (woods and
  parks filled in), the rivers with their water level (the lowest ground within 4 m of their
  course), and the sights (Bom Jesus, the Sameiro, the cross on the Picoto, the stadium, the Altice
  Forum, Makro, the Tourigalo with the way its head points and its restaurant's front), picked out
  of the map by their OpenStreetMap ids. `levels.mjs` checks the streets that cross on two levels
  (`test/levels.test.js`): under a deck there's room for what passes, over a tunnel its roof; a
  bridge that meets a street at its end, or that the LiDAR took for the ground, meets it at grade.
  `lines.mjs` is how it reads the streets: each way's kind, width, level, and the heights of a
  bridge's deck or a tunnel's road, straight between its ends at the ground as the tiles hold it
  (task 040), so a deck and the street it meets are at one height there; a tunnel's end on the
  cutting's floor, the lowest of that ground from its mouth to 4 m out. A deck takes the LiDAR's
  height where `decks.mjs` has it 30 cm or more over that line (task 047): `decks.mjs` boils DGT's
  point cloud down to its decks (class 26), the median height in each metre, into
  `.cache/decks.json`, once (10 minutes); without it the decks run straight as before.
- `open.mjs` works out the open world's edge (task 032) from the streets and the buildings, on a
  grid of 1 m: near the loop is within 120 m of it and what that closes round (its inside, and a
  pocket between two of its arms), and the Picoto's top; every street that comes near is in, from
  junction to junction (as far as 120 m past near), and so is every street between two junctions
  that are, a street too short to stand a barrier on, and the whole of a roundabout any of it is
  in. A street leaving is in for a few metres past its junction, past where its kerbs turn the
  corner. The area is what's nearer a street in than a street out (within 60 m of one out in the
  open), and always 105 m round the loop; a building it would cut goes in or out whole, as most of
  it is. Then its outline is drawn round, straightened, and made to cross each street square.
  `gatesOf` finds the gates, for `world.mjs` (with each one's height) and `build.mjs`.
  `test/open.test.js` checks the ring is simple, the loop at least 100 m inside it, a gate where
  every street crosses it and nowhere else, each square, and the ground every 2 m under it.
- `streets.mjs` makes every street in the open world's area a surface (task 033), for
  `world.mjs`, with Clipper (`clipper-lib`, a dev dependency): each street's band at its width
  (`carriageway` in `osm.mjs`), cut square across where it meets another and round at a dead end;
  those on the ground joined into one, each bridge and each tunnel its own; each corner where
  streets meet, or a street turns, rounded at a kerb's radius (3–10 m, by the smaller street) by
  closing the carriageways round it, which leaves a roundabout's island, or another they enclose,
  open; the surface (asphalt, setts, paving, dirt) the bigger street's where two meet. Then what's
  beside them: islands (holes with nothing built on them, under 600 m², or a roundabout's); central
  reservations (between two one-way carriageways running opposite ways up to 14 m apart, for 30 m
  or more); and the pavements, 3.2 m out from the kerb or to the buildings and the water, and none
  along a side the map says has none, or out in the open (no building within 25 m), or by a fast
  road, a service road, a track or a pedestrian street. The kerbs wherever a pavement, reservation
  or island is behind the carriageway, 15 cm high, dropped at the crossings; the lines from
  `lanesOf` (each lane at least 2.5 m), stopping at the junctions and short of the zebras; a zebra
  at every crossing the map has, 4 m deep, but the unmarked ones. Everything to the nearest 10 cm.
  Where a bridge or a tunnel meets the ground's streets (task 040), its carriageway takes the
  ground's place round its end, and a deck's end follows the ground as the tiles hold it, a point
  every 2 m across it, where that's within 0.5 m of the deck; wherever a deck or a tunnel's road is
  within 2 m of the ground, the two are one level, and the ground's pavements give way to it, a
  deck's pavements to the ground's carriageway. On its own, `node tools/streets.mjs [x0 x1 z0 z1]`
  makes a box's streets (Fujacal's by default) into `.cache/streets/` with `index.html`, a page that
  sets them over the 2025 orthophoto, each kind on a layer, to check them by eye.
  `test/streets.test.js` checks it on made-up streets (a T junction, a roundabout, a reservation) and
  in the world's tiles: every ring simple, nothing lying on anything else at its level, a deck
  meeting the ground's streets within 5 cm at its ends and a tunnel's end on the cutting's floor, no
  pavement of one level over the other's surfaces where they're at one height, every street inside
  the open world's edge with its carriageway at its width.
- `audit.mjs` is the street audit (task 006): over the Volta dos Amigos' box, the open world's area
  and the shooter's, every street, square, railway, footway, step, path and cycleway the map has,
  by class, its length and how much of it the world's tiles draw (a line of its own kind within a
  metre; for a square, its outline), and the reverse, any line in the tiles along no street of its
  kind. It prints a table, lists what isn't drawn whole, and writes `.cache/audit.json`, which
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
  taken, at eye level, and at least 150 m from every waypoint and egg. `refs/photos.json` lists
  the reference photos (task 008): for each building in the shooter's area and the ones a local
  knows along the route, the landmarks, bridges and roundabouts, the kinds of building, wall and
  gate, and close-ups of pavements, kerbs, azulejos and street furniture, a real photo from
  Mapillary or Wikimedia Commons with its credit, marked as a reference or good enough for a
  texture. `refs.mjs` fetches them into `.cache/refs/photos/<id>.jpg`, a panorama cut to what it
  shows; `test/photos.test.js` checks each one's credit, and that none was taken within 150 m of
  a waypoint or an egg or looks towards one. party-kart's
  `node scripts/shots.mjs <label>` shoots its city from every viewpoint, at the photo's field of
  view and shape, into a round beside the photos and the round before (task 002, decision 011).
- `round.mjs` prepares one of those rounds for the scorecard (`scorecard/index.html`): its High
  shots and the photos, 960 pixels wide, and the lists the page reads, in `.cache/scorecard/` as
  they're published beside the page. It records the round in `refs/rounds.json` (committed): its
  label, the tasks it shows, a note, and the commits it was shot on. The page keeps each person's
  ratings and comments in the artifact's database, one document each (`scores/<their id>`). A
  round goes up by publishing the page again with the round's files and `data/rounds.json`
  beside it; the files already up stay.

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
   for the waypoint. It prints each one and the loop it gives, takes the cheapest (or `JUMP=<n>`),
   and goes out by the pocket's own mouth. It tries
   every order of the waypoints unless the track gives one (`order`): then only that order, round
   one way and the other, and the direction through each. To add a waypoint without reshuffling
   the loop, put it in the order between the two it falls between. A track with `sections` only
   has those sections' streets.
2. **The centre line.** Short jogs at junctions are folded into one corner, and corners are rounded
   to `R_MIN` (12 m, a street corner) where the streets allow. The heights are the street's own
   surface, from the LiDAR: at each point a line across the carriageway (the median of the slopes
   between every two heights on it, so a kerb or a drop beside the street doesn't tip it) gives
   the height in the middle and how much the street tips sideways (`bank`, up to 8%). A bridge is
   crossed straight from end to end, as the LiDAR's ground has what's under its deck. Both are
   smoothed over about 10 m. It prints the corners it had to make tighter, the widths, the
   steepest grade, the sharpest crest, how much of it tips sideways, the bridges, and any place the
   road comes too close to itself.
3. **The street as it is.** The width, kerb to kerb, is the map's `width`, or its `lanes`, or what
   that kind of street usually is (`carriageway` in `osm.mjs`), never under `W_MIN` (9 m). Lane
   lines follow `lanes` and `lane_markings`; `surface=sett` and the like make granite setts.
   Beyond each edge (`kerbs`) is a pavement as wide as the buildings leave room for (none where
   `sidewalk` says no, or out in the open), a central reservation where a one-way carriageway runs
   alongside, and a gap wherever a side street joins.
4. **Where things go.** The start on the track's `start` street, on the straightest stretch at
   least 250 m from every waypoint, 5 checkpoints evenly spaced, a row of item boxes every 820 m,
   boost pads 30 m into the longest straights, and the easter eggs on their waypoints.
5. **What's along it.** The street names as it turns into each, the landmarks within 220 m, and
   from the map the zebra crossings and traffic lights on its streets and the bus stops beside it;
   the sections it runs through, and the box round it a game draws (500 m round the track).

The layout is a point every 8 m from the start line (every 2 m round a ramp and its landing), each
with its options for the stretch to the next (`tracks/track.d.ts`); a jump's flight is `air`, and
its ramp is in `ramps` (where it stands, its angle and width, and the slowest speed that clears it),
for a game to put up during a race. Nothing else goes near it: no start, checkpoint, item boxes or
boost pad. A track that changes is a different race for the games: Party Kart needs a new peer id
prefix for it, and its tests must still pass.

### A new track

Add it to `tools/tracks.mjs`: an id, a name, its waypoints on the map (read them off the map
page), and `sections` to keep it to some sections' streets. Run `npm run tracks` and look at it on
the map page. Then a game races it by importing `braga-map/tracks/<id>.js`. Party Kart's tests
say what makes a track raceable: a loop of 7–10.5 km, an autopilot lap without respawns, and so on.

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
  are mapped in parts); and none of the 171 km of footways, steps, paths and cycleways yet.
- **The ground** from DGT's 2025 LiDAR: every 20 m on the page, every 2 m in the world on the 23
  tiles the open world's area touches (the Volta dos Amigos and Fujacal among them), every 10 m on
  the rest; from 56 m in the north-west corner to 573 m on the Sameiro. Before, from EU-DEM, the
  Picoto's top was 34 m too low.
- **The world**: 140 tiles, 13,000 buildings from the map (12,400 of them measured by the LiDAR,
  in 18,700 parts) and 11,500 houses filled in, 20,000 trees. 7.6 MB in all (2.6 MB gzipped); a
  game loads the tiles it needs (the open world's area and round it, 53: 6.6 MB, 2.04 MB gzipped;
  the Volta dos Amigos' box, 48: 6.4 MB, 1.96 MB gzipped).
- **The open world's area** (task 032): 3.5 km² round the Volta dos Amigos and the Picoto's top,
  its edge 15.1 km round, with 122 gates (117 on the ground, 1 on a bridge, 4 under something), on
  25 tiles. Their ground every 2 m added 0.16 MB gzipped (5 tiles more than the track's 18). It grew
  from 3.1 km² when the loop took the ramp into the dead end (task 039), by Ponte Pedrinha.
- **The open world's streets** (task 033), over the box round its area, 35 tiles since task 039:
  3,508 stretches of street, 1,791 junctions, 217 islands, 131 central reservations, 169 km of
  kerb. They added 0.33 MB gzipped to the tiles over a 2.6 × 2.0 km box, and 0.03 MB more as the
  box grew with the area's edge.
- **The Volta dos Amigos**, Party Kart's track: 10.1 km round, through five friends'
  neighbourhoods, the way the traffic goes, and over the Rio Este by a ramp into one of them, a
  dead end (decision 027).
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
author, licence and link `photo` gives too. A texture made from a CC BY-SA photo is CC BY-SA.

Every source the map uses or may use, with its licence, its exact credit and what it may be used
for, is in [docs/SOURCES.md](docs/SOURCES.md).
