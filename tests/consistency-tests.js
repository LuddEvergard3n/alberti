/**
 * consistency-tests.js
 * Alberti — Museu Interativo de Arte
 *
 * Testes de consistência entre os arquivos JSON.
 *
 * Verifica referências cruzadas:
 *   - artwork.artist → deve existir em artists.json
 *   - artwork.period → deve existir em periods.json
 *   - module.artwork_ids[*] → devem existir em artworks.json
 *   - lesson.artwork_ids[*] → devem existir em artworks.json
 *   - lesson.exercise_ids[*] → devem existir em exercises.json
 *   - comparison.artwork_ids[*] → devem existir em artworks.json
 *   - exercise.artwork_id → deve existir em artworks.json (se presente)
 */

'use strict';

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { test, assert, group } from './test-runner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = resolve(__dirname, '../data');

function loadJSON(filename) {
  return JSON.parse(readFileSync(resolve(DATA_DIR, filename), 'utf-8'));
}

export async function runConsistencyTests() {
  const artworks   = loadJSON('artworks.json');
  const artists    = loadJSON('artists.json');
  const periods    = loadJSON('periods.json');
  const modules    = loadJSON('modules.json');
  const exercises  = loadJSON('exercises.json');
  const comparisons= loadJSON('comparisons.json');
  const lessons    = loadJSON('lessons.json');

  const artworkIds  = new Set(artworks.map(a => a.id));
  const artistIds   = new Set(artists.map(a => a.id));
  const periodIds   = new Set(periods.map(p => p.id));
  const exerciseIds = new Set(exercises.map(e => e.id));

  group('Consistência: artworks → artists', () => {
    test('artwork.artist referencia artista existente', () => {
      for (const artwork of artworks) {
        assert(
          artistIds.has(artwork.artist),
          `obra "${artwork.id}": artist "${artwork.artist}" não encontrado em artists.json`
        );
      }
    });
  });

  group('Consistência: artworks → periods', () => {
    test('artwork.period referencia período existente', () => {
      for (const artwork of artworks) {
        assert(
          periodIds.has(artwork.period),
          `obra "${artwork.id}": period "${artwork.period}" não encontrado em periods.json`
        );
      }
    });
  });

  group('Consistência: modules (rooms) → artworks', () => {
    test('artwork_ids em salas referenciam obras existentes', () => {
      const rooms = modules.filter(m => m.type === 'room');
      for (const room of rooms) {
        for (const id of (room.artwork_ids || [])) {
          assert(
            artworkIds.has(id),
            `sala "${room.id}": artwork_id "${id}" não encontrado em artworks.json`
          );
        }
      }
    });
  });

  group('Consistência: lessons → artworks', () => {
    test('artwork_ids em lições referenciam obras existentes', () => {
      for (const lesson of lessons) {
        for (const id of (lesson.artwork_ids || [])) {
          assert(
            artworkIds.has(id),
            `lição "${lesson.id}": artwork_id "${id}" não encontrado em artworks.json`
          );
        }
      }
    });

    test('exercise_ids em lições referenciam exercícios existentes', () => {
      for (const lesson of lessons) {
        for (const id of (lesson.exercise_ids || [])) {
          assert(
            exerciseIds.has(id),
            `lição "${lesson.id}": exercise_id "${id}" não encontrado em exercises.json`
          );
        }
      }
    });
  });

  group('Consistência: comparisons → artworks', () => {
    test('artwork_ids em comparações referenciam obras existentes', () => {
      for (const comp of comparisons) {
        for (const id of (comp.artwork_ids || [])) {
          assert(
            artworkIds.has(id),
            `comparação "${comp.id}": artwork_id "${id}" não encontrado em artworks.json`
          );
        }
      }
    });
  });

  group('Consistência: exercises → artworks', () => {
    test('artwork_id em exercícios referencia obra existente (quando presente)', () => {
      for (const ex of exercises) {
        if (ex.artwork_id) {
          assert(
            artworkIds.has(ex.artwork_id),
            `exercício "${ex.id}": artwork_id "${ex.artwork_id}" não encontrado em artworks.json`
          );
        }
      }
    });
  });

  group('Consistência: artistas produtores têm obras', () => {
    test('cada artista produtor em artists.json tem ao menos uma obra em artworks.json', () => {
      for (const artist of artists) {
        if (artist.catalogue_role) continue;
        const has = artworks.some(a => a.artist === artist.id);
        assert(has, `artista "${artist.id}" não tem nenhuma obra em artworks.json`);
      }
    });
  });
}
