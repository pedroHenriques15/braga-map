---
name: task
description: List, draft, answer, start, finish or drop a braga-map task file in docs/tasks/. Use for "/task", "/task draft <the work>", "/task answer 002", "/task start 001", "/task finish 001", "/task drop 001 <reason>", or whenever the owner wants to plan, pick up, unblock or close a piece of work on making the map, or a game's city, look like the real Braga.
---

# Tasks

Task files live in `docs/tasks/` and are committed. The template, statuses, priorities, kinds,
numbering and how realism is checked are in `docs/tasks/README.md`; the plan they come from is
`docs/ROADMAP.md`, and the reasons behind it are in `docs/DECISIONS.md`. Commit or push only
when the owner asks.

Two rules hold in every mode:

- **Nothing private in a task.** No friend's house, address, or anything read from
  `.cache/places.json`. A house is "the second house" or "a waypoint".
- **Each task names its repository** in `repo:`. Work in `../party-kart` follows that repo's
  `CLAUDE.md`. Another session may be working there or here: run `git status` first, and never
  overwrite or revert changes you didn't make.

The first word of the arguments picks the mode.

## (no mode): list

List the open tasks from `docs/tasks/` as a table: number, title, status, priority, kind, repo,
and the number of open questions. Then say which task is next: the highest priority that isn't
blocked and whose `depends-on` are done. Name the blocked tasks whose questions the owner could
answer now, and suggest `/task answer NNN` for the most useful one.

## draft <the work>

1. Read the code and docs the work touches first, in both repositories if it spans them, so
   every path in the task is real.
2. One purpose per task. When the work has several, draft several tasks and record what depends
   on what in `depends-on`.
3. Number: one more than the highest in `docs/tasks/` and `docs/tasks/done/`.
4. Write `docs/tasks/NNN-work-name.md` from the template. "What" must stand on its own: a
   session with no other context should be able to do the task from it. Name the viewpoints
   it should improve in "Done when".
5. Anything only the owner can decide goes in "Questions", each with the options and a
   recommendation. Ask the important ones in the chat first (AskUserQuestion) and record the
   answers; leave the rest in the file. With open questions that block the work, set
   `status: blocked` and say so in Notes.
6. Add the task under its phase in `docs/ROADMAP.md` if it isn't there.
7. Reply with a summary of each task, its open questions, and what you did not verify.
   Do not start the work.

## answer NNN

1. Read the task. Ask its open questions with AskUserQuestion, up to four at a time, offering
   the options in the file and leading with the recommendation.
2. Write each answer under its question as a `>` line and tick its box. Revise "What" and
   "Done when" to match. When no blocking question is left, set `status: todo`.
3. A decision that will outlive the task becomes a new entry in `docs/DECISIONS.md` when the
   task is finished.

## start NNN

1. Read the task and its "Read first" list. Stop if `depends-on` names a task that isn't done,
   or if a question is still open.
2. Set `status: doing`. Do the work, staying out of "Out of scope", and stop and report when an
   assumption in the task turns out false.
3. Data from a new source keeps its licence: check it allows what the task does with it, and
   add its credit where the README keeps credits.
4. Run the tests before saying the work is done: `npm test` here; `npm test` and
   `npm run check` in party-kart when the task touches it.
5. Work found along the way that the task does not cover becomes a new drafted task.

## finish NNN

1. Tick each "Done when" item that is true, citing the evidence (test, command output, a
   viewpoint's before and after, what the owner checked). Check what you can yourself before
   asking the owner. Stop and report any that isn't.
2. Shoot the task's viewpoints again (task 002's script) and, once the scorecard exists (task
   003), post them as a new round. Check the budget (task 004) when the task added geometry or
   textures.
3. Update the docs the work changed (`README.md`, `docs/*.md`, party-kart's docs when it touched
   party-kart), add a `docs/DECISIONS.md` entry for a lasting decision, and move or remove the
   item in `docs/ROADMAP.md`.
4. Set `status: done` and move the file to `docs/tasks/done/`. Offer to commit.

## drop NNN <reason>

Set `status: dropped`, write the reason in Notes and move the file to `docs/tasks/done/`. Ask
whether its roadmap item should go too.
