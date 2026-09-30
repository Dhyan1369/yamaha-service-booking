import { useState, useEffect, useCallback } from 'react';
import { 
  bookingService, 
  MAX_DAILY_SLOTS, 
  MAX_FREE_SERVICES,
  calculateSlotTime 
} from '../services/bookingService';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings();
      setBookings(data || []);
      setError(null);
    } catch (err) {
      console.error('Error in useBookings fetch:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      try {
        const data = await bookingService.getBookings();
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
  }, []);

  const addBooking = async (bookingData) => {
    try {
      const created = await bookingService.createBooking(bookingData);
      setBookings((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Failed to create booking:', err);
      throw err;
    }
  };

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

  const getUserBookings = (phone) => {
    if (!phone) return [];
    return bookings.filter((b) => b.phone === phone);
  };

  const getSlotStats = (date) => {
    const dayBookings = getBookingsForDate(date);
    const totalBooked = dayBookings.length;
    const freeServices = dayBookings.filter((b) => b.serviceType === 'Free Service').length;
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
    addBooking,
    updateStatus,
    getBookingsForDate,
    getUserBookings,
    getSlotStats
  };
}
