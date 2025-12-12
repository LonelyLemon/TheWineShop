import asyncio
import sys

from pathlib import Path
from sqlalchemy import select
from src.core.database import SessionLocal
from src.user.models import User


sys.path.insert(0, str(Path(__file__).parent.parent))

async def promote_user(email: str):
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"User {email} not found!")
            return

        user.role = "admin"
        await db.commit()
        print(f"User {email} is now an ADMIN!")

if __name__ == "__main__":
    email_input = input("Nhập email muốn set quyền Admin: ")
    asyncio.run(promote_user(email_input))