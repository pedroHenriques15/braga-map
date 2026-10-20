---
status: doing
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

### 2026-10-20: the work (party-kart, on braga-map 1.30.0, on top of 074's uncommitted work)

- **Where a bot can walk** (`src/world/paths.ts`, `Paths`): points 2 m apart over the round's ground
  at the ground's level (streets, pavements, paths, steps, the land, a passage under a building), each
  with room to stand (0.3 m), joined to its eight neighbours where a walker gets from one to the other:
  no wall, hedge, fence, building or trunk between them, the ground there, no rise a walker can't
  climb (a flight a tread at a time, walked every 33 cm, and not up its side where it stands out of
  the land; a bank up to 45°), a retaining wall only off its top. Only the points the spawns reach,
  and that reach them, are kept: **28,426, made in 0.45 s** on the desktop (0.64 s with every test
  file running), when the host opens the round's settings (or starts a round with bots). **All 240
  ways between the 16 spawns are found**, 0.4 ms each (A*, its estimate weighted 1.5). The footbridges
  are left out (one level, the ground's). To make it fast, the round's `field` now tests "inside the
  area" with a `Rings` of its edge (a fraction of a microsecond, against `inShooter`'s 5 µs; they
  differ at 1 point in 162,800, on the line), which every walker's step in a round uses too.
- **What a bot does** (`src/game/footbot.ts`, `FootBot`, and `Squad` for a round's): it chooses a kit
  at each spawn (one it likes, 55% of the time); looks round 6 or 7 times a second within its field of
  view (or 3 m round it), to the head or the chest, nearest first; turns to a shot it hears (anywhere
  in the area, but placed only roughly, off by up to 15–30% of the way), to running footsteps within
  18 m (walking, 6), and to a hit; aims with a reaction time, an error that settles, a lag behind
  someone moving and a tremble; fires an automatic in bursts and a semi-automatic with a pause, only
  once its aim is on them and **only at someone in its sight as it fires** (looked at again then);
  fights from where its kit likes (a shotgun closes in, a sniper's rifle stands still and scopes,
  the others step across the line of fire, not into a wall); reloads when empty, or low with nobody
  about; and **backs off** when hurt (or reloading with someone about) to the nearest point within
  30 m's walk they can't see, till it's whole. Seeing nobody, it goes where it last saw or heard
  someone, else somewhere 50 m off or more. **A choice the owner may change:** after 8 s of seeing
  and hearing nothing, a bot makes for somewhere 30–60 m from someone (anyone: a bot or a player),
  as far-off footsteps would tell a player. Without it, three bots met so seldom in Fujacal's
  215,000 m² that a round was mostly walking (85 shots and one kill in 4 minutes); it never lets a
  bot see or shoot anyone it couldn't.
- **Skill:** "Nível" in the round's settings, beside "Bots": Fácil, Médio, Difícil
  (`Settings.skill`, 0 to 2, the bots' level 0, 0.5, 1):

  | | Reaction | Aim off at first, settling in | Tremble | Turns | Sees to | Backs off under |
  |---|---|---|---|---|---|---|
  | Fácil | 0.85 s | 11°, 1.1 s | 1.6° | 150°/s | 110 m | 25 health |
  | Médio | 0.54 s | 7°, 0.7 s | 0.9° | 315°/s | 185 m | 40 |
  | Difícil | 0.22 s | 3°, 0.3 s | 0.25° | 480°/s | 260 m | 55 |

  With the carabina, against someone standing 20 m off (the mean of 40): **Fácil 6.0 s** to put them
  down, 26% of its shots hitting; **Médio 2.3 s**, 46%; **Difícil 1.1 s**, 58% (the carabina's best
  is 0.43 s). Over 36 rounds of 10 minutes of three bots, 12 at each level, the kills were 109, 112
  and 137.
- **Who they are:** the drivers no player picked (as in the race), on foot as a player is (task 073's
  figure, holding their kit), in the room's list, the feed and the scores (Tab, with 🤖) and the
  results. **The host runs them**, a step at a time with its own fighter; it sends their snapshots as
  its own (no kart), and draws them from those, 110 ms behind, as everyone does (`HostRoom.sendPos`
  keeps them in its `cars` in a round), so it shoots at them where it draws them. A bot's shot is the
  host browser's to decide, as a player's is theirs; every shot reaches the host, whose bots hear it
  and take its hits; a bot down is the host's to tell. Recorded in party-kart's
  `docs/architecture.md` ("The modes", "Who decides what"). Peer prefix still `pk41` (074's, never
  released).
- **Getting out of a corner:** pinned 0.5 s (someone standing in its way, a wall's end, a hollow
  off its way), a bot steps aside; at 1.2 s, back to the last point it passed; at 2.2 s, a new way;
  at 5 s, put back on that point, as a race's bot is on its line. **Two faults of task 073's walker
  found and fixed**, which held players too: pushed out of a wall it was put exactly at its radius,
  where a rounding error (4.5×10⁻¹⁴ m) could leave it "in" the wall by too little to move it, for
  ever (now a millimetre clear); and going straight at a wall's end, two walls pushing it back and
  forth, it stopped dead (now it slides along the first).
- **The cost:** 0.06 ms a frame for three bots and **0.23 ms for seven** (a full room with the host)
  on the desktop, the worst step after the first second 2.6 and 4.0 ms. Only one bot a step may find
  a way or look for cover (a millisecond or so each); the others wait for the next. The roofs' index
  that a look needs (15 ms, made at the first look) is made with the round's field instead, so neither
  a bot's first look nor a player's first shot hitches.
- **Tests** (`test/footbot.test.ts`, 4): the paths (every spawn reaching every other); the levels (a
  bot with the carabina against someone standing 20 m off, each level quicker than the one under it);
  **three bots alone for a 10-minute round** (seeded: 404 shots, 49 hits, **none at anyone out of
  sight, none through a wall, none stuck**, kills 7, 1 and 1, each walking 2.4–2.8 km, together
  through 127 of the area's 347 squares of 25 m); seven bots for two minutes (the cost). `npm test`
  (91) and `npm run check` pass.
- **Over many rounds** (not in the tests; the same three bots, 12 seeds at each level): in 36 rounds
  of 10 minutes, all three bots scored in 34; a bot was put back on its path 3 times in 1,080
  bot-minutes, by the side of the flight at (-166, 889) (task 076's kind of place) and at (291, 885)
  and (27, 808).
- **Played** (Playwright, headless Chromium on the desktop's GPU): alone with three bots on Médio
  (they walk the area; one put down with the carabina from 12 m, "Eliminaste Joel com a carabina";
  Tab's scores with the bots; 60 fps); alone with seven on Difícil (60 fps, the frame's cap; a bot
  put another down with the sniper's rifle, another put the host down with the pistol); alone with
  three on Fácil; a host and a guest through PeerJS's public server with two bots, on Difícil and on
  Médio (a bot's sniper's rifle putting the host down in two shots; a Médio bot's carabina putting
  the host down, then the guest, its shots reaching the guest's browser; the guest's carabina putting
  a bot down, "Eliminaste Joel F." on the guest and "Bruno eliminou Joel F." on the host). No errors.

**Not verified:** the owner playing, whether a beginner beats Fácil and whether Difícil troubles the
owner ("Done when"); a phone as the host (the paths' 0.45 s may be 1.5–2 s there, while the round's
settings are open; the bots' cost per frame there); two machines; the sounds by ear (the bots' shots
and footsteps are the players', placed where they are).

### 2026-10-20, later: in the arenas

Task 079 puts the round in one of three small arenas, with insides: the bots walk their paths there
(made with each arena's field), through the doors and up the towers' stairs, and their numbers are 079's
(three bots, 5 minutes in each arena: 34 to 43 kills, none stuck). The levels' times above are
unchanged. Live with 074 and 079 (2026-10-20); still to do: the owner playing Fácil and Difícil.

