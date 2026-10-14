---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-13
depends-on: [023]
roadmap: Alongside · The sound
---

# 024 · The karts' sound: a race car's engine for every kart, its tyres and the wind

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

- [x] Your engine sounds like a race car's through its gears (the owner's choice, 2026-10-14, over a
  recording and a kart's two-stroke), its revs smooth but for the shifts: the owner listens to
  023's recordings made again, beside the baseline.
  > "Sounds right", 2026-10-14, of party-kart's `sounds/2026-10-14-v8/` (race, alone, cobbles)
  > beside the baseline and the two-stroke.
- [x] A rival passing is heard coming, going by on the right side, and fading.
  > A kart driven past 4 m to the right at 30 m/s, the listener still: −32 dBFS at 80 m ahead,
  > −10.7 on the right (−17 on the left) going by, back to −31 at 80 m behind; pitched about 10%
  > up coming and 8% down going. The owner heard the race take.
- [x] Drifting scrubs, the cobbles rumble, and the wind rises with speed.
  > At 30 m/s, a drift raises the peak 1.6 dB and the cobbles 1.7; the wind grows with the square
  > of the speed. The owner heard the cobbles take.
- [x] The sound files are under 300 KB in all, and the race's audio costs a phone little (task
  004's budget, if it exists by then; otherwise the frame time with and without sound).
  > No sound files: the engine is synthesized. The engines take 28 µs a frame for your kart and
  > three others; their audio graph, rendered offline, 2.7% of a desktop core. Task 004's budget
  > has no line for sound. Not measured on a phone, which may be five to ten times slower.
- [x] The recordings are in `docs/SOURCES.md`, and the decision in `docs/DECISIONS.md`.
  > `docs/SOURCES.md` "Sounds": the recording tried and dropped, and the ones checked and not
  > used. Decision 016.
- [x] `npm test` and `npm run check` pass.
  > 23 of 23 (19, and task 010's 4 in progress), and `tsc` clean.

## Out of scope

- The mix, the item sounds and the jingles: task 023.
- The city's sound: task 025.
- Music: the owner chose none (2026-10-13).

## Notes

- The five Freesound recordings were found by their titles and licence filter only, not heard.
- **None of the five gives a clean loop** (2026-10-14). All are crowds of karts from beside the
  track: qubodup's three an iPod's recording of a reverberant indoor hall, its automatic gain
  flattening it to one roar; OverlookHotelRecords' two, many karts passing outdoors, with a steady
  tone near 800 Hz (a generator or a fan) under all of 317470. Their spectrograms show no single
  engine's harmonics held anywhere; how periodic the sound is, every 0.1 s, never comes near the
  game's own engine's (a median of 0.24–0.33, against 1.0).
- **The owner chose a small OHV engine** (2026-10-14), over a Honda CRF250's onboard recording,
  a synthesized engine and recording a kart: Freesound 836786, Mihacappy's "ohv_gov_over_take1"
  (CC0, 1:51), "small OHV motor starting and holding varying RPMs", the kind of engine rental
  karts have. It holds several revs steady, harmonics clear, though recorded on a phone in a
  garage, with its echo. The author asks that their sounds not be used to train AI models; that
  is a request, not a condition of the licence, and a game's loops aren't that.
- **First, the recorded engine** (2026-10-14; replaced, below):
  - The loops: four, cut from 836786's 128 kbps preview where its pitch holds steadiest (a pitch
    track of the whole recording, from the spacing of its harmonics): idle at 13.29 Hz (firing;
    about 1,600 rpm), low 19.94, mid 22.21, high 24.06. Mono, −20 dBFS RMS, 96 kbps MP3, 100 KB in
    all, in `src/sounds/` (the `.gitignore` entry for the takes became `/sounds/`, root only). Each
    is padded 0.1 s either side with its own wrap-around and rebuilt once decoded with a 10 ms
    crossfade at its seam: MP3 adds a start delay that browsers differ in, and never codes the same
    sound twice the same way. The seam's jump is under one typical step between samples, at 44.1
    and 48 kHz alike. `docs/SOURCES.md` has the cut.
  - The engine (`engines` in `src/audio.ts`, fed by `hearKarts` in `main.ts`): revs from speed,
    the clutch slipping on the grid and when pulling away, up to 33 Hz flat out and 37 on a boost;
    the two loops either side crossfaded by pitch, each at the rate that makes the revs; a low-pass
    opening on the throttle. A loop plays only while the revs are near it, two at a time, and an
    engine nobody's is stopped. The old buzz is gone. The bots' throttle is kept for it.
  - Others: the nearest three within 150 m through panners, with the Doppler shift; the bots'
    speed is exact, the other players' from their snapshots (their throttle taken as on above
    2 m/s, as snapshots don't carry it).
  - Tyres and wind, noise on the engines' bus: a scrub drifting or sliding over 4 m/s sideways, a
    rumble on the cobbles shaken at the rate 12 cm setts pass, wind with the square of the speed.
  - `listen.mjs` has a third take, `cobbles`, from sample 7050: the track now has 558 m of
    cobbles, from 7137 to 8150, not the 24 m this task says.
  - Docs: party-kart's `CLAUDE.md`, `README.md` (the recording's credit, though CC0 owes none),
    `docs/architecture.md` ("Sound", and "Hardly any assets"); braga-map's `docs/SOURCES.md`
    ("Sounds") and decision 016.
- **Measured** (Chromium, this computer):
  - Your engine, pitch-tracked through the alone take: it revs at 21 Hz on the grid in the
    countdown, climbs smoothly pulling away, holds about 29 Hz at speed, dips into corners and
    rises in the air. No jumps.
  - A rival passing 4 m to the right at 30 m/s, the listener still: −33 dBFS at 80 m ahead,
    rising to −13 on the right (−23 on the left) as it goes by, and back to −33 at 90 m behind;
    pitched about 10% up coming and 8% down going.
  - Your kart at 30 m/s: drifting raises the peak 1.5–2 dB; the cobbles 0.5–1 dB (the rumble is low,
    so it shows less in a peak than it's heard); in the air the engine is 3.7 dB softer, off the
    throttle 7.7 dB.
  - Cost: `engines` takes about 30 µs a frame for your kart and three others. The audio thread can't
    be timed live; rendered offline, the same graph takes 2.4% of a core with every loop playing
    and 1.5% with two a voice, as it now plays. A phone may be five to ten times slower.
- **The owner heard it** (`sounds/2026-10-14-karts/`, 2026-10-14): "Too harsh. Should be more of a
  race type engine." No CC0 recording holds a race engine steady over its revs (`docs/SOURCES.md`
  lists the ones checked: a Formula Ford that mostly idles, a Lotus Elise whose revs only blip), so
  the owner chose a synthesized engine, a racing kart's 125 cc two-stroke, over a race car's and a
  Formula 1's sound. The loops and `src/sounds/` are gone; party-kart has no sound files again.
- **Then a two-stroke** (replaced, below): a two-stroke fires once a
  revolution, so its revs are its pitch: 50 Hz idling (3,000 rpm), 120 pulling away on the clutch,
  245 flat out (14,700 rpm), 270 on a boost. One oscillator a voice, a wave of the exhaust's pulse
  (48 harmonics falling as 1/n^0.85, the 2nd and 3rd stronger, phases spread) through a peak at
  520 Hz (the pipe's body), a peak rising with the revs (the expansion chamber's ring, +9 dB on
  the throttle, +3 off) and a low-pass (5 kHz on the throttle, 3 kHz in the air, 1.5 kHz off);
  under it band-passed noise pulsing at the firing rate, the intake's rasp; and the firing's
  detune wandering 20 cents on the throttle, 40 off, where it burbles. The voices, the Doppler
  shift, the nearest three, the tyres and the wind are as before. Its level matches the recorded
  engine's loudness over a take (−30.7 dBFS RMS at first, raised 4.6 dB). The spectrogram of an
  alone take: about 115 Hz on the grid in the countdown, a clean climb pulling away to about
  215 Hz at speed, dips into corners, a rise in the air.
- **The owner heard the two-stroke** (`sounds/2026-10-14-twostroke/`): "Not two stroke, several
  gears and should be closer to a race car." So the karts' engine has gears after all, against
  this task's "a kart has no gearbox": the owner's choice.
- **The engine now** (`engines` and `revsFor` in `src/audio.ts`, party-kart `31dcce9`): a race car's
  V8 through six gears. Idle 1,200 rpm, the clutch slipping at 5,000 pulling away, up a gear past
  9,000 (the power cut 80 ms, the revs dropping in 35 ms, a pop from the exhaust two times in
  five), down below 5,200 (the revs blipped), sixth reaching 9,000 at 46 m/s, the limiter at 9,300
  on a boost; each voice keeps its own gear. One oscillator a voice at the cycle's rate (rpm/120),
  a wave of 96 harmonics falling as 1/n^0.75, the 8th and its multiples four times stronger (a V8
  fires four times a revolution), the 4th's 1.8, the odd ones 0.55; through a peak at 350 Hz (the
  exhaust's body), a peak at twice the firing rate (the intake's howl, +8 dB on the throttle, +2
  off) and a low-pass (6.5 kHz on the throttle, 3.5 kHz in the air, 2.2 kHz off); under it the
  intake's rasp, noise pulsing at the firing rate (rpm/15); the firing's detune wandering 8 cents
  on the throttle and 25 off; and off the throttle above 5,500 rpm the overrun's crackle. The
  spectrogram of an alone take: five upshifts in the first 10 s pulling away, downshift blips
  braking for a corner, sixth at speed. Its level raised 3.4 dB to match the engines before (−29.9
  dBFS RMS at first).
- **Not verified:** anything by ear, yet; a phone; Safari and Firefox.
- **Released** on 2026-10-14: party-kart `31dcce9`, deployed to
  https://pedrohenriques15.github.io/party-kart/ (its script `index-D1LorEUd.js`). No message changed,
  so old and new builds still race together; players get the sound when they reload.
