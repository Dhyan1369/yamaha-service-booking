import { Link, useLocation } from 'react-router-dom';
import { X, Bike, Home, User, ShieldCheck, LogOut, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, openAuthModal } = useAuth();
  const location = useLocation();

  if (!isOpen) return null;

  const links = [
    { name: 'Home', path: '/', icon: Home },
    ...(user && !user.isAdmin ? [{ name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    ...(user && !user.isAdmin ? [{ name: 'Profile (ගිණුම)', path: '/profile', icon: User }] : []),
    ...(user?.isAdmin ? [{ name: 'Admin Dashboard', path: '/admin', icon: ShieldCheck }] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-72 bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-10">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-sm">Manju Yamaha Service</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Preview */}
          {user ? (
            <Link 
              to="/profile" 
              onClick={onClose}
              className="my-4 p-3 bg-slate-950/60 hover:bg-slate-950 rounded-xl border border-slate-800 hover:border-blue-500/40 transition block group"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Signed in as</p>
                <span className="text-[10px] text-blue-400 group-hover:underline">Edit Profile →</span>
              </div>
              <p className="text-sm font-bold text-white truncate mt-0.5">{user.name}</p>
              <p className="text-xs text-blue-400 font-mono">{user.email || user.phone}</p>
            </Link>
          ) : (
            <div className="my-4">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                icon={LogIn}
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
              >
                Sign In / Login
              </Button>
            </div>
          )}

          {/* Nav Links */}
          <nav className="space-y-1.5 mt-4">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        {user && (
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
