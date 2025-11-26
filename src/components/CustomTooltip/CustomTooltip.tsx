import { ChartData } from '../../types';
import { getVariationId, getVariationName, formatDateFull } from '../../utils/dataProcessor';
import { formatPercentage } from '../../utils/formatters';
import TrophyIcon from '../../assets/icons/trophy.svg?react';
import CalendarIcon from '../../assets/icons/calendar.svg?react';
import styles from './CustomTooltip.module.css';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  chartData: ChartData;
  timeRange: 'day' | 'week' | 'month';
  calculateConversionRate: (conversions: number, visits: number) => number;
}

export default function CustomTooltip({
  active,
  payload,
  label,
  chartData,
  timeRange,
  calculateConversionRate,
}: CustomTooltipProps) {
  if (!active || !payload || !label) {
    return null;
  }

  const dataPoint = chartData.data.find((d) => d.date === label);
  if (!dataPoint) {
    return null;
  }

  const filteredPayload = payload.filter((entry) => {
    const name = entry.name as string;
    const dataKey = entry.dataKey as string;
    return !name?.includes('_band') && !dataKey?.includes('_band') && 
           !dataKey?.includes('_upper') && !dataKey?.includes('_lower');
  });

  const conversionRates = filteredPayload.map((entry) => {
    const variationId = entry.dataKey as string;
    const visits = dataPoint.visits[variationId] || 0;
    const conversions = dataPoint.conversions[variationId] || 0;
    return calculateConversionRate(conversions, visits);
  });
  const maxRate = Math.max(...conversionRates);

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <CalendarIcon className={styles.calendarIcon} width={16} height={16} />
        <strong>{formatDateFull(label)}</strong>
      </div>
      <div className={styles.tooltipContent}>
        {filteredPayload.map((entry, index) => {
          const variationId = entry.dataKey as string;
          const variation = chartData.variations.find(
            (v) => getVariationId(v) === variationId
          );
          const name = variation ? getVariationName(variation) : variationId;
          const visits = dataPoint.visits[variationId] || 0;
          const conversions = dataPoint.conversions[variationId] || 0;
          const conversionRate = calculateConversionRate(conversions, visits);
          const isBest = conversionRate === maxRate && conversionRate > 0;

          return (
            <div key={index} className={styles.tooltipItem}>
              <div
                className={styles.tooltipColor}
                style={{ backgroundColor: entry.color }}
              />
              <div className={styles.tooltipInfo}>
                <div className={styles.tooltipName}>
                  {name}
                  {isBest && <TrophyIcon className={styles.trophy} width={16} height={16} />}
                  <span className={styles.tooltipValue}>
                    {formatPercentage(conversionRate, 2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

