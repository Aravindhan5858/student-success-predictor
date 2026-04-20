import uuid
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_professor
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import AcademicRecord, Attendance as AttendanceModel
from app.schemas.academic import (
    AcademicRecordCreate, AcademicRecordResponse, CSVUploadResponse, AttendanceCreate, AttendanceResponse
)
from app.services.csv_service import parse_academic_csv
from app.services.academic_service import create_academic_record, get_or_create_course

router = APIRouter()


def _professor(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


@router.post("/upload", response_model=CSVUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(_professor),
):
    records, errors = await parse_academic_csv(file)
    success = 0
    for rec in records:
        student = db.query(Student).filter(Student.student_id == rec["student_id"]).first()
        if not student:
            errors.append(f"Student not found: {rec['student_id']}")
            continue
        course = get_or_create_course(db, rec["course_code"])
        create_academic_record(db, AcademicRecordCreate(
            student_id=student.id,
            course_id=course.id,
            semester=rec["semester"],
            marks=rec["marks"],
            grade=rec.get("grade"),
            attendance=rec["attendance"],
        ))
        success += 1
    return CSVUploadResponse(total=len(records) + len(errors), success=success, errors=errors)


@router.get("/upload/{job_id}/status")
def upload_status(job_id: str, _: User = Depends(get_current_active_user)):
    # Placeholder for async job status (Celery integration point)
    return {"job_id": job_id, "status": "completed", "message": "Synchronous processing used"}


@router.get("/records", response_model=list[AcademicRecordResponse])
def list_records(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    student_id: uuid.UUID = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    query = db.query(AcademicRecord)
    if student_id:
        query = query.filter(AcademicRecord.student_id == student_id)
    return query.offset((page - 1) * size).limit(size).all()


@router.post("/records", response_model=AcademicRecordResponse, status_code=201)
def create_record(data: AcademicRecordCreate, db: Session = Depends(get_db), _: User = Depends(_professor)):
    return create_academic_record(db, data)


@router.get("/attendance", response_model=list[AttendanceResponse])
def list_attendance(
    student_id: uuid.UUID = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    query = db.query(AttendanceModel)
    if student_id:
        query = query.filter(AttendanceModel.student_id == student_id)
    return query.offset((page - 1) * size).limit(size).all()


@router.post("/attendance", response_model=AttendanceResponse, status_code=201)
def create_attendance(data: AttendanceCreate, db: Session = Depends(get_db), _: User = Depends(_professor)):
    record = AttendanceModel(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
