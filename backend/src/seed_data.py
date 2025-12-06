import asyncio
from sqlalchemy import select
from src.core.database import SessionLocal
from src.product.models import Category, Wine, Inventory

async def seed_products():
    async with SessionLocal() as db:
        print("Seeding Data...")

        red_wine = Category(name="Vang Đỏ", slug="vang-do", description="Rượu vang đỏ thượng hạng")
        white_wine = Category(name="Vang Trắng", slug="vang-trang", description="Rượu vang trắng thanh mát")
        
        existing = await db.execute(select(Category).where(Category.slug == "vang-do"))
        if existing.scalar():
            print("Data already exists. Skipping.")
            return

        db.add_all([red_wine, white_wine])
        await db.commit()
        await db.refresh(red_wine)
        await db.refresh(white_wine)

        wine1 = Wine(
            name="Chateau Dalat Signature",
            slug="chateau-dalat-signature",
            description="Hương vị đậm đà từ cao nguyên Đà Lạt",
            alcohol_percentage=12.5,
            volume=750,
            country="Vietnam",
            region="Dalat",
            vintage=2020,
            price=500000,
            category_id=red_wine.id
        )

        wine2 = Wine(
            name="Bordeaux Sauvignon Blanc",
            slug="bordeaux-sauvignon-blanc",
            description="Vang trắng nhập khẩu Pháp",
            alcohol_percentage=13.0,
            volume=750,
            country="France",
            region="Bordeaux",
            vintage=2021,
            price=1200000,
            category_id=white_wine.id
        )

        db.add_all([wine1, wine2])
        await db.commit()
        await db.refresh(wine1)
        await db.refresh(wine2)
        
        inv1 = Inventory(wine_id=wine1.id, quantity_available=100, batch_code="DL001")
        inv2 = Inventory(wine_id=wine2.id, quantity_available=50, batch_code="FR001")
        
        db.add_all([inv1, inv2])
        await db.commit()

        print("Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_products())