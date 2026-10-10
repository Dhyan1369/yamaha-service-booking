import { Link, useLocation } from 'react-router-dom';
import { Bike, LogOut, Menu, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ onOpenSidebar }) {
  const { user, loading, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    ...(!isAdmin ? [{ name: t('nav.bookService'), path: '/booking' }] : []),
    ...(isAdmin ? [{ name: t('nav.adminDashboard'), path: '/admin' }] : []),
    ...(user && !isAdmin ? [{ name: t('nav.myDashboard'), path: '/dashboard' }] : []),
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  return (
    <header
      className="sticky top-0 z-40 transition-all duration-300"
      style={{
        background: 'rgba(8, 12, 24, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 30px rgba(0,0,0,0.5)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group shrink-0">
          <div
            className="relative p-2 rounded-xl text-white transition-all duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Bike className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span
              className="text-sm sm:text-base font-black tracking-wider flex items-center gap-1 leading-tight"
              style={{ color: '#ffffff' }}
            >
              MANJU <span style={{ color: '#ef4444' }}>YAMAHA</span>
            </span>
            <p className="hidden sm:block text-[10px] font-medium leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {lang === 'si' ? 'කඹුරුපිටිය සේවා මධ්‍යස්ථානය' : 'Kamburupitiya Authorized Service'}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation (≥ 768px) */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-body hover:text-white'
                }`}
                style={isActive ? {
                  background: 'rgba(37, 99, 235, 0.15)',
                  color: '#93c5fd',
                } : {}}
              >
                {link.name}
                {isActive && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: '#3b82f6' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Corner Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div
            className="h-8 flex items-center p-0.5 rounded-lg text-xs font-semibold gap-0.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              title="English"
              className={`h-7 px-2.5 rounded-md text-xs transition-all duration-200 ${
                lang === 'en'
                  ? 'text-white font-bold'
                  : 'text-mutedText hover:text-white'
              }`}
              style={lang === 'en' ? {
                background: 'rgba(37, 99, 235, 0.6)',
                boxShadow: '0 1px 6px rgba(37, 99, 235, 0.4)',
              } : {}}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('si')}
              title="සිංහල"
              className={`h-7 px-2.5 rounded-md text-xs transition-all duration-200 ${
                lang === 'si'
                  ? 'text-white font-bold'
                  : 'text-mutedText hover:text-white'
              }`}
              style={lang === 'si' ? {
                background: 'rgba(37, 99, 235, 0.6)',
                boxShadow: '0 1px 6px rgba(37, 99, 235, 0.4)',
              } : {}}
            >
              සිං
            </button>
          </div>

          {/* Desktop User Badge & Logout */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/profile"
                title={t('profile.viewProfile')}
                className="h-8 flex items-center gap-2 px-2.5 rounded-lg transition-all duration-200"
                style={{
                  background: location.pathname === '/profile'
                    ? 'rgba(37, 99, 235, 0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: location.pathname === '/profile'
                    ? '1px solid rgba(37, 99, 235, 0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 overflow-hidden font-bold text-[10px] text-white"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.8), rgba(37,99,235,0.5))',
                    border: '1px solid rgba(37,99,235,0.4)',
                  }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-semibold text-white truncate max-w-[90px]">
                  {user.name}
                </span>
                {user.isAdmin && (
                  <span
                    className="h-5 px-1.5 rounded text-[10px] font-bold flex items-center gap-0.5"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {t('common.admin').toUpperCase()}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={logout}
                title={t('nav.logout')}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(220,38,38,0.15)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : loading ? (
            <div className="hidden md:inline-flex h-8 w-20 rounded-lg animate-pulse bg-white/5 border border-white/10" />
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex h-8 px-4 rounded-lg text-white font-semibold text-xs items-center justify-center transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 2px 12px rgba(37, 99, 235, 0.35)',
                border: '1px solid rgba(37,99,235,0.5)',
              }}
            >
              {t('nav.login')}
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open mobile menu"
            className="md:hidden min-w-[44px] min-h-[44px] h-10 w-10 flex items-center justify-center text-white rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
