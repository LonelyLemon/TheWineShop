from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

# --- Base Schemas ---
class CategoryBase(BaseModel):
    id: UUID
    name: str
    slug: str | None = None

    class Config:
        from_attributes = True

class RegionBase(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    map_image_url: str | None = None
    
    class Config:
        from_attributes = True

class WineryBase(BaseModel):
    id: UUID
    name: str
    phone_number: str | None = None
    region: Optional[RegionBase] = None
    
    class Config:
        from_attributes = True

class GrapeVarietyBase(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

class WineGrapeResponse(BaseModel):
    grape_variety: GrapeVarietyBase
    percentage: int | None = None
    order: int
    
    class Config:
        from_attributes = True

class WineImageBase(BaseModel):
    id: UUID
    image_url: str
    is_thumbnail: bool
    
    class Config:
        from_attributes = True

# --- Response Schemas ---

class WineListResponse(BaseModel):
    id: UUID
    name: str
    slug: str | None = None
    price: float
    winery_name: str | None = None 
    region_name: str | None = None
    wine_type: str | None = None
    thumbnail: str | None = None
    
    category: Optional[CategoryBase] = None

    class Config:
        from_attributes = True

class WineDetailResponse(BaseModel):
    id: UUID
    name: str
    slug: str | None = None
    description: str | None = None
    
    alcohol_percentage: float | None = None
    volume: int | None = None
    vintage: int | None = None
    price: float
    
    category: Optional[CategoryBase] = None
    winery: Optional[WineryBase] = None
    grapes: List[WineGrapeResponse] = []
    
    images: List[WineImageBase] = []
    inventory_quantity: int = 0
    
    class Config:
        from_attributes = True

# --- Request Schemas (Create/Update) ---

class WineGrapeCreate(BaseModel):
    grape_variety_id: UUID
    percentage: int | None = None
    order: int = 0

class WineCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    alcohol_percentage: float | None = None
    volume: int | None = None
    vintage: int | None = None
    
    category_id: UUID | None = None
    winery_id: UUID | None = None
    
    grapes: List[WineGrapeCreate] = [] 
    images: List[str] = [] 

class WineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    alcohol_percentage: Optional[float] = None
    volume: Optional[int] = None
    vintage: Optional[int] = None
    
    category_id: Optional[UUID] = None
    winery_id: Optional[UUID] = None
    
    images: Optional[List[str]] = None
    grapes: Optional[List[WineGrapeCreate]] = None

# --- Inventory Schemas ---

class InventoryImport(BaseModel):
    quantity: int
    import_price: float
    batch_code: Optional[str] = None

# --- Promotion Schemas ---

class PromotionBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    discount_percentage: float
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    trigger_type: str = "period"
    min_quantity: int = 0

class PromotionCreate(PromotionBase):
    pass

class PromotionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_percentage: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    min_quantity: Optional[int] = None

class PromotionResponse(PromotionBase):
    id: UUID
    
    class Config:
        from_attributes = True

# --- Review Schemas ---

class ReviewCreate(BaseModel):
    rating: int # 1-5
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: UUID
    user_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True