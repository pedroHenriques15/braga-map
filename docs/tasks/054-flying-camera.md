---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-16
depends-on: [036]
roadmap: Now · The open world
---

# 054 · A flying camera, to look round the city from anywhere

## Why

The owner wants to spectate: leave the kart and fly a camera round the map, to explore it freely.
Today the only way to see the city is from behind a kart on its streets, or from `?view=`, which
holds the camera still and is a developer's URL. A camera that flies lets a player look at Braga
from the air, over the rooftops, down a street the kart can't reach, or at a building from any
side. The owner can use it to judge the city the tasks build, without driving to each place first.
The owner wants it in before party-kart's next deploy.

## What

Today (2026-10-16), in party-kart:

- The game is always round the city (`roam`, a `RoamCtx` in `src/main.ts`) or in a race. Round
  the city, `stepRoam` steps your `Roamer` (`src/game/roamer.ts`) on the world's ground. `frame`
  then puts the camera behind it (`chase`), or turns it slowly round it while the menu is open
  (`orbit`). `?view=` holds the camera still in both (`holdView`). The C key and the 🎥 button
  switch between two chase cameras (`r.cam`).
- `src/input.ts`: `Keyboard` reads the arrows and WASD, Space, and the actions (E, Q and Shift use
  the item; Enter, Backspace, H and C), only while `keys.enabled`. `TouchPad` has a 1-D steering
  stick on the left half and Derrapar and Travar on the right, and `show(mode)` picks its layout.
  Nothing reads the mouse.
- `look.follow(p)` keeps the sun's shadow box, 140 m across, round your kart. `hear()` puts the
  sounds' listener on the camera, and `citySound(c.p, dt)` picks the city's sound from where your
  kart is. `RoamHud` shows the speed and a minimap with your kart's arrow.
- The city is built over the open world's area and 300 m round it (`city.ts`'s `reach`). Past
  that there are only the map's hills every 50 m and the horizon's. `world.ground(x, z)` is the
  highest of the land, the streets and the decks. The area's edge is braga-map's
  `world.drive.d.world.open.pts`, and `inOpen(x, z)` says whether a point is inside it.

Steps, as the recommendations in Questions have it:

1. **The flying itself, in the simulation's half** (`src/game/flyer.ts`, pure TypeScript with no
   three.js, as `CLAUDE.md`'s "The two halves" asks). A `Flyer` keeps a position, yaw, pitch and
   velocity. Its `step(input, dt)` takes the moves (forward, sideways, up, a turn, a look) and a
   "faster" flag:
   - The pace rises with the height over the ground, so a street can be looked at closely and the
     area crossed quickly: 6 m/s at a person's height, rising to about 80 m/s from 80 m up. Holding
     "faster" makes it 4 times that. The velocity eases towards the wanted pace in about 0.15 s, so
     it starts and stops smoothly and doesn't drift.
   - The pitch stops at 85° up and down.
   - It never goes lower than 1 m over `ground(x, z)`, never higher than 500 m over it, and never
     past 300 m from the area's edge. It passes through buildings and trees (Questions).
   - `ground` and the edge come in as functions, so `test/fly.test.ts` can give it its own.
2. **Into the air and back** (`src/main.ts`):
   - A button in the menu, "🎥 Voar pela cidade" beside "↺ Reposicionar", and the V key. While you
     fly, the button reads "🏎 Voltar ao kart". V does the same, and the bar at the top has the
     button too, for a touch screen.
   - The flyer starts where the camera is, facing the way it faces. With `?view=` it starts from
     there.
   - While you fly:
     - your kart pulls up and waits where it is, as with the menu open (`stopInput`), and goes on
       sending its snapshot, so the others see it parked;
     - the menu opens over the world as now, the camera holding still where it is, not orbiting
       the kart;
     - when the host starts a race, the flying ends and you're on the grid like everyone else; when
       the race is over you're back in your kart, driving.
   - When you stop flying, you're back in your kart where you left it (Questions), the chase camera
     snapping to it (`chase`'s jump of more than 150 m).
   - `keepWhere` keeps your kart's position, not the camera's, so the game always reopens driving.
3. **The controls** (`src/input.ts`), only while flying:
   - **Keyboard and mouse:**
     - W and S, or ↑ and ↓, go forward and back the way the camera faces, level;
     - A and D go sideways, and ← and → turn;
     - E goes up and Q down, and Shift held is the "faster" flag;
     - the mouse dragged with a button held looks round. There's no pointer lock, as Esc is the menu.
   - **Touch** (`TouchPad.show('fly')`):
     - the left half is a 2-D stick where the thumb lands, forward, back and sideways;
     - a drag anywhere on the right half looks round;
     - ▲ Subir and ▼ Descer stand where Derrapar and Travar are.
   - The help (`howTo`) says so in a line for keys and a line for touch, and the feed says it in one
     line when the flying starts.
4. **The camera, the light and the sound** (`frame`):
   - The camera is the flyer's, at a field of view of 70° (`widen`, which opens it up on a phone
     held upright).
   - The sun's shadows follow the point on the ground the camera looks at, at most 100 m ahead
     (`look.follow`), as `?scenery` follows a point 8 m ahead.
   - The city's sound comes from the ground under the camera (`citySound`), and the engines are
     heard where they are, as now.
   - `RoamHud` hides the speed, and its minimap's arrow is the camera's, at its yaw.
5. **For testing:** under `?autodrive`, `window.__kart` adds `fly` (whether you're flying) and
   `cam` (the camera's x, y, z, yaw and pitch).
6. **The docs:** the README's "Playing" (the menu's list, the keys and the touch tables),
   `CLAUDE.md`'s "Trying it in a browser", and `docs/architecture.md`'s code table, "One frame" and
   "The modes".

## Questions

They don't block the start: "What" follows each recommendation. The session that starts the task
asks any still open with AskUserQuestion before it changes the code.

- [ ] Which screens can fly? Options: keyboard and mouse, and a touch screen too (recommended:
  the friends play on phones, and everything else in the game works on both); or keyboard and
  mouse now, and touch in a task of its own.
- [ ] How far and how high? Options: over the open world's area and the 300 m round it that the
  city builds, from 1 m over the ground to 500 m (recommended: all of it is built; past it the
  hills are bare); only over the area, up to 100 m, as a drone flies; or anywhere over the map's
  hills, as far as the horizon (bare hills past the 300 m, and the edge of the built city in view).
- [ ] When you stop flying, where's your kart? Options: where you left it, as it waited there
  (recommended: flying is for looking, and nothing changes for the room); or put on the street
  nearest under the camera, to drive on from there (a quick way across the area; the others see it
  jump, as after "↺ Reposicionar").
- [ ] Through buildings? Options: through everything but the ground (recommended: the simplest;
  from inside a building you see out, as its walls are drawn from outside only); or stopped at the
  buildings' walls and roofs, as a kart is (needs the buildings' heights in the walls test, which
  `ground.ts` keeps in 2-D).

## Read first

- party-kart: `CLAUDE.md` (the two halves, the touch screen's gotcha, the UI's Portuguese),
  `src/main.ts` (`RoamCtx`, `stepRoam`, `frame`, `chase`, `orbit`, `holdView`, `widen`, `hear`,
  `menuScreen`, `bar`, `howTo`, `startRace`, `endRace`, `keepWhere`, the `keydown` listener),
  `src/input.ts`, `src/hud.ts` (`RoamHud`), `src/render/look.ts` (`follow`), `src/audio.ts`
  (`citySound`), `src/game/roamer.ts`, `src/style.css` (the touch pad), `test/roam.test.ts`.
- party-kart's `docs/architecture.md` ("One frame", "The modes", "Rendering") and README's "Playing".

## Done when

- [ ] `test/fly.test.ts`: a flyer driven at the ground, past the area's edge and straight up, each
  for 10 s, ends 1 m over the ground, 300 m past the edge and 500 m up; let go, it stops within
  0.5 s; and its pace at 2 m and at 100 m up is about 6 and 80 m/s.
- [ ] In a browser (Playwright, `?autodrive`): V, then W held 3 s, E held 2 s and a mouse drag
  move `__kart.cam` forward, up and round, while your kart's x and z stay put. V again, and the
  camera is behind the kart. The same from the menu's button.
- [ ] On a touch screen (Playwright with `hasTouch`, real touches through CDP): the stick, a drag
  on the right half and ▲ Subir do the same.
- [ ] In a room of two (two Playwright contexts): the other sees the one flying parked in its
  kart. The host starting a race puts the flyer on the grid, and the race's end puts it back in its
  kart where it was, driving.
- [ ] The frame rate measured with `?stats` from 500 m over the area's middle, looking across it, at
  High on the owner's PC and at Medium on a phone. Where it's under 35 fps, the ceiling comes down
  until it isn't, or `watchSpeed` would step the graphics down for the driving too.
- [ ] The owner flies it on the PC and on a phone.
- [ ] `npm test` and `npm run check` pass, and the docs say how to fly.
- [ ] In party-kart's `main` before its next `npm run deploy` (the owner, 2026-10-16).

It changes nothing `?scenery` shows, so no viewpoint is shot again, and it adds no geometry or
texture. The budget's frame rate from the air is the item above.

## Out of scope

- Watching a race from the air, or following a friend's kart: a task of its own if wanted.
- Your kart put down where the camera is, unless the owner picks it (Questions).
- Building more of the city round the camera, or past the 300 m: task 038's.
- A photo mode, or recording a flight's path.

## Notes

- Drafted 2026-10-16 at the owner's request ("spectate": a flying camera the player controls, to
  explore the map freely), to be done before party-kart's next deploy.
- **Where to work:** 048 (braga-map's main folder) and 017 (a braga-map worktree and party-kart's
  `../party-kart-017`, branch `task-017`) are under way. 048's session may try braga-map's change in
  party-kart's main folder (`npm install --install-links ../braga-map`, which changes its
  `package.json`). So this works in a party-kart worktree of its own (`../party-kart-054`, branch
  `task-054` from `main`, `npm install` in it) and merges into `main` when done.
  - 017 changes `src/main.ts` too, but only its `?photos` flag near the top, and `CLAUDE.md` and
    `docs/architecture.md`; whichever merges second takes the other's in.
  - Whichever of 048 and 017 lands first tags braga-map and pins party-kart as usual, but its
    `npm run deploy` waits until this is in `main`.
- Not checked: the frame rate from high up, where the whole area's buildings are in view at once
  (its six meshes a square kilometre all drawn); how the sun's 140 m shadow box reads from 500 m
  (a patch of shadows round the point looked at); and how the built city's edge, 300 m past the
  area's, looks from the top (bare hills past it), against the fog.
