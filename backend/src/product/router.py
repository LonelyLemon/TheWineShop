from typing import List, Optional
from datetime import datetime, timezone
from slugify import slugify
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, asc, desc, or_

from src.auth.dependencies import allow_staff, get_current_user
from src.user.models import User
from src.core.database import SessionDep
from src.product.models import (
    Wine, 
    Category,
    WineImage, 
    Inventory, 
    Region, 
    Winery, 
    GrapeVariety, 
    WineGrape, 
    Promotion, 
    ProductReview
)
from src.product.schemas import (
    WineListResponse, 
    WineDetailResponse, 
    CategoryBase, 
    CategoryCreate,
    RegionCreate,
    GrapeVarietyCreate,
    WineryCreate,
    WineCreate,
    WineUpdate,
    RegionBase,
    WineryBase,
    GrapeVarietyBase,
    InventoryImport,
    PromotionCreate, 
    PromotionUpdate, 
    PromotionResponse,
    ReviewCreate,
    ReviewResponse
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

@product_router.post("/categories", response_model=CategoryBase)
async def create_category(payload: CategoryCreate, db: SessionDep, user: User = Depends(allow_staff)):
    slug = slugify(payload.name)
    existing = await db.execute(select(Category).where(Category.slug == slug))
    if existing.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Loại vang này đã tồn tại")

    new_category = Category(
        name=payload.name,
        slug=slug,
        description=payload.description
    )
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    return new_category

@product_router.get("/regions", response_model=List[RegionBase])
async def get_regions(db: SessionDep):
    result = await db.execute(select(Region))
    return result.scalars().all()

@product_router.post("/regions", response_model=RegionBase)
async def create_region(payload: RegionCreate, db: SessionDep, user: User = Depends(allow_staff)):
    new_region = Region(
        name=payload.name, 
        description=payload.description, 
        map_image_url=payload.map_image_url
    )
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
async def create_winery(payload: WineryCreate, db: SessionDep, user: User = Depends(allow_staff)):
    new_winery = Winery(
        name=payload.name, 
        phone_number=payload.phone_number,
        region_id=payload.region_id
    )
    
    db.add(new_winery)
    await db.commit()
    await db.refresh(new_winery)
    
    query = select(Winery).options(selectinload(Winery.region)).where(Winery.id == new_winery.id)
    result = await db.execute(query)
    return result.scalar_one()

@product_router.get("/grapes", response_model=List[GrapeVarietyBase])
async def get_grapes(db: SessionDep):
    result = await db.execute(select(GrapeVariety))
    return result.scalars().all()

@product_router.post("/grapes", response_model=GrapeVarietyBase)
async def create_grape(
    payload: GrapeVarietyCreate, 
    db: SessionDep, 
    user: User = Depends(allow_staff)
):
    existing = await db.execute(select(GrapeVariety).where(GrapeVariety.name == payload.name))
    if existing.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Giống nho đã tồn tại")
    
    new_grape = GrapeVariety(name=payload.name)
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
    category_id: Optional[UUID] = None,
    wine_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "newest",
    search: Optional[str] = None
):
    query = select(Wine).where(Wine.is_active == True)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Wine.name.ilike(search_term),
                Wine.slug.ilike(search_term),
                Wine.description.ilike(search_term)
            )
        )

    if category_id:
        query = query.where(Wine.category_id == category_id)
    
    if wine_type:
        query = query.where(Wine.wine_type == wine_type)
    
    if min_price is not None:
        query = query.where(Wine.price >= min_price)
    if max_price is not None:
        query = query.where(Wine.price <= max_price)
    
    if sort_by == "price_asc":
        query = query.order_by(asc(Wine.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Wine.price))
    elif sort_by == "name_asc":
        query = query.order_by(asc(Wine.name))
    else:
        query = query.order_by(desc(Wine.created_at))

    query = query.offset(skip).limit(limit)

    query = query.options(
        selectinload(Wine.images),
        selectinload(Wine.category),
        selectinload(Wine.reviews),
        selectinload(Wine.winery).selectinload(Winery.region)
    )

    result = await db.execute(query)
    wines = result.scalars().all()

    return wines


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


@product_router.post("/wines/{wine_id}/inventory")
async def add_inventory(
    wine_id: UUID,
    payload: InventoryImport,
    db: SessionDep,
    current_user: User = Depends(allow_staff)
):
    wine = await db.get(Wine, wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    
    new_inventory = Inventory(
        wine_id=wine.id,
        quantity_available=payload.quantity,
        import_price=payload.import_price,
        batch_code=payload.batch_code or f"BATCH-{int(datetime.utcnow().timestamp())}",
        import_date=datetime.utcnow()
    )
    
    db.add(new_inventory)
    await db.commit()
    
    return {"message": "Đã nhập kho thành công", "added_quantity": payload.quantity}


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


# ---------------------------------------------------------
# 3. PROMOTION MANAGEMENT (ADMIN)
# ---------------------------------------------------------

@product_router.get("/promotions", response_model=List[PromotionResponse])
async def get_promotions(db: SessionDep):
    result = await db.execute(select(Promotion).order_by(Promotion.start_date.desc()))
    return result.scalars().all()

@product_router.post("/promotions", response_model=PromotionResponse)
async def create_promotion(
    payload: PromotionCreate,
    db: SessionDep,
    user: User = Depends(allow_staff)
):
    if payload.end_date <= payload.start_date:
        raise HTTPException(status_code=400, detail="Ngày kết thúc phải sau ngày bắt đầu")
    
    if payload.code:
        existing = await db.execute(select(Promotion).where(Promotion.code == payload.code))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Mã khuyến mãi đã tồn tại")

    new_promo = Promotion(
        name=payload.name,
        code=payload.code.upper() if payload.code else None,
        description=payload.description,
        discount_percentage=payload.discount_percentage,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=payload.is_active,
        trigger_type=payload.trigger_type,
        min_quantity=payload.min_quantity
    )
    
    db.add(new_promo)
    await db.commit()
    await db.refresh(new_promo)
    return new_promo


@product_router.delete("/promotions/{promo_id}")
async def delete_promotion(
    promo_id: UUID,
    db: SessionDep,
    user: User = Depends(allow_staff)
):
    promo = await db.get(Promotion, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Không tìm thấy khuyến mãi")
        
    await db.delete(promo)
    await db.commit()
    return {"message": "Đã xóa khuyến mãi"}


@product_router.patch("/promotions/{promo_id}/toggle")
async def toggle_promotion(
    promo_id: UUID,
    db: SessionDep,
    user: User = Depends(allow_staff)
):
    promo = await db.get(Promotion, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Không tìm thấy khuyến mãi")
    
    promo.is_active = not promo.is_active
    await db.commit()
    return {"message": "Đã đổi trạng thái", "is_active": promo.is_active}

# ---------------------------------------------------------
# 4. REVIEWS MANAGEMENT
# ---------------------------------------------------------

@product_router.get("/wines/{wine_id}/reviews", response_model=List[ReviewResponse])
async def get_wine_reviews(
    wine_id: UUID, 
    db: SessionDep,
    skip: int = 0, 
    limit: int = 10
):
    # Lấy danh sách review, join với User để lấy tên
    query = select(ProductReview).options(
        selectinload(ProductReview.user) # Giả sử trong model Review có relationship 'user'
    ).where(ProductReview.wine_id == wine_id).order_by(ProductReview.created_at.desc())
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    # Map sang Response
    response = []
    for r in reviews:
        # Xử lý tên user (ẩn danh bớt nếu cần)
        user_name = f"{r.user.last_name} {r.user.first_name}" if r.user else "Anonymous"
        response.append(ReviewResponse(
            id=r.id,
            user_name=user_name,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at # Cần đảm bảo model Review có created_at
        ))
    
    return response

@product_router.post("/wines/{wine_id}/reviews", response_model=ReviewResponse)
async def create_review(
    wine_id: UUID,
    payload: ReviewCreate,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    wine = await db.get(Wine, wine_id)
    if not wine:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Đánh giá phải từ 1 đến 5 sao")

    new_review = ProductReview(
        user_id=current_user.id,
        wine_id=wine_id,
        rating=payload.rating,
        comment=payload.comment,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    user_name = f"{current_user.last_name} {current_user.first_name}"
    
    return ReviewResponse(
        id=new_review.id,
        user_name=user_name,
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at
    )