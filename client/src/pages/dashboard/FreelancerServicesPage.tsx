import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { serviceApi } from '../../services';
import { formatCurrency } from '../../utils';
import { CATEGORIES, type Service } from '../../types';

export default function FreelancerServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchServices = () => {
    if (!user) return;
    serviceApi.getAll().then(({ data }) => setServices(data.filter((s) => s.freelancerId === user.id))).catch(() => {});
  };

  useEffect(() => { fetchServices(); }, [user]);

  const onSubmit = async (data: Record<string, string>) => {
    try {
      await serviceApi.create({ ...data, price: Number(data.price) });
      toast.success('Service created!');
      reset();
      setShowForm(false);
      fetchServices();
    } catch {
      toast.error('Failed to create service');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await serviceApi.delete(id);
      toast.success('Service deleted');
      fetchServices();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Services</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Service'}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Title" {...register('title', { required: true })} />
            <textarea {...register('description', { required: true })} rows={3} placeholder="Description" className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm" />
            <select {...register('category', { required: true })} className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm">
              <option value="">Category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input label="Price ($)" type="number" step="0.01" {...register('price', { required: true })} />
            <Button type="submit">Create Service</Button>
          </form>
        </Card>
      )}

      {services.length === 0 ? (
        <EmptyState title="No services listed" description="Create your first service to attract clients" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((s) => (
            <Card key={s.id}>
              <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{s.category}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="text-sm text-surface-700 mt-1 line-clamp-2">{s.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-primary-400">{formatCurrency(s.price)}</span>
                <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
