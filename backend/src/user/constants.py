from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    CUSTOMER = "customer"
    STOCK_MANAGER = "stock_manager"

class UserStatus(StrEnum):
    ACTIVE = "active"
    BANNED = "banned"