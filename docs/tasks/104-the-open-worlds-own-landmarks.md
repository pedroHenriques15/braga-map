---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-24
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 104 · The open world's own landmarks that aren't models yet

## Why

Task 098's landmarks, the old town's, are all outside the playable area (checked 2026-10-24), so
they wait with 099. Inside it, a few landmarks a local knows are still a kit's building or nothing:
a parish church, a chapel, two wayside shrines, a bust in Fujacal, the Picoto park's swing, a statue
and an installation at São João da Ponte, the fountains. The owner split 098 so that what's inside
the playable area is done now (2026-10-24).

## What

Today (2026-10-24, braga-map 1.34.0): the landmarks inside the open world's edge (`tools/open.json`)
that are models of their own are São João da Ponte's chapel (`saojoao`), the chapels of Santa Justa,
Santo Adrião and Santa Tecla (`chapel`), São Lázaro's bell tower (`saolazaro`), the Senhor do Bonfim
and the Senhor da Boa Morte (`shrine`), the Avenida da Liberdade's arch (`arch`), the Picoto's cross
(`cruzeiro`), the Tourigalo, Makro's sign, the Altice Forum, the stadium, and the roundabouts'
statues (`statue`, task 014): `tools/world.mjs`'s sights, drawn by party-kart's
`src/render/sights.ts` and `chapels.ts` (decisions 038 and 040).

Inside the edge and not yet a model, from OpenStreetMap (`.cache/osm/buildings.json`, `pois.json`,
`art.json`, `base.json`), with their places on the map:

| What | OSM | Where |
|---|---|---|
| Igreja Paroquial de Santo Adrião, a parish church | way 914802540 | (878, 1307) |
| Senhor do Bom Princípio, a chapel | way 1172606536 | (555, 723) |
| Nossa Senhora de Braga, a wayside shrine | way 823906102 | (925, 947) |
| A wayside shrine with no name | way 588800451 | (-984, 1243) |
| The bust of Monsenhor Airosa, in the shooter's area | node 7274749712 | (-309, 647) |
| The Picoto park's swing (Baloiço do Picoto Park) | node 9106279398 | (595, 1161) |
| A statue at São João da Ponte | node 13347548091 | (362, 1016) |
| An installation at São João da Ponte | node 1888046011 | (317, 937) |
| Fountains | nodes 1988569934, 11049668741, 11049668742, 11148112105, 12065053312, 14288080230; way 1292947069 | round the parks |

Also check whether São Lázaro's church itself (way 108323630, (21, 550)) is drawn by `saolazaro` or
left to the kit; if the kit, it's one of these.

1. **Each one:** look at it in its reference photos (`refs/photos.json`, `node tools/refs.mjs`; add
   photos found online, Mapillary and Commons, as decision 018 allows, where it has none), measure it
   in the point cloud (`tools/sights.mjs`: its heights, towers, roof), and add it to the sights in
   `tools/world.mjs` with what its builder needs, as task 056 did for the chapels. A building of the
   tiles it stands for carries its outline as `covers`.
2. **party-kart** builds each one (`src/render/sights.ts`, or `chapels.ts`'s way for the small
   ones: built apart, baked together), in made textures and colours from its photos (decision 061:
   no photograph drawn).
3. A fountain or a statue with no photo stays out, listed in Notes with why.
4. The budget measured (task 004); the viewpoints near them shot again (`capela-sao-joao`,
   `sao-joao-da-ponte`, `picoto-top`, `fujacal-west` among them).

## Read first

- `docs/DECISIONS.md` 038, 040, 061; `docs/tasks/done/056-chapels-and-shrines-on-the-route.md`.
- `tools/sights.mjs`, `tools/world.mjs` (the sights); party-kart's `src/render/sights.ts`,
  `chapels.ts`, `kit.ts`; `docs/making-changes.md` ("A new landmark or scenery").

## Done when

- [ ] Each landmark in the table stands at its measured size, from its photos, or is listed in Notes
  with why it's left out.
- [ ] The viewpoints that see them shot again, no worse; the budget measured.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- The old town's landmarks, outside the playable area: task 098, after 099.

## Notes

- Split from task 098 on 2026-10-24, at the owner's word: inside the playable area done, outside
  it waiting with 099. The list is from OSM's tags (`place_of_worship`, `historic`, `tourism`,
  `amenity=fountain`) inside `tools/open.json`'s edge; not checked against the photos yet.
