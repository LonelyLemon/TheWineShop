import uuid
import datetime

from typing import Optional
from pydantic import BaseModel, EmailStr

from src.user.constants import UserRole, UserStatus


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    middle_name: str
    email: EmailStr
    password: str
    city: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str | None] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birthdate: Optional[datetime.datetime] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    middle_name: str
    email: EmailStr
    role: str
    avatar_url: str | None
    phone_number: str
    address: str
    city: str
    birthdate: datetime.datetime
    status: str
    

    class Config:
        from_attributes = True