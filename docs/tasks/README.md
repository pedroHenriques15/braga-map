# Tasks

One file per piece of work, the system Beacon, homelab and homeSearch use, adapted for the map
of Braga and for its one goal: **Braga as close to real life as possible**, in every game made
on it.

- **The files are committed,** and are written to be public: braga-map is a package for games,
  and party-kart, its first game, is public. No friend's house, address or anything from
  `.cache/places.json` ever goes in a task. A house is "the second house" or "a waypoint", never
  a street and number.
- **One roadmap, two repositories.** The map's data and tools are here; the 3D city is drawn by
  each game (today `../party-kart/src/render/`). A task says which in `repo:`. Work in
  party-kart follows its own `CLAUDE.md` and runs its tests (`npm test`, `npm run check`).
- **No branches.** Commits go straight to `main`, and only when the owner asks.
- **Questions.** A task that needs the owner's input says so in "Questions", and stays
  `blocked` until they're answered.

[ROADMAP.md](../ROADMAP.md) says what's planned and in what order; a task holds the detail of
one item. [DECISIONS.md](../DECISIONS.md) says why things are as they are.

## Files

- `NNN-work-name.md`: a three-digit number and a kebab-case work name, for example
  `001-viewpoints.md`.
- The next number is one more than the highest in this folder and in `done/`. Numbers are
  never reused.
- `done/` holds finished (`done`) and abandoned (`dropped`) tasks.

## Lifecycle

`todo` → `doing` → `done`. Also `blocked` (Notes say on what) and `dropped` (Notes say why).

| Step | Command | What happens |
|---|---|---|
| List | `/task` | Open tasks by priority, which are blocked on questions, and which is next |
| Draft | `/task draft <the work>` | The file is written from the template, `status: todo`, or `blocked` if it has questions |
| Answer | `/task answer NNN` | Walks through the open questions with the owner and records the answers in the file |
| Start | `/task start NNN` | `status: doing`; the work is done, staying out of "Out of scope" |
| Finish | `/task finish NNN` | "Done when" is checked, the tests run and the viewpoints are shot again. The docs and ROADMAP.md are updated; then `status: done`, and the file moves to `done/` |
| Drop | `/task drop NNN <reason>` | `status: dropped`, the reason in Notes, the file moves to `done/` |

The owner can also answer in the file directly: write the answer under the question and tick
its box.

## Priority

`critical` (something is wrong in what's shipped, or a friend's house is exposed: do it next),
`high`, `medium`, `low`.

## Kinds

`kind:` says what the work is:

- `code`: the scripts, the data they make, the library, a game's renderer, and their docs.
- `research`: an answer, recorded in the task's Notes, a reference file or a DECISIONS.md
  entry; no code.
- `owner`: something only the owner and their friends can do: take photos, walk a street,
  rate the scorecard, answer what a place really looks like. The task says exactly what to do.

## How realism is checked

Every task that changes what a game shows names, in "Done when", the **viewpoints** it should
improve (task 001's `refs/viewpoints.json`). Finishing it means shooting those viewpoints again
(task 002) and posting them as a new round on the scorecard, "Braga real" (task 003, decision
012), for the owner, and the friends they invite, to rate. A task that makes a viewpoint look less like Braga isn't done.

Every task that adds geometry or textures also checks the budget (task 004): the frame rate,
draw calls, triangles and download size, on High and on Low.

## Template

```markdown
---
status: todo
priority: medium
kind: code
repo: braga-map
created: YYYY-MM-DD
depends-on: []
roadmap: the ROADMAP.md phase this belongs to
---

# NNN · Title in plain words

## Why

What is wrong or missing today, and why it matters for looking like Braga. Two to four
sentences.

## What

The state of things today, then numbered steps. Written so a session with no other context
can do the task. Stop and report when an assumption here turns out false.

## Questions

- [ ] A question only the owner can answer, with the options and a recommendation.
  > The owner's answer goes here.

## Read first

- `path/to/file`: why it matters for this task.

## Done when

- [ ] An observable outcome, checkable by a test, a command or a viewpoint.

## Out of scope

- Related work this task must not do, naming the task that does it, if any.

## Notes

Decisions made along the way, blockers, and what was not verified.
```

Leave out "Questions" when there are none.
