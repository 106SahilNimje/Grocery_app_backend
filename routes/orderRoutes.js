const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const CartOrder = require('../models/CartOrder');

const { sendOrderConfirmation } = require('../utils/whatsappService');

// POST /api/orders - Place a new order
router.post('/', async (req, res) => {
    console.log("POST /api/orders Body:", req.body); // Debug log
    const { user, items, totalAmount, shippingAddress, phone } = req.body;
    try {
        const newOrder = new Order({
            user,
            items,
            totalAmount,
            shippingAddress
        });
        await newOrder.save();

        // Update user phone if not present
        if (phone) {
            await mongoose.model('User').findByIdAndUpdate(user, { phone: phone });
        }

        // Populate product details for the WhatsApp message
        const populatedOrder = await Order.findById(newOrder._id)
            .populate('user')
            .populate('items.product');

        // Send WhatsApp Notification (Async - don't await response)
        // Pass the phone number from request in case population hasn't reflected update yet or use simpler logic
        sendOrderConfirmation(populatedOrder, phone);

        res.status(201).json(newOrder);
    } catch (err) {
        console.error("Order Save Error:", err.message); // Debug log
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: status },
            { new: true }
        );
        if (!updatedOrder) return res.status(404).json({ error: "Order not found" });
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/orders/:id - Get specific order by ID
router.get('/:id', async (req, res) => {
    try {
        let order = await Order.findById(req.params.id)
            .populate('user')
            .populate('items.product');

        let paymentMethod = 'Cash on Delivery';

        if (!order) {
            order = await CartOrder.findById(req.params.id)
                .populate('user')
                .populate('items.product');
            paymentMethod = 'Razorpay';
        }

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Convert to object and add paymentMethod
        const orderObj = order.toObject();
        orderObj.paymentMethod = paymentMethod;

        res.json(orderObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders - Get all orders (for Admin/User)
// Use query param ?userId=<id> to filter by user
router.get('/', async (req, res) => {
    const { userId } = req.query;

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid User ID format" });
    }

    const filter = userId ? { user: userId } : {};

    try {
        // Fetch standard orders (COD)
        const orders = await Order.find(filter).populate('user').populate('items.product').sort({ createdAt: -1 });
        const ordersWithMethod = orders.map(o => ({ ...o.toObject(), paymentMethod: 'Cash on Delivery' }));

        // Fetch Razorpay orders
        const cartOrders = await CartOrder.find(filter).populate('user').populate('items.product').sort({ createdAt: -1 });
        const cartOrdersWithMethod = cartOrders.map(o => ({ ...o.toObject(), paymentMethod: 'Razorpay' }));

        // Merge and sort by createdAt descending
        const allOrders = [...ordersWithMethod, ...cartOrdersWithMethod].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allOrders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
