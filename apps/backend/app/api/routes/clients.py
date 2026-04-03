from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.rbac import require_owner
from app.db import get_db
from app.deps.auth import CurrentUser
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientOut, ClientUpdate
from app.services.plan_enforcement import assert_can_add_client

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
def list_clients(user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> list[Client]:
    rows = db.scalars(select(Client).where(Client.owner_id == user.id).order_by(Client.name)).all()
    return list(rows)


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(
    body: ClientCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Client:
    assert_can_add_client(db, user)
    c = Client(
        owner_id=user.id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        company=body.company,
        address_line1=body.address_line1,
        address_line2=body.address_line2,
        city=body.city,
        region=body.region,
        postal_code=body.postal_code,
        country_code=body.country_code,
        notes=body.notes,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/{client_id}", response_model=ClientOut)
def get_client(
    client_id: UUID,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Client:
    c = db.get(Client, client_id)
    if not c or c.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


@router.patch("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: UUID,
    body: ClientUpdate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Client:
    c = db.get(Client, client_id)
    if not c or c.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Client not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: UUID,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    require_owner(user)
    c = db.get(Client, client_id)
    if not c or c.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(c)
    db.commit()
