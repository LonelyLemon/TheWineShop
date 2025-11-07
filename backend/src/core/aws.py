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
            error_code = int(e.response["Error"]["Code"])
            if error_code == 404:
                self.s3.create_bucket(Bucket=self.bucket_name)
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
                         endpoint_url=settings.MINIO_URL)
else:
    s3_client = S3Client(bucket_name=settings.S3_BUCKET_NAME,
                         access_key=settings.S3_ACCESS_KEY,
                         secret_key=settings.S3_SECRET_KEY)
    