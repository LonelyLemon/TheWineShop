from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from loguru import logger
from starlette.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.routers import api_router
from src.auth.router import auth_route
from src.user.router import user_route
from src.product.router import product_router
from src.order.router import cart_router
from src.admin.router import admin_router
from src.inventory.router import inventory_router
from src.media.router import media_router
from src.ai.router import ai_router
from src.chat.router import chat_router

from src.seed_data import seed_products, seed_admin_user

THIS_DIR = Path(__file__).parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup")
    try:
        await seed_admin_user()
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
    yield

app = FastAPI(
    title="TheWineShop",
    description="A Shop Web Application for selling wine products with AI integrated",
    version="1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGINS_REGEX,
    allow_credentials=True,
    allow_methods=("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"),
    allow_headers=settings.CORS_HEADERS,
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    logger.error(f"Body data: {exc.body}")
    
    return JSONResponse(
        status_code=400,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )

#app.include_router(api_router)
app.include_router(auth_route, prefix="/api")
app.include_router(user_route, prefix="/api")
app.include_router(product_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(media_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(chat_router, prefix="/api")