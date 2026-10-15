---
status: todo
priority: medium
kind: code
repo: both
created: 2026-10-13
depends-on: [005, 008]
roadmap: Phase 3 · Surfaces and colours
---

# 018 · Road markings and pavements as they are: Portugal's lines, Braga's pavements

## Why

Every street in the game has the same dashed lane lines, and the same pavement, a generic grid
of off-white stones (a session found it's Lisbon's look, not Braga's). Real streets differ:
stop lines, give-way triangles, arrows, BUS lanes, yellow no-parking lines, parking bays, and
pavements of granite slabs, setts or calçada with patterns of their own. Braga's council opened
a procedure in January 2026 to protect the calçada portuguesa in several streets, so it matters
locally.

## What

Today (`../party-kart/src/render/road.ts:112-180`, `textures.ts:26-90`): dashed dividers
3 m on and 4 m off, 0.14 m wide; a solid centre line only on two-way roads of 4+ lanes; lanes
from OSM or 2 for main roads; zebra crossings of 1 m bars where OSM maps a crossing; the
calçada as a 2.5 m tile of rounded rectangles; granite kerbs of 15 cm. A party-kart session
set out to change the pavement to Braga's pattern (2026-10-13) but landed nothing: `calcada` in
`textures.ts` is still that tile (checked 2026-10-15).

What Portugal's rules say (Regulamento de Sinalização do Trânsito, DR 22-A/98 as amended by
DR 6/2019; checked 2026-10-13): markings are white unless stated (art. 59); the zebra (M11) is
bars parallel to the road; M11a, two continuous lines, marks a crossing with lights; yellow is
for no stopping and no parking (M12, M13), zigzags (M14), loading bays (M14a), box junctions
(M17b) and distance chevrons (M21); bus lanes are wide lines with "BUS" on the road. **The
dimensions aren't in the regulation:** measure them on the 25 cm orthophoto (a 0.5 m bar is two
pixels) and on the photos.

Steps:

1. **Markings from the orthophoto** (task 005), along the route and in the shooter's area: find
   the painted lines (bright, thin, on asphalt) and classify them: lane line, centre line, edge
   line, stop line, give-way, zebra, arrows, BUS, yellow, bays. Store them in the tiles as
   polylines with kind and width. Check against OSM's `lanes`, `turn:lanes` and crossings, and
   by eye against the photos.
2. **Measure** the real widths and dash lengths in Braga, and write them in
   `docs/STREET-DETAILS.md`.
3. **Pavements:** for each street on the route and in the shooter's area, its surface from the
   photos (task 008) and the orthophoto: granite slabs, setts, calçada (and its pattern), asphalt,
   concrete. Store it per stretch in the tiles. Make a texture for each from the close-up
   photos (task 007): a 1 m × 1 m photo straight from above, made to tile.
4. **Kerbs:** their real height (12–20 cm), material and the dropped kerbs at crossings and
   driveways.
5. **Draw them** in party-kart.

## Read first

- `../party-kart/src/render/road.ts:112-180`, `textures.ts:26-90`.
- `tools/track.mjs` (`lanes`, `kerbs`, `surface`), `tools/osm.mjs` (`lanesOf`).
- Tasks 005, 007 and 008.

## Done when

- [ ] The markings along the route are in the tiles, from the orthophoto, and drawn.
- [ ] Each street on the route and in the shooter's area has its pavement's real surface.
- [ ] `docs/STREET-DETAILS.md` records the measured dimensions.
- [ ] The route's viewpoints score higher than the round before, and none lower.

## Out of scope

- Roundabouts' islands: task 014. Signs and furniture: task 020.

## Notes
