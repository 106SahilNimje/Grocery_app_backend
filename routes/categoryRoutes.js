const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories - Get all categories with product counts
router.get('/', async (req, res) => {
    try {
        const matchStage = {};
        if (req.query.isActive) {
            matchStage.isActive = req.query.isActive === 'true';
        }

        const categories = await Category.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'products'
                }
            },
            {
                $addFields: {
                    productsCount: { $size: '$products' }
                }
            },
            {
                $project: {
                    products: 0 
                }
            }
        ]);

        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/categories - Add a new category
router.post('/', async (req, res) => {
    const { name, image, icon, iconBg, iconColor, isActive, subCategories } = req.body;
    try {
        const newCategory = new Category({
            name,
            image,
            icon,
            iconBg,
            iconColor,
            isActive,
            subCategories
        });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req, res) => {
    try {
        const { name, image, icon, iconBg, iconColor, isActive, subCategories } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (image !== undefined) updateData.image = image;
        if (icon !== undefined) updateData.icon = icon;
        if (iconBg !== undefined) updateData.iconBg = iconBg;
        if (iconColor !== undefined) updateData.iconColor = iconColor;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (subCategories !== undefined) updateData.subCategories = subCategories;

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!updatedCategory) return res.status(404).json({ error: "Category not found" });
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) return res.status(404).json({ error: "Category not found" });
        res.json({ message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
