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

const app = express();

app.use(express.json());

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

app.use("/api/contacts", contactRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chart-of-accounts", chartOfAccountRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/analytic-accounts", analyticAccountRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/invoices", customerInvoiceRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/vendor-bills", vendorBillRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/journal-entries", journalEntryRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
