import { Bike, Hash, Gauge, BookmarkCheck } from 'lucide-react';
import Input from '../common/Input';
import { useLanguage } from '../../context/LanguageContext';

export const YAMAHA_MODELS = [
  'Yamaha FZ-S V3',
  'Yamaha MT-15 V2',
  'Yamaha R15 V4',
  'Yamaha FZ-X',
  'Yamaha RayZR 125 Hybrid',
  'Yamaha Aerox 155',
  'Yamaha WR 155R',
  'Other Yamaha Model'
];

export default function BikeDetails({
  bikeModel,
  onBikeModelChange,
  mileage = '',
  onMileageChange,
  vehicleNo,
  onVehicleNoChange,
  disabled = false,
  savedVehicles = [],
  selectedVehicleId = '',
  onSelectVehicle,
  saveToGarage = false,
  onSaveToGarageChange,
  isLoggedIn = false
}) {
  const { t } = useLanguage();

  const hasSavedVehicles = Array.isArray(savedVehicles) && savedVehicles.length > 0;
  const isRegisteringNew = !hasSavedVehicles || selectedVehicleId === '__new__';

  return (
    <div className="space-y-4">
      {/* If user has saved vehicles in My Garage, display dropdown */}
      {hasSavedVehicles && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-subText">
              {t('booking.savedBikesLabel', 'Choose Motorcycle from My Garage')} <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              {savedVehicles.length} {savedVehicles.length === 1 ? 'bike saved' : 'bikes saved'}
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 dark:text-blue-400">
              <Bike className="w-4 h-4" />
            </div>
            <select
              value={selectedVehicleId}
              disabled={disabled}
              onChange={(e) => onSelectVehicle && onSelectVehicle(e.target.value)}
              className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500 disabled:opacity-50"
              style={{
                background: '#0a1020',
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              {savedVehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.bikeModel} — {v.vehiclePlate} {v.isDefault ? `(${t('profile.defaultBadge', 'Default')})` : ''}
                </option>
              ))}
              <option value="__new__" className="bg-slate-900 text-blue-400 font-semibold">
                {t('booking.registerNewBike', '+ Register a New Bike / Other Vehicle')}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Model Selection: editable if registering new or no saved vehicles */}
      {isRegisteringNew ? (
        <div>
          <label className="block text-xs font-semibold text-subText mb-1.5">
            {t('booking.bikeModelLabel')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
              <Bike className="w-4 h-4" />
            </div>
            <select
              value={bikeModel}
              disabled={disabled}
              onChange={(e) => onBikeModelChange(e.target.value)}
              className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500 disabled:opacity-50"
              style={{
                background: '#0a1020',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {YAMAHA_MODELS.map((model) => (
                <option key={model} value={model} className="bg-slate-900 text-white">
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div
          className="p-3 rounded-xl flex items-center justify-between text-xs"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <span className="text-mutedText font-medium">Selected Model:</span>
          <span className="text-white font-bold">{bikeModel}</span>
        </div>
      )}

      {/* Mileage Input: Always editable per appointment, strictly non-negative */}
      <Input
        label={t('booking.mileageLabel')}
        icon={Gauge}
        type="number"
        min="0"
        placeholder="e.g. 15000"
        disabled={disabled}
        value={mileage}
        onKeyDown={(e) => {
          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || Number(val) >= 0) {
            onMileageChange && onMileageChange(val);
          }
        }}
        helperText={t('booking.mileageHelper')}
      />

      {/* Vehicle Registration Plate */}
      {isRegisteringNew ? (
        <>
          <Input
            label={t('booking.plateLabel')}
            icon={Hash}
            placeholder="e.g. BAP-4521 or WP BIK-1234"
            required
            disabled={disabled}
            value={vehicleNo}
            onChange={(e) => onVehicleNoChange(e.target.value.toUpperCase())}
            helperText={t('booking.plateHelper')}
          />

          {/* Option to save to My Garage if user is logged in */}
          {isLoggedIn && onSaveToGarageChange && (
            <label
              className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition text-xs text-subText"
              style={{
                background: 'rgba(37, 99, 235, 0.06)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              <input
                type="checkbox"
                checked={saveToGarage}
                onChange={(e) => onSaveToGarageChange(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-white/20"
              />
              <BookmarkCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{t('booking.saveToGarage', 'Save this bike to My Garage for future bookings')}</span>
            </label>
          )}
        </>
      ) : (
        <div
          className="p-3 rounded-xl flex items-center justify-between text-xs"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <span className="text-mutedText font-medium">Vehicle Plate:</span>
          <span className="font-mono text-white font-bold tracking-wider">{vehicleNo}</span>
        </div>
      )}
    </div>
  );
}
