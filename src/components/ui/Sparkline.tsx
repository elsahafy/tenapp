import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#3B82F6',
  className
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up the canvas
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Clear the canvas
    ctx.clearRect(0, 0, width, height)

    // Calculate the points
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - Math.min(...data)) / (Math.max(...data) - Math.min(...data))) * height
    }))

    // Draw the line
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2
      const yc = (points[i].y + points[i - 1].y) / 2
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)

    // Style the line
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Add gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${color}20`)
    gradient.addColorStop(1, `${color}05`)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.fillStyle = gradient
    ctx.fill()
  }, [data, width, height, color])

  return (
    <canvas
      ref={canvasRef}
      className={cn('rounded', className)}
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  )
}
