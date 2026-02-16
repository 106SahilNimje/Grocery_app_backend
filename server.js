require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require('fs');
const path = require('path');
const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors()); // Allow all origins for now to simplify development
app.use(express.json());

//change .......................................................................................................
// Global Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    next();
});
//change .......................................................................................................

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("Created uploads directory");
}

// Serve Static Files
app.use('/uploads', express.static(uploadDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// Health Check
app.get("/", (req, res) => {
    res.send("Smart Grocery Market API is running...");
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Server Error",
        error: process.env.NODE_ENV === "production" ? null : err.message,
    });
});

// Connect to Database & Start Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch(err => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
});
