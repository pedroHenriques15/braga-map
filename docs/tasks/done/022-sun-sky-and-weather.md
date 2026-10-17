---
status: done
priority: medium
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [002]
roadmap: Phase 4 · Street furniture, landmarks and light
---

# 022 · Braga's light: the real sun, the sky and the haze, and its weather

## Why

The light decides whether a photo and a screenshot feel like the same place. Today the sun is
fixed, the haze is one colour, and there are no clouds. Braga's light has its own look: a low
sun on granite, a green haze on the hills, often a grey sky, and rain. Matching the photos'
light is cheap and helps every viewpoint at once.

## What

Paths in this task are party-kart's (`../party-kart/`), unless they start with `../braga-map/`.

Today (`src/render/look.ts`): `SUN_DIR` is (−0.62, 0.46, 0.74), about 25° up and 40° west of
south (the comment at `:9` says west-south-west, which doesn't match). `Sky` has turbidity 7,
rayleigh 1.9 and mie 0.006. Fog is `FogExp2` #e7d6bf at 0.00022. There are no clouds. The
knobs are `?exp ?sun ?hemi ?env ?fog`; none sets the sun's direction or the time.

1. **The sun's real position:** compute it for Braga (41.55° N, 8.42° W) from a date and time,
   and add `?time=2026-10-13T17:30` to set it, with today's look as the default time. Fix the
   comment.
2. **Match the photos:** for 3–4 viewpoints whose photos were taken on a clear afternoon, set
   the time to the photo's and tune the sky, the haze's colour and density, and the exposure
   until the two read the same. Then check the far viewpoints: Bom Jesus and the Sameiro
   through the haze (decision 004 keeps them at twice their size).
3. **Clouds:** a cloud layer (a scrolling texture on a dome is enough), off by default, with a
   "grey Minho day" preset: an overcast sky, soft shadows, a wet look on the road.
4. **Rain** (later in the task, if the budget allows): falling streaks near the camera, wet
   reflections on the asphalt, the wipers' sound.

## Read first

- `src/render/look.ts`, `src/main.ts` (the frame loop), `docs/architecture.md`.

## Done when

- [x] `?time=` sets the sun, and the default matches the photos' afternoon.
  > `src/sun.ts` puts the sun over Braga at any moment, and `?time=` reads Braga's clock, summer
  > time included: `test/sun.test.ts` (5 tests) has it at noon as high as the latitude and season
  > say, due south, within 0.05° of the Astronomical Almanac's sun at 400 moments from 2018 on, and
  > behind the camera on the Conselheiro Lobato as its photo shows. In the game, one viewpoint at
  > `?time=2026-10-13T10:00`, `T18:15` and `T19:25`: the sun from the east-south-east, a low golden sun
  > from the west with long shadows, and dark past sunset with the lamps lit. The default is 13 March
  > at 15:15, when five of the photos (Rua do Fujacal, Conselheiro Lobato, Couteiro, Travessa do
  > Lobato) were taken on a clear afternoon: the sun 34° up at 228°.
- [ ] The skyline viewpoints and three street viewpoints score higher than at the baseline.
  > Not met on Claude's marks, and the owner's are to come. The round `2026-10-17-after022` ("A
  > luz") is on "Braga real" (its version 11), open for marks. Claude's (`scores/claude`) are 2.48 for
  > the 29 places, as for `after046`, none up or down, each comment saying how the light moved against
  > its photo: in the 11 places whose photo is a clear day the sky, the asphalt and the shadows are now
  > the photo's (`joao-xxi`, `couteiro`, `imaculada-conceicao` most), and the far hills of `sameiro`
  > and `bom-jesus` take the photos' blue haze; but on the scale Claude's marks have kept since task
  > 013 what holds each place down is elsewhere (the trees, the parked cars, the cameras off the
  > road), as for 017. In the 18 whose photo is a grey day the ground comes nearer and the sky goes
  > further (Notes). The baseline's marks are the owner's alone (2.55; `bom-jesus` 3, `sameiro` 4), so
  > the item is theirs to judge.
- [x] `npm test` and `npm run check` pass.
  > 62 tests and `tsc`, on `task-022` and on its merge with `main` (`5abc39b`, braga-map 1.18.1, no
  > change since).

## Out of scope

- Night: "Later" in the roadmap.

## Notes

- **"Today", checked on 2026-10-17 against `look.ts`:** `SUN_DIR`, the sky's turbidity, rayleigh
  and mie, the fog and the knobs were as written; since task 054 the sky (a box 20 km across) goes
  with the camera, which the clouds keep. Two things were not as written:
  - **There were clouds:** three r186's `Sky` draws procedural clouds by default (coverage 0.4,
    density 0.4), a few thin wisps in every shot. So step 3's layer is the sky's own clouds made a
    fair day's cumulus, not a dome; and as the photos of clear days all have cumulus, they're on by
    default (coverage 0.38), not off. `?clouds=0` clears the sky.
  - **The photos' times:** Mapillary's `captured_at` (in `.cache/mapillary/images.json`), checked
    against the shadows in four photos. 11 of the 29 photos are clear days (5 of them the afternoon
    of 2019-03-13, 15:08–15:19 UTC; `imaculada-conceicao` and `joao-xxi` April afternoons; the rest
    mornings), and 18 are grey or heavily clouded (the four of 2024-07-20 by the Liberdade among
    them, and both skyline photos but `sameiro`'s, a clear morning against the sun).
- **What the game looked like against the photos** (the baseline of this task, `after046`, its sky's
  and road's pixels measured beside the photos'): about twice as bright on the whole, a pale cyan sky
  where the photos' clear sky is a deep blue at (52–74, 129–131, 186–200), a pale bluish asphalt
  where theirs is a mid grey, and shadows hardly darker than the sun: the sky's light (the hemisphere
  1.2 and the reflections 0.9) was nearly the sun's (5.2 at 25°). In a photo a shadow is about a
  quarter as bright as the sunlit ground beside it.
- **Matched** at their photos' times on `conselheiro-lobato`, `couteiro`, `imaculada-conceicao` and
  `joao-xxi`, then `fujacal-start`, by eye and by the pixels of the sky, the sunlit and shaded road and
  the walls: exposure 0.56 → 0.4, the sun 5.2 → 8.5, the hemisphere 1.2 → 0.42 (its sky colour a
  little greyer), the reflections 0.9 → 0.36; the sky turbidity 7 → 2, rayleigh 1.9 → 0.9, mie 0.006
  → 0.003, for the photos' zenith, (69, 133, 202) without clouds; the sun's colour what's left of it
  through that air (Preetham's extinction, as the sky's shader has it), white-balanced to a sun 60° up,
  so 15:15's sun is a warm white and an evening's golden. The clouds: six octaves of noise, not four, a
  sharper edge (0.15, not 0.3), coverage 0.38 at scale 0.0006, drifting with the game's clock (as fast
  as a cumulus 1.5 km up in a breeze of 10 m/s); `?scenery` draws them at time 0, so a round is the same
  every time.
- **The haze:** three's `FogExp2` hides with the square of the distance: 18% of a hill 2 km off, 54% at
  4 km, 99% at 10. Air hides with the distance, so `look.ts` changes three's fog chunk to
  `exp(-density × distance)` for every material, at 1/5,900 m (a hill 4 km off half hidden: a clear
  Minho day's 20–30 km of visibility), and its colour from #e7d6bf (beige) to #b8c8d4, a blue-grey a
  little greyer than the horizon's sky, as the hills are in the `sameiro` and `conselheiro-lobato`
  photos. Bom Jesus and the Sameiro (twice their size) take it as the hills round them do: checked with
  a red haze, then at `sameiro`'s and `bom-jesus`'s viewpoints.
- **The street lamps** were lit by day (an unlit-white head and a halo 4 m across), and by day each
  halo looked like a second sun in the sky. They light once the sun is under 4° (`LIT`); by day the
  head is a pale grey box, which showed it floating 1.8 m off its post, so each lamp has its arm now
  (one more instanced mesh, one draw call; the halos' was one).
- **`?weather=grey`**, a grey Minho day: the sky an overcast (the sky's shader's colour replaced by a
  grey palest at the horizon, in faint bands of its own noise), the sun 1.2 and the sky's light 1.1, so
  shadows are faint, the haze grey (#a9b1b8) and thicker (1/2,500 m), and the streets' surfaces and paint
  wet (`WET` in `streets.ts`: darker and glossy, giving back the sky). Looked at against `liberdade`,
  `lobato-crossing` and `bom-jesus`, at their photos' times. **`?weather=rain`** is that and the rain:
  10,000 streaks in a box 40 m across that goes with the camera, worked out on the graphics card from
  the clock (one draw call, no work a frame on the CPU). The rain has no sound: the karts have no
  wipers, and the rain's own sound would go through `audio.ts`'s mix (tasks 023 and 025), so it's left
  for a task of its own if wanted. Neither is shot in the round, and neither is in the game's menu: a
  player gets them only from the address.
- **Not decided here, for the owner:** 18 of the 29 photos are grey days, so the scorecard sets a
  sunny afternoon beside grey photos more often than not. The default stays the clear afternoon
  "What" asks for; a grey default, or each round shot in its photo's weather, would be the owner's call.
  > Leave it as it is: the clear afternoon in the game and in every round, grey photos included (the
  > owner, 2026-10-17). Written as decision 037 by the planning session, as this one was asked to
  > change nothing in braga-map but this file, its roadmap lines and the round's record.
- **The round** `2026-10-17-after022` ("A luz"), shot on party-kart `909539b` (braga-map 1.18.1) after
  the merge with `main` (`5abc39b`, which hadn't moved: neither 021 nor 026 landed while it was shot),
  at High, Medium and Low, prepared with a copy of `tools/round.mjs` reading `../party-kart-022/shots/`
  (the main folder was another session's), and recorded in `refs/rounds.json`. Against `after046`, at
  the median: the same 126 draw calls on High and Medium, 95 on Low (each viewpoint within 6: the sun's
  new direction puts other things in its shadow box); 1.67 → 1.76 M triangles on High, 0.76 → 0.79 M on
  Low (the lamps' arms, and the shadows); the same textures (132, 80, 47 MB). The clouds cost
  0.15–0.17 ms a frame at 1920 × 1080 on the desktop against a sky without them (`porfirio-da-silva`,
  `joao-xxi`, `pascoal-fernandes`, alternated three times); the round's own frame times (0.82 → 1.24 ms
  on High at the median) and build times (5.3 → 6.8 s) were taken with the other sessions busy on the
  desktop. A phone's cost isn't measured.
- **Done** 2026-10-17. In party-kart's `main` as `c318ec1` (the light `17873c2`, the lamps' arms
  `909539b`, the budget's note), pushed, not deployed. party-kart's `CLAUDE.md` ("Trying it in a
  browser" and the simulation's files) and `docs/architecture.md` (the code table, `Look`, the budget)
  say what changed.
- **Deployed** 2026-10-17 from `c318ec1` with 054 (the flying camera) and braga-map 1.18.1 (048, 017
  and 046), at the owner's word; the live page serves the build (`index-Dp3Xgjwj.js`).
