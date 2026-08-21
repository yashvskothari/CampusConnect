import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { paymentApi } from '../../services';
import { formatCurrency, formatDate } from '../../utils';
import type { Payment } from '../../types';

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    paymentApi.getAll().then(({ data }) => setPayments(data)).catch(() => {});
  }, []);

  const handlePay = async (paymentId: string) => {
    try {
      await paymentApi.mockCheckout(paymentId);
      navigate(`/payment/success?paymentId=${paymentId}`);
    } catch {
      toast.error('Checkout failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-surface-700">Mock payment flow with 15% platform commission</p>
      </div>

      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Accept a bid to create a payment record" />
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  <p className="text-sm text-surface-700">To: {p.freelancer?.name} · {formatDate(p.createdAt)}</p>
                  <p className="text-xs text-surface-600 mt-1">Commission: {formatCurrency(p.commission)} (15%)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={p.status} />
                  {p.status === 'PENDING' && (
                    <Button size="sm" onClick={() => handlePay(p.id)}>Pay Now</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
