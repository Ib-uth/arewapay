from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RecentTransaction(BaseModel):
    id: UUID
    type: str
    description: str
    amount: str
    occurred_at: datetime


class DashboardSummary(BaseModel):
    total_invoiced: str
    total_paid: str
    outstanding: str
    overdue_count: int
    recent_transactions: list[RecentTransaction]


class TopClientRow(BaseModel):
    client_id: UUID
    client_name: str
    total_revenue: str
