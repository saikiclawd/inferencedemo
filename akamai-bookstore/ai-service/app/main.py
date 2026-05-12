from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.dependencies import init_db, close_db, init_meili
from app.routers import chat, embeddings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    init_meili()
    yield
    await close_db()


app = FastAPI(title="BookStore AI Service", lifespan=lifespan)

app.include_router(chat.router)
app.include_router(embeddings.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
