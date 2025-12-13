from datetime import datetime

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from src.core.base_model import Base
from src.user.constants import UserRole, UserStatus


class User(Base):
    __tablename__ = "user"

    # Thông tin cơ bản
    email: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(512), nullable=False)
    
    # Thông tin cá nhân
    title: Mapped[str | None] = mapped_column(String(10), nullable=True)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    birthdate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Thông tin liên hệ
    phone_number: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    fax_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Địa chỉ chi tiết
    address_line_1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line_2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(50), nullable=True)
    state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # System fields
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default=UserRole.CUSTOMER.value)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=UserStatus.ACTIVE.value)
    
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    