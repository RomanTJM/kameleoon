import { useState, useEffect } from 'react';
import { ChartData } from './types';
import Chart from './components/Chart/Chart';
import Controls from './components/Controls/Controls';
import { getVariationId } from './utils/dataProcessor';
import data from '../data.json';
import styles from './App.module.css';

function App() {
  const chartData = data as ChartData;
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week'>('day');
  const [lineStyle, setLineStyle] = useState<'line' | 'smooth' | 'area'>('line');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [zoomEnabled, setZoomEnabled] = useState(false);

  useEffect(() => {
    if (selectedVariations.length === 0 && chartData.variations.length > 0) {
      setSelectedVariations([getVariationId(chartData.variations[0])]);
    }
  }, [chartData.variations]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleVariationToggle = (variationId: string) => {
    setSelectedVariations((prev) => {
      if (prev.includes(variationId)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((id) => id !== variationId);
      }
      return [...prev, variationId];
    });
  };

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <Chart
          chartData={chartData}
          selectedVariations={selectedVariations}
          timeRange={timeRange}
          lineStyle={lineStyle}
          zoomEnabled={zoomEnabled}
          variations={chartData.variations}
          onVariationToggle={handleVariationToggle}
          onTimeRangeChange={setTimeRange}
          onLineStyleChange={setLineStyle}
          onZoomToggle={setZoomEnabled}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
      </main>
    </div>
  );
}

export default App;

