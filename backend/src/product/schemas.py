from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal


class WineCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: Decimal
    alcohol_percentage: Optional[Decimal] = None
    volume: Optional[int] = None
    country: Optional[str] = None
    region: Optional[str] = None
    vintage: Optional[int] = None
    category_id: UUID
    
    images: List[str] = []


class WineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    alcohol_percentage: Optional[Decimal] = None
    volume: Optional[int] = None
    country: Optional[str] = None
    region: Optional[str] = None
    vintage: Optional[int] = None
    category_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    
    images: Optional[List[str]] = None


class CategoryBase(BaseModel):
    id: UUID
    name: str
    slug: str

    class Config:
        from_attributes = True


class WineImageBase(BaseModel):
    id: UUID
    image_url: str
    alt_text: Optional[str] = None
    is_thumbnail: bool

    class Config:
        from_attributes = True


class InventoryBase(BaseModel):
    quantity_available: int
    batch_code: Optional[str] = None

    class Config:
        from_attributes = True


class WineListResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    price: Decimal
    country: Optional[str] = None
    region: Optional[str] = None
    wine_type: Optional[str] = None
    thumbnail: Optional[str] = None
    
    category: Optional[CategoryBase] = None

    class Config:
        from_attributes = True


class WineDetailResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    
    alcohol_percentage: Optional[Decimal] = None
    volume: Optional[int] = None
    country: Optional[str] = None
    region: Optional[str] = None
    vintage: Optional[int] = None
    
    price: Decimal
    category: Optional[CategoryBase] = None
    
    # Quan hệ
    images: List[WineImageBase] = []
    inventory_quantity: int = 0

    class Config:
        from_attributes = True