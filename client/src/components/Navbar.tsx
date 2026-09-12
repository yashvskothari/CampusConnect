import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import Avatar from "./Avatar";
import { getDashboardPath } from "../utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/jobs", label: "Browse Jobs" },
    { to: "/services", label: "Browse Services" },
    { to: "/about", label: "About Us" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-300 bg-surface-0/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-15 w-15 items-center justify-center rounded-lg overflow-hidden">
              <img
                src="../../public/favicon.png"
                alt="GigVerse"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-surface-900">
                GigVerse
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider brand-gradient-text">
                AI
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-surface-800 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/messages"
                  className="p-2 text-surface-700 hover:text-primary-400 rounded-lg hover:bg-surface-200"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link
                  to={getDashboardPath(user.role)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-surface-200"
                >
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <span className="text-sm font-medium text-surface-900">
                    {user.name}
                  </span>
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 text-surface-700 hover:text-red-400 rounded-lg hover:bg-surface-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-surface-800 hover:text-white transition-colors px-2"
                >
                  Login
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-surface-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-surface-300 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2 text-sm font-medium text-surface-800"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/messages"
                  className="block px-3 py-2 text-sm text-surface-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to={getDashboardPath(user.role)}
                  className="block px-3 py-2 text-sm text-surface-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="block px-3 py-2 text-sm text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-sm text-surface-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 text-sm text-primary-400 font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4 mt-20"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-0 backdrop-blur-md p-6 shadow-xl mt-20 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-surface-900">Log out?</h3>
            <p className="mt-2 text-sm text-surface-700">
              Are you sure you want to log out of your account?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-800 hover:bg-surface-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
