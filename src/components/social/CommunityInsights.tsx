import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import {
  SocialService,
  SharedInsight,
  InsightInteraction,
} from '@/lib/services/socialService'
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  ShareIcon,
  FunnelIcon,
  ChartBarIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'

interface InsightFilters {
  category?: string
  visibility?: SharedInsight['visibility']
  sortBy: 'recent' | 'popular'
}

export default function CommunityInsights() {
  const { user } = useUser()
  const [insights, setInsights] = useState<SharedInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<SharedInsight | null>(
    null
  )
  const [comments, setComments] = useState<InsightInteraction[]>([])
  const [newComment, setNewComment] = useState('')
  const [filters, setFilters] = useState<InsightFilters>({
    sortBy: 'recent',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInsights()
  }, [filters])

  useEffect(() => {
    if (selectedInsight) {
      loadComments(selectedInsight.id)
    }
  }, [selectedInsight])

  const loadInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const options: Parameters<typeof SocialService.getSharedInsights>[0] = {
        limit: 20
      }

      if (user?.id) {
        options.userId = user.id
      }

      if (filters.category) {
        options.category = filters.category
      }

      if (filters.visibility) {
        options.visibility = filters.visibility
      }

      const data = await SocialService.getSharedInsights(options)
      
      // Sort insights based on filter
      const sortedInsights = [...data].sort((a, b) => {
        if (filters.sortBy === 'popular') {
          const aScore = a.likes_count * 2 + a.comments_count
          const bScore = b.likes_count * 2 + b.comments_count
          return bScore - aScore
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setInsights(sortedInsights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (insightId: string) => {
    try {
      const comments = await SocialService.getInsightInteractions(insightId)
      setComments(comments.filter(interaction => interaction.type === 'comment'))
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleLike = async (insightId: string) => {
    if (!user?.id) return

    try {
      await SocialService.interactWithInsight(user.id, insightId, 'like')
      await loadInsights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like insight')
    }
  }

  const handleComment = async (insightId: string, comment: string) => {
    if (!user?.id) return

    try {
      await SocialService.interactWithInsight(user.id, insightId, 'comment', { comment })
      await loadInsights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  const getVisibilityIcon = (visibility: SharedInsight['visibility']) => {
    switch (visibility) {
      case 'public':
        return <GlobeAltIcon className="h-4 w-4" />
      case 'friends':
        return <UserGroupIcon className="h-4 w-4" />
      case 'private':
        return <LockClosedIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">{error}</div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filters.category || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  category: e.target.value || undefined,
                }))
              }
              className="text-sm border rounded-md"
            >
              <option value="">All Categories</option>
              <option value="budgeting">Budgeting</option>
              <option value="investing">Investing</option>
              <option value="saving">Saving</option>
              <option value="debt">Debt Management</option>
            </select>
            <select
              value={filters.visibility || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  visibility: (e.target.value as SharedInsight['visibility']) || undefined,
                }))
              }
              className="text-sm border rounded-md"
            >
              <option value="">All Visibility</option>
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as 'recent' | 'popular',
                }))
              }
              className="text-sm border rounded-md"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-6">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {insight.title}
                </h2>
                <div className="flex items-center mt-1 space-x-4">
                  <span className="text-sm text-gray-500">
                    by {insight.user_profile?.display_name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(insight.created_at)}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    {getVisibilityIcon(insight.visibility)}
                    <span className="ml-1 capitalize">
                      {insight.visibility}
                    </span>
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {insight.category}
              </span>
            </div>

            {/* Content */}
            <p className="mt-4 text-gray-600">{insight.description}</p>

            {/* Data Visualization */}
            {insight.data && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  Insight Data
                </h3>
                <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
                  {JSON.stringify(insight.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleLike(insight.id)}
                  className="flex items-center text-gray-500 hover:text-red-600"
                >
                  <HeartIcon className="h-5 w-5 mr-1" />
                  <span>{insight.likes_count}</span>
                </button>
                <button
                  onClick={() => setSelectedInsight(insight)}
                  className="flex items-center text-gray-500 hover:text-blue-600"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                  <span>{insight.comments_count}</span>
                </button>
                <button className="flex items-center text-gray-500 hover:text-green-600">
                  <ShareIcon className="h-5 w-5 mr-1" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {selectedInsight?.id === insight.id && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Comments
                </h3>
                {user && (
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-2 border rounded-md"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={() => handleComment(insight.id, newComment)}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                )}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {comment.user_profile?.display_name}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-600">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
