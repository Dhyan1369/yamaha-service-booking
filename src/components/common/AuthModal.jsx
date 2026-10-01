import { useState } from 'react';
import { User, Phone, CreditCard, Bike, Mail, Lock, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePhone, validateNIC, validatePassword } from '../../lib/validation';

export default function AuthModal({ isOpen, onClose }) {
  const { loginWithEmailPassword, signUpWithEmailPassword, googleLogin } = useAuth();
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    nic: '',
    phone: '',
    bikeModel: 'Yamaha FZ-S V3'
  });

  const resetForm = () => {
    setErrorMsg('');
    setFieldErrors({});
    setLoading(false);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await googleLogin();
      handleModalClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) errors.email = emailCheck.message;

    const passCheck = validatePassword(form.password);
    if (!passCheck.valid) errors.password = passCheck.message;

    if (mode === 'signup') {
      if (!form.name.trim()) errors.name = 'Full Name is required';

      const phoneCheck = validatePhone(form.phone);
      if (!phoneCheck.valid) errors.phone = phoneCheck.message;

      const nicCheck = validateNIC(form.nic);
      if (!nicCheck.valid) errors.nic = nicCheck.message;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        await loginWithEmailPassword(form.email.trim(), form.password);
        handleModalClose();
      } else if (mode === 'signup') {
        await signUpWithEmailPassword(form.email.trim(), form.password, {
          name: form.name.trim(),
          nic: form.nic.trim().toUpperCase(),
          phone: form.phone.trim(),
          bikeModel: form.bikeModel
        });
        handleModalClose();
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('invalid') || msg.includes('Email')) {
        setErrorMsg(`Email error: ${msg}. Please verify your email format.`);
      } else {
        setErrorMsg(msg || 'Authentication failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={mode === 'signin' ? 'Sign In to Account' : 'Create New Account'}
      subtitle={mode === 'signin' ? 'Enter your registered email and password' : 'Create an account to manage your bookings'}
    >
      <div className="space-y-4">
        {/* Navigation Mode Selector Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); setFieldErrors({}); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'signin' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In (Login)
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setFieldErrors({}); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'signup' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register (Sign Up)
          </button>
        </div>

        {/* Error Notification Alert Banner */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Option */}
        {(
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold py-2.5 px-4 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-wider">Or with Email</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>
          </>
        )}

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {mode !== 'quick' && (
            <>
              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="e.g. kamal@gmail.com"
                required
                value={form.email}
                error={fieldErrors.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
              />

              <Input
                label="Password"
                icon={Lock}
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                error={fieldErrors.password}
                helperText="Must be at least 6 characters"
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
              />
            </>
          )}

          {mode === 'signup' && (
            <>
              <Input
                label="Your Full Name"
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
                label="ID Card (NIC) Number"
                icon={CreditCard}
                placeholder="e.g. 951234567V or 199512345678"
                required
                maxLength={12}
                value={form.nic}
                error={fieldErrors.nic}
                helperText="9 digits + V (e.g. 951234567V) or 12 digits"
                onChange={(e) => {
                  setForm({ ...form, nic: e.target.value });
                  if (fieldErrors.nic) setFieldErrors({ ...fieldErrors, nic: '' });
                }}
              />

              <Input
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="e.g. 0771234567"
                required
                maxLength={10}
                value={form.phone}
                error={fieldErrors.phone}
                helperText="Must be exactly 10 digits (e.g. 0771234567)"
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                }}
              />

              <Input
                label="Bike Model"
                icon={Bike}
                placeholder="e.g. Yamaha FZ-S V3"
                required
                value={form.bikeModel}
                onChange={(e) => setForm({ ...form, bikeModel: e.target.value })}
              />
            </>
          )}

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleModalClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign In (Login)' : mode === 'signup' ? 'Create Account' : 'Save Details'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
