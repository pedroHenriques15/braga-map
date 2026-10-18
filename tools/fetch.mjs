// Downloads what the map of Braga is made of: OpenStreetMap data through the Overpass API, and
// elevation tiles (Terrain Tiles, on AWS Open Data). It keeps them in .cache/ for the other scripts.
// DGT's open data (docs/SOURCES.md) comes only when it's named, into .cache/dgt/: the 2025 LiDAR
// (`lidar`, about 5.6 GB, with the CDD's free account), the 2025 orthophoto (`ortho`, about 110 MB),
// its near-infrared (`nir`, about 110 MB) and the COS2025 land use (`cos`).
//
// node tools/fetch.mjs            everything but DGT's
// node tools/fetch.mjs trees      only what's named (base, paths, barriers, buildings, admin, pois, art, shops, trees,
//                                 street, restrictions, dem, horizon, lidar, ortho, cos)
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';
import { CACHE as cache, LAT0, LON0, KX, KZ, P, unP } from './geo.mjs';

fs.mkdirSync(path.join(cache, 'osm'), { recursive: true });
fs.mkdirSync(path.join(cache, 'dem'), { recursive: true });

// The box fetched, a little more than the map shows: south, west, north, east.
const S = 41.531, W = -8.442, N = 41.574, E = -8.360;
const BOX = `${S},${W},${N},${E}`;
const UA = 'braga-map/1.0';

const QUERIES = {
  // Streets, railways, rivers and what the land is used for.
  base: `[out:json][timeout:180][bbox:${BOX}];
(
  way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|pedestrian|service|track)$"];
  way["railway"~"^(rail|light_rail|funicular)$"];
  way["waterway"~"^(river|stream|canal)$"];
  way["natural"="water"]; relation["natural"="water"];
  way["landuse"~"^(forest|grass|meadow|recreation_ground|cemetery|farmland|orchard|vineyard|residential|commercial|retail|industrial|construction|brownfield|religious)$"];
  relation["landuse"~"^(forest|grass|meadow|recreation_ground|cemetery|farmland|orchard|vineyard|residential|commercial|retail|industrial)$"];
  way["natural"~"^(wood|scrub|grassland|heath)$"]; relation["natural"~"^(wood|scrub)$"];
  way["leisure"~"^(park|garden|pitch|stadium|sports_centre|golf_course|track)$"]; relation["leisure"~"^(park|garden|stadium)$"];
  way["amenity"~"^(hospital|university|school|college)$"];
);
out geom;`,
  // What's walked or cycled, which the world draws in the open world's area (task 050), and the ways
  // `base` leaves out (a street being built, one of no known class, a bus lane of its own), for the
  // street audit (tools/audit.mjs). Squares mapped as a multipolygon too.
  paths: `[out:json][timeout:180][bbox:${BOX}];
(
  way["highway"~"^(footway|path|steps|cycleway|bridleway|construction|road|busway)$"];
  relation["highway"="pedestrian"];
);
out geom;`,
  // What stands between a street and what's beside it (task 013): walls, fences, hedges, railings
  // and guard rails, as ways, and the gates in them, as nodes (and a gate mapped as a way across a
  // drive). Bollards and kerbs are left to the street furniture (task 020) and the streets. And the car
  // parks, where what the LiDAR sees standing in a row is cars, not a wall (tools/walls.mjs), and which
  // the world paints as ground of their own (task 016).
  barriers: `[out:json][timeout:180][bbox:${BOX}];
(
  way["barrier"]["barrier"!~"^(kerb|bollard|block|cycle_barrier|planter|tree|step)$"];
  way["amenity"="parking"]; relation["amenity"="parking"];
  node["barrier"~"^(gate|lift_gate|swing_gate|sliding_gate|wicket_gate|entrance|kissing_gate|turnstile|full-height_turnstile|chain|rope|border_control|toll_booth)$"];
);
out geom;`,
  // Buildings, the big ones mapped in parts (a multipolygon, like the Altice Forum) too.
  buildings:`[out:json][timeout:180][bbox:${BOX}];
(
  way["building"];
  relation["building"];
);
out geom;`,
  // The parishes, and the municipality round them.
  admin: `[out:json][timeout:120];
relation["boundary"="administrative"]["admin_level"~"^(7|8)$"](${BOX});
out geom;`,
  // Single trees and rows of them, for the scenery round the track.
  trees: `[out:json][timeout:120][bbox:${BOX}];
(
  node["natural"="tree"];
  way["natural"="tree_row"];
);
out geom;`,
  // What's along the streets: crossings, traffic lights, bus stops.
  street: `[out:json][timeout:120][bbox:${BOX}];
(
  node["highway"~"^(crossing|traffic_signals|bus_stop)$"];
  node["crossing"];
);
out;`,
  // The turns the map bans or makes the only one (no left turn, only straight on), for the routes
  // the tracks take: their ways and nodes by id, as in `base`.
  restrictions: `[out:json][timeout:120][bbox:${BOX}];
relation["type"="restriction"];
out body;`,
  // The shops, cafés, banks, offices and workshops with a name, for the signs over their ground
  // floors (task 017).
  shops: `[out:json][timeout:120][bbox:${BOX}];
(
  nwr["shop"]["name"];
  nwr["amenity"~"^(cafe|restaurant|bar|pub|fast_food|ice_cream|bank|pharmacy|clinic|dentist|doctors|veterinary|post_office|fuel|car_wash|driving_school|bureau_de_change|cinema|nightclub)$"]["name"];
  nwr["office"]["name"];
  nwr["craft"]["name"];
  nwr["healthcare"]["name"];
);
out center tags;`,
  // Places with a name that might be landmarks. build.mjs picks its list from these by name.
  pois: `[out:json][timeout:120][bbox:${BOX}];
(
  nwr["wikidata"]["tourism"]; nwr["wikidata"]["historic"]; nwr["wikidata"]["amenity"];
  nwr["wikidata"]["leisure"]; nwr["wikidata"]["building"]; nwr["wikidata"]["man_made"];
  nwr["wikidata"]["shop"]; nwr["wikidata"]["railway"]; nwr["wikidata"]["natural"];
  nwr["wikidata"]["place"="square"]; nwr["wikidata"]["highway"="pedestrian"];
  nwr["tourism"~"^(attraction|museum|viewpoint|artwork)$"]["name"];
  nwr["historic"]["name"];
  nwr["name"~"Sameiro|Bom Jesus|Picoto|Sete Fontes|Theatro Circo|Avenida Central|Praça da República|Santa Bárbara|Biscainhos|Alto da Cividade|Fonte do Ídolo|Altice Forum|1.º de Maio|Parque da Ponte"];
);
out center tags;`,
  // What stands in a square or a roundabout's island, named or not: statues and other artworks,
  // fountains, monuments and memorials, obelisks and crosses (roundabouts.mjs, task 014).
  art: `[out:json][timeout:120][bbox:${BOX}];
(
  nwr["tourism"="artwork"]; nwr["amenity"="fountain"];
  nwr["historic"~"^(memorial|monument|statue)$"]; nwr["man_made"~"^(obelisk|cross)$"];
);
out center tags;`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The public Overpass server is often busy, and then answers with an HTML error page, sometimes
// with status 200, so a reply only counts if it's JSON.
async function overpass(name, query) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    const text = await res.text();
    if (res.ok && text.trimStart().startsWith('{')) {
      fs.writeFileSync(path.join(cache, 'osm', name + '.json'), text);
      console.log(`${name}: ${(text.length / 1e6).toFixed(1)} MB`);
      return;
    }
    console.log(`${name}: the server is busy, trying again (${attempt})`);
    await sleep(15000 * attempt);
  }
  throw new Error(`Overpass didn't answer for ${name}. Try again later.`);
}

const only = process.argv.slice(2);
const wanted = (name) => !only.length || only.includes(name);
for (const [name, query] of Object.entries(QUERIES)) {
  if (!wanted(name)) continue;
  await overpass(name, query);
  await sleep(3000);
}

// Terrain tiles at zoom 14 (about 7 m a pixel here) covering the box.
const Z = 14;
const tileX = (lon) => Math.floor(((lon + 180) / 360) * 2 ** Z);
const tileY = (lat) => { const r = (lat * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z); };
let n = 0;
for (let y = tileY(N); y <= tileY(S) && wanted('dem'); y++) {
  for (let x = tileX(W); x <= tileX(E); x++) {
    const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`Elevation tile ${x}/${y}: ${res.status}`);
    fs.writeFileSync(path.join(cache, 'dem', `${Z}_${x}_${y}.png`), Buffer.from(await res.arrayBuffer()));
    n++;
  }
}
if (n) console.log(`elevation: ${n} tiles`);

// The horizon: coarser tiles (zoom 11, about 60 m a pixel) 16 km round, for the hills seen from the
// track beyond the map's own box.
const HZ = 11, lat0 = (S + N) / 2, lon0 = (W + E) / 2, dLat = 16 / 111, dLon = 16 / 83;
const hx = (lon) => Math.floor(((lon + 180) / 360) * 2 ** HZ);
const hy = (lat) => { const r = (lat * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** HZ); };
let m = 0;
for (let y = hy(lat0 + dLat); y <= hy(lat0 - dLat) && wanted('horizon'); y++) {
  for (let x = hx(lon0 - dLon); x <= hx(lon0 + dLon); x++) {
    const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${HZ}/${x}/${y}.png`, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`Elevation tile ${x}/${y}: ${res.status}`);
    fs.writeFileSync(path.join(cache, 'dem', `${HZ}_${x}_${y}.png`), Buffer.from(await res.arrayBuffer()));
    m++;
  }
}
if (m) console.log(`horizon: ${m} tiles`);

// ---- Microsoft's building footprints, only when named ----

// Found by machine learning in aerial imagery (docs/SOURCES.md), for the buildings OpenStreetMap
// lacks (tools/roofs.mjs, task 011): Portugal's files for the level-9 quadkeys over the box, each
// gzipped GeoJSON, a feature a line. Only the outlines inside the box are kept, as rings of
// [lon, lat], in .cache/microsoft.json.
if (only.includes('microsoft')) {
  const zlib = await import('node:zlib');
  const quadkey = (lat, lon, z) => {
    const n = 2 ** z, x = Math.floor(((lon + 180) / 360) * n), r = (lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
    let q = '';
    for (let i = z; i > 0; i--) q += ((x >> (i - 1)) & 1) + 2 * ((y >> (i - 1)) & 1);
    return q;
  };
  const keys = new Set([[S, W], [S, E], [N, W], [N, E]].map(([lat, lon]) => quadkey(lat, lon, 9)));
  const res = await fetch('https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv', { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`Microsoft's dataset links: ${res.status}`);
  const links = (await res.text()).split('\n').map((l) => l.split(',')).filter(([where, key]) => where === 'Portugal' && keys.has(key));
  const rings = [];
  for (const [, key, url, size] of links) {
    const got = await fetch(url, { headers: { 'user-agent': UA } });
    if (!got.ok) throw new Error(`Microsoft's footprints ${key}: ${got.status}`);
    const lines = zlib.gunzipSync(Buffer.from(await got.arrayBuffer())).toString('utf8').split('\n');
    let kept = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      const g = JSON.parse(line).geometry, ring = g.type === 'Polygon' ? g.coordinates[0] : null;
      if (!ring || !ring.some(([lon, lat]) => lat > S && lat < N && lon > W && lon < E)) continue;
      rings.push(ring.map(([lon, lat]) => [Math.round(lon * 1e7) / 1e7, Math.round(lat * 1e7) / 1e7]));
      kept++;
    }
    console.log(`microsoft: quadkey ${key}, ${size}: ${kept} of ${lines.length} footprints in the box`);
  }
  fs.writeFileSync(path.join(cache, 'microsoft.json'), JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), rings }));
}

// ---- DGT's open data, only when named ----

const dgtParts = ['lidar', 'ortho', 'nir', 'cos'].filter((p) => only.includes(p));
if (dgtParts.length) {
  const { DGT, ORTHO_PX, fromTM, tileBox, tileKey, tilesOver, toTM } = await import('./dgt.mjs');
  const { EXT } = await import('./sections.mjs');
  const amigos = (await import('../tracks/amigos.js')).default;
  fs.mkdirSync(DGT, { recursive: true });

  // Where the detail goes first (decision 003): the box a game draws round the Volta dos Amigos,
  // and the shooter's streets in Fujacal.
  const boxTiles = tilesOver(amigos.box);
  // The whole map, and 200 m round it, for the terrain at 2 m.
  const mapTiles = tilesOver({ x0: EXT.x0 - 200, x1: EXT.x1 + 200, z0: EXT.z0 - 200, z1: EXT.z1 + 200 });
  // The point cloud is heavier (about 120 MB a tile): over the whole map, for every building's
  // height and roof (tools/roofs.mjs); its tiles hold the route, the shooter's area and the map's
  // (0, 0), for the check in test/sources.test.js.
  const lazTiles = tilesOver(EXT);

  // The orthophoto, 25 cm, from DGT's WMS: a JPEG per tile, on the LiDAR's own tiles. (The
  // cloud-optimised GeoTIFFs it's made from need the CDD's account; the WMS doesn't.)
  const WMS = 'https://cartografia.dgterritorio.gov.pt/wms/ortos2025?service=WMS&version=1.3.0&request=GetMap&layers=Ortos2025-RGB&styles=&format=image/jpeg';
  const getJPEG = async (url, what) => {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      const buf = Buffer.from(await res.arrayBuffer());
      if (res.ok && buf[0] === 0xff && buf[1] === 0xd8) return buf;
      if (attempt === 4) throw new Error(`${what}: the WMS answered ${res.status} ${buf.subarray(0, 200)}`);
      await sleep(10000 * attempt);
    }
  };
  if (dgtParts.includes('ortho')) {
    const dir = path.join(DGT, 'ortho');
    fs.mkdirSync(dir, { recursive: true });
    let got = 0, bytes = 0;
    for (const key of lazTiles) {
      const file = path.join(dir, key + '.jpg');
      if (fs.existsSync(file)) continue;
      const b = tileBox(key);
      const buf = await getJPEG(`${WMS}&crs=EPSG:3763&bbox=${b.e0},${b.n0},${b.e1},${b.n1}&width=${ORTHO_PX}&height=${ORTHO_PX}`, `orthophoto ${key}`);
      fs.writeFileSync(file, buf);
      got++, bytes += buf.length;
      await sleep(1000);
    }
    // A cut 80 m across round the map's (0, 0), in latitude and longitude, which DGT's server
    // projects with its own software: the test checks the tiles above against it.
    const C = 80, px = 320, dLat = C / KZ / 2, dLon = C / KX / 2;
    fs.writeFileSync(path.join(dir, 'check-4326.jpg'), await getJPEG(`${WMS}&crs=EPSG:4326&bbox=${LAT0 - dLat},${LON0 - dLon},${LAT0 + dLat},${LON0 + dLon}&width=${px}&height=${px}`, 'the check'));
    fs.writeFileSync(path.join(dir, 'check-4326.json'), JSON.stringify({ lat0: LAT0, lon0: LON0, size: C, px }));
    console.log(`ortho: ${got} tiles, ${(bytes / 1e6).toFixed(0)} MB (${lazTiles.length} over the map)`);
  }

  // Its near-infrared, for telling plants from paint (task 016): the WMS's IRG layer, the same photo
  // with the near-infrared as its red, the red as its green and the green as its blue, on the same
  // tiles.
  if (dgtParts.includes('nir')) {
    const dir = path.join(DGT, 'ortho-irg');
    fs.mkdirSync(dir, { recursive: true });
    let got = 0, bytes = 0;
    for (const key of lazTiles) {
      const file = path.join(dir, key + '.jpg');
      if (fs.existsSync(file)) continue;
      const b = tileBox(key);
      const buf = await getJPEG(`${WMS.replace('Ortos2025-RGB', 'Ortos2025-IRG')}&crs=EPSG:3763&bbox=${b.e0},${b.n0},${b.e1},${b.n1}&width=${ORTHO_PX}&height=${ORTHO_PX}`, `near-infrared ${key}`);
      fs.writeFileSync(file, buf);
      got++, bytes += buf.length;
      await sleep(1000);
    }
    console.log(`nir: ${got} tiles, ${(bytes / 1e6).toFixed(0)} MB (${lazTiles.length} over the map)`);
  }

  // The land use, COS2025, from DGT's OGC API: every polygon over the map's box, as GeoJSON.
  if (dgtParts.includes('cos')) {
    const features = [];
    let url = `https://ogcapi.dgterritorio.gov.pt/collections/cos2025v1/items?f=json&bbox=${W},${S},${E},${N}&limit=200`;
    while (url) {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`COS2025: ${res.status} ${(await res.text()).slice(0, 200)}`);
      const page = await res.json();
      features.push(...page.features);
      url = page.features.length ? page.links.find((l) => l.rel === 'next')?.href : null;
    }
    const text = JSON.stringify({ type: 'FeatureCollection', features });
    fs.writeFileSync(path.join(DGT, 'cos2025.json'), text);
    console.log(`cos: ${features.length} areas, ${(text.length / 1e6).toFixed(1)} MB`);
  }

  // The LiDAR: the terrain and surface models at 50 cm over the box, the terrain at 2 m over the
  // whole map, and the point cloud on the tiles above. DGT's tile index is open; the downloads need
  // the CDD's account.
  if (dgtParts.includes('lidar')) {
    const cdd = await cddLogin();
    const want = { 'MDT-50cm': ['.tif', boxTiles], 'MDS-50cm': ['.tif', boxTiles], 'MDT-2m': ['.tif', mapTiles], LAZ: ['.laz', lazTiles] };
    const record = {};
    for (const [collection, [ext, keys]] of Object.entries(want)) {
      const items = await cddTiles(cdd, collection, keys);
      fs.mkdirSync(path.join(DGT, collection), { recursive: true });
      let got = 0, bytes = 0;
      for (const key of keys) {
        const it = items.get(key);
        if (!it) throw new Error(`${collection}: DGT has no tile at ${key}`);
        const file = path.join(DGT, collection, key + ext);
        if (!(fs.existsSync(file) && fs.statSync(file).size === it.size)) {
          await cdd.download(async (fresh) => (fresh ? (await cddTiles(cdd, collection, [key])).get(key) : it).href, file, it.size);
          got++, bytes += it.size;
          await sleep(2000);
        }
        (record[collection] ??= {})[key] = { id: it.id, size: it.size, published: it.published };
      }
      console.log(`${collection}: ${got} tiles, ${(bytes / 1e6).toFixed(0)} MB (${keys.length} wanted)`);
    }
    // Which of DGT's tiles, and which version, each file is.
    fs.writeFileSync(path.join(DGT, 'lidar.json'), JSON.stringify(record, null, 1));
  }

  // DGT's tiles in a collection, by their key here: id, size, when published and the CDD's link,
  // which the CDD makes anew for each search, so the search is made in the session that downloads.
  async function cddTiles(cdd, collection, keys) {
    const corners = keys.flatMap((k) => { const b = tileBox(k); return [unP(...fromTM(b.e0, b.n0)), unP(...fromTM(b.e1, b.n1))]; });
    const lats = corners.map((c) => c[0]), lons = corners.map((c) => c[1]);
    const found = await cdd.search({ collections: [collection], bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)], limit: 200 });
    // Each tile by its centre, from its bbox in longitude and latitude: the one field every
    // collection has (the models give no `proj:bbox`, and their `proj:geometry` isn't in EPSG:3763).
    // The point cloud's bbox has heights too: [w, s, low, e, n, high].
    const items = new Map();
    for (const f of found.features) {
      const b = f.bbox, [w, s, e, n] = b.length === 6 ? [b[0], b[1], b[3], b[4]] : b;
      items.set(tileKey(...toTM(...P({ lat: (s + n) / 2, lon: (w + e) / 2 }))), { id: f.id, size: f.properties['file:size'], published: f.properties.published, href: f.assets.data.href });
    }
    return items;
  }
}

// The CDD's downloads need its free account: a login on its Keycloak, then a session cookie that
// lasts half an hour. The username and password are the owner's, kept out of git in
// .cache/credentials.json as { "cdd": { "username": "…", "password": "…" } }.
async function cddLogin() {
  const file = path.join(cache, 'credentials.json');
  const { username, password } = (fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8')).cdd) || {};
  if (!username || !password) throw new Error(`The LiDAR needs a free account at https://cdd.dgterritorio.gov.pt: put { "cdd": { "username": "…", "password": "…" } } in ${file}.`);
  const jar = new Map();
  // One request with only the headers given, not fetch(): fetch adds `sec-fetch-mode: cors` to
  // every request, can't be told not to, and the CDD answers a download that has it with a 500.
  const request = (url, { method = 'GET', headers = {}, body } = {}) => new Promise((ok, no) => {
    const req = https.request(url, { method, headers: body ? { ...headers, 'content-length': Buffer.byteLength(body) } : headers }, ok);
    req.on('error', no);
    req.end(body);
  });
  const text = async (res) => { let s = ''; for await (const c of res) s += c; return s; };
  const ok = (res) => res.statusCode >= 200 && res.statusCode < 300;
  // A request that follows redirects itself, sending each host only its own cookies.
  async function go(url, init = {}) {
    for (let hop = 0; hop < 12; hop++) {
      const host = new URL(url).host, cookies = jar.get(host) ?? new Map();
      const headers = { 'user-agent': UA, accept: '*/*', ...init.headers };
      if (cookies.size) headers.cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
      const res = await request(url, { ...init, headers });
      for (const c of res.headers['set-cookie'] ?? []) {
        const [pair, ...attrs] = c.split(';'), i = pair.indexOf('='), name = pair.slice(0, i).trim(), value = pair.slice(i + 1).trim();
        if (!value || attrs.some((a) => /^\s*max-age=0\s*$/i.test(a))) cookies.delete(name);
        else cookies.set(name, value);
      }
      jar.set(host, cookies);
      const to = res.headers.location;
      if (res.statusCode >= 300 && res.statusCode < 400 && to) {
        res.resume();
        url = new URL(to, url).href;
        init = {};
        continue;
      }
      return { res, url };
    }
    throw new Error(`Too many redirects from ${url}`);
  }
  async function login() {
    const page = await go('https://cdd.dgterritorio.gov.pt/auth/login');
    // Still logged in: the CDD sends the login straight back to itself.
    if (new URL(page.url).host === 'cdd.dgterritorio.gov.pt') return void page.res.resume();
    const html = await text(page.res);
    const form = html.match(/<form\b[^>]*\bid="kc-form-login"[^>]*>([\s\S]*?)<\/form>/);
    const action = form?.[0].match(/\baction="([^"]+)"/)?.[1].replaceAll('&amp;', '&');
    if (!action) throw new Error(`The CDD's login page isn't what fetch.mjs knows (${page.url}).`);
    const fields = new URLSearchParams();
    for (const [input] of form[1].matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)) fields.set(input.match(/\bname="([^"]*)"/)?.[1] ?? '', input.match(/\bvalue="([^"]*)"/)?.[1] ?? '');
    fields.set('username', username);
    fields.set('password', password);
    const done = await go(action, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: fields.toString() });
    done.res.resume();
    if (new URL(done.url).host !== 'cdd.dgterritorio.gov.pt') throw new Error(`The CDD didn't accept the username and password in ${file}.`);
  }
  await login();
  console.log('lidar: logged in to the CDD');
  return {
    // The CDD's tile index, in the session.
    async search(query) {
      const { res } = await go('https://cdd.dgterritorio.gov.pt/dgt-be/v1/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(query) });
      const body = await text(res);
      if (!ok(res)) throw new Error(`The CDD's tile index: ${res.statusCode} ${body.slice(0, 200)}`);
      return JSON.parse(body);
    },
    // A tile to a file, from link(fresh), its link: the CDD sends it on to the file's own signed
    // link on its storage. Each link works once, so a try after the first asks for a fresh one. A
    // trip to the login means the session ran out: log in again. Other errors: wait and try again,
    // then say what the server said.
    async download(link, to, size) {
      let said = '';
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { res, url } = await go(await link(attempt > 1)), type = res.headers['content-type'] ?? '';
        if (ok(res) && !/^(text\/html|application\/json)/.test(type)) {
          await pipeline(res, fs.createWriteStream(to + '.part'));
          if (fs.statSync(to + '.part').size === size) return fs.renameSync(to + '.part', to);
          said = `${fs.statSync(to + '.part').size} bytes of ${size}`;
          fs.rmSync(to + '.part');
        } else if (new URL(url).host === 'auth.cdd.dgterritorio.gov.pt') {
          res.resume();
          said = 'it asked for the login again';
          await login();
        } else {
          said = `${res.statusCode} ${(await text(res)).slice(0, 200)}`;
          await sleep(10000 * attempt);
        }
      }
      throw new Error(`The CDD wouldn't give ${path.basename(to)}: ${said}`);
    },
  };
}
