"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const params_1 = require("../utils/params");
const razorpay_1 = require("../utils/razorpay");
const router = (0, express_1.Router)();
// ==========================================
// 1. PUBLIC PAYMENT CONFIGURATION
// ==========================================
router.get('/config', (_req, res) => {
    const configured = (0, razorpay_1.isRazorpayConfigured)();
    const keyId = (0, razorpay_1.getRazorpayKeyId)();
    const isTestMode = (0, razorpay_1.isRazorpayTestMode)();
    res.json({
        configured,
        keyId: configured ? keyId : '',
        currency: 'INR',
        isTestMode,
        platformFeeRate: razorpay_1.PLATFORM_FEE_RATE,
        gstRate: razorpay_1.GST_RATE,
        coupons: Object.entries(razorpay_1.VALID_COUPONS).map(([code, val]) => ({
            code,
            description: val.description,
        })),
    });
});
// ==========================================
// 2. VALIDATE COUPON CODE
// ==========================================
router.post('/apply-coupon', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) {
            res.status(400).json({ error: 'Coupon code is required' });
            return;
        }
        const numSubtotal = Number(subtotal);
        if (isNaN(numSubtotal) || numSubtotal <= 0) {
            res.status(400).json({ error: 'Valid subtotal is required' });
            return;
        }
        const pricing = (0, razorpay_1.calculatePricing)(numSubtotal, String(code));
        if (!pricing.couponApplied) {
            res.status(400).json({ error: 'Invalid or expired coupon code' });
            return;
        }
        res.json({
            valid: true,
            couponCode: pricing.couponApplied,
            discount: pricing.discount,
            breakdown: pricing,
            message: `Coupon applied! You saved ₹${pricing.discount.toLocaleString('en-IN')}`,
        });
    }
    catch (error) {
        console.error('Failed to validate coupon:', error);
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});
// ==========================================
// 3. GET PAYMENTS LIST (Filtered by Role)
// ==========================================
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { clientId, freelancerId, status, search } = req.query;
        const userId = req.user.userId;
        const role = req.user.role;
        // Strict access control:
        // Clients see their payments, freelancers see payments to them, Admin sees all
        let whereClause = {};
        if (role === 'CLIENT') {
            whereClause.clientId = userId;
        }
        else if (role === 'FREELANCER') {
            whereClause.freelancerId = userId;
        }
        else if (role === 'ADMIN') {
            if (clientId)
                whereClause.clientId = String(clientId);
            if (freelancerId)
                whereClause.freelancerId = String(freelancerId);
        }
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            const q = String(search).trim();
            whereClause.OR = [
                { id: { contains: q, mode: 'insensitive' } },
                { providerOrderId: { contains: q, mode: 'insensitive' } },
                { providerPaymentId: { contains: q, mode: 'insensitive' } },
                { job: { title: { contains: q, mode: 'insensitive' } } },
                { service: { title: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const payments = await prisma_1.default.payment.findMany({
            where: whereClause,
            include: {
                client: { select: { id: true, name: true, email: true, avatar: true } },
                freelancer: { select: { id: true, name: true, email: true, avatar: true, rating: true } },
                job: { select: { id: true, title: true, category: true, budget: true, status: true } },
                service: { select: { id: true, title: true, category: true, price: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(payments);
    }
    catch (error) {
        console.error('Failed to fetch payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});
// ==========================================
// 4. GET SINGLE PAYMENT / ORDER DETAILS
// ==========================================
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const userId = req.user.userId;
        const role = req.user.role;
        const payment = await prisma_1.default.payment.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, email: true, avatar: true } },
                freelancer: { select: { id: true, name: true, email: true, avatar: true, rating: true } },
                job: { select: { id: true, title: true, category: true, description: true, budget: true, deadline: true, status: true } },
                service: { select: { id: true, title: true, category: true, description: true, price: true } },
            },
        });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        // Authorization check: Only buyer, seller, or admin can view
        if (payment.clientId !== userId && payment.freelancerId !== userId && role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized to view this payment' });
            return;
        }
        res.json(payment);
    }
    catch (error) {
        console.error('Failed to get payment:', error);
        res.status(500).json({ error: 'Failed to get payment details' });
    }
});
// ==========================================
// 5. CREATE CHECKOUT ORDER (Razorpay)
// ==========================================
router.post('/create-order', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const { paymentId, serviceId, couponCode, orderNotes } = req.body;
        const clientId = req.user.userId;
        let paymentRecord = null;
        let baseAmount = 0;
        let freelancerId = '';
        let jobId = null;
        let linkedServiceId = null;
        let itemTitle = '';
        // Flow A: Existing pending payment (e.g. from an accepted bid)
        if (paymentId) {
            const existing = await prisma_1.default.payment.findUnique({
                where: { id: paymentId },
                include: {
                    job: true,
                    service: true,
                    freelancer: true,
                },
            });
            if (!existing) {
                res.status(404).json({ error: 'Payment record not found' });
                return;
            }
            if (existing.clientId !== clientId && req.user.role !== 'ADMIN') {
                res.status(403).json({ error: 'You are not authorized to pay for this order' });
                return;
            }
            if (existing.status === 'COMPLETED') {
                res.status(400).json({ error: 'This payment has already been completed' });
                return;
            }
            paymentRecord = existing;
            baseAmount = existing.amount;
            freelancerId = existing.freelancerId;
            jobId = existing.jobId;
            linkedServiceId = existing.serviceId;
            itemTitle = existing.job?.title || existing.service?.title || 'Freelance Service';
        }
        // Flow B: Direct checkout for a Service
        else if (serviceId) {
            const service = await prisma_1.default.service.findUnique({
                where: { id: serviceId },
                include: { freelancer: true },
            });
            if (!service) {
                res.status(404).json({ error: 'Service not found' });
                return;
            }
            if (service.freelancerId === clientId) {
                res.status(400).json({ error: 'You cannot purchase your own service' });
                return;
            }
            baseAmount = service.price;
            freelancerId = service.freelancerId;
            linkedServiceId = service.id;
            itemTitle = service.title;
            // Calculate server pricing
            const pricing = (0, razorpay_1.calculatePricing)(baseAmount, couponCode);
            // Create new PENDING payment record
            paymentRecord = await prisma_1.default.payment.create({
                data: {
                    amount: baseAmount,
                    platformFee: pricing.platformFee,
                    commission: pricing.platformFee,
                    tax: pricing.tax,
                    discount: pricing.discount,
                    totalAmount: pricing.totalAmount,
                    freelancerPayout: pricing.freelancerPayout,
                    currency: 'INR',
                    status: 'PENDING',
                    clientId,
                    freelancerId,
                    serviceId: linkedServiceId,
                    couponCode: pricing.couponApplied,
                    orderNotes: orderNotes ? String(orderNotes).trim().slice(0, 500) : null,
                },
                include: {
                    client: true,
                    freelancer: true,
                    service: true,
                },
            });
        }
        else {
            res.status(400).json({ error: 'Either paymentId or serviceId is required' });
            return;
        }
        // Always recalculate pricing on server:
        const pricing = (0, razorpay_1.calculatePricing)(baseAmount, couponCode || paymentRecord.couponCode);
        const amountInPaise = Math.round(pricing.totalAmount * 100);
        let providerOrderId = '';
        const razorpay = (0, razorpay_1.getRazorpay)();
        if (!razorpay) {
            res.status(503).json({
                error: 'Payment provider is not configured. Missing valid Razorpay API keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) in server environment. Payment initiation is blocked until provider credentials are configured.',
                code: 'PROVIDER_NOT_CONFIGURED',
            });
            return;
        }
        try {
            const rzpOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `rcpt_${paymentRecord.id.slice(0, 30)}`,
                notes: {
                    paymentId: paymentRecord.id,
                    clientId,
                    freelancerId,
                    itemTitle: itemTitle.slice(0, 40),
                },
            });
            providerOrderId = rzpOrder.id;
        }
        catch (rzpErr) {
            console.error('Razorpay order creation failed:', rzpErr);
            res.status(502).json({
                error: 'Payment gateway communication failed: ' + (rzpErr.error?.description || rzpErr.message || 'Unknown gateway error'),
            });
            return;
        }
        // Update the payment record with providerOrderId and final calculated figures
        const updatedPayment = await prisma_1.default.payment.update({
            where: { id: paymentRecord.id },
            data: {
                provider: 'RAZORPAY',
                providerOrderId,
                platformFee: pricing.platformFee,
                commission: pricing.platformFee,
                tax: pricing.tax,
                discount: pricing.discount,
                totalAmount: pricing.totalAmount,
                freelancerPayout: pricing.freelancerPayout,
                couponCode: pricing.couponApplied,
                orderNotes: orderNotes ? String(orderNotes).trim().slice(0, 500) : paymentRecord.orderNotes,
                status: 'PENDING',
            },
            include: {
                client: { select: { id: true, name: true, email: true } },
                freelancer: { select: { id: true, name: true, email: true } },
            },
        });
        res.json({
            orderId: providerOrderId,
            paymentId: updatedPayment.id,
            amount: pricing.totalAmount,
            amountInPaise,
            currency: 'INR',
            keyId: (0, razorpay_1.getRazorpayKeyId)(),
            isTestMode: (0, razorpay_1.isRazorpayTestMode)(),
            breakdown: pricing,
            customer: {
                name: updatedPayment.client.name,
                email: updatedPayment.client.email,
            },
            freelancer: {
                id: updatedPayment.freelancer.id,
                name: updatedPayment.freelancer.name,
            },
            itemTitle,
        });
    }
    catch (error) {
        console.error('Failed to create checkout order:', error);
        res.status(500).json({ error: error.message || 'Failed to create checkout order' });
    }
});
// ==========================================
// 6. VERIFY PAYMENT (Cryptographic HMAC check)
// ==========================================
router.post('/verify', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod, } = req.body;
        if (!paymentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({ error: 'Missing required payment verification parameters' });
            return;
        }
        const payment = await prisma_1.default.payment.findUnique({
            where: { id: paymentId },
            include: { job: true, service: true, freelancer: true, client: true },
        });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized for this payment' });
            return;
        }
        // Verify order ID matches
        if (payment.providerOrderId && payment.providerOrderId !== razorpay_order_id) {
            res.status(400).json({ error: 'Order ID mismatch between client and gateway' });
            return;
        }
        // Verify signature cryptographically
        const isValid = (0, razorpay_1.verifyPaymentSignature)({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });
        if (!isValid) {
            await prisma_1.default.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'FAILED',
                    failureReason: 'Cryptographic signature verification failed',
                },
            });
            res.status(400).json({ error: 'Payment signature verification failed' });
            return;
        }
        // Mark as COMPLETED atomically
        const [updatedPayment] = await prisma_1.default.$transaction([
            prisma_1.default.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'COMPLETED',
                    providerPaymentId: razorpay_payment_id,
                    providerSignature: razorpay_signature,
                    paymentMethod: paymentMethod || 'RAZORPAY_CHECKOUT',
                    paidAt: new Date(),
                    failureReason: null,
                },
                include: {
                    client: { select: { id: true, name: true, email: true } },
                    freelancer: { select: { id: true, name: true, email: true } },
                    job: true,
                    service: true,
                },
            }),
            // If payment has an associated job, update job to IN_PROGRESS
            ...(payment.jobId
                ? [
                    prisma_1.default.job.update({
                        where: { id: payment.jobId },
                        data: { status: 'IN_PROGRESS' },
                    }),
                ]
                : []),
        ]);
        res.json({
            success: true,
            message: 'Payment verified and completed successfully!',
            payment: updatedPayment,
        });
    }
    catch (error) {
        console.error('Payment verification failed:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});
// ==========================================
// 7. SIMULATE SUCCESS (Disabled - Real Verification Enforced)
// ==========================================
router.post('/simulate-success', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (_req, res) => {
    res.status(403).json({
        error: 'Payment simulation is disabled. Real cryptographic verification via the payment gateway is required.',
    });
});
// ==========================================
// 8. SIMULATE / RECORD PAYMENT FAILURE (For testing)
// ==========================================
router.post('/:id/fail', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const { reason = 'Payment declined by bank or user cancelled' } = req.body;
        const payment = await prisma_1.default.payment.findUnique({ where: { id } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const updated = await prisma_1.default.payment.update({
            where: { id },
            data: {
                status: 'FAILED',
                failureReason: String(reason),
            },
        });
        res.json({ success: true, payment: updated });
    }
    catch (error) {
        console.error('Failed to mark payment as failed:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});
// ==========================================
// 9. CANCEL PENDING PAYMENT
// ==========================================
router.post('/:id/cancel', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const payment = await prisma_1.default.payment.findUnique({ where: { id } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        if (payment.status === 'COMPLETED') {
            res.status(400).json({ error: 'Cannot cancel an already completed payment' });
            return;
        }
        const updated = await prisma_1.default.payment.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
        res.json({ success: true, message: 'Payment cancelled', payment: updated });
    }
    catch (error) {
        console.error('Failed to cancel payment:', error);
        res.status(500).json({ error: 'Failed to cancel payment' });
    }
});
// ==========================================
// 10. RETRY FAILED OR CANCELLED PAYMENT
// ==========================================
router.post('/:id/retry', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('CLIENT', 'ADMIN'), async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const payment = await prisma_1.default.payment.findUnique({ where: { id } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        if (payment.status === 'COMPLETED') {
            res.status(400).json({ error: 'Payment has already succeeded' });
            return;
        }
        const updated = await prisma_1.default.payment.update({
            where: { id },
            data: {
                status: 'PENDING',
                failureReason: null,
            },
        });
        res.json({ success: true, message: 'Payment reset for retry', payment: updated });
    }
    catch (error) {
        console.error('Failed to retry payment:', error);
        res.status(500).json({ error: 'Failed to reset payment for retry' });
    }
});
// ==========================================
// 11. RAZORPAY WEBHOOK (Idempotent Listener)
// ==========================================
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        if (!signature) {
            res.status(400).json({ error: 'Missing x-razorpay-signature header' });
            return;
        }
        const isValid = (0, razorpay_1.verifyWebhookSignature)(rawBody, signature);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
        }
        const event = req.body?.event;
        const payload = req.body?.payload;
        if (!event || !payload) {
            res.status(400).json({ error: 'Malformed webhook payload' });
            return;
        }
        console.log(`Razorpay webhook received: ${event}`);
        // Idempotent event processing
        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment?.entity;
            const orderEntity = payload.order?.entity;
            const providerOrderId = orderEntity?.id || paymentEntity?.order_id;
            const providerPaymentId = paymentEntity?.id;
            const paymentMethod = paymentEntity?.method;
            const notePaymentId = paymentEntity?.notes?.paymentId || orderEntity?.notes?.paymentId;
            const payment = await prisma_1.default.payment.findFirst({
                where: {
                    OR: [
                        ...(providerOrderId ? [{ providerOrderId }] : []),
                        ...(providerPaymentId ? [{ providerPaymentId }] : []),
                        ...(notePaymentId ? [{ id: notePaymentId }] : []),
                    ],
                },
            });
            if (payment && payment.status !== 'COMPLETED') {
                await prisma_1.default.$transaction([
                    prisma_1.default.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'COMPLETED',
                            providerPaymentId: providerPaymentId || payment.providerPaymentId,
                            paymentMethod: paymentMethod ? String(paymentMethod).toUpperCase() : payment.paymentMethod,
                            paidAt: new Date(),
                            failureReason: null,
                        },
                    }),
                    ...(payment.jobId
                        ? [
                            prisma_1.default.job.update({
                                where: { id: payment.jobId },
                                data: { status: 'IN_PROGRESS' },
                            }),
                        ]
                        : []),
                ]);
                console.log(`Payment ${payment.id} reconciled via webhook as COMPLETED`);
            }
        }
        else if (event === 'payment.failed') {
            const paymentEntity = payload.payment?.entity;
            const providerOrderId = paymentEntity?.order_id;
            const errorDescription = paymentEntity?.error_description || 'Payment failed';
            if (providerOrderId) {
                const payment = await prisma_1.default.payment.findFirst({
                    where: { providerOrderId },
                });
                if (payment && payment.status === 'PENDING') {
                    await prisma_1.default.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'FAILED',
                            failureReason: errorDescription,
                        },
                    });
                    console.log(`Payment ${payment.id} reconciled via webhook as FAILED`);
                }
            }
        }
        else if (event === 'refund.processed') {
            const refundEntity = payload.refund?.entity;
            const providerPaymentId = refundEntity?.payment_id;
            if (providerPaymentId) {
                const payment = await prisma_1.default.payment.findFirst({
                    where: { providerPaymentId },
                });
                if (payment) {
                    await prisma_1.default.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'REFUNDED',
                            refundStatus: 'REFUNDED',
                            refundAmount: refundEntity.amount ? refundEntity.amount / 100 : payment.totalAmount,
                            refundId: refundEntity.id,
                        },
                    });
                    console.log(`Payment ${payment.id} marked as REFUNDED via webhook`);
                }
            }
        }
        res.json({ received: true, event });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing error' });
    }
});
// ==========================================
// 12. BACKWARD COMPATIBLE MOCK CHECKOUT
// (Retained for existing legacy calls)
// ==========================================
router.post('/mock-checkout', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            res.status(400).json({ error: 'Payment ID required' });
            return;
        }
        const payment = await prisma_1.default.payment.findUnique({ where: { id: paymentId } });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }
        if (payment.clientId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        res.json({
            checkoutUrl: `/checkout/${paymentId}`,
            paymentId,
            amount: payment.totalAmount || payment.amount,
            commission: payment.platformFee || payment.commission,
            freelancerPayout: payment.freelancerPayout || (payment.amount - payment.commission),
            message: 'Checkout session ready',
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to create checkout' });
    }
});
// Insecure simulation disabled - real cryptographic verification via Razorpay required
router.post('/mock-complete', auth_middleware_1.authenticate, async (_req, res) => {
    res.status(403).json({
        error: 'Payment simulation is disabled. Real cryptographic verification via the payment gateway is required.',
    });
});
exports.default = router;
