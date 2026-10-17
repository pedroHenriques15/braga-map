# Roadmap

How the map, and the cities games draw from it, get as close to the real Braga as they can
(decision 001). The phases are in order, and each item with a number has a task file in
[tasks/](tasks/README.md), which holds the detail and any questions for the owner. "Later"
holds ideas with no task yet. Settled decisions go to [DECISIONS.md](DECISIONS.md).

## Status

| Area | State, 2026-10-15 |
|---|---|
| The data | OpenStreetMap (streets, footways and paths, buildings, land, trees, crossings, lights, bus stops, landmarks), for 6.5 × 4.6 km (`tools/fetch.mjs`), taken as it is (decision 022). The world draws every street it has (task 006's audit, `tools/audit.mjs`): round the Volta dos Amigos all 202 km, but 8 squares mapped in parts (task 041); and in the open world's area its footways, paths, cycleways and flights of steps, each step at its height (task 050: 83 to 95% of each as itself, the rest giving way to the pavements and streets); and its walls, fences, railings, hedges and gates, measured by the LiDAR, which finds the walls, hedges and retaining walls it lacks (task 013, decision 033). Along the route and in Fujacal it lacks no street in use. The ground from DGT's 2025 LiDAR since task 009 (decision 008): every 2 m in the world near the route, in Fujacal and over the open world's area, every 10 m elsewhere; EU-DEM only for the horizon. Also fetched into `.cache/dgt/` and read by `tools/dgt.mjs`, not used yet: the LiDAR's surface model and point cloud, the 2025 orthophoto (25 cm) and the COS2025 land use ([SOURCES.md](SOURCES.md)). What the ground is, every 50 cm under the Volta dos Amigos' box, since task 016 (decision 034): asphalt, paving, setts, grass, bare soil, gravel, water or a roof, and the trees' crowns, from the LiDAR's echo and the orthophoto's near-infrared (`tools/cover.mjs`), with the 41,683 cars the LiDAR saw parked. Every building's height, roof and parts are the LiDAR's since task 010 (12,397 of OSM's 13,019 measured; the 622 it didn't see guessed), its roof's colour the orthophoto's. Since task 011 none is invented: the 7,251 buildings OSM lacks are the LiDAR's, outlined and measured from it (`tools/roofs.mjs`, `tools/footprints.mjs`), where 11,492 houses were invented to fill built-up frontage |
| The library | braga-map is a package for games: the world in 500 m tiles grouped in six sections (`index.js`, `world/`), and the tracks planned on it (`tracks/`). The shooter's area, Fujacal, loads like a section, with the tiles round it (task 015, decision 031, [SHOOTER-AREA.md](SHOOTER-AREA.md)). party-kart loads it, pinned to a tag (`v1.18.1` since task 046). Photo textures since task 007 (decision 030): KTX2 files compressed with Basis Universal's ETC1S, a file for each graphics level, in `world/textures/`, made by `tools/textures.mjs` from `refs/textures.json` and listed with their tile (`world.photos`), each with its credit: so far ten facades from the reference photos, and each kind of ground's photo (task 016, from Poly Haven). What the ground is since task 016, in `world/cover/` (`world.groundCover`): party-kart draws it everywhere it's classed, each kind in its photo (decision 034). Each building's facade since task 017 (decision 036, `refs/buildings.json`, [BUILDING-TYPES.md](BUILDING-TYPES.md)): its kind, one of Braga's eleven, with its colours, material, ground floor, balconies and shutters, as a session saw it in its photos (378 of the 690 looked for) or guessed from those seen; the shops' signs; and the ten photo facades, drawn for everyone in their building's colour |
| The kart race's city | Real-width streets, the race's at their real widths too (task 037, decision 029), granite kerbs, calçada, lane lines, zebra crossings, traffic lights and bus stops from OSM, buildings at their place with their measured heights, roofs and roof colours (tasks 010 and 011), each one's facade its kind's in its own colours, with balconies and the shops' signs (task 017), streets crossing on two levels with their decks and tunnels' mouths (task 012), trees, the Rio Este and its bridges, the hills 15 km round, Bom Jesus and the Sameiro (twice their size), the Picoto's cross, the Estádio 1.º de Maio, the Tourigalo as it is (task 029: the black bull with a rooster's head, on its lawn), Makro and the Altice Forum's signs. The ground as it is (task 009): the streets tip sideways, the pavements meet the ground, retaining walls where it's higher, buildings stepped on their slopes. The race the way the traffic goes (task 027, decision 010): one-way streets the right way, no banned turns, 10.1 km, on the map's streets but for one jump: over the Rio Este into a waypoint's dead end, from a ramp of planks on rubble the city's road works seem to have left, up only in a race (task 039, decision 027). The first four-point plan (skyline, street level, real widths, landmarks) was done on 2026-10-13: "Braga as it is", braga-map `017bdd4` and party-kart `1d7a921`. The friends drive it, each in a car that's a joke about them, and each one's easter egg stands on their house (tasks 028 and 030, decision 014) |
| The sound | Synthesized, through one mix since task 023: buses for the engines, the effects, the jingles and the ambience, into a limiter; the countdown, checkpoints, laps and finish one family of jingles; others' items, hits and the eggs heard from where they are. Judged by ear on two recorded takes, party-kart's `scripts/listen.mjs`, the baseline `2026-10-14-baseline`. Every kart's engine a race car's V8 through six gears, the nearest three others' heard from where they are with their Doppler shift, and your tyres and the wind (024, the owner's choice of engine after hearing a recording and a two-stroke, decision 016). Braga round the track (025): traffic, the town's hum, birds in the parks and insects in the woods, by what's within 150 m, the Rio Este, the bells, the buses and the stadium's crowd, from eight CC0 recordings, 10 dB under the engines |
| The open world | Decided on 2026-10-14 (decision 019): Party Kart opens driving in Braga, anywhere in the Volta dos Amigos' area, every street at its real width with its junctions, kerbs, pavements, bridges and tunnels; the race is a game mode in it, at the streets' real widths. Every street in the area is a surface in the tiles since task 033 (`world.streets`): its carriageway at its real width, joined at junctions with their kerbs rounded, roundabouts' islands, central reservations, pavements, kerbs dropped at the crossings, and the markings OSM gives, at their levels on bridges and in tunnels, a deck at the LiDAR's height where it saw one (task 047, decision 028). The area has its edge since task 032 (decision 020): 3.5 km² round the loop and the Picoto's top since task 039 took the loop by Ponte Pedrinha (3.1 before), worked out from the streets (`tools/open.mjs`), with 122 gates where its streets leave it for a game's barriers, and the ground every 2 m under it. party-kart's karts can drive on them since task 034 (decision 021): the world's ground, the land, the streets at their levels and what stands on them, in its simulation and tests. party-kart draws them since task 035 (decision 024): every street in the area at its real width, on the ground the karts drive on, with its kerbs, pavements, islands, markings, lamps, traffic lights, decks and tunnels, buildings cut at the kerb, and road-works barriers at the gates; plates and bus stops along the route only (every street's are task 042's). The game opens driving on them since task 036, live since 2026-10-15 (decision 026): anywhere in the area, on a keyboard or a touch screen, friends joining from a link or a code, the minimap, the city's sound everywhere; the race from its menu, on the route's own streets at their real widths since task 037 (decision 029): walled at their kerbs, a row of barriers across every side street it passes and between a road's two carriageways where they're drawn as one, the ramp into the dead end put out with them, and everyone back where they were when it's over |
| **In flight** | 054, the flying camera, is done (2026-10-17): in party-kart's `main` (`5abc39b`), pinned to braga-map 1.18.1 with 048, 017 and 046, none of them deployed yet: the next deploy ships the four together. Before them, the party-kart session listed here since task 009, on Braga's own pavement pattern and a pale patch near São João da Ponte, landed no commit (checked 2026-10-15): the calçada drawn is still the 2.5 m tile of white and pale grey setts, Lisbon's look. Braga's pattern is task 018's. The pale patch was never described, and isn't checked: the ground's colour, which task 016 has drawn anew since (2026-10-16) from what the ground is |
| Realism, measured | 29 viewpoints, each set where a real photo was taken (task 001, `refs/viewpoints.json`, decision 009): along the Volta dos Amigos, on foot in Fujacal, and of Bom Jesus and the Sameiro. Shot in the game at High and Low by party-kart's `scripts/shots.mjs` (task 002, decision 011), the same every time, beside their photos: the baseline round is `2026-10-13-baseline`, the second `2026-10-14-friends` ("Os amigos", tasks 028–030), the third `2026-10-15-task035` ("Todas as ruas", every street drawn and tasks 010–012's buildings and bridges), the fourth `2026-10-15-mundo-aberto` ("Mundo aberto", free roam's streets without the race's barriers, and tasks 040 and 043's decks' ends), the fifth `2026-10-15-after050` ("Caminhos e escadas", task 050's footways, cycleways and steps), the sixth `2026-10-16-after013` ("Muros e sebes", task 013's walls, fences, hedges and gates), the seventh `2026-10-16-after016` ("O chão", task 016's ground, on top of 013's walls), the eighth `2026-10-16-after048` ("Sem frinchas", task 048's streets without slivers), the ninth `2026-10-16-after017` ("Fachadas", task 017's facades), and the tenth, `2026-10-16-after046` ("Entre as pontes", task 046's corners stopped at the decks' and tunnels' ends), is the one open for marks. Rated on the scorecard "Braga real" (task 003, decision 012, https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs) by the owner: the baseline averages 2.6 of 5, "Os amigos" 2.9, "Todas as ruas" 3.7; and since task 013 by Claude, in a document of its own and on a harder scale: "Muros e sebes" 2.45, "O chão" 2.48, whose marks the owner took for task 016, "Sem frinchas" 2.48, "Fachadas" 2.48 (the buildings nearer their photos in about twenty places, no mark moved) and "Entre as pontes" 2.48 (no shot changed). The budget (task 004, decision 013): today's city, rounded up, in party-kart's `docs/architecture.md`; `?stats` measures a phone. A guide, not a limit (decision 017): realism first, and the games move to a stack that scales, or the owner's homelab, when they outgrow it. The reference photos (task 008, `refs/photos.json`, decision 018): 424 found online, from Mapillary and Commons, for the facades in the shooter's area and those a local knows along the route, the landmarks, bridges, roundabouts, kinds of building and wall, and close-ups; 26 good enough for a texture; the gaps listed in the task, about half the shooter's area's buildings among them |

## Now · The open world

Party Kart becomes an open world over the Volta dos Amigos' area, and the race a game mode in it
(decision 019, 2026-10-14). It goes first: the tasks after it build on the streets it makes. It's
done end to end on Fujacal first (its streets as surfaces, drawn and driven on), then over the
whole area. Free roam went live with task 036 before the race moved onto the streets (decision
026, 2026-10-15), and the race followed with 037 (decision 029).

- **038** The city streamed tile by tile, when the area grows.
- **042** Every street's name and every bus stop in the tiles, and their plates and stops drawn
  on every street in the area (035 draws the route's).
- **045** The ground under a street beside a wall, not the wall's top: four narrow tunnels'
  mouths and the Avenida João XXI over its junction (found by 043), and the two mouths under the
  Rotunda Santos da Cunha (found by 047).

## Phase 1 · See it: references, the scorecard and the budget

Before changing the city, know what the real one looks like, how close the game is, and how much
a phone can draw. Everything after this is checked against it.

Done: the viewpoints (001), the shots (002), the scorecard (003), the budget (004), the sources
(005), the street audit (006), the reference photos (008), the photo textures' pipeline (007,
decision 030), and two viewpoints aimed as their photos look, not as Mapillary has them (055:
`monte-da-forca` and `estadio`, decision 009).

## Phase 2 · The shape: the ground, the streets and the buildings where they really are

Done: the buildings' heights and roofs (010), the buildings the map lacks (011), the bridges and
tunnels (012), the shooter's area (015, decision 031): its edge, its section `fujacal`, and what
walking distance needs there, in [SHOOTER-AREA.md](SHOOTER-AREA.md); the footways, paths,
cycleways and steps, karts up and down them (050, decision 032); and the walls, fences, railings,
hedges and gates, the map's measured and those the LiDAR finds, each a wall to a kart (013, decision
033).

- **051** A flight of steps meets the street, the path or the land at its foot and its top: 51 of
  236 stand more than a kart's step over what's at their foot (found by 050).
- **052** The streets end at their walls: a pavement stops at a wall, and a carriageway the map's
  wall stands in is brought back to it (found by 013; after 026).
- **014** Roundabouts as they are: their islands and what stands in them.
- **026** Every street on its real carriageway: its line where the street's middle is, at its
  width, measured from the LiDAR.
- **041** The squares OpenStreetMap maps in parts, the Praça da República among them, drawn as
  squares (found by 006's audit).
- **049** The stadium's bowl stops short of the street beside it, 1.2 m under the LiDAR there
  (party-kart, found by 037).

## Phase 3 · Surfaces and colours

Done: the ground as it is, every 50 cm, from the LiDAR's echo and the orthophoto's near-infrared,
each kind in its own photo and the place's colour (016, decision 034); the facades, each building
its kind's in its own colours, as a session saw it in its photos or guessed from those seen (017,
decision 036).

- **018** Road markings and pavements as they are: Portugal's lines, Braga's pavements.
- **044** Pavements level from the kerb, not draped over the ground's bumps (found by 035's
  round).
- **019** Trees: their species, their places and their real size.

## Phase 4 · Street furniture, landmarks and light

- **020** Street furniture where it stands: lamps, signs, bins, benches, shelters, parked cars.
- **021** The landmarks along the route, built from their photos, São João da Ponte first: its
  chapel and bridge, the Altice Forum, the Estádio 1.º de Maio and the Picoto's top (its table
  checked against today's race on 2026-10-16).
- **056** The route's chapels and wayside shrines, which aren't among the 32 (found by 021).
- **022** Braga's light: the real sun, the sky and the haze, and its weather.
- **053** Last, after every task open on 2026-10-16 but 038: every task's notes read for what they
  left to improve, each thing still worth doing drafted as a task.

## Alongside · The sound

The owner found the game's audio truly horrible (2026-10-13): the engine, the beeps, the
clipping and the silence round you. Tasks 023, 024 and 025 answered it on 2026-10-14: the mix, a
race car's engine for every kart, and Braga round the track. More of Braga's sound is in "Later".

## How the work can run in parallel

Phase 1 is done (007 the last of it, 2026-10-15), and the open world is live: 032 to 037, 039,
040, 043, 047 and 050 are done, the race on the streets at their real widths (037, decision 029).
Every question in the tasks is answered: 044's on 2026-10-16 (the pavements' heights are
braga-map's, level from the kerb at 2% across at most). Each task is checked on the scorecard when
it lands.

The order, set with the owner on 2026-10-16: two streams side by side, as they touch different
files, and in each the foundations first.

- **Stream 1, the streets' shape, one task at a time.** Each changes `tools/streets.mjs`,
  `lines.mjs` or `world.mjs`, or party-kart's `streets.ts` and `ground.ts`, and ends with a tag
  party-kart is pinned to.
  1. **013** walls, fences and hedges: done (decision 033).
  2. **048** slivers: done (decision 035).
  3. **046** a junction's corner at a deck: done, braga-map 1.18.1.
  4. **026** every street on its real carriageway (high since 2026-10-16). What's measured against
     a carriageway comes after it: 045's ground, 044's kerbs, 051's feet, 014's rings, 018's
     markings, 042's corners. Half of `bom-jesus`'s fall in "Todas as ruas" is its (the camera on
     the map's pavement). Rewritten for every street on 2026-10-16, after 016, whose LiDAR echo
     tells the road from the pavement.
  5. **052** the streets end at their walls (found by 013): the carriageways' edges and the
     pavements' backs where they stop at a wall, before 045 holds the ground under them and 044
     gives them heights.
  6. **045** the ground under a street beside a wall: held to where the carriageway now is; 044's
     kerbs stand on it.
  7. **044** pavements level from the kerb.
  8. **051** steps meet what they lead to: a flight's foot at the kerb 044 sets.
  9. **014** roundabouts and **041** squares, either, any time after 026.
- **Stream 2, the look.** The high ones, on 007's photo textures' pipeline, party-kart's
  `city.ts` and `refs/`.
  1. **016** the ground from the aerial photos: done (decision 034). 018's parking bays, 019's
     grass and 020's parked cars come from it.
  2. **017** facades: done (decision 036), braga-map 1.18.0 with 048's streets.
  3. **021** landmarks.
  - **055** the Monte da Forca's camera: done, with `estadio`'s; the next round shoots them so.
- **054** the flying camera: done (2026-10-17), in party-kart's `main` (`5abc39b`) with 048, 017
  and 046 (braga-map 1.18.1), none of them deployed: party-kart's next deploy ships them together.
  A phone's frame rate from the air isn't measured yet.
- **When both are done:** **018** markings and pavements (on 026's carriageways, 044's pavements
  and 016's parking; its "What" also describes the track before 033); **019** trees (016's grass,
  013's hedges); **042** names and stops, then **020** furniture (013's gates, 016's parked cars,
  018's bays). **022** the light touches party-kart's `look.ts` alone, so it can go whenever a
  party-kart session is free, in a round of its own, as it changes every viewpoint.
- **Last:** **049** the stadium's bowl, whenever party-kart's `land.ts` is free; then **053**, every
  task's notes read for what they left, after every task open on 2026-10-16 but 038. **038** when
  the area grows, and not before: load time doesn't matter to the owner (2026-10-16), so 016's
  bigger download (2.3 to 7.0 MB on High) doesn't bring it forward.
- **Two sessions at once:** `npm run world` rewrites every tile, so a second session in braga-map
  works in a git worktree of its own, with `.cache/` linked to the main checkout's (a junction on
  Windows: it's 7.5 GB and not in git), and the two take turns at merging and tagging. In
  party-kart, never two sessions on the same file.
- **The shooter's area** goes first in every task of Phases 2–4, to the bar
  [SHOOTER-AREA.md](SHOOTER-AREA.md) sets (015, decision 031).
- **The sound** is done (023–025); what's next of it is in "Later".

## Later

- **The old town's landmarks** (the Sé, the Arco da Porta Nova, the Praça da República, the
  Theatro Circo, the Torre de Menagem; and those task 021 dropped as the race doesn't see them: the
  Museu D. Diogo de Sousa, the Palácio do Raio, the Fonte do Ídolo, the Cividade, the Capela dos
  Coimbras, the Congregados), and the Igreja de Lamaçães, when a track or the shooter goes there. The
  cartoon models in `../party-kart/src/render/landmarks.ts` and `braga.ts` are for the first
  track, not to scale.
- **Life in the streets:** the TUB's buses on their routes, traffic, people on the pavements
  and at the cafés' terraces.
- **Night:** the street lamps, the lit windows, Bom Jesus floodlit on the hill.
- **The seasons:** the plane trees bare in winter, the jacarandas in flower in June.
- **More of Braga's sound** (beyond task 025): the cafés' terraces, once the map fetches cafés,
  and the old town's, the Sé's bells up close.
- **The rest of the map** at the route's level of detail, as more tracks and games use it, and
  the open world grown over it a section at a time (decision 019).
- **Inside the buildings,** if the shooter needs it: shops and cafés on the ground floor first.
- **The Rio Este** with its real banks, walls and weirs, and the streams the map fetches but
  doesn't draw.
- **The railway** with its rails, sleepers and catenary, the station, and a train.
