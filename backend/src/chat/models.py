import uuid

from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from src.core.base_model import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    sender_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    message_type = Column(String(50), default="admin_chat") 

    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])