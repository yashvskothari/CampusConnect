"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.verifyPaymentSignature = exports.getRazorpay = exports.isRazorpayTestMode = exports.isRazorpayConfigured = exports.getRazorpayWebhookSecret = exports.getRazorpayKeySecret = exports.getRazorpayKeyId = exports.VALID_COUPONS = exports.GST_RATE = exports.PLATFORM_FEE_RATE = void 0;
exports.calculatePricing = calculatePricing;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
exports.PLATFORM_FEE_RATE = 0.10; // 10% Gigverse platform fee
exports.GST_RATE = 0.18; // 18% GST on platform fee
exports.VALID_COUPONS = {
    WELCOME50: {
        type: 'platform_fee_percent',
        value: 50,
        maxDiscount: 250,
        description: '50% off Gigverse platform fee (up to ₹250)',
    },
    GIGVERSE10: {
        type: 'total_percent',
        value: 10,
        maxDiscount: 500,
        description: '10% off order subtotal (up to ₹500)',
    },
    FREESHIP: {
        type: 'platform_fee_percent',
        value: 100,
        maxDiscount: 1000,
        description: '100% waived platform fee',
    },
    STUDENT20: {
        type: 'total_percent',
        value: 20,
        maxDiscount: 400,
        description: '20% off student community discount (up to ₹400)',
    },
};
function calculatePricing(subtotal, couponCode) {
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const platformFee = Math.round(safeSubtotal * exports.PLATFORM_FEE_RATE);
    const tax = Math.round(platformFee * exports.GST_RATE);
    let discount = 0;
    let validCoupon = null;
    if (couponCode) {
        const code = couponCode.trim().toUpperCase();
        const coupon = exports.VALID_COUPONS[code];
        if (coupon) {
            validCoupon = code;
            if (coupon.type === 'platform_fee_percent') {
                const disc = Math.round((platformFee * coupon.value) / 100);
                discount = coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
            }
            else if (coupon.type === 'total_percent') {
                const disc = Math.round((safeSubtotal * coupon.value) / 100);
                discount = coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
            }
            else if (coupon.type === 'flat') {
                discount = coupon.value;
            }
        }
    }
    const totalAmount = Math.max(1, Math.round(safeSubtotal + platformFee + tax - discount));
    // In a marketplace, the freelancer receives the agreed service/bid amount:
    const freelancerPayout = safeSubtotal;
    return {
        subtotal: safeSubtotal,
        platformFee,
        tax,
        discount,
        totalAmount,
        freelancerPayout,
        couponApplied: validCoupon,
    };
}
const getRazorpayKeyId = () => {
    return process.env.RAZORPAY_KEY_ID || '';
};
exports.getRazorpayKeyId = getRazorpayKeyId;
const getRazorpayKeySecret = () => {
    return process.env.RAZORPAY_KEY_SECRET || '';
};
exports.getRazorpayKeySecret = getRazorpayKeySecret;
const getRazorpayWebhookSecret = () => {
    return process.env.RAZORPAY_WEBHOOK_SECRET || '';
};
exports.getRazorpayWebhookSecret = getRazorpayWebhookSecret;
const isRazorpayConfigured = () => {
    const key = (0, exports.getRazorpayKeyId)();
    const secret = (0, exports.getRazorpayKeySecret)();
    return Boolean(key &&
        secret &&
        !key.includes('placeholder') &&
        !secret.includes('placeholder') &&
        key.startsWith('rzp_'));
};
exports.isRazorpayConfigured = isRazorpayConfigured;
const isRazorpayTestMode = () => {
    const key = (0, exports.getRazorpayKeyId)();
    return key.startsWith('rzp_test_');
};
exports.isRazorpayTestMode = isRazorpayTestMode;
let razorpayInstance = null;
const getRazorpay = () => {
    if (!(0, exports.isRazorpayConfigured)()) {
        return null;
    }
    if (!razorpayInstance) {
        razorpayInstance = new razorpay_1.default({
            key_id: (0, exports.getRazorpayKeyId)(),
            key_secret: (0, exports.getRazorpayKeySecret)(),
        });
    }
    return razorpayInstance;
};
exports.getRazorpay = getRazorpay;
/**
 * Validates Razorpay checkout HMAC-SHA256 signature
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature, }) => {
    if (!orderId || !paymentId || !signature)
        return false;
    const secret = (0, exports.getRazorpayKeySecret)();
    if (!secret || secret.includes('placeholder'))
        return false;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuf = Buffer.from(signature, 'utf-8');
    if (expectedBuf.length !== signatureBuf.length) {
        return false;
    }
    try {
        return crypto_1.default.timingSafeEqual(expectedBuf, signatureBuf);
    }
    catch {
        return false;
    }
};
exports.verifyPaymentSignature = verifyPaymentSignature;
/**
 * Validates Razorpay Webhook signature
 */
const verifyWebhookSignature = (rawBody, signature) => {
    const webhookSecret = (0, exports.getRazorpayWebhookSecret)();
    if (!signature || !webhookSecret || webhookSecret.includes('placeholder'))
        return false;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuf = Buffer.from(signature, 'utf-8');
    if (expectedBuf.length !== signatureBuf.length) {
        return false;
    }
    try {
        return crypto_1.default.timingSafeEqual(expectedBuf, signatureBuf);
    }
    catch {
        return false;
    }
};
exports.verifyWebhookSignature = verifyWebhookSignature;
