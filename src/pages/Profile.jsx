import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Shield,
  X,
  Camera,
  Loader2,
  Trash2,
  Plus,
  Star,
  ChevronDown
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useVehicles } from '../hooks/useVehicles';
import { useLanguage } from '../context/LanguageContext';
import { validatePhone, validateNIC, validateEmail } from '../lib/validation';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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

// ── Image compression helper (resizes on client canvas before upload) ─────
function compressImage(file, maxDimension = 350, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', quality) });
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// ── Modern 3D Info Card for read-only profile attributes ─────────────────
function InfoCard({ icon: Icon, label, value, mono = false, required = false }) {
  if (!value && !required) return null;
  return (
    <div
      className="p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 transition-all duration-200"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'rgba(37, 99, 235, 0.12)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
        }}
      >
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        {value ? (
          <p className={`text-sm font-semibold text-white break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
        ) : (
          <p className="text-xs text-slate-500 italic">Not set — click Edit Profile to add</p>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, updateCustomerProfile } = useAuth();
  const { getUserBookings } = useBookings();
  const { vehicles, addVehicle, deleteVehicle, setDefaultVehicle } = useVehicles();
  const { t } = useLanguage();

  // ── Edit toggle ──────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);

  // ── Form state (mirrors saved profile) ──────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nic, setNic] = useState(user?.nic || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bikeModel, setBikeModel] = useState(user?.bikeModel || user?.defaultBikeModel || 'Yamaha FZ-S V3');
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehiclePlate || user?.defaultVehiclePlate || '');
  const [newPassword, setNewPassword] = useState('');

  // Keep form fields synced if user profile loads or updates in background
  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setNic(user.nic || '');
      setEmail(user.email || '');
      setBikeModel(user.bikeModel || user.defaultBikeModel || 'Yamaha FZ-S V3');
      setVehiclePlate(user.vehiclePlate || user.defaultVehiclePlate || '');
    }
  }, [user, isEditing]);

  // ── My Garage state ──────────────────────────────────────────────────────
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [newBikeModel, setNewBikeModel] = useState('Yamaha FZ-S V3');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [makeDefaultNew, setMakeDefaultNew] = useState(false);
  const [addingBike, setAddingBike] = useState(false);
  const [bikeModalError, setBikeModalError] = useState('');

  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddNewBike = async (e) => {
    e.preventDefault();
    setBikeModalError('');
    const cleanPlate = newVehiclePlate.trim().toUpperCase();
    if (!cleanPlate) {
      setBikeModalError('Please enter a vehicle plate number.');
      return;
    }
    try {
      setAddingBike(true);
      await addVehicle({
        bikeModel: newBikeModel,
        vehiclePlate: cleanPlate,
        isDefault: vehicles.length === 0 || makeDefaultNew
      });
      setNewVehiclePlate('');
      setMakeDefaultNew(false);
      setShowAddBikeModal(false);
      setSuccessMessage(t('profile.bikeAddedSuccess'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setBikeModalError(err.message || 'Failed to add bike to garage.');
    } finally {
      setAddingBike(false);
    }
  };

  const handleSetDefault = async (vehId) => {
    try {
      await setDefaultVehicle(vehId);
      setSuccessMessage(t('profile.bikeDefaultUpdated'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update default vehicle.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleDeleteBike = async (vehId) => {
    if (!window.confirm(t('profile.confirmRemoveBike'))) return;
    try {
      await deleteVehicle(vehId);
      setSuccessMessage(t('profile.bikeRemovedSuccess'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove vehicle.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // ── Session loading / not logged in guard ──────────────────────────────────
  if (loading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <p className="text-xs text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-brandBlue/10 border border-brandBlue/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brandBlue">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-mainText mb-2">{t('profile.loginRequired')}</h2>
        <p className="text-xs text-mutedText mb-6">{t('profile.loginRequiredDesc')}</p>
        <Button variant="primary" size="md" onClick={() => navigate('/login', { state: { redirectTo: '/profile' } })}>
          {t('profile.loginBtn')}
        </Button>
      </div>
    );
  }

  const userBookings = getUserBookings(user);
  const activeBookings = userBookings.filter(
    (b) => b.status === 'Pending' || b.status === 'In-Service'
  );

  // ── Cancel edit: reset form back to saved values ─────────────────────────
  const handleCancelEdit = () => {
    setName(user.name || '');
    setPhone(user.phone || '');
    setNic(user.nic || '');
    setEmail(user.email || '');
    setBikeModel(user.bikeModel || user.defaultBikeModel || 'Yamaha FZ-S V3');
    setVehiclePlate(user.vehiclePlate || user.defaultVehiclePlate || '');
    setNewPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(false);
  };

  // ── Avatar Upload Handler ──────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select a photo smaller than 5 MB.');
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { blob, dataUrl } = await compressImage(file, 350, 0.85);
      let finalAvatarUrl = dataUrl;

      if (isSupabaseConfigured && supabase && user?.id) {
        const fileExt = 'jpg';
        const cleanUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = `${cleanUserId}/avatar_${Date.now()}.${fileExt}`;
        const uploadFile = new File([blob], `avatar.${fileExt}`, { type: 'image/jpeg' });

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, uploadFile, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase Storage Error:', uploadError);
          throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (data?.publicUrl) {
          finalAvatarUrl = data.publicUrl;
        }
      }

      await updateCustomerProfile({
        name: user.name,
        phone: user.phone,
        nic: user.nic,
        bikeModel: user.bikeModel,
        email: user.email,
        avatarUrl: finalAvatarUrl
      });
      setSuccessMessage('Profile photo updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Remove Avatar Handler ──────────────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSupabaseConfigured && supabase && user?.avatarUrl?.includes('/avatars/')) {
        try {
          const urlParts = user.avatarUrl.split('/avatars/');
          if (urlParts[1]) {
            // Strip any URL query parameters and decode path
            const rawPath = urlParts[1].split('?')[0];
            const relativeFilePath = decodeURIComponent(rawPath);
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([relativeFilePath]);

            if (deleteError) {
              console.warn('Supabase storage file deletion error:', deleteError);
            }
          }
        } catch (e) {
          console.warn('Storage delete exception:', e);
        }
      }

      await updateCustomerProfile({
        name: user.name,
        phone: user.phone,
        nic: user.nic,
        bikeModel: user.bikeModel,
        email: user.email,
        avatarUrl: ''
      });
      setSuccessMessage('Profile photo removed successfully!');
    } catch (err) {
      console.error('Remove avatar error:', err);
      setErrorMessage(err.message || 'Failed to remove profile photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

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
        email: email.trim(),
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        default_vehicle_plate: vehiclePlate.trim().toUpperCase(),
      };
      if (!user.isAdmin) {
        profileUpdates.bikeModel = bikeModel.trim();
        profileUpdates.default_bike_model = bikeModel.trim();
      }
      if (newPassword) {
        profileUpdates.password = newPassword;
      }
      await updateCustomerProfile(profileUpdates);
      setNewPassword('');
      setSuccessMessage(t('profile.saveSuccess'));
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('different from the old password') || msg.includes('same as')) {
        setErrorMessage('You entered your current password into the New Password field. Leave it blank if you do not want to change your password.');
      } else {
        setErrorMessage(msg || t('profile.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={user.isAdmin ? '/admin' : '/dashboard'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-mutedText hover:text-mainText transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{user.isAdmin ? t('profile.backToAdmin') : t('profile.backToDashboard')}</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {!user.isAdmin && (
            <Link
              to="/booking"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brandBlue/10 hover:bg-brandBlue/20 text-brandBlue border border-brandBlue/20 text-xs font-semibold transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t('nav.bookService')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Global success/error alerts (shown outside edit form too) */}
      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-600 dark:text-green-400 text-xs sm:text-sm flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Header Profile Summary Card */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
          border: user.isAdmin
            ? '1px solid rgba(245, 158, 11, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Background Watermark Icon */}
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
          {user.isAdmin ? (
            <Shield className="w-48 h-48 text-amber-500" />
          ) : (
            <Bike className="w-48 h-48 text-blue-500" />
          )}
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative group shrink-0">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 text-white rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg overflow-hidden relative ${
                  user.isAdmin
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-600/30'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-600/30'
                }`}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user.name || 'U').charAt(0).toUpperCase()
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>

              {isEditing && (
                <label
                  htmlFor="avatar-upload-header"
                  className="absolute inset-0 bg-black/75 hover:bg-black/85 cursor-pointer rounded-2xl flex flex-col items-center justify-center text-white transition-opacity duration-200 shadow-lg border border-blue-500/40"
                  title="Upload profile photo"
                >
                  <Camera className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white mt-0.5 uppercase tracking-wider">Photo</span>
                  <input
                    id="avatar-upload-header"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.name}
                </h1>
                {user.isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('profile.workshopAdminBadge')}
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                    style={{
                      background: 'rgba(37, 99, 235, 0.12)',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                      color: '#93c5fd',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> {t('profile.customerBadge')}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1.5 flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1 text-slate-200 font-mono">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  {user.phone}
                </span>
                {user.email && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user.email}
                    </span>
                  </>
                )}
                {user.nic && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      NIC: {user.nic}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Summary Badges / Counters - fully responsive */}
          <div className="w-full lg:w-auto">
            {user.isAdmin ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div
                  className="p-3 sm:px-4 sm:py-3 rounded-2xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile.accessLevel')}</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">{t('profile.fullControl')}</p>
                </div>
                <div
                  className="p-3 sm:px-4 sm:py-3 rounded-2xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile.staffRole')}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{t('profile.workshopManager')}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div
                  className="p-3 sm:px-4 sm:py-3 rounded-2xl text-center min-w-[95px]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile.totalBookings')}</p>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">{userBookings.length}</p>
                </div>
                <div
                  className="p-3 sm:px-4 sm:py-3 rounded-2xl text-center min-w-[95px]"
                  style={{
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">{t('profile.activeTokens')}</p>
                  <p className="text-lg sm:text-xl font-black text-blue-400 mt-0.5">{activeBookings.length}</p>
                </div>
                {bikeModel && (
                  <div
                    className="col-span-2 sm:col-span-1 p-3 sm:px-4 sm:py-3 rounded-2xl text-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                    }}
                  >
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('profile.registeredBike')}</p>
                    <p className="text-xs font-bold text-white mt-1 truncate max-w-[150px] mx-auto">{bikeModel}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Details / Edit Form Card ─────────────────────────────── */}
      <div
        className="rounded-3xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        }}
      >

        {/* Card Header with Edit / Cancel toggle */}
        <div
          className="pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
        >
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isEditing ? (
                <><Edit3 className="w-5 h-5 text-blue-400" /><span>{t('profile.editTitle')}</span></>
              ) : (
                <><User className="w-5 h-5 text-blue-400" /><span>{t('profile.detailsTitle', 'Profile Details')}</span></>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? (user.isAdmin ? t('profile.editSubtitleAdmin') : t('profile.editSubtitleCustomer'))
                : t('profile.detailsSubtitle', 'Your saved information')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-body)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'var(--text-body)'; }}
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('common.cancel')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  border: '1px solid rgba(37, 99, 235, 0.5)',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.35)'; }}
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>{t('nav.editProfile')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── READ-ONLY VIEW ─────────────────────────────────────────────── */}
        {!isEditing && (
          <div className="space-y-6">
            {/* Personal Info Grid */}
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{t('profile.personalInfo')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InfoCard icon={User}       label={t('profile.fullNameLabel')}  value={user.name}  required />
                <InfoCard icon={Phone}      label={t('profile.phoneLabel')}     value={user.phone} required mono />
                <InfoCard icon={CreditCard} label={t('profile.nicLabel')}       value={user.nic}   mono />
                <InfoCard icon={Mail}       label={t('profile.emailLabel')}     value={user.email} />
              </div>
            </div>

            {/* Motorcycle Info & My Garage (customers only) */}
            {!user.isAdmin && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3.5">
                  <p className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Bike className="w-4 h-4" />
                    <span>{t('profile.myGarage', 'My Garage')}</span>
                    <span
                      className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: 'rgba(37, 99, 235, 0.15)',
                        color: '#93c5fd',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      {vehicles.length}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setBikeModalError('');
                      setShowAddBikeModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                    style={{
                      background: 'rgba(37, 99, 235, 0.12)',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                      color: '#93c5fd',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)'; }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('profile.addBike', 'Add Bike')}</span>
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div
                    className="p-6 sm:p-8 rounded-2xl text-center space-y-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                    }}
                  >
                    <Bike className="w-8 h-8 text-blue-400/50 mx-auto" />
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {t('profile.noVehiclesInGarage')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddBikeModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('profile.addBike', 'Add Bike')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl transition-all duration-200"
                        style={{
                          background: v.isDefault
                            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(13, 21, 37, 0.8))'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: v.isDefault
                            ? '1px solid rgba(37, 99, 235, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.07)',
                          boxShadow: v.isDefault ? '0 8px 24px rgba(37, 99, 235, 0.15)' : 'none',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white truncate">{v.bikeModel}</h4>
                              {v.isDefault && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                                  style={{
                                    background: 'rgba(37, 99, 235, 0.2)',
                                    color: '#93c5fd',
                                    border: '1px solid rgba(37, 99, 235, 0.3)',
                                  }}
                                >
                                  {t('profile.defaultBadge', 'Default')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono font-bold text-slate-300 tracking-wider mt-1.5">
                              {v.vehiclePlate}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!v.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(v.id)}
                                title={t('profile.setAsDefault', 'Set as Default')}
                                className="px-2 py-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition text-[11px] flex items-center gap-1 font-semibold"
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>{t('profile.setAsDefault', 'Default')}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteBike(v.id)}
                              title={t('profile.removeBike', 'Remove')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin notice */}
            {user.isAdmin && (
              <div
                className="p-4 rounded-2xl text-xs flex items-start gap-3"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300">{t('profile.adminNoticeTitle')}</p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">{t('profile.adminNoticeDesc')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT FORM ─────────────────────────────────────────────────── */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alerts inside the form */}
            {errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Profile Photo Upload Section */}
            <div
              className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div className="relative group shrink-0">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl text-white shadow-md relative"
                  style={{
                    background: '#0a1020',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user.name || 'U').charAt(0).toUpperCase()
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white mb-0.5">Profile Photo</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Upload a clear photo (JPEG, PNG, WebP). Compressed automatically to fit free limits.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <label
                    htmlFor="avatar-upload-btn"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold cursor-pointer transition shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      border: '1px solid rgba(37, 99, 235, 0.4)',
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploadingAvatar ? 'Uploading...' : 'Choose / Change Photo'}</span>
                    <input
                      id="avatar-upload-btn"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>

                  {user.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400 text-xs font-semibold transition"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

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

            {/* Section 2: Motorcycle Info */}
            {user.isAdmin ? (
              <div
                className="p-4 rounded-2xl text-xs flex items-start gap-3"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300">{t('profile.adminNoticeTitle')}</p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">{t('profile.adminNoticeDesc')}</p>
                </div>
              </div>
            ) : (
              <div
                className="pt-4"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}
              >
                <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
                  <Bike className="w-4 h-4" />
                  <span>{t('profile.motorcycleInfo')}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-subText mb-1.5">
                      {t('profile.defaultModelLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                        <Bike className="w-4 h-4" />
                      </div>
                      <select
                        value={bikeModel}
                        onChange={(e) => setBikeModel(e.target.value)}
                        className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500"
                        style={{
                          background: '#0a1020',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {YAMAHA_MODELS.map((model) => (
                          <option key={model} value={model} className="bg-slate-900 text-white">{model}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{t('profile.defaultModelHelper')}</p>
                  </div>

                  <Input
                    label={t('common.vehiclePlate', 'Default Vehicle Plate')}
                    icon={CreditCard}
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="e.g. WP BCD-1234"
                    helperText={t('profile.defaultPlateHelper', 'Pre-fills your vehicle plate during service booking')}
                  />
                </div>
              </div>
            )}

            {/* Section 3: Security / Password */}
            <div
              className="pt-4"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}
            >
              <p className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>{user.isAdmin ? t('profile.securityInfoAdmin') : t('profile.securityInfoCustomer')}</span>
              </p>
              <p className="text-xs text-slate-400 mb-3">{t('profile.passwordSubtitle')}</p>
              <div className="max-w-md">
                <Input
                  label={t('profile.newPasswordLabel')}
                  icon={Lock}
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  helperText={t('profile.passwordHelper')}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}
            >
              <p className="text-xs text-slate-400">{t('profile.savePrompt')}</p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  icon={Save}
                  className="flex-1 sm:flex-none shadow-md"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ── Add Motorcycle Modal ────────────────────────────────────────── */}
      {showAddBikeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div 
            className="fixed inset-0"
            onClick={() => setShowAddBikeModal(false)}
            aria-hidden="true"
          />
          <div
            className="rounded-2xl p-5 sm:p-7 max-w-md w-full relative z-10 max-h-[90vh] overflow-y-auto space-y-4"
            style={{
              background: 'linear-gradient(145deg, #0f182c 0%, #0a0f1d 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(37, 99, 235, 0.25)',
              color: 'var(--text-heading)',
            }}
          >
            <div className="flex items-start justify-between pb-3.5 border-b border-white/5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Bike className="w-5 h-5 text-blue-500" />
                  <span>{t('profile.addNewBikeModalTitle', 'Add Motorcycle to Garage')}</span>
                </h3>
                <p className="text-xs text-subText mt-0.5">
                  {t('profile.addNewBikeModalSubtitle', 'Enter bike model and registration plate number.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBikeModal(false)}
                aria-label="Close modal"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-mutedText hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bikeModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{bikeModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddNewBike} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-subText mb-1.5">
                  {t('booking.bikeModelLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                    <Bike className="w-4 h-4" />
                  </div>
                  <select
                    value={newBikeModel}
                    onChange={(e) => setNewBikeModel(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none transition appearance-none cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {YAMAHA_MODELS.map((model) => (
                      <option key={model} value={model} className="bg-[#0b1329] text-white">
                        {model}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mutedText">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <Input
                label={t('booking.plateLabel')}
                placeholder="e.g. WP BAP-4521"
                required
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                helperText="Sri Lankan vehicle registration number"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
              />

              <label className="min-h-[44px] flex items-center gap-2.5 text-xs text-subText cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={makeDefaultNew}
                  onChange={(e) => setMakeDefaultNew(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-surface border-border focus:ring-blue-500"
                />
                <span className="font-medium">{t('profile.setAsDefault', 'Set as Default Motorcycle')}</span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddBikeModal(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-body)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addingBike}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: '1px solid rgba(37, 99, 235, 0.5)',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  {addingBike && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t('profile.addBike', 'Add Bike')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
