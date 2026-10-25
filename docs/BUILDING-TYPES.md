# Braga's kinds of building

What the buildings along the Volta dos Amigos and in the shooter's area are, kind by kind, so a
game can draw each one in its real proportions and colours (task 017). Each building's own kind,
colour and face is in `refs/buildings.json`, from a session looking at its photos; the rest of the
map's are guessed from what OpenStreetMap and the LiDAR say (below). The lists are
`tools/facades.mjs`, which the world and the tests read.

The photos are the reference photos (`refs/photos.json`, task 008: `node tools/refs.mjs` fetches
them into `.cache/refs/photos/`), by their id.

## The kinds

**`old-house`, the old house** (before about 1940). Two or three tall storeys, terraced along the
street or standing in its garden behind a wall. Tall windows, about 1 m wide and twice as high, the
upper ones doors onto iron balconies (`french`, or one iron balcony along the front), every 2.5 to
3 m, each in a frame of dressed granite; granite at the corners, along the base and as a cornice
under the eaves. Rendered and painted (white, cream, ochre, pale pink, pale yellow), or tiled in
azulejos, patterned and glazed (blue and white, green, yellow). Wooden doors and windows. A hipped or
gabled roof of terracotta tiles. Photos: `type-old-town-house-1`, `-2` and `-3`; the tiled front,
`type-tiled-front-2` (close up).

**`house`, the house** (1950s to today), detached, semi-detached or in a short terrace, in its garden
behind a low wall with a railing. One or two storeys, often over a garage half sunk into the slope.
Wide windows, about 1.4 by 1.2 m, with roller shutters in a box over each; a balcony or a terrace
with a railing over the door or the garage. Render in pale colours, white to grey, often a base or a
panel of granite, rough stone or tiles. A hipped roof of terracotta tiles. Photos:
`type-detached-house-1`, `-2` and `-3`.

**`block-1950s`, the block of the 1950s and 1960s.** Three to five storeys of flats, terraced along
the street. Windows about 1.3 m wide with roller shutters; projecting balconies with iron railings;
panels of mosaic (little glass tiles, pale blue or grey) under the windows or up the front, render
round them (cream, yellow); the ground floor shops or garages, often in a dark mosaic. A hipped roof
of tiles. Photo: `type-tiled-front-1`.

**`block-1970s-90s`, the block of the 1970s to the 1990s**, most of what's along the route and in
Fujacal. Four to eight storeys of flats over a ground floor of shops (`corner-block-with-shops`) or
garages, terraced along the street. Storeys of 2.8–2.9 m. Windows 1.2–1.6 m wide with roller
shutters (white, beige, grey or brown aluminium) in boxes over them; balconies: concrete slabs with
aluminium or iron railings, each its own or along the front, often glazed in (`enclosed`). The walls
in small ceramic tiles (beige, white, pink, brown, grey) or render (salmon, beige, yellow, grey); the
ground floor's pillars and walls in slabs of granite or stone. Often a top floor set back. A flat or
a hipped roof. Photos: `type-block-1970s-1990s-1`, `-2` and `-3`, `type-corner-block-with-shops-1`
and `-2`.

**`block-2000s`, the block of the 2000s and after.** Five to nine storeys; windows from floor to
ceiling, 2 m wide or more; balconies along the whole front with glass or steel railings; big panels or
stone on the walls (white, pale grey, beige), a dark base; a flat roof; a glazed ground floor of
shops. Photos: `type-block-2000s-1` and `-2`.

**`glass-office`, the glass office.** A curtain wall of glass (blue, green, dark) on a grid of
mullions 1.5 m apart, storeys of 3.5 m or more, a glazed ground floor. Photo: `type-glass-office-1`
(the Rua Doutor Egídio Guimarães' tower).

**`civic`, the school or public building.** Two to four storeys of 3.5 m, long bands of windows,
render (white, cream) or concrete, a flat roof; behind a fence. Photos: `type-civic-1` (a school),
`type-civic-2` (the Altice Forum).

**`church`, the church or chapel.** Dressed granite at its corners, round its doors and windows and
as a cornice, white render between; tall windows; a bell tower or a belfry on its gable. Photos:
`type-church-1` (São João da Ponte's chapel), `type-church-2` (the Igreja de Lamaçães).

**`commercial`, the shop or showroom of its own**: a supermarket, a retail park, a car dealer's, a
petrol station's shop. One or two tall storeys, mostly blank walls of panels or render, a glazed
front, signs. A flat roof.

**`warehouse`, the warehouse or workshop.** One tall storey, 4–8 m, of concrete blocks, render or
metal sheets; big doors; a row of small windows high up, or none. A pitched roof of sheets. Photos:
`type-warehouse-1` and `-2`.

**`annex`, the annex**: a garage, a shed or a store in a back yard or at the end of a garden. One low
storey, a plain wall, a garage door or a door, a small window at most.

The kinds that had no photo in task 008 have one from the buildings seen: the 1950s block,
`facade-lidar-x1101z475` (pale blue, projecting balconies over a café) and `facade-lidar-x237z752`;
the 1970s–1990s block in small tiles, `facade-way-440314425` and `facade-lidar-x1689z758`; the 2000s
block in brick, `facade-lidar-x1676z952`, and in granite slabs, `facade-way-163973717`; the shop of its
own, `facade-way-121590164` and `facade-way-146464170` (a retail park's front of metal sheets); the
annex, `facade-way-383778920` (a row of garages); the warehouse, `facade-way-982763825`; the house of
the 1960s, `facade-way-162945724`.

## The numbers

Each kind's storeys come from the buildings seen (2026-10-16): the LiDAR's eaves (task 010) over the
storeys counted in their photos, as eaves = ground floor + (storeys − 1) × storey + 0.6 m (a parapet
or a slab's edge), fitted by least squares where enough were counted, else the ground floor that a
storey from practice implies. The windows' sizes and spacing are read off the photos.

| Kind | Seen (sure) | Storey | Ground floor | From | Most often |
|---|---|---|---|---|---|
| `old-house` | 25 (14) | 4.0 m | 4.2 m | a storey of 4.0 for the ground floor of 4.2 its 13 imply; 4.5 m a storey all in | render (23 of 25): sand, white, beige, cream; no shutters (16); French balconies or none |
| `house` | 60 (22) | 3.0 m | 3.7 m | its 22 imply 3.5 m a storey over a ground floor of 2.9, or a ground floor of 3.8 under storeys of 2.9: a garage half sunk, a tall roof | render (52 of 60), white (28), cream; white shutters; a projecting balcony (17) |
| `block-1950s` | 49 (34) | 2.85 m | 4.8 m | 2.82 and 4.89 fitted on 33 (half its residuals under 0.65 m): a tall ground floor of shops | render (36), azulejos (7), small tiles (6): white, beige, cream, pale blue; shops (22) or homes (16); projecting balconies (29); white shutters |
| `block-1970s-90s` | 149 (73) | 2.9 m | 3.65 m | 2.94 and 3.64 fitted on 50 (half under 0.88 m) | render (97), small tiles (24): white, beige, cream, pale grey; shops (53), homes (22), garages (12); balconies projecting (54) or glazed in (25); white shutters (81) |
| `block-2000s` | 15 (6) | 3.0 m | 4.0 m | too few counted (4) | render, brick, stone slabs: white, grey, beige; shops (9) |
| `glass-office` | 1 | 3.6 m | 4.5 m | the Rua Doutor Egídio Guimarães' tower | |
| `civic` | 4 (1) | 3.5 m | 3.5 m | too few | white render |
| `church` | 1 | 6.0 m | 6.0 m | too few | white render |
| `commercial` | 24 (9) | 6.0 m | 6.0 m | one tall storey, 6.3 m a storey all in | white render, metal sheets, panels; glass (8) or blank (4) along the street |
| `warehouse` | 21 (9) | 6.0 m | 6.0 m | too few counted | grey render; blank along the street (14) |
| `annex` | 14 (6) | 2.8 m | 2.8 m | | grey and white render; blank (7) or garages (5) |

A building nobody saw is given its kind's colour, material, ground floor, base, balconies and
shutters as often as the buildings of its kind seen have each (`tools/facades.mjs`'s `guesser`), by a
hash of its name, so it's the same every time; OpenStreetMap's `building:colour` and
`building:material` where it has them, and shops on its ground floor where the map has a shop in it.
Its kind is OpenStreetMap's tag's where that says (a church, a school, a garage, a warehouse, a shop),
else its kind as the world has it (house, flats or a shop, from its footprint and its height); a block
of flats is one of the three blocks as often as those seen of about its storeys are each.

## How they were seen

`node tools/buildings.mjs` lists the buildings to look at: the 346 in the shooter's area, and the 344
more that a viewpoint sees (rays across its view against the buildings and the ground, 4 or more of a
256-wide grid). `node tools/buildings.mjs mark` outlines and numbers them on each photo, from where
Mapillary says its camera was. Each building was described in the photo that shows it best (its own,
else the one it takes most of), by a session looking at it; a building no photo shows at more than a
speck (under 0.05% of it), or that's hidden in every photo (behind trees, walls, other buildings), is
in `refs/buildings.json` without a kind and with why, and guessed. Then the buildings that take 1.5% or
more of a viewpoint's photo, which the scorecard judges, were checked against that photo, and changed
where it showed them otherwise (their notes say so). Many photos are tinted by a windscreen or taken at
dusk: a colour is judged against what's white nearby, and is the paint's, not the light's.

## What's said of each building

`refs/buildings.json`, each building by its name (`way/…`, `relation/…`, or `lidar/x…z…` for one
OpenStreetMap lacks, as `tools/buildings.mjs` names it):

| Field | What | Values |
|---|---|---|
| `type` | Its kind | above |
| `colour` | Its walls' main colour, above the ground floor | the colours below |
| `material` | What its walls are covered with | `render`, `tiles` (small plain ones), `mosaic` (little glass ones), `azulejo` (patterned, glazed), `granite`, `stone` (slabs), `brick`, `concrete`, `block`, `glass`, `metal`, `panels` |
| `floors` | Its storeys over the street, counted in the photo, where they can be | a number |
| `ground` | Its ground floor along the street | `housing`, `shops`, `garages`, `arcade`, `blank`, `glazed` |
| `base` | The ground floor's colour and material, where they're not the walls' | a colour, a material |
| `balconies` | | `none`, `french`, `projecting`, `continuous`, `enclosed`, `recessed` |
| `shutters` | The roller shutters' colour, or none | a colour, `none` |
| `seen` | The photo it was looked at in | a reference photo's id, or `viewpoint:<id>` |
| `notes` | What else the photo shows | |
| `layout` | Its street walls' doors and windows, where a photo shows the wall clearly enough (task 086, decision 080): each wall by its ends on the outline (`from`, `to`, left to right from the street), the photo it was read from, and each storey from the ground up, its openings left to right, or null where the photo doesn't show it | `[{ from, to, photo, storeys: [[[kind, at, width], …] \| null, …] }]`, a kind one of `window`, `door`, `garage`, `shop`, `balcony` (a balcony's door), `at` from the wall's left end in metres |
| `unread` | The street walls a session looked at and couldn't read, each with why | `[{ from, to, why }]` |

The colours, as they look in even daylight: white, off-white, cream, pale-yellow, yellow, ochre,
beige, sand, pale-pink, salmon, pink, terracotta, brick, brown, pale-grey, grey, dark-grey, blue-grey,
pale-blue, blue, navy, pale-green, green, dark-green, granite, dark-granite, black, glass-blue,
glass-green, glass-dark, teal (some 1970s tiles), and for signs red and orange. Their values are `tools/facades.mjs`'s
`COLOURS`. The photos' patches of plain wall can't set them: through the windscreens and at dusk the
walls said to be white measure (128, 154, 155) at the median, cyan and dark.

A field nobody could tell from the photo is null, and guessed for the building's kind. The kind is the
building's look (its form and its age), not its use: a villa that's now a clinic is a `house`.
