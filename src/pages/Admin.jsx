import { useEffect, useState } from 'react';
import { ShieldCheck, Search, Calendar, PlusCircle, Wrench, User, Phone, Bike, CreditCard, CheckCircle2, Clock, AlertTriangle, Gauge } from 'lucide-react';
import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { HOLIDAY_DATES, POYA_DATES } from '../services/bookingService';
import { validateBookingData } from '../lib/validation';

export default function Admin() {
  const { user } = useAuth();
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

  const [dateViewMode, setDateViewMode] = useState('selected'); // 'selected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState('');

  const [walkInForm, setWalkInForm] = useState({
    name: '',
    phone: '',
    nic: 'Walk-in',
    bikeModel: 'Yamaha FZ-S V3',
    mileage: '',
    vehicleNo: '',
    serviceType: 'Full Service'
  });

  const stats = getSlotStats(selectedDate);
  const dayBookings = dateViewMode === 'all' ? bookings : stats.dayBookings;
  const otherDateBookingsCount = bookings.filter((b) => b.date !== selectedDate).length;
  const otherDateSample = bookings.find((b) => b.date !== selectedDate)?.date;

  // Re-fetch bookings AND availability every time the selected date changes
  useEffect(() => {
    refreshBookings();
    refreshAvailability(selectedDate);
  }, [selectedDate, refreshAvailability, refreshBookings]);

  const filteredBookings = dayBookings.filter((b) => {
    const matchesSearch =
      b.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bikeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicleNo && b.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id, newStatus) => {
    await updateStatus(id, newStatus);
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInError('');
    setWalkInSubmitting(true);

    // Guard: only authenticated admins may use this path.
    // The isAdmin flag is derived from server-controlled app_metadata;
    // we never pass it in the booking payload.
    if (!user?.isAdmin) {
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

    const validation = validateBookingData(walkInForm);
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
        name: walkInForm.name,
        phone: walkInForm.phone,
        nic: walkInForm.nic,
        bikeModel: walkInForm.bikeModel,
        mileage: walkInForm.mileage ? String(walkInForm.mileage).trim() : '',
        vehicleNo: walkInForm.vehicleNo,
        serviceType: walkInForm.serviceType,
        date: selectedDate,
        // isWalkIn tells the service this is a same-day walk-in (exempt from the
        // advance-booking rule). Admin privilege is verified from the session,
        // NOT passed as a flag in the payload — never trust client-supplied roles.
        isWalkIn: true
      };

      await addBooking(newBooking);
      setShowWalkInModal(false);
      setWalkInForm({
        name: '',
        phone: '',
        nic: 'Walk-in',
        bikeModel: 'Yamaha FZ-S V3',
        mileage: '',
        vehicleNo: '',
        serviceType: 'Full Service'
      });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-blue-500" /> Admin Workshop Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              STAFF PORTAL
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time queue monitoring, walk-in token generation, and service progress tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-white" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-sm outline-none font-mono"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setShowWalkInModal(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> + Walk-In Booking
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Date Tokens</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.totalBooked} <span className="text-sm font-normal text-slate-500">/ {stats.maxDailySlots}</span>
            </p>
            <span className="text-xs font-bold text-blue-400">
              {Math.round((stats.totalBooked / stats.maxDailySlots) * 100)}% Cap
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${stats.isDayFull ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (stats.totalBooked / stats.maxDailySlots) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Free Service Quota</span>
            <Wrench className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.freeServices} <span className="text-sm font-normal text-slate-500">/ {stats.maxFreeServices}</span>
            </p>
            <span className={`text-xs font-bold ${stats.isFreeServiceFull ? 'text-red-400' : 'text-green-400'}`}>
              {stats.isFreeServiceFull ? 'Quota Full' : `${stats.availableFreeSlots} Left`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${stats.isFreeServiceFull ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, (stats.freeServices / stats.maxFreeServices) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Full & Normal Quota</span>
            <Wrench className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.standardServices || 0} <span className="text-sm font-normal text-slate-500">/ {stats.maxStandardServices || 7}</span>
            </p>
            <span className={`text-xs font-bold ${stats.isStandardServiceFull ? 'text-red-400' : 'text-purple-400'}`}>
              {stats.isStandardServiceFull ? 'Quota Full' : `${stats.availableStandardSlots} Left`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${stats.isStandardServiceFull ? 'bg-red-500' : 'bg-purple-500'}`}
              style={{ width: `${Math.min(100, ((stats.standardServices || 0) / (stats.maxStandardServices || 7)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Progress</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-green-400">
              {completedCount} <span className="text-sm font-normal text-amber-400">({inServiceCount} Active)</span>
            </p>
            <span className="text-xs font-bold text-slate-400">
              {stats.totalBooked > 0 ? Math.round((completedCount / stats.totalBooked) * 100) : 0}% Done
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 truncate">
            {stats.totalBooked - completedCount} bikes pending for {selectedDate}
          </p>
        </div>
      </div>

      {/* Notice Banner if bookings exist on other dates */}
      {dateViewMode === 'selected' && stats.dayBookings.length === 0 && otherDateBookingsCount > 0 && (
        <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">
                No tokens for selected date ({selectedDate}), but {otherDateBookingsCount} booking(s) exist on other dates!
              </p>
              <p className="text-[11px] text-blue-300/80">
                (Customers book at least 1 day in advance, e.g. booking for {otherDateSample}).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {otherDateSample && (
              <button
                type="button"
                onClick={() => setSelectedDate(otherDateSample)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
              >
                Go to {otherDateSample}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDateViewMode('all')}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
            >
              View All Dates ({bookings.length})
            </button>
          </div>
        </div>
      )}

      {/* Bookings Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-base">
              {dateViewMode === 'all' ? 'All Booked Services' : `Service Tokens (${selectedDate})`}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono font-semibold">
              {filteredBookings.length} Tokens
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDateViewMode('selected')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  dateViewMode === 'selected'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Day View
              </button>
              <button
                type="button"
                onClick={() => setDateViewMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  dateViewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Dates ({bookings.length})
              </button>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white outline-none"
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
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 min-w-[720px]">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Token #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Time Slot</th>
                <th className="px-6 py-3.5">Customer &amp; Phone</th>
                <th className="px-6 py-3.5">Bike Model</th>
                <th className="px-6 py-3.5">Plate No</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900">
              {bookingsLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-14">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 text-sm">Loading bookings for {selectedDate}...</p>
                    </div>
                  </td>
                </tr>
              ) : bookingsError ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                      <p className="text-red-400 text-sm font-semibold">Failed to load bookings</p>
                      <p className="text-slate-500 text-xs max-w-xs text-center">{bookingsError}</p>
                      <button
                        onClick={refreshBookings}
                        className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredBookings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-blue-400 text-base">
                        #{String(item.tokenNo).padStart(2, '00')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white" />
                          <span>{item.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white text-xs">{item.timeSlot}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-200">
                        <div>{item.bikeModel}</div>
                        {item.mileage && (
                          <span className="text-[11px] text-slate-400 font-mono">{item.mileage} km</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                        {item.vehicleNo || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.serviceType === 'Free Service'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs rounded-lg px-2.5 py-1 text-white outline-none border font-semibold ${
                            item.status === 'Completed'
                              ? 'bg-green-950 border-green-800 text-green-300'
                              : item.status === 'In-Service'
                              ? 'bg-amber-950 border-amber-800 text-amber-300'
                              : item.status === 'Cancelled'
                              ? 'bg-red-950 border-red-800 text-red-300'
                              : 'bg-slate-950 border-slate-700 text-slate-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In-Service">In-Service</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-500 text-sm">
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

      {/* Walk-in Booking Modal */}
      <Modal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        title="Issue Walk-In / Phone Token"
        subtitle={`Generate a service token for ${selectedDate}`}
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          {walkInError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{walkInError}</span>
            </div>
          )}

          <Input
            label="Customer Name"
            icon={User}
            required
            placeholder="e.g. Kasun Kalhara"
            value={walkInForm.name}
            onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
          />

          <Input
            label="Customer Phone"
            icon={Phone}
            type="tel"
            required
            placeholder="e.g. 0771234567"
            value={walkInForm.phone}
            onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
          />

          <Input
            label="Bike Model"
            icon={Bike}
            required
            placeholder="e.g. Yamaha FZ-S V3"
            value={walkInForm.bikeModel}
            onChange={(e) => setWalkInForm({ ...walkInForm, bikeModel: e.target.value })}
          />

          <Input
            label="Mileage (km)"
            icon={Gauge}
            type="number"
            placeholder="e.g. 15000"
            value={walkInForm.mileage}
            onChange={(e) => setWalkInForm({ ...walkInForm, mileage: e.target.value })}
            helperText="Enter odometer reading in kilometers"
          />

          <Input
            label="Vehicle Plate Number"
            icon={CreditCard}
            required
            placeholder="e.g. BAP-4521"
            value={walkInForm.vehicleNo}
            onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNo: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Service Type</label>
            <select
              value={walkInForm.serviceType}
              onChange={(e) => setWalkInForm({ ...walkInForm, serviceType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
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

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowWalkInModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={walkInSubmitting || stats.isDayFull} className="flex-1">
              {walkInSubmitting ? 'Generating...' : 'Issue Token'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
