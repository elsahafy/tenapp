'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export function MonthlyTrends() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('amount, type, date')
          .eq('user_id', user.id)
          .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())

        if (error) throw error

        const monthlyData = transactions.reduce((acc: any, transaction) => {
          const date = new Date(transaction.date)
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
          
          if (!acc[monthYear]) {
            acc[monthYear] = {
              income: 0,
              expenses: 0
            }
          }

          if (transaction.type === 'income') {
            acc[monthYear].income += transaction.amount
          } else if (transaction.type === 'expense') {
            acc[monthYear].expenses += transaction.amount
          }

          return acc
        }, {})

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
          const [monthA, yearA] = a.split('/')
          const [monthB, yearB] = b.split('/')
          return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() -
                 new Date(parseInt(yearB), parseInt(monthB) - 1).getTime()
        })

        setData({
          labels: sortedMonths,
          datasets: [
            {
              label: 'Income',
              data: sortedMonths.map(month => monthlyData[month].income),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
            },
            {
              label: 'Expenses',
              data: sortedMonths.map(month => monthlyData[month].expenses),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
            }
          ]
        })
      } catch (error) {
        console.error('Error fetching monthly trends:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data available</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            title: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value as number)
                }
              }
            }
          }
        }}
      />
    </div>
  )
}
