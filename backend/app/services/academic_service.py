from sqlalchemy.orm import Session
from app.models.academic import AcademicRecord
from app.models.student import Student, Course
from app.schemas.academic import AcademicRecordCreate


def create_academic_record(db: Session, data: AcademicRecordCreate) -> AcademicRecord:
    record = AcademicRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_or_create_course(db: Session, code: str, name: str = None) -> Course:
    course = db.query(Course).filter(Course.code == code).first()
    if not course:
        course = Course(code=code, name=name or code)
        db.add(course)
        db.commit()
        db.refresh(course)
    return course
