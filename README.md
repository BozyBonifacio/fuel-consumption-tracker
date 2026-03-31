# Fuel Consumption Tracker

Expo React Native starter app for tracking vehicle fuel consumption on iPhone.

## Features
- record liters, total price, price per liter, odometer, full tank status
- save fuel type, station name, tank percentage before filling, and notes
- calculate trip distance, L/100km, km/L, and cost per km
- local history storage with AsyncStorage

## Run on Windows
```bash
npm install
npx expo start
```

## iOS build from Windows
Use Expo EAS cloud build:
```bash
npx eas login
npx eas build -p ios
```
