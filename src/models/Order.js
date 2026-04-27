const mongoose = require('mongoose');
const { GARMENT_PRICES } = require('../config/garments');

const garmentItemSchema = new mongoose.Schema({
    garmentType: {
        type: String,
        required: [true, 'Garment type is required'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        max: [100, 'Quantity cannot exceed 100'],
    },
    pricePerItem: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
    },
    subtotal: {
        type: Number,
        required: true,
    },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'],
        required: true,
    },
    changedAt: {
        type: Date,
        default: Date.now,
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true,
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        minlength: [2, 'Customer name must be at least 2 characters'],
        maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    garments: {
        type: [garmentItemSchema],
        required: true,
        validate: {
            validator: (v) => v.length > 0,
            message: 'At least one garment is required',
        },
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'],
        default: 'RECEIVED',
    },
    statusHistory: [statusHistorySchema],
    estimatedDelivery: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
});

// Index for efficient querying
orderSchema.index({ status: 1 });
orderSchema.index({ customerName: 'text' });
orderSchema.index({ phoneNumber: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save: calculate totals and set prices
orderSchema.pre('validate', async function () {
    if (this.garments && this.garments.length > 0) {
        this.garments.forEach((item) => {
            // Use configured price if not provided
            if (!item.pricePerItem) {
                item.pricePerItem = GARMENT_PRICES[item.garmentType] || 50; // default fallback
            }
            item.subtotal = item.quantity * item.pricePerItem;
        });
        this.totalAmount = this.garments.reduce((sum, item) => sum + item.subtotal, 0);
    }
});

module.exports = mongoose.model('Order', orderSchema);
