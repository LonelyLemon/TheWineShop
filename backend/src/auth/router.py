from fastapi import Depends, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.future import select
from jose import JWTError

from src.core.database import SessionDep
from src.core.exceptions import NotAuthenticated
from src.core.security import verify_password
from src.auth.security import (
    create_access_token,
    create_refresh_token,
    decode_token
)
from src.auth.exceptions import (
    InvalidToken,
    InvalidPassword
)
from src.user.exceptions import UserNotFound
from src.user.models import User


auth_route = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

#-------------------------------
#         LOGIN ROUTE
#-------------------------------w

@auth_route.post('/login')
async def login(db: SessionDep, 
                login_request: OAuth2PasswordRequestForm = Depends()):
    email = login_request.username.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFound()
    if not verify_password(login_request.password, user.hashed_password):
        raise InvalidPassword()

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }