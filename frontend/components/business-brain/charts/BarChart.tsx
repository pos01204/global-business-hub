/**
 * BarChart - 바 차트 컴포넌트
 * v4.3: Business Brain 시각화 개선
 */

'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export interface BarChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
}

interface BarChartProps {
  data: BarChartData
  height?: number
  horizontal?: boolean
  stacked?: boolean
  showLegend?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
  onDataPointClick?: (point: { label: string; value: number; dataset: string; index: number }) => void
  onDrillDown?: (filter: { label: string; value: number }) => void
}

export function BarChart({ 
  data, 
  height = 256, 
  horizontal = false, 
  stacked = false,
  showLegend = true,
  yAxisLabel,
  xAxisLabel,
  onDataPointClick,
  onDrillDown
}: BarChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(d => ({
      label: d.label,
      data: d.data,
      backgroundColor: d.color,
      borderRadius: 6,
      borderSkipped: false,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        stacked,
        beginAtZero: true,
        grid: { 
          display: true, 
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          font: { size: 12 },
          color: '#64748b',
        },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: { 
          display: true, 
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { size: 12 },
          color: '#64748b',
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

