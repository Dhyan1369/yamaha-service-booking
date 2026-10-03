import { useState } from 'react';
import { User, Phone, CreditCard, Bike, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePhone, validateNIC, validatePassword } from '../../lib/validation';

export default function AuthModal({ isOpen, onClose }) {
  const { loginWithPhonePassword, signUpWithPhonePassword, resetPassword } = useAuth();

  // mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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
      if (!form.loginInput.trim()) errors.loginInput = 'Phone number or email is required';
      const passCheck = validatePassword(form.password);
      if (!passCheck.valid) errors.password = passCheck.message;
    }

    if (mode === 'signup') {
      if (!form.name.trim()) errors.name = 'Full Name is required';
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
        setErrorMsg('Phone/email or password is incorrect. Please try again. (දුරකථන/ඊමේල් හෝ මුරපදය වැරදියි)');
      } else if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg('This phone number is already registered. Please Sign In instead.');
      } else {
        setErrorMsg(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (successMsg === 'registered') {
    return (
      <Modal isOpen={isOpen} onClose={handleModalClose} title="Registration Successful" subtitle="Your account has been created">
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto text-green-400">
            <CheckCircle className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">ලියාපදිංචිය සාර්ථකයි!</h3>
            <p className="text-sm text-green-400 font-medium">ඔබගේ ගිණුම සාර්ථකව ලියාපදිංචි කරන ලදී.</p>
            <p className="text-xs text-slate-400 mt-2">Welcome to Manju Yamaha Service, {form.name || 'Customer'}!</p>
          </div>
          <Button type="button" variant="primary" className="w-full" onClick={handleModalClose}>
            Continue (ඉදිරියට යන්න)
          </Button>
        </div>
      </Modal>
    );
  }

  if (successMsg === 'reset_sent') {
    return (
      <Modal isOpen={isOpen} onClose={handleModalClose} title="Reset Link Sent" subtitle="Check your email inbox">
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Mail className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Reset Link Sent!</h3>
            <p className="text-sm text-blue-400 font-medium">{form.resetEmail}</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              ඔබගේ email inbox බලන්න. Password reset link එකක් යවා ඇත.<br />
              (Check your email inbox for the password reset link.)
            </p>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => switchMode('signin')}>
            Back to Sign In
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        mode === 'signin' ? 'Sign In to Account' :
        mode === 'signup' ? 'Create New Account' :
        'Reset Password'
      }
      subtitle={
        mode === 'signin' ? 'Enter your phone number or email and password' :
        mode === 'signup' ? 'Create an account to manage your bookings' :
        'Enter the email linked to your account'
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
              Sign In (Login)
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'signup' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register (Sign Up)
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
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
                label="Phone Number or Email"
                icon={Phone}
                type="text"
                placeholder="0771234567 or kamal@gmail.com"
                required
                value={form.loginInput}
                error={fieldErrors.loginInput}
                helperText="Enter your phone number OR your email address"
                onChange={(e) => {
                  setForm({ ...form, loginInput: e.target.value });
                  if (fieldErrors.loginInput) setFieldErrors({ ...fieldErrors, loginInput: '' });
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
                  Forgot Password? (මුරපදය අමතකද?)
                </button>
              </div>
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
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="e.g. 0771234567"
                required
                maxLength={10}
                value={form.phone}
                error={fieldErrors.phone}
                helperText="Must be exactly 10 digits — used to login"
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
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
                helperText="At least 6 characters"
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
              />
              <Input
                label="Email Address (Optional — for password reset)"
                icon={Mail}
                type="email"
                placeholder="e.g. kamal@gmail.com"
                value={form.email}
                error={fieldErrors.email}
                helperText="ඊමේල් නැතිනම් හිස් තබන්න. Password reset කිරීමට ඊමේල් ඕනෑ."
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
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
                  setForm({ ...form, nic: e.target.value.toUpperCase() });
                  if (fieldErrors.nic) setFieldErrors({ ...fieldErrors, nic: '' });
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

          {mode === 'forgot' && (
            <>
              <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200/80 leading-relaxed">
                <p className="font-semibold text-white mb-1">Password Reset Instructions</p>
                <p>ඔබගේ ගිණුමේ email ලිපිනය ඇතුළත් කරන්න. Reset link එකක් ඔබේ inbox වෙත යවනු ලැබේ.</p>
                <p className="mt-1.5 text-amber-300/80">
                  ⚠️ Phone number පමණක් භාවිතා කර ලියාපදිංචි වූ users: workshop admin ට සම්බන්ධ වන්න.
                </p>
              </div>
              <Input
                label="Your Email Address"
                icon={Mail}
                type="email"
                placeholder="e.g. kamal@gmail.com"
                required
                value={form.resetEmail}
                error={fieldErrors.resetEmail}
                helperText="Must be the email you used during registration"
                onChange={(e) => {
                  setForm({ ...form, resetEmail: e.target.value });
                  if (fieldErrors.resetEmail) setFieldErrors({ ...fieldErrors, resetEmail: '' });
                }}
              />
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? 'Processing...' :
               mode === 'signin' ? 'Sign In' :
               mode === 'signup' ? 'Create Account' :
               'Send Reset Link'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
