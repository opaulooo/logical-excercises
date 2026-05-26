const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function safeJoin(root, requestedPath) {
  const normalized = path.normalize(requestedPath).replace(/^([/\\])+/, '');
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) {
    return null;
  }
  return full;
}

function handleSave(req, res) {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 10 * 1024 * 1024) {
      req.destroy();
    }
  });

  req.on('end', async () => {
    try {
      const parsed = JSON.parse(raw || '{}');
      const relativePath = typeof parsed.path === 'string' ? parsed.path : '';
      const content = typeof parsed.content === 'string' ? parsed.content : '';
      const target = safeJoin(ROOT, relativePath);

      if (!target) {
        sendJson(res, 400, { ok: false, error: 'Invalid path' });
        return;
      }

      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target, content, 'utf8');

      sendJson(res, 200, { ok: true, path: relativePath });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: String(error) });
    }
  });
}

function serveStatic(req, res) {
  const pathname = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = safeJoin(ROOT, pathname);

  if (!filePath) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/save') {
    handleSave(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
