---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 006 · Every street there: an audit of what the map has and what the game draws

## Why

The friends think streets were removed. As far as the code shows, none was: the world keeps
every class of street, service roads and dirt tracks included. But the map page shows only the
main streets (the 65% cut approved in draft 1), and footpaths, steps and cycleways were never
fetched. A street that's missing, or drawn where there's none, is one of the first things a
local notices. An audit settles it with numbers and a picture, and lists what to add.

## What

Today, according to the inventory of 2026-10-13:

- `tools/fetch.mjs` (`base`) fetches `highway` motorway to track, and pedestrian, but not
  `footway`, `path`, `steps`, `cycleway` or `bridleway`.
- `tools/world.mjs` keeps all of them as `lines` in the tiles (`kind` 0–8), except tunnels
  (`world.mjs:48`); 2,255 service segments are in the tiles.
- `tools/build.mjs` keeps only the main streets for the map page (`build.mjs:119`).
- `tools/track.mjs` routes only on primary to living_street (`track.mjs:46`).

Steps:

1. **Fetch the footways too:** add `footway`, `path`, `steps`, `cycleway` and
   `highway=pedestrian` areas to `fetch.mjs`'s `base` (or a new `paths` part), so the audit and
   task 013 have them.
2. **Write `tools/audit.mjs`:** for the track's box (`tracks/amigos.js`, `box`) and the
   shooter's area (decision 003), list every OSM street by class, its length, and whether the
   world tiles draw it (a line within 1 m of it), and the reverse: lines in the tiles that
   match no OSM street. Print a table by class and write the list to `.cache/audit.json`.
3. **Compare with the orthophoto** (task 005's source), by eye, in the shooter's area and
   along the route: streets, lanes and squares the photo shows but OSM lacks. List each one
   with its position in Notes. Missing streets get fixed **in OpenStreetMap itself**, by the
   owner or a friend with an OSM account (the map's licence lets anyone improve it), then
   fetched again; never only patched here.
4. **Show it** on the map page: a layer "Audit" with the streets coloured by whether the game
   draws them.

## Questions

- [ ] Does anyone have, or want, an OpenStreetMap account to fix missing streets at the source?
  Recommendation: yes. Fixes there also reach every map that uses OSM, and they survive each
  fetch.
  > 

## Read first

- `tools/fetch.mjs`, `tools/osm.mjs` (`KIND_OF`, `carriageway`), `tools/world.mjs` (lines),
  `tools/build.mjs` (the page's streets).
- `map/decisions.json`: the 65% cut.

## Done when

- [ ] `node tools/audit.mjs` prints, per class, the OSM streets in the track's box and the
  shooter's area and how many the world draws, and the lines that match none.
- [ ] Footways, steps, paths and cycleways are in `.cache/osm/`.
- [ ] The owner has the answer for the friends: which streets, if any, are missing, and why.

## Out of scope

- Drawing pavements, footpaths and steps in the game: task 013.
- Changing the map page's 65% cut: it was decided in draft 1.

## Notes
