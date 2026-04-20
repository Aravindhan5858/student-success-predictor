from typing import Any, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserRole
from app.models.student import Student, RiskLevel
from app.models.academic import AcademicRecord
from app.models.assessment import Assessment
from app.models.interview import InterviewSession
from app.schemas.analytics import DashboardSummary, RiskDistribution, PerformanceStats, AttendanceTrend


def get_risk_distribution(db: Session) -> RiskDistribution:
    counts = db.query(Student.risk_level, func.count(Student.id)).group_by(Student.risk_level).all()
    dist = {r.value: 0 for r in RiskLevel}
    for risk, count in counts:
        dist[risk.value] = count
    total = sum(dist.values())
    return RiskDistribution(
        low=dist["low"], medium=dist["medium"], high=dist["high"], total=total,
        low_pct=round(dist["low"] / total * 100, 1) if total else 0.0,
        medium_pct=round(dist["medium"] / total * 100, 1) if total else 0.0,
        high_pct=round(dist["high"] / total * 100, 1) if total else 0.0,
    )


def get_dashboard_summary(db: Session) -> DashboardSummary:
    total_students = db.query(func.count(Student.id)).scalar() or 0
    total_professors = db.query(func.count(User.id)).filter(User.role == UserRole.professor).scalar() or 0
    total_assessments = db.query(func.count(Assessment.id)).scalar() or 0
    total_interviews = db.query(func.count(InterviewSession.id)).scalar() or 0
    avg_cgpa = db.query(func.avg(Student.cgpa)).scalar() or 0.0
    avg_attendance = db.query(func.avg(Student.attendance_pct)).scalar() or 0.0
    risk_dist = get_risk_distribution(db)
    return DashboardSummary(
        total_students=total_students,
        total_professors=total_professors,
        total_assessments=total_assessments,
        total_interviews=total_interviews,
        risk_distribution=risk_dist,
        recent_uploads=0,
        average_cgpa=round(float(avg_cgpa), 2),
        average_attendance=round(float(avg_attendance), 2),
    )


def get_performance_trends(db: Session, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    query = db.query(
        Student.department,
        func.avg(Student.cgpa).label("avg_cgpa"),
        func.count(Student.id).label("count"),
    ).group_by(Student.department)
    if filters and filters.get("department"):
        query = query.filter(Student.department == filters["department"])
    rows = query.all()
    return [{"department": r.department, "avg_cgpa": round(float(r.avg_cgpa or 0), 2), "count": r.count} for r in rows]


def get_attendance_trends(db: Session, filters: Dict[str, Any] = None) -> List[AttendanceTrend]:
    query = db.query(
        AcademicRecord.semester.label("period"),
        func.avg(AcademicRecord.attendance).label("avg_attendance"),
        func.count(AcademicRecord.id).label("total"),
    ).group_by(AcademicRecord.semester).order_by(AcademicRecord.semester)
    rows = query.all()
    return [
        AttendanceTrend(period=str(r.period), average_attendance=round(float(r.avg_attendance or 0), 2), total_records=r.total)
        for r in rows
    ]
