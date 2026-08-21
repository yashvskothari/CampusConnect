import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
      if (search) params.search = search;
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

  useEffect(() => { fetchServices(); }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900">Browse Services</h1>
        <p className="mt-2 text-surface-700">Find talented students offering freelance services</p>
      </div>

      <form onSubmit={handleFilter} className="mb-8 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full rounded-lg border border-surface-400 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-surface-400 px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 rounded-lg border border-surface-400 px-3 py-2 text-sm" />
        <input type="number" placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 rounded-lg border border-surface-400 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Filter</button>
      </form>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}</div>
      ) : services.length === 0 ? (
        <EmptyState title="No services found" description="Try adjusting your filters or check back later." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} hover>
              <span className="text-xs font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{service.category}</span>
              <h3 className="mt-3 font-semibold text-surface-900">{service.title}</h3>
              <p className="mt-2 text-sm text-surface-700 line-clamp-3">{service.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-surface-300 pt-4">
                <span className="text-lg font-bold text-primary-400">{formatCurrency(service.price)}</span>
                {service.freelancer && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-surface-800">{service.freelancer.name}</span>
                    <Rating rating={service.freelancer.rating} size={14} />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
