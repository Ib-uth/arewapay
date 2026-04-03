from app.models.user import User, UserRole


def require_owner(user: User) -> None:
    if user.role != UserRole.owner:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner role required")


def can_manage_users(user: User) -> bool:
    return user.role == UserRole.owner
