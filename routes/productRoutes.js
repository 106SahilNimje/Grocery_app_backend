const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Get products (optionally filter by categoryId)
router.get('/', async (req, res) => {
    const { categoryId, isActive } = req.query;
    const filter = {};

    if (categoryId) filter.category = categoryId;
    if (isActive) filter.isActive = isActive === 'true';

    try {
        const products = await Product.find(filter).populate('category');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products/match-items - Fuzzy match items from list
router.post('/match-items', async (req, res) => {
    const { items } = req.body; // Expects { items: ["Milk", "Bread"] }
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid items array" });
    }

    try {
        const results = [];
        for (const itemName of items) {
            // Case-insensitive regex search
            const products = await Product.find({
                name: { $regex: itemName, $options: 'i' },
                isActive: true // Only show active products
            }).limit(3); // Limit to top 3 matches per item

            if (products.length > 0) {
                results.push({
                    searchedTerm: itemName,
                    matches: products
                });
            }
        }
        res.json({ results });
    } catch (err) {
        console.error("Match Items Error:", err);
        res.status(500).json({ error: "Failed to match items" });
    }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// POST /api/products - Add a new product
router.post('/', upload.array('images'), async (req, res) => {
    try {
        const { name, description, price, oldPrice, categoryId, variants, sku, subCategoryId, isActive } = req.body;

        // Parse variants if it's a string (from FormData)
        let parsedVariants = variants;
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            } catch (e) {
                console.error("Error parsing variants:", e);
                return res.status(400).json({ error: "Invalid variants format" });
            }
        }

        // Determine Base Price
        let basePrice = price;
        if (!basePrice && parsedVariants && parsedVariants.length > 0) {
            basePrice = parsedVariants[0].price;
        }

        // Handle Image URL
        let imageUrl = '';
        if (req.files && req.files.length > 0) {
            imageUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.files[0].filename}`;
        } else if (req.body.image) {
            imageUrl = req.body.image;
        } else {
            // Fallback placeholder if no image provided
            imageUrl = 'https://placehold.co/400';
        }

        const newProduct = new Product({
            name,
            description,
            price: Number(basePrice) || 0, // Ensure number
            oldPrice: oldPrice ? Number(oldPrice) : undefined,
            image: imageUrl,
            category: categoryId, // Map categoryId to category
            variants: parsedVariants,
            sku,
            subCategoryId,
            isActive: isActive === 'true' || isActive === true
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.error("Error adding product:", err);
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/products/:id - Update a product
router.put('/:id', upload.array('images'), async (req, res) => {
    try {
        const { name, description, price, oldPrice, categoryId, variants, sku, subCategoryId, isActive } = req.body;

        // Parse variants
        let parsedVariants = variants;
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            } catch (e) {
                // ignore, might be already object
            }
        }

        // Determine Base Price
        let basePrice = price;
        if (!basePrice && parsedVariants && parsedVariants.length > 0) {
            basePrice = parsedVariants[0].price;
        }

        let updateData = {
            name, description,
            price: Number(basePrice) || 0,
            oldPrice: oldPrice ? Number(oldPrice) : undefined,
            category: categoryId, // Map categoryId to category
            variants: parsedVariants,
            sku, subCategoryId,
            isActive: isActive === 'true' || isActive === true
        };

        if (req.files && req.files.length > 0) {
            updateData.image = `http://localhost:${process.env.PORT || 5000}/uploads/${req.files[0].filename}`;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!updatedProduct) return res.status(404).json({ error: "Product not found" });
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/products/:id - Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
