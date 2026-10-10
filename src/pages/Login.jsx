import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, Lock, AlertCircle, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { validatePassword } from '../lib/validation';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, loginWithPhonePassword } = useAuth();
  const { lang, t } = useLanguage();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectTo = location.state?.from?.pathname || location.state?.redirectTo || (user?.isAdmin ? '/admin' : '/dashboard');

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
        <div
          className="max-w-md w-full p-8 text-center space-y-5 rounded-2xl"
          style={{
            background: 'rgba(13, 21, 37, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: '#34d399' }} />
          </div>
          <h2 className="text-xl font-bold text-white">
            {lang === 'si' ? 'ඔබ දැනටමත් ඇතුල් වී ඇත' : 'Already Signed In'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {lang === 'si'
              ? `${user.name} ලෙස ඇතුල් වී ඇත (${user.phone}).`
              : `Signed in as ${user.name} (${user.phone}).`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/')}>
              {t('nav.home')}
            </Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate(user.isAdmin ? '/admin' : '/dashboard')}>
              {user.isAdmin ? t('nav.adminDashboard') : t('nav.myDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmedInput = loginInput.trim();
    if (!trimmedInput) {
      setErrorMsg(lang === 'si' ? 'කරුණාකර දුරකථන අංකය හෝ විද්‍යුත් තැපෑල ඇතුළත් කරන්න.' : 'Please enter your phone number or email.');
      return;
    }
    const passCheck = validatePassword(password);
    if (!passCheck.valid) { setErrorMsg(passCheck.message); return; }

    setLoading(true);
    try {
      await loginWithPhonePassword(trimmedInput, password);
      navigate(redirectTo, { replace: true, state: location.state });
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
        setErrorMsg(t('auth.errInvalidCreds'));
      } else {
        setErrorMsg(msg || (lang === 'si' ? 'ඇතුල්වීමේ දෝෂයක් සිදු විය.' : 'Sign-in failed. Please check your credentials.'));
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
      <div className="max-w-md w-full space-y-5">
        {/* Back link */}
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
            {t('common.branchName')}
          </span>
        </div>

        {/* Card */}
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

          <div className="p-7 sm:p-8">
            {/* Header */}
            <div className="text-center mb-7">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)',
                }}
              >
                <Shield className="w-7 h-7" style={{ color: '#60a5fa' }} />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {t('auth.signInTitle')}
              </h1>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {t('auth.signInSubtitle')}
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div
                className="mb-5 p-3.5 rounded-xl flex items-start gap-2.5 animate-fadeIn"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                <span className="text-xs font-medium leading-relaxed" style={{ color: '#fca5a5' }}>
                  {errorMsg}
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.loginInputLabel')}
                icon={Phone}
                type="text"
                required
                autoFocus
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder={t('auth.loginInputPlaceholder')}
                helperText={t('auth.loginInputHelper')}
              />

              <Input
                label={t('auth.passwordLabel')}
                icon={Lock}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full mt-2"
                size="md"
              >
                {loading ? t('auth.processing') : t('auth.submitSignIn')}
              </Button>
            </form>

            {/* Register link */}
            <div
              className="mt-6 pt-5 text-center"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {lang === 'si' ? 'ගිණුමක් නොමැතිද?' : "Don't have an account yet?"}{' '}
                <Link
                  to="/register"
                  state={{
                    from: location.state?.from,
                    redirectTo: location.state?.redirectTo,
                    selectedDate: location.state?.selectedDate,
                  }}
                  className="font-bold transition-colors"
                  style={{ color: '#60a5fa' }}
                >
                  {lang === 'si' ? 'මෙහි ලියාපදිංචි වන්න' : 'Register Customer Account'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
