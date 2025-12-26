from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer

from src.core.database import SessionDep
from src.ai.services import generate_consulting_response
from src.ai.schemas import ChatRequest, ChatResponse
from src.auth.dependencies import get_current_user
from src.user.schemas import UserResponse


ai_router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user_optional(
    token: str = Depends(oauth2_scheme), 
    db: SessionDep = None
) -> Optional[UserResponse]:
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except Exception:
        return None

@ai_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    payload: ChatRequest, 
    db: SessionDep,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    reply_text = await generate_consulting_response(payload.message, payload.history, db, current_user)
    return ChatResponse(reply=reply_text)