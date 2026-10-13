import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Phone, CreditCard, Bike, Lock, Mail, AlertCircle, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { validatePhone, validateNIC, validateEmail, validatePassword } from '../lib/validation';

const YAMAHA_MODELS = [
  'Yamaha FZ-S V3',
  'Yamaha MT-15 V2',
  'Yamaha R15 V4',
  'Yamaha FZ-X',
  'Yamaha RayZR 125 Hybrid',
  'Yamaha Aerox 155',
  'Yamaha WR 155R',
  'Other Yamaha Model'
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signUpWithPhonePassword } = useAuth();
  const { lang, t } = useLanguage();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    nic: '',
    bikeModel: 'Yamaha FZ-S V3',
    vehiclePlate: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const redirectTo = location.state?.from?.pathname || location.state?.redirectTo || '/dashboard';

  if (authLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-mainText">
            {lang === 'si' ? 'ඔබ දැනටමත් ගිණුමක් ඇත' : 'Already Signed In'}
          </h2>
          <p className="text-xs text-mutedText">
            {lang === 'si'
              ? `${user.name} ලෙස ඇතුල් වී ඇත (${user.phone}).`
              : `Signed in as ${user.name} (${user.phone}).`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              {t('nav.home')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => navigate('/booking')}
            >
              {t('nav.bookService')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = lang === 'si' ? 'සම්පූර්ණ නම අවශ්‍යයි' : 'Full Name is required';
    }

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) {
      errors.phone = phoneCheck.message;
    }

    const nicCheck = validateNIC(form.nic);
    if (!nicCheck.valid) {
      errors.nic = nicCheck.message;
    }

    const passCheck = validatePassword(form.password);
    if (!passCheck.valid) {
      errors.password = passCheck.message;
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = lang === 'si' ? 'මුරපද නොගැලපේ' : 'Passwords do not match';
    }

    if (form.email && form.email.trim()) {
      const emailCheck = validateEmail(form.email, true);
      if (!emailCheck.valid) {
        errors.email = emailCheck.message;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    setLoading(true);
    try {
      await signUpWithPhonePassword(form.phone.trim(), form.password, {
        name: form.name.trim(),
        nic: form.nic.trim().toUpperCase(),
        phone: form.phone.trim(),
        bikeModel: form.bikeModel,
        vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
        email: form.email.trim()
      });

      navigate(redirectTo, { replace: true, state: location.state });
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists')
      ) {
        setErrorMsg(t('auth.errAlreadyRegistered'));
      } else {
        setErrorMsg(
          msg ||
            (lang === 'si'
              ? 'ලියාපදිංචි වීමේ දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.'
              : 'Registration failed. Please verify your details and try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[88vh] flex items-center justify-center px-4 py-12 sm:px-6"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 60%),' +
          'var(--bg-page)',
      }}
    >
      <div className="max-w-xl w-full space-y-5">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.back')}</span>
          </Link>
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: '#3b82f6' }}
          >
            {t('common.brandName')}
          </span>
        </div>

        {/* Card Wrapper */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(17, 29, 48, 0.98) 0%, rgba(11, 18, 32, 0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(37,99,235,0.06)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8, transparent)' }}
          />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-blue-400 mb-3"
                style={{
                  background: 'rgba(37,99,235,0.12)',
                  border: '1px solid rgba(37,99,235,0.25)',
                }}
              >
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {t('auth.signUpTitle')}
              </h1>
              <p className="text-xs text-mutedText mt-1">
                {t('auth.signUpSubtitle')}
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t('auth.fullNameLabel')}
                    icon={User}
                    type="text"
                    required
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Kasun Kalhara"
                    error={fieldErrors.name}
                  />
                </div>

                <div>
                  <Input
                    label={t('auth.phoneLabel')}
                    icon={Phone}
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0771234567"
                    helperText={t('auth.phoneHelper')}
                    error={fieldErrors.phone}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t('auth.nicLabel')}
                    icon={CreditCard}
                    type="text"
                    required
                    value={form.nic}
                    onChange={(e) => setForm({ ...form, nic: e.target.value.toUpperCase() })}
                    placeholder="199512345678 or 951234567V"
                    helperText={t('auth.nicHelper')}
                    error={fieldErrors.nic}
                  />
                </div>

                {/* Yamaha Bike Model Selection */}
                <div>
                  <label className="block text-xs font-semibold text-subText mb-1.5">
                    {t('auth.bikeModelLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                      <Bike className="w-4 h-4" />
                    </div>
                    <select
                      value={form.bikeModel}
                      onChange={(e) => setForm({ ...form, bikeModel: e.target.value })}
                      className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none transition"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-heading)',
                      }}
                      onFocus={e => { e.currentTarget.style.border = '1px solid rgba(37,99,235,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {YAMAHA_MODELS.map((model) => (
                        <option key={model} value={model} className="bg-[#0b1329] text-white">
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label={lang === 'si' ? 'වාහන ලියාපදිංචි අංකය (අත්‍යවශ්‍ය නොවේ)' : 'Vehicle Registration Plate (Optional)'}
                  icon={CreditCard}
                  type="text"
                  value={form.vehiclePlate}
                  onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                  placeholder="e.g. WP BCD-1234"
                  helperText={lang === 'si' ? 'ඔබගේ පළමු යතුරුපැදිය garage එකට එකතු වේ' : 'Saved to your garage for quick booking'}
                />
              </div>

              <div>
                <Input
                  label={t('auth.emailLabel')}
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. kasun@gmail.com"
                  helperText={t('auth.emailHelper')}
                  error={fieldErrors.email}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Input
                  label={t('auth.passwordLabel')}
                  icon={Lock}
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={fieldErrors.password}
                />
              </div>

              <div>
                <Input
                  label={lang === 'si' ? 'මුරපදය තහවුරු කරන්න' : 'Confirm Password'}
                  icon={Lock}
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={fieldErrors.confirmPassword}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-4"
              size="md"
            >
              {loading ? t('auth.processing') : t('auth.submitSignUp')}
            </Button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-xs text-subText">
              {lang === 'si' ? 'දැනටමත් ගිණුමක් තිබේද?' : 'Already have a registered account?'}{' '}
              <Link
                to="/login"
                state={{ 
                  from: location.state?.from, 
                  redirectTo: location.state?.redirectTo,
                  selectedDate: location.state?.selectedDate 
                }}
                className="font-bold text-brandPrimary hover:underline"
              >
                {lang === 'si' ? 'මෙහි Sign In වන්න' : 'Sign In Here'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
