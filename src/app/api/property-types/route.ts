import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - List property types ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  // Admin (authenticated) sees all types; public sees only active ones
  const authUser = requireAuth(request)
  const isAdmin = !(authUser instanceof Response)

  const result = await tryCatch(async () => {
    return db.propertyType.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            properties: {
              where: isAdmin ? {} : { isPublished: true, deletedAt: null },
            },
          },
        },
      },
    })
  })

  if (result instanceof Response) return result

  return json({ data: result.data })
}

// ============ POST - Create property type (admin) ============
export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()
    const { name, icon, description, isActive, sortOrder } = body

    if (!name) {
      return json({ error: 'Name is required.' }, 400)
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const propertyType = await db.propertyType.create({
      data: {
        name,
        slug,
        icon: icon || null,
        description: description || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        _count: { select: { properties: true } },
      },
    })

    return json({ data: propertyType }, 201)
  } catch (error) {
    console.error('[Create PropertyType Error]', error)
    return json({ error: 'Failed to create property type.' }, 500)
  }
}
