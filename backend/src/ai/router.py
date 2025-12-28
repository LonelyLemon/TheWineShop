from loguru import logger
from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, HTTPAuthorizationCredentials

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
    request: Request,
    token: str = Depends(oauth2_scheme), 
    db: SessionDep = None
) -> Optional[UserResponse]:
    auth_header = request.headers.get("Authorization")
    logger.info(f"[DEBUG AUTH] Auth Header: {auth_header}")
    logger.info(f"[DEBUG AUTH] Extracted Token: {token[:10]}..." if token else "[DEBUG AUTH] Token: None")

    if not token:
        return None
    try:
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = await get_current_user(db, creds)
        logger.info(f"[DEBUG AUTH] User found: {user.id if user else 'None'}")
        return user
    except Exception as e:
        logger.error(f"[DEBUG AUTH] Token decode failed: {e}")
        return None

@ai_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    payload: ChatRequest, 
    db: SessionDep,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    logger.info(f"[AI ROUTER] User context passed to Service: {current_user.email if current_user else 'ANONYMOUS'}")
    reply_text = await generate_consulting_response(payload.message, payload.history, db, current_user)
    return ChatResponse(reply=reply_text)