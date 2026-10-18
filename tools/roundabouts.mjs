// Where each roundabout's ring really is (task 014). The world draws a ring as a band round
// OpenStreetMap's line for it, at the width its kind of street usually is, and its island is the hole
// the band leaves (streets.mjs, task 033); carriageways.mjs (task 026) measured almost none, as a ring
// is all junctions and it measures no station near one. DGT's 2025 LiDAR shows the ring: its island's
// kerb all round, and its outer kerb between the entries. So each ring is measured across, from its
// middle outwards, every STEP round it with carriageways.mjs's cross-section (`across`), and its line
// moves onto the middle of what was measured, at the width measured, the island's kerb where the
// LiDAR saw it.
//
// node tools/roundabouts.mjs            measures every roundabout in the open world's box (OPEN_BOX),
//                                       after carriageways.mjs, before walls.mjs, npm run open, npm run
//                                       world and npm run tracks (a minute)
// node tools/roundabouts.mjs --check    and a picture of each over the orthophoto, with the map's line
//                                       and edges, the kerbs measured and the ring moved:
//                                       .cache/roundabouts/<x>_<z>.png
//
// .cache/roundabouts.json: each ring measured (`rings`: its ways, middle, what was seen, its island's
// radius and its width), and its moves, as carriageways.json has them (`moves`: nodes, inserts,
// widths), which lines.mjs's carriagewayMoves lays over carriageways.json's: each ring's nodes, the
// points put in round it, its ways' width; and the arms' ends, eased onto the ring's. And what stands
// in each island (`stands`): OpenStreetMap's artworks, fountains and monuments in it (fetch.mjs art),
// each at its height as the point cloud has it, for world.mjs's sights.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CACHE, P, readCache } from './geo.mjs';
import { across, EASE, FILE as CARRIAGEWAYS, sampler, STEP } from './carriageways.mjs';
import { LEVEL, streetsOf } from './lines.mjs';
import { OPEN_BOX } from './sections.mjs';

export const FILE = path.join(CACHE, 'roundabouts.json');
// How far past half the map's width the cross-section looks, either way; how far past an arm's
// carriageway at the map's width an outer kerb isn't taken (its mouth, where the kerb turns into it);
// how far round a ring its middle is the median of (WINDOW metres either way); how much of a ring's
// island must be seen for it to move; and how many widths must be measured for it to take its width,
// the median of those within TRIM of their median (a kerb seen out in an arm's mouth, or past a car),
// and clear where half are within CLEAR of it; the narrowest a ring is where it isn't measured; and
// how much of an island's kerb must be within ROUND of a circle for the island to be round.
const REACH = 8, MOUTH = 1.5, WINDOW = 6, SEEN = 0.6, STATIONS = 5, TRIM = 1.5, CLEAR = 0.75, LANE = 3, ROUND = 0.3, ROUNDED = 0.6;
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const median = (v) => { const s = [...v].sort((p, q) => p - q); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;

// The roundabouts among `lines` (streetsOf's): each ring of ways tagged junction=roundabout on the
// ground, joined end to end round it, as { ways, nodes, pts, s, c, k, w }: its ways, its nodes and
// points round it (the first not repeated at the end), how far round each is, its middle (the
// polygon's centroid), the biggest kind of street in it, and the map's width (the widest of its ways).
// A ring the map leaves open, or that's partly on a bridge, isn't one.
export function ringsOf(lines) {
  const ways = lines.filter((l) => l.t.junction === 'roundabout' && l.k <= 8 && l.nodes?.length === l.pts.length);
  const from = new Map();
  for (const l of ways) from.set(l.nodes[0], [...(from.get(l.nodes[0]) ?? []), l]);
  const used = new Set(), rings = [];
  for (const l0 of ways) {
    if (used.has(l0)) continue;
    const chain = [l0];
    used.add(l0);
    let end = l0.nodes.at(-1);
    while (end !== l0.nodes[0]) {
      const next = (from.get(end) ?? []).find((l) => !used.has(l));
      if (!next) break;
      chain.push(next);
      used.add(next);
      end = next.nodes.at(-1);
    }
    if (end !== l0.nodes[0] || chain.some((l) => l.level !== LEVEL.ground)) continue;
    const nodes = [], pts = [], way = [];
    for (const l of chain) for (let i = 0; i < l.nodes.length - 1; i++) { nodes.push(l.nodes[i]); pts.push(l.pts[i]); way.push(l); }
    if (pts.length < 4) continue;
    let A = 0, cx = 0, cz = 0;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], f = ax * bz - bx * az;
      A += f; cx += (ax + bx) * f; cz += (az + bz) * f;
    }
    const s = [0];
    for (let i = 1; i <= pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i % pts.length][0] - pts[i - 1][0], pts[i % pts.length][1] - pts[i - 1][1]));
    rings.push({ ways: chain, nodes, pts, way, s, c: [cx / (3 * A), cz / (3 * A)], k: Math.min(...chain.map((l) => l.k)), w: Math.max(...chain.map((l) => l.w)) });
  }
  return rings;
}

// One ring measured: every STEP round it, the cross-section across it (`section`, carriageways.mjs's
// sampler's), and from `across` how far its island's kerb is from the line, and its outer kerb; but no
// outer kerb within MOUTH of an arm's carriageway at the map's width (`arms`: each node of the ring
// another street meets, and that street), where the cross-section runs on into the arm. Returns
// [{ s, x, z, n, din, dout }]: how far round, where on the line, the way out from the island there,
// and the two kerbs' distances from the line (null where not seen).
export function measureRing(ring, section, arms) {
  const { pts, s, c } = ring, out = [];
  const segs = arms.flatMap(([, l]) => l.pts.slice(1).map((q, k) => [l.pts[k], q, l.w / 2]));
  const inMouth = (q) => segs.some(([a, b, h]) => segDist(q, a, b) < h + MOUTH);
  for (let i = 0, at = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], len = s[i + 1] - s[i];
    if (len < 1e-6) continue;
    const tx = (bx - ax) / len, tz = (bz - az) / len;
    for (; at < s[i + 1]; at += STEP) {
      const d = at - s[i], x = ax + tx * d, z = az + tz * d;
      // The offsets are to the line's right, (-tz, tx): the island is on the side its middle is.
      const right = -tz * (c[0] - x) + tx * (c[1] - z) > 0, sign = right ? 1 : -1;
      const { a, b } = across(section(x, z, tx, tz, ring.w / 2 + REACH), { seek: Math.max(1.5, ring.w / 2 - 0.5) });
      const [inO, outO] = right ? [b, a] : [a, b];
      const din = inO === null || inO * sign <= 0 ? null : r2(inO * sign), dout = outO === null || outO * sign >= 0 ? null : r2(-outO * sign);
      const armed = dout !== null && inMouth([x - tz * outO, z + tx * outO]);
      out.push({ s: at, x, z, n: [tz * sign, -tx * sign], din, dout: armed ? null : dout });
    }
  }
  return out;
}
const segDist = ([x, z], [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - dx * f, z - az - dz * f); };

// A ring's profile from its stations: its width (the median of those within TRIM of the median of
// the widths measured, where STATIONS or more were, and `clear` where half are within CLEAR of it, as
// carriageways.mjs's profile has it; where fewer were, from the island's kerb to the map's outer
// edge, no narrower than LANE); and where its line goes (`place(p, s, n)`: a point p of the map's
// line, s round it, n its way out from the island there). Most islands are round: where a circle
// fits the kerb seen (by least squares, again without the points furthest off it), the line is a
// circle half the width out from it (`circle`, [x, z, r]).
// Otherwise (an oval, a ring round a square) the line moves out by the middle there (`mid(s)`: the
// middle of the two kerbs, or half the width out from the island's, the median of the stations within
// WINDOW either way, smoothed over a few metres, and on through a stretch not seen from the stations
// either side). And the island's radius (its circle's, or the median of its kerb's distances from
// the ring's middle), and how much of it was seen.
export function ringProfile(ring, stations) {
  const L = ring.s.at(-1), seen = stations.filter((q) => q.din !== null), both = stations.filter((q) => q.din !== null && q.dout !== null);
  const ws = both.map((q) => q.din + q.dout), mw = ws.length ? median(ws) : NaN, near = ws.filter((v) => Math.abs(v - mw) <= TRIM);
  const width = ws.length >= STATIONS ? Math.round(median(near) * 10) / 10 : seen.length ? Math.max(LANE, Math.round((median(seen.map((q) => q.din)) + ring.w / 2) * 10) / 10) : null;
  const clear = ws.length >= STATIONS && ws.filter((v) => Math.abs(v - mw) <= CLEAR).length * 2 >= ws.length, measured = ws.length >= STATIONS;
  const W = width ?? ring.w, share = seen.length / Math.max(1, stations.length);
  const kerb = seen.map((q) => [q.x - q.n[0] * q.din, q.z - q.n[1] * q.din]);
  // A circle round the whole island, fitted again to the kerb nearer it each time (a kerb found out on
  // the ring, where a car or a patch hid the real one, falls away); round where most of the kerb is
  // within ROUND of it.
  const offOf = (c) => ([x, z]) => Math.abs(Math.hypot(x - c[0], z - c[1]) - c[2]);
  let c = kerb.length >= 6 ? circleFit(kerb) : null;
  for (const lim of [1.5, 0.6, ROUND]) { if (!c) break; const kept = kerb.filter((p) => offOf(c)(p) <= lim); c = kept.length >= 6 ? circleFit(kept) : null; }
  const round = c && kerb.filter((p) => offOf(c)(p) <= ROUND).length >= ROUNDED * kerb.length ? [c[0], c[1], c[2] + W / 2] : null;
  const island = round ? c[2] : seen.length ? median(kerb.map(([x, z]) => Math.hypot(x - ring.c[0], z - ring.c[1]))) : null;
  // Otherwise the middle off the line round it.
  const mids = seen.map((q) => [q.s, q.dout !== null && Math.abs(q.din + q.dout - W) <= TRIM ? (q.dout - q.din) / 2 : W / 2 - q.din]);
  const along = (d) => { const v = ((d % L) + L) % L; return Math.min(v, L - v); };
  const n = Math.max(3, Math.round(L / STEP)), raw = new Float64Array(n).fill(NaN);
  for (let g = 0; g < n; g++) { const v = mids.filter(([q]) => along(q - (g * L) / n) <= WINDOW).map(([, m]) => m); if (v.length >= 3) raw[g] = median(v); }
  const known = [...raw.keys()].filter((g) => !Number.isNaN(raw[g]));
  const filled = raw.map((v, g) => {
    if (!Number.isNaN(v) || !known.length) return v;
    const after = known.find((k) => k > g) ?? known[0] + n, before = [...known].reverse().find((k) => k < g) ?? known.at(-1) - n;
    const f = (g - before) / (after - before);
    return raw[((before % n) + n) % n] * (1 - f) + raw[after % n] * f;
  });
  const sm = filled.map((v, g) => { let sw = 0, sv = 0; for (let k = -6; k <= 6; k++) { const q = filled[(g + k + n) % n], w = Math.exp(-(((k * L) / n) ** 2) / 32); if (!Number.isNaN(q)) { sw += w; sv += w * q; } } return sw ? sv / sw : 0; });
  const mid = (s) => { const f = ((((s % L) + L) % L) / L) * n, i = Math.floor(f) % n, j = (i + 1) % n; return sm[i] + (sm[j] - sm[i]) * (f - Math.floor(f)); };
  const place = (p, s, nrm) => {
    if (!round) { const m = mid(s); return [p[0] + nrm[0] * m, p[1] + nrm[1] * m]; }
    const dx = p[0] - round[0], dz = p[1] - round[1], d = Math.hypot(dx, dz) || 1;
    return [round[0] + (dx / d) * round[2], round[1] + (dz / d) * round[2]];
  };
  return { seen: share, width, measured, clear, mw, island, circle: round, place, ok: share >= SEEN };
}
// The circle through some points by least squares (Kåsa's: x² + z² + D·x + E·z + F = 0, about their
// mean), as [x, z, r], or null.
const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
export function circleFit(pts) {
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, mz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], T = [0, 0, 0];
  for (const [px, pz] of pts) {
    const u = px - mx, v = pz - mz, row = [u, v, 1], w = -(u * u + v * v);
    for (let i = 0; i < 3; i++) { T[i] += row[i] * w; for (let k = 0; k < 3; k++) M[i][k] += row[i] * row[k]; }
  }
  const d = det3(M);
  if (Math.abs(d) < 1e-9) return null;
  const [D, E, F] = [0, 1, 2].map((c) => det3(M.map((row, r) => row.map((x, k) => (k === c ? T[r] : x)))) / d);
  const r = (D * D + E * E) / 4 - F;
  return r > 0 ? [mx - D / 2, mz - E / 2, Math.sqrt(r)] : null;
}

// The moves for every ring in `rings` that was seen well enough, laid over `base` (carriageways.json's
// moves): each node of the ring onto its line (the profile's `place`, along the node's normal, mitred
// between its two stretches), and between two nodes the line every STEP, put in where it bends more
// than 5 cm off the straight between them; each of its ways at its width; and each arm's move at the
// ring eased in along it over EASE, or to its next node another street meets, whichever is nearer.
export function ringMoves(rings, lines, base) {
  const nodes = {}, inserts = {}, widths = {}, at = new Map();
  for (const l of lines) l.nodes?.forEach((n, i) => at.set(n, [...(at.get(n) ?? []), [l, i]]));
  const old = (n) => base?.nodes?.[n] ?? [0, 0];
  for (const ring of rings) {
    if (!ring.profile?.ok) continue;
    const { c, pts, s, profile } = ring, N = pts.length;
    // Each stretch's way out from the island, and each node's, mitred.
    const out = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1, v = [dz / d, -dx / d], m = [(a[0] + b[0]) / 2 - c[0], (a[1] + b[1]) / 2 - c[1]]; return v[0] * m[0] + v[1] * m[1] >= 0 ? v : [-v[0], -v[1]]; };
    const seg = pts.map((p, i) => out(p, pts[(i + 1) % N]));
    const normal = pts.map((p, i) => { const a = seg[(i - 1 + N) % N], b = seg[i], sx = a[0] + b[0], sz = a[1] + b[1], m = Math.hypot(sx, sz); if (m < 1e-6) return b; const f = 1 / (Math.max(2 / 3, m / 2) * m); return [sx * f, sz * f]; });
    const moved = pts.map((p, i) => profile.place(p, s[i], normal[i]));
    ring.nodes.forEach((n, i) => { nodes[n] = [r3(moved[i][0] - pts[i][0]), r3(moved[i][1] - pts[i][1])]; });
    const index = new Map(ring.nodes.map((n, i) => [n, i]));
    for (const l of ring.ways) {
      if (profile.width) widths[l.id] = profile.width;
      for (let k = 0; k < l.nodes.length - 1; k++) {
        const i = index.get(l.nodes[k]), j = (i + 1) % N, L = s[i + 1] - s[i], A = moved[i], B = moved[j], mids = [];
        // On a circle, its arc between the two; otherwise the line between them moved out.
        if (profile.circle) {
          const [cx, cz, r] = profile.circle, a0 = Math.atan2(A[1] - cz, A[0] - cx);
          let da = Math.atan2(B[1] - cz, B[0] - cx) - a0;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          const m = Math.floor((Math.abs(da) * r) / STEP);
          for (let q = 1; q < m; q++) { const a = a0 + (da * q) / m; mids.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
        } else for (let q = STEP; q < L - STEP / 2; q += STEP) mids.push(profile.place([pts[i][0] + ((pts[j][0] - pts[i][0]) * q) / L, pts[i][1] + ((pts[j][1] - pts[i][1]) * q) / L], s[i] + q, seg[i]));
        if (mids.some((p) => segDist(p, A, B) > 0.05)) inserts[`${l.id}:${l.nodes[k]}-${l.nodes[k + 1]}`] = mids.map(([x, z]) => [r2(x), r2(z)]);
      }
    }
    // The arms: from each node of the ring another street meets, along that street away from the ring.
    const mine = new Set(ring.ways);
    for (const n of ring.nodes) for (const [l, i] of at.get(n) ?? []) {
      if (mine.has(l) || l.k > 8 || l.level !== LEVEL.ground) continue;
      const d = [nodes[n][0] - old(n)[0], nodes[n][1] - old(n)[1]];
      if (Math.hypot(d[0], d[1]) < 0.005) continue;
      const dir = i === 0 ? 1 : -1;
      let run = 0;
      for (let j = i + dir; j >= 0 && j < l.pts.length; j += dir) {
        if ((at.get(l.nodes[j]) ?? []).length > 1) break;
        run += Math.hypot(l.pts[j][0] - l.pts[j - dir][0], l.pts[j][1] - l.pts[j - dir][1]);
        const f = 1 - smooth(run / EASE), m = nodes[l.nodes[j]] ?? old(l.nodes[j]);
        nodes[l.nodes[j]] = [r3(m[0] + d[0] * f), r3(m[1] + d[1] * f)];
        // The points carriageways.mjs put in on the stretch up to it, moved with it.
        const a = Math.min(j, j - dir), b = Math.max(j, j - dir), key = `${l.id}:${l.nodes[a]}-${l.nodes[b]}`, put = base?.inserts?.[key];
        if (put && !inserts[key]) inserts[key] = put.map(([x, z]) => [r2(x + d[0] * f), r2(z + d[1] * f)]);
        if (run >= EASE) break;
      }
    }
  }
  return { nodes, inserts, widths };
}

// ---- What stands in an island ----

// What the map has in each island of `rings` (each seen well enough, moved or not: inside the kerb
// seen round it, half a metre in), from `art` (fetch.mjs's art.json): a statue or another artwork, a fountain, a
// monument or a memorial, an obelisk or a cross; each as DGT's point cloud has it within NEAR_ART of
// the map's point: where its points over the ground stand (their middle), and as high as the TOPth
// highest reaches, where that's TALL or more. All its points but the ground's: a thin statue's are
// classed as noise, as São João da Ponte's are, and a flower bed's round it as plants. [{ ring, osm,
// kind, name, subject, material, inscription, x, z, h }]: the ring's first way, the map's element, and
// its tags. `ground(x, z)` is the terrain's height.
const NEAR_ART = 1.5, TOP = 3, TALL = 1;
export async function standsIn(rings, art, ground) {
  const [{ points, toTM, tileKey }] = await Promise.all([import('./dgt.mjs')]);
  const found = [];
  for (const ring of rings) {
    if (!(ring.profile?.seen >= SEEN)) continue;
    const kerb = ring.stations.filter((q) => q.din !== null).map((q) => [q.x - q.n[0] * (q.din + 0.5), q.z - q.n[1] * (q.din + 0.5)]);
    const inside = (x, z) => { let o = false; for (let i = 0, j = kerb.length - 1; i < kerb.length; j = i++) if (kerb[i][1] > z !== kerb[j][1] > z && x < kerb[i][0] + ((z - kerb[i][1]) / (kerb[j][1] - kerb[i][1])) * (kerb[j][0] - kerb[i][0])) o = !o; return o; };
    for (const e of art) {
      const at = e.type === 'node' ? e : e.center;
      if (!at) continue;
      const [x, z] = P(at);
      if (inside(x, z)) found.push({ ring, e, x, z, tm: toTM(x, z), pts: [] });
    }
  }
  // Each tile of the point cloud read once, for the points round each.
  for (const key of new Set(found.map((f) => tileKey(...f.tm)))) {
    const here = found.filter((f) => tileKey(...f.tm) === key);
    await points(key, (p) => {
      if (p.cls === 2) return;
      for (const f of here) if (Math.hypot(p.e - f.tm[0], p.n - f.tm[1]) < NEAR_ART) f.pts.push([p.e, p.n, p.y]);
    }, true);
  }
  const out = [];
  for (const { ring, e, x, z, tm, pts } of found) {
    const over = pts.map(([pe, pn, y]) => [pe, pn, y - ground.at(x, z)]).filter(([, , h]) => h > 0.5).sort((a, b) => b[2] - a[2]);
    if (over.length < TOP || over[TOP - 1][2] < TALL) continue;
    const t = e.tags ?? {}, me = over.reduce((s, q) => s + q[0], 0) / over.length - tm[0], mn = over.reduce((s, q) => s + q[1], 0) / over.length - tm[1];
    // Where its points stand: their middle, east and north of the map's point (east is x, north is -z).
    const kind = t.tourism === 'artwork' ? t.artwork_type ?? 'sculpture' : t.amenity === 'fountain' ? 'fountain' : t.man_made ?? t.historic;
    out.push({ ring: ring.ways[0].id, osm: `${e.type}/${e.id}`, kind, ...(t.name && { name: t.name }), ...(t['subject:wikipedia'] && { subject: t['subject:wikipedia'].replace(/^[a-z]+:/, '') }), ...(t.material && { material: t.material }), ...(t.inscription && { inscription: t.inscription.replace(/^"|"$/g, '') }), x: r2(x + me), z: r2(z - mn), h: Math.round(over[TOP - 1][2] * 10) / 10 });
  }
  return out;
}

// ---- On its own ----

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t0 = Date.now(), B = OPEN_BOX, M = 60;
  const { section, ground } = await sampler({ x0: B.x0 - M, x1: B.x1 + M, z0: B.z0 - M, z1: B.z1 + M });
  // The map's own lines, as carriageways.mjs measures them; and its moves, which the rings' lie over.
  const lines = streetsOf(readCache('osm/base.json'), (x, z, m) => x >= B.x0 - M - m && x <= B.x1 + M + m && z >= B.z0 - M - m && z <= B.z1 + M + m);
  const base = fs.existsSync(CARRIAGEWAYS) ? JSON.parse(fs.readFileSync(CARRIAGEWAYS, 'utf8')).moves : null;
  const inBox = ([x, z]) => x >= B.x0 && x <= B.x1 && z >= B.z0 && z <= B.z1;
  const rings = ringsOf(lines).filter((r) => r.pts.some(inBox));
  const at = new Map();
  for (const l of lines) l.nodes?.forEach((n, i) => at.set(n, [...(at.get(n) ?? []), [l, i]]));
  for (const ring of rings) {
    const mine = new Set(ring.ways);
    const arms = ring.nodes.flatMap((n, i) => (at.get(n) ?? []).filter(([l]) => !mine.has(l) && l.k <= 8).map(([l]) => [i, l]));
    ring.stations = measureRing(ring, section, arms);
    ring.profile = ringProfile(ring, ring.stations);
    ring.arms = arms.length;
    // A ring a deck passes over stays as the map has it: the LiDAR sees its kerb only between the
    // deck's piers, and a tunnel's mouth beside it takes the ground the ring's carriageway reaches
    // (the Rotunda Santos da Cunha's, under its viaduct, over the Avenida Imaculada Conceição's tunnel).
    const reach = Math.max(...ring.pts.map(([x, z]) => Math.hypot(x - ring.c[0], z - ring.c[1]))) + ring.w;
    ring.under = lines.some((l) => l.level === LEVEL.bridge && l.pts.some((q, i) => i && segDist(ring.c, l.pts[i - 1], q) < reach));
    if (ring.under) ring.profile.ok = false;
  }
  const moves = ringMoves(rings, lines, base);
  const art = fs.existsSync(path.join(CACHE, 'osm', 'art.json')) ? readCache('osm/art.json').elements : [];
  const got = await standsIn(rings, art, ground);
  const name = (r) => r.ways.map((l) => l.t.name).find(Boolean) ?? '(no name)';
  // Each ring's line's distance from its middle, and its island's at the map's width.
  const radius = (r) => median(r.stations.map((q) => Math.hypot(q.x - r.c[0], q.z - r.c[1])));
  const out = rings.map((r) => ({
    name: name(r), ways: r.ways.map((l) => l.id), c: r.c.map(r2), stations: r.stations.length, arms: r.arms,
    seen: r2(r.profile.seen), outer: r.stations.filter((q) => q.dout !== null).length,
    island: r.profile.island === null ? null : r2(r.profile.island), mapIsland: r2(radius(r) - r.w / 2),
    width: r.profile.width, measured: r.profile.measured, clear: r.profile.clear, mapWidth: r2(r.w), moved: r.profile.ok, round: !!r.profile.circle, ...(r.under && { under: true }),
    ...(r.profile.circle && { centre: r.profile.circle.slice(0, 2).map(r2) }),
  }));
  fs.writeFileSync(FILE, JSON.stringify({ about: "Where each roundabout's ring is, as DGT's 2025 LiDAR sees it, by tools/roundabouts.mjs (task 014): informação geográfica cedida pela Direção-Geral do Território (CC BY 4.0). © OpenStreetMap contributors (ODbL).", rings: out, moves, stands: got }));
  for (const r of out) console.log(`${r.name} (${r.c.map(Math.round)}): ${r.stations} stations, the island seen at ${Math.round(r.seen * 100)}%, ${r.island ?? '–'} m round (the map's ${r.mapIsland}), the outer kerb at ${r.outer}; ${r.width ?? '–'} m wide${r.clear ? ' clearly' : r.measured ? '' : ", to the map's outer edge"} (the map's ${r.mapWidth}); ${r.moved ? (r.round ? 'moved, round' : 'moved along its line') : r.under ? 'stays, a deck over it' : 'stays'}`);
  for (const q of got) console.log(`in ${out.find((r) => r.ways[0] === q.ring)?.name}'s island: ${q.osm}, a ${q.kind}${q.name ? ` (${q.name})` : q.subject ? ` of ${q.subject}` : ''}, ${q.h} m high at (${q.x}, ${q.z})`);
  console.log(`${out.length} rings, ${out.filter((r) => r.moved).length} moved, ${out.filter((r) => r.moved && r.measured).length} with their width measured; ${Object.keys(moves.nodes).length} nodes moved, ${Object.keys(moves.inserts).length} stretches with points put in, in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(process.cwd(), FILE)}`);
  const all = { nodes: { ...base?.nodes, ...moves.nodes }, inserts: { ...base?.inserts, ...moves.inserts }, widths: { ...base?.widths, ...moves.widths } };
  if (process.argv.includes('--check')) for (const r of rings) await picture(r, lines, all, path.join(CACHE, 'roundabouts', `${Math.round(r.c[0])}_${Math.round(r.c[1])}.png`));
}

// A picture of a ring over the orthophoto, 8 pixels a metre: the map's lines (red) and their edges at
// the map's width (thin red); the island's kerb measured at each station (cyan) and the outer kerb
// (yellow); and the lines moved, with their edges (green).
async function picture(ring, lines, moves, file) {
  const [{ ortho }, sharp, { moveLine }] = await Promise.all([import('./dgt.mjs'), import('sharp'), import('./lines.mjs')]);
  const r = Math.max(...ring.pts.map((p) => Math.hypot(p[0] - ring.c[0], p[1] - ring.c[1]))) + ring.w + 12, box = { x0: ring.c[0] - r, x1: ring.c[0] + r, z0: ring.c[1] - r, z1: ring.c[1] + r };
  const px = 0.125, W = Math.round((box.x1 - box.x0) / px), H = Math.round((box.z1 - box.z0) / px), colour = await ortho(box), data = Buffer.alloc(W * H * 3);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const c = colour(box.x0 + (i + 0.5) * px, box.z0 + (j + 0.5) * px) ?? [128, 128, 128], k = (j * W + i) * 3;
    data[k] = c[0]; data[k + 1] = c[1]; data[k + 2] = c[2];
  }
  const X = (x) => ((x - box.x0) / px).toFixed(1), Z = (z) => ((z - box.z0) / px).toFixed(1);
  const poly = (pts, attrs) => `<polyline points="${pts.map(([x, z]) => `${X(x)},${Z(z)}`).join(' ')}" fill="none" ${attrs}/>`;
  const sides = (pts, o) => { const n = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / d, (b[0] - a[0]) / d]; }); return pts.map((p, i) => [p[0] + n[i][0] * o, p[1] + n[i][1] * o]); };
  const svg = [];
  const shown = lines.filter((l) => l.k <= 8 && l.pts.some(([x, z]) => x > box.x0 && x < box.x1 && z > box.z0 && z < box.z1));
  for (const l of shown) svg.push(poly(l.pts, 'stroke="#ff3030" stroke-width="2"'), poly(sides(l.pts, -l.w / 2), 'stroke="#ff3030" stroke-width="1" stroke-dasharray="6 4"'), poly(sides(l.pts, l.w / 2), 'stroke="#ff3030" stroke-width="1" stroke-dasharray="6 4"'));
  for (const q of ring.stations) {
    if (q.din !== null) svg.push(`<circle cx="${X(q.x - q.n[0] * q.din)}" cy="${Z(q.z - q.n[1] * q.din)}" r="2.5" fill="#30e0ff"/>`);
    if (q.dout !== null) svg.push(`<circle cx="${X(q.x + q.n[0] * q.dout)}" cy="${Z(q.z + q.n[1] * q.dout)}" r="2.5" fill="#ffe030"/>`);
  }
  for (const l of shown) {
    const m = moveLine(l.id, l.nodes, l.pts, moves), w = moves.widths[l.id] ?? l.w;
    if (m.pts.some((p, k) => p !== l.pts[k]) || moves.widths[l.id]) svg.push(poly(m.pts, 'stroke="#30ff60" stroke-width="2"'), poly(sides(m.pts, -w / 2), 'stroke="#30ff60" stroke-width="1"'), poly(sides(m.pts, w / 2), 'stroke="#30ff60" stroke-width="1"'));
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp.default(data, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg.join('')}</svg>`) }]).png().toFile(file);
  console.log(file);
}
