import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, tryCatch } from '@/lib/api-helpers'

// ============ GET - List villages (filter by districtId) ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { searchParams } = new URL(request.url)
  const districtId = searchParams.get('districtId')

  if (!districtId) {
    return jsonError('districtId query parameter is required.', 400)
  }

  const result = await tryCatch(async () => {
    return db.village.findMany({
      where: { districtId },
      orderBy: { name: 'asc' },
      include: {
        district: { select: { id: true, name: true } },
        _count: {
          select: {
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })
  })

  if (result instanceof Response) return result

  return json({ data: result.data })
}
