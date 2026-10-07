import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, CreditCard, Bike, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { validateEmail, validatePhone, validateNIC, validatePassword } from '../../lib/validation';

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

export default function AuthModal({ isOpen, onClose, initialMode = 'signin', redirectTo = null }) {
  const { loginWithPhonePassword, signUpWithPhonePassword, resetPassword } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const resolveMode = (m) => (m === 'signup' || m === 'forgot' ? m : 'signin');

  // mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState(() => resolveMode(initialMode));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setMode(resolveMode(initialMode));
    }
  }, [isOpen, initialMode]);

  const [form, setForm] = useState({
    loginInput: '',   // phone OR email for sign-in
    phone: '',
    email: '',
    password: '',
    name: '',
    nic: '',
    bikeModel: 'Yamaha FZ-S V3',
    resetEmail: ''
  });

  const resetForm = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setFieldErrors({});
    setLoading(false);
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleModalClose = () => {
    resetForm();
    setMode('signin');
    onClose();
  };

  const validateForm = () => {
    const errors = {};

    if (mode === 'signin') {
      if (!form.loginInput.trim()) {
        errors.loginInput = lang === 'si' ? 'දුරකථන අංකය හෝ විද්‍යුත් තැපෑල අවශ්‍යයි' : 'Phone number or email is required';
      }
      const passCheck = validatePassword(form.password);
      if (!passCheck.valid) errors.password = passCheck.message;
    }

    if (mode === 'signup') {
      if (!form.name.trim()) {
        errors.name = lang === 'si' ? 'සම්පූර්ණ නම අවශ්‍යයි' : 'Full Name is required';
      }
      const phoneCheck = validatePhone(form.phone);
      if (!phoneCheck.valid) errors.phone = phoneCheck.message;
      const passCheck = validatePassword(form.password);
      if (!passCheck.valid) errors.password = passCheck.message;
      if (form.email && form.email.trim()) {
        const emailCheck = validateEmail(form.email, true);
        if (!emailCheck.valid) errors.email = emailCheck.message;
      }
      const nicCheck = validateNIC(form.nic);
      if (!nicCheck.valid) errors.nic = nicCheck.message;
    }

    if (mode === 'forgot') {
      const emailCheck = validateEmail(form.resetEmail);
      if (!emailCheck.valid) errors.resetEmail = emailCheck.message;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === 'signin') {
        await loginWithPhonePassword(form.loginInput.trim(), form.password);
        handleModalClose();
        if (redirectTo) {
          navigate(redirectTo);
        }
      } else if (mode === 'signup') {
        await signUpWithPhonePassword(form.phone.trim(), form.password, {
          name: form.name.trim(),
          nic: form.nic.trim().toUpperCase(),
          phone: form.phone.trim(),
          bikeModel: form.bikeModel,
          email: form.email.trim()
        });
        setSuccessMsg('registered');
      } else if (mode === 'forgot') {
        await resetPassword(form.resetEmail.trim());
        setSuccessMsg('reset_sent');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
        setErrorMsg(t('auth.errInvalidCreds'));
      } else if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg(t('auth.errAlreadyRegistered'));
      } else {
        setErrorMsg(msg || (lang === 'si' ? 'යම් දෝෂයක් සිදු විය. නැවත උත්සාහ කරන්න.' : 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationDone = () => {
    handleModalClose();
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  if (successMsg === 'registered') {
    return (
      <Modal isOpen={isOpen} onClose={handleRegistrationDone} title={t('auth.regSuccessTitle')} subtitle={t('auth.regSuccessSubtitle')}>
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto text-green-400">
            <CheckCircle className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{t('auth.regSuccessTitle')}</h3>
            <p className="text-sm text-green-400 font-medium">{t('auth.regSuccessSubtitle')}</p>
            <p className="text-xs text-slate-400 mt-2">{t('auth.welcomeCustomer')}, {form.name || t('common.customer')}!</p>
          </div>
          <Button type="button" variant="primary" className="w-full" onClick={handleRegistrationDone}>
            {t('auth.continueBtn')}
          </Button>
        </div>
      </Modal>
    );
  }

  if (successMsg === 'reset_sent') {
    return (
      <Modal isOpen={isOpen} onClose={handleModalClose} title={t('auth.resetSentTitle')} subtitle={t('auth.resetSentDesc')}>
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Mail className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{t('auth.resetSentTitle')}</h3>
            <p className="text-sm text-blue-400 font-medium">{form.resetEmail}</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {t('auth.resetSentDesc')}
            </p>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => switchMode('signin')}>
            {t('auth.backToSignIn')}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      maxWidth={mode === 'signup' ? 'max-w-2xl' : 'max-w-md'}
      title={
        mode === 'signup' ? t('auth.signUpTitle') :
        mode === 'forgot' ? t('auth.forgotTitle') :
        t('auth.signInTitle')
      }
      subtitle={
        mode === 'signup' ? t('auth.signUpSubtitle') :
        mode === 'forgot' ? t('auth.forgotSubtitle') :
        t('auth.signInSubtitle')
      }
    >
      <div className="space-y-4">

        {mode !== 'forgot' && (
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'signin' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.tabSignIn')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'signup' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.tabSignUp')}
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('auth.backToSignIn')}
          </button>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>

          {mode === 'signin' && (
            <>
              <Input
                label={t('auth.loginInputLabel')}
                icon={Phone}
                type="text"
                placeholder={t('auth.loginInputPlaceholder')}
                required
                value={form.loginInput}
                error={fieldErrors.loginInput}
                helperText={t('auth.loginInputHelper')}
                onChange={(e) => {
                  setForm({ ...form, loginInput: e.target.value });
                  if (fieldErrors.loginInput) setFieldErrors({ ...fieldErrors, loginInput: '' });
                }}
              />

              <Input
                label={t('auth.passwordLabel')}
                icon={Lock}
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                error={fieldErrors.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
              />

              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition underline underline-offset-2"
                >
                  {t('auth.forgotPasswordLink')}
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label={t('auth.fullNameLabel')}
                icon={User}
                placeholder="e.g. Kasun Kalhara"
                required
                value={form.name}
                error={fieldErrors.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
              />

              <Input
                label={t('auth.phoneLabel')}
                icon={Phone}
                type="tel"
                placeholder="0771234567"
                required
                maxLength={10}
                value={form.phone}
                error={fieldErrors.phone}
                helperText={t('auth.phoneHelper')}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                }}
              />

              <Input
                label={t('auth.nicLabel')}
                icon={CreditCard}
                placeholder="951234567V / 199512345678"
                required
                maxLength={12}
                value={form.nic}
                error={fieldErrors.nic}
                helperText={t('auth.nicHelper')}
                onChange={(e) => {
                  setForm({ ...form, nic: e.target.value.toUpperCase() });
                  if (fieldErrors.nic) setFieldErrors({ ...fieldErrors, nic: '' });
                }}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('auth.bikeModelLabel')} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Bike className="w-4 h-4" />
                  </div>
                  <select
                    value={form.bikeModel}
                    onChange={(e) => setForm({ ...form, bikeModel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500"
                  >
                    {YAMAHA_MODELS.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label={t('auth.passwordLabel')}
                icon={Lock}
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                error={fieldErrors.password}
                helperText={t('profile.passwordHelper')}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
              />

              <Input
                label={t('auth.emailLabel')}
                icon={Mail}
                type="email"
                placeholder="name@email.com (optional)"
                value={form.email}
                error={fieldErrors.email}
                helperText={t('auth.emailHelper')}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
              />
            </div>
          )}

          {mode === 'forgot' && (
            <>
              <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200/80 leading-relaxed">
                <p className="font-semibold text-white mb-1">{t('auth.passwordResetInstructions')}</p>
                <p>{t('auth.passwordResetHelp')}</p>
                <p className="mt-1.5 text-amber-300/80">
                  ⚠️ {t('auth.phoneOnlyHelp')}
                </p>
              </div>
              <Input
                label={t('auth.resetEmailLabel')}
                icon={Mail}
                type="email"
                placeholder="e.g. kamal@gmail.com"
                required
                value={form.resetEmail}
                error={fieldErrors.resetEmail}
                helperText={t('auth.resetEmailHelper')}
                onChange={(e) => {
                  setForm({ ...form, resetEmail: e.target.value });
                  if (fieldErrors.resetEmail) setFieldErrors({ ...fieldErrors, resetEmail: '' });
                }}
              />
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleModalClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? t('auth.processing') :
               mode === 'signin' ? t('auth.submitSignIn') :
               mode === 'signup' ? t('auth.submitSignUp') :
               t('auth.submitReset')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

