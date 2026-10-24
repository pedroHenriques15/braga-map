---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 081 · Ultra: a graphics level for a PC, above High

## Why

The owner wants Braga at the absolute best quality in every aspect (2026-10-23), and the friends'
phones can't hold it. The owner's answer: a fourth graphics level, **Ultra**, for a PC only, where
everything the "Ultra" tasks add goes; High, Medium and Low stay as they are, so the phones still
play. This task makes the level and the place each later task hangs its detail on.

## What

Today `src/render/look.ts:9` has `type Quality = 'high' | 'medium' | 'low'`, and `setQuality`
(`look.ts:206`) sets the pixel ratio (2, 1.25, 1), the sun's shadow map (2048, 1024, none, one
`DirectionalLight` with a 140 m box and `PCFShadowMap`) and recompiles the materials. The player
picks the level in `src/settingsScreen.ts` and it's kept as `pk-quality` (`src/prefs.ts`);
`watchSpeed` in `src/main.ts` steps it down when a race runs slowly. braga-map's textures come in a
file per level (`world/textures/<tile>/<id>-<level>.ktx2`, decision 030) and the trees' near
distance is per level (260, 180, 120 m, `src/render/trees.ts`).

1. Add `'ultra'` to `Quality`, above `'high'`, everywhere a level is switched on (`grep -rn
   "'high'" src`): until a later task gives it its own, Ultra takes High's value.
2. Ultra's own, in this task: the device's full pixel ratio (no cap at 2), the sun's shadow map at
   4096, and the trees' near distance and the haze's far plane at the most the city holds without
   a frame over 16 ms on the owner's PC.
3. **Only offered on a PC:** Ultra is in the menu when the device isn't touch-first and WebGL
   reports a discrete GPU or `MAX_TEXTURE_SIZE` ≥ 16384; `watchSpeed` may step Ultra down to High,
   never up to it. `?quality=ultra` forces it for `scripts/shots.mjs`.
4. **Shots:** `scripts/shots.mjs` takes `--ultra`, and rounds from now on are shot at Ultra and
   Low (Ultra is what "as real as it gets" means; Low is what a phone sees).
5. **The budget:** add an Ultra column to party-kart's `docs/architecture.md` "The city's budget",
   measured on the owner's PC: draw calls, triangles, textures' memory, download, frame time.
6. braga-map: textures and the tiles keep three levels until a task gives Ultra files of its own
   (085); `loadWorld`'s level argument accepts `'ultra'` and falls back to `'high'`.

## Read first

- party-kart's `docs/architecture.md` ("Rendering", "The city's budget"), `src/render/look.ts`,
  `src/settingsScreen.ts`, `src/prefs.ts`, `src/main.ts` (`watchSpeed`), `scripts/shots.mjs`.
- braga-map's `docs/DECISIONS.md` 013 and 017 (the budget is a guide), 030 (a file per level).

## Done when

- [x] On the owner's PC the menu offers Ultra; on a phone (or Chromium's touch emulation) it
  doesn't: Ultra, Alta, Média, Baixa on the RTX 4060 Ti; Alta, Média, Baixa with Pixel 7's emulation.
- [x] `?quality=ultra` shoots every viewpoint with no page error, and the budget has its Ultra
  column: the round `2026-10-24-after081`, 33 at Ultra, none failed; party-kart's
  `docs/architecture.md`, "Ultra beside the three".
- [x] High, Medium and Low draw the same shots as before (every viewpoint unchanged): to the pixel
  against `2026-10-24-before081`, but 17 pixels of the graphics card's noise at one Low shot (Notes).
- [x] `npm test` and `npm run check` pass: 156 of 156, rebased on party-kart 67e3771 (110's).

## Out of scope

- What Ultra draws beyond High's: tasks 083–101 each add theirs.

## Notes

- The owner's answer (2026-10-23): "Nível Ultra, só PC". When this task is finished it becomes a
  DECISIONS.md entry: everything past what a phone holds goes to Ultra, and the budget (decision
  013) keeps its three phone levels.
- **Done (2026-10-24, worker-1), party-kart:**
  - `Graphics` (`src/render/look.ts`): Ultra above the three levels the city is built at
    (`Quality`, unchanged, so the files keyed by it, `streets.ts`'s grains among them, need nothing).
    `levelOf` builds Ultra's city at High's level, and `buildCity` takes the player's choice
    (`city.ts`: four lines). Ultra's own: the screen's every pixel (`setQuality`, no cap at 2), the
    sun's shadows at 4096 px, the near trees to 700 m (`NEAR` in `trees.ts`).
  - Offered (`ultraOffered`) where the device isn't touch-first (`PHONE`, `pointer: coarse`) and its
    graphics card takes textures 16,384 pixels wide or is a discrete one by its WebGL renderer's name;
    `?quality=` sets any level whatever the device. The menu's and the settings' pickers list Ultra only
    where it's offered (or chosen); `watchSpeed` and a lost context step Ultra down to High, never up.
  - `scripts/shots.mjs`: `--ultra` (Ultra in High's place: the rounds from now on), `--high` (High as
    well), and the level in each shot's address; an Ultra shot sits beside the round before's High.
  - Docs: README's graphics line, CLAUDE.md (`?quality=`, the shots' flags), `docs/architecture.md`
    (the graphics levels under "Rendering", and Ultra beside the three in "The city's budget").
- **The trees' reach, measured** (?scenery at Ultra, 2560 × 1440, the RTX 4060 Ti): a still frame at
  the eight tree-heaviest viewpoints, at most 3.58 ms at 260 m, 3.83 at 450, 4.15 at 700, 4.61 at
  1,000 (falperra). The frame that takes a new gather up (every 20 m the camera goes): 8.1 ms on
  average at 260 m, 11.9 at 700, 17.6 at 1,000, 27.5 at 1,500. So 700 m, the most of these under
  16 ms; the worst single steps (27–56 ms) are there at High's 260 m too.
- **Decided by the session, for the owner to confirm:** "the haze's far plane" left as High's. The
  camera's far plane is 30 km already, the whole box and the hills, and the haze is the light's
  (decision 037, matched to the photos), not a draw distance: thinning it would make the air less
  like Braga's.
- **Step 6's premise, false:** braga-map's `loadWorld` takes no graphics level (it hands each texture's
  files for every level, `files: Record<PhotoLevel, PhotoFile>`), so there's nothing to fall back in
  braga-map: no library change, no version. party-kart takes High's files at Ultra until task 085
  gives Ultra its own (`PhotoLevel` then gains `ultra`).
- **Checked** (party-kart on braga-map 1.36.0):
  - The menu, in Chromium on the RTX 4060 Ti (`MAX_TEXTURE_SIZE` 16,384): Ultra, Alta, Média, Baixa
    on a desktop; Alta, Média, Baixa with Pixel 7's touch emulation (`pointer: coarse`); no page error.
    The settings' picker uses the same rule and wasn't opened.
  - The round `2026-10-24-after081` (party-kart's `shots/`): every viewpoint at Ultra, High, Medium and
    Low, 132 shots, none failed (a page error fails a shot). High and Medium the same as the round
    `2026-10-24-before081`, shot from the commit before, to the pixel at all 33; Low at 32, and
    `egidio-guimaraes` 17 pixels by at most 8 of 255, which a shot of it again matched to the pixel:
    the graphics card's noise.
  - The budget, from that round: Ultra 103–271 draw calls, 2.68–5.36 M triangles, 181 MB of textures,
    built in 6.7–9.0 s, a frame 1.36–3.44 ms at 720 pixels high (High 99–264, 1.43–3.19 M, 133 MB,
    6.3–7.4 s, 0.78–1.94 ms). The download the same at every level.
  - `npm test` 153 of 153 and `npm run check`.
- **Landed** (2026-10-24, worker-1): party-kart `41adaa2` on `67e3771` with braga-map 1.36.0; braga-map's
  docs only, no version. Decision 069. The rounds' Ultra baseline is `2026-10-24-after081` (the
  coordinator marks it), in party-kart's `shots/` with `2026-10-24-before081`.
