import { Variation, LineStyle, TimeRange } from '../../types';
import { getVariationId, getVariationName } from '../../utils/dataProcessor';
import styles from './Controls.module.css';

interface ControlsProps {
  variations: Variation[];
  selectedVariations: string[];
  onVariationToggle: (variationId: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  lineStyle: LineStyle;
  onLineStyleChange: (style: LineStyle) => void;
  zoomEnabled: boolean;
  onZoomToggle: (enabled: boolean) => void;
}

const COLORS = ['#000000', '#4a90e2', '#ff8346', '#ffa500'];

export default function Controls({
  variations,
  selectedVariations,
  onVariationToggle,
  timeRange,
  onTimeRangeChange,
  lineStyle,
  onLineStyleChange,
  zoomEnabled,
  onZoomToggle,
}: ControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>Варианты:</label>
        <div className={styles.variationsList}>
          {variations.map((variation, index) => {
            const variationId = getVariationId(variation);
            const isSelected = selectedVariations.includes(variationId);
            const color = COLORS[index % COLORS.length];

            return (
              <label
                key={variationId}
                className={`${styles.variationItem} ${isSelected ? styles.selected : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onVariationToggle(variationId)}
                  disabled={isSelected && selectedVariations.length === 1}
                  className={styles.checkbox}
                />
                <span
                  className={styles.colorIndicator}
                  style={{ backgroundColor: color }}
                />
                <span className={styles.variationName}>
                  {getVariationName(variation)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>Период:</label>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${timeRange === 'day' ? styles.active : ''}`}
            onClick={() => onTimeRangeChange('day')}
          >
            День
          </button>
          <button
            className={`${styles.button} ${timeRange === 'week' ? styles.active : ''}`}
            onClick={() => onTimeRangeChange('week')}
          >
            Неделя
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>Стиль линии:</label>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${lineStyle === 'line' ? styles.active : ''}`}
            onClick={() => onLineStyleChange('line')}
          >
            Линия
          </button>
          <button
            className={`${styles.button} ${lineStyle === 'smooth' ? styles.active : ''}`}
            onClick={() => onLineStyleChange('smooth')}
          >
            Сглаженная
          </button>
          <button
            className={`${styles.button} ${lineStyle === 'area' ? styles.active : ''}`}
            onClick={() => onLineStyleChange('area')}
          >
            Область
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>Масштаб:</label>
        <button
          className={`${styles.button} ${zoomEnabled ? styles.active : ''}`}
          onClick={() => onZoomToggle(!zoomEnabled)}
        >
          {zoomEnabled ? '🔍 Сбросить' : '🔍 Включить'}
        </button>
      </div>
    </div>
  );
}

