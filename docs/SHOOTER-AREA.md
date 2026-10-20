# The shooter's area: Fujacal and Conselheiro Lobato

Where the first shooter is played (decision 003), and what "real at walking distance" means there.
On foot a player looks at a wall from a metre away, walks into side streets and courtyards, climbs
steps and stops to look up: everything the kart race gets away with at 80 km/h shows. Every task in
Phases 2–4 does this area first, to the bar this page sets; the tasks link here where it raises
theirs. Task 015 drew the edge and wrote this page (decision 031).

## Where it is

The five streets (the Rua, the Travessa and the Alameda do Fujacal, the Rua and the Travessa
Conselheiro Lobato) and a block each side of them (the owner's answer, 2026-10-14):

- **The Avenida Imaculada Conceição** to the north-west and **the Avenida da Liberdade** to the
  east: the edge is their near kerb, so the player walks their pavement and sees across, but
  doesn't cross. A busy road is the edge there.
- **The Rio Este** to the south: the edge is its near bank. The Ecovia along it is in, the Parque
  da Ponte and the Altice Forum across it are seen.
- **On the west, past the Rua Monsenhor Airosa,** the block behind it is in: the houses on the
  street, the flats round the Rua Doutor José Vilaça's driveway and their courtyard, reached on foot
  through a passage under the houses, and the Rua de Santa Justa along the river. There the edge
  runs half way between the streets in and those out, along the backs of the buildings between
  them, and crosses each street that leaves square, a few metres past its junction.

21.5 ha, 750 by 480 m at most. The ground climbs 31 m, from 150 m above the sea by the river at
the Rua de Santa Justa to 182 m at the top of the Rua do Fujacal: from the higher streets the player
sees down onto the roofs below. The race's start, on the Rua do Fujacal, is in it.

`tools/shooter.mjs` (`npm run shooter`) works the edge out from OpenStreetMap's streets, the river
and the buildings (how is in its header) into `tools/shooter.json`; `tools/sections.mjs` reads it as
`SHOOTER`, with `SHOOTER_BOX` and `inShooter`. Run it again only to move the edge, then
`npm run world` and `npm run page`.

### In a game

```js
import { loadWorld, map } from 'braga-map';

const world = await loadWorld({ sections: ['fujacal'] }); // the 3 tiles under it, and the 12 round it
world.shooter; // { id: 'fujacal', name, pts, gates, tiles, seen }
world.inShooter(x, z);
world.arenas; // [{ id, name, pts, gates }]: the three arenas (below)
world.inArena('topo', x, z);
```

### The arenas

The whole area is far too big for a round of a few players (the owner, 2026-10-20, task 079,
decision 057): a round is played in one of three arenas in it, about 80 m across each, drawn by hand
in `tools/arenas.mjs` along the backs of the buildings round them where they can, across a street or a
path where they must, each with its gates (`world.mjs`, as the area's):

- **Topo do Fujacal** (`topo`, 66 × 108 m, 8 gates): the Rua do Fujacal by the race's start, round the
  block of flats standing alone in its loop of street, the houses south-west of it, and the Rua
  Conselheiro Lobato below.
- **Doutor José Vilaça** (`vilaca`, 77 × 83 m, 9 gates): the end of the driveway and the flats'
  courtyard round it, the houses along the Rua Monsenhor Airosa, and that street.
- **Santa Justa** (`santa-justa`, 87 × 62 m, 7 gates): the Rua de Santa Justa between its flats and the
  long block by the river, down to the Ecovia; its edge on the south is the area's.

A building the edge runs through stays whole and shut. Party Kart makes most of the buildings wholly
in an arena a ground floor to walk into, and two of them every floor and the roof (its
`src/world/interiors.ts`): made up, the map knowing nothing of what's inside.

`fujacal` loads like a section, but it isn't one of the six that share the map out: it overlaps
Centro and Picoto, and `sectionAt` never answers it. The ground is every 2 m on every tile under it.

**Its gates,** where a street or a path crosses the edge (`shooter.gates`, as the open world's): 17.
Ten across streets: six where a street leaves on the west or crosses the river at the Largo Santa
Justa's bridge, which the game closes as the street is (a barrier, a parked van, a gate in a wall);
four where a street meets an avenue, at the kerb, which the avenue's traffic or a railing closes.
And seven across paths, since the map's footways, steps and cycleways came into the world (task
050): two footways (one on a footbridge), a path, and four cycleways, the Ecovia among them, two of
them on its bridges.

## What's in it

From the map as it is (2026-10-15):

- **355 buildings,** 308 OpenStreetMap's and 47 the LiDAR found (528 parts in the tiles, 515
  measured by the LiDAR); four storeys at the median (12.8 m), eight at most (24 m). The Escola
  Básica do Fujacal stands in it, near the Rua Monsenhor Airosa.
- **Streets:** 1.3 km of secondary street (the Rua do Fujacal, the Rua Conselheiro Lobato and the
  Rua Monsenhor Airosa), 2.2 km residential, 0.8 km of service roads and driveways, 0.1 km
  pedestrian. **On foot:** 6.7 km of footways (74 of them the pavements, mapped beside the
  streets), 0.5 km of the Ecovia, 0.2 km of paths, and 14 flights of steps, 11 with their count of
  steps (4 to 17) and a handrail.
- **47 crossings,** 3 traffic lights, 10 bus stops; kerbs tagged lowered (11), raised (6) and flush
  (3) at the crossings.
- **765 trees** the LiDAR sees (task 019, 2026-10-18), 183 of them the 184 OpenStreetMap maps: 690
  broadleaves, 63 cypresses and cedars, 9 poplars, 3 eucalyptus, up to 23 m tall, each where it stands
  at its height, crown and foot. Two parks and a pitch between the blocks, 25 gardens, grass by the
  river.
- **Walls** (task 013, 2026-10-16): OpenStreetMap maps 87 walls here (1.4 km), 16 retaining walls
  (0.5 km) and 39 gates; the LiDAR finds 33 walls more (0.3 km), 54 retaining walls (0.5 km) and 98
  hedges (0.8 km). The walls are 1.85 m high at the median, the houses' and the flats' along the Rua
  do Fujacal low and rendered with a railing on them, as their photos show them.
- **The ground** (task 016, 2026-10-16): of its 21.5 ha, 42% roofs, 25% paving, 16% asphalt, 14%
  grass, 1.5% setts, 1.4% bare soil, and a little gravel and water; 12.5% under a tree's crown. The
  LiDAR saw 1,028 cars parked in it (July 2025): 670 along the kerbs, 174 in car parks, 184
  elsewhere.
- **The facades** (task 017, 2026-10-16, [BUILDING-TYPES.md](BUILDING-TYPES.md)): each of the 346
  buildings the world draws here was looked for in its photos and the viewpoints'
  (`refs/buildings.json`); those seen have their kind, colour, material, ground floor, balconies and
  shutters as the photos show them, and the shops' signs the photos show, as OpenStreetMap maps none
  here. The rest, behind others, in back yards, round the courtyards, are guessed from those seen.
  Two have a photo good enough to be their texture.
- **What OpenStreetMap lacks here:** shops (none mapped, though the photos show corner blocks with
  shops and cafés), doors, street lamps, benches (one bin).

## What walking distance needs

For each kind of thing, the detail it needs here beyond the rest of the map, and where it comes
from. The task that does it does this area first.

| What | Here | From | Task |
|---|---|---|---|
| **Buildings** | Footprint and height, every part. | The LiDAR: done (decision 025). | 010, 011 |
| | Each facade its own: its colour, material and face, doors and windows where they are, balconies, roller shutters, the ground floor's shops and cafés with their signs and awnings, house numbers. Every facade a photo texture (the owner's answer to 017). | The reference photos (task 008); OpenStreetMap has no shops here, so the photos say where they are. Done as data (task 017): each building's kind, colour, material, ground floor, balconies, shutters and signs as its photos show them, drawn by a game from its kind's kit; a photo texture on the two photographed well enough. The rest want a photo straight on, sharp and clear (decision 018: when one turns up online). Doors and windows are where the kit puts them, not where they are. | 017 |
| | Closed: no gap between two buildings a player can see through or fall into, doors and shop windows drawn shut. | The footprints, and the photos where two meet. | 017 |
| | Roofs seen from above, from the higher streets: tiles, terraces, chimneys, aerials. | The LiDAR's parts (task 010), the orthophoto's colour. | 010, 017 |
| **The ground** | At centimetres, not the tiles' 2 m: each kerb at its own height (`streets.mjs` takes 15 cm for all), dropped at the crossings; each pavement level from its kerb (task 044); each step at its rise, with its handrail; ramps and driveways. | The LiDAR's terrain model at 50 cm (`MDT-50cm`, fetched for the area) and its point cloud, about 10 points a m²; OpenStreetMap's steps and kerbs; the photos. | 044, 050 |
| | What each surface is: asphalt, calçada, granite slabs, setts, paving stones; drains and manhole covers where they are. | The orthophoto (25 cm), OpenStreetMap's `surface`, the photos and close-ups. | 018, 016 |
| | What isn't paved: lawns, gardens, the pitch, the waste ground by the river, soil. | The orthophoto and its near-infrared. | 016 |
| **Walls** | Every wall, fence, gate, railing and hedge, at its height and of its kind: the walls round the houses, the railings by the river, the school's fence. Cover and climbing for the player. | OpenStreetMap's, and the LiDAR's point cloud for where and how high and those the map lacks; the photos for what. Done (task 013), but the railings the cloud can't tell from a wall. | 013 |
| **Furniture** | Lamps, signs, bins, benches, bollards, bus shelters, ecopontos, where each stands; the traffic lights and crossings OpenStreetMap maps. | The photos; OpenStreetMap; DGT's topographic mapping when it's published. | 020 |
| **Trees** | Each one where it stands, at its height and with its crown, of its kind. | The LiDAR's high vegetation; OpenStreetMap's 184; the photos for the species. | 019 |
| **Parked cars** | Along the kerbs where the photos show them: most of these streets are lined with them, and they're cover. | The photos and the orthophoto. | 020 |
| **Markings** | Every line, crossing, arrow and parking bay, as painted. | The orthophoto. | 018 |
| **Names** | A street plate at each corner, as Braga hangs them; the bus stops' signs. | OpenStreetMap's names and stops. | 042 |

### Where the player goes

- **In:** the streets, the squares and the open courtyards (the owner's answer, 2026-10-14): the
  pavements and carriageways, the Ecovia, the parks and the pitch between the blocks, the courtyard
  of the flats behind the Rua Monsenhor Airosa through its passage, and every footway and flight of
  steps.
- **Not in:** the inside of any building but, in the arenas, the ground floors Party Kart opens and
  its two towers (task 079, the owner's answer of 2026-10-20); private gardens and back yards behind their walls; the
  school's grounds behind their fence. Every building is closed and solid to its roof.
- **Gates:** a gate into a courtyard is open if the photos show it open or it has none; one that's
  shut in the photos stays shut. Task 013 records each: the 39 here are the houses' and the flats'
  gates onto the streets (and none into a courtyard), all shut, as the photos show them (but one
  house's drive gate standing open, into its garden, which stays shut: a garden is out of bounds).
- **No holes:** wherever the player can walk, the ground is closed: no gap between a pavement and a
  wall, a step and its flight, a kerb and the road.

### What's seen beyond the edge

- **The 12 tiles round it,** loaded with it (`shooter.seen`, within 500 m): down the two avenues,
  over the river to the Parque da Ponte, the Altice Forum and São João da Ponte, and up to the
  Picoto. Their buildings, trees and streets as everywhere else on the map.
- **The skyline:** the hills 15 km round (the map's horizon), Bom Jesus and the Sameiro at their
  real size (decision 004: Party Kart draws them at twice theirs).
- **Life past the edge:** traffic on the avenues, people on the far pavements ("Later" in the
  roadmap).

## The survey

What the viewpoints (task 001, on foot unless marked) and the reference photos (task 008) cover,
street by street. A building counts for the street it's nearest; "with a photo" is a facade photo
in `refs/photos.json`.

| Street | Viewpoints | Buildings | With a photo |
|---|---|---|---|
| Rua do Fujacal | `fujacal-west`; `fujacal-start` (kart) | 40 | 19 |
| Travessa do Fujacal | `travessa-fujacal` | 99 | 35 |
| Alameda do Fujacal | `alameda-fujacal` | 37 | 13 |
| Praça dos Arsenalistas | none | 28 | 9 |
| Rua Rosália Castro | none | 5 | 1 |
| Rua Conselheiro Lobato | `lobato-pavement`, `lobato-crossing`, `liberdade`; `conselheiro-lobato` (kart) | 66 | 39 |
| Travessa Conselheiro Lobato | `travessa-lobato`, `lobato-east` | 9 | 6 |
| Rua Monsenhor Airosa | none | 36 | 31 |
| Rua Doutor José Vilaça (the block behind) | none | 21 | 6 |
| Rua de Santa Justa | none | 9 | 4 |
| Rua 1.º de Dezembro, the Ecovia, the Largo Santa Justa | none | 5 | 2 |
| **All** | **8 on foot, 2 from a kart** | **355** | **165** |

Two of the 165 are good enough for a texture; the rest are references. Besides the facades, the
photos taken in the area are the Largo Santa Justa's bridge (2) and six of the kinds of building:
the old town house, the blocks of the 1970s–1990s, and the corner block with shops.

**What's missing:**

- **Viewpoints on foot** on the Praça dos Arsenalistas, the Rua Monsenhor Airosa, the block behind
  it, the Rua de Santa Justa and the Ecovia: the edges of the area, where nothing is judged yet.
  Each from an open photo taken there (decision 009); the Rua Monsenhor Airosa has the most facade
  photos to choose from.
- **Facades:** 190 of the 355 buildings have no photo, most of them in the back rows, round the
  courtyards and facing the river, where no camera passed. Until one turns up online they're drawn
  from their kind's kit (task 017), coloured from the orthophoto and the photos round them.
- **Close-ups of this area:** its walls, gates, railings and steps, its pavements from above, its
  drains, its shop fronts. The close-ups task 008 found are from elsewhere in Braga.
- **What no online photo can show:** the courtyards, the school's grounds, the backs of the
  buildings. Nobody takes new photos (decision 018): these are gaps, listed in the tasks that meet
  them, until the owner or a friend chooses to fill one.

## Data only

braga-map gives the shooter the same data it gives Party Kart, and no ready-made meshes. What this
page asks for goes into the tiles as data (where each wall, step, lamp and tree is, at what height, of
what kind), and each game draws it. The shooter is played inside Party Kart's open world, on foot, in
first person (decision 055, task 073): it draws Fujacal with Party Kart's renderer and walks it on
Party Kart's ground, so there is no second engine to feed. The deathmatch is a round of it here
(decision 056, task 074): Party Kart stands a railing along the edge wherever it can be walked up to,
and barriers across its gates, from `world.shooter`'s edge and gates, only while a round is on.

## Privacy

Nothing in the area may single out a friend's house: no name, no marker, no texture from a photo of
it (decision 004). Party Kart's eggs stand on the houses (decision 014); whether the shooter has the
friends in it at all is its own decision, when it's made. The viewpoints and the reference photos
already keep 150 m from every waypoint and egg (decisions 009 and 018), and any added for this area
do too. The edge is drawn from the public streets alone.
