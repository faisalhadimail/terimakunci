import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, requireAuth, tryCatch } from '@/lib/api-helpers'

// Simple in-memory cache for dashboard (refreshes every 30s)
let dashCache: { data: unknown; time: number } | null = null
const DASH_CACHE_TTL = 30_000

// ============ GET - Dashboard statistics ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  // Return cached result if fresh
  const now = Date.now()
  if (dashCache && now - dashCache.time < DASH_CACHE_TTL) {
    return json(dashCache.data)
  }

  const result = await tryCatch(async () => {
    const nowDate = new Date()
    const startOfDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())
    const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)

    // Six months ago (first day)
    const sixMonthsAgo = new Date(nowDate)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    // === All queries in parallel ===
    const [
      totalProperties,
      activeProperties,
      draftProperties,
      soldProperties,
      rentedProperties,
      totalLeads,
      newLeadsToday,
      newLeadsThisMonth,
      publishedArticles,
      leadsByStatusRaw,
      leadsBySourceRaw,
      topViewedProperties,
      topViewedArticles,
      leadsPerMonthRaw,
      listingsPerMonthRaw,
    ] = await Promise.all([
      // --- Counts ---
      db.property.count({ where: { deletedAt: null } }),
      db.property.count({
        where: { deletedAt: null, isPublished: true, status: { in: ['dijual', 'disewa'] } },
      }),
      db.property.count({ where: { deletedAt: null, status: 'draft' } }),
      db.property.count({ where: { deletedAt: null, status: 'terjual' } }),
      db.property.count({ where: { deletedAt: null, status: 'tersewa' } }),
      db.lead.count({ where: { deletedAt: null } }),
      db.lead.count({ where: { deletedAt: null, createdAt: { gte: startOfDay } } }),
      db.lead.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      db.article.count({ where: { deletedAt: null, isPublished: true } }),

      // --- Group by ---
      db.lead.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { status: true } }),
      db.lead.groupBy({ by: ['source'], where: { deletedAt: null }, _count: { source: true } }),

      // --- Top items ---
      db.property.findMany({
        where: { deletedAt: null, isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, title: true, slug: true, price: true, priceDisplay: true,
          status: true, mainImage: true,
          city: { select: { name: true } },
          propertyType: { select: { name: true } },
          _count: { select: { leads: true } },
        },
      }),
      db.article.findMany({
        where: { deletedAt: null, isPublished: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true, title: true, slug: true, viewCount: true, featuredImage: true, createdAt: true,
          category: { select: { name: true } },
          author: { select: { name: true } },
        },
      }),

      // --- Monthly aggregations via raw SQL (much faster than findMany + JS grouping) ---
      db.$queryRaw<{ month: string; count: number }[]>`
        SELECT strftime('%Y-%m', "createdAt") AS month, COUNT(*) AS count
        FROM Lead
        WHERE "deletedAt" IS NULL AND "createdAt" >= ${sixMonthsAgo}
        GROUP BY strftime('%Y-%m', "createdAt")
        ORDER BY month
      `,
      db.$queryRaw<{ month: string; count: number }[]>`
        SELECT strftime('%Y-%m', "createdAt") AS month, COUNT(*) AS count
        FROM Property
        WHERE "deletedAt" IS NULL AND "createdAt" >= ${sixMonthsAgo}
        GROUP BY strftime('%Y-%m', "createdAt")
        ORDER BY month
      `,
    ])

    // Map groupBy results
    const leadsByStatus = leadsByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }))
    const leadsBySource = leadsBySourceRaw.map((item) => ({
      source: item.source,
      count: item._count.source,
    }))

    // Fill missing months from raw SQL results
    const monthKeys: string[] = []
    const mIter = new Date(sixMonthsAgo)
    while (mIter <= nowDate) {
      monthKeys.push(mIter.toISOString().slice(0, 7))
      mIter.setMonth(mIter.getMonth() + 1)
    }

    const rawToMonthly = (raw: { month: string; count: number }[]) => {
      const map = new Map(raw.map((r) => [r.month, r.count]))
      return monthKeys.map((month) => ({ month, count: Number(map.get(month) || 0) }))
    }

    const leadsPerMonth = rawToMonthly(leadsPerMonthRaw)
    const listingsPerMonth = rawToMonthly(listingsPerMonthRaw)

    const data = {
      totalProperties,
      activeProperties,
      draftProperties,
      soldProperties,
      rentedProperties,
      totalLeads,
      newLeadsToday,
      newLeadsThisMonth,
      leadsByStatus,
      leadsBySource,
      publishedArticles,
      topViewedProperties,
      topViewedArticles,
      leadsPerMonth,
      listingsPerMonth,
    }

    // Cache the result
    dashCache = { data, time: Date.now() }

    return data
  })

  if (result instanceof Response) return result

  return json(result.data)
}
