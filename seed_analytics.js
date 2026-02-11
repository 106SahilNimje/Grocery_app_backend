require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Order = require("./models/Order");
const User = require("./models/User");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_grocery_admin")
    .then(() => console.log("MongoDB Connected for Seeding"))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear existing data
        console.log("Clearing existing analytics data...");
        await Order.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({ email: { $ne: "admin@smartgrocery.com" } }); // Keep admin

        // Create Dummy User
        const user = await User.create({
            name: "John Doe",
            email: "john@example.com",
            password: "hashed_password",
        });

        // Create Categories
        const categories = await Category.insertMany([
            { name: "Vegetables", icon: "nutrition", iconBg: "#dcfce7", iconColor: "#16a34a" },
            { name: "Fruits", icon: "leaf", iconBg: "#fef9c3", iconColor: "#ca8a04" },
            { name: "Dairy", icon: "water", iconBg: "#dbeafe", iconColor: "#2563eb" },
            { name: "Grocery", icon: "bag-handle", iconBg: "#fee2e2", iconColor: "#dc2626" },
        ]);

        console.log(`Created ${categories.length} categories`);

        // Create Products
        const products = await Product.insertMany([
            {
                name: "Fresh Tomato",
                description: "Organic tomatoes",
                sku: "VEG001",
                price: 40,
                image: "https://via.placeholder.com/150",
                category: categories[0]._id,
                variants: [{ unit: "1kg", price: 40, stock: 50 }]
            },
            {
                name: "Potatoes",
                description: "Farm fresh potatoes",
                sku: "VEG002",
                price: 30,
                image: "https://via.placeholder.com/150",
                category: categories[0]._id,
                variants: [{ unit: "1kg", price: 30, stock: 100 }]
            },
            {
                name: "Bananas",
                description: "Robusta bananas",
                sku: "FRU001",
                price: 60,
                image: "https://via.placeholder.com/150",
                category: categories[1]._id,
                variants: [{ unit: "1dz", price: 60, stock: 20 }]
            },
            {
                name: "Milk",
                description: "Fresh Cow Milk",
                sku: "DAI001",
                price: 50,
                image: "https://via.placeholder.com/150",
                category: categories[2]._id,
                variants: [{ unit: "1L", price: 50, stock: 5 }] // Low stock
            },
            {
                name: "Wheat Flour",
                description: "Whole Wheat Atta",
                sku: "GRO001",
                price: 350,
                image: "https://via.placeholder.com/150",
                category: categories[3]._id,
                variants: [{ unit: "10kg", price: 350, stock: 200 }]
            },
        ]);

        console.log(`Created ${products.length} products`);

        // Create Orders for last 7 days
        const orders = [];
        const now = new Date();

        for (let i = 0; i < 20; i++) {
            const daysAgo = Math.floor(Math.random() * 7);
            const date = new Date();
            date.setDate(now.getDate() - daysAgo);

            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 5) + 1;
            const price = randomProduct.price;

            orders.push({
                user: user._id,
                items: [{
                    product: randomProduct._id,
                    name: randomProduct.name,
                    quantity: quantity,
                    price: price
                }],
                totalAmount: price * quantity,
                shippingAddress: "123 Test St",
                paymentStatus: "Completed",
                orderStatus: "Delivered",
                createdAt: date
            });
        }

        await Order.insertMany(orders);
        console.log(`Created ${orders.length} orders`);

        console.log("Seeding Completed Successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedData();
