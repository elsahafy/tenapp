import { useEffect, useRef } from 'react'
import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto'

interface PieChartProps {
  data: number[]
  labels: string[]
  colors: string[]
}

export function PieChart({ data, labels, colors }: PieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const chartData: ChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: colors.map(() => '#fff'),
        },
      ],
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${context.label}: ${percentage}%`
              },
            },
          },
        },
      },
    }

    chartInstance.current = new Chart(ctx, config)

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, labels, colors])

  return <canvas ref={chartRef} />
}
