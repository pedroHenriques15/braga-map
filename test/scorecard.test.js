// What goes up on the scorecard when its rounds were made where it couldn't be published (task 064,
// tools/scorecard.mjs): the files the page lacks, in publishes inside their limits, and Claude's
// waiting marks added to its document without touching a round it has. Where .cache/scorecard/marks/
// has marks waiting, each is a whole round's.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { LIMITS, OUT, listed, merge, needed, plan } from '../tools/scorecard.mjs';

const { rounds } = JSON.parse(fs.readFileSync(new URL('../refs/rounds.json', import.meta.url), 'utf8'));
const { viewpoints, dropped = [] } = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8'));
const places = [...viewpoints, ...dropped];

test('the page needs the lists, every photo and every sheet, each once', () => {
  const need = needed(rounds, places);
  assert.equal(new Set(need).size, need.length);
  assert.equal(need.length, 2 + places.length + rounds.reduce((s, r) => s + r.sheets.length, 0));
  assert.throws(() => needed([{ id: 'r', shots: {} }], []), /no sheets/);
});

test("a listing's paths are read whatever its layout, and nothing else", () => {
  const text = '- index.html\n- data/rounds.json (40 kB)\n  "photos/sameiro.jpg", rounds/2026-10-13-baseline-1.jpg;\nrounds/2026-10-13-baseline-1.jpg';
  assert.deepEqual(listed(text), ['data/rounds.json', 'photos/sameiro.jpg', 'rounds/2026-10-13-baseline-1.jpg']);
});

test('what the page lacks goes up, the lists always, and what it no longer needs comes off first', () => {
  const need = ['data/rounds.json', 'data/viewpoints.json', 'photos/a.jpg', 'rounds/r1-1.jpg', 'rounds/r2-1.jpg'];
  const up = ['data/rounds.json', 'data/viewpoints.json', 'photos/a.jpg', 'rounds/r1-1.jpg', 'rounds/r1/a.jpg'];
  const p = plan(need, up, () => 1000);
  assert.deepEqual(p.add, ['data/rounds.json', 'data/viewpoints.json', 'rounds/r2-1.jpg']);
  assert.deepEqual(p.remove, ['rounds/r1/a.jpg']);
  assert.equal(p.total, 5);
  assert.deepEqual(p.parts, [{ 'rounds/r1/a.jpg': null, 'data/rounds.json': 'data/rounds.json', 'data/viewpoints.json': 'data/viewpoints.json', 'rounds/r2-1.jpg': 'rounds/r2-1.jpg' }]);
});

test('a publish stays inside its limits, and a version never holds more than it can', () => {
  const many = Array.from({ length: 300 }, (_, i) => `rounds/r${i}-1.jpg`);
  const p = plan(many, [], () => 1000);
  assert.deepEqual(p.parts.map((x) => Object.keys(x).length), [LIMITS.files, 300 - LIMITS.files]);
  const big = plan(['rounds/a-1.jpg', 'rounds/b-1.jpg', 'rounds/c-1.jpg'], [], () => 25 * 1024 * 1024);
  assert.deepEqual(big.parts.map((x) => Object.keys(x)), [['rounds/a-1.jpg', 'rounds/b-1.jpg'], ['rounds/c-1.jpg']]);
  assert.throws(() => plan(Array.from({ length: 512 }, (_, i) => `photos/${i}.jpg`), [], () => 1), /more than a version holds/);
});

const round = { id: '2026-10-19-r', made: '1970-01-01T00:00:00.000Z', shots: { a: [960, 540, 1, 8, 8, 'x'], b: [960, 540, 'earlier'] } };
const mark = (s, c = '(Claude) Certo.') => ({ s, c, at: 1 });

test("the waiting marks are added to Claude's document, and a round it has is left as it is", () => {
  const doc = { rounds: { old: { a: mark(2) } } };
  const { doc: next, added, kept } = merge(doc, { [round.id]: { a: mark(3), b: mark(4) }, old: { a: mark(5) } }, [round, { id: 'old', shots: { a: [] } }]);
  assert.deepEqual(added, [round.id]);
  assert.deepEqual(kept, ['old']);
  assert.deepEqual(next.rounds.old, { a: mark(2) });
  assert.deepEqual(next.rounds[round.id], { a: mark(3), b: mark(4) });
  assert.deepEqual(doc.rounds, { old: { a: mark(2) } }, 'the document read is not changed');
});

test('marks for a whole round of the page, each a whole 1 to 5 and signed', () => {
  const add = (marks, r = round) => merge({ rounds: {} }, { [r.id]: marks }, [round]);
  assert.throws(() => add({ a: mark(3) }), /no mark for b/);
  assert.throws(() => add({ a: mark(3), b: mark(3), c: mark(3) }), /not shot: c/);
  assert.throws(() => add({ a: mark(3) }, { id: 'nope' }), /not a round/);
  assert.throws(() => add({ a: mark(0), b: mark(3) }), /mark 0/);
  assert.throws(() => add({ a: mark(3.5), b: mark(3) }), /mark 3.5/);
  assert.throws(() => add({ a: mark(3, 'Certo.'), b: mark(3) }), /signs/);
  assert.throws(() => add({ a: mark(3, '(Claude) ' + 'x'.repeat(400)), b: mark(3) }), /signs/);
  const again = { ...round, made: '2026-10-19T12:00:00.000Z' };
  assert.throws(() => merge({ rounds: {} }, { [round.id]: { a: mark(3), b: mark(3) } }, [again]), /marked before the round was shot/);
});

const waiting = path.join(OUT, 'marks');
test('the marks waiting in .cache/scorecard/marks/ are whole rounds', { skip: !fs.existsSync(waiting) && 'no marks waiting' }, () => {
  const files = fs.readdirSync(waiting).filter((f) => /^\d{4}-\d\d-\d\d-.+\.json$/.test(f));
  const marks = Object.fromEntries(files.map((f) => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(waiting, f), 'utf8'))]));
  // A round still on its task's branch isn't in main's refs/rounds.json yet.
  const known = Object.fromEntries(Object.entries(marks).filter(([id]) => rounds.some((r) => r.id === id)));
  assert.deepEqual(merge({ rounds: {} }, known, rounds).added.sort(), Object.keys(known).sort());
});
