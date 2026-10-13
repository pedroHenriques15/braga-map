---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [023]
roadmap: Alongside · The sound
---

# 024 · The karts' sound: a real kart's engine for every kart, its tyres and the wind

## Why

The engine is the sound you hear all race, and today it's a buzz that jumps in pitch every
14 m/s. The other karts make no sound at all, so a rival passing you is silent. The owner wants
the karts to sound like real karts, and allowed recorded engines for it (2026-10-13). With
tyres that scrub in a drift and wind that rises with speed, the race starts to sound like one.

## What

Paths in this task are party-kart's (`../party-kart/`), unless they start with `../braga-map/`.

Today: `engineSound(speed, throttle, on)` in `src/audio.ts` runs every frame for your own kart
only (`src/main.ts:994`). It's a sawtooth and a square at half its pitch through a fixed 900 Hz
low-pass, at `45 + 2.2·speed + 3·(speed mod 14)` Hz, so the pitch drops by about 40 Hz at 14,
28 and 42 m/s. There's no tyre or wind sound. A car knows when it's `drifting`
(`src/car/car.ts`), and each track sample its `surface` (`'cobble'` on 24 m of the Volta dos
Amigos). The race keeps every kart it draws in `RaceCtx.karts`: the bots are simulated here, so
their speed is exact; other players' karts come from snapshots, 110 ms behind. Task 023 gives
the engine bus, the panners and the recording to judge by.

Steps:

1. **The recording.** Freesound has five CC0 kart recordings (searched 2026-10-13), all made
   beside a track rather than on a kart: qubodup's "Indoor Go-Kart" (189629), "Go Kart Racing"
   (189622) and "Karting" (189628), and OverlookHotelRecords' "Go Kart Racing Outdoors" (317470,
   317471). Listen to them for stretches of one engine held steady at a few speeds, and cut
   short loops from them (idle, low, middle and high revs), as MP3 or AAC, which every browser
   decodes (check Safari before choosing Opus), in under 300 KB in all. Import them so Vite
   bundles them (`new URL('…', import.meta.url)`; party-kart has no `public/`), and load them
   after the race's scene, without delaying the start. **If none gives a clean loop, stop and
   report:** the owner decides between recording a kart and a synthesized engine modelled on
   these recordings.
2. **One kart's engine:** a kart has no gearbox, so its revs follow its speed, from the clutch
   biting to the top speed. Crossfade the loops by revs and set their `playbackRate` between
   them; open a brighter filter on the throttle, and soften it off the throttle and in the air.
   No more pitch jumps.
3. **Every kart within earshot:** each kart's engine through 023's panner at its position, from
   its own speed (snapshots for other players), with the Doppler shift computed from how fast
   it comes or goes (`PannerNode` no longer does it). Only the nearest three or four karts
   play, for the CPU.
4. **Tyres and wind, synthesized:** a scrub of filtered noise while drifting and on hard
   cornering, a rumble on cobbles (`surface === 'cobble'`), and wind rising with speed, all on
   the engine bus. The landing's `thud` stays.
5. **On record:**
   - `../braga-map/docs/SOURCES.md` gets a "Sounds" section: each recording's Freesound id,
     author, licence (CC0: no credit owed, but on record) and what was cut from it.
   - `../braga-map/docs/DECISIONS.md` gets an entry: recorded sounds are allowed for the karts'
     engines and the city's ambience, from CC0 recordings, while the menus' and items' sounds
     stay synthesized. The owner chose this on 2026-10-13, over recording everything and over
     keeping everything synthesized.
   - party-kart's `CLAUDE.md` ("every sound is synthesized"), `docs/architecture.md` ("No
     assets") and the README say so.

## Read first

- `src/audio.ts` (as task 023 left it), `src/main.ts` (`RaceCtx`, the frame loop round
  `engineSound`), `src/car/car.ts` (`speedOf`, `drifting`), `src/track/track.ts` (a sample's
  `surface`).
- Task 023's recordings and its notes.
- `../braga-map/docs/DECISIONS.md` 002 and 006: the conditions on photos, which recordings
  share.

## Done when

- [ ] Your engine revs smoothly with speed, from a recording, and sounds like a kart: the owner
  listens to 023's recordings made again, beside the baseline.
- [ ] A rival passing is heard coming, going by on the right side, and fading.
- [ ] Drifting scrubs, the cobbles rumble, and the wind rises with speed.
- [ ] The sound files are under 300 KB in all, and the race's audio costs a phone little (task
  004's budget, if it exists by then; otherwise the frame time with and without sound).
- [ ] The recordings are in `docs/SOURCES.md`, and the decision in `docs/DECISIONS.md`.
- [ ] `npm test` and `npm run check` pass.

## Out of scope

- The mix, the item sounds and the jingles: task 023.
- The city's sound: task 025.
- Music: the owner chose none (2026-10-13).

## Notes

- The five Freesound recordings were found by their titles and licence filter only, not heard.
