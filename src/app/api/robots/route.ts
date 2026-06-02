import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============ GET - Generate robots.txt ============
export async function GET(request: NextRequest) {
  try {
    // Get settings
    const settings = await db.websiteSetting.findMany({
      where: {
        key: {
          in: ['seo_canonical_url', 'seo_robots'],
        },
      },
    })

    const flat: Record<string, string> = {}
    for (const s of settings) {
      flat[s.key] = s.value
    }

    const baseUrl = flat.seo_canonical_url?.replace(/\/+$/, '') || 'https://www.terimakunci.com'
    const robotsMeta = flat.seo_robots || 'index, follow'

    // Parse robots meta to determine allow/disallow
    const disallowIndex = robotsMeta.toLowerCase().includes('noindex')

    const lines: string[] = []
    lines.push(`# robots.txt for TerimaKunci`)
    lines.push(`# Generated automatically by TerimaKunci CMS`)
    lines.push(`User-agent: *`)

    if (disallowIndex) {
      lines.push(`Disallow: /`)
    } else {
      lines.push(`Allow: /`)
      lines.push(`Disallow: /admin/`)
      lines.push(`Disallow: /api/`)
    }

    lines.push(``)
    lines.push(`# Sitemap`)
    lines.push(`Sitemap: ${baseUrl}/api/sitemap`)

    const text = lines.join('\n')

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('[Robots.txt Generation Error]', error)
    return NextResponse.json(
      { error: 'Failed to generate robots.txt.' },
      { status: 500 }
    )
  }
}
