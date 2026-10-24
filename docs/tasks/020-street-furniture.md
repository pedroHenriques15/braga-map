---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 008]
roadmap: Phase 4 · Street furniture, landmarks and light
---

# 020 · Street furniture where it stands: lamps, signs, bins, benches, shelters, parked cars

## Why

Streets without their clutter look like a model. Today the game has lamps every 34 m on
alternating sides, the traffic lights and bus stops OSM maps, zebra crossings and street-name
plates, and nothing else: no signs, no bins, no benches, no bollards, no parked cars. Braga's
own pieces (the TUB bus shelters, its lamp posts, the ecopontos) are things a local sees every
day.

## What

Today (`../party-kart/src/render/road.ts:304-331`, `city.ts` `streetFurniture`): lamps are a
7 m post with a box head, about 240 on the route, placed by a rule, not where they stand. The
data has 53 zebra crossings, 10 traffic signals and 25 bus stops (10 with shelters) on the
route. Traffic lights cycle 20 s.

1. **Where things stand:**
   - OSM: `highway=street_lamp` (786 in the municipality, sparse), `amenity=bench`,
     `waste_basket`, `recycling` (336 ecopontos), `bicycle_parking`, `bollard`,
     `traffic_sign`, `amenity=parking` and `parking:lane`/`parking:*` tags; bus stops (1,155,
     372 with shelters).
   - The photos (task 008), for the route and the shooter's area.
   - Mapillary's detected signs and lamps are **not** copied here (decision 006). Where OSM
     lacks them, the owner or a friend can map them in OpenStreetMap, using those detections
     in the OSM editor, and the next fetch brings them in.
   - TUB's GTFS feed (`https://www.tub.pt/developer/gtfs/feed/tub.zip`) for the stops and
     which lines serve them; its licence isn't stated, so ask TUB before using it.

   Store them in the world's tiles as `furniture: [{ kind, x, z, angle, sign? }]`.
2. **Braga's models,** from the close-up photos: the TUB shelter, the lamp posts (the
   avenues' and the old streets'), the ecoponto set (yellow, blue and green), the bench, the
   bollard, the traffic light heads as Portugal has them, the most common signs (stop, give
   way, no entry, roundabout, speed limits, parking) at their real sizes.
3. **Parked cars** along the kerbs where there's parking (OSM's tags, the orthophoto's parked
   cars), simple and in the colours cars come in; never in front of a gate (task 013).
4. **Shooter's area:** every piece in its photo, where it is.

## Questions

- [x] Which lines serve a stop: TUB's GTFS feed (its licence asked of TUB first), OpenStreetMap's
  bus routes, or none? Recommendation: OpenStreetMap's route relations (ODbL, like the rest).
  > OpenStreetMap's bus routes, no GTFS (the owner, 2026-10-24). How complete OSM's TUB routes are
  > isn't checked: a line it lacks is left out and listed.
- [x] Braga's models (step 2) and the parked cars (step 3): CC0 3D models, as decision 060 allowed
  for the deathmatch, or built in code? Recommendation: CC0 models, their textures made.
  > CC0 models allowed (the owner, 2026-10-24): CC0 glTF models (Quaternius, Poly Pizza, Kenney
  > and the like), each on record as party-kart's `src/fight/ASSETS.md` keeps them, at their real
  > size; any photo texture they carry replaced by a made or flat one (decision 061). A model of
  > Braga's own (the TUB shelter, the ecoponto) is still drawn from its reference photos where no
  > CC0 model is near enough. A DECISIONS.md entry when this task is finished.

## Read first

- `../party-kart/src/render/road.ts:241-331`, `city.ts` (`streetFurniture`), `kit.ts`.
- `tools/track.mjs:601-618`: crossings, signals and stops in the track's data today.
- `docs/DECISIONS.md` 006: what Mapillary's data may be used for.
- `docs/SHOOTER-AREA.md` (task 015): in the shooter's area, every piece where it stands, and the
  parked cars along the kerbs, which are a player's cover.

## Done when

- [ ] The world tiles carry furniture for the track's box and the shooter's area, with sources.
- [ ] Lamps, signs and shelters on the route stand where their photos show them, checked at
  the viewpoints.
- [ ] Furniture is instanced, and what it adds is measured against the budget (task 004) and
  recorded in Notes (decision 017).

## Out of scope

- Pedestrians and moving traffic: "Later" in the roadmap.
- Road markings: task 018.

## Notes

- From the scorecard's baseline (task 003, 2026-10-13): the owner's comment at `lobato-east`,
  rated 3, is "Edifícios e lugares de estacionamento": the parking along the street, its parked
  cars here and its bays in task 018 (the buildings are task 011's).
- From task 016 (2026-10-16): the cars DGT's LiDAR saw parked (July 2025) are with each tile's
  ground cover under the Volta dos Amigos' box (`world.groundCover`'s `cars`, a JSON file a tile,
  six numbers each: x, z, the angle of its length, its length and width, and 1 along a kerb, 2 in a
  car park, 0 elsewhere): 41,683 over the box, 18,924 along kerbs, 12,199 in car parks and 10,560
  elsewhere. A low wall or a hedge along a building's front can come out as cars in a row (one along
  the Alameda do Fujacal's flats does), and cars under a tree's crown aren't seen. The map's car
  parks and its bays and lanes along the streets are areas of kind `parking`.
- From task 016's round `2026-10-16-after016` (2026-10-16): with the lawns gone, the parked cars
  are what Claude's marks name first at `fujacal-start`, `conselheiro-lobato`, `fujacal-west` and
  `travessa-lobato`, where the ground they stand on is now the grey of the street.
