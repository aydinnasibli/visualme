'use server'

import { connectToDatabase } from '@/lib/database/mongodb'
import { UserModel, VisualizationModel, UserUsageModel } from '@/lib/database/models'
import { checkRole } from '@/lib/utils/roles'
import { sanitizeError, validateObjectId } from '@/lib/utils/validation'
import { updateUserTier } from '@/lib/utils/tokens'

async function requireAdmin() {
  const isAdmin = await checkRole('admin')
  if (!isAdmin) throw new Error('Unauthorized')
}

const PAGE_SIZE = 20

export type AdminUser = {
  _id: string
  clerkId: string
  email?: string
  firstName?: string
  lastName?: string
  plan: 'free' | 'pro' | 'enterprise'
  usageCount: number
  savedVisualizationsCount: number
  createdAt: string
  tokensUsed?: number
  tokensLimit?: number
  tier?: string
}

export type AdminVisualization = {
  _id: string
  userId: string
  title: string
  isPublic: boolean
  createdAt: string
}

export type AdminStats = {
  totalUsers: number
  totalVisualizations: number
  newUsersThisMonth: number
  newVizsThisMonth: number
  planDistribution: { _id: string; count: number }[]
  recentUsers: {
    _id: string
    clerkId: string
    email?: string
    firstName?: string
    lastName?: string
    plan: string
    savedVisualizationsCount: number
    createdAt: string
  }[]
  recentVisualizations: AdminVisualization[]
}

export async function getAdminStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
  try {
    await requireAdmin()
    await connectToDatabase()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      totalVisualizations,
      newUsersThisMonth,
      newVizsThisMonth,
      planDistribution,
      recentUsers,
      recentVisualizations,
    ] = await Promise.all([
      UserModel.countDocuments(),
      VisualizationModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      VisualizationModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      UserModel.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      UserModel.find()
        .select('clerkId email firstName lastName plan savedVisualizations createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      VisualizationModel.find()
        .select('_id userId title type isPublic createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])

    return {
      success: true,
      data: {
        totalUsers,
        totalVisualizations,
        newUsersThisMonth,
        newVizsThisMonth,
        planDistribution: planDistribution as { _id: string; count: number }[],
        recentUsers: recentUsers.map(u => ({
          _id: u._id.toString(),
          clerkId: u.clerkId,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          plan: u.plan,
          savedVisualizationsCount: u.savedVisualizations?.length ?? 0,
          createdAt: new Date(u.createdAt).toISOString(),
        })),
        recentVisualizations: recentVisualizations.map(v => ({
          _id: v._id.toString(),
          userId: v.userId,
          title: v.title,
          isPublic: v.isPublic,
          createdAt: new Date(v.createdAt).toISOString(),
        })),
      },
    }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to fetch stats') }
  }
}

export async function getAdminUsers({
  page = 1,
  search = '',
  plan,
}: {
  page?: number
  search?: string
  plan?: 'free' | 'pro' | 'enterprise'
} = {}): Promise<{
  success: boolean
  data?: { users: AdminUser[]; total: number; page: number; totalPages: number }
  error?: string
}> {
  try {
    await requireAdmin()
    await connectToDatabase()

    const matchQuery: Record<string, unknown> = {}
    if (plan) matchQuery.plan = plan
    if (search) {
      matchQuery.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ]
    }

    const [users, total] = await Promise.all([
      UserModel.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * PAGE_SIZE },
        { $limit: PAGE_SIZE },
        {
          $lookup: {
            from: 'userusages',
            localField: 'clerkId',
            foreignField: 'userId',
            as: 'usageData',
          },
        },
        { $addFields: { usageData: { $arrayElemAt: ['$usageData', 0] } } },
        {
          $project: {
            clerkId: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
            plan: 1,
            usageCount: 1,
            createdAt: 1,
            savedVisualizationsCount: { $size: { $ifNull: ['$savedVisualizations', []] } },
            tokensUsed: '$usageData.tokensUsed',
            tokensLimit: '$usageData.tokensLimit',
            tier: '$usageData.tier',
          },
        },
      ]),
      UserModel.countDocuments(matchQuery),
    ])

    return {
      success: true,
      data: {
        users: users.map(u => ({
          ...u,
          _id: u._id.toString(),
          createdAt: new Date(u.createdAt).toISOString(),
        })) as AdminUser[],
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to fetch users') }
  }
}

export async function getAdminUserById(clerkId: string): Promise<{
  success: boolean
  data?: {
    user: {
      _id: string
      clerkId: string
      email?: string
      firstName?: string
      lastName?: string
      imageUrl?: string
      plan: string
      usageCount: number
      createdAt: string
      updatedAt: string
      lastLoginAt: string | null
      extendedNodesCount: number
      savedVisualizationsCount: number
    }
    usage: {
      tokensUsed: number
      tokensLimit: number
      tier: string
      tokenResetDate: string
      visualizationsCreated: number
    } | null
    totalVisualizations: number
    recentVisualizations: AdminVisualization[]
  }
  error?: string
}> {
  try {
    await requireAdmin()
    await connectToDatabase()

    const [user, usage, totalVisualizations] = await Promise.all([
      UserModel.findOne({ clerkId }).lean(),
      UserUsageModel.findOne({ userId: clerkId }).lean(),
      VisualizationModel.countDocuments({ userId: clerkId }),
    ])

    if (!user) return { success: false, error: 'User not found' }

    const recentVisualizations = await VisualizationModel
      .find({ userId: clerkId })
      .select('_id title type isPublic createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return {
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          plan: user.plan,
          usageCount: user.usageCount,
          createdAt: new Date(user.createdAt).toISOString(),
          updatedAt: new Date(user.updatedAt).toISOString(),
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
          extendedNodesCount: user.extendedNodes?.length ?? 0,
          savedVisualizationsCount: user.savedVisualizations?.length ?? 0,
        },
        usage: usage
          ? {
              tokensUsed: usage.tokensUsed,
              tokensLimit: usage.tokensLimit,
              tier: usage.tier,
              tokenResetDate: new Date(usage.tokenResetDate).toISOString(),
              visualizationsCreated: usage.visualizationsCreated,
            }
          : null,
        totalVisualizations,
        recentVisualizations: recentVisualizations.map(v => ({
          _id: v._id.toString(),
          userId: clerkId,
          title: v.title,
          isPublic: v.isPublic,
          createdAt: new Date(v.createdAt).toISOString(),
        })),
      },
    }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to fetch user') }
  }
}

export async function adminUpdateUserPlan(
  targetClerkId: string,
  plan: 'free' | 'pro' | 'enterprise'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    await connectToDatabase()

    await Promise.all([
      UserModel.findOneAndUpdate({ clerkId: targetClerkId }, { plan }),
      updateUserTier(targetClerkId, plan),
    ])

    return { success: true }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to update plan') }
  }
}

export async function adminDeleteVisualization(
  vizId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const idValidation = validateObjectId(vizId)
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }

    await connectToDatabase()

    const viz = await VisualizationModel.findByIdAndDelete(vizId)
    if (!viz) return { success: false, error: 'Visualization not found' }

    await UserModel.findOneAndUpdate(
      { clerkId: viz.userId },
      { $pull: { savedVisualizations: vizId } }
    )

    return { success: true }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to delete visualization') }
  }
}

export async function getAdminVisualizations({
  page = 1,
  search = '',
}: {
  page?: number
  search?: string
} = {}): Promise<{
  success: boolean
  data?: { visualizations: AdminVisualization[]; total: number; page: number; totalPages: number }
  error?: string
}> {
  try {
    await requireAdmin()
    await connectToDatabase()

    const matchQuery: Record<string, unknown> = {}
    if (search) matchQuery.title = { $regex: search, $options: 'i' }

    const [visualizations, total] = await Promise.all([
      VisualizationModel.find(matchQuery)
        .select('_id userId title isPublic createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      VisualizationModel.countDocuments(matchQuery),
    ])

    return {
      success: true,
      data: {
        visualizations: visualizations.map(v => ({
          _id: v._id.toString(),
          userId: v.userId,
          title: v.title,
          isPublic: v.isPublic,
          createdAt: new Date(v.createdAt).toISOString(),
        })),
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to fetch visualizations') }
  }
}

export type AnalyticsData = {
  vizByDay: { _id: string; count: number }[]
  userByPlan: { _id: string; count: number }[]
  tokenByTier: {
    _id: string
    avgUsed: number
    totalUsed: number
    totalLimit: number
    userCount: number
  }[]
}

export async function getAdminAnalytics(): Promise<{
  success: boolean
  data?: AnalyticsData
  error?: string
}> {
  try {
    await requireAdmin()
    await connectToDatabase()

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const [vizByDayRaw, userByPlan, tokenByTier] = await Promise.all([
      VisualizationModel.aggregate([
        { $match: { createdAt: { $gte: fourteenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      UserModel.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      UserUsageModel.aggregate([
        {
          $group: {
            _id: '$tier',
            avgUsed: { $avg: '$tokensUsed' },
            totalUsed: { $sum: '$tokensUsed' },
            totalLimit: { $sum: '$tokensLimit' },
            userCount: { $sum: 1 },
          },
        },
      ]),
    ])

    // Zero-fill every day in the range so the trend chart always shows a
    // continuous 14-day timeline instead of only the days with activity.
    const countByDay = new Map(
      (vizByDayRaw as { _id: string; count: number }[]).map(d => [d._id, d.count])
    )
    const vizByDay = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000)
      const key = date.toISOString().slice(0, 10)
      return { _id: key, count: countByDay.get(key) ?? 0 }
    })

    return {
      success: true,
      data: {
        vizByDay,
        userByPlan: userByPlan as { _id: string; count: number }[],
        tokenByTier: tokenByTier as AnalyticsData['tokenByTier'],
      },
    }
  } catch (error) {
    return { success: false, error: sanitizeError(error, 'Failed to fetch analytics') }
  }
}
