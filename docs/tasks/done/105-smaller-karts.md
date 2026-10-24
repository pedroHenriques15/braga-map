---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-24
depends-on: []
roadmap: Now · The open world
---

# 105 · Smaller karts, about 2.8 × 1.8 m

## Why

The karts are about twice a real kart each way, so Braga's narrow streets feel tighter than they
are: two karts barely pass where two real cars do. The owner asked for smaller karts, halfway to a
real kart's size, about 2.8 m long and 1.8 m wide (2026-10-24).

## What

Today (party-kart `2dfa05d`):

- **Drawn** (`src/render/drivers.ts`, `buildKart`): the kart (Pedro's, Vale's) has its wheels at
  x ±1.15 m and 0.95 to 1.0 m out, wheels 0.3 to 0.42 m wide, the exhaust at x -1.85: about 3.9 m
  long and 2.4 m wide. The banger (Capelas's) about 4.3 × 1.8 m (wheels at x ±1.25, 0.78 out, the
  exhaust at -2.1); the chair (Joel's) about 2.3 m long, the trolley (Joel F.'s) about 2.3 m long and
  1.1 m wide. The driver sits on it at the same scale.
- **Colliding:** every kart alike, two circles of `CAR_R` = 0.8 m, `CAR_L` = 0.95 m ahead and behind
  its middle (`src/world/ground.ts`): 3.5 × 1.6 m. Karts touch karts at `CAR_RADIUS * 2`
  (`src/game/racer.ts`); the items hit within 1.9 to 2.2 m (`racer.ts`'s `hits`); the first track's
  edge keeps `HALF_W` = 1.0 m (`src/car/car.ts`). The chase camera (`chase` in `src/main.ts`) is set
  for today's kart.
- A real racing kart is about 1.9 × 1.4 m; a small car about 3.6 × 1.6 m.

Steps:

1. **Every body drawn within about 2.8 × 1.8 m**, its wheels, body and driver scaled together (the
   driver figure stays the friend's cartoon, decision 014), each body's proportions kept; the trolley
   and the chair, smaller today, kept as they are or brought to the same length, whichever looks
   right beside the others.
2. **The collision to match:** `CAR_R`, `CAR_L`, `CAR_RADIUS` and `HALF_W` set to the new footprint,
   the same for every kart so the race stays fair; the items' hit distances scaled with it.
3. **The camera:** the chase and close cameras brought in to the smaller kart, so it fills the screen
   as before.
4. **What else uses a kart's size:** the deathmatch's waiting karts as cover (`src/game/fight.ts`'s
   sight with the karts), the walker stopped by a waiting kart (`src/game/walker.ts`), getting out
   beside it (`walker.ts`'s exit), the plinth's start (`stand` in `ground.ts`), the eggs' reactions.
5. **The tests:** the race's (`test/race.test.ts`, `test/drive.test.ts`): the autopilot's lap with no
   respawn, the jump's flight and landing (decision 044: its speed onto the ramp, `SHORT` in
   `src/car/autopilot.ts`), the eight bots, every row of barriers stopping a kart, the items. Retune
   what the size changes, not the streets.
6. **A new peer prefix** (`PREFIX` in `src/session.ts`): an old build and a new one in the same room
   would disagree about who touched whom.

## Read first

- party-kart's `CLAUDE.md` ("Gotchas": the tests that guard the tracks), `docs/making-changes.md`
  ("The handling", "A new driver"), `docs/architecture.md`.
- `src/render/drivers.ts`, `src/world/ground.ts`, `src/car/car.ts`, `src/game/racer.ts`,
  `src/main.ts` (`chase`).

## Done when

- [x] Every kart drawn within about 2.8 × 1.8 m, and colliding as that (a test of the footprint).
  Drawn: measured round each body's visible meshes in Chromium, the largest 2.80 × 1.69 m (the
  table in Notes). Colliding: party-kart's test "a kart's footprint…" (`test/roam.test.ts`).
- [x] Two karts pass side by side on a street where today they can't: one named in Notes, before
  and after. The lane off the Praceta João XXI, 3.71–3.75 m between its walls: two karts fit side
  by side now, where the first needed 3.8 m (the test "two karts side by side in the lane…", and a
  drive past in Notes). The only such street of any length: see "The premise, partly false".
- [x] `npm test` and `npm run check` pass; the lap's summary line before and after in Notes.
  Both pass on braga-map 1.35.0 after rebasing onto task 106: 142 of 142.

## Out of scope

- The streets' widths: they're the real ones (decision 019).
- The parked and moving cars of tasks 020 and 094: real cars' sizes.

## Notes

- The owner's answer (2026-10-24): halfway, about 2.8 × 1.8 m, over a real kart's 1.9 × 1.4 m and
  over drawing the bodies within today's collision. To be done first, before 081.
- No viewpoint shows a kart (`?scenery` draws none), so no round.
- **Done (2026-10-24, worker-1 of the run in task 103), party-kart:**
  - **The footprint:** `KART` = 2.8 × 1.8 m in `src/world/ground.ts`, `CAR_R` = 0.9 and `CAR_L` = 0.5
    from it (they were 0.8 and 0.95: 3.5 × 1.6 m), `HALF_W` 0.9 in `car.ts` (was 1.0). Karts bump as
    capsules 0.9 m round their axes (`bump` in `game/racer.ts`, `CarInfo` now carries `yaw`), where
    they were one 1.1 m circle (`CAR_RADIUS`, gone): 1.8 m apart side by side, 2.8 m nose to tail. Its
    test: "a kart's footprint…" in party-kart's `test/roam.test.ts` (a wall keeps it 0.9 m off its
    side and 1.4 m off its nose; another kart touches it at 1.8 and 2.8 m, not 5 cm further).
  - **Drawn** (`SIZE` in `render/drivers.ts`, a `size` group scaling each body, its driver, its glow
    and its slipstream's streaks together), measured round the visible meshes in Chromium:

    | Body | Before (m) | After (m) | Driver's head |
    |---|---|---|---|
    | kart (Pedro, Vale) at 0.7 | 3.98 × 2.42 | 2.79 × 1.69 | 2.44 → 1.71 m (Vale's nightcap 3.03 → 2.12) |
    | chair (Joel) at 0.7 | 2.95 × 1.96 | 2.06 × 1.37 | 2.88 → 2.02 m |
    | trolley (Joel F.) at 0.7 | 3.09 × 1.39 | 2.16 × 0.97 | 2.62 → 1.83 m |
    | banger (Capelas) at 0.65 | 4.30 × 1.82 | 2.80 × 1.18 | 2.57 → 1.67 m |

  - **Decided by the session, for the owner to confirm:** the chair and the trolley kept shorter than
    the karts, as they were, rather than brought to 2.8 m: every body at the same 0.7, so every driver
    is the same size. Brought to 2.8 m, Joel and Joel F. would be 30% bigger people than the others.
    A render of the five beside a 1.75 m post, before and after, looked right to the session that
    way: the drivers' heads come level with the post. Capelas's banger, the longest, at 0.65 to fit,
    its driver 7% smaller.
  - **The items:** the bola hits within 2.0 m along and 1.5 m across (was 2.2 and 1.9: the
    footprint's half and the ball's 0.6 m), the pudim within 1.5 m of the middle (was 1.9).
  - **The cameras:** chase 5.3 m + 0.032 m per m/s back and 2.25 m up (was 7.6 + 0.045 and 3.2),
    close 3.4 m back and 1.4 m up (was 4.8 and 2.0), looking 0.9 m up and 3.5 m ahead (was 1.3 and
    5). Shot standing on the plinth before and after, chase and close: the kart fills the screen as
    before, the street round it larger.
    The menu's camera round your kart (`orbit`) brought in the same way (5.3 m off, 1.8 m up, was
    7.5 and 2.6).
  - **Getting out** beside the kart 1.4, 2.0 or 2.6 m from its middle (was 1.6, 2.2, 2.8), in front
    or behind 2.4 m (was 3).
  - **On foot and in a round** a waiting kart is its two circles (`kartBlock` in `main.ts`), up to
    0.9 m (was two 0.8 m circles 0.95 m off its middle, up to 1.1 m). Walked into in the browser
    (`?autodrive`, F, `__walk`): stopped 1.09 m from its middle at its side and 1.70 m at its tail.
    The old kart stopped you at 2.05 m at its tail but let you in to 0.56 m at its side, between
    its two circles, which didn't meet.
  - **The rest of `main.ts`:** the name tag over a kart 2.6 m up (was 3.4), the skid marks, sparks
    and drift smoke at the rear wheels as drawn (0.8 m back and 0.7 m out, was 1.1 and 0.9), the
    others' `yaw` into their `CarInfo`.
  - **The peer prefix:** `partykart-pk44-`.
  - **The pin:** party-kart on braga-map 1.35.0 (from 1.33.1), as the first task of the run to land
    there (task 103), at the coordinator's word: 1.34.0's street furniture and 041's squares come
    with it.
  - **Not changed:** the slipstream's wake (2.2 m wide behind a car), the foguete's blast (12 m), the
    bots' passing distance (2.4 m: the new 1.8 side by side and 0.6 m of room, where it was 2.2 and
    0.2), the autopilot's 1.6 m off the road's edge and `SHORT` (the jump's flights didn't move).
    No new geometry or texture (the same meshes, scaled), so no budget to measure.
- **The premise, partly false:** "two karts barely pass where two real cars do" is true of how they
  look, not of how they collide. By collision two of today's karts already passed side by side in
  3.8 m (one 1.1 m circle each, 0.8 m to the walls); the new footprint needs 3.6 m. Over the open
  world's streets, measured every metre along the map's lines, wall to wall at a kart's height, about
  34 m are 3.6–3.8 m across, the only band that gains. What changes for every street is the drawing:
  today's kart is drawn 2.42 m wide on a collision 1.6 m wide, so two side by side are drawn into each
  other and 0.4 m into the walls; now every kart is drawn within its footprint. The collision itself
  is 0.2 m wider than it was (1.8 m, the owner's).
- **Two karts side by side:** the lane off the Praceta João XXI, between two retaining walls
  3.71–3.75 m apart over 7 m: the longest stretch of the area between 3.6 and 3.8 m. Today two karts
  there touch; now they fit side by side, clear of both walls and of each other (the test "two karts
  side by side in the lane off the Praceta João XXI…"). Driven past a kart waiting by one wall, along
  the other, by a scratch driver holding its heading: before, 35–44 bumps getting by, slowed to
  2.8 m/s alongside; after, 5, at 3.9 m/s. The bumps left are that driver drifting 0.14–0.26 m off its
  line on the lane's cross-slope, with 7 cm to spare, so this run isn't a test.
- **Landed** (2026-10-24, worker-1): party-kart `54fdcad` (the karts), `c4dbac2` (the capsules)
  and `31dbdf3` (on braga-map 1.35.0), peer prefix `pk44`; braga-map unchanged but for the docs: no
  version. Decision 065. No viewpoint shows a kart, so no round; no new geometry or texture, so no
  budget. Not verified: a race at speed in the browser (a race needs a PeerJS room), the
  deathmatch's cover in a round, and the touch controls. Found: task 114.
- **The race's tests,** before and after (`npm test`, all pass, 136 then 138):
  - Volta dos Amigos: laps 302.8, 299.9 s; respawns 0; longest air 1.95 s; top 217 km/h; wall hits
    48. After: 303.2, 300.7 s; 0; 1.95 s; 217 km/h; 48.
  - Volta de Lamaçães: laps 300.6, 298.4 s; respawns 0; air 0.87 s; 217 km/h; wall hits 75. After:
    301.2, 299.3 s; 0; 0.86 s; 217 km/h; 72.
  - The jump's flights the same to the centimetre; every row of barriers still stops a kart (169 of
    201 and 151 of 170 driven at, 0 through); the eight bots finish within 10 s of each other.
  - On braga-map 1.35.0 (the pin, below), the same: all 138 pass, the laps' lines unchanged to the
    tenth.
- **Two karts locked side by side, found and fixed.** First made as the two circles each, as the walls
  meet a kart, the bump let another kart's circle settle in the waist between them (the circles 1.0 m
  apart, 0.9 m round, leave a 0.15 m notch each side). Two side by side in a street narrower than two
  karts then locked half a length apart, pushing each other into the walls, and the bots' rescue
  (still for 3 s) never came, as they read 2.6 m/s. The eight-bot race failed on it ("everyone
  finishes", three bots left in a 3 m street of the Volta dos Amigos at its sample 518, 3.2–3.4 m
  between its walls). In 16 seeded races (`Math.random` seeded, the test's race replayed), 5 left
  bots behind, up to all eight, at samples 518, 670 and 2510, all 3 m streets; the old single circle,
  none. As capsules, none in 48, and the test passed six times running.
- **Work found, not done here (told to the coordinator):** bots fall short of the Volta dos Amigos'
  jump about three times as often: put back on its run-up 35 times in 32 seeded races, 12 on the old
  karts. Nearly all after a pile-up on the run-up, where they drive its middle in single file and
  pass nobody: one hit by an item stops 16 m before the ramp, the ones behind run into it, and take
  the ramp too slow. It's the length: with the footprint 2.2 m long it's 10. A kart 2.8 m long meets
  the one ahead 2.8 m off where the old met it 2.2 m off, though drawn 4 m long. The bots keeping
  their distance on a jump's run-up would be a task of its own; the race's tests don't count these
  and pass.
