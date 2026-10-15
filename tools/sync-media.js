'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const ROOT = path.resolve(__dirname, '..');
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'media.json'), 'utf8'));
const API = 'https://commons.wikimedia.org/w/api.php';
const DELAY_MS = 1800;
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (response.status !== 429 || attempt === MAX_RETRIES) return response;
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 12000 * (attempt + 1));
  }
  throw new Error('Tentativas de download esgotadas');
}

function ensureInsideRoot(target) {
  const resolved = path.resolve(ROOT, target);
  if (!resolved.startsWith(ROOT + path.sep)) throw new Error(`Destino fora do projeto: ${target}`);
  return resolved;
}

function fileType(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 12).toString('ascii', 0, 4) === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

async function getImageInfo(fileTitle, width) {
  const query = new URLSearchParams({
    action: 'query',
    titles: `File:${fileTitle}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*',
  });
  const response = await fetchWithRetry(`${API}?${query}`, { headers: { 'User-Agent': 'AlbertiMuseum/2.0 (educational static site)' } });
  if (!response.ok) throw new Error(`Consulta de mídia: HTTP ${response.status}`);
  const body = await response.json();
  const page = Object.values(body.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl || !info?.descriptionurl) throw new Error('Arquivo não encontrado no Wikimedia Commons');
  return { thumburl: info.thumburl, descriptionurl: info.descriptionurl };
}

async function download(url, destination) {
  const response = await fetchWithRetry(url, { headers: { 'User-Agent': 'AlbertiMuseum/2.0 (educational static site)' } });
  if (!response.ok || !response.body) throw new Error(`Download: HTTP ${response.status}`);
  const temporary = `${destination}.part`;
  await pipeline(response.body, fs.createWriteStream(temporary));
  const file = fs.readFileSync(temporary);
  const mime = fileType(file);
  if (!mime || file.length < 5000) {
    fs.rmSync(temporary, { force: true });
    throw new Error('Arquivo recebido não é uma imagem válida');
  }
  fs.renameSync(temporary, destination);
  return { bytes: file.length, sha256: crypto.createHash('sha256').update(file).digest('hex'), mime };
}

async function syncVariant(item, width, destination) {
  const fullPath = ensureInsideRoot(destination);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const info = await getImageInfo(item.commonsFile, width);
  const result = await download(info.thumburl, fullPath);
  return { ...result, sourceUrl: info.descriptionurl, imageUrl: info.thumburl, width: info.thumbwidth, height: info.thumbheight };
}

async function main() {
  const report = [];
  const selectedIds = new Set(process.argv.slice(2));
  const queue = (selectedIds.size ? MEDIA.filter(item => selectedIds.has(item.id)) : MEDIA)
    .filter(item => item.status !== 'pending' && item.commonsFile);
  if (selectedIds.size && queue.length !== selectedIds.size) throw new Error('Há IDs de mídia desconhecidos.');
  for (const item of queue) {
    try {
      const artworkTarget = ensureInsideRoot(item.artworkPath);
      const thumbnailTarget = ensureInsideRoot(item.thumbnailPath);
      const artworkCandidate = `${artworkTarget}.candidate`;
      const thumbnailCandidate = `${thumbnailTarget}.candidate`;
      const artwork = await syncVariant(item, 2200, `${item.artworkPath}.candidate`);
      await sleep(DELAY_MS);
      const thumbnail = await syncVariant(item, 560, `${item.thumbnailPath}.candidate`);
      fs.renameSync(artworkCandidate, artworkTarget);
      fs.renameSync(thumbnailCandidate, thumbnailTarget);
      report.push({ id: item.id, status: 'ok', artwork, thumbnail });
      console.log(`OK ${item.id}`);
    } catch (error) {
      for (const target of [item.artworkPath, item.thumbnailPath]) {
        fs.rmSync(`${ensureInsideRoot(target)}.candidate`, { force: true });
        fs.rmSync(`${ensureInsideRoot(target)}.candidate.part`, { force: true });
      }
      report.push({ id: item.id, status: 'failed', error: error.message });
      console.error(`FAIL ${item.id}: ${error.message}`);
    }
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'media-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (report.some(item => item.status !== 'ok')) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
