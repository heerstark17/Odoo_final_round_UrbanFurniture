require("dotenv").config();

const express = require("express");
const { pool, connectDB } = require("./config/db");

const contactRoutes = require("./routes/contactRoutes");
const productRoutes = require("./routes/productRoutes");
const chartOfAccountRoutes =require("./routes/chartOfAccountRoutes");
const taxRoutes = require("./routes/taxRoutes");

const app = express();

app.use(express.json());


app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connected",
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error("Database query failed:", error.message);

        res.status(500).json({
            message: "PostgreSQL connection failed"
        });
    }
});

app.use("/api/contacts", contactRoutes);
app.use("/api/products", productRoutes);
app.use(
    "/api/chart-of-accounts",
    chartOfAccountRoutes
);
app.use(
    "/api/taxes",
    taxRoutes
);

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();