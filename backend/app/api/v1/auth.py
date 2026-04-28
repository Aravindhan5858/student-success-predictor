from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, RegisterRequest
from app.schemas.user import UserResponse
from app.services.auth_service import authenticate_user, create_tokens, refresh_tokens
from app.services.user_service import create_user
from app.models.user import User

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.identifier, data.password)
    return create_tokens(user)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    from app.schemas.user import UserCreate
    user = create_user(db, UserCreate(email=data.email, password=data.password, full_name=data.full_name, role=data.role))
    return user


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_tokens(db, data.refresh_token)


@router.post("/logout", status_code=204)
def logout(current_user: User = Depends(get_current_active_user)):
    # Stateless JWT — client discards tokens. Add token blacklist via Redis if needed.
    return None


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_active_user)):
    return current_user
