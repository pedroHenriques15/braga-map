---
status: todo
priority: high
kind: owner
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 008 · The photo walk: the owner and the friends photograph the route and Fujacal

## Why

No open source shows every facade, wall, kerb and sign on the route, and the shooter's area
needs detail at walking distance (decision 003). The friends live there. An hour or two of
photos, taken the right way, gives the facades their colours, the pavements their pattern, the
walls their stone, and the landmarks their shape. With photo textures allowed (decision 002),
the best photos can become the textures themselves.

## What

What to do, for the owner and whichever friends join. Photos the friends take are theirs, so
they can become textures with no licence attached (decision 006); that makes the phone's camera
the first choice. Two ways:

**A. With the Mapillary app** (free, on Android and iOS), which records a photo every few metres
with its position and heading, and publishes them openly (CC BY-SA). Good for the drive: other
maps benefit, and the photos can be found by position. But once there, they're CC BY-SA, which
then applies to any texture made from them. Make an account, then:

1. Drive the Volta dos Amigos once, phone fixed on the dashboard or the windscreen, facing
   forward, the app in "drive" mode. In daylight, dry weather, mid-morning or mid-afternoon,
   so the light is even.
2. Walk the shooter's area: the Rua do Fujacal, the Travessa and the Alameda do Fujacal, the
   Rua and the Travessa Conselheiro Lobato. Walk each side of each street, phone at chest
   height, facing the facades ("walk" mode, a photo every 2–3 m).
3. Upload over Wi-Fi. Mapillary blurs faces and number plates itself.

**B. With the phone's camera,** if the app isn't wanted: the same streets, the location setting
on so each photo has its GPS position, one photo every 10–15 m along each side, plus:

- each landmark on or seen from the route (São João da Ponte, the Altice Forum, the Estádio
  1.º de Maio, the Picoto, the Igreja de Lamaçães) from four sides;
- close-ups, straight on: a pavement (1 m × 1 m from above), a kerb, a wall of each kind of
  stone, a facade's tiles (azulejos), a bus shelter, a street lamp, a bench, a bin and an
  ecoponto, a manhole cover, a road sign;
- the skyline: Bom Jesus and the Sameiro from the route, on a clear day.

Then put the photos in a shared folder (Google Drive), and a session copies them into
`.cache/refs/photos/` and records each in `refs/photos.json` (who took it, where, the date).

**For everyone's privacy:** don't photograph anyone's own house on purpose, and say so when a
photo shows a friend's house: those photos stay out of the repository and are never used as a
texture.

## Questions

- [ ] Mapillary (open and searchable by position) or only the phone's camera (kept private)?
  Recommendation: the camera for the shooter's area, the close-ups and the landmarks, since
  those become textures; Mapillary for the drive round the route, if anyone wants to.
  > 
- [ ] Who joins, and when? The shooter's area first.
  > 

## Read first

- `docs/DECISIONS.md` 002 and 003.
- Task 001: the viewpoints the photos should cover.

## Done when

- [ ] The route has been driven and the shooter's area walked, with photos uploaded or shared.
- [ ] The close-ups listed above are in `.cache/refs/photos/`, listed in `refs/photos.json`.
- [ ] Every viewpoint in task 001 has a real photo.

## Out of scope

- Turning photos into textures: tasks 016, 017 and 018.

## Notes
