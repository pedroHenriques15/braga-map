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
