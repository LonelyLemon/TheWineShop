import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from src.core.base_model import Base

class Category(Base):
    __tablename__ = "category"

    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True)
    description = Column(Text, nullable=True)
    
    wines = relationship("Wine", back_populates="category")

class Region(Base):
    __tablename__ = "regions"

    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    map_image_url = Column(String(512), nullable=True)
    
    wineries = relationship("Winery", back_populates="region")

class Winery(Base):
    __tablename__ = "wineries"

    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    phone_number = Column(String(50), nullable=True)
    fax_number = Column(String(50), nullable=True)
    
    region_id = Column(UUID(as_uuid=True), ForeignKey("regions.id"), nullable=True)
    
    region = relationship("Region", back_populates="wineries")
    wines = relationship("Wine", back_populates="winery")

class GrapeVariety(Base):
    __tablename__ = "grape_varieties"

    name = Column(String(100), nullable=False, unique=True)
    
    # Quan hệ với bảng trung gian
    wine_associations = relationship("WineGrape", back_populates="grape_variety")

class WineGrape(Base):
    __tablename__ = "wine_grapes"

    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), primary_key=True)
    grape_variety_id = Column(UUID(as_uuid=True), ForeignKey("grape_varieties.id"), primary_key=True)
    
    percentage = Column(Integer, nullable=True)
    order = Column(Integer, default=0) # Thứ tự ưu tiên (Cabernet Merlot != Merlot Cabernet)

    wine = relationship("Wine", back_populates="grape_composition")
    grape_variety = relationship("GrapeVariety", back_populates="wine_associations")

class Wine(Base):
    __tablename__ = "wine_info"

    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Thông số kỹ thuật
    alcohol_percentage = Column(DECIMAL(4, 1), nullable=True)
    volume = Column(Integer, nullable=True) # ml
    vintage = Column(Integer, nullable=True) # Năm sản xuất
    
    price = Column(DECIMAL(12, 2), nullable=False, default=0)
    is_active = Column(Boolean, default=True)

    # Foreign Keys
    category_id = Column(UUID(as_uuid=True), ForeignKey("category.id"), nullable=True)
    winery_id = Column(UUID(as_uuid=True), ForeignKey("wineries.id"), nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="wines")
    winery = relationship("Winery", back_populates="wines")
    
    grape_composition = relationship("WineGrape", back_populates="wine", cascade="all, delete-orphan")
    
    images = relationship("WineImage", back_populates="wine", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="wine")
    reviews = relationship("ProductReview", back_populates="wine")

    @property
    def thumbnail(self):
        if self.images:
            thumb = next((img for img in self.images if img.is_thumbnail), None)
            if not thumb:
                thumb = self.images[0]
            return thumb.image_url
        return None

    @property
    def winery_name(self):
        return self.winery.name if self.winery else None

    @property
    def region_name(self):
        return self.winery.region.name if self.winery and self.winery.region else None

    @property
    def wine_type(self):
        return self.category.name if self.category else None
    
    @property
    def average_rating(self):
        if not self.reviews:
            return 0
        total = sum(r.rating for r in self.reviews)
        return round(total / len(self.reviews), 1)

    @property
    def review_count(self):
        return len(self.reviews) if self.reviews else 0


class WineImage(Base):
    __tablename__ = "wine_images"

    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), nullable=False)
    image_url = Column(Text, nullable=False)
    alt_text = Column(String(255), nullable=True)
    is_thumbnail = Column(Boolean, default=False)
    
    wine = relationship("Wine", back_populates="images")


class Inventory(Base):
    __tablename__ = "inventory"

    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), nullable=False)
    
    batch_code = Column(String(50), nullable=True)
    quantity_available = Column(Integer, default=0)
    
    import_price = Column(DECIMAL(12, 2), nullable=True)

    import_date = Column(DateTime, default=datetime.now(timezone.utc))
    expiry_date = Column(DateTime, nullable=True)
    shelf_location = Column(String(100), nullable=True)
    
    wine = relationship("Wine", back_populates="inventory_items")

class Promotion(Base):
    __tablename__ = "promotions"
    
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=True)
    description = Column(Text, nullable=True)

    discount_percentage = Column(DECIMAL(5, 2), nullable=False)

    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    trigger_type = Column(String(50), nullable=False, default="period")
    min_quantity = Column(Integer, default=0)


class ProductReview(Base):
    __tablename__ = "product_reviews"

    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    
    parent_id = Column(UUID(as_uuid=True), ForeignKey("product_reviews.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    wine = relationship("Wine", back_populates="reviews")
    replies = relationship("ProductReview", remote_side='[ProductReview.id]')
    user = relationship("User")