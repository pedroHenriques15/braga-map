---
status: blocked
priority: medium
kind: owner
repo: both
created: 2026-10-24
depends-on: []
roadmap: Phase 1 · See it: references, the scorecard and the budget
---

# 103 · What waited for the owner's account

## Why

On 2026-10-24 Claude Code on the owner's machine is signed in to an account that can't reach the
owner's claude.ai artifacts: an Artifact `read` of the scorecard "Braga real"
(https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs) gives "artifact not found", and the same goes for
the shared map page and the before-and-after pages. The owner's answer: the tasks go on without
them, as task 064 did, and nothing new is published from this account. What each task would have
put up waits here, so it all goes up in one pass once the owner's account is back.

## What

Each row of the first table is something a task left for the owner's account: a round for the
scorecard, Claude's marks, a page to update, comments to read, a file. Each says the commit it was
made at, so it goes up on the build it was made on (task 064's step 2).

Once Claude Code is signed in to the account that owns the pages (`/login`):

1. Stop unless an Artifact `read` of the scorecard's URL works.
2. **The rounds and Claude's marks:** task 064's steps 2 to 7, in order (`docs/tasks/done/064-*.md`):
   each round on the build after the one before it, the lists from main (`node tools/round.mjs
   --pack`), every `scores/*` read first, the files (`node tools/scorecard.mjs files <listing>`,
   each part published), and Claude's marks (`node tools/scorecard.mjs marks <claude.json>`, set
   over `scores/claude` pinned to the version read). Never write anyone else's document.
3. **The map page:** published from `map/index.html` with `map/braga.json` and `map/tracks.json`
   beside it, as the README's "The map page" says, after `npm run page` on main.
4. **The rest of the table,** row by row: each one done is ticked in the table with the date.
5. **The decisions:** each row of the third table confirmed or changed by the owner, and the task's
   Notes saying which.

## Waiting for the owner's account

| Task | What waits | Made at |
|---|---|---|
| 082 | A round for the scorecard: its shots are made (party-kart's `shots/2026-10-23-task082/`, all 33 places at High and Low on 1.33.0, and `shots/2026-10-23-task082b/`, four places on 1.33.1's setts), but it isn't prepared (`node tools/round.mjs`), isn't in `refs/rounds.json` and has no Claude's marks. Then the owner's marks. **Since 2026-10-24:** shot again on main as `2026-10-24-after082` (party-kart's `shots/2026-10-24-after082/`, all 33 at High and Low), which takes these shots' place; Claude's marks for it are in `.cache/scorecard/marks/2026-10-24-after082.json` (mean 2.52, this run's baseline, on the scale in `_coord/marks-scale.md` beside the repositories). Not yet prepared with `tools/round.mjs`: done when it goes up | braga-map `83fd58d` (1.33.1), party-kart `2dfa05d` |
| (the run) | This run's rounds after 082, each a folder of party-kart's `shots/` with Claude's marks in `.cache/scorecard/marks/<round>.json`. All 33 places: `2026-10-24-after081` (Ultra baseline, 1.36.0), `2026-10-24-after090` (Ultra, 1.36.0), `2026-10-24-t111-after7` (High, 1.36.0; marks `after111`), `2026-10-24-t112-after` (High, 1.37.0; marks `after112`), `2026-10-24-t059-after` (High, 1.37.0; marks `after059`), `2026-10-25-after089` (Ultra, 1.40.0, main with 089). A few places only: `after088` (5, High), `after065` (1, High), `after085` (3, Ultra), `after051` (4, Ultra, shot on 1.39.1's textures before its rebase). Several were shot on a task's branch before it rebased. None is prepared; since task 127 (decision 079) `node tools/round.mjs <round>` puts a round up at the level it was shot at, Ultra when its folder has `ultra/`. The marks file to take for main as it stands is the latest (`2026-10-25-after051.json`, all 33 reconciled at 089, mean 2.64) | the build in each folder's `stats.json` |
| (none) | A page to update: the shared map page (https://claude.ai/artifact/UdwdhZYkR76J5xyPcRUHUb) was last republished by task 050 (`a694087`, 2026-10-15). `map/` has changed since in `d21b044` (026), `b846a05` and `d1cf52d` (014), `4bdb77a` (067, 072), `a01bb67` (079) and, in this run, `afa3e8b` (041: the squares mapped in parts), and no task records that it went up again | braga-map `afa3e8b` (the last change to `map/`) |

## braga-map versions bumped and not tagged

None: the owner lets the sessions tag (2026-10-24). 1.34.0 (task 100, `6248f21`) was tagged that
day; party-kart is pinned to the latest tag by the first task of Phase 2 that touches it.

## Decided by the session, for the owner to confirm

Questions that came up while the owner wasn't asked, decided by the session and recorded in the
task's Notes as "decided by the session, for the owner to confirm".

| Task | The question | What the session decided | Commit |
|---|---|---|---|
| (the run) | Who marks the rounds, now that Claude's marks are the judge, with four sessions? | The coordinator alone, so every round is on one scale; the workers shoot and send it the places that changed | `003fa12` |
| (the run) | Claude's marks for each place in the last rounds aren't kept locally (task 064 removed them once they went up, and the scorecard is out of reach): what is "no lower" measured against? | A new baseline of Claude's marks, every place marked again on main before the first task that changes a viewpoint lands; each round after is marked against the one before it | `003fa12` |
| (the run) | ROADMAP's "in party-kart, never two sessions on the same file", with three workers | Allowed in different functions of a file only, the one landing second rebasing and keeping both; the coordinator says which files each task has claimed | `003fa12` |
| (the run) | Cross-session messages are off in every session (the workers' and the coordinator's) | The sessions talk through files in `_coord\`: `to-worker-N.md` from the coordinator, `from-worker-N.md` from each worker, each waiting on the other with a background command | (outside git) |
| 041 | Its step 4: the two ways tagged as areas that aren't pedestrian (a residential yard and a driveway, outside the box) | Left as they are: drawn as streets round their outline, not as squares | 041's landing |
| 106 | Is the city drawn under the full map? | No: the full map is opaque, and the city isn't drawn while it's open | 106's landing |
| 106 | A touch screen with the minimap hidden in the settings: how does the map open? | A 🗺️ button in the bar opens it | 106's landing |
| 106 | Does the full map stop your kart in a race too (the task says "as with the menu", and a race has no menu)? | Yes: opening it mid-race stops your kart, as round the city | 106's landing |
| 107 | Inside the open world no street reaches the Picoto's top (its streets reach the rest only past the area's edge): how does the GPS get a kart there? | By car it keeps to the streets by the rules of the road and leaves them for a path or steps only where no street reaches the waypoint, each time costing 10 minutes in its search so it never cuts a one-way street by a pavement; the HUD says "Sai da estrada: segue pelo caminho" there | 107's landing |
| 107 | One-way on each street's `Line`, as the task words it, or on a road graph? | A road graph in the tiles (`world.roads`, `world.turns`, made once by `tools/roads.mjs`): the lines are thinned and cut at each tile's edge, with no junctions, so a game couldn't route on them | 107's landing |
| 107 | 106's double-click on the full map zoomed in; 107's click puts the waypoint | The double-click zoom removed (the wheel and a pinch still zoom) | 107's landing |
| 109 | In what order does the search list what it finds? | The nearest first, as the task says (so "picoto" from Fujacal lists the Picoto Adventure Park, 930 m, before the Monte e miradouro do Picoto, 1.1 km); Enter takes the first | 109's landing |
| 114 | A bot that has lost its speed on the jump's run-up: back up and line up again, or be put back? | It moves aside, takes the ramp, falls short and is put back as before: from a standstill a kart needs about 120 m flat out to reach the ramp's speed, about 15 s backing up against 3 s for the put-back | 114's landing |
| 110 | What happens to the room's marks in a race? | They stay, hidden during it, and are back after it | 110's landing |
| 110 | When does following a friend end? | When you're there (within 15 m), as a waypoint does | 110's landing |
| 110 | What does a mark look like? | A flag in the colour of the driver who put it (a dark driver's dark with a white edge), with their name | 110's landing |
| 059 | Its island at the Liberdade isn't an island since 052; the map's sidewalks lie on open ground with no pavement under them for about 13 km of the open world (1 to 8 m off every street piece), the Liberdade's among them. Only the islands (292 m), or every such sidewalk? | Every such sidewalk (the coordinator, on worker-3's measure): the map's sidewalk is a pavement where the tiles have none under it, on an island or on open ground, kerbed like the streets' pavements; it changes many viewpoints, all shot and marked | 059's landing |
| 112 | The grey box at `capela-sao-joao` is a row of parked vans and a motorhome the LiDAR outlined as a building, and no rule picks it out alone: how is it left out? | A field `not` on its `refs/buildings.json` entry (what it is, from the photo), and `world.mjs` leaves out a LiDAR building marked so; the general rule for car parks is task 116 | 112's landing |
| 065 | Its premise: the map's tree beside the crown is its trunk, or the camera is off along the avenue? | The camera is off: `imaculada-conceicao` moved 20 m back along the avenue, where its photo's trees put it; a camera may move up to 25 m along its street (`test/viewpoints.test.js`, where its note says "Moved … along"), task 058's 15 m across a street standing | 065's landing |
| 065 | `test/trees.test.js`'s floor for the trees the rows name | From 30 to 25: four of the Imaculada's hackberries newly in view were looked at, and a tree seen is no longer a row's | 065's landing |
| 112 | A map's wall the ground steps along, which walls.mjs made a retaining wall at its step | It keeps the map's height where the map gives one: 137 of the map's walls drawn higher (5.2 km, 1.21 m at the median, 4 m at most), the Viriato's painted wall 3 m | 112's landing |
| 090 | The renderer for Ultra's light (its step 7): WebGL with three's post-processing, or WebGPU? | WebGL, with three's post-processing on Ultra only: the game's look is in 14 changes to three's GLSL shaders in 7 files, which WebGPU's node materials don't take | 090's landing |
| 090 | Its scope | Cascaded shadows, GTAO and SMAA (three's TAA only accumulates while still, so it smears in motion); reflections, light bounced, the haze and clouds' shadows and soft shadows drafted as 117 to 120 | 090's landing |
| 085 | Ultra's textures in git: ~100 MB as the task has it, each time they're made | The ~40 MB way, if the setts' joints and the bark read sharp up close at Ultra (the colour in ETC1S at twice High's size, the normal map alone in UASTC, roughness at half size in ETC1S); the ground's relief as one array of normal maps and a roughness by kind, within WebGL's 16 texture units; the facade kit split off as 123 (the coordinator) | 085's landing |
| 085 | The setts, calçada and asphalt seen up close at 085's viewpoints are party-kart's street drawings (256 px canvases), not braga-map's textures: in 085, or a task of their own? | In 085: on Ultra the streets' drawings made at 1024 px (drawn finer, not scaled), about 80 MB more on the card (Ultra's textures ~540 MB); High and below as they are (the coordinator, on worker-2's recommendation) | 085's landing |
| 085 | Its smaller choices on Ultra | Each kind of ground's roughness a number near the land's 0.96 (at 0.7 the setts' joints washed pale); the six kinds' textures one array on Ultra only, so High and below stay byte-identical; three's default anisotropy raised on Ultra so every texture takes the card's most; what was built for Ultra stays if the game steps down to High | 085's landing |
| 089 | Its step 1, the far trees past the near reach: a lit crown of each tree's own shape was tried and looked worse than the billboards (blobs, not leaves) | Taken out: 089 is the near trees in the wind and the deciduous kinds' limbs; the billboards past 700 m stay; the octahedral impostors are task 128; its first Done when stays open | 089's landing |
| 089 | Draw into each shadow cascade only the near trees that could shade it | Not kept: built, it saved 0.3-0.4 ms of the trees' 3.7 ms of shadows at `falperra` (2560x1440), and to be safe on slopes it needs the ground's height, more code than it saves; the cost is the leaf cards in the near maps, task 129 | 089's landing |
| (the run) | Which of the run's rounds go up (the first table's row): each task's, partial and some on a branch before its rebase, or fewer? | The full rounds on a landed build only: `after082` (High), `after081` (Ultra), `after089` (Ultra, main at 1.40.0 with 089) and one of all 33 on main at the run's end (Ultra), with the latest marks; the partial rounds stay in `shots/` as the tasks' evidence, their marks folded into the next full one. 051's round isn't shot again on 1.41.0 (worker-3 offered): the run's last round holds it | the coordinator, 2026-10-25 |
| 093 | Its premises: the jacarandas, cherries, magnolias and camellias "where 088 names its species" (088 named none), and the lawns by the month on 068's March (068 isn't done) | On Ultra, each deciduous kind's year by the date from a phenology table in braga-map (bare crowns as twigs with 089's limbs, budding, in leaf, turning in its own colour, falling), the billboards and shadows following, fallen leaves if they come out right; the lawns by the month left to 068; the Judas trees' and acacias' year as task 130 (new kinds, no format change) | 093's landing |
| 093 | A third premise: "broadleaf" isn't all deciduous; bare in March, the hills' woods go grey-brown where `picoto-top`'s and `falperra`'s photos are green, and COS2025's classes can't tell the hills' from the avenues' but by where they stand | One new kind in 093, an evergreen broadleaf drawn as broadleaf, given to the unnamed broadleaves on COS2025's green spaces, woods and scrub and to the named evergreen ones (088's 4 and the oleander); the rest of broadleaf bare in winter; a world build and a version; 130 narrowed to the Judas trees and the acacias (the coordinator) | 093's landing |
| 088 | New tree kinds for the species found | None: no species reaches the task's ~50 trees on the photos' evidence (willows 23, planes 25, hackberries 20), and the hackberries are drawn as "broadleaf", whose bark is already a hackberry's; the kinds stay nine | 088's landing |
| 088 | Carry a row's species past what the photos show (the point cloud's spacing) | No: a row's species goes only as far as a photo shows the row, as decision 051 has it | 088's landing |
| 081 | How far Ultra draws the trees in full | 700 m, by a frame under 16 ms while moving (a frame after gathering them: 12 ms at 700 m, 18 at 1,000, at 2560 × 1440); a still frame holds 1,000 m at 4.6 ms | 081's landing |
| 081 | Step 2's "the haze's far plane at the most the city holds" on Ultra | Left as High's: the camera's far plane is already 30 km, and the haze is the light's, matched to the photos (decision 037) | 081's landing |
| 105 | The chair (Joel's) and the trolley (Joel F.'s) are smaller than 2.8 m today: brought to 2.8 m, or kept in proportion? | Every body drawn at 0.7 of its model, so every driver stays the same size (the chair 2.06 m long, the trolley 2.16 m); the banger at 0.65 to fit 2.8 m (from 4.30), its driver 7% smaller | 105's landing |

## Progress

Where the work on every open task stands (the owner's two phases, 2026-10-24), so a session that
picks it up can go on from here.

- **Phase 1, the questions:** done on 2026-10-24. Every open task's questions answered in its
  file; the owner's general answers:
  - **Tags:** the session tags each braga-map version and pins party-kart to it.
  - **Deploy:** once, at the end, from a clean main, checked live (party-kart's
    `docs/releasing.md`). Not after each task.
  - **Commits:** after each task, `git pull --rebase`, commit and push to main, in each repository it
    touched; a worktree's branch merged into main, then the worktree removed (its `.cache` junction
    first, with `rmdir`, never a recursive delete).
  - **Order:** the `/task` order (priority, then `depends-on`), the owner's new improvements first
    (105 to 110, before 081).
  - **A premise that proves false:** recorded in the task's Notes and here, the part that still holds
    done; dropped with the reason only if none does.
  - **Two at a time:** at most one task that rebuilds braga-map's world, beside one that doesn't touch
    the same files (a party-kart-only task, say), each in a worktree of its own (ROADMAP's "Two
    sessions at once").
  - **Not done in this run (held, `blocked`):** 099 (the whole map at the open world's detail), 097
    (the railway, all outside the playable area) and 098 (the old town's landmarks, all outside it).
    What of 098 is inside the playable area is task 104, done.
  - **Never asked again in Phase 2:** a new question is decided by the session, written in the task's
    Notes as "decided by the session, for the owner to confirm", and added to the table above.
  - **Claude's marks are the judge** (the owner, 2026-10-24): a task's "rated no lower" is decided on
    Claude's marks, not by waiting for the owner's; they still go up with the rounds when the account
    is back.
  - **Four sessions** (the owner, 2026-10-24): three workers (worker-1 to worker-3), each doing whole
    tasks in worktrees of its own, coordinated by the session "Braga-map and party-kart open tasks",
    which assigns the tasks, grants the one merge turn, marks every round and keeps this file. The
    workers' rules and the live board are outside git, in `C:\Users\pedro\source\repos\_coord\`
    (`worker-brief.md`, `board.md`); what lands is recorded here.
- **Phase 2, the work:** started on 2026-10-24 (105, 106 and 041 first). The order, each after its
  `depends-on`. Tasks drafted during the run are in it too (the owner, 2026-10-24): a `critical` one
  goes to the first worker free, the others by their priority.
  1. 105 smaller karts, 106 the full map on M, 107 the GPS, 108 "Ir para aqui", 109 find a place,
     110 meet the others; and 111, the white shards at a wall's foot (`critical`), as soon as a worker
     is free.
  2. 081 Ultra, then 102 the credits.
  3. The medium ones: 044 pavements level, then 051 steps, then 076 the land at the steps; 041 squares
     and 059 the island's pavement alongside; 112 the two buildings the photos don't have (a world
     rebuild, after 041's); 066 the tilt; 018 markings after 044, then 020
     furniture; 085 textures, 086 doors and windows, 087 roofs, 088 species, 090 the light; 038
     streaming, then 083 the 50 cm ground (038 is low but 083 needs it).
  4. The low ones: 084, 065, 068, 089, 091 (after 090), 092 (after 090 and 020), 093 (after 088), 094
     (after 020), 095 (after 086), 096, 101 (after 094), 104.
  5. 053 last.

  Each task's line here gets its commit, version and what's left once it lands.

  Landed and found so far:
  - The baseline marks (the coordinator, 2026-10-24): `2026-10-24-after082`, mean 2.52 over 33. Found
    marking it, and drafted (`5da9746`): 111, white shards at a wall's foot, `critical`, next for the
    first free worker; 112, two buildings the photos don't have.
  - **041** (worker-3): landed `afa3e8b`, braga-map 1.35.0 (tagged), decision 063. The squares mapped
    in parts are `plaza` areas with their holes, and the street audit reads the streets as they're drawn
    since 026 (its premise was out of date). No viewpoint changed, so no round. Not verified: the
    budget at Medium. Found: 113 (a wall's gap at a square's footway), drafted.
  - **106** (worker-2): landed braga-map `280ea24` (decision 064, no version) and party-kart
    `83146ed` (still on v1.33.1). M opens the full map in every mode, N mutes, a tap on the minimap
    opens it on a touch screen. No viewpoint changed. Not verified: a real phone, two players seeing
    each other on the map, the competitive mode, the Volta de Lamaçães' race. Found and fixed in it:
    on foot with a gun out the minimap hid everyone. Fixed by the coordinator (`db5642c`), found by
    worker-2: braga-map's `package-lock.json` had stayed at 1.29.0.
  - **105** (worker-1): landed braga-map `bf238be` (decision 065, no version) and party-kart `54fdcad`,
    `c4dbac2` and `31dbdf3` (the pin from v1.33.1 to v1.35.0, bringing 1.34.0's furniture data, not drawn,
    and 1.35.0's squares, which no viewpoint sees: no round). Every kart drawn within 2.8 × 1.8 m and
    colliding as that, as capsules; peer prefix pk44. Its premise was partly false: the karts already
    fitted side by side by collision almost everywhere; what was wrong was how big they were drawn. Not
    verified: a race at speed in a browser room, the deathmatch's cover in a round, touch. Found: 114
    (the bots' pile-up on the jump's run-up, three times as many put back), drafted, worker-1's next.
    It landed inside 107's merge turn, by the coordinator's double grant; nothing was lost (both
    fast-forwards), and the merge-turn rule is now the exact line "merge turn: NNN".
  - **107** (worker-2): landed braga-map `52128bb`, 1.36.0 (tagged, decision 066), and party-kart
    `924347c`, pinned to v1.36.0. A road graph in the tiles (`tools/roads.mjs`, `world.roads` and
    `world.turns`: 6,375 stretches, 2,409 for cars, 1,035 one-way, 39 banned turns; +72 KB gzipped over
    the open world's tiles); the router by the rules of the road, the waypoint on the full map, the route
    on both maps and as arrows on the street, the next turn on the HUD. Its premise was partly false: no
    street reaches the Picoto's top inside the area. No viewpoint changed. Not verified: a whole route
    driven by hand, a real phone, the turns' words everywhere.
  - **108** (worker-2): landed braga-map `ccffa56` (docs only) and party-kart `ae5d387`. "Ir para
    aqui" from the full map's right click or long press: your kart on the nearest street a kart can
    reach, on foot you, flying the camera; never in a race or a round; "Fora da zona" outside the area.
    Found and fixed in it: on foot, opening the full map didn't always let the pointer go
    (`src/input.ts`). Not verified: two players seeing the jump, a real phone.
  - **114** (worker-1): landed braga-map `1cb3330` (decision 067) and party-kart `8bbe292`. On the
    jump's run-up a bot goes round a kart it would catch, and the autopilot takes it up the ramp off the
    axis; put back on the run-up 24 times in 64 seeded eight-bot races, where 105's karts had 56 (the
    old karts' 12 per 32). Not verified: a race in a browser room with bots at the jump.
  - **109** (worker-2): landed braga-map `03924b4` (docs only) and party-kart `6967a66`. A search on
    the full map for the streets, landmarks, arenas and bus stops, accents or not, the nearest first, the
    result the GPS's waypoint; and in 107's router, a car's route starts and ends on streets. Not
    verified: a real phone's own keyboard.
  - **066** (worker-1): landed braga-map `4643ad3` (decision 068) and party-kart `84712aa`. A car
    tilts by the surface it's on: on the João XXI's upper lane, 99 points tipped 64-72° now under 3°;
    along every street at 90 km/h both ways, 172 times in the air (was 187), the longest 1.82 s (2.12).
    `openings` stays (the Liberdade underpass needs it). Its first "Done when" is left open: the race
    still flies 0.31-0.40 s on the João XXI, from the tiles' ground dipping at the lane's edge: task 115.
  - **110** (worker-2): landed braga-map `b13d255` (docs only) and party-kart `67e3771`. Round the
    city, both maps show the room's friends and marks; the GPS follows a friend; "Marcar para todos"; a
    new message pair the host checks (inside the open world, the sender's own id, one a second); the peer
    prefix stays pk44. Found and fixed in it: the maps drew someone on foot at their kart. Seen once and
    not reproduced: a stack trace in `test/comp.test.ts` (110's Notes). Not verified: two machines on
    different networks, real phones, an old build in the room.
  - **The owner's improvements, 105 to 110, are all in** (2026-10-24), with 114 found by 105.
  - **081** (worker-1): landed braga-map `2e49fc9` (decision 069, no version: its step 6's premise was
    false, `loadWorld` takes no level) and party-kart `41adaa2`. Ultra, offered on a PC only: the full
    pixel ratio, shadows at 4096, the near trees to 700 m, the city built at High's level until 085.
    High, Medium and Low draw the same shots as before. The rounds are shot and marked at Ultra from now:
    its round `2026-10-24-after081` is the Ultra baseline, Claude's marks as `after082`'s (mean 2.52, no
    mark moved; Ultra differs from High by at most 2% of a shot). Not verified: Ultra in a race, the
    settings' picker opened, the owner's own screen.
  - **088** (worker-2): landed braga-map `3a5404d`, 1.37.0 (tagged, decision 070), and party-kart
    `74436ae`, pinned to v1.37.0. The shooter's area's trees the species their photos show (448 trees
    seen, 17 species); Braga publishes no street-tree inventory; no new kind. Nine reference photos it
    first picked broke the privacy rule and were dropped before any commit. Its round, at High: no mark
    moved.
  - **102** (worker-1): landed braga-map `8fc55c9` and party-kart `28bb0d6`: How to play credits
    OpenStreetMap, the DGT and Copernicus and says the textures are made; `photoCredits` gone.
  - **090** (worker-1): landed braga-map `aa33664` (decision 071) and party-kart `c373c5a`. Ultra's
    light: the sun's shadows in four cascades of 4096 px to 2 km, GTAO, SMAA, on WebGL; fixed on the way
    a three 0.186 bug (CSM's old lights chunk darkened every material). Its round at Ultra: no mark moved,
    the corners and the trees' shadows nearer the photos. Its first Done when left open: the shadows reach
    2 km, not the horizon, and the glass gives back the sky only (117). Drafted from it: 117 to 120.
  - **111** (worker-3, critical): landed braga-map `e6a2990` (decision 072) and party-kart `28c9e28`.
    The land is held to each side of a retaining wall and cut along it, so it never ramps across a wall's
    step: the white shards at `travessa-lobato` gone (2 → 3), couteiro's heaps of land over the street
    gone; +4.7% triangles on High at the median. The deathmatch arenas' cover moved with the ground (topo
    70, vilaca 53, santa-justa 54). In the live build until the next deploy. Drafted from its round:
    121 (Santo Adrião's bank taken for walls) and 122 (the land's texture stretched on a steep slope).
  - **065** (worker-2): landed braga-map `2e5a7e7` (decision 073), no version. Its premise half false:
    the camera was off along the avenue, not the crown leaning; `imaculada-conceicao` moved 20 m back,
    where its photo's hackberry and palm stand. Its mark 3 → 3. Left: the young tree OSM maps 35 m ahead.
  - **112** (worker-3): landed braga-map `92b813e`, 1.38.0 (tagged, decision 074), and party-kart
    `fa00deb`, pinned to v1.38.0. The grey box by São João da Ponte's chapel (parked vans and a motorhome)
    left out (`capela-sao-joao` 3 → 4); the Viriato's painted wall at its map's height, the house hidden
    behind it as in the photo (`viriato-amaral-nunes` 1 → 2, its paint not drawn): 137 of the map's walls
    drawn higher. Its premise half false: the green house is real. Found: 116 (the LiDAR's buildings on
    car parks), drafted.
  - **059** (worker-3): braga-map landed `d52d3f3`, 1.39.0 (tagged, decision 075): the map's
    sidewalks a pavement where the tiles had none under them (about 13 km off every street piece before,
    5 m after), widened from the islands alone; `liberdade` 2 → 3. party-kart's pin to v1.39.0 waits: three
    of its tests failed on the new pavements; fixed in braga-map `fdec71f`, 1.39.1 (no map sidewalk laid
    across a wall's step, but on an island), and party-kart `c8c2994`, pinned to v1.39.1, with the arenas'
    cover generator fixed (a pallet that cut a passage off, the skips' climbing boxes placed first, no
    fence flat against a thing): every arena's cover moves again.
  - **085** (worker-2): landed braga-map `35f2784`, 1.40.0 (tagged, decision 076), and party-kart
    `abef330`, pinned to v1.40.0. Ultra's textures at their finest the ~40 MB way (48 files, 44 MB), the
    ground's and bark's relief, the streets' drawings 4× finer, the card's most anisotropy; High and Low
    byte-identical. Its round at Ultra: no mark moved. Not verified: Ultra on a card smaller than the
    owner's RTX 4060 Ti (~550 MB of textures). Found: 124 (the budget's textures uncounted) and 127 (a
    round goes up at Ultra), drafted; 123 split from it.
  - **089** (worker-1): landed braga-map `80c4702` (decision 077), no version, and party-kart `4ee6d35`.
    On Ultra the near trees in the wind (a breeze in gusts, still in `?scenery` shots) and the
    deciduous kinds' limbs within 150 m; the far trees still billboards past 700 m, its first Done when
    open (128: impostors; a lit crown of each tree's shape was tried and looked worse). Its round at
    Ultra: no mark moved; High and Low the same to the pixel. Measured: the near trees' shadows are 3.7
    of 9.8 ms at `falperra`, 2560x1440 (129, drafted).
  - **051** (worker-3): landed braga-map `0d05829`, 1.41.0 (tagged, decision 078), and party-kart
    `b99b4cf`, pinned to v1.41.0. A flight of steps meets the street, the pavement or the path at its
    height, its treads snapped together: a kart goes up 131 of 140 flights from their foot (112 before),
    173 of 180 in party-kart; the walker climbs the 47 steps without falling into a crack. Its round (4
    places at Ultra): no mark moved, `travessa-fujacal`'s lowest step no longer a plinth.
  - **127** (worker-3): landed braga-map `321d1f8` (decision 079), no version. A round goes up at the
    level it's judged at: `tools/round.mjs` takes `--level`, Ultra by default for a round shot with it,
    and records it in `refs/rounds.json` (the 23 rounds there say `high`); the scorecard says a round's
    level beside its label. Not verified in a browser: the page's four text changes.
  - **The coordinator's watcher was down from 18:51 to 21:58** (not re-armed after a message), so ready
    tasks waited for their marks and turns: 102, 065, 090, 111, 112 and 059.
  - **Claude's marks, put right at 089's round** (the coordinator, 2026-10-25): rounds marked side by
    side each took their places' entries from their own branch, so some later files copied an entry
    from before an earlier landing's change. `after059` had `capela-sao-joao` back at 3 with the vans
    112 took out and `viriato-amaral-nunes` back at 1, and `after085` carried that 3 on; in all, 12
    places had an older mark or comment in a later file. Each was checked against its shot on main (089's `before089`/`after089`, Ultra) and given the
    entry of the task that changed it. `.cache/scorecard/marks/2026-10-25-after089.json` holds all 33
    as they stand: mean 2.64 (`capela-sao-joao` 4, `travessa-lobato` 3, `viriato-amaral-nunes` 2,
    `liberdade` 3). It's the file to take when the rounds go up; the files of 059 and 085 aren't.

## Read first

- `docs/tasks/done/064-the-waiting-rounds-go-up.md`: how the rounds went up the last time.
- `tools/round.mjs`, `tools/scorecard.mjs`, `test/scorecard.test.js`.
- The README's "The map page" and "The scorecard"; decision 012.

## Done when

- [ ] Every row of the first table is up, and ticked with the date.
- [ ] The owner has confirmed or changed each decision in the third table, and each task's Notes
  say which.

## Notes

- Drafted 2026-10-24 at the owner's request, before the questions of the two phases. Checked that
  day: an Artifact `read` of the scorecard's URL from this session answers "artifact not found".
- Nothing private here: no house, no address, nothing from `.cache/places.json`.
