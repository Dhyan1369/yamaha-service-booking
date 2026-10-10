import { useEffect, useState, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, Calendar, PlusCircle, Wrench, User, Users, Phone, Bike, CreditCard, CheckCircle2, Clock, AlertTriangle, Gauge, Image as ImageIcon, MessageSquare, ExternalLink } from 'lucide-react';
import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import GalleryManager from '../components/admin/GalleryManager';
import InquiryManager from '../components/admin/InquiryManager';
import CustomerDirectory from '../components/admin/CustomerDirectory';
import { HOLIDAY_DATES, POYA_DATES, bookingService } from '../services/bookingService';
import { inquiryService } from '../services/inquiryService';
import { validateBookingData } from '../lib/validation';
import { YAMAHA_MODELS } from '../components/booking/BikeDetails';

export default function Admin() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    bookings,
    updateStatus,
    getSlotStats,
    addBooking,
    refreshAvailability,
    refreshBookings,
    loading: bookingsLoading,
    error: bookingsError
  } = useBookings();

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [dateViewMode, setDateViewMode] = useState('selected'); // 'selected' | 'all'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inquiries' || tabParam === 'messages') return 'inquiries';
    if (tabParam === 'gallery') return 'gallery';
    if (tabParam === 'customers') return 'customers';
    return 'bookings';
  });
  const [newInquiryCount, setNewInquiryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState('');
  const [statusUpdateError, setStatusUpdateError] = useState('');

  // Handle query parameter tab switching and walk-in action (/admin?tab=inquiries, /admin?tab=customers, /admin?action=walkin)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inquiries' || tabParam === 'messages') {
      setActiveTab('inquiries');
    } else if (tabParam === 'gallery') {
      setActiveTab('gallery');
    } else if (tabParam === 'customers') {
      setActiveTab('customers');
    }

    if (location.state?.openWalkIn || searchParams.get('action') === 'walkin') {
      setShowWalkInModal(true);
      setActiveTab('bookings');
      if (location.state?.openWalkIn) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, searchParams]);

  // Fetch initial new inquiries count for tab badge
  useEffect(() => {
    inquiryService.getInquiries().then((data) => {
      const count = data.filter((i) => i.status === 'new').length;
      setNewInquiryCount(count);
    }).catch(() => {});
  }, []);

  const initialWalkInState = {
    customerName: '',
    phone: '',
    bikeModel: 'Yamaha FZ-S V3',
    mileage: '',
    vehicleNo: '',
    serviceType: 'Full Service',
    customerNotes: '',
    userId: null
  };

  const [walkInForm, setWalkInForm] = useState(initialWalkInState);
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupTimeoutRef = useRef(null);

  const stats = getSlotStats(selectedDate);
  const dayBookings = dateViewMode === 'all' ? bookings : stats.dayBookings;
  const otherDateBookingsCount = bookings.filter((b) => b.date !== selectedDate).length;
  const otherDateSample = bookings.find((b) => b.date !== selectedDate)?.date;

  // Re-fetch bookings AND availability every time the selected date changes
  useEffect(() => {
    refreshBookings();
    refreshAvailability(selectedDate);
  }, [selectedDate, refreshAvailability, refreshBookings]);

  // Clean up any pending phone lookup timeouts on unmount
  useEffect(() => {
    return () => {
      if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    };
  }, []);

  const filteredBookings = dayBookings.filter((b) => {
    const matchesSearch =
      b.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bikeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicleNo && b.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const handleStatusChange = async (item, newStatus) => {
    const isFuture = item.date > todayKey;
    if (isFuture && (newStatus === 'In-Service' || newStatus === 'Completed')) {
      setStatusUpdateError(`Cannot set status to ${newStatus} before the scheduled service date (${item.date}). The bike has not arrived yet.`);
      return;
    }

    if (newStatus === 'Cancelled') {
      const confirmed = window.confirm(
        `Are you sure you want to CANCEL Token #${item.tokenNo} for ${item.name} (${item.date})? This will immediately free up the slot for others.`
      );
      if (!confirmed) return;
    }

    try {
      setStatusUpdateError('');
      await updateStatus(item.id, newStatus, item.date);
    } catch (err) {
      console.error('Failed to change status:', err);
      setStatusUpdateError(err.message || 'Failed to update booking status.');
    }
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    setWalkInForm((prev) => ({ ...prev, phone: rawVal }));

    let cleanPhone = rawVal.trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
      setLookupLoading(true);

      lookupTimeoutRef.current = setTimeout(async () => {
        try {
          const found = await bookingService.findCustomerByPhone(cleanPhone);
          if (found) {
            setMatchedCustomer(found);
            setWalkInForm((prev) => ({
              ...prev,
              customerName: prev.customerName || found.customerName || '',
              bikeModel: found.bikeModel || prev.bikeModel || 'Yamaha FZ-S V3',
              vehicleNo: prev.vehicleNo || found.vehicleNo || '',
              userId: found.userId || null
            }));
          } else {
            setMatchedCustomer(null);
            setWalkInForm((prev) => ({ ...prev, userId: null }));
          }
        } catch (err) {
          console.warn('Customer lookup error:', err);
        } finally {
          setLookupLoading(false);
        }
      }, 350);
    } else {
      setMatchedCustomer(null);
      setWalkInForm((prev) => ({ ...prev, userId: null }));
    }
  };

  const openWalkInModal = () => {
    setWalkInForm(initialWalkInState);
    setMatchedCustomer(null);
    setWalkInError('');
    setShowWalkInModal(true);
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInError('');
    setWalkInSubmitting(true);

    // Guard: only authenticated admins may use this path.
    const isUserAdmin = Boolean(user?.isAdmin || user?.role === 'admin');
    if (!isUserAdmin) {
      setWalkInError('Access denied: admin session required.');
      setWalkInSubmitting(false);
      return;
    }

    if (stats.isDayFull) {
      setWalkInError(`Cannot book: Maximum 12 daily slots reached for ${selectedDate}.`);
      setWalkInSubmitting(false);
      return;
    }

    const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
    if (
      selectedDateObject.getDay() === 1 ||
      POYA_DATES.has(selectedDate) ||
      HOLIDAY_DATES.has(selectedDate)
    ) {
      setWalkInError('Walk-in bookings are only allowed on open (non-holiday) dates.');
      setWalkInSubmitting(false);
      return;
    }

    let cleanPhone = walkInForm.phone.trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    const validation = validateBookingData({
      name: walkInForm.customerName,
      phone: cleanPhone,
      bikeModel: walkInForm.bikeModel,
      vehicleNo: walkInForm.vehicleNo,
      serviceType: walkInForm.serviceType
    });

    if (!validation.valid) {
      setWalkInError(Object.values(validation.errors)[0]);
      setWalkInSubmitting(false);
      return;
    }

    if (walkInForm.serviceType === 'Free Service' && stats.isFreeServiceFull) {
      setWalkInError('The free-service quota for this date has been reached (Maximum 5 slots).');
      setWalkInSubmitting(false);
      return;
    }

    if ((walkInForm.serviceType === 'Full Service' || walkInForm.serviceType === 'Normal Service') && stats.isStandardServiceFull) {
      setWalkInError('The quota for Full & Normal services for this date has been reached (Maximum 7 slots).');
      setWalkInSubmitting(false);
      return;
    }

    try {
      const newBooking = {
        name: walkInForm.customerName.trim(),
        phone: cleanPhone,
        nic: 'Walk-in',
        bikeModel: walkInForm.bikeModel.trim(),
        mileage: walkInForm.mileage ? String(walkInForm.mileage).trim() : '',
        vehicleNo: walkInForm.vehicleNo.trim().toUpperCase(),
        serviceType: walkInForm.serviceType,
        date: selectedDate,
        isWalkIn: true,
        // Crucial decoupling: Pass customer's profile ID if matched/registered,
        // or NULL for unregistered guest walk-in. The admin's ID is only passed to createdBy!
        userId: walkInForm.userId || null,
        createdBy: user?.id || null,
        customerNotes: walkInForm.customerNotes ? String(walkInForm.customerNotes).trim() : ''
      };

      await addBooking(newBooking);
      setShowWalkInModal(false);
      setWalkInForm(initialWalkInState);
      setMatchedCustomer(null);
    } catch (err) {
      setWalkInError(err.message || 'Failed to create walk-in booking');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const completedCount = dayBookings.filter((b) => b.status === 'Completed').length;
  const inServiceCount = dayBookings.filter((b) => b.status === 'In-Service').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-mainText flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-brandBlue" /> Admin Workshop Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30">
              STAFF PORTAL
            </span>
          </div>
          <p className="text-sm text-mutedText mt-1">
            Real-time queue monitoring, walk-in token generation, and service progress tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surfaceMuted border border-border px-3.5 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-mutedText" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-mainText text-sm outline-none font-mono"
            />
          </div>

          <Button
            variant="primary"
            onClick={openWalkInModal}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> + {t('admin.issueWalkInBtn', 'Walk-In Booking')}
          </Button>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'bookings'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-surface hover:bg-muted text-subText border border-border'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Bookings & Queue Control</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-muted text-mutedText'
          }`}>
            {dayBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'gallery'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-surface hover:bg-muted text-subText border border-border'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Workshop Photos (Gallery)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'inquiries'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-surface hover:bg-muted text-subText border border-border'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('admin.inquiriesTab', 'Customer Messages')}</span>
          {newInquiryCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {newInquiryCount} {t('admin.newInquiriesBadge', 'New')}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'customers'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-surface hover:bg-muted text-subText border border-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('admin.customersTab', 'Customer Directory')}</span>
        </button>
      </div>

      {activeTab === 'customers' ? (
        <CustomerDirectory />
      ) : activeTab === 'inquiries' ? (
        <InquiryManager onNewCountChange={setNewInquiryCount} />
      ) : activeTab === 'gallery' ? (
        <GalleryManager />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-subText">
            <span className="text-xs font-semibold uppercase tracking-wider">Date Tokens</span>
            <Clock className="w-4 h-4 text-brandBlue" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-mainText">
              {stats.totalBooked} <span className="text-sm font-normal text-mutedText">/ {stats.maxDailySlots}</span>
            </p>
            <span className="text-xs font-bold text-brandBlue">
              {Math.round((stats.totalBooked / stats.maxDailySlots) * 100)}% Cap
            </span>
          </div>
          <div className="w-full bg-surfaceMuted h-1.5 rounded-full mt-3 overflow-hidden border border-border/40">
            <div
              className={`h-full ${stats.isDayFull ? 'bg-red-500' : 'bg-brandBlue'}`}
              style={{ width: `${Math.min(100, (stats.totalBooked / stats.maxDailySlots) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-subText">
            <span className="text-xs font-semibold uppercase tracking-wider">Free Service Quota</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-mainText">
              {stats.freeServices} <span className="text-sm font-normal text-mutedText">/ {stats.maxFreeServices}</span>
            </p>
            <span className={`text-xs font-bold ${stats.isFreeServiceFull ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              {stats.isFreeServiceFull ? 'Quota Full' : `${stats.availableFreeSlots} Left`}
            </span>
          </div>
          <div className="w-full bg-surfaceMuted h-1.5 rounded-full mt-3 overflow-hidden border border-border/40">
            <div
              className={`h-full ${stats.isFreeServiceFull ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, (stats.freeServices / stats.maxFreeServices) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-subText">
            <span className="text-xs font-semibold uppercase tracking-wider">Full & Normal Quota</span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-mainText">
              {stats.standardServices || 0} <span className="text-sm font-normal text-mutedText">/ {stats.maxStandardServices || 7}</span>
            </p>
            <span className={`text-xs font-bold ${stats.isStandardServiceFull ? 'text-red-500' : 'text-purple-600 dark:text-purple-400'}`}>
              {stats.isStandardServiceFull ? 'Quota Full' : `${stats.availableStandardSlots} Left`}
            </span>
          </div>
          <div className="w-full bg-surfaceMuted h-1.5 rounded-full mt-3 overflow-hidden border border-border/40">
            <div
              className={`h-full ${stats.isStandardServiceFull ? 'bg-red-500' : 'bg-purple-500'}`}
              style={{ width: `${Math.min(100, ((stats.standardServices || 0) / (stats.maxStandardServices || 7)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-subText">
            <span className="text-xs font-semibold uppercase tracking-wider">Progress</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-green-600 dark:text-green-400">
              {completedCount} <span className="text-sm font-normal text-amber-600 dark:text-amber-400">({inServiceCount} Active)</span>
            </p>
            <span className="text-xs font-bold text-mutedText">
              {stats.totalBooked > 0 ? Math.round((completedCount / stats.totalBooked) * 100) : 0}% Done
            </span>
          </div>
          <p className="text-[11px] text-mutedText mt-3 truncate">
            {stats.totalBooked - completedCount} bikes pending for {selectedDate}
          </p>
        </div>
      </div>

      {/* Notice Banner if bookings exist on other dates */}
      {dateViewMode === 'selected' && stats.dayBookings.length === 0 && otherDateBookingsCount > 0 && (
        <div className="bg-brandBlue/10 border border-brandBlue/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-mainText shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brandBlue shrink-0" />
            <div>
              <p className="font-semibold text-mainText">
                No tokens for selected date ({selectedDate}), but {otherDateBookingsCount} booking(s) exist on other dates!
              </p>
              <p className="text-[11px] text-subText">
                (Customers book at least 1 day in advance, e.g. booking for {otherDateSample}).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {otherDateSample && (
              <button
                type="button"
                onClick={() => setSelectedDate(otherDateSample)}
                className="bg-brandBlue hover:opacity-90 text-white font-bold px-3 py-1.5 rounded-lg transition"
              >
                Go to {otherDateSample}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDateViewMode('all')}
              className="bg-surfaceMuted hover:bg-border text-mainText border border-border font-bold px-3 py-1.5 rounded-lg transition"
            >
              View All Dates ({bookings.length})
            </button>
          </div>
        </div>
      )}

      {/* Bookings Queue Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-mainText text-base">
              {dateViewMode === 'all' ? 'All Booked Services' : `Service Tokens (${selectedDate})`}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-brandBlue/10 text-brandBlue text-xs font-mono font-semibold">
              {filteredBookings.length} Tokens
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-surfaceMuted p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setDateViewMode('selected')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  dateViewMode === 'selected'
                    ? 'bg-brandBlue text-white'
                    : 'text-subText hover:text-mainText'
                }`}
              >
                Day View
              </button>
              <button
                type="button"
                onClick={() => setDateViewMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  dateViewMode === 'all'
                    ? 'bg-brandBlue text-white'
                    : 'text-subText hover:text-mainText'
                }`}
              >
                All Dates ({bookings.length})
              </button>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-4 h-4 text-mutedText absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surfaceMuted border border-border text-xs rounded-xl pl-9 pr-3 py-2 text-mainText placeholder-mutedText outline-none focus:border-brandBlue"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surfaceMuted border border-border text-xs rounded-xl px-2.5 py-2 text-mainText outline-none focus:border-brandBlue"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In-Service">In-Service</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              onClick={refreshBookings}
              title="Refresh bookings"
              className="p-2 text-subText hover:text-brandBlue hover:bg-surfaceMuted rounded-xl transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4" />
              </svg>
            </button>
          </div>
        </div>

        {statusUpdateError && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{statusUpdateError}</span>
            </div>
            <button
              onClick={() => setStatusUpdateError('')}
              className="text-red-600 dark:text-red-400 hover:opacity-80 text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-mainText min-w-[720px]">
            <thead className="bg-surfaceMuted text-subText text-xs uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Token #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Time Slot</th>
                <th className="px-6 py-3.5">Customer &amp; Phone</th>
                <th className="px-6 py-3.5">Bike Model</th>
                <th className="px-6 py-3.5">Plate No</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5 whitespace-nowrap w-36">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {bookingsLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-14">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-brandBlue border-t-transparent rounded-full animate-spin" />
                      <p className="text-mutedText text-sm">Loading bookings for {selectedDate}...</p>
                    </div>
                  </td>
                </tr>
              ) : bookingsError ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <p className="text-red-500 text-sm font-semibold">Failed to load bookings</p>
                      <p className="text-mutedText text-xs max-w-xs text-center">{bookingsError}</p>
                      <button
                        onClick={refreshBookings}
                        className="mt-1 text-xs text-brandBlue hover:underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredBookings.map((item) => (
                    <tr key={item.id} className="hover:bg-surfaceMuted/60 transition">
                      <td className="px-6 py-4 font-mono font-bold text-brandBlue text-base">
                        #{String(item.tokenNo).padStart(2, '00')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-mainText text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-mutedText" />
                          <span>{item.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-mainText text-xs">{item.timeSlot}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-mainText leading-tight">{item.name}</p>
                          {item.isWalkIn || item.nic?.toLowerCase() === 'walk-in' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              {t('admin.walkInBadge', 'Walk-In')}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              {t('admin.onlineBadge', 'Online')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${item.phone}`}
                            className="text-xs text-brandBlue dark:text-blue-400 font-mono hover:underline inline-flex items-center gap-1 font-semibold"
                            title={t('admin.callCustomer', 'Call customer')}
                          >
                            <Phone className="w-3 h-3 text-brandBlue shrink-0" />
                            <span>{item.phone}</span>
                          </a>
                        </div>
                        {item.customerNotes && (
                          <div className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-xs break-words">
                            <span className="font-bold">Note:</span> {item.customerNotes}
                          </div>
                        )}
                        {item.profile?.nic && item.profile.nic !== 'N/A' && (
                          <span className="text-[10px] text-mutedText font-mono block mt-0.5">NIC: {item.profile.nic}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-mainText">
                        <div>{item.bikeModel}</div>
                        {item.mileage && (
                          <span className="text-[11px] text-mutedText font-mono">{item.mileage} km</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-subText font-mono text-xs">
                        {item.vehicleNo || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.serviceType === 'Free Service'
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                              : 'bg-surfaceMuted border border-border text-subText'
                          }`}
                        >
                          {item.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-36">
                        {(() => {
                          const isFuture = item.date > todayKey;
                          return (
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item, e.target.value)}
                              title={isFuture ? 'Service date has not arrived yet' : ''}
                              className={`w-28 text-xs rounded-lg px-2.5 py-1 outline-none border font-semibold cursor-pointer transition ${
                                item.status === 'Completed'
                                  ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
                                  : item.status === 'In-Service'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                  : item.status === 'Cancelled'
                                  ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                                  : 'bg-surfaceMuted border-border text-subText'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In-Service" disabled={isFuture}>
                                In-Service
                              </option>
                              <option value="Completed" disabled={isFuture}>
                                Completed
                              </option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-mutedText text-sm">
                        No service tokens found for {selectedDate}.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Walk-in Booking Modal */}
      <Modal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        title={t('admin.issueWalkInTitle', 'Issue Walk-In / Phone Token')}
        subtitle={`${t('admin.issueWalkInSubtitle', 'Generate an on-demand service token for')} ${selectedDate}`}
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
          {walkInError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{walkInError}</span>
            </div>
          )}

          {/* Customer Phone & Smart Lookup */}
          <div>
            <Input
              label={t('admin.customerPhone', 'Customer Phone')}
              icon={Phone}
              type="tel"
              required
              placeholder="e.g. 0771234567"
              value={walkInForm.phone}
              onChange={handlePhoneChange}
              helperText={t('admin.phoneLookupHelper', 'Enter 10-digit number (e.g. 0771234567) to autofill registered customer')}
            />

            {/* Smart Lookup Status Badges */}
            {lookupLoading && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-mutedText animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-brandBlue border-t-transparent rounded-full animate-spin" />
                <span>Checking customer records...</span>
              </div>
            )}

            {!lookupLoading && matchedCustomer?.source === 'registered_profile' && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('admin.registeredCustomerFound', 'Registered Customer Found:')} {matchedCustomer.customerName}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Online Sync
                  </span>
                </div>

                {matchedCustomer.vehicles?.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-emerald-500/20 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Garage Bikes:</span>
                    {matchedCustomer.vehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setWalkInForm((prev) => ({
                          ...prev,
                          bikeModel: v.bikeModel,
                          vehicleNo: v.vehiclePlate
                        }))}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white dark:bg-slate-900 border border-emerald-400/40 text-emerald-900 dark:text-emerald-100 hover:border-emerald-600 transition flex items-center gap-1 shadow-2xs"
                      >
                        <Bike className="w-3 h-3 text-emerald-600" />
                        <span>{v.vehiclePlate} ({v.bikeModel})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!lookupLoading && (matchedCustomer?.source === 'past_walk_in' || matchedCustomer?.source === 'past_booking') && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong className="font-bold">{t('admin.returningCustomerFound', 'Returning Customer Found:')}</strong>{' '}
                  {matchedCustomer.customerName}
                </span>
              </div>
            )}

            {!lookupLoading && !matchedCustomer && walkInForm.phone.replace(/[\s-]/g, '').length === 10 && (
              <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('admin.guestWalkIn', 'Unregistered Guest Customer — Will book without account')}</span>
              </div>
            )}
          </div>

          {/* Customer Name */}
          <Input
            label={t('admin.customerName', 'Customer Name')}
            icon={User}
            required
            placeholder="e.g. Kasun Kalhara"
            value={walkInForm.customerName}
            onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })}
          />

          {/* Bike Model selection */}
          <div>
            <label className="block text-xs font-semibold text-subText mb-1.5">
              {t('admin.bikeModel', 'Bike Model')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Bike className="w-4 h-4 text-mutedText absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={walkInForm.bikeModel}
                onChange={(e) => setWalkInForm({ ...walkInForm, bikeModel: e.target.value })}
                className="w-full bg-surfaceMuted border border-border text-mainText text-sm rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-brandBlue transition"
              >
                {YAMAHA_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Plate Number */}
          <Input
            label={t('admin.plateNumber', 'Vehicle Plate Number')}
            icon={CreditCard}
            required
            placeholder={t('admin.platePlaceholder', 'e.g. BAP-4521')}
            value={walkInForm.vehicleNo}
            onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNo: e.target.value.toUpperCase() })}
            autoCapitalize="characters"
          />

          {/* Mileage (Optional) */}
          <Input
            label={t('admin.mileage', 'Mileage (km)')}
            icon={Gauge}
            type="number"
            placeholder="e.g. 15000"
            value={walkInForm.mileage}
            onChange={(e) => setWalkInForm({ ...walkInForm, mileage: e.target.value })}
            helperText={t('admin.mileageHelper', 'Enter odometer reading in kilometers')}
          />

          {/* Service Type with Quota indicators */}
          <div>
            <label className="block text-xs font-semibold text-subText mb-1.5">
              {t('admin.serviceType', 'Service Type')}
            </label>
            <select
              value={walkInForm.serviceType}
              onChange={(e) => setWalkInForm({ ...walkInForm, serviceType: e.target.value })}
              className="w-full bg-surfaceMuted border border-border text-mainText text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-brandBlue transition"
            >
              <option value="Full Service" disabled={stats.isStandardServiceFull}>
                Full Service {stats.isStandardServiceFull ? '(Quota Full - 7/7)' : `(${stats.availableStandardSlots} / ${stats.maxStandardServices || 7} left)`}
              </option>
              <option value="Free Service" disabled={stats.isFreeServiceFull}>
                Free Service {stats.isFreeServiceFull ? '(Quota Full - 5/5)' : `(${stats.availableFreeSlots} / ${stats.maxFreeServices || 5} left)`}
              </option>
              <option value="Normal Service" disabled={stats.isStandardServiceFull}>
                Normal Service {stats.isStandardServiceFull ? '(Quota Full - 7/7)' : `(${stats.availableStandardSlots} / ${stats.maxStandardServices || 7} left)`}
              </option>
            </select>
          </div>

          {/* Customer Complaints / Notes */}
          <div>
            <label className="block text-xs font-semibold text-subText mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-mutedText" />
              <span>{t('admin.customerNotes', 'Customer Complaints / Notes')}</span>
              <span className="text-mutedText font-normal">({t('common.optional', 'Optional')})</span>
            </label>
            <textarea
              rows={2}
              placeholder={t('admin.customerNotesPlaceholder', 'e.g. Engine sound at 60km/h, front brake loose, oil change')}
              value={walkInForm.customerNotes}
              onChange={(e) => setWalkInForm({ ...walkInForm, customerNotes: e.target.value })}
              className="w-full bg-surfaceMuted border border-border text-mainText text-sm rounded-xl px-3.5 py-2 outline-none focus:border-brandBlue transition resize-none placeholder-mutedText"
            />
          </div>

          {/* Submit / Cancel Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowWalkInModal(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={walkInSubmitting || stats.isDayFull} className="flex-1">
              {walkInSubmitting ? t('admin.generatingBtn', 'Generating...') : t('admin.generateTokenBtn', 'Issue Token')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
