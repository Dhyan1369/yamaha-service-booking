import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Wrench, 
  Award, 
  Clock, 
  CheckCircle2, 
  Users, 
  Zap, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';

export default function AboutUs() {
  const { lang, t } = useLanguage();

  const stats = [
    {
      value: '10+',
      label: t('about.statYears', 'Years of Authorized Service'),
      sub: t('about.statYearsSub', 'Serving Kamburupitiya & Matara')
    },
    {
      value: '12,000+',
      label: t('about.statBikes', 'Yamaha Bikes Serviced'),
      sub: t('about.statBikesSub', 'FZ, R15, MT-15, RayZR, Aerox')
    },
    {
      value: '100%',
      label: t('about.statGenuine', 'Genuine Yamalube & OEM Parts'),
      sub: t('about.statGenuineSub', 'Direct from Yamaha Japan / SL')
    },
    {
      value: '12 / Day',
      label: t('about.statTokens', 'Daily Precision Token Queue'),
      sub: t('about.statTokensSub', 'Zero waiting, dedicated 45-min bay')
    }
  ];

  const standards = [
    {
      icon: Wrench,
      title: t('about.standard1Title', 'Certified Yamaha Technicians'),
      desc: t('about.standard1Desc', 'Our workshop technicians undergo rigorous factory training in Yamaha electronic fuel injection (FI), VVA systems, ABS diagnostics, and engine overhaul.')
    },
    {
      icon: Award,
      title: t('about.standard2Title', 'Computerized Diagnostic Tool (YDT)'),
      desc: t('about.standard2Desc', 'We utilize genuine Yamaha Diagnostic Tools (YDT) to scan fault codes, calibrate sensors, read engine data streams, and update firmware for flawless performance.')
    },
    {
      icon: ShieldCheck,
      title: t('about.standard3Title', '100% Genuine Yamalube Formulation'),
      desc: t('about.standard3Desc', 'Engine protection starts with the right lubricant. We use factory-recommended Yamalube 4T oils, coolants, brake fluids, and genuine Yamaha air/oil filters.')
    },
    {
      icon: Clock,
      title: t('about.standard4Title', 'Transparent Scheduled Booking'),
      desc: t('about.standard4Desc', 'Our daily cap of 12 service tokens (5 Free Services + 7 Normal/Full Services) ensures every rider receives dedicated, unhurried precision maintenance.')
    }
  ];

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-brandPrimary text-xs font-bold border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('about.badge', 'Authorized Yamaha Service Dealer')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-heading tracking-tight leading-tight">
            {t('about.heroTitle', 'Precision Engineering & Authorized Care in Kamburupitiya')}
          </h1>

          <p className="text-body text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t('about.heroSubtitle', 'Manju Yamaha Service Center is the trusted destination for genuine Yamaha motorcycle maintenance in the Southern Province. We preserve your bike’s performance, warranty, and resale value through strict Japanese quality standards.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
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

        {/* Statistics Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:border-brandPrimary/40 transition"
            >
              <div>
                <p className="text-3xl sm:text-4xl font-black text-brandPrimary tracking-tight">
                  {item.value}
                </p>
                <h3 className="text-sm font-bold text-heading mt-2">
                  {item.label}
                </h3>
              </div>
              <p className="text-xs text-mutedText mt-3 pt-3 border-t border-border-subtle">
                {item.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Brand Story & Authorized Commitment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface border border-border-subtle rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brandPrimary">
              {t('about.storyBadge', 'Our Commitment')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
              {t('about.storyTitle', 'Why Yamaha Riders Trust Manju Yamaha Service')}
            </h2>
            <p className="text-body text-xs sm:text-sm leading-relaxed">
              {t('about.storyP1', 'Located centrally in Kamburupitiya, Manju Yamaha Service Center was founded with a singular purpose: to deliver dealership-level precision maintenance without unnecessary delays or compromise on parts authenticity.')}
            </p>
            <p className="text-body text-xs sm:text-sm leading-relaxed">
              {t('about.storyP2', 'Whether you ride a brand-new Yamaha FZ-S V3 requiring scheduled Free Service under warranty, a high-performance R15 V4 / MT-15 demanding meticulous valve clearance adjustments, or a daily commuter RayZR 125, our technicians handle every motorcycle with factory-prescribed torque specifications and computerized diagnostics.')}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-heading">
              <span className="px-3 py-1.5 rounded-xl bg-muted border border-border-subtle flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('about.bullet1', 'Free Service Warranty Claim Compliance')}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-muted border border-border-subtle flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('about.bullet2', 'Official Service Book Endorsement')}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-muted border border-border-subtle flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('about.bullet3', 'Environmentally Safe Waste Disposal')}</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border-subtle shadow-md">
            <img
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80"
              alt="Manju Yamaha Workshop Facility"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Kamburupitiya Workshop
                </p>
                <p className="text-sm font-bold mt-0.5">
                  Authorized Technical Diagnostic Bay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Technical Standards */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-heading">
              {t('about.standardsHeader', 'Our Authorized Service Standards')}
            </h2>
            <p className="text-mutedText text-xs sm:text-sm">
              {t('about.standardsSubtitle', 'Every bike entering our facility is inspected through a rigorous checklist to ensure optimum safety and performance.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {standards.map((std, idx) => {
              const Icon = std.icon;
              return (
                <div
                  key={idx}
                  className="bg-surface border border-border-subtle rounded-2xl p-6 sm:p-7 shadow-sm hover:border-brandPrimary/30 transition flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-brandPrimary border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-heading">
                      {std.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-body leading-relaxed">
                      {std.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black">
              {t('about.ctaTitle', 'Ready for Scheduled Service?')}
            </h2>
            <p className="text-blue-200 text-xs sm:text-sm max-w-lg">
              {t('about.ctaSubtitle', 'Book your service token online in advance. Skip the morning queue and have your bike serviced at your exact scheduled slot.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/booking">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-white text-blue-900 hover:bg-slate-100 font-bold text-sm transition shadow-md"
              >
                {t('nav.bookService', 'Book a Service Now')}
              </button>
            </Link>
            <Link to="/contact">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition"
              >
                {t('about.viewLocation', 'Find Our Location')}
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
