---
title: 'Use SGLang for Local RAG Generation on Akamai RTX 4000 Ada'
type: 'feature'
created: '2026-05-11'
status: 'done'
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/planning-artifacts/prd.md'
  - 'docs/project-documentation.md'
  - '_bmad-output/implementation-artifacts/implementation-details.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** BookBot currently uses Anthropic Claude as the generation backend, while the desired deployment is a self-hosted SGLang model server on Akamai Cloud RTX 4000 Ada GPU instances. The RAG knowledge base already exists in PostgreSQL/pgvector and Meilisearch, but the LLM integration, runtime configuration, and operations docs need to reflect local inference.

**Approach:** Replace the Claude-specific client with a provider-neutral OpenAI-compatible chat client configured for SGLang, while preserving the existing retrieval pipeline and frontend/backend streaming behavior. Add environment, Compose, and documentation updates that describe SGLang as the inference service and keep embeddings local through the existing sentence-transformers + pgvector setup.

## Boundaries & Constraints

**Always:** Keep retrieval in `retrieve_books()` using pgvector + Meilisearch; keep the frontend BookBot WebSocket contract unchanged; keep `[BOOKS]{"ids":[...]}` output instructions so existing card rendering survives; make SGLang configurable through environment variables; retain a clear migration path for remote Akamai GPU deployment where SGLang may run outside local Docker Compose.

**Ask First:** Changing the embedding model or PostgreSQL vector dimensions; choosing a model larger than the likely RTX 4000 Ada VRAM envelope; adding Kubernetes GPU manifests that require specific cluster/node-pool names; removing Claude support entirely rather than making the OpenAI-compatible backend the default.

**Never:** Do not implement autonomous tool-use workflows, cart mutation through the LLM, payment behavior, or inventory logic in this change. Do not rewrite the backend assistant WebSocket or frontend BookBot unless required by the SGLang client contract.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| SGLang streaming happy path | BookBot sends a user message, retrieval returns books, `LLM_BASE_URL` points to SGLang | AI service calls `/v1/chat/completions` with system + user messages and streams deltas back as existing SSE token events | N/A |
| Missing LLM config | `LLM_BASE_URL` or model config is missing | Stream returns a concise BookBot configuration error instead of crashing | No unhandled exception from `/chat/stream` |
| SGLang unavailable | SGLang host is down or returns an error | AI service logs/handles upstream failure and returns a user-safe error token/message | HTTP fallback returns an error response or safe response consistently |
| No retrieved books | Query has no useful catalog matches | Model still receives an empty/limited context and is instructed not to fabricate catalog entries | Response should ask a clarifying question or say no catalog match |

</frozen-after-approval>

## Code Map

- `akamai-bookstore/ai-service/app/services/claude_client.py` -- current Claude-specific prompt, context formatting, streaming generation, and non-streaming wrapper.
- `akamai-bookstore/ai-service/app/routers/chat.py` -- calls `stream_chat()` and `chat()` after retrieval, so import path may need updating.
- `akamai-bookstore/ai-service/app/config.py` -- current Anthropic and RAG settings; add SGLang/OpenAI-compatible settings.
- `akamai-bookstore/ai-service/requirements.txt` -- add OpenAI-compatible client dependency.
- `akamai-bookstore/.env.example` -- document SGLang endpoint/model/API key and local embedding settings.
- `akamai-bookstore/docker-compose.yml` -- add optional SGLang service profile or clear commented guidance without forcing GPU runtime on non-GPU machines.
- `akamai-bookstore/README.md` -- update local/Akamai Cloud setup instructions for SGLang and RTX 4000 Ada sizing guidance.
- `_bmad-output/implementation-artifacts/implementation-details.md` -- update architecture and backlog details to reflect SGLang.

## Tasks & Acceptance

**Execution:**
- [x] `akamai-bookstore/ai-service/app/services/llm_client.py` -- create provider-neutral OpenAI-compatible streaming client using the existing system prompt and context formatter -- makes SGLang the default generation backend without changing retrieval.
- [x] `akamai-bookstore/ai-service/app/routers/chat.py` -- import from the new LLM client -- keeps route behavior unchanged while decoupling from Claude naming.
- [x] `akamai-bookstore/ai-service/app/config.py` -- add `llm_base_url`, `llm_api_key`, `llm_model`, timeout, max token, and temperature settings -- allows Akamai-hosted SGLang to be configured by environment.
- [x] `akamai-bookstore/ai-service/requirements.txt` -- add the OpenAI Python client -- supports OpenAI-compatible SGLang requests.
- [x] `akamai-bookstore/.env.example` -- replace Anthropic-first configuration with SGLang defaults and optional Claude legacy note -- makes desired deployment obvious.
- [x] `akamai-bookstore/docker-compose.yml` -- add an optional `sglang` profile suitable for GPU hosts and point `ai-service` at it when enabled -- supports local or VM-hosted SGLang without breaking CPU-only Compose.
- [x] `akamai-bookstore/README.md` and implementation docs -- document Akamai RTX 4000 Ada deployment, recommended model sizing, SGLang launch command, and RAG setup sequence -- gives operators a runnable path.

**Acceptance Criteria:**
- Given SGLang is reachable at `LLM_BASE_URL`, when BookBot sends a message, then the AI service streams assistant tokens through the existing backend WebSocket and frontend UI.
- Given retrieval returns catalog rows, when the LLM request is created, then the prompt includes those books and preserves the `[BOOKS]` block instruction.
- Given SGLang is not configured or unavailable, when `/chat/stream` is called, then the AI service responds with a controlled error message rather than raising an unhandled exception.
- Given the Docker Compose stack is used on a non-GPU developer machine, when services are started without the SGLang profile, then the default database/search/auth/frontend/backend services remain usable.

## Spec Change Log

## Design Notes

Use SGLang through its OpenAI-compatible API instead of its native API. This minimizes custom code and keeps the AI service portable to vLLM or other OpenAI-compatible model servers later.

Example target deployment:

```text
BookBot -> Fastify WS -> FastAPI RAG -> SGLang /v1/chat/completions
                            |             on Akamai RTX 4000 Ada GPU VM
                            +-> PostgreSQL pgvector + Meilisearch knowledge base
```

Default model guidance should prefer a 7B-8B instruct model for a single RTX 4000 Ada card with 20 GB VRAM. Larger models should require explicit sizing/quantization decisions.

## Verification

**Commands:**
- `cd akamai-bookstore/ai-service && python -m compileall app` -- expected: Python files compile.
- `cd akamai-bookstore/backend && npm run typecheck` -- expected: backend still typechecks because assistant API contract is unchanged.

**Manual checks:**
- Review `.env.example` and README to confirm SGLang is the primary documented generation backend.
- With a reachable SGLang server, open BookBot and confirm streamed responses still render text and book cards.

## Suggested Review Order

**Generation Adapter**

- Start here to understand the new SGLang/OpenAI-compatible generation boundary.
  [`llm_client.py:7`](../../akamai-bookstore/ai-service/app/services/llm_client.py#L7)

- Streaming call preserves the existing token contract while changing providers.
  [`llm_client.py:73`](../../akamai-bookstore/ai-service/app/services/llm_client.py#L73)

- Chat routes now depend on the provider-neutral client.
  [`chat.py:6`](../../akamai-bookstore/ai-service/app/routers/chat.py#L6)

**Runtime Configuration**

- Qwen/SGLang defaults live in typed AI service settings.
  [`config.py:18`](../../akamai-bookstore/ai-service/app/config.py#L18)

- OpenAI-compatible client dependency supports SGLang chat completions.
  [`requirements.txt:5`](../../akamai-bookstore/ai-service/requirements.txt#L5)

- Environment template documents Qwen defaults and RAG knobs.
  [`.env.example:25`](../../akamai-bookstore/.env.example#L25)

**GPU Serving**

- Optional Compose profile runs SGLang only on GPU-capable hosts.
  [`docker-compose.yml:105`](../../akamai-bookstore/docker-compose.yml#L105)

- Kubernetes SGLang deployment pins Qwen3-8B and requests one GPU.
  [`deployment.yaml:24`](../../akamai-bookstore/k8s/sglang/deployment.yaml#L24)

- AI service points at the in-cluster SGLang endpoint.
  [`deployment.yaml:49`](../../akamai-bookstore/k8s/ai-service/deployment.yaml#L49)

**Documentation**

- README explains Qwen selection and Akamai RTX 4000 Ada setup.
  [`README.md:72`](../../akamai-bookstore/README.md#L72)

- Implementation notes now describe SGLang/Qwen as the generation layer.
  [`implementation-details.md:100`](implementation-details.md#L100)
