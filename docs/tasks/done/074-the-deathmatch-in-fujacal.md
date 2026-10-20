---
status: done
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

- [x] The host starts a round from the menu; everyone in the room is on foot in Fujacal with a kit of
      their choice; shots, hits, deaths, respawns and the scores work between a host and a guest, on a
      computer and on a phone; at the end everyone is back in their kart.
      *(two browser contexts through PeerJS's public server, and a host with an emulated phone driven by
      CDP's touches, 2026-10-20: Notes, "Played". A real phone wasn't tried.)*
- [x] The four kits, their numbers and their times to kill are in Notes, and no kit wins everywhere in
      the tests' duels. *(`test/fight.test.ts`'s seven duels: the shotgun wins two, the carabina two,
      the sniper's rifle two, the pistol one)*
- [x] A player can't leave Fujacal during a round; the barriers and railings stand only then.
      *(the edge test: 55 runs at its 17 gates and 38 railings, none out; the edge is drawn only between
      `startFight` and `endFight`, and was seen at a gate and on the Avenida da Liberdade in a round)*
- [x] Who decides a hit is recorded in `docs/architecture.md`. *(party-kart's "Shots" and "Who decides
      what"; and decision 056)*
- [x] The budget of the weapons and effects is in Notes; the tests pass; `npm test` and `npm run check`.
      *(party-kart: 87 tests and the check; braga-map: 142 and 1 skipped; 2026-10-20)*

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

### 2026-10-20: the work (party-kart, on braga-map 1.30.0)

- **Line of sight** (`src/world/sight.ts`): a ray against the walls and trunks cell by cell along it
  (the ground's 10 m cells, nearest first), then the ground every 30 cm up to what stopped it (quickly
  where the ray is well over the land and nothing stands there): the land, the streets and paths,
  the treads, the decks (their 1.2 m), the plinth, and the buildings' roofs (their top 1.5 m, never
  over a carriageway or a passage cut through one). **Hedges stop a shot and a look; railings,
  fences, gates' bars, the railing on a low wall, handrails, the edge and its barriers, and the trees'
  crowns let them through** (a hedge is what you'd hide behind; the rest is bars and air). Ground's
  walls carry `open` and `rail` for this; nothing a kart meets changed. **36 µs a look** between two
  spawns 300 m apart on average, alone (72 µs with every test file running at once).
- **The kits** (`src/game/fight.ts`, `KITS`), health 100, coming back at 12 a second after 5 s
  unhurt; a head hit ×(the kit's), the legs ×0.75; the cone's half-angle more on the move (scaled by
  speed over the run's 5 m/s), 3° more in the air:

  | Kit | Damage (body) | Head | Every | Mag, reload | Spread still / running | Range |
  |---|---|---|---|---|---|---|
  | Carabina | 24 to 25 m, 14 from 70 m | ×2 | 100 ms, automatic | 30, 2.3 s | 0.5° (+0.4° a shot, to 3°) / +4° | 400 m |
  | Caçadeira | 10 pellets × 15 to 10 m, 1 from 35 m | ×1.5 | 850 ms | 6, 2.8 s | 2.6° / +1.2° | 60 m |
  | Espingarda de precisão | 60 to 100 m, 55 from 400 m | ×2.5 | 1200 ms | 5, 3 s | 5° hip, 0.03° scoped (×4.5) / +6° | 800 m |
  | Pistola | 30 to 15 m, 18 from 50 m | ×2.2 | 220 ms | 12, 1.4 s | 0.8° (+0.5° a shot, to 2°) / +0.6° | 200 m |

  The times to kill in the tests' duels (a standing target, aiming at the chest, firing as fast as
  allowed, the mean of 300; the sniper's the better of scoped and not from 20 m):

  | | Carabina | Caçadeira | Precisão | Pistola | Wins |
  |---|---|---|---|---|---|
  | 4 m | 0.43 s | 0.01 s | 1.46 s | 0.68 s | caçadeira |
  | 10 m | 0.43 | 0.31 | 5.14 | 0.68 | caçadeira |
  | 20 m | 0.43 | 2.07 | 1.21 | 0.69 | carabina |
  | 40 m | 0.50 | — | 1.21 | 1.49 | carabina |
  | 80 m | 1.31 | — | 1.21 | 5.80 | precisão |
  | 150 m | 5.19 | — | 1.21 | 20.4 | precisão |
  | 15 m, running | 2.14 | 1.98 | 25.1 | 0.80 | pistola |

  Drawn in code (`src/render/arms.ts`, `buildGun`): yours over the world in first person, drawn
  after it with its depth cleared (`Look.overlay`), so it never goes into a wall; the others' in the
  figure's hands (`buildWalker`'s `arm`), its arms out to it and aimed by its pitch.
- **A shot over the network** (`ShotEv`: who, from where, the aim, its cone, a seed, which kit, the
  round's ms, which pellets a fighter stopped, the hits): **the shooter's browser decides a hit**,
  against the others as it draws them, and the victim's browser applies it and says when it's down
  (`DownEv`); the host counts kills and deaths. Recorded in party-kart's `docs/architecture.md`
  ("Shots", "Who decides what"). Each browser draws every pellet from the seed, so the marks match.
  Peer prefix `pk41`.
- **The round:** "🎯 Tiroteio" beside "🏁 Corrida", 3, 5 or 10 minutes and the bots' count (which
  fills nothing until task 075). `Settings.mode` `'fight'`, `round` its minutes. Everyone on foot at
  one of 16 spawns (the most spread of the streets' middles, 6 m or more in from the edge), kits
  chosen during a 4 s countdown; down, the figure falls (0.45 s) and fades (from 2.5 s), the kits come
  up, and after 4 s you're back at the spawn none of the others sees, the furthest from them, safe
  2 s unless you fire. Scores: Tab, or "Pontuação" on a touch screen; the results by kills, then
  deaths; everyone back in their kart where it waited. No names over the others in a round, nobody
  on the minimap: both would give positions away through walls.
- **The edge:** the round's ground is the world's with the shooter's edge a wall at every level, and
  the walker keeps inside `inShooter`. Drawn only during a round: a railing (1.1 m of bars, posts every
  2 m) along every stretch where someone could walk up to the edge, 14 runs, 1.9 km, and road-works
  barriers with "Estrada cortada" across the 17 gates.
- **What a hit looks and sounds like:** the muzzle's flash, each kit's report (synthesized: a crack, a
  burst and a thump, as loud as in your head within 40 m, heard 1.5 km off, duller with distance,
  sent to a convolver for the streets' echo), tracers, a bullet's mark (160 at most) and a puff of what
  it struck with a smack, the hit marker (red for the head), the screen's edge red when hurt, the kill
  in the feed and "Eliminaste …" for whoever did it. No blood.
- **Settled from 073's notes:** the karts are solid on foot (two circles each, as they bump), in a
  round and out of one, and so are the others on foot; a kart stops a bullet up to 1.1 m. Footsteps,
  synthesized, yours in your head and the others' where they walk, always on foot.
- **Tests** (`test/fight.test.ts`, 6): line of sight down the Rua do Fujacal and not through a
  building on the Alameda (stopped at its wall, its mark facing the shooter); the look's cost; the
  hitboxes; each kit's damage at range and the duels (no kit wins all seven); a round of two fighters
  (safe at first, a kill after 2 s, the score, the respawn 100 m+ away out of sight, health coming
  back, the clock); the edge (55 runs at its 17 gates and 38 stretches of railing, none out).
  `npm test` (87) and `npm run check` pass.
- **Played** (Playwright, headless Chromium, two contexts through PeerJS's public server): host and
  guest on computers: the start, the kits, the carabina putting the guest down at 20 m (14 rounds),
  the feed and "Eliminaste Bruno" on the host, the guest's death screen and kits, the respawn 647 m
  off, the host down to the guest's shotgun at 6 m, Tab's scores, the host ending the round, the
  results, both back in their karts. A host and an emulated phone (Pixel 7, CDP touches): a kit
  tapped on the picker, walked and ran with the left stick, four pistol shots with Fogo putting the
  host down at 12 m, Fogo dragged to aim.
- **Budget** (the desktop's RTX 4060 Ti, 1280 × 720, on foot at the same place with and without a
  round, the edge in view on the Avenida da Liberdade): +10 draw calls and +36,000 triangles on High,
  +7 and +18,000 on Low. The edge is 5 meshes and 17,900 triangles (and its shadows); your gun a few
  meshes and 900 triangles, drawn over the world; marks and tracers a mesh each; each other player's
  gun one or two meshes. Two small canvas textures.

**Not verified:** a real phone and its frame rate (the owner's, with `?stats`, which says
"tiroteio"); a headed Chrome, Firefox or Safari (headless Chromium granted the pointer lock; there,
Playwright's mouse buttons under the lock come with a movement that turns the view, so the host's
trigger was a dispatched `mousedown`, the guest's real clicks); two machines; the sounds by ear (the
reports, the echo, the footsteps are made and played, not listened to); the bots, task 075's.

### 2026-10-20: finished

No viewpoint shot again: the city doesn't change, and the round's edge is up only in a round, never in
`?scenery`. The budget is in Notes and in party-kart's `docs/architecture.md`. Decision 056 records
the round, who decides a hit and what stops a shot; SHOOTER-AREA.md says the deathmatch is played
there. The phone was an emulated one: a real phone's frame rate in a round is the owner's, with
`?stats`. Not deployed: the deathmatch goes live with task 075's bots, as the owner wants.
