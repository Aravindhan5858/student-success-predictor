from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.csv_upload_service import process_student_csv, get_sample_csv_format

router = APIRouter()


@router.post("/upload-students")
async def upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["professor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await process_student_csv(file, db, current_user.id)
    return result


@router.get("/sample-csv", response_class=PlainTextResponse)
def get_sample_csv():
    return get_sample_csv_format()
