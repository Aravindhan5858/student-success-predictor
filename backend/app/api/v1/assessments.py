import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_professor
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.assessment import Assessment, TestResult
from app.schemas.assessment import AssessmentCreate, AssessmentResponse, TestResultCreate, TestResultResponse

router = APIRouter()


def _professor(current_user: User = Depends(get_current_active_user)) -> User:
    return require_professor(current_user)


@router.post("", response_model=AssessmentResponse, status_code=201)
def create_assessment(data: AssessmentCreate, db: Session = Depends(get_db), current_user: User = Depends(_professor)):
    assessment = Assessment(**data.model_dump(), created_by=current_user.id)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("", response_model=list[AssessmentResponse])
def list_assessments(db: Session = Depends(get_db), _: User = Depends(get_current_active_user)):
    return db.query(Assessment).all()


@router.get("/results/me", response_model=list[TestResultResponse])
def my_results(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return db.query(TestResult).filter(TestResult.student_id == student.id).all()


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_active_user)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return assessment


@router.post("/{assessment_id}/submit", response_model=TestResultResponse, status_code=201)
def submit_assessment(
    assessment_id: uuid.UUID,
    data: TestResultCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can submit assessments")
    result = TestResult(student_id=student.id, assessment_id=assessment_id, **data.model_dump())
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/{assessment_id}/results", response_model=list[TestResultResponse])
def get_results(assessment_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(_professor)):
    return db.query(TestResult).filter(TestResult.assessment_id == assessment_id).all()
