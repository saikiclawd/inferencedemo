---
project: Akamai Bookstore
document: Product Requirements Document
date: 2026-05-11
status: draft
stepsCompleted: [1]
source: brownfield review of akamai-bookstore
---

# Akamai Bookstore PRD

## 1. Purpose

Akamai Bookstore is a production-grade ecommerce demo that shows how an AWS-style bookstore reference application can be re-architected on Akamai Connected Cloud and open-source services. The product should let shoppers browse, search, purchase, view orders, receive recommendations, and ask an AI shopping assistant for help discovering books.

## 2. Product Goals

- Demonstrate a complete ecommerce workload on Akamai Connected Cloud, LKE, Akamai CDN, and open-source infrastructure.
- Provide a credible bookstore shopping experience with catalog browsing, search, cart, checkout, and order history.
- Showcase AI-assisted shopping through BookBot, using retrieval augmented generation over catalog data.
- Validate migration patterns from AWS managed services to portable open-source equivalents.
- Provide clear implementation artifacts for developers to extend the app consistently.

## 3. Users

### Shopper

Browses the catalog, searches for books, signs in, manages a cart, checks out, views order history, and asks BookBot for recommendations.

### Demo Operator

Runs the stack locally or on Akamai Connected Cloud, seeds data, demonstrates migration architecture, and validates feature behavior.

### Developer

Maintains the React frontend, Fastify backend, FastAPI AI service, data scripts, and deployment manifests.

## 4. Current Scope

### In Scope

- Public home page with category entry points, bestsellers, and featured books.
- Catalog browsing with category filter and pagination.
- Book detail pages with similar-book recommendations.
- Full-text search through Meilisearch.
- Keycloak authentication with JWT-protected user actions.
- Authenticated cart CRUD and merge-on-login API support.
- Checkout that converts cart items into orders and updates bestseller rankings.
- Authenticated order history.
- Personalized recommendations using pgvector embeddings.
- Floating BookBot assistant using WebSocket streaming and HTTP fallback.
- Local Docker Compose environment.
- Kubernetes-oriented production deployment structure.

### Out of Scope For Current Draft

- Payment processing.
- Inventory reservation and stock decrementing.
- Admin catalog management.
- Shipment tracking beyond static order statuses.
- Multi-tenant storefront management.
- Formal accessibility, security, or performance certification.

## 5. Functional Requirements

### Catalog

- FR1: Users can view a paginated list of books.
- FR2: Users can filter books by category.
- FR3: Users can view book details including title, author, category, description, price, rating, cover, and quantity.
- FR4: The home page displays category links, bestsellers when available, and featured books.

### Search

- FR5: Users can submit a text query and receive Meilisearch-backed results.
- FR6: Search supports optional category filtering.
- FR7: Search supports optional sort values for ascending price, descending price, and descending rating.

### Authentication

- FR8: Keycloak authenticates users through the frontend.
- FR9: Backend protected routes verify JWTs against Keycloak JWKS.
- FR10: Checkout, order history, cart, personalized recommendations, and BookBot require authenticated identity.

### Cart

- FR11: Authenticated users can retrieve their cart.
- FR12: Authenticated users can add a book to the cart.
- FR13: Adding an existing cart item increases quantity.
- FR14: Authenticated users can update item quantity.
- FR15: Authenticated users can remove an item.
- FR16: The backend can merge guest cart items into an authenticated cart.

### Checkout And Orders

- FR17: Authenticated users can create an order from current cart contents.
- FR18: Empty carts cannot be checked out.
- FR19: Checkout creates order and order item records.
- FR20: Checkout clears the cart after successful order creation.
- FR21: Checkout increments the Redis/Valkey bestseller sorted set by purchased quantity.
- FR22: Authenticated users can view previous orders and item details.

### Recommendations

- FR23: Authenticated users receive personalized recommendations from prior purchases when history exists.
- FR24: Users without purchase history receive highly rated books.
- FR25: Users can view similar books for a selected book using pgvector cosine similarity.

### BookBot

- FR26: Users can open a floating AI shopping assistant from any frontend route.
- FR27: BookBot streams assistant responses over WebSocket.
- FR28: Backend validates the WebSocket token before forwarding chat requests.
- FR29: Backend forwards assistant requests to the AI service.
- FR30: AI service retrieves relevant books from pgvector and Meilisearch, merges results, and sends catalog context to a self-hosted SGLang Qwen model.
- FR31: HTTP chat fallback returns a full response and referenced book IDs.

### Operations

- FR32: Local environment runs PostgreSQL with pgvector, Valkey/Redis, Meilisearch, Keycloak, backend, AI service, and frontend through Docker Compose.
- FR33: Seed scripts populate PostgreSQL, generate embeddings, index Meilisearch, and seed bestsellers.
- FR34: Health endpoints exist for backend and AI service.

## 6. Non-Functional Requirements

- NFR1: API input validation must reject malformed payloads with clear errors.
- NFR2: Authenticated data must be scoped to the JWT subject.
- NFR3: Public catalog and search APIs should remain usable without authentication.
- NFR4: BookBot streaming should degrade gracefully on AI service errors.
- NFR5: Local setup should be reproducible from `.env.example`, Docker Compose, and seed scripts.
- NFR6: Production architecture should support CDN caching for static assets and public catalog reads while disabling cache for user-specific and real-time routes.
- NFR7: Service health checks should cover dependent data stores where practical.

## 7. Success Metrics

- Demo operator can start the full stack locally and complete browse, search, login, cart, checkout, orders, and BookBot flows.
- Search returns relevant catalog results from seeded data.
- Checkout updates order history and bestsellers.
- Recommendations return vector-similar books after embeddings are generated.
- BookBot streams helpful responses grounded in catalog data.
- Documentation is complete enough for a developer to make the next feature change without rediscovering architecture.

## 8. Product Risks And Review Findings

- Cart UX currently requires sign-in to view or use the cart, while the backend includes a guest cart merge endpoint. Decide whether guest cart is intended and implement the frontend flow if yes.
- Checkout does not decrement inventory or guard against overselling. This is acceptable for a demo but should be explicit.
- Orders are created with `pending` status and no payment workflow. Treat checkout as demo order placement, not real commerce.
- BookBot WebSocket passes JWT in the query string. This is simple for a demo but should be reviewed before production use because URLs can be logged.
- Recommendation quality depends on embeddings being generated after seed data. Empty embeddings will reduce the feature to fallback behavior.
- There is no visible automated test suite in the current scan. Add focused API and frontend coverage before expanding behavior.

## 9. Open Questions

- Should the cart support true unauthenticated shopping and merge after login?
- Should inventory quantity block checkout or only display availability?
- Should BookBot be available only after sign-in, or should public anonymous chat be supported with rate limits?
- Is this primarily a production reference architecture, a sales demo, or a reusable starter application?
- Which Akamai deployment artifacts are authoritative if Kubernetes manifests are incomplete or environment-specific?
