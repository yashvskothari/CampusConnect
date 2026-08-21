import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Avatar from './Avatar';
import { getDashboardPath } from '../utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <span className="text-lg font-bold text-surface-900">CampusConnect</span>
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
