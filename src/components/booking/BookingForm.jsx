import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Phone, Wrench, AlertCircle, Clock } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import BikeDetails from './BikeDetails';
import SlotSelector from './SlotSelector';
import TokenReceipt from './TokenReceipt';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { useVehicles } from '../../hooks/useVehicles';
import { useLanguage } from '../../context/LanguageContext';
import { POYA_DATES, HOLIDAY_DATES, getNextOpenBookingDate } from '../../services/bookingService';
import { validateBookingData } from '../../lib/validation';

export default function BookingForm({ onBookingSuccess, onCancel }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBooking, getSlotStats, refreshAvailability, refreshBookings } = useBookings();
  const { vehicles, addVehicle: addGarageVehicle } = useVehicles();
  const { t } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bikeModel, setBikeModel] = useState(user?.bikeModel || user?.defaultBikeModel || 'Yamaha FZ-S V3');
  const [mileage, setMileage] = useState('');
  const [vehicleNo, setVehicleNo] = useState(user?.vehiclePlate || user?.defaultVehiclePlate || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [saveToGarage, setSaveToGarage] = useState(true);
  const [serviceType, setServiceType] = useState('Free Service');
  const [date, setDate] = useState(() => {
    return location.state?.selectedDate || getNextOpenBookingDate();
  });

  const [createdBooking, setCreatedBooking] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-select default vehicle from garage if available
  useEffect(() => {
    if (vehicles.length > 0) {
      const defaultVeh = vehicles.find((v) => v.isDefault) || vehicles[0];
      if (defaultVeh && (!selectedVehicleId || selectedVehicleId === '')) {
        setSelectedVehicleId(defaultVeh.id);
        setBikeModel(defaultVeh.bikeModel);
        setVehicleNo(defaultVeh.vehiclePlate);
      }
    }
  }, [vehicles, selectedVehicleId]);

  const handleSelectVehicle = (vehId) => {
    setSelectedVehicleId(vehId);
    if (vehId === '__new__') {
      setBikeModel('Yamaha FZ-S V3');
      setVehicleNo('');
    } else {
      const found = vehicles.find((v) => v.id === vehId);
      if (found) {
        setBikeModel(found.bikeModel);
        setVehicleNo(found.vehiclePlate);
      }
    }
  };

  // Resolved values if user signs in later
  const customerName = name || user?.name || '';
  const customerPhone = phone || user?.phone || '';
  const selectedBikeModel = bikeModel || user?.bikeModel || 'Yamaha FZ-S V3';

  // Slot statistics for the currently selected date in the form
  const stats = getSlotStats(date);

  useEffect(() => {
    refreshAvailability(date);
  }, [date, refreshAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      navigate('/login', { state: { redirectTo: '/booking' } });
      return;
    }

    if (user && (user.isActive === false || user.is_active === false)) {
      setErrorMessage(
        t('booking.errAccountDeactivated', 'Your account has been deactivated. Please contact the workshop to restore booking access.')
      );
      return;
    }

    // Guard: reject past dates and same-day bookings (must book by 11:59 PM of the previous day)
    const todayObj2 = new Date();
    const todayKey2 = `${todayObj2.getFullYear()}-${String(todayObj2.getMonth() + 1).padStart(2, '0')}-${String(todayObj2.getDate()).padStart(2, '0')}`;
    if (date <= todayKey2) {
      if (date === todayKey2) {
        setErrorMessage(t('booking.errSameDay'));
      } else {
        setErrorMessage(t('booking.errPastDate'));
      }
      return;
    }

    // Check Monday closure (getDay === 1)
    const dateParts = date.split('-');
    if (dateParts.length === 3) {
      const targetDateObj = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
      if (targetDateObj.getDay() === 1) {
        setErrorMessage(t('booking.errMonday'));
        return;
      }
    }

    // Check Poya Day closure
    if (POYA_DATES.has(date)) {
      setErrorMessage(t('booking.errPoya'));
      return;
    }

    if (HOLIDAY_DATES.has(date)) {
      setErrorMessage(t('booking.errHoliday'));
      return;
    }

    const validation = validateBookingData({
      name: customerName,
      phone: customerPhone,
      bikeModel: selectedBikeModel,
      vehicleNo,
      serviceType,
      mileage
    });
    if (!validation.valid) {
      setErrorMessage(Object.values(validation.errors)[0]);
      return;
    }

    if (stats.isDayFull) {
      setErrorMessage(t('booking.errDayFull'));
      return;
    }

    if (serviceType === 'Free Service' && stats.isFreeServiceFull) {
      setErrorMessage(t('booking.errFreeQuotaFull'));
      return;
    }

    if ((serviceType === 'Full Service' || serviceType === 'Normal Service') && stats.isStandardServiceFull) {
      setErrorMessage(t('booking.errStandardQuotaFull'));
      return;
    }

    try {
      setSubmitting(true);

      // If user registered a new bike and selected "Save to My Garage", persist it
      if (user?.id && (selectedVehicleId === '__new__' || vehicles.length === 0) && saveToGarage && vehicleNo.trim()) {
        try {
          await addGarageVehicle({
            bikeModel: selectedBikeModel,
            vehiclePlate: vehicleNo.trim().toUpperCase(),
            isDefault: vehicles.length === 0
          });
        } catch (vehErr) {
          console.warn('[BookingForm] Could not auto-save vehicle to garage:', vehErr.message);
        }
      }

      const newBooking = {
        name: customerName,
        phone: customerPhone,
        nic: user.nic || 'N/A',
        bikeModel: selectedBikeModel,
        mileage: mileage ? String(mileage).trim() : '',
        vehicleNo: vehicleNo.trim().toUpperCase(),
        serviceType,
        date,
        userId: user.id || null
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

  const handleReceiptDone = () => {
    setShowReceipt(false);
    if (date) {
      refreshAvailability(date);
    }
    refreshBookings();

    if (onBookingSuccess) {
      onBookingSuccess(createdBooking);
    }

    if (onCancel) {
      onCancel();
      return;
    }

    if (user?.isAdmin) {
      navigate('/admin');
    } else if (user) {
      navigate('/dashboard', {
        state: {
          newBookingToken: createdBooking?.tokenNo,
          newBookingDate: createdBooking?.date,
          newBookingTime: createdBooking?.timeSlot
        }
      });
    } else {
      navigate('/');
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
            label={t('booking.customerName')}
            icon={User}
            required
            value={customerName}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kasun Kalhara"
          />

          <Input
            label={t('booking.phoneLabel')}
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
          mileage={mileage}
          onMileageChange={(val) => setMileage(val)}
          vehicleNo={vehicleNo}
          onVehicleNoChange={(val) => setVehicleNo(val)}
          savedVehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
          saveToGarage={saveToGarage}
          onSaveToGarageChange={setSaveToGarage}
          isLoggedIn={Boolean(user)}
        />

        {/* Service Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-subText mb-1.5">
            {t('booking.selectServiceType')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
              <Wrench className="w-4 h-4" />
            </div>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500"
              style={{
                background: '#0a1020',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <option value="Free Service" disabled={stats.isFreeServiceFull} className="bg-slate-900 text-white">
                {stats.isFreeServiceFull 
                  ? t('booking.freeServiceFull') 
                  : `${t('booking.freeService')} (${stats.availableFreeSlots} / ${stats.maxFreeServices} ${t('booking.freeServiceSlotsLeft')})`}
              </option>
              <option value="Full Service" disabled={stats.isStandardServiceFull} className="bg-slate-900 text-white">
                {stats.isStandardServiceFull
                  ? `${t('booking.fullService')} (${t('booking.standardQuotaFull')})`
                  : `${t('booking.fullService')} (${stats.availableStandardSlots} / ${stats.maxStandardServices} ${t('booking.freeServiceSlotsLeft')})`}
              </option>
              <option value="Normal Service" disabled={stats.isStandardServiceFull} className="bg-slate-900 text-white">
                {stats.isStandardServiceFull
                  ? `${t('booking.normalService')} (${t('booking.standardQuotaFull')})`
                  : `${t('booking.normalService')} (${stats.availableStandardSlots} / ${stats.maxStandardServices} ${t('booking.freeServiceSlotsLeft')})`}
              </option>
            </select>
          </div>
        </div>

        {/* Advance Booking Policy Notice */}
        <div
          className="p-3.5 rounded-xl text-xs flex items-start gap-2.5"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
          }}
        >
          <Clock className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-white">{t('booking.advanceNoticeTitle')}</p>
            <p className="text-[11px] text-blue-200/80 leading-relaxed">
              {t('booking.advanceNoticeDesc')}
            </p>
          </div>
        </div>

        {/* Date / Slot Selector - inline={true} expands within layout so it doesn't cover content */}
        <SlotSelector
          selectedDate={date}
          onDateChange={(selected) => setDate(selected)}
          label={t('booking.selectDate')}
          inline={true}
        />

        {/* Live Slot Status for selected date */}
        <div
          className="p-3.5 rounded-xl text-xs space-y-2"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div className="flex justify-between items-center text-slate-300">
            <span>{t('booking.dateAvailability')}</span>
            <span className={`font-bold ${stats.isDayFull ? 'text-red-400' : 'text-emerald-400'}`}>
              {stats.isDayFull ? t('booking.full') : `${stats.availableSlots} / ${stats.maxDailySlots} ${t('booking.slotsAvailable')}`}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{t('booking.freeQuota')}</span>
            <span className={`font-bold ${stats.isFreeServiceFull ? 'text-red-400' : 'text-blue-400'}`}>
              {stats.isFreeServiceFull ? t('booking.quotaReached') : `${stats.availableFreeSlots} / ${stats.maxFreeServices} ${t('booking.of5Left')}`}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>{t('booking.standardQuota')}</span>
            <span className={`font-bold ${stats.isStandardServiceFull ? 'text-red-400' : 'text-purple-400'}`}>
              {stats.isStandardServiceFull ? t('booking.standardQuotaFull') : `${stats.availableStandardSlots} / ${stats.maxStandardServices} ${t('booking.of7Left')}`}
            </span>
          </div>
          {!stats.isDayFull && (
            <p
              className="text-[11px] pt-1"
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                color: 'var(--text-muted)',
              }}
            >
              {t('booking.estimatedToken')}{' '}
              <span className="font-mono text-blue-400 font-bold">
                #{String(stats.nextAvailableToken).padStart(2, '0')}
              </span>{' '}
              ({stats.nextSlotTime})
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className={`pt-3 ${onCancel ? 'flex flex-col-reverse sm:flex-row gap-3' : ''}`}>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto py-3 sm:py-2.5 px-4 rounded-xl text-sm font-semibold"
              onClick={onCancel}
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={stats.isDayFull || submitting}
            className="w-full py-3.5 text-base font-semibold rounded-xl flex-1 shadow-lg shadow-blue-600/25"
          >
            {submitting ? t('booking.bookingInProgress') : stats.isDayFull ? t('booking.dateFull') : t('booking.confirmBooking')}
          </Button>
        </div>
      </form>

      {/* Success Token Receipt Modal */}
      <TokenReceipt
        isOpen={showReceipt}
        booking={createdBooking}
        onClose={handleReceiptDone}
      />
    </>
  );
}

