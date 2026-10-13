import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { vehicleService } from '../services/vehicleService';

export function useVehicles() {
  const { user, updateCustomerProfile } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicles = useCallback(async () => {
    if (!user?.id) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await vehicleService.getVehicles(user.id, {
        bikeModel: user.bikeModel || user.defaultBikeModel,
        vehiclePlate: user.vehiclePlate || user.defaultVehiclePlate
      });
      setVehicles(data || []);
      setError(null);
    } catch (err) {
      console.error('[useVehicles] fetchVehicles error:', err);
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.bikeModel, user?.defaultBikeModel, user?.vehiclePlate, user?.defaultVehiclePlate]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = async ({ bikeModel, vehiclePlate, isDefault = false }) => {
    if (!user?.id) throw new Error('Sign in required to add a vehicle.');
    try {
      const created = await vehicleService.addVehicle({
        userId: user.id,
        bikeModel,
        vehiclePlate,
        isDefault
      });
      await fetchVehicles();

      // If set as default or this is the first vehicle, sync into Auth profile
      if (isDefault || vehicles.length === 0) {
        try {
          await updateCustomerProfile({
            bikeModel: created.bikeModel,
            default_bike_model: created.bikeModel,
            vehiclePlate: created.vehiclePlate,
            default_vehicle_plate: created.vehiclePlate
          });
        } catch {
          // Non-blocking profile sync
        }
      }
      return created;
    } catch (err) {
      throw err;
    }
  };

  const deleteVehicle = async (vehicleId) => {
    if (!user?.id) return;
    await vehicleService.deleteVehicle(vehicleId, user.id);
    await fetchVehicles();
  };

  const setDefaultVehicle = async (vehicleId) => {
    if (!user?.id) return;
    await vehicleService.setDefaultVehicle(vehicleId, user.id);
    const target = vehicles.find((v) => v.id === vehicleId);
    if (target) {
      try {
        await updateCustomerProfile({
          bikeModel: target.bikeModel,
          default_bike_model: target.bikeModel,
          vehiclePlate: target.vehiclePlate,
          default_vehicle_plate: target.vehiclePlate
        });
      } catch {
        // Non-blocking profile sync
      }
    }
    await fetchVehicles();
  };

  return {
    vehicles,
    loading,
    error,
    refreshVehicles: fetchVehicles,
    addVehicle,
    deleteVehicle,
    setDefaultVehicle
  };
}
