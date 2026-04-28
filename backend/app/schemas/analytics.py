from typing import Any, Dict, List
from pydantic import BaseModel


class PerformanceStats(BaseModel):
    average_cgpa: float
    average_attendance: float
    total_students: int
    passing_rate: float
    department_breakdown: List[Dict[str, Any]] = []


class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    total: int
    low_pct: float
    medium_pct: float
    high_pct: float


class AttendanceTrend(BaseModel):
    period: str
    average_attendance: float
    total_records: int


class DashboardSummary(BaseModel):
    total_students: int
    total_professors: int
    total_assessments: int
    total_interviews: int
    risk_distribution: RiskDistribution
    recent_uploads: int
    average_cgpa: float
    average_attendance: float
