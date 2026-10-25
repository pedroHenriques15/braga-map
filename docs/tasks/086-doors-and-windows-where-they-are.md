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
   width.

Split (the coordinator's, 2026-10-24, on the session's proposal): on Ultra, the openings with depth
(a window's reveal, its sill and frame, the door's step, the shutter box, as geometry) are task 125,
and task 079's arenas' insides taking their doors and windows from the layouts task 126.

## Read first

- `docs/DECISIONS.md` 036, 057; `docs/BUILDING-TYPES.md`; `docs/SHOOTER-AREA.md`.
- `tools/facades.mjs`, `refs/buildings.json`, `refs/photos.json`; party-kart's
  `src/render/facades.ts`, `src/render/interiors.ts`.

## Done when

- [ ] Every building in the shooter's area that a photo shows clearly enough to read has its street
  walls' layout (`docs/SHOOTER-AREA.md` counts 165 with a photo), checked by a test that it fits its
  wall; the rest counted as left, each with why (the coordinator's, 2026-10-24).
- [ ] `fujacal-start`, `fujacal-west`, `alameda-fujacal`, `travessa-fujacal`, `conselheiro-lobato`
  and `lobato-east` shot again: the openings where the photos have them, rated no lower.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Using a photo as a texture: never (082).
- The buildings no photo shows: they keep the rhythm (decision 018 stands, no new photos).

## Notes

- **How the walls are read** (`tools/layouts.mjs`): every street wall of the shooter's area's buildings
  seen in a photo (a run of a footprint's sides within 12°, 3 m or more, a carriageway within 25 m in
  front with no building between: 408 walls of 228 buildings), with the photos that show it and how well.
  Mapillary's cameras are out by metres and degrees, too far to warp a wall straight on from them (a
  first try put a block's foot on the road), so each wall's photo is gridded, its four corners read off
  it at the wall's real ends, and the wall warped straight on from those (a homography), its length the
  map's; its openings are read off that in metres, storey by storey. Checked on a block's front: the
  openings fall where the photo has them, to about 0.2 m.
- **Who read them:** subagents of this session, from a guide (only what a photo shows clearly; a storey
  hidden even in part left in the rhythm; a wall left says why; no house numbers or names written),
  five in a first pass over the 135 walls a photo shows within 60° of straight on, mostly in view, at 25
  px a metre or more; three in a second pass over the 78 the first left only for their top out of the
  photo (the first rule wanted the corners at the eaves; the second takes any horizontal line seen at
  both ends, the storeys above it left in the rhythm) or for their photos (a frame named twice, a photo
  never gridded).
- **The first pass: 11 walls read, 124 left.** Most were left for a top or an end out of every photo,
  trees, cars or a gate in front, a photo too far or at too steep an angle, or which stretch of a long
  front is the map's wall not being clear: the photos are drive-by ones, taken along the streets.
- **The readings checked** (the coordinator's, 2026-10-25: every one of a subagent that wrote readings
  off images it hadn't seen, a sample of the others'): one first-pass subagent wrote readings while its
  images came back removed, then deleted them and read them again once they loaded; its one reading
  kept, and every other first-pass reading too, all 11, checked against their straight-on images by
  this session: all 11 right to about 0.2 m, each opening's kind as the photo shows it. No reading
  rests on an image that didn't load.
- **The second pass: 5 walls read, 73 left.** Re-read with any line seen at both ends as the top, the
  top out of the photo was no longer a reason on its own; the walls left again were left for which
  stretch of a continuous front the map's wall is (no joint between a row's buildings shows, and the
  cameras disagree by a bay or a house), an end in no photo, or the wall hidden (behind a nearer one, a
  high boundary wall, seen edge-on). Its readings checked by this session against their straight-on
  images and their photos, every one, not a sample: all 5 right to about 0.2 m. So **16 readings
  checked of 16, 16 right**.
- **In all: 16 walls of 15 buildings read, into refs/buildings.json's `layout`; 120 left, each with
  why, in its `unread`** (136 walls looked at: the 135 given and one more a reader took up beside its
  building's). The other 272 of the 408 street walls were given to no reader, counted as left here: 139
  in no photo, 133 only in photos too steep (over 60° off straight on), too far (under 25 px a metre)
  or with less than 0.6 of the wall in the frame. The readings' photos are Mapillary's drive-by ones
  and the shooter's area's own (`viewpoint:`).
- **A layout on the drawn sides** (`layoutOnRing`): a wall is a run of sides within 12°, so an opening
  can run round a bend in it (the shop window round lidar/x258z798's corner face, 3 m on sides of 2.1
  and 1.2 m): it is cut at the bend, each side drawing its part (0.3 m or more, or the part holding its
  middle). `layouts.mjs read` merges its files by wall, the last file's word on a wall kept, so a second
  pass's readings join a building's first ones.
- **Found on the way** (not changed here): way/383766229's front (the restaurant's bay on the square)
  is about 1.8 times as wide as its ground floor is high in its photo, some 7 m to the map's 4.8 m; its
  openings were read between its real ends and scaled to the map's length. The readers found the
  camera outlines `show` draws out by up to a bay or a storey (some on the road, one not in the frame),
  and `show --photos` gridding a frame named twice in a batch once, both said in their readings.
