from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_active_user, require_admin, require_professor
from app.models.user import User
from app.models.audit import AuditLog
from app.models.student import Student, Course
from app.models.academic import AcademicRecord
from app.models.profile import StudentMetrics
from app.schemas.analytics import DashboardSummary, RiskDistribution, PerformanceStats, AttendanceTrend
from app.services.analytics_service import (
    get_dashboard_summary, get_risk_distribution, get_performance_trends, get_attendance_trends
)

router = APIRouter()


def _admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_admin(current_user)


def _prof_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


# ── existing routes ────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    return get_dashboard_summary(db)


@router.get("/performance")
def performance(department: str = Query(None), db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    filters = {"department": department} if department else {}
    return get_performance_trends(db, filters)


@router.get("/risk-distribution", response_model=RiskDistribution)
def risk_distribution(db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    return get_risk_distribution(db)


@router.get("/attendance-trends", response_model=list[AttendanceTrend])
def attendance_trends(db: Session = Depends(get_db), _: User = Depends(_prof_or_admin)):
    return get_attendance_trends(db)


@router.get("/audit-logs")
def audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    total = db.query(AuditLog).count()
    items = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {
        "items": [
            {"id": str(i.id), "user_id": str(i.user_id), "action": i.action, "resource": i.resource,
             "resource_id": i.resource_id, "ip_address": i.ip_address, "created_at": i.created_at.isoformat()}
            for i in items
        ],
        "total": total, "page": page, "size": size,
    }


# ── new routes ─────────────────────────────────────────────────────────────────

@router.get("/students")
def student_performance_list(
    course: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(_prof_or_admin),
):
    """Filtered student performance list with avg marks."""
    q = (
        db.query(
            Student.student_id,
            Student.department,
            Student.cgpa,
            Student.attendance_pct,
            Student.risk_level,
            func.avg(AcademicRecord.marks).label("avg_marks"),
        )
        .outerjoin(AcademicRecord, AcademicRecord.student_id == Student.id)
        .outerjoin(Course, Course.id == AcademicRecord.course_id)
        .group_by(Student.id)
    )

    if department:
        q = q.filter(Student.department == department)
    if semester:
        q = q.filter(AcademicRecord.semester == semester)
    if course:
        q = q.filter(Course.code == course)

    total = q.count()
    rows = q.offset((page - 1) * size).limit(size).all()

    return {
        "total": total,
        "page": page,
        "items": [
            {
                "student_id": r.student_id,
                "department": r.department,
                "cgpa": r.cgpa,
                "attendance_pct": r.attendance_pct,
                "risk_level": r.risk_level,
                "avg_marks": round(r.avg_marks, 2) if r.avg_marks is not None else None,
            }
            for r in rows
        ],
    }


@router.get("/heatmap")
def marks_heatmap(
    semester: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(_prof_or_admin),
):
    """Returns student × course marks matrix for heatmap visualisation."""
    q = (
        db.query(Student.student_id, Course.code, AcademicRecord.marks)
        .join(AcademicRecord, AcademicRecord.student_id == Student.id)
        .join(Course, Course.id == AcademicRecord.course_id)
    )
    if semester:
        q = q.filter(AcademicRecord.semester == semester)
    if department:
        q = q.filter(Student.department == department)

    rows = q.all()

    # Build ordered unique lists
    student_set: dict[str, int] = {}
    course_set: dict[str, int] = {}
    for sid, code, _ in rows:
        student_set.setdefault(sid, len(student_set))
        course_set.setdefault(code, len(course_set))

    students = list(student_set)
    courses = list(course_set)

    # Fill matrix with None as default
    matrix: list[list] = [[None] * len(courses) for _ in students]
    for sid, code, marks in rows:
        matrix[student_set[sid]][course_set[code]] = marks

    return {"students": students, "courses": courses, "matrix": matrix}


@router.get("/weak-areas")
def weak_areas(
    db: Session = Depends(get_db),
    _: User = Depends(_prof_or_admin),
):
    """Aggregate weak areas across all student_metrics records."""
    metrics = db.query(StudentMetrics.weaknesses).all()

    counts: dict[str, int] = defaultdict(int)
    for (weaknesses,) in metrics:
        if isinstance(weaknesses, list):
            for item in weaknesses:
                if item:
                    counts[str(item)] += 1

    sorted_areas = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return {
        "weak_areas": [{"area": area, "count": count} for area, count in sorted_areas]
    }
