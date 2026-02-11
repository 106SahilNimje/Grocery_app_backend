require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_grocery_admin";
console.log("Attempting to connect to:", uri);

mongoose.connect(uri)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });
