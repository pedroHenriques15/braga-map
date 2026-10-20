---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-19
depends-on: [074]
roadmap: Games · More tracks and the shooter
---

# 075 · Bots on foot: the deathmatch's empty places filled, as the race's are

## Why

The owner wants the deathmatch played with bots from the start (2026-10-19), so a round is worth
playing with one or two friends, or alone. The race fills its empty places with bots; the deathmatch
needs bots too, but on foot, and nothing of the race's carries over: they follow the track.

## What

Today, after task 074:

- The race's bots (`src/game/bot.ts`): `botControls` (`:45`) gives a `Racer` its controls from the
  autopilot (`src/car/autopilot.ts`), which follows the track's samples. Only the `Brain`'s idea
  (caution, patience, a line of its own; `bot.ts:10-17`) is of use on foot.
- The host runs the bots and reports their laps (`docs/architecture.md`, "The network"); in a race
  they're the drivers no player picked, by name (decision 014).
- Task 074 gives a round its kits, shots, line of sight and scores; its menu's bot count fills
  nothing yet.

Steps:

1. **Where a bot can walk:** a graph of Fujacal's walkable ground (streets, pavements, footways,
   crossings, steps, the courtyard's passage) from the world's streets and paths, built at load and
   tested: every spawn reaches every other.
2. **What a bot does,** run by the host: it chooses a kit at each spawn, moves between cover and
   places it can see from, turns to a sound or a hit, aims with a reaction time and an error that
   shrink with skill, fires in bursts, reloads in cover, and backs off when hurt. It sees only what
   074's line of sight lets it see.
3. **Skill:** the bots' level in the round's settings (as the race's "Ajuda" sets how much the
   game helps), from one a beginner can beat to one that troubles the owner.
4. **Who they are:** the drivers no player picked, each standing as a player is (task 073), named in
   the scores and the feed as in the race.
5. **Tests:** a round of three bots alone in the simulation, for a few minutes of game time: none is
   stuck (each moves through the area), none shoots through a wall, each gets kills; and the bots
   don't slow the host's frame (measure their cost per frame).
6. Play a round with a friend and bots, and alone with three, at each skill. Update `README.md` and
   `docs/architecture.md`. `npm test` and `npm run check`. Then 074 and 075 go live together, when the
   owner asks.

## Read first

- `src/game/bot.ts` and `src/car/autopilot.ts`: the race's bots.
- Task 074's line of sight and kits, and `docs/architecture.md` as 074 leaves it.
- braga-map's `docs/SHOOTER-AREA.md`, "Where the player goes".

## Done when

- [ ] A round with bots fills the empty places; the bots move through all of Fujacal, take cover,
      shoot only what they can see, and score.
- [ ] Their skill can be set, and the lowest is beatable by a beginner (the owner, playing).
- [ ] The tests pass: no stuck bot, no shot through a wall, the bots' cost per frame in Notes.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- Bots walking outside a round, or in the open world past Fujacal.
- Bots driving karts differently: the race's are as they are.

## Notes

Drafted 2026-10-19 from the owner's answer: bots from the start, over friends only first. The
deathmatch (074) is released with this task, not before it.

Viewpoints: none, as the city doesn't change.
