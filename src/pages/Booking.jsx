import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, CalendarCheck, Shield, ArrowRight } from 'lucide-react';
import BookingForm from '../components/booking/BookingForm';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

export default function Booking() {
  const { lang, t } = useLanguage();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = Boolean(profile?.role === 'admin' || user?.isAdmin || user?.role === 'admin');

  // If user is Admin, guide them to use the Walk-In Booking workflow inside Admin Portal
  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 animate-fadeIn">
        <div
          className="p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(37, 99, 235, 0.15)',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #ef4444, #3b82f6)' }}
          />

          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Shield className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {t('booking.staffNoticeBadge', 'STAFF PORTAL NOTICE')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              {t('booking.staffNoticeHeadline', 'Staff Portal Notice: Direct Booking Restricted')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed pt-1">
              {t(
                'booking.staffNoticeBody',
                'You are logged in with administrator privileges. To issue a service token for a walk-in rider or phone-in customer, please use the Walk-In Token Manager in your Admin Dashboard.'
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/admin?action=walkin', { state: { openWalkIn: true } })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[48px] px-6 text-sm font-bold shadow-lg"
            >
              <span>{t('booking.openWalkInManagerBtn', 'Open Walk-In Token Manager')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto min-h-[48px] px-6 text-sm"
            >
              {t('booking.returnHomeBtn', 'Return to Home')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
          <CalendarCheck className="w-3.5 h-3.5" /> {t('booking.badge')}
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-mainText">{t('booking.heroTitle')}</h1>
        <p className="text-xs sm:text-sm text-mutedText mt-2">
          {t('booking.heroSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Booking Form Card */}
        <div
          className="lg:col-span-7 p-4 sm:p-6 lg:p-8 rounded-2xl transition-colors duration-200"
          style={{
            background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          <h2 className="text-lg font-bold text-white mb-1">{t('booking.formTitle')}</h2>
          <p className="text-xs text-subText mb-6">{t('booking.formSubtitle')}</p>
          <BookingForm />
        </div>

        {/* Informational Guidance Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className="p-6 rounded-2xl space-y-4 transition-colors duration-200"
            style={{
              background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> {t('booking.policyTitle')}
            </h3>
            <ul className="text-xs space-y-3" style={{ color: 'var(--text-body)' }}>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">{t('booking.policyCapTitle')}</strong> {t('booking.policyCapDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">{t('booking.policyFreeTitle')}</strong> {t('booking.policyFreeDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">{t('booking.policyTimingTitle')}</strong> {t('booking.policyTimingDesc')}
                </span>
              </li>
            </ul>
          </div>

          <div
            className="p-5 rounded-2xl flex items-start gap-3 text-xs"
            style={{
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">{t('booking.holidayNoticeTitle')}</p>
              <p className="text-amber-200/80 mt-1 leading-relaxed">
                {t('booking.holidayNoticeDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
