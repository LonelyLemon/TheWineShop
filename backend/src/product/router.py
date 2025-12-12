from typing import List, Optional
from datetime import datetime
from slugify import slugify
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from src.auth.dependencies import allow_staff
from src.user.models import User
from src.core.database import SessionDep
from src.product.models import Wine, Category, WineImage, Inventory, Region, Winery, GrapeVariety, WineGrape
from src.product.schemas import (
    WineListResponse, 
    WineDetailResponse, 
    CategoryBase, 
    WineCreate, 
    WineUpdate,
    RegionBase,
    WineryBase,
    GrapeVarietyBase
)

product_router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# ---------------------------------------------------------
# 1. HELPERS / MASTER DATA (Region, Winery, Grapes, Category)
# ---------------------------------------------------------

@product_router.get("/categories", response_model=List[CategoryBase])
async def get_categories(db: SessionDep):
    result = await db.execute(select(Category))
    return result.scalars().all()

@product_router.get("/regions", response_model=List[RegionBase])
async def get_regions(db: SessionDep):
    result = await db.execute(select(Region))
    return result.scalars().all()

@product_router.post("/regions", response_model=RegionBase)
async def create_region(payload: RegionBase, db: SessionDep, user: User = Depends(allow_staff)):
    new_region = Region(name=payload.name, description=payload.description, map_image_url=payload.map_image_url)
    db.add(new_region)
    await db.commit()
    await db.refresh(new_region)
    return new_region

@product_router.get("/wineries", response_model=List[WineryBase])
async def get_wineries(db: SessionDep, region_id: Optional[UUID] = None):
    query = select(Winery).options(selectinload(Winery.region))
    if region_id:
        query = query.where(Winery.region_id == region_id)
    result = await db.execute(query)
    return result.scalars().all()

@product_router.post("/wineries", response_model=WineryBase)
async def create_winery(payload: WineryBase, db: SessionDep, user: User = Depends(allow_staff)):
    new_winery = Winery(
        name=payload.name, 
        phone_number=payload.phone_number,
        region_id=payload.region.id if payload.region else None
    )
    
    if payload.region and payload.region.id:
         new_winery.region_id = payload.region.id
    
    db.add(new_winery)
    await db.commit()
    await db.refresh(new_winery)
    
    # Reload relationship
    query = select(Winery).options(selectinload(Winery.region)).where(Winery.id == new_winery.id)
    result = await db.execute(query)
    return result.scalar_one()

@product_router.get("/grapes", response_model=List[GrapeVarietyBase])
async def get_grapes(db: SessionDep):
    result = await db.execute(select(GrapeVariety))
    return result.scalars().all()

@product_router.post("/grapes", response_model=GrapeVarietyBase)
async def create_grape(name: str, db: SessionDep, user: User = Depends(allow_staff)):
    # Quick create grape
    existing = await db.execute(select(GrapeVariety).where(GrapeVariety.name == name))
    if existing.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Giống nho đã tồn tại")
    
    new_grape = GrapeVariety(name=name)
    db.add(new_grape)
    await db.commit()
    await db.refresh(new_grape)
    return new_grape

# ---------------------------------------------------------
# 2. WINE CRUD
# ---------------------------------------------------------

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
        selectinload(Wine.images),
        selectinload(Wine.winery).selectinload(Winery.region),
    ).where(Wine.is_active == True)

    if category_slug:
        query = query.join(Category).where(Category.slug == category_slug)

    if search:
        query = query.where(Wine.name.ilike(f"%{search}%"))

    query = query.order_by(Wine.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    wines = result.scalars().all()

    response = []
    for wine in wines:
        thumb = None
        if wine.images:
            thumb_obj = next((img for img in wine.images if img.is_thumbnail), None)
            if not thumb_obj: thumb_obj = wine.images[0]
            thumb = thumb_obj.image_url

        response.append(WineListResponse(
            id=wine.id,
            name=wine.name,
            slug=wine.slug,
            price=wine.price,
            winery_name=wine.winery.name if wine.winery else None,
            region_name=wine.winery.region.name if wine.winery and wine.winery.region else None,
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
        selectinload(Wine.inventory_items),
        selectinload(Wine.winery).selectinload(Winery.region),
        selectinload(Wine.grape_composition).selectinload(WineGrape.grape_variety)
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
        vintage=wine.vintage,
        price=wine.price,
        category=wine.category,
        winery=wine.winery,
        grapes=wine.grape_composition,
        images=wine.images,
        inventory_quantity=total_inventory
    )


@product_router.post("/wines", response_model=WineDetailResponse)
async def create_wine(
    payload: WineCreate,
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    # 1. Generate Slug
    base_slug = slugify(payload.name)
    slug = base_slug
    existing = await db.execute(select(Wine).where(Wine.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{base_slug}-{int(datetime.utcnow().timestamp())}"

    # 2. Create Wine Core
    new_wine = Wine(
        name=payload.name,
        slug=slug,
        description=payload.description,
        price=payload.price,
        alcohol_percentage=payload.alcohol_percentage,
        volume=payload.volume,
        vintage=payload.vintage,
        category_id=payload.category_id,
        winery_id=payload.winery_id, # Link to Winery
        is_active=True
    )
    db.add(new_wine)
    await db.flush()

    # 3. Add Images
    for img_url in payload.images:
        new_img = WineImage(
            wine_id=new_wine.id,
            image_url=img_url,
            is_thumbnail=False
        )
        db.add(new_img)
    
    # 4. Add Grape Composition
    if payload.grapes:
        for item in payload.grapes:
            new_comp = WineGrape(
                wine_id=new_wine.id,
                grape_variety_id=item.grape_variety_id,
                percentage=item.percentage,
                order=item.order
            )
            db.add(new_comp)

    await db.commit()
    await db.refresh(new_wine)
    
    # Return detail
    return await get_wine_detail(new_wine.id, db)


@product_router.patch("/wines/{wine_id}", response_model=WineDetailResponse)
async def update_wine(
    wine_id: UUID,
    payload: WineUpdate,
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    wine = await db.get(Wine, wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    update_data = payload.model_dump(exclude_unset=True)
    
    # 1. Update Images
    if "images" in update_data:
        images = update_data.pop("images")
        existing_imgs = await db.execute(select(WineImage).where(WineImage.wine_id == wine.id))
        for img in existing_imgs.scalars().all():
            await db.delete(img)
        for url in images:
            db.add(WineImage(wine_id=wine.id, image_url=url))
            
    # 2. Update Grapes
    if "grapes" in update_data:
        grapes_data = update_data.pop("grapes")
        
        existing_grapes = await db.execute(select(WineGrape).where(WineGrape.wine_id == wine.id))
        for g in existing_grapes.scalars().all():
            await db.delete(g)
        
        for item in grapes_data:
            if item.get("grape_variety_id"): 
                new_comp = WineGrape(
                    wine_id=wine.id,
                    grape_variety_id=item["grape_variety_id"],
                    percentage=item.get("percentage"),
                    order=item.get("order")
                )
                db.add(new_comp)

    for key, value in update_data.items():
        setattr(wine, key, value)

    await db.commit()
    
    return await get_wine_detail(wine.id, db)

@product_router.delete("/wines/{wine_id}")
async def delete_wine(
    wine_id: UUID,
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    wine = await db.get(Wine, wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    
    wine.is_active = False
    await db.commit()

    return {"message": "Sản phẩm đã được ẩn"}