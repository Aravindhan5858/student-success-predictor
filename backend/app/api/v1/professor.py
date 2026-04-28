from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_professor
from app.models.user import User
from app.services.csv_upload_service import process_student_csv, get_sample_csv_format
from app.services.professor_student_matrix_service import build_student_matrix
from app.services.csv_service import get_sample_academic_template_csv
import io

router = APIRouter()


def _prof_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


@router.post("/upload-students")
async def upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(_prof_or_admin),
):
    result = await process_student_csv(file, db, current_user.id)
    return result


@router.get("/sample-csv", response_class=PlainTextResponse)
def get_sample_csv():
    return get_sample_csv_format()


@router.get("/sample-template")
def download_sample_template():
    content = get_sample_csv_format().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_template.csv"},
    )


@router.get("/sample-academic-template")
def download_sample_academic_template():
    content = get_sample_academic_template_csv().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=academic_template.csv"},
    )


@router.get("/student-matrix")
def student_matrix(
    page: int = 1,
    size: int = 20,
    department: str | None = None,
    risk_level: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(_prof_or_admin),
):
    return build_student_matrix(
        db=db,
        page=page,
        size=size,
        department=department,
        risk_level=risk_level,
        search=search,
    )
