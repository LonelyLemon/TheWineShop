from loguru import logger

from sqlalchemy.future import select

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi_mail import MessageSchema, MessageType

from src.core.database import SessionDep
from src.core.security import hash_password
from src.core.config import settings
from src.core.email_service import email_service_basic
from src.auth.security import create_verify_token, decode_token, generate_reset_otp
from src.auth.exceptions import InvalidToken
from src.auth.dependencies import get_current_user
from src.user.models import User
from src.user.schemas import (
    UserCreate, 
    UserResponse,
    UserUpdate,
    ForgetPasswordRequest,
    ResendVerificationRequest,
)
from src.user.exceptions import (
    UserEmailExist,
    UserNotFound
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
                   db: SessionDep,
                   background_tasks: BackgroundTasks):
    # Create new User
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
        city = user.city,
        email_verified = False
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Send Verification Email
    verify_token = create_verify_token(email_norm)
    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"

    logger.info(f"--- DEV MODE VERIFICATION LINK ---")
    logger.info(f"Click here to verify: {verify_link}")
    logger.info(f"----------------------------------")

    html_content = f"""
    <h1>Chào mừng {new_user.last_name} đến với TheWineShop!</h1>
    <p>Vui lòng click vào đường dẫn sau để xác thực tài khoản:</p>
    <a href="{verify_link}">Xác thực ngay</a>
    <p>Link này sẽ hết hạn sau 24 giờ.</p>
    """

    message = MessageSchema(
        subject="TheWineShop - Xác thực tài khoản đăng ký",
        recipients=[new_user.email],
        body=html_content,
        subtype=MessageType.html,
    )
    
    background_tasks.add_task(email_service_basic.send_mail, message)

    return new_user

#-------------------------------
#      VERIFY EMAIL ROUTE
#-------------------------------

@user_route.get('/verify-email')
async def verify_email(token: str,
                       db: SessionDep):
    try:
        payload = decode_token(token)

        if payload.get("type") != "verification":
            raise InvalidToken()
        email = payload.get("sub")
        if not email:
            raise InvalidToken()

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise UserNotFound()
        if user.email_verified:
            return {
                "message": "Your account have already been verified."
            }

        user.email_verified = True
        db.add(user)
        await db.commit()

        return {
            "message": "Your email is verified successfully !"
        }

    except Exception:
        raise InvalidToken()

#-------------------------------
#        GET USER INFO
#-------------------------------

@user_route.get('/me', response_model=UserResponse)
async def get_user_info(current_user: UserResponse = Depends(get_current_user)):
    return current_user

#-------------------------------
#        UPDATE USER
#-------------------------------

@user_route.post('/update-user', response_model=UserResponse)
async def update_user(db: SessionDep, 
                      update_request: UserUpdate, 
                      current_user: UserResponse = Depends(get_current_user)):
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()
    update_data = update_request.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user

#-------------------------------
#       FORGET PASSWORD
#-------------------------------

@user_route.post('/forget-password')
async def forget_password(db: SessionDep,
                          payload: ForgetPasswordRequest,
                          background_tasks: BackgroundTasks):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFound()
    
    reset_token = generate_reset_otp()
    reset_link = f"{settings.FRONTEND_URL}/forget-password?token={reset_token}"

    logger.info(f"--- DEV MODE RESET PASSWORD LINK ---")
    logger.info(f"Link: {reset_link}")
    logger.info(f"------------------------------------")

    html_content = f"""
    <h1>Chào mừng {user.last_name} đến với TheWineShop!</h1>
    <p>Vui lòng click vào đường dẫn sau để đặt lại mật khẩu:</p>
    <a href="{reset_link}">Đổi mật khẩu</a>
    <p>Link này sẽ hết hạn sau 24 giờ.</p>
    """

    message = MessageSchema(
        subject="TheWineShop - Quên mật khẩu",
        recipients=[user.email],
        body=html_content,
        subtype=MessageType.html,
    )
    
    background_tasks.add_task(email_service_basic.send_mail, message)

#------------------------------------------
#       RESEND VERIFICATION REQUEST
#------------------------------------------

@user_route.post('/resend-verification')
async def resend_verification(
    payload: ResendVerificationRequest,
    db: SessionDep,
    background_tasks: BackgroundTasks
):
    email_norm = payload.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email_norm))
    user = result.scalar_one_or_none()

    if not user:
        raise UserNotFound()

    if user.email_verified:
        return {"message": "Tài khoản này đã được xác thực trước đó."}

    verify_token = create_verify_token(email_norm)
    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"

    logger.info(f"--- DEV MODE RESEND VERIFICATION LINK ---")
    logger.info(f"Link: {verify_link}")
    logger.info(f"---------------------------------------")

    html_content = f"""
    <h1>Xin chào {user.last_name},</h1>
    <p>Bạn đã yêu cầu gửi lại email xác thực tài khoản tại TheWineShop.</p>
    <p>Vui lòng click vào đường dẫn sau để kích hoạt tài khoản:</p>
    <a href="{verify_link}" style="background-color: #800020; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xác thực ngay</a>
    <p>Link này sẽ hết hạn sau 24 giờ.</p>
    """

    message = MessageSchema(
        subject="TheWineShop - Gửi lại xác thực tài khoản",
        recipients=[user.email],
        body=html_content,
        subtype=MessageType.html,
    )
    
    background_tasks.add_task(email_service_basic.send_mail, message)

    return {"message": "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư."}