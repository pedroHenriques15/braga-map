---
status: done
priority: high
kind: code
repo: braga-map, party-kart
created: 2026-10-20
depends-on: [075]
roadmap: Games · More tracks and the shooter
---

# 079 · Three small arenas, and the buildings' insides in them

## Why

The whole shooter's area, 21.5 ha, is far too big for a deathmatch of a few players (the owner,
2026-10-20): three bots in it met so seldom that a round was mostly walking. The owner's answers: two
or three arenas, very small, about 80 m across, the whole area no longer played; and the buildings in
them very simple inside, a ground floor in most, and in one or two of the most strategic and tallest
every floor connected by stairs, up to the roof.

## What

- **The arenas, in braga-map:** three rings drawn by hand over the map (`tools/arenas.mjs`), each
  about 80 m across, along the backs of the buildings round it where it can and across a street or a
  path where it must; `world.mjs` works out their gates as the shooter's area's (`gatesOf`), and the
  map gives them as `world.arenas` and `world.inArena(id, x, z)` (`index.js`, `index.d.ts`). The map
  page draws them.
- **The round in an arena, in party-kart:** "Arena" in the Tiroteio's settings; the round's field
  made for that arena (its edge, 8 spawns outdoors, its railings and barriers, and the bots' paths).
- **The insides, in party-kart** (`src/world/interiors.ts`, made up: the map knows nothing of
  them): each building wholly in an arena whose ground floor a door can open onto the street at its
  level gets one room on its ground floor, its doors and windows open where its facade draws them;
  in Topo do Fujacal and Doutor José Vilaça the tallest flat-roofed block near the middle gets a
  stairwell from its ground floor to its roof, each storey one open floor, its windows open, a
  parapet round its roof and a hut over the stairs. The walls, floors, looks and shots take them
  (`ground.ts`, `sight.ts`), the city cuts the openings through the facades and draws the inside
  (`city.ts`, `render/interiors.ts`), and the bots walk through the doors and up the stairs
  (`paths.ts`, several floors in one place; `footbot.ts`).

## Done when

- [x] Three arenas about 80 m across, each with its gates, in the map, tested.
  *(braga-map's `test/shooter.test.js`: 66 × 108, 77 × 83 and 87 × 62 m; 8, 9 and 7 gates, each on its
  edge)*
- [x] The host picks the arena; a round is played in it, its edge up, eight spawns outdoors, every
  spawn reaching every other. *(party-kart's `test/interiors.test.ts`; played in Playwright)*
- [x] Most buildings in each arena have a ground floor to walk into, through a door, not a window; two
  towers have every floor and a roof, climbed by the stairs. *(24 rooms of 30 buildings wholly in the
  arenas; the tests walk through every door both ways, at every ground-floor window without getting
  in, and up each tower to its roof and back)*
- [x] A look and a shot go through a window, not the wall beside it. *(148 windows)*
- [x] The bots use them, and none is stuck or shoots through a wall. *(`test/footbot.test.ts`)*
- [x] `npm test` here, and `npm test` and `npm run check` in party-kart.

## Out of scope

- Furniture, doors that open and shut, glass; the insides of buildings outside the arenas.
- The whole shooter's area as a round's place (the owner: arenas only, for now).

## Notes

Drafted and done 2026-10-20 at the owner's word ("Do all of this in this session"), with their
answers: about 80 m across; three arenas, the ones proposed; every floor and the roof in the towers;
commit, tag, push and deploy.

### The arenas

| | Where | Across | Gates | Rooms | Tower |
|---|---|---|---|---|---|
| Topo do Fujacal (`topo`) | The Rua do Fujacal by the race's start, round the block of flats alone in its loop of street, the houses south-west of it, the Rua Conselheiro Lobato below | 66 × 108 m | 8 | 3 of 6 buildings wholly in (the three small ones in the loop are cut back at the kerb: shut) | The block in the loop, 15 m: 3 floors over its ground floor and its roof; 7 of the 8 spawns in sight from its parapet |
| Doutor José Vilaça (`vilaca`) | The end of the driveway, the flats' courtyard round it, the houses on the Rua Monsenhor Airosa and that street | 77 × 83 m | 9 | 12 of 13 | The flats over the courtyard, 16 m: 4 floors and the roof |
| Santa Justa (`santa-justa`) | The Rua de Santa Justa between its flats and the long block by the river, down to the Ecovia | 87 × 62 m | 7 | 9 of 11 | none |

Each field (party-kart's `field`) is made in 50–115 ms the first time a round starts in it, its bots'
paths in it: 933 to 1,823 points.

### The insides

- **A room:** the building's outline, its walls' inside faces 20 cm in. The floor at its best door's
  sill (a street's first), within 0.55 m under the building's foot to 1.05 m over it; its doors, two at
  most, in a wall's middle bay where the facade draws a door (a metre wide at least), where the ground
  outside is clear and within a step of the floor; its windows where the facade draws them on its
  ground floor (its kind's, or its shops', glazed front or arcade), but where the ground outside stands
  over their sills, or a wall or another building stands right in front of them. A wall another
  building stands against has none. Under a door no sill: a walker meets nothing. The ground takes it
  as the building's outline walls with gaps (each a stretch at its middle, its faces 10 cm either
  side), its floor over the land (`roomFloor`), and a look as its floor and ceiling (`roomSolid`);
  the buildings' roof band (a look's, 1.5 m deep) isn't over a room.
- **A tower:** every storey a floor (the facade's storeys), the roof one too; a stairwell 2.35 m wide
  of two flights a storey with a landing at the turn (risers at most 18 cm, goings 28 cm), walled in
  but at each floor's end of it, where a floor opens onto it; its upper storeys' windows open in every
  bay; a parapet 1.05 m round its roof, and a hut over the stairs with its door. The stairwell goes
  where it fits in the room, as far from its middle as it can, with room to step in beside its foot
  and 1.3 m of roof outside the hut's door.
- **Drawn:** the facade's walls with holes for the openings (the same batches, no draw call more), the
  tower's roof open over its stairs; the inside in one mesh (plaster, concrete, the floors), one draw
  call and 5,200 triangles. 24 rooms, 31 doors, 148 windows.
- **The bots:** the paths have several floors in one place (a tower's floors, and the ground's), and
  ways joined by hand where no 2 m lattice lines up: through each door (a point outside and one in),
  and up each flight (its foot, its landing's two ends, the next floor; the roof outside the hut).
  Coming back, a bot makes for a tower's floor or its roof now and then (the sniper's rifle, 7 times in
  10), and holds there 8 to 16 s, looking round.

### Two fixes found on the way, in party-kart

- **Spawns only where the arena's main ground is:** a spawn in a pocket no other spawn reached (in
  Santa Justa, 20 of 56 pairs) now can't be: the field keeps the candidates the paths round its middle
  reach.
- **The bots' hunch** (075's, after 8 s of nothing) makes for 8 to 20 m from someone, not 30 to 60: an
  arena is 80 m across.

### Tested and played (2026-10-20)

- party-kart's `test/interiors.test.ts` (5): the arenas' sizes and spawns, every spawn reaching every
  other; the rooms (most buildings, two towers); 31 doors walked through both ways and 51 windows walked
  at and not through; each tower climbed to its roof and come down again; 148 windows looked through,
  not the walls beside them; 7 of Topo's 8 spawns in sight from its tower's parapet.
- `test/fight.test.ts`: the round in Topo do Fujacal, the edges of the three arenas (62 runs at their
  gates and railings, none out). `test/footbot.test.ts`: the paths of each arena; three bots alone 5
  minutes in each (34 to 43 kills, none fired at nobody in sight, none through a wall, none stuck;
  0.6 to 3.4 bot-minutes of 15 indoors, up to 0.8 up a tower); seven bots cost 0.09 ms a frame.
  18 rounds of 5 minutes (6 in each arena, the three levels): 601 kills, all three bots scored in every
  round, a bot put back on its path once in 270 bot-minutes.
- Played (Playwright, headless Chromium on the desktop's GPU): alone in Topo do Fujacal, through the
  tower's door, up its stairs, its floors with their windows onto the street, its roof and parapet;
  alone with three bots in Doutor José Vilaça (60 fps, no errors); a host and a guest with two bots in
  Topo do Fujacal (the bots' shots reaching the guest, the guest's hurting a bot, the bots fighting
  each other).

**Not verified:** the owner playing; a phone (its frame rate with the insides and the bots); the look
of the insides by daylight from every side (they're plain plaster, lit as outside is).

### Finished (2026-10-20)

The viewpoints near the arenas (`lobato-pavement`, `capela-santa-justa`) shot again in party-kart's
`shots/2026-10-20-after079/`: nothing out of place; not posted as a round, as no place's look changed
enough to mark. braga-map 1.31.0 (the arenas), party-kart pinned to it and deployed with 074 and 075.
