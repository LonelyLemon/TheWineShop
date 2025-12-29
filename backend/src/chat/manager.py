from typing import Dict, List
from fastapi import WebSocket
from uuid import UUID

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.online_admins: List[str] = []

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if role in ["admin", "staff", "stock_manager"]:
            if user_id not in self.online_admins:
                self.online_admins.append(user_id)
        print(f"🔌 Connected: {user_id} (Role: {role}) | Admins Online: {len(self.online_admins)}")

    def disconnect(self, user_id: str, role: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if role in ["admin", "staff", "stock_manager"] and user_id in self.online_admins:
            self.online_admins.remove(user_id)
        print(f"🔌 Disconnected: {user_id}")

    async def send_personal_message(self, message: dict, receiver_id: str):
        if receiver_id in self.active_connections:
            websocket = self.active_connections[receiver_id]
            await websocket.send_json(message)
            return True
        return False

    async def broadcast_to_admins(self, message: dict):
        for admin_id in self.online_admins:
            if admin_id in self.active_connections:
                await self.active_connections[admin_id].send_json(message)

chat_manager = ConnectionManager()