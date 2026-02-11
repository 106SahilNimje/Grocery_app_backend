const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getTopSelling = async (req, res) => {
    try {
        const topSelling = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        res.status(200).json(topSelling);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCategoryPerformance = async (req, res) => {
    try {
        const categoryPerformance = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$categoryDetails.name",
                    totalSales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            }
        ]);
        res.status(200).json(categoryPerformance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.status(200).json(dailySales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStockReport = async (req, res) => {
    try {
        const lowStockThreshold = 10;

        // Find products with any variant having low stock
        const products = await Product.find({ isActive: true });

        const lowStock = [];
        const outOfStock = [];

        products.forEach(product => {
            let totalStock = 0;
            if (product.variants && product.variants.length > 0) {
                totalStock = product.variants.reduce((acc, curr) => acc + curr.stock, 0);
            } else {
                // Fallback for old schema if exists, though Product.js shows it commented out
                totalStock = 0;
            }

            if (totalStock === 0) {
                outOfStock.push({
                    _id: product._id,
                    name: product.name,
                    stock: 0
                });
            } else if (totalStock < lowStockThreshold) {
                lowStock.push({
                    _id: product._id,
                    name: product.name,
                    stock: totalStock
                });
            }
        });

        res.status(200).json({ lowStock, outOfStock });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
