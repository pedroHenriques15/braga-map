---
status: blocked
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: []
roadmap: Ultra · Braga at its most real
---

# 097 · The railway: rails, sleepers, catenary, the station and a train

## Why

braga-map's tiles hold the railway's lines, and nothing draws them: the line into Braga's station
is an empty strip of ground. A train passing is a sight a local knows.

## What

Today `tools/fetch.mjs:29` fetches `railway=rail|light_rail|funicular` and `tools/build.mjs:106-109`
puts them in the tiles (`rails`); party-kart has no code for them.

1. **The track:** ballast, sleepers and two rails at the standard Iberian gauge (1668 mm), on its
   bed at the ground's height (or its bridge's and cutting's, from the LiDAR), each line as OSM
   has it.
2. **The catenary:** its masts every ~60 m and wires, where the line is electrified
   (`electrified=contact_line`), the masts' positions from the point cloud where it sees them.
3. **The station** (Braga's), its platforms and canopies at their measured size, drawn from its
   reference photos (082: never textured with them).
4. **A train:** a CP Urbanos do Porto unit on the line now and then, at the timetable's times if a
   licence allows (else a made-up interval).

## Read first

- `tools/fetch.mjs`, `tools/build.mjs`, `docs/DECISIONS.md` 028, 038; party-kart's
  `src/render/city.ts`.

## Done when

- [ ] The railway in the map's extent is drawn with its track and catenary, and the station
  stands; a viewpoint set where a reference photo of the line was taken, shot and rated.
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Notes

- Not checked: whether the station and the line are inside the open world's area. If they aren't,
  they're drawn in the far city first, and reached once 099 grows the area.
- Checked 2026-10-24: none of the railway's 237 points in the map is inside the open world's edge
  (`tools/open.json`), and Braga's station stands at about (-1040, 350), outside it. **Held by the
  owner (2026-10-24):** what's outside the playable area waits with 099.
