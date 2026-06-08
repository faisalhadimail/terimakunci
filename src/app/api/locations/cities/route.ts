import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - List cities (optional filter by provinceId) ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { searchParams } = new URL(request.url)
  const provinceId = searchParams.get('provinceId')

  const result = await tryCatch(async () => {
    return db.city.findMany({
      where: provinceId ? { provinceId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        province: { select: { id: true, name: true } },
        _count: {
          select: {
            districts: true,
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })
  })

  if (result instanceof Response) return result
  return json({ data: result.data })
}

// ============ POST - Create city (admin) ============
export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()
    const { name, provinceId } = body

    if (!name) {
      return jsonError('City name is required.', 400)
    }

    // Auto-generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    let slug = baseSlug
    let suffix = 1
    while (await db.city.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const city = await db.city.create({
      data: {
        name,
        slug,
        provinceId: provinceId || 'default',
      },
      include: {
        province: { select: { id: true, name: true } },
        _count: {
          select: {
            districts: true,
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })

    return json({ data: city }, 201)
  } catch (error) {
    console.error('[Create City Error]', error)
    return jsonError('Failed to create city.', 500)
  }
}
