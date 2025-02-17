import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import {
  AchievementService,
  AchievementProgress,
} from '@/lib/services/achievementService'
import type { Database } from '@/lib/types/database'

import {
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

interface Achievement {
  id: string
  name: string
  description: string
  category: string
  points: number
  requirements: { [key: string]: any }
  icon_url: string
  created_at: string
  progress: number
}

interface AchievementDisplayProps {
  userId: string
  showAll?: boolean
  className?: string
}

export default function AchievementDisplay({
  userId,
  showAll = false,
  className = '',
}: AchievementDisplayProps) {
  const { user } = useUser()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isOwnProfile = user?.id === userId

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true)
        setError(null)

        const achievementsData = await AchievementService.getAchievements()
        const userProgress = await AchievementService.getUserProgress(userId)

        const achievementsWithProgress = achievementsData.map(achievement => ({
          ...achievement,
          progress: userProgress.find(p => p.achievement_id === achievement.id)?.progress.current || 0
        }))

        setAchievements(achievementsWithProgress)
        const userStats = await AchievementService.getUserStats(userId)
        setStats(userStats)
      } catch (err) {
        console.error('Error loading achievements:', err)
        setError('Failed to load achievements')
      } finally {
        setLoading(false)
      }
    }

    loadAchievements()
  }, [userId, showAll])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">{error}</div>
    )
  }

  const renderAchievementIcon = (achievement: Achievement) => {
    const icons = {
      budgeting: ChartBarIcon,
      savings: StarIcon,
      debt: TrophyIcon,
    }
    
    const IconComponent = icons[achievement.category as keyof typeof icons] || TrophyIcon
    return <IconComponent className="h-6 w-6" />
  }

  return (
    <div className={className}>
      {/* Achievement Stats */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Achievement Progress
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Completed</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.completed_achievements}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Available</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.total_achievements}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Points Earned</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.total_points_earned}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Categories</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {Object.keys(stats.achievements_by_category).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {showAll ? 'All Achievements' : 'Next Achievements'}
          </h2>
          {!showAll && isOwnProfile && (
            <button
              onClick={() => window.location.href = '/achievements'}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          )}
        </div>
        <div className="space-y-6">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {achievement.progress === 100 ? (
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <StarIcon className="h-6 w-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <LockClosedIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900">
                      {achievement.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {achievement.points} points
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    Progress
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {Math.round(achievement.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  Requirements
                </h4>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(achievement.requirements).map(
                      ([key, value]) => (
                        <li key={key} className="capitalize">
                          {key.replace('_', ' ')}: {value}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      {stats && showAll && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Achievement Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.achievements_by_category).map(
              ([category, count]) => (
                <div
                  key={category}
                  className="border rounded-lg p-4 text-center"
                >
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {category.replace('_', ' ')}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-blue-600">
                    {count as number}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
