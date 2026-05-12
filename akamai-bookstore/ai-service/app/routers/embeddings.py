from fastapi import APIRouter
from app.models.schemas import EmbedRequest, EmbedResponse
from app.services.embedder import embed

router = APIRouter(prefix="/embed", tags=["embeddings"])


@router.post("", response_model=EmbedResponse)
async def create_embedding(req: EmbedRequest) -> EmbedResponse:
    vector = embed(req.text)
    return EmbedResponse(embedding=vector, dimensions=len(vector))
