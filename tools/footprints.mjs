// The buildings OpenStreetMap lacks, as footprints made from DGT's LiDAR (task 011): the geometry
// of it, on a grid of cells, for tools/roofs.mjs. Where the LiDAR saw building and the map has
// none, the cells left are cleared of anything narrower than a building (a wall, a sliver along an
// outline that's a little off), and each group of them big enough to be one becomes an outline,
// squared to its own walls.
//
// A grid is `w` cells across and `h` down, row by row: x east (columns), y south (rows), as the
// point cloud's rasters are (row 0 at the north).
import { ringArea, segDist } from './osm.mjs';

// Clears what's narrower than 2r + 1 cells: an opening by a square of that size (each cell kept
// where a whole square round it fits, then the squares put back).
export function open(mask, w, h, r) {
  const pass = (src, keep) => {
    // Along the rows, then down the columns: a cell is 1 if all (erode) or any (dilate) of the 2r + 1
    // cells round it in that line are.
    const rows = new Uint8Array(w * h), out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      let n = 0;
      for (let x = -r; x < w; x++) {
        if (x + r < w && src[y * w + x + r]) n++;
        if (x - r - 1 >= 0 && src[y * w + x - r - 1]) n--;
        if (x >= 0) rows[y * w + x] = keep(n, x, w) ? 1 : 0;
      }
    }
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = -r; y < h; y++) {
        if (y + r < h && rows[(y + r) * w + x]) n++;
        if (y - r - 1 >= 0 && rows[(y - r - 1) * w + x]) n--;
        if (y >= 0) out[y * w + x] = keep(n, y, h) ? 1 : 0;
      }
    }
    return out;
  };
  // A cell at the grid's edge has no square round it: it erodes.
  const all = (n, k, len) => k >= r && k < len - r && n === 2 * r + 1;
  return pass(pass(mask, all), (n) => n > 0);
}

// The groups of cells that touch, corners included, of `least` cells or more: each with its cells
// and its box, and `label` saying which group each cell is in (from 1).
export function blobs(mask, w, h, least) {
  const label = new Int32Array(w * h), out = [];
  const stack = [];
  let id = 0;
  for (let k = 0; k < w * h; k++) {
    if (!mask[k] || label[k]) continue;
    id++;
    const cells = [];
    let x0 = w, x1 = 0, y0 = h, y1 = 0;
    label[k] = id;
    stack.push(k);
    while (stack.length) {
      const c = stack.pop(), x = c % w, y = (c - x) / w;
      cells.push(c);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const n = Y * w + X;
        if (mask[n] && !label[n]) { label[n] = id; stack.push(n); }
      }
    }
    out.push({ id, cells, x0, x1, y0, y1 });
  }
  return { label, list: out.filter((b) => b.cells.length >= least) };
}

// The buildings in a grid of cells (`mask`, 1 where the LiDAR saw building and the map has none):
// the groups left once what's narrower than 2r + 1 cells is cleared, of `least` cells or more. Each
// with its own cells as they were before the clearing, those within r of it, so a turned building
// keeps its corners (a square can't reach into them): `label` over its box (x0, y0, w, h) says
// which, as `id`; and its outline round them, in cells of the whole grid.
export function buildings(mask, w, h, r, least) {
  const { label: all, list } = blobs(open(mask, w, h, r), w, h, least);
  return list.map((b) => {
    const x0 = Math.max(0, b.x0 - r), y0 = Math.max(0, b.y0 - r), lw = Math.min(w - 1, b.x1 + r) - x0 + 1, lh = Math.min(h - 1, b.y1 + r) - y0 + 1;
    const near = new Uint8Array(lw * lh);
    for (const c of b.cells) {
      const x = (c % w) - x0, y = Math.floor(c / w) - y0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < lw && Y < lh && mask[(Y + y0) * w + X + x0]) near[Y * lw + X] = 1;
      }
    }
    // What's near it may be joined to it by a corner only: the group its own first cell is in.
    const { label } = blobs(near, lw, lh, 1);
    const first = b.cells.reduce((m, c) => Math.min(m, c)), id = label[(Math.floor(first / w) - y0) * lw + (first % w) - x0];
    let cells = 0;
    for (let k = 0; k < label.length; k++) if (label[k] === id) cells++;
    const ring = trace(label, lw, lh, id).map(([x, y]) => [x + x0, y + y0]);
    return { x0, y0, w: lw, h: lh, label, id, cells, opened: b.cells.length, ring, all: b };
  });
}

// A group's outline, round the outside of its cells: the corners of the cells' edges where it turns,
// in cells ([x, y], the corner at a cell's north-west being the cell's own x and y). Holes in it (a
// courtyard) are left out: the outline goes round them.
export function trace(label, w, h, id) {
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && label[y * w + x] === id;
  let s = -1;
  for (let k = 0; k < w * h; k++) if (label[k] === id) { s = k; break; }
  if (s < 0) return [];
  // From the north-west corner of its first cell, heading east, the group always on the right: at
  // each corner, left if the cell ahead on the left is in it (so a group touching only at a corner
  // is gone round as one), else on if the one ahead on the right is, else right.
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // east, south, west, north
  // The cells ahead of corner (x, y) heading d: on its left, and on its right.
  const AHEAD = [[[0, -1], [0, 0]], [[0, 0], [-1, 0]], [[-1, 0], [-1, -1]], [[-1, -1], [0, -1]]];
  const sx = s % w, sy = (s - sx) / w;
  let x = sx, y = sy, d = 0;
  const out = [];
  for (let guard = 0; guard < 4 * w * h + 8; guard++) {
    const [[lx, ly], [rx, ry]] = AHEAD[d];
    const nd = at(x + lx, y + ly) ? (d + 3) % 4 : at(x + rx, y + ry) ? d : (d + 1) % 4;
    if (nd !== d || !out.length) out.push([x, y]);
    d = nd;
    x += DX[d];
    y += DY[d];
    if (x === sx && y === sy) {
      // Back at the start: the last turn there is the first corner, already in.
      return out;
    }
  }
  return out;
}

// Douglas-Peucker on a loop, keeping the indices of the points kept.
function keepIdx(pts, tol) {
  const n = pts.length;
  // Start from the two points furthest apart, so the loop's split doesn't depend on where it began.
  let a = 0, far = 0;
  for (let i = 1; i < n; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > far) { far = d; a = i; } }
  let b = a;
  far = 0;
  for (let i = 0; i < n; i++) { const d = (pts[i][0] - pts[a][0]) ** 2 + (pts[i][1] - pts[a][1]) ** 2; if (d > far) { far = d; b = i; } }
  const keep = new Uint8Array(n);
  keep[a] = keep[b] = 1;
  const at = (i) => pts[((i % n) + n) % n];
  const stack = [[a, b < a ? b + n : b], [b, a < b ? a + n : a]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let md = 0, mi = -1;
    const P = at(i), Q = at(j);
    for (let k = i + 1; k < j; k++) { const p = at(k), dd = segDist(p[0], p[1], { x: P[0], z: P[1] }, { x: Q[0], z: Q[1] }); if (dd > md) { md = dd; mi = k; } }
    if (md > tol) { keep[mi % n] = 1; stack.push([i, mi], [mi, j]); }
  }
  const idx = [];
  for (let i = 0; i < n; i++) if (keep[i]) idx.push(i);
  return idx;
}

// The way a footprint's walls mostly run: the angle (0 to π/2) its long sides lie at, give or take a
// right angle, from its edges weighted by their length.
export function mainAngle(ring) {
  let sx = 0, sy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[(i + 1) % ring.length], l = Math.hypot(bx - ax, by - ay);
    if (l < 1) continue;
    const a = Math.atan2(by - ay, bx - ax);
    sx += l * Math.cos(4 * a);
    sy += l * Math.sin(4 * a);
  }
  const t = Math.atan2(sy, sx) / 4;
  return t < 0 ? t + Math.PI / 2 : t;
}

// An outline traced round cells (in metres), squared: its staircase straightened into walls, those
// within 15° of the footprint's main way or across it turned to lie exactly so, walls that carry on
// in the same line made one, and each corner where two walls meet. Others (a wall on a bend of the
// street) keep their own angle. null if it comes out wrong (it crosses itself, or its area is off).
export function square(ring, tol = 0.6) {
  const idx = keepIdx(ring, tol);
  if (idx.length < 3) return null;
  const n = ring.length;
  const dp = idx.map((i) => ring[i]);
  const theta = mainAngle(dp);
  const SNAP = (15 * Math.PI) / 180;
  // Each wall as a line: its direction, and its offset along its normal (n · p = c), fitted to the
  // traced corners between its two ends.
  let lines = [];
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k], j = idx[(k + 1) % idx.length], P = ring[i], Q = ring[j];
    const len = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
    let a = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    const off = ((a - theta) % (Math.PI / 2) + Math.PI / 2) % (Math.PI / 2), diff = off > Math.PI / 4 ? off - Math.PI / 2 : off;
    const snapped = Math.abs(diff) < SNAP;
    if (snapped) a -= diff;
    const nx = -Math.sin(a), ny = Math.cos(a);
    let c = 0, m = 0;
    for (let t = i; ; t = (t + 1) % n) { c += ring[t][0] * nx + ring[t][1] * ny; m++; if (t === j) break; }
    lines.push({ a, nx, ny, c: c / m, len, snapped, at: Q });
  }
  // Walls in the same line, or nearly, are one; parallel ones a step apart get a short wall across
  // the step between them.
  const parallel = (A, B) => { const d = Math.abs(Math.sin(A.a - B.a)); return d < Math.sin((5 * Math.PI) / 180); };
  for (let changed = true; changed && lines.length > 3; ) {
    changed = false;
    for (let k = 0; k < lines.length && lines.length > 3; k++) {
      const A = lines[k], B = lines[(k + 1) % lines.length], Z = lines[(k + lines.length - 1) % lines.length];
      // A short wall at an angle between two that meet: a corner cut off (by clearing what's thin,
      // or by the cells' steps). Gone, so they meet.
      if (!A.snapped && A.len < 1.6 && !parallel(Z, B)) {
        lines.splice(k, 1);
        changed = true;
        break;
      }
      if (!parallel(A, B) || Math.cos(A.a - B.a) < 0) continue;
      if (Math.abs(A.c - B.c) < tol) {
        // One wall, the way the longer of them runs.
        const L = A.len + B.len, keep = A.len >= B.len ? A : B;
        lines[k] = { ...keep, c: (A.c * A.len + B.c * B.len) / L, len: L, at: B.at };
        lines.splice((k + 1) % lines.length, 1);
      } else {
        // The step: a wall across them, through the corner where the one ends.
        const a = A.a + Math.PI / 2, nx = -Math.sin(a), ny = Math.cos(a);
        lines.splice(k + 1, 0, { a, nx, ny, c: A.at[0] * nx + A.at[1] * ny, len: Math.abs(A.c - B.c), snapped: A.snapped, at: A.at });
      }
      changed = true;
      break;
    }
  }
  if (lines.length < 3) return null;
  // The corners, where each wall meets the next.
  const out = [];
  for (let k = 0; k < lines.length; k++) {
    const A = lines[k], B = lines[(k + 1) % lines.length], det = A.nx * B.ny - A.ny * B.nx;
    if (Math.abs(det) < 1e-9) return null;
    out.push([(A.c * B.ny - A.ny * B.c) / det, (A.nx * B.c - A.c * B.nx) / det]);
  }
  const a0 = ringArea(ring), a1 = ringArea(out);
  if (!(a1 > 0.8 * a0 && a1 < 1.2 * a0) || crosses(out)) return null;
  return out;
}

// Does a loop cross itself?
export function crosses(r) {
  const n = r.length;
  const hit = (p, q, s, t) => {
    const d = (q[0] - p[0]) * (t[1] - s[1]) - (q[1] - p[1]) * (t[0] - s[0]);
    if (Math.abs(d) < 1e-12) return false;
    const u = ((s[0] - p[0]) * (t[1] - s[1]) - (s[1] - p[1]) * (t[0] - s[0])) / d, v = ((s[0] - p[0]) * (q[1] - p[1]) - (s[1] - p[1]) * (q[0] - p[0])) / d;
    return u > 1e-9 && u < 1 - 1e-9 && v > 1e-9 && v < 1 - 1e-9;
  };
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (hit(r[i], r[(i + 1) % n], r[j], r[(j + 1) % n])) return true;
  }
  return false;
}

// The cells whose middles a loop (in cells) covers, inside the box x0..x1, y0..y1: a row at a time.
export function fillCells(ring, x0, x1, y0, y1, fn) {
  for (let y = Math.max(y0, Math.floor(Math.min(...ring.map((p) => p[1])))); y <= Math.min(y1, Math.ceil(Math.max(...ring.map((p) => p[1])))); y++) {
    const cy = y + 0.5, xs = [];
    for (let k = 0, l = ring.length - 1; k < ring.length; l = k++) {
      const [ax, ay] = ring[k], [bx, by] = ring[l];
      if (ay > cy !== by > cy) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(x0, Math.ceil(xs[k] - 0.5)); x <= Math.min(x1, Math.floor(xs[k + 1] - 0.5)); x++) fn(x, y);
  }
}

// How well a loop (in cells of the whole grid) lies over a building's cells (as buildings() gives
// it): what they share over what either covers.
export function fit(ring, b) {
  let both = 0, mine = 0;
  const local = ring.map(([x, y]) => [x - b.x0, y - b.y0]);
  fillCells(local, -1e6, 1e6, -1e6, 1e6, (x, y) => { mine++; if (x >= 0 && y >= 0 && x < b.w && y < b.h && b.label[y * b.w + x] === b.id) both++; });
  const either = b.cells + mine - both;
  return either ? both / either : 0;
}
