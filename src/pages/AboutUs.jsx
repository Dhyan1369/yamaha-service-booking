import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Wrench,
  Award,
  Clock,
  CheckCircle2,
  ChevronRight,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';

export default function AboutUs() {
  const { lang, t } = useLanguage();

  const stats = [
    { value: '10+', label: t('about.statYears', 'Years of Authorized Service'), sub: t('about.statYearsSub', 'Serving Kamburupitiya & Matara'), color: '#3b82f6' },
    { value: '12K+', label: t('about.statBikes', 'Yamaha Bikes Serviced'), sub: t('about.statBikesSub', 'FZ, R15, MT-15, RayZR, Aerox'), color: '#ef4444' },
    { value: '100%', label: t('about.statGenuine', 'Genuine Yamalube & OEM Parts'), sub: t('about.statGenuineSub', 'Direct from Yamaha Japan / SL'), color: '#10b981' },
    { value: '12/Day', label: t('about.statTokens', 'Daily Precision Token Queue'), sub: t('about.statTokensSub', 'Zero waiting, dedicated 45-min bay'), color: '#a78bfa' },
  ];

  const standards = [
    { icon: Wrench, title: t('about.standard1Title', 'Certified Yamaha Technicians'), desc: t('about.standard1Desc', 'Our workshop technicians undergo rigorous factory training in Yamaha electronic fuel injection (FI), VVA systems, ABS diagnostics, and engine overhaul.'), color: '#3b82f6' },
    { icon: Award, title: t('about.standard2Title', 'Computerized Diagnostic Tool (YDT)'), desc: t('about.standard2Desc', 'We utilize genuine Yamaha Diagnostic Tools (YDT) to scan fault codes, calibrate sensors, read engine data streams, and update firmware for flawless performance.'), color: '#f59e0b' },
    { icon: ShieldCheck, title: t('about.standard3Title', '100% Genuine Yamalube Formulation'), desc: t('about.standard3Desc', 'Engine protection starts with the right lubricant. We use factory-recommended Yamalube 4T oils, coolants, brake fluids, and genuine Yamaha air/oil filters.'), color: '#10b981' },
    { icon: Clock, title: t('about.standard4Title', 'Transparent Scheduled Booking'), desc: t('about.standard4Desc', 'Our daily cap of 12 service tokens (5 Free Services + 7 Normal/Full Services) ensures every rider receives dedicated, unhurried precision maintenance.'), color: '#a78bfa' },
  ];

  return (
    <div
      className="min-h-screen py-10 sm:py-16"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37, 99, 235, 0.07) 0%, transparent 60%),' +
          'var(--bg-page)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* ── Hero ── */}
        <div className="max-w-3xl mx-auto text-center space-y-5 animate-fadeInUp">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              color: '#93c5fd',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('about.badge', 'Authorized Yamaha Service Dealer')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {t('about.heroTitle', 'Precision Engineering & Authorized Care in Kamburupitiya')}
          </h1>

          <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-body)' }}>
            {t('about.heroSubtitle', 'Manju Yamaha Service Center is the trusted destination for genuine Yamaha motorcycle maintenance in the Southern Province.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/booking">
              <Button variant="primary" size="md" className="gap-2">
                <CalendarCheck className="w-4 h-4" />
                <span>{t('nav.bookService', 'Book a Service Now')}</span>
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="md" className="gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t('about.contactWorkshopBtn', 'Contact Workshop')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="group p-5 sm:p-6 rounded-2xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(17, 29, 48, 0.9) 0%, rgba(13, 21, 37, 0.8) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${item.color}33`;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${item.color}1a`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
              }}
            >
              <p className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: item.color }}>
                {item.value}
              </p>
              <h3 className="text-xs sm:text-sm font-bold text-white mt-2">{item.label}</h3>
              <p
                className="text-[11px] mt-2 pt-2"
                style={{
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {item.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Brand Story ── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl p-6 sm:p-10 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 29, 48, 0.95) 0%, rgba(13, 21, 37, 0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>
              {t('about.storyBadge', 'Our Commitment')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('about.storyTitle', 'Why Yamaha Riders Trust Manju Yamaha Service')}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
              {t('about.storyP1', 'Located centrally in Kamburupitiya, Manju Yamaha Service Center was founded with a singular purpose: to deliver dealership-level precision maintenance without unnecessary delays or compromise on parts authenticity.')}
            </p>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
              {t('about.storyP2', 'Whether you ride a brand-new Yamaha FZ-S V3 requiring scheduled Free Service under warranty, a high-performance R15 V4, or a daily commuter RayZR 125, our technicians handle every motorcycle with factory-prescribed torque specifications.')}
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              {[t('about.bullet1', 'Free Service Warranty Claim Compliance'), t('about.bullet2', 'Official Service Book Endorsement'), t('about.bullet3', 'Environmentally Safe Waste Disposal')].map((b) => (
                <span
                  key={b}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#6ee7b7',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80"
              alt="Manju Yamaha Workshop Facility"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex items-end p-5"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>
                  Kamburupitiya Workshop
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  Authorized Technical Diagnostic Bay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Standards ── */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3">Service Standards</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('about.standardsHeader', 'Our Authorized Service Standards')}
            </h2>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {t('about.standardsSubtitle', 'Every bike entering our facility is inspected through a rigorous checklist.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {standards.map((std, idx) => {
              const Icon = std.icon;
              return (
                <div
                  key={idx}
                  className="group p-6 sm:p-7 rounded-2xl flex items-start gap-4 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(17, 29, 48, 0.9) 0%, rgba(13, 21, 37, 0.8) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${std.color}30`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: `${std.color}15`,
                      border: `1px solid ${std.color}25`,
                    }}
                  >
                    <Icon className="w-5.5 h-5.5" style={{ color: std.color }} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white">{std.title}</h3>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{std.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 60%, #1d4ed8 100%)',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
          }}
        >
          {/* Background orb */}
          <div
            className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
          />
          <div className="relative space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {t('about.ctaTitle', 'Ready for Scheduled Service?')}
            </h2>
            <p className="text-sm max-w-lg" style={{ color: 'rgba(191, 219, 254, 0.8)' }}>
              {t('about.ctaSubtitle', 'Book your service token online in advance. Skip the morning queue.')}
            </p>
          </div>
          <div className="relative flex flex-wrap items-center gap-3">
            <Link to="/booking">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-white font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
                style={{ color: '#1d4ed8' }}
              >
                <CalendarCheck className="w-4 h-4" />
                {t('nav.bookService', 'Book a Service Now')}
              </button>
            </Link>
            <Link to="/contact">
              <button
                type="button"
                className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <ChevronRight className="w-4 h-4" />
                {t('about.viewLocation', 'Find Our Location')}
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
