from collections import Counter
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.user import User
from app.models.mentorship import MentorshipRequest
from app.models.extended import CorrectionRequest, InterviewApplication


def _derive_status(
    student_id: Any,
    pending_corrections: set[Any],
    pending_mentorship: set[Any],
    accepted_mentorship: set[Any],
    interview_applied: set[Any],
) -> str:
    if student_id in accepted_mentorship or student_id in interview_applied:
        return "accepted"
    if student_id in pending_corrections or student_id in pending_mentorship:
        return "pending"
    return "none"


def build_student_matrix(
    db: Session,
    page: int,
    size: int,
    department: str | None = None,
    risk_level: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    query = select(Student)
    if department:
        query = query.where(Student.department == department)
    if risk_level:
        query = query.where(Student.risk_level == risk_level)
    if search:
        pattern = f"%{search}%"
        query = query.join(User, User.id == Student.user_id).where(
            (Student.student_id.ilike(pattern)) | (User.full_name.ilike(pattern)) | (User.email.ilike(pattern))
        )

    students = db.scalars(query).all()
    total = len(students)
    students_page = students[(page - 1) * size: page * size]

    users = {
        u.id: u
        for u in db.scalars(
            select(User).where(User.id.in_([s.user_id for s in students_page]))
        ).all()
    }

    pending_corrections = set(
        db.scalars(
            select(CorrectionRequest.student_id).where(CorrectionRequest.status == "pending")
        ).all()
    )
    pending_mentorship_students = set(
        db.scalars(
            select(Student.id)
            .join(User, User.id == Student.user_id)
            .join(MentorshipRequest, MentorshipRequest.from_user_id == User.id)
            .where(MentorshipRequest.status == "pending")
        ).all()
    )
    accepted_mentorship_students = set(
        db.scalars(
            select(Student.id)
            .join(User, User.id == Student.user_id)
            .join(MentorshipRequest, MentorshipRequest.from_user_id == User.id)
            .where(MentorshipRequest.status == "approved")
        ).all()
    )
    interview_applied_students = set(
        db.scalars(select(InterviewApplication.student_id)).all()
    )

    items = []
    for s in students_page:
        user = users.get(s.user_id)
        status = _derive_status(
            s.id,
            pending_corrections,
            pending_mentorship_students,
            accepted_mentorship_students,
            interview_applied_students,
        )
        items.append(
            {
                "id": str(s.id),
                "user_id": str(s.user_id),
                "full_name": user.full_name if user else None,
                "email": user.email if user else None,
                "student_id": s.student_id,
                "department": s.department,
                "year": s.year,
                "semester": s.semester,
                "cgpa": s.cgpa,
                "attendance_pct": s.attendance_pct,
                "risk_level": getattr(s.risk_level, "value", s.risk_level),
                "request_status": status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
        )

    counts = Counter(i["request_status"] for i in items)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size if size else 1,
        "status_counts": {
            "pending": counts.get("pending", 0),
            "accepted": counts.get("accepted", 0),
            "none": counts.get("none", 0),
        },
    }
