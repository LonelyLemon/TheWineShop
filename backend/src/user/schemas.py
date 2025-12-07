import re

from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


PHONE_REGEX = r"(84|0[3|5|7|8|9])+([0-9]{8})\b"


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    middle_name: Optional[str] = None
    city: Optional[str] = None
    
    # Password validation logic
    password: str = Field(..., min_length=8, description="Mật khẩu tối thiểu 8 ký tự")

    @field_validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Mật khẩu phải chứa ít nhất 1 chữ hoa')
        if not re.search(r'[a-z]', v):
            raise ValueError('Mật khẩu phải chứa ít nhất 1 chữ thường')
        if not re.search(r'[0-9]', v):
            raise ValueError('Mật khẩu phải chứa ít nhất 1 số')
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    city: Optional[str] = None
    
    # Validate Phone Number
    phone_number: Optional[str] = None
    
    @field_validator('phone_number')
    def validate_phone(cls, v):
        if v and not re.match(PHONE_REGEX, v):
            raise ValueError('Số điện thoại không hợp lệ (Định dạng VN)')
        return v

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
    role: str
    

    class Config:
        from_attributes = True


class ForgetPasswordRequest(BaseModel):
    email: EmailStr