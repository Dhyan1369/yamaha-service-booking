import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  CreditCard, 
  Mail, 
  Bike, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Wrench,
  Calendar
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { validatePhone, validateNIC, validateEmail } from '../lib/validation';

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

export default function Profile() {
  const { user, updateCustomerProfile, openAuthModal } = useAuth();
  const { getUserBookings } = useBookings();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nic, setNic] = useState(user?.nic || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bikeModel, setBikeModel] = useState(user?.bikeModel || 'Yamaha FZ-S V3');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign-in Required</h2>
        <p className="text-xs text-slate-400 mb-6">
          ඔබගේ ගිණුමේ විස්තර බැලීමට සහ සංස්කරණය කිරීමට කරුණාකර පළමුව Sign-in වන්න.
        </p>
        <Button variant="primary" size="md" onClick={openAuthModal}>
          Login / Sign In Now
        </Button>
      </div>
    );
  }

  const userBookings = getUserBookings(user);
  const activeBookings = userBookings.filter(b => b.status === 'Pending' || b.status === 'In-Service');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validations
    if (!name.trim()) {
      setErrorMessage('කරුණාකර ඔබගේ නම ඇතුළත් කරන්න (Name is required).');
      return;
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      setErrorMessage(phoneCheck.message);
      return;
    }

    if (nic.trim()) {
      const nicCheck = validateNIC(nic);
      if (!nicCheck.valid) {
        setErrorMessage(nicCheck.message);
        return;
      }
    }

    if (email.trim()) {
      const emailCheck = validateEmail(email, true);
      if (!emailCheck.valid) {
        setErrorMessage(emailCheck.message);
        return;
      }
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMessage('මුරපදය අවම වශයෙන් අකුරු/ඉලක්කම් 6කින් සමන්විත විය යුතුය (Password must be at least 6 characters).');
      return;
    }

    try {
      setSaving(true);
      const profileUpdates = {
        name: name.trim(),
        phone: phone.trim().replace(/[\s-]/g, ''),
        nic: nic.trim().toUpperCase(),
        email: email.trim(),
        bikeModel: bikeModel.trim()
      };

      if (newPassword) {
        profileUpdates.password = newPassword;
      }

      await updateCustomerProfile(profileUpdates);
      setNewPassword('');
      setSuccessMessage('ඔබගේ ගිණුම් විස්තර සාර්ථකව යාවත්කාලීන කරන ලදී! (Profile updated successfully!)');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setErrorMessage(err.message || 'ගිණුම් විස්තර යාවත්කාලීන කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/booking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Book Service</span>
          </Link>
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
          <Bike className="w-48 h-48 text-blue-500" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-blue-600/30 ring-4 ring-slate-800">
              {(user.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.name}
                </h1>
                {user.isAdmin ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ADMIN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> CUSTOMER
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-slate-300">{user.phone}</span>
                {user.email && (
                  <>
                    <span>•</span>
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Summary Pill Counters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Bookings</p>
              <p className="text-lg font-bold text-white">{userBookings.length}</p>
            </div>
            <div className="flex-1 sm:flex-none bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Tokens</p>
              <p className="text-lg font-bold text-blue-400">{activeBookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="border-b border-slate-800 pb-5 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <span>ගිණුම් විස්තර සංස්කරණය (Edit Account Details)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ඔබගේ නම, දුරකථන අංකය සහ යතුරුපැදි විස්තර මෙතැනින් වෙනස් කළ හැක.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Personal Info */}
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-3">
              1. පුද්ගලික තොරතුරු (Personal Information)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name (සම්පූර්ණ නම)"
                icon={User}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Kalhara"
                helperText="ඔබගේ සැබෑ නම ඇතුළත් කරන්න"
              />

              <Input
                label="Phone Number (දුරකථන අංකය)"
                icon={Phone}
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                helperText="ඉලක්කම් 10කින් යුත් වලංගු දුරකථන අංකය"
              />

              <Input
                label="NIC Number (ජාතික හැඳුනුම්පත් අංකය)"
                icon={CreditCard}
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                placeholder="e.g. 199512345678 or 951234567V"
                helperText="නව (ඉලක්කම් 12) හෝ පැරණි (9 + V) ආකෘතිය"
              />

              <Input
                label="Email Address (විද්‍යුත් තැපෑල - Optional)"
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kasun@gmail.com"
                helperText="අත්‍යවශ්‍ය නොවේ (කැමති නම් පමණක් ඇතුළත් කරන්න)"
              />
            </div>
          </div>

          {/* Section: Motorcycle Info */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-3">
              2. යතුරුපැදි විස්තර (Motorcycle Details)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Default Yamaha Bike Model <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Bike className="w-4 h-4" />
                  </div>
                  <select
                    value={bikeModel}
                    onChange={(e) => setBikeModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500"
                  >
                    {YAMAHA_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Booking දැමීමේදී මෙම මාදිලිය ස්වයංක්‍රීයව තෝරාගනු ලැබේ.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Security / Password Change */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-1">
              3. මුරපදය වෙනස් කිරීම (Change Password - Optional)
            </p>
            <p className="text-xs text-slate-500 mb-3">
              මුරපදය වෙනස් කිරීමට අවශ්‍ය නම් පමණක් මෙහි නව මුරපදයක් ඇතුළත් කරන්න.
            </p>
            <div className="max-w-md">
              <Input
                label="New Password (නව මුරපදය)"
                icon={Lock}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                helperText="අවම වශයෙන් අකුරු/ඉලක්කම් 6ක් ඇතුළත් කරන්න"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              * වෙනස්කම් සිදුකිරීමෙන් පසු "Save Changes" බොත්තම ඔබන්න.
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={Save}
                className="flex-1 sm:flex-none shadow-lg shadow-blue-600/30"
              >
                Save Changes (සුරකින්න)
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
