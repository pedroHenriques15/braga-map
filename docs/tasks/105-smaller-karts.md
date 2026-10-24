---
status: todo
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

- [ ] Every kart drawn within about 2.8 × 1.8 m, and colliding as that (a test of the footprint).
- [ ] Two karts pass side by side on a street where today they can't: one named in Notes, before
  and after.
- [ ] `npm test` and `npm run check` pass; the lap's summary line before and after in Notes.

## Out of scope

- The streets' widths: they're the real ones (decision 019).
- The parked and moving cars of tasks 020 and 094: real cars' sizes.

## Notes

- The owner's answer (2026-10-24): halfway, about 2.8 × 1.8 m, over a real kart's 1.9 × 1.4 m and
  over drawing the bodies within today's collision. To be done first, before 081.
- No viewpoint shows a kart (`?scenery` draws none), so no round.
