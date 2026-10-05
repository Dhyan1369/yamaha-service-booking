import { useState, useRef } from 'react';
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
  Edit3,
  Shield
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const editFormRef = useRef(null);

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
        <h2 className="text-2xl font-bold text-white mb-2">{t('profile.loginRequired')}</h2>
        <p className="text-xs text-slate-400 mb-6">
          {t('profile.loginRequiredDesc')}
        </p>
        <Button variant="primary" size="md" onClick={openAuthModal}>
          {t('profile.loginBtn')}
        </Button>
      </div>
    );
  }

  const userBookings = getUserBookings(user);
  const activeBookings = userBookings.filter(b => b.status === 'Pending' || b.status === 'In-Service');

  const scrollToEditForm = () => {
    editFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validations
    if (!name.trim()) {
      setErrorMessage(t('profile.errNameRequired'));
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
      setErrorMessage(t('profile.errPasswordMin'));
      return;
    }

    try {
      setSaving(true);
      const profileUpdates = {
        name: name.trim(),
        phone: phone.trim().replace(/[\s-]/g, ''),
        nic: nic.trim().toUpperCase(),
        email: email.trim()
      };

      // Only save bikeModel for non-admin customer profiles
      if (!user.isAdmin) {
        profileUpdates.bikeModel = bikeModel.trim();
      }

      if (newPassword) {
        profileUpdates.password = newPassword;
      }

      await updateCustomerProfile(profileUpdates);
      setNewPassword('');
      setSuccessMessage(t('profile.saveSuccess'));
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setErrorMessage(err.message || t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between">
        <Link 
          to={user.isAdmin ? '/admin' : '/dashboard'} 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{user.isAdmin ? t('profile.backToAdmin') : t('profile.backToDashboard')}</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {!user.isAdmin && (
            <Link
              to="/booking"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t('nav.bookService')}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={scrollToEditForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('nav.editProfile')}</span>
          </button>
        </div>
      </div>

      {/* Header Profile Summary Card */}
      <div 
        className={`relative overflow-hidden border rounded-3xl p-6 sm:p-8 shadow-xl ${
          user.isAdmin
            ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-900/50'
            : 'bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border-slate-800'
        }`}
      >
        {/* Background Watermark Icon */}
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
          {user.isAdmin ? (
            <Shield className="w-48 h-48 text-amber-500" />
          ) : (
            <Bike className="w-48 h-48 text-blue-500" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div 
              className={`w-16 h-16 sm:w-20 sm:h-20 text-white rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-slate-800 ${
                user.isAdmin
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-600/30'
                  : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-600/30'
              }`}
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.name}
                </h1>
                {user.isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('profile.workshopAdminBadge')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {t('profile.customerBadge')}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-slate-300 font-mono">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  {user.phone}
                </span>
                {user.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user.email}
                    </span>
                  </>
                )}
                {user.nic && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      NIC: {user.nic}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Summary Badges / Counters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user.isAdmin ? (
              <>
                <div className="flex-1 sm:flex-none bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('profile.accessLevel')}</p>
                  <p className="text-sm font-bold text-amber-300">{t('profile.fullControl')}</p>
                </div>
                <div className="flex-1 sm:flex-none bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('profile.staffRole')}</p>
                  <p className="text-sm font-bold text-white">{t('profile.workshopManager')}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 sm:flex-none bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('profile.totalBookings')}</p>
                  <p className="text-lg font-bold text-white">{userBookings.length}</p>
                </div>
                <div className="flex-1 sm:flex-none bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('profile.activeTokens')}</p>
                  <p className="text-lg font-bold text-blue-400">{activeBookings.length}</p>
                </div>
                {bikeModel && (
                  <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5 text-center">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('profile.registeredBike')}</p>
                    <p className="text-xs font-bold text-slate-200 mt-1 truncate max-w-[130px]">{bikeModel}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Edit Form Section */}
      <div ref={editFormRef} id="edit-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="border-b border-slate-800 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              <span>{t('profile.editTitle')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {user.isAdmin
                ? t('profile.editSubtitleAdmin')
                : t('profile.editSubtitleCustomer')}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            ID: {user.id || 'N/A'}
          </span>
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
          {/* Section 1: Personal Info */}
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{t('profile.personalInfo')}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.fullNameLabel')}
                icon={User}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Kalhara"
                helperText={t('profile.fullNameHelper')}
              />

              <Input
                label={t('profile.phoneLabel')}
                icon={Phone}
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                helperText={t('profile.phoneHelper')}
              />

              <Input
                label={t('profile.nicLabel')}
                icon={CreditCard}
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                placeholder="e.g. 199512345678 or 951234567V"
                helperText={t('profile.nicHelper')}
              />

              <Input
                label={t('profile.emailLabel')}
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kasun@gmail.com"
                helperText={t('profile.emailHelper')}
              />
            </div>
          </div>

          {/* Section 2: Motorcycle Info - ONLY DISPLAYED FOR REGULAR USERS (NOT ADMIN) */}
          {user.isAdmin ? (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-xs text-amber-200/90 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">{t('profile.adminNoticeTitle')}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('profile.adminNoticeDesc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
                <Bike className="w-4 h-4" />
                <span>{t('profile.motorcycleInfo')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {t('profile.defaultModelLabel')} <span className="text-red-400">*</span>
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
                    {t('profile.defaultModelHelper')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Security / Password Change */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>{user.isAdmin ? t('profile.securityInfoAdmin') : t('profile.securityInfoCustomer')}</span>
            </p>
            <p className="text-xs text-slate-500 mb-3">
              {t('profile.passwordSubtitle')}
            </p>
            <div className="max-w-md">
              <Input
                label={t('profile.newPasswordLabel')}
                icon={Lock}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                helperText={t('profile.passwordHelper')}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              {t('profile.savePrompt')}
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(user.isAdmin ? '/admin' : '/dashboard')}
                className="flex-1 sm:flex-none"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={Save}
                className="flex-1 sm:flex-none shadow-lg shadow-blue-600/30"
              >
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

