import os
import urllib.parse

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException
from loguru import logger

from src.core.config import settings
from src.core.constants import S3ClientMethod
from src.utils.others import run_in_executor


class S3Client:
    def __init__(self, 
                 bucket_name:str, 
                 access_key:str, 
                 secret_key:str, 
                 endpoint_url: str | None=None, 
                 region_name:str='us-east-1'):
        self.bucket_name = bucket_name
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region_name,
            endpoint_url=endpoint_url
        )
        self.ensure_bucket_exists()

    def ensure_bucket_exists(self):
        try:
            self.s3.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            # Code lỗi trả về thường là string "404"
            error_code = int(e.response["Error"]["Code"])
            if error_code == 404:
                try:
                    # Chuẩn bị tham số tạo bucket
                    params = {'Bucket': self.bucket_name}
                    
                    if self.s3.meta.region_name != 'us-east-1':
                        params['CreateBucketConfiguration'] = {
                            'LocationConstraint': self.s3.meta.region_name
                        }
                    
                    self.s3.create_bucket(**params)
                    logger.info(f"Created bucket {self.bucket_name}")
                    
                except ClientError as create_error:
                    # Kiểm tra lỗi race condition
                    c_code = create_error.response.get("Error", {}).get("Code")
                    if c_code in ["BucketAlreadyOwnedByYou", "OperationAborted"]:
                        # Bucket đã được tạo bởi process khác, bỏ qua lỗi
                        logger.info(f"Bucket {self.bucket_name} already exists or is being created concurrently.")
                    else:
                        # Nếu là lỗi khác thì vẫn raise lên
                        logger.error(f"Failed to create bucket: {create_error}")
                        raise
            elif error_code == 403:
                raise HTTPException(status_code=403, detail="Access denied to bucket")
            else:
                raise
    
    @run_in_executor
    def upload_file(self, local_path, s3_key):
        try:
            self.s3.upload_fileobj(local_path, self.bucket_name, s3_key)
            logger.info(f"Uploaded to {s3_key}")
        except Exception as e:
            logger.info(f"Error uploading file: {e}")

    def upload_fileobj(self, file_obj, s3_key: str, content_type: str = None):
        """
        Upload file trực tiếp từ bộ nhớ (stream) lên S3.
        Thường dùng cho FastAPI UploadFile.
        """
        try:
            extra_args = {'ContentType': content_type} if content_type else {}
            self.s3.upload_fileobj(file_obj, self.bucket_name, s3_key, ExtraArgs=extra_args)
            logger.info(f"Uploaded stream to {s3_key}")
            return s3_key
        except Exception as e:
            logger.error(f"Error uploading file object: {e}")
            raise e

    @run_in_executor
    def download_file(self, s3_key, local_path):
        try:
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            self.s3.download_file(self.bucket_name, s3_key, local_path)
            logger.info(f"Downloaded {s3_key} to {local_path}")
        except Exception as e:
            logger.info(f"Error downloading file: {e}")

    def get_presigned_url(self, 
                          s3_key:str, 
                          expiration:int=3600, 
                          method:S3ClientMethod=S3ClientMethod.GET):
        try:
            url = self.s3.generate_presigned_url(
                ClientMethod=method,
                Params={"Bucket": self.bucket_name, 
                        "Key": s3_key,
                        },
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.info(f"Error generating presigned URL: {e}")
            return None
        
    def get_presigned_url_inline(self, 
                                 s3_key:str, 
                                 expiration:int=3600, 
                                 method:S3ClientMethod=S3ClientMethod.GET):
        try:
            file_name = s3_key.split("/")[1]
            disposition = f'inline; filename="{file_name}"'
            encoded_disposition = urllib.parse.quote(disposition, safe="")
            url = self.s3.generate_presigned_url(
                ClientMethod=method,
                Params={"Bucket": self.bucket_name, 
                        "Key": s3_key,
                        "ResponseContentType": "application/pdf",
                        "ResponseContentDisposition": encoded_disposition,
                        },
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.info(f"Error generating presigned URL: {e}")
            return None

if settings.ENVIRONMENT.is_testing:
    s3_client = S3Client(bucket_name=settings.S3_BUCKET_NAME,
                         access_key=settings.S3_ACCESS_KEY,
                         secret_key=settings.S3_SECRET_KEY,
                         region_name=settings.S3_REGION)
else:
    s3_client = S3Client(bucket_name=settings.S3_BUCKET_NAME,
                         access_key=settings.S3_ACCESS_KEY,
                         secret_key=settings.S3_SECRET_KEY,
                         region_name=settings.S3_REGION)