from datetime import datetime, timezone
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
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
    cart = await get_or_create_cart(db, current_user.id)
    
    if not cart.items:
        raise HTTPException(status_code=400, detail="Giỏ hàng trống, không thể đặt hàng")

    total_amount = Decimal(0)
    
    for item in cart.items:
        inventory_records = await db.execute(select(Inventory).where(Inventory.wine_id == item.wine_id))
        inventories = inventory_records.scalars().all()
        total_stock = sum(inv.quantity_available for inv in inventories)
        
        if total_stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Sản phẩm {item.wine.name} không đủ hàng (Còn: {total_stock})"
            )
            
        total_amount += item.quantity * item.wine.price

    new_order = Order(
        user_id=current_user.id,
        status="pending",
        total_amount=total_amount,
        payment_method=payload.payment_method,
        shipping_address=payload.shipping_address,
        phone_number=payload.phone_number,
        note=payload.note,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_order)
    await db.flush()

    for item in cart.items:
        order_item = OrderItem(
            order_id=new_order.id,
            wine_id=item.wine_id,
            quantity=item.quantity,
            price_at_purchase=item.wine.price
        )
        db.add(order_item)

        inv_query = select(Inventory).where(
            Inventory.wine_id == item.wine_id, 
            Inventory.quantity_available > 0
        ).order_by(Inventory.import_date)
        
        inv_result = await db.execute(inv_query)
        available_batches = inv_result.scalars().all()
        
        qty_needed = item.quantity
        
        for batch in available_batches:
            if qty_needed <= 0:
                break
            
            if batch.quantity_available >= qty_needed:
                batch.quantity_available -= qty_needed
                qty_needed = 0
            else:
                qty_needed -= batch.quantity_available
                batch.quantity_available = 0
            
            db.add(batch)

    for item in cart.items:
        await db.delete(item)

    await db.commit()
    await db.refresh(new_order)
    
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.wine).selectinload(Wine.images)
    ).where(Order.id == new_order.id)
    result = await db.execute(query)
    final_order = result.scalar_one()

    return final_order


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
