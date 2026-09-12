import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, MessageSquare, Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Avatar from './Avatar';
import { getDashboardPath } from '../utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const notifications = [
    { id: 1, title: 'New job match', detail: 'A project matches your skills.', time: '8 min ago' },
    { id: 2, title: 'Profile views are up', detail: 'Add a service to attract more clients.', time: '2 hr ago' },
    { id: 3, title: 'Welcome to Gigverse', detail: 'Your professional workspace is ready.', time: '1 day ago' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/jobs', label: 'Browse Jobs' },
    { to: '/services', label: 'Browse Services' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-300 bg-surface-0/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient font-bold text-white">
              C
            </div>
            <span className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-surface-900">Gigverse</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider brand-gradient-text">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-medium text-surface-800 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
            <Link to="/services" className="text-sm font-medium text-surface-800 hover:text-white transition-colors">About Us</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Open notifications"
                    aria-expanded={notificationsOpen}
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative rounded-lg p-2 text-surface-700 transition-colors hover:bg-surface-200 hover:text-primary-400"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-400 ring-2 ring-surface-0" />}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-surface-300 bg-surface-100 shadow-xl shadow-black/20">
                      <div className="flex items-center justify-between border-b border-surface-300 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-surface-900">Notifications</p>
                          <p className="text-xs text-surface-700">{unreadNotifications} updates for you</p>
                        </div>
                        <button type="button" onClick={() => setUnreadNotifications(0)} disabled={unreadNotifications === 0} className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 disabled:cursor-default disabled:opacity-50">
                          <CheckCheck className="h-3.5 w-3.5" /> Mark read
                        </button>
                      </div>
                      <div>
                        {notifications.map((notification) => (
                          <button key={notification.id} type="button" className="flex w-full gap-3 border-b border-surface-300 px-4 py-3 text-left last:border-0 hover:bg-surface-200">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-surface-900">{notification.title}</span>
                              <span className="mt-0.5 block text-xs text-surface-700">{notification.detail}</span>
                              <span className="mt-1 block text-[11px] text-surface-600">{notification.time}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link to="/messages" className="p-2 text-surface-700 hover:text-primary-400 rounded-lg hover:bg-surface-200">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link to={getDashboardPath(user.role)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-surface-200">
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <span className="text-sm font-medium text-surface-900">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-surface-700 hover:text-red-400 rounded-lg hover:bg-surface-200">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-surface-800 hover:text-white transition-colors px-2">Login</Link>
                <Link to="/signup"><Button size="sm">Sign Up</Button></Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-surface-900" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-surface-300 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="block px-3 py-2 text-sm font-medium text-surface-800" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/messages" className="block px-3 py-2 text-sm text-surface-800" onClick={() => setMobileOpen(false)}>Messages</Link>
                <Link to={getDashboardPath(user.role)} className="block px-3 py-2 text-sm text-surface-800" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="block px-3 py-2 text-sm text-red-400">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-sm text-surface-800" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link to="/signup" className="block px-3 py-2 text-sm text-primary-400 font-medium" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
