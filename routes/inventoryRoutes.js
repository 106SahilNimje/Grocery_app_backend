const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// POST /api/inventory - Add stock entry (Simple update for now)
router.post('/', async (req, res) => {
    const { productId, quantity, type } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const qty = Number(quantity);
        if (type === 'IN') {
            product.stock += qty;
        } else if (type === 'OUT') {
            product.stock = Math.max(0, product.stock - qty);
        }

        await product.save();
        res.json({ message: "Stock updated", stock: product.stock });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
