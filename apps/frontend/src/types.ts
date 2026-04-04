export type UserRole = "owner" | "accountant";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue";

export type ThemePreference = "light" | "dark" | "system";

export interface PlanLimits {
  max_clients: number | null;
  max_invoices_per_30_days: number | null;
}

export interface PlanUsage {
  clients: number;
  invoices_last_30_days: number;
}

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  display_name: string | null;
  country_code: string | null;
  currency_code: string | null;
  theme: ThemePreference | null;
  onboarding_completed_at: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  limits: PlanLimits;
  usage: PlanUsage;
}

export interface Client {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
}

export interface Invoice {
  id: string;
  owner_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  currency: string;
  tax_rate: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  due_date: string;
  bill_to_snapshot: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
}

export interface DashboardSummary {
  total_invoiced: string;
  total_paid: string;
  outstanding: string;
  overdue_count: number;
  recent_transactions: {
    id: string;
    type: "settlement" | string;
    description: string;
    amount: string;
    occurred_at: string;
  }[];
}

export interface TopClientRow {
  client_id: string;
  client_name: string;
  total_revenue: string;
}
