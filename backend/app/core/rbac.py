from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole


class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}"
            )
        return current_user


def require_roles(*roles: UserRole) -> RoleChecker:
    return RoleChecker(list(roles))
