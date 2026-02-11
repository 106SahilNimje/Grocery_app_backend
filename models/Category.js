const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        // required: true, // Made optional as we use icon now
    },
    icon: {
        type: String,
        default: "box", // Default ionicon or emoji
    },
    iconBg: {
        type: String,
        default: "#F3F4F6",
    },
    iconColor: {
        type: String,
        default: "#111827",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    subCategories: [
        {
            name: { type: String },
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Category', categorySchema);
