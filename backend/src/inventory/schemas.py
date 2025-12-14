from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel


class InventoryResponse(BaseModel):
    id: UUID
    wine_id: UUID
    wine_name: str
    
    batch_code: str
    quantity_available: int
    import_price: float
    
    import_date: datetime
    expiry_date: Optional[datetime] = None
    shelf_location: Optional[str] = None

    class Config:
        from_attributes = True


class InventoryImportRequest(BaseModel):
    wine_id: UUID
    quantity: int
    import_price: float
    
    batch_code: str
    expiry_date: Optional[datetime] = None
    shelf_location: Optional[str] = None


class InventoryAdjustment(BaseModel):
    quantity_adjustment: int
    reason: Optional[str] = None