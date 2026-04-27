const { body, validationResult, query } = require('express-validator');

/**
 * Handle validation results
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number'),
    handleValidation,
];

/**
 * Validation rules for login
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidation,
];

/**
 * Validation rules for creating an order
 */
const createOrderValidation = [
    body('customerName')
        .trim()
        .notEmpty().withMessage('Customer name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number (10 digits, starts with 6-9)'),
    body('garments')
        .isArray({ min: 1 }).withMessage('At least one garment is required'),
    body('garments.*.garmentType')
        .trim()
        .notEmpty().withMessage('Garment type is required'),
    body('garments.*.quantity')
        .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    handleValidation,
];

/**
 * Validation for status update
 */
const updateStatusValidation = [
    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'])
        .withMessage('Status must be one of: RECEIVED, PROCESSING, READY, DELIVERED'),
    handleValidation,
];

module.exports = {
    registerValidation,
    loginValidation,
    createOrderValidation,
    updateStatusValidation,
};
