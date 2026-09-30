import { useState } from 'react';
import { User, Phone, Wrench, AlertCircle } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import BikeDetails from './BikeDetails';
import SlotSelector from './SlotSelector';
import TokenReceipt from './TokenReceipt';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';

export default function BookingForm({ onBookingSuccess, onCancel }) {
  const { user, openAuthModal } = useAuth();
  const { addBooking, getSlotStats } = useBookings();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bikeModel, setBikeModel] = useState(user?.bikeModel || 'Yamaha FZ-S V3');
  const [vehicleNo, setVehicleNo] = useState('');
  const [serviceType, setServiceType] = useState('Free Service');
  const [date, setDate] = useState('2026-09-30');

  const [createdBooking, setCreatedBooking] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resolved values if user signs in later
  const customerName = name || user?.name || '';
  const customerPhone = phone || user?.phone || '';
  const selectedBikeModel = bikeModel || user?.bikeModel || 'Yamaha FZ-S V3';

  // Slot statistics for the currently selected date in the form
  const stats = getSlotStats(date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      openAuthModal();
      return;
    }

    if (stats.isDayFull) {
      setErrorMessage('Samawenna! Ada dinayata tokens 12 ma awasan wela aththa.');
      return;
    }

    if (serviceType === 'Free Service' && stats.isFreeServiceFull) {
      setErrorMessage(
        'Ape free service quota eka (5) ada dinayata piri aththa. Karunakara Paid Service thoraganna ho wena dinayak thoranna.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const nextTokenNo = stats.totalBooked + 1;
      const newBooking = {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        tokenNo: nextTokenNo,
        timeSlot: stats.nextSlotTime,
        name: customerName,
        phone: customerPhone,
        nic: user.nic || 'N/A',
        bikeModel: selectedBikeModel,
        vehicleNo,
        serviceType,
        status: 'Pending',
        date
      };

      const result = await addBooking(newBooking);
      setCreatedBooking(result);
      setShowReceipt(true);

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Booking creation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            icon={User}
            required
            value={customerName}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kasun Kalhara"
          />

          <Input
            label="Phone Number"
            icon={Phone}
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0771234567"
          />
        </div>

        <BikeDetails
          bikeModel={selectedBikeModel}
          onBikeModelChange={(val) => setBikeModel(val)}
          vehicleNo={vehicleNo}
          onVehicleNoChange={(val) => setVehicleNo(val)}
        />

        {/* Service Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Select Service Type <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Wrench className="w-4 h-4" />
            </div>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500"
            >
              <option value="Free Service" disabled={stats.isFreeServiceFull}>
                Free Service {stats.isFreeServiceFull ? '(Quota Reached - 5/5 Full)' : `(${stats.availableFreeSlots} Slots Left)`}
              </option>
              <option value="Full Service">Full Service (Comprehensive maintenance)</option>
              <option value="Normal Service">Normal Service (Standard lube & tuning)</option>
            </select>
          </div>
        </div>

        {/* Date / Slot Selector */}
        <SlotSelector
          selectedDate={date}
          onDateChange={(selected) => setDate(selected)}
        />

        {/* Live Slot Status for selected date */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span>Date Slot Availability:</span>
            <span className={`font-bold ${stats.isDayFull ? 'text-red-400' : 'text-green-400'}`}>
              {stats.isDayFull ? 'FULL (12/12)' : `${stats.availableSlots} of 12 Slots Available`}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Free Service Quota:</span>
            <span className={`font-bold ${stats.isFreeServiceFull ? 'text-red-400' : 'text-blue-400'}`}>
              {stats.isFreeServiceFull ? 'Quota Reached (5/5)' : `${stats.availableFreeSlots} of 5 Left`}
            </span>
          </div>
          {!stats.isDayFull && (
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-900">
              Estimated token for this date: <span className="font-mono text-white font-bold">#{String(stats.nextAvailableToken).padStart(2, '0')}</span> ({stats.nextSlotTime})
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={stats.isDayFull || submitting}
            className="flex-1"
          >
            {submitting ? 'Booking...' : stats.isDayFull ? 'Date Full' : 'Confirm Token Booking'}
          </Button>
        </div>
      </form>

      {/* Success Token Receipt Modal */}
      <TokenReceipt
        isOpen={showReceipt}
        booking={createdBooking}
        onClose={() => {
          setShowReceipt(false);
          if (onCancel) onCancel();
        }}
      />
    </>
  );
}
