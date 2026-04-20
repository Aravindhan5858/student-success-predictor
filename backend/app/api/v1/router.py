from fastapi import APIRouter
from app.api.v1 import auth, users, students, academic, assessments, interviews, analytics, files
from app.api.v1 import profile, community, mentorship, mock_test, chatbot

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(students.router, prefix="/students", tags=["students"])
router.include_router(academic.router, prefix="/academic", tags=["academic"])
router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(files.router, prefix="/files", tags=["files"])
router.include_router(profile.router, tags=["profile"])
router.include_router(community.router, tags=["community"])
router.include_router(mentorship.router, tags=["mentorship"])
router.include_router(mock_test.router, tags=["mock-test"])
router.include_router(chatbot.router, tags=["chatbot"])
