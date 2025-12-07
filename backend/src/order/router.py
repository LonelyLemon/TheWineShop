from datetime import datetime, timezone
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, and_
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from decimal import Decimal

from src.core.database import SessionDep
from src.auth.dependencies import get_current_user
from src.user.models import User
from src.order.models import Cart, CartItem, Order, OrderItem
from src.product.models import Wine, Inventory
from src.order.schemas import CartResponse, CartItemCreate, OrderCreate, OrderResponse

cart_router = APIRouter(
    prefix="/cart",
    tags=["Cart & Order"]
)

async def get_or_create_cart(db: SessionDep, user_id: UUID) -> Cart:
    query = select(Cart).options(
        selectinload(Cart.items).selectinload(CartItem.wine).selectinload(Wine.images),
        selectinload(Cart.items).selectinload(CartItem.wine).selectinload(Wine.category)
    ).where(Cart.user_id == user_id)
    
    result = await db.execute(query)
    cart = result.scalar_one_or_none()

    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)

        result = await db.execute(query)
        cart = result.scalar_one()
        
    return cart

@cart_router.get("", response_model=CartResponse)
async def get_my_cart(
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    cart = await get_or_create_cart(db, current_user.id)
    
    total_price = Decimal(0)
    
    response_items = []
    for item in cart.items:
        subtotal = item.quantity * item.wine.price
        total_price += subtotal
        
        wine_resp = item.wine
        thumb = None
        if wine_resp.images:
            thumb_obj = next((img for img in wine_resp.images if img.is_thumbnail), None)
            if not thumb_obj: thumb_obj = wine_resp.images[0]
            thumb = thumb_obj.image_url
            
        wine_dict = {
            "id": wine_resp.id,
            "name": wine_resp.name,
            "slug": wine_resp.slug,
            "price": wine_resp.price,
            "country": wine_resp.country,
            "region": wine_resp.region,
            "thumbnail": thumb,
            "category": wine_resp.category
        }

        response_items.append({
            "id": item.id,
            "wine": wine_dict,
            "quantity": item.quantity,
            "subtotal": subtotal
        })

    return {
        "id": cart.id,
        "items": response_items,
        "total_price": total_price
    }

@cart_router.post("/items")
async def add_item_to_cart(
    payload: CartItemCreate,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    cart = await get_or_create_cart(db, current_user.id)

    wine = await db.get(Wine, payload.wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    
    existing_item = next((item for item in cart.items if item.wine_id == payload.wine_id), None)

    if existing_item:
        existing_item.quantity += payload.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            wine_id=payload.wine_id,
            quantity=payload.quantity
        )
        db.add(new_item)

    await db.commit()
    return {"message": "Đã thêm vào giỏ hàng"}


@cart_router.delete("/items/{wine_id}")
async def remove_item_from_cart(
    wine_id: UUID,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    cart = await get_or_create_cart(db, current_user.id)
    
    query = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.wine_id == wine_id
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Sản phẩm không có trong giỏ hàng")

    await db.delete(item)
    await db.commit()
    
    return {"message": "Đã xóa sản phẩm khỏi giỏ hàng"}


@cart_router.post("/orders", response_model=OrderResponse)
async def create_order(
    payload: OrderCreate,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    # 1. Lấy giỏ hàng
    cart = await get_or_create_cart(db, current_user.id)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Giỏ hàng trống")

    try:
        total_amount = Decimal(0)
        
        # 2. Tạo Order Header
        new_order = Order(
            user_id=current_user.id,
            status="pending",
            total_amount=0, 
            payment_method=payload.payment_method,
            shipping_address=payload.shipping_address,
            phone_number=payload.phone_number,
            note=payload.note,
            created_at=datetime.utcnow()
        )
        db.add(new_order)
        await db.flush()

        # 3. Duyệt từng sản phẩm trong giỏ để xử lý Kho & Tạo OrderItem
        for item in cart.items:
            stmt = select(Inventory).where(
                Inventory.wine_id == item.wine_id,
                Inventory.quantity_available > 0
            ).order_by(Inventory.import_date).with_for_update()
            
            result = await db.execute(stmt)
            available_batches = result.scalars().all()
            
            # Tính tổng tồn kho hiện có
            current_stock = sum(batch.quantity_available for batch in available_batches)
            
            if current_stock < item.quantity:
                # Nếu không đủ hàng -> Rollback
                raise HTTPException(
                    status_code=400, 
                    detail=f"Sản phẩm {item.wine.name} không đủ hàng (Còn: {current_stock})"
                )

            # Thực hiện trừ kho (FIFO)
            qty_needed = item.quantity
            for batch in available_batches:
                if qty_needed <= 0: break
                
                deduct = min(batch.quantity_available, qty_needed)
                batch.quantity_available -= deduct
                qty_needed -= deduct
                db.add(batch)

            # Tạo Order Item
            order_item = OrderItem(
                order_id=new_order.id,
                wine_id=item.wine_id,
                quantity=item.quantity,
                price_at_purchase=item.wine.price
            )
            db.add(order_item)
            
            # Cộng dồn tổng tiền
            total_amount += item.quantity * item.wine.price

        # Cập nhật lại tổng tiền cho Order
        new_order.total_amount = total_amount
        db.add(new_order)

        # 4. Xóa giỏ hàng
        for item in cart.items:
            await db.delete(item)

        # 5. Commit transaction
        await db.commit()
        await db.refresh(new_order)

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi tạo đơn hàng")

    # 6. Return Data
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.images),
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.category)
    ).where(Order.id == new_order.id)
    result = await db.execute(query)
    return result.scalar_one()


@cart_router.get("/orders", response_model=List[OrderResponse])
async def get_my_orders(
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.images),
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.category)
    ).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()
