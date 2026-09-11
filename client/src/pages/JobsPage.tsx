import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Clock,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { SkeletonCard } from '../components/Skeleton';

import { jobApi } from '../services';
import { formatCurrency, formatDate } from '../utils';
import { CATEGORIES, type Job } from '../types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);

    try {
      const params: Record<string, string> = {
        status: 'OPEN',
      };

      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;

      const { data } = await jobApi.getAll(params);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };


  const handleReset = () => {
    setSearch('');
    setCategory('');

    setTimeout(() => {
      jobApi
        .getAll({ status: 'OPEN' })
        .then(({ data }) => setJobs(data))
        .catch(() => setJobs([]));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        {/* ================= HEADER ================= */}

        <div
          className="
            mb-8 flex flex-col gap-5
            sm:mb-10 sm:flex-row
            sm:items-end sm:justify-between
          "
        >
          <div>
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Student Opportunities
            </div>

            <h1
              className="
                mt-3
                text-3xl font-bold tracking-tight
                text-surface-900
                sm:text-4xl
              "
            >
              Job Listings
            </h1>

            <p className="mt-2 text-sm leading-6 text-surface-700 sm:text-base">
              Find projects, freelance work, and opportunities from people
              looking for student talent.
            </p>
          </div>

          <Link to="/jobs/new" className="w-full sm:w-auto">
            <Button
              className="
                w-full
                sm:w-auto
              "
            >
              Post a Job
            </Button>
          </Link>
        </div>

        {/* ================= FILTER BAR ================= */}

        <form
          onSubmit={handleSearch}
          className="
            mb-8
            rounded-xl
            border border-white/[0.07]
            bg-surface-100
            p-4
            sm:p-5
          "
        >
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary-500" />

            <span className="text-sm font-medium text-surface-900">
              Find an opportunity
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">

            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-6">
              <Search
                className="
                  absolute left-3 top-1/2
                  h-4 w-4
                  -translate-y-1/2
                  text-surface-600
                "
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs..."
                className="
                  h-10 w-full
                  rounded-lg
                  border border-surface-400
                  bg-surface-0
                  pl-10 pr-4
                  text-sm text-surface-900
                  placeholder:text-surface-600
                  transition-colors
                  focus:border-primary-500
                  focus:outline-none
                  focus:ring-1
                  focus:ring-primary-500/30
                "
              />
            </div>

            {/* Category */}
<div className="relative sm:col-span-1 lg:col-span-3">
  <select
    value={category}
    onChange={(e) => {
      setCategory(e.target.value);
      setCategoryOpen(false);
    }}
    onClick={() => setCategoryOpen((prev) => !prev)}
    onBlur={() => setCategoryOpen(false)}
    className="
      h-10 w-full
      appearance-none
      rounded-lg
      border border-surface-400
      bg-surface-0
      px-3 pr-12
      text-sm text-surface-900
      transition-colors
      focus:border-primary-500
      focus:outline-none
      focus:ring-1
      focus:ring-primary-500/30
    "
  >
    <option value="">All Categories</option>

    {CATEGORIES.map((c) => (
      <option key={c} value={c}>
        {c}
      </option>
    ))}
  </select>

  <ChevronDown
    className={`
      pointer-events-none
      absolute right-4 top-1/2
      h-6 w-6
      -translate-y-1/2
      text-surface-600
      transition-transform duration-200
      ${categoryOpen ? 'rotate-180' : 'rotate-0'}
    `}
  />
</div>

            {/* Search Button */}
            <button
              type="submit"
              className="
                h-10
                rounded-lg
                bg-primary-500
                px-5
                text-sm font-medium
                text-surface-0
                transition-all duration-200
                hover:bg-primary-400
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/40
                lg:col-span-2
              "
            >
              Search
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="
                flex h-10
                items-center justify-center gap-2
                rounded-lg
                border border-surface-400
                bg-transparent
                px-4
                text-sm font-medium
                text-surface-800
                transition-colors
                hover:bg-surface-200
                hover:text-surface-900
                lg:col-span-1
              "
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>
          </div>
        </form>

        {/* ================= RESULT COUNT ================= */}

        {!loading && jobs.length > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-surface-600">
              <span className="font-medium text-surface-800">
                {jobs.length}
              </span>{' '}
              {jobs.length === 1 ? 'open job' : 'open jobs'} available
            </p>
          </div>
        )}

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (

          /* ================= EMPTY STATE ================= */

          <div
            className="
              rounded-xl
              border-white/6
              bg-surface-100
              py-12
            "
          >
            <EmptyState
              title="No jobs found"
              description="Try adjusting your search or category. You can also be the first to post a job."
              action={
                <Link to="/jobs/new">
                  <Button>Post a Job</Button>
                </Link>
              }
            />
          </div>

        ) : (

          /* ================= JOB LIST ================= */

          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                hover
                className="
                  group
                  border border-white/6
                  bg-surface-100
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-primary-500/25
                "
              >
                <div
                  className="
                    flex flex-col gap-5
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                  "
                >
                  {/* ================= JOB INFO ================= */}

                  <div className="min-w-0 flex-1">

                    {/* Status + Category */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge status={job.status} />

                      <span
                        className="
                          inline-flex items-center
                          rounded-md
                          border border-primary-500/15
                          bg-primary-500/8
                          px-2 py-1
                          text-[11px] font-medium
                          uppercase tracking-wide
                          text-primary-400
                        "
                      >
                        {job.category}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      to={`/jobs/${job.id}`}
                      className="
                        block
                        text-lg font-semibold
                        leading-7
                        text-surface-900
                        transition-colors
                        hover:text-primary-400
                      "
                    >
                      {job.title}
                    </Link>

                    {/* Description */}
                    <p
                      className="
                        mt-2
                        max-w-3xl
                        line-clamp-2
                        text-sm
                        leading-6
                        text-surface-700
                      "
                    >
                      {job.description}
                    </p>

                    {/* Meta information */}
                    <div
                      className="
                        mt-4
                        flex flex-wrap
                        items-center
                        gap-x-5 gap-y-2
                        text-sm
                        text-surface-700
                      "
                    >
                      {/* Budget */}
                      <span className="font-semibold text-primary-400">
                        {formatCurrency(job.budget)}
                      </span>

                      {/* Deadline */}
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-surface-600" />
                        Due {formatDate(job.deadline)}
                      </span>

                      {/* Bids */}
                      <span className="text-surface-600">
                        {job._count?.bids ?? job.bids?.length ?? 0}{' '}
                        {((job._count?.bids ?? job.bids?.length ?? 0) === 1)
                          ? 'bid'
                          : 'bids'}
                      </span>
                    </div>
                  </div>

                  {/* ================= ACTION ================= */}

                  <div className="shrink-0 lg:pl-6">
                    <Link to={`/jobs/${job.id}`} className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="
                          w-full
                          border-surface-500
                          text-surface-900
                          transition-all duration-200
                          hover:border-primary-500/50
                          hover:bg-primary-500/6
                          hover:text-primary-400
                          sm:w-auto
                        "
                      >
                        View & Bid
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}