import asyncpg
from meilisearch_python_sdk import AsyncClient as MeiliAsyncClient
from app.config import settings
from app.services.embedder import embed


def _rrf_merge(list_a: list[dict], list_b: list[dict], k: int = 60) -> list[dict]:
    scores: dict[str, float] = {}
    all_items: dict[str, dict] = {}

    for rank, item in enumerate(list_a):
        item_id = str(item["id"])
        scores[item_id] = scores.get(item_id, 0) + 1 / (k + rank + 1)
        all_items[item_id] = dict(item)

    for rank, item in enumerate(list_b):
        item_id = str(item.get("id", ""))
        if not item_id:
            continue
        scores[item_id] = scores.get(item_id, 0) + 1 / (k + rank + 1)
        if item_id not in all_items:
            all_items[item_id] = item

    return sorted(all_items.values(), key=lambda x: scores.get(str(x["id"]), 0), reverse=True)


async def retrieve_books(
    query: str,
    db_pool: asyncpg.Pool,
    meili_client: MeiliAsyncClient,
) -> list[dict]:
    query_vec = embed(query)
    vec_str = "[" + ",".join(str(v) for v in query_vec) + "]"

    async with db_pool.acquire() as conn:
        vector_rows = await conn.fetch(
            """
            SELECT id::text, title, author, category, description, price::float, cover_url,
                   1 - (embedding <=> $1::vector) AS score
            FROM books
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2
            """,
            vec_str,
            settings.rag_top_k_vector,
        )

    vector_dicts = [dict(r) for r in vector_rows]

    try:
        index = meili_client.index("books")
        search_result = await index.search(
            query,
            limit=settings.rag_top_k_search,
            attributes_to_retrieve=["id", "title", "author", "category", "description", "price", "cover_url"],
        )
        meili_hits = search_result.hits
    except Exception:
        meili_hits = []

    merged = _rrf_merge(vector_dicts, meili_hits)
    return merged[: settings.max_context_books]
