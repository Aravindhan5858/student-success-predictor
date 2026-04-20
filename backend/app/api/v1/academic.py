import io
import uuid
import csv
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_professor
from app.models.user import User
from app.models.student import Student
from app.models.academic import AcademicRecord, Attendance as AttendanceModel
from app.models.upload import AcademicUpload
from app.schemas.academic import (
    AcademicRecordCreate, AcademicRecordResponse, CSVUploadResponse,
    AttendanceCreate, AttendanceResponse,
)
from app.services.academic_service import create_academic_record, get_or_create_course

router = APIRouter()

REQUIRED_COLS = {"student_id", "course_code", "semester", "marks", "internal", "external", "attendance"}


def _professor(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


# ── existing routes ────────────────────────────────────────────────────────────

@router.post("/upload", response_model=CSVUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_csv_legacy(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(_professor),
):
    from app.services.csv_service import parse_academic_csv
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


# ── new routes ─────────────────────────────────────────────────────────────────

def _parse_csv_bytes(content: bytes) -> tuple[list[dict], list[str]]:
    """Parse CSV bytes, validate required columns, return (rows, errors)."""
    text = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return [], ["Empty or unreadable CSV file"]

    missing = REQUIRED_COLS - {f.strip().lower() for f in reader.fieldnames}
    if missing:
        return [], [f"Missing required columns: {', '.join(sorted(missing))}"]

    rows, errors = [], []
    for i, row in enumerate(reader, start=2):  # row 1 = header
        try:
            rows.append({
                "student_id": row["student_id"].strip(),
                "course_code": row["course_code"].strip(),
                "semester": int(row["semester"]),
                "marks": float(row["marks"]),
                "internal": float(row["internal"]),
                "external": float(row["external"]),
                "attendance": float(row["attendance"]),
            })
        except (ValueError, KeyError) as exc:
            errors.append(f"Row {i}: {exc}")
    return rows, errors


@router.post("/upload-csv")
async def upload_csv_v2(
    file: UploadFile = File(...),
    preview: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(_professor),
):
    content = await file.read()
    rows, errors = _parse_csv_bytes(content)

    if preview:
        return {"preview": True, "total": len(rows), "errors": errors, "data": rows[:50]}

    # commit mode
    saved, save_errors = 0, list(errors)
    for rec in rows:
        student = db.query(Student).filter(Student.student_id == rec["student_id"]).first()
        if not student:
            save_errors.append(f"Student not found: {rec['student_id']}")
            continue
        course = get_or_create_course(db, rec["course_code"])
        create_academic_record(db, AcademicRecordCreate(
            student_id=student.id,
            course_id=course.id,
            semester=rec["semester"],
            marks=rec["marks"],
            grade=None,
            attendance=rec["attendance"],
        ))
        saved += 1

    report = {
        "total_rows": len(rows),
        "saved": saved,
        "errors": save_errors,
    }
    upload = AcademicUpload(
        professor_id=current_user.id,
        file_url=file.filename,
        status="completed" if not save_errors else "partial",
        report_json=report,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {"upload_id": str(upload.id), **report}


@router.get("/report/{upload_id}")
def get_upload_report(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(_professor),
):
    upload = db.query(AcademicUpload).filter(AcademicUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if upload.professor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your upload")
    return {"upload_id": str(upload.id), "status": upload.status, "report": upload.report_json, "created_at": upload.created_at}


@router.get("/uploads")
def list_uploads(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(_professor),
):
    q = db.query(AcademicUpload).filter(AcademicUpload.professor_id == current_user.id)
    total = q.count()
    items = q.order_by(AcademicUpload.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {
        "total": total,
        "page": page,
        "items": [
            {"id": str(u.id), "file_url": u.file_url, "status": u.status, "created_at": u.created_at}
            for u in items
        ],
    }
