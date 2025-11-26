export interface Variation {
  id?: number;
  name: string;
}

export interface DataPoint {
  date: string;
  visits: Record<string, number>;
  conversions: Record<string, number>;
}

export interface ChartData {
  variations: Variation[];
  data: DataPoint[];
}

export interface ProcessedDataPoint {
  date: string;
  [variationId: string]: string | number;
}

export type LineStyle = 'line' | 'smooth' | 'area' | 'bands';
export type TimeRange = 'day' | 'week' | 'month';

