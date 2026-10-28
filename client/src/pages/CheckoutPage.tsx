import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Clock,
  Tag,
  Check,
  X,
  Info,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { paymentApi, serviceApi } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils';
import { loadRazorpayScript, type RazorpayOptions } from '../utils/razorpay';
import type { Payment, Service, CheckoutConfig } from '../types';

type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

export default function CheckoutPage() {
  const { paymentId, serviceId } = useParams<{ paymentId?: string; serviceId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Core state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [service, setService] = useState<Service | null>(null);

  // Selected payment method tab
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');

  // Pricing & Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // UPI state
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [upiId, setUpiId] = useState('');
  const [upiIdValid, setUpiIdValid] = useState<boolean | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrTimer, setQrTimer] = useState<number>(600); // 10 minutes

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // Net Banking state
  const [selectedBank, setSelectedBank] = useState<string>('HDFC');

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState<string>('paytm');

  // Error state
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Load gateway config and checkout target
  useEffect(() => {
    let isMounted = true;

    async function initCheckout() {
      setLoading(true);
      try {
        const { data: cfg } = await paymentApi.getConfig();
        if (isMounted) setConfig(cfg);

        // Preload Razorpay checkout script
        loadRazorpayScript().catch(() => {});

        if (paymentId) {
          const { data: p } = await paymentApi.getById(paymentId);
          if (isMounted) {
            setPayment(p);
            if (p.couponCode) {
              setAppliedCoupon(p.couponCode);
              setCouponDiscount(p.discount || 0);
            }
            if (p.orderNotes) setOrderNotes(p.orderNotes);
          }
        } else if (serviceId) {
          const { data: s } = await serviceApi.getById(serviceId);
          if (isMounted) setService(s);
        }
      } catch (err: any) {
        console.error('Failed to initialize checkout:', err);
        toast.error(err.response?.data?.error || 'Failed to load checkout details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initCheckout();

    return () => {
      isMounted = false;
    };
  }, [paymentId, serviceId]);

  // Countdown timer for QR code
  useEffect(() => {
    if (!showQrCode) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showQrCode]);

  // Pricing calculations
  const subtotal = useMemo(() => {
    if (payment) return payment.amount;
    if (service) return service.price;
    return 0;
  }, [payment, service]);

  const platformFeeRate = config?.platformFeeRate ?? 0.10;
  const gstRate = config?.gstRate ?? 0.18;

  const platformFee = Math.round(subtotal * platformFeeRate);
  const tax = Math.round(platformFee * gstRate);
  const totalAmount = Math.max(1, Math.round(subtotal + platformFee + tax - couponDiscount));

  // Card brand detection
  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^6(0|5)/.test(clean) || /^508/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return null;
  }, [cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  const validateUpi = (value: string) => {
    setUpiId(value);
    const isValid = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
    setUpiIdValid(value ? isValid : null);
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    try {
      const { data } = await paymentApi.applyCoupon({ code, subtotal });
      setAppliedCoupon(data.couponCode);
      setCouponDiscount(data.discount);
      setCouponInput('');
      toast.success(data.message || 'Coupon applied successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast.success('Coupon removed');
  };

  const handlePayNow = async () => {
    if (!user) {
      toast.error('Please sign in to proceed with checkout');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user.role === 'FREELANCER') {
      toast.error('Only Client accounts can checkout services and jobs. Please sign in as a Client.');
      return;
    }

    if (selectedMethod === 'card' && !config?.isTestMode) {
      if (cardNumber.replace(/\s+/g, '').length < 15) {
        toast.error('Please enter a valid card number');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        toast.error('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    if (selectedMethod === 'upi' && !showQrCode && !selectedUpiApp && !upiIdValid) {
      toast.error('Please select a UPI app, enter a valid UPI ID, or scan the QR Code');
      return;
    }

    if (config && !config.configured) {
      toast.error('Payment gateway is not configured. Missing Razorpay API keys.');
      setVerificationError('Payment gateway is not configured in server environment (missing Razorpay API credentials).');
      return;
    }

    setProcessing(true);
    setVerificationError(null);

    try {
      const { data: orderData } = await paymentApi.createOrder({
        paymentId: payment?.id,
        serviceId: service?.id,
        couponCode: appliedCoupon || undefined,
        orderNotes: orderNotes.trim() || undefined,
      });

      const currentPaymentId = orderData.paymentId;

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !(window as any).Razorpay) {
        throw new Error('Could not load Razorpay payment gateway SDK. Please check your connection.');
      }

      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'Gigverse Marketplace',
        description: orderData.itemTitle || 'Freelance Service Checkout',
        order_id: orderData.orderId,
        image: '/favicon.png',
        prefill: {
          name: user.name,
          email: user.email,
          method: selectedMethod === 'upi' ? 'upi' : selectedMethod === 'card' ? 'card' : selectedMethod === 'netbanking' ? 'netbanking' : 'wallet',
        },
        theme: {
          color: '#10b981', // Matching Gigverse Primary Green
          backdrop_color: '#0a0a0f',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast('Checkout modal closed. You can retry anytime.', { icon: 'ℹ️' });
          },
        },
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment({
              paymentId: currentPaymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentMethod: selectedMethod.toUpperCase(),
            });

            toast.success('Payment verified successfully!');
            navigate(`/payment/success?paymentId=${currentPaymentId}`);
          } catch (verifyErr: any) {
            console.error('Payment verification failed:', verifyErr);
            setVerificationError(
              verifyErr.response?.data?.error || 'Payment signature verification failed. Please contact support.'
            );
            toast.error('Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', async (failedResponse: any) => {
        setProcessing(false);
        const reason = failedResponse.error?.description || 'Payment failed';
        await paymentApi.simulateFailure(currentPaymentId, reason).catch(() => {});
        setVerificationError(`Payment failed: ${reason}`);
        toast.error(`Payment failed: ${reason}`);
      });

      razorpay.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Payment processing failed';
      setVerificationError(errMsg);
      toast.error(errMsg);
      setProcessing(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const itemTitle = payment?.job?.title || payment?.service?.title || service?.title || 'Freelance Service';
  const itemCategory = payment?.job?.category || payment?.service?.category || service?.category || 'Service';
  const freelancer = payment?.freelancer || service?.freelancer;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!payment && !service) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-900">Order Not Found</h2>
          <p className="mt-2 text-sm text-surface-700">
            The requested checkout reference could not be found or has expired.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/services">
              <Button className="w-full">Browse Services</Button>
            </Link>
            <Link to="/dashboard/client/payments">
              <Button variant="outline" className="w-full">View Payment History</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 text-surface-900 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= PAGE TITLE / BREADCRUMB ================= */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Secure Checkout
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Review & Complete Payment
            </h1>
            <p className="mt-1 text-sm text-surface-700">
              Funds are held safely in Gigverse Escrow until work is delivered and approved.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs text-primary-400 font-medium self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
            <span>256-bit SSL Encrypted • Escrow Protected</span>
          </div>
        </div>

        {/* ================= CONFIGURATION & TEST MODE NOTICES ================= */}
        {config && !config.configured && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Payment Gateway Credentials Required</strong>
              <span>
                Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured or are placeholder values in the server environment. Checkout is blocked until valid provider keys are provided.
              </span>
            </div>
          </div>
        )}

        {config && config.configured && config.isTestMode && (
          <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/25 p-3.5 text-xs text-blue-300 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Razorpay Test Mode Active:</strong> Payments are processed via Razorpay test mode. You can use official Razorpay test cards or test UPI VPAs without real charges.
            </span>
          </div>
        )}

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: PAYMENT METHODS ================= */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Payment Method</h2>
                  <p className="text-xs text-surface-700 mt-0.5">
                    Select your preferred Indian payment option.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-surface-600">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono">PCI-DSS</span>
                </div>
              </div>

              {/* Method Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-surface-200 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition ${
                    selectedMethod === 'upi'
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                      : 'text-surface-700 hover:text-surface-900'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-primary-400" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition ${
                    selectedMethod === 'card'
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                      : 'text-surface-700 hover:text-surface-900'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-primary-400" />
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition ${
                    selectedMethod === 'netbanking'
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                      : 'text-surface-700 hover:text-surface-900'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-primary-400" />
                  <span>Net Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('wallet')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition ${
                    selectedMethod === 'wallet'
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                      : 'text-surface-700 hover:text-surface-900'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-primary-400" />
                  <span>Wallets</span>
                </button>
              </div>

              {/* ================= TAB 1: UPI ================= */}
              {selectedMethod === 'upi' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-2">
                      Popular UPI Apps
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'gpay', name: 'Google Pay', icon: '⚡' },
                        { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                        { id: 'paytm', name: 'Paytm UPI', icon: '🔷' },
                        { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳' },
                      ].map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => {
                            setSelectedUpiApp(app.id);
                            setShowQrCode(false);
                          }}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                            selectedUpiApp === app.id && !showQrCode
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-surface-300 hover:border-surface-400 bg-surface-200/50 text-surface-800'
                          }`}
                        >
                          <span className="text-base">{app.icon}</span>
                          <span className="text-xs font-semibold">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                      Or enter your UPI ID (VPA)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => validateUpi(e.target.value)}
                        placeholder="username@okhdfcbank or 9876543210@upi"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface-200 text-sm text-surface-900 placeholder:text-surface-600 focus:outline-none transition ${
                          upiIdValid === true
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : upiIdValid === false
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-surface-400 focus:border-primary-500'
                        }`}
                      />
                      {upiIdValid === true && (
                        <Check className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                      )}
                    </div>
                    <p className="text-[11px] text-surface-600 mt-1">
                      A payment request will be sent to your UPI app upon checkout.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-300">
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary-400 hover:text-primary-300"
                    >
                      <QrCode className="w-4 h-4" />
                      {showQrCode ? 'Hide QR Code' : 'Scan Dynamic UPI QR Code'}
                    </button>

                    {showQrCode && (
                      <div className="mt-4 p-4 rounded-xl bg-surface-200 border border-surface-300 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <div className="p-2.5 bg-white rounded-xl shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              `upi://pay?pa=razorpay@icici&pn=Gigverse&am=${totalAmount}&cu=INR&tn=Gigverse-Order-${payment?.id || service?.id}`
                            )}`}
                            alt="UPI QR Code"
                            className="w-32 h-32"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Valid for {formatTimer(qrTimer)}</span>
                          </div>
                          <h4 className="text-sm font-bold text-surface-900">
                            Scan with any UPI App
                          </h4>
                          <p className="text-xs text-surface-700 leading-relaxed">
                            Scan with Google Pay, PhonePe, Paytm, or BHIM to pay{' '}
                            <strong className="text-primary-400">{formatCurrency(totalAmount)}</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 2: CARDS ================= */}
              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 •••• •••• 8892"
                        className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-surface-400 bg-surface-200 text-sm font-mono text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
                      />
                      {cardBrand && (
                        <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-surface-300 text-primary-400 uppercase">
                          {cardBrand}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name as printed on card"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-400 bg-surface-200 text-sm text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM / YY"
                        maxLength={5}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-400 bg-surface-200 text-sm font-mono text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="3 or 4 digits"
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-surface-400 bg-surface-200 text-sm font-mono text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="save-card"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="rounded border-surface-400 text-primary-500 focus:ring-primary-500 bg-surface-200 h-4 w-4"
                    />
                    <label htmlFor="save-card" className="text-xs text-surface-700">
                      Save card securely per RBI tokenization guidelines
                    </label>
                  </div>

                  <div className="p-3 bg-surface-200/50 rounded-xl border border-surface-300 text-xs text-surface-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                    <span>
                      3-D Secure OTP verified with your issuing bank. Raw card numbers are never stored on Gigverse servers.
                    </span>
                  </div>
                </div>
              )}

              {/* ================= TAB 3: NET BANKING ================= */}
              {selectedMethod === 'netbanking' && (
                <div className="space-y-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600">
                    Popular Indian Banks
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { code: 'HDFC', name: 'HDFC Bank' },
                      { code: 'ICIC', name: 'ICICI Bank' },
                      { code: 'SBIN', name: 'State Bank of India' },
                      { code: 'UTIB', name: 'Axis Bank' },
                      { code: 'KKBK', name: 'Kotak Bank' },
                      { code: 'PUNB', name: 'Punjab National' },
                    ].map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.code)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedBank === b.code
                            ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                            : 'border-surface-300 hover:border-surface-400 bg-surface-200/50 text-surface-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{b.name}</div>
                        <div className="text-[10px] text-surface-600 font-mono mt-0.5">{b.code}</div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Or select another bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-400 bg-surface-200 text-sm text-surface-900 focus:outline-none focus:border-primary-500"
                    >
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICIC">ICICI Bank</option>
                      <option value="SBIN">State Bank of India</option>
                      <option value="UTIB">Axis Bank</option>
                      <option value="KKBK">Kotak Mahindra Bank</option>
                      <option value="BARB_R">Bank of Baroda</option>
                      <option value="CNRB">Canara Bank</option>
                      <option value="IDFB">IDFC First Bank</option>
                      <option value="YESB">Yes Bank</option>
                      <option value="INDB">IndusInd Bank</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: WALLETS ================= */}
              {selectedMethod === 'wallet' && (
                <div className="space-y-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600">
                    Supported Wallets
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'paytm', name: 'Paytm Wallet', desc: 'Direct balance or postpaid' },
                      { id: 'phonepe', name: 'PhonePe Wallet', desc: 'Instant wallet transfer' },
                      { id: 'amazon', name: 'Amazon Pay', desc: 'Use Amazon gift balance' },
                      { id: 'mobikwik', name: 'MobiKwik', desc: 'Wallet & ZIP PayLater' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallet(w.id)}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          selectedWallet === w.id
                            ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                            : 'border-surface-300 hover:border-surface-400 bg-surface-200/50 text-surface-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{w.name}</div>
                        <div className="text-[11px] text-surface-600 mt-0.5">{w.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Notes Field */}
              <div className="mt-6 pt-5 border-t border-surface-300">
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Order Note / Requirements for Freelancer (Optional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Share any special instructions, preferences, or timeline notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-surface-400 bg-surface-200 text-xs text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
                />
              </div>
            </Card>

            {/* Escrow Guarantee Box */}
            <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-primary-300">
                  Gigverse 100% Escrow Protection
                </h4>
                <p className="text-xs text-surface-700 mt-1 leading-relaxed">
                  Your payment is securely held until you review and approve the completed work. Funds are protected by our satisfaction policy.
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ORDER SUMMARY ================= */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <h3 className="text-base font-bold text-surface-900 pb-3 border-b border-surface-300">
                Order Summary
              </h3>

              {/* Item Details */}
              <div className="py-4 flex gap-3.5 items-start border-b border-surface-300">
                <div className="w-11 h-11 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center font-bold text-base shrink-0">
                  {itemTitle.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                    {itemCategory}
                  </span>
                  <h4 className="text-sm font-semibold text-surface-900 mt-1 line-clamp-2">
                    {itemTitle}
                  </h4>
                  {freelancer && (
                    <p className="text-xs text-surface-700 mt-1">
                      Freelancer: <span className="text-surface-900 font-medium">{freelancer.name}</span>
                    </p>
                  )}
                  {payment?.id && (
                    <p className="text-[11px] text-surface-600 mt-0.5 font-mono">
                      Ref: #{payment.id.slice(0, 12)}
                    </p>
                  )}
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="py-4 border-b border-surface-300 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-surface-800">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary-400" />
                    Coupon / Promo Code
                  </span>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-400 hover:underline flex items-center gap-0.5 text-xs"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-primary-500/10 border border-primary-500/20 rounded-xl text-xs text-primary-300">
                    <span className="font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4 text-primary-400" />
                      {appliedCoupon} Applied!
                    </span>
                    <span className="font-bold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME50"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-surface-400 bg-surface-200 text-xs font-mono uppercase text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </Button>
                  </div>
                )}

                {/* Available Coupons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {config?.coupons?.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-200 hover:bg-primary-500/15 hover:text-primary-400 text-surface-700 border border-surface-300 transition"
                      title={c.description}
                    >
                      +{c.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="py-4 space-y-2 text-xs text-surface-700 border-b border-surface-300">
                <div className="flex justify-between">
                  <span>Base Amount</span>
                  <span className="font-medium text-surface-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Platform Fee (10%)</span>
                  <span className="font-medium text-surface-900">{formatCurrency(platformFee)}</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (18% on platform fee)</span>
                  <span className="font-medium text-surface-900">{formatCurrency(tax)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
              </div>

              {/* Final Amount */}
              <div className="pt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-surface-600 font-medium">Total Payable (INR)</span>
                  <p className="text-[10px] text-surface-600">Taxes & fees included</p>
                </div>
                <span className="text-2xl font-black text-primary-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {/* Error Alert */}
              {verificationError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{verificationError}</span>
                </div>
              )}

              {/* Pay Button */}
              <Button
                className="w-full mt-6 py-3 text-base font-semibold"
                onClick={handlePayNow}
                disabled={processing || (config !== null && !config.configured)}
                loading={processing}
              >
                {!processing && <Lock className="w-4 h-4 mr-1.5" />}
                {config && !config.configured
                  ? 'Gateway Unconfigured'
                  : `Pay ${formatCurrency(totalAmount)}`}
              </Button>

              <p className="mt-3 text-[11px] text-center text-surface-600">
                Safe payment processing via Razorpay. No card details stored.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
