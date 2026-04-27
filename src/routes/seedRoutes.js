const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { nanoid } = require('nanoid');

const DEMO_ORDERS = [
    {
        customerName: 'Rahul Sharma',
        phoneNumber: '9876543210',
        garments: [
            { garmentType: 'Shirt', quantity: 3 },
            { garmentType: 'Pants', quantity: 2 },
        ],
        status: 'DELIVERED',
    },
    {
        customerName: 'Priya Patel',
        phoneNumber: '8765432109',
        garments: [
            { garmentType: 'Saree', quantity: 2 },
            { garmentType: 'Kurta', quantity: 1 },
        ],
        status: 'READY',
    },
    {
        customerName: 'Amit Kumar',
        phoneNumber: '7654321098',
        garments: [
            { garmentType: 'Suit (2pc)', quantity: 1 },
            { garmentType: 'Shirt', quantity: 5 },
        ],
        status: 'PROCESSING',
    },
    {
        customerName: 'Sneha Reddy',
        phoneNumber: '9988776655',
        garments: [
            { garmentType: 'Dress', quantity: 2 },
            { garmentType: 'Jacket', quantity: 1 },
        ],
        status: 'RECEIVED',
    },
    {
        customerName: 'Vikram Singh',
        phoneNumber: '8877665544',
        garments: [
            { garmentType: 'Blanket', quantity: 2 },
            { garmentType: 'Bedsheet', quantity: 4 },
            { garmentType: 'Curtain (per piece)', quantity: 6 },
        ],
        status: 'PROCESSING',
    },
];

router.get('/seed-database', async (req, res) => {
    // Basic protection: check for a secret query param
    if (req.query.secret !== (process.env.SEED_SECRET || 'supersecret')) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    try {
        let admin = await User.findOne({ email: 'admin@laundry.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin',
                email: 'admin@laundry.com',
                password: 'admin123',
                role: 'admin',
            });
        }

        let staff = await User.findOne({ email: 'staff@laundry.com' });
        if (!staff) {
            staff = await User.create({
                name: 'Staff User',
                email: 'staff@laundry.com',
                password: 'staff123',
                role: 'staff',
            });
        }

        const existingOrders = await Order.countDocuments();
        let ordersCreated = 0;

        if (existingOrders === 0) {
            for (const orderData of DEMO_ORDERS) {
                const statusFlow = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
                const targetIndex = statusFlow.indexOf(orderData.status);
                const statusHistory = [];

                for (let i = 0; i <= targetIndex; i++) {
                    statusHistory.push({
                        status: statusFlow[i],
                        changedBy: admin._id,
                        changedAt: new Date(Date.now() - (targetIndex - i) * 3600000),
                    });
                }

                await Order.create({
                    orderId: `LD-${nanoid(8).toUpperCase()}`,
                    customerName: orderData.customerName,
                    phoneNumber: orderData.phoneNumber,
                    garments: orderData.garments,
                    status: orderData.status,
                    statusHistory,
                    estimatedDelivery: new Date(Date.now() + 48 * 3600000),
                    createdBy: admin._id,
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
                });
                ordersCreated += 1;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Database seed completed.',
            users: {
                admin: 'admin@laundry.com / admin123',
                staff: 'staff@laundry.com / staff123',
            },
            ordersCreated,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Seeding failed',
            error: error.message,
        });
    }
});

module.exports = router;
