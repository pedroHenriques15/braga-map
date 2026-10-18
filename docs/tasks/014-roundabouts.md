---
status: doing
priority: medium
kind: code
repo: both
created: 2026-10-13
depends-on: []
roadmap: Phase 2 · The shape
---

# 014 · Roundabouts as they are: their rings, their islands, what stands in them

## Why

Braga is a city of roundabouts, and many have something of their own in the middle: a
sculpture, a fountain, a garden. In the game every roundabout's ring is where OpenStreetMap draws
its line, at the width its kind of street usually is, and its island is the hole the ring leaves,
drawn as the same grass everywhere, with nothing in it. The route goes round eight, the Rotunda
Associação Jurídica de Braga among them.

## What

Today (checked against main on 2026-10-18, braga-map 1.26.0, party-kart `01e7b0d`):

- **The roundabouts:** the map has 246 ways tagged `junction=roundabout`, 63 roundabouts: 27 in the
  track's box (104 ways; the task had 89 on 2026-10-13), 20 in the open world's box (`OPEN_BOX`),
  13 of them in the area. Only the open world's box has its streets as surfaces (task 033, decision
  019): the 7 others in the track's box are drawn as lines on the far ground.
- **The islands** (task 033): 19 of the 20 have one in the tiles, a kerbed `island` the ring goes
  round (`streets.mjs`'s `ISLAND` and `round`). Largo de Maximinos (-941, 745), outside the area,
  has none: its middle is all carriageway.
- **The rings:** at the map's line and a guessed width (`carriageway` in `osm.mjs`, 6.5 to 7.4 m on
  the route's). Task 026 measured almost none (5 of the 246 ways have a station, none of the route's
  8 a width): its stations skip a junction's stretch, and a ring is all junctions. So each island's
  radius is the map's line less half that guess.
- **What's in them:** party-kart draws an island over 20 m² as one grass (`besides` in
  `src/render/streets.ts`, `tex.ground`), a smaller one in calçada; and `cover.mjs` fills every
  pavement, islands too, as paving, so the orthophoto's grass, beds or paving there are lost. The
  trees in them are the LiDAR's (tasks 019, 063). No landmark, sight, chapel or egg stands in one.
  `pois.json` has only named places and those with a wikidata: an unnamed artwork or fountain isn't
  fetched.
- **The route's eight** (`tracks/amigos.js`): the Rotunda Associação Jurídica de Braga (1571, 321),
  the Rua Álvaro Carneiro's (683, 998), the one at (1696, 1041), the Rua Cidade do Porto's (-968,
  1308), the Largo de São João da Ponte (362, 1019), the one at (-108, 1677), the Via da Falperra's
  (845, 1243) and the one at (303, 1396). Photos (task 008) of five: the Associação Jurídica's, the
  Álvaro Carneiro's and the Cidade do Porto's have none. São João da Ponte's has flower beds and a
  statue in the middle; the
  others' photos show grass, a low hedge, the roundabouts' signs (task 020's) and, at the entries,
  the give-way line and triangles.
- **The race** runs on the streets as they're drawn since task 037: its road (`amigos.road`) is the
  route's carriageways, walled at their outline, so it already goes round the real ring as the map
  draws it, and the track's line keeps off every island (nearest at Álvaro Carneiro's and São João da
  Ponte's, a metre from the kerb). A ring measured anew changes the race's road: party-kart's peer
  prefix moves.
- **Markings:** the streets paint lanes, centre lines, zebras and stop lines at traffic lights; no
  give-way. Task 018 says the regulation gives no dimensions: they're measured on the orthophoto.

Steps:

1. **The rings measured:** each of the 20 in the open world's box, across its ring from its middle
   outwards, every 2 m round it, with 026's cross-section (`carriageways.mjs`'s `across`): the
   island's kerb all round, the outer kerb between the entries. Each ring's line moves onto the
   middle of what's measured and takes its width, as 026's moves do, into a file of its own
   (`.cache/roundabouts.json`; `carriageways.json`, `walls.json` and `trees.json` aren't rewritten
   by this task). The apron, where the LiDAR's echo and the orthophoto show one between the ring and
   the island's kerb.
2. **What's in them:** every island's surface from what the ground is there (016's classes, not
   filled as paving): grass, beds, paving. On the route's eight, what stands in each island from its
   photos and the LiDAR's surface model, a simple model of it (São João da Ponte's statue and flower
   beds), with photos found for those that have none. The signs on the islands are task 020's.
3. **Markings** at each entry of the 20: the give-way line and its triangles, their sizes measured
   on the orthophoto at the route's roundabouts, written in `docs/STREET-DETAILS.md`.
4. **party-kart:** each island drawn in its own surface, what stands in it, the give-way markings;
   braga-map's new tag pinned (045, 014 and 061 take turns tagging it), the peer prefix moved, the
   race's tests passing on the measured rings.

## Questions

- [x] The rings: measure them, or keep them as the map draws them?
  > Measure them (the owner, 2026-10-18): every ring in the open world's box, both kerbs, the island's
  > real radius and the ring's width, and the apron where there's one; into a file of the task's own.
  > The race's road changes with them, and party-kart's peer prefix moves.
- [x] What's in the islands: how much?
  > Each island's surface from the cover and the orthophoto; on the route's eight, a simple model of
  > what stands there from the photos (the owner, 2026-10-18). The signs stay task 020's.
- [x] The give-way markings: here or in task 018?
  > Here, at every entry of the 20, measured on the orthophoto (the owner, 2026-10-18).
- [x] The islands' lawns: the orthophoto is a summer's, and some lawns were dry in it (the Via da
  Falperra's beige where its photo is green). Their colour: a lawn's green as in March, the
  orthophoto's, or the old grass texture?
  > A lawn's green as in March (the owner, 2026-10-18): the cover's classes, and an island's grass
  > in the green of the area's watered lawns in the same photo. The city's other lawns: task 068.

## Read first

- `tools/carriageways.mjs` (`across`, `sampler`, `measure`, `movesOf`), `tools/lines.mjs`
  (`onCarriageways`, `carriagewayMoves`), `tools/streets.mjs` (`ISLAND`, the islands, the stop
  lines), `tools/cover.mjs` (the pavements filled as paving), `tools/osm.mjs` (`carriageway`).
- `../party-kart/src/render/streets.ts` (`besides`, the kerbs and markings), `src/world/race.ts`.

## Done when

- [x] Every roundabout in the open world's box has its ring where the LiDAR measured it and an
      island with a kerb, as the world's data (a test).
  > 18 of the 20 rings moved onto what was measured; the Praça Paulo Vidal's and the Rotunda Lions
  > Clube's stay, too little of their islands seen (cars parked along one). 19 islands in the tiles,
  > each round one's kerb within 35 cm of the circle measured (`test/roundabouts.test.js`); Largo de
  > Maximinos has none, a street the map has on the ground running through its middle (Notes).
- [x] Every island is drawn in its own surface, and every roundabout on the route has its
      centrepiece, checked against its photo.
  > Each roundabout's island in what the cover says it is, at the kerb's height (party-kart's
  > `coverMaterial`): the route's eight grass, São João da Ponte's with paving round its plinth. The
  > one centrepiece on the route, São João da Ponte's São João Baptista, white stone on its plinth,
  > 4.3 m, checked against its photos (2024, 2026) from above and from its east entry; the others' are
  > grass, hedges and signs (task 020's). Santos da Cunha's statue (in the area, not on the route)
  > isn't checked against a photo.
- [x] A give-way line and its triangles at every entry of the 20 (a test), their sizes in
      `docs/STREET-DETAILS.md`.
  > 73 give-way lines and 80 triangles in the tiles; every one of the 54 entries the test finds has
  > its line, but where a zebra the map has is at its place (`test/roundabouts.test.js`).
- [x] braga-map's `npm test`, party-kart's `npm test` and `npm run check` pass.
  > braga-map 138 of 138; party-kart 66 of 66 on this map (the autopilot's laps 303.0 and 300.2 s,
  > no respawn; main's 302.4 and 300.3), `npm run check` clean.
- [ ] The viewpoints round the route's roundabouts shot again and no worse: `sao-joao-da-ponte`
      above all, and `devesa`, `falperra`, `estadio` and `robert-smith` (within 50 m of a ring).

## Out of scope

- Line markings elsewhere: task 018.
- The signs on the islands and round the rings: task 020.
- A pavement on an island that isn't a roundabout's (the Avenida da Liberdade's): task 059.

## Notes

- **Decision 019 (2026-10-14):** task 033 makes every roundabout's ring a carriageway with its
  island kerbed on the inside, for every roundabout in the open world's area. Step 1 here becomes
  checking those islands against the photos (the apron, the real radius); what stands in them,
  the markings and the race's corners stay this task's.
- **Started 2026-10-18** in worktrees `../braga-map-014` (its `.cache` a junction to main's) and
  `../party-kart-014`, from origin/main. "What" checked against main and rewritten (it was written
  before the open world); the owner answered the three questions it raised.
- **The rings** (`tools/roundabouts.mjs`, decision 049): of the open world's box's 20, 18 moved, 15
  of them round (one circle fitted to the island's kerb), 3 along their lines (the Alfredo Barros's
  oval, Santos da Cunha's, its kerb half hidden under its viaduct, and the small one at (-922, 1811));
  17 at a width measured, the Álvaro Carneiro's to the map's outer edge (its outer kerb seen at 5
  stations). Two stay: the Praça Paulo Vidal's (cars parked along its island, 25% of the kerb seen)
  and the Rotunda Lions Clube's (57%). The islands moved most: the Avenida Dom João II's at (1953,
  1230), 12.6 m round where the map had 19.4, its ring 11.5 m wide; São João da Ponte's 5.9 for 8.6,
  10.3 m wide for 6.5; the one at (303, 1396) 7.0 for 8.6. Each checked over the orthophoto
  (`--check`, `.cache/roundabouts/`). `carriageways.json`, `walls.json` and `trees.json` aren't
  rewritten: the moves are in `.cache/roundabouts.json`, laid over 026's by `lines.mjs`.
- **A corner filled an island:** the ring at (-109, 1678), on the route, lost its island once its
  ring was measured: an arm's corner 27 m off closed it (its disc reached the island, which wasn't
  then a hole of what it closed). `streets.mjs` now keeps every roundabout's island out of a corner's
  rounding. Largo de Maximinos (-941, 745), outside the area, has none, as before: a street runs under
  it in a cutting, through its middle, and the map has it on the ground.
- **The race's road** is planned again on the rings (`npm run tracks`, then `npm run open` and the
  world again until the edge held): the same streets, the line up to 2.1 m off where it was at the
  roundabouts (0.7 m at most elsewhere), 10,170 m (10,178 before); its road one piece with two holes
  (São João da Ponte's island now inside it). The open edge moved only at the roundabouts on it, by
  up to 5.5 m. party-kart's peer prefix: `pk38`.
- **What stands in them:** OpenStreetMap has two statues in the area's islands (`fetch.mjs art`, a
  new query): São João Baptista in São João da Ponte's (stone, "ECCE AGNUS DEI"), and the Comendador
  Santos da Cunha in his. DGT classed São João's top points as noise: 4.3 m to its top from the point
  cloud with them, 2.4 m without. Santos da Cunha's statue isn't checked against a photo: the
  panoramas near it are in the tunnel under it. The other route islands' photos show grass, a hedge,
  flower beds, a palm, a four-armed lamp and the roundabouts' signs: no centrepiece but São João's.
- **The photos:** three added (`refs/photos.json`): Cidade do Porto's two, and São João da Ponte's
  statue from its north entry (2026). The Associação Jurídica's and the Álvaro Carneiro's photos were
  within 150 m of a waypoint or an egg (the privacy test), and aren't kept.
- **The islands' ground:** the cover classes a roundabout's island from the data (`cover.mjs`), no
  longer as paving; a lawn the summer dried (the Via da Falperra's, the Associação's) read as paving,
  its near-infrared low, so in a roundabout's island what echoes as grass (over 13 thousand; the
  lawns 14 to 26, a pavement 7 to 12) is grass. The cover's other tiles are made again too, on this
  world: they differ a little from main's, last made in task 052's work (the cover comes out the same
  twice on the same world; why it moved since isn't checked). A long `cover.mjs` run twice failed reading a
  boiled-down tile of the point cloud ("incorrect data check") that reads fine on its own: made a few
  tiles a process instead.
