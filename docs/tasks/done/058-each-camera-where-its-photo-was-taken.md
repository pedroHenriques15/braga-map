---
status: done
priority: medium
kind: code
repo: braga-map
created: 2026-10-17
depends-on: [026]
roadmap: Phase 1 · See it
---

# 058 · Each viewpoint's camera on the surface its photo was taken from

## Why

Decision 009 stands each viewpoint's camera exactly where Mapillary's reconstruction puts its
photo. Mapillary's positions are a phone's GPS, a few metres off in places. While the map's streets
were off too, some cameras landed on the carriageway by luck and others didn't. Task 026 put the
streets where the LiDAR measured them (decision 039), and the cameras that are off now show it:

- **`imaculada-conceicao`** (-260.7, 726.4): the photo is from a car in the eastbound carriageway's
  right lane, the median's hedge a lane to its left. The camera stands at that carriageway's left
  edge, on the median's grass against the hedge, which fills half the shot. It fell from 3 to 2 in
  026's round ("As ruas no sítio"), the only viewpoint that fell.
- **`bom-jesus`**: the photo is from a car in the road's right lane; the camera stands on the
  pavement, its edge 0.3 m past the kerb the LiDAR measured.
- **`liberdade`**: the photo is from the wide pavement beside the cycle lane; the camera stands on
  the carriageway, by a junction's corner.
- **`alameda-fujacal`**: the photo is from the road; the camera stands on the verge beside the
  wall, 8.75 m off the Alameda's line.

Task 026's Done when expected these four on the surface their photos were taken from once the
streets moved. They didn't move, because the cameras did not.

## What

Today (2026-10-17):

- `refs/viewpoints.json` holds each viewpoint's camera, `x`, `y`, `z` (y the track's height plus
  1.2 m for a kart, or the ground's plus 1.7 m on foot), the point it looks at, `tx`, `ty`, `tz`, its
  `fov`, the photo's credit, and `notes`. `tools/refs.mjs` cuts each photo from its source as the
  camera sees it; party-kart's `scripts/shots.mjs` shoots the game from the same camera.
- `tools/carriageways.mjs --check x,z[,r]` draws the orthophoto round a point with the map's and
  the moved streets' bands, into `.cache/carriageways/`.
- `test/viewpoints.test.js` keeps the cameras away from the friends' houses (decision 009).

Steps:

1. For each viewpoint, find which surface the photo was taken from (a lane, a pavement, a path), and
   which surface the camera stands on in the tiles (`world.streets`, the paths). List those that
   differ, with how far the camera is from the nearest point of the right surface.
2. Move each of those (Questions), keeping its heading and pitch: the camera
   to the nearest point on the right surface (in a lane, the middle of the lane the photo shows),
   its height from that surface, and its target moved with it. Say so in its `notes`.
3. A test: every viewpoint's camera stands on the surface its photo was taken from (a `surface`
   field per viewpoint, `lane` or `pavement` or `path`).
4. Shoot the moved viewpoints again (party-kart's `scripts/shots.mjs <label> <ids…>`).

## Questions

- [x] Where Mapillary's position puts a camera off the surface its photo was taken from, is the
  camera moved there? Options: yes, the shortest way onto the surface the photo shows, its heading
  and pitch kept (recommended: it is still the photo's place, within the GPS's error, as task 055
  aimed two cameras as their photos look); or no, Mapillary's position stands, and a camera off its
  surface is a fault of the photo, not the game.
  > Yes: the shortest way onto the surface the photo shows, its heading and pitch kept (the owner,
  > 2026-10-17).

## Read first

- Decision 009 (and task 055's pitch), decision 039, `refs/viewpoints.json`, `tools/refs.mjs`,
  `test/viewpoints.test.js`, party-kart's `scripts/shots.mjs`.

## Done when

- [x] Every viewpoint's camera stands on the surface its photo was taken from (the test).
  > `test/viewpoints.test.js`, "each viewpoint's camera stands on the surface its photo was taken
  > from": all 34 on theirs (056's two among them), a car's half a car's width in from the kerb; on
  > the cameras as they were it fails (`fujacal-start` the first, 0.4 m from the kerb). braga-map's
  > `npm test` 111 of 111, after merging main (056's 1.21.1).
- [x] `imaculada-conceicao`, `bom-jesus`, `liberdade` and `alameda-fujacal` shot again, before and
  after: none lower, and `imaculada-conceicao` back to 3 or more.
  > In "Onde a foto foi tirada" (`2026-10-17-after058`), on Claude's marks against "Capelas e
  > nichos": `imaculada-conceicao` 2 → 3 (in the left lane, the median's hedge on its left as in
  > the photo), `bom-jesus` 3 → 3, `liberdade` 3 → 3, `alameda-fujacal` 2 → 3. Of the 15 moved,
  > five up (`conselheiro-lobato` and `lobato-east` 2 → 3, `lobato-pavement` 1 → 2 too), none
  > lower; the other 19 shots the same to the pixel, their marks as they were. 2.65 over the 34,
  > against 2.50.

## Out of scope

- The viewpoints' headings and pitches: task 055's.
- New viewpoints, or new photos for them.

## Notes

- Found by task 026 (2026-10-17), in its round: the streets moved, these four cameras did not.
  Blocked on the question.
- Unblocked 2026-10-17: the owner chose the recommendation. It changes decision 009's "exactly
  where Mapillary's reconstruction puts its photo", so its finish writes that down as a decision.
- **Step 1, the surfaces** (`refs/viewpoints.json`'s `surface`, each photo looked at beside the
  orthophoto with the tiles' carriageways, pavements and paths drawn over it): 28 a lane (the six
  on foot whose photos are from a car, and `devesa`, a panorama taken in the road at the crossing,
  whose note said "from the pavement", among them), four a pavement (`liberdade`,
  `lobato-crossing`, `sao-joao-da-ponte`, `lobato-pavement`), one a path (`altice-forum`) and
  one the ground: `capela-sao-joao`'s photo is from the chapel's paved square, which the map has as
  the park, so the task's three surfaces became four.
- **Step 2, the moves** (15 cameras, 1.7 to 11.3 m, each note saying how far): eleven stood off
  their photo's surface, and `lobato-east` on the side street at a junction 11 m from its own; on
  the merge, `capela-santa-justa` (056's) over its centre line, in the oncoming lane, where its
  photo is from the right lane; and `fujacal-start` and `falperra` in their lane but 0.4 and 0.15
  m from the kerb, which the test's half a car's width now forbids. Decision 041 says how a camera
  moves. Two not quite as the task said: `imaculada-conceicao`'s photo is from the eastbound
  carriageway's left lane, the hedge's edge line just left of the car, not its right lane;
  `sao-joao-da-ponte`, square to its heading, stayed on the edge of the cycleway's spur, the tiles'
  pavement there a narrow piece between it and the road, so it went to the pavement's nearest point
  half a metre in (1.8 m). `liberdade` went 4.2 m, not the 3 first tried, so the tiles' cycleway is
  on its left as in the photo.
- **The moves keep the test's other rules:** a moved camera is up to 15 m from where Mapillary puts
  its photo (11.3 m the most, `lobato-east`), where any other is 5 m; the nearest waypoint or egg
  is 194 m from a viewpoint (`lobato-pavement`), past the 150 m.
- **Shot:** each move before and after on its own first (`before058`, `after058-partial` and
  `after058b` in `../party-kart-058/shots/`, party-kart `a0a9472` on 1.20.1), then the round, all
  34 at High, Medium and Low on party-kart `d020388` and braga-map 1.21.1, after merging main.
- **The round on the scorecard:** `2026-10-17-after058` ("Onde a foto foi tirada"), published on
  "Braga real" (its version 15), open for marks, closing "Capelas e nichos". Claude's marks
  (`scores/claude`, each comment starting "(Claude)"): 2.65 over the 34, 2.50 before. The page now
  holds 488 files of the 511 a version can: the next round needs older rounds' shots thinned first.
- **No tag:** `refs/` isn't in what braga-map's package ships, and party-kart's `scripts/shots.mjs`
  reads the viewpoints from a braga-map checkout.
- **Found:** the Avenida da Liberdade's wide pavement, where `liberdade` and `lobato-crossing` now
  stand, is an island in the tiles and grass in party-kart, the map's sidewalk there dropped as the
  street's own: task 059.
- **Not checked:** the owner's marks for the round.
- **Done** 2026-10-17 (decision 041).
