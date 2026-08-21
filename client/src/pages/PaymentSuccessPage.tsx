import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { paymentApi } from '../services';
import { formatCurrency } from '../utils';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const [result, setResult] = useState<{ amount: number; commission: number; freelancerPayout: number } | null>(null);

  useEffect(() => {
    if (paymentId) {
      paymentApi.mockComplete(paymentId).then(({ data }) => {
        setResult(data);
        toast.success('Payment completed successfully!');
      }).catch(() => toast.error('Payment failed'));
    }
  }, [paymentId]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-surface-900">Payment Successful!</h1>
        <p className="mt-2 text-surface-700">Your mock payment has been processed.</p>
        {result && (
          <div className="mt-6 space-y-2 text-sm text-left bg-surface-50 rounded-lg p-4">
            <div className="flex justify-between"><span>Amount:</span><span className="font-semibold">{formatCurrency(result.amount)}</span></div>
            <div className="flex justify-between"><span>Platform Commission (15%):</span><span className="font-semibold text-red-600">-{formatCurrency(result.commission)}</span></div>
            <div className="flex justify-between border-t border-surface-300 pt-2"><span>Freelancer Payout:</span><span className="font-semibold text-green-600">{formatCurrency(result.freelancerPayout)}</span></div>
          </div>
        )}
        <Link to="/dashboard/client/payments" className="mt-6 inline-block"><Button>View Payment History</Button></Link>
      </Card>
    </div>
  );
}
