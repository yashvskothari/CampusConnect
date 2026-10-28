import Razorpay from 'razorpay';
import crypto from 'crypto';

export const PLATFORM_FEE_RATE = 0.10; // 10% Gigverse platform fee
export const GST_RATE = 0.18; // 18% GST on platform fee

export interface PricingBreakdown {
  subtotal: number;
  platformFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  freelancerPayout: number;
  couponApplied?: string | null;
}

export const VALID_COUPONS: Record<
  string,
  {
    type: 'platform_fee_percent' | 'total_percent' | 'flat';
    value: number;
    maxDiscount?: number;
    description: string;
  }
> = {
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

export function calculatePricing(
  subtotal: number,
  couponCode?: string | null
): PricingBreakdown {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const platformFee = Math.round(safeSubtotal * PLATFORM_FEE_RATE);
  const tax = Math.round(platformFee * GST_RATE);

  let discount = 0;
  let validCoupon: string | null = null;

  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    const coupon = VALID_COUPONS[code];
    if (coupon) {
      validCoupon = code;
      if (coupon.type === 'platform_fee_percent') {
        const disc = Math.round((platformFee * coupon.value) / 100);
        discount = coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
      } else if (coupon.type === 'total_percent') {
        const disc = Math.round((safeSubtotal * coupon.value) / 100);
        discount = coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
      } else if (coupon.type === 'flat') {
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

export const getRazorpayKeyId = (): string => {
  return process.env.RAZORPAY_KEY_ID || '';
};

export const getRazorpayKeySecret = (): string => {
  return process.env.RAZORPAY_KEY_SECRET || '';
};

export const getRazorpayWebhookSecret = (): string => {
  return process.env.RAZORPAY_WEBHOOK_SECRET || '';
};

export const isRazorpayConfigured = (): boolean => {
  const key = getRazorpayKeyId();
  const secret = getRazorpayKeySecret();
  return Boolean(
    key &&
    secret &&
    !key.includes('placeholder') &&
    !secret.includes('placeholder') &&
    key.startsWith('rzp_')
  );
};

export const isRazorpayTestMode = (): boolean => {
  const key = getRazorpayKeyId();
  return key.startsWith('rzp_test_');
};

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay | null => {
  if (!isRazorpayConfigured()) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return razorpayInstance;
};

/**
 * Validates Razorpay checkout HMAC-SHA256 signature
 */
export const verifyPaymentSignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  if (!orderId || !paymentId || !signature) return false;

  const secret = getRazorpayKeySecret();
  if (!secret || secret.includes('placeholder')) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuf = Buffer.from(signature, 'utf-8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
};

/**
 * Validates Razorpay Webhook signature
 */
export const verifyWebhookSignature = (
  rawBody: Buffer | string,
  signature: string
): boolean => {
  const webhookSecret = getRazorpayWebhookSecret();
  if (!signature || !webhookSecret || webhookSecret.includes('placeholder')) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuf = Buffer.from(signature, 'utf-8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
};
