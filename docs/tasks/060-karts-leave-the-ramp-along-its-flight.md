---
status: todo
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

## Questions

None.

## Read first

- party-kart: `src/car/autopilot.ts`, `src/car/car.ts` (`stepCar`, the grip, the air), `src/game/bot.ts`,
  `src/track/track.ts` (`rampSpeed`), `test/drive.test.ts` (the jump's test).
- braga-map: decisions 027, 029 and 042, task 057's notes.

## Done when

- [ ] The autopilot leaves the lip within 1° of the flight at every line and caution, and comes down
  within 1 m of the line.
- [ ] Over six races of eight bots, fewer wall hits and respawns within 60 m of the landing than task
  057's 24 and 7; party-kart's `npm test` and `npm run check` pass.

## Out of scope

- The track, the ramp and the race's road: braga-map's, as task 057 left them.

## Notes

- Found by task 057 (2026-10-17), whose landing works with the karts as they fly.
