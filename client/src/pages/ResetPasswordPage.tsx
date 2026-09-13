import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { authApi } from '../services';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const getStrength = (password: string) => {
  if (!password) return { label: 'Not set', color: 'bg-surface-400', width: 'w-0' };
  if (password.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
  if (password.length < 10 || !/[0-9]/.test(password) || !/[A-Z]/.test(password)) {
    return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
  }
  return { label: 'Strong', color: 'bg-primary-500', width: 'w-full' };
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const password = watch('password', '');
  const strength = useMemo(() => getStrength(password), [password]);

  const onSubmit = async ({ password: newPassword }: FormData) => {
    if (!token) {
      toast.error('This password reset link is invalid.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password: newPassword });
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-surface-900">Create a new password</h1>
          <p className="mt-2 text-sm text-surface-700">Choose a secure password for your GigVerse account.</p>
        </div>
        {!token ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">This password reset link is missing or invalid.</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input label="New password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" error={errors.password?.message} {...register('password')} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-surface-700 hover:text-surface-900">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-surface-700"><span>Password strength</span><span>{strength.label}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-300"><div className={`h-full transition-all ${strength.color} ${strength.width}`} /></div>
            </div>
            <div className="relative">
              <Input label="Confirm password" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              <button type="button" aria-label={showConfirmation ? 'Hide confirmed password' : 'Show confirmed password'} onClick={() => setShowConfirmation(!showConfirmation)} className="absolute right-3 top-8 text-surface-700 hover:text-surface-900">
                {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-surface-700">
          <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">Back to Login</Link>
        </p>
      </Card>
    </div>
  );
}
