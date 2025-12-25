from fastapi import APIRouter

from src.core.database import SessionDep
from src.ai.services import generate_consulting_response
from src.ai.schemas import ChatRequest, ChatResponse


ai_router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


@ai_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(payload: ChatRequest, db: SessionDep):
    reply_text = await generate_consulting_response(payload.message, db)
    return ChatResponse(reply=reply_text)