import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Briefcase,
  Calendar,
  User,
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

export default function FreelancerEarningsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchEarnings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await paymentApi.getAll({ freelancerId: user.id });
      setPayments(data);
    } catch (err) {
      console.error('Failed to load earnings history:', err);
      toast.error('Failed to fetch earnings records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  // Financial calculations
  const completedPayments = payments.filter((p) => p.status === 'COMPLETED');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');

  const totalEarnings = completedPayments.reduce((sum, p) => {
    return sum + (p.freelancerPayout ?? (p.amount - (p.platformFee || p.commission)));
  }, 0);

  const pendingEscrow = pendingPayments.reduce((sum, p) => {
    return sum + (p.freelancerPayout ?? (p.amount - (p.platformFee || p.commission)));
  }, 0);

  const totalCommissionPaid = completedPayments.reduce((sum, p) => {
    return sum + (p.platformFee || p.commission);
  }, 0);

  const filteredPayments = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (p.job?.title || p.service?.title || '').toLowerCase();
      const client = (p.client?.name || '').toLowerCase();
      const id = p.id.toLowerCase();
      const txn = (p.providerPaymentId || '').toLowerCase();
      return title.includes(q) || client.includes(q) || id.includes(q) || txn.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
            Revenue & Payouts
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Earnings & Orders
          </h1>
          <p className="mt-1 text-sm text-surface-700">
            Review earnings from completed contracts and services, monitor escrow holds, and inspect platform fees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchEarnings} disabled={loading}>
            Refresh
          </Button>
          <Link to="/dashboard/freelancer/services">
            <Button size="sm">Manage Services</Button>
          </Link>
        </div>
      </div>

      {/* ================= STAT METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Cleared Earnings */}
        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                Cleared Net Earnings
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-primary-400">
                {formatCurrency(totalEarnings)}
              </h2>
              <p className="mt-1 text-[11px] text-surface-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-400 inline" />
                From {completedPayments.length} paid contracts
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary-500/15 text-primary-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Escrow Balance */}
        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                Held in Escrow
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">
                {formatCurrency(pendingEscrow)}
              </h2>
              <p className="mt-1 text-[11px] text-surface-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 inline" />
                {pendingPayments.length} active or pending order{pendingPayments.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Platform Fee Deducted */}
        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                Platform Commission (10%)
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-surface-900">
                {formatCurrency(totalCommissionPaid)}
              </h2>
              <p className="mt-1 text-[11px] text-surface-600">
                Standard 10% fee on gross service revenue
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-200 text-surface-700">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Payout Status */}
        <Card className="border border-white/6 bg-surface-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">
                Payout Mechanism
              </p>
              <h2 className="mt-2 text-lg font-bold text-surface-900">
                Milestone Escrow
              </h2>
              <p className="mt-1 text-[11px] text-teal-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline" />
                Direct Bank / UPI Settlement
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ================= ESCROW & PAYOUT NOTICE ================= */}
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 text-xs text-surface-700 space-y-1">
        <div className="flex items-center gap-2 font-semibold text-primary-400">
          <ShieldCheck className="w-4 h-4" />
          Escrow Protection & Payment Lifecycle
        </div>
        <p>
          Clients fund contracts upfront via the secure gateway into Gigverse escrow. Once the milestone is completed and accepted by the client, funds are marked cleared for settlement into your account. Platform fees are strictly 10% of gross contract value.
        </p>
      </div>

      {/* ================= CONTROLS: FILTERS & SEARCH ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-100 border border-surface-300 w-fit overflow-x-auto max-w-full">
          {[
            { key: 'ALL', label: 'All Orders' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'PENDING', label: 'In Escrow' },
            { key: 'FAILED', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === tab.key
                  ? 'bg-primary-500/20 text-primary-400 font-semibold shadow-sm'
                  : 'text-surface-700 hover:text-surface-900 hover:bg-surface-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-surface-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, title, ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-surface-300 bg-surface-0 text-xs text-surface-900 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* ================= EARNINGS LIST ================= */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No earnings records found"
          description={
            filterStatus === 'ALL'
              ? 'When clients accept your bids or order your services, your earnings and contract payments will appear here.'
              : `No orders match the current "${filterStatus}" filter.`
          }
          action={
            <Link to="/jobs">
              <Button size="sm">Browse Open Jobs</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((p) => {
            const itemTitle = p.job?.title || p.service?.title || 'Contract / Service';
            const grossSubtotal = p.amount;
            const commission = p.platformFee || p.commission;
            const netPayout = p.freelancerPayout ?? (grossSubtotal - commission);
            const isCompleted = p.status === 'COMPLETED';
            const isPending = p.status === 'PENDING';

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
                      <span className="text-xs text-surface-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 inline" />
                        {formatDate(p.paidAt || p.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-surface-900 line-clamp-1">
                      {itemTitle}
                    </h3>

                    <div className="text-xs text-surface-700 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-surface-600" />
                        Client: <strong>{p.client?.name || 'Client'}</strong>
                      </span>
                      {p.client?.email && (
                        <>
                          <span>•</span>
                          <span className="text-surface-600">{p.client.email}</span>
                        </>
                      )}
                      {p.providerPaymentId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-surface-600">Txn: {p.providerPaymentId}</span>
                        </>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="text-[11px] text-surface-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-surface-200 mt-2">
                      <span>Gross Contract: <strong className="text-surface-800">{formatCurrency(grossSubtotal)}</strong></span>
                      <span>Platform Fee (10%): <strong className="text-surface-800">{formatCurrency(commission)}</strong></span>
                      <span>
                        Settlement: <span className={isCompleted ? 'text-teal-400 font-semibold' : isPending ? 'text-amber-400' : 'text-surface-600'}>
                          {isCompleted ? 'Cleared for Withdrawal' : isPending ? 'Held in Escrow' : 'Failed / Cancelled'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Net Earnings & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-surface-200 gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wider text-surface-600 font-semibold">
                        Your Net Payout
                      </p>
                      <p className={`text-xl font-black ${isCompleted ? 'text-primary-400' : isPending ? 'text-amber-400' : 'text-surface-700'}`}>
                        {formatCurrency(netPayout)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPayment(p)}
                      >
                        Breakdown
                      </Button>
                      {p.jobId && (
                        <Link to={`/jobs/${p.jobId}`}>
                          <Button size="sm" variant="ghost">
                            Job Details <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline" />
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

      {/* ================= BREAKDOWN MODAL ================= */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-surface-300 bg-surface-100 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-200">
              <div>
                <h3 className="text-lg font-bold text-surface-900">
                  Contract Settlement Breakdown
                </h3>
                <p className="text-xs text-surface-600">
                  Payment Reference: #{selectedPayment.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded-lg hover:bg-surface-200 text-surface-600 hover:text-surface-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-surface-200/60">
                <span className="text-surface-700">Contract / Service</span>
                <span className="font-semibold text-surface-900">
                  {selectedPayment.job?.title || selectedPayment.service?.title || 'Service'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-200/60">
                <span className="text-surface-700">Client</span>
                <span className="font-semibold text-surface-900">
                  {selectedPayment.client?.name || 'Client'} ({selectedPayment.client?.email})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-200/60">
                <span className="text-surface-700">Payment Status</span>
                <Badge status={selectedPayment.status} />
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-200/60">
                <span className="text-surface-700">Gross Service Amount</span>
                <span className="font-mono text-surface-900">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-200/60 text-rose-400">
                <span>Platform Commission (10%)</span>
                <span className="font-mono">
                  - {formatCurrency(selectedPayment.platformFee || selectedPayment.commission)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold bg-primary-500/10 px-3 rounded-lg border border-primary-500/20">
                <span className="text-surface-900">Net Cleared Payout</span>
                <span className="text-primary-400 font-mono">
                  {formatCurrency(
                    selectedPayment.freelancerPayout ??
                      selectedPayment.amount - (selectedPayment.platformFee || selectedPayment.commission)
                  )}
                </span>
              </div>

              {selectedPayment.providerPaymentId && (
                <div className="p-3 rounded-lg bg-surface-200 text-xs font-mono text-surface-700 space-y-1">
                  <div>Gateway Order ID: {selectedPayment.providerOrderId || 'N/A'}</div>
                  <div>Gateway Payment ID: {selectedPayment.providerPaymentId}</div>
                  <div>Method: {selectedPayment.paymentMethod || 'Online'}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedPayment(null)} size="sm">
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
