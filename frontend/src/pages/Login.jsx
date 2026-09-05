import { Navigate, Route, Routes } from "react-router-dom";

// Master Data
import Contacts from "../pages/master-data/Contacts";
import Products from "../pages/master-data/Products";
import ChartOfAccounts from "../pages/master-data/ChartOfAccounts";
import Journals from "../pages/master-data/Journals";
import AnalyticAccounts from "../pages/master-data/AnalyticAccounts";

// Transactions
import SalesOrders from "../pages/transactions/SalesOrders";
import CustomerInvoices from "../pages/transactions/CustomerInvoices";
import InvoicePayment from "../pages/transactions/InvoicePayment";
import PurchaseOrders from "../pages/transactions/PurchaseOrders";
import VendorBills from "../pages/transactions/VendorBills";
import BillPayment from "../pages/transactions/BillPayment";
import TransactionScreens from "../pages/transactions/TransactionScreens";

// Accounting
import JournalEntries from "../pages/accounting/JournalEntries";

// Budgets
import Budgets from "../pages/budgets/Budgets";
import BudgetReport from "../pages/budgets/BudgetReport";

// Reports
import ProfitLoss from "../pages/reports/ProfitLoss";
import BalanceSheet from "../pages/reports/BalanceSheet";

// Dashboard
import Dashboard from "../pages/Dashboard";

function AppRoutes() {
  return (
    <Routes>
      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* Master Data */}
      <Route
        path="/master-data/contacts"
        element={<Contacts />}
      />

      <Route
        path="/master-data/products"
        element={<Products />}
      />

      <Route
        path="/master-data/chart-of-accounts"
        element={<ChartOfAccounts />}
      />

      <Route
        path="/master-data/journals"
        element={<Journals />}
      />

      <Route
        path="/master-data/analytic-accounts"
        element={<AnalyticAccounts />}
      />

      {/* Sales */}
      <Route
        path="/sales/orders"
        element={<SalesOrders />}
      />

      <Route
        path="/sales/invoices"
        element={<CustomerInvoices />}
      />

      <Route
        path="/sales/payments"
        element={<InvoicePayment />}
      />

      {/* Purchase */}
      <Route
        path="/purchase/orders"
        element={<PurchaseOrders />}
      />

      <Route
        path="/purchase/bills"
        element={<VendorBills />}
      />

      <Route
        path="/purchase/payments"
        element={<BillPayment />}
      />

      {/* Transaction Screens */}
      <Route
        path="/transactions"
        element={<TransactionScreens />}
      />

      {/* Accounting */}
      <Route
        path="/accounting/journal-entries"
        element={<JournalEntries />}
      />

      {/* Budgets */}
      <Route
        path="/budgets"
        element={<Budgets />}
      />

      <Route
        path="/budgets/report"
        element={<BudgetReport />}
      />

      {/* Reports */}
      <Route
        path="/reports/profit-loss"
        element={<ProfitLoss />}
      />

      <Route
        path="/reports/balance-sheet"
        element={<BalanceSheet />}
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;