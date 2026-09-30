import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { POYA_DATES, HOLIDAY_DATES, toDateKey } from '../../services/bookingService';

export default function SlotSelector({
  selectedDate,
  onDateChange,
  label = 'Service Date',
  disabled = false
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date(2026, 8, 1);
  });

  const getCalendarDays = () => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array(offset).fill(null),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)
      )
    ];
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          {label} <span className="text-red-400">*</span>
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition focus:border-blue-500 disabled:opacity-50"
        >
          <span className="font-mono">{selectedDate}</span>
          <Calendar className="w-4 h-4 text-blue-400" />
        </button>

        {calendarOpen && (
          <div className="absolute z-30 top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl animate-in fade-in duration-150">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                }
                className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-bold text-white">
                {calendarMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                }
                className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-[10px] text-slate-500 font-semibold mb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />;
                const dateKey = toDateKey(date);
                const isMonday = date.getDay() === 1;
                const isPoya = POYA_DATES.has(dateKey);
                const isHoliday = HOLIDAY_DATES.has(dateKey);
                const isSelected = selectedDate === dateKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      onDateChange(dateKey);
                      setCalendarOpen(false);
                    }}
                    className={`relative h-9 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/40'
                        : 'text-slate-200 hover:bg-slate-800'
                    } ${isMonday && !isSelected ? 'bg-slate-800/60 text-slate-300' : ''}`}
                  >
                    {date.getDate()}
                    {(isPoya || isHoliday) && (
                      <span
                        title={isPoya ? 'Poya Day' : 'Public Holiday'}
                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          isPoya ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-sm bg-slate-700 border border-slate-600" /> සඳුදා (Monday)
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-amber-400" /> පෝය දිනය (Poya)
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-rose-400" /> නිවාඩු දිනය (Holiday)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
