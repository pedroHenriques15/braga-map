# Roadmap

How the map, and the cities games draw from it, get as close to the real Braga as they can
(decision 001). The phases are in order, and each item with a number has a task file in
[tasks/](tasks/README.md), which holds the detail and any questions for the owner. "Later"
holds ideas with no task yet. Settled decisions go to [DECISIONS.md](DECISIONS.md).

## Status

| Area | State, 2026-10-15 |
|---|---|
| The data | OpenStreetMap (streets, footways and paths, buildings, land, trees, crossings, lights, bus stops, landmarks), for 6.5 × 4.6 km (`tools/fetch.mjs`), taken as it is (decision 022). The world draws every street it has (task 006's audit, `tools/audit.mjs`): round the Volta dos Amigos all 202 km, but 8 squares mapped in parts (task 041); and in the open world's area its footways, paths, cycleways and flights of steps, each step at its height (task 050: 83 to 95% of each as itself, the rest giving way to the pavements and streets); and its walls, fences, railings, hedges and gates, measured by the LiDAR, which finds the walls, hedges and retaining walls it lacks (task 013, decision 033). Along the route and in Fujacal it lacks no street in use. The ground from DGT's 2025 LiDAR since task 009 (decision 008): every 2 m in the world near the route, in Fujacal and over the open world's area, every 10 m elsewhere; EU-DEM only for the horizon. Also fetched into `.cache/dgt/` and read by `tools/dgt.mjs`: the LiDAR's surface model and point cloud, the 2025 orthophoto (25 cm) and the COS2025 land use ([SOURCES.md](SOURCES.md)). Every tree is the LiDAR's since task 019 (decision 043): 251,000 on the map, each where it stands, at its height, crown and foot, of its kind (OSM's, else its wood's in COS2025, else its shape's), where the woods and parks were filled with made-up trees. What the ground is, every 50 cm under the Volta dos Amigos' box, since task 016 (decision 034): asphalt, paving, setts, grass, bare soil, gravel, water or a roof, and the trees' crowns, from the LiDAR's echo and the orthophoto's near-infrared (`tools/cover.mjs`), with the 41,683 cars the LiDAR saw parked. Every building's height, roof and parts are the LiDAR's since task 010 (12,397 of OSM's 13,019 measured; the 622 it didn't see guessed), its roof's colour the orthophoto's. Since task 011 none is invented: the 7,251 buildings OSM lacks are the LiDAR's, outlined and measured from it (`tools/roofs.mjs`, `tools/footprints.mjs`), where 11,492 houses were invented to fill built-up frontage |
| The library | braga-map is a package for games: the world in 500 m tiles grouped in six sections (`index.js`, `world/`), and the tracks planned on it (`tracks/`). The shooter's area, Fujacal, loads like a section, with the tiles round it (task 015, decision 031, [SHOOTER-AREA.md](SHOOTER-AREA.md)). party-kart loads it, pinned to a tag (`v1.23.0` since task 019). Photo textures since task 007 (decision 030): KTX2 files compressed with Basis Universal's ETC1S, a file for each graphics level, in `world/textures/`, made by `tools/textures.mjs` from `refs/textures.json` and listed with their tile (`world.photos`), each with its credit: so far ten facades from the reference photos, and each kind of ground's photo (task 016, from Poly Haven). What the ground is since task 016, in `world/cover/` (`world.groundCover`): party-kart draws it everywhere it's classed, each kind in its photo (decision 034). Each building's facade since task 017 (decision 036, `refs/buildings.json`, [BUILDING-TYPES.md](BUILDING-TYPES.md)): its kind, one of Braga's eleven, with its colours, material, ground floor, balconies and shutters, as a session saw it in its photos (378 of the 690 looked for) or guessed from those seen; the shops' signs; and the ten photo facades, drawn for everyone in their building's colour |
| The kart race's city | Real-width streets, the race's at their real widths too (task 037, decision 029), granite kerbs, calçada, lane lines, zebra crossings, traffic lights and bus stops from OSM, buildings at their place with their measured heights, roofs and roof colours (tasks 010 and 011), each one's facade its kind's in its own colours, with balconies and the shops' signs (task 017), streets crossing on two levels with their decks and tunnels' mouths (task 012), every tree where it stands at its height and crown, of its kind, in its bark and leaves (task 019, decision 043), and near the viewpoints of the species its photo shows (task 061, decision 051), the Rio Este and its bridges, the hills 15 km round, Bom Jesus and the Sameiro (twice their size), the Tourigalo as it is (task 029: the black bull with a rooster's head, on its lawn), Makro's sign; and since task 021 (decision 038) the landmarks the race sees, at their real size: São João da Ponte's chapel in its park and the Avenida da Liberdade's granite arch over the Este, the Estádio 1.º de Maio's stands as the LiDAR measured them with its outer wall and four floodlights, the Picoto's white steel cross and the miradouro's boardwalk, and the Altice Forum's α. Every street in the open world's area where the LiDAR measured it since task 026 (decision 039): the map's ways moved onto the middle of their carriageways, kerb to kerb, at their measured widths, but the jump's. The ground as it is (task 009): the streets tip sideways, the pavements meet the ground, retaining walls where it's higher, buildings stepped on their slopes. The race the way the traffic goes (task 027, decision 010): one-way streets the right way, no banned turns, 10.1 km, on the map's streets but for one jump: over the Rio Este into a waypoint's dead end, from a ramp of planks on rubble the city's road works seem to have left, up only in a race (task 039, decision 027). The first four-point plan (skyline, street level, real widths, landmarks) was done on 2026-10-13: "Braga as it is", braga-map `017bdd4` and party-kart `1d7a921`. The friends drive it, each in a car that's a joke about them, and each one's easter egg stands on their house (tasks 028 and 030, decision 014) |
| The sound | Synthesized, through one mix since task 023: buses for the engines, the effects, the jingles and the ambience, into a limiter; the countdown, checkpoints, laps and finish one family of jingles; others' items, hits and the eggs heard from where they are. Judged by ear on two recorded takes, party-kart's `scripts/listen.mjs`, the baseline `2026-10-14-baseline`. Every kart's engine a race car's V8 through six gears, the nearest three others' heard from where they are with their Doppler shift, and your tyres and the wind (024, the owner's choice of engine after hearing a recording and a two-stroke, decision 016). Braga round the track (025): traffic, the town's hum, birds in the parks and insects in the woods, by what's within 150 m, the Rio Este, the bells, the buses and the stadium's crowd, from eight CC0 recordings, 10 dB under the engines |
| The open world | Decided on 2026-10-14 (decision 019): Party Kart opens driving in Braga, anywhere in the Volta dos Amigos' area, every street at its real width with its junctions, kerbs, pavements, bridges and tunnels; the race is a game mode in it, at the streets' real widths. Every street in the area is a surface in the tiles since task 033 (`world.streets`): its carriageway at its real width, joined at junctions with their kerbs rounded, roundabouts' islands (since task 014 each ring and island where the LiDAR measured them, the island in what the ground is, the statues the map has in them, and a give-way line and triangles at every entry, decision 050), central reservations, pavements, kerbs dropped at the crossings, and the markings OSM gives, at their levels on bridges and in tunnels, a deck at the LiDAR's height where it saw one (task 047, decision 028). The area has its edge since task 032 (decision 020): 3.5 km² round the loop and the Picoto's top since task 039 took the loop by Ponte Pedrinha (3.1 before), worked out from the streets (`tools/open.mjs`), with 122 gates where its streets leave it for a game's barriers, and the ground every 2 m under it. party-kart's karts can drive on them since task 034 (decision 021): the world's ground, the land, the streets at their levels and what stands on them, in its simulation and tests. party-kart draws them since task 035 (decision 024): every street in the area at its real width, on the ground the karts drive on, with its kerbs, pavements, islands, markings, lamps, traffic lights, decks and tunnels, buildings cut at the kerb, and road-works barriers at the gates; since task 042 (decision 048) a plate at every corner where a named street meets another, on the corner building's wall or on a post, and every bus stop in the area. The game opens driving on them since task 036, live since 2026-10-15 (decision 026): anywhere in the area, on a keyboard or a touch screen, friends joining from a link or a code, the minimap, the city's sound everywhere; the race from its menu, on the route's own streets at their real widths since task 037 (decision 029): walled at their kerbs, a row of barriers across every side street it passes and between a road's two carriageways where they're drawn as one, the ramp into the dead end put out with them, and everyone back where they were when it's over |
| **In flight** | Live since 2026-10-19: party-kart `a611fba` on braga-map 1.29.0 (`index-BRZTQ8-P.js`), peer prefix `pk38`: 2026-10-18's night build (`6747516`) with 069 and 070's loading screen. It adds to 048, 017, 046, 054 (the flying camera) and 022 (the light): 021, the landmarks; 026, every street on its real carriageway; 056, the route's chapels and shrines; 057, the jump on its real street (decision 042); 049, the stadium's bowl kept off the streets; 019, every tree the LiDAR sees, of its kind, in its bark and leaves (decision 043); 060, the karts flying the jump's flight and landing short of the street's turn (decision 044); 052, the streets ending at their walls (decision 046); 063, each tree's crown where its leaves are and its trunk off the paths (decision 047); 042, every street's name, every bus stop and the streets' name plates at their corners (decision 048); 045, the ground under every street its own, held to its carriageway, not the wall beside it (decision 049), whose race hops 0.4 to 0.7 s on the Avenida João XXI's upper lane, beside the tunnels' west mouth (task 066); 014, the roundabouts as they are (decision 050): each ring and island where the LiDAR measured them, the island in what the ground is, its lawn green as in March, São João Baptista in São João da Ponte's and the Comendador Santos da Cunha in his, the give-way line and triangles at every entry; and 061, the trees near seven viewpoints the species their photos show, the avenues' rows they show and the Parque da Ponte's limes, the plane, the lime and the birch drawn each as its own (decision 051). 058, every camera on the surface its photo was taken from (decision 041), is in `refs/` alone, and 062, the scorecard's rounds in a few sheets each (decision 045), in `tools/round.mjs` and the page. The peer prefix moved from `pk37` with 014, so a tab still on 1.26.0's build shares no room with this one until it's reloaded. Checked live: a fresh load opens the game in 11 s with nothing failing, and the autopilot's race with three bots over the jump, no page error. Not checked: a race with friends in a room, a human taking the jump, a phone's frame rate. A page from before a deploy, its script gone, no longer spins for ever (069, found when a friend couldn't get in after 2026-10-18's evening deploy): the loading screen says the game couldn't be downloaded, naming the file, and offers the reload; past 90 s it says it's taking long. The game is one script with nothing preloaded, as WebKit remembers a failed preload until the browser closes (070, decision 052). Checked live: a fresh load opens in 12 s, and with the script failing the message shows in 0.4 s. Next: 044 (stream 1). Before them, the party-kart session listed here since task 009, on Braga's own pavement pattern and a pale patch near São João da Ponte, landed no commit (checked 2026-10-15): the calçada drawn is still the 2.5 m tile of white and pale grey setts, Lisbon's look. Braga's pattern is task 018's. The pale patch was never described, and isn't checked: the ground's colour, which task 016 has drawn anew since (2026-10-16) from what the ground is |
| Realism, measured | 33 viewpoints (`joao-xxi` dropped by task 052, kept under `dropped` for its photo and its rounds), each set where a real photo was taken (task 001, `refs/viewpoints.json`, decision 009): along the Volta dos Amigos, on foot in Fujacal, of Bom Jesus and the Sameiro, since task 021 of São João da Ponte's chapel, the Altice Forum and the Picoto's top, and since task 056 of the chapels of Santa Justa and Santo Adrião. Shot in the game at High and Low by party-kart's `scripts/shots.mjs` (task 002, decision 011), the same every time, beside their photos: the baseline round is `2026-10-13-baseline`, the second `2026-10-14-friends` ("Os amigos", tasks 028–030), the third `2026-10-15-task035` ("Todas as ruas", every street drawn and tasks 010–012's buildings and bridges), the fourth `2026-10-15-mundo-aberto` ("Mundo aberto", free roam's streets without the race's barriers, and tasks 040 and 043's decks' ends), the fifth `2026-10-15-after050` ("Caminhos e escadas", task 050's footways, cycleways and steps), the sixth `2026-10-16-after013` ("Muros e sebes", task 013's walls, fences, hedges and gates), the seventh `2026-10-16-after016` ("O chão", task 016's ground, on top of 013's walls), the eighth `2026-10-16-after048` ("Sem frinchas", task 048's streets without slivers), the ninth `2026-10-16-after017` ("Fachadas", task 017's facades), the tenth `2026-10-16-after046` ("Entre as pontes", task 046's corners stopped at the decks' and tunnels' ends), the eleventh `2026-10-17-after022` ("A luz", task 022's light), the twelfth `2026-10-17-after021` ("Os marcos", task 021's landmarks, with 055's cameras, without 022's light), the thirteenth `2026-10-17-after026` ("As ruas no sítio", task 026's streets, with 021's landmarks and 022's light), the fourteenth `2026-10-17-after056` ("Capelas e nichos", task 056's chapels, bell tower and shrines), and the fifteenth `2026-10-17-after058` ("Onde a foto foi tirada", task 058's cameras moved onto the surfaces their photos were taken from), the sixteenth `2026-10-17-after057` ("A aterragem", task 057's jump on its real street, which no place shows), the seventeenth, `2026-10-18-after019` ("As árvores", task 019's trees), the eighteenth, `2026-10-18-after052` ("Até aos muros", task 052's streets ending at their walls), the nineteenth, `2026-10-18-after063` ("Os troncos", task 063's crowns and trunks), the twentieth, `2026-10-18-after042` ("As placas", task 042's name plates at the corners and bus stops), the twenty-first, `2026-10-18-after045` ("O chão das ruas", task 045's ground under every street its own: no place looks different but `travessa-lobato`, its road flat to its edge), the twenty-second, `2026-10-18-after014` ("As rotundas", task 014's rings, islands, statues and give-way markings), and the twenty-third, `2026-10-18-after061` ("As espécies", task 061's trees of the species their photos show), is the one open for marks. The eighteenth to the twenty-third were made while the sessions couldn't open the scorecard, and put up together with Claude's marks by task 064 (2026-10-18). Since task 057 a shot the same as an earlier round's is that round's file (`tools/round.mjs`, the page): 61 were. Since task 062 a round's own shots go up in a few sheets, `rounds/<round>-<n>.jpg`, at most 9 a sheet (decision 045): the page holds 122 of the 511 files a version can, and a round of 34 changed places adds 4. Rated on the scorecard "Braga real" (task 003, decision 012, https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs) by the owner: the baseline averages 2.6 of 5, "Os amigos" 2.9, "Todas as ruas" 3.7; and since task 013 by Claude, in a document of its own and on a harder scale: "Muros e sebes" 2.45, "O chão" 2.48, whose marks the owner took for task 016, "Sem frinchas" 2.48, "Fachadas" 2.48 (the buildings nearer their photos in about twenty places, no mark moved) "Entre as pontes" 2.48 (no shot changed) "A luz" 2.48 (the light nearer the photos' on their 11 clear days, no mark moved) "Os marcos" 2.50 over its 32 places (the stadium up from 2 to 3; the chapel's new place 3, where the grey box before would have had 1) and "As ruas no sítio" 2.53 (`robert-smith-picoto` and `fujacal-west` up from 2 to 3, and four cameras off the pavement onto the road; `imaculada-conceicao` down from 3 to 2, its camera now on the median: task 058) and "Capelas e nichos" 2.50 over its 34 places (the other 32 as they were; the two chapels' new places 2 each, where before Santa Justa would have had 2 and Santo Adrião 1) and "Onde a foto foi tirada" 2.65 (five of the 15 cameras moved up: `imaculada-conceicao`, `conselheiro-lobato`, `lobato-east` and `alameda-fujacal` from 2 to 3, `lobato-pavement` from 1 to 2; none lower) and "A aterragem" 2.68 (no place shows the landing; each place looked at anew on 2026-10-18, at the owner's word, and `monte-da-forca` up from 2 to 3) and "As árvores" 2.88 (seven places up where the avenues' trees and the hills' woods now stand: `31-de-janeiro`, `alameda-fujacal`, `imaculada-conceicao` and `sameiro` from 3 to 4, `falperra`, `picoto-top` and `porfirio-da-silva` from 2 to 3; none lower) and "Até aos muros" 2.88 over its 33 places (none moved) and "Os troncos" 2.94 (`capela-sao-joao` up from 3 to 4, `altice-forum` from 2 to 3) and "As placas", "O chão das ruas", "As rotundas" and "As espécies" 2.94 each (none moved). The budget (task 004, decision 013): today's city, rounded up, in party-kart's `docs/architecture.md`; `?stats` measures a phone. A guide, not a limit (decision 017): realism first, and the games move to a stack that scales, or the owner's homelab, when they outgrow it. The reference photos (task 008, `refs/photos.json`, decision 018): 433 found online, from Mapillary and Commons, for the facades in the shooter's area and those a local knows along the route, the landmarks, bridges, roundabouts, kinds of building and wall, and close-ups (since task 056 the route's chapels too); 27 good enough for a texture; the gaps listed in the task, about half the shooter's area's buildings among them |

## Now · The open world

Party Kart becomes an open world over the Volta dos Amigos' area, and the race a game mode in it
(decision 019, 2026-10-14). It goes first: the tasks after it build on the streets it makes. It's
done end to end on Fujacal first (its streets as surfaces, drawn and driven on), then over the
whole area. Free roam went live with task 036 before the race moved onto the streets (decision
026, 2026-10-15), and the race followed with 037 (decision 029).

- **038** The city streamed tile by tile, when the area grows.
- **066** A car on a street beside a wall tilts by the street, not by the drop past its edge: the
  race's hops on the Avenida João XXI's upper lane (party-kart, found by 045).

## Games · More tracks and the shooter

The map is good enough to play more on (the owner, 2026-10-19): more kart tracks, inside the open
world's area as it is, and the first shooter, a realistic deathmatch among friends, played on foot in
Fujacal inside Party Kart's open world, in first person, each player the friend's figure they picked,
on a keyboard and mouse or twin sticks on a touch screen, a kit chosen at each spawn, and bots from the
start (the owner's answers, 2026-10-19). braga-map stays data (decision 031); the game is party-kart's.
The host picks the track since 071, and the Volta de Lamaçães is the second (072, decision 053). A
player gets out of the kart and walks the open world in first person since 073 (decision 055), and
the deathmatch is a round of it in Fujacal since 074 (decision 056), with bots since 075, in one of
three small arenas, most of their buildings with a ground floor to walk into and two with every floor
and the roof, since 079 (decision 057). No key or mouse button leaves the game by mistake, and a hit
shows where it came from, since 080. The bots, the host's to run and knowing only what a player
could, played by the owner at each level (075, decision 058).

## Phase 1 · See it: references, the scorecard and the budget

Before changing the city, know what the real one looks like, how close the game is, and how much
a phone can draw. Everything after this is checked against it.

Done: the viewpoints (001), the shots (002), the scorecard (003), the budget (004), the sources
(005), the street audit (006), the reference photos (008), the photo textures' pipeline (007,
decision 030), two viewpoints aimed as their photos look, not as Mapillary has them (055:
`monte-da-forca` and `estadio`, decision 009), and every camera on the surface its photo was taken
from, 15 of them moved off where Mapillary puts them (058, decision 041); and every round's shots
in a few sheets, so the scorecard holds about 100 more rounds (062, decision 045); and the six
rounds made while the scorecard was out of reach, 052's to 061's, put up with Claude's marks (064,
`tools/scorecard.mjs`).

## Phase 2 · The shape: the ground, the streets and the buildings where they really are

Done: the buildings' heights and roofs (010), the buildings the map lacks (011), the bridges and
tunnels (012), the shooter's area (015, decision 031): its edge, its section `fujacal`, and what
walking distance needs there, in [SHOOTER-AREA.md](SHOOTER-AREA.md); the footways, paths,
cycleways and steps, karts up and down them (050, decision 032); and the walls, fences, railings,
hedges and gates, the map's measured and those the LiDAR finds, each a wall to a kart (013, decision
033); every street on its real carriageway, measured by the LiDAR (026, decision 039); and the
stadium's bowl stopped short of the streets beside it (049, party-kart); and the karts flying the
jump's flight, a little slower than planned, to land short of the street's turn (060, party-kart,
decision 044); and the streets ending at their walls: a pavement at the first one behind it, and a
carriageway brought back to the map's, no narrower than its lanes (052, decision 046); and the
roundabouts as they are: each ring and island where the LiDAR measured them, the island in what the
ground is there, the statues the map has in them, and the give-way markings at their entries (014,
decision 050); and on foot, a retaining wall measured along its length and never climbed from below,
the river's bed stopped at the walls on its bank, and the passages under the houses open at their
ends (077, 078, decision 059).

- **051** A flight of steps meets the street, the path or the land at its foot and its top: 51 of
  236 stand more than a kart's step over what's at their foot (found by 050).
- **041** The squares OpenStreetMap maps in parts, the Praça da República among them, drawn as
  squares (found by 006's audit).
- **059** A pavement the map has on an island drawn as a pavement, not the island's grass: the
  Avenida da Liberdade's at (276, 840), where `liberdade`'s photo is taken (found by 058).
- **076** The land at a flight of steps, never drawn over its treads nor far under them: 565 of
  1,896 treads have it 15 cm or more over them, the Travessa do Fujacal's 17 steps among them, and 96
  stand 2 m or more over it (found on foot by 073; after 051).

## Phase 3 · Surfaces and colours

Done: the ground as it is, every 50 cm, from the LiDAR's echo and the orthophoto's near-infrared,
each kind in its own photo and the place's colour (016, decision 034); the facades, each building
its kind's in its own colours, as a session saw it in its photos or guessed from those seen (017,
decision 036); every tree as the LiDAR measured it and of its kind, near in its bark and leaves and
far as its kind's billboard (019, decision 043); and the trees near seven viewpoints the species their
photos show, the rows along the avenues they show and the Parque da Ponte's limes, with the plane,
the lime and the birch drawn as their own, each kind deciduous or evergreen (061, decision 051).

- **018** Road markings and pavements as they are: Portugal's lines, Braga's pavements.
- **044** Pavements level from the kerb, not draped over the ground's bumps (found by 035's
  round).
- **065** A tree the map has beside a crown is that crown's trunk, not a young tree of its own: the
  Imaculada Conceição's hackberry (found by 061).
- **068** The lawns green as in March, where the 2025 orthophoto has them dry (found by 014).

## Phase 4 · Street furniture, landmarks and light

Done: the landmarks the race sees, at their real size, measured by the LiDAR and drawn from their
photos (021, decision 038): São João da Ponte's chapel and bridge, the stadium, the Picoto's top and
the Altice Forum; the route's other chapels, São Lázaro's bell tower and two wayside shrines, the
same way (056, decision 040); and Braga's light, the real sun on a clear March afternoon matched to the photos,
with a grey day and rain on asking (022, decision 037).

- **020** Street furniture where it stands: lamps, signs, bins, benches, shelters, parked cars.
- **053** Last, after every task open on 2026-10-16 but 038: every task's notes read for what they
  left to improve, each thing still worth doing drafted as a task.

## Ultra · Braga at its most real

The owner asked for the absolute best quality in every aspect (2026-10-23). Their answers: a fourth
graphics level, Ultra, for a PC only, where all of it goes, High, Medium and Low staying as the
phones hold them (081); no photograph drawn in the game, a facade or anything else, the photos kept
as references (082, replacing decision 002); OpenStreetMap still as it is (decision 022), so the
point cloud finds what it lacks (100); and insides made up for the shops' and cafés' ground floors
only (095). The "Later" ideas are drafted here.

- **081** Ultra, a graphics level for a PC: first, as every task below hangs its detail on it.
- **082** No photograph in the game: every texture made, matched to the photos. Before 085 and 089.
- **083** The ground at 50 cm over the whole map, finest near the player (after 038).
- **084** On Ultra, the streets on the land's own triangles (after 083).
- **085** Textures at their finest on Ultra: UASTC, normal and roughness maps.
- **086** Each facade's doors and windows where they are, read from its photos.
- **087** Roofs as the point cloud has them: every plane, chimney, dormer and terrace.
- **088** Every tree in the open world its species.
- **089** On Ultra, the trees in full to the horizon, moving in the wind.
- **090** The light on Ultra: cascaded shadows, occlusion, light bounced, reflections, TAA.
- **091** Each viewpoint shot at its photo's hour and weather (blocked: it changes decision 037).
- **092** Night: the lamps lighting the streets, the windows lit, Bom Jesus floodlit.
- **093** The seasons: bare trees in winter, the jacarandas in June (after 088).
- **094** Life in the streets: traffic, the TUB's buses, people (after 020).
- **095** The shops' and cafés' ground floors with insides, made up (after 086).
- **096** The Rio Este with its banks, walls and weirs, and the streams drawn.
- **097** The railway: rails, sleepers, catenary, the station and a train.
- **098** The old town's landmarks at their real size (after 099).
- **099** The whole map at the open world's detail, the open world grown over it (after 038).
- **100** The street furniture the point cloud finds, for 020 to draw.
- **101** Braga's sound at its fullest: from what makes it, echoing off its walls (after 094).

## Alongside · The sound

The owner found the game's audio truly horrible (2026-10-13): the engine, the beeps, the
clipping and the silence round you. Tasks 023, 024 and 025 answered it on 2026-10-14: the mix, a
race car's engine for every kart, and Braga round the track. More of Braga's sound is in "Later".

## How the work can run in parallel

Phase 1 is done (007 the last of it, 2026-10-15), and the open world is live: 032 to 037, 039,
040, 043, 047 and 050 are done, the race on the streets at their real widths (037, decision 029).
Every question in the tasks is answered: 044's on 2026-10-16 (the pavements' heights are
braga-map's, level from the kerb at 2% across at most), and 057's and 058's, found by 026, on
2026-10-17 (the race's road takes in the corner off the jump; the cameras go onto the surfaces
their photos were taken from). Each task is checked on the scorecard when it lands.

The order, set with the owner on 2026-10-16 and kept since by the planning session: two streams
side by side, as they touch different files, and in each the foundations first; small tasks
alongside them in worktrees of their own.

- **Stream 1, the streets' shape, one task at a time.** Each changes `tools/streets.mjs`,
  `lines.mjs` or `world.mjs`, or party-kart's `streets.ts` and `ground.ts`, and ends with a tag
  party-kart is pinned to.
  1. **013** walls, fences and hedges: done (decision 033).
  2. **048** slivers: done (decision 035).
  3. **046** a junction's corner at a deck: done, braga-map 1.18.1.
  4. **026** every street on its real carriageway: done (decision 039), braga-map 1.20.1. What's measured against
     a carriageway comes after it: 045's ground, 044's kerbs, 051's feet, 014's rings, 018's
     markings, 042's corners. Half of `bom-jesus`'s fall in "Todas as ruas" is its (the camera on
     the map's pavement). Rewritten for every street on 2026-10-16, after 016, whose LiDAR echo
     tells the road from the pavement.
  5. **057** the jump lands on its real street: done (decision 042), braga-map 1.22.0. The three
     streets 026 kept as the map has them measured like the rest; the race's road takes in the
     corner off the jump, a walled lot's, and a race takes its walls down.
  6. **052** the streets end at their walls: done (decision 046), braga-map 1.24.0. A pavement runs
     to the first wall behind it, a carriageway gives way to the map's walls in it, no narrower than
     its lanes; 0.43 km of the map's 29.7 km still cut on a carriageway (3.5 km before).
  7. **045** the ground under a street beside a wall: done (decision 049), braga-map 1.27.0. Each
     street's ground its own, held to its carriageway; 044's kerbs stand on it. The race's hop on
     the João XXI's upper lane is party-kart's (066).
  8. **044** pavements level from the kerb.
  9. **051** steps meet what they lead to: a flight's foot at the kerb 044 sets.
  10. **014** roundabouts: done (decision 050), braga-map 1.28.0, the race's road round the rings
      measured. **041** squares any time after 026; **059** a pavement on an island, too.
- **Stream 2, the look.** The high ones, on 007's photo textures' pipeline, party-kart's
  `city.ts` and `refs/`.
  1. **016** the ground from the aerial photos: done (decision 034). 018's parking bays, 019's
     grass and 020's parked cars come from it.
  2. **017** facades: done (decision 036), braga-map 1.18.0 with 048's streets.
  3. **021** landmarks: done (decision 038), braga-map 1.19.0 with 046's corners.
  4. **056** the route's chapels and wayside shrines (found by 021): done (decision 040), braga-map
     1.21.1 on 026's streets.
  5. **019** trees: done (decision 043), braga-map 1.23.0 on 1.22.0's streets.
  6. **062** the scorecard's rounds in sheets: done (decision 045), before any round went up.
  7. **042** names, stops and plates: done (decision 048), braga-map 1.26.0 on 052's streets and 063's trees.
  - **055** the Monte da Forca's camera: done, with `estadio`'s, shot so in 021's round.
- **Alongside, small, each in worktrees of its own:** **058** each camera on the surface its photo
  was taken from: done (decision 041); then **049** the
  stadium's bowl (party-kart's `land.ts` alone): done; then **060** the karts leave the ramp along
  its flight (party-kart's autopilot and bots alone, found by 057): done (decision 044); then
  **063** trunks where they stand (`tools/trees.mjs` and `world.mjs`'s trees, party-kart's
  `trees.ts`): done (decision 047), braga-map 1.25.0; then **061** the trees' species from their
  photos (`refs/trees.json`, `trees.mjs`'s kinds, party-kart's `trees.ts`): done (decision 051),
  braga-map 1.29.0 on 014's roundabouts.
- **054** the flying camera: done and live (2026-10-17), with 048, 017, 046 and 022. A phone's
  frame rate from the air isn't measured yet.
- **022** the light: done and live (2026-10-17, decision 037). Its round, "A luz", was open for
  marks until 021's went up after it. The clear afternoon stays in the game and in every round,
  though 18 of the 29 photos are grey days (the owner).
- **Once stream 1 has done 044:** **018** markings and pavements (on 026's carriageways, 044's
  pavements and 016's parking; its "What" also describes the track before 033), then **020**
  furniture (013's gates, 016's parked cars, 018's bays).
- **Last:** **053**, every task's notes read for what they left, after every task open on
  2026-10-16 but 038. **038** when
  the area grows, and not before: load time doesn't matter to the owner (2026-10-16), so 016's
  bigger download (2.3 to 7.0 MB on High) doesn't bring it forward.
- **Two sessions at once:** `npm run world` rewrites every tile, so a second session in braga-map
  works in a git worktree of its own, with `.cache/` linked to the main checkout's (a junction on
  Windows: it's 7.5 GB and not in git), and the two take turns at merging and tagging. In
  party-kart, never two sessions on the same file.
- **More tracks and the shooter** (set 2026-10-19), one at a time in party-kart, as each changes
  `main.ts` and `session.ts`: 071 to 075, 079 and 080 are done. 073 made party-kart's wall test public (`circle` in `ground.ts`),
  which stream 1's 044 changes too: not at the same time. What the shooter needs of the map at
  walking distance is still stream 1's 044 and 051, and 018 and 020 (the parked cars are cover).
- **The shooter's area** goes first in every task of Phases 2–4, to the bar
  [SHOOTER-AREA.md](SHOOTER-AREA.md) sets (015, decision 031).
- **The sound** is done (023–025); what's next of it is in "Later".

## Later

Nothing for now: every idea that was here was drafted on 2026-10-23 under "Ultra · Braga at its
most real" (092–099, 101).
