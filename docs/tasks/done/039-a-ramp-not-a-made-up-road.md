---
status: done
priority: high
kind: code
repo: both
created: 2026-10-14
depends-on: [047]
roadmap: Now · The open world
---

# 039 · Into the dead end by a ramp, not a made-up road

## Why

The Volta dos Amigos leaves Braga's streets in one place: an 86 m road that doesn't exist, drawn
straight from the dead end of one waypoint's street to the next street south, so the loop can
drive through that street. The owner wants the map as real as it can be, with the easter eggs as
the only jokes. The made-up road goes, and the race gets into that street the way a kart game
would: a ramp on a real street that jumps it onto another real street, with no road in between.

## What

Today:

- `tools/track.mjs` (step 1, the `joins`, lines 121–168) joins every dead end of a waypoint's
  street within 400 m to the nearest street ahead of it: a straight, two-way `(joined)` edge
  priced as a residential street. There's one today, 86 m (`amigos.joins` in `map/tracks.json`).
  `(joined)` is also used in `through()` (line 227), `rowStreets` (line 645), the street names
  (line 707), and the `joins` written to `map/tracks.json` (lines 315 and 790). Decision 010
  calls these links "the one way the loop leaves the streets", and task 027 kept them because a
  note on the shared map asked for them.
- In OSM, that waypoint's street has only one way in: its mouth on a secondary road. 109 m from
  its dead end a second street branches off it, runs alongside it about 4 m lower for about
  280 m, and doesn't lead anywhere either. Together they're a pocket with one way in. The
  waypoint is between that junction and the mouth, not on the dead-end stretch.
- Without the link the planner finds no loop at all ("No loop through the waypoints."; a
  scratch copy of `track.mjs` with the join turned off, 2026-10-14). In the one order allowed,
  the leg into the waypoint from the junction's side can't be routed, and neither can the leg
  out of it that way. Nothing leads in or out of the pocket except past the waypoint, and the
  planner never turns back.
- The shortest jumps into the pocket from a street a car may use outside it (measured
  2026-10-14 from OSM and DGT's 50 cm terrain; OSM shows nothing in between):

  | From | Gap | Height | Onto |
  |---|---|---|---|
  | The street the old link landed on | 40 m | 5 m down | The dead end of the waypoint's street |
  | The same street | 39 m | 9 m down | The lower street |
  | A street to the south-west | 44 m | 1.5 m down | The lower street's far end |
  | A street across the Rio Este | 47 m | level | The lower street's top end, by the junction |

  Longer ones, from the secondary road, are 76 m and 12–19 m down. None has been checked against
  the LiDAR's surface model for walls, trees, sheds, or buildings OSM lacks.
- party-kart's car already flies off ramps and crests and lands wherever the road is
  (`src/car/car.ts`: `G` 12 m/s², `VMAX` 44 m/s, `VBOOST` 60 m/s). A kart that falls off the road
  respawns (`FALL_RESPAWN`). Its first, invented track had a `lip` and a `kicker`
  (`src/track/layout.ts`). The race is built from `tracks/amigos.js`'s points (`buildTrack` in
  `src/main.ts`).

Steps. Run `git status` in both repositories first: task 033's work is in this tree uncommitted
(`tools/streets.mjs`, `index.js`, `package.json`, `world/tiles/`). Never overwrite or revert it.

1. **No made-up roads:** take the `joins` out of `tools/track.mjs`, along with every use of
   `(joined)`. The map's streets are the only roads the planner knows.
2. **Jumps, only where they're needed:** when a waypoint's street can't be driven through
   without turning back, the planner adds candidate jumps into its pocket. A jump is a one-way
   edge from a takeoff on a street a car may use outside the pocket to a landing on a real street
   inside it. In, then out by the real mouth: the owner's choice. Keep a candidate only if:
   - the gap is short enough for a kart to clear from a ramp it can take at racing speed (the
     table's four are all in reach of a 10–20° ramp);
   - the landing is a straight stretch long enough to land on, heading the way the loop goes on;
   - nothing stands in the flight's way, by the LiDAR's surface model (`.cache/dgt/`, read by
     `tools/dgt.mjs`), with a margin under the arc.

   Price a jump so the loop only uses one where it has to.
3. **Show the owner before building it.** Print each candidate and the loop each one gives
   (length, the streets, what's under the flight), with the planner's pick. Shoot the chosen
   jump from above and from the kart. The owner approves the pick. Stop here if they don't.
4. **Write it for the games.** Write the ramp into `tracks/amigos.js` and its type in
   `tracks/track.d.ts`: where it stands, its heading, width, length and angle, the landing, and
   which stretch of the line is in the air (no road, no kerbs, no walls there). Write it into
   `map/tracks.json` in place of `joins`. Add a test: every point of the track is on a street a
   car may use, its way round, except a ramp's flight (extend `test/rules.test.js` or add one
   beside it). Bump braga-map's version and tag it.
5. **In party-kart,** pin the new tag:
   - Draw the ramp as a Braga joke (the owner's answer): a slope of planks on a pile of rubble,
     behind an "obras" sign, as if the city's roadworks had left it there. The planks are what the
     kart drives up, at the planned angle; the rubble round them is only drawn. It can share the
     red-and-white boards of the race's road-works barriers (party-kart's `tex.roadworks`), so it
     reads as the same works. Leave the gap as it really is: the ground, the walls and whatever
     stands there, with no road over it.
   - The kart flies off the ramp and lands on the landing street. One that falls short respawns
     on the run-up.
   - The bots and the autopilot take it at a speed that clears it. Put a boost pad on the run-up
     if they need it.
   - The race counts across the gap: positions, laps, checkpoints (none in the air), item boxes,
     and items that follow the road.
   - Takeoff and landing sound like a kart's (the car's `landed`).
   - The tests that bound the loop's length (7–10 km) and a lap's time still hold, or are
     changed knowingly.
6. **Record it:** add a decision ("The map is real; the race jumps into a dead end"). It
   replaces decision 010's "Not a departure" bullet and adds the ramp to decision 004's list of
   departures. Update `README.md` where the track is described, and party-kart's docs.

Stop and report if an assumption here is false. If the owner knows a real way into the pocket
that OSM lacks (a lane, a ford, a street not mapped), that's an OSM fix (task 006), not a ramp.

## Questions

- [x] Without the link, how does the race reach the waypoint: a ramp into the pocket and out by
  the mouth (recommended), no ramp and the race passes the street's mouth, or in and turn round?
  > A ramp in, out by the real mouth (the owner, 2026-10-14).
- [x] Where does the ramp jump from: the planner picks the best of the candidates and the owner
  approves it (recommended), or one of the four in the table?
  > The planner picks, the owner approves (2026-10-14). That's step 3.
- [x] In the open world (decision 019), is the ramp there all the time, like the eggs
  (recommended), or only during a race?
  > Only in a race (the owner, 2026-10-14). Free roam stays all real; the ramp comes and goes
  > with the race's barriers.
- [x] What does the ramp look like? (a) A plain stunt kicker: steel or timber, with chevrons. It
  reads as a game object and doesn't pretend to be Braga (recommended). (b) A Braga joke: planks
  on a pile of rubble behind an "obras" sign, for the city's roadworks. (c) Granite setts,
  like the street it stands on. Not blocking until step 5.
  > (b), the Braga joke: planks on rubble behind an "obras" sign (the owner, 2026-10-15).
- [x] Step 3: the planner's pick, a jump over the Rio Este (59 m, level, a 20° ramp, cleared from
  32.5 m/s), which makes the loop 10.09 km instead of 9.27; or jump 3, from the old road's street
  onto the dead-end stretch (9.28 km), which turns 51° onto the ramp; or stop?
  > The river jump (the owner, 2026-10-15, after the view from above, the flight side on and the
  > kart's-eye shots). party-kart's 7–10 km bound on the loop's length changes knowingly.
- [x] With the river jump about 1 km of the loop runs outside the open world (it swings west by
  Ponte Pedrinha to come down the run-up from the north): grow the area round the new loop (3.12 to
  3.48 km², 124 gates instead of 121, the world's tiles made again), switch to jump 3, or stop?
  > Grow it round the new loop (the owner, 2026-10-15).

## Read first

- `tools/track.mjs`, step 1: the graph, `snap`, the `joins`, `route`, `through`, `loopThrough`;
  and step 6, the output.
- `docs/DECISIONS.md`, 004 (departures on purpose), 010 (the rules of the road and the
  `(joined)` links), 014 (the eggs on the houses, what stays private) and 019 (the open world).
- `docs/tasks/done/027-rules-of-the-road.md`: why the links stayed.
- `tracks/track.d.ts` and `test/rules.test.js`.
- party-kart: `CLAUDE.md`, `src/car/car.ts` (flying and landing), `src/track/track.ts`
  (`buildTrack`), `src/track/layout.ts` (the old `lip` and `kicker`), `src/main.ts`, the bots in
  `src/game/`, and `docs/releasing.md`.

## Done when

- [x] `tools/track.mjs` has no `(joined)` edges. The loop is on the map's streets everywhere
  except one ramp's flight, and a test checks that: `test/rules.test.js`, "no track leaves the
  streets but in a ramp's flight" (every step within 10 m of a street a car may use; the new track
  is within 7.1 m everywhere, the old one's link 26 m off).
- [x] The jump was shown to the owner before it was built, and they approved it (step 3): from
  above over the orthophoto, side on with the LiDAR and the flights, and from the kart in the game,
  with every candidate and why it was or wasn't kept (2026-10-15).
- [x] In party-kart the race takes the ramp, lap after lap: a player at racing speed, the bots
  and the autopilot clear it and land on the street. A kart that falls short respawns on the
  run-up. Positions and checkpoints are right across it. `test/drive.test.ts`: from braga-map's
  speed to 158 km/h it lands 3 to 24 m past the landing point, on the carriageway; too slow, it
  falls and respawns 50 m back on the run-up at the speed that clears it. The autopilot laps it with
  no respawns (287.0 and 284.9 s). Eight bots with items all finish, within 9 s of each other; a bot
  falls in 0 to 6 times a race, always after an item or a bump on the run-up or the ramp (logged:
  shrunk by a martelinho, launched by a foguete, run into on the lip), never on a clean run.
- [x] Nothing is drawn over the gap but what's really there: the ramp ends at its lip, and the
  flight has no road, kerbs or walls (`raceMarks`, up only in a race).
- [x] No viewpoint shows the link today; the nearest, `couteiro`, stands about 200 m south
  looking north. Shoot it again at High and Low: it's no worse (`shots/2026-10-15-rampa/`, the
  same as `2026-10-15-mundo-aberto`; it's off the route now, task 047). The kart's-eye shots of the
  old link's place and of the ramp went to the owner (scratch, not committed: they show the
  waypoint's street). That shot isn't a scorecard viewpoint, since there's no open photo there
  (decision 009).
- [x] The budget is measured (task 004): the ramp is about 10 draw calls, in a race only. The grown
  city round the new loop is 3 fewer to 17 more draw calls a viewpoint, up to 0.16 M more
  triangles, 6 MB more textures on High, and the download 7.24 MB, 2.19 MB gzipped (6.83 and 2.08):
  party-kart's `docs/architecture.md`.
- [x] `npm test` here (54 of 54), and `npm test` (44 of 44) and `npm run check` in party-kart, pass,
  with braga-map's tree installed in party-kart (`--install-links`).
- [x] The decision is recorded (027, and 028 for task 047), and `README.md` and party-kart's docs
  say how the race gets there.

## Out of scope

- The ramp in the open world: task 037 puts it out with the race's barriers and takes it away
  when the race ends (the owner's answer). Free roam (036) has no ramp.
- Fixing OSM where it's wrong about the pocket: task 006.
- The houses down that street (`rows`, `tools/world.mjs`): unchanged.
- Other jumps for fun elsewhere on the route.

## Notes

- Drafted 2026-10-14 at the owner's request. The geography, the candidates and "no loop without
  the link" were measured with scratch scripts and a scratch copy of `track.mjs`; nothing in
  the repository was run or changed. Not verified: what the LiDAR's surface model shows along
  each candidate's flight, the turn from each landing onto the loop, and how long the new loop
  is.
- Timing with 037: done before 037, the ramp is built into today's race and 037 carries it into
  the open world with the race's barriers. 037's text doesn't mention the link or the ramp yet.
  It's being edited in another session, so it wasn't touched here.
- Privacy: the task never names the street. The old link's ends are already public in
  `map/tracks.json`. With the eggs on the houses (decision 014), that says no more than the
  repository already does.
- **Started 2026-10-15.** `tools/track.mjs` has no `joins` and no `(joined)`; it finds the pocket
  past a waypoint (the side of its street that leads to fewer than 300 nodes) and every jump into
  it: takeoffs every 2 m on streets a car may use within reach, landings every 2 m on the pocket's
  streets heading for the waypoint, the flight at party-kart's gravity (12 m/s²) from an 8 m ramp
  of 10–20°, the gentlest that clears what DGT's surface model has under the slowest flight that
  lands (`JUMP` in track.mjs). A jump is kept if it turns at most 25° onto the ramp and 40° off the
  flight, with 40 m of straight run-up and 25 m of landing. The run-up is a street of its own in
  the graph (copies of its nodes, joined only at its start), so the loop comes straight down it.
  Seven candidates, one kept: from the end of a straight street west of the Rio Este, over the
  T-junction there and the river, onto the lower street's top end (59 m, level, a 20° ramp, 2.7 m
  high, cleared from 32.5 m/s, 0.7 m over the river's trees). The others turn 41–60° onto their
  ramp (the three from the old road's street and the river bank's street), or have a 7 m run-up, or
  hit a roof. Not measured: how a kart lands at more than 33 m/s, when it comes down beyond the
  28 m of landing street (37 m/s lands about 22 m past the landing point, 13 m to the side of the
  street, on the open ground there; 44 m/s reaches the trees beyond).
- The loop with it: 10,088 m of centre line (9,274 before), round by Ponte Pedrinha and down the
  run-up from the north; 0 m against the traffic, 0 banned turns, no clashes. The owner saw it from
  above, side on and from the kart (scratch pages, not committed: they show the waypoint's street)
  and approved it, then chose to grow the open world round the new loop: `npm run open` (3.12 to
  3.48 km²), `npm run world`, `npm run page`.
- **Found by the grown area (2026-10-15), four tests fail:** the new loop passes the Rotunda Santos
  da Cunha, by the end of the Avenida Conde Dom Henrique's viaduct, where the map has the deck
  1.2–3.3 m over the streets under it (`levels.test.js`, four crossings 11–55 m from the route);
  the edge crosses a street 72° from square at (-879, 852) (`open.test.js`); two decks' ends and
  two tunnels' mouths in the new part are 0.12–0.88 m off their street's slope
  (`streets.test.js`, task 043's kind); and the viewpoint `couteiro` is 61 m from the route, which
  no longer takes that stretch of its street (`viewpoints.test.js`). A loop kept off that junction
  goes up the river bank's street through the ramp's own junction and comes back round a block
  down the run-up: worse.
- **Task 047** (drafted and done 2026-10-15, at the owner's choice) fixed the grown area: the
  Rotunda Santos da Cunha's viaduct at the LiDAR's height (decision 028), the edge squared in up to
  12 rounds, `couteiro` off the route, OSM's outline of the junction and the tunnel's two mouths
  named in the tests.
- **Done in party-kart** (uncommitted, with braga-map's tree installed): the layout's `air` and the
  track's `ramps` (`buildTrack(points, ramps)`, `rampSpeed`); `trackGround` with no road or walls
  in a flight, a kart 3 m under its line fallen; `respawn` on the run-up after a fall at a jump
  (`jumpAt`); the autopilot at `rampSpeed` on the run-up, the corners past the lip not counted
  until it's landed; the bots drink no café near a jump; the ramp drawn with the race's marks
  (planks on rubble, the road works' boards, an "OBRAS" sign); the peer id prefix
  `partykart-pk33-`; the tests (the jump and its respawn, the loop up to 10.5 km, the world-ground
  drive skipping the jump until task 037 puts the ramp in the world).
- **Speed at the lip.** Going up the ramp costs a kart about 6% of its speed (what isn't along the
  slope) and the climb about 1 m/s: bots at braga-map's 32.5 m/s left the lip at 28–31 and mostly
  still cleared it. The autopilot and a respawn take it at `rampSpeed`, the speed at its foot that
  leaves braga-map's at the lip with 2 m/s in hand: 36.6 m/s.
- **Not done, for the owner:** committing, braga-map's tag `v1.10.0` and party-kart's pin to it;
  the deploy; a round on the scorecard. Not checked: the race in a browser with a room (it needs
  PeerJS's server), and the feel of the jump by hand. A street lamp on the river's west bank stands
  in the flight's way: in the race the karts fly through it (the race's ground has no lamps).
