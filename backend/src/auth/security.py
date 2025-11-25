import time, secrets

from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

from src.core.config import settings
from src.core.exceptions import NotAuthenticated
from src.auth.exceptions import InvalidToken

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire, 
        "type": "access"
    })
    jwt_token_encoded = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.SECURITY_ALGORITHM)
    return jwt_token_encoded


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRES)
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    jwt_token_encoded = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.SECURITY_ALGORITHM)
    return jwt_token_encoded


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.SECURITY_ALGORITHM])
        return payload
    except JWTError:
        raise NotAuthenticated()
    

def generate_reset_otp() -> str:
    """Tạo OTP 6 số cho password reset"""
    return f"{secrets.randbelow(1000000):06d}"