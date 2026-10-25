---
status: doing
priority: medium
kind: code
repo: both
created: 2026-10-23
depends-on: [081]
roadmap: Ultra · Braga at its most real
---

# 086 · Each facade's doors and windows where they are, from its photos

## Why

A facade is its kind's bay repeated in a rhythm (decision 036): the right kind, colours and storeys,
but the doors and windows aren't where the building has them. A local sees it at once on a street
they know. The reference photos show where they are for every building a session has seen, and
the rule is only that no photo is drawn (082), not that none is read.

## What

Today `refs/buildings.json` has 717 entries, 383 seen in a photo, each with its kind, colours,
material, ground floor, balconies, shutters and storeys; `tools/facades.mjs` guesses the rest;
party-kart's `src/render/facades.ts` lays each kind's bay along a wall (`facades.ts:82-103`) with
balconies as geometry. No entry says where a door or a window is.

1. **A facade's layout,** in `refs/buildings.json`, for each seen building's walls on a street:
   per storey, its openings from left to right along the wall, each a window, a door, a garage
   door, a shop window or a balcony door, with its width and its offset from the wall's corner
   in metres, read from the photo that shows it best (with the wall's length from the map to
   scale it). Sessions do this as task 017's did kinds, the shooter's area first, then the
   buildings the viewpoints see.
2. **`tools/facades.mjs`** carries the layout into the tiles; a building without one keeps the
   rhythm.
3. **party-kart** places each opening where the layout says, the kit's piece for it at its
   width; on Ultra with depth: a window's reveal, its sill and frame, the door's step, the
   shutter box, as geometry, not paint.
4. Task 079's arenas' insides take their doors and windows from the layout where it has one.

## Read first

- `docs/DECISIONS.md` 036, 057; `docs/BUILDING-TYPES.md`; `docs/SHOOTER-AREA.md`.
- `tools/facades.mjs`, `refs/buildings.json`, `refs/photos.json`; party-kart's
  `src/render/facades.ts`, `src/render/interiors.ts`.

## Done when

- [ ] Every building in the shooter's area that a photo shows has its street walls' layout
  (`docs/SHOOTER-AREA.md` counts 165 with a photo), checked by a test that it fits its wall.
- [ ] `fujacal-start`, `fujacal-west`, `alameda-fujacal`, `travessa-fujacal`, `conselheiro-lobato`
  and `lobato-east` shot again: the openings where the photos have them, rated no lower.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Using a photo as a texture: never (082).
- The buildings no photo shows: they keep the rhythm (decision 018 stands, no new photos).
