export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getDashboardPath(role: string) {
  switch (role) {
    case 'CLIENT': return '/dashboard/client';
    case 'ADMIN': return '/admin';
    default: return '/dashboard/freelancer';
  }
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  const e = err as { response?: { data?: { error?: string } } };
  return e?.response?.data?.error || fallback;
}
