import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from loguru import logger

from src.core.aws import s3_client
from src.core.config import settings
from src.auth.dependencies import get_current_user
from src.user.schemas import UserResponse

media_router = APIRouter(
    prefix="/media",
    tags=["Media"]
)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

def validate_image_extension(filename: str):
    parts = filename.split(".")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ")
    extension = parts[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Chỉ hỗ trợ định dạng: {', '.join(ALLOWED_EXTENSIONS)}")
    return extension

@media_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    extension = validate_image_extension(file.filename)
    
    random_id = str(uuid.uuid4())
    s3_key = f"uploads/{current_user.id}/{random_id}.{extension}"
    
    try:
        await file.seek(0)
        
        logger.info(f"--- START UPLOAD ---")
        logger.info(f"Target Bucket: {settings.S3_BUCKET_NAME}")
        logger.info(f"Target Region: {settings.S3_REGION}")
        logger.info(f"Target Key: {s3_key}")
        
        # Upload lên S3
        s3_client.upload_fileobj(
            file_obj=file.file,
            s3_key=s3_key,
            content_type=file.content_type
        )
        
        # Tạo Presigned URL
        url = s3_client.get_presigned_url(s3_key, expiration=3600 * 24 * 7)
        
        return {
            "message": "Upload thành công",
            "file_name": file.filename,
            "s3_key": s3_key,
            "url": url
        }
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống: Không thể tải ảnh lên.")