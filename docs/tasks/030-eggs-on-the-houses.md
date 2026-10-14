---
status: doing
priority: high
kind: code
repo: both
created: 2026-10-14
depends-on: []
roadmap: Alongside · The friends' Braga
---

# 030 · The eggs on the houses, and Vale's clock

## Why

The easter eggs stand 44–50 m past the friends' houses, on whichever side of the road the
alternation gives them, so a friend doesn't find their own joke at their own door. The owner wants
them on the houses' dots exactly. And one of the five waypoints has no egg at all: Vale's, whose
joke is that he's always late.

## What

Today:

- braga-map `tools/track.mjs`, step 3: each waypoint with an `egg` in `.cache/places.json` gets an
  egg 22–28 samples (44–50 m) past its nearest point on the loop, on side `n % 2 ? 1 : -1`; its
  `x`, `z` are that point on the centre line (`tracks/amigos.js` `eggs`, typed in
  `tracks/track.d.ts`). Four eggs: `dog`, `dentist`, `supermarket`, `smoke`. The fifth waypoint's
  `egg` is null.
- The five waypoints stand 8–15 m from the loop's centre line, on its edge.
- party-kart `src/render/eggs.ts`: `eggSpots` puts each egg at the sample nearest its `x`, `z`,
  `SET_BACK[kind]` beyond the kerb on its `side`, and clears `CLEAR[kind]` metres of buildings
  round it. Each egg's model faces the road (+x) and reacts to your kart from `within(...)` of its
  sample. `main.ts` `eggReact` makes the sound and the word.
- Decision 004 says "the friends' houses are never at their real door"; the README's "The
  friends' houses", party-kart's `CLAUDE.md` (Gotchas) and `README.md` say the same.

Steps:

1. **braga-map:** each egg's `x`, `z` is its waypoint's own dot, and `side` the side of the road
   the dot is on. The fifth waypoint's egg is `clock`, in `.cache/places.json` (not committed).
   `tracks/track.d.ts` says what the fields are now. `npm run tracks`, `npm test`.
2. **party-kart:** `eggSpots` stands each egg on its dot: at the dot's own distance from the
   centre line, or just beyond the kerb where the model needs room in front of it. The buildings
   it needs cleared go.
3. **The clock** (`clock`, Vale's): a big twin-bell alarm clock on the roof of the building at the
   dot (or on a post, if there's none). It's hidden until the house comes into view on the way to
   it, then pops up, its hands racing round and its bells shaking, ringing (a synthesized alarm in
   `audio.ts`), and the feed says Vale is late again. It shrinks away once you're past.
4. **The rule goes:** a new decision replaces decision 004's bullet; the README's "The friends'
   houses", party-kart's `CLAUDE.md` and `README.md` say the eggs stand on the houses. The
   waypoints themselves stay in `.cache/places.json`, and no task names a street or a number.
5. Tag a new braga-map version and move party-kart to it, when the owner asks.

## Questions

- [x] Where does Vale's clock appear: past the house like the other eggs (recommended), or on the
  house itself?
  > On the house itself (2026-10-14).
- [x] And the other eggs?
  > "Remove the rule for nothing on top of the houses as well, and have the easter eggs exactly on
  > the dots" (the owner, 2026-10-14).

## Read first

- `tools/track.mjs`, step 3 (the eggs) and the head (`places`).
- `README.md`, "The friends' houses"; `docs/DECISIONS.md` 004.
- `../party-kart/src/render/eggs.ts`, `../party-kart/src/main.ts` `eggReact`.

## Done when

- [x] `tracks/amigos.js` has five eggs, each on its waypoint's dot (checked against
  `.cache/places.json`, to the metre), `clock` among them.
  > "dog off by 0 m, dentist 0, supermarket 0, clock 0, smoke 0"; `test/eggs.test.js` checks it
  > (and each egg's side of the road without the private file).
- [x] In the game each egg stands at its dot, none on the road; the clock appears on the house as
  you come towards it, animated and ringing (seen with `?autodrive&at=`).
  > Each of the five shot from 28 m before it, standing on its dot: every dot is 7.6–14.6 m from
  > the centre line, past the kerb and the pavement, so none needed moving. The clock, with
  > the autopilot and 7 bots: it pops up as the kart comes within sight of the house, about 200 m
  > before it ("⏰ Vale's late again!" and the alarm), stands on the roof turned to the kart,
  > hands racing, and sinks back after.
- [x] braga-map's `npm test`, party-kart's `npm test` and `npm run check` pass.
  > 17 of 17; 19 of 19 and `tsc` clean.
- [x] The docs and the decision say the eggs are on the houses.
  > Decision 014 (replacing 004's bullet), braga-map's README ("The friends' houses", how a track
  > is planned), party-kart's `CLAUDE.md`, `README.md` and `docs/making-changes.md`.

## Out of scope

- The drivers named after the friends: task 028.
- The Tourigalo by the roundabout: task 029.

## Notes

- The waypoints' coordinates still never go in a task or a doc; `tracks/amigos.js` carries the
  eggs', which are now the same points. The owner chose this knowing the repos are public.
- Done so far (2026-10-14), not committed or released:
  - braga-map: `track.mjs` writes each egg at its waypoint's spot and side (it used to alternate
    the side); the fifth waypoint's `egg` is `clock` in `.cache/places.json`. The track itself
    didn't change: 9274 m, the same points, only the eggs' line in `tracks/amigos.js`.
  - party-kart: `eggSpots` stands each egg on its spot (`FRONT` is the room a model needs
    before the kerb, `CLEAR` the ground it clears); `alarmClock` in `eggs.ts` (8.4 m across,
    on the roof over the house's spot, from `roofAt` in `city.ts`; up from 230 m before the house
    to 40 m past); `sfx.alarm`; the feed line in `eggReact`.
  - The shared map's database still describes each egg in words; it wasn't changed.
- **Left:** release with tasks 028 and 029: tag braga-map (v1.3.0), move party-kart to it,
  commit, deploy, when the owner asks; then `/task finish 030`.
