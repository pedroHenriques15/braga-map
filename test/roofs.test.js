// tools/roofs.mjs's measuring, on roofs made up here as the LiDAR would see them: points every
// 50 cm with 3 cm of noise, the roof running 40 cm past the walls.
import assert from 'node:assert/strict';
import test from 'node:test';
import { canopyOf, measure, topShape } from '../tools/roofs.mjs';

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

// A "building" the LiDAR sees on a car park, under 4.6 m (task 116): its cells every 50 cm over its
// rectangle and how high each is over the ground (`h(x, z)`, with the LiDAR's noise), how steep its top
// is at each (from the cells either side, its middle), and the orthophoto's colour over it, as
// canopyOf takes them.
const onPark = (L, W, h, [r, g, b]) => {
  const at = [], rise = [], slopes = [];
  for (let x = 0.25; x < L; x += 0.5) for (let z = 0.25; z < W; z += 0.5) {
    at.push([x, z]);
    rise.push(h(x, z) + noise());
    if (x > 0.5 && x < L - 0.5 && z > 0.5 && z < W - 0.5) slopes.push(Math.hypot(h(x + 0.5, z) - h(x - 0.5, z) + noise(), h(x, z + 0.5) - h(x, z - 0.5) + noise()));
  }
  const slope = slopes.sort((p, q) => p - q)[Math.floor(slopes.length / 2)] ?? 0;
  return canopyOf({ ...topShape(at, rise), slope, bright: (r + g + b) / 3, blue: b - (r + g) / 2, L });
};
// A row of pyramid awnings, each 5 m square, 2.5 m at its edges and 3.3 m at its peak.
const tents = (x, z) => 2.5 + 0.8 * (1 - Math.max(Math.abs((x % 5) - 2.5), Math.abs((z % 5) - 2.5)) / 2.5);

test("a car park's canopies aren't buildings: solar panels, a row of tents, a long awning (task 116)", () => {
  assert.equal(onPark(30, 10, (x, z) => 2.5 + 0.2 * z, [95, 110, 140]), 'solar', 'panels on a frame, tilted 11°');
  assert.equal(onPark(20, 5, tents, [200, 200, 195]), 'tent', 'four white awnings in a row');
  assert.equal(onPark(5, 5, tents, [200, 200, 195]), 'tent', 'one');
  assert.equal(onPark(30, 6, () => 2.8, [215, 215, 210]), 'flat', 'a long white awning, flat');
});

test("but a kiosk, a row of site cabins, a house or a dark flat roof on one is (task 116)", () => {
  assert.equal(onPark(4, 4, () => 2.8, [215, 215, 210]), null, 'a white kiosk, flat');
  assert.equal(onPark(30, 3, (x) => 2.6 + 0.7 * (Math.floor(x / 6) % 2), [215, 215, 210]), null, 'five white cabins in a row, every other one stacked higher');
  assert.equal(onPark(10, 7, (x, z) => 3 + (3.5 - Math.abs(z - 3.5)) * 0.6, [180, 90, 70]), null, 'a gabled house, its tiles red');
  assert.equal(onPark(12, 8, () => 3.5, [110, 105, 100]), null, 'a flat grey roof');
});
