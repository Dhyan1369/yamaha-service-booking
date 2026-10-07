import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Bike, Phone, CreditCard, Wrench, Calendar, XCircle, AlertCircle, CheckCircle2, Clock, Ban } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useLanguage } from '../context/LanguageContext';

export default function UserDashboard() {
  const { user, openAuthModal } = useAuth();
  const { getUserBookings, cancelBooking, refreshBookings } = useBookings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');
  const [cancelErrorMsg, setCancelErrorMsg] = useState('');
  const [newBookingAlert, setNewBookingAlert] = useState(() => {
    if (location.state?.newBookingToken) {
      return {
        token: location.state.newBookingToken,
        date: location.state.newBookingDate,
        time: location.state.newBookingTime
      };
    }
    return null;
  });

  // Re-fetch bookings on mount to ensure freshly booked tokens are loaded immediately
  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  // Clean history state so refresh doesn't keep showing the new alert banner
  useEffect(() => {
    if (location.state?.newBookingToken) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.newBookingToken]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.signInRequiredTitle')}</h2>
        <p className="text-xs text-slate-400 mb-6">
          {t('dashboard.signInRequiredDesc')}
        </p>
        <Button variant="primary" size="md" onClick={() => openAuthModal('signin')}>
          {t('nav.login')}
        </Button>
      </div>
    );
  }

  // Query bookings for logged-in user
  const customerBookings = getUserBookings(user);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'In-Service':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getTranslatedStatus = (status) => {
    switch (status) {
      case 'Completed':
        return t('dashboard.statusCompleted');
      case 'In-Service':
        return t('dashboard.statusInService');
      case 'Cancelled':
        return t('dashboard.statusCancelled');
      case 'Pending':
        return t('dashboard.statusPending');
      default:
        return status;
    }
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    setCancelErrorMsg('');
    try {
      await cancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
      setCancelSuccessMsg(t('dashboard.cancelSuccess'));
      setTimeout(() => setCancelSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Cancel booking error:', err);
      setCancelErrorMsg(err.message || t('dashboard.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Profile Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl uppercase">
            {(user.name || 'C').charAt(0)}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-0.5">{t('dashboard.badge')}</p>
            <h1 className="text-2xl font-extrabold text-white">{t('dashboard.greeting')} {user.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {user.phone}
                </span>
              )}
              {user.phone && user.nic && <span>•</span>}
              {user.nic && (
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" /> NIC: {user.nic}
                </span>
              )}
              {user.bikeModel && <span>•</span>}
              {user.bikeModel && (
                <span className="flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-slate-500" /> {user.bikeModel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={User}
            onClick={() => navigate('/profile')}
          >
            {t('dashboard.editProfileBtn')}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Wrench}
            onClick={() => navigate('/booking')}
          >
            {t('dashboard.bookServiceBtn')}
          </Button>
        </div>
      </div>

      {newBookingAlert && (
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-blue-950/80 border border-blue-500/40 text-blue-200 rounded-2xl text-xs flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/40 flex flex-col items-center justify-center text-white shrink-0">
              <span className="text-[10px] font-semibold text-blue-300 uppercase leading-none">TOKEN</span>
              <span className="text-base font-black font-mono leading-none mt-0.5">#{String(newBookingAlert.token).padStart(2, '0')}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  {t('dashboard.bookingConfirmedTitle')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold">
                  {t('dashboard.statusPending')}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                {t('dashboard.bookingConfirmedBanner')}
                {newBookingAlert.date && (
                  <span className="ml-1 text-blue-300 font-mono font-medium">
                    ({newBookingAlert.date}{newBookingAlert.time ? ` • ${newBookingAlert.time}` : ''})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewBookingAlert(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition shrink-0"
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
      )}

      {cancelSuccessMsg && (
        <div className="mb-6 p-4 bg-green-950/60 border border-green-800 text-green-300 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button
            onClick={() => setCancelSuccessMsg('')}
            className="text-green-400 hover:text-green-200 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t('dashboard.myTokensTitle')}</h2>
          <span className="text-xs text-slate-400">{customerBookings.length} {t('dashboard.recordedCount')}</span>
        </div>

        {customerBookings.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[760px]">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">{t('dashboard.colDate')}</th>
                    <th className="px-5 py-3.5">{t('dashboard.colTokenTime')}</th>
                    <th className="px-5 py-3.5">{t('dashboard.colBikeModel')}</th>
                    <th className="px-5 py-3.5">{t('dashboard.colPlate')}</th>
                    <th className="px-5 py-3.5">{t('dashboard.colType')}</th>
                    <th className="px-5 py-3.5">{t('dashboard.colStatus')}</th>
                    <th className="px-5 py-3.5 text-center">{t('dashboard.colAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900">
                  {customerBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 text-slate-200 font-mono text-xs">{booking.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">
                            #{String(booking.tokenNo).padStart(2, '0')}
                          </span>
                          <span className="text-xs text-slate-400">({booking.timeSlot})</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-200 font-medium">
                        <div>{booking.bikeModel}</div>
                        {booking.mileage && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {booking.mileage} km
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-mono text-xs">
                        {booking.vehicleNo || t('dashboard.notSpecified')}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                          {booking.serviceType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                          {getTranslatedStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {booking.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelErrorMsg('');
                              setBookingToCancel(booking);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition inline-flex items-center gap-1 font-semibold hover:scale-105"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {t('dashboard.cancelBookingBtn')}
                          </button>
                        )}
                        {booking.status === 'Cancelled' && (
                          <span className="text-[11px] text-slate-500 italic inline-flex items-center gap-1">
                            <Ban className="w-3 h-3 text-slate-600" />
                            {t('dashboard.slotReleased')}
                          </span>
                        )}
                        {booking.status === 'In-Service' && (
                          <span className="text-[11px] text-amber-400 font-semibold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('dashboard.inProgress')}
                          </span>
                        )}
                        {booking.status === 'Completed' && (
                          <span className="text-[11px] text-green-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('dashboard.serviced')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="font-bold text-white text-base">{t('dashboard.emptyTitle')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('dashboard.emptySubtitle')}</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/booking')}>
              {t('dashboard.bookServiceBtn')}
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Booking Confirmation Modal */}
      {bookingToCancel && (
        <Modal
          isOpen={Boolean(bookingToCancel)}
          onClose={() => {
            if (!cancelling) setBookingToCancel(null);
          }}
          title={t('dashboard.cancelModalTitle')}
          subtitle={`Token #${bookingToCancel.tokenNo} • ${bookingToCancel.date}`}
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('dashboard.cancelModalDesc')}
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Date:</span>
                <span className="text-white">{bookingToCancel.date}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Token:</span>
                <span className="text-blue-400 font-bold">
                  #{String(bookingToCancel.tokenNo).padStart(2, '0')} ({bookingToCancel.timeSlot})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vehicle:</span>
                <span className="text-slate-200">{bookingToCancel.vehicleNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service Type:</span>
                <span className="text-slate-200">{bookingToCancel.serviceType}</span>
              </div>
            </div>

            {cancelErrorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cancelErrorMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                onClick={() => setBookingToCancel(null)}
              >
                {t('dashboard.keepBooking')}
              </Button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition disabled:opacity-50"
              >
                {cancelling ? t('dashboard.cancelling') : t('dashboard.confirmCancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

