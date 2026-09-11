import { useEffect, useState, type FormEvent } from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

import Card from '../components/Card';
import Rating from '../components/Rating';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

import { serviceApi } from '../services';
import { formatCurrency } from '../utils';
import { CATEGORIES, type Service } from '../types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchServices = async () => {
    setLoading(true);

    try {
      const params: Record<string, string> = {};

      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await serviceApi.getAll(params);
      setServices(data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');

    // Fetch all services after clearing filters
    setTimeout(() => {
      serviceApi
        .getAll({})
        .then(({ data }) => setServices(data))
        .catch(() => setServices([]));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        {/* ================= HEADER ================= */}

        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-sm text-surface-600">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Student Marketplace
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Browse Services
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-surface-700 sm:text-base">
            Find talented students offering freelance services and get the
            help you need.
          </p>
        </div>

        {/* ================= FILTERS ================= */}

        <form
          onSubmit={handleFilter}
          className="
            mb-8 rounded-xl
            border border-white/[0.07]
            bg-surface-100
            p-4
            sm:p-5
          "
        >
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary-500" />

            <span className="text-sm font-medium text-surface-900">
              Find what you need
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">

            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-5">
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
                placeholder="Search services..."
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
            <div className="lg:col-span-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="
                  h-10 w-full
                  rounded-lg
                  border border-surface-400
                  bg-surface-0
                  px-3
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
            </div>

            {/* Minimum Price */}
            <div className="lg:col-span-1">
              <input
                type="number"
                min="0"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="
                  h-10 w-full
                  rounded-lg
                  border border-surface-400
                  bg-surface-0
                  px-3
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

            {/* Maximum Price */}
            <div className="lg:col-span-1">
              <input
                type="number"
                min="0"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="
                  h-10 w-full
                  rounded-lg
                  border border-surface-400
                  bg-surface-0
                  px-3
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

            {/* Filter Button */}
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
                lg:col-span-1
              "
            >
              Filter
            </button>

            {/* Reset Button */}
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
              <span className="lg:hidden xl:inline">Reset</span>
            </button>
          </div>
        </form>

        {/* ================= RESULTS HEADER ================= */}

        {!loading && services.length > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-surface-600">
              Showing{' '}
              <span className="font-medium text-surface-800">
                {services.length}
              </span>{' '}
              {services.length === 1 ? 'service' : 'services'}
            </p>
          </div>
        )}

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : services.length === 0 ? (

          /* ================= EMPTY ================= */

          <div className="rounded-xl border border-white/6 bg-surface-100 py-12">
            <EmptyState
              title="No services found"
              description="Try adjusting your filters or check back later."
            />
          </div>

        ) : (

          /* ================= SERVICE GRID ================= */

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
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
                {/* Category */}
                <div className="flex items-center justify-between">
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
                    {service.category}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="
                    mt-4
                    line-clamp-2
                    text-base font-semibold
                    leading-6
                    text-surface-900
                    transition-colors
                    group-hover:text-primary-400
                  "
                >
                  {service.title}
                </h3>

                {/* Description */}
                <p
                  className="
                    mt-2
                    line-clamp-3
                    text-sm
                    leading-6
                    text-surface-700
                  "
                >
                  {service.description}
                </p>

                {/* Bottom section */}
                <div
                  className="
                    mt-5
                    flex items-end justify-between
                    border-t border-white/6
                    pt-4
                  "
                >
                  {/* Price */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-surface-600">
                      Starting at
                    </p>

                    <span className="mt-1 block text-lg font-bold text-primary-400">
                      {formatCurrency(service.price)}
                    </span>
                  </div>

                  {/* Freelancer */}
                  {service.freelancer && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="max-w-32.5 truncate text-sm font-medium text-surface-800">
                        {service.freelancer.name}
                      </span>

                      <Rating
                        rating={service.freelancer.rating}
                        size={14}
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}