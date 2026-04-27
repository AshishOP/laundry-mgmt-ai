/**
 * Seed script - creates a demo admin user and sample orders
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
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

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Order.deleteMany({});
        console.log('Cleared existing data');

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@laundry.com',
            password: 'admin123',
            role: 'admin',
        });
        console.log('✅ Admin user created: admin@laundry.com / admin123');

        // Create staff user
        const staff = await User.create({
            name: 'Staff User',
            email: 'staff@laundry.com',
            password: 'staff123',
            role: 'staff',
        });
        console.log('✅ Staff user created: staff@laundry.com / staff123');

        // Create demo orders
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
        }
        console.log(`✅ ${DEMO_ORDERS.length} demo orders created`);

        console.log('\n🎉 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seed();
