const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// POST /api/inventory - Add stock entry (Simple update for now)
router.post('/', async (req, res) => {
    const { productId, variant, quantity, type } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const qty = Number(quantity);
        let stockUpdated = false;

        // Update the variant stock if a variant is provided and matches
        if (variant && product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(v => v.unit === variant);
            if (variantIndex !== -1) {
                if (type === 'IN') {
                    product.variants[variantIndex].stock += qty;
                } else if (type === 'OUT') {
                    product.variants[variantIndex].stock = Math.max(0, product.variants[variantIndex].stock - qty);
                }
                stockUpdated = true;
            } else {
                return res.status(404).json({ error: "Variant not found" });
            }
        }

        // Fallback for older products without variants (just in case)
        if (!stockUpdated) {
            if (type === 'IN') {
                product.stock = (product.stock || 0) + qty;
            } else if (type === 'OUT') {
                product.stock = Math.max(0, (product.stock || 0) - qty);
            }
        }

        await product.save();
        res.json({ message: "Stock updated", product });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
