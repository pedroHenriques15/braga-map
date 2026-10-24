---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [105]
roadmap: Games · More tracks and the shooter
---

# 114 · Bots keep their distance on the jump's run-up, so a pile-up doesn't send them short of it

## Why

With the karts 2.8 m long (task 105), the bots fall short of the Volta dos Amigos' jump about three
times as often as before: put back on its run-up 35 times in 32 seeded eight-bot races, against 12 on
the old karts (task 105's Notes). Nearly all come after a pile-up on the run-up: the bots drive its
middle in single file and pass nobody, one hit by an item stops 16 m before the ramp, and the ones
behind run into it and take the ramp too slow. A race the friends play with bots looks broken there.

## What

Today: the bots' lines (`src/game/bot.ts`, `steerLine`: they spread across the road to pass) and
the autopilot's speed onto the ramp (`SHORT` in `src/car/autopilot.ts`, decision 044) don't account
for a kart stopped ahead on the run-up; the race's tests ("eight bots race a lap…", "the autopilot
flies the jump's flight") don't count a bot put back on the run-up.

1. **Measure it in a test:** over the seeded eight-bot races, how many times a bot is put back on the
   jump's run-up, with today's karts (task 105's 35 in 32 races) as the figure to beat.
2. **Keep their distance:** on a jump's run-up, a bot leaves a gap to the kart ahead it can stop or
   steer round in, and goes round a kart stopped on it (left or right, as the road's width allows)
   rather than into it; one that has lost its speed doesn't take the ramp but goes round and back
   (as a player would brake and line up again), or is put back as now only when it can't.
3. The test's figure back to about the old karts' (12 in 32), and the race's other tests passing.

## Read first

- party-kart's `CLAUDE.md` ("Gotchas": the tests that guard the tracks), `src/game/bot.ts`,
  `src/car/autopilot.ts`, `test/race.test.ts`, `test/drive.test.ts`; braga-map's decision 044;
  task 105's Notes.

## Done when

- [ ] The test counts the bots put back on the jump's run-up, and it's no more than about 12 in 32
  seeded races.
- [ ] `npm test` and `npm run check` pass.

## Notes

- Found by worker-1 in task 105 (2026-10-24), drafted by the coordinator; given to worker-1 next.
