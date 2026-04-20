import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_admin, require_professor
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import AcademicRecord
from app.schemas.student import StudentUpdate, StudentResponse, StudentDetailResponse
from app.services.prediction_service import predict_risk_level, get_recommendations

router = APIRouter()


def _prof_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


@router.get("/me", response_model=StudentDetailResponse)
def get_my_profile(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    records = db.query(AcademicRecord).filter(AcademicRecord.student_id == student.id).all()
    return StudentDetailResponse.model_validate({**student.__dict__, "academic_records": records})


@router.get("", response_model=list[StudentResponse])
def list_students(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    department: str = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(_prof_or_admin),
):
    query = db.query(Student)
    if department:
        query = query.filter(Student.department == department)
    return query.offset((page - 1) * size).limit(size).all()


@router.get("/{student_id}", response_model=StudentDetailResponse)
def get_student(student_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    records = db.query(AcademicRecord).filter(AcademicRecord.student_id == student.id).all()
    return StudentDetailResponse.model_validate({**student.__dict__, "academic_records": records})


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: uuid.UUID, data: StudentUpdate, db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@router.get("/{student_id}/performance")
def get_performance(student_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    records = db.query(AcademicRecord).filter(AcademicRecord.student_id == student.id).all()
    return {
        "student_id": str(student.id),
        "cgpa": student.cgpa,
        "attendance_pct": student.attendance_pct,
        "records_count": len(records),
        "records": [{"semester": r.semester, "marks": r.marks, "grade": r.grade, "attendance": r.attendance} for r in records],
    }


@router.get("/{student_id}/risk")
def get_risk(student_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    data = {"cgpa": student.cgpa, "attendance_pct": student.attendance_pct}
    risk = predict_risk_level(data)
    recommendations = get_recommendations(data)
    # Update stored risk level
    student.risk_level = risk
    db.commit()
    return {"student_id": str(student.id), "risk_level": risk.value, "recommendations": recommendations}
