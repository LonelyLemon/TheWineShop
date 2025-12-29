import contextvars
import json
from typing import Optional, List, Dict
from openai import AsyncOpenAI
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from sqlalchemy.orm import selectinload
from loguru import logger


from src.core.config import settings
from src.product.models import Inventory, Wine, Category
from src.order.models import Cart, CartItem
from src.core.database import SessionDep
from src.user.schemas import UserResponse
from src.ai.registry import agent_registry

client = None
if settings.DEEPSEEK_API_KEY:
    client = AsyncOpenAI(
        api_key=settings.DEEPSEEK_API_KEY, 
        base_url="https://api.deepseek.com"
    )

# ----------------------
# 0. CONTEXT MANAGERS
# ----------------------
_db_ctx_var = contextvars.ContextVar("db_session", default=None)
_user_ctx_var = contextvars.ContextVar("user_context", default=None)

def _get_db_session_context() -> SessionDep:
    return _db_ctx_var.get()

def _get_user_context() -> Optional[UserResponse]:
    return _user_ctx_var.get()

# ----------------------
# 1. AI TOOLS 
# ----------------------

@agent_registry.register
async def search_wines(keyword: str, max_price: float = 0, min_price: float = 0, wine_type: str = ""):
    db = _get_db_session_context()
    logger.info(f"[TOOL] search_wines: kw='{keyword}'")
    
    stmt = select(Wine).where(Wine.is_active == True).options(selectinload(Wine.category))
    conditions = []
    
    if keyword:
        conditions.append(or_(
            Wine.name.ilike(f"%{keyword}%"), 
            Wine.description.ilike(f"%{keyword}%"), 
            Wine.category.has(Category.name.ilike(f"%{keyword}%"))
        ))
    
    if max_price > 0: conditions.append(Wine.price <= max_price)
    if min_price > 0: conditions.append(Wine.price >= min_price)
    if wine_type: conditions.append(Wine.category.has(Category.name.ilike(f"%{wine_type}%")))
    
    if conditions: stmt = stmt.where(and_(*conditions))
    
    stmt = stmt.limit(5)
    result = await db.execute(stmt)
    wines = result.scalars().all()
    
    if not wines: return "Không tìm thấy sản phẩm nào phù hợp."
    
    results = [{
        "id": str(w.id), 
        "name": w.name, 
        "price": float(w.price) if w.price else 0.0,
        "type": w.category.name if w.category else "Unknown"
    } for w in wines]
    
    return json.dumps({
        "data": results,
        "instruction": "Hãy giới thiệu các sản phẩm này cho khách. QUAN TRỌNG: Phải ghi kèm ID trong ngoặc [ID: ...] sau tên mỗi sản phẩm trong câu trả lời của bạn."
    }, ensure_ascii=False)

@agent_registry.register
async def get_wine_detail(wine_id: str):
    db = _get_db_session_context()
    try:
        stmt = select(Wine).where(Wine.id == wine_id).options(selectinload(Wine.category))
        result = await db.execute(stmt)
        wine = result.scalar_one_or_none()
        
        if not wine: return "Sản phẩm không tồn tại."
        
        detail = {
            "id": str(wine.id),
            "name": wine.name,
            "price": float(wine.price),
            "description": wine.description,
            "alcohol": float(wine.alcohol_percentage) if wine.alcohol_percentage else None,
            "category": wine.category.name if wine.category else None
        }
        return json.dumps(detail, ensure_ascii=False)
    except Exception as e:
        return f"Lỗi khi lấy chi tiết: {str(e)}"

@agent_registry.register
async def add_to_cart(product_id: str, quantity: int = 1):
    db = _get_db_session_context()
    user = _get_user_context()
    logger.info(f"[TOOL] add_to_cart: id={product_id}, qty={quantity}")
    
    if not user: 
        return "LỖI: Khách hàng chưa đăng nhập. Yêu cầu đăng nhập."
    
    try:
        product = await db.get(Wine, product_id)
        if not product: 
            return "Lỗi: Không tìm thấy sản phẩm ID này."

        stmt_inv = select(Inventory).where(Inventory.wine_id == product_id)
        inventory = (await db.execute(stmt_inv)).scalar_one_or_none()
        
        current_stock = inventory.quantity_available if inventory else 0
        
        if current_stock == 0:
            return f"Rất tiếc, sản phẩm '{product.name}' hiện đã hết hàng."
        
        if current_stock < quantity:
            return f"Kho chỉ còn {current_stock} chai '{product.name}', không đủ số lượng {quantity} bạn yêu cầu."

        stmt = select(Cart).where(Cart.user_id == user.id)
        cart = (await db.execute(stmt)).scalar_one_or_none()
        if not cart:
            cart = Cart(user_id=user.id)
            db.add(cart)
            await db.commit()
            await db.refresh(cart)
            
        stmt_item = select(CartItem).where(CartItem.cart_id == cart.id, CartItem.wine_id == product_id)
        cart_item = (await db.execute(stmt_item)).scalar_one_or_none()
        
        current_qty_in_cart = cart_item.quantity if cart_item else 0
        new_total_qty = current_qty_in_cart + quantity

        if new_total_qty > current_stock:
             return f"Bạn đã có {current_qty_in_cart} chai trong giỏ. Kho chỉ còn tổng cộng {current_stock} chai."

        if cart_item: 
            cart_item.quantity += quantity
        else:
            price_now = product.price if product.price else 0
            db.add(CartItem(
                cart_id=cart.id, 
                wine_id=product_id, 
                quantity=quantity,
                price_at_add=price_now
            ))
        
        await db.commit()
        return f"THÀNH CÔNG: Đã thêm {quantity} chai '{product.name}' vào giỏ."
    except Exception as e:
        logger.error(f"Cart Error: {e}")
        return "Lỗi hệ thống khi thêm giỏ hàng."

# ------------------------
# 2. SYSTEM PROMPT
# ------------------------

sys_instruct = """
Bạn là nhân viên tư vấn rượu vang chuyên nghiệp của TheWineShop.

QUY TẮC QUAN TRỌNG (MEMORY):
Do bạn không có bộ nhớ dài hạn, nên khi giới thiệu sản phẩm cho khách, bạn BẮT BUỘC phải kèm theo ID của sản phẩm trong ngoặc vuông ở cuối tên sản phẩm.
Ví dụ: "Tôi tìm thấy rượu Chateau Dalat [ID: 123e4567-e89b...]. Giá 500k."
Điều này giúp bạn có thể lấy được ID để thêm vào giỏ hàng ở bước sau nếu khách yêu cầu "Mua chai này".

NHIỆM VỤ CỦA BẠN:
1. Tư vấn nhiệt tình, ngắn gọn.
2. Khi khách chốt mua:
   - Tìm lại ID sản phẩm trong lịch sử chat (trong ngoặc [ID: ...]).
   - Nếu không thấy ID trong lịch sử, hãy gọi lại `search_wines` để lấy ID.
   - Gọi tool `add_to_cart` với ID chính xác.

PHONG CÁCH TRẢ LỜI:
- Thân thiện, lịch sự.
- Không hiển thị JSON thô.
- Luôn hiển thị ID sản phẩm một cách tinh tế để hệ thống ghi nhớ.
"""

# ----------------
# 3. CONTROLLER
# ----------------

async def generate_consulting_response(
    user_query: str, 
    history: List[Dict[str, str]], 
    db: SessionDep, 
    user: Optional[UserResponse] = None
):
    token_db = _db_ctx_var.set(db)
    token_user = _user_ctx_var.set(user)

    if not client: return "Chưa cấu hình API Key."

    messages = [{"role": "system", "content": sys_instruct}]
    
    recent_history = history[-6:] if history else []
    for msg in recent_history:
        if msg.get("role") in ["user", "assistant"] and msg.get("content"):
             messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": user_query})

    try:
        for _ in range(5):
            try:
                response = await client.chat.completions.create(
                    model="deepseek-chat",
                    messages=messages,
                    tools=agent_registry.tools_schema,
                    tool_choice="auto",
                    temperature=0.1
                )
            except Exception as e:
                logger.error(f"API Error: {e}")
                return "Hệ thống đang bận."

            response_message = response.choices[0].message
            
            if not response_message.tool_calls:
                return response_message.content

            messages.append(response_message)
            
            for tool_call in response_message.tool_calls:
                fn_name = tool_call.function.name
                try:
                    fn_args = json.loads(tool_call.function.arguments)
                except:
                    fn_args = {}
                
                logger.info(f"AI Executing: {fn_name} | Args: {fn_args}")
                
                tool_result = await agent_registry.execute(fn_name, fn_args)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(tool_result)
                })
        return "Đã thực hiện xong thao tác."
    finally:
        _db_ctx_var.reset(token_db)
        _user_ctx_var.reset(token_user)