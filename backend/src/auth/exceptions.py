from fastapi import HTTPException, status


class InvalidToken(HTTPException):
    def __init__(self):
        super().__init__(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"}
        )


class InvalidPassword(HTTPException):
    def __init__(self):
        super().__init__(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "Mật khẩu không chính xác"
        )


class UserNotVerified(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản chưa được xác thực email. Vui lòng kiểm tra email của bạn.",
        )