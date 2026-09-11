import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  BriefcaseBusiness,
  FileText,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchServices = () => {
    if (!user) return;

    serviceApi
      .getAll()
      .then(({ data }) => {
        setServices(
          data.filter((service) => service.freelancerId === user.id)
        );
      })
      .catch(() => {
        toast.error('Failed to load your services');
      });
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  const onSubmit = async (data: Record<string, string>) => {
    try {
      setLoading(true);

      await serviceApi.create({
        ...data,
        price: Number(data.price),
      });

      toast.success('Service created successfully!');

      reset();
      setShowForm(false);
      fetchServices();
    } catch {
      toast.error('Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      await serviceApi.delete(id);

      toast.success('Service deleted');
      fetchServices();
    } catch {
      toast.error('Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-full">
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-surface-600">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Freelancer Dashboard
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
            My Services
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-surface-700">
            Showcase your skills and let clients know what you can
            help them with.
          </p>
        </div>

        <Button
          onClick={() => setShowForm((value) => !value)}
          className="
            w-full
            border border-primary-400
            bg-primary-500
            text-[#171713]
            shadow-[0_4px_20px_rgba(217,154,30,0.12)]
            transition-all duration-200
            hover:bg-primary-400
            hover:shadow-[0_6px_25px_rgba(217,154,30,0.20)]
            sm:w-auto
          "
        >
          {showForm ? (
            <>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Service
            </>
          )}
        </Button>
      </div>

      {/* ================= CREATE SERVICE FORM ================= */}
      {showForm && (
        <Card
          className="
            mb-8
           border-white/6
            bg-surface-100
            shadow-none
          "
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/8">
              <BriefcaseBusiness className="h-5 w-5 text-primary-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-surface-900">
                Create a Service
              </h2>

              <p className="mt-0.5 text-xs text-surface-600">
                Add a service that you can offer to clients.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* TITLE */}
            <Input
              label="Service Title"
              placeholder="e.g. Build a responsive React website"
              error={
                errors.title
                  ? 'Service title is required'
                  : undefined
              }
              {...register('title', {
                required: true,
              })}
            />

            {/* DESCRIPTION */}
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-surface-600" />

                <label className="text-sm font-medium text-surface-800">
                  Description
                </label>
              </div>

              <textarea
                {...register('description', {
                  required: true,
                })}
                rows={5}
                placeholder="Describe what you offer, what is included, and what clients can expect..."
                className="
                  w-full resize-y rounded-lg
                  border border-surface-400
                  bg-surface-0
                  px-3.5 py-3
                  text-sm leading-6
                  text-surface-900
                  placeholder:text-surface-600
                  transition-colors duration-200
                  focus:border-primary-500
                  focus:outline-none
                  focus:ring-1
                  focus:ring-primary-500
                "
              />

              {errors.description && (
                <p className="mt-1.5 text-xs text-red-400">
                  Description is required
                </p>
              )}
            </div>

            {/* CATEGORY + PRICE */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-surface-600" />

                  <label className="text-sm font-medium text-surface-800">
                    Category
                  </label>
                </div>

                <select
                  {...register('category', {
                    required: true,
                  })}
                  className="
                    w-full rounded-lg
                    border border-surface-400
                    bg-surface-0
                    px-3.5 py-2.5
                    text-sm
                    text-surface-900
                    transition-colors duration-200
                    focus:border-primary-500
                    focus:outline-none
                    focus:ring-1
                    focus:ring-primary-500
                  "
                >
                  <option value="">Select a category</option>

                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {errors.category && (
                  <p className="mt-1.5 text-xs text-red-400">
                    Category is required
                  </p>
                )}
              </div>

              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 50"
                error={
                  errors.price
                    ? 'Price is required'
                    : undefined
                }
                {...register('price', {
                  required: true,
                })}
              />
            </div>

            {/* DIVIDER */}
            <div className="border-t border-white/6" />

            {/* ACTION */}
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                className="
                  w-full
                  border border-primary-400
                  bg-primary-500
                  text-[#171713]
                  hover:bg-primary-400
                  sm:w-auto
                "
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create Service
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= SERVICES ================= */}
      {services.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-surface-100 py-12">
          <EmptyState
            title="No services listed"
            description="Create your first service to showcase your skills and attract clients."
          />
        </div>
      ) : (
        <>
          {/* RESULT COUNT */}
          <div className="mb-4">
            <p className="text-sm text-surface-600">
              <span className="font-medium text-surface-800">
                {services.length}
              </span>{' '}
              {services.length === 1 ? 'service' : 'services'} listed
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card
                key={service.id}
                className="
                  group
                  border border-white/6
                  bg-surface-100
                  shadow-none
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-primary-500/20
                "
              >
                {/* CATEGORY */}
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="
                      inline-flex items-center
                      rounded-full
                      border border-primary-500/15
                      bg-primary-500/[0.07]
                      px-2.5 py-1
                      text-xs font-medium
                      text-primary-400
                    "
                  >
                    {service.category}
                  </span>
                </div>

                {/* TITLE */}
                <h3
                  className="
                    mt-4
                    text-base font-semibold leading-6
                    text-surface-900
                  "
                >
                  {service.title}
                </h3>

                {/* DESCRIPTION */}
                <p
                  className="
                    mt-2
                    line-clamp-3
                    text-sm leading-6
                    text-surface-700
                  "
                >
                  {service.description}
                </p>

                {/* FOOTER */}
                <div
                  className="
                    mt-5 flex
                    items-end justify-between
                    gap-4
                    border-t border-white/6
                    pt-4
                  "
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-surface-600">
                      Starting price
                    </p>

                    <p className="mt-1 text-lg font-bold text-primary-400">
                      {formatCurrency(service.price)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(service.id)}
                    disabled={deletingId === service.id}
                    className="
                      transition-all duration-200
                    "
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />

                    {deletingId === service.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}