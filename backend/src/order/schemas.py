from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

from src.product.schemas import WineListResponse 

class CartItemCreate(BaseModel):
    wine_id: UUID
    quantity: int = 1

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
    id: UUID
    items: List[CartItemResponse] = []
    total_price: Decimal

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    shipping_address: str
    phone_number: str
    note: Optional[str] = None
    payment_method: str = "cod"

class OrderItemResponse(BaseModel):
    wine: WineListResponse
    quantity: int
    price_at_purchase: Decimal

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: UUID
    status: str
    total_amount: Decimal
    shipping_address: str
    phone_number: str
    payment_method: str
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True