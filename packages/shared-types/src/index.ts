export type UserRole = "owner" | "accountant";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue";

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
}

export interface DashboardSummary {
  total_invoiced: string;
  total_paid: string;
  outstanding: string;
  overdue_count: number;
  recent_transactions: RecentTransaction[];
}

export interface RecentTransaction {
  id: string;
  type: "payment" | "invoice";
  description: string;
  amount: string;
  occurred_at: string;
}
