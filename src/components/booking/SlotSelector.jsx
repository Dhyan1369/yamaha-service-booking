import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Lock, Clock } from 'lucide-react';
import { POYA_DATES, HOLIDAY_DATES, toDateKey } from '../../services/bookingService';
import { useLanguage } from '../../context/LanguageContext';

export default function SlotSelector({
  selectedDate,
  onDateChange,
  label,
  disabled = false,
  defaultOpen = false,
  keepOpen = false,
  inline = false
}) {
  const { lang, t } = useLanguage();
  const [calendarOpen, setCalendarOpen] = useState(defaultOpen);
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

  useEffect(() => {
    if (defaultOpen) {
      setCalendarOpen(true);
    }
  }, [defaultOpen]);

  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        setCalendarMonth(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
      }
    }
  }, [selectedDate]);

  const displayLabel = label || t('booking.selectDate');

  // Build today's YYYY-MM-DD key for past-date comparison
  const _now = new Date();
  const todayKey =
    _now.getFullYear() + '-' +
    String(_now.getMonth() + 1).padStart(2, '0') + '-' +
    String(_now.getDate()).padStart(2, '0');
  const todayYear = _now.getFullYear();
  const todayMonth = _now.getMonth();

  // Disable the previous-month arrow when already on the current month
  const canGoPrevMonth =
    calendarMonth.getFullYear() > todayYear ||
    (calendarMonth.getFullYear() === todayYear && calendarMonth.getMonth() > todayMonth);

  const getCalendarDays = () => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array(offset).fill(null),
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1)
      )
    ];
  };

  const checkIsClosed = (dateObj, dateKey) => {
    if (!dateObj) return { isClosed: false, isPast: false, isSameDay: false, reason: '' };

    // Past dates — completely blocked
    if (dateKey < todayKey) {
      return { isClosed: true, isPast: true, isSameDay: false, reason: t('booking.closedPast') };
    }

    // Same-day dates — deadline passed (must book before 11:59 PM of the previous day)
    if (dateKey === todayKey) {
      return {
        isClosed: true,
        isPast: false,
        isSameDay: true,
        reason: t('booking.closedSameDay')
      };
    }

    const isMonday  = dateObj.getDay() === 1;
    const isPoya    = POYA_DATES.has(dateKey);
    const isHoliday = HOLIDAY_DATES.has(dateKey);

    if (isMonday)  return { isClosed: true, isPast: false, isSameDay: false, reason: t('booking.closedMonday') };
    if (isPoya)    return { isClosed: true, isPast: false, isSameDay: false, reason: t('booking.closedPoya') };
    if (isHoliday) return { isClosed: true, isPast: false, isSameDay: false, reason: t('booking.closedHoliday') };

    return { isClosed: false, isPast: false, isSameDay: false, reason: '' };
  };

  const dayHeaders = t('booking.days') || ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="w-full">
      {displayLabel && (
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          {displayLabel} <span className="text-red-400">*</span>
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
          <Calendar className="w-4 h-4 text-white" />
        </button>

        {calendarOpen && (
          <div className={inline 
            ? "mt-3 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl relative" 
            : "absolute z-30 top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl"
          }>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoPrevMonth}
                onClick={() => {
                  if (canGoPrevMonth) {
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                    );
                  }
                }}
                className={`p-1.5 rounded-lg transition ${
                  canGoPrevMonth
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 cursor-not-allowed opacity-40'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <p className="text-sm font-bold text-white capitalize">
                {calendarMonth.toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-US', { month: 'long', year: 'numeric' })}
              </p>

              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
                className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-Week Headers */}
            <div className="grid grid-cols-7 text-center text-[10px] text-slate-500 font-semibold mb-2">
              {dayHeaders.map((day, idx) => (
                <span key={`${day}-${idx}`} className={idx === 0 ? 'text-red-400 font-bold' : ''}>
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />;

                const dateKey = toDateKey(date);
                const { isClosed, isPast, isSameDay, reason } = checkIsClosed(date, dateKey);
                const isSelected = selectedDate === dateKey;
                const isMonday  = date.getDay() === 1;
                const isToday   = dateKey === todayKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    title={reason || (isToday ? t('booking.closedSameDay') : '')}
                    disabled={isClosed}
                    onClick={() => {
                      if (!isClosed) {
                        onDateChange(dateKey);
                        if (!keepOpen) {
                          setCalendarOpen(false);
                        }
                      }
                    }}
                    className={`relative h-9 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/40'
                        : isPast
                        ? 'text-slate-700 cursor-not-allowed opacity-40'
                        : isSameDay
                        ? 'bg-amber-950/20 text-amber-500/80 border border-amber-900/40 cursor-not-allowed'
                        : isClosed
                        ? 'bg-slate-950/80 text-slate-600 cursor-not-allowed border border-slate-900'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{date.getDate()}</span>

                    {/* Monday lock — only on future non-same-day Mondays */}
                    {!isPast && !isSameDay && isMonday && (
                      <Lock className="w-2.5 h-2.5 absolute bottom-1 right-1 text-red-500/70" />
                    )}

                    {/* Poya / Holiday dot — only on future non-same-day */}
                    {!isPast && !isSameDay && !isMonday && (POYA_DATES.has(dateKey) || HOLIDAY_DATES.has(dateKey)) && (
                      <span
                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          POYA_DATES.has(dateKey) ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                      />
                    )}

                    {/* Amber indicator on today (same-day booking closed) */}
                    {isToday && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"
                        title={t('booking.closedSameDay')}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                <Lock className="w-2.5 h-2.5" /> {t('booking.legendMonday')}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-amber-400 not-italic" /> {t('booking.legendPoya')}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-rose-400 not-italic" /> {t('booking.legendHoliday')}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400/90">
                <Clock className="w-2.5 h-2.5" /> {t('booking.legendSameDay')}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-700" /> {t('booking.legendPast')}
              </span>
            </div>

            {/* Booking Notice */}
            <div className="mt-2.5 p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                {t('booking.advanceNoticeInline')}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
        <Clock className="w-3 h-3 text-blue-400 shrink-0" />
        <span>{t('booking.advanceNoticeInline')}</span>
      </p>
    </div>
  );
}

