---
status: todo
priority: high
kind: code
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 008 · The reference photos: every facade, landmark and close-up the city needs, found online

## Why

The facades, pavements, walls, street furniture and landmarks (tasks 016–021) each need a real
photo to be judged by, and the best of them to become textures (decision 002). The scorecard's
29 viewpoints all found theirs online (task 001), and Mapillary alone has about 33,800 photos
near the route and over the shooter's area. Finding the right photo for each thing once, with its
credit, saves every later task the search and shows what no online photo covers.

## What

Today (`docs/SOURCES.md`): `refs/viewpoints.json` lists the 29 viewpoints' Mapillary photos, and
`tools/refs.mjs` fetches their files into `.cache/refs/`. Within about 150 m of the route and over
the shooter's area, Mapillary has 33,764 photos: most from phones on a car's dashboard in
2018–2019, and 360° panoramas taken on foot with a pole in July 2024 (the Avenida da Liberdade,
São João da Ponte, the Devesa and through Fujacal), sharp and level. The panoramas from a bicycle
in March 2026 are blurred and their headings can't be trusted. Wikimedia Commons has the
landmarks by the thousand (Bom Jesus 2,734, the Sameiro 319, the Estádio Municipal 223) but few
photos of the streets. Panoramax has 3 in the route's box; KartaView didn't answer.

No one takes new photos: online sources only (the owner's answers, below).

1. **List what needs a photo,** from the tasks that will use them:
   - facades (task 017): every building in the shooter's area (task 015's edges, or its box
     today, x −350…350, z 600…1050, until they're drawn), and on the
     route each building within 30 m of the road that a local would know by sight;
   - Braga's building types (task 017, step 1): two or three examples of each;
   - the landmarks on or seen from the route, from as many sides as there are photos (task
     021): São João da Ponte, the Altice Forum, the Estádio 1.º de Maio, the Picoto, the Igreja
     de Lamaçães; and the skyline, Bom Jesus and the Sameiro;
   - bridges and roundabouts (tasks 012 and 014), walls, gates and front gardens (task 013);
   - close-ups, as straight on as possible (tasks 016, 018 and 020): a pavement from above, a
     kerb, a wall of each kind of stone, a facade's azulejos, a bus shelter, a street lamp, a
     bench, a bin and an ecoponto, a manhole cover, a road sign.
2. **Find the best photo of each:** Mapillary first, the 2024 panoramas before the dashboard
   photos; Commons for the landmarks, the skyline and the close-ups (Braga's azulejos, its
   granite, its calçada); Panoramax where it has any. For a close-up no photo of Braga shows, an
   open texture library may stand in, once its terms are checked to allow use as a texture and
   publishing the result (decision 006); mark it as generic, not Braga's own.
3. **Record each** in `refs/photos.json`: `{ id, what, source, id?, url, author, licence, date,
   lat, lon, heading, use }`, `what` saying what it shows (an OSM building id, a landmark, a
   close-up's kind), `use` either `reference` or `texture` (straight on, sharp, even light,
   nothing in front). Extend `tools/refs.mjs` to fetch them into `.cache/refs/photos/`.
4. **Privacy (decision 004):** no photo that shows a friend's house is recorded, and none
   becomes a texture. Check each against `.cache/places.json` and the eggs locally, the way
   `test/viewpoints.test.js` checks the viewpoints, and never write down why a photo was left
   out.
5. **List the gaps** in Notes: what has no usable online photo. A gap is drawn from the type's
   kit or a procedural texture, until a photo turns up online.

## Questions

- [x] Mapillary (open and searchable by position) or only the phone's camera (kept private)?
  Recommendation: the camera for the shooter's area, the close-ups and the landmarks, since
  those become textures; Mapillary for the drive round the route, if anyone wants to.
  > Mapillary for everything (2026-10-14). Then, asked why a walk was needed at all when the
  > scorecard's photos came from online: online photos first, and the gaps listed.
- [x] Who joins, and when? The shooter's area first.
  > Nobody (2026-10-14): online alternatives are preferable, the gaps included. The task is a
  > session's, not the owner's.

## Read first

- `docs/SOURCES.md`: Mapillary, Commons, Panoramax, what each may be used for and its credit.
- `refs/viewpoints.json`, `tools/refs.mjs` and `test/viewpoints.test.js`: how task 001 found,
  fetched and checked its photos.
- `docs/DECISIONS.md` 002, 004 and 006.
- Tasks 015 and 017: the shooter's area and the facades the photos are for.

## Done when

- [ ] Every item in step 1 has a photo in `refs/photos.json`, or is listed as a gap in Notes.
- [ ] Each photo has its source, author, licence and link, and `tools/refs.mjs` fetches it.
- [ ] A test checks that no photo in `refs/photos.json` shows a friend's house, the way
  `test/viewpoints.test.js` does; `npm test` passes.

## Out of scope

- Taking photos, on foot or from a car (the owner's answers).
- Turning photos into textures: tasks 007 (the pipeline), 016, 017, 018 and 021.

## Notes

- Until 2026-10-14 this task was the photo walk: the owner and the friends photographing the
  route and Fujacal with their phones. The owner chose online photos instead. When it's finished,
  record that in `docs/DECISIONS.md` (it changes decision 006's "the owner's and the friends'
  photos, the first choice"), and update `docs/SOURCES.md`'s "The owner's and the friends'
  photos".
- Mapillary's photos are CC BY-SA 4.0: a texture made from one is CC BY-SA too.
- Not checked: whether the 2024 panoramas are sharp enough to texture a facade. Task 007 tests ten.
