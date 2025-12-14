from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from src.core.database import SessionDep
from src.user.models import User
from src.user.schemas import UserResponse
from src.auth.dependencies import allow_staff, allow_admin
from src.order.models import Order, OrderItem
from src.product.models import Inventory, Wine, Winery
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
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.category),
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.reviews),
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.winery).selectinload(Winery.region)
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


# --------------------------
# THỐNG KÊ SỐ LIỆU
# --------------------------

@admin_router.get("/stats")
async def get_dashboard_stats(
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    # 1. Tổng doanh thu (Chỉ tính đơn đã hoàn thành hoặc đang giao)
    revenue_query = select(func.sum(Order.total_amount)).where(Order.status == 'completed')
    revenue_res = await db.execute(revenue_query)
    total_revenue = revenue_res.scalar() or 0

    # 2. Tổng số đơn hàng
    orders_count_query = select(func.count(Order.id))
    orders_res = await db.execute(orders_count_query)
    total_orders = orders_res.scalar() or 0
    
    # 3. Đơn hàng mới (Pending)
    pending_query = select(func.count(Order.id)).where(Order.status == 'pending')
    pending_res = await db.execute(pending_query)
    pending_orders = pending_res.scalar() or 0

    # 4. Tổng khách hàng
    users_query = select(func.count(User.id)).where(User.role == 'customer')
    users_res = await db.execute(users_query)
    total_customers = users_res.scalar() or 0

    # 5. Cảnh báo kho thấp
    low_stock_query = (
        select(Wine.id, Wine.name, func.sum(Inventory.quantity_available).label("total_stock"))
        .join(Inventory, Wine.id == Inventory.wine_id)
        .group_by(Wine.id, Wine.name)
        .having(func.sum(Inventory.quantity_available) < 10)
    )
    low_stock_res = await db.execute(low_stock_query)
    low_stock_items = low_stock_res.all()

    return {
        "revenue": total_revenue,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_customers": total_customers,
        "low_stock_count": len(low_stock_items),
        "low_stock_details": [{"name": item.name, "stock": item.total_stock} for item in low_stock_items]
    }