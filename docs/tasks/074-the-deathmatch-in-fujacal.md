---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-19
depends-on: [073]
roadmap: Games · More tracks and the shooter
---

# 074 · The deathmatch in Fujacal: a kit at each spawn, shots, hits and the score

## Why

The first shooter is a realistic deathmatch among friends, on foot in Fujacal (the owner, 2026-10-19;
decisions 003 and 031). Task 073 lets a player walk there; this task gives them something to do: the
host starts a round from the menu, as a race, everyone is put on foot in Fujacal with a weapon, and
whoever has the most kills when the time runs out wins.

## What

Today, after task 073:

- A player can walk the open world in first person and others see them, but nobody has a weapon, and
  nothing tests a line of sight: there is no raycast in `src/` (no segment test against walls,
  buildings or the ground). The nearest pieces are `Cells.near` (`src/world/ground.ts:108`),
  `toSegment` (`:192`) and `cross` (`:752`).
- The race is the precedent for a round: the host starts it from the menu (`raceScreen`,
  `src/main.ts:507`; `Settings`, `src/session.ts:25-32`), it takes everyone in the room, and after the
  results everyone is back where they were before (`startRace` `:1003`, `endRace` `:1072`). Time attack
  has a round of so many minutes (`Settings.minutes`).
- Items are the precedent for events: `ItemEv` (`src/game/items.ts:79-86`), sent through the host and
  cleaned by `cleanEv` (`session.ts:178`); "a hit is decided by the browser of the car that gets hit"
  (`docs/architecture.md:310-312`).
- Sounds are synthesized but for the engines and the city's (decision 016): a positioned effect is
  `sfx.<name>(at)` in `src/audio.ts` (`boom` `:929`, `hit` `:936`), under a cap of 24 sounds at once.
- braga-map gives the area: `world.shooter` (`pts`, its 17 `gates`) and `world.inShooter(x, z)`
  (`index.d.ts:658-660`, SHOOTER-AREA.md).

Steps:

1. **Line of sight,** in the simulation: a segment test against the buildings, walls, fences, gates,
   tree trunks and the ground (land, streets, decks), with the distance to the first thing hit and what
   it is. Hedges and railings let a shot through or not as the session judges; say which in Notes.
   Fast enough for every shot and every bot's look (task 075): measure it.
2. **The kits** (the owner's answer, 2026-10-19: a kit chosen at each spawn): a rifle, a shotgun, a
   sniper rifle or a pistol, each with its damage, rate of fire, spread, range, magazine and reload, and
   the sniper's scope. Health 100, coming back slowly after a few seconds unhurt; a head hit counts
   more. Tune them so none is best everywhere: record the numbers and the times to kill in Notes.
   Drawn in the hand in first person and in the figure's hands for the others, made in code as the rest
   of the game is (no model files).
3. **A shot over the network:** a new event, the shot (who, from where, which way, which weapon, when),
   sent like the items'. Who decides a hit: a bullet is instant, and the others are drawn 110 ms
   behind, so the victim's browser deciding (the items' rule) would have shots that hit on the shooter's
   screen miss. Decide whether the shooter's browser decides against what it drew, and the victim's
   applies it, or the items' rule holds; record it in `docs/architecture.md` ("Who decides what") and
   in a DECISIONS.md entry when the task is done.
4. **The round:** "Tiroteio" in the menu beside "Corrida", for the host: how many minutes (3, 5, 10) and
   how many bots (task 075 fills them; until then, none). Starting it takes everyone in the room: each
   kart waits where it was, and each player is put on foot at a spawn in Fujacal, choosing a kit. A
   death drops the figure, and after a few seconds the player chooses a kit and comes back at the spawn
   furthest from the others' sight, unhurt for a moment. The scores (kills, deaths) are the host's, as
   the race's board is; Tab (or a button) shows them. When the time is up: the results, and everyone is
   back in their kart where it waited.
5. **The area's edge:** during a round a player can't leave `world.inShooter`. Where the edge crosses a
   street or a path (its gates), a barrier stands as at the open world's edge (decision 019: barriers,
   not an invisible wall); along the avenues' near kerbs and the river's bank, a railing, as
   SHOOTER-AREA.md has the edge. Stood only during a round.
6. **What a hit looks and sounds like:** muzzle flash, the shot's sound for each weapon (synthesized,
   placed where it's fired, heard further than an item's, echoing in the streets), a mark where a bullet
   strikes a wall, a hit marker and the screen's edge going red when hurt, a kill in the feed. No blood
   or gore: the figure falls and fades.
7. **The HUD:** health, the kit and its ammunition, the round's clock and scores, the crosshair. On a
   touch screen (the owner's answer: twin sticks): a fire button under the right thumb, reload, the
   scope; the kit picker by tapping.
8. **Tests** in `test/`: line of sight through an open street and not through a building; each kit's
   damage at range; a round's clock, scores and respawns with two players simulated; the edge holds.
9. Play a round in two browsers, host and guest, on a computer and on a phone; budget the weapons and
   effects (`?stats`, draw calls, triangles); update `README.md` (the round, the controls),
   `docs/architecture.md` and `CLAUDE.md`. `npm test` and `npm run check`.

## Read first

- party-kart's `docs/architecture.md`: "The network", "Item events", "Who decides what", "The modes",
  "Sound".
- `src/game/items.ts`, `src/game/racer.ts` (`hit`, `hits`) and `src/game/arena.ts`: how events and
  hits travel today.
- `src/main.ts`: `raceScreen`, `startRace`, `endRace`; `src/session.ts`: `Settings`, the lobby and
  the board.
- braga-map's `docs/SHOOTER-AREA.md`: the edge, its gates, where the player goes.

## Done when

- [ ] The host starts a round from the menu; everyone in the room is on foot in Fujacal with a kit of
      their choice; shots, hits, deaths, respawns and the scores work between a host and a guest, on a
      computer and on a phone; at the end everyone is back in their kart.
- [ ] The four kits, their numbers and their times to kill are in Notes, and no kit wins everywhere in
      the tests' duels.
- [ ] A player can't leave Fujacal during a round; the barriers and railings stand only then.
- [ ] Who decides a hit is recorded in `docs/architecture.md`.
- [ ] The budget of the weapons and effects is in Notes; the tests pass; `npm test` and `npm run check`.

## Out of scope

- Bots: task 075, which goes live with this one (the owner wants bots from the start).
- Parked cars as cover: task 020 brings them into the data; until then the cover is the walls, the
  trees and the corners.
- Teams, other modes, grenades, vehicles in a round.

## Notes

Drafted 2026-10-19 from the owner's answers: a realistic deathmatch, a kit chosen at each spawn (rifle,
shotgun, sniper rifle or pistol), bots from the start (task 075), twin sticks on a touch screen. Not
asked, and taken as the defaults here: a round of so many minutes with the most kills winning, started
by the host as a race is, and no gore. The owner may change any of them.

It goes live with task 075, so a round can be played with few friends. Viewpoints: none, as the city
doesn't change.

Left by task 073 (2026-10-20): a walker walks through karts, its own and the others' (the karts aren't
walls to it), and there is no sound of footsteps. In a round the karts wait where they were, some in
Fujacal, and footsteps tell a player where the others are: both are this task's to settle, in steps 4
and 6.
