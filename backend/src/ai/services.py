import json
from typing import Optional, List, Dict
from openai import AsyncOpenAI
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from sqlalchemy.orm import selectinload
from loguru import logger

from src.core.config import settings
from src.product.models import Wine, Category
from src.order.models import Cart, CartItem
from src.core.database import SessionDep
from src.user.schemas import UserResponse

client = None
if settings.DEEPSEEK_API_KEY:
    client = AsyncOpenAI(
        api_key=settings.DEEPSEEK_API_KEY, 
        base_url="https://api.deepseek.com"
    )

# ----------------------
# 1. IMPLEMENTATION
# ----------------------

async def search_wines_impl(keyword: str = "", max_price: float = 0, min_price: float = 0, wine_type: str = ""):
    db = _get_db_session_context()
    logger.info(f"⚡ [TOOL] search_wines: kw='{keyword}'")
    stmt = select(Wine).where(Wine.is_active == True).options(selectinload(Wine.category))
    conditions = []
    if keyword:
        conditions.append(or_(Wine.name.ilike(f"%{keyword}%"), Wine.description.ilike(f"%{keyword}%"), Wine.category.has(Category.name.ilike(f"%{keyword}%"))))
    if max_price > 0: conditions.append(Wine.price <= max_price)
    if min_price > 0: conditions.append(Wine.price >= min_price)
    if wine_type: conditions.append(Wine.category.has(Category.name.ilike(f"%{wine_type}%")))
    if conditions: stmt = stmt.where(and_(*conditions))
    stmt = stmt.limit(5)
    result = await db.execute(stmt)
    wines = result.scalars().all()
    if not wines: return "Không tìm thấy sản phẩm nào phù hợp."
    
    results = [{"id": str(w.id), "name": w.name, "price": float(w.price) if w.price else 0.0} for w in wines]
    return json.dumps(results, ensure_ascii=False)

async def get_wine_detail_impl(wine_id: str):
    db = _get_db_session_context()
    try:
        stmt = select(Wine).where(Wine.id == wine_id).options(selectinload(Wine.category))
        result = await db.execute(stmt)
        wine = result.scalar_one_or_none()
        if not wine: return "Sản phẩm không tồn tại."
        return json.dumps({"id": str(wine.id), "name": wine.name, "price": float(wine.price), "description": wine.description}, ensure_ascii=False)
    except: return "Lỗi ID."

async def add_to_cart_impl(product_id: str, quantity: int = 1):
    db = _get_db_session_context()
    user = _get_user_context()
    logger.info(f"[TOOL] add_to_cart: id={product_id}, qty={quantity}")
    
    if not user: return "LỖI: Khách hàng chưa đăng nhập. Hãy yêu cầu họ đăng nhập để mua hàng."
    try:
        product = await db.get(Wine, product_id)
        if not product: return "Lỗi: Không tìm thấy sản phẩm với ID này."
        
        stmt = select(Cart).where(Cart.user_id == user.id)
        cart = (await db.execute(stmt)).scalar_one_or_none()
        if not cart:
            cart = Cart(user_id=user.id)
            db.add(cart)
            await db.commit()
            await db.refresh(cart)
            
        stmt_item = select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
        cart_item = (await db.execute(stmt_item)).scalar_one_or_none()
        if cart_item: cart_item.quantity += quantity
        else: db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
        
        await db.commit()
        return f"THÀNH CÔNG: Đã thêm {quantity} chai {product.name} vào giỏ hàng."
    except Exception as e:
        logger.error(f"Cart Error: {e}")
        return "Lỗi hệ thống khi thêm giỏ hàng."

# ------------------------
# 2. DEFINITION & PROMPT
# ------------------------

tools_schema = [
    {
        "type": "function",
        "function": {
            "name": "search_wines",
            "description": "BƯỚC 1: Tìm kiếm sản phẩm để lấy ID. Luôn dùng tool này trước khi mua hàng nếu chưa biết ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "Tên rượu hoặc đặc điểm."},
                    "max_price": {"type": "number"},
                },
                "required": ["keyword"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_wine_detail",
            "description": "Xem chi tiết một sản phẩm khi đã có ID.",
            "parameters": {
                "type": "object",
                "properties": { "wine_id": {"type": "string"} },
                "required": ["wine_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "BƯỚC 2: Thêm sản phẩm vào giỏ hàng. Bắt buộc phải có 'product_id' chính xác lấy từ kết quả search.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "string", "description": "UUID của sản phẩm (Lấy từ kết quả search_wines)."},
                    "quantity": {"type": "integer", "description": "Số lượng (mặc định 1)."}
                },
                "required": ["product_id"]
            }
        }
    }
]

sys_instruct = """
Bạn là trợ lý AI thông minh của TheWineShop.

QUY TRÌNH MUA HÀNG (BẮT BUỘC TUÂN THỦ):
Nếu khách hàng muốn mua sản phẩm (ví dụ: "Mua chai này", "Thêm vào giỏ"):
1.  **Bước 1**: Nếu bạn CHƯA biết ID sản phẩm, hãy gọi `search_wines` để tìm theo tên/giá khách yêu cầu.
2.  **Bước 2**: Đọc kết quả tìm kiếm. Nếu tìm thấy sản phẩm phù hợp, LẤY NGAY `id` của sản phẩm đó.
3.  **Bước 3**: Gọi ngay tool `add_to_cart` với `product_id` vừa tìm được.
4.  **Bước 4**: Thông báo kết quả cho khách.

QUY TẮC KỸ THUẬT (CHỐNG LỖI):
- Tuyệt đối KHÔNG trả về định dạng XML/DSML (ví dụ: <|DSML|...>).
- Nếu cần gọi tool, chỉ sử dụng JSON Tool Call chuẩn.
- Đừng hỏi lại khách "Tôi có nên thêm vào giỏ không?" nếu họ đã ra lệnh "Thêm vào giỏ". Hãy làm luôn.
"""

# ----------------
# 3. CONTROLLER
# ----------------

_current_db_session: SessionDep = None
_current_user_context: Optional[UserResponse] = None

def _get_db_session_context(): return _current_db_session
def _get_user_context(): return _current_user_context

async def generate_consulting_response(
    user_query: str, 
    history: List[Dict[str, str]], 
    db: SessionDep, 
    user: Optional[UserResponse] = None
):
    global _current_db_session, _current_user_context
    _current_db_session = db
    _current_user_context = user

    if not client: return "Chưa cấu hình API Key."

    messages = [{"role": "system", "content": sys_instruct}]
    
    recent_history = history[-6:] if history else []
    for msg in recent_history:
        if msg.get("role") in ["user", "assistant"] and msg.get("content"):
             messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": user_query})

    for _ in range(5):
        try:
            response = await client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                tools=tools_schema,
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
                logger.error("JSON Parse Error")
                continue
            
            logger.info(f"AI Calling: {fn_name} | Args: {fn_args}")
            
            tool_result = "Unknown function"
            if fn_name == "search_wines":
                tool_result = await search_wines_impl(**fn_args)
            elif fn_name == "get_wine_detail":
                tool_result = await get_wine_detail_impl(**fn_args)
            elif fn_name == "add_to_cart":
                tool_result = await add_to_cart_impl(**fn_args)
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(tool_result)
            })

    return "Đã thực hiện xong các thao tác."