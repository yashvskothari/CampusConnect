import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CreditCard,
  FileText,
  RotateCcw,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../services';
import { formatCurrency, formatDate } from '../../utils';
import type { Payment } from '../../types';

export default function ClientPaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await paymentApi.getAll();
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
      toast.error('Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePayNow = (paymentId: string) => {
    navigate(`/checkout/${paymentId}`);
  };

  const handleRetry = async (paymentId: string) => {
    setRetryingId(paymentId);
    try {
      await paymentApi.retryPayment(paymentId);
      toast.success('Payment reset for retry');
      navigate(`/checkout/${paymentId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to retry payment');
    } finally {
      setRetryingId(null);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (p.job?.title || p.service?.title || '').toLowerCase();
      const freelancer = (p.freelancer?.name || '').toLowerCase();
      const id = p.id.toLowerCase();
      const txn = (p.providerPaymentId || '').toLowerCase();
      return title.includes(q) || freelancer.includes(q) || id.includes(q) || txn.includes(q);
    }
    return true;
  });

  const totalSpent = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.totalAmount || p.amount), 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.totalAmount || p.amount), 0);

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Billing & Transactions
            {isAdmin && (
              <span className="ml-2 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                ADMIN AUDIT VIEW (ALL USERS)
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            {isAdmin ? 'Platform Transactions & Audit' : 'Payment History & Invoices'}
          </h1>
          <p className="mt-1 text-sm text-surface-700">
            {isAdmin
              ? 'Complete overview of all client payments, platform fees, and escrow settlements across Gigverse.'
              : 'Track all orders, escrow milestone payments, and download official tax receipts.'}
          </p>
        </div>

        <Link to="/services">
          <Button size="sm" variant="outline">
            Browse Services
          </Button>
        </Link>
      </div>

      {/* ================= SUMMARY STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-surface-600 font-medium">Total Completed Paid</p>
              <p className="text-xl font-bold text-surface-900 mt-0.5">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-surface-600 font-medium">Pending Checkout</p>
              <p className="text-xl font-bold text-surface-900 mt-0.5">
                {formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-surface-600 font-medium">Escrow Protected</p>
              <p className="text-xl font-bold text-surface-900 mt-0.5">
                {payments.length} Transactions
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ================= FILTERS & SEARCH ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-surface-100 rounded-xl border border-white/6">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'FAILED', label: 'Failed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                  : 'text-surface-700 hover:text-surface-900 hover:bg-surface-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-surface-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-300 bg-surface-0 text-xs text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* ================= PAYMENT LIST ================= */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description={
            filterStatus === 'ALL'
              ? 'When you order a service or accept a freelancer bid, your payment records will show here.'
              : `No payments currently match the "${filterStatus}" status filter.`
          }
          action={
            <Link to="/services">
              <Button size="sm">Browse Services</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((p) => {
            const itemTitle = p.job?.title || p.service?.title || 'Freelance Service';
            const baseAmount = p.amount;
            const fee = p.platformFee || p.commission;
            const tax = p.tax || 0;
            const discount = p.discount || 0;
            const total = p.totalAmount || (baseAmount + fee + tax - discount);

            return (
              <Card
                key={p.id}
                className="border border-white/6 bg-surface-100 hover:border-primary-500/25 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-mono text-surface-600 bg-surface-200 px-2 py-0.5 rounded">
                        #{p.id.slice(0, 10)}
                      </span>
                      <Badge status={p.status} />
                      {p.paymentMethod && (
                        <span className="text-[11px] text-surface-700 bg-surface-200 px-2 py-0.5 rounded font-mono">
                          {p.paymentMethod}
                        </span>
                      )}
                      <span className="text-xs text-surface-600">
                        {formatDate(p.paidAt || p.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-surface-900 line-clamp-1">
                      {itemTitle}
                    </h3>

                    <p className="text-xs text-surface-700 flex items-center gap-2 flex-wrap">
                      {isAdmin && (
                        <>
                          <span>Client: <strong>{p.client?.name || 'Client'}</strong> ({p.client?.email})</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Freelancer: <strong>{p.freelancer?.name || 'Freelancer'}</strong></span>
                      {p.providerPaymentId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-surface-600">Txn: {p.providerPaymentId}</span>
                        </>
                      )}
                    </p>

                    {/* Breakdown pill */}
                    <div className="text-[11px] text-surface-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span>Base: {formatCurrency(baseAmount)}</span>
                      <span>Platform Fee: {formatCurrency(fee)}</span>
                      {tax > 0 && <span>GST: {formatCurrency(tax)}</span>}
                      {discount > 0 && (
                        <span className="text-emerald-400">Saved: -{formatCurrency(discount)}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-white/6 pt-4 lg:pt-0 gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-surface-600 font-medium">
                        Total Amount
                      </p>
                      <p className="text-xl font-extrabold text-primary-400">
                        {formatCurrency(total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayNow(p.id)}
                          className="shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Pay Now
                        </Button>
                      )}

                      {(p.status === 'FAILED' || p.status === 'CANCELLED') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(p.id)}
                          disabled={retryingId === p.id}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          {retryingId === p.id ? 'Resetting...' : 'Retry Payment'}
                        </Button>
                      )}

                      {p.status === 'COMPLETED' && (
                        <Link to={`/payment/success?paymentId=${p.id}`}>
                          <Button size="sm" variant="outline">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Tax Receipt
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
