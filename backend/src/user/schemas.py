from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    city: Optional[str] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    city: Optional[str] = None
    password: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birthdate: Optional[datetime] = None


class UserResponse(UserBase):
    id: UUID
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    city: Optional[str] = None
    email_verified: bool
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birthdate: Optional[datetime] = None
    

    class Config:
        from_attributes = True


class ForgetPasswordRequest(BaseModel):
    email: EmailStr