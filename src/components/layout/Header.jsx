import { Link, useLocation } from 'react-router-dom';
import { Bike, LogOut, Menu, Shield, User } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ onOpenSidebar }) {
  const { user, logout, openAuthModal } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    ...(user && !user.isAdmin ? [{ name: t('nav.myDashboard'), path: '/dashboard' }] : []),
    ...(user?.isAdmin ? [{ name: t('nav.adminDashboard'), path: '/admin' }] : []),
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
            <p className="text-xs text-slate-400 font-medium">
              {lang === 'si' ? 'කඹුරුපිටිය සේවා මධ්‍යස්ථානය' : 'Kamburupitiya Service Center'}
            </p>
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

        {/* Right Corner: Language Toggle & User Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Toggle Pill: EN | සිං */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setLang('en')}
              title="English"
              className={`px-2.5 py-1 rounded-lg transition-all ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('si')}
              title="සිංහල"
              className={`px-2.5 py-1 rounded-lg transition-all ${
                lang === 'si'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              සිං
            </button>
          </div>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              {/* User badge with avatar, name, and edit link */}
              <Link
                to="/profile"
                title={t('profile.viewProfile')}
                className={`flex items-center gap-2.5 bg-slate-800/70 hover:bg-slate-800 border rounded-xl px-2.5 sm:px-3 py-1.5 transition group ${
                  location.pathname === '/profile'
                    ? 'border-blue-500 shadow-md shadow-blue-500/20'
                    : 'border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <p className="text-sm font-semibold text-white leading-tight group-hover:text-blue-300 transition">
                      {user.name}
                    </p>
                    {user.isAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> {t('common.admin').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{user.phone}</p>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                title={t('nav.logout')}
                className="p-1.5 sm:p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition border border-transparent hover:border-red-500/30"
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
              {t('nav.login')}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
