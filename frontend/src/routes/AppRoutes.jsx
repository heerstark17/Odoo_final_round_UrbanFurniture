import { Navigate, Route, Routes } from "react-router-dom";
import SalesOrders from "../pages/transactions/SalesOrders";
import CustomerInvoices from "../pages/transactions/CustomerInvoices";
import InvoicePayment from "../pages/transactions/InvoicePayment";
import PurchaseOrders from "../pages/transactions/PurchaseOrders";
import VendorBills from "../pages/transactions/VendorBills";
import BillPayment from "../pages/transactions/BillPayment";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sales/orders" replace />} />

      <Route path="/sales/orders" element={<SalesOrders />} />
      <Route path="/sales/invoices" element={<CustomerInvoices />} />
      <Route path="/sales/payments" element={<InvoicePayment />} />

      <Route path="/purchase/orders" element={<PurchaseOrders />} />
      <Route path="/purchase/bills" element={<VendorBills />} />
      <Route path="/purchase/payments" element={<BillPayment />} />
    </Routes>
  );
}

export default AppRoutes;