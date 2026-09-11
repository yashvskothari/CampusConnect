import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BriefcaseBusiness, CalendarDays, ChevronDown, DollarSign, FileText } from 'lucide-react';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { jobApi } from '../services';
import { CATEGORIES } from '../types';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters'),
  budget: z.number().min(1, 'Budget must be at least $1'),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof schema>;

export default function PostJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showCancelConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCancelConfirm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedCategory = watch('category');

  const handleSelectCategory = (category: string) => {
    setValue('category', category, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setCategoryOpen(false);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const { data: job } = await jobApi.create(data);

      toast.success('Job posted successfully!');
      navigate(`/jobs/${job.id}`);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error || 'Failed to post job'
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    navigate('/jobs');
  };

  return (
    <div className="min-h-full">
      {/* ================= HEADER ================= */}
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          Student Marketplace
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
          Post a Job
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-surface-700 sm:text-base">
          Describe your project, set your budget, and find the right
          student freelancer for the job.
        </p>
      </div>

      {/* ================= FORM ================= */}
      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        <Card
          className="
            border-white/6
            bg-surface-100
            shadow-none
          "
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-7"
          >
            {/* ================= JOB TITLE ================= */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/8">
                  <BriefcaseBusiness className="h-4 w-4 text-primary-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-surface-900">
                    Job Details
                  </p>
                  <p className="text-xs text-surface-600">
                    Give freelancers a clear idea of your project.
                  </p>
                </div>
              </div>

              <Input
                label="Job Title"
                placeholder="e.g. Build a responsive portfolio website"
                error={errors.title?.message}
                {...register('title')}
              />
            </div>

            {/* ================= DESCRIPTION ================= */}
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-surface-600" />

                <label className="text-sm font-medium text-surface-800">
                  Description
                </label>
              </div>

              <textarea
                {...register('description')}
                rows={7}
                placeholder="Explain what you need, the expected outcome, important requirements, and any specific skills you are looking for..."
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
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* ================= BUDGET + DEADLINE ================= */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-surface-600" />

                  <label className="text-sm font-medium text-surface-800">
                    Budget
                  </label>
                </div>

                <Input
                  label=""
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 150"
                  error={errors.budget?.message}
                  {...register('budget', {
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-surface-600" />

                  <label className="text-sm font-medium text-surface-800">
                    Deadline
                  </label>
                </div>

                <Input
                  label=""
                  type="date"
                  error={errors.deadline?.message}
                  {...register('deadline')}
                />
              </div>
            </div>

            {/* ================= CATEGORY ================= */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Category
              </label>

              <input type="hidden" {...register('category')} />

              <div ref={categoryRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen((prev) => !prev)}
                  className="
                    flex w-full items-center justify-between rounded-lg
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
                  <span
                    className={
                      selectedCategory ? 'text-surface-900' : 'text-surface-600'
                    }
                  >
                    {selectedCategory || 'Select a category'}
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 text-surface-600 transition-transform duration-200 ${
                      categoryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {categoryOpen && (
                  <ul
                    className="
                      absolute z-10 mt-1.5 max-h-56 w-full
                      overflow-auto rounded-lg
                      border border-surface-400
                      bg-surface-0
                      py-1
                      shadow-lg
                    "
                  >
                    {CATEGORIES.map((category) => (
                      <li key={category}>
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(category)}
                          className={`
                            block w-full px-3.5 py-2 text-left text-sm
                            transition-colors duration-150
                            hover:bg-surface-200
                            ${
                              selectedCategory === category
                                ? 'bg-primary-500/10 text-primary-400 font-medium'
                                : 'text-surface-900'
                            }
                          `}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {errors.category && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* ================= DIVIDER ================= */}
            <div className="border-t border-white/6" />

            {/* ================= ACTIONS ================= */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="
                  w-full
                  border-surface-400
                  bg-transparent
                  text-surface-800
                  hover:border-surface-500
                  hover:bg-white/4
                  sm:w-auto
                "
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={loading}
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
                Post Job
              </Button>
            </div>
          </form>
        </Card>

        {/* ================= FOOTNOTE ================= */}
        <p className="mt-4 text-center text-xs leading-5 text-surface-600">
          Be as specific as possible. Clear requirements help you
          receive better proposals from freelancers.
        </p>
      </div>

      {/* ================= CANCEL CONFIRMATION MODAL ================= */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-24"
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-0/70 backdrop-blur-md p-6 shadow-xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-surface-900">
              Discard this job post?
            </h3>
            <p className="mt-2 text-sm text-surface-700">
              Any details you've entered will be lost if you leave now.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-800 hover:bg-surface-200"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}