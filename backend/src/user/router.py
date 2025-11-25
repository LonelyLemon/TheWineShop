from fastapi import APIRouter, Depends
from sqlalchemy.future import select

from src.core.database import SessionDep
from src.core.security import hash_password
from src.user.models import User
from src.user.schemas import (
    UserCreate, 
    UserResponse, 
    UserUpdate
)
from src.user.exceptions import (
    UserEmailExist
)


user_route = APIRouter(
    prefix="/users",
    tags=["User"]
)

#-------------------------------
#        REGISTER ROUTE
#-------------------------------

@user_route.post('/register', response_model=UserResponse)
async def register(user: UserCreate, 
                   db: SessionDep):
    email_norm = user.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email_norm))
    existed_user = result.scalar_one_or_none()
    if existed_user:
        raise UserEmailExist()
    
    hashed_password = hash_password(user.password)
    new_user = User(
        first_name = user.first_name,
        last_name = user.last_name,
        middle_name = user.middle_name,
        email = email_norm,
        hashed_password = hashed_password,
        city = user.city
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

#-------------------------------
#        GET USER INFO
#-------------------------------

#-------------------------------
#        UPDATE USER
#-------------------------------

#-------------------------------
#       FORGET PASSWORD
#-------------------------------