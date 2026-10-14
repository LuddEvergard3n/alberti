/**
 * feedback-engine.js
 * Alberti — Museu Interativo de Arte
 *
 * Engine de feedback para atividades do Estúdio.
 *
 * Responsabilidades:
 *   - Avaliar respostas dos exercícios
 *   - Exibir feedback contextual (não "certo/errado")
 *   - Orientar o olhar sem entregar a resposta
 *   - Registrar progresso de exercícios concluídos
 */

import { getState } from '../js/state.js';
import { escapeHtml, showToast } from '../js/ui.js';

/** Chave de armazenamento de progresso no localStorage */
const PROGRESS_KEY = 'alberti-exercise-progress';

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

/**
 * Inicializa o engine de feedback para um exercício.
 * Chamado por main.js após renderizar o HTML do exercício.
 *
 * @param {string} exerciseId
 * @returns {void}
 */
export function initExercise(exerciseId) {
  const { data } = getState();
  const exercise = data.exercises.find(e => e.id === exerciseId);
  if (!exercise) return;

  bindSubmitButton(exercise);
  bindCanvasInteractions(exercise);
  loadProgress(exerciseId);
}

/* =========================================================
   SUBMISSÃO E FEEDBACK
   ========================================================= */

/**
 * Vincula o botão de verificação ao handler de feedback.
 *
 * @param {Object} exercise
 * @returns {void}
 */
function bindSubmitButton(exercise) {
  const btn = document.querySelector('[data-exercise-action="submit"]');
  btn?.addEventListener('click', () => evaluateExercise(exercise));
}

/**
 * Avalia o estado atual do exercício e exibe feedback.
 * O feedback é orientado ao olhar — nunca apenas "errado".
 *
 * @param {Object} exercise
 * @returns {void}
 */
function evaluateExercise(exercise) {
  const container = document.querySelector('.exercise-feedback');
  if (!container) return;

  // Cada tipo de exercício tem avaliação própria
  let feedback = '';

  switch (exercise.type) {
    case 'identification':
      feedback = evaluateIdentification(exercise);
      break;
    case 'composition':
      feedback = evaluateComposition(exercise);
      break;
    case 'classification':
      feedback = evaluateClassification(exercise);
      break;
    default:
      feedback = generateGenericFeedback(exercise);
  }

  renderFeedback(container, feedback);
  saveProgress(exercise.id, feedback.correct);
}

/**
 * Avalia exercício de identificação visual.
 * O aluno indica uma área clicando na imagem.
 *
 * @param {Object} exercise
 * @returns {{correct:boolean, message:string, hint:string}}
 */
function evaluateIdentification(exercise) {
  const canvas    = document.querySelector('.studio-canvas');
  const markerX   = canvas ? parseFloat(canvas.dataset.markerX || '0') : 0;
  const markerY   = canvas ? parseFloat(canvas.dataset.markerY || '0') : 0;

  // Suposição: exercise.answer_area = { x, y, radius } em % da imagem
  const area = exercise.answer_area;
  if (!area) {
    return { correct: true, message: 'Resposta registrada.', hint: '' };
  }

  const dist = Math.sqrt((markerX - area.x) ** 2 + (markerY - area.y) ** 2);
  const correct = dist <= area.radius;

  return {
    correct,
    message: correct
      ? 'Correto. Você identificou a área com precisão.'
      : 'Observe novamente. ' + (exercise.hint_on_wrong || 'Procure o elemento indicado na descrição.'),
    hint: correct ? '' : exercise.hint_text || '',
  };
}

/**
 * Avalia exercício de composição (arrastar elementos).
 * Suposição: exercícios de composição usam um estado interno
 * no canvas que indica posicionamento correto.
 *
 * @param {Object} exercise
 * @returns {{correct:boolean, message:string, hint:string}}
 */
function evaluateComposition(exercise) {
  const canvas  = document.querySelector('.studio-canvas');
  const correct = canvas ? canvas.dataset.compositionCorrect === 'true' : false;

  return {
    correct,
    message: correct
      ? 'Composição equilibrada. Você encontrou o peso visual correto.'
      : 'A composição ainda não está equilibrada. ' + (exercise.hint_on_wrong || 'Redistribua os elementos considerando o centro de gravidade visual.'),
    hint: exercise.hint_text || '',
  };
}

/**
 * Avalia exercício de classificação (estilo/período).
 * O aluno seleciona uma opção.
 *
 * @param {Object} exercise
 * @returns {{correct:boolean, message:string, hint:string}}
 */
function evaluateClassification(exercise) {
  const selected = document.querySelector('[data-option].selected');
  if (!selected) {
    return { correct: false, message: 'Selecione uma opção para continuar.', hint: '' };
  }

  const value   = selected.dataset.option;
  const correct = value === exercise.correct_answer;

  return {
    correct,
    message: correct
      ? `Correto — ${exercise.explanation_correct || 'Boa leitura visual.'}`
      : `Não exatamente. ${exercise.explanation_wrong || 'Observe os elementos que caracterizam cada estilo.'}`,
    hint: correct ? '' : exercise.hint_text || '',
  };
}

/**
 * Gera feedback genérico para exercícios sem avaliação automática.
 *
 * @param {Object} exercise
 * @returns {{correct:boolean, message:string, hint:string}}
 */
function generateGenericFeedback(exercise) {
  return {
    correct: true,
    message: exercise.feedback_general || 'Reflexão registrada. Compare sua análise com os critérios abaixo.',
    hint:    exercise.criteria || '',
  };
}

/* =========================================================
   RENDERIZAÇÃO DE FEEDBACK
   ========================================================= */

/**
 * Renderiza o feedback no container da atividade.
 *
 * @param {HTMLElement}                                     container
 * @param {{correct:boolean, message:string, hint:string}} feedback
 * @returns {void}
 */
function renderFeedback(container, feedback) {
  const borderColor = feedback.correct ? 'var(--color-brand-accent)' : 'var(--color-brand-cold)';
  const label       = feedback.correct ? 'Observação correta' : 'Continue observando';

  container.innerHTML = `
    <div style="border-left: 2px solid ${borderColor}; padding-left: var(--space-4); margin-top: var(--space-4);">
      <span style="font-family:var(--font-mono); font-size:var(--text-small);
                   letter-spacing:var(--tracking-widest); text-transform:uppercase;
                   color:${borderColor}; display:block; margin-bottom:var(--space-2);">
        ${escapeHtml(label)}
      </span>
      <p style="font-size:var(--text-body); color:var(--color-text-secondary);
                line-height:var(--leading-relaxed);">
        ${escapeHtml(feedback.message)}
      </p>
      ${feedback.hint ? `
        <p style="font-size:var(--text-caption); color:var(--color-text-discrete);
                  margin-top:var(--space-2); font-style:italic;">
          ${escapeHtml(feedback.hint)}
        </p>
      ` : ''}
    </div>
  `;

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* =========================================================
   INTERAÇÕES NO CANVAS
   ========================================================= */

/**
 * Vincula interações de clique no canvas para exercícios de identificação.
 * Registra coordenadas do clique como % da largura/altura do canvas.
 *
 * @param {Object} exercise
 * @returns {void}
 */
function bindCanvasInteractions(exercise) {
  if (exercise.type !== 'identification') return;

  const canvas = document.querySelector('.studio-canvas');
  if (!canvas) return;

  canvas.addEventListener('click', e => {
    const rect  = canvas.getBoundingClientRect();
    const pctX  = ((e.clientX - rect.left) / rect.width)  * 100;
    const pctY  = ((e.clientY - rect.top)  / rect.height) * 100;

    canvas.dataset.markerX = pctX.toFixed(1);
    canvas.dataset.markerY = pctY.toFixed(1);

    // Desenhar marcador visual
    drawMarker(canvas, pctX, pctY);
  });
}

/**
 * Desenha um marcador circular no canvas 2D.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number}            pctX - Posição X em %
 * @param {number}            pctY - Posição Y em %
 * @returns {void}
 */
function drawMarker(canvas, pctX, pctY) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const x = (pctX / 100) * canvas.width;
  const y = (pctY / 100) * canvas.height;

  // Limpar marcadores anteriores redesenhando a imagem
  // (suposição: imagem de fundo já está no canvas como backgroundImage do container)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Marcador: círculo com cruz
  ctx.strokeStyle = '#A7783D';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
  ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
  ctx.stroke();
}

/* =========================================================
   PROGRESSO
   ========================================================= */

/**
 * Salva progresso de exercício concluído no localStorage.
 *
 * @param {string}  exerciseId
 * @param {boolean} correct
 * @returns {void}
 */
function saveProgress(exerciseId, correct) {
  try {
    const raw      = localStorage.getItem(PROGRESS_KEY) || '{}';
    const progress = JSON.parse(raw);
    progress[exerciseId] = { completed: true, correct, date: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage indisponível — silenciar
  }
}

/**
 * Carrega e aplica progresso salvo para um exercício.
 * Marca o exercício como concluído visualmente, se aplicável.
 *
 * @param {string} exerciseId
 * @returns {void}
 */
function loadProgress(exerciseId) {
  try {
    const raw      = localStorage.getItem(PROGRESS_KEY) || '{}';
    const progress = JSON.parse(raw);
    const record   = progress[exerciseId];

    if (record?.completed) {
      const indicator = document.querySelector('.exercise-completed-indicator');
      if (indicator) indicator.style.display = 'block';
    }
  } catch {
    // Ignorar erro de parse
  }
}
