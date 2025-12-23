# PRD — Sistema de Minutas por Documentos com Cards + Canvas Infinito + Chat de Edição

**Produto:** “Minuta Canvas” (nome provisório)
**Versão:** 1.0 (MVP)
**Status:** Draft para implementação
**Owner:** Produto/Tech Lead (Lucas)
**Usuários-alvo (MVP):** equipe interna (escreventes/assistentes) + supervisão

> Estrutura inspirada em boas práticas de PRD (objetivo, métricas, requisitos, suposições e escopo), como recomendado em templates e guias de PRD. ([Atlassian][1])

---

## 1) Contexto e problema

Lavrar uma escritura exige:

* Ler muitos documentos (PF/PJ/imóveis)
* Copiar dados, conferir divergências, entender relações (cônjuge, procurador, proprietários)
* Redigir minuta (template + cláusulas) e revisar

**Dor atual**

* Tempo alto e repetitivo
* Risco de erro/omissão (dados divergentes, papéis incorretos, titularidade mal vinculada)
* Dificuldade de auditoria (“de onde saiu esse dado?”)

**Oportunidade**
Transformar “pilha de PDFs” em um **modelo estruturado e auditável** (entidades + conexões), que gera uma minuta quase pronta e permite edição controlada por chat.

---

## 2) Visão do produto

Um sistema onde o usuário:

1. escolhe o tipo de ato
2. sobe todos os documentos em massa
3. recebe **cards de pessoas e imóveis** já “descobertos” pelo sistema
4. organiza e conecta tudo num **canvas infinito**
5. gera a minuta e conversa com ela para ajustar em tempo real, com trilha de auditoria.

---

## 3) Objetivos e métricas de sucesso (KPIs)

> PRDs devem explicitar objetivos e métricas para alinhamento e decisão. ([Atlassian][1])

### Objetivos do MVP

* Reduzir drasticamente o tempo de “montagem do caso + primeira minuta”
* Aumentar confiabilidade via evidência e pendências explícitas
* Tornar revisão humana rápida e segura

### KPIs sugeridos

* **Time-to-First-Cards:** tempo até aparecerem cards após upload (p95)
* **Time-to-First-Draft:** tempo até minuta inicial (p95)
* **Auto-fill rate:** % de campos preenchidos automaticamente com confiança alta
* **Correction rate:** nº médio de correções por caso (deve cair com melhorias)
* **Pendencies resolved:** taxa de pendências resolvidas antes da versão final
* **Draft acceptance:** % de casos em que a minuta foi aprovada com alterações pequenas

---

## 4) Escopo do MVP (o que entra e o que não entra)

### Entra (MVP)

* Tipos de ato: **Compra e venda** (primeiro) + base para expandir
* Upload em massa (PDF/foto)
* OCR + extração dupla (Document AI + Gemini Flash) + consenso
* Deduplicação e criação de cards (Pessoa/Imóvel)
* Canvas infinito (arrastar + conectar + papéis)
* Minuta gerada por template + IA, com pendências
* Chat para editar via **operações estruturadas** (patches)
* Auditoria (evidência por campo + log de alterações)

### Não entra (por enquanto)

* Integrações externas obrigatórias (ex.: consulta automática a registradores, prefeituras, etc.)
* Biblioteca completa de atos e cláusulas avançadas (entra incrementalmente)
* Assinatura/fluxo de lavratura “fim a fim” (o foco é minuta + conferência)

---

## 5) Personas e necessidades

### Persona A — Escrevente/assistente

* Precisa montar caso rápido, sem errar, com evidência para conferir
* Quer um “checklist” do que falta e onde há divergência

### Persona B — Supervisor

* Quer auditoria, rastreabilidade, controle de qualidade, e versão final confiável

### Persona C — Operação/Backoffice

* Quer padronização de minuta, métricas e redução de retrabalho

---

## 6) Jornada do usuário (narrativa de referência)

### 6.1 Happy path (exemplo)

1. Usuário seleciona “Compra e Venda”
2. Sobe 6 CNHs + certidões + procuração + matrícula + IPTU
3. Sistema cria 6 **cards de pessoa** e 1 **card de imóvel**
4. No canvas infinito, o usuário conecta:

   * Pessoa A = vendedor; Pessoa B = comprador
   * Pessoa C = cônjuge de A
   * Pessoa D = procurador representando A e C
   * Imóvel X “pertence a A/C” e “vai para B”
5. Gera minuta
6. No chat: “alterar pagamento para 30% à vista e 70% em 60 dias”
7. Seção “Preço e pagamento” é atualizada e a alteração fica registrada.

---

## 7) Requisitos funcionais (FR)

### FR1 — Gestão de casos e atos

* Criar/editar caso com tipo de ato, status, responsáveis
* Histórico de versões (minuta e dados estruturados)

### FR2 — Upload e organização de documentos

* Upload em massa para storage
* Normalização básica (detectar PDF/imagem, páginas)
* Estado do documento: `uploaded → processing → processed → needs_review → approved`

### FR3 — OCR (Google) + extração estruturada (IA)

* OCR primário com **Document AI Enterprise Document OCR**, extraindo texto + layout (blocos, parágrafos, linhas, tokens). ([Google Cloud Documentation][2])
* Extração paralela multimodal com Gemini Flash para JSON categorizado
* Resposta obrigatoriamente em **Structured Outputs (JSON Schema)** para garantir previsibilidade e parse seguro. ([Google AI for Developers][3])

### FR4 — Motor de consenso (comparação OCR vs Gemini)

* Para cada campo extraído:

  * escolher valor final + score + justificativa
  * se divergente → marcar **pendência** e pedir confirmação do usuário

### FR5 — Entity Resolution (pessoas e imóveis)

* Criar entidades “Pessoa” e “Imóvel” agrupando documentos
* Dedupe/merge:

  * CPF igual → merge automático
  * sem CPF → heurística com nome+nascimento+filiação + “merge suggestion”

### FR6 — Cards gamificados

* Card Pessoa:

  * campos principais, documentos associados, evidências, botões “editar/mesclar/separar”
* Card Imóvel:

  * matrícula/RI, endereço, área, ônus (quando possível), docs associados
  * sugestão de titularidade baseada na matrícula (com confiança)

### FR7 — Canvas infinito (grafo de conexões)

* Canvas com pan/zoom, drag-and-drop e conexões entre nodes usando React Flow (nodes/edges/interações). ([React Flow][4])
* Tipos de conexões:

  * Pessoa ↔ Pessoa: cônjuge
  * Procurador → múltiplos representados
  * Pessoa → Imóvel: proprietário atual / vendedor
  * Imóvel → Pessoa: comprador/destinatário
* Regras:

  * validar papéis permitidos por tipo de ato
  * alertar inconsistências (ex.: imóvel ligado a vendedor sem evidência)

### FR8 — Motor de minuta

* Templates por ato + cláusulas modulares
* Geração por Gemini Pro (coerência) a partir do **JSON canônico**
* Pendências viram ⚠ e não são “inventadas”

### FR9 — Chatbot de edição em tempo real

* Chat ao lado da minuta
* O modelo produz **operações** (não “texto livre”) via **function calling**. ([Google AI for Developers][5])
* Cada operação retorna patch em JSON Schema (structured outputs) e aplica no modelo canônico ([Google AI for Developers][3])
* Regeneração por seção (ex.: “Preço e pagamento”)

### FR10 — Evidência e auditoria

* Para cada campo no card/minuta:

  * referência de origem (doc, página, trecho)
* Log imutável de alterações: quem, quando, o que mudou, por quê

### FR11 — Exportação

* Export de minuta (MVP: HTML/PDF; evolução: DOCX)

---

## 8) Requisitos não-funcionais (NFR)

### Performance e latência (metas iniciais)

* UI reativa (canvas fluido)
* Processamento assíncrono com atualizações de status em tempo real
* Suporte a uploads grandes sem travar o app

### Confiabilidade e resiliência

* Processamento em fila durável (retries, idempotência)
* Jobs não devem ser perdidos
* Versionamento do modelo canônico e da minuta

### Segurança e privacidade (LGPD)

* Princípio do mínimo acesso e “defense in depth”
* Controle de acesso por papel + RLS no banco ([Supabase][6])
* URLs temporárias para acesso a arquivos (signed URLs) ([Supabase][7])
* Segredos guardados no Vault (Supabase)

---

## 9) Arquitetura do MVP (escolha de stack para máxima reliability + velocidade)

### Decisão-chave: Supabase como base do MVP

**Por quê:** acelera produto e fornece primitives de produção (DB, Auth, Storage, Realtime, RLS).

* **Postgres + RLS** para segurança end-to-end ([Supabase][6])
* **Storage** para documentos + políticas integradas ao Postgres ([Supabase][8])
* **Realtime** (Postgres changes / broadcast / presence) para status do pipeline e colaboração ([Supabase][9])
* **Supabase Queues (pgmq)** como fila durável com entrega garantida ([Supabase][10])

### Edge Functions vs Worker

* **Edge Functions**: apenas endpoints leves (criar caso, assinar upload, enfileirar jobs, aplicar patches)
* **Worker em container**: OCR/LLM/consenso (processamento pesado)

Motivo: Edge Functions têm limites explícitos de memória/tempo/CPU, então não são ideais para OCR/LLM pesado. ([Supabase][11])

### IA / OCR (Google)

* **Document AI Enterprise Document OCR** para texto + layout ([Google Cloud Documentation][2])
* **Gemini Structured Outputs** (JSON Schema) para extração e patches ([Google AI for Developers][3])
* **Function calling** para o chat editar via operações ([Google AI for Developers][5])
* **Context caching** para acelerar e baratear iterações sobre o mesmo dossiê ([Google AI for Developers][12])

### Frontend

* React + TypeScript
* TailwindCSS + Framer Motion
* **React Flow** para canvas infinito (nodes/edges/pan/zoom) ([React Flow][4])
* **Tiptap** para editor de minuta (headless, baseado em ProseMirror) ([Tiptap][13])

---

## 10) Modelo de dados (conceitual)

**Entidades principais**

* `cases` (ato, status, responsáveis)
* `documents` (arquivo, tipo inferido, status, metadados, links storage)
* `people` (dados canônicos + confiança)
* `properties` (imóvel; matrícula/RI/endereço/área + confiança)
* `extractions` (saída OCR, saída Gemini, consenso final)
* `evidence` (campo → doc/página/trecho)
* `graph_edges` (relações: spouse_of, represents, owns, sells, buys)
* `drafts` (minuta por versão; seções)
* `chat_sessions` + `operations_log` (patches aplicados)

**Observação prática**

* O **grafo** é a “fonte de verdade” do caso: minuta é render do grafo + dados.

---

## 11) Regras de produto (contratos que não podem quebrar)

1. **Sem evidência = sem auto-preenchimento final** (vira pendência)
2. **Sem JSON Schema = sem produção** (toda integração com IA tem saída estruturada) ([Google AI for Developers][3])
3. **Chat edita por operações** (function calling), não por “texto mágico” ([Google AI for Developers][5])
4. **Processamento pesado sempre assíncrono em fila durável** ([Supabase][10])

---

## 12) Plano de entrega (MVP em marcos)

**M0 — Fundacional**

* Schema do Postgres + RLS + Storage + Auth
* Upload e listagem de documentos

**M1 — Pipeline**

* Worker + fila (pgmq)
* Document AI OCR + Gemini extraction (structured outputs)
* Consenso + criação de cards

**M2 — Canvas**

* React Flow + conexões + validações básicas
* Sugestões de titularidade e pendências

**M3 — Minuta**

* JSON canônico + templates
* Geração da minuta e visualização no editor (Tiptap)

**M4 — Chat**

* Function calling + patches
* Regeneração por seção + audit log

---

## 13) Riscos e mitigação

* **OCR ruim / fotos ruins** → indicador de qualidade + pedir reenvio / orientar usuário; fallback Gemini multimodal
* **Divergências silenciosas** → consenso obrigatório + pendência
* **Alucinação de IA** → structured outputs + grounding no dossiê + regra “sem evidência, sem dado”
* **Custos/latência** → context caching + reprocessamento por seção/por documento ([Google AI for Developers][12])
* **Limites de Edge Functions** → processamento pesado no worker ([Supabase][11])
* **Supabase Queues em estágio alpha** → mitigar com monitoramento, DLQ simples e plano de swap (ex.: mover fila para outro broker se necessário) ([Supabase][14])

---

## 14) Apêndice — Definições (glossário rápido)

* **Card:** representação visual de uma entidade (Pessoa/Imóvel) com campos + evidência
* **Evidência:** ponte do campo para o documento/página/trecho que o sustenta
* **Grafo (canvas):** nós (cards) + arestas (relacionamentos) que definem o ato
* **Modelo canônico:** JSON consolidado do caso (fonte de verdade)
* **Patch:** operação estruturada que altera o modelo canônico e re-renderiza a minuta

---


[1]: https://www.atlassian.com/software/confluence/templates/product-requirements?utm_source=chatgpt.com "Product requirements template | Confluence"
[2]: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr?utm_source=chatgpt.com "Enterprise Document OCR | Document AI"
[3]: https://ai.google.dev/gemini-api/docs/structured-output?utm_source=chatgpt.com "Structured Outputs | Gemini API - Google AI for Developers"
[4]: https://reactflow.dev/api-reference/react-flow?utm_source=chatgpt.com "The ReactFlow component"
[5]: https://ai.google.dev/gemini-api/docs/function-calling?utm_source=chatgpt.com "Function calling with the Gemini API | Google AI for Developers"
[6]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[7]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl?utm_source=chatgpt.com "JavaScript: Create a signed URL"
[8]: https://supabase.com/docs/guides/storage/security/access-control?utm_source=chatgpt.com "Storage Access Control | Supabase Docs"
[9]: https://supabase.com/docs/guides/realtime?utm_source=chatgpt.com "Realtime | Supabase Docs"
[10]: https://supabase.com/docs/guides/queues?utm_source=chatgpt.com "Supabase Queues | Supabase Docs"
[11]: https://supabase.com/docs/guides/functions/limits?utm_source=chatgpt.com "Limits | Supabase Docs"
[12]: https://ai.google.dev/api/caching?utm_source=chatgpt.com "Caching | Gemini API - Google AI for Developers"
[13]: https://tiptap.dev/docs/editor/getting-started/overview?utm_source=chatgpt.com "Get started | Tiptap Editor Docs"
[14]: https://supabase.com/features/queues?utm_source=chatgpt.com "Queues | Supabase Features"
