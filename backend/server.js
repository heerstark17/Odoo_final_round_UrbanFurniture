require("dotenv").config();

const express = require("express");
const { pool, connectDB } = require("./config/db");

const contactRoutes = require("./routes/contactRoutes");
const productRoutes = require("./routes/productRoutes");
const chartOfAccountRoutes = require("./routes/chartOfAccountRoutes");
const taxRoutes = require("./routes/taxRoutes");
const journalRoutes = require("./routes/journalRoutes");
const analyticAccountRoutes = require("./routes/analyticAccountRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const salesOrderRoutes = require("./routes/salesOrderRoutes");
const customerInvoiceRoutes = require("./routes/customerInvoiceRoutes");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
const vendorBillRoutes = require("./routes/vendorBillRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const journalEntryRoutes = require("./routes/journalEntryRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const { authenticateToken, requireRole } = require("./middleware/authMiddleware");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
  });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL connected",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database query failed:", error.message);

    res.status(500).json({
      message: "PostgreSQL connection failed",
    });
  }
});

app.use("/api/contacts", authenticateToken, contactRoutes);
app.use("/api/products", authenticateToken, requireRole("admin", "accountant"), productRoutes);
app.use("/api/chart-of-accounts", authenticateToken, requireRole("admin", "accountant"), chartOfAccountRoutes);
app.use("/api/taxes", authenticateToken, requireRole("admin", "accountant"), taxRoutes);
app.use("/api/journals", authenticateToken, requireRole("admin", "accountant"), journalRoutes);
app.use("/api/analytic-accounts", authenticateToken, requireRole("admin", "accountant"), analyticAccountRoutes);
app.use("/api/budgets", authenticateToken, requireRole("admin", "accountant"), budgetRoutes);
app.use("/api/sales-orders", authenticateToken, salesOrderRoutes);
app.use("/api/invoices", authenticateToken, customerInvoiceRoutes);
app.use("/api/purchase-orders", authenticateToken, purchaseOrderRoutes);
app.use("/api/vendor-bills", authenticateToken, vendorBillRoutes);
app.use("/api/payments", authenticateToken, paymentRoutes);
app.use("/api/journal-entries", authenticateToken, requireRole("admin", "accountant"), journalEntryRoutes);
app.use("/api/reports", authenticateToken, requireRole("admin", "accountant"), reportRoutes);
app.use("/api/dashboard", authenticateToken, requireRole("admin", "accountant"), dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
