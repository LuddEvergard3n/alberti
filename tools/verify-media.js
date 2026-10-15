'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'media.json'), 'utf8'));
let failed = 0;
for (const item of media) {
  if (item.status === 'pending') continue;
  for (const asset of [item.artworkPath, item.thumbnailPath]) {
    const target = path.join(ROOT, asset);
    if (!fs.existsSync(target) || fs.statSync(target).size < 5000) {
      console.error(`Ausente ou inválido: ${asset}`);
      failed++;
      continue;
    }
    console.log(`${asset} ${crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')}`);
  }
}
process.exitCode = failed ? 1 : 0;
