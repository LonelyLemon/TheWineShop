from datetime import datetime
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy import func
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from src.core.database import SessionDep
from src.auth.dependencies import get_current_user
from src.auth.security import decode_token
from src.user.models import User
from src.order.models import Cart, CartItem, Order, OrderItem
from src.product.models import Wine, Inventory
from src.order.schemas import CartResponse, CartItemCreate, OrderCreate, OrderResponse
from src.product.schemas import CategoryBase, WineListResponse

cart_router = APIRouter(
    prefix="/cart",
    tags=["Cart & Order"]
)

async def get_user_or_session(
    request: Request,
    db: SessionDep,
    x_session_id: Optional[str] = Header(None)
):
    """
    Trả về (user, session_id).
    - Nếu có Token hợp lệ -> user object, session_id=None
    - Nếu không -> user=None, session_id=x_session_id
    """
    auth_header = request.headers.get("Authorization")
    user = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = decode_token(token)
            email = payload.get("sub")
            if email:
                res = await db.execute(select(User).where(User.email == email))
                user = res.scalar_one_or_none()
        except Exception:
            pass
            
    return user, x_session_id

async def get_or_create_cart_helper(db: SessionDep, user: User | None, session_id: str | None) -> Cart:
    if not user and not session_id:
        raise HTTPException(status_code=400, detail="Missing Session ID for guest")

    query = select(Cart).options(
        selectinload(Cart.items).selectinload(CartItem.wine).selectinload(Wine.images),
        selectinload(Cart.items).selectinload(CartItem.wine).selectinload(Wine.category)
    )

    if user:
        query = query.where(Cart.user_id == user.id)
    else:
        query = query.where(Cart.session_id == session_id)
    
    result = await db.execute(query)
    cart = result.scalar_one_or_none()

    if not cart:
        cart = Cart(
            user_id=user.id if user else None,
            session_id=session_id if not user else None
        )
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        
        result = await db.execute(query)
        cart = result.scalar_one()
        
    return cart

def calculate_shipping_fee(mode: str, total_items_price: Decimal) -> Decimal:
    if mode == "express":
        return Decimal(50000) # Giao nhanh: 50k
    elif mode == "sea":
        return Decimal(20000) # Đường biển: 20k
    else:
        return Decimal(30000) # Mặc định: 30k
    

@cart_router.get("", response_model=CartResponse)
async def get_my_cart(
    request: Request,
    db: SessionDep,
    x_session_id: Optional[str] = Header(None)
):
    user, session_id = await get_user_or_session(request, db, x_session_id)
    
    if not user and not session_id:
        return {"id": None, "items": [], "total_price": 0}

    cart = await get_or_create_cart_helper(db, user, session_id)
    
    total_price = Decimal(0)
    response_items = []
    
    for item in cart.items:
        subtotal = item.quantity * item.price_at_add
        total_price += subtotal
        
        wine_resp = item.wine
        thumb = None
        if wine_resp.images:
            thumb_obj = next((img for img in wine_resp.images if img.is_thumbnail), None)
            if not thumb_obj: thumb_obj = wine_resp.images[0]
            thumb = thumb_obj.image_url
        
        category_data = None
        if wine_resp.category:
            category_data = CategoryBase.model_validate(wine_resp.category).model_dump()

        wine_dict = {
            "id": wine_resp.id,
            "name": wine_resp.name,
            "slug": wine_resp.slug,
            "price": item.price_at_add,
            "thumbnail": thumb,
            "category": category_data
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
    request: Request,
    payload: CartItemCreate,
    db: SessionDep,
    x_session_id: Optional[str] = Header(None)
):
    user, session_id = await get_user_or_session(request, db, x_session_id)
    cart = await get_or_create_cart_helper(db, user, session_id)

    wine = await db.get(Wine, payload.wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    
    current_price = wine.price 

    existing_item = next((item for item in cart.items if item.wine_id == payload.wine_id), None)

    if existing_item:
        existing_item.quantity += payload.quantity
        existing_item.price_at_add = current_price 
    else:
        new_item = CartItem(
            cart_id=cart.id,
            wine_id=payload.wine_id,
            quantity=payload.quantity,
            price_at_add=current_price
        )
        db.add(new_item)

    await db.commit()
    return {"message": "Đã thêm vào giỏ hàng"}


@cart_router.delete("/items/{wine_id}")
async def remove_item_from_cart(
    wine_id: UUID,
    request: Request,
    db: SessionDep,
    x_session_id: Optional[str] = Header(None)
):
    user, session_id = await get_user_or_session(request, db, x_session_id)
    cart = await get_or_create_cart_helper(db, user, session_id)
    
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
    cart = await get_or_create_cart_helper(db, current_user, None)
    
    if not cart.items:
        raise HTTPException(status_code=400, detail="Giỏ hàng trống")
    
    try:
        # 1. Tính tổng tiền hàng
        items_total = sum(item.quantity * item.price_at_add for item in cart.items)
        
        # 2. Tính phí ship
        shipping_fee = calculate_shipping_fee(payload.delivery_mode, items_total)
        
        # 3. Tổng tiền cuối cùng
        final_total = items_total + shipping_fee

        # 4. Tạo Order
        new_order = Order(
            user_id=current_user.id,
            status="pending",

            total_amount=final_total,
            delivery_mode=payload.delivery_mode,
            delivery_cost=shipping_fee,
            
            payment_method=payload.payment_method,
            shipping_address=payload.shipping_address,
            phone_number=payload.phone_number,
            note=payload.note,
            created_at=datetime.utcnow()
        )
        db.add(new_order)
        await db.flush()

        # 5. Xử lý kho & Order Items
        for item in cart.items:
            stmt = select(Inventory).where(
                Inventory.wine_id == item.wine_id,
                Inventory.quantity_available > 0
            ).order_by(Inventory.import_date).with_for_update()
            
            result = await db.execute(stmt)
            available_batches = result.scalars().all()
            
            current_stock = sum(batch.quantity_available for batch in available_batches)
            
            if current_stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Sản phẩm {item.wine.name} không đủ hàng (Còn: {current_stock})"
                )

            qty_needed = item.quantity
            for batch in available_batches:
                if qty_needed <= 0: break
                deduct = min(batch.quantity_available, qty_needed)
                batch.quantity_available -= deduct
                qty_needed -= deduct
                db.add(batch)

            # Tạo OrderItem
            order_item = OrderItem(
                order_id=new_order.id,
                wine_id=item.wine_id,
                quantity=item.quantity,
                price_at_purchase=item.price_at_add
            )
            db.add(order_item)

        # 6. Xóa cart
        for item in cart.items:
            await db.delete(item)

        await db.commit()
        await db.refresh(new_order)

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi tạo đơn hàng")

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


@cart_router.post("/merge")
async def merge_carts(
    db: SessionDep,
    request: Request,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="x-session-id")
):
    if not x_session_id:
        return {"message": "No session to merge"}

    guest_query = select(Cart).options(selectinload(Cart.items)).where(Cart.session_id == x_session_id)
    guest_res = await db.execute(guest_query)
    guest_cart = guest_res.scalar_one_or_none()

    if not guest_cart or not guest_cart.items:
        return {"message": "Guest cart empty"}

    user_query = select(Cart).options(selectinload(Cart.items)).where(Cart.user_id == current_user.id)
    user_res = await db.execute(user_query)
    user_cart = user_res.scalar_one_or_none()

    if not user_cart:
        guest_cart.user_id = current_user.id
        guest_cart.session_id = None
        await db.commit()
        return {"message": "Cart merged successfully (Ownership transfer)"}

    for guest_item in guest_cart.items:
        existing_user_item = next(
            (item for item in user_cart.items if item.wine_id == guest_item.wine_id), 
            None
        )

        if existing_user_item:
            existing_user_item.quantity += guest_item.quantity
        else:
            new_item = CartItem(
                cart_id=user_cart.id,
                wine_id=guest_item.wine_id,
                quantity=guest_item.quantity,
                price_at_add=guest_item.price_at_add
            )
            db.add(new_item)
    
    await db.delete(guest_cart)
    
    await db.commit()
    return {"message": "Cart merged successfully (Items merged)"}