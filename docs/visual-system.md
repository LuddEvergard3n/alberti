# visual-system.md
# Alberti — Museu Interativo de Arte
## Sistema Visual

---

## Conceito Central

**museum-editorial interface**

60% museu editorial + 25% catálogo comentado + 15% laboratório visual

A interface deve transmitir: atenção, pausa, observação, respeito pela obra e clareza na leitura visual.

---

## Paleta de Cores

| Token | Valor | Uso |
|---|---|---|
| `--color-bg-primary` | `#F5F1E8` | Fundo principal — marfim quente |
| `--color-bg-surface` | `#FBF8F2` | Superfície de cards e painéis |
| `--color-bg-secondary` | `#EFE7D8` | Fundos alternativos, zonas auxiliares |
| `--color-bg-deep` | `#E4D7C1` | Uso raro — blocos de destaque |
| `--color-text-primary` | `#2A241E` | Texto principal — marrom-preto |
| `--color-text-secondary` | `#6A5E52` | Texto secundário — cinza amarronzado |
| `--color-text-discrete` | `#8B7C6B` | Metadados, datas, legendas |
| `--color-brand-primary` | `#6E4B2A` | Marrom moldura / madeira |
| `--color-brand-secondary` | `#7A6A4F` | Bronze / latão envelhecido |
| `--color-brand-accent` | `#A7783D` | Ocre dourado — destaques nobres |
| `--color-brand-cold` | `#556B74` | Azul ardósia — somente técnico |
| `--color-border-base` | `#D9CCB7` | Bordas padrão |
| `--color-border-light` | `#CDBDA4` | Bordas suaves |

**Regras:**
- Sem cores saturadas
- Sem neon
- Sem verde/azul clínico como identidade
- O azul ardósia é para overlays técnicos e comparações apenas

---

## Tipografia

| Papel | Família | Uso |
|---|---|---|
| Display | Cormorant Garamond | Hero, títulos grandes, pull quotes |
| Heading | Source Serif 4 | Títulos de seção, viewer |
| Body | Inter | Corpo de texto, UI, botões |
| Mono | DM Mono | Metadados, datas, fichas catalográficas |

### Escala Tipográfica

| Token | Valor | Uso |
|---|---|---|
| `--text-hero` | `clamp(2.8rem, 5vw, 5rem)` | Título hero |
| `--text-section` | `clamp(1.5rem, 2vw, 2.4rem)` | Títulos de seção |
| `--text-subsection` | `clamp(1.15rem, 1.5vw, 1.5rem)` | Subtítulos |
| `--text-card-title` | `1.2rem` | Títulos de cards |
| `--text-body` | `1rem` | Corpo padrão |
| `--text-caption` | `0.95rem` | Legendas |
| `--text-meta` | `0.875rem` | Metadados |
| `--text-small` | `0.82rem` | Fichas, mono discreto |

---

## Sistema de Espaçamento (escala 8px)

| Token | Valor |
|---|---|
| `--space-1` | `0.5rem` (8px) |
| `--space-2` | `0.75rem` (12px) |
| `--space-3` | `1rem` (16px) |
| `--space-4` | `1.5rem` (24px) |
| `--space-5` | `2rem` (32px) |
| `--space-6` | `3rem` (48px) |
| `--space-7` | `4rem` (64px) |
| `--space-8` | `5rem` (80px) |

**Aliases de seção:**
- `--section-monumental`: 5rem — hero, aberturas
- `--section-large`: 4rem — entre seções da home
- `--section-medium`: 3rem — entre blocos de seção
- `--section-compact`: 2rem — sub-seções

---

## Grid

- **Desktop**: 12 colunas, `max-width: 1280px`
- **Tablet**: 8 colunas
- **Mobile**: 4 colunas
- **Gap**: `--gap-medium` (1.5rem) padrão

---

## Border Radius

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | `4px` | Badges, pills |
| `--radius-sm` | `8px` | Botões, inputs |
| `--radius-md` | `12px` | Cards, painéis |
| `--radius-lg` | `14px` | Modais, salas |
| `--radius-pill` | `100px` | Filter pills, scrollbar |

---

## Sombras

| Token | Valor |
|---|---|
| `--shadow-soft` | `0 4px 14px rgba(42,36,30,0.04)` |
| `--shadow-medium` | `0 8px 24px rgba(42,36,30,0.05)` |
| `--shadow-elevated` | `0 16px 40px rgba(42,36,30,0.08)` |

---

## Transições

- `--transition-fast`: 180ms ease — hover states
- `--transition-base`: 220ms ease — transições padrão
- `--transition-slow`: 350ms ease — painéis, viewer

---

## Regras Visuais dos Componentes

### Cards
Devem parecer placas de catálogo, não widgets de software:
- Fundo claro (`--color-bg-surface`)
- Borda fina (`1px solid --color-border-base`)
- Sombra muito leve (`--shadow-soft`)
- Respiro generoso (`--pad-card-v` e `--pad-card-h`)
- Título dominante em serif
- Metadados discretos em mono

### Viewer
- Obra é protagonista — a interface existe para servi-la
- Controles aparecem apenas no hover
- Overlays SVG não duplicam a imagem — são camadas independentes

### Timeline
- Deve parecer linha curatorial, não timeline de dashboard
- Discreta, elegante, muito espaço
- Nós simples sem excesso de decoração

### Museum Rooms
- Devem parecer exposições temáticas reais
- Número de sala em mono grande
- Grade de miniaturas como prévia do acervo
