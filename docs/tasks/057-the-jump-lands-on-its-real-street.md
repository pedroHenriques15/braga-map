---
status: blocked
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

Steps:

1. Drop the jump's streets from `kept`, so they're measured and moved like any other.
2. The race lands as the owner chooses (Questions), and party-kart's tests pass: the autopilot laps
   with no respawn, the Volta dos Amigos' jump lands on the race's road from braga-map's speed to
   flat out.
3. Shoot `couteiro` and look at the jump from above, before and after.

## Questions

- [ ] How does the race land on the real street? Options: the race's road takes in the corner
  between the flight and the landing street (the ground there, as it takes in the flight past the
  landing), so a kart can run wide into it (recommended: the street stays as it is, the race's
  walls give a kart room); party-kart's autopilot and bots take the landing slower and wider; or
  another jump, jump 2 above, straight on off the flight onto its street (the owner would see it
  first, as decision 027 has it).

## Read first

- braga-map: `tools/carriageways.mjs` (`kept`, `movesOf`), `tools/track.mjs` (`road`, the jump's
  flight, `JUMP`), `tools/tracks.mjs` (`jump`), decisions 027, 029 and 039, task 039's notes.
- party-kart: `test/drive.test.ts` (the lap), `src/car/autopilot.ts`, `src/world/race.ts`.

## Done when

- [ ] The jump's streets are on their carriageways, at their measured widths, as every other street
  in the area (`kept` empty).
- [ ] party-kart's `npm test` and `npm run check` pass on the new tag, and a lap with the autopilot
  and three bots goes over the jump with no error.
- [ ] The owner has seen the landing (from above and from the kart) and approved it.

## Out of scope

- Any other street: task 026 moved them.

## Notes

- Found by task 026 (2026-10-17), when party-kart's lap test stopped at the landing on braga-map
  1.20.0. Blocked on the question.
