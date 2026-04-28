from typing import List
from app.models.student import RiskLevel


def predict_risk_level(student_data: dict) -> RiskLevel:
    cgpa = student_data.get("cgpa", 0.0) or 0.0
    attendance = student_data.get("attendance_pct", 0.0) or 0.0

    if cgpa < 6.0 or attendance < 60.0:
        return RiskLevel.high
    if cgpa < 7.5 or attendance < 75.0:
        return RiskLevel.medium
    return RiskLevel.low


def get_recommendations(student_data: dict) -> List[str]:
    risk = predict_risk_level(student_data)
    cgpa = student_data.get("cgpa", 0.0) or 0.0
    attendance = student_data.get("attendance_pct", 0.0) or 0.0
    recommendations = []

    if risk == RiskLevel.high:
        recommendations.append("Immediate academic counseling recommended.")
        recommendations.append("Consider enrolling in tutoring programs.")
    if attendance < 75.0:
        recommendations.append("Improve attendance to at least 75% to avoid academic penalties.")
    if cgpa < 6.0:
        recommendations.append("Focus on core subjects and seek professor guidance.")
    if cgpa >= 7.5 and attendance >= 75.0:
        recommendations.append("Keep up the good work! Consider advanced electives.")
    if not recommendations:
        recommendations.append("Maintain current performance and explore extracurricular activities.")

    return recommendations
