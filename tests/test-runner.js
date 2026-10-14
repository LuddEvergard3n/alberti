/**
 * test-runner.js
 * Alberti — Museu Interativo de Arte
 *
 * Runner de testes automatizados via Node.js.
 * Não depende de framework externo.
 *
 * Uso:
 *   node tests/test-runner.js
 *
 * Saída:
 *   PASS ou FAIL por teste, com contagem final.
 *   Código de saída 1 se houver falhas, 0 se tudo passar.
 */

'use strict';

import { runDataTests }        from './data-tests.js';
import { runConsistencyTests } from './consistency-tests.js';

/* =========================================================
   FRAMEWORK MÍNIMO DE ASSERÇÃO
   ========================================================= */

let passCount = 0;
let failCount = 0;

/**
 * Executa um bloco de teste com nome descritivo.
 *
 * @param {string}   description - Descrição do teste
 * @param {Function} fn          - Função síncrona de teste
 * @returns {void}
 */
export function test(description, fn) {
  try {
    fn();
    console.log(`  PASS  ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  FAIL  ${description}`);
    console.error(`        ${err.message}`);
    failCount++;
  }
}

/**
 * Asserção: valor deve ser verdadeiro.
 *
 * @param {*}      value   - Valor a avaliar
 * @param {string} message - Mensagem de erro se falhar
 * @returns {void}
 */
export function assert(value, message) {
  if (!value) throw new Error(message || `Esperava verdadeiro, recebeu ${value}`);
}

/**
 * Asserção de igualdade estrita.
 *
 * @param {*}      actual   - Valor obtido
 * @param {*}      expected - Valor esperado
 * @param {string} message  - Mensagem de erro opcional
 * @returns {void}
 */
export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Esperava ${JSON.stringify(expected)}, obteve ${JSON.stringify(actual)}`);
  }
}

/**
 * Asserção: array não deve estar vazio.
 *
 * @param {Array}  arr
 * @param {string} message
 * @returns {void}
 */
export function assertNonEmpty(arr, message) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(message || 'Array está vazio');
  }
}

/**
 * Asserção: objeto deve ter todas as chaves listadas.
 *
 * @param {Object}   obj
 * @param {string[]} keys
 * @param {string}   context
 * @returns {void}
 */
export function assertHasKeys(obj, keys, context = '') {
  for (const key of keys) {
    if (!(key in obj)) {
      throw new Error(`${context}: chave obrigatória ausente: "${key}"`);
    }
  }
}

/* =========================================================
   GRUPOS DE TESTES
   ========================================================= */

/**
 * Agrupa testes com prefixo de nome.
 *
 * @param {string}   groupName
 * @param {Function} fn
 * @returns {void}
 */
export function group(groupName, fn) {
  console.log(`\n${groupName}`);
  console.log('─'.repeat(groupName.length));
  fn();
}

/* =========================================================
   EXECUÇÃO PRINCIPAL
   ========================================================= */

async function main() {
  console.log('\nAlberti — Suite de Testes Automatizados');
  console.log('========================================\n');

  try {
    await runDataTests();
    await runConsistencyTests();
  } catch (err) {
    console.error('\nErro crítico na suite de testes:', err.message);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log(`Total: ${passCount + failCount} testes`);
  console.log(`PASS:  ${passCount}`);
  console.log(`FAIL:  ${failCount}`);
  console.log('========================================\n');

  process.exit(failCount > 0 ? 1 : 0);
}

main();
