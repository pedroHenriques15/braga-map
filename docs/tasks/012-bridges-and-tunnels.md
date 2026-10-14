---
status: doing
priority: high
kind: code
repo: both
created: 2026-10-13
depends-on: [009]
roadmap: Phase 2 · The shape
---

# 012 · Bridges, flyovers and tunnels at their real levels

## Why

Braga's avenues cross each other on bridges and in tunnels, and the game draws them all flat:
a road that passes under another meets it as a level junction, and a flyover lies on the ground.
A local notices at once. The route itself crosses several, and the shooter's area has a tunnel.

## What

Today `tools/world.mjs` drops tunnels from the lines (`:48`) and ignores `bridge` and `layer`.
`tools/build.mjs:130` keeps `bridge` for the map page only. The track's planner excludes
tunnels from routing (`track.mjs:51`) and takes its heights from the relief, blurred. In
party-kart, the only bridges are over the Rio Este: one granite block with an arch and parapets
(`src/render/road.ts:203-239`).

In the track's box, OSM has 23 street ways tagged `bridge` and 56 tagged `tunnel` (counted
2026-10-13). Among them: bridges on the Avenida da Liberdade, the Avenida 31 de Janeiro, the
Largo da Soutinha, the Rua Bernardo Sequeira, the Avenida Doutor António Alves Palha, the
Avenida Robert Smith and the Largo Santa Justa, all streets on the route; tunnels under the
Avenida Central, the Avenida da Liberdade, the Avenida João XXI and the Travessa Conselheiro
Lobato.

1. **Keep the levels in the world:** `bridge`, `tunnel`, `layer` and `covered` on each line,
   and a deck height for each bridge: the ends' ground heights, joined straight (or the LiDAR
   surface along it, task 009).
2. **Cut the ground for what goes under:** a road in a cutting or an underpass keeps its real
   level, and the ground mesh is cut away where a tunnel's mouth opens.
3. **Draw them** in party-kart: decks with their parapets and pillars, in concrete for the
   modern ones (most of the avenues) and granite for the old ones; tunnel mouths with their
   walls; the street that runs under at its own level. Bridges made from photos (task 008)
   where they're on the route.
4. **The track** follows the real level where it uses a bridge or an underpass. Check the
   route's heights against the real ones there, and keep the lap tests passing.
5. **The shooter's area:** the Travessa Conselheiro Lobato's tunnel, walkable at its real
   width and height.

## Read first

- `tools/world.mjs` (lines, `:48`), `tools/track.mjs` (heights, `:366`), `tools/osm.mjs`.
- `../party-kart/src/render/road.ts:203-239` (the Rio Este's bridges), `city.ts` (the ground).
- `../party-kart/test/drive.test.ts`: the lap tests.

## Done when

- [ ] No street that passes under another is drawn as a level junction in the track's box: a
  check script lists bridge/tunnel pairs and the height between them.
- [ ] The viewpoints at the Avenida da Liberdade and the Avenida João XXI show the levels as in
  their photos.
- [ ] party-kart's `npm test` and `npm run check` pass.

## Out of scope

- The Rio Este's banks and weirs: task 016's ground, and "Later" in the roadmap.

## Notes

- From task 009: the ground is the LiDAR's bare ground, which has what's under a bridge, not its
  deck. `track.mjs` already crosses the route's six bridges (OSM's `bridge` on the loop's ways)
  straight from end to end, within 0.25 m of the deck in the middle, and marks them `bridge` in
  the track's points; party-kart gives those over a road a plain deck 1.3 m deep, and parapets. In
  DGT's point cloud a deck is class 26, not 17 (`CLASS.bridge` in `tools/dgt.mjs`).

### Started 2026-10-14

- **What the map has, in the track's box:** 37 stretches of street on bridges, 23 in tunnels and 91
  under something at the ground's level (a building over them, or a deck), counted in the world's
  tiles. They cross other streets in 60 places (`node tools/levels.mjs`): 47 on two levels, 7
  meeting at grade (a bridge joining a street at its own end), 6 with a deck lower than what passes
  under needs, all 322 m or more from the route, where party-kart draws nothing. Within 300 m of
  the route, 11, all on two levels with room between them: the route's own decks at the Avenida
  Robert Smith and the Avenida Doutor António Alves Palha, 6.7–7.2 m over the Avenida Frei
  Bartolomeu dos Mártires; and two streets that go under the ones beside the route, the Avenida da
  Liberdade's central carriageway (5.5 m under a cross street, at (181, 589)) and the Avenida João
  XXI's (6.2 m under the 31 de Janeiro, at (548, 242)).
- **The LiDAR has two kinds of bridge.** On a viaduct the deck is class 26 and the bare ground is
  what's under it (Alves Palha: the deck's points 27.2 m, the road under it 20.2 m). On a short
  bridge over a cutting the deck is class 2, ground (the 31 de Janeiro over the João XXI: only
  ground, at 24.7 m), and on a bridge level with its ends, the same (the Avenida da Liberdade's at
  São João da Ponte). So the world takes a deck's height straight between the ground where the
  bridge ends (task 009 found the route's own within 0.25 m of their decks; the Alves Palha and
  Robert Smith decks come out at 26.9 and 42.0–42.3 m against the LiDAR's top points at 27.2 and
  42.6), and a tunnel whose ground stays within 2.5 m of its road is open to the sky under a deck:
  36 of the map's tunnels (`under`). Under a deck the LiDAR took for ground, what passes is a
  tunnel, and a game draws its mouths.
- **Done, in braga-map (uncommitted):** `tools/world.mjs` keeps each street's level (`ground`,
  `bridge`, `tunnel`, `under`, from `bridge`, `tunnel`, `covered` and the ground) and a bridge's or
  a tunnel's height at each point: straight between its ends' ground, a bridge or a tunnel the map
  draws as several ways taken whole (each point from its two nearest ends, along the ways), a
  tunnel's end at its mouth (the lower of the ground there and 4 m out). The tiles' lines carry
  them (`what` is the kind plus 16 times the level; the heights after the points); `index.js` gives
  `level` and `heights`; tunnels are in the world now (they weren't), kept from the buildings', the
  trees' and the sights' streets. `tools/levels.mjs`, the check: every crossing on two levels in the
  track's box, the heights of both and the room between them. `test/levels.test.js`. README.
  `npm test`: 34 of 34.
- **Done, in party-kart, in a copy of it** (party-kart `5379a82` and this braga-map, outside its
  checkout, until braga-map is released and party-kart pinned to it): `src/render/levels.ts`. Each
  bridge off the road whose deck stands clear of the land is a deck at its heights, its carriageway
  and a pavement either side, 1.2 m deep, with parapets, on pillars every 24 m that stand where
  there's 3 m under the deck and clear of every street passing under and of the track (moved up to
  8 m along, else none), and abutments where its ends stand over the land; the route's own bridges
  over a street get pillars and abutments too (they floated: a deck with nothing under it). Each
  tunnel's mouth, where its end meets a street that isn't in a tunnel (two carriageways side by side
  share one), is a concrete wall across it from its road to the ground over the tunnel, 4.5 m deep
  round the opening, then dark. `city.ts`: the land's mesh gets its small cells within 25 m of a
  mouth or a deck (a cutting kept its floor only by the road: elsewhere its 10 m cells made it a
  mound and buried the mouths); in front of a mouth and in its throat the land is held down at the
  tunnel's road (the LiDAR's ground slopes up there to whatever is over it); the land isn't painted
  with a deck's street nor a tunnel's. 18 decks and 18 mouths in the track's box, about 1,500
  triangles. `npm test` 24 of 24, the lap unchanged; `npm run check` clean.
- **A gotcha:** files copied into a game's `node_modules/braga-map` aren't seen by Vite's dev
  server while its cache (`node_modules/.vite`) holds the old ones: the lockfile is what tells it
  to rebuild. Delete the cache after copying. Task 011's round in the copy of party-kart ran the old
  `index.js` on the new tiles (it read the source bits as the old flags), so its figures in
  party-kart's `docs/architecture.md` are measured again here.
- **The viewpoints the task names don't frame the crossings** (an assumption that turned out false):
  `liberdade` stands at (278, 833) looking south to São João da Ponte, 250 m from the Liberdade's
  underpass, and `joao-xxi` at (694, 161) looking north-east along the avenue, 150 m past the João
  XXI's. The levels in their photos are a grass bank down to a lower street on the right
  (Liberdade) and a raised central reservation with a hedge (João XXI), which the ground already
  has within a metre or two. The crossings are checked from their own spots instead (shots below).
- **Not done:** bridges made from photos (task 008, not done), and granite for the old ones: every
  deck is concrete. The shooter's area: the Travessa Conselheiro Lobato's "tunnel" is a passage
  under a building (`tunnel=building_passage`, 14 m, 4.2 m wide): in the world it's `under`, at the
  ground's level; walking through it needs a game to open the building's ground floor where an
  `under` street crosses it, which is the shooter's to do.
- **Seen in the game** (the copy, `?scenery&view=`): at the Avenida João XXI and the Avenida da
  Liberdade the cutting goes down to a concrete mouth with the dark opening, under the street that
  crosses it (before: a mound of painted asphalt, the mouth buried, the street over it at grade);
  the route's deck at the Avenida Robert Smith stands on its pillars. `liberdade` and `joao-xxi`
  come out as before.
- **What it costs** (task 004, decision 017: a guide), all 29 viewpoints, round
  `shots/2026-10-14-task012/` in the copy, against party-kart `0c3b077` on braga-map 1.5.0 as
  released (`shots/2026-10-14-v150/` in party-kart, the same figures as task 011's round): triangles
  at most, High 1.117 → 1.136 M, Medium 0.933 → 0.948 M, Low 0.583 → 0.594 M (the decks and mouths
  about 1,500, the rest the land's small cells round them); draw calls 178 → 184 on High and
  Medium, 162 → 165 on Low (three materials, and their shadows); textures unchanged.
- **Left:** braga-map released (1.6.0: the tiles' lines changed), the copy's `src/render/levels.ts`
  and `city.ts` carried into party-kart and pinned to it, its `docs/architecture.md`; then
  `/task finish`, with the round of viewpoints the owner wants once the other tasks are done.
- **Found along the way:** at `liberdade` the camera stands inside a lamp post (as in every round
  since the baseline): the lamps are placed every 34 m whatever stands there.
