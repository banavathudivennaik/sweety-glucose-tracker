
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Safe request logging (never log passwords or request bodies)
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.originalUrl}`);
    next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/reports", reportRoutes);

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Sweety Blood Glucose Tracker API is running"
    });
});

module.exports = app;
