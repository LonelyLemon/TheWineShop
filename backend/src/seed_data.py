import asyncio
from sqlalchemy import select

from src.core.database import SessionLocal
from src.product.models import Category, Wine, Inventory, Region, Winery, GrapeVariety, WineGrape
from src.user.models import User
from src.user.constants import UserRole, UserStatus
from src.core.security import hash_password
from src.core.config import settings

async def seed_products():
    async with SessionLocal() as db:
        print("Seeding Data ...")

        # 1. Tạo Category
        red_wine = Category(name="Vang Đỏ", slug="vang-do", description="Rượu vang đỏ thượng hạng")
        white_wine = Category(name="Vang Trắng", slug="vang-trang", description="Rượu vang trắng thanh mát")
        
        existing = await db.execute(select(Category).where(Category.slug == "vang-do"))
        if existing.scalar():
            print("Dữ liệu đã tồn tại. Bỏ qua.")
            return

        db.add_all([red_wine, white_wine])
        await db.commit()
        
        # 2. Tạo Region
        region_dalat = Region(name="Dalat", description="Vùng cao nguyên Việt Nam")
        region_bordeaux = Region(name="Bordeaux", description="Vùng rượu vang nổi tiếng của Pháp")
        
        db.add_all([region_dalat, region_bordeaux])
        await db.commit()
        await db.refresh(region_dalat)
        await db.refresh(region_bordeaux)

        # 3. Tạo Winery
        winery_chateau_dalat = Winery(name="Chateau Dalat", region_id=region_dalat.id, phone_number="0987654321")
        winery_margaux = Winery(name="Chateau Margaux", region_id=region_bordeaux.id, phone_number="+33 12345678")
        
        db.add_all([winery_chateau_dalat, winery_margaux])
        await db.commit()
        await db.refresh(winery_chateau_dalat)
        await db.refresh(winery_margaux)

        # 4. Tạo GrapeVariety
        grape_merlot = GrapeVariety(name="Merlot")
        grape_cabernet = GrapeVariety(name="Cabernet Sauvignon")
        grape_sauvignon = GrapeVariety(name="Sauvignon Blanc")
        grape_cardinal = GrapeVariety(name="Cardinal")
        
        db.add_all([grape_merlot, grape_cabernet, grape_sauvignon, grape_cardinal])
        await db.commit()
        
        # 5. Tạo Wine
        wine1 = Wine(
            name="Chateau Dalat Signature",
            slug="chateau-dalat-signature",
            description="Hương vị đậm đà từ cao nguyên Đà Lạt, niềm tự hào Việt Nam",
            alcohol_percentage=12.5,
            volume=750,
            vintage=2020,
            price=500000,
            category_id=red_wine.id,
            winery_id=winery_chateau_dalat.id
        )

        wine2 = Wine(
            name="Margaux Pavillon Blanc",
            slug="margaux-pavillon-blanc",
            description="Vang trắng đẳng cấp từ Bordeaux",
            alcohol_percentage=13.5,
            volume=750,
            vintage=2021,
            price=4500000,
            category_id=white_wine.id,
            winery_id=winery_margaux.id
        )

        db.add_all([wine1, wine2])
        await db.commit()
        await db.refresh(wine1)
        await db.refresh(wine2)
        
        # 6. WineGrape
        # Wine 1: 100% Cardinal
        comp1 = WineGrape(wine_id=wine1.id, grape_variety_id=grape_cardinal.id, percentage=100, order=1)
        
        # Wine 2: 80% Sauvignon Blanc, 20% Merlot
        comp2a = WineGrape(wine_id=wine2.id, grape_variety_id=grape_sauvignon.id, percentage=80, order=1)
        comp2b = WineGrape(wine_id=wine2.id, grape_variety_id=grape_merlot.id, percentage=20, order=2)
        
        db.add_all([comp1, comp2a, comp2b])

        # 7. Tạo Inventory
        inv1 = Inventory(wine_id=wine1.id, quantity_available=100, batch_code="DL001", import_price=300000)
        inv2 = Inventory(wine_id=wine2.id, quantity_available=20, batch_code="FR001", import_price=3000000)
        
        db.add_all([inv1, inv2])
        await db.commit()

        print("Seeding Complete!")

async def seed_admin_user():
    async with SessionLocal() as db:
        print("Checking Admin User...")
        
        admin_email = "admin@thewineshop.com"
        admin_password = "AdminPassword123!" 
        
        existing_admin = await db.execute(select(User).where(User.email == admin_email))
        if existing_admin.scalar():
            print(f"Admin user {admin_email} already exists.")
            return

        print(f"Creating default admin user: {admin_email}")
        
        new_admin = User(
            email=admin_email,
            hashed_password=hash_password(admin_password),
            first_name="Super",
            last_name="Admin",
            role=UserRole.ADMIN.value,
            status=UserStatus.ACTIVE.value,
            email_verified=True,
            phone_number="0909000111",
            address_line_1="Headquarters"
        )
        
        db.add(new_admin)
        await db.commit()
        print("Admin user created successfully!")

if __name__ == "__main__":
    asyncio.run(seed_products())
    asyncio.run(seed_admin_user())