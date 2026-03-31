export type FuelLog = {
  id: string;
  date: string;
  liters: number;
  totalPrice: number;
  pricePerLiter: number;
  odometer: number;
  isFullTank: boolean;
  fuelType: string;
  stationName: string;
  notes: string;
  partialTankPercent?: number;
  tripDistance?: number;
  consumptionLPer100Km?: number;
  consumptionKmPerLiter?: number;
  costPerKm?: number;
};

export type FuelSummary = {
  totalSpend: number;
  totalLiters: number;
  averagePricePerLiter: number;
  lastConsumptionLPer100Km?: number;
  lastConsumptionKmPerLiter?: number;
  totalDistance?: number;
};
