---
status: todo
priority: high
kind: code
repo: braga-map
created: 2026-10-13
depends-on: [001, 002]
roadmap: Phase 1 · See it
---

# 003 · The scorecard: the friends rate how much each viewpoint looks like Braga

## Why

The owner and their friends are the judges of whether it looks like Braga (decision 005). The
map page already worked this way: the zones and landmarks were voted on and approved in a
shared artifact (`map/decisions.json`). A scorecard does the same for realism. It shows each
viewpoint's real photo beside the game, lets each friend rate it and say what's wrong, and
keeps every round, so progress is visible and their comments become tasks.

## What

Today the shared map page is the artifact at https://claude.ai/artifact/UdwdhZYkR76J5xyPcRUHUb.
Its database holds the places the friends added (private). The screenshots come from task 002,
in `../party-kart/shots/<round>/`.

1. **A new shared artifact, "Braga real",** separate from the map page. It holds no private
   places. It shows:
   - each viewpoint as a pair, the real photo and the latest round's shot, with a slider
     between them and the previous round's shot one click away;
   - a rating from 1 ("not Braga") to 5 ("I'd swear it's real") per viewpoint and per friend,
     and a comment box ("the building on the left is yellow, not white");
   - a summary: each round's average per viewpoint, and per area (the route, the shooter's
     area, the skyline), so the trend shows.
2. **Rounds:** each round's shots go up as the artifact's assets (the photos' licences allow
   it: task 005), with its label and the tasks it shows. Write a small script,
   `tools/round.mjs`, that prepares a round from `shots/<round>/` (resized to 960 px,
   JPEG/WebP) for the upload.
3. **From comments to tasks:** after each round, read the comments (`ArtifactData`), group
   them, and draft tasks for what's new (`/task draft`), naming the viewpoint.
4. **The baseline round** is the first, from task 002's baseline.

## Questions

- [ ] Who rates? Recommendation: the owner and the friends who are on the track (the five
  neighbourhoods), with their first names as they appear on the shared map.
  > 

## Read first

- `map/index.html`: how the shared map page did votes and comments.
- `docs/DECISIONS.md` 005.
- Tasks 001 and 002.

## Done when

- [ ] The scorecard artifact is published and private to the owner, who shares it.
- [ ] It shows the baseline round, with a photo and a shot for every viewpoint.
- [ ] A rating and a comment saved by one viewer are seen by another.
- [ ] `tools/round.mjs` prepares a round from a `shots/` folder.

## Out of scope

- Fixing what the comments find: each becomes its own task.

## Notes
