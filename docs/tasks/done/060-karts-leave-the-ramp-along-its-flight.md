---
status: done
priority: low
kind: code
repo: party-kart
created: 2026-10-17
depends-on: [057]
roadmap: Phase 2 · The shape
---

# 060 · The autopilot and the bots leave the ramp along its flight

## Why

The Volta dos Amigos' run-up turns 8° onto the ramp at its foot, 7.5 m before the lip (braga-map's
`ramps`, decision 027). party-kart's autopilot, which the bots drive with, is still turning when it
takes off: its velocity is 4–6° left of the flight at the lip, and it comes down about 4 m left of
the line (task 057's probe: 0.1 m right at the lip, 3.4 m left 52 m on, 4.5 m at the landing). The
lot north of the landing is walled, a 2.75 m wall the flight crosses 6 m short of the landing and a
3.18 m wall along the landing street's kerb. Task 057 took that corner into the race and a race
takes its walls down (decision 042), so the karts land there and drive on. But they still come down
beside the line rather than on it, and over six races of eight bots there were 24 wall hits and 7
respawns within 60 m of the landing: the outside of the turn, the street's south kerb 13 m on; the
corner of the building at the corner's far end, for those that come down furthest left; and a few
short of the landing.

## What

- In `src/car/autopilot.ts`, from the ramp's foot to its lip, the autopilot holds the ramp's axis
  (the line from `foot` to `lip`), so its velocity at the lip is along the flight within 1°. Task
  057's tries that didn't work: aiming at the landing point from 40–60 m before the lip (it cuts
  across the run-up, clips the ramp's side and falls into the river), or over the last 10–20 m (the
  kart turns, but its velocity lags its heading through the grip, and it still flies 3 m left).
  Something that steers on the velocity's heading rather than the yaw, with the lateral offset from
  the axis, at the ramp's foot.
- The bots' `line` (where across the road they drive) goes to the middle from the run-up to the lip,
  as their speed already goes to `rampSpeed` there.
- Measure as task 057 did: the autopilot from 200 m before the lip at three lines and two cautions,
  and races of eight bots, the hits and respawns within 60 m of the landing and what each was
  against.
- Added on starting (Questions, Notes): the landing, in `autopilot.ts` too. Flying the line alone
  lands a kart where the landing street turns 35° left and narrows, and it goes wide. So the
  autopilot takes the ramp a little slower than `rampSpeed` (about 110 km/h off the lip, where it
  was 118), to come down a metre or two short of the landing, in the corner the race takes in
  (decision 042), with room to turn; it turns its nose towards the landing street in the air, where
  the nose turns and the velocity doesn't; and once down it brakes for the turn its velocity still
  has to make.

## Questions

- [x] Flying the line alone makes the landing worse (Notes: over 12 races, 81 hits and 60 respawns
  within 60 m of the landing, against 76 and 46 before). How should 060 go on? Options: widen 060 to
  the landing, all in `autopilot.ts` (the ramp at about 110 km/h off the lip, the nose turned to the
  street in the air, braking for the turn after touchdown; recommended: 65 hits and 35 respawns over
  24 races, against 93 and 53); land 060 as written, its second "Done when" failing, and draft the
  landing as a new task; or stop, draft the landing, and land nothing.
  > Widen 060 (the owner, 2026-10-18).

## Read first

- party-kart: `src/car/autopilot.ts`, `src/car/car.ts` (`stepCar`, the grip, the air), `src/game/bot.ts`,
  `src/track/track.ts` (`rampSpeed`), `test/drive.test.ts` (the jump's test).
- braga-map: decisions 027, 029 and 042, task 057's notes.

## Done when

- [x] The autopilot leaves the lip within 1° of the flight at every line and caution, and comes down
  within 1 m of the line.
  > From 200 m before the lip at lines -0.5, 0 and 0.5 and cautions 1 and 1.27: its velocity within
  > 0.8° of the flight at the lip and 0.14° once the grip has let it go (it was 5.8–6.5° left), down
  > within 0.16 m of the line (3.2–4.9 m left). party-kart's new test "the autopilot flies the jump's
  > flight from any line, and turns into the landing street clean" holds it to 1° and 1 m. In races
  > the bots leave within 0.2° and 0.1 m.
- [x] Over six races of eight bots, fewer wall hits and respawns within 60 m of the landing than task
  057's 24 and 7, and than before on the same probe; party-kart's `npm test` and `npm run check`
  pass.
  > On braga-map 1.23.0, the same six seeded races: 5 hits and 4 respawns, before 33 and 15 (057's
  > count 24 and 7). Over 48: 21 and 36, before 206 and 98. On 1.22.0, the six: 0 and 0, before 22
  > and 15. `npm run check` clean, 64 tests pass on 1.23.0 (the autopilot's laps 302.1 and 300.1 s;
  > eight bots within 2.7 s, no respawn).
- [x] The autopilot comes down off the jump and turns into the landing street with no wall hit, at
  every line and caution.
  > No wall hit within 3 s of coming down at any of the six, in the same test. A lap in the browser
  > (`?autodrive`, three bots, Playwright): 301.2 s, the four within 2 s of each other, over the jump
  > 0.0 m off the line, down 60 m on and into the street, no respawn, no page error.

## Out of scope

- The track, the ramp and the race's road: braga-map's, as task 057 left them.

## Notes

- Found by task 057 (2026-10-17), whose landing works with the karts as they fly.
- **Started 2026-10-18** in worktrees of both repos (`../party-kart-060`, `../braga-map-060`, branch
  `task-060`), from party-kart `96b3ebb` on braga-map 1.22.0. Measured with a scratch probe in
  party-kart (not committed): the autopilot from 200 m before the lip at lines -0.5, 0 and 0.5 and
  cautions 1 and 1.27; races of eight bots (seeded brains, one lap), each hit (a wall step over 3 m/s,
  as the game sounds it) and respawn (fallen, or unstuck after 3 s) within 60 m of the landing, and
  what it was against (the race's edge, a wall, a building).
  - **Before:** the autopilot's velocity 5.8–6.5° left of the flight at the lip, down 3.2–4.9 m left
    of the line, as task 057 found. Six races: 25 hits and 16 respawns (and 31 and 19 on a second run:
    the bots' items roll `Math.random`); 12 races 76 and 46, 24 races 93 and 53. My respawns count
    the bots unstuck after 3 s against a wall, which 057's 7 may not have.
  - **The run-up comes in from the right of the axis at about 9°**, crossing it near the lip: the
    track's line kinks 24° in the last two metres before the foot. Steering the velocity onto the axis
    from the foot alone is too late (the grip turns it a tenth of a second behind the nose); from
    18 m before the foot, with state feedback on the offset, the velocity's heading and the nose's
    lead over it, it leaves within 0.25° of the flight and comes down within 0.2 m of the line at
    every line and caution. The grip still turns the kart for 0.12 s off the lip, so the steering
    holds the flight 6 m past it.
  - **An assumption was false: on the line, the bots land worse.** The landing street turns about 35°
    left at the landing point and narrows from 5 m to 3.5 m. Coming down 4 m left, a kart landed in
    the corner the race takes in, on the inside of that turn; on the line it lands where the street
    turns, goes wide onto its south kerb 11–13 m on, or straight on into the flight's overrun, stuck at
    its end at (-552, 1172). Over 12 races, the axis and the bots' line alone: 81 hits and 60
    respawns, against 76 and 46. Reported to the owner, who chose to widen 060 (Questions).
  - **The take-off speed decides the landing** (24 races, about 195 take-offs each): before, 22 of 27
    clean from 105–111 km/h at the lip and 57 of 59 from 112–117 (coming down left), 7 of 31 from 118
    up. On the line, 91% clean from 105–111 km/h, 39% from 112–117, 15% from 118 up. The autopilot
    took the ramp at `rampSpeed` (37.1 m/s at its foot, 118 km/h off the lip); the bots more careful
    than 1 came off slower only because their corner check braked for the kink at the foot.
  - **Widened** (the owner's answer), all in party-kart's `src/car/autopilot.ts` and the bots' line
    (decision 044): the speed onto the ramp 2.1 m/s under `rampSpeed`, the corner check stopping where
    the steering onto the axis starts (it drives that straight), so every caution comes off at the
    same speed; up the ramp no throttle, as a slipstream's pull up it put bots behind others 3 m/s
    faster (all on the middle line, they draft each other), unless the kart is under braga-map's speed
    less 4 m/s; in the air the nose turned to the landing street, 16 m past the landing; down, to 60 m
    past the landing, its speed held to the turn from where its velocity goes to the road 8 m on (to
    30 m, the street's second bend, 3 m wide and 45° left, 43 m on, took 50 hits in 24 races; that
    check everywhere costs the autopilot 8 s a lap, so only there); the bots' middle line and no
    passing from the run-up to 30 m past the landing (`jumpAt`), not to the lip alone.
  - **Found while tuning:** a bot slowed on the ramp coasted to a standstill there, was put back at the
    lip standing, and coasted again, 46–50 times a race; hence the throttle under braga-map's speed
    less 4 m/s.
  - **What else was tried:** the bots kept off the middle on the run-up (24 races: 56 hits, 16
    respawns, against 58 and 5); 1.6 m/s under `rampSpeed`, the bots off the middle (69 hits and 28
    respawns, against 56 and 16 at 2.1); braking only above the target plus 2 m/s onto the ramp (bots
    arriving fast).
  - **Measured last on the merged code** (party-kart with 019's trees, braga-map 1.23.0), the original
    `autopilot.ts` and `bot.ts` copied into the probe for "before", on the same 48 seeds: 206 hits and
    98 respawns before, 21 and 36 after; from 45 m past the lip on, where karts come down, 146 and 46
    before, 2 and 1 after. The rest is in the flight: karts that came to the lip at 31–75 km/h, stopped
    by an item or a bump, falling into the Rio Este (35, before 52). On 1.22.0 the same 48: 187 and 94
    before, 16 and 15 after. The trees under the flight stand 8–10 m below it.
  - **No viewpoint shot and no round:** nothing drawn changed. No budget: no geometry.
  - **Not checked:** the race with friends in a room; a player's jump (the autopilot and bots only);
    the deploy (not asked).
- **Landed 2026-10-18,** party-kart `52dec10` on braga-map 1.23.0 (`origin/main`, merged with 019's
  work); no braga-map tag. Not deployed.
