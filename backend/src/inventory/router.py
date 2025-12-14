from typing import List, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from src.core.database import SessionDep
from src.auth.dependencies import allow_staff
from src.user.models import User
from src.product.models import Inventory, Wine
from src.inventory.schemas import InventoryResponse, InventoryImportRequest, InventoryAdjustment

inventory_router = APIRouter(
    prefix="/inventory",
    tags=["Inventory Management"]
)

# 1. Lấy danh sách tồn kho
@inventory_router.get("", response_model=List[InventoryResponse])
async def get_inventory_list(
    db: SessionDep,
    user: User = Depends(allow_staff),
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    wine_id: Optional[UUID] = None
):
    query = select(Inventory).options(selectinload(Inventory.wine)).order_by(desc(Inventory.import_date))
    
    if wine_id:
        query = query.where(Inventory.wine_id == wine_id)
        
    if search:
        query = query.join(Wine).where(
            (Wine.name.ilike(f"%{search}%")) | 
            (Inventory.batch_code.ilike(f"%{search}%"))
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    inventories = result.scalars().all()
    
    response = []
    for inv in inventories:
        response.append(InventoryResponse(
            id=inv.id,
            wine_id=inv.wine_id,
            wine_name=inv.wine.name,
            batch_code=inv.batch_code,
            quantity_available=inv.quantity_available,
            import_price=inv.import_price or 0,
            import_date=inv.import_date,
            expiry_date=inv.expiry_date,
            shelf_location=inv.shelf_location
        ))
    
    return response

# 2. Nhập kho
@inventory_router.post("/import")
async def import_inventory(
    payload: InventoryImportRequest,
    db: SessionDep,
    user: User = Depends(allow_staff)
):
    wine = await db.get(Wine, payload.wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    
    existing = await db.execute(select(Inventory).where(
        Inventory.batch_code == payload.batch_code, 
        Inventory.wine_id == payload.wine_id
    ))
    if existing.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Mã lô hàng (Batch Code) đã tồn tại cho sản phẩm này")

    new_inv = Inventory(
        wine_id=payload.wine_id,
        quantity_available=payload.quantity,
        import_price=payload.import_price,
        batch_code=payload.batch_code,
        import_date=datetime.utcnow(),
        expiry_date=payload.expiry_date,
        shelf_location=payload.shelf_location
    )
    
    db.add(new_inv)
    await db.commit()
    
    return {"message": "Nhập kho thành công"}

# 3. Điều chỉnh tồn kho
@inventory_router.patch("/{inventory_id}/adjust")
async def adjust_inventory(
    inventory_id: UUID,
    payload: InventoryAdjustment,
    db: SessionDep,
    user: User = Depends(allow_staff)
):
    inv = await db.get(Inventory, inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Không tìm thấy lô hàng")
        
    new_qty = inv.quantity_available + payload.quantity_adjustment
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Số lượng tồn kho không đủ để giảm")
        
    inv.quantity_available = new_qty
    await db.commit()
    
    return {"message": "Đã điều chỉnh tồn kho", "new_quantity": new_qty}