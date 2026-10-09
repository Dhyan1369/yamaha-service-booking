import { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validatePhone } from '../lib/validation';

export default function ContactUs() {
  const { lang, t } = useLanguage();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bikeModel: 'Yamaha FZ-S V3',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name.trim()) {
      setErrorMsg(lang === 'si' ? 'කරුණාකර ඔබගේ නම ඇතුළත් කරන්න.' : 'Please enter your name.');
      return;
    }

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.message);
      return;
    }

    if (!form.message.trim()) {
      setErrorMsg(lang === 'si' ? 'කරුණාකර පණිවිඩය ඇතුළත් කරන්න.' : 'Please enter your inquiry message.');
      return;
    }

    setLoading(true);
    // Simulate inquiry recording
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', phone: '', bikeModel: 'Yamaha FZ-S V3', message: '' });
      setTimeout(() => setSubmitted(false), 8000);
    }, 600);
  };

  return (
    <div className="min-h-screen py-10 sm:py-16">
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
            className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-sm hover:border-brandPrimary/40 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-brandPrimary flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Phone className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                {t('contact.callWorkshopLabel', 'Direct Telephone')}
              </p>
              <h2 className="text-lg font-bold text-heading mt-1 font-mono">
                041 229 5678
              </h2>
              <p className="text-xs text-mutedText mt-1">
                077 123 4567 (Mobile)
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-brandPrimary inline-flex items-center gap-1 group-hover:underline">
              {t('contact.callNowBtn', 'Call Workshop Now')} →
            </span>
          </a>

          {/* WhatsApp Chat */}
          <a
            href="https://wa.me/94771234567"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-sm hover:border-emerald-500/40 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <MessageCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                {t('contact.whatsappLabel', 'WhatsApp Service Desk')}
              </p>
              <h2 className="text-lg font-bold text-heading mt-1 font-mono">
                +94 77 123 4567
              </h2>
              <p className="text-xs text-mutedText mt-1">
                {t('contact.whatsappDesc', 'Fast chat inquiries & token questions')}
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:underline">
              {t('contact.chatWhatsappBtn', 'Open WhatsApp Chat')} →
            </span>
          </a>

          {/* Location & Directions */}
          <a
            href="https://maps.google.com/?q=Kamburupitiya,Sri+Lanka"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-sm hover:border-brandPrimary/40 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                {t('contact.locationLabel', 'Workshop Location')}
              </p>
              <h2 className="text-base font-bold text-heading mt-1">
                Manju Yamaha Service Center
              </h2>
              <p className="text-xs text-mutedText mt-1">
                Main Street, Kamburupitiya, Matara
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 group-hover:underline">
              {t('contact.getDirectionsBtn', 'Get Directions')} →
            </span>
          </a>
        </div>

        {/* Working Hours & Inquiry Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Workshop Details & Hours Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-sm space-y-5">
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
                  <span className="font-semibold text-heading">Sunday</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">8:30 AM – 1:30 PM</span>
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

              <div className="p-3 bg-muted rounded-xl text-[11px] text-mutedText flex items-start gap-2">
                <Calendar className="w-4 h-4 text-brandPrimary shrink-0 mt-0.5" />
                <span>
                  {t('contact.advancePolicyNote', 'Remember: Online bookings must be placed at least 1 day in advance before 11:59 PM.')}
                </span>
              </div>
            </div>

            {/* Map Preview Card */}
            <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border-subtle flex items-center justify-between">
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

          {/* Direct Inquiry Contact Form */}
          <div className="lg:col-span-7 bg-surface border border-border-subtle p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full bg-surface dark:bg-slate-950 border border-border rounded-xl px-3.5 py-2.5 text-mainText text-sm outline-none transition focus:border-brandPrimary focus:ring-1 focus:ring-brandPrimary"
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
                <label className="block text-xs font-semibold text-subText mb-1.5">
                  {t('contact.messageLabel', 'Your Message / Inquiry')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={t('contact.messagePlaceholder', 'Describe your inquiry or question (e.g. Free service entitlement, spare part inquiry, noise inspection)...')}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-surface dark:bg-slate-950 border border-border rounded-xl px-3.5 py-2.5 text-mainText text-sm outline-none transition focus:border-brandPrimary focus:ring-1 focus:ring-brandPrimary resize-none"
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
          </div>
        </div>

      </div>
    </div>
  );
}
