import csv
import io
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
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV")

    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

    required_fields = ['register_number', 'full_name', 'email', 'department', 'year', 'semester']
    
    data = []
    for row in reader:
        if not all(field in row for field in required_fields):
            raise HTTPException(status_code=400, detail=f"Missing required fields: {required_fields}")
        data.append(row)

    return data


async def process_student_csv(file: UploadFile, db: Session, professor_id: uuid.UUID):
    data = await validate_csv(file)
    
    created = 0
    updated = 0
    errors = []

    for row in data:
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
                    student_id=row['register_number'],
                    department=row['department'],
                    year=int(row['year']),
                    semester=int(row['semester']),
                    cgpa=float(row.get('cgpa', 0.0)),
                    attendance_pct=float(row.get('attendance', 0.0))
                )
                db.add(student)
                created += 1
            else:
                student = db.scalar(select(Student).where(Student.user_id == user.id))
                if student:
                    student.department = row['department']
                    student.year = int(row['year'])
                    student.semester = int(row['semester'])
                    if 'cgpa' in row:
                        student.cgpa = float(row['cgpa'])
                    if 'attendance' in row:
                        student.attendance_pct = float(row['attendance'])
                    updated += 1

            if 'internal_marks' in row or 'semester_marks' in row:
                academic = AcademicRecord(
                    student_id=student.id,
                    semester=int(row['semester']),
                    internal_marks=float(row.get('internal_marks', 0)),
                    semester_marks=float(row.get('semester_marks', 0)),
                    credits=int(row.get('credits', 0))
                )
                db.add(academic)

        except Exception as e:
            errors.append(f"Row {row.get('register_number', 'unknown')}: {str(e)}")

    db.commit()
    
    return {
        "created": created,
        "updated": updated,
        "errors": errors
    }


def get_sample_csv_format() -> str:
    return """register_number,full_name,email,department,year,semester,cgpa,attendance,internal_marks,semester_marks,credits
2021CS001,John Doe,john@example.com,CSE,3,5,8.5,85,45,78,4
2021CS002,Jane Smith,jane@example.com,CSE,3,5,9.0,90,48,85,4"""
