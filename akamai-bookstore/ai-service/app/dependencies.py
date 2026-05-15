import asyncpg
from meilisearch_python_sdk import AsyncClient as MeiliAsyncClient
from app.config import settings

_db_pool: asyncpg.Pool | None = None
_meili_client: MeiliAsyncClient | None = None


async def init_db() -> None:
    global _db_pool
    _db_pool = await asyncpg.create_pool(
        host=settings.postgres_host,
        port=settings.postgres_port,
        database=settings.postgres_db,
        user=settings.postgres_user,
        password=settings.postgres_password,
        min_size=2,
        max_size=10,
    )


async def close_db() -> None:
    if _db_pool:
        await _db_pool.close()


def init_meili() -> None:
    global _meili_client
    _meili_client = MeiliAsyncClient(
        url=settings.meili_host,
        api_key=settings.meili_master_key,
    )


async def get_db() -> asyncpg.Pool:
    if _db_pool is None:
        await init_db()
    return _db_pool


async def get_meili() -> MeiliAsyncClient:
    if _meili_client is None:
        init_meili()
    return _meili_client
