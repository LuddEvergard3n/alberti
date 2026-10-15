# Alberti
## Museu Interativo de Arte

Ver, ler e compreender a arte como linguagem, forma e civilização.

---

## O que é o Alberti

Alberti é o sistema de Arte do ecossistema educacional, composto também por Heródoto (História), Euclides (Matemática), Quintiliano (Português), Johnson English, Lavoisier (Química), Humboldt (Geografia), Aristóteles (Filosofia), Archimedes (Física) e Darwin (Biologia).

Não é uma galeria estática de imagens. É um **museu-laboratório** que ensina Arte por meio de cinco operações pedagógicas: **Ver, Ler, Contextualizar, Comparar e Experimentar**.

---

## Funcionalidades da V1

- **Visualizador de obra** com zoom progressivo, pan e overlays SVG de composição (grade de terços, linhas de fuga, ponto focal, área de destaque)
- **Sistema de dicas visuais** orientadas ao olhar — ensina a ver, não entrega a resposta
- **Comparação lado a lado** de duas obras com notas comparativas geradas automaticamente
- **Salas do museu** com curadoria temática
- **Linha do tempo** de períodos artísticos
- **Estúdio** com exercícios de identificação, composição e classificação
- **Modo Professor** com painel de mediação para cada lição e exercício
- **Plano de aula local** com identificação, duração calculada, habilidades de Arte da BNCC, objetivos, metodologias, recursos, avaliação, cópia e impressão
- **Sobre o Alberti** com a origem do nome, o recorte pedagógico e os limites de uma reprodução digital
- **Acessibilidade** completa: navegação por teclado, alto contraste, tamanho de fonte ajustável
- **Responsivo** — funciona em desktop, tablet e mobile

---

## Stack

| Camada | Tecnologia |
|---|---|
| Markup | HTML5 semântico |
| Estilo | CSS3 com Custom Properties (6 arquivos modulares) |
| Interação | JavaScript ES2022, ES Modules, sem framework |
| Gráficos | SVG para overlays de composição |
| Dados | JSON estático |
| Fontes | Google Fonts (Cormorant Garamond, Source Serif 4, Inter, DM Mono) |
| Imagens | Wikimedia Commons (domínio público) / assets locais |
| Deploy | GitHub Pages (estático, sem backend) |
| Testes | Node.js nativo (sem framework) |

---

## Rodando Localmente

> **Importante:** Alberti deve ser servido via HTTP, não aberto como `file://`.
> Abrir direto no browser via arquivo bloqueia imagens e JSONs por segurança do browser (OpaqueResponseBlocking / null origin).

### Opção A — Servidor embutido (Node.js, sem dependências)
```bash
cd alberti
node server.js
# Acesse: http://localhost:8080
```

### Opção B — Python
```bash
cd alberti
python3 -m http.server 8080
# Acesse: http://localhost:8080
```

### Opção C — VS Code Live Server
1. Instalar a extensão **Live Server** no VS Code
2. Abrir a pasta `alberti/` no VS Code
3. Clicar em **Go Live** na barra de status
4. Browser abre automaticamente

### Por que não funciona via file://?
Browsers modernos (especialmente Firefox) bloqueiam requisições cross-origin feitas de uma origem nula (`file://`). Isso inclui imagens externas (Wikimedia) e o `fetch()` dos JSONs. Qualquer servidor HTTP local — mesmo o mais simples — resolve completamente.

---

## Rodando os Testes

```bash
node --experimental-vm-modules tests/test-runner.js
```

Os testes verificam:
- Integridade dos JSONs (campos obrigatórios, tipos, IDs únicos)
- Consistência de referências cruzadas entre arquivos
- IDs como slugs válidos (kebab-case)
- Exercícios de classificação com `options` e `correct_answer`
- Exercícios de identificação com `answer_area`

---

## Estrutura de Arquivos

```
alberti/
├─ index.html          Shell do SPA
├─ css/                Sistema de design (6 arquivos)
├─ js/                 Core: state, router, ui, accessibility
├─ engine/             Engines: viewer, hints, comparison, feedback
├─ components/         Componentes de renderização (HTML templates)
├─ data/               Conteúdo em JSON (obras, artistas, períodos...)
├─ assets/             Imagens locais (artworks, thumbnails)
├─ tests/              Suite de testes Node.js
└─ docs/               Documentação técnica e pedagógica
```

Documentação completa em [`/docs`](./docs/):
- [`architecture.md`](./docs/architecture.md) — Arquitetura do sistema
- [`pedagogy.md`](./docs/pedagogy.md) — Filosofia pedagógica
- [`visual-system.md`](./docs/visual-system.md) — Sistema visual e tokens
- [`content-model.md`](./docs/content-model.md) — Schema dos JSONs
- [`media-strategy.md`](./docs/media-strategy.md) — Performance de imagens
- [`development-guide.md`](./docs/development-guide.md) — Guia de contribuição

---

## Adicionando Conteúdo

Para adicionar uma obra:
1. Inserir objeto em `data/artworks.json` seguindo o schema em `docs/content-model.md`
2. Verificar referências (`artist`, `period`)
3. Rodar os testes
4. Atualizar `CHANGELOG.md`

Para adicionar artista, sala, exercício ou período, consultar `docs/development-guide.md`.

---

## Ecossistema

| Sistema | Disciplina |
|---|---|
| **Alberti** | Arte |
| Heródoto | História |
| Euclides | Matemática |
| Quintiliano | Português e Literatura |
| Johnson English | Língua Inglesa |
| Lavoisier | Química |
| Humboldt | Geografia |
| Aristóteles | Filosofia |
| Archimedes | Física |
| Darwin | Biologia |

---

## Licença

Conteúdo editorial e código: ver `LICENSE`.

Imagens: domínio público via Wikimedia Commons. Verificar licença individual de cada obra antes de uso comercial.

Fontes: Google Fonts, licença SIL Open Font License.
