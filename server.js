/**
 * server.js
 * Alberti — Museu Interativo de Arte
 *
 * Servidor HTTP mínimo para desenvolvimento local.
 * Não requer dependências npm.
 *
 * Uso:
 *   node server.js
 *   Acesse: http://localhost:8080
 *
 * Alternativa com Python:
 *   python3 -m http.server 8080
 *
 * Por que é necessário:
 *   Browsers modernos (especialmente Firefox) bloqueiam requests
 *   cross-origin (ex: imagens do Wikimedia) quando a página é aberta
 *   diretamente via file://, por segurança (OpaqueResponseBlocking).
 *   Servir via HTTP resolve isso completamente.
 */

'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

/** Mapa de extensões para Content-Type */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ico':  'image/x-icon',
  '.md':   'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url);
  let   filePath = path.join(ROOT, parsed.pathname);

  // Se o caminho terminar em '/', servir index.html
  if (filePath.endsWith(path.sep) || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Roteamento SPA: qualquer caminho sem extensão serve o index.html
  // (para que as rotas hash funcionem ao recarregar a página)
  const ext = path.extname(filePath);
  if (!ext || !MIME[ext]) {
    filePath = path.join(ROOT, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    const contentType = MIME[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type':  contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\nAlberti — Servidor local iniciado`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`\nCtrl+C para encerrar.\n`);
});
