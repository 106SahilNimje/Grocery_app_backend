const Razorpay = require('razorpay');
const crypto = require('crypto');
const CartOrder = require('../models/CartOrder');
const Order = require('../models/Order');
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
            const { user, items, totalAmount, shippingAddress, phone } = orderData; // Added phone

            const newOrder = new Order({
                user,
                items,
                totalAmount,
                shippingAddress,
                paymentStatus: 'Completed',
                orderStatus: 'Processing',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                signature: razorpay_signature,
            });

            await newOrder.save();

            // Update user phone if provided
            if (phone) {
                await User.findByIdAndUpdate(user, { phone: phone });
            }

            // Decrement Stock
            try {
                for (const item of items) {
                    if (item.product) {
                        const productDoc = await require('../models/Product').findById(item.product);
                        if (productDoc && item.variant) {
                            const variantObj = productDoc.variants.find(v => v.unit === item.variant);
                            if (variantObj) {
                                variantObj.stock = Math.max(0, variantObj.stock - item.quantity);
                                await productDoc.save();
                            }
                        }
                    }
                }
            } catch (stockError) {
                console.error("Stock Deduction Error (Razorpay):", stockError.message);
            }

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

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const history = await CartOrder.find({ user: userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error("Error fetching payment history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment history",
            error: error.message
        });
    }
};
