import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FuelTrackerScreen } from './src/components/FuelTrackerScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <FuelTrackerScreen />
    </SafeAreaProvider>
  );
}
