from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.future import select

from src.core.database import SessionDep
from src.core.exceptions import NotAuthenticated
from src.user.models import User
from src.user.exceptions import UserNotFound
from src.auth.security import decode_token
from src.auth.exceptions import InvalidToken


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(db: SessionDep,
                           cred: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not cred or cred.scheme.lower() != "bearer":
        raise NotAuthenticated()
    
    token = cred.credentials

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise InvalidToken()
    
    email = payload.get("sub")
    if not email:
        raise InvalidToken()
    
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise UserNotFound()
    
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Bạn không có quyền thực hiện thao tác này"
            )
        return user


allow_admin = RoleChecker(["admin"])
allow_staff = RoleChecker(["admin", "stock_manager"])