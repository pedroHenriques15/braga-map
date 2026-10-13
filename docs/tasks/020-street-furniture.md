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

## Read first

- `../party-kart/src/render/road.ts:241-331`, `city.ts` (`streetFurniture`), `kit.ts`.
- `tools/track.mjs:601-618`: crossings, signals and stops in the track's data today.
- `docs/DECISIONS.md` 006: what Mapillary's data may be used for.

## Done when

- [ ] The world tiles carry furniture for the track's box and the shooter's area, with sources.
- [ ] Lamps, signs and shelters on the route stand where their photos show them, checked at
  the viewpoints.
- [ ] The budget (task 004) holds: furniture is instanced.

## Out of scope

- Pedestrians and moving traffic: "Later" in the roadmap.
- Road markings: task 018.

## Notes

- From the scorecard's baseline (task 003, 2026-10-13): the owner's comment at `lobato-east`,
  rated 3, is "Edifícios e lugares de estacionamento": the parking along the street, its parked
  cars here and its bays in task 018 (the buildings are task 011's).
