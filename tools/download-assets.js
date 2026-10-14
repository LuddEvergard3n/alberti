/**
 * tools/download-assets.js
 * Alberti — Museu Interativo de Arte
 *
 * Baixa as imagens reais para assets/ e substitui os SVG placeholder.
 *
 * Uso (uma única vez, dentro da pasta alberti/):
 *   node tools/download-assets.js
 *
 * Requer Node.js 18+ e acesso à internet.
 * Sem dependências npm.
 *
 * Notas sobre o Wikimedia:
 *   - Limite de taxa: máx ~5 req/s. Este script usa 1 req/1.5s.
 *   - Em caso de 429: aguarda 10s e tenta novamente (2 tentativas).
 *   - Em caso de 404: verifique a URL no array DOWNLOADS abaixo.
 */

'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const ROOT = path.join(__dirname, '..');

// Pausa entre requisições (ms) — respeitar rate limit do Wikimedia
const DELAY_MS       = 1500;
// Pausa após 429 (ms)
const RETRY_DELAY_MS = 10000;
// Máximo de tentativas por arquivo
const MAX_RETRIES    = 2;

const DOWNLOADS = [
  // ── Obras (alta resolução) ──────────────────────────────────────────
  {
    dest: 'assets/artworks/last-supper.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/%C3%9Altima_Cena_-_Da_Vinci_5.jpg/1280px-%C3%9Altima_Cena_-_Da_Vinci_5.jpg',
  },
  {
    dest: 'assets/artworks/mona-lisa.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
  },
  {
    dest: 'assets/artworks/creation-of-adam.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/1280px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg',
  },
  {
    dest: 'assets/artworks/school-of-athens.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/School_of_Athens_by_Raffaello.jpg/1280px-School_of_Athens_by_Raffaello.jpg',
  },
  {
    dest: 'assets/artworks/sistine-ceiling.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Sistine_Chapel_ceiling_photo_2.jpg/1280px-Sistine_Chapel_ceiling_photo_2.jpg',
  },
  {
    dest: 'assets/artworks/vitruvian-man.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg/800px-Da_Vinci_Vitruve_Luc_Viatour.jpg',
  },

  // ── Thumbnails (400px para grids e cards) ───────────────────────────
  {
    dest: 'assets/thumbnails/last-supper.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/%C3%9Altima_Cena_-_Da_Vinci_5.jpg/400px-%C3%9Altima_Cena_-_Da_Vinci_5.jpg',
  },
  {
    dest: 'assets/thumbnails/mona-lisa.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/300px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
  },
  {
    dest: 'assets/thumbnails/creation-of-adam.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/400px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg',
  },
  {
    dest: 'assets/thumbnails/school-of-athens.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/School_of_Athens_by_Raffaello.jpg/400px-School_of_Athens_by_Raffaello.jpg',
  },
  {
    dest: 'assets/thumbnails/sistine-ceiling.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Sistine_Chapel_ceiling_photo_2.jpg/400px-Sistine_Chapel_ceiling_photo_2.jpg',
  },
  {
    dest: 'assets/thumbnails/vitruvian-man.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg/300px-Da_Vinci_Vitruve_Luc_Viatour.jpg',
  },

  // ── Retratos de artistas ─────────────────────────────────────────────
  {
    dest: 'assets/artists/leonardo-da-vinci.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Leonardo_self_portrait_fleming.jpg/400px-Leonardo_self_portrait_fleming.jpg',
  },
  {
    dest: 'assets/artists/michelangelo.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Miguel_%C3%81ngel%2C_por_Daniele_da_Volterra_%28detalle%29.jpg/400px-Miguel_%C3%81ngel%2C_por_Daniele_da_Volterra_%28detalle%29.jpg',
  },
  {
    dest: 'assets/artists/rafael.svg',
    url:  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Raffael_043.jpg/400px-Raffael_043.jpg',
  },
];

// ─────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────

/** Pausa assíncrona em ms. */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Baixa uma URL para um arquivo, seguindo redirects.
 * Em caso de 429, espera RETRY_DELAY_MS e tenta novamente.
 *
 * @param {string} url
 * @param {string} destPath  - Path final do arquivo
 * @param {number} [redirects=0]
 * @param {number} [retries=0]
 * @returns {Promise<number>} tamanho em bytes
 */
async function downloadFile(url, destPath, redirects = 0, retries = 0) {
  if (redirects > 5) throw new Error('Muitos redirects');

  const lib     = url.startsWith('https') ? https : http;
  const tmpPath = destPath + '.tmp';

  return new Promise((resolve, reject) => {
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Accept':     'image/jpeg,image/png,image/*,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer':    'https://commons.wikimedia.org/',
      },
    }, res => {

      // Redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(downloadFile(res.headers.location, destPath, redirects + 1, retries));
      }

      // Rate limit — esperar e tentar novamente
      if (res.statusCode === 429 && retries < MAX_RETRIES) {
        res.resume();
        const wait = RETRY_DELAY_MS * (retries + 1);
        process.stdout.write(` [429, aguardando ${wait / 1000}s]`);
        return resolve(
          sleep(wait).then(() => downloadFile(url, destPath, redirects, retries + 1))
        );
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }

      const file = fs.createWriteStream(tmpPath);
      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          const size = fs.statSync(tmpPath).size;
          if (size < 5000) {
            try { fs.unlinkSync(tmpPath); } catch {}
            return reject(new Error('Resposta vazia (' + size + ' bytes)'));
          }
          fs.renameSync(tmpPath, destPath);
          resolve(size);
        });
      });

      file.on('error', err => {
        try { fs.unlinkSync(tmpPath); } catch {}
        reject(err);
      });
    });

    req.on('error', err => {
      try { fs.unlinkSync(tmpPath); } catch {}
      reject(err);
    });

    req.setTimeout(30000, () => req.destroy(new Error('Timeout')));
  });
}

/**
 * Após download bem-sucedido, substitui .svg por .jpg nos JSONs e index.html.
 *
 * @param {string[]} downloaded - Paths .svg que foram convertidos para .jpg
 */
function updateReferences(downloaded) {
  const targets = [
    'data/artworks.json',
    'data/artists.json',
    'data/periods.json',
    'index.html',
  ];

  let updated = 0;
  for (const rel of targets) {
    const fullPath = path.join(ROOT, rel);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf-8');
    const before = content;

    for (const svgDest of downloaded) {
      // "assets/artworks/mona-lisa.svg" → "assets/artworks/mona-lisa.jpg"
      content = content.split(svgDest).join(svgDest.replace('.svg', '.jpg'));
    }

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      updated++;
    }
  }

  if (updated > 0) console.log('\nReferências atualizadas em ' + updated + ' arquivo(s).');
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nAlberti — Download de imagens');
  console.log('='.repeat(40));
  console.log('Total: ' + DOWNLOADS.length + ' arquivos\n');

  const succeeded = [];
  const failed    = [];

  for (let i = 0; i < DOWNLOADS.length; i++) {
    const item    = DOWNLOADS[i];
    const svgPath = path.join(ROOT, item.dest);
    const jpgPath = svgPath.replace('.svg', '.jpg');
    const label   = item.dest.replace('assets/', '');

    // Já existe como JPG válido — pular
    if (fs.existsSync(jpgPath) && fs.statSync(jpgPath).size > 5000) {
      console.log('  SKIP  ' + label.replace('.svg', '.jpg'));
      succeeded.push(item.dest);
      continue;
    }

    process.stdout.write('  ...   ' + label);

    try {
      const size = await downloadFile(item.url, svgPath);
      // Renomear para .jpg (é um JPEG, não SVG)
      fs.renameSync(svgPath, jpgPath);
      // Apagar o SVG placeholder que tinha o mesmo nome
      if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);

      const kb = Math.round(size / 1024);
      process.stdout.write('\r  OK    ' + label.replace('.svg', '.jpg') + ' (' + kb + ' KB)\n');
      succeeded.push(item.dest);
    } catch (err) {
      process.stdout.write('\r  FAIL  ' + label + ' — ' + err.message + '\n');
      failed.push({ dest: item.dest, error: err.message });
    }

    // Pausa entre requisições para não atingir rate limit
    if (i < DOWNLOADS.length - 1) await sleep(DELAY_MS);
  }

  if (succeeded.length > 0) updateReferences(succeeded);

  console.log('\n' + '='.repeat(40));
  console.log('OK: ' + succeeded.length + '   Falhas: ' + failed.length);

  if (failed.length > 0) {
    console.log('\nArquivos com falha (SVG placeholder mantido):');
    failed.forEach(f => console.log('  ' + f.dest + ': ' + f.error));
    console.log('\nPara tentar novamente apenas as falhas, rode o script de novo.');
    console.log('Arquivos já baixados serão ignorados (SKIP).');
  }

  console.log('\nPronto. Inicie com: node server.js\n');
}

main().catch(err => {
  console.error('\nErro fatal:', err.message);
  process.exit(1);
});
