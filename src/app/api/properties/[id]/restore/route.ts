import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonNotFound, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ POST - Restore soft-deleted property ============
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const { id } = await params

  const result = await tryCatch(async () => {
    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) return null
    if (!existing.deletedAt) return existing

    return db.property.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        propertyType: true,
        city: true,
        district: true,
        village: true,
        agent: { select: { id: true, name: true, phone: true, avatar: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Property not found')

  return json({ data: result.data, message: 'Property restored successfully.' })
}
