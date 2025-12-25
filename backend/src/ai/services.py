from google import genai
from sqlalchemy.future import select
from sqlalchemy import or_
from loguru import logger

from src.core.config import settings
from src.product.models import Wine, Category
from src.core.database import SessionDep

if settings.GOOGLE_API_KEY:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

model = "gemini-2.5-flash"

async def get_relevant_wines(db: SessionDep, query_text: str, limit: int = 10):
    keywords = query_text.split()
    
    stmt = select(Wine).join(Category, isouter=True).where(Wine.is_active == True)
    
    conditions = []
    for word in keywords:
        if len(word) > 2:
            conditions.append(Wine.name.ilike(f"%{word}%"))
            conditions.append(Wine.description.ilike(f"%{word}%"))
            conditions.append(Category.name.ilike(f"%{word}%"))
    
    if conditions:
        stmt = stmt.where(or_(*conditions))
    
    stmt = stmt.limit(limit)
    
    result = await db.execute(stmt)
    wines = result.scalars().all()
    
    if not wines:
        stmt_fallback = select(Wine).where(Wine.is_active == True).limit(5)
        result_fallback = await db.execute(stmt_fallback)
        wines = result_fallback.scalars().all()

    return wines

async def format_wines_for_context(wines):
    context = "DANH SÁCH SẢN PHẨM HIỆN CÓ CỦA CỬA HÀNG:\n"
    for wine in wines:
        price_vnd = f"{wine.price:,.0f} VND"
        context += f"- ID: {wine.id} | Tên: {wine.name} | Giá: {price_vnd} | Loại: {wine.wine_type} | Mô tả: {wine.description[:200]}...\n"
    return context

async def generate_consulting_response(user_query: str, db: SessionDep):
    if not settings.GOOGLE_API_KEY:
        return "Xin lỗi, chức năng tư vấn AI chưa được cấu hình."

    # 1. Retrieval:
    relevant_wines = await get_relevant_wines(db, user_query)
    product_context = format_wines_for_context(relevant_wines)

    # 2. Prompt Engineering
    system_instruction = """
    Bạn là chuyên gia tư vấn rượu vang nhiệt tình và am hiểu của cửa hàng 'TheWineShop'.
    Nhiệm vụ của bạn là tư vấn cho khách hàng dựa trên danh sách sản phẩm được cung cấp bên dưới.
    
    Yêu cầu:
    1. Chỉ tư vấn các sản phẩm có trong danh sách được cung cấp. Nếu không có sản phẩm phù hợp, hãy nói khéo và gợi ý sản phẩm gần giống nhất.
    2. Trả lời ngắn gọn, thân thiện, sử dụng tiếng Việt tự nhiên.
    3. Luôn kèm theo giá tiền khi nhắc đến sản phẩm.
    4. Định dạng câu trả lời bằng Markdown (dùng **in đậm** cho tên sản phẩm).
    """

    full_prompt = f"{system_instruction}\n\n{product_context}\n\nCâu hỏi của khách hàng: {user_query}"

    try:
        # 3. Generation
        response = client.models.generate_content(model=model, 
                                                  contents=full_prompt
                                                  )
        return response.text
    except Exception as e:
        logger.error(f"Gemini Error: {e}")
        return "Xin lỗi, hiện tại tôi đang gặp chút sự cố. Bạn vui lòng hỏi lại sau."