import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import type { ChartOptions, Plugin } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../../contexts/AuthContext';
import { useMonthlyGlance } from '../../hooks/useMonthlyGlance';
import type { iMonthlyGlanceDataPoint } from '../../types/types';
import { isDesktop } from '../../utils/isDesktop';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const budget: number = 2000;

function buildSplitBackgroundPlugin(): Plugin {
  return {
    id: 'splitBackground',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;

      const el = document.documentElement;
      const teal = getComputedStyle(el).getPropertyValue('--teal-400').trim() || '#2dd4bf';
      const red = getComputedStyle(el).getPropertyValue('--red-200').trim() || '#fecaca';

      const budgetY = scales.y.getPixelForValue(budget);
      const { left, right, top, bottom } = chartArea;
      const width = right - left;

      ctx.save();

      ctx.fillStyle = hexOrVarToRgba(red, 0.2);
      ctx.fillRect(left, top, width, Math.max(0, budgetY - top));

      ctx.fillStyle = hexOrVarToRgba(teal, 0.2);
      ctx.fillRect(left, budgetY, width, Math.max(0, bottom - budgetY));

      ctx.restore();
    },
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;

      const el = document.documentElement;
      const teal = getComputedStyle(el).getPropertyValue('--teal-400').trim() || '#2dd4bf';
      const budgetY = scales.y.getPixelForValue(budget);

      ctx.save();
      ctx.font = '11px sans-serif';
      ctx.fillStyle = teal;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Budget', chartArea.right - 8, budgetY - 3);
      ctx.restore();
    },
  };
}

function hexOrVarToRgba(color: string, alpha: number): string {
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

function buildChartData(data: iMonthlyGlanceDataPoint[], primaryColor: string, tealColor: string) {
  return {
    labels: data.map((d) => parseInt(d.date.split('-')[2], 10).toString()),
    datasets: [
      {
        data: data.map((d) => d.cumulative),
        borderColor: primaryColor,
        backgroundColor: 'transparent',
        pointBackgroundColor: primaryColor,
        tension: 0.3,
        fill: false,
      },
      {
        data: data.map(() => budget),
        borderColor: tealColor,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 0,
        hitRadius: 10,
        tension: 0,
        fill: false,
      },
    ],
  };
}

function buildChartOptions(
  data: iMonthlyGlanceDataPoint[],
  isMobile: boolean,
  textColor: string,
): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Glance`,
        color: textColor,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: () => [],
          label(ctx) {
            if (ctx.datasetIndex === 1) {
              return `Budget: $${budget.toFixed(2)}`;
            }
            const point = data[ctx.dataIndex];
            return [
              `Date: ${point.date}`,
              `Spent today: $${point.daily.toFixed(2)}`,
              `Total so far: $${point.cumulative.toFixed(2)}`,
            ];
          },
        },
      },
    },
    interaction: { intersect: false, mode: 'nearest' },
    events: isMobile ? ['click'] : ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor },
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor },
        min: data.some((d) => d.cumulative < 0) ? undefined : 0,
      },
    },
  };
}

export default function MonthlyGlance() {
  const { user, isLoading: authLoading } = useAuth();
  const { status, data, retry } = useMonthlyGlance();

  if (authLoading || !user) {
    return <Skeleton className="monthly-glance__skeleton" />;
  }

  const splitPlugin = buildSplitBackgroundPlugin();
  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-color').trim();
  const primaryColor = styles.getPropertyValue('--primary-color').trim();
  const tealColor = styles.getPropertyValue('--teal-400').trim() || '#2dd4bf';

  return (
    <div className="monthly-glance">
      {(status === 'loading' || status === 'error') && (
        <div className="monthly-glance__mask">
          {status === 'loading' && (
            <ProgressSpinner aria-label="Loading Monthly Glance" />
          )}
          {status === 'error' && (
            <button className="monthly-glance__retry" onClick={retry} aria-label="Retry">
              <i className="pi pi-undo" />
              Retry
            </button>
          )}
        </div>
      )}
      {status === 'success' && (
        <div className="monthly-glance__chart-wrapper">
          <Line
            data={buildChartData(data, primaryColor, tealColor)}
            options={buildChartOptions(data, !isDesktop(), textColor)}
            plugins={[splitPlugin]}
          />
        </div>
      )}
    </div>
  );
}
