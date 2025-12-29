from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.future import select
from sqlalchemy import or_, and_, delete
from typing import List, Optional

from src.core.database import SessionDep
from src.auth.dependencies import get_current_user, allow_staff
from src.auth.security import decode_token
from src.chat.models import ChatMessage
from src.chat.manager import chat_manager
from src.user.models import User


chat_router = APIRouter(prefix="/chat", tags=["Chat"])


async def get_user_from_socket(token: str = Query(...), db: SessionDep = None):
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        return user
    except:
        return None
    

@chat_router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = Query(...),
    db: SessionDep = None
):
    user = await get_user_from_socket(token, db)
    if not user:
        await websocket.close(code=4001)
        return

    user_id = str(user.id)
    role = str(user.role).lower()

    await chat_manager.connect(websocket, user_id, role)

    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("message")
            
            if not content: 
                continue
            
            # TRƯỜNG HỢP 1: USER GỬI TIN
            if role == "customer":
                new_msg = ChatMessage(
                    sender_id=user.id,
                    content=content,
                    message_type="admin_chat",
                    receiver_id=None
                )
                db.add(new_msg)
                await db.commit()
                
                msg_payload = {
                    "type": "new_message",
                    "sender_role": "customer",
                    "sender_id": user_id,
                    "sender_name": user.last_name,
                    "message": content,
                    "timestamp": str(new_msg.created_at)
                }
                await chat_manager.broadcast_to_admins(msg_payload)

            # TRƯỜNG HỢP 2: ADMIN GỬI TIN
            elif role in ["admin", "staff", "stock_manager"]:
                target_user_id = data.get("receiver_id")
                
                if not target_user_id:
                    await websocket.send_json({"error": "Admin phải chọn người nhận."})
                    continue
                
                new_msg = ChatMessage(
                    sender_id=user.id,
                    receiver_id=target_user_id,
                    content=content,
                    message_type="admin_chat"
                )
                db.add(new_msg)
                await db.commit()
                
                msg_payload = {
                    "type": "new_message",
                    "sender_role": "admin",
                    "sender_id": user_id,
                    "message": content,
                    "timestamp": str(new_msg.created_at)
                }
                
                sent = await chat_manager.send_personal_message(msg_payload, target_user_id)
                if not sent:
                    await websocket.send_json({"system_notification": "Người dùng hiện không trực tuyến. Tin nhắn đã được lưu."})

    except WebSocketDisconnect:
        chat_manager.disconnect(user_id, role)


@chat_router.delete("/conversation/{user_id}")
async def end_conversation(
    user_id: str, 
    db: SessionDep, 
    current_user: User = Depends(allow_staff)
):
    stmt = delete(ChatMessage).where(
        and_(
            ChatMessage.message_type == "admin_chat",
            or_(
                ChatMessage.sender_id == user_id,
                ChatMessage.receiver_id == user_id
            )
        )
    )
    await db.execute(stmt)
    await db.commit()
    
    await chat_manager.send_personal_message(
        {"type": "conversation_ended", "message": "Admin đã kết thúc đoạn hội thoại."},
        str(user_id)
    )
    
    return {"message": "Đã xóa lịch sử hội thoại thành công"}


@chat_router.get("/history")
async def get_chat_history(
    db: SessionDep, 
    current_user: User = Depends(get_current_user),
    target_user_id: Optional[str] = Query(None)
):
    if current_user.role == "customer":
        query_user_id = current_user.id
    else:
        if not target_user_id:
            return []
        query_user_id = target_user_id

    stmt = select(ChatMessage).where(
        and_(
            ChatMessage.message_type == "admin_chat",
            or_(
                ChatMessage.sender_id == query_user_id,
                ChatMessage.receiver_id == query_user_id
            )
        )
    ).order_by(ChatMessage.created_at.asc())
    
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    return [
        {
            "id": str(msg.id),
            "sender": "customer" if msg.sender_id == query_user_id else "admin",
            "message": msg.content,
            "created_at": msg.created_at
        } for msg in messages
    ]


@chat_router.get("/status")
async def check_admin_status():
    has_admin = len(chat_manager.online_admins) > 0
    return {"online": has_admin}


@chat_router.get("/conversations")
async def get_active_conversations(
    db: SessionDep, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "customer":
        return []

    stmt = select(ChatMessage.sender_id).where(ChatMessage.message_type == "admin_chat").distinct()
    result = await db.execute(stmt)
    user_ids = result.scalars().all()
    
    if not user_ids: return []
    
    users_stmt = select(User).where(
        and_(
            User.id.in_(user_ids),
            User.role == "customer" 
        )
    )
    users = (await db.execute(users_stmt)).scalars().all()
    
    return [
        {"id": str(u.id), "full_name": u.last_name, "email": u.email} 
        for u in users
    ]