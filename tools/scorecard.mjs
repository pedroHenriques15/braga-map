// What goes up on the scorecard "Braga real" (task 003) when its rounds were made by sessions that
// couldn't publish it (task 064): the files the page lacks, and Claude's marks for those rounds.
//
//   node tools/scorecard.mjs files <listing>       <listing>: the page's published files, as the
//                                                  Artifact tool lists them, saved to a file
//   node tools/scorecard.mjs marks <claude.json>   <claude.json>: scores/claude, as the page's
//                                                  database gives it (ArtifactData get, out_dir)
//
// `files` writes .cache/scorecard/publish.json: the paths to add and to take off, and `parts`, the
// `files` maps to publish the page with (root .cache/scorecard), in order, each inside one publish's
// limits. Every path the page needs that isn't up goes up, the two lists always (they change with
// every round), and a path up that the page no longer needs comes off (null).
//
// `marks` takes Claude's marks waiting in .cache/scorecard/marks/<round>.json, one file a round,
// { <place>: { s, c, at } }, and writes .cache/scorecard/marks/next.json: the document with the
// rounds it hasn't got yet added, to set over scores/claude pinned to the version that was read.
// It never touches anyone else's document; a round the document already has is left as it is.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CACHE, ROOT } from './geo.mjs';

export const OUT = path.join(CACHE, 'scorecard');
// A version holds 511 files; a publish sends 255 at most, the page and each file coming off among
// them (task 062), and 64 MB: here with room for the page.
export const LIMITS = { version: 511, files: 254, bytes: 60 * 1024 * 1024 };
const MAX_NOTE = 400; // the page's, scorecard/index.html

// Every file the page reads beside it: the two lists, each place's photo, and each round's sheets.
export function needed(rounds, places) {
  const out = ['data/rounds.json', 'data/viewpoints.json', ...places.map((v) => `photos/${v.id}.jpg`)];
  for (const r of rounds) {
    if (!r.sheets?.length) throw new Error(`${r.id}: no sheets (node tools/round.mjs --pack)`);
    r.sheets.forEach((_, n) => out.push(`rounds/${r.id}-${n + 1}.jpg`));
  }
  return out;
}

// The page's files in a listing of them, whatever its layout: every path under data/, photos/ or rounds/.
export const listed = (text) => [...new Set(text.match(/\b(?:data|photos|rounds)\/[\w.\-/]+\.(?:json|jpg)\b/g) ?? [])];

// What to add and take off, and the publishes that do it: the files coming off first, so a version
// never holds more than it can, then the rest in as few publishes as the limits allow.
export function plan(need, up, size) {
  const have = new Set(up), want = new Set(need);
  const add = need.filter((f) => !have.has(f) || f.startsWith('data/'));
  const remove = up.filter((f) => !want.has(f));
  const total = up.length - remove.length + add.filter((f) => !have.has(f)).length;
  if (total > LIMITS.version) throw new Error(`${total} files: more than a version holds (${LIMITS.version})`);
  const parts = [];
  let part = Object.fromEntries(remove.map((f) => [f, null])), count = remove.length, bytes = 0;
  for (const f of add) {
    const b = size(f);
    if (b > LIMITS.bytes) throw new Error(`${f}: ${b} bytes, more than a publish sends`);
    if (count + 1 > LIMITS.files || bytes + b > LIMITS.bytes) {
      parts.push(part);
      part = {};
      count = bytes = 0;
    }
    part[f] = f;
    count++;
    bytes += b;
  }
  if (count) parts.push(part);
  return { add, remove, total, parts };
}

// Claude's document with the waiting rounds added: each must be a round the page has, with a mark
// for every place it shot and only those, each a whole 1 to 5 and a comment Claude signs, given
// after the round was shot: a round shot again since has to be marked again.
export function merge(doc, waiting, rounds) {
  const out = { ...doc, rounds: { ...(doc.rounds ?? {}) } };
  const added = [], kept = [];
  for (const [id, marks] of Object.entries(waiting)) {
    const r = rounds.find((x) => x.id === id);
    if (!r) throw new Error(`${id}: not a round of refs/rounds.json`);
    const shot = Object.keys(r.shots).sort(), got = Object.keys(marks).sort();
    const missing = shot.filter((v) => !marks[v]), extra = got.filter((v) => !r.shots[v]);
    if (missing.length || extra.length) throw new Error(`${id}: ${missing.length ? `no mark for ${missing.join(', ')}` : ''}${missing.length && extra.length ? '; ' : ''}${extra.length ? `not shot: ${extra.join(', ')}` : ''}`);
    for (const [v, e] of Object.entries(marks)) {
      if (!Number.isInteger(e.s) || e.s < 1 || e.s > 5) throw new Error(`${id}/${v}: mark ${e.s}`);
      if (typeof e.c !== 'string' || !e.c.startsWith('(Claude) ') || e.c.length > MAX_NOTE) throw new Error(`${id}/${v}: a comment Claude signs, ${MAX_NOTE} characters at most`);
      if (!(Number(e.at) > 0)) throw new Error(`${id}/${v}: no time`);
      if (r.made && Number(e.at) < Date.parse(r.made)) throw new Error(`${id}/${v}: marked before the round was shot (${r.made}): mark it again`);
    }
    if (out.rounds[id]) {
      kept.push(id);
      continue;
    }
    out.rounds[id] = Object.fromEntries(Object.entries(marks).map(([v, { s, c, at }]) => [v, { s, c, at: Number(at) }]));
    added.push(id);
  }
  return { doc: out, added, kept };
}

const average = (marks) => Object.values(marks).reduce((t, e) => t + e.s, 0) / Object.keys(marks).length;

function main() {
  const [mode, file] = process.argv.slice(2);
  const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const { rounds } = read(path.join(ROOT, 'refs', 'rounds.json'));
  const data = read(path.join(OUT, 'data', 'rounds.json')).rounds;
  // The lists beside the page are refs/rounds.json's: made again by round.mjs in this checkout.
  if (JSON.stringify(data.map((r) => r.id)) !== JSON.stringify(rounds.map((r) => r.id))) {
    throw new Error(`.cache/scorecard/data/rounds.json has ${data.map((r) => r.id).at(-1)} last, refs/rounds.json ${rounds.at(-1).id}: node tools/round.mjs --pack, on main`);
  }
  if (mode === 'files' && file) {
    const places = read(path.join(OUT, 'data', 'viewpoints.json')).viewpoints;
    const need = needed(rounds, places);
    const lost = need.filter((f) => !fs.existsSync(path.join(OUT, f)));
    if (lost.length) throw new Error(`not in .cache/scorecard: ${lost.join(' ')}`);
    const p = plan(need, listed(fs.readFileSync(file, 'utf8')), (f) => fs.statSync(path.join(OUT, f)).size);
    fs.writeFileSync(path.join(OUT, 'publish.json'), JSON.stringify(p, null, 1));
    console.log(`add ${p.add.length} (${p.add.join(' ')})`);
    console.log(`take off ${p.remove.length}${p.remove.length ? ` (${p.remove.join(' ')})` : ''}`);
    console.log(`${p.total} files beside the page after, in ${p.parts.length} publish${p.parts.length === 1 ? '' : 'es'}: .cache/scorecard/publish.json`);
  } else if (mode === 'marks' && file) {
    const dir = path.join(OUT, 'marks');
    const ids = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((f) => /^\d{4}-\d\d-\d\d-.+\.json$/.test(f)).map((f) => f.slice(0, -5));
    // A round whose task hasn't landed on main yet waits on.
    const later = ids.filter((id) => !rounds.some((r) => r.id === id));
    if (later.length) console.log(`not on main yet, left waiting: ${later.join(' ')}`);
    const waiting = Object.fromEntries(ids.filter((id) => !later.includes(id)).map((id) => [id, read(path.join(dir, `${id}.json`))]));
    const { doc, added, kept } = merge(read(file), waiting, rounds);
    fs.writeFileSync(path.join(dir, 'next.json'), JSON.stringify(doc));
    for (const id of added) console.log(`${id}: ${Object.keys(waiting[id]).length} places, ${average(waiting[id]).toFixed(2)}`);
    if (kept.length) console.log(`already in the document, left as they are: ${kept.join(' ')}`);
    console.log(added.length ? `${Object.keys(doc.rounds).length} rounds: .cache/scorecard/marks/next.json, to set over scores/claude pinned to the version read` : 'nothing to add');
  } else {
    console.error('node tools/scorecard.mjs files <listing> | marks <scores-claude.json>');
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
