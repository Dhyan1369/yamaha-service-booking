import { Bike, Phone, MapPin, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #060a12 0%, #040710 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top gradient line */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.5) 30%, rgba(220,38,38,0.3) 70%, transparent 100%)' }}
      />

      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.04) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Summary */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                }}
              >
                <Bike className="w-4.5 h-4.5" />
              </div>
              <span className="font-black text-sm tracking-wider" style={{ color: '#ffffff' }}>
                Manju <span style={{ color: '#ef4444' }}>Yamaha</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#34d399' }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('footer.genuineParts')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              {t('footer.quickNav')}
            </h4>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/booking', label: t('nav.bookService') },
                { to: '/about', label: t('nav.about') },
                { to: '/contact', label: t('nav.contact') },
                { to: '/dashboard', label: t('nav.myDashboard') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-1.5 text-xs transition-all duration-200 group"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <ChevronRight
                      className="w-3 h-3 text-blue-600 group-hover:translate-x-0.5 transition-transform"
                    />
                    <span className="group-hover:text-blue-400 transition-colors">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {t('footer.workingHours')}
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <li>{t('footer.monSat')}</li>
              <li>{t('footer.sunday')}</li>
              <li className="mt-2" style={{ color: '#fbbf24' }}>
                {t('footer.holidayNote')}
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              {t('footer.centerTitle')}
            </h4>
            <p className="text-xs mb-2.5" style={{ color: 'var(--text-muted)' }}>
              {t('footer.location')}
            </p>
            <p className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-body)' }}>
              <Phone className="w-3 h-3 text-blue-500 shrink-0" />
              041 229 5678 / 077 123 4567
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-subtle)' }}
        >
          <p>
            © {new Date().getFullYear()} Manju Yamaha Service, Kamburupitiya.{' '}
            {t('footer.allRights')}
          </p>
          <p className="text-[11px]">{t('footer.dailyCapNote')}</p>
        </div>
      </div>
    </footer>
  );
}
