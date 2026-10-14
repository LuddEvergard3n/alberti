# architecture.md
# Alberti — Museu Interativo de Arte
## Arquitetura do Sistema

---

## Visão Geral

Alberti é uma SPA (Single Page Application) estática, sem backend, projetada para rodar integralmente no GitHub Pages. A arquitetura prioriza: modularidade, desempenho de carregamento de imagens, navegação sem reload e acessibilidade.

```
Navegador
  └─ index.html          Ponto de entrada e shell do SPA
       ├─ css/           Sistema de design (6 arquivos)
       └─ js/main.js     Ponto de entrada JS (ES Module)
            ├─ state.js       Estado global
            ├─ router.js      Roteador hash-based
            ├─ ui.js          Utilitários DOM
            └─ accessibility.js  A11y
            
  engine/                Engines de funcionalidade
       ├─ viewer-engine.js    Zoom, pan, overlays
       ├─ hint-system.js      Dicas contextuais
       ├─ comparison-engine.js  Comparação lado a lado
       └─ feedback-engine.js  Avaliação de exercícios

  components/            Componentes de renderização
       ├─ gallery-grid.js
       ├─ artwork-viewer.js
       ├─ artist-card.js
       ├─ museum-room.js
       ├─ timeline-viewer.js
       ├─ comparison-view.js
       ├─ exercise-engine.js
       └─ technique-card.js

  data/                  Conteúdo em JSON
       ├─ artworks.json
       ├─ artists.json
       ├─ periods.json
       ├─ modules.json
       ├─ exercises.json
       ├─ comparisons.json
       ├─ lessons.json
       ├─ techniques.json
       └─ styles.json
```

---

## Padrões de Arquitetura

### SPA com Roteamento Hash

O roteador usa `window.location.hash` para URLs no formato `#/rota`. Isso garante que o GitHub Pages sirva sempre `index.html`, sem necessidade de configuração de servidor.

```
#/               → home
#/linguagem      → visão geral dos conceitos
#/linguagem/:id  → conceito específico
#/obra/:id       → viewer de obra individual
#/artistas/:id   → perfil de artista
#/museu/:id      → sala do museu
#/comparar/:a/:b → comparação entre duas obras
#/studio/:id     → exercício do estúdio
```

### Estado Observável

`state.js` implementa um observable simples sem dependências externas:

```javascript
// Leitura
const { data, route } = getState();

// Escrita
setState({ loading: false });

// Assinatura
const unsub = subscribe('route', (newRoute) => { /* ... */ });
unsub(); // cancelar
```

O estado é imutável externamente — `getState()` retorna `structuredClone()`.

### Componentes como Funções de Template

Componentes não têm estado próprio. São funções puras que recebem dados e retornam HTML string:

```javascript
// Padrão de componente
export function renderArtworkViewer(artwork, data) {
  return `<div class="artwork-viewer">...</div>`;
}
```

Engines (viewer-engine, feedback-engine) são separados dos componentes: o componente renderiza o HTML, o engine inicializa as interações após a renderização.

### Separação Engine / Componente

```
Componente → render HTML → engine.init(id)
                                └─ querySelector('.viewer-stage')
                                └─ bind eventos
                                └─ gerenciar estado local
```

Engines são importados dinamicamente (`import()`) apenas quando necessário, evitando carregamento desnecessário.

---

## Fluxo de Dados

```
index.html carrega
  └─ main.js
       └─ initUI()
       └─ loadAllData()       fetch paralelo de todos os JSONs
       └─ registerRoutes()    registrar handlers de rota
       └─ initRouter()        resolver rota inicial
            └─ hashchange → resolve() → handler(params)
                               └─ showView('museu')
                               └─ container.innerHTML = renderMuseumView(data)
                               └─ import('../engine/viewer-engine.js')
                                    └─ initViewer(artworkId)
```

---

## Estratégia de CSS

Cinco arquivos com responsabilidades distintas, carregados em ordem:

| Arquivo | Responsabilidade |
|---|---|
| `base.css` | Tokens, reset, tipografia base |
| `layout.css` | Containers, grid, seções, header, footer |
| `theme.css` | Ornamentação, badges, fichas catalográficas |
| `components.css` | Botões, cards, modais, tabs, accordeão |
| `gallery.css` | Viewer, galeria, comparação, timeline, estúdio |
| `mobile.css` | Media queries responsivas |

Nenhum valor numérico de espaçamento, cor ou tipografia aparece fora de `base.css` — todos os demais arquivos usam variáveis CSS.

---

## Carregamento de Imagens

Estratégia de performance em 3 camadas:

1. **Thumbnails** — imagens comprimidas (400px) para grids e cards
2. **Lazy loading** — `IntersectionObserver` com rootMargin de 200px
3. **Alta resolução** — carregada apenas no viewer ao abrir a obra

Imagens de domínio público via Wikimedia Commons. Para produção, recomendar mirror local ou CDN próprio.

---

## Acessibilidade

- Navegação por teclado em todos os componentes interativos
- `focus-visible` para usuários de teclado
- `aria-live` para anúncios de mudança de rota e feedback
- Trap de foco em modais e painéis
- Controle de tamanho de fonte (A+ / A-) persistido em localStorage
- Alto contraste via `data-high-contrast` no `<html>`
- WCAG 2.1 AA como padrão mínimo
