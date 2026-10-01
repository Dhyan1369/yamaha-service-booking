import { Bike, Hash, Gauge } from 'lucide-react';
import Input from '../common/Input';

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

export default function BikeDetails({
  bikeModel,
  onBikeModelChange,
  mileage = '',
  onMileageChange,
  vehicleNo,
  onVehicleNoChange,
  disabled = false
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Yamaha Bike Model <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Bike className="w-4 h-4" />
          </div>
          <select
            value={bikeModel}
            disabled={disabled}
            onChange={(e) => onBikeModelChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500 disabled:opacity-50"
          >
            {YAMAHA_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Mileage (km)"
        icon={Gauge}
        type="number"
        placeholder="e.g. 15000"
        disabled={disabled}
        value={mileage}
        onChange={(e) => onMileageChange && onMileageChange(e.target.value)}
        helperText="Enter current bike odometer reading in km"
      />

      <Input
        label="Vehicle Registration No"
        icon={Hash}
        placeholder="e.g. BAP-4521 or WP BIK-1234"
        required
        disabled={disabled}
        value={vehicleNo}
        onChange={(e) => onVehicleNoChange(e.target.value.toUpperCase())}
        helperText="Enter the bike's license plate number"
      />
    </div>
  );
}
