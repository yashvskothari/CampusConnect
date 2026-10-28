import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, MessageSquare, User, IndianRupee, Star, Sparkles, Plus, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import PageTransition from '../components/PageTransition';
import ThemeSelector from '../components/ThemeSelector';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({ links }: { links: SidebarLink[] }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-xl border border-surface-300 bg-surface-100 p-4">
              <div className="mb-4 px-3">
                <p className="text-xs font-medium text-surface-700 uppercase tracking-wider">Dashboard</p>
                <p className="text-sm font-semibold text-surface-900 mt-1">{user?.name}</p>
                <p className="text-xs text-primary-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <nav className="space-y-1">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      location.pathname === link.to
                        ? 'bg-primary-500/15 text-primary-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-semibold'
                        : 'text-surface-800 hover:bg-surface-200 hover:text-surface-900'
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-surface-300">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[11px] font-semibold text-surface-700 uppercase tracking-wider">Theme</span>
                </div>
                <ThemeSelector />
              </div>
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </div>
      </div>
    </div>
  );
}

export const freelancerLinks: SidebarLink[] = [
  { to: '/dashboard/freelancer', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/dashboard/freelancer/services', label: 'My Services', icon: <Briefcase className="h-4 w-4" /> },
  { to: '/dashboard/freelancer/bids', label: 'My Bids', icon: <IndianRupee className="h-4 w-4" /> },
  { to: '/dashboard/freelancer/earnings', label: 'Earnings & Orders', icon: <Receipt className="h-4 w-4" /> },
  { to: '/dashboard/freelancer/recommendations', label: 'AI Matches', icon: <Sparkles className="h-4 w-4" /> },
  { to: '/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  { to: '/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

export const clientLinks: SidebarLink[] = [
  { to: '/dashboard/client', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/jobs/new', label: 'Post Job', icon: <Plus className="h-4 w-4" /> },
  { to: '/dashboard/client/bids', label: 'Received Bids', icon: <IndianRupee className="h-4 w-4" /> },
  { to: '/dashboard/client/payments', label: 'Payments', icon: <Star className="h-4 w-4" /> },
  { to: '/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  { to: '/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];


