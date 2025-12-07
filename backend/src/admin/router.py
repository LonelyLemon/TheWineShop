from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from src.core.database import SessionDep
from src.user.models import User
from src.user.schemas import UserResponse
from src.auth.dependencies import allow_staff, allow_admin
from src.order.models import Order, OrderItem
from src.product.models import Wine
from src.order.schemas import OrderResponse


admin_router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


class UserRoleUpdate(BaseModel):
    role: str # admin, stock_manager, customer

class UserBanRequest(BaseModel):
    is_active: bool # True: Unban, False: Ban

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


# --------------------------
# QUẢN LÝ NGƯỜI DÙNG
# --------------------------

# 1. Lấy danh sách tất cả người dùng
@admin_router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: SessionDep,
    current_user: User = Depends(allow_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

# 2. Cập nhật Role
@admin_router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    db: SessionDep,
    current_user: User = Depends(allow_admin)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Không thể tự thay đổi quyền của bản thân")

    if payload.role not in ["admin", "stock_manager", "customer"]:
        raise HTTPException(status_code=400, detail="Quyền không hợp lệ")

    user.role = payload.role
    await db.commit()
    return {"message": f"Đã cập nhật quyền thành {payload.role}"}

# 3. Ban / Unban
@admin_router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: UUID,
    payload: UserBanRequest,
    db: SessionDep,
    current_user: User = Depends(allow_admin)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Không thể tự khóa tài khoản bản thân")

    user.status = "active" if payload.is_active else "banned"
    
    await db.commit()
    action = "Mở khóa" if payload.is_active else "Khóa"
    return {"message": f"Đã {action} tài khoản {user.email}"}