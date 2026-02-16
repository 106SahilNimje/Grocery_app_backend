const Razorpay = require('razorpay');
const crypto = require('crypto');
const CartOrder = require('../models/CartOrder');
const User = require('../models/User'); // Assuming you have a User model
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;

        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt,
            notes,
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

// Verify Payment and Save to DB
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData // This contains user, items, shippingAddress, etc. passed from frontend
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Payment successful, save to MongoDB
            const { user, items, totalAmount, shippingAddress } = orderData;

            const newOrder = new CartOrder({
                user,
                items,
                totalAmount,
                shippingAddress,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature,
                paymentStatus: 'Completed',
                orderStatus: 'Processing',
            });

            await newOrder.save();

            res.json({
                success: true,
                message: "Payment verified and order saved successfully",
                orderId: newOrder._id
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid signature",
            });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
