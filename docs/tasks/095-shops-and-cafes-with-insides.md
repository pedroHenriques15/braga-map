---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [086]
roadmap: Ultra · Braga at its most real
---

# 095 · The shops' and cafés' ground floors with insides, marked as made up

## Why

A shop's window shows a dark wall behind the glass; a café is a sign over a closed front. Through
the glass a street's ground floors are what makes it lived in. Nothing says what's inside a real
shop, so it has to be made up, and the owner chose that for the shops and cafés alone (2026-10-23),
the rest staying closed.

## What

Today the facades' ground floors are shops, garages, arcades, glazed or housing
(`src/render/facades.ts:186-220`); OSM's named shops and their kinds are in braga-map's tiles
(task 017's signs); task 079 made up plain rooms for the arenas (`src/render/interiors.ts`,
`src/world/interiors.ts`, decision 057).

1. **Which:** every ground floor a shop, café, restaurant, bank or pharmacy, by OSM's `shop=*` and
   `amenity=*` in it, or a ground floor of shops (decision 036) with no named shop (then a closed
   or empty shop, as Braga has many).
2. **What's inside, by kind:** a café's counter, its stools, tables and the espresso machine; a
   pharmacy's shelves and counter; a clothes shop's rails; a bakery's display; a bank's desks;
   made up, plausible, at the room's depth (to the building's back wall or 8 m), lit by day and at
   night (092).
3. **Marked made up:** braga-map keeps no inside in the map (decision 057's rule: made-up data
   stays out of a map of what's real); the insides are party-kart's, generated from the kind and the
   room, the same every time for a building.
4. **Walk-in or seen through:** in the open world on foot, the door of a café opens and the inside
   is walkable; elsewhere it's seen through the glass (an interior-mapping shader on High, geometry
   on Ultra).

## Read first

- braga-map's `docs/DECISIONS.md` 025, 036, 057; tasks 079, 086; party-kart's
  `src/render/facades.ts`, `src/render/interiors.ts`, `src/world/interiors.ts`.

## Done when

- [ ] On foot in Fujacal, every café and shop on the Rua do Fujacal and the Conselheiro Lobato has
  an inside seen through its window, and a café can be walked into.
- [ ] `conselheiro-lobato`, `lobato-east`, `fujacal-start`: the shop fronts no longer black, rated
  no lower.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- The upper floors and the houses: they stay closed (the owner's answer).

## Notes

- The owner's answer (2026-10-23): "Só lojas/cafés do r/c", marked as made up.
