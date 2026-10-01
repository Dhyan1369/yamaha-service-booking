import { useState } from 'react';
import { User, Phone, CreditCard, Bike, Mail, Lock, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePhone, validateNIC, validatePassword } from '../../lib/validation';

export default function AuthModal({ isOpen, onClose }) {
  const { loginWithPhonePassword, signUpWithPhonePassword } = useAuth();
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    phone: '',
    email: '',
    password: '',
    name: '',
    nic: '',
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

  const validateForm = () => {
    const errors = {};

    const passCheck = validatePassword(form.password);
    if (!passCheck.valid) errors.password = passCheck.message;

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) errors.phone = phoneCheck.message;

    if (mode === 'signup') {
      if (!form.name.trim()) errors.name = 'Full Name is required';

      const nicCheck = validateNIC(form.nic);
      if (!nicCheck.valid) errors.nic = nicCheck.message;

      // Email is optional in signup
      if (form.email && form.email.trim()) {
        const emailCheck = validateEmail(form.email, true);
        if (!emailCheck.valid) errors.email = emailCheck.message;
      }
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
        await loginWithPhonePassword(form.phone.trim(), form.password);
        handleModalClose();
      } else if (mode === 'signup') {
        await signUpWithPhonePassword(form.phone.trim(), form.password, {
          name: form.name.trim(),
          nic: form.nic.trim().toUpperCase(),
          phone: form.phone.trim(),
          bikeModel: form.bikeModel,
          email: form.email.trim()
        });
        handleModalClose();
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('දුරකථන අංකය හෝ මුරපදය වැරදියි. කරුණාකර නැවත උත්සාහ කරන්න. (Invalid phone number or password)');
      } else if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg('මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත. කරුණාකර Sign In වන්න. (Phone number is already registered)');
      } else if (msg.includes('invalid') || msg.includes('Email')) {
        setErrorMsg(msg);
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
      subtitle={mode === 'signin' ? 'Enter your registered phone number and password' : 'Create an account to manage your bookings'}
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

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* Sign In Form Fields */}
          {mode === 'signin' && (
            <>
              <Input
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="e.g. 0771234567"
                required
                maxLength={10}
                value={form.phone}
                error={fieldErrors.phone}
                helperText="Enter your 10-digit mobile number (e.g. 0771234567)"
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
                helperText="Must be at least 6 characters"
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
              />
            </>
          )}

          {/* Sign Up Form Fields */}
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
                helperText="Must be exactly 10 digits (e.g. 0771234567)"
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                }}
              />

              <Input
                label="Email / Gmail Address (Optional)"
                icon={Mail}
                type="email"
                placeholder="e.g. kamal@gmail.com (Optional)"
                value={form.email}
                error={fieldErrors.email}
                helperText="අනිවාර්ය නැත (Optional) - Leave blank if you don't have one"
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
                  setForm({ ...form, nic: e.target.value });
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
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign In (Login)' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
