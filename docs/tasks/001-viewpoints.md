---
status: todo
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

1. **Pick 20–30 viewpoints,** each at eye level from a car or from the pavement (y = ground +
   1.2 m for a kart, + 1.7 m on foot):
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
2. **Find a real photo for each,** in this order of preference (decision 006):
   - a photo the owner or a friend takes there (task 008), from the viewpoint's position and
     heading;
   - a Wikimedia Commons photo with an open licence, for the landmarks;
   - meanwhile, a Mapillary image at that spot: its API needs a free client token, which the
     owner left to this task (task 005), so ask for it first, kept out of git in
     `.cache/credentials.json` or `MAPILLARY_TOKEN`. Record the image's id,
     author, date, and the camera's position and heading, and show its credit and link
     wherever it's shown.

   Google Street View isn't used, not even to note something by hand (decision 006).
3. **Write `refs/viewpoints.json`:** a list of `{ id, name, kind: "kart" | "foot" | "skyline",
   x, y, z, tx, ty, tz, fov, photo: { source, id?, url?, author, licence, date }, notes }`. The
   field of view matches the photo's (Mapillary gives the camera's). Keep the photos themselves
   out of git until task 007 decides where images live: `refs/` holds the list, and
   `.cache/refs/` the files.
4. **Check each one by eye:** open the game at its `?view=` and look at its photo side by side.
   Fix the position and heading until the same corner, the same building and the same horizon
   are in both.

## Questions

- [ ] Should the owner and the friends add favourite spots of their own, places they'd
  recognise anywhere?
  Recommendation: yes, up to five each, as long as they're on the route or in the shooter's
  area and not at anyone's house.

## Read first

- `tracks/amigos.js`: the route's streets, points and landmarks.
- `map/braga.json`: the landmarks and their positions (`landmarks`).
- `../party-kart/CLAUDE.md`, "Trying it in a browser": `?view=`, `?autodrive&at=`.
- `docs/DECISIONS.md` 003 and 005.

## Done when

- [ ] `refs/viewpoints.json` lists at least 20 viewpoints along the route, 6 in the shooter's
  area and 2 of the skyline, each with a photo whose licence is recorded.
- [ ] Each one's `?view=` opens the game on the same scene as its photo, checked by eye.
- [ ] None is within 150 m of a waypoint or an egg (a check script prints the nearest distance).

## Out of scope

- Shooting the game's side automatically: task 002.
- The shared page: task 003.

## Notes
