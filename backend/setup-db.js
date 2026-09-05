const fs = require("fs");
const path = require("path");
const { pool } = require("./config/db");

async function setupDatabase(reset = false) {
    try {
        if (reset) {
            console.log("Resetting database...");

            await pool.query(`
                DROP SCHEMA public CASCADE;
                CREATE SCHEMA public;
            `);

            console.log("Database reset successfully.");
        }

        const schemaPath = path.join(__dirname, "sql", "schema.sql");
        const schema = fs.readFileSync(schemaPath, "utf8");

        if (schema.trim()) {
            await pool.query(schema);
            console.log("Database schema created successfully.");
        } else {
            console.log("No schema to create.");
        }

        const seedPath = path.join(__dirname, "sql", "seed.sql");
        const seed = fs.readFileSync(seedPath, "utf8");

        if (seed.trim()) {
            await pool.query(seed);
            console.log("Database seeded successfully.");
        } else {
            console.log("No seed data to insert.");
        }

    } catch (error) {
        console.error("Database setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

const reset = process.argv.includes("--reset");

setupDatabase(reset);