---
status: done
priority: medium
kind: code
repo: party-kart
created: 2026-10-18
depends-on: [045]
roadmap: Now · The open world
---

# 066 · A car on a street beside a wall tilts by the street, not by the drop past its edge

## Why

party-kart tilts a car by the ground 1.5 m either side of it, wherever that falls. On a narrow
street beside a wall or a cutting, that's past the carriageway's edge, over the drop: on the Avenida
João XXI's 3.3 m upper lane, beside the tunnels' west mouth, the race's car is tipped to 64° on a
flat road and thrown 0.4 to 0.7 s. Since braga-map 1.27.0 (task 045, decision 049) the tiles hold
the ground to each street and step at the wall, as it really is there, 0.8 m past the lane's edge.

## What

Today (2026-10-18, party-kart `b38c87e` on braga-map 1.27.0):

- `src/world/ground.ts`'s `normal`: on the ground (no piece), the slope of `land.firm` over
  `SMOOTH` = 1.5 m either side of the car, along x and along z. Its `floor` and `contact` stand the car
  on the street; only the tilt reads past it. `d.roads` (the carriageways in plan) can't tell the
  lane from the cutting's street a metre past it and 6 m down: both are road there.
- `src/world/land.ts`'s `openings` dig the land in front of each tunnel's mouth to its road, 12 m out
  and ±5.7 m across for the João XXI's 7.4 m bore, but not on a street "beside" it (within its width
  and 30 cm). braga-map holds the ground at the mouths itself since task 043, which left `openings` to
  party-kart: its Liberdade underpass test then needed them, at the walled mouths at least; task 045
  holds those too.
- The race's drive (`test/drive.test.ts`, "the autopilot laps the race cleanly"), each flight of 0.3 s
  or more: on 1.27.0, 0.43 s at (569, 240) and 0.72 s at (566, 241) on the João XXI, 0.64 s at
  (-140, 695) and the jump's 1.93 s; on 1.26.0 the João XXI's weren't there, but (-275, 1083) 0.46 s and
  (-932, 1267) 0.37 s were. Task 045 traced the car there: `up.y` 0.438 on a floor flat at 24.40 m.
- A car driven along every street in the area, both ways at 90 km/h (task 045's check: spawned at
  each line's end with `spawn`, steered along the line on `worldGround`, 3,420 streets, 166 km): in
  the air 0.3 s or more 144 times on 1.27.0, 139 on 1.26.0, at most 1.77 s and 1.92 s.

Steps:

1. The tilt from the surface the car is on: on a carriageway, the ground at the carriageway's own
   level within it (one-sided where the 1.5 m reaches past its edge), not another street's below or
   above it in plan, nor the land past it. A pavement and a path likewise.
2. Whether `openings` can go, now that braga-map holds the ground at every mouth (tasks 043 and 045):
   the Liberdade underpass test ("through the Avenida da Liberdade's underpass…") without them.
3. Tests: the race's drive with no flight of 0.3 s or more on the João XXI; the drive along every
   street no more often in the air than on 1.27.0 as it is.

## Read first

- `src/world/ground.ts` (`normal`, `floor`, `contact`, `SMOOTH`), `src/world/land.ts` (`openings`,
  `firm`).
- braga-map's docs/tasks/done/045-streets-beside-walls.md (its Notes: the João XXI, the drives) and
  decision 049.

## Done when

- [ ] The race's drive isn't thrown on the Avenida João XXI (no flight of 0.3 s or more there), and
  party-kart's `npm test` and `npm run check` pass. **Left open:** the tests pass, and the race's
  flights there are shorter (0.31–0.40 s, where they were 0.45–0.48 on 1.36.0), but still over 0.3 s:
  what's left is the ground's dip at the lane's edge, not the tilt (Notes), and it moves to task 115.
- [x] A car driven along every street in the area is in the air no more often than on 1.27.0 today:
  on 1.36.0, 172 times where today's party-kart is 187, the longest 1.82 s where it was 2.12 (Notes).

## Out of scope

- The tiles' ground (task 045): it's the street's, and steps at the wall.

## Notes

- Found by task 045 (2026-10-18): the owner chose to land 045 with the ground as it is, the race's
  hop on the João XXI to this task.
- **Done (2026-10-24, worker-1), party-kart:** `normal` (`src/world/ground.ts`) takes the tilt from
  the car's own surface on a street, a pavement or a path: of the ground 1.5 m either side, a side
  further off the ground under the car than a street climbs (`STEEP`, 40%) is read at 0.5 m instead,
  or left out, and the slope taken on the side that's still its own. Elsewhere, and wherever both
  sides are its own, the same central difference as before. On the João XXI's upper lane by the
  tunnels' west mouth, 99 points of the lane were tipped 64–72° today (`up.y` 0.31–0.44 on a road flat
  at 24.4–24.7 m); now none more than 3° (the test "on the Avenida João XXI's upper lane, a car tilts
  by the lane…" in `test/ground.test.ts`, which fails on today's code).
- **Step 2, `openings`: they can't go.** Without the land dug in front of the tunnels' mouths (in
  `firm`), the test "through the Avenida da Liberdade's underpass…" fails: a car driven in at one mouth
  doesn't come out of the other ("came out at (206, 579)"). `land.ts` is left as it was.
- **Measured on braga-map 1.36.0** (party-kart 8bbe292, before and after; scratch scripts):
  - The race's drive, flights of 0.3 s or more: the Volta dos Amigos before (-140, 695) 0.63–0.65 s
    three times, the João XXI's (569, 240) 0.48 and (570, 240) 0.45 s, the jump's 1.95 s twice; after,
    (-140, 695) as before, the João XXI's (577, 236) 0.38 and 0.40 s and (569, 240) 0.31 s, the jump's.
    The Volta de Lamaçães before (878, 1090) 0.32 s three times, the João XXI's (569, 240) 0.48 s twice,
    (875, 1104) 0.86 s; after, (878, 1090) three times, the João XXI's 0.33 s, (607, 220) 0.43 s.
  - A car along every street in the area, both ways at 90 km/h (1,290 streets, 197 km, this task's
    own script: `spawn` at each end, steered along the line on `worldGround`): in the air 0.3 s or
    more 187 times before, 172 after; the longest 2.12 s before, 1.82 after; along the João XXI's 42
    lines 20 times before, 11 after; lost 21 both.
  - `npm test` 151 of 151 and `npm run check`; the autopilot's laps 302.6 and 300.8 s, no respawn
    (303.2 and 300.7 before), the Lamaçães' longest flight 0.43 s (0.86 before); eight cars a step
    52 µs.
- **The premise, partly false:** the tilt was one of two things throwing the race's car on the João
  XXI. The other is the ground itself at the lane's edge: braga-map's `map.height` (party-kart's
  `land.firm` reads it) runs from the lane's 24.30 m down to the cutting's 18.25 m over about 1.5 m,
  so the lane's last metre dips 0.1 to 0.36 m (at (565.5, 241.5) 23.94 m). The car, 0.7–0.8 m left
  of the race's line, leaves the ground on the dip, and on the rise back the slope under it turns
  21 m/s into 3 m/s upwards (`settle` keeps the velocity along the surface): 0.31–0.40 s in the air.
  Holding the car to the lane's level there in party-kart alone would put it 0.36 m over the street
  as drawn, which follows the same ground; the step belongs in the ground (braga-map's sampling of a
  held street's edge), out of this task's scope ("The tiles' ground"). Told to the coordinator.
- **Landed** (2026-10-24, worker-1) as it is, at the coordinator's word, party-kart `84712aa` on
  `6967a66` (109's) with braga-map 1.36.0, `npm test` 153 of 153 and `npm run check`: the tilt, a measured
  improvement; the ground's dip at the lane's edge moves to task 115 (braga-map, the ground steps at a
  held street's edge). Decision 068. No viewpoint shows a car, so no round; no geometry or texture,
  so no budget.
