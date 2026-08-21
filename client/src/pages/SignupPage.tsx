import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { getDashboardPath } from '../utils';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['FREELANCER', 'CLIENT']),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'FREELANCER' },
  });

  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        bio: data.bio,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      toast.success('Account created successfully!');
      navigate(getDashboardPath(data.role));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
          <p className="mt-2 text-sm text-surface-700">Join CampusConnect and start your journey</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
          <div>
            <label className="block text-sm font-medium text-surface-800 mb-2">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {(['FREELANCER', 'CLIENT'] as const).map((r) => (
                <label key={r} className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors ${role === r ? 'border-primary-500 bg-primary-500/10' : 'border-surface-300 hover:border-surface-400'}`}>
                  <input type="radio" value={r} className="sr-only" {...register('role')} />
                  <span className="text-sm font-medium">{r === 'FREELANCER' ? 'Offer Services' : 'Hire Talent'}</span>
                </label>
              ))}
            </div>
          </div>
          <Input label="Bio (optional)" {...register('bio')} />
          {role === 'FREELANCER' && (
            <Input label="Skills (comma separated)" placeholder="React, Node.js, Design" {...register('skills')} />
          )}
          <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-surface-700">
          Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
