import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { MarketingLayout } from "./layouts/MarketingLayout";
import { About } from "./pages/About";
import { ClientNew } from "./pages/ClientNew";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { Features } from "./pages/Features";
import { Help } from "./pages/Help";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { InvoiceNew } from "./pages/InvoiceNew";
import { Invoices } from "./pages/Invoices";
import { Landing } from "./pages/Landing";
import { LegalPrivacy } from "./pages/LegalPrivacy";
import { LegalTerms } from "./pages/LegalTerms";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Pricing } from "./pages/Pricing";
import { Register } from "./pages/Register";
import { RegisterVerify } from "./pages/RegisterVerify";
import { SettingsLayout } from "./layouts/SettingsLayout";
import { AccountSettings } from "./pages/settings/AccountSettings";
import { ProfileSettings } from "./pages/settings/ProfileSettings";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (n, err) => {
        if (err instanceof Error && err.message.includes("401")) return false;
        return n < 2;
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal/terms" element={<LegalTerms />} />
            <Route path="/legal/privacy" element={<LegalPrivacy />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/verify" element={<RegisterVerify />} />
          <Route path="/app" element={<AppShell />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientNew />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceNew />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="help" element={<Help />} />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="account" element={<AccountSettings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
