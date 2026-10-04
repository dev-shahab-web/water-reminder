import type { MeasurementUnit } from '@modules/settings';
import {
  formatMeasurementAmount,
  ouncesToMilliliters,
} from '@modules/settings/utils/settings-options';

const capacities = {
  ml: [150, 200, 250, 300, 350, 500, 600, 750, 1000],
  oz: [6, 8, 10, 12, 16, 20, 24, 32, 40],
} as const;

export const getGlassOptions = (unit: MeasurementUnit) =>
  capacities[unit].map((capacity) => ({
    amountMl: unit === 'oz' ? ouncesToMilliliters(capacity) : capacity,
    label: `${capacity} ${unit === 'ml' ? 'mL' : 'oz'}`,
  }));

export const formatGlassCapacity = (amountMl: number, unit: MeasurementUnit): string =>
  formatMeasurementAmount(amountMl, unit).replace(' ml', ' mL');

export const alternateGlassCapacity = (amountMl: number, unit: MeasurementUnit): string =>
  formatGlassCapacity(amountMl, unit === 'ml' ? 'oz' : 'ml');
