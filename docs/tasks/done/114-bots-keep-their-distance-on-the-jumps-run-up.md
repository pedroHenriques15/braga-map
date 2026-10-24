---
status: done
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

- [x] The test counts the bots put back on the jump's run-up, and it's no more than about 12 in 32
  seeded races. The test (`test/race.test.ts`) counts them over 32 seeded packs of eight with a
  pudim on the run-up (44, 32 of them the ones it hit, where it was 85; at most 20 more than those
  hit); task 105's 32 full races take 160 s, so they're counted by scratch scripts, over 64: 24, 12
  per 32, where it was 56 (Notes).
- [x] `npm test` and `npm run check` pass: 150 of 150 on party-kart ae5d387 with braga-map 1.36.0.

## Notes

- Found by worker-1 in task 105 (2026-10-24), drafted by the coordinator; given to worker-1 next.
- **Done (2026-10-24, worker-1), party-kart:**
  - **Going round** (`steerLine` in `src/game/bot.ts`): from 70 m before the run-up to the ramp's
    foot, a bot looks for a kart it would catch before that kart is well off the lip (10 m and a
    kart's length past it), or one alongside till it's a length behind. It judges where that kart
    will be when it gets there, across the road at that kart's own sample (the run-up bends a
    little: across the bot's own, a kart 40 m on was a metre and more out), and by which way it's
    going. It goes round on the side it's on, a little more than a kart's width off it and as far as
    the kerb, if that clears them all; else on the other side if there's more than a second to
    cross; else as far over on its own side as it goes. Its line moves at 3 a second there (0.8
    elsewhere), and up the ramp and past its lip it keeps the line it took it on.
  - **Up the ramp beside it** (`autopilot`'s new `across`): the autopilot steers onto a line up to
    1.65 m either side of the ramp's axis, parallel to it, as it steered onto the axis (decision
    044). Flown from 200 m back at ±1 m and ±2.15 m off the axis, from three lines and both
    cautions, 24 flights: none fell, no wall hit after landing, each off the lip within about 0.2 m
    of its line and down 2–13 m short of the landing, in the corner the race takes in. Further
    across than 1.65 m, karts arriving at an angle clipped the ramp's side.
  - **Out of the way:** a bot that can't make the ramp's speed by its foot any more (6 m/s under it,
    by `speedAfter` in `car.ts`: stepCar's acceleration, drag and rolling, not `ACC` alone) moves as
    far over as the road goes, away from the nearest kart coming up behind it.
  - **Under 15 m/s** (`FLY` in `autopilot.ts`) the autopilot no longer steers a kart onto the
    flight: at a walking pace that swung it 60° into the run-up's wall, where it stayed crawling.
    It drives its line up the ramp as anywhere, and falls short as before.
- **Decided by the session, for the owner to confirm:** a bot that has lost its speed doesn't back
  up and line up again: it moves aside, takes the ramp and falls short, and is put back on the
  run-up, as now. From a standstill a kart needs about 120 m flat out to reach the ramp's speed
  (34 m/s); backing up that far would cost a bot about 15 s, where being put back costs about 3, and
  a player would take the put-back too. The task allows it ("or is put back as now only when it
  can't"). So the bots hit by an item on the run-up are still put back.
- **The tests** (party-kart's `test/race.test.ts`, at its end, about 7 s; first in a file of their own,
  whose world loading alongside the others pushed `ground.test.ts`'s build over its 2 s, 1941 ms
  without it on this machine shared with the other sessions, 1894 ms with them in `race.test.ts`):
  - A kart stopped on the run-up, 10 to 50 m before the foot and up to a metre either side, four
    bots behind it 15 or 20 m apart at the ramp's speed: all four past the landing, none put back.
    Before: 3, 3, 6, 0, 0 and 0 put back in the same six cases, in that order.
  - A bot too slow to fly on the run-up (2 to 8 m/s, 20 to 45 m before the foot), four behind it:
    all four past the landing, none put back. Before: one put back already in the first case.
  - Eight bots in a pack onto the jump, 5 to 20 m apart, anywhere across the road at about the
    ramp's speed, a pudim dropped on the run-up 10 to 45 m before the foot, 32 seeded times: 44 put
    back, 32 of them the bots it hit (which can't fly), all 256 past the landing within 15 s. Before:
    85 put back, 53 of them not hit by it. The test asks for at most 20 not hit.
  - The 32 seeded eight-bot races of task 105's count aren't in the suite: about 160 s on their
    own, where the whole suite takes about 25. They were run as task 105 ran them (the test's race,
    `Math.random` seeded, scratch scripts outside git).
- **Task 105's count, the 32 seeded eight-bot races of the Volta dos Amigos** (a full lap each, as
  the race test runs it): put back on the jump's run-up, before and after, over two sets of 32 seeded
  differently (they come in clusters, one foguete putting several back at once, so one set alone
  swings by ±5):

  | | Seeds from 99 | Seeds from 4242 | 64 races | For 32 |
  |---|---|---|---|---|
  | Before (task 105's karts) | 35 | 21 | 56 | 28 |
  | After | 17 | 7 | 24 | 12 |

  The old karts had 12 in the first set. About a third of those left after are bots hit by an item
  on the run-up (a foguete's blast catches several), which can't fly (the decision above). No race
  left a bot behind; put back elsewhere on the lap, 11 after against 14 before. Earlier versions
  of the change did better in the first set (8 and 12) and worse in the packs (62 and 56 put back,
  40 bots stuck at the ramp's foot in one), which is how they were told apart.
- `npm test` 150 of 150 and `npm run check`, rebased on party-kart ae5d387 (108's) with braga-map
  1.36.0 (145 of 145 on 31dbdf3 with 1.35.0 before).
  The autopilot's laps unchanged to the tenth (Volta dos Amigos 303.2 and 300.7 s, 48 wall hits;
  Lamaçães 301.2 and 299.3 s, 72), the jump's flights unchanged, and "the autopilot flies the jump's
  flight from any line" unchanged (it never sets `across`).
- **Landed** (2026-10-24, worker-1): party-kart `8bbe292`, on `ae5d387` with braga-map 1.36.0;
  braga-map's docs only, no version. Decision 067. No viewpoint shows a kart, so no round; no
  geometry or texture, so no budget. Not verified: a race in the browser with bots at the jump (a
  race needs a PeerJS room); the figures are the simulation's, which is the game's.
