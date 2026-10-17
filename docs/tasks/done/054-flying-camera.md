---
status: done
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
   - It never goes lower than 1 m over `ground(x, z)` and never climbs higher than 500 m over it
     (over a valley it settles down to that in about a second, rather than following every hill).
     It passes through buildings and trees (Questions).
   - It flies as far as the horizon (Questions): braga-map's `horizon` grid, the hills 15 km
     round every 250 m, less a margin where the haze hides the grid's end, set by looking from
     there. Past the map's hills every 50 m (`far`, 6.5 × 4.6 km) only the horizon's are under it.
   - `ground` and the bound come in as arguments, so `test/fly.test.ts` can give it its own.
   - `ground`, in the game, is the highest of what's drawn at (x, z): the city's `world.ground` in
     the scenery's box, the hills every 50 m round it and the horizon's every 250 m, each as its
     triangles are drawn (`city.ts`, `sights.ts`'s `horizon`), so the camera never dips into a hill
     between the grid's points.
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
       the race is over you're back in your kart where it waited, driving: the race ended the
       flight, it didn't land it.
   - When you stop flying, your kart is put on the street nearest the point under the camera, inside
     the area, facing along it the way nearest the camera's (Questions): `world.drive.spawn`, from
     the area's nearest point when the camera is outside it. The others see it jump, as after
     "↺ Reposicionar". The chase camera goes to it from where the flying camera was, at once when
     that's more than 150 m off (`chase`).
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
     heard where they are, as now. Your own, in your head while you drive, is heard from where your
     kart waits.
   - The sky (a box 20 km across round the map's middle) goes with the camera, if the bound takes
     the camera out of it.
   - `RoamHud` hides the speed, and its minimap's arrow is the camera's, at its yaw.
5. **For testing:** under `?autodrive`, `window.__kart` adds `fly` (whether you're flying) and
   `cam` (the camera's x, y, z, yaw and pitch).
6. **The docs:** the README's "Playing" (the menu's list, the keys and the touch tables),
   `CLAUDE.md`'s "Trying it in a browser", and `docs/architecture.md`'s code table, "One frame" and
   "The modes".

## Questions

They don't block the start: "What" follows each recommendation. The session that starts the task
asks any still open with AskUserQuestion before it changes the code.

- [x] Which screens can fly? Options: keyboard and mouse, and a touch screen too (recommended:
  the friends play on phones, and everything else in the game works on both); or keyboard and
  mouse now, and touch in a task of its own.
  > Keyboard and mouse, and a touch screen too (the owner, 2026-10-16).
- [x] How far and how high? Options: over the open world's area and the 300 m round it that the
  city builds, from 1 m over the ground to 500 m (recommended: all of it is built; past it the
  hills are bare); only over the area, up to 100 m, as a drone flies; or anywhere over the map's
  hills, as far as the horizon (bare hills past the 300 m, and the edge of the built city in view).
  > Anywhere over the map's hills, as far as the horizon (the owner, 2026-10-16).

  That option names no height, so the flyer keeps the recommendation's, 1 m to 500 m over the
  ground (the session's reading).
- [x] When you stop flying, where's your kart? Options: where you left it, as it waited there
  (recommended: flying is for looking, and nothing changes for the room); or put on the street
  nearest under the camera, to drive on from there (a quick way across the area; the others see it
  jump, as after "↺ Reposicionar").
  > Put on the street nearest under the camera, to drive on from there (the owner, 2026-10-16).
- [x] Through buildings? Options: through everything but the ground (recommended: the simplest;
  from inside a building you see out, as its walls are drawn from outside only); or stopped at the
  buildings' walls and roofs, as a kart is (needs the buildings' heights in the walls test, which
  `ground.ts` keeps in 2-D).
  > Through everything but the ground (the owner, 2026-10-16).

## Read first

- party-kart: `CLAUDE.md` (the two halves, the touch screen's gotcha, the UI's Portuguese),
  `src/main.ts` (`RoamCtx`, `stepRoam`, `frame`, `chase`, `orbit`, `holdView`, `widen`, `hear`,
  `menuScreen`, `bar`, `howTo`, `startRace`, `endRace`, `keepWhere`, the `keydown` listener),
  `src/input.ts`, `src/hud.ts` (`RoamHud`), `src/render/look.ts` (`follow`), `src/audio.ts`
  (`citySound`), `src/game/roamer.ts`, `src/style.css` (the touch pad), `test/roam.test.ts`.
- party-kart's `docs/architecture.md` ("One frame", "The modes", "Rendering") and README's "Playing".

## Done when

- [x] `test/fly.test.ts`: a flyer driven at the ground, past its bound and straight up, each
  for 10 s, ends 1 m over the ground, at the bound and 500 m up; let go, it stops within
  0.5 s; and its pace at 2 m and at 100 m up is about 6 and 80 m/s.
  > Its eight tests pass: those, the ceiling followed down over a valley, the pitch stopped at 85°,
  > the hills as their triangles are drawn, and landing on the real map from over a street and
  > from 5 km outside the area. Let go, it's still within 0.5 s, from 320 m/s too.
- [x] In a browser (Playwright, `?autodrive`): V, then W held 3 s, E held 2 s and a mouse drag
  move `__kart.cam` forward, up and round, while your kart's x and z stay put. V again, and the
  kart is on a street near the point under the camera, the camera behind it. The same from the
  menu's button, and from outside the area.
  > W 3 s: 21.9 m forward; E 2 s: 43 m up; a 200-pixel drag: 0.80 rad round; the kart moved
  > 0.0 m. V: the kart 3.8 m from the point under the camera, the camera behind it. The menu's
  > buttons the same, and with the menu open the camera held still. From 3.6 km east, 500 m up:
  > on a street at the area's east edge, facing in. Run again on the merge with 046 (1.18.1).
- [x] On a touch screen (Playwright with `hasTouch`, real touches through CDP): the stick, a drag
  on the right half and ▲ Subir do the same.
  > The bar's "Voar" flies, and the pad turns to its flying layout. The stick 2 s: 16 m forward; a
  > 100-pixel drag on the right half: 0.70 rad round; ▲ Subir 2 s: 45 m up, ▼ Descer 1 s: 33 m
  > down; both thumbs at once, moving and turning. "🏎️ Voltar ao kart" lands, the pad driving again.
- [x] In a room of two (two Playwright contexts): the other sees the one flying parked in its
  kart, and after it lands, its kart on the street under its camera. The host starting a race puts
  the flyer on the grid, and the race's end puts it back in its kart where it waited, driving.
  > The host flew 232 m off and 500 m up; the friend saw her kart where it was, to 0.1 m. She landed
  > 38 m from the point under her camera, and the friend saw her there. Flying again, she started a
  > race from the menu: on the grid, not flying; "Acabar a corrida" put her kart back where it
  > waited, to 0.1 m, and it drove 24 m in 2 s.
- [ ] The frame rate measured with `?stats` from 500 m over the area's middle, looking across it, and
  from the bound looking back at the city, at High on the owner's PC and at Medium on a phone. Where it's under 35 fps, the ceiling comes down
  until it isn't, or `watchSpeed` would step the graphics down for the driving too.
  > Half done. On the owner's PC at High, with the owner's leave (2026-10-16): 1.4–3.2 ms a frame
  > from 500 m over the middle, 1.4–4.1 ms from the bound, and the game flying held 60 fps (Notes).
  > On a phone it wasn't measured: the owner flew it on one and found it good, without looking at
  > `?stats` (2026-10-17). The ceiling stays at 500 m until a phone says otherwise.
- [x] The owner flies it on the PC and on a phone.
  > "I've flown it, its good" (the owner, 2026-10-17), from the worktree's dev server.
- [x] `npm test` and `npm run check` pass, and the docs say how to fly.
  > 57 tests pass and `tsc` is clean, on the branch and again on its merge with `main` (braga-map
  > 1.18.1). The README's "Playing" (the menu's list, the keys, a flying table, the touch table),
  > `CLAUDE.md`'s "Trying it in a browser", and `docs/architecture.md`'s code table, "One frame",
  > "The modes" and `Look`.
- [x] In party-kart's `main` before its next `npm run deploy` (the owner, 2026-10-16).
  > `5abc39b`, pushed 2026-10-17: `a1fbfdc` with `main` (046's 1.18.1) merged into it. Not deployed.

It changes nothing `?scenery` shows, so no viewpoint is shot again, and it adds no geometry or
texture. The budget's frame rate from the air is the item above. (The sky going with the camera
changed 157 of a view's 518,400 pixels by one level in 255: Notes.)

## Out of scope

- Watching a race from the air, or following a friend's kart: a task of its own if wanted.
- Building more of the city round the camera, or past the 300 m: task 038's.
- A photo mode, or recording a flight's path.

## Notes

- Drafted 2026-10-16 at the owner's request ("spectate": a flying camera the player controls, to
  explore the map freely), to be done before party-kart's next deploy.
- **Where to work:** a party-kart worktree of its own (`../party-kart-054`, branch `task-054` from
  `main`, `npm install` in it), merged into `main` when done, as another session may use party-kart's
  main folder to try a braga-map change (`npm install --install-links ../braga-map`, which changes
  its `package.json`).
  - 048 and 017 have landed (2026-10-16): party-kart's `main` is `ad9814e`, on braga-map 1.18.0,
    pushed but not deployed. The deploy after this ships the three together; read their notes in
    party-kart's `docs/architecture.md` ("The city's budget") before measuring the frame from the
    air, as 017's balconies added 0.3 M triangles on High at the median.
- Not checked: the frame rate from high up, where the whole area's buildings are in view at once
  (its six meshes a square kilometre all drawn); how the sun's 140 m shadow box reads from 500 m
  (a patch of shadows round the point looked at); and how the built city's edge, 300 m past the
  area's, looks from the top (bare hills past it), against the fog.
- **Started 2026-10-16** in `../party-kart-054` (branch `task-054` from `d49612c`), the questions
  answered first. What the session found and checked before the owner flew it:
  - The sky is a box 20 km across round the map's middle, so past 10 km out it went black: it now
    goes with the camera (`Look.render`). Its colour is only the way you look, so `?scenery` is as it
    was: one view shot both ways differed in 157 of 518,400 pixels, by 1 level in 255, all sky.
  - The bound: the horizon's grid less 6 km (`HAZED`), x −7,250 to 10,750 and z −9,250 to 8,750.
    Looked at from its east edge, 500 m up: the grid's end is a far, hazy ridge against the sky.
  - Landing from outside the area faces the kart into it: from the area's nearest point it had
    faced out, against the edge's barriers.
  - In a browser (Playwright, `?autodrive`): the keyboard and mouse, a touch screen (real touches,
    both thumbs at once) and a room of two each did what "Done when" asks.
  - The frame from the air at High on the owner's PC (RTX 4060 Ti, 1920 × 1080, `?scenery`'s
    `timeFrames`, with braga-map's world being built beside it): 1.4–3.2 ms from 500 m over the
    area's middle looking across it (2.06 M triangles, 158 draw calls), 1.4–4.1 ms from the bound
    looking back (2.94 M, 300: the whole city drawn behind the hills), against 1.2–1.3 ms at street
    level (1.73 M). The game flying there held 60 fps, its worst frame 17 ms.
- **Done 2026-10-17**, landed as 017 was: committed on `task-054` (`a1fbfdc`), party-kart's `main`
  merged into it (`5abc39b`, braga-map 1.18.1 with 046), tested again, and pushed as `main`'s next
  commit. Not deployed: the owner deploys, and the deploy ships 048, 017, 046 and 054 together.
  - Open: the phone's frame rate from the air (the item above). If a phone runs under 35 fps up
    there, `watchSpeed` steps its graphics down, for the driving after too.
  - party-kart's main folder still has `main` at `a62d73a` (another session's): it fast-forwards
    to `5abc39b` with `git pull`.
