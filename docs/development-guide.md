# development-guide.md
# Alberti — Museu Interativo de Arte
## Guia de Desenvolvimento

---

## Requisitos

- Node.js 18+ (apenas para testes — nenhum bundler necessário)
- Qualquer servidor HTTP local (Live Server, Python, etc.)
- Navegador moderno com suporte a ES Modules e CSS Custom Properties

---

## Estrutura de Diretórios

```
alberti/
├─ index.html              Ponto de entrada do SPA
├─ css/
│   ├─ base.css            Tokens, reset, tipografia base
│   ├─ layout.css          Containers, grid, header, footer
│   ├─ theme.css           Ornamentação, badges, fichas
│   ├─ components.css      Botões, cards, modais, tabs
│   ├─ gallery.css         Viewer, galeria, comparação, estúdio
│   └─ mobile.css          Media queries responsivas
├─ js/
│   ├─ main.js             Entrada, registro de rotas, renderização home
│   ├─ state.js            Estado observável global
│   ├─ router.js           Roteador hash-based
│   ├─ ui.js               Utilitários DOM
│   └─ accessibility.js    A11y, foco, anúncios
├─ engine/
│   ├─ viewer-engine.js    Zoom, pan, overlays SVG
│   ├─ hint-system.js      Dicas visuais contextuais
│   ├─ comparison-engine.js  Slider e notas comparativas
│   └─ feedback-engine.js  Avaliação de exercícios
├─ components/
│   ├─ gallery-grid.js     Grade de obras
│   ├─ artwork-viewer.js   Visualizador completo
│   ├─ artist-card.js      Card de artista
│   ├─ museum-room.js      Sala do museu
│   ├─ timeline-viewer.js  Linha do tempo
│   ├─ comparison-view.js  Comparação lado a lado
│   ├─ exercise-engine.js  Renderização de exercício
│   └─ technique-card.js   Card de técnica
├─ data/
│   ├─ artworks.json
│   ├─ artists.json
│   ├─ periods.json
│   ├─ modules.json
│   ├─ exercises.json
│   ├─ comparisons.json
│   ├─ lessons.json
│   ├─ techniques.json
│   └─ styles.json
├─ assets/
│   ├─ artworks/           Imagens em alta resolução (local)
│   ├─ thumbnails/         Miniaturas (400px)
│   ├─ icons/
│   ├─ textures/
│   └─ frames/
├─ tests/
│   ├─ test-runner.js      Runner e framework mínimo
│   ├─ data-tests.js       Integridade dos JSONs
│   └─ consistency-tests.js  Referências cruzadas
└─ docs/
    ├─ architecture.md
    ├─ pedagogy.md
    ├─ visual-system.md
    ├─ content-model.md
    ├─ media-strategy.js
    └─ development-guide.md
```

---

## Rodando Localmente

### Opção A — VS Code Live Server
1. Instalar a extensão Live Server
2. Abrir a pasta `alberti/` no VS Code
3. Clicar em "Go Live" na barra de status
4. Acessar `http://127.0.0.1:5500`

### Opção B — Python HTTP Server
```bash
cd alberti
python3 -m http.server 8080
# acessar http://localhost:8080
```

### Opção C — Node.js (sem dependências)
```bash
cd alberti
npx serve .
# acessar o endereço exibido no terminal
```

**Importante:** Não abrir `index.html` diretamente via `file://` — o `fetch()` dos JSONs falhará por restrições de CORS. Sempre usar um servidor HTTP local.

---

## Rodando os Testes

```bash
cd alberti
node --experimental-vm-modules tests/test-runner.js
```

Os testes verificam integridade e consistência dos JSONs. Nenhuma dependência npm necessária.

Saída esperada:
```
Alberti — Suite de Testes Automatizados

artworks.json
─────────────
  PASS  arquivo carregado como array
  PASS  array não está vazio
  ...

Total: 28 testes
PASS:  28
FAIL:  0
```

---

## Adicionando uma Obra

1. Adicionar objeto em `data/artworks.json` seguindo o schema em `docs/content-model.md`
2. Verificar que `artist` existe em `artists.json`
3. Verificar que `period` existe em `periods.json`
4. Adicionar imagem em `assets/artworks/` e thumbnail em `assets/thumbnails/`
5. Rodar os testes para verificar consistência
6. Adicionar entrada no `CHANGELOG.md`

---

## Adicionando um Artista

1. Adicionar objeto em `data/artists.json`
2. Verificar que `period` existe em `periods.json`
3. Adicionar pelo menos uma obra em `artworks.json` referenciando o artista
4. Rodar os testes

---

## Adicionando uma Sala do Museu

1. Adicionar objeto em `data/modules.json` com `"type": "room"`
2. Incluir `artwork_ids` com IDs existentes em `artworks.json`
3. Definir `room_number` único
4. Rodar os testes

---

## Adicionando um Exercício

1. Adicionar objeto em `data/exercises.json`
2. Definir `type`: `"identification"`, `"composition"` ou `"classification"`
3. Se `artwork_id` presente, verificar que existe em `artworks.json`
4. Preencher dados do `teacher` para o Modo Professor
5. Rodar os testes
6. Linkar em uma lição em `data/lessons.json` (campo `exercise_ids`)

---

## Convenções de Código

### IDs
- Sempre `kebab-case`: `escola-de-atenas`, não `EscolaDeAtenas` ou `escola_de_atenas`
- Apenas `[a-z0-9-]`
- Descritivos e estáveis — não mudar IDs após publicação (quebra URLs)

### Componentes
- Um arquivo por componente em `components/`
- Exportação nomeada: `export function renderNomeDoComponente(data) { return \`HTML\`; }`
- Sem estado interno — dados via parâmetros
- Retornar sempre string HTML

### Engines
- Um arquivo por engine em `engine/`
- `initNomeDoEngine(id)` como função de entrada pública
- Estado interno ao arquivo — não exportar estado
- Importados dinamicamente via `import()` em `main.js`

### CSS
- Usar apenas variáveis CSS definidas em `base.css`
- Sem valores numéricos soltos no CSS
- Nomes de classe em `kebab-case`
- Sem classes órfãs — cada classe deve estar documentada no arquivo CSS

### JSDoc
- Toda função exportada deve ter JSDoc completo: `@param`, `@returns`, descrição
- Funções privadas: JSDoc mínimo com descrição e `@private`
- Suposições de design documentadas com "Suposição:" no comentário

---

## Deploy no GitHub Pages

1. Fazer push para o branch `main` (ou `gh-pages`)
2. Em Settings > Pages, selecionar branch e pasta raiz `/`
3. O GitHub Pages servirá o `index.html` automaticamente
4. O roteamento hash-based funciona sem configuração adicional

**Atenção:** O GitHub Pages usa HTTPS. Imagens externas (Wikimedia) devem ser HTTPS. Imagens locais em `assets/` não têm esse problema.

---

## Adicionando ao Ecossistema

O Alberti é um dos sistemas do ecossistema educacional. Para linkar com outros sistemas:

1. Atualizar o footer em `index.html` com links para os outros sistemas
2. Não criar dependências de código entre sistemas — cada um é independente
3. A identidade visual do Alberti (paleta museológica quente) é exclusiva deste sistema

---

## Checklist de Qualidade antes de Commit

- [ ] Testes passando: `node tests/test-runner.js`
- [ ] Sem classes CSS órfãs
- [ ] Nenhuma variável CSS ad-hoc (apenas tokens de `base.css`)
- [ ] Imagens com `alt` descritivo
- [ ] Novos componentes com JSDoc
- [ ] `CHANGELOG.md` atualizado
- [ ] Sem `console.log()` em produção (apenas `console.warn` e `console.error` para erros reais)
