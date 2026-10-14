/**
 * data-tests.js
 * Alberti — Museu Interativo de Arte
 *
 * Testes de integridade dos arquivos JSON de dados.
 *
 * Verifica:
 *   - Estrutura e campos obrigatórios de cada JSON
 *   - Validade dos IDs (sem espaços, sem caracteres especiais)
 *   - Unicidade de IDs dentro de cada coleção
 *   - Formato dos campos de URL de imagem
 */

'use strict';

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { test, assert, assertEqual, assertNonEmpty, assertHasKeys, group } from './test-runner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = resolve(__dirname, '../data');

/**
 * Lê e parseia um arquivo JSON de dados.
 * Lança erro descritivo se o arquivo não existir ou for inválido.
 *
 * @param {string} filename
 * @returns {*}
 */
function loadJSON(filename) {
  const path = resolve(DATA_DIR, filename);
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    throw new Error(`Falha ao carregar ${filename}: ${err.message}`);
  }
}

/**
 * Verifica que todos os IDs de uma coleção são únicos.
 *
 * @param {Object[]} items
 * @param {string}   label
 * @returns {void}
 */
function assertUniqueIds(items, label) {
  const ids  = items.map(i => i.id);
  const seen = new Set();
  for (const id of ids) {
    assert(!seen.has(id), `${label}: ID duplicado encontrado: "${id}"`);
    seen.add(id);
  }
}

/**
 * Verifica que um ID segue o padrão slug (kebab-case).
 * Aceita apenas letras minúsculas, dígitos e hífens.
 *
 * @param {string} id
 * @param {string} context
 * @returns {void}
 */
function assertValidSlug(id, context) {
  assert(
    typeof id === 'string' && /^[a-z0-9-]+$/.test(id),
    `${context}: ID inválido "${id}" — usar apenas letras minúsculas, dígitos e hífens`
  );
}

/* =========================================================
   TESTES DE ARTWORKS
   ========================================================= */

function testArtworks(artworks) {
  group('artworks.json', () => {

    test('arquivo carregado como array', () => {
      assert(Array.isArray(artworks), 'artworks deve ser um array');
    });

    test('array não está vazio', () => {
      assertNonEmpty(artworks, 'artworks não deve estar vazio na V1');
    });

    test('todos os IDs são únicos', () => {
      assertUniqueIds(artworks, 'artworks');
    });

    test('campos obrigatórios presentes em cada obra', () => {
      const required = ['id', 'title', 'artist', 'period', 'technique', 'concepts', 'image'];
      for (const artwork of artworks) {
        assertHasKeys(artwork, required, `obra "${artwork.id || '?'}"`);
      }
    });

    test('todos os IDs são slugs válidos', () => {
      for (const artwork of artworks) {
        assertValidSlug(artwork.id, `artwork "${artwork.id}"`);
      }
    });

    test('concepts é array não-vazio em cada obra', () => {
      for (const artwork of artworks) {
        assert(
          Array.isArray(artwork.concepts) && artwork.concepts.length > 0,
          `obra "${artwork.id}": concepts deve ser array não-vazio`
        );
      }
    });

    test('image é string não-vazia em cada obra', () => {
      for (const artwork of artworks) {
        assert(
          typeof artwork.image === 'string' && artwork.image.length > 0,
          `obra "${artwork.id}": image deve ser string não-vazia`
        );
      }
    });

    test('focal_point tem x e y numéricos quando presente', () => {
      for (const artwork of artworks) {
        if (artwork.focal_point !== undefined) {
          assert(
            typeof artwork.focal_point.x === 'number' && typeof artwork.focal_point.y === 'number',
            `obra "${artwork.id}": focal_point deve ter x e y numéricos`
          );
        }
      }
    });
  });
}

/* =========================================================
   TESTES DE ARTISTS
   ========================================================= */

function testArtists(artists) {
  group('artists.json', () => {

    test('arquivo carregado como array', () => {
      assert(Array.isArray(artists), 'artists deve ser um array');
    });

    test('array não está vazio', () => {
      assertNonEmpty(artists, 'artists não deve estar vazio na V1');
    });

    test('todos os IDs são únicos', () => {
      assertUniqueIds(artists, 'artists');
    });

    test('campos obrigatórios presentes em cada artista', () => {
      const required = ['id', 'name', 'period', 'nationality'];
      for (const artist of artists) {
        assertHasKeys(artist, required, `artista "${artist.id || '?'}"`);
      }
    });

    test('todos os IDs são slugs válidos', () => {
      for (const artist of artists) {
        assertValidSlug(artist.id, `artist "${artist.id}"`);
      }
    });
  });
}

/* =========================================================
   TESTES DE PERIODS
   ========================================================= */

function testPeriods(periods) {
  group('periods.json', () => {

    test('arquivo carregado como array', () => {
      assert(Array.isArray(periods), 'periods deve ser um array');
    });

    test('array não está vazio', () => {
      assertNonEmpty(periods, 'periods não deve estar vazio');
    });

    test('todos os IDs são únicos', () => {
      assertUniqueIds(periods, 'periods');
    });

    test('campos obrigatórios presentes em cada período', () => {
      const required = ['id', 'title', 'short_description'];
      for (const period of periods) {
        assertHasKeys(period, required, `período "${period.id || '?'}"`);
      }
    });
  });
}

/* =========================================================
   TESTES DE MODULES
   ========================================================= */

function testModules(modules) {
  group('modules.json', () => {

    test('arquivo carregado como array', () => {
      assert(Array.isArray(modules), 'modules deve ser um array');
    });

    test('todos os IDs são únicos', () => {
      assertUniqueIds(modules, 'modules');
    });

    test('campo type presente e válido em cada módulo', () => {
      const validTypes = ['concept', 'room', 'lesson'];
      for (const mod of modules) {
        assert(
          validTypes.includes(mod.type),
          `módulo "${mod.id}": type "${mod.type}" inválido — esperado: ${validTypes.join(', ')}`
        );
      }
    });

    test('salas têm room_number', () => {
      const rooms = modules.filter(m => m.type === 'room');
      for (const room of rooms) {
        assert(
          room.room_number !== undefined,
          `sala "${room.id}": room_number obrigatório`
        );
      }
    });
  });
}

/* =========================================================
   TESTES DE EXERCISES
   ========================================================= */

function testExercises(exercises) {
  group('exercises.json', () => {

    test('arquivo carregado como array', () => {
      assert(Array.isArray(exercises), 'exercises deve ser um array');
    });

    test('todos os IDs são únicos', () => {
      assertUniqueIds(exercises, 'exercises');
    });

    test('campos obrigatórios em cada exercício', () => {
      const required = ['id', 'type', 'title', 'instruction'];
      for (const ex of exercises) {
        assertHasKeys(ex, required, `exercício "${ex.id || '?'}"`);
      }
    });

    test('exercícios de classificação têm options e correct_answer', () => {
      for (const ex of exercises.filter(e => e.type === 'classification')) {
        assert(
          Array.isArray(ex.options) && ex.options.length >= 2,
          `exercício "${ex.id}": classification deve ter ao menos 2 options`
        );
        assert(
          typeof ex.correct_answer === 'string',
          `exercício "${ex.id}": correct_answer obrigatório para classification`
        );
      }
    });

    test('exercícios de identificação têm answer_area', () => {
      for (const ex of exercises.filter(e => e.type === 'identification')) {
        assert(
          ex.answer_area && typeof ex.answer_area.x === 'number',
          `exercício "${ex.id}": answer_area com x,y,radius obrigatório para identification`
        );
      }
    });
  });
}

/* =========================================================
   TESTES DE COMPARISONS
   ========================================================= */

function testComparisons(comparisons) {
  group('comparisons.json', () => {

    test('arquivo carregado como array', () => {
      assert(Array.isArray(comparisons), 'comparisons deve ser um array');
    });

    test('cada comparação tem exatamente 2 artwork_ids', () => {
      for (const comp of comparisons) {
        assert(
          Array.isArray(comp.artwork_ids) && comp.artwork_ids.length === 2,
          `comparação "${comp.id}": artwork_ids deve ter exatamente 2 elementos`
        );
      }
    });
  });
}

/* =========================================================
   ENTRADA PRINCIPAL
   ========================================================= */

export async function runDataTests() {
  const artworks   = loadJSON('artworks.json');
  const artists    = loadJSON('artists.json');
  const periods    = loadJSON('periods.json');
  const modules    = loadJSON('modules.json');
  const exercises  = loadJSON('exercises.json');
  const comparisons= loadJSON('comparisons.json');
  const techniques = loadJSON('techniques.json');
  const styles     = loadJSON('styles.json');
  const lessons    = loadJSON('lessons.json');

  testArtworks(artworks);
  testArtists(artists);
  testPeriods(periods);
  testModules(modules);
  testExercises(exercises);
  testComparisons(comparisons);

  group('techniques.json', () => {
    test('carregado como array não-vazio', () => assertNonEmpty(techniques, 'techniques'));
    test('IDs únicos', () => assertUniqueIds(techniques, 'techniques'));
  });

  group('styles.json', () => {
    test('carregado como array não-vazio', () => assertNonEmpty(styles, 'styles'));
  });

  group('lessons.json', () => {
    test('carregado como array não-vazio', () => assertNonEmpty(lessons, 'lessons'));
    test('IDs únicos', () => assertUniqueIds(lessons, 'lessons'));
    test('artwork_ids é array em cada lição', () => {
      for (const l of lessons) {
        assert(Array.isArray(l.artwork_ids), `lição "${l.id}": artwork_ids deve ser array`);
      }
    });
  });
}
