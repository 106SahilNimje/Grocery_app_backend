const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/history/:userId', getPaymentHistory);

module.exports = router;
