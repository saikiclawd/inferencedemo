---
project: Akamai Bookstore
document: Implementation Details
date: 2026-05-11
status: draft
source: brownfield review of akamai-bookstore
---

# Akamai Bookstore Implementation Details

## Technical Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router |
| API | Node.js, Fastify 4, TypeScript, Zod |
| AI Service | Python, FastAPI, sentence-transformers, OpenAI-compatible SGLang client |
| Auth | Keycloak 24, JWT, JWKS |
| Primary DB | PostgreSQL 16 with pgvector |
| Cache/Ranking | Valkey/Redis sorted sets |
| Search | Meilisearch 1.8 |
| Local Runtime | Docker Compose |
| Target Runtime | Akamai Connected Cloud, LKE, Akamai CDN |

## Backend Implementation

### App Bootstrap

- `backend/src/server.ts` starts the Fastify server.
- `backend/src/app.ts` builds the app, registers common plugins, registers domain routes, exposes `/health`, and centralizes error handling.
- Rate limit is set to 200 requests per minute.
- CORS allows credentials and dynamic origins.
- Helmet CSP is disabled, likely to simplify local development and frontend integration.

### Configuration

- `backend/src/config.ts` validates environment variables with Zod.
- Required production-sensitive values include `POSTGRES_PASSWORD`, `MEILI_MASTER_KEY`, and `KEYCLOAK_JWKS_URI`.
- Optional Akamai Object Storage values are present for S3-compatible asset handling, though the scanned routes do not actively use them.

### Route Modules

- `books.ts`: catalog listing and detail lookup from PostgreSQL.
- `search.ts`: Meilisearch query with pagination, category filter, and limited sorting.
- `bestsellers.ts`: reads Redis sorted set and hydrates books from PostgreSQL.
- `cart.ts`: protected cart CRUD and merge endpoint.
- `orders.ts`: protected checkout and order history.
- `recommendations.ts`: pgvector recommendations, personalized when purchase history exists.
- `assistant.ts`: WebSocket and HTTP proxy to AI service with JWT validation.

## Frontend Implementation

### Routing

- `/`: home page with hero, categories, bestsellers, and featured books.
- `/browse`: category-filtered catalog.
- `/books/:id`: book detail page.
- `/search`: search results.
- `/cart`: authenticated cart view.
- `/checkout`: protected checkout.
- `/orders`: protected order history.

### State

- `auth.store.ts`: stores token, user object, and authenticated state.
- `cart.store.ts`: fetches, adds, updates, removes, checks out, and clears cart items.
- `assistant.store.ts`: manages BookBot messages and streaming state.

### API Clients

- Axios-based API modules live under `frontend/src/api`.
- Frontend build-time configuration comes from `VITE_API_URL`, `VITE_WS_URL`, and Keycloak Vite variables.

### BookBot

- `BookBot.tsx` opens a WebSocket when the assistant panel opens.
- Messages stream token-by-token into a pending assistant message.
- Errors append a generic apology and finalize the pending message.
- Current implementation creates a new `sessionId` for each sent message; persistent conversation sessions would require reusing a stable session ID.

## AI Service Implementation

### Startup

- `main.py` defines a FastAPI app with lifespan initialization.
- Startup loads the embedding model, opens PostgreSQL, and initializes Meilisearch.

### Retrieval

- `services/rag.py` embeds the incoming query.
- Vector search reads nearest books from PostgreSQL using pgvector cosine distance.
- Keyword search reads Meilisearch hits.
- Reciprocal rank fusion merges vector and keyword lists.
- The merged list is truncated to `max_context_books`.

### Chat

- `/chat/stream` returns server-sent event chunks for streaming.
- `/chat` returns a complete response and extracts referenced UUIDs from the model output when they match retrieved books.
- Generation is handled by an OpenAI-compatible SGLang server, defaulting to `Qwen/Qwen3-8B`.
- `Qwen/Qwen2.5-7B-Instruct` is the stable fallback model when structured output reliability is preferred over newer-model capability.

## Database Implementation

PostgreSQL schema is initialized by `scripts/init.sql`.

- `books`: catalog records plus 384-dimensional embeddings.
- `cart`: one row per customer and book, with unique `(customer_id, book_id)`.
- `orders`: order header with status.
- `order_items`: purchased line items.

Indexes:

- `idx_books_category` for category browsing.
- `idx_books_embedding` using ivfflat and cosine ops for vector search.
- `idx_cart_customer`, `idx_orders_customer`, and `idx_order_items_order` for user and order lookups.

## Data Preparation

- `scripts/seed.ts` loads book records into PostgreSQL.
- `scripts/generate-embeddings.py` populates book embeddings.
- `scripts/index-meilisearch.ts` indexes catalog fields for search.
- `scripts/seed-redis-leaderboard.ts` initializes bestseller rankings.
- `scripts/keycloak-realm.json` imports the local Keycloak realm.

## Deployment Notes

### Local

Docker Compose starts:

- PostgreSQL with pgvector.
- Valkey/Redis.
- Meilisearch.
- Keycloak.
- SGLang, when the `gpu` Compose profile is enabled.
- Backend API.
- AI service.
- Frontend served by Nginx.

### Production Target

The README describes:

- Akamai CDN in front of an HTTPS NodeBalancer.
- LKE cluster for application workloads.
- RTX 4000 Ada GPU nodes for SGLang/Qwen inference.
- Akamai Object Storage for assets.
- GitHub Actions for CI/CD and CDN purge.

Confirm the completeness of `k8s/` manifests before treating the production deployment as turnkey.

## Suggested Implementation Backlog

1. Add automated backend route tests for catalog, cart, checkout, recommendations, and assistant proxy errors.
2. Add frontend integration tests for browse, search, cart, checkout, and BookBot error handling.
3. Decide and implement guest cart behavior end-to-end.
4. Add inventory decrement and stock validation if checkout should model real commerce.
5. Replace BookBot token-in-query auth with a more production-suitable WebSocket authentication approach.
6. Add OpenAPI or generated API documentation.
7. Add CI jobs for frontend typecheck/build, backend typecheck/test, and AI service lint/test.
8. Add operational runbooks for seeding, embeddings, Meilisearch rebuild, and Keycloak realm rotation.

## Acceptance Checklist For Current Application

- Frontend builds with Vite and TypeScript.
- Backend typechecks and starts with required environment variables.
- AI service starts after `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, and data dependencies are configured.
- PostgreSQL schema initializes successfully.
- Seed scripts populate books, embeddings, search index, and Redis bestsellers.
- User can browse, search, sign in, add to cart, checkout, view orders, receive recommendations, and use BookBot.
