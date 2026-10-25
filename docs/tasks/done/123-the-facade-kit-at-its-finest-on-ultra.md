---
status: done
priority: medium
kind: code
repo: both
created: 2026-10-24
depends-on: [081, 085]
roadmap: Ultra · Braga at its most real
---

# 123 · The facade kit at its finest on Ultra: 80 px a metre, its bays with relief

## Why

A facade is its kind's kit drawn at 40 px a metre on High (decision 036); up close on a PC it
blurs, and its windows, sills and frames are flat paint. Task 085 makes the city's textures fine on
Ultra; the facades are a piece of work of their own, split from it (2026-10-24).

## What

1. The kit drawn at 80 px a metre on Ultra (party-kart's `src/render/facades.ts`), its canvas and
   its memory measured.
2. Its bays with normal maps (a window's reveal, a sill, a stone frame, the shutters' slats), Ultra
   only.
3. Shoot the facades' viewpoints at Ultra.

## Read first

- party-kart's `src/render/facades.ts`; decision 036; task 085's Notes.

## Done when

- [x] Up close on Ultra (`conselheiro-lobato`, `lobato-east`, `fujacal-start`) the facades are sharp
  and their bays have relief, rated no lower (the round `2026-10-25-after123` against `2026-10-25-before123`,
  at Ultra: no mark moved, mean 2.64, the coordinator's marks, `.cache/scorecard/marks/2026-10-25-after123.json`;
  the sills' tops lit, the reveals, the tiles' joints and the frames finer and in relief, subtly).
- [x] The cost in the budget's Ultra column; High and below unchanged; `npm test` and
  `npm run check` pass (party-kart's `docs/architecture.md`, "Ultra's facade kit"; High and Low the same
  to the pixel in the three views; party-kart's tests 169 of 169, four at a time, and `tsc` clean).

## Out of scope

- Each facade's doors and windows where they are: task 086.

## Notes

- Split from task 085 by the coordinator (2026-10-24), at worker-2's suggestion.
- **High's kit isn't 40 px a metre:** each bay is drawn 256 px a side whatever its size, so High's kinds
  run 71 to 91 px a metre (the old house 91 across, the 2000s block 71), a shop's 7.5 m bay 34 and the
  glass office's 1.5 m bay 171; the surfaces 85 (render, concrete, glass) to 320 (mosaic). Ultra draws
  them at twice High's, 512 a side (most kinds 142 to 182 px a metre), the surfaces' pixel-sized marks
  (a speckle, a joint) kept as big in metres. Decided by the session, for the owner to confirm.
- **The relief** (party-kart's `src/render/relief.ts`, `facades.ts`): each part of a bay drawn with how
  far it stands out of its wall or into it: a window's frame 10 cm in its reveal and its glass 14 cm, a
  sill 6 cm out, a stone frame 4 cm, a shutter's slats, a door's recess and its panels, a shop's glass
  10 cm in, an arcade 80 cm. Softened over 3 cm (a reveal's side as it's seen at an angle: over 1.5 cm
  it was a pixel 10 m off), turned into normals, a third texture beside the
  openings and the surfaces, which the walls' shader tilts its light by, as three.js tilts a normal
  map's, in the wall's frame. On Ultra only.
- **Its panes marked** (the coordinator, for task 117's reflections): the relief texture's alpha is 1
  where a bay's drawing is a pane, 0 elsewhere.
- **Shots** (Ultra, High and Low): before on main's party-kart (3ef281e, braga-map 1.44.0 by `npm ci`, in a
  worktree of its own), after on 123's; `party-kart\shots\` 2026-10-25-before123 and 2026-10-25-after123
  (2026-10-25-after123a: the relief softened over 1.5 cm). High and Low are the same to the pixel in the
  three. On Ultra 17% to 23% of the pixels differ, nearly all by a few levels (the kit drawn finer);
  2% to 4% by more than 8, on the facades, none on the streets. The tiles' joints and the granite's
  courses are sharper. The sills' tops catch the light and their undersides are dark. The windows'
  reveals show along their edges, a shutter box's lip, a garage door's mullions and a glazed ground
  floor's frames.
- **Budget** (Ultra; High and Low unchanged): the same draw calls and triangles; textures 511 MB against
  462 (the kit's three textures 59 MB with their mipmaps, 49 more than High's two). Nothing more to
  download. A frame at 1920 by 1440, back to back with main after the owner's game had closed: 6.2 to
  6.7 ms against 6.2 to 7.1, the same within the runs' spread. In a first run `conselheiro-lobato` took
  160 ms on 123, while a Java process of the owner's came and went; in two more, 7.7 and 6.3 ms.
  (The rounds' own times were taken beside the game and don't count.)
- **Decided by the session, for the owner to confirm:** Ultra's kit at 512 a side; the depths above; the
  relief's 3 cm edges.
