from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_admin, require_professor
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.analytics import DashboardSummary, RiskDistribution, PerformanceStats, AttendanceTrend
from app.services.analytics_service import (
    get_dashboard_summary, get_risk_distribution, get_performance_trends, get_attendance_trends
)

router = APIRouter()


def _admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_admin(current_user)


def _prof_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db), _: User = Depends(_admin)):
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
