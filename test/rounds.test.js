// The rounds on the scorecard "Braga real" (refs/rounds.json, tools/round.mjs, task 062): each
// round's shots in a few sheets, each shot inside its sheet on the JPEG's 8-pixel blocks with its
// own edge round it, none over another, and a shot the same as an earlier round's pointing at a
// round that has it. Where .cache/scorecard/ is there, the sheets are, at the sizes recorded.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { CACHE } from '../tools/geo.mjs';

const { rounds } = JSON.parse(fs.readFileSync(new URL('../refs/rounds.json', import.meta.url), 'utf8'));
// The viewpoints, and those dropped since (task 052), which stay places of the rounds that shot them.
const { viewpoints: current, dropped = [] } = JSON.parse(fs.readFileSync(new URL('../refs/viewpoints.json', import.meta.url), 'utf8'));
const viewpoints = [...current, ...dropped];
const OUT = path.join(CACHE, 'scorecard');
const up8 = (n) => Math.ceil(n / 8) * 8;

test("each round's shots are in at most 4 sheets of at most 9, each on its blocks and none over another", () => {
  const ids = new Set(viewpoints.map((v) => v.id));
  for (const r of rounds) {
    assert.ok(Array.isArray(r.sheets) && r.sheets.length <= 4, `${r.id}: ${r.sheets?.length} sheets`);
    const cells = r.sheets.map(() => []);
    for (const [v, e] of Object.entries(r.shots)) {
      assert.ok(ids.has(v), `${r.id}: ${v} isn't a viewpoint`);
      if (typeof e[2] === 'string') continue;
      const [w, h, n, x, y, hash] = e, [W, H] = r.sheets[n - 1] ?? [];
      assert.ok(W && H, `${r.id}/${v}: no sheet ${n}`);
      assert.match(hash, /^[0-9a-f]{12}$/, `${r.id}/${v}`);
      assert.ok(x % 8 === 0 && y % 8 === 0 && x >= 8 && y >= 8, `${r.id}/${v}: at ${x}, ${y}`);
      assert.ok(x + up8(w) + 8 <= W && y + up8(h) + 8 <= H, `${r.id}/${v}: off its sheet`);
      for (const c of cells[n - 1]) assert.ok(x + w + 8 <= c.x - 8 || c.x + c.w + 8 <= x - 8 || y + h + 8 <= c.y - 8 || c.y + c.h + 8 <= y - 8, `${r.id}/${v} over ${c.v}`);
      cells[n - 1].push({ v, x, y, w, h });
    }
    for (const c of cells) assert.ok(c.length >= 1 && c.length <= 9, `${r.id}: a sheet of ${c.length}`);
  }
});

test("a shot the same as an earlier round's names a round before it that has its own", () => {
  for (const [i, r] of rounds.entries()) {
    for (const [v, e] of Object.entries(r.shots)) {
      if (typeof e[2] !== 'string') continue;
      const j = rounds.findIndex((q) => q.id === e[2]);
      assert.ok(j >= 0 && j < i, `${r.id}/${v}: ${e[2]} isn't an earlier round`);
      const own = rounds[j].shots[v];
      assert.ok(own && typeof own[2] === 'number', `${r.id}/${v}: ${e[2]} has no shot of its own`);
      assert.deepEqual(own.slice(0, 2), e.slice(0, 2), `${r.id}/${v}`);
    }
  }
});

test('the page holds every round in at most 4 sheets each, with room for more', () => {
  const files = 1 + 2 + viewpoints.length + rounds.reduce((s, r) => s + r.sheets.length, 0);
  assert.ok(files + 4 * 20 <= 511, `${files} files: not room for 20 more rounds`);
});

test("the sheets are in .cache/scorecard/ at their sizes, and no round's shots a file each", { skip: !fs.existsSync(path.join(OUT, 'rounds')) && 'no .cache/scorecard/' }, () => {
  for (const r of rounds) {
    assert.ok(!fs.existsSync(path.join(OUT, 'rounds', r.id)), `${r.id}: still a file a shot`);
    r.sheets.forEach(([W, H], k) => {
      const b = fs.readFileSync(path.join(OUT, 'rounds', `${r.id}-${k + 1}.jpg`));
      let size = null;
      for (let i = 2; i + 9 < b.length && !size; ) {
        if (b[i] !== 0xff) i++;
        else if (b[i + 1] >= 0xc0 && b[i + 1] <= 0xc3) size = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        else i += 2 + b.readUInt16BE(i + 2);
      }
      assert.deepEqual(size, [W, H], `${r.id}-${k + 1}.jpg`);
    });
  }
});
