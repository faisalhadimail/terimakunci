import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json } from '@/lib/api-helpers'

// ============ GET - Sitemap statistics ============
export async function GET() {
  try {
    const [publishedProperties, publishedArticles, activeAgents] = await Promise.all([
      db.property.count({
        where: {
          isPublished: true,
          deletedAt: null,
        },
      }),
      db.article.count({
        where: {
          isPublished: true,
          deletedAt: null,
        },
      }),
      db.agentProfile.count({
        where: { isActive: true },
      }),
    ])

    const featuredProperties = await db.property.count({
      where: {
        isPublished: true,
        deletedAt: null,
        isFeatured: true,
      },
    })

    const staticPages = 5 // home, properties, articles, agents, contact
    const totalUrls = staticPages + publishedProperties + publishedArticles + activeAgents

    return json({
      data: {
        totalUrls,
        staticPages,
        publishedProperties,
        featuredProperties,
        publishedArticles,
        activeAgents,
      },
    })
  } catch (error) {
    console.error('[Sitemap Stats Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch sitemap stats.' },
      { status: 500 }
    )
  }
}
