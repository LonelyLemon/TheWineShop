from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.future import select

from src.core.database import SessionDep
from src.product.models import Wine, Category


chat_router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"],
)


class ChatMessageRequest(BaseModel):
    message: str
    user_id: Optional[str] = None


class SuggestedProduct(BaseModel):
    id: str
    name: str
    price: float
    country: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None


class ChatMessageResponse(BaseModel):
    reply: str
    suggested_products: List[SuggestedProduct] = []
    can_connect_to_admin: bool = True
    admin_hint: str = "Nếu bạn cần tư vấn chi tiết hơn, hãy nhấn nút kết nối để nói chuyện trực tiếp với nhân viên."


@chat_router.post("/message", response_model=ChatMessageResponse)
async def chat_with_bot(payload: ChatMessageRequest, db: SessionDep):
    """
    Chatbot đơn giản:
    - Phân tích từ khoá trong câu hỏi của khách
    - Gợi ý một vài sản phẩm rượu phù hợp (nếu tìm thấy)
    - Trả về cờ `can_connect_to_admin` để frontend hiển thị nút chat với admin
    """
    text = (payload.message or "").lower()

    query = select(Wine).join(Category, isouter=True).where(Wine.is_active == True)

    if "đỏ" in text or "red" in text:
        query = query.where(Category.name.ilike("%đỏ%") | Category.name.ilike("%red%"))
    if "trắng" in text or "white" in text:
        query = query.where(Category.name.ilike("%trắng%") | Category.name.ilike("%white%"))
    if "ngọt" in text or "sweet" in text:
        query = query.where(Wine.description.ilike("%ngọt%") | Wine.description.ilike("%sweet%"))
    if "khô" in text or "dry" in text:
        query = query.where(Wine.description.ilike("%khô%") | Wine.description.ilike("%dry%"))

    query = query.limit(5)
    result = await db.execute(query)
    wines = result.scalars().all()

    suggestions: List[SuggestedProduct] = []
    for wine in wines:
        suggestions.append(
            SuggestedProduct(
                id=str(wine.id),
                name=wine.name,
                price=float(wine.price),
                country=wine.country,
                region=wine.region,
                category=wine.category.name if wine.category else None,
            )
        )

    if suggestions:
        reply = (
            "Dựa trên yêu cầu của bạn, TheWineShop gợi ý một vài sản phẩm sau. "
            "Bạn có thể nhấp vào sản phẩm để xem chi tiết hoặc thêm vào giỏ."
        )
    else:
        reply = (
            "Hiện tại mình chưa tìm được sản phẩm phù hợp chính xác với mô tả của bạn. "
            "Bạn có thể mô tả rõ hơn (ví dụ: rượu vang đỏ, ngọt, ngân sách khoảng bao nhiêu), "
            "hoặc nhấn nút kết nối để nói chuyện với nhân viên tư vấn."
        )

    return ChatMessageResponse(
        reply=reply,
        suggested_products=suggestions,
    )



