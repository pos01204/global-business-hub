/**
 * LineChart - 라인 차트 컴포넌트
 * v4.3: Business Brain 시각화 개선
 */

'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface LineChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
    fill?: boolean
    borderDash?: number[]
  }[]
}

interface LineChartProps {
  data: LineChartData
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
}

export function LineChart({ 
  data, 
  height = 256, 
  showLegend = true, 
  showGrid = true,
  yAxisLabel,
  xAxisLabel
}: LineChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(d => ({
      label: d.label,
      data: d.data,
      borderColor: d.color,
      backgroundColor: d.fill ? `${d.color}20` : 'transparent',
      fill: d.fill,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: d.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      borderDash: d.borderDash,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
      y: {
        beginAtZero: true,
        grid: { 
          display: showGrid, 
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
      x: {
        grid: { 
          display: showGrid, 
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
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

