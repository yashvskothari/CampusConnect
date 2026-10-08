export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // Set to 2 if you want decimal paise (e.g., ₹15,000.50)
  }).format(amount ?? 0);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getDashboardPath(role: string) {
  switch (role) {
    case 'CLIENT': return '/dashboard/client';
    case 'ADMIN': return '/dashboard/client';
    default: return '/dashboard/freelancer';
  }
}


