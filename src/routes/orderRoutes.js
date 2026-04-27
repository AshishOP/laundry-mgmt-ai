const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrder,
    updateStatus,
    deleteOrder,
    getDashboard,
    getGarmentPrices,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { createOrderValidation, updateStatusValidation } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Garment prices (public info for logged-in users)
router.get('/garments', getGarmentPrices);

// Dashboard
router.get('/dashboard', getDashboard);

// Orders CRUD
router.post('/orders', createOrderValidation, createOrder);
router.get('/orders', getOrders);
router.get('/orders/:orderId', getOrder);
router.patch('/orders/:orderId/status', updateStatusValidation, updateStatus);
router.delete('/orders/:orderId', authorize('admin'), deleteOrder);

module.exports = router;
