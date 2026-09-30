import { Link, useLocation } from 'react-router-dom';
import { Bike, LogOut, Menu, Shield } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ onOpenSidebar }) {
  const { user, logout, openAuthModal } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    ...(!user?.isAdmin ? [{ name: 'Book Service', path: '/booking' }] : []),
    ...(user && !user.isAdmin ? [{ name: 'My Dashboard', path: '/dashboard' }] : []),
    ...(user?.isAdmin ? [{ name: 'Admin Dashboard', path: '/admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center group-hover:scale-105 transition">
            <Bike className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-wider text-white flex items-center gap-1.5">
              MANJU <span className="text-red-500">YAMAHA</span> SERVICE
            </span>
            <p className="text-xs text-slate-400 font-medium">Kamburupitiya Service Center</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Corner Buttons */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-800/70 border border-slate-700/60 rounded-xl px-3 py-1.5">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
                  {user.isAdmin && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-400 font-mono">{user.email || user.phone}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={openAuthModal}
              className="hidden sm:inline-flex"
            >
              Login / Sign In
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open menu"
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

