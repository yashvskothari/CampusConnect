import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Printer,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { paymentApi } from '../services';
import { formatCurrency, formatDate } from '../utils';
import type { Payment } from '../types';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    paymentApi
      .getById(paymentId)
      .then(({ data }) => {
        setPayment(data);
      })
      .catch((err) => {
        console.error('Failed to load payment receipt:', err);
        toast.error('Could not load payment receipt');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [paymentId]);

  const handleCopyTxnId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Transaction ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-surface-900">Payment Not Found</h1>
          <p className="mt-2 text-sm text-surface-700">
            The requested payment record could not be found. Check your billing history for your active orders.
          </p>
          <div className="mt-6">
            <Link to="/dashboard/client/payments">
              <Button className="w-full">Go to Payment History</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (payment.status !== 'COMPLETED') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          {payment.status === 'PENDING' ? (
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          )}
          <h1 className="text-xl font-bold text-surface-900">
            {payment.status === 'PENDING' ? 'Payment Awaiting Checkout' : `Payment Status: ${payment.status}`}
          </h1>
          <p className="mt-2 text-sm text-surface-700">
            {payment.status === 'PENDING'
              ? 'This transaction has been created but not yet completed. Complete checkout to fund escrow and notify the freelancer.'
              : payment.failureReason || 'This transaction has not completed successfully.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {payment.status === 'PENDING' ? (
              <Link to={`/checkout/${payment.id}`}>
                <Button className="w-full">
                  Complete Payment Now
                </Button>
              </Link>
            ) : (
              <Link to={`/checkout/${payment.id}`}>
                <Button className="w-full">
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Retry Payment
                </Button>
              </Link>
            )}
            <Link to="/dashboard/client/payments">
              <Button variant="outline" className="w-full">View All Transactions</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const txnId = payment.providerPaymentId || payment.providerOrderId || payment.id;
  const itemTitle = payment.job?.title || payment.service?.title || 'Freelance Service Contract';
  const subtotal = payment.amount;
  const platformFee = payment.platformFee || payment.commission;
  const tax = payment.tax || 0;
  const discount = payment.discount || 0;
  const totalAmount = payment.totalAmount || (subtotal + platformFee + tax - discount);

  return (
    <div className="min-h-screen bg-surface-0 py-10 px-4 sm:px-6 lg:px-8 text-surface-900 print:bg-white print:text-black">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ================= SUCCESS BANNER ================= */}
        <div className="text-center space-y-2 print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/15 text-primary-400 mb-2 border border-primary-500/25">
            <CheckCircle2 className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Payment Completed & Secured!
          </h1>
          <p className="text-sm text-surface-700 max-w-md mx-auto">
            Your transaction is verified and held securely in Gigverse Escrow. The freelancer has been notified to begin work.
          </p>
        </div>

        {/* ================= TAX RECEIPT CARD ================= */}
        <Card className="p-6 sm:p-8 bg-surface-100 border border-white/6 shadow-md print:bg-white print:text-black print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-surface-300 gap-4">
            <div>
              <span className="text-xl font-bold tracking-tight text-surface-900 flex items-center gap-1.5 print:text-black">
                Gigverse
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                  Tax Receipt
                </span>
              </span>
              <p className="text-xs text-surface-600 mt-1 font-mono">
                Receipt #{payment.id.slice(0, 14).toUpperCase()}
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                <span>ESCROW SECURED</span>
              </div>
              <p className="text-xs text-surface-600">
                Date: {formatDate(payment.paidAt || payment.createdAt)}
              </p>
            </div>
          </div>

          {/* Parties Meta */}
          <div className="grid grid-cols-2 gap-6 py-5 border-b border-surface-300 text-xs">
            <div>
              <span className="font-semibold uppercase tracking-wider text-surface-600 block mb-1">
                Billed To (Client)
              </span>
              <p className="font-bold text-surface-900 text-sm print:text-black">{payment.client?.name}</p>
              <p className="text-surface-700">{payment.client?.email}</p>
            </div>

            <div>
              <span className="font-semibold uppercase tracking-wider text-surface-600 block mb-1">
                Freelancer / Payee
              </span>
              <p className="font-bold text-surface-900 text-sm print:text-black">{payment.freelancer?.name}</p>
              <p className="text-surface-700">Verified Marketplace Freelancer</p>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="py-3.5 bg-surface-200/50 rounded-xl px-4 my-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs border border-surface-300 print:bg-slate-100 print:text-black">
            <div>
              <span className="text-surface-600">Payment Gateway:</span>{' '}
              <strong className="text-surface-900 print:text-black">Razorpay Standard</strong>
            </div>
            <div>
              <span className="text-surface-600">Payment Method:</span>{' '}
              <strong className="text-surface-900 print:text-black">{payment.paymentMethod || 'Online Checkout'}</strong>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-surface-600">Gateway Transaction ID:</span>{' '}
                <strong className="text-primary-400 font-mono text-[11px]">{txnId}</strong>
              </div>
              <button
                type="button"
                onClick={() => handleCopyTxnId(txnId)}
                className="text-primary-400 hover:text-primary-300 text-xs font-semibold inline-flex items-center gap-1 print:hidden"
                title="Copy Transaction ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-2 py-4 border-b border-surface-300 text-xs">
            <span className="font-semibold uppercase tracking-wider text-surface-600 block">
              Item Details
            </span>
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <p className="font-bold text-surface-900 text-sm print:text-black">{itemTitle}</p>
                <p className="text-surface-600 text-xs mt-0.5">
                  {payment.jobId ? 'Job Milestone Engagement' : 'Freelance Service Package'}
                </p>
              </div>
              <span className="font-bold text-primary-400 text-sm whitespace-nowrap">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-4 space-y-2 text-xs border-b border-surface-300 text-surface-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-surface-900 print:text-black">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Service Fee (10%)</span>
              <span className="font-medium text-surface-900 print:text-black">{formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18% on platform fee)</span>
              <span className="font-medium text-surface-900 print:text-black">{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Coupon Discount ({payment.couponCode || 'PROMO'})</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
          </div>

          {/* Total Paid */}
          <div className="pt-4 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-surface-900 print:text-black">Total Amount Paid</span>
              <p className="text-[10px] text-surface-600">Indian Rupees (INR)</p>
            </div>
            <span className="text-2xl font-black text-primary-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Escrow Disclaimer */}
          <div className="mt-5 pt-4 border-t border-surface-300 text-[11px] text-surface-600 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
            <span>
              <strong>Escrow Protection:</strong> Funds remain securely held in escrow and will be released to the freelancer once you confirm milestone delivery.
            </span>
          </div>
        </Card>

        {/* ================= ACTIONS ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Receipt
          </Button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <Link to="/messages" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Message Freelancer
              </Button>
            </Link>

            <Link to="/dashboard/client/payments" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Payment History
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
