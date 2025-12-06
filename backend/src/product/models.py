import uuid
from datetime import datetime
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

class Wine(Base):
    __tablename__ = "wine_info"

    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True)
    description = Column(Text, nullable=True)
    alcohol_percentage = Column(DECIMAL(4, 1), nullable=True)
    volume = Column(Integer, nullable=True)
    country = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    vintage = Column(Integer, nullable=True)
    
    
    price = Column(DECIMAL(12, 2), nullable=False, default=0)
    
    
    category_id = Column(UUID(as_uuid=True), ForeignKey("category.id"), nullable=True)
    
    
    is_active = Column(Boolean, default=True)

    
    category = relationship("Category", back_populates="wines")
    images = relationship("WineImage", back_populates="wine", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="wine")
    reviews = relationship("ProductReview", back_populates="wine")


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
    
    import_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    shelf_location = Column(String(100), nullable=True)
    
    wine = relationship("Wine", back_populates="inventory_items")

class Promotion(Base):
    __tablename__ = "promotions"
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    discount_percentage = Column(DECIMAL(5, 2), nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)


class ProductReview(Base):
    __tablename__ = "product_reviews"

    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    wine_id = Column(UUID(as_uuid=True), ForeignKey("wine_info.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    
    parent_id = Column(UUID(as_uuid=True), ForeignKey("product_reviews.id"), nullable=True)
    
    wine = relationship("Wine", back_populates="reviews")
    replies = relationship("ProductReview", remote_side='[ProductReview.id]')