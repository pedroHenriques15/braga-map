---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-14
depends-on: [035]
roadmap: Now · The open world
---

# 038 · The city streamed tile by tile, when the area grows

## Why

`buildCity` builds the whole city once, before the race: the track's 48 tiles, in 1.1–2.7 s.
That holds for the open world's small area (decision 019: about 30 tiles), but not for the area
grown to more of the map, nor perhaps for a phone once every street is built (task 035). Then the
city has to be built round the player as they drive, and let go behind them.

## What

Today `src/render/city.ts` loads the tiles (`loadWorld`, each tile a chunk the bundle splits off)
and builds everything at once: the land in cells, one painted canvas for the whole box (3330 ×
2600 px on High), the buildings in seven merged meshes, the trees, the streets (after task 035).
`?stats` measures the build, and `watchSpeed` steps the graphics down when a race runs slowly.

Steps, when the owner grows the area or a phone can't hold it:

1. **A tile at a time:** the land, the ground's canvas, the streets, the buildings and the trees
   built per 500 m tile, each its own meshes, and the sights as now.
2. **Round the player:** the tiles within about 750 m built, near ones first, a little each frame
   so it never stutters; those past about 1 km let go (geometry and textures disposed). Further,
   the hills every 50 m and the horizon as now, with the buildings as plain blocks if they're
   cheap enough to keep.
3. **A race** builds every tile its route passes before the countdown.
4. **`?scenery`** builds what's round its `?view=` the same every time, for `scripts/shots.mjs`.

## Read first

- party-kart's `docs/architecture.md` ("Rendering", "The city's budget"), `src/render/city.ts`,
  `src/stats.ts`, `src/main.ts` (`watchSpeed`, `frame`).

## Done when

- [ ] Driving across the whole area, the frame never takes over 50 ms to build a tile, and the
  memory comes back to where it was when you return (`?stats`).
- [ ] The viewpoints shoot as before (no viewpoint changes).
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- Growing the area: a new task, with braga-map's sections.

## Notes

- Decision 019: built whole for the small area; this waits until it's needed.
- From task 007: a tile's photo textures come with it (`world.photos`), and `render/photos.ts`'s
  `Photos.dispose` frees them; nothing calls it yet, as no tile goes.
- From task 016 (2026-10-16): what's downloaded before you can drive went from 2.3 to 7.0 MB
  gzipped on High, and loading only the tiles near the player would take it down. The owner: load
  time doesn't matter, so that isn't a reason to do this sooner. It still waits for the area to
  grow.
- 2026-10-24: the owner set the order for the open tasks (`/task` order, 083 among them), and 083's
  50 cm ground near the player builds on this, so it's done before 083, though the area doesn't
  grow (099 is held).
