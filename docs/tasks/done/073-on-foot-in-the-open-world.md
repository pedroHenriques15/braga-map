---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-19
depends-on: [071]
roadmap: Games · More tracks and the shooter
---

# 073 · On foot: a player gets out of the kart and walks Braga, in first person

## Why

The shooter is played on foot in Fujacal (decisions 003 and 031), and the owner chose to play it inside
Party Kart's open world, not as a game of its own (2026-10-19): the city, the rooms, the invite links
and the menus are already there. Before anyone can shoot, a player has to be able to get out of the
kart and walk the streets, pavements and steps at a person's height, stopped by the walls and the
buildings, and the others in the room have to see them. This is that, for the whole open world.

## What

Today (party-kart `a611fba`, braga-map 1.29.0):

- The modes are module state in `src/main.ts`: `roam` (`RoamCtx`, `:233-261`, a `Roamer` made at
  `:817`) and `race`. `frame()` (`:1642-1696`) steps one and picks the camera: `chase` (`:1544`),
  `orbit` (`:1572`) or `flyCam` (`:1589`).
- Flying (task 054) is the precedent: `fly(r, on)` (`main.ts:865-886`) makes a `Flyer`
  (`src/game/flyer.ts`) from the camera; the kart waits where it is, still sending its snapshot
  (`stepRoam` passes `stopInput`, `:922`), and stopping puts it back with `landing(world.drive, …)`.
  A race the host starts ends the flight.
- The ground (`src/world/ground.ts`): `WorldGround.floor(x, z, y)` (`:434`) is the highest surface
  within `STEP` (0.3 m, `:32`) over `y`, of land, pavement, path, steps' treads and street or deck,
  and says which. Walls, fences, hedges, gates and buildings are `Wall` segments (`:51-59`), trees are
  `Post`s; a kart is pushed out of them by `walls()` and `deepest()` (`:613`, `:636`), which are
  private and sized for a kart's two circles (`CAR_R` 0.8 m). Nothing tests a point or a small circle
  against them from outside.
- Input (`src/input.ts`): `KEYS` and `ACTIONS` (`:3-22`) have no walking; F is free. The mouse looks
  round only while flying, by dragging, with no pointer lock "as Esc is the menu" (`:102-103`). The
  touch pad (`TouchPad`, `:160`) has a stick zone on the left (`t-steer`) and a drag zone for looking
  (`t-look`), shown by mode (`show(mode)`).
- The snapshot (`Snap`, `src/session.ts:48-62`) is a car's: position, heading, up, speed, steer and
  flags. `cleanSnap` (`:158`) sanitises it.
- The drivers are the five friends by first name, each a cartoon figure in a car that's a joke about
  them (decision 014): `buildDriverFigure` (`src/render/drivers.ts:142`) is a seated torso, arms and a
  big head, never a likeness.
- Fujacal, the shooter's area, lies wholly inside the open world's area (21.5 ha, checked 2026-10-19),
  and the race's tiles (`course.box`) cover it.

Steps:

1. **The walker,** in the simulation (`src/game/walker.ts`, no three.js, no DOM): a person 1.75 m tall
   with the eye at 1.65 m, a circle of about 0.3 m; walking about 1.5 m/s, running about 5 m/s, a
   short jump. It stands on `floor()`, steps up a kerb or a tread (up to `STEP`) and drops off a
   retaining wall but can't climb one, and is stopped by every `Wall` and `Post` at its own radius:
   expose from `ground.ts` a circle test that both the kart and the walker use, without changing how
   a kart drives (its tests). It stays inside the open world's area, as a kart does.
2. **Getting out and back in:** F (and a touch button, "A pé") gets out beside the kart, on the
   pavement side if there's room; the kart waits where it stopped, as when flying. F again, or the
   button, is back in the kart where it waited. Not during a race: a race the host starts puts a
   walker back in the kart first.
3. **First person** (the owner's answer, 2026-10-19). On a computer, the mouse looks round with pointer
   lock while on foot; the browser's Esc releases the lock, and the game opens the menu when it does,
   so Esc still is the menu. WASD or the arrows walk, Shift runs, Space jumps. On a touch screen, twin
   sticks (the owner's answer): the left stick walks (running when pushed to its edge), dragging on the
   right looks round, a button jumps. The camera's height follows the walker smoothly up steps and
   kerbs, with no bob that makes anyone sick.
4. **Seen by the others:** the snapshot carries a walker's position, heading and pitch, and the kart's
   where it waits; `cleanSnap` cleans them. Each player is the driver they picked, standing (the owner's
   answer): the figure from `drivers.ts` with legs, a walk and a run, drawn where their snapshot puts
   them, 110 ms behind as the cars are. Their kart stands empty where it waits. Change the peer prefix.
5. **The HUD on foot:** the speedometer and the kart's buttons go; the street's name and the minimap
   stay; a dot in the middle of the screen.
6. **Tests** (`test/walk.test.ts`): a walker climbs a flight of steps tread by tread and a kerb; is
   stopped by a building's wall, a garden wall, a hedge and a tree's trunk; can't climb a retaining
   wall but drops off one; stays in the area; and a kart drives as before (`drive.test.ts`,
   `ground.test.ts`).
7. Walk Fujacal in the browser on High and on a phone (`?stats`): the five streets, the steps, the
   courtyard of the flats behind the Rua Monsenhor Airosa through its passage (SHOOTER-AREA.md, "Where
   the player goes"), and note in Notes every hole, wall that doesn't stop, and step that can't be
   climbed. Those that are the data's become tasks; the frame rate goes in Notes.
8. Update `README.md` (the controls), `docs/architecture.md` (the modes, the snapshot) and `CLAUDE.md`
   where it lists the modes. `npm test` and `npm run check`.

## Read first

- party-kart's `CLAUDE.md` and `docs/architecture.md`, "The modes", "The simulation" and "The network".
- `src/game/flyer.ts` and `main.ts`'s `fly`, `stepRoam` and `frame`: the mode it's modelled on.
- `src/world/ground.ts`: `floor`, `walls`, `deepest`, `Wall`, `Post`.
- `src/input.ts`: the keyboard, the mouse and the touch pad.
- braga-map's `docs/SHOOTER-AREA.md`: where a player may go in Fujacal and what walking distance asks.

## Done when

- [x] A player gets out of the kart, walks anywhere in the open world in first person, on a keyboard
      and mouse and on a touch screen, and gets back in where the kart waited.
      *(headless Chromium with the pointer locked, and an emulated phone's touch; `walk.test.ts`'s
      "out of the kart beside it")*
- [x] Walls, fences, hedges, trees and buildings stop a walker; kerbs and steps are climbed; the
      tests in `test/walk.test.ts` pass, and the kart's tests are unchanged.
      *(`walk.test.ts`'s 9 pass; `drive.test.ts` and `ground.test.ts` pass as before, 2026-10-20)*
- [x] A guest in another browser sees the walker as the driver they picked, walking, and the empty
      kart where it waits. *(two browser contexts in one room, through PeerJS's public server)*
- [x] Fujacal walked end to end; what's wrong at walking distance is in Notes, the data's faults
      drafted as tasks (076, 077, 078; 051's noted there); the frame rate on foot on High is in Notes.
      On a phone it wasn't measured: the owner closed the task without it (2026-10-20).
- [x] `npm test` and `npm run check` pass. *(81 tests, 2026-10-20; and braga-map's `npm test`, 142
      and 1 skipped)*

## Out of scope

- Weapons, health and the deathmatch: task 074. Bots on foot: task 075.
- Going into a building (decision 031), crouching, climbing, swimming.
- Detail the city lacks at walking distance: SHOOTER-AREA.md's tasks (044, 051, 018, 020).

## Notes

Drafted 2026-10-19 from the owner's answers: the shooter lives in Party Kart on foot, first person,
each player the friend's figure they picked, twin sticks on a touch screen. When it's done, a
DECISIONS.md entry records where the shooter lives and how it's seen (it settles decision 031's "the
shooter's engine isn't chosen"), and SHOOTER-AREA.md's "Data only" says so.

It follows 071 in party-kart, as both change `main.ts` and `session.ts`. braga-map's stream 1 task 044
changes party-kart's `ground.ts` too: not two sessions on it at once.

Viewpoints: none, as the city doesn't change; the budget for the figures' legs and walk, in Notes.

### 2026-10-20: the work (party-kart, on top of 071 and 072's uncommitted changes)

- **The walker** (`src/game/walker.ts`): 1.75 m tall, the eye at 1.65 m, a circle 0.3 m round,
  1.5 m/s walking and 5 m/s running, a jump of about 40 cm (2.8 m/s up). It stands on `floor()`, up a
  step (`STEP`) and down any; goes up no bank steeper than 45° off the streets and paths, jumping or
  not (a retaining wall's foot is such a bank: the tiles' land ramps up to its top over 2 m); and
  bridges gaps of up to 15 cm between two treads, which the map leaves in some flights and which,
  where the land is drawn over the treads, would be a wall (`footing`). `alight` puts it beside the
  kart, its right side first, on a pavement, path or steps if there's room, else the other side, in
  front, behind, or where the kart is.
- **The circle test** (`WorldGround.circle` in `ground.ts`) is the kart's private `deepest` made
  public, with its radius and height as parameters (a kart's by default, so its tests are unchanged:
  81 pass). On foot (`onFoot`): a retaining wall is a drop from its upper side (the right of its line
  is its lower side, as braga-map has it) and stands as high as its top, not `HOLD` over it; and a wall
  thinner than 0.5 m, one line for a kart, stands its faces where they're drawn (`Wall.half`).
- **Getting out and in:** F, the bar's "🚶 A pé" and the menu's; F again or "🏎️ Voltar ao kart". Not
  while flying (and V does nothing on foot). A race the host starts ends it (`stopRoam`).
- **First person:** pointer lock on a computer; the browser's Esc releases it, which opens the menu
  (`Mouse.onLost`), and Esc's own keydown, where a browser sends it, is ignored for 0.5 s after; a click
  on the world locks it again, as does closing the menu. Never on a touch screen. ←→ turn, as flying.
  The camera's height eases (70 ms) up kerbs and treads, no bob; its near plane is 10 cm on foot (a
  wall can be 30 cm away), 30 cm otherwise. Touch: the stick (flying's) walks, runs at its rim; the
  right half's drag looks; Saltar. A Space press counts as a jump however short.
- **Seen by the others:** `Snap` has `w`, `pi`, `kx`, `ky`, `kz`, `kw` (on foot, pitch, where the
  kart waits), cleaned in `cleanSnap`; prefix `pk40`. They're drawn as the driver they picked,
  standing (`buildWalker` in `drivers.ts`: the seated figure without its arms, on legs, arms and legs
  swinging, leaning into a run, the head tilting by the pitch, scaled to 1.75 m), 110 ms behind, their
  name over them; their kart empty (`KartModel.figure` hidden) where it waits, which is what the karts
  bump into. On foot your engine is off, and so are the others' who are on foot.
- **HUD:** the speedometer and speed lines go, the street's name and the minimap (round you, your
  kart a dot) stay, a dot in the middle; the keys line says the keys on foot. `?stats` says "a pé".
- **A fault found on the way, fixed:** the frame's `dt` could start negative (about −6 s in
  headless Chromium, the first frame stamped before the city was built), so nothing stepped for the
  game's first seconds, karts included. Now clamped at 0.

**Tests** (`test/walk.test.ts`, 9): walking and running pace; up a kerb and back; up the 47 steps at
(-158.9, 1278) tread by tread (51 treads, 33.5 s) and down, walking and running; into a building's
wall at five angles, stopped 0.3 m from it; into five walls, hedges and gates walking and running (30
walks); into ten trees' trunks; three retaining walls 1.2 m or higher not climbed walking, running or
jumping, and dropped off from their top; the area's edge at ten gates; out of the kart onto the
pavement on its right. `npm test` (81) and `npm run check` pass.

**Fujacal walked** (a survey in Node with the walker, then in the browser on High):

- The streets: every named street in the shooter's area (13) walked along its middle both ways,
  nothing stopping it and nothing lost. Their pavements too, from a line 1.2 m in from each kerb,
  which too often runs into the buildings to say anything.
- The steps: 13 flights. 8 up and down. The Travessa do Fujacal's 17 steps only once the walker
  bridged a 4.5 cm gap between two treads under the land (above). The 8 at (-269.9, 801) climb to a
  building's door (right). Two flights' ends miss what they lead to by 0.6 to 1.07 m (task 051's,
  noted there); one flight stands 3 to 6 m over the land (task 076).
- The passages: the courtyard's, off the Rua Doutor José Vilaça at (-319, 931), walked through both
  ways, along a lane 0.6 m wide where the next building's corner narrows its mouth; the other, at
  (-262, 924), shut at both ends (task 078).
- The walls (into each straight stretch's middle from both sides, running and jumping): every hedge
  (152) and gate (51) stops a walker; 453 of 457 walls (the 4 stand 4 to 7 m over the land); 140 of
  153 retaining walls (the 13 have their lower side drawn within a step or a jump of their top). Task
  077.
- Seen on foot: the land is drawn over the Travessa do Fujacal's 17 steps, the handrail sticking out
  of a slope (task 076); 565 of the open world's 1,896 treads have the land 15 cm or more over them.
- **Frame rate on foot, High:** 60 fps at six places (the Rua and the Alameda do Fujacal, the 17 steps,
  the Rua Conselheiro Lobato, the courtyard's passage and the courtyard), the worst second 53 (as the
  walker was moved between them), 154 to 226 draw calls, 1.8 to 2.7 M triangles; headless Chromium on
  an NVIDIA GeForce RTX 4060 Ti at 1280×720, capped at 60. **On a phone: not measured** (the owner's,
  with `?stats`).
- **The budget:** a figure standing is 17 to 20 meshes and 4.7 to 5.6 k triangles (the seated one it
  replaces is 9 to 12 and 4.3 to 5.3 k), no textures: with seven others on foot, about 60 more draw
  calls and 3 k more triangles than in their karts, and the shadows' pass as many again.

**Not verified:** the pointer lock and Esc in a headed Chrome, Firefox or Safari (headless Chromium
granted the lock, and Esc opened the menu once and released it); a real phone (touch was driven with
CDP's touch events in an emulated phone: walking, running at the stick's rim, looking, jumping, in
and out); two players on different machines (two browser contexts in a room through PeerJS's public
server: each saw the other standing, walking and running, and the empty kart).

**Left for later, not drafted:** a walker walks through karts, its own and the others' (the karts
aren't walls); no footsteps' sound. Both matter to 074 more than here.

**Before committing party-kart:** its `package.json` has `braga-map` at `file:../braga-map` (072's
change, for the Volta de Lamaçães), to be put back to a version tag; 071 and 072's changes are in the
same working tree.

### 2026-10-20: finished

The owner closed it without the phone's frame rate. Decision 055 records where the shooter lives and
how it's seen; SHOOTER-AREA.md's "Data only" says so. The two things left for later (a walker walks
through karts; no footsteps) are in task 074's Notes, as the deathmatch is where they matter.
Committed with 071 and 072 in party-kart, on braga-map 1.30.0.
