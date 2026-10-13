import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ChevronRight, Wrench, Award, Zap, Calendar, Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useLanguage } from '../context/LanguageContext';
import { getNextOpenBookingDate } from '../services/bookingService';
import SlotSelector from '../components/booking/SlotSelector';
import WorkshopGallery from '../components/home/WorkshopGallery';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getSlotStats, refreshAvailability } = useBookings();
  const [showSlots, setShowSlots] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState(() => getNextOpenBookingDate());

  useEffect(() => {
    if (showSlots && selectedSlotDate) {
      refreshAvailability(selectedSlotDate);
    }
  }, [showSlots, selectedSlotDate, refreshAvailability]);

  const slotStats = getSlotStats(selectedSlotDate);

  const handleOpenBooking = () => {
    if (user?.isAdmin) { navigate('/admin'); return; }
    if (!user) { navigate('/login', { state: { redirectTo: '/booking' } }); return; }
    navigate('/booking');
  };

  const handleViewSlots = () => setShowSlots((prev) => !prev);

  const features = [
    {
      icon: Zap,
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.25)',
      title: t('home.feature1Title'),
      desc: t('home.feature1Desc'),
    },
    {
      icon: Award,
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.25)',
      title: t('home.feature2Title'),
      desc: t('home.feature2Desc'),
    },
    {
      icon: ShieldCheck,
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      title: t('home.feature3Title'),
      desc: t('home.feature3Desc'),
    },
  ];

  return (
    <div className="pb-16">
      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-16 pb-24"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% -10%, rgba(37, 99, 235, 0.14) 0%, transparent 65%),' +
            'radial-gradient(ellipse 60% 40% at 10% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 50%),' +
            'var(--bg-page)',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Decorative glowing orb */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7 animate-fadeIn"
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              color: '#93c5fd',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.1)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {t('home.badge')}
          </div>

          {/* Main Heading */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1] animate-fadeInUp"
            style={{ animationDelay: '0.05s' }}
          >
            {t('home.heroTitlePrefix')}
            <br className="hidden sm:block" />
            <span
              style={{
                background: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 50%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('home.heroTitleHighlight')}
            </span>
            <span className="text-red-500">.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeInUp"
            style={{ color: 'var(--text-body)', animationDelay: '0.1s' }}
          >
            {t('home.heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 animate-fadeInUp"
            style={{ animationDelay: '0.15s' }}
          >
            <button
              onClick={handleOpenBooking}
              className="w-full sm:w-auto px-7 py-3.5 font-bold text-base text-white flex items-center justify-center gap-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 24px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                border: '1px solid rgba(37, 99, 235, 0.5)',
              }}
            >
              <Wrench className="w-5 h-5" />
              <span>{user?.isAdmin ? t('home.manageAdminDashboard') : t('home.bookServiceNow')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleViewSlots}
              className="w-full sm:w-auto px-6 py-3.5 font-semibold text-base flex items-center justify-center gap-2.5 rounded-xl transition-all duration-200"
              style={showSlots ? {
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                color: '#93c5fd',
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f0f4ff',
              }}
            >
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>{showSlots ? t('home.hideAvailableSlots') : t('home.viewAvailableSlots')}</span>
            </button>
          </div>

          {/* Slot Panel */}
          {showSlots && (
            <div
              className="mt-8 max-w-2xl mx-auto p-6 sm:p-7 rounded-2xl text-left animate-fadeInUp"
              style={{
                background: 'rgba(13, 21, 37, 0.95)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>{t('booking.viewSlotsByDateTitle')}</span>
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {t('booking.viewSlotsByDateSubtitle')}
                  </p>
                </div>
                <div
                  className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold text-blue-300"
                  style={{
                    background: 'rgba(37, 99, 235, 0.12)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedSlotDate}</span>
                </div>
              </div>

              {/* Date Selector */}
              <div className="mt-5">
                <SlotSelector
                  selectedDate={selectedSlotDate}
                  onDateChange={(newDate) => setSelectedSlotDate(newDate)}
                  label={t('booking.selectDate')}
                  defaultOpen={true}
                  keepOpen={true}
                  inline={true}
                />
              </div>

              {/* Slot Stats */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {t('home.totalSlotsLabel')}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-extrabold text-white">
                        {slotStats.availableSlots}{' '}
                        <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ {slotStats.maxDailySlots}</span>
                      </p>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={slotStats.isDayFull ? {
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                        } : {
                          background: 'rgba(16,185,129,0.15)',
                          color: '#34d399',
                        }}
                      >
                        {slotStats.isDayFull ? t('home.quotaFull') : `${slotStats.availableSlots} ${t('home.slotsLeft')}`}
                      </span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                      {slotStats.totalBooked} {t('home.bookedSoFar')}
                    </p>
                  </div>

                  {/* Free */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(37, 99, 235, 0.05)',
                      border: '1px solid rgba(37, 99, 235, 0.12)',
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {t('home.freeServiceLabel')}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-extrabold text-blue-400">
                        {slotStats.availableFreeSlots}{' '}
                        <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ {slotStats.maxFreeServices}</span>
                      </p>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={slotStats.isFreeServiceFull ? {
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                        } : {
                          background: 'rgba(37,99,235,0.15)',
                          color: '#93c5fd',
                        }}
                      >
                        {slotStats.isFreeServiceFull ? t('home.quotaFull') : `${slotStats.availableFreeSlots} ${t('home.slotsLeft')}`}
                      </span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                      {t('home.max5Quota')}
                    </p>
                  </div>

                  {/* Standard */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.12)',
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {t('home.standardServiceLabel')}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-extrabold" style={{ color: '#c084fc' }}>
                        {slotStats.availableStandardSlots}{' '}
                        <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ {slotStats.maxStandardServices}</span>
                      </p>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={slotStats.isStandardServiceFull ? {
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                        } : {
                          background: 'rgba(139,92,246,0.15)',
                          color: '#c084fc',
                        }}
                      >
                        {slotStats.isStandardServiceFull ? t('home.quotaFull') : `${slotStats.availableStandardSlots} ${t('home.slotsLeft')}`}
                      </span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                      {t('home.max7Quota')}
                    </p>
                  </div>
                </div>

                {/* Book for date row */}
                <div
                  className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      {t('home.nextEstimatedToken')} #{String(slotStats.nextAvailableToken).padStart(2, '0')} ({slotStats.nextSlotTime})
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={slotStats.isDayFull}
                    onClick={() => {
                      if (user?.isAdmin) navigate('/admin');
                      else if (!user) navigate('/login', { state: { redirectTo: '/booking', selectedDate: selectedSlotDate } });
                      else navigate('/booking', { state: { selectedDate: selectedSlotDate } });
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
                    style={slotStats.isDayFull ? {
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-subtle)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'not-allowed',
                    } : {
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: '#fff',
                      border: '1px solid rgba(37,99,235,0.5)',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                    }}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{t('booking.bookForThisDate')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-16">
        <div
          className="grid grid-cols-3 divide-x rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(13, 21, 37, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            divideColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {[
            { value: '12K+', label: 'Bikes Serviced', color: '#3b82f6' },
            { value: '10+ Yrs', label: 'Authorized Dealer', color: '#ef4444' },
            { value: '12/Day', label: 'Max Daily Tokens', color: '#10b981' },
          ].map((stat, i) => (
            <div
              key={i}
              className="py-4 sm:py-5 px-4 sm:px-6 text-center"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
            >
              <p className="text-xl sm:text-2xl font-black" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WORKSHOP HIGHLIGHTS
      ═══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3">
            Why Choose Us
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('home.whyChooseTitle')}
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('home.whyChooseSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {features.map(({ icon: Icon, color, glowColor, title, desc }, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl transition-all duration-300 cursor-default animate-fadeInUp"
              style={{
                background: 'linear-gradient(135deg, rgba(17, 29, 48, 0.9) 0%, rgba(13, 21, 37, 0.8) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}33`;
                e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}1a, inset 0 1px 0 rgba(255,255,255,0.07)`;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Icon bubble */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                  boxShadow: `0 4px 12px ${glowColor}`,
                }}
              >
                <Icon className="w-5.5 h-5.5" style={{ color }} />
              </div>

              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          GALLERY
      ═══════════════════════════════════════ */}
      <WorkshopGallery />
    </div>
  );
}
