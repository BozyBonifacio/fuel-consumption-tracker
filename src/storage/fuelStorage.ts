import AsyncStorage from '@react-native-async-storage/async-storage';
import { FuelLog } from '../types';

const STORAGE_KEY = 'fuel-consumption-tracker/logs';

export async function saveLogs(logs: FuelLog[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export async function loadLogs(): Promise<FuelLog[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as FuelLog[];
  } catch {
    return [];
  }
}
