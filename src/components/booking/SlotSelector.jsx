import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
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
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
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

  const checkIsClosed = (dateObj, dateKey) => {
    if (!dateObj) return { isClosed: false, reason: '' };
    const isMonday = dateObj.getDay() === 1;
    const isPoya = POYA_DATES.has(dateKey);
    const isHoliday = HOLIDAY_DATES.has(dateKey);

    if (isMonday) return { isClosed: true, reason: 'Closed on Mondays (සඳුදා නිවාඩු)' };
    if (isPoya) return { isClosed: true, reason: 'Poya Day Closure (පෝය නිවාඩු)' };
    if (isHoliday) return { isClosed: true, reason: 'Public Holiday Closure (මහජන නිවාඩු)' };

    return { isClosed: false, reason: '' };
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
                <span key={day} className={day === 'Mo' ? 'text-red-400 font-bold' : ''}>
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />;
                const dateKey = toDateKey(date);
                const { isClosed, reason } = checkIsClosed(date, dateKey);
                const isSelected = selectedDate === dateKey;
                const isMonday = date.getDay() === 1;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    title={reason}
                    disabled={isClosed}
                    onClick={() => {
                      if (!isClosed) {
                        onDateChange(dateKey);
                        setCalendarOpen(false);
                      }
                    }}
                    className={`relative h-9 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/40'
                        : isClosed
                        ? 'bg-slate-950/80 text-slate-600 cursor-not-allowed border border-slate-900'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{date.getDate()}</span>

                    {/* Monday Lock Icon or Holiday Dot */}
                    {isMonday ? (
                      <Lock className="w-2.5 h-2.5 absolute bottom-1 right-1 text-red-500/70" />
                    ) : (
                      (POYA_DATES.has(dateKey) || HOLIDAY_DATES.has(dateKey)) && (
                        <span
                          className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                            POYA_DATES.has(dateKey) ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                        />
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                <Lock className="w-2.5 h-2.5" /> සඳුදා (Mondays Closed)
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-amber-400" /> පෝය දිනය (Poya Closed)
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-rose-400" /> මහජන නිවාඩු (Public Holiday)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

