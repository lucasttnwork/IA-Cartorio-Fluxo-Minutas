# Manifesto Narrado do Produto

## “Do upload em massa à minuta quase pronta — com evidências, conexões visuais e edição conversacional”

---

## Resumo do fluxo do ponto de vista do usuário (em texto simples)

Você escolhe o **tipo de ato** (ex.: compra e venda). Depois, **faz upload de todos os documentos de uma vez**, sem se preocupar em organizar nada. O sistema lê tudo, entende o que é cada documento e **descobre automaticamente as pessoas e os imóveis** envolvidos — criando **cards** para cada pessoa e cada imóvel.

Em seguida, você vai para um **canvas infinito**, onde arrasta esses cards e **conecta visualmente**: quem é comprador, quem é vendedor, quem é cônjuge, quem representa quem (procurador), qual imóvel pertence a quem e para quem está sendo transferido. O sistema sugere conexões (por exemplo, a matrícula “aponta” os proprietários) e sinaliza o que estiver incerto.

Quando as conexões fazem sentido, o sistema **redige uma minuta quase pronta**, destacando pendências. Por fim, você vê a minuta em um editor e tem um **chatbot ao lado** para “conversar com o documento”: pedir ajustes, corrigir dados, trocar cláusulas e regenerar seções — tudo em tempo real e com trilha do que mudou.

---

## A visão: por que este sistema existe

Cartórios e áreas de escrituras sofrem com o mesmo gargalo: **os dados estão espalhados em dezenas de documentos**, e o trabalho humano vira “copiar/colar + conferir + encaixar em minuta”. O objetivo do produto é transformar isso em uma experiência **confiável, rápida e auditável**:

* **Confiável** porque cada dado tem origem (documento/página/trecho) e divergências viram pendências, não “chutes”.
* **Rápido** porque o usuário não organiza; o sistema organiza e o humano só confirma.
* **Auditável** porque cada decisão (extração, merge, conexão, edição por chat) fica registrada.

---

## Princípios de design (os “porquês” que guiam tudo)

1. **O usuário não cataloga; ele valida**
   O valor está em remover o trabalho braçal inicial. O sistema cria os cards e sugere; o humano confirma.

2. **Nada de “texto mágico” sem estrutura**
   O que move o sistema é um **modelo canônico** (JSON/entidades/conexões). A minuta é uma renderização desse modelo.
   Para isso, exigimos saída estruturada do LLM via **JSON Schema (structured outputs)** para previsibilidade e parse seguro. ([Google AI for Developers][1])

3. **Duas leituras valem mais que uma (OCR + Gemini)**
   Para aumentar assertividade, a extração nasce de:

* **Document AI OCR** (texto + layout, com deskew e granularidade de blocos/linhas/palavras) ([Google Cloud Documentation][2])
* **Gemini multimodal** extraindo o mesmo documento para JSON estruturado ([Google AI for Developers][1])
  Depois um motor de consenso decide: “concorda → ok”, “diverge → pendência”.

4. **Processamento pesado é assíncrono**
   Upload e UI precisam ser instantâneos. OCR/LLM rodam em worker com fila durável (sem travar o usuário). No MVP, isso entra com **Supabase Queues / pgmq** (mensageria durável no Postgres). ([Supabase][3])

5. **Segurança não é opcional**
   Dados pessoais e patrimoniais exigem:

* RLS no Postgres (controle por linha) ([Supabase][4])
* storage com políticas + **signed URLs** temporárias para processamento ([Supabase][5])
* segredos guardados em Vault ([Supabase][6])

---

## História do fluxo (um exemplo narrado, “como acontece na prática”)

### Cena 1 — O começo: “Quero lavrar uma compra e venda”

A usuária escolhe **Compra e Venda**. O sistema cria um **Caso** e mostra um dropzone:

> “Envie todos os documentos (PDFs ou fotos). Não precisa organizar.”

Ela sobe:

* 6 CNHs (de pessoas diferentes)
* 2 certidões de casamento
* 1 procuração
* 1 matrícula + IPTU

A UI imediatamente mostra:

* “Arquivos recebidos” + status “Processando…”

### Cena 2 — O sistema “descobre” pessoas e imóveis

Em background, cada arquivo vira um “job”:

1. OCR com Document AI → texto + layout ([Google Cloud Documentation][2])
2. Extração com Gemini Flash → JSON estruturado ([Google AI for Developers][1])
3. Motor de consenso compara OCR vs Gemini
4. Motor de dedupe agrupa e cria entidades

Na tela, surgem automaticamente:

* **6 cards de Pessoa**
* **1 card de Imóvel**

Cada card já vem com:

* campos principais (nome/CPF/nascimento…)
* “chips” dos documentos que alimentaram o card
* indicadores de confiança (ex.: “alta”, “média”)
* botão “editar campo” e “ver evidência” (mostra doc/página)

### Cena 3 — O canvas infinito: “arraste e conecte”

A usuária clica em **Montar relações** e entra no **canvas infinito**:

* ela arrasta os cards livremente
* cria conexões arrastando de um “handle” do card para outro

Ela conecta:

* Pessoa A → **Vendedor**
* Pessoa B → **Comprador**
* Pessoa C → **Cônjuge de Pessoa A**
* Pessoa D → **Procurador** conectado a A e C (representa ambos)
* Imóvel X → “Pertence a Pessoa A (e cônjuge)” → “Vai para Pessoa B”

O sistema ajuda: no card do imóvel, já aparece “Provável proprietário: Pessoa A” (inferido da matrícula). Se houver divergência (“nome parecido, mas CPF não aparece”), o sistema marca:

> “⚠ Confirmar titularidade (match parcial)”

### Cena 4 — A minuta nasce do grafo

Com as conexões confirmadas, a usuária clica: **Gerar minuta**.

O sistema:

* consolida tudo em um **JSON canônico do Caso**
* aplica regras (ex.: precisa anuência de cônjuge? procuração válida?)
* chama Gemini Pro para redigir a minuta com coerência global, mantendo “pendências” como ⚠

A minuta aparece em editor: títulos, seções e cláusulas.

### Cena 5 — O chatbot: “converse com o resultado”

A usuária pergunta no chat:

> “Altere a forma de pagamento para: 30% na assinatura e 70% em 60 dias.”

O modelo não “reescreve o documento inteiro”. Ele produz um **patch estruturado**:

* `update_field(deal.paymentSchedule, …)`
* `regenerate_section("Preço e Pagamento")`

Essa estratégia usa **function calling** para transformar linguagem natural em operações seguras ([Google AI for Developers][7])
e mantém tudo em **structured outputs** para não quebrar o pipeline. ([Google AI for Developers][1])

A seção muda instantaneamente e o log registra:

* “quem pediu”
* “o que mudou”
* “em qual seção”
* “qual era o valor anterior”

---

## O “motor” por trás da história: componentes do sistema

### 1) Supabase como fundação do MVP

Escolha deliberada para **velocidade de entrega** sem sacrificar confiabilidade:

* **Postgres + RLS** (controle de acesso por linha; base da segurança) ([Supabase][4])
* **Storage** para documentos, com controles finos ([Supabase][8])
* **Signed URLs** para o worker baixar/enviar arquivos com validade curta ([Supabase][5])
* **Realtime** (status do processamento, colaboração, presença no canvas) ([Supabase][9])

  * e autorização via RLS quando aplicável ([Supabase][10])
* **Edge Functions** para endpoints leves e webhooks ([Supabase][11])

  * com limites claros de execução/memória, por isso ficam fora do “processamento pesado” ([Supabase][12])
* **Queues/pgmq** para jobs duráveis (OCR/LLM) ([Supabase][3])
* **Vault** para armazenar chaves e segredos criptografados ([Supabase][6])

### 2) Worker assíncrono (o que dá “reliability” de verdade)

Um serviço em container (recomendação: **Node.js + TypeScript**, pela consistência end-to-end) que:

* consome fila (pgmq)
* baixa docs via signed URL
* chama Document AI + Gemini
* faz consenso + dedupe
* grava resultados e status

*(Esse worker pode rodar em Cloud Run/VPS; a arquitetura permanece igual.)*

### 3) UI/Frontend (React + Tailwind + Framer)

* **Canvas infinito** com **React Flow (Xyflow)**, que já provê renderização de nodes/edges e interações (drag, connect, pan/zoom) ([React Flow][13])
* **Editor da minuta** com **Tiptap**, um editor headless em cima de ProseMirror (robusto e extensível) ([tiptap.dev][14])
* **Chat** + atualização em tempo real via Realtime/WebSocket (Supabase)

---

## Pipeline de documentos (o fluxo interno, com o “porquê” de cada passo)

### Passo A — Ingestão (upload)

* Objetivo: receber rápido e com segurança.
* Armazenar no Supabase Storage e registrar “Document” no Postgres.

### Passo B — OCR (Document AI)

* Objetivo: obter texto + layout confiável, com capacidade de deskew e granularidade fina. ([Google Cloud Documentation][2])
* Saída: `ocr_text`, blocos/linhas, coordenadas e metadados.

### Passo C — Extração multimodal (Gemini Flash)

* Objetivo: extrair campos “sem depender só do OCR”, inclusive onde layout é ruim.
* Sempre com **structured outputs (JSON Schema)** para resposta parseável. ([Google AI for Developers][1])

### Passo D — Consenso

* Objetivo: aumentar assertividade e reduzir erros silenciosos.
* Estratégia:

  * se OCR e Gemini convergem → alta confiança
  * se divergem → pendência + pedir confirmação

### Passo E — Entity Resolution (dedupe e agrupamento)

* Objetivo: transformar “pilha de PDFs” em entidades humanas:

  * Pessoas (cards)
  * Imóveis (cards)

### Passo F — Grafo de conexões (canvas)

* Objetivo: o usuário “ensina” o contexto real (papéis e relações).
* O sistema sugere, mas o humano governa.

### Passo G — Minuta (render do grafo)

* Objetivo: gerar texto consistente e versionável.
* Gemini Pro + templates + regras internas.
* Pendências viram ⚠ (nunca “inventar”).

### Passo H — Chatbot (edição por operações)

* Objetivo: permitir “conversa com o documento” sem perder confiabilidade.
* **Function calling** + patches estruturados ([Google AI for Developers][7])
* Caching de contexto para reduzir custo e acelerar iterações quando o mesmo dossiê é usado repetidamente ([Google AI for Developers][15])

---

## Tech Stack completa escolhida (MVP → produção sem reescrever)

### Frontend

* React + TypeScript
* TailwindCSS
* Framer Motion
* React Flow (canvas infinito) ([React Flow][13])
* Tiptap (editor de minuta) ([tiptap.dev][14])

### Backend (MVP no Supabase)

* Supabase Postgres + RLS ([Supabase][4])
* Supabase Storage + signed URLs ([Supabase][8])
* Supabase Realtime (broadcast/presence/changes) ([Supabase][9])
* Supabase Edge Functions (rotas leves/webhooks) ([Supabase][11])
* Supabase Queues (pgmq) ([Supabase][3])
* Supabase Vault (segredos) ([Supabase][6])

### Worker (processamento)

* Node.js + TypeScript (container)
* Consome pgmq, faz OCR/IA, grava no Postgres
* Retentativas, idempotência, status e logs

### IA / OCR (Google)

* Document AI – Enterprise Document OCR ([Google Cloud Documentation][2])
* Gemini API:

  * Structured Outputs (JSON Schema) ([Google AI for Developers][1])
  * Function Calling ([Google AI for Developers][7])
  * Context Caching ([Google AI for Developers][15])

---

## Regras de confiabilidade (o “contrato moral” do sistema)

1. **Toda informação exibida tem evidência**
   Se não tem evidência, vira “pendência”.

2. **Toda edição do chat vira patch auditável**
   Nada de alterações invisíveis.

3. **Trabalho pesado nunca roda em Edge Function**
   Edge Functions são para endpoints rápidos; os limites existem e são documentados. ([Supabase][12])

4. **Fila durável sempre**
   O sistema não “perde job”: PGMQ mantém mensagens até remover/arquivar, com garantias de entrega dentro do modelo da extensão. ([Supabase][16])

---

## O que é MVP aqui (e por que)

**MVP = provar o ciclo completo** com alto impacto:

* Upload em massa
* Criação automática de cards (Pessoa/Imóvel)
* Canvas infinito com conexões (papéis + posse/transferência + procurações + cônjuges)
* Geração da minuta com pendências
* Chatbot com patches estruturados (alterar dados e regenerar seções)

O resto (templates muito avançados, centenas de atos, integrações externas) vem depois.

---


[1]: https://ai.google.dev/gemini-api/docs/structured-output?utm_source=chatgpt.com "Structured Outputs | Gemini API - Google AI for Developers"
[2]: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr?utm_source=chatgpt.com "Enterprise Document OCR | Document AI"
[3]: https://supabase.com/docs/guides/queues?utm_source=chatgpt.com "Supabase Queues | Supabase Docs"
[4]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[5]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl?utm_source=chatgpt.com "JavaScript: Create a signed URL"
[6]: https://supabase.com/docs/guides/database/vault?utm_source=chatgpt.com "Vault | Supabase Docs"
[7]: https://ai.google.dev/gemini-api/docs/function-calling?utm_source=chatgpt.com "Function calling with the Gemini API | Google AI for Developers"
[8]: https://supabase.com/docs/guides/storage?utm_source=chatgpt.com "Storage | Supabase Docs"
[9]: https://supabase.com/docs/guides/realtime?utm_source=chatgpt.com "Realtime | Supabase Docs"
[10]: https://supabase.com/docs/guides/realtime/authorization?utm_source=chatgpt.com "Realtime Authorization | Supabase Docs"
[11]: https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions | Supabase Docs"
[12]: https://supabase.com/docs/guides/functions/limits?utm_source=chatgpt.com "Limits | Supabase Docs"
[13]: https://reactflow.dev/api-reference/react-flow?utm_source=chatgpt.com "The ReactFlow component"
[14]: https://tiptap.dev/docs/editor/getting-started/overview?utm_source=chatgpt.com "Get started | Tiptap Editor Docs"
[15]: https://ai.google.dev/gemini-api/docs/caching?utm_source=chatgpt.com "Context caching | Gemini API | Google AI for Developers"
[16]: https://supabase.com/docs/guides/queues/pgmq?utm_source=chatgpt.com "PGMQ Extension | Supabase Docs"
