from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    books_referenced: list[str] = []


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    dimensions: int
