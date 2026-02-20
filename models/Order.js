const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            name: { type: String }, // Store name in case product is deleted
            variant: { type: String },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending',
    },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Payment Details
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    signature: { type: String },
});

module.exports = mongoose.model('Order', orderSchema);
