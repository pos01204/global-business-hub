/**
 * RadarChart - 레이더 차트 컴포넌트
 * v4.3: Business Brain 시각화 개선
 */

'use client'

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

export interface RadarChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
    fillColor?: string
  }[]
  max?: number
}

interface RadarChartProps {
  data: RadarChartData
  height?: number
  showLegend?: boolean
}

export function RadarChart({ 
  data, 
  height = 400, 
  showLegend = true
}: RadarChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(d => ({
      label: d.label,
      data: d.data,
      borderColor: d.color,
      backgroundColor: d.fillColor || `${d.color}40`,
      borderWidth: 2,
      pointBackgroundColor: d.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
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
      r: {
        beginAtZero: true,
        max: data.max || 100,
        ticks: {
          stepSize: data.max ? data.max / 5 : 20,
          font: { size: 11 },
          color: '#64748b',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
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
      <Radar data={chartData} options={options} />
    </div>
  )
}

