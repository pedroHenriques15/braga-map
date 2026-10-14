// tools/roofs.mjs's measuring, on roofs made up here as the LiDAR would see them: points every
// 50 cm with 3 cm of noise, the roof running 40 cm past the walls.
import assert from 'node:assert/strict';
import test from 'node:test';
import { measure } from '../tools/roofs.mjs';

const G = 200; // the ground, above the sea
const T30 = Math.tan(Math.PI / 6);
let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.06;
// A roof `roof(x, z)` over a footprint, as measure() reads it: NaN off the roof.
const seen = (roof) => ({
  top: (x, z) => { const h = roof(x, z); return h === h ? h + noise() : NaN; },
  ground: () => G,
  colour: () => [190, 95, 70],
});
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const inBox = (x, z, x0, z0, x1, z1, o = 0.4) => x > x0 - o && x < x1 + o && z > z0 - o && z < z1 + o;
const near = (a, b, d, what) => assert.ok(Math.abs(a - b) <= d, `${what}: ${a.toFixed(2)}, expected ${b} ± ${d}`);
// The way a ridge runs, as an angle, folded onto 0–180°.
const axis = (dir) => (((dir * 180) / Math.PI) % 180 + 180) % 180;

test('a gabled house: 12 × 8 m, 30°, its eaves 6 m up', () => {
  const m = measure(rect(0, 0, 12, 8), seen((x, z) => (inBox(x, z, 0, 0, 12, 8) ? G + 6 + (4 - Math.abs(z - 4)) * T30 : NaN)));
  assert.equal(m.parts.length, 1);
  const [p] = m.parts;
  assert.equal(p.roof, 'gabled');
  near(p.pitch, 30, 3, 'pitch');
  near(p.ridge - G, 6 + 4 * T30, 0.3, 'ridge');
  near(p.eaves - G, 6, 0.4, 'eaves');
  near(Math.min(axis(p.dir), 180 - axis(p.dir)), 0, 2, 'ridge along x');
  assert.deepEqual(p.colour, [190, 95, 70]);
});

test('a hipped house, and half a semi-detached pair (hipped at one end)', () => {
  const hipped = (x0, x1, open) => (x, z) => {
    if (!inBox(x, z, 0, 0, 14, 9)) return NaN;
    const across = 4.5 - Math.abs(z - 4.5), lo = x - x0 + 0.4, hi = x1 - x + 0.4;
    return G + 7 + Math.min(across, open === 'hi' ? Infinity : hi, open === 'lo' ? Infinity : lo) * T30;
  };
  const whole = measure(rect(0, 0, 14, 9), seen(hipped(0, 14)));
  assert.equal(whole.parts[0].roof, 'hipped');
  assert.equal(whole.parts[0].ends, 3);
  near(whole.parts[0].eaves - G, 7, 0.4, 'eaves');
  // Its neighbour carries the roof on past x = 14: this house's ridge runs out to that side.
  const half = measure(rect(0, 0, 14, 9), seen(hipped(0, 14, 'hi')));
  const [p] = half.parts;
  assert.equal(p.roof, 'hipped');
  const towardHigh = Math.cos(p.dir) > 0; // the ridge runs from end 1 to end 2 the way dir points
  assert.equal(p.ends, towardHigh ? 1 : 2, 'hipped only at the x = 0 end');
});

test('a block with a tower on it is two parts, each its own height', () => {
  const m = measure(rect(0, 0, 40, 14), seen((x, z) => (inBox(x, z, 0, 0, 40, 14, 0) ? G + (x > 28 ? 21 : 9.5) : NaN)));
  assert.equal(m.parts.length, 2);
  const [lo, hi] = [...m.parts].sort((a, b) => a.eaves - b.eaves);
  for (const p of m.parts) assert.equal(p.roof, 'flat');
  near(lo.eaves - G, 9.5, 0.2, 'the block');
  near(hi.eaves - G, 21, 0.2, 'the tower');
  near(Math.min(...hi.pts.map((q) => q[0])), 28, 0.6, "the tower's side");
});

test('an L-shaped house with a gabled roof on each arm is two rectangles', () => {
  // Arms 6 m wide: one along x (z 0–6, x 0–16), one along z (x 10–16, z 0–14).
  const L = [[0, 0], [16, 0], [16, 14], [10, 14], [10, 6], [0, 6]];
  const m = measure(L, seen((x, z) => {
    const a = inBox(x, z, 0, 0, 16, 6) ? 3 - Math.abs(z - 3) : -Infinity, b = inBox(x, z, 10, 0, 16, 14) ? 3 - Math.abs(x - 13) : -Infinity;
    const h = Math.max(a, b);
    return h > -1 ? G + 5 + h * T30 : NaN;
  }));
  assert.equal(m.parts.length, 2);
  for (const p of m.parts) {
    assert.notEqual(p.roof, 'flat');
    near(p.eaves - G, 5, 0.5, 'eaves');
  }
  const ridges = m.parts.map((p) => axis(p.dir)).sort((a, b) => a - b);
  near(Math.min(ridges[0], 180 - ridges[0]), 0, 3, 'one ridge along x');
  near(ridges[1], 90, 3, 'one along z');
});

test('a shed with one slope falls the way it faces', () => {
  const m = measure(rect(0, 0, 10, 6), seen((x, z) => (inBox(x, z, 0, 0, 10, 6) ? G + 3 + (6 - z) * Math.tan(Math.PI / 12) : NaN)));
  const [p] = m.parts;
  assert.equal(p.roof, 'skillion');
  near(p.pitch, 15, 3, 'pitch');
  near(Math.sin(p.dir), 1, 0.05, 'it slopes down to the south (+z)');
  near(p.eaves - G, 3, 0.4, 'eaves');
});
