CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE books (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  rating      NUMERIC(3,2) DEFAULT 0,
  cover_url   TEXT,
  quantity    INTEGER DEFAULT 0,
  embedding   vector(384),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_category ON books (category);
CREATE INDEX idx_books_embedding ON books USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE cart (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT NOT NULL,
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  price       NUMERIC(10,2) NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_id, book_id)
);

CREATE INDEX idx_cart_customer ON cart (customer_id);

CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT NOT NULL,
  order_date  TIMESTAMPTZ DEFAULT NOW(),
  total       NUMERIC(10,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','shipped','delivered','cancelled'))
);

CREATE INDEX idx_orders_customer ON orders (customer_id);

CREATE TABLE order_items (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id  UUID NOT NULL REFERENCES books(id),
  quantity INTEGER NOT NULL,
  price    NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
