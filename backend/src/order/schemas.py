import re

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import datetime

from src.product.schemas import WineListResponse


class CartItemCreate(BaseModel):
    wine_id: UUID
    quantity: int

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: UUID
    wine: WineListResponse
    quantity: int
    subtotal: Decimal

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    id: Optional[UUID] = None
    items: List[dict] = []
    total_price: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    shipping_address: str
    phone_number: str
    note: Optional[str] = None

    payment_method: str = "cod"
    delivery_mode: str = "regular"
    

class OrderItemResponse(BaseModel):
    id: UUID
    wine: WineListResponse
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: UUID
    status: str
    total_amount: float

    delivery_mode: str
    delivery_cost: float

    payment_method: str
    shipping_address: str
    phone_number: str
    note: Optional[str] = None
    created_at: datetime
    
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True