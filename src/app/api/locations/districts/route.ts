import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, tryCatch } from '@/lib/api-helpers'

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
