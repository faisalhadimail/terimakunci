import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - Dashboard statistics ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const result = await tryCatch(async () => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Property counts
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
    ] = await Promise.all([
      db.property.count({ where: { deletedAt: null } }),
      db.property.count({
        where: {
          deletedAt: null,
          isPublished: true,
          status: { in: ['dijual', 'disewa'] },
        },
      }),
      db.property.count({
        where: { deletedAt: null, status: 'draft' },
      }),
      db.property.count({
        where: { deletedAt: null, status: 'terjual' },
      }),
      db.property.count({
        where: { deletedAt: null, status: 'tersewa' },
      }),
      db.lead.count({ where: { deletedAt: null } }),
      db.lead.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfDay },
        },
      }),
      db.lead.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
      }),
      db.article.count({
        where: {
          deletedAt: null,
          isPublished: true,
        },
      }),
    ])

    // Leads grouped by status
    const leadsByStatusRaw = await db.lead.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { status: true },
    })
    const leadsByStatus = leadsByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }))

    // Leads grouped by source
    const leadsBySourceRaw = await db.lead.groupBy({
      by: ['source'],
      where: { deletedAt: null },
      _count: { source: true },
    })
    const leadsBySource = leadsBySourceRaw.map((item) => ({
      source: item.source,
      count: item._count.source,
    }))

    // Top viewed properties
    const topViewedProperties = await db.property.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        priceDisplay: true,
        status: true,
        mainImage: true,
        city: { select: { name: true } },
        propertyType: { select: { name: true } },
        _count: { select: { leads: true } },
      },
    })

    // Top viewed articles
    const topViewedArticles = await db.article.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        featuredImage: true,
        createdAt: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
    })

    // Leads per month (last 6 months)
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const leadsPerMonthRaw = await db.lead.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
      },
    })

    const leadsPerMonthMap: Record<string, number> = {}
    for (const lead of leadsPerMonthRaw) {
      const month = lead.createdAt.toISOString().slice(0, 7) // YYYY-MM
      leadsPerMonthMap[month] = (leadsPerMonthMap[month] || 0) + 1
    }

    const leadsPerMonth = []
    const monthIter = new Date(sixMonthsAgo)
    while (monthIter <= now) {
      const key = monthIter.toISOString().slice(0, 7)
      leadsPerMonth.push({
        month: key,
        count: leadsPerMonthMap[key] || 0,
      })
      monthIter.setMonth(monthIter.getMonth() + 1)
    }

    // Listings per month (last 6 months)
    const listingsPerMonthRaw = await db.property.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
      },
    })

    const listingsPerMonthMap: Record<string, number> = {}
    for (const prop of listingsPerMonthRaw) {
      const month = prop.createdAt.toISOString().slice(0, 7)
      listingsPerMonthMap[month] = (listingsPerMonthMap[month] || 0) + 1
    }

    const listingsPerMonth = []
    const listingMonthIter = new Date(sixMonthsAgo)
    while (listingMonthIter <= now) {
      const key = listingMonthIter.toISOString().slice(0, 7)
      listingsPerMonth.push({
        month: key,
        count: listingsPerMonthMap[key] || 0,
      })
      listingMonthIter.setMonth(listingMonthIter.getMonth() + 1)
    }

    return {
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
  })

  if (result instanceof Response) return result

  return json(result.data)
}
