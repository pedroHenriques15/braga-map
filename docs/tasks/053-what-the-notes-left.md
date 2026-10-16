---
status: todo
priority: medium
kind: research
repo: both
created: 2026-10-16
depends-on: [014, 016, 017, 018, 019, 020, 021, 022, 026, 041, 042, 044, 045, 046, 048, 049, 051, 052, 054]
roadmap: Phase 4 · Street furniture, landmarks and light (last)
---

# 053 · What every task's notes left to improve

## Why

Each task's Notes record what it left behind: what it didn't check or verify, what it left out and
why, what it noticed along the way, the thresholds and fallbacks it settled for, and the numbers it
measured against the city as it was then. A few became tasks ("Found along the way"); most stayed
in the file they were written in. Once every task on the roadmap is done, they're scattered over
fifty-odd files, some done since, some no longer true, some still true. One pass over all of them,
with the city as it is then, turns those still worth doing into work, so nothing is lost for
having been written down once.

## What

Today (2026-10-16): 52 task files, 33 in `docs/tasks/done/` and 19 open in `docs/tasks/`, about
80,000 words. Their Notes flag what they left in a few shapes: "Not checked" (12 times, in 11
files), "Not verified" (11, in 10), "Not done" (8), "Found along the way" (5), "Noticed" (3), "Not
yet" (2); and, unmarked, what's "left out" and why, the thresholds chosen, the fallbacks taken
(the map's value, else a kind's usual), and figures measured against an earlier state of the city
(the budget, the tiles' size, the audit's percentages). For example, from task 013 alone: the
houses' walls the LiDAR can't find where cars park against them (the Rua do Monte da Forca); the
walls under 6 m long it leaves out because parked cars look the same; the shooter's area's 165
facade photos not checked one by one against its walls and gates; a wall of the map's at
`robert-smith-picoto` measured 4.2 m high where the photo has about 2.5 m. And from task 050, one
that became a task: 51 of 236 flights of steps more than a kart's step over their foot (task 051).

Steps:

1. **Read every task file,** done and open, oldest first: its Notes, its Questions and answers,
   its "Done when" and the evidence written under each; and `docs/DECISIONS.md`, for what each
   decided and the alternatives it gave up. List every follow-up, with the task and the line it's
   in:
   - what wasn't checked or verified;
   - what was left undone or left out, and why;
   - what was noticed or found along the way and didn't become a task;
   - a compromise a later task may have made unnecessary (a threshold, a fallback, a guess, a
     workaround for data that's since better);
   - a figure measured against a state that has since changed (the budget in party-kart's
     `docs/architecture.md`, the README's "What's on it", a test's printed numbers).
2. **For each, find whether it still holds,** with the city as it is then: read the code and the
   data the note points at, in braga-map and in party-kart (`../party-kart`, which follows its own
   `CLAUDE.md`); run the script or the test it names; shoot the viewpoint it's about (party-kart's
   `node scripts/shots.mjs <label> <ids…>`); and look for a later task or decision that did it
   (grep `docs/tasks/done/` and `docs/DECISIONS.md` for its subject).
3. **Each one ends in one of three places** (the owner's answer):
   - done since, or no longer true: listed in Notes with what did it;
   - still true and worth doing: drafted as a task (`/task draft`, one purpose each), or, where an
     open task already covers it, added to that task's Notes;
   - still true but not worth doing, or only the owner can say: listed in Notes with why, and the
     owner's questions asked (AskUserQuestion) and recorded.
   No code, data or doc is changed by this task: what it finds is done by the tasks it drafts.
4. **The roadmap:** each drafted task under its phase in `docs/ROADMAP.md`.

## Questions

- [x] What does the review make of what it finds? Options: drafted tasks, the rest listed with
  why; one ranked list for the owner to pick from; small fixes made in it, the rest drafted.
  Recommendation: drafted tasks, the rest listed.
  > Drafted tasks (or a note in the open task that covers it), the rest listed with why; no code
  > changed (the owner, 2026-10-16).
- [x] "After all the others": which tasks does it wait for? Options: every task open today but 038;
  every task open today, 038 too; always the last, every task drafted after it too.
  Recommendation: every task open today but 038.
  > Every task open on 2026-10-16 but 038 (streaming the city, which waits for the area to grow,
  > maybe never) (the owner, 2026-10-16). A task drafted later goes before it only if it's added to
  > its `depends-on`.

## Read first

- `docs/tasks/README.md`: the template, the statuses, how realism is checked.
- `docs/ROADMAP.md` and `docs/DECISIONS.md`.
- Every file in `docs/tasks/done/` and `docs/tasks/`.
- braga-map's `README.md` and party-kart's `docs/architecture.md`, whose figures the tasks updated.

## Done when

- [ ] Every task file's Notes read, and each follow-up found listed in this task's Notes with
  where it ended: done since (by what), drafted (as which task), added to an open task (which),
  or left (why).
- [ ] Each task it drafted is in `docs/ROADMAP.md` under its phase, and the owner's questions on
  what to leave are asked and answered.

It changes nothing a game shows, so no viewpoint and no budget.

## Out of scope

- Doing what it finds: each task it drafts does its own.
- 038 (streaming the city), and tasks drafted after this one but those added to its `depends-on`.
- Rewriting the task files: their Notes stay as they were written; what's found goes here.

## Notes

- Drafted 2026-10-16 at the owner's request, after task 013 went live; both questions answered.
- Not verified: the counts are of those phrases alone; many follow-ups aren't marked with any of
  them, so the list will be longer.
