import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { jobApi } from '../services';
import { CATEGORIES } from '../types';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  budget: z.number().min(1, 'Budget must be at least $1'),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof schema>;

export default function PostJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: job } = await jobApi.create(data);
      toast.success('Job posted successfully!');
      navigate(`/jobs/${job.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Post a Job</h1>
      <p className="text-surface-700 mb-8">Describe your project and find the perfect student freelancer</p>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Job Title" error={errors.title?.message} {...register('title')} />
          <div>
            <label className="block text-sm font-medium text-surface-800 mb-1">Description</label>
            <textarea {...register('description')} rows={5} className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
          <Input label="Budget ($)" type="number" step="0.01" error={errors.budget?.message} {...register('budget', { valueAsNumber: true })} />
          <Input label="Deadline" type="date" error={errors.deadline?.message} {...register('deadline')} />
          <div>
            <label className="block text-sm font-medium text-surface-800 mb-1">Category</label>
            <select {...register('category')} className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>Post Job</Button>
        </form>
      </Card>
    </div>
  );
}
