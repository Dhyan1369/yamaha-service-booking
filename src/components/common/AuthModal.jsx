import { useState } from 'react';
import { User, Phone, CreditCard, Bike } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../hooks/useAuth';

export default function AuthModal({ isOpen, onClose }) {
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({
    name: '',
    nic: '',
    phone: '',
    bikeModel: 'Yamaha FZ-S V3'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.nic) return;

    login({
      name: form.name,
      nic: form.nic,
      phone: form.phone,
      bikeModel: form.bikeModel,
      method: 'Manual Registration'
    });
    onClose();
  };

  const handleGoogleSignIn = () => {
    googleLogin();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Sign-in"
      subtitle="Booking එකක් සිදුකිරීමට කරුණාකර ඔබගේ විස්තර ඇතුළත් කරන්න."
    >
      <div className="space-y-4">
        {/* Google Sign-in Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold py-2.5 px-4 rounded-xl transition shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800" />
          <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-wider">Or fill details</span>
          <div className="flex-grow border-t border-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Full Name"
            icon={User}
            placeholder="e.g. Kasun Kalhara"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            label="ID Card (NIC) Number"
            icon={CreditCard}
            placeholder="e.g. 199512345678"
            required
            value={form.nic}
            onChange={(e) => setForm({ ...form, nic: e.target.value })}
          />

          <Input
            label="Phone Number"
            icon={Phone}
            type="tel"
            placeholder="e.g. 0771234567"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <Input
            label="Bike Model"
            icon={Bike}
            placeholder="e.g. Yamaha FZ-S V3"
            required
            value={form.bikeModel}
            onChange={(e) => setForm({ ...form, bikeModel: e.target.value })}
          />

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
