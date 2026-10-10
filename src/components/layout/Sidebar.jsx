import { Link, useLocation } from 'react-router-dom';
import { X, Bike, Home, User, ShieldCheck, LogOut, LogIn, LayoutDashboard, Globe, Calendar, Info, Phone, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, loading, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  if (!isOpen) return null;

  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');

  const links = [
    { name: t('nav.home'), path: '/', icon: Home },
    ...(!isAdmin ? [{ name: t('nav.bookService'), path: '/booking', icon: Calendar }] : []),
    ...(isAdmin ? [{ name: t('nav.adminDashboard'), path: '/admin', icon: ShieldCheck }] : []),
    ...(user && !isAdmin ? [{ name: t('nav.myDashboard'), path: '/dashboard', icon: LayoutDashboard }] : []),
    ...(user ? [{ name: t('nav.profile'), path: '/profile', icon: User }] : []),
    { name: t('nav.about'), path: '/about', icon: Info },
    { name: t('nav.contact'), path: '/contact', icon: Phone },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(4, 7, 15, 0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 w-80 max-w-[88vw] flex flex-col overflow-y-auto animate-slideInRight"
        style={{
          background: 'linear-gradient(160deg, #0d1525 0%, #080c18 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '-16px 0 48px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top stripe accent */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #2563eb, transparent)' }}
        />

        <div className="flex flex-col flex-1 p-5 gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
              >
                <Bike className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="font-black text-sm tracking-wider" style={{ color: '#ffffff' }}>
                  MANJU <span style={{ color: '#ef4444' }}>YAMAHA</span>
                </span>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Kamburupitiya Workshop
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User card or login */}
          {user ? (
            <Link
              to="/profile"
              onClick={onClose}
              className="min-h-[56px] p-3.5 rounded-2xl flex items-center justify-between group transition-all duration-200"
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden font-bold text-sm text-white"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.8), rgba(29,78,216,0.6))',
                    border: '1px solid rgba(37,99,235,0.4)',
                  }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                      {user.phone}
                    </span>
                    {user.isAdmin ? (
                      <span
                        className="px-1.5 rounded text-[9px] font-extrabold"
                        style={{
                          background: 'rgba(245,158,11,0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245,158,11,0.25)',
                        }}
                      >
                        ADMIN
                      </span>
                    ) : (
                      <span
                        className="px-1.5 rounded text-[9px] font-extrabold"
                        style={{
                          background: 'rgba(37,99,235,0.15)',
                          color: '#93c5fd',
                          border: '1px solid rgba(37,99,235,0.25)',
                        }}
                      >
                        MEMBER
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 ml-2 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
            </Link>
          ) : loading ? (
            <div className="min-h-[48px] w-full rounded-xl animate-pulse bg-white/5 border border-white/10" />
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="min-h-[48px] w-full inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 px-4 text-sm gap-2 text-white"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                border: '1px solid rgba(37,99,235,0.5)',
              }}
            >
              <LogIn className="w-4 h-4" />
              <span>{t('nav.login')}</span>
            </Link>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`min-h-[48px] flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive ? 'text-blue-300' : 'text-body hover:text-white'
                  }`}
                  style={isActive ? {
                    background: 'rgba(37, 99, 235, 0.12)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  } : {}}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? '#60a5fa' : 'var(--text-muted)' }}
                    />
                    <span>{link.name}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Language Toggle */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span className="text-xs font-medium flex items-center gap-1.5 pl-1" style={{ color: 'var(--text-muted)' }}>
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Language</span>
            </span>
            <div
              className="flex items-center p-0.5 rounded-lg text-xs font-semibold gap-0.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {['en', 'si'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className="min-h-[30px] px-3 rounded-md transition-all duration-200 text-xs"
                  style={lang === l ? {
                    background: 'rgba(37, 99, 235, 0.7)',
                    color: '#fff',
                    fontWeight: 700,
                  } : {
                    color: 'var(--text-muted)',
                  }}
                >
                  {l === 'en' ? 'EN' : 'සිං'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sign Out at bottom */}
        {user && (
          <div className="p-5 pt-0">
            <button
              type="button"
              onClick={() => { logout(); onClose(); }}
              className="min-h-[48px] w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200"
              style={{
                background: 'rgba(220,38,38,0.08)',
                color: '#f87171',
                border: '1px solid rgba(220,38,38,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.15)';
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)';
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
