---
status: todo
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [081, 090]
roadmap: Ultra · Braga at its most real
---

# 092 · Night: the street lamps lighting the streets, the windows lit, Bom Jesus floodlit

## Why

At `?time=` after sunset the city goes dark but for the lamps' halos: no lamp lights the street
under it, no window is lit, and Bom Jesus, which every local sees floodlit on its hill at night,
is dark. Braga at night is half of what it looks like.

## What

Today party-kart's lamps (`src/render/road.ts`, `city.ts`'s street furniture) switch on when the
sun is under 4° (`src/sun.ts:23`), drawn as additive halos; there's no light source per lamp. The
lamps stand by a rule along the streets until task 020 places them where OSM has them.

1. **Every lamp a light** on Ultra: clustered (or forward+) lighting for the thousands in view,
   each lamp's colour (the old sodium orange or the new LED white, by street, from the reference
   photos at night), a pool of light on the ground and the walls; on High, a baked light texture
   on the ground under each lamp instead.
2. **Lit windows:** a share of the windows lit at night by the hour (more at 21:00, few at 03:00),
   by the building's kind (a shop's ground floor until closing time, an office's until 19:00), warm
   or cool, the same every time for a moment (seeded by building and hour).
3. **Bom Jesus and the Sameiro floodlit,** and the other landmarks that are (the stadium's four
   floodlights on a match night aren't: it's a quiet night), from reference photos at night.
4. **The sky:** the stars and the moon where they are at the moment, and the city's glow on low
   cloud.
5. braga-map: each lamp's kind and colour, where the reference photos tell it, in `refs/`.

## Read first

- braga-map's `docs/DECISIONS.md` 037, ROADMAP "Later: Night"; task 020; party-kart's
  `src/sun.ts`, `src/render/look.ts`, `road.ts`, `city.ts`.

## Done when

- [ ] At `?time=2026-03-13T22:00` on Ultra, the streets are lit by their lamps, windows are lit,
  Bom Jesus is floodlit: shots of `bom-jesus`, `liberdade`, `conselheiro-lobato`,
  `fujacal-start` at night, set beside reference photos at night.
- [ ] High and below unchanged by day; `npm test` and `npm run check` pass.

## Out of scope

- Where each lamp stands: 020.
