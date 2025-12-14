from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, DECIMAL, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from src.core.base_model import Base

class Cart(Base):
    __tablename__ = "carts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    session_id = Column(String(255), nullable=True, index=True)
    
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    user = relationship("User")

class CartItem(Base):
    __tablename__ = "cart_items"

    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    
    price_at_add = Column(DECIMAL(12, 2), nullable=False, default=0)
    
    cart = relationship("Cart", back_populates="items")
    wine = relationship("Wine")

class Order(Base):
    __tablename__ = "orders"

    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    
    status = Column(String(50), default="pending")
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    
    delivery_mode = Column(String(50), default="regular")
    delivery_cost = Column(DECIMAL(12, 2), default=0)
    
    payment_method = Column(String(50), default="cod")
    shipping_address = Column(Text, nullable=False)
    phone_number = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    user = relationship("User")

    discount_amount = Column(DECIMAL(12, 2), default=0)
    promotion_id = Column(UUID(as_uuid=True), ForeignKey("promotions.id"), nullable=True)

    promotion = relationship("Promotion")

class OrderItem(Base):
    __tablename__ = "order_items"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(DECIMAL(12, 2), nullable=False)
    
    order = relationship("Order", back_populates="items")
    wine = relationship("Wine")