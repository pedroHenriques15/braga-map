// What goes up on the scorecard when its rounds were made where it couldn't be published (task 064,
// tools/scorecard.mjs): the files the page lacks, in publishes inside their limits, and Claude's
// waiting marks added to its document without touching a round it has. Where .cache/scorecard/marks/
// has marks waiting, each is a whole round's. And a round goes up at the level it's judged at (task
// 127, tools/round.mjs).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import zlib from 'node:zlib';
import jpeg from 'jpeg-js';
import { CACHE } from '../tools/geo.mjs';
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

test('every round says the level its shots are, those before task 127 High', () => {
  for (const r of rounds) assert.ok(['ultra', 'high'].includes(r.level), `${r.id}: ${r.level}`);
  for (const r of rounds.filter((r) => r.made < '2026-10-25')) assert.equal(r.level, 'high', r.id);
});

// A PNG all one colour, 8-bit RGB, as Playwright saves a shot.
function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(rgb, y * (w * 3 + 1) + 1 + x * 3);
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]), out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(zlib.crc32(body), body.length + 4);
    return out;
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(w, 0);
  head.writeUInt32BE(h, 4);
  head[8] = 8;
  head[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const photos = viewpoints.every((v) => fs.existsSync(path.join(CACHE, 'refs', `${v.id}.jpg`)));
test("a round goes up at Ultra when it was shot at Ultra, else at High, or as --level says, and its entry says which (task 127)", { skip: !photos && 'no photos in .cache/refs (node tools/refs.mjs)' }, () => {
  // Two places shot red at Ultra, 1280 by 720, and blue at High, 960 by 720; prepared somewhere of its
  // own, the page's photos already there so they aren't made again.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'round-'));
  try {
    const places = viewpoints.slice(0, 2).map((v) => v.id);
    const shoot = (id, levels) => {
      fs.mkdirSync(path.join(tmp, 'shots', id), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'shots', id, 'stats.json'), JSON.stringify({ made: '2026-10-25T12:00:00.000Z', game: 'abc1234', map: '1.41.0' }));
      for (const [level, w, rgb] of levels) {
        fs.mkdirSync(path.join(tmp, 'shots', id, level));
        for (const v of places) fs.writeFileSync(path.join(tmp, 'shots', id, level, `${v}.png`), png(w, 720, rgb));
      }
    };
    const ULTRA = ['ultra', 1280, [200, 20, 20]], HIGH = ['high', 960, [20, 20, 200]];
    shoot('2026-10-25-ultra', [ULTRA, HIGH]);
    shoot('2026-10-25-high', [HIGH]);
    const out = path.join(tmp, 'scorecard'), log = path.join(tmp, 'rounds.json');
    if (fs.existsSync(path.join(OUT, 'photos'))) fs.cpSync(path.join(OUT, 'photos'), path.join(out, 'photos'), { recursive: true });
    const round = (id, ...more) => {
      execFileSync(process.execPath, ['tools/round.mjs', id, '--shots', path.join(tmp, 'shots'), '--out', out, '--log', log, '--label', 'T', ...more], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });
      return JSON.parse(fs.readFileSync(log, 'utf8')).rounds.find((r) => r.id === id);
    };
    // The colour in the middle of a place's piece of its sheet.
    const colour = (r, v) => {
      const [w, h, n, x, y] = r.shots[v], img = jpeg.decode(fs.readFileSync(path.join(out, 'rounds', `${r.id}-${n}.jpg`)));
      const k = ((y + (h >> 1)) * img.width + x + (w >> 1)) * 4;
      return img.data[k] > img.data[k + 2] ? 'red' : 'blue';
    };
    let r = round('2026-10-25-ultra');
    assert.equal(r.level, 'ultra');
    for (const v of places) assert.deepEqual([...r.shots[v].slice(0, 2), colour(r, v)], [960, 540, 'red']);
    r = round('2026-10-25-ultra', '--level', 'high');
    assert.equal(r.level, 'high');
    for (const v of places) assert.deepEqual([...r.shots[v].slice(0, 2), colour(r, v)], [960, 720, 'blue']);
    assert.equal(round('2026-10-25-ultra').level, 'high', 'prepared again, at the level it had');
    r = round('2026-10-25-high');
    assert.equal(r.level, 'high');
    for (const v of places) assert.deepEqual([...r.shots[v].slice(0, 2)], [960, 720]);
    assert.throws(() => round('2026-10-25-high', '--level', 'ultra'), /no ultra shots/);
    assert.throws(() => round('2026-10-25-high', '--level', 'low'), /one of ultra, high/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
