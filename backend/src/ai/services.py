from google import genai
from google.genai import types
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from sqlalchemy.orm import selectinload
from loguru import logger

from src.core.config import settings
from src.product.models import Wine, Category
from src.core.database import SessionDep

# --- CẤU HÌNH ---
client = None
if settings.GOOGLE_API_KEY:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

# ---------------------------------------------------------
# 1. IMPLEMENTATION (HÀM THỰC THI - ASYNC)
# ---------------------------------------------------------

async def search_wines_impl(keyword: str = "", max_price: float = 0, min_price: float = 0, wine_type: str = ""):
    """Logic tìm kiếm sản phẩm trong Database"""
    db = _get_db_session_context()
    
    logger.info(f"⚡ [TOOL] search_wines: kw='{keyword}', price={min_price}-{max_price}, type='{wine_type}'")
    
    stmt = select(Wine).where(Wine.is_active == True).options(selectinload(Wine.category))
    
    conditions = []
    if keyword:
        conditions.append(or_(
            Wine.name.ilike(f"%{keyword}%"),
            Wine.description.ilike(f"%{keyword}%"),
            Wine.category.has(Category.name.ilike(f"%{keyword}%"))
        ))
    if max_price > 0:
        conditions.append(Wine.price <= max_price)
    if min_price > 0:
        conditions.append(Wine.price >= min_price)
    if wine_type:
        conditions.append(Wine.category.has(Category.name.ilike(f"%{wine_type}%")))

    if conditions:
        stmt = stmt.where(and_(*conditions))
    
    stmt = stmt.limit(8)
    result = await db.execute(stmt)
    wines = result.scalars().all()
    
    if not wines:
        return "Không tìm thấy sản phẩm nào phù hợp."

    # 👇 SỬA LỖI TẠI ĐÂY: Ép kiểu price sang float
    results = []
    for w in wines:
        results.append({
            "id": str(w.id),
            "name": w.name,
            "price": float(w.price) if w.price else 0.0, # Decimal -> Float
            "type": w.category.name if w.category else ""
        })
    return results

async def get_wine_detail_impl(wine_id: str):
    """Logic lấy chi tiết sản phẩm"""
    db = _get_db_session_context()
    logger.info(f"⚡ [TOOL] get_wine_detail: id={wine_id}")
    
    try:
        stmt = select(Wine).where(Wine.id == wine_id).options(selectinload(Wine.category))
        result = await db.execute(stmt)
        wine = result.scalar_one_or_none()
        
        if not wine:
            return "Sản phẩm không tồn tại."
        
        # 👇 SỬA LỖI TẠI ĐÂY: Ép kiểu price và alcohol sang float
        return {
            "name": wine.name,
            "price": float(wine.price) if wine.price else 0.0,
            "description": wine.description,
            "alcohol": float(wine.alcohol_percentage) if wine.alcohol_percentage else 0.0,
            "vintage": wine.vintage,
        }
    except Exception as e:
        logger.error(f"Error getting wine detail: {e}")
        return "Lỗi: ID sản phẩm không hợp lệ."

# ---------------------------------------------------------
# 2. DECLARATION (KHAI BÁO TOOLS CHO GEMINI)
# ---------------------------------------------------------

search_wines_tool = types.FunctionDeclaration(
    name="search_wines",
    description="Tìm kiếm danh sách rượu trong kho theo tên, giá hoặc loại.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "keyword": types.Schema(type="STRING", description="Tên rượu, hoặc hương vị (vd: 'chát', 'ngọt', 'vang pháp')."),
            "max_price": types.Schema(type="NUMBER", description="Giá tối đa (VND)."),
            "min_price": types.Schema(type="NUMBER", description="Giá tối thiểu (VND)."),
            "wine_type": types.Schema(type="STRING", description="Loại rượu (vd: 'Red', 'White', 'Sparkling')."),
        }
    )
)

get_wine_detail_tool = types.FunctionDeclaration(
    name="get_wine_detail",
    description="Lấy thông tin chi tiết của một chai rượu cụ thể dựa trên ID.",
    parameters=types.Schema(
        type="OBJECT",
        properties={
            "wine_id": types.Schema(type="STRING", description="ID của sản phẩm."),
        },
        required=["wine_id"]
    )
)

# Gom lại thành Tool Object
my_tools = types.Tool(function_declarations=[search_wines_tool, get_wine_detail_tool])

# System Instruction
sys_instruct = """
Bạn là trợ lý ảo TheWineShop.
1. Khi khách hỏi tìm rượu, dùng tool `search_wines`.
2. Khi khách hỏi chi tiết 1 chai (sau khi đã tìm thấy và có ID), dùng tool `get_wine_detail`.
3. Trả lời ngắn gọn, format Markdown, luôn in đậm tên rượu và giá tiền.
4. Nếu công cụ trả về không tìm thấy, hãy nói thật với khách.
"""

# ---------------------------------------------------------
# 3. CONTROLLER
# ---------------------------------------------------------

_current_db_session: SessionDep = None
def _get_db_session_context():
    return _current_db_session

async def generate_consulting_response(user_query: str, db: SessionDep):
    global _current_db_session
    _current_db_session = db 

    if not client:
        return "Chưa cấu hình AI Key."

    # Tạo Config với tool khai báo thủ công
    config = types.GenerateContentConfig(
        tools=[my_tools], 
        system_instruction=sys_instruct,
        temperature=0.7
    )

    chat = client.chats.create(
        model='gemini-2.5-flash', 
        config=config
    )
    
    # 1. Gửi tin nhắn đầu tiên
    try:
        response = chat.send_message(user_query)
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau."
    
    # 2. Vòng lặp xử lý Function Calling
    max_turns = 3
    current_turn = 0

    while response.function_calls and current_turn < max_turns:
        parts_to_send_back = []
        
        for call in response.function_calls:
            fn_name = call.name
            fn_args = call.args
            
            logger.info(f"🤖 AI Calling: {fn_name} | Args: {fn_args}")
            
            api_result = None
            
            # Map tên hàm từ declaration sang hàm impl (async)
            if fn_name == "search_wines":
                api_result = await search_wines_impl(**fn_args)
            elif fn_name == "get_wine_detail":
                api_result = await get_wine_detail_impl(**fn_args)
            else:
                api_result = "Unknown function"
            
            # Đóng gói kết quả
            parts_to_send_back.append(
                types.Part.from_function_response(
                    name=fn_name,
                    response={"result": api_result}
                )
            )

        if parts_to_send_back:
             response = chat.send_message(parts_to_send_back)
        
        current_turn += 1
        
    return response.text