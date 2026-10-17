---
status: done
priority: medium
kind: code
repo: both
created: 2026-10-17
depends-on: [026]
roadmap: Phase 2 · The shape
---

# 057 · The race's jump lands on its street as it really is

## Why

Task 026 moved every street in the open world's area onto its carriageway as DGT's LiDAR measures
it (decision 039), but three: the streets the Volta dos Amigos' jump takes off from and lands on
(decision 027), which it keeps as the map has them. The landing street in the pocket (way 184815719,
from the landing at (-560.9, 1156.9) east-south-east past (-541.5, 1169.5)) is 5 m wide kerb to kerb
by the LiDAR and in the orthophoto, where the map guesses 6.5. At 5 m, party-kart's autopilot, coming
down off the jump at speed, can't make the turn into it (36° off the flight): it stops against the
race's wall at the corner, at (-557, 1154), and its lap test never finishes a lap. So the jump the
owner approved still lands on a street 1.5 m wider than the real one, and moved as the map has it.

## What

Today (2026-10-17):

- `tools/carriageways.mjs` keeps as the map has them (`kept`, in `.cache/carriageways.json`) every
  street that passes within 2 m of a track's ramp's lip or landing (`tracks/<id>.js`'s `ramps`): the
  landing street, the Rua Professor Mota Leite (the run-up) and the Rua Padre Armando Lira at the
  lip. Their lines and widths are the map's, and the streets round them ease their moves out before
  them, as at a deck's end.
- The race's road (`tools/track.mjs`'s `road`) takes in the jump's flight, as wide as the ramp and
  2 m either side, to 40 m past the landing, where a kart flat out comes down; the line turns from the
  flight onto the landing street at its first node.
- With the landing street at 5 m (try it: leave `kept` empty, `node tools/carriageways.mjs`,
  `npm run world`, `npm run tracks`, then in party-kart `npm install --install-links ../braga-map`
  and `npm test`), the autopilot stops at (-557, 1154).
- Moving the streets made another jump the planner's cheapest (jump 2: from the Rua Manuel Ferreira
  Araújo at (-704, 1437) onto a residential street at (-663, 1398), 56 m, 4° onto the ramp and 3° off
  the flight, the loop 9.77 km instead of 10.25). `tools/tracks.mjs` names the approved one's lip
  (`jump`), so the planner keeps it.

Found on starting (2026-10-17, Notes): at 5 m the landing street no longer cuts back the walls
`tools/walls.mjs` finds beside it, and the corner between the flight and the street is a walled lot.
A 3.2 m wall runs along the street's north kerb, and the 2.75 m wall the flight crosses runs on to
the kerb at the landing, with a 1 m gate between them. Karts leave the lip 4–6° left of the flight
(the run-up turns 8° onto the ramp at its foot), come down about 4 m left of the line and hit that
wall in the air; the autopilot stops at (-557, 1154).

Steps:

1. Drop the jump's streets from `kept`, so they're measured and moved like any other.
2. The race's road (`tools/track.mjs`'s `road`) takes in the corner between the flight and the
   landing street, the ground there, as it takes in the flight past the landing, so a kart coming
   down can run wide into the street; the street stays at its measured width, and the race's walls
   stand round the corner it takes in (Questions).
3. While a race runs, the world's walls inside the race's road near the landing are taken down: the
   lot's corner, where the race takes it in (Questions). The track says where (braga-map), and
   party-kart leaves them out of the race's ground and doesn't draw them in a race; free roam keeps
   them. party-kart's tests pass: the autopilot laps with no respawn, the Volta dos Amigos' jump
   lands on the race's road from braga-map's speed to flat out.
4. Shoot `couteiro` and look at the jump from above, before and after.

## Questions

- [x] How does the race land on the real street? Options: the race's road takes in the corner
  between the flight and the landing street (the ground there, as it takes in the flight past the
  landing), so a kart can run wide into it (recommended: the street stays as it is, the race's
  walls give a kart room); party-kart's autopilot and bots take the landing slower and wider; or
  another jump, jump 2 above, straight on off the flight onto its street (the owner would see it
  first, as decision 027 has it).
  > The race's road takes in the corner, the street as it really is (the owner, 2026-10-17).
- [x] The corner is a walled lot, and the approved jump lands beside its 3 m wall (Notes). How
  should the race land on the real street? Options: the race takes down the lot's corner while it
  runs (the walls inside its road there, about 30 m and the gate; free roam keeps them; recommended:
  measured, no kart stuck and the bots' respawns down to about one a race); party-kart's karts fly
  the flight's line exactly, so they clear the wall (not shown to work, and a player 2 m off still
  hits it); keep the jump's streets as the map has them (drop 057); or another jump, the planner
  checking the walls the LiDAR found (jump 2 lands beside a wall too).
  > The race takes down the lot's corner (the owner, 2026-10-17).

## Read first

- braga-map: `tools/carriageways.mjs` (`kept`, `movesOf`), `tools/track.mjs` (`road`, the jump's
  flight, `JUMP`), `tools/tracks.mjs` (`jump`), decisions 027, 029 and 039, task 039's notes.
- party-kart: `test/drive.test.ts` (the lap), `src/car/autopilot.ts`, `src/world/race.ts`.

## Done when

- [x] The jump's streets are on their carriageways, at their measured widths, as every other street
  in the area (`kept` empty).
  > `kept` is gone from `tools/carriageways.mjs`: the landing street (way 184815719) 5.0 m wide, moved
  > 0.25 m; the Rua Professor Mota Leite's middle 3.4 m off at (-639, 985), 5.9 m wide; 245 streets
  > moved (244 before), 161 widths measured clearly (158). `test/carriageways.test.js` holds them to
  > their middles like the rest; braga-map's 111 tests pass.
- [x] The race's road takes in the corner between the flight and the landing street, and the world's
  walls inside it near the landing are down in a race (drawn and driven), up in free roam.
  > The corner 164 m² (`npm run tracks`); `cleared` takes down 18.1 m of the 2.75 m wall, 12.9 m of the
  > 3.18 m wall and the 1 m gate. party-kart's test "the race takes the lot's walls down at the
  > landing, and round the city they stand": 18 pieces of wall down, 32.2 m drawn apart, none in free
  > roam's ground, no building's. Shot round the city and in a race from the lot and on the flight's
  > line: the walls up, then down with the road works' boards along the corner's edge.
- [x] party-kart's `npm test` and `npm run check` pass on the new tag, and a lap with the autopilot
  and three bots goes over the jump with no error.
  > On braga-map v1.22.0: `npm run check` clean, 63 tests pass (the autopilot's laps 301.7 and 299.9 s,
  > no respawn; eight bots within 5.1 s, no respawn; the jump lands on the race's road from 121 to 158
  > km/h). A lap in the browser (`?autodrive`, three bots, Playwright): 310.6 s, over the jump, no page
  > error.
- [x] The owner has seen the landing (from above and from the kart) and approved it.
  > Shown from above (the orthophoto with the race's road and the karts' paths, and the game from the
  > lot) and from the kart (the chase camera over the jump, and on the flight's line), and on the dev
  > server with `--host`: approved 2026-10-17, with the road works' boards added round the corner
  > first.

## Out of scope

- Any other street: task 026 moved them.

## Notes

- Found by task 026 (2026-10-17), when party-kart's lap test stopped at the landing on braga-map
  1.20.0. Blocked on the question.
- Unblocked 2026-10-17: the owner chose the recommendation, the race's road taking in the corner.
- **Started 2026-10-17. Two assumptions were false**, measured with scratch probes in party-kart
  (the autopilot from the run-up at three lines and two cautions, and eight bots racing a lap, twice;
  the hits within 60 m of the landing and what each was against: the race's edge, a wall, a building):
  - **The street's width alone doesn't stop the autopilot.** With `kept` dropped and 1.20.1's walls,
    all 62 of party-kart's tests pass (laps 302.0 and 299.8 s). The landing street is 5.0 m, moved
    0.25 m; the run-up's middle 3.4 m off at (-639, 985), 5.9 m wide.
  - **The walls are what stops it.** `walls.mjs` cuts a wall where a carriageway runs, and the map's
    6.5 m street had cut back the lot's walls north of the landing. At 5 m they're there: the 2.75 m
    wall the flight crosses, (-576, 1142) to (-556.3, 1156.1), now to the kerb; a 3.18 m wall along
    the street's north kerb, (-554.6, 1157.2) to (-542.9, 1165.9); a 1 m gate between them. DGT's
    surface model has them 2–3 m over the ground, 2.0–3.0 m north of the street's line, 2 to 17 m
    along it. On the line, the slowest flight clears the wall where it crosses (5.9 m before the
    landing) by about 1.6 m.
  - **Karts leave the lip off the flight.** The run-up turns 8° onto the ramp at its foot, 7.5 m
    before the lip, and the autopilot is still turning there: its velocity 4–6° left of the flight
    at the lip, 4.4 m left of the line at the landing, in the air into the wall; it stops at
    (-557.1, 1153.9), the point above. More than about 1.5° off at the lip meets the wall.
  - **The corner taken in is the lot,** behind those walls: with the 20 m corner (164 m²) and the
    walls, the autopilot sticks at (-548, 1161) and the bots respawn 8–9 times a race; without the
    corner it sticks at (-557, 1154) and they respawn 10–14 times.
  - Tried and left: the line onto the ramp's axis further up the run-up (only 8 m more fits in the
    street; still 5° off at the lip); the autopilot aiming at the landing over its last 10–60 m
    (about 3 m left still, or it misses the ramp and falls in the river); jump 2 (JUMP=2: it lands
    beside a wall the LiDAR found at (-661, 1401), and the lap test fails).
  - **The corner taken in, the walls inside the race's road within 20 m of the landing left out:**
    the autopilot never sticks, one kerb hit a run (the outside of the turn, 13 m on, as on 1.20.1);
    the bots respawn once a race, short of the landing, with 1–4 hits near it (1.20.1: 6–7 hits,
    1–3 respawns). The owner chose this (Questions).
- **Landed 2026-10-17, braga-map 1.22.0 and party-kart 9256881 pinned to it** (the owner's answers in
  Questions, decision 042). After 056, 058 and 049 landed, main was merged and the whole remake run
  again (carriageways, walls, open, shooter, world, tracks, cover, textures, the page; the edge
  again on the new track: it holds). The remake's own changes: the track and one tile, x-2z2.
  - **The road works' boards** (the owner's answer when approving): `boards`, one row of 35 m along
    the corner's chord across the lot, on the ground's height; party-kart draws two red-and-white
    boards on trestles every 2 m with the race's marks.
  - **Six races of eight bots each** (a scratch probe): 24 wall hits and 7 respawns within 60 m of
    the landing, against 42 and 18 on 1.20.1. The hit left is on the outside of the turn, the street's
    south kerb 13 m on, as on 1.20.1, and bots that come down furthest left meet the corner of the
    building at the corner's far end.
  - **party-kart's peer id prefix is pk36:** the race's road changed.
  - **The budget:** `couteiro` 3 draw calls more (the walls drawn apart), 294 triangles more at High
    and 142 at Low, the same textures.
  - **`couteiro` before (1.21.1) and after (1.22.0)**, both shot in party-kart's main: the same within
    0.57% of its pixels, none by more than 24 levels. The landing is about 440 m on, behind the
    buildings.
  - **The round "A aterragem"** (`2026-10-17-after057`), on "Braga real": no place shows the landing,
    and Claude's marks are the last round's, 2.65 over the 34. Its shots differ from "Onde a foto foi
    tirada" (shot in 058's checkout) only in the grain of the walls and the asphalt, by 1 to 4 levels
    on average. The page held 488 of the 511 files a version can, so `tools/round.mjs` now takes a
    shot the same, byte for byte, as an earlier round's for that round's ([w, h, round]), and the
    page reads it from there: 61 were, and the page holds 461.
  - **Not checked:** the owner's marks for the round; the race with friends in a room; the deploy
    (not asked).
  - The facades test failed in this checkout while 056 was landing: its run of `tools/buildings.mjs`
    had written its viewpoints' buildings into the shared `.cache`; it passes with 056 merged.
