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
5. **The decisions:** each row of the third table confirmed or changed by the owner, and the task's
   Notes saying which.

## Waiting for the owner's account

| Task | What waits | Made at |
|---|---|---|
| 082 | A round for the scorecard: its shots are made (party-kart's `shots/2026-10-23-task082/`, all 33 places at High and Low on 1.33.0, and `shots/2026-10-23-task082b/`, four places on 1.33.1's setts), but it isn't prepared (`node tools/round.mjs`), isn't in `refs/rounds.json` and has no Claude's marks. Then the owner's marks | braga-map `83fd58d` (1.33.1), party-kart `2dfa05d` |
| (none) | A page to update: the shared map page (https://claude.ai/artifact/UdwdhZYkR76J5xyPcRUHUb) was last republished by task 050 (`a694087`, 2026-10-15). `map/` has changed since in `d21b044` (026), `b846a05` and `d1cf52d` (014), `4bdb77a` (067, 072) and `a01bb67` (079), and no task records that it went up again | braga-map `a01bb67` (the last change to `map/`) |

## braga-map versions bumped and not tagged

None: the owner lets the sessions tag (2026-10-24). 1.34.0 (task 100, `6248f21`) was tagged that
day; party-kart is pinned to the latest tag by the first task of Phase 2 that touches it.

## Decided by the session, for the owner to confirm

Questions that came up while the owner wasn't asked, decided by the session and recorded in the
task's Notes as "decided by the session, for the owner to confirm".

| Task | The question | What the session decided | Commit |
|---|---|---|---|
| (the run) | Who marks the rounds, now that Claude's marks are the judge, with four sessions? | The coordinator alone, so every round is on one scale; the workers shoot and send it the places that changed | this file's |
| (the run) | Claude's marks for each place in the last rounds aren't kept locally (task 064 removed them once they went up, and the scorecard is out of reach): what is "no lower" measured against? | A new baseline of Claude's marks, every place marked again on main before the first task that changes a viewpoint lands; each round after is marked against the one before it | this file's |
| (the run) | ROADMAP's "in party-kart, never two sessions on the same file", with three workers | Allowed in different functions of a file only, the one landing second rebasing and keeping both; the coordinator says which files each task has claimed | this file's |

## Progress

Where the work on every open task stands (the owner's two phases, 2026-10-24), so a session that
picks it up can go on from here.

- **Phase 1, the questions:** done on 2026-10-24. Every open task's questions answered in its
  file; the owner's general answers:
  - **Tags:** the session tags each braga-map version and pins party-kart to it.
  - **Deploy:** once, at the end, from a clean main, checked live (party-kart's
    `docs/releasing.md`). Not after each task.
  - **Commits:** after each task, `git pull --rebase`, commit and push to main, in each repository it
    touched; a worktree's branch merged into main, then the worktree removed (its `.cache` junction
    first, with `rmdir`, never a recursive delete).
  - **Order:** the `/task` order (priority, then `depends-on`), the owner's new improvements first
    (105 to 110, before 081).
  - **A premise that proves false:** recorded in the task's Notes and here, the part that still holds
    done; dropped with the reason only if none does.
  - **Two at a time:** at most one task that rebuilds braga-map's world, beside one that doesn't touch
    the same files (a party-kart-only task, say), each in a worktree of its own (ROADMAP's "Two
    sessions at once").
  - **Not done in this run (held, `blocked`):** 099 (the whole map at the open world's detail), 097
    (the railway, all outside the playable area) and 098 (the old town's landmarks, all outside it).
    What of 098 is inside the playable area is task 104, done.
  - **Never asked again in Phase 2:** a new question is decided by the session, written in the task's
    Notes as "decided by the session, for the owner to confirm", and added to the table above.
  - **Claude's marks are the judge** (the owner, 2026-10-24): a task's "rated no lower" is decided on
    Claude's marks, not by waiting for the owner's; they still go up with the rounds when the account
    is back.
  - **Four sessions** (the owner, 2026-10-24): three workers (worker-1 to worker-3), each doing whole
    tasks in worktrees of its own, coordinated by the session "Braga-map and party-kart open tasks",
    which assigns the tasks, grants the one merge turn, marks every round and keeps this file. The
    workers' rules and the live board are outside git, in `C:\Users\pedro\source\repos\_coord\`
    (`worker-brief.md`, `board.md`); what lands is recorded here.
- **Phase 2, the work:** not started. The order, each after its `depends-on`:
  1. 105 smaller karts, 106 the full map on M, 107 the GPS, 108 "Ir para aqui", 109 find a place,
     110 meet the others.
  2. 081 Ultra, then 102 the credits.
  3. The medium ones: 044 pavements level, then 051 steps, then 076 the land at the steps; 041 squares
     and 059 the island's pavement alongside; 066 the tilt; 018 markings after 044, then 020
     furniture; 085 textures, 086 doors and windows, 087 roofs, 088 species, 090 the light; 038
     streaming, then 083 the 50 cm ground (038 is low but 083 needs it).
  4. The low ones: 084, 065, 068, 089, 091 (after 090), 092 (after 090 and 020), 093 (after 088), 094
     (after 020), 095 (after 086), 096, 101 (after 094), 104.
  5. 053 last.

  Each task's line here gets its commit, version and what's left once it lands.

## Read first

- `docs/tasks/done/064-the-waiting-rounds-go-up.md`: how the rounds went up the last time.
- `tools/round.mjs`, `tools/scorecard.mjs`, `test/scorecard.test.js`.
- The README's "The map page" and "The scorecard"; decision 012.

## Done when

- [ ] Every row of the first table is up, and ticked with the date.
- [ ] The owner has confirmed or changed each decision in the third table, and each task's Notes
  say which.

## Notes

- Drafted 2026-10-24 at the owner's request, before the questions of the two phases. Checked that
  day: an Artifact `read` of the scorecard's URL from this session answers "artifact not found".
- Nothing private here: no house, no address, nothing from `.cache/places.json`.
