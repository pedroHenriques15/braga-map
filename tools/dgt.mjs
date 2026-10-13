// DGT's open data, as fetch.mjs keeps it in .cache/dgt/: the 2025 LiDAR (the terrain and surface
// models at 50 cm, and the classified point cloud) and the 2025 orthophoto. docs/SOURCES.md has
// their licence and credit. Read with dev dependencies only: nothing here ships to games.
import fs from 'node:fs';
import path from 'node:path';
import proj4 from 'proj4';
import { fromFile } from 'geotiff';
import jpeg from 'jpeg-js';
import { createLazPerf } from 'laz-perf';
import { CACHE, P, unP } from './geo.mjs';

export const DGT = path.join(CACHE, 'dgt');

// EPSG:3763, ETRS89 / Portugal TM06, the grid all of DGT's data is in. ETRS89 is taken as WGS84,
// as EPSG's own transformation between them (1149) does: here they differ by under a metre.
const TM06 = '+proj=tmerc +lat_0=39.66825833333333 +lon_0=-8.133108333333334 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const tm = proj4('WGS84', TM06);
// The map's metres to EPSG:3763's easting and northing, and back.
export const toTM = (x, z) => { const [lat, lon] = unP(x, z); return tm.forward([lon, lat]); };
export const fromTM = (e, n) => { const [lon, lat] = tm.inverse([e, n]); return P({ lat, lon }); };

// DGT's tiles are 1 km of EPSG:3763 on whole kilometres. Here each is named by its south-west
// corner in km, "-24_209", whatever DGT calls it.
export const tileKey = (e, n) => `${Math.floor(e / 1000)}_${Math.floor(n / 1000)}`;
export const tileBox = (key) => { const [e, n] = key.split('_').map(Number); return { e0: e * 1000, n0: n * 1000, e1: e * 1000 + 1000, n1: n * 1000 + 1000 }; };

// The tiles under a box on the map ({ x0, x1, z0, z1 }).
export function tilesOver(b) {
  const c = [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]].map(([x, z]) => toTM(x, z));
  const e = c.map((p) => p[0]), n = c.map((p) => p[1]), out = [];
  for (let j = Math.floor(Math.max(...n) / 1000); j >= Math.floor(Math.min(...n) / 1000); j--)
    for (let i = Math.floor(Math.min(...e) / 1000); i <= Math.floor(Math.max(...e) / 1000); i++) out.push(`${i}_${j}`);
  return out;
}

// The tiles within d metres of a line of points on the map ([x, z] each).
export function tilesAlong(pts, d) {
  const out = new Set();
  for (const [x, z] of pts) {
    const [e, n] = toTM(x, z);
    for (let i = Math.floor((e - d) / 1000); i <= Math.floor((e + d) / 1000); i++)
      for (let j = Math.floor((n - d) / 1000); j <= Math.floor((n + d) / 1000); j++) {
        const t = tileBox(`${i}_${j}`), de = Math.max(t.e0 - e, 0, e - t.e1), dn = Math.max(t.n0 - n, 0, n - t.n1);
        if (de * de + dn * dn <= d * d) out.add(`${i}_${j}`);
      }
  }
  return [...out].sort();
}

// Map metres from EPSG:3763 over one tile, much faster per point than proj4: a curve through the
// exact values at 3 × 3 points on it (the corners, the middles of the sides and the centre), within
// a millimetre of proj4 anywhere on the tile. A straight (affine) fit is 14 cm out at a far corner,
// as the angle between the two grids turns across a kilometre.
export function tileToMap(key) {
  const t = tileBox(key), at = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) at.push(fromTM(t.e0 + i * 500, t.n0 + j * 500));
  const L = (s) => [2 * (s - 0.5) * (s - 1), -4 * s * (s - 1), 2 * s * (s - 0.5)];
  return (e, n) => {
    const a = L((e - t.e0) / 1000), b = L((n - t.n0) / 1000);
    let x = 0, z = 0;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const w = a[i] * b[j], p = at[j * 3 + i]; x += w * p[0]; z += w * p[1]; }
    return [x, z];
  };
}

// ---- The terrain (MDT) and surface (MDS) models: Float32 GeoTIFFs at 50 cm, -999 where empty ----

const MODEL = { mdt: 'MDT-50cm', mds: 'MDS-50cm' };

async function readModel(file) {
  const img = await (await fromFile(file)).getImage();
  const [e0, n1] = img.getOrigin(), [res] = img.getResolution();
  const w = img.getWidth(), h = img.getHeight(), nodata = Number(img.getGDALNoData() ?? -999);
  // Cell (i, j)'s centre, whether the file says its origin is a cell's corner or its centre.
  const half = img.getGeoKeys().GTRasterTypeGeoKey === 2 ? 0 : 0.5;
  const [data] = await img.readRasters();
  return { e0: e0 + half * res, n1: n1 - half * res, res, w, h, nodata, data };
}

// Heights above the sea at (x, z) on the map, from the terrain model ('mdt', the ground) or the
// surface model ('mds', the tops of roofs and trees), between the cells' centres; null where the
// model has nothing or wasn't fetched. It reads the tiles under the box given, once.
export async function heights(kind, box) {
  const tiles = new Map();
  for (const key of tilesOver(box)) {
    const file = path.join(DGT, MODEL[kind], key + '.tif');
    if (fs.existsSync(file)) tiles.set(key, await readModel(file));
  }
  return (x, z) => {
    const [e, n] = toTM(x, z), t = tiles.get(tileKey(e, n));
    if (!t) return null;
    const fx = (e - t.e0) / t.res, fy = (t.n1 - n) / t.res;
    const i = Math.max(0, Math.min(t.w - 2, Math.floor(fx))), j = Math.max(0, Math.min(t.h - 2, Math.floor(fy)));
    const u = fx - i, v = fy - j, d = t.data, k = j * t.w + i;
    const a = d[k], b = d[k + 1], c = d[k + t.w], q = d[k + t.w + 1];
    if (a === t.nodata || b === t.nodata || c === t.nodata || q === t.nodata) return null;
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + q * u) * v;
  };
}

// ---- The orthophoto: a JPEG per tile, 4000 px a side (25 cm), cut from DGT's WMS ----

export const ORTHO_PX = 4000;

// The orthophoto's colour, [r, g, b], at (x, z) on the map (the pixel it falls in); null where it
// wasn't fetched. It decodes the tiles under the box given, once.
export async function ortho(box) {
  const tiles = new Map();
  for (const key of tilesOver(box)) {
    const file = path.join(DGT, 'ortho', key + '.jpg');
    if (fs.existsSync(file)) tiles.set(key, jpeg.decode(fs.readFileSync(file), { formatAsRGBA: false, maxMemoryUsageInMB: 1024 }));
  }
  return (x, z) => {
    const [e, n] = toTM(x, z), key = tileKey(e, n), t = tiles.get(key);
    if (!t) return null;
    const b = tileBox(key), s = t.width / 1000;
    const i = Math.min(t.width - 1, Math.floor((e - b.e0) * s)), j = Math.min(t.height - 1, Math.floor((b.n1 - n) * s)), k = (j * t.width + i) * 3;
    return [t.data[k], t.data[k + 1], t.data[k + 2]];
  };
}

// ---- The point cloud: LAZ (LAS 1.4, point format 8), a tile at a time ----

// Classes in DGT's point cloud.
export const CLASS = { ground: 2, lowVegetation: 3, mediumVegetation: 4, highVegetation: 5, building: 6, noise: 7, water: 9, bridge: 17 };

let lazPerf = null;

// Calls fn(pt) for every point of a tile, the same object each time: x and z on the map, y the
// height above the sea, cls its class, r, g, b and nir its colour (16-bit), ret and returns which
// return of the pulse it is and of how many. Stops early if fn returns false.
export async function points(key, fn) {
  const file = path.join(DGT, 'LAZ', key + '.laz');
  const buf = fs.readFileSync(file);
  const h = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const sx = h.getFloat64(131, true), sy = h.getFloat64(139, true), sz = h.getFloat64(147, true);
  const ox = h.getFloat64(155, true), oy = h.getFloat64(163, true), oz = h.getFloat64(171, true);
  const format = h.getUint8(104) & 0x3f;
  if (format < 6) throw new Error(`${key}.laz: point format ${format}, expected 6 to 8`);
  const toMap = tileToMap(key);
  lazPerf ??= await createLazPerf();
  const L = lazPerf, filePtr = L._malloc(buf.length);
  L.HEAPU8.set(buf, filePtr);
  const laz = new L.LASZip();
  try {
    laz.open(filePtr, buf.length);
    const len = laz.getPointLength(), n = laz.getCount(), ptr = L._malloc(len);
    const pt = { x: 0, y: 0, z: 0, cls: 0, r: 0, g: 0, b: 0, nir: 0, ret: 0, returns: 0 };
    try {
      for (let k = 0; k < n; k++) {
        laz.getPoint(ptr);
        const v = new DataView(L.HEAPU8.buffer, ptr, len);
        const e = v.getInt32(0, true) * sx + ox, nn = v.getInt32(4, true) * sy + oy;
        [pt.x, pt.z] = toMap(e, nn);
        pt.y = v.getInt32(8, true) * sz + oz;
        const rb = v.getUint8(14);
        pt.ret = rb & 15; pt.returns = rb >> 4;
        pt.cls = v.getUint8(16);
        if (format >= 7) { pt.r = v.getUint16(30, true); pt.g = v.getUint16(32, true); pt.b = v.getUint16(34, true); }
        if (format === 8) pt.nir = v.getUint16(36, true);
        if (fn(pt) === false) break;
      }
    } finally { L._free(ptr); }
  } finally { laz.delete(); L._free(filePtr); }
}
