import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Lock, Clock, Check } from 'lucide-react';
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

  const formatWeekdayName = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-US', { weekday: 'short' });
      }
    } catch {
      return '';
    }
    return '';
  };

  const dayHeaders = t('booking.days') || ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const weekdayLabel = formatWeekdayName(selectedDate);

  return (
    <div className="w-full">
      {displayLabel && (
        <label className="block text-xs font-semibold text-subText mb-1.5">
          {displayLabel} <span className="text-red-500">*</span>
        </label>
      )}
      <div className={`relative ${calendarOpen ? 'z-40' : 'z-10'}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm outline-none transition disabled:opacity-50"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: calendarOpen ? '1px solid rgba(37, 99, 235, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: calendarOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
            color: 'var(--text-heading)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-mono font-bold text-white">{selectedDate}</span>
            {weekdayLabel && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(37, 99, 235, 0.12)',
                  color: '#93c5fd',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                }}
              >
                {weekdayLabel}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-blue-400">
            {calendarOpen ? (lang === 'si' ? 'වසන්න' : 'Close') : (lang === 'si' ? 'වෙනස් කරන්න' : 'Change')}
          </span>
        </button>

        {calendarOpen && (
          <div
            className={inline 
              ? "mt-3 rounded-2xl p-4 sm:p-5 relative" 
              : "absolute z-50 top-full mt-2 left-0 right-0 rounded-2xl p-4 sm:p-5"
            }
            style={{
              background: 'linear-gradient(150deg, #0d1629 0%, #070b16 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(37, 99, 235, 0.2)',
              color: 'var(--text-heading)',
            }}
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3.5 max-w-[340px] sm:max-w-[360px] mx-auto">
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
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                  canGoPrevMonth
                    ? 'text-body hover:text-white hover:bg-white/10'
                    : 'text-white/20 cursor-not-allowed'
                }`}
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
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
                className="w-8 h-8 flex items-center justify-center text-body hover:text-white hover:bg-white/10 rounded-lg transition"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-Week Headers */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold mb-2 max-w-[340px] sm:max-w-[360px] mx-auto">
              {dayHeaders.map((day, idx) => (
                <span key={`${day}-${idx}`} className={idx === 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid with Compact Number Boxes */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 max-w-[340px] sm:max-w-[360px] mx-auto">
              {getCalendarDays().map((date, index) => {
                if (!date) return <span key={`empty-${index}`} className="h-9 w-9 sm:h-10 sm:w-10 mx-auto" />;

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
                    className={`relative h-9 w-9 sm:h-10 sm:w-10 mx-auto flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                      isSelected
                        ? 'text-white font-extrabold z-10'
                        : isPast
                        ? 'text-white/20 cursor-not-allowed'
                        : isSameDay
                        ? 'cursor-not-allowed'
                        : isClosed
                        ? 'cursor-not-allowed text-white/40'
                        : 'text-white hover:bg-white/10 hover:text-white'
                    }`}
                    style={
                      isSelected
                        ? {
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.5), 0 0 0 2px rgba(255,255,255,0.2)',
                            transform: 'scale(1.05)',
                          }
                        : isSameDay
                        ? {
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            color: '#fbbf24',
                          }
                        : isClosed
                        ? {
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                          }
                        : {
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }
                    }
                  >
                    <span className={isSelected ? 'text-white font-extrabold' : ''}>{date.getDate()}</span>

                    {/* Monday lock */}
                    {!isPast && !isSameDay && isMonday && (
                      <Lock className="w-2.5 h-2.5 absolute bottom-1 right-1 text-red-400" />
                    )}

                    {/* Poya / Holiday dot */}
                    {!isPast && !isSameDay && !isMonday && !isSelected && (POYA_DATES.has(dateKey) || HOLIDAY_DATES.has(dateKey)) && (
                      <span
                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          POYA_DATES.has(dateKey) ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                      />
                    )}

                    {/* Amber indicator on today */}
                    {isToday && !isSelected && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"
                        title={t('booking.closedSameDay')}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Confirmation Banner */}
            <div
              className="mt-3.5 p-2.5 rounded-xl flex items-center justify-between"
              style={{
                background: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs text-body font-medium">
                  {lang === 'si' ? 'තෝරාගත් දිනය:' : 'Selected Date:'}
                </span>
                <span className="text-xs font-bold font-mono text-blue-300">
                  {selectedDate}
                </span>
                {weekdayLabel && (
                  <span className="text-[11px] font-semibold text-white">
                    ({weekdayLabel})
                  </span>
                )}
              </div>
              {!inline && (
                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="text-xs font-bold px-3 py-1 rounded-lg text-white transition shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: '0 2px 10px rgba(37,99,235,0.4)',
                  }}
                >
                  {lang === 'si' ? 'තහවුරු කරන්න' : 'Done'}
                </button>
              )}
            </div>

            {/* Legend */}
            <div
              className="mt-3.5 pt-3 flex flex-wrap gap-x-3 gap-y-2 text-[10px]"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}
            >
              <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                <Lock className="w-2.5 h-2.5" /> {t('booking.legendMonday')}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-amber-400 not-italic" /> {t('booking.legendPoya')}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="w-2 h-2 rounded-full bg-rose-400 not-italic" /> {t('booking.legendHoliday')}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                <Clock className="w-2.5 h-2.5" /> {t('booking.legendSameDay')}
              </span>
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} /> {t('booking.legendPast')}
              </span>
            </div>

            {/* Booking Notice */}
            <div
              className="mt-2.5 p-2 rounded-lg text-[10px] flex items-center gap-1.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-body)',
              }}
            >
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                {t('booking.advanceNoticeInline')}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-mutedText mt-1.5 flex items-center gap-1">
        <Clock className="w-3 h-3 text-brandBlue shrink-0" />
        <span>{t('booking.advanceNoticeInline')}</span>
      </p>
    </div>
  );
}
