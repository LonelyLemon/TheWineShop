from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from src.core.database import SessionDep
from src.user.models import User
from src.auth.dependencies import allow_staff
from src.order.models import Order, OrderItem
from src.product.models import Wine
from src.order.schemas import OrderResponse
from pydantic import BaseModel

admin_router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


class OrderStatusUpdate(BaseModel):
    status: str


@admin_router.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.images),
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.category)
    ).order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@admin_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: UUID,
    payload: OrderStatusUpdate,
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    
    valid_statuses = ["pending", "confirmed", "shipping", "completed", "cancelled"]
    if payload.status not in valid_statuses:
         raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")

    order.status = payload.status
    await db.commit()
    await db.refresh(order)
    
    return {"message": "Cập nhật trạng thái thành công", "status": order.status}