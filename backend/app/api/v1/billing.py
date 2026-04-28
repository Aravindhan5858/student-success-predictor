import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.api.deps import get_db, get_current_active_user, require_admin
from app.models.user import User, UserRole
from app.models.billing import Subscription, Payment, PaymentDue
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


def _admin(current_user: User = Depends(get_current_active_user)) -> User:
    return require_admin(current_user)


class SubscriptionCreate(BaseModel):
    plan_name: str
    amount: float
    duration_days: int


class PaymentCreate(BaseModel):
    amount: float
    payment_method: str
    subscription_id: Optional[uuid.UUID] = None


@router.post("/subscriptions")
def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sub = Subscription(
        user_id=current_user.id,
        plan_name=data.plan_name,
        amount=data.amount,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=data.duration_days),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/subscriptions")
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role in (UserRole.admin, UserRole.super_admin):
        return db.scalars(select(Subscription)).all()
    return db.scalars(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).all()


@router.post("/payments")
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    payment = Payment(
        user_id=current_user.id,
        subscription_id=data.subscription_id,
        amount=data.amount,
        payment_method=data.payment_method,
        status="completed",
        paid_at=datetime.utcnow(),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments")
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role in (UserRole.admin, UserRole.super_admin):
        return db.scalars(select(Payment).order_by(Payment.created_at.desc())).all()
    return db.scalars(
        select(Payment).where(Payment.user_id == current_user.id)
    ).all()


@router.get("/dues")
def list_dues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role in (UserRole.admin, UserRole.super_admin):
        return db.scalars(select(PaymentDue).where(PaymentDue.is_paid == False)).all()
    return db.scalars(
        select(PaymentDue).where(
            PaymentDue.user_id == current_user.id,
            PaymentDue.is_paid == False,
        )
    ).all()


@router.get("/revenue")
def get_revenue(
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    total = (
        db.scalar(
            select(func.sum(Payment.amount)).where(Payment.status == "completed")
        )
        or 0
    )
    return {"total_revenue": total}
