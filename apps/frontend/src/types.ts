export type UserRole = "owner" | "accountant";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue";

export type ThemePreference = "light" | "dark" | "system";

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
  org_name: string | null;
  logo_url: string | null;
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
  discount_rate: string;
  discount_amount: string;
  total: string;
  issue_date: string;
  due_date: string;
  payment_terms: string | null;
  po_number: string | null;
  bill_to_snapshot: string | null;
  notes: string | null;
  times_sent: number;
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
