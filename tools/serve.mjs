// Serves the repo, for the map page: node tools/serve.mjs, then open http://localhost:5180/map/.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT } from './geo.mjs';

const PORT = Number(process.env.PORT || 5180);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

http
  .createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    // Nothing outside the repo, and never the private waypoints.
    if (!file.startsWith(ROOT) || file.startsWith(path.join(ROOT, '.cache'))) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`The map: http://localhost:${PORT}/map/`));
