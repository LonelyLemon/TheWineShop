from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from loguru import logger

from src.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USER,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_HOST,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


class EmailService:
    def __init__(self, config: ConnectionConfig):
        self.config = config
        self._instance: FastMail = FastMail(self.config)
        self.RETRY_NUM = 2

    async def send_mail(self, message: MessageSchema):
        _c = self.RETRY_NUM
        while _c > 0:
            try:
                await self._instance.send_message(message=message)
                return
            except Exception as e:
                _c -= 1
                logger.error(str(e))
        logger.exception(
            f"Error mail service. Cannot send email to {','.join(message.recipients)}"
        )


email_service_basic = EmailService(config=conf)