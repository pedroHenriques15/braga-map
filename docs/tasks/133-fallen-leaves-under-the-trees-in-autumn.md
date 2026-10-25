---
status: todo
priority: low
kind: code
repo: party-kart
created: 2026-10-25
depends-on: [093]
roadmap: Ultra · Braga at its most real
---

# 133 · On Ultra, fallen leaves under the deciduous trees in autumn

## Why

Task 093 gives Ultra's trees their year by the date: on `?time=` in November the avenues' planes and
hackberries turn and drop their leaves. But the ground under them stays as it is all year, where
Braga's pavements, lawns and gutters in autumn are strewn with them: `sao-joao-da-ponte`'s photo has
brown leaves scattered over the calçada and the cycle lane under the park's trees. 093's What 3 asked
for them and wasn't made there (its Notes: left for a task of its own).

## What

1. On Ultra only (as 093: High, Medium and Low unchanged), under each deciduous tree whose leaves are
   falling or fallen by 093's year (party-kart's `src/render/season.ts`), fallen leaves on the ground
   round it: thicker under the crown and downhill, thinning out; on pavements, lawns and in the
   gutters along the kerb, not on the carriageway's wheel tracks; in each kind's autumn colour, going
   brown as the weeks pass, and gone by the time the trees are bare in winter (the streets are swept).
2. Cheap: a decal or a tint of the ground's own drawing, not a mesh per leaf; its cost in party-kart's
   budget ("Ultra's seasons").
3. Shoot at Ultra on a day in November where the avenues' trees stand (`31-de-janeiro`, `liberdade`,
   `sao-joao-da-ponte`, `capela-sao-joao`), beside reference photos of that season.

## Read first

- party-kart's `src/render/season.ts` and `src/render/trees.ts` (093), the ground's drawing
  (`src/world/ground.ts`, `src/render/streets.ts`); task 093's Notes (its year table, its reference
  photos); decision 081.

## Done when

- [ ] On Ultra in November the ground under the avenues' and the parks' deciduous trees is strewn with
  their fallen leaves, beside reference photos of that season; none in March or June.
- [ ] High, Medium and Low unchanged; rated no lower.
- [ ] party-kart's tests (four at a time) and `npm run check` pass; the cost in its budget.

## Notes

- Found by worker-1 in task 093 (2026-10-25; 093's What 3), drafted by the coordinator. The other
  half of that step, the lawns' green by the month, waits for task 068 (March's lawns), as 093's
  Notes say.
