# content-model.md
# Alberti — Museu Interativo de Arte
## Modelo de Dados e Conteúdo

---

## Estrutura dos JSONs

Todos os arquivos de dados ficam em `/data/`. São lidos via `fetch()` em paralelo ao inicializar a aplicação.

---

## artworks.json

Cada objeto representa uma obra de arte.

```json
{
  "id":          "last-supper",         // slug único (kebab-case)
  "title":       "A Última Ceia",       // título em português
  "artist":      "leonardo-da-vinci",   // referência a artists.json
  "period":      "renascimento",        // referência a periods.json
  "technique":   "afresco-tempera",     // referência a techniques.json
  "year":        "1495–1498",           // string, pode ser intervalo
  "location":    "Santa Maria delle Grazie, Milão",
  "dimensions":  "460 × 880 cm",
  "concepts":    ["perspectiva", "composição", "ritmo"],  // referências a modules.json (type:concept)

  "image":     "URL",      // imagem em alta resolução (viewer)
  "thumbnail": "URL",      // miniatura (400px) para grids

  "description": "Texto de leitura formal da obra.",

  // Dados para overlays SVG (coordenadas em 0-400 / 0-300)
  "focal_point":    { "x": 200, "y": 85 },
  "fuga_lines":     [{ "x1": 200, "y1": 85, "x2": 0, "y2": 300 }],
  "highlight_area": { "x": 160, "y": 120, "w": 100, "h": 60 },

  // Dicas visuais sequenciais
  "hints": [
    {
      "text":    "Texto da dica orientada ao olhar.",
      "overlay": "fuga",    // overlay a ativar: "thirds" | "fuga" | "focal"
      "concept": "perspectiva"
    }
  ]
}
```

---

## artists.json

```json
{
  "id":               "leonardo-da-vinci",
  "name":             "Leonardo da Vinci",
  "nationality":      "Italiano",
  "born":             "1452, Vinci, Itália",
  "died":             "1519, Amboise, França",
  "period":           "renascimento",       // referência a periods.json
  "period_label":     "Alto Renascimento",
  "technique_primary":"Pintura, desenho, escultura",
  "tagline":          "Frase que sintetiza a linguagem formal.",
  "biography":        "Texto biográfico com foco na linguagem formal.",
  "formal_language":  "Descrição da linguagem formal do artista.",
  "featured":         true,    // exibir na home
  "portrait":         "URL"    // imagem do retrato
}
```

---

## periods.json

```json
{
  "id":                "renascimento",
  "title":             "Renascimento",
  "years":             "1400 – 1600",
  "short_description": "Uma frase para cards.",
  "description":       "Texto curatorial completo.",
  "featured":          true,    // exibir na home
  "thumbnail":         "URL"    // imagem representativa
}
```

---

## modules.json

Três tipos de módulo compartilham o mesmo arquivo:

### type: "concept" (elemento visual)
```json
{
  "id":                "perspectiva",
  "type":              "concept",
  "eyebrow":           "Elemento visual",
  "title":             "Perspectiva",
  "short_description": "Uma frase.",
  "description":       "Descrição para card.",
  "content":           "<p>HTML da lição completa.</p>"
}
```

### type: "room" (sala do museu)
```json
{
  "id":           "sala-renascimento",
  "type":         "room",
  "room_number":  "01",
  "title":        "Renascimento",
  "curator_note": "Texto curatorial curto.",
  "description":  "Texto mais longo.",
  "artwork_ids":  ["last-supper", "school-of-athens"]
}
```

---

## exercises.json

```json
{
  "id":           "perspectiva-01",
  "type":         "identification",    // "identification" | "composition" | "classification"
  "title":        "Encontre o ponto de fuga",
  "short_description": "Uma frase.",
  "instruction":  "Instrução completa para o aluno.",
  "artwork_id":   "last-supper",       // obra de referência (opcional)
  "target_label": "o ponto de fuga",
  "answer_area":  { "x": 50, "y": 28, "radius": 8 },  // em % da imagem
  "hint_on_wrong":"Dica quando errar.",
  "hint_text":    "Insight conceitual após o exercício.",
  "concepts":     ["perspectiva"],
  "estimated_minutes": 5,

  // Para classification:
  "options":        [{ "value": "medieval", "label": "Arte Medieval" }],
  "correct_answer": "medieval",
  "explanation_correct": "Texto explicando o acerto.",
  "explanation_wrong":   "Texto orientando após erro.",

  // Dados para o Modo Professor
  "teacher": {
    "objective":       "O que o aluno deve compreender.",
    "central_concept": "Conceito formal central.",
    "technique":       "Técnica artística em foco.",
    "context":         "Contexto para mediação.",
    "mediation":       "Como conduzir a observação.",
    "criteria":        "Como avaliar a compreensão.",
    "estimated_minutes":"Tempo estimado como string."
  }
}
```

---

## comparisons.json

```json
{
  "id":          "ultima-ceia-escola-atenas",
  "title":       "A Última Ceia × A Escola de Atenas",
  "description": "Uma frase sobre o eixo comparativo.",
  "artwork_ids": ["last-supper", "school-of-athens"],  // exatamente 2
  "concepts":    ["perspectiva", "composição"],
  "axis":        "Pergunta comparativa que guia a análise."
}
```

---

## Regras de Consistência

1. **IDs são slugs:** apenas `[a-z0-9-]`, sem espaços ou caracteres especiais
2. **IDs são únicos** dentro de cada arquivo
3. **Referências cruzadas** devem ser válidas (verificadas pelos testes)
4. **concepts** em artworks referenciam IDs existentes em modules.json (type: concept)
5. **artwork_ids** em rooms, comparisons e lessons devem existir em artworks.json
6. **exercise_ids** em lessons devem existir em exercises.json
7. **artist** em artwork deve existir em artists.json
8. **period** em artwork e artist deve existir em periods.json
