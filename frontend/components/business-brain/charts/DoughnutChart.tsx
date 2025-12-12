/**
 * DoughnutChart - 도넛 차트 컴포넌트
 * v4.3: Business Brain 시각화 개선
 */

'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

export interface DoughnutChartData {
  labels: string[]
  values: number[]
  colors: string[]
}

interface DoughnutChartProps {
  data: DoughnutChartData
  height?: number
  showCenterText?: boolean
  centerText?: string
  cutout?: string
  onClick?: (index: number) => void
}

export function DoughnutChart({ 
  data, 
  height = 256, 
  showCenterText = false,
  centerText,
  cutout = '70%',
  onClick
}: DoughnutChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.values,
      backgroundColor: data.colors,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    plugins: {
      legend: {
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
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value.toLocaleString()} (${percentage}%)`
          },
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onClick) {
        onClick(elements[0].index)
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  }

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
      {showCenterText && centerText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {centerText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

