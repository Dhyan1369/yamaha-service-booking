import { ShieldCheck, AlertTriangle, CalendarCheck } from 'lucide-react';
import BookingForm from '../components/booking/BookingForm';
import { useLanguage } from '../context/LanguageContext';

export default function Booking() {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3">
          <CalendarCheck className="w-3.5 h-3.5" /> {t('booking.badge')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">{t('booking.heroTitle')}</h1>
        <p className="text-sm text-slate-400 mt-2">
          {t('booking.heroSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Booking Form Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1">{t('booking.formTitle')}</h2>
          <p className="text-xs text-slate-400 mb-6">{t('booking.formSubtitle')}</p>
          <BookingForm />
        </div>

        {/* Informational Guidance Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> {t('booking.policyTitle')}
            </h3>
            <ul className="text-xs text-slate-400 space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>
                  <strong>{t('booking.policyCapTitle')}</strong> {t('booking.policyCapDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>
                  <strong>{t('booking.policyFreeTitle')}</strong> {t('booking.policyFreeDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>
                  <strong>{t('booking.policyTimingTitle')}</strong> {t('booking.policyTimingDesc')}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-3 text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">{t('booking.holidayNoticeTitle')}</p>
              <p className="text-amber-300/80 mt-1">
                {t('booking.holidayNoticeDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

