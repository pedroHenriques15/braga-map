---
status: done
priority: high
kind: code
repo: both
created: 2026-10-14
depends-on: []
roadmap: Phase 4 · Street furniture, landmarks and light
---

# 029 · The Tourigalo as it is: a black bull with a rooster's head, on its lawn

## Why

The Tourigalo is the landmark everyone in Lamaçães knows, on the Volta dos Amigos, and the game
draws it wrong: a black bull with horns on a granite plinth, turned to face the road. The real
one is the restaurant's mascot, half bull and half rooster (touro + galo), standing on the grass.
The owner asked for it nice and detailed.

## What

Today:

- braga-map `tools/world.mjs` places the sight `tourigalo` at OSM's node 4872503160 ("Estátua do
  Tourigalo", `tourism=artwork`), facing the nearest main road (`face`).
- party-kart `src/render/sights.ts` `tourigalo()` draws a horned bull on a 2.6 × 1.4 × 5.6 m
  granite plinth with a "TOURIGALO" plate; `src/render/city.ts` turns it to face the track
  (`faceRoad`).
- What it really is, from Mapillary's photos round it (apires, 2018–2019, CC BY-SA 4.0; ids
  209787110813004 from the north, 152667463504923 and 2937986123187037 from the south):
  - A **black bull's body** (four thick legs, a deep chest, a short tail at the rump), and from
    its shoulders **a rooster's neck and head**: a big red serrated comb, red wattles, a yellow
    beak, a yellow eye patch. "**Tourigalo**" in white script on each flank. Matte black, about
    5 m long and 5 m to the top of the comb, legs about 1.5 m.
  - It stands **straight on the lawn**, no plinth, a small stone by its front hoof, in the grass
    between the Avenida Doutor António Alves Palha's roundabout and the Rua António de Mariz.
    Its head points **west**, its flank to the avenue.
  - Behind it to the north-east, the restaurant (OSM way 142911732): a low cream building with a
    grey metal fascia, "Restaurante" in green script along it, and a red board.
  - OSM's node agrees with the photos. The owner's pin on the shared map is 31 m south of it, on
    the same lawn.

Steps:

1. **braga-map:** the sight gets its real heading (head to the west, as photographed) instead of
   facing the road, and the restaurant's front for its sign (`front()` of way 142911732), in
   `tools/world.mjs`; `index.d.ts` says so. `npm run world`, `npm test`.
2. **party-kart:** `tourigalo()` builds the statue as it is: the bull's body (barrel, chest,
   haunches, legs with hocks and hooves, the tail), the rooster's neck rising from the shoulders,
   the head with its comb's lobes, beak, wattles and eyes, the white script on both flanks (a
   canvas texture), the stone by its hoof, standing on the ground. `city.ts` stops turning it to
   the road. The restaurant's green "Restaurante" script on a grey band along its front, and the
   red board.
3. Static, so `bake()` merges it into a few draw calls.
4. Look at it from the race (`?view=` from the avenue, from the roundabout) beside the photos.

## Read first

- `tools/world.mjs`, "The sights": `front`, `facing`, the bull.
- `../party-kart/src/render/sights.ts`, `tourigalo()` and `fascia()`; `kit.ts` (`bake`, `mat`).

## Done when

- [x] Seen from the avenue and from the north (`?view=`), the statue reads as the photos: a black
  bull with a rooster's head and red comb, "Tourigalo" on its side, head to the west, on the
  grass.
  > `?view=1588,27.6,233,1591,28.4,265,45` (where photo 209787110813004 was taken) and from the
  > lawn's south side, 2026-10-14. Only after the lawn was cleared of invented flats (Notes).
- [x] The restaurant's green script and red board on its front.
- [x] braga-map's `npm test`, party-kart's `npm test` and `npm run check` pass.
  > 17 of 17; 19 of 19 and `tsc` clean.
- [x] The budget (task 004): the statue adds no more than a few draw calls and under 20,000
  triangles.
  > 6 draw calls and 12,540 triangles, counted in the scene.

## Out of scope

- The restaurant's own walls and roof as they are: task 017 (facades). Its height is fixed here
  (Notes); every other building's is task 010's.
- The other landmarks on the route: task 021.

## Notes

- The owner, 2026-10-14: "It should be a nice and detailed Tourigalo."
- No viewpoint looks at it (the nearest is 349 m off), so it's checked with `?view=` shots.
- Done so far (2026-10-14), not committed or released:
  - braga-map: the sight's `face` is the photos' (west, `Math.PI`), and `sign` is the
    restaurant's front facing the avenue (`front()` takes a point to face where the roads would
    pick the wrong wall). `index.d.ts` types it.
  - **Two corrections the scene needed, in `world.mjs`:** the restaurant was drawn 21.6 m tall
    (OSM has `building=yes` and 1,300 m², so it was guessed flats); `SEEN` makes it one storey,
    5.2 m, flat, as photographed. And four invented blocks of flats stood on the Tourigalo's lawn
    (OSM doesn't tag it as green), one right on the statue; `OPEN` keeps the infill off the lawn
    and the grass north of the restaurant (x 1575–1650, z 200–305), as the 2025 orthophoto shows
    them. The skipped houses keep their turn in the infill's random sequence, so no other
    invented house in the map moved: only tile `x3z0` and `base.js` changed.
  - party-kart: `tourigalo()` and `restaurant()` in `sights.ts`, `tex.script()`; `city.ts`
    no longer turns it to the road.
  - The owner's pin on the shared map is 31 m south of OSM's node; the photos agree with OSM's.
  - The red board's words ("TOURIGALO", "churrasqueira") aren't legible in any photo; it's a
    churrasqueira by the reviews. Worth a look on the photo walk (task 008).
- **Released** on 2026-10-14: braga-map `5d6ca6b`, tagged `v1.3.0`; party-kart `6309e63`, on it,
  deployed to https://pedrohenriques15.github.io/party-kart/. The peer id prefix is `pk31`, so
  players on the old build must reload to race. On v1.3.0: party-kart's `npm test` 19 of 19,
  `tsc` clean.
- **The round** `2026-10-14-friends` ("Os amigos"), shot again on the released build (party-kart
  `6309e63`, braga-map 1.3.0, 29 viewpoints at High and Low), every shot looked at, and posted to
  the scorecard: version 2 of "Braga real", the round open for marks. Its worst viewpoint costs
  174 draw calls, 1.06 M triangles and 94 MB of textures on High, 157, 0.52 M and 45 MB on Low:
  inside the budget, Low's textures now at its limit.
- **Finished** on 2026-10-14. No viewpoint looks at the Tourigalo, so the scorecard doesn't judge
  it; a viewpoint where Mapillary's 209787110813004 was taken would, if the owner wants one (task
  001's kind). The `OPEN` and `SEEN` corrections in `world.mjs` are for task 011 and task 010 to
  replace with what the orthophoto and the LiDAR measure everywhere.
