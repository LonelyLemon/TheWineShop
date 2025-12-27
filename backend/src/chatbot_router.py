from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
from pydantic import BaseModel
import google.generativeai as genai
import json

# --- CẤU HÌNH ---
# 1. API Key Gemini: Lấy tại https://aistudio.google.com/
GOOGLE_API_KEY = "AIzaSyAukvyYuEYvZz6kKxGx1gxvIeETXN7HOF0"

# 2. Cấu hình AI Model
if GOOGLE_API_KEY and GOOGLE_API_KEY != "AIzaSyAukvyYuEYvZz6kKxGx1gxvIeETXN7HOF0":
    genai.configure(api_key=GOOGLE_API_KEY)
    SYSTEM_INSTRUCTION = """
    Bạn là Sommelier (Chuyên gia rượu vang) của WineLux.
    - Nhiệm vụ: Tư vấn nhiệt tình, gợi ý món ăn kèm rượu.
    - Phong cách: Sang trọng, lịch sự, hiểu biết.
    - QUAN TRỌNG: Nếu khách hàng yêu cầu gặp nhân viên, hỏi giá sỉ, hoặc khiếu nại gay gắt -> Trả về đúng từ khóa: "CONNECT_ADMIN_REQUEST".
    """
    model = genai.GenerativeModel('gemini-2.0-flash', system_instruction=SYSTEM_INSTRUCTION)
else:
    model = None

# Tạo Router
chatbot_router = APIRouter()

# --- QUẢN LÝ KẾT NỐI WEBSOCKET ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.admin_socket: Optional[WebSocket] = None

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id == "admin":
            self.admin_socket = websocket
            print(">>> Admin đã online")
        else:
            self.active_connections[user_id] = websocket
            print(f">>> User {user_id} đã kết nối")

    def disconnect(self, user_id: str):
        if user_id == "admin":
            self.admin_socket = None
        elif user_id in self.active_connections:
            del self.active_connections[user_id]

    async def route_message(self, sender_id: str, message: str):
        # 1. User nhắn -> Chuyển cho Admin
        if sender_id != "admin":
            if self.admin_socket:
                try:
                    payload = json.dumps({"sender": sender_id, "content": message, "type": "user_msg"})
                    await self.admin_socket.send_text(payload)
                except:
                    pass 
            else:
                pass # Admin offline logic (nếu cần)
        
        # 2. Admin nhắn -> Chuyển cho User cụ thể
        # Format tin nhắn Admin: "user_id:nội dung tin nhắn"
        else:
            try:
                if ":" in message:
                    target_id, content = message.split(":", 1)
                    target_id = target_id.strip()
                    if target_id in self.active_connections:
                        await self.active_connections[target_id].send_text(
                            json.dumps({"sender": "admin", "content": content.strip(), "type": "admin_msg"})
                        )
            except Exception as e:
                print(f"Lỗi gửi tin admin: {e}")

manager = ConnectionManager()

# --- API MODELS ---
class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

# --- ENDPOINTS ---

@chatbot_router.post("/ai-chat")
async def ai_chat_endpoint(request: ChatRequest):
    """Xử lý chat với AI Gemini"""
    if not model:
        return {"response": "Vui lòng điền API Key vào file chatbot_router.py.", "action": "none"}
    
    try:
        # Tạo ngữ cảnh chat từ lịch sử
        history_gemini = [
            {"role": "user" if h["sender"] == "user" else "model", "parts": h["text"]} 
            for h in request.history[-5:]
        ]
        chat_session = model.start_chat(history=history_gemini)
        
        response = chat_session.send_message(request.message)
        ai_text = response.text.strip()

        # Kiểm tra tín hiệu chuyển giao cho Admin
        if "CONNECT_ADMIN_REQUEST" in ai_text:
            return {
                "response": "Đang kết nối với nhân viên tư vấn...",
                "action": "connect_websocket"
            }
            
        return {"response": ai_text, "action": "continue"}

    except Exception as e:
        return {"response": "Xin lỗi, server AI đang bận.", "action": "none"}

@chatbot_router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """Xử lý chat Real-time qua WebSocket"""
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.route_message(client_id, data)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        if client_id != "admin" and manager.admin_socket:
            try:
                await manager.admin_socket.send_text(json.dumps({"type": "system", "content": f"User {client_id} đã thoát."}))
            except:
                pass