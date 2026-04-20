from typing import Dict
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_file(file: UploadFile, folder: str = "student-success", resource_type: str = "auto") -> Dict[str, str]:
    try:
        content = await file.read()
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            resource_type=resource_type,
            public_id=f"{folder}/{file.filename}",
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Upload failed: {str(e)}")


def delete_file(public_id: str) -> None:
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Delete failed: {str(e)}")
