---
status: done
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

1. **A new shared artifact, "Braga real",** separate from the map page, in Portuguese like the
   map page. The owner invites each rater by email as Editor, with no public link (a public link
   makes it read-only for all but the owner). It holds nothing private all the same: no
   waypoint, no house, nothing from the map page's database. Each rater is named by their
   claude.ai account, as the map page names who voted (`live.uid` and `who()` in
   `map/index.html`); nobody types a name. It shows:
   - each viewpoint as a pair, the real photo (with its author, licence and link) and the latest
     round's **High** shot, with a slider between them and the previous round's High shot one
     click away;
   - a rating from 1 ("não é Braga") to 5 ("juro que é real") per viewpoint and per rater, and a
     comment box ("o prédio da esquerda é amarelo, não branco"). The others' ratings for a
     viewpoint stay hidden until you've given yours, so nobody just follows the first; the
     comments show from the start;
   - a summary: each round's average per viewpoint, and per area (the route, the shooter's
     area, the skyline), so the trend shows.
2. **Rounds:** each round's High shots go up as the artifact's assets (the photos' licences
   allow it: task 005), with its label and the tasks it shows; the photos go up once. Write a
   small script, `tools/round.mjs`, that prepares a round from `shots/<round>/high/` (resized to
   960 px, JPEG/WebP) for the upload. The Low shots stay local, for the budget (task 004).
3. **From comments to tasks:** after each round, read the comments (`ArtifactData`), group
   them, and draft tasks for what's new (`/task draft`), naming the viewpoint.
4. **The baseline round** is the first, from task 002's baseline.

## Questions

- [x] Who rates? Recommendation: the owner and the friends who are on the track (the five
  neighbourhoods), with their first names as they appear on the shared map.
  > Anyone the owner gives the link to (2026-10-13), named by their claude.ai account.
  > Revised the same day, once the platform's rules were read: a public link leaves everyone but
  > the owner read-only (outside visitors hold `view`, and an outside Editor invited by email
  > loses writing while a public link is on). So each rater is invited by email as Editor, with
  > no public link, as the map page's friends are.
  > For now only the owner rates (2026-10-13). Friends can be invited later, by email as Editor;
  > the page needs no change for it.
- [x] Which shots go beside the photos, now that task 002 shoots High and Low? Recommendation:
  High, the best the game can look; Low is the budget's (task 004).
  > High.
- [x] Portuguese, like the map page, or English, like the repositories? Recommendation:
  Portuguese.
  > Portuguese.
- [x] When does a rater see the others' ratings? Recommendation: once they've rated that
  viewpoint, so nobody follows the first rating; the comments from the start.
  > After rating it.

## Read first

- `map/index.html`: how the shared map page did votes and comments.
- `docs/DECISIONS.md` 005.
- Tasks 001 and 002.

## Done when

- [x] The scorecard artifact is published, in Portuguese, and private to the owner until they
  share its link; it holds nothing private.
  > https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs, "readable by only you" when published.
  > Its files are the page, the two lists and 58 images, each looked at; no waypoint or house.
- [x] It shows the baseline round, with a photo and its High shot for every viewpoint.
  > 29 cards in the local render, and the owner rated all 29 in claude.ai.
- [x] A rating and a comment saved from the page in claude.ai are kept, and read back from the
  store. (Seen by a second rater under their name, and hidden from them until they've rated, is
  checked when the first friend is invited: the owner rates alone for now.)
  > `ArtifactData` read the owner's document back at version 35: 29 ratings, and at `lobato-east`
  > the comment "Edifícios e lugares de estacionamento" with its rating.
- [x] `tools/round.mjs` prepares a round from a `shots/` folder.
  > "2026-10-13-baseline: 29 shots (2353 kB) and 29 photos (3392 kB) in .cache\scorecard", the
  > files the artifact was published with, and the round in `refs/rounds.json`.

## Out of scope

- Fixing what the comments find: each becomes its own task.

## Notes

- From task 002 (2026-10-13): a round is `../party-kart/shots/<date>-<label>/`: `high/<id>.png`
  and `low/<id>.png`, each its photo's shape and 720 pixels high; `stats.json` (`round`, `made`,
  the party-kart commit as `game`, braga-map's version as `map`, the GPU, and each shot's cost
  under `shots.<quality>.<id>`); and `index.html`, a sheet of photo, shot and the round before's.
  The photos aren't copied into the round: they're `.cache/refs/<id>.jpg` here. The baseline is
  `2026-10-13-baseline`.
- Answered on 2026-10-13: anyone with the link rates, High shots, Portuguese, the others'
  ratings after your own. Who rates and the language may outlive the task: a DECISIONS.md entry
  when it's finished. Not verified: whether a link the owner shares lets its viewers save (the
  map page said "Só leitura" to a viewer without edit access), and how the runtime names someone
  who opens it from a link: read the `artifact-capabilities` skill before building it.
- **Built on 2026-10-13:** the artifact "Braga real", https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs
  (private to the owner until they share it), from `scorecard/index.html`, with the baseline round.
  - **The images are the page's own published files, not assets:** `photos/<id>.jpg`,
    `rounds/<round>/<id>.jpg`, and `data/viewpoints.json` and `data/rounds.json`, which the page
    fetches. The runtime warns that an asset may be refused to a viewer from outside the owner's
    organization (the friends are), while published files go with the page to whoever can open
    it. A version holds at most 511 files, so about 16 rounds of 29 before old rounds need
    thinning. A new round is a republish with its files added (`files` keeps what's already up).
  - **The database** holds only the marks: `scores/<their id>`, one document per person,
    `{ rounds: { <round>: { <viewpoint>: { s, c, at } } } }`, comments up to 400 characters.
    Rules: everyone reads `scores`, each writes only their own (`scores/{self}` at `interact`).
    Checked with `ArtifactData`: a document the owner wrote reads back at the `view` level, and an
    Editor's write to someone else's document is refused; the probe was deleted.
  - **Only the latest round is open:** older rounds show everything and can't be rated. In the
    open round a rater sees the others' marks for a place, and its line in the summary, once
    they've given theirs; an area's average once they've rated all its places. Everyone can read
    every score in the store, so this keeps people from following the first rating, nothing more.
  - `refs/viewpoints.json` gained `nome`, each viewpoint's name in Portuguese, for the page.
  - `tools/round.mjs` decodes the PNGs itself (zlib) and writes JPEGs with jpeg-js, already a
    dependency: no new one. The baseline: 29 shots (2.3 MB) and 29 photos (3.4 MB).
  - Rendered locally at 1280 and 400 pixels wide, light and dark: 29 cards, no sideways scroll,
    no errors. All 58 images looked at before publishing: nothing private in them (the few people
    in the photos have their faces blurred by Mapillary).
- **The owner rated the baseline** in claude.ai the same evening: all 29 places, saved as their
  one document (34 writes), read back with `ArtifactData`. Their average is 2.6 (from 1 to 4), no
  comments yet. So saving from the page works.
- **Not verified:** a rating seen by an invited friend (the third "Done when"), and whether the
  names of friends invited from outside resolve (`profiles`), or show "Alguém".
- **Noticed:** at `lobato-pavement` and `travessa-fujacal` the game's view and the photo share
  little; whether the viewpoint or the city is off is for the first round's comments.
- **Finished on 2026-10-13.** The owner rates alone for now; the baseline's one comment
  (`lobato-east`: buildings and parking spaces) is covered by tasks 011 (the buildings) and 020
  (parked cars; their bays are 018's): a note in each, no new task. The page changes nothing in
  the game, so no round to shoot and no budget to check. Decision 012 records how the scorecard
  works.
