import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { authApi } from '../services';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: FormData) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch {
      toast.error('We could not process that request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-surface-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-surface-700">Enter your registered email and we will send a secure reset link.</p>
        </div>
        {sent ? (
          <div className="rounded-lg border border-primary-500/30 bg-primary-500/10 p-4 text-center">
            <p className="font-medium text-primary-300">Check your inbox</p>
            <p className="mt-1 text-sm text-surface-700">If an account exists with that email, you will receive a password reset link shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-surface-700">
          <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">Back to Login</Link>
        </p>
      </Card>
    </div>
  );
}
