import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============ GET - Generate XML Sitemap ============
export async function GET(request: NextRequest) {
  try {
    // Get settings for base URL
    const settings = await db.websiteSetting.findMany({
      where: {
        key: {
          in: ['seo_canonical_url', 'seo_sitemap_changefreq', 'seo_sitemap_priority'],
        },
      },
    })

    const flat: Record<string, string> = {}
    for (const s of settings) {
      flat[s.key] = s.value
    }

    const baseUrl = flat.seo_canonical_url?.replace(/\/+$/, '') || 'https://www.terimakunci.com'
    const defaultChangefreq = flat.seo_sitemap_changefreq || 'weekly'
    const defaultPriority = flat.seo_sitemap_priority || '0.8'

    // Fetch all published properties
    const properties = await db.property.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
        isFeatured: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Fetch all published articles
    const articles = await db.article.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Fetch all active agents
    const agents = await db.agentProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const now = new Date().toISOString()

    // Build XML
    const urls: string[] = []

    // Helper to escape XML special characters
    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

    // Add URL entry
    const addUrl = (loc: string, changefreq: string, priority: string, lastmod?: string | Date | null) => {
      urls.push(
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod ? new Date(lastmod).toISOString() : now}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      )
    }

    // Static pages
    addUrl(`${baseUrl}/`, 'daily', '1.0', null) // Homepage - highest priority
    addUrl(`${baseUrl}/properties`, 'daily', '0.9', null)
    addUrl(`${baseUrl}/articles`, 'weekly', '0.8', null)
    addUrl(`${baseUrl}/agents`, 'weekly', '0.7', null)
    addUrl(`${baseUrl}/contact`, 'monthly', '0.5', null)

    // Property pages
    for (const prop of properties) {
      const priority = prop.isFeatured ? '0.9' : defaultPriority
      addUrl(`${baseUrl}/properties/${prop.slug}`, defaultChangefreq, priority, prop.updatedAt)
    }

    // Article pages
    for (const article of articles) {
      addUrl(`${baseUrl}/articles/${article.slug}`, 'weekly', '0.7', article.updatedAt)
    }

    // Agent pages
    for (const agent of agents) {
      addUrl(`${baseUrl}/agents/${agent.id}`, 'monthly', '0.6', agent.updatedAt)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[Sitemap Generation Error]', error)
    return NextResponse.json(
      { error: 'Failed to generate sitemap.' },
      { status: 500 }
    )
  }
}
