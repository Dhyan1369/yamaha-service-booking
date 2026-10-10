import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Bike, Phone, CreditCard, Wrench, Calendar, XCircle, AlertCircle, CheckCircle2, Clock, Ban, Printer } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import TokenReceipt from '../components/booking/TokenReceipt';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useLanguage } from '../context/LanguageContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const { getUserBookings, cancelBooking, refreshBookings } = useBookings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [viewReceiptBooking, setViewReceiptBooking] = useState(null);
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
        <div className="w-16 h-16 bg-brandBlue/10 border border-brandBlue/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brandBlue">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-mainText mb-2">{t('dashboard.signInRequiredTitle')}</h2>
        <p className="text-xs text-mutedText mb-6">
          {t('dashboard.signInRequiredDesc')}
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/login', { state: { redirectTo: '/dashboard' } })}>
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
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
      case 'In-Service':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
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
    <div
      className="min-h-screen py-8 sm:py-12"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37, 99, 235, 0.08) 0%, transparent 60%),' +
          'var(--bg-page)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Top Profile Summary Card */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(17, 29, 48, 0.95) 0%, rgba(11, 18, 32, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(37, 99, 235, 0.08)',
          }}
        >
          {/* Top accent stripe */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8, transparent)' }}
          />

          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4 sm:space-x-5">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl uppercase text-white shrink-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || 'C').charAt(0)
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-0.5 flex items-center gap-1.5">
                  <span>{t('dashboard.badge')}</span>
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {t('dashboard.greeting')} {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-subText mt-1.5">
                  {user.phone && (
                    <span className="flex items-center gap-1.5 font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-blue-400" /> {user.phone}
                    </span>
                  )}
                  {user.bikeModel && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Bike className="w-3.5 h-3.5 text-blue-400" /> {user.bikeModel}
                      </span>
                    </>
                  )}
                  {user.vehiclePlate && (
                    <>
                      <span className="text-white/20">•</span>
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded-md text-blue-300"
                        style={{
                          background: 'rgba(37, 99, 235, 0.12)',
                          border: '1px solid rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        {user.vehiclePlate}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics & Actions */}
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
        </div>

        {newBookingAlert && (
          <div
            className="p-4 sm:p-5 rounded-2xl text-xs flex items-center justify-between gap-4 animate-fadeIn"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.08))',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-xl text-white flex flex-col items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
              >
                <span className="text-[9px] font-bold uppercase leading-none opacity-80">TOKEN</span>
                <span className="text-base font-black font-mono leading-none mt-0.5">#{String(newBookingAlert.token).padStart(2, '0')}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {t('dashboard.bookingConfirmedTitle')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                    {t('dashboard.statusPending')}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-body)' }}>
                  {t('dashboard.bookingConfirmedBanner')}
                  {newBookingAlert.date && (
                    <span className="ml-1 text-blue-400 font-mono font-medium">
                      ({newBookingAlert.date}{newBookingAlert.time ? ` • ${newBookingAlert.time}` : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewBookingAlert(null)}
              className="text-mutedText hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition shrink-0"
              title={t('common.close')}
            >
              ✕
            </button>
          </div>
        )}

        {cancelSuccessMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{cancelSuccessMsg}</span>
            </div>
            <button
              onClick={() => setCancelSuccessMsg('')}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Bookings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{t('dashboard.myTokensTitle')}</span>
            </h2>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                color: 'var(--text-muted)',
              }}
            >
              {customerBookings.length} {t('dashboard.recordedCount')}
            </span>
          </div>

          {customerBookings.length > 0 ? (
            <>
              {/* Desktop Table View (>= 768px) */}
              <div
                className="hidden md:block rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[760px]">
                    <thead
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                      className="text-[11px] uppercase tracking-wider font-bold"
                    >
                      <tr>
                        <th className="px-5 py-3.5 text-slate-400">{t('dashboard.colDate')}</th>
                        <th className="px-5 py-3.5 text-slate-400">{t('dashboard.colTokenTime')}</th>
                        <th className="px-5 py-3.5 text-slate-400">{t('dashboard.colBikeModel')}</th>
                        <th className="px-5 py-3.5 text-slate-400">{t('dashboard.colPlate')}</th>
                        <th className="px-5 py-3.5 text-slate-400">{t('dashboard.colType')}</th>
                        <th className="px-5 py-3.5 text-slate-400">{t('dashboard.colStatus')}</th>
                        <th className="px-5 py-3.5 text-center text-slate-400">{t('dashboard.colAction')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {customerBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="hover:bg-blue-500/[0.04] transition-colors duration-150"
                        >
                          <td className="px-5 py-4 text-white font-mono text-xs font-semibold">{booking.date}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-blue-400">
                                #{String(booking.tokenNo).padStart(2, '0')}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                ({booking.timeSlot})
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white font-semibold">
                            <div>{booking.bikeModel}</div>
                            {booking.mileage && (
                              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                {booking.mileage} km
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs">
                            <span
                              className="px-2 py-0.5 rounded-md"
                              style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-heading)',
                              }}
                            >
                              {booking.vehicleNo || t('dashboard.notSpecified')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <span
                              className="px-2.5 py-1 rounded-md font-medium"
                              style={{
                                background: 'rgba(37, 99, 235, 0.08)',
                                border: '1px solid rgba(37, 99, 235, 0.2)',
                                color: '#93c5fd',
                              }}
                            >
                              {booking.serviceType}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center justify-center w-24 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                              {getTranslatedStatus(booking.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* View Token Action */}
                              <button
                                type="button"
                                onClick={() => setViewReceiptBooking(booking)}
                                className="h-8 px-3 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-1.5 text-xs font-bold"
                                style={{
                                  background: 'rgba(37, 99, 235, 0.12)',
                                  border: '1px solid rgba(37, 99, 235, 0.3)',
                                  color: '#93c5fd',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.22)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                title={t('dashboard.viewTokenBtn') || 'View Token'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{t('dashboard.viewTokenBtn') || 'View Token'}</span>
                              </button>

                              {booking.status === 'Pending' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelErrorMsg('');
                                    setBookingToCancel(booking);
                                  }}
                                  className="h-8 w-[120px] rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-1.5 text-xs font-bold"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: '#f87171',
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>{t('dashboard.cancelBookingBtn')}</span>
                                </button>
                              ) : booking.status === 'Cancelled' ? (
                                <span
                                  className="h-8 w-[120px] rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-medium select-none"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.07)',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  <Ban className="w-3.5 h-3.5 text-red-400/70" />
                                  <span>{t('dashboard.slotReleased')}</span>
                                </span>
                              ) : booking.status === 'In-Service' ? (
                                <span
                                  className="h-8 w-[120px] rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-medium select-none"
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    color: '#fbbf24',
                                  }}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{t('dashboard.inProgress')}</span>
                                </span>
                              ) : booking.status === 'Completed' ? (
                                <span
                                  className="h-8 w-[120px] rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-medium select-none"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    color: '#34d399',
                                  }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{t('dashboard.serviced')}</span>
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card List View (< 768px) */}
              <div className="block md:hidden space-y-3.5">
                {customerBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl p-4 transition space-y-3"
                    style={{
                      background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {/* Top Row: Service Date & Token Badge */}
                    <div
                      className="flex items-center justify-between pb-2.5"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
                    >
                      <div className="flex items-center gap-1.5 text-white font-semibold text-xs font-mono">
                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{booking.date}</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                        style={{
                          background: 'rgba(37, 99, 235, 0.12)',
                          border: '1px solid rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        <span className="font-mono font-black text-sm text-blue-400">
                          #{String(booking.tokenNo).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-semibold text-blue-300">
                          ({booking.timeSlot})
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Bike Model, Vehicle Number Plate, and Service Type tag */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="font-bold text-sm text-white">{booking.bikeModel}</span>
                        </div>
                        {booking.mileage && (
                          <span
                            className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.07)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {booking.mileage} km
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono" style={{ color: 'var(--text-body)' }}>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Plate:</span>
                          <span className="font-semibold text-white">{booking.vehicleNo || t('dashboard.notSpecified')}</span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                          style={{
                            background: 'rgba(37, 99, 235, 0.08)',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            color: '#93c5fd',
                          }}
                        >
                          {booking.serviceType}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Status Badge + Action Buttons */}
                    <div
                      className="pt-2.5 flex flex-wrap items-center justify-between gap-2"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}
                    >
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                        {getTranslatedStatus(booking.status)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewReceiptBooking(booking)}
                          className="h-8 px-3 rounded-xl transition inline-flex items-center gap-1.5 text-xs font-bold"
                          style={{
                            background: 'rgba(37, 99, 235, 0.12)',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            color: '#93c5fd',
                          }}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t('dashboard.viewTokenBtn') || 'View Token'}</span>
                        </button>

                        {booking.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelErrorMsg('');
                              setBookingToCancel(booking);
                            }}
                            className="h-8 px-3 rounded-xl transition inline-flex items-center gap-1 text-xs font-bold"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t('dashboard.cancelBookingBtn')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              className="rounded-2xl p-12 text-center space-y-4"
              style={{
                background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Calendar className="w-10 h-10 mx-auto text-blue-400/50" />
              <div>
                <p className="font-bold text-white text-base">{t('dashboard.emptyTitle')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('dashboard.emptySubtitle')}</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/booking')}>
                {t('dashboard.bookServiceBtn')}
              </Button>
            </div>
          )}
        </div>
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
            <p className="text-xs sm:text-sm text-subText leading-relaxed">
              {t('dashboard.cancelModalDesc')}
            </p>

            <div className="bg-surfaceMuted p-3.5 rounded-xl border border-border text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-subText">
                <span>Date:</span>
                <span className="text-mainText font-semibold">{bookingToCancel.date}</span>
              </div>
              <div className="flex justify-between text-subText">
                <span>Token:</span>
                <span className="text-brandBlue font-bold">
                  #{String(bookingToCancel.tokenNo).padStart(2, '0')} ({bookingToCancel.timeSlot})
                </span>
              </div>
              <div className="flex justify-between text-subText">
                <span>Vehicle:</span>
                <span className="text-mainText">{bookingToCancel.vehicleNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-subText">
                <span>Service Type:</span>
                <span className="text-mainText">{bookingToCancel.serviceType}</span>
              </div>
            </div>

            {cancelErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brandRed hover:opacity-90 text-white shadow-lg shadow-brandRed/30 transition disabled:opacity-50"
              >
                {cancelling ? t('dashboard.cancelling') : t('dashboard.confirmCancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Token Receipt View Modal */}
      <TokenReceipt
        isOpen={Boolean(viewReceiptBooking)}
        booking={viewReceiptBooking}
        onClose={() => setViewReceiptBooking(null)}
      />
    </div>
  );
}

