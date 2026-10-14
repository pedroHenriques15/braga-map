---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [007, 008, 010]
roadmap: Phase 3 · Surfaces and colours
---

# 017 · Facades: Braga's kinds of building, and each one's real colour and face

## Why

After the streets, facades are what a player sees most, and today every building is one of
eight colours picked by a hash of its OSM id, with the same window pattern for its kind. Braga
has a recognisable mix: granite houses with tiled fronts in the old streets, the apartment
blocks of the 1970s to 1990s with their balconies and roller shutters, ground floors of shops
and cafés, and newer glass and render. Getting each building's kind, colour and material right
along the route, and its actual face in the shooter's area, is most of what makes a street
recognisable.

## What

Today (`tools/world.mjs:121-146`, `../party-kart/src/render/textures.ts:420-502`):

- `color` is `hash(id) % 8` over a fixed palette; OSM's `building:colour` (55 buildings) and
  `building:material` (28) are fetched and ignored.
- Kinds are house, flats, shop, church, civic, guessed from the `building` tag and the
  footprint's area.
- The walls are canvas textures: one floor is 3 m, a 6 m tile with two windows for flats, one
  with shutters for houses, a band for shops; a door and a shop window on the ground floor of
  flats over 6 m.

Steps:

1. **Braga's building types,** from the online photos (task 008) along the route: list the
   8–12 kinds that make up most of the route and the shooter's area (the granite house, the
   house with a tiled front, the 1980s block of 6–8 floors with balconies, the corner block
   with shops, the 2000s block, the warehouse, the church...). For each:
   floor height, window size and spacing, balconies, shutters, ground floor, materials and
   their colours. Write them in `docs/BUILDING-TYPES.md`, with a photo reference for each.
2. **Each building's attributes,** stored as overrides the world reads, `refs/buildings.json`:
   `{ osm id → type, colour, material, floors, ground floor (shop, garage, door), notes }`.
   Fill it:
   - along the route (every building in view from it) and in the whole shooter's area, from
     the photos and Mapillary, by a session looking at each one;
   - elsewhere, from OSM's tags, then the type guessed from the footprint and height (task 010).
3. **Draw them** in party-kart, a kit per type in its real proportions, coloured from the
   overrides. A photo texture of the facade itself (the owner's answer) on every building in
   the shooter's area, and on the route on those within 30 m of the road that a local would
   know by sight, where task 008 found a photo good enough (straight on, sharp, even light,
   nothing in front). The rest, and those with no such photo, from the type kit.
4. **Shop signs:** OSM's `shop`/`amenity` names on the ground floor's fascia, as plain text on
   the sign's real colour; no brand logos.

## Questions

- [x] Photo textures on how many facades? Recommendation: every facade in the shooter's area,
  and on the route only the ones within 30 m of the road that a local would know by sight;
  the rest from the type kit, coloured from data.
  > As recommended (2026-10-14): every facade in the shooter's area, and on the route the ones
  > within 30 m of the road that a local would know by sight.

## Read first

- `tools/world.mjs:121-146`: kind, height, roof and colour today.
- `../party-kart/src/render/textures.ts:420-502`, `city.ts` (`buildBuildings`, `FACADES`).
- Tasks 007 (how photo textures are stored and loaded), 008 (the photos), 010 (heights).
- `docs/SHOOTER-AREA.md` (task 015), once it exists.

## Done when

- [ ] `docs/BUILDING-TYPES.md` describes Braga's types, each with a photo.
- [ ] Every building in view of the route's viewpoints and in the shooter's area has an entry in
  `refs/buildings.json`.
- [ ] The route's viewpoints score higher on the scorecard than the round before, and none
  lower.
- [ ] What it adds is measured against the budget (task 004) and recorded in Notes (decision 017).

## Out of scope

- Heights and roofs: task 010. Footprints: task 011. Landmarks: task 021.

## Notes
