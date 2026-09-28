import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Trash2 } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { adminApi } from '../../services';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils';
import type { AdminService } from '../../types';

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const [deleteTarget, setDeleteTarget] = useState<AdminService | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getServices({ page, limit: 20, ...(search && { search }) })
      .then(({ data }) => { if (!cancelled) { setServices(data.data); setPagination(data.pagination); } })
      .catch(() => !cancelled && toast.error('Failed to load services'));
    return () => { cancelled = true; };
  }, [page, search, reloadKey]);

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteService(deleteTarget.id);
      toast.success('Service deleted');
      setDeleteTarget(null);
      reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete service')); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Services</h1>
        <p className="text-surface-700">Moderate freelancer service listings</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
          <Input aria-label="Search services" placeholder="Search title or description" className="pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {services.length === 0 ? (
          <EmptyState title="No services found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-300 bg-surface-200 text-xs uppercase tracking-wider text-surface-700">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Freelancer</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="hidden md:table-cell px-4 py-3">Listed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-surface-300 last:border-0 hover:bg-surface-200/50">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium line-clamp-1">{s.title}</p>
                      <p className="text-xs text-surface-700">{s.category}</p>
                    </td>
                    <td className="px-4 py-3 text-surface-800">{s.freelancer?.name}</td>
                    <td className="px-4 py-3">{formatCurrency(s.price)}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-surface-700">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        title="Delete service" aria-label="Delete service" onClick={() => setDeleteTarget(s)}
                        className="rounded-lg p-1.5 text-surface-700 hover:bg-surface-300 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />

      <ConfirmModal
        open={!!deleteTarget} title="Delete service" confirmLabel="Delete" danger
        message={<>Delete “{deleteTarget?.title}”? This cannot be undone.</>}
        onConfirm={doDelete} onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
