from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal

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