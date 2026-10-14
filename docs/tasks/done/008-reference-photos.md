---
status: done
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

- [x] Every item in step 1 has a photo in `refs/photos.json`, or is listed as a gap in Notes.
  > 424 photos; each of step 1's kinds has at least one (`test/photos.test.js`, "step 1's kinds
  > each have a photo"), and what has none is under "The gaps" below.
- [x] Each photo has its source, author, licence and link, and `tools/refs.mjs` fetches it.
  > The test checks the four, and that each licence is CC BY, CC BY-SA, CC0 or public domain.
  > `node tools/refs.mjs` fetched all 424 into `.cache/refs/photos/` on 2026-10-14.
- [x] A test checks that no photo in `refs/photos.json` shows a friend's house, the way
  `test/viewpoints.test.js` does; `npm test` passes.
  > "no photo is near a friend's house, or looks at one": the nearest is 150 m. `npm test`: 37
  > of 37 pass.

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

### The work, 2026-10-14

- **`refs/photos.json`: 424 photos,** 307 of them facades, 35 of landmarks, 14 of the route's 8
  bridges, 9 of 5 of its 7 roundabouts, 22 of the kinds of building, 12 of walls, gates and front
  gardens, and 25 close-ups; 399 from Mapillary and 25 from Wikimedia Commons. 26 are marked
  `texture`, the rest `reference`. `test/photos.test.js` checks each one's credit and licence,
  that step 1's kinds each have a photo, and that none was taken within 150 m of a waypoint or an
  egg or looks towards one within 300 m (the part of it used: its heading, ± half its field of
  view and 5°). `tools/refs.mjs` fetches them into `.cache/refs/photos/`.
- **The fields:** the task's `{ id, what, source, id?, … }` has two ids, so the photo's own fields
  are under `photo`, as in `refs/viewpoints.json`, which `refs.mjs` already reads. `heading`,
  `pitch` and `fov` (across, in degrees) are the part of the photo that shows the thing: what's
  cut from a panorama, a flat photo's own view. `name` says what it is in words, `generic` marks a
  stand-in that isn't Braga's own.
- **How the facades were found:** Mapillary's metadata for the 41,885 photos round the route and
  the shooter's area, fetched into `.cache/mapillary/images.json`. For each building, each of its
  walls not against another building's, and each photo within 70 m in front of it: how straight on
  (the angle to the wall's normal), how much of the wall is in the frame and at how many pixels,
  how far, how recent, Mapillary's quality score, the bicycle's panoramas of March 2026 left out;
  then the best eight, one a sequence, none behind another building (the footprints), those behind
  an OSM tree ranked lower.
  Each pick was then looked at, the wall's ends marked on it, and kept only where it shows the
  building; where it didn't, the next one, three rounds in all. The scripts were the session's,
  not committed.
- **Which buildings:** the shooter's area is still task 015's box (x −350…350, z 600…1050): 422
  buildings, 349 of them OpenStreetMap's and 73 the LiDAR's that the map lacks (named by where
  their middle is, `lidar/x…z…`). On the route, "a building a local would know by sight", within
  30 m of the route's centre line, was taken as one with a name, a shop, café, bank or office in
  OpenStreetMap, a church, school or other public kind, or one that stands out: 15 m or taller,
  or 800 m² or more. 175 buildings.
- **Textures:** only a photo looked at and found straight on, sharp, evenly lit and clear. 11
  facades (3 from the July 2024 panoramas, 8 from the 2018–2019 phones), the chapel of São João
  da Ponte's side wall, two granite walls, four pavements, a kerb, four azulejos and two manhole
  covers (Commons), and the give-way sign's drawing (generic). The pavements are cut from the panoramas looking 40° down: they need
  squaring to a plan view before they tile (task 007).
- **What the photos show** (for tasks 013, 017 and 020): the July 2024 panoramas were taken by a
  group walking, the camera on a helmet, with people in many of them; most facades are seen at
  20–40° from a car's dashboard on the street, so they're references more than textures. 290 of the
  307 facade photos are 2018–2024.

### The gaps

What has no usable online photo, to be drawn from its type's kit or a procedural texture until a
photo turns up:

- **Facades:** 212 of the 422 buildings in the shooter's area (49 of them the LiDAR's) and 78 of
  the 175 on the route (19 the LiDAR's): no photo found shows them, whether they stand behind
  others, in back yards, behind trees or where no camera passed close enough. 12 have no wall
  that isn't against another building.
- **Roundabouts:** the one on the Rua Álvaro Carneiro and the Rotunda Associação Jurídica de
  Braga.
- **Landmarks:** the Altice Forum from the east and south; the Estádio 1.º de Maio from the south;
  the Igreja de Lamaçães close up and from its sides (one photo of its front on Commons, from
  2008, and one from far up the street); the Picoto's miradouro itself (its cross and the view
  from it are there).
- **Close-ups:** a pavement straight from above (only cuts looking 40° down); asphalt; a bench on
  the route (the one photo is a granite bench at Bom Jesus); a bin close (one, a few metres off,
  at the edge of a photo); the road signs beyond stop and keep right (one photo of those two, and
  Portugal's drawing of the give-way sign from Commons, marked generic); the traffic lights' heads.
- **Kinds of building:** one example each of the glass office block and, from Mapillary, of a
  church and a public building (a second of each from Commons and the Altice Forum).

### Finished

- **On 2026-10-14.** No viewpoints to shoot again, and no budget to check: the task adds
  photos to work from, and nothing a game draws. Decision 018 records that the photos are found
  online; `docs/SOURCES.md` has Commons as a source in use, and the README its credit.
