from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from src.core.database import SessionDep
from src.product.models import Wine, Category, WineImage, Inventory
from src.product.schemas import WineListResponse, WineDetailResponse, CategoryBase


product_router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@product_router.get("/categories", response_model=List[CategoryBase])
async def get_categories(db: SessionDep):
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    return categories


@product_router.get("/wines", response_model=List[WineListResponse])
async def get_wines(
    db: SessionDep,
    skip: int = 0,
    limit: int = 10,
    category_slug: Optional[str] = None,
    search: Optional[str] = None
):
    query = select(Wine).options(
        selectinload(Wine.category),
        selectinload(Wine.images)
    ).where(Wine.is_active == True)

    if category_slug:
        query = query.join(Category).where(Category.slug == category_slug)

    if search:
        query = query.where(Wine.name.ilike(f"%{search}%"))

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    wines = result.scalars().all()

    response = []
    for wine in wines:
        thumb = None
        if wine.images:
            thumb_obj = next((img for img in wine.images if img.is_thumbnail), None)
            if not thumb_obj:
                thumb_obj = wine.images[0]
            thumb = thumb_obj.image_url

        response.append(WineListResponse(
            id=wine.id,
            name=wine.name,
            slug=wine.slug,
            price=wine.price,
            country=wine.country,
            region=wine.region,
            wine_type=wine.category.name if wine.category else None,
            thumbnail=thumb,
            category=wine.category
        ))

    return response


@product_router.get("/wines/{wine_id}", response_model=WineDetailResponse)
async def get_wine_detail(wine_id: UUID, db: SessionDep):
    query = select(Wine).options(
        selectinload(Wine.category),
        selectinload(Wine.images),
        selectinload(Wine.inventory_items)
    ).where(Wine.id == wine_id)

    result = await db.execute(query)
    wine = result.scalar_one_or_none()

    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    total_inventory = sum(item.quantity_available for item in wine.inventory_items)

    return WineDetailResponse(
        id=wine.id,
        name=wine.name,
        slug=wine.slug,
        description=wine.description,
        alcohol_percentage=wine.alcohol_percentage,
        volume=wine.volume,
        country=wine.country,
        region=wine.region,
        vintage=wine.vintage,
        price=wine.price,
        category=wine.category,
        images=wine.images,
        inventory_quantity=total_inventory
    )