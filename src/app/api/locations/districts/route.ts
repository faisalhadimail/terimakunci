import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - List districts (filter by cityId) ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get('cityId')

  if (!cityId) {
    return jsonError('cityId query parameter is required.', 400)
  }

  const result = await tryCatch(async () => {
    return db.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
      include: {
        city: { select: { id: true, name: true } },
        _count: {
          select: {
            villages: true,
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })
  })

  if (result instanceof Response) return result

  return json({ data: result.data })
}

// ============ POST - Create district (admin) ============
export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()
    const { name, cityId } = body

    if (!name) {
      return jsonError('District name is required.', 400)
    }
    if (!cityId) {
      return jsonError('cityId is required.', 400)
    }

    // Verify the city exists
    const city = await db.city.findUnique({ where: { id: cityId } })
    if (!city) {
      return jsonError('City not found.', 404)
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
    while (await db.district.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const district = await db.district.create({
      data: {
        name,
        slug,
        cityId,
      },
      include: {
        city: { select: { id: true, name: true } },
        _count: {
          select: {
            villages: true,
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })

    return json({ data: district }, 201)
  } catch (error) {
    console.error('[Create District Error]', error)
    return jsonError('Failed to create district.', 500)
  }
}
