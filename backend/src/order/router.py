from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from decimal import Decimal

from src.core.database import SessionDep
from src.auth.dependencies import get_current_user
from src.user.models import User
from src.order.models import Cart, CartItem
from src.product.models import Wine
from src.order.schemas import CartResponse, CartItemCreate, CartItemUpdate

cart_router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
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