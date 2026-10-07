import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  bookingService, 
  MAX_DAILY_SLOTS, 
  MAX_FREE_SERVICES,
  MAX_STANDARD_SERVICES,
  calculateSlotTime 
} from '../services/bookingService';

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings(null, {
        userId: user?.id,
        isAdmin: Boolean(user?.isAdmin)
      });
      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error in useBookings fetch:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.isAdmin]);

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      try {
        const data = await bookingService.getBookings(null, { userId: user?.id, isAdmin: user?.isAdmin });
        if (!ignore) {
          setBookings(data || []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load bookings');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    initLoad();
    return () => {
      ignore = true;
    };
  }, [user?.id, user?.isAdmin]);

  const addBooking = async (bookingData) => {
    try {
      const created = await bookingService.createBooking(bookingData);
      setBookings((prev) => [created, ...prev]);
      try {
        const updatedAvailability = await bookingService.getAvailability(bookingData.date);
        if (updatedAvailability) {
          setAvailability((previous) => ({ ...previous, [bookingData.date]: updatedAvailability }));
        }
      } catch {
        // The booking succeeded; a later refresh can recover the display count.
      }
      return created;
    } catch (err) {
      console.error('Failed to create booking:', err);
      throw err;
    }
  };

  const refreshAvailability = useCallback(async (date) => {
    if (!date) return;
    try {
      const data = await bookingService.getAvailability(date);
      if (data) setAvailability((previous) => ({ ...previous, [date]: data }));
    } catch (err) {
      setError(err.message || 'Failed to load slot availability');
    }
  }, []);

  const updateStatus = async (id, newStatus, scheduledDate = null) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus, scheduledDate);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      // If a booking is cancelled, refresh availability for that date so quota is immediately freed
      const target = bookings.find((b) => b.id === id);
      const targetDate = scheduledDate || target?.date;
      if (targetDate) {
        refreshAvailability(targetDate);
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      throw err;
    }
  };

  const cancelBooking = async (id) => {
    try {
      await bookingService.cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b))
      );
      // Immediately refresh slot availability for the cancelled date
      const target = bookings.find((b) => b.id === id);
      if (target?.date) {
        refreshAvailability(target.date);
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      throw err;
    }
  };

  const getBookingsForDate = (date) => {
    return bookings.filter((b) => b.date === date);
  };

  const getUserBookings = (userParam) => {
    if (!userParam?.id) return [];
    return bookings.filter((b) => b.userId === userParam.id);
  };

  const getSlotStats = (date) => {
    const dayBookings = getBookingsForDate(date);
    const serverStats = availability[date];
    const totalBooked = serverStats?.totalBooked ?? dayBookings.length;
    const freeServices = serverStats?.freeServices ?? dayBookings.filter((b) => b.serviceType === 'Free Service').length;
    const standardServices = serverStats?.standardServices ?? dayBookings.filter(
      (b) => b.serviceType === 'Full Service' || b.serviceType === 'Normal Service'
    ).length;

    const isDayFull = totalBooked >= MAX_DAILY_SLOTS;
    const isFreeServiceFull = freeServices >= MAX_FREE_SERVICES;
    const isStandardServiceFull = standardServices >= MAX_STANDARD_SERVICES;

    const availableSlots = Math.max(0, MAX_DAILY_SLOTS - totalBooked);
    const availableFreeSlots = Math.max(0, MAX_FREE_SERVICES - freeServices);
    const availableStandardSlots = Math.max(0, MAX_STANDARD_SERVICES - standardServices);

    return {
      dayBookings,
      totalBooked,
      freeServices,
      standardServices,
      isDayFull,
      isFreeServiceFull,
      isStandardServiceFull,
      availableSlots,
      availableFreeSlots,
      availableStandardSlots,
      maxDailySlots: MAX_DAILY_SLOTS,
      maxFreeServices: MAX_FREE_SERVICES,
      maxStandardServices: MAX_STANDARD_SERVICES,
      nextAvailableToken: totalBooked + 1,
      nextSlotTime: calculateSlotTime(totalBooked + 1)
    };
  };

  return {
    bookings,
    loading,
    error,
    refreshBookings: fetchBookings,
    refreshAvailability,
    addBooking,
    updateStatus,
    cancelBooking,
    getBookingsForDate,
    getUserBookings,
    getSlotStats
  };
};
