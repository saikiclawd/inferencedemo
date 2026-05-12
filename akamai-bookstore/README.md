# Akamai Bookstore

A production-grade bookstore web application running entirely on **Akamai Connected Cloud** (formerly Linode) infrastructure — an AWS Bookstore Demo App re-architected on open-source equivalents.

## Architecture

```
Akamai CDN (Ion)  →  NodeBalancer (HTTPS)  →  LKE Cluster
                                               ├── React SPA (Nginx)
                                               ├── Fastify API
                                               ├── Keycloak (Auth)
                                               ├── PostgreSQL + pgvector
                                               ├── Valkey/Redis (leaderboard)
                                               ├── Meilisearch (full-text search)
                                               ├── AI Service (FastAPI RAG)
                                               └── SGLang (Qwen model inference)
```

## Service Migration Map

| AWS | Akamai / Open-Source |
|-----|----------------------|
| DynamoDB | PostgreSQL 16 + pgvector |
| API Gateway | Fastify 4 on LKE |
| Lambda | Containerized Fastify handlers |
| Cognito | Keycloak 24 (PKCE / JWT) |
| Elasticsearch | Meilisearch 1.x |
| ElastiCache (Redis) | Valkey 7 (sorted sets) |
| Neptune | pgvector cosine similarity |
| S3 | Akamai Object Storage |
| CloudFront | Akamai CDN (Ion) |
| CodePipeline | GitHub Actions |

## Features

- Book catalog with category browsing and full-text search
- User authentication via Keycloak (PKCE + JWT)
- Shopping cart with merge-on-login
- Order history and checkout flow
- Best-sellers leaderboard (Redis sorted sets, updated on checkout)
- AI-powered recommendations (pgvector cosine similarity)
- **BookBot** — floating AI shopping assistant (RAG: pgvector + Meilisearch -> SGLang/Qwen, streaming WebSocket)

## Local Development

```bash
# 1. Copy env file
cp .env.example .env
# Edit .env if SGLang runs at a different LLM_BASE_URL

# 2. Start infrastructure
docker-compose up -d postgres redis meilisearch keycloak

# 3. Wait for postgres to be ready, then seed
npx tsx scripts/seed.ts

# 4. Generate embeddings (~2 min on CPU)
python scripts/generate-embeddings.py

# 5. Index Meilisearch
npx tsx scripts/index-meilisearch.ts

# 6. Seed Redis leaderboard
npx tsx scripts/seed-redis-leaderboard.ts

# 7. Start all non-GPU services
docker-compose up -d
```

App is at **http://localhost:5173**, API at **http://localhost:3000**, Keycloak at **http://localhost:8080**.

### BookBot with SGLang

BookBot uses a local OpenAI-compatible SGLang server for generation. The default model is **`Qwen/Qwen3-8B`**, selected for a single Akamai RTX 4000 Ada GPU with 20 GB VRAM. If you want the most conservative structured-output fallback, use **`Qwen/Qwen2.5-7B-Instruct`**.

On an Akamai GPU host with NVIDIA Docker support:

```bash
# Starts SGLang plus the rest of the stack.
docker-compose --profile gpu up -d
```

To run SGLang separately on an Akamai RTX 4000 Ada instance:

```bash
docker run --gpus all \
  --shm-size 32g \
  -p 30000:30000 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  --env "HF_TOKEN=${HF_TOKEN}" \
  --ipc=host \
  lmsysorg/sglang:latest-runtime \
  python3 -m sglang.launch_server \
    --model-path Qwen/Qwen3-8B \
    --host 0.0.0.0 \
    --port 30000 \
    --api-key bookstore-local-key
```

Then point the AI service at it:

```env
LLM_BASE_URL=http://<sglang-host>:30000/v1
LLM_API_KEY=bookstore-local-key
LLM_MODEL=Qwen/Qwen3-8B
```

The knowledge base remains local to the app stack:

- `scripts/seed.ts` loads book metadata into PostgreSQL.
- `scripts/generate-embeddings.py` stores `all-MiniLM-L6-v2` embeddings in `books.embedding`.
- `scripts/index-meilisearch.ts` indexes searchable catalog text.
- The AI service retrieves from pgvector and Meilisearch, then sends only the selected catalog context to SGLang.

## Project Structure

```
akamai-bookstore/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind + Zustand
├── backend/           # Fastify 4 + TypeScript
├── ai-service/        # Python FastAPI (RAG pipeline + OpenAI-compatible SGLang client)
├── k8s/               # Kubernetes manifests (LKE)
├── scripts/           # Seed data, embedding generation, Meilisearch indexing
└── .github/workflows/ # CI (PR checks) + CD (build → deploy → CDN purge)
```

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/books` | — | List books (`?category=`, `?page=`, `?pageSize=`) |
| GET | `/api/books/:id` | — | Book detail |
| GET | `/api/bestsellers` | — | Top 20 by Redis leaderboard |
| GET | `/api/search?q=` | — | Full-text search via Meilisearch |
| GET | `/api/cart` | JWT | User's cart |
| POST | `/api/cart` | JWT | Add to cart |
| PUT | `/api/cart` | JWT | Update quantity |
| DELETE | `/api/cart/:bookId` | JWT | Remove from cart |
| POST | `/api/cart/merge` | JWT | Merge guest cart on login |
| GET | `/api/orders` | JWT | Order history |
| POST | `/api/orders` | JWT | Checkout (clears cart, updates leaderboard) |
| GET | `/api/recommendations` | JWT | Personalized via pgvector |
| GET | `/api/recommendations/:bookId` | — | Similar books via pgvector |
| WS | `/api/assistant?token=` | JWT (query) | BookBot streaming chat |
| POST | `/api/assistant/chat` | JWT | BookBot HTTP fallback |

## Kubernetes Deployment

```bash
# Provision LKE cluster on Akamai Connected Cloud
linode-cli lke cluster-create \
  --label bookstore-prod \
  --region us-east \
  --k8s_version 1.31 \
  --node_pools.type g6-dedicated-4 \
  --node_pools.count 3 \
  --node_pools.labels pool=app

# Get kubeconfig
linode-cli lke kubeconfig-view <cluster-id> --no-truncation \
  | jq -r '.[].[] | .kubeconfig' | base64 -d > ~/.kube/config

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/meilisearch/
kubectl apply -f k8s/keycloak/
kubectl apply -f k8s/sglang/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/ai-service/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
```

The SGLang manifest expects a GPU-capable node pool labeled `pool=ai` with NVIDIA GPU scheduling enabled. For RTX 4000 Ada, start with `Qwen/Qwen3-8B` on one GPU. Use `Qwen/Qwen2.5-7B-Instruct` if you want the most conservative fallback for structured `[BOOKS]` output.

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `KUBECONFIG` | Base64-encoded kubeconfig for LKE |
| `LLM_BASE_URL` | SGLang OpenAI-compatible base URL |
| `LLM_API_KEY` | Bearer token configured for SGLang |
| `LLM_MODEL` | Qwen model served by SGLang |
| `HF_TOKEN` | Optional Hugging Face token for gated model downloads |
| `AKAMAI_EDGERC` | Akamai EdgeGrid credentials for CDN purge |
| `PROD_POSTGRES_HOST` | Production DB host (for seed workflow) |
| `PROD_POSTGRES_PASSWORD` | Production DB password |
| `PROD_MEILI_HOST` | Production Meilisearch host |
| `PROD_MEILI_MASTER_KEY` | Production Meilisearch master key |

## Environment Variables

See [`.env.example`](.env.example) for the full list.

## CDN Cache Rules (Akamai Ion)

| Path | TTL | Notes |
|------|-----|-------|
| `/static/*` | 30 days | Immutable fingerprinted assets |
| `/covers/*` | 7 days | Book cover images |
| `/api/books` | 5 minutes | Catalog browsing |
| `/api/bestsellers` | 1 minute | Leaderboard updates frequently |
| `/api/cart`, `/api/orders` | No cache | User-specific + authenticated |
| `/api/assistant` | No cache | Real-time WebSocket |
