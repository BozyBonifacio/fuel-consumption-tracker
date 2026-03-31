import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadLogs, saveLogs } from '../storage/fuelStorage';
import { FuelLog, FuelSummary } from '../types';

type InputLog = Omit<FuelLog, 'id' | 'date'>;

function computeMetrics(previous: FuelLog | undefined, current: InputLog) {
  if (!previous) {
    return {};
  }

  const tripDistance = current.odometer - previous.odometer;
  if (tripDistance <= 0 || !current.isFullTank) {
    return { tripDistance };
  }

  const consumptionLPer100Km = (current.liters / tripDistance) * 100;
  const consumptionKmPerLiter = tripDistance / current.liters;
  const costPerKm = current.totalPrice / tripDistance;

  return {
    tripDistance,
    consumptionLPer100Km,
    consumptionKmPerLiter,
    costPerKm,
  };
}

export function useFuelLogs() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLogs().then((items) => {
      const sorted = [...items].sort((a, b) => b.odometer - a.odometer);
      setLogs(sorted);
      setIsLoaded(true);
    });
  }, []);

  const addLog = useCallback(async (entry: InputLog) => {
    const previous = [...logs].sort((a, b) => b.odometer - a.odometer)[0];
    const next: FuelLog = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      ...entry,
      ...computeMetrics(previous, entry),
    };

    const updated = [next, ...logs].sort((a, b) => b.odometer - a.odometer);
    setLogs(updated);
    await saveLogs(updated);
  }, [logs]);

  const deleteLog = useCallback(async (id: string) => {
    const updated = logs.filter((item) => item.id !== id);
    setLogs(updated);
    await saveLogs(updated);
  }, [logs]);

  const summary = useMemo<FuelSummary>(() => {
    if (logs.length === 0) {
      return {
        totalLiters: 0,
        totalSpend: 0,
        averagePricePerLiter: 0,
      };
    }

    const totalSpend = logs.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalLiters = logs.reduce((sum, item) => sum + item.liters, 0);
    const averagePricePerLiter = totalLiters > 0 ? totalSpend / totalLiters : 0;
    const totalDistance = logs
      .filter((item) => typeof item.tripDistance === 'number' && item.tripDistance > 0)
      .reduce((sum, item) => sum + (item.tripDistance ?? 0), 0);

    const latestMeasured = logs.find((item) => typeof item.consumptionLPer100Km === 'number');

    return {
      totalSpend,
      totalLiters,
      averagePricePerLiter,
      totalDistance: totalDistance || undefined,
      lastConsumptionLPer100Km: latestMeasured?.consumptionLPer100Km,
      lastConsumptionKmPerLiter: latestMeasured?.consumptionKmPerLiter,
    };
  }, [logs]);

  return {
    logs,
    summary,
    isLoaded,
    addLog,
    deleteLog,
  };
}
