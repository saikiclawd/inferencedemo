# Build context: ./akamai-bookstore

# Stage 1: install Node.js deps and copy scripts
FROM node:20-alpine AS node-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY scripts/ ./scripts/

# Stage 2: Python + Node runtime with pre-cached embedding model
FROM python:3.11-slim
RUN apt-get update && apt-get install -y curl gnupg2 gcc g++ \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip install --no-cache-dir asyncpg==0.29.0 "sentence-transformers==2.7.0"
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/scripts     ./scripts
COPY --from=node-builder /app/package.json ./

CMD ["sh", "-c", \
  "node_modules/.bin/tsx scripts/seed.ts && \
   python scripts/generate-embeddings.py && \
   node_modules/.bin/tsx scripts/index-meilisearch.ts && \
   node_modules/.bin/tsx scripts/seed-redis-leaderboard.ts"]
