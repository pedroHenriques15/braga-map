---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-13
depends-on: []
roadmap: Alongside · The sound
---

# 023 · The race's sound: a mix that doesn't clip, and synthesized sounds that don't grate

## Why

The owner says the game's audio is truly horrible, and names everything: the engine, the beeps
and item sounds, the loudness, and the silence round you (2026-10-13). This task does what the
others need first: one mix with a limiter, levels that leave room for an engine and a city,
sounds placed where they happen, a way to record the race's sound before and after, and the
synthesized sounds made pleasant. The engine is task 024, the city task 025.

## What

Paths in this task are party-kart's (`../party-kart/`).

Today every sound is synthesized in `src/audio.ts` (203 lines), and `src/main.ts` plays them:

- **One gain node** (`master`, 0.5, 0 when muted) and nothing between the sounds and the
  speakers. There is no limiter, so an explosion (`sfx.boom`: noise at 0.9 plus a 55 Hz tone)
  stacked on a hit or the bass drop clips.
- **Raw waveforms:** horns are two square waves (`horn`), and boxes, pickups, checkpoints,
  laps, the countdown (`beep`) and the finish are bare triangle or square tones with a 10 ms
  attack. The roulette's `sfx.tick` is a square-wave click every 70 ms.
- **Where a sound is doesn't matter:** others' items play through `near()`
  (`src/main.ts:675`), a volume falling straight to nothing at 120 m, with no left or right.
- **`noise()` makes a new buffer of random samples for every sound.**
- Sounds come from three places in `main.ts`: `noteForMe` (your own racer's notes), `onArenaFx`
  (items, anyone's) and `eggReact` (the easter eggs: `bark`, `drill`, `chime`).

Steps:

1. **Record the race's sound,** to judge every change by ear, as viewpoints do for the look:
   `?autodrive&record=60` records 60 s of what the game plays (a `MediaStreamAudioDestinationNode`
   on the master, through `MediaRecorder`) and offers it as a file; with `&at=<sample>` the
   race starts at the same place each time. Record a baseline before changing anything: one
   from the start, with items flying, and one alone at speed. Keep them for 024 and 025.
2. **Measure the peak:** an `AnalyserNode` on the master, its loudest sample since the race
   began, and how many frames clipped, in `window.__kart.audio` (`?autodrive` already exposes
   `__kart`).
3. **The mix:** buses for the engines, the effects, the jingles and the ambience (024 and 025
   fill the first and the last), into a master with a `DynamicsCompressorNode` as a limiter
   (about −6 dB threshold, ratio 20, a few ms' attack). Set the levels so an explosion next to
   you doesn't clip, a pickup is heard over the engine, and the jingles duck the effects under
   them. Mute (M, 🔊) still silences everything.
4. **Where sounds are:** a `PannerNode` for every sound with a place (others' items, hits,
   explosions, the eggs), and the listener on the camera, in place of `near()`. Far sounds stay
   faint but heard, and the effects bus takes any new sound with a place.
5. **Make the synthesized sounds pleasant,** keeping each one recognisable for what it means:
   softer timbres (sines and filtered triangles, two slightly detuned voices rather than raw
   squares), envelopes without clicks, the countdown, checkpoint, lap and finish as one family
   of jingles, each driver's horn keeping its notes (`driverById(...).horn`) but sounding like a
   horn, the roulette's tick much quieter, and the item sounds (`box`, `got`, `pop`, `throw`,
   `hit`, `boom`, `bass`, `shield`, `slip`, `turbo`, `bump`, `thud`) readable at a glance. The
   eggs' bark, drill and chime keep their character.
6. **Cheap:** make the noise buffers once and reuse them, and cap how many sounds play at once.
7. **Docs:** the audio line in `docs/architecture.md`, and "Drawing and sound" in
   `docs/making-changes.md` (which bus a new sound goes to, and that it needs a place).

## Read first

- `src/audio.ts`, all of it.
- `src/main.ts`: `noteForMe`, `onArenaFx`, `eggReact`, `near` (`:675`), the countdown's beeps
  (about `:1010`), the roulette's tick (about `:1045`), `unlockAudio` and the mute button.
- `docs/architecture.md` (the browser half), `docs/making-changes.md` ("Drawing and sound").

## Done when

- [x] `?autodrive&record=60` gives the race's sound as a file, and the baseline recordings are
  kept, with the commit they were made at.
  > `scripts/listen.mjs` records both takes through it. The baseline is party-kart's
  > `sounds/2026-10-14-baseline/` (ignored by git), its `sound.json` saying "8946d3d with changes":
  > the recorder and the meter only.
- [x] In an eight-kart race with items under `?autodrive`, `__kart.audio` shows nothing clipped,
  and the peak stays under −1 dBFS.
  > The race take: −7.7 dBFS, 0 clipped, with 31 item and egg effects in it (a boom, 7 hits, 8
  > throws…). The loudest sounds played at once over it: −4.4 dBFS, 0 clipped.
- [x] The owner listens to the after recordings beside the baseline and says the beeps and item
  sounds no longer grate, and nothing jumps out too loud.
  > "Sounds right", 2026-10-14, of `sounds/2026-10-14-mix/` beside the baseline.
- [x] Others' items are heard from where they are: left or right, near or far.
  > A boom 30 m to the camera's right is 12 dB louder on the right, 30 m to its left 33 dB louder
  > on the left, ahead the same on both; fainter with distance (−16, −28 and −37 dBFS on its side
  > at 30, 120 and 350 m), and past 400 m not played.
- [x] `npm test` and `npm run check` pass.
  > 19 of 19, and `tsc` clean.

## Out of scope

- The engines, the tyres and the wind: task 024.
- The city's sound: task 025.
- Music: the owner chose none (2026-10-13).
- Recorded sounds: allowed only for the engines and the city (task 024 records that decision).
  This task's sounds stay synthesized.

## Notes

- The owner's answers, 2026-10-13: all four are what's wrong (the engine, the beeps and item
  sounds, loudness and clipping, silence round you); recorded sounds are allowed for the engine
  and the city, from CC0 recordings, while menu and item sounds stay synthesized; the karts
  should sound like real karts; no music.
- No viewpoints apply: the before and after recordings take their place.
- **Done in party-kart, 2026-10-14, committed as `31dcce9`:** `?record=60` and `scripts/listen.mjs`
  (two 60 s takes, `race`: eight karts with items, and `alone`: at speed from sample 2535, the
  autopilot's fastest minute; a page setting each beside the baseline's); `__kart.audio` (the peak
  on each side, the samples clipped, which effects played); the four buses, the limiter and the
  ducking; a `PannerNode` for every sound with a place and the listener on the camera; one noise
  buffer and at most 24 sounds at once; every effect and jingle remade. The engine is unchanged
  (024), on its bus. Docs: `docs/architecture.md` ("Sound"), `docs/making-changes.md`, `CLAUDE.md`.
- **The baseline** is in party-kart's `sounds/2026-10-14-baseline/` (ignored by git), made at
  8946d3d with only the recorder and the meter added. The "after" is `sounds/2026-10-14-mix/`; its
  `index.html` plays each take beside the baseline's.
- **The old mix didn't clip.** The assumption in "What" was false: with the master at 0.5, the
  baseline's race take peaked at −4.7 dBFS, and the loudest sounds at once (a foguete, a hit, a
  best lap, a horn, a wall and a turbo) at −3.3 dBFS. The limiter stays, for the four engines (024)
  and the city (025) to come. There is no `bass` sound or "bass drop" in the code.
- **The worst of the old sound was the bumps:** 1,685 in the 60 s race take. The simulation notes
  a bump on every step (120 a second) that two karts touch, however gently, so karts rubbing in a
  pack made a buzz of square waves at 90–120 Hz. A knock now needs 1 m/s, and 0.12 s since the
  last: 21 and 28 in two takes since. The simulation is unchanged.
- **Measured, before and after** (`listen.mjs`; loudness over the take, and how far its loudest
  400 ms stands over the typical one):

  | Take | Peak | Clipped | Loudness | Loudest over typical | The loudest sounds at once |
  |---|---|---|---|---|---|
  | race, before | −4.7 dBFS | 0 | −26.1 dBFS | 6.1 dB | −3.3 dBFS |
  | race, after | −7.7 dBFS | 0 | −25.2 dBFS | 3.1 dB | −4.4 dBFS |
  | alone, before | −13.2 dBFS | 0 | −26.3 dBFS | 0.7 dB | −3.1 dBFS |
  | alone, after | −9.6 dBFS | 0 | −25.3 dBFS | 1.8 dB | −4.5 dBFS |

  The alone take's loudest moment, before and after, is the countdown's "go", at 4 s. It's a full
  chord now, louder than the old beep: at first 4.5 dB over the three strokes before it (−7.1
  dBFS), it was brought down to 1.8 dB over them, and these are that take. The race take's
  loudest is now in the race (at 40 s), no longer at its start.
- **Where sounds are**, measured in Chromium with a foguete's boom round the camera (each side's
  peak): 30 m right, left −28 / right −16 dBFS; 30 m left, −15 / −48; 30 m ahead, −19 / −19;
  120 m right, −70 / −28; 350 m right, −84 / −37; 500 m, not played; in your head, −5.8 / −5.8.
- **The owner listened** to `sounds/2026-10-14-mix/index.html` beside the baseline on 2026-10-14:
  it sounds right.
- **Not verified:** anything by ear; Safari and Firefox (Playwright's WebKit on Windows has no Web
  Audio, and its Firefox isn't installed), where the listener falls back to `setPosition` and
  `setOrientation`; what the sound costs a phone.
