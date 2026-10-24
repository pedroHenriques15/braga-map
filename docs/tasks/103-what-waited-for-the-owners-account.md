---
status: blocked
priority: medium
kind: owner
repo: both
created: 2026-10-24
depends-on: []
roadmap: Phase 1 · See it: references, the scorecard and the budget
---

# 103 · What waited for the owner's account

## Why

On 2026-10-24 Claude Code on the owner's machine is signed in to an account that can't reach the
owner's claude.ai artifacts: an Artifact `read` of the scorecard "Braga real"
(https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs) gives "artifact not found", and the same goes for
the shared map page and the before-and-after pages. The owner's answer: the tasks go on without
them, as task 064 did, and nothing new is published from this account. What each task would have
put up waits here, so it all goes up in one pass once the owner's account is back.

## What

Each row of the first table is something a task left for the owner's account: a round for the
scorecard, Claude's marks, a page to update, comments to read, a file. Each says the commit it was
made at, so it goes up on the build it was made on (task 064's step 2).

Once Claude Code is signed in to the account that owns the pages (`/login`):

1. Stop unless an Artifact `read` of the scorecard's URL works.
2. **The rounds and Claude's marks:** task 064's steps 2 to 7, in order (`docs/tasks/done/064-*.md`):
   each round on the build after the one before it, the lists from main (`node tools/round.mjs
   --pack`), every `scores/*` read first, the files (`node tools/scorecard.mjs files <listing>`,
   each part published), and Claude's marks (`node tools/scorecard.mjs marks <claude.json>`, set
   over `scores/claude` pinned to the version read). Never write anyone else's document.
3. **The map page:** published from `map/index.html` with `map/braga.json` and `map/tracks.json`
   beside it, as the README's "The map page" says, after `npm run page` on main.
4. **The rest of the table,** row by row: each one done is ticked in the table with the date.
5. **The versions:** each braga-map version in the second table tagged (or left, as the owner
   says), and party-kart pinned to the last.

## Waiting for the owner's account

| Task | What waits | Made at |
|---|---|---|
| 082 | A round for the scorecard: its shots are made (party-kart's `shots/2026-10-23-task082/`, all 33 places at High and Low on 1.33.0, and `shots/2026-10-23-task082b/`, four places on 1.33.1's setts), but it isn't prepared (`node tools/round.mjs`), isn't in `refs/rounds.json` and has no Claude's marks. Then the owner's marks | braga-map `83fd58d` (1.33.1), party-kart `2dfa05d` |
| (none) | A page to update: the shared map page (https://claude.ai/artifact/UdwdhZYkR76J5xyPcRUHUb) was last republished by task 050 (`a694087`, 2026-10-15). `map/` has changed since in `d21b044` (026), `b846a05` and `d1cf52d` (014), `4bdb77a` (067, 072) and `a01bb67` (079), and no task records that it went up again | braga-map `a01bb67` (the last change to `map/`) |

## braga-map versions bumped and not tagged

| Version | Task | Commit | party-kart |
|---|---|---|---|
| 1.34.0 | 100 | `6248f21` | on v1.33.1 |

## Decided by the session, for the owner to confirm

Questions that came up while the owner wasn't asked, decided by the session and recorded in the
task's Notes as "decided by the session, for the owner to confirm".

| Task | The question | What the session decided | Commit |
|---|---|---|---|

## Progress

Where the work on every open task stands (the owner's two phases, 2026-10-24), so a session that
picks it up can go on from here.

- **Phase 1, the questions:** asked on 2026-10-24.
- **Phase 2, the work:** not started.

## Read first

- `docs/tasks/done/064-the-waiting-rounds-go-up.md`: how the rounds went up the last time.
- `tools/round.mjs`, `tools/scorecard.mjs`, `test/scorecard.test.js`.
- The README's "The map page" and "The scorecard"; decision 012.

## Done when

- [ ] Every row of the first table is up, and ticked with the date.
- [ ] Every version in the second table is tagged, or the owner said to leave it, and party-kart is
  pinned to the last.
- [ ] The owner has confirmed or changed each decision in the third table, and each task's Notes
  say which.

## Notes

- Drafted 2026-10-24 at the owner's request, before the questions of the two phases. Checked that
  day: an Artifact `read` of the scorecard's URL from this session answers "artifact not found".
- Nothing private here: no house, no address, nothing from `.cache/places.json`.
