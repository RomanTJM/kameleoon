import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Brush,
} from 'recharts';
import { ChartData, Variation, LineStyle, TimeRange } from '../../types';
import { processData, getVariationId, getVariationName, formatDate } from '../../utils/dataProcessor';
import { calculateConversionRate } from '../../utils/dataProcessor';
import { formatPercentage } from '../../utils/formatters';
import CustomTooltip from '../CustomTooltip/CustomTooltip';
import ArrowDownIcon from '../../assets/icons/arrow-down.svg?react';
import PanningBtnIcon from '../../assets/icons/panning-btn.svg?react';
import RefreshIcon from '../../assets/icons/refresh.svg?react';
import DownloadIcon from '../../assets/icons/download.svg?react';
import PlusIcon from '../../assets/icons/plus.svg?react';
import MinusIcon from '../../assets/icons/minus.svg?react';
import LightIcon from '../../assets/icons/light.svg?react';
import DarkIcon from '../../assets/icons/dark.svg?react';
import styles from './Chart.module.css';

interface ChartProps {
  chartData: ChartData;
  selectedVariations: string[];
  timeRange: TimeRange;
  lineStyle: LineStyle;
  zoomEnabled: boolean;
  variations: Variation[];
  onVariationToggle: (variationId: string) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onZoomToggle: (enabled: boolean) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const COLORS_LIGHT = ['#000000', '#4a90e2', '#ff8346', '#ffa500'];
const COLORS_DARK = ['#c7c5d0', '#4a90e2', '#ff8346', '#ffa500'];

const getColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? COLORS_DARK : COLORS_LIGHT;
};

export default function Chart({
  chartData,
  selectedVariations,
  timeRange,
  lineStyle,
  zoomEnabled,
  variations,
  onVariationToggle,
  onTimeRangeChange,
  onLineStyleChange,
  onZoomToggle,
  theme,
  onThemeToggle,
}: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{
    variations: boolean;
    timeRange: boolean;
    lineStyle: boolean;
  }>({
    variations: false,
    timeRange: false,
    lineStyle: false,
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panMode, setPanMode] = useState(false);

  useEffect(() => {
    if (!dropdownOpen.variations && !dropdownOpen.timeRange && !dropdownOpen.lineStyle) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest(`.${styles.dropdownButton}`)) {
        return;
      }

      if (target.closest(`.${styles.dropdownMenu}`)) {
        return;
      }

      const dropdownElement = target.closest('[data-dropdown]');
      if (dropdownElement) {
        return;
      }

      setDropdownOpen({
        variations: false,
        timeRange: false,
        lineStyle: false,
      });
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  const processedData = processData(chartData, selectedVariations, timeRange);

  const getMinMaxValues = useCallback(() => {
    if (processedData.length === 0) return { min: 0, max: 100 };
    
    let min = Infinity;
    let max = -Infinity;

    processedData.forEach((point) => {
      selectedVariations.forEach((variationId) => {
        const value = point[variationId] as number;
        if (typeof value === 'number' && !isNaN(value)) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
    });

    const padding = (max - min) * 0.1;
    return {
      min: Math.max(0, min - padding),
      max: max + padding,
    };
  }, [processedData, selectedVariations]);

  const { min, max } = getMinMaxValues();

  const handleMouseMove = useCallback((state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setActiveIndex(state.activeTooltipIndex);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleExport = () => {
    try {
      if (!chartRef.current) {
        alert('График не найден');
        return;
      }

      const container = chartRef.current.querySelector('.recharts-wrapper');
      const svgElement = container?.querySelector('svg') || chartRef.current.querySelector('svg');
      
      if (!svgElement) {
        alert('SVG элемент не найден');
        return;
      }

      const svgRect = svgElement.getBoundingClientRect();
      const width = svgRect.width || 1200;
      const height = svgRect.height || 600;

      const svgClone = svgElement.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', width.toString());
      svgClone.setAttribute('height', height.toString());

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Не удалось создать контекст canvas');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        const bgColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--bg-secondary') || '#f5f5f5';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `ab-test-chart-${new Date().toISOString().split('T')[0]}.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(svgUrl);
          } else {
            alert('Не удалось создать изображение');
          }
        }, 'image/png');
      };

      img.onerror = (error) => {
        console.error('Image load error:', error);
        URL.revokeObjectURL(svgUrl);
        alert('Ошибка при загрузке SVG изображения. Попробуйте еще раз.');
      };

      img.src = svgUrl;
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при экспорте диаграммы: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const renderLine = (variationId: string, index: number) => {
    const variation = chartData.variations.find(
      (v) => getVariationId(v) === variationId
    );
    const name = variation ? getVariationName(variation) : variationId;
    const variationIndex = chartData.variations.findIndex(
      (v) => getVariationId(v) === variationId
    );
    const colors = getColors(theme);
    const color = colors[variationIndex >= 0 ? variationIndex % colors.length : index % colors.length];

    if (lineStyle === 'bands') {
      return (
        <>
          <Line
            key={`${variationId}_band`}
            type="monotone"
            dataKey={variationId}
            stroke={color}
            strokeWidth={12}
            strokeOpacity={0.2}
            strokeLinecap="butt"
            strokeLinejoin="round"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            connectNulls
            name={`${name}_band`}
            legendType="none"
            clipPath="url(#chart-clip)"
          />
          {/* Тонкая основная линия */}
          <Line
            key={variationId}
            type="monotone"
            dataKey={variationId}
            stroke={color}
            strokeWidth={2}
            name={name}
            dot={false}
            activeDot={false}
            clipPath="url(#chart-clip)"
          />
        </>
      );
    }

    if (lineStyle === 'area') {
      return (
        <Area
          key={variationId}
          type="monotone"
          dataKey={variationId}
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
          name={name}
          dot={false}
          activeDot={false}
        />
      );
    }

    const lineType = lineStyle === 'smooth' ? 'monotone' : 'linear';
    
    return (
      <Line
        key={variationId}
        type={lineType}
        dataKey={variationId}
        stroke={color}
        strokeWidth={2}
        name={name}
        dot={false}
        activeDot={{ r: 6 }}
      />
    );
  };

  const getChartComponent = () => {
    if (lineStyle === 'bands') return ComposedChart;
    if (lineStyle === 'area') return AreaChart;
    return LineChart;
  };
  const ChartComponent = getChartComponent();

  const allSelected = selectedVariations.length === variations.length;
  const selectedVariationsText = allSelected
    ? 'All variations selected'
    : `${selectedVariations.length} variation${selectedVariations.length > 1 ? 's' : ''} selected`;

  const lineStyleLabels: Record<LineStyle, string> = {
    line: 'line',
    smooth: 'smooth',
    area: 'area',
    bands: 'bands',
  };

  return (
    <div className={styles.chartContainer} ref={chartRef}>
      <div className={styles.controlsBar}>
        <div className={styles.leftControls}>
          <div className={styles.dropdown} data-dropdown="variations">
            <button
              className={styles.dropdownButton}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen((prev) => ({
                  ...prev,
                  variations: !prev.variations,
                  timeRange: false,
                  lineStyle: false,
                }));
              }}
            >
              <span>{selectedVariationsText}</span>
              <ArrowDownIcon className={styles.arrow} width={14} height={14} />
            </button>
            {dropdownOpen.variations && (
              <div className={styles.dropdownMenu}>
                {variations.map((variation, index) => {
                  const variationId = getVariationId(variation);
                  const isSelected = selectedVariations.includes(variationId);
                  const colors = getColors(theme);
                  const color = colors[index % colors.length];

                  return (
                    <label
                      key={variationId}
                      className={styles.dropdownItem}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          onVariationToggle(variationId);
                        }}
                        disabled={isSelected && selectedVariations.length === 1}
                      />
                      <span
                        className={styles.colorDot}
                        style={{ backgroundColor: color }}
                      />
                      <span>{getVariationName(variation)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.dropdown} data-dropdown="timeRange">
            <button
              className={styles.dropdownButton}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen((prev) => ({
                  ...prev,
                  timeRange: !prev.timeRange,
                  variations: false,
                  lineStyle: false,
                }));
              }}
            >
              <span>
                {timeRange === 'day' ? 'Day' : timeRange === 'week' ? 'Week' : 'Month'}
              </span>
              <ArrowDownIcon className={styles.arrow} width={14} height={14} />
            </button>
            {dropdownOpen.timeRange && (
              <div className={styles.dropdownMenu}>
                <button
                  className={`${styles.dropdownMenuItem} ${timeRange === 'day' ? styles.active : ''}`}
                  onClick={() => {
                    onTimeRangeChange('day');
                    setDropdownOpen((prev) => ({ ...prev, timeRange: false }));
                  }}
                >
                  Day {timeRange === 'day' && <span className={styles.checkmark}>✓</span>}
                </button>
                <button
                  className={`${styles.dropdownMenuItem} ${timeRange === 'week' ? styles.active : ''}`}
                  onClick={() => {
                    onTimeRangeChange('week');
                    setDropdownOpen((prev) => ({ ...prev, timeRange: false }));
                  }}
                >
                  Week {timeRange === 'week' && <span className={styles.checkmark}>✓</span>}
                </button>
                <button
                  className={`${styles.dropdownMenuItem} ${timeRange === 'month' ? styles.active : ''}`}
                  onClick={() => {
                    onTimeRangeChange('month');
                    setDropdownOpen((prev) => ({ ...prev, timeRange: false }));
                  }}
                >
                  Month {timeRange === 'month' && <span className={styles.checkmark}>✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightControls}>
          <div className={styles.dropdown} data-dropdown="lineStyle">
            <button
              className={styles.dropdownButton}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen((prev) => ({
                  ...prev,
                  lineStyle: !prev.lineStyle,
                  variations: false,
                  timeRange: false,
                }));
              }}
            >
              <span>Line style: {lineStyleLabels[lineStyle]}</span>
              <ArrowDownIcon className={styles.arrow} width={14} height={14} />
            </button>
            {dropdownOpen.lineStyle && (
              <div className={styles.dropdownMenu}>
                <button
                  className={`${styles.dropdownMenuItem} ${lineStyle === 'line' ? styles.active : ''}`}
                  onClick={() => {
                    onLineStyleChange('line');
                    setDropdownOpen((prev) => ({ ...prev, lineStyle: false }));
                  }}
                >
                  line {lineStyle === 'line' && <span className={styles.checkmark}>✓</span>}
                </button>
                <button
                  className={`${styles.dropdownMenuItem} ${lineStyle === 'smooth' ? styles.active : ''}`}
                  onClick={() => {
                    onLineStyleChange('smooth');
                    setDropdownOpen((prev) => ({ ...prev, lineStyle: false }));
                  }}
                >
                  smooth {lineStyle === 'smooth' && <span className={styles.checkmark}>✓</span>}
                </button>
                <button
                  className={`${styles.dropdownMenuItem} ${lineStyle === 'area' ? styles.active : ''}`}
                  onClick={() => {
                    onLineStyleChange('area');
                    setDropdownOpen((prev) => ({ ...prev, lineStyle: false }));
                  }}
                >
                  area {lineStyle === 'area' && <span className={styles.checkmark}>✓</span>}
                </button>
                <button
                  className={`${styles.dropdownMenuItem} ${lineStyle === 'bands' ? styles.active : ''}`}
                  onClick={() => {
                    onLineStyleChange('bands');
                    setDropdownOpen((prev) => ({ ...prev, lineStyle: false }));
                  }}
                >
                  bands {lineStyle === 'bands' && <span className={styles.checkmark}>✓</span>}
                </button>
              </div>
            )}
          </div>

          <div className={styles.zoomControls}>
            <button
              className={`${styles.zoomButton} ${styles.panningButton} ${panMode ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPanMode(!panMode);
              }}
              title="Режим панорамирования"
            >
              <PanningBtnIcon width={16} height={16} />
            </button>
            <div className={styles.zoomButtonsGroup}>
              <button
                className={styles.zoomButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoomLevel(prev => Math.max(0.5, prev - 0.1));
                }}
                title="Уменьшить масштаб"
                disabled={zoomLevel <= 0.5}
              >
                <MinusIcon width={16} height={16} />
              </button>
              <button
                className={styles.zoomButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoomLevel(prev => Math.min(3, prev + 0.1));
                }}
                title="Увеличить масштаб"
                disabled={zoomLevel >= 3}
              >
                <PlusIcon width={16} height={16} />
              </button>
            </div>
            <button
              className={`${styles.zoomButton} ${styles.refreshButton}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setZoomLevel(1);
                setPanMode(false);
                onZoomToggle(false);
              }}
              title="Сбросить"
            >
              <RefreshIcon width={16} height={16} />
            </button>
            <button
              className={styles.zoomButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExport();
              }}
              title="Экспорт диаграммы в PNG"
            >
              <DownloadIcon width={16} height={16} />
            </button>
            <button
              className={styles.zoomButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onThemeToggle();
              }}
              title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
            >
              {theme === 'light' ? <DarkIcon width={16} height={16} /> : <LightIcon width={16} height={16} />}
            </button>
          </div>
        </div>
      </div>

      <div 
        className={styles.chartWrapper} 
        style={{ 
          width: '100%', 
          height: '600px', 
          position: 'relative', 
          cursor: panMode ? 'grab' : 'default',
          overflow: panMode ? 'auto' : 'hidden'
        }}
      >
      <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: `${100 / zoomLevel}%`, height: `${600 / zoomLevel}px` }}>
      <ResponsiveContainer width="100%" height={600} style={{ overflow: 'visible' }}>
        <ChartComponent
          data={processedData}
          margin={{ top: 50, right: 60, left: 50, bottom: 50 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <clipPath id="chart-clip">
              <rect x="50" y="50" width="calc(100% - 110px)" height="calc(100% - 100px)" />
            </clipPath>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#c7c5d0" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value, timeRange)}
            stroke="#c7c5d0"
            tick={{ fill: '#c7c5d0' }}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[min, max]}
            tickFormatter={(value) => formatPercentage(value, 1)}
            stroke="#c7c5d0"
            tick={{ fill: '#c7c5d0' }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            content={
              <CustomTooltip
                chartData={chartData}
                timeRange={timeRange}
                calculateConversionRate={calculateConversionRate}
              />
            }
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span style={{ color: 'var(--text-primary)' }}>{value}</span>
            )}
            payload={selectedVariations.map((variationId, index) => {
              const variation = chartData.variations.find(
                (v) => getVariationId(v) === variationId
              );
              const name = variation ? getVariationName(variation) : variationId;
              const variationIndex = chartData.variations.findIndex(
                (v) => getVariationId(v) === variationId
              );
              const colors = getColors(theme);
    const color = colors[variationIndex >= 0 ? variationIndex % colors.length : index % colors.length];
              return {
                value: name,
                type: lineStyle === 'area' || lineStyle === 'bands' ? 'line' : 'line',
                color: color,
                id: variationId,
              };
            })}
          />
          {activeIndex !== null && processedData[activeIndex] && (
            <ReferenceLine
              x={processedData[activeIndex].date}
              stroke="#c7c5d0"
              strokeDasharray="2 2"
              strokeOpacity={0.5}
            />
          )}
          {selectedVariations.map((variationId, index) => (
            <React.Fragment key={variationId}>
              {renderLine(variationId, index)}
            </React.Fragment>
          ))}
          {zoomEnabled && (
            <Brush
              dataKey="date"
              height={30}
              stroke="var(--accent-color)"
              tickFormatter={(value) => formatDate(value, timeRange)}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
