import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Inbox,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validatePhone } from '../lib/validation';
import { inquiryService } from '../services/inquiryService';

export default function ContactUs() {
  const { lang, t } = useLanguage();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = Boolean(profile?.role === 'admin' || user?.isAdmin || user?.role === 'admin');

  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    phone: user?.phone || '',
    bikeModel: user?.bikeModel || user?.defaultBikeModel || 'Yamaha FZ-S V3',
    message: ''
  }));

  // Auto-fill logged-in customer's details when authenticated or session hydrates
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        bikeModel: prev.bikeModel && prev.bikeModel !== 'Yamaha FZ-S V3'
          ? prev.bikeModel
          : (user.bikeModel || user.defaultBikeModel || 'Yamaha FZ-S V3')
      }));
    }
  }, [user]);

  // Anti-Spam Honeypot state (invisible to genuine users)
  const [companyWebsite, setCompanyWebsite] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Honeypot check: If bot filled the hidden input, silently fake success and abort
    if (companyWebsite && companyWebsite.trim()) {
      setSubmitted(true);
      setForm({ name: '', phone: '', bikeModel: 'Yamaha FZ-S V3', message: '' });
      setTimeout(() => setSubmitted(false), 8000);
      return;
    }

    // 2. Client-side rate-limiting / throttling (60-second cooldown per device)
    const lastSubmitTime = sessionStorage.getItem('last_inquiry_timestamp');
    if (lastSubmitTime) {
      const elapsedSeconds = Math.floor((Date.now() - parseInt(lastSubmitTime, 10)) / 1000);
      if (elapsedSeconds < 60) {
        const remaining = 60 - elapsedSeconds;
        const msg = (t('contact.cooldownNotice') || 'Please wait {seconds} seconds before sending another inquiry.')
          .replace('{seconds}', remaining);
        setErrorMsg(msg);
        return;
      }
    }

    // 3. Validation & Sanitization
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setErrorMsg(lang === 'si' ? 'කරුණාකර ඔබගේ නම ඇතුළත් කරන්න.' : 'Please enter your name.');
      return;
    }

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.message);
      return;
    }

    const trimmedMessage = form.message.trim();
    if (trimmedMessage.length < 5) {
      setErrorMsg(t('contact.tooShortError') || (lang === 'si' ? 'පණිවිඩය අවම වශයෙන් අකුරු 5ක් විය යුතුය.' : 'Message must be at least 5 characters long.'));
      return;
    }

    try {
      setLoading(true);

      // 4. Dispatch to Supabase
      await inquiryService.submitInquiry({
        name: trimmedName,
        phone: form.phone,
        bikeModel: form.bikeModel,
        message: trimmedMessage
      });

      // Set cooldown timestamp
      sessionStorage.setItem('last_inquiry_timestamp', Date.now().toString());

      setSubmitted(true);
      setForm({
        name: user?.name || '',
        phone: user?.phone || '',
        bikeModel: user?.bikeModel || user?.defaultBikeModel || 'Yamaha FZ-S V3',
        message: ''
      });
      setCompanyWebsite('');
      setTimeout(() => setSubmitted(false), 9000);
    } catch (err) {
      console.error('[ContactUs] Inquiry submission error:', err);
      setErrorMsg(err.message || (lang === 'si' ? 'පණිවිඩය යැවීමට නොහැකි විය. නැවත උත්සාහ කරන්න.' : 'Failed to send inquiry. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-10 sm:py-16"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37, 99, 235, 0.07) 0%, transparent 60%),' +
          'var(--bg-page)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-brandPrimary text-xs font-bold border border-blue-500/20">
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('contact.badge', 'Kamburupitiya Authorized Center')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-heading tracking-tight">
            {t('contact.heroTitle', 'Contact Our Service Center')}
          </h1>
          <p className="text-body text-xs sm:text-sm">
            {t('contact.heroSubtitle', 'Have questions about a service booking, warranty check, or spare parts? Reach our workshop team directly or visit our Kamburupitiya facility.')}
          </p>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Call Workshop */}
          <a
            href="tel:0412295678"
            className="p-6 rounded-2xl transition-all duration-300 group flex flex-col justify-between"
            style={{ background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <Phone className="w-5 h-5" style={{ color: '#3b82f6' }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('contact.callWorkshopLabel', 'Direct Telephone')}
              </p>
              <h2 className="text-lg font-bold text-white mt-1 font-mono">
                041 229 5678
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                076 444 5645 (Mobile)
              </p>
            </div>
            <span className="mt-4 text-xs font-bold inline-flex items-center gap-1" style={{ color: '#60a5fa' }}>
              {t('contact.callNowBtn', 'Call Workshop Now')} →
            </span>
          </a>

          {/* WhatsApp Chat */}
          <a
            href="https://wa.me/9476077666"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl transition-all duration-300 group flex flex-col justify-between"
            style={{ background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <MessageCircle className="w-5 h-5" style={{ color: '#34d399' }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('contact.whatsappLabel', 'WhatsApp Service Desk')}
              </p>
              <h2 className="text-lg font-bold text-white mt-1 font-mono">
                +94 76 075 5223
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('contact.whatsappDesc', 'Fast chat inquiries & token questions')}
              </p>
            </div>
            <span className="mt-4 text-xs font-bold inline-flex items-center gap-1" style={{ color: '#34d399' }}>
              {t('contact.chatWhatsappBtn', 'Open WhatsApp Chat')} →
            </span>
          </a>

          {/* Location & Directions */}
          <a
            href="https://maps.app.goo.gl/uuqba75rx2GphWxN8"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl transition-all duration-300 group flex flex-col justify-between"
            style={{ background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <MapPin className="w-5 h-5" style={{ color: '#818cf8' }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('contact.locationLabel', 'Workshop Location')}
              </p>
              <h2 className="text-base font-bold text-white mt-1">
                Manju Yamaha Service Center
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Main Street, Kamburupitiya, Matara
              </p>
            </div>
            <span className="mt-4 text-xs font-bold inline-flex items-center gap-1" style={{ color: '#818cf8' }}>
              {t('contact.getDirectionsBtn', 'Get Directions')} →
            </span>
          </a>
        </div>

        {/* Working Hours & Inquiry Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Workshop Details & Hours Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className="p-6 rounded-2xl space-y-5"
              style={{ background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            >
              <h2 className="text-base font-bold text-heading flex items-center gap-2">
                <Clock className="w-5 h-5 text-brandPrimary" />
                <span>{t('contact.workingHoursTitle', 'Workshop Working Hours')}</span>
              </h2>

              <div className="divide-y divide-border-subtle text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-heading">Tuesday – Saturday</span>
                  <span className="font-mono text-brandPrimary font-bold">8:00 AM – 5:30 PM</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Sunday</span>
                  <span className="font-mono font-bold text-xs" style={{ color: '#fbbf24' }}>8:30 AM – 1:30 PM</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-red-500">Monday</span>
                  <span className="text-red-500 font-bold">Closed (Weekly Holiday)</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-mutedText">Poya & Mercantile Holidays</span>
                  <span className="text-mutedText italic">Closed / Special Token Schedule</span>
                </div>
              </div>

              <div
                className="p-3 rounded-xl text-[11px] flex items-start gap-2"
                style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.12)', color: 'var(--text-muted)' }}
              >
                <Calendar className="w-4 h-4 text-brandPrimary shrink-0 mt-0.5" />
                <span>
                  {t('contact.advancePolicyNote', 'Remember: Online bookings must be placed at least 1 day in advance before 11:59 PM.')}
                </span>
              </div>
            </div>

            {/* Map Preview Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brandPrimary" />
                  <span>Kamburupitiya, Matara</span>
                </span>
                <a
                  href="https://maps.google.com/?q=Kamburupitiya,Sri+Lanka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-brandPrimary hover:underline flex items-center gap-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="h-56 w-full bg-muted">
                <iframe
                  title="Manju Yamaha Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15873.344449830588!2d80.554625!3d6.084792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae143f25d97f5ef%3A0xbcf2390772dd962b!2sKamburupitiya!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          {/* Direct Inquiry Contact Form OR Admin Quick-Action Card */}
          <div
            className="lg:col-span-7 p-6 sm:p-8 rounded-2xl space-y-6"
            style={{ background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          >
            {isAdmin ? (
              <div className="py-6 sm:py-8 px-2 text-center space-y-6 animate-fadeIn">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Inbox className="w-8 h-8 text-blue-400" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {lang === 'si' ? 'පරිපාලක දැක්ම' : 'ADMINISTRATOR VIEW'}
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-2">
                    {t('contact.adminViewTitle', 'Administrator View')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                    {t(
                      'contact.adminViewDesc',
                      'Customer inquiries submitted through this page are routed directly to your workshop queue. You do not need to submit inquiries here.'
                    )}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/admin?tab=inquiries')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-6 text-sm font-bold shadow-lg"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('contact.goToInquiriesBtn', 'Go to Customer Messages')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/admin')}
                    className="w-full sm:w-auto min-h-[44px] px-6 text-sm"
                  >
                    {t('contact.goToAdminBtn', 'Admin Dashboard')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-heading">
                    {t('contact.formTitle', 'Send Us a Direct Inquiry')}
                  </h2>
                  <p className="text-xs text-mutedText mt-1">
                    {t('contact.formSubtitle', 'Fill out your details below and our service supervisor will get back to you.')}
                  </p>
                </div>

                {submitted && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-bold">{t('contact.submitSuccessTitle', 'Inquiry Sent Successfully!')}</p>
                      <p className="text-xs mt-0.5 text-emerald-600/90 dark:text-emerald-400/90">
                        {t('contact.submitSuccessDesc', 'Thank you. Our workshop manager has received your message and will contact you via phone.')}
                      </p>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {user && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      {lang === 'si'
                        ? `ඔබ ${user.name} ලෙස ඇතුල් වී ඇත (${user.phone}). ඔබගේ තොරතුරු ස්වයංක්‍රීයව පුරවා ඇත.`
                        : `Signed in as ${user.name} (${user.phone}). Your details have been auto-filled.`}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Invisible Honeypot Field (Bot Trap) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: '1px',
                      height: '1px',
                      overflow: 'hidden',
                      opacity: 0
                    }}
                    aria-hidden="true"
                  >
                    <input
                      type="text"
                      name="company_website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t('common.name', 'Full Name')}
                      required
                      placeholder="e.g. Kasun Kalhara"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    <Input
                      label={t('common.phone', 'Phone Number')}
                      type="tel"
                      required
                      placeholder="0771234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      helperText="10-digit mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-subText mb-1.5">
                      {t('common.bikeModel', 'Yamaha Bike Model')}
                    </label>
                    <select
                      value={form.bikeModel}
                      onChange={(e) => setForm({ ...form, bikeModel: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-heading)',
                      }}
                      onFocus={e => { e.currentTarget.style.border = '1px solid rgba(37,99,235,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="Yamaha FZ-S V3">Yamaha FZ-S V3</option>
                      <option value="Yamaha MT-15 V2">Yamaha MT-15 V2</option>
                      <option value="Yamaha R15 V4">Yamaha R15 V4</option>
                      <option value="Yamaha FZ-X">Yamaha FZ-X</option>
                      <option value="Yamaha RayZR 125 Hybrid">Yamaha RayZR 125 Hybrid</option>
                      <option value="Yamaha Aerox 155">Yamaha Aerox 155</option>
                      <option value="Yamaha WR 155R">Yamaha WR 155R</option>
                      <option value="Other Yamaha Model">Other Yamaha Model</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-subText">
                        {t('contact.messageLabel', 'Your Message / Inquiry')} <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[11px] font-mono ${form.message.length >= 480 ? 'text-amber-400 font-bold' : 'text-mutedText'}`}>
                        {form.message.length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      maxLength={500}
                      placeholder={t('contact.messagePlaceholder', 'Describe your inquiry or question (e.g. Free service entitlement, spare part inquiry, noise inspection)...')}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-heading)',
                        caretColor: '#3b82f6',
                      }}
                      onFocus={e => { e.currentTarget.style.border = '1px solid rgba(37,99,235,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={loading}
                    className="w-full gap-2 mt-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? t('common.saving', 'Sending...') : t('contact.sendMessageBtn', 'Send Inquiry')}</span>
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
