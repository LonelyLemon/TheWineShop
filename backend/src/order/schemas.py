import re

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import datetime

from src.product.schemas import WineListResponse 


PHONE_REGEX = r"(84|0[3|5|7|8|9])+([0-9]{8})\b"


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

    @field_validator('phone_number')
    def validate_phone(cls, v):
        if not re.match(PHONE_REGEX, v):
            raise ValueError('Số điện thoại không hợp lệ')
        return v
    

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