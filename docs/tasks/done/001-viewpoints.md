---
status: done
priority: high
kind: research
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 001 · Viewpoints: the places where the game is set against the real Braga

## Why

"Looks like Braga" needs places to look from. Without fixed viewpoints, every change is judged
from a different spot, and nobody can say whether the city got closer to the real one. Each
viewpoint pairs a real photo with the game's camera at the same position, height and heading,
so the scorecard (task 003) and every later task can compare them (decision 005).

## What

Today the game can hold its camera anywhere with `?view=x,y,z,tx,ty,tz`
(`../party-kart/src/main.ts:30`, applied at `:1071`), in the map's metres (x east, z south, y
above `ELEV0` = 154 m). Nothing lists the places to look from.

The viewpoints are chosen where good open photos already exist online: find the photos first,
then place each viewpoint where one was taken (the owner's answer, below).

1. **Pick 20–30 viewpoints** where an open photo was taken, each at eye level from a car or from
   the pavement (y = ground + 1.2 m for a kart, + 1.7 m on foot):
   - **Along the Volta dos Amigos** (`tracks/amigos.js`, its `streets` and `points`): the
     start on the Rua do Fujacal, the Rua Conselheiro Lobato, the Avenida da Liberdade, the
     Largo São João da Ponte, the Largo da Devesa, the Avenida 31 de Janeiro, the Avenida João
     XXI, the Rua Bernardo Sequeira, the Avenida Doutor António Alves Palha, the Rotunda
     Associação Jurídica de Braga, the Avenida Robert Smith and the Via da Falperra. Add the
     stretches where the Estádio 1.º de Maio (114, 1375), the Altice Forum (−109, 1180) and
     the Picoto come into view.
   - **In the shooter's area** (decision 003): 6–8 on foot in the Rua and Travessa do
     Fujacal, the Alameda do Fujacal, and the Rua and Travessa Conselheiro Lobato.
   - **Two or three of the skyline:** Bom Jesus and the Sameiro seen from the route.
   - None within 150 m of a waypoint in `.cache/places.json` or an easter egg in
     `tracks/amigos.js`. Never name or point at a friend's house.
2. **The photos come from what's online,** with an open licence (decision 006):
   - Mapillary's street-level images, for the streets: its API needs a free client token, which
     the owner adds to `.cache/credentials.json` as `{ "mapillary": { "token": "MLY|…" } }`
     (or `MAPILLARY_TOKEN`), out of git. Record the image's id, author, date, and the camera's
     position and heading, and show its credit and link wherever it's shown.
   - Wikimedia Commons photos with an open licence, for the landmarks and the skyline.
   - Later, a photo the owner or a friend takes from the same position and heading (task 008)
     may replace one.

   Google Street View isn't used, not even to note something by hand (decision 006).
3. **Write `refs/viewpoints.json`:** `{ about, credit, viewpoints }`, the viewpoints a list of
   `{ id, name, kind: "kart" | "foot" | "skyline", x, y, z, tx, ty, tz, fov, photo: { source,
   id?, url?, author, licence, date, lat, lon, heading, pitch, roll, pano? }, notes }`. `fov` is
   the vertical field of view, the photo's (Mapillary gives the camera's). Keep the photos
   themselves out of git until task 007 decides where images live: `refs/` holds the list, and
   `.cache/refs/` the files, which `tools/refs.mjs` fetches.
4. **Check each one by eye:** open the game at its `?view=` and look at its photo side by side.
   Fix the position and heading until the same corner, the same building and the same horizon
   are in both.

## Questions

- [x] Should the owner and the friends add favourite spots of their own, places they'd
  recognise anywhere?
  Recommendation: yes, up to five each, as long as they're on the route or in the shooter's
  area and not at anyone's house.
  > No, not here (2026-10-13): choose the viewpoints where good images are available online.
  > Mapillary too: the owner adds its token to `.cache/credentials.json`.

## Read first

- `tracks/amigos.js`: the route's streets, points and landmarks.
- `map/braga.json`: the landmarks and their positions (`landmarks`).
- `../party-kart/CLAUDE.md`, "Trying it in a browser": `?view=`, `?autodrive&at=`.
- `docs/DECISIONS.md` 003 and 005.

## Done when

- [x] `refs/viewpoints.json` lists at least 20 viewpoints along the route, 6 in the shooter's
  area and 2 of the skyline, each with a photo whose licence is recorded.
  27 within 30 m of the route, 7 on foot in the shooter's streets (9 in its box), 2 of the
  skyline, each photo with its author, CC BY-SA 4.0 and link: `test/viewpoints.test.js`, "there
  are 20 along the route…" and "each viewpoint says…", pass.
- [x] Each one's `?view=` opens the game on the same scene as its photo, checked by eye.
  All 29 shot in party-kart with task 027's route installed, cropped to the photo's field of
  view and set beside it: the same street, direction, sides and horizon (Notes). Checked by
  Claude, not yet by the owner.
- [x] None is within 150 m of a waypoint or an egg (a check script prints the nearest distance).
  `npm test` prints "the nearest waypoint or egg is 178 m from a viewpoint", and none looks
  towards one within 300 m.

## Out of scope

- Shooting the game's side automatically: task 002.
- The shared page: task 003.

## Notes

- **Done on 2026-10-13, on task 027's route** (9.27 km, the way the traffic goes, written while
  this ran in another session): 29 viewpoints in `refs/viewpoints.json`, 17 from a kart, 10 on
  foot and 2 of the skyline; 27 within 30 m of the route, and 9 on foot in the shooter's area,
  7 of them in the Rua, Travessa and Alameda do Fujacal and the Rua and Travessa Conselheiro
  Lobato.
  `test/viewpoints.test.js` checks the counts, that each stands within 5 m of where its photo
  was taken and at eye level, that a kart's is on the route looking the way the race goes, and
  that none is within 150 m of a waypoint or an egg or turned towards one within 300 m. It
  printed 178 m for the nearest.
- **The photos:** all from Mapillary (CC BY-SA 4.0), 22 by one contributor's dashboard phone in
  2018–2019 and 4 panoramas taken on foot in July 2024; what Mapillary has near the route, and
  the sources checked and not used (Commons, Panoramax, KartaView), are in `docs/SOURCES.md`.
  Commons had nothing better for these spots.
- **Placed from each photo's own camera:** position, heading, pitch and roll from Mapillary's
  reconstruction (`computed_geometry`, `computed_rotation`, checked against its compass angle
  and its rotation matrix). The dashboard photos look 1–13° up. The panoramas aren't level (up
  to 5.6° pitch and 5.4° roll), so `tools/refs.mjs` undoes their tilt when it cuts the
  viewpoint's view out of them. Heights: the track's surface + 1.2 m for a kart, the ground +
  1.7 m on foot.
- **Checked by eye:** each viewpoint shot in the game (a race started alone in Playwright,
  `?view=`), cropped to the photo's field of view, beside the photo. All 29 show the same
  street, its direction, which side the buildings are on, and the horizon. Two were changed:
  `fujacal-pavement` was 12 m from `lobato-pavement`, on the same street (the sequence showed
  the photographer walking along the Rua Conselheiro Lobato, not the Rua do Fujacal), and gave
  way to `fujacal-west`; `estadio` looked 48° across a junction, and took the photo 20 m before
  it, looking the way the race goes.
- **What the game gets wrong there** (for the scorecard): invented houses stand in the street at
  `sao-joao-da-ponte` and `alameda-fujacal` (the camera is inside one), `lobato-east` (6 m
  ahead), `viriato-amaral-nunes` (where there's a painted wall) and `estadio` (in front of the
  stadium): a note in task 011. The shop at `robert-smith` is missing. The rest is what the
  scorecard is for.
- **Not covered:** a few places the task listed fall inside the 150 m kept clear, and have no
  viewpoint (which ones isn't written down: it would say where a house is). The Avenida Doutor
  António Alves Palha has no usable photo (all of the verge). The Altice Forum is in no photo
  taken outside the 150 m: walls and buildings hide it. The Picoto is in view at
  `robert-smith-picoto`.
- **Panoramas from a bicycle** (March 2026, most of the route's 360° photos) were left out:
  blurred, tilted, and their headings unreliable.
- **Field of view:** `?view=` doesn't set it (the game keeps 68° vertical); a note in task 002.
- **Finished on 2026-10-13.** The viewpoints weren't shot again: party-kart is back on braga-map
  v1.1.0's route until a release carries task 027's, and the first round of shots is task
  002's. The task changes no geometry or texture, so no budget to check. Decision 009 records
  how viewpoints are chosen.
