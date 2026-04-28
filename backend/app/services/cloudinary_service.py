from typing import Dict
import logging
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from app.config import settings

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_file(file: UploadFile, folder: str = "student-success", resource_type: str = "auto", public_id_override: str = None) -> Dict[str, str]:
    try:
        content = await file.read()
        
        # Sanitize filename for public_id (remove special chars, keep only alphanumeric and dash/underscore)
        import re
        import time
        
        if public_id_override:
            safe_public_id = re.sub(r'[^a-zA-Z0-9_-]', '', public_id_override)
        else:
            safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '', file.filename or 'file')
            name_part = safe_filename.rsplit('.', 1)[0] if '.' in safe_filename else safe_filename
            safe_public_id = name_part if name_part else f"upload_{int(time.time())}"
        
        # Build upload params with account compatibility settings
        upload_params = {
            "folder": folder,
            "resource_type": resource_type,
            "overwrite": False,  # Prevent overwrite issues with untrusted accounts
            "public_id": safe_public_id,
            "invalidate": False,  # Don't invalidate CDN cache
            "use_filename": False,  # Use our generated public_id instead
            "unique_filename": True,  # Auto-append suffix if duplicate
        }
        
        result = cloudinary.uploader.upload(content, **upload_params)
        logger.info(f"Successfully uploaded file to Cloudinary: {result['public_id']}")
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    
    except cloudinary.exceptions.Error as e:
        error_msg = str(e)
        logger.error(f"Cloudinary API error: {error_msg}")
        
        # Handle specific Cloudinary errors
        if "untrusted" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cloudinary account needs verification. Please: 1) Verify email at https://cloudinary.com/console, 2) Regenerate API Key in Settings > Security, 3) Update environment variables, 4) Restart server."
            )
        elif "invalid" in error_msg.lower() and "api" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Cloudinary credentials. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file."
            )
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Cloudinary quota or rate limit exceeded. Please try again later."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {error_msg}"
            )
    except Exception as e:
        logger.error(f"Unexpected upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


def delete_file(public_id: str) -> None:
    """Delete a file from Cloudinary by public_id."""
    try:
        cloudinary.uploader.destroy(public_id)
        logger.info(f"Successfully deleted file: {public_id}")
    except cloudinary.exceptions.Error as e:
        error_msg = str(e)
        logger.error(f"Cloudinary delete error: {error_msg}")
        if "untrusted" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cloudinary account verification required for delete operations."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Delete failed: {error_msg}"
            )
    except Exception as e:
        logger.error(f"Unexpected delete error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )
