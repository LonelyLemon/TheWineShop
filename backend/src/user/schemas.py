import re

from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

from src.core.aws import s3_client


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    title: Optional[str] = None
    
    phone_number: Optional[str] = None
    fax_number: Optional[str] = None
    
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    birthdate: Optional[datetime] = None


class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    title: Optional[str] = None
    
    phone_number: Optional[str] = None
    fax_number: Optional[str] = None
    
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    birthdate: Optional[datetime] = None
    
    password: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    role: str
    email_verified: bool
    status: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('avatar_url', mode='before')
    @classmethod
    def sign_avatar_url(cls, v):
        if v and isinstance(v, str) and not v.startswith("http"):
            return s3_client.get_presigned_url(v)
        return v

    class Config:
        from_attributes = True


class ForgetPasswordRequest(BaseModel):
    email: EmailStr

class ResendVerificationRequest(BaseModel):
    email: EmailStr
    