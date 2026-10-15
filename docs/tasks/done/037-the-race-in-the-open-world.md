---
status: done
priority: high
kind: code
repo: both
created: 2026-10-14
depends-on: [034, 035, 036]
roadmap: Now · The open world
---

# 037 · The race as a game mode in the open world, on the streets at their real widths

## Why

The race is the whole game today. In the open world (decision 019) it becomes the first thing
to do in it: started from free roam, run on the same streets everyone drives at their real
widths (the 9 m the track took goes), with barriers closing the side streets it passes, and
everyone back in the world when it's over. The friends already know the Volta dos Amigos: it has
to keep racing as well as it does now.

## What

Today:

- braga-map's `tools/track.mjs` plans the Volta dos Amigos on OSM's streets and writes
  `tracks/amigos.js`: a point every 8 m with its width (`Math.max(W_MIN, carriageway(...))`,
  line 436), lanes, kerbs, surface, bank, and the start, checkpoints, item boxes, boost pads and
  eggs. Its centre line is OSM's, folded and rounded at the corners (`R_MIN`, 12 m).
- party-kart's `buildTrack` samples it every metre; the race (`src/race.ts`), the racers and items
  (`src/game/`), the bots (`steerLine` in `bot.ts`) and the autopilot all run along the samples,
  and the walls are the road's edges (`s.walls`, `s.w`).
- After task 034 the car's ground and walls come from the world, and a `Ground` can be given the
  race's walls; after task 035 every street is drawn from braga-map's surfaces (task 033); after
  task 036 the game opens in the world, and the room's lobby holds the race's settings.

Steps:

1. **The track on the streets as they are** (braga-map): `track.mjs` takes the route's centre line
   and widths from the streets' surfaces (task 033), so the track's edges are the kerbs drawn; no
   `W_MIN` in the race. It lists the side streets the route passes (`closures`: where each joins,
   its heading and width), and still prints the widths and the narrowest places. Remove `W_MIN`
   from `tools/osm.mjs` if nothing else uses it then. A new tag of braga-map for party-kart.
2. **The race's walls:** during a race the route's kerbs are walls, as the road's edges are today,
   and a row of barriers stands across each side street at the kerb's line, drawn and solid. Off
   the route everything is as in free roam. The grid on the start street at its real width.
3. **Starting one from free roam** (the owner's answers): "Corrida" in the menu gives the host the
   race's settings (race or time attack, laps or minutes, items, catch-up, bots), as the lobby does
   now; starting it puts everyone in the room on the grid at once, bots filling the empty places,
   the countdown, the race. A client sees the settings and who's in, and waits on the host.
4. **When it ends:** the results over the world, then everyone back where they were before the
   race, driving.
5. **The race at real widths:** the bots spread across the road to pass (`steerLine`), and the
   items land by sample and lateral offset (`haz`, `proj`): check each keeps on the road where the
   street is narrow. Adjust the bots and the items, never the street (decision 019).
6. **The tests** (`test/drive.test.ts`, `test/race.test.ts`) run on the world's ground with the
   race's walls: the loop of 7–10 km with its checkpoints, the autopilot's clean lap, the second lap
   of 170–290 s, and eight bots finishing a lap within 60 s of each other. If the narrow streets
   make one fail, report the numbers to the owner before changing the test.
7. **Peer id prefix:** change `PREFIX` in `src/session.ts` (the track changes).

## Questions

- [x] **The lap at real widths is 296.7 s; the test takes 170–290 s.** On the world's ground within
  the race's walls the autopilot's second lap is 296.7 s (284.8 on the track's 9 m road), with no
  respawns; eight bots finish within 3.5–7.5 s of each other. Options: (a) the test takes 170–310 s:
  the race is about 4% slower because its streets are as narrow and as bendy as they are, and the
  bound is there to catch a broken track or handling; (b) keep 290 s and let the line cut its
  corners closer to the kerbs (less than 1.2 m in), which costs the bots more scrapes; (c) keep 290 s
  and make the autopilot and the bots brake later into corners, a change to their tuning.
  Recommended: (a).
  > (a), the owner, 2026-10-15: the test takes a second lap of 170–310 s.
- [x] **The jump at full speed.** From braga-map's speed (119 km/h) to about 151 km/h a kart comes
  down on the 4 m landing street; at 155–158 km/h it flies past it and goes back onto the run-up, as
  one that falls short does (on the 9 m road it landed up to 158). Options: (a) keep it so: the
  jump wants its speed, and the autopilot and bots take it at 132 km/h; (b) widen the race's road at
  the landing over the land beside the street, so a fast kart comes down there and drives back on,
  with walls round it in the open. Recommended: (a).
  > (b), the owner, 2026-10-15: widen the landing; a kart flat out comes down beside the street
  > and drives back on, with walls round it in the open.
- [x] **Where the route takes one carriageway of a road drawn as one** (the Avenida João XXI, the
  Avenida da Liberdade and two more, 1.1 km in four rows), a row of the race's barriers runs down the
  middle, between the two. Options: (a) keep it so, as a street race closes the other carriageway;
  (b) open the other carriageway to the race, closing the side streets off it instead. Recommended:
  (a): the race's road stays the route's own streets, and the bots and items stay on its side.
  > (a), the owner, 2026-10-15: keep the barriers.

## Read first

- braga-map: `tools/track.mjs` (the widths at line 436, the kerbs, what it prints), `tools/osm.mjs`
  (`W_MIN`), `tracks/track.d.ts`, `docs/DECISIONS.md` 004, 010 and 019.
- party-kart: `CLAUDE.md` ("Gotchas": the tests guard the track and the tuning; the eight-bot test
  rolls dice), `src/track/track.ts`, `src/race.ts`, `src/game/racer.ts`, `src/game/bot.ts`,
  `src/game/items.ts`, `src/session.ts` (`Settings`, `start`, `setLapLimit`), `src/main.ts`
  (`lobbyScreen`, `startRace`, `endRace`, `resultsScreen`), `test/`.

## Done when

- [ ] `tracks/amigos.js` has the route at the streets' real widths, on their surfaces, with its
  side streets listed; braga-map tagged, party-kart pinned to it.
- [x] A race starts from free roam, puts everyone in the room on the grid, runs, shows its results,
  and puts everyone back where they were: checked with Playwright, two browsers and bots.
  > Two browsers through PeerJS's server and 2 bots: both saw 4 karts on the grid and raced, the
  > host ended it, both had the results and were back where they were (0.00 and 0.04 m); one
  > browser with 5 bots the same (0.01 m). No page errors (Notes).
- [x] No kart leaves the route during a race: the side streets' barriers and the kerbs hold.
  > party-kart's `test/drive.test.ts`: from the line, a metre at a time, 68,353 m² reachable and
  > nothing off the race's road nor 3 m under the route but under the jump; 156 of the 196 rows of
  > barriers driven at flat out, none gone through. Eight-bot races end with every bot on the road.
- [x] party-kart's `npm test` and `npm run check` pass, the lap's summary line before and after in
  Notes; braga-map's `npm test` passes.
  > 45 of 45 and the check, with the lap's bound at 170–310 s (the owner's answer); braga-map 55 of
  > 55. Before: `laps 286.9, 284.8 s; respawns 0; longest air 2.07 s; top 217 km/h; wall hits 0`;
  > after: `laps 298.5, 296.7 s; respawns 0; longest air 1.98 s; top 217 km/h; wall hits 40`.
- [ ] Shipped (party-kart's `docs/releasing.md`), live, and the owner has raced it. Tasks 035 and
  036 went live before it, on 2026-10-15 (decision 026).

## Out of scope

- A checkpoint race with shortcuts through the city, and races on other routes: new tasks when the
  owner wants them.
- Moving the route onto the real carriageway from the LiDAR: task 026.

## Notes

- Decision 019 replaced decision 004's 9 m: the race runs at the streets' real widths. It takes
  everyone in the room, put on the grid at once.
- **Found in task 033 (2026-10-14):** `track.mjs` thins the loop's line with a 3 m tolerance
  (`simplify(raw, 3)`, line 419) before rounding its corners, so on a narrow street the track's
  centre runs up to 3 m off the street's: on the Rua do Fujacal after the start, 2–3.4 m north of
  it, over the kerb of its 5.9 m carriageway. At 9 m it didn't show; at real widths it puts the
  karts on the pavement. Step 1 has to take the line from the streets' surfaces (each street's
  carriageway, task 033), not thin it.
- **Also found in task 033:** the loop's link out of a dead end (decision 010, the one way it
  leaves the streets) has no carriageway in the open world: about 60 m round (−570, 1342), where
  the track's points are 6 m and more from any street. The race needs a surface there, or a way
  round it on the streets.
- **Task 039 (drafted 2026-10-14) answers that:** the made-up link goes, and the race jumps into
  the dead end's street by a ramp. The ramp stands only during a race (the owner's answer): step
  2 puts it out with the barriers and takes it away with them, and its flight has no road, kerbs
  or walls. If 039 isn't done when this starts, do it first.
- **From task 034 (2026-10-14): the clean lap on the world's ground is this task's** (the owner's
  answer in 034). `test/drive.test.ts`'s "the autopilot drives the route on the world's ground"
  skips the two places the route's line leaves the streets (samples 621–719 at the Liberdade
  underpass, where the line runs 11 m off the street over the cutting and the autopilot drops into
  it and ends up in the tunnel; 7681–7902, the dead end's link and the hairpin before it) and
  drives the rest, 8.94 of 9.26 km, in 268.1 s with no respawns. Remove the skips when step 1 puts
  the line on the streets and 039's ramp is in. Also seen: at the João XXI's cutting, (561, 242),
  the autopilot cuts the bend's inside and falls 4.8 m into the cutting (there's no wall at a
  street's edge where it drops); the race's kerb walls (step 2) keep it on the road. The race on
  the world's ground has no boost pads yet (`WorldGround.under` says none): give the race's ground
  its pads with its walls. Make the race's ground with `ground.race(track, walls)`.

- **From task 035 (2026-10-15): what the race adds stands where the track is.** `raceMarks`
  (`src/render/road.ts`) lays the start line, the gates, the boost pads and the barriers at the
  start on the streets as drawn, but at the track's 9 m edges and along its line, up to 3 m off the
  street's middle: at `estadio` a checkpoint's pillar stands in the carriageway, and at
  `fujacal-start` and `fujacal-west` the barriers stand on the pavement and the land. They move with
  the line in step 1. The viewpoints whose camera stood on the 9 m road (those two,
  `conselheiro-lobato`, `liberdade`) now stand on a pavement or the land: shoot them again then.

### Started 2026-10-15

- **braga-map (uncommitted):** `tools/track.mjs` reads the streets the world draws (`world.streets`,
  from the open world's tiles, which don't depend on a track) and makes **the race's road**
  (`road`): the route's own streets' bands round the map's lines at their carriageway widths, the
  corners between them closed with a kerb's radius (`KERB_R`, 10 m), cut to the carriageways drawn
  (a sliver of pavement into them under 1.2 m wide taken as road), only the piece the loop runs
  through, and the jump's flight (as wide as the ramp and 2 m either side). **The line** is each
  street's own line from the map, thinned only within 0.25 m (it was `simplify(raw, 3)`); a jog
  (two corners turning opposite ways under 14 m apart) is folded, and a corner rounded to `R_MIN`,
  only as far as the line stays `CLEAR` (1.2 m) inside the race's road. **The width** is the
  street's real width (`carriageway`), never past the race's road either side of the line, the
  narrowest over 16 m, eased: no `W_MIN` in the race. **The closures** are the race's road's edge
  wherever the street drawn goes on past it (looked at 0.5 m beyond), rows of `[x, y, z]`: 188 rows,
  4.2 km in all, across every side street's mouth on the line of the route's kerb, and the longest
  (371, 316, 269 and 165 m) between a road's two carriageways drawn as one, where the route takes one
  of them (the Avenida João XXI, the Avenida da Liberdade). `tracks/track.d.ts` has `road` and
  `closures`; `tracks/amigos.js` went from 82 to 118 KB.
- **What it prints now:** on the streets, 5,055 of 5,055 points on a carriageway (today's line was
  off one in 20 places, 385 m, worst after the start and at the Liberdade underpass); within 1.2 m
  of the road's edge at one place, 2 m; widths 2.2–16.8 m, median 6.8, 25% under 6 m, 87% under 9 m
  (84% of the route was at the 9 m minimum); 19 corners tighter than 9 m (3 before); the loop 10,168
  m (10,088); the start 30 m on along the Rua do Fujacal, (−171, 782) to (−141, 775), and the plinth
  with it.
- **Two ways found and dropped:** closures by the kerb line of the route's street at each node a side
  street leaves (barriers down the middle of a road whose two carriageways are drawn as one), and by
  rays square off the line (they can't see a street leaving behind a corner the route turns, nor
  one off a road drawn beside the route's; and a straight barrier between the kerbs either side of
  a corner's mouth cut across the route). The race's road as a region is closed by construction.
- **`W_MIN` stays** in `tools/osm.mjs`: `world.mjs` still keeps the trees and its infill clear of
  every street taken 9 m wide. Its comment says so now.
- **The open world's edge moved a little** with the line (3.4816 to 3.4864 km², a few streets at
  the 120 m threshold): `npm run open`, `npm run world` (only `world/base.js` changed, no tile),
  `npm run page`; `npm run tracks` and `open` again changed nothing. `streets.mjs` exports its
  Clipper helpers for `track.mjs`.
- **braga-map's tests:** 55 of 55. "The Volta dos Amigos's streets are all there" (4 m from a
  carriageway, one run off it) became "runs on its streets": every point but the flight's on a
  carriageway; and a new one: the race's road takes in the whole line, and its closures stand on its
  edge, over a carriageway.
- **party-kart (uncommitted, braga-map installed from its working tree):** the race runs on the
  world's ground: `src/world/race.ts` (`raceGround`: the race's walls along `road`'s outline, from
  1.5 m under the road to 3 m over it at the route's level, on a deck the deck; the ramp a slope a
  kart drives up, its sides walls; fences where the road drops away beside a tunnel's mouth,
  `raceDips`; `reachable`, for the tests). `WorldGround` gives the race's boost pads, counts a kart
  that comes down under the jump's flight as fallen short, and one that comes down off the race's
  road as having left it (both respawn, at the jump on its run-up). `Racer` takes the race's ground
  and puts the cars it makes on what's under them; the bots get unstuck after 3 s still; the items
  thrown along the track keep inside the road where it narrows (`latAt`) and are drawn on the floor;
  the rows of barriers drawn with the race's banners (`raceMarks`), and the ramp's planks on the
  street at its foot; `PREFIX` `partykart-pk34-`. Docs: `CLAUDE.md`, `docs/architecture.md`,
  `docs/making-changes.md`, `README.md`.
- **Found and fixed on the way:**
  - party-kart's land held down in front of a tunnel's mouth (12 m out, 5.8 m either side) dug the
    4 m street the race takes beside the Liberdade underpass to 1 m from its middle, in free roam
    too: now not on another street's carriageway (`land.ts`). The race then fences only 7 m there.
  - A bump moved a kart without looking at walls, through a thin one, and a rocket's launch lifted
    one 2 m, over the race's walls: a bumped kart is pushed back out of any wall it was moved
    through (`nudge`, round the city too), and the walls stand 3 m over the road.
  - Two of three eight-bot races left a bot stuck (beside the landing street, and between the
    Avenida Robert Smith's two decks) until those fixes and the bots' unstick.
- **The jump at full speed.** On the world's ground, from braga-map's speed (119 km/h) to about
  151 km/h a kart comes down on the landing street; at 155–158 km/h it flew past that 4 m street, off
  the race's road, and went back onto the run-up (on the track's 9 m road it landed up to 158 km/h).
  The owner chose to widen the landing (Questions): the race's road takes in the flight on past the
  landing as far as a kart flat out comes down (44 m/s at the ramp's foot, less what the slope costs:
  33 m past it) and 6 m more, 39 m, over the ground beside the street, walled in the open; a kart
  flat out comes down there, 15 m on, and drives back. The autopilot and the bots take the jump at
  `rampSpeed` (132 km/h). The test: 119–158 km/h come down on the race's road; a slow one goes back.
- **The lap's summary lines.** Before, on the track's 9 m road: `laps 286.9, 284.8 s; respawns 0;
  longest air 2.07 s; top 217 km/h; wall hits 0`. After, on the world's ground within the race's
  walls: `laps 298.5, 296.7 s; respawns 0; longest air 1.98 s; top 217 km/h; wall hits 40`. The
  extra 12 s is spread over the lap (+0.3 to +2 s each 500 m): the line follows each street's own
  bends, and 16 more corners are tighter than 9 m to keep inside the narrow streets. The wall hits
  are the autopilot cutting corners in narrow lanes (roundabouts, slip roads); a shorter look ahead
  makes it weave and lose more. **The second lap, 296.7 s, is over the test's 170–290 s**: for the
  owner (Questions). Eight bots, three runs: finishes within 3.5–7.5 s of each other (the test
  takes 60), 38–55 hits, 6–8 leaders (today: within 7.5 s).
- **party-kart's tests:** 45 of 45 with the lap's bound at 170–310 s (the owner's answer), the race
  taking in the jump's landing; `npm run check` and `npm run build` pass. Eight bots after both:
  finishes within 1.8–12.7 s in four runs, 0–13 respawns, nearly all a bot freeing itself after
  clipping the fences by the Liberdade and João XXI underpasses (a 3.5–4 m lane by a cutting, whose
  2 m ground slopes away a metre out) or coming down past the landing street. New: the race closed (68,192 m² reachable from the line, nothing off the race's road
  nor 3 m under the route but under the jump), and 155 of the 196 rows of barriers driven at flat
  out from 6 or 4 m in, none gone through. The old test of the route on the world's ground with its
  two skips went: the lap test is on the world's ground now.
- **Checked with Playwright** (a dev server, PeerJS's server): one browser from free roam, the menu's
  Corrida with 5 bots: 6 on the grid on the start street, the autopilot through the start and up
  the Avenida, the host ended it, back exactly where it was (0.01 m), no errors. Two browsers: B
  followed A's invite and was put 12 m from A; A started a race with 2 bots: both saw 4 karts and
  raced; A ended it: both back where they were (0.00 and 0.04 m), no errors. Shots of the rows of
  barriers across side streets, the long row down the avenue, and the fence at the Liberdade
  underpass, with `?view=` in a race.
- **Not checked:** by hand, on a phone, the feel of the narrow streets.

### Finished 2026-10-15

- **Shot again:** all 29 viewpoints at High, Medium and Low, `shots/2026-10-15-task037/` (party-kart,
  `scripts/shots.mjs task037 --medium`). Against `2026-10-15-rampa`: no viewpoint worse. At
  `fujacal-start` the plinth stands further back along the street with the start (2 draw calls
  more, its sign no longer hanging into the sky over the street); a street's plate moved with the
  line at `bernardo-sequeira`; everything else the same. The race's marks aren't in a round's shots
  (`?scenery`), so **no round was posted**: it would show nothing new, and close "Mundo aberto" to
  marks before the owner has rated it (as task 039 did).
- **The budget** (task 004), in party-kart's `docs/architecture.md`: the download 7.30 MB, 2.21 MB
  gzipped (7.24 and 2.19); round the city the same draw calls but at `fujacal-start`, within 3,000
  triangles everywhere; in a race the rows of barriers about 1,000 triangles and no draw call more,
  the race's ground built in about 60 ms.
- **Decision 029:** the race runs on its own streets as they're drawn, walled at their edges.
  `README.md`, `index.d.ts`, `tracks/track.d.ts` and the roadmap updated; task 026 told how the
  race follows the streets when it moves them.
- **Found, for other tasks:** slivers in the streets' surfaces (task 048); party-kart's stadium
  bowl holds the street beside it 1.2 m under the LiDAR (task 049).
