from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.student import Student
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate


def _generate_student_id(user: User) -> str:
    # Deterministic and unique enough for this system; fits within varchar(50).
    return f"STU-{str(user.id).replace('-', '').upper()}"


def ensure_student_profile(db: Session, user: User, auto_commit: bool = False) -> Student:
    if user.id is None:
        db.flush()

    student = db.query(Student).filter(Student.user_id == user.id).first()
    if student:
        return student

    student = Student(
        user_id=user.id,
        student_id=_generate_student_id(user),
    )
    db.add(student)
    db.flush()

    if auto_commit:
        db.commit()
        db.refresh(student)

    return student


def create_user(db: Session, data: UserCreate) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)

    if data.role == UserRole.student:
        ensure_student_profile(db, user)

    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    if user.role == UserRole.student:
        ensure_student_profile(db, user)

    db.commit()
    db.refresh(user)
    return user


def soft_delete_user(db: Session, user: User) -> User:
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
