# CHANGELOG
# Alberti — Museu Interativo de Arte

Formato: [Versão] — Data — Descrição

---

## [1.0.0] — 2025-03-13

### Lançamento inicial da V1

#### Arquitetura
- SPA hash-based sem framework, 100% estático para GitHub Pages
- Sistema de estado observável em `js/state.js` (subscribe/notify, sem dependências)
- Roteador hash-based em `js/router.js` com suporte a parâmetros dinâmicos (`:id`)
- Carregamento paralelo de todos os JSONs via `Promise.all` em `js/state.js`
- Importação dinâmica de engines (`viewer-engine`, `feedback-engine`, `comparison-engine`) via `import()`

#### Sistema de Design (CSS)
- 6 arquivos CSS modulares com responsabilidade única
- Sistema completo de Design Tokens em `css/base.css` (cores, tipografia, espaçamento, shadows, radius, z-index)
- Escala de espaçamento baseada em 8px (`--space-1` a `--space-8`)
- Grid de 12/8/4 colunas responsivo
- Paleta museológica: marfim, pergaminho, madeira, bronze, ocre dourado
- Tipografia: Cormorant Garamond + Source Serif 4 + Inter + DM Mono
- Responsividade completa: 1280px / 1024px / 768px / 480px / 360px
- Suporte a `prefers-reduced-motion`
- Print stylesheet básico

#### Componentes
- `artwork-viewer.js` — viewer com zoom, pan, overlays SVG e sidebar de informações
- `gallery-grid.js` — grade de obras com overlay de legenda no hover
- `artist-card.js` — card de artista com retrato, período e contagem de obras
- `museum-room.js` — sala do museu com número, curadoria e grade de miniaturas
- `timeline-viewer.js` — linha do tempo de períodos
- `comparison-view.js` — comparação lado a lado com legenda e conceitos
- `exercise-engine.js` — renderização de exercícios (identification, classification)
- `technique-card.js` — card de técnica artística

#### Engines
- `viewer-engine.js` — zoom (ZOOM_STEP 0.25, ZOOM_MAX 4.0), pan mouse/touch, overlays SVG, atalhos de teclado
- `hint-system.js` — dicas contextuais sequenciais, fallback automático por conceito, ativação de overlays
- `comparison-engine.js` — slider de divisão visual, sincronização de overlays, notas comparativas automáticas
- `feedback-engine.js` — avaliação de identification, composition e classification; persiste progresso em localStorage

#### Acessibilidade
- Navegação por teclado em todos os componentes interativos
- `focus-visible` para usuários de teclado, sem outline para mouse
- `aria-live` para mudanças de rota e feedback de exercícios
- Trap de foco em modais e painéis
- Controle de tamanho de fonte (A+ / A−) persistido em localStorage
- Alto contraste via `data-high-contrast` no `<html>`
- `announceToScreenReader()` para mudanças de rota e estado
- `getFocusableElements()` e `trapFocus()` para modais

#### Conteúdo Inicial (V1)
- 6 obras do Alto Renascimento: A Última Ceia, Mona Lisa, Criação de Adão, Escola de Atenas, Teto da Capela Sistina, Homem Vitruviano
- 3 artistas: Leonardo da Vinci, Michelangelo, Rafael
- 9 períodos: Arte Antiga → Arte Contemporânea
- 6 conceitos de linguagem visual: linha, forma, cor, luz, composição, perspectiva
- 3 salas do museu: Renascimento, Forma e Perspectiva, Figura Humana
- 3 exercícios: identificação de ponto de fuga, ponto focal, classificação medieval/renascimento
- 3 comparações preparadas
- 7 técnicas, 4 estilos, 3 lições com dados do Modo Professor

#### Testes
- `tests/test-runner.js` — runner mínimo sem framework externo
- `tests/data-tests.js` — 28 testes de integridade dos JSONs
- `tests/consistency-tests.js` — verificação de referências cruzadas entre arquivos

#### Documentação
- `docs/architecture.md` — arquitetura, padrões e fluxo de dados
- `docs/pedagogy.md` — filosofia pedagógica e as 5 operações
- `docs/visual-system.md` — paleta, tipografia, tokens, grid
- `docs/content-model.md` — schema completo de todos os JSONs
- `docs/media-strategy.md` — lazy loading, overlays SVG, estratégia de imagens
- `docs/development-guide.md` — setup, testes, convenções, checklist

---

## Próximas Versões (Planejado)

### [1.1.0] — Planejado
- Adicionar período Barroco com Caravaggio
- Exercício de composição interativo no canvas
- Slider de comparação visual (in-place)
- Glossário de termos visuais

### [1.2.0] — Planejado
- Adicionar Impressionismo (Monet, Degas)
- Filtros por conceito e técnica na galeria
- Modo de visita guiada nas salas do museu
- Service Worker para cache offline

### [2.0.0] — Planejado
- Cobertura de Arte Moderna (Cubismo, Expressionismo)
- Exercícios de composição com elementos arrastáveis
- Modo de estudo com progresso persistido
- Exportação de análises para PDF
