import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag import retrieve_books
from app.services.llm_client import stream_chat, chat
from app.dependencies import get_db, get_meili
import asyncpg
from meilisearch_python_sdk import AsyncClient as MeiliAsyncClient

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    req: ChatRequest,
    db: asyncpg.Pool = Depends(get_db),
    meili: MeiliAsyncClient = Depends(get_meili),
) -> StreamingResponse:
    books = await retrieve_books(req.message, db, meili)

    async def event_generator():
        async for token in stream_chat(req.message, books):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    db: asyncpg.Pool = Depends(get_db),
    meili: MeiliAsyncClient = Depends(get_meili),
) -> ChatResponse:
    books = await retrieve_books(req.message, db, meili)
    response_text = await chat(req.message, books)

    import re
    ids = re.findall(r'"([0-9a-f-]{36})"', response_text)
    book_ids = [b["id"] for b in books]
    referenced = [i for i in ids if i in book_ids]

    return ChatResponse(response=response_text, books_referenced=referenced)
