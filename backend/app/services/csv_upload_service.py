import csv
import io
import pandas as pd
from typing import List, Dict
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.models.student import Student
from app.models.academic import AcademicRecord
from app.core.security import get_password_hash
import uuid


async def validate_csv(file: UploadFile) -> List[Dict]:
    filename = (file.filename or "").lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="File must be .csv or .xlsx")

    content = await file.read()
    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(content))
    else:
        decoded = content.decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(decoded))

    df.columns = [str(c).strip() for c in df.columns]
    required_fields = ["register_number", "full_name", "email", "department", "year", "semester"]
    missing = [f for f in required_fields if f not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail={"message": "Missing required fields", "fields": missing})

    return df.fillna("").to_dict(orient="records")


async def process_student_csv(file: UploadFile, db: Session, professor_id: uuid.UUID):
    data = await validate_csv(file)
    
    created = 0
    updated = 0
    errors = []

    for idx, row in enumerate(data, start=2):
        try:
            user = db.scalar(select(User).where(User.email == row['email']))
            
            if not user:
                user = User(
                    email=row['email'],
                    full_name=row['full_name'],
                    hashed_password=get_password_hash(row['register_number']),
                    role="student",
                    is_active=True
                )
                db.add(user)
                db.flush()

                student = Student(
                    user_id=user.id,
                    student_id=str(row['register_number']).strip(),
                    department=str(row['department']).strip() or None,
                    year=int(row['year']),
                    semester=int(row['semester']),
                    cgpa=float(row.get('cgpa') or 0.0),
                    attendance_pct=float(row.get('attendance') or 0.0)
                )
                db.add(student)
                created += 1
            else:
                student = db.scalar(select(Student).where(Student.user_id == user.id))
                if student:
                    student.department = str(row['department']).strip() or None
                    student.year = int(row['year'])
                    student.semester = int(row['semester'])
                    if 'cgpa' in row and str(row['cgpa']).strip() != "":
                        student.cgpa = float(row['cgpa'])
                    if 'attendance' in row and str(row['attendance']).strip() != "":
                        student.attendance_pct = float(row['attendance'])
                    updated += 1

        except Exception as e:
            reg = row.get("register_number", "unknown")
            errors.append(f"Row {idx} ({reg}): {str(e)}")

    db.commit()
    
    return {
        "created": created,
        "updated": updated,
        "errors": errors,
        "total_rows": len(data),
        "status": "success" if not errors else ("partial" if (created + updated) > 0 else "failed"),
    }


def get_sample_csv_format() -> str:
    return """register_number,full_name,email,department,year,semester,cgpa,attendance,internal_marks,semester_marks,credits
2021CS001,John Doe,john@example.com,CSE,3,5,8.5,85,45,78,4
2021CS002,Jane Smith,jane@example.com,CSE,3,5,9.0,90,48,85,4"""
