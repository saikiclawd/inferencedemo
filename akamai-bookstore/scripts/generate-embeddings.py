"""
Generate and store vector embeddings for all books in the database.
Run after seed.ts to populate the embedding column.

Usage:
  POSTGRES_HOST=localhost POSTGRES_PASSWORD=changeme python scripts/generate-embeddings.py
"""

import asyncio
import json
import os
import sys

import asyncpg
from sentence_transformers import SentenceTransformer

POSTGRES_DSN = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'bookstore')}"
    f":{os.getenv('POSTGRES_PASSWORD', 'changeme')}"
    f"@{os.getenv('POSTGRES_HOST', 'localhost')}"
    f":{os.getenv('POSTGRES_PORT', '5432')}"
    f"/{os.getenv('POSTGRES_DB', 'bookstore')}"
)


async def main() -> None:
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded.")

    pool = await asyncpg.create_pool(POSTGRES_DSN)

    async with pool.acquire() as conn:
        books = await conn.fetch(
            "SELECT id, title, author, description FROM books WHERE embedding IS NULL"
        )

    if not books:
        print("No books need embeddings. All done.")
        await pool.close()
        return

    print(f"Generating embeddings for {len(books)} books...")

    for i, book in enumerate(books, 1):
        text = f"{book['title']} by {book['author']}. {book['description'] or ''}"
        embedding = model.encode(text, normalize_embeddings=True).tolist()
        vec_str = "[" + ",".join(str(v) for v in embedding) + "]"

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE books SET embedding = $1::vector WHERE id = $2",
                vec_str,
                book["id"],
            )

        print(f"  [{i}/{len(books)}] {book['title']}")

    print("\nEmbedding generation complete.")
    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
