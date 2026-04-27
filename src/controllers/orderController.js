const Order = require('../models/Order');
const { GARMENT_PRICES, PROCESSING_HOURS } = require('../config/garments');
const { nanoid } = require('nanoid');

/**
 * Generate a unique human-readable order ID
 * Format: LD-XXXXXXXX (e.g., LD-A3kF9mB2)
 */
const generateOrderId = () => `LD-${nanoid(8).toUpperCase()}`;

/**
 * Calculate estimated delivery date based on garments
 */
const calculateEstimatedDelivery = (garments) => {
    let maxHours = 24; // minimum 24 hours
    garments.forEach((item) => {
        const hours = PROCESSING_HOURS[item.garmentType] || 36;
        if (hours > maxHours) maxHours = hours;
    });
    const deliveryDate = new Date();
    deliveryDate.setHours(deliveryDate.getHours() + maxHours);
    return deliveryDate;
};

/**
 * POST /api/orders
 * Create a new order
 */
exports.createOrder = async (req, res) => {
    try {
        const { customerName, phoneNumber, garments, notes } = req.body;

        const order = await Order.create({
            orderId: generateOrderId(),
            customerName,
            phoneNumber,
            garments,
            notes,
            estimatedDelivery: calculateEstimatedDelivery(garments),
            createdBy: req.user._id,
            statusHistory: [{
                status: 'RECEIVED',
                changedBy: req.user._id,
            }],
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: {
                    orderId: order.orderId,
                    customerName: order.customerName,
                    phoneNumber: order.phoneNumber,
                    garments: order.garments,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    estimatedDelivery: order.estimatedDelivery,
                    createdAt: order.createdAt,
                },
            },
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message,
        });
    }
};

/**
 * GET /api/orders
 * List all orders with optional filters
 * Query params: status, customer, phone, garmentType, page, limit, sort
 */
exports.getOrders = async (req, res) => {
    try {
        const {
            status,
            customer,
            phone,
            garmentType,
            page = 1,
            limit = 20,
            sort = '-createdAt',
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status.toUpperCase();
        }

        if (customer) {
            filter.customerName = { $regex: customer, $options: 'i' };
        }

        if (phone) {
            filter.phoneNumber = { $regex: phone };
        }

        if (garmentType) {
            filter['garments.garmentType'] = { $regex: garmentType, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email')
            .lean();

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message,
        });
    }
};

/**
 * GET /api/orders/:orderId
 * Get a single order by orderId
 */
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId })
            .populate('createdBy', 'name email')
            .populate('statusHistory.changedBy', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order ${req.params.orderId} not found`,
            });
        }

        res.json({
            success: true,
            data: { order },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message,
        });
    }
};

/**
 * PATCH /api/orders/:orderId/status
 * Update order status
 */
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order ${req.params.orderId} not found`,
            });
        }

        // Validate status transition
        const validTransitions = {
            'RECEIVED': ['PROCESSING'],
            'PROCESSING': ['READY'],
            'READY': ['DELIVERED'],
            'DELIVERED': [], // terminal state
        };

        if (!validTransitions[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${order.status} to ${status}. Valid next status: ${validTransitions[order.status].join(', ') || 'none (order is delivered)'}`,
            });
        }

        order.status = status;
        order.statusHistory.push({
            status,
            changedBy: req.user._id,
        });

        await order.save();

        res.json({
            success: true,
            message: `Order ${order.orderId} status updated to ${status}`,
            data: {
                order: {
                    orderId: order.orderId,
                    status: order.status,
                    statusHistory: order.statusHistory,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message,
        });
    }
};

/**
 * DELETE /api/orders/:orderId
 * Delete an order (admin only)
 */
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order ${req.params.orderId} not found`,
            });
        }

        res.json({
            success: true,
            message: `Order ${req.params.orderId} deleted successfully`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete order',
            error: error.message,
        });
    }
};

/**
 * GET /api/dashboard
 * Return dashboard statistics
 */
exports.getDashboard = async (req, res) => {
    try {
        const [stats, recentOrders, revenueByDay] = await Promise.all([
            // Aggregate stats
            Order.aggregate([
                {
                    $facet: {
                        total: [{ $count: 'count' }],
                        revenue: [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }],
                        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                        avgOrderValue: [{ $group: { _id: null, avg: { $avg: '$totalAmount' } } }],
                        topGarments: [
                            { $unwind: '$garments' },
                            { $group: { _id: '$garments.garmentType', totalQuantity: { $sum: '$garments.quantity' }, totalRevenue: { $sum: '$garments.subtotal' } } },
                            { $sort: { totalQuantity: -1 } },
                            { $limit: 5 },
                        ],
                    },
                },
            ]),
            // Recent orders
            Order.find()
                .sort('-createdAt')
                .limit(5)
                .select('orderId customerName status totalAmount createdAt')
                .lean(),
            // Revenue by day (last 7 days)
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: { $sum: '$totalAmount' },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const aggregated = stats[0];
        const statusCounts = {};
        aggregated.byStatus.forEach((s) => { statusCounts[s._id] = s.count; });

        res.json({
            success: true,
            data: {
                totalOrders: aggregated.total[0]?.count || 0,
                totalRevenue: aggregated.revenue[0]?.total || 0,
                averageOrderValue: Math.round(aggregated.avgOrderValue[0]?.avg || 0),
                ordersByStatus: {
                    RECEIVED: statusCounts.RECEIVED || 0,
                    PROCESSING: statusCounts.PROCESSING || 0,
                    READY: statusCounts.READY || 0,
                    DELIVERED: statusCounts.DELIVERED || 0,
                },
                topGarments: aggregated.topGarments,
                recentOrders,
                revenueByDay,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message,
        });
    }
};

/**
 * GET /api/garments
 * Return available garment types and prices
 */
exports.getGarmentPrices = async (req, res) => {
    const garments = Object.entries(GARMENT_PRICES).map(([type, price]) => ({
        type,
        price,
        estimatedHours: PROCESSING_HOURS[type] || 36,
    }));

    res.json({
        success: true,
        data: { garments },
    });
};
