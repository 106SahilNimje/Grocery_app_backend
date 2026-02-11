const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        // required: true, 
    },
    subCategoryId: {
        type: String, // Storing as string ID for now
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    price: {
        type: Number,
        required: true,
    },
    oldPrice: {
        type: Number, // For showing discounts
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    variants: [
        {
            unit: { type: String, required: true },
            price: { type: Number, required: true },
            stock: { type: Number, default: 0 },
        }
    ],
    // stock: { type: Number, default: 0 }, // Deprecated in favor of variants
    // unit: { type: String, default: 'pcs' }, // Deprecated in favor of variants
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Product', productSchema);
