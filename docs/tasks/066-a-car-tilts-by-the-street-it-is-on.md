---
status: todo
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
  party-kart's `npm test` and `npm run check` pass.
- [ ] A car driven along every street in the area is in the air no more often than on 1.27.0 today.

## Out of scope

- The tiles' ground (task 045): it's the street's, and steps at the wall.

## Notes

- Found by task 045 (2026-10-18): the owner chose to land 045 with the ground as it is, the race's
  hop on the João XXI to this task.
