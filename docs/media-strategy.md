# media-strategy.md
# Alberti — Museu Interativo de Arte
## Estratégia de Mídia e Performance

---

## Princípio Central

**Poucas imagens, muito bem usadas.**

O Alberti não é uma galeria de imagens. É um sistema de leitura visual onde cada imagem serve a um propósito pedagógico. Quantidade não é qualidade.

---

## Tamanhos de Imagem

| Uso | Dimensão | Formato |
|---|---|---|
| Thumbnail (grids, cards) | 400px largura | WebP / JPEG |
| Preview (comparação) | 800px largura | WebP / JPEG |
| Alta resolução (viewer) | 1280px largura | WebP / JPEG |

Nunca carregar alta resolução antes de o usuário abrir o viewer.

---

## Lazy Loading

Implementado via `IntersectionObserver` em `ui.js`:

```html
<!-- Imagem com lazy loading -->
<img data-src="url-real.webp" src="" alt="..." loading="lazy">
```

- `rootMargin: '200px'` — pré-carrega 200px antes de entrar na viewport
- Fallback para `loading="lazy"` nativo quando disponível
- Imagens do hero carregadas com `loading="eager"`

---

## Overlays SVG

Overlays de composição são SVGs gerados em runtime, não imagens duplicadas:

```
viewer-stage
  ├─ img.viewer-img         (imagem da obra — 1 arquivo)
  └─ svg.composition-overlay (camada SVG independente)
       ├─ #overlay-thirds    (grade de terços)
       ├─ #overlay-fuga      (linhas de perspectiva)
       ├─ #overlay-focal     (ponto focal)
       └─ #overlay-highlight (área de destaque)
```

Os grupos SVG ficam ocultos por padrão e são revelados pelos botões de controle. A imagem não é duplicada.

---

## Fontes

Carregadas via Google Fonts com `display=swap`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

O `display=swap` garante que o texto seja visível com fonte fallback durante o carregamento, sem FOUC total.

---

## Imagens da V1

A V1 usa imagens de domínio público via Wikimedia Commons. Para produção:

1. Baixar as imagens localmente em `assets/artworks/` e `assets/thumbnails/`
2. Converter para WebP com qualidade 85%
3. Gerar múltiplos tamanhos (400, 800, 1280px)
4. Atualizar os campos `image` e `thumbnail` nos JSONs para paths relativos

**Para GitHub Pages:** imagens locais são preferíveis a Wikimedia para evitar dependência de CDN externo e problemas de hotlinking.

---

## Cache de Service Worker (futuro)

Para versões futuras, implementar Service Worker para:
- Cache de fontes (evitar requisição ao Google Fonts em visitas subsequentes)
- Cache de JSONs de dados
- Cache de thumbnails mais acessados
- Suporte offline básico para conteúdo já visitado
