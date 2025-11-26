import { ChartData, ProcessedDataPoint, Variation } from '../types';

export function calculateConversionRate(conversions: number, visits: number): number {
  if (visits === 0) return 0;
  return (conversions / visits) * 100;
}

export function processData(
  chartData: ChartData,
  selectedVariations: string[],
  timeRange: 'day' | 'week' | 'month',
  withBands: boolean = false
): ProcessedDataPoint[] {
  const processed: ProcessedDataPoint[] = [];

  chartData.data.forEach((point) => {
    const processedPoint: ProcessedDataPoint = { date: point.date };

    selectedVariations.forEach((variationId) => {
      const visits = point.visits[variationId] || 0;
      const conversions = point.conversions[variationId] || 0;
      const conversionRate = calculateConversionRate(conversions, visits);
      processedPoint[variationId] = Number(conversionRate.toFixed(2));
    });

    processed.push(processedPoint);
  });

  if (timeRange === 'week') {
    return aggregateByWeek(processed);
  }

  if (timeRange === 'month') {
    return aggregateByMonth(processed);
  }

  return processed;
}

function aggregateByWeek(data: ProcessedDataPoint[]): ProcessedDataPoint[] {
  const weeklyData: ProcessedDataPoint[] = [];
  const weeks: Record<string, ProcessedDataPoint[]> = {};

  data.forEach((point) => {
    const date = new Date(point.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(point);
  });

    Object.keys(weeks).forEach((weekKey) => {
      const weekPoints = weeks[weekKey];
      const aggregated: ProcessedDataPoint = { date: weekKey };

      const variationIds = Object.keys(weekPoints[0]).filter((key) => key !== 'date');
      variationIds.forEach((variationId) => {
        const values = weekPoints
          .map((p) => p[variationId] as number)
          .filter((v) => !isNaN(v) && v !== undefined);
        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          aggregated[variationId] = Number(avg.toFixed(2));
        }
      });

      weeklyData.push(aggregated);
    });

  return weeklyData.sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateByMonth(data: ProcessedDataPoint[]): ProcessedDataPoint[] {
  const monthlyData: ProcessedDataPoint[] = [];
  const months: Record<string, ProcessedDataPoint[]> = {};

  data.forEach((point) => {
    const date = new Date(point.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!months[monthKey]) {
      months[monthKey] = [];
    }
    months[monthKey].push(point);
  });

  Object.keys(months).forEach((monthKey) => {
    const monthPoints = months[monthKey];
    const aggregated: ProcessedDataPoint = { date: `${monthKey}-01` };

    const variationIds = Object.keys(monthPoints[0]).filter((key) => key !== 'date');
    variationIds.forEach((variationId) => {
      const values = monthPoints
        .map((p) => p[variationId] as number)
        .filter((v) => !isNaN(v) && v !== undefined);
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        aggregated[variationId] = Number(avg.toFixed(2));
      }
    });

    monthlyData.push(aggregated);
  });

  return monthlyData.sort((a, b) => a.date.localeCompare(b.date));
}

export function getVariationId(variation: Variation): string {
  return variation.id?.toString() || '0';
}

export function getVariationName(variation: Variation): string {
  return variation.name;
}

export function formatDate(dateString: string, timeRange: 'day' | 'week' | 'month'): string {
  const date = new Date(dateString);
  if (timeRange === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`;
  }
  if (timeRange === 'month') {
    return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

