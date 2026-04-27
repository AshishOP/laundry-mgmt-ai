// Default garment pricing configuration
// Prices in INR (₹)
const GARMENT_PRICES = {
    'Shirt': 40,
    'Pants': 50,
    'T-Shirt': 35,
    'Jeans': 60,
    'Saree': 100,
    'Suit (2pc)': 200,
    'Suit (3pc)': 280,
    'Jacket': 150,
    'Kurta': 45,
    'Dress': 80,
    'Blanket': 120,
    'Bedsheet': 70,
    'Curtain (per piece)': 90,
    'Coat': 180,
    'Sweater': 60,
};

// Estimated processing time in hours per garment type
const PROCESSING_HOURS = {
    'Shirt': 24,
    'Pants': 24,
    'T-Shirt': 24,
    'Jeans': 36,
    'Saree': 48,
    'Suit (2pc)': 48,
    'Suit (3pc)': 48,
    'Jacket': 36,
    'Kurta': 24,
    'Dress': 36,
    'Blanket': 48,
    'Bedsheet': 36,
    'Curtain (per piece)': 48,
    'Coat': 48,
    'Sweater': 36,
};

module.exports = { GARMENT_PRICES, PROCESSING_HOURS };
