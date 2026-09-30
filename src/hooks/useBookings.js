import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  bookingService, 
  MAX_DAILY_SLOTS, 
  MAX_FREE_SERVICES,
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
      const data = await bookingService.getBookings(null, { userId: user?.id, isAdmin: user?.isAdmin });
      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error in useBookings fetch:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    if (!date || !user?.id) return;
    try {
      const data = await bookingService.getAvailability(date);
      if (data) setAvailability((previous) => ({ ...previous, [date]: data }));
    } catch (err) {
      setError(err.message || 'Failed to load slot availability');
    }
  }, [user]);

  const updateStatus = async (id, newStatus) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error('Failed to update booking status:', err);
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
    const isDayFull = totalBooked >= MAX_DAILY_SLOTS;
    const isFreeServiceFull = freeServices >= MAX_FREE_SERVICES;
    const availableSlots = Math.max(0, MAX_DAILY_SLOTS - totalBooked);
    const availableFreeSlots = Math.max(0, MAX_FREE_SERVICES - freeServices);

    return {
      dayBookings,
      totalBooked,
      freeServices,
      isDayFull,
      isFreeServiceFull,
      availableSlots,
      availableFreeSlots,
      maxDailySlots: MAX_DAILY_SLOTS,
      maxFreeServices: MAX_FREE_SERVICES,
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
    getBookingsForDate,
    getUserBookings,
    getSlotStats
  };
}
