---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-14
depends-on: []
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

- [ ] `tools/track.mjs` has no `(joined)` edges. The loop is on the map's streets everywhere
  except one ramp's flight, and a test checks that.
- [ ] The jump was shown to the owner before it was built, and they approved it (step 3).
- [ ] In party-kart the race takes the ramp, lap after lap: a player at racing speed, the bots
  and the autopilot clear it and land on the street. A kart that falls short respawns on the
  run-up. Positions and checkpoints are right across it.
- [ ] Nothing is drawn over the gap but what's really there.
- [ ] No viewpoint shows the link today; the nearest, `couteiro`, stands about 200 m south
  looking north. Shoot it again at High and Low: it's no worse. The kart's-eye shot of the old
  link and of the ramp, before and after, went to the owner. That shot isn't a scorecard
  viewpoint, since there's no open photo there (decision 009).
- [ ] The budget is measured (task 004): one ramp should make no visible difference.
- [ ] `npm test` here, and `npm test` and `npm run check` in party-kart, pass.
- [ ] The decision is recorded, and `README.md` and party-kart's docs say how the race gets there.

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
