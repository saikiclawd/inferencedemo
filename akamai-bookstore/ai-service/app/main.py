from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.dependencies import close_db
from app.routers import chat, embeddings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_db()


app = FastAPI(title="BookStore AI Service", lifespan=lifespan)

app.include_router(chat.router)
app.include_router(embeddings.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
