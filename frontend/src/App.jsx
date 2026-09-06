import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import ContactsList from "./pages/contacts/ContactsList";
import ProductsList from "./pages/products/ProductsList";
import ChartOfAccounts from "./pages/accounting/ChartOfAccounts";
import Journals from "./pages/accounting/Journals";
import Taxes from "./pages/accounting/Taxes";
import SalesOrders from "./pages/sales/SalesOrders";
import CustomerInvoices from "./pages/sales/CustomerInvoices";
import PurchaseOrders from "./pages/purchases/PurchaseOrders";
import VendorBills from "./pages/purchases/VendorBills";
import PaymentsList from "./pages/payments/PaymentsList";
import JournalEntries from "./pages/accounting/JournalEntries";
import BudgetsList from "./pages/budgets/BudgetsList";
import FinancialReports from "./pages/reports/FinancialReports";
import ContactPortal from "./pages/portal/ContactPortal";

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "contact") {
    return <Navigate to="/portal" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Main Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard or Portal Home */}
            <Route index element={<HomeRedirect />} />

            {/* Sales Flow */}
            <Route
              path="sales-orders"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <SalesOrders />
                </ProtectedRoute>
              }
            />
            <Route path="invoices" element={<CustomerInvoices />} />

            {/* Purchase Flow */}
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="vendor-bills" element={<VendorBills />} />

            {/* Cash & Bank Payments */}
            <Route path="payments" element={<PaymentsList />} />

            {/* Contact Portal */}
            <Route path="portal" element={<ContactPortal />} />

            {/* Accounting & Master Data (Admin & Accountant only) */}
            <Route
              path="contacts"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <ContactsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <ProductsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="chart-of-accounts"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <ChartOfAccounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="journals"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <Journals />
                </ProtectedRoute>
              }
            />
            <Route
              path="taxes"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <Taxes />
                </ProtectedRoute>
              }
            />
            <Route
              path="journal-entries"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <JournalEntries />
                </ProtectedRoute>
              }
            />
            <Route
              path="budgets"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <BudgetsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <FinancialReports />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
